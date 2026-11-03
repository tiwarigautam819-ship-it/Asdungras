import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  increment,
  query,
  orderBy
} from 'firebase/firestore';
import { 
  getStorage, 
  ref as storageRef, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';
import { Track, ContactMessage } from './types';
import { removeAudioBlob } from './audioStorage';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Designated admin credentials requested by user
export const ADMIN_EMAILS = [
  'rk89experiment@gmail.com',
  'tiwarigautam819@gmail.com',
  'tiwarigautam8200@gmail.com'
];
export const ADMIN_PASS = 'djasdungras8955932061';
export const DEFAULT_WHATSAPP = '8955932061';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on app startup
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// Auth helpers
const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    console.error('Google Sign-in failed', err);
    throw err;
  }
}

export async function loginWithAdminCredentials(email: string, pass: string): Promise<User | null> {
  const cleanEmail = email.trim().toLowerCase();
  
  if (!ADMIN_EMAILS.includes(cleanEmail)) {
    throw new Error('Access denied. This email is not authorized for artist administration.');
  }
  if (pass !== ADMIN_PASS) {
    throw new Error('Incorrect credentials. Please verify your password.');
  }

  // Attempt Firebase Auth Email/Password login or creation
  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    return cred.user;
  } catch (err: any) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      try {
        const newCred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
        return newCred.user;
      } catch (createErr: any) {
        console.warn('Firebase user creation failed or requires console enablement:', createErr);
      }
    } else if (err.code === 'auth/operation-not-allowed') {
      console.warn('Email/Password provider not enabled in Firebase Console yet. Using verified admin session.');
    }
    // Return null if Firebase Auth email provider is disabled, allowing client-verified admin session
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  sessionStorage.removeItem('djas_admin_verified');
  await fbSignOut(auth);
}

export function checkIsAdmin(user: User | null, localVerified: boolean = false): boolean {
  if (localVerified) return true;
  if (!user || !user.email) return false;
  return ADMIN_EMAILS.includes(user.email.toLowerCase());
}

// Tracks listener
export function subscribeToTracks(callback: (tracks: Track[]) => void, onError?: (err: Error) => void) {
  const tracksCol = collection(db, 'tracks');
  const q = query(tracksCol, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const tracks: Track[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Track));
    callback(tracks);
  }, (error) => {
    if (onError) {
      onError(error);
    }
    handleFirestoreError(error, OperationType.LIST, 'tracks');
  });
}

// Track counter updates
export async function recordTrackPlay(trackId: string) {
  try {
    const trackRef = doc(db, 'tracks', trackId);
    await updateDoc(trackRef, {
      playsCount: increment(1)
    });
  } catch (err) {
    console.warn('Could not record play count:', err);
  }
}

export async function recordTrackDownload(trackId: string) {
  try {
    const trackRef = doc(db, 'tracks', trackId);
    await updateDoc(trackRef, {
      downloadsCount: increment(1)
    });
  } catch (err) {
    console.warn('Could not record download count:', err);
  }
}

// Upload file to server storage or Firebase Storage
export async function uploadMediaFile(
  file: File, 
  folder: 'audio' | 'covers', 
  onProgress?: (progress: number) => void
): Promise<{ url: string; storagePath?: string }> {
  // First attempt: Dedicated server upload endpoint (fast, no CORS issues, supports 100MB+ audio)
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const result = await new Promise<{ url: string; filename?: string }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload');
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = (event.loaded / event.total) * 100;
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch (e) {
            reject(new Error('Invalid response from server'));
          }
        } else {
          reject(new Error(`Server upload returned status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error uploading file to server'));
      xhr.send(formData);
    });

    if (result && result.url) {
      return { url: result.url, storagePath: result.filename };
    }
  } catch (serverErr) {
    console.warn('Server upload not available, falling back to Firebase Storage:', serverErr);
  }

  // Fallback: Firebase Storage
  try {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `${folder}/${timestamp}_${safeName}`;
    const fileRef = storageRef(storage, path);
    
    const uploadTask = uploadBytesResumable(fileRef, file);
    
    return await new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => {
          console.error('Firebase Storage error:', error);
          reject(error);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({ url: downloadUrl, storagePath: path });
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  } catch (err) {
    console.error('Upload failed:', err);
    throw err;
  }
}

// Add new track
export async function addTrack(trackData: Omit<Track, 'id'>): Promise<string> {
  const path = 'tracks';
  try {
    // Sanitize data: remove any undefined values which cause Firestore addDoc to reject
    const sanitizedData: Record<string, any> = {};
    for (const [key, value] of Object.entries(trackData)) {
      if (value !== undefined && !Number.isNaN(value)) {
        sanitizedData[key] = value;
      }
    }
    const docRef = await addDoc(collection(db, path), sanitizedData);
    return docRef.id;
  } catch (error) {
    console.error('Failed to add track to Firestore:', error);
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Delete track
export async function deleteTrack(trackId: string, storagePath?: string, audioUrl?: string): Promise<void> {
  const path = `tracks/${trackId}`;
  try {
    // 1. Delete document from Firestore
    await deleteDoc(doc(db, 'tracks', trackId));

    // 2. Clean up IndexedDB if stored locally
    try {
      if (storagePath) {
        await removeAudioBlob(storagePath);
      }
      await removeAudioBlob(trackId);
    } catch (e) {
      console.warn('IndexedDB cleanup note:', e);
    }

    // 3. Clean up server uploaded file if present
    try {
      if (storagePath || audioUrl) {
        await fetch('/api/delete-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: storagePath, url: audioUrl }),
        });
      }
    } catch (e) {
      console.warn('Server file cleanup note:', e);
    }

    // 4. Clean up Firebase Storage if stored there
    if (storagePath && !storagePath.startsWith('track_') && !storagePath.startsWith('drive_') && storagePath !== 'web_stream') {
      try {
        const fileRef = storageRef(storage, storagePath);
        await deleteObject(fileRef);
      } catch (storageErr) {
        console.warn('Firebase Storage deletion note:', storageErr);
      }
    }
  } catch (error) {
    console.error('Delete track error in Firestore:', error);
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Send Contact message
export async function sendContactMessage(msg: Omit<ContactMessage, 'id'>): Promise<string> {
  const path = 'messages';
  try {
    const docRef = await addDoc(collection(db, path), msg);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Messages listener for admin
export function subscribeToMessages(callback: (messages: ContactMessage[]) => void, onError?: (err: Error) => void) {
  const messagesCol = collection(db, 'messages');
  const q = query(messagesCol, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const msgs: ContactMessage[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ContactMessage));
    callback(msgs);
  }, (error) => {
    if (onError) {
      onError(error);
    }
    console.warn('Messages listener error:', error.message);
  });
}
