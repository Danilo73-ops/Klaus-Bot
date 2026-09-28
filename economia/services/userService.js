const { db } = require('../database/database')
const config = require('../config/economiaConfig')

function agora() {
  return Date.now()
}

function buscarUsuario(jid) {
  return db
    .prepare('SELECT * FROM usuarios WHERE jid = ?')
    .get(jid)
}

function criarUsuario(jid, nome = null) {
  const existente = buscarUsuario(jid)

  if (existente) {
    return existente
  }

  const tempo = agora()
  const saldoInicial = config.sistema.saldoInicial

  db.prepare(`
    INSERT INTO usuarios (
      jid,
      nome,
      xp,
      maior_saldo,
      criado_em,
      atualizado_em
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    jid,
    nome,
    saldoInicial,
    saldoInicial,
    tempo,
    tempo
  )

  return buscarUsuario(jid)
}

function obterOuCriarUsuario(jid, nome = null) {
  const usuario = buscarUsuario(jid)

  if (usuario) {
    if (nome && usuario.nome !== nome) {
      db.prepare(`
        UPDATE usuarios
        SET nome = ?, atualizado_em = ?
        WHERE jid = ?
      `).run(nome, agora(), jid)
    }

    return buscarUsuario(jid)
  }

  return criarUsuario(jid, nome)
}

function obterSaldo(jid) {
  const usuario = obterOuCriarUsuario(jid)
  return usuario.xp
}

function adicionarXP(jid, valor, nome = null) {
  valor = Math.floor(Number(valor))

  if (!Number.isFinite(valor) || valor <= 0) {
    throw new Error('Valor de XP inválido.')
  }

  const usuario = obterOuCriarUsuario(jid, nome)

  const novoSaldo = usuario.xp + valor

  db.prepare(`
    UPDATE usuarios
    SET
      xp = ?,
      xp_total_ganho = xp_total_ganho + ?,
      maior_saldo = CASE
        WHEN ? > maior_saldo THEN ?
        ELSE maior_saldo
      END,
      atualizado_em = ?
    WHERE jid = ?
  `).run(
    novoSaldo,
    valor,
    novoSaldo,
    novoSaldo,
    agora(),
    jid
  )

  return buscarUsuario(jid)
}

function removerXP(jid, valor, nome = null) {
  valor = Math.floor(Number(valor))

  if (!Number.isFinite(valor) || valor <= 0) {
    throw new Error('Valor de XP inválido.')
  }

  const usuario = obterOuCriarUsuario(jid, nome)

  if (
    config.seguranca.bloquearSaldoNegativo &&
    usuario.xp < valor
  ) {
    throw new Error('Saldo insuficiente.')
  }

  const novoSaldo = Math.max(0, usuario.xp - valor)

  db.prepare(`
    UPDATE usuarios
    SET
      xp = ?,
      xp_total_perdido = xp_total_perdido + ?,
      atualizado_em = ?
    WHERE jid = ?
  `).run(
    novoSaldo,
    valor,
    agora(),
    jid
  )

  return buscarUsuario(jid)
}

function definirXP(jid, valor, nome = null) {
  valor = Math.floor(Number(valor))

  if (!Number.isFinite(valor) || valor < 0) {
    throw new Error('Valor de XP inválido.')
  }

  const usuario = obterOuCriarUsuario(jid, nome)

  db.prepare(`
    UPDATE usuarios
    SET
      xp = ?,
      maior_saldo = CASE
        WHEN ? > maior_saldo THEN ?
        ELSE maior_saldo
      END,
      atualizado_em = ?
    WHERE jid = ?
  `).run(
    valor,
    valor,
    valor,
    agora(),
    jid
  )

  return buscarUsuario(jid)
}

module.exports = {
  buscarUsuario,
  criarUsuario,
  obterOuCriarUsuario,
  obterSaldo,
  adicionarXP,
  removerXP,
  definirXP
}
