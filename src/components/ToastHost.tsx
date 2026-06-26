import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import type { AppNotification } from '../services/notifications';

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info
};

export const ToastHost: React.FC = () => {
  const [items, setItems] = useState<AppNotification[]>([]);

  useEffect(() => {
    const handleNotify = (event: Event) => {
      const notification = (event as CustomEvent<AppNotification>).detail;
      setItems(current => [...current, notification].slice(-4));

      window.setTimeout(() => {
        setItems(current => current.filter(item => item.id !== notification.id));
      }, 5200);
    };

    window.addEventListener('novelsynth:notify', handleNotify);
    return () => window.removeEventListener('novelsynth:notify', handleNotify);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {items.map(item => {
        const Icon = icons[item.tone];
        return (
          <div key={item.id} className={`toast toast-${item.tone}`}>
            <Icon size={18} className="toast-icon" />
            <div className="toast-content">
              <strong>{item.title}</strong>
              {item.message && <span>{item.message}</span>}
            </div>
            <button
              type="button"
              className="btn-icon toast-close"
              onClick={() => setItems(current => current.filter(currentItem => currentItem.id !== item.id))}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
