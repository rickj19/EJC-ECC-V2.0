document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type') || 'ejc';
    const badge = document.getElementById('type-badge');
    const form = document.getElementById('cadastro-form');
    const photoInput = document.getElementById('foto');
    const photoPreview = document.getElementById('photo-preview');
    const photoPreviewContainer = document.getElementById('photo-preview-container');
    const photoPlaceholder = document.getElementById('photo-placeholder');

    document.body.classList.add(`theme-${type}`);
    badge.textContent = `INSCRIÇÃO ${type.toUpperCase()}`;

    // Photo preview logic
    photoInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                photoPreview.src = e.target.result;
                photoPreviewContainer.classList.remove('hidden');
                photoPlaceholder.classList.add('hidden');
            }
            reader.readAsDataURL(file);
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('submit-btn');
        btn.disabled = true;
        btn.textContent = 'Enviando ficha...';

        // Simulate upload/save
        setTimeout(() => {
            window.location.href = '/sucesso.html?action=cadastro&type=' + type;
        }, 2000);
    });
});
