'use client';

import React from 'react';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import PageLoader from '@/components/PageLoader';
import AdminAiTopBar from '@/components/AdminAiTopBar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { authorized, loading } = useAdminGuard();

  if (loading || !authorized) {
    return <PageLoader message="A validar permissões de administrador..." />;
  }

  return (
    <div className="min-h-screen flex flex-col relative bg-gray-50 dark:bg-[#090d16]">
      {/* 🌟 AI Copilot Top Bar no topo de todas as páginas do Admin */}
      <header className="sticky top-0 z-40 bg-gray-900/80 dark:bg-black/60 backdrop-blur-md border-b border-white/5 py-1 px-4">
        <AdminAiTopBar />
      </header>

      {/* Conteúdo da Página */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
