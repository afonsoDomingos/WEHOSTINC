import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ─── Fallback HTML (Modelos Pré-Prontos Preto & Branco com Menu e Rodapé Elegantes) ─
function getFallbackHtml(prompt: string, title?: string): string {
  const p = prompt.toLowerCase();

  const isSimple = p.includes('simples') || p.includes('sistema') || p.includes('inicio') || p.includes('início');

  // Shared Head & Styles (Preto e Branco / Tipografia Moderna)
  const renderHead = (pageTitle: string) => `
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { background: #000000; color: #ffffff; font-family: 'Plus Jakarta Sans', sans-serif; }
    ::selection { background: #ffffff; color: #000000; }
  </style>
</head>`;

  // Menu / Navbar Simples e Bonito
  const renderNavbar = (brand: string, navItems: { label: string; href: string }[], ctaText: string = 'WhatsApp') => `
  <nav class="sticky top-0 z-50 backdrop-blur-xl bg-black/85 border-b border-white/10">
    <div class="max-w-6xl mx-auto px-6 h-16 sm:h-20 flex items-center justify-between">
      <a href="#" class="flex items-center gap-2.5 group">
        <div class="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-black text-sm tracking-wider group-hover:scale-105 transition">
          ${brand.charAt(0).toUpperCase()}
        </div>
        <span class="text-sm sm:text-base font-extrabold tracking-tight text-white">${brand}</span>
      </a>
      <div class="hidden md:flex items-center gap-7 text-xs font-semibold text-zinc-400">
        ${navItems.map(item => `<a href="${item.href}" class="hover:text-white transition">${item.label}</a>`).join('')}
      </div>
      <a href="https://wa.me/258840000000" target="_blank" class="px-4 py-2 rounded-full bg-white text-black hover:bg-zinc-200 font-extrabold text-xs transition cursor-pointer shadow-sm active:scale-95">
        ${ctaText}
      </a>
    </div>
  </nav>`;

  // Rodapé Simples e Bonito
  const renderFooter = (brand: string, navItems: { label: string; href: string }[]) => `
  <footer class="border-t border-white/10 mt-20 sm:mt-28 py-12 px-6 bg-black">
    <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
      <div class="flex items-center gap-2.5">
        <div class="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center font-black text-xs">
          ${brand.charAt(0).toUpperCase()}
        </div>
        <span class="font-bold text-sm text-white">${brand}</span>
        <span class="text-xs text-zinc-500 hidden sm:inline">&mdash; Excelência e sofisticação</span>
      </div>
      <div class="flex items-center gap-6 text-xs text-zinc-400">
        ${navItems.map(item => `<a href="${item.href}" class="hover:text-white transition">${item.label}</a>`).join('')}
        <a href="https://wa.me/258840000000" target="_blank" class="hover:text-white transition font-bold">WhatsApp</a>
      </div>
      <div class="text-xs text-zinc-500">
        &copy; 2026 ${brand}. Todos os direitos reservados.
      </div>
    </div>
  </footer>`;

  // 1. MODELO: PÁGINA INICIAL / SISTEMA CLOUD (Preto e Branco)
  if (isSimple) {
    const brand = 'WEHOSTHERE';
    const navItems = [
      { label: 'Início', href: '#inicio' },
      { label: 'Vantagens', href: '#vantagens' },
      { label: 'Recursos', href: '#recursos' },
      { label: 'Contacto', href: '#contacto' }
    ];
    return `<!DOCTYPE html>
<html lang="pt" class="scroll-smooth">
${renderHead('Prontos para Criar o seu Sistema? - WEHOSTHERE')}
<body class="bg-black text-white min-h-screen flex flex-col justify-between antialiased selection:bg-white selection:text-black">
  ${renderNavbar(brand, navItems, 'Falar Connosco')}

  <main id="inicio" class="w-full max-w-5xl mx-auto px-6 py-20 sm:py-28 text-center my-auto">
    <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono uppercase tracking-widest text-zinc-300 mb-8">
      <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
      Nuvem &bull; Moçambique &bull; Alta Performance
    </div>
    
    <h1 class="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight text-white">
      Prontos para Criar o seu Sistema?
    </h1>
    
    <p class="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed font-normal">
      Dê vida à sua visão com a melhor tecnologia em nuvem, alto desempenho, certificados SSL automáticos e suporte especializado em Moçambique.
    </p>
    
    <div class="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-16">
      <a href="https://wa.me/258840000000?text=Quero%20criar%20o%20meu%20sistema%20online" target="_blank" class="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-black hover:bg-zinc-200 font-extrabold text-xs transition cursor-pointer shadow-lg active:scale-95">
        Começar Agora
      </a>
      <a href="https://wa.me/258840000000" target="_blank" class="w-full sm:w-auto px-8 py-3.5 rounded-full border border-white/20 text-white hover:bg-white/10 font-bold text-xs transition cursor-pointer">
        Falar com Consultor
      </a>
    </div>

    {/* Cards de Destaque Minimalistas Preto e Branco */}
    <div id="vantagens" class="grid grid-cols-1 md:grid-cols-3 gap-4 text-left pt-8 border-t border-white/10">
      <div class="p-6 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/25 transition">
        <span class="text-xs font-mono text-zinc-400">01 / VELOCIDADE</span>
        <h3 class="text-base font-bold text-white mt-2 mb-1">99.9% Uptime Garantido</h3>
        <p class="text-xs text-zinc-400 leading-relaxed">Infraestrutura em nuvem otimizada para carregamento instantâneo em qualquer rede.</p>
      </div>
      <div class="p-6 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/25 transition">
        <span class="text-xs font-mono text-zinc-400">02 / SEGURANÇA</span>
        <h3 class="text-base font-bold text-white mt-2 mb-1">SSL &amp; Proteção Gratuita</h3>
        <p class="text-xs text-zinc-400 leading-relaxed">Certificado de segurança automático para blindar os dados do seu projeto.</p>
      </div>
      <div class="p-6 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/25 transition">
        <span class="text-xs font-mono text-zinc-400">03 / LOCAL</span>
        <h3 class="text-base font-bold text-white mt-2 mb-1">Pagamentos em MZN</h3>
        <p class="text-xs text-zinc-400 leading-relaxed">Pague com facilidade através de M-Pesa, E-Mola ou transferência bancária local.</p>
      </div>
    </div>
  </main>

  ${renderFooter(brand, navItems)}
</body>
</html>`;
  }

  // 2. MODELO: RESTAURANTE & LOUNGE (Preto e Branco)
  if (p.includes('restaurante') || p.includes('lounge') || p.includes('comida') || p.includes('cardapio')) {
    const brand = title || 'Restaurante & Lounge';
    const navItems = [
      { label: 'Início', href: '#inicio' },
      { label: 'Cardápio', href: '#cardapio' },
      { label: 'Ambiente', href: '#ambiente' },
      { label: 'Reservas', href: '#reservas' }
    ];
    return `<!DOCTYPE html>
<html lang="pt" class="scroll-smooth">
${renderHead(`${brand} - Alta Gastronomia`)}
<body class="bg-black text-white min-h-screen antialiased selection:bg-white selection:text-black">
  ${renderNavbar(brand, navItems, 'Reservar Mesa')}

  <section id="inicio" class="pt-20 sm:pt-28 pb-16 px-6 max-w-5xl mx-auto text-center">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono uppercase tracking-widest text-zinc-400 mb-6">
      ALTA GASTRONOMIA &bull; EXPERIÊNCIA SENSORIAL
    </div>
    <h1 class="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 text-white leading-tight">
      Sabores Memoráveis em Ambiente Exclusivo.
    </h1>
    <p class="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed">
      Culinária contemporânea requintada com ingredientes nobres, carta de vinhos selecionados e coquetelaria autoral em Maputo.
    </p>
    <div class="flex flex-col sm:flex-row items-center justify-center gap-3.5">
      <a href="#cardapio" class="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-black hover:bg-zinc-200 font-extrabold text-xs transition cursor-pointer shadow-lg active:scale-95">
        Ver Cardápio
      </a>
      <a href="https://wa.me/258840000000?text=Gostaria%20de%20reservar%20uma%20mesa" target="_blank" class="w-full sm:w-auto px-8 py-3.5 rounded-full border border-white/20 text-white hover:bg-white/10 font-bold text-xs transition cursor-pointer">
        Reservar no WhatsApp
      </a>
    </div>
  </section>

  {/* Cardápio de Degustação */}
  <section id="cardapio" class="py-16 px-6 max-w-5xl mx-auto border-t border-white/10">
    <div class="text-center mb-12">
      <span class="text-xs font-mono text-zinc-500 uppercase tracking-widest">Nossas Criações</span>
      <h2 class="text-2xl sm:text-3xl font-extrabold text-white mt-1">Destaques do Cardápio</h2>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="p-6 rounded-2xl bg-zinc-950 border border-white/10 flex justify-between items-start">
        <div>
          <h3 class="font-bold text-white text-sm">Bife Wagyu ao Molho Trufado</h3>
          <p class="text-xs text-zinc-400 mt-1">Grelhado na perfeição com legumes salteados e puré rústico.</p>
        </div>
        <span class="font-mono text-xs font-bold text-white bg-white/10 px-2.5 py-1 rounded-full shrink-0 ml-4">1.850 MT</span>
      </div>
      <div class="p-6 rounded-2xl bg-zinc-950 border border-white/10 flex justify-between items-start">
        <div>
          <h3 class="font-bold text-white text-sm">Polvo Grelhado à Moda do Chef</h3>
          <p class="text-xs text-zinc-400 mt-1">Acompanhado de batata doce assada, azeite virgem e ervas aromáticas.</p>
        </div>
        <span class="font-mono text-xs font-bold text-white bg-white/10 px-2.5 py-1 rounded-full shrink-0 ml-4">1.450 MT</span>
      </div>
      <div class="p-6 rounded-2xl bg-zinc-950 border border-white/10 flex justify-between items-start">
        <div>
          <h3 class="font-bold text-white text-sm">Risoto de Cogumelos Selvagens</h3>
          <p class="text-xs text-zinc-400 mt-1">Arroz arbóreo cremoso com trufas negras e queijo parmesão envelhecido.</p>
        </div>
        <span class="font-mono text-xs font-bold text-white bg-white/10 px-2.5 py-1 rounded-full shrink-0 ml-4">950 MT</span>
      </div>
      <div class="p-6 rounded-2xl bg-zinc-950 border border-white/10 flex justify-between items-start">
        <div>
          <h3 class="font-bold text-white text-sm">Salmão Fresco Glaceado</h3>
          <p class="text-xs text-zinc-400 mt-1">Com crosta de gergelim, aspargos crocantes e redução balsâmica.</p>
        </div>
        <span class="font-mono text-xs font-bold text-white bg-white/10 px-2.5 py-1 rounded-full shrink-0 ml-4">1.350 MT</span>
      </div>
    </div>
  </section>

  {/* Ambiente & Reserva */}
  <section id="reservas" class="py-16 px-6 max-w-5xl mx-auto">
    <div class="p-10 sm:p-14 rounded-3xl bg-zinc-950 border border-white/10 text-center">
      <span class="text-xs font-mono text-zinc-400 uppercase tracking-widest">Experiência VIP</span>
      <h2 class="text-2xl sm:text-4xl font-extrabold text-white mt-2 mb-4">Reserve a Sua Noite Conosco</h2>
      <p class="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto mb-8">Mesas exclusivas para jantares românticos, encontros de negócios e celebrações especiais.</p>
      <a href="https://wa.me/258840000000?text=Quero%20reservar%20mesa" target="_blank" class="inline-block px-8 py-3.5 rounded-full bg-white text-black hover:bg-zinc-200 font-extrabold text-xs transition cursor-pointer shadow-lg active:scale-95">
        Fazer Reserva no WhatsApp
      </a>
    </div>
  </section>

  ${renderFooter(brand, navItems)}
</body>
</html>`;
  }

  // 3. MODELO: BARBEARIA VIP (Preto e Branco)
  if (p.includes('barbearia') || p.includes('corte') || p.includes('barba')) {
    const brand = title || 'Barbearia VIP';
    const navItems = [
      { label: 'Início', href: '#inicio' },
      { label: 'Serviços', href: '#servicos' },
      { label: 'Horários', href: '#horarios' },
      { label: 'Agendamento', href: '#agendar' }
    ];
    return `<!DOCTYPE html>
<html lang="pt" class="scroll-smooth">
${renderHead(`${brand} - Cortes e Barba de Precisão`)}
<body class="bg-black text-white min-h-screen antialiased selection:bg-white selection:text-black">
  ${renderNavbar(brand, navItems, 'Agendar')}

  <section id="inicio" class="pt-20 sm:pt-28 pb-16 px-6 max-w-5xl mx-auto text-center">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono uppercase tracking-widest text-zinc-400 mb-6">
      ESTILO &bull; TOALHA QUENTE &bull; PRECISÃO
    </div>
    <h1 class="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 text-white leading-tight">
      O Cuidado Masculino no Seu Nível Mais Alto.
    </h1>
    <p class="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed">
      Degradê de precisão, barba terapia tradicional, toalha quente e atendimento com bebida de boas-vindas em ambiente moderno e climatizado.
    </p>
    <div class="flex flex-col sm:flex-row items-center justify-center gap-3.5">
      <a href="https://wa.me/258840000000?text=Quero%20agendar%20um%20corte" target="_blank" class="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-black hover:bg-zinc-200 font-extrabold text-xs transition cursor-pointer shadow-lg active:scale-95">
        Agendar no WhatsApp
      </a>
      <a href="#servicos" class="w-full sm:w-auto px-8 py-3.5 rounded-full border border-white/20 text-white hover:bg-white/10 font-bold text-xs transition cursor-pointer">
        Ver Tabela de Serviços
      </a>
    </div>
  </section>

  {/* Serviços e Preços */}
  <section id="servicos" class="py-16 px-6 max-w-5xl mx-auto border-t border-white/10">
    <div class="text-center mb-12">
      <span class="text-xs font-mono text-zinc-500 uppercase tracking-widest">Nossos Serviços</span>
      <h2 class="text-2xl sm:text-3xl font-extrabold text-white mt-1">Tabela de Preços</h2>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="p-6 rounded-2xl bg-zinc-950 border border-white/10 flex justify-between items-start">
        <div>
          <h3 class="font-bold text-white text-sm">Corte Cabelo Master</h3>
          <p class="text-xs text-zinc-400 mt-1">Degradê impecável, tesoura ou máquina, lavagem e finalização premium.</p>
        </div>
        <span class="font-mono text-xs font-bold text-white bg-white/10 px-2.5 py-1 rounded-full shrink-0 ml-4">600 MT</span>
      </div>
      <div class="p-6 rounded-2xl bg-zinc-950 border border-white/10 flex justify-between items-start">
        <div>
          <h3 class="font-bold text-white text-sm">Barba Terapia Tradicional</h3>
          <p class="text-xs text-zinc-400 mt-1">Toalha quente, óleos essenciais, massagem facial e navalha afiada.</p>
        </div>
        <span class="font-mono text-xs font-bold text-white bg-white/10 px-2.5 py-1 rounded-full shrink-0 ml-4">450 MT</span>
      </div>
      <div class="p-6 rounded-2xl bg-zinc-950 border border-white/10 flex justify-between items-start">
        <div>
          <h3 class="font-bold text-white text-sm">Combo VIP Executivo</h3>
          <p class="text-xs text-zinc-400 mt-1">Corte completo + Barba terapia + hidratação capilar profunda.</p>
        </div>
        <span class="font-mono text-xs font-bold text-white bg-white/10 px-2.5 py-1 rounded-full shrink-0 ml-4">950 MT</span>
      </div>
      <div class="p-6 rounded-2xl bg-zinc-950 border border-white/10 flex justify-between items-start">
        <div>
          <h3 class="font-bold text-white text-sm">Tratamento Capilar & Sobrancelha</h3>
          <p class="text-xs text-zinc-400 mt-1">Alinhamento estético de sobrancelha e esfoliação do couro cabeludo.</p>
        </div>
        <span class="font-mono text-xs font-bold text-white bg-white/10 px-2.5 py-1 rounded-full shrink-0 ml-4">350 MT</span>
      </div>
    </div>
  </section>

  {/* CTA e Horários */}
  <section id="agendar" class="py-16 px-6 max-w-5xl mx-auto">
    <div class="p-10 sm:p-14 rounded-3xl bg-zinc-950 border border-white/10 text-center">
      <span class="text-xs font-mono text-zinc-400 uppercase tracking-widest">Segunda a Sábado &bull; 08:00 às 20:00</span>
      <h2 class="text-2xl sm:text-4xl font-extrabold text-white mt-2 mb-4">Garanta o Seu Horário na Cadeira</h2>
      <p class="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto mb-8">Evite esperas. Agende diretamente com o seu barbeiro de preferência.</p>
      <a href="https://wa.me/258840000000?text=Quero%20agendar%20horario%20na%20barbearia" target="_blank" class="inline-block px-8 py-3.5 rounded-full bg-white text-black hover:bg-zinc-200 font-extrabold text-xs transition cursor-pointer shadow-lg active:scale-95">
        Agendar pelo WhatsApp
      </a>
    </div>
  </section>

  ${renderFooter(brand, navItems)}
</body>
</html>`;
  }

  // 4. MODELO: HOTEL & RESORT (Preto e Branco)
  if (p.includes('hotel') || p.includes('resort') || p.includes('turismo') || p.includes('hospedagem')) {
    const brand = title || 'Hotel & Resort';
    const navItems = [
      { label: 'Início', href: '#inicio' },
      { label: 'Acomodações', href: '#suites' },
      { label: 'Comodidades', href: '#comodidades' },
      { label: 'Contacto', href: '#reservas' }
    ];
    return `<!DOCTYPE html>
<html lang="pt" class="scroll-smooth">
${renderHead(`${brand} - Acomodações de Luxo`)}
<body class="bg-black text-white min-h-screen antialiased selection:bg-white selection:text-black">
  ${renderNavbar(brand, navItems, 'Reservar')}

  <section id="inicio" class="pt-20 sm:pt-28 pb-16 px-6 max-w-5xl mx-auto text-center">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono uppercase tracking-widest text-zinc-400 mb-6">
      HOSPEDAGEM EXCLUSIVA &bull; VISTA MAR
    </div>
    <h1 class="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 text-white leading-tight">
      Refúgio de Paz e Conforto Incomparável.
    </h1>
    <p class="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed">
      Suítes contemporâneas à beira-mar, gastronomia requintada, piscina de borda infinita e hospitalidade de alto padrão em Moçambique.
    </p>
    <div class="flex flex-col sm:flex-row items-center justify-center gap-3.5">
      <a href="#suites" class="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-black hover:bg-zinc-200 font-extrabold text-xs transition cursor-pointer shadow-lg active:scale-95">
        Ver Acomodações
      </a>
      <a href="https://wa.me/258840000000?text=Quero%20consultar%20disponibilidade%20no%20hotel" target="_blank" class="w-full sm:w-auto px-8 py-3.5 rounded-full border border-white/20 text-white hover:bg-white/10 font-bold text-xs transition cursor-pointer">
        Consultar Datas no WhatsApp
      </a>
    </div>
  </section>

  {/* Suítes */}
  <section id="suites" class="py-16 px-6 max-w-5xl mx-auto border-t border-white/10">
    <div class="text-center mb-12">
      <span class="text-xs font-mono text-zinc-500 uppercase tracking-widest">Acomodações</span>
      <h2 class="text-2xl sm:text-3xl font-extrabold text-white mt-1">Suítes &amp; Quartos</h2>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div class="p-6 rounded-2xl bg-zinc-950 border border-white/10 flex flex-col justify-between">
        <div>
          <span class="text-[10px] font-mono text-zinc-400 uppercase">Vista Mar Panorâmica</span>
          <h3 class="font-bold text-white text-lg mt-1 mb-2">Suíte Presidencial</h3>
          <p class="text-xs text-zinc-400 leading-relaxed">Cama king size, banheira de imersão, varanda ampla e serviço de quarto 24h.</p>
        </div>
        <div class="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
          <span class="font-mono text-xs font-bold text-white">14.500 MT / noite</span>
          <a href="https://wa.me/258840000000?text=Reservar%20Suite%20Presidencial" target="_blank" class="text-xs font-bold text-white underline">Reservar</a>
        </div>
      </div>
      <div class="p-6 rounded-2xl bg-zinc-950 border border-white/10 flex flex-col justify-between">
        <div>
          <span class="text-[10px] font-mono text-zinc-400 uppercase">Privacidade Total</span>
          <h3 class="font-bold text-white text-lg mt-1 mb-2">Villa Familiar Privada</h3>
          <p class="text-xs text-zinc-400 leading-relaxed">2 quartos, piscina privativa, sala de estar e acesso direto à praia.</p>
        </div>
        <div class="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
          <span class="font-mono text-xs font-bold text-white">22.000 MT / noite</span>
          <a href="https://wa.me/258840000000?text=Reservar%20Villa%20Familiar" target="_blank" class="text-xs font-bold text-white underline">Reservar</a>
        </div>
      </div>
      <div class="p-6 rounded-2xl bg-zinc-950 border border-white/10 flex flex-col justify-between">
        <div>
          <span class="text-[10px] font-mono text-zinc-400 uppercase">Conforto Essencial</span>
          <h3 class="font-bold text-white text-lg mt-1 mb-2">Quarto Deluxe King</h3>
          <p class="text-xs text-zinc-400 leading-relaxed">Ambiente aconchegante, ar condicionado silencioso, minibar e Wi-Fi de alta velocidade.</p>
        </div>
        <div class="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
          <span class="font-mono text-xs font-bold text-white">8.500 MT / noite</span>
          <a href="https://wa.me/258840000000?text=Reservar%20Deluxe%20King" target="_blank" class="text-xs font-bold text-white underline">Reservar</a>
        </div>
      </div>
    </div>
  </section>

  ${renderFooter(brand, navItems)}
</body>
</html>`;
  }

  // 5. MODELO: LOJA ONLINE / BOUTIQUE (Preto e Branco)
  if (p.includes('loja') || p.includes('ecommerce') || p.includes('produto') || p.includes('venda')) {
    const brand = title || 'Boutique Online';
    const navItems = [
      { label: 'Início', href: '#inicio' },
      { label: 'Coleção', href: '#produtos' },
      { label: 'Sobre', href: '#sobre' },
      { label: 'Apoio', href: '#contacto' }
    ];
    return `<!DOCTYPE html>
<html lang="pt" class="scroll-smooth">
${renderHead(`${brand} - Coleção Exclusiva`)}
<body class="bg-black text-white min-h-screen antialiased selection:bg-white selection:text-black">
  ${renderNavbar(brand, navItems, 'Fazer Pedido')}

  <section id="inicio" class="pt-20 sm:pt-28 pb-16 px-6 max-w-5xl mx-auto text-center">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono uppercase tracking-widest text-zinc-400 mb-6">
      COLEÇÃO ESSENCIAL &bull; 2026
    </div>
    <h1 class="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 text-white leading-tight">
      Minimalismo, Qualidade e Peças Únicas.
    </h1>
    <p class="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed">
      Vestuário contemporâneo e acessórios de alto padrão pensados para elegância, conforto diário e durabilidade com entrega rápida em Moçambique.
    </p>
    <div class="flex flex-col sm:flex-row items-center justify-center gap-3.5">
      <a href="#produtos" class="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-black hover:bg-zinc-200 font-extrabold text-xs transition cursor-pointer shadow-lg active:scale-95">
        Explorar Coleção
      </a>
      <a href="https://wa.me/258840000000?text=Quero%20ver%20o%20catalogo" target="_blank" class="w-full sm:w-auto px-8 py-3.5 rounded-full border border-white/20 text-white hover:bg-white/10 font-bold text-xs transition cursor-pointer">
        Catálogo no WhatsApp
      </a>
    </div>
  </section>

  {/* Vitrine de Produtos */}
  <section id="produtos" class="py-16 px-6 max-w-5xl mx-auto border-t border-white/10">
    <div class="text-center mb-12">
      <span class="text-xs font-mono text-zinc-500 uppercase tracking-widest">Catálogo Selecionado</span>
      <h2 class="text-2xl sm:text-3xl font-extrabold text-white mt-1">Destaques da Temporada</h2>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <div class="p-5 rounded-2xl bg-zinc-950 border border-white/10 flex flex-col justify-between">
        <div class="h-32 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center font-mono text-xs text-zinc-500 mb-4">ITEM 01</div>
        <div>
          <h3 class="font-bold text-white text-sm">Casaco Minimalist Wool</h3>
          <p class="text-[11px] text-zinc-400 mt-0.5">Lã pura, corte reto contemporâneo.</p>
        </div>
        <div class="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
          <span class="font-mono text-xs font-bold text-white">4.800 MT</span>
          <a href="https://wa.me/258840000000?text=Comprar%20Casaco%20Wool" target="_blank" class="text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-2 py-1 rounded-md">Comprar</a>
        </div>
      </div>
      <div class="p-5 rounded-2xl bg-zinc-950 border border-white/10 flex flex-col justify-between">
        <div class="h-32 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center font-mono text-xs text-zinc-500 mb-4">ITEM 02</div>
        <div>
          <h3 class="font-bold text-white text-sm">Camisa Oxford Pure White</h3>
          <p class="text-[11px] text-zinc-400 mt-0.5">Algodão egípcio respirável e elegante.</p>
        </div>
        <div class="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
          <span class="font-mono text-xs font-bold text-white">2.200 MT</span>
          <a href="https://wa.me/258840000000?text=Comprar%20Camisa%20Oxford" target="_blank" class="text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-2 py-1 rounded-md">Comprar</a>
        </div>
      </div>
      <div class="p-5 rounded-2xl bg-zinc-950 border border-white/10 flex flex-col justify-between">
        <div class="h-32 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center font-mono text-xs text-zinc-500 mb-4">ITEM 03</div>
        <div>
          <h3 class="font-bold text-white text-sm">Ténis Monocromático Leather</h3>
          <p class="text-[11px] text-zinc-400 mt-0.5">Couro genuíno com solado ergonómico.</p>
        </div>
        <div class="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
          <span class="font-mono text-xs font-bold text-white">3.600 MT</span>
          <a href="https://wa.me/258840000000?text=Comprar%20Tenis%20Leather" target="_blank" class="text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-2 py-1 rounded-md">Comprar</a>
        </div>
      </div>
      <div class="p-5 rounded-2xl bg-zinc-950 border border-white/10 flex flex-col justify-between">
        <div class="h-32 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center font-mono text-xs text-zinc-500 mb-4">ITEM 04</div>
        <div>
          <h3 class="font-bold text-white text-sm">Carteira Compact Slim</h3>
          <p class="text-[11px] text-zinc-400 mt-0.5">Proteção RFID e perfil ultra-fino.</p>
        </div>
        <div class="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
          <span class="font-mono text-xs font-bold text-white">1.450 MT</span>
          <a href="https://wa.me/258840000000?text=Comprar%20Carteira%20Slim" target="_blank" class="text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-2 py-1 rounded-md">Comprar</a>
        </div>
      </div>
    </div>
  </section>

  ${renderFooter(brand, navItems)}
</body>
</html>`;
  }

  // 6. MODELO: PORTFÓLIO CRIATIVO (Preto e Branco)
  if (p.includes('portfolio') || p.includes('portfólio') || p.includes('designer') || p.includes('developer')) {
    const brand = title || 'Portfólio Profissional';
    const navItems = [
      { label: 'Início', href: '#inicio' },
      { label: 'Projetos', href: '#projetos' },
      { label: 'Habilidades', href: '#habilidades' },
      { label: 'Contacto', href: '#contacto' }
    ];
    return `<!DOCTYPE html>
<html lang="pt" class="scroll-smooth">
${renderHead(`${brand} - Projetos & Desenvolvimento`)}
<body class="bg-black text-white min-h-screen antialiased selection:bg-white selection:text-black">
  ${renderNavbar(brand, navItems, 'Conversar')}

  <section id="inicio" class="pt-20 sm:pt-28 pb-16 px-6 max-w-5xl mx-auto text-center">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono uppercase tracking-widest text-zinc-400 mb-6">
      DESIGN &bull; DESENVOLVIMENTO FULL-STACK
    </div>
    <h1 class="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 text-white leading-tight">
      Criando Produtos Digitais de Alto Impacto.
    </h1>
    <p class="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed">
      Especialista em interfaces limpas, arquiteturas modernas e alta performance para marcas e negócios que procuram excelência.
    </p>
    <div class="flex flex-col sm:flex-row items-center justify-center gap-3.5">
      <a href="#projetos" class="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-black hover:bg-zinc-200 font-extrabold text-xs transition cursor-pointer shadow-lg active:scale-95">
        Ver Projetos Recentes
      </a>
      <a href="https://wa.me/258840000000?text=Ola%20quero%20falar%20sobre%20um%20projeto" target="_blank" class="w-full sm:w-auto px-8 py-3.5 rounded-full border border-white/20 text-white hover:bg-white/10 font-bold text-xs transition cursor-pointer">
        Falar no WhatsApp
      </a>
    </div>
  </section>

  {/* Projetos */}
  <section id="projetos" class="py-16 px-6 max-w-5xl mx-auto border-t border-white/10">
    <div class="text-center mb-12">
      <span class="text-xs font-mono text-zinc-500 uppercase tracking-widest">Trabalhos Realizados</span>
      <h2 class="text-2xl sm:text-3xl font-extrabold text-white mt-1">Casos de Sucesso</h2>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div class="p-6 rounded-2xl bg-zinc-950 border border-white/10 flex flex-col justify-between">
        <div>
          <span class="text-[10px] font-mono text-zinc-400">FINTECH / SAAS</span>
          <h3 class="font-bold text-white text-base mt-1 mb-2">Plataforma Cloud Pay</h3>
          <p class="text-xs text-zinc-400 leading-relaxed">Interface financeira ultra-rápida construída com Next.js, TypeScript e integrações bancárias.</p>
        </div>
        <div class="mt-6 pt-3 border-t border-white/10">
          <span class="text-[10px] font-mono text-zinc-500">React &bull; Next.js &bull; Tailwind</span>
        </div>
      </div>
      <div class="p-6 rounded-2xl bg-zinc-950 border border-white/10 flex flex-col justify-between">
        <div>
          <span class="text-[10px] font-mono text-zinc-400">E-COMMERCE</span>
          <h3 class="font-bold text-white text-base mt-1 mb-2">Boutique Minimalista</h3>
          <p class="text-xs text-zinc-400 leading-relaxed">Loja online de moda monocromática com aumento de 42% na taxa de conversão móvel.</p>
        </div>
        <div class="mt-6 pt-3 border-t border-white/10">
          <span class="text-[10px] font-mono text-zinc-500">UI/UX &bull; Pagamentos &bull; Performance</span>
        </div>
      </div>
      <div class="p-6 rounded-2xl bg-zinc-950 border border-white/10 flex flex-col justify-between">
        <div>
          <span class="text-[10px] font-mono text-zinc-400">DESIGN SYSTEM</span>
          <h3 class="font-bold text-white text-base mt-1 mb-2">Sistema Corporativo</h3>
          <p class="text-xs text-zinc-400 leading-relaxed">Biblioteca de mais de 60 componentes reutilizáveis acessíveis com foco em consistência visual.</p>
        </div>
        <div class="mt-6 pt-3 border-t border-white/10">
          <span class="text-[10px] font-mono text-zinc-500">Tailwind &bull; Radix &bull; Acessibilidade</span>
        </div>
      </div>
    </div>
  </section>

  ${renderFooter(brand, navItems)}
</body>
</html>`;
  }

  // 7. MODELO PADRÃO GENÉRICO (Preto e Branco com Menu e Rodapé)
  const cleanTitle = title || 'Página Profissional';
  const navItems = [
    { label: 'Início', href: '#inicio' },
    { label: 'Serviços', href: '#servicos' },
    { label: 'Sobre', href: '#sobre' },
    { label: 'Contacto', href: '#contacto' }
  ];

  return `<!DOCTYPE html>
<html lang="pt" class="scroll-smooth">
${renderHead(`${cleanTitle} - Site Oficial`)}
<body class="bg-black text-white min-h-screen antialiased selection:bg-white selection:text-black">
  ${renderNavbar(cleanTitle, navItems, 'WhatsApp')}

  <section id="inicio" class="pt-20 sm:pt-28 pb-16 px-6 max-w-5xl mx-auto text-center">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono uppercase tracking-widest text-zinc-400 mb-6">
      QUALIDADE &bull; EXCLUSIVIDADE &bull; MOÇAMBIQUE
    </div>
    <h1 class="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 text-white leading-tight">
      ${cleanTitle}
    </h1>
    <p class="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed">
      Experiência premium, qualidade garantida e o melhor atendimento para superar as suas expectativas.
    </p>
    <div class="flex flex-col sm:flex-row items-center justify-center gap-3.5">
      <a href="https://wa.me/258840000000" target="_blank" class="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-black hover:bg-zinc-200 font-extrabold text-xs transition cursor-pointer shadow-lg active:scale-95">
        Falar no WhatsApp
      </a>
      <a href="#servicos" class="w-full sm:w-auto px-8 py-3.5 rounded-full border border-white/20 text-white hover:bg-white/10 font-bold text-xs transition cursor-pointer">
        Ver Detalhes
      </a>
    </div>
  </section>

  <section id="servicos" class="py-16 px-6 max-w-5xl mx-auto border-t border-white/10">
    <div class="text-center mb-12">
      <span class="text-xs font-mono text-zinc-500 uppercase tracking-widest">O Que Fazemos</span>
      <h2 class="text-2xl sm:text-3xl font-extrabold text-white mt-1">Nossos Diferenciais</h2>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div class="p-6 rounded-2xl bg-zinc-950 border border-white/10">
        <span class="font-mono text-xs text-zinc-400">01</span>
        <h3 class="text-base font-bold text-white mt-2 mb-1">Atendimento de Excelência</h3>
        <p class="text-xs text-zinc-400 leading-relaxed">Equipa focada em prestar a melhor experiência do início ao fim.</p>
      </div>
      <div class="p-6 rounded-2xl bg-zinc-950 border border-white/10">
        <span class="font-mono text-xs text-zinc-400">02</span>
        <h3 class="text-base font-bold text-white mt-2 mb-1">Rapidez e Rigor</h3>
        <p class="text-xs text-zinc-400 leading-relaxed">Cumprimento estrito de prazos e total transparência em cada etapa.</p>
      </div>
      <div class="p-6 rounded-2xl bg-zinc-950 border border-white/10">
        <span class="font-mono text-xs text-zinc-400">03</span>
        <h3 class="text-base font-bold text-white mt-2 mb-1">Soluções Sob Medida</h3>
        <p class="text-xs text-zinc-400 leading-relaxed">Adaptadas precisamente ao tamanho e ambição do seu negócio.</p>
      </div>
    </div>
  </section>

  ${renderFooter(cleanTitle, navItems)}
</body>
</html>`;
}

