const jamendo =
  require('./services/jamendoService')

async function main() {
  console.log('🎵 Testando Klaus Music...\n')

  const resultados =
    await jamendo.buscar('rock')

  if (!resultados.length) {
    console.log('❌ Nenhum resultado.')
    return
  }

  for (const [i, faixa] of resultados.entries()) {
    console.log(
      `${i + 1}. ${faixa.titulo}`
    )

    console.log(
      `   👤 ${faixa.artista}`
    )

    console.log(
      `   💾 Download: ${
        faixa.downloadPermitido
          ? 'SIM'
          : 'NÃO'
      }`
    )

    console.log('')
  }
}

main().catch(erro => {
  console.error(
    '❌ Erro:',
    erro.message
  )
})
