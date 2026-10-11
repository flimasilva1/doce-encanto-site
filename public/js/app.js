'use strict';

// Monta o site a partir dos arquivos da pasta /data.
// Para alterar conteúdo, edite os JSON — não é preciso mexer neste arquivo.

(function () {
  const $ = (sel, raiz = document) => raiz.querySelector(sel);
  const $$ = (sel, raiz = document) => Array.from(raiz.querySelectorAll(sel));

  // Cria elementos com segurança (o texto nunca é interpretado como HTML).
  function h(tag, props, ...filhos) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const f of filhos.flat()) {
      if (f == null || f === false) continue;
      el.append(f instanceof Node ? f : document.createTextNode(String(f)));
    }
    return el;
  }

  function icone(id) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'icone');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS(ns, 'use');
    use.setAttribute('href', `#i-${id}`);
    svg.append(use);
    return svg;
  }

  function foto(src, alt, largura, altura) {
    const img = h('img', {
      src: `/${String(src).replace(/^\/+/, '')}`,
      alt,
      width: largura,
      height: altura,
      loading: 'lazy',
      decoding: 'async'
    });
    img.addEventListener('error', () => img.closest('.foto-moldura')?.classList.add('sem-foto'), { once: true });
    return img;
  }

  const preencher = (texto, vars) =>
    String(texto ?? '').replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));

  const caminho = (obj, rota) => rota.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);

  async function carregar(nome) {
    const r = await fetch(`/data/${nome}.json`, { cache: 'no-cache' });
    if (!r.ok) throw new Error(`Não foi possível carregar ${nome}.json (${r.status})`);
    return r.json();
  }

  function listaCidades(cidades) {
    if (cidades.length <= 1) return cidades.join('');
    return `${cidades.slice(0, -1).join(', ')} e ${cidades[cidades.length - 1]}`;
  }

  // ---------------------------------------------------------------------------

  async function iniciar() {
    configurarMenu();

    let negocio, produtos, depoimentos;
    try {
      [negocio, produtos, depoimentos] = await Promise.all([
        carregar('negocio'),
        carregar('produtos'),
        carregar('depoimentos')
      ]);
    } catch (err) {
      console.error(err);
      $('#bolos .container').append(
        h('p', { class: 'erro' }, 'Não foi possível carregar o conteúdo agora. Atualize a página ou fale com a gente pelo WhatsApp.')
      );
      return;
    }

    const varsBase = { nome: negocio.nome, responsavel: negocio.responsavel };
    const linkWhats = (mensagem) =>
      `https://wa.me/${negocio.whatsapp.numero}?text=${encodeURIComponent(mensagem)}`;

    // Textos simples: <elemento data-texto="caminho.no.negocio.json">
    $$('[data-texto]').forEach((el) => {
      const valor = caminho(negocio, el.dataset.texto);
      if (valor != null) el.textContent = preencher(valor, { antecedencia: negocio.antecedenciaMinimaDias });
    });

    // Todos os botões gerais do WhatsApp
    $$('[data-wa="padrao"]').forEach((a) => {
      a.href = linkWhats(preencher(negocio.mensagens.padrao, varsBase));
    });

    renderizarSobre(negocio);
    renderizarBolos(negocio, produtos, (bolo) =>
      linkWhats(preencher(negocio.mensagens.bolo, { ...varsBase, bolo: bolo.nome })));
    renderizarKits(produtos.kits, (kit) =>
      linkWhats(preencher(negocio.mensagens.kit, { ...varsBase, kit: kit.nome, pessoas: kit.pessoas })));
    renderizarPassos(negocio);
    renderizarDepoimentos(depoimentos);
    renderizarContato(negocio, linkWhats(preencher(negocio.mensagens.padrao, varsBase)));

    $('[data-rodape]').textContent =
      `© ${new Date().getFullYear()} ${negocio.nome} · ${listaCidades(negocio.cidades)}/${negocio.estado}`;

    animarAoRolar();
  }

  // --- Menu (celular) --------------------------------------------------------

  function configurarMenu() {
    const botao = $('.menu-botao');
    const menu = $('#menu');
    const fechar = () => {
      menu.classList.remove('aberto');
      botao.setAttribute('aria-expanded', 'false');
    };
    botao.addEventListener('click', () => {
      const aberto = menu.classList.toggle('aberto');
      botao.setAttribute('aria-expanded', String(aberto));
    });
    $$('a', menu).forEach((a) => a.addEventListener('click', fechar));
    document.addEventListener('keydown', (e) => e.key === 'Escape' && fechar());

    const topo = $('#topo');
    const aoRolar = () => topo.classList.toggle('rolado', window.scrollY > 10);
    window.addEventListener('scroll', aoRolar, { passive: true });
    aoRolar();
  }

  // --- Sobre -----------------------------------------------------------------

  function renderizarSobre(negocio) {
    const { sobre } = negocio;
    $('[data-sobre-foto]').append(foto(sobre.imagem, sobre.imagemAlt, 800, 1000));
    $('[data-sobre-paragrafos]').append(...sobre.paragrafos.map((p) => h('p', null, p)));
  }

  // --- Galeria de bolos + filtro + lightbox ----------------------------------

  function renderizarBolos(negocio, produtos, linkBolo) {
    const nomesCategoria = Object.fromEntries(produtos.categorias.map((c) => [c.id, c.nome]));
    const galeria = $('[data-galeria]');
    const filtros = $('[data-filtros]');
    const contagem = $('[data-contagem]');

    const cartoes = produtos.bolos.map((bolo, i) => {
      const detalhes = [bolo.tamanho, bolo.rendimento].filter(Boolean).join(' · ');
      return h('li', { class: 'bolo revelar', 'data-categoria': bolo.categoria },
        h('button', {
          class: 'bolo__foto foto-moldura',
          type: 'button',
          'aria-label': `Ampliar foto: ${bolo.nome}`,
          onclick: () => lightbox.abrir(i)
        }, foto(bolo.imagem, bolo.nome, 800, 800)),
        h('div', { class: 'bolo__info' },
          h('span', { class: 'etiqueta' }, nomesCategoria[bolo.categoria] || bolo.categoria),
          h('h3', null, bolo.nome),
          h('p', null, bolo.descricao),
          detalhes && h('p', { class: 'bolo__detalhes' }, detalhes)
        )
      );
    });
    galeria.append(...cartoes);

    const categoriasUsadas = produtos.categorias.filter((c) => produtos.bolos.some((b) => b.categoria === c.id));
    const opcoes = [{ id: 'todos', nome: 'Todos' }, ...categoriasUsadas];
    let ativa = 'todos';

    function aplicarFiltro(id) {
      ativa = id;
      let visiveis = 0;
      cartoes.forEach((li) => {
        const mostrar = id === 'todos' || li.dataset.categoria === id;
        li.hidden = !mostrar;
        if (mostrar) visiveis++;
      });
      $$('button', filtros).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filtro === id)));
      contagem.textContent = `${visiveis} ${visiveis === 1 ? 'bolo' : 'bolos'}`;
    }

    filtros.append(...opcoes.map((c) =>
      h('button', {
        type: 'button',
        class: 'filtro',
        'data-filtro': c.id,
        'aria-pressed': 'false',
        onclick: () => aplicarFiltro(c.id)
      }, c.nome)
    ));
    aplicarFiltro(ativa);

    const lightbox = criarLightbox(produtos.bolos, cartoes, linkBolo);
  }

  function criarLightbox(bolos, cartoes, linkBolo) {
    const dialogo = $('.lightbox');
    const parte = (nome) => $(`[data-lb="${nome}"]`, dialogo);
    const img = parte('img');
    let atual = 0;

    // Navega apenas entre os bolos visíveis no filtro atual
    const visiveis = () => cartoes.map((c, i) => (c.hidden ? -1 : i)).filter((i) => i >= 0);

    function mostrar(i) {
      atual = i;
      const bolo = bolos[i];
      img.src = `/${bolo.imagem.replace(/^\/+/, '')}`;
      img.alt = bolo.nome;
      parte('nome').textContent = bolo.nome;
      parte('descricao').textContent = bolo.descricao;
      parte('detalhes').textContent = [bolo.tamanho, bolo.rendimento].filter(Boolean).join(' · ');
      parte('whatsapp').href = linkBolo(bolo);
      const unico = visiveis().length < 2;
      parte('anterior').hidden = unico;
      parte('proxima').hidden = unico;
    }

    function passo(direcao) {
      const lista = visiveis();
      const pos = lista.indexOf(atual);
      mostrar(lista[(pos + direcao + lista.length) % lista.length]);
    }

    parte('fechar').addEventListener('click', () => dialogo.close());
    parte('anterior').addEventListener('click', () => passo(-1));
    parte('proxima').addEventListener('click', () => passo(1));
    dialogo.addEventListener('click', (e) => { if (e.target === dialogo) dialogo.close(); });
    dialogo.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') passo(-1);
      if (e.key === 'ArrowRight') passo(1);
    });
    dialogo.addEventListener('close', () => document.body.classList.remove('sem-rolagem'));

    // Deslizar o dedo para trocar de foto no celular
    let inicioX = null;
    dialogo.addEventListener('touchstart', (e) => { inicioX = e.touches[0].clientX; }, { passive: true });
    dialogo.addEventListener('touchend', (e) => {
      if (inicioX == null) return;
      const dx = e.changedTouches[0].clientX - inicioX;
      if (Math.abs(dx) > 50) passo(dx > 0 ? -1 : 1);
      inicioX = null;
    });

    return {
      abrir(i) {
        mostrar(i);
        document.body.classList.add('sem-rolagem');
        if (typeof dialogo.showModal === 'function') dialogo.showModal();
        else dialogo.setAttribute('open', '');
      }
    };
  }

  // --- Kits ------------------------------------------------------------------

  function renderizarKits(kits, linkKit) {
    $('[data-kits]').append(...kits.map((kit) =>
      h('li', { class: 'kit revelar' },
        h('div', { class: 'kit__foto foto-moldura' }, foto(kit.imagem, kit.nome, 800, 600)),
        h('div', { class: 'kit__info' },
          h('h3', null, kit.nome),
          h('p', { class: 'kit__pessoas' }, icone('pessoas'), `Serve ${kit.pessoas} pessoas`),
          kit.descricao && h('p', { class: 'kit__descricao' }, kit.descricao),
          h('ul', { class: 'kit__itens' }, kit.itens.map((item) => h('li', null, icone('check'), item))),
          h('a', {
            class: 'botao botao--principal',
            href: linkKit(kit),
            target: '_blank',
            rel: 'noopener',
            'data-kit': kit.nome
          }, icone('whatsapp'), 'Quero este kit')
        )
      )
    ));
  }

  // --- Como encomendar -------------------------------------------------------

  function renderizarPassos(negocio) {
    const dias = negocio.antecedenciaMinimaDias;
    const { passos, aviso } = negocio.comoEncomendar;
    $('[data-passos]').append(...passos.map((p, i) =>
      h('li', { class: 'passo revelar' },
        h('span', { class: 'passo__numero', 'aria-hidden': 'true' }, i + 1),
        h('h3', null, p.titulo),
        h('p', null, preencher(p.texto, { antecedencia: dias }))
      )
    ));
    $('[data-antecedencia]').textContent = `Antecedência mínima: ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
    $('[data-aviso]').textContent = preencher(aviso, { antecedencia: dias });
  }

  // --- Depoimentos -----------------------------------------------------------

  function renderizarDepoimentos(depoimentos) {
    $('[data-depoimentos]').append(...depoimentos.map((d) => {
      const nota = Math.max(0, Math.min(5, Number(d.nota) || 5));
      return h('li', { class: 'depoimento revelar' },
        h('p', { class: 'estrelas', 'aria-label': `Nota ${nota} de 5` }, '★'.repeat(nota) + '☆'.repeat(5 - nota)),
        h('blockquote', null, h('p', null, `“${d.texto}”`)),
        h('p', { class: 'depoimento__autor' },
          h('strong', null, d.nome),
          h('span', null, [d.ocasiao, d.cidade].filter(Boolean).join(' · '))
        )
      );
    }));
  }

  // --- Contato ---------------------------------------------------------------

  function renderizarContato(negocio, linkPadrao) {
    const item = (ic, titulo, conteudo) =>
      h('li', { class: 'contato__item revelar' },
        h('span', { class: 'contato__icone' }, icone(ic)),
        h('div', null, h('h3', null, titulo), conteudo));

    $('[data-contato]').append(
      item('whatsapp', 'WhatsApp',
        h('a', { href: linkPadrao, target: '_blank', rel: 'noopener', 'data-wa': 'padrao' }, negocio.whatsapp.exibicao)),
      item('instagram', 'Instagram',
        h('a', { href: negocio.instagram.url, target: '_blank', rel: 'noopener' }, negocio.instagram.usuario)),
      item('local', 'Área de atendimento',
        h('p', null, `${listaCidades(negocio.cidades)}/${negocio.estado}`)),
      item('relogio', 'Horário',
        h('p', null, negocio.horario))
    );
  }

  // --- Animação suave ao rolar ----------------------------------------------

  function animarAoRolar() {
    const elementos = $$('.revelar');
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elementos.forEach((el) => el.classList.add('visivel'));
      return;
    }
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visivel');
          obs.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -40px 0px' });
    elementos.forEach((el) => obs.observe(el));
  }

  iniciar();
})();
