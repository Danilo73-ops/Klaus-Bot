const animeService =
  require('../anime/services/animeService')

const nativeFlow =
  require('../utils/nativeFlow')

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

module.exports = {
  nome: 'anime',

  executar: async ({ sock, jid, msg }) => {
    try {
      const texto = pegarTexto(msg)

      let categoria = texto
        .replace(/^!anime\s*/i, '')
        .trim()
        .toLowerCase()

      if (
        !['neko', 'kitsune'].includes(categoria)
      ) {
        categoria = 'random'
      }

      await sock.sendMessage(jid, {
        text: '🎨 Buscando imagem SFW...'
      })

      const imagem =
        await animeService.buscar(categoria)

      const nomes = {
        neko: '😺 Neko',
        kitsune: '🦊 Kitsune'
      }

      await sock.sendMessage(jid, {
        image: {
          url: imagem.url
        },

        caption:
          `✨ *Klaus Anime*\n` +
          `${nomes[imagem.categoria] || '🎨 Anime'}\n\n` +
          `🔒 SFW`
      })

      await nativeFlow.enviar(
        sock,
        jid,
        msg,
        {
          titulo: '🎨 Klaus Anime',

          texto:
            'Quer ver outra imagem?',

          rodape:
            'Klaus ✦ Anime',

          botoes: [
            {
              name: 'quick_reply',

              buttonParamsJson:
                JSON.stringify({
                  display_text: '🔄 Outra',
                  id: '!anime'
                })
            },

            {
              name: 'quick_reply',

              buttonParamsJson:
                JSON.stringify({
                  display_text: '😺 Neko',
                  id: '!anime neko'
                })
            },

            {
              name: 'quick_reply',

              buttonParamsJson:
                JSON.stringify({
                  display_text: '🦊 Kitsune',
                  id: '!anime kitsune'
                })
            }
          ]
        }
      )

      console.log(
        `✅ ANIME SFW: ${imagem.categoria}`
      )

    } catch (erro) {
      console.error(
        '❌ Erro !anime:',
        erro
      )

      await sock.sendMessage(jid, {
        text:
          `❌ Não consegui buscar a imagem: ${erro.message}`
      })
    }
  }
}
