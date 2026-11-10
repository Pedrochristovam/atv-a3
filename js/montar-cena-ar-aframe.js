/**
 * montar-cena-ar-aframe.js
 * Papel no sistema: cena de Realidade Aumentada com componentes A-Frame
 * sobre a webcam (a-scene, a-plane, a-text, a-box, a-sphere, animation).
 */

window.MontarCenaArAframe = (function () {
  var cena = null;
  var paisAtual = null;

  function container() {
    return document.getElementById("container-cena-ar");
  }

  function botaoHtmlVisitar() {
    return document.getElementById("btn-visitar-ar-html");
  }

  function htmlCena() {
    return [
      '<a-scene id="cena-ar"',
      '  embedded',
      '  loading-screen="enabled: false"',
      '  vr-mode-ui="enabled: false"',
      '  device-orientation-permission-ui="enabled: false"',
      '  renderer="alpha: true; antialias: true; colorManagement: true"',
      '  style="background: transparent;">',
      '  <a-assets timeout="10000">',
      '    <img id="tex-bandeira-ar" src="assets/bandeiras/brasil.png" crossorigin="anonymous" />',
      "  </a-assets>",
      "",
      '  <a-entity id="camera-rig-ar" position="0 0 0">',
      '    <a-camera id="camera-ar"',
      '      look-controls="enabled: false"',
      '      wasd-controls="enabled: false"',
      '      position="0 0 0">',
      '      <a-entity cursor="rayOrigin: mouse; fuse: false"',
      '        raycaster="objects: .clicavel-ar; far: 20"></a-entity>',
      "    </a-camera>",
      "  </a-entity>",
      "",
      '  <a-entity id="painel-ar" position="0 0.35 -2.1" scale="0.82 0.82 0.82" visible="false">',
      '    <a-plane id="ar-fundo"',
      '      width="1.5" height="1.4" position="0 0.02 -0.05"',
      '      color="#ffffff" material="opacity: 0.95; transparent: true"',
      '      animation="property: position; to: 0 0.06 -0.05; dir: alternate; loop: true; dur: 2600; easing: easeInOutSine"></a-plane>',
      "",
      '    <a-plane id="ar-bandeira"',
      '      width="1.18" height="0.74" position="0 0.42 0"',
      '      material="shader: flat; src: #tex-bandeira-ar; transparent: true"',
      '      animation="property: rotation; to: 0 0 1.5; dir: alternate; loop: true; dur: 2000; easing: easeInOutSine"></a-plane>',
      "",
      '    <a-text id="ar-nome" value="Pais" position="0 -0.12 0.02"',
      '      align="center" color="#121820" width="2.7"></a-text>',
      '    <a-text id="ar-capital" value="Capital" position="0 -0.28 0.02"',
      '      align="center" color="#5c6672" width="2.3"></a-text>',
      '    <a-text id="ar-destino" value="Destino" position="0 -0.44 0.02"',
      '      align="center" color="#1f4e79" width="2.4"></a-text>',
      "",
      '    <a-plane id="ar-botao-visitar" class="clicavel-ar"',
      '      width="1.1" height="0.26" position="0 -0.72 0.03" color="#1f4e79"',
      '      animation__pulse="property: scale; to: 1.03 1.03 1; dir: alternate; loop: true; dur: 1000; easing: easeInOutQuad"></a-plane>',
      '    <a-text id="ar-botao-texto" class="clicavel-ar"',
      '      value="Visitar destino 360" position="0 -0.72 0.04"',
      '      align="center" color="#ffffff" width="2.2"></a-text>',
      "",
      '    <a-box id="ar-cubo-accent" width="0.12" height="0.12" depth="0.12"',
      '      position="0.64 0.8 0.08" color="#1f4e79"',
      '      animation="property: rotation; to: 0 360 0; loop: true; dur: 5000; easing: linear"></a-box>',
      '    <a-sphere id="ar-esfera-accent" radius="0.06"',
      '      position="-0.64 0.8 0.08" color="#9eb8d0"',
      '      animation="property: position; to: -0.64 0.92 0.08; dir: alternate; loop: true; dur: 1200; easing: easeInOutSine"></a-sphere>',
      "  </a-entity>",
      "</a-scene>"
    ].join("\n");
  }

  function visitarDestino() {
    if (paisAtual) {
      window.ControlarNavegacao.irParaTour(paisAtual);
    }
  }

  function ligarCliques() {
    var botao = document.getElementById("ar-botao-visitar");
    var texto = document.getElementById("ar-botao-texto");
    var htmlBtn = botaoHtmlVisitar();

    function onClick(evento) {
      evento.preventDefault();
      evento.stopPropagation();
      visitarDestino();
    }

    if (botao) {
      botao.addEventListener("click", onClick);
    }
    if (texto) {
      texto.addEventListener("click", onClick);
    }
    if (htmlBtn && !htmlBtn.dataset.ligado) {
      htmlBtn.dataset.ligado = "1";
      htmlBtn.addEventListener("click", visitarDestino);
    }
  }

  function sincronizarBotaoHtml(visivel) {
    var htmlBtn = botaoHtmlVisitar();
    if (!htmlBtn) {
      return;
    }
    if (visivel) {
      htmlBtn.classList.remove("oculto");
    } else {
      htmlBtn.classList.add("oculto");
    }
  }

  function montar() {
    var el = container();
    if (!el) {
      return;
    }

    destruir();
    el.innerHTML = htmlCena();
    cena = document.getElementById("cena-ar");
    sincronizarBotaoHtml(false);

    if (cena) {
      if (cena.hasLoaded) {
        ligarCliques();
      } else {
        cena.addEventListener("loaded", ligarCliques);
      }
    }
  }

  function destruir() {
    var el = container();
    paisAtual = null;
    sincronizarBotaoHtml(false);
    if (el) {
      el.innerHTML = "";
    }
    cena = null;
  }

  function esconderPainel() {
    var painel = document.getElementById("painel-ar");
    paisAtual = null;
    if (painel) {
      painel.setAttribute("visible", "false");
    }
    sincronizarBotaoHtml(false);
  }

  function mostrarPais(pais) {
    var painel = document.getElementById("painel-ar");
    var tex = document.getElementById("tex-bandeira-ar");
    var bandeira = document.getElementById("ar-bandeira");
    var nome = document.getElementById("ar-nome");
    var capital = document.getElementById("ar-capital");
    var destino = document.getElementById("ar-destino");
    var cubo = document.getElementById("ar-cubo-accent");

    if (!pais) {
      return;
    }

    // Se a cena ainda não montou, monta e tenta de novo em seguida
    if (!painel) {
      montar();
      setTimeout(function () {
        mostrarPais(pais);
      }, 120);
      return;
    }

    paisAtual = pais;

    if (tex) {
      tex.setAttribute("src", pais.arquivoBandeira);
    }
    if (bandeira) {
      bandeira.setAttribute(
        "material",
        "shader: flat; transparent: true; src: " + pais.arquivoBandeira
      );
    }
    if (nome) {
      nome.setAttribute("value", pais.nome);
    }
    if (capital) {
      capital.setAttribute("value", "Capital: " + pais.capital);
    }
    if (destino) {
      destino.setAttribute("value", pais.pontoTuristico);
    }
    if (cubo) {
      cubo.setAttribute("color", pais.corDestaque || "#1f4e79");
    }

    painel.setAttribute("visible", "true");
    painel.setAttribute("scale", "1 1 1");
    sincronizarBotaoHtml(true);
  }

  return {
    montar: montar,
    destruir: destruir,
    esconderPainel: esconderPainel,
    mostrarPais: mostrarPais,
    obterPaisAtual: function () {
      return paisAtual;
    }
  };
})();
