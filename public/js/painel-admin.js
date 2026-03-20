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
    // Controle para evitar execuções duplicadas simultâneas
    let estaCarregando = false;

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
        // PROTEÇÃO CONTRA CLIQUES REPETIDOS:
        // Se já houver uma busca em andamento, bloqueamos a nova chamada para evitar conflitos e duplicidade.
        if (estaCarregando) {
            console.warn('LOG [Admin]: Uma busca já está em andamento. Chamada bloqueada para evitar duplicidade.');
            return;
        }

        console.log('LOG [Admin]: Iniciando busca de inscritos no Supabase...');
        estaCarregando = true;
        
        // Mostra estado de carregamento visual
        loadingState.classList.remove('hidden');
        emptyState.classList.add('hidden');
        errorState.classList.add('hidden');
        
        // CORREÇÃO DA DUPLICAÇÃO:
        // Limpamos o container da lista principal ANTES de qualquer nova renderização.
        // O problema ocorria porque o seletor anterior não encontrava os cards com a classe correta.
        // Usar innerHTML = '' é o método mais seguro para garantir que a área esteja limpa.
        listaInscritos.innerHTML = '';
        console.log('LOG [Admin]: Container da lista principal limpo.');

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
            console.log(`LOG [Admin]: ${todosInscritos.length} registros encontrados no banco.`);
            
            // 1. Calcula e Atualiza Métricas do Dashboard
            atualizarDashboard(todosInscritos);

            // 2. Renderiza os dados aplicando os filtros selecionados na listagem principal
            filtrarERenderizar();

        } catch (err) {
            console.error('ERRO CRÍTICO NO PAINEL:', err);
            loadingState.classList.add('hidden');
            errorState.classList.remove('hidden');
            errorMessage.textContent = err.message || 'Erro ao carregar dados do Supabase.';
        } finally {
            estaCarregando = false;
            console.log('LOG [Admin]: Atualização de dados concluída.');
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
        
        // Limpa o container antes de renderizar para evitar duplicação nesta área também
        containerUltimos.innerHTML = '';

        if (ultimos.length === 0) {
            containerUltimos.innerHTML = '<div class="col-span-full text-center py-8 text-cream/30 italic">Nenhum registro encontrado.</div>';
            return;
        }

        console.log(`LOG [Dashboard]: Renderizando ${ultimos.length} cards na seção de últimos cadastros.`);

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

        // CORREÇÃO DA DUPLICAÇÃO:
        // Limpamos o container da lista principal ANTES de renderizar os novos resultados filtrados.
        // O problema ocorria porque o seletor anterior '.inscrito-card' não correspondia à classe real '.inscrito-mini-card'.
        listaInscritos.innerHTML = '';
        console.log('LOG [Admin]: Container da lista principal limpo para renderização dos filtros.');

        // Verifica se há resultados
        if (inscritosFiltrados.length === 0) {
            emptyState.classList.remove('hidden');
            console.log('LOG [Admin]: Nenhum resultado para os filtros atuais.');
            return;
        }

        emptyState.classList.add('hidden');

        // Renderiza cada inscrito
        inscritosFiltrados.forEach(inscrito => {
            const card = criarCardInscrito(inscrito);
            listaInscritos.appendChild(card);
        });

        console.log(`LOG [Admin]: ${inscritosFiltrados.length} cards renderizados na lista principal.`);

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
        
        // Determina a classe de status
        const status = (inscrito.status || 'pendente').toLowerCase();
        const statusClass = `status-${status}`;
        
        div.className = `inscrito-mini-card animate-fade-in ${statusClass}`;
        div.dataset.id = inscrito.id;
        
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
            <div class="foto-3x4-container cursor-pointer group" onclick="abrirFoto('${inscrito.foto_url}')">
                <img src="${inscrito.foto_url || 'https://picsum.photos/seed/church/300/400'}" 
                     alt="Foto de ${inscrito.nome}" 
                     class="foto-3x4 transition-transform group-hover:scale-110"
                     referrerpolicy="no-referrer">
                <span class="badge-compacto ${badgeClass}">${tipo}</span>
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <i data-lucide="maximize-2" class="text-white w-6 h-6"></i>
                </div>
            </div>
            <div class="info-compacta">
                <div class="relative">
                    <div class="flex justify-between items-start gap-2">
                        <h3 class="nome-destaque truncate flex-grow" title="${inscrito.nome}">${inscrito.nome || 'Sem Nome'}</h3>
                        <div class="flex gap-1">
                            <button onclick="editarInscricao('${inscrito.id}')" class="btn-card-acao btn-editar" title="Editar">
                                <i data-lucide="edit-3"></i>
                            </button>
                            <button onclick="excluirInscricao('${inscrito.id}')" class="btn-card-acao btn-excluir" title="Excluir">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                    </div>
                    
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

                <!-- Rodapé do Card com Ações de Status e Data -->
                <div class="pt-2 border-t border-gray-100 mt-1 flex items-center justify-between">
                    <div class="flex gap-1">
                        <button onclick="atualizarStatus('${inscrito.id}', 'aprovado')" class="btn-card-acao btn-aprovar" title="Aprovar">
                            <i data-lucide="check"></i>
                        </button>
                        <button onclick="atualizarStatus('${inscrito.id}', 'rejeitado')" class="btn-card-acao btn-rejeitar" title="Rejeitar">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <div class="dado-linha opacity-60 m-0">
                        <i data-lucide="calendar" class="w-2.5 h-2.5"></i>
                        <span class="text-[10px] italic">${dataCadastro}</span>
                    </div>
                </div>
            </div>
        `;
        
        return div;
    }

    /**
     * Funções Globais de Ação (Expostas ao Window)
     */
    window.abrirFoto = (url) => {
        const modal = document.getElementById('modal-foto');
        const img = document.getElementById('img-ampliada');
        if (modal && img) {
            img.src = url || 'https://picsum.photos/seed/church/800/600';
            modal.classList.remove('hidden');
        }
    };

    window.fecharModalFoto = () => {
        const modal = document.getElementById('modal-foto');
        if (modal) modal.classList.add('hidden');
    };

    window.editarInscricao = (id) => {
        console.log('LOG [Admin]: Iniciando edição da inscrição', id);
        const inscrito = todosInscritos.find(i => i.id === id);
        if (!inscrito) return;

        document.getElementById('edit-id').value = inscrito.id;
        document.getElementById('edit-nome').value = inscrito.nome || '';
        document.getElementById('edit-telefone').value = inscrito.telefone || '';
        document.getElementById('edit-perfil').value = inscrito.perfil || 'jovem';
        document.getElementById('edit-cidade').value = inscrito.cidade || '';
        document.getElementById('edit-paroquia').value = inscrito.paroquia || '';

        document.getElementById('modal-editar').classList.remove('hidden');
    };

    window.fecharModalEditar = () => {
        document.getElementById('modal-editar').classList.add('hidden');
    };

    // Handler do formulário de edição
    document.getElementById('form-editar')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-id').value;
        const dados = {
            nome: document.getElementById('edit-nome').value,
            telefone: document.getElementById('edit-telefone').value,
            perfil: document.getElementById('edit-perfil').value,
            cidade: document.getElementById('edit-cidade').value,
            paroquia: document.getElementById('edit-paroquia').value
        };

        try {
            console.log('LOG [Admin]: Salvando alterações para', id);
            const { error } = await window.supabaseClient
                .from('inscricoes')
                .update(dados)
                .eq('id', id);

            if (error) throw error;

            // Atualiza cache local
            const index = todosInscritos.findIndex(i => i.id === id);
            if (index !== -1) {
                todosInscritos[index] = { ...todosInscritos[index], ...dados };
            }

            fecharModalEditar();
            filtrarERenderizar();
            alert('Inscrição atualizada com sucesso!');
        } catch (err) {
            console.error('ERRO AO SALVAR EDIÇÃO:', err);
            alert('Erro ao salvar alterações: ' + err.message);
        }
    });

    /**
     * Função para excluir uma inscrição permanentemente.
     * 
     * POR QUE O ITEM VOLTAVA AO ATUALIZAR?
     * O problema ocorria porque a exclusão provavelmente não estava sendo confirmada no banco (Supabase) 
     * ou estava sendo feita na tabela errada. O front-end removia o card visualmente de forma imediata,
     * mas se a requisição falhasse, o item permanecia no banco e reaparecia ao atualizar a lista.
     * 
     * COMO O DELETE REAL É FEITO:
     * Utilizamos o método .delete() do cliente Supabase filtrando pelo ID único da inscrição.
     * Implementamos uma lógica de resiliência para tentar em tabelas alternativas (com/sem acento)
     * e aguardamos a resposta real do servidor antes de qualquer mudança visual definitiva.
     * 
     * POR QUE O CARD SÓ SOME APÓS SUCESSO?
     * Para garantir a integridade visual. O card só é removido do cache local e da tela 
     * após o Supabase retornar sucesso. Se houver erro, o card permanece e o usuário é alertado.
     */
    window.excluirInscricao = async (id) => {
        // 1. Confirmação de segurança (Prevenção de cliques acidentais)
        if (!confirm('ATENÇÃO: Tem certeza que deseja excluir esta inscrição permanentemente? Esta ação não pode ser desfeita no banco de dados.')) {
            console.log('LOG [Exclusão]: Operação cancelada pelo usuário para o ID:', id);
            return;
        }

        console.log('LOG [Exclusão]: Iniciando processo de exclusão real para ID:', id);

        // 2. Feedback Visual: Localizar o botão para mostrar estado de "Processando"
        // Procuramos o card específico no DOM para dar feedback tátil
        const card = document.querySelector(`.inscrito-mini-card[data-id="${id}"]`);
        const btnExcluir = card?.querySelector('.btn-excluir');
        const iconOriginal = btnExcluir?.innerHTML;

        if (btnExcluir) {
            btnExcluir.disabled = true;
            // Adiciona um spinner de loading no lugar do ícone de lixeira
            btnExcluir.innerHTML = '<i data-lucide="loader-2" class="animate-spin w-4 h-4"></i>';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        try {
            // 3. Execução do DELETE no Supabase
            console.log('LOG [Exclusão]: Enviando consulta DELETE para a tabela "inscricoes"...');
            let { error } = await window.supabaseClient
                .from('inscricoes')
                .delete()
                .eq('id', id);

            // Resiliência: Se a tabela padrão falhar por erro de nome (comum em migrações), tenta com acento
            if (error && (error.code === 'P0001' || error.message?.includes('relation "inscricoes" does not exist'))) {
                console.warn('LOG [Exclusão]: Tabela "inscricoes" não encontrada, tentando "inscrições"...');
                const result = await window.supabaseClient
                    .from('inscrições')
                    .delete()
                    .eq('id', id);
                error = result.error;
            }

            if (error) {
                console.error('LOG [Exclusão]: Erro capturado na resposta do Supabase:', error);
                throw error;
            }

            console.log('LOG [Exclusão]: Resposta do DELETE recebida com sucesso do Supabase.');

            // 4. Sincronização do Cache Local
            // O item só sai da memória do navegador após a confirmação de que saiu do banco
            const totalAnterior = todosInscritos.length;
            todosInscritos = todosInscritos.filter(i => i.id !== id);
            
            console.log(`LOG [Exclusão]: Cache local atualizado. De ${totalAnterior} para ${todosInscritos.length} registros.`);

            // 5. Atualização da Interface
            // Re-renderizamos o dashboard e a lista para refletir a exclusão permanentemente
            atualizarDashboard(todosInscritos);
            filtrarERenderizar();
            
            console.log('LOG [Exclusão]: Lista atualizada e renderizada com sucesso.');
            alert('Inscrição excluída com sucesso e removida permanentemente do sistema.');

        } catch (err) {
            console.error('LOG [Exclusão]: FALHA AO DELETAR REGISTRO:', err);
            
            // Restaurar o botão original em caso de erro para permitir que o usuário tente novamente
            if (btnExcluir) {
                btnExcluir.disabled = false;
                btnExcluir.innerHTML = iconOriginal;
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }

            alert('ERRO NA EXCLUSÃO: Não foi possível deletar o registro no banco de dados. Verifique suas permissões ou conexão. Detalhes: ' + (err.message || 'Erro desconhecido'));
        }
    };

    window.atualizarStatus = async (id, status) => {
        try {
            console.log(`LOG [Admin]: Atualizando status de ${id} para ${status}`);
            const { error } = await window.supabaseClient
                .from('inscricoes')
                .update({ status })
                .eq('id', id);

            if (error) throw error;

            // Atualiza cache local
            const index = todosInscritos.findIndex(i => i.id === id);
            if (index !== -1) {
                todosInscritos[index].status = status;
            }

            filtrarERenderizar();
        } catch (err) {
            console.error('ERRO AO ATUALIZAR STATUS:', err);
            alert('Erro ao atualizar status: ' + err.message);
        }
    };

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
