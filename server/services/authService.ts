/**
 * ANGEL AI — Server-Side Account Authentication & Identity Service
 * Real account authentication engine enforcing:
 * - Secure PBKDF2 password hashing with cryptographically random salt
 * - Session token issuance & verification with expiration & refresh
 * - User profile management & user ownership enforcement
 * - Scoped cloud data persistence per authenticated user
 */

import crypto from 'crypto';

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  name: string;
  avatarUrl?: string;
  title?: string;
  role: 'user' | 'admin' | 'guest';
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  token: string;
  userId: string;
  expiresAt: number; // timestamp in ms
  createdAt: string;
}

export interface UserProfileDTO {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  title?: string;
  role: 'user' | 'admin' | 'guest';
  createdAt: string;
}

// In-memory persistent account store (with pre-seeded canonical account Danny Davis)
class AuthService {
  private users: Map<string, UserAccount> = new Map();
  private sessions: Map<string, UserSession> = new Map();
  private userUserDataStore: Map<string, Record<string, unknown>> = new Map();

  constructor() {
    // No pre-seeded or shared credentials. Accounts must be created explicitly.
  }

  private hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  }

  private generateSalt(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private generateToken(): string {
    return 'angel_' + crypto.randomBytes(32).toString('hex');
  }


  /**
   * Register a new user account with hashed credentials
   */
  async signUp(email: string, password: string, name: string): Promise<{ profile: UserProfileDTO; token: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('A valid email address is required.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    if (this.users.has(cleanEmail)) {
      throw new Error('An account with this email address already exists. Please sign in instead.');
    }

    const salt = this.generateSalt();
    const passwordHash = this.hashPassword(password, salt);
    const userId = 'usr_' + crypto.randomBytes(12).toString('hex');

    const newUser: UserAccount = {
      id: userId,
      email: cleanEmail,
      passwordHash,
      salt,
      name: name.trim() || cleanEmail.split('@')[0],
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.users.set(cleanEmail, newUser);

    const session = this.createSession(newUser.id);
    return {
      profile: this.toProfileDTO(newUser),
      token: session.token,
    };
  }

  /**
   * Sign in with email and password verification
   */
  async signIn(email: string, password: string): Promise<{ profile: UserProfileDTO; token: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.users.get(cleanEmail);

    if (!user) {
      throw new Error('No account found with this email. Please check your spelling or sign up.');
    }

    const computedHash = this.hashPassword(password, user.salt);
    if (computedHash !== user.passwordHash) {
      throw new Error('Incorrect password. Please verify your credentials and try again.');
    }

    const session = this.createSession(user.id);
    return {
      profile: this.toProfileDTO(user),
      token: session.token,
    };
  }

  /**
   * Create a session token with 30-day lifetime
   */
  private createSession(userId: string): UserSession {
    const token = this.generateToken();
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
    const session: UserSession = {
      token,
      userId,
      expiresAt,
      createdAt: new Date().toISOString(),
    };
    this.sessions.set(token, session);
    return session;
  }

  /**
   * Authenticate token from request Bearer header
   */
  authenticateToken(token: string | undefined): UserAccount | null {
    if (!token) return null;
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
    const session = this.sessions.get(cleanToken);

    if (!session) return null;

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(cleanToken);
      return null;
    }

    // Refresh expiration on active use
    session.expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

    for (const user of this.users.values()) {
      if (user.id === session.userId) {
        return user;
      }
    }
    return null;
  }

  /**
   * Invalidate session token on sign out
   */
  signOut(token: string | undefined): boolean {
    if (!token) return true;
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
    return this.sessions.delete(cleanToken);
  }

  /**
   * Account recovery request
   */
  requestRecovery(email: string): { success: boolean; message: string } {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.users.get(cleanEmail);
    if (!user) {
      // Return success anyway for security best practice (prevent enumeration)
      return {
        success: true,
        message: 'Password recovery is not configured on this server yet. No email has been sent.',
      };
    }

    return {
      success: true,
      message: 'Password recovery is not configured on this server yet. No email has been sent.',
    };
  }

  /**
   * Update user profile
   */
  updateProfile(userId: string, updates: Partial<UserProfileDTO>): UserProfileDTO {
    let targetUser: UserAccount | null = null;
    for (const user of this.users.values()) {
      if (user.id === userId) {
        targetUser = user;
        break;
      }
    }

    if (!targetUser) {
      throw new Error('User account not found.');
    }

    if (updates.name) targetUser.name = updates.name.trim();
    if (updates.avatarUrl) targetUser.avatarUrl = updates.avatarUrl;
    if (updates.title) targetUser.title = updates.title.trim();
    targetUser.updatedAt = new Date().toISOString();

    return this.toProfileDTO(targetUser);
  }

  /**
   * Scoped cloud data get/set
   */
  getUserCloudData(userId: string): Record<string, unknown> {
    return this.userUserDataStore.get(userId) || {};
  }

  saveUserCloudData(userId: string, data: Record<string, unknown>): Record<string, unknown> {
    const existing = this.userUserDataStore.get(userId) || {};
    const updated = {
      ...existing,
      ...data,
      lastSyncedAt: new Date().toISOString(),
    };
    this.userUserDataStore.set(userId, updated);
    return updated;
  }

  toProfileDTO(user: UserAccount): UserProfileDTO {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      title: user.title,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}

export const authService = new AuthService();
