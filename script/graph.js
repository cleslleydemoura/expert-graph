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
let itemBeingEdited = null;

// === INICIALIZA GRAFO ===
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

    // === EVENTOS DOS BOTÕES ADICIONADOS ===
    // Evento de clique para o botão de download da Análise.
    const btnBaixarAnalise = document.getElementById("txt-converter");
    if (btnBaixarAnalise) {
        btnBaixarAnalise.onclick = baixarMatrizTxt;
    }

    // Eventos para os novos botões de Importar e Exportar.
    const exportBtn = document.getElementById("export-graph-btn");
    const importBtn = document.getElementById("import-graph-btn");
    const importFileInput = document.getElementById("import-file-input");

    if (exportBtn) {
        exportBtn.onclick = exportarGrafoParaTxt;
    }
    if (importBtn && importFileInput) {
        importBtn.onclick = () => importFileInput.click();
        importFileInput.onchange = importarGrafoDeTxt;
    }
    // === FIM DAS ADIÇÕES DE EVENTOS ===

    configurarEventosDoGrafo();
    criarInterfaceDeMatriz();
    atualizarEstatisticas();
});


function handleEditConfirm() {
    if (!itemBeingEdited) return;
    const novoValor = editInput.value.trim();
    const { type, id, data } = itemBeingEdited;

    if (type === 'node') {
        if (novoValor === "") {
            alert("O rótulo do vértice não pode ser vazio.");
            return;
        }
        nodes.update({ id: id, label: novoValor });
    } else if (type === 'new_edge' || type === 'edge') {
        if (novoValor === "" || isNaN(parseFloat(novoValor))) {
            alert("O valor da aresta deve ser um número válido.");
            return;
        }
        if (type === 'new_edge') {
            const { from, to } = data;
            edges.add({ from, to, label: novoValor });
        } else {
            edges.update({ id: id, label: novoValor });
        }
    }

    editModal.style.display = "none";
    network.unselectAll();
    itemBeingEdited = null;
    atualizarEstatisticas();
}

