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
    const filtroPerfil = document.getElementById('filtro-perfil');
    const buscaNome = document.getElementById('busca-nome');
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
     * Como a busca é feita:
     * - Utilizamos o cliente Supabase para selecionar todos os campos da tabela 'inscricoes'.
     * - Ordenamos por 'created_at' descendente para mostrar os mais recentes primeiro.
     * - Implementamos uma resiliência para tentar buscar na tabela com acento caso a padrão falhe.
     */
    async function buscarInscritos() {
        // Mostra estado de carregamento visual
        loadingState.classList.remove('hidden');
        emptyState.classList.add('hidden');
        errorState.classList.add('hidden');
        
        // Limpa a lista atual de cards para evitar duplicidade
        const cards = listaInscritos.querySelectorAll('.inscrito-card');
        cards.forEach(card => card.remove());

        try {
            if (!window.supabaseClient) {
                throw new Error('Cliente Supabase não inicializado. Verifique as chaves no arquivo js/supabase.js');
            }

            // Busca todos os campos (*) para garantir sincronia com a estrutura real
            let { data, error } = await window.supabaseClient
                .from('inscricoes')
                .select('*')
                .order('created_at', { ascending: false });

            // Tratamento de Resiliência: Se a tabela 'inscricoes' não existir, tenta 'inscrições'
            if (error && error.code === 'P0001') { 
                 console.warn('LOG: Tabela "inscricoes" não encontrada, tentando "inscrições"...');
                 const result = await window.supabaseClient
                    .from('inscrições')
                    .select('*')
                    .order('created_at', { ascending: false });
                 data = result.data;
                 error = result.error;
            }

            if (error) throw error;

            // Armazena no cache local para filtragem sem novas requisições
            todosInscritos = data || [];
            
            // Renderiza os dados aplicando os filtros selecionados
            filtrarERenderizar();

        } catch (err) {
            console.error('ERRO CRÍTICO NO PAINEL:', err);
            loadingState.classList.add('hidden');
            errorState.classList.remove('hidden');
            errorMessage.textContent = err.message || 'Erro ao carregar dados do Supabase.';
        }
    }

    /**
     * Função para filtrar e renderizar os cards na tela
     * Como os filtros funcionam:
     * - Pegamos os valores atuais dos seletores (tipo e perfil) e do campo de busca.
     * - Filtramos o array 'todosInscritos' (cache local) com base nesses critérios.
     * - Isso permite uma resposta instantânea na interface sem sobrecarregar o banco.
     */
    function filtrarERenderizar() {
        const tipoSelecionado = filtroTipo.value;
        const perfilSelecionado = filtroPerfil.value;
        const termoBusca = buscaNome.value.toLowerCase().trim();
        
        // Filtra os dados localmente
        const inscritosFiltrados = todosInscritos.filter(inscrito => {
            // Filtro por Tipo (EJC/ECC)
            const matchesTipo = tipoSelecionado === 'todos' || 
                               (inscrito.tipo || inscrito.tipo_encontro || '').toLowerCase() === tipoSelecionado;
            
            // Filtro por Perfil (Jovem/Casal)
            const matchesPerfil = perfilSelecionado === 'todos' || 
                                 (inscrito.perfil || '').toLowerCase() === perfilSelecionado;
            
            // Busca por Nome (Case Insensitive)
            const matchesNome = !termoBusca || 
                               (inscrito.nome || '').toLowerCase().includes(termoBusca);

            return matchesTipo && matchesPerfil && matchesNome;
        });

        // Esconde carregamento
        loadingState.classList.add('hidden');

        // Limpa cards atuais antes de renderizar os novos resultados
        const cardsExistentes = listaInscritos.querySelectorAll('.inscrito-card');
        cardsExistentes.forEach(card => card.remove());

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
     * Como os cards são renderizados:
     * - Criamos um elemento div dinamicamente.
     * - Injetamos o HTML com as classes de estilo da Paróquia.
     * - Exibimos todos os dados: foto, nome, telefone, tipo, perfil, cidade, paróquia e data.
     */
    function criarCardInscrito(inscrito) {
        const div = document.createElement('div');
        div.className = 'inscrito-card animate-fade-in';
        
        // Formata a data de criação do registro
        const dataCadastro = inscrito.created_at 
            ? new Date(inscrito.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : 'Data não disponível';

        // Determina o tipo (EJC ou ECC) para o badge superior
        const tipo = (inscrito.tipo || inscrito.tipo_encontro || 'EJC').toUpperCase();
        const badgeClass = tipo === 'ECC' ? 'badge-ecc' : 'badge-ejc';
        
        // Perfil formatado (Jovem ou Casal)
        const perfilDisplay = inscrito.perfil ? inscrito.perfil.charAt(0).toUpperCase() + inscrito.perfil.slice(1) : 'Não informado';

        div.innerHTML = `
            <div class="inscrito-foto-container">
                <img src="${inscrito.foto_url || 'https://picsum.photos/seed/church/400/300'}" 
                     alt="Foto de ${inscrito.nome}" 
                     class="inscrito-foto"
                     referrerpolicy="no-referrer">
                <span class="badge-tipo ${badgeClass}">${tipo}</span>
            </div>
            <div class="inscrito-info">
                <h3 class="inscrito-nome truncate" title="${inscrito.nome}">${inscrito.nome || 'Sem Nome'}</h3>
                
                <!-- Perfil (Jovem/Casal) -->
                <div class="inscrito-detalhe">
                    <i data-lucide="user" class="w-4 h-4 text-brown-medium/60"></i>
                    <span class="font-bold text-[10px] uppercase tracking-widest text-brown-medium">${perfilDisplay}</span>
                </div>

                <!-- Telefone -->
                <div class="inscrito-detalhe">
                    <i data-lucide="phone" class="w-4 h-4 text-brown-medium/60"></i>
                    <span class="font-medium">${inscrito.telefone || 'Sem Telefone'}</span>
                </div>
                
                <!-- Localização: Cidade e Paróquia -->
                <div class="inscrito-detalhe">
                    <i data-lucide="map-pin" class="w-4 h-4 text-brown-medium/60"></i>
                    <span class="text-xs text-brown-medium/80">${inscrito.cidade || 'Cidade N/I'} • ${inscrito.paroquia || 'Paróquia N/I'}</span>
                </div>

                <!-- Data de Cadastro -->
                <div class="inscrito-detalhe mt-2">
                    <i data-lucide="calendar" class="w-4 h-4 text-brown-medium/40"></i>
                    <span class="text-[10px] text-brown-medium/60 italic">Inscrito em: ${dataCadastro}</span>
                </div>

                <!-- Rodapé do Card com ID -->
                <div class="mt-auto pt-4 border-t border-brown-medium/10 flex justify-between items-center">
                    <span class="text-[9px] uppercase tracking-widest text-brown-medium/40 font-mono">ID: ${inscrito.id ? inscrito.id.substring(0, 8) : '---'}</span>
                    <div class="flex gap-2">
                        <button class="p-1.5 text-brown-medium/40 hover:text-gold-soft transition-colors" title="Ver Detalhes">
                            <i data-lucide="external-link" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        return div;
    }

    // 4. Event Listeners
    
    // Filtros e Busca: Disparam a filtragem local instantânea
    filtroTipo.addEventListener('change', filtrarERenderizar);
    filtroPerfil.addEventListener('change', filtrarERenderizar);
    buscaNome.addEventListener('input', filtrarERenderizar);

    // Botão de Atualizar: Força uma nova busca no banco de dados
    btnRefresh.addEventListener('click', () => {
        console.log('LOG: Atualizando lista de inscritos...');
        buscarInscritos();
    });

    /**
     * Como o logout funciona:
     * - Removemos a chave 'usuario_logado' do localStorage para invalidar a sessão local.
     * - Redirecionamos o usuário para a página inicial (index.html).
     */
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('usuario_logado');
            console.log('LOG: Logout realizado com sucesso.');
            window.location.href = '/';
        });
    }

    // 5. Busca inicial de dados
    buscarInscritos();
});
