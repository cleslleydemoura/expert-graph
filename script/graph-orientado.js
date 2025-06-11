// === GLOBAIS ===
let vis = window.vis;
let nodes = new vis.DataSet([]);
let edges = new vis.DataSet([]);
let network;
let proximoNoId = 0;
let arestaSelecion = [];
let itemBeingEdited = null;
let ferramentaSelecionada = null; // Adicionado para referência

// === INICIALIZA GRAFO ===

// WINDOW.ADD_EVENT_LISTENER
// Função de inicialização principal.
// É executada quando a página carrega. Configura o grafo do Vis.js, o modal de edição, os botões e chama as funções de configuração de eventos.
window.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("mynetwork");
    const data = { nodes, edges };
    const options = {
        edges: {
            arrows: {
                to: { enabled: true, scaleFactor: 1, type: "arrow" },
            },
            smooth: {
                enabled: true,
                type: "straightCross",
                roundness: 0
            },
        },
        interaction: {
            dragNodes: true,
            multiselect: false,
            zoomView: false,
        },
        physics: { enabled: false, stabilization: true },
    };
    network = new vis.Network(container, data, options);

    // Inicialização do modal de edição
    const editModal = document.getElementById("editModal");
    const editInput = document.getElementById("editInput");
    const confirmEditBtn = document.getElementById("confirmEditBtn");
    const closeButton = document.querySelector(".close-button");

    if (editModal && editInput && confirmEditBtn && closeButton) {
        closeButton.onclick = () => {
            editModal.style.display = "none";
            network.unselectAll();
            itemBeingEdited = null;
        };
        confirmEditBtn.onclick = () => { handleEditConfirm(); };
        editInput.addEventListener("keypress", (e) => { if (e.key === "Enter") { e.preventDefault(); handleEditConfirm(); } });
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

    // Adicionado evento de clique para o botão de download
    const btnBaixarMatriz = document.getElementById("txt-converter");
    if (btnBaixarMatriz) {
        btnBaixarMatriz.onclick = baixarMatrizTxt;
    }

    configurarEventosDoGrafo();
    criarInterfaceDeMatriz();
    atualizarEstatisticas();
});

// HANDLE_EDIT_CONFIRM
// Processa o salvamento do valor de um nó ou aresta. Valida a entrada, permitindo strings para nós e exigindo números para arestas.
function handleEditConfirm() {
    if (!itemBeingEdited) {
        return;
    }

    const novoValor = document.getElementById("editInput").value.trim();
    const { type, id, data } = itemBeingEdited;

    // Validação para Vértices (permite strings)
    if (type === 'node') {
        if (novoValor === "") {
            alert("O rótulo do vértice não pode ser vazio.");
        } else {
            nodes.update({ id: id, label: novoValor });
        }
    }
    // Validação para Arestas (requer números para cálculos de rota)
    else if (type === 'new_edge' || type === 'edge') {
        if (novoValor === "" || isNaN(parseFloat(novoValor))) {
            alert("O valor da aresta deve ser um número válido e não pode ser vazio.");
        } else {
            if (type === 'new_edge') {
                const { from, to } = data;
                edges.add({ from, to, label: novoValor });
            } else { // type === 'edge'
                edges.update({ id: id, label: novoValor });
            }
        }
    }

    // Atualiza o grafo e limpa o estado de edição
    atualizarEstatisticas();
    document.getElementById("editModal").style.display = "none";
    network.unselectAll();
    itemBeingEdited = null;
}

// === EVENTOS DO GRAFO ===

