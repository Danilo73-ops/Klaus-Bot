const jamendo =
  require('../musica/services/jamendoService')

const audioService =
  require('../musica/services/audioService')

function pegarTexto(msg) {
  const m = msg.message || {}

  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.templateButtonReplyMessage?.selectedId ||
    m.buttonsResponseMessage?.selectedButtonId ||
    ''
  )
}

function nomeSeguro(texto) {
  return String(texto || 'KlausMusic')
    .replace(/[\\/:*?"<>|]/g, '')
    .trim()
    .slice(0, 80)
}

module.exports = {
  nome: 'playaudio',

  executar: async ({ sock, jid, msg }) => {
    let arquivo = null

    try {
      const texto = pegarTexto(msg)

      const chave = texto
        .replace(/^!playaudio\s*/i, '')
        .trim()

      const [provedor, id] =
        chave.split(':')

      if (
        provedor !== 'jamendo' ||
        !/^\d+$/.test(id || '')
      ) {
        throw new Error(
          'Música selecionada inválida.'
        )
      }

      const faixa =
        await jamendo.buscarPorId(id)

      if (!faixa) {
        throw new Error(
          'Faixa não encontrada.'
        )
      }

      if (!faixa.downloadPermitido) {
        throw new Error(
          'Download não está disponível para essa faixa.'
        )
      }

      await sock.sendMessage(jid, {
        text:
          `🎧 *${faixa.titulo}*\n` +
          `👤 ${faixa.artista}\n\n` +
          `⬇️ Preparando áudio...`
      })

      arquivo =
        await jamendo.baixar(faixa)

      await audioService.enviarAudio(
        sock,
        jid,
        arquivo,
        {
          nomeArquivo:
            `${nomeSeguro(faixa.titulo)}.mp3`
        }
      )

      console.log(
        `✅ PLAY ÁUDIO: ${faixa.titulo} — ${faixa.artista}`
      )

    } catch (erro) {
      console.error(
        '❌ Erro playaudio:',
        erro
      )

      await sock.sendMessage(jid, {
        text:
          `❌ Não consegui enviar o áudio: ${erro.message}`
      })

    } finally {
      if (arquivo) {
        jamendo.apagarArquivo(arquivo)
      }

      console.log(
        '🧹 PLAY: temporário limpo'
      )
    }
  }
}
