'use client';

import React from 'react';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import PageLoader from '@/components/PageLoader';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { authorized, loading } = useAdminGuard();

  if (loading || !authorized) {
    return <PageLoader message="A validar permissões de administrador..." />;
  }

  return <>{children}</>;
}
