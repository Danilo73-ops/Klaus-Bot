const API_BASE =
  'https://api.waifu.im/images'

async function buscarWaifuIm(tag) {
  const controller =
    new AbortController()

  const timer =
    setTimeout(
      () => controller.abort(),
      5000
    )

  try {
    const url =
      API_BASE +
      '?IncludedTags=' +
      encodeURIComponent(tag) +
      '&IsNsfw=false' +
      '&PageSize=1'

    const resposta =
      await fetch(url, {
        headers: {
          accept: 'application/json',
          'User-Agent': 'KlausBot/1.2'
        },
        signal: controller.signal
      })

    if (!resposta.ok) {
      throw new Error(
        `Waifu.im HTTP ${resposta.status}`
      )
    }

    const dados =
      await resposta.json()

    const imagem =
      dados?.items?.[0] ||
      dados?.images?.[0]

    if (!imagem?.url) {
      throw new Error(
        'Waifu.im não retornou imagem'
      )
    }

    if (
      imagem.isNsfw === true ||
      imagem.is_nsfw === true
    ) {
      throw new Error(
        'Imagem rejeitada pelo filtro'
      )
    }

    return {
      url: imagem.url,
      provider: 'waifu.im',
      tipo: 'image',
      tagUsada: tag,
      artista:
        imagem.artist?.name ||
        imagem.artist_name ||
        null
    }
  } finally {
    clearTimeout(timer)
  }
}

module.exports = {
  buscarWaifuIm
}
