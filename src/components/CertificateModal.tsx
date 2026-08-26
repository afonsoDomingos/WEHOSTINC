'use client';

import { useState } from 'react';
import { Award, Printer, Copy, Check, X, ShieldCheck, Download, Sparkles } from 'lucide-react';
import { Certificate } from '@/lib/data';
import BrandLogo from '@/components/BrandLogo';

interface CertificateModalProps {
  certificate: Certificate;
  isOpen: boolean;
  onClose: () => void;
}

export default function CertificateModal({ certificate, isOpen, onClose }: CertificateModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(certificate.certificateNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const formattedDate = new Date(certificate.completionDate || certificate.createdAt).toLocaleDateString('pt-MZ', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-6">
        
        {/* Header Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-amber-400" />
            <span className="font-bold text-sm">Certificado de Conclusão Oficial</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold transition"
              title="Imprimir ou Salvar em PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Certificate Printable Canvas */}
        <div className="p-6 sm:p-10 bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 text-center relative border-8 border-double border-amber-500/30 m-4 sm:m-6 rounded-2xl shadow-inner">
          {/* Watermark / Background Accent */}
          <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none"></div>

          {/* Top Logo & Seal */}
          <div className="flex flex-col items-center mb-6">
            <div className="mb-2">
              <BrandLogo />
            </div>
            <p className="text-[10px] sm:text-xs font-black tracking-widest text-amber-800 uppercase">
              WEHOSTHERE WEB ACADEMY • MOÇAMBIQUE
            </p>
          </div>

          {/* Title */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-serif uppercase">
              Certificado de Conclusão
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 italic">
              Este documento certifica oficialmente que
            </p>
          </div>

          {/* Student Name */}
          <div className="my-6 py-2 border-b-2 border-amber-600/40 inline-block min-w-[280px] sm:min-w-[400px]">
            <h2 className="text-xl sm:text-3xl font-black text-primary-900 tracking-wide">
              {certificate.userName || certificate.userEmail}
            </h2>
          </div>

          {/* Course Details */}
          <p className="text-xs sm:text-sm text-slate-700 max-w-xl mx-auto leading-relaxed mb-6">
            concluiu com êxito e aproveitamento todas as etapas do curso de capacitação técnica profissional em
          </p>

          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 sm:p-4 max-w-lg mx-auto mb-8 shadow-sm">
            <h3 className="text-base sm:text-xl font-bold text-amber-950">
              {certificate.courseTitle}
            </h3>
          </div>

          {/* Signatures & Seal Footer */}
          <div className="grid grid-cols-2 gap-6 items-end pt-4 border-t border-slate-200 mt-6 max-w-xl mx-auto">
            <div className="text-center">
              <p className="text-xs sm:text-sm font-bold text-slate-900">Equipa Pedagógica</p>
              <p className="text-[10px] sm:text-xs text-slate-500">WEHOSTHERE Academy</p>
              <p className="text-[10px] text-slate-400 mt-1">Data: {formattedDate}</p>
            </div>
            <div className="text-center flex flex-col items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white shadow-md mb-1 border-2 border-white">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <p className="text-[10px] font-mono text-slate-600 font-bold">
                N.º: {certificate.certificateNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions / Copy Code */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <span>Código de Validação:</span>
            <code className="bg-white px-2 py-1 rounded border border-gray-300 font-mono font-bold text-gray-900">
              {certificate.certificateNumber}
            </code>
            <button
              onClick={handleCopyCode}
              className="p-1 hover:bg-gray-200 rounded transition text-gray-600"
              title="Copiar código"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition shadow-sm inline-flex items-center space-x-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Descarregar / Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl text-xs font-semibold transition"
            >
              Fechar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
