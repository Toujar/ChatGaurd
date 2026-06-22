import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Shield,
  MoreVertical,
  Check,
  X,
  Mail,
  UserPlus,
  Filter,
  Download,
  Key,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { adminApi, type UserDTO } from '@/lib/api';
import { cn, getInitials, formatRelativeTime } from '@/lib/utils';
import { useAuthStore } from '@/store';

interface MockUser {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: 'admin' | 'manager' | 'employee';
  status: 'active' | 'suspended' | 'pending';
  risk_score: number;
  last_active: string;
}

const mockUsers: MockUser[] = [
  { id: '1', full_name: 'Alex Chen', email: 'alex@company.com', avatar_url: null, role: 'admin', status: 'active', risk_score: 15, last_active: new Date(Date.now() - 300000).toISOString() },
  { id: '2', full_name: 'Sarah Miller', email: 'sarah@company.com', avatar_url: null, role: 'manager', status: 'active', risk_score: 22, last_active: new Date(Date.now() - 600000).toISOString() },
  { id: '3', full_name: 'John Doe', email: 'john@company.com', avatar_url: null, role: 'employee', status: 'active', risk_score: 45, last_active: new Date(Date.now() - 3600000).toISOString() },
  { id: '4', full_name: 'Mike Ross', email: 'mike@company.com', avatar_url: null, role: 'employee', status: 'suspended', risk_score: 78, last_active: new Date(Date.now() - 86400000).toISOString() },
  { id: '5', full_name: 'Alice Wang', email: 'alice@company.com', avatar_url: null, role: 'manager', status: 'active', risk_score: 18, last_active: new Date(Date.now() - 1800000).toISOString() },
  { id: '6', full_name: 'Bob Smith', email: 'bob@company.com', avatar_url: null, role: 'employee', status: 'pending', risk_score: 0, last_active: new Date(Date.now() - 604800000).toISOString() },
  { id: '7', full_name: 'Emily Davis', email: 'emily@company.com', avatar_url: null, role: 'employee', status: 'active', risk_score: 32, last_active: new Date(Date.now() - 7200000).toISOString() },
  { id: '8', full_name: 'Chris Johnson', email: 'chris@company.com', avatar_url: null, role: 'employee', status: 'active', risk_score: 28, last_active: new Date(Date.now() - 900000).toISOString() },
];

export function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, suspended: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    Promise.all([
      adminApi.getUsers(0, 200, roleFilter || undefined),
      adminApi.getStatistics(),
    ])
      .then(([page, s]) => {
        setUsers(page.content);
        setStats({
          total: s.totalUsers,
          active: s.activeUsers,
          suspended: s.suspendedUsers,
          pending: s.pendingUsers,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [roleFilter]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await adminApi.updateUserStatus(id, status);
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: status as UserDTO['status'] } : u));
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return user.fullName?.toLowerCase().includes(q) || user.email?.toLowerCase().includes(q);
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default">Admin</Badge>;
      case 'manager':
        return <Badge variant="warning">Manager</Badge>;
      default:
        return <Badge variant="outline">Employee</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return null;
    }
  };

  const getRiskColor = (score: number) => {
    if (score < 20) return 'text-success';
    if (score < 40) return 'text-warning';
    if (score < 60) return 'text-orange-500';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            User Management
          </h1>
          <p className="text-muted-foreground">
            Manage organization users and permissions
          </p>
        </div>
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>
                Send an invitation to join your organization
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input placeholder="user@company.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsInviteOpen(false)}>
                <Mail className="mr-2 h-4 w-4" />
                Send Invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total Users', value: stats.total, icon: Users },
          { label: 'Active', value: stats.active, icon: Check },
          { label: 'Suspended', value: stats.suspended, icon: X },
          { label: 'Pending', value: stats.pending, icon: Mail },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <stat.icon className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
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
                placeholder="Search users..."
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={roleFilter === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRoleFilter(null)}
              >
                All
              </Button>
              <Button
                variant={roleFilter === 'ADMIN' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRoleFilter('ADMIN')}
              >
                Admins
              </Button>
              <Button
                variant={roleFilter === 'MANAGER' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRoleFilter('MANAGER')}
              >
                Managers
              </Button>
              <Button
                variant={roleFilter === 'EMPLOYEE' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRoleFilter('EMPLOYEE')}
              >
                Employees
              </Button>
            </div>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {loading && <p className="p-8 text-center text-sm text-muted-foreground">Loading users…</p>}
            {!loading && filteredUsers.length === 0 && (
              <p className="p-8 text-center text-sm text-muted-foreground">No users found</p>
            )}
            {filteredUsers.map((user, idx) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatarUrl || undefined} />
                  <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{user.fullName}</p>
                    {user.id === currentUser?.id && (
                      <Badge variant="outline" className="text-xs">You</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex items-center gap-4">
                  {getRoleBadge(user.role?.toLowerCase())}
                  {getStatusBadge(user.status?.toLowerCase())}
                  <div className="text-right">
                    <p className={cn('text-sm font-medium', getRiskColor(user.riskScore ?? 0))}>
                      Risk: {user.riskScore ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.lastLoginAt ? `Last login ${formatRelativeTime(user.lastLoginAt)}` : 'Never logged in'}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Key className="mr-2 h-4 w-4" />
                        Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {user.status === 'ACTIVE' ? (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleStatusChange(user.id, 'SUSPENDED')}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Suspend
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          className="text-success"
                          onClick={() => handleStatusChange(user.id, 'ACTIVE')}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Activate
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminSettingsPage() {
  const { organization } = useAuthStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-7 w-7 text-primary" />
          Organization Settings
        </h1>
        <p className="text-muted-foreground">
          Configure organization-wide settings and preferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
            <CardDescription>Basic organization information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Organization Name</label>
              <Input defaultValue={organization?.name || 'My Organization'} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Organization Slug</label>
              <Input defaultValue={organization?.slug || 'my-org'} />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Authentication and security options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  Require 2FA for all users
                </p>
              </div>
              <input type="checkbox" className="rounded border-input" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Session Timeout</p>
                <p className="text-sm text-muted-foreground">
                  Auto-logout after inactivity
                </p>
              </div>
              <select className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option>15 minutes</option>
                <option>30 minutes</option>
                <option>1 hour</option>
                <option>Never</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">IP Whitelist</p>
                <p className="text-sm text-muted-foreground">
                  Restrict access to specific IPs
                </p>
              </div>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Retention</CardTitle>
            <CardDescription>How long to keep data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Message History</p>
                <p className="text-sm text-muted-foreground">
                  Delete messages after
                </p>
              </div>
              <select className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option>30 days</option>
                <option>90 days</option>
                <option>1 year</option>
                <option>Forever</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Audit Logs</p>
                <p className="text-sm text-muted-foreground">
                  Keep audit history for
                </p>
              </div>
              <select className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option>90 days</option>
                <option>1 year</option>
                <option>7 years</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-destructive">Reset All Settings</p>
                  <p className="text-sm text-muted-foreground">
                    Restore all settings to defaults
                  </p>
                </div>
                <Button variant="destructive" size="sm">Reset</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
