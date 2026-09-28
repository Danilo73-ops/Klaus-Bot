const config = require('../config/stealConfig')

function sortearEntre(min, max) {
  return Math.random() * (max - min) + min
}

function escolherFaixa() {
  const total = config.penalidadesFalha.reduce(
    (soma, item) => soma + item.peso,
    0
  )

  let sorteio = Math.random() * total

  for (const faixa of config.penalidadesFalha) {
    if (sorteio < faixa.peso) {
      return faixa
    }

    sorteio -= faixa.peso
  }

  return config.penalidadesFalha[
    config.penalidadesFalha.length - 1
  ]
}

function calcularPenalidade(saldoAtual) {
  saldoAtual = Math.max(
    0,
    Math.floor(Number(saldoAtual) || 0)
  )

  const faixa = escolherFaixa()

  const percentual =
    faixa.percentualMin === faixa.percentualMax
      ? faixa.percentualMin
      : sortearEntre(
          faixa.percentualMin,
          faixa.percentualMax
        )

  let valor = Math.floor(
    saldoAtual * (percentual / 100)
  )

  if (percentual > 0 && saldoAtual > 0) {
    valor = Math.max(1, valor)
  }

  valor = Math.min(valor, saldoAtual)

  return {
    tipo: faixa.tipo,
    percentual: Number(percentual.toFixed(2)),
    valor,
    saldoAntes: saldoAtual,
    saldoDepois: saldoAtual - valor
  }
}

module.exports = {
  calcularPenalidade
}
