const path = require('path')

module.exports = {
  TEMP_DIR: path.join(
    '/storage/emulated/0/MeuBotWhatsApp',
    'musica',
    'temp'
  ),

  MAX_DURACAO_SEGUNDOS: 600,
  MAX_TAMANHO_MB: 50,
  TIMEOUT_MS: 120000
}
