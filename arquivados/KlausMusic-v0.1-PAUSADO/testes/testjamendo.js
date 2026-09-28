const jamendo =
  require('../musica/services/jamendoService')

const audioService =
  require('../musica/services/audioService')

module.exports = {
  nome: 'testjamendo',

  executar: async ({ sock, jid }) => {
    let arquivo = null

    try {
      await sock.sendMessage(jid, {
        text:
          '🎵 Procurando uma faixa com download autorizado...'
      })

      const faixa =
        await jamendo.buscarBaixavel('rock')

      await sock.sendMessage(jid, {
        text:
          `🎧 *${faixa.titulo}*\n` +
          `👤 ${faixa.artista}\n\n` +
          `⬇️ Baixando...`
      })

      arquivo =
        await jamendo.baixar(faixa)

      await audioService.enviarAudio(
        sock,
        jid,
        arquivo,
        {
          nomeArquivo:
            `${faixa.titulo}.mp3`
        }
      )

      console.log(
        `✅ JAMENDO ENVIADO: ${faixa.titulo}`
      )

    } catch (erro) {
      console.error(
        '❌ Erro testjamendo:',
        erro
      )

      await sock.sendMessage(jid, {
        text:
          `❌ Jamendo: ${erro.message}`
      })

    } finally {
      if (arquivo) {
        jamendo.apagarArquivo(arquivo)
      }

      console.log(
        '🧹 JAMENDO: temporário limpo'
      )
    }
  }
}
