const { CATEGORIAS } = require('../config')

function categoriaExiste(categoria) {
  return (
    categoria === 'random' ||
    Object.prototype.hasOwnProperty.call(
      CATEGORIAS,
      categoria
    )
  )
}

function listarCategorias() {
  return Object.keys(CATEGORIAS)
}

function sortearItem(lista) {
  return lista[
    Math.floor(Math.random() * lista.length)
  ]
}

function embaralhar(lista) {
  const copia = [...lista]

  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }

  return copia
}

function resolverInfoCategoria(categoria) {
  if (categoria === 'random') {
    const todas = listarCategorias()
    return {
      chave: sortearItem(todas),
      info: null
    }
  }

  return {
    chave: categoria,
    info: CATEGORIAS[categoria]
  }
}

async function buscarWaifuIm(tag) {
  const controller = new AbortController()

  const timer = setTimeout(
    () => controller.abort(),
    7000
  )

  try {
    const url =
      'https://api.waifu.im/images' +
      '?IncludedTags=' + encodeURIComponent(tag) +
      '&IsNsfw=false' +
      '&PageSize=1'

    const resposta = await fetch(url, {
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

    const dados = await resposta.json()

    const imagem =
      dados?.items?.[0] ||
      dados?.images?.[0]

    if (!imagem?.url) {
      throw new Error(
        `Nenhuma imagem para a tag ${tag}`
      )
    }

    return {
      provider: 'waifu.im',
      url: imagem.url,
      artista:
        imagem.artist?.name ||
        imagem.artist_name ||
        null,
      tagReal: tag
    }
  } finally {
    clearTimeout(timer)
  }
}

async function buscarPorInfo(chave, info) {
  const tentativas =
    info.modo === 'pool'
      ? embaralhar(info.pool)
      : [info.tag || chave]

  let ultimoErro = null

  for (const tag of tentativas) {
    try {
      const resultado =
        await buscarWaifuIm(tag)

      return {
        categoria: chave,
        categoriaReal: chave,
        nome: info.nome,
        grupo: info.grupo,
        ...resultado
      }
    } catch (erro) {
      ultimoErro = erro
    }
  }

  throw (
    ultimoErro ||
    new Error('Nenhuma imagem disponível agora.')
  )
}

async function buscar(categoria = 'random') {
  let { chave, info } =
    resolverInfoCategoria(categoria)

  if (!info) {
    info = CATEGORIAS[chave]
  }

  if (!info) {
    throw new Error('Categoria inválida.')
  }

  return buscarPorInfo(chave, info)
}

module.exports = {
  categoriaExiste,
  listarCategorias,
  buscar
}
