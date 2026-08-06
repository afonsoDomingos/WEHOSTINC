'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth } from '@/lib/auth';
import { dataManager, Course, Module } from '@/lib/data';
import PageLoader from '@/components/PageLoader';

export default function CourseRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
