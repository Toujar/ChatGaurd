import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Shield,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useUIStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, getRiskColor, getRiskBg } from '@/lib/utils';
import type { RiskLevel } from '@/types';

const riskConfig: Record<RiskLevel, { color: string; icon: typeof AlertTriangle }> = {
  low: { color: 'text-emerald-400', icon: CheckCircle2 },
  medium: { color: 'text-amber-400', icon: AlertCircle },
  high: { color: 'text-orange-500', icon: AlertTriangle },
  critical: { color: 'text-red-500', icon: Shield },
};

const eventTypeLabels: Record<string, string> = {
  sensitive_send: 'Sensitive Message Detected',
  wrong_recipient: 'Potential Wrong Recipient',
  forward_confirm: 'Forward Protection',
  bulk_confirm: 'Bulk Message Warning',
  delete_confirm: 'Delete Confirmation',
  file_confirm: 'File Upload Review',
};

export function ProtectionDialog() {
  const { protectionDialog, hideProtectionDialog } = useUIStore();

  if (!protectionDialog) return null;

  const { type, riskLevel, message, details, onConfirm, onCancel } = protectionDialog;
  const config = riskConfig[riskLevel];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg rounded-2xl border border-border bg-card/95 backdrop-blur-xl p-6 shadow-2xl"
        >
          {/* Gradient border effect for critical/high risk */}
          {(riskLevel === 'critical' || riskLevel === 'high') && (
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-destructive/20 via-warning/20 to-destructive/20 opacity-50 blur-xl" />
          )}

          <div className="relative">
            {/* Header */}
            <div className="flex items-start gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl',
                  getRiskBg(riskLevel)
                )}
              >
                <config.icon className={cn('h-6 w-6', config.color)} />
              </motion.div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{eventTypeLabels[type] || 'Protection Alert'}</h2>
                  <Badge variant={riskLevel as 'low' | 'medium' | 'high' | 'critical'}>
                    {riskLevel.toUpperCase()}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{message}</p>
              </div>
              <button
                onClick={() => {
                  onCancel();
                  hideProtectionDialog();
                }}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Details */}
            {details && Object.keys(details).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-4 rounded-lg border border-border/50 bg-muted/30 p-4"
              >
                <div className="space-y-2 text-sm">
                  {Object.entries(details).map(([key, value]) => (
                    <div key={key} className="flex items-start gap-2">
                      <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Warning for high risk */}
            {(riskLevel === 'critical' || riskLevel === 'high') && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <p>
                  This action has been flagged as potentially risky. Please review carefully before proceeding.
                </p>
              </motion.div>
            )}

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  onCancel();
                  hideProtectionDialog();
                }}
              >
                Cancel
              </Button>
              <Button
                variant={riskLevel === 'critical' ? 'destructive' : 'default'}
                onClick={() => {
                  onConfirm();
                  hideProtectionDialog();
                }}
              >
                {riskLevel === 'critical' ? 'Proceed Anyway' : 'Confirm & Send'}
              </Button>
            </div>

            {/* Footer */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="mt-4 flex items-center gap-1 text-xs text-muted-foreground"
            >
              <Shield className="h-3 w-3" />
              Protected by ChatGuard Enterprise
            </motion.p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
