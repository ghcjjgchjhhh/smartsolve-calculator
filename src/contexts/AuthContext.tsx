import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, updateProfile, type User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
  redirectResultPromise,
  signInWithGoogle as firebaseSignInWithGoogle,
  signOutUser,
} from '../firebase';

export interface UserProfile {
  ownerId: string;
  fullName: string;
  studyLevel: string;
  bio: string;
  photoUrl?: string;
}

export type SavedItemType = 'formula' | 'note' | 'calculation' | 'goal';

export interface UserSavedItem {
  id: string;
  ownerId: string;
  itemType: SavedItemType;
  title: string;
  content: string;
  subject: string;
  createdAtMs: number;
}

interface ActionResult {
  error: string | null;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  authModalOpen: boolean;
  pendingRedirectTab: string | null;
  openAuthModal: (redirectTab?: string | null) => void;
  closeAuthModal: () => void;
  clearPendingRedirectTab: () => void;
  signInWithGoogle: () => Promise<ActionResult>;
  signOut: () => Promise<ActionResult>;
  refreshProfile: () => Promise<void>;
  saveProfile: (
    updates: Partial<Pick<UserProfile, 'fullName' | 'studyLevel' | 'bio'>>
  ) => Promise<UserProfile>;
  listVaultItems: () => Promise<UserSavedItem[]>;
  createVaultItem: (item: {
    itemType: SavedItemType;
    title: string;
    content: string;
    subject: string;
  }) => Promise<UserSavedItem>;
  deleteVaultItem: (itemId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function buildFallbackProfile(user: User): UserProfile {
  return {
    ownerId: user.uid,
    fullName: (user.displayName || '').slice(0, 100),
    studyLevel: 'JAMB / WAEC',
    bio: '',
    photoUrl: (user.photoURL || '').slice(0, 500) || undefined,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);

  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [pendingRedirectTab, setPendingRedirectTab] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void redirectResultPromise;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      await redirectResultPromise;
      if (!mounted) return;
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const loadProfileForUser = useCallback(async (targetUser: User | null) => {
    if (!targetUser) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    const fallback = buildFallbackProfile(targetUser);
    setProfile(fallback);
    setProfileLoading(true);

    const path = `user_profiles/${targetUser.uid}`;
    const ref = doc(db, 'user_profiles', targetUser.uid);

    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data() as Record<string, unknown>;
        setProfile({
          ownerId: targetUser.uid,
          fullName: typeof data.fullName === 'string' ? data.fullName : fallback.fullName,
          studyLevel: typeof data.studyLevel === 'string' ? data.studyLevel : 'JAMB / WAEC',
          bio: typeof data.bio === 'string' ? data.bio : '',
          photoUrl: typeof data.photoUrl === 'string' ? data.photoUrl : fallback.photoUrl,
        });
      } else {
        const payload: Record<string, unknown> = {
          ownerId: targetUser.uid,
          fullName: fallback.fullName,
          studyLevel: fallback.studyLevel,
          bio: fallback.bio,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        if (fallback.photoUrl) {
          payload.photoUrl = fallback.photoUrl;
        }
        await setDoc(ref, payload);
        setProfile(fallback);
      }
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.GET, path);
      } catch {
        // Keep fallback profile in memory if Firestore check hits transient or permission error
      }
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfileForUser(user);
  }, [user?.uid, loadProfileForUser]);

  const openAuthModal = useCallback((redirectTab: string | null = null) => {
    if (redirectTab !== undefined) {
      setPendingRedirectTab(redirectTab);
    }
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
  }, []);

  const clearPendingRedirectTab = useCallback(() => {
    setPendingRedirectTab(null);
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<ActionResult> => {
    try {
      await firebaseSignInWithGoogle();
      return { error: null };
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return { error: 'Google sign-in popup was closed before completing.' };
      }
      return { error: err?.message || 'Google Sign-In failed. Please try again.' };
    }
  }, []);

