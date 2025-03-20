/* * * *
 *
 * Componente para visualização de recomendações específicas para soja
 *
 * * * */
import { CultureComponent } from './CultureComponent.js';

export class SoybeanComponent extends CultureComponent {
    /**
     * Inicializa o componente de soja
     * @param {string} containerId - ID do elemento que conterá o componente (opcional)
     */
    constructor(containerId = 'tab-recommendations') {
        super(containerId, 'Soja');
    }

    /**
     * Valida se os dados de recomendações para soja estão completos
     * @param {Object} recommendations - Dados de recomendações
     * @returns {boolean} - True se os dados estão completos
     */
    validateRecommendations(recommendations) {
        if (!recommendations || 
            !recommendations.variedade_info || 
            !recommendations.espacamento || 
            !recommendations.area || 
            !recommendations.irrigacao) {
            console.error("Dados de recomendações incompletos para soja:", recommendations);
            return false;
        }
        return true;
    }

    /**
     * Renderiza o componente de recomendações para soja
     * @param {Object} recommendations - Recomendações específicas para soja
     * @param {Object} culture - Dados da cultura
     * @param {Object} soySpecific - Dados específicos para soja (opcional)
     * @returns {boolean} - True se a renderização foi bem sucedida
     */
    render(recommendations, culture, soySpecific = null) {
        // valida as recomendações
        if (!this.validateRecommendations(recommendations)) {
            return false;
        }

        // obtém ou criar a seção no DOM
        const sectionEl = this.ensureSection();
        if (!sectionEl) return false;
        
        // opções específicas para soja
        const soybeanOptions = {
            minRecommendedPercentage: 75,
            maxRecommendedPercentage: 95,
            idealPercentage: 100
        };
        
        // extrai informações de produtividade se soySpecific estiver disponível
        let productivityInfo = '';
        if (soySpecific && soySpecific.productivity_estimate) {
            productivityInfo = `
                <div class="alert alert-success mt-2">
                    <strong>Produtividade Estimada:</strong> 
                    ${soySpecific.productivity_estimate.sacas_por_hectare} sacas/ha 
                    (Total: ${soySpecific.productivity_estimate.total_sacas} sacas)
                </div>
            `;
        }
        
        // extrai informações de período de plantio
        let plantingPeriod = '';
        if (soySpecific && soySpecific.optimal_planting_period) {
            plantingPeriod = `
                <div class="alert alert-primary mt-2">
                    <strong>Período Ideal de Plantio:</strong> 
                    ${soySpecific.optimal_planting_period}
                </div>
            `;
        }
        
        // cria HTML para recomendações detalhadas
        let html = `
            <div class="card-header bg-success text-white">
                <h5 class="mb-0">Recomendações para Soja (Variedade ${culture.variedade || 'Não especificada'})</h5>
            </div>
            <div class="card-body">
        `;
        
        // adiciona informações da variedade
        html += `
            <div class="alert alert-info">
                <strong>Informações da Variedade:</strong> ${recommendations.variedade_info.duracao} - ${recommendations.variedade_info.descricao}
            </div>
            ${productivityInfo}
            ${plantingPeriod}
        `;
        
        // grid para parâmetros
        html += `<div class="row">`;
        
        // coluna para espaçamento
        html += `
            <div class="col-md-6">
                <div class="card mb-3">
                    <div class="card-header">
                        <h6 class="mb-0">Espaçamento entre Linhas</h6>
                    </div>
                    <div class="card-body">
                        <div class="progress mb-3" style="height: 20px;">
                            <div class="progress-bar ${this.getStatusClass(recommendations.espacamento.status)}" 
                                 style="width: ${this.getProgressWidth(culture.espacamento, recommendations.espacamento.recomendado, soybeanOptions)}%">
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
        `;
        
        // coluna para área
        html += `
            <div class="col-md-6">
                <div class="card mb-3">
                    <div class="card-header">
                        <h6 class="mb-0">Área de Cultivo</h6>
                    </div>
                    <div class="card-body">
                        <div class="progress mb-3" style="height: 20px;">
                            <div class="progress-bar ${this.getStatusClass(recommendations.area.status)}" 
                                 style="width: ${this.getAreaProgressWidth(culture.area, recommendations.area.recomendado, soybeanOptions)}%">
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
        `;
        
        html += `</div>`; // fim da row
        
        // informações sobre irrigação
        const irrigClass = culture.irrigacao ? 'success' : 'warning';
        const irrigIcon = culture.irrigacao ? 'check-circle' : 'exclamation-triangle';
        
        html += `
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
                    
                    <h6>Recomendações para Esta Variedade:</h6>
                    
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
        `;
        
        html += `</div>`; // fim do card-body
        
        // atualiza conteúdo da seção
        sectionEl.innerHTML = html;
        
        console.log("Renderização das recomendações de soja concluída com sucesso");
        return true;
    }
}

