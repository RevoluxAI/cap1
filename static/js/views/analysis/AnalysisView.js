/**
 * Coordenador principal para visualização de análises
 * Orquestra os diferentes componentes especializados
 */
import { TabsComponent } from './components/TabsComponent.js';
import { WeatherComponent } from './components/WeatherComponent.js';
import { RecommendationsComponent } from './components/RecommendationsComponent.js';
import { StatsComponent } from './components/StatsComponent.js';
import { SoybeanComponent } from './components/culture/SoybeanComponent.js';
import { SugarcaneComponent } from './components/culture/SugarcaneComponent.js';

export class AnalysisView {
    /**
     * Inicializa a visualização de análise principal
     */
    constructor() {
        // elementos principais da UI
        this.selectPromptElement = document.getElementById('analysis-select-prompt');
        this.contentElement = document.getElementById('analysis-content');
        this.titleElement = document.getElementById('analysis-culture-title');
        this.jsonElement = document.getElementById('json-data');
        this.cultureTypeElement = document.getElementById('analysis-culture-type');
        this.cultureAreaElement = document.getElementById('analysis-culture-area');
        
        // flags de estado
        this.initialized = false;
        this.componentsReady = false;
        
        // componentes - instanciados, mas ainda não inicializados
        this.tabsComponent = new TabsComponent();
        this.weatherComponent = new WeatherComponent();
        this.recommendationsComponent = new RecommendationsComponent();
        this.statsComponent = new StatsComponent();
        this.soybeanComponent = new SoybeanComponent();
        this.sugarcaneComponent = new SugarcaneComponent();
        
        // inicializa componentes e eventos quando o DOM estiver pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._initialize());
        } else {
            // DOM já está pronto
            this._initialize();
        }
    }
    
    /**
     * Inicializa os componentes e configura os eventos
     * @private
     */
    _initialize() {
        if (!this._validateDomElements()) {
            console.error('AnalysisView: Falha na inicialização - elementos DOM necessários não encontrados');
            return;
        }
        
        this.initialized = true;
        
        // inicializa componentes e verifica se todos estão prontos
        const componentsInitialized = [
            this.tabsComponent.initialize(),
            this.weatherComponent.initialize(),
            this.recommendationsComponent.initialize(),
            this.statsComponent.initialize(),
            this.soybeanComponent.initialize(),
            this.sugarcaneComponent.initialize()
        ];
        
        // verifica se todos os componentes foram inicializados com sucesso
        this.componentsReady = componentsInitialized.every(result => result === true);
        
        if (!this.componentsReady) {
            console.warn('AnalysisView: Alguns componentes não foram inicializados corretamente');
        }
        
        // configura evento de cópia JSON
        this._setupJsonCopyEvent();
        
        // configura evento de mudança de tab
        document.addEventListener('tab:changed', (e) => {
            this._handleTabChange(e.detail.tabId, e.detail.previousTabId);
        });
        
        console.log(`AnalysisView inicializado (componentes: ${this.componentsReady ? 'OK' : 'com erros'})`);
    }
    
    /**
     * Valida se todos os elementos DOM necessários estão presentes
     * @returns {boolean} - True se todos os elementos estão presentes
     * @private
     */
    _validateDomElements() {
        const requiredElements = [
            this.selectPromptElement,
            this.contentElement,
            this.titleElement,
            this.jsonElement,
            this.cultureTypeElement,
            this.cultureAreaElement
        ];
        
        return requiredElements.every(element => element !== null);
    }
    
    /**
     * Configura o evento de cópia de JSON
     * @private
     */
    _setupJsonCopyEvent() {
        const copyButton = document.getElementById('btn-copy-json');
        if (copyButton && this.jsonElement) {
            copyButton.addEventListener('click', () => {
                navigator.clipboard.writeText(this.jsonElement.textContent)
                    .then(() => {
                        // disparar evento para notificar cópia bem sucedida
                        document.dispatchEvent(new CustomEvent('json:copied'));
                    })
                    .catch(err => {
                        console.error('Erro ao copiar JSON:', err);
                    });
            });
        }
    }
    
    /**
     * Manipula mudanças de aba
     * @param {string} newTabId - ID da nova aba
     * @param {string} previousTabId - ID da aba anterior
     * @private
     */
    _handleTabChange(newTabId, previousTabId) {
        // atualiza a visualização para a nova aba, se necessário
        // por exemplo, redimensiona gráficos na aba de estatísticas
        if (newTabId === '#tab-stats' && window.statsChart) {
            setTimeout(() => {
                if (window.statsChart.resize) {
                    window.statsChart.resize();
                }
            }, 50);
        }
    }
    
    /**
     * Exibe o prompt de seleção de cultura
     * @param {string} message - Mensagem a ser exibida
     */
    showSelectionPrompt(message = 'Selecione uma cultura na aba "Culturas" para visualizar a análise.') {
        if (!this.initialized) return;
        
        if (this.selectPromptElement) {
            this.selectPromptElement.style.display = 'block';
            this.selectPromptElement.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    ${message}
                </div>
            `;
        }
        
        if (this.contentElement) {
            this.contentElement.style.display = 'none';
        }
    }
    
    /**
     * Exibe mensagem de carregamento
     */
    showLoading() {
        if (!this.initialized) return;
        
        if (this.selectPromptElement) {
            this.selectPromptElement.style.display = 'block';
            this.selectPromptElement.innerHTML = `
                <div class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                    <p class="mt-2">Carregando análise...</p>
                </div>
            `;
        }
        
        if (this.contentElement) {
            this.contentElement.style.display = 'none';
        }
    }
    
    /**
     * Ativa uma aba específica
     * @param {string} tabId - ID da aba a ser ativada
     * @returns {boolean} - True se a aba foi ativada com sucesso
     */
    activateTab(tabId) {
        if (!this.componentsReady) {
            console.warn('AnalysisView: Tentativa de ativar aba com componentes não inicializados');
            return false;
        }
        
        return this.tabsComponent.activateTab(tabId);
    }
    



    /**
     * Renderiza a análise com os dados fornecidos
     * @param {AnalysisModel} analysisModel - Modelo de análise
     */
    renderAnalysis(analysisModel) {
        console.log("Renderizando análise:", analysisModel);
        console.log("isComplete():", analysisModel.isComplete());
        
        if (!analysisModel.isComplete()) {
            this.showSelectionPrompt('Dados de análise incompletos ou não disponíveis.');
            console.error('Análise incompleta:', 
                         'cultureId:', analysisModel.cultureId, 
                         'cultureInfo:', analysisModel.cultureInfo);
            return;
        }
        
        const culture = analysisModel.cultureInfo;
        
        // verificação detalhada dos dados recebidos para debugging
        console.log("Dados completos da análise:", JSON.stringify(analysisModel));
        
        // atualiza título principal da página com informações da cultura
        document.getElementById('analysis-culture-title').innerHTML = `
            Cultura <span class="text-primary">#${analysisModel.cultureId}</span>: ${culture.tipo}
            <span class="badge bg-secondary ms-2">${culture.area} hectares</span>
        `;
        
        // remove os badges separados que agora estão no título
        document.getElementById('analysis-culture-type').style.display = 'none';
        document.getElementById('analysis-culture-area').style.display = 'none';
        
        // renderiza JSON para aba de dados brutos
        document.getElementById('json-data').textContent = JSON.stringify(analysisModel, null, 2);
        
        // extrair e processar estatísticas formatadas se disponíveis
        const stats = analysisModel.stats || {};
        
        // verifica se há estatísticas formatadas ou análises estatísticas
        if (culture.estatisticas_formatadas || culture.analise_estatistica) {
            // adiciona ao objeto stats para passar ao componente de estatísticas
            stats.estatisticas_formatadas = culture.estatisticas_formatadas || 
                                            (culture.analise_estatistica && culture.analise_estatistica.input_summary) || 
                                            {};
            
            stats.explicacoes_estatisticas = culture.explicacoes_estatisticas || {};
            
            console.log("Estatísticas formatadas encontradas:", stats.estatisticas_formatadas);
        }
        
        // ORDEM CORRETA DE RENDERIZAÇÃO:
        // 1. Renderiza componentes específicos de cultura
        this._renderCultureSpecificComponents(analysisModel, culture);
        
        // 2. Renderiza recomendações gerais
        this._renderAllRecommendations(analysisModel);
        
        // 3. Renderiza informações meteorológicas
        this.renderWeatherInfo(analysisModel);
        
        // 4. Renderiza estatísticas - INFO: passando as estatísticas processadas
        this.renderCultureStats(analysisModel, stats);
        
        // exibe o conteúdo da análise
        document.getElementById('analysis-select-prompt').style.display = 'none';
        document.getElementById('analysis-content').style.display = 'block';
        
        // ativa a aba de recomendações por padrão
        this.activateTab('#tab-recommendations');
    }




    /**
     * Renderiza componentes específicos de cultura
     * @param {AnalysisModel} analysisModel - Modelo de análise
     * @param {Object} culture - Dados da cultura
     * @private
     */
    _renderCultureSpecificComponents(analysisModel, culture) {
        // verificação e log detalhado da estrutura dos dados para facilitar debug
        console.log("Estrutura de dados para componentes de cultura:", {
            isSoy: analysisModel.isSoy(),
            isSugarcane: analysisModel.isSugarcane(),
            cultureInfo: culture,
            soy_specific: analysisModel.soy_specific,
            recommendations: analysisModel.recommendations,
            sugarcaneRecommendations: analysisModel.sugarcaneRecommendations
        });
        
        if (analysisModel.isSoy()) {
            // para soja, busca recomendações em múltiplos lugares da estrutura
            let soybeanRecommendations = null;
            
            if (culture.recomendacoes) {
                soybeanRecommendations = culture.recomendacoes;
                console.log("Usando recomendações da cultura:", soybeanRecommendations);
            } else if (analysisModel.soy_specific) {
                // acesso direto a soy_specific
                console.log("Encontrado soy_specific:", analysisModel.soy_specific);
                soybeanRecommendations = this._adaptSoybeanRecommendations(analysisModel, culture);
            } else if (analysisModel.recommendations && 
                      analysisModel.recommendations.data && 
                      analysisModel.recommendations.data.soy_specific) {
                soybeanRecommendations = analysisModel.recommendations.data.soy_specific;
                soybeanRecommendations = this._adaptSoybeanRecommendations(analysisModel, culture);
            }
            
            if (soybeanRecommendations) {
                console.log("Renderizando recomendações para soja:", soybeanRecommendations);
                this.soybeanComponent.render(soybeanRecommendations, culture);
            } else {
                console.warn("Sem recomendações específicas disponíveis para soja");
            }
        } else if (analysisModel.isSugarcane()) {
            // para cana-de-açúcar
            if (analysisModel.sugarcaneRecommendations) {
                this.sugarcaneComponent.render(analysisModel.sugarcaneRecommendations, culture);
            } else if (culture.recomendacoes) {
                this.sugarcaneComponent.render(culture.recomendacoes, culture);
            } else {
                console.warn("Sem recomendações específicas disponíveis para cana-de-açúcar");
            }
        }
    }

    /**
     * Adapta os dados de recomendações de soja para o formato esperado
     * @param {AnalysisModel} analysisModel - Modelo de análise
     * @param {Object} culture - Dados da cultura
     * @returns {Object} - Recomendações adaptadas
     * @private
     */
    _adaptSoybeanRecommendations(analysisModel, culture) {
        // se culture.recomendacoes já possui o formato esperado, retorna diretamente
        if (culture.recomendacoes) {
            return culture.recomendacoes;
        }
        
        const soySpecific = analysisModel.soy_specific || {};
        
        // cria objeto de recomendações compatível
        return {
            variedade_info: {
                duracao: "4-5 meses",
                descricao: soySpecific.production_description || "Ciclo de cultivo de soja"
            },
            espacamento: {
                status: "adequado",
                mensagem: "Espaçamento dentro dos parâmetros recomendados para soja.",
                recomendado: {
                    min: 0.4,
                    max: 0.6,
                    ideal: 0.45
                }
            },
            area: {
                status: "adequada",
                mensagem: "Área dentro dos parâmetros recomendados para soja.",
                recomendado: {
                    min: 10,
                    max: 300,
                    ideal: 80
                }
            },
            irrigacao: {
                ativa: culture.irrigacao || false,
                mensagem: "Sistema de irrigação recomendado para maximizar produtividade.",
                sistema: "Aspersão ou gotejamento",
                frequencia: "Conforme necessidade hídrica",
                volume: "4-5 mm/dia",
                eficiencia: "85-90% de aproveitamento da água"
            },
            produtividade: soySpecific.productivity_estimate || null,
            periodo_plantio: soySpecific.optimal_planting_period || "Setembro a Novembro"
        };
    }

    /**
     * Renderiza todas as recomendações disponíveis
     * @param {AnalysisModel} analysisModel - Modelo de análise
     * @private
     */
    _renderAllRecommendations(analysisModel) {
        if (!analysisModel.recommendations) {
            document.getElementById('recommendation-summary').innerHTML = '<div class="alert alert-warning">Nenhuma recomendação disponível</div>';
            return;
        }
        
        // log da estrutura completa das recomendações para debug
        console.log("Estrutura completa de recomendações:", analysisModel.recommendations);
        
        // 1. Renderiza recomendações básicas
        this._renderRecommendations(analysisModel);
        
        // 2. Garante que monitoring_optimization seja exibido
        this._renderMonitoringOptimization(analysisModel.recommendations);
        
        // 3. Garante que environmental_impact seja exibido
        this._renderEnvironmentalImpact(analysisModel.recommendations);
        
        // 4. Garante que data_analysis seja exibido
        this._renderDataAnalysis(analysisModel.recommendations);
        
        // 5. Garante que statistical_models seja exibido
        this._renderStatisticalModels(analysisModel.recommendations);
    }

    /**
     * Renderiza informações meteorológicas
     * @param {AnalysisModel} analysisModel - Modelo de análise
     */
    renderWeatherInfo(analysisModel) {
        if (analysisModel.hasWeatherData && typeof analysisModel.hasWeatherData === 'function' && analysisModel.hasWeatherData()) {
            this.weatherComponent.render(analysisModel);
        } else {
            // verificação alternativa se o método hasWeatherData não existir
            if (analysisModel && (analysisModel.currentWeather || analysisModel.weatherData)) {
                this.weatherComponent.render(analysisModel);
            } else {
                // limpa e mostra mensagem de erro
                this.weatherComponent.clear();
                const weatherEl = document.getElementById('current-weather');
                if (weatherEl) {
                    weatherEl.innerHTML = '<div class="alert alert-warning">Nenhum dado meteorológico disponível</div>';
                }
                
                const impactEl = document.getElementById('weather-impact');
                if (impactEl) {
                    impactEl.innerHTML = '';
                }
            }
        }
    }

    /**
     * Renderiza estatísticas da cultura
     * @param {AnalysisModel} analysisModel - Modelo de análise
     * @param {Object} processedStats - Estatísticas já processadas (opcional)
     */
    renderCultureStats(analysisModel, processedStats = null) {
        const culture = analysisModel.cultureInfo;
        
        if (!culture) {
            console.warn("Dados da cultura não disponíveis para renderização de estatísticas");
            return;
        }
        
        // use statsComponent para renderizar estatísticas
        // passar também as estatísticas processadas
        this.statsComponent.render(analysisModel, processedStats);
        
        // ajusta o contêiner de gráficos para melhor visualização
        this._adjustGraphicsContainer();
        
        // adiciona evento para exibir a aba de estatísticas quando solicitado
        document.querySelectorAll('[data-action="show-stats"]').forEach(button => {
            button.addEventListener('click', () => {
                this.activateTab('#tab-stats');
            });
        });
    }


    /**
     * Ajusta o contêiner de gráficos para melhor visualização
     * @private
     */
    _adjustGraphicsContainer() {
        // seletor para o contêiner principal de gráficos
        const graphicsContainer = document.querySelector('#tab-stats');
        if (!graphicsContainer) return;
        
        // adiciona classes para melhorar o comportamento responsivo
        graphicsContainer.classList.add('graphics-container-responsive');
        
        // injeta estilos CSS específicos para o contêiner de gráficos
        if (!document.getElementById('graphics-container-styles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'graphics-container-styles';
            styleEl.textContent = `
                /* Estilos para o contêiner principal de gráficos */
                .graphics-container-responsive {
                    display: flex;
                    flex-direction: column;
                    height: auto !important;
                    min-height: 200px;
                    max-height: none !important;
                    overflow: visible;
                }
                
                /* Ajustes para o card do gráfico */
                .graphics-container-responsive .card {
                    height: auto;
                    margin-bottom: 1rem;
                }
                
                /* Garantir que o cabeçalho do gráfico sempre seja visível */
                .graphics-container-responsive .card-header {
                    position: sticky;
                    top: 0;
                    z-index: 1;
                    background-color: #fff;
                }
                
                /* Melhorar o layout da legenda */
                .graphics-container-responsive .card-footer {
                    padding: 0.5rem !important;
                }
                
                /* Garantir que a tab de estatísticas tenha altura suficiente */
                #tab-stats {
                    min-height: 500px;
                    height: auto !important;
                    overflow: visible;
                }
                
                /* Ajustes para telas pequenas */
                @media (max-width: 768px) {
                    .graphics-container-responsive .card-body {
                        padding: 0.5rem;
                    }
                    
                    .graphics-container-responsive .chart-wrapper {
                        height: 300px !important;
                    }
                }
            `;
            document.head.appendChild(styleEl);
        }
        
        // garante que os contêineres pai também sejam responsivos
        const tabs = document.querySelector('.tab-content');
        if (tabs) {
            tabs.style.height = 'auto';
            tabs.style.minHeight = '500px';
            tabs.style.overflow = 'visible';
        }
        
        // ajusta explicitamente o contêiner do gráfico
        const statsChart = document.getElementById('stats-chart');
        if (statsChart) {
            statsChart.style.height = 'auto';
            statsChart.style.minHeight = '350px';
            statsChart.style.overflow = 'visible';
        }
        
        // certifique-se que o gráfico é reajustado quando a tab é mostrada
        document.querySelectorAll('#analysisTabs .nav-link').forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => {
                if (e.target.getAttribute('href') === '#tab-stats') {
                    // força o redimensionamento do gráfico
                    if (window.statsChart) {
                        setTimeout(() => {
                            window.statsChart.resize();
                        }, 50);
                    }
                }
            });
        });
    }

    /**
     * Renderiza recomendações gerais
     * @param {AnalysisModel} analysisModel - Modelo de análise completo
     * @private
     */
    _renderRecommendations(analysisModel) {
        // verifica se o método existe no objeto antes de chamar
        if (analysisModel && typeof analysisModel.hasRecommendations === 'function' && analysisModel.hasRecommendations()) {
            this.recommendationsComponent.render(analysisModel.recommendations);
        } else {
            // verificação alternativa se o método hasRecommendations não existir
            if (analysisModel && analysisModel.recommendations && analysisModel.recommendations.data) {
                this.recommendationsComponent.render(analysisModel.recommendations);
            } else {
                this.recommendationsComponent.clear();
                const summaryEl = document.getElementById('recommendation-summary');
                if (summaryEl) {
                    summaryEl.innerHTML = '<div class="alert alert-warning">Nenhuma recomendação disponível</div>';
                }
            }
        }
    }
    
    /**
     * Renderiza a seção de monitoramento e otimização
     * @param {Object} recommendations - Dados de recomendações
     * @private
     */
    _renderMonitoringOptimization(recommendations) {
        // extrai a seção monitoring_optimization
        let monitoring = null;
        
        if (recommendations.monitoring_optimization) {
            monitoring = recommendations.monitoring_optimization;
        } else if (recommendations.data && recommendations.data.monitoring_optimization) {
            monitoring = recommendations.data.monitoring_optimization;
        }
        
        if (!monitoring || Object.keys(monitoring).length === 0) {
            console.log("Nenhum dado de monitoramento e otimização encontrado");
            return;
        }
        
        console.log("Renderizando monitoring_optimization:", monitoring);
        
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
            const inputsSection = document.getElementById('inputs-recommendations').closest('.card');
            if (inputsSection && inputsSection.parentNode) {
                inputsSection.parentNode.insertBefore(monitoringSection, inputsSection.nextSibling);
            } else {
                // fallback se não encontrar a seção de insumos
                const recommendationsTab = document.getElementById('tab-recommendations');
                if (recommendationsTab) {
                    recommendationsTab.appendChild(monitoringSection);
                }
            }
        }
        
        // preenche a seção com os dados
        let monitoringHtml = `<div class="row">`;
        
        // campos possíveis de monitoramento
        const monitoringFields = [
            {field: 'heat_stress', icon: 'temperature-high', title: 'Condição Térmica'},
            {field: 'irrigation_advice', icon: 'tint', title: 'Recomendação de Irrigação'},
            {field: 'herbicide_advice', icon: 'spray-can', title: 'Recomendação de Herbicida'},
            {field: 'field_operations', icon: 'tractor', title: 'Operações de Campo'},
            {field: 'fire_risk', icon: 'fire', title: 'Risco de Incêndio'}
        ];
        
        // adiciona cada campo presente no monitoramento
        monitoringFields.forEach(item => {
            if (monitoring[item.field]) {
                monitoringHtml += `
                    <div class="col-md-6 mb-3">
                        <div class="card h-100">
                            <div class="card-header">
                                <h6 class="mb-0"><i class="fas fa-${item.icon} me-2"></i>${item.title}</h6>
                            </div>
                            <div class="card-body">
                                <p>${monitoring[item.field]}</p>
                            </div>
                        </div>
                    </div>
                `;
            }
        });
        
        monitoringHtml += `</div>`;
        
        document.getElementById('monitoring-content').innerHTML = monitoringHtml;
    }

    /**
     * Renderiza a seção de impacto ambiental
     * @param {Object} recommendations - Dados de recomendações
     * @private
     */
    _renderEnvironmentalImpact(recommendations) {
        // extrai a seção environmental_impact
        let environmental = null;
        
        if (recommendations.environmental_impact) {
            environmental = recommendations.environmental_impact;
        } else if (recommendations.data && recommendations.data.environmental_impact) {
            environmental = recommendations.data.environmental_impact;
        }
        
        if (!environmental || Object.keys(environmental).length === 0) {
            console.log("Nenhum dado de impacto ambiental encontrado");
            return;
        }
        
        console.log("Renderizando environmental_impact:", environmental);
        
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
            
            // adiciona após a seção de monitoramento
            const prevSection = document.getElementById('monitoring-section');
            if (prevSection && prevSection.parentNode) {
                prevSection.parentNode.insertBefore(envSection, prevSection.nextSibling);
            } else {
                // fallback
                const recommendationsTab = document.getElementById('tab-recommendations');
                if (recommendationsTab) {
                    recommendationsTab.appendChild(envSection);
                }
            }
        }
        
        // preenche a seção com os dados
        let envHtml = `<div class="row">`;
        
        // campos possíveis de impacto ambiental
        const envFields = [
            {field: 'drift_risk', icon: 'wind', title: 'Risco de Deriva'},
            {field: 'drift_recommendation', icon: 'info-circle', title: 'Recomendação para Deriva'},
            {field: 'water_contamination', icon: 'water', title: 'Risco de Contaminação da Água'},
            {field: 'water_recommendation', icon: 'info-circle', title: 'Recomendação para Água'},
            {field: 'soil_impact', icon: 'mountain', title: 'Impacto no Solo'},
            {field: 'soil_recommendation', icon: 'info-circle', title: 'Recomendação para Solo'}
        ];
        
        // adiciona cada campo presente no impacto ambiental
        envFields.forEach(item => {
            if (environmental[item.field]) {
                envHtml += `
                    <div class="col-md-6 mb-3">
                        <div class="card h-100">
                            <div class="card-header">
                                <h6 class="mb-0"><i class="fas fa-${item.icon} me-2"></i>${item.title}</h6>
                            </div>
                            <div class="card-body">
                                <p>${environmental[item.field]}</p>
                            </div>
                        </div>
                    </div>
                `;
            }
        });
        
        envHtml += `</div>`;
        
        document.getElementById('environmental-content').innerHTML = envHtml;
    }




    /**
     * Renderiza a seção de análise de dados com design melhorado
     * @param {Object} recommendations - Dados de recomendações
     * @private
     */
    _renderDataAnalysis(recommendations) {
        // extrai a seção data_analysis
        let dataAnalysis = null;
        
        if (recommendations.data_analysis) {
            dataAnalysis = recommendations.data_analysis;
        } else if (recommendations.data && recommendations.data.data_analysis) {
            dataAnalysis = recommendations.data.data_analysis;
        }
        
        if (!dataAnalysis || Object.keys(dataAnalysis).length === 0) {
            console.log("Nenhum dado de análise encontrado");
            return;
        }
        
        console.log("Renderizando data_analysis:", dataAnalysis);
        
        // cria seção para análise de dados se não existir
        let dataSection = document.getElementById('data-analysis-section');
        if (!dataSection) {
            dataSection = document.createElement('div');
            dataSection.id = 'data-analysis-section';
            dataSection.className = 'card mb-4';
            dataSection.innerHTML = `
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">Análise de Dados</h5>
                </div>
                <div class="card-body" id="data-analysis-content"></div>
            `;
            
            // adiciona após a seção de impacto ambiental
            const prevSection = document.getElementById('environmental-section') || document.getElementById('monitoring-section');
            if (prevSection && prevSection.parentNode) {
                prevSection.parentNode.insertBefore(dataSection, prevSection.nextSibling);
            } else {
                // fallback
                const recommendationsTab = document.getElementById('tab-recommendations');
                if (recommendationsTab) {
                    recommendationsTab.appendChild(dataSection);
                }
            }
        }
        
        // verifica se há os dados necessários
        const keyMetrics = dataAnalysis.key_metrics || {};
        const efficiencyMetrics = dataAnalysis.efficiency_metrics || {};
        
        // prepara o HTML para o dashboard de métricas melhorado
        let dataHtml = `
            <div class="dashboard-metrics">
                <!-- Indicadores principais (em formato de cartões) -->
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-icon"><i class="fas fa-chart-area"></i></div>
                        <div class="metric-content">
                            <div class="metric-label">Área</div>
                            <div class="metric-value">${keyMetrics.area_hectares || 0} ha</div>
                        </div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-icon"><i class="fas fa-seedling"></i></div>
                        <div class="metric-content">
                            <div class="metric-label">Produção Potencial</div>
                            <div class="metric-value">${keyMetrics.potential_production || 'N/A'}</div>
                        </div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-icon"><i class="fas fa-grip-lines"></i></div>
                        <div class="metric-content">
                            <div class="metric-label">Linhas de Plantio</div>
                            <div class="metric-value">${keyMetrics.linhas_plantio || 0}</div>
                        </div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-icon"><i class="fas fa-ruler"></i></div>
                        <div class="metric-content">
                            <div class="metric-label">Metros Lineares</div>
                            <div class="metric-value">${keyMetrics.metros_lineares || 0}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Métricas de eficiência (com barras de progresso) -->
                <div class="efficiency-section mt-4">
                    <h6 class="mb-3"><i class="fas fa-tachometer-alt me-2"></i> Eficiência de Recursos</h6>
                    <div class="efficiency-metrics">
        `;
        
        // adiciona métricas de eficiência se disponíveis
        if (efficiencyMetrics.herbicide_use) {
            dataHtml += `
                <div class="efficiency-item mb-3">
                    <div class="d-flex justify-content-between mb-1">
                        <span class="efficiency-label">Uso de herbicida:</span>
                        <span class="efficiency-status optimal">Adequado</span>
                    </div>
                    <div class="progress" style="height: 10px;">
                        <div class="progress-bar bg-success" role="progressbar" style="width: 75%" 
                             aria-valuenow="75" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                    <small class="text-muted d-block mt-1">${efficiencyMetrics.herbicide_use}</small>
                </div>
            `;
        }
        
        if (efficiencyMetrics.water_use) {
            dataHtml += `
                <div class="efficiency-item mb-3">
                    <div class="d-flex justify-content-between mb-1">
                        <span class="efficiency-label">Uso de água:</span>
                        <span class="efficiency-status good">Eficiente</span>
                    </div>
                    <div class="progress" style="height: 10px;">
                        <div class="progress-bar bg-info" role="progressbar" style="width: 65%" 
                             aria-valuenow="65" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                    <small class="text-muted d-block mt-1">${efficiencyMetrics.water_use}</small>
                </div>
            `;
        }
        
        dataHtml += `
                    </div>
                </div>
        `;
        
        // adiciona recomendação de monitoramento se disponível
        if (dataAnalysis.monitoring_recommendation) {
            dataHtml += `
                <div class="recommendation-box mt-4 alert alert-info">
                    <div class="recommendation-header">
                        <i class="fas fa-clipboard-check me-2"></i> <strong>Monitoramento Recomendado</strong>
                    </div>
                    <div class="recommendation-content mt-2">
                        <p class="mb-0">${dataAnalysis.monitoring_recommendation}</p>
                    </div>
                </div>
            `;
        }
        
        // fecha a div principal
        dataHtml += `</div>`;
        
        // insere o HTML na página
        document.getElementById('data-analysis-content').innerHTML = dataHtml;
        
        // adiciona estilos CSS específicos se ainda não existirem
        this._addDataAnalysisStyles();
    }

    /**
     * Adiciona estilos CSS necessários para o dashboard de análise
     * @private
     */
    _addDataAnalysisStyles() {
        if (!document.getElementById('data-analysis-styles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'data-analysis-styles';
            styleEl.textContent = `
                /* Estilos para o dashboard de métricas */
                .dashboard-metrics {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                }
                
                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }
                
                .metric-card {
                    display: flex;
                    background-color: #f8f9fa;
                    border-radius: 0.5rem;
                    padding: 1rem;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                
                .metric-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }
                
                .metric-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 48px;
                    height: 48px;
                    background-color: #e7f5ff;
                    color: #0d6efd;
                    border-radius: 12px;
                    margin-right: 1rem;
                }
                
                .metric-icon i {
                    font-size: 1.25rem;
                }
                
                .metric-content {
                    flex: 1;
                }
                
                .metric-label {
                    color: #6c757d;
                    font-size: 0.875rem;
                    margin-bottom: 0.25rem;
                }
                
                .metric-value {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #212529;
                }
                
                .metric-trend {
                    font-size: 0.75rem;
                    display: flex;
                    align-items: center;
                    margin-top: 0.25rem;
                }
                
                .metric-trend.positive {
                    color: #198754;
                }
                
                .metric-trend.negative {
                    color: #dc3545;
                }
                
                .efficiency-section {
                    background-color: #f8f9fa;
                    border-radius: 0.5rem;
                    padding: 1rem;
                }
                
                .efficiency-status {
                    font-size: 0.75rem;
                    padding: 0.125rem 0.5rem;
                    border-radius: 1rem;
                    font-weight: 600;
                }
                
                .efficiency-status.optimal {
                    background-color: #d1e7dd;
                    color: #0f5132;
                }
                
                .efficiency-status.good {
                    background-color: #cff4fc;
                    color: #055160;
                }
                
                .efficiency-status.warning {
                    background-color: #fff3cd;
                    color: #664d03;
                }
                
                /* Responsividade */
                @media (max-width: 768px) {
                    .metrics-grid {
                        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                    }
                    
                    .metric-card {
                        flex-direction: column;
                        text-align: center;
                    }
                    
                    .metric-icon {
                        margin: 0 auto 0.75rem;
                    }
                }
            `;
            document.head.appendChild(styleEl);
        }
    }




    /**
     * Renderiza a seção de modelos estatísticos
     * @param {Object} recommendations - Dados de recomendações
     * @private
     */
    _renderStatisticalModels(recommendations) {
        // extrai a seção statistical_models
        let statModels = null;
        
        if (recommendations.statistical_models) {
            statModels = recommendations.statistical_models;
        } else if (recommendations.data && recommendations.data.statistical_models) {
            statModels = recommendations.data.statistical_models;
        }
        
        if (!statModels || Object.keys(statModels).length === 0) {
            console.log("Nenhum dado de modelos estatísticos encontrado");
            return;
        }
        
        console.log("Renderizando statistical_models:", statModels);
        
        // cria seção para modelos estatísticos se não existir
        let statSection = document.getElementById('stat-models-section');
        if (!statSection) {
            statSection = document.createElement('div');
            statSection.id = 'stat-models-section';
            statSection.className = 'card mb-4';
            statSection.innerHTML = `
                <div class="card-header bg-secondary text-white">
                    <h5 class="mb-0">Modelos Estatísticos</h5>
                </div>
                <div class="card-body" id="stat-models-content"></div>
            `;
            
            // adiciona após as outras seções
            const prevSection = document.getElementById('data-analysis-section') || 
                               document.getElementById('environmental-section') || 
                               document.getElementById('monitoring-section');
            if (prevSection && prevSection.parentNode) {
                prevSection.parentNode.insertBefore(statSection, prevSection.nextSibling);
            } else {
                // fallback
                const recommendationsTab = document.getElementById('tab-recommendations');
                if (recommendationsTab) {
                    recommendationsTab.appendChild(statSection);
                }
            }
        }
        
        // preenche a seção com os dados
        let statHtml = `<div class="row">`;
        
        // campos possíveis de modelos estatísticos
        const statFields = [
            {field: 'development', icon: 'seedling', title: 'Desenvolvimento'},
            {field: 'productivity_forecast', icon: 'chart-line', title: 'Previsão de Produtividade'},
            {field: 'historical_comparison', icon: 'history', title: 'Comparação Histórica'}
        ];
        
        // adiciona cada campo presente nos modelos estatísticos
        statFields.forEach(item => {
            if (statModels[item.field]) {
                statHtml += `
                    <div class="col-md-4 mb-3">
                        <div class="card h-100">
                            <div class="card-header">
                                <h6 class="mb-0"><i class="fas fa-${item.icon} me-2"></i>${item.title}</h6>
                            </div>
                            <div class="card-body">
                                <p>${statModels[item.field]}</p>
                            </div>
                        </div>
                    </div>
                `;
            }
        });
        
        statHtml += `</div>`;
        
        document.getElementById('stat-models-content').innerHTML = statHtml;
    }

    /**
     * Limpa a visualização de análise
     */
    clearAnalysis() {
        if (!this.initialized) return;
        
        // limpa título e dados principais
        if (this.titleElement) {
            this.titleElement.innerHTML = '';
        }
        
        // restaura elementos auxiliares
        if (this.cultureTypeElement) {
            this.cultureTypeElement.style.display = 'inline-block';
            this.cultureTypeElement.textContent = '';
        }
        
        if (this.cultureAreaElement) {
            this.cultureAreaElement.style.display = 'inline-block';
            this.cultureAreaElement.textContent = '';
        }
        
        // limpa JSON
        if (this.jsonElement) {
            this.jsonElement.textContent = '';
        }
        
        // limpa apenas componentes que foram inicializados com sucesso
        if (this.componentsReady) {
            this.soybeanComponent.clear();
            this.sugarcaneComponent.clear();
            this.recommendationsComponent.clear();
            this.weatherComponent.clear();
            this.statsComponent.clear();
        }
        
        // remove seções dinâmicas
        this._removeDynamicSections();
        
        // mostra prompt de seleção
        this.showSelectionPrompt();
        
        // oculta botão de atualização
        const refreshBtn = document.getElementById('btn-refresh-analysis');
        if (refreshBtn) {
            refreshBtn.style.display = 'none';
        }
    }
    
    /**
     * Remove seções dinâmicas do DOM
     * @private
     */
    _removeDynamicSections() {
        const dynamicSections = [
            'soybean-recommendations-section',
            'sugarcane-recommendations-section',
            'monitoring-section',
            'environmental-section',
            'data-analysis-section',
            'stat-models-section'
        ];
        
        dynamicSections.forEach(id => {
            const section = document.getElementById(id);
            if (section) {
                section.remove();
            }
        });
    }
}

