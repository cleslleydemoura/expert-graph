# 📈 EGraph - Expert Graph

<div align="center">
  <a href="#">
    <img src="https://skillicons.dev/icons?i=javascript,nodejs"/>
  </a>
</div>

<p>
  🧑‍🏫 Este software foi desenvolvido para ser utilizado em aulas, auxiliando no entendimento de conceitos de grafos. Através dele, os alunos podem desenhar grafos, gerar a matriz de adjacência e analisar diferentes rotas, facilitando a      visualização e a compreensão das estruturas e algoritmos associados.
</p>
<p>
  Esse projeto foi desenvolvido utilizando o <i><b>Electron.js</b></i> para gerar a aplicação e é dividido em duas páginas principais: uma para Grafos Não Orientados e outra para Grafos Orientados. A visualização e manipulação são realizadas com o auxílio da biblioteca <i><b>Vis.js</b></i>.
</p>
<p><a href="https://make-your-graph.vercel.app/">Versão Web</a></p>

## Funcionalidades
<ul>
  <p><b>✍️📈 Desenho Interativo de Grafos</b></p>
  <li>Clique na tela para criar pontos que representam os vértices.</li>
  <li>Insira informações para cada vértice, aresta e seus respectivos rótulos.</li>
  <li>Gere automaticamente a matriz de adjacência a partir do grafo construído.</li>
</ul>

![image](https://github.com/user-attachments/assets/2b70fa5b-c30a-4066-b4ff-b47184626726)

<ul>
  <p><b>🖥️📈 Geração de Grafo a partir de uma Matriz de Adjacência</b></p>
  <li>Forneça as coordenadas da matriz de adjacência.</li>
  <li>O software desenhará o grafo correspondente, exibindo vértices, arestas e os valores dos rótulos.</li>
</ul>

<ul>
  <p><b>🛣️📈 Análise de Rotas</b></p>
  <li>Especifique um ponto de origem e destino.</li>
  <li>
    <b>O programa fornecerá:</b>
    <ul>
      <li>Todas as rotas possíveis entre os pontos.</li>
      <li>A rota mais curta.</li>
      <li>A rota mais longa.</li>
    </ul>
  </li>
</ul>

<ul>
  <p><b>📁 Exportação e Importação de arquivos</b></p>
  <li>Download da Matriz de Adjacência, Posição X e Y dos vértices, valores de arestas e rotas da Matriz criados pelo usuário em formato .txt.</li>
  <li>O mesmo arquivo de download pode ser lido pelo programa e gerar um grafo com as exatas informações disponíveis no arquivo.</li>
</ul>

# 👨‍💻 REQUISITOS TÉCNICOS
<p>Aplicações necessárias:</p>
<ul>
  <li>🟢 Node.js</li>
</ul>

# 💻 Como instalar e rodar o projeto localmente?

  <b>1.</b> Instale o <b>Node.js</b> e use o comando <code>node -v</code> no terminal para verificar se ele está instalado e atualizado; <br><br>
  <b>2.</b> Execute o comando <code>npm install</code> para instalar as dependências do projeto; <br><br>
  <b>3.</b> Por fim, execute <code>npm run start</code> para iniciar o projeto e rodá-lo na sua máquina local.

# 👾 Como gerar um executável?
<p>
  O projeto conta com o forge, que é capaz de criar um aplicativo executável através do comando <code>npm run make</code>.
</p>
