/* * * *
 *
 * Funções utilitárias compartilhadas para a visualização de cultura
 *
 * * * */
import { ProgressBarUtils } from '../utils/progress-bar.utils.js';

export class CultureViewUtils {
    /**
     * Obtém a classe CSS para o status baseado no valor
     * Delegando para a classe utilitária centralizada
     * @param {string} status - Status (ex: 'adequado', 'abaixo', 'acima')
     * @returns {string} - Classe CSS correspondente
     **/
    static getAlertType(status) {
        return ProgressBarUtils.getStatusClass(status);
    }

    /**
     * Calcula a largura percentual da barra de progresso
     * Delegando para a classe utilitária centralizada
     * @param {number} value - Valor atual
     * @param {Object} recommended - Objeto com min, max e ideal
     * @param {Object} options - Opções adicionais de configuração
     * @returns {number} - Percentual para largura da barra (0-100)
     **/
    static getProgressWidth(value, recommended, options = {}) {
        return ProgressBarUtils.getProgressWidth(value, recommended, options);
    }

    /**
     * Calcula a largura percentual da barra de progresso para área
     * Delegando para a classe utilitária centralizada
     * @param {number} value - Valor atual
     * @param {Object} recommended - Objeto com min, max e ideal
     * @param {Object} options - Opções adicionais de configuração
     * @returns {number} - Percentual para largura da barra (0-100)
     **/
    static getAreaProgressWidth(value, recommended, options = {}) {
        return ProgressBarUtils.getAreaProgressWidth(value, recommended, options);
    }

