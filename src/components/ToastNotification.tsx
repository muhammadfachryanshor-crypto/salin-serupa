import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastNotificationProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-lg border text-sm font-medium transition-all transform translate-y-0 animate-in fade-in slide-in-from-top-2 duration-200 ${
            toast.type === 'success'
              ? 'bg-white border-green-200 text-slate-800 border-l-4 border-l-green-600'
              : toast.type === 'error'
              ? 'bg-white border-red-200 text-slate-800 border-l-4 border-l-red-600'
              : 'bg-white border-blue-200 text-slate-800 border-l-4 border-l-[#00288e]'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-[#00288e] shrink-0" />}
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
