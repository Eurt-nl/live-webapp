import { register } from 'register-service-worker';
import { Notify } from 'quasar';

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
      message: 'Nieuwe versie beschikbaar, wordt gedownload...',
      color: 'info',
      position: 'top',
      timeout: 3000,
    });
  },

  updated(/* registration */) {
    console.log('Nieuwe inhoud is beschikbaar; vernieuw de pagina.');
    Notify.create({
      message: 'Nieuwe versie beschikbaar! Klik om te vernieuwen.',
      color: 'positive',
      position: 'top',
      timeout: 0,
      actions: [
        {
          label: 'Vernieuwen',
          color: 'white',
          handler: () => {
            window.location.reload();
          },
        },
      ],
    });
  },

  offline() {
    console.log('Geen internetverbinding gevonden. App draait in offline modus.');
    Notify.create({
      message: 'Je bent offline. Sommige functies zijn mogelijk niet beschikbaar.',
      color: 'warning',
      position: 'top',
      timeout: 5000,
    });
  },

  error(err) {
    console.error('Fout tijdens service worker registratie:', err);
  },
});
