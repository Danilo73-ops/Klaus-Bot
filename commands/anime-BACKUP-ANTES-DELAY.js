const animeService =
  require('../anime/services/animeService')

const animeQueue =
  require('../anime/services/animeQueue')

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
    m.listResponseMessage?.singleSelectReply?.selectedRowId ||
    ''
  )
}

function pegarAutor(msg, jid) {
  return (
    msg.key?.participant ||
    msg.participant ||
    msg.key?.remoteJid ||
    jid
  )
}

module.exports = {
  nome: 'anime',

  executar: async ({ sock, jid, msg }) => {
    const autor = pegarAutor(msg, jid)

    try {
      const texto = pegarTexto(msg)

      let categoria = texto
        .replace(/^!anime\s*/i, '')
        .trim()
        .toLowerCase()

      if (!categoria) {
        categoria = 'random'
      }

      if (categoria === 'list') {
        await sock.sendMessage(jid, {
          text:
            '📚 *Klaus Anime — Categorias*\n\n' +
            'Por enquanto:\n' +
            '• random\n' +
            '• neko\n' +
            '• kitsune\n\n' +
            'A lista completa entra na próxima etapa.'
        })

        return
      }

      await animeQueue.adicionarNaFila(
        autor,
        async () => {

          await sock.sendMessage(jid, {
            text: '🎨 Buscando imagem SFW...'
          })

          const resultado =
            await animeService.buscar(categoria)

          const nomes = {
            neko: '😺 Neko',
            kitsune: '🦊 Kitsune',
            random: '🎨 Anime'
          }

          await sock.sendMessage(jid, {
            image: {
              url: resultado.url
            },

            caption:
              `✨ *Klaus Anime*\n` +
              `${nomes[resultado.categoria] || '🎨 Anime'}\n\n` +
              `🔒 SFW`
          })

          await nativeFlow.enviar(
            sock,
            jid,
            msg,
            {
              titulo: '🎨 Klaus Anime',

              texto:
                'O que você quer fazer agora?',

              rodape:
                'Klaus ✦ Anime',

              botoes: [
                {
                  name: 'quick_reply',

                  buttonParamsJson:
                    JSON.stringify({
                      display_text: '🔄 Outra',
                      id: `!anime ${categoria === 'random' ? '' : categoria}`.trim()
                    })
                },

                {
                  name: 'quick_reply',

                  buttonParamsJson:
                    JSON.stringify({
                      display_text: '📚 Categorias',
                      id: '!anime list'
                    })
                }
              ]
            }
          )

          console.log(
            `✅ ANIME ENVIADO: ${categoria}`
          )
        }
      )

    } catch (erro) {
      console.error(
        '❌ Erro !anime:',
        erro.message
      )

      if (
        erro.message.includes(
          'muitos pedidos de anime na fila'
        )
      ) {
        await sock.sendMessage(jid, {
          text: `⏳ ${erro.message}`
        })

        return
      }

      await sock.sendMessage(jid, {
        text:
          `❌ Não consegui buscar a imagem: ${erro.message}`
      })
    }
  }
}
