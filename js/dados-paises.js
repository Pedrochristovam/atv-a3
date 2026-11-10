/**
 * dados-paises.js
 * Papel no sistema: catálogo dos 12 países (bandeiras com cores vivas, sem fundo branco dominante).
 */

window.DADOS_PAISES = [
  {
    id: "brasil",
    nome: "Brasil",
    capital: "Brasília",
    codigoBandeira: "br",
    arquivoBandeira: "assets/bandeiras/brasil.png",
    pontoTuristico: "Cristo Redentor",
    cidade: "Rio de Janeiro",
    descricao: "Monumento no Corcovado, um dos símbolos mais reconhecidos do Brasil.",
    arquivoTour360: "assets/tours-360/brasil-cristo.jpg",
    corDestaque: "#009c3b"
  },
  {
    id: "alemanha",
    nome: "Alemanha",
    capital: "Berlim",
    codigoBandeira: "de",
    arquivoBandeira: "assets/bandeiras/alemanha.png",
    pontoTuristico: "Portão de Brandemburgo",
    cidade: "Berlim",
    descricao: "Monumento neoclássico e marco histórico da capital alemã.",
    arquivoTour360: "assets/tours-360/alemanha-brandemburgo.jpg",
    corDestaque: "#dd0000"
  },
  {
    id: "espanha",
    nome: "Espanha",
    capital: "Madri",
    codigoBandeira: "es",
    arquivoBandeira: "assets/bandeiras/espanha.png",
    pontoTuristico: "Sagrada Família",
    cidade: "Barcelona",
    descricao: "Basílica de Gaudí, ícone de Barcelona.",
    arquivoTour360: "assets/tours-360/espanha-sagrada.jpg",
    corDestaque: "#aa151b"
  },
  {
    id: "portugal",
    nome: "Portugal",
    capital: "Lisboa",
    codigoBandeira: "pt",
    arquivoBandeira: "assets/bandeiras/portugal.png",
    pontoTuristico: "Torre de Belém",
    cidade: "Lisboa",
    descricao: "Torre manuelina à beira do Tejo, patrimônio da UNESCO.",
    arquivoTour360: "assets/tours-360/portugal-belem.jpg",
    corDestaque: "#006600"
  },
  {
    id: "china",
    nome: "China",
    capital: "Pequim",
    codigoBandeira: "cn",
    arquivoBandeira: "assets/bandeiras/china.png",
    pontoTuristico: "Grande Muralha",
    cidade: "Pequim (região)",
    descricao: "Fortificação histórica que atravessa o norte da China.",
    arquivoTour360: "assets/tours-360/china-muralha.jpg",
    corDestaque: "#de2910"
  },
  {
    id: "colombia",
    nome: "Colômbia",
    capital: "Bogotá",
    codigoBandeira: "co",
    arquivoBandeira: "assets/bandeiras/colombia.png",
    pontoTuristico: "Cidade amuralhada de Cartagena",
    cidade: "Cartagena",
    descricao: "Centro histórico colonial colorido à beira do Caribe.",
    arquivoTour360: "assets/tours-360/colombia-cartagena.jpg",
    corDestaque: "#fcd116"
  },
  {
    id: "africa-do-sul",
    nome: "África do Sul",
    capital: "Pretória",
    codigoBandeira: "za",
    arquivoBandeira: "assets/bandeiras/africa-do-sul.png",
    pontoTuristico: "Montanha da Mesa",
    cidade: "Cidade do Cabo",
    descricao: "Montanha icônica com vista para a Cidade do Cabo.",
    arquivoTour360: "assets/tours-360/africa-do-sul-mesa.jpg",
    corDestaque: "#007a4d"
  },
  {
    id: "jamaica",
    nome: "Jamaica",
    capital: "Kingston",
    codigoBandeira: "jm",
    arquivoBandeira: "assets/bandeiras/jamaica.png",
    pontoTuristico: "Cataratas de Dunn's River",
    cidade: "Ocho Rios",
    descricao: "Quedas d'água em terraços de calcário, clássico do turismo jamaicano.",
    arquivoTour360: "assets/tours-360/jamaica-dunn.jpg",
    corDestaque: "#009b3a"
  },
  {
    id: "suecia",
    nome: "Suécia",
    capital: "Estocolmo",
    codigoBandeira: "se",
    arquivoBandeira: "assets/bandeiras/suecia.png",
    pontoTuristico: "Gamla Stan",
    cidade: "Estocolmo",
    descricao: "Cidade antiga de Estocolmo, com praças e ruas históricas.",
    arquivoTour360: "assets/tours-360/suecia-gamla.jpg",
    corDestaque: "#006aa7"
  },
  {
    id: "vietnam",
    nome: "Vietnã",
    capital: "Hanói",
    codigoBandeira: "vn",
    arquivoBandeira: "assets/bandeiras/vietnam.png",
    pontoTuristico: "Baía de Ha Long",
    cidade: "Quảng Ninh",
    descricao: "Baía com milhares de ilhotas de calcário, patrimônio mundial.",
    arquivoTour360: "assets/tours-360/vietnam-halong.jpg",
    corDestaque: "#da251d"
  },
  {
    id: "gana",
    nome: "Gana",
    capital: "Acra",
    codigoBandeira: "gh",
    arquivoBandeira: "assets/bandeiras/gana.png",
    pontoTuristico: "Independence Arch",
    cidade: "Acra",
    descricao: "Arco da Independência, marco da capital de Gana.",
    arquivoTour360: "assets/tours-360/gana-arco.jpg",
    corDestaque: "#006b3f"
  },
  {
    id: "armenia",
    nome: "Armênia",
    capital: "Yerevan",
    codigoBandeira: "am",
    arquivoBandeira: "assets/bandeiras/armenia.png",
    pontoTuristico: "Praça da República",
    cidade: "Yerevan",
    descricao: "Centro monumental da capital armênia, com arquitetura rosada típica.",
    arquivoTour360: "assets/tours-360/armenia-yerevan.jpg",
    corDestaque: "#d90012"
  }
];

window.buscarPaisPorId = function (id) {
  return window.DADOS_PAISES.find(function (pais) {
    return pais.id === id;
  });
};
