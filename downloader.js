const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

const cartasUrls = {
  "0": "https://upload.wikimedia.org/wikipedia/commons/9/90/RWS_Tarot_00_Fool.jpg",
  "1": "https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg",
  "2": "https://upload.wikimedia.org/wikipedia/commons/8/88/RWS_Tarot_02_High_Priestess.jpg",
  "3": "https://upload.wikimedia.org/wikipedia/commons/d/d2/RWS_Tarot_03_Empress.jpg",
  "4": "https://upload.wikimedia.org/wikipedia/commons/c/c3/RWS_Tarot_04_Emperor.jpg",
  "5": "https://upload.wikimedia.org/wikipedia/commons/8/8d/RWS_Tarot_05_Hierophant.jpg",
  "6": "https://upload.wikimedia.org/wikipedia/commons/d/db/RWS_Tarot_06_Lovers.jpg",
  "7": "https://upload.wikimedia.org/wikipedia/commons/9/9b/RWS_Tarot_07_Chariot.jpg",
  "8": "https://upload.wikimedia.org/wikipedia/commons/f/f5/RWS_Tarot_08_Strength.jpg",
  "9": "https://upload.wikimedia.org/wikipedia/commons/4/4d/RWS_Tarot_09_Hermit.jpg",
  "10": "https://upload.wikimedia.org/wikipedia/commons/3/3c/RWS_Tarot_10_Wheel_of_Fortune.jpg",
  "11": "https://upload.wikimedia.org/wikipedia/commons/e/e0/RWS_Tarot_11_Justice.jpg",
  "12": "https://upload.wikimedia.org/wikipedia/commons/2/2b/RWS_Tarot_12_Hanged_Man.jpg",
  "13": "https://upload.wikimedia.org/wikipedia/commons/d/d7/RWS_Tarot_13_Death.jpg",
  "14": "https://upload.wikimedia.org/wikipedia/commons/f/f8/RWS_Tarot_14_Temperance.jpg",
  "15": "https://upload.wikimedia.org/wikipedia/commons/5/55/RWS_Tarot_15_Devil.jpg",
  "16": "https://upload.wikimedia.org/wikipedia/commons/5/53/RWS_Tarot_16_Tower.jpg",
  "17": "https://upload.wikimedia.org/wikipedia/commons/d/db/RWS_Tarot_17_Star.jpg",
  "18": "https://upload.wikimedia.org/wikipedia/commons/7/7f/RWS_Tarot_18_Moon.jpg",
  "19": "https://upload.wikimedia.org/wikipedia/commons/1/17/RWS_Tarot_19_Sun.jpg",
  "20": "https://upload.wikimedia.org/wikipedia/commons/d/dd/RWS_Tarot_20_Judgement.jpg",
  "21": "https://upload.wikimedia.org/wikipedia/commons/f/ff/RWS_Tarot_21_World.jpg"
};

const dirDestino = path.join(__dirname, 'resources', 'cartas');

if (!fs.existsSync(dirDestino)) {
  fs.mkdirSync(dirDestino, { recursive: true });
}

// Pequena função para pausar a execução
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function downloadImage(numero, urlStr) {
  return new Promise((resolve, reject) => {
    const nomeArquivo = `${numero}.jpg`;
    const caminhoArquivo = path.join(dirDestino, nomeArquivo);
    
    // Se a imagem já foi baixada com sucesso anteriormente, pula para não gastar banda e evitar 429
    if (fs.existsSync(caminhoArquivo) && fs.statSync(caminhoArquivo).size > 1000) {
      console.log(`Já existente: Carta ${numero} -> ${nomeArquivo} (Pulando)`);
      return resolve();
    }

    const file = fs.createWriteStream(caminhoArquivo);
    const parsedUrl = new URL(urlStr);
    
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    };

    https.get(options, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Falha ao baixar arcano ${numero}: Código ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Baixada com sucesso: Carta ${numero} -> ${nomeArquivo}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(caminhoArquivo, () => {});
      reject(err);
    });
  });
}

async function baixarTodas() {
  console.log("Iniciando download sequencial e resiliente das cartas de tarot (Rider-Waite)...");
  
  const entries = Object.entries(cartasUrls);
  let sucessos = 0;

  for (let i = 0; i < entries.length; i++) {
    const [numero, url] = entries[i];
    try {
      await downloadImage(numero, url);
      sucessos++;
      // Pequeno delay entre requisições para evitar o erro 429 (Too Many Requests)
      await sleep(500); 
    } catch (erro) {
      console.error(`[Erro] Falha no download do arcano ${numero}:`, erro.message);
      // Aguarda um pouco mais em caso de erro para permitir o servidor se recuperar
      await sleep(2000);
    }
  }

  console.log(`Processamento concluído. ${sucessos} de ${entries.length} cartas prontas localmente.`);
}

baixarTodas();
