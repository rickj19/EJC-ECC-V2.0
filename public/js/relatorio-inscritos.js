/**
 * Arquivo: public/js/relatorio-inscritos.js
 * Descrição: Lógica para geração, filtragem e impressão do relatório de inscritos.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicializa ícones Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // 2. Verifica autenticação (Segurança básica)
    const usuarioLogado = JSON.parse(localStorage.getItem('usuario_logado'));
    if (!usuarioLogado || usuarioLogado.tipo !== 'admin') {
        window.location.href = '/login.html?tipo=admin';
        return;
    }

    // 3. Referências do DOM
    const tabelaCorpo = document.getElementById('tabela-corpo');
    const buscaNome = document.getElementById('busca-nome');
    const filtroTipo = document.getElementById('filtro-tipo');
    const filtroPerfil = document.getElementById('filtro-perfil');
    const btnImprimir = document.getElementById('btn-imprimir');
    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');
    const dataGeracaoSpan = document.getElementById('data-geracao');

    let todosInscritos = [];

    /**
     * Como os dados são buscados:
     * - Utilizamos o cliente Supabase para buscar todos os registros da tabela 'inscricoes'.
     * - Ordenamos por nome para facilitar a leitura do relatório impresso.
     */
    async function carregarDados() {
        loadingState.classList.remove('hidden');
        emptyState.classList.add('hidden');
        tabelaCorpo.innerHTML = '';

        try {
            const { data, error } = await window.supabaseClient
                .from('inscricoes')
                .select('*')
                .order('nome', { ascending: true });

            if (error) throw error;

            todosInscritos = data || [];
            renderizarRelatorio();

        } catch (err) {
            console.error('Erro ao carregar relatório:', err);
            alert('Falha ao carregar dados do relatório.');
        } finally {
            loadingState.classList.add('hidden');
        }
    }

    /**
     * Renderiza as linhas da tabela com base nos filtros
     */
    function renderizarRelatorio() {
        const termo = buscaNome.value.toLowerCase();
        const tipo = filtroTipo.value;
        const perfil = filtroPerfil.value;

        const filtrados = todosInscritos.filter(i => {
            const matchNome = (i.nome || '').toLowerCase().includes(termo);
            const matchTipo = tipo === 'todos' || (i.tipo || '').toLowerCase() === tipo;
            const matchPerfil = perfil === 'todos' || (i.perfil || '').toLowerCase() === perfil;
            return matchNome && matchTipo && matchPerfil;
        });

        tabelaCorpo.innerHTML = '';

        if (filtrados.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');

        filtrados.forEach(inscrito => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-100 hover:bg-gray-50 transition-colors';
            
            const dataFormatada = inscrito.created_at 
                ? new Date(inscrito.created_at).toLocaleDateString('pt-BR') 
                : '---';

            tr.innerHTML = `
                <td class="px-6 py-4">
                    <div class="w-12 h-12 rounded-lg overflow-hidden border border-gold-soft/30 bg-gray-100">
                        <img src="${inscrito.foto_url || 'https://picsum.photos/seed/church/100'}" 
                             alt="Foto" class="w-full h-full object-cover" referrerpolicy="no-referrer">
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="font-bold text-sm text-brown-dark">${inscrito.nome || 'N/I'}</div>
                    <div class="text-[10px] text-brown-medium opacity-70">${inscrito.telefone || 'Sem contato'}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-[10px] font-bold uppercase tracking-wider text-brown-dark">${inscrito.tipo || '---'}</div>
                    <div class="text-[10px] text-brown-medium italic">${inscrito.perfil || '---'}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-[10px] text-brown-dark">${inscrito.cidade || '---'}</div>
                    <div class="text-[10px] text-brown-medium opacity-70">${inscrito.paroquia || '---'}</div>
                </td>
                <td class="px-6 py-4 text-[10px] font-mono text-brown-medium">
                    ${dataFormatada}
                </td>
            `;
            tabelaCorpo.appendChild(tr);
        });
    }

    /**
     * Como a impressão funciona:
     * - Atualizamos a data de geração no rodapé.
     * - Chamamos o comando nativo window.print().
     * - O CSS (style.css) cuida de ocultar elementos indesejados e formatar a página.
     */
    btnImprimir.addEventListener('click', () => {
        const agora = new Date();
        dataGeracaoSpan.textContent = agora.toLocaleString('pt-BR');
        window.print();
    });

    // Listeners para filtros em tempo real
    buscaNome.addEventListener('input', renderizarRelatorio);
    filtroTipo.addEventListener('change', renderizarRelatorio);
    filtroPerfil.addEventListener('change', renderizarRelatorio);

    // Carga inicial
    carregarDados();
});
