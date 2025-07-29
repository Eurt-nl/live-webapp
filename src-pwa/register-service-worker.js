import { register } from 'register-service-worker';

if (process.env.NODE_ENV === 'production') {
  // Gebruik BASE_URL als het beschikbaar is, anders gebruik een relatieve URL
  const baseUrl = process.env.BASE_URL || '/';
  const swUrl = `${baseUrl}sw.js`;

  console.log('🔧 Registering service worker with URL:', swUrl);

  register(swUrl, {
    ready() {
      console.log('✅ App is being served from cache by a service worker.');
    },
    registered(registration) {
      console.log('✅ Service worker has been registered:', registration);

      // Controleer regelmatig op updates
      setInterval(
        () => {
          registration.update();
        },
        1000 * 60 * 60,
      ); // Elke uur controleren
    },
    cached() {
      console.log('✅ Content has been cached for offline use.');
    },
    updatefound() {
      console.log('🔄 New content is downloading.');
    },
    updated(registration) {
      console.log('🔄 New content is available; please refresh.');
      // Stuur een bericht naar de client dat er een update beschikbaar is
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    },
    offline() {
      console.log('⚠️ No internet connection found. App is running in offline mode.');
    },
    error(error) {
      console.error('❌ Error during service worker registration:', error);
    },
  });
} else {
  // In development mode, registreer ook de service worker
  console.log('🔧 Development mode: registering service worker...');

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ Service worker registered in development:', registration);
      })
      .catch((error) => {
        console.error('❌ Service worker registration failed in development:', error);
      });
  }
}
