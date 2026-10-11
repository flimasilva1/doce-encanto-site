# Doce Encanto Bolos Artesanais — site portfólio

Site vitrine para confeitaria artesanal: galeria de bolos com filtro, kits festa,
passo a passo de encomenda, depoimentos e contato. Não tem venda online: todos
os botões levam ao WhatsApp com a mensagem já preenchida.

Feito com **Node.js + Express** e HTML, CSS e JavaScript puros. Não usa banco de
dados: **todo o conteúdo fica em arquivos JSON** na pasta `data/`.

```
doce-encanto/
├── data/
│   ├── negocio.json       ← nome, WhatsApp, Instagram, horário, textos, cores, SEO
│   ├── produtos.json      ← categorias, bolos e kits festa
│   └── depoimentos.json   ← depoimentos de clientes
├── public/
│   ├── images/
│   │   ├── bolos/         ← fotos dos bolos
│   │   ├── kits/          ← fotos dos kits
│   │   ├── destaque.jpg            ← foto grande do início
│   │   ├── sobre-jessica.jpg       ← foto da seção "Sobre"
│   │   └── og-compartilhamento.jpg ← imagem que aparece ao compartilhar o link
│   ├── css/style.css
│   ├── js/app.js          ← monta as seções lendo os JSON
│   └── index.html
├── server.js
└── package.json
```

---

## 1. Como rodar localmente

