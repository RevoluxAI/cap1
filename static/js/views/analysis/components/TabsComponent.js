/* * * *
 *
 * Componente para gerenciar a navegação por abas na visualização de análise
 *
 * * * */
import { BaseComponent } from './BaseComponent.js';

export class TabsComponent extends BaseComponent {
    /**
     * Inicializa o componente de abas
     * @param {string} tabsContainerId - ID do elemento que contém as abas
     * @param {string} contentContainerSelector - Seletor do elemento que contém o conteúdo das abas
     **/
    constructor(tabsContainerId = 'analysisTabs', contentContainerSelector = '.tab-content') {
        super(tabsContainerId);
        this.contentContainerSelector = contentContainerSelector;
        this.contentContainer = null;
        this.activeTabId = null;
        this.tabs = [];
    }

    /**
     * Inicializa o componente, buscando containers e configurando eventos
     * @returns {boolean} - True se a inicialização foi bem sucedida
     **/
    initialize() {
        const result = super.initialize();
        if (!result) {
            console.error(`Container de abas #${this.containerId} não encontrado`);
            return false;
        }

        // usando querySelector para poder usar seletores CSS mais flexíveis
        this.contentContainer = document.querySelector(this.contentContainerSelector);
        if (!this.contentContainer) {
            console.error(`Container de conteúdo ${this.contentContainerSelector} não encontrado`);
            return false;
        }
        
        // mapeia todas as abas disponíveis
        this.tabs = Array.from(this.container.querySelectorAll('.nav-link')).map(tab => ({
            element: tab,
            target: tab.getAttribute('href')
        }));

        // configura evento de clique nas abas
        this.tabs.forEach(tab => {
            tab.element.addEventListener('click', (e) => {
                e.preventDefault();
                this.activateTab(tab.target);
            });
        });

        return true;
    }

    /**
     * Ativa uma aba específica
     * @param {string} tabId - ID da aba a ser ativada
     * @returns {boolean} - True se a aba foi ativada com sucesso
     **/
    activateTab(tabId) {
        if (!tabId) return false;
        
        // verifica se o componente foi inicializado corretamente
        if (!this.container || !this.contentContainer) {
            console.warn('Componente de abas não inicializado corretamente');
            return false;
        }

        // remove classe active de todas as abas
        this.tabs.forEach(tab => {
            tab.element.classList.remove('active');
        });
        
        // remove classe active de todos os conteúdos
        const contents = this.contentContainer.querySelectorAll('.tab-pane');
        contents.forEach(content => {
            content.classList.remove('show', 'active');
        });
        
        // ativa aba selecionada
        const selectedTab = this.tabs.find(tab => tab.target === tabId);
        if (selectedTab) {
            selectedTab.element.classList.add('active');
            this.activeTabId = tabId;
        } else {
            console.warn(`Aba ${tabId} não encontrada`);
            return false;
        }
        
        // ativa conteúdo selecionado
        const selectedContent = this.contentContainer.querySelector(tabId);
        if (selectedContent) {
            selectedContent.classList.add('show', 'active');
            
            // disparar evento de mudança de aba
            const event = new CustomEvent('tab:changed', {
                detail: { tabId, previousTabId: this.activeTabId }
            });
            document.dispatchEvent(event);
            
            return true;
        }
        
        return false;
    }

    /**
     * Retorna o ID da aba atualmente ativa
     * @returns {string|null} - ID da aba ativa ou null
     **/
    getActiveTabId() {
        return this.activeTabId;
    }

    /**
     * Encontra e retorna a lista de abas disponíveis
     * @returns {Array} - Lista de IDs das abas
     **/
    getAvailableTabs() {
        return this.tabs.map(tab => tab.target);
    }
}

