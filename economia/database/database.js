const { DatabaseSync } = require('node:sqlite')
const path = require('path')

const dbPath = path.join(
  '/storage/emulated/0/MeuBotWhatsApp/economia/database',
  'klaus.db'
)

const db = new DatabaseSync(dbPath)

db.exec('PRAGMA foreign_keys = ON;')

function iniciarBanco() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jid TEXT NOT NULL UNIQUE,
      nome TEXT,
      xp INTEGER NOT NULL DEFAULT 1000,

      xp_total_ganho INTEGER NOT NULL DEFAULT 0,
      xp_total_perdido INTEGER NOT NULL DEFAULT 0,
      maior_saldo INTEGER NOT NULL DEFAULT 1000,

      vitorias_roleta INTEGER NOT NULL DEFAULT 0,
      derrotas_roleta INTEGER NOT NULL DEFAULT 0,
      streak_derrotas_roleta INTEGER NOT NULL DEFAULT 0,
      maior_streak_derrotas INTEGER NOT NULL DEFAULT 0,

      steals_tentados INTEGER NOT NULL DEFAULT 0,
      steals_sucesso INTEGER NOT NULL DEFAULT 0,
      steals_falha INTEGER NOT NULL DEFAULT 0,
      xp_roubado INTEGER NOT NULL DEFAULT 0,
      xp_perdido_roubo INTEGER NOT NULL DEFAULT 0,

      xp_doado INTEGER NOT NULL DEFAULT 0,
      xp_recebido INTEGER NOT NULL DEFAULT 0,

      ultima_daily INTEGER,
      ultimo_steal INTEGER,

      criado_em INTEGER NOT NULL,
      atualizado_em INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL,

      origem_jid TEXT,
      destino_jid TEXT,

      valor INTEGER NOT NULL DEFAULT 0,

      saldo_origem_antes INTEGER,
      saldo_origem_depois INTEGER,

      saldo_destino_antes INTEGER,
      saldo_destino_depois INTEGER,

      descricao TEXT,
      criado_em INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS estado_global (
      chave TEXT PRIMARY KEY,
      valor TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cooldowns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jid TEXT NOT NULL,
      tipo TEXT NOT NULL,
      expira_em INTEGER NOT NULL,

      UNIQUE(jid, tipo)
    );

    CREATE INDEX IF NOT EXISTS idx_usuarios_xp
      ON usuarios(xp DESC);

    CREATE INDEX IF NOT EXISTS idx_transacoes_origem
      ON transacoes(origem_jid);

    CREATE INDEX IF NOT EXISTS idx_transacoes_destino
      ON transacoes(destino_jid);

    CREATE INDEX IF NOT EXISTS idx_transacoes_criado
      ON transacoes(criado_em DESC);
  `)

  const inserirEstado = db.prepare(`
    INSERT OR IGNORE INTO estado_global (chave, valor)
    VALUES (?, ?)
  `)

  inserirEstado.run('derrotas_globais_roleta', '0')
  inserirEstado.run('vitorias_globais_roleta', '0')

  console.log('✅ Banco de dados da economia iniciado.')
}

module.exports = {
  db,
  iniciarBanco
}
