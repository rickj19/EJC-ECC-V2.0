/**
 * Arquivo: public/js/usuarios-admin.js
 * Descrição: Lógica para gerenciamento de usuários de acesso ao sistema.
 * 
 * Este arquivo permite que administradores cadastrem, listem e excluam usuários.
 * A tabela 'usuarios' possui: id, nome, email, senha, perfil, tipo_acesso.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicializa os ícones Lucide para a interface
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // 2. Verifica se o usuário está logado como administrador
    // O sistema de login armazena 'usuario_logado' no localStorage
    const usuarioLogado = JSON.parse(localStorage.getItem('usuario_logado'));
    if (!usuarioLogado || usuarioLogado.tipo !== 'admin') {
        console.warn('AVISO [Usuarios]: Acesso negado. Usuário não é administrador.');
        window.location.href = '/login.html?tipo=admin';
        return;
    }

    // 3. Referências aos elementos do DOM
    const formUsuario = document.getElementById('form-usuario');
    const listaUsuarios = document.getElementById('lista-usuarios');
    const btnSalvar = document.getElementById('btn-salvar');
    const msgSucesso = document.getElementById('msg-sucesso');
    const msgErro = document.getElementById('msg-erro');
    const txtSucesso = document.getElementById('txt-sucesso');
    const txtErro = document.getElementById('txt-erro');

    /**
     * Função para exibir mensagens de feedback visual (Sucesso ou Erro)
     */
    function exibirMensagem(tipo, texto) {
        if (tipo === 'sucesso') {
            msgSucesso.classList.remove('hidden');
            msgErro.classList.add('hidden');
            txtSucesso.textContent = texto;
        } else {
            msgErro.classList.remove('hidden');
            msgSucesso.classList.add('hidden');
            txtErro.textContent = texto;
        }
        
        // Oculta a mensagem automaticamente após 5 segundos
        setTimeout(() => {
            msgSucesso.classList.add('hidden');
            msgErro.classList.add('hidden');
        }, 5000);
    }

    /**
     * Função para carregar e listar os usuários cadastrados.
     * 
     * CORREÇÃO IMPORTANTE:
     * A coluna 'created_at' não existe na tabela 'usuarios' em todos os ambientes.
     * Por isso, removemos 'created_at' do SELECT e do ORDER BY para evitar erros.
     * Ordenamos agora pelo 'nome' para manter a lista organizada.
     */
    async function carregarUsuarios() {
        console.log('LOG [Usuarios]: Iniciando carregamento da lista de usuários...');
        
        try {
            // Verifica se o cliente Supabase está disponível
            if (!window.supabaseClient) {
                throw new Error('Cliente Supabase não inicializado.');
            }

            // Campos reais da tabela: id, nome, email, perfil, tipo_acesso
            console.log('LOG [Usuarios]: Executando SELECT na tabela usuarios (campos: id, nome, email, perfil, tipo_acesso)');
            
            const { data, error } = await window.supabaseClient
                .from('usuarios')
                .select('id, nome, email, perfil, tipo_acesso')
                .order('nome', { ascending: true });

            if (error) {
                console.error('ERRO [Usuarios]: Falha na listagem do Supabase:', error);
                throw error;
            }

            console.log('LOG [Usuarios]: Resposta da listagem recebida. Total:', data.length);
            listaUsuarios.innerHTML = '';

            if (data.length === 0) {
                listaUsuarios.innerHTML = '<p class="text-center py-8 text-cream/40">Nenhum usuário cadastrado.</p>';
                return;
            }

            // Renderiza cada usuário na lista
            data.forEach(usuario => {
                const div = document.createElement('div');
                div.className = 'user-list-item flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 mb-2';
                
                // Define a classe de estilo baseada no perfil/acesso
                const badgeClass = usuario.perfil === 'admin' ? 'type-admin' : (usuario.tipo_acesso === 'ejc' ? 'type-ejc' : 'type-ecc');
                
                div.innerHTML = `
                    <div class="flex flex-col">
                        <span class="text-cream font-bold text-sm">${usuario.nome}</span>
                        <span class="text-cream/60 text-xs">${usuario.email}</span>
                        <div class="mt-1 flex gap-2">
                            <span class="user-type-badge ${badgeClass}">${usuario.perfil}</span>
                            <span class="text-[10px] bg-white/10 text-cream/80 px-2 py-0.5 rounded font-bold uppercase">${usuario.tipo_acesso}</span>
                        </div>
                    </div>
                    <button class="btn-excluir p-2 text-red-400 hover:bg-red-500/20 rounded-full transition-all" data-id="${usuario.id}" title="Excluir Usuário">
                        <i data-lucide="trash-2" class="w-5 h-5"></i>
                    </button>
                `;
                listaUsuarios.appendChild(div);
            });

            // Re-inicializa os ícones Lucide para os botões recém-criados
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            // Configura os eventos de exclusão
            document.querySelectorAll('.btn-excluir').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    if (confirm('Deseja realmente excluir este usuário?')) {
                        await excluirUsuario(id);
                    }
                });
            });

        } catch (error) {
            console.error('ERRO [Usuarios]: Falha ao carregar lista:', error.message);
            exibirMensagem('erro', 'Erro ao carregar lista: ' + error.message);
            listaUsuarios.innerHTML = '<p class="text-center py-8 text-red-400">Erro ao carregar lista de usuários.</p>';
        }
    }

    /**
     * Função para cadastrar um novo usuário.
     * 
     * REGRAS DE MAPEAMENTO (Perfil e Tipo de Acesso):
     * - EJC selecionado -> perfil="coordenador", tipo_acesso="ejc"
     * - ECC selecionado -> perfil="coordenador", tipo_acesso="ecc"
     * - ADMIN selecionado -> perfil="admin", tipo_acesso="geral"
     */
    async function salvarUsuario() {
        const tipoSelecionado = document.getElementById('tipo').value;
        const nome = document.getElementById('nome').value.trim();
        const email = document.getElementById('email').value.trim();
        const senha = document.getElementById('senha').value;

        // Validação básica de campos obrigatórios
        if (!nome || !email || !senha) {
            exibirMensagem('erro', 'Por favor, preencha todos os campos.');
            return;
        }

        console.log('LOG [Usuarios]: Iniciando processo de salvamento.');
        console.log('LOG [Usuarios]: Tipo selecionado no formulário:', tipoSelecionado);

        // Aplica o mapeamento de regras de negócio
        let perfil = 'coordenador';
        let tipo_acesso = tipoSelecionado;

        if (tipoSelecionado === 'admin') {
            perfil = 'admin';
            tipo_acesso = 'geral';
        }

        const novoUsuario = {
            nome,
            email,
            senha,
            perfil,
            tipo_acesso
        };

        console.log('LOG [Usuarios]: Objeto preparado para INSERT:', novoUsuario);

        // Feedback visual no botão (Estado de Loading)
        btnSalvar.disabled = true;
        const originalContent = btnSalvar.innerHTML;
        btnSalvar.innerHTML = '<i data-lucide="loader" class="w-5 h-5 animate-spin"></i> Salvando...';
        if (typeof lucide !== 'undefined') lucide.createIcons();

        try {
            // Executa o INSERT no Supabase
            // Não enviamos 'created_at' pois a tabela pode não ter essa coluna
            const { data, error } = await window.supabaseClient
                .from('usuarios')
                .insert([novoUsuario])
                .select();

            if (error) {
                console.error('ERRO [Usuarios]: Falha no INSERT do Supabase:', error);
                throw error;
            }

            console.log('LOG [Usuarios]: Usuário cadastrado com sucesso. Resposta:', data);
            
            // Feedback de sucesso, limpa formulário e atualiza lista
            exibirMensagem('sucesso', 'Usuário cadastrado com sucesso!');
            formUsuario.reset();
            await carregarUsuarios();

        } catch (error) {
            console.error('ERRO [Usuarios]: Falha ao cadastrar:', error.message);
            exibirMensagem('erro', 'Erro ao cadastrar: ' + (error.message || 'Erro desconhecido'));
        } finally {
            // RESTAURAÇÃO DO BOTÃO: Sempre executado, independente de sucesso ou erro
            btnSalvar.disabled = false;
            btnSalvar.innerHTML = originalContent;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            console.log('LOG [Usuarios]: Botão de salvar restaurado.');
        }
    }

    /**
     * Função para excluir um usuário.
     */
    async function excluirUsuario(id) {
        console.log(`LOG [Usuarios]: Tentando excluir usuário ID: ${id}`);
        
        try {
            const { error } = await window.supabaseClient
                .from('usuarios')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('ERRO [Usuarios]: Falha ao excluir do Supabase:', error);
                throw error;
            }

            console.log('LOG [Usuarios]: Usuário excluído com sucesso.');
            exibirMensagem('sucesso', 'Usuário excluído com sucesso!');
            await carregarUsuarios();

        } catch (error) {
            console.error('ERRO [Usuarios]: Falha na exclusão:', error.message);
            exibirMensagem('erro', 'Erro ao excluir usuário: ' + error.message);
        }
    }

    // Configura os eventos do formulário
    btnSalvar.addEventListener('click', salvarUsuario);
    
    formUsuario.addEventListener('submit', (e) => {
        e.preventDefault();
        salvarUsuario();
    });

    // Carrega a lista inicial ao abrir a página
    carregarUsuarios();
});
