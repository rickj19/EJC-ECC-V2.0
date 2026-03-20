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
    lucide.createIcons();

    const messageObj = messages[Math.floor(Math.random() * messages.length)];
    document.getElementById('biblical-message').textContent = `"${messageObj.text}"`;
    document.getElementById('biblical-reference').textContent = messageObj.ref;

    // Automatic redirect after 5 seconds
    setTimeout(() => {
        window.location.href = '/';
    }, 5000);
});
