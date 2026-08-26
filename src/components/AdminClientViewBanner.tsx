'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight, Eye, UserCheck } from 'lucide-react';
import { auth, User } from '@/lib/auth';

export default function AdminClientViewBanner() {
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const isClientView = auth.isClientViewActive();
    setActive(isClientView);
    if (isClientView) {
      setCurrentUser(auth.getCurrentUser());
    }
  }, []);

  if (!active) return null;

  const handleReturnToAdmin = () => {
    auth.stopClientView();
    router.push('/admin');
  };

  return (
    <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 text-white px-3 sm:px-4 py-2 text-xs font-medium border-b border-amber-500/30 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="inline-flex items-center space-x-1 font-extrabold text-amber-400">
            <Eye className="h-3.5 w-3.5" />
            <span>MODO CLIENTE ATIVO</span>
          </span>
          <span className="text-gray-300 hidden md:inline">
            • A ver o painel como: <strong className="text-white">{currentUser?.name || currentUser?.email}</strong> ({currentUser?.email})
          </span>
        </div>

        <button
          onClick={handleReturnToAdmin}
          className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition shadow-sm text-xs cursor-pointer ml-auto"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Voltar ao Painel Admin</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
