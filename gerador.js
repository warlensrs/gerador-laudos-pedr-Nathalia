const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const puppeteer = require('puppeteer');
const conteudoArquetipos = require('./conteudo_arquetipos');

// Tabelas de conversão
const pitagorica = {
  'a': 1, 'j': 1, 's': 1, 'b': 2, 'k': 2, 't': 2, 'c': 3, 'l': 3, 'u': 3,
  'd': 4, 'm': 4, 'v': 4, 'e': 5, 'n': 5, 'w': 5, 'f': 6, 'o': 6, 'x': 6,
  'g': 7, 'p': 7, 'y': 7, 'h': 8, 'q': 8, 'z': 8, 'i': 9, 'r': 9
};

const arcanosNomes = {
  1: "O Mago",
  2: "A Sacerdotisa",
  3: "A Imperatriz",
  4: "O Imperador",
  5: "O Papa / O Hierofante",
  6: "Os Enamorados",
  7: "O Carro",
  8: "A Justiça",
  9: "O Eremita"
};

// Remove acentos e caracteres especiais
function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
}

// Capitaliza a primeira letra de uma palavra
function capitalizarPalavra(palavra) {
  if (!palavra) return "";
  return palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase();
}

// Calcula numerologia de uma palavra individual
function calcularNumerologiaPalavra(palavra) {
  const limpa = normalizarTexto(palavra);
  let soma = 0;
  for (let char of limpa) {
    if (pitagorica[char]) {
      soma += pitagorica[char];
    }
  }
  return soma;
}

// Reduz para o intervalo de 1 a 9 conforme a regra da Nathalia
function reduzirParaTarot(soma) {
  if (soma === 0) return 22;
  let atual = soma;
  while (atual > 9) {
    let temp = 0;
    for (let digito of atual.toString()) {
      temp += parseInt(digito);
    }
    atual = temp;
  }
  return atual;
}

// Processa o cálculo modular a partir de arrays estruturados do front-end
function processarCalculo(nomesPessoais, sobrenomes) {
  if (!nomesPessoais || nomesPessoais.length === 0 || !nomesPessoais[0]) {
    throw new Error("O primeiro nome é obrigatório para o cálculo.");
  }

  // Processa Nomes Pessoais (cada um individualmente)
  const analisePessoal = nomesPessoais.map(nome => {
    const soma = calcularNumerologiaPalavra(nome);
    const reduzido = reduzirParaTarot(soma);
    return {
      palavra: nome,
      numero: reduzido,
      arquetipo: arcanosNomes[reduzido],
      dados: conteudoArquetipos[reduzido.toString()]
    };
  });

  // Processa Sobrenomes (cada um individualmente, pois o input já separa)
  const analiseFamiliar = (sobrenomes || []).map(bloco => {
    const soma = calcularNumerologiaPalavra(bloco);
    const reduzido = reduzirParaTarot(soma);
    return {
      palavra: bloco,
      numero: reduzido,
      arquetipo: arcanosNomes[reduzido],
      dados: conteudoArquetipos[reduzido.toString()]
    };
  });

  return {
    nomePessoal: nomesPessoais.join(" "),
    sobrenomes: (sobrenomes || []).join(" "),
    pessoais: analisePessoal,
    familiares: analiseFamiliar
  };
}