function configurarEventosDoGrafo() {
    network.on("click", (params) => {
        const { pointer, nodes: clickedNodes, edges: clickedEdges } = params;
        if (ferramentaSelecionada === "Aresta" && arestaSelecion.length > 0 && clickedNodes.length === 0 && clickedEdges.length === 0) {
            arestaSelecion = [];
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
                shape: "dot", size: 25,
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

    network.on("selectNode", (params) => {
        if (params.nodes.length > 0) {
            if (ferramentaSelecionada === "Aresta") {
                arestaSelecion.push(params.nodes[0]);
                if (arestaSelecion.length === 2) {
                    const [from, to] = arestaSelecion;
                    const existingEdge = edges.get({
                        filter: (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from),
                    });
                    if (existingEdge.length === 0 && from !== to) {
                        itemBeingEdited = { type: 'new_edge', data: { from, to } };
                        editInput.value = "1";
                        editModal.style.display = "flex";
                        editInput.focus();
                    }
                    arestaSelecion = [];
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
}


// === FUNÇÕES DE IMPORTAÇÃO E EXPORTAÇÃO (INSERIDAS) ===

/**
 * Exporta a estrutura completa do grafo para um arquivo TXT de "backup".
 */
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
    link.download = "grafo_exportado.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

/**
 * Lê um arquivo TXT (de análise ou de backup) e reconstrói o grafo.
 */
function importarGrafoDeTxt(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target.result;
            // Detecta qual tipo de arquivo é (backup '||' ou análise '###')
            if (content.includes('||')) {
                parseBackupFile(content);
            } else if (content.includes('###')) {
                parseAnalysisFile(content);
            } else {
                alert("Formato de arquivo não reconhecido.");
            }
        } catch (error) {
            console.error("Erro ao importar o grafo:", error);
            alert("Falha ao importar o arquivo. Verifique o formato e o console (F12) para detalhes.");
        }
    };
    reader.onerror = () => alert("Erro ao ler o arquivo.");
    reader.readAsText(file);
    event.target.value = null;
}

/**
 * Parser para o arquivo de análise (human-readable).
 */
function parseAnalysisFile(content) {
    const lines = content.split('\n').map(line => line.trim());
    const nodesData = new Map();
    const matrixRows = [];
    let matrixHeaders = [];
    let inPositionSection = false;
    let inMatrixSection = false;
    const posRegex = /(.+?):\s*\((-?\d+\.?\d*),\s*(-?\d+\.?\d*)\)/;

    for (const line of lines) {
        if (line.includes('### POSIÇÕES DOS VÉRTICES')) { inPositionSection = true; inMatrixSection = false; continue; }
        if (line.includes('### MATRIZ DE ADJACÊNCIA')) { inPositionSection = false; inMatrixSection = true; continue; }
        if (line.includes('### ANÁLISE DE ROTAS')) { inPositionSection = false; inMatrixSection = false; continue; }
        if (inPositionSection) {
            const match = line.match(posRegex);
            if (match) {
                nodesData.set(match[1].trim(), { x: parseFloat(match[2]), y: parseFloat(match[3]) });
            }
        } else if (inMatrixSection && line) {
            if (matrixHeaders.length === 0) {
                matrixHeaders = line.split(/\s+/).filter(Boolean);
            } else {
                matrixRows.push(line);
            }
        }
    }

    if (nodesData.size === 0) { throw new Error("Nenhuma posição de vértice encontrada."); }
    const nodesToLoad = [];
    const labelToIdMap = new Map();
    let nodeIdCounter = 0;
    for (const [label, pos] of nodesData.entries()) {
        const newId = nodeIdCounter++;
        labelToIdMap.set(label, newId);
        nodesToLoad.push({ id: newId, label: label, x: pos.x, y: pos.y, shape: 'dot', size: 25, color: { background: '#6e7d7e', border: '#333' }, font: { color: '#333', face: 'Work Sans', size: 16 } });
    }
    proximoNoId = nodeIdCounter;

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
                    edgesToLoad.push({ from: fromId, to: toId, label: String(weight) });
                }
            }
        }
    }

    loadGraphData(nodesToLoad, edgesToLoad);
}

/**
 * Parser para o arquivo de backup (machine-readable com '||').
 */
function parseBackupFile(content) {
    const lines = content.split('\n');
    const nodesToLoad = [];
    const edgesToLoad = [];
    let currentSection = '';
    let maxNodeId = -1;

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine === '### NODES ###') { currentSection = 'nodes'; continue; }
        if (trimmedLine === '### EDGES ###') { currentSection = 'edges'; continue; }
        if (!trimmedLine || !currentSection) continue;
        const parts = trimmedLine.split('||');
        if (currentSection === 'nodes' && parts.length === 4) {
            const node = { id: parseInt(parts[0]), label: parts[1], x: parseFloat(parts[2]), y: parseFloat(parts[3]), shape: 'dot', size: 25, color: { background: '#6e7d7e', border: '#333' }, font: { color: '#333', face: 'Work Sans', size: 16 } };
            nodesToLoad.push(node);
            if (node.id > maxNodeId) maxNodeId = node.id;
        } else if (currentSection === 'edges' && parts.length === 3) {
            edgesToLoad.push({ from: parseInt(parts[0]), to: parseInt(parts[1]), label: parts[2] || '' });
        }
    }
    proximoNoId = (maxNodeId > -1) ? maxNodeId + 1 : 0;
    loadGraphData(nodesToLoad, edgesToLoad);
}

/**
 * Função auxiliar para limpar e carregar os dados no grafo.
 */
function loadGraphData(nodesToLoad, edgesToLoad) {
    nodes.clear();
    edges.clear();
    nodes.add(nodesToLoad);
    edges.add(edgesToLoad);
    network.fit();
    atualizarEstatisticas();
    alert('Grafo importado com sucesso!');
}


// === INTERFACE DE MATRIZ ===
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
        if (isNaN(qtd) || qtd <= 0) { alert("Por favor, insira uma quantidade válida de vértices (maior que 0)."); return; }
        gerarTabelaDeEntrada(matrizInputDiv, qtd);
        btnCriarGrafo.style.display = "inline-block";
    };
    btnCriarGrafo.onclick = () => {
        const qtd = parseInt(inputQtd.value);
        if (isNaN(qtd) || qtd <= 0) { alert("Por favor, insira uma quantidade válida de vértices (maior que 0)."); return; }
        criarGrafoAPartirDaMatriz(matrizInputDiv, qtd);
        atualizarEstatisticas();
    };
    btnMostrarMatriz.onclick = () => {
        atualizarMatriz();
        atualizarEstatisticas();
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
        nodes.add({ id: i, label: `V${i}`, x: radius * Math.cos(angle), y: radius * Math.sin(angle), shape: "dot", size: 25, color: { background: "#6e7d7e", border: "#333" }, font: { color: "#333", face: "Work Sans", size: 16 } });
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
    const currentNodes = nodes.get({ fields: ['id', 'label'] });
    currentNodes.forEach((node) => {
        const th = document.createElement("th"); th.innerText = node.label; headerRow.appendChild(th);
    });
    table.appendChild(headerRow);
    currentNodes.forEach((fromNode) => {
        const row = document.createElement("tr");
        const th = document.createElement("th"); th.innerText = fromNode.label; row.appendChild(th);
        currentNodes.forEach((toNode) => {
            const cell = document.createElement("td");
            const input = document.createElement("input");
            input.type = "number";
            const edge = edges.get({ filter: (e) => e.from === fromNode.id && e.to === toNode.id });
            input.value = edge.length > 0 ? (edge[0].label || "1") : "0";
            input.readOnly = true;
            cell.appendChild(input);
            row.appendChild(cell);
        });
        table.appendChild(row);
    });
    matrizDiv.appendChild(table);
}

