/* * * *
 * Classe base para componentes de visualização de análise
 * Define a interface comum que todos os componentes devem implementar
 * * * */
export class BaseComponent {
    /**
     * Inicializa o componente base
     * @param {string} containerId - ID do elemento HTML que conterá o componente
     **/
    constructor(containerId) {
        this.containerId = containerId;
        this.container = null;
    }

    /**
     * Inicializa o componente, buscando seu container no DOM
     * @returns {boolean} - True se a inicialização foi bem sucedida
     **/
    initialize() {
        this.container = document.getElementById(this.containerId);
        return this.container !== null;
    }

    /**
     * Renderiza o componente com os dados fornecidos
     * @param {Object} data - Dados para renderização
     * @param {Object} options - Opções adicionais de renderização
     * @returns {boolean} - True se a renderização foi bem sucedida
     **/
    render(data, options = {}) {
        if (!this.container) {
            console.error(`Container #${this.containerId} não encontrado para renderização`);
            return false;
        }
        // implementações filhas sobrescrevem este método
        return true;
    }

    /**
     * Limpa o conteúdo do componente
     **/
    clear() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }

    /**
     * Mostra uma mensagem de carregamento no componente
     * @param {string} message - Mensagem a ser exibida
     **/
    showLoading(message = 'Carregando...') {
        if (this.container) {
            this.container.innerHTML = `
                <div class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                    <p class="mt-2">${message}</p>
                </div>
            `;
        }
    }

    /**
     * Mostra uma mensagem de erro no componente
     * @param {string} message - Mensagem de erro a ser exibida
     **/
    showError(message) {
        if (this.container) {
            this.container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    ${message}
                </div>
            `;
        }
    }

    /**
     * Mostra uma mensagem de alerta no componente
     * @param {string} message - Mensagem de alerta a ser exibida
     * @param {string} type - Tipo do alerta (warning, info, etc)
     **/
    showAlert(message, type = 'warning') {
        if (this.container) {
            this.container.innerHTML = `
                <div class="alert alert-${type}">
                    ${message}
                </div>
            `;
        }
    }
}

