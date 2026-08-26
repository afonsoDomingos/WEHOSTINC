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
    
    const loadAndRedirect = async () => {
      console.log('[CourseRedirect] Iniciando redirecionamento para curso:', courseId);
      
      // Buscar módulos locais primeiro para redirecionamento rápido
      let modules = dataManager.getModules(courseId).sort((a, b) => a.order - b.order);
      
      // Se não encontrar módulos locais, buscar todos os módulos disponíveis
      if (modules.length === 0) {
        const allModules = dataManager.getModules();
        if (allModules.length > 0) {
          modules = allModules.sort((a, b) => a.order - b.order);
        }
      }
      
      const targetChapterId = modules.length > 0 ? modules[0].id : 'module-1';
      console.log('[CourseRedirect] Redirecionando para capítulo:', targetChapterId);
      router.replace(`/dashboard/academy/course/${courseId}/chapter/${targetChapterId}`);
      setLoading(false);

      // Buscar dados do servidor em background
      Promise.all([
        dataManager.fetchCoursesAsync(),
        dataManager.fetchModulesAsync()
      ]).then(() => {
        console.log('[CourseRedirect] Dados do servidor atualizados');
      }).catch(e => {
        console.error('[CourseRedirect] Erro ao buscar dados do servidor:', e);
      });
    };

    loadAndRedirect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, router]);

  if (loading) return <PageLoader text="A carregar curso..." />;

  return null;
}
