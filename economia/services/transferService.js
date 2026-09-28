const config = require('../config/economiaConfig')
const { db } = require('../database/database')
const { executarTransacao } = require('../database/transaction')

const userService = require('./userService')
const transactionService = require('./transactionService')
const operationLock = require('./operationLockService')

function agora() {
  return Date.now()
}

function validarTransferencia(origem, destino, valor) {
  valor = Math.floor(Number(valor))

  if (!config.transferencia.ativo) {
    throw new Error(
      'As transferências estão desativadas.'
    )
  }

  if (!origem || !destino) {
    throw new Error(
      'Usuário inválido.'
    )
  }

  if (origem === destino) {
    throw new Error(
      'Você não pode doar XP para você mesmo.'
    )
  }

  if (!Number.isFinite(valor) || valor <= 0) {
    throw new Error(
      'Valor de XP inválido.'
    )
  }

  if (valor < config.transferencia.minimo) {
    throw new Error(
      `A doação mínima é ${config.transferencia.minimo} XP.`
    )
  }

  return valor
}

async function doarXP({
  origemJid,
  origemNome = null,

  destinoJid,
  destinoNome = null,

  valor
}) {
  valor = validarTransferencia(
    origemJid,
    destinoJid,
    valor
  )

  const envolvidos = [
    origemJid,
    destinoJid
  ].sort()

  return operationLock.executarComTrava(
    envolvidos[0],
    'economia',
    async () => {

      return operationLock.executarComTrava(
        envolvidos[1],
        'economia',
        async () => {

          const origem =
            userService.obterOuCriarUsuario(
              origemJid,
              origemNome
            )

          const destino =
            userService.obterOuCriarUsuario(
              destinoJid,
              destinoNome
            )

          if (origem.xp < valor) {
            throw new Error(
              `Saldo insuficiente. Você possui ${origem.xp.toLocaleString('pt-BR')} XP.`
            )
          }

          const saldoOrigemAntes =
            origem.xp

          const saldoDestinoAntes =
            destino.xp

          return executarTransacao(() => {

            const origemAtualizada =
              userService.removerXP(
                origemJid,
                valor,
                origemNome
              )

            const destinoAtualizado =
              userService.adicionarXP(
                destinoJid,
                valor,
                destinoNome
              )

            db.prepare(`
              UPDATE usuarios
              SET
                xp_doado = xp_doado + ?,
                atualizado_em = ?
              WHERE jid = ?
            `).run(
              valor,
              agora(),
              origemJid
            )

            db.prepare(`
              UPDATE usuarios
              SET
                xp_recebido = xp_recebido + ?,
                atualizado_em = ?
              WHERE jid = ?
            `).run(
              valor,
              agora(),
              destinoJid
            )

            transactionService.registrarTransacao({
              tipo: 'doacao',

              origemJid,
              destinoJid,

              valor,

              saldoOrigemAntes,
              saldoOrigemDepois:
                origemAtualizada.xp,

              saldoDestinoAntes,
              saldoDestinoDepois:
                destinoAtualizado.xp,

              descricao:
                `Doação de ${valor} XP`
            })

            return {
              valor,

              saldoOrigemAntes,
              saldoOrigemDepois:
                origemAtualizada.xp,

              saldoDestinoAntes,
              saldoDestinoDepois:
                destinoAtualizado.xp
            }
          })
        }
      )
    }
  )
}

module.exports = {
  doarXP,
  validarTransferencia
}
