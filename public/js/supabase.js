/**
 * Arquivo: public/js/supabase.js
 * Descrição: Configuração e inicialização do cliente Supabase.
 * 
 * INSTRUÇÕES DE CONFIGURAÇÃO:
 * 1. Acesse o painel do seu projeto no Supabase (https://supabase.com).
 * 2. Vá em Project Settings -> API.
 * 3. Copie a 'Project URL' e cole no campo SUPABASE_URL abaixo.
 * 4. Copie a 'anon public' key e cole no campo SUPABASE_KEY abaixo.
 */

// =========================================================================
// COLE_AQUI_SUA_SUPABASE_URL
// Exemplo: 'https://xyz.supabase.co'
const SUPABASE_URL = 'https://awglcljrdeypvactoyqy.supabase.co';

// COLE_AQUI_SUA_SUPABASE_ANON_KEY
// Exemplo: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
const SUPABASE_KEY = 'sb_publishable_XosIBSkkgDPtPSrRmYqOHw_s1rpr6kw';
// =========================================================================

// Inicializa o cliente Supabase
// O objeto 'supabase' é carregado via CDN <script> nos arquivos HTML
let supabaseClient = null;

try {
    if (typeof supabase !== 'undefined') {
        // Criação do cliente usando a biblioteca global
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('DEBUG: Cliente Supabase inicializado com sucesso.');
    } else {
        console.error('DEBUG: Biblioteca Supabase não encontrada. Verifique se o script CDN está presente no HTML.');
    }
} catch (error) {
    console.error('DEBUG: Erro crítico ao inicializar o Supabase:', error);
}

// Exporta o cliente para a janela global (window)
// Isso permite que login.js, cadastro.js e painel-admin.js acessem 'window.supabaseClient'
window.supabaseClient = supabaseClient;
