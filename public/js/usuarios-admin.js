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

    /**
     * Função para carregar e listar os usuários cadastrados
     */
    async function carregarUsuarios() {
        try {
            const { data, error } = await window.supabaseClient
                .from('usuarios')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            listaUsuarios.innerHTML = '';

            if (data.length === 0) {
                listaUsuarios.innerHTML = '<p class="text-center py-8 text-cream/40">Nenhum usuário cadastrado.</p>';
                return;
            }

            data.forEach(usuario => {
                const div = document.createElement('div');
                div.className = 'user-list-item';
                
                const badgeClass = usuario.tipo === 'admin' ? 'type-admin' : (usuario.tipo === 'ejc' ? 'type-ejc' : 'type-ecc');
                
                div.innerHTML = `
                    <div class="flex flex-col">
                        <span class="text-brown-dark font-bold text-sm">${usuario.nome}</span>
                        <span class="text-brown-medium text-xs">${usuario.email}</span>
                        <div class="mt-1">
                            <span class="user-type-badge ${badgeClass}">${usuario.tipo.toUpperCase()}</span>
                        </div>
                    </div>
                    <button class="btn-excluir p-2 text-red-600 hover:bg-red-50 rounded-full transition-all" data-id="${usuario.id}">
                        <i data-lucide="trash-2" class="w-5 h-5"></i>
                    </button>
                `;
                listaUsuarios.appendChild(div);
            });

            // Re-inicializa os ícones Lucide
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            // Adiciona evento de exclusão
            document.querySelectorAll('.btn-excluir').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    if (confirm('Deseja realmente excluir este usuário?')) {
                        await excluirUsuario(id);
                    }
                });
            });

        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            listaUsuarios.innerHTML = '<p class="text-center py-8 text-red-400">Erro ao carregar lista de usuários.</p>';
        }
    }

    /**
     * Função para cadastrar um novo usuário
     */
    formUsuario.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btnSubmit = formUsuario.querySelector('button[type="submit"]');
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i data-lucide="loader" class="w-5 h-5 animate-spin"></i> Salvando...';
        if (typeof lucide !== 'undefined') lucide.createIcons();

        const novoUsuario = {
            nome: document.getElementById('nome').value,
            email: document.getElementById('email').value,
            senha: document.getElementById('senha').value,
            tipo: document.getElementById('tipo').value
        };

        try {
            const { error } = await window.supabaseClient
                .from('usuarios')
                .insert([novoUsuario]);

            if (error) throw error;

            alert('Usuário cadastrado com sucesso!');
            formUsuario.reset();
            carregarUsuarios();
        } catch (error) {
            console.error('Erro ao cadastrar usuário:', error);
            alert('Erro ao cadastrar usuário: ' + error.message);
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<i data-lucide="save" class="w-5 h-5"></i> Salvar Usuário';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    });

    /**
     * Função para excluir um usuário
     */
    async function excluirUsuario(id) {
        try {
            const { error } = await window.supabaseClient
                .from('usuarios')
                .delete()
                .eq('id', id);

            if (error) throw error;

            alert('Usuário excluído com sucesso!');
            carregarUsuarios();
        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            alert('Erro ao excluir usuário: ' + error.message);
        }
    }

    // Carrega a lista inicial
    carregarUsuarios();
});
