import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { User, UserRole } from '../../src/types/atlas.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
  token?: string;
}

export function createAuthMiddleware(authService: AuthService) {
  const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication token required. Please sign in to perform this operation.'
        }
      });
    }

    const token = authHeader.split(' ')[1];
    try {
      const user = await authService.validateToken(token);
      if (!user) {
        return res.status(401).json({
          error: {
            code: 'SESSION_EXPIRED',
            message: 'Session has expired or was revoked. Please log in again.'
          }
        });
      }
      req.user = user;
      req.token = token;
      next();
    } catch (err: any) {
      return res.status(401).json({
        error: {
          code: 'AUTH_FAILED',
          message: 'Authentication error'
        }
      });
    }
  };

  const optionalAuthenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const user = await authService.validateToken(token);
        if (user) {
          req.user = user;
          req.token = token;
        }
      } catch (err) {
        // Continue unauthenticated
      }
    }
    next();
  };

  const requireRole = (allowedRoles: UserRole[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
        });
      }

      // Hierarchy: SUPER_ADMIN can do anything, ADMIN can do REVIEWER and CONTRIBUTOR tasks
      if (req.user.role === 'SUPER_ADMIN') {
        return next();
      }
      if (req.user.role === 'ADMIN' && (allowedRoles.includes('REVIEWER') || allowedRoles.includes('VERIFIED_CONTRIBUTOR') || allowedRoles.includes('ADMIN'))) {
        return next();
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: `Access denied. Operation requires one of the following roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`
          }
        });
      }

      next();
    };
  };

  return { authenticate, optionalAuthenticate, requireRole };
}
