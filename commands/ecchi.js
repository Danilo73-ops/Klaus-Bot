const fs = require('fs')
const path = require('path')

const BASE =
  '/storage/emulated/0/MeuBotWhatsApp/config'

const OWNERS_FILE =
  path.join(BASE, 'owners.json')

const CONFIG_FILE =
  path.join(BASE, 'ecchi-groups.json')

function carregarJSON(arquivo, padrao) {
  try {
    if (!fs.existsSync(arquivo)) {
      return padrao
    }

    return JSON.parse(
      fs.readFileSync(arquivo, 'utf8')
    )
  } catch {
    return padrao
  }
}

function salvarJSON(arquivo, dados) {
  fs.writeFileSync(
    arquivo,
    JSON.stringify(dados, null, 2) + '\n'
  )
}

function obterAutor(msg, jid) {
  return (
    msg.key?.participant ||
    msg.participant ||
    msg.key?.remoteJid ||
    jid
  )
}

function ehDono(jidUsuario) {
  const dados =
    carregarJSON(OWNERS_FILE, {
      owners: []
    })

  return dados.owners
    .map(String)
    .includes(String(jidUsuario))
}

function obterTexto(msg) {
  const m = msg.message || {}

  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.templateButtonReplyMessage?.selectedId ||
    m.buttonsResponseMessage?.selectedButtonId ||
    m.listResponseMessage
      ?.singleSelectReply
      ?.selectedRowId ||
    ''
  )
}

function obterConfigGrupo(jidGrupo) {
  const dados =
    carregarJSON(CONFIG_FILE, {})

  return {
    dados,

    grupo: dados[jidGrupo] || {
      ativo: false
    }
  }
}

module.exports = {
  nome: 'ecchi',

  executar: async ({ sock, jid, msg }) => {
    try {
      if (!jid.endsWith('@g.us')) {
        await sock.sendMessage(jid, {
          text:
            '⚠️ O modo *ECCHI* é configurado por grupo.\n\n' +
            'Use este comando dentro de um grupo.'
        })

        return
      }

      const texto = obterTexto(msg)

      const acao = texto
        .replace(/^!ecchi\s*/i, '')
        .trim()
        .toLowerCase() || 'status'

      const autor =
        obterAutor(msg, jid)

      const { dados, grupo } =
        obterConfigGrupo(jid)

      if (acao === 'status') {
        await sock.sendMessage(jid, {
          text:
            `🎨 *MODO ECCHI — KLAUS*\n\n` +
            `Status: ${
              grupo.ativo
                ? '🟢 ATIVADO'
                : '🔴 DESATIVADO'
            }\n\n` +
            `🔐 Alterações: somente dono\n` +
            `📍 Configuração individual deste grupo`
        })

        return
      }

      if (
        acao !== 'on' &&
        acao !== 'off'
      ) {
        await sock.sendMessage(jid, {
          text:
            '❌ Opção inválida.\n\n' +
            'Use:\n' +
            '• `!ecchi on`\n' +
            '• `!ecchi off`\n' +
            '• `!ecchi status`'
        })

        return
      }

      if (!ehDono(autor)) {
        await sock.sendMessage(jid, {
          text:
            '🔒 Apenas o dono do Klaus pode alterar esse modo.'
        })

        console.log(
          `⛔ ECCHI negado para ${autor}`
        )

        return
      }

      const novoEstado =
        acao === 'on'

      dados[jid] = {
        ativo: novoEstado,
        alteradoPor: autor,
        atualizadoEm: Date.now()
      }

      salvarJSON(
        CONFIG_FILE,
        dados
      )

      await sock.sendMessage(jid, {
        text:
          novoEstado
            ? '🔓 *Modo ECCHI ativado neste grupo.*\n\n🎨 Categorias especiais poderão ser liberadas aqui.'
            : '🔒 *Modo ECCHI desativado neste grupo.*\n\n🎨 Categorias especiais foram bloqueadas.'
      })

      console.log(
        `✅ ECCHI ${novoEstado ? 'ON' : 'OFF'}: ${jid}`
      )

    } catch (erro) {
      console.error(
        '❌ Erro !ecchi:',
        erro
      )

      await sock.sendMessage(jid, {
        text:
          '❌ Houve um erro ao alterar a configuração.'
      })
    }
  }
}
