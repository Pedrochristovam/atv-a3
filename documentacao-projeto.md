# Documentação do Projeto — Atlas AR (Bandeiras → Tour 360°)

Diário técnico contínuo. Use este arquivo como base do relatório final da disciplina.

## 1. Ideia do software

Sempre que a câmera identifica a **imagem de uma bandeira** (na tela ou impressa), o sistema mostra informações em **Realidade Aumentada** (sobreposição na câmera) e oferece a opção de visitar o **principal ponto turístico** em **imagem 360°** (experiência de Realidade Virtual no navegador).

**Prioridade do trabalho:** demo funcionando (faculdade).

## 2. Escopo do MVP

- 12 países mais conhecidos
- Reconhecimento pela imagem da bandeira
- Card AR com nome, capital e botão “Visitar”
- Tour 360° do ponto turístico (navegação com mouse / giroscópio)
- Modo álbum (clique na bandeira) como fallback garantido na apresentação

## 3. Países e destinos

Catálogo atual: **bandeiras de cores vivas** (sem predominância de branco), para melhorar o reconhecimento.

| País | Ponto turístico |
|------|-----------------|
| Brasil | Cristo Redentor |
| Alemanha | Portão de Brandemburgo |
| Espanha | Sagrada Família |
| Portugal | Torre de Belém |
| China | Grande Muralha |
| Colômbia | Cartagena |
| África do Sul | Montanha da Mesa |
| Jamaica | Dunn's River Falls |
| Suécia | Gamla Stan |
| Vietnã | Baía de Ha Long |
| Gana | Independence Arch |
| Armênia | Praça da República |

## 4. Estrutura de arquivos (nome = papel no sistema)

| Arquivo | O que faz no sistema |
|---------|----------------------|
| `index.html` | Página principal: une interface, câmera, AR e tour 360 |
| `css/estilos-interface.css` | Visual da aplicação (telas, álbum, card, tour) |
| `js/dados-paises.js` | Catálogo dos 12 países, bandeiras e destinos |
| `js/iniciar-aplicacao.js` | Ponto de entrada: liga módulos e estado inicial |
| `js/controlar-navegacao.js` | Troca entre telas (início, álbum, câmera, tour) |
| `js/iniciar-camera-ar.js` | Abre a webcam e o loop de captura |
| `js/reconhecer-bandeira.js` | Compara o frame/foto com as bandeiras (cores normalizadas) |
| `js/reconhecer-bandeira-opencv.js` | Reforço com OpenCV.js (template matching) |
| `js/montar-cena-ar-aframe.js` | **AR de verdade:** cena A-Frame (`a-scene`, `a-plane`, `a-text`, `a-box`...) sobre a câmera |
| `js/mostrar-card-pais-ar.js` | Decide quando mostrar o painel AR 3D do país detectado |
| `js/abrir-tour-360.js` | **VR:** cena A-Frame 360° do destino (`a-sky`, `a-camera`) |
| `js/utilitarios-interface.js` | Funções auxiliares de UI |
| `documentacao-projeto.md` | Este diário técnico |
| `assets/bandeiras/` | Imagens PNG das bandeiras |
| `assets/tours-360/` | Panoramas equiretangulares dos destinos |
| `assets/targets/` | Reservado para alvos MindAR (evolução futura) |

## 5. Bibliotecas e recursos utilizados

Registro atualizado conforme o desenvolvimento.

| Biblioteca / recurso | Versão / origem | Para que serve neste projeto |
|----------------------|-----------------|------------------------------|
| **A-Frame** | CDN 1.5.0 | Cena WebVR/WebXR: esfera 360°, câmera e controles de olhar |
| **OpenCV.js** | 4.10.0 (C++ compilado para WebAssembly) | Template matching para reforçar o reconhecimento da bandeira |
| **Google Fonts** | Fraunces + Manrope | Tipografia da interface (marca + texto) |
| **FlagCDN** | flagcdn.com | Download das imagens oficiais das bandeiras (PNG) |
| **JavaScript (ES5/ES6)** | Nativo do navegador | Lógica da aplicação |
| **MediaDevices API** (`getUserMedia`) | Nativo do navegador | Acesso à webcam do notebook |
| **Canvas API** | Nativo do navegador | Análise de pixels / assinatura de cores |