  const signOut = useCallback(async (): Promise<ActionResult> => {
    try {
      await signOutUser();
      setUser(null);
      setProfile(null);
      return { error: null };
    } catch (err: any) {
      return { error: err?.message || 'Unable to sign out right now.' };
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfileForUser(user);
  }, [loadProfileForUser, user]);

  const saveProfile = useCallback(
    async (
      updates: Partial<Pick<UserProfile, 'fullName' | 'studyLevel' | 'bio'>>
    ): Promise<UserProfile> => {
      if (!user) {
        throw new Error('You must be signed in with Google to update your profile.');
      }

      const nextProfile: UserProfile = {
        ownerId: user.uid,
        fullName: (updates.fullName ?? profile?.fullName ?? user.displayName ?? '').trim().slice(0, 100),
        studyLevel: (updates.studyLevel ?? profile?.studyLevel ?? 'JAMB / WAEC').trim().slice(0, 60) || 'JAMB / WAEC',
        bio: (updates.bio ?? profile?.bio ?? '').trim().slice(0, 500),
        photoUrl: (user.photoURL || profile?.photoUrl || '').slice(0, 500) || undefined,
      };

      const path = `user_profiles/${user.uid}`;
      const ref = doc(db, 'user_profiles', user.uid);

      try {
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          const payload: Record<string, unknown> = {
            ownerId: user.uid,
            fullName: nextProfile.fullName,
            studyLevel: nextProfile.studyLevel,
            bio: nextProfile.bio,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          if (nextProfile.photoUrl) {
            payload.photoUrl = nextProfile.photoUrl;
          }
          await setDoc(ref, payload);
        } else {
          const updatePayload: Record<string, unknown> = {
            fullName: nextProfile.fullName,
            studyLevel: nextProfile.studyLevel,
            bio: nextProfile.bio,
            updatedAt: serverTimestamp(),
          };
          if (nextProfile.photoUrl) {
            updatePayload.photoUrl = nextProfile.photoUrl;
          }
          await updateDoc(ref, updatePayload);
        }

        if (nextProfile.fullName && nextProfile.fullName !== user.displayName) {
          await updateProfile(user, { displayName: nextProfile.fullName }).catch(() => undefined);
        }

        setProfile(nextProfile);
        return nextProfile;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    },
    [user, profile]
  );

  const listVaultItems = useCallback(async (): Promise<UserSavedItem[]> => {
    if (!user) return [];
    const path = `user_profiles/${user.uid}/vault_items`;
    try {
      const q = query(
        collection(db, 'user_profiles', user.uid, 'vault_items'),
        where('ownerId', '==', user.uid)
      );
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => {
        const data = d.data() as Record<string, any>;
        const createdTs = data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now();
        return {
          id: String(data.id || d.id),
          ownerId: String(data.ownerId || user.uid),
          itemType: (data.itemType || 'note') as SavedItemType,
          title: String(data.title || ''),
          content: String(data.content || ''),
          subject: String(data.subject || 'General'),
          createdAtMs: createdTs,
        };
      });
      return items.sort((a, b) => b.createdAtMs - a.createdAtMs);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  }, [user]);

  const createVaultItem = useCallback(
    async (item: {
      itemType: SavedItemType;
      title: string;
      content: string;
      subject: string;
    }): Promise<UserSavedItem> => {
      if (!user) {
        throw new Error('Sign in with Google to save study vault items.');
      }

      const itemId = `vault_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const path = `user_profiles/${user.uid}/vault_items/${itemId}`;
      const cleanTitle = item.title.trim().slice(0, 140);
      const cleanContent = item.content.trim().slice(0, 2000);
      const cleanSubject = (item.subject.trim() || 'General').slice(0, 60);

      try {
        await setDoc(doc(db, 'user_profiles', user.uid, 'vault_items', itemId), {
          id: itemId,
          ownerId: user.uid,
          itemType: item.itemType,
          title: cleanTitle,
          content: cleanContent,
          subject: cleanSubject,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return {
          id: itemId,
          ownerId: user.uid,
          itemType: item.itemType,
          title: cleanTitle,
          content: cleanContent,
          subject: cleanSubject,
          createdAtMs: Date.now(),
        };
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    [user]
  );

  const deleteVaultItem = useCallback(
    async (itemId: string): Promise<void> => {
      if (!user) {
        throw new Error('Sign in with Google to manage study vault items.');
      }
      const path = `user_profiles/${user.uid}/vault_items/${itemId}`;
      try {
        await deleteDoc(doc(db, 'user_profiles', user.uid, 'vault_items', itemId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        profileLoading,
        authModalOpen,
        pendingRedirectTab,
        openAuthModal,
        closeAuthModal,
        clearPendingRedirectTab,
        signInWithGoogle,
        signOut,
        refreshProfile,
        saveProfile,
        listVaultItems,
        createVaultItem,
        deleteVaultItem,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return ctx;
}
