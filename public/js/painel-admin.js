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
    
    // Novos botões de Ações Rápidas
    const btnUsuarios = document.getElementById('btn-usuarios');
    const btnNovaInscricaoEjc = document.getElementById('btn-nova-inscricao-ejc');
    const btnNovaInscricaoEcc = document.getElementById('btn-nova-inscricao-ecc');
    const btnRelatorio = document.getElementById('btn-relatorio');
    const btnAtualizar = document.getElementById('btn-atualizar');
    const btnSair = document.getElementById('btn-sair');
    
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
     * Cria o elemento HTML do card de um inscrito (Estilo Ficha 3x4)
     * Otimizado para legibilidade e economia de espaço.
     */
    function criarCardInscrito(inscrito) {
        const div = document.createElement('div');
        div.className = 'inscrito-mini-card animate-fade-in';
        
        // Formata a data de criação do registro
        const dataCadastro = inscrito.created_at 
            ? new Date(inscrito.created_at).toLocaleDateString('pt-BR')
            : 'Data N/I';

        // Determina o tipo (EJC ou ECC) para o badge superior
        const tipo = (inscrito.tipo || inscrito.tipo_encontro || 'EJC').toUpperCase();
        const badgeClass = tipo === 'ECC' ? 'bg-[#2E1F17] text-[#F5EBDD]' : 'bg-[#5C4033] text-[#F5EBDD]';
        
        // Perfil formatado (Jovem ou Casal)
        const perfilDisplay = inscrito.perfil ? inscrito.perfil.charAt(0).toUpperCase() + inscrito.perfil.slice(1) : 'Não informado';

        div.innerHTML = `
            <div class="foto-3x4-container">
                <img src="${inscrito.foto_url || 'https://picsum.photos/seed/church/300/400'}" 
                     alt="Foto de ${inscrito.nome}" 
                     class="foto-3x4"
                     referrerpolicy="no-referrer">
                <span class="badge-compacto ${badgeClass}">${tipo}</span>
            </div>
            <div class="info-compacta">
                <div>
                    <h3 class="nome-destaque truncate" title="${inscrito.nome}">${inscrito.nome || 'Sem Nome'}</h3>
                    
                    <!-- Perfil (Jovem/Casal) -->
                    <div class="dado-linha">
                        <i data-lucide="user" class="w-3 h-3"></i>
                        <span class="truncate">${perfilDisplay}</span>
                    </div>

                    <!-- Telefone -->
                    <div class="dado-linha">
                        <i data-lucide="phone" class="w-3 h-3"></i>
                        <span>${inscrito.telefone || 'Sem Telefone'}</span>
                    </div>
                    
                    <!-- Localização: Cidade -->
                    <div class="dado-linha">
                        <i data-lucide="map-pin" class="w-3 h-3"></i>
                        <span class="truncate">${inscrito.cidade || 'Cidade N/I'}</span>
                    </div>
                </div>

                <!-- Rodapé do Card com Data -->
                <div class="pt-1 border-t border-gray-100 mt-1">
                    <div class="dado-linha opacity-60">
                        <i data-lucide="calendar" class="w-2.5 h-2.5"></i>
                        <span class="text-[10px] italic">${dataCadastro}</span>
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

    // Botões de Ações Rápidas
    btnUsuarios?.addEventListener('click', () => {
        window.location.href = '/usuarios-admin.html';
    });

    btnNovaInscricaoEjc?.addEventListener('click', () => {
        window.location.href = '/cadastro.html?tipo=ejc';
    });

    btnNovaInscricaoEcc?.addEventListener('click', () => {
        window.location.href = '/cadastro.html?tipo=ecc';
    });

    btnRelatorio?.addEventListener('click', () => {
        window.location.href = '/relatorio-inscritos.html';
    });

    btnAtualizar?.addEventListener('click', () => {
        const icon = btnAtualizar.querySelector('i');
        if (icon) icon.classList.add('animate-spin');
        buscarInscritos().finally(() => {
            if (icon) setTimeout(() => icon.classList.remove('animate-spin'), 500);
        });
    });

    btnSair?.addEventListener('click', () => {
        if (confirm('Deseja realmente sair do painel administrativo?')) {
            localStorage.removeItem('usuario_logado');
            window.location.href = '/';
        }
    });

    // 5. Busca inicial de dados
    buscarInscritos();
});
