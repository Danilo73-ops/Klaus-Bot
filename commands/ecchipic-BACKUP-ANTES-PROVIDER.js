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
      const params =
        JSON.parse(paramsJson)

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
      titulo: '✨ Klaus Extra',

      texto:
        'Escolha um estilo:',

      rodape:
        'Klaus ✦ Anime',

      botoes: [
        {
          name: 'single_select',

          buttonParamsJson:
            JSON.stringify({
              title:
                '🎴 Ver estilos',

              sections: [
                {
                  title:
                    '✨ Destaques',

                  rows: [
                    {
                      title:
                        '🎲 Aleatório',
                      description:
                        'Estilo aleatório',
                      id:
                        '!ecchipic'
                    },
                    {
                      title:
                        '😤 Tsundere',
                      description:
                        'Vibe tsundere',
                      id:
                        '!ecchipic tsundere'
                    },
                    {
                      title:
                        '🖤 Gothic',
                      description:
                        'Visual gótico',
                      id:
                        '!ecchipic gothic'
                    },
                    {
                      title:
                        '😎 Cool',
                      description:
                        'Visual estiloso',
                      id:
                        '!ecchipic cool'
                    },
                    {
                      title:
                        '✨ Fashion',
                      description:
                        'Moda anime',
                      id:
                        '!ecchipic fashion'
                    }
                  ]
                },

                {
                  title:
                    '🌆 Estilos',

                  rows: [
                    {
                      title:
                        '🌃 Night',
                      description:
                        'Cenas noturnas',
                      id:
                        '!ecchipic night'
                    },
                    {
                      title:
                        '💡 Neon',
                      description:
                        'Visual neon',
                      id:
                        '!ecchipic neon'
                    },
                    {
                      title:
                        '🎭 Dramatic',
                      description:
                        'Visual dramático',
                      id:
                        '!ecchipic dramatic'
                    },
                    {
                      title:
                        '🎤 Idol',
                      description:
                        'Visual idol',
                      id:
                        '!ecchipic idol'
                    },
                    {
                      title:
                        '🎨 Cosplay',
                      description:
                        'Estilo cosplay',
                      id:
                        '!ecchipic cosplay'
                    },
                    {
                      title:
                        '👟 Streetwear',
                      description:
                        'Moda urbana',
                      id:
                        '!ecchipic streetwear'
                    }
                  ]
                },

                {
                  title:
                    '☀️ Cenários',

                  rows: [
                    {
                      title:
                        '🏖️ Beach',
                      description:
                        'Visual de praia',
                      id:
                        '!ecchipic beach'
                    },
                    {
                      title:
                        '☀️ Summer',
                      description:
                        'Clima de verão',
                      id:
                        '!ecchipic summer'
                    },
                    {
                      title:
                        '✨ Glam',
                      description:
                        'Visual glamouroso',
                      id:
                        '!ecchipic glam'
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
  nome: 'ecchipic',

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
          .replace(/^!ecchipic\s*/i, '')
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
            'Use *!ecchipic list* para ver as opções.'
        })

        return
      }

      /*
       * A API/provider entra depois.
       */
      await sock.sendMessage(jid, {
        text:
          `✅ Categoria selecionada: *${categoria}*\n\n` +
          '🌐 Provider ainda será conectado.'
      })

    } catch (erro) {
      console.error(
        '❌ Erro !ecchipic:',
        erro
      )

      await sock.sendMessage(jid, {
        text:
          '❌ Houve um erro no módulo.'
      })
    }
  }
}
