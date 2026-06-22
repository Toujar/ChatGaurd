import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  Shield,
  MessageSquare,
 Trash2,
  Edit,
  Eye,
  UserPlus,
  Settings,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { auditApi, type AuditLogEntry } from '@/lib/api';
import { cn, formatRelativeTime } from '@/lib/utils';

const actionIcons: Record<string, typeof Shield> = {
  'message.sent': MessageSquare,
  'message.forwarded': MessageSquare,
  'message.deleted': Trash2,
  'message.edited': Edit,
  'protection.triggered': Shield,
  'protection.created': Shield,
  'user.risk_changed': UserPlus,
  'channel.settings_changed': Settings,
  'file.uploaded': FileText,
};

const severityColors = {
  info: 'text-muted-foreground',
  warning: 'text-warning',
  critical: 'text-destructive',
};

const severityBg = {
  info: 'bg-muted/50',
  warning: 'bg-warning/10',
  critical: 'bg-destructive/10',
};

function getSeverity(action: string): 'info' | 'warning' | 'critical' {
  if (action.includes('block') || action.includes('critical') || action.includes('protection.triggered')) return 'critical';
  if (action.includes('warn') || action.includes('risk') || action.includes('delete')) return 'warning';
  return 'info';
}

export function AuditPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string | null>(null);
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchLogs = (p = 0, action?: string) => {
    setLoading(true);
    auditApi.getLogs(p, 50, action || undefined)
      .then((res) => {
        setLogs(res.content);
        setTotalElements(res.totalElements);
        setPage(p);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, []);

  const filteredLogs = logs.filter((log) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.resourceType?.toLowerCase().includes(q) ||
        JSON.stringify(log.details).toLowerCase().includes(q)
      );
    }
    return true;
  });

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedLogs);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedLogs(newSelected);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            Audit Logs
          </h1>
          <p className="text-muted-foreground">
            Complete history of all actions and events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchLogs(0, filterAction || undefined)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search logs..."
                className="pl-9"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  {filterAction || 'All Actions'}
                  <ChevronDown className="ml-auto h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by action</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { setFilterAction(null); fetchLogs(0); }}>All Actions</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setFilterAction('message'); fetchLogs(0, 'message'); }}>Messages</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setFilterAction('protection'); fetchLogs(0, 'protection'); }}>Protection</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setFilterAction('user'); fetchLogs(0, 'user'); }}>Users</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setFilterAction('channel'); fetchLogs(0, 'channel'); }}>Channels</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setFilterAction('file'); fetchLogs(0, 'file'); }}>Files</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {filteredLogs.length} logs found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-input"
                  checked={selectedLogs.size === filteredLogs.length}
                  onChange={() => {
                    if (selectedLogs.size === filteredLogs.length) {
                      setSelectedLogs(new Set());
                    } else {
                      setSelectedLogs(new Set(filteredLogs.map(l => l.id)));
                    }
                  }}
                />
                <span className="text-sm text-muted-foreground">Select all</span>
              </div>
              {selectedLogs.size > 0 && (
                <Badge variant="secondary">
                  {selectedLogs.size} selected
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="divide-y divide-border/50">
              {loading && (
                <p className="p-8 text-center text-sm text-muted-foreground">Loading logs…</p>
              )}
              {!loading && filteredLogs.length === 0 && (
                <p className="p-8 text-center text-sm text-muted-foreground">No logs found</p>
              )}
              {filteredLogs.map((log, idx) => {
                const Icon = actionIcons[log.action] || Shield;
                const severity = getSeverity(log.action);
                const details = typeof log.details === 'object'
                  ? JSON.stringify(log.details)
                  : String(log.details ?? '');
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={cn(
                      'flex items-start gap-4 p-4 transition-colors hover:bg-muted/30',
                      selectedLogs.has(log.id) && 'bg-primary/5'
                    )}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 rounded border-input"
                      checked={selectedLogs.has(log.id)}
                      onChange={() => toggleSelect(log.id)}
                    />
                    <div className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                      severityBg[severity]
                    )}>
                      <Icon className={cn('h-5 w-5', severityColors[severity])} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium capitalize">
                            {log.action.replace(/\./g, ' ').replace(/_/g, ' ')}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5 truncate max-w-lg">
                            {details}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-muted-foreground">
                              Resource: {log.resourceType}
                            </span>
                            {log.ipAddress && (
                              <span className="text-xs text-muted-foreground">
                                IP: {log.ipAddress}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <Badge
                            variant={
                              severity === 'critical'
                                ? 'destructive'
                                : severity === 'warning'
                                ? 'warning'
                                : 'secondary'
                            }
                          >
                            {severity}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatRelativeTime(log.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredLogs.length} of {totalElements} logs
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => fetchLogs(page - 1, filterAction || undefined)}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={logs.length < 50} onClick={() => fetchLogs(page + 1, filterAction || undefined)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
