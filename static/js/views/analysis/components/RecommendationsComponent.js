/* * * *
 *
 * Componente para visualização de recomendações gerais para qualquer cultura
 *
 * * * */
import { BaseComponent } from './BaseComponent.js';

export class RecommendationsComponent extends BaseComponent {
    /**
     * Inicializa o componente de recomendações
     * @param {string} summaryId - ID do container para resumo
     * @param {string} basicRecommendationsId - ID do container para recomendações básicas
     * @param {string} specificRecommendationsId - ID do container para recomendações específicas
     * @param {string} inputsRecommendationsId - ID do container para manejo de insumos
     **/
    constructor(
        summaryId = 'recommendation-summary',
        basicRecommendationsId = 'basic-recommendations',
        specificRecommendationsId = 'specific-recommendations',
        inputsRecommendationsId = 'inputs-recommendations'
    ) {
        super(summaryId);
        this.basicRecommendationsId = basicRecommendationsId;
        this.specificRecommendationsId = specificRecommendationsId;
        this.inputsRecommendationsId = inputsRecommendationsId;
        
        this.basicContainer = null;
        this.specificContainer = null;
        this.inputsContainer = null;
    }

    /**
     * Inicializa o componente, buscando containers no DOM
     * @returns {boolean} - True se a inicialização foi bem sucedida
     **/
    initialize() {
        const result = super.initialize();
        if (!result) return false;

        this.basicContainer = document.getElementById(this.basicRecommendationsId);
        this.specificContainer = document.getElementById(this.specificRecommendationsId);
        this.inputsContainer = document.getElementById(this.inputsRecommendationsId);

        if (!this.basicContainer || !this.specificContainer || !this.inputsContainer) {
            console.error('Containers de recomendações não encontrados');
            return false;
        }

        return true;
    }

    /**
     * Renderiza o componente de recomendações
     * @param {Object} recommendations - Dados de recomendações
     * @returns {boolean} - True se a renderização foi bem sucedida
     **/
    render(recommendations) {
        if (!this.container || !this.basicContainer || !this.specificContainer || !this.inputsContainer) {
            return false;
        }

        if (!recommendations || !recommendations.data || !recommendations.data.summary) {
            this.container.innerHTML = '<div class="alert alert-warning">Nenhuma recomendação disponível</div>';
            this.basicContainer.innerHTML = '';
            this.specificContainer.innerHTML = '';
            this.inputsContainer.innerHTML = '';
            return false;
        }

        const data = recommendations.data;
        
        // renderiza resumo
        this._renderSummary(data.summary);
        
        // renderiza recomendações básicas
        this._renderBasicRecommendations(data.basic);
        
        // renderiza recomendações específicas
        this._renderSpecificRecommendations(data.specific);
        
        // renderiza recomendações de insumos
        this._renderInputsRecommendations(data.inputs_management);
        
        // renderiza seções adicionais
        this._renderAdditionalRecommendations(data);

        return true;
    }

    /**
     * Renderiza o resumo da análise
     * @param {Object} summary - Dados do resumo
     * @private
     **/
    _renderSummary(summary) {
        if (!summary) {
            this.container.innerHTML = '<div class="alert alert-warning">Resumo não disponível</div>';
            return;
        }

        let html = `
            <div class="mb-3">
                <h5>${summary.overall_assessment}</h5>
            </div>
            <div class="row">
                <div class="col-md-4">
                    <div class="recommendation-box ${summary.can_apply_chemicals ? 'border-success' : 'border-danger'}">
                        <h6>${summary.can_apply_chemicals ? 'Aplicação Possível' : 'Evitar Aplicação'}</h6>
                        <p class="mb-0">Condições para aplicação de defensivos</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="recommendation-box ${summary.needs_irrigation ? 'border-info' : 'border-secondary'}">
                        <h6>${summary.needs_irrigation ? 'Irrigação Recomendada' : 'Irrigação Opcional'}</h6>
                        <p class="mb-0">Status de necessidade hídrica</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="recommendation-box ${summary.ideal_for_fieldwork ? 'border-success' : 'border-warning'}">
                        <h6>${summary.ideal_for_fieldwork ? 'Condições Ideais' : 'Condições Limitantes'}</h6>
                        <p class="mb-0">Status para trabalho em campo</p>
                    </div>
                </div>
            </div>
        `;

        this.container.innerHTML = html;
    }

    /**
     * Renderiza as recomendações básicas
     * @param {Object} basic - Dados de recomendações básicas
     * @private
     **/
    _renderBasicRecommendations(basic) {
        if (!basic) {
            this.basicContainer.innerHTML = '';
            return;
        }

        let html = `
            <ul class="list-group">
                <li class="list-group-item">
                    <div class="fw-bold"><i class="fas fa-tint me-2"></i>Irrigação</div>
                    <p class="mb-0">${basic.irrigation}</p>
                </li>
                <li class="list-group-item">
                    <div class="fw-bold"><i class="fas fa-spray-can me-2"></i>Aplicação de Defensivos</div>
                    <p class="mb-0">${basic.chemicals_application}</p>
                </li>
                <li class="list-group-item">
                    <div class="fw-bold"><i class="fas fa-users me-2"></i>Trabalho de Campo</div>
                    <p class="mb-0">${basic.fieldwork}</p>
                </li>
            </ul>
        `;

        this.basicContainer.innerHTML = html;
    }

