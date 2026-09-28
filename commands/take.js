const fs = require('fs')
const path = require('path')
const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const webp = require('node-webpmux')

const pastaTemp =
  process.env.HOME + '/bot-runtime/temp-stickers'

fs.mkdirSync(pastaTemp, {
  recursive: true
})

const PACK_NAME = 'Klaus ✦ Sticker Lab'
const PACK_AUTHOR = 'Grey ⚡'
const PACK_ID = 'klaus-sticker-lab'

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

async function aplicarMetadados(caminho) {
  const img = new webp.Image()

  await img.load(caminho)

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

  img.exif =
    Buffer.concat([
      exifBase,
      jsonBuffer
    ])

  await img.save(caminho)
}

module.exports = {
  nome: 'take',

  executar: async ({
    sock,
    jid,
    msg
  }) => {
    const sticker =
      obterStickerRespondido(msg)

    if (!sticker) {
      await sock.sendMessage(jid, {
        text:
          '🧩 Responda uma figurinha com *!take*.'
      })
      return
    }

    const id =
      `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`

    const arquivo =
      path.join(
        pastaTemp,
        `${id}.webp`
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
        arquivo,
        buffer
      )

      await aplicarMetadados(
        arquivo
      )

      const resultado =
        fs.readFileSync(arquivo)

      await sock.sendMessage(jid, {
        sticker: resultado
      })

    } catch (erro) {
      console.log(
        '❌ Erro no take:',
        erro.message
      )

      await sock.sendMessage(jid, {
        text:
          '❌ Não consegui renomear essa figurinha.'
      })

    } finally {
      try {
        if (fs.existsSync(arquivo)) {
          fs.unlinkSync(arquivo)
        }
      } catch {}
    }
  }
}
