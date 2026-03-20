/**
 * Arquivo: public/js/teste-supabase.js
 * Descrição: Lógica para testar a conexão e leitura do Supabase.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('DEBUG: Página de teste carregada.');

    // Elementos da UI
    const btnTestConn = document.getElementById('btn-test-conn');
    const btnTestUsers = document.getElementById('btn-test-users');
    const btnTestInsc = document.getElementById('btn-test-insc');
    const resultContainer = document.getElementById('test-result-container');
    const resultIcon = document.getElementById('result-icon');
    const resultTitle = document.getElementById('result-title');
    const resultContent = document.getElementById('result-content');

    /**
     * Exibe o resultado visual na tela
     */
    function showResult(type, title, message, data = null) {
        // Limpa classes anteriores
        resultContainer.classList.remove('hidden', 'test-success', 'test-error', 'test-info');
        
        if (type === 'success') {
            resultContainer.classList.add('test-success');
            resultIcon.setAttribute('data-lucide', 'check-circle');
        } else if (type === 'error') {
            resultContainer.classList.add('test-error');
            resultIcon.setAttribute('data-lucide', 'alert-circle');
        } else {
            resultContainer.classList.add('test-info');
            resultIcon.setAttribute('data-lucide', 'info');
        }

        resultTitle.textContent = title;
        resultContent.textContent = message + (data ? '\n\n' + JSON.stringify(data, null, 2) : '');
        
        // Atualiza ícones Lucide
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    /**
     * Teste 1: Conexão Básica
     */
    btnTestConn.addEventListener('click', () => {
        console.log('DEBUG: Iniciando teste de conexão básica...');
        
        if (window.supabaseClient) {
            console.log('DEBUG: Cliente Supabase encontrado no objeto window.');
            showResult('success', 'Conexão Básica OK', 'O cliente Supabase foi inicializado corretamente no navegador.');
        } else {
            console.error('DEBUG: Cliente Supabase não encontrado.');
            showResult('error', 'Erro de Conexão', 'O cliente Supabase NÃO foi inicializado. Verifique as chaves no arquivo public/js/supabase.js.');
        }
    });

    /**
     * Teste 2: Leitura da Tabela Usuarios
     */
    btnTestUsers.addEventListener('click', async () => {
        console.log('DEBUG: Iniciando teste de leitura da tabela "usuarios"...');
        
        if (!window.supabaseClient) {
            showResult('error', 'Erro Crítico', 'Cliente Supabase não inicializado.');
            return;
        }

        try {
            const { data, error } = await window.supabaseClient
                .from('usuarios')
                .select('*')
                .limit(1);

            if (error) {
                console.error('DEBUG: Erro na consulta (usuarios):', error);
                showResult('error', 'Erro na Tabela Usuarios', `Falha ao ler dados:\n${error.message}\n\nCódigo: ${error.code}\nDetalhes: ${error.details}`);
            } else {
                console.log('DEBUG: Resposta recebida (usuarios):', data);
                if (data && data.length > 0) {
                    showResult('success', 'Leitura Usuarios OK', 'Conseguimos ler a tabela "usuarios" com sucesso!', data);
                } else {
                    showResult('info', 'Tabela Vazia', 'A tabela "usuarios" existe, mas não contém registros ou as políticas de segurança (RLS) impedem a leitura.');
                }
            }
        } catch (err) {
            console.error('DEBUG: Erro inesperado (usuarios):', err);
            showResult('error', 'Erro Inesperado', err.message);
        }
    });

    /**
     * Teste 3: Leitura da Tabela Inscricoes
     */
    btnTestInsc.addEventListener('click', async () => {
        console.log('DEBUG: Iniciando teste de leitura da tabela "inscricoes"...');
        
        if (!window.supabaseClient) {
            showResult('error', 'Erro Crítico', 'Cliente Supabase não inicializado.');
            return;
        }

        try {
            const { data, error } = await window.supabaseClient
                .from('inscricoes')
                .select('*')
                .limit(1);

            if (error) {
                console.error('DEBUG: Erro na consulta (inscricoes):', error);
                showResult('error', 'Erro na Tabela Inscricoes', `Falha ao ler dados:\n${error.message}\n\nCódigo: ${error.code}\nDetalhes: ${error.details}`);
            } else {
                console.log('DEBUG: Resposta recebida (inscricoes):', data);
                if (data && data.length > 0) {
                    showResult('success', 'Leitura Inscricoes OK', 'Conseguimos ler a tabela "inscricoes" com sucesso!', data);
                } else {
                    showResult('info', 'Tabela Vazia', 'A tabela "inscricoes" existe, mas não contém registros ou as políticas de segurança (RLS) impedem a leitura.');
                }
            }
        } catch (err) {
            console.error('DEBUG: Erro inesperado (inscricoes):', err);
            showResult('error', 'Erro Inesperado', err.message);
        }
    });
});