Pré-requisito: [Node.js](https://nodejs.org) 24 (versão LTS).

```bash
npm install
npm start
```

Abra **http://localhost:3000** no navegador.

Para desenvolvimento, `npm run dev` reinicia o servidor sozinho quando você
altera o `server.js`. Alterações nos JSON, imagens, CSS e JS aparecem só de
atualizar a página (F5).

Para testar no celular na mesma rede Wi-Fi, use o IP do computador, por exemplo
`http://192.168.0.10:3000`.

---

## 2. Como trocar os dados fictícios pelos reais

Edite apenas os arquivos da pasta `data/`. Não é preciso mexer no HTML.

### `data/negocio.json` — dados do negócio

| Campo | O que é |
|---|---|
| `nome`, `nomeCurto` | Nome completo e nome curto (aparece no menu) |
| `responsavel` | Nome completo da boleira |
| `responsavelApelido` | Como ela é chamada (usado no "Olá, …!" do WhatsApp) |
| `cidades`, `estado` | Área de atendimento |
| `whatsapp.exibicao` | Número como aparece no site: `(81) 90000-0000` |
| `whatsapp.numero` | **Só números**, com 55 + DDD: `5581900000000` |
| `instagram.usuario` / `instagram.url` | `@perfil` e o link completo do perfil |
| `horario` | Horário de atendimento |
| `antecedenciaMinimaDias` | Antecedência mínima para encomendas (número) |
| `cores` | Cores da marca em hexadecimal (`#f8dfe4`) |
| `seo.titulo` / `seo.descricao` | Título e descrição para Google e compartilhamento |
| `inicio` | Título, frase, foto e texto do botão do topo |
| `sobre` | Título, parágrafos, assinatura e foto da seção "Sobre" |
| `secoes` | Título e subtítulo de cada seção |
| `comoEncomendar` | Passos, aviso de antecedência e observação |
| `mensagens` | Mensagens prontas do WhatsApp (veja abaixo) |

**Mensagens do WhatsApp** — os trechos entre chaves são trocados automaticamente:

- `{nome}` → nome do negócio · `{responsavel}` → nome completo da boleira · `{apelido}` → como ela é chamada
- `{bolo}` → nome do bolo (botão "Quero um bolo assim", na foto ampliada)
- `{kit}` e `{pessoas}` → nome do kit e número de pessoas (botão "Quero este kit")
- Use `*texto*` para deixar em **negrito** no WhatsApp.

Nos textos de "Como encomendar", `{antecedencia}` vira o número de dias.

### `data/depoimentos.json`

Cada depoimento tem `nome`, `cidade`, `ocasiao`, `nota` (1 a 5) e `texto`.

> **Atenção ao editar JSON:** use aspas duplas, separe os itens com vírgula e não
> deixe vírgula depois do último item. Se o site ficar em branco, cole o arquivo em
> [jsonlint.com](https://jsonlint.com) para achar o erro. O VS Code também
> sublinha erros em vermelho.

---

## 3. Como adicionar um bolo ou kit e trocar as fotos

### Adicionar um bolo

Em `data/produtos.json`, copie um bloco da lista `"bolos"` e altere:

```json
{
  "nome": "Bolo de Abacaxi com Coco",
  "categoria": "aniversario",
  "descricao": "Massa branca, abacaxi caramelizado e creme de coco.",
  "tamanho": "Redondo 20 cm (aprox. 2,5 kg)",
  "rendimento": "Serve 25 fatias",
  "imagem": "images/bolos/aniversario-abacaxi-coco.jpg"
}
```

- `categoria` precisa ser um dos `id` da lista `"categorias"`:
  `aniversario`, `casamento`, `infantil`, `bolo-no-pote`, `bolo-caseiro`.
- Os bolos aparecem na ordem do arquivo.
- Para criar uma categoria nova, adicione em `"categorias"`
  (ex.: `{ "id": "doces-finos", "nome": "Doces finos" }`). O botão de filtro
  aparece sozinho quando houver pelo menos um bolo nela.
- Para remover um bolo, apague o bloco (e a vírgula que sobrar).

### Adicionar um kit

Na lista `"kits"` do mesmo arquivo:

```json
{
  "nome": "Kit Casamento",
  "pessoas": 100,
  "descricao": "Para a festa dos sonhos.",
  "itens": ["Bolo de 3 andares", "300 doces finos", "500 salgados"],
  "imagem": "images/kits/kit-casamento-100-pessoas.jpg"
}
```

### Trocar as fotos

As imagens atuais são **exemplos** e mostram na própria imagem o nome do arquivo
que devem receber. Para trocar:

1. Salve a foto real **com exatamente o mesmo nome** do arquivo de exemplo
   (ex.: `public/images/bolos/aniversario-red-velvet.jpg`) e substitua o arquivo.
2. Ou use um nome novo e atualize o campo `"imagem"` no JSON.

Dicas para o site ficar rápido e bonito:

| Foto | Formato ideal | Tamanho sugerido |
|---|---|---|
| Bolos (`images/bolos/`) | quadrada | 900 × 900 px |
| Kits (`images/kits/`) | 4:3 (deitada) | 1000 × 750 px |
| Destaque do início | deitada | 1600 × 1000 px |
| Foto do "Sobre" | 4:5 (em pé) | 800 × 1000 px |
| Compartilhamento (`og-compartilhamento.jpg`) | **exatamente** 1200 × 630 px | — |

- Use **JPG** com até ~200 KB cada. Para reduzir, use
  [squoosh.app](https://squoosh.app) (gratuito, no navegador).
- Fotos de outros formatos funcionam: o site recorta automaticamente para caber.
- Nomes de arquivo sem acentos, sem espaços e em minúsculas (`bolo-de-milho.jpg`).
- O navegador guarda as fotos em cache por 1 dia; após trocar uma foto
  mantendo o nome, use Ctrl+F5 para ver a nova imediatamente.

---

## 4. Publicar no Railway

### 4.1. Subir o projeto para o GitHub

O repositório git já foi iniciado com o primeiro commit.

1. Crie uma conta em [github.com](https://github.com), se ainda não tiver.
2. Clique em **New repository**, dê um nome (ex.: `doce-encanto-site`),
   deixe **sem** README/.gitignore (o projeto já tem) e clique em **Create repository**.
3. No terminal, dentro da pasta do projeto, rode os comandos que o GitHub mostra
   em "…or push an existing repository from the command line":

```bash
git remote add origin https://github.com/SEU-USUARIO/doce-encanto-site.git
git branch -M main
git push -u origin main
```

Depois, a cada alteração:

```bash
git add .
git commit -m "Atualiza fotos dos bolos"
git push
```

O Railway publica a nova versão automaticamente a cada `git push`.

> Se um `git push` não gerar uma nova publicação no Railway, confira se o
> aplicativo do Railway tem acesso ao repositório em
> **github.com/settings/installations → Railway → Configure → Repository access**.

### 4.2. Criar o projeto no Railway

1. Acesse [railway.com](https://railway.com) e entre com a conta do GitHub.
2. Clique em **New Project → Deploy from GitHub repo**.
3. Autorize o Railway a acessar o repositório e escolha `doce-encanto-site`.
4. O Railway detecta o Node.js pelo `package.json`, roda `npm install` e
   `npm start` sozinho. A porta é definida pelo Railway na variável `PORT`,
   que o servidor já usa. Aguarde o deploy ficar **Active/Success**.

Não é preciso configurar variáveis de ambiente. (Opcional: `SITE_URL` com o
endereço final, ex. `https://www.doceencanto.com.br`, fixa o link usado no
compartilhamento.)

Para monitorar a saúde do site, em **Settings → Deploy → Healthcheck Path**
você pode informar `/healthz`.

### 4.3. Gerar o domínio público

1. Abra o serviço no Railway → aba **Settings** → seção **Networking**.
2. Clique em **Generate Domain**. Se pedir a porta, informe a que aparece nos
   logs (o Railway normalmente já sugere a correta).
3. Você recebe um endereço como `doce-encanto-site-production.up.railway.app`.
   Já é possível acessar e compartilhar.

### 4.4. Conectar um domínio próprio (ex.: `doceencanto.com.br`)

1. Registre o domínio (para `.com.br`, em [registro.br](https://registro.br)).
2. No Railway: **Settings → Networking → Custom Domain**, digite
   `www.doceencanto.com.br` e confirme.
3. O Railway mostra um registro **CNAME** (e, às vezes, um registro **TXT** de
   verificação). Copie os valores.
4. No painel do seu provedor de DNS (no Registro.br: *Domínio → Editar zona*),
   crie:
   - `CNAME` com nome `www` apontando para o valor informado pelo Railway;
   - o `TXT` de verificação, se houver.
5. Aguarde a propagação (de minutos a algumas horas). O Railway emite o
   certificado HTTPS automaticamente.
6. Para o endereço sem `www` (`doceencanto.com.br`) também funcionar, use um
   provedor de DNS que aceite CNAME na raiz (ex.: Cloudflare, gratuito) e adicione
   também esse domínio no Railway, ou configure um redirecionamento de
   `doceencanto.com.br` para `www.doceencanto.com.br` no provedor.

### 4.5. Testar o compartilhamento

Depois de publicado, cole o link em
[developers.facebook.com/tools/debug](https://developers.facebook.com/tools/debug/)
e clique em **Scrape Again** para conferir título, descrição e imagem que vão
aparecer no WhatsApp e Instagram. O WhatsApp guarda a prévia em cache; se você
trocar a imagem, pode levar alguns dias para atualizar em conversas antigas.
