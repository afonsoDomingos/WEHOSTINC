'use client';

import React from 'react';
import { AlertTriangle, Trash2, CheckCircle2, Info, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  type?: 'danger' | 'warning' | 'info' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant,
  type = 'danger',
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const activeVariant = (variant || type || 'danger') as 'danger' | 'warning' | 'info' | 'success';

  const variantStyles = {
    danger: {
      bgIcon: 'bg-red-100 text-red-600 border-red-200',
      icon: <Trash2 className="h-6 w-6" />,
      btnConfirm: 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-200',
    },
    warning: {
      bgIcon: 'bg-amber-100 text-amber-600 border-amber-200',
      icon: <AlertTriangle className="h-6 w-6" />,
      btnConfirm: 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-200',
    },
    info: {
      bgIcon: 'bg-blue-100 text-blue-600 border-blue-200',
      icon: <Info className="h-6 w-6" />,
      btnConfirm: 'bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-200',
    },
    success: {
      bgIcon: 'bg-emerald-100 text-emerald-600 border-emerald-200',
      icon: <CheckCircle2 className="h-6 w-6" />,
      btnConfirm: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200',
    }
  }[activeVariant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full p-6 animate-in zoom-in-95 duration-200 relative overflow-hidden">
        {/* Header decorativo */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start space-x-4 mb-4">
          <div className={`p-3.5 rounded-2xl border shrink-0 ${variantStyles.bgIcon}`}>
            {variantStyles.icon}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 leading-snug">{title}</h3>
            <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2.5 font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer ${variantStyles.btnConfirm}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
