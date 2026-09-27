import { supabase, isSupabaseConfigured } from '../config/database.js';
import { UserSession } from '../types/index.js';
import { UnauthorizedError } from '../utils/errors.js';

export class AuthService {
  async verifyToken(token: string): Promise<UserSession> {
    if (!token) {
      throw new UnauthorizedError('No authentication token provided');
    }

    if (token === 'demo-token' || token.startsWith('user-demo-') || token.startsWith('demo-') || !isSupabaseConfigured() || !supabase) {
      const demoId = token.startsWith('user-demo-') || token.startsWith('demo-')
        ? token
        : 'user-demo-123';

      return {
        id: demoId,
        email: `${demoId}@example.com`,
        name: demoId === 'user-demo-123' ? 'Sarthak Pandey' : `Demo User (${demoId})`,
      };
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
}