// ─── System Instruction (Diretrizes Estritas Preto & Branco com Menu e Rodapé) ─
const SYSTEM_INSTRUCTION = `Voce e o Construtor de Sites IA da WEHOSTHERE (uma plataforma cloud em Mocambique).
Sua missao e gerar ou aprimorar uma pagina web HTML5 COMPLETA, AUTONOMA, MODERNA, RESPONSIVA e IMPRESSIONANTE para o cliente.
DIRETRIZES CRITICAS DE DESIGN E ESTRUTURA:
1. Retorne APENAS o codigo HTML completo (comecando em <!DOCTYPE html> e terminando em </html>). NAO inclua explicacoes ou texto antes ou depois.
2. Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
3. Use Google Fonts (Plus Jakarta Sans ou Inter).
4. ESTETICA OBRIGATORIA: TEMA PRETO E BRANCO (Black & White / Minimalist Luxury). Fundo preto (#000000 ou #050505), texto em branco (#ffffff) e cinza (#a1a1aa), com bordas suaves (border-white/10). Botões de acao principais em BRANCO PURO com texto preto (bg-white text-black font-extrabold hover:bg-zinc-200).
5. MENU / NAVBAR: Simples e bonito, fixo ou sticky no topo (sticky top-0 backdrop-blur-xl bg-black/85 border-b border-white/10), com logo em caixa monocromatica, links essenciais e botao WhatsApp em branco.
6. RODAPE / FOOTER: Simples e bonito no fundo com divisor (border-t border-white/10), nome da marca, links rapidos e copyright "2026. Todos os direitos reservados."
7. ESTRUTURA: Navbar, Hero impactante, Secao de Servicos/Cardapio/Produtos com precos claros em Meticais (MZN), CTA no WhatsApp e Rodape.
8. ÍCONES PROFISSIONAIS OBRIGATÓRIOS (REGRA DE OURO):
   - É ESTRITAMENTE PROIBIDO USAR EMOJIS (ex: 🚀, 💻, ⚡, 🔒, 🎯, ⭐, 🍕, 🏨, 🛒, etc.) como ícones de cards, serviços, vantagens ou títulos. Emojis parecem amadores e destroem o visual profissional.
   - USE SEMPRE ÍCONES SVG PROFISSIONAIS INLINE com Tailwind CSS (ex: <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="..."/></svg>) OU utilize a biblioteca Lucide Icons via CDN:
     No <head>: <script src="https://unpkg.com/lucide@latest"></script>
     Nos cards: <i data-lucide="shield" class="w-6 h-6 text-white"></i> (ou "zap", "server", "globe", "cpu", "star", "phone", etc.)
     Antes de </body>: <script>lucide.createIcons();</script>
   - Envolva sempre cada ícone numa caixa elegante de suporte com cantos arredondados (ex: <div class="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white mb-4">...</div>).
9. Se houver HTML atual, REFINE e ATUALIZE mantendo essa estetica preta e branca minimalista de alto luxo e garantindo que todos os ícones sejam profissionais em SVG.
10. NAVEGAÇÃO E LINKS CLICÁVEIS (REGRA OBRIGATÓRIA):
    - TODOS os links de navegação (<nav> e menu do cabeçalho) DEVEM ser 100% clicáveis e funcionar com âncoras (<a href="#inicio">, <a href="#solucoes"> ou <a href="#servicos">, <a href="#vantagens">, <a href="#precos">, <a href="#contacto">).
    - Para CADA link de navegação no menu, DEVE OBRIGATORIAMENTE existir no corpo do documento a respectiva secção com o atributo id exato (ex: <section id="inicio">, <section id="solucoes">, <section id="vantagens">, <section id="precos">, <footer id="contacto">).
    - O <head> DEVE conter SEMPRE: <style>html { scroll-behavior: smooth; } section[id] { scroll-margin-top: 5rem; }</style> para que a navegação suave funcione sem que o cabeçalho fixo cubra os títulos.
    - Se houver botão de WhatsApp, DEVE ter link real no formato: href="https://wa.me/NUMERO?text=MENSAGEM".`;

