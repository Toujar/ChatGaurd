import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  Check,
  X,
  Plus,
  Edit,
  Trash2,
  Settings,
  FileText,
  MessageSquare,
  Forward,
  Upload,
  Clock,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { protectionApi, type ProtectionRuleResponse, type VerificationEventResponse } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { RiskLevel } from '@/types';

const protectionRules: (ProtectionRule & { icon: typeof Shield })[] = [
  {
    id: '1',
    organization_id: 'org1',
    name: 'Credit Card Detection',
    description: 'Detects credit card numbers in messages',
    rule_type: 'sensitive_content',
    conditions: { patterns: ['credit_card_regex'] },
    action: 'warn',
    severity: 'high',
    enabled: true,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    icon: FileText,
  },
  {
    id: '2',
    organization_id: 'org1',
    name: 'SSN Protection',
    description: 'Blocks messages containing Social Security numbers',
    rule_type: 'sensitive_content',
    conditions: { patterns: ['ssn_regex'] },
    action: 'block',
    severity: 'critical',
    enabled: true,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    icon: Shield,
  },
  {
    id: '3',
    organization_id: 'org1',
    name: 'Forward Restriction',
    description: 'Requires confirmation before forwarding sensitive messages',
    rule_type: 'forward_protection',
    conditions: { require_reason: true },
    action: 'require_approval',
    severity: 'high',
    enabled: true,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    icon: Forward,
  },
  {
    id: '4',
    organization_id: 'org1',
    name: 'Bulk Message Protection',
    description: 'Prevents mass messaging to multiple channels',
    rule_type: 'bulk_message',
    conditions: { threshold: 5, time_window_minutes: 60 },
    action: 'warn',
    severity: 'medium',
    enabled: true,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    icon: MessageSquare,
  },
  {
    id: '5',
    organization_id: 'org1',
    name: 'File Upload Scanner',
    description: 'Scans uploaded files for sensitive content',
    rule_type: 'file_upload',
    conditions: { scan_enabled: true },
    action: 'warn',
    severity: 'high',
    enabled: false,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    icon: Upload,
  },
];

const severityColors: Record<string, string> = {
  low: 'text-emerald-400 bg-emerald-400/10',
  medium: 'text-amber-400 bg-amber-400/10',
  high: 'text-orange-500 bg-orange-500/10',
  critical: 'text-red-500 bg-red-500/10',
  LOW: 'text-emerald-400 bg-emerald-400/10',
  MEDIUM: 'text-amber-400 bg-amber-400/10',
  HIGH: 'text-orange-500 bg-orange-500/10',
  CRITICAL: 'text-red-500 bg-red-500/10',
};

const actionLabels: Record<string, string> = {
  warn: 'Warn User',
  block: 'Block Message',
  require_approval: 'Require Approval',
};

export function ProtectionPage() {
  const [rules, setRules] = useState<ProtectionRuleResponse[]>([]);
  const [events, setEvents] = useState<VerificationEventResponse[]>([]);
  const [activeTab, setActiveTab] = useState('rules');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([protectionApi.getRules(), protectionApi.getPendingEvents()])
      .then(([r, e]) => { setRules(r); setEvents(e); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleRule = async (ruleId: string, currentEnabled: boolean) => {
    try {
      const updated = await protectionApi.updateRule(ruleId, { enabled: !currentEnabled });
      setRules((prev) => prev.map((r) => (r.id === ruleId ? updated : r)));
    } catch (err) {
      console.error('Failed to toggle rule', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            Protection Center
          </h1>
          <p className="text-muted-foreground">
            Manage your organization's communication protection rules
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Rule
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="rules">Protection Rules</TabsTrigger>
          <TabsTrigger value="history">Event History</TabsTrigger>
          <TabsTrigger value="settings">Global Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="mt-6">
          <div className="grid gap-4">
            {loading && <p className="text-center text-sm text-muted-foreground py-8">Loading rules…</p>}
            {!loading && rules.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No protection rules configured</p>
            )}
            {rules.map((rule, idx) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className={cn(
                  'transition-all duration-200',
                  rule.enabled ? 'border-primary/30' : 'border-border/50 opacity-60'
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                        rule.enabled ? 'bg-primary/10' : 'bg-muted'
                      )}>
                        <Shield className={cn(
                          'h-5 w-5',
                          rule.enabled ? 'text-primary' : 'text-muted-foreground'
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{rule.name}</h3>
                          <Badge variant={rule.severity.toLowerCase() as 'low' | 'medium' | 'high' | 'critical'}>
                            {rule.severity.toLowerCase()}
                          </Badge>
                          {rule.action === 'BLOCK' && (
                            <Badge variant="destructive" className="gap-1">
                              <X className="h-3 w-3" />
                              Block
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {rule.description ?? '—'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs">
                            {rule.ruleType?.replace(/_/g, ' ') ?? ''}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {actionLabels[rule.action] ?? rule.action}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={() => toggleRule(rule.id, rule.enabled)}
                        />
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
              <CardDescription>Last 50 protection events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events.length === 0 && !loading && (
                  <p className="text-center text-sm text-muted-foreground py-4">No pending events</p>
                )}
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 rounded-lg border border-border/50 bg-muted/30 p-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                      <AlertTriangle className="h-5 w-5 text-warning" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium capitalize">
                        {event.eventType?.replace(/_/g, ' ') ?? 'Protection event'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Risk level: {event.riskLevel?.toLowerCase()}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={event.riskLevel?.toLowerCase() as 'high' | 'critical' | 'medium' | 'low'}>
                        {event.riskLevel?.toLowerCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Global Protection Level</CardTitle>
                <CardDescription>Set the default protection strictness</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {(['relaxed', 'standard', 'strict', 'custom'] as const).map((level) => (
                    <button
                      key={level}
                      className={cn(
                        'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all',
                        level === 'strict'
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-border/80'
                      )}
                    >
                      <Shield className="h-5 w-5" />
                      <span className="text-sm font-medium capitalize">{level}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure when users are notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Protection alerts', desc: 'Notify when content is blocked' },
                  { label: 'Risk warnings', desc: 'Alert on high-risk actions' },
                  { label: 'Policy updates', desc: 'Notify on rule changes' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-success/30 bg-success/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Check className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold">128</p>
                <p className="text-sm text-muted-foreground">Actions Protected Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold">23</p>
                <p className="text-sm text-muted-foreground">Pending Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">5</p>
                <p className="text-sm text-muted-foreground">Active Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
