// === GLOBAIS ===
let nodes = new vis.DataSet([]);
let edges = new vis.DataSet([]);
let network;
let proximoNoId = 0;
let arestaSelecion = [];
let ferramentaSelecionada = null;

// === INICIALIZA GRAFO ===
window.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("mynetwork");
  const data = { nodes, edges };
  const options = {
    interaction: { dragNodes: true },
    physics: { enabled: false, stabilization: true },
  };
  network = new vis.Network(container, data, options);

  configurarEventosDoGrafo();
  criarInterfaceDeMatriz();
});

// === EVENTOS DO GRAFO ===
function configurarEventosDoGrafo() {
  network.on("click", (params) => {
    const { pointer, nodes: clickedNodes, edges: clickedEdges } = params;

    if (ferramentaSelecionada === "Vértice" && pointer) {
      nodes.add({
        id: proximoNoId,
        label: `V${proximoNoId}`,
        x: pointer.canvas.x,
        y: pointer.canvas.y,
        shape: "dot",
        size: 25,
        color: { background: "#6e7d7e", border: "#333" },
        font: { color: "#333", face: "Work Sans", size: 16 },
      });
      proximoNoId++;
    } else if (
      ferramentaSelecionada === "Excluir Nó" &&
      clickedNodes.length > 0
    ) {
      nodes.remove(clickedNodes[0]);
    } else if (
      ferramentaSelecionada === "Excluir Aresta" &&
      clickedEdges.length > 0
    ) {
      edges.remove(clickedEdges[0]);
    } else if (ferramentaSelecionada === "Limpar Grafo") {
      nodes.clear();
      edges.clear();
      proximoNoId = 0;
    }
  });

  network.on("selectNode", (params) => {
    if (ferramentaSelecionada === "Aresta") {
      arestaSelecion.push(params.nodes[0]);
      if (arestaSelecion.length === 2) {
        const [from, to] = arestaSelecion;
        edges.add({ from, to });
        arestaSelecion = [];
      }
    }
  });

  network.on("doubleClick", (params) => {
    if (params.nodes.length > 0) {
      const nodeId = params.nodes[0];
      const novoRotulo = prompt("Novo rótulo:", nodes.get(nodeId).label);
      if (novoRotulo) nodes.update({ id: nodeId, label: novoRotulo });
    } else if (params.edges.length > 0) {
      const edgeId = params.edges[0];
      const novoValor = prompt(
        "Novo valor da aresta:",
        edges.get(edgeId).label || "1"
      );
      if (novoValor) edges.update({ id: edgeId, label: novoValor });
    }
  });
}

// === INTERFACE DE MATRIZ ===
function criarInterfaceDeMatriz() {
  const grafoContainer = document.querySelector(".graph-container");
  const terminal = document.querySelector(".terminal-container");

  const inputQtd = document.createElement("input");
  inputQtd.type = "number";
  inputQtd.placeholder = "Qtd. de vértices";
  inputQtd.id = "numVertices";

  const btnGerar = document.createElement("button");
  btnGerar.innerText = "Adicionar Matriz";

  const matrizInputDiv = document.createElement("div");
  matrizInputDiv.id = "matrizInputContainer";
  matrizInputDiv.style.marginTop = "10px";

  const btnCriarGrafo = document.createElement("button");
  btnCriarGrafo.innerText = "Criar Grafo";
  btnCriarGrafo.style.display = "none"; // oculto por padrão

  const btnMostrarMatriz = document.createElement("button");
  btnMostrarMatriz.innerText = "Exibir Matriz";

  const matrizOutputDiv = document.createElement("div");
  matrizOutputDiv.id = "matrizOutputContainer";
  matrizOutputDiv.style.marginTop = "10px";

  // Adiciona botão e matriz gerada logo abaixo do grafo
  grafoContainer.appendChild(btnMostrarMatriz);
  grafoContainer.appendChild(matrizOutputDiv);

  terminal.append(inputQtd, btnGerar, matrizInputDiv, btnCriarGrafo);

  btnGerar.onclick = () => {
    gerarTabelaDeEntrada(matrizInputDiv, parseInt(inputQtd.value));
    btnCriarGrafo.style.display = "inline-block"; // mostra após gerar matriz
  };

  btnCriarGrafo.onclick = () => criarGrafoAPartirDaMatriz(matrizInputDiv, parseInt(inputQtd.value));
  btnMostrarMatriz.onclick = () => atualizarMatriz();
}

