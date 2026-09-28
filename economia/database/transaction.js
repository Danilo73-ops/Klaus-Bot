const { db } = require('./database')

function executarTransacao(funcao) {
  db.exec('BEGIN')

  try {
    const resultado = funcao()

    db.exec('COMMIT')

    return resultado
  } catch (erro) {
    db.exec('ROLLBACK')
    throw erro
  }
}

module.exports = {
  executarTransacao
}
