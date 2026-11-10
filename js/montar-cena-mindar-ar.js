/**
 * montar-cena-mindar-ar.js
 * Papel no sistema: módulo independente de rastreamento MindAR + A-Frame
 * para a bandeira do Brasil (image tracking, câmera controlada só pelo MindAR).
 *
 * Pré-requisitos (integração futura em index.html):
 *   - A-Frame 1.5.0
 *   - mind-ar@1.2.5 / mindar-image-aframe.prod.js
 *
 * No MindAR 1.2.5 (image tracking), a câmera é aberta com facingMode: "environment"
 * (traseira). Este módulo NÃO inicia getUserMedia por conta própria; apenas observa
 * temporariamente navigator.mediaDevices.getUserMedia durante a sessão para encerrar
 * streams que cheguem após cancelamento (Promise tardia da lib).
 *
 * Estados internos:
 *   - inativo        → sem sessão
 *   - inicializando  → cena montada; aguardando arReady / câmera / target
 *   - pronto         → arReady recebido; tracking ativo
 *   - encerrando     → teardown em andamento
 *
 * estaAtivo():
 *   true enquanto a sessão está em "inicializando" ou "pronto"
 *   (há intenção/uso ativo da câmera MindAR). false em "inativo"/"encerrando".
 */

window.MontarCenaMindarAr = (function () {
  var CAMINHO_TARGET = "assets/targets/brasil.mind";
  var CONTAINER_ID = "container-cena-ar";
  var STATUS_ID = "status-deteccao";
  var VIDEO_LEGADO_ID = "video-camera";
  var TIMEOUT_AR_READY_MS = 20000;

  var ESTADO = {
    INATIVO: "inativo",
    INICIALIZANDO: "inicializando",
    PRONTO: "pronto",
    ENCERRANDO: "encerrando"
  };

  var estado = ESTADO.INATIVO;
  /** Incrementado a cada nova sessão ou cancelamento — invalida continuação assíncrona. */
  var geracao = 0;

  var cena = null;
  var alvo = null;
  var bandeiraVisivel = false;
  var videoLegadoDisplayAnterior = null;
  var timeoutReadyId = null;
  var listenersPaginaAtivos = false;
  /** Streams obtidos via getUserMedia durante a sessão Atlas (inclui respostas tardias). */
  var streamsControlados = [];
  var gumOriginal = null;
  var gumProxyAtivo = false;

  var callbacks = {
    onReady: null,
    onError: null,
    onTargetFound: null,
    onTargetLost: null
  };

  var handlers = {
    arReady: null,
    arError: null,
    targetFound: null,
    targetLost: null,
    visibility: null,
    pagehide: null
  };

  function noop() {}

  function container() {
    return document.getElementById(CONTAINER_ID);
  }

  function sessaoEmAndamento() {
    return estado === ESTADO.INICIALIZANDO || estado === ESTADO.PRONTO;
  }

  function atualizarStatus(texto) {
    if (window.UtilitariosInterface && typeof window.UtilitariosInterface.definirTexto === "function") {
      window.UtilitariosInterface.definirTexto(STATUS_ID, texto);
      return;
    }
    var el = document.getElementById(STATUS_ID);
    if (el) {
      el.textContent = texto;
    }
  }

  function emitir(nome, detalhe) {
    var fn = callbacks[nome];
    if (typeof fn === "function") {
      try {
        fn(detalhe || {});
      } catch (erroCallback) {
        console.error("MontarCenaMindarAr callback " + nome + ":", erroCallback);
      }
    }
  }

  function definirCallbacks(opcoes) {
    if (!opcoes) {
      return;
    }
    if (typeof opcoes.onReady === "function") {
      callbacks.onReady = opcoes.onReady;
    }
    if (typeof opcoes.onError === "function") {
      callbacks.onError = opcoes.onError;
    }
    if (typeof opcoes.onTargetFound === "function") {
      callbacks.onTargetFound = opcoes.onTargetFound;
    }
    if (typeof opcoes.onTargetLost === "function") {
      callbacks.onTargetLost = opcoes.onTargetLost;
    }
  }

  function dependenciasOk() {
    if (typeof AFRAME === "undefined") {
      return {
        ok: false,
        codigo: "AFRAME_AUSENTE",
        mensagem: "A-Frame não está carregado. Inclua a versão 1.5.0 antes deste módulo."
      };
    }
    if (!AFRAME.systems || !AFRAME.systems["mindar-image-system"]) {
      return {
        ok: false,
        codigo: "MINDAR_AUSENTE",
        mensagem:
          "MindAR Image Tracking não está carregado. Inclua mind-ar@1.2.5 (mindar-image-aframe.prod.js) após o A-Frame."
      };
    }
    return { ok: true };
  }

  function mensagemErroCamera(erroMindAr) {
    var codigo = erroMindAr && erroMindAr.error ? String(erroMindAr.error) : "DESCONHECIDO";

    if (codigo === "VIDEO_FAIL") {
      return {
        codigo: codigo,
        mensagem:
          "Não foi possível usar a câmera. No iPhone (Safari), permita o acesso à câmera e use HTTPS ou localhost. Prefira a câmera traseira apontada para a bandeira."
      };
    }

    return {
      codigo: codigo,
      mensagem: "Falha ao iniciar o rastreamento AR (" + codigo + ")."
    };
  }

  function ocultarVideoLegado() {
    var video = document.getElementById(VIDEO_LEGADO_ID);
    if (!video) {
      return;
    }
    videoLegadoDisplayAnterior = video.style.display;
    video.style.display = "none";
  }

  function restaurarVideoLegado() {
    var video = document.getElementById(VIDEO_LEGADO_ID);
    if (!video) {
      return;
    }
    video.style.display =
      videoLegadoDisplayAnterior === null || videoLegadoDisplayAnterior === undefined
        ? ""
        : videoLegadoDisplayAnterior;
    videoLegadoDisplayAnterior = null;
  }

  function htmlCena() {
    return [
      '<a-scene id="cena-mindar-ar"',
      '  embedded',
      '  vr-mode-ui="enabled: false"',
      '  device-orientation-permission-ui="enabled: false"',
      '  loading-screen="enabled: false"',
      '  renderer="colorManagement: true; antialias: true"',
      '  mindar-image="imageTargetSrc: ' +
        CAMINHO_TARGET +
        "; maxTrack: 1; autoStart: true; uiLoading: yes; uiScanning: yes; uiError: yes\"",
      ">",
      '  <a-camera id="camera-mindar-ar"',
      '    position="0 0 0"',
      '    look-controls="enabled: false"',
      '    wasd-controls="enabled: false"',
      "  ></a-camera>",
      "",
      '  <a-entity id="alvo-brasil-mindar" mindar-image-target="targetIndex: 0">',
      '    <a-entity id="objeto-brasil-mindar" position="0 0.35 0">',
      '      <a-box',
      '        width="0.35" height="0.35" depth="0.35"',
      '        position="0 0.2 0"',
      '        color="#009c3b"',
      '        animation="property: rotation; to: 0 360 0; loop: true; dur: 5000; easing: linear"',
      "      ></a-box>",
      '      <a-sphere',
      '        radius="0.1"',
      '        position="0 0.55 0"',
      '        color="#ffdf00"',
      '        animation="property: position; to: 0 0.62 0; dir: alternate; loop: true; dur: 1200; easing: easeInOutSine"',
      "      ></a-sphere>",
      '      <a-cylinder',
      '        radius="0.04" height="0.55"',
      '        position="0 -0.05 0"',
      '        color="#002776"',
      "      ></a-cylinder>",
      '      <a-text',
      '        value="Brasil"',
      '        align="center"',
      '        color="#ffffff"',
      '        width="2.4"',
      '        position="0 0.85 0"',
      "      ></a-text>",
      "    </a-entity>",
      "  </a-entity>",
      "</a-scene>"
    ].join("\n");
  }

  function obterSistemaMindAr() {
    if (!cena || !cena.systems) {
      return null;
    }
    return cena.systems["mindar-image-system"] || null;
  }

  function pararTracksDoStream(stream) {
    if (!stream || typeof stream.getTracks !== "function") {
      return;
    }
    stream.getTracks().forEach(function (track) {
      try {
        track.stop();
      } catch (eTrack) {}
    });
  }

  function registrarStreamControlado(stream) {
    if (!stream) {
      return;
    }
    if (streamsControlados.indexOf(stream) === -1) {
      streamsControlados.push(stream);
    }
  }

  function liberarStreamsControlados() {
    var lista = streamsControlados.slice();
    streamsControlados = [];
    lista.forEach(function (stream) {
      pararTracksDoStream(stream);
    });
  }

  /**
   * MindAR 1.2.5 (_startVideo) chama getUserMedia e, no then, faz:
   *   this.video.srcObject = stream
   * Se a sessão Atlas já encerrou e zerou this.video, o stream chega órfão.
   *
   * Mitigação (sem alterar a lib): durante a sessão, envolve getUserMedia.
   * Ao resolver, se a geração do pedido não for mais a vigente / sessão inativa,
   * as tracks são paradas e a Promise é rejeitada (MindAR cai no catch VIDEO_FAIL).
   */
  function ativarProxyGetUserMedia() {
    if (gumProxyAtivo) {
      return;
    }
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") {
      return;
    }

    gumOriginal = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    gumProxyAtivo = true;

    navigator.mediaDevices.getUserMedia = function (constraints) {
      var geracaoNoPedido = geracao;

      return gumOriginal(constraints).then(function (stream) {
        // Sessão cancelada/trocada enquanto a permissão estava pendente.
        if (geracaoNoPedido !== geracao || !sessaoEmAndamento()) {
          pararTracksDoStream(stream);
          return Promise.reject(
            new DOMException(
              "Sessão MindAR Atlas cancelada antes da liberação da câmera.",
              "AbortError"
            )
          );
        }

        registrarStreamControlado(stream);
        return stream;
      });
    };
  }

  function desativarProxyGetUserMedia() {
    if (!gumProxyAtivo) {
      gumOriginal = null;
      return;
    }

    try {
      if (navigator.mediaDevices && gumOriginal) {
        navigator.mediaDevices.getUserMedia = gumOriginal;
      }
    } catch (eRestore) {}

    gumOriginal = null;
    gumProxyAtivo = false;
  }

  /**
   * MindAR 1.2.5 stop() assume video.srcObject e controller existentes e quebra
   * se a câmera ainda não iniciou. Também é chamado de novo em mindar-image.remove().
   *
   * Estratégia: liberar mídia/controller com segurança UMA vez e substituir stop/pause
   * por no-ops idempotentes antes de remover o DOM.
   */
  function encerrarMindArComSeguranca(sistema) {
    if (!sistema) {
      return;
    }

    if (sistema.__atlasEncerrado) {
      sistema.stop = noop;
      sistema.pause = noop;
      return;
    }

    try {
      if (sistema.controller && typeof sistema.controller.stopProcessVideo === "function") {
        try {
          sistema.controller.stopProcessVideo();
        } catch (ePauseProc) {}
      }
    } catch (eControllerPause) {}

    try {
      var video = sistema.video;
      if (video) {
        try {
          if (video.srcObject && typeof video.srcObject.getTracks === "function") {
            video.srcObject.getTracks().forEach(function (track) {
              try {
                track.stop();
              } catch (eTrack) {}
            });
          }
        } catch (eTracks) {}

        try {
          video.pause();
        } catch (ePause) {}

        try {
          video.srcObject = null;
        } catch (eSrc) {}

        try {
          if (video.parentNode) {
            video.parentNode.removeChild(video);
          }
        } catch (eRemove) {}
      }
    } catch (eVideo) {}

    try {
      if (sistema.controller && typeof sistema.controller.dispose === "function") {
        sistema.controller.dispose();
      }
    } catch (eDispose) {}

    sistema.video = null;
    sistema.controller = null;
    sistema.__atlasEncerrado = true;

    // Evita o segundo stop() perigoso disparado por mindar-image.remove().
    sistema.stop = noop;
    sistema.pause = noop;
  }

  function limparTimeoutReady() {
    if (timeoutReadyId !== null) {
      clearTimeout(timeoutReadyId);
      timeoutReadyId = null;
    }
  }

  function desligarListenersCena() {
    if (cena && handlers.arReady) {
      cena.removeEventListener("arReady", handlers.arReady);
    }
    if (cena && handlers.arError) {
      cena.removeEventListener("arError", handlers.arError);
    }
    if (alvo && handlers.targetFound) {
      alvo.removeEventListener("targetFound", handlers.targetFound);
    }
    if (alvo && handlers.targetLost) {
      alvo.removeEventListener("targetLost", handlers.targetLost);
    }

    handlers.arReady = null;
    handlers.arError = null;
    handlers.targetFound = null;
    handlers.targetLost = null;
  }

  function desligarListenersPagina() {
    if (!listenersPaginaAtivos) {
      handlers.visibility = null;
      handlers.pagehide = null;
      return;
    }

    if (handlers.visibility) {
      document.removeEventListener("visibilitychange", handlers.visibility);
    }
    if (handlers.pagehide) {
      window.removeEventListener("pagehide", handlers.pagehide);
    }

    handlers.visibility = null;
    handlers.pagehide = null;
    listenersPaginaAtivos = false;
  }

  function limparContainer() {
    var el = container();
    if (el) {
      el.innerHTML = "";
    }
  }

  /**
   * Encerra qualquer sessão/início em andamento.
   * Sempre incrementa geracao para invalidar callbacks assíncronos atrasados.
   */
  function encerrarSessao(opcoes) {
    opcoes = opcoes || {};

    if (estado === ESTADO.ENCERRANDO) {
      return;
    }

    if (estado === ESTADO.INATIVO && !cena) {
      geracao += 1;
      limparTimeoutReady();
      liberarStreamsControlados();
      desativarProxyGetUserMedia();
      desligarListenersPagina();
      return;
    }

    estado = ESTADO.ENCERRANDO;
    geracao += 1;

    limparTimeoutReady();
    desligarListenersCena();
    desligarListenersPagina();

    // Incremento de geracao acima faz o proxy rejeitar/parar streams tardios.
    liberarStreamsControlados();
    encerrarMindArComSeguranca(obterSistemaMindAr());
    limparContainer();
    desativarProxyGetUserMedia();

    cena = null;
    alvo = null;
    bandeiraVisivel = false;
    estado = ESTADO.INATIVO;

    if (opcoes.restaurarVideo !== false) {
      restaurarVideoLegado();
    }

    if (opcoes.status) {
      atualizarStatus(opcoes.status);
    }
  }

  function aoSairDePrimeiroPlano() {
    if (!sessaoEmAndamento()) {
      return;
    }

    encerrarSessao({
      status:
        "Sessão AR encerrada ao sair do aplicativo. Toque em Escanear novamente para reiniciar."
    });
  }

  function ligarListenersPagina() {
    if (listenersPaginaAtivos) {
      return;
    }

    handlers.visibility = function () {
      if (document.hidden) {
        aoSairDePrimeiroPlano();
      }
      // Retornar ao primeiro plano NÃO reinicia a câmera automaticamente.
    };

    handlers.pagehide = function () {
      aoSairDePrimeiroPlano();
    };

    document.addEventListener("visibilitychange", handlers.visibility);
    window.addEventListener("pagehide", handlers.pagehide);
    listenersPaginaAtivos = true;
  }

  function ligarListenersCena(geracaoSessao) {
    handlers.arReady = function () {
      if (geracaoSessao !== geracao) {
        return;
      }
      if (estado !== ESTADO.INICIALIZANDO) {
        return;
      }

      limparTimeoutReady();
      estado = ESTADO.PRONTO;
      atualizarStatus("Aponte a câmera traseira para a bandeira do Brasil.");
      emitir("onReady", { target: CAMINHO_TARGET });
    };

    handlers.arError = function (evento) {
      if (geracaoSessao !== geracao) {
        return;
      }
      if (estado !== ESTADO.INICIALIZANDO && estado !== ESTADO.PRONTO) {
        return;
      }

      var info = mensagemErroCamera(evento && evento.detail);
      emitir("onError", info);
      encerrarSessao({ status: info.mensagem });
    };

    handlers.targetFound = function () {
      if (geracaoSessao !== geracao) {
        return;
      }
      if (estado !== ESTADO.PRONTO) {
        return;
      }

      bandeiraVisivel = true;
      atualizarStatus("Bandeira do Brasil detectada.");
      emitir("onTargetFound", { paisId: "brasil", targetIndex: 0 });
    };

    handlers.targetLost = function () {
      if (geracaoSessao !== geracao) {
        return;
      }
      if (estado !== ESTADO.PRONTO) {
        return;
      }

      bandeiraVisivel = false;
      atualizarStatus("Bandeira perdida. Centralize a bandeira do Brasil novamente.");
      emitir("onTargetLost", { paisId: "brasil", targetIndex: 0 });
    };

    cena.addEventListener("arReady", handlers.arReady);
    cena.addEventListener("arError", handlers.arError);
    alvo.addEventListener("targetFound", handlers.targetFound);
    alvo.addEventListener("targetLost", handlers.targetLost);
  }

  function agendarTimeoutReady(geracaoSessao) {
    limparTimeoutReady();
    timeoutReadyId = setTimeout(function () {
      timeoutReadyId = null;
      if (geracaoSessao !== geracao) {
        return;
      }
      if (estado !== ESTADO.INICIALIZANDO) {
        return;
      }

      var info = {
        codigo: "TIMEOUT_PRONTO",
        mensagem:
          "Tempo esgotado ao iniciar o AR. Verifique a permissão da câmera, a conexão e se assets/targets/brasil.mind está acessível."
      };
      emitir("onError", info);
      encerrarSessao({ status: info.mensagem });
    }, TIMEOUT_AR_READY_MS);
  }

  /**
   * Inicia a cena MindAR. Não chama getUserMedia manualmente —
   * a câmera traseira (environment) é aberta pelo próprio MindAR 1.2.5.
   * O carregamento de brasil.mind fica a cargo do MindAR (sem fetch prévio duplicado).
   */
  function iniciar(opcoes) {
    if (estado === ESTADO.ENCERRANDO) {
      return Promise.resolve({
        ok: false,
        codigo: "ENCERRANDO",
        mensagem: "Aguarde o encerramento da sessão anterior."
      });
    }

    if (estado === ESTADO.INICIALIZANDO) {
      return Promise.resolve({
        ok: false,
        codigo: "JA_INICIANDO",
        mensagem: "A cena MindAR já está sendo iniciada."
      });
    }

    if (estado === ESTADO.PRONTO) {
      return Promise.resolve({
        ok: false,
        codigo: "JA_ATIVO",
        mensagem: "A cena MindAR já está ativa. Chame parar() ou destruir() antes de iniciar de novo."
      });
    }

    definirCallbacks(opcoes || {});

    var deps = dependenciasOk();
    if (!deps.ok) {
      atualizarStatus(deps.mensagem);
      emitir("onError", deps);
      return Promise.resolve(deps);
    }

    var el = container();
    if (!el) {
      var semContainer = {
        ok: false,
        codigo: "CONTAINER_AUSENTE",
        mensagem: "Container #" + CONTAINER_ID + " não encontrado no HTML."
      };
      atualizarStatus(semContainer.mensagem);
      emitir("onError", semContainer);
      return Promise.resolve(semContainer);
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      var semMedia = {
        ok: false,
        codigo: "CAMERA_INDISPONIVEL",
        mensagem:
          "Este navegador não oferece acesso à câmera. No iPhone, use o Safari atualizado em HTTPS."
      };
      atualizarStatus(semMedia.mensagem);
      emitir("onError", semMedia);
      return Promise.resolve(semMedia);
    }

    geracao += 1;
    var geracaoSessao = geracao;
    estado = ESTADO.INICIALIZANDO;
    bandeiraVisivel = false;
    atualizarStatus("Preparando rastreamento MindAR (câmera traseira)...");

    // Proxy antes de montar a cena: o MindAR pede a câmera no renderstart.
    ativarProxyGetUserMedia();

    try {
      ocultarVideoLegado();
      el.innerHTML = htmlCena();

      cena = document.getElementById("cena-mindar-ar");
      alvo = document.getElementById("alvo-brasil-mindar");

      if (!cena || !alvo) {
        throw {
          codigo: "CENA_INVALIDA",
          mensagem: "Falha ao montar a cena A-Frame / MindAR no DOM."
        };
      }

      // Se parar() rodou durante a montagem síncrona (improvável, mas seguro):
      if (geracaoSessao !== geracao) {
        liberarStreamsControlados();
        encerrarMindArComSeguranca(obterSistemaMindAr());
        limparContainer();
        desativarProxyGetUserMedia();
        cena = null;
        alvo = null;
        estado = ESTADO.INATIVO;
        restaurarVideoLegado();
        return Promise.resolve({
          ok: false,
          codigo: "CANCELADO",
          mensagem: "Inicialização MindAR cancelada."
        });
      }

      ligarListenersCena(geracaoSessao);
      ligarListenersPagina();
      agendarTimeoutReady(geracaoSessao);
      atualizarStatus("Solicitando câmera traseira e carregando target...");

      return Promise.resolve({
        ok: true,
        codigo: "INICIADO",
        mensagem: "Cena MindAR iniciada. Aguardando câmera e target (arReady)."
      });
    } catch (erro) {
      var info =
        erro && erro.codigo
          ? erro
          : {
              codigo: "CENA_INVALIDA",
              mensagem: "Falha ao montar a cena MindAR."
            };

      emitir("onError", info);
      encerrarSessao({ status: info.mensagem });
      return Promise.resolve({ ok: false, codigo: info.codigo, mensagem: info.mensagem });
    }
  }

  /**
   * Cancela inicialização em andamento ou encerra sessão pronta.
   * Pode ser chamado várias vezes com segurança.
   */
  function parar() {
    if (estado === ESTADO.INATIVO && !cena) {
      geracao += 1;
      limparTimeoutReady();
      liberarStreamsControlados();
      desativarProxyGetUserMedia();
      return;
    }

    encerrarSessao({
      status: "Rastreamento MindAR encerrado."
    });
  }

  /**
   * Remove a cena do DOM e libera recursos (câmera, listeners, WebGL).
   * Equivalente seguro a parar() nesta versão do módulo.
   */
  function destruir() {
    parar();
  }

  return {
    iniciar: iniciar,
    parar: parar,
    destruir: destruir,
    definirCallbacks: definirCallbacks,
    /**
     * true se há sessão em "inicializando" ou "pronto".
     * false se "inativo" ou "encerrando".
     */
    estaAtivo: function () {
      return sessaoEmAndamento();
    },
    bandeiraEstaVisivel: function () {
      return !!bandeiraVisivel;
    },
    obterCaminhoTarget: function () {
      return CAMINHO_TARGET;
    },
    /** Exposto só para diagnóstico; não faz parte do contrato mínimo. */
    obterEstado: function () {
      return estado;
    }
  };
})();
