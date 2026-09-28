const JANELA_MS = 20000
const LIMITE_POR_GRUPO = 6

const usosPorGrupo = new Map()

function limparAntigos(lista, agora) {
  return lista.filter(
    timestamp =>
      agora - timestamp < JANELA_MS
  )
}

function checarGrupo(grupoId) {
  const agora = Date.now()

  let usos =
    usosPorGrupo.get(grupoId) || []

  usos = limparAntigos(
    usos,
    agora
  )

  if (usos.length >= LIMITE_POR_GRUPO) {
    const maisAntigo =
      usos[0]

    const restanteMs =
      JANELA_MS - (agora - maisAntigo)

    usosPorGrupo.set(
      grupoId,
      usos
    )

    return {
      liberado: false,
      restanteMs,
      usados: usos.length
    }
  }

  usos.push(agora)

  usosPorGrupo.set(
    grupoId,
    usos
  )

  return {
    liberado: true,
    restanteMs: 0,
    usados: usos.length
  }
}

function formatarRestante(ms) {
  return Math.max(
    1,
    Math.ceil(ms / 1000)
  )
}

module.exports = {
  checarGrupo,
  formatarRestante,
  JANELA_MS,
  LIMITE_POR_GRUPO
}
