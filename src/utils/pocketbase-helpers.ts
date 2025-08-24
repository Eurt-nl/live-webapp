import type { RecordModel } from 'pocketbase';
import { usePocketbase } from '../composables/usePocketbase';
import { useAuthStore } from 'stores/auth';
import type { Course } from 'src/components/models';
import { debug } from './debug';

/**
 * Configureer de redirect URL voor password reset
 * Dit zorgt ervoor dat de reset link naar de juiste pagina verwijst
 */
export const getPasswordResetRedirectUrl = (): string => {
  // Gebruik de huidige window.location om de juiste URL te bepalen
  if (typeof window !== 'undefined') {
    const currentOrigin = window.location.origin;
    return `${currentOrigin}/#/auth/reset-password`;
  }

  // Fallback URLs
  if (import.meta.env.DEV) {
    return 'https://localhost:9000/#/auth/reset-password';
  }
  return 'https://pitch-putt.live/#/auth/reset-password';
};

/**
 * Genereert een volledige URL voor een PocketBase bestand
 * @param collectionName - De naam van de collectie
 * @param recordId - Het ID van het record
 * @param fileName - De naam van het bestand
 * @returns De volledige URL naar het bestand
 */
export const getFileUrl = (collectionName: string, recordId: string, fileName: string): string => {
  try {
    const { pb } = usePocketbase();
    const authStore = useAuthStore();

    // Zorg ervoor dat de token is ingesteld
    if (authStore.user?.token) {
      pb.authStore.save(authStore.user.token);
    }

    // Probeer eerst de getUrl methode
    let url = '';
    try {
      url = pb.files.getUrl({ record: recordId, filename: fileName }, collectionName);
    } catch (error) {
      debug('Error using getUrl:', error);
    }

    // Als de URL leeg is, probeer dan een fallback URL te genereren
    if (!url) {
      url = `${pb.baseUrl}/api/files/${collectionName}/${recordId}/${fileName}`;
    }

    // Controleer of de URL geldig is
    if (!url) {
      debug('Generated URL is empty');
      return '';
    }

    // Controleer of de URL begint met de baseUrl
    if (!url.startsWith(pb.baseUrl)) {
      debug('Generated URL does not start with baseUrl:', { url, baseUrl: pb.baseUrl });
      return '';
    }

    return url;
  } catch (error) {
    debug('Error generating file URL:', error);
    return '';
  }
};

/**
 * Genereert een volledige URL voor een PocketBase bestand met thumbnail
 * @param collectionName - De naam van de collectie
 * @param recordId - Het ID van het record
 * @param fileName - De naam van het bestand
 * @param thumbSize - De grootte van de thumbnail (bijv. '100x100')
 * @returns De volledige URL naar de thumbnail
 */
export const getThumbUrl = (
  collectionName: string,
  recordId: string,
  fileName: string,
  thumbSize: string = '100x100',
): string => {
  try {
    const { pb } = usePocketbase();
    const url = pb.files.getUrl({ record: recordId, filename: fileName }, collectionName, {
      thumb: thumbSize,
    });
    return url;
  } catch (error) {
    debug('Error generating thumb URL:', error);
    return '';
  }
};

/**
 * Genereert een volledige URL voor een PocketBase bestand met aangepaste parameters
 * @param collectionName - De naam van de collectie
 * @param recordId - Het ID van het record
 * @param fileName - De naam van het bestand
 * @param params - Extra parameters voor de URL (bijv. voor filters of transformaties)
 * @returns De volledige URL naar het bestand met parameters
 */
export const getFileUrlWithParams = (
  collectionName: string,
  recordId: string,
  fileName: string,
  params: Record<string, string>,
): string => {
  try {
    const { pb } = usePocketbase();
    const url = pb.files.getUrl({ record: recordId, filename: fileName }, collectionName, params);
    return url;
  } catch (error) {
    debug('Error generating file URL with params:', error);
    return '';
  }
};

export const getRecords = async <T extends RecordModel>(
  collection: string,
  options?: Record<string, unknown>,
): Promise<T[]> => {
  const { pb } = usePocketbase();
  const resultList = await pb.collection(collection).getList(1, 20, options);
  return resultList.items as T[];
};

export const getRecord = async <T extends RecordModel>(
  collection: string,
  id: string,
): Promise<T> => {
  const { pb } = usePocketbase();
  return await pb.collection(collection).getOne<T>(id);
};

export const createRecord = async <T extends RecordModel>(
  collection: string,
  data: Record<string, unknown>,
): Promise<T> => {
  const { pb } = usePocketbase();
  return await pb.collection(collection).create<T>(data);
};

export const updateRecord = async <T extends RecordModel>(
  collection: string,
  id: string,
  data: Record<string, unknown>,
): Promise<T> => {
  const { pb } = usePocketbase();
  return await pb.collection(collection).update<T>(id, data);
};

export const deleteRecord = async (collection: string, id: string): Promise<void> => {
  const { pb } = usePocketbase();
  await pb.collection(collection).delete(id);
};

export const getCourses = async (options?: Record<string, unknown>): Promise<Course[]> => {
  const { pb } = usePocketbase();
  const resultList = await pb.collection('courses').getList(1, 20, {
    ...options,
    expand: 'owner,moderators,category',
  });
  return resultList.items as Course[];
};

export const getCourse = async (id: string): Promise<Course> => {
  const { pb } = usePocketbase();
  return await pb.collection('courses').getOne<Course>(id, {
    expand: 'owner,moderators,category',
  });
};

export const createCourse = async (data: Omit<Course, 'id'>): Promise<Course> => {
  const { pb } = usePocketbase();
  return await pb.collection('courses').create<Course>(data);
};

export const updateCourse = async (
  id: string,
  data: Partial<Omit<Course, 'id'>>,
): Promise<Course> => {
  const { pb } = usePocketbase();
  return await pb.collection('courses').update<Course>(id, data);
};
