import { createClient } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../config/database.js';
import { config } from '../config/env.js';
import { UserSession } from '../types/index.js';
import { UnauthorizedError } from '../utils/errors.js';
import { ensureDemoDataForUser } from './demo-seed.service.js';

export interface GuestLoginResult {
  token: string;
  user: UserSession;
  defaultProjectId?: string;
}

const getAuthClient = () => {
  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

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
        name: `Demo User (${demoId})`,
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

    const isGuest = data.user.email === (process.env.DEMO_USER_EMAIL || 'guest@demo.local');

    return {
      id: data.user.id,
      email: data.user.email || '',
      name: isGuest ? 'Guest Demo' : (data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User'),
      role: isGuest ? 'Guest Demo' : (data.user.user_metadata?.role || 'Team Member'),
      isGuest,
    };
  }

  async signIn(email: string, password: string): Promise<{ token: string; user: UserSession }> {
    if (!email || !password) {
      throw new UnauthorizedError('Email and password are required');
    }

    if (!isSupabaseConfigured() || !supabase) {
      throw new UnauthorizedError('Authentication service unavailable');
    }

    const authClient = getAuthClient();
    const { data, error } = await authClient.auth.signInWithPassword({
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

  async guestLogin(): Promise<GuestLoginResult> {
    const isDemoLoginEnabled = process.env.DEMO_LOGIN_ENABLED === 'true';
    if (!isDemoLoginEnabled) {
      throw new UnauthorizedError('Guest demo access is currently disabled');
    }

    if (!isSupabaseConfigured() || !supabase) {
      throw new UnauthorizedError('Unable to start the demo right now. Please try again.');
    }

    const demoEmail = process.env.DEMO_USER_EMAIL || 'guest@demo.local';
    const demoPassword = process.env.DEMO_USER_PASSWORD || 'DemoGuest2026!SecureKey';

    try {
      const authClient = getAuthClient();
      let { data, error } = await authClient.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      // If user does not exist in Supabase auth yet, automatically create it
      if (error || !data.session || !data.user) {
        console.log('[AuthService] Creating dedicated guest demo user in Supabase...');
        const { data: created, error: createErr } = await supabase.auth.admin.createUser({
          email: demoEmail,
          password: demoPassword,
          email_confirm: true,
          user_metadata: { full_name: 'Guest Demo' },
        });

        if (createErr || !created.user) {
          console.error('[AuthService] Failed to create guest user in Supabase:', createErr);
          throw new UnauthorizedError('Unable to start the demo right now. Please try again.');
        }

        const retry = await authClient.auth.signInWithPassword({
          email: demoEmail,
          password: demoPassword,
        });

        data = retry.data;
        error = retry.error;
      }

      if (error || !data?.session || !data?.user) {
        console.error('[AuthService] Demo authentication error:', error);
        throw new UnauthorizedError('Unable to start the demo right now. Please try again.');
      }

      // Ensure demo project & dataset exists and is owned by this guest user
      const seedResult = await ensureDemoDataForUser(data.user.id);

      return {
        token: data.session.access_token,
        user: {
          id: data.user.id,
          email: data.user.email || demoEmail,
          name: 'Guest Demo',
          role: 'Guest Demo',
          isGuest: true,
        },
        defaultProjectId: seedResult.projectId,
      };
    } catch (err: any) {
      if (err instanceof UnauthorizedError) {
        throw err;
      }
      console.error('[AuthService] Unexpected error during guest login:', err);
      // PART 16: Never leak raw database error, service role key, or stack trace
      throw new UnauthorizedError('Unable to start the demo right now. Please try again.');
    }
  }
}



