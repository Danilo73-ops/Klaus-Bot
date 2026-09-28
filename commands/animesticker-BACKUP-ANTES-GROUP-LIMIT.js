const fs = require('fs')
const os = require('os')
const path = require('path')
const { execFile } = require('child_process')
const { promisify } = require('util')

const animeService =
  require('../anime/services/animeService')

const nativeFlow =
  require('../utils/nativeFlow')

const animeCooldown =
  require('../anime/services/animeCooldown')

const execFileAsync = promisify(execFile)

function pegarAutor(msg, jid) {
  return (
    msg.key?.participant ||
    msg.participant ||
    msg.key?.remoteJid ||
    jid
  )
}

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

async function baixar(url, destino) {
  const resposta = await fetch(url, {
    headers: {
      'User-Agent': 'KlausBot/1.1'
    }
  })

  if (!resposta.ok) {
    throw new Error(
      `Falha ao baixar mídia: HTTP ${resposta.status}`
    )
  }

  const buffer =
    Buffer.from(
      await resposta.arrayBuffer()
    )

  fs.writeFileSync(
    destino,
    buffer
  )
}

async function converterImagem512(entrada, saida) {
  await execFileAsync('ffmpeg', [
    '-y',
    '-i', entrada,

    '-vf',
    'scale=512:512:force_original_aspect_ratio=increase:flags=lanczos,' +
    'crop=512:512',

    '-vcodec', 'libwebp',
    '-lossless', '0',
    '-compression_level', '6',
    '-q:v', '85',
    '-an',

    saida
  ])
}

async function converterGifSticker(entrada, saida) {
  await execFileAsync('ffmpeg', [
    '-y',
    '-i', entrada,

    '-vf',
    'fps=12,' +
    'scale=512:512:force_original_aspect_ratio=increase:flags=lanczos,' +
    'crop=512:512',

    '-vcodec', 'libwebp',
    '-lossless', '0',
    '-compression_level', '6',
    '-q:v', '70',
    '-loop', '0',
    '-an',

    saida
  ])
}

