const JANELA_MS = 10000
const MAX_ACOES = 3

const usos = new Map()

function checarCooldown(usuarioId) {
  const agora = Date.now()

  let lista =
    usos.get(usuarioId) || []

  lista = lista.filter(
    timestamp =>
      agora - timestamp < JANELA_MS
  )

  if (lista.length >= MAX_ACOES) {
    const maisAntigo = lista[0]

    const restanteMs =
      JANELA_MS -
      (agora - maisAntigo)

    usos.set(usuarioId, lista)

    return {
      liberado: false,
      restanteMs,
      usados: lista.length
    }
  }

  lista.push(agora)

  usos.set(usuarioId, lista)

  return {
    liberado: true,
    restanteMs: 0,
    usados: lista.length
  }
}

function formatarRestante(ms) {
  return Math.max(
    1,
    Math.ceil(ms / 1000)
  )
}

module.exports = {
  checarCooldown,
  formatarRestante,
  JANELA_MS,
  MAX_ACOES
}
