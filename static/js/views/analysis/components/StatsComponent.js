/* * * *
 *
 * Componente para visualização de estatísticas e projeções da cultura
 *
 * * * */
import { BaseComponent } from './BaseComponent.js';

export class StatsComponent extends BaseComponent {
    /**
     * Inicializa o componente de estatísticas
     * @param {string} cultureStatsId - ID do container para estatísticas da cultura
     * @param {string} projectionsId - ID do container para projeções
     * @param {string} statsChartId - ID do container para o gráfico de estatísticas
     **/
    constructor(
        cultureStatsId = 'culture-stats',
        projectionsId = 'culture-projections',
        statsChartId = 'stats-chart'
    ) {
        super(cultureStatsId);
        this.projectionsId = projectionsId;
        this.statsChartId = statsChartId;
        
        this.projectionsContainer = null;
        this.chartContainer = null;
    }

    /**
     * Inicializa o componente, buscando containers no DOM
     * @returns {boolean} - True se a inicialização foi bem sucedida
     **/
    initialize() {
        const result = super.initialize();
        if (!result) return false;

        this.projectionsContainer = document.getElementById(this.projectionsId);
        this.chartContainer = document.getElementById(this.statsChartId);

        if (!this.projectionsContainer || !this.chartContainer) {
            console.error('Containers de estatísticas não encontrados');
            return false;
        }

        return true;
    }

    /**
     * Renderiza o componente de estatísticas
     * @param {Object} analysisModel - Modelo de análise com dados da cultura
     * @returns {boolean} - True se a renderização foi bem sucedida
     **/
    render(analysisModel) {
        if (!this.container || !this.projectionsContainer || !this.chartContainer) {
            return false;
        }

        if (!analysisModel || !analysisModel.cultureInfo) {
            this.container.innerHTML = '<div class="alert alert-warning">Dados da cultura não disponíveis</div>';
            this.projectionsContainer.innerHTML = '';
            return false;
        }

        const culture = analysisModel.cultureInfo;
        
        // renderiza estatísticas da cultura
        this._renderCultureStats(culture, analysisModel.stats);
        
        // renderiza projeções
        this._renderProjections(analysisModel);
        
        // ajusta contêiner de gráficos
        this._adjustGraphicsContainer();

        return true;
    }

    /**
     * Renderiza as estatísticas da cultura
     * @param {Object} culture - Dados da cultura
     * @param {Object} stats - Estatísticas adicionais
     * @private
     */
    _renderCultureStats(culture, stats = {}) {
        const sugarcaneSpecific = stats.sugarcane_specific || null;

        let html = `
            <div class="table-responsive">
                <table class="table table-bordered">
                    <tbody>
                        <tr>
                            <th>Tipo de Cultura</th>
                            <td>${culture.tipo || 'Desconhecido'}</td>
                        </tr>
                        <tr>
                            <th>Área</th>
                            <td>${culture.area || 0} hectares</td>
                        </tr>
                        <tr>
                            <th>Espaçamento</th>
                            <td>${culture.espacamento || 0} metros</td>
                        </tr>
                        <tr>
                            <th>Linhas Calculadas</th>
                            <td>${culture.linhas_calculadas || stats.linhas_calculadas || stats.linhas_plantio || 'Não calculado'}</td>
                        </tr>
                        <tr>
                            <th>Comprimento da Linha</th>
                            <td>${stats.comprimento_linha || 0} metros</td>
                        </tr>
                        <tr>
                            <th>Total Metros Lineares</th>
                            <td>${stats.metros_lineares || stats.metros_lineares_total || 0} metros</td>
                        </tr>
        `;
        
        // adiciona informações específicas para cana-de-açúcar
        if (sugarcaneSpecific) {
            html += `
                        <tr>
                            <th>Ciclo</th>
                            <td>${sugarcaneSpecific.ciclo || culture.ciclo} (${sugarcaneSpecific.duracao})</td>
                        </tr>
                        <tr>
                            <th>Descrição do Ciclo</th>
                            <td>${sugarcaneSpecific.descricao}</td>
                        </tr>
            `;
        }
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        this.container.innerHTML = html;
    }