### Por que esta stack?

- Alinhada às aulas (JavaScript + bibliotecas no navegador)
- Não exige instalar backend nem app nativo
- A-Frame já entrega VR 360° com pouco código
- Reconhecimento por assinatura de cores é explicável na defesa (sem “caixa preta” de IA)

### Evolução possível (não obrigatória no MVP)

| Biblioteca | Uso futuro |
|------------|------------|
| **MindAR** | Rastreamento de imagem mais robusto (gera arquivo `.mind`) |
| **AR.js** | Alternativa de marcadores / NFT markers |
| **Three.js** (direto) | Cenas 3D mais customizadas além do A-Frame |

## 6. Como funciona o reconhecimento (resumo para a banca)

1. A webcam captura o vídeo continuamente.
2. A cada intervalo, um frame é desenhado em um `<canvas>` oculto.
3. A região central do frame é dividida em uma grade (ex.: 6×4 células).
4. Em cada célula calcula-se a média de R, G e B → **assinatura visual**.
5. A mesma assinatura foi pré-calculada para cada bandeira do álbum.
6. O país com menor diferença (erro médio) abaixo de um limiar é considerado detectado.
7. O card AR aparece; ao clicar em **Visitar**, abre o tour 360°.

**Dica de demo:** bandeira grande, bem iluminada, de frente para a câmera (celular mostrando a imagem ou impressão).

## 7. Como rodar o projeto

1. Abrir a pasta do projeto em um servidor local (a câmera e alguns recursos exigem contexto seguro `http://localhost` ou `https`).
2. Exemplos:
   - VS Code / Cursor: extensão **Live Server**
   - Ou no terminal: `npx serve .`
3. Abrir no Chrome ou Edge.
4. Permitir acesso à câmera quando o navegador pedir.

### Fluxos na apresentação

- **Modo seguro (sempre funciona):** Início → Álbum → clicar na bandeira → Visitar → tour 360°.
- **Modo AR (câmera):** Início → Escanear → apontar para a bandeira → card → Visitar.

## 8. Histórico de desenvolvimento

### 2026-11-04 — Fundação do projeto

- Definição do tema: bandeiras → AR → tour 360°.
- Escopo: 12 países; prioridade demo funcionando.
- Criação da estrutura de pastas e arquivos com nomes descritivos.
- Catálogo em `dados-paises.js`.
- Interface, reconhecimento por grade de cores, card AR e tour A-Frame.
- Download das bandeiras via FlagCDN (`assets/bandeiras/`).
- Panoramas 360° em `assets/tours-360/` (imagens equiretangulares livres do CDN A-Frame para a demo; podem ser trocadas por fotos reais dos pontos turísticos).
- Arquivo `COMO-RODAR.txt` com instruções rápidas de apresentação.

### Onde entra a Realidade Aumentada (A-Frame)

Antes, o “AR” era só um card HTML. Agora:

| Parte | Tecnologia | Componentes A-Frame |
|-------|------------|---------------------|
| **AR** (escanear bandeira) | Webcam + cena A-Frame transparente | `a-scene`, `a-camera`, `a-entity`, `a-plane`, `a-text`, `a-box`, `a-sphere`, `animation` |
| **VR** (visitar destino) | Tour 360° | `a-scene`, `a-sky`, `a-camera`, `a-text`, `look-controls` |

Arquivo principal da AR: `js/montar-cena-ar-aframe.js`.

Na defesa: “ao reconhecer a bandeira, objetos 3D do A-Frame são sobrepostos à imagem real da câmera — isso é a Realidade Aumentada; ao visitar, entramos em uma cena 360° — Realidade Virtual.”

### 2026-11-04 — Visual branco + OpenCV

- Redesign da interface: fundo predominante branco, tipografia Fraunces/Manrope, estética editorial.
- Álbum com painel de detalhe antes do tour.
- Reconhecimento mais tolerante (normalização de brilho + faixas verticais).
- Integração do **OpenCV.js** (biblioteca C++/WASM) para template matching.
- Novos botões na câmera: **Capturar e analisar** e **Enviar foto** (melhor para webcam fraca de notebook).

