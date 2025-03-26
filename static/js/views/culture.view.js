/**
 * Visualização para componentes relacionados a culturas
 * Implementação com uso de utilitários compartilhados
 */
import { CONFIG } from '../config.js';
import { CultureViewUtils } from './culture-view-utils.js';

export class CultureView {
    constructor() {
        // flag para controlar renderização em andamento
        this.isRendering = false;
        
        // timeout para detectar renderizações que travam
        this.renderTimeout = null;
    }
    
    /**
     * Renderiza a lista de culturas
     * @param {Array} cultures - Array de objetos de cultura
     * @param {Array} analyzedCultureIds - Array com IDs de culturas já analisadas
     */
    renderCulturesList(cultures, analyzedCultureIds = []) {
        // evita renderizações simultâneas que podem causar loops infinitos
        if (this.isRendering) {
            console.warn("Renderização já em andamento, ignorando chamada duplicada");
            return;
        }
        
        // define um timeout para cancelar a renderização se demorar demais
        if (this.renderTimeout) {
            clearTimeout(this.renderTimeout);
        }
        
        this.isRendering = true;
        
        this.renderTimeout = setTimeout(() => {
            console.error("Renderização demorou mais que o esperado, forçando conclusão");
            this.isRendering = false;
            // tenta recuperar a interface
            const container = document.getElementById('cultures-list');
            if (container) {
                container.innerHTML = `
                    <div class="col-12 text-center py-4">
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-circle me-2"></i>
                            Ocorreu um erro na exibição das culturas. 
                            Por favor, recarregue a página.
                        </div>
                    </div>
                `;
            }
        }, 5000); // 5 segundos para timeout
        
        try {
            const container = document.getElementById('cultures-list');
            
            if (!container) {
                throw new Error("Container 'cultures-list' não encontrado");
            }
            
            if (!cultures || !Array.isArray(cultures) || cultures.length === 0) {
                container.innerHTML = `
                    <div class="col-12 text-center py-4">
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            Nenhuma cultura cadastrada. Clique em "Nova Cultura" para começar.
                        </div>
                    </div>
                `;
                this.isRendering = false;
                clearTimeout(this.renderTimeout);
                return;
            }
            
            console.log(`Renderizando ${cultures.length} culturas`);
            console.log(`${analyzedCultureIds.length} culturas analisadas`);
            
            // validação crítica: verifica se analyzedCultureIds é um array válido
            if (!Array.isArray(analyzedCultureIds)) {
                console.error("Array de IDs analisados inválido:", analyzedCultureIds);
                analyzedCultureIds = [];
            }
            
            // limita analyzedCultureIds para incluir apenas IDs válidos
            const validAnalyzedIds = analyzedCultureIds.filter(
                id => typeof id === 'number' && id >= 0 && id < cultures.length
            );
            
            // limpa o container antes de começar para evitar acumulação de conteúdo
            container.innerHTML = '';
            
            // cria elemento de linha e anexar ao container
            const rowElement = document.createElement('div');
            rowElement.className = 'row';
            container.appendChild(rowElement);
            
            // processamento em lotes para evitar bloqueio da UI
            this._renderCulturesInBatches(rowElement, cultures, validAnalyzedIds, 0);
        } catch (error) {
            console.error("Erro crítico ao renderizar culturas:", error);
            const container = document.getElementById('cultures-list');
            if (container) {
                container.innerHTML = `
                    <div class="col-12 text-center py-4">
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-circle me-2"></i>
                            Erro ao carregar culturas: ${error.message}
                        </div>
                    </div>
                `;
            }
            this.isRendering = false;
            clearTimeout(this.renderTimeout);
        }
    }

