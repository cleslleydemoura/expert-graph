// === GLOBAIS ===
// Estas são variáveis globais, acessíveis de qualquer parte do código.

// Importa a biblioteca 'vis' do objeto window para ser usada localmente.
let vis = window.vis;
// Cria um 'DataSet', que é uma coleção de dados dinâmica da biblioteca vis.js para armazenar os nós (vértices) do grafo.
let nodes = new vis.DataSet([]);
// Cria um DataSet para armazenar as arestas (conexões) do grafo.
let edges = new vis.DataSet([]);
// Variável que irá armazenar a instância da rede do vis.js depois de criada.
let network;
// Um contador para garantir que cada novo nó tenha um ID único.
let proximoNoId = 0;
// Um array para armazenar temporariamente os nós selecionados ao criar uma nova aresta.
let arestaSelecion = [];
// Armazena a referência ao item (nó ou aresta) que está sendo editado no momento.
let itemBeingEdited = null;
// Guarda qual ferramenta do menu (ex: "Adicionar Vértice", "Excluir Nó") está ativa.
let ferramentaSelecionada = null;
// Armazena os resultados do último cálculo de rota para que possam ser usados em outras funções, como o download.
let ultimosResultadosDeRota = null;

// === INICIALIZA GRAFO ===

window.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("mynetwork");
    const data = { nodes, edges };
    const options = {
        edges: {
            arrows: { to: { enabled: true, scaleFactor: 1, type: "arrow" } },
            smooth: { enabled: true, type: "straightCross", roundness: 0 },
        },
        interaction: {
            dragNodes: true,
            multiselect: false,
            zoomView: true,
        },
        physics: { enabled: false, stabilization: true },
    };
    network = new vis.Network(container, data, options);

    // Modal de Edição
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
        confirmEditBtn.onclick = handleEditConfirm;
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

    // Botões de Ação
    document.getElementById("txt-converter").onclick = baixarMatrizTxt;
    document.getElementById("calculate-routes-btn").onclick = atualizarEstatisticas;

    // Botões de Importar/Exportar
    const exportBtn = document.getElementById("export-graph-btn");
    const importBtn = document.getElementById("import-graph-btn");
    const importFileInput = document.getElementById("import-file-input");

    if (exportBtn) exportBtn.onclick = exportarGrafoParaTxt;
    if (importBtn && importFileInput) {
        importBtn.onclick = () => importFileInput.click();
        importFileInput.onchange = importarGrafoDeTxt; // Esta função será substituída
    }

    configurarEventosDoGrafo();
    criarInterfaceDeMatriz();
});

// === FUNÇÕES PRINCIPAIS ===

