module.exports = {
  nome: 'teste_video',

  executar: async ({ sock, jid }) => {
    await sock.sendMessage(jid, {
      text: '🎬 GREEN! Clique em Vídeo reconhecido pelo Klaus.'
    })
  }
}
