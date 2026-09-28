const fs = require('fs')
const path = require('path')
const { execFile } = require('child_process')
const { promisify } = require('util')
const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const webp = require('node-webpmux')

const execFileAsync = promisify(execFile)

const pastaTemp =
  process.env.HOME + '/bot-runtime/temp-stickers'

fs.mkdirSync(pastaTemp, {
  recursive: true
})

const MAX_CONCORRENCIA = 2
const MAX_TAMANHO_BYTES = 15 * 1024 * 1024
const TIMEOUT_FFMPEG_MS = 30000
const MAX_POR_USUARIO = 5

const PACK_NAME = 'Klaus • Sticker Lab'
const PACK_AUTHOR = 'Grey ⚡'
const PACK_ID = 'klaus-sticker-lab'

let processando = 0
const fila = []
const pendentesPorUsuario = new Map()

function obterAutor(msg) {
  return msg.key.participant || msg.key.remoteJid
}

function quantidadePendente(jid) {
  return pendentesPorUsuario.get(jid) || 0
}

function adicionarPendente(jid) {
  pendentesPorUsuario.set(
    jid,
    quantidadePendente(jid) + 1
  )
}

function removerPendente(jid) {
  const atual = quantidadePendente(jid)

  if (atual <= 1) {
    pendentesPorUsuario.delete(jid)
    return
  }

  pendentesPorUsuario.set(
    jid,
    atual - 1
  )
}

function obterMensagemRespondida(msg) {
  const contexto =
    msg.message?.extendedTextMessage?.contextInfo

  if (!contexto?.quotedMessage) {
    return null
  }

  return {
    key: {
      remoteJid: msg.key.remoteJid,
      id: contexto.stanzaId,
      participant: contexto.participant
    },

    message: contexto.quotedMessage
  }
}

function obterMensagemComMidia(msg) {
  if (
    msg.message?.imageMessage ||
    msg.message?.videoMessage
  ) {
    return msg
  }

  return obterMensagemRespondida(msg)
}

function limparArquivos(...arquivos) {
  for (const arquivo of arquivos) {
    try {
      if (arquivo && fs.existsSync(arquivo)) {
        fs.unlinkSync(arquivo)
      }
    } catch {}
  }
}

function escaparDrawtext(texto) {
  return String(texto)
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/'/g, "\\\\'")
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/,/g, '\\,')
    .replace(/%/g, '\\%')
}

function interpretarArgs(args = []) {
  const primeiro =
    String(args?.[0] || '')
      .trim()
      .toLowerCase()

  if (primeiro === 'fit') {
    return {
      modo: 'fit',
      texto: null
    }
  }

  if (primeiro === 'crop') {
    return {
      modo: 'crop',
      texto: null
    }
  }

  if (primeiro === 'texto') {
    const frase =
      args.slice(1).join(' ').trim()

    return {
      modo: 'crop',
      texto: frase || null
    }
  }

  return {
    modo: 'crop',
    texto: null
  }
}

async function adicionarMetadadosWebp(caminhoWebp) {
  const img = new webp.Image()

  await img.load(caminhoWebp)

  const metadados = {
    'sticker-pack-id': PACK_ID,
    'sticker-pack-name': PACK_NAME,
    'sticker-pack-publisher': PACK_AUTHOR,
    emojis: ['⚡']
  }

  const jsonBuffer =
    Buffer.from(
      JSON.stringify(metadados),
      'utf8'
    )

  const exifBase = Buffer.from([
    0x49, 0x49, 0x2A, 0x00,
    0x08, 0x00, 0x00, 0x00,
    0x01, 0x00,
    0x41, 0x57,
    0x07, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x16, 0x00, 0x00, 0x00
  ])

  exifBase.writeUIntLE(
    jsonBuffer.length,
    14,
    4
  )

  img.exif = Buffer.concat([
    exifBase,
    jsonBuffer
  ])

  await img.save(caminhoWebp)
}

function montarFiltro({ modo, texto, ehVideo }) {
  const baseCrop =
    'scale=512:512:force_original_aspect_ratio=increase,crop=512:512'

  const baseFit =
    'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000'

  let filtro =
    modo === 'fit'
      ? baseFit
      : baseCrop

  if (texto) {
    const textoEscapado =
      escaparDrawtext(texto)

    filtro +=
      `,drawtext=text='${textoEscapado}':` +
      `fontcolor=white:` +
      `fontsize=42:` +
      `line_spacing=8:` +
      `borderw=4:` +
      `bordercolor=black:` +
      `x=(w-text_w)/2:` +
      `y=h-text_h-55`
  }

  if (ehVideo) {
    filtro += ',fps=15'
  }

  return filtro
}

