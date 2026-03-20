/**
 * Arquivo: public/js/supabase.js
 * Descrição: Configuração e inicialização do cliente Supabase.
 */

// Importa a biblioteca do Supabase via CDN (ou assume que está disponível globalmente se carregada via script tag)
// Para este ambiente, vamos assumir que as chaves serão injetadas ou definidas aqui.
// NOTA: Em um ambiente real, use variáveis de ambiente.

const SUPABASE_URL = 'https://your-project-url.supabase.co';
const SUPABASE_KEY = 'your-anon-key';

// Inicializa o cliente Supabase
// Se estiver usando o script via CDN no HTML, o objeto 'supabase' estará disponível globalmente.
// Exemplo de inclusão no HTML: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>

let supabaseClient = null;

if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
    console.warn('Supabase library not loaded. Make sure to include the CDN script in your HTML.');
}

// Exporta o cliente para uso em outros arquivos
window.supabaseClient = supabaseClient;
