'use client';

import BrandLogo from './BrandLogo';

interface PageLoaderProps {
  text?: string;
}

export default function PageLoader({ text = 'A carregar os seus dados...' }: PageLoaderProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <BrandLogo href="" logoHeightClass="h-9 sm:h-10" />
        <div className="flex items-center space-x-2.5 bg-gray-50 border border-gray-200/80 px-4 py-2 rounded-full shadow-xs">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent shrink-0" />
          <span className="text-xs font-semibold text-gray-600">{text}</span>
        </div>
      </div>
    </div>
  );
}
