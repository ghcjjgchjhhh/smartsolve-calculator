import { getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDOu8-DX5KlDF7eFI-KXv5A-ahkynvFqnw",
  authDomain: "smart-solve-40fb3.firebaseapp.com",
  projectId: "smart-solve-40fb3",
  storageBucket: "smart-solve-40fb3.firebasestorage.app",
  messagingSenderId: "468499440691",
  appId: "1:468499440691:web:c8842809213e7160226f46",
  measurementId: "G-JTFZJ2HJPG"
};

export const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

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

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function mapFirebaseAuthError(err: any): Error {
  const code = err?.code || '';
  const host = typeof window !== 'undefined' ? window.location.hostname : 'this domain';

  if (code === 'auth/unauthorized-domain') {
    return new Error(
      `Domain "${host}" is not authorized in Firebase Console for project "${firebaseConfig.projectId}". Add "${host}" under Authentication → Settings → Authorized domains.`
    );
  }
  if (code === 'auth/operation-not-allowed') {
    return new Error(
      `Google Sign-In is not enabled yet in Firebase Console for project "${firebaseConfig.projectId}". Enable Google under Authentication → Sign-in method.`
    );
  }
  if (code === 'auth/popup-blocked') {
    return new Error(
      'Your browser blocked the Google Sign-In popup. Allow popups for this site or open https://smart-solve-40fb3.web.app directly in a browser tab.'
    );
  }
  if (code === 'auth/network-request-failed') {
    return new Error('Network error while contacting Google Sign-In. Check your internet connection and try again.');
  }
  return err instanceof Error ? err : new Error(String(err || 'Google Sign-In failed.'));
}

// Complete any pending standalone redirect sign-in result on app load
export const redirectResultPromise =
  typeof window !== 'undefined'
    ? getRedirectResult(auth).catch((err) => {
        console.error('Google redirect sign-in failed:', mapFirebaseAuthError(err).message);
        return null;
      })
    : Promise.resolve(null);

export async function signInWithGoogle() {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (err: any) {
    const code = err?.code || '';
    const isStandaloneTab = typeof window !== 'undefined' && window.self === window.top;

    // Outside embedded iframes (e.g. smart-solve-40fb3.web.app or Vercel), fall back cleanly to redirect if popup is blocked
    if (
      isStandaloneTab &&
      (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment')
    ) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }

    throw mapFirebaseAuthError(err);
  }
}

export async function signOutUser() {
  return signOut(auth);
}

// Validate live Firestore connectivity on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration: Firestore client is offline.');
    }
  }
}

void testConnection();
