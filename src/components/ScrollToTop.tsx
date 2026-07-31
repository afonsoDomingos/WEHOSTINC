'use client';

import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      
      if (currentScroll > 250) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }

      if (totalScroll > 0) {
        const progress = Math.min(Math.max((currentScroll / totalScroll) * 100, 0), 100);
        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in fade-in zoom-in-75 duration-300">
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Voltar ao topo"
        className="relative group p-2.5 sm:p-3 bg-slate-950/85 hover:bg-slate-900 text-white rounded-full border border-primary-500/30 shadow-lg shadow-primary-950/40 backdrop-blur-xl transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center overflow-hidden"
      >
        {/* Glow neon ring on hover */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-500/20 via-sky-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xs" />

        {/* Dynamic circular SVG scroll progress ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 p-0.5" viewBox="0 0 36 36">
          <path
            className="text-slate-800"
            strokeWidth="2.5"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className="text-primary-500 transition-all duration-150"
            strokeDasharray={`${scrollProgress}, 100`}
            strokeWidth="2.5"
            strokeLinecap="round"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>

        {/* Chevron icon with bounce animation */}
        <ChevronUp className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-primary-400 group-hover:text-white group-hover:-translate-y-0.5 transition-all duration-200 relative z-10" />
      </button>
    </div>
  );
}
