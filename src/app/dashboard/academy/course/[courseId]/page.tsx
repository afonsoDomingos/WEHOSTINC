'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { auth, User } from '@/lib/auth';
import { dataManager, Course, Module } from '@/lib/data';
import PageLoader from '@/components/PageLoader';

export default function CourseRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Aguardar NextAuth carregar
    if (status === 'loading') return;
    
    let currentUser: User | null = null;
    
    // Tentar NextAuth primeiro
    if (status === 'authenticated' && session?.user) {
      currentUser = {
        id: (session.user as any)?.id || session.user.email || '',
        name: session.user.name || '',
        email: session.user.email || '',
        plan: (session.user as any)?.plan || 'none',
        status: (session.user as any)?.status || 'active',
        role: (session.user as any)?.role || 'user',
        avatar: session.user.image || undefined,
        dueDate: (session.user as any)?.dueDate,
        createdAt: (session.user as any)?.createdAt || new Date().toISOString()
      };
    }
    
    // Fallback para sistema customizado (se NextAuth falhar ou não estiver autenticado)
    if (!currentUser) {
      currentUser = auth.getCurrentUser();
    }
    
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (currentUser.role === 'admin' || currentUser.email.toLowerCase() === 'admin@wehosthere.com') {
      router.push('/admin');
      return;
    }
    
    const loadAndRedirect = async () => {
      console.log('[CourseRedirect] Iniciando redirecionamento para curso:', courseId);
      
      // Try to load from server first, but fallback to localStorage
      try {
        console.log('[CourseRedirect] Buscando dados do servidor...');
        await Promise.all([
          dataManager.fetchCoursesAsync(),
          dataManager.fetchModulesAsync()
        ]);
        console.log('[CourseRedirect] Dados do servidor carregados');
      } catch (e) {
        console.error('[CourseRedirect] Erro ao buscar dados do servidor, usando dados locais:', e);
      }

      // Always use local data for redirect
      console.log('[CourseRedirect] Buscando módulos locais para curso:', courseId);
      const modules = dataManager.getModules(courseId).sort((a, b) => a.order - b.order);
      console.log('[CourseRedirect] Módulos encontrados:', modules.length);
      
      if (modules.length > 0) {
        const firstModule = modules[0];
        console.log('[CourseRedirect] Redirecionando para primeiro módulo:', firstModule.id);
        router.replace(`/dashboard/academy/course/${courseId}/chapter/${firstModule.id}`);
      } else {
        console.error('[CourseRedirect] Nenhum módulo encontrado, redirecionando para academy');
        router.replace('/dashboard/academy');
      }
      setLoading(false);
    };

    loadAndRedirect();
  }, [courseId, router]);

  if (loading) return <PageLoader text="A carregar curso..." />;

  return null;
}