// Gera o template HTML estático com a estilização clean/junguiana
function gerarHTML(dadosCalculados, modulosContratados, baseUrl = 'http://localhost:3000') {
  const { nomePessoal, sobrenomes, pessoais, familiares } = dadosCalculados;
  const dataGeracao = new Date().toLocaleDateString('pt-BR');
  const nomeCompleto = `${nomePessoal} ${sobrenomes}`.trim();

  // Função para pegar o caminho de imagem correto por URL HTTP local
  function getCaminhoCarta(numero) {
    return `${baseUrl}/cartas/${numero}.jpg`;
  }

  let htmlConteudo = "";

  // MÓDULO 1: ARQUÉTIPO PESSOAL GERAL (Sempre ativo)
  const temNomeComposto = pessoais.length === 2;
  const saoIguais = temNomeComposto && (pessoais[0].numero === pessoais[1].numero);
  const nome1 = temNomeComposto ? pessoais[0].palavra : "";
  const nome2 = temNomeComposto ? pessoais[1].palavra : "";

  if (saoIguais) {
    const p = pessoais[0];
    htmlConteudo += `
      <div class="pagina page-break">
        <div class="cabeçalho-pagina">
          <span>MAPA DE ARQUÉTIPOS PESSOAIS</span>
          <span>${nomeCompleto}</span>
        </div>
        
        <div class="titulo-secao">
          <span class="subtitulo">Ressonância Vibracional Dupla</span>
          <h1>${capitalizarPalavra(nome1)} & ${capitalizarPalavra(nome2)} = ${p.numero}</h1>
          <h2>${p.arquetipo} (Arcano ${p.numero})</h2>
          <div class="divisor-ouro"></div>
        </div>

        <div class="layout-carta">
          <div class="container-carta">
            <img src="${getCaminhoCarta(p.numero)}" alt="${p.arquetipo}" class="imagem-carta" />
          </div>
          <div class="texto-carta">
            <h3>Sinergia de Identidade</h3>
            <p><strong>Fenômeno de Alinhamento:</strong> Tanto o seu primeiro nome, <strong>${nome1}</strong>, quanto o seu nome composto, <strong>${nome2}</strong>, vibram sob o mesmo cálculo numerológico, canalizando a egrégora do Arcano <strong>${p.arquetipo}</strong>. Quando ambos os nomes carregam a mesma vibração, há uma intensificação dessa energia em sua vida. A sua essência interna (quem você é) e a sua expressão externa (como você se projeta no mundo) caminham em perfeita sintonia, conferindo-lhe uma personalidade muito autêntica e um senso de propósito unificado.</p>
          </div>
        </div>

        <div class="texto-secao">
          <h3>O Simbolismo Oculto da Carta</h3>
          <p>${p.dados.geral.simbolismo}</p>
        </div>

        <div class="rodape-pagina">
          <span>Nathalia Pepe • Desenvolvimento de Perfil</span>
          <span class="page-number"></span>
        </div>
      </div>

      <div class="pagina page-break">
        <div class="cabeçalho-pagina">
          <span>MAPA DE ARQUÉTIPOS PESSOAIS</span>
          <span>${nomeCompleto}</span>
        </div>

        <div class="texto-secao">
          <h3>Identidade & Essência Vibracional</h3>
          <p>${p.dados.geral.identidade}</p>
        </div>

        <div class="texto-secao">
          <h3>A Sombra (Pontos de Autossabotagem)</h3>
          <p>${p.dados.geral.sombra}</p>
        </div>

        <div class="rodape-pagina">
          <span>Nathalia Pepe • Desenvolvimento de Perfil</span>
          <span class="page-number"></span>
        </div>
      </div>

      <div class="pagina page-break">
        <div class="cabeçalho-pagina">
          <span>MAPA DE ARQUÉTIPOS PESSOAIS</span>
          <span>${nomeCompleto}</span>
        </div>

        <div class="texto-secao">
          <h3>Caminho de Evolução e Conselho Prático</h3>
          <p>${p.dados.geral.evolucao}</p>
        </div>

        <div class="rodape-pagina">
          <span>Nathalia Pepe • Desenvolvimento de Perfil</span>
          <span class="page-number"></span>
        </div>
      </div>
    `;
  } else {
    pessoais.forEach((p, index) => {
      const isPrincipal = index === 0;
      htmlConteudo += `
        <div class="pagina page-break">
          <div class="cabeçalho-pagina">
            <span>MAPA DE ARQUÉTIPOS PESSOAIS</span>
            <span>${nomeCompleto}</span>
          </div>
          
          <div class="titulo-secao">
            <span class="subtitulo">${isPrincipal ? "ARQUÉTIPO PESSOAL PRINCIPAL" : "ARQUÉTIPO PESSOAL SECUNDÁRIO"}</span>
            <h1>${capitalizarPalavra(p.palavra)} = ${p.numero}</h1>
            <h2>${p.arquetipo} (Arcano ${p.numero})</h2>
            <div class="divisor-ouro"></div>
          </div>

          <div class="layout-carta">
            <div class="container-carta">
              <img src="${getCaminhoCarta(p.numero)}" alt="${p.arquetipo}" class="imagem-carta" />
            </div>
            <div class="texto-carta">
              <h3>O Simbolismo Oculto da Carta</h3>
              <p>${p.dados.geral.simbolismo}</p>
            </div>
          </div>

          <div class="texto-secao">
            <h3>Identidade & Essência Vibracional</h3>
            <p>${p.dados.geral.identidade}</p>
          </div>

          <div class="rodape-pagina">
            <span>Nathalia Pepe • Desenvolvimento de Perfil</span>
            <span class="page-number"></span>
          </div>
        </div>

        <div class="pagina page-break">
          <div class="cabeçalho-pagina">
            <span>MAPA DE ARQUÉTIPOS PESSOAIS</span>
            <span>${nomeCompleto}</span>
          </div>

          <div class="texto-secao">
            <h3>A Sombra (Pontos de Autossabotagem)</h3>
            <p>${p.dados.geral.sombra}</p>
          </div>

          <div class="texto-secao">
            <h3>Caminho de Evolução e Conselho Prático</h3>
            <p>${p.dados.geral.evolucao}</p>
          </div>

          <div class="rodape-pagina">
            <span>Nathalia Pepe • Desenvolvimento de Perfil</span>
            <span class="page-number"></span>
          </div>
        </div>
      `;
    });
  }

  // MÓDULO 2: AMOR E RELACIONAMENTOS (Opcional)
  if (modulosContratados.amor) {
    const listAmor = saoIguais ? [pessoais[0]] : pessoais;
    listAmor.forEach(p => {
      htmlConteudo += `
        <div class="pagina page-break">
          <div class="cabeçalho-pagina">
            <span>MAPA DE ARQUÉTIPOS PESSOAIS • AMOR E RELACIONAMENTOS</span>
            <span>${nomeCompleto}</span>
          </div>

          <div class="titulo-secao">
            <span class="subtitulo">${saoIguais ? "MÓDULO AMOR E RELACIONAMENTOS (VIBRAÇÃO DUPLA)" : "MÓDULO AMOR E RELACIONAMENTOS"}</span>
            <h1>${saoIguais ? `${capitalizarPalavra(nome1)} & ${capitalizarPalavra(nome2)} = ${p.numero}` : `${capitalizarPalavra(p.palavra)} = ${p.numero}`}</h1>
            <h2>A Energia d'${p.arquetipo} na Vida Amorosa</h2>
            <div class="divisor-ouro"></div>
          </div>

          <div class="texto-secao">
            <h3>Comportamento Afetivo & Padrões</h3>
            <p>${p.dados.amor.comportamento}</p>
          </div>

          <div class="texto-secao">
            <h3>Caminho de Cura nos Relacionamentos</h3>
            <p>${p.dados.amor.cura}</p>
          </div>

          <div class="rodape-pagina">
            <span>Nathalia Pepe • Desenvolvimento de Perfil</span>
            <span class="page-number"></span>
          </div>
        </div>
      `;
    });
  }

  // MÓDULO 3: CARREIRA (Opcional)
  if (modulosContratados.carreira) {
    const listCarreira = saoIguais ? [pessoais[0]] : pessoais;
    listCarreira.forEach(p => {
      htmlConteudo += `
        <div class="pagina page-break">
          <div class="cabeçalho-pagina">
            <span>MAPA DE ARQUÉTIPOS PESSOAIS • CARREIRA</span>
            <span>${nomeCompleto}</span>
          </div>

          <div class="titulo-secao">
            <span class="subtitulo">${saoIguais ? "MÓDULO CARREIRA (VIBRAÇÃO DUPLA)" : "MÓDULO CARREIRA"}</span>
            <h1>${saoIguais ? `${capitalizarPalavra(nome1)} & ${capitalizarPalavra(nome2)} = ${p.numero}` : `${capitalizarPalavra(p.palavra)} = ${p.numero}`}</h1>
            <h2>A Energia d'${p.arquetipo} no Profissional</h2>
            <div class="divisor-ouro"></div>
          </div>

          <div class="texto-secao">
            <h3>Dons & Vocação Profissional</h3>
            <p>${p.dados.carreira.visao}</p>
          </div>

          <div class="texto-secao">
            <h3>Desafios Profissionais & Obstáculos na Carreira</h3>
            <p>${p.dados.carreira.escassez}</p>
          </div>

          <div class="rodape-pagina">
            <span>Nathalia Pepe • Desenvolvimento de Perfil</span>
            <span class="page-number"></span>
          </div>
        </div>
      `;
    });
  }

  // MÓDULO 4: HERANÇA ANCESTRAL (Opcional)
  if (modulosContratados.familia && familiares.length > 0) {
    familiares.forEach(f => {
      htmlConteudo += `
        <div class="pagina page-break">
          <div class="cabeçalho-pagina">
            <span>MAPA DE ARQUÉTIPOS • HERANÇA ANCESTRAL</span>
            <span>${nomeCompleto}</span>
          </div>

          <div class="titulo-secao">
            <span class="subtitulo">MÓDULO HERANÇA ANCESTRAL</span>
            <h1>${capitalizarPalavra(f.palavra)} = ${f.numero}</h1>
            <h2>Egrégora Familiar: ${f.arquetipo} (Arcano ${f.numero})</h2>
            <div class="divisor-ouro"></div>
          </div>

          <div class="layout-carta">
            <div class="container-carta">
              <img src="${getCaminhoCarta(f.numero)}" alt="${f.arquetipo}" class="imagem-carta" />
            </div>
            <div class="texto-carta">
              <h3>Simbolismo da Linhagem Ancestral</h3>
              <p>${f.dados.geral.simbolismo}</p>
            </div>
          </div>

          <div class="texto-secao">
            <h3>A Energia da Linhagem & Padrão Herdado</h3>
            <p>${f.dados.heranca.ancestralidade}</p>
          </div>

          <div class="rodape-pagina">
            <span>Nathalia Pepe • Desenvolvimento de Perfil</span>
            <span class="page-number"></span>
          </div>
        </div>
      `;
    });
  }

  return `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <title>Mapa de Arquétipos - ${nomeCompleto}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
    <style>
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      body {
        font-family: 'Inter', sans-serif;
        color: #2C1E3B; /* Roxo profundo da marca Nathalia Pepe */
        background-color: #FAFAFA;
        -webkit-print-color-adjust: exact;
      }
      
      /* Definições de página para impressão PDF */
      @page {
        size: A4;
        margin: 0;
      }
      
      .page-break {
        page-break-after: always;
      }

      /* Container de Página A4 */
      .pagina {
        width: 210mm;
        min-height: 295mm; /* Reduzido para 295mm para evitar quebra de página fantasma por transbordo */
        padding: 25mm 20mm 35mm; /* Padding inferior aumentado para 35mm para proteger o rodapé absoluto */
        position: relative;
        background-color: #FAF6F0; /* Tom Areia Suave */
        display: block; /* MUDADO de flex para block! Impede colapso de página e PDF em branco */
        box-sizing: border-box;
      }

      /* Estilo da Capa - Cor de Fundo do Canva */
      .capa {
        justify-content: center;
        align-items: center;
        text-align: center;
        padding: 40mm 20mm;
        border: 2px solid #2C1E3B; /* Moldura Roxo Profundo */
        background-color: #D5C4A1; /* Areia Mate do Canva */
        margin: 10mm;
        height: 265mm; /* Reduzido de 275mm para evitar quebra de pagina fantasma */
        width: 190mm; /* Largura estatica A4 descontando margens de 10mm */
        position: relative;
        display: flex; /* Flex interno em bloco sem quebra é permitido */
        flex-direction: column;
        box-sizing: border-box;
      }
      .capa-marca {
        font-family: 'Lora', serif;
        font-size: 14px;
        letter-spacing: 4px;
        color: #2C1E3B;
        text-transform: uppercase;
        margin-bottom: 25mm;
        font-weight: 500;
      }
      .capa-titulo {
        font-family: 'Lora', serif;
        font-size: 38px;
        font-weight: 400;
        color: #2C1E3B;
        line-height: 1.2;
        margin-bottom: 15mm;
      }
      .capa-divisor {
        width: 60px;
        height: 1px;
        background-color: #2C1E3B;
        margin: 10mm auto;
      }
      .capa-cliente {
        font-family: 'Inter', sans-serif;
        font-size: 20px;
        font-weight: 500;
        letter-spacing: 1px;
        color: #2C1E3B;
        margin-bottom: 30mm;
      }
      .capa-data {
        font-size: 12px;
        color: rgba(44, 30, 59, 0.7);
        position: absolute;
        bottom: 20mm;
        width: 100%;
        left: 0;
      }

      /* Cabeçalho e Rodapé */
      .cabeçalho-pagina {
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        color: rgba(44, 30, 59, 0.5);
        letter-spacing: 1px;
        border-bottom: 1px solid rgba(44, 30, 59, 0.1);
        padding-bottom: 3mm;
        margin-bottom: 8mm;
        text-transform: uppercase;
      }
      .rodape-pagina {
        position: absolute; /* Fixado de forma absoluta no fundo de cada página para compatibilidade com block */
        bottom: 20mm;
        left: 20mm;
        right: 20mm;
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        color: rgba(44, 30, 59, 0.5);
        border-top: 1px solid rgba(44, 30, 59, 0.1);
        padding-top: 3mm;
      }

      /* Títulos e Seções */
      .titulo-secao {
        margin-bottom: 8mm;
      }
      .titulo-secao .subtitulo {
        font-size: 11px;
        font-weight: 600;
        color: #C5A880; /* Dourado mate de realce */
        letter-spacing: 2px;
        text-transform: uppercase;
        display: block;
        margin-bottom: 2mm;
      }
      .titulo-secao h1 {
        font-family: 'Lora', serif;
        font-size: 28px;
        font-weight: 500;
        color: #2C1E3B;
      }
      .titulo-secao h2 {
        font-family: 'Lora', serif;
        font-size: 18px;
        font-weight: 400;
        color: rgba(44, 30, 59, 0.8);
        margin-top: 1mm;
      }
      .divisor-ouro {
        width: 100%;
        height: 1px;
        background-color: rgba(44, 30, 59, 0.1);
        position: relative;
        margin-top: 3mm;
      }
      .divisor-ouro::after {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        width: 15%;
        height: 1px;
        background-color: #2C1E3B;
      }

      /* Layout de Carta de Tarot */
      .layout-carta {
        display: flex;
        gap: 8mm;
        margin-bottom: 8mm;
      }
      .container-carta {
        flex: 0 0 50mm;
        height: 85mm;
        border: 1px solid #E5D9C8;
        padding: 2mm;
        background-color: #FAF6F0;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
      }
      .imagem-carta {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border: 1px solid rgba(44, 30, 59, 0.1);
      }
      .texto-carta {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .texto-carta h3 {
        font-family: 'Lora', serif;
        font-size: 15px;
        font-weight: 500;
        color: #2C1E3B;
        margin-bottom: 2mm;
      }
      .texto-carta p {
        font-size: 13.5px;
        line-height: 1.6;
        color: rgba(44, 30, 59, 0.9);
        text-align: justify;
      }

      /* Textos Gerais */
      .texto-secao {
        margin-bottom: 6mm;
      }
      .texto-secao h3 {
        font-family: 'Lora', serif;
        font-size: 16px;
        font-weight: 500;
        color: #2C1E3B;
        margin-bottom: 2.5mm;
        border-left: 2px solid #2C1E3B;
        padding-left: 3mm;
      }
      .texto-secao p {
        font-size: 13.5px;
        line-height: 1.7;
        color: rgba(44, 30, 59, 0.9);
        text-align: justify;
      }

      /* Introdução / Páginas de Texto Único */
      .texto-introducao {
        margin: auto 0;
      }
      .texto-introducao h2 {
        font-family: 'Lora', serif;
        font-size: 24px;
        font-weight: 400;
        color: #2C1E3B;
        margin-bottom: 6mm;
      }
      .texto-introducao p {
        font-size: 14px;
        line-height: 1.8;
        color: rgba(44, 30, 59, 0.9);
        margin-bottom: 4mm;
        text-align: justify;
      }

      /* Numeração de páginas automática via CSS */
    </style>
  </head>
  <body>
    <!-- CAPA -->
    <div class="pagina page-break" style="background-color: #FAF6F0; padding: 0;">
      <div class="capa">
        <div class="capa-marca">Nathalia Pepe</div>
        <h1 class="capa-titulo">LAUDO DE ANÁLISE<br>ARQUETÍPICA DO NOME</h1>
        <div class="capa-divisor"></div>
        <div class="capa-cliente">${nomeCompleto}</div>
        <div class="capa-data">Data de Geração: ${dataGeracao}</div>
      </div>
    </div>

    <!-- INTRODUÇÃO -->
    <div class="pagina page-break">
      <div class="cabeçalho-pagina">
        <span>MAPA DE ARQUÉTIPOS PESSOAIS</span>
        <span>${nomeCompleto}</span>
      </div>
      
      <div class="texto-introducao">
        <h2>Seu Nome Não é Uma Coincidência</h2>
        <p>Na visão da psicologia arquetípica junguiana e da numerologia tradicional, os nomes e palavras que carregamos na vida não são meras escolhas arbitrárias de nossos pais. Cada letra carrega uma frequência e vibração específica que atua como um molde invisível do nosso comportamento e destino.</p>
        <p>Este mapa foi desenhado de forma estritamente personalizada para revelar quais são os símbolos do Tarot tradicional (Arcanos Maiores) que operam no seu campo vibracional pessoal (o seu nome) e no seu campo ancestral (os seus sobrenomes).</p>
        <p>Abaixo, você encontrará a análise das suas principais forças, suas sombras inconscientes e orientações práticas de como usar esse conhecimento para assumir o protagonismo da sua história.</p>
        <p><em>Use este material como um manual prático de auto-observação. Ao compreender o padrão, você se liberta de repetir a dor.</em></p>
      </div>

      <div class="rodape-pagina">
        <span>Nathalia Pepe • Tarot & Autoconhecimento</span>
        <span class="page-number"></span>
      </div>
    </div>

    <!-- CONTEÚDO DINÂMICO -->
    ${htmlConteudo}

    <!-- SOBRE A AUTORA -->
    <div class="pagina page-break">
      <div class="cabeçalho-pagina">
        <span>MAPA DE ARQUÉTIPOS PESSOAIS • SOBRE A AUTORA</span>
        <span>${nomeCompleto}</span>
      </div>
      
      <div class="texto-introducao" style="margin-top: 10mm;">
        <h2 style="font-family: 'Lora', serif; font-size: 24px; color: #2C1E3B; margin-bottom: 4mm;">Sobre a Autora</h2>
        <h3 style="font-family: 'Lora', serif; font-size: 18px; color: #C5A880; font-weight: 500; margin-bottom: 6mm;">Nathalia Pepe</h3>
        
        <p style="font-size: 13.5px; line-height: 1.8; color: rgba(44, 30, 59, 0.9); margin-bottom: 4mm; text-align: justify;">
          <strong>Nathalia Pepe</strong> é médium desde os 16 anos de idade, e estuda e trabalha com o Tarot desde os 21. Taróloga e pesquisadora dos padrões de comportamento humano, Nathalia atua guiando pessoas a decifrarem o código invisível de suas personalidades e a destravarem seus caminhos de vida através da união entre a Psicologia Arquetípica de Carl Jung, a Numerologia Pitagórica e a sabedoria secular do Tarot tradicional de Rider-Waite.
        </p>
        
        <p style="font-size: 13.5px; line-height: 1.8; color: rgba(44, 30, 59, 0.9); margin-bottom: 4mm; text-align: justify;">
          Com ampla experiência em atendimentos individuais e mentorias, ela disponibilizou esse conhecimento secular para traduzir a complexidade simbólica das cartas em conselhos práticos e evolutivos para o cotidiano. Seu propósito é servir como ponte para que você se reconecte com sua verdadeira essência, liberte-se de ciclos repetitivos e assuma o protagonismo da sua própria história.
        </p>
        
        <p style="font-size: 13.5px; line-height: 1.8; color: #2C1E3B; font-style: italic; margin-top: 8mm; margin-bottom: 8mm; text-align: center; font-weight: 500;">
          "Ao compreender o padrão, você se liberta de repetir a dor. O seu nome não é um acaso, é a sua assinatura no mundo."
        </p>

        <div style="border-top: 1px solid rgba(44, 30, 59, 0.1); padding-top: 6mm; margin-top: 6mm;">
          <h4 style="font-family: 'Lora', serif; font-size: 14px; color: #2C1E3B; margin-bottom: 2mm;">Acompanhe o trabalho de Nathalia:</h4>
          <p style="font-size: 13px; color: rgba(44, 30, 59, 0.8); line-height: 1.6;">
            • <strong>Instagram:</strong> @nathaliapepe.tarot<br>
            • <strong>Consultas & Mentorias:</strong> Entre em contato para agendar uma leitura individual aprofundada do seu mapa de arquétipos.
          </p>
        </div>
      </div>

      <div class="rodape-pagina">
        <span>Nathalia Pepe • Tarot & Autoconhecimento</span>
        <span class="page-number"></span>
      </div>
    </div>

    <!-- CONTRACAPA -->
    <div class="pagina" style="background-color: #FAF6F0; justify-content: center; align-items: center; text-align: center;">
      <div style="border: 1px solid #E5D9C8; padding: 15mm; max-width: 150mm; background-color: #FAF5EE; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);">
        <h2 style="font-family: 'Lora', serif; font-size: 24px; color: #2C1E3B; margin-bottom: 4mm;">Sua Jornada Continua</h2>
        <p style="font-size: 13.5px; line-height: 1.7; color: rgba(44, 30, 59, 0.9); margin-bottom: 6mm;">
          Este mapa revela as principais energias que moldam o seu nome e ancestralidade. No entanto, a complexidade da sua alma é única. Para aprofundar esses resultados, descobrir a vibração do seu dia de nascimento e receber orientações direcionadas para o seu momento de vida atual, agende uma sessão individual.
        </p>
        <div class="capa-divisor"></div>
        <p style="font-family: 'Lora', serif; font-size: 16px; font-weight: 500; color: #C5A880; margin-bottom: 2mm;">
          Nathalia Pepe
        </p>
        <p style="font-size: 12px; color: rgba(44, 30, 59, 0.6); letter-spacing: 1px; text-transform: uppercase;">
          Tarot & Autoconhecimento
        </p>
      </div>
    </div>
  </body>
  </html>
  `;
}

