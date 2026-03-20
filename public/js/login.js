/**
 * Arquivo: public/js/login.js
 * Descrição: Lógica de autenticação e redirecionamento para os painéis específicos.
 * 
 * Este arquivo gerencia o login de Administradores, EJC e ECC.
 * Ele utiliza o cliente Supabase inicializado em supabase.js.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa os ícones Lucide para a interface
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Captura os parâmetros da URL para identificar o tipo de login (ejc, ecc ou admin)
    // Exemplo: login.html?tipo=admin
    const urlParams = new URLSearchParams(window.location.search);
    const tipoUrl = urlParams.get('tipo') || 'ejc'; // Default para ejc se não houver parâmetro
    
    const badge = document.getElementById('type-badge');
    const errorMsg = document.getElementById('error-message');
    const form = document.getElementById('login-form');
    const submitBtn = document.getElementById('submit-btn');

    console.log(`LOG [Login]: Tela iniciada. Tipo detectado na URL: ${tipoUrl}`);

    // Aplica o tema visual e o texto do badge baseado no tipo de login
    document.body.classList.add(`theme-${tipoUrl}`);
    if (badge) {
        badge.textContent = tipoUrl.toUpperCase();
    }

    if (form) {
        /**
         * Evento: Submit do Formulário
         * Descrição: Processa a tentativa de login.
         */
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Limpa mensagens de erro anteriores
            if (errorMsg) errorMsg.classList.add('hidden');

            // Captura as credenciais digitadas
            const email = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            console.log(`LOG [Login]: Tentativa de login iniciada.`);
            console.log(`LOG [Login]: E-mail digitado: ${email}`);

            // 1. Bloqueia o botão para evitar cliques duplos e mostra estado de carregamento
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Autenticando...';
            }

            try {
                // 2. Validação de segurança: Verifica se o Supabase está disponível
                if (!window.supabaseClient) {
                    console.error('ERRO [Login]: window.supabaseClient está indefinido.');
                    throw new Error('Erro de conexão: O sistema de banco de dados não foi carregado.');
                }

                /**
                 * MAPEAMENTO DE REGRAS DE ACESSO
                 * Com base no tipo da URL, definimos o que buscar no banco de dados.
                 * 
                 * - admin -> tipo_acesso = "geral" (e perfil = "admin")
                 * - ejc   -> tipo_acesso = "ejc"
                 * - ecc   -> tipo_acesso = "ecc"
                 */
                let tipoAcessoEsperado = tipoUrl;
                let perfilEsperado = null;

                if (tipoUrl === 'admin') {
                    tipoAcessoEsperado = 'geral';
                    perfilEsperado = 'admin';
                }

                console.log(`LOG [Login]: Mapeamento: URL(${tipoUrl}) -> Banco(tipo_acesso: ${tipoAcessoEsperado}, perfil: ${perfilEsperado || 'qualquer'})`);

                // 3. Montagem da consulta ao Supabase
                console.log('LOG [Login]: Enviando consulta ao Supabase...');
                
                let query = window.supabaseClient
                    .from('usuarios')
                    .select('id, nome, email, perfil, tipo_acesso, senha')
                    .eq('email', email)
                    .eq('senha', password) // Nota: Em produção, senhas devem ser hasheadas
                    .eq('tipo_acesso', tipoAcessoEsperado);

                // Se houver um perfil específico (como admin), adicionamos o filtro
                if (perfilEsperado) {
                    query = query.eq('perfil', perfilEsperado);
                }

                // Executa a consulta esperando um único registro
                const { data, error } = await query.single();

                // 4. Tratamento da resposta
                console.log('LOG [Login]: Resposta recebida do Supabase.');
                
                if (error) {
                    console.error('ERRO [Supabase]:', error);

                    // TRATAMENTO DE ERRO TEMPORÁRIO (Schema Cache / 503)
                    // PGRST002: Could not query the database for the schema cache. Retrying.
                    if (error.code === 'PGRST002' || error.status === 503) {
                        console.warn('AVISO [Login]: Supabase retornou erro 503/PGRST002 (Indisponibilidade temporária).');
                        throw new Error('O Supabase está temporariamente indisponível. Tente novamente em instantes.');
                    }

                    // Erro PGRST116 significa que nenhum registro foi encontrado
                    if (error.code === 'PGRST116') {
                        throw new Error('Usuário ou senha incorretos para este tipo de acesso.');
                    }
                    throw new Error(`Erro na consulta: ${error.message}`);
                }

                if (!data) {
                    console.warn('AVISO [Login]: Nenhum dado retornado, mas sem erro explícito.');
                    throw new Error('Credenciais inválidas.');
                }

                console.log('LOG [Login]: Usuário autenticado com sucesso:', data.nome);

                // 5. Armazenamento da sessão
                // Guardamos os dados no localStorage para uso nos painéis internos
                // O AuthGuard usará esses dados para validar o acesso às páginas.
                const dadosSessao = {
                    id: data.id,
                    nome: data.nome,
                    email: data.email,
                    perfil: data.perfil,
                    tipo_acesso: data.tipo_acesso,
                    timestamp: new Date().getTime()
                };
                localStorage.setItem('usuario_logado', JSON.stringify(dadosSessao));

                // 6. Decisão de Redirecionamento
                // Redirecionamos para a página correta baseada no perfil e tipo_acesso
                let paginaDestino = 'index.html';
                if (data.perfil === 'admin' && data.tipo_acesso === 'geral') {
                    paginaDestino = 'painel-admin.html';
                } else if (data.tipo_acesso === 'ejc') {
                    paginaDestino = 'painel-ejc.html';
                } else if (data.tipo_acesso === 'ecc') {
                    paginaDestino = 'painel-ecc.html';
                }

                console.log(`LOG [Login]: Redirecionando para: ${paginaDestino}`);
                window.location.href = paginaDestino;

            } catch (error) {
                console.error('ERRO [Login]:', error.message);
                
                // Exibe o erro na interface para o usuário
                if (errorMsg) {
                    errorMsg.textContent = error.message;
                    errorMsg.classList.remove('hidden');
                }
            } finally {
                // 7. RESTAURAÇÃO DO BOTÃO (Garante que nunca fique travado)
                console.log('LOG [Login]: Finalizando processo. Restaurando botão.');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Entrar';
                }
            }
        });
    }
});
