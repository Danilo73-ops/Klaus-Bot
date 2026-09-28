const config = require('../config/economiaConfig')
const { db } = require('../database/database')

const userService = require('./userService')
const transactionService = require('./transactionService')

function sortearInteiro(min, max) {
  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min
}

function obterStatusDaily(jid, nome = null) {
  const usuario =
    userService.obterOuCriarUsuario(jid, nome)

  const agora = Date.now()

  if (!usuario.ultima_daily) {
    return {
      disponivel: true,
      restanteMs: 0
    }
  }

  const duracao =
    config.daily.cooldownHoras * 60 * 60 * 1000

  const restante =
    usuario.ultima_daily + duracao - agora

  if (restante <= 0) {
    return {
      disponivel: true,
      restanteMs: 0
    }
  }

  return {
    disponivel: false,
    restanteMs: restante
  }
}

function formatarTempo(ms) {
  const totalSegundos =
    Math.ceil(ms / 1000)

  const horas =
    Math.floor(totalSegundos / 3600)

  const minutos =
    Math.floor((totalSegundos % 3600) / 60)

  return `${horas}h ${minutos}m`
}

function coletarDaily(jid, nome = null) {
  if (!config.daily.ativo) {
    throw new Error(
      'O daily está desativado.'
    )
  }

  const usuario =
    userService.obterOuCriarUsuario(jid, nome)

  const status =
    obterStatusDaily(jid, nome)

  if (!status.disponivel) {
    throw new Error(
      `Seu daily ainda não está disponível. Aguarde ${formatarTempo(status.restanteMs)}.`
    )
  }

  const valor =
    sortearInteiro(
      config.daily.xpMinimo,
      config.daily.xpMaximo
    )

  const saldoAntes =
    usuario.xp

  const atualizado =
    userService.adicionarXP(
      jid,
      valor,
      nome
    )

  const agora = Date.now()

  db.prepare(`
    UPDATE usuarios
    SET
      ultima_daily = ?,
      xp_daily_total = xp_daily_total + ?,
      daily_coletadas = daily_coletadas + 1,
      atualizado_em = ?
    WHERE jid = ?
  `).run(
    agora,
    valor,
    agora,
    jid
  )

  transactionService.registrarTransacao({
    tipo: 'daily',
    destinoJid: jid,
    valor,
    saldoDestinoAntes: saldoAntes,
    saldoDestinoDepois: atualizado.xp,
    descricao: 'Recompensa diária'
  })

  return {
    valor,
    saldoAntes,
    saldoDepois: atualizado.xp
  }
}

module.exports = {
  obterStatusDaily,
  coletarDaily,
  formatarTempo
}
