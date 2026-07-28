import Link from "next/link";
import { Server, Mail, Shield, Zap, Globe, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Server className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">WEHOSTHERE</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="#planos" className="text-gray-700 hover:text-primary-600 transition">
                Planos
              </Link>
              <Link href="#recursos" className="text-gray-700 hover:text-primary-600 transition">
                Recursos
              </Link>
              <Link href="#contato" className="text-gray-700 hover:text-primary-600 transition">
                Contato
              </Link>
            </nav>
            <div className="flex space-x-4">
              <Link href="/login" className="px-4 py-2 text-gray-700 hover:text-primary-600 transition">
                Login
              </Link>
              <Link href="/register" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
                Criar Conta
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Hospedagem de Sites e Email <span className="text-primary-600">Profissional</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A solução completa para sua presença online. Hospedagem de alta performance, 
            email corporativo e suporte especializado 24/7.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/register" className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-lg">
              Começar Agora
            </Link>
            <Link href="#planos" className="px-8 py-3 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition text-lg">
              Ver Planos
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="recursos" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Por que escolher a WEHOSTHERE?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="flex justify-center mb-4">
                <Zap className="h-12 w-12 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Ultra Rápido</h3>
              <p className="text-gray-600">Servidores otimizados para máxima performance</p>
            </div>
            <div className="text-center p-6">
              <div className="flex justify-center mb-4">
                <Shield className="h-12 w-12 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">100% Seguro</h3>
              <p className="text-gray-600">Backup diário e proteção avançada</p>
            </div>
            <div className="text-center p-6">
              <div className="flex justify-center mb-4">
                <Users className="h-12 w-12 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Suporte 24/7</h3>
              <p className="text-gray-600">Equipe especializada sempre disponível</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="py-20 px-4 bg-blue-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Planos de Hospedagem
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Basic Plan */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Básico</h3>
              <p className="text-gray-600 mb-4">Ideal para iniciantes</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">1.200 MT</span>
                <span className="text-gray-600">/mês</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-700">
                  <Server className="h-5 w-5 text-primary-600 mr-2" />
                  1 Site
                </li>
                <li className="flex items-center text-gray-700">
                  <Mail className="h-5 w-5 text-primary-600 mr-2" />
                  5 Contas de Email
                </li>
                <li className="flex items-center text-gray-700">
                  <Globe className="h-5 w-5 text-primary-600 mr-2" />
                  10 GB Armazenamento
                </li>
                <li className="flex items-center text-gray-700">
                  <Zap className="h-5 w-5 text-primary-600 mr-2" />
                  Tráfego Ilimitado
                </li>
              </ul>
              <Link href="/checkout?plan=basic" className="block w-full py-3 text-center border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition">
                Assinar Agora
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-primary-600 rounded-xl shadow-lg p-8 transform scale-105">
              <div className="bg-yellow-400 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
                MAIS POPULAR
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Profissional</h3>
              <p className="text-blue-100 mb-4">Para negócios em crescimento</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">3.000 MT</span>
                <span className="text-blue-100">/mês</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-white">
                  <Server className="h-5 w-5 text-blue-200 mr-2" />
                  5 Sites
                </li>
                <li className="flex items-center text-white">
                  <Mail className="h-5 w-5 text-blue-200 mr-2" />
                  20 Contas de Email
                </li>
                <li className="flex items-center text-white">
                  <Globe className="h-5 w-5 text-blue-200 mr-2" />
                  50 GB Armazenamento
                </li>
                <li className="flex items-center text-white">
                  <Zap className="h-5 w-5 text-blue-200 mr-2" />
                  Tráfego Ilimitado
                </li>
                <li className="flex items-center text-white">
                  <Shield className="h-5 w-5 text-blue-200 mr-2" />
                  SSL Grátis
                </li>
              </ul>
              <Link href="/checkout?plan=pro" className="block w-full py-3 text-center bg-white text-primary-600 rounded-lg hover:bg-gray-100 transition font-semibold">
                Assinar Agora
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Empresarial</h3>
              <p className="text-gray-600 mb-4">Para grandes operações</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">6.000 MT</span>
                <span className="text-gray-600">/mês</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-700">
                  <Server className="h-5 w-5 text-primary-600 mr-2" />
                  Sites Ilimitados
                </li>
                <li className="flex items-center text-gray-700">
                  <Mail className="h-5 w-5 text-primary-600 mr-2" />
                  Email Ilimitado
                </li>
                <li className="flex items-center text-gray-700">
                  <Globe className="h-5 w-5 text-primary-600 mr-2" />
                  200 GB Armazenamento
                </li>
                <li className="flex items-center text-gray-700">
                  <Zap className="h-5 w-5 text-primary-600 mr-2" />
                  Tráfego Ilimitado
                </li>
                <li className="flex items-center text-gray-700">
                  <Shield className="h-5 w-5 text-primary-600 mr-2" />
                  SSL + CDN Grátis
                </li>
              </ul>
              <Link href="/checkout?plan=enterprise" className="block w-full py-3 text-center border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition">
                Assinar Agora
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contato" className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Server className="h-8 w-8 text-primary-400" />
                <span className="text-2xl font-bold">WEHOSTHERE</span>
              </div>
              <p className="text-gray-400">
                Sua solução completa em hospedagem de sites e email.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produtos</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Hospedagem de Sites</li>
                <li>Email Corporativo</li>
                <li>VPS</li>
                <li>Dominios</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Central de Ajuda</li>
                <li>Tutoriais</li>
                <li>Status do Sistema</li>
                <li>Contato</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Termos de Serviço</li>
                <li>Política de Privacidade</li>
                <li>SLA</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 WEHOSTHERE. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