function handleEditConfirm() {
    if (!itemBeingEdited) return;
    const novoValor = document.getElementById("editInput").value.trim();
    const { type, id, data } = itemBeingEdited;

    if (type === "node") {
        if (novoValor === "") {
            alert("O rótulo do vértice não pode ser vazio.");
        } else {
            nodes.update({ id: id, label: novoValor });
        }
    } else if (type === "new_edge" || type === "edge") {
        if (novoValor === "" || isNaN(parseFloat(novoValor))) {
            alert("O valor da aresta deve ser um número válido e não pode ser vazio.");
        } else {
            if (type === "new_edge") {
                edges.add({ from: data.from, to: data.to, label: novoValor });
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

function configurarEventosDoGrafo() {
    network.on("click", (params) => {
        const { pointer, nodes: clickedNodes, edges: clickedEdges } = params;
        if (clickedNodes.length > 0 && ferramentaSelecionada !== "Aresta") arestaSelecion = [];
        if (ferramentaSelecionada === "Aresta" && arestaSelecion.length > 0 && clickedNodes.length === 0 && clickedEdges.length === 0) arestaSelecion = [];

        let graphChanged = false;
        if (ferramentaSelecionada === "Vértice" && pointer) {
            nodes.add({
                id: proximoNoId,
                label: `V${proximoNoId}`,
                x: pointer.canvas.x,
                y: pointer.canvas.y,
                shape: "dot", size: 25,
                color: { background: "#6e7d7e", border: "#333" },
                font: { color: "#333", face: "Work Sans", size: 16 },
            });
            proximoNoId++;
            graphChanged = true;
        } else if (ferramentaSelecionada === "Excluir Nó" && clickedNodes.length > 0) {
            nodes.remove(clickedNodes[0]);
            graphChanged = true;
        } else if (ferramentaSelecionada === "Excluir Aresta" && clickedEdges.length > 0) {
            edges.remove(clickedEdges[0]);
            graphChanged = true;
        } else if (ferramentaSelecionada === "Limpar Grafo") {
            nodes.clear();
            edges.clear();
            proximoNoId = 0;
            const clearBtn = document.querySelector('.menu-item .tooltip[data-tooltip="Limpar Grafo"]');
            if (clearBtn) clearBtn.parentElement.classList.remove("selected");
            ferramentaSelecionada = null;
            graphChanged = true;
        }
        if (graphChanged) limparResultadosDeRota();
    });

    network.on("selectNode", (params) => {
        if (params.nodes.length === 0) return;
        const nodeId = params.nodes[0];
        if (ferramentaSelecionada === "Renomear Vértice") {
            itemBeingEdited = { type: "node", id: nodeId };
            document.getElementById("editInput").value = nodes.get(nodeId).label;
            document.getElementById("editModal").style.display = "flex";
            document.getElementById("editInput").focus();
        } else if (ferramentaSelecionada === "Aresta") {
            arestaSelecion.push(nodeId);
            if (arestaSelecion.length === 2) {
                const [from, to] = arestaSelecion;
                const existingEdge = edges.get({ filter: (e) => e.from === from && e.to === to });
                if (existingEdge.length === 0 && from !== to) {
                    itemBeingEdited = { type: "new_edge", data: { from, to } };
                    document.getElementById("editInput").value = "1";
                    document.getElementById("editModal").style.display = "flex";
                    document.getElementById("editInput").focus();
                }
                arestaSelecion = [];
            }
        }
    });

    network.on("selectEdge", (params) => {
        if (params.edges.length > 0 && ferramentaSelecionada === "Renomear Aresta") {
            const edgeId = params.edges[0];
            itemBeingEdited = { type: "edge", id: edgeId };
            document.getElementById("editInput").value = edges.get(edgeId).label || "1";
            document.getElementById("editModal").style.display = "flex";
            document.getElementById("editInput").focus();
        }
    });
}


// =======================================================
// NOVA FUNÇÃO DE IMPORTAÇÃO PARA LER O ARQUIVO DE ANÁLISE
// =======================================================

/**
 * Lê um arquivo TXT de ANÁLISE (com matriz e posições) e reconstrói o grafo.
 */
function importarGrafoDeTxt(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target.result;
            const lines = content.split('\n').map(line => line.trim());

            // --- PASSO 1: Extrair dados das seções ---
            
            const nodesData = new Map(); // Armazena { label -> {x, y} }
            const matrixRows = []; // Armazena as linhas de dados da matriz
            let matrixHeaders = []; // Armazena os labels do cabeçalho da matriz

            let inPositionSection = false;
            let inMatrixSection = false;
            
            // Expressão Regular para extrair dados da linha de posição: "V0: (-293, -117)"
            const posRegex = /(.+?):\s*\((-?\d+\.?\d*),\s*(-?\d+\.?\d*)\)/;

            for (const line of lines) {
                if (line.includes('### POSIÇÕES DOS VÉRTICES')) {
                    inPositionSection = true;
                    inMatrixSection = false;
                    continue;
                }
                if (line.includes('### MATRIZ DE ADJACÊNCIA')) {
                    inPositionSection = false;
                    inMatrixSection = true;
                    continue;
                }
                if (line.includes('### ANÁLISE DE ROTAS')) {
                    inPositionSection = false;
                    inMatrixSection = false;
                    continue;
                }

                if (inPositionSection) {
                    const match = line.match(posRegex);
                    if (match) {
                        const label = match[1].trim();
                        const x = parseFloat(match[2]);
                        const y = parseFloat(match[3]);
                        nodesData.set(label, { x, y });
                    }
                } else if (inMatrixSection && line) {
                    // A primeira linha com conteúdo na seção da matriz é o cabeçalho
                    if (matrixHeaders.length === 0) {
                        matrixHeaders = line.split(/\s+/).filter(Boolean); // Divide por espaços/tabs
                    } else {
                        matrixRows.push(line);
                    }
                }
            }
            
            // --- PASSO 2: Processar os dados e montar o grafo ---

            if (nodesData.size === 0) {
                alert("Nenhuma posição de vértice encontrada no arquivo.");
                return;
            }

            const nodesToLoad = [];
            const labelToIdMap = new Map();
            let nodeIdCounter = 0;

            // Cria os nós a partir dos dados de posição
            for (const [label, pos] of nodesData.entries()) {
                const newId = nodeIdCounter++;
                labelToIdMap.set(label, newId);
                nodesToLoad.push({
                    id: newId,
                    label: label,
                    x: pos.x,
                    y: pos.y,
                    shape: 'dot', size: 25,
                    color: { background: '#6e7d7e', border: '#333' },
                    font: { color: '#333', face: 'Work Sans', size: 16 },
                });
            }
            proximoNoId = nodeIdCounter;

            // Cria as arestas a partir dos dados da matriz
            const edgesToLoad = [];
            for (const row of matrixRows) {
                const parts = row.split(/\s+/).filter(Boolean);
                const fromLabel = parts[0];
                const fromId = labelToIdMap.get(fromLabel);

                if (fromId === undefined) continue;

                const weights = parts.slice(1);
                for (let i = 0; i < weights.length; i++) {
                    const weight = parseInt(weights[i]);
                    if (weight > 0) {
                        const toLabel = matrixHeaders[i];
                        const toId = labelToIdMap.get(toLabel);
                        if (toId !== undefined) {
                            edgesToLoad.push({
                                from: fromId,
                                to: toId,
                                label: String(weight)
                            });
                        }
                    }
                }
            }

            // --- PASSO 3: Carregar o grafo na tela ---
            nodes.clear();
            edges.clear();
            nodes.add(nodesToLoad);
            edges.add(edgesToLoad);
            network.fit(); // Ajusta o zoom
            alert('Grafo importado com sucesso!');

        } catch (error) {
            console.error("Erro ao importar o grafo:", error);
            alert("Falha ao importar o arquivo. Verifique o formato e o console (F12) para detalhes.");
        }
    };
    reader.onerror = () => alert("Erro ao ler o arquivo.");
    reader.readAsText(file);
    event.target.value = null;
}


// Função de exportação original (pode ser útil para outros fins)
function exportarGrafoParaTxt() {
    const allNodes = nodes.get({ fields: ['id', 'label'] });
    if (allNodes.length === 0) {
        alert("O grafo está vazio. Nada para exportar.");
        return;
    }
    const allEdges = edges.get({ fields: ['from', 'to', 'label'] });
    const positions = network.getPositions();
    let content = "### NODES ###\n";
    allNodes.forEach(node => {
        const pos = positions[node.id];
        if (pos) content += `${node.id}||${node.label}||${pos.x}||${pos.y}\n`;
    });
    content += "### EDGES ###\n";
    allEdges.forEach(edge => {
        content += `${edge.from}||${edge.to}||${edge.label || ''}\n`;
    });
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "grafo_exportado_compativel.txt"; // Nome diferente para não confundir
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}


// === DEMAIS FUNÇÕES ===
// (As funções de Matriz e Rotas permanecem as mesmas)

function criarInterfaceDeMatriz() {
    const grafoContainer = document.querySelector(".graph-container");
    const terminal = document.querySelector(".terminal-container");
    const inputQtd = document.createElement("input");
    inputQtd.type = "number"; inputQtd.placeholder = "Qtd. de vértices"; inputQtd.min = "0";
    const btnGerar = document.createElement("button"); btnGerar.innerText = "ADICIONAR MATRIZ";
    const matrizInputDiv = document.createElement("div");
    const btnCriarGrafo = document.createElement("button"); btnCriarGrafo.innerText = "Criar Grafo"; btnCriarGrafo.style.display = "none";
    const btnMostrarMatriz = document.createElement("button"); btnMostrarMatriz.innerText = "EXIBIR MATRIZ";
    const matrizOutputDiv = document.createElement("div"); matrizOutputDiv.id = "matrizOutputContainer";
    
    grafoContainer.appendChild(btnMostrarMatriz);
    grafoContainer.appendChild(matrizOutputDiv);
    terminal.append(inputQtd, btnGerar, matrizInputDiv, btnCriarGrafo);
    
    btnGerar.onclick = () => {
        const qtd = parseInt(inputQtd.value);
        if (isNaN(qtd) || qtd <= 0) { alert("Por favor, insira uma quantidade válida."); return; }
        gerarTabelaDeEntrada(matrizInputDiv, qtd);
        btnCriarGrafo.style.display = "inline-block";
    };
    btnCriarGrafo.onclick = () => {
        const qtd = parseInt(inputQtd.value);
        if (isNaN(qtd) || qtd <= 0) { alert("Por favor, insira uma quantidade válida."); return; }
        criarGrafoAPartirDaMatriz(matrizInputDiv, qtd);
        limparResultadosDeRota();
    };
    btnMostrarMatriz.onclick = () => {
        atualizarMatriz();
    };
}

function gerarTabelaDeEntrada(container, n) {
    container.innerHTML = "";
    const table = document.createElement("table");
    const headerRow = document.createElement("tr");
    headerRow.appendChild(document.createElement("th"));
    for (let i = 0; i < n; i++) {
        const th = document.createElement("th"); th.innerText = `V${i}`; headerRow.appendChild(th);
    }
    table.appendChild(headerRow);
    for (let i = 0; i < n; i++) {
        const row = document.createElement("tr");
        const th = document.createElement("th"); th.innerText = `V${i}`; row.appendChild(th);
        for (let j = 0; j < n; j++) {
            const cell = document.createElement("td");
            const input = document.createElement("input");
            input.type = "number"; input.value = "0"; input.min = "0"; input.style.width = "40px";
            input.dataset.i = i; input.dataset.j = j;
            cell.appendChild(input); row.appendChild(cell);
        }
        table.appendChild(row);
    }
    container.appendChild(table);
}

function criarGrafoAPartirDaMatriz(container, n) {
    const inputs = container.querySelectorAll("input");
    const matriz = Array.from({ length: n }, () => Array(n).fill(0));
    inputs.forEach((input) => {
        matriz[parseInt(input.dataset.i)][parseInt(input.dataset.j)] = parseInt(input.value);
    });
    nodes.clear(); edges.clear(); proximoNoId = 0;
    const angleStep = (2 * Math.PI) / n; const radius = 200;
    for (let i = 0; i < n; i++) {
        const angle = i * angleStep;
        nodes.add({
            id: i, label: `V${i}`, x: radius * Math.cos(angle), y: radius * Math.sin(angle),
            shape: "dot", size: 25,
            color: { background: "#6e7d7e", border: "#333" },
            font: { color: "#333", face: "Work Sans", size: 16 },
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

function atualizarMatriz() {
    const matrizDiv = document.getElementById("matrizOutputContainer");
    if (!matrizDiv) return;
    matrizDiv.innerHTML = "";
    const table = document.createElement("table");
    const headerRow = document.createElement("tr");
    headerRow.appendChild(document.createElement("th"));
    const currentNodes = nodes.get({ fields: ["id", "label"] });
    currentNodes.sort((a, b) => a.id - b.id);
    currentNodes.forEach((node) => {
        const th = document.createElement("th"); th.innerText = node.label; headerRow.appendChild(th);
    });
    table.appendChild(headerRow);
    currentNodes.forEach((fromNode) => {
        const row = document.createElement("tr");
        const th = document.createElement("th"); th.innerText = fromNode.label; row.appendChild(th);
        currentNodes.forEach((toNode) => {
            const cell = document.createElement("td");
            const input = document.createElement("input"); input.type = "number";
            const edge = edges.get({ filter: (e) => e.from === fromNode.id && e.to === toNode.id });
            input.value = edge.length > 0 ? edge[0].label || "1" : "0";
            input.readOnly = true;
            cell.appendChild(input); row.appendChild(cell);
        });
        table.appendChild(row);
    });
    matrizDiv.appendChild(table);
}

function baixarMatrizTxt() {
    const currentNodes = nodes.get({ fields: ["id", "label"] });
    if (currentNodes.length === 0) { alert("O grafo está vazio."); return; }
    currentNodes.sort((a, b) => a.id - b.id);
    const positions = network.getPositions();
    let content = "### MATRIZ DE ADJACÊNCIA ###\n";
    const headers = currentNodes.map((node) => node.label);
    content += "\t" + headers.join("\t") + "\n";
    currentNodes.forEach((fromNode) => {
        let rowContent = fromNode.label;
        currentNodes.forEach((toNode) => {
            const edge = edges.get({ filter: (e) => e.from === fromNode.id && e.to === toNode.id });
            rowContent += "\t" + (edge.length > 0 ? edge[0].label || "1" : "0");
        });
        content += rowContent + "\n";
    });
    content += "\n\n### POSIÇÕES DOS VÉRTICES (X, Y) ###\n";
    currentNodes.forEach((node) => {
        if (positions[node.id]) {
            content += `${node.label}: (${Math.round(positions[node.id].x)}, ${Math.round(positions[node.id].y)})\n`;
        }
    });
    if (ultimosResultadosDeRota && ultimosResultadosDeRota.caminhos.length > 0) {
        content += "\n\n### ANÁLISE DE ROTAS ###\n";
        content += `Resultados de ${ultimosResultadosDeRota.startLabel} para ${ultimosResultadosDeRota.endLabel}\n\n`;
        const { caminhos } = ultimosResultadosDeRota;
        content += `Menor Rota: ${caminhos[0].path.join(" -> ")} (Custo: ${caminhos[0].cost})\n`;
        content += `Maior Rota: ${caminhos[caminhos.length - 1].path.join(" -> ")} (Custo: ${caminhos[caminhos.length - 1].cost})\n\n`;
        content += `Total de Rotas Possíveis: ${caminhos.length}\n----------------------------------------\n`;
        caminhos.forEach((c) => { content += `${c.path.join(" -> ")} (Custo: ${c.cost})\n`; });
    }
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "matriz.txt";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

function limparResultadosDeRota() {
    const resultsDiv = document.getElementById("route-results");
    if (resultsDiv) resultsDiv.innerHTML = "<p>Calcule uma rota para ver os resultados.</p>";
    ultimosResultadosDeRota = null;
}

function encontrarTodosOsCaminhos(inicioId, fimId) {
    const todosOsCaminhos = [];
    function dfs(noAtualId, caminhoAtual, custoAtual) {
        const noAtual = nodes.get(noAtualId);
        caminhoAtual.push(noAtual.label);
        if (noAtualId === fimId) {
            todosOsCaminhos.push({ path: [...caminhoAtual], cost: custoAtual });
            caminhoAtual.pop(); return;
        }
        const conexoes = edges.get({ filter: (edge) => edge.from === noAtualId });
        conexoes.forEach((edge) => {
            const vizinhoId = edge.to;
            if (nodes.get(vizinhoId) && !caminhoAtual.includes(nodes.get(vizinhoId).label)) {
                dfs(vizinhoId, caminhoAtual, custoAtual + parseFloat(edge.label || "1"));
            }
        });
        caminhoAtual.pop();
    }
    dfs(inicioId, [], 0);
    return todosOsCaminhos;
}

function atualizarEstatisticas() {
    const startInput = document.getElementById("start-vertex");
    const endInput = document.getElementById("end-vertex");
    const resultsDiv = document.getElementById("route-results");
    resultsDiv.innerHTML = "";
    ultimosResultadosDeRota = null;
    const startLabel = startInput.value.trim();
    const endLabel = endInput.value.trim();
    if (!startLabel || !endLabel) {
        resultsDiv.innerHTML = "<p>Por favor, informe o vértice de partida e de chegada.</p>";
        return;
    }
    const getNodeIdByLabel = (label) => {
        const found = nodes.get({ filter: (n) => n.label.toLowerCase() === label.toLowerCase() });
        return found.length > 0 ? found[0].id : null;
    };
    const startId = getNodeIdByLabel(startLabel);
    const endId = getNodeIdByLabel(endLabel);
    if (startId === null) { resultsDiv.innerHTML = `<p>Vértice de partida "${startLabel}" não encontrado.</p>`; return; }
    if (endId === null) { resultsDiv.innerHTML = `<p>Vértice de chegada "${endLabel}" não encontrado.</p>`; return; }
    if (startId === endId) { resultsDiv.innerHTML = `<p>O vértice de partida e chegada devem ser diferentes.</p>`; return; }
    const todosOsCaminhos = encontrarTodosOsCaminhos(startId, endId);
    if (todosOsCaminhos.length === 0) {
        resultsDiv.innerHTML = `<p>Nenhuma rota encontrada de <strong>${startLabel}</strong> para <strong>${endLabel}</strong>.</p>`;
        return;
    }
    todosOsCaminhos.sort((a, b) => a.cost - b.cost);
    ultimosResultadosDeRota = { startLabel, endLabel, caminhos: todosOsCaminhos };
    const menorRota = todosOsCaminhos[0];
    const maiorRota = todosOsCaminhos[todosOsCaminhos.length - 1];
    let htmlResult = `<h3>Resultados de ${startLabel} para ${endLabel}:</h3>`;
    htmlResult += `<p><strong>Menor Rota:</strong> ${menorRota.path.join(" → ")} (Custo: ${menorRota.cost})</p>`;
    htmlResult += `<p><strong>Maior Rota:</strong> ${maiorRota.path.join(" → ")} (Custo: ${maiorRota.cost})</p>`;
    htmlResult += `<hr><p><strong>${todosOsCaminhos.length} Rota(s) Possível(is):</strong></p>`;
    todosOsCaminhos.forEach((c) => { htmlResult += `<p>${c.path.join(" → ")} (Custo: ${c.cost})</p>`; });
    resultsDiv.innerHTML = htmlResult;
}