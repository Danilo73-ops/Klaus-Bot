const { CATEGORIAS } = require('../config')

const recentes = new Map()
const LIMITE_RECENTES = 50

function categoriaExiste(categoria) {
  return categoria === 'random' || Boolean(CATEGORIAS[categoria])
}

function lembrar(categoria, url) {
  if (!recentes.has(categoria)) {
    recentes.set(categoria, [])
  }

  const lista = recentes.get(categoria)

  lista.push(url)

  while (lista.length > LIMITE_RECENTES) {
    lista.shift()
  }
}

function jaFoiUsada(categoria, url) {
  return recentes.get(categoria)?.includes(url) || false
}

async function buscarWaifuIm(tag, categoria) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 7000)

  try {
    const url =
      'https://api.waifu.im/images' +
      '?IncludedTags=' + encodeURIComponent(tag) +
      '&IsNsfw=true' +
      '&PageSize=20'

    const resposta = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json'
      }
    })

    if (!resposta.ok) {
      throw new Error(`waifu.im respondeu HTTP ${resposta.status}`)
    }

    const dados = await resposta.json()

    const imagens = Array.isArray(dados?.items)
      ? dados.items
      : Array.isArray(dados?.images)
        ? dados.images
        : []
    console.log('🔎 TAG:', tag)
console.log('🔎 ITEMS RECEBIDOS:', imagens.length)
console.log('🔎 TOTAL API:', dados?.totalCount)
    console.log('🔎 PRIMEIRO ITEM:', imagens[0])
console.log('🔎 URL DO PRIMEIRO:', imagens[0]?.url)

    const naoRepetidas = imagens.filter(
  item =>
    item?.url &&
    !jaFoiUsada(categoria, item.url)
)

const candidatas = naoRepetidas.length
  ? naoRepetidas
  : imagens.filter(item => item?.url)

if (!candidatas.length) {
  throw new Error('Nenhuma imagem encontrada')
}

const escolhida =
  candidatas[Math.floor(Math.random() * candidatas.length)]

lembrar(categoria, escolhida.url)

    return {
      provider: 'waifu.im',
      url: escolhida.url,
      tagReal: tag,
      artist:
        escolhida?.artist?.name ||
        escolhida?.artist?.artist_name ||
        null
    }
  } finally {
    clearTimeout(timeout)
  }
}

async function buscar(categoria = 'random') {
  categoria = String(categoria || 'random').toLowerCase().trim()

  if (categoria === 'random') {
    const categorias = Object.keys(CATEGORIAS)

    if (!categorias.length) {
      throw new Error('Nenhuma categoria disponível')
    }

    categoria =
      categorias[Math.floor(Math.random() * categorias.length)]
  }

  const info = CATEGORIAS[categoria]

  if (!info) {
    throw new Error(`Categoria inválida: ${categoria}`)
  }

  // 1:1: a categoria usa exatamente a própria tag configurada.
  const resultado = await buscarWaifuIm(info.tag, categoria)

  return {
    ...resultado,
    categoria,
    nome: info.nome
  }
}

module.exports = {
  buscar,
  categoriaExiste
}
