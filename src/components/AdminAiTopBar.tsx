'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Mic, MicOff, Send, Sparkles, X, ArrowRight, 
  Copy, Check, RefreshCw, BarChart3, Users, ShoppingBag, 
  CreditCard, LifeBuoy, Handshake, Globe, Mail
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AdminAiTopBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Inicializar SpeechRecognition do navegador (voz)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'pt-PT';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setQuery(transcript);
          setIsListening(false);
          // Auto submeter ao reconhecer voz
          handleSend(transcript);
        };

        recognition.onerror = (event: any) => {
          console.warn('[Speech Recognition] Erro:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Fechar painel ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current && 
        !panelRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert('O seu navegador não suporta reconhecimento de voz direto. Pode digitar o seu comando!');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setIsOpen(true);
      } catch (e) {
        console.error('Erro ao iniciar microfone:', e);
        setIsListening(false);
      }
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || query).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsOpen(true);
    setLoading(true);

    try {
      const response = await fetch('/api/ai/admin-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: text,
          history: messages.slice(-4).map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer || 'Não consegui obter uma resposta para este comando.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('[AI Top Bar] Erro:', err);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Ocorreu um erro ao comunicar com o Copilot. Por favor, tente novamente.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    { label: 'Visão Geral do Sistema', icon: BarChart3, prompt: 'Resuma o status geral de utilizadores, vendas e métricas hoje' },
    { label: 'Utilizadores Recentes', icon: Users, prompt: 'Quem são os últimos utilizadores registados no sistema?' },
    { label: 'Pedidos & Vendas', icon: ShoppingBag, prompt: 'Mostre a lista dos últimos pedidos e vendas realizadas' },
    { label: 'Faturas Pendentes', icon: CreditCard, prompt: 'Quais faturas ou clientes têm pagamentos pendentes?' },
    { label: 'Tickets de Suporte', icon: LifeBuoy, prompt: 'Temos algum chamado de suporte ou ticket em aberto?' },
    { label: 'Comissões de Afiliados', icon: Handshake, prompt: 'Qual o valor total de comissões pendentes de afiliados?' },
    { label: 'Configuração DNS', icon: Globe, prompt: 'Como configurar os registos DNS do email Migadu?' },
    { label: 'Comunicação em Massa', icon: Mail, prompt: 'Como enviar um email em massa para todos os clientes?' },
  ];

  const formatContent = (rawText: string) => {
    // 1. Remover asteriscos duplos (**) ou simples (*) e emojis infantis/informais
    const cleanText = (rawText || '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/[\u{1F916}\u{1F465}\u{1F6D2}\u{1F4B0}\u{1F3AB}\u{1F310}\u{1F4E2}\u{1F449}\u{1F91D}\u{1F4E7}\u{2705}\u{26A0}\u{FE0F}]/gu, '');

    // 2. Transformar links markdown [Texto](/rota) em botões de navegação
    const parts = cleanText.split(/(\[[^\]]+\]\([^)]+\))/g);

    return parts.map((part, index) => {
      const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (match) {
        const [, linkText, href] = match;
        return (
          <button
            key={index}
            type="button"
            onClick={() => {
              setIsOpen(false);
              router.push(href);
            }}
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-bold underline underline-offset-2 mx-1 transition cursor-pointer"
          >
            {linkText}
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto px-4 py-2 z-50">
      {/* 🔮 Top Bar Input Capsule com Aurora Glow */}
      <div className="relative group">
        {/* Glow Multicolorido Aurora (Borda luminosa) */}
        <div 
          className={`absolute -inset-[1.5px] rounded-full opacity-85 blur-[2.5px] transition duration-500 group-hover:opacity-100 ${
            isListening 
              ? 'animate-pulse bg-gradient-to-r from-red-500 via-pink-500 to-amber-500' 
              : 'bg-gradient-to-r from-sky-400 via-primary-500 via-cyan-300 via-emerald-400 to-amber-400'
          }`}
        />

        {/* Linha Fina Brilhante no Topo */}
        <div className="absolute top-0 inset-x-4 h-[1px] bg-gradient-to-r from-transparent via-sky-200 via-cyan-200 to-transparent opacity-90 rounded-full" />

        {/* Estrutura da Cápsula — Azul Oficial WEHOSTHERE */}
        <div className="relative flex items-center bg-gradient-to-r from-[#075985] via-[#0369a1] to-[#0284c7] backdrop-blur-xl rounded-full px-4 py-2 shadow-xl shadow-primary-900/20 border border-white/20 hover:border-white/35 transition-all duration-300">
          
          {/* Logótipo WEHOSTHERE */}
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20 mr-2.5 shrink-0 overflow-hidden p-1 border border-white/30 shadow-xs">
            <img 
              src="/icon-192.png" 
              alt="WEHOSTHERE" 
              className="w-full h-full object-contain rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.png';
              }}
            />
          </div>

          {/* Campo de Texto */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (messages.length > 0) setIsOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={isListening ? 'A ouvir a sua voz...' : 'Digite o seu comando...'}
            className="w-full bg-transparent text-white placeholder-sky-100/75 text-sm md:text-base focus:outline-none font-medium tracking-wide"
          />

          {/* Botões de Ação (Voz e Envio) */}
          <div className="flex items-center space-x-1.5 shrink-0 ml-2">
            {query.trim() && (
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={loading}
                className="p-1.5 rounded-full bg-white hover:bg-sky-50 text-primary-700 font-bold transition-all transform active:scale-95 shadow-md"
                title="Enviar comando"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={toggleVoice}
              className={`p-2 rounded-full transition-all duration-300 ${
                isListening
                  ? 'bg-red-500/30 text-white animate-bounce'
                  : 'text-sky-100 hover:text-white hover:bg-white/15'
              }`}
              title={isListening ? 'Parar de ouvir' : 'Falar com a IA por voz'}
            >
              {isListening ? (
                <MicOff className="w-4 h-4 text-white" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 🚀 Painel de Respostas & Ações da IA (Efeito Vidro Fosco Translúcido / Glassmorphism) */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute top-full left-4 right-4 mt-3 bg-white/45 backdrop-blur-2xl border border-white/70 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15),0_0_0_1px_rgba(255,255,255,0.6)_inset] ring-1 ring-black/5 rounded-3xl p-5 text-gray-900 overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-top-3 max-h-[520px] flex flex-col z-50"
        >
          {/* Cabeçalho do Painel */}
          <div className="flex items-center justify-between pb-3.5 border-b border-gray-200/40">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-xl bg-white/70 backdrop-blur-md shadow-2xs border border-white/80 flex items-center justify-center overflow-hidden p-1">
                <img src="/icon-192.png" alt="WEHOSTHERE" className="w-full h-full object-contain rounded-lg" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                  WEHOSTHERE AI Copilot
                </span>
                <span className="text-[10px] text-gray-600 font-medium block">Assistente Operacional Inteligente</span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition px-2.5 py-1 rounded-lg hover:bg-white/50 cursor-pointer"
                >
                  Limpar
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-white/50 transition cursor-pointer"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sugestões Rápidas (Chips) quando o chat estiver vazio */}
          {messages.length === 0 && (
            <div className="py-4 space-y-3">
              <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">Perguntas Rápidas:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {quickPrompts.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(item.prompt)}
                    className="flex items-center text-left text-xs bg-white/40 hover:bg-white/75 border border-white/60 hover:border-primary-400 p-3 rounded-2xl transition-all text-gray-800 hover:text-primary-700 shadow-2xs hover:shadow-xs group cursor-pointer backdrop-blur-md"
                  >
                    <item.icon className="w-4 h-4 text-primary-600 mr-2.5 shrink-0 transition-transform group-hover:scale-110" />
                    <span className="font-semibold truncate">{item.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-auto text-gray-400 group-hover:text-primary-600 transition-transform group-hover:translate-x-0.5 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lista de Mensagens */}
          {messages.length > 0 && (
            <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1 text-sm custom-scrollbar">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[92%] rounded-2xl px-4 py-3 text-xs sm:text-sm ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-br-xs shadow-md'
                        : 'bg-white/50 border border-white/70 text-gray-900 rounded-bl-xs shadow-xs backdrop-blur-md ring-1 ring-black/5'
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {formatContent(msg.content)}
                    </div>

                    {msg.role === 'assistant' && (
                      <div className="mt-2.5 pt-2 border-t border-gray-200/40 flex items-center justify-between text-[11px] text-gray-600 font-medium">
                        <span className="flex items-center gap-1.5 font-bold text-gray-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          WEHOSTHERE AI
                        </span>
                        <button
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                          className="flex items-center space-x-1 hover:text-gray-900 px-2 py-0.5 rounded-md hover:bg-white/60 transition cursor-pointer"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-600 font-bold">Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center space-x-2 text-xs font-bold text-primary-600 py-3 px-3 bg-white/50 backdrop-blur-md rounded-xl border border-white/70 shadow-xs w-fit">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary-600" />
                  <span>A consultar banco de dados e processar resposta...</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
