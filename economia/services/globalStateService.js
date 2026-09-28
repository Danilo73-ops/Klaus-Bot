const { db } = require('../database/database')

function obterValor(chave, padrao = '0') {
  const registro = db.prepare(`
    SELECT valor
    FROM estado_global
    WHERE chave = ?
  `).get(chave)

  return registro ? registro.valor : padrao
}

function definirValor(chave, valor) {
  db.prepare(`
    INSERT INTO estado_global (chave, valor)
    VALUES (?, ?)
    ON CONFLICT(chave)
    DO UPDATE SET valor = excluded.valor
  `).run(chave, String(valor))
}

function obterNumero(chave, padrao = 0) {
  return Number(obterValor(chave, String(padrao))) || 0
}

function incrementar(chave, quantidade = 1) {
  const atual = obterNumero(chave, 0)
  const novo = atual + quantidade

  definirValor(chave, novo)

  return novo
}

function resetar(chave) {
  definirValor(chave, 0)
  return 0
}

function obterEstadoRoleta() {
  return {
    derrotasGlobais: obterNumero('derrotas_globais_roleta'),
    vitoriasGlobais: obterNumero('vitorias_globais_roleta')
  }
}

module.exports = {
  obterValor,
  definirValor,
  obterNumero,
  incrementar,
  resetar,
  obterEstadoRoleta
}
