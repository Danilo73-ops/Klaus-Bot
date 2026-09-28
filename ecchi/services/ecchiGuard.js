const fs = require('fs')

const CONFIG_FILE =
  '/storage/emulated/0/MeuBotWhatsApp/config/ecchi-groups.json'

function carregarConfigs() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return {}
    }

    return JSON.parse(
      fs.readFileSync(CONFIG_FILE, 'utf8')
    )
  } catch {
    return {}
  }
}

function estaAtivo(jidGrupo) {
  if (!jidGrupo?.endsWith('@g.us')) {
    return false
  }

  const configs =
    carregarConfigs()

  return Boolean(
    configs[jidGrupo]?.ativo
  )
}

function verificar(jidGrupo) {
  if (!jidGrupo?.endsWith('@g.us')) {
    return {
      liberado: false,
      motivo:
        'Esse comando só funciona em grupos.'
    }
  }

  if (!estaAtivo(jidGrupo)) {
    return {
      liberado: false,
      motivo:
        '🔒 O modo *ECCHI* está desativado neste grupo.\n\nO dono pode liberar usando *!ecchi on*.'
    }
  }

  return {
    liberado: true,
    motivo: null
  }
}

module.exports = {
  estaAtivo,
  verificar
}
