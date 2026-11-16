/**
 * iniciar-aplicacao.js
 * Papel no sistema: ponto de entrada — álbum, painel de detalhe e preparação do reconhecimento.
 */

window.IniciarAplicacao = (function () {
  var paisSelecionado = null;
  var filtroAtivo = "todos";
  var termoBusca = "";

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

  function badgeDoPais(pais) {
    if (pais.arAtivo) {
      return '<span class="badge-ar">AR ativo</span>';
    }
    if (pais.tipoTour === "modelo3d") {
      return '<span class="badge-3d">3D</span>';
    }
    return '<span class="badge-tour">Tour</span>';
  }

  function ctaDoPais(pais) {
    if (pais.arAtivo || pais.tipoTour === "modelo3d") {
      return "Explorar monumento 3D";
    }
    return "Explorar destino";
  }

  function paisPassaFiltro(pais) {
    if (filtroAtivo !== "todos" && pais.continente !== filtroAtivo) {
      return false;
    }
    if (!termoBusca) {
      return true;
    }
    var texto =
      (pais.nome + " " + pais.pontoTuristico + " " + pais.cidade).toLowerCase();
    return texto.indexOf(termoBusca) >= 0;
  }

  function preencherAlbum() {
    var grade = document.getElementById("grade-bandeiras");
    if (!grade) {
      return;
    }
    grade.innerHTML = "";

    window.DADOS_PAISES.filter(paisPassaFiltro).forEach(function (pais, indice) {
      var card = document.createElement("button");
      card.type = "button";
      card.className = "card-destino";
      card.style.animationDelay = Math.min(indice * 0.04, 0.4) + "s";
      card.setAttribute("aria-label", "Abrir " + pais.nome);
      card.dataset.continente = pais.continente || "";

      card.innerHTML =
        '<div class="card-destino-midia">' +
        '<img src="' +
        pais.arquivoBandeira +
        '" alt="Bandeira de ' +
        pais.nome +
        '" loading="lazy" />' +
        badgeDoPais(pais) +
        "</div>" +
        '<div class="card-destino-corpo">' +
        "<strong>" +
        pais.nome +
        "</strong>" +
        "<em>" +
        pais.pontoTuristico +
        "</em>" +
        (pais.etiqueta
          ? '<span class="tag-destino">' + pais.etiqueta + "</span>"
          : "") +
        '<span class="card-destino-cta">' +
        ctaDoPais(pais) +
        "</span>" +
        "</div>";

      card.addEventListener("click", function () {
        abrirDetalhe(pais);
      });

      grade.appendChild(card);
    });
  }

  function ligarFiltrosAlbum() {
    var chips = document.querySelectorAll(".filtro-chip");
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) {
          c.classList.remove("ativo");
        });
        chip.classList.add("ativo");
        filtroAtivo = chip.getAttribute("data-filtro") || "todos";
        preencherAlbum();
      });
    });

    var busca = document.getElementById("input-busca-album");
    if (busca) {
      busca.addEventListener("input", function () {
        termoBusca = String(busca.value || "")
          .trim()
          .toLowerCase();
        preencherAlbum();
      });
    }
  }

  function ligarNavegacaoLanding() {
    var btnTopoCamera = document.getElementById("btn-ir-camera-topo");
    if (btnTopoCamera) {
      btnTopoCamera.addEventListener("click", function () {
        window.ControlarNavegacao.irParaCamera();
      });
    }

    var btnTopo = document.getElementById("btn-voltar-topo");
    if (btnTopo) {
      btnTopo.addEventListener("click", function () {
        var topo = document.getElementById("topo");
        if (topo) {
          topo.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    }

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
    ligarFiltrosAlbum();
    ligarNavegacaoLanding();
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
