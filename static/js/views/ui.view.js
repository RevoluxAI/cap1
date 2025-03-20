/* * * *
 *
 * Componentes de UI compartilhados por toda a aplicação
 *
 * * * */
export class UIView {
    /**
     * Exibe um alerta temporário
     * @param {string} message - Mensagem a ser exibida
     * @param {string} type - Tipo do alerta (success, info, warning, danger)
     * @param {number} duration - Duração em milissegundos (0 para não fechar automaticamente)
     **/
    showAlert(message, type = 'info', duration = 5000) {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
            </div>
        `;
        
        const alertContainer = document.getElementById('alert-container');
        alertContainer.innerHTML = alertHtml;
        
        if (duration > 0) {
            setTimeout(() => {
                const alert = alertContainer.querySelector('.alert');
                if (alert) {
                    alert.classList.remove('show');
                    setTimeout(() => alertContainer.innerHTML = '', 150);
                }
            }, duration);
        }
    }
    
    /**
     * Exibe indicador de carregamento
     * @param {string} containerId - ID do container onde o loading será exibido
     * @param {string} message - Mensagem a ser exibida
     **/
    showLoading(containerId, message = 'Carregando...') {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando...</span>
                </div>
                <p class="mt-2">${message}</p>
            </div>
        `;
    }
    
    /**
     * Exibe uma mensagem de erro
     * @param {string} containerId - ID do container onde o erro será exibido
     * @param {string} message - Mensagem de erro
     **/
    showError(containerId, message) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="text-center py-4">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    ${message}
                </div>
            </div>
        `;
    }
    
    /**
     * Exibe uma mensagem de conteúdo vazio
     * @param {string} containerId - ID do container onde a mensagem será exibida
     * @param {string} message - Mensagem a ser exibida
     * @param {string} type - Tipo do alerta (info, warning)
     **/
    showEmpty(containerId, message, type = 'info') {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="text-center py-4">
                <div class="alert alert-${type}">
                    ${message}
                </div>
            </div>
        `;
    }
    
    /**
     * Exibe uma caixa de confirmação
     * @param {string} message - Mensagem de confirmação
     * @param {string} title - Título da caixa de confirmação
     * @returns {Promise<boolean>} Promise que resolve para true se confirmado, false caso contrário
     **/
    confirm(message, title = 'Confirmação') {
        return new Promise((resolve) => {
            // verificar se já existe um modal de confirmação
            let modal = document.getElementById('confirmationModal');
            if (modal) {
                modal.remove();
            }
            
            // criar modal de confirmação
            const modalHtml = `
                <div class="modal fade" id="confirmationModal" tabindex="-1" aria-labelledby="confirmationModalLabel" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="confirmationModalLabel">${title}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                            </div>
                            <div class="modal-body">
                                ${message}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                <button type="button" class="btn btn-primary" id="confirmBtn">Confirmar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // adicionar modal ao DOM
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            modal = document.getElementById('confirmationModal');
            
            // inicializar modal do Bootstrap
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
            
            // configurar eventos
            modal.addEventListener('hidden.bs.modal', () => {
                resolve(false);
                modal.remove();
            });
            
            document.getElementById('confirmBtn').addEventListener('click', () => {
                bsModal.hide();
                resolve(true);
            });
        });
    }
}

