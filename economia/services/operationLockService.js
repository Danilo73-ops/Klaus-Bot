const operacoes = new Map()

function chave(jid, tipo) {
  return `${jid}:${tipo}`
}

function estaBloqueado(jid, tipo) {
  return operacoes.has(chave(jid, tipo))
}

function bloquear(jid, tipo) {
  const k = chave(jid, tipo)

  if (operacoes.has(k)) {
    return false
  }

  operacoes.set(k, Date.now())
  return true
}

function liberar(jid, tipo) {
  operacoes.delete(chave(jid, tipo))
}

async function executarComTrava(jid, tipo, funcao) {
  if (!bloquear(jid, tipo)) {
    throw new Error(
      'Essa operação já está sendo processada. Aguarde um instante.'
    )
  }

  try {
    return await funcao()
  } finally {
    liberar(jid, tipo)
  }
}

module.exports = {
  estaBloqueado,
  bloquear,
  liberar,
  executarComTrava
}
