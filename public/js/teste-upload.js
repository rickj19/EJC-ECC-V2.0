/**
 * Arquivo: public/js/teste-upload.js
 * Descrição: Lógica isolada para diagnóstico de upload no Supabase Storage.
 * Foco: Transparência total no processo de envio e captura de erros reais.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa os ícones Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Referências aos elementos do DOM
    const fileInput = document.getElementById('test-file-input');
    const previewImg = document.getElementById('test-preview');
    const fileInfoArea = document.getElementById('file-info');
    const infoName = document.getElementById('info-name');
    const infoSize = document.getElementById('info-size');
    const infoType = document.getElementById('info-type');
    
    const btnUpload = document.getElementById('btn-test-upload');
    const btnUrl = document.getElementById('btn-test-url');
    const statusArea = document.getElementById('status-area');
    const logConsole = document.getElementById('log-console');
    
    const urlResultArea = document.getElementById('url-result-area');
    const publicUrlInput = document.getElementById('public-url-input');
    const publicUrlPreview = document.getElementById('public-url-preview');

    // Variável para armazenar o último arquivo enviado com sucesso
    let lastUploadedPath = null;
    let selectedFile = null;

    /**
     * Função para adicionar logs no console da tela
     */
    function addLog(message, type = 'info') {
        const logEntry = document.createElement('div');
        const timestamp = new Date().toLocaleTimeString();
        
        let colorClass = 'text-zinc-300';
        if (type === 'success') colorClass = 'text-emerald-400 font-bold';
        if (type === 'error') colorClass = 'text-red-400 font-bold';
        if (type === 'warning') colorClass = 'text-amber-400';
        
        logEntry.className = colorClass;
        logEntry.innerHTML = `<span class="text-zinc-600">[${timestamp}]</span> ${message}`;
        
        logConsole.appendChild(logEntry);
        logConsole.scrollTop = logConsole.scrollHeight;
        
        // Também loga no console real do navegador
        console.log(`[DIAGNÓSTICO] ${message}`);
    }

    /**
     * Função para exibir status visual
     */
    function showStatus(message, type = 'info') {
        statusArea.textContent = message;
        statusArea.classList.remove('hidden', 'bg-emerald-100', 'text-emerald-700', 'border-emerald-200', 'bg-red-100', 'text-red-700', 'border-red-200', 'bg-indigo-100', 'text-indigo-700', 'border-indigo-200');
        
        if (type === 'success') {
            statusArea.classList.add('bg-emerald-100', 'text-emerald-700', 'border-emerald-200');
        } else if (type === 'error') {
            statusArea.classList.add('bg-red-100', 'text-red-700', 'border-red-200');
        } else {
            statusArea.classList.add('bg-indigo-100', 'text-indigo-700', 'border-indigo-200');
        }
        
        statusArea.classList.remove('hidden');
    }

    // Verifica se o cliente Supabase está carregado
    if (window.supabaseClient) {
        addLog('Cliente Supabase detectado com sucesso.', 'success');
    } else {
        addLog('ERRO: Cliente Supabase não encontrado. Verifique js/supabase.js', 'error');
        showStatus('Erro: Supabase não inicializado.', 'error');
        btnUpload.disabled = true;
    }

    /**
     * Evento: Seleção de Arquivo
     */
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            selectedFile = file;
            addLog(`Arquivo selecionado: ${file.name}`, 'info');
            addLog(`Tamanho original: ${Math.round(file.size / 1024)} KB`, 'info');
            addLog(`Tipo MIME: ${file.type}`, 'info');

            // Preview
            const reader = new FileReader();
            reader.onload = (event) => {
                previewImg.src = event.target.result;
                fileInfoArea.classList.remove('hidden');
                infoName.textContent = file.name;
                infoSize.textContent = `${Math.round(file.size / 1024)} KB`;
                infoType.textContent = file.type;
            };
            reader.readAsDataURL(file);
            
            // Habilita botão de upload
            btnUpload.disabled = false;
            btnUrl.disabled = true;
            urlResultArea.classList.add('hidden');
        }
    });

    /**
     * Evento: Testar Upload
     */
    btnUpload.addEventListener('click', async () => {
        if (!selectedFile) {
            addLog('ERRO: Nenhum arquivo selecionado para upload.', 'error');
            return;
        }

        const BUCKET_NAME = 'fotos';
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const fileName = `teste_${timestamp}_${randomStr}.jpg`;
        
        addLog(`Iniciando upload para o bucket "${BUCKET_NAME}"...`, 'warning');
        addLog(`Nome do arquivo no Storage: ${fileName}`, 'info');

        btnUpload.disabled = true;
        btnUpload.textContent = 'Enviando...';
        showStatus('Enviando arquivo para o Supabase Storage...', 'info');

        try {
            // Realiza o upload usando o método oficial
            // Não usamos timeout artificial aqui para ver o comportamento real
            const { data, error } = await window.supabaseClient
                .storage
                .from(BUCKET_NAME)
                .upload(fileName, selectedFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                addLog(`ERRO NO UPLOAD: ${error.message}`, 'error');
                addLog(`Detalhes técnicos: ${JSON.stringify(error)}`, 'error');
                showStatus(`Falha no upload: ${error.message}`, 'error');
                throw error;
            }

            addLog('UPLOAD CONCLUÍDO COM SUCESSO!', 'success');
            addLog(`Resposta do Supabase: ${JSON.stringify(data)}`, 'success');
            showStatus('Upload realizado com sucesso!', 'success');
            
            lastUploadedPath = fileName;
            btnUrl.disabled = false;

        } catch (err) {
            console.error('DIAGNÓSTICO: Erro capturado no fluxo de upload:', err);
            // Se o erro for de rede ou timeout do navegador, ele cairá aqui
            if (err.message === 'Failed to fetch') {
                addLog('ERRO DE REDE: O navegador não conseguiu se comunicar com o servidor do Supabase. Verifique sua conexão ou se a URL do Supabase está correta.', 'error');
            }
        } finally {
            btnUpload.disabled = false;
            btnUpload.textContent = 'Testar Upload (fotos)';
        }
    });

    /**
     * Evento: Testar URL Pública
     */
    btnUrl.addEventListener('click', () => {
        if (!lastUploadedPath) {
            addLog('ERRO: Nenhum upload realizado para testar a URL.', 'error');
            return;
        }

        const BUCKET_NAME = 'fotos';
        addLog(`Gerando URL pública para: ${lastUploadedPath}`, 'warning');

        try {
            const { data } = window.supabaseClient
                .storage
                .from(BUCKET_NAME)
                .getPublicUrl(lastUploadedPath);

            const publicUrl = data.publicUrl;
            addLog(`URL pública gerada: ${publicUrl}`, 'success');
            
            publicUrlInput.value = publicUrl;
            publicUrlPreview.src = publicUrl;
            urlResultArea.classList.remove('hidden');
            
            showStatus('URL pública gerada e testada!', 'success');
            addLog('DIAGNÓSTICO FINALIZADO COM SUCESSO.', 'success');

        } catch (err) {
            addLog(`ERRO AO GERAR URL: ${err.message}`, 'error');
            showStatus('Falha ao gerar URL pública.', 'error');
        }
    });
});