async function converterSticker({
  sock,
  jid,
  msg,
  autorJid,
  modo,
  texto
}) {
  const mensagemMidia =
    obterMensagemComMidia(msg)

  if (!mensagemMidia) {
    await sock.sendMessage(jid, {
      text:
        '🖼️ Envie uma foto com *!s* ou responda uma foto com *!s*.'
    })
    return
  }

  const ehImagem =
    !!mensagemMidia.message?.imageMessage

  const ehVideo =
    !!mensagemMidia.message?.videoMessage

  if (!ehImagem && !ehVideo) {
    await sock.sendMessage(jid, {
      text:
        '❌ Use uma foto ou vídeo curto.'
    })
    return
  }

  if (texto && texto.length > 80) {
    await sock.sendMessage(jid, {
      text:
        '❌ O texto está muito grande. Use até 80 caracteres.'
    })
    return
  }

  const id =
    `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`

  const entrada =
    path.join(
      pastaTemp,
      ehVideo
        ? `${id}.mp4`
        : `${id}.jpg`
    )

  const saida =
    path.join(
      pastaTemp,
      `${id}.webp`
    )

  try {
    const buffer =
      await downloadMediaMessage(
        mensagemMidia,
        'buffer',
        {},
        {
          reuploadRequest:
            sock.updateMediaMessage
        }
      )

    if (!buffer || !buffer.length) {
      throw new Error('Mídia vazia.')
    }

    if (buffer.length > MAX_TAMANHO_BYTES) {
      await sock.sendMessage(jid, {
        text:
          '❌ Essa mídia é grande demais. Limite: 15 MB.'
      })
      return
    }

    fs.writeFileSync(entrada, buffer)

    const filtro =
      montarFiltro({
        modo,
        texto,
        ehVideo
      })

    const argumentos = [
      '-y',
      '-i',
      entrada
    ]

    if (ehVideo) {
      argumentos.push(
        '-t',
        '8',
        '-vf',
        filtro,
        '-loop',
        '0'
      )
    } else {
      argumentos.push(
        '-vf',
        filtro
      )
    }

    argumentos.push(
      '-vcodec',
      'libwebp',
      '-lossless',
      '0',
      '-q:v',
      '90',
      '-compression_level',
      '6',
      '-an',
      saida
    )

    await execFileAsync(
      'ffmpeg',
      argumentos,
      {
        maxBuffer: 20 * 1024 * 1024,
        timeout: TIMEOUT_FFMPEG_MS
      }
    )

    if (!fs.existsSync(saida)) {
      throw new Error('FFmpeg não gerou a figurinha.')
    }

    await adicionarMetadadosWebp(saida)

    const sticker =
      fs.readFileSync(saida)

    await sock.sendMessage(jid, {
      sticker
    })

  } catch (erro) {
    console.log(
      '❌ Erro ao criar figurinha:',
      erro.message
    )

    const mensagemErro =
      erro.killed
        ? '❌ A conversão demorou demais e foi cancelada.'
        : '❌ Não consegui criar essa figurinha.'

    await sock.sendMessage(jid, {
      text: mensagemErro
    })

  } finally {
    limparArquivos(entrada, saida)
    removerPendente(autorJid)
  }
}

async function processarFila() {
  while (
    processando < MAX_CONCORRENCIA &&
    fila.length > 0
  ) {
    const tarefa = fila.shift()

    processando++

    Promise.resolve()
      .then(() => converterSticker(tarefa))
      .catch(erro => {
        console.log(
          '❌ Erro interno na fila:',
          erro.message
        )

        removerPendente(tarefa.autorJid)
      })
      .finally(() => {
        processando--
        processarFila()
      })
  }
}

function adicionarNaFila(tarefa) {
  fila.push(tarefa)
  processarFila()
}

module.exports = {
  nome: 'sticker',

  executar: async ({
    sock,
    jid,
    msg,
    args
  }) => {
    const autorJid = obterAutor(msg)

    if (
      quantidadePendente(autorJid) >=
      MAX_POR_USUARIO
    ) {
      await sock.sendMessage(jid, {
        text:
          '⏳ Você já tem 5 figurinhas na fila. Espere algumas terminarem.'
      })
      return
    }

    const {
      modo,
      texto
    } = interpretarArgs(args)

    if (
      args?.[0]?.toLowerCase() === 'texto' &&
      !texto
    ) {
      await sock.sendMessage(jid, {
        text:
          '✍️ Use assim:\n!s texto SUA FRASE'
      })
      return
    }

    adicionarPendente(autorJid)

    const posicaoNaFila =
      fila.length + processando + 1

    adicionarNaFila({
      sock,
      jid,
      msg,
      autorJid,
      modo,
      texto
    })

    if (posicaoNaFila > MAX_CONCORRENCIA) {
      await sock.sendMessage(jid, {
        text:
          `⏳ Figurinha adicionada à fila. Posição aproximada: ${posicaoNaFila}`
      })
    }
  }
}
