const terminal = document.querySelector(".terminal-container");

const inputQtd = document.createElement("input");
inputQtd.type = "number";
inputQtd.placeholder = "Qtd. de vértices";
inputQtd.id = "numVertices";

const btnGerar = document.createElement("button");
btnGerar.innerText = "Gerar Matriz";

const matrizDiv = document.createElement("div");
matrizDiv.id = "matrizContainer";
matrizDiv.style.marginTop = "10px";

const btnCriarGrafo = document.createElement("button");
btnCriarGrafo.innerText = "Criar Grafo";

terminal.appendChild(inputQtd);
terminal.appendChild(btnGerar);
terminal.appendChild(matrizDiv);
terminal.appendChild(btnCriarGrafo);

btnGerar.onclick = () => {
    const n = parseInt(inputQtd.value);
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
            input.style.width = "40px";
            input.dataset.i = i;
            input.dataset.j = j;
            cell.appendChild(input);
            row.appendChild(cell);
        }
        table.appendChild(row);
    }

    matrizDiv.appendChild(table);
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
        nodes.add({ id: i, label: `V${i}` });
    }

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (matriz[i][j] > 0) {
                edges.add({ from: i, to: j, label: matriz[i][j].toString() });
            }
        }
    }

    const container = document.getElementById("mynetwork");
    const data = { nodes, edges };
    const options = { physics: false };

    const network = new vis.Network(container, data, options);
};
