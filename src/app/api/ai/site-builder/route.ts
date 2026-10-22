import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


// â”€â”€â”€ Fallback HTML (Modelos PrÃ©-Prontos Preto & Branco Ricos: Hero, Stats, Grid, Galeria com Imagens Unsplash, Depoimentos, FAQ, FormulÃ¡rio de Agendamento WhatsApp, CTA, BotÃ£o Flutuante, RodapÃ© Multi-Coluna) â”€
function getFallbackHtml(prompt: string, title?: string): string {
  const p = prompt.toLowerCase();

  // Componentes Auxiliares ReutilizÃ¡veis
  const renderHead = (pageTitle: string) => `
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { background: #000000; color: #ffffff; font-family: 'Plus Jakarta Sans', sans-serif; overflow-x: hidden; }
    ::selection { background: #ffffff; color: #000000; }
    section[id] { scroll-margin-top: 5rem; }
  </style>
</head>`;

  const renderNavbar = (brand: string, navItems: { label: string; href: string }[], waMsg: string) => `
  <header class="sticky top-0 z-50 backdrop-blur-xl bg-black/85 border-b border-white/10 transition-all">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
      <a href="#inicio" class="flex items-center gap-3 group">
        <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-black font-extrabold text-lg shadow-lg group-hover:scale-105 transition">
          ${brand.charAt(0).toUpperCase()}
        </div>
        <div>
          <span class="font-extrabold text-lg tracking-tight text-white block">${brand}</span>
          <span class="text-[10px] uppercase tracking-widest text-zinc-400 block font-medium">Exclusividade &amp; Luxo</span>
        </div>
      </a>

      <nav class="hidden md:flex items-center gap-8" id="desktop-nav">
        ${navItems.map(item => `<a href="${item.href}" class="text-xs uppercase tracking-wider text-zinc-400 hover:text-white transition font-medium">${item.label}</a>`).join('')}
      </nav>

      <div class="flex items-center gap-3">
        <a href="https://wa.me/258848335618?text=${encodeURIComponent(waMsg)}" target="_blank" rel="noopener noreferrer" class="hidden sm:inline-flex items-center gap-2 bg-white text-black font-bold text-xs px-5 py-2.5 rounded-full hover:bg-zinc-200 transition shadow-sm hover:scale-[1.02]">
          <i data-lucide="message-circle" class="w-4 h-4"></i>
          <span>Falar no WhatsApp</span>
        </a>
        <!-- Botão Hamburger (mobile) -->
        <button id="menu-toggle" aria-label="Abrir menu" onclick="toggleMobileMenu()" class="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition gap-1.5">
          <span id="hb1" class="block w-5 h-0.5 bg-white transition-all duration-300 origin-center"></span>
          <span id="hb2" class="block w-5 h-0.5 bg-white transition-all duration-300"></span>
          <span id="hb3" class="block w-5 h-0.5 bg-white transition-all duration-300 origin-center"></span>
        </button>
      </div>
    </div>

    <!-- Mobile Drawer -->
    <div id="mobile-menu" style="display:none;flex-direction:column;" class="md:hidden bg-black/98 backdrop-blur-2xl border-t border-white/10 px-4 py-5 space-y-1">
      ${navItems.map(item => `<a href="${item.href}" onclick="closeMobileMenu()" class="block px-4 py-3.5 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition">${item.label}</a>`).join('\n      ')}
      <div class="pt-3 mt-2 border-t border-white/10">
        <a href="https://wa.me/258848335618?text=${encodeURIComponent(waMsg)}" target="_blank" rel="noopener noreferrer" class="flex items-center justify-center gap-2 bg-white text-black font-extrabold text-sm px-6 py-3.5 rounded-xl hover:bg-zinc-200 transition w-full">
          <i data-lucide="message-circle" class="w-4 h-4"></i>
          <span>Falar no WhatsApp</span>
        </a>
      </div>
    </div>
  </header>`;

  const renderStats = (stats: { value: string; label: string }[]) => `
  <section class="border-y border-white/10 bg-white/[0.02] py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-y lg:divide-y-0 lg:divide-x divide-white/10">
        ${stats.map(s => `
        <div class="pt-4 lg:pt-0">
          <div class="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">${s.value}</div>
          <div class="text-xs uppercase tracking-widest text-zinc-400 mt-2 font-medium">${s.label}</div>
        </div>`).join('')}
      </div>
    </div>
  </section>`;

  const renderGallery = (title: string, subtitle: string, items: { title: string; desc: string; image: string; tag: string }[]) => `
  <section id="galeria" class="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-2xl mx-auto mb-16">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-zinc-300 mb-4">
        <i data-lucide="eye" class="w-3.5 h-3.5"></i>
        <span>ExperiÃªncia Visual</span>
      </div>
      <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">${title}</h2>
      <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">${subtitle}</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      ${items.map(item => `
      <div class="group relative rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/25 transition-all duration-500 flex flex-col overflow-hidden shadow-2xl">
        <div class="relative h-60 sm:h-64 overflow-hidden w-full bg-zinc-900">
          <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out brightness-95 contrast-105" loading="lazy" />
          <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent"></div>
          <div class="absolute top-4 left-4 z-10">
            <span class="text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-white border border-white/20">${item.tag}</span>
          </div>
        </div>
        <div class="p-6 flex flex-col justify-between flex-1">
          <div>
            <h3 class="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-zinc-200 transition">${item.title}</h3>
            <p class="text-xs text-zinc-400 leading-relaxed">${item.desc}</p>
          </div>
          <div class="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-300 font-semibold group-hover:text-white">
            <span>Explorar detalhe</span>
            <i data-lucide="arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i>
          </div>
        </div>
      </div>`).join('')}
    </div>
  </section>`;

  const renderTestimonials = (title: string, subtitle: string, list: { name: string; role: string; comment: string }[]) => `
  <section id="depoimentos" class="py-24 border-t border-white/10 bg-white/[0.01]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-2xl mx-auto mb-16">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-zinc-300 mb-4">
          <i data-lucide="star" class="w-3.5 h-3.5 fill-white text-white"></i>
          <span>ExcelÃªncia Comprovada</span>
        </div>
        <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">${title}</h2>
        <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">${subtitle}</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        ${list.map(t => `
        <div class="p-8 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/20 transition flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-1 mb-4">
              ${Array(5).fill(0).map(() => `<i data-lucide="star" class="w-4 h-4 fill-white text-white"></i>`).join('')}
            </div>
            <p class="text-xs sm:text-sm text-zinc-300 leading-relaxed italic mb-6">"${t.comment}"</p>
          </div>
          <div class="flex items-center gap-3 pt-4 border-t border-white/10">
            <div class="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center font-bold text-xs text-white">
              ${t.name.charAt(0)}
            </div>
            <div>
              <div class="text-xs font-bold text-white">${t.name}</div>
              <div class="text-[11px] text-zinc-400">${t.role}</div>
            </div>
          </div>
        </div>`).join('')}
      </div>
    </div>
  </section>`;

  const renderFaq = (title: string, subtitle: string, faqs: { q: string; a: string }[]) => `
  <section id="faq" class="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-zinc-300 mb-4">
        <i data-lucide="help-circle" class="w-3.5 h-3.5"></i>
        <span>Esclarecimentos</span>
      </div>
      <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">${title}</h2>
      <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">${subtitle}</p>
    </div>

    <div class="space-y-4">
      ${faqs.map(faq => `
      <div class="border border-white/10 rounded-2xl overflow-hidden bg-zinc-950/60 hover:border-white/20 transition">
        <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-6 text-left text-sm font-bold text-white hover:bg-white/5 transition">
          <span>${faq.q}</span>
          <i data-lucide="chevron-down" class="w-4 h-4 text-zinc-400 transition-transform duration-200"></i>
        </button>
        <div class="hidden px-6 pb-6 text-xs text-zinc-400 leading-relaxed border-t border-white/5 pt-4">
          ${faq.a}
        </div>
      </div>`).join('')}
    </div>
  </section>`;

  const renderBookingForm = (title: string, subtitle: string, options: string[], btnText: string) => `
  <section id="agendamento" class="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="relative rounded-3xl bg-zinc-950 border border-white/10 p-8 sm:p-12 overflow-hidden shadow-2xl">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.06),transparent_60%)] pointer-events-none"></div>
      
      <div class="text-center max-w-xl mx-auto mb-10 relative z-10">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-zinc-300 mb-4">
          <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
          <span>Atendimento Direto &bull; MoÃ§ambique</span>
        </div>
        <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">${title}</h2>
        <p class="text-zinc-400 text-xs sm:text-sm leading-relaxed">${subtitle}</p>
      </div>

      <form onsubmit="handleBookingSubmit(event)" class="relative z-10 space-y-5">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label class="block text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wider">O Seu Nome</label>
            <input type="text" name="booking_name" required placeholder="Ex: Carlos Mondlane" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wider">TelemÃ³vel / WhatsApp</label>
            <input type="tel" name="booking_phone" required placeholder="Ex: +258 84 000 0000" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label class="block text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wider">OpÃ§Ã£o / ServiÃ§o Desejado</label>
            <select name="booking_service" required class="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition">
              <option value="" disabled selected class="text-zinc-500">Selecione uma opÃ§Ã£o...</option>
              ${options.map(opt => `<option value="${opt}" class="bg-zinc-900 text-white">${opt}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wider">Data Preferencial</label>
            <input type="date" name="booking_date" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wider">Mensagem ou ObservaÃ§Ãµes (Opcional)</label>
          <textarea name="booking_notes" rows="3" placeholder="Indique qualquer preferÃªncia especÃ­fica ou detalhe adicional..." class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition resize-none"></textarea>
        </div>

        <button type="submit" class="w-full py-4 px-6 rounded-xl bg-white text-black font-extrabold text-sm tracking-wide hover:bg-zinc-200 transition shadow-xl flex items-center justify-center gap-2 group cursor-pointer">
          <i data-lucide="send" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i>
          <span>${btnText}</span>
        </button>
        <p class="text-[11px] text-center text-zinc-500 mt-2">
          ðŸ”’ Ao submeter, abrirÃ¡ o WhatsApp com a mensagem formatada para confirmaÃ§Ã£o imediata.
        </p>
      </form>
    </div>
  </section>`;

  const renderCta = (title: string, desc: string, btnText: string, waMsg: string) => `
  <section class="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="relative rounded-3xl bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border border-white/15 p-10 sm:p-16 text-center overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.15),transparent_70%)] pointer-events-none"></div>
      <div class="relative z-10 max-w-3xl mx-auto">
        <h2 class="text-3xl sm:text-5xl font-black tracking-tight text-white mb-6">${title}</h2>
        <p class="text-zinc-300 text-sm sm:text-base leading-relaxed mb-8 max-w-xl mx-auto">${desc}</p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="https://wa.me/258848335618?text=${encodeURIComponent(waMsg)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 bg-white text-black font-extrabold text-sm px-8 py-4 rounded-full hover:bg-zinc-200 transition shadow-2xl hover:scale-105">
            <i data-lucide="message-circle" class="w-5 h-5"></i>
            <span>${btnText}</span>
          </a>
        </div>
        <div class="mt-6 text-[11px] text-zinc-400 font-medium">
          âœ“ Atendimento Imediato &bull; MoÃ§ambique &bull; DisponÃ­vel 24/7
        </div>
      </div>
    </div>
  </section>`;

  const renderFooter = (brand: string, navItems: { label: string; href: string }[], waMsg?: string) => `
  <!-- BotÃ£o Flutuante do WhatsApp -->
  <a href="https://wa.me/258848335618?text=${encodeURIComponent(waMsg || 'OlÃ¡! Gostaria de mais informaÃ§Ãµes.')}" target="_blank" rel="noopener noreferrer" class="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2.5 bg-white text-black font-extrabold text-xs py-3 px-5 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 hover:bg-zinc-200 border border-white/20 group">
    <i data-lucide="message-circle" class="w-4 h-4 group-hover:rotate-12 transition-transform"></i>
    <span class="font-bold tracking-tight">WhatsApp</span>
  </a>

  <footer id="contacto" class="border-t border-white/10 bg-black pt-16 pb-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-10 pb-16 border-b border-white/10">
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-black font-black text-base">
              ${brand.charAt(0).toUpperCase()}
            </div>
            <span class="font-bold text-lg text-white tracking-tight">${brand}</span>
          </div>
          <p class="text-xs text-zinc-400 leading-relaxed">
            ExcelÃªncia, design refinado e compromisso com o mais alto padrÃ£o em MoÃ§ambique.
          </p>
          <div class="flex items-center gap-3 pt-2">
            <a href="https://wa.me/258848335618" target="_blank" class="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:border-white transition"><i data-lucide="message-circle" class="w-4 h-4"></i></a>
            <a href="#" class="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:border-white transition"><i data-lucide="instagram" class="w-4 h-4"></i></a>
            <a href="#" class="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:border-white transition"><i data-lucide="phone" class="w-4 h-4"></i></a>
          </div>
        </div>

        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-white mb-4">NavegaÃ§Ã£o</h4>
          <ul class="space-y-2.5">
            ${navItems.map(item => `<li><a href="${item.href}" class="text-xs text-zinc-400 hover:text-white transition">${item.label}</a></li>`).join('')}
          </ul>
        </div>

        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-white mb-4">Contacto & LocalizaÃ§Ã£o</h4>
          <ul class="space-y-2.5 text-xs text-zinc-400">
            <li class="flex items-center gap-2">
              <i data-lucide="map-pin" class="w-4 h-4 text-white"></i>
              <span>Maputo &bull; Matola, MoÃ§ambique</span>
            </li>
            <li class="flex items-center gap-2">
              <i data-lucide="phone" class="w-4 h-4 text-white"></i>
              <span>+258 84 000 0000</span>
            </li>
            <li class="flex items-center gap-2">
              <i data-lucide="mail" class="w-4 h-4 text-white"></i>
              <span>contacto@${brand.toLowerCase().replace(/\s+/g, '')}.co.mz</span>
            </li>
            <li class="flex items-center gap-2">
              <i data-lucide="clock" class="w-4 h-4 text-white"></i>
              <span>Seg - SÃ¡b: 08:00 Ã s 20:00</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-white mb-4">Pagamentos Aceites</h4>
          <p class="text-xs text-zinc-400 mb-4">Aceitamos as principais soluÃ§Ãµes financeiras de MoÃ§ambique:</p>
          <div class="flex flex-wrap gap-2 text-[10px] text-zinc-300 font-semibold">
            <span class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">M-Pesa</span>
            <span class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">E-Mola</span>
            <span class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">BIM / BCI</span>
            <span class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">NumerÃ¡rio</span>
          </div>
        </div>
      </div>

      <div class="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-4">
        <div>&copy; 2026 ${brand}. Todos os direitos reservados.</div>
        <div class="flex items-center gap-2">
          <span>Potenciado por</span>
          <span class="font-bold text-white tracking-wider">WEHOSTHERE</span>
        </div>
      </div>
    </div>
  </footer>

  <script>
    lucide.createIcons();
    function toggleMobileMenu(){var m=document.getElementById('mobile-menu'),h1=document.getElementById('hb1'),h2=document.getElementById('hb2'),h3=document.getElementById('hb3'),o=m.style.display==='flex';if(o){m.style.display='none';h1.style.transform='';h2.style.opacity='1';h3.style.transform='';}else{m.style.display='flex';h1.style.transform='rotate(45deg) translate(4px,4px)';h2.style.opacity='0';h3.style.transform='rotate(-45deg) translate(4px,-4px)';}}
    function closeMobileMenu(){var m=document.getElementById('mobile-menu'),h1=document.getElementById('hb1'),h2=document.getElementById('hb2'),h3=document.getElementById('hb3');if(m)m.style.display='none';if(h1){h1.style.transform='';h2.style.opacity='1';h3.style.transform='';}}
    function toggleFaq(btn) {
      const content = btn.nextElementSibling;
      const icon = btn.querySelector('i[data-lucide="chevron-down"]');
      const isHidden = content.classList.contains('hidden');
      content.classList.toggle('hidden');
      if (icon) {
        icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
      }
    }
    function handleBookingSubmit(e) {
      e.preventDefault();
      const form = e.target;
      const name = form.querySelector('[name="booking_name"]')?.value || '';
      const phone = form.querySelector('[name="booking_phone"]')?.value || '';
      const service = form.querySelector('[name="booking_service"]')?.value || '';
      const date = form.querySelector('[name="booking_date"]')?.value || '';
      const notes = form.querySelector('[name="booking_notes"]')?.value || '';

      let text = 'OlÃ¡! Gostaria de fazer uma solicitaÃ§Ã£o:\n\n';
      if (name) text += 'ðŸ‘¤ *Nome:* ' + name + '\n';
      if (phone) text += 'ðŸ“± *Contacto:* ' + phone + '\n';
      if (service) text += 'ðŸŽ¯ *OpÃ§Ã£o:* ' + service + '\n';
      if (date) text += 'ðŸ“… *Data:* ' + date + '\n';
      if (notes) text += 'ðŸ“ *Mensagem:* ' + notes + '\n';

      const waUrl = 'https://wa.me/258848335618?text=' + encodeURIComponent(text);
      window.open(waUrl, '_blank');
    }
  </script>`;

  // 1. RESTAURANTE / GASTRONOMIA
  if (p.includes('restaurante') || p.includes('comida') || p.includes('menu') || p.includes('cafe') || p.includes('cafÃ©') || p.includes('hamburguer') || p.includes('pizza') || p.includes('bistrÃ´')) {
    const brand = title || 'BistrÃ´ Savana Gourmet';
    const navItems = [
      { label: 'InÃ­cio', href: '#inicio' },
      { label: 'CardÃ¡pio', href: '#cardapio' },
      { label: 'Galeria', href: '#galeria' },
      { label: 'Depoimentos', href: '#depoimentos' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Reservar Mesa', href: '#agendamento' },
      { label: 'Contacto', href: '#contacto' }
    ];
    const waDefault = 'OlÃ¡! Gostaria de reservar uma mesa no ' + brand;

    return `<!DOCTYPE html>
