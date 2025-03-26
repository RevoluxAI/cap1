// Modificação do arquivo static/js/stats-enhancement.js

/**
 * Script para injeção direta das estatísticas no frontend
 */
(function() {
    // Função para processar JSON e extrair estatísticas
    function processJSONStats() {
        // Obter o elemento JSON
        const jsonElement = document.getElementById('json-data');
        if (!jsonElement || !jsonElement.textContent) return;
        
        try {
            // Tentar analisar o JSON
            const analysisData = JSON.parse(jsonElement.textContent);
            if (!analysisData || !analysisData.cultureInfo) return;
            
            // Verificar se temos estatísticas
            const culture = analysisData.cultureInfo;
            const hasStats = culture.estatisticas_formatadas || 
                            (culture.analise_estatistica && culture.analise_estatistica.input_summary);
            
            if (!hasStats) {
                console.log("Nenhuma estatística encontrada no JSON");
                // NOVO: Verificar se temos estatísticas avançadas em outro lugar
                if (analysisData.statisticalAnalysis) {
                    console.log("Usando análise estatística avançada");
                    return createStatsFromAdvancedAnalysis(analysisData.statisticalAnalysis);
                }
                // NOVO: Criar estatísticas básicas a partir de dados numéricos disponíveis
                return createBasicStats(analysisData);
            }
            
            // CORREÇÃO 1: Criar container para estatísticas avançadas FORA do container de estatísticas básicas
            // Em vez de buscar e adicionar dentro de culture-stats, vamos adicionar após o card existente
            let statsContainer = document.getElementById('stats-dashboard');
            if (!statsContainer) {
                // Buscar o container pai (a div row que contém os cards de estatísticas)
                const statsRow = document.querySelector('#tab-stats .row:first-child');
                if (!statsRow) return;
                
                // Criar uma nova linha para estatísticas detalhadas
                const newRow = document.createElement('div');
                newRow.className = 'row mt-4';
                
                // Criar uma coluna de largura total
                const newCol = document.createElement('div');
                newCol.className = 'col-12';
                newRow.appendChild(newCol);
                
                // Criar novo container para estatísticas avançadas
                statsContainer = document.createElement('div');
                statsContainer.id = 'stats-dashboard';
                newCol.appendChild(statsContainer);
                
                // Inserir a nova linha após a linha existente de estatísticas básicas
                statsRow.parentNode.insertBefore(newRow, statsRow.nextSibling);
            }
            
            // Extrair estatísticas
            const stats = culture.estatisticas_formatadas || 
                          (culture.analise_estatistica && culture.analise_estatistica.input_summary) || 
                          {};
            
            // Preparar HTML para estatísticas
            let statsHtml = `
                <div class="card">
                    <div class="card-header bg-primary text-white">
                        <h5 class="mb-0">Estatísticas Detalhadas</h5>
                    </div>
                    <div class="card-body">
                        <div class="accordion" id="statsAccordion">
            `;
            
            // Gerar conteúdo para cada campo com estatísticas
            let accordionIndex = 0;
            let hasDeviationStats = false;
            
            for (const [field, fieldStats] of Object.entries(stats)) {
                // Ignorar se não for um objeto ou se não tiver média e desvio padrão
                if (typeof fieldStats !== 'object' || 
                    (!fieldStats.media && !fieldStats.mean && 
                     !fieldStats.desvio_padrao && !fieldStats.std_dev)) continue;
                
                // Marcar que encontramos estatísticas com desvio
                hasDeviationStats = true;
                
                // Obter média e desvio padrão (podem estar em formatos diferentes)
                const mean = fieldStats.media || fieldStats.mean || 0;
                const stdDev = fieldStats.desvio_padrao || fieldStats.std_dev || 0;
                
                // Formatar nome do campo
                const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
                
                statsHtml += `
                    <div class="accordion-item">
                        <h2 class="accordion-header" id="heading-${accordionIndex}">
                            <button class="accordion-button ${accordionIndex > 0 ? 'collapsed' : ''}" type="button" 
                                    data-bs-toggle="collapse" data-bs-target="#collapse-${accordionIndex}" 
                                    aria-expanded="${accordionIndex === 0 ? 'true' : 'false'}" 
                                    aria-controls="collapse-${accordionIndex}">
                                Estatísticas: ${fieldName}
                            </button>
                        </h2>
                        <div id="collapse-${accordionIndex}" class="accordion-collapse collapse ${accordionIndex === 0 ? 'show' : ''}" 
                             aria-labelledby="heading-${accordionIndex}" data-bs-parent="#statsAccordion">
                            <div class="accordion-body">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Métrica</th>
                                            <th>Valor</th>
                                            <th>Descrição</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Média</td>
                                            <td>${mean}</td>
                                            <td>Média aritmética dos valores</td>
                                        </tr>
                                        <tr>
                                            <td>Desvio Padrão</td>
                                            <td>${stdDev}</td>
                                            <td>Medida de dispersão dos valores em relação à média</td>
                                        </tr>
                `;
                
                // Adicionar coeficiente de variação se disponível
                if (fieldStats.coeficiente_variacao || (mean && stdDev)) {
                    const cv = fieldStats.coeficiente_variacao || ((stdDev / mean) * 100).toFixed(2);
                    statsHtml += `
                        <tr>
                            <td>Coeficiente de Variação</td>
                            <td>${cv}%</td>
                            <td>Desvio padrão relativo à média, expresso em porcentagem</td>
                        </tr>
                    `;
                }
                
                // Adicionar outros campos disponíveis
                for (const [key, value] of Object.entries(fieldStats)) {
                    // Pular campos já adicionados ou que não são relevantes
                    if (['media', 'mean', 'desvio_padrao', 'std_dev', 'coeficiente_variacao'].includes(key)) 
                        continue;
                    
                    // Obter nome formatado da métrica
                    let metricName = key
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, l => l.toUpperCase());
                    
                    // Obter descrição básica
                    let description = getMetricDescription(key, culture.explicacoes_estatisticas);
                    
                    statsHtml += `
                        <tr>
                            <td>${metricName}</td>
                            <td>${value}</td>
                            <td>${description}</td>
                        </tr>
                    `;
                }
                
                statsHtml += `
                                    </tbody>
                                </table>
                                
                                <!-- Visualização do desvio padrão -->
                                ${renderDesvioVisualization(mean, stdDev)}
                            </div>
                        </div>
                    </div>
                `;
                
                accordionIndex++;
            }
            
            // Se não temos estatísticas com desvio, adicionamos uma mensagem informativa
            if (!hasDeviationStats) {
                statsHtml += `
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        Não foram encontradas estatísticas com cálculo de desvio padrão. 
                        As estatísticas básicas são exibidas abaixo.
                    </div>
                `;
                
                // Adicionamos estatísticas básicas
                for (const [field, value] of Object.entries(analysisData.stats || {})) {
                    if (typeof value !== 'number') continue;
                    
                    const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
                    
                    statsHtml += `
                        <div class="card mb-3">
                            <div class="card-header">
                                <h6 class="mb-0">${fieldName}</h6>
                            </div>
                            <div class="card-body">
                                <p class="h4 text-center">${value}</p>
                            </div>
                        </div>
                    `;
                }
            }
            
            statsHtml += `
                        </div>
                    </div>
                </div>
            `;
            
            // Adicionar ao container
            statsContainer.innerHTML = statsHtml;
            
            console.log("Estatísticas adicionadas à interface!");
            
        } catch (error) {
            console.error("Erro ao processar estatísticas:", error);
        }
    }


    /**
     * Obtém a descrição de uma métrica estatística
     * @param {string} key - Chave da métrica
     * @param {Object} explanations - Objeto com explicações disponíveis
     * @returns {string} Descrição da métrica
     */
    function getMetricDescription(key, explanations) {
        // Usar explicações fornecidas se disponíveis
        if (explanations && explanations[key]) {
            return explanations[key];
        }
        
        // Descrições padrão para métricas comuns
        const defaultDescriptions = {
            'minimo': 'Menor valor na amostra',
            'min': 'Menor valor na amostra',
            'maximo': 'Maior valor na amostra',
            'max': 'Maior valor na amostra',
            'mediana': 'Valor central da amostra ordenada',
            'median': 'Valor central da amostra ordenada',
            'q1': 'Primeiro quartil (25% dos dados)',
            'q3': 'Terceiro quartil (75% dos dados)',
            'n': 'Número de observações',
            'tamanho_amostra': 'Número de observações',
            'iqr': 'Intervalo interquartil (Q3-Q1)',
            'amplitude': 'Diferença entre valor máximo e mínimo',
            'range': 'Diferença entre valor máximo e mínimo',
            'variancia': 'Média dos quadrados das diferenças em relação à média',
            'variance': 'Média dos quadrados das diferenças em relação à média',
            'erro_padrao': 'Estimativa da variabilidade da média amostral',
            'std_error': 'Estimativa da variabilidade da média amostral',
            'intervalo_confianca': 'Intervalo onde a média populacional tem 95% de probabilidade de estar'
        };
        
        return defaultDescriptions[key] || 'Métrica estatística';
    }
    
    /**
     * Cria estatísticas básicas quando não houver dados disponíveis
     * @param {Object} analysisData - Dados completos da análise
     */
    function createBasicStats(analysisData) {
        // Obter dados numéricos básicos
        const numericFields = {};
        
        // Verificar na cultureInfo
        if (analysisData.cultureInfo) {
            ['area', 'espacamento', 'linhas_calculadas'].forEach(field => {
                if (typeof analysisData.cultureInfo[field] === 'number') {
                    numericFields[field] = analysisData.cultureInfo[field];
                }
            });
        }
        
        // Verificar nas stats
        if (analysisData.stats) {
            Object.entries(analysisData.stats).forEach(([key, value]) => {
                if (typeof value === 'number') {
                    numericFields[key] = value;
                }
            });
        }
        
        // Se não temos dados suficientes, retornar
        if (Object.keys(numericFields).length === 0) {
            console.log("Não foram encontrados dados numéricos para gerar estatísticas básicas");
            return;
        }
        
        // Criar container para estatísticas
        let statsContainer = document.getElementById('stats-dashboard');
        if (!statsContainer) {
            const cultureStatsContainer = document.getElementById('culture-stats');
            if (!cultureStatsContainer) return;
            
            statsContainer = document.createElement('div');
            statsContainer.id = 'stats-dashboard';
            statsContainer.className = 'mt-4';
            cultureStatsContainer.appendChild(statsContainer);
        }
        
        // Gerar HTML para estatísticas básicas
        let statsHtml = `
            <div class="card">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">Estatísticas Básicas</h5>
                </div>
                <div class="card-body">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        Estatísticas com cálculo de desvio padrão não estão disponíveis para esta cultura.
                        Abaixo estão as métricas básicas.
                    </div>
                    <div class="row">
        `;
        
        // Adicionar cada campo numérico
        Object.entries(numericFields).forEach(([field, value]) => {
            const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
            
            statsHtml += `
                <div class="col-md-4 mb-3">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="mb-0">${fieldName}</h6>
                        </div>
                        <div class="card-body d-flex align-items-center justify-content-center">
                            <p class="h3 mb-0">${value}</p>
                        </div>
                    </div>
                </div>
            `;
        });
        
        statsHtml += `
                    </div>
                </div>
            </div>
        `;
        
        // Atualizar container
        statsContainer.innerHTML = statsHtml;
        console.log("Estatísticas básicas adicionadas à interface");
    }
    
    /**
     * Cria estatísticas a partir de análise estatística avançada
     * @param {Object} statisticalAnalysis - Dados de análise estatística avançada
     */
    function createStatsFromAdvancedAnalysis(statisticalAnalysis) {
        // Verificar se temos dados de análise
        if (!statisticalAnalysis || typeof statisticalAnalysis !== 'object') {
            console.log("Dados de análise estatística avançada inválidos");
            return;
        }
        
        // Criar container para estatísticas
        let statsContainer = document.getElementById('stats-dashboard');
        if (!statsContainer) {
            const cultureStatsContainer = document.getElementById('culture-stats');
            if (!cultureStatsContainer) return;
            
            statsContainer = document.createElement('div');
            statsContainer.id = 'stats-dashboard';
            statsContainer.className = 'mt-4';
            cultureStatsContainer.appendChild(statsContainer);
        }
        
        // Gerar HTML para análise estatística avançada
        let statsHtml = `
            <div class="card">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">Análise Estatística Avançada</h5>
                </div>
                <div class="card-body">
        `;
        
        // Verificar se temos dados numéricos
        if (statisticalAnalysis.numeric) {
            statsHtml += `
                <h6 class="mb-3">Estatísticas para Campos Numéricos</h6>
                <div class="accordion" id="numericAccordion">
            `;
            
            let accordionIndex = 0;
            
            for (const [field, stats] of Object.entries(statisticalAnalysis.numeric)) {
                // Ignorar se não for um objeto ou se não tiver dados básicos
                if (typeof stats !== 'object' || !stats.mean) continue;
                
                // Formatar nome do campo
                const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
                
                statsHtml += `
                    <div class="accordion-item">
                        <h2 class="accordion-header" id="num-heading-${accordionIndex}">
                            <button class="accordion-button ${accordionIndex > 0 ? 'collapsed' : ''}" type="button" 
                                    data-bs-toggle="collapse" data-bs-target="#num-collapse-${accordionIndex}" 
                                    aria-expanded="${accordionIndex === 0 ? 'true' : 'false'}" 
                                    aria-controls="num-collapse-${accordionIndex}">
                                ${fieldName}
                            </button>
                        </h2>
                        <div id="num-collapse-${accordionIndex}" class="accordion-collapse collapse ${accordionIndex === 0 ? 'show' : ''}" 
                             aria-labelledby="num-heading-${accordionIndex}" data-bs-parent="#numericAccordion">
                            <div class="accordion-body">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Métrica</th>
                                            <th>Valor</th>
                                            <th>Descrição</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                `;
                
                // Adicionar cada métrica estatística
                const metricsToShow = [
                    ['mean', 'Média', 'Média aritmética dos valores'],
                    ['median', 'Mediana', 'Valor central da amostra ordenada'],
                    ['std_dev', 'Desvio Padrão', 'Medida de dispersão dos valores em relação à média'],
                    ['coefficient_of_variation', 'Coeficiente de Variação', 'Desvio padrão relativo à média, em porcentagem'],
                    ['min', 'Mínimo', 'Menor valor na amostra'],
                    ['max', 'Máximo', 'Maior valor na amostra'],
                    ['range', 'Amplitude', 'Diferença entre valor máximo e mínimo'],
                    ['q1', 'Primeiro Quartil', '25% dos dados estão abaixo deste valor'],
                    ['q3', 'Terceiro Quartil', '75% dos dados estão abaixo deste valor'],
                    ['iqr', 'Intervalo Interquartil', 'Diferença entre Q3 e Q1']
                ];
                
                metricsToShow.forEach(([key, name, description]) => {
                    if (stats[key] !== undefined) {
                        let value = stats[key];
                        
                        // Formatar valor percentual se for coeficiente de variação
                        if (key === 'coefficient_of_variation') {
                            value = `${value.toFixed(2)}%`;
                        }
                        // Formatar outros valores numéricos
                        else if (typeof value === 'number') {
                            value = value.toFixed(2);
                        }
                        
                        statsHtml += `
                            <tr>
                                <td>${name}</td>
                                <td>${value}</td>
                                <td>${description}</td>
                            </tr>
                        `;
                    }
                });
                
                statsHtml += `
                                    </tbody>
                                </table>
                                
                                <!-- Visualização do desvio padrão -->
                                ${renderDesvioVisualization(stats.mean, stats.std_dev)}
                            </div>
                        </div>
                    </div>
                `;
                
                accordionIndex++;
            }
            
            statsHtml += `</div>`;  // Fecha accordion
        }
        
        // Verificar se temos dados categóricos
        if (statisticalAnalysis.categorical) {
            statsHtml += `
                <h6 class="mb-3 mt-4">Estatísticas para Campos Categóricos</h6>
                <div class="row">
            `;
            
            for (const [field, counts] of Object.entries(statisticalAnalysis.categorical)) {
                // Ignorar se não for um objeto
                if (typeof counts !== 'object') continue;
                
                // Formatar nome do campo
                const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
                
                statsHtml += `
                    <div class="col-md-6 mb-3">
                        <div class="card h-100">
                            <div class="card-header">
                                <h6 class="mb-0">${fieldName}</h6>
                            </div>
                            <div class="card-body">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Categoria</th>
                                            <th>Quantidade</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                `;
                
                // Adicionar cada categoria
                Object.entries(counts).forEach(([category, count]) => {
                    statsHtml += `
                        <tr>
                            <td>${category}</td>
                            <td>${count}</td>
                        </tr>
                    `;
                });
                
                statsHtml += `
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            statsHtml += `</div>`;  // Fecha row
        }
        
        // Adicionar informações gerais
        if (statisticalAnalysis.sample_size) {
            statsHtml += `
                <div class="alert alert-info mt-3">
                    <i class="fas fa-info-circle me-2"></i>
                    Tamanho da amostra: <strong>${statisticalAnalysis.sample_size}</strong>
                </div>
            `;
        }
        
        statsHtml += `
                </div>
            </div>
        `;
        
        // Atualizar container
        statsContainer.innerHTML = statsHtml;
        console.log("Análise estatística avançada adicionada à interface");
    }
    
    // Função para renderizar visualização do desvio padrão
    function renderDesvioVisualization(mean, stdDev) {
        if (!mean || !stdDev || stdDev === 0) return '';
        
        // Calcular limites para visualização (média ± 2 desvios padrão)
        const min = mean - 2 * stdDev;
        const max = mean + 2 * stdDev;
        
        // Ajuste para visualizar corretamente
        const range = max - min;
        const width1SD = (stdDev / range * 100).toFixed(2);
        const mediaPos = ((mean - min) / range * 100).toFixed(2);
        
        return `
            <div class="mt-4">
                <h6 class="mb-3">Visualização do Desvio Padrão</h6>
                <div class="position-relative rounded" style="height: 30px; background-color: #f0f0f0; overflow: hidden;">
                    <!-- Faixa de 2 desvios padrão (95% dos dados) -->
                    <div class="position-absolute top-0 h-100" 
                         style="left: 0; width: 100%; background-color: rgba(0, 123, 255, 0.1);"></div>
                    
                    <!-- Faixa de 1 desvio padrão (68% dos dados) -->
                    <div class="position-absolute top-0 h-100" 
                         style="left: calc(${mediaPos}% - ${width1SD}%); width: ${width1SD * 2}%; background-color: rgba(0, 123, 255, 0.3);"></div>
                    
                    <!-- Marcador para a média -->
                    <div class="position-absolute top-0 h-100" 
                         style="left: ${mediaPos}%; width: 2px; background-color: #dc3545;"></div>
                </div>
                
                <div class="d-flex justify-content-between mt-1">
                    <small>-2σ (${(mean - 2 * stdDev).toFixed(2)})</small>
                    <small>-1σ (${(mean - stdDev).toFixed(2)})</small>
                    <small class="text-danger">μ (${mean.toFixed(2)})</small>
                    <small>+1σ (${(mean + stdDev).toFixed(2)})</small>
                    <small>+2σ (${(mean + 2 * stdDev).toFixed(2)})</small>
                </div>
                
                <div class="mt-2 small">
                    <p class="mb-1"><strong>Interpretação:</strong></p>
                    <ul class="ps-3">
                        <li>A linha vermelha vertical representa a média (μ)</li>
                        <li>A faixa azul clara interna representa ±1 desvio padrão (σ) da média (68% dos dados)</li>
                        <li>A faixa azul mais clara externa representa ±2 desvios padrão da média (95% dos dados)</li>
                    </ul>
                </div>
            </div>
        `;
    }
    
    // Adicionar evento para executar quando os dados mudarem
    function setupObserver() {
        // Observar mudanças na aba de JSON
        const jsonTab = document.getElementById('tab-json');
        if (jsonTab) {
            // Observar mudanças na aba ativa
            const tabsLinks = document.querySelectorAll('#analysisTabs .nav-link');
            tabsLinks.forEach(tab => {
                tab.addEventListener('shown.bs.tab', function(event) {
                    if (event.target.getAttribute('href') === '#tab-stats') {
                        // Processar estatísticas quando a aba de estatísticas é aberta
                        setTimeout(processJSONStats, 100);
                    }
                });
            });
            
            // Processar também ao carregar a página
            setTimeout(processJSONStats, 500);




            // Se realmente precisarmos do botão de atualização, podemos adicioná-lo em um lugar mais apropriado
            // Por exemplo, dentro do card de estatísticas detalhadas, alinhado à direita do título
            document.addEventListener('stats:rendered', function() {
                const statsCardHeader = document.querySelector('#stats-dashboard .card-header');
                if (statsCardHeader && !document.getElementById('refresh-stats-btn')) {
                    // Transformar o header em um container flex para alinhar elementos
                    statsCardHeader.style.display = 'flex';
                    statsCardHeader.style.justifyContent = 'space-between';
                    statsCardHeader.style.alignItems = 'center';
                    
                    // Criar botão com estilo apropriado
                    const refreshButton = document.createElement('button');
                    refreshButton.id = 'refresh-stats-btn';
                    refreshButton.className = 'btn btn-sm btn-light';
                    refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i>';
                    refreshButton.title = 'Atualizar estatísticas';
                    refreshButton.addEventListener('click', processJSONStats);
                    
                    // Adicionar ao header do card
                    statsCardHeader.appendChild(refreshButton);
                }
            });
            
            // Disparar evento quando as estatísticas são renderizadas
            const originalProcessJSONStats = processJSONStats;
            window.processJSONStats = function() {
                originalProcessJSONStats();
                // Disparar evento após renderização
                document.dispatchEvent(new CustomEvent('stats:rendered'));
            };
        }
    }
    
    // Configurar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupObserver);
    } else {
        setupObserver();
    }
    
    // Adicionar aos objetos globais
    window.processJSONStats = processJSONStats;
})();

