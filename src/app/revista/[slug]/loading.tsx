import Link from 'next/link';
import { Code2, ArrowLeft, Download, ChevronRight } from 'lucide-react';

export default function RevistaStoryLoading() {
  return (
    <>
      <style>{`
        .story-page { font-family: 'Poppins', sans-serif; background: #f8fafc; min-height: 100vh; }

        /* ── Top Announcement Bar (Kabum style com cores WEHOSTHERE) ── */
        .story-top-bar {
          background: linear-gradient(90deg, #3C096C 0%, #5A189A 50%, #7B2CBF 100%);
          color: #ffffff;
          padding: 0.45rem 1rem;
          font-size: 0.8rem;
          font-weight: 500;
          position: relative;
          z-index: 55;
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        }
        .story-top-bar-inner {
          max-width: 1100px; margin: 0 auto;
          display: flex; align-items: center; justify-content: center;
          gap: 0.75rem; flex-wrap: wrap; text-align: center;
        }
        .story-top-bar-badge {
          background: rgba(255, 255, 255, 0.22);
          color: #ffffff;
          font-size: 0.68rem; font-weight: 800;
          letter-spacing: 0.06em;
          padding: 0.12rem 0.6rem;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.35);
          text-transform: uppercase;
        }
        .story-top-bar-text { font-size: 0.8rem; }
        .story-top-bar-link {
          color: #ffffff;
          text-decoration: none;
          display: inline-flex; align-items: center; gap: 0.35rem;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.15);
          padding: 0.15rem 0.7rem;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.25);
          transition: all 0.2s;
        }
        .story-top-bar-link:hover {
          background: #ffffff;
          color: #5A189A;
        }

        /* ── Sticky Header (Barra Roxa + Navbar) ── */
        .story-sticky-header {
          position: sticky;
          top: 0;
          z-index: 100;
          width: 100%;
        }
        .story-nav {
          background: #fff;
          border-bottom: 1px solid #f1f5f9;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
        }
        .story-nav-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 1.5rem;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .story-nav-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .story-nav-home {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          text-decoration: none;
          padding: 0.35rem 0.65rem;
          border-radius: 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
        }
        .story-nav-home-logo {
          font-size: 0.76rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
        }
        .story-nav-home-logo span { color: #7B2CBF; }
        .story-nav-divider {
          width: 1px;
          height: 24px;
          background: #e2e8f0;
        }
        .story-nav-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
        }
        .story-nav-brand-text {
          font-size: 1.05rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
        }
        .story-nav-brand-text span {
          background: #7B2CBF;
          color: #fff;
          border-radius: 4px;
          padding: 0 4px;
        }
        .story-nav-back-link {
          display: flex; align-items: center; gap: 0.3rem;
          font-size: 0.82rem; color: #475569; text-decoration: none;
          font-weight: 500; white-space: nowrap;
          transition: color 0.2s;
        }
        .story-nav-back-link:hover { color: #7B2CBF; }

        /* ── Breadcrumb ── */
        .breadcrumb {
          max-width: 760px;
          margin: 0 auto;
          padding: 1.25rem 1.5rem 0;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.78rem;
          color: #94a3b8;
        }
        .breadcrumb a { color: #7B2CBF; text-decoration: none; }
        .breadcrumb-sep { color: #cbd5e1; }

        /* ── Dynamic Processing Loader ── */
        .story-loader-wrapper {
          max-width: 820px;
          margin: 0 auto;
          padding: 2.5rem 1.5rem 5rem;
          font-family: 'Poppins', sans-serif;
        }
        .story-loader-card {
          position: relative;
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid rgba(123, 44, 191, 0.12);
          box-shadow: 0 10px 40px rgba(123, 44, 191, 0.08);
          padding: 3.5rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          overflow: hidden;
        }
        .story-loader-orb {
          position: absolute;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 340px;
          height: 340px;
          background: radial-gradient(circle, rgba(157, 78, 221, 0.15) 0%, rgba(123, 44, 191, 0.05) 50%, transparent 70%);
          filter: blur(28px);
          pointer-events: none;
          z-index: 0;
          animation: pulseOrb 3s ease-in-out infinite;
        }
        @keyframes pulseOrb {
          0%, 100% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.6; }
          50% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
        }

        .story-spinner-box {
          position: relative;
          width: 92px;
          height: 92px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.8rem;
          z-index: 1;
        }
        .story-spinner-ring-outer {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 3.5px solid transparent;
          border-top-color: #7B2CBF;
          border-right-color: #9D4EDD;
          border-bottom-color: #E0AAFF;
          animation: spinOuter 1.1s cubic-bezier(0.55, 0.15, 0.45, 0.85) infinite;
          filter: drop-shadow(0 0 10px rgba(123, 44, 191, 0.4));
        }
        @keyframes spinOuter {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .story-spinner-ring-inner {
          position: absolute;
          inset: 8px;
          border-radius: 50%;
          border: 2px dashed rgba(123, 44, 191, 0.35);
          animation: spinInner 2.2s linear infinite reverse;
        }
        @keyframes spinInner {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .story-spinner-center {
          position: relative;
          z-index: 2;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #fbf7ff;
          border: 1px solid rgba(123, 44, 191, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(123, 44, 191, 0.18);
          animation: pulseCenter 2s ease-in-out infinite;
        }
        @keyframes pulseCenter {
          0%, 100% { transform: scale(1); box-shadow: 0 4px 16px rgba(123, 44, 191, 0.18); }
          50% { transform: scale(1.08); box-shadow: 0 6px 24px rgba(157, 78, 221, 0.35); }
        }

        .story-loader-badge {
          position: relative;
          z-index: 1;
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          background: rgba(123, 44, 191, 0.08);
          border: 1px solid rgba(123, 44, 191, 0.22);
          padding: 0.32rem 0.9rem;
          border-radius: 9999px;
          font-size: 0.72rem;
          font-weight: 700;
          color: #7B2CBF;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 0.8rem;
        }
        .story-loader-badge-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #7B2CBF;
          box-shadow: 0 0 8px #7B2CBF;
          animation: blinkDot 1.2s ease-in-out infinite;
        }
        @keyframes blinkDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }

        .story-loader-title {
          position: relative;
          z-index: 1;
          font-size: 1.45rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin-bottom: 0.4rem;
        }
        .story-loader-dots span {
          display: inline-block;
          color: #7B2CBF;
          animation: dotWave 1.4s infinite;
          font-weight: 900;
        }
        .story-loader-dots span:nth-child(2) { animation-delay: 0.2s; }
        .story-loader-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dotWave {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.3; }
          30% { transform: translateY(-4px); opacity: 1; }
        }

        .story-loader-subtitle {
          position: relative;
          z-index: 1;
          font-size: 0.88rem;
          color: #64748b;
          max-width: 440px;
          margin-bottom: 1.8rem;
          line-height: 1.5;
        }

        .story-loader-bar-wrap {
          position: relative;
          z-index: 1;
          width: 240px;
          height: 5px;
          background: rgba(123, 44, 191, 0.1);
          border-radius: 9999px;
          overflow: hidden;
          margin-bottom: 2.8rem;
        }
        .story-loader-bar-shimmer {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          width: 40%;
          background: linear-gradient(90deg, #7B2CBF 0%, #9D4EDD 50%, #C77DFF 100%);
          border-radius: 9999px;
          box-shadow: 0 0 10px rgba(123, 44, 191, 0.6);
          animation: barSlide 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes barSlide {
          0% { transform: translateX(-100%); width: 25%; }
          50% { width: 55%; }
          100% { transform: translateX(380%); width: 25%; }
        }

        .story-loader-skeleton-preview {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 680px;
          padding-top: 1.8rem;
          border-top: 1px dashed rgba(123, 44, 191, 0.15);
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
          align-items: center;
        }
        .story-skel-line {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: skeletonShimmer 1.8s infinite;
          border-radius: 6px;
          height: 12px;
        }
        .story-skel-cat {
          width: 90px;
          height: 22px;
          border-radius: 9999px;
          background: linear-gradient(90deg, rgba(123, 44, 191, 0.1) 25%, rgba(157, 78, 221, 0.2) 50%, rgba(123, 44, 191, 0.1) 75%);
          background-size: 200% 100%;
          animation: skeletonShimmer 1.8s infinite;
        }
        .story-skel-title-1 {
          width: 82%;
          height: 26px;
          border-radius: 8px;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: skeletonShimmer 1.8s infinite;
        }
        .story-skel-title-2 {
          width: 58%;
          height: 26px;
          border-radius: 8px;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: skeletonShimmer 1.8s infinite;
        }
        .story-skel-meta-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.8rem;
          margin-top: 0.4rem;
        }
        .story-skel-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: skeletonShimmer 1.8s infinite;
        }
        .story-skel-cover {
          width: 100%;
          height: 200px;
          border-radius: 14px;
          margin-top: 0.6rem;
          background: linear-gradient(90deg, #f1f5f9 25%, #e8edf4 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: skeletonShimmer 1.8s infinite;
          border: 1px solid rgba(226, 232, 240, 0.8);
        }
        @keyframes skeletonShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @media (max-width: 640px) {
          .story-top-bar { padding: 0.4rem 0.75rem; font-size: 0.74rem; }
          .story-top-bar-inner { gap: 0.45rem; justify-content: center; }
          .story-top-bar-link { font-size: 0.72rem; padding: 0.15rem 0.6rem; }
          .story-nav-inner { padding: 0 0.85rem; height: 56px; }
          .story-nav-brand-text { font-size: 0.82rem; }
          .story-nav-home-logo { font-size: 0.65rem; }
          .story-nav-back-text { display: none; }
          .breadcrumb { padding: 0.75rem 1rem 0; font-size: 0.72rem; }
          .story-loader-wrapper { padding: 1.5rem 1rem 4rem; }
          .story-loader-card { padding: 2.5rem 1.25rem; }
          .story-loader-title { font-size: 1.25rem; }
          .story-loader-subtitle { font-size: 0.8rem; }
          .story-skel-title-1 { width: 95%; }
          .story-skel-cover { height: 160px; }
        }
      `}</style>

      <div className="story-page">
        {/* ── Sticky Header: Barra Roxa que acompanha o scroll + Navbar ── */}
        <header className="story-sticky-header">
          {/* ── Top Announcement Bar (Kabum style com cores WEHOSTHERE) ── */}
          <div className="story-top-bar">
            <div className="story-top-bar-inner">
              <span className="story-top-bar-badge">ED. 01</span>
              <span className="story-top-bar-text">Descarrega a nova edição da revista</span>
              <a
                href="/api/revista/download"
                className="story-top-bar-link"
                download="Codando-Historias-Edicao-01.pdf"
                title="Descarregar PDF da revista em alta resolução"
              >
                <Download size={13} />
                <span>Descarregar PDF →</span>
              </a>
            </div>
          </div>

          {/* ── Navbar ── */}
          <nav className="story-nav">
            <div className="story-nav-inner">
              {/* Left: WEHOSTHERE home logo + revista brand */}
              <div className="story-nav-left">
                <Link href="/" className="story-nav-home" title="Ir para a página inicial WEHOSTHERE">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7B2CBF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <span className="story-nav-home-logo">WEHOST<span>HERE</span></span>
                </Link>
                <span className="story-nav-divider" aria-hidden="true" />
                <Link href="/revista" className="story-nav-brand">
                  <Code2 size={18} color="#7B2CBF" />
                  <span className="story-nav-brand-text">
                    codando <span>histórias</span> <span style={{ color: '#7B2CBF', fontFamily: 'monospace', fontWeight: 800 }}>&lt;/&gt;</span>
                  </span>
                </Link>
              </div>
              {/* Right: back link */}
              <Link href="/revista" className="story-nav-back-link">
                <ArrowLeft size={15} /> <span className="story-nav-back-text">Todas as histórias</span>
              </Link>
            </div>
          </nav>
        </header>

        {/* ── Breadcrumb ── */}
        <div className="breadcrumb">
          <Link href="/">WEHOSTHERE</Link>
          <ChevronRight size={12} className="breadcrumb-sep" />
          <Link href="/revista">Codando Histórias</Link>
          <ChevronRight size={12} className="breadcrumb-sep" />
          <span style={{ color: '#7B2CBF', fontWeight: 600 }}>A processar...</span>
        </div>

        {/* ── Dynamic Loader Hero Card ── */}
        <div className="story-loader-wrapper">
          <div className="story-loader-card">
            <div className="story-loader-orb" />

            <div className="story-spinner-box">
              <div className="story-spinner-ring-outer" />
              <div className="story-spinner-ring-inner" />
              <div className="story-spinner-center">
                <Code2 size={24} color="#7B2CBF" strokeWidth={2.5} />
              </div>
            </div>

            <div className="story-loader-badge">
              <span className="story-loader-badge-dot" />
              <span>A PROCESSAR HISTÓRIA</span>
              <span style={{ fontFamily: 'monospace', color: '#7B2CBF', fontWeight: 800 }}>&lt;/&gt;</span>
            </div>

            <h2 className="story-loader-title">
              A compilar a história<span className="story-loader-dots"><span>.</span><span>.</span><span>.</span></span>
            </h2>

            <p className="story-loader-subtitle">
              A carregar linhas de código, reflexões e conteúdo exclusivo da revista
            </p>

            <div className="story-loader-bar-wrap">
              <div className="story-loader-bar-shimmer" />
            </div>

            {/* Wireframe skeleton mockup */}
            <div className="story-loader-skeleton-preview" aria-hidden="true">
              <div className="story-skel-cat" />
              <div className="story-skel-title-1" />
              <div className="story-skel-title-2" />
              <div className="story-skel-line" style={{ width: '92%', height: '14px', opacity: 0.75 }} />
              <div className="story-skel-meta-row">
                <div className="story-skel-avatar" />
                <div className="story-skel-line" style={{ width: '110px' }} />
                <div className="story-skel-line" style={{ width: '70px' }} />
                <div className="story-skel-line" style={{ width: '85px' }} />
              </div>
              <div className="story-skel-cover" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
