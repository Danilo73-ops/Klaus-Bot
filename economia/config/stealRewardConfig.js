module.exports = {
  faixas: [
    {
      nome: 'baixo',
      saldoMaximo: 10000,
      chanceSucesso: 45,
      percentualMin: 6,
      percentualMax: 12,
      tetoRoubo: 1500
    },

    {
      nome: 'medio',
      saldoMaximo: 100000,
      chanceSucesso: 40,
      percentualMin: 4,
      percentualMax: 9,
      tetoRoubo: 10000
    },

    {
      nome: 'confortavel',
      saldoMaximo: 500000,
      chanceSucesso: 35,
      percentualMin: 3,
      percentualMax: 6,
      tetoRoubo: 30000
    },

    {
      nome: 'rico',
      saldoMaximo: 1000000,
      chanceSucesso: 32,
      percentualMin: 2,
      percentualMax: 5,
      tetoRoubo: 50000
    },

    {
      nome: 'milionario',
      saldoMaximo: 5000000,
      chanceSucesso: 28,
      percentualMin: 0.5,
      percentualMax: 2,
      tetoRoubo: 100000
    },

    {
      nome: 'elite',
      saldoMaximo: 10000000,
      chanceSucesso: 25,
      percentualMin: 0.5,
      percentualMax: 1.5,
      tetoRoubo: 150000
    },

    {
      nome: 'magnata',
      saldoMaximo: 50000000,
      chanceSucesso: 22,
      percentualMin: 0.1,
      percentualMax: 0.5,
      tetoRoubo: 250000
    },

    {
      nome: 'imperio',
      saldoMaximo: Infinity,
      chanceSucesso: 20,
      percentualMin: 0.05,
      percentualMax: 0.25,
      tetoRoubo: 500000
    }
  ]
}
