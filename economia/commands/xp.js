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
  nome: 'xp',

  executar: async ({ sock, jid, msg }) => {
    const alvo = obterAlvo(msg)

    const meuJid =
      msg.key.participant ||
      msg.key.remoteJid

    const nome =
      alvo === meuJid
        ? (msg.pushName || 'Usuário')
        : null

    let participantesJids = null

    if (jid.endsWith('@g.us')) {
      try {
        const metadata =
          await sock.groupMetadata(jid)

        participantesJids =
          metadata.participants
            .map(participante => participante.id)
            .filter(Boolean)
      } catch (erro) {
        participantesJids = null
      }
    }

    const perfil =
      profileService.obterPerfil(
        alvo,
        nome,
        participantesJids
      )

    const rankingTexto =
      perfil.ranking
        ? (
            perfil.totalRanking
              ? `#${perfil.ranking}/${perfil.totalRanking}`
              : `#${perfil.ranking}`
          )
        : '-'

    const texto = `
╭─「 XP 」
│
│ 👤 ${perfil.nome}
│ 💠 Saldo: ${perfil.xp.toLocaleString('pt-BR')} XP
│ 🏆 Ranking: ${rankingTexto}
│
╰────────────
`.trim()

    await sock.sendMessage(jid, {
      text: texto
    })
  }
}
