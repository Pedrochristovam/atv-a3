/**
 * controlar-navegacao.js
 * Papel no sistema: troca entre as telas (início, álbum, câmera AR e tour 360).
 */

window.ControlarNavegacao = (function () {
  function irParaInicio() {
    if (window.IniciarAplicacao && window.IniciarAplicacao.fecharDetalhe) {
      window.IniciarAplicacao.fecharDetalhe();
    }
    if (window.IniciarCameraAr && window.IniciarCameraAr.parar) {
      window.IniciarCameraAr.parar();
    }
    if (window.AbrirTour360 && window.AbrirTour360.fechar) {
      window.AbrirTour360.fechar();
    }
    window.UtilitariosInterface.mostrarTela("tela-inicio");
  }

  function irParaAlbum() {
    if (window.IniciarAplicacao && window.IniciarAplicacao.fecharDetalhe) {
      window.IniciarAplicacao.fecharDetalhe();
    }
    if (window.IniciarCameraAr && window.IniciarCameraAr.parar) {
      window.IniciarCameraAr.parar();
    }
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
    window.UtilitariosInterface.mostrarTela("tela-camera");
    window.IniciarCameraAr.iniciar();
  }

  function irParaTour(pais) {
    if (window.IniciarCameraAr && window.IniciarCameraAr.parar) {
      window.IniciarCameraAr.parar();
    }
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
    ligarBotoes: ligarBotoes
  };
})();
