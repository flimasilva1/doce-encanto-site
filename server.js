'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const compression = require('compression');

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const DATA_DIR = path.join(__dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');
const TEMPLATE = path.join(PUBLIC_DIR, 'index.html');

const app = express();
app.set('trust proxy', true); // Railway fica atrás de um proxy HTTPS
app.disable('x-powered-by');
app.use(compression());

function lerJSON(arquivo) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, arquivo), 'utf8'));
}

function escaparHTML(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

function preencher(texto, vars) {
  return String(texto).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

function urlBase(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, '');
  return `${req.protocol}://${req.get('host')}`;
}

// A página é montada a partir de public/index.html, preenchendo os dados de
// SEO / Open Graph e o topo do site com data/negocio.json. Assim o link
// compartilhado no WhatsApp/Instagram mostra título, descrição e imagem,
// mesmo sem executar JavaScript.
function paginaInicial(req, res, next) {
  let negocio;
  let template;
  try {
    negocio = lerJSON('negocio.json');
    template = fs.readFileSync(TEMPLATE, 'utf8');
  } catch (err) {
    console.error('Erro ao ler negocio.json ou index.html:', err.message);
    return next(err);
  }

  const base = urlBase(req);
  const msgPadrao = preencher(negocio.mensagens.padrao, {
    nome: negocio.nome,
    responsavel: negocio.responsavel,
    apelido: negocio.responsavelApelido || negocio.responsavel
  });
  const cores = negocio.cores || {};
  const coresCss = `:root{${Object.entries({
    '--rosa-claro': cores.rosaClaro,
    '--rosa': cores.rosa,
    '--dourado': cores.dourado,
    '--dourado-escuro': cores.douradoEscuro,
    '--branco': cores.branco,
    '--texto': cores.texto
  }).filter(([, v]) => /^#[0-9a-f]{3,8}$/i.test(v || '')).map(([k, v]) => `${k}:${v}`).join(';')}}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Bakery',
    name: negocio.nome,
    description: negocio.seo.descricao,
    url: `${base}/`,
    image: `${base}/${negocio.seo.imagem}`,
    telephone: `+${negocio.whatsapp.numero}`,
    areaServed: negocio.cidades.map((c) => `${c} - ${negocio.estado}`),
    address: { '@type': 'PostalAddress', addressLocality: negocio.cidades[0], addressRegion: negocio.estado, addressCountry: 'BR' },
    sameAs: [negocio.instagram.url]
  };

  const vars = {
    titulo: negocio.seo.titulo,
    descricao: negocio.seo.descricao,
    nome: negocio.nome,
    nomeCurto: negocio.nomeCurto || negocio.nome,
    url: `${base}/`,
    imagem: `${base}/${negocio.seo.imagem}`,
    corTema: cores.rosaClaro || '#f8dfe4',
    heroImagem: `/${negocio.inicio.imagem}`,
    heroAlt: negocio.inicio.imagemAlt,
    heroTitulo: negocio.inicio.titulo,
    heroFrase: negocio.inicio.frase,
    heroBotao: negocio.inicio.botao,
    waLink: `https://wa.me/${negocio.whatsapp.numero}?text=${encodeURIComponent(msgPadrao)}`
  };
  const brutos = {
    coresCss,
    jsonLd: JSON.stringify(jsonLd).replace(/</g, '\\u003c')
  };

  const html = template
    .replace(/\{\{\{(\w+)\}\}\}/g, (m, k) => (k in brutos ? brutos[k] : m))
    .replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? escaparHTML(vars[k]) : m));

  res.set('Cache-Control', 'no-cache').type('html').send(html);
}

app.get(['/', '/index.html'], paginaInicial);

app.get('/healthz', (req, res) => res.type('text').send('ok'));

// Dados do site: sempre revalidados, para alterações aparecerem na hora.
app.use('/data', express.static(DATA_DIR, {
  setHeaders: (res) => res.set('Cache-Control', 'no-cache')
}));

app.use(express.static(PUBLIC_DIR, {
  index: false,
  setHeaders: (res, arquivo) => {
    const ehImagem = /\.(jpe?g|png|webp|avif|gif|svg)$/i.test(arquivo);
    res.set('Cache-Control', ehImagem ? 'public, max-age=86400' : 'public, max-age=3600');
  }
}));

// Arquivo inexistente: 404. Qualquer outra rota: volta para a página inicial.
app.use((req, res) => {
  if (path.extname(req.path)) return res.status(404).type('text').send('Arquivo não encontrado');
  res.redirect('/');
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).type('text').send('Erro ao carregar o site. Verifique os arquivos da pasta data/.');
});

app.listen(PORT, HOST, () => {
  console.log(`Doce Encanto rodando em http://localhost:${PORT}`);
});
