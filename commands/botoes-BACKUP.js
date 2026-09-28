module.exports = {
  nome: 'botoes',

  executar: async ({ sock, jid, msg }) => {
    try {
      await sock.sendMessage(jid, {
        text: '🎵 Teste de botões do Klaus',
        footer: 'Escolha uma opção',
        buttons: [
          {
            buttonId: '!teste_audio',
            buttonText: {
              displayText: '🎵 Áudio'
            },
            type: 1
          },
          {
            buttonId: '!teste_video',
            buttonText: {
              displayText: '🎬 Vídeo'
            },
            type: 1
          }
        ],
        headerType: 1
      })
    } catch (erro) {
      console.log(
        '❌ Erro no teste de botões:',
        erro.message
      )

      await sock.sendMessage(jid, {
        text:
          '❌ Seu Baileys não renderizou os botões desse formato.'
      })
    }
  }
}
