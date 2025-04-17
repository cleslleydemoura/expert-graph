//          VIS.DATASET
// É uma estrutura de dados reativa que permite adicionar, remover, atualizar e buscar dados de forma eficiente.
// Ela é usada em vis.js para manter os nós (nodes) e as arestas (edges) sincronizados com a visualização do grafo.

let nodes = new vis.DataSet([]);
let edges = new vis.DataSet([]);

const container = document.getElementById("mynetwork");

const data = {
  nodes: nodes,
  edges: edges,
};

const options = {
  interaction: { dragNodes: true },
  physics: {
    enabled: false,
    stabilization: true,
  },
};

const network = new vis.Network(container, data, options);
let proximoNoId = 1; // ID inicial do primeiro node
let arestaSelecion = []; // Armazena os dois nós selecionados para criar uma aresta

network.on("click", function (params) {
  if (ferramentaSelecionada === "Vértice" && params.pointer) {
    const { x, y } = params.pointer.canvas;

    nodes.add({
      // Definições e estilização
      id: proximoNoId,
      label: `Node ${proximoNoId}`,
      x: x,
      y: y,
      shape: "dot",
      size: 25,
      color: {
        background: "#6e7d7e",
        border: "#333",
        highlight: {
          background: "#6e7d7e",
          border: "#333",
        },
        hover: {
          background: "#6e7d7e",
          border: "#333",
        },
      },
      font: {
        color: "#333",
        face: "Work Sans",
        size: 16,
        bold: {
          color: "#000",
          size: 18,
        },
      },
    });

    proximoNoId++;

    // Após o item da items-bar for utlizado no grafo, ele deixa de estar selecionado.
    document.querySelectorAll(".menu-item").forEach((item) => {
      item.addEventListener("click", () => {
        const isSelected = item.classList.contains("selected");
    
        if (!isSelected) {
          document.querySelectorAll(".menu-item").forEach((i) => i.classList.remove("selected"));
          item.classList.add("selected");
    
          const tooltip = item.querySelector(".tooltip");
          ferramentaSelecionada = tooltip ? tooltip.textContent.trim() : null;
        } else {
          item.classList.remove("selected");
        }
    
        // Aqui, a ferramenta é ativada automaticamente ao ser selecionada
        console.log(ferramentaSelecionada); // Para verificar o valor de ferramentaSelecionada
      });
    });    
    // console.log("Testeeee",options)
    // console.log("Testeeee",container)
  }
});

// Adiciona arestas quando DOIS nós são clicados
network.on("selectNode", function (params) {
  if (ferramentaSelecionada === "Aresta") {
    const nodeId = params.nodes[0];
    arestaSelecion.push(nodeId);

    if (arestaSelecion.length === 2) {
      const [from, to] = arestaSelecion;
      edges.add({ from, to });

      arestaSelecion = [];
      // Limpa a seleção visual
      document
      .querySelectorAll(".menu-item")
      .forEach((i) => i.classList.remove("selected"));
      ferramentaSelecionada = null;
      const positions = network.getPositions()
      console.log("Teste",positions);
      for (const e in positions){
        console.log(`Node ${e}:`,network.getConnectedNodes(e))
        const teste = network.getConnectedNodes(e)
        let ValorMaisPerto;
        teste.map((e) => {
          console.log("Position:",network.getPosition(e))
          if(ValorMaisPerto == undefined){
            ValorMaisPerto = network.getPosition(e)
            console.log(ValorMaisPerto,"teste")
          }
          if (e.x < ValorMaisPerto){
            ValorMaisPerto = network.getPosition(e)
            console.log(e, "mais perto")
          }
        })
        // const valorAtual = {x:20 ,y:120}
        // const ValorLonge = {x:20, y:120}
        // const ValorPerto = {x:20, y:120}
        // //Algoritmo para manipular o ValorAtual
      }
    }
  }
});
