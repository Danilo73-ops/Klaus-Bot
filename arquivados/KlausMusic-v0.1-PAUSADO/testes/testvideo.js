const videoService =
  require('../musica/services/videoService')

module.exports = {
  nome: 'testvideo',

  executar: async ({ sock, jid }) => {
    let arquivo = null

    try {
      await sock.sendMessage(jid, {
        text: '🎬 Testando sistema de vídeo do Klaus...'
      })

      arquivo =
        await videoService.gerarVideoTeste()

      await videoService.enviarVideo(
        sock,
        jid,
        arquivo,
        {
          nomeArquivo: 'KlausMusic-Teste.mp4',
          caption: '🎬 Klaus Music • Teste'
        }
      )

      console.log('✅ KLAUS MUSIC: vídeo enviado')

    } catch (erro) {
      console.error('❌ Erro teste vídeo:', erro)

      await sock.sendMessage(jid, {
        text: `❌ Erro no sistema de vídeo: ${erro.message}`
      })

    } finally {
      videoService.apagarArquivo(arquivo)
      console.log('🧹 KLAUS MUSIC: temporário limpo')
    }
  }
}