    /**
     * Cria e exibe um modal com recomendações para uma cultura
     * @param {Object} config - Configuração do modal
     * @param {string} config.title - Título do modal
     * @param {string} config.id - ID único para o modal
     * @param {string} config.headerClass - Classe CSS para o cabeçalho (ex: 'bg-success')
     * @param {Object} config.recommendations - Dados de recomendações
     * @param {Object} config.culture - Dados da cultura
     * @param {string} config.infoTitle - Título da seção de informações
     * @param {Object} config.options - Opções para o cálculo da barra de progresso
     **/
    static showRecommendationsModal(config) {
        // extrai opções da configuração
        const { 
            title, 
            id, 
            headerClass, 
            recommendations, 
            culture, 
            infoTitle, 
            options = {} 
        } = config;
        
        // armazena o elemento que tem o foco atualmente antes de abrir o modal
        const activeElement = document.activeElement;
        
        // remove modal existente, se houver
        const existingModal = document.getElementById(id);
        if (existingModal) {
            // usa bootstrap para esconder o modal se ele existir
            const existingInstance = bootstrap.Modal.getInstance(existingModal);
            if (existingInstance) {
                existingInstance.dispose();
            }
            existingModal.remove();
        }
        
        // verifica se temos todos os dados necessários
        if (!recommendations || !culture) {
            console.error("Dados insuficientes para exibir o modal");
            return;
        }
        
        // status da irrigação
        const irrigClass = culture.irrigacao ? 'success' : 'warning';
        const irrigIcon = culture.irrigacao ? 'check-circle' : 'exclamation-triangle';
        
        // cria HTML para o modal
        const modalHtml = `
            <div class="modal modal-accessible" id="${id}" tabindex="-1" aria-labelledby="modalLabel">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header ${headerClass} text-white">
                            <h5 class="modal-title" id="modalLabel">${title}</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fechar"></button>
                        </div>
                        <div class="modal-body">
                            <!-- Informações -->
                            <div class="alert alert-info">
                                <strong>${infoTitle}:</strong> ${recommendations.variedade_info?.duracao || recommendations.ciclo_info?.duracao} - ${recommendations.variedade_info?.descricao || recommendations.ciclo_info?.descricao}
                            </div>
                            
                            <!-- Grid para parâmetros -->
                            <div class="row">
                                <!-- Coluna para espaçamento -->
                                <div class="col-md-6">
                                    <div class="card mb-3">
                                        <div class="card-header">
                                            <h6 class="mb-0">Espaçamento entre Linhas</h6>
                                        </div>
                                        <div class="card-body">
                                            <div class="progress mb-3" style="height: 20px;">
                                                <div class="progress-bar ${this.getAlertType(recommendations.espacamento.status)}" 
                                                     style="width: ${this.getProgressWidth(culture.espacamento, recommendations.espacamento.recomendado, options)}%">
                                                    ${culture.espacamento} m
                                                </div>
                                            </div>
                                            <p>${recommendations.espacamento.mensagem}</p>
                                            <div class="small text-muted">
                                                Recomendado: ${recommendations.espacamento.recomendado.min}-${recommendations.espacamento.recomendado.max} m 
                                                (ideal: ${recommendations.espacamento.recomendado.ideal} m)
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Coluna para área -->
                                <div class="col-md-6">
                                    <div class="card mb-3">
                                        <div class="card-header">
                                            <h6 class="mb-0">Área de Cultivo</h6>
                                        </div>
                                        <div class="card-body">
                                            <div class="progress mb-3" style="height: 20px;">
                                                <div class="progress-bar ${this.getAlertType(recommendations.area.status)}" 
                                                     style="width: ${this.getAreaProgressWidth(culture.area, recommendations.area.recomendado, options)}%">
                                                    ${culture.area} ha
                                                </div>
                                            </div>
                                            <p>${recommendations.area.mensagem}</p>
                                            <div class="small text-muted">
                                                Recomendado: ${recommendations.area.recomendado.min} ha ${recommendations.area.recomendado.max ? '- ' + recommendations.area.recomendado.max + ' ha' : 'ou mais'} 
                                                (ideal: ${recommendations.area.recomendado.ideal} ha)
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Informações sobre irrigação -->
                            <div class="card">
                                <div class="card-header">
                                    <h6 class="mb-0">Sistema de Irrigação</h6>
                                </div>
                                <div class="card-body">
                                    <div class="d-flex align-items-center mb-3">
                                        <div class="fs-3 me-3 text-${irrigClass}">
                                            <i class="fas fa-${irrigIcon}"></i>
                                        </div>
                                        <div>
                                            <div class="fw-bold">Status: ${culture.irrigacao ? 'Ativado' : 'Não Ativado'}</div>
                                            <div>${recommendations.irrigacao.mensagem}</div>
                                        </div>
                                    </div>
                                    
                                    <h6>Recomendações:</h6>
                                    <div class="row g-3 mt-2">
                                        <div class="col-md-6">
                                            <div class="card h-100">
                                                <div class="card-header">
                                                    <h6 class="mb-0">Sistema</h6>
                                                </div>
                                                <div class="card-body d-flex align-items-center">
                                                    <span class="badge bg-primary px-3 py-2">${recommendations.irrigacao.sistema}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="col-md-6">
                                            <div class="card h-100">
                                                <div class="card-header">
                                                    <h6 class="mb-0">Volume</h6>
                                                </div>
                                                <div class="card-body d-flex align-items-center">
                                                    <span class="badge bg-primary px-3 py-2">${recommendations.irrigacao.volume}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="col-md-6">
                                            <div class="card h-100">
                                                <div class="card-header">
                                                    <h6 class="mb-0">Frequência</h6>
                                                </div>
                                                <div class="card-body">
                                                    <span class="badge bg-primary px-3 py-2 text-wrap">${recommendations.irrigacao.frequencia}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="col-md-6">
                                            <div class="card h-100">
                                                <div class="card-header">
                                                    <h6 class="mb-0">Eficiência</h6>
                                                </div>
                                                <div class="card-body">
                                                    <span class="badge bg-primary px-3 py-2 text-wrap">${recommendations.irrigacao.eficiencia}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary modal-close-btn" data-bs-dismiss="modal">Fechar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // adiciona o modal ao DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // obtém o elemento do modal
        const modalElement = document.getElementById(id);
        
        // configura eventos de acessibilidade
        modalElement.addEventListener('show.bs.modal', () => {
            // adiciona uma classe de ajuda para estilização, se necessário
            modalElement.classList.add('is-showing');
        });
        
        modalElement.addEventListener('shown.bs.modal', () => {
            // coloca foco no primeiro botão do modal
            const firstFocusableElement = modalElement.querySelector('.modal-close-btn');
            if (firstFocusableElement) {
                firstFocusableElement.focus();
            }
        });
        
        // adiciona manipulador para quando o modal começa a fechar
        modalElement.addEventListener('hide.bs.modal', () => {
            // restaurar o foco para o elemento que tinha o foco antes do modal ser aberto
            if (activeElement && typeof activeElement.focus === 'function') {
                activeElement.focus();
            } else {
                // fallback para o elemento body, que é sempre seguro
                document.body.focus();
            }
            
            // remove classes de acessibilidade
            modalElement.classList.remove('is-showing');
        });
        
        // manuseia a remoção total após fechamento
        modalElement.addEventListener('hidden.bs.modal', () => {
            // desativa completamente o modal e removê-lo
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.dispose();
            }
            modalElement.remove();
        });
        
        // adicio CSS de suporte para garantir que os modais sejam acessíveis
        const styleElement = document.getElementById('modal-accessibility-styles');
        if (!styleElement) {
            const style = document.createElement('style');
            style.id = 'modal-accessibility-styles';
            style.textContent = `
                /* Estilos para modais acessíveis */
                .modal-accessible[inert] {
                    display: none !important;
                }
                .modal-accessible:not(.show) {
                    display: none !important;
                }
                /* Garantir que aria-hidden não afete elementos focáveis */
                [aria-hidden="true"] :focus {
                    outline: none !important;
                }
            `;
            document.head.appendChild(style);
        }
        
        // inicializa e exibir o modal
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: true,
            keyboard: true,
            focus: true
        });
        
        modal.show();
    }
}

