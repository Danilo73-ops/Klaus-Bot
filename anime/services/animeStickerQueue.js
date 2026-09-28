const MAX_CONCORRENTE = 2
const MAX_PENDENTE_POR_USUARIO = 5

const fila = []
let ativos = 0

function contarPendentesDoUsuario(usuarioId) {
  return fila.filter(
    item => item.usuarioId === usuarioId
  ).length
}

function processarFila() {
  while (
    ativos < MAX_CONCORRENTE &&
    fila.length > 0
  ) {
    const item = fila.shift()

    ativos++

    Promise.resolve()
      .then(() => item.tarefa())
      .then(item.resolve)
      .catch(item.reject)
      .finally(() => {
        ativos--
        processarFila()
      })
  }
}

function adicionarNaFila(usuarioId, tarefa) {
  return new Promise((resolve, reject) => {
    const pendentes =
      contarPendentesDoUsuario(usuarioId)

    if (
      pendentes >=
      MAX_PENDENTE_POR_USUARIO
    ) {
      reject(
        new Error(
          'Você já tem muitas figurinhas anime na fila.'
        )
      )

      return
    }

    fila.push({
      usuarioId,
      tarefa,
      resolve,
      reject
    })

    processarFila()
  })
}

function obterStatusFila() {
  return {
    ativos,
    pendentes: fila.length,
    maxConcorrente: MAX_CONCORRENTE,
    maxPendentePorUsuario:
      MAX_PENDENTE_POR_USUARIO
  }
}

module.exports = {
  adicionarNaFila,
  obterStatusFila
}
