// FarmTech Solutions - Aplicativo Frontend
// Integração com API e manipulação da interface

// Configuração
const API_BASE_URL = 'http://localhost:5000/api';
let currentCultureId = null;
let analysisData = null;

// ======= Inicialização =======
document.addEventListener('DOMContentLoaded', () => {
    // Configurar navegação
    setupNavigation();
    
    // Configurar manipuladores de eventos
    setupEventHandlers();
    
    // Carregar lista de culturas
    loadCultures();
});

// ======= Configuração de Navegação =======
function setupNavigation() {
    // Navegação principal
    document.getElementById('nav-cultures').addEventListener('click', (e) => {
        e.preventDefault();
        showView('cultures-view');
    });
    
    document.getElementById('nav-analysis').addEventListener('click', (e) => {
        e.preventDefault();
        showView('analysis-view');
    });
    
    document.getElementById('nav-about').addEventListener('click', (e) => {
        e.preventDefault();
        showView('about-view');
    });
}

// ======= Configuração de Eventos =======
function setupEventHandlers() {
    // Botão Nova Cultura
    document.getElementById('btn-new-culture').addEventListener('click', () => {
        showCultureForm();
    });
    
    // Botão Cancelar Formulário
    document.getElementById('btn-cancel-form').addEventListener('click', () => {
        hideCultureForm();
    });
    
    // Alteração no tipo de cultura
    document.getElementById('culture-type').addEventListener('change', (e) => {
        toggleCultureSpecificFields(e.target.value);
    });
    
    // Submissão do formulário
    document.getElementById('culture-data-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveCulture();
    });
    
    // Botão Copiar JSON
    document.getElementById('btn-copy-json').addEventListener('click', () => {
        const jsonText = document.getElementById('json-data').textContent;
        navigator.clipboard.writeText(jsonText)
            .then(() => showAlert('JSON copiado para a área de transferência', 'success'))
            .catch(err => showAlert('Erro ao copiar: ' + err, 'danger'));
    });
}

// ======= Funções de Interface =======
function showView(viewId) {
    // Ocultar todas as views
    document.getElementById('cultures-view').style.display = 'none';
    document.getElementById('analysis-view').style.display = 'none';
    document.getElementById('about-view').style.display = 'none';
    
    // Exibir a view solicitada
    document.getElementById(viewId).style.display = 'block';
    
    // Atualizar navegação
    const navItems = document.querySelectorAll('.nav-link');
    navItems.forEach(item => item.classList.remove('active'));
    
    if (viewId === 'cultures-view') {
        document.getElementById('nav-cultures').classList.add('active');
    } else if (viewId === 'analysis-view') {
        document.getElementById('nav-analysis').classList.add('active');
    } else if (viewId === 'about-view') {
        document.getElementById('nav-about').classList.add('active');
    }
}

