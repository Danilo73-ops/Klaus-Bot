const {
  generateWAMessageFromContent,
  proto,
  isJidGroup
} = require('@whiskeysockets/baileys')

function criarBizNode() {
  return {
    tag: 'biz',
    attrs: {
      actual_actors: '2',
      host_storage: '2',
      privacy_mode_ts:
        (Math.floor(Date.now() / 1000) - 77980457)
          .toString()
    },
    content: [
      {
        tag: 'interactive',
        attrs: {
          type: 'native_flow',
          v: '1'
        },
        content: [
          {
            tag: 'native_flow',
            attrs: {
              v: '9',
              name: 'mixed'
            }
          }
        ]
      },
      {
        tag: 'quality_control',
        attrs: {
          source_type: 'third_party'
        }
      }
    ]
  }
}

async function enviar(
  sock,
  jid,
  msg,
  {
    titulo = '🎧 Klaus Music',
    texto = '',
    rodape = 'Klaus ✦ Music',
    botoes = []
  }
) {
  const interactiveMessage =
    proto.Message.InteractiveMessage.create({
      header:
        proto.Message.InteractiveMessage.Header.create({
          title: titulo,
          hasMediaAttachment: false
        }),

      body:
        proto.Message.InteractiveMessage.Body.create({
          text: texto
        }),

      footer:
        proto.Message.InteractiveMessage.Footer.create({
          text: rodape
        }),

      nativeFlowMessage:
        proto.Message.InteractiveMessage.NativeFlowMessage.create({
          buttons: botoes.map(botao =>
            proto.Message.InteractiveMessage
              .NativeFlowMessage
              .NativeFlowButton
              .create(botao)
          ),

          messageParamsJson: '{}',
          messageVersion: 1
        })
    })

  const mensagem =
    generateWAMessageFromContent(
      jid,
      { interactiveMessage },
      {
        userJid: sock.user.id,
        quoted: msg
      }
    )

  const bizNode = criarBizNode()

  const botNode = {
    tag: 'bot',
    attrs: {
      biz_bot: '1'
    }
  }

  await sock.relayMessage(
    jid,
    mensagem.message,
    {
      messageId: mensagem.key.id,

      additionalNodes:
        isJidGroup(jid)
          ? [bizNode]
          : [botNode, bizNode]
    }
  )
}

module.exports = {
  enviar
}
