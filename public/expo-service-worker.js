/* eslint-env serviceworker */

// Expo 웹 푸시 알림을 위한 기본 서비스 워커 설정입니다.
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '알림';
  const options = {
    body: data.body || '',
    icon: data.icon || './assets/icon.png', // 아이콘 경로 확인 필요 (기본값)
    badge: data.badge || './assets/icon.png',
    data: data.data,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // 알림 클릭 시 앱 열기 (필요 시 URL 수정)
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/');
    })
  );
});