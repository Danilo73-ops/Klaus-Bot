const CATEGORIAS_NEKOS_BEST = {
  neko: 'neko',
  kitsune: 'kitsune'
}

async function buscarNekosApi() {
  const resposta = await fetch(
    'https://api.nekosapi.com/v4/images/random?rating=safe&limit=1',
    {
      headers: {
        'User-Agent': 'KlausBot/1.0'
      }
    }
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

  // Segurança extra:
  // mesmo pedindo rating=safe,
  // só aceitamos explicitamente SAFE.
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
    rating: resultado.rating || 'safe'
  }
}

async function buscarNekosBest(categoria) {
  if (categoria === 'random') {
    const opcoes =
      Object.keys(CATEGORIAS_NEKOS_BEST)

    categoria =
      opcoes[
        Math.floor(
          Math.random() * opcoes.length
        )
      ]
  }

  if (!CATEGORIAS_NEKOS_BEST[categoria]) {
    categoria = 'neko'
  }

  const resposta = await fetch(
    `https://nekos.best/api/v2/${CATEGORIAS_NEKOS_BEST[categoria]}`,
    {
      headers: {
        'User-Agent': 'KlausBot/1.0'
      }
    }
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
      'nekos.best não retornou imagem'
    )
  }

  return {
    categoria,
    url: resultado.url,
    artista:
      resultado.artist_name || null,
    fonte: 'nekos.best',
    rating: 'safe'
  }
}

async function buscar(categoria = 'random') {
  /*
   * Neko e Kitsune continuam usando nekos.best
   * porque ela já possui essas categorias
   * funcionando no Klaus.
   *
   * !anime sem categoria usa primeiro
   * o catálogo gigante da Nekos API v4.
   */

  if (
    categoria === 'neko' ||
    categoria === 'kitsune'
  ) {
    return buscarNekosBest(categoria)
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
      '🔄 Tentando fallback nekos.best...'
    )

    const resultado =
      await buscarNekosBest('random')

    console.log(
      '✅ ANIME PROVIDER: nekos.best FALLBACK'
    )

    return resultado
  }
}

module.exports = {
  buscar,
  buscarNekosApi,
  buscarNekosBest
}
