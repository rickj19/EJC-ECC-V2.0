/**
 * Arquivo: public/js/usuarios-admin.js
 * Descrição: Lógica para gerenciamento de usuários de acesso ao sistema.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicializa os ícones Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // 2. Verifica se o usuário está logado como administrador
    const usuarioLogado = JSON.parse(localStorage.getItem('usuario_logado'));
    if (!usuarioLogado || usuarioLogado.tipo !== 'admin') {
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
     * Função para exibir mensagens de feedback
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
        // Oculta após 5 segundos
        setTimeout(() => {
            msgSucesso.classList.add('hidden');
            msgErro.classList.add('hidden');
        }, 5000);
    }

    /**
     * Função para carregar e listar os usuários cadastrados
     * 
     * COMO A LISTAGEM FUNCIONA:
     * 1. Fazemos um SELECT na tabela 'usuarios' buscando as colunas reais.
     * 2. Ordenamos pelos mais recentes.
     * 3. Iteramos sobre os dados e criamos elementos HTML dinamicamente.
     * 4. Usamos 'perfil' e 'tipo_acesso' para montar os badges visuais.
     */
    async function carregarUsuarios() {
        console.log('LOG: Iniciando carregamento de usuários...');
        try {
            const { data, error } = await window.supabaseClient
                .from('usuarios')
                .select('id, nome, email, perfil, tipo_acesso, created_at')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('ERRO na listagem:', error);
                throw error;
            }

            console.log('RESPOSTA da listagem:', data);
            listaUsuarios.innerHTML = '';

            if (data.length === 0) {
                listaUsuarios.innerHTML = '<p class="text-center py-8 text-cream/40">Nenhum usuário cadastrado.</p>';
                return;
            }

            data.forEach(usuario => {
                const div = document.createElement('div');
                div.className = 'user-list-item';
                
                // Lógica de cores baseada no tipo_acesso e perfil
                // Admin ganha cor de destaque, coordenadores ganham cores do EJC ou ECC
                const badgeClass = usuario.perfil === 'admin' ? 'type-admin' : (usuario.tipo_acesso === 'ejc' ? 'type-ejc' : 'type-ecc');
                
                div.innerHTML = `
                    <div class="flex flex-col">
                        <span class="text-brown-dark font-bold text-sm">${usuario.nome}</span>
                        <span class="text-brown-medium text-xs">${usuario.email}</span>
                        <div class="mt-1 flex gap-2">
                            <span class="user-type-badge ${badgeClass}">${usuario.perfil.toUpperCase()}</span>
                            <span class="text-[10px] bg-brown-dark/10 text-brown-dark px-2 py-0.5 rounded font-bold uppercase">${usuario.tipo_acesso}</span>
                        </div>
                    </div>
                    <button class="btn-excluir p-2 text-red-600 hover:bg-red-50 rounded-full transition-all" data-id="${usuario.id}">
                        <i data-lucide="trash-2" class="w-5 h-5"></i>
                    </button>
                `;
                listaUsuarios.appendChild(div);
            });

            // Re-inicializa os ícones Lucide para os novos elementos
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            // Adiciona evento de exclusão para cada botão da lista
            document.querySelectorAll('.btn-excluir').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    if (confirm('Deseja realmente excluir este usuário?')) {
                        console.log(`LOG: Excluindo usuário ID: ${id}`);
                        await excluirUsuario(id);
                    }
                });
            });

        } catch (error) {
            console.error('ERRO ao carregar usuários:', error);
            listaUsuarios.innerHTML = '<p class="text-center py-8 text-red-400">Erro ao carregar lista de usuários.</p>';
        }
    }

    /**
     * Função para cadastrar um novo usuário
     * 
     * DIFERENÇA ENTRE PERFIL E TIPO_ACESSO:
     * - 'perfil': Define o nível hierárquico (admin ou coordenador).
     * - 'tipo_acesso': Define a qual grupo o usuário pertence (ejc, ecc ou geral).
     * 
     * COMO O VALOR DO SELECT É TRANSFORMADO:
     * - Se selecionar 'ejc' -> perfil='coordenador', tipo_acesso='ejc'
     * - Se selecionar 'ecc' -> perfil='coordenador', tipo_acesso='ecc'
     * - Se selecionar 'admin' -> perfil='admin', tipo_acesso='geral'
     * 
     * COMO O INSERT FUNCIONA:
     * 1. Captura os valores do formulário.
     * 2. Aplica a regra de negócio para definir perfil e tipo_acesso.
     * 3. Envia o objeto completo para a tabela 'usuarios' do Supabase.
     */
    async function salvarUsuario() {
        const tipoSelecionado = document.getElementById('tipo').value;
        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;

        // Validação básica
        if (!nome || !email || !senha) {
            exibirMensagem('erro', 'Por favor, preencha todos os campos.');
            return;
        }

        console.log('LOG: Tipo selecionado no formulário:', tipoSelecionado);

        // REGRA DE NEGÓCIO: Mapeamento de perfil e tipo_acesso
        let perfil = '';
        let tipo_acesso = '';

        if (tipoSelecionado === 'ejc') {
            perfil = 'coordenador';
            tipo_acesso = 'ejc';
        } else if (tipoSelecionado === 'ecc') {
            perfil = 'coordenador';
            tipo_acesso = 'ecc';
        } else if (tipoSelecionado === 'admin') {
            perfil = 'admin';
            tipo_acesso = 'geral';
        }

        console.log('LOG: Perfil calculado:', perfil);
        console.log('LOG: Tipo Acesso calculado:', tipo_acesso);

        const novoUsuario = {
            nome,
            email,
            senha,
            perfil,
            tipo_acesso
        };

        console.log('LOG: Objeto enviado ao insert:', novoUsuario);

        // Feedback visual no botão (Loading)
        btnSalvar.disabled = true;
        btnSalvar.innerHTML = '<i data-lucide="loader" class="w-5 h-5 animate-spin"></i> Salvando...';
        if (typeof lucide !== 'undefined') lucide.createIcons();

        try {
            const { data, error } = await window.supabaseClient
                .from('usuarios')
                .insert([novoUsuario])
                .select();

            if (error) {
                console.error('ERRO do insert:', error);
                throw error;
            }

            console.log('RESPOSTA do insert:', data);
            exibirMensagem('sucesso', 'Usuário cadastrado com sucesso!');
            formUsuario.reset();
            await carregarUsuarios();
        } catch (error) {
            console.error('ERRO ao cadastrar usuário:', error);
            exibirMensagem('erro', 'Erro ao cadastrar: ' + (error.message || 'Erro desconhecido'));
        } finally {
            /**
             * COMO O BOTÃO É RESTAURADO:
             * O bloco 'finally' garante que, independente de sucesso ou erro,
             * o botão volte ao seu estado original (habilitado e com texto correto).
             */
            btnSalvar.disabled = false;
            btnSalvar.innerHTML = '<i data-lucide="save" class="w-5 h-5"></i> Salvar Usuário';
            if (typeof lucide !== 'undefined') lucide.createIcons();
            console.log('LOG: Botão restaurado.');
        }
    }

    // Evento de clique no botão salvar
    btnSalvar.addEventListener('click', salvarUsuario);

    // Também trata o submit do formulário (caso o usuário aperte Enter)
    formUsuario.addEventListener('submit', (e) => {
        e.preventDefault();
        salvarUsuario();
    });

    /**
     * Função para excluir um usuário
     * 
     * COMO A EXCLUSÃO FUNCIONA:
     * 1. Recebe o ID do usuário.
     * 2. Chama o DELETE do Supabase filtrando por esse ID.
     * 3. Se sucesso, recarrega a lista para atualizar a tela.
     */
    async function excluirUsuario(id) {
        try {
            const { error } = await window.supabaseClient
                .from('usuarios')
                .delete()
                .eq('id', id);

            if (error) throw error;

            alert('Usuário excluído com sucesso!');
            await carregarUsuarios();
        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            alert('Erro ao excluir usuário: ' + error.message);
        }
    }

    // Carrega a lista inicial
    carregarUsuarios();
});
