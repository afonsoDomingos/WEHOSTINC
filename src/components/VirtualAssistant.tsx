'use client';

import { useState } from 'react';
import { MessageCircle, X, ChevronRight, Phone, Search, Globe, Mail, Server, Layout } from 'lucide-react';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  icon: React.ReactNode;
}

const faqData: FAQItem[] = [
  // Domínio
  {
    id: 'domain-1',
    category: 'Domínio',
    question: 'Como registar um domínio .co.mz?',
    answer: 'O registo de domínio .co.mz é feito através do nosso formulário de registo. O processo demora entre 24-48 horas e inclui configuração DNS completa.',
    icon: <Globe className="w-5 h-5 text-primary-600" />
  },
  {
    id: 'domain-2',
    category: 'Domínio',
    question: 'Quanto custa um domínio .co.mz?',
    answer: 'O domínio .co.mz custa 2.500 MT por ano. Inclui renovação automática e suporte DNS gratuito.',
    icon: <Globe className="w-5 h-5 text-primary-600" />
  },
  {
    id: 'domain-3',
    category: 'Domínio',
    question: 'Posso transferir o meu domínio?',
    answer: 'Sim, transferimos domínios de outros registadores gratuitamente. O processo leva até 5 dias úteis.',
    icon: <Globe className="w-5 h-5 text-primary-600" />
  },
  
  // Hospedagem
  {
    id: 'hosting-1',
    category: 'Hospedagem',
    question: 'Qual plano devo escolher?',
    answer: 'Para sites pessoais: Básico. Para pequenas empresas: Profissional. Para grandes operações: Empresarial. Todos incluem SSL gratuito.',
    icon: <Server className="w-5 h-5 text-primary-600" />
  },
  {
    id: 'hosting-2',
    category: 'Hospedagem',
    question: 'O que acontece se ultrapassar o limite?',
    answer: 'Enviamos um aviso quando atingir 80% do limite. Pode atualizar o plano a qualquer momento sem interrupção.',
    icon: <Server className="w-5 h-5 text-primary-600" />
  },
  {
    id: 'hosting-3',
    category: 'Hospedagem',
    question: 'Têm backup automático?',
    answer: 'Sim, fazemos backup diário automático com retenção de 30 dias. Também oferecemos backup manual sob demanda.',
    icon: <Server className="w-5 h-5 text-primary-600" />
  },
  
  // Email
  {
    id: 'email-1',
    category: 'Email',
    question: 'Como criar contas de email?',
    answer: 'Aceda ao painel de controle > Email > Criar Conta. Pode criar até 20 contas no plano Profissional.',
    icon: <Mail className="w-5 h-5 text-primary-600" />
  },
  {
    id: 'email-2',
    category: 'Email',
    question: 'Como configurar no meu dispositivo?',
    answer: 'Usamos IMAP/SMTP. As configurações são enviadas automaticamente por email após criar a conta. Suportamos Outlook, Gmail, Apple Mail.',
    icon: <Mail className="w-5 h-5 text-primary-600" />
  },
  {
    id: 'email-3',
    category: 'Email',
    question: 'Qual o limite de armazenamento?',
    answer: 'Cada conta tem 5GB no plano Básico, 10GB no Profissional e ilimitado no Empresarial.',
    icon: <Mail className="w-5 h-5 text-primary-600" />
  },
  
  // Site
  {
    id: 'site-1',
    category: 'Site',
    question: 'Como funciona a criação de site?',
    answer: 'Desenvolvemos sites personalizados em 7-14 dias. Inclui design responsivo, SEO básico e integração com redes sociais.',
    icon: <Layout className="w-5 h-5 text-primary-600" />
  },
  {
    id: 'site-2',
    category: 'Site',
    question: 'Posso fazer alterações depois?',
    answer: 'Sim, fornecemos painel de administração para fazer alterações básicas. Para alterações complexas, oferecemos manutenção mensal.',
    icon: <Layout className="w-5 h-5 text-primary-600" />
  },
  {
    id: 'site-3',
    category: 'Site',
    question: 'Inclui domínio e hospedagem?',
    answer: 'Sim, o pacote inclui 1 domínio .co.mz e 1 ano de hospedagem gratuita. Após o primeiro ano, paga apenas renovação.',
    icon: <Layout className="w-5 h-5 text-primary-600" />
  }
];

const categories = ['Todas', 'Domínio', 'Hospedagem', 'Email', 'Site'];

export default function VirtualAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedFAQ, setSelectedFAQ] = useState<FAQItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFAQs = faqData.filter(faq => {
    const matchesCategory = selectedCategory === 'Todas' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleWhatsAppSupport = () => {
    const message = encodeURIComponent('Olá, gostaria de suporte sobre os serviços WEHOSTHERE.');
    window.open(`https://wa.me/258844384702?text=${message}`, '_blank');
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
          title="Assistente Virtual"
        >
          <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Assistente Virtual</h3>
                  <p className="text-xs text-primary-100">Como podemos ajudar?</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[500px] overflow-y-auto">
            {!selectedFAQ ? (
              <>
                {/* Search */}
                <div className="p-4 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Pesquisar perguntas..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Categories */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                          selectedCategory === category
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* FAQ List */}
                <div className="p-4 space-y-2">
                  {filteredFAQs.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm py-4">
                      Nenhuma pergunta encontrada.
                    </p>
                  ) : (
                    filteredFAQs.map(faq => (
                      <button
                        key={faq.id}
                        onClick={() => setSelectedFAQ(faq)}
                        className="w-full text-left p-3 bg-gray-50 hover:bg-primary-50 rounded-xl border border-gray-200 hover:border-primary-200 transition-all duration-200 group"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {faq.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                              {faq.question}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{faq.category}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors flex-shrink-0" />
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* WhatsApp Support */}
                <div className="p-4 border-t border-gray-100">
                  <button
                    onClick={handleWhatsAppSupport}
                    className="w-full flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105 shadow-md"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Falar com Suporte no WhatsApp</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* FAQ Detail */}
                <div className="p-4">
                  <button
                    onClick={() => setSelectedFAQ(null)}
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-primary-600 mb-4 transition"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    <span>Voltar</span>
                  </button>
                  
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="flex-shrink-0">
                      {selectedFAQ.icon}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
                        {selectedFAQ.category}
                      </span>
                      <h4 className="text-lg font-bold text-gray-900 mt-1">
                        {selectedFAQ.question}
                      </h4>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {selectedFAQ.answer}
                    </p>
                  </div>
                </div>

                {/* WhatsApp Support */}
                <div className="p-4 border-t border-gray-100">
                  <button
                    onClick={handleWhatsAppSupport}
                    className="w-full flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105 shadow-md"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Precisa de mais ajuda? Fale no WhatsApp</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
