import { Client, Databases, ID } from 'appwrite';

const env = import.meta.env;

const requiredEnvVars = [
  'VITE_APPWRITE_ENDPOINT',
  'VITE_APPWRITE_PROJECT_ID',
  'VITE_APPWRITE_DATABASE_ID',
  'VITE_APPWRITE_COLLECTION_ID'
];

const isConfigured = requiredEnvVars.every(key => !!env[key]);

let client = null;
let databases = null;

if (isConfigured) {
  client = new Client()
    .setEndpoint(env.VITE_APPWRITE_ENDPOINT)
    .setProject(env.VITE_APPWRITE_PROJECT_ID);
  
  databases = new Databases(client);
} else {
  if (import.meta.env.DEV) {
    console.warn('Appwrite environment variables are missing. Logging is disabled.');
  }
}

/**
 * Creates a new log entry for a generated Valentine link.
 */
export async function createValentineLog(data) {
  if (!databases) return null;
  try {
    const response = await databases.createDocument(
      env.VITE_APPWRITE_DATABASE_ID,
      env.VITE_APPWRITE_COLLECTION_ID,
      ID.unique(),
      {
        ...data,
        wasOpened: false,
        createdAt: new Date().toISOString()
      }
    );
    return response.$id;
  } catch (error) {
    if (import.meta.env.DEV) console.error('Appwrite Create Error:', error);
    return null;
  }
}

/**
 * Updates an existing log entry by documentId.
 */
export async function updateValentineLog(documentId, data) {
  if (!databases || !documentId) return null;
  try {
    return await databases.updateDocument(
      env.VITE_APPWRITE_DATABASE_ID,
      env.VITE_APPWRITE_COLLECTION_ID,
      documentId,
      data
    );
  } catch (error) {
    if (import.meta.env.DEV) console.error('Appwrite Update Error:', error);
    return null;
  }
}