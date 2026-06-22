-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  protection_level TEXT DEFAULT 'standard' CHECK (protection_level IN ('relaxed', 'standard', 'strict', 'custom')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles extending Supabase auth
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  risk_score INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Channels
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'public' CHECK (type IN ('public', 'private', 'direct')),
  created_by UUID REFERENCES profiles(id),
  sensitivity_level TEXT DEFAULT 'normal' CHECK (sensitivity_level IN ('normal', 'sensitive', 'confidential')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- Channel members
CREATE TABLE channel_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(channel_id, user_id)
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  parent_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'markdown', 'system')),
  sensitivity_detected BOOLEAN DEFAULT FALSE,
  sensitivity_type TEXT,
  protection_triggered BOOLEAN DEFAULT FALSE,
  protection_type TEXT,
  edited_at TIMESTAMPTZ,
  edited_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attachments
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  sensitivity_level TEXT DEFAULT 'normal' CHECK (sensitivity_level IN ('normal', 'sensitive', 'confidential', 'restricted')),
  scanned BOOLEAN DEFAULT FALSE,
  scan_result TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Protection rules
CREATE TABLE protection_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN (
    'sensitive_content', 'wrong_recipient', 'forward_protection',
    'bulk_message', 'delete_protection', 'file_upload'
  )),
  conditions JSONB NOT NULL,
  action TEXT DEFAULT 'warn' CHECK (action IN ('warn', 'block', 'require_approval')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  enabled BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verification events
CREATE TABLE verification_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  message_id UUID REFERENCES messages(id),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'sensitive_send', 'wrong_recipient', 'forward_confirm',
    'bulk_confirm', 'delete_confirm', 'file_confirm'
  )),
  risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  details JSONB DEFAULT '{}',
  user_action TEXT CHECK (user_action IN ('confirmed', 'cancelled', 'timeout')),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  actor_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'message', 'mention', 'protection_alert', 'policy_violation',
    'approval_request', 'system', 'risk_alert'
  )),
  title TEXT NOT NULL,
  content TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk scores history
CREATE TABLE risk_score_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  previous_score INTEGER,
  change_reason TEXT,
  factors JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics aggregations (for dashboard)
CREATE TABLE analytics_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  date DATE NOT NULL,
  messages_sent INTEGER DEFAULT 0,
  messages_blocked INTEGER DEFAULT 0,
  messages_warned INTEGER DEFAULT 0,
  sensitive_attempts INTEGER DEFAULT 0,
  wrong_recipient_attempts INTEGER DEFAULT 0,
  forward_attempts INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  risk_events INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, date)
);

-- Create indexes for performance
CREATE INDEX idx_profiles_organization ON profiles(organization_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_channels_organization ON channels(organization_id);
CREATE INDEX idx_channel_members_channel ON channel_members(channel_id);
CREATE INDEX idx_channel_members_user ON channel_members(user_id);
CREATE INDEX idx_messages_channel ON messages(channel_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_attachments_message ON attachments(message_id);
CREATE INDEX idx_protection_rules_org ON protection_rules(organization_id);
CREATE INDEX idx_verification_events_org ON verification_events(organization_id);
CREATE INDEX idx_verification_events_user ON verification_events(user_id);
CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_risk_history_user ON risk_score_history(user_id);
CREATE INDEX idx_analytics_org_date ON analytics_daily(organization_id, date);

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE protection_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;

-- Organization policies
CREATE POLICY "select_own_organization" ON organizations FOR SELECT
  TO authenticated USING (id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "insert_organization" ON organizations FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_own_organization" ON organizations FOR UPDATE
  TO authenticated USING (id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "delete_own_organization" ON organizations FOR DELETE
  TO authenticated USING (id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Profile policies
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id OR organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- Channel policies
CREATE POLICY "select_org_channels" ON channels FOR SELECT
  TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "insert_org_channels" ON channels FOR INSERT
  TO authenticated WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "update_org_channels" ON channels FOR UPDATE
  TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "delete_org_channels" ON channels FOR DELETE
  TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- Channel members policies
CREATE POLICY "select_channel_membership" ON channel_members FOR SELECT
  TO authenticated USING (channel_id IN (SELECT id FROM channels WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())));
CREATE POLICY "insert_channel_membership" ON channel_members FOR INSERT
  TO authenticated WITH CHECK (user_id IN (SELECT id FROM profiles WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())));
CREATE POLICY "delete_channel_membership" ON channel_members FOR DELETE
  TO authenticated USING (user_id = auth.uid() OR channel_id IN (SELECT id FROM channels WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))));

-- Message policies
CREATE POLICY "select_accessible_messages" ON messages FOR SELECT
  TO authenticated USING (
    channel_id IN (SELECT channel_id FROM channel_members WHERE user_id = auth.uid())
    OR sender_id = auth.uid()
    OR recipient_id = auth.uid()
  );
CREATE POLICY "insert_own_messages" ON messages FOR INSERT
  TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY "update_own_messages" ON messages FOR UPDATE
  TO authenticated USING (sender_id = auth.uid());
CREATE POLICY "delete_own_messages" ON messages FOR DELETE
  TO authenticated USING (sender_id = auth.uid());

-- Attachment policies
CREATE POLICY "select_message_attachments" ON attachments FOR SELECT
  TO authenticated USING (message_id IN (SELECT id FROM messages WHERE sender_id = auth.uid() OR channel_id IN (SELECT channel_id FROM channel_members WHERE user_id = auth.uid())));
CREATE POLICY "insert_own_attachments" ON attachments FOR INSERT
  TO authenticated WITH CHECK (uploaded_by = auth.uid());

-- Protection rules policies
CREATE POLICY "select_org_rules" ON protection_rules FOR SELECT
  TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "insert_org_rules" ON protection_rules FOR INSERT
  TO authenticated WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')));
CREATE POLICY "update_org_rules" ON protection_rules FOR UPDATE
  TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')));
CREATE POLICY "delete_org_rules" ON protection_rules FOR DELETE
  TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Verification events policies
CREATE POLICY "select_own_verifications" ON verification_events FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')));
CREATE POLICY "insert_own_verifications" ON verification_events FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

-- Audit logs policies (read-only for admins/managers)
CREATE POLICY "select_org_audit_logs" ON audit_logs FOR SELECT
  TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- Notification policies
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (user_id = auth.uid());
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (user_id = auth.uid());
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- Risk score history policies
CREATE POLICY "select_own_risk_history" ON risk_score_history FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR user_id IN (SELECT id FROM profiles WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))));
CREATE POLICY "insert_risk_history" ON risk_score_history FOR INSERT
  TO authenticated WITH CHECK (true);

-- Analytics policies
CREATE POLICY "select_org_analytics" ON analytics_daily FOR SELECT
  TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_protection_rules_updated_at BEFORE UPDATE ON protection_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    'employee',
    'active'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();