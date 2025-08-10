import pb, { POCKETBASE_URL } from 'src/config/pocketbase';
import PocketBase from 'pocketbase';

export const usePocketbase = () => {
  // Functie om PocketBase opnieuw te initialiseren als het niet beschikbaar is
  const initializePocketBase = (): PocketBase => {
    try {
      const newPb = new PocketBase(POCKETBASE_URL);
      console.log('PocketBase re-initialized successfully with URL:', POCKETBASE_URL);
      return newPb;
    } catch (error) {
      console.error('Failed to re-initialize PocketBase:', error);
      throw new Error('Failed to initialize PocketBase');
    }
  };

  // Probeer de bestaande pb instantie te gebruiken
  let pocketBaseInstance = pb;

  // Als pb niet beschikbaar is, probeer opnieuw te initialiseren
  if (!pocketBaseInstance) {
    console.warn('PocketBase instance not available, attempting to re-initialize...');
    pocketBaseInstance = initializePocketBase();
  }

  // Controleer of de collection methode beschikbaar is
  if (typeof pocketBaseInstance.collection !== 'function') {
    console.error('PocketBase collection method is not available');
    throw new Error('PocketBase collection method is not available');
  }

  return { pb: pocketBaseInstance };
};
