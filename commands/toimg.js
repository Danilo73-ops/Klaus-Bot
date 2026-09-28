const fs = require('fs')
const path = require('path')
const { execFile } = require('child_process')
const { promisify } = require('util')
const { downloadMediaMessage } = require('@whiskeysockets/baileys')

const execFileAsync = promisify(execFile)

const pastaTemp =
  process.env.HOME + '/bot-runtime/temp-stickers'

fs.mkdirSync(pastaTemp, {
  recursive: true
})

function obterStickerRespondido(msg) {
  const contexto =
    msg.message?.extendedTextMessage?.contextInfo

  const quoted =
    contexto?.quotedMessage

  if (!quoted?.stickerMessage) {
    return null
  }

  return {
    key: {
      remoteJid: msg.key.remoteJid,
      id: contexto.stanzaId,
      participant: contexto.participant
    },

    message: quoted
  }
}

module.exports = {
  nome: 'toimg',

  executar: async ({ sock, jid, msg }) => {
    const sticker =
      obterStickerRespondido(msg)

    if (!sticker) {
      await sock.sendMessage(jid, {
        text:
          '🖼️ Responda uma figurinha com *!toimg*.'
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
        `${id}.webp`
      )

    const saida =
      path.join(
        pastaTemp,
        `${id}.png`
      )

    try {
      const buffer =
        await downloadMediaMessage(
          sticker,
          'buffer',
          {},
          {
            reuploadRequest:
              sock.updateMediaMessage
          }
        )

      if (!buffer || !buffer.length) {
        throw new Error('Figurinha vazia.')
      }

      fs.writeFileSync(
        entrada,
        buffer
      )

      await execFileAsync(
        'ffmpeg',
        [
          '-y',
          '-i',
          entrada,

          '-frames:v',
          '1',

          '-compression_level',
          '6',

          '-pred',
          'mixed',

          saida
        ],
        {
          timeout: 30000,
          maxBuffer:
            20 * 1024 * 1024
        }
      )

      if (!fs.existsSync(saida)) {
        throw new Error(
          'A imagem não foi gerada.'
        )
      }

      const imagem =
        fs.readFileSync(saida)

      await sock.sendMessage(jid, {
        image: imagem,
        mimetype: 'image/png'
      })

    } catch (erro) {
      console.log(
        '❌ Erro no toimg:',
        erro.message
      )

      await sock.sendMessage(jid, {
        text:
          '❌ Não consegui converter essa figurinha.'
      })

    } finally {
      try {
        if (fs.existsSync(entrada)) {
          fs.unlinkSync(entrada)
        }

        if (fs.existsSync(saida)) {
          fs.unlinkSync(saida)
        }
      } catch {}
    }
  }
}
