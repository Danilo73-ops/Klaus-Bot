const fs = require('fs')
const path = require('path')

const CONFIG =
  require('../config')

const HISTORICO_PATH =
  path.join(__dirname, '..', 'historico.json')

const LIMITE_RECENTES = 50

function carregarHistorico() {
  try {
    return JSON.parse(
      fs.readFileSync(HISTORICO_PATH, 'utf8')
    )
  } catch {
    return {}
  }
}

function salvarHistorico(historico) {
  fs.writeFileSync(
    HISTORICO_PATH,
    JSON.stringify(historico, null, 2)
  )
}

function categoriaExiste(categoria) {
  return Boolean(CONFIG[categoria])
}

function normalizarUrl(url, base) {
  try {
    return new URL(url, base).href
  } catch {
    return null
  }
}

function extrairImagens(html, paginaUrl) {
  const encontradas = new Set()

  const regex =
    /(?:src|data-src|data-original|data-lazy-src)=["']([^"']+)["']/gi

  let match

  while ((match = regex.exec(html)) !== null) {
    const original = match[1]

    if (
      !/\.(webp|png|jpe?g|gif)(?:\?|$)/i.test(original)
    ) {
      continue
    }

    const url =
      normalizarUrl(original, paginaUrl)

    if (!url) continue

    encontradas.add(url)
  }

  return [...encontradas]
}

async function buscarPack(link) {
  const controller =
    new AbortController()

  const timeout =
    setTimeout(
      () => controller.abort(),
      8000
    )

  try {
    const resposta =
      await fetch(link, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 KlausBot/1.0',
          Accept:
            'text/html,application/xhtml+xml'
        }
      })

    if (!resposta.ok) {
      throw new Error(
        `Pack respondeu HTTP ${resposta.status}`
      )
    }

    const html =
      await resposta.text()

    return extrairImagens(
      html,
      link
    )

  } finally {
    clearTimeout(timeout)
  }
}

async function buscarTodas(categoria) {
  const info =
    CONFIG[categoria]

  if (!info) {
    throw new Error(
      `Categoria inexistente: ${categoria}`
    )
  }

  const links =
    info.links.filter(Boolean)

  if (!links.length) {
    throw new Error(
      `Nenhum pack cadastrado para ${info.nome}`
    )
  }

  const resultados =
    await Promise.allSettled(
      links.map(buscarPack)
    )

  const imagens =
    new Set()

  for (const resultado of resultados) {
    if (
      resultado.status !== 'fulfilled'
    ) {
      continue
    }

    for (const url of resultado.value) {
      imagens.add(url)
    }
  }

  return [...imagens]
}

function escolherSemRepetir(
  categoria,
  imagens
) {
  const historico =
    carregarHistorico()

  const recentes =
    Array.isArray(historico[categoria])
      ? historico[categoria]
      : []

  let disponiveis =
    imagens.filter(
      url => !recentes.includes(url)
    )

  if (!disponiveis.length) {
    disponiveis = imagens
    recentes.length = 0
  }

  if (!disponiveis.length) {
    throw new Error(
      'Nenhuma figurinha encontrada nos packs'
    )
  }

  const escolhida =
    disponiveis[
      Math.floor(
        Math.random() *
        disponiveis.length
      )
    ]

  recentes.push(escolhida)

  while (
    recentes.length >
    LIMITE_RECENTES
  ) {
    recentes.shift()
  }

  historico[categoria] =
    recentes

  salvarHistorico(historico)

  return escolhida
}

async function buscar(categoria) {
  categoria =
    String(categoria || '')
      .trim()
      .toLowerCase()

  if (!categoriaExiste(categoria)) {
    throw new Error(
      `Categoria inválida: ${categoria}`
    )
  }

  const imagens =
    await buscarTodas(categoria)

  const url =
    escolherSemRepetir(
      categoria,
      imagens
    )

  return {
    categoria,
    nome: CONFIG[categoria].nome,
    url,
    totalEncontrado: imagens.length
  }
}

module.exports = {
  buscar,
  categoriaExiste
}
