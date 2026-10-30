'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Search, Shield, CheckCircle2, Clock, AlertTriangle, 
  ArrowLeft, Download, MessageSquare, Copy, Check, 
  Wallet, FileText, Phone, Sparkles, HelpCircle, ChevronRight
} from 'lucide-react';

export default function CashvibeClientPortalPage() {
  const [phone, setPhone] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone && !documentNumber) {
      setError('Por favor, informe o seu número de telefone ou número de BI/Documento.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/cashvibe/portal/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, documentNumber }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Nenhum registo de crédito localizado.');
      }

      setData(json);
    } catch (err: any) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSendProofWhatsApp = () => {
    if (!data?.activeLoan) return;
    const loan = data.activeLoan;
    const supportPhone = (data.paymentInstructions?.supportWhatsApp || '+258845678901').replace(/\D/g, '');
    const msg = `Olá Cashvibe! Segue o meu comprovativo de pagamento do empréstimo *${loan.id}* em nome de *${data.client.name}*. Por favor, confirmem a recepção para emissão do recibo oficial. Obrigado!`;
    window.open(`https://wa.me/${supportPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Topo / Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-white block">Cashvibe</span>
              <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider block -mt-1">Microcrédito</span>
            </div>
          </Link>

          <a
            href="https://wa.me/258845678901?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20meu%20cr%C3%A9dito%20Cashvibe"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Suporte WhatsApp</span>
          </a>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        
        {/* Banner Hero */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Portal do Mutuário
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Consulte o Seu Microcrédito
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Verifique o seu saldo devedor atual, datas de vencimento, dados para pagamento via M-Pesa e baixe os seus recibos oficiais em PDF.
          </p>
        </div>

        {/* Formulário de Consulta */}
        {!data && (
          <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Número de Telefone (M-Pesa / Contacto) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-500 font-mono">+258</span>
                  <input
                    type="tel"
                    placeholder="84 / 85 / 86 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-16 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-semibold text-white placeholder-slate-500 focus:outline-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Número do BI / Documento <span className="text-slate-500 font-normal">(Opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: 110100234567M"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-semibold text-white placeholder-slate-500 focus:outline-emerald-500 font-mono uppercase"
                />
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>A pesquisar registos...</span>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Consultar Meu Crédito</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
              <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Consulta protegida e autenticada pela Cashvibe Microcrédito</span>
              </p>
            </div>
          </div>
        )}

        {/* Detalhes do Crédito Localizado */}
        {data && (
          <div className="space-y-6">
            
            {/* Header com botão de Voltar e Identificação */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black text-lg">
                  {data.client.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{data.client.name}</h2>
                  <p className="text-xs text-slate-400 font-mono">
                    Contacto: {data.client.phone} {data.client.documentNumber && `• Doc: ${data.client.documentNumber}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                  Classificação: Nota {data.client.rating}
                </span>

                <button
                  onClick={() => setData(null)}
                  className="px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs text-slate-300 transition"
                >
                  Nova Consulta
                </button>
              </div>
            </div>

            {/* Caso 1: Possui Empréstimo Ativo */}
            {data.activeLoan ? (
              <div className="space-y-6">
                
                {/* Card Principal: Saldo Devedor */}
                <div className={`p-6 rounded-2xl border shadow-xl relative overflow-hidden ${
                  data.activeLoan.status === 'overdue'
                    ? 'bg-gradient-to-br from-rose-950/80 via-slate-900 to-slate-900 border-rose-800/80'
                    : 'bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-900 border-emerald-800/60'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          data.activeLoan.status === 'overdue'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {data.activeLoan.status === 'overdue' ? 'Em Atraso de Pagamento' : 'Empréstimo Ativo'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">ID: {data.activeLoan.id}</span>
                      </div>

                      <div className="text-xs text-slate-400 mt-3 font-semibold uppercase">Saldo Devedor Atual</div>
                      <div className="text-3xl sm:text-4xl font-black text-white mt-0.5">
                        {Number(data.activeLoan.totalRemaining).toLocaleString('pt-MZ')} <span className="text-lg text-emerald-400">MT</span>
                      </div>

                      <div className="text-xs text-slate-400 mt-2">
                        Total Concedido: <strong className="text-white">{Number(data.activeLoan.principalAmount).toLocaleString('pt-MZ')} MT</strong> • 
                        Total Pago: <strong className="text-emerald-400">{Number(data.activeLoan.totalPaid).toLocaleString('pt-MZ')} MT</strong>
                      </div>
                    </div>

                    <div className="text-left sm:text-right space-y-2">
                      <div className="text-xs text-slate-400">Data Limite de Vencimento</div>
                      <div className="text-lg font-black text-amber-300 font-mono">
                        {data.activeLoan.finalDueDate}
                      </div>

                      <a
                        href={`/api/admin/cashvibe/loans/${data.activeLoan.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Baixar Contrato Oficial</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Caixa de Como Pagar via M-Pesa */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-white">Instruções para Pagamento via M-Pesa</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Conta M-Pesa */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Conta Oficial M-Pesa</div>
                        <div className="text-base font-black text-white font-mono mt-0.5">
                          {data.paymentInstructions.mpesaAccount}
                        </div>
                        <div className="text-[11px] text-emerald-400 font-semibold">{data.paymentInstructions.mpesaName}</div>
                      </div>

                      <button
                        onClick={() => copyToClipboard(data.paymentInstructions.mpesaAccount.replace(/\s/g, ''), 'mpesa')}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="Copiar Número"
                      >
                        {copiedKey === 'mpesa' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Referência a colocar */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Referência do Pagamento</div>
                        <div className="text-base font-black text-white font-mono mt-0.5">
                          {data.activeLoan.id}
                        </div>
                        <div className="text-[11px] text-slate-400">Colocar na mensagem do M-Pesa</div>
                      </div>

                      <button
                        onClick={() => copyToClipboard(data.activeLoan.id, 'ref')}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="Copiar Referência"
                      >
                        {copiedKey === 'ref' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                  </div>

                  {/* Ação de Enviar Comprovativo no WhatsApp */}
                  <div className="mt-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-slate-300 text-center sm:text-left">
                      Já efetuou o pagamento por M-Pesa? Envie o comprovativo agora para validação imediata.
                    </div>
                    <button
                      onClick={handleSendProofWhatsApp}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 whitespace-nowrap shadow-md shadow-emerald-500/20"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Enviar Comprovativo WhatsApp</span>
                    </button>
                  </div>
                </div>

                {/* Cronograma de Parcelas */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-slate-800">
                    <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                      Cronograma de Parcelas
                    </h3>
                  </div>

                  <div className="divide-y divide-slate-800 text-xs">
                    {(data.activeLoan.installments || []).map((inst: any, idx: number) => (
                      <div key={idx} className="p-4 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white">Parcela #{inst.number}</div>
                          <div className="text-[11px] text-slate-400">Vencimento: {inst.dueDate}</div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-bold text-white">{Number(inst.amount).toLocaleString('pt-MZ')} MT</div>
                            {inst.status === 'paid' ? (
                              <span className="text-[10px] text-emerald-400 font-bold">Liquidada</span>
                            ) : (
                              <span className="text-[10px] text-amber-400 font-bold">Resta {Number(inst.remainingAmount).toLocaleString('pt-MZ')} MT</span>
                            )}
                          </div>

                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inst.status === 'paid'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : inst.status === 'overdue'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {inst.status === 'paid' ? 'Pago' : inst.status === 'overdue' ? 'Vencida' : 'Pendente'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">Nenhum Empréstimo em Aberto!</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  A sua conta encontra-se 100% regularizada. Não existem parcelas pendentes ou saldo devedor.
                </p>
              </div>
            )}

            {/* Recibos Emitidos */}
            {data.recentPayments && data.recentPayments.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4">
                  Recibos Oficiais de Pagamentos Efetuados
                </h3>

                <div className="space-y-2.5">
                  {data.recentPayments.map((p: any, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-mono font-bold text-emerald-400">{p.receiptNumber}</div>
                        <div className="text-[11px] text-slate-500">Data: {p.paymentDate} • Via {p.paymentMethod?.toUpperCase()}</div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-black text-white">{Number(p.amount).toLocaleString('pt-MZ')} MT</span>
                        <a
                          href={`/api/admin/cashvibe/payments/${p.receiptNumber}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold text-[11px] transition flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>Cashvibe Microcrédito • Desenvolvido e operado pela WeHost Inc. Moçambique</p>
      </footer>

    </div>
  );
}
