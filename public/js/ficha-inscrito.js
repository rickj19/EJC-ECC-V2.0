/**
 * Arquivo: public/js/ficha-inscrito.js
 * Descrição: Lógica para visualização e impressão da ficha do inscrito.
 * Comentários detalhados conforme solicitado pelo usuário.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Inicializa os ícones do Lucide
    lucide.createIcons();

    // 1. LENDO O ID DA URL
    // Usamos URLSearchParams para extrair o parâmetro 'id' da query string (ex: ?id=123)
    const urlParams = new URLSearchParams(window.location.search);
    const inscritoId = urlParams.get('id');

    // Se não houver ID, redirecionamos de volta ao painel
    if (!inscritoId) {
        console.error('ERRO [Ficha]: ID não fornecido na URL.');
        window.location.href = '/painel-admin.html';
        return;
    }

    console.log('LOG [Ficha]: Carregando dados do inscrito ID:', inscritoId);

    // 2. BUSCANDO OS DADOS NO SUPABASE
    // Utilizamos o cliente global window.supabaseClient configurado em supabase.js
    try {
        const { data: inscrito, error } = await window.supabaseClient
            .from('inscricoes')
            .select('*')
            .eq('id', inscritoId)
            .single(); // Esperamos apenas um resultado

        if (error) throw error;
        if (!inscrito) {
            alert('Inscrito não encontrado.');
            window.location.href = '/painel-admin.html';
            return;
        }

        // 3. MONTANDO A FICHA COM OS DADOS BUSCADOS
        // Chamamos a função para preencher os elementos HTML
        preencherFicha(inscrito);

        // 4. CONFIGURANDO BOTÕES DE AÇÃO
        configurarBotoes(inscrito);

    } catch (err) {
        console.error('ERRO [Ficha]: Falha ao buscar dados:', err);
        alert('Erro ao carregar os dados da ficha.');
    }
});

/**
 * Preenche os elementos do DOM com os dados do inscrito.
 * @param {Object} dados Objeto retornado pelo Supabase
 */
function preencherFicha(dados) {
    // Mapeamento de campos para IDs do HTML
    const mapeamento = {
        'display-nome': dados.nome,
        'display-apelido': dados.apelido,
        'display-nascimento': formatarData(dados.data_nascimento),
        'display-telefone': dados.telefone,
        'display-profissao': dados.profissao,
        'display-endereco': dados.endereco,
        'display-bairro': dados.bairro,
        'display-referencia': dados.referencia,
        'display-id': dados.id,
        'display-criado': new Date(dados.created_at).toLocaleDateString('pt-BR'),
        'display-observacoes': dados.observacoes || 'Nenhuma observação adicional.'
    };

    // Preenche campos simples de texto
    for (const [id, valor] of Object.entries(mapeamento)) {
        const el = document.getElementById(id);
        if (el) el.textContent = valor || '---';
    }

    // Preenche campos complexos (Vida na Igreja, Sacramentos, etc)
    
    // Sacramentos (Array para string)
    const sacramentosEl = document.getElementById('display-sacramentos');
    if (sacramentosEl) {
        sacramentosEl.textContent = Array.isArray(dados.sacramentos) ? dados.sacramentos.join(', ') : 'Nenhum';
    }

    // Pastoral
    const pastoralEl = document.getElementById('display-pastoral');
    if (pastoralEl) {
        const participa = dados.participa_pastoral ? 'Sim' : 'Não';
        pastoralEl.textContent = `${participa}${dados.qual_pastoral ? ` (${dados.qual_pastoral})` : ''}`;
    }

    // Aptidão
    const aptidaoEl = document.getElementById('display-aptidao');
    if (aptidaoEl) {
        const tem = dados.tem_aptidao ? 'Sim' : 'Não';
        aptidaoEl.textContent = `${tem}${dados.qual_aptidao ? ` (${dados.qual_aptidao})` : ''}`;
    }

    // Já fez EJC
    const fezEjcEl = document.getElementById('display-fez-ejc');
    if (fezEjcEl) {
        const jaFez = dados.ja_fez_ejc ? 'Sim' : 'Não';
        fezEjcEl.textContent = `${jaFez}${dados.ano_ejc ? ` (Ano: ${dados.ano_ejc})` : ''}${dados.circulo_ejc ? ` - Círculo: ${dados.circulo_ejc}` : ''}`;
    }

    // Equipes
    const equipesEl = document.getElementById('display-equipes');
    if (equipesEl) {
        equipesEl.textContent = Array.isArray(dados.equipes_anteriores) ? dados.equipes_anteriores.join(', ') : 'Nenhuma';
    }

    // Liderança
    const liderancaEl = document.getElementById('display-lideranca');
    if (liderancaEl) {
        const foiLider = dados.foi_lider ? 'Sim' : 'Não';
        liderancaEl.textContent = `${foiLider}${dados.qual_lideranca ? ` (${dados.qual_lideranca})` : ''}`;
    }

    // Foto 3x4
    const imgFoto = document.getElementById('display-foto');
    const placeholderFoto = document.getElementById('foto-placeholder');
    if (dados.foto_url) {
        imgFoto.src = dados.foto_url;
        imgFoto.classList.remove('hidden');
        placeholderFoto.classList.add('hidden');
    }

    // Tipo de Inscrição (Badge)
    const tipoEl = document.getElementById('display-tipo');
    if (tipoEl) {
        tipoEl.textContent = dados.tipo_inscricao || 'EJC';
    }
}

/**
 * Configura os ouvintes de eventos para os botões da ficha.
 * @param {Object} dados Dados do inscrito para o PDF
 */
function configurarBotoes(dados) {
    // Botão Imprimir
    document.getElementById('btn-imprimir')?.addEventListener('click', () => {
        // 5. ORGANIZAÇÃO DA IMPRESSÃO
        // O navegador aciona o diálogo de impressão.
        // As regras CSS @media print no HTML garantem que apenas a ficha seja impressa.
        window.print();
    });

    // Botão Gerar PDF
    document.getElementById('btn-pdf')?.addEventListener('click', () => {
        // Reutiliza a função global definida em ficha-pdf.js
        if (typeof window.gerarFichaPDF === 'function') {
            window.gerarFichaPDF(dados);
        } else {
            alert('Erro: Biblioteca de PDF não carregada.');
        }
    });
}

/**
 * Formata data ISO (YYYY-MM-DD) para PT-BR (DD/MM/YYYY)
 */
function formatarData(dataIso) {
    if (!dataIso) return '---';
    const [ano, mes, dia] = dataIso.split('-');
    return `${dia}/${mes}/${ano}`;
}