    /**
     * Renderiza culturas em lotes para evitar bloqueio da UI
     * @param {HTMLElement} container - Elemento container
     * @param {Array} cultures - Array de culturas
     * @param {Array} analyzedCultureIds - IDs de culturas analisadas
     * @param {number} startIndex - Índice inicial do lote
     * @private
     */
    _renderCulturesInBatches(container, cultures, analyzedCultureIds, startIndex) {
        // se não tiver culturas, conclui imediatamente
        if (!cultures || cultures.length === 0 || startIndex >= cultures.length) {
            console.log("Renderização de culturas concluída (sem culturas para processar)");
            this.isRendering = false;
            clearTimeout(this.renderTimeout);
            
            // configura eventos após renderização completa
            this._setupCultureCardEvents();
            return;
        }
        
        const BATCH_SIZE = 5; // Processa 5 culturas por vez
        const endIndex = Math.min(startIndex + BATCH_SIZE, cultures.length);
        
        // processa o lote atual
        for (let i = startIndex; i < endIndex; i++) {
            const culture = cultures[i];
            const cardElement = this._createCultureCard(culture, i, analyzedCultureIds);
            if (cardElement) {
                container.appendChild(cardElement);
            }
        }
        
        // se ainda há mais culturas para processar, agende o próximo lote
        if (endIndex < cultures.length) {
            // uso de setTimeout com 0ms permite que a UI respire entre lotes
            setTimeout(() => {
                this._renderCulturesInBatches(
                    container, 
                    cultures, 
                    analyzedCultureIds, 
                    endIndex
                );
            }, 0);
        } else {
            // terminou de renderizar todos os lotes
            console.log("Renderização de culturas concluída");
            this.isRendering = false;
            clearTimeout(this.renderTimeout);
            
            // configura eventos apenas após renderização completa
            this._setupCultureCardEvents();
            
            // aplica estilos dinamicamente usando o método global
            if (window.app && typeof window.app.applyCultureCardStyles === 'function') {
                const cards = container.querySelectorAll('.culture-card');
                window.app.applyCultureCardStyles(cards);
            }
        }
    }


    /**
     * Cria um elemento de cartão de cultura
     * @param {Object} culture - Dados da cultura
     * @param {number} index - Índice da cultura no array
     * @param {Array} analyzedCultureIds - IDs de culturas analisadas
     * @returns {HTMLElement} Elemento do cartão de cultura
     * @private
     */
    _createCultureCard(culture, index, analyzedCultureIds) {
        try {
            // verificações de segurança para evitar erros
            if (!culture || typeof culture !== 'object') {
                console.warn(`Cultura inválida no índice ${index}:`, culture);
                return null;
            }
            
            // determina o ID a ser exibido (prioriza ID da cultura, senão usa índice)
            const displayId = culture.id || index;
            
            const cultureType = culture.tipo || 'Desconhecida';
            const area = culture.area || 0;
            
            // verifica se a cultura já foi analisada
            const wasAnalyzed = analyzedCultureIds.includes(index);
            
            // define classe para cultura analisada
            const analyzedClass = wasAnalyzed ? 'analyzed' : '';
            
            // verifica se existem estatísticas com desvio padrão
            const hasDeviationStats = 
                culture.estatisticas_formatadas || 
                (culture.analise_estatistica && culture.analise_estatistica.input_summary) ||
                false;
            
            // cria o elemento principal do cartão
            const colElement = document.createElement('div');
            colElement.className = 'col-md-4 mb-4';
            colElement.innerHTML = `
                <div class="card culture-card ${analyzedClass}">
                    <div class="card-header">
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                                <span class="badge me-2">ID: ${displayId}</span>
                                <h5 class="mb-0">${cultureType}</h5>
                            </div>
                            <div class="dropdown">
                                <button class="btn btn-sm btn-outline-light dropdown-toggle" 
                                        type="button" data-bs-toggle="dropdown">
                                    <i class="fas fa-ellipsis-v"></i>
                                </button>
                                ${this._buildActionsMenu(index, wasAnalyzed)}
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="mb-2">Área: ${area} hectares</div>
                        <div class="mb-2">
                            Espaçamento: ${culture.espacamento || 0} metros
                        </div>
                        ${this._generateSpecificInfo(culture)}
                        <div class="mb-2">
                            Linhas calculadas: ${culture.linhas_calculadas || 'Não calculado'}
                        </div>
                        ${wasAnalyzed ? `
                            <div class="mt-3">
                                <button class="btn btn-sm btn-outline-primary view-stats-btn" 
                                        data-culture-id="${index}" ${hasDeviationStats ? '' : 'disabled'}>
                                    <i class="fas fa-chart-line me-1"></i>Ver Estatísticas Detalhadas
                                </button>
                            </div>
                        ` : ''}
                    </div>
                    <div class="card-footer d-flex justify-content-between align-items-center">
                        ${culture.irrigacao ? 
                            `<span class="badge bg-info text-dark" data-type="irrigation">
                                <i class="fas fa-tint me-1"></i>Irrigada
                            </span>` : ''}
                        <span class="badge-recommendation">
                            ${this._generateRecommendationBadge(culture)}
                        </span>
                    </div>
                </div>
            `;
            
            // configura evento para o botão de estatísticas, se existir
            if (wasAnalyzed) {
                const statsButton = colElement.querySelector('.view-stats-btn');
                if (statsButton) {
                    statsButton.addEventListener('click', (e) => {
                        e.preventDefault();
                        this._showStatsDetails(culture, index);
                    });
                }
            }
            
            return colElement;
        } catch (error) {
            console.error(`Erro ao criar cartão para cultura ${index}:`, error);
            return null;
        }
    }