// CONFIGURAR_EVENTOS_DO_GRAFO
// Centraliza toda a lógica de interação com o grafo, como cliques e seleções para adicionar, remover, conectar ou renomear elementos.
function configurarEventosDoGrafo() {
    network.on("click", (params) => {
        const { pointer, nodes: clickedNodes, edges: clickedEdges } = params;

        // Se o clique foi em um nó e a ferramenta NÃO é de criar Aresta,
        // limpa o estado de criação de aresta para evitar conflitos.
        if (clickedNodes.length > 0 && ferramentaSelecionada !== 'Aresta') {
            arestaSelecion = [];
        }

        // Lógica original para limpar seleção ao clicar no fundo
        if (ferramentaSelecionada === "Aresta" && arestaSelecion.length > 0 && clickedNodes.length === 0 && clickedEdges.length === 0) {
            arestaSelecion = [];
        }

        // Lógica das ferramentas
        if (ferramentaSelecionada === "Vértice" && pointer) {
            nodes.add({ id: proximoNoId, label: `V${proximoNoId}`, x: pointer.canvas.x, y: pointer.canvas.y, shape: "dot", size: 25, color: { background: "#6e7d7e", border: "#333" }, font: { color: "#333", face: "Work Sans", size: 16 } });
            proximoNoId++;
        } else if (ferramentaSelecionada === "Excluir Nó" && clickedNodes.length > 0) {
            nodes.remove(clickedNodes[0]);
        } else if (ferramentaSelecionada === "Excluir Aresta" && clickedEdges.length > 0) {
            edges.remove(clickedEdges[0]);
        } else if (ferramentaSelecionada === "Limpar Grafo") {
            nodes.clear(); edges.clear(); proximoNoId = 0;
            const clearGraphMenuItem = document.querySelector('.menu-item .tooltip[data-tooltip="Limpar Grafo"]');
            if (clearGraphMenuItem) clearGraphMenuItem.parentElement.classList.remove('selected');
            ferramentaSelecionada = null;
        }
        atualizarEstatisticas();
    });

    network.on("selectNode", (params) => {
        if (params.nodes.length === 0) return;

        const nodeId = params.nodes[0];

        // MODIFICADO: Verifica a ferramenta "Renomear Vértice"
        if (ferramentaSelecionada === "Renomear Vértice") {
            itemBeingEdited = { type: 'node', id: nodeId };
            document.getElementById("editInput").value = nodes.get(nodeId).label;
            document.getElementById("editModal").style.display = "flex";
            document.getElementById("editInput").focus();
        }
        else if (ferramentaSelecionada === "Aresta") {
            arestaSelecion.push(nodeId);

            if (arestaSelecion.length === 2) {
                const [from, to] = arestaSelecion;
                const existingEdge = edges.get({ filter: (e) => (e.from === from && e.to === to) });

                if (existingEdge.length === 0 && from !== to) {
                    itemBeingEdited = {
                        type: 'new_edge',
                        data: { from, to }
                    };
                    document.getElementById("editInput").value = "1";
                    document.getElementById("editModal").style.display = "flex";
                    document.getElementById("editInput").focus();
                } else if (from === to) {
                    console.warn("Não é possível criar auto-loops.");
                } else {
                    console.warn("Aresta nesse sentido já existe.");
                }
                arestaSelecion = [];
            }
        }
    });

    network.on("selectEdge", (params) => {
        // MODIFICADO: Verifica a ferramenta "Renomear Aresta"
        if (params.edges.length > 0 && ferramentaSelecionada === "Renomear Aresta") {
            const edgeId = params.edges[0];
            itemBeingEdited = { type: 'edge', id: edgeId };
            document.getElementById("editInput").value = edges.get(edgeId).label || "1";
            document.getElementById("editModal").style.display = "flex";
            document.getElementById("editInput").focus();
        }
    });
}

// === INTERFACE DE MATRIZ ===

// CRIAR_INTERFACE_DE_MATRIZ
// Cria e configura os elementos HTML (botões, inputs) para a funcionalidade de adicionar/exibir a matriz de adjacência.
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
            alert("Por favor, insira uma quantidade válida.");
            return;
        }
        gerarTabelaDeEntrada(matrizInputDiv, qtd);
        btnCriarGrafo.style.display = "inline-block";
    };
    btnCriarGrafo.onclick = () => {
        const qtd = parseInt(inputQtd.value);
        if (isNaN(qtd) || qtd <= 0) {
            alert("Por favor, insira uma quantidade válida.");
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

// GERAR_TABELA_DE_ENTRADA
// Gera dinamicamente uma tabela HTML para que o usuário possa inserir os valores da matriz de adjacência.
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

// CRIAR_GRAFO_A_PARTIR_DA_MATRIZ
// Lê os valores da tabela de entrada, limpa o grafo existente e cria um novo grafo com base na matriz fornecida.
function criarGrafoAPartirDaMatriz(container, n) {
    const inputs = container.querySelectorAll("input");
    const matriz = Array.from({ length: n }, () => Array(n).fill(0));
    inputs.forEach((input) => {
        matriz[parseInt(input.dataset.i)][parseInt(input.dataset.j)] = parseInt(input.value);
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
            font: { color: "#333", face: "Work Sans", size: 16 }
        });
        if (i >= proximoNoId) proximoNoId = i + 1;
    }
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (matriz[i][j] > 0) {
                edges.add({ from: i, to: j, label: matriz[i][j].toString() });
            }
        }
    }
}

