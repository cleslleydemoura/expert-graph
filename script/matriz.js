// Construção
const terminal = document.querySelector(".terminal-container");

const inputQtd = document.createElement("input");
inputQtd.type = "number";
inputQtd.placeholder = "Qtd. de vértices";
inputQtd.id = "numVertices";

const btnGerar = document.createElement("button");
btnGerar.innerText = "GERAR MATRIZ";

const matrizDiv = document.createElement("div");
matrizDiv.id = "matrizContainer";

const btnCriarGrafo = document.createElement("button");
btnCriarGrafo.innerText = "CRIAR GRAFO";
btnCriarGrafo.style.display = "none"; // Escondido inicialmente

terminal.appendChild(inputQtd);
terminal.appendChild(btnGerar);
terminal.appendChild(matrizDiv);
terminal.appendChild(btnCriarGrafo);

btnGerar.onclick = () => {
    const n = parseInt(inputQtd.value);

    if (isNaN(n) || n <= 0) {
        alert("Por favor, insira um número válido de vértices.");
        return;
    }

    matrizDiv.innerHTML = "";

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
            input.dataset.i = i;
            input.dataset.j = j;
            cell.appendChild(input);
            row.appendChild(cell);
        }
        table.appendChild(row);
    }

    matrizDiv.appendChild(table);

    btnCriarGrafo.style.display = "inline-block";
};

btnCriarGrafo.onclick = () => {
    const inputs = matrizDiv.querySelectorAll("input");
    const n = parseInt(inputQtd.value);
    const matriz = Array.from({ length: n }, () => Array(n).fill(0));

    inputs.forEach(input => {
        const i = parseInt(input.dataset.i);
        const j = parseInt(input.dataset.j);
        matriz[i][j] = parseInt(input.value);
    });

    const nodes = new vis.DataSet();
    const edges = new vis.DataSet();

    for (let i = 0; i < n; i++) {
        nodes.add({
            id: i,
            label: `V${i}`,
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
    }

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (matriz[i][j] > 0) {
                edges.add({ 
                    from: i, 
                    to: j, 
                    // label: matriz[i][j].toString(), <-- numera as arestas
                    font: { align: "top" }
                });
            }
        }
    }

    const container = document.getElementById("mynetwork");
    const data = { nodes, edges };
    const options = {
        physics: false,
        nodes: {
            font: {
                face: "Work Sans",
                color: "#333",
            },
        },
        edges: {
            smooth: {
                type: "dynamic",
            },
            font: {
                align: "middle",
            },
        },
    };

    const network = new vis.Network(container, data, options);
};
