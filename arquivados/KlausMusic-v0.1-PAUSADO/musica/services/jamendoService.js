const fs = require('fs/promises')

const {
  arquivoTemporario,
  apagarArquivo
} = require('./mediaService')

const BASE = 'https://api.jamendo.com/v3.0'
const MAX_BYTES = 50 * 1024 * 1024

function clientId() {
  const id = process.env.JAMENDO_CLIENT_ID

  if (!id) {
    throw new Error('JAMENDO_CLIENT_ID não carregado.')
  }

  return id
}

function converter(faixa) {
  return {
    id: String(faixa.id),
    titulo: faixa.name || 'Sem título',
    artista: faixa.artist_name || 'Artista desconhecido',
    album: faixa.album_name || '',
    duracao: Number(faixa.duration || 0),
    capa: faixa.album_image || faixa.image || '',
    download: faixa.audiodownload || '',
    downloadPermitido:
      faixa.audiodownload_allowed === true
  }
}

async function consultar(parametros = {}) {
  const url = new URL(`${BASE}/tracks/`)

  url.searchParams.set('client_id', clientId())
  url.searchParams.set('format', 'json')
  url.searchParams.set('audioformat', 'mp32')
  url.searchParams.set('audiodlformat', 'mp32')
  url.searchParams.set('imagesize', '300')
  url.searchParams.set('type', 'single albumtrack')

  for (const [chave, valor] of Object.entries(parametros)) {
    url.searchParams.set(chave, String(valor))
  }

  const resposta = await fetch(url)
  const dados = await resposta.json()

  if (dados.headers?.status !== 'success') {
    throw new Error(
      dados.headers?.error_message ||
      'Erro consultando Jamendo.'
    )
  }

  return (dados.results || []).map(converter)
}

async function buscar(termo, limite = 5) {
  termo = String(termo || '').trim()

  if (!termo) {
    return []
  }

  let resultados = await consultar({
    search: termo,
    limit: 50
  })

  let baixaveis = resultados.filter(
    faixa =>
      faixa.downloadPermitido &&
      faixa.download
  )

  // Se for uma palavra só, também pode ser gênero/tag.
  if (
    !baixaveis.length &&
    /^[\p{L}\p{N}-]{2,30}$/u.test(termo)
  ) {
    resultados = await consultar({
      fuzzytags: termo,
      limit: 50
    })

    baixaveis = resultados.filter(
      faixa =>
        faixa.downloadPermitido &&
        faixa.download
    )
  }

  return baixaveis.slice(0, limite)
}

async function buscarPorId(id) {
  const resultados = await consultar({
    id: String(id),
    limit: 1
  })

  return resultados[0] || null
}

async function baixar(faixa) {
  if (
    !faixa ||
    !faixa.id ||
    !faixa.downloadPermitido
  ) {
    throw new Error(
      'Essa faixa não está liberada para download.'
    )
  }

  const url = new URL(`${BASE}/tracks/file/`)

  url.searchParams.set('client_id', clientId())
  url.searchParams.set('id', faixa.id)
  url.searchParams.set('audioformat', 'mp32')
  url.searchParams.set('action', 'download')

  const resposta = await fetch(url, {
    redirect: 'follow'
  })

  if (!resposta.ok) {
    throw new Error(
      `Download HTTP ${resposta.status}`
    )
  }

  const tamanho =
    Number(
      resposta.headers.get('content-length') || 0
    )

  if (tamanho > MAX_BYTES) {
    throw new Error('Arquivo maior que 50 MB.')
  }

  const buffer = Buffer.from(
    await resposta.arrayBuffer()
  )

  if (buffer.length > MAX_BYTES) {
    throw new Error('Arquivo maior que 50 MB.')
  }

  const arquivo =
    arquivoTemporario('mp3')

  await fs.writeFile(arquivo, buffer)

  return arquivo
}

module.exports = {
  buscar,
  buscarPorId,
  baixar,
  apagarArquivo
}
