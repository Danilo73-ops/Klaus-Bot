const { db } = require('../database/database')
const config = require('../config/activityConfig')
const userService = require('./userService')
const transactionService = require('./transactionService')

function hoje() {
  return new Date().toISOString().slice(0, 10)
}

function sortearInteiro(min, max) {
  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min
}

function sortearIntervaloMs() {
  const minutos = sortearInteiro(
    config.intervaloMinMinutos,
    config.intervaloMaxMinutos
  )

  return minutos * 60 * 1000
}

function mensagemValida(texto, prefixo = '!') {
  if (!config.ativo) return false

  if (typeof texto !== 'string') return false

  const limpa = texto.trim()

  if (limpa.length < config.tamanhoMinimoMensagem) {
    return false
  }

  if (
    !config.contarComandos &&
    limpa.startsWith(prefixo)
  ) {
    return false
  }

  return true
}

function normalizarDia(usuario) {
  const dataHoje = hoje()

  if (usuario.data_atividade === dataHoje) {
    return usuario
  }

  db.prepare(`
    UPDATE usuarios
    SET
      xp_atividade_hoje = 0,
      data_atividade = ?,
      atualizado_em = ?
    WHERE jid = ?
  `).run(
    dataHoje,
    Date.now(),
    usuario.jid
  )

  return userService.buscarUsuario(usuario.jid)
}

function processarAtividade({
  jid,
  nome = null,
  texto,
  prefixo = '!'
}) {
  if (!mensagemValida(texto, prefixo)) {
    return {
      ganhou: false,
      motivo: 'mensagem_invalida'
    }
  }

  let usuario =
    userService.obterOuCriarUsuario(jid, nome)

  usuario = normalizarDia(usuario)

  if (
    usuario.xp_atividade_hoje >=
    config.limiteDiarioXP
  ) {
    return {
      ganhou: false,
      motivo: 'limite_diario'
    }
  }

  const agora = Date.now()

  if (usuario.ultima_recompensa_atividade) {
    const passou =
      agora - usuario.ultima_recompensa_atividade

    const proximoIntervalo =
      sortearIntervaloMs()

    if (passou < proximoIntervalo) {
      return {
        ganhou: false,
        motivo: 'cooldown'
      }
    }
  }

  let valor = sortearInteiro(
    config.xpMinimo,
    config.xpMaximo
  )

  const restanteDiario =
    config.limiteDiarioXP -
    usuario.xp_atividade_hoje

  valor = Math.min(
    valor,
    restanteDiario
  )

  const saldoAntes = usuario.xp

  const atualizado =
    userService.adicionarXP(
      jid,
      valor,
      nome
    )

  db.prepare(`
    UPDATE usuarios
    SET
      ultima_recompensa_atividade = ?,
      xp_atividade_hoje = xp_atividade_hoje + ?,
      xp_atividade_total = xp_atividade_total + ?,
      data_atividade = ?,
      atualizado_em = ?
    WHERE jid = ?
  `).run(
    agora,
    valor,
    valor,
    hoje(),
    agora,
    jid
  )

  transactionService.registrarTransacao({
    tipo: 'atividade',
    destinoJid: jid,
    valor,
    saldoDestinoAntes: saldoAntes,
    saldoDestinoDepois: atualizado.xp,
    descricao: 'XP ganho por atividade no grupo'
  })

  return {
    ganhou: true,
    valor,
    saldoAntes,
    saldoDepois: atualizado.xp
  }
}

function obterResumoAtividade(jid) {
  const usuario =
    userService.obterOuCriarUsuario(jid)

  const normalizado =
    normalizarDia(usuario)

  return {
    hoje:
      normalizado.xp_atividade_hoje || 0,

    total:
      normalizado.xp_atividade_total || 0,

    limiteDiario:
      config.limiteDiarioXP
  }
}

module.exports = {
  mensagemValida,
  processarAtividade,
  obterResumoAtividade
}
