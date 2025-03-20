/* * * *
 *
 * Controlador para operações relacionadas a análises de culturas
 *
 * * * */
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
     **/
    constructor() {
        this.apiService = new ApiService();
        this.analysisView = new AnalysisView();
        this.uiView = new UIView();
        this.currentAnalysisModel = null;
        this.isLoading = false;
        
        // cache de análises para persistência
        this.analysisCache = this.loadAnalysisCache();
        
        // inicializa eventos
        this.initEvents();
    }
    
    /**
     * Carrega o cache de análises do localStorage
     * @returns {Object} Cache de análises
     **/
    loadAnalysisCache() {
        try {
            const stored = localStorage.getItem('analysisCache');
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error("Erro ao carregar cache de análises:", error);
            return {};
        }
    }
    
    /**
     * Salva o cache de análises no localStorage
     **/
    saveAnalysisCache() {
        try {
            localStorage.setItem('analysisCache', JSON.stringify(this.analysisCache));
        } catch (error) {
            console.error("Erro ao salvar cache de análises:", error);
        }
    }
    
    /**
     * Inicializa os eventos do controlador
     **/
    initEvents() {
        // ouve eventos de ação de cultura
        document.addEventListener('culture:action', (e) => {
            const { action, cultureId } = e.detail;
            
            if (action === 'analyze') {
                // refresh para garantir dados atualizados
                this.loadAnalysis(cultureId, true);
            }
        });
        
        // ADICIONAR ESTE NOVO LISTENER AQUI
        document.addEventListener('culture:analyze', (e) => {
            const { cultureId } = e.detail;
            // sempre força o refresh quando explicitamente solicitado análise
            this.loadAnalysis(cultureId, true);
        });
        
        // ouve eventos de visualização de cultura
        document.addEventListener('culture:view', (e) => {
            const { cultureId } = e.detail;
            this.viewCachedAnalysis(cultureId);
        });


        // botão Copiar JSON
        document.getElementById('btn-copy-json').addEventListener('click', () => {
            navigator.clipboard.writeText(document.getElementById('json-data').textContent)
                .then(() => this.uiView.showAlert('JSON copiado para a área de transferência', 'success'))
                .catch(err => this.uiView.showAlert(`Erro ao copiar: ${err}`, 'danger'));
        });
        
        // adiciona botão de atualização
        const refreshBtn = document.createElement('button');
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
                if (this.currentAnalysisModel && this.currentAnalysisModel.cultureId !== null) {
                    this.loadAnalysis(this.currentAnalysisModel.cultureId, true);
                }
            });
        }
    }
    
    /**
     * Visualiza uma análise já armazenada em cache
     * @param {number} cultureId - ID da cultura
     **/
    viewCachedAnalysis(cultureId) {
        // mostra a view de análise
        if (typeof app !== 'undefined') {
            app.showView('analysis-view');
        }
        
        // IMPORTANTE: Limpar explicitamente a análise anterior
        this.analysisView.clearAnalysis();
        
        // verifica se há análise em cache
        if (this.analysisCache[cultureId]) {
            console.log(`Utilizando análise em cache para cultura #${cultureId}`);
            
            // cria o modelo de análise a partir do cache
            this.currentAnalysisModel = new AnalysisModel(this.analysisCache[cultureId]);
            
            // adiciona notificação de visualização rápida
            const alertContainer = document.getElementById('alert-container');
            alertContainer.innerHTML = `
                <div class="alert alert-info alert-dismissible fade show" role="alert">
                    <i class="fas fa-info-circle me-2"></i>
                    <strong>Visualização rápida:</strong> Você está vendo os dados existentes da cultura. 
                    Para obter dados meteorológicos em tempo real e análises atualizadas, clique em "Atualizar Dados".
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
                </div>
            `;
            
            // mostra botão de atualização
            const refreshBtn = document.getElementById('btn-refresh-analysis');
            if (refreshBtn) {
                refreshBtn.style.display = 'inline-block';
            }
            
            // renderiza a análise
            this.analysisView.renderAnalysis(this.currentAnalysisModel);
            
            // renderiza gráficos
            this.renderCharts();
        } else {
            // se não houver análise em cache, carrega normalmente
            this.loadAnalysis(cultureId);
        }
    }

    /**
     * Carrega a análise para uma cultura específica
     * @param {number} cultureId - ID da cultura
     * @param {boolean} forceRefresh - Se deve forçar o refresh dos dados
     **/
    async loadAnalysis(cultureId, forceRefresh = false) {
        // evita carregamentos simultâneos
        if (this.isLoading) {
            this.uiView.showAlert('Carregamento em andamento, aguarde...', 'info');
            return;
        }
        
        this.isLoading = true;
        
        // mostra a view de análise e exibir carregamento
        if (typeof app !== 'undefined') {
            app.showView('analysis-view');
        }
        
        // IMPORTANTE: Limpar explicitamente a análise anterior antes de mostrar o carregamento
        this.analysisView.clearAnalysis();
        this.analysisView.showLoading();
        
        try {
            // obtém dados da análise da API
            const result = await this.apiService.get(`/cultures/${cultureId}/weather-analysis`, forceRefresh);
            
            console.log("Resposta da API de análise:", result);
            
            if (result.status === 'success' && result.data) {
                // mostra botão de atualização
                const refreshBtn = document.getElementById('btn-refresh-analysis');
                if (refreshBtn) {
                    refreshBtn.style.display = 'inline-block';
                }
                
                // cria modelo de análise
                this.currentAnalysisModel = new AnalysisModel(result.data);
                
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
                        'Dados meteorológicos indisponíveis ou incompletos. Algumas recomendações podem estar limitadas.', 
                        'warning',
                        8000
                    );
                }
            } else {
                // exibe mensagem de erro
                this.analysisView.showSelectionPrompt(result.message || 'Não foi possível carregar a análise');
            }
        } catch (error) {
            console.error('Erro ao carregar análise:', error);
            
            // mostra uma mensagem de erro mais específica
            let errorMessage = `Erro ao carregar análise: ${error.message}`;
            
            if (error.message.includes('Timeout')) {
                errorMessage = 'O servidor demorou muito para responder. Tente novamente mais tarde ou verifique sua conexão.';
            }
            
            this.analysisView.showSelectionPrompt(errorMessage);
            
            // botão de tentativa
            const retryButton = document.createElement('button');
            retryButton.className = 'btn btn-primary mt-3';
            retryButton.textContent = 'Tentar Novamente';
            retryButton.addEventListener('click', () => this.loadAnalysis(cultureId, true));
            
            document.getElementById('analysis-select-prompt').appendChild(retryButton);
        } finally {
            this.isLoading = false;
        }
    }


    
    /**
     * Renderiza todos os gráficos necessários para a análise
     **/
    renderCharts() {
        if (!this.currentAnalysisModel) return;
        
        try {
            // renderiza gráfico de previsão meteorológica
            this.renderWeatherChart();
            
            // renderiza gráfico de desenvolvimento da cultura
            this.renderCultureDevelopmentChart();
        } catch (error) {
            console.error('Erro ao renderizar gráficos:', error);
            this.uiView.showAlert('Não foi possível renderizar os gráficos: ' + error.message, 'warning');
        }
    }
    
    /**
     * Renderiza o gráfico de previsão meteorológica
     **/
    renderWeatherChart() {
        if (!this.currentAnalysisModel || !this.currentAnalysisModel.hasWeatherData()) return;
        
        // extrai dados meteorológicos atuais
        const weatherData = WeatherService.extractWeatherData(
            this.currentAnalysisModel.currentWeather || 
            this.currentAnalysisModel.weatherData
        );
        
        if (!weatherData) return;
        
        // gera dados de previsão simulada com base nos dados atuais
        const forecastData = WeatherService.generateForecastData(weatherData);
        
        // cria gráfico
        ChartUtils.createWeatherForecastChart('weather-chart', forecastData);
    }
    
    /**
     * Renderiza o gráfico de desenvolvimento da cultura
     **/
    renderCultureDevelopmentChart() {
        if (!this.currentAnalysisModel || !this.currentAnalysisModel.isComplete()) return;
        
        // cria gráfico
        ChartUtils.createCultureDevelopmentChart('stats-chart', this.currentAnalysisModel.cultureInfo);
    }
    
    /**
     * Limpa os dados de análise atual
     **/
    clearAnalysis() {
        this.currentAnalysisModel = null;
        this.analysisView.clearAnalysis();
        
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
    }
}

