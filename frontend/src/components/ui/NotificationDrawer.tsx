'use client';

import { X, Bell, Trash2, Info, AlertTriangle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';

interface Notification {
  id: string;
  message: string;
  time: string;
  type: string;
  read?: boolean;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onClearAll: () => void;
}

export default function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  onClearAll,
}: NotificationDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[400px] bg-background/90 backdrop-blur-2xl border-l border-border/50 shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Bell size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Notifications</h3>
                  <p className="text-xs text-muted-foreground">{notifications.length} updates pending</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-accent rounded-full transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-3">
                  <Bell size={48} />
                  <p className="text-sm font-medium">No new notifications</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-4 rounded-2xl border border-border/50 transition-all hover:bg-accent/30 flex gap-3",
                      !n.read && "bg-primary/5 border-primary/20 shadow-sm"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                      n.type === 'critical' ? 'bg-red-500/10 text-red-500' :
                      n.type === 'high' ? 'bg-orange-500/10 text-orange-500' :
                      'bg-blue-500/10 text-blue-500'
                    )}>
                      {n.type === 'critical' ? <AlertTriangle size={16} /> : 
                       n.type === 'high' ? <ShieldCheck size={16} /> : 
                       <Info size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed text-foreground font-medium">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                        <span className="inline-block w-1 h-1 rounded-full bg-border" />
                        {n.time}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-6 border-t border-border/50">
                <Button 
                  variant="outline" 
                  onClick={onClearAll}
                  className="w-full gap-2 rounded-xl"
                >
                  <Trash2 size={16} /> Clear All
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
