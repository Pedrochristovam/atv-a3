/**
 * consultar-reconhecimento-python.js
 * Papel no sistema: envia a captura para a API Python+OpenCV (mais precisa).
 * Se o servidor não estiver ligado, devolve null e o JS local assume.
 */

window.ConsultarReconhecimentoPython = (function () {
  var URL_API = "http://127.0.0.1:5055/reconhecer";
  var URL_SAUDE = "http://127.0.0.1:5055/saude";
  var servidorDisponivel = null;
  var ultimoCheck = 0;

  function canvasParaDataUrl(canvas) {
    return canvas.toDataURL("image/jpeg", 0.92);
  }

  function verificarSaude() {
    var agora = Date.now();
    if (servidorDisponivel !== null && agora - ultimoCheck < 15000) {
      return Promise.resolve(servidorDisponivel);
    }

    ultimoCheck = agora;
    return fetch(URL_SAUDE, { method: "GET" })
      .then(function (res) {
        servidorDisponivel = res.ok;
        return servidorDisponivel;
      })
      .catch(function () {
        servidorDisponivel = false;
        return false;
      });
  }

  function reconhecerCanvas(canvas) {
    return verificarSaude().then(function (ok) {
      if (!ok) {
        return null;
      }

      return fetch(URL_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagem: canvasParaDataUrl(canvas) })
      })
        .then(function (res) {
          if (!res.ok) {
            return null;
          }
          return res.json();
        })
        .then(function (json) {
          if (!json || !json.id) {
            return null;
          }
          return {
            id: json.id,
            confianca: json.confianca || 0,
            metodo: json.metodo || "python-opencv",
            detalhe: json.detalhe
          };
        })
        .catch(function () {
          servidorDisponivel = false;
          return null;
        });
    });
  }

  return {
    reconhecerCanvas: reconhecerCanvas,
    verificarSaude: verificarSaude
  };
})();
