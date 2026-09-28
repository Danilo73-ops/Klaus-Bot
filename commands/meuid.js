module.exports = {
  nome: 'meuid',

  executar: async ({ sock, jid, msg }) => {
    try {
      const remetente =
        msg.key?.participant ||
        msg.participant ||
        msg.key?.remoteJid ||
        jid

      await sock.sendMessage(jid, {
        text:
          '🪪 *Seu ID no Klaus*\n\n' +
          `\`${remetente}\`\n\n` +
          'Esse ID será usado para configurar o dono do bot.'
      })

      console.log(`🪪 MEUID: ${remetente}`)
    } catch (erro) {
      console.error('❌ Erro !meuid:', erro)

      await sock.sendMessage(jid, {
        text: '❌ Não consegui identificar seu ID.'
      })
    }
  }
}
