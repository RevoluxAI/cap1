/* * * *
 *
 * Componente para visualização de dados meteorológicos e seu impacto na agricultura
 *
 * * * */
import { BaseComponent } from './BaseComponent.js';
import { WeatherService } from '../../../services/weather.service.js';

export class WeatherComponent extends BaseComponent {
    /**
     * Inicializa o componente de meteorologia
     * @param {string} currentWeatherId - ID do container para condições atuais
     * @param {string} weatherImpactId - ID do container para impacto agrícola
     **/
    constructor(currentWeatherId = 'current-weather', weatherImpactId = 'weather-impact') {
        super(currentWeatherId);
        this.weatherImpactId = weatherImpactId;
        this.impactContainer = null;
    }

    /**
     * Inicializa o componente, buscando containers no DOM
     * @returns {boolean} - True se a inicialização foi bem sucedida
     **/
    initialize() {
        const result = super.initialize();
        if (!result) return false;

        this.impactContainer = document.getElementById(this.weatherImpactId);
        if (!this.impactContainer) {
            console.error(`Container de impacto meteorológico #${this.weatherImpactId} não encontrado`);
            return false;
        }

        return true;
    }

    /**
     * Renderiza o componente de meteorologia
     * @param {Object} analysisModel - Modelo de análise com dados meteorológicos
     * @returns {boolean} - True se a renderização foi bem sucedida
     **/
    render(analysisModel) {
        if (!this.container || !this.impactContainer) {
            return false;
        }

        if (!analysisModel.hasWeatherData()) {
            this.container.innerHTML = '<div class="alert alert-warning">Nenhum dado meteorológico disponível</div>';
            this.impactContainer.innerHTML = '';
            return false;
        }

        // extrai dados meteorológicos
        const weatherData = WeatherService.extractWeatherData(
            analysisModel.currentWeather || analysisModel.weatherData
        );
        
        if (!weatherData) {
            this.container.innerHTML = '<div class="alert alert-warning">Nenhum dado meteorológico disponível</div>';
            this.impactContainer.innerHTML = '';
            return false;
        }

        // renderiza condições atuais
        this._renderCurrentWeather(weatherData);
        
        // renderiza impacto na agricultura
        const impactData = analysisModel.getAgriculturalImpactScore();
        this._renderWeatherImpact(impactData);

        return true;
    }

    /**
     * Renderiza as condições meteorológicas atuais
     * @param {Object} weatherData - Dados meteorológicos
     * @private
     **/
    _renderCurrentWeather(weatherData) {
        let html = `
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
            
            <!-- análises detalhadas dos parâmetros meteorológicos -->
            <div class="mt-4">
                <h6 class="fw-bold">Análises Detalhadas</h6>
                <div class="row mt-2">
        `;
        
        // adiciona análise de temperatura se disponível
        if (weatherData.temperature_analysis) {
            html += `
                <div class="col-md-4 mb-3">
                    <div class="card h-100">
                        <div class="card-header bg-danger text-white">
                            <h6 class="mb-0"><i class="fas fa-thermometer-half me-2"></i>Temperatura</h6>
                        </div>
                        <div class="card-body">
                            <div class="d-flex justify-content-between mb-2">
                                <span>Status:</span>
                                <span class="badge bg-${WeatherService.getWeatherStatusClass(weatherData.temperature_analysis.status)}">${WeatherService.formatWeatherStatus(weatherData.temperature_analysis.status)}</span>
                            </div>
                            <p class="small">${weatherData.temperature_analysis.impact}</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // adiciona análise de umidade se disponível
        if (weatherData.humidity_analysis) {
            html += `
                <div class="col-md-4 mb-3">
                    <div class="card h-100">
                        <div class="card-header bg-info text-white">
                            <h6 class="mb-0"><i class="fas fa-tint me-2"></i>Umidade</h6>
                        </div>
                        <div class="card-body">
                            <div class="d-flex justify-content-between mb-2">
                                <span>Status:</span>
                                <span class="badge bg-${WeatherService.getWeatherStatusClass(weatherData.humidity_analysis.status)}">${WeatherService.formatWeatherStatus(weatherData.humidity_analysis.status)}</span>
                            </div>
                            <p class="small">${weatherData.humidity_analysis.impact}</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // adiciona análise de vento se disponível
        if (weatherData.wind_analysis) {
            html += `
                <div class="col-md-4 mb-3">
                    <div class="card h-100">
                        <div class="card-header bg-secondary text-white">
                            <h6 class="mb-0"><i class="fas fa-wind me-2"></i>Vento</h6>
                        </div>
                        <div class="card-body">
                            <div class="d-flex justify-content-between mb-2">
                                <span>Status:</span>
                                <span class="badge bg-${WeatherService.getWeatherStatusClass(weatherData.wind_analysis.status)}">${WeatherService.formatWeatherStatus(weatherData.wind_analysis.status)}</span>
                            </div>
                            <p class="small">${weatherData.wind_analysis.impact}</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        html += `
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;
    }

    /**
     * Renderiza o impacto meteorológico na agricultura
     * @param {Object} impactData - Dados de impacto agrícola
     * @private
     **/
    _renderWeatherImpact(impactData) {
        if (!impactData) {
            this.impactContainer.innerHTML = '<div class="alert alert-warning">Informações de impacto agrícola não disponíveis</div>';
            return;
        }

        let html = `
            <div class="mb-3">
                <div class="h5">Avaliação Geral: ${impactData.assessment || 'Desconhecido'}</div>
                <div class="progress mb-2">
                    <div class="progress-bar ${WeatherService.getImpactClass(impactData.assessment)}" style="width: ${((impactData.score || 0) / (impactData.max_score || 20)) * 100}%">
                        ${impactData.score || 0}/${impactData.max_score || 20}
                    </div>
                </div>
            </div>
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>${impactData.recommendations || 'Sem recomendações específicas disponíveis.'}
            </div>
            
            <!-- escala de pontuação para impacto agrícola -->
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
        
        this.impactContainer.innerHTML = html;
        
        // inicializa os tooltips do Bootstrap
        this._initializeTooltips();
    }

    /**
     * Inicializa tooltips do Bootstrap
     * @private
     **/
    _initializeTooltips() {
        const tooltipTriggerList = [].slice.call(this.impactContainer.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    /**
     * Limpa o componente
     **/
    clear() {
        super.clear();
        if (this.impactContainer) {
            this.impactContainer.innerHTML = '';
        }
    }
}

