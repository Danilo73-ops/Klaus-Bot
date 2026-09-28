const { buscarEcchi, getCategoriasEcchi } = require('./services/ecchiService')

;(async () => {
  try {
    console.log('🔥 Testando Klaus Ecchi...\n')

    const cats = getCategoriasEcchi()
    console.log('NORMAL:', cats.normal.join(', '))
    console.log('VIP:', cats.vip.join(', '))
    console.log('')

    const resultado = await buscarEcchi({ vip: false })

    console.log('✅ GREEN')
    console.log('Provider:', resultado.provider)
    console.log('Categoria:', resultado.categoria)
    console.log('VIP:', resultado.vip ? 'SIM' : 'NÃO')
    console.log('URL:', resultado.url)
    console.log('Tags:', (resultado.tags || []).join(', ') || 'sem tags')
  } catch (e) {
    console.log('❌ ERRO:', e.message)
  }
})()
