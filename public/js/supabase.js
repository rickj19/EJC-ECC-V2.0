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
// CONFIGURAÇÕES DO SUPABASE
// =========================================================================
const SUPABASE_URL = 'https://awglcljrdeypvactoyqy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_XosIBSkkgDPtPSrRmYqOHw_s1rpr6kw';
// =========================================================================

/**
 * Inicializa o cliente Supabase.
 * O objeto 'supabase' é carregado via CDN <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 * Este script deve vir ANTES de qualquer outro script que use o Supabase.
 */
let supabaseClient = null;

try {
    // Verifica se a biblioteca do Supabase foi carregada corretamente pelo CDN
    if (typeof supabase !== 'undefined') {
        // Criação do cliente usando a biblioteca global
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('LOG [Supabase]: Cliente inicializado com sucesso.');
    } else {
        console.error('ERRO [Supabase]: Biblioteca Supabase não encontrada no escopo global. Verifique o CDN no HTML.');
    }
} catch (error) {
    console.error('ERRO [Supabase]: Falha crítica na inicialização:', error);
}

/**
 * Exporta o cliente para a janela global (window).
 * Isso permite que outros arquivos (login.js, usuarios-admin.js, etc.) acessem 'window.supabaseClient'.
 */
window.supabaseClient = supabaseClient;
