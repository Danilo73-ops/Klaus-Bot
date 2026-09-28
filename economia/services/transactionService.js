const { db } = require('../database/database')

function registrarTransacao({
  tipo,
  origemJid = null,
  destinoJid = null,
  valor = 0,
  saldoOrigemAntes = null,
  saldoOrigemDepois = null,
  saldoDestinoAntes = null,
  saldoDestinoDepois = null,
  descricao = null
}) {
  const stmt = db.prepare(`
    INSERT INTO transacoes (
      tipo,
      origem_jid,
      destino_jid,
      valor,
      saldo_origem_antes,
      saldo_origem_depois,
      saldo_destino_antes,
      saldo_destino_depois,
      descricao,
      criado_em
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const resultado = stmt.run(
    tipo,
    origemJid,
    destinoJid,
    Math.floor(Number(valor) || 0),
    saldoOrigemAntes,
    saldoOrigemDepois,
    saldoDestinoAntes,
    saldoDestinoDepois,
    descricao,
    Date.now()
  )

  return resultado.lastInsertRowid
}

function listarTransacoesUsuario(jid, limite = 20) {
  return db.prepare(`
    SELECT *
    FROM transacoes
    WHERE origem_jid = ? OR destino_jid = ?
    ORDER BY criado_em DESC
    LIMIT ?
  `).all(jid, jid, limite)
}

function listarUltimasTransacoes(limite = 50) {
  return db.prepare(`
    SELECT *
    FROM transacoes
    ORDER BY criado_em DESC
    LIMIT ?
  `).all(limite)
}

module.exports = {
  registrarTransacao,
  listarTransacoesUsuario,
  listarUltimasTransacoes
}
