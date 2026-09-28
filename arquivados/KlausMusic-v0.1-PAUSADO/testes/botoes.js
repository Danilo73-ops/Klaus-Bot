const {
  generateWAMessageFromContent,
  proto,
  isJidGroup
} = require('@whiskeysockets/baileys')

function criarBizNode() {
  const privacyModeTs =
    (Math.floor(Date.now() / 1000) - 77980457).toString()

  return {
    tag: 'biz',
    attrs: {
      actual_actors: '2',
      host_storage: '2',
      privacy_mode_ts: privacyModeTs
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

module.exports = {
  nome: 'botoes',

  executar: async ({ sock, jid, msg }) => {
    try {
      console.log('🔘 Preparando Native Flow...')

      const botoes = [
        {
          name: 'quick_reply',
          buttonParamsJson: JSON.stringify({
            display_text: '🎵 Áudio',
            id: '!teste_audio'
          })
        },
        {
          name: 'quick_reply',
          buttonParamsJson: JSON.stringify({
            display_text: '🎬 Vídeo',
            id: '!teste_video'
          })
        }
      ]

      const interactiveMessage =
        proto.Message.InteractiveMessage.create({
          header:
            proto.Message.InteractiveMessage.Header.create({
              title: '🎧 Klaus Music',
              hasMediaAttachment: false
            }),

          body:
            proto.Message.InteractiveMessage.Body.create({
              text: 'Escolha uma opção:'
            }),

          footer:
            proto.Message.InteractiveMessage.Footer.create({
              text: 'Klaus ✦ Music'
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

      const mensagem = generateWAMessageFromContent(
        jid,
        {
          interactiveMessage
        },
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

      const additionalNodes = isJidGroup(jid)
        ? [bizNode]
        : [botNode, bizNode]

      console.log(
        '🔘 Enviando Native Flow...',
        isJidGroup(jid) ? 'GRUPO' : 'PRIVADO'
      )

      await sock.relayMessage(
        jid,
        mensagem.message,
        {
          messageId: mensagem.key.id,
          additionalNodes
        }
      )

      console.log('✅ Native Flow enviado:', mensagem.key.id)

    } catch (erro) {
      console.error('❌ ERRO BOTÕES:', erro)
    }
  }
}
