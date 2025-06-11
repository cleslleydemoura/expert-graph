/* eslint-disable no-undef */
// === GLOBAIS ===
let vis = window.vis;
let nodes = new vis.DataSet([]);
let edges = new vis.DataSet([]);
let network;
let proximoNoId = 0;
let arestaSelecion = [];
// A variável ferramentaSelecionada é definida pelo 'selected-item.js'
// Não precisamos redefini-la aqui.

// Variáveis para o modal de edição
let editModal;
let editInput;
let confirmEditBtn;
let closeButton;
let itemBeingEdited = null; // Guarda o ID e tipo (node/edge) do item sendo editado

// === INICIALIZA GRAFO ===
// Função de inicialização principal
window.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("mynetwork");
    const data = { nodes, edges };
    const options = {
        interaction: {
            dragNodes: true,
            multiselect: false,
            zoomView: false,
        },
        physics: { enabled: false, stabilization: true },
    };
    network = new vis.Network(container, data, options);

    // Inicializa elementos do modal
    editModal = document.getElementById("editModal");
    editInput = document.getElementById("editInput");
    confirmEditBtn = document.getElementById("confirmEditBtn");
    closeButton = document.querySelector(".close-button");

    // Configura os eventos do modal
    if (editModal && editInput && confirmEditBtn && closeButton) {
        closeButton.onclick = () => {
            editModal.style.display = "none";
            network.unselectAll();
            itemBeingEdited = null;
        };

        confirmEditBtn.onclick = () => {
            handleEditConfirm();
        };

        editInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handleEditConfirm();
            }
        });

        window.onclick = (event) => {
            if (event.target == editModal) {
                editModal.style.display = "none";
                network.unselectAll();
                itemBeingEdited = null;
            }
        };
    } else {
        console.error("Elementos do modal de edição não encontrados no HTML!");
    }


    configurarEventosDoGrafo();
    criarInterfaceDeMatriz();
    atualizarEstatisticas();
});


// === ALTERAÇÃO INICIADA ===
// Função de confirmação da edição
// Esta função agora valida se o valor da aresta é um número e sabe como criar uma nova aresta.
function handleEditConfirm() {
    if (!itemBeingEdited) {
        return;
    }

    const novoValor = editInput.value.trim();
    const { type, id, data } = itemBeingEdited;

    // Validação e salvamento para Vértices
    if (type === 'node') {
        if (novoValor === "") {
            alert("O rótulo do vértice não pode ser vazio.");
            return; // Impede que o modal feche se a validação falhar
        }
        nodes.update({ id: id, label: novoValor });
    }
    // Validação e salvamento para Arestas (novas ou existentes)
    else if (type === 'new_edge' || type === 'edge') {
        // Garante que o valor da aresta seja sempre um número
        if (novoValor === "" || isNaN(parseFloat(novoValor))) {
            alert("O valor da aresta deve ser um número válido.");
            return; // Impede que o modal feche se a validação falhar
        }

        if (type === 'new_edge') {
            const { from, to } = data;
            edges.add({ from, to, label: novoValor });
        } else { // type === 'edge'
            edges.update({ id: id, label: novoValor });
        }
    }

    // Limpa o estado e fecha o modal apenas se a validação passar
    editModal.style.display = "none";
    network.unselectAll();
    itemBeingEdited = null;
    atualizarEstatisticas();
}


