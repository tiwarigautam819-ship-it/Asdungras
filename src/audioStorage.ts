// Robust client-side IndexedDB persistence for uploaded audio files
const DB_NAME = 'djas_audio_vault';
const STORE_NAME = 'audio_files';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };

    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

export async function storeAudioBlob(trackId: string, file: Blob): Promise<string> {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const putReq = store.put(file, trackId);

      putReq.onsuccess = () => {
        const objectUrl = URL.createObjectURL(file);
        resolve(objectUrl);
      };

      putReq.onerror = () => {
        reject(putReq.error);
      };
    });
  } catch (err) {
    console.warn('Could not store in IndexedDB, using temporary ObjectURL:', err);
    return URL.createObjectURL(file);
  }
}

export async function retrieveAudioBlobUrl(trackId: string): Promise<string | null> {
  try {
    const db = await openDB();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(trackId);

      getReq.onsuccess = () => {
        const blob = getReq.result;
        if (blob instanceof Blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          resolve(null);
        }
      };

      getReq.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    console.warn('IndexedDB retrieval error:', err);
    return null;
  }
}

export async function removeAudioBlob(trackId: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const delReq = store.delete(trackId);
      delReq.onsuccess = () => resolve();
      delReq.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('IndexedDB delete error:', err);
  }
}
