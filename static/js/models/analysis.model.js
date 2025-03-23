/**
 * Modelo de dados para análises de culturas
 */
import { CONFIG } from '../config.js';

export class AnalysisModel {
    /**
     * Cria um modelo de análise com os dados fornecidos
     * @param {Object} data - Dados da análise
     */
    constructor(data = {}) {
        if (!data || typeof data !== 'object') {
            console.error("Dados de análise inválidos:", data);
            data = {};
        }
        
        // mapeia corretamente cultura_id para cultureId
        this.cultureId = data.cultura_id !== undefined ? data.cultura_id : null;
        
        // garante que cultureInfo é sempre um objeto válido
        this.cultureInfo = data.cultura_info && typeof data.cultura_info === 'object' 
            ? data.cultura_info 
            : {};
            
        // inicializa outras propriedades com valores seguros
        this.weatherData = this._safeObject(data.weather_data);
        this.currentWeather = this._safeObject(data.current_weather);
        this.weatherAnalysis = this._safeObject(data.weather_analysis);
        this.recommendations = this._safeObject(data.recommendations);
        this.sugarcaneRecommendations = this._safeObject(data.sugarcane_recommendations);
        this.soy_specific = this._safeObject(data.soy_specific);
        
        // define estrutura padrão para produtividade
        this.productivity = this._safeObject(data.productivity);
        if (!this.productivity.estimate) {
            this.productivity.estimate = { value: 0, unit: '', total: 0 };
        }
        if (!this.productivity.optimal_period) {
            this.productivity.optimal_period = 'Não definido';
        }
        
        // garante que stats é sempre um objeto válido
        this.stats = this._safeObject(data.stats);
        
        // log para debug
        console.log("AnalysisModel construído:", 
                   "cultureId:", this.cultureId,
                   "cultureInfo length:", 
                   Object.keys(this.cultureInfo).length);
    }
    
    /**
     * Retorna um objeto seguro para propriedades que podem ser nulas/indefinidas
     * @param {Object} obj - Objeto a ser validado
     * @returns {Object} Objeto validado ou objeto vazio
     * @private
     */
    _safeObject(obj) {
        return (obj && typeof obj === 'object') ? obj : {};
    }
    
    /**
     * Verifica se os dados de análise estão completos ou têm as informações mínimas
     * @returns {boolean} True se os dados estiverem completos
     */
    isComplete() {
        // verificações básicas
        if (this.cultureId === null || this.cultureId === undefined) {
            console.log("isComplete: falha - cultureId é null ou undefined");
            return false;
        }
        
        // verifica se é um número válido (para IDs numéricos)
        if (typeof this.cultureId === 'number' && isNaN(this.cultureId)) {
            console.log("isComplete: falha - cultureId é NaN");
            return false;
        }
        
        // verifica se têm informações da cultura
        if (!this.cultureInfo || typeof this.cultureInfo !== 'object' || 
            Object.keys(this.cultureInfo).length === 0) {
            console.log("isComplete: falha - cultureInfo inválido ou vazio");
            return false;
        }
        
        // verifica propriedades essenciais da cultura
        if (!this.cultureInfo.tipo) {
            console.log("isComplete: falha - tipo da cultura não especificado");
            return false;
        }
        
        // verifica se area é um número válido
        if (typeof this.cultureInfo.area !== 'number' || 
            isNaN(this.cultureInfo.area) || 
            this.cultureInfo.area <= 0) {
            console.log("isComplete: falha - área da cultura inválida");
            return false;
        }
        
        // log para debug
        console.log("isComplete: sucesso - modelo de análise completo");
        return true;
    }
    
    /**
     * Verifica se existem dados meteorológicos
     * @returns {boolean} True se houver dados meteorológicos
     */
    hasWeatherData() {
        // verifica weather data
        const hasWeatherData = this.weatherData && 
                              typeof this.weatherData === 'object' && 
                              Object.keys(this.weatherData).length > 0;
                              
        // verifica current weather
        const hasCurrentWeather = this.currentWeather && 
                                 typeof this.currentWeather === 'object' && 
                                 Object.keys(this.currentWeather).length > 0;
        
        // verifica se tem pelo menos um dos dois
        return hasWeatherData || hasCurrentWeather;
    }
    
    /**
     * Verifica se existem recomendações
     * @returns {boolean} True se houver recomendações
     */
    hasRecommendations() {
        return this.recommendations && 
               typeof this.recommendations === 'object' && 
               Object.keys(this.recommendations).length > 0;
    }
    
    /**
     * Verifica se tem dados específicos de soja
     * @returns {boolean} True se houver dados específicos para soja
     */
    hasSoySpecificData() {
        return this.soy_specific && 
               typeof this.soy_specific === 'object' && 
               Object.keys(this.soy_specific).length > 0 && 
               this.isSoy();
    }

