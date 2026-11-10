/**
 * abrir-tour-360.js
 * Papel no sistema: monta a Realidade Virtual 360° com A-Frame.
 */

window.AbrirTour360 = (function () {
  var cenaAtual = null;
  var observadorResize = null;

  function atualizarInfo(pais) {
    window.UtilitariosInterface.definirTexto(
      "tour-titulo",
      pais.pontoTuristico + " — " + pais.nome
    );
    window.UtilitariosInterface.definirTexto("tour-descricao", pais.descricao);
  }

  function forcarTamanhoCena(cena) {
    if (!cena) {
      return;
    }

    var largura = window.innerWidth;
    var altura = window.innerHeight;
    cena.style.width = largura + "px";
    cena.style.height = altura + "px";

    if (typeof cena.resize === "function") {
      cena.resize();
    }

    if (cena.renderer && typeof cena.renderer.setSize === "function") {
      cena.renderer.setSize(largura, altura, false);
    }
  }

  function precarregarImagem(caminho) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        resolve(caminho);
      };
      img.onerror = function () {
        reject(new Error("Falha ao carregar panorama: " + caminho));
      };
      // cache-bust leve para evitar imagem antiga quebrada no browser
      img.src = caminho + (caminho.indexOf("?") >= 0 ? "&" : "?") + "v=3";
    });
  }

  function caminhoComVersao(caminho) {
    return caminho + (caminho.indexOf("?") >= 0 ? "&" : "?") + "v=3";
  }

  function montarCena(caminhoPano, titulo) {
    var container = document.getElementById("container-cena-360");
    var tituloLimpo = String(titulo || "").replace(/"/g, "");
    var src = caminhoComVersao(caminhoPano);

    container.innerHTML =
      '<a-scene id="cena-360" embedded loading-screen="enabled: false" ' +
      'vr-mode-ui="enabled: true" device-orientation-permission-ui="enabled: false" ' +
      'renderer="antialias: true; colorManagement: true" background="color: #101820">' +
      '  <a-sky src="' +
      src +
      '" rotation="0 -90 0"></a-sky>' +
      '  <a-entity position="0 1.6 0">' +
      '    <a-camera look-controls="reverseMouseDrag: true" wasd-controls="enabled: false" fov="80"></a-camera>' +
      "  </a-entity>" +
      '  <a-text value="' +
      tituloLimpo +
      '" position="0 2.2 -4" align="center" color="#FFFFFF" width="8"></a-text>' +
      "</a-scene>";

    cenaAtual = document.getElementById("cena-360");

    function aoCarregar() {
      forcarTamanhoCena(cenaAtual);
      [100, 300, 700].forEach(function (ms) {
        setTimeout(function () {
          forcarTamanhoCena(cenaAtual);
        }, ms);
      });
    }

    if (cenaAtual) {
      if (cenaAtual.hasLoaded) {
        aoCarregar();
      } else {
        cenaAtual.addEventListener("loaded", aoCarregar);
      }
    }

    if (observadorResize) {
      window.removeEventListener("resize", observadorResize);
    }
    observadorResize = function () {
      forcarTamanhoCena(cenaAtual);
    };
    window.addEventListener("resize", observadorResize);
  }

  function abrir(pais) {
    var container = document.getElementById("container-cena-360");
    if (!container || !pais) {
      return;
    }

    fechar();
    atualizarInfo(pais);
    container.innerHTML =
      '<div class="tour-carregando">Carregando tour 360° de ' +
      pais.pontoTuristico +
      "...</div>";

    precarregarImagem(pais.arquivoTour360)
      .then(function () {
        montarCena(pais.arquivoTour360, pais.pontoTuristico);
      })
      .catch(function (erro) {
        console.error(erro);
        container.innerHTML =
          '<div class="tour-erro">' +
          "<p>Não foi possível carregar o panorama 360°.</p>" +
          "<p>" +
          pais.arquivoTour360 +
          "</p>" +
          "</div>";
      });
  }

  function fechar() {
    var container = document.getElementById("container-cena-360");

    if (observadorResize) {
      window.removeEventListener("resize", observadorResize);
      observadorResize = null;
    }

    if (cenaAtual) {
      try {
        if (cenaAtual.renderer && cenaAtual.renderer.dispose) {
          cenaAtual.renderer.dispose();
        }
      } catch (e) {}
    }

    if (container) {
      container.innerHTML = "";
    }
    cenaAtual = null;
  }

  return {
    abrir: abrir,
    fechar: fechar
  };
})();
