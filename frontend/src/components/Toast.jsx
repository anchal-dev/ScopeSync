import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import clsx from 'clsx';

export default function Toast({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const borderColors = {
    success: 'border-emerald-500/20 bg-emerald-50/90 text-emerald-950 backdrop-blur-md shadow-emerald-500/5',
    error: 'border-red-500/20 bg-red-50/90 text-red-950 backdrop-blur-md shadow-red-500/5',
    info: 'border-blue-500/20 bg-blue-50/90 text-blue-950 backdrop-blur-md shadow-blue-500/5',
  };

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={clsx(
            'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl transition-all duration-300 transform translate-y-0 opacity-100 animate-slide-in',
            borderColors[t.type] || borderColors.info
          )}
        >
          <div className="shrink-0 mt-0.5">{icons[t.type] || icons.info}</div>
          <div className="flex-1 text-sm font-medium leading-relaxed">{t.message}</div>
          <button
            onClick={() => removeToast(t.id)}
            className="shrink-0 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
