/**
 * classificar-bandeira-por-padrao.js
 * Papel no sistema: reconhece as 12 bandeiras de cores vivas por padrões de cor/faixas.
 */

window.ClassificarBandeiraPorPadrao = (function () {
  function sampleCanvas(fonte) {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = 180;
    canvas.height = 120;
    ctx.drawImage(fonte, 0, 0, 180, 120);
    return ctx.getImageData(0, 0, 180, 120);
  }

  function rgbToHsv(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var d = max - min;
    var h = 0;
    var s = max === 0 ? 0 : d / max;
    var v = max;
    if (d !== 0) {
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        default:
          h = ((r - g) / d + 4) / 6;
      }
    }
    return { h: h * 360, s: s, v: v };
  }

  function analisar(imgData) {
    var data = imgData.data;
    var w = imgData.width;
    var h = imgData.height;
    var total = w * h;
    var cont = {
      branco: 0,
      preto: 0,
      vermelho: 0,
      verde: 0,
      azul: 0,
      amarelo: 0,
      laranja: 0
    };
    var faixaV = [
      { vermelho: 0, verde: 0, azul: 0, amarelo: 0, preto: 0, total: 0 },
      { vermelho: 0, verde: 0, azul: 0, amarelo: 0, preto: 0, total: 0 },
      { vermelho: 0, verde: 0, azul: 0, amarelo: 0, preto: 0, total: 0 }
    ];
    var faixaH = [
      { vermelho: 0, verde: 0, azul: 0, amarelo: 0, preto: 0, total: 0 },
      { vermelho: 0, verde: 0, azul: 0, amarelo: 0, preto: 0, total: 0 },
      { vermelho: 0, verde: 0, azul: 0, amarelo: 0, preto: 0, total: 0 }
    ];
    var i;
    var x;
    var y;
    var r;
    var g;
    var b;
    var hsv;
    var iv;
    var ih;

    for (i = 0; i < data.length; i += 4) {
      r = data[i];
      g = data[i + 1];
      b = data[i + 2];
      hsv = rgbToHsv(r, g, b);
      x = (i / 4) % w;
      y = Math.floor(i / 4 / w);
      iv = Math.min(2, Math.floor((x / w) * 3));
      ih = Math.min(2, Math.floor((y / h) * 3));
      faixaV[iv].total += 1;
      faixaH[ih].total += 1;

      if (hsv.s < 0.18 && hsv.v > 0.72) {
        cont.branco += 1;
        continue;
      }
      if (hsv.v < 0.2) {
        cont.preto += 1;
        faixaV[iv].preto += 1;
        faixaH[ih].preto += 1;
        continue;
      }
      if (hsv.s > 0.35 && hsv.v > 0.25 && (hsv.h < 18 || hsv.h > 345)) {
        cont.vermelho += 1;
        faixaV[iv].vermelho += 1;
        faixaH[ih].vermelho += 1;
        continue;
      }
      if (hsv.h >= 18 && hsv.h < 40 && hsv.s > 0.4) {
        cont.laranja += 1;
        continue;
      }
      if (hsv.h >= 40 && hsv.h < 70 && hsv.s > 0.35) {
        cont.amarelo += 1;
        faixaV[iv].amarelo += 1;
        faixaH[ih].amarelo += 1;
        continue;
      }
      if (hsv.h >= 70 && hsv.h < 170 && hsv.s > 0.25) {
        cont.verde += 1;
        faixaV[iv].verde += 1;
        faixaH[ih].verde += 1;
        continue;
      }
      if (hsv.h >= 190 && hsv.h < 260 && hsv.s > 0.25) {
        cont.azul += 1;
        faixaV[iv].azul += 1;
        faixaH[ih].azul += 1;
      }
    }

    function pct(n) {
      return n / total;
    }
    function parte(f, k) {
      return f.total ? f[k] / f.total : 0;
    }

    return {
      pct: {
        branco: pct(cont.branco),
        preto: pct(cont.preto),
        vermelho: pct(cont.vermelho),
        verde: pct(cont.verde),
        azul: pct(cont.azul),
        amarelo: pct(cont.amarelo),
        laranja: pct(cont.laranja)
      },
      v: faixaV.map(function (f) {
        return {
          vermelho: parte(f, "vermelho"),
          verde: parte(f, "verde"),
          azul: parte(f, "azul"),
          amarelo: parte(f, "amarelo"),
          preto: parte(f, "preto")
        };
      }),
      h: faixaH.map(function (f) {
        return {
          vermelho: parte(f, "vermelho"),
          verde: parte(f, "verde"),
          azul: parte(f, "azul"),
          amarelo: parte(f, "amarelo"),
          preto: parte(f, "preto")
        };
      })
    };
  }

  function pontuar(s) {
    var p = s.pct;
    var v = s.v;
    var h = s.h;
    var scores = {};

    // penaliza forte qualquer leitura “branca demais”
    var penalBranco = p.branco > 0.35 ? 1.5 : p.branco * 0.8;

    scores.brasil =
      p.verde * 2.2 + p.amarelo * 1.6 + p.azul * 0.5 - penalBranco - p.vermelho * 0.4;
    if (p.verde < 0.18 || p.amarelo < 0.05) scores.brasil -= 1.2;

    // Alemanha: preto / vermelho / amarelo (faixas horizontais)
    scores.alemanha =
      h[0].preto * 1.4 + h[1].vermelho * 1.3 + h[2].amarelo * 1.4 - penalBranco - p.azul * 0.8;
    if (p.preto < 0.12 || p.vermelho < 0.12 || p.amarelo < 0.1) scores.alemanha -= 1;

    // Espanha: vermelho + amarelo
    scores.espanha = p.vermelho * 1.2 + p.amarelo * 1.4 - p.azul * 1.0 - p.verde * 0.5 - penalBranco;
    if (p.amarelo < 0.12 || p.vermelho < 0.15) scores.espanha -= 1;

    // Portugal: verde | vermelho (vertical) + amarelo no brasão
    scores.portugal =
      v[0].verde * 1.4 + v[2].vermelho * 1.3 + p.amarelo * 0.4 - p.azul * 0.8 - penalBranco;
    if (v[0].verde < 0.18 || v[2].vermelho < 0.18) scores.portugal -= 1;

    // China: vermelho dominante + amarelo
    scores.china = p.vermelho * 2.0 + p.amarelo * 0.5 - penalBranco - p.azul * 0.8 - p.verde * 0.8;
    if (p.vermelho < 0.4) scores.china -= 1.2;

    // Colômbia: amarelo (metade) / azul / vermelho
    scores.colombia =
      h[0].amarelo * 1.5 + h[1].azul * 1.1 + h[2].vermelho * 1.1 - penalBranco - p.verde * 0.6;
    if (p.amarelo < 0.2) scores.colombia -= 1;

    // África do Sul: muitas cores (verde, vermelho, azul, amarelo, preto)
    scores["africa-do-sul"] =
      p.verde * 0.8 +
      p.vermelho * 0.6 +
      p.azul * 0.6 +
      p.amarelo * 0.5 +
      p.preto * 0.4 -
      penalBranco;
    if (p.verde < 0.08 || p.vermelho < 0.08 || p.azul < 0.08) scores["africa-do-sul"] -= 0.8;

    // Jamaica: verde / amarelo / preto (diagonal, mas cores fortes)
    scores.jamaica =
      p.verde * 1.3 + p.amarelo * 1.2 + p.preto * 1.0 - p.azul * 1.2 - p.vermelho * 0.8 - penalBranco;
    if (p.verde < 0.15 || p.amarelo < 0.1 || p.preto < 0.1) scores.jamaica -= 1;

    // Suécia: azul + amarelo
    scores.suecia = p.azul * 1.7 + p.amarelo * 1.2 - p.vermelho * 1.0 - p.verde * 0.6 - penalBranco;
    if (p.azul < 0.3 || p.amarelo < 0.08) scores.suecia -= 1;

    // Vietnã: vermelho + amarelo
    scores.vietnam =
      p.vermelho * 1.8 + p.amarelo * 0.7 - penalBranco - p.azul * 0.9 - p.verde * 0.9;
    if (p.vermelho < 0.4) scores.vietnam -= 1.2;

    // Gana: vermelho / amarelo / verde (+ estrela preta)
    scores.gana =
      h[0].vermelho * 1.2 + h[1].amarelo * 1.2 + h[2].verde * 1.2 + p.preto * 0.2 - penalBranco;
    if (p.vermelho < 0.12 || p.amarelo < 0.12 || p.verde < 0.12) scores.gana -= 1;

    // Armênia: vermelho / azul / laranja (faixas horizontais)
    scores.armenia =
      h[0].vermelho * 1.3 +
      h[1].azul * 1.3 +
      p.laranja * 1.2 +
      h[2].amarelo * 0.5 -
      penalBranco -
      p.verde * 0.8;
    if (p.vermelho < 0.12 || p.azul < 0.12) scores.armenia -= 1;

    return scores;
  }

  function classificar(fonteVisual) {
    var stats = analisar(sampleCanvas(fonteVisual));
    var scores = pontuar(stats);
    var melhorId = null;
    var melhorScore = -Infinity;
    var segundo = -Infinity;
    var id;

    // rejeita cena clara demais (parede)
    if (stats.pct.branco > 0.55) {
      return null;
    }

    for (id in scores) {
      if (!Object.prototype.hasOwnProperty.call(scores, id)) continue;
      if (scores[id] > melhorScore) {
        segundo = melhorScore;
        melhorScore = scores[id];
        melhorId = id;
      } else if (scores[id] > segundo) {
        segundo = scores[id];
      }
    }

    if (!melhorId || melhorScore < 0.55 || melhorScore - segundo < 0.1) {
      return null;
    }

    return {
      id: melhorId,
      confianca: Math.max(0.55, Math.min(0.98, 0.55 + melhorScore / 4)),
      distancia: 1 - melhorScore,
      metodo: "padrao-bandeira",
      debug: { scores: scores, pct: stats.pct }
    };
  }

  return { classificar: classificar };
})();
