'use client';

import { useEffect, useRef } from 'react';
import { CheckCircle, Sparkles, PartyPopper } from 'lucide-react';

interface ApprovalCelebrationProps {
  show: boolean;
  type: 'email' | 'domain';
  name: string;
  onDone: () => void;
}

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#f43f5e', '#facc15',
  '#34d399', '#60a5fa',
];

function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: {
      x: number; y: number; vx: number; vy: number;
      color: string; size: number; rotation: number; rotSpeed: number;
      shape: 'rect' | 'circle';
    }[] = [];

    for (let i = 0; i < 180; i++) {
      particles.push({
        x: randomBetween(canvas.width * 0.3, canvas.width * 0.7),
        y: randomBetween(canvas.height * 0.25, canvas.height * 0.45),
        vx: randomBetween(-8, 8),
        vy: randomBetween(-18, -4),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: randomBetween(6, 14),
        rotation: randomBetween(0, Math.PI * 2),
        rotSpeed: randomBetween(-0.15, 0.15),
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
      });
    }

    let animId: number;
    let tick = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.vy += 0.45; // gravity
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;

        const alpha = Math.max(0, 1 - tick / 120);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      tick++;
      if (tick < 150) {
        animId = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
    />
  );
}

export default function ApprovalCelebration({ show, type, name, onDone }: ApprovalCelebrationProps) {
  useEffect(() => {
    if (show) {
      const t = setTimeout(onDone, 4500);
      return () => clearTimeout(t);
    }
  }, [show, onDone]);

  if (!show) return null;

  return (
    <>
      <Confetti />

      {/* Toast de celebração */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[10000] animate-bounce-in">
        <div
          className="flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border border-white/20 text-white"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
            boxShadow: '0 20px 60px rgba(99,102,241,0.5)',
            animation: 'celebrationPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          }}
        >
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <PartyPopper className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-bold text-lg">
              <CheckCircle className="w-5 h-5 text-emerald-300" />
              {type === 'email' ? 'E-mail Aprovado!' : 'Domínio Aprovado!'}
              <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" />
            </div>
            <p className="text-white/90 text-sm mt-0.5 max-w-xs truncate">
              <span className="font-semibold">{name}</span> está agora{' '}
              <span className="text-emerald-300 font-bold">ativo</span> e pronto a usar! 🎉
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes celebrationPop {
          0% { opacity: 0; transform: translateX(-50%) translateY(30px) scale(0.8); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}
