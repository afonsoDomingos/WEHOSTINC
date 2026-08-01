/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { Server } from 'lucide-react';

interface BrandLogoProps {
  href?: string;
  onClick?: () => void;
  iconBgClass?: string;
  iconColorClass?: string;
  logoHeightClass?: string;
  className?: string;
  dark?: boolean;
}

export default function BrandLogo({
  href = '/',
  onClick,
  iconBgClass = 'bg-primary-50 border border-primary-100',
  iconColorClass = 'text-primary-600',
  logoHeightClass = 'h-6 sm:h-7 md:h-8',
  className = '',
  dark = false
}: BrandLogoProps) {
  try {
    const logoContent = (
      <div className={`inline-flex items-center space-x-1.5 sm:space-x-2.5 group cursor-pointer ${className}`}>
        <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition shrink-0 ${dark ? 'bg-primary-600/20 border border-primary-500/40' : iconBgClass}`}>
          <Server className={`h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 ${dark ? 'text-primary-400' : iconColorClass}`} />
        </div>
        <img
          src="/logo.png"
          alt="WEHOSTHERE"
          className={`${logoHeightClass} w-auto object-contain shrink-0`}
          onError={(e) => {
            console.error('Erro ao carregar logo:', e);
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
    );

    if (href) {
      return (
        <Link href={href} onClick={onClick}>
          {logoContent}
        </Link>
      );
    }

    return logoContent;
  } catch (err) {
    console.error('Erro no BrandLogo:', err);
    return null;
  }
}
