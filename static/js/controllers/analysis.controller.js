/**
 * Controlador para operações relacionadas a análises de culturas
 */
import { CONFIG } from '../config.js';
import { ApiService } from '../services/api.service.js';
import { WeatherService } from '../services/weather.service.js';
import { AnalysisModel } from '../models/analysis.model.js';
import { AnalysisView } from '../views/analysis/index.js';
import { UIView } from '../views/ui.view.js';
import { ChartUtils } from '../utils/chart.utils.js';

export class AnalysisController {
    /**
     * Inicializa o controlador de análise
     */
    constructor() {
        this.apiService = new ApiService();
        this.analysisView = new AnalysisView();
        this.uiView = new UIView();
        this.currentAnalysisModel = null;
        this.isLoading = false;
        this.loadAttempts = 0;  // Controle de tentativas de carregamento
        this.maxLoadAttempts = 3;  // Máximo de tentativas permitidas
        
        // cache de análises para persistência
        this.analysisCache = this.loadAnalysisCache();
        
        // inicializa eventos
        this.initEvents();
    }
    
    /**
     * Carrega o cache de análises do localStorage
     * @returns {Object} Cache de análises
     */
    loadAnalysisCache() {
        try {
            const stored = localStorage.getItem('analysisCache');
            const parsed = stored ? JSON.parse(stored) : {};
            
            // validação crucial: garantir que é um objeto válido
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                console.error("Cache de análises inválido, usando objeto vazio");
                return {};
            }
            
            return parsed;
        } catch (error) {
            console.error("Erro ao carregar cache de análises:", error);
            return {};
        }
    }
    
    /**
     * Salva o cache de análises no localStorage
     */
    saveAnalysisCache() {
        try {
            // valida que o cache é um objeto válido antes de salvar
            if (!this.analysisCache || typeof this.analysisCache !== 'object' || 
                Array.isArray(this.analysisCache)) {
                console.error("Tentativa de salvar cache inválido, redefinindo");
                this.analysisCache = {};
            }
            
            localStorage.setItem('analysisCache', JSON.stringify(this.analysisCache));
        } catch (error) {
            console.error("Erro ao salvar cache de análises:", error);
        }
    }
    
    /**
     * Limpa o cache de análises
     */
    clearAnalysisCache() {
        this.analysisCache = {};
        this.saveAnalysisCache();
        console.log("Cache de análises limpo");
    }
    
    /**
     * Inicializa os eventos do controlador
     */
    initEvents() {
        // limpa quaisquer listeners existentes para evitar duplicação
        document.removeEventListener('culture:action', this._handleCultureAction);
        document.removeEventListener('culture:analyze', this._handleCultureAnalyze);
        document.removeEventListener('culture:view', this._handleCultureView);

        // ouve eventos de ação de cultura usando bind para manter o contexto 'this'
        document.addEventListener('culture:action', this._handleCultureAction.bind(this));
        
        // ouve eventos de análise de cultura
        document.addEventListener('culture:analyze', this._handleCultureAnalyze.bind(this));
        
        // ouve eventos de visualização de cultura
        document.addEventListener('culture:view', this._handleCultureView.bind(this));

        // configura botão Copiar JSON
        const copyButton = document.getElementById('btn-copy-json');
        if (copyButton) {
            // remove listeners anteriores para evitar duplicação
            copyButton.removeEventListener('click', this._handleCopyJson);
            
            // adiciona novo listener
            copyButton.addEventListener('click', this._handleCopyJson.bind(this));
        }
        
        // adiciona botão de atualização se não existir
        this._setupRefreshButton();
    }
    
    /**
     * Manipula eventos de ação de cultura
     * @param {CustomEvent} e - Evento personalizado
     * @private
     */
    _handleCultureAction(e) {
        const { action, cultureId } = e.detail;
        
        if (!action || typeof cultureId !== 'number' || isNaN(cultureId)) {
            console.error("Dados inválidos em culture:action:", e.detail);
            return;
        }
        
        if (action === 'analyze') {
            // sempre força o refresh para garantir dados atualizados
            this.loadAnalysis(cultureId, true);
        }
    }
    
    /**
     * Manipula eventos específicos de análise de cultura
     * @param {CustomEvent} e - Evento personalizado
     * @private
     */
    _handleCultureAnalyze(e) {
        const { cultureId } = e.detail;
        
        if (typeof cultureId !== 'number' || isNaN(cultureId)) {
            console.error("ID de cultura inválido em culture:analyze:", e.detail);
            return;
        }
        
        // sempre força o refresh quando explicitamente solicitado análise
        this.loadAnalysis(cultureId, true);
    }
    
    /**
     * Manipula eventos de visualização de cultura
     * @param {CustomEvent} e - Evento personalizado
     * @private
     */
    _handleCultureView(e) {
        const { cultureId } = e.detail;
        
        if (typeof cultureId !== 'number' || isNaN(cultureId)) {
            console.error("ID de cultura inválido em culture:view:", e.detail);
            return;
        }
        
        this.viewCachedAnalysis(cultureId);
    }
    
    /**
     * Manipula eventos de cópia de JSON
     * @private
     */
    _handleCopyJson() {
        const jsonElement = document.getElementById('json-data');
        if (!jsonElement) {
            console.error("Elemento JSON não encontrado");
            return;
        }
        
        navigator.clipboard.writeText(jsonElement.textContent)
            .then(() => this.uiView.showAlert(
                'JSON copiado para a área de transferência', 
                'success')
            )
            .catch(err => this.uiView.showAlert(
                `Erro ao copiar: ${err}`, 
                'danger')
            );
    }
    
    /**
     * Configura o botão de atualização da análise
     * @private
     */
    _setupRefreshButton() {
        // verifica se o botão já existe
        let refreshBtn = document.getElementById('btn-refresh-analysis');
        
        // se não existir, cria novo botão
        if (!refreshBtn) {
            refreshBtn = document.createElement('button');
            refreshBtn.id = 'btn-refresh-analysis';
            refreshBtn.className = 'btn btn-outline-primary ms-2';
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt me-1"></i>Atualizar Dados';
            refreshBtn.style.display = 'none';
            
            // adiciona botão após o título
            const titleEl = document.getElementById('analysis-culture-title');
            if (titleEl && titleEl.parentNode) {
                titleEl.parentNode.appendChild(refreshBtn);
                
                // adiciona evento de clique
                refreshBtn.addEventListener('click', () => {
                    if (this.currentAnalysisModel && 
                        this.currentAnalysisModel.cultureId !== null) {
                        this.loadAnalysis(this.currentAnalysisModel.cultureId, true);
                    }
                });
            }
        }
        
        return refreshBtn;
    }
    
    /**
     * Visualiza uma análise já armazenada em cache
     * @param {number} cultureId - ID da cultura
     */
    viewCachedAnalysis(cultureId) {
        // valida ID
        if (typeof cultureId !== 'number' || isNaN(cultureId)) {
            console.error("ID de cultura inválido:", cultureId);
            return;
        }
        
        // mostra a view de análise
        if (typeof window.app !== 'undefined' && 
            typeof window.app.showView === 'function') {
            window.app.showView('analysis-view');
        }
        
        // IMPORTANTE: Limpa explicitamente a análise anterior
        this.analysisView.clearAnalysis();
        
        // verifica se há análise em cache
        if (this.analysisCache[cultureId]) {
            console.log(`Utilizando análise em cache para cultura #${cultureId}`);
            
            try {
                // cria o modelo de análise a partir do cache
                this.currentAnalysisModel = new AnalysisModel(this.analysisCache[cultureId]);
                
                // verifica se o modelo é válido
                if (!this.currentAnalysisModel.isComplete()) {
                    console.warn(`Análise em cache para cultura #${cultureId} está incompleta`);
                    // limpa cache inválido
                    delete this.analysisCache[cultureId];
                    this.saveAnalysisCache();
                    
                    // carrega dados novos
                    this.loadAnalysis(cultureId);
                    return;
                }
                
                // adiciona notificação de visualização rápida
                const alertContainer = document.getElementById('alert-container');
                if (alertContainer) {
                    alertContainer.innerHTML = `
                        <div class="alert alert-info alert-dismissible fade show" role="alert">
                            <i class="fas fa-info-circle me-2"></i>
                            <strong>Visualização rápida:</strong> Você está vendo os dados existentes da cultura. 
                            Para obter dados meteorológicos em tempo real e análises atualizadas, clique em "Atualizar Dados".
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
                        </div>
                    `;
                }
                
                // mostra botão de atualização
                const refreshBtn = document.getElementById('btn-refresh-analysis');
                if (refreshBtn) {
                    refreshBtn.style.display = 'inline-block';
                }
                
                // renderiza a análise
                this.analysisView.renderAnalysis(this.currentAnalysisModel);
                
                // renderiza gráficos
                this.renderCharts();
            } catch (error) {
                console.error(
                    `Erro ao processar análise em cache para cultura #${cultureId}:`, 
                    error
                );
                
                // limpa cache inválido
                delete this.analysisCache[cultureId];
                this.saveAnalysisCache();
                
                // carrega dados novos
                this.loadAnalysis(cultureId);
            }
        } else {
            // se não houver análise em cache, carrega normalmente
            this.loadAnalysis(cultureId);
        }
    }

    /**
     * Carrega a análise para uma cultura específica
     * @param {number} cultureId - ID da cultura
     * @param {boolean} forceRefresh - Se deve forçar o refresh dos dados
     */
    async loadAnalysis(cultureId, forceRefresh = false) {
        // valida ID
        if (typeof cultureId !== 'number' || isNaN(cultureId)) {
            console.error("ID de cultura inválido:", cultureId);
            return;
        }
        
        // evita carregamentos simultâneos
        if (this.isLoading) {
            this.uiView.showAlert('Carregamento em andamento, aguarde...', 'info');
            return;
        }
        
        // controle de tentativas para evitar loops
        if (this.loadAttempts >= this.maxLoadAttempts) {
            console.error(`Máximo de ${this.maxLoadAttempts} tentativas alcançado para cultura #${cultureId}`);
            this.analysisView.showSelectionPrompt(
                `Não foi possível carregar a análise após ${this.maxLoadAttempts} tentativas. ` +
                `Por favor, tente novamente mais tarde.`
            );
            // reinicia contador
            this.loadAttempts = 0; 
            return;
        }

        // incrementa contador de tentativas
        this.loadAttempts++; 
        this.isLoading = true;
        
        // mostra a view de análise e exibir carregamento
        if (typeof window.app !== 'undefined' && 
            typeof window.app.showView === 'function') {
            window.app.showView('analysis-view');
        }
        
        // IMPORTANTE: Limpa explicitamente a análise
        // anterior antes de mostrar o carregamento
        this.analysisView.clearAnalysis();
        this.analysisView.showLoading();
        
        try {
            // obtém dados da análise da API
            const result = await this.apiService.get(
                `/cultures/${cultureId}/weather-analysis`, 
                forceRefresh
            );
            
            console.log("Resposta da API de análise:", result);
            
            // redefine contador de tentativas após resposta da API
            this.loadAttempts = 0;
            
            if (result && result.status === 'success' && result.data) {
                // mostra botão de atualização
                const refreshBtn = document.getElementById('btn-refresh-analysis');
                if (refreshBtn) {
                    refreshBtn.style.display = 'inline-block';
                }
                
                try {
                    // cria modelo de análise
                    this.currentAnalysisModel = new AnalysisModel(result.data);
                    
                    // verifica se o modelo é válido
                    if (!this.currentAnalysisModel.isComplete()) {
                        throw new Error("Dados de análise incompletos");
                    }
                    
                    // salva no cache
                    this.analysisCache[cultureId] = result.data;
                    this.saveAnalysisCache();
                    
                    console.log("Modelo de análise criado:", this.currentAnalysisModel);
                    console.log("isComplete():", this.currentAnalysisModel.isComplete());
                    
                    // renderiza a análise
                    this.analysisView.renderAnalysis(this.currentAnalysisModel);
                    
                    // renderiza gráficos
                    this.renderCharts();
                    
                    // dispara evento de análise completa
                    document.dispatchEvent(new CustomEvent('analysis:completed', {
                        detail: { cultureId }
                    }));
                    
                    // verifica se há alertas sobre dados meteorológicos
                    if (!this.currentAnalysisModel.hasWeatherData()) {
                        this.uiView.showAlert(
                            'Dados meteorológicos indisponíveis ou incompletos. ' + 
                            'Algumas recomendações podem estar limitadas.', 
                            'warning',
                            8000
                        );
                    }
                } catch (modelError) {
                    console.error("Erro ao processar modelo de análise:", modelError);
                    // exibe mensagem de erro
                    this.analysisView.showSelectionPrompt(
                        `Erro ao processar dados da análise: ${modelError.message}`
                    );
                    
                    // botão de tentativa
                    this._addRetryButton(cultureId);
                }
            } else {
                // exibe mensagem de erro
                const errorMsg = result && result.message ? 
                    result.message : 'Não foi possível carregar a análise';
                    
                this.analysisView.showSelectionPrompt(errorMsg);
                
                // botão de tentativa
                this._addRetryButton(cultureId);
            }
        } catch (error) {
            // redefine contador de tentativas após erro
            this.loadAttempts = 0;
            
            console.error('Erro ao carregar análise:', error);
            
            // mostra uma mensagem de erro mais específica
            let errorMessage = `Erro ao carregar análise: ${error.message}`;
            
            if (error.message && error.message.includes('Timeout')) {
                errorMessage = 'O servidor demorou muito para responder. ' +
                             'Tente novamente mais tarde ou verifique sua conexão.';
            }
            
            this.analysisView.showSelectionPrompt(errorMessage);
            
            // botão de tentativa
            this._addRetryButton(cultureId);
        } finally {
            this.isLoading = false;
        }
    }
    
    /**
     * Adiciona um botão de tentativa à mensagem de erro
     * @param {number} cultureId - ID da cultura
     * @private
     */
    _addRetryButton(cultureId) {
        const container = document.getElementById('analysis-select-prompt');
        if (!container) return;
        
        // remove botão existente, se houver
        const existingButton = container.querySelector('.retry-button');
        if (existingButton) {
            existingButton.remove();
        }
        
        // cria novo botão
        const retryButton = document.createElement('button');
        retryButton.className = 'btn btn-primary mt-3 retry-button';
        retryButton.textContent = 'Tentar Novamente';
        retryButton.addEventListener('click', () => this.loadAnalysis(cultureId, true));
        
        container.appendChild(retryButton);
    }
    
    /**
     * Renderiza todos os gráficos necessários para a análise
     */
    renderCharts() {
        if (!this.currentAnalysisModel) {
            console.warn("Tentativa de renderizar gráficos sem modelo de análise");
            return;
        }
        
        try {
            // renderiza gráfico de previsão meteorológica
            this.renderWeatherChart();
            
            // renderiza gráfico de desenvolvimento da cultura
            this.renderCultureDevelopmentChart();
        } catch (error) {
            console.error('Erro ao renderizar gráficos:', error);
            this.uiView.showAlert(
                'Não foi possível renderizar os gráficos: ' + error.message, 
                'warning'
            );
        }
    }
    
    /**
     * Renderiza o gráfico de previsão meteorológica
     */
    renderWeatherChart() {
        if (!this.currentAnalysisModel) return;
        
        // verifica se o modelo tem método hasWeatherData
        const hasWeatherData = typeof this.currentAnalysisModel.hasWeatherData === 'function' ?
            this.currentAnalysisModel.hasWeatherData() : false;
            
        if (!hasWeatherData) return;
        
        // verifica se o contêiner do gráfico existe
        const chartContainer = document.getElementById('weather-chart');
        if (!chartContainer) {
            console.warn("Contêiner do gráfico meteorológico não encontrado");
            return;
        }
        
        // extrai dados meteorológicos atuais
        const weatherData = WeatherService.extractWeatherData(
            this.currentAnalysisModel.currentWeather || 
            this.currentAnalysisModel.weatherData
        );
        
        if (!weatherData) {
            console.warn("Dados meteorológicos não encontrados para renderização do gráfico");
            return;
        }
        
        // gera dados de previsão simulada com base nos dados atuais
        const forecastData = WeatherService.generateForecastData(weatherData);
        
        // cria gráfico
        ChartUtils.createWeatherForecastChart('weather-chart', forecastData);
    }
    
    /**
     * Renderiza o gráfico de desenvolvimento da cultura
     */
    renderCultureDevelopmentChart() {
        if (!this.currentAnalysisModel) return;
        
        // verifica se o modelo está completo
        const isComplete = typeof this.currentAnalysisModel.isComplete === 'function' ?
            this.currentAnalysisModel.isComplete() : false;
            
        if (!isComplete) return;
        
        // verifica se o contêiner do gráfico existe
        const chartContainer = document.getElementById('stats-chart');
        if (!chartContainer) {
            console.warn("Contêiner do gráfico de estatísticas não encontrado");
            return;
        }
        
        // verifica se os dados da cultura existem
        if (!this.currentAnalysisModel.cultureInfo) {
            console.warn("Dados da cultura não encontrados para renderização do gráfico");
            return;
        }
        
        // cria gráfico
        ChartUtils.createCultureDevelopmentChart('stats-chart', this.currentAnalysisModel.cultureInfo);
    }
    
    /**
     * Limpa os dados de análise atual
     */
    clearAnalysis() {
        this.currentAnalysisModel = null;
        
        // limpa a visualização
        if (this.analysisView) {
            this.analysisView.clearAnalysis();
        }
        
        // oculta botão de atualização
        const refreshBtn = document.getElementById('btn-refresh-analysis');
        if (refreshBtn) {
            refreshBtn.style.display = 'none';
        }
        
        // remove banner se existir
        const banner = document.getElementById('quickview-banner');
        if (banner) {
            banner.remove();
        }
        
        // limpa gráficos existentes
        if (window.statsChart) {
            try {
                window.statsChart.destroy();
                window.statsChart = null;
            } catch (e) {
                console.error("Erro ao destruir gráfico de estatísticas:", e);
            }
        }
        
        if (window.weatherChart) {
            try {
                window.weatherChart.destroy();
                window.weatherChart = null;
            } catch (e) {
                console.error("Erro ao destruir gráfico meteorológico:", e);
            }
        }
    }
}