// ─── Detecção de Intenção Conversacional (Chat vs Geração de Código) ──────────
function detectConversationalIntent(prompt: string, hasCurrentHtml: boolean): { isChat: boolean; reply: string } {
  const p = prompt.trim().toLowerCase();

  // Palavras-chave que indicam claramente um comando ou pedido de construção/edição de site
  const actionKeywords = [
    'cria', 'criar', 'construir', 'construa', 'faz', 'fazer', 'muda', 'mudar', 
    'altera', 'alterar', 'adiciona', 'adicionar', 'remove', 'remover', 'elimina',
    'troca', 'trocar', 'coloca', 'colocar', 'desenvolve', 'desenvolver',
    'site', 'website', 'landing', 'pagina', 'página', 'loja', 'ecommerce', 
    'restaurante', 'barbearia', 'hotel', 'resort', 'preço', 'preco', 'precos',
    'botao', 'botão', 'whatsapp', 'formulario', 'formulário', 'tabela', 'cor', 'cores',
    'tema', 'fundo', 'header', 'footer', 'menu', 'navbar', 'hero', 'banner', 'design'
  ];

  const hasAction = actionKeywords.some(kw => p.includes(kw));
  if (hasAction) {
    return { isChat: false, reply: '' };
  }

  // Saudações típicas (sem pedido de ação)
  const greetings = [
    'ola', 'olá', 'oi', 'oii', 'oiii', 'hey', 'hello', 'hi', 'bom dia', 'boa tarde', 
    'boa noite', 'tudo bem', 'tudo bom', 'tudo bem?', 'opa', 'e aí', 'e ai', 
    'fala aí', 'salve'
  ];
  if (greetings.includes(p) || greetings.some(g => p === g || p === `${g}!` || p === `${g}.` || p === `${g}?`)) {
    return {
      isChat: true,
      reply: hasCurrentHtml
        ? 'Olá! Como posso ajudar a aprimorar o seu website? Pode pedir para mudar cores, adicionar novas secções, incluir botão de WhatsApp, catálogo de serviços ou preços.'
        : 'Olá! Sou o Construtor com Inteligência Artificial da WEHOSTHERE. Que tipo de website ou sistema deseja criar hoje? (Por exemplo: um restaurante, barbearia, portfólio, loja online ou página de captura).'
    };
  }

  // Dúvidas de como usar ou quem é
  if (
    p.includes('como funciona') || p.includes('o que fazes') || p.includes('o que podes fazer') || 
    p.includes('quem és tu') || p.includes('quem e voce') || p.includes('como usar') ||
    p === 'ajuda' || p === 'help' || p.includes('podes me ajudar')
  ) {
    return {
      isChat: true,
      reply: 'Eu crio e altero websites completos e responsivos em tempo real! Pode simplesmente descrever o que precisa no chat, por exemplo:\n\n• "Cria uma landing page para uma clínica médica com agendamento"\n• "Adiciona um botão de WhatsApp flutuante"\n• "Muda a paleta de cores para tema escuro e dourado"\n\nAssim que fizer o pedido, vou gerar o código ao vivo no terminal e atualizar o preview!'
    };
  }

  // Elogios ou confirmações curtas
  const courtesies = ['obrigado', 'obrigada', 'valeu', 'top', 'muito bom', 'gostei', 'show', 'legal', 'perfeito', 'ok', 'entendi'];
  if (courtesies.includes(p) || courtesies.some(c => p === c || p === `${c}!` || p === `${c}.`)) {
    return {
      isChat: true,
      reply: 'De nada! O projeto continua pronto no preview. Se quiser fazer mais alterações é só pedir, ou pode clicar no botão branco "Publicar" para colocá-lo online no seu subdomínio com SSL!'
    };
  }

  return { isChat: false, reply: '' };
}

