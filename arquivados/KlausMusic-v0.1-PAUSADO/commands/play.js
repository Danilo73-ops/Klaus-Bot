const buscaService =
  require('../musica/services/buscaService')

const nativeFlow =
  require('../musica/utils/nativeFlow')

function textoMensagem(msg) {
  const m = msg.message || {}

  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    ''
  )
}

function duracao(segundos) {
  segundos = Number(segundos)

  if (!segundos) {
    return '--:--'
  }

  const min = Math.floor(segundos / 60)
  const seg = Math.floor(segundos % 60)

  return `${min}:${String(seg).padStart(2, '0')}`
}

function cortar(texto, max = 60) {
  texto = String(texto || '')

  return texto.length > max
    ? texto.slice(0, max - 1) + '…'
    : texto
}

module.exports = {
  nome: 'play',

  executar: async ({ sock, jid, msg }) => {
    try {
      const texto = textoMensagem(msg)

      const termo = texto
        .replace(/^!play\s*/i, '')
        .trim()

      if (!termo) {
        return sock.sendMessage(jid, {
          text:
            '🎧 Use assim:\n\n' +
            '!play nome da música\n\n' +
            'Exemplo:\n' +
            '!play Green Lights'
        })
      }

      await sock.sendMessage(jid, {
        text:
          `🔎 Procurando *${cortar(termo, 80)}*...`
      })

      const resultados =
        await buscaService.buscar(termo)

      if (!resultados.length) {
        return sock.sendMessage(jid, {
          text:
            '❌ Não encontrei uma faixa com download ' +
            'disponível nos provedores atuais.'
        })
      }

      const rows = resultados.map((faixa, i) => ({
        header: `${i + 1}`,

        title:
          cortar(faixa.titulo, 55),

        description:
          cortar(
            `${faixa.artista} • ${duracao(faixa.duracao)}`,
            70
          ),

        id:
          `!playpick ${faixa.provedor}:${faixa.id}`
      }))

      await nativeFlow.enviar(
        sock,
        jid,
        msg,
        {
          texto:
            `🔎 Encontrei ${resultados.length} resultados.\n` +
            `Escolha qual você quer:`,

          botoes: [
            {
              name: 'single_select',

              buttonParamsJson:
                JSON.stringify({
                  title: '🎵 Escolher música',

                  sections: [
                    {
                      title: 'Resultados disponíveis',
                      rows
                    }
                  ]
                })
            }
          ]
        }
      )

      console.log(
        `✅ PLAY: ${resultados.length} resultado(s) para "${termo}"`
      )

    } catch (erro) {
      console.error('❌ Erro !play:', erro)

      await sock.sendMessage(jid, {
        text:
          `❌ Erro no Klaus Music: ${erro.message}`
      })
    }
  }
}
