document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type') || 'ejc';
    const badge = document.getElementById('type-badge');
    const submitBtn = document.getElementById('submit-btn');

    document.body.classList.add(`theme-${type}`);
    badge.textContent = type.toUpperCase();

    const form = document.getElementById('login-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Mock login
        const btn = document.getElementById('submit-btn');
        btn.disabled = true;
        btn.textContent = 'Autenticando...';

        setTimeout(() => {
            window.location.href = '/sucesso.html?action=login&type=' + type;
        }, 1500);
    });
});
