const transferService = require('../services/transferService')

function obterAlvo(msg) {
  const contexto =
    msg.message?.extendedTextMessage?.contextInfo

  const mencionado =
    contexto?.mentionedJid?.[0]

  if (mencionado) {
    return mencionado
  }

  const respondido =
    contexto?.participant

  if (respondido) {
    return respondido
  }

  return null
}

module.exports = {
  nome: 'doar',

  executar: async ({ sock, jid, msg, args }) => {
    const origemJid =
      msg.key.participant ||
      msg.key.remoteJid

    const origemNome =
      msg.pushName || 'Usuário'

    const destinoJid =
      obterAlvo(msg)

    if (!destinoJid) {
      await sock.sendMessage(jid, {
        text:
          '❌ Marque um usuário ou responda a mensagem dele.\n\nExemplo:\n!doar 5000 @usuario'
      })
      return
    }

    const valor =
      Number(
        String(args?.[0] || '')
          .replace(/\./g, '')
          .replace(/,/g, '')
      )

    if (!Number.isFinite(valor) || valor <= 0) {
      await sock.sendMessage(jid, {
        text:
          '❌ Informe um valor válido.\n\nExemplo:\n!doar 5000 @usuario'
      })
      return
    }

    try {
      const resultado =
        await transferService.doarXP({
          origemJid,
          origemNome,
          destinoJid,
          valor
        })

      await sock.sendMessage(jid, {
        text:
          `🎁 DOAÇÃO REALIZADA\n\n` +
          `💠 Valor: ${resultado.valor.toLocaleString('pt-BR')} XP\n` +
          `💰 Seu saldo: ${resultado.saldoOrigemDepois.toLocaleString('pt-BR')} XP`
      })

    } catch (erro) {
      await sock.sendMessage(jid, {
        text: `❌ ${erro.message}`
      })
    }
  }
}
