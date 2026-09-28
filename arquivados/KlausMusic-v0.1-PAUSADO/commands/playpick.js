const nativeFlow =
  require('../musica/utils/nativeFlow')

function pegarId(msg) {
  const m = msg.message || {}

  let texto =
    m.templateButtonReplyMessage?.selectedId ||
    m.buttonsResponseMessage?.selectedButtonId ||
    m.listResponseMessage
      ?.singleSelectReply
      ?.selectedRowId ||
    ''

  if (!texto) {
    const params =
      m.interactiveResponseMessage
        ?.nativeFlowResponseMessage
        ?.paramsJson

    if (params) {
      try {
        texto = JSON.parse(params).id || ''
      } catch (_) {}
    }
  }

  return texto
}

module.exports = {
  nome: 'playpick',

  executar: async ({ sock, jid, msg }) => {
    const texto = pegarId(msg)

    const chave = texto
      .replace(/^!playpick\s*/i, '')
      .trim()

    const [provedor, id] =
      chave.split(':')

    if (
      provedor !== 'jamendo' ||
      !/^\d+$/.test(id || '')
    ) {
      return sock.sendMessage(jid, {
        text: '❌ Resultado inválido.'
      })
    }

    await nativeFlow.enviar(
      sock,
      jid,
      msg,
      {
        texto:
          '✅ Música selecionada\n\n' +
          'Como você quer receber?',

        botoes: [
          {
            name: 'quick_reply',

            buttonParamsJson:
              JSON.stringify({
                display_text: '🎵 Áudio',
                id:
                  `!playaudio jamendo:${id}`
              })
          }
        ]
      }
    )
  }
}
