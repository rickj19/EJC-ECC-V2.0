/**
 * Arquivo: public/js/relatorio-inscritos.js
 * Descrição: Lógica para geração, filtragem e impressão do relatório de inscritos.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicializa ícones Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // 2. O AuthGuard já validou o acesso no HTML.
    // Não precisamos mais do check manual aqui.

    // 3. Referências do DOM
    const tabelaCorpo = document.getElementById('tabela-corpo');
    const buscaNome = document.getElementById('busca-nome');
    const filtroTipo = document.getElementById('filtro-tipo');
    const filtroPerfil = document.getElementById('filtro-perfil');
    const filtroStatus = document.getElementById('filtro-status');
    const dataInicio = document.getElementById('data-inicio');
    const dataFim = document.getElementById('data-fim');
    const btnImprimir = document.getElementById('btn-imprimir');
    const btnPdf = document.getElementById('btn-pdf');
    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');
    const dataGeracaoSpan = document.getElementById('data-geracao');
    
    // Métricas
    const totalEncontrado = document.getElementById('total-encontrado');
    const totalAprovado = document.getElementById('total-aprovado');
    const totalPendente = document.getElementById('total-pendente');

    let todosInscritos = [];

    /**
     * Como os dados são buscados:
     * - Utilizamos o cliente Supabase para buscar todos os registros da tabela 'inscricoes'.
     * - Ordenamos por nome para facilitar a leitura do relatório impresso.
     */
    async function carregarDados() {
        console.log('LOG [Relatório]: Iniciando busca de dados no Supabase...');
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
            console.log(`LOG [Relatório]: ${todosInscritos.length} registros carregados.`);
            renderizarRelatorio();

        } catch (err) {
            console.error('ERRO [Relatório]: Falha ao carregar dados:', err);
            alert('Falha ao carregar dados do relatório: ' + err.message);
        } finally {
            loadingState.classList.add('hidden');
        }
    }

    /**
     * Como os filtros funcionam:
     * - A filtragem é feita localmente no array 'todosInscritos' para performance instantânea.
     * - Comparamos nome, tipo, perfil, status e intervalo de datas.
     */
    function renderizarRelatorio() {
        const termo = buscaNome.value.toLowerCase();
        const tipo = filtroTipo.value;
        const perfil = filtroPerfil.value;
        const status = filtroStatus.value;
        const dInicio = dataInicio.value ? new Date(dataInicio.value) : null;
        const dFim = dataFim.value ? new Date(dataFim.value) : null;

        if (dInicio) dInicio.setHours(0, 0, 0, 0);
        if (dFim) dFim.setHours(23, 59, 59, 999);

        const filtrados = todosInscritos.filter(i => {
            const matchNome = (i.nome || '').toLowerCase().includes(termo);
            const matchTipo = tipo === 'todos' || (i.tipo || '').toLowerCase() === tipo;
            const matchPerfil = perfil === 'todos' || (i.perfil || '').toLowerCase() === perfil;
            const matchStatus = status === 'todos' || (i.status || 'pendente').toLowerCase() === status;
            
            let matchData = true;
            if (i.created_at) {
                const dataInsc = new Date(i.created_at);
                if (dInicio && dataInsc < dInicio) matchData = false;
                if (dFim && dataInsc > dFim) matchData = false;
            }

            return matchNome && matchTipo && matchPerfil && matchStatus && matchData;
        });

        console.log(`LOG [Relatório]: Filtros aplicados. Exibindo ${filtrados.length} resultados.`);
        
        // Atualiza Métricas
        totalEncontrado.textContent = filtrados.length;
        totalAprovado.textContent = filtrados.filter(i => (i.status || '').toLowerCase() === 'aprovado').length;
        totalPendente.textContent = filtrados.filter(i => (i.status || 'pendente').toLowerCase() === 'pendente').length;

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

            const statusInsc = (inscrito.status || 'pendente').toLowerCase();
            const statusColor = statusInsc === 'aprovado' ? 'text-green-600' : (statusInsc === 'rejeitado' ? 'text-red-600' : 'text-blue-600');

            tr.innerHTML = `
                <td class="px-6 py-4">
                    <div class="w-10 h-10 rounded-lg overflow-hidden border border-gold-soft/30 bg-gray-100">
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
                <td class="px-6 py-4">
                    <span class="text-[10px] font-bold uppercase tracking-widest ${statusColor}">${statusInsc}</span>
                </td>
                <td class="px-6 py-4 text-[10px] font-mono text-brown-medium">
                    ${dataFormatada}
                </td>
            `;
            tabelaCorpo.appendChild(tr);
        });

        // Recria ícones se necessário
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    /**
     * Como o PDF é gerado:
     * - Utilizamos a biblioteca jsPDF com o plugin autoTable.
     * - O PDF inclui cabeçalho com título, data de emissão e uma tabela organizada.
     */
    async function gerarPDF() {
        console.log('LOG [Relatório]: Gerando PDF profissional...');
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Título e Cabeçalho do PDF
        doc.setFontSize(18);
        doc.setTextColor(43, 29, 23); // Marrom Escuro
        doc.text('Relatório de Inscritos', 14, 22);
        
        doc.setFontSize(10);
        doc.setTextColor(122, 92, 69); // Marrom Médio
        doc.text('Paróquia de São Francisco das Chagas', 14, 28);
        // Padronização do nome oficial da paróquia
        doc.text(`Emissão: ${new Date().toLocaleString('pt-BR')}`, 14, 33);
        
        // Linha divisória
        doc.setDrawColor(200, 169, 107); // Dourado
        doc.line(14, 38, 196, 38);

        // Captura dados da tabela atual (filtrada)
        const rows = [];
        const filtrados = todosInscritos.filter(i => {
            // Re-aplica a mesma lógica de filtro para garantir consistência
            const termo = buscaNome.value.toLowerCase();
            const tipo = filtroTipo.value;
            const perfil = filtroPerfil.value;
            const status = filtroStatus.value;
            const dInicio = dataInicio.value ? new Date(dataInicio.value) : null;
            const dFim = dataFim.value ? new Date(dataFim.value) : null;
            if (dInicio) dInicio.setHours(0, 0, 0, 0);
            if (dFim) dFim.setHours(23, 59, 59, 999);

            const matchNome = (i.nome || '').toLowerCase().includes(termo);
            const matchTipo = tipo === 'todos' || (i.tipo || '').toLowerCase() === tipo;
            const matchPerfil = perfil === 'todos' || (i.perfil || '').toLowerCase() === perfil;
            const matchStatus = status === 'todos' || (i.status || 'pendente').toLowerCase() === status;
            let matchData = true;
            if (i.created_at) {
                const dataInsc = new Date(i.created_at);
                if (dInicio && dataInsc < dInicio) matchData = false;
                if (dFim && dataInsc > dFim) matchData = false;
            }
            return matchNome && matchTipo && matchPerfil && matchStatus && matchData;
        });

        filtrados.forEach(i => {
            rows.push([
                i.nome || '---',
                i.telefone || '---',
                (i.tipo || '---').toUpperCase(),
                i.perfil || '---',
                i.cidade || '---',
                (i.status || 'pendente').toUpperCase(),
                i.created_at ? new Date(i.created_at).toLocaleDateString('pt-BR') : '---'
            ]);
        });

        // Gera Tabela no PDF
        doc.autoTable({
            startY: 45,
            head: [['Nome', 'Telefone', 'Tipo', 'Perfil', 'Cidade', 'Status', 'Data']],
            body: rows,
            headStyles: { fillColor: [43, 29, 23], textColor: [200, 169, 107] },
            alternateRowStyles: { fillColor: [245, 235, 221] },
            margin: { top: 45 },
            styles: { fontSize: 8 }
        });

        doc.save(`relatorio_inscritos_${new Date().getTime()}.pdf`);
        console.log('LOG [Relatório]: PDF gerado e baixado com sucesso.');
    }

    /**
     * Como a impressão funciona:
     * - Atualizamos a data de geração no rodapé.
     * - Chamamos o comando nativo window.print().
     * - O CSS (style.css) cuida de ocultar elementos indesejados e formatar a página.
     */
    btnImprimir.addEventListener('click', () => {
        console.log('LOG [Relatório]: Acionando impressão do navegador...');
        const agora = new Date();
        dataGeracaoSpan.textContent = agora.toLocaleString('pt-BR');
        window.print();
    });

    btnPdf.addEventListener('click', gerarPDF);

    // Listeners para filtros em tempo real
    buscaNome.addEventListener('input', renderizarRelatorio);
    filtroTipo.addEventListener('change', renderizarRelatorio);
    filtroPerfil.addEventListener('change', renderizarRelatorio);
    filtroStatus.addEventListener('change', renderizarRelatorio);
    dataInicio.addEventListener('change', renderizarRelatorio);
    dataFim.addEventListener('change', renderizarRelatorio);

    // Carga inicial
    carregarDados();
});