    /**
     * Renderiza as projeções e produtividade
     * @param {Object} analysisModel - Modelo de análise
     * @private
     **/
    _renderProjections(analysisModel) {
        const culture = analysisModel.cultureInfo;
        const productivityData = analysisModel.getFormattedProductivity();
        const stats = analysisModel.stats || {};
        const efficiencyMetrics = stats.efficiency_metrics || {};
        
        // dados de insumos
        let insumosData = {};
        if (stats.insumos_totais) {
            insumosData = stats.insumos_totais;
        } else {
            insumosData = {
                herbicida: `${culture.quantidade_herbicida || 0} L`,
                fertilizante: `${culture.quantidade_fertilizante || 0} kg`
            };
        }
        
        let html = `
            <div class="table-responsive">
                <table class="table table-bordered">
                    <tbody>
                        <tr>
                            <th>Estimativa de Produção</th>
                            <td>${productivityData.value} ${productivityData.unit}<br>
                            Total: ${productivityData.total} ${productivityData.totalUnit}</td>
                        </tr>
                        <tr>
                            <th>Insumos Necessários</th>
                            <td>
                                Herbicida: ${insumosData.herbicida || '0 L'}<br>
                                Fertilizante: ${insumosData.fertilizante || '0 kg'}
                            </td>
                        </tr>
                        <tr>
                            <th>Período Ideal</th>
                            <td>${analysisModel.productivity.optimal_period || 'Não definido'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
        
        // adiciona métricas de eficiência se disponíveis
        if (efficiencyMetrics.water_use || efficiencyMetrics.herbicide_use) {
            html += `
                <div class="mt-3">
                    <h6>Métricas de Eficiência:</h6>
                    <ul class="list-group">
                        ${efficiencyMetrics.water_use ? `<li class="list-group-item">${efficiencyMetrics.water_use}</li>` : ''}
                        ${efficiencyMetrics.herbicide_use ? `<li class="list-group-item">${efficiencyMetrics.herbicide_use}</li>` : ''}
                    </ul>
                </div>
            `;
        }
        
        this.projectionsContainer.innerHTML = html;
    }

    /**
     * Ajusta o contêiner de gráficos para melhor visualização
     * @private
     **/
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
                /* estilos para o contêiner principal de gráficos */
                .graphics-container-responsive {
                    display: flex;
                    flex-direction: column;
                    height: auto !important;
                    min-height: 200px;
                    max-height: none !important;
                    overflow: visible;
                }
                
                /* ajustes para o card do gráfico */
                .graphics-container-responsive .card {
                    height: auto;
                    margin-bottom: 1rem;
                }
                
                /* garante que o cabeçalho do gráfico sempre seja visível */
                .graphics-container-responsive .card-header {
                    position: sticky;
                    top: 0;
                    z-index: 1;
                    background-color: #fff;
                }
                
                /* melhora o layout da legenda */
                .graphics-container-responsive .card-footer {
                    padding: 0.5rem !important;
                }
                
                /* garante que a tab de estatísticas tenha altura suficiente */
                #tab-stats {
                    min-height: 500px;
                    height: auto !important;
                    overflow: visible;
                }
                
                /* ajuste para telas pequenas */
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
        const statsChart = this.chartContainer;
        if (statsChart) {
            statsChart.style.height = 'auto';
            statsChart.style.minHeight = '350px';
            statsChart.style.overflow = 'visible';
        }
        
        // certifica que o gráfico é reajustado quando a tab é mostrada
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
     * Limpa o componente
     **/
    clear() {
        super.clear();
        if (this.projectionsContainer) this.projectionsContainer.innerHTML = '';
    }
}

