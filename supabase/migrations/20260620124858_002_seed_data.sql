-- Seed organizations
INSERT INTO organizations (id, name, slug, protection_level, settings) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Acme Corporation', 'acme-corp', 'standard', '{"features": {"riskAnalytics": true, "auditLogs": true}}'),
  ('22222222-2222-2222-2222-222222222222', 'TechVentures Inc', 'techventures', 'strict', '{"features": {"riskAnalytics": true, "auditLogs": true, "compliance": true}}');

-- Seed additional protection rules
INSERT INTO protection_rules (organization_id, name, description, rule_type, conditions, action, severity, enabled) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Credit Card Detection', 'Detect credit card numbers in messages', 'sensitive_content', 
    '{"patterns": ["\\b\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b"]}', 'warn', 'high', true),
  ('11111111-1111-1111-1111-111111111111', 'SSN Protection', 'Detect SSN patterns', 'sensitive_content', 
    '{"patterns": ["\\b\\d{3}[\\s-]?\\d{2}[\\s-]?\\d{4}\\b"]}', 'block', 'critical', true),
  ('11111111-1111-1111-1111-111111111111', 'Forward Restriction', 'Restrict forwarding sensitive messages', 'forward_protection', 
    '{"require_reason": true, "allow_external": false}', 'require_approval', 'high', true),
  ('11111111-1111-1111-1111-111111111111', 'Bulk Message Limit', 'Prevent mass messaging', 'bulk_message', 
    '{"threshold": 5, "time_window_minutes": 60}', 'warn', 'medium', true);