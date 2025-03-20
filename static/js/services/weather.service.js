/* * * *
 *
 * Serviço para processamento de dados meteorológicos
 *
 * * * */
import { CONFIG } from '../config.js';

export class WeatherService {
    /**
     * Extrai dados meteorológicos de diferentes formatos de resposta da API
     * @param {Object} weatherData - Dados meteorológicos da API
     * @returns {Object|null} Dados meteorológicos formatados ou null
     **/
    static extractWeatherData(weatherData) {
        if (!weatherData) return null;
        
        // verifica estrutura aninhada completa
        if (weatherData.data && weatherData.data.weather) {
            if (Array.isArray(weatherData.data.weather) && weatherData.data.weather.length > 0) {
                return weatherData.data.weather[0];
            } else {
                return weatherData.data.weather;
            }
        }
        
        // verifica estrutura simplificada
        if (weatherData.current_weather) {
            return weatherData.current_weather;
        }
        
        // se for um objeto com propriedades típicas de clima, usar diretamente
        if (weatherData.temperature || weatherData.humidity || weatherData.wind_speed) {
            return weatherData;
        }
        
        return null;
    }
    
    /**
     * Extrai dados de análise meteorológica de diferentes formatos
     * @param {Object} weatherData - Dados meteorológicos da API
     * @returns {Object|null} Dados de análise meteorológica ou null
     **/
    static extractWeatherAnalysis(weatherData) {
        if (!weatherData) return null;
        
        // verifica na estrutura aninhada
        if (weatherData.weather_analysis) {
            return weatherData.weather_analysis;
        } 
        
        // verifica em dados diretos
        if (weatherData.current_weather && weatherData.current_weather.agricultural_impact) {
            return {
                agricultural_impact: weatherData.current_weather.agricultural_impact
            };
        } 
        
        // verifica em análise aninhada
        if (weatherData.data && weatherData.data.analysis) {
            return weatherData.data.analysis;
        }
        
        return null;
    }
    
    /**
     * Obtém classe de cor com base no status meteorológico
     * @param {string} status - Status meteorológico
     * @returns {string} Classe CSS de cor
     **/
    static getWeatherStatusClass(status) {
        const statusClasses = {
            'extremely_cold': 'danger',
            'extremely_hot': 'danger',
            'cold': 'warning',
            'hot': 'warning',
            'mild': 'success',
            'warm': 'success',
            'very_dry': 'danger',
            'very_humid': 'danger',
            'dry': 'warning',
            'humid': 'warning',
            'comfortable': 'success',
            'calm': 'success',
            'light': 'success',
            'moderate': 'info',
            'strong': 'warning',
            'very_strong': 'danger'
        };
        
        return statusClasses[status] || 'secondary';
    }
    
    /**
     * Formata o status meteorológico para exibição
     * @param {string} status - Status meteorológico
     * @returns {string} Status formatado
     **/
    static formatWeatherStatus(status) {
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
    
    /**
     * Obtém classe de cor com base na avaliação agrícola
     * @param {string} assessment - Avaliação agrícola
     * @returns {string} Classe CSS de cor
     **/
    static getImpactClass(assessment) {
        const impactClasses = {
            'desfavorável': 'bg-danger',
            'marginal': 'bg-warning',
            'aceitável': 'bg-info',
            'favorável': 'bg-primary',
            'ótimo': 'bg-success'
        };
        
        return impactClasses[assessment] || 'bg-secondary';
    }
    
    /**
     * Gera dados simulados para previsão meteorológica
     * @param {Object} currentWeather - Dados meteorológicos atuais
     * @returns {Object} Dados simulados para previsão
     **/
    static generateForecastData(currentWeather) {
        if (!currentWeather) {
            return null;
        }
        
        const currentTemp = currentWeather.temperature || 0;
        const currentHumidity = currentWeather.humidity || 0;
        const currentWind = currentWeather.wind_speed || 0;
        
        // simula tendência de temperatura (geralmente diminui à noite)
        const temperatureTrend = [
            currentTemp,
            currentTemp * 0.98,
            currentTemp * 0.95,
            currentTemp * 0.93,
            currentTemp * 0.92,
            currentTemp * 0.90
        ];
        
        // simula tendência de umidade (geralmente aumenta à noite)
        const humidityTrend = [
            currentHumidity,
            currentHumidity * 1.02,
            currentHumidity * 1.04,
            currentHumidity * 1.05,
            currentHumidity * 1.06,
            currentHumidity * 1.07
        ].map(value => Math.min(value, 100)); // umidade não pode passar de 100%
        
        // simula tendência de vento (variação aleatória)
        const windTrend = [
            currentWind,
            currentWind + 0.5,
            currentWind + 1.0,
            currentWind + 1.2,
            currentWind + 0.8,
            currentWind + 0.3
        ].map(value => Math.max(value, 0)); // vento não pode ser negativo
        
        return {
            labels: ['Atual', '+1h', '+2h', '+3h', '+4h', '+5h'],
            temperature: temperatureTrend,
            humidity: humidityTrend,
            wind: windTrend
        };
    }
}

