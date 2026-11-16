/**
 * abrir-tour-360.js
 * Papel no sistema: monta o tour do destino com A-Frame.
 * - tipoTour "cilindrico": panorama horizontal em arco (sem loop 360°)
 * - tipoTour "modelo3d": monumento GLB com iluminação e rotação lenta
 * - demais: equiretangular em <a-sky>
 */

window.AbrirTour360 = (function () {
  var cenaAtual = null;
  var observadorResize = null;
  var componenteRegistrado = false;

  var RAIO_CILINDRO = 4.5;
  var THETA_GRAUS = 150;
  /* Recorte UV inferior para afastar a borda preta irregular do FOV. */
  var UV_CORTE_INFERIOR = 0.04;
  var UV_CORTE_SUPERIOR = 0.01;
  var PITCH_MAX_GRAUS = 18;

  function garantirComponenteLimiteOlhar() {
    if (componenteRegistrado || !window.AFRAME || window.AFRAME.components["limitar-olhar-panorama"]) {
      componenteRegistrado = true;
      return;
    }

    window.AFRAME.registerComponent("limitar-olhar-panorama", {
      schema: {
        yawMax: { type: "number", default: 75 },
        pitchMax: { type: "number", default: 18 }
      },
      tick: function () {
        var lc = this.el.components["look-controls"];
        if (!lc || !lc.yawObject || !lc.pitchObject) {
          return;
        }

        var yawMax = THREE.MathUtils.degToRad(this.data.yawMax);
        var pitchMax = THREE.MathUtils.degToRad(this.data.pitchMax);
        lc.yawObject.rotation.y = Math.max(-yawMax, Math.min(yawMax, lc.yawObject.rotation.y));
        lc.pitchObject.rotation.x = Math.max(-pitchMax, Math.min(pitchMax, lc.pitchObject.rotation.x));
      }
    });

    componenteRegistrado = true;
  }

  function atualizarInfo(pais) {
    window.UtilitariosInterface.definirTexto(
      "tour-titulo",
      pais.pontoTuristico + " — " + pais.nome
    );
    window.UtilitariosInterface.definirTexto("tour-descricao", pais.descricao);
  }

  function atualizarDica(tipoTour) {
    var dica = document.querySelector(".dica-tour");
    if (!dica) {
      return;
    }
    if (tipoTour === "cilindrico" || tipoTour === "panorama") {
      dica.textContent =
        "Arraste ou gire o celular para explorar o panorama · limites nas extremidades";
    } else if (tipoTour === "modelo3d") {
      dica.textContent =
        "Arraste para olhar · o monumento gira lentamente · gire o celular no mobile";
    } else {
      dica.textContent =
        "Arraste para olhar ao redor · gire o celular se estiver no mobile";
    }
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

  function caminhoComVersao(caminho) {
    return caminho + (caminho.indexOf("?") >= 0 ? "&" : "?") + "v=4";
  }

  function precarregarImagem(caminho) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        resolve({
          caminho: caminho,
          largura: img.naturalWidth || img.width,
          altura: img.naturalHeight || img.height
        });
      };
      img.onerror = function () {
        reject(new Error("Falha ao carregar panorama: " + caminho));
      };
      img.src = caminhoComVersao(caminho);
    });
  }

  function ligarResize(cena) {
    if (observadorResize) {
      window.removeEventListener("resize", observadorResize);
    }
    observadorResize = function () {
      forcarTamanhoCena(cenaAtual);
    };
    window.addEventListener("resize", observadorResize);

    function aoCarregar() {
      forcarTamanhoCena(cena);
      [100, 300, 700].forEach(function (ms) {
        setTimeout(function () {
          forcarTamanhoCena(cena);
        }, ms);
      });
    }

    if (cena.hasLoaded) {
      aoCarregar();
    } else {
      cena.addEventListener("loaded", aoCarregar);
    }
  }

  function montarCenaSky(caminhoPano, titulo) {
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
    ligarResize(cenaAtual);
  }

  /**
   * Cilindro parcial: altura = R * thetaRad / proporção efetiva da textura.
   * Assim a textura não estica; o arco não fecha em 360°.
   */
  function montarCenaCilindrica(meta, titulo) {
    garantirComponenteLimiteOlhar();

    var container = document.getElementById("container-cena-360");
    var tituloLimpo = String(titulo || "").replace(/"/g, "");
    var src = caminhoComVersao(meta.caminho);

    var uvAlturaUtil = Math.max(0.5, 1 - UV_CORTE_INFERIOR - UV_CORTE_SUPERIOR);
    var proporcao =
      meta.largura && meta.altura
        ? meta.largura / (meta.altura * uvAlturaUtil)
        : 8.29;

    var thetaRad = (THETA_GRAUS * Math.PI) / 180;
    var alturaCilindro = (RAIO_CILINDRO * thetaRad) / proporcao;
    var yawMax = THETA_GRAUS / 2 - 2;
    var uvOffsetY = UV_CORTE_INFERIOR;
    var thetaStart = (360 - THETA_GRAUS) / 2;

    container.innerHTML =
      '<a-scene id="cena-360" embedded loading-screen="enabled: false" ' +
      'vr-mode-ui="enabled: false" device-orientation-permission-ui="enabled: false" ' +
      'renderer="antialias: true; colorManagement: true" background="color: #0b0f14">' +
      '  <a-entity id="pano-cilindro"' +
      '    geometry="primitive: cylinder; radius: ' +
      RAIO_CILINDRO +
      "; height: " +
      alturaCilindro.toFixed(4) +
      "; thetaStart: " +
      thetaStart.toFixed(2) +
      "; thetaLength: " +
      THETA_GRAUS +
      '; openEnded: true; segmentsRadial: 72; segmentsHeight: 1"' +
      '    material="src: ' +
      src +
      "; side: back; shader: flat; npot: true; transparent: false; " +
      "repeat: 1 " +
      uvAlturaUtil.toFixed(4) +
      "; offset: 0 " +
      uvOffsetY.toFixed(4) +
      '"' +
      '    position="0 1.6 0"' +
      '    rotation="0 180 0"' +
      "  ></a-entity>" +
      '  <a-entity position="0 1.6 0">' +
      '    <a-camera look-controls="reverseMouseDrag: true; magicWindowTrackingEnabled: true" ' +
      'wasd-controls="enabled: false" fov="70" ' +
      'limitar-olhar-panorama="yawMax: ' +
      yawMax.toFixed(2) +
      "; pitchMax: " +
      PITCH_MAX_GRAUS +
      '"></a-camera>' +
      "  </a-entity>" +
      '  <a-text value="' +
      tituloLimpo +
      '" position="0 2.05 -3.2" align="center" color="#FFFFFF" width="6"></a-text>' +
      "</a-scene>";

    cenaAtual = document.getElementById("cena-360");
    ligarResize(cenaAtual);

    console.info("[AbrirTour360] cilindrico", {
      textura: meta.largura + "x" + meta.altura,
      proporcao: Number(proporcao.toFixed(4)),
      thetaGraus: THETA_GRAUS,
      alturaCilindro: Number(alturaCilindro.toFixed(4)),
      raio: RAIO_CILINDRO,
      uvAlturaUtil: uvAlturaUtil
    });
  }

  function ehTourCilindrico(pais) {
    return !!(pais && (pais.tipoTour === "cilindrico" || pais.tipoTour === "panorama"));
  }

  function ehTourModelo3d(pais) {
    return !!(pais && pais.tipoTour === "modelo3d" && pais.arquivoModelo);
  }

  function precarregarModelo(caminho) {
    return fetch(caminhoComVersao(caminho), { method: "GET", cache: "force-cache" }).then(
      function (resposta) {
        if (!resposta.ok) {
          throw new Error("Falha ao carregar modelo: " + caminho + " (" + resposta.status + ")");
        }
        return caminho;
      }
    );
  }

  /**
   * Centraliza e escala o GLB para caber na cena (modelos vêm com escalas diferentes).
   */
  function enquadrarModelo3d(modeloEl, cameraRig) {
    if (!modeloEl || !modeloEl.object3D || !window.THREE) {
      return;
    }

    var raiz = modeloEl.object3D;
    raiz.updateMatrixWorld(true);

    var box = new THREE.Box3().setFromObject(raiz);
    if (box.isEmpty()) {
      return;
    }

    var size = new THREE.Vector3();
    var center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    var maior = Math.max(size.x, size.y, size.z) || 1;
    var alvo = 2.6;
    var escala = alvo / maior;

    raiz.scale.setScalar(escala);
    raiz.updateMatrixWorld(true);

    box.setFromObject(raiz);
    box.getSize(size);
    box.getCenter(center);

    raiz.position.x += -center.x;
    raiz.position.y += -box.min.y;
    raiz.position.z += -center.z;
    raiz.updateMatrixWorld(true);

    if (cameraRig && cameraRig.object3D) {
      var dist = Math.max(size.x, size.y, size.z) * 1.55 + 1.2;
      var alturaOlho = Math.max(1.2, size.y * 0.45);
      cameraRig.object3D.position.set(0, alturaOlho, dist);
    }

    console.info("[AbrirTour360] enquadramento", {
      size: [Number(size.x.toFixed(2)), Number(size.y.toFixed(2)), Number(size.z.toFixed(2))],
      escala: Number(escala.toFixed(5))
    });
  }

  function aplicarTexturaModelo(modeloEl, caminhoTextura) {
    if (!modeloEl || !caminhoTextura || !window.THREE) {
      return;
    }

    var loader = new THREE.TextureLoader();
    loader.load(
      caminhoComVersao(caminhoTextura),
      function (tex) {
        tex.colorSpace = THREE.SRGBColorSpace || tex.colorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(4, 4);
        modeloEl.object3D.traverse(function (node) {
          if (!node.isMesh || !node.material) {
            return;
          }
          var mats = Array.isArray(node.material) ? node.material : [node.material];
          mats.forEach(function (mat) {
            mat.map = tex;
            mat.needsUpdate = true;
          });
        });
      },
      undefined,
      function (err) {
        console.warn("[AbrirTour360] textura do modelo não aplicada", caminhoTextura, err);
      }
    );
  }

  /**
   * Cena com monumento GLB.
   * Pivot gira; o modelo filho é enquadrado no carregamento.
   */
  function montarCenaModelo3d(pais) {
    var container = document.getElementById("container-cena-360");
    var tituloLimpo = String(pais.pontoTuristico || "").replace(/"/g, "");
    var src = caminhoComVersao(pais.arquivoModelo);

    container.innerHTML =
      '<a-scene id="cena-360" embedded loading-screen="enabled: false" ' +
      'vr-mode-ui="enabled: false" device-orientation-permission-ui="enabled: false" ' +
      'renderer="antialias: true; colorManagement: true" background="color: #141c28">' +
      '  <a-entity light="type: ambient; color: #dfe6f0; intensity: 0.7"></a-entity>' +
      '  <a-entity light="type: directional; color: #ffffff; intensity: 0.95" position="3 5 2"></a-entity>' +
      '  <a-entity light="type: directional; color: #9eb6d4; intensity: 0.35" position="-3 2 -2"></a-entity>' +
      '  <a-entity id="modelo-pivot"' +
      '    animation="property: rotation; to: 0 360 0; loop: true; dur: 48000; easing: linear">' +
      '    <a-entity id="modelo-tour" gltf-model="' +
      src +
      '"></a-entity>' +
      "  </a-entity>" +
      '  <a-plane position="0 0 0" rotation="-90 0 0" width="24" height="24" ' +
      'color="#0d121a" material="shader: flat; opacity: 0.95"></a-plane>' +
      '  <a-entity id="camera-rig-modelo" position="0 1.45 4.8">' +
      '    <a-camera look-controls="reverseMouseDrag: true; magicWindowTrackingEnabled: true" ' +
      'wasd-controls="enabled: false" fov="60"></a-camera>' +
      "  </a-entity>" +
      '  <a-text id="titulo-modelo-tour" value="' +
      tituloLimpo +
      '" position="0 2.8 -1.4" align="center" color="#FFFFFF" width="7"></a-text>' +
      "</a-scene>";

    cenaAtual = document.getElementById("cena-360");
    ligarResize(cenaAtual);

    var modelo = document.getElementById("modelo-tour");
    var cameraRig = document.getElementById("camera-rig-modelo");

    if (modelo) {
      modelo.addEventListener("model-error", function () {
        console.error("[AbrirTour360] falha ao carregar GLB", pais.arquivoModelo);
      });
      modelo.addEventListener("model-loaded", function () {
        enquadrarModelo3d(modelo, cameraRig);
        if (pais.arquivoTexturaModelo) {
          aplicarTexturaModelo(modelo, pais.arquivoTexturaModelo);
        }
        var tituloEl = document.getElementById("titulo-modelo-tour");
        if (tituloEl && cameraRig && cameraRig.object3D) {
          tituloEl.object3D.position.set(
            0,
            cameraRig.object3D.position.y + 1.1,
            cameraRig.object3D.position.z - 5.5
          );
        }
      });
    }

    console.info("[AbrirTour360] modelo3d", {
      modelo: pais.arquivoModelo,
      textura: pais.arquivoTexturaModelo || null
    });
  }

  function abrir(pais) {
    var container = document.getElementById("container-cena-360");
    if (!container || !pais) {
      return;
    }

    fechar();
    atualizarInfo(pais);
    atualizarDica(pais.tipoTour || "sky");

    container.innerHTML =
      '<div class="tour-carregando">Carregando tour de ' +
      pais.pontoTuristico +
      "...</div>";

    if (ehTourModelo3d(pais)) {
      precarregarModelo(pais.arquivoModelo)
        .then(function () {
          montarCenaModelo3d(pais);
        })
        .catch(function (erro) {
          console.error(erro);
          container.innerHTML =
            '<div class="tour-erro">' +
            "<p>Não foi possível carregar o modelo 3D.</p>" +
            "<p>" +
            pais.arquivoModelo +
            "</p>" +
            "</div>";
        });
      return;
    }

    var cilindrico = ehTourCilindrico(pais);

    precarregarImagem(pais.arquivoTour360)
      .then(function (meta) {
        if (cilindrico) {
          montarCenaCilindrica(meta, pais.pontoTuristico);
        } else {
          montarCenaSky(pais.arquivoTour360, pais.pontoTuristico);
        }
      })
      .catch(function (erro) {
        console.error(erro);
        container.innerHTML =
          '<div class="tour-erro">' +
          "<p>Não foi possível carregar o panorama.</p>" +
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
    atualizarDica("sky");
  }

  return {
    abrir: abrir,
    fechar: fechar
  };
})();
