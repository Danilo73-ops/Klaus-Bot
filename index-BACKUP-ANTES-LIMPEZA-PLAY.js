const {
  default: makeWASocket,
  useMultiFileAuthState,
  Browsers,
  fetchLatestWaWebVersion
} = require('@whiskeysockets/baileys')

const fs = require('fs')
const path = require('path')
const pino = require('pino')
const qrcode = require('qrcode-terminal')

const config = require('./config')
const activityService = require('./economia/services/activityService')

const AUTH = process.env.HOME + '/bot-runtime/auth-klaus'
const COMMANDS = '/storage/emulated/0/MeuBotWhatsApp/commands'

let reiniciando = false

function carregarComandos() {
  const comandos = new Map()

  const arquivos = fs
    .readdirSync(COMMANDS)
    .filter(arquivo => arquivo.endsWith('.js'))

  for (const arquivo of arquivos) {
    const caminho = path.join(COMMANDS, arquivo)

    delete require.cache[require.resolve(caminho)]

    const comando = require(caminho)

    if (comando.nome && comando.executar) {
      comandos.set(comando.nome.toLowerCase(), comando)
    }
  }

  return comandos
}

async function iniciar() {
  try {
    console.log(`🤖 Iniciando ${config.nomeBot}...`)

    const { state, saveCreds } = await useMultiFileAuthState(AUTH)

    const { version } = await fetchLatestWaWebVersion()

    const sock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: 'silent' }),
      browser: Browsers.macOS('Desktop'),
      printQRInTerminal: false
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async ({
      connection,
      qr,
      lastDisconnect
    }) => {
      if (qr) {
        console.log('\n📱 ESCANEIE O QR CODE:\n')
        qrcode.generate(qr, { small: true })
      }

      if (connection === 'open') {
        reiniciando = false
        console.log(`\n✅ ${config.nomeBot} CONECTADO!`)
        console.log(`⌨️ Prefixo: ${config.prefixo}`)
      }

      if (connection === 'close') {
        const status =
          lastDisconnect?.error?.output?.statusCode

        console.log(`\n⚠️ Conexão fechada: ${status ?? 'sem código'}`)

        if ((status === 515 || status === 408) && !reiniciando) {
          reiniciando = true

          console.log('🔄 Reiniciando sessão...')

          setTimeout(() => {
            reiniciando = false
            iniciar()
          }, 2000)

          return
        }

        console.log('❌ Sessão encerrada.')
      }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
      for (const msg of messages) {

      // DEBUG-BOTAO-KLAUS
      try {
        const bruto = JSON.stringify(msg.message || {})
        if (
          bruto.includes('interactive') ||
          bruto.includes('nativeFlow') ||
          bruto.includes('button') ||
          bruto.includes('Áudio') ||
          bruto.includes('Vídeo')
        ) {
          console.log('\n🔎 ===== DEBUG BOTÃO =====')
          console.dir(msg.message, { depth: 10 })
          console.log('🔎 ===== FIM DEBUG =====\n')
        }
      } catch (_) {}


        if (!msg?.message) continue

      const jid = msg.key.remoteJid

      if (!jid || jid === 'status@broadcast') continue

      let texto =
    msg.message.conversation ||
    msg.message.extendedTextMessage?.text ||
    msg.message.imageMessage?.caption ||
    msg.message.videoMessage?.caption ||
    msg.message.templateButtonReplyMessage?.selectedId ||
    msg.message.buttonsResponseMessage?.selectedButtonId ||
    msg.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
    ''

  const paramsBotao =
    msg.message.interactiveResponseMessage
      ?.nativeFlowResponseMessage
      ?.paramsJson

  if (!texto && paramsBotao) {
    try {
      const dadosBotao = JSON.parse(paramsBotao)

      texto = dadosBotao.id || ''

      if (texto) {
        console.log('🔘 Botão clicado:', texto)
      }
    } catch (erro) {
      console.log('⚠️ Erro lendo botão:', erro.message)
    }
  }

      try {
        const autorJid =
          msg.key.participant ||
          msg.key.remoteJid

        activityService.processarAtividade({
          jid: autorJid,
          nome: msg.pushName || 'Usuário',
          texto,
          prefixo: config.prefixo
        })
      } catch (erro) {
        console.log('⚠️ Erro no sistema de atividade:', erro.message)
      }


    // Atualiza automaticamente o nome do usuário no banco
    try {
      const userService = require('./economia/services/userService')

      const autorJid =
        msg.key.participant ||
        msg.key.remoteJid

      const nomeWhatsApp =
        msg.pushName || null

      if (
        autorJid &&
        nomeWhatsApp &&
        !autorJid.endsWith('@g.us')
      ) {
        userService.obterOuCriarUsuario(
          autorJid,
          nomeWhatsApp
        )
      }
    } catch (erroNome) {
      console.log(
        '⚠️ Não foi possível atualizar nome:',
        erroNome.message
      )
    }


      if (!texto.startsWith(config.prefixo)) continue

      const partes = texto
        .slice(config.prefixo.length)
        .trim()
        .split(/\s+/)

      const nomeComando = partes.shift()?.toLowerCase()

      if (!nomeComando) continue

      const comandos = carregarComandos()

      const comando = comandos.get(nomeComando)

      if (!comando) {
        await sock.sendMessage(jid, {
          text: `❌ Comando não encontrado.\nUse ${config.prefixo}menu`
        })
        continue
      }

      try {
        const sockResposta = new Proxy(sock, {
          get(target, propriedade) {
            if (propriedade === 'sendMessage') {
              return (destino, conteudo, opcoes = {}) => {
                return target.sendMessage(
                  destino,
                  conteudo,
                  {
                    quoted: msg,
                    ...opcoes
                  }
                )
              }
            }

            const valor = target[propriedade]

            return typeof valor === 'function'
              ? valor.bind(target)
              : valor
          }
        })

        await comando.executar({
          sock: sockResposta,
          jid,
          msg,
          args: partes,
          config
        })

        console.log(`✅ Comando executado: ${config.prefixo}${nomeComando}`)
      } catch (erro) {
        console.log(`❌ Erro no comando ${nomeComando}:`)
        console.log(erro.message)

        await sock.sendMessage(jid, {
          text: '❌ Ocorreu um erro ao executar esse comando.'
        })
      }
      }
    })

  } catch (erro) {
    console.log('❌ Erro ao iniciar:')
    console.log(erro.message)
  }
}

iniciar()
