/**
 * iniciar-aplicacao.js
 * Papel no sistema: ponto de entrada — álbum, painel de detalhe e preparação do reconhecimento.
 */

window.IniciarAplicacao = (function () {
  var paisSelecionado = null;

  function elementosDetalhe() {
    return {
      painel: document.getElementById("painel-detalhe"),
      bandeira: document.getElementById("detalhe-bandeira"),
      nome: document.getElementById("detalhe-nome"),
      capital: document.getElementById("detalhe-capital"),
      destino: document.getElementById("detalhe-destino")
    };
  }

  function abrirDetalhe(pais) {
    var els = elementosDetalhe();
    paisSelecionado = pais;
    els.bandeira.src = pais.arquivoBandeira;
    els.bandeira.alt = "Bandeira de " + pais.nome;
    els.nome.textContent = pais.nome;
    els.capital.textContent = "Capital · " + pais.capital;
    els.destino.textContent =
      pais.pontoTuristico +
      " — " +
      pais.cidade +
      ". " +
      pais.descricao;
    els.painel.classList.remove("oculto");
  }

  function fecharDetalhe() {
    elementosDetalhe().painel.classList.add("oculto");
    paisSelecionado = null;
  }

  function preencherAlbum() {
    var grade = document.getElementById("grade-bandeiras");
    grade.innerHTML = "";

    window.DADOS_PAISES.forEach(function (pais) {
      var card = document.createElement("button");
      card.type = "button";
      card.className = "card-bandeira";
      card.setAttribute("aria-label", "Abrir " + pais.nome);

      card.innerHTML =
        '<div class="moldura"><img src="' +
        pais.arquivoBandeira +
        '" alt="Bandeira de ' +
        pais.nome +
        '" /></div>' +
        "<strong>" +
        pais.nome +
        "</strong>" +
        "<small>" +
        pais.pontoTuristico +
        "</small>";

      card.addEventListener("click", function () {
        abrirDetalhe(pais);
      });

      grade.appendChild(card);
    });
  }

  function ligarPainelDetalhe() {
    document
      .getElementById("btn-detalhe-fechar")
      .addEventListener("click", fecharDetalhe);

    document
      .getElementById("btn-detalhe-visitar")
      .addEventListener("click", function () {
        if (!paisSelecionado) {
          return;
        }
        var pais = paisSelecionado;
        fecharDetalhe();
        window.ControlarNavegacao.irParaTour(pais);
      });

    document
      .getElementById("painel-detalhe")
      .addEventListener("click", function (evento) {
        if (evento.target.id === "painel-detalhe") {
          fecharDetalhe();
        }
      });
  }

  function iniciar() {
    window.ControlarNavegacao.ligarBotoes();
    window.MostrarCardPaisAr.ligarBotaoVisitar();
    ligarPainelDetalhe();
    preencherAlbum();

    window.ReconhecerBandeira.preparar()
      .then(function () {
        console.log("Modelos de bandeira prontos.");
      })
      .catch(function (erro) {
        console.error("Falha ao preparar reconhecimento:", erro);
      });

    window.ControlarNavegacao.irParaInicio();
  }

  return {
    iniciar: iniciar,
    preencherAlbum: preencherAlbum,
    fecharDetalhe: fecharDetalhe
  };
})();

document.addEventListener("DOMContentLoaded", function () {
  window.IniciarAplicacao.iniciar();
});