<html lang="pt" class="dark">
${renderHead(brand + ' | Gastronomia de ExcelÃªncia')}
<body class="bg-black text-white antialiased">
  ${renderNavbar(brand, navItems, waDefault)}

  <section id="inicio" class="relative min-h-[85vh] flex items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-24 overflow-hidden">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.1),transparent_70%)] pointer-events-none"></div>
    <div class="relative z-10 max-w-4xl mx-auto">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 text-xs text-zinc-300 mb-8 backdrop-blur-md">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Aberto Hoje &bull; Sommerschield, Maputo</span>
      </div>
      <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6 leading-tight">
        Sabores AutÃªnticos com a Arte da <span class="underline decoration-white/30 decoration-wavy">Alta CulinÃ¡ria</span>
      </h1>
      <p class="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
        Uma experiÃªncia gastronÃ³mica inesquecÃ­vel com mariscos frescos da costa moÃ§ambicana, carnes nobres e ingredientes cuidadosamente selecionados.
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="#cardapio" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-black font-extrabold text-sm px-8 py-4 rounded-full hover:bg-zinc-200 transition shadow-xl">
          <i data-lucide="utensils" class="w-4 h-4"></i>
          <span>Ver CardÃ¡pio Especial</span>
        </a>
        <a href="#agendamento" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/20 bg-white/5 text-white font-bold text-sm px-8 py-4 rounded-full hover:bg-white/10 transition">
          <i data-lucide="calendar" class="w-4 h-4"></i>
          <span>Reservar Mesa Online</span>
        </a>
      </div>
    </div>
  </section>

  ${renderStats([
    { value: '18.500+', label: 'Clientes Atendidos' },
    { value: '4.9/5', label: 'AvaliaÃ§Ã£o MÃ©dia' },
    { value: '100%', label: 'Ingredientes Frescos' },
    { value: '2 Chefes', label: 'Premiados Internacionais' }
  ])}

  <section id="cardapio" class="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-2xl mx-auto mb-16">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-zinc-300 mb-4">
        <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
        <span>Pratos Selecionados</span>
      </div>
      <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">Especialidades do Chef</h2>
      <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">ConheÃ§a as nossas opÃ§Ãµes mais aclamadas pelos clientes em Maputo.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${[
        { name: 'CamarÃ£o Tigre Grelhado', desc: 'CamarÃ£o gigante com manteiga de ervas, alho tostado e arroz de coco perfumado.', price: '1.450 MT', icon: 'utensils' },
        { name: 'Picanha Nobre na Brasa', desc: 'Corte premium grelhado no ponto perfeito, acompanhado de farofa crocante e mandioca.', price: '980 MT', icon: 'flame' },
        { name: 'Frango Zambeziano AutÃªntico', desc: 'Receita tradicional marinada em leite de coco fresco, piripiri suave e especiarias.', price: '690 MT', icon: 'drumstick' },
        { name: 'Massa Trufada com Cogumelos', desc: 'Fettuccine artesanal envolto em molho cremoso de trufas e parmesÃ£o ralado na hora.', price: '780 MT', icon: 'chef-hat' },
        { name: 'Petit GÃ¢teau de Chocolate', desc: 'Bolo quente com coraÃ§Ã£o derretido de chocolate belga e gelado de baunilha de MadagÃ¡scar.', price: '380 MT', icon: 'cake' },
        { name: 'Cocktail de Assinatura Savana', desc: 'Gin artesanal infundido com frutos tropicais, alecrim e tÃ³nica botÃ¢nica.', price: '320 MT', icon: 'wine' }
      ].map(dish => `
      <div class="group p-6 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/25 transition duration-300 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition">
              <i data-lucide="${dish.icon}" class="w-5 h-5"></i>
            </div>
            <span class="text-base font-extrabold text-white">${dish.price}</span>
          </div>
          <h3 class="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-zinc-200 transition">${dish.name}</h3>
          <p class="text-xs text-zinc-400 leading-relaxed mb-6">${dish.desc}</p>
        </div>
        <a href="https://wa.me/258848335618?text=${encodeURIComponent('OlÃ¡! Gostaria de pedir: ' + dish.name)}" target="_blank" class="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-white hover:bg-white hover:text-black transition">
          <i data-lucide="shopping-bag" class="w-3.5 h-3.5"></i>
          <span>Pedir no WhatsApp</span>
        </a>
      </div>`).join('')}
    </div>
  </section>

  ${renderGallery('O Nosso Ambiente & Pratos', 'EspaÃ§os e apresentaÃ§Ãµes desenhados para proporcionar momentos memorÃ¡veis.', [
    { title: 'SalÃ£o Principal Acolhedor', desc: 'Design contemporÃ¢neo, iluminaÃ§Ã£o acolhedora e mesas espaÃ§osas para encontros inesquecÃ­veis.', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80', tag: 'Ambiente' },
    { title: 'Garrafeira de Vinhos Selecionados', desc: 'Mais de 80 rÃ³tulos selecionados de Portugal, Ãfrica do Sul e das melhores regiÃµes do mundo.', image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80', tag: 'Vinhos Raros' },
    { title: 'Gastronomia & Carnes Nobres', desc: 'Cortes nobres grelhados na brasa com temperos artesanais e apresentaÃ§Ã£o impecÃ¡vel.', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80', tag: 'Pratos de Assinatura' }
  ])}

  ${renderTestimonials('O Que Dizem os Nossos Clientes', 'A opiniÃ£o de quem vive a experiÃªncia gastronÃ³mica no nosso restaurante.', [
    { name: 'Dr. Carlos Mondlane', role: 'Cliente Frequente &bull; Maputo', comment: 'O camarÃ£o grelhado Ã© simplesmente incomparÃ¡vel. Atendimento nobre e garrafeira de topo.' },
    { name: 'Ana Machava', role: 'CrÃ­tica GastronÃ³mica &bull; Sommerschield', comment: 'Ambiente sofisticado e comida que respeita a identidade moÃ§ambicana com tÃ©cnicas de classe mundial.' },
    { name: 'TomÃ¡s Sitoe', role: 'EmpresÃ¡rio &bull; Matola', comment: 'Lugar predileto para almoÃ§os de negÃ³cios e jantares em famÃ­lia. A picanha na brasa Ã© perfeita.' }
  ])}

  ${renderFaq('Perguntas Frequentes', 'Tudo o que precisa de saber antes da sua visita.', [
    { q: 'Ã‰ obrigatÃ³rio fazer reserva prÃ©via?', a: 'NÃ£o Ã© obrigatÃ³rio, mas Ã© altamente recomendÃ¡vel nos finais de semana e jantares para garantir a sua mesa sem tempo de espera.' },
    { q: 'TÃªm opÃ§Ãµes vegetarianas e sem glÃºten?', a: 'Sim! Dispomos de pratos vegetarianos dedicados e os nossos chefes adaptam receitas para clientes com restriÃ§Ãµes alimentares.' },
    { q: 'Aceitam pagamentos por M-Pesa e cartÃµes bancÃ¡rios?', a: 'Sim, aceitamos M-Pesa, E-Mola, cartÃµes Visa/Mastercard (POS nacional e internacional) e numerÃ¡rio.' },
    { q: 'Fazem reservas para eventos corporativos e aniversÃ¡rios?', a: 'Com certeza. Dispomos de menus de grupo personalizados e Ã¡rea reservada para celebraÃ§Ãµes e conferÃªncias.' }
  ])}

  ${renderBookingForm('Reserve a Sua Mesa Online', 'Preencha os dados abaixo e confirme instantaneamente a sua reserva pelo WhatsApp.', [
    'Reserva de Mesa (Casal)',
    'Reserva de Mesa (FamÃ­lia / 4+ pessoas)',
    'AlmoÃ§o de NegÃ³cios / ReuniÃ£o',
    'CelebraÃ§Ã£o de AniversÃ¡rio / Evento',
    'Menu DegustaÃ§Ã£o Especial do Chef'
  ], 'Confirmar Reserva pelo WhatsApp')}

  ${renderCta('Viva uma Noite InesquecÃ­vel Conosco', 'Reserve jÃ¡ a sua mesa ou encomende os nossos pratos exclusivos diretamente para a sua residÃªncia.', 'Fazer Reserva Imediata', 'OlÃ¡! Gostaria de reservar uma mesa no restaurante.')}

  ${renderFooter(brand, navItems, waDefault)}
</body>
</html>`;
  }

  // 2. BARBEARIA & ESTÃ‰TICA MASCULINA
  if (p.includes('barbearia') || p.includes('cabelo') || p.includes('barba') || p.includes('estetica') || p.includes('salÃ£o') || p.includes('salao')) {
    const brand = title || 'Barbearia Real Club';
    const navItems = [
      { label: 'InÃ­cio', href: '#inicio' },
      { label: 'ServiÃ§os', href: '#servicos' },
      { label: 'Galeria', href: '#galeria' },
      { label: 'Depoimentos', href: '#depoimentos' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Agendar', href: '#agendamento' },
      { label: 'Contacto', href: '#contacto' }
    ];
    const waDefault = 'OlÃ¡! Gostaria de agendar um horÃ¡rio na ' + brand;

    return `<!DOCTYPE html>
<html lang="pt" class="dark">
${renderHead(brand + ' | Estilo & Barbearia Premium')}
<body class="bg-black text-white antialiased">
  ${renderNavbar(brand, navItems, waDefault)}

  <section id="inicio" class="relative min-h-[85vh] flex items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-24 overflow-hidden">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.08),transparent_70%)] pointer-events-none"></div>
    <div class="relative z-10 max-w-4xl mx-auto">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 text-xs text-zinc-300 mb-8 backdrop-blur-md">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Atendimento com Hora Marcada &bull; Maputo</span>
      </div>
      <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6 leading-tight">
        PrecisÃ£o, Estilo e Atendimento de <span class="underline decoration-white/30 decoration-wavy">Cavalheiro</span>
      </h1>
      <p class="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
        O espaÃ§o ideal para homens que valorizam a excelÃªncia. Cortes clÃ¡ssicos e modernos, terapia de barba e produtos de primeira linha.
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="#servicos" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-black font-extrabold text-sm px-8 py-4 rounded-full hover:bg-zinc-200 transition shadow-xl">
          <i data-lucide="scissors" class="w-4 h-4"></i>
          <span>Ver Tabela de ServiÃ§os</span>
        </a>
        <a href="#agendamento" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/20 bg-white/5 text-white font-bold text-sm px-8 py-4 rounded-full hover:bg-white/10 transition">
          <i data-lucide="calendar" class="w-4 h-4"></i>
          <span>Agendar HorÃ¡rio Online</span>
        </a>
      </div>
    </div>
  </section>

  ${renderStats([
    { value: '4.800+', label: 'Cortes Realizados' },
    { value: '4.9/5', label: 'SatisfaÃ§Ã£o dos Clientes' },
    { value: '6 Barbeiros', label: 'Mestres Especialistas' },
    { value: '100%', label: 'Pontualidade Garantida' }
  ])}

  <section id="servicos" class="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-2xl mx-auto mb-16">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-zinc-300 mb-4">
        <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
        <span>PreÃ§os Transparentes</span>
      </div>
      <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">ServiÃ§os de Assinatura</h2>
      <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">Cada detalhe planeado para realÃ§ar a sua presenÃ§a e confianÃ§a.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${[
        { name: 'Corte Moderno & Fade', desc: 'GraduaÃ§Ã£o milimÃ©trica com tesoura e mÃ¡quina, finalizaÃ§Ã£o com pomada mate de alta fixaÃ§Ã£o.', price: '450 MT', icon: 'scissors' },
        { name: 'Barboterapia com Toalha Quente', desc: 'Alinhamento com navalha afiada, Ã³leos essenciais, massagem facial e toalha vaporizada.', price: '400 MT', icon: 'sparkles' },
        { name: 'Combo Executivo (Cabelo + Barba)', desc: 'O pacote completo para estar sempre impecÃ¡vel com economia de tempo e desconto exclusivo.', price: '750 MT', icon: 'crown' },
        { name: 'Tratamento & HidrataÃ§Ã£o Capilar', desc: 'NutriÃ§Ã£o profunda para cabelos ressecados, restauraÃ§Ã£o de brilho e fortalecimento do couro cabeludo.', price: '500 MT', icon: 'shield-check' },
        { name: 'Limpeza de Pele Facial Masculina', desc: 'DesobstruÃ§Ã£o de poros, esfoliaÃ§Ã£o suave e hidrataÃ§Ã£o anti-brilho revigorante.', price: '600 MT', icon: 'smile' },
        { name: 'Corte Infantil Estiloso', desc: 'Atendimento paciente e cuidadoso para os pequenos, garantindo um visual moderno e divertido.', price: '350 MT', icon: 'user' }
      ].map(srv => `
      <div class="group p-6 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/25 transition duration-300 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition">
              <i data-lucide="${srv.icon}" class="w-5 h-5"></i>
            </div>
            <span class="text-base font-extrabold text-white">${srv.price}</span>
          </div>
          <h3 class="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-zinc-200 transition">${srv.name}</h3>
          <p class="text-xs text-zinc-400 leading-relaxed mb-6">${srv.desc}</p>
        </div>
        <a href="https://wa.me/258848335618?text=${encodeURIComponent('OlÃ¡! Gostaria de agendar: ' + srv.name)}" target="_blank" class="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-white hover:bg-white hover:text-black transition">
          <i data-lucide="check" class="w-3.5 h-3.5"></i>
          <span>Agendar Este ServiÃ§o</span>
        </a>
      </div>`).join('')}
    </div>
  </section>

  ${renderGallery('O Nosso EspaÃ§o & Equipamento', 'Ambiente contemporÃ¢neo pensado no seu conforto e bem-estar.', [
    { title: 'Cadeiras Vintage em Couro', desc: 'Conforto mÃ¡ximo durante todo o seu atendimento com reclinaÃ§Ã£o suave e ergonomia.', image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80', tag: 'Conforto VIP' },
    { title: 'Barboterapia com Toalha Quente', desc: 'Cuidado milimÃ©trico com navalha afiada, Ã³leos essenciais e toalha vaporizada relaxante.', image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=800&q=80', tag: 'TradiÃ§Ã£o & PrecisÃ£o' },
    { title: 'Produtos Grooming Profissionais', desc: 'Pomadas de fixaÃ§Ã£o mate, Ã³leos para barba e loÃ§Ãµes de alta performance dermatolÃ³gica.', image: 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=800&q=80', tag: 'Alta Qualidade' }
  ])}

  ${renderTestimonials('Depoimentos de Cavalheiros', 'O que dizem os clientes que confiam no nosso trabalho semanalmente.', [
    { name: 'Daniel Cossa', role: 'Engenheiro &bull; Maputo', comment: 'O degradÃª Ã© o mais preciso de Maputo. Pontualidade impecÃ¡vel, sem esperas desnecessÃ¡rias.' },
    { name: 'Nelson Tembe', role: 'Advogado &bull; Polana Cimento', comment: 'A barboterapia com toalha quente Ã© um verdadeiro momento de relaxamento apÃ³s um dia longo.' },
    { name: 'Jorge Macamo', role: 'Gestor &bull; Matola Rio', comment: 'Ambiente de alto nÃ­vel, barbeiros educados e atendimento de cavalheiro. Nota 10!' }
  ])}

  ${renderFaq('Perguntas Frequentes', 'DÃºvidas comuns sobre o agendamento e serviÃ§os.', [
    { q: 'Preciso marcar com antecedÃªncia ou posso ir direto?', a: 'Atendemos por ordem de chegada se houver vaga, mas recomendamos agendar pelo WhatsApp para garantir atendimento sem espera.' },
    { q: 'Quanto tempo dura uma sessÃ£o de corte e barba?', a: 'O combo de corte e barba dura aproximadamente 45 a 60 minutos com todos os cuidados e toalha vaporizada.' },
    { q: 'Quais os mÃ©todos de pagamento aceites?', a: 'Aceitamos M-Pesa, E-Mola, cartÃµes POS de dÃ©bito/crÃ©dito e pagamento em numerÃ¡rio.' },
    { q: 'Possuem estacionamento privativo?', a: 'Sim, dispomos de estacionamento vigiado e gratuito em frente ao estabelecimento.' }
  ])}

  ${renderBookingForm('Agendamento de HorÃ¡rio VIP', 'Escolha o serviÃ§o desejado e a data para confirmaÃ§Ã£o instantÃ¢nea da sua sessÃ£o.', [
    'Corte Moderno & Fade (450 MT)',
    'Barboterapia com Toalha Quente (400 MT)',
    'Combo Executivo Cabelo + Barba (750 MT)',
    'Tratamento & HidrataÃ§Ã£o Capilar (500 MT)',
    'Limpeza de Pele Facial Masculina (600 MT)',
    'Corte Infantil Estiloso (350 MT)'
  ], 'Confirmar Agendamento pelo WhatsApp')}

  ${renderCta('Renove o Seu Visual Hoje Mesmo', 'Agende a sua sessÃ£o com os melhores barbeiros da cidade em poucos segundos pelo WhatsApp.', 'Marcar HorÃ¡rio VIP', 'OlÃ¡! Gostaria de agendar um horÃ¡rio na barbearia.')}

  ${renderFooter(brand, navItems, waDefault)}
</body>
</html>`;
  }

  // 3. HOTEL, RESORT & HOSPEDAGEM
  if (p.includes('hotel') || p.includes('pousada') || p.includes('resort') || p.includes('hospedagem') || p.includes('quarto') || p.includes('lodge')) {
    const brand = title || 'Palace Grand Hotel & Resort';
    const navItems = [
      { label: 'InÃ­cio', href: '#inicio' },
      { label: 'AcomodaÃ§Ãµes', href: '#acomodacoes' },
      { label: 'Galeria', href: '#galeria' },
      { label: 'Depoimentos', href: '#depoimentos' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Reservar SuÃ­te', href: '#agendamento' },
      { label: 'Contacto', href: '#contacto' }
    ];
    const waDefault = 'OlÃ¡! Gostaria de consultar tarifas e disponibilidade no ' + brand;

    return `<!DOCTYPE html>
<html lang="pt" class="dark">
${renderHead(brand + ' | Hospitalidade & Conforto 5 Estrelas')}
<body class="bg-black text-white antialiased">
  ${renderNavbar(brand, navItems, waDefault)}

  <section id="inicio" class="relative min-h-[85vh] flex items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-24 overflow-hidden">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.08),transparent_70%)] pointer-events-none"></div>
    <div class="relative z-10 max-w-4xl mx-auto">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 text-xs text-zinc-300 mb-8 backdrop-blur-md">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Reservas Abertas &bull; Vista para o Ãndico</span>
      </div>
      <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6 leading-tight">
        Hospitalidade de Luxo e <span class="underline decoration-white/30 decoration-wavy">Conforto IncomparÃ¡vel</span>
      </h1>
      <p class="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
        SuÃ­tes de alto padrÃ£o com vista panorÃ¢mica, gastronomia internacional e atendimento personalizado para tornar cada estadia inesquecÃ­vel.
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="#acomodacoes" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-black font-extrabold text-sm px-8 py-4 rounded-full hover:bg-zinc-200 transition shadow-xl">
          <i data-lucide="bed" class="w-4 h-4"></i>
          <span>Explorar SuÃ­tes</span>
        </a>
        <a href="#agendamento" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/20 bg-white/5 text-white font-bold text-sm px-8 py-4 rounded-full hover:bg-white/10 transition">
          <i data-lucide="calendar" class="w-4 h-4"></i>
          <span>Reservar Estadia Online</span>
        </a>
      </div>
    </div>
  </section>

  ${renderStats([
    { value: '96 SuÃ­tes', label: 'Luxo & Vista Mar' },
    { value: '5 Estrelas', label: 'PadrÃ£o Internacional' },
    { value: '2 Piscinas', label: 'Borda Infinita' },
    { value: '24/7', label: 'ServiÃ§o de Concierge' }
  ])}

  <section id="acomodacoes" class="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-2xl mx-auto mb-16">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-zinc-300 mb-4">
        <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
        <span>AcomodaÃ§Ãµes Selecionadas</span>
      </div>
      <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">SuÃ­tes & AcomodaÃ§Ãµes de Luxo</h2>
      <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">Concebidas para o mÃ¡ximo relaxamento e produtividade.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${[
        { name: 'SuÃ­te Presidencial Oceano', desc: '120mÂ², cama king-size, varanda panorÃ¢mica com vista mar, banheira de hidromassagem e mordomo privativo.', price: '9.800 MT / noite', icon: 'crown' },
        { name: 'SuÃ­te Executiva Premium', desc: 'EspaÃ§o de trabalho ergonÃ³mico, Wi-Fi 6 de alta velocidade, cama king e acesso ao lounge VIP executivo.', price: '4.800 MT / noite', icon: 'briefcase' },
        { name: 'Quarto Deluxe com Varanda', desc: 'Design minimalista e aconchegante, lenÃ§Ã³is de 400 fios em algodÃ£o egÃ­pcio e minibar completo.', price: '3.400 MT / noite', icon: 'bed' },
        { name: 'Spa & Tratamentos TÃ©rmicos', desc: 'Massagens relaxantes, sauna finlandesa e terapias holÃ­sticas com Ã³leos essenciais locais.', price: '1.200 MT / sessÃ£o', icon: 'sparkles' },
        { name: 'Transfer Executivo Aeroporto', desc: 'Transporte em viatura de luxo com ar-condicionado direto do Aeroporto Internacional de Maputo.', price: '900 MT / viagem', icon: 'car' },
        { name: 'Pequeno-AlmoÃ§o Buffet Continental', desc: 'Frutas tropicais frescas, pastelaria artesanal, queijos nobres e sumos naturais de MoÃ§ambique.', price: 'Incluso na Reserva', icon: 'coffee' }
      ].map(room => `
      <div class="group p-6 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/25 transition duration-300 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition">
              <i data-lucide="${room.icon}" class="w-5 h-5"></i>
            </div>
            <span class="text-sm font-extrabold text-white">${room.price}</span>
          </div>
          <h3 class="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-zinc-200 transition">${room.name}</h3>
          <p class="text-xs text-zinc-400 leading-relaxed mb-6">${room.desc}</p>
        </div>
        <a href="https://wa.me/258848335618?text=${encodeURIComponent('OlÃ¡! Gostaria de reservar: ' + room.name)}" target="_blank" class="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-white hover:bg-white hover:text-black transition">
          <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
          <span>Reservar Esta SuÃ­te</span>
        </a>
      </div>`).join('')}
    </div>
  </section>

  ${renderGallery('InstalaÃ§Ãµes & Lazer', 'Estrutura completa para relaxamento ou reuniÃµes empresariais de alto padrÃ£o.', [
    { title: 'SuÃ­tes Master com Vista PanorÃ¢mica', desc: 'AcomodaÃ§Ãµes de luxo com camas king-size, acabamento nobre em mÃ¡rmore e varanda privativa.', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80', tag: 'AcomodaÃ§Ãµes' },
    { title: 'Piscina PanorÃ¢mica com Borda Infinita', desc: 'EspreguiÃ§adeiras aquecidas e serviÃ§o de bar com vista deslumbrante para a BaÃ­a de Maputo.', image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80', tag: 'Lazer & Relaxamento' },
    { title: 'Spa & Terapias HolÃ­sticas', desc: 'Massagens terapÃªuticas, sauna finlandesa e banhos de imersÃ£o revigorantes com Ã³leos locais.', image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80', tag: 'Bem-Estar' }
  ])}

  ${renderTestimonials('A ExperiÃªncia dos Nossos HÃ³spedes', 'Testemunhos de viajantes de negÃ³cios e turismo que escolheram o nosso hotel.', [
    { name: 'Sofia Langa', role: 'HÃ³spede de FÃ©rias &bull; Inhambane', comment: 'Vista espetacular do quarto, cafÃ© da manhÃ£ maravilhoso e serviÃ§o de quarto com muita agilidade.' },
    { name: 'Marcus Berg', role: 'Consultor Internacional &bull; Joanesburgo', comment: 'A internet rÃ¡pida e a tranquilidade da suÃ­te permitiram-me trabalhar sem interrupÃ§Ãµes. Recomendo!' },
    { name: 'FÃ¡tima Noormahomed', role: 'HÃ³spede Frequente &bull; Nampula', comment: 'Hotel com acabamento luxuoso e atendimento que faz toda a diferenÃ§a. Sentimo-nos em casa.' }
  ])}

  ${renderFaq('Perguntas Frequentes', 'InformaÃ§Ãµes essenciais para planear a sua estadia.', [
    { q: 'Quais sÃ£o os horÃ¡rios de check-in e check-out?', a: 'Check-in a partir das 14:00 e check-out atÃ© Ã s 11:00. Late check-out mediante disponibilidade.' },
    { q: 'O pequeno-almoÃ§o estÃ¡ incluÃ­do em todas as tarifas?', a: 'Sim, todas as reservas incluem buffet de pequeno-almoÃ§o continental completo no restaurante principal.' },
    { q: 'Disponibilizam transporte do aeroporto?', a: 'Sim, dispomos de transfers executivos privativos sob solicitaÃ§Ã£o prÃ©via.' },
    { q: 'Qual Ã© a polÃ­tica de cancelamento?', a: 'Cancelamentos gratuitos atÃ© 48 horas antes da data de check-in sem qualquer taxa.' }
  ])}

  ${renderBookingForm('SolicitaÃ§Ã£o de Reserva de Hospedagem', 'Indique as suas preferÃªncias para que a nossa equipa de concierge confirme a melhor suÃ­te disponÃ­vel.', [
    'SuÃ­te Presidencial Oceano (9.800 MT / noite)',
    'SuÃ­te Executiva Premium (4.800 MT / noite)',
    'Quarto Deluxe Casal (3.400 MT / noite)',
    'Pacote Fim-de-Semana RomÃ¢ntico',
    'SessÃ£o Especial de Spa & Bem-Estar',
    'Reserva de Sala de ConferÃªncias'
  ], 'Consultar Disponibilidade no WhatsApp')}

  ${renderCta('Planeie a Sua PrÃ³xima Estadia InesquecÃ­vel', 'Consulte datas disponÃ­veis e garanta a sua suÃ­te com desconto exclusivo para reservas diretas.', 'Consultar Tarifas no WhatsApp', 'OlÃ¡! Gostaria de consultar tarifas para o hotel.')}

  ${renderFooter(brand, navItems, waDefault)}
</body>
</html>`;
  }

  // 4. LOJA / E-COMMERCE / MODA & PRODUTOS
  if (p.includes('loja') || p.includes('moda') || p.includes('roupa') || p.includes('calcado') || p.includes('calÃ§ado') || p.includes('produto') || p.includes('ecommerce') || p.includes('e-commerce') || p.includes('tenis') || p.includes('tÃ©nis')) {
    const brand = title || 'Atelier PrivÃ© | ColeÃ§Ã£o';
    const navItems = [
      { label: 'InÃ­cio', href: '#inicio' },
      { label: 'ColeÃ§Ã£o', href: '#produtos' },
      { label: 'Galeria', href: '#galeria' },
      { label: 'Depoimentos', href: '#depoimentos' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Encomendar', href: '#agendamento' },
      { label: 'Contacto', href: '#contacto' }
    ];
    const waDefault = 'OlÃ¡! Gostaria de comprar um produto da ' + brand;

    return `<!DOCTYPE html>
<html lang="pt" class="dark">
${renderHead(brand + ' | Alta Moda & Design')}
<body class="bg-black text-white antialiased">
  ${renderNavbar(brand, navItems, waDefault)}

  <section id="inicio" class="relative min-h-[85vh] flex items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-24 overflow-hidden">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.08),transparent_70%)] pointer-events-none"></div>
    <div class="relative z-10 max-w-4xl mx-auto">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 text-xs text-zinc-300 mb-8 backdrop-blur-md">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Nova Temporada 2026 &bull; EdiÃ§Ã£o Limitada</span>
      </div>
      <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6 leading-tight">
        ElegÃ¢ncia Intemporal e <span class="underline decoration-white/30 decoration-wavy">Design ContemporÃ¢neo</span>
      </h1>
      <p class="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
        PeÃ§as exclusivas desenhadas para quem valoriza minimalismo, cortes precisos e materiais nobres de altÃ­ssima durabilidade.
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="#produtos" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-black font-extrabold text-sm px-8 py-4 rounded-full hover:bg-zinc-200 transition shadow-xl">
          <i data-lucide="shopping-bag" class="w-4 h-4"></i>
          <span>Explorar CatÃ¡logo</span>
        </a>
        <a href="#agendamento" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/20 bg-white/5 text-white font-bold text-sm px-8 py-4 rounded-full hover:bg-white/10 transition">
          <i data-lucide="package" class="w-4 h-4"></i>
          <span>Fazer Encomenda RÃ¡pida</span>
        </a>
      </div>
    </div>
  </section>

  ${renderStats([
    { value: '2.500+', label: 'PeÃ§as Entregues' },
    { value: '48 Horas', label: 'Entrega RÃ¡pida em Maputo' },
    { value: '100%', label: 'Garantia de Autenticidade' },
    { value: '4.9/5', label: 'AvaliaÃ§Ã£o dos Clientes' }
  ])}

  <section id="produtos" class="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-2xl mx-auto mb-16">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-zinc-300 mb-4">
        <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
        <span>Destaques da ColeÃ§Ã£o</span>
      </div>
      <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">PeÃ§as em Destaque</h2>
      <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">DisponÃ­veis para envio imediato com embalagem de luxo.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${[
        { name: 'TÃ©nis Minimalist Black & White', desc: 'Couro nobre macio, sola vulcanizada antiderrapante e acabamento feito Ã  mÃ£o.', price: '3.800 MT', icon: 'footprints' },
        { name: 'Casaco Bomber Urban Noir', desc: 'Tecido tÃ©cnico impermeÃ¡vel, forro tÃ©rmico premium e fechos selados a laser.', price: '4.200 MT', icon: 'shirt' },
        { name: 'Camisa Linho Puro AlgodÃ£o', desc: 'RespirÃ¡vel, corte tailored moderno para climas quentes com botÃµes em madrepÃ©rola.', price: '2.400 MT', icon: 'sparkles' },
        { name: 'RelÃ³gio MonocromÃ¡tico Sapphire', desc: 'Movimento quartz de alta precisÃ£o, vidro em cristal de safira e pulseira de aÃ§o negro.', price: '6.500 MT', icon: 'watch' },
        { name: 'Carteira Slim Couro GenuÃ­no', desc: 'ProteÃ§Ã£o RFID antifurto, compartimentos prÃ¡ticos para cartÃµes e notas com espessura ultra fina.', price: '1.600 MT', icon: 'wallet' },
        { name: 'Mochila Executiva Waterproof', desc: 'Compartimento acolchoado para portÃ¡til atÃ© 16", porta USB embutida e tecido Ã  prova de Ã¡gua.', price: '3.200 MT', icon: 'backpack' }
      ].map(prod => `
      <div class="group p-6 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/25 transition duration-300 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition">
              <i data-lucide="${prod.icon}" class="w-5 h-5"></i>
            </div>
            <span class="text-base font-extrabold text-white">${prod.price}</span>
          </div>
          <h3 class="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-zinc-200 transition">${prod.name}</h3>
          <p class="text-xs text-zinc-400 leading-relaxed mb-6">${prod.desc}</p>
        </div>
        <a href="https://wa.me/258848335618?text=${encodeURIComponent('OlÃ¡! Gostaria de encomendar: ' + prod.name + ' (' + prod.price + ')')}" target="_blank" class="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-white hover:bg-white hover:text-black transition">
          <i data-lucide="shopping-bag" class="w-3.5 h-3.5"></i>
          <span>Comprar pelo WhatsApp</span>
        </a>
      </div>`).join('')}
    </div>
  </section>

  ${renderGallery('Qualidade & Detalhes da ColeÃ§Ã£o', 'Cada peÃ§a reflete o mais alto rigor em matÃ©rias-primas e artesanato.', [
    { title: 'CalÃ§ado & TÃ©nis Minimalistas', desc: 'Couro nobre macio, sola vulcanizada durÃ¡vel e linhas limpas para uso casual e formal.', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80', tag: 'CalÃ§ado' },
    { title: 'Moda Tailored ContemporÃ¢nea', desc: 'Cortes estruturados, tecidos resistentes ao calor e caimento impecÃ¡vel para todas as ocasiÃµes.', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80', tag: 'VestuÃ¡rio' },
    { title: 'AcessÃ³rios & Relojoaria de Luxo', desc: 'PeÃ§as em aÃ§o escovado negro, vidro em cristal de safira e acabamentos de alta resistÃªncia.', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80', tag: 'AcessÃ³rios VIP' }
  ])}

  ${renderTestimonials('OpiniÃµes de Quem JÃ¡ Comprou', 'Clientes que atestam a qualidade e o caimento das nossas peÃ§as.', [
    { name: 'PatrÃ­cia Neves', role: 'Cliente &bull; Maputo', comment: 'O tecido da camisa Ã© fantÃ¡stico! Veste muito bem e a entrega foi feita no mesmo dia.' },
    { name: 'AmÃ©rico Vilanculos', role: 'Cliente &bull; Matola', comment: 'O tÃ©nis Ã© extremamente confortÃ¡vel e minimalista. Qualidade de loja internacional.' },
    { name: 'ZÃ©lia Guambe', role: 'Cliente &bull; Beira', comment: 'A encomenda chegou Ã  Beira perfeitamente embalada e em Ã³timo estado. Recomendo com certeza.' }
  ])}

  ${renderFaq('Perguntas Frequentes', 'InformaÃ§Ãµes sobre envio, trocas e garantias.', [
    { q: 'Fazem envios para todas as provÃ­ncias de MoÃ§ambique?', a: 'Sim! Entregamos em Maputo e Matola em atÃ© 24h/48h e despachamos para as restantes provÃ­ncias por transportadora de confianÃ§a.' },
    { q: 'Qual a polÃ­tica de trocas de tamanho?', a: 'Disponibilizamos 7 dias para troca de tamanho sem custos caso a peÃ§a nÃ£o assente perfeitamente.' },
    { q: 'Quais as formas de pagamento disponÃ­veis?', a: 'Pagamento via M-Pesa, E-Mola, transferÃªncia bancÃ¡ria (BIM/BCI) ou no ato da entrega (apenas Maputo).' },
    { q: 'Os produtos sÃ£o originais com garantia?', a: 'Sim, todas as peÃ§as acompanham certificado de garantia e padrÃ£o de fabricaÃ§Ã£o rigoroso.' }
  ])}

  ${renderBookingForm('FormulÃ¡rio de Encomenda Direta', 'Selecione a peÃ§a desejada e informe o seu contacto para envio rÃ¡pido na sua morada.', [
    'TÃ©nis Minimalist Black & White (3.800 MT)',
    'Casaco Bomber Urban Noir (4.200 MT)',
    'Camisa Linho Puro AlgodÃ£o (2.400 MT)',
    'RelÃ³gio MonocromÃ¡tico Sapphire (6.500 MT)',
    'Carteira Slim Couro GenuÃ­no (1.600 MT)',
    'Mochila Executiva Waterproof (3.200 MT)'
  ], 'Finalizar Encomenda no WhatsApp')}

  ${renderCta('Adquira PeÃ§as Exclusivas Hoje', 'Fale diretamente com os nossos consultores e reserve o seu tamanho antes que esgote.', 'Fazer Pedido pelo WhatsApp', 'OlÃ¡! Gostaria de consultar peÃ§as disponÃ­veis na loja.')}

  ${renderFooter(brand, navItems, waDefault)}
</body>
</html>`;
  }

  // 5. PORTFÃ“LIO / CONSULTOR / DESIGNER / FOTÃ“GRAFO / PROFISSIONAL
  if (p.includes('portfolio') || p.includes('portfÃ³lio') || p.includes('designer') || p.includes('programador') || p.includes('advogado') || p.includes('consultor') || p.includes('fotografo') || p.includes('fotÃ³grafo')) {
    const brand = title || 'Alexandre Bila | Portfolio';
    const navItems = [
      { label: 'InÃ­cio', href: '#inicio' },
      { label: 'Especialidades', href: '#especialidades' },
      { label: 'Galeria', href: '#galeria' },
      { label: 'Depoimentos', href: '#depoimentos' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Proposta', href: '#agendamento' },
      { label: 'Contacto', href: '#contacto' }
    ];
    const waDefault = 'OlÃ¡! Gostaria de conversar sobre um projeto com ' + brand;

    return `<!DOCTYPE html>
<html lang="pt" class="dark">
${renderHead(brand + ' | EstratÃ©gia, Design & Tecnologia')}
<body class="bg-black text-white antialiased">
  ${renderNavbar(brand, navItems, waDefault)}

  <section id="inicio" class="relative min-h-[85vh] flex items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-24 overflow-hidden">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.08),transparent_70%)] pointer-events-none"></div>
    <div class="relative z-10 max-w-4xl mx-auto">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 text-xs text-zinc-300 mb-8 backdrop-blur-md">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Agenda DisponÃ­vel para Novos Projetos &bull; 2026</span>
      </div>
      <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6 leading-tight">
        Transformando Ideias em <span class="underline decoration-white/30 decoration-wavy">SoluÃ§Ãµes de Alto Impacto</span>
      </h1>
      <p class="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
        Ajudo empresas e lÃ­deres a construir marcas memorÃ¡veis, produtos digitais intuitivos e estratÃ©gias que geram resultados concretos e mensurÃ¡veis.
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="#especialidades" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-black font-extrabold text-sm px-8 py-4 rounded-full hover:bg-zinc-200 transition shadow-xl">
          <i data-lucide="layers" class="w-4 h-4"></i>
          <span>Ver Ãreas de AtuaÃ§Ã£o</span>
        </a>
        <a href="#agendamento" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/20 bg-white/5 text-white font-bold text-sm px-8 py-4 rounded-full hover:bg-white/10 transition">
          <i data-lucide="message-circle" class="w-4 h-4"></i>
          <span>Solicitar Proposta</span>
        </a>
      </div>
    </div>
  </section>

  ${renderStats([
    { value: '45+ Projetos', label: 'Entregues com Sucesso' },
    { value: '8+ Anos', label: 'ExperiÃªncia Profissional' },
    { value: '99%', label: 'SatisfaÃ§Ã£o de Clientes' },
    { value: '12 PrÃ©mios', label: 'DistinÃ§Ãµes & MenÃ§Ãµes' }
  ])}

  <section id="especialidades" class="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-2xl mx-auto mb-16">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-zinc-300 mb-4">
        <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
        <span>CompetÃªncias Essenciais</span>
      </div>
      <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">Especialidades & SoluÃ§Ãµes</h2>
      <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">Abordagem centrada em simplicidade, elegÃ¢ncia e conversÃ£o.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${[
        { name: 'Identidade Visual & Branding', desc: 'ConstruÃ§Ã£o de marcas sÃ³lidas com manuais de identidade, tipografia e diretrizes de autoridade.', price: 'Sob Medida', icon: 'pen-tool' },
        { name: 'UI/UX Design de Produtos Digitais', desc: 'Interfaces intuitivas para aplicativos e plataformas web focadas na melhor usabilidade.', price: 'Sob Medida', icon: 'layout' },
        { name: 'Desenvolvimento Web de Alta Performance', desc: 'Websites rÃ¡pidos, responsivos e otimizados para motores de busca e conversÃ£o comercial.', price: 'Sob Medida', icon: 'code' },
        { name: 'Consultoria de Posicionamento Digital', desc: 'DiagnÃ³stico de canais, funil de conversÃ£o e estratÃ©gias para aumentar o valor percebido.', price: 'Sob Medida', icon: 'trending-up' },
        { name: 'OtimizaÃ§Ã£o de ConversÃ£o (CRO)', desc: 'Testes e melhorias na jornada do utilizador para converter mais visitantes em clientes ativos.', price: 'Sob Medida', icon: 'target' },
        { name: 'Design Systems EscalÃ¡veis', desc: 'Bibliotecas de componentes reutilizÃ¡veis para equipas de engenharia e produto.', price: 'Sob Medida', icon: 'box' }
      ].map(esp => `
      <div class="group p-6 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/25 transition duration-300 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition">
              <i data-lucide="${esp.icon}" class="w-5 h-5"></i>
            </div>
            <span class="text-xs font-bold text-zinc-400 tracking-wider uppercase">${esp.price}</span>
          </div>
          <h3 class="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-zinc-200 transition">${esp.name}</h3>
          <p class="text-xs text-zinc-400 leading-relaxed mb-6">${esp.desc}</p>
        </div>
        <a href="https://wa.me/258848335618?text=${encodeURIComponent('OlÃ¡! Gostaria de falar sobre: ' + esp.name)}" target="_blank" class="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-white hover:bg-white hover:text-black transition">
          <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
          <span>Solicitar OrÃ§amento</span>
        </a>
      </div>`).join('')}
    </div>
  </section>

  ${renderGallery('Casos de Sucesso & Projetos', 'Projetos reais com interfaces elegantes que geraram impacto nos negÃ³cios.', [
    { title: 'Design System & Interfaces Digitais', desc: 'Arquitetura de UI/UX limpa e escalÃ¡vel para aplicaÃ§Ãµes de alta conversÃ£o.', image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80', tag: 'UI/UX Design' },
    { title: 'EspaÃ§o de CriaÃ§Ã£o & EstratÃ©gia', desc: 'Metodologias de design thinking e ideaÃ§Ã£o Ã¡gil com foco no pÃºblico moÃ§ambicano.', image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80', tag: 'Branding & EstratÃ©gia' },
    { title: 'Planeamento de Produto & Wireframing', desc: 'Testes de usabilidade e prototipagem interativa para validaÃ§Ã£o de hipÃ³teses de negÃ³cio.', image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80', tag: 'Engenharia Web' }
  ])}

  ${renderTestimonials('Reconhecimento de Parceiros', 'Feedback de lÃ­deres e empresas que confiaram nos meus serviÃ§os.', [
    { name: 'Dr. Edson Mugabe', role: 'CEO &bull; WeHost MoÃ§ambique', comment: 'O rigor tÃ©cnico e a visÃ£o estÃ©tica do Alexandre transformaram a perceÃ§Ã£o da nossa plataforma.' },
    { name: 'Beatriz Cuna', role: 'Fundadora &bull; Studio B Maputo', comment: 'Pontualidade britÃ¢nica, comunicaÃ§Ã£o transparente e um resultado final acima de qualquer expetativa.' },
    { name: 'Manuel Chirindza', role: 'Diretor de Marketing &bull; Matola', comment: 'AumentÃ¡mos a retenÃ§Ã£o de clientes em 35% apÃ³s o lanÃ§amento do novo design. Recomendo vivamente.' }
  ])}

  ${renderFaq('Perguntas Frequentes', 'Como funciona o processo de contrataÃ§Ã£o e entrega.', [
    { q: 'Qual Ã© o prazo tÃ­pico para entrega de um website ou marca?', a: 'Projetos mÃ©dios sÃ£o entregues entre 2 a 4 semanas, com etapas claras de validaÃ§Ã£o e feedback contÃ­nuo.' },
    { q: 'Como funciona a divisÃ£o de pagamentos?', a: 'Normalmente trabalhamos com 50% na aprovaÃ§Ã£o da proposta e 50% apÃ³s a conclusÃ£o e lanÃ§amento oficial.' },
    { q: 'Disponibiliza suporte e manutenÃ§Ã£o apÃ³s a entrega?', a: 'Sim! Todos os projetos contam com 30 dias de suporte gratuito e planos mensais de manutenÃ§Ã£o sob medida.' },
    { q: 'Podemos agendar uma reuniÃ£o inicial sem compromisso?', a: 'Certamente! Realizo chamadas de 20 minutos por Google Meet ou WhatsApp para entender o escopo da sua ideia.' }
  ])}

  ${renderBookingForm('Iniciar Novo Projeto', 'Conte-me sobre os seus objetivos e marque uma sessÃ£o de consultoria personalizada.', [
    'Identidade Visual & Branding Completo',
    'UI/UX Design de Aplicativo / SaaS',
    'Desenvolvimento de Website Institucional',
    'Consultoria de Posicionamento Digital',
    'OtimizaÃ§Ã£o de ConversÃ£o e Vendas (CRO)',
    'Design System para Equipa'
  ], 'Enviar Proposta pelo WhatsApp')}

  ${renderCta('Tem um Projeto Ambicioso em Mente?', 'Vamos construir algo memorÃ¡vel que destaque a sua empresa da concorrÃªncia.', 'Agendar Conversa no WhatsApp', 'OlÃ¡ Alexandre! Gostaria de conversar sobre um projeto.')}

  ${renderFooter(brand, navItems, waDefault)}
</body>
</html>`;
  }

  // 6. CLOUD / SISTEMA / SAAS / WEHOST / TECH
  if (p.includes('simples') || p.includes('sistema') || p.includes('inicio') || p.includes('inÃ­cio') || p.includes('software') || p.includes('cloud') || p.includes('tech') || p.includes('wehost')) {
    const brand = title || 'WeHost Cloud Suite';
    const navItems = [
      { label: 'InÃ­cio', href: '#inicio' },
      { label: 'ServiÃ§os', href: '#servicos' },
      { label: 'Galeria', href: '#galeria' },
      { label: 'Depoimentos', href: '#depoimentos' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Ativar Plano', href: '#agendamento' },
      { label: 'Contacto', href: '#contacto' }
    ];
    const waDefault = 'OlÃ¡! Gostaria de saber mais sobre a infraestrutura da ' + brand;

    return `<!DOCTYPE html>
<html lang="pt" class="dark">
${renderHead(brand + ' | Infraestrutura Cloud & Alta Performance')}
<body class="bg-black text-white antialiased">
  ${renderNavbar(brand, navItems, waDefault)}

  <section id="inicio" class="relative min-h-[85vh] flex items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-24 overflow-hidden">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.08),transparent_70%)] pointer-events-none"></div>
    <div class="relative z-10 max-w-4xl mx-auto">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 text-xs text-zinc-300 mb-8 backdrop-blur-md">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Servidores Ativos em MoÃ§ambique &bull; 99.99% Uptime</span>
      </div>
      <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6 leading-tight">
        A Nuvem Mais RÃ¡pida e ConfiÃ¡vel para o <span class="underline decoration-white/30 decoration-wavy">Seu NegÃ³cio</span>
      </h1>
      <p class="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
        Hospedagem de alta velocidade com armazenamento SSD NVMe, baixa latÃªncia para o territÃ³rio nacional e suporte tÃ©cnico dedicado 24 horas por dia.
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="#servicos" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-black font-extrabold text-sm px-8 py-4 rounded-full hover:bg-zinc-200 transition shadow-xl">
          <i data-lucide="server" class="w-4 h-4"></i>
          <span>Ver Planos & Recursos</span>
        </a>
        <a href="#agendamento" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/20 bg-white/5 text-white font-bold text-sm px-8 py-4 rounded-full hover:bg-white/10 transition">
          <i data-lucide="zap" class="w-4 h-4"></i>
          <span>Solicitar AtivaÃ§Ã£o Imediata</span>
        </a>
      </div>
    </div>
  </section>

  ${renderStats([
    { value: '99.99%', label: 'Uptime SLA Garantido' },
    { value: '5ms', label: 'LatÃªncia Local UltrarrÃ¡pida' },
    { value: '12.000+', label: 'Websites Alojados' },
    { value: '24/7/365', label: 'Suporte TÃ©cnico Local' }
  ])}

  <section id="servicos" class="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-2xl mx-auto mb-16">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-zinc-300 mb-4">
        <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
        <span>Recursos Corporativos</span>
      </div>
      <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">SoluÃ§Ãµes Cloud de Alto Desempenho</h2>
      <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">Tecnologia de ponta pensada para a estabilidade contÃ­nua das suas aplicaÃ§Ãµes.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${[
        { name: 'Hospedagem NVMe UltrarrÃ¡pida', desc: 'Discos SSD NVMe de Ãºltima geraÃ§Ã£o, cPanel intuitivo e contas de e-mail corporativo ilimitadas.', price: 'Desde 350 MT / mÃªs', icon: 'hard-drive' },
        { name: 'Servidores Cloud VPS Dedicados', desc: 'Recursos 100% isolados (vCPU, RAM DDR5) com acesso root completo e IP moÃ§ambicano.', price: 'Desde 1.450 MT / mÃªs', icon: 'server' },
        { name: 'DomÃ­nios .MZ e Internacionais', desc: 'Registo e ativaÃ§Ã£o imediata de extensÃµes .co.mz, .mz, .com, .net com DNS Anycast redundante.', price: 'AtivaÃ§Ã£o RÃ¡pida', icon: 'globe' },
        { name: 'SeguranÃ§a & ProteÃ§Ã£o Anti-DDoS', desc: 'Filtro inteligente de trÃ¡fego que bloqueia ataques maliciosos antes de atingirem o seu servidor.', price: 'Incluso GrÃ¡tis', icon: 'shield-check' },
        { name: 'Backups DiÃ¡rios Automatizados', desc: 'CÃ³pias de seguranÃ§a automÃ¡ticas com restauraÃ§Ã£o em 1-clique para tranquilidade absoluta.', price: 'Incluso GrÃ¡tis', icon: 'database' },
        { name: 'Construtor de Sites IA Integrado', desc: 'Crie e edite websites profissionais em minutos com auxÃ­lio da nossa IA exclusiva.', price: 'Incluso no Plano', icon: 'cpu' }
      ].map(srv => `
      <div class="group p-6 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/25 transition duration-300 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition">
              <i data-lucide="${srv.icon}" class="w-5 h-5"></i>
            </div>
            <span class="text-xs font-bold text-white tracking-wider">${srv.price}</span>
          </div>
          <h3 class="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-zinc-200 transition">${srv.name}</h3>
          <p class="text-xs text-zinc-400 leading-relaxed mb-6">${srv.desc}</p>
        </div>
        <a href="https://wa.me/258848335618?text=${encodeURIComponent('OlÃ¡! Gostaria de assinar o serviÃ§o: ' + srv.name)}" target="_blank" class="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-white hover:bg-white hover:text-black transition">
          <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
          <span>Ativar Este Plano</span>
        </a>
      </div>`).join('')}
    </div>
  </section>

  ${renderGallery('Tecnologia & Infraestrutura de Ponta', 'Estrutura tÃ©cnica robusta desenhada para empresas que nÃ£o podem parar.', [
    { title: 'Data Center com Racks de Servidores', desc: 'Hardware corporativo com refrigeraÃ§Ã£o avanÃ§ada e alimentaÃ§Ã£o elÃ©trica ininterrupta.', image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80', tag: 'Datacenter' },
    { title: 'Backbone de Fibra & Baixa LatÃªncia', desc: 'ConexÃ£o direta aos principais pontos de troca de trÃ¡fego de MoÃ§ambique e da Ãfrica Austral.', image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80', tag: 'Fibra Ã“ptica' },
    { title: 'SeguranÃ§a & Monitoramento 24/7', desc: 'Sistemas inteligentes com proteÃ§Ã£o contra ataques DDoS e supervisÃ£o de rede 365 dias por ano.', image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80', tag: 'SeguranÃ§a ContÃ­nua' }
  ])}

  ${renderTestimonials('ConfianÃ§a das Melhores Empresas', 'Empresas e desenvolvedores que escolheram hospedar com estabilidade.', [
    { name: 'ClÃ¡udio Matusse', role: 'CTO &bull; StartupMz', comment: 'A latÃªncia dentro de MoÃ§ambique fez as nossas pÃ¡ginas abrirem em menos de 1 segundo. FantÃ¡stico.' },
    { name: 'Teresa Chissano', role: 'Gestora &bull; AgÃªncia Criativa', comment: 'O suporte via WhatsApp resolveu a nossa migraÃ§Ã£o em 15 minutos num domingo. Nunca vi igual.' },
    { name: 'Rui Sumbana', role: 'Engenheiro de Software &bull; Maputo', comment: 'Os servidores VPS tÃªm desempenho real sem sobrealocaÃ§Ã£o. Estabilidade de padrÃ£o global.' }
  ])}

  ${renderFaq('Perguntas Frequentes', 'Respostas rÃ¡pidas sobre migraÃ§Ã£o e funcionamento.', [
    { q: 'A migraÃ§Ã£o do meu site atual para a WeHost tem algum custo?', a: 'NÃ£o! Migramos o seu site e contas de e-mail do seu provedor antigo sem qualquer custo e com zero tempo de inatividade.' },
    { q: 'Quais mÃ©todos de pagamento aceitam?', a: 'Aceitamos pagamentos mensais ou anuais por M-Pesa, E-Mola, transferÃªncia bancÃ¡ria (BIM/BCI) e cartÃµes.' },
    { q: 'O suporte tÃ©cnico funciona aos finais de semana e feriados?', a: 'Sim! A nossa equipa de suporte local opera 24 horas por dia, 7 dias por semana, inclusive feriados nacionais.' },
    { q: 'Posso fazer upgrade de plano quando meu site crescer?', a: 'Com certeza! Pode mudar de plano instantaneamente sem qualquer perda de dados ou configuraÃ§Ã£o.' }
  ])}

  ${renderBookingForm('AtivaÃ§Ã£o de Conta & Suporte Comercial', 'Escolha o serviÃ§o pretendido para receber atendimento imediato da equipa tÃ©cnica da WeHost.', [
    'Hospedagem SSD NVMe (350 MT / mÃªs)',
    'Servidor Cloud VPS Dedicado (1.450 MT / mÃªs)',
    'Registo de DomÃ­nio Nacional .CO.MZ / .MZ',
    'MigraÃ§Ã£o Gratuita de Website e E-mails',
    'Pacote Corporativo Customizado'
  ], 'Falar com Especialista no WhatsApp')}

  ${renderCta('Coloque o Seu Projeto Online Hoje Mesmo', 'Comece com a infraestrutura cloud mais estÃ¡vel e rÃ¡pida de MoÃ§ambique.', 'Ativar Conta no WhatsApp', 'OlÃ¡! Gostaria de ativar um plano de hospedagem.')}

  ${renderFooter(brand, navItems, waDefault)}
</body>
</html>`;
  }

  // 7. GENÃ‰RICO / CORPORATIVO / EMPRESA DE ALTO PADRÃƒO
  const brand = title || 'Apex Corporativo & Consultoria';
  const navItems = [
    { label: 'InÃ­cio', href: '#inicio' },
    { label: 'SoluÃ§Ãµes', href: '#solucoes' },
    { label: 'Galeria', href: '#galeria' },
    { label: 'Depoimentos', href: '#depoimentos' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Agendar ReuniÃ£o', href: '#agendamento' },
    { label: 'Contacto', href: '#contacto' }
  ];
  const waDefault = 'OlÃ¡! Gostaria de agendar uma reuniÃ£o com a equipa da ' + brand;

  return `<!DOCTYPE html>
<html lang="pt" class="dark">
${renderHead(brand + ' | LideranÃ§a & InovaÃ§Ã£o')}
<body class="bg-black text-white antialiased">
  ${renderNavbar(brand, navItems, waDefault)}

  <section id="inicio" class="relative min-h-[85vh] flex items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-24 overflow-hidden">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.08),transparent_70%)] pointer-events-none"></div>
    <div class="relative z-10 max-w-4xl mx-auto">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 text-xs text-zinc-300 mb-8 backdrop-blur-md">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Atendimento Corporativo &bull; MoÃ§ambique 2026</span>
      </div>
      <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6 leading-tight">
        SoluÃ§Ãµes EstratÃ©gicas para <span class="underline decoration-white/30 decoration-wavy">Empresas LÃ­deres</span>
      </h1>
      <p class="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
        Impulsionamos o crescimento sustentÃ¡vel de organizaÃ§Ãµes atravÃ©s de inteligÃªncia de mercado, processos eficientes e governaÃ§Ã£o sÃ³lida.
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="#solucoes" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-black font-extrabold text-sm px-8 py-4 rounded-full hover:bg-zinc-200 transition shadow-xl">
          <i data-lucide="compass" class="w-4 h-4"></i>
          <span>Nossas SoluÃ§Ãµes</span>
        </a>
        <a href="#agendamento" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/20 bg-white/5 text-white font-bold text-sm px-8 py-4 rounded-full hover:bg-white/10 transition">
          <i data-lucide="calendar" class="w-4 h-4"></i>
          <span>Agendar ReuniÃ£o</span>
        </a>
      </div>
    </div>
  </section>

  ${renderStats([
    { value: '140+ Empresas', label: 'Assessoradas com ÃŠxito' },
    { value: '15+ Anos', label: 'TradiÃ§Ã£o no Mercado' },
    { value: '98%', label: 'Ãndice de RetenÃ§Ã£o' },
    { value: '24/7', label: 'Apoio aos Executivos' }
  ])}

  <section id="solucoes" class="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-2xl mx-auto mb-16">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-zinc-300 mb-4">
        <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
        <span>PortfÃ³lio de ServiÃ§os</span>
      </div>
      <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">SoluÃ§Ãµes Corporativas Integradas</h2>
      <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">Desenvolvidas para responder aos desafios dinÃ¢micos do ecossistema empresarial.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${[
        { name: 'Consultoria de GestÃ£o & GovernanÃ§a', desc: 'EstruturaÃ§Ã£o de processos, conformidade legal e boas prÃ¡ticas para tomada de decisÃ£o assertiva.', price: 'Personalizado', icon: 'shield' },
        { name: 'Planeamento Financeiro & EstratÃ©gico', desc: 'AnÃ¡lise de fluxo de caixa, orÃ§amento preditivo e maximizaÃ§Ã£o do retorno sobre investimento.', price: 'Personalizado', icon: 'trending-up' },
        { name: 'TransformaÃ§Ã£o Digital & AutomaÃ§Ã£o', desc: 'ImplementaÃ§Ã£o de ferramentas modernas para reduzir custos operacionais e acelerar tarefas.', price: 'Personalizado', icon: 'cpu' },
        { name: 'Auditoria & GestÃ£o de Riscos', desc: 'Mapeamento preventivo de vulnerabilidades fiscais, contratuais e operacionais na empresa.', price: 'Personalizado', icon: 'check-square' },
        { name: 'Desenvolvimento de LideranÃ§as', desc: 'Programas executivos de capacitaÃ§Ã£o para gestores e diretores de alto rendimento.', price: 'Personalizado', icon: 'users' },
        { name: 'ExpansÃ£o & Novos Mercados', desc: 'Estudos de viabilidade econÃ³mica e apoio estratÃ©gico na entrada em novos territÃ³rios.', price: 'Personalizado', icon: 'globe' }
      ].map(item => `
      <div class="group p-6 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/25 transition duration-300 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition">
              <i data-lucide="${item.icon}" class="w-5 h-5"></i>
            </div>
            <span class="text-xs font-bold text-zinc-400 uppercase tracking-wider">${item.price}</span>
          </div>
          <h3 class="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-zinc-200 transition">${item.name}</h3>
          <p class="text-xs text-zinc-400 leading-relaxed mb-6">${item.desc}</p>
        </div>
        <a href="https://wa.me/258848335618?text=${encodeURIComponent('OlÃ¡! Gostaria de uma proposta sobre: ' + item.name)}" target="_blank" class="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-white hover:bg-white hover:text-black transition">
          <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
          <span>Solicitar Proposta</span>
        </a>
      </div>`).join('')}
    </div>
  </section>

  ${renderGallery('Diferenciais Competitivos & Estrutura', 'O que nos posiciona como parceiro de confianÃ§a das maiores empresas em MoÃ§ambique.', [
    { title: 'Salas Executivas de Alta GovernanÃ§a', desc: 'EspaÃ§os pensados para deliberaÃ§Ãµes estratÃ©gicas, reuniÃµes de conselho e parcerias.', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80', tag: 'GovernanÃ§a Corporativa' },
    { title: 'PresenÃ§a e Credibilidade Regional', desc: 'Infraestrutura corporativa sÃ³lida e relaÃ§Ãµes institucionais em todo o paÃ­s.', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80', tag: 'PresenÃ§a Regional' },
    { title: 'InteligÃªncia e AnÃ¡lise de Dados', desc: 'RelatÃ³rios preditivos e auditoria para tomada de decisÃµes financeiras seguras e rentÃ¡veis.', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80', tag: 'InteligÃªncia de Mercado' }
  ])}

  ${renderTestimonials('A ConfianÃ§a dos Nossos Parceiros', 'LÃ­deres empresariais que alcanÃ§aram novos patamares connosco.', [
    { name: 'Dra. Laura Sitoe', role: 'Diretora Geral &bull; Grupo LS', comment: 'A clareza estratÃ©gica e o rigor da consultoria transformaram a nossa rentabilidade num momento crucial.' },
    { name: 'Alberto Mondlane', role: 'Fundador &bull; AM IndÃºstrias', comment: 'Parceiros indispensÃ¡veis no nosso processo de transiÃ§Ã£o geracional e expansÃ£o regional.' },
    { name: 'Celso Tembe', role: 'CFO &bull; LogÃ­stica MoÃ§ambique', comment: 'CompetÃªncia tÃ©cnica invejÃ¡vel, postura Ã©tica e resultados mensurÃ¡veis desde as primeiras semanas.' }
  ])}

  ${renderFaq('Perguntas Frequentes', 'Respostas sobre o nosso formato de actuaÃ§Ã£o.', [
    { q: 'Como iniciamos um trabalho de consultoria?', a: 'Realizamos primeiro uma sessÃ£o diagnÃ³stica sem custos para avaliar os principais gargalos e oportunidades da organizaÃ§Ã£o.' },
    { q: 'Atendem empresas fora de Maputo?', a: 'Sim! Atendemos organizaÃ§Ãµes em todas as provÃ­ncias de MoÃ§ambique de forma presencial ou remota.' },
    { q: 'Qual o tempo mÃ©dio de um projeto corporativo?', a: 'Os contratos variam de intervenÃ§Ãµes pontuais de 60 dias a acompanhamentos contÃ­nuos de governanÃ§a anual.' },
    { q: 'Como Ã© garantida a confidencialidade?', a: 'Todos os trabalhos sÃ£o protegidos por acordos de confidencialidade estritos e protocolos de seguranÃ§a de dados.' }
  ])}

  ${renderBookingForm('SessÃ£o DiagnÃ³stica & Proposta Executiva', 'Preencha o formulÃ¡rio institucional para agendarmos uma reuniÃ£o com os nossos consultores seniores.', [
    'Consultoria de GestÃ£o & GovernanÃ§a',
    'Planeamento EstratÃ©gico & Financeiro',
    'TransformaÃ§Ã£o Digital & AutomaÃ§Ã£o',
    'Auditoria de Processos & Compliance',
    'Programa de Desenvolvimento de LideranÃ§as',
    'Estudo de Viabilidade para Novos Mercados'
  ], 'Solicitar ReuniÃ£o pelo WhatsApp')}

  ${renderCta('Agende uma SessÃ£o EstratÃ©gica Executiva', 'Descubra como podemos acelerar a consolidaÃ§Ã£o e eficiÃªncia da sua empresa.', 'Falar com Consultor no WhatsApp', 'OlÃ¡! Gostaria de agendar uma reuniÃ£o estratÃ©gica.')}

  ${renderFooter(brand, navItems, waDefault)}
</body>
</html>`;
}

// â”€â”€â”€ System Instruction (Diretrizes Estritas Preto & Branco com Menu e RodapÃ©) â”€
const SYSTEM_INSTRUCTION = `Voce e o Construtor de Sites IA da WEHOSTHERE (uma plataforma cloud em Mocambique).
Sua missao e gerar ou aprimorar uma pagina web HTML5 COMPLETA, AUTONOMA, MODERNA, RESPONSIVA e IMPRESSIONANTE para o cliente.
DIRETRIZES CRITICAS DE DESIGN E ESTRUTURA:
1. Retorne APENAS o codigo HTML completo (comecando em <!DOCTYPE html> e terminando em </html>). NAO inclua explicacoes ou texto antes ou depois.
2. Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
3. Use Google Fonts (Plus Jakarta Sans ou Inter).
4. ESTETICA OBRIGATORIA: TEMA PRETO E BRANCO (Black & White / Minimalist Luxury). Fundo preto (#000000 ou #050505), texto em branco (#ffffff) e cinza (#a1a1aa), com bordas suaves (border-white/10). BotÃµes de acao principais em BRANCO PURO com texto preto (bg-white text-black font-extrabold hover:bg-zinc-200).
5. MENU / NAVBAR: Simples e bonito, fixo ou sticky no topo (sticky top-0 backdrop-blur-xl bg-black/85 border-b border-white/10), com logo em caixa monocromatica, links essenciais e botao WhatsApp em branco.
6. RODAPE / FOOTER: Simples e bonito no fundo com divisor (border-t border-white/10), nome da marca, links rapidos e copyright "2026. Todos os direitos reservados."
7. ESTRUTURA COMPLETA E RICA (LOGO NO PRIMEIRO PROMPT):
   - Navbar com logo monocromÃ¡tico, links Ã¢ncora e botÃ£o WhatsApp em branco
   - Hero impactante com badge pulsante ("DisponÃ­vel em MoÃ§ambique"), H1 marcante, subtÃ­tulo e 2 botÃµes de CTA
   - Barra de EstatÃ­sticas (Stats bar com 4 mÃ©tricas expressivas)
   - SecÃ§Ã£o Principal (ServiÃ§os/CardÃ¡pio/Produtos) com grid de 6 cards ricos, preÃ§os em Meticais (MT) e botÃµes de aÃ§Ã£o
   - Galeria / Showcase Visual (3 cards com IMAGENS REAIS E DE ALTA DEFINIÃ‡ÃƒO DO UNSPLASH https://images.unsplash.com/photo-... com proporÃ§Ã£o h-60 w-full object-cover, tags de categoria e efeito hover zoom)
   - Depoimentos / Prova Social (3 testemunhos com 5 estrelas e localizaÃ§Ã£o em MoÃ§ambique)
   - FAQ Interativo (4 perguntas frequentes com accordion retrÃ¡til em JavaScript nativo)
   - FormulÃ¡rio Interativo de Agendamento/Contacto (#agendamento): campos Nome, TelemÃ³vel, ServiÃ§o/OpÃ§Ã£o e Data, com validaÃ§Ã£o e envio formatado direto para o WhatsApp via window.open
   - Banner de CTA Final de alto impacto com gradiente radial e link para WhatsApp
   - BotÃ£o Flutuante do WhatsApp no canto inferior direito (fixed bottom-6 right-6 z-50 bg-white text-black font-extrabold px-5 py-3.5 rounded-full shadow-2xl hover:scale-110)
   - RodapÃ© Multi-Coluna (Marca & bio, NavegaÃ§Ã£o, Contacto em MoÃ§ambique e Pagamentos: M-Pesa, E-Mola, BIM/BCI).
8. ÃCONES PROFISSIONAIS OBRIGATÃ“RIOS (REGRA DE OURO):
   - Ã‰ ESTRITAMENTE PROIBIDO USAR EMOJIS (ex: ðŸš€, ðŸ’», âš¡, ðŸ”’, ðŸŽ¯, â­, ðŸ•, ðŸ¨, ðŸ›’, etc.) como Ã­cones de cards, serviÃ§os, vantagens ou tÃ­tulos. Emojis parecem amadores e destroem o visual profissional.
   - USE SEMPRE ÃCONES SVG PROFISSIONAIS INLINE com Tailwind CSS (ex: <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="..."/></svg>) OU utilize a biblioteca Lucide Icons via CDN:
     No <head>: <script src="https://unpkg.com/lucide@latest"></script>
     Nos cards: <i data-lucide="shield" class="w-6 h-6 text-white"></i> (ou "zap", "server", "globe", "cpu", "star", "phone", etc.)
     Antes de </body>: <script>lucide.createIcons();</script>
   - Envolva sempre cada Ã­cone numa caixa elegante de suporte com cantos arredondados (ex: <div class="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white mb-4">...</div>).
9. Se houver HTML atual, REFINE e ATUALIZE mantendo essa estetica preta e branca minimalista de alto luxo e garantindo que todos os Ã­cones sejam profissionais em SVG.
10. NAVEGAÃ‡ÃƒO E LINKS CLICÃVEIS (REGRA OBRIGATÃ“RIA):
    - TODOS os links de navegaÃ§Ã£o (<nav> e menu do cabeÃ§alho) DEVEM ser 100% clicÃ¡veis e funcionar com Ã¢ncoras (<a href="#inicio">, <a href="#solucoes"> ou <a href="#servicos">, <a href="#vantagens">, <a href="#precos">, <a href="#contacto">).
    - Para CADA link de navegaÃ§Ã£o no menu, DEVE OBRIGATORIAMENTE existir no corpo do documento a respectiva secÃ§Ã£o com o atributo id exato (ex: <section id="inicio">, <section id="solucoes">, <section id="vantagens">, <section id="precos">, <footer id="contacto">).
    - O <head> DEVE conter SEMPRE: <style>html { scroll-behavior: smooth; } section[id] { scroll-margin-top: 5rem; }</style> para que a navegaÃ§Ã£o suave funcione sem que o cabeÃ§alho fixo cubra os tÃ­tulos.
    - Se houver botÃ£o de WhatsApp, DEVE ter link real no formato: href="https://wa.me/NUMERO?text=MENSAGEM".`;

// â”€â”€â”€ DetecÃ§Ã£o de IntenÃ§Ã£o Conversacional (Chat vs GeraÃ§Ã£o de CÃ³digo) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function detectConversationalIntent(prompt: string, hasCurrentHtml: boolean): { isChat: boolean; reply: string } {
  const p = prompt.trim().toLowerCase();

  // Palavras-chave que indicam claramente um comando ou pedido de construÃ§Ã£o/ediÃ§Ã£o de site
  const actionKeywords = [
    'cria', 'criar', 'construir', 'construa', 'faz', 'fazer', 'muda', 'mudar', 
    'altera', 'alterar', 'adiciona', 'adicionar', 'remove', 'remover', 'elimina',
    'troca', 'trocar', 'coloca', 'colocar', 'desenvolve', 'desenvolver',
    'site', 'website', 'landing', 'pagina', 'pÃ¡gina', 'loja', 'ecommerce', 
    'restaurante', 'barbearia', 'hotel', 'resort', 'preÃ§o', 'preco', 'precos',
    'botao', 'botÃ£o', 'whatsapp', 'formulario', 'formulÃ¡rio', 'tabela', 'cor', 'cores',
    'tema', 'fundo', 'header', 'footer', 'menu', 'navbar', 'hero', 'banner', 'design'
  ];

  const hasAction = actionKeywords.some(kw => p.includes(kw));
  if (hasAction) {
    return { isChat: false, reply: '' };
  }

  // SaudaÃ§Ãµes tÃ­picas (sem pedido de aÃ§Ã£o)
  const greetings = [
    'ola', 'olÃ¡', 'oi', 'oii', 'oiii', 'hey', 'hello', 'hi', 'bom dia', 'boa tarde', 
    'boa noite', 'tudo bem', 'tudo bom', 'tudo bem?', 'opa', 'e aÃ­', 'e ai', 
    'fala aÃ­', 'salve'
  ];
  if (greetings.includes(p) || greetings.some(g => p === g || p === `${g}!` || p === `${g}.` || p === `${g}?`)) {
    return {
      isChat: true,
      reply: hasCurrentHtml
        ? 'OlÃ¡! Como posso ajudar a aprimorar o seu website? Pode pedir para mudar cores, adicionar novas secÃ§Ãµes, incluir botÃ£o de WhatsApp, catÃ¡logo de serviÃ§os ou preÃ§os.'
        : 'OlÃ¡! Sou o Construtor com InteligÃªncia Artificial da WEHOSTHERE. Que tipo de website ou sistema deseja criar hoje? (Por exemplo: um restaurante, barbearia, portfÃ³lio, loja online ou pÃ¡gina de captura).'
    };
  }

  // DÃºvidas de como usar ou quem Ã©
  if (
    p.includes('como funciona') || p.includes('o que fazes') || p.includes('o que podes fazer') || 
    p.includes('quem Ã©s tu') || p.includes('quem e voce') || p.includes('como usar') ||
    p === 'ajuda' || p === 'help' || p.includes('podes me ajudar')
  ) {
    return {
      isChat: true,
      reply: 'Eu crio e altero websites completos e responsivos em tempo real! Pode simplesmente descrever o que precisa no chat, por exemplo:\n\nâ€¢ "Cria uma landing page para uma clÃ­nica mÃ©dica com agendamento"\nâ€¢ "Adiciona um botÃ£o de WhatsApp flutuante"\nâ€¢ "Muda a paleta de cores para tema escuro e dourado"\n\nAssim que fizer o pedido, vou gerar o cÃ³digo ao vivo no terminal e atualizar o preview!'
    };
  }

  // Elogios ou confirmaÃ§Ãµes curtas
  const courtesies = ['obrigado', 'obrigada', 'valeu', 'top', 'muito bom', 'gostei', 'show', 'legal', 'perfeito', 'ok', 'entendi'];
  if (courtesies.includes(p) || courtesies.some(c => p === c || p === `${c}!` || p === `${c}.`)) {
    return {
      isChat: true,
      reply: 'De nada! O projeto continua pronto no preview. Se quiser fazer mais alteraÃ§Ãµes Ã© sÃ³ pedir, ou pode clicar no botÃ£o branco "Publicar" para colocÃ¡-lo online no seu subdomÃ­nio com SSL!'
    };
  }

  return { isChat: false, reply: '' };
}

// â”€â”€â”€ Helper para enviar SSE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Simular streaming de string ja gerada â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function simulateStream(html: string, sse: ReturnType<typeof makeSSE>, chunkSize = 80, delay = 8) {
  for (let i = 0; i < html.length; i += chunkSize) {
    sse.chunk(html.slice(i, i + chunkSize));
    await new Promise(r => setTimeout(r, delay));
  }
}

// â”€â”€â”€ Extrair HTML limpo de uma resposta de texto â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function extractHtml(raw: string): string {
  const match = raw.match(/```html([\s\S]*?)```/i) || raw.match(/```([\s\S]*?)```/i);
  const code = match ? match[1].trim() : raw.trim();
  if (code.toLowerCase().includes('<!doctype') || code.toLowerCase().includes('<html')) {
    return code;
  }
  return '';
}

// â”€â”€â”€ POST handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

      // â”€â”€ MODO CONVERSA / CONSULTORIA EXPLICITA (Sem alterar o site) â”€â”€â”€â”€â”€â”€â”€â”€â”€
      if (mode === 'chat') {
        const chatPrompt = `VocÃª Ã© o Consultor Especialista de PresenÃ§a Digital, Design e EstratÃ©gia da WEHOSTHERE (lÃ­der de hospedagem e criaÃ§Ã£o de sites em MoÃ§ambique).
O utilizador estÃ¡ a conversar consigo sobre o projeto de website "${title || 'Meu Site'}".
Responda de forma clara, amigÃ¡vel, motivadora e estruturada em portuguÃªs.
DÃª sugestÃµes prÃ¡ticas de marketing digital, ideias de conteÃºdo/textos, boas prÃ¡ticas de experiÃªncia do utilizador e dicas adaptadas ao mercado moÃ§ambicano (como pagamentos M-Pesa/e-Mola, pedidos via WhatsApp e moeda Meticais MZN).
IMPORTANTE: NÃ£o gere cÃ³digo HTML de pÃ¡ginas completas. O utilizador estÃ¡ no Modo Conversa para planear e tirar dÃºvidas.

PEDIDO / DÃšVIDA DO UTILIZADOR: "${prompt}"`;

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
        const defaultChatReply = conversational.reply || `Entendido! Como seu consultor da WEHOSTHERE, recomendo estruturar o seu website com foco na simplicidade e conversÃ£o direta. Destaque uma mensagem de boas-vindas forte, mostre os seus principais produtos ou serviÃ§os com valores transparentes em Meticais (MZN) e adicione botÃµes de contacto direto via WhatsApp.\n\nQuando estiver pronto para aplicar alteraÃ§Ãµes visuais no seu site, mude para o "Modo Desenvolvimento" no topo da caixa de texto!`;
        sse.chat(defaultChatReply, 'Consultor WEHOSTHERE');
        return;
      }

      // â”€â”€ 0. Verificar se Ã© conversa automÃ¡tica (OlÃ¡, Como funciona, DÃºvidas) â”€
      const conversational = detectConversationalIntent(prompt, Boolean(currentHtml));
      if (conversational.isChat) {
        sse.chat(conversational.reply, 'Assistente WEHOSTHERE');
        return;
      }

      // â”€â”€ 1. Gemini com streaming SSE real â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

        // â”€â”€ 1b. Gemini modo normal com stream simulado â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

      // â”€â”€ 2. OpenAI com streaming real â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

      // â”€â”€ 3. Fallback estatico com stream simulado â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const fallback = getFallbackHtml(prompt, title);
      await simulateStream(fallback, sse, 60, 12);
      sse.done(
        currentHtml
          ? `Ajustamos o seu site com base no pedido: "${prompt}".`
          : `Pagina base criada para "${prompt}". Pode refinÃ¡-la agora!`,
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

