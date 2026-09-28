async function buscarNekosBest(tag) {
  const controller =
    new AbortController()

  const timer =
    setTimeout(
      () => controller.abort(),
      5000
    )

  try {
    const resposta =
      await fetch(
        `https://nekos.best/api/v2/${encodeURIComponent(tag)}`,
        {
          headers: {
            'User-Agent': 'KlausBot/1.2'
          },
          signal: controller.signal
        }
      )

    if (!resposta.ok) {
      throw new Error(
        `nekos.best HTTP ${resposta.status}`
      )
    }

    const dados =
      await resposta.json()

    const imagem =
      dados.results?.[0]

    if (!imagem?.url) {
      throw new Error(
        'nekos.best não retornou imagem'
      )
    }

    return {
      url: imagem.url,
      provider: 'nekos.best',
      tipo: 'image',
      tagUsada: tag,
      artista:
        imagem.artist_name ||
        null
    }
  } finally {
    clearTimeout(timer)
  }
}

module.exports = {
  buscarNekosBest
}