// === EVENTOS DO GRAFO ===
// Função de configuração dos eventos do grafo
function configurarEventosDoGrafo() {
    // Evento de CLIQUE no grafo
    network.on("click", (params) => {
        const { pointer, nodes: clickedNodes, edges: clickedEdges } = params;

        if (ferramentaSelecionada === "Aresta" && arestaSelecion.length > 0 && clickedNodes.length === 0 && clickedEdges.length === 0) {
            arestaSelecion = [];
            console.log("Seleção de aresta resetada ao clicar fora.");
        }

        if (editModal.style.display === "flex" && clickedNodes.length === 0 && clickedEdges.length === 0) {
            editModal.style.display = "none";
            network.unselectAll();
            itemBeingEdited = null;
        }

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
        } else if (ferramentaSelecionada === "Excluir Nó" && clickedNodes.length > 0) {
            nodes.remove(clickedNodes[0]);
        } else if (ferramentaSelecionada === "Excluir Aresta" && clickedEdges.length > 0) {
            edges.remove(clickedEdges[0]);
        } else if (ferramentaSelecionada === "Limpar Grafo") {
            nodes.clear();
            edges.clear();
            proximoNoId = 0;
            const clearGraphMenuItem = document.querySelector('.menu-item .tooltip[data-tooltip="Limpar Grafo"]');
            if (clearGraphMenuItem) {
                clearGraphMenuItem.parentElement.classList.remove('selected');
            }
            ferramentaSelecionada = null;
        }
        atualizarEstatisticas();
    });

    // Evento SELECT NODE - para conectar arestas ou RENOMEAR VÉRTICE
    network.on("selectNode", (params) => {
        if (params.nodes.length > 0) {
            if (ferramentaSelecionada === "Aresta") {
                arestaSelecion.push(params.nodes[0]);

                if (arestaSelecion.length === 2) {
                    const [from, to] = arestaSelecion;
                    const existingEdge = edges.get({
                        filter: (e) =>
                            (e.from === from && e.to === to) || (e.from === to && e.to === from),
                    });

                    if (existingEdge.length === 0 && from !== to) {
                        // Em vez de adicionar a aresta, abre o modal para pedir o valor
                        itemBeingEdited = {
                            type: 'new_edge',
                            data: { from, to }
                        };
                        editInput.value = "1"; // Valor padrão
                        editModal.style.display = "flex";
                        editInput.focus();

                    } else if (from === to) {
                        console.warn("Não é possível criar uma aresta de um nó para ele mesmo.");
                    } else {
                        console.warn("Aresta entre esses nós já existe.");
                    }
                    arestaSelecion = []; // Reseta a seleção para próxima aresta
                    // A atualização de estatísticas agora acontece no handleEditConfirm
                }
            } else if (ferramentaSelecionada === "Renomear Vértice") {
                const nodeId = params.nodes[0];
                itemBeingEdited = { type: 'node', id: nodeId };
                editInput.value = nodes.get(nodeId).label;
                editModal.style.display = "flex";
                editInput.focus();
            }
        }
    });
    // === ALTERAÇÃO FINALIZADA ===


    // Evento SELECT EDGE - para RENOMEAR ARESTA
    network.on("selectEdge", (params) => {
        if (params.edges.length > 0) {
            if (ferramentaSelecionada === "Renomear Aresta") {
                const edgeId = params.edges[0];
                itemBeingEdited = { type: 'edge', id: edgeId };
                editInput.value = edges.get(edgeId).label || "1";
                editModal.style.display = "flex";
                editInput.focus();
            }
        }
    });

    network.on("doubleClick", (params) => {
        console.log("Evento doubleClick disparado!", params);
    });

    network.on("deselectNode", () => {
        if (ferramentaSelecionada !== "Renomear Vértice" && editModal.style.display === "flex") {
            editModal.style.display = "none";
            itemBeingEdited = null;
        }
    });

    network.on("deselectEdge", () => {
        if (ferramentaSelecionada !== "Renomear Aresta" && editModal.style.display === "flex") {
            editModal.style.display = "none";
            itemBeingEdited = null;
        }
    });
}

// === O RESTANTE DO CÓDIGO PERMANECE IGUAL ===

// === INTERFACE DE MATRIZ ===
function criarInterfaceDeMatriz() {
    const grafoContainer = document.querySelector(".graph-container");
    const terminal = document.querySelector(".terminal-container");

    const inputQtd = document.createElement("input");
    inputQtd.type = "number";
    inputQtd.placeholder = "Qtd. de vértices";
    inputQtd.min = "0";

    const btnGerar = document.createElement("button");
    btnGerar.innerText = "ADICIONAR MATRIZ";

    const matrizInputDiv = document.createElement("div");
    const btnCriarGrafo = document.createElement("button");
    btnCriarGrafo.innerText = "Criar Grafo";
    btnCriarGrafo.style.display = "none";

    const btnMostrarMatriz = document.createElement("button");
    btnMostrarMatriz.innerText = "EXIBIR MATRIZ";

    const matrizOutputDiv = document.createElement("div");
    matrizOutputDiv.id = "matrizOutputContainer";

    grafoContainer.appendChild(btnMostrarMatriz);
    grafoContainer.appendChild(matrizOutputDiv);
    terminal.append(inputQtd, btnGerar, matrizInputDiv, btnCriarGrafo);

    btnGerar.onclick = () => {
        const qtd = parseInt(inputQtd.value);
        if (isNaN(qtd) || qtd <= 0) {
            alert("Por favor, insira uma quantidade válida de vértices (maior que 0).");
            return;
        }
        gerarTabelaDeEntrada(matrizInputDiv, qtd);
        btnCriarGrafo.style.display = "inline-block";
    };

    btnCriarGrafo.onclick = () => {
        const qtd = parseInt(inputQtd.value);
        if (isNaN(qtd) || qtd <= 0) {
            alert("Por favor, insira uma quantidade válida de vértices (maior que 0).");
            return;
        }
        criarGrafoAPartirDaMatriz(matrizInputDiv, qtd);
        atualizarEstatisticas();
    };

    btnMostrarMatriz.onclick = () => {
        atualizarMatriz();
        atualizarEstatisticas();
    };
}

// Função para gerar a tabela de entrada da matriz
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
            input.min = "0";
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

