'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Mic, MicOff, Send, Sparkles, X, Bot, ArrowRight, 
  Copy, Check, RefreshCw, Layers, ShieldCheck, DollarSign, Users, Mail
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
          content: '⚠️ Ocorreu um erro ao comunicar com a IA. Por favor, tente novamente.',
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
    { label: '📊 Status Geral', prompt: 'Resuma o status geral de utilizadores e vendas hoje' },
    { label: '💰 Pagamentos Pendentes', prompt: 'Quais faturas ou clientes têm pagamentos pendentes?' },
    { label: '📧 Configuração DNS', prompt: 'Como configurar os registos DNS do email Migadu?' },
    { label: '📢 Enviar Comunicado', prompt: 'Como enviar um email em massa para todos os clientes?' },
  ];

  return (
    <div className="relative w-full max-w-2xl mx-auto px-4 py-2 z-50">
      {/* 🔮 Top Bar Input Capsule com Aurora Glow */}
      <div className="relative group">
        {/* Glow Multicolorido Aurora (Borda luminosa) */}
        <div 
          className={`absolute -inset-[1.5px] rounded-full opacity-80 blur-[2px] transition duration-500 group-hover:opacity-100 ${
            isListening 
              ? 'animate-pulse bg-gradient-to-r from-red-500 via-pink-500 to-amber-500' 
              : 'bg-gradient-to-r from-orange-500 via-amber-400 via-emerald-400 via-cyan-400 to-indigo-500'
          }`}
        />

        {/* Linha Fina Brilhante no Topo (Efeito do screenshot) */}
        <div className="absolute top-0 inset-x-4 h-[1px] bg-gradient-to-r from-transparent via-amber-300 via-emerald-300 to-transparent opacity-90 rounded-full" />

        {/* Estrutura da Cápsula */}
        <div className="relative flex items-center bg-[#0d1117]/95 backdrop-blur-xl rounded-full px-4 py-2 shadow-2xl border border-white/10 hover:border-white/20 transition-all duration-300">
          
          {/* Ícone Indicador de IA */}
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white/5 mr-2.5 text-amber-400 shrink-0">
            <Sparkles className="w-4 h-4 animate-pulse" />
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
            className="w-full bg-transparent text-gray-100 placeholder-gray-400 text-sm md:text-base focus:outline-none font-medium tracking-wide"
          />

          {/* Botões de Ação (Voz e Envio) */}
          <div className="flex items-center space-x-1.5 shrink-0 ml-2">
            {query.trim() && (
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={loading}
                className="p-1.5 rounded-full bg-primary-600 hover:bg-primary-500 text-white transition-all transform active:scale-95 shadow-md"
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
                  ? 'bg-red-500/20 text-red-400 animate-bounce'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
              title={isListening ? 'Parar de ouvir' : 'Falar com a IA por voz'}
            >
              {isListening ? (
                <MicOff className="w-4 h-4 text-red-400" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 🚀 Painel de Respostas & Ações da IA (Dropdown Glassmorphism) */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute top-full left-4 right-4 mt-2 bg-[#0d1117]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-4 text-gray-100 overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-top-2 max-h-[500px] flex flex-col"
        >
          {/* Cabeçalho do Painel */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 to-indigo-500 flex items-center justify-center text-white">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                WEHOSTHERE AI Copilot
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="text-xs text-gray-400 hover:text-white transition px-2 py-1 rounded-md hover:bg-white/5"
                >
                  Limpar histórico
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sugestões Rápidas (Chips) quando o chat estiver vazio */}
          {messages.length === 0 && (
            <div className="py-4 space-y-3">
              <p className="text-xs text-gray-400 font-medium">Comandos rápidos sugeridos:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickPrompts.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(item.prompt)}
                    className="flex items-center text-left text-xs bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 p-2.5 rounded-xl transition text-gray-300 hover:text-white group"
                  >
                    <span className="mr-2">{item.label}</span>
                    <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
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
                    className={`max-w-[90%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white font-medium rounded-br-none shadow-md'
                        : 'bg-white/5 border border-white/10 text-gray-200 rounded-bl-none shadow-lg'
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>

                    {msg.role === 'assistant' && (
                      <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400">
                        <span>WEHOSTHERE AI</span>
                        <button
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                          className="flex items-center space-x-1 hover:text-white transition"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-green-400" />
                              <span className="text-green-400">Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
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
                <div className="flex items-center space-x-2 text-xs text-amber-400 py-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>A processar resposta inteligente...</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
