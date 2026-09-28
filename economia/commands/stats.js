const profileService = require('../services/profileService')

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

  return (
    msg.key.participant ||
    msg.key.remoteJid
  )
}

module.exports = {
  nome: 'stats',

  executar: async ({ sock, jid, msg }) => {
    const alvo = obterAlvo(msg)

    const autorAtual =
      msg.key.participant ||
      msg.key.remoteJid

    const nome =
      alvo === autorAtual
        ? (msg.pushName || 'Usuário')
        : null

    const s =
      profileService.obterEstatisticas(
        alvo,
        nome
      )

    const texto = `
╭─「 ESTATÍSTICAS 」
│
│ 👤 ${s.nome}
│ 💠 XP atual: ${s.xp.toLocaleString('pt-BR')}
│ 🏆 Ranking: #${s.ranking ?? '-'}
│
│ 📈 XP ganho: ${s.xpTotalGanho.toLocaleString('pt-BR')}
│ 📉 XP perdido: ${s.xpTotalPerdido.toLocaleString('pt-BR')}
│ 👑 Maior saldo: ${s.maiorSaldo.toLocaleString('pt-BR')}
│
├─「 ROLETA 」
│ 🎰 Vitórias: ${s.vitoriasRoleta}
│ 💀 Derrotas: ${s.derrotasRoleta}
│ 🔥 Streak atual de reds: ${s.streakDerrotas}
│ ☠️ Maior sequência de reds: ${s.maiorStreakDerrotas}
│
├─「 STEAL 」
│ 🥷 Tentativas: ${s.stealsTentados}
│ ✅ Sucessos: ${s.stealsSucesso}
│ ❌ Falhas: ${s.stealsFalha}
│ 💰 XP roubado: ${s.xpRoubado.toLocaleString('pt-BR')}
│ 🚨 XP perdido em roubos: ${s.xpPerdidoRoubo.toLocaleString('pt-BR')}
│
├─「 TRANSFERÊNCIAS 」
│ 🎁 XP doado: ${s.xpDoado.toLocaleString('pt-BR')}
│ 📥 XP recebido: ${s.xpRecebido.toLocaleString('pt-BR')}
│
├─「 ATIVIDADE 」
│ 💬 XP hoje: ${s.xpAtividadeHoje.toLocaleString('pt-BR')}
│ 📊 XP total por atividade: ${s.xpAtividadeTotal.toLocaleString('pt-BR')}
│
├─「 DAILY 」
│ 🎁 Total coletado: ${s.xpDailyTotal.toLocaleString('pt-BR')} XP
│ 📅 Dailies coletadas: ${s.dailyColetadas}
│
╰────────────
`.trim()

    await sock.sendMessage(jid, {
      text: texto
    })
  }
}
