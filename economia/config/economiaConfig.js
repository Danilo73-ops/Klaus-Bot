module.exports = {
  sistema: {
    ativo: false,
    nomeMoeda: 'XP',
    saldoInicial: 10000
  },

  roleta: {
    chanceBase: 48,

    apostaMinima: 5000,
    apostaMaximaUsuario: 50000000,

    multiplicadorVitoria: 2,

    pityPessoalPorDerrota: 3,
    pityPessoalMaximo: 12,

    pityGlobalPorDerrota: 1,
    pityGlobalMaximo: 5,

    chanceMinima: 20,
    chanceMaxima: 65,

    cooldownMinutos: 10
  },

  steal: {
    ativo: true,
    chanceBase: 35,
    chanceMinima: 20,
    chanceMaxima: 55,

    percentualMinimoRoubo: 5,
    percentualMaximoRoubo: 15,

    penalidadeFalhaPercentual: 8,
    cooldownMinutos: 30
  },

  daily: {
    ativo: true,
    xpMinimo: 500,
    xpMaximo: 1500,
    cooldownHoras: 24
  },

  transferencia: {
    ativo: true,
    minimo: 1,
    taxaPercentual: 0
  },

  ranking: {
    quantidadePadrao: 10
  },

  seguranca: {
    bloquearSaldoNegativo: true,
    registrarTransacoes: true,
    registrarAlteracoesAdmin: true
  }
}
