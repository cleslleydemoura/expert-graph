// Certifique-se de que os conjuntos de dados sejam globais e compartilhados
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
let proximoNoId = 1; // ID inicial do primeiro nó
let arestaSelecion = []; // Armazena os dois nós selecionados para criar uma aresta

// Atualiza a matriz de adjacência
function atualizarMatriz() {
  const matrizDiv = document.getElementById("matrizContainer");
  matrizDiv.innerHTML = ""; // Limpa a matriz existente

  const table = document.createElement("table");

  // Cabeçalho da tabela
  const headerRow = document.createElement("tr");
  headerRow.appendChild(document.createElement("th")); // Célula vazia no canto superior esquerdo
  nodes.forEach(node => {
    const th = document.createElement("th");
    const input = document.createElement("input");
    input.type = "text";
    input.value = node.label;
    input.dataset.nodeId = node.id;
    input.addEventListener("input", (event) => {
      const nodeId = parseInt(event.target.dataset.nodeId);
      const novoRotulo = event.target.value;
      nodes.update({ id: nodeId, label: novoRotulo });
    });
    th.appendChild(input);
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  // Linhas da tabela
  nodes.forEach(fromNode => {
    const row = document.createElement("tr");

    // Cabeçalho da linha
    const th = document.createElement("th");
    const input = document.createElement("input");
    input.type = "text";
    input.value = fromNode.label;
    input.dataset.nodeId = fromNode.id;
    input.addEventListener("input", (event) => {
      const nodeId = parseInt(event.target.dataset.nodeId);
      const novoRotulo = event.target.value;
      nodes.update({ id: nodeId, label: novoRotulo });
    });
    th.appendChild(input);
    row.appendChild(th);

    // Células da linha
    nodes.forEach(toNode => {
      const cell = document.createElement("td");
      const input = document.createElement("input");
      input.type = "number";
      const edge = edges.get({
        filter: edge => edge.from === fromNode.id && edge.to === toNode.id,
      });
      input.value = edge.length > 0 ? edge[0].label || "1" : "0";
      input.dataset.from = fromNode.id;
      input.dataset.to = toNode.id;
      input.addEventListener("input", (event) => {
        const from = parseInt(event.target.dataset.from);
        const to = parseInt(event.target.dataset.to);
        const valor = event.target.value;

        // Atualiza ou remove a aresta no grafo
        const existingEdge = edges.get({
          filter: edge => edge.from === from && edge.to === to,
        });
        if (valor > 0) {
          if (existingEdge.length > 0) {
            edges.update({ id: existingEdge[0].id, label: valor });
          } else {
            edges.add({ from, to, label: valor });
          }
        } else if (existingEdge.length > 0) {
          edges.remove(existingEdge[0].id);
        }
      });
      cell.appendChild(input);
      row.appendChild(cell);
    });

    table.appendChild(row);
  });

  matrizDiv.appendChild(table);
}

// Adiciona nós ao clicar
network.on("click", function (params) {
  if (ferramentaSelecionada === "Vértice" && params.pointer) {
    const { x, y } = params.pointer.canvas;

    nodes.add({
      id: proximoNoId,
      label: `V${proximoNoId}`,
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
    atualizarMatriz(); // Atualiza a matriz após adicionar o nó
  } else if (ferramentaSelecionada === "Excluir Nó" && params.nodes.length > 0) {
    // Excluir nó selecionado
    const nodeId = params.nodes[0];
    nodes.remove(nodeId);
    atualizarMatriz(); // Atualiza a matriz após excluir o nó
  } else if (ferramentaSelecionada === "Excluir Aresta" && params.edges.length > 0) {
    // Excluir aresta selecionada
    const edgeId = params.edges[0];
    edges.remove(edgeId);
    atualizarMatriz(); // Atualiza a matriz após excluir a aresta
  } else if (ferramentaSelecionada === "Limpar Grafo") {
    // Remove todos os nós e arestas
    nodes.clear();
    edges.clear();

    // Atualiza a matriz de adjacência
    atualizarMatriz();
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
      atualizarMatriz(); // Atualiza a matriz após adicionar a aresta
    }
  }
});

// Permite editar rótulos de nós e valores de arestas
network.on("doubleClick", function (params) {
  if (params.nodes.length > 0) {
    // Editar rótulo do nó
    const nodeId = params.nodes[0];
    const node = nodes.get(nodeId);

    const novoRotulo = prompt("Digite o novo rótulo para o nó:", node.label || `V${nodeId}`);
    if (novoRotulo !== null && novoRotulo.trim() !== "") {
      nodes.update({ id: nodeId, label: novoRotulo });
      atualizarMatriz(); // Atualiza a matriz após editar o nó
    }
  } else if (params.edges.length > 0) {
    // Editar valor da aresta
    const edgeId = params.edges[0];
    const edge = edges.get(edgeId);

    const novoValor = prompt("Digite o novo valor para a aresta:", edge.label || "1");
    if (novoValor !== null && novoValor.trim() !== "") {
      edges.update({ id: edgeId, label: novoValor });
      atualizarMatriz(); // Atualiza a matriz após editar a aresta
    }
  }
});

// Botão para apagar o nó ou aresta selecionada
btnApagarSelecionado.onclick = () => {
  const selectedNodes = network.getSelectedNodes(); // Obtém os nós selecionados
  const selectedEdges = network.getSelectedEdges(); // Obtém as arestas selecionadas

  if (selectedNodes.length > 0) {
    // Apaga o nó selecionado
    nodes.remove(selectedNodes[0]);
  } else if (selectedEdges.length > 0) {
    // Apaga a aresta selecionada
    edges.remove(selectedEdges[0]);
  }

  atualizarMatriz(); // Atualiza a matriz após apagar
};

// Botão para limpar todo o grafo
btnLimparGrafo.onclick = () => {
  nodes.clear(); // Remove todos os nós
  edges.clear(); // Remove todas as arestas

  atualizarMatriz(); // Atualiza a matriz após limpar
};
