import { supabase, isSupabaseConfigured } from '../config/database.js';
import { UserSession } from '../types/index.js';
import { UnauthorizedError } from '../utils/errors.js';

export class AuthService {
  async verifyToken(token: string): Promise<UserSession> {
    if (!token) {
      throw new UnauthorizedError('No authentication token provided');
    }

    const allowDemo =
      process.env.ALLOW_DEMO_MODE === 'true' && process.env.NODE_ENV !== 'production';

    if (token === 'demo-token' || token.startsWith('user-demo-') || token.startsWith('demo-')) {
      if (!allowDemo) {
        throw new UnauthorizedError('Demo authentication is disabled in this environment');
      }
      const demoId = token.startsWith('user-demo-') || token.startsWith('demo-')
        ? token
        : 'user-demo-123';

      return {
        id: demoId,
        email: `${demoId}@example.com`,
        name: demoId === 'user-demo-123' ? 'Sarthak Pandey' : `Demo User (${demoId})`,
      };
    }

    if (!isSupabaseConfigured() || !supabase) {
      if (allowDemo) {
        return {
          id: 'user-demo-123',
          email: 'user-demo-123@example.com',
          name: 'Demo User (Offline)',
        };
      }
      throw new UnauthorizedError('Authentication service unavailable');
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      throw new UnauthorizedError('Invalid or expired authentication token');
    }

    return {
      id: data.user.id,
      email: data.user.email || '',
      name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
    };
  }

  async signIn(email: string, password: string): Promise<{ token: string; user: UserSession }> {
    if (!email || !password) {
      throw new UnauthorizedError('Email and password are required');
    }

    if (!isSupabaseConfigured() || !supabase) {
      throw new UnauthorizedError('Authentication service unavailable');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.session || !data.user) {
      throw new UnauthorizedError(error?.message || 'Invalid email or password');
    }

    return {
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
      },
    };
  }
}



