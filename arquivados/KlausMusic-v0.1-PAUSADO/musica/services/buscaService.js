const jamendo = require('./jamendoService')

async function buscar(termo) {
  const resultados = []

  try {
    const faixas =
      await jamendo.buscar(termo, 5)

    for (const faixa of faixas) {
      resultados.push({
        ...faixa,
        provedor: 'jamendo'
      })
    }
  } catch (erro) {
    console.log(
      '⚠️ Jamendo busca:',
      erro.message
    )
  }

  return resultados.slice(0, 5)
}

module.exports = {
  buscar
}
