const userService = require('./userService')
const rankingService = require('./rankingService')

function obterPerfil(jid, nome = null, participantesJids = null) {
  const usuario =
    userService.obterOuCriarUsuario(jid, nome)

  let ranking = null
  let totalRanking = null

  if (Array.isArray(participantesJids) && participantesJids.length) {
    const resultado =
      rankingService.obterPosicaoNoGrupo(
        jid,
        participantesJids
      )

    ranking = resultado?.posicao ?? null
    totalRanking = resultado?.total ?? null
  } else {
    ranking =
      rankingService.obterPosicao(jid)
  }

  return {
    jid: usuario.jid,
    nome: usuario.nome || nome || 'Usuário',
    xp: usuario.xp,
    ranking,
    totalRanking
  }
}

function obterEstatisticas(jid, nome = null, participantesJids = null) {
  const usuario =
    userService.obterOuCriarUsuario(jid, nome)

  let ranking = null
  let totalRanking = null

  if (Array.isArray(participantesJids) && participantesJids.length) {
    const resultado =
      rankingService.obterPosicaoNoGrupo(
        jid,
        participantesJids
      )

    ranking = resultado?.posicao ?? null
    totalRanking = resultado?.total ?? null
  } else {
    ranking =
      rankingService.obterPosicao(jid)
  }

  return {
    jid: usuario.jid,
    nome: usuario.nome || nome || 'Usuário',

    xp: usuario.xp,
    ranking,
    totalRanking,

    xpTotalGanho:
      usuario.xp_total_ganho || 0,

    xpTotalPerdido:
      usuario.xp_total_perdido || 0,

    maiorSaldo:
      usuario.maior_saldo || 0,

    vitoriasRoleta:
      usuario.vitorias_roleta || 0,

    derrotasRoleta:
      usuario.derrotas_roleta || 0,

    streakDerrotas:
      usuario.streak_derrotas_roleta || 0,

    maiorStreakDerrotas:
      usuario.maior_streak_derrotas || 0,

    stealsTentados:
      usuario.steals_tentados || 0,

    stealsSucesso:
      usuario.steals_sucesso || 0,

    stealsFalha:
      usuario.steals_falha || 0,

    xpRoubado:
      usuario.xp_roubado || 0,

    xpPerdidoRoubo:
      usuario.xp_perdido_roubo || 0,

    xpDoado:
      usuario.xp_doado || 0,

    xpRecebido:
      usuario.xp_recebido || 0,

    xpAtividadeHoje:
      usuario.xp_atividade_hoje || 0,

    xpAtividadeTotal:
      usuario.xp_atividade_total || 0,

    xpDailyTotal:
      usuario.xp_daily_total || 0,

    dailyColetadas:
      usuario.daily_coletadas || 0
  }
}

module.exports = {
  obterPerfil,
  obterEstatisticas
}
