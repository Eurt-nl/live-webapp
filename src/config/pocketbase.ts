/**
 * PocketBase configuratie
 * Hier worden alle PocketBase-gerelateerde configuratie-instellingen beheerd
 */

// PocketBase server URL - gebruik environment variables voor verschillende omgevingen
const getPocketBaseUrl = (): string => {
  // In development (npm run dev) gebruik de live server
  if (process.env.NODE_ENV === 'development') {
    return 'https://pb.pitch-putt.live';
  }

  // In production (npm run build) gebruik de live server
  if (process.env.NODE_ENV === 'production') {
    return 'https://pb.pitch-putt.live';
  }

  // Fallback naar live server URL
  return 'https://pb.pitch-putt.live';
};

export const POCKETBASE_URL = getPocketBaseUrl();

// PocketBase instantie
import PocketBase from 'pocketbase';

let pb: PocketBase;

try {
  pb = new PocketBase(POCKETBASE_URL);
  console.log('PocketBase initialized successfully with URL:', POCKETBASE_URL);
} catch (error) {
  console.error('Failed to initialize PocketBase:', error);
  throw new Error('Failed to initialize PocketBase');
}

// Controleer of pb correct is geïnitialiseerd
if (!pb) {
  console.error('PocketBase instance is null or undefined');
  throw new Error('PocketBase instance is not available');
}

// Configureer de redirect URL voor password reset
// Dit zorgt ervoor dat de reset link naar de juiste pagina verwijst
const getRedirectUrl = (): string => {
  if (process.env.NODE_ENV === 'development') {
    // Gebruik de huidige window.location om de juiste poort te bepalen
    if (typeof window !== 'undefined') {
      const currentPort = window.location.port;
      return `https://localhost:${currentPort}/#/auth/reset-password`;
    }
    // Fallback naar geconfigureerde poort
    return 'https://localhost:9000/#/auth/reset-password';
  }
  return 'https://pitch-putt.live/#/auth/reset-password';
};

// Stel de redirect URL in voor password reset
pb.authStore.onChange(() => {
  // Deze hook wordt aangeroepen wanneer de auth store verandert
  // We kunnen hier eventueel extra logica toevoegen
});

// Exporteer de redirect URL voor gebruik in andere delen van de app
export const PASSWORD_RESET_REDIRECT_URL = getRedirectUrl();

// Exporteer de PocketBase instantie als default
export default pb;
