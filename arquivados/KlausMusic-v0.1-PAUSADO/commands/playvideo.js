module.exports = {
  nome: 'playvideo',

  executar: async ({ sock, jid, msg }) => {
    await sock.sendMessage(jid, {
      text:
        '🎬 GREEN! Opção Vídeo reconhecida.\n\n' +
        'Agora falta conectar o processamento do vídeo.'
    })
  }
}
