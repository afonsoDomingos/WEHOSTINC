'use client';

import { useState, useEffect } from 'react';
import { X, Mail, MessageCircle, Download, BookOpen, DollarSign, Sparkles, CheckCircle, Loader2, Bell, UserPlus, Share2, Box, HelpCircle } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useSession } from 'next-auth/react';

interface CardConfig {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  actionText: string;
  actionUrl?: string;
  actionType: 'link' | 'whatsapp' | 'pwa' | 'newsletter' | 'push' | 'signup' | 'social' | 'systems' | 'assistant';
  bgColor: string;
  borderColor: string;
  iconBg: string;
  iconColor: string;
  buttonText: string;
}

const CARDS: CardConfig[] = [
  {
    id: 'signup',
    icon: <UserPlus className="h-5 w-5" />,
    title: 'Crie sua conta grátis',
    description: 'Comece a hospedar seus sites hoje mesmo',
    actionText: 'Criar Conta',
    actionUrl: '/register',
    actionType: 'signup',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-300',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    buttonText: 'Criar Conta'
  },
  {
    id: 'push',
    icon: <Bell className="h-5 w-5" />,
    title: 'Ative as Notificações Push',
    description: 'Receba alertas importantes sobre seus sites e pagamentos',
    actionText: 'Ativar Agora',
    actionType: 'push',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    buttonText: 'Ativar'
  },
  {
    id: 'whatsapp',
    icon: <MessageCircle className="h-5 w-5" />,
    title: 'Precisa de ajuda?',
    description: 'Fale com o nosso suporte por WhatsApp',
    actionText: 'Falar no WhatsApp',
    actionUrl: 'https://wa.me/258848335618?text=Olá, preciso de ajuda com a WEHOSTHERE',
    actionType: 'whatsapp',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    buttonText: 'WhatsApp'
  },
  {
    id: 'pwa',
    icon: <Download className="h-5 w-5" />,
    title: 'Instale a WEHOSTHERE App',
    description: 'Acesso rápido, notificações e uso offline',
    actionText: 'Instalar Agora',
    actionType: 'pwa',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    buttonText: 'Instalar'
  },
  {
    id: 'social',
    icon: <Share2 className="h-5 w-5" />,
    title: 'Siga-nos nas redes sociais',
    description: 'Fique por dentro das novidades e promoções',
    actionText: 'Seguir Redes',
    actionUrl: 'https://www.facebook.com/wehosthere',
    actionType: 'social',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-300',
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600',
    buttonText: 'Seguir'
  },
  {
    id: 'systems',
    icon: <Box className="h-5 w-5" />,
    title: 'Sistemas prontos para aluguer',
    description: 'E-commerce, ERP, CRM e muito mais',
    actionText: 'Ver Sistemas',
    actionUrl: '/dashboard/systems',
    actionType: 'systems',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-300',
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
    buttonText: 'Ver Sistemas'
  },
  {
    id: 'assistant',
    icon: <HelpCircle className="h-5 w-5" />,
    title: 'Saiba mais sobre nossos serviços',
    description: 'Converse com nosso assistente virtual',
    actionText: 'Falar com Assistente',
    actionUrl: '#assistant',
    actionType: 'assistant',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-300',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    buttonText: 'Saiba Mais'
  },
  {
    id: 'blog',
    icon: <BookOpen className="h-5 w-5" />,
    title: 'Novidades no Blog',
    description: 'Artigos sobre hospedagem, SEO e tecnologia',
    actionText: 'Ler Artigos',
    actionUrl: '/blog',
    actionType: 'link',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    buttonText: 'Blog'
  },
  {
    id: 'pricing',
    icon: <DollarSign className="h-5 w-5" />,
    title: 'Sistemas Prontos',
    description: 'Veja os preços dos nossos sistemas para aluguer',
    actionText: 'Ver Preços',
    actionUrl: '/dashboard/systems',
    actionType: 'link',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    buttonText: 'Preços'
  },
  {
    id: 'newsletter',
    icon: <Mail className="h-5 w-5" />,
    title: '📰 Mantenha-se atualizado!',
    description: 'Receba novidades e atualizações da WEHOSTHERE',
    actionText: 'Subscrever',
    actionType: 'newsletter',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    buttonText: 'Subscrever'
  }
];

