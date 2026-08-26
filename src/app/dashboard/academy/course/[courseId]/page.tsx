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
    console.log('[CourseRedirect] useEffect iniciado, status:', status);
    // Aguardar NextAuth carregar
    if (status === 'loading') {
      console.log('[CourseRedirect] Aguardando NextAuth carregar...');
      return;
    }
    
    let currentUser: User | null = null;
    
    // Tentar NextAuth primeiro
    if (status === 'authenticated' && session?.user) {
      console.log('[CourseRedirect] Usuário autenticado via NextAuth:', session.user.email);
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
      console.log('[CourseRedirect] NextAuth não disponível, tentando auth customizado');
      currentUser = auth.getCurrentUser();
      console.log('[CourseRedirect] Usuário do auth customizado:', currentUser?.email);
    }
    
    if (!currentUser) {
      console.error('[CourseRedirect] Nenhum usuário encontrado, redirecionando para login');
      router.push('/login');
      return;
    }
    
    const loadAndRedirect = async () => {
      console.log('[CourseRedirect] Iniciando redirecionamento para curso:', courseId);
      
      try {
        // Buscar módulos locais primeiro para redirecionamento rápido
        let modules = dataManager.getModules(courseId).sort((a, b) => a.order - b.order);
        console.log('[CourseRedirect] Módulos locais para courseId:', courseId, '-', modules.length);
        
        // Se não encontrar módulos locais, buscar todos os módulos disponíveis
        if (modules.length === 0) {
          console.log('[CourseRedirect] Nenhum módulo local encontrado, buscando todos os módulos');
          const allModules = dataManager.getModules();
          console.log('[CourseRedirect] Total de módulos disponíveis:', allModules.length);
          if (allModules.length > 0) {
            modules = allModules.sort((a, b) => a.order - b.order);
            console.log('[CourseRedirect] Módulos obtidos:', modules.map(m => ({ id: m.id, courseId: m.courseId })));
          }
        }
        
        const targetChapterId = modules.length > 0 ? modules[0].id : 'module-1';
        console.log('[CourseRedirect] Redirecionando para capítulo:', targetChapterId);
        console.log('[CourseRedirect] URL completa:', `/dashboard/academy/course/${courseId}/chapter/${targetChapterId}`);
        router.replace(`/dashboard/academy/course/${courseId}/chapter/${targetChapterId}`);
        setLoading(false);

        // Buscar dados do servidor em background
        console.log('[CourseRedirect] Iniciando fetch do servidor em background');
        Promise.all([
          dataManager.fetchCoursesAsync(),
          dataManager.fetchModulesAsync()
        ]).then(() => {
          console.log('[CourseRedirect] Dados do servidor atualizados com sucesso');
        }).catch(e => {
          console.error('[CourseRedirect] Erro ao buscar dados do servidor:', e);
        });
      } catch (error) {
        console.error('[CourseRedirect] Erro em loadAndRedirect:', error);
        setLoading(false);
      }
    };

    loadAndRedirect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, router]);

  if (loading) return <PageLoader text="A carregar curso..." />;

  return null;
}
