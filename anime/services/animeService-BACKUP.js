const CATEGORIAS = {
  neko: 'neko',
  kitsune: 'kitsune'
}

function categoriaAleatoria() {
  const opcoes = Object.keys(CATEGORIAS)

  return opcoes[
    Math.floor(Math.random() * opcoes.length)
  ]
}

async function buscar(categoria = 'random') {
  if (categoria === 'random') {
    categoria = categoriaAleatoria()
  }

  if (!CATEGORIAS[categoria]) {
    throw new Error('Categoria inválida.')
  }

  const url =
    `https://nekos.best/api/v2/${CATEGORIAS[categoria]}`

  const resposta = await fetch(url, {
    headers: {
      'User-Agent': 'KlausBot/1.0'
    }
  })

  if (!resposta.ok) {
    throw new Error(
      `API respondeu HTTP ${resposta.status}`
    )
  }

  const dados = await resposta.json()
  const resultado = dados.results?.[0]

  if (!resultado?.url) {
    throw new Error(
      'A API não retornou nenhuma imagem.'
    )
  }

  return {
    categoria,
    url: resultado.url,
    artista:
      resultado.artist_name || null,
    fonte:
      resultado.source_url || null
  }
}

module.exports = {
  buscar
}
