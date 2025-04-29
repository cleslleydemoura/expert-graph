let ferramentaSelecionada = null;

document.addEventListener('DOMContentLoaded', () => {
  const menuItems = document.querySelectorAll('.menu-item');

  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      // Verifica se o item já está selecionado
      const isSelected = item.classList.contains('selected');

      // Se o item não estava selecionado, seleciona ele e ativa a ferramenta
      if (!isSelected) {
        // Remove seleção de todos os itens
        menuItems.forEach(i => i.classList.remove('selected'));

        // Marca o item clicado como selecionado
        item.classList.add('selected');

        // Define a ferramenta com base no tooltip que será utilizada no grafo
        const tooltip = item.querySelector('.tooltip');
        ferramentaSelecionada = tooltip ? tooltip.textContent.trim() : null;
      } else {
        // Se o item já estiver selecionado, desmarque-o
        item.classList.remove('selected');
        ferramentaSelecionada = null;
      }

      console.log(ferramentaSelecionada);
    });
  });
});

