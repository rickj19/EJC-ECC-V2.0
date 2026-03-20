/**
 * Arquivo: public/js/painel-admin.js
 * Descrição: Lógica do painel administrativo para gestão de inscritos via Supabase.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicializa os ícones Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // 2. Verifica se o usuário está logado como administrador
    // NOTA: Em um sistema real, isso deve ser validado no servidor ou via JWT.
    const usuarioLogado = JSON.parse(localStorage.getItem('usuario_logado'));
    if (!usuarioLogado || usuarioLogado.tipo !== 'admin') {
        console.warn('Acesso não autorizado. Redirecionando para o login...');
        window.location.href = '/login.html?tipo=admin';
        return;
    }

    // 3. Referências aos elementos do DOM
    const listaInscritos = document.getElementById('lista-inscritos');
    const filtroTipo = document.getElementById('filtro-tipo');
    const btnRefresh = document.getElementById('btn-refresh');
    const btnLogout = document.getElementById('btn-logout');
    
    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');
    const errorState = document.getElementById('error-state');
    const errorMessage = document.getElementById('error-message');

    // Variável para armazenar todos os inscritos (cache local para filtragem rápida)
    let todosInscritos = [];

    /**
     * Função para buscar inscritos do Supabase
     */
    async function buscarInscritos() {
        // Mostra estado de carregamento
        loadingState.classList.remove('hidden');
        emptyState.classList.add('hidden');
        errorState.classList.add('hidden');
        
        // Limpa a lista atual (mantendo apenas os estados)
        const cards = listaInscritos.querySelectorAll('.inscrito-card');
        cards.forEach(card => card.remove());

        try {
            if (!window.supabaseClient) {
                throw new Error('Cliente Supabase não inicializado. Verifique as chaves no arquivo js/supabase.js');
            }

            // Busca os dados na tabela 'inscricoes' (ou 'inscrições')
            // Tentamos primeiro 'inscricoes' (sem acento) que é o padrão mais comum em bancos de dados
            let { data, error } = await window.supabaseClient
                .from('inscricoes')
                .select('*')
                .order('created_at', { ascending: false });

            // Se der erro, tentamos com acento 'inscrições'
            if (error && error.code === 'P0001') { // Erro de tabela não encontrada
                 const result = await window.supabaseClient
                    .from('inscrições')
                    .select('*')
                    .order('created_at', { ascending: false });
                 data = result.data;
                 error = result.error;
            }

            if (error) throw error;

            todosInscritos = data || [];
            
            // Aplica o filtro atual
            filtrarERenderizar();

        } catch (err) {
            console.error('Erro ao buscar inscritos:', err);
            loadingState.classList.add('hidden');
            errorState.classList.remove('hidden');
            errorMessage.textContent = err.message || 'Erro desconhecido ao acessar o banco de dados.';
        }
    }

    /**
     * Função para filtrar e renderizar os cards na tela
     */
    function filtrarERenderizar() {
        const tipoSelecionado = filtroTipo.value;
        
        // Filtra os dados
        const inscritosFiltrados = todosInscritos.filter(inscrito => {
            if (tipoSelecionado === 'todos') return true;
            // Verifica campo 'tipo' ou 'tipo_encontro'
            const tipoInscrito = (inscrito.tipo || inscrito.tipo_encontro || '').toLowerCase();
            return tipoInscrito === tipoSelecionado;
        });

        // Esconde carregamento
        loadingState.classList.add('hidden');

        // Verifica se há resultados
        if (inscritosFiltrados.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');

        // Renderiza cada inscrito
        inscritosFiltrados.forEach(inscrito => {
            const card = criarCardInscrito(inscrito);
            listaInscritos.appendChild(card);
        });

        // Recria os ícones Lucide nos novos cards
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Cria o elemento HTML do card de um inscrito
     */
    function criarCardInscrito(inscrito) {
        const div = document.createElement('div');
        div.className = 'inscrito-card animate-fade-in';
        
        // Formata a data
        const dataCadastro = inscrito.created_at 
            ? new Date(inscrito.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : 'Data não disponível';

        // Determina o tipo (EJC ou ECC)
        const tipo = (inscrito.tipo || inscrito.tipo_encontro || 'EJC').toUpperCase();
        const badgeClass = tipo === 'ECC' ? 'badge-ecc' : 'badge-ejc';

        div.innerHTML = `
            <div class="inscrito-foto-container">
                <img src="${inscrito.foto_url || 'https://picsum.photos/seed/church/400/300'}" 
                     alt="Foto de ${inscrito.nome}" 
                     class="inscrito-foto"
                     referrerpolicy="no-referrer">
                <span class="badge-tipo ${badgeClass}">${tipo}</span>
            </div>
            <div class="inscrito-info">
                <h3 class="inscrito-nome">${inscrito.nome || 'Sem Nome'}</h3>
                
                <div class="inscrito-detalhe">
                    <i data-lucide="phone" class="w-4 h-4"></i>
                    <span>${inscrito.telefone || 'Sem Telefone'}</span>
                </div>
                
                <div class="inscrito-detalhe">
                    <i data-lucide="calendar" class="w-4 h-4"></i>
                    <span>Cadastrado em: ${dataCadastro}</span>
                </div>

                <div class="mt-auto pt-4 border-t border-brown-medium/10 flex justify-between items-center">
                    <span class="text-[10px] uppercase tracking-widest text-brown-medium/60">ID: ${inscrito.id ? inscrito.id.substring(0, 8) : '---'}</span>
                    <button class="text-gold-soft hover:text-brown-dark transition-colors" title="Ver Detalhes">
                        <i data-lucide="external-link" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;
        
        return div;
    }

    // 4. Event Listeners
    
    // Filtro de tipo
    filtroTipo.addEventListener('change', () => {
        // Limpa cards atuais antes de refiltrar
        const cards = listaInscritos.querySelectorAll('.inscrito-card');
        cards.forEach(card => card.remove());
        filtrarERenderizar();
    });

    // Botão de Atualizar
    btnRefresh.addEventListener('click', () => {
        buscarInscritos();
    });

    // Botão de Logout
    btnLogout.addEventListener('click', () => {
        if (confirm('Deseja realmente sair do painel administrativo?')) {
            localStorage.removeItem('usuario_logado');
            window.location.href = '/';
        }
    });

    // 5. Busca inicial de dados
    buscarInscritos();
});
