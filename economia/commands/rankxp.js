const rankingService = require('../services/rankingService')
const userService = require('../services/userService')

function formatarNumero(jid) {
  if (!jid) return null

  if (!jid.endsWith('@s.whatsapp.net')) {
    return null
  }

  const numero = jid.split('@')[0]

  return numero
    ? `+${numero}`
    : null
}

module.exports = {
  nome: 'rankxp',

  executar: async ({ sock, jid, msg }) => {
    if (!jid.endsWith('@g.us')) {
      await sock.sendMessage(jid, {
        text: '❌ Esse comando só funciona em grupos.'
      })
      return
    }

    try {
      const metadata =
        await sock.groupMetadata(jid)

      const participantes =
        metadata.participants || []

      const participantesJids =
        participantes
          .map(participante => participante.id)
          .filter(Boolean)

      const dadosParticipantes =
        new Map()

      for (const participante of participantes) {
        if (!participante.id) continue

        dadosParticipantes.set(
          participante.id,
          {
            nome:
              participante.notify ||
              participante.name ||
              participante.verifiedName ||
              participante.username ||
              null,

            telefone:
              participante.phoneNumber ||
              null
          }
        )
      }

      const ranking =
        rankingService.obterRankingDoGrupo(
          participantesJids
        )

      const top10 =
        ranking.slice(0, 10)

      const meuJid =
        msg.key.participant ||
        msg.key.remoteJid

      const minhaPosicao =
        ranking.find(
          usuario => usuario.jid === meuJid
        )

      const meuUsuario =
        userService.obterOuCriarUsuario(
          meuJid,
          msg.pushName || 'Usuário'
        )

      const medalha = posicao => {
        if (posicao === 1) return '🥇'
        if (posicao === 2) return '🥈'
        if (posicao === 3) return '🥉'
        return '▫️'
      }

      let texto =
        `🏆 RANKING DE XP\n\n`

      for (const usuario of top10) {
        const dados =
          dadosParticipantes.get(usuario.jid)

        const nomeBanco =
          usuario.nome &&
          usuario.nome !== 'Usuário'
            ? usuario.nome
            : null

        const nomeWhatsApp =
          dados?.nome || null

        const numero =
          formatarNumero(dados?.telefone) ||
          formatarNumero(usuario.jid)

        const nomeExibido =
          nomeBanco ||
          nomeWhatsApp ||
          numero ||
          'Membro do grupo'

        texto +=
          `${medalha(usuario.posicao)} ` +
          `${usuario.posicao}º — ` +
          `${nomeExibido} — ` +
          `${usuario.xp.toLocaleString('pt-BR')} XP\n`
      }

      texto +=
        `\n━━━━━━━━━━━━━━\n`

      if (minhaPosicao) {
        texto +=
          `📍 Sua posição: #${minhaPosicao.posicao}/${ranking.length}\n` +
          `💠 Seu XP: ${meuUsuario.xp.toLocaleString('pt-BR')} XP`
      } else {
        texto +=
          `📍 Sua posição: -\n` +
          `💠 Seu XP: ${meuUsuario.xp.toLocaleString('pt-BR')} XP`
      }

      await sock.sendMessage(jid, {
        text: texto
      })

    } catch (erro) {
      await sock.sendMessage(jid, {
        text: `❌ ${erro.message}`
      })
    }
  }
}