function gerarTabelaDeEntrada(container, n) {
  container.innerHTML = "";
  const table = document.createElement("table");
  const headerRow = document.createElement("tr");
  headerRow.appendChild(document.createElement("th"));
  for (let i = 0; i < n; i++) {
    const th = document.createElement("th");
    th.innerText = `V${i}`;
    headerRow.appendChild(th);
  }
  table.appendChild(headerRow);

  for (let i = 0; i < n; i++) {
    const row = document.createElement("tr");
    const th = document.createElement("th");
    th.innerText = `V${i}`;
    row.appendChild(th);

    for (let j = 0; j < n; j++) {
      const cell = document.createElement("td");
      const input = document.createElement("input");
      input.type = "number";
      input.value = "0";
      input.style.width = "40px";
      input.dataset.i = i;
      input.dataset.j = j;
      cell.appendChild(input);
      row.appendChild(cell);
    }
    table.appendChild(row);
  }
  container.appendChild(table);
}

function criarGrafoAPartirDaMatriz(container, n) {
  const inputs = container.querySelectorAll("input");
  const matriz = Array.from({ length: n }, () => Array(n).fill(0));

  inputs.forEach((input) => {
    const i = parseInt(input.dataset.i);
    const j = parseInt(input.dataset.j);
    if (!isNaN(i) && !isNaN(j)) matriz[i][j] = parseInt(input.value);
  });

  nodes.clear();
  edges.clear();

  const angleStep = (2 * Math.PI) / n;
  const radius = 200;
  for (let i = 0; i < n; i++) {
    const angle = i * angleStep;
    nodes.add({
      id: i,
      label: `V${i}`,
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
      shape: "dot",
      size: 25,
      color: { background: "#6e7d7e", border: "#333" },
      font: { color: "#333", face: "Work Sans", size: 16 },
    });
  }
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (matriz[i][j] > 0) {
        edges.add({ from: i, to: j, label: matriz[i][j].toString() });
      }
    }
  }
  proximoNoId = n;
}

// === MATRIZ DE ADJACÊNCIA GERADA AUTOMATICAMENTE ===
function atualizarMatriz() {
  const matrizDiv = document.getElementById("matrizOutputContainer");
  if (!matrizDiv) return;
  matrizDiv.innerHTML = "";

  const table = document.createElement("table");
  const headerRow = document.createElement("tr");
  headerRow.appendChild(document.createElement("th"));
  nodes.forEach((node) => {
    const th = document.createElement("th");
    th.innerText = node.label;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  nodes.forEach((fromNode) => {
    const row = document.createElement("tr");
    const th = document.createElement("th");
    th.innerText = fromNode.label;
    row.appendChild(th);

    nodes.forEach((toNode) => {
      const cell = document.createElement("td");
      const input = document.createElement("input");
      input.type = "number";
      const edge = edges.get({
        filter: (e) => e.from === fromNode.id && e.to === toNode.id,
      });
      input.value = edge.length ? edge[0].label || "1" : "0";
      input.dataset.from = fromNode.id;
      input.dataset.to = toNode.id;
      input.addEventListener("input", (e) => {
        const from = parseInt(e.target.dataset.from);
        const to = parseInt(e.target.dataset.to);
        const val = e.target.value;
        const existing = edges.get({
          filter: (ed) => ed.from === from && ed.to === to,
        });

        if (val > 0) {
          if (existing.length > 0)
            edges.update({ id: existing[0].id, label: val });
          else edges.add({ from, to, label: val });
        } else if (existing.length > 0) {
          edges.remove(existing[0].id);
        }
      });
      cell.appendChild(input);
      row.appendChild(cell);
    });
    table.appendChild(row);
  });
  matrizDiv.appendChild(table);
} // FIM