// ATUALIZAR_MATRIZ
// Gera e exibe a matriz de adjacência correspondente ao estado atual do grafo na tela.
function atualizarMatriz() {
    const matrizDiv = document.getElementById("matrizOutputContainer");
    if (!matrizDiv) return;
    matrizDiv.innerHTML = "";

    const table = document.createElement("table");
    const headerRow = document.createElement("tr");
    headerRow.appendChild(document.createElement("th"));
    const currentNodes = nodes.get({ fields: ['id', 'label'] });
    currentNodes.sort((a, b) => a.id - b.id);

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

// BAIXAR_MATRIZ_TXT
// Converte a matriz de adjacência atual em uma string formatada e inicia o download de um arquivo .txt.
function baixarMatrizTxt() {
    const currentNodes = nodes.get({ fields: ['id', 'label'] });
    currentNodes.sort((a, b) => a.id - b.id);

    if (currentNodes.length === 0) {
        alert("O grafo está vazio. Não há matriz para baixar.");
        return;
    }

    let content = "";

    const headers = currentNodes.map(node => node.label);
    content += "\t" + headers.join("\t") + "\n";

    currentNodes.forEach(fromNode => {
        let rowContent = fromNode.label;
        currentNodes.forEach(toNode => {
            const edge = edges.get({
                filter: (e) => e.from === fromNode.id && e.to === toNode.id,
            });
            const value = edge.length > 0 ? (edge[0].label || "1") : "0";
            rowContent += "\t" + value;
        });
        content += rowContent + "\n";
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'matriz_adjacencia.txt';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

// ATUALIZAR_ESTATISTICAS
// Calcula e exibe as estatísticas do grafo, como rotas possíveis, rota mais curta e mais longa a partir de cada nó.
function atualizarEstatisticas() {
    const divPossiveis = document.getElementById("rotas-possiveis");
    const divCurta = document.getElementById("rota-curta");
    const divLonga = document.getElementById("rota-longa");

    if (!divPossiveis || !divCurta || !divLonga) {
        return;
    }

    divPossiveis.innerHTML = "";
    divCurta.innerHTML = "";
    divLonga.innerHTML = "";

    const ids = nodes.getIds();
    ids.sort((a, b) => a - b);

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

// CALCULAR_ROTAS
// Implementa o algoritmo de Dijkstra para encontrar os caminhos mais curtos de um nó de origem para todos os outros nós no grafo.
function calcularRotas(origemId) {
    const distancias = {};
    const predecessores = {};
    const pq = new vis.DataSet([{ id: origemId, dist: 0 }]);

    const todosIds = nodes.getIds();
    todosIds.forEach(id => {
        distancias[id] = Infinity;
        predecessores[id] = null;
    });
    distancias[origemId] = 0;

    while (pq.length > 0) {
        const allItems = pq.get({ order: 'dist' });
        const atual = allItems[0];
        pq.remove(atual.id);

        if (atual.dist === Infinity) break;

        const conexoes = edges.get({
            filter: (edge) => {
                return (edge.from === atual.id);
            }
        });

        conexoes.forEach((edge) => {
            const vizinhoId = edge.to;
            const pesoAresta = parseFloat(edge.label || "1");
            const novaDist = distancias[atual.id] + pesoAresta;

            if (novaDist < distancias[vizinhoId]) {
                distancias[vizinhoId] = novaDist;
                predecessores[vizinhoId] = atual.id;
                if (pq.get(vizinhoId)) {
                    pq.update({ id: vizinhoId, dist: novaDist });
                } else {
                    pq.add({ id: vizinhoId, dist: novaDist });
                }
            }
        });
    }

    const destinosPossiveis = Object.keys(distancias)
        .filter(id => parseInt(id) !== origemId && distancias[id] !== Infinity)
        .map(id => nodes.get(parseInt(id)).label);

    let realMinDist = Infinity;
    let realMaxDist = 0;
    let hasReachableNode = false;

    for (const nodeId in distancias) {
        if (parseInt(nodeId) !== origemId && distancias[nodeId] !== Infinity) {
            const dist = distancias[nodeId];
            realMinDist = Math.min(realMinDist, dist);
            realMaxDist = Math.max(realMaxDist, dist);
            hasReachableNode = true;
        }
    }

    return {
        possiveis: destinosPossiveis.sort(),
        curta: hasReachableNode ? realMinDist : "-",
        longa: hasReachableNode ? realMaxDist : "-",
    };
}