const audioService =
  require('../musica/services/audioService')

module.exports = {
  nome: 'testaudio',

  executar: async ({ sock, jid }) => {
    let arquivo = null

    try {
      await sock.sendMessage(jid, {
        text: '🎵 Testando sistema de áudio do Klaus...'
      })

      arquivo =
        await audioService.gerarAudioTeste()

      await audioService.enviarAudio(
        sock,
        jid,
        arquivo,
        {
          nomeArquivo: 'KlausMusic-Teste.mp3'
        }
      )

      console.log(
        '✅ KLAUS MUSIC: áudio enviado'
      )

    } catch (erro) {
      console.error(
        '❌ Erro teste áudio:',
        erro
      )

      await sock.sendMessage(jid, {
        text:
          `❌ Erro no sistema de áudio: ${erro.message}`
      })

    } finally {
      audioService.apagarArquivo(arquivo)

      console.log(
        '🧹 KLAUS MUSIC: temporário limpo'
      )
    }
  }
}
