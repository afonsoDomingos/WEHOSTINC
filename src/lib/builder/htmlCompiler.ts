// ============================================================================
// ⚙️ WEHOSTHERE VISUAL BUILDER — MOTOR DE COMPILAÇÃO (JSON Document -> HTML)
// ============================================================================

import { 
  SiteDocument, 
  PageDocument, 
  VisualComponent, 
  StyleProps, 
  GlobalSiteTheme,
  PricingPlanItem,
  TestimonialItem,
  FeatureItem,
  FaqItem
} from './types';

// Helper: Transforma StyleProps em string de classes Tailwind e CSS inline
function compileStyles(styles: { desktop: StyleProps; tablet?: Partial<StyleProps>; mobile?: Partial<StyleProps> }, isContainer: boolean = false): { classes: string; inlineStyle: string } {
  const classes: string[] = [];
  const inlineStyles: string[] = [];

  const d = styles.desktop || {};
  const t = styles.tablet || {};
  const m = styles.mobile || {};

  // Custom Classes livres
  if (d.customClasses) classes.push(d.customClasses);

  // Tipografia
  if (d.textAlign) {
    if (d.textAlign === 'center') classes.push('text-center');
    else if (d.textAlign === 'right') classes.push('text-right');
    else if (d.textAlign === 'justify') classes.push('text-justify');
    else classes.push('text-left');
  }
  if (d.textTransform) {
    if (d.textTransform === 'uppercase') classes.push('uppercase');
    else if (d.textTransform === 'lowercase') classes.push('lowercase');
    else if (d.textTransform === 'capitalize') classes.push('capitalize');
  }
  if (d.textDecoration === 'underline') classes.push('underline');

  // Display & Flex
  if (d.display) {
    if (d.display === 'flex') classes.push('flex');
    else if (d.display === 'grid') classes.push('grid');
    else if (d.display === 'block') classes.push('block');
    else if (d.display === 'inline-flex') classes.push('inline-flex');
  }
  if (d.flexDirection) {
    if (d.flexDirection === 'column') classes.push('flex-col');
    else if (d.flexDirection === 'row') classes.push('flex-row');
  }
  if (d.justifyContent) {
    if (d.justifyContent === 'center') classes.push('justify-center');
    else if (d.justifyContent === 'space-between') classes.push('justify-between');
    else if (d.justifyContent === 'flex-end') classes.push('justify-end');
  }
  if (d.alignItems) {
    if (d.alignItems === 'center') classes.push('items-center');
    else if (d.alignItems === 'flex-start') classes.push('items-start');
    else if (d.alignItems === 'flex-end') classes.push('items-end');
  }
  if (d.flexWrap === 'wrap') classes.push('flex-wrap');

  // Bordas & Cantos Arredondados
  if (d.borderRadius) {
    if (d.borderRadius.startsWith('rounded')) classes.push(d.borderRadius);
    else inlineStyles.push(`border-radius: ${d.borderRadius}`);
  }
  if (d.boxShadow) {
    if (d.boxShadow.startsWith('shadow')) classes.push(d.boxShadow);
    else inlineStyles.push(`box-shadow: ${d.boxShadow}`);
  }

  // Visibilidade por dispositivo
  if (d.hiddenOnMobile) classes.push('hidden sm:block');
  if (d.hiddenOnTablet) classes.push('sm:hidden md:block');
  if (d.hiddenOnDesktop) classes.push('lg:hidden');

  // Inline CSS para valores exatos (Cores, Margens, Padding, Larguras)
  if (d.color && !d.color.startsWith('text-')) inlineStyles.push(`color: ${d.color}`);
  if (d.backgroundColor && !d.backgroundColor.startsWith('bg-')) inlineStyles.push(`background-color: ${d.backgroundColor}`);
  if (d.width && !d.width.startsWith('w-')) inlineStyles.push(`width: ${d.width}`);
  if (d.maxWidth) inlineStyles.push(`max-width: ${d.maxWidth}`);
  if (d.minHeight) inlineStyles.push(`min-height: ${d.minHeight}`);
  if (d.height) inlineStyles.push(`height: ${d.height}`);

  if (d.paddingTop) inlineStyles.push(`padding-top: ${d.paddingTop}`);
  if (d.paddingRight) inlineStyles.push(`padding-right: ${d.paddingRight}`);
  if (d.paddingBottom) inlineStyles.push(`padding-bottom: ${d.paddingBottom}`);
  if (d.paddingLeft) inlineStyles.push(`padding-left: ${d.paddingLeft}`);

  if (d.marginTop) inlineStyles.push(`margin-top: ${d.marginTop}`);
  if (d.marginRight) inlineStyles.push(`margin-right: ${d.marginRight}`);
  if (d.marginBottom) inlineStyles.push(`margin-bottom: ${d.marginBottom}`);
  if (d.marginLeft) inlineStyles.push(`margin-left: ${d.marginLeft}`);

  if (d.gap) inlineStyles.push(`gap: ${d.gap}`);
  if (d.fontSize) inlineStyles.push(`font-size: ${d.fontSize}`);
  if (d.fontWeight) inlineStyles.push(`font-weight: ${d.fontWeight}`);
  if (d.lineHeight) inlineStyles.push(`line-height: ${d.lineHeight}`);
  if (d.opacity !== undefined) inlineStyles.push(`opacity: ${d.opacity}`);
  if (d.borderWidth) inlineStyles.push(`border-width: ${d.borderWidth}`);
  if (d.borderTopWidth) inlineStyles.push(`border-top-width: ${d.borderTopWidth}`);
  if (d.borderBottomWidth) inlineStyles.push(`border-bottom-width: ${d.borderBottomWidth}`);
  if (d.borderLeftWidth) inlineStyles.push(`border-left-width: ${d.borderLeftWidth}`);
  if (d.borderRightWidth) inlineStyles.push(`border-right-width: ${d.borderRightWidth}`);
  if (d.borderColor) inlineStyles.push(`border-color: ${d.borderColor}`);
  if (d.borderStyle) inlineStyles.push(`border-style: ${d.borderStyle}`);

  return {
    classes: classes.join(' '),
    inlineStyle: inlineStyles.join('; ')
  };
}

