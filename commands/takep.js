const fs = require('fs')
const path = require('path')
const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const webp = require('node-webpmux')

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

async function aplicarMetadados(caminho, nomePack) {
  const img = new webp.Image()

  await img.load(caminho)

  const metadados = {
    'sticker-pack-id':
      `personal-${Date.now()}`,

    'sticker-pack-name':
      nomePack,

    'sticker-pack-publisher':
      '',

    emojis: []
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
  nome: 'takep',

  executar: async ({
    sock,
    jid,
    msg,
    args
  }) => {
    const sticker =
      obterStickerRespondido(msg)

    if (!sticker) {
      await sock.sendMessage(jid, {
        text:
          '🧩 Responda uma figurinha com *!takep seu texto*.'
      })
      return
    }

    const nomePack =
      args.join(' ').trim()

    if (!nomePack) {
      await sock.sendMessage(jid, {
        text:
          '✍️ Digite o nome que você quer colocar.\n\nExemplo:\n!takep 😎🔥'
      })
      return
    }

    if (nomePack.length > 60) {
      await sock.sendMessage(jid, {
        text:
          '❌ Texto muito grande. Use até 60 caracteres.'
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
        arquivo,
        nomePack
      )

      const resultado =
        fs.readFileSync(arquivo)

      await sock.sendMessage(jid, {
        sticker: resultado
      })

    } catch (erro) {
      console.log(
        '❌ Erro no takep:',
        erro.message
      )

      await sock.sendMessage(jid, {
        text:
          '❌ Não consegui personalizar essa figurinha.'
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
