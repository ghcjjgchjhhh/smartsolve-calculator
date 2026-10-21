import React, { useState } from 'react';
import {
  Download,
  X,
  Smartphone,
  Share2,
  PlusSquare,
  CheckCircle2,
  Sparkles,
  WifiOff,
  Maximize2,
  ArrowRight,
  MoreVertical,
  Laptop
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { canInstall, isInstalled, isIOS, isAndroid, triggerInstall } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'pc'>(() => {
    if (isIOS) return 'ios';
    if (isAndroid) return 'android';
    return 'android';
  });

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (canInstall) {
      const installed = await triggerInstall();
      if (installed) {
        onClose();
      }
    } else if (isIOS) {
      setActiveTab('ios');
    } else {
      setActiveTab('android');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-black rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with App Icon */}
        <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 text-white">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-xl p-1.5 flex-shrink-0 flex items-center justify-center">
              <img
                src="/icon.svg"
                alt="SmartSolve App Icon"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-tight">SmartSolve Calculator</span>
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Mobile App
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-1">
                Install directly on your phone home screen — No Google Play / App Store required!
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Status if already installed */}
          {isInstalled ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-3 text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-sm font-bold">App Already Installed!</p>
                <p className="text-xs opacity-90">
                  SmartSolve Calculator is already installed and running as a standalone app on your device.
                </p>
              </div>
            </div>
          ) : (
            /* Direct One-Tap Install Action if browser supports it */
            canInstall && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/30 dark:border-zinc-800">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-zinc-100 dark:text-emerald-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Instant 1-Tap Installation Ready
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-300 mt-0.5">
                      Your browser is ready to add SmartSolve directly to your app list.
                    </p>
                  </div>
                  <button
                    onClick={handleInstallClick}
                    className="flex-shrink-0 flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-white font-bold text-sm shadow-lg shadow-emerald-500/30 transition-transform active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install Now</span>
                  </button>
                </div>
              </div>
            )
          )}

          {/* Device Tabs */}
          <div>
            <div className="flex rounded-xl bg-slate-100 dark:bg-zinc-900/80 p-1 mb-4 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('android')}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-lg transition-all ${
                  activeTab === 'android'
                    ? 'bg-white dark:bg-slate-700 text-emerald-500 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android (Chrome)</span>
              </button>
              <button
                onClick={() => setActiveTab('ios')}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-lg transition-all ${
                  activeTab === 'ios'
                    ? 'bg-white dark:bg-slate-700 text-emerald-500 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>iPhone / iPad</span>
              </button>
              <button
                onClick={() => setActiveTab('pc')}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-lg transition-all ${
                  activeTab === 'pc'
                    ? 'bg-white dark:bg-slate-700 text-emerald-500 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Laptop / PC</span>
              </button>
            </div>

            {/* Android Instructions */}
            {activeTab === 'android' && (
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-black font-black text-white font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      Open this page in Google Chrome
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                      Ensure you are using Google Chrome or Samsung Internet browser on your Android phone.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-black font-black text-white font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      Tap the Chrome menu <MoreVertical className="w-4 h-4 text-emerald-500 inline" /> (three vertical dots)
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                      Located in the top-right corner of your Chrome browser.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/30 dark:border-emerald-500/30">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-black font-black text-white font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-white dark:text-emerald-200 flex items-center gap-1.5">
                      Tap <span className="font-bold underline text-emerald-500 dark:text-emerald-400">“Install app”</span> or <span className="font-bold underline text-emerald-500 dark:text-emerald-400">“Add to Home screen”</span>
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">
                      Chrome will automatically save the app icon to your phone screen and app drawer.
                    </p>
                  </div>
                </div>

                {canInstall && (
                  <button
                    onClick={handleInstallClick}
                    className="w-full mt-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-white font-bold flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/25 transition-transform active:scale-98"
                  >
                    <Download className="w-4 h-4" />
                    <span>Click Here to Trigger Chrome Install</span>
                  </button>
                )}
              </div>
            )}

            {/* iOS Instructions */}
            {activeTab === 'ios' && (
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-black font-black text-white font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      Open in Safari browser
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                      Apple requires using Apple Safari on iOS to install home screen web apps.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-black font-black text-white font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      Tap the <Share2 className="w-4 h-4 text-emerald-500 inline" /> Share button
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                      The square icon with an arrow pointing up at the bottom of your Safari screen.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/30 dark:border-emerald-500/30">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-black font-black text-white font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-white dark:text-emerald-200 flex items-center gap-1.5">
                      Scroll down and tap <PlusSquare className="w-4 h-4 text-emerald-500 inline" /> <span className="font-bold underline text-emerald-500 dark:text-emerald-400">“Add to Home Screen”</span>
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">
                      Then tap <strong>“Add”</strong> in the top-right corner. The SmartSolve app icon will appear on your iPhone home screen!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop / PC Instructions */}
            {activeTab === 'pc' && (
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-black font-black text-white font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      Look at your browser address bar
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                      In Chrome, Edge, or Brave, you will see an <strong>Install</strong> or <strong>Computer screen with down-arrow</strong> icon on the right side of the address bar.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/30 dark:border-emerald-500/30">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-black font-black text-white font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-white dark:text-emerald-200">
                      Click “Install SmartSolve Calculator”
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">
                      It will install directly into your Windows Start Menu, macOS Launchpad, or desktop.
                    </p>
                  </div>
                </div>

                {canInstall && (
                  <button
                    onClick={handleInstallClick}
                    className="w-full mt-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-white font-bold flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/25 transition-transform active:scale-98"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install on This Computer</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Why Install? Benefits */}
          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              App Advantages vs Regular Website
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 dark:bg-zinc-900/40">
                <Maximize2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                <span>Full-Screen Native Feel (No URL bars)</span>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 dark:bg-zinc-900/40">
                <WifiOff className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span>Works 100% Offline with Zero Data</span>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 dark:bg-zinc-900/40">
                <Smartphone className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <span>Instant Phone Home Screen Icon</span>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 dark:bg-zinc-900/40">
                <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>Instant calculations & Fast Loading</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-black border-t border-slate-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-zinc-900 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors"
          >
            Got it / Close
          </button>
        </div>
      </div>
    </div>
  );
};
