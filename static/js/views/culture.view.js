/* * * *
 *
 * Visualização para componentes relacionados a culturas
 * Implementação com uso de utilitários compartilhados
 *
 * * * */
import { CONFIG } from '../config.js';
import { CultureViewUtils } from './culture-view-utils.js';

export class CultureView {
    /**
     * Renderiza a lista de culturas
     * @param {Array} cultures - Array de objetos de cultura
     * @param {Array} analyzedCultureIds - Array com IDs de culturas já analisadas
     **/
    renderCulturesList(cultures, analyzedCultureIds = []) {
        const container = document.getElementById('cultures-list');
        
        if (!cultures || cultures.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-4">
                    <div class="alert alert-info">
                        Nenhuma cultura cadastrada. Clique em "Nova Cultura" para começar.
                    </div>
                </div>
            `;
            return;
        }
        
        // log para debug - verificar conteúdo do array cultures
        console.log("Renderizando culturas:", JSON.stringify(cultures));
        console.log("Culturas analisadas:", analyzedCultureIds);
        
        let html = '';
        
        cultures.forEach((culture, index) => {
            // log para debug - verificar cada cultura individual
            console.log(`Cultura #${index}:`, JSON.stringify(culture));
            
            const cultureType = culture.tipo || 'Desconhecida';
            const area = culture.area || 0;
            const irrigation = culture.irrigacao ? 
                '<span class="badge bg-info text-dark"><i class="fas fa-tint me-1"></i>Irrigada</span>' : '';
            
            let specificInfo = '';
            let recommendationBadge = '';
            
            // conteúdo específico por tipo de cultura
            if (cultureType === CONFIG.CULTURE_TYPES.SOY.NAME) {
                specificInfo = `<div class="mb-2">Variedade: ${culture.variedade || 'Convencional'}</div>`;
            } else if (cultureType === CONFIG.CULTURE_TYPES.SUGARCANE.NAME) {
                specificInfo = `<div class="mb-2">Ciclo: ${culture.ciclo || 'Médio'}</div>`;
            }
            
            // verifica recomendações para qualquer tipo de cultura
            if (culture.recomendacoes) {
                // verifica se a cultura tem recomendações e se elas têm as propriedades necessárias
                if (culture.recomendacoes.espacamento && culture.recomendacoes.area) {
                    const espacamento = culture.recomendacoes.espacamento;
                    const area = culture.recomendacoes.area;
                    
                    // critérios para recomendações (aplicável a todos os tipos de cultura)
                    if (espacamento.status !== 'adequado' || area.status !== 'adequada' || !culture.irrigacao) {
                        recommendationBadge = `
                            <span class="badge bg-warning text-dark">
                                <i class="fas fa-exclamation-triangle me-1"></i>Recomendações
                            </span>
                        `;
                    } else {
                        recommendationBadge = `
                            <span class="badge bg-success">
                                <i class="fas fa-check me-1"></i>Parâmetros ideais
                            </span>
                        `;
                    }
                }
            }
            
            // verifica se a cultura já foi analisada
            const wasAnalyzed = analyzedCultureIds.includes(index);
            
            // constrói menu de ações
            let actionsMenu = `
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><a class="dropdown-item" href="#" data-action="analyze" data-culture-id="${index}">
                        <i class="fas fa-chart-line me-2"></i>Analisar
                    </a></li>
            `;
            
            // adiciona opção "Visualizar" somente se a cultura já foi analisada
            if (wasAnalyzed) {
                actionsMenu = `
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a class="dropdown-item" href="#" data-action="view" data-culture-id="${index}">
                            <i class="fas fa-eye me-2"></i>Visualizar
                        </a></li>
                        <li><a class="dropdown-item" href="#" data-action="analyze" data-culture-id="${index}">
                            <i class="fas fa-chart-line me-2"></i>Analisar
                        </a></li>
                `;
            }
            
            // completa o menu com as opções restantes
            actionsMenu += `
                    <li><a class="dropdown-item" href="#" data-action="edit" data-culture-id="${index}">
                        <i class="fas fa-edit me-2"></i>Editar
                    </a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" data-action="delete" data-culture-id="${index}">
                        <i class="fas fa-trash-alt me-2"></i>Excluir
                    </a></li>
                </ul>
            `;
            
            html += `
                <div class="col-md-4">
                    <div class="card culture-card h-100">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">${cultureType}</h5>
                            <div class="dropdown">
                                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                    Ações
                                </button>
                                ${actionsMenu}
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="mb-2">Área: ${area} hectares</div>
                            <div class="mb-2">Espaçamento: ${culture.espacamento || 0} metros</div>
                            ${specificInfo}
                            <div class="mb-2">Linhas calculadas: ${culture.linhas_calculadas || 'Não calculado'}</div>
                        </div>
                        <div class="card-footer d-flex justify-content-between align-items-center">
                            ${irrigation}
                            ${recommendationBadge}
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = `<div class="row">${html}</div>`;
        
        // adiciona evento nos botões de ação
        this._setupCultureCardEvents();
    }

    /**
     * Configura eventos para cartões de cultura
     * @private
     **/
    _setupCultureCardEvents() {
        // delegação de eventos para os botões de ação
        document.getElementById('cultures-list').addEventListener('click', (e) => {
            // verifica se o clique foi em um botão de ação ou em seus elementos filhos
            const actionEl = e.target.closest('[data-action]');
            if (!actionEl) return;
            
            e.preventDefault();
            
            const action = actionEl.dataset.action;
            const cultureId = parseInt(actionEl.dataset.cultureId);
            
            console.log(`Clique em ação: ${action}, ID de cultura: ${cultureId}`);
            
            // dispara evento customizado para o controlador tratar
            const event = new CustomEvent('culture:action', {
                detail: { action, cultureId }
            });
            document.dispatchEvent(event);
        });
    }
    
    /**
     * Exibe formulário de edição ou criação de cultura
     * @param {Object|null} cultureData - Dados da cultura para edição (null para nova cultura)
     **/
    showCultureForm(cultureData = null) {
        const formEl = document.getElementById('culture-form');
        const formTitle = document.getElementById('form-title');
        const cultureIdEl = document.getElementById('culture-id');
        
        if (cultureData && cultureData.id !== null) {
            // modo edição
            formTitle.textContent = 'Editar Cultura';
            cultureIdEl.value = cultureData.id;
            
            // determina tipo de cultura
            const cultureTypeId = cultureData.tipo === CONFIG.CULTURE_TYPES.SOY.NAME 
                ? CONFIG.CULTURE_TYPES.SOY.ID 
                : CONFIG.CULTURE_TYPES.SUGARCANE.ID;
            
            // preenche campos
            document.getElementById('culture-type').value = cultureTypeId;
            document.getElementById('culture-area').value = cultureData.area;
            document.getElementById('culture-espacamento').value = cultureData.espacamento;
            document.getElementById('culture-irrigation').checked = cultureData.irrigacao;
            
            // campos específicos
            this.toggleCultureSpecificFields(cultureTypeId);
            
            if (cultureData.tipo === CONFIG.CULTURE_TYPES.SOY.NAME) {
                document.getElementById('soja-variedade').value = cultureData.variedade || 'convencional';
            } else if (cultureData.tipo === CONFIG.CULTURE_TYPES.SUGARCANE.NAME) {
                document.getElementById('cana-ciclo').value = cultureData.ciclo || 'médio';
            }
        } else {
            // modo nova cultura
            formTitle.textContent = 'Nova Cultura';
            cultureIdEl.value = '';
            document.getElementById('culture-data-form').reset();
            document.getElementById('soja-fields').style.display = 'none';
            document.getElementById('cana-fields').style.display = 'none';
        }
        
        formEl.style.display = 'block';
    }
    
    /**
     * Oculta o formulário de cultura
     **/
    hideCultureForm() {
        document.getElementById('culture-form').style.display = 'none';
    }
    
    /**
     * Alterna a exibição dos campos específicos de cada tipo de cultura
     * @param {string} typeId - ID do tipo de cultura
     **/
    toggleCultureSpecificFields(typeId) {
        const sojaFields = document.getElementById('soja-fields');
        const canaFields = document.getElementById('cana-fields');
        
        sojaFields.style.display = 'none';
        canaFields.style.display = 'none';
        
        if (typeId === CONFIG.CULTURE_TYPES.SOY.ID) {
            sojaFields.style.display = 'block';
        } else if (typeId === CONFIG.CULTURE_TYPES.SUGARCANE.ID) {
            canaFields.style.display = 'block';
        }
    }

    /**
     * Exibe modal com recomendações para cana-de-açúcar
     * @param {Object} recommendations - Recomendações para cana-de-açúcar
     * @param {Object} culture - Dados da cultura
     **/
    showSugarcaneRecommendations(recommendations, culture) {
        // usa a classe utilitária compartilhada para exibir o modal
        CultureViewUtils.showRecommendationsModal({
            title: 'Recomendações para Cana-de-Açúcar',
            id: 'sugarcaneRecommendationsModal',
            headerClass: 'bg-primary',
            recommendations,
            culture,
            infoTitle: 'Informações do Ciclo',
            options: {
                cultureType: 'Cana-de-Açúcar',
                minRecommendedPercentage: 75,
                maxRecommendedPercentage: 95,
                idealPercentage: 100
            }
        });
    }

    /**
     * Exibe modal com recomendações para soja
     * @param {Object} recommendations - Recomendações para soja
     * @param {Object} culture - Dados da cultura
     **/
    showSoybeanRecommendations(recommendations, culture) {
        // usa a classe utilitária compartilhada para exibir o modal
        CultureViewUtils.showRecommendationsModal({
            title: 'Recomendações para Soja',
            id: 'soybeanRecommendationsModal',
            headerClass: 'bg-success',
            recommendations,
            culture,
            infoTitle: 'Informações da Variedade',
            options: {
                cultureType: 'Soja',
                minRecommendedPercentage: 75,
                maxRecommendedPercentage: 95,
                idealPercentage: 100
            }
        });
    }
}

