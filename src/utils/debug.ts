/**
 * Debug utility voor development-only console logs
 * Gebruik deze in plaats van console.log voor debug informatie
 */

// Controleer of we in development mode zijn
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Debug logger die alleen werkt in development mode
 */
const debugObj = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },

  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info('[DEBUG]', ...args);
    }
  },

  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn('[DEBUG]', ...args);
    }
  },

  error: (...args: unknown[]) => {
    if (isDevelopment) {
      console.error('[DEBUG]', ...args);
    }
  },

  group: (label: string) => {
    if (isDevelopment) {
      console.group(`[DEBUG] ${label}`);
    }
  },

  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd();
    }
  },
};

/**
 * Debug functie die zowel als object als als functie kan worden gebruikt
 */
export const debug = Object.assign((...args: unknown[]) => {
  if (isDevelopment) {
    console.log('[DEBUG]', ...args);
  }
}, debugObj);

/**
 * Alias voor debug.log voor kortere syntax
 */
export const dlog = debug.log;
