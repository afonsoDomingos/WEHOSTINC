'use client';

import { useEffect, useRef } from 'react';

interface AdSenseBannerProps {
  slot?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function AdSenseBanner({
  slot,
  format = 'auto',
  responsive = true,
  className = '',
  style = { display: 'block' }
}: AdSenseBannerProps) {
  const adRef = useRef<HTMLModElement | null>(null);
  const isLoadedRef = useRef(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && !isLoadedRef.current) {
        // Only push once per ad element
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        isLoadedRef.current = true;
      }
    } catch (err) {
      console.warn('[AdSense] Erro ao carregar anúncio:', err);
    }
  }, []);

  return (
    <div className={`adsense-container overflow-hidden text-center my-4 ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={style}
        data-ad-client="ca-pub-5452584470581302"
        data-ad-slot={slot || ''}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}
