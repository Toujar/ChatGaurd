import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  MessageSquare,
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthStore } from '@/store';
import { analyticsApi, type DashboardStats } from '@/lib/api';
import { cn, formatNumber, formatRelativeTime } from '@/lib/utils';

const messageData = [
  { date: 'Mon', sent: 240, protected: 12 },
  { date: 'Tue', sent: 320, protected: 18 },
  { date: 'Wed', sent: 280, protected: 15 },
  { date: 'Thu', sent: 450, protected: 22 },
  { date: 'Fri', sent: 380, protected: 19 },
  { date: 'Sat', sent: 120, protected: 5 },
  { date: 'Sun', sent: 95, protected: 4 },
];

const riskData = [
  { name: 'W', score: 42 },
  { name: 'T', score: 38 },
  { name: 'F', score: 45 },
  { name: 'S', score: 40 },
  { name: 'S', score: 35 },
  { name: 'M', score: 32 },
  { name: 'T', score: 28 },
];

const categoryData = [
  { name: 'Sensitive', value: 45, color: 'hsl(var(--warning))' },
  { name: 'Wrong Recipient', value: 23, color: 'hsl(var(--destructive))' },
  { name: 'Forward', value: 18, color: 'hsl(var(--info))' },
  { name: 'Bulk', value: 14, color: 'hsl(var(--primary))' },
];

const recentIncidents = [
  { id: 1, type: 'sensitive', message: 'Credit card detected in message', user: 'John D.', time: '2m ago', status: 'blocked' },
  { id: 2, type: 'wrong_recipient', message: 'External recipient flagged', user: 'Sarah M.', time: '15m ago', status: 'confirmed' },
  { id: 3, type: 'forward', message: 'Sensitive message forward attempt', user: 'Mike R.', time: '1h ago', status: 'blocked' },
  { id: 4, type: 'bulk', message: 'Mass message to 15 channels', user: 'Alice W.', time: '3h ago', status: 'warned' },
];

export function DashboardPage() {
  const { organization } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    analyticsApi.dashboard()
      .then(setStats)
      .catch(console.error)
      .finally(() => setStatsLoading(false));
  }, []);

  const statCards = [
    {
      title: 'Active Users',
      value: statsLoading ? '…' : formatNumber(stats?.activeUsers ?? 0),
      change: '+12%',
      icon: Users,
      trend: 'up' as const,
      color: 'text-primary',
    },
    {
      title: 'Messages Sent',
      value: statsLoading ? '…' : formatNumber(stats?.messagesSent ?? 0),
      change: '+8%',
      icon: MessageSquare,
      trend: 'up' as const,
      color: 'text-info',
    },
    {
      title: 'Risk Events',
      value: statsLoading ? '…' : formatNumber(stats?.riskEvents ?? 0),
      change: '-5%',
      icon: AlertTriangle,
      trend: 'down' as const,
      color: 'text-warning',
    },
    {
      title: 'Protected Messages',
      value: statsLoading ? '…' : formatNumber(stats?.protectedMessages ?? 0),
      change: '+23%',
      icon: Shield,
      trend: 'up' as const,
      color: 'text-success',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {organization?.name || 'Your Organization'} - Real-time protection overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Clock className="mr-2 h-4 w-4" />
            Last 24 hours
          </Button>
          <Button variant="default" size="sm">
            <Activity className="mr-2 h-4 w-4" />
            Live Mode
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <div className={cn(
                      'flex items-center gap-1 mt-1 text-sm',
                      stat.trend === 'up' ? 'text-success' : 'text-muted-foreground'
                    )}>
                      {stat.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span>{stat.change}</span>
                      <span className="text-muted-foreground">vs last week</span>
                    </div>
                  </div>
                  <div className={cn('rounded-xl p-3 bg-muted/50', stat.color)}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Message Volume Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Message Volume</CardTitle>
            <CardDescription>Daily messages sent and protected actions</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={messageData}>
                <defs>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProtected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sent"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorSent)"
                />
                <Area
                  type="monotone"
                  dataKey="protected"
                  stroke="hsl(var(--warning))"
                  fillOpacity={1}
                  fill="url(#colorProtected)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Score Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Index</CardTitle>
            <CardDescription>Organization risk score trend</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={riskData}>
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Protection Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Protection Categories</CardTitle>
            <CardDescription>Distribution of protection events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryData.map((category) => (
                <div key={category.name} className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{category.name}</span>
                      <span className="text-sm font-medium">{category.value}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${category.value}%` }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Incidents */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Incidents</CardTitle>
              <CardDescription>Latest protection events</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              View all
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px]">
              <div className="space-y-3">
                {recentIncidents.map((incident, idx) => (
                  <motion.div
                    key={incident.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-4 rounded-lg border border-border/50 bg-muted/30 p-3"
                  >
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg',
                      incident.status === 'blocked' ? 'bg-destructive/10' : 'bg-success/10'
                    )}>
                      {incident.status === 'blocked' ? (
                        <XCircle className="h-5 w-5 text-destructive" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{incident.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {incident.user} • {incident.time}
                      </p>
                    </div>
                    <Badge variant={incident.status === 'blocked' ? 'destructive' : 'success'}>
                      {incident.status}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Protected Conversation Banner */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-info/5">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Your organization is protected</h3>
            <p className="text-sm text-muted-foreground">
              ChatGuard has prevented 89 potential data leaks this week
            </p>
          </div>
          <Button variant="outline">
            View Report
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
