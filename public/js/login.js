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
         * Descrição: Processa a tentativa de login do usuário consultando o Supabase.
         */
        form.addEventListener('submit', async (e) => {
            // Previne o comportamento padrão de recarregar a página
            e.preventDefault();
            
            // Oculta mensagem de erro anterior, se houver
            if (errorMsg) errorMsg.classList.add('hidden');

            // Captura os dados inseridos pelo usuário
            const email = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            // Referência ao botão de submissão para feedback visual
            const submitBtn = document.getElementById('submit-btn');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Autenticando...';
            }

            try {
                console.log(`LOG: Tentativa de login para: ${email} (Tipo: ${tipo})`);

                /**
                 * Lógica de Autenticação Real com Supabase
                 * Consultamos a tabela 'usuarios' filtrando por email, senha e tipo_acesso.
                 */
                let query = window.supabaseClient
                    .from('usuarios')
                    .select('id, nome, email, perfil, tipo_acesso')
                    .eq('email', email)
                    .eq('senha', password);

                // Se for login de admin, o tipo_acesso no banco é 'geral'
                if (tipo === 'admin') {
                    query = query.eq('tipo_acesso', 'geral').eq('perfil', 'admin');
                } else {
                    // Para EJC ou ECC, o tipo_acesso deve bater com o parâmetro da URL
                    query = query.eq('tipo_acesso', tipo);
                }

                const { data, error } = await query.single();

                if (error || !data) {
                    console.error('ERRO na autenticação:', error);
                    throw new Error('E-mail ou senha incorretos para este tipo de acesso.');
                }

                console.log('LOG: Login bem-sucedido:', data);

                /**
                 * Armazena o estado de login no localStorage para persistência
                 * e verificação nos painéis restritos.
                 * Mantemos a propriedade 'tipo' para compatibilidade com os painéis existentes.
                 */
                const dadosUsuario = {
                    id: data.id,
                    nome: data.nome,
                    email: data.email,
                    perfil: data.perfil,
                    tipo_acesso: data.tipo_acesso,
                    tipo: tipo, // 'admin', 'ejc' ou 'ecc' (conforme URL)
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
                    window.location.href = '/';
                }

            } catch (error) {
                console.error('ERRO no processo de login:', error);
                // Caso o login falhe, exibe mensagem de erro e reabilita o botão
                if (errorMsg) {
                    errorMsg.textContent = error.message || 'Erro ao realizar login.';
                    errorMsg.classList.remove('hidden');
                }
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Entrar';
                }
            }
        });
    }
});
