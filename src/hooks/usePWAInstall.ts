import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isIOSSafari, setIsIOSSafari] = useState(false);
  const [isIOSOtherBrowser, setIsIOSOtherBrowser] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // 1. Detect if running in standalone mode (already installed on phone/desktop)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    setIsInstalled(isStandalone);

    // 2. Detect platform & browser
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIPadOS = (navigator as any).platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1;
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) || isIPadOS;
    const isAndroidDevice = /android/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/crios|fxios|opios|mercury|instagram|fbav|messenger/.test(userAgent);
    const isSafariOnIOS = isIOSDevice && isSafari;
    const isOtherOnIOS = isIOSDevice && !isSafari;

    setIsIOS(isIOSDevice);
    setIsIOSSafari(isSafariOnIOS);
    setIsIOSOtherBrowser(isOtherOnIOS);
    setIsAndroid(isAndroidDevice);

    // 3. Capture beforeinstallprompt (Android Chrome, Edge, Chromium)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setCanInstall(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        setCanInstall(false);
        return true;
      }
    } catch (err) {
      console.error('Install prompt error:', err);
    }
    return false;
  };

  return {
    canInstall,
    isInstalled,
    isIOS,
    isIOSSafari,
    isIOSOtherBrowser,
    isAndroid,
    triggerInstall,
    deferredPrompt,
  };
}
