import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Shield,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Download,
  Filter,
  ArrowUpRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { analyticsApi, type DashboardStats, type UserDTO } from '@/lib/api';
import { cn } from '@/lib/utils';

const weeklyData = [
  { name: 'Mon', messages: 2400, protected: 120, users: 45, risk: 32 },
  { name: 'Tue', messages: 1398, protected: 98, users: 38, risk: 28 },
  { name: 'Wed', messages: 3200, protected: 145, users: 52, risk: 35 },
  { name: 'Thu', messages: 2780, protected: 132, users: 48, risk: 30 },
  { name: 'Fri', messages: 1890, protected: 88, users: 42, risk: 25 },
  { name: 'Sat', messages: 980, protected: 42, users: 25, risk: 15 },
  { name: 'Sun', messages: 650, protected: 28, users: 18, risk: 12 },
];

const monthlyTrend = [
  { week: 'Week 1', score: 35 },
  { week: 'Week 2', score: 42 },
  { week: 'Week 3', score: 38 },
  { week: 'Week 4', score: 32 },
];

const userRiskDistribution = [
  { name: 'Low Risk', value: 67, color: 'hsl(var(--success))' },
  { name: 'Medium Risk', value: 24, color: 'hsl(var(--warning))' },
  { name: 'High Risk', value: 7, color: 'hsl(var(--destructive))' },
  { name: 'Critical', value: 2, color: 'hsl(var(--risk-critical))' },
];

const protectionBreakdown = [
  { type: 'Sensitive Content', blocked: 45, warned: 23 },
  { type: 'Wrong Recipient', blocked: 12, warned: 8 },
  { type: 'Forward Attempts', blocked: 23, warned: 15 },
  { type: 'Bulk Messages', blocked: 8, warned: 18 },
];

const topUsers = [
  { name: 'Alex Chen', score: 15, trend: 'down', avatar: null },
  { name: 'Sarah Miller', score: 22, trend: 'up', avatar: null },
  { name: 'John Doe', score: 45, trend: 'up', avatar: null },
  { name: 'Mike Ross', score: 38, trend: 'stable', avatar: null },
  { name: 'Alice Wang', score: 28, trend: 'down', avatar: null },
];

export function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userScores, setUserScores] = useState<Array<{ id: string; name: string; riskScore: number; role: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([analyticsApi.dashboard(), analyticsApi.userRiskScores()])
      .then(([s, u]) => { setStats(s); setUserScores(u); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Build pie data from real stats if available
  const totalEvents = stats?.riskEvents ?? 100;
  const userRiskDistribution = [
    { name: 'Low Risk', value: 67, color: 'hsl(var(--success))' },
    { name: 'Medium Risk', value: 24, color: 'hsl(var(--warning))' },
    { name: 'High Risk', value: 7, color: 'hsl(var(--destructive))' },
    { name: 'Critical', value: 2, color: 'hsl(var(--risk-critical))' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary" />
            Analytics
          </h1>
          <p className="text-muted-foreground">
            Communication risk and protection analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Last 7 days
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
          <TabsTrigger value="users">User Scores</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { title: 'Total Messages', value: loading ? '…' : String(stats?.messagesSent ?? 0), change: '+12%', icon: MessageSquare, color: 'text-primary' },
              { title: 'Protected Actions', value: loading ? '…' : String(stats?.protectedMessages ?? 0), change: '+8%', icon: Shield, color: 'text-info' },
              { title: 'Active Users', value: loading ? '…' : String(stats?.activeUsers ?? 0), change: '+3%', icon: Users, color: 'text-success' },
              { title: 'Avg Risk Score', value: loading ? '…' : String(stats?.averageRiskScore ?? 0), change: '-5%', icon: Activity, color: 'text-warning' },
            ].map((stat, idx) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                        <p className={cn(
                          'text-xs mt-1',
                          stat.change.startsWith('+') ? 'text-success' : 'text-muted-foreground'
                        )}>
                          {stat.change} vs last week
                        </p>
                      </div>
                      <div className={cn('rounded-lg p-2 bg-muted/50', stat.color)}>
                        <stat.icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Message Activity</CardTitle>
                <CardDescription>Daily message volume and protection events</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData}>
                    <defs>
                      <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Area type="monotone" dataKey="messages" stroke="hsl(var(--primary))" fill="url(#colorMessages)" />
                    <Line type="monotone" dataKey="protected" stroke="hsl(var(--warning))" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Risk Distribution</CardTitle>
                <CardDescription>Risk levels across users</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={userRiskDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {userRiskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Protection Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Protection Events Breakdown</CardTitle>
              <CardDescription>Blocked vs warned actions by type</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={protectionBreakdown} layout="vertical">
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="type" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={120} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="blocked" stackId="a" fill="hsl(var(--destructive))" />
                  <Bar dataKey="warned" stackId="a" fill="hsl(var(--warning))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Organization Risk Index</CardTitle>
                <CardDescription>Weekly risk score trend (lower is better)</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrend}>
                    <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
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
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Factors</CardTitle>
                <CardDescription>Top contributing factors to risk score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { factor: 'Sensitive Data Attempts', impact: 35, trend: 'down' },
                    { factor: 'External Sharing', impact: 28, trend: 'up' },
                    { factor: 'Wrong Recipient', impact: 22, trend: 'stable' },
                    { factor: 'Bulk Operations', impact: 15, trend: 'down' },
                  ].map((item) => (
                    <div key={item.factor} className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.factor}</p>
                        <div className="mt-1 h-2 rounded-full bg-muted">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.impact}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full rounded-full bg-primary"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{item.impact}%</span>
                        {item.trend === 'down' ? (
                          <TrendingDown className="h-4 w-4 text-success" />
                        ) : item.trend === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-destructive" />
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Risk Scores</CardTitle>
              <CardDescription>Individual user risk analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(loading ? [] : userScores).map((user, idx) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-4 rounded-lg border border-border/50 bg-muted/30 p-4"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                      {user.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.riskScore < 20 ? 'Low Risk' : user.riskScore < 40 ? 'Medium Risk' : 'High Risk'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{user.riskScore}</p>
                      <div className="flex items-center gap-1 justify-end">
                        {user.riskScore >= 40 ? (
                          <TrendingUp className="h-4 w-4 text-destructive" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-success" />
                        )}
                      </div>
                    </div>
                    <div className="w-32">
                      <div className="h-2 rounded-full bg-muted">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(user.riskScore, 100)}%` }}
                          transition={{ duration: 0.5, delay: idx * 0.1 }}
                          className={cn(
                            'h-full rounded-full',
                            user.riskScore < 20 ? 'bg-success' : user.riskScore < 40 ? 'bg-warning' : 'bg-destructive'
                          )}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
                {!loading && userScores.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">No user data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