/**
 * Função para baixar a análise (Matriz + Posições).
 */
function baixarMatrizTxt() {
    const currentNodes = nodes.get({ fields: ['id', 'label'] });
    currentNodes.sort((a, b) => a.id - b.id);
    if (currentNodes.length === 0) {
        alert("O grafo está vazio. Não há matriz para baixar.");
        return;
    }
    
    // Parte 1: Matriz de Adjacência
    let content = "### MATRIZ DE ADJACÊNCIA ###\n";
    const headers = currentNodes.map(node => node.label);
    content += "\t" + headers.join("\t") + "\n";
    currentNodes.forEach(fromNode => {
        let rowContent = fromNode.label;
        currentNodes.forEach(toNode => {
            const edge = edges.get({ filter: (e) => e.from === fromNode.id && e.to === toNode.id });
            const value = edge.length > 0 ? (edge[0].label || "1") : "0";
            rowContent += "\t" + value;
        });
        content += rowContent + "\n";
    });

    // Parte 2: Posições dos Vértices
    const positions = network.getPositions();
    content += "\n\n### POSIÇÕES DOS VÉRTICES (X, Y) ###\n";
    currentNodes.forEach((node) => {
        if (positions[node.id]) {
            content += `${node.label}: (${Math.round(positions[node.id].x)}, ${Math.round(positions[node.id].y)})\n`;
        }
    });

    // Parte 3: Download
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'analise_grafo.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
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
    if (ids.length < 2) {
        divPossiveis.innerHTML = "<p>São necessários pelo menos 2 nós para calcular rotas.</p>";
        return;
    }
    ids.forEach((fromId) => {
        const resultado = calcularRotas(fromId);
        const fromNodeLabel = nodes.get(fromId) ? nodes.get(fromId).label : `V${fromId}`;
        divPossiveis.innerHTML += `<p><strong>${fromNodeLabel}:</strong> ${resultado.possiveis.join(", ") || "Nenhum"}</p>`;
        divCurta.innerHTML += `<p><strong>${fromNodeLabel}:</strong> ${resultado.curta}</p>`;
        divLonga.innerHTML += `<p><strong>${fromNodeLabel}:</strong> ${resultado.longa}</p>`;
    });
}

function calcularRotas(origemId) {
    let distancias = {};
    nodes.getIds().forEach(id => distancias[id] = Infinity);
    distancias[origemId] = 0;

    let pq = new vis.DataSet([{id: origemId, dist: 0}]);
    let caminhos = {};

    while (pq.length > 0) {
        let u = pq.min('dist').id;
        pq.remove(u);

        let uDist = distancias[u];
        
        edges.get({filter: e => e.from === u}).forEach(edge => {
            let v = edge.to;
            let peso = parseFloat(edge.label || 1);
            if (distancias[v] > uDist + peso) {
                distancias[v] = uDist + peso;
                caminhos[v] = u;
                pq.update({id: v, dist: distancias[v]});
            }
        });
    }

    const destinosPossiveis = Object.keys(distancias)
        .filter(id => distancias[id] !== Infinity && parseInt(id) !== origemId)
        .map(id => nodes.get(parseInt(id)).label);

    const distanciasFinais = Object.values(distancias).filter(d => d > 0 && d !== Infinity);
    const curta = distanciasFinais.length > 0 ? Math.min(...distanciasFinais) : "-";
    const longa = distanciasFinais.length > 0 ? Math.max(...distanciasFinais) : "-";

    return {
        possiveis: destinosPossiveis.sort(),
        curta: curta,
        longa: longa,
    };
}