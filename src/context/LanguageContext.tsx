'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { dictionaryPTtoEN } from '@/lib/translations';

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

  // Função otimizada para traduzir nós de texto do DOM - usa seletores CSS específicos
  const translateDOM = (toLang: Language) => {
    if (typeof window === 'undefined') return;
    const dict = toLang === 'en' ? dictionaryPTtoEN : dictionaryENtoPT;

    // Traduz apenas elementos com texto direto, ignorando estrutura complexa
    const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, button, label, div[role="button"]');
    
    textElements.forEach(el => {
      // Ignorar elementos que já foram traduzidos ou têm filhos complexos
      if (el.getAttribute('data-translated') === toLang) return;
      if (el.children.length > 0 && !el.hasAttribute('data-translate-children')) return;
      
      const text = el.textContent?.trim();
      if (text && dict[text]) {
        el.textContent = dict[text];
        el.setAttribute('data-translated', toLang);
      }
    });

    // Traduz placeholders de inputs de forma mais eficiente
    const inputs = document.querySelectorAll('input[placeholder], textarea[placeholder]');
    inputs.forEach(input => {
      const ph = input.getAttribute('placeholder')?.trim();
      if (ph && dict[ph]) {
        input.setAttribute('placeholder', dict[ph]);
        input.setAttribute('data-translated', toLang);
      }
    });
  };

  useEffect(() => {
    const saved = localStorage.getItem('wehost_lang') as Language;
    if (saved === 'pt' || saved === 'en') {
      setLanguageState(saved);
      document.documentElement.lang = saved === 'pt' ? 'pt-MZ' : 'en';

      if (saved === 'en') {
        setTimeout(() => {
          translateDOM('en');
        }, 300);
      }
    }
  }, []);

  // Observer para manter elementos dinâmicos traduzidos - DESATIVADO por performance
  // Este MutationObserver estava causando lentidão massiva ao retraduzir todo o DOM
  // em cada mudança mínima. Sistema simplificado agora traduz apenas na mudança de idioma.
  // useEffect(() => {
  //   if (language !== 'en' || typeof window === 'undefined') return;

  //   const observer = new MutationObserver(() => {
  //     translateDOM('en');
  //   });

  //   observer.observe(document.body, {
  //     childList: true,
  //     subtree: true,
  //     characterData: true
  //   });

  //   return () => observer.disconnect();
  // }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('wehost_lang', lang);
    document.documentElement.lang = lang === 'pt' ? 'pt-MZ' : 'en';

    // Se mudou para Português, remove cookies e traduz de volta
    if (lang === 'pt') {
      document.cookie = `googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
      document.cookie = `googtrans=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
      // Recarregar página para limpar traduções do DOM
      window.location.reload();
      return;
    }

    // Se mudou para Inglês, usa apenas tradução via dicionário local (muito mais rápido)
    translateDOM('en');
  };

  // Função loadGoogleTranslateScript removida - usando apenas tradução local por performance
  // O Google Translate era muito pesado e causava lentidão

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['pt']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
