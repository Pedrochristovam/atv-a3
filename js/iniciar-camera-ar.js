/**
 * iniciar-camera-ar.js
 * Papel no sistema: webcam + reconhecimento sob demanda.
 * O painel AR NÃO abre sozinho no vídeo ao vivo (evita falso positivo, ex.: Japão).
 * Abre só com: Capturar, Enviar foto ou toque na bandeira.
 */

window.IniciarCameraAr = (function () {
  var streamAtivo = null;
  var animacaoId = null;
  var ultimoAnalise = 0;
  var INTERVALO_MS = 700;
  var paisTravadoManual = null;

  function video() {
    return document.getElementById("video-camera");
  }

  function canvasAnalise() {
    return document.getElementById("canvas-analise");
  }

  function atualizarStatus(texto) {
    window.UtilitariosInterface.definirTexto("status-deteccao", texto);
  }

  function limparDeteccao() {
    paisTravadoManual = null;
    window.MostrarCardPaisAr.esconder();
    atualizarStatus("Detecção limpa. Centralize a bandeira e toque em Capturar.");
  }

  function aplicarResultadoConfirmado(resultado, origem) {
    if (!resultado) {
      atualizarStatus(
        origem === "foto" || origem === "captura"
          ? "Não reconheci. Tente outra foto ou toque numa bandeira."
          : "Nenhuma bandeira confirmada."
      );
      return;
    }

    var pais = window.buscarPaisPorId(resultado.id);
    if (!pais) {
      return;
    }

    var pct = Math.round(resultado.confianca * 100);
    var metodo = resultado.metodo === "opencv-template" ? "OpenCV" : "cores";
    atualizarStatus("Confirmado: " + pais.nome + " · " + pct + "% · " + metodo);
    window.MostrarCardPaisAr.mostrarDireto(pais);
  }

  function selecionarPaisManual(pais) {
    paisTravadoManual = pais;
    atualizarStatus("Selecionado: " + pais.nome);
    window.MostrarCardPaisAr.mostrarDireto(pais);
  }

  function preencherAtalhosBandeira() {
    var faixa = document.getElementById("atalhos-bandeiras-camera");
    if (!faixa) {
      return;
    }

    faixa.innerHTML = "";
    window.DADOS_PAISES.forEach(function (pais) {
      var botao = document.createElement("button");
      botao.type = "button";
      botao.className = "atalho-bandeira";
      botao.title = pais.nome;
      botao.setAttribute("aria-label", "Selecionar " + pais.nome);
      botao.innerHTML =
        '<img src="' +
        pais.arquivoBandeira +
        '" alt="" />' +
        "<span>" +
        pais.nome +
        "</span>";
      botao.addEventListener("click", function () {
        selecionarPaisManual(pais);
      });
      faixa.appendChild(botao);
    });
  }

  /**
   * Loop ao vivo: só atualiza o texto de status (dica), nunca abre o painel AR.
   */
  function loop(timestamp) {
    animacaoId = requestAnimationFrame(loop);

    if (paisTravadoManual) {
      return;
    }

    if (!timestamp || timestamp - ultimoAnalise < INTERVALO_MS) {
      return;
    }

    ultimoAnalise = timestamp;

    if (!window.ReconhecerBandeira.estaPronto()) {
      atualizarStatus("Preparando reconhecimento...");
      return;
    }

    if (window.MostrarCardPaisAr.obterPaisAtual()) {
      return;
    }

    var resultado = window.ReconhecerBandeira.analisarFrame(
      video(),
      canvasAnalise()
    );

    if (resultado && resultado.confianca >= 0.72) {
      var pais = window.buscarPaisPorId(resultado.id);
      atualizarStatus(
        "Possível: " +
          (pais ? pais.nome : resultado.id) +
          " — toque em Capturar para confirmar"
      );
    } else {
      atualizarStatus("Centralize a bandeira e toque em Capturar");
    }
  }

  function capturarFrameAtual() {
    var elVideo = video();
    var canvas = canvasAnalise();
    var ctx;
    var resultado;

    paisTravadoManual = null;
    window.MostrarCardPaisAr.esconder();

    if (!elVideo || elVideo.readyState < 2) {
      atualizarStatus("Aguarde a câmera iniciar...");
      return;
    }

    canvas.width = elVideo.videoWidth || 640;
    canvas.height = elVideo.videoHeight || 480;
    ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(elVideo, 0, 0, canvas.width, canvas.height);

    var corte = document.createElement("canvas");
    var cctx = corte.getContext("2d");
    var cw = canvas.width * 0.65;
    var ch = canvas.height * 0.48;
    corte.width = Math.max(80, cw);
    corte.height = Math.max(60, ch);
    cctx.drawImage(
      canvas,
      (canvas.width - cw) / 2,
      (canvas.height - ch) / 2,
      cw,
      ch,
      0,
      0,
      corte.width,
      corte.height
    );

    atualizarStatus("Analisando captura (OpenCV/padrões)...");
    window.ReconhecerBandeira.analisarCapturaAsync(corte).then(function (res) {
      aplicarResultadoConfirmado(res, "captura");
    });
  }

  function analisarArquivo(arquivo) {
    if (!arquivo) {
      return;
    }

    paisTravadoManual = null;
    window.MostrarCardPaisAr.esconder();

    var leitor = new FileReader();
    leitor.onload = function () {
      var img = new Image();
      img.onload = function () {
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        atualizarStatus("Analisando foto (OpenCV/padrões)...");
        window.ReconhecerBandeira.analisarCapturaAsync(canvas).then(function (res) {
          aplicarResultadoConfirmado(res, "foto");
        });
      };
      img.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  }

  function ligarControlesExtras() {
    var btnCaptura = document.getElementById("btn-capturar-frame");
    var inputFoto = document.getElementById("input-foto-bandeira");
    var btnLimpar = document.getElementById("btn-limpar-deteccao");

    if (btnCaptura && !btnCaptura.dataset.ligado) {
      btnCaptura.dataset.ligado = "1";
      btnCaptura.addEventListener("click", capturarFrameAtual);
    }

    if (inputFoto && !inputFoto.dataset.ligado) {
      inputFoto.dataset.ligado = "1";
      inputFoto.addEventListener("change", function (evento) {
        var arquivo = evento.target.files && evento.target.files[0];
        analisarArquivo(arquivo);
        inputFoto.value = "";
      });
    }

    if (btnLimpar && !btnLimpar.dataset.ligado) {
      btnLimpar.dataset.ligado = "1";
      btnLimpar.addEventListener("click", limparDeteccao);
    }
  }

  function iniciar() {
    var elVideo = video();
    paisTravadoManual = null;

    window.MostrarCardPaisAr.esconder();
    if (window.MontarCenaArAframe) {
      window.MontarCenaArAframe.montar();
    }
    preencherAtalhosBandeira();
    ligarControlesExtras();
    atualizarStatus("Pedindo acesso à câmera...");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      atualizarStatus("Sem câmera. Toque numa bandeira ou envie uma foto.");
      return;
    }

    var tentativas = [
      {
        audio: false,
        video: {
          facingMode: { ideal: "user" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      },
      { audio: false, video: true }
    ];

    function pedirCamera(indice) {
      if (indice >= tentativas.length) {
        atualizarStatus("Sem câmera. Toque numa bandeira abaixo.");
        return;
      }

      navigator.mediaDevices
        .getUserMedia(tentativas[indice])
        .then(function (stream) {
          streamAtivo = stream;
          elVideo.srcObject = stream;
          return elVideo.play();
        })
        .then(function () {
          atualizarStatus("Centralize a bandeira e toque em Capturar");
          if (animacaoId) {
            cancelAnimationFrame(animacaoId);
          }
          animacaoId = requestAnimationFrame(loop);
        })
        .catch(function (erro) {
          console.warn("Tentativa de câmera falhou:", erro);
          pedirCamera(indice + 1);
        });
    }

    pedirCamera(0);
  }

  function parar() {
    if (animacaoId) {
      cancelAnimationFrame(animacaoId);
      animacaoId = null;
    }

    if (streamAtivo) {
      streamAtivo.getTracks().forEach(function (track) {
        track.stop();
      });
      streamAtivo = null;
    }

    var elVideo = video();
    if (elVideo) {
      elVideo.srcObject = null;
    }

    paisTravadoManual = null;
    window.MostrarCardPaisAr.esconder();
    if (window.MontarCenaArAframe) {
      window.MontarCenaArAframe.destruir();
    }
  }

  return {
    iniciar: iniciar,
    parar: parar,
    selecionarPaisManual: selecionarPaisManual,
    limparDeteccao: limparDeteccao
  };
})();
