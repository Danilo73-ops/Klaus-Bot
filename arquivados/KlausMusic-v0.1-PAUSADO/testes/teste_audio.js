module.exports = {
  nome: 'teste_audio',

  executar: async ({ sock, jid }) => {
    await sock.sendMessage(jid, {
      text: '🎵 GREEN! Clique em Áudio reconhecido pelo Klaus.'
    })
  }
}
