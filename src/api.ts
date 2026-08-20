import { StaffUser, TicketBooking, PassportProcess, GeneralTask, DailyBriefingData } from './types';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { executeLocalRequest } from './lib/localDb';

export { supabase, isSupabaseConfigured };

const TOKEN_KEY = 'haashiya_crm_auth_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('haashiya_current_staff');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers
    });

    // Handle unauthenticated or static hosting / Vercel rewrites where POST returns 401, 405 or 404 or server is down
    if (response.status === 401 || response.status === 405 || response.status === 404 || response.status >= 500) {
      console.warn(`API returned HTTP ${response.status} for ${endpoint}. Executing local fallback.`);
      return await executeLocalRequest<T>(endpoint, options, token);
    }

    const contentType = response.headers.get('content-type') || '';
    const responseText = await response.text();

    const isHtmlOrText = !contentType.includes('application/json') || responseText.trim().startsWith('<') || responseText.trim().startsWith('The page');

    if (isHtmlOrText) {
      console.warn(`Non-JSON response received for ${endpoint} (likely static host/Vercel rewrite). Executing local fallback.`);
      return await executeLocalRequest<T>(endpoint, options, token);
    }

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorJson = JSON.parse(responseText);
        if (errorJson?.error) errorMessage = errorJson.error;
      } catch {
        if (responseText && responseText.length < 150 && !responseText.includes('<!DOCTYPE')) {
          errorMessage = responseText;
        } else {
          errorMessage = `Server error (${response.status}): ${response.statusText || 'Unexpected error'}`;
        }
      }
      throw new Error(errorMessage);
    }

    try {
      return JSON.parse(responseText) as T;
    } catch {
      return await executeLocalRequest<T>(endpoint, options, token);
    }
  } catch (err: any) {
    if (
      err.message?.includes('405') ||
      err.message?.includes('404') ||
      err.message?.includes('Failed to fetch') ||
      err.message?.includes('JSON') ||
      err.message?.includes('Unexpected token') ||
      err.name === 'TypeError'
    ) {
      return await executeLocalRequest<T>(endpoint, options, token);
    }
    throw err;
  }
}

export const api = {
  // AUTH
  async login(username: string, password: string) {
    const res = await request<{ token: string; user: StaffUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    setToken(res.token);
    return res.user;
  },

  async changePassword(currentPassword?: string, newPassword?: string) {
    return request<{ message: string; user: StaffUser }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  },

  async getCurrentUser() {
    return request<{ user: StaffUser }>('/api/auth/me');
  },

  // STAFF
  async getStaff() {
    return request<StaffUser[]>('/api/staff');
  },

  async createStaff(data: Partial<StaffUser> & { password: string }) {
    return request<StaffUser>('/api/staff', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateStaff(id: string, data: Partial<StaffUser> & { resetPassword?: string }) {
    return request<StaffUser>(`/api/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // TICKETS
  async getTickets() {
    return request<TicketBooking[]>('/api/tickets');
  },

  async createTicket(data: Partial<TicketBooking> & { noteText?: string }) {
    return request<TicketBooking>('/api/tickets', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateTicket(id: string, data: Partial<TicketBooking>) {
    return request<TicketBooking>(`/api/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async addTicketNote(id: string, text: string) {
    return request<any>(`/api/tickets/${id}/note`, {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  },

  // TICKET PAYMENTS
  async addTicketPayment(id: string, data: { date: string; amount: number; mode: string; note?: string }) {
    return request<TicketBooking>(`/api/tickets/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateTicketPayment(id: string, paymentId: string, data: { date?: string; amount?: number; mode?: string; note?: string }) {
    return request<TicketBooking>(`/api/tickets/${id}/payments/${paymentId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteTicketPayment(id: string, paymentId: string) {
    return request<TicketBooking>(`/api/tickets/${id}/payments/${paymentId}`, {
      method: 'DELETE'
    });
  },

  // PASSPORTS
  async getPassports() {
    return request<PassportProcess[]>('/api/passports');
  },

  async createPassport(data: Partial<PassportProcess> & { noteText?: string }) {
    return request<PassportProcess>('/api/passports', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updatePassport(id: string, data: Partial<PassportProcess>) {
    return request<PassportProcess>(`/api/passports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async addPassportNote(id: string, text: string) {
    return request<any>(`/api/passports/${id}/note`, {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  },

  // PASSPORT PAYMENTS
  async addPassportPayment(id: string, data: { date: string; amount: number; mode: string; note?: string }) {
    return request<PassportProcess>(`/api/passports/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updatePassportPayment(id: string, paymentId: string, data: { date?: string; amount?: number; mode?: string; note?: string }) {
    return request<PassportProcess>(`/api/passports/${id}/payments/${paymentId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deletePassportPayment(id: string, paymentId: string) {
    return request<PassportProcess>(`/api/passports/${id}/payments/${paymentId}`, {
      method: 'DELETE'
    });
  },

  // GENERAL TASKS
  async getGeneralTasks() {
    return request<GeneralTask[]>('/api/general-tasks');
  },

  async createGeneralTask(data: Partial<GeneralTask> & { noteText?: string }) {
    return request<GeneralTask>('/api/general-tasks', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateGeneralTask(id: string, data: Partial<GeneralTask>) {
    return request<GeneralTask>(`/api/general-tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteGeneralTask(id: string) {
    return request<{ success: boolean }>(`/api/general-tasks/${id}`, {
      method: 'DELETE'
    });
  },

  async addGeneralTaskNote(id: string, text: string) {
    return request<any>(`/api/general-tasks/${id}/note`, {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  },

  // GENERAL TASK PAYMENTS
  async addGeneralTaskPayment(id: string, data: { date: string; amount: number; mode: string; note?: string }) {
    return request<GeneralTask>(`/api/general-tasks/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateGeneralTaskPayment(id: string, paymentId: string, data: { date?: string; amount?: number; mode?: string; note?: string }) {
    return request<GeneralTask>(`/api/general-tasks/${id}/payments/${paymentId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteGeneralTaskPayment(id: string, paymentId: string) {
    return request<GeneralTask>(`/api/general-tasks/${id}/payments/${paymentId}`, {
      method: 'DELETE'
    });
  },

  // SERVICE TYPES
  async getServiceTypes() {
    return request<string[]>('/api/service-types');
  },

  async addServiceType(name: string) {
    return request<string[]>('/api/service-types', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
  },

  // DAILY BRIEFING
  async getDailyBriefing() {
    return request<DailyBriefingData>('/api/daily-briefing');
  },

  // REMINDERS
  async getAcknowledgedReminders() {
    return request<string[]>('/api/reminders/acknowledged');
  },

  async acknowledgeReminder(reminderId: string) {
    return request<{ success: boolean; acknowledged: string[] }>('/api/reminders/acknowledge', {
      method: 'POST',
      body: JSON.stringify({ reminderId })
    });
  },

  // DEMO RESET
  async resetDemoData() {
    return request<{ message: string }>('/api/reset-demo-data', {
      method: 'POST'
    });
  }
};
