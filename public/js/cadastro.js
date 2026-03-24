/**
 * Arquivo: public/js/cadastro.js
 * Descrição: Lógica definitiva para a página de inscrição.
 * Foco: Correção do upload de foto, diagnóstico detalhado e robustez no fluxo.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa os ícones Lucide para manter a identidade visual
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    /**
     * LÓGICA DE CAMPOS CONDICIONAIS
     * Mostra/Esconde campos baseados na seleção do usuário.
     */
    const setupConditionalField = (radioName, targetId) => {
        const radios = document.querySelectorAll(`input[name="${radioName}"]`);
        const target = document.getElementById(targetId);
        
        radios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.value === 'sim') {
                    target?.classList.remove('hidden');
                } else {
                    target?.classList.add('hidden');
                }
            });
        });
    };

    setupConditionalField('ja_fez_ejc', 'campos-ejc-anterior');
    setupConditionalField('participa_pastoral', 'campo-qual-pastoral');
    setupConditionalField('tem_aptidao', 'campo-qual-aptidao');
    setupConditionalField('foi_lider', 'campo-qual-lideranca');

    // Captura parâmetros da URL para identificar o tipo de inscrição (ejc ou ecc)
    const urlParams = new URLSearchParams(window.location.search);
    const tipoInscricao = urlParams.get('tipo') || 'ejc';
    
    // Referências aos elementos do DOM
    const badge = document.getElementById('type-badge');
    const form = document.getElementById('cadastro-form');
    const photoInput = document.getElementById('foto');
    const photoPreview = document.getElementById('photo-preview');
    const photoPreviewContainer = document.getElementById('photo-preview-container');
    const photoPlaceholder = document.getElementById('photo-placeholder');
    const submitBtn = document.getElementById('submit-btn');
    const feedbackMessage = document.getElementById('feedback-message');
    const canvasResize = document.getElementById('canvas-resize');

    // Modal de Confirmação
    const modalConfirmacao = document.getElementById('modal-confirmacao');
    const btnConfirmar = document.getElementById('confirmar-envio');
    const btnCancelar = document.getElementById('cancelar-envio');

    // Aplica o tema visual baseado no tipo
    document.body.classList.add(`theme-${tipoInscricao}`);
    if (badge) {
        badge.textContent = `INSCRIÇÃO ${tipoInscricao.toUpperCase()}`;
    }

    /**
     * MÁSCARA DE TELEFONE: (99) 99999-9999
     * Aplica a formatação enquanto o usuário digita.
     */
    const inputTelefone = document.getElementById('telefone');
    if (inputTelefone) {
        inputTelefone.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é número
            if (value.length > 11) value = value.slice(0, 11); // Limita a 11 dígitos

            // Aplica a máscara progressivamente
            if (value.length > 10) {
                value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
            } else if (value.length > 6) {
                value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
            } else if (value.length > 2) {
                value = value.replace(/^(\d{2})(\d{0,5}).*/, '($1) $2');
            } else if (value.length > 0) {
                value = value.replace(/^(\d*)/, '($1');
            }
            e.target.value = value;
        });
    }

    /**
     * Função para exibir mensagens de feedback visual na tela
     */
    function showFeedback(message, isError = true) {
        if (!feedbackMessage) return;
        feedbackMessage.textContent = message;
        feedbackMessage.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700', 'success-message');
        
        if (isError) {
            feedbackMessage.classList.add('bg-red-100', 'text-red-700');
        } else {
            feedbackMessage.classList.add('success-message');
        }
        
        feedbackMessage.classList.remove('hidden');
        feedbackMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    /**
     * VALIDAÇÃO PROFISSIONAL
     * Verifica cada campo e exibe mensagens de erro específicas.
     */
    function validarFormulario() {
        console.log('LOG: Iniciando validação do formulário...');
        let isValid = true;

        const campos = [
            { id: 'nome', min: 3, errorId: 'error-nome' },
            { id: 'telefone', min: 14, errorId: 'error-telefone' },
            { id: 'data_nascimento', min: 10, errorId: 'error-data-nascimento' },
            { id: 'endereco', min: 5, errorId: 'error-endereco' },
            { id: 'bairro', min: 2, errorId: 'error-bairro' },
            { id: 'cidade', min: 2, errorId: 'error-cidade' },
            { id: 'paroquia', min: 2, errorId: 'error-paroquia' }
        ];

        campos.forEach(campo => {
            const input = document.getElementById(campo.id);
            const errorEl = document.getElementById(campo.errorId);
            const value = input.value.trim();

            if (value.length < campo.min) {
                errorEl?.classList.remove('hidden');
                input.classList.add('border-red-500');
                isValid = false;
                console.warn(`LOG: Campo "${campo.id}" inválido.`);
            } else {
                errorEl?.classList.add('hidden');
                input.classList.remove('border-red-500');
            }
        });

        // Validação da foto
        const errorFoto = document.getElementById('error-foto');
        if (!photoInput.files[0]) {
            errorFoto?.classList.remove('hidden');
            isValid = false;
            console.warn('LOG: Foto não selecionada.');
        } else {
            errorFoto?.classList.add('hidden');
        }

        console.log('LOG: Resultado da validação:', isValid ? 'VÁLIDO' : 'INVÁLIDO');
        return isValid;
    }

    /**
     * Função para processar, redimensionar e converter a imagem para 3x4 JPEG
     */
    async function processImage(file) {
        console.log('LOG: Processando imagem para padrão 3x4 profissional...');
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const ctx = canvasResize.getContext('2d');
                
                // Dimensões padrão 3x4 (600x800 é uma boa resolução para web)
                const targetWidth = 600;
                const targetHeight = 800;
                
                canvasResize.width = targetWidth;
                canvasResize.height = targetHeight;

                // Crop centralizado para garantir proporção 3x4
                let sourceX = 0;
                let sourceY = 0;
                let sourceWidth = img.width;
                let sourceHeight = img.height;

                const aspect = sourceWidth / sourceHeight;
                const targetAspect = targetWidth / targetHeight;

                if (aspect > targetAspect) {
                    sourceWidth = sourceHeight * targetAspect;
                    sourceX = (img.width - sourceWidth) / 2;
                } else {
                    sourceHeight = sourceWidth / targetAspect;
                    sourceY = (img.height - sourceHeight) / 2;
                }

                ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);
                
                canvasResize.toBlob((blob) => {
                    if (blob) {
                        console.log('LOG: Imagem recortada e otimizada com sucesso.');
                        resolve(blob);
                    } else {
                        reject(new Error('Erro ao processar imagem.'));
                    }
                }, 'image/jpeg', 0.8);
            };
            img.onerror = () => reject(new Error('Erro ao carregar imagem.'));
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Lógica de Preview de Foto em tempo real
     */
    if (photoInput) {
        photoInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    if (photoPreview) photoPreview.src = e.target.result;
                    if (photoPreviewContainer) photoPreviewContainer.classList.remove('hidden');
                    if (photoPlaceholder) photoPlaceholder.classList.add('hidden');
                    console.log('LOG: Preview da foto atualizado.');
                }
                reader.readAsDataURL(file);
            }
        });
    }

    /**
     * FLUXO DE SUBMISSÃO COM CONFIRMAÇÃO
     */
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            if (validarFormulario()) {
                modalConfirmacao?.classList.remove('hidden');
                console.log('LOG: Aguardando confirmação do usuário...');
            } else {
                showFeedback('Por favor, corrija os campos destacados em vermelho.');
            }
        });
    }

    // Ação de Cancelar no Modal
    btnCancelar?.addEventListener('click', () => {
        modalConfirmacao?.classList.add('hidden');
        console.log('LOG: Envio cancelado pelo usuário.');
    });

    // Ação de Confirmar no Modal -> Inicia o envio real com feedback visual premium
    btnConfirmar?.addEventListener('click', async () => {
        console.log('LOG: Confirmação aceita. Iniciando processamento final...');
        
        /**
         * COMO O LOADING DO BOTÃO FUNCIONA:
         * 1. Armazenamos o texto original para restauração em caso de erro.
         * 2. Desabilitamos o botão para evitar múltiplos cliques acidentais.
         * 3. Injetamos um spinner CSS (.spinner-premium) e trocamos o texto para "Enviando...".
         * 4. A altura fixa no CSS evita que o botão "pule" ao trocar o conteúdo.
         */
        const originalText = btnConfirmar.innerHTML;
        btnConfirmar.disabled = true;
        if (btnCancelar) btnCancelar.disabled = true;
        
        btnConfirmar.innerHTML = `
            <div class="spinner-premium"></div>
            <span>Enviando...</span>
        `;

        try {
            await executarCadastro();
            // O redirecionamento de sucesso ocorre dentro de executarCadastro
        } catch (err) {
            /**
             * COMO O BOTÃO VOLTA AO ESTADO NORMAL:
             * Se houver erro no processamento (ex: falha no Supabase),
             * capturamos o erro, reativamos os botões e restauramos o HTML original.
             * O modal é fechado para que o usuário possa ver a mensagem de erro no formulário.
             */
            btnConfirmar.disabled = false;
            if (btnCancelar) btnCancelar.disabled = false;
            btnConfirmar.innerHTML = originalText;
            
            modalConfirmacao?.classList.add('hidden');
        }
    });

    /**
     * FUNÇÃO PRINCIPAL DE CADASTRO
     * Executa o upload e o insert no banco.
     */
    async function executarCadastro() {
        console.log('--- INÍCIO DO PROCESSAMENTO DE DADOS ---');
        
        // Coleta de dados básicos
        const nome = document.getElementById('nome').value.trim();
        const apelido = document.getElementById('apelido').value.trim();
        const data_nascimento = document.getElementById('data_nascimento').value;
        const telefone = document.getElementById('telefone').value.trim();
        const endereco = document.getElementById('endereco').value.trim();
        const bairro = document.getElementById('bairro').value.trim();
        const referencia = document.getElementById('referencia').value.trim();
        const cidade = document.getElementById('cidade').value.trim();
        const paroquia = document.getElementById('paroquia').value.trim();
        
        // Informações Pessoais
        const escolaridade = document.getElementById('escolaridade').value;
        const profissao = document.getElementById('profissao').value.trim();
        const ja_fez_ejc = document.querySelector('input[name="ja_fez_ejc"]:checked').value;
        const ano_ejc = document.getElementById('ano_ejc').value;
        const circulo_ejc = document.getElementById('circulo_ejc').value.trim();

        // Sacramentos (Array)
        const sacramentos = Array.from(document.querySelectorAll('input[name="sacramentos"]:checked')).map(el => el.value);

        // Vida na Igreja
        const participa_pastoral = document.querySelector('input[name="participa_pastoral"]:checked').value;
        const qual_pastoral = document.getElementById('qual_pastoral').value.trim();

        // Aptidões
        const tem_aptidao = document.querySelector('input[name="tem_aptidao"]:checked').value;
        const qual_aptidao = document.getElementById('qual_aptidao').value.trim();

        // Equipes Anteriores (Array)
        const equipes_anteriores = Array.from(document.querySelectorAll('input[name="equipes_anteriores"]:checked')).map(el => el.value);

        // Liderança
        const foi_lider = document.querySelector('input[name="foi_lider"]:checked').value;
        const qual_lideranca = document.getElementById('qual_lideranca').value.trim();

        const observacoes = document.getElementById('observacoes').value.trim();
        const fotoFile = photoInput.files[0];

        // O botão do modal já está em loading, mas garantimos o botão principal também
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Processando...';
        }

        try {
            if (!window.supabaseClient) throw new Error('Conexão com banco de dados falhou.');

            // 1. Processamento da Imagem (Redimensionamento 3x4)
            const processedBlob = await processImage(fotoFile);

            // 2. Upload para Storage
            const timestamp = Date.now();
            const fileName = `${tipoInscricao}_${timestamp}.jpg`;
            const BUCKET_NAME = 'fotos';

            console.log(`LOG: Enviando foto para o bucket "${BUCKET_NAME}"...`);
            const { error: uploadError } = await window.supabaseClient
                .storage
                .from(BUCKET_NAME)
                .upload(fileName, processedBlob, { contentType: 'image/jpeg' });

            if (uploadError) throw uploadError;

            // 3. Obter URL Pública
            const { data: publicUrlData } = window.supabaseClient
                .storage
                .from(BUCKET_NAME)
                .getPublicUrl(fileName);

            const publicUrl = publicUrlData.publicUrl;
            console.log('LOG: Foto enviada com sucesso. URL:', publicUrl);

            // 4. Salvar Registro no Banco de Dados
            const perfil = tipoInscricao === 'ejc' ? 'jovem' : 'casal';
            const payload = { 
                nome,
                apelido,
                data_nascimento,
                telefone,
                endereco,
                bairro,
                referencia,
                cidade,
                paroquia,
                escolaridade,
                profissao,
                ja_fez_ejc: ja_fez_ejc === 'sim',
                ano_ejc: ja_fez_ejc === 'sim' ? parseInt(ano_ejc) : null,
                circulo_ejc: ja_fez_ejc === 'sim' ? circulo_ejc : null,
                sacramentos,
                participa_pastoral: participa_pastoral === 'sim',
                qual_pastoral: participa_pastoral === 'sim' ? qual_pastoral : null,
                tem_aptidao: tem_aptidao === 'sim',
                qual_aptidao: tem_aptidao === 'sim' ? qual_aptidao : null,
                equipes_anteriores,
                foi_lider: foi_lider === 'sim',
                qual_lideranca: foi_lider === 'sim' ? qual_lideranca : null,
                tipo: tipoInscricao, 
                perfil,
                foto_url: publicUrl,
                foto_path: fileName,
                observacoes,
                status: 'pendente'
            };

            console.log('LOG: Salvando registro na tabela "inscricoes"...');
            const { error: insertError } = await window.supabaseClient
                .from('inscricoes')
                .insert([payload]);

            if (insertError) throw insertError;

            console.log('LOG: Cadastro concluído com sucesso!');
            
            /**
             * FEEDBACK VISUAL PREMIUM:
             * Exibimos uma mensagem suave e inspiradora usando showFeedback.
             * O modal é fechado com um pequeno atraso (setTimeout) para que o usuário
             * sinta a conclusão da tarefa antes do redirecionamento final.
             */
            showFeedback('Inscrição realizada com sucesso! Prepare seu coração...', false);

            // Fecha o modal suavemente antes de ir para a tela de sucesso
            setTimeout(() => {
                modalConfirmacao?.classList.add('hidden');
                window.location.href = `/sucesso.html?tipo=${tipoInscricao}`;
            }, 1500);

        } catch (err) {
            console.error('LOG: ERRO NO PROCESSO:', err);
            showFeedback(`Ops! Algo deu errado: ${err.message}`);
            
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Finalizar Inscrição';
            }
            
            // Re-lança o erro para que o listener do modal possa tratar a UI
            throw err;
        }
    }
});



