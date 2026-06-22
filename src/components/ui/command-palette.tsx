import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MessageSquare,
  LayoutDashboard,
  Settings,
  Users,
  Shield,
  BarChart3,
  FileText,
  ArrowRight,
  CornerDownLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/store';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const commands = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', shortcut: 'G D' },
  { icon: MessageSquare, label: 'Messages', path: '/chat', shortcut: 'G M' },
  { icon: Shield, label: 'Protection Center', path: '/protection', shortcut: 'G P' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics', shortcut: 'G A' },
  { icon: FileText, label: 'Audit Logs', path: '/audit', shortcut: 'G L' },
  { icon: Users, label: 'User Management', path: '/admin/users', shortcut: 'G U' },
  { icon: Settings, label: 'Settings', path: '/admin/settings', shortcut: 'G S' },
];

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
      if (commandPaletteOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((i) => (i + 1) % filteredCommands.length);
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((i) => (i - 1 + filteredCommands.length) % filteredCommands.length);
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          const cmd = filteredCommands[selectedIndex];
          if (cmd) {
            navigate(cmd.path);
            setCommandPaletteOpen(false);
            setSearch('');
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, filteredCommands, selectedIndex, navigate, setCommandPaletteOpen]);

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCommandPaletteOpen(false)}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-xl -translate-x-1/2 rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center border-b border-border/50 px-4">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Search commands..."
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                Quick Actions
              </p>
              {filteredCommands.length === 0 ? (
                <p className="px-2 py-4 text-sm text-muted-foreground text-center">
                  No commands found
                </p>
              ) : (
                <div className="space-y-1">
                  {filteredCommands.map((cmd, idx) => (
                    <button
                      key={cmd.path}
                      onClick={() => {
                        navigate(cmd.path);
                        setCommandPaletteOpen(false);
                        setSearch('');
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                        idx === selectedIndex
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <cmd.icon className="h-4 w-4" />
                      <span className="flex-1 text-left">{cmd.label}</span>
                      <span className="text-xs text-muted-foreground">{cmd.shortcut}</span>
                      <CornerDownLeft className="h-3 w-3 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-border/50 px-4 py-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <ArrowRight className="h-3 w-3" /> to select
              </span>
              <span className="flex items-center gap-1">
                <span className="font-mono">↑↓</span> to navigate
              </span>
              <span className="flex items-center gap-1">
                <span className="font-mono">esc</span> to close
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
