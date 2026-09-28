import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, CheckCircle2 } from 'lucide-react';

export const OfflineStatusBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnectedAlert, setShowReconnectedAlert] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnectedAlert(true);
      const timer = setTimeout(() => {
        setShowReconnectedAlert(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnectedAlert(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // عند عودة الاتصال
  if (showReconnectedAlert) {
    return (
      <div className="w-full bg-emerald-950/90 border-b border-emerald-500/40 px-3 py-2 text-emerald-200 text-xs flex items-center justify-center gap-2 animate-fade-in shadow-md">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="font-semibold">تمت استعادة الاتصال بالإنترنت - يتم المزامنة تلقائياً.</span>
      </div>
    );
  }

  // عند انقطاع الإنترنت (وضع عدم الاتصال)
  if (!isOnline) {
    return (
      <div className="w-full bg-amber-950/90 border-b border-amber-500/40 px-3 py-2 text-amber-200 text-xs flex items-center justify-center gap-2 animate-fade-in shadow-md">
        <WifiOff className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          <span className="font-bold">وضع عدم الاتصال:</span>
          <span>بطاقاتك وحساباتك محفوظة محلياً وتعمل بكامل وظائفها بدون إنترنت.</span>
        </div>
      </div>
    );
  }

  return null;
};
