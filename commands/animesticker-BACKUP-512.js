const fs = require('fs')
const os = require('os')
const path = require('path')
const { execFile } = require('child_process')
const { promisify } = require('util')
const webp = require('node-webpmux')

const animeService =
  require('../anime/services/animeService')

const execFileAsync = promisify(execFile)

function pegarTexto(msg) {
  const m = msg.message || {}

  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.templateButtonReplyMessage?.selectedId ||
    m.buttonsResponseMessage?.selectedButtonId ||
    m.listResponseMessage
      ?.singleSelectReply
      ?.selectedRowId ||
    ''
  )
}

async function baixarImagem(url, destino) {
  const resposta = await fetch(url, {
    headers: {
      'User-Agent': 'KlausBot/1.0'
    }
  })

  if (!resposta.ok) {
    throw new Error(
      `Falha ao baixar imagem: HTTP ${resposta.status}`
    )
  }

  const buffer =
    Buffer.from(await resposta.arrayBuffer())

  fs.writeFileSync(destino, buffer)
}

async function converterWebp(entrada, saida) {
  await execFileAsync('ffmpeg', [
    '-y',
    '-i', entrada,

    '-vf',
    'scale=512:512:force_original_aspect_ratio=decrease,' +
    'pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000',

    '-vcodec', 'libwebp',
    '-lossless', '0',
    '-compression_level', '6',
    '-q:v', '80',
    '-loop', '0',
    '-an',

    saida
  ])
}

async function colocarMetadata(arquivo) {
  const imagem = new webp.Image()

  await imagem.load(arquivo)

  const metadata = {
    'sticker-pack-id':
      'klaus-anime-sfw',

    'sticker-pack-name':
      'Klaus ✦ Sticker Lab',

    'sticker-pack-publisher':
      'Grey ⚡',

    emojis: ['🎨']
  }

  const json =
    JSON.stringify(metadata)

  const exif = Buffer.concat([
    Buffer.from([
      0x49, 0x49, 0x2A, 0x00,
      0x08, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x41, 0x57,
      0x07, 0x00
    ]),

    Buffer.from([
      json.length & 0xff,
      (json.length >> 8) & 0xff,
      (json.length >> 16) & 0xff,
      (json.length >> 24) & 0xff,
      0x16, 0x00, 0x00, 0x00
    ]),

    Buffer.from(json, 'utf8')
  ])

  imagem.exif = exif

  await imagem.save(arquivo)
}

module.exports = {
  nome: 'animesticker',

  executar: async ({ sock, jid, msg }) => {
    let entrada = null
    let saida = null

    try {
      const texto = pegarTexto(msg)

      let categoria = texto
        .replace(/^!animesticker\s*/i, '')
        .trim()
        .toLowerCase()

      if (
        !['neko', 'kitsune'].includes(categoria)
      ) {
        categoria = 'random'
      }

      await sock.sendMessage(jid, {
        text: '🧩 Buscando figurinha SFW...'
      })

      const resultado =
        await animeService.buscar(categoria)

      const id =
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`

      entrada =
        path.join(
          os.tmpdir(),
          `klaus-anime-${id}.img`
        )

      saida =
        path.join(
          os.tmpdir(),
          `klaus-anime-${id}.webp`
        )

      await baixarImagem(
        resultado.url,
        entrada
      )

      await converterWebp(
        entrada,
        saida
      )

      // metadata temporariamente desativado para teste

      await sock.sendMessage(jid, {
        sticker: {
          url: saida
        }
      })

      console.log(
        `✅ ANIME STICKER: ${resultado.categoria}`
      )

    } catch (erro) {
      console.error(
        '❌ Erro !animesticker:',
        erro
      )

      await sock.sendMessage(jid, {
        text:
          `❌ Não consegui criar a figurinha: ${erro.message}`
      })

    } finally {
      for (const arquivo of [entrada, saida]) {
        if (
          arquivo &&
          fs.existsSync(arquivo)
        ) {
          try {
            fs.unlinkSync(arquivo)
          } catch {}
        }
      }
    }
  }
}
