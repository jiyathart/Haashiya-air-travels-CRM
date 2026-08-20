import { supabase } from './supabase';
import { api } from '../api';
import { StaffUser } from '../types';
import { supabaseService } from './supabaseService';

const LOCAL_STAFF_KEY = 'haashiya_current_staff';

export const authService = {
  /**
   * Signs in with email & password via Supabase Auth or Local API fallback.
   * On success, fetches or sets the matching staff record.
   */
  async signIn(email: string, password: string): Promise<{ user: StaffUser; token: string }> {
    email = email.trim().toLowerCase();

    if (!supabase) {
      // Fallback to local / server authentication when Supabase is not configured
      try {
        const user = await api.login(email, password);
        const sessionToken = localStorage.getItem('haashiya_token') || 'local-session-token';
        localStorage.setItem(LOCAL_STAFF_KEY, JSON.stringify(user));
        return { user, token: sessionToken };
      } catch (err: any) {
        throw new Error(err.message || 'Invalid login credentials.');
      }
    }

    // 1. Sign in via Supabase Auth
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !signInData.user) {
      throw new Error(signInError?.message || 'Invalid login credentials.');
    }

    const authUser = signInData.user;
    const sessionToken = signInData.session?.access_token || 'supabase-session-token';

    // 2. Sync and query public.staff for matching user
    const staffUser = await supabaseService.syncUserToStaff({ id: authUser.id, email: authUser.email || email });

    if (!staffUser) {
      await supabase.auth.signOut();
      throw new Error('No staff account found for this email address. Please contact your administrator.');
    }

    // 3. Check active state
    if (staffUser.active === false || staffUser.status === 'inactive') {
      await supabase.auth.signOut();
      localStorage.removeItem(LOCAL_STAFF_KEY);
      throw new Error('Your account is inactive. Please contact the administrator.');
    }

    localStorage.setItem(LOCAL_STAFF_KEY, JSON.stringify(staffUser));

    return {
      user: staffUser,
      token: sessionToken,
    };
  },

  /**
   * Signs up a new user via Supabase Auth.
   * On success, creates and returns the mapped staff record.
   */
  async signUp(email: string, password: string, fullName?: string): Promise<{ user: StaffUser; token: string }> {
    email = email.trim().toLowerCase();
    try {
      await api.signup(email, password, fullName || email.split('@')[0]);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to sign up');
    }
    return this.signIn(email, password);
  },

  /**
   * Restores current logged-in staff session
   */
  async getCurrentSession(): Promise<StaffUser | null> {
    if (supabase) {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          const user = await supabaseService.syncUserToStaff({
            id: data.session.user.id,
            email: data.session.user.email || ''
          });
          if (user) {
            if (user.active === false || user.status === 'inactive') {
              await supabase.auth.signOut();
              localStorage.removeItem(LOCAL_STAFF_KEY);
              return null;
            }
            localStorage.setItem(LOCAL_STAFF_KEY, JSON.stringify(user));
            return user;
          }
        }
      } catch (err) {
        console.warn('Error fetching Supabase session:', err);
      }
    }

    // Fall back to saved local staff session
    const saved = localStorage.getItem(LOCAL_STAFF_KEY);
    if (saved) {
      try {
        const user = JSON.parse(saved);
        if (user && user.id) return user;
      } catch {
        // ignore
      }
    }

    try {
      const res = await api.getCurrentUser();
      if (res && res.user) {
        localStorage.setItem(LOCAL_STAFF_KEY, JSON.stringify(res.user));
        return res.user;
      }
    } catch {
      // ignore
    }

    return null;
  },

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    localStorage.removeItem(LOCAL_STAFF_KEY);
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Supabase signOut error:', e);
      }
    }
  },
};
