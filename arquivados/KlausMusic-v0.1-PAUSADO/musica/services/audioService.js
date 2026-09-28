const fs = require('fs')
const { execFile } = require('child_process')
const { promisify } = require('util')

const execFileAsync = promisify(execFile)

const {
  arquivoTemporario,
  apagarArquivo
} = require('./mediaService')

async function gerarAudioTeste() {
  const saida = arquivoTemporario('mp3')

  await execFileAsync(
    'ffmpeg',
    [
      '-y',
      '-f', 'lavfi',
      '-i', 'sine=frequency=440:duration=3',
      '-c:a', 'libmp3lame',
      '-b:a', '128k',
      saida
    ],
    {
      timeout: 15000
    }
  )

  if (!fs.existsSync(saida)) {
    throw new Error('O MP3 não foi criado.')
  }

  return saida
}

async function enviarAudio(sock, jid, arquivo, opcoes = {}) {
  if (!fs.existsSync(arquivo)) {
    throw new Error('Arquivo de áudio não encontrado.')
  }

  await sock.sendMessage(jid, {
    audio: {
      url: arquivo
    },

    mimetype: 'audio/mpeg',

    fileName:
      opcoes.nomeArquivo ||
      'KlausMusic.mp3'
  })
}

module.exports = {
  gerarAudioTeste,
  enviarAudio,
  apagarArquivo
}