function showAlert(message, type = 'info', duration = 5000) {
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

function showLoading(containerId, message = 'Carregando...') {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Carregando...</span>
            </div>
            <p class="mt-2">${message}</p>
        </div>
    `;
}

function showCultureForm(cultureData = null) {
    const formEl = document.getElementById('culture-form');
    const formTitle = document.getElementById('form-title');
    const cultureIdEl = document.getElementById('culture-id');
    
    if (cultureData) {
        // Modo edição
        formTitle.textContent = 'Editar Cultura';
        cultureIdEl.value = cultureData.id;
        
        // Preencher campos
        document.getElementById('culture-type').value = cultureData.type_id;
        document.getElementById('culture-area').value = cultureData.area;
        document.getElementById('culture-espacamento').value = cultureData.espacamento;
        document.getElementById('culture-irrigation').checked = cultureData.irrigacao;
        
        // Campos específicos
        toggleCultureSpecificFields(cultureData.type_id);
        
        if (cultureData.tipo === 'Soja') {
            document.getElementById('soja-variedade').value = cultureData.variedade || 'convencional';
        } else if (cultureData.tipo === 'Cana-de-Açúcar') {
            document.getElementById('cana-ciclo').value = cultureData.ciclo || 'médio';
        }
    } else {
        // Modo nova cultura
        formTitle.textContent = 'Nova Cultura';
        cultureIdEl.value = '';
        document.getElementById('culture-data-form').reset();
        document.getElementById('soja-fields').style.display = 'none';
        document.getElementById('cana-fields').style.display = 'none';
    }
    
    formEl.style.display = 'block';
}

function hideCultureForm() {
    document.getElementById('culture-form').style.display = 'none';
}

function toggleCultureSpecificFields(typeId) {
    const sojaFields = document.getElementById('soja-fields');
    const canaFields = document.getElementById('cana-fields');
    
    sojaFields.style.display = 'none';
    canaFields.style.display = 'none';
    
    if (typeId === '1') {
        sojaFields.style.display = 'block';
    } else if (typeId === '2') {
        canaFields.style.display = 'block';
    }
}

// ======= API Calls =======
async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Erro na requisição');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        showAlert(`Erro na API: ${error.message}`, 'danger');
        throw error;
    }
}

async function loadCultures() {
    showLoading('cultures-list', 'Carregando culturas...');
    
    try {
        const result = await fetchAPI('/cultures');
        
        if (result.status === 'success') {
            renderCulturesList(result.data);
        } else {
            document.getElementById('cultures-list').innerHTML = `
                <div class="col-12 text-center py-4">
                    <div class="alert alert-warning">
                        ${result.message || 'Nenhuma cultura encontrada'}
                    </div>
                </div>
            `;
        }
    } catch (error) {
        document.getElementById('cultures-list').innerHTML = `
            <div class="col-12 text-center py-4">
                <div class="alert alert-danger">
                    Erro ao carregar culturas: ${error.message}
                </div>
            </div>
        `;
    }
}

async function saveCulture() {
    const cultureId = document.getElementById('culture-id').value;
    const cultureType = document.getElementById('culture-type').value;
    
    // Construir dados do formulário
    const formData = {
        culture_type: cultureType,
        area: document.getElementById('culture-area').value,
        espacamento: document.getElementById('culture-espacamento').value,
        irrigacao: document.getElementById('culture-irrigation').checked
    };
    
    // Adicionar campos específicos por tipo
    if (cultureType === '1') { // Soja
        formData.variedade = document.getElementById('soja-variedade').value;
    } else if (cultureType === '2') { // Cana
        formData.ciclo = document.getElementById('cana-ciclo').value;
    }
    
    try {
        let result;
        
        if (cultureId) {
            // Atualizar cultura existente
            result = await fetchAPI(`/cultures/${cultureId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
        } else {
            // Criar nova cultura
            result = await fetchAPI('/cultures', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
        }
        
        if (result.status === 'success') {
            showAlert(result.message, 'success');
            hideCultureForm();
            loadCultures();
            
            // Mostrar recomendações se for cana-de-açúcar
            if (cultureType === '2' && result.recommendations) {
                showSugarcaneRecommendations(result.recommendations);
            }
        } else {
            showAlert(result.message, 'warning');
        }
    } catch (error) {
        showAlert(`Erro ao salvar cultura: ${error.message}`, 'danger');
    }
}

async function deleteCulture(cultureId) {
    if (!confirm('Tem certeza que deseja excluir esta cultura?')) {
        return;
    }
    
    try {
        const result = await fetchAPI(`/cultures/${cultureId}`, {
            method: 'DELETE'
        });
        
        if (result.status === 'success') {
            showAlert(result.message, 'success');
            loadCultures();
            
            // Se a cultura excluída estava sendo visualizada na análise, limpar
            if (currentCultureId === cultureId) {
                clearAnalysisView();
            }
        } else {
            showAlert(result.message, 'warning');
        }
    } catch (error) {
        showAlert(`Erro ao excluir cultura: ${error.message}`, 'danger');
    }
}

async function loadCultureAnalysis(cultureId) {
    showView('analysis-view');
    
    document.getElementById('analysis-select-prompt').style.display = 'block';
    document.getElementById('analysis-content').style.display = 'none';
    
    showLoading('analysis-select-prompt', 'Carregando análise...');
    
    try {
        const result = await fetchAPI(`/cultures/${cultureId}/weather-analysis`);
        
        if (result.status === 'success') {
            // Salvar dados para uso em gráficos
            analysisData = result.data;
            currentCultureId = cultureId;
            
            // Renderizar a análise
            renderAnalysis(result.data);
            
            document.getElementById('analysis-select-prompt').style.display = 'none';
            document.getElementById('analysis-content').style.display = 'block';
        } else {
            document.getElementById('analysis-select-prompt').innerHTML = `
                <div class="alert alert-warning">
                    ${result.message || 'Não foi possível carregar a análise'}
                </div>
            `;
        }
    } catch (error) {
        document.getElementById('analysis-select-prompt').innerHTML = `
            <div class="alert alert-danger">
                Erro ao carregar análise: ${error.message}
            </div>
        `;
    }
}

// ======= Renderização da Interface =======
function renderCulturesList(cultures) {
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
    
    let html = '';
    
    cultures.forEach((culture, index) => {
        const cultureType = culture.tipo || 'Desconhecida';
        const area = culture.area || 0;
        const irrigation = culture.irrigacao ? 
            '<span class="badge bg-info text-dark"><i class="fas fa-tint me-1"></i>Irrigada</span>' : '';
        
        let specificInfo = '';
        let recommendationBadge = '';
        
        if (cultureType === 'Soja') {
            specificInfo = `<div class="mb-2">Variedade: ${culture.variedade || 'Convencional'}</div>`;
        } else if (cultureType === 'Cana-de-Açúcar') {
            specificInfo = `<div class="mb-2">Ciclo: ${culture.ciclo || 'Médio'}</div>`;
            
            // Adicionar indicadores visuais conforme recomendações
            if (culture.recomendacoes) {
                const espacamento = culture.recomendacoes.espacamento;
                const area = culture.recomendacoes.area;
                
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
        
        html += `
            <div class="col-md-4">
                <div class="card culture-card h-100">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">${cultureType}</h5>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                Ações
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><a class="dropdown-item" href="#" onclick="loadCultureAnalysis(${index})">
                                    <i class="fas fa-chart-line me-2"></i>Analisar
                                </a></li>
                                <li><a class="dropdown-item" href="#" onclick="editCulture(${index})">
                                    <i class="fas fa-edit me-2"></i>Editar
                                </a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="deleteCulture(${index})">
                                    <i class="fas fa-trash-alt me-2"></i>Excluir
                                </a></li>
                            </ul>
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
}

function renderAnalysis(data) {
    if (!data) return;
    
    const culture = data.cultura_info;
    const recommendations = data.recommendations && data.recommendations.data ? data.recommendations.data : null;
    const weather = data.weather_data;
    const sugarcaneRecommendations = data.sugarcane_recommendations;
    
    // Atualizar cabeçalho
    document.getElementById('analysis-culture-title').textContent = `Análise da Cultura #${data.cultura_id}`;
    document.getElementById('analysis-culture-type').textContent = culture.tipo;
    document.getElementById('analysis-culture-area').textContent = `${culture.area} hectares`;
    
    // Renderizar JSON
    document.getElementById('json-data').textContent = JSON.stringify(data, null, 2);
    
    // Renderizar recomendações específicas para cana-de-açúcar
    if (culture.tipo === 'Cana-de-Açúcar' && sugarcaneRecommendations) {
        renderSugarcaneRecommendations(sugarcaneRecommendations, culture);
    }
    
    // Renderizar recomendações se disponíveis
    if (recommendations) {
        renderRecommendations(recommendations);
    } else {
        document.getElementById('recommendation-summary').innerHTML = '<div class="alert alert-warning">Nenhuma recomendação disponível</div>';
        document.getElementById('basic-recommendations').innerHTML = '';
        document.getElementById('specific-recommendations').innerHTML = '';
        document.getElementById('inputs-recommendations').innerHTML = '';
    }
    
    // Renderizar informações meteorológicas se disponíveis
    if (weather) {
        renderWeatherInfo(weather);
        renderWeatherChart(weather);
    } else {
        document.getElementById('current-weather').innerHTML = '<div class="alert alert-warning">Nenhum dado meteorológico disponível</div>';
        document.getElementById('weather-impact').innerHTML = '';
    }
    
    // Renderizar estatísticas e gráficos
    renderCultureStats(data);
    
    // SOLUÇÃO MELHORADA: Usar a API do Bootstrap diretamente
    // Primeiro, destrua quaisquer instâncias de abas já inicializadas
    document.querySelectorAll('#analysisTabs .nav-link').forEach(tabEl => {
        const tabInstance = bootstrap.Tab.getInstance(tabEl);
        if (tabInstance) {
            tabInstance.dispose();
        }
    });
    
    // Inicialize as abas usando a API do Bootstrap
    document.querySelectorAll('#analysisTabs .nav-link').forEach(tabEl => {
        // Adicione eventos para garantir comportamento correto
        tabEl.addEventListener('click', function(e) {
            e.preventDefault();
            const tab = new bootstrap.Tab(this);
            tab.show();
        });
    });
    
    // Ative a aba de recomendações programaticamente
    const recommendationsTab = document.querySelector('#analysisTabs .nav-link[href="#tab-recommendations"]');
    if (recommendationsTab) {
        const tab = new bootstrap.Tab(recommendationsTab);
        tab.show();
    }
}

function renderSugarcaneRecommendations(recommendations, culture) {
    // Verificar se section já existe, caso não, criar
    let sugarcaneSectionEl = document.getElementById('sugarcane-recommendations-section');
    if (!sugarcaneSectionEl) {
        const recommendationsContainer = document.getElementById('tab-recommendations');
        
        // Criar seção para recomendações de cana-de-açúcar
        sugarcaneSectionEl = document.createElement('div');
        sugarcaneSectionEl.id = 'sugarcane-recommendations-section';
        sugarcaneSectionEl.className = 'card mb-4';
        
        // Adicionar depois do resumo da análise
        const summaryEl = document.getElementById('recommendation-summary').parentElement.parentElement;
        summaryEl.parentNode.insertBefore(sugarcaneSectionEl, summaryEl.nextSibling);
    }
    
    // Criar HTML para recomendações detalhadas
    let html = `
        <div class="card-header bg-primary text-white">
            <h5 class="mb-0">Recomendações para Cana-de-Açúcar (Ciclo ${culture.ciclo})</h5>
        </div>
        <div class="card-body">
    `;
    
    // Adicionar informações do ciclo
    html += `
        <div class="alert alert-info">
            <strong>Informações do Ciclo:</strong> ${recommendations.ciclo_info.duracao} - ${recommendations.ciclo_info.descricao}
        </div>
    `;
    
    // Grid para parâmetros
    html += `<div class="row">`;
    
    // Coluna para espaçamento
    html += `
        <div class="col-md-6">
            <div class="card mb-3">
                <div class="card-header">
                    <h6 class="mb-0">Espaçamento entre Linhas</h6>
                </div>
                <div class="card-body">
                    <div class="progress mb-3" style="height: 20px;">
                        <div class="progress-bar ${getStatusClass(recommendations.espacamento.status)}" 
                             style="width: ${getProgressWidth(culture.espacamento, recommendations.espacamento.recomendado)}%">
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
    
    // Coluna para área
    html += `
        <div class="col-md-6">
            <div class="card mb-3">
                <div class="card-header">
                    <h6 class="mb-0">Área de Cultivo</h6>
                </div>
                <div class="card-body">
                    <div class="progress mb-3" style="height: 20px;">
                        <div class="progress-bar ${getStatusClass(recommendations.area.status)}" 
                             style="width: ${getAreaProgressWidth(culture.area, recommendations.area.recomendado)}%">
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
    
    html += `</div>`; // Fim da row
    
    // Informações sobre irrigação
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
                
                <h6>Recomendações para Este Ciclo:</h6>
                <div class="row">
                    <div class="col-md-6">
                        <ul class="list-group">
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Sistema
                                <span class="badge bg-primary rounded-pill">${recommendations.irrigacao.sistema}</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Frequência
                                <span class="badge bg-primary rounded-pill">${recommendations.irrigacao.frequencia}</span>
                            </li>
                        </ul>
                    </div>
                    <div class="col-md-6">
                        <ul class="list-group">
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Volume
                                <span class="badge bg-primary rounded-pill">${recommendations.irrigacao.volume}</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Eficiência
                                <span class="badge bg-primary rounded-pill">${recommendations.irrigacao.eficiencia}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    html += `</div>`; // Fim do card-body
    
    // Atualizar conteúdo da seção
    sugarcaneSectionEl.innerHTML = html;
}

// Funções auxiliares para a barra de progresso
function getStatusClass(status) {
    switch(status) {
        case 'adequado':
        case 'adequada':
            return 'bg-success';
        case 'abaixo':
            return 'bg-warning';
        case 'acima':
            return 'bg-info';
        default:
            return 'bg-primary';
    }
}

function getProgressWidth(value, recommended) {
    // Calcula a posição na escala em porcentagem
    if (value < recommended.min) {
        return (value / recommended.min) * 33; // Menos de 33% para valores abaixo do mínimo
    } else if (value > recommended.max) {
        const excess = value - recommended.max;
        const range = recommended.max - recommended.min;
        return 66 + Math.min((excess / range) * 34, 34); // Entre 66% e 100% para valores acima do máximo
    } else {
        // Valor dentro do intervalo recomendado
        const position = (value - recommended.min) / (recommended.max - recommended.min);
        return 33 + position * 33; // Entre 33% e 66% para valores no intervalo
    }
}

function getAreaProgressWidth(value, recommended) {
    // Calcula a posição na escala em porcentagem para área
    // Diferente do espaçamento porque pode não ter limite máximo
    if (value < recommended.min) {
        return (value / recommended.min) * 33; // Menos de 33% para valores abaixo do mínimo
    } else if (recommended.max && value > recommended.max) {
        const excess = value - recommended.max;
        const range = recommended.max - recommended.min;
        return 66 + Math.min((excess / range) * 34, 34); // Entre 66% e 100% para valores acima do máximo
    } else {
        // Valor dentro do intervalo recomendado ou acima do mínimo quando não há máximo
        if (recommended.max) {
            const position = (value - recommended.min) / (recommended.max - recommended.min);
            return 33 + position * 33; // Entre 33% e 66% para valores no intervalo
        } else {
            // Se não tem máximo, usar o dobro do mínimo como referência
            const position = Math.min((value - recommended.min) / recommended.min, 1);
            return 33 + position * 33; // Entre 33% e 66% para valores acima do mínimo
        }
    }
}

// Função para mostrar recomendações quando cria uma nova cultura de cana
function showSugarcaneRecommendations(recommendations) {
    // Criar modal para exibir recomendações
    const modalHtml = `
        <div class="modal fade" id="sugarcaneRecommendationsModal" tabindex="-1" aria-labelledby="modalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title" id="modalLabel">Recomendações para Cana-de-Açúcar</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fechar"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <strong>Informações do Ciclo:</strong> ${recommendations.ciclo_info.duracao} - ${recommendations.ciclo_info.descricao}
                        </div>
                        
                        <div class="row mb-4">
                            <div class="col-md-6">
                                <div class="card h-100">
                                    <div class="card-header">
                                        <h6 class="mb-0">Status do Espaçamento</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="alert alert-${getAlertType(recommendations.espacamento.status)}">
                                            ${recommendations.espacamento.mensagem}
                                        </div>
                                        <div class="text-muted">
                                            Recomendado: ${recommendations.espacamento.recomendado.min}-${recommendations.espacamento.recomendado.max} m 
                                            (ideal: ${recommendations.espacamento.recomendado.ideal} m)
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card h-100">
                                    <div class="card-header">
                                        <h6 class="mb-0">Status da Área</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="alert alert-${getAlertType(recommendations.area.status)}">
                                            ${recommendations.area.mensagem}
                                        </div>
                                        <div class="text-muted">
                                            Recomendado: ${recommendations.area.recomendado.min} ha ${recommendations.area.recomendado.max ? '- ' + recommendations.area.recomendado.max + ' ha' : 'ou mais'} 
                                            (ideal: ${recommendations.area.recomendado.ideal} ha)
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">Sistema de Irrigação</h6>
                            </div>
                            <div class="card-body">
                                <div class="alert alert-${recommendations.irrigacao.ativa ? 'success' : 'warning'}">
                                    ${recommendations.irrigacao.mensagem}
                                </div>
                                
                                <h6>Recomendações para Este Ciclo:</h6>
                                <div class="row">
                                    <div class="col-md-6">
                                        <ul class="list-group">
                                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                                Sistema
                                                <span class="badge bg-primary rounded-pill">${recommendations.irrigacao.sistema}</span>
                                            </li>
                                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                                Frequência
                                                <span class="badge bg-primary rounded-pill">${recommendations.irrigacao.frequencia}</span>
                                            </li>
                                        </ul>
                                    </div>
                                    <div class="col-md-6">
                                        <ul class="list-group">
                                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                                Volume
                                                <span class="badge bg-primary rounded-pill">${recommendations.irrigacao.volume}</span>
                                            </li>
                                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                                Eficiência
                                                <span class="badge bg-primary rounded-pill">${recommendations.irrigacao.eficiencia}</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal existente, se houver
    const existingModal = document.getElementById('sugarcaneRecommendationsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Adicionar o modal ao DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Exibir o modal
    const modal = new bootstrap.Modal(document.getElementById('sugarcaneRecommendationsModal'));
    modal.show();
}

function getAlertType(status) {
    switch(status) {
        case 'adequado':
        case 'adequada':
            return 'success';
        case 'abaixo':
            return 'warning';
        case 'acima':
            return 'info';
        default:
            return 'primary';
    }
}

// FUNÇÃO ATUALIZADA PARA MOSTRAR MAIS INFORMAÇÕES DAS RECOMENDAÇÕES
function renderRecommendations(recommendations) {
    if (!recommendations || !recommendations.summary) {
        return;
    }
    
    // Resumo
    const summary = recommendations.summary;
    let summaryHtml = `
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
    
    document.getElementById('recommendation-summary').innerHTML = summaryHtml;
    
    // Recomendações básicas
    const basic = recommendations.basic;
    if (basic) {
        let basicHtml = `
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
        
        document.getElementById('basic-recommendations').innerHTML = basicHtml;
    }
    
    // Recomendações específicas
    const specific = recommendations.specific;
    if (specific) {
        let specificHtml = '<ul class="list-group">';
        
        if (specific.pest_management) {
            specificHtml += `
                <li class="list-group-item">
                    <div class="fw-bold"><i class="fas fa-bug me-2"></i>Manejo de Pragas</div>
                    <p class="mb-0">${specific.pest_management}</p>
                </li>
            `;
        }
        
        if (specific.variety_specific) {
            specificHtml += `
                <li class="list-group-item">
                    <div class="fw-bold"><i class="fas fa-seedling me-2"></i>Variedade</div>
                    <p class="mb-0">${specific.variety_specific}</p>
                </li>
            `;
        }
        
        if (specific.cycle_specific) {
            specificHtml += `
                <li class="list-group-item">
                    <div class="fw-bold"><i class="fas fa-sync me-2"></i>Ciclo</div>
                    <p class="mb-0">${specific.cycle_specific}</p>
                </li>
            `;
        }
        
        if (specific.growth_stage) {
            specificHtml += `
                <li class="list-group-item">
                    <div class="fw-bold"><i class="fas fa-leaf me-2"></i>Estágio de Crescimento</div>
                    <p class="mb-0">${specific.growth_stage}</p>
                </li>
            `;
        }
        
        if (specific.harvest) {
            specificHtml += `
                <li class="list-group-item">
                    <div class="fw-bold"><i class="fas fa-truck-loading me-2"></i>Colheita</div>
                    <p class="mb-0">${specific.harvest}</p>
                </li>
            `;
        }
        
        specificHtml += '</ul>';
        
        document.getElementById('specific-recommendations').innerHTML = specificHtml;
    }
    
    // Recomendações de insumos
    const inputs = recommendations.inputs_management;
    if (inputs) {
        let inputsHtml = `
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
        
        document.getElementById('inputs-recommendations').innerHTML = inputsHtml;
    }

    // NOVA SEÇÃO: Monitoramento e Otimização
    const monitoring = recommendations.monitoring_optimization;
    if (monitoring && Object.keys(monitoring).length > 0) {
        // Criar seção para monitoramento se não existir
        if (!document.getElementById('monitoring-section')) {
            const monitoringSection = document.createElement('div');
            monitoringSection.id = 'monitoring-section';
            monitoringSection.className = 'card mb-4';
            monitoringSection.innerHTML = `
                <div class="card-header bg-info text-white">
                    <h5 class="mb-0">Monitoramento e Otimização</h5>
                </div>
                <div class="card-body" id="monitoring-content"></div>
            `;
            
            // Adicionar após a seção de manejo de insumos
            const inputsSection = document.getElementById('inputs-recommendations').closest('.card');
            inputsSection.parentNode.insertBefore(monitoringSection, inputsSection.nextSibling);
        }
        
        // Preencher o conteúdo de monitoramento
        let monitoringHtml = `<div class="row">`;
        
        // Estresse térmico
        if (monitoring.heat_stress) {
            monitoringHtml += `
                <div class="col-md-6 mb-3">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-temperature-high me-2"></i>Condição Térmica</h6>
                        </div>
                        <div class="card-body">
                            <p>${monitoring.heat_stress}</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Recomendação de irrigação
        if (monitoring.irrigation_advice) {
            monitoringHtml += `
                <div class="col-md-6 mb-3">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-tint me-2"></i>Recomendação de Irrigação</h6>
                        </div>
                        <div class="card-body">
                            <p>${monitoring.irrigation_advice}</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Recomendação de herbicida
        if (monitoring.herbicide_advice) {
            monitoringHtml += `
                <div class="col-md-6 mb-3">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-spray-can me-2"></i>Recomendação de Herbicida</h6>
                        </div>
                        <div class="card-body">
                            <p>${monitoring.herbicide_advice}</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Operações de campo
        if (monitoring.field_operations) {
            monitoringHtml += `
                <div class="col-md-6 mb-3">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-tractor me-2"></i>Operações de Campo</h6>
                        </div>
                        <div class="card-body">
                            <p>${monitoring.field_operations}</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        monitoringHtml += `</div>`;
        
        document.getElementById('monitoring-content').innerHTML = monitoringHtml;
    }

    // NOVA SEÇÃO: Impacto Ambiental
    const environmental = recommendations.environmental_impact;
    if (environmental && Object.keys(environmental).length > 0) {
        // Criar seção para impacto ambiental se não existir
        if (!document.getElementById('environmental-section')) {
            const envSection = document.createElement('div');
            envSection.id = 'environmental-section';
            envSection.className = 'card mb-4';
            envSection.innerHTML = `
                <div class="card-header bg-success text-white">
                    <h5 class="mb-0">Impacto Ambiental</h5>
                </div>
                <div class="card-body" id="environmental-content"></div>
            `;
            
            // Adicionar após a seção de monitoramento ou insumos
            const prevSection = document.getElementById('monitoring-section') || 
                                document.getElementById('inputs-recommendations').closest('.card');
            prevSection.parentNode.insertBefore(envSection, prevSection.nextSibling);
        }
        
        // Preencher o conteúdo de impacto ambiental
        let envHtml = `<div class="row">`;
        
        // Risco de deriva
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
        
        // Contaminação da água
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
        
        // Impacto no solo
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

    // NOVA SEÇÃO: Análise de Dados
    const dataAnalysis = recommendations.data_analysis;
    if (dataAnalysis && Object.keys(dataAnalysis).length > 0) {
        // Criar seção para análise de dados se não existir
        if (!document.getElementById('data-analysis-section')) {
            const dataSection = document.createElement('div');
            dataSection.id = 'data-analysis-section';
            dataSection.className = 'card mb-4';
            dataSection.innerHTML = `
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">Análise de Dados</h5>
                </div>
                <div class="card-body" id="data-analysis-content"></div>
            `;
            
            // Adicionar após a seção de impacto ambiental ou monitoramento
            const prevSection = document.getElementById('environmental-section') || 
                               document.getElementById('monitoring-section') ||
                               document.getElementById('inputs-recommendations').closest('.card');
            prevSection.parentNode.insertBefore(dataSection, prevSection.nextSibling);
        }
        
        // Preencher o conteúdo de análise de dados
        let dataHtml = `<div class="row">`;
        
        // Métricas chave
        if (dataAnalysis.key_metrics) {
            const metrics = dataAnalysis.key_metrics;
            dataHtml += `
                <div class="col-md-6 mb-3">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-key me-2"></i>Métricas Chave</h6>
                        </div>
                        <div class="card-body">
                            <ul class="list-group">
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    Área
                                    <span class="badge bg-primary rounded-pill">${metrics.area_hectares} ha</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    Produção Potencial
                                    <span class="badge bg-success rounded-pill">${metrics.potential_production}</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    Linhas de Plantio
                                    <span class="badge bg-primary rounded-pill">${metrics.linhas_plantio}</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    Metros Lineares
                                    <span class="badge bg-primary rounded-pill">${metrics.metros_lineares} m</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            `;
            
            // Insumos totais
            if (metrics.insumos_totais) {
                dataHtml += `
                    <div class="col-md-6 mb-3">
                        <div class="card h-100">
                            <div class="card-header">
                                <h6 class="mb-0"><i class="fas fa-shopping-basket me-2"></i>Insumos Totais</h6>
                            </div>
                            <div class="card-body">
                                <ul class="list-group">
                                    <li class="list-group-item d-flex justify-content-between align-items-center">
                                        Herbicida
                                        <span class="badge bg-primary rounded-pill">${metrics.insumos_totais.herbicida}</span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center">
                                        Fertilizante
                                        <span class="badge bg-primary rounded-pill">${metrics.insumos_totais.fertilizante}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
        
        // Métricas de eficiência
        if (dataAnalysis.efficiency_metrics) {
            const efficiency = dataAnalysis.efficiency_metrics;
            dataHtml += `
                <div class="col-md-12 mb-3">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-chart-line me-2"></i>Métricas de Eficiência</h6>
                        </div>
                        <div class="card-body">
                            <div class="alert alert-info">
                                ${efficiency.water_use ? `<p><i class="fas fa-tint me-2"></i>${efficiency.water_use}</p>` : ''}
                                ${efficiency.herbicide_use ? `<p><i class="fas fa-flask me-2"></i>${efficiency.herbicide_use}</p>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Recomendação de monitoramento
        if (dataAnalysis.monitoring_recommendation) {
            dataHtml += `
                <div class="col-md-12">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-clipboard-list me-2"></i>Recomendação de Monitoramento</h6>
                        </div>
                        <div class="card-body">
                            <p>${dataAnalysis.monitoring_recommendation}</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        dataHtml += `</div>`;
        
        document.getElementById('data-analysis-content').innerHTML = dataHtml;
    }

    // NOVA SEÇÃO: Modelos Estatísticos
    const statModels = recommendations.statistical_models;
    if (statModels && Object.keys(statModels).length > 0) {
        // Criar seção para modelos estatísticos se não existir
        if (!document.getElementById('stat-models-section')) {
            const statsSection = document.createElement('div');
            statsSection.id = 'stat-models-section';
            statsSection.className = 'card mb-4';
            statsSection.innerHTML = `
                <div class="card-header bg-secondary text-white">
                    <h5 class="mb-0">Modelos Estatísticos e Previsões</h5>
                </div>
                <div class="card-body" id="stat-models-content"></div>
            `;
            
            // Adicionar após as seções anteriores
            const prevSections = [
                document.getElementById('data-analysis-section'),
                document.getElementById('environmental-section'),
                document.getElementById('monitoring-section'),
                document.getElementById('inputs-recommendations').closest('.card')
            ];
            
            // Encontrar a última seção existente
            let lastSection = null;
            for (const section of prevSections) {
                if (section) {
                    lastSection = section;
                    break;
                }
            }
            
            if (lastSection) {
                lastSection.parentNode.insertBefore(statsSection, lastSection.nextSibling);
            }
        }
        
        // Preencher o conteúdo de modelos estatísticos
        let statsHtml = `<div class="row">`;
        
        // Desenvolvimento
        if (statModels.development) {
            statsHtml += `
                <div class="col-md-6 mb-3">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-seedling me-2"></i>Desenvolvimento</h6>
                        </div>
                        <div class="card-body">
                            <p>${statModels.development}</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Previsão de produtividade
        if (statModels.productivity_forecast) {
            statsHtml += `
                <div class="col-md-6 mb-3">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-chart-bar me-2"></i>Previsão de Produtividade</h6>
                        </div>
                        <div class="card-body">
                            <p>${statModels.productivity_forecast}</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Comparação histórica
        if (statModels.historical_comparison) {
            statsHtml += `
                <div class="col-md-12">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-history me-2"></i>Comparação Histórica</h6>
                        </div>
                        <div class="card-body">
                            <p>${statModels.historical_comparison}</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        statsHtml += `</div>`;
        
        document.getElementById('stat-models-content').innerHTML = statsHtml;
    }
}


// Função para renderizar análise meteorológica
function renderWeatherInfo(weather_data) {
    // Tentar diferentes estruturas para obter os dados meteorológicos
    let weatherData = null;
    
    // Verificar estrutura aninhada completa
    if (weather_data && weather_data.data && weather_data.data.weather) {
        if (Array.isArray(weather_data.data.weather) && weather_data.data.weather.length > 0) {
            weatherData = weather_data.data.weather[0];
        } else {
            weatherData = weather_data.data.weather;
        }
    }
    
    // Verificar estrutura simplificada
    if (!weatherData && weather_data.current_weather) {
        weatherData = weather_data.current_weather;
    }
    
    if (!weatherData) {
        // Se nenhum dado encontrado, mostrar mensagem
        document.getElementById('current-weather').innerHTML = '<div class="alert alert-warning">Nenhum dado meteorológico disponível</div>';
        document.getElementById('weather-impact').innerHTML = '';
        return;
    }
    
    // Formatação para condições atuais
    let currentWeatherHtml = `
        <div class="d-flex align-items-center mb-3">
            <div class="display-4 me-3">${Math.round(weatherData.temperature || 0)}°C</div>
            <div>
                <div class="h5">${weatherData.main_condition || 'Desconhecido'}</div>
                <div>${weatherData.description || ''}</div>
            </div>
        </div>
        <div class="row">
            <div class="col-6">
                <div class="mb-2">
                    <i class="fas fa-tint me-2"></i>Umidade: ${weatherData.humidity || 0}%
                </div>
                <div class="mb-2">
                    <i class="fas fa-wind me-2"></i>Vento: ${weatherData.wind_speed || 0} km/h
                </div>
            </div>
            <div class="col-6">
                <div class="mb-2">
                    <i class="fas fa-temperature-high me-2"></i>Máx: ${Math.round(weatherData.temp_max || weatherData.temperature || 0)}°C
                </div>
                <div class="mb-2">
                    <i class="fas fa-temperature-low me-2"></i>Mín: ${Math.round(weatherData.temp_min || weatherData.temperature || 0)}°C
                </div>
            </div>
        </div>
        
        <!-- NOVA SEÇÃO: Análises detalhadas dos parâmetros meteorológicos -->
        <div class="mt-4">
            <h6 class="fw-bold">Análises Detalhadas</h6>
            <div class="row mt-2">
    `;
    
    // Adicionar análise de temperatura se disponível
    if (weatherData.temperature_analysis) {
        currentWeatherHtml += `
            <div class="col-md-4 mb-3">
                <div class="card h-100">
                    <div class="card-header bg-danger text-white">
                        <h6 class="mb-0"><i class="fas fa-thermometer-half me-2"></i>Temperatura</h6>
                    </div>
                    <div class="card-body">
                        <div class="d-flex justify-content-between mb-2">
                            <span>Status:</span>
                            <span class="badge bg-${getWeatherStatusClass(weatherData.temperature_analysis.status)}">${formatWeatherStatus(weatherData.temperature_analysis.status)}</span>
                        </div>
                        <p class="small">${weatherData.temperature_analysis.impact}</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Adicionar análise de umidade se disponível
    if (weatherData.humidity_analysis) {
        currentWeatherHtml += `
            <div class="col-md-4 mb-3">
                <div class="card h-100">
                    <div class="card-header bg-info text-white">
                        <h6 class="mb-0"><i class="fas fa-tint me-2"></i>Umidade</h6>
                    </div>
                    <div class="card-body">
                        <div class="d-flex justify-content-between mb-2">
                            <span>Status:</span>
                            <span class="badge bg-${getWeatherStatusClass(weatherData.humidity_analysis.status)}">${formatWeatherStatus(weatherData.humidity_analysis.status)}</span>
                        </div>
                        <p class="small">${weatherData.humidity_analysis.impact}</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Adicionar análise de vento se disponível
    if (weatherData.wind_analysis) {
        currentWeatherHtml += `
            <div class="col-md-4 mb-3">
                <div class="card h-100">
                    <div class="card-header bg-secondary text-white">
                        <h6 class="mb-0"><i class="fas fa-wind me-2"></i>Vento</h6>
                    </div>
                    <div class="card-body">
                        <div class="d-flex justify-content-between mb-2">
                            <span>Status:</span>
                            <span class="badge bg-${getWeatherStatusClass(weatherData.wind_analysis.status)}">${formatWeatherStatus(weatherData.wind_analysis.status)}</span>
                        </div>
                        <p class="small">${weatherData.wind_analysis.impact}</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    currentWeatherHtml += `
            </div>
        </div>
    `;
    
    document.getElementById('current-weather').innerHTML = currentWeatherHtml;
    
    // Impacto na agricultura - verificar diferentes estruturas
    let impactData = null;
    
    // Verificar na estrutura aninhada
    if (weather_data.weather_analysis && weather_data.weather_analysis.agricultural_impact) {
        impactData = weather_data.weather_analysis.agricultural_impact;
    } 
    // Verificar em dados diretos
    else if (weatherData.agricultural_impact) {
        impactData = weatherData.agricultural_impact;
    }
    // Verificar em análise aninhada
    else if (weather_data.data && weather_data.data.analysis && weather_data.data.analysis.agricultural_impact) {
        impactData = weather_data.data.analysis.agricultural_impact;
    }
    
    if (impactData) {
        let impactHtml = `
            <div class="mb-3">
                <div class="h5">Avaliação Geral: ${impactData.assessment || 'Desconhecido'}</div>
                <div class="progress mb-2">
                    <div class="progress-bar ${getImpactClass(impactData.assessment)}" style="width: ${((impactData.score || 0) / (impactData.max_score || 20)) * 100}%">
                        ${impactData.score || 0}/${impactData.max_score || 20}
                    </div>
                </div>
            </div>
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>${impactData.recommendations || 'Sem recomendações específicas disponíveis.'}
            </div>
            
            <!-- NOVA SEÇÃO: Escala de pontuação para impacto agrícola -->
            <div class="mt-3 mb-2">
                <h6 class="fw-bold">Escala de Impacto Agrícola</h6>
                <div class="d-flex justify-content-between small text-muted mb-1">
                    <span>Desfavorável</span>
                    <span>Marginal</span>
                    <span>Aceitável</span>
                    <span>Favorável</span>
                    <span>Ótimo</span>
                </div>
                <div class="progress" style="height: 20px;">
                    <div class="progress-bar bg-danger" style="width: 20%" data-bs-toggle="tooltip" title="Desfavorável (<8)"></div>
                    <div class="progress-bar bg-warning" style="width: 20%" data-bs-toggle="tooltip" title="Marginal (8-11)"></div>
                    <div class="progress-bar bg-info" style="width: 20%" data-bs-toggle="tooltip" title="Aceitável (12-15)"></div>
                    <div class="progress-bar bg-primary" style="width: 20%" data-bs-toggle="tooltip" title="Favorável (16-19)"></div>
                    <div class="progress-bar bg-success" style="width: 20%" data-bs-toggle="tooltip" title="Ótimo (20)"></div>
                </div>
                <div class="mt-2 small">
                    <p>Score atual: <strong>${impactData.score || 0}</strong> pontos de ${impactData.max_score || 20} possíveis (${impactData.assessment || 'não classificado'})</p>
                    <p>Os fatores considerados para este score incluem temperatura, umidade, vento e condições meteorológicas gerais.</p>
                </div>
            </div>
        `;
        
        document.getElementById('weather-impact').innerHTML = impactHtml;
        
        // Inicializar os tooltips do Bootstrap
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
        var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl)
        });
    } else {
        document.getElementById('weather-impact').innerHTML = '<div class="alert alert-warning">Informações de impacto agrícola não disponíveis</div>';
    }
}

// Função auxiliar para obter classe de cor com base no status meteorológico
function getWeatherStatusClass(status) {
    switch(status) {
        case 'extremely_cold':
        case 'extremely_hot':
            return 'danger';
        case 'cold':
        case 'hot':
            return 'warning';
        case 'mild':
        case 'warm':
            return 'success';
        case 'very_dry':
        case 'very_humid':
            return 'danger';
        case 'dry':
        case 'humid':
            return 'warning';
        case 'comfortable':
            return 'success';
        case 'calm':
        case 'light':
            return 'success';
        case 'moderate':
            return 'info';
        case 'strong':
            return 'warning';
        case 'very_strong':
            return 'danger';
        default:
            return 'secondary';
    }
}

// Função auxiliar para formatar o status meteorológico
function formatWeatherStatus(status) {
    const translations = {
        'extremely_cold': 'Extremamente Frio',
        'cold': 'Frio',
        'mild': 'Ameno',
        'warm': 'Morno',
        'hot': 'Quente',
        'extremely_hot': 'Extremamente Quente',
        'very_dry': 'Muito Seco',
        'dry': 'Seco',
        'comfortable': 'Confortável',
        'humid': 'Úmido',
        'very_humid': 'Muito Úmido',
        'calm': 'Calmo',
        'light': 'Leve',
        'moderate': 'Moderado',
        'strong': 'Forte',
        'very_strong': 'Muito Forte'
    };
    
    return translations[status] || status;
}

// Função auxiliar para obter classe de impacto agrícola
function getImpactClass(assessment) {
    switch(assessment) {
        case 'desfavorável':
            return 'bg-danger';
        case 'marginal':
            return 'bg-warning';
        case 'aceitável':
            return 'bg-info';
        case 'favorável':
            return 'bg-primary';
        case 'ótimo':
            return 'bg-success';
        default:
            return 'bg-secondary';
    }
}

function renderWeatherChart(weather_data) {
    const chartContainer = document.getElementById('weather-chart');
    
    // Verificar se já existe um gráfico e destruí-lo
    if (window.weatherChart) {
        window.weatherChart.destroy();
    }
    
    // Tentar obter dados meteorológicos da estrutura
    let weatherData = null;
    
    if (weather_data && weather_data.data && weather_data.data.weather) {
        if (Array.isArray(weather_data.data.weather) && weather_data.data.weather.length > 0) {
            weatherData = weather_data.data.weather[0];
        } else {
            weatherData = weather_data.data.weather;
        }
    }
    
    if (weather_data.current_weather) {
        weatherData = weather_data.current_weather;
    }
    
    if (!weatherData) {
        chartContainer.innerHTML = '<div class="alert alert-warning">Dados insuficientes para gerar gráfico</div>';
        return;
    }
    
    // Dados para gráfico (usando dados atuais e projeção simples)
    const currentTemp = weatherData.temperature || 0;
    const currentHumidity = weatherData.humidity || 0;
    
    const labels = ['Atual', '+1h', '+2h', '+3h', '+4h', '+5h'];
    const tempData = [
        currentTemp,
        currentTemp * 0.98,
        currentTemp * 0.95,
        currentTemp * 0.93,
        currentTemp * 0.92,
        currentTemp * 0.90
    ];
    
    const humidityData = [
        currentHumidity,
        currentHumidity * 1.02,
        currentHumidity * 1.04,
        currentHumidity * 1.05,
        currentHumidity * 1.06,
        currentHumidity * 1.07
    ];
    
    // MELHORIA: Adicionar dados de vento para mostrar tendência completa
    const windData = [
        weatherData.wind_speed || 0,
        (weatherData.wind_speed || 0) + 0.5,
        (weatherData.wind_speed || 0) + 1.0,
        (weatherData.wind_speed || 0) + 1.2,
        (weatherData.wind_speed || 0) + 0.8,
        (weatherData.wind_speed || 0) + 0.3
    ];
    
    // Criação do gráfico
    const ctx = document.createElement('canvas');
    chartContainer.innerHTML = '';
    chartContainer.appendChild(ctx);
    
    window.weatherChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Temperatura (°C)',
                    data: tempData,
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    yAxisID: 'y1'
                },
                {
                    label: 'Umidade (%)',
                    data: humidityData,
                    borderColor: 'rgb(54, 162, 235)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    yAxisID: 'y2'
                },
                {
                    label: 'Vento (km/h)',
                    data: windData,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    yAxisID: 'y3',
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
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
    
    // Adicionar explicação sobre os dados
    const chartExplanation = document.createElement('div');
    chartExplanation.className = 'alert alert-info mt-3 small';
    chartExplanation.innerHTML = `
        <p><strong>Nota:</strong> Esta previsão é uma simulação baseada em tendências típicas a partir das condições meteorológicas atuais. 
        Para previsões mais precisas, consulte serviços meteorológicos oficiais.</p>
    `;
    chartContainer.appendChild(chartExplanation);
}

function renderCultureStats(data) {
    const culture = data.cultura_info;
    const statsContainer = document.getElementById('culture-stats');
    const projectionsContainer = document.getElementById('culture-projections');
    const chartContainer = document.getElementById('stats-chart');
    
    // Obter estatísticas - tentar diferentes estruturas
    let stats = data.stats || {};
    let sugarcaneSpecific = null;
    
    // Se for cana-de-açúcar, verificar se há estatísticas específicas
    if (culture.tipo === 'Cana-de-Açúcar') {
        if (stats.sugarcane_specific) {
            sugarcaneSpecific = stats.sugarcane_specific;
        } else if (data.sugarcane_recommendations) {
            sugarcaneSpecific = {
                ciclo: culture.ciclo,
                duracao: data.sugarcane_recommendations.ciclo_info.duracao,
                descricao: data.sugarcane_recommendations.ciclo_info.descricao
            };
        }
    }
    
    // Informações da cultura
    let statsHtml = `
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
    
    // Adicionar informações específicas para cana-de-açúcar
    if (sugarcaneSpecific) {
        statsHtml += `
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
    
    statsHtml += `
                </tbody>
            </table>
        </div>
    `;
    
    statsContainer.innerHTML = statsHtml;
    
    // Projeções e produtividade
    let productivityData = data.productivity || {};
    let efficiencyMetrics = stats.efficiency_metrics || {};
    
    // Dados de insumos (tentar várias estruturas)
    let insumosData = {};
    if (stats.insumos_totais) {
        insumosData = stats.insumos_totais;
    } else {
        insumosData = {
            herbicida: `${culture.quantidade_herbicida || 0} L`,
            fertilizante: `${culture.quantidade_fertilizante || 0} kg`
        };
    }
    
    let projectionsHtml = `
        <div class="table-responsive">
            <table class="table table-bordered">
                <tbody>
                    <tr>
                        <th>Estimativa de Produção</th>
                        <td>${productivityData.value || 0} ${productivityData.unit || 'unidades/ha'}<br>
                        Total: ${productivityData.total || 0} ${productivityData.unit ? productivityData.unit.split('/')[0] : 'unidades'}</td>
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
                        <td>${data.productivity ? data.productivity.optimal_period : (culture.tipo === 'Soja' ? 'Setembro a Novembro' : 'Janeiro a Março')}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        ${efficiencyMetrics.water_use || efficiencyMetrics.herbicide_use ? `
        <div class="mt-3">
            <h6>Métricas de Eficiência:</h6>
            <ul class="list-group">
                ${efficiencyMetrics.water_use ? `<li class="list-group-item">${efficiencyMetrics.water_use}</li>` : ''}
                ${efficiencyMetrics.herbicide_use ? `<li class="list-group-item">${efficiencyMetrics.herbicide_use}</li>` : ''}
            </ul>
        </div>
        ` : ''}
    `;
    
    projectionsContainer.innerHTML = projectionsHtml;
    
    // Gráfico
    if (window.statsChart) {
        window.statsChart.destroy();
    }
    
    // Criar dados simulados para o gráfico - considerando tipo de cultura e ciclo para cana
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    let productionData = [];
    let resourceUseData = [];
    
    if (culture.tipo === 'Soja') {
        // Simular ciclo da soja - plantio em set/out/nov, colheita em fev/mar/abr
        productionData = [0, 10, 40, 80, 100, 0, 0, 0, 10, 30, 60, 90]; // Crescimento
        
        // Simular uso de recursos (água, fertilizantes, etc.)
        resourceUseData = [0, 5, 20, 30, 20, 0, 0, 0, 40, 60, 30, 10];
    } else if (culture.tipo === 'Cana-de-Açúcar') {
        // Simular ciclo da cana - ajustado conforme o ciclo
        if (culture.ciclo === 'curto') {
            // Ciclo curto: 8-10 meses, desenvolvimento mais rápido
            productionData = [0, 20, 40, 60, 80, 100, 0, 0, 0, 0, 0, 0];
            resourceUseData = [0, 60, 80, 50, 30, 10, 0, 0, 0, 0, 0, 0];
        } else if (culture.ciclo === 'longo') {
            // Ciclo longo: 16-18 meses, desenvolvimento mais lento
            productionData = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100];
            resourceUseData = [0, 40, 60, 70, 60, 50, 40, 30, 20, 10, 5, 0];
        } else {
            // Ciclo médio: 12-14 meses
            productionData = [0, 15, 30, 45, 60, 75, 90, 100, 0, 0, 0, 0];
            resourceUseData = [0, 50, 70, 60, 40, 30, 20, 10, 0, 0, 0, 0];
        }
    }
    
    // Criar dados para produtividade por hectare (baseado em dados reais ou estimados)
    let productivityPerHectare = [];
    
    if (culture.tipo === 'Soja') {
        // Produtividade esperada por hectare em sacas
        productivityPerHectare = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 65]; // 65 sacas/ha em dezembro
    } else if (culture.tipo === 'Cana-de-Açúcar') {
        // Produtividade esperada por hectare em toneladas
        if (culture.ciclo === 'curto') {
            productivityPerHectare = [0, 0, 0, 0, 0, 75, 0, 0, 0, 0, 0, 0]; // 75 ton/ha em junho
        } else if (culture.ciclo === 'longo') {
            productivityPerHectare = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 95, 0]; // 95 ton/ha em novembro
        } else {
            productivityPerHectare = [0, 0, 0, 0, 0, 0, 0, 85, 0, 0, 0, 0]; // 85 ton/ha em agosto
        }
    }
    
    // Criar gráfico melhorado
    const ctx = document.createElement('canvas');
    chartContainer.innerHTML = '';
    chartContainer.appendChild(ctx);
    
    window.statsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Desenvolvimento da Cultura (%)',
                    data: productionData,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    tension: 0.4
                },
                {
                    label: 'Uso de Recursos (%)',
                    data: resourceUseData,
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 2,
                    tension: 0.4
                },
                {
                    label: `Produtividade (${culture.tipo === 'Soja' ? 'sacas/ha' : 'ton/ha'})`,
                    data: productivityPerHectare,
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    type: 'bar'
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: `Ciclo Anual de ${culture.tipo}`,
                    font: {
                        size: 16
                    }
                },
                subtitle: {
                    display: true,
                    text: culture.tipo === 'Cana-de-Açúcar' ? 
                           `Ciclo ${culture.ciclo} (${sugarcaneSpecific ? sugarcaneSpecific.duracao : ''})` : 
                           `Variedade: ${culture.variedade || 'Convencional'}`,
                    padding: {
                        bottom: 10
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                },
                legend: {
                    position: 'top'
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
                        text: culture.tipo === 'Soja' ? 'Produtividade (sacas/ha)' : 'Produtividade (ton/ha)'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
    
    // Adicionar legenda explicativa
    const chartLegend = document.createElement('div');
    chartLegend.className = 'card mt-3';
    chartLegend.innerHTML = `
        <div class="card-header">
            <h6 class="mb-0">Legenda do Gráfico</h6>
        </div>
        <div class="card-body">
            <div class="row">
                <div class="col-md-4">
                    <span class="badge p-2 me-2" style="background-color: rgba(75, 192, 192, 1);"></span>
                    <span>Desenvolvimento da Cultura</span>
                    <p class="small text-muted mt-1">Estágio de crescimento da cultura ao longo do ano.</p>
                </div>
                <div class="col-md-4">
                    <span class="badge p-2 me-2" style="background-color: rgba(153, 102, 255, 1);"></span>
                    <span>Uso de Recursos</span>
                    <p class="small text-muted mt-1">Intensidade do uso de água, fertilizantes e outros insumos.</p>
                </div>
                <div class="col-md-4">
                    <span class="badge p-2 me-2" style="background-color: rgba(255, 159, 64, 1);"></span>
                    <span>Produtividade</span>
                    <p class="small text-muted mt-1">Estimativa de produção por hectare no período de colheita.</p>
                </div>
            </div>
        </div>
    `;
    chartContainer.appendChild(chartLegend);
}

function clearAnalysisView() {
    currentCultureId = null;
    analysisData = null;
    
    document.getElementById('analysis-select-prompt').style.display = 'block';
    document.getElementById('analysis-content').style.display = 'none';
    document.getElementById('analysis-select-prompt').innerHTML = `
        <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>
            Selecione uma cultura na aba "Culturas" para visualizar a análise.
        </div>
    `;
}

// ======= Funções auxiliares =======
function editCulture(cultureId) {
    // Obter dados atuais da cultura
    fetchAPI(`/cultures/${cultureId}`)
        .then(result => {
            if (result.status === 'success') {
                // Preparar dados para formulário
                const cultureData = {
                    ...result.data,
                    id: cultureId,
                    type_id: result.data.tipo === 'Soja' ? '1' : '2'
                };
                
                showCultureForm(cultureData);
            } else {
                showAlert(result.message, 'warning');
            }
        })
        .catch(error => {
            showAlert(`Erro ao carregar cultura: ${error.message}`, 'danger');
        });
}

