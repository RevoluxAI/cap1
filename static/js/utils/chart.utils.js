/* * * *
 *
 * Utilitários para criação e manipulação de gráficos
 *
 * * * */
import { CONFIG } from '../config.js';

export class ChartUtils {
    /**
     * Cria um gráfico de previsão meteorológica
     * @param {string} elementId - ID do elemento onde o gráfico será renderizado
     * @param {Object} forecastData - Dados de previsão
     * @returns {Chart} Instância do gráfico
     **/
    static createWeatherForecastChart(elementId, forecastData) {
        const container = document.getElementById(elementId);
        if (!container) return null;
        
        // verifica se já existe um gráfico e destruí-lo
        if (window.weatherChart) {
            window.weatherChart.destroy();
        }
        
        if (!forecastData || !forecastData.labels) {
            container.innerHTML = '<div class="alert alert-warning">Dados insuficientes para gerar gráfico</div>';
            return null;
        }
        
        // limpa container e cria uma estrutura adequada para separar o gráfico da explicação
        container.innerHTML = '';
        
        // cria um contêiner principal para todo o conteúdo do gráfico
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container-with-notes';
        container.appendChild(chartContainer);
        
        // cria um wrapper para o gráfico com altura fixa e margem inferior
        const chartWrapper = document.createElement('div');
        chartWrapper.className = 'chart-wrapper';
        chartWrapper.style.height = '300px';      // altura fixa para o gráfico
        chartWrapper.style.marginBottom = '40px'; // margem de segurança para evitar sobreposição
        chartContainer.appendChild(chartWrapper);
        
        // cria canvas dentro do wrapper
        const canvas = document.createElement('canvas');
        chartWrapper.appendChild(canvas);
        
        // cria gráfico
        window.weatherChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: forecastData.labels,
                datasets: [
                    {
                        label: 'Temperatura (°C)',
                        data: forecastData.temperature,
                        borderColor: CONFIG.CHART.COLORS.TEMPERATURE.BORDER,
                        backgroundColor: CONFIG.CHART.COLORS.TEMPERATURE.BACKGROUND,
                        yAxisID: 'y1'
                    },
                    {
                        label: 'Umidade (%)',
                        data: forecastData.humidity,
                        borderColor: CONFIG.CHART.COLORS.HUMIDITY.BORDER,
                        backgroundColor: CONFIG.CHART.COLORS.HUMIDITY.BACKGROUND,
                        yAxisID: 'y2'
                    },
                    {
                        label: 'Vento (km/h)',
                        data: forecastData.wind,
                        borderColor: CONFIG.CHART.COLORS.WIND.BORDER,
                        backgroundColor: CONFIG.CHART.COLORS.WIND.BACKGROUND,
                        yAxisID: 'y3',
                        borderDash: [5, 5]
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // importante para manter a altura fixa
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Temperatura (°C)'
                        }
                    },
                    y2: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Umidade (%)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    },
                    y3: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Vento (km/h)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Previsão das Próximas Horas (Simulado)',
                        padding: {
                            top: 10,
                            bottom: 20
                        }
                    },
                    subtitle: {
                        display: true,
                        text: 'Baseado em tendências típicas a partir das condições atuais',
                        padding: {
                            bottom: 10
                        }
                    }
                }
            }
        });
        
        // adiciona explicação sobre os dados em um contêiner separado após o gráfico
        const chartExplanation = document.createElement('div');
        chartExplanation.className = 'alert alert-info small'; // removido mt-4 pois já temos margin no wrapper
        chartExplanation.style.clear = 'both'; // garante que flutue abaixo de todos os elementos anteriores
        chartExplanation.style.position = 'relative'; // estabelece novo contexto de posicionamento
        chartExplanation.style.zIndex = '1'; // garante que fique acima do gráfico caso haja sobreposição
        chartExplanation.innerHTML = `
            <p class="mb-0"><strong>Nota:</strong> Esta previsão é uma simulação baseada em tendências típicas a partir das condições meteorológicas atuais. 
            Para previsões mais precisas, consulte serviços meteorológicos oficiais.</p>
        `;
        chartContainer.appendChild(chartExplanation);
        
        return window.weatherChart;
    }
    
    /**
     * Cria um gráfico de desenvolvimento da cultura com layout responsivo aprimorado
     * @param {string} elementId - ID do elemento onde o gráfico será renderizado
     * @param {Object} cultureData - Dados da cultura
     * @returns {Chart} Instância do gráfico
     **/
    static createCultureDevelopmentChart(elementId, cultureData) {
        const container = document.getElementById(elementId);
        if (!container) return null;
        
        // verifica se já existe um gráfico e destruí-lo
        if (window.statsChart) {
            window.statsChart.destroy();
        }
        
        if (!cultureData || !cultureData.tipo) {
            container.innerHTML = '<div class="alert alert-warning">Dados insuficientes para gerar gráfico</div>';
            return null;
        }
        
        // limpa container e cria estrutura adequada
        container.innerHTML = '';
        
        // verifica se há um título de seção/tab que está causando problemas
        // e escondê-lo ou adiciona espaço suficiente para evitar sobreposição
        const tabHeader = document.querySelector('#tab-stats h2, #tab-stats h3, #tab-stats h4');
        if (tabHeader) {
            // oculta o título da tab para evitar duplicidade, já que teremos o título no gráfico
            tabHeader.style.display = 'none';
        }
        
        // calcula a altura ideal do gráfico baseada no viewport
        // usa uma função que calcula dinamicamente a melhor altura
        const calculateOptimalHeight = () => {
            const viewportHeight = window.innerHeight;
            // em telas grandes, usamos uma porcentagem do viewport
            // em telas pequenas, usamos um valor mínimo para garantir visibilidade
            return Math.max(300, Math.min(500, viewportHeight * 0.5));
        };
        
        // contêiner principal com layout de cartão para melhor estrutura visual
        const chartSection = document.createElement('div');
        chartSection.className = 'card mb-4 chart-section'; 
        chartSection.style.maxHeight = 'none'; // Remover altura máxima
        chartSection.style.overflow = 'visible'; // Mostrar todo o conteúdo
        container.appendChild(chartSection);
        
        // adiciona espaçamento superior significativo para evitar 
        // sobreposição com qualquer elemento acima
        // este é um ponto chave para a correção do problema
        chartSection.style.marginTop = '3rem'; // Aumentado para dar mais espaço
        
        // cabeçalho do cartão com ajustes para evitar sobreposição
        const chartHeader = document.createElement('div');
        chartHeader.className = 'card-header py-2'; // removido mt-4 e aplicado ao pai
        
        // melhorias para evitar sobreposição:
        chartHeader.style.position = 'relative'; 
        chartHeader.style.zIndex = '100'; // aumentado significativamente o z-index
        chartHeader.style.backgroundColor = '#fff'; // garante um background opaco
        chartHeader.style.boxShadow = '0 -5px 10px rgba(255,255,255,0.9)'; // efeito de sombra ascendente para "limpar" qualquer conteúdo acima
        chartHeader.style.borderBottom = '1px solid rgba(0,0,0,0.125)'; // reforçar a borda para definição visual
        
        chartHeader.innerHTML = `<h5 class="mb-0">Ciclo Anual de ${cultureData.tipo}</h5>`;
        chartSection.appendChild(chartHeader);
        
        // corpo do cartão
        const chartBody = document.createElement('div');
        chartBody.className = 'card-body pb-0'; // Sem padding inferior
        chartSection.appendChild(chartBody);
        
        // wrapper para o gráfico com altura dinâmica
        const chartWrapper = document.createElement('div');
        chartWrapper.className = 'chart-wrapper mb-3';
        // altura inicial calculada dinamicamente
        const initialHeight = calculateOptimalHeight();
        chartWrapper.style.height = `${initialHeight}px`;
        chartBody.appendChild(chartWrapper);
        
        // canvas para o gráfico
        const canvas = document.createElement('canvas');
        canvas.id = `${elementId}-canvas`; // ID único para o canvas
        chartWrapper.appendChild(canvas);
        
        // gera dados com base no tipo de cultura e ciclo
        const chartData = this._generateCultureChartData(cultureData);
        
        // cria gráfico com opções otimizadas para responsividade
        window.statsChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [
                    {
                        label: 'Desenvolvimento da Cultura (%)',
                        data: chartData.developmentData,
                        backgroundColor: CONFIG.CHART.COLORS.DEVELOPMENT.BACKGROUND,
                        borderColor: CONFIG.CHART.COLORS.DEVELOPMENT.BORDER,
                        borderWidth: 2,
                        tension: 0.4
                    },
                    {
                        label: 'Uso de Recursos (%)',
                        data: chartData.resourceUseData,
                        backgroundColor: CONFIG.CHART.COLORS.RESOURCES.BACKGROUND,
                        borderColor: CONFIG.CHART.COLORS.RESOURCES.BORDER,
                        borderWidth: 2,
                        tension: 0.4
                    },
                    {
                        label: `Produtividade (${chartData.productivityUnit})`,
                        data: chartData.productivityData,
                        backgroundColor: CONFIG.CHART.COLORS.PRODUCTIVITY.BACKGROUND,
                        borderColor: CONFIG.CHART.COLORS.PRODUCTIVITY.BORDER,
                        borderWidth: 2,
                        tension: 0.4,
                        type: 'bar'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                // melhor comportamento de redimensionamento com transição suave
                animation: {
                    duration: 250, // Transição mais rápida
                    easing: 'easeOutQuad'
                },
                // ajustes de layout para melhor uso de espaço
                layout: {
                    padding: {
                        top: 5,
                        right: 5,
                        bottom: 5,
                        left: 5
                    }
                },
                plugins: {
                    title: {
                        display: false, // removido, por existência no cabeçalho do card
                    },
                    subtitle: {
                        display: true,
                        text: chartData.subtitle,
                        padding: {
                            bottom: 10
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    },
                    legend: {
                        position: 'top',
                        // configurações otimizadas para economizar espaço
                        align: 'center',
                        labels: {
                            boxWidth: 12,
                            padding: 8,
                            font: {
                                size: 11 // fonte menor para economia de espaço
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Desenvolvimento/Recursos (%)'
                        }
                    },
                    y1: {
                        position: 'right',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: `Produtividade (${chartData.productivityUnit})`
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
        
        // footer do cartão com a legenda
        const chartFooter = document.createElement('div');
        chartFooter.className = 'card-footer p-0 legend-container'; // adicionando classe para facilitar seleção
        chartSection.appendChild(chartFooter);
        
        // usar grid do Bootstrap para layout responsivo da legenda
        const legendContainer = document.createElement('div');
        legendContainer.className = 'container-fluid px-2 py-2';
        chartFooter.appendChild(legendContainer);
        
        // título da legenda
        const legendTitle = document.createElement('div');
        legendTitle.className = 'row mb-1';
        legendTitle.innerHTML = '<div class="col-12"><h6 class="mb-1">Legenda do Gráfico</h6></div>';
        legendContainer.appendChild(legendTitle);
        
        // grid de itens da legenda
        const legendGrid = document.createElement('div');
        legendGrid.className = 'row g-1'; // Espaçamento mínimo
        legendContainer.appendChild(legendGrid);
        
        // itens da legenda
        const legendItems = [
            {
                title: 'Desenvolvimento da Cultura',
                color: CONFIG.CHART.COLORS.DEVELOPMENT.BORDER,
                description: 'Estágio de crescimento da cultura ao longo do ano.'
            },
            {
                title: 'Uso de Recursos',
                color: CONFIG.CHART.COLORS.RESOURCES.BORDER,
                description: 'Intensidade do uso de água, fertilizantes e outros insumos.'
            },
            {
                title: 'Produtividade',
                color: CONFIG.CHART.COLORS.PRODUCTIVITY.BORDER,
                description: 'Estimativa de produção por hectare no período de colheita.'
            }
        ];
        
        // renderização responsiva da legenda
        legendItems.forEach(item => {
            const itemCol = document.createElement('div');
            itemCol.className = 'col-12 col-sm-6 col-md-4'; // responsivo
            
            const itemContent = document.createElement('div');
            itemContent.className = 'd-flex align-items-start';
            
            const colorIndicator = document.createElement('span');
            colorIndicator.className = 'me-1 mt-1';
            colorIndicator.style.display = 'inline-block';
            colorIndicator.style.width = '10px';
            colorIndicator.style.height = '10px';
            colorIndicator.style.backgroundColor = item.color;
            colorIndicator.style.borderRadius = '2px';
            colorIndicator.style.flexShrink = '0';
            
            const textContent = document.createElement('div');
            textContent.innerHTML = `
                <div class="fw-semibold small">${item.title}</div>
                <div class="text-muted" style="font-size:0.7rem">${item.description}</div>
            `;
            
            itemContent.appendChild(colorIndicator);
            itemContent.appendChild(textContent);
            itemCol.appendChild(itemContent);
            legendGrid.appendChild(itemCol);
        });
        
        // função para ajustar o tamanho do gráfico baseado no espaço disponível
        const adjustChartSize = () => {
            // calcula altura disponível
            const viewportHeight = window.innerHeight;
            const chartSectionRect = chartSection.getBoundingClientRect();
            const headerHeight = chartHeader.offsetHeight;
            const footerHeight = chartFooter.offsetHeight;
            
            // distância do topo da janela
            const distanceFromTop = chartSectionRect.top;
            
            // adiciona mais margem para evitar scrollbar
            const additionalMargin = 50; // Aumentando a margem
            
            // espaço disponível com margem ajustada
            const availableHeight = viewportHeight - distanceFromTop - headerHeight - footerHeight - additionalMargin;
            
            // altura mínima para o gráfico
            const minHeight = 200;
            
            // altura ótima (sem comprometer legibilidade)
            const optimalHeight = Math.max(minHeight, Math.min(400, availableHeight));
            
            // aplica altura
            chartWrapper.style.height = `${optimalHeight}px`;
            
            // não define maxHeight fixa para o contêiner
            // chartSection.style.maxHeight = `${totalHeight}px`;
            
            // configura overflow como visible para evitar scrollbar
            chartSection.style.overflow = 'visible';
            
            // força redimensionamento do gráfico
            if (window.statsChart) {
                window.statsChart.resize();
            }
        };
        
        // aplica o ajuste após a renderização inicial
        const resizeObserver = new ResizeObserver(entries => {
            // chama adjustChartSize quando o tamanho muda
            adjustChartSize();
            
            // verifica se o gráfico está inicializado e o atualiza
            if (window.statsChart) {
                window.statsChart.resize();
            }
        });

        // monitora tanto o contêiner quanto o wrapper do gráfico
        resizeObserver.observe(container);
        resizeObserver.observe(chartSection);
        resizeObserver.observe(chartWrapper);

        // também, usa o evento de renderização do Chart.js
        if (window.statsChart) {
            window.statsChart.options.animation.onComplete = function() {
                // ajusta após a animação do gráfico terminar
                adjustChartSize();
            };
        }

        const observerCleanup = () => {
            resizeObserver.disconnect(); // IMPORTANTE desconectar para evitar memory leaks
        };

        // armazena a função para uso posterior
        if (!window.chartCleanupFunctions) {
            window.chartCleanupFunctions = {};
        }
        window.chartCleanupFunctions[`${elementId}_observer`] = observerCleanup;

        
        // adiciona listener para redimensionamento da janela
        const resizeListener = () => {
            adjustChartSize();
        };
        
        // registra o listener de redimensionamento
        window.addEventListener('resize', resizeListener);
        
        // registra evento para quando a tab é mostrada, pois isso pode afetar o layout
        document.querySelectorAll('#analysisTabs .nav-link').forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => {
                // verifica se a aba atual contém nosso gráfico
                if (e.target.getAttribute('href') === '#tab-stats') {
                    // pequeno delay para permitir que o DOM atualize
                    setTimeout(adjustChartSize, 50);
                }
            });
        });
        
        // adiciona uma classe de ajuste para CSS personalizado
        container.classList.add('stats-chart-container');
        
        // injeta regras CSS para melhor comportamento responsivo
        if (!document.getElementById('chart-utils-styles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'chart-utils-styles';
            // estilos CSS aprimorados para resolver problemas de sobreposição
            styleEl.textContent = `
                /* remover o título da seção para evitar duplicidade */
                #tab-stats > h1, #tab-stats > h2, #tab-stats > h3,
                #tab-stats > h4, #tab-stats > h5, #tab-stats > h6 {
                    display: none;
                }
                
                /* ajustes para o cabeçalho do cartão */
                .stats-chart-container .card-header {
                    position: relative;
                    z-index: 100; /* Z-index alto para garantir visibilidade */
                    background-color: #fff;
                    box-shadow: 0 -5px 10px rgba(255,255,255,0.9);
                }
                
                /* adicionar espaçamento superior ao container do gráfico */
                .stats-chart-container .chart-section {
                    margin-top: 3rem !important;
                }
                
                /* melhorar a transição ao redimensionar */
                .chart-wrapper {
                    transition: height 0.2s ease-out;
                }
                
                /* evitar que conteúdo adjacente sobreponha o cabeçalho */
                .tab-pane .card {
                    position: relative;
                    z-index: 1;
                }
                
                /* sobrepor qualquer cabeçalho fixo que possa existir */
                .tab-content {
                    position: relative;
                    z-index: 1;
                }
                
                /* ajustes para telas pequenas */
                @media (max-width: 768px) {
                    .stats-chart-container .chart-section {
                        margin-top: 4rem !important; /* Mais espaço em telas pequenas */
                    }
                    
                    .stats-chart-container .card-header {
                        padding: 0.75rem !important; /* Mais padding para facilitar a leitura */
                    }
                }
            `;

            document.head.appendChild(styleEl);
        }


        // limpa event listeners quando o componente for destruído ou o gráfico for alterado
        const cleanup = () => {
            window.removeEventListener('resize', resizeListener);
            
            // chama também a limpeza do observer se existir
            if (window.chartCleanupFunctions && window.chartCleanupFunctions[`${elementId}_observer`]) {
                window.chartCleanupFunctions[`${elementId}_observer`]();
            }
        };

        // guarda a função de limpeza para uso posterior
        if (!window.chartCleanupFunctions) {
            window.chartCleanupFunctions = {};
        }
        window.chartCleanupFunctions[elementId] = cleanup;
        
        // retorna o gráfico criado
        return window.statsChart;
    }

    /**
     * Gera dados para o gráfico com base no tipo e ciclo da cultura
     * @param {Object} cultureData - Dados da cultura
     * @returns {Object} Dados para o gráfico
     * @private
     **/
    static _generateCultureChartData(cultureData) {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        let developmentData = [];
        let resourceUseData = [];
        let productivityData = [];
        let subtitle = '';
        let productivityUnit = '';
        
        if (cultureData.tipo === CONFIG.CULTURE_TYPES.SOY.NAME) {
            // dados para soja
            developmentData = [0, 10, 40, 80, 100, 0, 0, 0, 10, 30, 60, 90]; // crescimento
            resourceUseData = [0, 5, 20, 30, 20, 0, 0, 0, 40, 60, 30, 10];   // uso de recursos
            productivityData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 65];        // produtividade em sacas/ha
            productivityUnit = 'sacas/ha';
            subtitle = `Variedade: ${cultureData.variedade || 'Convencional'}`;
        } else if (cultureData.tipo === CONFIG.CULTURE_TYPES.SUGARCANE.NAME) {
            // dados para cana-de-açúcar
            if (cultureData.ciclo === 'curto') {
                // ciclo curto: 8-10 meses
                developmentData = [0, 20, 40, 60, 80, 100, 0, 0, 0, 0, 0, 0];
                resourceUseData = [0, 60, 80, 50, 30, 10, 0, 0, 0, 0, 0, 0];
                productivityData = [0, 0, 0, 0, 0, 75, 0, 0, 0, 0, 0, 0];
                subtitle = `Ciclo ${cultureData.ciclo} (8-10 meses)`;
            } else if (cultureData.ciclo === 'longo') {
                // ciclo longo: 16-18 meses
                developmentData = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100];
                resourceUseData = [0, 40, 60, 70, 60, 50, 40, 30, 20, 10, 5, 0];
                productivityData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 95, 0];
                subtitle = `Ciclo ${cultureData.ciclo} (16-18 meses)`;
            } else {
                // ciclo médio: 12-14 meses (padrão)
                developmentData = [0, 15, 30, 45, 60, 75, 90, 100, 0, 0, 0, 0];
                resourceUseData = [0, 50, 70, 60, 40, 30, 20, 10, 0, 0, 0, 0];
                productivityData = [0, 0, 0, 0, 0, 0, 0, 85, 0, 0, 0, 0];
                subtitle = `Ciclo ${cultureData.ciclo} (12-14 meses)`;
            }
            productivityUnit = 'ton/ha';
        }
        
        return {
            labels: months,
            developmentData,
            resourceUseData,
            productivityData,
            subtitle,
            productivityUnit
        };
    }
}