// Função principal de geração do PDF utilizando Puppeteer
async function gerarPDF(nomesPessoais, sobrenomes, modulosContratados, caminhoSaida, baseUrl = 'http://localhost:3000') {
  let browser;
  try {
    const dados = processarCalculo(nomesPessoais, sobrenomes);
    const html = gerarHTML(dados, modulosContratados, baseUrl);
    
    // Grava o HTML temporário para depuração
    fs.writeFileSync(path.join(__dirname, 'debug_laudo.html'), html);
    console.log('[DEBUG] HTML de depuração gravado em:', path.join(__dirname, 'debug_laudo.html'));

    // Inicializa o Puppeteer buscando resiliência em containers (Render/Linux) e local no Windows
    let opcoesLaunch = {
      headless: "new",
      args: [
        '--allow-file-access-from-files',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    };

    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      opcoesLaunch.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      console.log(`[Gerador PDF] Usando navegador definido em PUPPETEER_EXECUTABLE_PATH: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);
    } else {
      // Caminhos de instalação padrão do Chrome e Edge no Windows
      const caminhosNavegadores = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Users\\warlen\\.cache\\puppeteer\\chrome\\win64-127.0.6533.88\\chrome-win64\\chrome.exe'
      ];

      for (const caminho of caminhosNavegadores) {
        if (fs.existsSync(caminho)) {
          opcoesLaunch.executablePath = caminho;
          console.log(`[Gerador PDF] Usando navegador local encontrado em: ${caminho}`);
          break;
        }
      }
    }

    browser = await puppeteer.launch(opcoesLaunch);

    const page = await browser.newPage();
    
    // Configura o conteúdo da página com o HTML gerado
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Garante que o diretório de saída existe
    const dirSaida = path.dirname(caminhoSaida);
    if (!fs.existsSync(dirSaida)) {
      fs.mkdirSync(dirSaida, { recursive: true });
    }

    // Imprime a página para PDF (Tamanho A4, margem zero porque o CSS controla a página)
    await page.pdf({
      path: caminhoSaida,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0px',
        bottom: '0px',
        left: '0px',
        right: '0px'
      }
    });

    console.log(`PDF gerado com sucesso em: ${caminhoSaida}`);
    return caminhoSaida;
  } catch (erro) {
    console.error("Erro na geração do PDF:", erro);
    throw erro;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = {
  processarCalculo,
  gerarPDF
};
