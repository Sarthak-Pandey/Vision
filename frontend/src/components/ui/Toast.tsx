import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose, className }) => {
  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />,
    info: <Info className="w-4 h-4 text-sky-500 shrink-0" />,
  };

  return (
    <div
      className={cn(
        'fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-lg shadow-lg text-xs font-medium text-foreground animate-in slide-in-from-bottom-5 duration-200',
        className
      )}
    >
      {icons[type]}
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-2 text-muted-foreground hover:text-foreground p-0.5 rounded-md transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
