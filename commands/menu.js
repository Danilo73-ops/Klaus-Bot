const fs = require('fs')

module.exports = {
  nome: 'menu',

  executar: async ({ sock, jid, msg, config }) => {
    const agora = new Date()

    const hora = agora.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })

    const data = agora.toLocaleDateString('pt-BR')

    const horaAtual = agora.getHours()

    let saudacao = 'Boa noite'

    if (horaAtual >= 5 && horaAtual < 12) {
      saudacao = 'Bom dia'
    } else if (horaAtual >= 12 && horaAtual < 18) {
      saudacao = 'Boa tarde'
    }

    const nomeUsuario =
      msg.pushName ||
      msg.key?.participant ||
      'Senhor'

    const texto = `
╔════════════════════╗
       𖤐 KLAUS 𖤐
╚════════════════════╝

${saudacao}, Senhor ${nomeUsuario}.

Elegante, imprevisível e sempre pronto
para dominar a conversa.

Klaus está aqui para transformar seu
WhatsApp em algo muito além do comum.

╭─「 INFORMAÇÕES 」
│
│ ◈ Prefixo: ${config.prefixo}
│ ◈ Data: ${data}
│ ◈ Hora: ${hora}
│
╰───────────────

╭─「 GERAL 」
│
│ ◈ ${config.prefixo}menu
│ ◈ ${config.prefixo}ping
│
╰───────────────

╭─「 DIVERSÃO 」
│
│ ◈ Em breve...
│
╰───────────────

╭─「 GRUPO 」
│
│ ◈ Em breve...
│
╰───────────────

╭─「 DOWNLOAD 」
│
│ ◈ Em breve...
│
╰───────────────

╭─「 IA 」
│
│ ◈ Em breve...
│
╰───────────────

“Divirta-se e use com sabedoria.”

— Grey
`.trim()

    const imagem = fs.readFileSync(
      '/storage/emulated/0/MeuBotWhatsApp/media/menu.jpg'
    )

    await sock.sendMessage(jid, {
      image: imagem,
      caption: texto
    })
  }
}
