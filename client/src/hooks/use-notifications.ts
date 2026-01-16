import { useEffect, useState, useCallback } from 'react';

const NOTIFICATION_MESSAGES = [
  { title: "دلّيني", body: "اشتقنا لك! تعال شوف العروض الجديدة 🎁" },
  { title: "دلّيني", body: "دلّيني ينتظرك! اكتشف أفضل المحلات حولك ✨" },
  { title: "دلّيني", body: "عروض حصرية بانتظارك! لا تفوّتها 🔥" },
  { title: "دلّيني", body: "هل جربت البحث عن محلات جديدة؟ دلّيني يساعدك! 🗺️" },
  { title: "دلّيني", body: "وقت الاستكشاف! شوف شنو الجديد في منطقتك 🌟" }
];

const NOTIFICATION_INTERVAL_DAYS = 4;
const NOTIFICATION_STORAGE_KEY = 'delini_last_notification';
const NOTIFICATION_PERMISSION_KEY = 'delini_notification_permission_asked';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'true');
      
      if (result === 'granted') {
        localStorage.setItem(NOTIFICATION_STORAGE_KEY, Date.now().toString());
        scheduleNextNotification();
      }
      
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const showNotification = useCallback((messageIndex: number = 4) => {
    if (permission !== 'granted') return;
    
    const message = NOTIFICATION_MESSAGES[messageIndex];
    
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(message.title, {
          body: message.body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          dir: 'rtl',
          lang: 'ar',
          data: { url: '/' }
        } as NotificationOptions);
      });
    } else {
      new Notification(message.title, {
        body: message.body,
        icon: '/favicon.ico',
        dir: 'rtl',
        lang: 'ar'
      });
    }
    
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, Date.now().toString());
  }, [permission]);

  const scheduleNextNotification = useCallback(() => {
    const intervalMs = NOTIFICATION_INTERVAL_DAYS * 24 * 60 * 60 * 1000;
    
    setTimeout(() => {
      if (Notification.permission === 'granted') {
        showNotification(4);
        scheduleNextNotification();
      }
    }, intervalMs);
  }, [showNotification]);

  const checkAndShowNotification = useCallback(() => {
    if (permission !== 'granted') return;
    
    const lastNotification = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    const intervalMs = NOTIFICATION_INTERVAL_DAYS * 24 * 60 * 60 * 1000;
    
    if (!lastNotification) {
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, Date.now().toString());
      scheduleNextNotification();
      return;
    }
    
    const timeSinceLastNotification = Date.now() - parseInt(lastNotification, 10);
    
    if (timeSinceLastNotification >= intervalMs) {
      showNotification(4);
      scheduleNextNotification();
    } else {
      const remainingTime = intervalMs - timeSinceLastNotification;
      setTimeout(() => {
        if (Notification.permission === 'granted') {
          showNotification(4);
          scheduleNextNotification();
        }
      }, remainingTime);
    }
  }, [permission, showNotification, scheduleNextNotification]);

  const shouldAskPermission = useCallback(() => {
    if (!isSupported) return false;
    if (permission !== 'default') return false;
    
    const alreadyAsked = localStorage.getItem(NOTIFICATION_PERMISSION_KEY);
    return !alreadyAsked;
  }, [isSupported, permission]);

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
    checkAndShowNotification,
    shouldAskPermission
  };
}
