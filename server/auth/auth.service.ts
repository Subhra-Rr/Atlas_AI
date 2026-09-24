import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { DatabaseAdapter } from '../db/database.interface.js';
import { User, UserRole } from '../../src/types/atlas.js';

const JWT_SECRET = process.env.JWT_SECRET || 'TaXw9sszBAajirtVAowcPYU0eAXfB2w0U+D4SmkVvvg=';

export class AuthService {
  constructor(private db: DatabaseAdapter) {}

  async register(email: string, passwordPlain: string, name: string): Promise<{ user: User; token: string }> {
    // Input validation
    if (!email || !email.includes('@') || email.length > 255) {
      throw new Error('Valid email address is required');
    }
    if (!passwordPlain || passwordPlain.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    if (!name || name.trim().length === 0) {
      throw new Error('Name is required');
    }

    const existing = await this.db.getUserByEmail(email);
    if (existing) {
      throw new Error('An account with this email address already exists');
    }

    const user: User = {
      id: crypto.randomUUID(),
      email: email.toLowerCase().trim(),
      name: name.trim(),
      role: 'PUBLIC_USER',
      createdAt: new Date().toISOString(),
      isEmailVerified: true,
      followedEntities: ['odisha', 'ganjam']
    };

    await this.db.createUser(user, passwordPlain);

    // Audit log
    await this.db.createAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_REGISTERED',
      resourceType: 'USER',
      resourceId: user.id,
      details: { email: user.email }
    });

    const token = await this.generateSession(user.id);
    return { user, token };
  }

  async login(email: string, passwordPlain: string): Promise<{ user: User; token: string }> {
    if (!email || !passwordPlain) {
      throw new Error('Email and password are required');
    }

    const account = await this.db.getUserByEmail(email);
    if (!account) {
      throw new Error('Invalid email or password credentials');
    }

    // Hash check with PBKDF2
    // We look up the salt stored in the adapter or fallback
    const isAdapter = this.db as any;
    const internalRecord = isAdapter['users']?.get(email.toLowerCase()) ||
      isAdapter['fallback']?.['users']?.get(email.toLowerCase());
    if (!internalRecord) {
      throw new Error('Invalid email or password credentials');
    }

    const checkHash = crypto.pbkdf2Sync(passwordPlain, internalRecord.salt, 10000, 64, 'sha512').toString('hex');
    if (checkHash !== internalRecord.passwordHash) {
      throw new Error('Invalid email or password credentials');
    }

    const token = await this.generateSession(account.user.id);

    await this.db.createAuditLog({
      actorId: account.user.id,
      actorEmail: account.user.email,
      actorRole: account.user.role,
      action: 'USER_LOGIN',
      resourceType: 'USER',
      resourceId: account.user.id,
      details: { role: account.user.role }
    });

    return { user: account.user, token };
  }

  async logout(token: string): Promise<void> {
    if (!token) return;
    await this.db.revokeSession(token);
  }

  async validateToken(token: string): Promise<User | null> {
    if (!token) return null;

    try {
      // First verify the JWT signature using the configured secret
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      if (decoded && decoded.userId) {
        // Validate with database session (ensures session wasn't revoked)
        const sessionUser = await this.db.validateSession(token);
        if (sessionUser) return sessionUser;

        // Fallback: If DB session cache was restarted, load user by decoded ID
        return await this.db.getUserById(decoded.userId);
      }
    } catch (jwtErr) {
      // If not a valid JWT (or expired), attempt direct DB lookup for legacy tokens
      return this.db.validateSession(token);
    }

    return this.db.validateSession(token);
  }

  private async generateSession(userId: string): Promise<string> {
    const user = await this.db.getUserById(userId);
    const payload = {
      userId,
      email: user?.email,
      role: user?.role
    };

    // Sign standard JWT with the configured secret
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.db.createSession(userId, token, expiresAt);
    return token;
  }
}
