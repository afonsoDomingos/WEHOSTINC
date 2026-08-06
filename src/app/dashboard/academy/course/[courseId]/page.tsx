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
      await Promise.all([
        dataManager.fetchCoursesAsync(),
        dataManager.fetchModulesAsync()
      ]);

      const modules = dataManager.getModules(courseId).sort((a, b) => a.order - b.order);
      if (modules.length > 0) {
        const firstModule = modules[0];
        router.replace(`/dashboard/academy/course/${courseId}/chapter/${firstModule.id}`);
      } else {
        router.replace('/dashboard/academy');
      }
      setLoading(false);
    };

    loadAndRedirect();
  }, [courseId, router]);

  if (loading) return <PageLoader text="A carregar curso..." />;

  return null;
}