// ─── Compilação de um Componente Visual Individual ───────────────────────────
function compileComponent(
  comp: VisualComponent, 
  theme: GlobalSiteTheme,
  isEditorMode: boolean = false
): string {
  if (comp.hidden) return '';

  const { classes, inlineStyle } = compileStyles(comp.styles);
  const dataAttrs = isEditorMode 
    ? `data-wb-id="${comp.id}" data-wb-type="${comp.type}" data-wb-name="${comp.name}"`
    : `id="${comp.id}"`;

  const styleAttr = inlineStyle ? `style="${inlineStyle}"` : '';

  // 1. Secção
  if (comp.type === 'section') {
    const innerHtml = comp.children.map(c => compileComponent(c, theme, isEditorMode)).join('\n');
    return `
    <section ${dataAttrs} class="relative ${classes}" ${styleAttr}>
      ${innerHtml}
    </section>`;
  }

  // 2. Container
  if (comp.type === 'container') {
    const innerHtml = comp.children.map(c => compileComponent(c, theme, isEditorMode)).join('\n');
    return `
      <div ${dataAttrs} class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 ${classes}" ${styleAttr}>
        ${innerHtml}
      </div>`;
  }

  // 3. Linha (Row) e Coluna (Column)
  if (comp.type === 'row') {
    const innerHtml = comp.children.map(c => compileComponent(c, theme, isEditorMode)).join('\n');
    return `
      <div ${dataAttrs} class="flex flex-col md:flex-row items-center gap-6 ${classes}" ${styleAttr}>
        ${innerHtml}
      </div>`;
  }

  if (comp.type === 'column') {
    const innerHtml = comp.children.map(c => compileComponent(c, theme, isEditorMode)).join('\n');
    return `
      <div ${dataAttrs} class="flex-1 w-full ${classes}" ${styleAttr}>
        ${innerHtml}
      </div>`;
  }

  // 4. Grid
  if (comp.type === 'grid') {
    const innerHtml = comp.children.map(c => compileComponent(c, theme, isEditorMode)).join('\n');
    return `
      <div ${dataAttrs} class="grid grid-cols-1 md:grid-cols-3 gap-6 ${classes}" ${styleAttr}>
        ${innerHtml}
      </div>`;
  }

  // 5. Título (Heading)
  if (comp.type === 'heading') {
    const Tag = comp.content.headingLevel || 'h2';
    const text = comp.content.text || 'Título da Secção';
    return `<${Tag} ${dataAttrs} class="font-extrabold tracking-tight ${classes}" ${styleAttr}>${text}</${Tag}>`;
  }

  // 6. Texto / Parágrafo
  if (comp.type === 'text') {
    const text = comp.content.text || 'Texto explicativo do conteúdo...';
    return `<p ${dataAttrs} class="leading-relaxed ${classes}" ${styleAttr}>${text}</p>`;
  }

  // 7. Botão CTA
  if (comp.type === 'button') {
    const text = comp.content.text || 'Clique Aqui';
    const href = comp.content.href || '#contacto';
    const target = comp.content.target || '_self';
    return `
      <a ${dataAttrs} href="${href}" target="${target}" class="inline-flex items-center justify-center font-bold px-6 py-3 rounded-xl transition duration-200 active:scale-95 shadow-md ${classes}" ${styleAttr}>
        ${text}
      </a>`;
  }

  // 8. Imagem
  if (comp.type === 'image') {
    const src = comp.content.src || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80';
    const alt = comp.content.alt || 'Imagem ilustrativa';
    return `
      <img ${dataAttrs} src="${src}" alt="${alt}" class="w-full h-auto object-cover rounded-2xl ${classes}" ${styleAttr} />`;
  }

  // 9. Ícone Vetorial / Lucide
  if (comp.type === 'icon') {
    const iconName = comp.content.iconName || 'sparkles';
    return `
      <div ${dataAttrs} class="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${classes}" ${styleAttr}>
        <i data-lucide="${iconName}" class="w-6 h-6"></i>
      </div>`;
  }

  // 10. Badge / Pílula
  if (comp.type === 'badge') {
    const text = comp.content.badgeText || comp.content.text || 'Novo Recurso';
    return `
      <div ${dataAttrs} class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase shadow-sm ${classes}" ${styleAttr}>
        <span>${text}</span>
      </div>`;
  }

  // 11. Divisor
  if (comp.type === 'divider') {
    return `<hr ${dataAttrs} class="border-t border-slate-800 my-6 ${classes}" ${styleAttr} />`;
  }

  // 12. Espaçador
  if (comp.type === 'spacer') {
    return `<div ${dataAttrs} class="w-full h-8 ${classes}" ${styleAttr}></div>`;
  }

  // 13. Tabela de Preços (Composta)
  if (comp.type === 'pricing-table') {
    const plans: PricingPlanItem[] = comp.content.pricingPlans || [
      {
        name: 'Básico',
        price: '1.500',
        currency: 'MT',
        cycle: '/mês',
        features: ['Website Institucional', 'Otimizado para Telemóveis', 'Certificado SSL Grátis'],
        buttonText: 'Escolher Básico',
        buttonLink: '#contacto'
      },
      {
        name: 'Profissional',
        price: '3.500',
        currency: 'MT',
        cycle: '/mês',
        badge: 'Mais Popular',
        isPopular: true,
        features: ['Tudo do Plano Básico', 'Domínio .co.mz Incluído', 'Integração de M-Pesa', 'Suporte Prioritário 24/7'],
        buttonText: 'Contratar Profissional',
        buttonLink: '#contacto'
      },
      {
        name: 'Empresarial',
        price: '7.500',
        currency: 'MT',
        cycle: '/mês',
        features: ['Infraestrutura Dedicada', 'Painel de Gestão Exclusivo', 'M-Pesa & e-Mola', 'Gerente de Conta Dedicado'],
        buttonText: 'Escolher Empresarial',
        buttonLink: '#contacto'
      }
    ];

    const cardsHtml = plans.map(p => `
      <div class="p-8 rounded-3xl ${p.isPopular ? 'bg-gradient-to-b from-blue-950/60 to-slate-900 border-2 border-blue-500 scale-105 z-10 shadow-2xl' : 'bg-slate-900 border border-slate-800 shadow-lg'} flex flex-col justify-between relative transition">
        ${p.badge ? `<span class="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">${p.badge}</span>` : ''}
        <div>
          <h3 class="text-lg font-bold text-white mb-2">${p.name}</h3>
          <div class="flex items-baseline gap-1 my-4">
            <span class="text-3xl sm:text-4xl font-black text-white">${p.price}</span>
            <span class="text-sm font-semibold text-slate-400">${p.currency} ${p.cycle}</span>
          </div>
          <ul class="space-y-3 pt-4 border-t border-slate-800 mb-8">
            ${p.features.map(f => `
              <li class="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                <i data-lucide="check" class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"></i>
                <span>${f}</span>
              </li>`).join('')}
          </ul>
        </div>
        <a href="${p.buttonLink}" class="w-full py-3 px-4 rounded-xl text-center font-bold text-xs sm:text-sm transition ${p.isPopular ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-800 hover:bg-slate-700 text-white'}">
          ${p.buttonText}
        </a>
      </div>
    `).join('\n');

    return `
      <div ${dataAttrs} class="w-full py-12 ${classes}" ${styleAttr}>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          ${cardsHtml}
        </div>
      </div>`;
  }

  // 14. Botão Flutuante de WhatsApp
  if (comp.type === 'whatsapp-button') {
    const href = comp.content.href || 'https://wa.me/258840000000?text=Ola!%20Gostaria%20de%20saber%20mais.';
    const text = comp.content.text || 'Falar no WhatsApp';
    return `
      <a ${dataAttrs} href="${href}" target="_blank" rel="noopener noreferrer" 
         class="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white px-4 py-3 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 font-bold text-sm ${classes}" ${styleAttr}>
        <span class="relative flex h-3 w-3">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
        <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
        <span class="hidden sm:inline">${text}</span>
      </a>`;
  }

  // 15. Código HTML Customizado
  if (comp.type === 'custom-html') {
    return `<div ${dataAttrs} class="${classes}" ${styleAttr}>${comp.content.htmlRaw || ''}</div>`;
  }

  // Fallback: renderizar filhos
  const childrenHtml = comp.children.map(c => compileComponent(c, theme, isEditorMode)).join('\n');
  return `<div ${dataAttrs} class="${classes}" ${styleAttr}>${childrenHtml}</div>`;
}