    /**
     * Renderiza as recomendações específicas
     * @param {Object} specific - Dados de recomendações específicas
     * @private
     */
    _renderSpecificRecommendations(specific) {
        if (!specific) {
            this.specificContainer.innerHTML = '';
            return;
        }

        let html = '<ul class="list-group">';
        
        if (specific.pest_management) {
            html += `
                <li class="list-group-item">
                    <div class="fw-bold"><i class="fas fa-bug me-2"></i>Manejo de Pragas</div>
                    <p class="mb-0">${specific.pest_management}</p>
                </li>
            `;
        }
        
        if (specific.variety_specific) {
            html += `
                <li class="list-group-item">
                    <div class="fw-bold"><i class="fas fa-seedling me-2"></i>Variedade</div>
                    <p class="mb-0">${specific.variety_specific}</p>
                </li>
            `;
        }
        
        if (specific.cycle_specific) {
            html += `
                <li class="list-group-item">
                    <div class="fw-bold"><i class="fas fa-sync me-2"></i>Ciclo</div>
                    <p class="mb-0">${specific.cycle_specific}</p>
                </li>
            `;
        }
        
        if (specific.growth_stage) {
            html += `
                <li class="list-group-item">
                    <div class="fw-bold"><i class="fas fa-leaf me-2"></i>Estágio de Crescimento</div>
                    <p class="mb-0">${specific.growth_stage}</p>
                </li>
            `;
        }
        
        if (specific.harvest) {
            html += `
                <li class="list-group-item">
                    <div class="fw-bold"><i class="fas fa-truck-loading me-2"></i>Colheita</div>
                    <p class="mb-0">${specific.harvest}</p>
                </li>
            `;
        }
        
        html += '</ul>';
        
        this.specificContainer.innerHTML = html;
    }

    /**
     * Renderiza as recomendações de insumos
     * @param {Object} inputs - Dados de manejo de insumos
     * @private
     **/
    _renderInputsRecommendations(inputs) {
        if (!inputs) {
            this.inputsContainer.innerHTML = '';
            return;
        }

        let html = `
            <ul class="list-group">
                <li class="list-group-item">
                    <div class="fw-bold"><i class="fas fa-flask me-2"></i>Herbicida</div>
                    <p class="mb-0">${inputs.herbicide}</p>
                </li>
                <li class="list-group-item">
                    <div class="fw-bold"><i class="fas fa-vial me-2"></i>Fertilizante</div>
                    <p class="mb-0">${inputs.fertilizer}</p>
                </li>
                <li class="list-group-item">
                    <div class="fw-bold"><i class="fas fa-cogs me-2"></i>Tecnologia de Aplicação</div>
                    <p class="mb-0">${inputs.application_technology}</p>
                </li>
            </ul>
        `;

        this.inputsContainer.innerHTML = html;
    }

    /**
     * Renderiza seções adicionais de recomendações
     * @param {Object} data - Dados de recomendações
     * @private
     **/
    _renderAdditionalRecommendations(data) {
        const parentContainer = document.getElementById('tab-recommendations');
        if (!parentContainer) return;

        // MONITORAMENTO E OTIMIZAÇÃO
        this._renderMonitoringSection(data.monitoring_optimization, parentContainer);
        
        // IMPACTO AMBIENTAL
        this._renderEnvironmentalSection(data.environmental_impact, parentContainer);
    }

