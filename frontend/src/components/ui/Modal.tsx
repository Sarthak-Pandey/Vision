'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className={cn(
          'w-full max-w-lg liquid-glass bg-[#0e1014]/95 rounded-2xl border border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in-0 zoom-in-95 duration-200',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* macOS Title Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-black/40 backdrop-blur-md select-none">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-110 transition-all flex items-center justify-center group"
              aria-label="Close"
            >
              <X className="w-2 h-2 text-black/80 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <span className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>

          <div className="text-center flex-1 px-4">
            <h3 className="text-xs font-semibold text-white/80 tracking-tight truncate">{title}</h3>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1 text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors focus-visible:outline-none"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {description && (
          <div className="px-6 pt-4 pb-1">
            <p className="text-xs text-white/50">{description}</p>
          </div>
        )}

        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

