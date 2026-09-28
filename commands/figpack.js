const packService =
  require('../figpacks/services/packService')

function pegarTexto(msg) {
  const m = msg.message || {}

  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    ''
  )
}

module.exports = {
  nome: 'figpack',

  executar: async ({
    sock,
    jid,
    msg
  }) => {
    try {
      const texto =
        pegarTexto(msg)

      const categoria =
        texto
          .replace(/^!figpack\s*/i, '')
          .trim()
          .toLowerCase()

      if (!categoria) {
        await sock.sendMessage(jid, {
          text:
            '🎴 Use assim:\n\n' +
            '*!figpack naruto*'
        })
        return
      }

      if (
        !packService
          .categoriaExiste(categoria)
      ) {
        await sock.sendMessage(jid, {
          text:
            `❌ Não existe o pack *${categoria}*.`
        })
        return
      }

      const resultado =
        await packService.buscar(
          categoria
        )

      await sock.sendMessage(jid, {
        sticker: {
          url: resultado.url
        }
      })

      console.log(
        `✅ FIGPACK: ${categoria} | ` +
        `${resultado.totalEncontrado} encontradas`
      )

    } catch (erro) {
      console.error(
        '❌ Erro !figpack:',
        erro.message
      )

      await sock.sendMessage(jid, {
        text:
          `❌ ${erro.message}`
      })
    }
  }
}
