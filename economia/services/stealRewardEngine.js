const config = require('../config/stealRewardConfig')

function sortearEntre(min, max) {
  return Math.random() * (max - min) + min
}

function obterFaixa(saldoVitima) {
  saldoVitima = Math.max(
    0,
    Math.floor(Number(saldoVitima) || 0)
  )

  return config.faixas.find(
    faixa => saldoVitima <= faixa.saldoMaximo
  )
}

function calcularRoubo(saldoVitima) {
  saldoVitima = Math.max(
    0,
    Math.floor(Number(saldoVitima) || 0)
  )

  const faixa = obterFaixa(saldoVitima)

  const percentual = sortearEntre(
    faixa.percentualMin,
    faixa.percentualMax
  )

  let valorRoubado = Math.floor(
    saldoVitima * (percentual / 100)
  )

  valorRoubado = Math.min(
    valorRoubado,
    faixa.tetoRoubo,
    saldoVitima
  )

  if (saldoVitima > 0 && valorRoubado < 1) {
    valorRoubado = 1
  }

  return {
    faixa: faixa.nome,
    chanceSucesso: faixa.chanceSucesso,
    percentual: Number(percentual.toFixed(2)),
    tetoRoubo: faixa.tetoRoubo,
    valorRoubado
  }
}

function tentarRoubo(saldoVitima) {
  const dados = calcularRoubo(saldoVitima)

  const numeroSorteado =
    Math.random() * 100

  const sucesso =
    numeroSorteado < dados.chanceSucesso

  return {
    ...dados,
    numeroSorteado,
    sucesso
  }
}

module.exports = {
  obterFaixa,
  calcularRoubo,
  tentarRoubo
}
