import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Mail,
  LogOut,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  BookmarkPlus,
  Trash2,
  BookOpen,
  Calculator,
} from 'lucide-react';
import { useAuth, type SavedItemType, type UserSavedItem } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface UserProfileViewProps {
  onNavigateTab?: (tab: string) => void;
}

const STUDY_LEVELS = [
  'JAMB / WAEC',
  'NECO / GCE',
  'IGCSE / A-Level',
  'Undergraduate STEM',
  'Engineering & Physics',
  'Medical / Biology Track',
  'Self-Study',
];

export const UserProfileView: React.FC<UserProfileViewProps> = ({ onNavigateTab }) => {
  const {
    user,
    profile,
    profileLoading,
    saveProfile,
    signOut,
    listVaultItems,
    createVaultItem,
    deleteVaultItem,
  } = useAuth();
  const { isDark } = useTheme();

  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [studyLevel, setStudyLevel] = useState(profile?.studyLevel || 'JAMB / WAEC');
  const [bio, setBio] = useState(profile?.bio || '');

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Firestore-Protected Personal Study Vault Items
  const [savedItems, setSavedItems] = useState<UserSavedItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [newItemType, setNewItemType] = useState<SavedItemType>('formula');
  const [newItemSubject, setNewItemSubject] = useState('Mathematics');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemContent, setNewItemContent] = useState('');
  const [creatingItem, setCreatingItem] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setStudyLevel(profile.studyLevel || 'JAMB / WAEC');
      setBio(profile.bio || '');
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoadingItems(true);
    setItemsError(null);
    listVaultItems()
      .then((items) => {
        if (!active) return;
        setSavedItems(items);
      })
      .catch((err) => {
        if (!active) return;
        setItemsError(err instanceof Error ? err.message : 'Unable to load vault items.');
      })
      .finally(() => {
        if (active) setLoadingItems(false);
      });
    return () => {
      active = false;
    };
  }, [user?.uid, listVaultItems]);

  if (!user) return null;

  const displayName =
    fullName.trim() ||
    profile?.fullName?.trim() ||
    user.displayName?.trim() ||
    user.email?.split('@')[0] ||
    'SmartSolve Student';
  const initials =
    displayName
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || '')
      .join('') || 'SS';
  const avatarSrc = user.photoURL || profile?.photoUrl;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setSavingProfile(true);
    try {
      await saveProfile({
        fullName: fullName.trim(),
        studyLevel,
        bio: bio.trim(),
      });
      setProfileMessage({ type: 'ok', text: 'Profile saved securely to Firestore.' });
    } catch (err) {
      setProfileMessage({
        type: 'err',
        text: err instanceof Error ? err.message : 'Failed to save profile.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;
    setItemsError(null);
    setCreatingItem(true);
    try {
      const created = await createVaultItem({
        itemType: newItemType,
        title: newItemTitle.trim(),
        content: newItemContent.trim(),
        subject: newItemSubject.trim() || 'General',
      });
      setSavedItems((prev) => [created, ...prev]);
      setNewItemTitle('');
      setNewItemContent('');
    } catch (err) {
      setItemsError(err instanceof Error ? err.message : 'Failed to save item.');
    } finally {
      setCreatingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    setItemsError(null);
    try {
      await deleteVaultItem(itemId);
      setSavedItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      setItemsError(err instanceof Error ? err.message : 'Failed to delete item.');
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
  };

  const cardClass = `rounded-3xl border p-5 sm:p-6 ${
    isDark
      ? 'bg-[#0E0E12] border-[#27272A] text-white'
      : 'bg-white border-slate-200 text-slate-900 shadow-xs'
  }`;

  const inputClass = `w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-colors ${
    isDark
      ? 'bg-[#15151A] border-[#27272A] text-white focus:border-[#22C55E]'
      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#22C55E] focus:bg-white'
  }`;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Top Account Banner */}
      <div className={cardClass}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={displayName}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-[#22C55E] shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-[#22C55E] text-white font-black text-lg flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                {initials}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight truncate">
                  {displayName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 text-[11px] font-bold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Google Verified</span>
                </span>
              </div>
              {user.email && (
                <div className={`flex items-center gap-1.5 text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  <Mail className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span className="truncate">{user.email}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('scientific')}
                className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  isDark
                    ? 'bg-[#18181B] hover:bg-[#27272A] border-[#27272A] text-white'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                }`}
              >
                <Calculator className="w-3.5 h-3.5 text-[#22C55E]" />
                <span>Calculator</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-500 border border-red-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {signingOut ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Protected Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Column 1: Profile */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSaveProfile} className={`${cardClass} space-y-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-[#22C55E]" />
                <h2 className="text-sm font-extrabold uppercase tracking-wider">Student Profile</h2>
              </div>
              {profileLoading && <Loader2 className="w-4 h-4 animate-spin text-[#22C55E]" />}
            </div>

            {profileMessage && (
              <div
                className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                  profileMessage.type === 'ok'
                    ? isDark
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : isDark
                    ? 'bg-red-500/10 border-red-500/30 text-red-200'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                {profileMessage.type === 'ok' ? (
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                )}
                <span>{profileMessage.text}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                maxLength={100}
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold">Academic Track</label>
              <select
                value={studyLevel}
                onChange={(e) => setStudyLevel(e.target.value)}
                className={inputClass}
              >
                {STUDY_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold">Study Focus / Exam Goal</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. Targeting 320+ in JAMB Physics, Chemistry & Calculus"
                maxLength={500}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-2.5 px-4 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Profile</span>
            </button>
          </form>
        </div>

        {/* Column 2: Firestore Private Cloud Study Vault */}
        <div className={`lg:col-span-3 ${cardClass} space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#22C55E]" />
              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-wider">
                  Private Cloud Study Vault
                </h2>
                <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Secured by Firebase Authentication & Firestore rules — only your Google account can read or write these items.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleCreateItem}
            className={`p-4 rounded-2xl border space-y-3 ${
              isDark ? 'bg-[#131318] border-[#27272A]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <select
                value={newItemType}
                onChange={(e) => setNewItemType(e.target.value as SavedItemType)}
                className={inputClass}
              >
                <option value="formula">Formula</option>
                <option value="note">Study Note</option>
                <option value="calculation">Calculation</option>
                <option value="goal">Exam Goal</option>
              </select>
              <input
                type="text"
                value={newItemSubject}
                onChange={(e) => setNewItemSubject(e.target.value)}
                placeholder="Subject (e.g. Physics)"
                maxLength={60}
                className={inputClass}
              />
              <input
                type="text"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                placeholder="Title (e.g. Quadratic Formula)"
                maxLength={140}
                required
                className={inputClass}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={newItemContent}
                onChange={(e) => setNewItemContent(e.target.value)}
                placeholder="Expression, derivation, or revision reminder..."
                maxLength={2000}
                className={`${inputClass} flex-1`}
              />
              <button
                type="submit"
                disabled={creatingItem || !newItemTitle.trim()}
                className="px-4 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer transition-colors"
              >
                {creatingItem ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <BookmarkPlus className="w-4 h-4" />
                )}
                <span>Save to Vault</span>
              </button>
            </div>
          </form>

          {itemsError && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                isDark
                  ? 'bg-red-500/10 border-red-500/30 text-red-200'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{itemsError}</span>
            </div>
          )}

          <div className="space-y-2.5">
            {loadingItems ? (
              <div className="py-8 flex items-center justify-center gap-2 text-xs text-zinc-400">
                <Loader2 className="w-4 h-4 animate-spin text-[#22C55E]" />
                <span>Loading your private Firestore vault...</span>
              </div>
            ) : savedItems.length === 0 ? (
              <div
                className={`py-8 px-4 rounded-2xl border border-dashed text-center text-xs ${
                  isDark ? 'border-[#27272A] text-zinc-400' : 'border-slate-300 text-slate-500'
                }`}
              >
                Your private vault is empty. Save a formula, study note, or exam goal above!
              </div>
            ) : (
              savedItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 ${
                    isDark
                      ? 'bg-[#141418] border-[#27272A]'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-[#22C55E]/15 text-[#22C55E]">
                        {item.itemType}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          isDark ? 'bg-[#1E1E24] text-zinc-300' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {item.subject}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold truncate">{item.title}</h3>
                    </div>
                    {item.content && (
                      <p className={`text-xs break-words ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                        {item.content}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    aria-label={`Delete ${item.title}`}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-500/10 cursor-pointer shrink-0 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
