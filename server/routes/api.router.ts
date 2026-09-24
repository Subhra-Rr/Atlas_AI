import { Router, Request, Response } from 'express';
import { DatabaseAdapter } from '../db/database.interface.js';
import { AuthService } from '../auth/auth.service.js';
import { createAuthMiddleware, AuthenticatedRequest } from '../auth/auth.middleware.js';
import { IngestionService } from '../pipeline/ingestion.service.js';
import { SchedulerService } from '../pipeline/scheduler.service.js';
import { GeminiAtlasService } from '../ai/gemini.service.js';

export function createApiRouter(
  db: DatabaseAdapter,
  authService: AuthService,
  ingestionService: IngestionService,
  schedulerService: SchedulerService,
  geminiService: GeminiAtlasService
): Router {
  const router = Router();
  const { authenticate, optionalAuthenticate, requireRole } = createAuthMiddleware(authService);

  // Rate-limiting tracking (in-memory sliding window)
  const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
  const rateLimit = (maxRequests: number, windowMs: number) => {
    return (req: Request, res: Response, next: () => void) => {
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
      const now = Date.now();
      const record = rateLimitMap.get(ip);

      if (!record || now > record.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
        return next();
      }

      if (record.count >= maxRequests) {
        return res.status(429).json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please slow down.'
          }
        });
      }

      record.count++;
      next();
    };
  };

  // ==========================================
  // 1. Authentication Routes
  // ==========================================
  router.post('/auth/register', rateLimit(10, 60000), async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;
      const result = await authService.register(email, password, name);
      res.status(201).json({ data: result });
    } catch (err: any) {
      res.status(400).json({ error: { code: 'REGISTRATION_FAILED', message: err.message } });
    }
  });

  router.post('/auth/login', rateLimit(20, 60000), async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json({ data: result });
    } catch (err: any) {
      res.status(401).json({ error: { code: 'LOGIN_FAILED', message: err.message } });
    }
  });

  router.post('/auth/logout', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (req.token) await authService.logout(req.token);
      res.json({ data: { message: 'Logged out successfully' } });
    } catch (err: any) {
      res.status(500).json({ error: { code: 'LOGOUT_FAILED', message: err.message } });
    }
  });

  router.get('/auth/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    res.json({ data: req.user });
  });

  // ==========================================
  // 2. Geographic Entities Routes
  // ==========================================
  router.get('/geo/entities', optionalAuthenticate, async (req: Request, res: Response) => {
    try {
      const { type, parentId, search, bbox } = req.query;
      let parsedBbox: [number, number, number, number] | undefined;
      if (typeof bbox === 'string') {
        const parts = bbox.split(',').map(Number);
        if (parts.length === 4 && parts.every(p => !isNaN(p))) {
          parsedBbox = parts as [number, number, number, number];
        }
      }

      const entities = await db.getEntities({
        type: typeof type === 'string' ? type : undefined,
        parentId: typeof parentId === 'string' ? parentId : undefined,
        search: typeof search === 'string' ? search : undefined,
        bbox: parsedBbox
      });

      res.json({ data: entities });
    } catch (err: any) {
      res.status(500).json({ error: { code: 'GEO_FETCH_FAILED', message: err.message } });
    }
  });

  router.get('/geo/entities/:id', async (req: Request, res: Response) => {
    try {
      const entity = await db.getEntityById(req.params.id);
      if (!entity) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Geographic entity not found' } });
      }
      res.json({ data: entity });
    } catch (err: any) {
      res.status(500).json({ error: { code: 'GEO_FETCH_FAILED', message: err.message } });
    }
  });

  router.get('/geo/search', async (req: Request, res: Response) => {
    try {
      const term = typeof req.query.q === 'string' ? req.query.q : '';
      const results = await db.searchEntities(term);
      res.json({ data: results });
    } catch (err: any) {
      res.status(500).json({ error: { code: 'SEARCH_FAILED', message: err.message } });
    }
  });

  router.post('/geo/entities/:id/follow', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: { code: 'UNAUTHORIZED' } });
      const updated = await db.toggleFollowEntity(req.user.id, req.params.id);
      res.json({ data: { followedEntities: updated } });
    } catch (err: any) {
      res.status(500).json({ error: { code: 'FOLLOW_FAILED', message: err.message } });
    }
  });

  // ==========================================
  // 3. Domain Datasets Routes
  // ==========================================
  router.get('/data/:id/weather', async (req: Request, res: Response) => {
    try {
      const weather = await db.getWeather(req.params.id);
      if (!weather) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'No meteorological record for this entity' } });
      }
      res.json({ data: weather });
    } catch (err: any) {
      res.status(500).json({ error: { code: 'DATA_FETCH_FAILED', message: err.message } });
    }
  });

  // Trigger on-demand fresh weather ingestion
  router.post('/data/:id/weather/refresh', rateLimit(10, 60000), async (req: Request, res: Response) => {
    try {
      const result = await ingestionService.ingestWeatherForEntity(req.params.id);
      const updatedWeather = await db.getWeather(req.params.id);
      res.json({ data: updatedWeather, ingestionReport: result });
    } catch (err: any) {
      res.status(500).json({ error: { code: 'INGESTION_FAILED', message: err.message } });
    }
  });

  router.get('/data/:id/climate', async (req: Request, res: Response) => {
    try {
      const climate = await db.getClimate(req.params.id);
      res.json({ data: climate });
    } catch (err: any) {
      res.status(500).json({ error: { code: 'DATA_FETCH_FAILED', message: err.message } });
    }
  });

  router.get('/data/:id/rainfall', async (req: Request, res: Response) => {
    try {
      const rainfall = await db.getRainfall(req.params.id);
      res.json({ data: rainfall });
    } catch (err: any) {
      res.status(500).json({ error: { code: 'DATA_FETCH_FAILED', message: err.message } });
    }
  });

  router.get('/data/:id/agriculture', async (req: Request, res: Response) => {
    try {
      const agri = await db.getAgriculture(req.params.id);
      res.json({ data: agri });
    } catch (err: any) {
      res.status(500).json({ error: { code: 'DATA_FETCH_FAILED', message: err.message } });
    }
  });

  router.get('/data/:id/economy', async (req: Request, res: Response) => {
    try {
      const economy = await db.getEconomy(req.params.id);
      res.json({ data: economy });
    } catch (err: any) {
      res.status(500).json({ error: { code: 'DATA_FETCH_FAILED', message: err.message } });
    }
  });

  router.get('/data/:id/commerce', async (req: Request, res: Response) => {
    try {
      const commerce = await db.getCommerce(req.params.id);
      res.json({ data: commerce });
    } catch (err: any) {
      res.status(500).json({ error: { code: 'DATA_FETCH_FAILED', message: err.message } });
    }
  });

  router.get('/data/:id/population', async (req: Request, res: Response) => {
    try {
      const pop = await db.getPopulation(req.params.id);
      res.json({ data: pop });
    } catch (err: any) {
      res.status(500).json({ error: { code: 'DATA_FETCH_FAILED', message: err.message } });
    }
  });

  router.get('/data/:id/culture', async (req: Request, res: Response) => {
    try {
      const culture = await db.getCulture(req.params.id);
      res.json({ data: culture });
    } catch (err: any) {
      res.status(500).json({ error: { code: 'DATA_FETCH_FAILED', message: err.message } });
    }
  });

  router.get('/data/:id/infrastructure', async (req: Request, res: Response) => {
    try {
      const infra = await db.getInfrastructure(req.params.id);
      res.json({ data: infra });
    } catch (err: any) {
      res.status(500).json({ error: { code: 'DATA_FETCH_FAILED', message: err.message } });
    }
  });

  router.get('/data/:id/environment', async (req: Request, res: Response) => {
    try {
      const env = await db.getEnvironment(req.params.id);
      res.json({ data: env });
    } catch (err: any) {
      res.status(500).json({ error: { code: 'DATA_FETCH_FAILED', message: err.message } });
    }
  });

  router.get('/data/hazards', async (req: Request, res: Response) => {
    try {
      const entityId = typeof req.query.entityId === 'string' ? req.query.entityId : undefined;
      const hazards = await db.getHazards(entityId);
      res.json({ data: hazards });
    } catch (err: any) {
      res.status(500).json({ error: { code: 'DATA_FETCH_FAILED', message: err.message } });
    }
  });

  router.get('/data/:id/historical', async (req: Request, res: Response) => {
    try {
      const hist = await db.getHistoricalRecords(req.params.id);
      res.json({ data: hist });
    } catch (err: any) {
      res.status(500).json({ error: { code: 'DATA_FETCH_FAILED', message: err.message } });
    }
  });

  router.get('/data/sources', async (_req: Request, res: Response) => {
    try {
      const sources = await db.getSources();
      res.json({ data: sources });
    } catch (err: any) {
      res.status(500).json({ error: { code: 'SOURCES_FETCH_FAILED', message: err.message } });
    }
  });

  // ==========================================
  // 4. Ask Atlas AI Query Route
  // ==========================================
  router.post('/ai/query', rateLimit(30, 60000), optionalAuthenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { query, activeEntityId, activeLayers } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: { code: 'INVALID_QUERY', message: 'Query string is required' } });
      }

      const response = await geminiService.processQuery(query, activeEntityId, activeLayers);

      // Audit AI interaction for safety and performance
      await db.createAuditLog({
        actorId: req.user?.id || 'anonymous',
        actorEmail: req.user?.email || 'anonymous',
        actorRole: req.user?.role || 'PUBLIC_USER',
        action: 'AI_ATLAS_QUERY',
        resourceType: 'AI_AGENT',
        resourceId: 'ASK_ATLAS',
        details: { queryLength: query.length, activatedLayers: response.suggestedLayers }
      });

      res.json({ data: response });
    } catch (err: any) {
      res.status(500).json({ error: { code: 'AI_QUERY_FAILED', message: err.message } });
    }
  });

  // ==========================================
  // 5. Verification Queue & Corrections
  // ==========================================
  router.get('/verification/queue', authenticate, requireRole(['REVIEWER', 'ADMIN', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
    try {
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const records = await db.getVerificationRecords(status);
      res.json({ data: records });
    } catch (err: any) {
      res.status(500).json({ error: { code: 'VERIFICATION_FETCH_FAILED', message: err.message } });
    }
  });

  router.post('/verification/:id/review', authenticate, requireRole(['REVIEWER', 'ADMIN', 'SUPER_ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { action, notes } = req.body; // action: 'APPROVE' | 'REJECT' | 'REQUEST_MORE_EVIDENCE'
      if (!['APPROVE', 'REJECT', 'REQUEST_MORE_EVIDENCE'].includes(action)) {
        return res.status(400).json({ error: { code: 'INVALID_ACTION', message: 'Action must be APPROVE, REJECT, or REQUEST_MORE_EVIDENCE' } });
      }

      const statusMap: Record<string, 'APPROVED' | 'REJECTED' | 'REQUEST_MORE_EVIDENCE'> = {
        APPROVE: 'APPROVED',
        REJECT: 'REJECTED',
        REQUEST_MORE_EVIDENCE: 'REQUEST_MORE_EVIDENCE'
      };

      const updated = await db.updateVerificationRecord(req.params.id, statusMap[action], req.user!.email, notes);
      if (!updated) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Verification record not found' } });
      }

      // Audit log
      await db.createAuditLog({
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        actorRole: req.user!.role,
        action: `VERIFICATION_${action}`,
        resourceType: 'VERIFICATION_RECORD',
        resourceId: req.params.id,
        details: { entityId: updated.entityId, notes }
      });

      res.json({ data: updated });
    } catch (err: any) {
      res.status(500).json({ error: { code: 'REVIEW_FAILED', message: err.message } });
    }
  });

  // Submit proposed correction / new record from verified contributor
  router.post('/verification/propose', authenticate, requireRole(['VERIFIED_CONTRIBUTOR', 'REVIEWER', 'ADMIN', 'SUPER_ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { entityId, domain, proposedVersion, discrepancySummary, evidenceUrls, changePayload, sourceMetadata } = req.body;
      const entity = await db.getEntityById(entityId);
      if (!entity) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Entity not found' } });

      const newRecord = await db.createVerificationRecord({
        entityId,
        entityName: entity.name,
        domain: domain || 'general',
        currentVersion: entity.sources.datasetVersion || 'v1',
        proposedVersion: proposedVersion || 'v-proposed',
        proposedBy: req.user!.email,
        proposerRole: req.user!.role,
        status: 'PENDING',
        discrepancySummary: discrepancySummary || 'User proposed correction',
        evidenceUrls: Array.isArray(evidenceUrls) ? evidenceUrls : [],
        sourceMetadata: sourceMetadata || entity.sources,
        changePayload: changePayload || {}
      });

      await db.createAuditLog({
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        actorRole: req.user!.role,
        action: 'VERIFICATION_PROPOSED',
        resourceType: 'VERIFICATION_RECORD',
        resourceId: newRecord.id,
        details: { entityId, domain }
      });

      res.status(201).json({ data: newRecord });
    } catch (err: any) {
      res.status(500).json({ error: { code: 'PROPOSAL_FAILED', message: err.message } });
    }
  });

  // Public user error / problem report
  router.post('/reports/submit', rateLimit(15, 60000), optionalAuthenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { entityId, domain, description, evidenceUrl, suggestedCorrection } = req.body;
      const entity = await db.getEntityById(entityId);
      if (!entity) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Entity not found' } });

      const report = await db.createUserReport({
        entityId,
        entityName: entity.name,
        reportedByEmail: req.user?.email || req.body.email || 'anonymous',
        domain: domain || 'general',
        description: description || 'Report of potential data issue',
        evidenceUrl,
        suggestedCorrection: suggestedCorrection || ''
      });

      res.status(201).json({ data: report });
    } catch (err: any) {
      res.status(500).json({ error: { code: 'REPORT_SUBMIT_FAILED', message: err.message } });
    }
  });

  router.get('/reports', authenticate, requireRole(['REVIEWER', 'ADMIN', 'SUPER_ADMIN']), async (_req: Request, res: Response) => {
    try {
      const reports = await db.getUserReports();
      res.json({ data: reports });
    } catch (err: any) {
      res.status(500).json({ error: { code: 'REPORTS_FETCH_FAILED', message: err.message } });
    }
  });

  // ==========================================
  // 6. Admin, Audit, and Job Routes
  // ==========================================
  router.get('/admin/stats', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (_req: Request, res: Response) => {
    try {
      const stats = await db.getStats();
      res.json({ data: stats });
    } catch (err: any) {
      res.status(500).json({ error: { code: 'STATS_FETCH_FAILED', message: err.message } });
    }
  });

  router.get('/admin/audit-logs', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit) || 50;
      const logs = await db.getAuditLogs(limit);
      res.json({ data: logs });
    } catch (err: any) {
      res.status(500).json({ error: { code: 'AUDIT_FETCH_FAILED', message: err.message } });
    }
  });

  router.get('/admin/jobs', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (_req: Request, res: Response) => {
    try {
      const jobs = await db.getScheduledJobs();
      res.json({ data: jobs });
    } catch (err: any) {
      res.status(500).json({ error: { code: 'JOBS_FETCH_FAILED', message: err.message } });
    }
  });

  router.post('/admin/jobs/:id/run', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await schedulerService.runJob(req.params.id);
      await db.createAuditLog({
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        actorRole: req.user!.role,
        action: 'SCHEDULED_JOB_TRIGGERED_MANUALLY',
        resourceType: 'SCHEDULED_JOB',
        resourceId: req.params.id,
        details: result
      });
      res.json({ data: result });
    } catch (err: any) {
      res.status(500).json({ error: { code: 'JOB_RUN_FAILED', message: err.message } });
    }
  });

  return router;
}
