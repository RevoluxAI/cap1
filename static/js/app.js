/**
 * FarmTech Solutions - Aplicativo Frontend
 * Arquivo principal que inicializa a aplicação
 */

// importa módulos
import { CONFIG } from './config.js';
import { CultureController } from './controllers/culture.controller.js';
import { AnalysisController } from './controllers/analysis.controller.js';
import { UIView } from './views/ui.view.js';

/**
 * Classe principal da aplicação
 */
class FarmTechApp {
    /**
     * Inicializa a aplicação
     */
    constructor() {
        // inicializa propriedades de estado
        this.currentView = 'cultures-view';
        this.currentCultureId = null;
        this.initializationComplete = false;
        this.initializationError = null;
        
        // utilitários e visualização
        this.uiView = new UIView();
        
        // controladores
        this.cultureController = null;
        this.analysisController = null;
        
        // tenta restaurar o estado da aplicação
        this.restoreAppState();
    }
    
    /**
     * Salva o estado atual da aplicação no localStorage
     */
    saveAppState() {
        try {
            const appState = {
                currentView: this.currentView,
                currentCultureId: this.currentCultureId,
                timestamp: Date.now()
            };
            localStorage.setItem('appState', JSON.stringify(appState));
            console.log("Estado da aplicação salvo:", appState);
        } catch (error) {
            console.error("Erro ao salvar estado da aplicação:", error);
        }
    }
    
    /**
     * Restaura o estado da aplicação a partir do localStorage
     */
    restoreAppState() {
        try {
            const storedState = localStorage.getItem('appState');
            if (!storedState) return;
            
            const appState = JSON.parse(storedState);
            console.log("Estado da aplicação carregado:", appState);
            
            // verifica se o estado é válido
            if (!appState || typeof appState !== 'object') {
                console.warn("Estado da aplicação inválido. Usando estado padrão.");
                localStorage.removeItem('appState');
                return;
            }
            
            // verifica se o estado não é muito antigo (30 minutos)
            const maxAge = 30 * 60 * 1000; // 30 minutos em milissegundos
            if (!appState.timestamp || Date.now() - appState.timestamp > maxAge) {
                console.log("Estado da aplicação expirado. Usando estado padrão.");
                localStorage.removeItem('appState');
                return;
            }
            
            // valida os valores restaurados
            if (appState.currentView && 
                typeof appState.currentView === 'string' &&
                this._isValidView(appState.currentView)) {
                this.currentView = appState.currentView;
            }
            
            // valida ID da cultura
            if (appState.currentCultureId !== null && 
                appState.currentCultureId !== undefined) {
                this.currentCultureId = appState.currentCultureId;
            }
            
            console.log(`Restaurando para view: ${this.currentView}, ` + 
                      `cultura: ${this.currentCultureId}`);
        } catch (error) {
            console.error("Erro ao restaurar estado da aplicação:", error);
            // em caso de erro, limpa o estado armazenado
            localStorage.removeItem('appState');
        }
    }
    
    /**
     * Verifica se uma view é válida
     * @param {string} viewId - ID da view
     * @returns {boolean} - True se a view for válida
     * @private
     */
    _isValidView(viewId) {
        const validViews = ['cultures-view', 'analysis-view', 'about-view'];
        return validViews.includes(viewId);
    }
    
    /**
     * Inicia a aplicação após o carregamento do DOM
     */
    init() {
        try {
            // inicia indicador de carregamento
            this._showLoadingIndicator();
            
            // carrega estilos CSS personalizados dinamicamente
            this._loadCustomStyles();
            
            // inicializa controladores
            this._initializeControllers();
            
            // configura navegação principal
            this._setupNavigation();
            
            // carrega dados iniciais
            this._loadInitialData().then(() => {
                // exibe view inicial baseada no estado restaurado
                this.showView(this.currentView);
                
                // se estiver na view de análise e houver uma cultura selecionada
                this._handleInitialAnalysisView();
                
                // marca inicialização como completa
                this.initializationComplete = true;
                
                console.log('FarmTech Solutions inicializado com sucesso!');
                
                // remove indicador de carregamento
                this._hideLoadingIndicator();
            }).catch(error => {
                this.initializationError = error;
                console.error('Erro durante inicialização da aplicação:', error);
                this._showErrorMessage('Erro ao inicializar aplicação', error.message);
                this._hideLoadingIndicator();
            });
        } catch (error) {
            this.initializationError = error;
            console.error('Erro crítico durante inicialização:', error);
            this._showErrorMessage('Erro crítico', error.message);
            this._hideLoadingIndicator();
        }
    }
    