    /**
     * Renderiza a seção de monitoramento e otimização
     * @param {Object} monitoring - Dados de monitoramento
     * @param {HTMLElement} parentContainer - Container pai
     * @private
     */
    _renderMonitoringSection(monitoring, parentContainer) {
        if (!monitoring || Object.keys(monitoring).length === 0) return;

        // cria seção para monitoramento se não existir
        let monitoringSection = document.getElementById('monitoring-section');
        if (!monitoringSection) {
            monitoringSection = document.createElement('div');
            monitoringSection.id = 'monitoring-section';
            monitoringSection.className = 'card mb-4';
            monitoringSection.innerHTML = `
                <div class="card-header bg-info text-white">
                    <h5 class="mb-0">Monitoramento e Otimização</h5>
                </div>
                <div class="card-body" id="monitoring-content"></div>
            `;
            
            // adiciona após a seção de manejo de insumos
            const inputsSection = this.inputsContainer.closest('.card');
            if (inputsSection && inputsSection.parentNode) {
                inputsSection.parentNode.insertBefore(monitoringSection, inputsSection.nextSibling);
            } else {
                parentContainer.appendChild(monitoringSection);
            }
        }

        // conteúdo de monitoramento
        let monitoringHtml = `<div class="row">`;
        
        // estresse térmico
        if (monitoring.heat_stress) {
            monitoringHtml += this._createMonitoringCard(
                'Condição Térmica', 
                monitoring.heat_stress, 
                'fas fa-temperature-high'
            );
        }
        
        // recomendação de irrigação
        if (monitoring.irrigation_advice) {
            monitoringHtml += this._createMonitoringCard(
                'Recomendação de Irrigação', 
                monitoring.irrigation_advice, 
                'fas fa-tint'
            );
        }
        
        // recomendação de herbicida
        if (monitoring.herbicide_advice) {
            monitoringHtml += this._createMonitoringCard(
                'Recomendação de Herbicida', 
                monitoring.herbicide_advice, 
                'fas fa-spray-can'
            );
        }
        
        // operações de campo
        if (monitoring.field_operations) {
            monitoringHtml += this._createMonitoringCard(
                'Operações de Campo', 
                monitoring.field_operations, 
                'fas fa-tractor'
            );
        }
        
        monitoringHtml += `</div>`;
        
        document.getElementById('monitoring-content').innerHTML = monitoringHtml;
    }

    /**
     * Cria um card para a seção de monitoramento
     * @param {string} title - Título do card
     * @param {string} content - Conteúdo do card
     * @param {string} icon - Classe de ícone
     * @returns {string} - HTML do card
     * @private
     **/
    _createMonitoringCard(title, content, icon) {
        return `
            <div class="col-md-6 mb-3">
                <div class="card h-100">
                    <div class="card-header">
                        <h6 class="mb-0"><i class="${icon} me-2"></i>${title}</h6>
                    </div>
                    <div class="card-body">
                        <p>${content}</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renderiza a seção de impacto ambiental
     * @param {Object} environmental - Dados de impacto ambiental
     * @param {HTMLElement} parentContainer - Container pai
     * @private
     **/
    _renderEnvironmentalSection(environmental, parentContainer) {
        if (!environmental || Object.keys(environmental).length === 0) return;

        // cria seção para impacto ambiental se não existir
        let envSection = document.getElementById('environmental-section');
        if (!envSection) {
            envSection = document.createElement('div');
            envSection.id = 'environmental-section';
            envSection.className = 'card mb-4';
            envSection.innerHTML = `
                <div class="card-header bg-success text-white">
                    <h5 class="mb-0">Impacto Ambiental</h5>
                </div>
                <div class="card-body" id="environmental-content"></div>
            `;
            
            // adiciona após a seção de monitoramento ou insumos
            const prevSection = document.getElementById('monitoring-section') || 
                                this.inputsContainer.closest('.card');
            if (prevSection && prevSection.parentNode) {
                prevSection.parentNode.insertBefore(envSection, prevSection.nextSibling);
            } else {
                parentContainer.appendChild(envSection);
            }
        }

        // conteúdo de impacto ambiental
        let envHtml = `<div class="row">`;
        
        // risco de deriva
        if (environmental.drift_risk) {
            envHtml += `
                <div class="col-md-6 mb-3">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-wind me-2"></i>Risco de Deriva</h6>
                        </div>
                        <div class="card-body">
                            <p>${environmental.drift_risk}</p>
                            ${environmental.drift_recommendation ? `<p class="text-muted">${environmental.drift_recommendation}</p>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }
        
        // contaminação da água
        if (environmental.water_contamination) {
            envHtml += `
                <div class="col-md-6 mb-3">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-water me-2"></i>Risco de Contaminação</h6>
                        </div>
                        <div class="card-body">
                            <p>${environmental.water_contamination}</p>
                            ${environmental.water_recommendation ? `<p class="text-muted">${environmental.water_recommendation}</p>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }
        
        // impacto no solo
        if (environmental.soil_impact) {
            envHtml += `
                <div class="col-md-6 mb-3">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-mountain me-2"></i>Impacto no Solo</h6>
                        </div>
                        <div class="card-body">
                            <p>${environmental.soil_impact}</p>
                            ${environmental.soil_recommendation ? `<p class="text-muted">${environmental.soil_recommendation}</p>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }
        
        envHtml += `</div>`;
        
        document.getElementById('environmental-content').innerHTML = envHtml;
    }

    /**
     * Limpa o componente
     **/
    clear() {
        super.clear();
        if (this.basicContainer) this.basicContainer.innerHTML = '';
        if (this.specificContainer) this.specificContainer.innerHTML = '';
        if (this.inputsContainer) this.inputsContainer.innerHTML = '';
        
        // remove seções dinâmicas
        const sections = ['monitoring-section', 'environmental-section'];
        sections.forEach(id => {
            const section = document.getElementById(id);
            if (section) section.remove();
        });
    }
}

