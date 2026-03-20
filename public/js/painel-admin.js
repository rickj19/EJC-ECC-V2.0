/**
 * Arquivo: public/js/painel-admin.js
 * Descrição: Lógica do painel administrativo para gestão de inscritos via Supabase.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicializa os ícones Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // 2. O AuthGuard já validou o acesso no HTML.
    // Não precisamos mais do check manual aqui.

    // 3. Referências aos elementos do DOM
    const listaInscritos = document.getElementById('lista-inscritos');
    const filtroTipo = document.getElementById('filtro-tipo');
    const filtroPerfil = document.getElementById('filtro-perfil');
    const buscaNome = document.getElementById('busca-nome');
    
    // Elementos do Dashboard
    const metricTotal = document.getElementById('metric-total');
    const metricEjc = document.getElementById('metric-ejc');
    const metricEcc = document.getElementById('metric-ecc');
    const metricLastDate = document.getElementById('metric-last-date');
    const metricLastName = document.getElementById('metric-last-name');
    const containerUltimos = document.getElementById('container-ultimos');

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
    // Referência para o gráfico Chart.js
    let chartDistribuicao = null;

    /**
     * Função para animar um valor numérico de 0 até o final
     * @param {HTMLElement} obj Elemento que receberá o valor
     * @param {number} start Valor inicial
     * @param {number} end Valor final
     * @param {number} duration Duração da animação em ms
     */
    function animateValue(obj, start, end, duration) {
        if (!obj) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    /**
     * Inicializa ou atualiza o gráfico de distribuição EJC vs ECC
     * @param {number} ejc Total de inscritos EJC
     * @param {number} ecc Total de inscritos ECC
     */
    function renderizarGrafico(ejc, ecc) {
        const ctx = document.getElementById('chart-distribuicao');
        if (!ctx) return;

        console.log('LOG [Dashboard]: Montando gráfico EJC vs ECC...', { ejc, ecc });

        // Se o gráfico já existe, destrói para recriar com novos dados
        if (chartDistribuicao) {
            chartDistribuicao.destroy();
        }

        // Configurações do Chart.js
        chartDistribuicao = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['EJC (Jovens)', 'ECC (Casais)'],
                datasets: [{
                    label: 'Quantidade de Inscritos',
                    data: [ejc, ecc],
                    backgroundColor: [
                        'rgba(200, 169, 107, 0.7)', // Dourado/Marrom para EJC
                        'rgba(46, 31, 23, 0.7)'    // Marrom Escuro para ECC
                    ],
                    borderColor: [
                        '#C8A96B',
                        '#2E1F17'
                    ],
                    borderWidth: 2,
                    borderRadius: 10,
                    hoverBackgroundColor: [
                        'rgba(200, 169, 107, 0.9)',
                        'rgba(46, 31, 23, 0.9)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false // Esconde a legenda pois só temos um dataset
                    },
                    tooltip: {
                        backgroundColor: '#2E1F17',
                        titleFont: { family: 'Cinzel', size: 14 },
                        bodyFont: { family: 'Inter', size: 12 },
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#F5EBDD',
                            font: { family: 'Inter', size: 11 },
                            stepSize: 1
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#F5EBDD',
                            font: { family: 'Cinzel', size: 12, weight: 'bold' }
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeOutQuart'
                }
            }
        });
        
        console.log('LOG [Dashboard]: Gráfico montado com sucesso.');
    }

    /**
     * Função para buscar inscritos do Supabase
     * Como a busca é feita:
     * - Utilizamos o cliente Supabase para selecionar todos os campos da tabela 'inscricoes'.
     * - Ordenamos por 'created_at' descendente para mostrar os mais recentes primeiro.
     * - Implementamos uma resiliência para tentar buscar na tabela com acento caso a padrão falhe.
     */
    async function buscarInscritos() {
        console.log('LOG [Dashboard]: Iniciando busca de inscritos...');
        
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
            console.log(`LOG [Dashboard]: ${todosInscritos.length} registros encontrados.`);
            
            // 1. Calcula e Atualiza Métricas do Dashboard
            atualizarDashboard(todosInscritos);

            // 2. Renderiza os dados aplicando os filtros selecionados na listagem principal
            filtrarERenderizar();

        } catch (err) {
            console.error('ERRO CRÍTICO NO PAINEL:', err);
            loadingState.classList.add('hidden');
            errorState.classList.remove('hidden');
            errorMessage.textContent = err.message || 'Erro ao carregar dados do Supabase.';
        }
    }

    /**
     * Calcula as métricas e renderiza os cards do dashboard
     * @param {Array} dados Lista completa de inscritos
     */
    function atualizarDashboard(dados) {
        // Cálculo de Totais
        const total = dados.length;
        const totalEjc = dados.filter(i => (i.tipo || i.tipo_encontro || '').toLowerCase() === 'ejc').length;
        const totalEcc = dados.filter(i => (i.tipo || i.tipo_encontro || '').toLowerCase() === 'ecc').length;

        console.log('LOG [Dashboard]: Métricas calculadas:', { total, totalEjc, totalEcc });

        // Animação dos números (crescimento em tempo real)
        animateValue(metricTotal, 0, total, 1500);
        animateValue(metricEjc, 0, totalEjc, 1500);
        animateValue(metricEcc, 0, totalEcc, 1500);

        // Renderiza o gráfico de distribuição
        renderizarGrafico(totalEjc, totalEcc);

        // Último Cadastro (Tolerante à ausência de created_at)
        if (total > 0) {
            // Se houver created_at, o primeiro item (devido ao order desc) é o mais recente
            const ultimo = dados[0];
            const dataFormatada = ultimo.created_at 
                ? new Date(ultimo.created_at).toLocaleDateString('pt-BR')
                : 'Recente';
            
            if (metricLastDate) metricLastDate.textContent = dataFormatada;
            if (metricLastName) metricLastName.textContent = ultimo.nome || 'Sem nome';
        }

        // Renderiza a seção de "Últimos Cadastros" (Top 5)
        renderizarUltimos(dados.slice(0, 5));
    }

    /**
     * Renderiza a seção visual de últimos cadastros
     * @param {Array} ultimos Lista dos 5 registros mais recentes
     */
    function renderizarUltimos(ultimos) {
        if (!containerUltimos) return;
        containerUltimos.innerHTML = '';

        if (ultimos.length === 0) {
            containerUltimos.innerHTML = '<div class="col-span-full text-center py-8 text-cream/30 italic">Nenhum registro encontrado.</div>';
            return;
        }

        console.log(`LOG [Dashboard]: Montando ${ultimos.length} últimos cadastros.`);

        ultimos.forEach(inscrito => {
            const div = document.createElement('div');
            div.className = 'ultimo-cadastro-card animate-fade-in';
            
            const dataFormatada = inscrito.created_at 
                ? new Date(inscrito.created_at).toLocaleDateString('pt-BR')
                : '';

            const tipo = (inscrito.tipo || inscrito.tipo_encontro || 'EJC').toUpperCase();
            const badgeClass = tipo === 'ECC' ? 'bg-brown-dark' : 'bg-brown-medium';

            div.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full overflow-hidden border border-gold-soft/30 flex-shrink-0">
                        <img src="${inscrito.foto_url || 'https://picsum.photos/seed/church/100'}" 
                             alt="${inscrito.nome}" class="w-full h-full object-cover" referrerpolicy="no-referrer">
                    </div>
                    <div class="min-w-0">
                        <h4 class="text-xs font-bold text-brown-dark truncate" title="${inscrito.nome}">${inscrito.nome}</h4>
                        <div class="flex items-center gap-2 mt-0.5">
                            <span class="px-1.5 py-0.5 rounded text-[8px] font-bold text-white ${badgeClass}">${tipo}</span>
                            <span class="text-[9px] text-brown-medium/60 truncate">${inscrito.cidade || 'Cidade N/I'}</span>
                        </div>
                    </div>
                </div>
                ${dataFormatada ? `<div class="text-[8px] text-brown-medium/40 mt-2 text-right italic">${dataFormatada}</div>` : ''}
            `;
            containerUltimos.appendChild(div);
        });
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
            AuthGuard.logout();
        }
    });

    // 5. Busca inicial de dados
    buscarInscritos();
});
