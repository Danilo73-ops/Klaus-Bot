const ecchiGuard =
  require('../ecchi/services/ecchiGuard')

const ecchiService =
  require('../ecchi/services/ecchiService')

const {
  CATEGORIAS,
  GRUPOS
} = require('../ecchi/config')

const nativeFlow =
  require('../utils/nativeFlow')

function pegarTexto(msg) {
  const m = msg.message || {}

  let nativeFlowId = ''

  try {
    const paramsJson =
      m.interactiveResponseMessage
        ?.nativeFlowResponseMessage
        ?.paramsJson

    if (paramsJson) {
      const params = JSON.parse(paramsJson)
      nativeFlowId =
        params.id ||
        params.selectedId ||
        params.selectedRowId ||
        ''
    }
  } catch {}

  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.templateButtonReplyMessage?.selectedId ||
    m.buttonsResponseMessage?.selectedButtonId ||
    m.listResponseMessage?.singleSelectReply?.selectedRowId ||
    nativeFlowId ||
    ''
  )
}

function montarLinhasPorGrupo(grupo) {
  return Object.entries(CATEGORIAS)
    .filter(([, info]) => info.grupo === grupo)
    .map(([id, info]) => ({
      title: info.nome || id,
      description: `Categoria: ${id}`,
      id: `!ecchipic ${id}`
    }))
}

async function enviarLista(sock, jid, msg) {
  const secoes = Object.entries(GRUPOS)
    .sort((a, b) => a[1].ordem - b[1].ordem)
    .map(([grupoId, grupoInfo]) => ({
      title: grupoInfo.nome,
      rows: montarLinhasPorGrupo(grupoId)
    }))
    .filter(secao => secao.rows.length > 0)

  secoes.push({
    title: '🎲 EXTRA',
    rows: [
      {
        title: 'Aleatório',
        description: 'Escolher categoria aleatória',
        id: '!ecchipic'
      }
    ]
  })

  await nativeFlow.enviar(
    sock,
    jid,
    msg,
    {
      titulo: '🔥 Klaus Extra',
      texto: 'Escolha uma categoria:',
      rodape: 'Klaus ✦ Anime',
      botoes: [
        {
          name: 'single_select',
          buttonParamsJson: JSON.stringify({
            title: '🎴 Ver categorias',
            sections: secoes
          })
        }
      ]
    }
  )
}

module.exports = {
  nome: 'ecchipic',

  executar: async ({
    sock,
    jid,
    msg
  }) => {
    try {
      const permissao =
        ecchiGuard.verificar(jid)

      if (!permissao.liberado) {
        await sock.sendMessage(jid, {
          text: permissao.motivo
        })
        return
      }

      const texto = pegarTexto(msg)

      let categoria = texto
        .replace(/^!ecchipic\s*/i, '')
        .trim()
        .toLowerCase()

      if (!categoria) {
        categoria = 'random'
      }

      if (categoria === 'list') {
        await enviarLista(sock, jid, msg)
        return
      }

      if (
        categoria !== 'random' &&
        !ecchiService.categoriaExiste(categoria)
      ) {
        await sock.sendMessage(jid, {
          text:
            '❌ Categoria inválida.\n\n' +
            'Use *!ecchipic list*.'
        })
        return
      }

      const resultado =
        await ecchiService.buscar(categoria)

      let legenda =
        `🔥 *${resultado.nome || 'Klaus Extra'}*\n` +
        `🎴 ${resultado.categoriaReal || resultado.categoria}\n` +
        `🌐 ${resultado.provider}`

      if (resultado.artista) {
        legenda += `\n🎨 ${resultado.artista}`
      }

      await sock.sendMessage(jid, {
        image: {
          url: resultado.url
        },
        caption: legenda
      })

      await nativeFlow.enviar(
        sock,
        jid,
        msg,
        {
          titulo: '🔥 Klaus Extra',
          texto: 'Escolha uma ação:',
          rodape: 'Klaus ✦ Anime',
          botoes: [
            {
              name: 'quick_reply',
              buttonParamsJson: JSON.stringify({
                display_text: '📚 Categorias',
                id: '!ecchipic list'
              })
            },
            {
              name: 'quick_reply',
              buttonParamsJson: JSON.stringify({
                display_text: '🔄 Próxima',
                id:
                  categoria === 'random'
                    ? '!ecchipic'
                    : `!ecchipic ${categoria}`
              })
            }
          ]
        }
      )

      console.log(
        `✅ ECCHIPIC: ${categoria} | ${resultado.provider}`
      )

    } catch (erro) {
      console.error(
        '❌ Erro !ecchipic:',
        erro.message
      )

      await sock.sendMessage(jid, {
        text:
          `❌ Não consegui buscar a imagem: ${erro.message}`
      })
    }
  }
}
