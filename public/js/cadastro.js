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

    // Aplica o tema visual baseado no tipo
    document.body.classList.add(`theme-${tipoInscricao}`);
    if (badge) {
        badge.textContent = `INSCRIÇÃO ${tipoInscricao.toUpperCase()}`;
    }

    /**
     * Função para exibir mensagens de feedback visual na tela
     */
    function showFeedback(message, isError = true) {
        if (!feedbackMessage) return;
        feedbackMessage.textContent = message;
        feedbackMessage.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700');
        
        if (isError) {
            feedbackMessage.classList.add('bg-red-100', 'text-red-700');
        } else {
            feedbackMessage.classList.add('bg-green-100', 'text-green-700');
        }
        
        // Garante que o usuário veja a mensagem
        feedbackMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    /**
     * Função para processar, redimensionar e converter a imagem para 3x4 JPEG
     */
    async function processImage(file) {
        console.log('LOG: Iniciando processamento da imagem original:', file.name, `(${Math.round(file.size/1024)}KB)`);
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const ctx = canvasResize.getContext('2d');
                
                // Dimensões padrão 3x4 para documentos
                const targetWidth = 600;
                const targetHeight = 800;
                
                canvasResize.width = targetWidth;
                canvasResize.height = targetHeight;

                // Cálculo de crop centralizado
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
                
                // Converte para Blob JPEG com qualidade equilibrada
                canvasResize.toBlob((blob) => {
                    if (blob) {
                        console.log('LOG: Imagem processada com sucesso. Novo tamanho:', Math.round(blob.size/1024), 'KB');
                        resolve(blob);
                    } else {
                        reject(new Error('Erro ao converter imagem para Blob.'));
                    }
                }, 'image/jpeg', 0.85);
            };
            img.onerror = () => reject(new Error('Erro ao carregar a imagem para processamento.'));
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
                }
                reader.readAsDataURL(file);
            }
        });
    }

    /**
     * EVENTO PRINCIPAL: Clique no Botão de Finalizar Cadastro
     */
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            console.log('--- INÍCIO DO FLUXO DE CADASTRO ---');
            
            // Limpa mensagens anteriores
            feedbackMessage.classList.add('hidden');
            
            // 1. VALIDAÇÃO DE CAMPOS
            const nome = document.getElementById('nome').value.trim();
            const telefone = document.getElementById('telefone').value.trim();
            const cidade = document.getElementById('cidade').value.trim();
            const paroquia = document.getElementById('paroquia').value.trim();
            const fotoFile = photoInput.files[0];

            if (!nome || !telefone || !cidade || !paroquia) {
                console.warn('LOG: Validação falhou - campos vazios.');
                showFeedback('Por favor, preencha todos os campos obrigatórios.');
                return;
            }

            // 2. VALIDAÇÃO DE FOTO OBRIGATÓRIA
            if (!fotoFile) {
                console.warn('LOG: Validação falhou - sem foto.');
                showFeedback('A foto é obrigatória para realizar a inscrição.');
                return;
            }

            console.log('LOG: Dados básicos validados:', { nome, tipo: tipoInscricao });

            // Trava o botão para evitar cliques duplos
            submitBtn.disabled = true;
            submitBtn.textContent = 'Processando imagem...';

            try {
                // Verifica se o cliente Supabase está disponível
                if (!window.supabaseClient) {
                    throw new Error('O sistema não conseguiu se conectar ao Supabase. Verifique sua conexão ou configurações.');
                }

                // 3. PROCESSAMENTO DA IMAGEM
                const processedBlob = await processImage(fotoFile);

                // 4. GERAÇÃO DE NOME ÚNICO
                const timestamp = Date.now();
                const randomStr = Math.random().toString(36).substring(7);
                const fileName = `${tipoInscricao}_${timestamp}_${randomStr}.jpg`;
                
                // 5. UPLOAD PARA O SUPABASE STORAGE
                const BUCKET_NAME = 'fotos';
                console.log(`LOG: Iniciando upload para o bucket "${BUCKET_NAME}"...`);
                console.log('LOG: Nome do arquivo gerado:', fileName);
                console.log('LOG: Tamanho do blob para upload:', Math.round(processedBlob.size/1024), 'KB');

                submitBtn.textContent = 'Enviando foto...';

                // Realiza o upload sem timeout manual para capturar o erro real do Supabase
                const { data: uploadData, error: uploadError } = await window.supabaseClient
                    .storage
                    .from(BUCKET_NAME)
                    .upload(fileName, processedBlob, {
                        contentType: 'image/jpeg',
                        upsert: false
                    });

                // Captura erro detalhado do Storage
                if (uploadError) {
                    console.error('LOG: ERRO DETALHADO NO UPLOAD:', uploadError);
                    throw new Error(`Erro no Supabase Storage: ${uploadError.message || 'Falha ao enviar arquivo'}`);
                }

                console.log('LOG: Resposta do upload recebida com sucesso:', uploadData);

                // 6. OBTER URL PÚBLICA
                const { data: publicUrlData } = window.supabaseClient
                    .storage
                    .from(BUCKET_NAME)
                    .getPublicUrl(fileName);

                const publicUrl = publicUrlData.publicUrl;
                console.log('LOG: URL pública gerada:', publicUrl);

                if (!publicUrl) {
                    throw new Error('Falha ao gerar a URL pública da imagem.');
                }

                // 7. INSERT NA TABELA INSCRICOES
                submitBtn.textContent = 'Gravando inscrição...';
                console.log('LOG: Iniciando insert na tabela "inscricoes"...');

                // Objeto de dados com compatibilidade para campos 'tipo' ou 'tipo_encontro'
                const payload = { 
                    nome, 
                    telefone, 
                    cidade, 
                    paroquia, 
                    foto_url: publicUrl,
                    foto_path: fileName,
                    created_at: new Date().toISOString()
                };

                // Adiciona ambos para garantir compatibilidade com o schema do banco
                payload.tipo = tipoInscricao;
                payload.tipo_encontro = tipoInscricao;

                const { data: insertData, error: insertError } = await window.supabaseClient
                    .from('inscricoes')
                    .insert([payload])
                    .select();

                if (insertError) {
                    console.error('LOG: ERRO DETALHADO NO INSERT:', insertError);
                    // Se o erro for de coluna inexistente, tentamos remover um dos campos e repetir? 
                    // Mas o ideal é mostrar o erro para ajuste manual ou diagnóstico.
                    throw new Error(`Erro ao salvar no banco: ${insertError.message}`);
                }

                console.log('LOG: Resposta do insert recebida com sucesso:', insertData);
                console.log('LOG: Inscrição finalizada com sucesso total!');

                showFeedback('Inscrição realizada com sucesso! Redirecionando...', false);

                // 8. REDIRECIONAMENTO
                setTimeout(() => {
                    window.location.href = `/sucesso.html?tipo=${tipoInscricao}`;
                }, 1500);

            } catch (err) {
                console.error('LOG: ERRO CAPTURADO NO FLUXO:', err);
                // Mostra a mensagem de erro amigável mas informativa
                showFeedback(`Falha no cadastro: ${err.message}`);
            } finally {
                // RESTAURAÇÃO DO BOTÃO
                // Só restaura se não tiver redirecionado (caso de erro)
                if (!window.location.href.includes('sucesso.html')) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Finalizar Inscrição';
                    console.log('LOG: Botão restaurado para nova tentativa.');
                }
                console.log('--- FIM DO FLUXO DE CADASTRO ---');
            }
        });
    }
});



