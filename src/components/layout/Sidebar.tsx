import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Users,
  Shield,
  BarChart3,
  Settings,
  Bell,
  Search,
  LayoutDashboard,
  FileText,
  ChevronDown,
  Plus,
  Hash,
  Lock,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore, useChatStore, useUIStore } from '@/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: MessageSquare, label: 'Messages', path: '/chat' },
  { icon: Shield, label: 'Protection', path: '/protection' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: FileText, label: 'Audit Logs', path: '/audit' },
];

const adminItems = [
  { icon: Users, label: 'Users', path: '/admin/users' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

export function Sidebar() {
  const [channelsExpanded, setChannelsExpanded] = useState(true);
  const location = useLocation();
  const { user } = useAuthStore();
  const { channels, activeChannel, setActiveChannel } = useChatStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 280 : 72 }}
      className="fixed left-0 top-0 z-40 h-screen border-r border-border/50 bg-card/50 backdrop-blur-xl flex flex-col"
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border/50 px-4">
        <Link to="/dashboard" className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-info"
          >
            <Shield className="h-5 w-5 text-primary-foreground" />
          </motion.div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col"
              >
                <span className="font-semibold text-foreground">ChatGuard</span>
                <span className="text-xs text-muted-foreground">Enterprise</span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Search */}
      {sidebarOpen && (
        <div className="px-3 py-3">
          <button
            onClick={() => {}}
            className="flex w-full items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
          >
            <Search className="h-4 w-4" />
            <span>Search</span>
            <kbd className="ml-auto text-xs">⌘K</kbd>
          </button>
        </div>
      )}

      <ScrollArea className="flex-1 px-2">
        {/* Main Navigation */}
        <nav className="space-y-1 pb-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Tooltip key={item.path} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.path}
                    className={cn(
                      'sidebar-item',
                      isActive && 'active'
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <AnimatePresence>
                      {sidebarOpen && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-sm font-medium"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                </TooltipTrigger>
                {!sidebarOpen && (
                  <TooltipContent side="right">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>

        {/* Channels Section */}
        {sidebarOpen && (
          <div className="py-2">
            <button
              onClick={() => setChannelsExpanded(!channelsExpanded)}
              className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase text-muted-foreground"
            >
              <span>Channels</span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  channelsExpanded && 'rotate-180'
                )}
              />
            </button>
            <AnimatePresence>
              {channelsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-0.5 pt-1">
                    {channels.map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() => setActiveChannel(channel)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors',
                          activeChannel?.id === channel.id
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        {channel.type === 'private' ? (
                          <Lock className="h-4 w-4 shrink-0" />
                        ) : (
                          <Hash className="h-4 w-4 shrink-0" />
                        )}
                        <span className="truncate">{channel.name}</span>
                        {channel.sensitivity_level !== 'normal' && (
                          <Badge variant="warning" className="ml-auto text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            {channel.sensitivity_level}
                          </Badge>
                        )}
                      </button>
                    ))}
                    <button className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                      <Plus className="h-4 w-4" />
                      <span>Add Channel</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Admin Section */}
        {user?.role === 'admin' && (
          <div className="border-t border-border/50 pt-4">
            {sidebarOpen && (
              <span className="px-3 text-xs font-semibold uppercase text-muted-foreground">
                Admin
              </span>
            )}
            <nav className="mt-2 space-y-1">
              {adminItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Tooltip key={item.path} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Link
                        to={item.path}
                        className={cn(
                          'sidebar-item',
                          isActive && 'active'
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        <AnimatePresence>
                          {sidebarOpen && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="text-sm font-medium"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Link>
                    </TooltipTrigger>
                    {!sidebarOpen && (
                      <TooltipContent side="right">
                        {item.label}
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </nav>
          </div>
        )}
      </ScrollArea>

      {/* User Profile */}
      <div className="border-t border-border/50 p-3">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.avatar_url || undefined} />
                <AvatarFallback>
                  {user?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 overflow-hidden text-left"
                  >
                    <p className="truncate text-sm font-medium">
                      {user?.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {user?.role}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </TooltipTrigger>
          {!sidebarOpen && (
            <TooltipContent side="right">
              {user?.full_name}
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </motion.aside>
  );
}
