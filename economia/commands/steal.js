const fs = require('fs')
const stealService = require('../services/stealService')

const caminhoSucesso =
  '/storage/emulated/0/MeuBotWhatsApp/economia/media/steal/sucesso.jpg'

const caminhoFalha =
  '/storage/emulated/0/MeuBotWhatsApp/economia/media/steal/falha.jpg'

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
  nome: 'steal',

  executar: async ({ sock, jid, msg }) => {
    const atacanteJid =
      msg.key.participant ||
      msg.key.remoteJid

    const atacanteNome =
      msg.pushName || 'Usuário'

    const vitimaJid =
      obterAlvo(msg)

    if (!vitimaJid) {
      await sock.sendMessage(jid, {
        text:
          '❌ Marque um usuário ou responda a mensagem dele.\n\n' +
          'Exemplo:\n!steal @usuario'
      })
      return
    }

    try {
      const resultado =
        await stealService.tentarRoubo({
          atacanteJid,
          atacanteNome,
          vitimaJid
        })

      if (resultado.sucesso) {
        const legenda =
          `🥷 LADRÃO PROFISSIONAL\n\n` +
          `✅ SUCESSO\n\n` +
          `💠 XP roubado: ${resultado.valorRoubado.toLocaleString('pt-BR')} XP\n` +
          `💰 Seu saldo agora: ${resultado.saldoAtacanteDepois.toLocaleString('pt-BR')} XP\n\n` +
          `Você escapou sem ser pego.`

        if (fs.existsSync(caminhoSucesso)) {
          await sock.sendMessage(jid, {
            image: {
              url: caminhoSucesso
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
        `🚨 ROUBO FRACASSADO\n\n` +
        `❌ VOCÊ FOI PEGO\n\n` +
        `💸 Prejuízo: ${resultado.penalidade.toLocaleString('pt-BR')} XP\n` +
        `💰 Saldo atual: ${resultado.saldoDepois.toLocaleString('pt-BR')} XP\n\n` +
        `A sorte não estava do seu lado.`

      if (fs.existsSync(caminhoFalha)) {
        await sock.sendMessage(jid, {
          image: {
            url: caminhoFalha
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
