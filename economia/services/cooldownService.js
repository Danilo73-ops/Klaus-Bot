const { db } = require('../database/database')

function agora() {
  return Date.now()
}

function obterCooldown(jid, tipo) {
  return db.prepare(`
    SELECT *
    FROM cooldowns
    WHERE jid = ? AND tipo = ?
  `).get(jid, tipo)
}

function estaEmCooldown(jid, tipo) {
  const cooldown = obterCooldown(jid, tipo)

  if (!cooldown) {
    return {
      ativo: false,
      restanteMs: 0
    }
  }

  const restanteMs = cooldown.expira_em - agora()

  if (restanteMs <= 0) {
    db.prepare(`
      DELETE FROM cooldowns
      WHERE jid = ? AND tipo = ?
    `).run(jid, tipo)

    return {
      ativo: false,
      restanteMs: 0
    }
  }

  return {
    ativo: true,
    restanteMs
  }
}

function definirCooldown(jid, tipo, duracaoMs) {
  const expiraEm = agora() + duracaoMs

  db.prepare(`
    INSERT INTO cooldowns (jid, tipo, expira_em)
    VALUES (?, ?, ?)
    ON CONFLICT(jid, tipo)
    DO UPDATE SET expira_em = excluded.expira_em
  `).run(jid, tipo, expiraEm)

  return expiraEm
}

function removerCooldown(jid, tipo) {
  db.prepare(`
    DELETE FROM cooldowns
    WHERE jid = ? AND tipo = ?
  `).run(jid, tipo)
}

function formatarTempo(ms) {
  const segundos = Math.ceil(ms / 1000)

  const minutos = Math.floor(segundos / 60)
  const segundosRestantes = segundos % 60

  if (minutos > 0) {
    return `${minutos}m ${segundosRestantes}s`
  }

  return `${segundosRestantes}s`
}

module.exports = {
  obterCooldown,
  estaEmCooldown,
  definirCooldown,
  removerCooldown,
  formatarTempo
}
