import type { RecordModel } from 'pocketbase';
import pb from '../config/pocketbase';
import { useAuthStore } from 'stores/auth';
import type { Course } from 'src/components/models';
import { debug } from './debug';

/**
 * Genereert een volledige URL voor een PocketBase bestand
 * @param collectionName - De naam van de collectie
 * @param recordId - Het ID van het record
 * @param fileName - De naam van het bestand
 * @returns De volledige URL naar het bestand
 */
export const getFileUrl = (collectionName: string, recordId: string, fileName: string): string => {
  try {
    const authStore = useAuthStore();

    // Zorg ervoor dat de token is ingesteld
    if (authStore.user?.token) {
      pb.authStore.save(authStore.user.token);
    }

    // Probeer eerst de getURL methode
    let url = '';
    try {
      url = pb.files.getURL({ record: recordId, filename: fileName }, collectionName);
    } catch (error) {
      debug('Error using getURL:', error);
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
    const url = pb.files.getURL({ record: recordId, filename: fileName }, collectionName, {
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
    const url = pb.files.getURL({ record: recordId, filename: fileName }, collectionName, params);
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
  const resultList = await pb.collection(collection).getList(1, 20, options);
  return resultList.items as T[];
};

export const getRecord = async <T extends RecordModel>(
  collection: string,
  id: string,
): Promise<T> => {
  return await pb.collection(collection).getOne<T>(id);
};

export const createRecord = async <T extends RecordModel>(
  collection: string,
  data: Record<string, unknown>,
): Promise<T> => {
  return await pb.collection(collection).create<T>(data);
};

export const updateRecord = async <T extends RecordModel>(
  collection: string,
  id: string,
  data: Record<string, unknown>,
): Promise<T> => {
  return await pb.collection(collection).update<T>(id, data);
};

export const deleteRecord = async (collection: string, id: string): Promise<void> => {
  await pb.collection(collection).delete(id);
};

export const getCourses = async (options?: Record<string, unknown>): Promise<Course[]> => {
  const resultList = await pb.collection('courses').getList(1, 20, {
    ...options,
    expand: 'owner,moderators,category',
  });
  return resultList.items as Course[];
};

export const getCourse = async (id: string): Promise<Course> => {
  return await pb.collection('courses').getOne<Course>(id, {
    expand: 'owner,moderators,category',
  });
};

export const createCourse = async (data: Omit<Course, 'id'>): Promise<Course> => {
  return await pb.collection('courses').create<Course>(data);
};

export const updateCourse = async (
  id: string,
  data: Partial<Omit<Course, 'id'>>,
): Promise<Course> => {
  return await pb.collection('courses').update<Course>(id, data);
};
