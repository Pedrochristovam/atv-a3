/**
 * utilitarios-interface.js
 * Papel no sistema: funções auxiliares de interface usadas por vários módulos.
 */

window.UtilitariosInterface = {
  /**
   * Mostra um elemento e esconde os demais irmãos com a classe "tela".
   */
  mostrarTela: function (idTela) {
    var telas = document.querySelectorAll(".tela");
    telas.forEach(function (tela) {
      tela.classList.add("oculto");
    });
    var alvo = document.getElementById(idTela);
    if (alvo) {
      alvo.classList.remove("oculto");
    }
  },

  /**
   * Atualiza o texto de um elemento por id (se existir).
   */
  definirTexto: function (idElemento, texto) {
    var el = document.getElementById(idElemento);
    if (el) {
      el.textContent = texto;
    }
  }
};