### 2026-11-04 — Aperfeiçoamento da demo (sem trocar de linguagem)

Decisão do grupo: **manter JavaScript + A-Frame** (mais seguro para prazo) e reforçar a demo.

Melhorias:
- Faixa de **atalhos de bandeira** na tela da câmera (seleção manual → painel AR A-Frame). Ideal para apresentação se a webcam falhar.
- Reconhecimento com histograma + múltiplos recortes da mira + limiar mais tolerante na captura.
- Botão HTML **Visitar destino 360°** sincronizado com o painel A-Frame (clique confiável).
- Álbum como ação principal na home (caminho sempre estável).

**Roteiro sugerido na banca:**
1. Álbum → país → Visitar → tour 360° (VR)
2. Escanear → tocar bandeira na faixa → painel AR 3D → Visitar (AR → VR)
3. (Opcional) tentar câmera/captura ao vivo

### 2026-11-04 — Reconhecimento reforçado (padrão + Python/OpenCV)

Problema: captura do Brasil era classificada como Japão.

Solução em camadas:
1. `js/classificar-bandeira-por-padrao.js` — regras por cores/faixas (Brasil ≠ Japão).
2. `servidor-reconhecimento/reconhecer_bandeira_opencv.py` — API Python + OpenCV (histograma HSV + ORB).
3. `js/consultar-reconhecimento-python.js` — chama a API; se offline, usa o JS local.

Como ligar a API:
```
cd servidor-reconhecimento
pip install -r requirements.txt
python reconhecer_bandeira_opencv.py
```

### 2026-11-04 — Correção falso positivo (Japão) + responsividade

- Painel AR **não abre sozinho** no vídeo ao vivo (parede clara gerava “Japão”).
- Confirmação só com **Capturar**, **Enviar foto** ou toque na bandeira.
- Botão **Limpar** para resetar a detecção.
- Reconhecimento rejeita frames sem contraste (anti falso-positivo).
- CSS da câmera/álbum/tour ajustado para mobile e desktop.

### 2026-11-04 — Panoramas com fotos reais dos destinos

Substituídos os placeholders genéricos em `assets/tours-360/` por fotos reais
(Wikipedia/Wikimedia Commons e Unsplash), convertidas para 2048×1024.
Créditos em `assets/tours-360/CREDITOS-IMAGENS.txt`.

### 2026-11-04 — Correção do tour VR em branco

Sintoma: tela branca com grade no tour (UI do destino aparecia, panorama não).

Causas:
- Cena A-Frame `embedded` sem tamanho explícito (canvas 0 / transparente).
- Fundo branco da página aparecia por cima do WebGL.

Correção em `abrir-tour-360.js` + CSS de `.tela-tour` (fullscreen escuro, resize forçado, preload da imagem).

### Limitações conhecidas (útil para o relatório)

- Bandeiras com tricolor vertical parecido (ex.: França / Itália) podem se confundir — na demo, preferir bandeiras bem distintas ou usar o álbum.
- Webcam de notebook com pouca luz/nitidez pode falhar no modo ao vivo; nesse caso use **Capturar e analisar** ou **Enviar foto**.
- Os panoramas atuais demonstram o VR 360°; para a versão final, o ideal é trocar por fotos 360 reais de cada destino.

### Como citar as bibliotecas no relatório

1. **A-Frame** — framework web para VR/AR baseado em Three.js; cena com `<a-sky>` (imagem 360°) e controles de olhar.
2. **OpenCV.js** — versão JavaScript/WebAssembly do OpenCV (C++); `matchTemplate` compara a bandeira capturada com os modelos.
3. **MediaDevices.getUserMedia** — API do navegador para capturar a webcam.
4. **Canvas / ImageData** — leitura de pixels para assinatura de cores normalizada.
5. **Google Fonts (Fraunces, Manrope)** — tipografia da interface.
6. **FlagCDN** — origem das imagens PNG das bandeiras nacionais.

---

*Próximas entradas deste diário devem registrar cada biblioteca nova, cada arquivo criado e decisões de escopo.*
