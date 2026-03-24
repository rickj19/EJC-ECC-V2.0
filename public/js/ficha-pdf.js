/**
 * Arquivo: public/js/ficha-pdf.js
 * Descrição: Lógica para geração de ficha de inscrição em PDF estilo oficial.
 * Biblioteca utilizada: jsPDF (carregada via CDN no HTML).
 */

/**
 * Função principal para gerar o PDF de um inscrito.
 * @param {Object} dados Objeto contendo todas as informações do inscrito vindas do Supabase.
 */
async function gerarFichaPDF(dados) {
    console.log('LOG [PDF]: Iniciando geração de ficha para:', dados.nome);

    try {
        // 1. Inicializa o documento jsPDF (Formato A4, unidade em mm)
        // O jsPDF é acessado via window.jspdf.jsPDF se carregado via CDN moderno
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Configurações de layout
        const margemEsquerda = 20;
        const margemDireita = 190;
        let y = 20; // Posição vertical inicial

        // --- CABEÇALHO INSTITUCIONAL ---
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('ENCONTRO DE JOVENS COM CRISTO', 105, y, { align: 'center' });
        
        y += 7;
        doc.setFontSize(12);
        doc.text('Paróquia de São Francisco das Chagas', 105, y, { align: 'center' });
        // Padronização do nome oficial da paróquia
        
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Bacabal - MA', 105, y, { align: 'center' });

        y += 10;
        // Linha divisória elegante
        doc.setDrawColor(200, 169, 107); // Cor Dourada/Bronze da paróquia
        doc.setLineWidth(0.5);
        doc.line(margemEsquerda, y, margemDireita, y);

        y += 12;
        // Título da Ficha
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(46, 31, 23); // Marrom escuro
        doc.text('FICHA DO ENCONTREIRO', 105, y, { align: 'center' });

        // --- ÁREA DA FOTO 3x4 ---
        // Posicionada no canto superior direito
        const fotoX = 155;
        const fotoY = 45;
        const fotoW = 35;
        const fotoH = 45;

        // Desenha moldura para a foto
        doc.setDrawColor(46, 31, 23);
        doc.setLineWidth(0.2);
        doc.rect(fotoX, fotoY, fotoW, fotoH);
        
        if (dados.foto_url) {
            try {
                // Tenta carregar a imagem e converter para base64 para o jsPDF
                const imgData = await getBase64ImageFromUrl(dados.foto_url);
                doc.addImage(imgData, 'JPEG', fotoX + 1, fotoY + 1, fotoW - 2, fotoH - 2);
            } catch (e) {
                console.warn('LOG [PDF]: Falha ao carregar foto para o PDF:', e);
                doc.setFontSize(8);
                doc.text('Foto não disponível', fotoX + fotoW/2, fotoY + fotoH/2, { align: 'center' });
            }
        } else {
            doc.setFontSize(8);
            doc.text('Área para Foto 3x4', fotoX + fotoW/2, fotoY + fotoH/2, { align: 'center' });
        }

        // --- BLOCOS DE INFORMAÇÃO ---
        doc.setTextColor(0, 0, 0); // Volta para preto
        y = 65;

        /**
         * Função auxiliar para desenhar uma linha de informação (Label: Valor)
         */
        const addInfo = (label, valor, customY = null) => {
            const currentY = customY || y;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text(`${label}:`, margemEsquerda, currentY);
            
            doc.setFont('helvetica', 'normal');
            const textValue = valor ? String(valor) : '---';
            doc.text(textValue, margemEsquerda + doc.getTextWidth(`${label}: `), currentY);
            
            if (!customY) y += 7;
        };

        /**
         * Função auxiliar para desenhar títulos de seção
         */
        const addSection = (titulo) => {
            y += 5;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(92, 64, 51); // Marrom médio
            doc.text(titulo.toUpperCase(), margemEsquerda, y);
            doc.setDrawColor(92, 64, 51);
            doc.setLineWidth(0.1);
            doc.line(margemEsquerda, y + 1, margemDireita, y + 1);
            doc.setTextColor(0, 0, 0);
            y += 8;
        };

        // 1. DADOS PESSOAIS
        addSection('1. Dados Pessoais');
        addInfo('Nome Completo', dados.nome);
        addInfo('Como gosta de ser chamado', dados.apelido);
        addInfo('Data de Nascimento', formatarData(dados.data_nascimento));
        addInfo('Telefone / WhatsApp', dados.telefone);
        addInfo('Endereço', dados.endereco);
        addInfo('Bairro', dados.bairro);
        addInfo('Ponto de Referência', dados.referencia);

        // 2. INFORMAÇÕES COMPLEMENTARES
        addSection('2. Informações Complementares');
        addInfo('Escolaridade', formatarEnum(dados.escolaridade));
        addInfo('Profissão / Ocupação', dados.profissao);
        
        const fezEjc = dados.ja_fez_ejc ? 'Sim' : 'Não';
        addInfo('Já participou do EJC?', `${fezEjc}${dados.ano_ejc ? ` (Ano: ${dados.ano_ejc})` : ''}`);
        if (dados.circulo_ejc) addInfo('Círculo', dados.circulo_ejc);

        // 3. VIDA RELIGIOSA
        addSection('3. Vida Religiosa');
        const sacramentos = Array.isArray(dados.sacramentos) ? dados.sacramentos.join(', ') : 'Nenhum';
        addInfo('Sacramentos', sacramentos);
        
        const participaPastoral = dados.participa_pastoral ? 'Sim' : 'Não';
        addInfo('Participa de Pastoral/Movimento?', `${participaPastoral}${dados.qual_pastoral ? ` (${dados.qual_pastoral})` : ''}`);
        
        const temAptidao = dados.tem_aptidao ? 'Sim' : 'Não';
        addInfo('Aptidão Musical/Artística?', `${temAptidao}${dados.qual_aptidao ? ` (${dados.qual_aptidao})` : ''}`);

        // 4. EXPERIÊNCIA E LIDERANÇA
        addSection('4. Experiência e Liderança');
        const equipes = Array.isArray(dados.equipes_anteriores) ? dados.equipes_anteriores.join(', ') : 'Nenhuma';
        addInfo('Equipes em que já serviu', equipes);
        
        const foiLider = dados.foi_lider ? 'Sim' : 'Não';
        addInfo('Já foi coordenador?', `${foiLider}${dados.qual_lideranca ? ` (${dados.qual_lideranca})` : ''}`);

        // 5. OBSERVAÇÕES
        addSection('5. Observações');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const obs = dados.observacoes || 'Nenhuma observação adicional.';
        // Quebra o texto automaticamente para não sair da página
        const splitObs = doc.splitTextToSize(obs, margemDireita - margemEsquerda);
        doc.text(splitObs, margemEsquerda, y);

        // --- RODAPÉ ---
        const footerY = 280;
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Ficha gerada em: ${new Date().toLocaleString('pt-BR')}`, margemEsquerda, footerY);
        doc.text('Paróquia de São Francisco das Chagas - Bacabal/MA', 105, footerY, { align: 'center' });
        // Padronização do nome oficial da paróquia
        doc.text(`ID: ${dados.id}`, margemDireita, footerY, { align: 'right' });

        // --- DOWNLOAD DO ARQUIVO ---
        const nomeArquivo = `ficha-${dados.nome.toLowerCase().replace(/\s+/g, '-')}.pdf`;
        doc.save(nomeArquivo);
        console.log('LOG [PDF]: Ficha baixada com sucesso:', nomeArquivo);

    } catch (error) {
        console.error('ERRO [PDF]: Falha ao gerar ficha:', error);
        alert('Erro ao gerar o PDF. Verifique o console para mais detalhes.');
    }
}

/**
 * Utilitário para converter URL de imagem em Base64 (necessário para o jsPDF)
 */
async function getBase64ImageFromUrl(imageUrl) {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener("load", () => resolve(reader.result), false);
        reader.addEventListener("error", () => reject());
        reader.readAsDataURL(blob);
    });
}

/**
 * Formata data ISO para PT-BR
 */
function formatarData(dataIso) {
    if (!dataIso) return '---';
    const [ano, mes, dia] = dataIso.split('-');
    return `${dia}/${mes}/${ano}`;
}

/**
 * Formata enums de escolaridade para exibição bonita
 */
function formatarEnum(val) {
    if (!val) return '---';
    const mapas = {
        'fundamental-incompleto': 'Fundamental Incompleto',
        'fundamental-completo': 'Fundamental Completo',
        'medio-incompleto': 'Médio Incompleto',
        'medio-completo': 'Médio Completo',
        'superior-incompleto': 'Superior Incompleto',
        'superior-completo': 'Superior Completo',
        'pos-graduacao': 'Pós-Graduação'
    };
    return mapas[val] || val;
}

// Expõe a função para o escopo global
window.gerarFichaPDF = gerarFichaPDF;
