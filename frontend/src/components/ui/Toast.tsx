'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-status-success" />,
    error: <AlertCircle className="w-4 h-4 text-status-error" />,
    info: <Info className="w-4 h-4 text-brand-dark-orange" />,
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 bg-white border border-border rounded-xl shadow-lg text-xs font-medium text-primary-text animate-in slide-in-from-bottom-5 duration-200'
      )}
    >
      {icons[type]}
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="ml-auto text-muted-text hover:text-primary-text">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
