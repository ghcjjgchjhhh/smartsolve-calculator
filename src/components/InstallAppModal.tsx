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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#181B22] rounded-3xl shadow-2xl border border-[#252A34] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with App Icon */}
        <div className="relative bg-[#13161D] p-6 text-[#FFFFFF] border-b border-[#252A34]">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 p-2 rounded-xl bg-[#252A34] hover:bg-[#2F3542] text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-[#252A34] border border-[#3B82F6]/40 shadow-xl p-1.5 flex-shrink-0 flex items-center justify-center text-[#3B82F6]">
              <img
                src="/icon.svg"
                alt="SmartSolve App Icon"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-[#FFFFFF]">SmartSolve Calculator</span>
                <span className="bg-[#3B82F6]/20 text-[#3B82F6] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#3B82F6]/30 uppercase">
                  Mobile PWA
                </span>
              </div>
              <p className="text-xs text-[#A1A1AA] mt-1">
                Install directly on your phone home screen — works offline like a native app.
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Status if already installed */}
          {isInstalled ? (
            <div className="p-4 rounded-2xl bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center space-x-3 text-[#FFFFFF]">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-[#22C55E]" />
              <div>
                <p className="text-sm font-bold text-[#FFFFFF]">App Already Installed!</p>
                <p className="text-xs text-[#A1A1AA] mt-0.5">
                  SmartSolve Calculator is installed and ready to launch from your device's home screen.
                </p>
              </div>
            </div>
          ) : (
            /* Direct One-Tap Install Action if browser supports it */
            canInstall && (
              <div className="p-4 rounded-2xl bg-[#0F1115] border border-[#3B82F6]/30">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#FFFFFF] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#3B82F6]" />
                      Instant 1-Tap Installation Ready
                    </p>
                    <p className="text-xs text-[#A1A1AA] mt-0.5">
                      Your browser is ready to add SmartSolve to your device.
                    </p>
                  </div>
                  <button
                    onClick={handleInstallClick}
                    className="flex-shrink-0 flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-[#FFFFFF] font-bold text-sm shadow-lg shadow-emerald-500/25 transition-transform active:scale-95 cursor-pointer"
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
            <div className="flex rounded-xl bg-[#0F1115] border border-[#252A34] p-1 mb-4 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('android')}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-lg transition-all ${
                  activeTab === 'android'
                    ? 'bg-[#3B82F6] text-[#FFFFFF] shadow-sm font-bold'
                    : 'text-[#A1A1AA] hover:text-[#FFFFFF]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android (Chrome)</span>
              </button>
              <button
                onClick={() => setActiveTab('ios')}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-lg transition-all ${
                  activeTab === 'ios'
                    ? 'bg-[#3B82F6] text-[#FFFFFF] shadow-sm font-bold'
                    : 'text-[#A1A1AA] hover:text-[#FFFFFF]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>iPhone / iPad</span>
              </button>
              <button
                onClick={() => setActiveTab('pc')}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-lg transition-all ${
                  activeTab === 'pc'
                    ? 'bg-[#3B82F6] text-[#FFFFFF] shadow-sm font-bold'
                    : 'text-[#A1A1AA] hover:text-[#FFFFFF]'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Laptop / PC</span>
              </button>
            </div>

            {/* Android Instructions */}
            {activeTab === 'android' && (
              <div className="space-y-3 text-xs sm:text-sm text-[#A1A1AA]">
                <div className="flex items-start space-x-3 p-3 rounded-xl bg-[#0F1115] border border-[#252A34]">
                  <div className="w-6 h-6 rounded-lg bg-[#252A34] text-[#FFFFFF] font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5 border border-white/5">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-[#FFFFFF]">
                      Open this page in Google Chrome
                    </p>
                    <p className="text-[#A1A1AA] text-xs mt-0.5">
                      Ensure you are using Google Chrome or Samsung Internet on your phone.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-xl bg-[#0F1115] border border-[#252A34]">
                  <div className="w-6 h-6 rounded-lg bg-[#252A34] text-[#FFFFFF] font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5 border border-white/5">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-[#FFFFFF] flex items-center gap-1.5">
                      Tap the Chrome menu <MoreVertical className="w-4 h-4 text-[#3B82F6] inline" /> (three dots)
                    </p>
                    <p className="text-[#A1A1AA] text-xs mt-0.5">
                      Located in the top-right corner of your browser.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-xl bg-[#0F1115] border border-[#22C55E]/40">
                  <div className="w-6 h-6 rounded-lg bg-[#22C55E] text-[#FFFFFF] font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-[#FFFFFF] flex items-center gap-1.5">
                      Tap <span className="font-bold underline text-[#22C55E]">“Install app”</span> or <span className="font-bold underline text-[#22C55E]">“Add to Home screen”</span>
                    </p>
                    <p className="text-[#A1A1AA] text-xs mt-0.5">
                      The SmartSolve Calculator icon will be added directly to your home screen.
                    </p>
                  </div>
                </div>

                {canInstall && (
                  <button
                    onClick={handleInstallClick}
                    className="w-full mt-2 py-3 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-[#FFFFFF] font-bold flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/25 transition-transform active:scale-98 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Click Here to Trigger Phone Install</span>
                  </button>
                )}
              </div>
            )}

            {/* iOS Instructions */}
            {activeTab === 'ios' && (
              <div className="space-y-3 text-xs sm:text-sm text-[#A1A1AA]">
                <div className="flex items-start space-x-3 p-3 rounded-xl bg-[#0F1115] border border-[#252A34]">
                  <div className="w-6 h-6 rounded-lg bg-[#252A34] text-[#FFFFFF] font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5 border border-white/5">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-[#FFFFFF]">
                      Open in Apple Safari
                    </p>
                    <p className="text-[#A1A1AA] text-xs mt-0.5">
                      Apple requires using Safari on iOS to install home screen web apps.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-xl bg-[#0F1115] border border-[#252A34]">
                  <div className="w-6 h-6 rounded-lg bg-[#252A34] text-[#FFFFFF] font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5 border border-white/5">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-[#FFFFFF] flex items-center gap-1.5">
                      Tap the <Share2 className="w-4 h-4 text-[#3B82F6] inline" /> Share button
                    </p>
                    <p className="text-[#A1A1AA] text-xs mt-0.5">
                      The square icon with an upward arrow at the bottom of Safari.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-xl bg-[#0F1115] border border-[#22C55E]/40">
                  <div className="w-6 h-6 rounded-lg bg-[#22C55E] text-[#FFFFFF] font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-[#FFFFFF] flex items-center gap-1.5">
                      Tap <PlusSquare className="w-4 h-4 text-[#22C55E] inline" /> <span className="font-bold underline text-[#22C55E]">“Add to Home Screen”</span>
                    </p>
                    <p className="text-[#A1A1AA] text-xs mt-0.5">
                      Then tap “Add” in the top-right corner. SmartSolve will appear as a full standalone phone app.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop / PC Instructions */}
            {activeTab === 'pc' && (
              <div className="space-y-3 text-xs sm:text-sm text-[#A1A1AA]">
                <div className="flex items-start space-x-3 p-3 rounded-xl bg-[#0F1115] border border-[#252A34]">
                  <div className="w-6 h-6 rounded-lg bg-[#252A34] text-[#FFFFFF] font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5 border border-white/5">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-[#FFFFFF]">
                      Look at your browser address bar
                    </p>
                    <p className="text-[#A1A1AA] text-xs mt-0.5">
                      In Chrome, Edge, or Brave, look for the <strong>Install</strong> or monitor icon in the address bar.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-xl bg-[#0F1115] border border-[#22C55E]/40">
                  <div className="w-6 h-6 rounded-lg bg-[#22C55E] text-[#FFFFFF] font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-[#FFFFFF]">
                      Click “Install SmartSolve Calculator”
                    </p>
                    <p className="text-[#A1A1AA] text-xs mt-0.5">
                      It will install directly into your Windows Start Menu, macOS Launchpad, or desktop.
                    </p>
                  </div>
                </div>

                {canInstall && (
                  <button
                    onClick={handleInstallClick}
                    className="w-full mt-2 py-3 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-[#FFFFFF] font-bold flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/25 transition-transform active:scale-98 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install on This Computer</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Benefits */}
          <div className="pt-2 border-t border-[#252A34]">
            <p className="text-xs font-bold uppercase tracking-wider text-[#A1A1AA] mb-3">
              App Advantages vs Website
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center space-x-2 p-2 rounded-xl bg-[#0F1115] border border-[#252A34]">
                <Maximize2 className="w-4 h-4 text-[#3B82F6] flex-shrink-0" />
                <span className="text-[#FFFFFF]">Fullscreen (No URL Bars)</span>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-xl bg-[#0F1115] border border-[#252A34]">
                <WifiOff className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
                <span className="text-[#FFFFFF]">100% Offline Ready</span>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-xl bg-[#0F1115] border border-[#252A34]">
                <Smartphone className="w-4 h-4 text-[#3B82F6] flex-shrink-0" />
                <span className="text-[#FFFFFF]">Fast Home Screen Launch</span>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-xl bg-[#0F1115] border border-[#252A34]">
                <Sparkles className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
                <span className="text-[#FFFFFF]">Zero Latency Math Engine</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#13161D] border-t border-[#252A34] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#252A34] hover:bg-[#2F3542] text-[#FFFFFF] font-semibold text-xs transition-colors cursor-pointer"
          >
            Got it / Close
          </button>
        </div>
      </div>
    </div>
  );
};
