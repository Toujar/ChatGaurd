export type UserRole = 'admin' | 'manager' | 'employee';
export type UserStatus = 'active' | 'suspended' | 'pending';

export type ProtectionLevel = 'relaxed' | 'standard' | 'strict' | 'custom';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ActionType = 'warn' | 'block' | 'require_approval';

export type ChannelType = 'public' | 'private' | 'direct';
export type SensitivityLevel = 'normal' | 'sensitive' | 'confidential' | 'restricted';

export interface User {
  id: string;
  organization_id: string;
  full_name: string;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  risk_score: number;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  settings: Record<string, unknown>;
  protection_level: ProtectionLevel;
  created_at: string;
  updated_at: string;
}

export interface Channel {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  type: ChannelType;
  created_by: string | null;
  sensitivity_level: SensitivityLevel;
  created_at: string;
  updated_at: string;
}

export interface ChannelMember {
  id: string;
  channel_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export interface Message {
  id: string;
  channel_id: string | null;
  sender_id: string;
  recipient_id: string | null;
  parent_message_id: string | null;
  content: string;
  content_type: 'text' | 'markdown' | 'system';
  sensitivity_detected: boolean;
  sensitivity_type: string | null;
  protection_triggered: boolean;
  protection_type: string | null;
  edited_at: string | null;
  edited_by: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  created_at: string;
  sender?: User;
}

export interface Attachment {
  id: string;
  message_id: string | null;
  uploaded_by: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  sensitivity_level: SensitivityLevel;
  scanned: boolean;
  scan_result: string | null;
  created_at: string;
}

export interface ProtectionRule {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  rule_type:
    | 'sensitive_content'
    | 'wrong_recipient'
    | 'forward_protection'
    | 'bulk_message'
    | 'delete_protection'
    | 'file_upload';
  conditions: Record<string, unknown>;
  action: ActionType;
  severity: RiskLevel;
  enabled: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface VerificationEvent {
  id: string;
  organization_id: string;
  user_id: string;
  message_id: string | null;
  event_type:
    | 'sensitive_send'
    | 'wrong_recipient'
    | 'forward_confirm'
    | 'bulk_confirm'
    | 'delete_confirm'
    | 'file_confirm';
  risk_level: RiskLevel;
  details: Record<string, unknown>;
  user_action: 'confirmed' | 'cancelled' | 'timeout' | null;
  resolved_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  actor_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  actor?: User;
}

export interface Notification {
  id: string;
  user_id: string;
  type:
    | 'message'
    | 'mention'
    | 'protection_alert'
    | 'policy_violation'
    | 'approval_request'
    | 'system'
    | 'risk_alert';
  title: string;
  content: string | null;
  data: Record<string, unknown>;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface RiskScoreHistory {
  id: string;
  user_id: string;
  score: number;
  previous_score: number | null;
  change_reason: string | null;
  factors: Record<string, unknown>;
  created_at: string;
}

export interface AnalyticsDaily {
  id: string;
  organization_id: string;
  date: string;
  messages_sent: number;
  messages_blocked: number;
  messages_warned: number;
  sensitive_attempts: number;
  wrong_recipient_attempts: number;
  forward_attempts: number;
  active_users: number;
  risk_events: number;
  created_at: string;
}

export interface DashboardStats {
  activeUsers: number;
  messagesSent: number;
  riskAlerts: number;
  actionsPrevented: number;
  protectedConversations: number;
  complianceScore: number;
}

export interface ProtectionDialogData {
  type: VerificationEvent['event_type'];
  riskLevel: RiskLevel;
  message: string;
  details: Record<string, unknown>;
  onConfirm: () => void;
  onCancel: () => void;
}
