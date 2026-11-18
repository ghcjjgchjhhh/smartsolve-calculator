import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { buildApiUrl } from '../lib/apiClient';

export interface AuthUser {
  id: string;
  uid: string;
  email: string | null;
  name: string | null;
  displayName: string | null;
  image: string | null;
  photoURL: string | null;
}

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
  user: AuthUser | null;
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
  refreshSession: () => Promise<AuthUser | null>;
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

function normalizeSessionUser(raw: any): AuthUser | null {
  const u = raw?.user;
  if (!u) return null;
  const uid = String(u.id || u.uid || u.email || '').trim();
  if (!uid) return null;
  const name = typeof u.name === 'string' ? u.name : typeof u.displayName === 'string' ? u.displayName : null;
  const email = typeof u.email === 'string' ? u.email : null;
  const image = typeof u.image === 'string' ? u.image : typeof u.photoURL === 'string' ? u.photoURL : null;
  return {
    id: uid,
    uid,
    email,
    name,
    displayName: name,
    image,
    photoURL: image,
  };
}

function buildFallbackProfile(user: AuthUser): UserProfile {
  return {
    ownerId: user.uid,
    fullName: (user.displayName || '').slice(0, 100),
    studyLevel: 'JAMB / WAEC',
    bio: '',
    photoUrl: (user.photoURL || '').slice(0, 500) || undefined,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);

  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [pendingRedirectTab, setPendingRedirectTab] = useState<string | null>(null);

  const refreshSession = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const resp = await fetch(buildApiUrl('/api/auth/session'), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (!resp.ok) {
        setUser(null);
        setProfile(null);
        return null;
      }
      const data = await resp.json().catch(() => null);
      const normalized = normalizeSessionUser(data);
      setUser(normalized);
      if (!normalized) {
        setProfile(null);
      }
      return normalized;
    } catch {
      setUser(null);
      setProfile(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const loadProfileForUser = useCallback(async (targetUser: AuthUser | null) => {
    if (!targetUser) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    const fallback = buildFallbackProfile(targetUser);
    setProfile(fallback);
    setProfileLoading(true);

    try {
      const resp = await fetch(buildApiUrl('/api/user-data'), {
        method: 'GET',
        credentials: 'include',
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data?.profile) {
          setProfile({
            ownerId: targetUser.uid,
            fullName: typeof data.profile.fullName === 'string' ? data.profile.fullName : fallback.fullName,
            studyLevel: typeof data.profile.studyLevel === 'string' ? data.profile.studyLevel : 'JAMB / WAEC',
            bio: typeof data.profile.bio === 'string' ? data.profile.bio : '',
            photoUrl: typeof data.profile.photoUrl === 'string' ? data.profile.photoUrl : fallback.photoUrl,
          });
        }
      }
    } catch {
      // Keep fallback profile in memory if transient fetch failure occurs
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
      const cfgResp = await fetch(buildApiUrl('/api/auth/config'), {
        method: 'GET',
        credentials: 'include',
      });
      if (cfgResp.ok) {
        const cfg = await cfgResp.json().catch(() => null);
        if (cfg && cfg.configured === false) {
          return {
            error:
              'Google OAuth is not configured on the server yet. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and AUTH_SECRET in environment variables.',
          };
        }
      }
    } catch {
      // Proceed and let auth endpoint respond
    }

    const isEmbeddedIframe = (() => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    })();

    // Top-level browser tab (e.g. Vercel production): full-page Auth.js OAuth redirect works cleanly with no popup blocker
    if (!isEmbeddedIframe) {
      const targetUrl = buildApiUrl(
        `/api/auth/google-start?mode=redirect&callbackUrl=${encodeURIComponent(window.location.href)}`
      );
      window.location.assign(targetUrl);
      return { error: null };
    }

    // Embedded iframe (e.g. AI Studio preview): open OAuth in a popup window so Google accounts.google.com is never blocked by X-Frame-Options
    const popupUrl = buildApiUrl('/api/auth/google-start?mode=popup');
    const width = 500;
    const height = 640;
    const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
    const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));
    const popup = window.open(
      popupUrl,
      'smartsolve_google_oauth',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    if (!popup) {
      return {
        error: 'Popup was blocked by your browser. Please allow popups for this site and try again.',
      };
    }

    return new Promise<ActionResult>((resolve) => {
      let settled = false;

      const finish = async (result: ActionResult) => {
        if (settled) return;
        settled = true;
        window.removeEventListener('message', onMessage);
        window.clearInterval(pollTimer);
        window.clearTimeout(timeoutTimer);
        if (!result.error) {
          const authed = await refreshSession();
          if (!authed) {
            resolve({ error: 'Session cookie could not be verified after sign-in. Please allow third-party cookies for this preview or open in a new tab.' });
            return;
          }
        }
        resolve(result);
      };

      const onMessage = (event: MessageEvent) => {
        const data = event?.data;
        if (!data || data.type !== 'SMARTSOLVE_AUTH_COMPLETE') return;
        if (data.ok) {
          void finish({ error: null });
        } else {
          void finish({ error: data.error || 'Google Sign-In failed.' });
        }
      };

      window.addEventListener('message', onMessage);

      const pollTimer = window.setInterval(() => {
        if (popup.closed) {
          void finish({ error: null }).then(() => undefined);
        }
      }, 450);

      const timeoutTimer = window.setTimeout(() => {
        void finish({ error: 'Google sign-in timed out. Please try again.' });
      }, 180000);
    });
  }, [refreshSession]);

  const signOut = useCallback(async (): Promise<ActionResult> => {
    try {
      const csrfResp = await fetch(buildApiUrl('/api/auth/csrf'), {
        method: 'GET',
        credentials: 'include',
      });
      const csrfJson = (await csrfResp.json().catch(() => ({}))) as { csrfToken?: string };
      const csrfToken = csrfJson?.csrfToken || '';

      await fetch(buildApiUrl('/api/auth/signout'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: new URLSearchParams({
          csrfToken,
          json: 'true',
          callbackUrl: window.location.origin,
        }).toString(),
      });

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

      const resp = await fetch(buildApiUrl('/api/user-data'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_profile',
          fullName: updates.fullName ?? profile?.fullName ?? user.displayName ?? '',
          studyLevel: updates.studyLevel ?? profile?.studyLevel ?? 'JAMB / WAEC',
          bio: updates.bio ?? profile?.bio ?? '',
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data?.profile) {
        throw new Error(data?.error || 'Failed to save profile.');
      }

      const savedProfile = data.profile as UserProfile;
      setProfile(savedProfile);
      return savedProfile;
    },
    [user, profile]
  );

  const listVaultItems = useCallback(async (): Promise<UserSavedItem[]> => {
    if (!user) return [];
    const resp = await fetch(buildApiUrl('/api/user-data'), {
      method: 'GET',
      credentials: 'include',
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      throw new Error(data?.error || 'Unable to load vault items.');
    }
    return Array.isArray(data?.vaultItems) ? data.vaultItems : [];
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
      const resp = await fetch(buildApiUrl('/api/user-data'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_vault_item',
          ...item,
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data?.item) {
        throw new Error(data?.error || 'Failed to save vault item.');
      }
      return data.item as UserSavedItem;
    },
    [user]
  );

  const deleteVaultItem = useCallback(
    async (itemId: string): Promise<void> => {
      if (!user) {
        throw new Error('Sign in with Google to manage study vault items.');
      }
      const resp = await fetch(buildApiUrl('/api/user-data'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_vault_item',
          itemId,
        }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to delete vault item.');
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
        refreshSession,
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
