const ecchiGuard =
  require('../ecchi/services/ecchiGuard')

const ecchiService =
  require('../ecchi/services/ecchiService')

const nativeFlow =
  require('../utils/nativeFlow')

function pegarTexto(msg) {
  const m = msg.message || {}

  let nativeFlowId = ''

  try {
    const paramsJson =
      m.interactiveResponseMessage
        ?.nativeFlowResponseMessage
        ?.paramsJson

    if (paramsJson) {
      const params = JSON.parse(paramsJson)

      nativeFlowId =
        params.id ||
        params.selectedId ||
        params.selectedRowId ||
        ''
    }
  } catch {}

  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.templateButtonReplyMessage?.selectedId ||
    m.buttonsResponseMessage?.selectedButtonId ||
    m.listResponseMessage?.singleSelectReply?.selectedRowId ||
    nativeFlowId ||
    ''
  )
}

async function enviarLista(sock, jid, msg) {
  await nativeFlow.enviar(
    sock,
    jid,
    msg,
    {
      titulo: '✨ Klaus Extra Sticker',

      texto:
        'Escolha um estilo:',

      rodape:
        'Klaus ✦ Sticker Lab',

      botoes: [
        {
          name: 'single_select',

          buttonParamsJson:
            JSON.stringify({
              title: '🧩 Ver estilos',

              sections: [
                {
                  title: '✨ Destaques',

                  rows: [
                    {
                      title: '🎲 Aleatório',
                      id: '!ecchisticker'
                    },
                    {
                      title: '😤 Tsundere',
                      id: '!ecchisticker tsundere'
                    },
                    {
                      title: '🖤 Gothic',
                      id: '!ecchisticker gothic'
                    },
                    {
                      title: '😎 Cool',
                      id: '!ecchisticker cool'
                    },
                    {
                      title: '✨ Fashion',
                      id: '!ecchisticker fashion'
                    }
                  ]
                },

                {
                  title: '🌆 Estilos',

                  rows: [
                    {
                      title: '🌃 Night',
                      id: '!ecchisticker night'
                    },
                    {
                      title: '💡 Neon',
                      id: '!ecchisticker neon'
                    },
                    {
                      title: '🎭 Dramatic',
                      id: '!ecchisticker dramatic'
                    },
                    {
                      title: '🎤 Idol',
                      id: '!ecchisticker idol'
                    },
                    {
                      title: '🎨 Cosplay',
                      id: '!ecchisticker cosplay'
                    },
                    {
                      title: '👟 Streetwear',
                      id: '!ecchisticker streetwear'
                    }
                  ]
                },

                {
                  title: '☀️ Cenários',

                  rows: [
                    {
                      title: '🏖️ Beach',
                      id: '!ecchisticker beach'
                    },
                    {
                      title: '☀️ Summer',
                      id: '!ecchisticker summer'
                    },
                    {
                      title: '✨ Glam',
                      id: '!ecchisticker glam'
                    }
                  ]
                }
              ]
            })
        }
      ]
    }
  )
}

module.exports = {
  nome: 'ecchisticker',

  executar: async ({ sock, jid, msg }) => {
    try {
      const permissao =
        ecchiGuard.verificar(jid)

      if (!permissao.liberado) {
        await sock.sendMessage(jid, {
          text: permissao.motivo
        })

        return
      }

      const texto =
        pegarTexto(msg)

      let categoria =
        texto
          .replace(/^!ecchisticker\s*/i, '')
          .trim()
          .toLowerCase()

      if (!categoria) {
        categoria = 'random'
      }

      if (categoria === 'list') {
        await enviarLista(
          sock,
          jid,
          msg
        )

        return
      }

      if (
        !ecchiService
          .categoriaExiste(categoria)
      ) {
        await sock.sendMessage(jid, {
          text:
            '❌ Categoria inválida.\n\n' +
            'Use *!ecchisticker list*.'
        })

        return
      }

      /*
       * Provider ainda entra depois.
       * Quando conectarmos:
       * busca -> download -> 512x512 -> sticker.
       */

      await sock.sendMessage(jid, {
        text:
          `✅ Estilo selecionado: *${categoria}*\n\n` +
          '🧩 Provider de imagens ainda será conectado.'
      })

    } catch (erro) {
      console.error(
        '❌ Erro !ecchisticker:',
        erro
      )

      await sock.sendMessage(jid, {
        text:
          '❌ Houve um erro no módulo.'
      })
    }
  }
}
