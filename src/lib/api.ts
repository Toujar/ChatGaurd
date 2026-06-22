/**
 * Typed API client for the ChatGuard Spring Boot backend.
 * Base URL: VITE_API_BASE_URL (defaults to http://localhost:8080/api)
 * Auth: JWT Bearer token stored in localStorage under 'chatguard-token'.
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8080/api';

// ---------------------------------------------------------------------------
// Token storage helpers
// ---------------------------------------------------------------------------

export function getAccessToken(): string | null {
  return localStorage.getItem('chatguard-token');
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem('chatguard-token', accessToken);
  localStorage.setItem('chatguard-refresh-token', refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem('chatguard-token');
  localStorage.removeItem('chatguard-refresh-token');
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

async function request<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authenticated) {
    const token = getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errBody = await response.json();
      errorMessage = errBody.message || errBody.error || errorMessage;
    } catch {
      // non-JSON error body
    }
    throw new Error(errorMessage);
  }

  // 204 No Content
  if (response.status === 204) return undefined as unknown as T;

  // Some endpoints return 200 with empty body
  const text = await response.text();
  if (!text) return undefined as unknown as T;

  return JSON.parse(text) as T;
}

// ---------------------------------------------------------------------------
// Types mirroring backend DTOs
// ---------------------------------------------------------------------------

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserDTO;
}

export interface UserDTO {
  id: string;
  organizationId: string;
  organizationName: string;
  email: string;
  fullName: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  riskScore: number;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface ChannelResponse {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  type: string;
  sensitivityLevel: string;
  createdBy: string | null;
  memberCount: number;
}

export interface MessageResponse {
  id: string;
  channelId: string | null;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  recipientId: string | null;
  parentMessageId: string | null;
  content: string;
  contentType: string;
  sensitivityDetected: boolean;
  sensitivityType: string | null;
  protectionTriggered: boolean;
  protectionType: string | null;
  editedAt: string | null;
  deleted: boolean;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface DashboardStats {
  activeUsers: number;
  messagesSent: number;
  protectedMessages: number;
  riskEvents: number;
  averageRiskScore: number;
  complianceScore: number;
}

export interface AuditLogEntry {
  id: string;
  organizationId: string;
  actorId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  details: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface ProtectionRuleResponse {
  id: string;
  name: string;
  description: string | null;
  ruleType: string;
  conditions: Record<string, unknown>;
  action: string;
  severity: string;
  enabled: boolean;
  createdAt: string;
}

export interface VerificationEventResponse {
  id: string;
  organizationId: string;
  userId: string;
  messageId: string | null;
  eventType: string;
  riskLevel: string;
  details: string;
  userAction: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------

export const authApi = {
  login(email: string, password: string) {
    return request<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false);
  },

  register(fullName: string, email: string, password: string, organizationName?: string) {
    return request<TokenResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password, organizationName }),
    }, false);
  },

  refresh(refreshToken: string) {
    return request<TokenResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }, false);
  },

  me() {
    return request<UserDTO>('/auth/me');
  },

  logout() {
    return request<void>('/auth/logout', { method: 'POST' });
  },

  resetPassword(email: string) {
    return request<void>('/auth/password/reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }, false);
  },

  changePassword(currentPassword: string, newPassword: string) {
    return request<void>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

// ---------------------------------------------------------------------------
// Users API
// ---------------------------------------------------------------------------

export const usersApi = {
  me() {
    return request<UserDTO>('/users/me');
  },

  updateMe(updates: { fullName?: string; displayName?: string; avatarUrl?: string }) {
    return request<UserDTO>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  getById(id: string) {
    return request<UserDTO>(`/users/${id}`);
  },

  getRiskHistory(id: string) {
    return request<{ riskScore: number; riskLevel: string }>(`/users/${id}/risk-history`);
  },
};

// ---------------------------------------------------------------------------
// Channels API
// ---------------------------------------------------------------------------

export const channelsApi = {
  list() {
    return request<ChannelResponse[]>('/channels');
  },

  getById(id: string) {
    return request<ChannelResponse>(`/channels/${id}`);
  },

  create(name: string, description: string, type = 'PUBLIC') {
    return request<ChannelResponse>('/channels', {
      method: 'POST',
      body: JSON.stringify({ name, description, type }),
    });
  },

  join(id: string) {
    return request<void>(`/channels/${id}/join`, { method: 'POST' });
  },
};

// ---------------------------------------------------------------------------
// Messages API
// ---------------------------------------------------------------------------

export const messagesApi = {
  send(payload: {
    channelId?: string;
    recipientId?: string;
    parentMessageId?: string;
    content: string;
    contentType?: string;
  }) {
    return request<MessageResponse>('/messages', {
      method: 'POST',
      body: JSON.stringify({ contentType: 'TEXT', ...payload }),
    });
  },

  getByChannel(channelId: string, page = 0, size = 50) {
    return request<PageResponse<MessageResponse>>(
      `/messages/channel/${channelId}?page=${page}&size=${size}`,
    );
  },

  getDirectMessages(userId: string) {
    return request<MessageResponse[]>(`/messages/direct/${userId}`);
  },

  update(messageId: string, content: string) {
    return request<MessageResponse>(`/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  },

  delete(messageId: string) {
    return request<void>(`/messages/${messageId}`, { method: 'DELETE' });
  },
};

// ---------------------------------------------------------------------------
// Analytics API
// ---------------------------------------------------------------------------

export const analyticsApi = {
  dashboard() {
    return request<DashboardStats>('/analytics/dashboard');
  },

  riskDistribution() {
    return request<Array<[string, number]>>('/analytics/risk');
  },

  userRiskScores() {
    return request<Array<{ id: string; name: string; riskScore: number; role: string }>>(
      '/analytics/users',
    );
  },
};

// ---------------------------------------------------------------------------
// Audit API
// ---------------------------------------------------------------------------

export const auditApi = {
  getLogs(page = 0, size = 50, action?: string) {
    const query = action ? `&action=${encodeURIComponent(action)}` : '';
    return request<PageResponse<AuditLogEntry>>(`/audit/logs?page=${page}&size=${size}${query}`);
  },

  getLogById(id: string) {
    return request<AuditLogEntry>(`/audit/logs/${id}`);
  },

  getSummary() {
    return request<Record<string, number>>('/audit/summary');
  },
};

// ---------------------------------------------------------------------------
// Protection API
// ---------------------------------------------------------------------------

export const protectionApi = {
  getRules() {
    return request<ProtectionRuleResponse[]>('/protection/rules');
  },

  getActiveRules() {
    return request<ProtectionRuleResponse[]>('/protection/rules/active');
  },

  createRule(rule: Omit<ProtectionRuleResponse, 'id' | 'createdAt'>) {
    return request<ProtectionRuleResponse>('/protection/rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    });
  },

  updateRule(id: string, updates: { enabled?: boolean; action?: string; severity?: string }) {
    return request<ProtectionRuleResponse>(`/protection/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteRule(id: string) {
    return request<void>(`/protection/rules/${id}`, { method: 'DELETE' });
  },

  getEvents(page = 0, size = 50) {
    return request<PageResponse<VerificationEventResponse>>(
      `/protection/events?page=${page}&size=${size}`,
    );
  },

  getPendingEvents() {
    return request<VerificationEventResponse[]>('/protection/events/pending');
  },

  resolveEvent(id: string, action: 'CONFIRMED' | 'CANCELLED' | 'TIMEOUT') {
    return request<void>(`/protection/events/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  },
};

// ---------------------------------------------------------------------------
// Admin API
// ---------------------------------------------------------------------------

export const adminApi = {
  getUsers(page = 0, size = 50, role?: string) {
    const query = role ? `&role=${encodeURIComponent(role)}` : '';
    return request<PageResponse<UserDTO>>(`/admin/users?page=${page}&size=${size}${query}`);
  },

  updateUserRole(id: string, role: string) {
    return request<void>(`/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  },

  updateUserStatus(id: string, status: string) {
    return request<void>(`/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  getHighRiskUsers(threshold = 30) {
    return request<UserDTO[]>(`/admin/users/high-risk?threshold=${threshold}`);
  },

  getStatistics() {
    return request<{ totalUsers: number; activeUsers: number; suspendedUsers: number; pendingUsers: number }>(
      '/admin/statistics',
    );
  },
};
