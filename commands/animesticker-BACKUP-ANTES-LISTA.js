const fs = require('fs')
const os = require('os')
const path = require('path')
const { execFile } = require('child_process')
const { promisify } = require('util')

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
    m.listResponseMessage?.singleSelectReply?.selectedRowId ||
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
    throw new Error(`HTTP ${resposta.status}`)
  }

  const buffer =
    Buffer.from(await resposta.arrayBuffer())

  fs.writeFileSync(destino, buffer)
}

async function converter512(entrada, saida) {
  await execFileAsync('ffmpeg', [
    '-y',
    '-i', entrada,

    '-vf',
    'scale=512:512:force_original_aspect_ratio=increase:flags=lanczos,' +
    'crop=512:512',

    '-vcodec', 'libwebp',
    '-lossless', '0',
    '-compression_level', '6',
    '-q:v', '85',
    '-an',

    saida
  ])
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

      if (!['neko', 'kitsune'].includes(categoria)) {
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

      entrada = path.join(
        os.tmpdir(),
        `klaus-anime-${id}.img`
      )

      saida = path.join(
        os.tmpdir(),
        `klaus-anime-${id}.webp`
      )

      await baixarImagem(
        resultado.url,
        entrada
      )

      await converter512(
        entrada,
        saida
      )

      await sock.sendMessage(jid, {
        sticker: {
          url: saida
        }
      })

      console.log(
        `✅ ANIMESTICKER 512x512: ${resultado.categoria}`
      )

    } catch (erro) {
      console.error(
        '❌ Erro !animesticker:',
        erro.message
      )

      await sock.sendMessage(jid, {
        text:
          `❌ Não consegui gerar a figurinha: ${erro.message}`
      })

    } finally {
      for (const arquivo of [entrada, saida]) {
        if (arquivo && fs.existsSync(arquivo)) {
          try {
            fs.unlinkSync(arquivo)
          } catch {}
        }
      }
    }
  }
}
