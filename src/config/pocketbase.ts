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
export const pb = new PocketBase(POCKETBASE_URL);

// Exporteer de PocketBase instantie als default
export default pb;
