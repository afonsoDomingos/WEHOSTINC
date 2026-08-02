'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';

export default function SiteQuoteRedirect() {
  const router = useRouter();

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (currentUser) {
      // Redirect to dashboard version if logged in
      router.replace('/dashboard/site-quote');
    } else {
      // Redirect to login if not authenticated
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">A redirecionar...</p>
      </div>
    </div>
  );
}