export default function ScrollUpCards() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollUpCount, setScrollUpCount] = useState(0);
  
  const { isInstallable, promptInstall } = usePWAInstall();
  const { subscription, permission, requestPermission, isSupported } = usePushNotifications();
  const { data: session } = useSession();
  const user = session?.user;

  useEffect(() => {
    // Verificar se o usuário já fechou todos os cards
    const dismissedCards = JSON.parse(localStorage.getItem('dismissed_scroll_cards') || '[]');
    if (dismissedCards.length >= CARDS.length) return;

    let lastScroll = 0;
    let scrollUpThreshold = 0;
    const SCROLL_UP_THRESHOLD = 100; // pixels de scroll para cima

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = lastScroll - currentScrollY;

      // Detectar scroll para cima significativo
      if (scrollDelta > SCROLL_UP_THRESHOLD && currentScrollY > 200) {
        scrollUpThreshold++;
        
        // Mostrar card a cada 3 scrolls para cima
        if (scrollUpThreshold >= 3) {
          // Encontrar o próximo card não dispensado e aplicável
          const nextCardIndex = CARDS.findIndex((card, index) => {
            // Skip signup card if user is logged in
            if (card.id === 'signup' && user) {
              return false;
            }
            // Skip push card if already activated or not supported
            if (card.id === 'push') {
              if (!isSupported || subscription || permission === 'granted') {
                return false;
              }
            }
            // PWA card always shows (with instructions if not installable)
            return !dismissedCards.includes(card.id) && index >= currentCardIndex;
          });
          
          if (nextCardIndex !== -1) {
            setCurrentCardIndex(nextCardIndex);
            setIsVisible(true);
            scrollUpThreshold = 0;
          }
        }
      }

      lastScroll = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentCardIndex, isSupported, subscription, permission, user]);

  const handleClose = () => {
    const currentCard = CARDS[currentCardIndex];
    const dismissedCards = JSON.parse(localStorage.getItem('dismissed_scroll_cards') || '[]');
    
    if (!dismissedCards.includes(currentCard.id)) {
      dismissedCards.push(currentCard.id);
      localStorage.setItem('dismissed_scroll_cards', JSON.stringify(dismissedCards));
    }
    
    setIsVisible(false);
    
    // Avançar para o próximo card
    const nextCardIndex = CARDS.findIndex((card, index) => 
      !dismissedCards.includes(card.id) && index > currentCardIndex
    );
    if (nextCardIndex !== -1) {
      setCurrentCardIndex(nextCardIndex);
    }
  };

  const handleAction = async () => {
    const currentCard = CARDS[currentCardIndex];
    
    if (currentCard.actionType === 'link' && currentCard.actionUrl) {
      window.location.href = currentCard.actionUrl;
      handleClose();
    } else if (currentCard.actionType === 'whatsapp' && currentCard.actionUrl) {
      window.open(currentCard.actionUrl, '_blank');
      handleClose();
    } else if (currentCard.actionType === 'pwa') {
      if (isInstallable) {
        const success = await promptInstall();
        if (success) {
          handleClose();
        }
      } else {
        // Mostrar instruções manuais se prompt nativo não disponível
        const userAgent = navigator.userAgent.toLowerCase();
        let instructions = '';
        
        if (userAgent.includes('chrome') || userAgent.includes('edge')) {
          instructions = 'Para instalar: Clique no menu (⋮) no canto superior direito → "Instalar WEHOSTHERE" ou "Instalar aplicativo"';
        } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
          instructions = 'Para instalar: Clique no botão "Compartilhar" (⎙) → "Adicionar ao Ecrã Inicial"';
        } else if (userAgent.includes('firefox')) {
          instructions = 'Para instalar: Clique no menu (⋮) → "Instalar" ou "Adicionar à página inicial"';
        } else {
          instructions = 'Para instalar: Procure a opção "Instalar" no menu do seu navegador';
        }
        
        alert(instructions);
      }
    } else if (currentCard.actionType === 'push') {
      const success = await requestPermission();
      if (success) {
        handleClose();
      }
    } else if (currentCard.actionType === 'signup' && currentCard.actionUrl) {
      window.location.href = currentCard.actionUrl;
      handleClose();
    } else if (currentCard.actionType === 'social' && currentCard.actionUrl) {
      window.open(currentCard.actionUrl, '_blank');
      handleClose();
    } else if (currentCard.actionType === 'systems' && currentCard.actionUrl) {
      window.location.href = currentCard.actionUrl;
      handleClose();
    } else if (currentCard.actionType === 'assistant' && currentCard.actionUrl) {
      // Scroll to assistant or trigger assistant
      const assistantElement = document.querySelector('[data-assistant]') || document.querySelector('#assistant');
      if (assistantElement) {
        assistantElement.scrollIntoView({ behavior: 'smooth' });
        // Trigger assistant if it has a click handler
        (assistantElement as HTMLElement).click();
      } else {
        // Fallback: open a page with assistant
        window.location.href = currentCard.actionUrl;
      }
      handleClose();
    } else if (currentCard.actionType === 'newsletter') {
      // Mostrar formulário de newsletter
      // O formulário já está visível no card
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setMessage('Por favor, insira um email válido.');
      setStatus('error');
      return;
    }

    setLoading(true);
    setMessage('');
    setStatus('idle');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'scroll_card' })
      });

      const data = await response.json();

      if (response.ok || data.success) {
        setMessage(data.message || 'Subscrito com sucesso!');
        setStatus('success');
        setEmail('');
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setMessage(data.error || 'Erro ao subscrever. Tente novamente.');
        setStatus('error');
      }
    } catch (err) {
      setMessage('Erro ao conectar. Tente novamente.');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  const currentCard = CARDS[currentCardIndex];
  const isNewsletterCard = currentCard.actionType === 'newsletter';

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 ${currentCard.bgColor} border-t ${currentCard.borderColor} shadow-2xl animate-in slide-in-from-bottom-10 duration-500`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
        {/* Primeira linha: Texto e botão de fechar */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Texto de incentivo */}
          <div className="flex items-center space-x-2 sm:space-x-3 text-gray-900 flex-1 min-w-0">
            <div className={`p-1.5 sm:p-2 ${currentCard.iconBg} rounded-full flex-shrink-0`}>
              <div className={currentCard.iconColor}>
                {currentCard.icon}
              </div>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-xs sm:text-sm sm:text-base truncate">
                {currentCard.title}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-600 hidden sm:block">
                {currentCard.description}
              </p>
            </div>
          </div>

          {/* Botão de fechar */}
          <button
            onClick={handleClose}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
            title="Fechar"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* Formulário de subscrição (apenas para newsletter) */}
        {isNewsletterCard && status !== 'success' && (
          <div className="mt-3 sm:mt-4">
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu email"
                className="w-full px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-xs sm:text-sm"
                disabled={loading}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition flex items-center justify-center space-x-1.5 sm:space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm whitespace-nowrap"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                    <span className="hidden sm:inline">...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span>Subscrever</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Botão de ação (para não-newsletter) */}
        {!isNewsletterCard && (
          <div className="mt-3 sm:mt-4">
            <button
              onClick={handleAction}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition flex items-center justify-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm whitespace-nowrap"
            >
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>{currentCard.buttonText}</span>
            </button>
          </div>
        )}

        {/* Mensagem de sucesso */}
        {isNewsletterCard && status === 'success' && (
          <div className="mt-3 sm:mt-4 flex items-center space-x-2 text-emerald-600">
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="font-semibold text-xs sm:text-sm">Subscrito com sucesso!</span>
          </div>
        )}

        {message && status !== 'idle' && (
          <p className={`text-[10px] sm:text-xs mt-2 text-center ${
            status === 'success' ? 'text-emerald-600' : status === 'error' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
