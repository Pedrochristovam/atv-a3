"""
reconhecer_bandeira_opencv.py
API Python + OpenCV para reconhecer as 12 bandeiras de cores vivas.
"""

from __future__ import annotations

import base64
from pathlib import Path

import cv2
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS

APP = Flask(__name__)
CORS(APP)

ROOT = Path(__file__).resolve().parent.parent
BANDEIRAS_DIR = ROOT / "assets" / "bandeiras"

BANDEIRAS = {
    "brasil": "brasil.png",
    "alemanha": "alemanha.png",
    "espanha": "espanha.png",
    "portugal": "portugal.png",
    "china": "china.png",
    "colombia": "colombia.png",
    "africa-do-sul": "africa-do-sul.png",
    "jamaica": "jamaica.png",
    "suecia": "suecia.png",
    "vietnam": "vietnam.png",
    "gana": "gana.png",
    "armenia": "armenia.png",
}

modelos: dict[str, dict] = {}


def carregar_modelos() -> None:
    orb = cv2.ORB_create(nfeatures=800)
    for pais_id, arquivo in BANDEIRAS.items():
        caminho = BANDEIRAS_DIR / arquivo
        img = cv2.imread(str(caminho), cv2.IMREAD_COLOR)
        if img is None:
            print(f"[aviso] não carregou {caminho}")
            continue
        img = cv2.resize(img, (320, 210), interpolation=cv2.INTER_AREA)
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        hist = cv2.calcHist([hsv], [0, 1], None, [30, 32], [0, 180, 0, 256])
        cv2.normalize(hist, hist, 0, 1, cv2.NORM_MINMAX)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        kp, des = orb.detectAndCompute(gray, None)
        modelos[pais_id] = {"img": img, "hist": hist, "des": des, "kp": kp}
    print(f"Modelos carregados: {len(modelos)}")


def decode_base64_image(data_url: str) -> np.ndarray | None:
    try:
        if "," in data_url:
            data_url = data_url.split(",", 1)[1]
        raw = base64.b64decode(data_url)
        arr = np.frombuffer(raw, dtype=np.uint8)
        return cv2.imdecode(arr, cv2.IMREAD_COLOR)
    except Exception as exc:  # noqa: BLE001
        print("decode erro:", exc)
        return None


def contraste_ok(img: np.ndarray) -> bool:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return float(gray.var()) > 250.0


def score_hist(img: np.ndarray, hist_modelo: np.ndarray) -> float:
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    hist = cv2.calcHist([hsv], [0, 1], None, [30, 32], [0, 180, 0, 256])
    cv2.normalize(hist, hist, 0, 1, cv2.NORM_MINMAX)
    return float(cv2.compareHist(hist_modelo, hist, cv2.HISTCMP_CORREL))


def score_orb(img: np.ndarray, des_modelo) -> float:
    if des_modelo is None:
        return 0.0
    orb = cv2.ORB_create(nfeatures=800)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.resize(gray, (320, 210), interpolation=cv2.INTER_AREA)
    _kp, des = orb.detectAndCompute(gray, None)
    if des is None or len(des) < 8:
        return 0.0
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
    matches = bf.knnMatch(des_modelo, des, k=2)
    bons = []
    for par in matches:
        if len(par) < 2:
            continue
        m, n = par
        if m.distance < 0.75 * n.distance:
            bons.append(m)
    return min(1.0, len(bons) / max(12.0, len(des_modelo) * 0.08))


def reconhecer(img: np.ndarray) -> dict | None:
    if img is None or not contraste_ok(img):
        return None

    h, w = img.shape[:2]
    x0, y0 = int(w * 0.18), int(h * 0.22)
    x1, y1 = int(w * 0.82), int(h * 0.78)
    crop = img[y0:y1, x0:x1]
    if crop.size == 0:
        crop = img
    crop = cv2.resize(crop, (320, 210), interpolation=cv2.INTER_AREA)

    ranking = []
    for pais_id, modelo in modelos.items():
        hscore = score_hist(crop, modelo["hist"])
        oscore = score_orb(crop, modelo["des"])
        # Bandeiras chapadas (pouca textura) dependem mais do histograma
        if oscore < 0.05:
            final = hscore
        else:
            final = hscore * 0.65 + oscore * 0.35
        ranking.append((pais_id, final, hscore, oscore))

    ranking.sort(key=lambda t: t[1], reverse=True)
    melhor = ranking[0]
    segundo = ranking[1] if len(ranking) > 1 else ("", 0.0, 0.0, 0.0)

    if melhor[1] < 0.35:
        return None
    if melhor[1] - segundo[1] < 0.035:
        return None

    return {
        "id": melhor[0],
        "confianca": round(float(max(0.0, min(0.99, melhor[1]))), 3),
        "metodo": "python-opencv",
        "detalhe": {
            "hist": round(float(melhor[2]), 3),
            "orb": round(float(melhor[3]), 3),
            "segundo": segundo[0],
            "margem": round(float(melhor[1] - segundo[1]), 3),
        },
    }


@APP.get("/saude")
def saude():
    return jsonify({"ok": True, "modelos": len(modelos)})


@APP.post("/reconhecer")
def api_reconhecer():
    payload = request.get_json(silent=True) or {}
    data_url = payload.get("imagem")
    if not data_url:
        return jsonify({"erro": "campo imagem ausente"}), 400
    img = decode_base64_image(data_url)
    if img is None:
        return jsonify({"erro": "imagem inválida"}), 400
    resultado = reconhecer(img)
    if not resultado:
        return jsonify({"id": None, "confianca": 0, "metodo": "python-opencv"})
    return jsonify(resultado)


if __name__ == "__main__":
    carregar_modelos()
    print("API de reconhecimento em http://127.0.0.1:5055")
    APP.run(host="127.0.0.1", port=5055, debug=False)
