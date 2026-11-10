/**
 * mostrar-card-pais-ar.js
 * Papel no sistema: decide quando exibir o conteúdo AR e pede ao módulo A-Frame
 * para mostrar o painel 3D do país detectado.
 */

window.MostrarCardPaisAr = (function () {
  var paisAtual = null;
  var estabilizadoId = null;
  var contagemEstavel = 0;
  var NECESSARIO_ESTAVEL = 4;

  function esconder() {
    paisAtual = null;
    estabilizadoId = null;
    contagemEstavel = 0;
    if (window.MontarCenaArAframe) {
      window.MontarCenaArAframe.esconderPainel();
    }
  }

  function renderizar(pais) {
    paisAtual = pais;
    window.MontarCenaArAframe.mostrarPais(pais);
  }

  function atualizarComDeteccao(resultado) {
    if (!resultado) {
      contagemEstavel = 0;
      estabilizadoId = null;
      return;
    }

    if (resultado.id === estabilizadoId) {
      contagemEstavel += 1;
    } else {
      estabilizadoId = resultado.id;
      contagemEstavel = 1;
    }

    if (contagemEstavel >= NECESSARIO_ESTAVEL) {
      var pais = window.buscarPaisPorId(resultado.id);
      if (pais && (!paisAtual || paisAtual.id !== pais.id)) {
        renderizar(pais);
      }
    }
  }

  function mostrarDireto(pais) {
    renderizar(pais);
  }

  function ligarBotaoVisitar() {
    // O clique agora é tratado pelos componentes A-Frame em montar-cena-ar-aframe.js
  }

  return {
    esconder: esconder,
    atualizarComDeteccao: atualizarComDeteccao,
    mostrarDireto: mostrarDireto,
    ligarBotaoVisitar: ligarBotaoVisitar,
    obterPaisAtual: function () {
      return paisAtual;
    }
  };
})();