    /**
     * Mostra um indicador de carregamento durante a inicialização
     * @private
     */
    _showLoadingIndicator() {
        // verifica se já existe um indicador de carregamento
        let loadingIndicator = document.getElementById('app-loading-indicator');
        
        if (!loadingIndicator) {
            loadingIndicator = document.createElement('div');
            loadingIndicator.id = 'app-loading-indicator';
            loadingIndicator.className = 'loading-overlay';
            loadingIndicator.innerHTML = `
                <div class="loading-container">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                    <p class="mt-2">Inicializando aplicação...</p>
                </div>
            `;
            
            // adiciona estilos inline para o indicador de carregamento
            const style = document.createElement('style');
            style.textContent = `
                .loading-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(255,255,255,0.8);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                }
                .loading-container {
                    text-align: center;
                    background-color: white;
                    padding: 20px;
                    border-radius: 5px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
            `;
            document.head.appendChild(style);
            
            document.body.appendChild(loadingIndicator);
        }
    }
    
    /**
     * Esconde o indicador de carregamento
     * @private
     */
    _hideLoadingIndicator() {
        const loadingIndicator = document.getElementById('app-loading-indicator');
        if (loadingIndicator) {
            // aplica fade out
            loadingIndicator.style.transition = 'opacity 0.5s';
            loadingIndicator.style.opacity = '0';
            
            // remove após a transição
            setTimeout(() => {
                if (loadingIndicator.parentNode) {
                    loadingIndicator.parentNode.removeChild(loadingIndicator);
                }
            }, 500);
        }
    }
    
    /**
     * Mostra uma mensagem de erro
     * @param {string} title - Título do erro
     * @param {string} message - Mensagem de erro
     * @private
     */
    _showErrorMessage(title, message) {
        if (this.uiView) {
            this.uiView.showAlert(
                `<strong>${title}:</strong> ${message}`, 
                'danger',
                0  // Não fecha automaticamente
            );
        } else {
            // fallback se uiView não estiver disponível
            alert(`${title}: ${message}`);
        }
    }
    
    /**
     * Inicializa os controladores
     * @private
     */
    _initializeControllers() {
        // inicializa controladores com tratamento de erros
        try {
            this.cultureController = new CultureController();
        } catch (error) {
            console.error('Erro ao inicializar CultureController:', error);
            throw new Error('Falha ao inicializar controlador de culturas: ' + 
                          error.message);
        }
        
        try {
            this.analysisController = new AnalysisController();
        } catch (error) {
            console.error('Erro ao inicializar AnalysisController:', error);
            throw new Error('Falha ao inicializar controlador de análises: ' + 
                          error.message);
        }
    }
    
    /**
     * Carrega dados iniciais necessários para a aplicação
     * @returns {Promise} - Promise resolvida quando dados são carregados
     * @private
     */
    async _loadInitialData() {
        // carregar culturas (necessário para qualquer view)
        if (this.cultureController) {
            await this.cultureController.loadCultures();
        }
    }
    
    /**
     * Lida com carregamento inicial da view de análise, se necessário
     * @private
     */
    _handleInitialAnalysisView() {
        if (this.currentView === 'analysis-view' && 
            this.currentCultureId !== null && 
            this.analysisController) {
            
            // verifica se o ID é válido
            if (typeof this.currentCultureId !== 'number' || 
                isNaN(this.currentCultureId)) {
                console.warn("ID de cultura inválido para análise inicial:", 
                           this.currentCultureId);
                return;
            }
            
            // verifica se a cultura existe
            if (this.cultureController && 
                this.cultureController.cultures && 
                this.currentCultureId >= this.cultureController.cultures.length) {
                console.warn("Cultura não encontrada para análise inicial:", 
                           this.currentCultureId);
                return;
            }
            
            // espera um pouco para garantir que os controladores estejam prontos
            setTimeout(() => {
                this.analysisController.viewCachedAnalysis(this.currentCultureId);
            }, 300);
        }
    }
    
    /**
     * Carrega estilos CSS personalizados dinamicamente
     * @private
     */
    _loadCustomStyles() {
        // verifica se já existe o link para os estilos dos cartões
        if (!document.getElementById('culture-cards-css')) {
            const link = document.createElement('link');
            link.id = 'culture-cards-css';
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = 'css/culture-cards.css';
            document.head.appendChild(link);
        }
        
        // adiciona estilos para correções de layout
        const fixesStyle = document.createElement('style');
        fixesStyle.id = 'layout-fixes-css';
        fixesStyle.textContent = `
            /* corrigir problemas de overflow */
            body {
                overflow-x: hidden;
            }
            
            /* melhorar espaçamento em elementos comuns */
            .card {
                overflow: hidden;
            }
            
            /* garante que espaços não se acumulem */
            .mb-4:last-child {
                margin-bottom: 0 !important;
            }
            
            /* ajuste para contêineres de cartões de culturas */
            #cultures-list {
                min-height: 200px;
            }
        `;
        document.head.appendChild(fixesStyle);
    }
    
