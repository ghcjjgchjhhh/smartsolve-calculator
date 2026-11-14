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
  ExternalLink,
  HelpCircle,
  ShieldAlert,
  Compass,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    canInstall,
    isInstalled,
    isIOS,
    isIOSSafari,
    isIOSOtherBrowser,
    isAndroid,
    isInIframe,
    triggerInstall,
  } = usePWAInstall();

  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'troubleshoot' | 'pc'>(() => {
    if (isIOS) return 'ios';
    if (isAndroid) return 'android';
    return 'android';
  });

  if (!isOpen) return null;

  const appUrl = window.location.href;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // fallback
      const textArea = document.createElement('textarea');
      textArea.value = appUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleOpenExternal = () => {
    window.open(appUrl, '_blank', 'noopener,noreferrer');
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
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-[#0A0A0A] rounded-3xl shadow-2xl border border-[#27272A] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with App Icon */}
        <div className="relative bg-[#13161D] p-5 sm:p-6 text-[#FFFFFF] border-b border-[#27272A]">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 p-2 rounded-xl bg-[#18181B] hover:bg-[#2F3542] text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3 sm:space-x-4 pr-10">
            <div className="w-14 h-14 rounded-2xl bg-[#18181B] border border-[#22C55E]/40 shadow-xl p-1.5 flex-shrink-0 flex items-center justify-center text-[#22C55E]">
              <img
                src="/icon.svg"
                alt="SmartSolve App Icon"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-[#FFFFFF]">SmartSolve App</span>
                <span className="bg-[#22C55E]/20 text-[#22C55E] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#22C55E]/30 uppercase">
                  Mobile PWA
                </span>
              </div>
              <p className="text-xs text-[#A1A1AA] mt-1">
                Install directly on your phone home screen — runs fast, full screen & 100% offline.
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Iframe Preview Warning: High Priority Notice */}
          {isInIframe && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm space-y-2">
              <div className="flex items-start space-x-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-300">Why can't I install from inside this preview?</p>
                  <p className="text-amber-200/90 text-xs leading-relaxed">
                    You are viewing SmartSolve inside an <strong>embedded browser frame (iframe)</strong>. Phone browsers (Android Chrome & iOS Safari) strictly block app installation inside iframes for security.
                  </p>
                </div>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleOpenExternal}
                  className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Full Phone Browser</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-2 px-3 rounded-xl bg-[#18181B] hover:bg-[#27272A] border border-white/10 text-white font-medium text-xs flex items-center justify-center space-x-1.5 cursor-pointer transition-all active:scale-95"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                      <span className="text-[#22C55E] font-bold">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy App URL</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Status if already installed */}
          {isInstalled ? (
            <div className="p-4 rounded-2xl bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center space-x-3 text-[#FFFFFF]">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-[#22C55E]" />
              <div>
                <p className="text-sm font-bold text-[#FFFFFF]">App Already Installed on this Device!</p>
                <p className="text-xs text-[#A1A1AA] mt-0.5">
                  SmartSolve Calculator is installed. You can open it anytime from your home screen or app drawer.
                </p>
              </div>
            </div>
          ) : (
            /* Direct One-Tap Install Action if browser supports it */
            canInstall && (
              <div className="p-4 rounded-2xl bg-[#000000] border border-[#22C55E]/40 shadow-lg">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#FFFFFF] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#22C55E]" />
                      1-Tap Phone Install Ready
                    </p>
                    <p className="text-xs text-[#A1A1AA] mt-0.5">
                      Tap below to add SmartSolve directly to your phone's home screen.
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
            <div className="grid grid-cols-4 rounded-xl bg-[#000000] border border-[#27272A] p-1 mb-4 text-xs font-semibold gap-1">
              <button
                onClick={() => setActiveTab('android')}
                className={`flex items-center justify-center space-x-1 py-2 rounded-lg transition-all ${
                  activeTab === 'android'
                    ? 'bg-[#22C55E] text-[#FFFFFF] shadow-sm font-bold'
                    : 'text-[#A1A1AA] hover:text-[#FFFFFF]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Android</span>
                <span className="xs:hidden">Android</span>
              </button>
              <button
                onClick={() => setActiveTab('ios')}
                className={`flex items-center justify-center space-x-1 py-2 rounded-lg transition-all ${
                  activeTab === 'ios'
                    ? 'bg-[#22C55E] text-[#FFFFFF] shadow-sm font-bold'
                    : 'text-[#A1A1AA] hover:text-[#FFFFFF]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>iPhone</span>
              </button>
              <button
                onClick={() => setActiveTab('troubleshoot')}
                className={`flex items-center justify-center space-x-1 py-2 rounded-lg transition-all ${
                  activeTab === 'troubleshoot'
                    ? 'bg-[#22C55E] text-[#FFFFFF] shadow-sm font-bold'
                    : 'text-[#A1A1AA] hover:text-[#FFFFFF]'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Why Can't I?</span>
              </button>
              <button
                onClick={() => setActiveTab('pc')}
                className={`flex items-center justify-center space-x-1 py-2 rounded-lg transition-all ${
                  activeTab === 'pc'
                    ? 'bg-[#22C55E] text-[#FFFFFF] shadow-sm font-bold'
                    : 'text-[#A1A1AA] hover:text-[#FFFFFF]'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>PC / Mac</span>
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
                      Open in Google Chrome on your Phone
                    </p>
                    <p className="text-[#A1A1AA] text-xs mt-0.5">
                      Ensure you are using <strong>Google Chrome</strong> or <strong>Samsung Internet</strong> (not in incognito or an in-app viewer).
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-xl bg-[#000000] border border-[#27272A]">
                  <div className="w-6 h-6 rounded-lg bg-[#18181B] text-[#FFFFFF] font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5 border border-white/5">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-[#FFFFFF] flex items-center gap-1.5">
                      Tap the Chrome menu <MoreVertical className="w-4 h-4 text-[#22C55E] inline" /> (three vertical dots)
                    </p>
                    <p className="text-[#A1A1AA] text-xs mt-0.5">
                      Located in the top-right corner of Chrome.
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
                      The SmartSolve Calculator icon will be pinned directly onto your home screen and launcher.
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

                <div className="pt-2 flex items-center justify-between p-3 rounded-xl bg-[#13161D] border border-white/5 text-xs">
                  <span className="text-[#A1A1AA]">Need the direct app link for your phone?</span>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#18181B] hover:bg-[#27272A] text-white font-semibold transition-colors cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* iOS Instructions */}
            {activeTab === 'ios' && (
              <div className="space-y-3 text-xs sm:text-sm text-[#A1A1AA]">
                {/* Explanation why iPhone works this way */}
                <div className="p-3.5 rounded-2xl bg-[#18181B] border border-white/10 text-xs space-y-1">
                  <div className="flex items-center space-x-1.5 text-[#FFFFFF] font-bold">
                    <Compass className="w-3.5 h-3.5 text-[#22C55E]" />
                    <span>Apple iOS Rule: Safari is Required</span>
                  </div>
                  <p className="text-[#A1A1AA] leading-relaxed">
                    Apple does not permit any web browser to show automatic 1-tap install prompts. On iPhone or iPad, Apple requires you to use <strong>Safari</strong> and tap <strong>"Add to Home Screen"</strong>.
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
                          Chrome or in-app browsers on iPhone cannot install apps. Copy this link and open it in <strong>Safari</strong>:
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
                      Ensure you are viewing this page in Safari on your iPhone or iPad.
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
                      At the bottom navigation bar of Safari, tap the square icon with an arrow pointing upward.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-[#000000] border border-[#22C55E]/40">
                  <div className="w-6 h-6 rounded-lg bg-[#22C55E] text-[#FFFFFF] font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-[#FFFFFF] flex items-center gap-1.5">
                      Scroll down and tap <PlusSquare className="w-4 h-4 text-white inline" /> <span className="font-bold underline text-white">“Add to Home Screen”</span>
                    </p>
                    <p className="text-[#A1A1AA] text-xs mt-0.5">
                      Then tap <strong>“Add”</strong> in the top-right corner. SmartSolve will appear as an app icon!
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 text-xs text-white flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#22C55E]" />
                  <span>Runs full screen without browser toolbars, with instant launch!</span>
                </div>
              </div>
            )}

            {/* Troubleshooting Tab ("Why can't I install on my phone?") */}
            {activeTab === 'troubleshoot' && (
              <div className="space-y-3 text-xs sm:text-sm text-[#A1A1AA]">
                <div className="p-3 rounded-xl bg-[#18181B] border border-white/5 space-y-1">
                  <p className="font-bold text-[#FFFFFF] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                    1. Are you viewing inside an embedded preview or app?
                  </p>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed">
                    If you are inside AI Studio preview, or clicked a link from WhatsApp, Instagram, Telegram, or Gmail, the app is trapped in a webview. Tap the 3 dots in that app and choose <strong>“Open in Chrome”</strong> (Android) or <strong>“Open in Safari”</strong> (iPhone).
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#18181B] border border-white/5 space-y-1">
                  <p className="font-bold text-[#FFFFFF] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                    2. Are you using an iPhone / iPad?
                  </p>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed">
                    Apple iOS will <em>never</em> show an automatic "Install" button. You must open Safari, tap the <strong>Share</strong> button (box with arrow), and select <strong>"Add to Home Screen"</strong>. Chrome on iOS does not support PWA installation.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#18181B] border border-white/5 space-y-1">
                  <p className="font-bold text-[#FFFFFF] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                    3. Are you in Incognito / Private Browsing?
                  </p>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed">
                    Browsers disable Service Workers and app installation when Incognito/Private tabs are active. Switch to a standard normal tab.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#18181B] border border-white/5 space-y-1">
                  <p className="font-bold text-[#FFFFFF] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                    4. Is it already installed on your phone?
                  </p>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed">
                    Check your phone's app drawer or search your home screens for <strong>"SmartSolve"</strong>. If installed, the browser suppresses the prompt to avoid duplicate apps.
                  </p>
                </div>

                {/* Direct Action */}
                <div className="p-3 rounded-xl bg-[#000000] border border-[#22C55E]/30 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <span className="text-xs text-white font-medium">Copy direct link to open in your phone's Chrome or Safari:</span>
                  <button
                    onClick={handleCopyLink}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 transition-all shrink-0"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied to Clipboard!' : 'Copy Direct App Link'}</span>
                  </button>
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
                      In Chrome, Edge, or Brave, look for the <strong>Install</strong> icon (computer monitor with a down arrow) at the far right of the address bar.
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
            <p className="text-xs font-bold uppercase tracking-wider text-[#A1A1AA] mb-2.5">
              Installed App Advantages
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
                <span className="text-[#FFFFFF]">Phone Home Screen Icon</span>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-xl bg-[#000000] border border-[#27272A]">
                <Sparkles className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
                <span className="text-[#FFFFFF]">Fast Math & Physics Engine</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#13161D] border-t border-[#27272A] flex items-center justify-between">
          <button
            onClick={handleCopyLink}
            className="flex items-center space-x-1.5 text-xs text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
          </button>
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
