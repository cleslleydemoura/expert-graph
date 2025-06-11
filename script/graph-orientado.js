// === GLOBAIS ===
let vis = window.vis;
let nodes = new vis.DataSet([]);
let edges = new vis.DataSet([]);
let network;
let proximoNoId = 0;
let arestaSelecion = [];
let itemBeingEdited = null;
let ferramentaSelecionada = null;
let ultimosResultadosDeRota = null; // NOVO: Armazena os últimos resultados de rota calculados

// === INICIALIZA GRAFO ===

// WINDOW.ADD_EVENT_LISTENER
// Função de inicialização principal.
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
            zoomView: true,
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
    
    // Adiciona evento de clique para o botão de cálculo de rotas
    const btnCalcularRotas = document.getElementById("calculate-routes-btn");
    if (btnCalcularRotas) {
        btnCalcularRotas.onclick = atualizarEstatisticas;
    }

    configurarEventosDoGrafo();
    criarInterfaceDeMatriz();
});

// HANDLE_EDIT_CONFIRM
// Processa o salvamento do valor de um nó ou aresta.
function handleEditConfirm() {
    if (!itemBeingEdited) {
        return;
    }

    const novoValor = document.getElementById("editInput").value.trim();
    const { type, id, data } = itemBeingEdited;

    if (type === 'node') {
        if (novoValor === "") {
            alert("O rótulo do vértice não pode ser vazio.");
        } else {
            nodes.update({ id: id, label: novoValor });
        }
    }
    else if (type === 'new_edge' || type === 'edge') {
        if (novoValor === "" || isNaN(parseFloat(novoValor))) {
            alert("O valor da aresta deve ser um número válido e não pode ser vazio.");
        } else {
            if (type === 'new_edge') {
                const { from, to } = data;
                edges.add({ from, to, label: novoValor });
            } else {
                edges.update({ id: id, label: novoValor });
            }
        }
    }

    limparResultadosDeRota();
    document.getElementById("editModal").style.display = "none";
    network.unselectAll();
    itemBeingEdited = null;
}

// === EVENTOS DO GRAFO ===

