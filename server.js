const express = require('express');
const path = require('path');
const fs = require('fs');
const { gerarPDF } = require('./gerador');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve arquivos estáticos do painel
app.use(express.static(path.join(__dirname, 'public')));

// Serve os PDFs gerados como arquivos estáticos temporários para download direto no celular
app.use('/gerados', express.static(path.join(__dirname, 'gerados')));

// Serve as cartas de tarot como arquivos estáticos (opção redundante para o renderizador)
app.use('/cartas', express.static(path.join(__dirname, 'resources', 'cartas')));

// API que recebe os dados da compra e gera o PDF dinâmico
app.post('/api/gerar-mapa', async (req, res) => {
  const { nomesPessoais, sobrenomes, modulos } = req.body;

  if (!nomesPessoais || nomesPessoais.length === 0 || !nomesPessoais[0]) {
    return res.status(400).json({ erro: "O primeiro nome é obrigatório para o cálculo." });
  }

  // Gera um nome de arquivo único temporário
  const timestamp = Date.now();
  const primeiroNome = nomesPessoais[0];
  const nomeLimpo = primeiroNome.toLowerCase().replace(/\s+/g, '_');
  const nomeArquivo = `mapa_${nomeLimpo}_${timestamp}.pdf`;
  const caminhoPDF = path.join(__dirname, 'gerados', nomeArquivo);

  try {
    console.log(`[API] Iniciando geração do Mapa para: ${nomesPessoais.join(" ")} | ${sobrenomes.join(" ")}`);
    
    // Roda o motor do gerador Puppeteer passando os arrays de nome e sobrenome
    const baseUrl = `http://localhost:${PORT}`;
    await gerarPDF(nomesPessoais, sobrenomes, modulos, caminhoPDF, baseUrl);

    // Retorna a URL do arquivo estático gerado para que o celular abra sem erros de blob
    res.json({ url: `/gerados/${nomeArquivo}` });

    // Exclui o arquivo gerado do servidor local após 5 minutos para não acumular lixo
    setTimeout(() => {
      if (fs.existsSync(caminhoPDF)) {
        fs.unlink(caminhoPDF, (unlinkErr) => {
          if (unlinkErr) console.error("Erro ao deletar arquivo temporário na limpeza automática:", unlinkErr);
          else console.log(`[API] Limpeza automática: Arquivo temporário removido: ${nomeArquivo}`);
        });
      }
    }, 5 * 60 * 1000); // 5 minutos de tolerância para download/leitura

  } catch (erro) {
    console.error("[API] Erro interno na rota /api/gerar-mapa:", erro.message);
    res.status(500).json({ erro: "Erro interno ao gerar o PDF.", detalhes: erro.message });
  }
});

// Rota de depuração para listar os arquivos do cache do Puppeteer
app.get('/debug', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  function listFiles(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        listFiles(filePath, fileList);
      } else {
        fileList.push(filePath);
      }
    });
    return fileList;
  }
  
  try {
    const rootCache = process.env.PUPPETEER_CACHE_DIR || '/opt/render/.cache/puppeteer';
    const files = listFiles(rootCache);
    res.json({ rootCache, exists: fs.existsSync(rootCache), files });
  } catch (err) {
    res.json({ erro: err.message });
  }
});

// Inicialização do servidor
app.listen(PORT, () => {
  console.log("=================================================================");
  console.log(` Servidor do Gerador de E-books rodando na porta ${PORT}`);
  console.log(` Acesse localmente pelo navegador em: http://localhost:${PORT}`);
  console.log("=================================================================");
});
