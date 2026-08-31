import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ScrollToTop from "@/components/ScrollToTop";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import SocialProofToast from "@/components/SocialProofToast";
import { SITE_URL } from "@/lib/siteConfig";

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: '--font-poppins'
});

const BASE_URL = 'https://www.wehosthere.com';
const OG_IMAGE_URL = `${BASE_URL}/servidores-banner.png`;

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'WEHOSTHERE — Hospedagem de Sites & Email Profissional em Moçambique',
    template: '%s | WEHOSTHERE',
  },
  description:
    'Hospedagem de sites rápida e segura, email corporativo, registo de domínios e criação de sites profissionais em Moçambique. Suporte local 24/7. A partir de 550 MT/mês.',
  keywords: [
    'hospedagem de sites Moçambique',
    'hosting Moçambique',
    'email corporativo Moçambique',
    'registo de domínios .co.mz',
    'criação de sites Maputo',
    'servidor VPS Moçambique',
    'web hosting barato Moçambique',
    'WEHOSTHERE',
    'alojamento web',
    'domínios Moçambique',
  ],
  authors: [{ name: 'WEHOSTHERE', url: BASE_URL }],
  creator: 'WEHOSTHERE',
  publisher: 'WEHOSTHERE Infraestruturas & Cloud Moçambique',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    url: BASE_URL,
    siteName: 'WEHOSTHERE',
    title: 'WEHOSTHERE — Hospedagem de Sites & Email Profissional em Moçambique',
    description:
      'Hospedagem de sites rápida e segura, email corporativo, registo de domínios e criação de sites profissionais em Moçambique. A partir de 550 MT/mês.',
    images: [
      {
        url: OG_IMAGE_URL,
        secureUrl: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'WEHOSTHERE — Hospedagem Profissional em Moçambique',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WEHOSTHERE — Hospedagem de Sites & Email em Moçambique',
    description:
      'Hospedagem de sites, email corporativo e registo de domínios em Moçambique. A partir de 550 MT/mês.',
    images: [OG_IMAGE_URL],
    creator: '@wehosthere',
  },
  alternates: {
    canonical: BASE_URL,
  },
  icons: {
    icon: [
      { url: '/logo.png', sizes: '192x192', type: 'image/png' },
      { url: '/logo.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/logo.png',
    apple: [
      { url: '/logo.png', sizes: '192x192', type: 'image/png' },
      { url: '/logo.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  verification: {
    google: '-WIDb6-E1CZzvXz2qkam2i118tdjPuEsgdnpbTpA7_0',
  },
  category: 'technology',
};

import { LanguageProvider } from "@/context/LanguageContext";
import OfflineDetector from "@/components/OfflineDetector";
import MaintenanceGate from "@/components/MaintenanceGate";
import Providers from "@/components/Providers";
import ScrollUpCards from "@/components/ScrollUpCards";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-MZ">
      <head>
        <meta name="google-adsense-account" content="ca-pub-5452584470581302" />
        <meta property="og:image" content="https://www.wehosthere.com/servidores-banner.png" />
        <meta property="og:image:secure_url" content="https://www.wehosthere.com/servidores-banner.png" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:image" content="https://www.wehosthere.com/servidores-banner.png" />
        <meta name="twitter:card" content="summary_large_image" />
      </head>
      <body className={poppins.className}>
        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5452584470581302"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-YR0M8T8ZBF"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-YR0M8T8ZBF');
          `}
        </Script>
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1468106138155619');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img height="1" width="1" style={{display:'none'}} src="https://www.facebook.com/tr?id=1468106138155619&ev=PageView&noscript=1" alt=""/>
        </noscript>
        <Script id="service-worker" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                  .then((registration) => {
                    console.log('Service Worker registrado com sucesso:', registration);
                  })
                  .catch((error) => {
                    console.log('Erro ao registrar Service Worker:', error);
                  });
              });
            }
          `}
        </Script>
        <Providers>
          <LanguageProvider>
            <MaintenanceGate>
              {children}
            </MaintenanceGate>
            <OfflineDetector />
            <ScrollToTop />
            <AnalyticsTracker />
            <SocialProofToast />
            <ScrollUpCards />
          </LanguageProvider>
        </Providers>
      </body>
    </html>
  );
}