    /**
     * Retorna o tipo de cultura
     * @returns {string} Tipo de cultura (Soja, Cana-de-Açúcar, etc.)
     */
    getCultureType() {
        if (!this.cultureInfo || typeof this.cultureInfo !== 'object') {
            console.warn("Dados da cultura inválidos ao obter tipo");
            return 'Desconhecida';
        }
        
        return this.cultureInfo.tipo || 'Desconhecida';
    }
    
    /**
     * Verifica se a cultura é soja
     * @returns {boolean} True se for soja
     */
    isSoy() {
        const cultureType = this.getCultureType();
        
        // verificações adicionais para compatibilidade
        if (typeof cultureType !== 'string') {
            return false;
        }
        
        const normalizedType = cultureType.toLowerCase().trim();
        
        return normalizedType === CONFIG.CULTURE_TYPES.SOY.NAME.toLowerCase() ||
               normalizedType === 'soja';
    }

    /**
     * Verifica se a cultura é cana-de-açúcar
     * @returns {boolean} True se for cana-de-açúcar
     */
    isSugarcane() {
        const cultureType = this.getCultureType();
        
        // verificações adicionais para compatibilidade
        if (typeof cultureType !== 'string') {
            return false;
        }
        
        const normalizedType = cultureType.toLowerCase().trim();
        
        return normalizedType === CONFIG.CULTURE_TYPES.SUGARCANE.NAME.toLowerCase() ||
               normalizedType === 'cana-de-açúcar' ||
               normalizedType === 'cana de açúcar' ||
               normalizedType === 'cana';
    }
    
    /**
     * Retorna as condições atuais de temperatura, umidade e vento
     * @returns {Object|null} Dados de condições atuais
     */
    getCurrentConditions() {
        if (!this.currentWeather || typeof this.currentWeather !== 'object') {
            return null;
        }
        
        return {
            temperature: this._safeNumber(this.currentWeather.temperature),
            humidity: this._safeNumber(this.currentWeather.humidity),
            windSpeed: this._safeNumber(this.currentWeather.wind_speed),
            condition: this.currentWeather.main_condition || 'Desconhecido',
            description: this.currentWeather.description || ''
        };
    }
    
    /**
     * Retorna o resumo das recomendações
     * @returns {Object|null} Resumo das recomendações ou null
     */
    getRecommendationSummary() {
        if (!this.recommendations || 
            !this.recommendations.data || 
            !this.recommendations.data.summary) {
            return null;
        }
        
        return this.recommendations.data.summary;
    }
    
    /**
     * Retorna a pontuação de impacto agrícola, se disponível
     * @returns {Object|null} Objeto com pontuação ou null
     */
    getAgriculturalImpactScore() {
        // verifica em weatherAnalysis
        if (this.weatherAnalysis && 
            this.weatherAnalysis.agricultural_impact) {
            return this.weatherAnalysis.agricultural_impact;
        }
        
        // verifica em currentWeather
        if (this.currentWeather && 
            this.currentWeather.agricultural_impact) {
            return this.currentWeather.agricultural_impact;
        }
        
        // verifica no weatherData
        if (this.weatherData && 
            this.weatherData.agricultural_impact) {
            return this.weatherData.agricultural_impact;
        }
        
        // estrutura aninhada no weatherData
        if (this.weatherData && 
            this.weatherData.data && 
            this.weatherData.data.analysis && 
            this.weatherData.data.analysis.agricultural_impact) {
            return this.weatherData.data.analysis.agricultural_impact;
        }
        
        return null;
    }
    
    /**
     * Retorna os dados de produtividade formatados
     * @returns {Object} Dados de produtividade
     */
    getFormattedProductivity() {
        const productivity = this.productivity && this.productivity.estimate || {};
        const cultureType = this.getCultureType();
        
        // se não houver dados de produtividade, cria valores padrão
        if (!productivity.value) {
            const defaultValue = this.isSoy() ? 50 : 80;
            const defaultUnit = this.isSoy() ? 'sacas/ha' : 'ton/ha';
            const area = this._safeNumber(this.cultureInfo.area);
            
            return {
                value: defaultValue,
                unit: defaultUnit,
                total: defaultValue * area,
                totalUnit: defaultUnit.split('/')[0]
            };
        }
        
        // retorna dados formatados
        const unit = productivity.unit || (this.isSoy() ? 'sacas/ha' : 'ton/ha');
        return {
            value: this._safeNumber(productivity.value),
            unit: unit,
            total: this._safeNumber(productivity.total),
            totalUnit: (unit || '').split('/')[0]
        };
    }
    
    /**
     * Converte um valor para número seguro
     * @param {any} value - Valor a ser convertido
     * @param {number} defaultValue - Valor padrão se inválido
     * @returns {number} Número válido
     * @private
     */
    _safeNumber(value, defaultValue = 0) {
        if (value === null || value === undefined) {
            return defaultValue;
        }
        
        const parsed = parseFloat(value);
        return isNaN(parsed) ? defaultValue : parsed;
    }
}

