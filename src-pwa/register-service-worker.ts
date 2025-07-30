import { register } from 'register-service-worker';
import { Notify } from 'quasar';

// Simple translation function for service worker context
const $customT = (key: string): string => {
  const translations: Record<string, Record<string, string>> = {
    nl: {
      'serviceWorker.newVersionDownloading': 'Nieuwe versie beschikbaar, wordt gedownload...',
      'serviceWorker.newVersionAvailable': 'Nieuwe versie beschikbaar! Klik om te vernieuwen.',
      'serviceWorker.refresh': 'Vernieuwen',
      'serviceWorker.offlineMessage':
        'Je bent offline. Sommige functies zijn mogelijk niet beschikbaar.',
    },
    en: {
      'serviceWorker.newVersionDownloading': 'New version available, downloading...',
      'serviceWorker.newVersionAvailable': 'New version available! Click to refresh.',
      'serviceWorker.refresh': 'Refresh',
      'serviceWorker.offlineMessage': 'You are offline. Some features may not be available.',
    },
  };

  // Default to Dutch, fallback to English
  const locale = navigator.language?.startsWith('nl') ? 'nl' : 'en';
  return translations[locale]?.[key] || translations.en[key] || key;
};

// The ready(), registered(), cached(), updatefound() and updated()
// events passes a ServiceWorkerRegistration instance in their arguments.
// ServiceWorkerRegistration: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration

register(process.env.SERVICE_WORKER_FILE, {
  // The registrationOptions object will be passed as the second argument
  // to ServiceWorkerContainer.register()
  // https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register#Parameter

  // registrationOptions: { scope: './' },

  ready(/* registration */) {
    console.log('Service worker is actief.');
  },

  registered(/* registration */) {
    console.log('Service worker is geregistreerd.');
  },

  cached(/* registration */) {
    console.log('Inhoud is gecached voor offline gebruik.');
  },

  updatefound(/* registration */) {
    console.log('Nieuwe inhoud wordt gedownload.');
    Notify.create({
      message: $customT('serviceWorker.newVersionDownloading'),
      color: 'info',
      position: 'top',
      timeout: 3000,
    });
  },

  updated(/* registration */) {
    console.log('Nieuwe inhoud is beschikbaar; vernieuw de pagina.');
    Notify.create({
      message: $customT('serviceWorker.newVersionAvailable'),
      color: 'positive',
      position: 'top',
      timeout: 0,
      actions: [
        {
          label: $customT('serviceWorker.refresh'),
          color: 'white',
          handler: () => {
            // Send message to main thread to reload
            navigator.serviceWorker.controller?.postMessage({ type: 'RELOAD' });
          },
        },
      ],
    });
  },

  offline() {
    console.log('Geen internetverbinding gevonden. App draait in offline modus.');
    Notify.create({
      message: $customT('serviceWorker.offlineMessage'),
      color: 'warning',
      position: 'top',
      timeout: 5000,
    });
  },

  error(err) {
    console.error('Fout tijdens service worker registratie:', err);
  },
});