// ─── COMPILADOR PRINCIPAL (SiteDocument -> HTML5 Completo) ───────────────────
export function compileSiteDocumentToHtml(
  doc: SiteDocument, 
  pageId?: string,
  isEditorMode: boolean = false
): string {
  const targetPage = doc.pages.find(p => p.id === (pageId || doc.activePageId)) || doc.pages[0];
  const theme = doc.site.theme;

  // Se estiver em modo editor, renderizar botões sutis de adição de secções
  const renderedComponents = targetPage.rootComponents
    .map((comp, idx) => {
      const compHtml = compileComponent(comp, theme, isEditorMode);
      if (!isEditorMode) return compHtml;
      return `
        <div class="wb-section-slot" data-wb-slot="${idx}">
          ${compHtml}
          <div class="wb-add-section-divider">
            <button type="button" class="wb-add-section-btn" onclick="window.parent.postMessage({ type: 'OPEN_ADD_SECTION', insertIndex: ${idx + 1} }, '*')">
              <span>+</span>
              <span>Adicionar Secção Aqui</span>
            </button>
          </div>
        </div>
      `;
    })
    .join('\n');

  // Estilos globais e variáveis de tema
  const globalStyles = `
    :root {
      --primary-brand: ${theme.primaryColor};
      --secondary-brand: ${theme.secondaryColor};
      --accent-brand: ${theme.accentColor};
      --bg-brand: ${theme.backgroundColor};
      --text-brand: ${theme.textColor};
    }
    html { scroll-behavior: smooth; }
    section[id], footer[id] { scroll-margin-top: 5rem; }
    body {
      font-family: '${theme.fontFamily}', sans-serif;
      background-color: ${theme.backgroundColor};
      color: ${theme.textColor};
    }
    h1, h2, h3, h4, h5, h6 {
      font-family: '${theme.headingFontFamily}', sans-serif;
    }
  `;

  // Script de suporte ao Editor Visual (Comunicação bidirecional com Canvas via postMessage)
  const editorBridgeScript = isEditorMode ? `
  <style>
    /* Estilos de Destaque no Canvas do Editor */
    [data-wb-id] {
      position: relative;
      transition: outline 0.15s ease-in-out;
    }
    [data-wb-id]:hover {
      outline: 2px dashed #3b82f6 !important;
      outline-offset: 2px;
      cursor: pointer;
    }
    [data-wb-id].wb-selected {
      outline: 2px solid #2563eb !important;
      outline-offset: 2px;
    }
    [data-wb-id].wb-selected::after {
      content: attr(data-wb-name);
      position: absolute;
      top: -24px;
      left: 0;
      background: #2563eb;
      color: #ffffff;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      z-index: 9999;
      pointer-events: none;
      white-space: nowrap;
    }
    [data-wb-id][contenteditable="true"] {
      outline: 2px solid #10b981 !important;
      cursor: text !important;
      background: rgba(16, 185, 129, 0.08);
      border-radius: 4px;
    }
    .wb-add-section-divider {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 10px 0;
      opacity: 0.15;
      transition: opacity 0.2s ease;
    }
    .wb-add-section-divider:hover {
      opacity: 1;
    }
    .wb-add-section-btn {
      background: #2563eb;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      padding: 5px 12px;
      border-radius: 9999px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: transform 0.15s ease, background 0.15s ease;
    }
    .wb-add-section-btn:hover {
      background: #1d4ed8;
      transform: scale(1.05);
    }
  </style>
  <script>
    // Bridge de comunicação com o iframe
    window.addEventListener('message', function(event) {
      if (!event.data || !event.data.type) return;
      if (event.data.type === 'SELECT_COMPONENT') {
        document.querySelectorAll('.wb-selected').forEach(el => el.classList.remove('wb-selected'));
        var el = document.querySelector('[data-wb-id="' + event.data.componentId + '"]');
        if (el) {
          el.classList.add('wb-selected');
        }
      }
    });

    // Clique simples: Seleciona o elemento
    document.addEventListener('click', function(e) {
      var target = e.target.closest('[data-wb-id]');
      if (target) {
        if (target.getAttribute('contenteditable') === 'true') {
          return; // Deixar utilizador editar texto
        }
        e.preventDefault();
        e.stopPropagation();
        var id = target.getAttribute('data-wb-id');
        var type = target.getAttribute('data-wb-type');
        document.querySelectorAll('.wb-selected').forEach(el => el.classList.remove('wb-selected'));
        target.classList.add('wb-selected');
        window.parent.postMessage({ type: 'COMPONENT_CLICKED', componentId: id, componentType: type }, '*');
      }
    });

    // Double-click: Edição de texto direta inline ou seletor de imagens
    document.addEventListener('dblclick', function(e) {
      var target = e.target.closest('[data-wb-id]');
      if (!target) return;

      var type = target.getAttribute('data-wb-type');
      var id = target.getAttribute('data-wb-id');

      // Se for imagem, abrir seletor de imagens
      if (type === 'image' || e.target.tagName === 'IMG') {
        e.preventDefault();
        e.stopPropagation();
        var imgEl = e.target.tagName === 'IMG' ? e.target : target.querySelector('img');
        var currentSrc = imgEl ? imgEl.getAttribute('src') : '';
        window.parent.postMessage({ type: 'OPEN_IMAGE_PICKER', componentId: id, currentSrc: currentSrc }, '*');
        return;
      }

      // Se for elemento de texto (heading, text, button, badge), ativar contenteditable inline
      if (['heading', 'text', 'button', 'badge'].indexOf(type) !== -1 || !target.children.length) {
        e.preventDefault();
        e.stopPropagation();
        target.setAttribute('contenteditable', 'true');
        target.focus();

        var finishEdit = function() {
          target.removeAttribute('contenteditable');
          target.removeEventListener('blur', finishEdit);
          target.removeEventListener('keydown', handleKey);
          var newText = target.innerText.trim();
          window.parent.postMessage({ type: 'UPDATE_COMPONENT_TEXT', componentId: id, newText: newText }, '*');
        };

        var handleKey = function(keyEvent) {
          if (keyEvent.key === 'Enter' && !keyEvent.shiftKey && type !== 'text') {
            keyEvent.preventDefault();
            finishEdit();
          }
          if (keyEvent.key === 'Escape') {
            target.removeAttribute('contenteditable');
          }
        };

        target.addEventListener('blur', finishEdit);
        target.addEventListener('keydown', handleKey);
      }
    });
  </script>
  ` : '';

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${targetPage.seo.metaTitle || targetPage.title || doc.site.name}</title>
  ${targetPage.seo.metaDescription ? `<meta name="description" content="${targetPage.seo.metaDescription}">` : ''}
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    ${globalStyles}
  </style>
  ${editorBridgeScript}
</head>
<body class="antialiased min-h-screen flex flex-col">
  <main class="flex-1">
    ${renderedComponents}
  </main>
  <script>
    // Inicializar ícones da Lucide Icons
    if (window.lucide) {
      lucide.createIcons();
    }
    // Suporte a âncoras suaves
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
      anchor.addEventListener('click', function(e) {
        var href = this.getAttribute('href');
        if (href && href.length > 1) {
          var targetEl = document.querySelector(href);
          if (targetEl) {
            e.preventDefault();
            targetEl.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });
  </script>
</body>
</html>`;
}

// Alias de compatibilidade
export { compileSiteDocumentToHtml as compileSiteDocument };
