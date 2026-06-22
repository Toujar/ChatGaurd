import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandPalette } from '@/components/ui/command-palette';
import { NotificationPanel } from '@/components/ui/notification-panel';
import { ProtectionDialog } from '@/components/protection/ProtectionDialog';
import { useUIStore } from '@/store';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <motion.main
        initial={false}
        animate={{ marginLeft: sidebarOpen ? 280 : 72 }}
        className="min-h-screen transition-all duration-200"
      >
        <Header />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 lg:p-6"
        >
          {children}
        </motion.div>
      </motion.main>
      <CommandPalette />
      <NotificationPanel />
      <ProtectionDialog />
    </div>
  );
}
