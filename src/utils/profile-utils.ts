import type { User } from 'src/stores/auth';

/**
 * Controleert of het profiel van een gebruiker compleet is
 * Een profiel is compleet als alle verplichte velden zijn ingevuld:
 * - geboortejaar (birthyear)
 * - homecourse
 * - categorie (category)
 * - land (country)
 */
export function isProfileComplete(user: User | null): boolean {
  if (!user) return false;

  return !!(user.birthyear && user.homecourse && user.category && user.country);
}

/**
 * Retourneert een lijst van ontbrekende profielvelden
 */
export function getMissingProfileFields(user: User | null): string[] {
  if (!user) return ['Gebruiker niet gevonden'];

  const missingFields: string[] = [];

  if (!user.birthyear) {
    missingFields.push('Geboortejaar');
  }
  if (!user.homecourse) {
    missingFields.push('Homecourse');
  }
  if (!user.category) {
    missingFields.push('Categorie');
  }
  if (!user.country) {
    missingFields.push('Land');
  }

  return missingFields;
}
