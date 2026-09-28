module.exports = {
  nome: 'ping',

  executar: async ({ sock, jid }) => {
    await sock.sendMessage(jid, {
      text: '🏓 Pong! Bot funcionando certinho.'
    })
  }
}
