const config = require('../config/economiaConfig')

function limitar(valor, minimo, maximo) {
  return Math.max(minimo, Math.min(maximo, valor))
}

function calcularChanceRoleta({
  derrotasPessoais = 0,
  derrotasGlobais = 0
}) {
  const r = config.roleta

  const bonusPessoal = Math.min(
    derrotasPessoais * r.pityPessoalPorDerrota,
    r.pityPessoalMaximo
  )

  const bonusGlobal = Math.min(
    derrotasGlobais * r.pityGlobalPorDerrota,
    r.pityGlobalMaximo
  )

  const chanceFinal = limitar(
    r.chanceBase + bonusPessoal + bonusGlobal,
    r.chanceMinima,
    r.chanceMaxima
  )

  return {
    chanceBase: r.chanceBase,
    bonusPessoal,
    bonusGlobal,
    chanceFinal
  }
}

function calcularChanceSteal({
  bonusExtra = 0,
  penalidadeExtra = 0
}) {
  const s = config.steal

  const chanceFinal = limitar(
    s.chanceBase + bonusExtra - penalidadeExtra,
    s.chanceMinima,
    s.chanceMaxima
  )

  return {
    chanceBase: s.chanceBase,
    bonusExtra,
    penalidadeExtra,
    chanceFinal
  }
}

function sortear(chancePercentual) {
  const numero = Math.random() * 100

  return {
    numero,
    sucesso: numero < chancePercentual
  }
}

function executarRoleta({
  derrotasPessoais = 0,
  derrotasGlobais = 0
}) {
  const chances = calcularChanceRoleta({
    derrotasPessoais,
    derrotasGlobais
  })

  const resultado = sortear(chances.chanceFinal)

  return {
    ...chances,
    numeroSorteado: resultado.numero,
    venceu: resultado.sucesso
  }
}

function executarSteal({
  bonusExtra = 0,
  penalidadeExtra = 0
}) {
  const chances = calcularChanceSteal({
    bonusExtra,
    penalidadeExtra
  })

  const resultado = sortear(chances.chanceFinal)

  return {
    ...chances,
    numeroSorteado: resultado.numero,
    sucesso: resultado.sucesso
  }
}

module.exports = {
  limitar,
  calcularChanceRoleta,
  calcularChanceSteal,
  sortear,
  executarRoleta,
  executarSteal
}