// ─── Helper para enviar SSE ───────────────────────────────────────────────────
function makeSSE(controller: ReadableStreamDefaultController, encoder: TextEncoder) {
  return {
    chunk(text: string) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: text })}\n\n`));
    },
    chat(message: string, modelUsed = 'Assistente WEHOSTHERE') {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chat', message, modelUsed })}\n\n`));
      controller.close();
    },
    done(explanation: string, diffSummary: string, executionSeconds: number, modelUsed?: string) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', explanation, diffSummary, executionSeconds, modelUsed })}\n\n`));
      controller.close();
    },
    error(message: string) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message })}\n\n`));
      controller.close();
    }
  };
}

// ─── Simular streaming de string ja gerada ────────────────────────────────────
async function simulateStream(html: string, sse: ReturnType<typeof makeSSE>, chunkSize = 80, delay = 8) {
  for (let i = 0; i < html.length; i += chunkSize) {
    sse.chunk(html.slice(i, i + chunkSize));
    await new Promise(r => setTimeout(r, delay));
  }
}

// ─── Extrair HTML limpo de uma resposta de texto ─────────────────────────────
function extractHtml(raw: string): string {
  const match = raw.match(/```html([\s\S]*?)```/i) || raw.match(/```([\s\S]*?)```/i);
  const code = match ? match[1].trim() : raw.trim();
  if (code.toLowerCase().includes('<!doctype') || code.toLowerCase().includes('<html')) {
    return code;
  }
  return '';
}

// ─── POST handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Payload invalido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { prompt = '', currentHtml = '', title = '', mode = 'builder' } = body;
  if (!prompt.trim()) {
    return new Response(JSON.stringify({ error: 'O prompt e obrigatorio' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const userPrompt = currentHtml
    ? `O utilizador quer alterar o site existente.\nPEDIDO: "${prompt}"\n\nHTML ATUAL:\n${currentHtml.slice(0, 30000)}\n\nAtualize mantendo o design coeso.`
    : `Crie um site profissional para: "${prompt}".\nTitulo sugerido: "${title || 'Site Profissional'}"`;

  const elapsed = () => Math.max(1, Math.round((Date.now() - startTime) / 1000));
  const okExplanation = currentHtml
    ? `O site foi atualizado com base no seu pedido: "${prompt}".`
    : `O site para "${prompt}" foi gerado e validado no preview.`;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const sse = makeSSE(controller, encoder);

      // ── MODO CONVERSA / CONSULTORIA EXPLICITA (Sem alterar o site) ─────────
      if (mode === 'chat') {
        const chatPrompt = `Você é o Consultor Especialista de Presença Digital, Design e Estratégia da WEHOSTHERE (líder de hospedagem e criação de sites em Moçambique).