async function enviarLista(sock, jid, msg) {
  await nativeFlow.enviar(
    sock,
    jid,
    msg,
    {
      titulo: '📚 Klaus Anime Sticker',

      texto:
        'Escolha uma categoria:',

      rodape:
        'Klaus ✦ Sticker Lab',

      botoes: [
        {
          name: 'single_select',

          buttonParamsJson:
            JSON.stringify({
              title:
                '🧩 Ver categorias',

              sections: [
                {
                  title:
                    '✨ Principais',

                  rows: [
                    {
                      title:
                        '🎲 Aleatório',
                      id:
                        '!animesticker'
                    },
                    {
                      title:
                        '😺 Neko',
                      id:
                        '!animesticker neko'
                    },
                    {
                      title:
                        '🦊 Kitsune',
                      id:
                        '!animesticker kitsune'
                    },
                    {
                      title:
                        '✨ Waifu',
                      id:
                        '!animesticker waifu'
                    },
                    {
                      title:
                        '🧑 Husbando',
                      id:
                        '!animesticker husbando'
                    }
                  ]
                },

                {
                  title:
                    '🎭 Emoções',

                  rows: [
                    {
                      title:
                        '😂 Laugh',
                      id:
                        '!animesticker laugh'
                    },
                    {
                      title:
                        '😭 Cry',
                      id:
                        '!animesticker cry'
                    },
                    {
                      title:
                        '😄 Happy',
                      id:
                        '!animesticker happy'
                    },
                    {
                      title:
                        '😊 Smile',
                      id:
                        '!animesticker smile'
                    },
                    {
                      title:
                        '😳 Blush',
                      id:
                        '!animesticker blush'
                    },
                    {
                      title:
                        '😠 Angry',
                      id:
                        '!animesticker angry'
                    },
                    {
                      title:
                        '😏 Smug',
                      id:
                        '!animesticker smug'
                    },
                    {
                      title:
                        '😗 Pout',
                      id:
                        '!animesticker pout'
                    },
                    {
                      title:
                        '😱 Shocked',
                      id:
                        '!animesticker shocked'
                    },
                    {
                      title:
                        '😐 Bored',
                      id:
                        '!animesticker bored'
                    },
                    {
                      title:
                        '😵 Confused',
                      id:
                        '!animesticker confused'
                    }
                  ]
                },

                {
                  title:
                    '💞 Interações',

                  rows: [
                    {
                      title:
                        '🤗 Hug',
                      id:
                        '!animesticker hug'
                    },
                    {
                      title:
                        '🫂 Cuddle',
                      id:
                        '!animesticker cuddle'
                    },
                    {
                      title:
                        '🫳 Pat',
                      id:
                        '!animesticker pat'
                    },
                    {
                      title:
                        '👉 Poke',
                      id:
                        '!animesticker poke'
                    },
                    {
                      title:
                        '🙌 High Five',
                      id:
                        '!animesticker highfive'
                    },
                    {
                      title:
                        '👋 Wave',
                      id:
                        '!animesticker wave'
                    },
                    {
                      title:
                        '😉 Wink',
                      id:
                        '!animesticker wink'
                    }
                  ]
                },

                {
                  title:
                    '🎬 Reações',

                  rows: [
                    {
                      title:
                        '💃 Dance',
                      id:
                        '!animesticker dance'
                    },
                    {
                      title:
                        '🤦 Facepalm',
                      id:
                        '!animesticker facepalm'
                    },
                    {
                      title:
                        '🤔 Think',
                      id:
                        '!animesticker think'
                    },
                    {
                      title:
                        '👀 Stare',
                      id:
                        '!animesticker stare'
                    },
                    {
                      title:
                        '🤷 Shrug',
                      id:
                        '!animesticker shrug'
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
  nome: 'animesticker',

  executar: async ({ sock, jid, msg }) => {
    let entrada = null
    let saida = null

    try {
      const texto =
        pegarTexto(msg)

      let categoria =
        texto
          .replace(/^!animesticker\s*/i, '')
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

      const autor =
        pegarAutor(msg, jid)

      const cooldown =
        animeCooldown.checarCooldown(autor)

      if (!cooldown.liberado) {
        const segundos =
          animeCooldown.formatarRestante(
            cooldown.restanteMs
          )

        await sock.sendMessage(jid, {
          text:
            `🚦 Limite de figurinha anime atingido.\n\nVocê pode gerar até *3 figurinhas seguidas*. Aguarde *${segundos}s* para continuar.`
        })

        return
      }

      const resultado =
        await animeService.buscar(
          categoria
        )

      await sock.sendMessage(jid, {
        text:
          '🧩 Criando figurinha anime...'
      })

      const id =
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`

      entrada =
        path.join(
          os.tmpdir(),
          `klaus-animesticker-${id}.bin`
        )

      saida =
        path.join(
          os.tmpdir(),
          `klaus-animesticker-${id}.webp`
        )

      await baixar(
        resultado.url,
        entrada
      )

      if (resultado.tipo === 'gif') {
        await converterGifSticker(
          entrada,
          saida
        )
      } else {
        await converterImagem512(
          entrada,
          saida
        )
      }

      await sock.sendMessage(jid, {
        sticker: {
          url: saida
        }
      })

      console.log(
        `✅ ANIMESTICKER ENVIADO: ${categoria}`
      )

    } catch (erro) {
      console.error(
        '❌ Erro !animesticker:',
        erro.message
      )

      await sock.sendMessage(jid, {
        text:
          `❌ Não consegui criar a figurinha: ${erro.message}`
      })

    } finally {
      for (const arquivo of [entrada, saida]) {
        if (
          arquivo &&
          fs.existsSync(arquivo)
        ) {
          try {
            fs.unlinkSync(
              arquivo
            )
          } catch {}
        }
      }
    }
  }
}
