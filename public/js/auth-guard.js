/**
 * Arquivo: public/js/auth-guard.js
 * Descrição: Sistema de proteção de rotas e controle de acesso (Auth Guard).
 * 
 * Este script valida a sessão do usuário no localStorage e verifica se ele
 * possui as permissões necessárias para acessar a página atual.
 */

const AuthGuard = {
    /**
     * Obtém o usuário logado do localStorage.
     * @returns {Object|null} Objeto do usuário ou null se não houver sessão.
     */
    getUsuarioLogado: function() {
        try {
            const userJson = localStorage.getItem('usuario_logado');
            if (!userJson) return null;
            return JSON.parse(userJson);
        } catch (e) {
            console.error('ERRO [AuthGuard]: Falha ao ler localStorage.', e);
            return null;
        }
    },

    /**
     * Valida o acesso a uma página específica.
     * @param {Object} config Configuração de permissão (perfil e tipo_acesso).
     */
    protegerPagina: function(config) {
        const usuario = this.getUsuarioLogado();
        const paginaAtual = window.location.pathname.split('/').pop();

        console.log(`LOG [AuthGuard]: Validando acesso para a página: ${paginaAtual}`);
        
        // 1. Verifica se o usuário está logado
        if (!usuario) {
            console.warn('AVISO [AuthGuard]: Nenhum usuário logado detectado.');
            alert('Você precisa fazer login para acessar esta área.');
            window.location.href = '/login.html';
            return;
        }

        console.log('LOG [AuthGuard]: Usuário detectado:', {
            nome: usuario.nome,
            perfil: usuario.perfil,
            tipo_acesso: usuario.tipo_acesso
        });

        // 2. Valida as permissões baseadas na configuração da página
        let acessoPermitido = true;
        let mensagemErro = 'Você não tem permissão para acessar esta página.';
        let redirecionarPara = '/index.html';

        // Regra para Painel Admin
        if (config.perfil === 'admin') {
            if (usuario.perfil !== 'admin' || usuario.tipo_acesso !== 'geral') {
                acessoPermitido = false;
                console.error('ERRO [AuthGuard]: Acesso negado ao Painel Admin. Usuário não é administrador geral.');
                
                // Redireciona para o painel correto do usuário se ele tiver um
                if (usuario.tipo_acesso === 'ejc') redirecionarPara = '/painel-ejc.html';
                else if (usuario.tipo_acesso === 'ecc') redirecionarPara = '/painel-ecc.html';
            }
        } 
        // Regra para Painel EJC
        else if (config.tipo_acesso === 'ejc') {
            if (usuario.tipo_acesso !== 'ejc') {
                acessoPermitido = false;
                console.error('ERRO [AuthGuard]: Acesso negado ao Painel EJC. Tipo de acesso incompatível.');
                
                if (usuario.perfil === 'admin') redirecionarPara = '/painel-admin.html';
                else if (usuario.tipo_acesso === 'ecc') redirecionarPara = '/painel-ecc.html';
            }
        }
        // Regra para Painel ECC
        else if (config.tipo_acesso === 'ecc') {
            if (usuario.tipo_acesso !== 'ecc') {
                acessoPermitido = false;
                console.error('ERRO [AuthGuard]: Acesso negado ao Painel ECC. Tipo de acesso incompatível.');
                
                if (usuario.perfil === 'admin') redirecionarPara = '/painel-admin.html';
                else if (usuario.tipo_acesso === 'ejc') redirecionarPara = '/painel-ejc.html';
            }
        }

        // 3. Executa o bloqueio se necessário
        if (!acessoPermitido) {
            alert(mensagemErro);
            console.log(`LOG [AuthGuard]: Redirecionando para: ${redirecionarPara}`);
            window.location.href = redirecionarPara;
        } else {
            console.log('LOG [AuthGuard]: Acesso autorizado.');
            // Opcional: Mostrar o nome do usuário no console ou na tela
            document.body.classList.add('auth-ready');
        }
    },

    /**
     * Realiza o logout do sistema.
     */
    logout: function() {
        console.log('LOG [AuthGuard]: Executando logout...');
        localStorage.removeItem('usuario_logado');
        window.location.href = '/index.html';
    }
};

// Torna o AuthGuard global
window.AuthGuard = AuthGuard;
