import type { Metadata } from "next";
import { Poppins } from "next/font/google";
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

const BASE_URL = SITE_URL;

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
        url: '/servidores-banner.png',
        width: 1200,
        height: 630,
        alt: 'WEHOSTHERE — Hospedagem Profissional em Moçambique',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WEHOSTHERE — Hospedagem de Sites & Email em Moçambique',
    description:
      'Hospedagem de sites, email corporativo e registo de domínios em Moçambique. A partir de 550 MT/mês.',
    images: ['/servidores-banner.png'],
    creator: '@wehosthere',
  },
  alternates: {
    canonical: BASE_URL,
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  verification: {
    google: '-WIDb6-E1CZzvXz2qkam2i118tdjPuEsgdnpbTpA7_0',
  },
  category: 'technology',
};

import { LanguageProvider } from "@/context/LanguageContext";
import OfflineDetector from "@/components/OfflineDetector";
import MaintenanceGate from "@/components/MaintenanceGate";
import Providers from "@/components/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-MZ">
      <body className={poppins.className}>
        <Providers>
          <LanguageProvider>
            <MaintenanceGate>
              {children}
            </MaintenanceGate>
            <OfflineDetector />
            <ScrollToTop />
            <AnalyticsTracker />
            <SocialProofToast />
          </LanguageProvider>
        </Providers>
      </body>
    </html>
  );
}