// CONFIGURAR_EVENTOS_DO_GRAFO
// Centraliza toda a lógica de interação com o grafo.
function configurarEventosDoGrafo() {
    network.on("click", (params) => {
        const { pointer, nodes: clickedNodes, edges: clickedEdges } = params;

        if (clickedNodes.length > 0 && ferramentaSelecionada !== 'Aresta') {
            arestaSelecion = [];
        }

        if (ferramentaSelecionada === "Aresta" && arestaSelecion.length > 0 && clickedNodes.length === 0 && clickedEdges.length === 0) {
            arestaSelecion = [];
        }

        let graphChanged = false;
        if (ferramentaSelecionada === "Vértice" && pointer) {
            nodes.add({ id: proximoNoId, label: `V${proximoNoId}`, x: pointer.canvas.x, y: pointer.canvas.y, shape: "dot", size: 25, color: { background: "#6e7d7e", border: "#333" }, font: { color: "#333", face: "Work Sans", size: 16 } });
            proximoNoId++;
            graphChanged = true;
        } else if (ferramentaSelecionada === "Excluir Nó" && clickedNodes.length > 0) {
            nodes.remove(clickedNodes[0]);
            graphChanged = true;
        } else if (ferramentaSelecionada === "Excluir Aresta" && clickedEdges.length > 0) {
            edges.remove(clickedEdges[0]);
            graphChanged = true;
        } else if (ferramentaSelecionada === "Limpar Grafo") {
            nodes.clear(); edges.clear(); proximoNoId = 0;
            const clearGraphMenuItem = document.querySelector('.menu-item .tooltip[data-tooltip="Limpar Grafo"]');
            if (clearGraphMenuItem) clearGraphMenuItem.parentElement.classList.remove('selected');
            ferramentaSelecionada = null;
            graphChanged = true;
        }
        
        if (graphChanged) {
            limparResultadosDeRota();
        }
    });

    network.on("selectNode", (params) => {
        if (params.nodes.length === 0) return;

        const nodeId = params.nodes[0];

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
// Cria os elementos HTML para a funcionalidade de adicionar/exibir a matriz.
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
        limparResultadosDeRota();
    };
    btnMostrarMatriz.onclick = () => {
        atualizarMatriz();
        limparResultadosDeRota();
    };
}

// GERAR_TABELA_DE_ENTRADA
// Gera a tabela HTML para inserir a matriz.
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
// Cria um novo grafo com base na matriz fornecida.
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
// Gera e exibe a matriz de adjacência na tela.
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
// Converte a matriz e as rotas em uma string e inicia o download.
function baixarMatrizTxt() {
    const currentNodes = nodes.get({ fields: ['id', 'label'] });
    currentNodes.sort((a, b) => a.id - b.id);

    if (currentNodes.length === 0) {
        alert("O grafo está vazio. Não há dados para baixar.");
        return;
    }

    let content = "### MATRIZ DE ADJACÊNCIA ###\n";
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

    // *** ATUALIZADO: Adiciona os resultados das rotas, se existirem ***
    if (ultimosResultadosDeRota && ultimosResultadosDeRota.caminhos.length > 0) {
        content += "\n\n### ANÁLISE DE ROTAS ###\n";
        content += `Resultados de ${ultimosResultadosDeRota.startLabel} para ${ultimosResultadosDeRota.endLabel}\n\n`;

        const caminhosOrdenados = ultimosResultadosDeRota.caminhos; // Já estão ordenados
        const menorRota = caminhosOrdenados[0];
        const maiorRota = caminhosOrdenados[caminhosOrdenados.length - 1];

        content += `Menor Rota: ${menorRota.path.join(" -> ")} (Custo: ${menorRota.cost})\n`;
        content += `Maior Rota: ${maiorRota.path.join(" -> ")} (Custo: ${maiorRota.cost})\n\n`;
        content += `Total de Rotas Possíveis: ${caminhosOrdenados.length}\n`;
        content += "----------------------------------------\n";

        caminhosOrdenados.forEach(caminho => {
            content += `${caminho.path.join(" -> ")} (Custo: ${caminho.cost})\n`;
        });
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'matriz.txt';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

// === LÓGICA DE ROTAS ===

/**
 * Limpa a área de resultados de rota e a variável global.
 */
function limparResultadosDeRota() {
    const resultsDiv = document.getElementById("route-results");
    if(resultsDiv) {
        resultsDiv.innerHTML = "<p>O grafo foi modificado. Faça uma nova busca.</p>";
    }
    ultimosResultadosDeRota = null; // Limpa os dados armazenados
}

/**
 * Encontra todos os caminhos simples (sem ciclos) entre um nó de início e um de fim.
 */
function encontrarTodosOsCaminhos(inicioId, fimId) {
    const todosOsCaminhos = [];

    function dfs(noAtualId, caminhoAtual, custoAtual) {
        const noAtual = nodes.get(noAtualId);
        caminhoAtual.push(noAtual.label);

        if (noAtualId === fimId) {
            todosOsCaminhos.push({ path: [...caminhoAtual], cost: custoAtual });
            caminhoAtual.pop();
            return;
        }

        const conexoes = edges.get({ filter: edge => edge.from === noAtualId });

        conexoes.forEach(edge => {
            const vizinhoId = edge.to;
            const vizinhoLabel = nodes.get(vizinhoId).label;
            
            if (!caminhoAtual.includes(vizinhoLabel)) {
                const pesoAresta = parseFloat(edge.label || "1");
                dfs(vizinhoId, caminhoAtual, custoAtual + pesoAresta);
            }
        });

        caminhoAtual.pop();
    }

    dfs(inicioId, [], 0);
    return todosOsCaminhos;
}

/**
 * Lê os inputs, calcula, exibe e armazena as rotas.
 */
function atualizarEstatisticas() {
    const startInput = document.getElementById("start-vertex");
    const endInput = document.getElementById("end-vertex");
    const resultsDiv = document.getElementById("route-results");

    resultsDiv.innerHTML = "";
    limparResultadosDeRota(); // Limpa resultados anteriores antes de uma nova busca

    const startLabel = startInput.value.trim();
    const endLabel = endInput.value.trim();

    if (!startLabel || !endLabel) {
        resultsDiv.innerHTML = "<p>Por favor, informe o vértice de partida e de chegada.</p>";
        return;
    }

    const getNodeIdByLabel = (label) => {
        const foundNode = nodes.get({ filter: node => node.label.toLowerCase() === label.toLowerCase() });
        return foundNode.length > 0 ? foundNode[0].id : null;
    };

    const startId = getNodeIdByLabel(startLabel);
    const endId = getNodeIdByLabel(endLabel);

    if (startId === null) {
        resultsDiv.innerHTML = `<p>Vértice de partida "${startLabel}" não encontrado.</p>`;
        return;
    }
    if (endId === null) {
        resultsDiv.innerHTML = `<p>Vértice de chegada "${endLabel}" não encontrado.</p>`;
        return;
    }
    
    if (startId === endId) {
        resultsDiv.innerHTML = `<p>O vértice de partida e chegada devem ser diferentes.</p>`;
        return;
    }

    const todosOsCaminhos = encontrarTodosOsCaminhos(startId, endId);

    if (todosOsCaminhos.length === 0) {
        resultsDiv.innerHTML = `<p>Nenhuma rota encontrada de <strong>${startLabel}</strong> para <strong>${endLabel}</strong>.</p>`;
        return;
    }

    todosOsCaminhos.sort((a, b) => a.cost - b.cost);

    // *** ATUALIZADO: Armazena os resultados globalmente ***
    ultimosResultadosDeRota = {
        startLabel: startLabel,
        endLabel: endLabel,
        caminhos: todosOsCaminhos
    };
    
    const menorRota = todosOsCaminhos[0];
    const maiorRota = todosOsCaminhos[todosOsCaminhos.length - 1];

    let htmlResult = `<h3>Resultados de ${startLabel} para ${endLabel}:</h3>`;
    htmlResult += `<p><strong>Menor Rota:</strong> ${menorRota.path.join(" → ")} (Custo: ${menorRota.cost})</p>`;
    htmlResult += `<p><strong>Maior Rota:</strong> ${maiorRota.path.join(" → ")} (Custo: ${maiorRota.cost})</p>`;
    htmlResult += `<hr><p><strong>${todosOsCaminhos.length} Rota(s) Possível(is):</strong></p>`;
    
    todosOsCaminhos.forEach(caminho => {
        htmlResult += `<p>${caminho.path.join(" → ")} (Custo: ${caminho.cost})</p>`;
    });

    resultsDiv.innerHTML = htmlResult;
}