/**
 * Rafi AI Assistant configuratie
 * Hier worden alle Rafi-gerelateerde configuratie-instellingen beheerd
 */

// Environment variables voor Rafi
const getRafiConfig = () => {
  // Frontend environment variables (VITE_*)
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const loggingEnabled = import.meta.env.VITE_RAFI_LOGGING === 'true';

  // Server-side environment variables (alleen beschikbaar op server)
  // Deze worden niet naar de client gestuurd
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX_PER_MIN || '10', 10);

  return {
    // Frontend config
    apiBaseUrl,
    loggingEnabled,

    // Server config (alleen beschikbaar op server)
    server: {
      openaiApiKey,
      openaiModel,
      allowedOrigin,
      rateLimitMax,
    },
  };
};

export const RAFI_CONFIG = getRafiConfig();

// Helper functies voor Rafi configuratie
export const getApiUrl = (endpoint: string): string => {
  return `${RAFI_CONFIG.apiBaseUrl}${endpoint}`;
};

export const isLoggingEnabled = (): boolean => {
  return RAFI_CONFIG.loggingEnabled;
};

// Server-side configuratie (alleen beschikbaar op server)
// Deze functie wordt niet meer gebruikt in de Express server
// omdat we daar direct process.env gebruiken
export const getServerConfig = () => {
  return RAFI_CONFIG.server;
};

// Default export
export default RAFI_CONFIG;
