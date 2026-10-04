/**
 * Seed script — Codando Histórias (Revista WeHostHere)
 * Executa: node scripts/seed-revista.js
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Carregar .env.local nativamente sem dependência externa
try {
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(path.resolve(process.cwd(), '.env.local'));
  } else {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...vals] = trimmed.split('=');
          if (key && vals.length > 0) {
            process.env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
          }
        }
      });
    }
  }
} catch (e) {
  // Ignora se não existir
}

const MONGO_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!MONGO_URI) {
  console.log('ℹ️  MONGODB_URI não encontrado no .env.local.');
  console.log('A revista já conta com histórias iniciais integradas via lib/revistaData.ts para desenvolvimento local.');
  console.log('Para gravar no MongoDB Atlas, adicione MONGODB_URI="..." no .env.local e volte a rodar.');
  process.exit(0);
}

const RevistaStorySchema = new mongoose.Schema(
  {
    title:         { type: String, required: true },
    slug:          { type: String, required: true, unique: true },
    excerpt:       { type: String, required: true },
    content:       { type: String, required: true },
    coverImage:    { type: String },
    author:        { name: String, email: String, bio: String, avatar: String },
    category:      { type: String, default: 'codigo' },
    tags:          [String],
    status:        { type: String, default: 'published' },
    featured:      { type: Boolean, default: false },
    views:         { type: Number, default: 0 },
    readingTime:   { type: Number },
    highlightText: { type: String },
    publishedAt:   { type: Date },
    seo:           { metaTitle: String, metaDescription: String, keywords: String },
  },
  { timestamps: true }
);

const STORIES = [
  {
    title: 'Como construí o meu primeiro SaaS com Next.js em 30 dias',
    slug: 'primeiro-saas-nextjs-30-dias',
    highlightText: 'primeiro SaaS',
    excerpt:
      'Saí do zero, sem investimento externo, e em 30 dias lancei um produto que hoje paga as minhas contas. Aqui está o que aprendi.',
    content: `## O Início de Tudo

Tinha 23 anos, um portátil velho e uma ideia que não saia da cabeça. Não tinha dinheiro para servidores caros nem para contratar uma equipa. Tinha apenas código e tempo.

> "A melhor forma de aprender a construir produtos é construindo produtos."

## A Ideia

Comecei por identificar um problema real: pequenas empresas em Moçambique não tinham uma forma simples de gerir as suas facturas digitalmente. A solução parecia óbvia — uma aplicação web simples, bonita e em português.

## A Stack Escolhida

Escolhi tecnologias que já conhecia bem:

* **Next.js** — para o frontend e API routes
* **MongoDB** — base de dados flexível e gratuita no Atlas
* **Tailwind CSS** — estilização rápida
* **Vercel** — deploy gratuito e instantâneo

## Os Primeiros 10 Dias

Os primeiros dias foram os mais difíceis. Não pelos problemas técnicos, mas pelo silêncio. Não havia utilizadores, não havia feedback, apenas eu e o terminal.

> "Quando não tens utilizadores, os teus maiores críticos são os teus próprios pensamentos."

## O Momento de Viragem

No dia 18, partilhei o produto num grupo de WhatsApp de empreendedores de Maputo. Em 24 horas, tinha 47 utilizadores registados. Foi o momento que mudou tudo.

## O Que Aprendi

* Lança cedo, mesmo que esteja imperfeito
* O feedback dos primeiros utilizadores vale mais que mil horas de planear
* A tecnologia é apenas 20% do trabalho — os outros 80% são produto e distribuição

## O Resultado

30 dias depois do lançamento: 200 utilizadores, 3 clientes pagantes, e a certeza de que vale a pena continuar a codar histórias.`,
    author: { name: 'Afonso Domingos', email: 'afonso@wehosthere.com', bio: 'Fundador da WEHOSTHERE. Apaixonado por tecnologia e empreendedorismo em Moçambique.' },
    category: 'startups',
    tags: ['nextjs', 'saas', 'empreendedorismo', 'mozambique'],
    status: 'published',
    featured: true,
    views: 342,
    readingTime: 5,
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'APIs REST vs GraphQL: o que escolher para o teu próximo projecto',
    slug: 'rest-vs-graphql-escolha-certa',
    highlightText: 'REST vs GraphQL',
    excerpt:
      'Dois anos a trabalhar com ambas as tecnologias em produção. Aqui está a minha perspectiva honesta sobre quando usar cada uma.',
    content: `## A Questão Que Toda a Gente Faz

Quando começas um novo projecto, uma das primeiras decisões é: vou fazer uma API REST ou GraphQL? É uma decisão que vai afectar o teu trabalho durante meses.

> "A melhor tecnologia não é a mais moderna — é a que resolve o teu problema."

## REST: O Clássico Que Funciona

REST é simples, bem documentado e qualquer programador consegue trabalhar com ele. Os endpoints são previsíveis, os erros são claros.

* Fácil de aprender e ensinar
* Excelente caching nativo
* Tooling maduro (Swagger, Postman)
* Funciona bem para APIs simples e médias

## GraphQL: O Poder da Flexibilidade

GraphQL brilha quando tens interfaces complexas com muitas entidades relacionadas. O cliente pede exactamente o que precisa.

* Sem over-fetching ou under-fetching
* Um único endpoint para tudo
* Excelente para apps mobile (poupa dados)
* Ideal para dashboards complexos

## A Minha Decisão

Para a maioria dos projectos que faço em Moçambique — onde a largura de banda ainda é um factor — uso GraphQL para o frontend e REST para integrações B2B.

> "Não existe bala de prata. Existe a ferramenta certa para o contexto certo."

## Conclusão

Se estás a começar: usa REST. Quando sentires as limitações, considera GraphQL. A experiência prática valerá mais do que qualquer artigo — incluindo este.`,
    author: { name: 'WEHOSTHERE', email: 'info@wehosthere.com', bio: 'A equipa técnica da WEHOSTHERE.' },
    category: 'codigo',
    tags: ['api', 'rest', 'graphql', 'backend'],
    status: 'published',
    featured: false,
    views: 189,
    readingTime: 4,
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'Design para programadores: os 5 princípios que mudaram o meu trabalho',
    slug: 'design-para-programadores-5-principios',
    highlightText: '5 princípios',
    excerpt:
      'Não precisas de ser designer para criar interfaces bonitas. Precisas apenas de entender alguns princípios fundamentais.',
    content: `## Programadores Não São Designers — E Está Bem

Durante anos evitei o design. Era "coisa de designers". Mas quando comecei a trabalhar sozinho em projectos, percebi que alguém tinha que cuidar da interface. Esse alguém era eu.

> "Bom design não é sobre fazer coisas bonitas. É sobre fazer coisas que funcionam e que as pessoas entendem."

## Princípio 1: Hierarquia Visual

O olho humano segue padrões. O elemento mais importante deve ser o maior, mais escuro ou mais contrastante. Define uma hierarquia clara: título → subtítulo → corpo → notas.

## Princípio 2: Espaço em Branco

O espaço vazio não é espaço perdido. É respiração. Dá espaço aos elementos e a interface fica automaticamente mais profissional.

* Aumenta o padding dos teus componentes
* Separa secções com espaço generoso
* Não tenhas medo do espaço vazio

## Princípio 3: Consistência

Escolhe uma paleta de cores, um conjunto de fontes e um sistema de espaçamento — e mantém-nos em todo o projecto. A inconsistência é o inimigo do design profissional.

## Princípio 4: Contraste

Texto escuro em fundo claro, ou claro em fundo escuro. Nunca cinzento claro em branco. Testa sempre o contraste com ferramentas como o WebAIM.

## Princípio 5: Feedback ao Utilizador

Cada acção deve ter uma resposta visual: botões com hover, loading states, mensagens de erro claras. O utilizador nunca deve ficar sem saber o que está a acontecer.

> "Um design que não comunica estado é um design incompleto."

## Conclusão

Com estes 5 princípios, as minhas interfaces melhoraram 80%. Não são regras absolutas — são pontos de partida para pensar como um designer.`,
    author: { name: 'WEHOSTHERE', email: 'info@wehosthere.com', bio: 'A equipa técnica da WEHOSTHERE.' },
    category: 'design',
    tags: ['design', 'ux', 'ui', 'frontend'],
    status: 'published',
    featured: false,
    views: 97,
    readingTime: 4,
    publishedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'Carreira tech em Moçambique: como consegui o meu primeiro emprego remoto',
    slug: 'carreira-tech-mocambique-emprego-remoto',
    highlightText: 'primeiro emprego remoto',
    excerpt:
      'Com 24 anos, sem experiência formal e a partir de Maputo, consegui um emprego remoto para uma empresa portuguesa. Aqui está o caminho.',
    content: `## O Contexto

Maputo, 2023. Acabei de terminar o curso de Informática. O mercado local para programadores era limitado. Mas a internet não tem fronteiras — e eu decidi usá-la.

> "A geografia já não define as tuas oportunidades. A tua preparação, sim."

## O Plano

Decidi focar-me em três áreas durante 6 meses:

* Construir um portfólio sólido no GitHub
* Aprender inglês técnico para entrevistas
* Candidatar-me a empresas remotas na Europa e Brasil

## O Portfólio

Fiz 4 projectos reais. Não tutoriais — projectos com utilizadores reais, mesmo que fossem os meus amigos. Cada projecto tinha README detalhado, deploy online e código limpo.

## As Candidaturas

Enviei 47 candidaturas em 3 meses. Tive 8 entrevistas e 2 ofertas. A taxa de resposta foi de 17% — acima da média, porque personalizei cada candidatura.

## A Entrevista Técnica

Foi a parte mais assustadora. Mas preparei-me: LeetCode todos os dias, system design básico, e estudei a empresa antes de cada entrevista.

> "A melhor preparação para uma entrevista é fingir que já tens o emprego."

## O Resultado

Aceitei uma oferta de uma startup portuguesa. Trabalho remotamente, em euros, a partir de Maputo. 8 meses depois, fui promovido a lead developer.

## O Que Aprendi

Moçambique tem talento. O que às vezes falta é a crença de que esse talento vale no mercado global. Vale. E muito.`,
    author: { name: 'Carlos Nhantumbo', email: 'info@wehosthere.com', bio: 'Lead Developer. Trabalha remotamente a partir de Maputo.' },
    category: 'carreira',
    tags: ['carreira', 'remoto', 'mozambique', 'emprego'],
    status: 'published',
    featured: false,
    views: 456,
    readingTime: 5,
    publishedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
  },
];

async function seed() {
  try {
    console.log('🔌 A conectar à base de dados...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado!');

    const RevistaStory = mongoose.models.RevistaStory ||
      mongoose.model('RevistaStory', RevistaStorySchema);

    // Limpar histórias existentes de seed (opcional)
    const existing = await RevistaStory.countDocuments();
    if (existing > 0) {
      console.log(`⚠️  Já existem ${existing} histórias. A adicionar novas apenas se slug não existir...`);
    }

    let created = 0;
    let skipped = 0;

    for (const story of STORIES) {
      const exists = await RevistaStory.findOne({ slug: story.slug });
      if (exists) {
        console.log(`   ⏭  Ignorado (já existe): "${story.title}"`);
        skipped++;
        continue;
      }
      await RevistaStory.create(story);
      console.log(`   ✓ Criado: "${story.title}"`);
      created++;
    }

    console.log(`\n🎉 Seed concluído! ${created} criadas, ${skipped} ignoradas.`);
    console.log('👉 Acede a: http://localhost:3000/revista\n');
  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
