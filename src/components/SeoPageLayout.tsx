import type { Metadata } from 'next';
import Link from 'next/link';
import { Home, ChevronRight } from 'lucide-react';

interface SeoPageLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  breadcrumbs?: { label: string; href: string }[];
}

export default function SeoPageLayout({ children, title, description, breadcrumbs }: SeoPageLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <Link href="/" className="flex items-center text-gray-500 hover:text-primary-600 transition">
                  <Home className="h-4 w-4" />
                </Link>
              </li>
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                  {index === breadcrumbs.length - 1 ? (
                    <span className="text-gray-900 font-medium">{crumb.label}</span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-gray-500 hover:text-primary-600 transition"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </nav>
      )}

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{title}</h1>
          <p className="text-lg md:text-xl text-primary-100 max-w-3xl">{description}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {children}
      </div>
    </div>
  );
}