// Função para criar o grafo a partir da matriz
function criarGrafoAPartirDaMatriz(container, n) {
    const inputs = container.querySelectorAll("input");
    const matriz = Array.from({ length: n }, () => Array(n).fill(0));

    inputs.forEach((input) => {
        const i = parseInt(input.dataset.i);
        const j = parseInt(input.dataset.j);
        matriz[i][j] = parseInt(input.value);
    });

    nodes.clear();
    edges.clear();
    proximoNoId = 0;

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
        if (i >= proximoNoId) {
            proximoNoId = i + 1;
        }
    }
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (matriz[i][j] > 0) {
                edges.add({ from: i, to: j, label: matriz[i][j].toString() });
            }
        }
    }
}

// === MATRIZ DE ADJACÊNCIA GERADA AUTOMATICAMENTE ===
function atualizarMatriz() {
    const matrizDiv = document.getElementById("matrizOutputContainer");
    if (!matrizDiv) return;
    matrizDiv.innerHTML = "";

    const table = document.createElement("table");
    const headerRow = document.createElement("tr");
    headerRow.appendChild(document.createElement("th"));
    const currentNodes = nodes.get({ fields: ['id', 'label'] });
    currentNodes.forEach((node) => {
        const th = document.createElement("th");
        th.innerText = node.label;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    currentNodes.forEach((fromNode) => {
        const row = document.createElement("tr");
        const th = document.createElement("th");
        th.innerText = fromNode.label;
        row.appendChild(th);

        currentNodes.forEach((toNode) => {
            const cell = document.createElement("td");
            const input = document.createElement("input");
            input.type = "number";
            const edge = edges.get({
                filter: (e) => e.from === fromNode.id && e.to === toNode.id,
            });
            input.value = edge.length > 0 ? (edge[0].label || "1") : "0";
            input.readOnly = true;
            cell.appendChild(input);
            row.appendChild(cell);
        });
        table.appendChild(row);
    });
    matrizDiv.appendChild(table);
}

// === ESTATÍSTICAS DO GRAFO ===
function atualizarEstatisticas() {
    const divPossiveis = document.getElementById("rotas-possiveis");
    const divCurta = document.getElementById("rota-curta");
    const divLonga = document.getElementById("rota-longa");

    if (!divPossiveis || !divCurta || !divLonga) {
        console.warn("Elementos de estatísticas não encontrados no HTML.");
        return;
    }

    divPossiveis.innerHTML = "";
    divCurta.innerHTML = "";
    divLonga.innerHTML = "";

    const ids = nodes.getIds();

    if (ids.length === 0) {
        divPossiveis.innerHTML = "<p>Nenhum nó no grafo para calcular rotas.</p>";
        divCurta.innerHTML = "<p>Nenhum nó no grafo para calcular rotas.</p>";
        divLonga.innerHTML = "<p>Nenhum nó no grafo para calcular rotas.</p>";
        return;
    }

    ids.forEach((fromId) => {
        const resultado = calcularRotas(fromId);
        const fromNodeLabel = nodes.get(fromId) ? nodes.get(fromId).label : `V${fromId}`;
        divPossiveis.innerHTML += `<p><strong>${fromNodeLabel}:</strong> ${resultado.possiveis.join(", ") || "-"}</p>`;
        divCurta.innerHTML += `<p><strong>${fromNodeLabel}:</strong> ${resultado.curta}</p>`;
        divLonga.innerHTML += `<p><strong>${fromNodeLabel}:</strong> ${resultado.longa}</p>`;
    });
}

// Função para calcular as rotas a partir de uma origem
function calcularRotas(origemId) {
    const fila = [{ id: origemId, dist: 0 }];
    const visitados = new Set([origemId]);
    const distancias = { [origemId]: 0 };

    while (fila.length > 0) {
        const atual = fila.shift();

        const vizinhos = edges.get({ filter: (e) => e.from === atual.id });

        vizinhos.forEach((edge) => {
            const vizinhoId = edge.to;
            const pesoAresta = parseFloat(edge.label || "1");
            const novaDist = atual.dist + pesoAresta;

            if (!visitados.has(vizinhoId) || novaDist < (distancias[vizinhoId] || Infinity)) {
                visitados.add(vizinhoId);
                distancias[vizinhoId] = novaDist;
                fila.push({ id: vizinhoId, dist: novaDist });
            }
        });
    }

    const destinosPossiveis = Object.keys(distancias)
        .filter(id => parseInt(id) !== origemId)
        .map(id => nodes.get(parseInt(id)).label);

    let realMinDist = Infinity;
    let realMaxDist = 0;
    let hasReachableNode = false;

    for (const nodeId in distancias) {
        if (parseInt(nodeId) !== origemId) {
            const dist = distancias[nodeId];
            if (dist > 0) {
                realMinDist = Math.min(realMinDist, dist);
                realMaxDist = Math.max(realMaxDist, dist);
                hasReachableNode = true;
            }
        }
    }

    return {
        possiveis: destinosPossiveis.sort(),
        curta: hasReachableNode ? realMinDist : "-",
        longa: hasReachableNode ? realMaxDist : "-",
    };
}