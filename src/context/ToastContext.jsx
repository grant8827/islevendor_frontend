import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [message, setMessage] = useState(null);

  const notify = useCallback((msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      {message && (
        <div className="fixed top-20 right-5 z-[60] max-w-sm bg-white text-slate-900 border border-slate-200 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-700">{message}</p>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