    /**
     * Configura a navegação principal
     * @private
     */
    _setupNavigation() {
        // navegação principal
        const setupNavLink = (id, viewId) => {
            const element = document.getElementById(id);
            if (element) {
                // remove listener anterior para evitar duplicação
                const oldListener = element._clickHandler;
                if (oldListener) {
                    element.removeEventListener('click', oldListener);
                }
                
                // adiciona novo listener
                const handler = (e) => {
                    e.preventDefault();
                    this.showView(viewId);
                };
                
                element._clickHandler = handler;
                element.addEventListener('click', handler);
            } else {
                console.warn(`Elemento de navegação #${id} não encontrado`);
            }
        };
        
        // configura links de navegação
        setupNavLink('nav-cultures', 'cultures-view');
        setupNavLink('nav-analysis', 'analysis-view');
        setupNavLink('nav-about', 'about-view');
        
        // eventos para manter estado
        document.addEventListener('culture:action', (e) => {
            const { action, cultureId } = e.detail;
            
            if (!action || typeof cultureId !== 'number' || isNaN(cultureId)) {
                console.error("Dados inválidos em culture:action:", e.detail);
                return;
            }
            
            if (action === 'analyze' || action === 'view') {
                // salva ID da cultura atual
                this.currentCultureId = cultureId;
                this.saveAppState();
            }
        });
    }
    
    /**
     * Exibe uma view específica e oculta as demais
     * @param {string} viewId - ID da view a ser exibida
     */
    showView(viewId) {
        // valida viewId
        if (!this._isValidView(viewId)) {
            console.error(`View inválida: ${viewId}`);
            viewId = 'cultures-view'; // Fallback para view padrão
        }
        
        // verifica se a view existe no DOM
        const viewElement = document.getElementById(viewId);
        if (!viewElement) {
            console.error(`Elemento da view #${viewId} não encontrado`);
            return;
        }
        
        // armazena view atual
        this.currentView = viewId;
        
        // oculta todas as views
        const views = ['cultures-view', 'analysis-view', 'about-view'];
        views.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = 'none';
            }
        });
        
        // exibe a view solicitada
        viewElement.style.display = 'block';
        
        // atualiza navegação
        const navItems = document.querySelectorAll('.nav-link');
        navItems.forEach(item => item.classList.remove('active'));
        
        // ativa o link de navegação correspondente
        let activeNavId = null;
        if (viewId === 'cultures-view') {
            activeNavId = 'nav-cultures';
        } else if (viewId === 'analysis-view') {
            activeNavId = 'nav-analysis';
        } else if (viewId === 'about-view') {
            activeNavId = 'nav-about';
        }
        
        if (activeNavId) {
            const activeNav = document.getElementById(activeNavId);
            if (activeNav) {
                activeNav.classList.add('active');
            }
        }
        
        // dispara evento de mudança de view
        document.dispatchEvent(new CustomEvent('view:changed', {
            detail: { viewId }
        }));
        
        // salva o estado da aplicação
        this.saveAppState();
    }
    
    /**
     * Aplica estilos para os cartões de cultura com base nos dados
     * Método público disponível para uso pelos controladores
     * @param {NodeList|Array} cards - Lista de elementos de cartão de cultura
     */
    applyCultureCardStyles(cards) {
        if (!cards || cards.length === 0) return;
        
        // desconecta o observador temporariamente para evitar loops infinitos
        if (window._culturesObserver) {
            window._culturesObserver.disconnect();
        }
        
        Array.from(cards).forEach(card => {
            // evita processamento repetido de cartões que já foram estilizados
            if (card.dataset.stylesApplied === 'true') {
                return;
            }
            
            try {
                // determina o tipo de cultura para aplicar classe específica
                const typeElem = card.querySelector('.card-header h5');
                if (typeElem) {
                    const type = typeElem.textContent.trim().toLowerCase();
                    if (type.includes('soja')) {
                        card.classList.add('soja');
                    } else if (type.includes('cana')) {
                        card.classList.add('cana');
                    }
                }
                
                // verifica se tem badge de parâmetros ideais ou recomendações
                const recommendationBadge = card.querySelector('.badge-recommendation');
                if (recommendationBadge && 
                    recommendationBadge.textContent.includes('Recomendações')) {
                    card.classList.add('has-alerts');
                }
                
                // melhora o formato do ID com ícone
                const idBadge = card.querySelector('.badge');
                if (idBadge && idBadge.textContent.includes('ID:')) {
                    idBadge.classList.add('culture-id-badge');
                    
                    // adiciona classe baseada no tipo
                    if (card.classList.contains('soja')) {
                        idBadge.classList.add('soja');
                        // cria novo elemento ícone em vez de modificar innerHTML
                        const icon = document.createElement('i');
                        icon.className = 'fas fa-seedling';
                        // preserva ID atual como texto
                        const idText = idBadge.textContent.trim();
                        // limpa conteúdo atual
                        idBadge.textContent = '';
                        // adiciona ícone e texto
                        idBadge.appendChild(icon);
                        idBadge.appendChild(document.createTextNode(idText));
                    } else if (card.classList.contains('cana')) {
                        idBadge.classList.add('cana');
                        // cria novo elemento ícone
                        const icon = document.createElement('i');
                        icon.className = 'fas fa-tree';
                        // preserva ID atual como texto
                        const idText = idBadge.textContent.trim();
                        // limpa conteúdo atual
                        idBadge.textContent = '';
                        // adiciona ícone e texto
                        idBadge.appendChild(icon);
                        idBadge.appendChild(document.createTextNode(idText));
                    }
                }
                
                // adiciona ícones aos detalhes da cultura sem usar innerHTML
                const infoItems = card.querySelectorAll('.card-body div');
                infoItems.forEach(item => {
                    // evita reprocessamento
                    if (item.querySelector('.fas')) {
                        return;
                    }
                    
                    item.classList.add('culture-info-item');
                    const itemText = item.textContent.trim();
                    
                    // cria o ícone apropriado baseado no texto
                    const icon = document.createElement('i');
                    let iconClass = null;
                    
                    if (itemText.includes('Área:')) {
                        iconClass = 'fas fa-chart-area';
                    } else if (itemText.includes('Espaçamento:')) {
                        iconClass = 'fas fa-arrows-alt-h';
                    } else if (itemText.includes('Variedade:')) {
                        iconClass = 'fas fa-dna';
                    } else if (itemText.includes('Ciclo:')) {
                        iconClass = 'fas fa-sync-alt';
                    } else if (itemText.includes('Linhas calculadas:')) {
                        iconClass = 'fas fa-calculator';
                    }
                    
                    // adiciona o ícone apenas se tiver um ícone adequado
                    if (iconClass) {
                        icon.className = iconClass;
                        icon.style.marginRight = '8px';
                        item.insertBefore(icon, item.firstChild);
                    }
                });
                
                // marca cartão como processado para evitar reprocessamento
                card.dataset.stylesApplied = 'true';
            } catch (error) {
                console.warn('Erro ao aplicar estilos ao cartão:', error);
            }
        });
        
        // reconecta o observador com uma verificação adicional de processamento
        if (window._culturesObserver) {
            const culturesList = document.getElementById('cultures-list');
            if (culturesList) {
                window._culturesObserver.observe(culturesList, { 
                    childList: true, 
                    subtree: true 
                });
            }
        }
    }
}

