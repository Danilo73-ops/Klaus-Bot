const config = require('../config/economiaConfig')
const { db } = require('../database/database')
const { executarTransacao } = require('../database/transaction')

const userService = require('./userService')
const transactionService = require('./transactionService')
const luckEngine = require('./luckEngine')
const globalState = require('./globalStateService')
const cooldownService = require('./cooldownService')
const operationLock = require('./operationLockService')

function agora() {
  return Date.now()
}

function atualizarMaiorStreak(jid, streakAtual) {
  db.prepare(`
    UPDATE usuarios
    SET
      maior_streak_derrotas = CASE
        WHEN ? > maior_streak_derrotas THEN ?
        ELSE maior_streak_derrotas
      END,
      atualizado_em = ?
    WHERE jid = ?
  `).run(
    streakAtual,
    streakAtual,
    agora(),
    jid
  )
}

function registrarVitoria(jid) {
  db.prepare(`
    UPDATE usuarios
    SET
      vitorias_roleta = vitorias_roleta + 1,
      streak_derrotas_roleta = 0,
      atualizado_em = ?
    WHERE jid = ?
  `).run(
    agora(),
    jid
  )
}

function registrarDerrota(jid) {
  const usuario = userService.buscarUsuario(jid)

  const novoStreak =
    (usuario?.streak_derrotas_roleta || 0) + 1

  db.prepare(`
    UPDATE usuarios
    SET
      derrotas_roleta = derrotas_roleta + 1,
      streak_derrotas_roleta = ?,
      atualizado_em = ?
    WHERE jid = ?
  `).run(
    novoStreak,
    agora(),
    jid
  )

  atualizarMaiorStreak(jid, novoStreak)

  return novoStreak
}

function validarAposta(usuario, valor, isDono = false) {
  valor = Math.floor(Number(valor))

  if (!Number.isFinite(valor) || valor <= 0) {
    throw new Error('Valor de aposta inválido.')
  }

  if (valor < config.roleta.apostaMinima) {
    throw new Error(
      `A aposta mínima é ${config.roleta.apostaMinima} XP.`
    )
  }

  if (
    !isDono &&
    valor > config.roleta.apostaMaximaUsuario
  ) {
    throw new Error(
      `A aposta máxima para usuários é ${config.roleta.apostaMaximaUsuario} XP.`
    )
  }

  if (usuario.xp < valor) {
    throw new Error(
      `Saldo insuficiente. Você possui ${usuario.xp} XP.`
    )
  }

  return valor
}

function validarCooldown(jid, ignorarCooldown = false) {
  if (ignorarCooldown) {
    return
  }

  const cooldown =
    cooldownService.estaEmCooldown(jid, 'roleta')

  if (cooldown.ativo) {
    const tempo =
      cooldownService.formatarTempo(cooldown.restanteMs)

    throw new Error(
      `Aguarde ${tempo} para usar a roleta novamente.`
    )
  }
}

function aplicarCooldown(jid, ignorarCooldown = false) {
  if (ignorarCooldown) {
    return
  }

  const duracao =
    config.roleta.cooldownMinutos * 60 * 1000

  cooldownService.definirCooldown(
    jid,
    'roleta',
    duracao
  )
}

async function jogarRoleta({
  jid,
  nome = null,
  valor,
  isDono = false,
  ignorarCooldown = false
}) {
  return operationLock.executarComTrava(
    jid,
    'roleta',
    async () => {
      const usuario =
        userService.obterOuCriarUsuario(jid, nome)

      validarCooldown(jid, ignorarCooldown)

      valor = validarAposta(
        usuario,
        valor,
        isDono
      )

      const derrotasGlobais =
        globalState.obterNumero(
          'derrotas_globais_roleta',
          0
        )

      const resultadoSorte =
        luckEngine.executarRoleta({
          derrotasPessoais:
            usuario.streak_derrotas_roleta || 0,

          derrotasGlobais
        })

      const saldoAntes = usuario.xp

      return executarTransacao(() => {
        aplicarCooldown(jid, ignorarCooldown)

        if (resultadoSorte.venceu) {
          const lucro = valor

          const atualizado =
            userService.adicionarXP(
              jid,
              lucro,
              nome
            )

          registrarVitoria(jid)

          globalState.incrementar(
            'vitorias_globais_roleta',
            1
          )

          globalState.resetar(
            'derrotas_globais_roleta'
          )

          transactionService.registrarTransacao({
            tipo: 'roleta_vitoria',
            destinoJid: jid,
            valor: lucro,
            saldoDestinoAntes: saldoAntes,
            saldoDestinoDepois: atualizado.xp,
            descricao:
              `Vitória na roleta com aposta de ${valor} XP`
          })

          return {
            venceu: true,
            aposta: valor,
            lucro,
            saldoAntes,
            saldoDepois: atualizado.xp,

            chanceBase:
              resultadoSorte.chanceBase,

            bonusPessoal:
              resultadoSorte.bonusPessoal,

            bonusGlobal:
              resultadoSorte.bonusGlobal,

            chanceFinal:
              resultadoSorte.chanceFinal,

            numeroSorteado:
              resultadoSorte.numeroSorteado,

            streakDerrotas: 0
          }
        }

        const atualizado =
          userService.removerXP(
            jid,
            valor,
            nome
          )

        const novoStreak =
          registrarDerrota(jid)

        globalState.incrementar(
          'derrotas_globais_roleta',
          1
        )

        transactionService.registrarTransacao({
          tipo: 'roleta_derrota',
          origemJid: jid,
          valor,
          saldoOrigemAntes: saldoAntes,
          saldoOrigemDepois: atualizado.xp,
          descricao:
            `Derrota na roleta com aposta de ${valor} XP`
        })

        return {
          venceu: false,
          aposta: valor,
          perda: valor,
          saldoAntes,
          saldoDepois: atualizado.xp,

          chanceBase:
            resultadoSorte.chanceBase,

          bonusPessoal:
            resultadoSorte.bonusPessoal,

          bonusGlobal:
            resultadoSorte.bonusGlobal,

          chanceFinal:
            resultadoSorte.chanceFinal,

          numeroSorteado:
            resultadoSorte.numeroSorteado,

          streakDerrotas: novoStreak
        }
      })
    }
  )
}

module.exports = {
  jogarRoleta,
  validarAposta,
  validarCooldown
}
