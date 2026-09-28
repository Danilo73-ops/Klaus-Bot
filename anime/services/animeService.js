const IMAGENS_NEKOS_BEST = {
  neko: 'neko',
  kitsune: 'kitsune',
  waifu: 'waifu',
  husbando: 'husbando'
}

const REACOES_NEKOS_BEST = {
  angry: 'angry',
  blush: 'blush',
  bored: 'bored',
  confused: 'confused',
  cry: 'cry',
  cuddle: 'cuddle',
  dance: 'dance',
  facepalm: 'facepalm',
  happy: 'happy',
  highfive: 'highfive',
  hug: 'hug',
  laugh: 'laugh',
  pat: 'pat',
  poke: 'poke',
  pout: 'pout',
  shocked: 'shocked',
  shrug: 'shrug',
  smile: 'smile',
  smug: 'smug',
  stare: 'stare',
  think: 'think',
  wave: 'wave',
  wink: 'wink'
}

async function fetchComTimeout(url, timeoutMs = 4500) {
  const controller = new AbortController()

  const timer = setTimeout(
    () => controller.abort(),
    timeoutMs
  )

  try {
    return await fetch(url, {
      headers: {
        'User-Agent': 'KlausBot/1.1'
      },
      signal: controller.signal
    })
  } finally {
    clearTimeout(timer)
  }
}

async function buscarNekosApi() {
  const resposta = await fetchComTimeout(
    'https://api.nekosapi.com/v4/images/random?rating=safe&limit=1'
  )

  if (!resposta.ok) {
    throw new Error(
      `Nekos API HTTP ${resposta.status}`
    )
  }

  const dados = await resposta.json()

  const resultado =
    Array.isArray(dados)
      ? dados[0]
      : dados

  if (!resultado?.url) {
    throw new Error(
      'Nekos API não retornou imagem'
    )
  }

  if (
    resultado.rating &&
    resultado.rating !== 'safe'
  ) {
    throw new Error(
      `Rating rejeitado: ${resultado.rating}`
    )
  }

  return {
    categoria: 'random',
    url: resultado.url,
    artista: resultado.artist_name || null,
    fonte: 'nekosapi',
    tipo: 'image',
    rating: resultado.rating || 'safe'
  }
}

async function buscarNekosBest(endpoint, categoria, tipo) {
  const resposta = await fetchComTimeout(
    `https://nekos.best/api/v2/${endpoint}`
  )

  if (!resposta.ok) {
    throw new Error(
      `nekos.best HTTP ${resposta.status}`
    )
  }

  const dados = await resposta.json()
  const resultado = dados.results?.[0]

  if (!resultado?.url) {
    throw new Error(
      'nekos.best não retornou mídia'
    )
  }

  return {
    categoria,
    url: resultado.url,
    artista:
      resultado.artist_name || null,
    fonte: 'nekos.best',
    tipo,
    rating: 'safe'
  }
}

async function buscar(categoria = 'random') {
  categoria =
    String(categoria || 'random')
      .trim()
      .toLowerCase()

  if (IMAGENS_NEKOS_BEST[categoria]) {
    return buscarNekosBest(
      IMAGENS_NEKOS_BEST[categoria],
      categoria,
      'image'
    )
  }

  if (REACOES_NEKOS_BEST[categoria]) {
    return buscarNekosBest(
      REACOES_NEKOS_BEST[categoria],
      categoria,
      'gif'
    )
  }

  if (categoria !== 'random') {
    throw new Error(
      `Categoria ainda não disponível: ${categoria}`
    )
  }

  try {
    const resultado =
      await buscarNekosApi()

    console.log(
      '✅ ANIME PROVIDER: Nekos API v4'
    )

    return resultado

  } catch (erroPrincipal) {
    console.log(
      '⚠️ Nekos API falhou:',
      erroPrincipal.message
    )

    console.log(
      '🔄 FALLBACK: nekos.best'
    )

    const opcoes =
      Object.keys(IMAGENS_NEKOS_BEST)

    const categoriaFallback =
      opcoes[
        Math.floor(
          Math.random() * opcoes.length
        )
      ]

    return buscarNekosBest(
      IMAGENS_NEKOS_BEST[categoriaFallback],
      categoriaFallback,
      'image'
    )
  }
}

module.exports = {
  buscar,
  buscarNekosApi,
  buscarNekosBest,
  IMAGENS_NEKOS_BEST,
  REACOES_NEKOS_BEST
}
