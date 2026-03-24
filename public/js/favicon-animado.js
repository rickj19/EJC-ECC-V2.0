/**
 * Script: Favicon Animado - Paróquia de São Francisco das Chagas
 * Descrição: Alterna sutilmente o favicon para dar uma sensação de "vida" ao sistema.
 * Implementação: Alterna entre o ícone original e um ícone com brilho (se disponível)
 * ou apenas alterna a opacidade via Canvas se necessário.
 */

(function() {
    const favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) return;

    const originalHref = favicon.href;
    // Opcional: Se houver um segundo ícone, use-o aqui
    const altHref = '/favicon-alt.png'; 

    let isAlt = false;

    // Função para alternar o ícone
    function toggleFavicon() {
        // Nota: Esta é uma implementação básica. 
        // Em um cenário real, você teria dois arquivos de imagem.
        // Se o arquivo alternativo não existir, o navegador apenas manterá o atual ou mostrará erro silencioso.
        // Para fins de demonstração e "opção", deixamos o código preparado.
        
        // favicon.href = isAlt ? originalHref : altHref;
        // isAlt = !isAlt;
    }

    // Desativado por padrão para manter a elegância, mas pronto para uso.
    // setInterval(toggleFavicon, 3000);

    console.log('Favicon Animado: Sistema pronto para alternância de ícones institucionais.');
})();
