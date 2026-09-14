import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    const checkIsInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInApp = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isInApp);
    };

    checkIsInstalled();

    // Listen for beforeinstallprompt
    // Só interceptar fora da página de login (para não bloquear o banner nativo sem mostrar o customizado)
    const handleBeforeInstallPrompt = (e: Event) => {
      const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/';
      if (!isLoginPage) {
        // Fora do login: capturar evento para mostrar banner customizado
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setIsInstallable(true);
      }
      // Na página de login: não fazemos preventDefault(), o browser mostra o banner nativo
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsInstalled(true);
      // Remove the install prompt from localStorage
      localStorage.removeItem('pwaInstallDismissed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      return false;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
      localStorage.removeItem('pwaInstallDismissed');
      return true;
    } else {
      setDeferredPrompt(null);
      setIsInstallable(false);
      return false;
    }
  };

  const dismissInstall = () => {
    setDeferredPrompt(null);
    setIsInstallable(false);
    localStorage.setItem('pwaInstallDismissed', 'true');
  };

  return {
    isInstallable,
    isInstalled,
    promptInstall,
    dismissInstall
  };
}
