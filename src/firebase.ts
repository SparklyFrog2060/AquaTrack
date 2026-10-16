import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  query,
  orderBy,
  onSnapshot,
  setDoc,
  deleteDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { type SwimSession } from './utils/swimCalculations';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

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
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initial connection test required by skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or connecting.');
    }
    return false;
  }
}

// Authentication helpers
export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logoutUser(): Promise<void> {
  await fbSignOut(auth);
}

// Real-time synchronization helper for swim sessions
export function subscribeToUserSessions(
  userId: string,
  onData: (sessions: SwimSession[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const sessionsCol = collection(db, 'users', userId, 'sessions');
  const q = query(sessionsCol, orderBy('date', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const sessions: SwimSession[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        sessions.push({
          id: docSnap.id,
          userId: data.userId || userId,
          date: data.date,
          poolLength: data.poolLength,
          laps: data.laps,
          distance: data.distance,
          durationSeconds: data.durationSeconds,
          paceSecondsPer100m: data.paceSecondsPer100m,
          stroke: data.stroke,
          avgHeartRate: data.avgHeartRate,
          maxHeartRate: data.maxHeartRate,
          calories: data.calories,
          poolName: data.poolName,
          notes: data.notes,
          source: data.source,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      onData(sessions);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/sessions`);
      if (onError) onError(error);
    }
  );
}

// Add or update session
export async function saveSwimSession(userId: string, session: SwimSession): Promise<string> {
  const sessionId = session.id || `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `users/${userId}/sessions/${sessionId}`;

  const cleanData: Record<string, any> = {
    userId,
    date: session.date,
    poolLength: Number(session.poolLength),
    laps: Number(session.laps),
    distance: Number(session.distance),
    durationSeconds: Number(session.durationSeconds),
    paceSecondsPer100m: Number(session.paceSecondsPer100m),
    updatedAt: new Date().toISOString(),
  };

  if (session.stroke) cleanData.stroke = session.stroke;
  if (typeof session.avgHeartRate === 'number' && !isNaN(session.avgHeartRate)) cleanData.avgHeartRate = session.avgHeartRate;
  if (typeof session.maxHeartRate === 'number' && !isNaN(session.maxHeartRate)) cleanData.maxHeartRate = session.maxHeartRate;
  if (typeof session.calories === 'number' && !isNaN(session.calories)) cleanData.calories = session.calories;
  if (session.poolName) cleanData.poolName = session.poolName;
  if (session.notes) cleanData.notes = session.notes;
  if (session.source) cleanData.source = session.source;
  cleanData.createdAt = session.createdAt || new Date().toISOString();

  try {
    await setDoc(doc(db, 'users', userId, 'sessions', sessionId), cleanData);
    return sessionId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete session
export async function deleteSwimSession(userId: string, sessionId: string): Promise<void> {
  const path = `users/${userId}/sessions/${sessionId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'sessions', sessionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export { onAuthStateChanged, type User };
