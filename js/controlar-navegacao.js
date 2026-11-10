/**
 * controlar-navegacao.js
 * Papel no sistema: troca entre as telas (início, álbum, câmera AR e tour 360).
 *
 * Scanner atual: MindAR (bandeira do Brasil).
 * IniciarCameraAr permanece no projeto, mas não roda em paralelo com o MindAR.
 */

window.ControlarNavegacao = (function () {
  function telaCamera() {
    return document.getElementById("tela-camera");
  }

  function ativarModoMindArNaInterface(ativo) {
    var tela = telaCamera();
    if (!tela) {
      return;
    }
    if (ativo) {
      tela.classList.add("tela-camera-mindar");
    } else {
      tela.classList.remove("tela-camera-mindar");
    }
  }

  /**
   * Encerra qualquer captura ativa (legado e/ou MindAR) para evitar duas câmeras.
   */
  function encerrarScanner() {
    if (window.MontarCenaMindarAr && typeof window.MontarCenaMindarAr.parar === "function") {
      window.MontarCenaMindarAr.parar();
    }
    if (window.IniciarCameraAr && typeof window.IniciarCameraAr.parar === "function") {
      window.IniciarCameraAr.parar();
    }
    ativarModoMindArNaInterface(false);
  }

  function irParaInicio() {
    if (window.IniciarAplicacao && window.IniciarAplicacao.fecharDetalhe) {
      window.IniciarAplicacao.fecharDetalhe();
    }
    encerrarScanner();
    if (window.AbrirTour360 && window.AbrirTour360.fechar) {
      window.AbrirTour360.fechar();
    }
    window.UtilitariosInterface.mostrarTela("tela-inicio");
  }

  function irParaAlbum() {
    if (window.IniciarAplicacao && window.IniciarAplicacao.fecharDetalhe) {
      window.IniciarAplicacao.fecharDetalhe();
    }
    encerrarScanner();
    if (window.AbrirTour360 && window.AbrirTour360.fechar) {
      window.AbrirTour360.fechar();
    }
    window.UtilitariosInterface.mostrarTela("tela-album");
    window.IniciarAplicacao.preencherAlbum();
  }

  function irParaCamera() {
    if (window.AbrirTour360 && window.AbrirTour360.fechar) {
      window.AbrirTour360.fechar();
    }

    // Garante que não haja sessão anterior (legado ou MindAR) aberta.
    encerrarScanner();

    window.UtilitariosInterface.mostrarTela("tela-camera");
    ativarModoMindArNaInterface(true);
    window.UtilitariosInterface.definirTexto(
      "status-deteccao",
      "Iniciando MindAR (bandeira do Brasil)..."
    );

    if (!window.MontarCenaMindarAr || typeof window.MontarCenaMindarAr.iniciar !== "function") {
      window.UtilitariosInterface.definirTexto(
        "status-deteccao",
        "Módulo MindAR indisponível. Verifique os scripts no index.html."
      );
      return;
    }

    window.MontarCenaMindarAr.iniciar({
      onReady: function () {
        window.UtilitariosInterface.definirTexto(
          "status-deteccao",
          "Aponte a câmera traseira para a bandeira do Brasil."
        );
      },
      onError: function (info) {
        var mensagem =
          info && info.mensagem
            ? info.mensagem
            : "Falha ao iniciar o rastreamento MindAR.";
        window.UtilitariosInterface.definirTexto("status-deteccao", mensagem);
      },
      onTargetFound: function () {
        window.UtilitariosInterface.definirTexto(
          "status-deteccao",
          "Bandeira do Brasil detectada."
        );
      },
      onTargetLost: function () {
        window.UtilitariosInterface.definirTexto(
          "status-deteccao",
          "Bandeira perdida. Centralize a bandeira do Brasil novamente."
        );
      }
    }).then(function (resultado) {
      if (!resultado || resultado.ok) {
        return;
      }
      window.UtilitariosInterface.definirTexto(
        "status-deteccao",
        resultado.mensagem || "Não foi possível iniciar o scanner MindAR."
      );
    });
  }

  function irParaTour(pais) {
    encerrarScanner();
    window.UtilitariosInterface.mostrarTela("tela-tour");
    // Pequena pausa para liberar o WebGL da cena AR antes de abrir o tour VR
    setTimeout(function () {
      window.AbrirTour360.abrir(pais);
    }, 150);
  }

  function ligarBotoes() {
    document.getElementById("btn-ir-album").addEventListener("click", irParaAlbum);
    document.getElementById("btn-ir-camera").addEventListener("click", irParaCamera);
    document.getElementById("btn-album-voltar").addEventListener("click", irParaInicio);
    document.getElementById("btn-camera-voltar").addEventListener("click", irParaInicio);
    document.getElementById("btn-tour-voltar").addEventListener("click", function () {
      window.AbrirTour360.fechar();
      irParaAlbum();
    });
  }

  return {
    irParaInicio: irParaInicio,
    irParaAlbum: irParaAlbum,
    irParaCamera: irParaCamera,
    irParaTour: irParaTour,
    encerrarScanner: encerrarScanner,
    ligarBotoes: ligarBotoes
  };
})();
