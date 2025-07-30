import { getFileUrl } from './pocketbase-helpers';
import maleAvatar from '../assets/images/male.png';

/**
 * Haalt de avatar URL op voor een speler
 * @param speler - De speler object
 * @returns De URL naar de avatar afbeelding
 */
export const getAvatarUrl = (speler: Record<string, unknown>): string => {
  if (speler?.avatar) {
    return getFileUrl('users', speler.id as string, speler.avatar as string)
  }

  // Gebruik de geïmporteerde afbeelding voor PWA compatibiliteit
  return maleAvatar
};
