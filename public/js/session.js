/**
 * Arquivo: public/js/session.js
 * Descrição: Gerenciamento centralizado de sessão, expiração e logout.
 * 
 * Este script lida com o armazenamento seguro da sessão no localStorage,
 * verifica a validade temporal (expiração) e fornece a função global de logout.
 */

const SessionManager = {
    // Chave utilizada no localStorage
    STORAGE_KEY: 'usuario_logado',
    
    // Tempo de expiração da sessão (8 horas em milissegundos)
    // 8 horas * 60 minutos * 60 segundos * 1000 milissegundos
    SESSION_EXPIRATION_MS: 8 * 60 * 60 * 1000,

    /**
     * Salva os dados do usuário e o timestamp de login.
     * @param {Object} usuario Dados do usuário (sem a senha).
     */
    salvarSessao: function(usuario) {
        console.log('LOG [Session]: Salvando nova sessão para:', usuario.email);
        const dadosSessao = {
            ...usuario,
            login_at: new Date().getTime()
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dadosSessao));
        console.log('LOG [Session]: Sessão persistida no localStorage.');
    },

    /**
     * Obtém os dados da sessão atual.
     * @returns {Object|null} Dados da sessão ou null se não existir.
     */
    obterSessao: function() {
        try {
            const sessaoJson = localStorage.getItem(this.STORAGE_KEY);
            if (!sessaoJson) return null;
            
            const sessao = JSON.parse(sessaoJson);
            
            // Verifica se a sessão expirou
            if (this.estaExpirada(sessao.login_at)) {
                console.warn('AVISO [Session]: Sessão expirada detectada.');
                this.limparSessao();
                alert('Sua sessão expirou. Faça login novamente.');
                window.location.href = '/login.html';
                return null;
            }

            return sessao;
        } catch (e) {
            console.error('ERRO [Session]: Falha ao ler sessão.', e);
            this.limparSessao();
            return null;
        }
    },

    /**
     * Verifica se o timestamp fornecido ultrapassou o limite de expiração.
     * @param {number} loginAt Timestamp do login.
     * @returns {boolean} True se expirou, false caso contrário.
     */
    estaExpirada: function(loginAt) {
        if (!loginAt) return true;
        const agora = new Date().getTime();
        const diferenca = agora - loginAt;
        return diferenca > this.SESSION_EXPIRATION_MS;
    },

    /**
     * Remove os dados da sessão do localStorage.
     */
    limparSessao: function() {
        console.log('LOG [Session]: Limpando dados de sessão do localStorage.');
        localStorage.removeItem(this.STORAGE_KEY);
    },

    /**
     * Executa o logout global do sistema.
     */
    logout: function() {
        console.log('LOG [Session]: Executando logout global...');
        this.limparSessao();
        console.log('LOG [Session]: Redirecionando para a página inicial.');
        window.location.href = '/index.html';
    }
};

// Torna o SessionManager global para ser usado em qualquer script
window.SessionManager = SessionManager;
