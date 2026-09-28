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
        await nativeFlow.enviar(
          sock,
          jid,
          msg,
          {
            titulo: '📚 Klaus Anime',

            texto:
              'Escolha uma categoria de anime SFW:',

            rodape:
              'Klaus ✦ Anime',

            botoes: [
              {
                name: 'single_select',

                buttonParamsJson: JSON.stringify({
                  title: '🎴 Ver categorias',

                  sections: [
                    {
                      title: '✨ Principais',

                      rows: [
                        {
                          title: '🎲 Aleatório',
                          description: 'Imagem anime aleatória',
                          id: '!anime'
                        },
                        {
                          title: '😺 Neko',
                          id: '!anime neko'
                        },
                        {
                          title: '🦊 Kitsune',
                          id: '!anime kitsune'
                        },
                        {
                          title: '✨ Waifu',
                          id: '!anime waifu'
                        },
                        {
                          title: '🧑 Husbando',
                          id: '!anime husbando'
                        }
                      ]
                    },

                    {
                      title: '😊 Emoções',

                      rows: [
                        {
                          title: '😄 Happy',
                          id: '!anime happy'
                        },
                        {
                          title: '🙂 Smile',
                          id: '!anime smile'
                        },
                        {
                          title: '😢 Cry',
                          id: '!anime cry'
                        },
                        {
                          title: '😊 Blush',
                          id: '!anime blush'
                        },
                        {
                          title: '😏 Smug',
                          id: '!anime smug'
                        },
                        {
                          title: '😠 Angry',
                          id: '!anime angry'
                        },
                        {
                          title: '🥱 Bored',
                          id: '!anime bored'
                        },
                        {
                          title: '🤔 Think',
                          id: '!anime think'
                        },
                        {
                          title: '🤦 Facepalm',
                          id: '!anime facepalm'
                        },
                        {
                          title: '😳 Shocked',
                          id: '!anime shocked'
                        },
                        {
                          title: '😗 Pout',
                          id: '!anime pout'
                        }
                      ]
                    },

                    {
                      title: '🎭 Reações',

                      rows: [
                        {
                          title: '🤗 Hug',
                          id: '!anime hug'
                        },
                        {
                          title: '🫂 Cuddle',
                          id: '!anime cuddle'
                        },
                        {
                          title: '🫳 Pat',
                          id: '!anime pat'
                        },
                        {
                          title: '👋 Wave',
                          id: '!anime wave'
                        },
                        {
                          title: '😉 Wink',
                          id: '!anime wink'
                        },
                        {
                          title: '💃 Dance',
                          id: '!anime dance'
                        },
                        {
                          title: '😂 Laugh',
                          id: '!anime laugh'
                        },
                        {
                          title: '👀 Stare',
                          id: '!anime stare'
                        },
                        {
                          title: '🤷 Shrug',
                          id: '!anime shrug'
                        },
                        {
                          title: '👉 Poke',
                          id: '!anime poke'
                        },
                        {
                          title: '🙌 High Five',
                          id: '!anime highfive'
                        },
                        {
                          title: '👏 Clap',
                          id: '!anime clap'
                        }
                      ]
                    },

                    {
                      title: '🌙 Outros',

                      rows: [
                        {
                          title: '😴 Sleep',
                          id: '!anime sleep'
                        },
                        {
                          title: '🍜 Feed',
                          id: '!anime feed'
                        },
                        {
                          title: '🏃 Run',
                          id: '!anime run'
                        },
                        {
                          title: '🫡 Salute',
                          id: '!anime salute'
                        },
                        {
                          title: '🖼️ Wallpaper',
                          id: '!anime wallpaper'
                        },
                        {
                          title: '📱 Wallpaper Mobile',
                          id: '!anime mobilewallpaper'
                        }
                      ]
                    }
                  ]
                })
              }
            ]
          }
        )

        return
      }

      await animeQueue.adicionarNaFila(
        autor,
        async () => {

          let avisoEnviado = false

          const timerAviso = setTimeout(async () => {
            try {
              avisoEnviado = true

              await sock.sendMessage(jid, {
                text: '🎨 Buscando imagem SFW...'
              })
            } catch {}
          }, 1200)

          let resultado

          try {
            resultado =
              await animeService.buscar(categoria)
          } finally {
            clearTimeout(timerAviso)
          }

          const nomes = {
            neko: '😺 Neko',
            kitsune: '🦊 Kitsune',
            random: '🎨 Anime'
          }

          const legenda =
            `✨ *Klaus Anime*\n` +
            `🎴 ${resultado.categoria}\n\n` +
            `🔒 SFW`

          if (resultado.tipo === 'gif') {
            await sock.sendMessage(jid, {
              video: {
                url: resultado.url
              },
              gifPlayback: true,
              caption: legenda
            })
          } else {
            await sock.sendMessage(jid, {
              image: {
                url: resultado.url
              },
              caption: legenda
            })
          }

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
