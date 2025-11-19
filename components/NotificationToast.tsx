import React, { useEffect } from 'react';
import { Notification } from '../types';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface Props {
  notification: Notification;
  onDismiss: (id: string) => void;
}

export const NotificationToast: React.FC<Props> = ({ notification, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(notification.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  const bgColors = {
    success: 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400',
    error: 'bg-red-500/10 border-red-500/50 text-red-400',
    info: 'bg-blue-500/10 border-blue-500/50 text-blue-400',
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-md transition-all duration-300 ${bgColors[notification.type]} mb-3`}>
      <span className="shrink-0">{icons[notification.type]}</span>
      <p className="text-sm font-medium">{notification.message}</p>
      <button 
        onClick={() => onDismiss(notification.id)}
        className="ml-auto hover:opacity-70 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
