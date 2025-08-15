import pb, { POCKETBASE_URL, getPocketBase } from 'src/config/pocketbase';
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

  // Probeer verschillende methoden om een werkende PocketBase instantie te krijgen
  let pocketBaseInstance: PocketBase | null = null;

  // Methode 1: Probeer de bestaande pb instantie
  if (pb && typeof pb.collection === 'function') {
    pocketBaseInstance = pb;
    console.log('Using existing PocketBase instance');
  }

  // Methode 2: Probeer getPocketBase als pb niet werkt
  if (!pocketBaseInstance) {
    try {
      const configPb = getPocketBase();
      if (configPb && typeof configPb.collection === 'function') {
        pocketBaseInstance = configPb;
        console.log('Using PocketBase instance from config');
      }
    } catch (error) {
      console.warn('Failed to get PocketBase from config:', error);
    }
  }

  // Methode 3: Maak een nieuwe instantie als beide bovenstaande methoden falen
  if (!pocketBaseInstance) {
    console.warn('No working PocketBase instance found, creating new one...');
    pocketBaseInstance = initializePocketBase();
  }

  // Finale controle
  if (!pocketBaseInstance || typeof pocketBaseInstance.collection !== 'function') {
    console.error('Failed to get a working PocketBase instance');
    throw new Error('PocketBase is not available');
  }

  return { pb: pocketBaseInstance };
};
