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
  Laptop,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { canInstall, isInstalled, isIOS, isIOSSafari, isIOSOtherBrowser, isAndroid, triggerInstall } = usePWAInstall();
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'pc'>(() => {
    if (isIOS) return 'ios';
    if (isAndroid) return 'android';
    return 'android';
  });

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // fallback
    }
  };

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
      <div className="relative w-full max-w-lg bg-[#0A0A0A] rounded-3xl shadow-2xl border border-[#27272A] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with App Icon */}
        <div className="relative bg-[#13161D] p-6 text-[#FFFFFF] border-b border-[#27272A]">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 p-2 rounded-xl bg-[#18181B] hover:bg-[#2F3542] text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-[#18181B] border border-[#22C55E]/40 shadow-xl p-1.5 flex-shrink-0 flex items-center justify-center text-[#22C55E]">
              <img
                src="/icon.svg"
                alt="SmartSolve App Icon"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-[#FFFFFF]">SmartSolve Calculator</span>
                <span className="bg-[#22C55E]/20 text-[#22C55E] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#22C55E]/30 uppercase">
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
              <div className="p-4 rounded-2xl bg-[#000000] border border-[#22C55E]/30">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#FFFFFF] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#22C55E]" />
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
            <div className="flex rounded-xl bg-[#000000] border border-[#27272A] p-1 mb-4 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('android')}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-lg transition-all ${
                  activeTab === 'android'
                    ? 'bg-[#22C55E] text-[#FFFFFF] shadow-sm font-bold'
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
                    ? 'bg-[#22C55E] text-[#FFFFFF] shadow-sm font-bold'
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
                    ? 'bg-[#22C55E] text-[#FFFFFF] shadow-sm font-bold'
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
                <div className="flex items-start space-x-3 p-3 rounded-xl bg-[#000000] border border-[#27272A]">
                  <div className="w-6 h-6 rounded-lg bg-[#18181B] text-[#FFFFFF] font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5 border border-white/5">
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

                <div className="flex items-start space-x-3 p-3 rounded-xl bg-[#000000] border border-[#27272A]">
                  <div className="w-6 h-6 rounded-lg bg-[#18181B] text-[#FFFFFF] font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5 border border-white/5">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-[#FFFFFF] flex items-center gap-1.5">
                      Tap the Chrome menu <MoreVertical className="w-4 h-4 text-[#22C55E] inline" /> (three dots)
                    </p>
                    <p className="text-[#A1A1AA] text-xs mt-0.5">
                      Located in the top-right corner of your browser.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-xl bg-[#000000] border border-[#22C55E]/40">
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
              <div className="space-y-3.5 text-xs sm:text-sm text-[#A1A1AA]">
                {/* Explanation why iPhone works this way */}
                <div className="p-3.5 rounded-2xl bg-[#18181B] border border-white/10 text-xs space-y-1">
                  <div className="flex items-center space-x-1.5 text-[#FFFFFF] font-bold">
                    <Smartphone className="w-3.5 h-3.5 text-[#22C55E]" />
                    <span>How iPhone / iPad Installation Works</span>
                  </div>
                  <p className="text-[#A1A1AA] leading-relaxed">
                    Apple iOS does not allow web browsers to pop up 1-tap install buttons. Instead, Apple provides an official <strong>"Add to Home Screen"</strong> option inside <strong>Safari</strong>.
                  </p>
                </div>

                {/* Non-Safari Warning (e.g. Chrome on iOS or In-App Browser) */}
                {isIOSOtherBrowser && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs space-y-2">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-amber-300">You are not using Safari</p>
                        <p className="text-amber-200/90 mt-0.5">
                          Apple blocks "Add to Home Screen" inside Chrome, Google App, or Instagram/WhatsApp. You must open this link in <strong>Safari</strong>.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 transition-all"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                          <span>Link Copied! Open Safari & Paste</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy App Link to Open in Safari</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-[#000000] border border-[#27272A]">
                  <div className="w-6 h-6 rounded-lg bg-[#18181B] text-[#FFFFFF] font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5 border border-white/5">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-[#FFFFFF]">
                      Open this URL in Apple Safari
                    </p>
                    <p className="text-[#A1A1AA] text-xs mt-0.5">
                      Ensure you are viewing this page in Safari (not Chrome or an in-app browser).
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-[#000000] border border-[#27272A]">
                  <div className="w-6 h-6 rounded-lg bg-[#18181B] text-[#FFFFFF] font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5 border border-white/5">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-[#FFFFFF] flex items-center gap-1.5">
                      Tap the <Share2 className="w-4 h-4 text-[#22C55E] inline" /> Share button in Safari
                    </p>
                    <p className="text-[#A1A1AA] text-xs mt-0.5">
                      Look at the bottom navigation bar of Safari for the square icon with an arrow pointing upward.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-[#000000] border border-[#22C55E]/40">
                  <div className="w-6 h-6 rounded-lg bg-[#22C55E] text-[#FFFFFF] font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-[#FFFFFF] flex items-center gap-1.5">
                      Scroll down and tap <PlusSquare className="w-4 h-4 text-[#22C55E] inline" /> <span className="font-bold underline text-[#22C55E]">“Add to Home Screen”</span>
                    </p>
                    <p className="text-[#A1A1AA] text-xs mt-0.5">
                      If you don't see it, swipe down in the share sheet. Then tap <strong>“Add”</strong> in the top-right corner.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 text-xs text-[#22C55E] flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#22C55E]" />
                  <span>The app will appear with its icon on your iPhone home screen and run standalone!</span>
                </div>
              </div>
            )}

            {/* Desktop / PC Instructions */}
            {activeTab === 'pc' && (
              <div className="space-y-3 text-xs sm:text-sm text-[#A1A1AA]">
                <div className="flex items-start space-x-3 p-3 rounded-xl bg-[#000000] border border-[#27272A]">
                  <div className="w-6 h-6 rounded-lg bg-[#18181B] text-[#FFFFFF] font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5 border border-white/5">
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

                <div className="flex items-start space-x-3 p-3 rounded-xl bg-[#000000] border border-[#22C55E]/40">
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
          <div className="pt-2 border-t border-[#27272A]">
            <p className="text-xs font-bold uppercase tracking-wider text-[#A1A1AA] mb-3">
              App Advantages vs Website
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center space-x-2 p-2 rounded-xl bg-[#000000] border border-[#27272A]">
                <Maximize2 className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
                <span className="text-[#FFFFFF]">Fullscreen (No URL Bars)</span>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-xl bg-[#000000] border border-[#27272A]">
                <WifiOff className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
                <span className="text-[#FFFFFF]">100% Offline Ready</span>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-xl bg-[#000000] border border-[#27272A]">
                <Smartphone className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
                <span className="text-[#FFFFFF]">Fast Home Screen Launch</span>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-xl bg-[#000000] border border-[#27272A]">
                <Sparkles className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
                <span className="text-[#FFFFFF]">Zero Latency Math Engine</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#13161D] border-t border-[#27272A] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#18181B] hover:bg-[#2F3542] text-[#FFFFFF] font-semibold text-xs transition-colors cursor-pointer"
          >
            Got it / Close
          </button>
        </div>
      </div>
    </div>
  );
};
