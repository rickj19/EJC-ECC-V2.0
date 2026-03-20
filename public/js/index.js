/**
 * Arquivo: public/js/index.js
 * Descrição: Lógica de navegação e inicialização da tela inicial (Home).
 */

/**
 * Função: irLogin
 * Descrição: Redireciona o usuário para a página de login com o parâmetro de tipo correto.
 * @param {string} tipo - O tipo de acesso (ejc, ecc ou admin).
 * Navegação: login.html?tipo=[tipo]
 */
function irLogin(tipo) {
    // Redireciona para a página de login passando o tipo via query string
    window.location.href = `login.html?tipo=${tipo}`;
}

/**
 * Evento: DOMContentLoaded
 * Descrição: Executado quando o documento HTML foi completamente carregado.
 * Inicializa os ícones da biblioteca Lucide.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Verifica se a biblioteca Lucide está disponível antes de tentar criar os ícones
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});