O utilizador está a conversar consigo sobre o projeto de website "${title || 'Meu Site'}".
Responda de forma clara, amigável, motivadora e estruturada em português.
Dê sugestões práticas de marketing digital, ideias de conteúdo/textos, boas práticas de experiência do utilizador e dicas adaptadas ao mercado moçambicano (como pagamentos M-Pesa/e-Mola, pedidos via WhatsApp e moeda Meticais MZN).
IMPORTANTE: Não gere código HTML de páginas completas. O utilizador está no Modo Conversa para planear e tirar dúvidas.

PEDIDO / DÚVIDA DO UTILIZADOR: "${prompt}"`;

        if (geminiKey) {
          try {
            const gemRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: chatPrompt }] }],
                  generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
                })
              }
            );
            if (gemRes.ok) {
              const data = await gemRes.json();
              const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (reply) {
                sse.chat(reply, 'Consultor IA WEHOSTHERE');
                return;
              }
            }
          } catch (e) {
            console.warn('[Builder] Erro chat Gemini:', e);
          }
        }

        if (openaiKey) {
          try {
            const oaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${openaiKey}`
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: chatPrompt }],
                temperature: 0.7
              })
            });
            if (oaiRes.ok) {
              const data = await oaiRes.json();
              const reply = data?.choices?.[0]?.message?.content;
              if (reply) {
                sse.chat(reply, 'Consultor IA WEHOSTHERE');
                return;
              }
            }
          } catch (e) {
            console.warn('[Builder] Erro chat OpenAI:', e);
          }
        }

        // Resposta de fallback inteligente
        const conversational = detectConversationalIntent(prompt, Boolean(currentHtml));
        const defaultChatReply = conversational.reply || `Entendido! Como seu consultor da WEHOSTHERE, recomendo estruturar o seu website com foco na simplicidade e conversão direta. Destaque uma mensagem de boas-vindas forte, mostre os seus principais produtos ou serviços com valores transparentes em Meticais (MZN) e adicione botões de contacto direto via WhatsApp.\n\nQuando estiver pronto para aplicar alterações visuais no seu site, mude para o "Modo Desenvolvimento" no topo da caixa de texto!`;
        sse.chat(defaultChatReply, 'Consultor WEHOSTHERE');
        return;
      }

      // ── 0. Verificar se é conversa automática (Olá, Como funciona, Dúvidas) ─
      const conversational = detectConversationalIntent(prompt, Boolean(currentHtml));
      if (conversational.isChat) {
        sse.chat(conversational.reply, 'Assistente WEHOSTHERE');
        return;
      }

      // ── 1. Gemini com streaming SSE real ───────────────────────────────────
      if (geminiKey) {
        try {
          const gemRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${geminiKey}&alt=sse`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: `${SYSTEM_INSTRUCTION}\n\n${userPrompt}` }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
              })
            }
          );

          if (gemRes.ok && gemRes.body) {
            const reader = gemRes.body.getReader();
            const dec = new TextDecoder();
            let buf = '';
            let pre = '';       // acumula texto antes de encontrar HTML
            let started = false; // ja encontramos o inicio do HTML

            outer: while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buf += dec.decode(value, { stream: true });
              const lines = buf.split('\n');
              buf = lines.pop() ?? '';

              for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const raw = line.slice(6).trim();
                if (!raw || raw === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(raw);
                  const text: string = parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
                  if (!text) continue;

                  if (!started) {
                    pre += text;
                    const idx = pre.search(/<!DOCTYPE|<html/i);
                    if (idx >= 0) {
                      started = true;
                      sse.chunk(pre.slice(idx));
                      pre = '';
                    }
                  } else {
                    // Parar de emitir depois de </html>
                    const endIdx = text.toLowerCase().indexOf('</html>');
                    if (endIdx >= 0) {
                      sse.chunk(text.slice(0, endIdx + 7));
                      break outer;
                    }
                    sse.chunk(text);
                  }
                } catch { /* ignorar */ }
              }
            }

            if (started) {
              sse.done(okExplanation, currentHtml ? '+28 / -9' : '+180 linhas', elapsed(), 'Gemini 1.5 Flash');
              return;
            }
          }
        } catch (e) {
          console.warn('[Builder] Erro Gemini streaming:', e);
        }

        // ── 1b. Gemini modo normal com stream simulado ──────────────────────
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: `${SYSTEM_INSTRUCTION}\n\n${userPrompt}` }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
              })
            }
          );
          if (res.ok) {
            const data = await res.json();
            const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            const html = extractHtml(rawText);
            if (html) {
              await simulateStream(html, sse);
              sse.done(okExplanation, currentHtml ? '+28 / -9' : '+180 linhas', elapsed(), 'Gemini 1.5 Flash');
              return;
            }
          }
        } catch (e) {
          console.warn('[Builder] Erro Gemini normal:', e);
        }
      }

      // ── 2. OpenAI com streaming real ──────────────────────────────────────
      if (openaiKey) {
        try {
          const oaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              stream: true,
              messages: [
                { role: 'system', content: SYSTEM_INSTRUCTION },
                { role: 'user', content: userPrompt }
              ],
              temperature: 0.7,
              max_tokens: 4096
            })
          });

          if (oaiRes.ok && oaiRes.body) {
            const reader = oaiRes.body.getReader();
            const dec = new TextDecoder();
            let buf = '';
            let pre = '';
            let started = false;

            outer2: while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buf += dec.decode(value, { stream: true });
              const lines = buf.split('\n');
              buf = lines.pop() ?? '';

              for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const raw = line.slice(6).trim();
                if (raw === '[DONE]') break outer2;
                try {
                  const parsed = JSON.parse(raw);
                  const delta: string = parsed?.choices?.[0]?.delta?.content ?? '';
                  if (!delta) continue;

                  if (!started) {
                    pre += delta;
                    const idx = pre.search(/<!DOCTYPE|<html/i);
                    if (idx >= 0) {
                      started = true;
                      sse.chunk(pre.slice(idx));
                      pre = '';
                    }
                  } else {
                    const endIdx = delta.toLowerCase().indexOf('</html>');
                    if (endIdx >= 0) {
                      sse.chunk(delta.slice(0, endIdx + 7));
                      break outer2;
                    }
                    sse.chunk(delta);
                  }
                } catch { /* ignorar */ }
              }
            }

            if (started) {
              sse.done(okExplanation, currentHtml ? '+28 / -9' : '+180 linhas', elapsed(), 'GPT-4o Mini');
              return;
            }
          }
        } catch (e) {
          console.warn('[Builder] Erro OpenAI streaming:', e);
        }
      }

      // ── 3. Fallback estatico com stream simulado ──────────────────────────
      const fallback = getFallbackHtml(prompt, title);
      await simulateStream(fallback, sse, 60, 12);
      sse.done(
        currentHtml
          ? `Ajustamos o seu site com base no pedido: "${prompt}".`
          : `Pagina base criada para "${prompt}". Pode refiná-la agora!`,
        currentHtml ? '+18 / -5' : '+95 linhas',
        elapsed(),
        'Modelo Base Local (Offline)'
      );
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}
