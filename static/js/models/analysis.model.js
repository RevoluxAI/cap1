/* * * *
 *
 * Modelo de dados para análises de culturas
 *
 * * * */
import { CONFIG } from '../config.js';

export class AnalysisModel {
    /**
     * Cria um modelo de análise com os dados fornecidos
     * @param {Object} data - Dados da análise
     **/
    constructor(data = {}) {
        // correção para mapear corretamente cultura_id para cultureId
        this.cultureId = data.cultura_id !== undefined ? data.cultura_id : null;
        this.cultureInfo = data.cultura_info || {};
        this.weatherData = data.weather_data || null;
        this.currentWeather = data.current_weather || null;
        this.weatherAnalysis = data.weather_analysis || null;
        this.recommendations = data.recommendations || null;
        this.sugarcaneRecommendations = data.sugarcane_recommendations || null;
        this.soy_specific = data.soy_specific || null; // Propriedade para dados específicos de soja
        this.productivity = data.productivity || {
            estimate: { value: 0, unit: '', total: 0 },
            optimal_period: 'Não definido'
        };
        this.stats = data.stats || {};
        
        // log para debug
        console.log("AnalysisModel construído:", 
                   "cultureId:", this.cultureId,
                   "cultureInfo length:", Object.keys(this.cultureInfo).length);
    }
    
    /**
     * Verifica se os dados de análise estão completos ou têm as informações mínimas
     * @returns {boolean} True se os dados estiverem completos
     **/
    isComplete() {
        const hasId = this.cultureId !== null && this.cultureId !== undefined;
        const hasInfo = Object.keys(this.cultureInfo).length > 0;
        
        // log para debug
        console.log("isComplete check:", 
                   "hasId:", hasId, 
                   "this.cultureId:", this.cultureId,
                   "hasInfo:", hasInfo);
        
        return hasId && hasInfo;
    }
    
    /**
     * Verifica se existem dados meteorológicos
     * @returns {boolean} True se houver dados meteorológicos
     **/
    hasWeatherData() {
        return this.weatherData !== null || this.currentWeather !== null;
    }
    
    /**
     * Verifica se existem recomendações
     * @returns {boolean} True se houver recomendações
     **/
    hasRecommendations() {
        return this.recommendations !== null;
    }
    
    /**
     * Verifica se tem dados específicos de soja
     * @returns {boolean} True se houver dados específicos para soja
     **/
    hasSoySpecificData() {
        return this.soy_specific !== null && this.isSoy();
    }

    /**
     * Retorna o tipo de cultura
     * @returns {string} Tipo de cultura (Soja, Cana-de-Açúcar, etc.)
     **/
    getCultureType() {
        return this.cultureInfo.tipo || 'Desconhecida';
    }
    
    /**
     * Verifica se a cultura é soja
     * @returns {boolean} True se for soja
     **/
    isSoy() {
        return this.getCultureType() === CONFIG.CULTURE_TYPES.SOY.NAME;
    }

    /**
     * Verifica se a cultura é cana-de-açúcar
     * @returns {boolean} True se for cana-de-açúcar
     **/
    isSugarcane() {
        return this.getCultureType() === CONFIG.CULTURE_TYPES.SUGARCANE.NAME;
    }
    
    /**
     * Retorna as condições atuais de temperatura, umidade e vento
     * @returns {Object} Dados de condições atuais
     **/
    getCurrentConditions() {
        if (!this.currentWeather) return null;
        
        return {
            temperature: this.currentWeather.temperature || 0,
            humidity: this.currentWeather.humidity || 0,
            windSpeed: this.currentWeather.wind_speed || 0,
            condition: this.currentWeather.main_condition || 'Desconhecido',
            description: this.currentWeather.description || ''
        };
    }
    
    /**
     * Retorna o resumo das recomendações
     * @returns {Object|null} Resumo das recomendações ou null
     **/
    getRecommendationSummary() {
        if (!this.recommendations || !this.recommendations.data || !this.recommendations.data.summary) {
            return null;
        }
        
        return this.recommendations.data.summary;
    }
    
    /**
     * Retorna a pontuação de impacto agrícola, se disponível
     * @returns {Object|null} Objeto com pontuação ou null
     **/
    getAgriculturalImpactScore() {
        if (!this.weatherAnalysis || !this.weatherAnalysis.agricultural_impact) {
            if (this.currentWeather && this.currentWeather.agricultural_impact) {
                return this.currentWeather.agricultural_impact;
            }
            return null;
        }
        
        return this.weatherAnalysis.agricultural_impact;
    }
    
    /**
     * Retorna os dados de produtividade formatados
     * @returns {Object} Dados de produtividade
     **/
    getFormattedProductivity() {
        const productivity = this.productivity.estimate || {};
        const cultureType = this.getCultureType();
        
        // se não houver dados de produtividade, cria valores padrão
        if (!productivity.value) {
            const defaultValue = cultureType === CONFIG.CULTURE_TYPES.SOY.NAME ? 50 : 80;
            const defaultUnit = cultureType === CONFIG.CULTURE_TYPES.SOY.NAME ? 'sacas/ha' : 'ton/ha';
            const area = this.cultureInfo.area || 0;
            
            return {
                value: defaultValue,
                unit: defaultUnit,
                total: defaultValue * area,
                totalUnit: defaultUnit.split('/')[0]
            };
        }
        
        // retorna dados formatados
        return {
            value: productivity.value,
            unit: productivity.unit || (cultureType === CONFIG.CULTURE_TYPES.SOY.NAME ? 'sacas/ha' : 'ton/ha'),
            total: productivity.total,
            totalUnit: (productivity.unit || '').split('/')[0]
        };
    }
}

