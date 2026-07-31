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
  logoHeightClass = 'h-7 sm:h-8',
  className = '',
  dark = false
}: BrandLogoProps) {
  const logoContent = (
    <div className={`inline-flex items-center space-x-2.5 group cursor-pointer ${className}`}>
      <div className={`p-2 rounded-xl transition shrink-0 ${dark ? 'bg-primary-600/20 border border-primary-500/40' : iconBgClass}`}>
        <Server className={`h-5 w-5 sm:h-6 sm:w-6 ${dark ? 'text-primary-400' : iconColorClass}`} />
      </div>
      <img
        src="/logo.png"
        alt="WEHOSTHERE"
        className={`${logoHeightClass} w-auto object-contain shrink-0`}
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
}
