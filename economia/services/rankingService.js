const { db } = require('../database/database')

function obterRanking(limite = 10) {
  return db.prepare(`
    SELECT
      jid,
      nome,
      xp,
      maior_saldo
    FROM usuarios
    ORDER BY xp DESC, jid ASC
    LIMIT ?
  `).all(limite)
}

function obterPosicao(jid) {
  const usuario = db.prepare(`
    SELECT xp
    FROM usuarios
    WHERE jid = ?
  `).get(jid)

  if (!usuario) return null

  const resultado = db.prepare(`
    SELECT COUNT(*) + 1 AS posicao
    FROM usuarios
    WHERE xp > ?
  `).get(usuario.xp)

  return resultado.posicao
}

function obterRankingDoGrupo(participantesJids = []) {
  const participantes = [...new Set(participantesJids)].filter(Boolean)

  if (!participantes.length) {
    return []
  }

  const placeholders =
    participantes.map(() => '?').join(',')

  const usuarios = db.prepare(`
    SELECT
      jid,
      nome,
      xp,
      maior_saldo
    FROM usuarios
    WHERE jid IN (${placeholders})
  `).all(...participantes)

  const porJid =
    new Map(
      usuarios.map(usuario => [
        usuario.jid,
        usuario
      ])
    )

  const ranking =
    participantes.map(jid => {
      const usuario = porJid.get(jid)

      return {
        jid,
        nome: usuario?.nome || 'Usuário',
        xp: usuario?.xp || 0,
        maior_saldo: usuario?.maior_saldo || 0
      }
    })

  ranking.sort((a, b) => {
    if (b.xp !== a.xp) {
      return b.xp - a.xp
    }

    return a.jid.localeCompare(b.jid)
  })

  return ranking.map((usuario, indice) => ({
    ...usuario,
    posicao: indice + 1
  }))
}

function obterPosicaoNoGrupo(jid, participantesJids = []) {
  const ranking =
    obterRankingDoGrupo(participantesJids)

  const usuario =
    ranking.find(item => item.jid === jid)

  if (!usuario) {
    return null
  }

  return {
    posicao: usuario.posicao,
    total: ranking.length
  }
}

module.exports = {
  obterRanking,
  obterPosicao,
  obterRankingDoGrupo,
  obterPosicaoNoGrupo
}
