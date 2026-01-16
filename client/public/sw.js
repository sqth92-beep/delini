// Service Worker for Delini Push Notifications

const NOTIFICATION_MESSAGES = [
  { title: "دلّيني", body: "اشتقنا لك! تعال شوف العروض الجديدة 🎁" },
  { title: "دلّيني", body: "دلّيني ينتظرك! اكتشف أفضل المحلات حولك ✨" },
  { title: "دلّيني", body: "عروض حصرية بانتظارك! لا تفوّتها 🔥" },
  { title: "دلّيني", body: "هل جربت البحث عن محلات جديدة؟ دلّيني يساعدك! 🗺️" },
  { title: "دلّيني", body: "وقت الاستكشاف! شوف شنو الجديد في منطقتك 🌟" }
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  const messageIndex = 4;
  const message = NOTIFICATION_MESSAGES[messageIndex];
  
  const options = {
    body: message.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      url: '/'
    },
    dir: 'rtl',
    lang: 'ar'
  };

  event.waitUntil(
    self.registration.showNotification(message.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
