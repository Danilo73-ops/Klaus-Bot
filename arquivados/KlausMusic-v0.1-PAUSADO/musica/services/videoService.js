const fs = require('fs')
const { execFile } = require('child_process')
const { promisify } = require('util')

const execFileAsync = promisify(execFile)

const {
  arquivoTemporario,
  apagarArquivo
} = require('./mediaService')

async function gerarVideoTeste() {
  const saida = arquivoTemporario('mp4')

  await execFileAsync(
    'ffmpeg',
    [
      '-y',
      '-f', 'lavfi',
      '-i', 'testsrc=size=640x360:rate=30:duration=3',
      '-f', 'lavfi',
      '-i', 'sine=frequency=440:duration=3',
      '-shortest',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-movflags', '+faststart',
      saida
    ],
    {
      timeout: 20000
    }
  )

  if (!fs.existsSync(saida)) {
    throw new Error('O MP4 não foi criado.')
  }

  return saida
}

async function enviarVideo(sock, jid, arquivo, opcoes = {}) {
  if (!fs.existsSync(arquivo)) {
    throw new Error('Arquivo de vídeo não encontrado.')
  }

  await sock.sendMessage(jid, {
    video: {
      url: arquivo
    },

    mimetype: 'video/mp4',

    fileName:
      opcoes.nomeArquivo ||
      'KlausMusic.mp4',

    caption:
      opcoes.caption || ''
  })
}

module.exports = {
  gerarVideoTeste,
  enviarVideo,
  apagarArquivo
}
