const fs = require('fs')
const os = require('os')
const path = require('path')
const { execFile } = require('child_process')
const { promisify } = require('util')
const execFileAsync = promisify(execFile)

const animeService =
  require('../anime/services/animeService')

const animeQueue =
  require('../anime/services/animeQueue')

const animeCooldown =
  require('../anime/services/animeCooldown')

const animeGroupLimit =
  require('../anime/services/animeGroupLimit')

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

const ACAO_VALIDADE_MS = 60000

function criarIdTemporario(comando) {
  return (
    comando +
    ' __kexp=' +
    (Date.now() + ACAO_VALIDADE_MS)
  )
}

function veioDeInteracao(msg) {
  const m = msg.message || {}

  return Boolean(
    m.interactiveResponseMessage ||
    m.templateButtonReplyMessage ||
    m.buttonsResponseMessage ||
    m.listResponseMessage
  )
}

function validarInteracao(texto, msg) {
  texto = String(texto || '').trim()

  // Comando digitado normalmente nunca expira.
  if (!veioDeInteracao(msg)) {
    return {
      valido: true,
      texto
    }
  }

  const match =
    texto.match(/\s__kexp=(\d+)$/)

  // Botões antigos, criados antes desse sistema,
  // também deixam de ser aceitos.
  if (!match) {
    return {
      valido: false,
      texto: ''
    }
  }

  const expiraEm =
    Number(match[1])

  if (
    !Number.isFinite(expiraEm) ||
    Date.now() > expiraEm
  ) {
    return {
      valido: false,
      texto: ''
    }
  }

  return {
    valido: true,

    texto:
      texto
        .replace(/\s__kexp=\d+$/, '')
        .trim()
  }
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

    const cooldown =
      animeCooldown.checarCooldown(autor)

    if (!cooldown.liberado) {
      const segundos =
        animeCooldown.formatarRestante(
          cooldown.restanteMs
        )

      await sock.sendMessage(jid, {
        text:
          `⏳ Calma aí 😅\n\nEspere *${segundos}s* para usar o comando anime novamente.`
      })

      return
    }

    if (jid.endsWith('@g.us')) {
      const limiteGrupo =
        animeGroupLimit.checarGrupo(jid)

      if (!limiteGrupo.liberado) {
        const segundos =
          animeGroupLimit.formatarRestante(
            limiteGrupo.restanteMs
          )

        await sock.sendMessage(jid, {
          text:
            `🚦 O grupo está usando muitos comandos de anime agora.\n\nAguarde *${segundos}s* e tente novamente.`
        })

        return
      }
    }

    try {
      const textoBruto = pegarTexto(msg)

      const interacao =
        validarInteracao(
          textoBruto,
          msg
        )

      if (!interacao.valido) {
        await sock.sendMessage(jid, {
          text:
            '⌛ Esse botão/lista expirou.\n\n' +
            'Use *!anime* ou *!anime list* para abrir opções novas.'
        })

        return
      }

      const texto =
        interacao.texto

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
              'Escolha uma categoria SFW:',

            rodape:
              'Klaus ✦ Anime',

            botoes: [
              {
                name: 'single_select',

                buttonParamsJson:
                  JSON.stringify({
                    title: '🎴 Ver categorias',

                    sections: [
                      {
                        title: '✨ Principais',

                        rows: [
                          {
                            title: '🎲 Aleatório',
                            description: 'Anime aleatório',
                            id: '!anime'
                          },
                          {
                            title: '😺 Neko',
                            description: 'Personagens neko',
                            id: '!anime neko'
                          },
                          {
                            title: '🦊 Kitsune',
                            description: 'Personagens kitsune',
                            id: '!anime kitsune'
                          },
                          {
                            title: '✨ Waifu',
                            description: 'Personagem feminina aleatória',
                            id: '!anime waifu'
                          },
                          {
                            title: '🧑 Husbando',
                            description: 'Personagem masculino aleatório',
                            id: '!anime husbando'
                          }
                        ]
                      },

                      {
                        title: '🎭 Emoções',

                        rows: [
                          {
                            title: '😂 Laugh',
                            description: 'Rindo',
                            id: '!anime laugh'
                          },
                          {
                            title: '😭 Cry',
                            description: 'Chorando',
                            id: '!anime cry'
                          },
                          {
                            title: '😄 Happy',
                            description: 'Feliz',
                            id: '!anime happy'
                          },
                          {
                            title: '😊 Smile',
                            description: 'Sorrindo',
                            id: '!anime smile'
                          },
                          {
                            title: '😳 Blush',
                            description: 'Corando',
                            id: '!anime blush'
                          },
                          {
                            title: '😠 Angry',
                            description: 'Com raiva',
                            id: '!anime angry'
                          },
                          {
                            title: '😏 Smug',
                            description: 'Expressão convencida',
                            id: '!anime smug'
                          },
                          {
                            title: '😗 Pout',
                            description: 'Fazendo bico',
                            id: '!anime pout'
                          },
                          {
                            title: '😱 Shocked',
                            description: 'Chocado',
                            id: '!anime shocked'
                          },
                          {
                            title: '😐 Bored',
                            description: 'Entediado',
                            id: '!anime bored'
                          },
                          {
                            title: '😵 Confused',
                            description: 'Confuso',
                            id: '!anime confused'
                          }
                        ]
                      },

                      {
                        title: '💞 Interações',

                        rows: [
                          {
                            title: '🤗 Hug',
                            description: 'Abraço',
                            id: '!anime hug'
                          },
                          {
                            title: '🫂 Cuddle',
                            description: 'Carinho',
                            id: '!anime cuddle'
                          },
                          {
                            title: '🫳 Pat',
                            description: 'Cafuné',
                            id: '!anime pat'
                          },
                          {
                            title: '👉 Poke',
                            description: 'Cutucando',
                            id: '!anime poke'
                          },
                          {
                            title: '🙌 High Five',
                            description: 'Toca aqui',
                            id: '!anime highfive'
                          },
                          {
                            title: '👋 Wave',
                            description: 'Acenando',
                            id: '!anime wave'
                          },
                          {
                            title: '😉 Wink',
                            description: 'Piscando',
                            id: '!anime wink'
                          }
                        ]
                      },

                      {
                        title: '🎬 Reações',

                        rows: [
                          {
                            title: '💃 Dance',
                            description: 'Dançando',
                            id: '!anime dance'
                          },
                          {
                            title: '🤦 Facepalm',
                            description: 'Facepalm',
                            id: '!anime facepalm'
                          },
                          {
                            title: '🤔 Think',
                            description: 'Pensando',
                            id: '!anime think'
                          },
                          {
                            title: '👀 Stare',
                            description: 'Encarando',
                            id: '!anime stare'
                          },
                          {
                            title: '🤷 Shrug',
                            description: 'Dando de ombros',
                            id: '!anime shrug'
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
            const id =
              `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

            const gifTmp =
              path.join(os.tmpdir(), `klaus-anime-${id}.gif`)

            const mp4Tmp =
              path.join(os.tmpdir(), `klaus-anime-${id}.mp4`)

            try {
              const respostaGif =
                await fetch(resultado.url)

              if (!respostaGif.ok) {
                throw new Error(
                  `Falha ao baixar GIF: HTTP ${respostaGif.status}`
                )
              }

              const bufferGif =
                Buffer.from(
                  await respostaGif.arrayBuffer()
                )

              fs.writeFileSync(
                gifTmp,
                bufferGif
              )

              await execFileAsync(
                'ffmpeg',
                [
                  '-y',
                  '-i', gifTmp,
                  '-movflags', '+faststart',
                  '-pix_fmt', 'yuv420p',
                  '-vf',
                  'scale=trunc(iw/2)*2:trunc(ih/2)*2',
                  '-an',
                  mp4Tmp
                ]
              )

              await sock.sendMessage(jid, {
                video: {
                  url: mp4Tmp
                },
                gifPlayback: true,
                caption: legenda
              })

            } finally {
              for (const arquivoTmp of [gifTmp, mp4Tmp]) {
                try {
                  if (
                    fs.existsSync(arquivoTmp)
                  ) {
                    fs.unlinkSync(arquivoTmp)
                  }
                } catch {}
              }
            }
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
                      id: criarIdTemporario(`!anime ${categoria === 'random' ? '' : categoria}`.trim())
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
