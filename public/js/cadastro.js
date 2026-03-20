/**
 * Arquivo: public/js/cadastro.js
 * Descrição: Lógica para a página de inscrição, incluindo preview de foto e envio de formulário.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa os ícones Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Captura parâmetros da URL para identificar o tipo de inscrição (ejc ou ecc)
    const urlParams = new URLSearchParams(window.location.search);
    const tipo = urlParams.get('tipo') || 'ejc';
    
    // Referências aos elementos do DOM
    const badge = document.getElementById('type-badge');
    const form = document.getElementById('cadastro-form');
    const photoInput = document.getElementById('foto');
    const photoPreview = document.getElementById('photo-preview');
    const photoPreviewContainer = document.getElementById('photo-preview-container');
    const photoPlaceholder = document.getElementById('photo-placeholder');

    // Aplica o tema visual baseado no tipo (ejc ou ecc)
    document.body.classList.add(`theme-${tipo}`);
    if (badge) {
        badge.textContent = `INSCRIÇÃO ${tipo.toUpperCase()}`;
    }

    /**
     * Lógica de Preview de Foto
     * Exibe a imagem selecionada pelo usuário antes do envio.
     */
    if (photoInput) {
        photoInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    // Atualiza o src da imagem e alterna a visibilidade dos containers
                    if (photoPreview) photoPreview.src = e.target.result;
                    if (photoPreviewContainer) photoPreviewContainer.classList.remove('hidden');
                    if (photoPlaceholder) photoPlaceholder.classList.add('hidden');
                }
                reader.readAsDataURL(file);
            }
        });
    }

    /**
     * Evento: Submit do Formulário de Cadastro
     * Descrição: Envia a ficha para o Supabase e redireciona para a tela de sucesso.
     */
    if (form) {
        form.addEventListener('submit', async (e) => {
            // Previne o recarregamento da página
            e.preventDefault();
            
            // Feedback visual no botão de envio
            const btn = document.getElementById('submit-btn');
            if (btn) {
                btn.disabled = true;
                btn.textContent = 'Enviando ficha...';
            }

            try {
                if (!window.supabaseClient) {
                    throw new Error('Cliente Supabase não inicializado. Verifique as chaves no arquivo js/supabase.js');
                }

                // Captura os dados do formulário
                const nome = document.getElementById('nome').value;
                const telefone = document.getElementById('telefone').value;
                const cidade = document.getElementById('cidade').value;
                const paroquia = document.getElementById('paroquia').value;
                const fotoFile = photoInput.files[0];

                let fotoUrl = 'https://picsum.photos/seed/church/400/300'; // Fallback

                // Simulação de upload de foto (em um sistema real, usaria Supabase Storage)
                // Para este exemplo, vamos apenas simular o upload e usar uma URL placeholder
                // ou converter para base64 se for pequeno o suficiente (não recomendado para produção)
                
                // Envia os dados para a tabela 'inscricoes'
                const { error } = await window.supabaseClient
                    .from('inscricoes')
                    .insert([
                        { 
                            nome, 
                            telefone, 
                            cidade, 
                            paroquia, 
                            tipo, 
                            foto_url: fotoUrl,
                            created_at: new Date().toISOString()
                        }
                    ]);

                if (error) throw error;

                // Redireciona para sucesso.html passando o tipo original
                window.location.href = `/sucesso.html?tipo=${tipo}`;

            } catch (err) {
                console.error('Erro ao cadastrar:', err);
                alert('Ocorreu um erro ao enviar sua inscrição: ' + (err.message || 'Erro desconhecido'));
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = 'Finalizar Inscrição';
                }
            }
        });
    }
});
