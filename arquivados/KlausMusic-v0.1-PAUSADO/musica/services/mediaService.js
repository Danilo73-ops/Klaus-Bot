const fs = require('fs')
const path = require('path')
const { TEMP_DIR } = require('../config')

function arquivoTemporario(extensao = 'bin') {
  const nome =
    `klaus-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${extensao}`

  return path.join(TEMP_DIR, nome)
}

function apagarArquivo(arquivo) {
  try {
    if (arquivo && fs.existsSync(arquivo)) {
      fs.unlinkSync(arquivo)
    }
  } catch (erro) {
    console.log(
      '⚠️ Não consegui apagar temporário:',
      erro.message
    )
  }
}

module.exports = {
  arquivoTemporario,
  apagarArquivo
}
