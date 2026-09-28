const fs = require('fs')
const { execSync } = require('child_process')
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')

const TEMP_DIR = '/storage/emulated/0/MeuBotWhatsApp/temp'

function garantirTemp() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true })
  }
}

function obterVideo(msg) {
  const videoDireto =
    msg.message?.videoMessage

  if (videoDireto) {
    return videoDireto
  }

  const videoRespondido =
    msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage

  if (videoRespondido) {
    return videoRespondido
  }

  return null
}

async function baixarBuffer(midia, tipo) {
  const stream =
    await downloadContentFromMessage(
      midia,
      tipo
    )

  const chunks = []

  for await (const chunk of stream) {
    chunks.push(chunk)
  }

  return Buffer.concat(chunks)
}

module.exports = {
  nome: 'sgif',

  executar: async ({
    sock,
    jid,
    msg,
    args
  }) => {
    const video =
      obterVideo(msg)

    if (!video) {
      await sock.sendMessage(jid, {
        text:
          '🎞️ Envie um vídeo com *!sgif* ou responda um vídeo com *!sgif*.'
      })
      return
    }

    let duracao =
      parseInt(args?.[0], 10)

    if (
      !Number.isFinite(duracao) ||
      duracao <= 0
    ) {
      duracao = 6
    }

    if (duracao > 6) {
      duracao = 6
    }

    garantirTemp()

    const id =
      Date.now() +
      '_' +
      Math.floor(
        Math.random() * 999999
      )

    const entrada =
      `${TEMP_DIR}/${id}.mp4`

    const saida =
      `${TEMP_DIR}/${id}.webp`

    try {
      const buffer =
        await baixarBuffer(
          video,
          'video'
        )

      fs.writeFileSync(
        entrada,
        buffer
      )

      const comando = [
        'ffmpeg -y',
        `-i "${entrada}"`,
        '-vcodec libwebp',
        '-vf "fps=12,scale=512:512:force_original_aspect_ratio=decrease:flags=lanczos,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000"',
        `-t ${duracao}`,
        '-loop 0',
        '-an',
        '-vsync 0',
        `"${saida}"`
      ].join(' ')

      execSync(
        comando,
        {
          stdio: 'ignore'
        }
      )

      await sock.sendMessage(jid, {
        sticker:
          fs.readFileSync(saida)
      })

    } catch (erro) {
      console.log(
        '❌ Erro no sgif:',
        erro.message
      )

      await sock.sendMessage(jid, {
        text:
          '❌ Erro ao criar a figurinha animada.'
      })

    } finally {
      try {
        if (fs.existsSync(entrada)) {
          fs.unlinkSync(entrada)
        }
      } catch {}

      try {
        if (fs.existsSync(saida)) {
          fs.unlinkSync(saida)
        }
      } catch {}
    }
  }
}
