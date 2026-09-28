const config = require('../config/economiaConfig')
const { db } = require('../database/database')
const { executarTransacao } = require('../database/transaction')

const userService = require('./userService')
const transactionService = require('./transactionService')
const cooldownService = require('./cooldownService')
const operationLock = require('./operationLockService')

const stealRewardEngine = require('./stealRewardEngine')
const stealPenaltyEngine = require('./stealPenaltyEngine')

function agora() {
  return Date.now()
}

function validarCooldown(jid, ignorarCooldown = false) {
  if (ignorarCooldown) return

  const cooldown =
    cooldownService.estaEmCooldown(jid, 'steal')

  if (cooldown.ativo) {
    const tempo =
      cooldownService.formatarTempo(
        cooldown.restanteMs
      )

    throw new Error(
      `Aguarde ${tempo} para tentar roubar novamente.`
    )
  }
}

function aplicarCooldown(jid, ignorarCooldown = false) {
  if (ignorarCooldown) return

  const duracao =
    config.steal.cooldownMinutos * 60 * 1000

  cooldownService.definirCooldown(
    jid,
    'steal',
    duracao
  )
}

function registrarTentativa(jid) {
  db.prepare(`
    UPDATE usuarios
    SET
      steals_tentados = steals_tentados + 1,
      atualizado_em = ?
    WHERE jid = ?
  `).run(
    agora(),
    jid
  )
}

function registrarSucesso(jid, valor) {
  db.prepare(`
    UPDATE usuarios
    SET
      steals_sucesso = steals_sucesso + 1,
      xp_roubado = xp_roubado + ?,
      atualizado_em = ?
    WHERE jid = ?
  `).run(
    valor,
    agora(),
    jid
  )
}

function registrarFalha(jid) {
  db.prepare(`
    UPDATE usuarios
    SET
      steals_falha = steals_falha + 1,
      atualizado_em = ?
    WHERE jid = ?
  `).run(
    agora(),
    jid
  )
}

function registrarPerdaPorRoubo(jid, valor) {
  db.prepare(`
    UPDATE usuarios
    SET
      xp_perdido_roubo = xp_perdido_roubo + ?,
      atualizado_em = ?
    WHERE jid = ?
  `).run(
    valor,
    agora(),
    jid
  )
}

async function tentarRoubo({
  atacanteJid,
  atacanteNome = null,

  vitimaJid,
  vitimaNome = null,

  ignorarCooldown = false
}) {
  if (!config.steal.ativo) {
    throw new Error(
      'O sistema de roubo está desativado.'
    )
  }

  if (!atacanteJid || !vitimaJid) {
    throw new Error('Usuário inválido.')
  }

  if (atacanteJid === vitimaJid) {
    throw new Error(
      'Você não pode roubar XP de você mesmo.'
    )
  }

  const envolvidos = [
    atacanteJid,
    vitimaJid
  ].sort()

  return operationLock.executarComTrava(
    envolvidos[0],
    'economia',
    async () => {

      return operationLock.executarComTrava(
        envolvidos[1],
        'economia',
        async () => {

          const atacante =
            userService.obterOuCriarUsuario(
              atacanteJid,
              atacanteNome
            )

          const vitima =
            userService.obterOuCriarUsuario(
              vitimaJid,
              vitimaNome
            )

          validarCooldown(
            atacanteJid,
            ignorarCooldown
          )

          if (vitima.xp <= 0) {
            throw new Error(
              'Esse usuário não possui XP para ser roubado.'
            )
          }

          const resultadoRoubo =
            stealRewardEngine.tentarRoubo(
              vitima.xp
            )

          return executarTransacao(() => {

            aplicarCooldown(
              atacanteJid,
              ignorarCooldown
            )

            registrarTentativa(
              atacanteJid
            )

            /*
              GREEN
            */
            if (resultadoRoubo.sucesso) {
              const valorRoubado =
                resultadoRoubo.valorRoubado

              const saldoAtacanteAntes =
                atacante.xp

              const saldoVitimaAntes =
                vitima.xp

              const vitimaAtualizada =
                userService.removerXP(
                  vitimaJid,
                  valorRoubado,
                  vitimaNome
                )

              const atacanteAtualizado =
                userService.adicionarXP(
                  atacanteJid,
                  valorRoubado,
                  atacanteNome
                )

              registrarSucesso(
                atacanteJid,
                valorRoubado
              )

              registrarPerdaPorRoubo(
                vitimaJid,
                valorRoubado
              )

              transactionService.registrarTransacao({
                tipo: 'steal_sucesso',

                origemJid: vitimaJid,
                destinoJid: atacanteJid,

                valor: valorRoubado,

                saldoOrigemAntes:
                  saldoVitimaAntes,

                saldoOrigemDepois:
                  vitimaAtualizada.xp,

                saldoDestinoAntes:
                  saldoAtacanteAntes,

                saldoDestinoDepois:
                  atacanteAtualizado.xp,

                descricao:
                  `Roubo bem-sucedido de ${valorRoubado} XP`
              })

              return {
                sucesso: true,

                faixa:
                  resultadoRoubo.faixa,

                chanceSucesso:
                  resultadoRoubo.chanceSucesso,

                percentual:
                  resultadoRoubo.percentual,

                tetoRoubo:
                  resultadoRoubo.tetoRoubo,

                numeroSorteado:
                  resultadoRoubo.numeroSorteado,

                valorRoubado,

                saldoAtacanteAntes,
                saldoAtacanteDepois:
                  atacanteAtualizado.xp,

                saldoVitimaAntes,
                saldoVitimaDepois:
                  vitimaAtualizada.xp
              }
            }

            /*
              RED
            */

            const penalidade =
              stealPenaltyEngine.calcularPenalidade(
                atacante.xp
              )

            const saldoAntes =
              atacante.xp

            let saldoDepois =
              atacante.xp

            if (penalidade.valor > 0) {
              const atualizado =
                userService.removerXP(
                  atacanteJid,
                  penalidade.valor,
                  atacanteNome
                )

              saldoDepois =
                atualizado.xp
            }

            registrarFalha(
              atacanteJid
            )

            transactionService.registrarTransacao({
              tipo: 'steal_falha',

              origemJid: atacanteJid,

              valor:
                penalidade.valor,

              saldoOrigemAntes:
                saldoAntes,

              saldoOrigemDepois:
                saldoDepois,

              descricao:
                `Falha ao tentar roubar XP de ${vitimaJid}. Penalidade: ${penalidade.tipo}`
            })

            return {
              sucesso: false,

              faixaVitima:
                resultadoRoubo.faixa,

              chanceSucesso:
                resultadoRoubo.chanceSucesso,

              numeroSorteado:
                resultadoRoubo.numeroSorteado,

              tipoPenalidade:
                penalidade.tipo,

              percentualPenalidade:
                penalidade.percentual,

              penalidade:
                penalidade.valor,

              saldoAntes,
              saldoDepois
            }
          })
        }
      )
    }
  )
}

module.exports = {
  tentarRoubo,
  validarCooldown
}
