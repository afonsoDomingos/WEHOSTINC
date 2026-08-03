'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { dictionaryPTtoEN, dictionaryENtoPT } from '@/lib/translations';

export type Language = 'pt' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  pt: {
    'nav.plans': 'Planos',
    'nav.sites': 'Criação de Sites (a partir de 12.000 MT)',
    'nav.systems': 'Sistemas Prontos',
    'nav.resources': 'Recursos',
    'nav.contact': 'Contacto',
    'nav.login': 'Login',
    'nav.register': 'Criar Conta',
    'nav.dashboard': 'Meu Painel',
    'nav.admin': 'Painel Admin',
    'hero.badge': 'Infraestrutura Cloud de Alta Velocidade',
    'hero.title1': 'Hospedagem de Sites & Email Profissional em',
    'hero.title2': 'Moçambique',
    'hero.subtitle': 'Servidores ultra-rápidos com armazenamento NVMe SSD, certificado SSL grátis e suporte local 24/7. Transfira ou registe o seu domínio hoje mesmo.',
    'hero.search_placeholder': 'Digite o nome do seu domínio (ex: minhaempresa.co.mz)...',
    'hero.search_btn': 'Pesquisar',
    'pricing.title': 'Escolha o Plano Ideal para o Seu Negócio',
    'pricing.monthly': 'Mensal',
    'pricing.annual': 'Anual (2 Meses Grátis)',
    'pricing.per_month': 'MT /mês',
    'pricing.per_year': 'MT /ano',
    'pricing.btn_subscribe': 'Assinar Agora',
    'common.available': 'Disponível!',
    'common.unavailable': 'Indisponível',
  },
  en: {
    'nav.plans': 'Plans',
    'nav.sites': 'Website Creation (from 12,000 MT)',
    'nav.systems': 'Ready Systems',
    'nav.resources': 'Features',
    'nav.contact': 'Contact',
    'nav.login': 'Login',
    'nav.register': 'Create Account',
    'nav.dashboard': 'My Dashboard',
    'nav.admin': 'Admin Panel',
    'hero.badge': 'High-Speed Cloud Infrastructure',
    'hero.title1': 'Web Hosting & Professional Email in',
    'hero.title2': 'Mozambique',
    'hero.subtitle': 'Ultra-fast servers with NVMe SSD storage, free SSL certificate and 24/7 local support. Transfer or register your domain today.',
    'hero.search_placeholder': 'Enter your domain name (e.g. mycompany.co.mz)...',
    'hero.search_btn': 'Search',
    'pricing.title': 'Choose the Ideal Plan for Your Business',
    'pricing.monthly': 'Monthly',
    'pricing.annual': 'Annual (2 Months Free)',
    'pricing.per_month': 'MT /month',
    'pricing.per_year': 'MT /year',
    'pricing.btn_subscribe': 'Subscribe Now',
    'common.available': 'Available!',
    'common.unavailable': 'Unavailable',
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'pt',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('pt');

  // Função para varrer e traduzir nós de texto do DOM dinamicamente
  const translateDOM = (toLang: Language) => {
    if (typeof window === 'undefined') return;
    const dict = toLang === 'en' ? dictionaryPTtoEN : dictionaryENtoPT;

    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const val = node.nodeValue || '';
        const trimmed = val.trim();
        if (trimmed && dict[trimmed]) {
          node.nodeValue = val.replace(trimmed, dict[trimmed]);
        }
      } else if (
        node.nodeType === Node.ELEMENT_NODE &&
        node.nodeName !== 'SCRIPT' &&
        node.nodeName !== 'STYLE' &&
        node.nodeName !== 'TEXTAREA' &&
        node.nodeName !== 'INPUT'
      ) {
        const el = node as HTMLElement;
        if (el.getAttribute('placeholder')) {
          const ph = el.getAttribute('placeholder')?.trim();
          if (ph && dict[ph]) el.setAttribute('placeholder', dict[ph]);
        }
        for (const child of Array.from(node.childNodes)) {
          walk(child);
        }
      }
    };

    walk(document.body);
  };

  useEffect(() => {
    const saved = localStorage.getItem('wehost_lang') as Language;
    if (saved === 'pt' || saved === 'en') {
      setLanguageState(saved);
      document.documentElement.lang = saved === 'pt' ? 'pt-MZ' : 'en';

      if (saved === 'en') {
        setTimeout(() => {
          translateDOM('en');
          loadGoogleTranslateScript('en');
        }, 300);
      }
    }
  }, []);

  // Observer para manter elementos dinâmicos traduzidos
  useEffect(() => {
    if (language !== 'en' || typeof window === 'undefined') return;

    const observer = new MutationObserver(() => {
      translateDOM('en');
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => observer.disconnect();
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('wehost_lang', lang);
    document.documentElement.lang = lang === 'pt' ? 'pt-MZ' : 'en';

    // Se mudou para Português, recarrega a página de forma limpa para restaurar a interface original
    if (lang === 'pt') {
      document.cookie = `googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
      document.cookie = `googtrans=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
      window.location.reload();
      return;
    }

    // Se mudou para Inglês, aciona traduções e motor
    translateDOM('en');
    const targetLang = 'en';
    document.cookie = `googtrans=/pt/${targetLang}; path=/; domain=${window.location.hostname}`;
    document.cookie = `googtrans=/pt/${targetLang}; path=/;`;

    const selectEl = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
    if (selectEl) {
      selectEl.value = targetLang;
      selectEl.dispatchEvent(new Event('change'));
    } else {
      loadGoogleTranslateScript(targetLang);
    }
  };

  const loadGoogleTranslateScript = (targetLang: string) => {
    if (document.getElementById('google-translate-script')) {
      const selectEl = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
      if (selectEl) {
        selectEl.value = targetLang;
        selectEl.dispatchEvent(new Event('change'));
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    document.body.appendChild(script);

    (window as any).googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement(
        { pageLanguage: 'pt', includedLanguages: 'en,pt', autoDisplay: false },
        'google_translate_element'
      );
      setTimeout(() => {
        const selectEl = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
        if (selectEl) {
          selectEl.value = targetLang;
          selectEl.dispatchEvent(new Event('change'));
        }
      }, 500);
    };
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['pt']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <div id="google-translate-element" style={{ display: 'none' }} />
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
