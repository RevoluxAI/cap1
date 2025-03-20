/* * * *
 * FarmTech Solutions - Aplicativo Frontend
 * Arquivo principal que inicializa a aplicação
 * * * */

// importar módulos
import { CONFIG } from './config.js';
import { CultureController } from './controllers/culture.controller.js';
import { AnalysisController } from './controllers/analysis.controller.js';
import { UIView } from './views/ui.view.js';

/**
 * Classe principal da aplicação
 **/
class FarmTechApp {
    /**
     * Inicializa a aplicação
     **/
    constructor() {
        // inicializar controladores
        this.uiView = new UIView();
        this.cultureController = new CultureController();
        this.analysisController = new AnalysisController();
        
        // estado da aplicação
        this.currentView = 'cultures-view';
        this.currentCultureId = null;
        
        // tenta restaurar o estado da aplicação
        this.restoreAppState();
    }
    
    /**
     * Salva o estado atual da aplicação no localStorage
     **/
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
     **/
    restoreAppState() {
        try {
            const storedState = localStorage.getItem('appState');
            if (!storedState) return;
            
            const appState = JSON.parse(storedState);
            console.log("Estado da aplicação carregado:", appState);
            
            // verifica se o estado não é muito antigo (30 minutos)
            const maxAge = 30 * 60 * 1000; // 30 minutos em milissegundos
            if (Date.now() - appState.timestamp > maxAge) {
                console.log("Estado da aplicação expirado. Usando estado padrão.");
                localStorage.removeItem('appState');
                return;
            }
            
            // restaura view ativa
            this.currentView = appState.currentView;
            this.currentCultureId = appState.currentCultureId;
            
            console.log(`Restaurando para view: ${this.currentView}, cultura: ${this.currentCultureId}`);
        } catch (error) {
            console.error("Erro ao restaurar estado da aplicação:", error);
        }
    }
    
    /**
     * Inicia a aplicação após o carregamento do DOM
     **/
    init() {
        // configura navegação principal
        this.setupNavigation();
        
        // carrega dados iniciais
        this.cultureController.loadCultures();
        
        // exibe view inicial baseada no estado restaurado
        this.showView(this.currentView);
        
        // se estiver na view de análise e houver uma cultura selecionada, restaura análise
        if (this.currentView === 'analysis-view' && this.currentCultureId !== null) {
            // espera um pouco para garantir que os controladores estejam prontos
            setTimeout(() => {
                this.analysisController.viewCachedAnalysis(this.currentCultureId);
            }, 300);
        }
        
        console.log('FarmTech Solutions inicializado com sucesso!');
    }
    
    /**
     * Configura a navegação principal
     **/
    setupNavigation() {
        // navegação principal
        document.getElementById('nav-cultures').addEventListener('click', (e) => {
            e.preventDefault();
            this.showView('cultures-view');
        });
        
        document.getElementById('nav-analysis').addEventListener('click', (e) => {
            e.preventDefault();
            this.showView('analysis-view');
        });
        
        document.getElementById('nav-about').addEventListener('click', (e) => {
            e.preventDefault();
            this.showView('about-view');
        });
        
        // eventos para manter estado
        document.addEventListener('culture:action', (e) => {
            const { action, cultureId } = e.detail;
            
            if (action === 'analyze' || action === 'view') {
                // salvar ID da cultura atual
                this.currentCultureId = cultureId;
                this.saveAppState();
            }
        });
    }
    
    /**
     * Exibe uma view específica e oculta as demais
     * @param {string} viewId - ID da view a ser exibida
     **/
    showView(viewId) {
        // armazena view atual
        this.currentView = viewId;
        
        // oculta todas as views
        document.getElementById('cultures-view').style.display = 'none';
        document.getElementById('analysis-view').style.display = 'none';
        document.getElementById('about-view').style.display = 'none';
        
        // exibe a view solicitada
        document.getElementById(viewId).style.display = 'block';
        
        // atualiza navegação
        const navItems = document.querySelectorAll('.nav-link');
        navItems.forEach(item => item.classList.remove('active'));
        
        if (viewId === 'cultures-view') {
            document.getElementById('nav-cultures').classList.add('active');
        } else if (viewId === 'analysis-view') {
            document.getElementById('nav-analysis').classList.add('active');
        } else if (viewId === 'about-view') {
            document.getElementById('nav-about').classList.add('active');
        }
        
        // dispara evento de mudança de view
        document.dispatchEvent(new CustomEvent('view:changed', {
            detail: { viewId }
        }));
        
        // salva o estado da aplicação
        this.saveAppState();
    }
}

// inicializa aplicação após carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
    const app = new FarmTechApp();
    app.init();
    
    // expõe app para debugging (remover em produção)
    window.app = app;
});

