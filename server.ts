import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { EngineDatabaseAdapter } from './server/db/engine.adapter.js';
import { PostgresDatabaseAdapter } from './server/db/postgres.adapter.js';
import { DatabaseAdapter } from './server/db/database.interface.js';
import { AuthService } from './server/auth/auth.service.js';
import { IngestionService } from './server/pipeline/ingestion.service.js';
import { SchedulerService } from './server/pipeline/scheduler.service.js';
import { GeminiAtlasService } from './server/ai/gemini.service.js';
import { createApiRouter } from './server/routes/api.router.js';

// Load both .env and .env.local
dotenv.config();
dotenv.config({ path: '.env.local', override: false });

// Global process error handlers to prevent unhandled socket/network disconnects from crashing server
process.on('unhandledRejection', (reason: any) => {
  console.warn('[ATLASAI Process] Handled async rejection:', reason?.message || reason);
});

process.on('uncaughtException', (err: any) => {
  const msg = err?.message || String(err);
  if (msg.includes('Connection terminated unexpectedly') || msg.includes('ECONNRESET')) {
    console.warn('[ATLASAI Process] Caught idle connection reset:', msg);
  } else {
    console.error('[ATLASAI Process] Uncaught exception:', err);
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Security headers & body parsers
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // Initialize Database: Neon PostgreSQL if DATABASE_URL is present, otherwise in-memory engine
  const databaseUrl = process.env.DATABASE_URL;
  let db: DatabaseAdapter;
  if (databaseUrl) {
    console.log('[Database] Initializing Neon Postgres Database Adapter...');
    db = new PostgresDatabaseAdapter(databaseUrl);
  } else {
    console.log('[Database] Running in-memory EngineDatabaseAdapter...');
    db = new EngineDatabaseAdapter();
  }
  await db.init();

  const authService = new AuthService(db);
  const ingestionService = new IngestionService(db);
  const schedulerService = new SchedulerService(db, ingestionService);
  schedulerService.start();

  const geminiService = new GeminiAtlasService(db);

  // Mount API router
  const apiRouter = createApiRouter(db, authService, ingestionService, schedulerService, geminiService);
  app.use('/api', apiRouter);

  // Health check endpoint
  app.get('/api/health', async (_req, res) => {
    res.json({
      status: 'HEALTHY',
      service: 'ATLASAI Core Services',
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime()
    });
  });

  // Vite middleware in development vs static serving in production
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ATLASAI Server] Automated Living World Atlas listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[ATLASAI Fatal Startup Error]:', err);
  process.exit(1);
});
