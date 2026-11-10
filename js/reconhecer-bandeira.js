/**
 * reconhecer-bandeira.js
 * Papel no sistema: reconhece bandeiras por assinatura visual (cores + faixas + histograma).
 * Modo captura/foto usa limiar mais tolerante (melhor para webcam de notebook).
 */

window.ReconhecerBandeira = (function () {
  var COLUNAS = 8;
  var LINHAS = 5;
  var LIMIAR_LIVE = 0.28;
  var LIMIAR_CAPTURA = 0.42;
  var assinaturas = [];
  var imagensModelo = [];
  var pronto = false;

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function mediaCelulaNormalizada(dados, largura, x0, y0, x1, y1) {
    var somaR = 0;
    var somaG = 0;
    var somaB = 0;
    var contagem = 0;
    var x;
    var y;
    var i;
    var r;
    var g;
    var b;
    var maxc;
    var luminosidadeMedia;
    var fator;

    for (y = y0; y < y1; y += 2) {
      for (x = x0; x < x1; x += 2) {
        i = (y * largura + x) * 4;
        somaR += dados[i];
        somaG += dados[i + 1];
        somaB += dados[i + 2];
        contagem += 1;
      }
    }

    if (!contagem) {
      return [0, 0, 0];
    }

    r = somaR / contagem;
    g = somaG / contagem;
    b = somaB / contagem;
    luminosidadeMedia = (r + g + b) / 3 || 1;
    fator = 128 / luminosidadeMedia;
    r = clamp(r * fator, 0, 255);
    g = clamp(g * fator, 0, 255);
    b = clamp(b * fator, 0, 255);
    maxc = Math.max(r, g, b) || 1;

    return [r / maxc, g / maxc, b / maxc];
  }

  function faixasVerticais(dados, largura, altura) {
    var faixas = [];
    var f;
    var x0;
    var x1;
    var y;
    var x;
    var i;
    var somaR;
    var somaG;
    var somaB;
    var contagem;
    var lum;
    var fator;

    for (f = 0; f < 3; f++) {
      x0 = Math.floor((f * largura) / 3);
      x1 = Math.floor(((f + 1) * largura) / 3);
      somaR = 0;
      somaG = 0;
      somaB = 0;
      contagem = 0;
      for (y = 0; y < altura; y += 2) {
        for (x = x0; x < x1; x += 2) {
          i = (y * largura + x) * 4;
          somaR += dados[i];
          somaG += dados[i + 1];
          somaB += dados[i + 2];
          contagem += 1;
        }
      }
      lum = (somaR + somaG + somaB) / (3 * contagem) || 1;
      fator = 128 / lum;
      faixas.push([
        clamp((somaR / contagem) * fator, 0, 255) / 255,
        clamp((somaG / contagem) * fator, 0, 255) / 255,
        clamp((somaB / contagem) * fator, 0, 255) / 255
      ]);
    }

    return faixas;
  }

  function histogramaSimples(dados) {
    var bins = 8;
    var hist = new Array(bins * 3);
    var i;
    var total = dados.length / 4;
    var r;
    var g;
    var b;

    for (i = 0; i < hist.length; i++) {
      hist[i] = 0;
    }

    for (i = 0; i < dados.length; i += 16) {
      r = Math.min(bins - 1, Math.floor((dados[i] / 256) * bins));
      g = Math.min(bins - 1, Math.floor((dados[i + 1] / 256) * bins));
      b = Math.min(bins - 1, Math.floor((dados[i + 2] / 256) * bins));
      hist[r] += 1;
      hist[bins + g] += 1;
      hist[bins * 2 + b] += 1;
    }

    for (i = 0; i < hist.length; i++) {
      hist[i] = hist[i] / total;
    }

    return hist;
  }

  function distanciaHist(a, b) {
    var soma = 0;
    var i;
    for (i = 0; i < a.length; i++) {
      soma += Math.abs(a[i] - b[i]);
    }
    return soma / a.length;
  }

  function extrairAssinaturaDeImagem(imagem, sx, sy, sw, sh) {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d", { willReadFrequently: true });
    var largura = 160;
    var altura = 100;
    var dados;
    var grade = [];
    var c;
    var l;
    var x0;
    var y0;
    var x1;
    var y1;

    canvas.width = largura;
    canvas.height = altura;

    if (typeof sx === "number") {
      ctx.drawImage(imagem, sx, sy, sw, sh, 0, 0, largura, altura);
    } else {
      ctx.drawImage(imagem, 0, 0, largura, altura);
    }

    dados = ctx.getImageData(0, 0, largura, altura).data;

    for (l = 0; l < LINHAS; l++) {
      for (c = 0; c < COLUNAS; c++) {
        x0 = Math.floor((c * largura) / COLUNAS);
        x1 = Math.floor(((c + 1) * largura) / COLUNAS);
        y0 = Math.floor((l * altura) / LINHAS);
        y1 = Math.floor(((l + 1) * altura) / LINHAS);
        grade.push(mediaCelulaNormalizada(dados, largura, x0, y0, x1, y1));
      }
    }

    return {
      grade: grade,
      faixas: faixasVerticais(dados, largura, altura),
      hist: histogramaSimples(dados)
    };
  }

  function distanciaVetores(a, b) {
    var dr = a[0] - b[0];
    var dg = a[1] - b[1];
    var db = a[2] - b[2];
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  function distanciaAssinaturas(a, b) {
    var somaGrade = 0;
    var somaFaixas = 0;
    var i;

    for (i = 0; i < a.grade.length; i++) {
      somaGrade += distanciaVetores(a.grade[i], b.grade[i]);
    }

    for (i = 0; i < a.faixas.length; i++) {
      somaFaixas += distanciaVetores(a.faixas[i], b.faixas[i]);
    }

    return (
      (somaGrade / a.grade.length) * 0.55 +
      (somaFaixas / a.faixas.length) * 0.3 +
      distanciaHist(a.hist, b.hist) * 0.15
    );
  }

  function carregarImagem(caminho) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () {
        resolve(img);
      };
      img.onerror = reject;
      img.src = caminho;
    });
  }

  function preparar() {
    var promessas = window.DADOS_PAISES.map(function (pais) {
      return carregarImagem(pais.arquivoBandeira).then(function (img) {
        return {
          id: pais.id,
          imagem: img,
          assinatura: extrairAssinaturaDeImagem(img)
        };
      });
    });

    return Promise.all(promessas).then(function (lista) {
      assinaturas = lista.map(function (item) {
        return { id: item.id, assinatura: item.assinatura };
      });
      imagensModelo = lista.map(function (item) {
        return { id: item.id, imagem: item.imagem };
      });
      pronto = true;
      return lista;
    });
  }

  function escolherMelhor(assinaturaFrame, limiar) {
    var melhor = null;
    var melhorDist = Infinity;
    var segundo = Infinity;
    var i;
    var dist;

    for (i = 0; i < assinaturas.length; i++) {
      dist = distanciaAssinaturas(assinaturaFrame, assinaturas[i].assinatura);
      if (dist < melhorDist) {
        segundo = melhorDist;
        melhorDist = dist;
        melhor = assinaturas[i];
      } else if (dist < segundo) {
        segundo = dist;
      }
    }

    if (!melhor || melhorDist > limiar) {
      return null;
    }

    // Exige diferença clara entre 1º e 2º lugar
    if (segundo - melhorDist < 0.045) {
      return null;
    }

    return {
      id: melhor.id,
      confianca: Math.max(0, 1 - melhorDist / limiar),
      distancia: melhorDist,
      metodo: "assinatura-cores"
    };
  }

  function frameTemContrasteSuficiente(fonteVisual) {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d", { willReadFrequently: true });
    var dados;
    var i;
    var soma = 0;
    var somaSq = 0;
    var n;
    var media;
    var variancia;
    var r;
    var g;
    var b;
    var lum;

    canvas.width = 80;
    canvas.height = 50;
    ctx.drawImage(fonteVisual, 0, 0, 80, 50);
    dados = ctx.getImageData(0, 0, 80, 50).data;
    n = dados.length / 4;

    for (i = 0; i < dados.length; i += 4) {
      r = dados[i];
      g = dados[i + 1];
      b = dados[i + 2];
      lum = 0.299 * r + 0.587 * g + 0.114 * b;
      soma += lum;
      somaSq += lum * lum;
    }

    media = soma / n;
    variancia = somaSq / n - media * media;

    // Parede clara / imagem vazia (falso Japão) tem pouca variação
    return variancia > 380;
  }

  function analisarLocal(fonteVisual, limiar) {
    if (!pronto) {
      return null;
    }

    if (!frameTemContrasteSuficiente(fonteVisual)) {
      return null;
    }

    // 1) Classificador por padrão (melhor para Brasil x Japão etc.)
    if (window.ClassificarBandeiraPorPadrao) {
      var porPadrao = window.ClassificarBandeiraPorPadrao.classificar(fonteVisual);
      if (porPadrao) {
        return porPadrao;
      }
    }

    // 2) Fallback: assinatura de cores (mais fraco, só se o padrão não decidir)
    return escolherMelhor(extrairAssinaturaDeImagem(fonteVisual), limiar);
  }

  function analisarComLimiar(fonteVisual, limiar) {
    return analisarLocal(fonteVisual, limiar);
  }

  function analisarFrame(video, canvasAnalise) {
    if (!pronto || !video || video.readyState < 2) {
      return null;
    }

    var ctx = canvasAnalise.getContext("2d", { willReadFrequently: true });
    var larguraAnalise = 240;
    var alturaAnalise = 160;
    var vw = video.videoWidth;
    var vh = video.videoHeight;
    var cortes = [
      { w: 0.58, h: 0.42 },
      { w: 0.7, h: 0.5 },
      { w: 0.45, h: 0.34 }
    ];
    var melhor = null;
    var i;
    var corteW;
    var corteH;
    var sx;
    var sy;
    var resultado;

    canvasAnalise.width = larguraAnalise;
    canvasAnalise.height = alturaAnalise;

    for (i = 0; i < cortes.length; i++) {
      corteW = vw * cortes[i].w;
      corteH = vh * cortes[i].h;
      sx = (vw - corteW) / 2;
      sy = (vh - corteH) / 2;
      ctx.drawImage(video, sx, sy, corteW, corteH, 0, 0, larguraAnalise, alturaAnalise);
      resultado = analisarComLimiar(canvasAnalise, LIMIAR_LIVE);
      if (resultado && (!melhor || resultado.confianca > melhor.confianca)) {
        melhor = resultado;
      }
    }

    return melhor;
  }

  function analisarElementoImagem(imagem) {
    return analisarLocal(imagem, LIMIAR_CAPTURA);
  }

  /**
   * Captura confirmada: tenta Python+OpenCV e cai para o classificador local.
   */
  function analisarCapturaAsync(canvas) {
    var local = analisarLocal(canvas, LIMIAR_CAPTURA);

    if (!window.ConsultarReconhecimentoPython) {
      return Promise.resolve(local);
    }

    return window.ConsultarReconhecimentoPython.reconhecerCanvas(canvas).then(
      function (remoto) {
        if (!remoto) {
          return local;
        }
        // Se Python e local discordam com baixa confiança remota, preferir padrão local
        if (local && remoto.id !== local.id && remoto.confianca < 0.55) {
          return local;
        }
        return remoto;
      }
    );
  }

  return {
    preparar: preparar,
    analisarFrame: analisarFrame,
    analisarElementoImagem: analisarElementoImagem,
    analisarCapturaAsync: analisarCapturaAsync,
    obterModelos: function () {
      return imagensModelo;
    },
    estaPronto: function () {
      return pronto;
    }
  };
})();
