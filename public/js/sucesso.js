/**
 * Arquivo: public/js/sucesso.js
 * Descrição: Lógica para a página de sucesso, incluindo exibição de versículos bíblicos e redirecionamento automático.
 */

// Lista de mensagens bíblicas para exibição aleatória
const messages = [
    {
        text: "Tudo posso naquele que me fortalece.",
        ref: "Filipenses 4:13"
    },
    {
        text: "O Senhor é o meu pastor, nada me faltará.",
        ref: "Salmo 23:1"
    },
    {
        text: "Deixai vir a mim as criancinhas e não as impeçais, porque o Reino de Deus é daqueles que se parecem com elas.",
        ref: "Marcos 10:14"
    },
    {
        text: "Acima de tudo, porém, revistam-se do amor, que é o elo perfeito.",
        ref: "Colossenses 3:14"
    },
    {
        text: "Eu e a minha casa serviremos ao Senhor.",
        ref: "Josué 24:15"
    }
];

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa os ícones Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    /**
     * Lógica de Mensagem Aleatória
     * Seleciona um versículo da lista e o exibe na tela.
     */
    const messageObj = messages[Math.floor(Math.random() * messages.length)];
    const msgEl = document.getElementById('biblical-message');
    const refEl = document.getElementById('biblical-reference');
    
    if (msgEl) msgEl.textContent = `"${messageObj.text}"`;
    if (refEl) refEl.textContent = messageObj.ref;

    /**
     * Redirecionamento Automático
     * Após 5 segundos, o usuário é enviado de volta para a página inicial.
     */
    setTimeout(() => {
        window.location.href = '/';
    }, 5000);
});
