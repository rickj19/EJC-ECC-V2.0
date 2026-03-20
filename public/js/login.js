/**
 * Arquivo: public/js/login.js
 * Descrição: Lógica de autenticação e redirecionamento para os painéis específicos.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa os ícones Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Captura os parâmetros da URL para identificar o tipo de login (ejc, ecc ou admin)
    const urlParams = new URLSearchParams(window.location.search);
    const tipo = urlParams.get('tipo') || 'ejc';
    const badge = document.getElementById('type-badge');
    const errorMsg = document.getElementById('error-message');

    // Aplica o tema visual baseado no tipo de login
    document.body.classList.add(`theme-${tipo}`);
    if (badge) {
        badge.textContent = tipo.toUpperCase();
    }

    // Referência ao formulário de login
    const form = document.getElementById('login-form');
    if (form) {
        /**
         * Evento: Submit do Formulário
         * Descrição: Processa a tentativa de login do usuário.
         */
        form.addEventListener('submit', (e) => {
            // Previne o comportamento padrão de recarregar a página
            e.preventDefault();
            
            // Oculta mensagem de erro anterior, se houver
            if (errorMsg) errorMsg.classList.add('hidden');

            // Captura os dados inseridos pelo usuário
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            // Referência ao botão de submissão para feedback visual
            const submitBtn = document.getElementById('submit-btn');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Autenticando...';
            }

            /**
             * Lógica de Autenticação (Simulação)
             * Aqui seria feita a chamada ao Supabase ou outro backend.
             * Para fins de demonstração, aceitamos qualquer usuário/senha.
             */
            setTimeout(() => {
                // Simulação de validação bem-sucedida
                const loginSucesso = true; 

                if (loginSucesso) {
                    /**
                     * Armazena o estado de login no localStorage para persistência
                     * e verificação nos painéis restritos.
                     */
                    const dadosUsuario = {
                        username: username,
                        tipo: tipo,
                        dataLogin: new Date().toISOString()
                    };
                    localStorage.setItem('usuario_logado', JSON.stringify(dadosUsuario));

                    /**
                     * Redirecionamento Pós-Login:
                     * O usuário é enviado para o painel correspondente ao seu tipo.
                     */
                    if (tipo === 'ejc') {
                        window.location.href = 'painel-ejc.html';
                    } else if (tipo === 'ecc') {
                        window.location.href = 'painel-ecc.html';
                    } else if (tipo === 'admin') {
                        window.location.href = 'painel-admin.html';
                    } else {
                        // Caso o tipo seja desconhecido, volta para a home por segurança
                        window.location.href = '/';
                    }
                } else {
                    // Caso o login falhe, exibe mensagem de erro e reabilita o botão
                    if (errorMsg) errorMsg.classList.remove('hidden');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Entrar';
                    }
                }
            }, 1500);
        });
    }
});
