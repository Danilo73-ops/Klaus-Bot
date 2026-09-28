const dailyService = require('../services/dailyService')

module.exports = {
  nome: 'daily',

  executar: async ({ sock, jid, msg }) => {
    const usuarioJid =
      msg.key.participant ||
      msg.key.remoteJid

    const nome =
      msg.pushName || 'Usuário'

    try {
      const resultado =
        dailyService.coletarDaily(
          usuarioJid,
          nome
        )

      await sock.sendMessage(jid, {
        text:
          `🎁 DAILY COLETADO\n\n` +
          `Você recebeu ${resultado.valor.toLocaleString('pt-BR')} XP.\n\n` +
          `💰 Saldo atual: ${resultado.saldoDepois.toLocaleString('pt-BR')} XP`
      })

    } catch (erro) {
      await sock.sendMessage(jid, {
        text: `❌ ${erro.message}`
      })
    }
  }
}
