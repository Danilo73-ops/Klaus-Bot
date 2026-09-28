const ecchiService = require('../services/ecchiService')

function normalizarCategoria(args = []) {
  const valor = String(args?.[0] || 'random')
    .trim()
    .toLowerCase()

  return valor || 'random'
}

function montarLegenda(resultado) {
  const linhas = [
    '🔥 Klaus Ecchi',
    '',
    `🎴 Categoria: ${resultado.nome || resultado.categoria || 'Aleatório'}`,
    `🏷️ Tag usada: ${resultado.tagUsada || '-'}`,
    `🌐 Provider: ${resultado.provider || '-'}`,
  ]

  if (resultado.artista) {
    linhas.push(`🎨 Artista: ${resultado.artista}`)
  }

  return linhas.join('\n')
}

module.exports = {
  nome: 'ecchipic',

  executar: async ({ sock, jid, msg, args }) => {
    const categoria = normalizarCategoria(args)

    try {
      await sock.sendMessage(jid, {
        react: {
          text: '🔥',
          key: msg.key
        }
      })

      const resultado =
        await ecchiService.buscar(categoria)

      await sock.sendMessage(jid, {
        image: {
          url: resultado.url
        },
        caption: montarLegenda(resultado)
      })

    } catch (erro) {
      console.log('❌ Erro no ecchipic:', erro.message)

      await sock.sendMessage(jid, {
        text:
          '❌ Não consegui buscar a imagem ecchi agora.\n' +
          `Motivo: ${erro.message}`
      })
    }
  }
}
