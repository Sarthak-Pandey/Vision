import { supabase, isSupabaseConfigured } from '../config/database.js';
import { UserSession } from '../types/index.js';
import { UnauthorizedError } from '../utils/errors.js';

export class AuthService {
  async verifyToken(token: string): Promise<UserSession> {
    if (!token) {
      throw new UnauthorizedError('No authentication token provided');
    }

    if (token === 'demo-token' || !isSupabaseConfigured() || !supabase) {
      // Demo/local development user fallback
      return {
        id: 'user-demo-123',
        email: 'sarthak.pandey@example.com',
        name: 'Sarthak Pandey',
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
