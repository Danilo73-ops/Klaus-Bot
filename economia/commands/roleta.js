const fs = require('fs')
const rouletteService = require('../services/rouletteService')

const caminhoVitoria =
  '/storage/emulated/0/MeuBotWhatsApp/economia/media/roleta/vitoria.jpg'

const caminhoDerrota =
  '/storage/emulated/0/MeuBotWhatsApp/economia/media/roleta/derrota.jpg'

module.exports = {
  nome: 'roleta',

  executar: async ({ sock, jid, msg, args, config }) => {
    const usuarioJid =
      msg.key.participant ||
      msg.key.remoteJid

    const nome =
      msg.pushName || 'Usuário'

    const valor =
      Number(
        String(args?.[0] || '')
          .replace(/\./g, '')
          .replace(/,/g, '')
      )

    if (!Number.isFinite(valor) || valor <= 0) {
      await sock.sendMessage(jid, {
        text:
          `❌ Informe um valor válido.\n\n` +
          `Exemplo:\n${config.prefixo}roleta 5000`
      })
      return
    }

    try {
      const resultado =
        await rouletteService.jogarRoleta({
          jid: usuarioJid,
          nome,
          valor,
          isDono: false
        })

      if (resultado.venceu) {
        const legenda =
          `🎰 ROLETA KLAUS\n\n` +
          `🏆 VITÓRIA\n\n` +
          `💠 Aposta: ${resultado.aposta.toLocaleString('pt-BR')} XP\n` +
          `📈 Lucro: +${resultado.lucro.toLocaleString('pt-BR')} XP\n` +
          `💰 Saldo atual: ${resultado.saldoDepois.toLocaleString('pt-BR')} XP`

        if (fs.existsSync(caminhoVitoria)) {
          await sock.sendMessage(jid, {
            image: {
              url: caminhoVitoria
            },
            caption: legenda
          })
        } else {
          await sock.sendMessage(jid, {
            text: legenda
          })
        }

        return
      }

      const legenda =
        `🎰 ROLETA KLAUS\n\n` +
        `💀 DERROTA\n\n` +
        `💠 Aposta perdida: ${resultado.aposta.toLocaleString('pt-BR')} XP\n` +
        `💰 Saldo atual: ${resultado.saldoDepois.toLocaleString('pt-BR')} XP\n` +
        `🔥 Sequência de derrotas: ${resultado.streakDerrotas}`

      if (fs.existsSync(caminhoDerrota)) {
        await sock.sendMessage(jid, {
          image: {
            url: caminhoDerrota
          },
          caption: legenda
        })
      } else {
        await sock.sendMessage(jid, {
          text: legenda
        })
      }

    } catch (erro) {
      await sock.sendMessage(jid, {
        text: `❌ ${erro.message}`
      })
    }
  }
}
