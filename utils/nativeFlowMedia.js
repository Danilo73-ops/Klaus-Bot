const {
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  proto
} = require('@whiskeysockets/baileys')

async function prepararImagem(sock, imagem) {
  const conteudo =
    typeof imagem === 'string'
      ? { image: { url: imagem } }
      : { image: imagem }

  return prepareWAMessageMedia(
    conteudo,
    {
      upload: sock.waUploadToServer
    }
  )
}

async function enviar(
  sock,
  jid,
  msg,
  {
    titulo = '',
    texto = '',
    rodape = '',
    imagem = null,
    botoes = []
  } = {}
) {
  let header

  if (imagem) {
    const media =
      await prepararImagem(
        sock,
        imagem
      )

    header =
      proto.Message.InteractiveMessage.Header.create({
        title: titulo,
        hasMediaAttachment: true,
        imageMessage: media.imageMessage
      })
  } else {
    header =
      proto.Message.InteractiveMessage.Header.create({
        title: titulo,
        hasMediaAttachment: false
      })
  }

  const interactiveMessage =
    proto.Message.InteractiveMessage.create({
      header,

      body:
        proto.Message.InteractiveMessage.Body.create({
          text: texto
        }),

      footer:
        proto.Message.InteractiveMessage.Footer.create({
          text: rodape
        }),

      nativeFlowMessage:
        proto.Message.InteractiveMessage
          .NativeFlowMessage.create({
            buttons: botoes
          })
    })

  const mensagem =
    generateWAMessageFromContent(
      jid,
      {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadata: {},
              deviceListMetadataVersion: 2
            },

            interactiveMessage
          }
        }
      },
      {
        userJid: sock.user?.id,
        quoted: msg
      }
    )

  await sock.relayMessage(
    jid,
    mensagem.message,
    {
      messageId:
        mensagem.key.id,

      additionalNodes: [
        {
          tag: 'biz',
          attrs: {}
        },
        {
          tag: 'bot',
          attrs: {}
        }
      ]
    }
  )

  return mensagem
}

module.exports = {
  enviar
}
