/**
 * reconhecer-bandeira-opencv.js
 * Papel no sistema: reforço de reconhecimento com OpenCV.js (template matching).
 * Ativa automaticamente quando a biblioteca C++/WebAssembly termina de carregar.
 */

window.OpenCvPronto = function () {
  if (window.ReconhecerBandeiraOpenCv) {
    window.ReconhecerBandeiraOpenCv.marcarPronto();
  }
};

window.ReconhecerBandeiraOpenCv = (function () {
  var pronto = false;
  var LIMIAR_MINIMO = 0.42;

  function marcarPronto() {
    if (typeof cv !== "undefined") {
      pronto = true;
      console.log("OpenCV.js pronto para reconhecimento de bandeiras.");
    }
  }

  // OpenCV pode inicializar depois do onload do script
  if (typeof cv !== "undefined") {
    if (cv.Mat) {
      marcarPronto();
    } else if (cv["onRuntimeInitialized"]) {
      var anterior = cv["onRuntimeInitialized"];
      cv["onRuntimeInitialized"] = function () {
        if (typeof anterior === "function") {
          anterior();
        }
        marcarPronto();
      };
    } else {
      cv["onRuntimeInitialized"] = marcarPronto;
    }
  }

  function pontuarContraModelos(canvasOuImg, modelos) {
    if (!pronto || typeof cv === "undefined" || !cv.Mat) {
      return null;
    }

    var src = null;
    var melhor = null;
    var i;
    var templCanvas;
    var templCtx;
    var templ;
    var result;
    var mask;
    var mm;
    var score;

    try {
      src = cv.imread(canvasOuImg);
      cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);

      for (i = 0; i < modelos.length; i++) {
        templCanvas = document.createElement("canvas");
        templCanvas.width = Math.min(140, src.cols - 2);
        templCanvas.height = Math.round(templCanvas.width * (2 / 3));
        if (templCanvas.width < 20 || templCanvas.height < 20) {
          continue;
        }
        if (templCanvas.width >= src.cols || templCanvas.height >= src.rows) {
          continue;
        }

        templCtx = templCanvas.getContext("2d");
        templCtx.drawImage(
          modelos[i].imagem,
          0,
          0,
          templCanvas.width,
          templCanvas.height
        );

        templ = cv.imread(templCanvas);
        cv.cvtColor(templ, templ, cv.COLOR_RGBA2GRAY, 0);
        result = new cv.Mat();
        mask = new cv.Mat();
        cv.matchTemplate(src, templ, result, cv.TM_CCOEFF_NORMED, mask);
        mm = cv.minMaxLoc(result, mask);
        score = mm.maxVal;
        templ.delete();
        result.delete();
        mask.delete();

        if (!melhor || score > melhor.score) {
          melhor = { id: modelos[i].id, score: score };
        }
      }

      src.delete();
    } catch (erro) {
      console.warn("OpenCV matching falhou:", erro);
      if (src) {
        try {
          src.delete();
        } catch (e) {}
      }
      return null;
    }

    if (!melhor || melhor.score < LIMIAR_MINIMO) {
      return null;
    }

    return {
      id: melhor.id,
      confianca: melhor.score,
      distancia: 1 - melhor.score,
      metodo: "opencv-template"
    };
  }

  function analisarCanvas(canvas, modelos) {
    return pontuarContraModelos(canvas, modelos);
  }

  function analisarImagem(imagem, modelos) {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    var maxW = 320;
    var escala = Math.min(1, maxW / imagem.width);
    canvas.width = Math.max(40, Math.round(imagem.width * escala));
    canvas.height = Math.max(30, Math.round(imagem.height * escala));
    ctx.drawImage(imagem, 0, 0, canvas.width, canvas.height);
    return pontuarContraModelos(canvas, modelos);
  }

  return {
    marcarPronto: marcarPronto,
    estaPronto: function () {
      return pronto;
    },
    analisarCanvas: analisarCanvas,
    analisarImagem: analisarImagem
  };
})();