// inicializa aplicação após carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
    try {
        const app = new FarmTechApp();
        app.init();
        
        // expõe app para debugging e uso por outros módulos
        window.app = app;
        
        // configura um observador de mutação para aplicar estilos a novos cartões
        try {
            const observer = new MutationObserver((mutations) => {
                // verifica se há novos cartões de cultura que ainda não foram processados
                const container = document.getElementById('cultures-list');
                if (!container) return;
                
                // processa apenas cartões não marcados como processados
                const newCards = container.querySelectorAll(
                    '.culture-card:not([data-styles-applied="true"])'
                );
                
                if (newCards.length > 0) {
                    app.applyCultureCardStyles(newCards);
                }
            });
            
            // inicia observação no container de culturas
            const culturesList = document.getElementById('cultures-list');
            if (culturesList) {
                observer.observe(culturesList, { 
                    childList: true, 
                    subtree: true 
                });
                
                // armazena observador para possível limpeza posterior
                window._culturesObserver = observer;
            }
        } catch (observerError) {
            console.warn('Erro ao configurar observador de mutação:', observerError);
            // falha no observador não é crítica para a aplicação
        }
    } catch (error) {
        console.error('Erro fatal ao inicializar aplicação:', error);
        
        // exibe mensagem de erro para o usuário
        const errorMsg = document.createElement('div');
        errorMsg.className = 'alert alert-danger m-3';
        errorMsg.innerHTML = `
            <h4 class="alert-heading">Erro de Inicialização</h4>
            <p>Não foi possível inicializar a aplicação devido a um erro:</p>
            <pre class="mt-2 p-2 bg-light">${error.message || 'Erro desconhecido'}</pre>
            <hr>
            <p class="mb-0">Por favor, recarregue a página ou tente novamente mais tarde.</p>
        `;
        
        // encontra um local para exibir a mensagem
        const container = document.querySelector('.container') || document.body;
        if (container.firstChild) {
            container.insertBefore(errorMsg, container.firstChild);
        } else {
            container.appendChild(errorMsg);
        }
    }
});