    /**
     * Mostra detalhes de estatísticas para uma cultura
     * @param {Object} culture - Dados da cultura
     * @param {number} index - Índice da cultura
     * @private
     */
    _showStatsDetails(culture, index) {
        // dispara evento de visualização
        document.dispatchEvent(new CustomEvent('culture:view', {
            detail: { cultureId: index }
        }));
        
        // após um breve delay para permitir que a view de análise seja carregada
        setTimeout(() => {
            // alterna para a aba de estatísticas
            const statsTab = document.querySelector('[href="#tab-stats"]');
            if (statsTab) {
                statsTab.click();
                
                // após um outro breve delay para garantir que as estatísticas sejam carregadas
                setTimeout(() => {
                    // ativa o processamento de estatísticas (definido em stats-enhancement.js)
                    if (window.processJSONStats) {
                        window.processJSONStats();
                    }
                    
                    // rola para o dashboard de estatísticas
                    const statsDashboard = document.getElementById('stats-dashboard');
                    if (statsDashboard) {
                        statsDashboard.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 500);
            }
        }, 300);
    }

    /**
     * Gera HTML para informações específicas por tipo de cultura
     * @param {Object} culture - Dados da cultura
     * @returns {String} HTML com informações específicas
     * @private
     */
    _generateSpecificInfo(culture) {
        try {
            if (culture.tipo === CONFIG.CULTURE_TYPES.SOY.NAME) {
                return `<div class="mb-2">
                    Variedade: ${culture.variedade || 'Convencional'}
                </div>`;
            } else if (culture.tipo === CONFIG.CULTURE_TYPES.SUGARCANE.NAME) {
                return `<div class="mb-2">
                    Ciclo: ${culture.ciclo || 'Médio'}
                </div>`;
            }
            return '';
        } catch (error) {
            console.warn("Erro ao gerar informações específicas:", error);
            return '';
        }
    }

    /**
     * Gera badge de recomendação baseada nas propriedades da cultura
     * @param {Object} culture - Dados da cultura
     * @returns {String} HTML da badge de recomendação
     * @private
     */
    _generateRecommendationBadge(culture) {
        try {
            // verifica recomendações para qualquer tipo de cultura
            if (culture.recomendacoes) {
                // verifica se a cultura tem recomendações com propriedades necessárias
                if (culture.recomendacoes.espacamento && culture.recomendacoes.area) {
                    const espacamento = culture.recomendacoes.espacamento;
                    const area = culture.recomendacoes.area;
                    
                    // critérios para recomendações (aplicável a todos os tipos)
                    if (espacamento.status !== 'adequado' || 
                        area.status !== 'adequada' || 
                        !culture.irrigacao) {
                        return `
                            <span class="badge bg-warning text-dark">
                                <i class="fas fa-exclamation-triangle me-1"></i>Recomendações
                            </span>
                        `;
                    } else {
                        return `
                            <span class="badge bg-success">
                                <i class="fas fa-check me-1"></i>Parâmetros ideais
                            </span>
                        `;
                    }
                }
            }
            return '';
        } catch (error) {
            console.warn("Erro ao gerar badge de recomendação:", error);
            return '';
        }
    }



    _buildActionsMenu(cultureId, wasAnalyzed) {
        let menu = '<ul class="dropdown-menu dropdown-menu-end">';
        
        // adiciona opção "Visualizar" somente se a cultura já foi analisada
        if (wasAnalyzed) {
            menu += `
                <li><a class="dropdown-item" href="#" data-action="view" 
                       data-culture-id="${cultureId}">
                    <i class="fas fa-eye me-2"></i>Visualizar
                </a></li>
            `;
        }
        
        // adiciona opções comuns
        menu += `
            <li><a class="dropdown-item btn-primary" href="#" data-action="analyze" 
                   data-culture-id="${cultureId}" style="background-color: #0d6efd; color: white;">
                <i class="fas fa-chart-line me-2"></i>Analisar
            </a></li>
            <li><a class="dropdown-item" href="#" data-action="edit" 
                   data-culture-id="${cultureId}">
                <i class="fas fa-edit me-2"></i>Editar
            </a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item text-danger" href="#" data-action="delete" 
                   data-culture-id="${cultureId}">
                <i class="fas fa-trash-alt me-2"></i>Excluir
            </a></li>
        `;
        
        menu += '</ul>';
        return menu;
    }

    
    /**
     * Configura eventos para cartões de cultura
     * @private
     */
    _setupCultureCardEvents() {
        // primeiro, remove listener anterior para evitar duplicação
        const culturesListEl = document.getElementById('cultures-list');
        if (!culturesListEl) {
            console.warn("Container 'cultures-list' não encontrado para configurar eventos");
            return;
        }
        
        const oldHandler = culturesListEl._cultureClickHandler;
        
        if (oldHandler) {
            culturesListEl.removeEventListener('click', oldHandler);
        }
        
        // cria novo handler com delegação de eventos
        const clickHandler = (e) => {
            // verifica se o clique foi em um botão de ação ou em seus elementos filhos
            const actionEl = e.target.closest('[data-action]');
            if (!actionEl) return;
            
            e.preventDefault();
            
            // evita múltiplos cliques durante operações como exclusão
            if (actionEl.disabled || actionEl.classList.contains('processing')) {
                return;
            }
            
            const action = actionEl.dataset.action;
            const cultureId = parseInt(actionEl.dataset.cultureId);
            
            if (isNaN(cultureId)) {
                console.error("ID de cultura inválido:", actionEl.dataset.cultureId);
                return;
            }
            
            console.log(`Ação: ${action}, ID de cultura: ${cultureId}`);
            
            // para operação de exclusão, adiciona classe para prevenir cliques múltiplos
            if (action === 'delete') {
                actionEl.classList.add('processing');
            }
            
            // dispara evento customizado para o controlador tratar
            const event = new CustomEvent('culture:action', {
                detail: { action, cultureId }
            });
            document.dispatchEvent(event);
        };
        
        // armazena referência ao handler para remoção futura
        culturesListEl._cultureClickHandler = clickHandler;
        
        // delegação de eventos para os botões de ação
        culturesListEl.addEventListener('click', clickHandler);
    }

    /**
     * Exibe formulário de edição ou criação de cultura
     * @param {Object|null} cultureData - Dados da cultura para edição (null para nova)
     */
    showCultureForm(cultureData = null) {
        const formEl = document.getElementById('culture-form');
        const formTitle = document.getElementById('form-title');
        const cultureIdEl = document.getElementById('culture-id');
        
        if (!formEl || !formTitle || !cultureIdEl) {
            console.error("Elementos do formulário não encontrados");
            return;
        }
        
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
                document.getElementById('soja-variedade').value = 
                    cultureData.variedade || 'convencional';
            } else if (cultureData.tipo === CONFIG.CULTURE_TYPES.SUGARCANE.NAME) {
                document.getElementById('cana-ciclo').value = 
                    cultureData.ciclo || 'médio';
            }
            
            // adiciona ID no título do formulário para referência
            formTitle.textContent += ` (ID: ${cultureData.id})`;
        } else {
            // modo nova cultura
            formTitle.textContent = 'Nova Cultura';
            cultureIdEl.value = '';
            document.getElementById('culture-data-form').reset();
            document.getElementById('soja-fields').style.display = 'none';
            document.getElementById('cana-fields').style.display = 'none';
        }
        
        // aplica efeito de slide down
        formEl.style.display = 'block';
    }
    
    /**
     * Oculta o formulário de cultura
     */
    hideCultureForm() {
        const formEl = document.getElementById('culture-form');
        if (formEl) {
            formEl.style.display = 'none';
        }
    }
    
    /**
     * Alterna a exibição dos campos específicos de cada tipo de cultura
     * @param {string} typeId - ID do tipo de cultura
     */
    toggleCultureSpecificFields(typeId) {
        const sojaFields = document.getElementById('soja-fields');
        const canaFields = document.getElementById('cana-fields');
        
        if (!sojaFields || !canaFields) {
            console.error("Campos específicos por tipo não encontrados");
            return;
        }
        
        // oculta ambos os campos específicos
        sojaFields.style.display = 'none';
        canaFields.style.display = 'none';
        
        // exibe apenas os campos do tipo selecionado
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
     */
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
     */
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

