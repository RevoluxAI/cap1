/* * * *
 *
 * Modelo de dados para culturas agrícolas
 *
 * * * */
import { CONFIG } from '../config.js';

export class CultureModel {
    /**
     * Cria um modelo de cultura com os dados fornecidos
     * @param {Object} data - Dados da cultura
     **/
    constructor(data = {}) {
        this.id = data.id || null;
        this.tipo = data.tipo || '';
        this.area = data.area || 0;
        this.espacamento = data.espacamento || 0;
        this.irrigacao = data.irrigacao || false;
        this.linhas_calculadas = data.linhas_calculadas || 0;
        this.metros_lineares_total = data.metros_lineares_total || 0;
        this.quantidade_herbicida = data.quantidade_herbicida || 0;
        this.quantidade_fertilizante = data.quantidade_fertilizante || 0;
        
        // armazenando recomendações para qualquer tipo de cultura
        this.recomendacoes = data.recomendacoes || null;
        
        // campos específicos para cada tipo de cultura
        if (this.tipo === CONFIG.CULTURE_TYPES.SOY.NAME) {
            this.variedade = data.variedade || 'convencional';
        } else if (this.tipo === CONFIG.CULTURE_TYPES.SUGARCANE.NAME) {
            this.ciclo = data.ciclo || 'médio';
        }
    }
    
    /**
     * Converte o modelo para um objeto adequado para envio à API
     * @returns {Object} Objeto para API
     **/
    toApiObject() {
        const apiObject = {
            culture_type: this.tipo === CONFIG.CULTURE_TYPES.SOY.NAME ? CONFIG.CULTURE_TYPES.SOY.ID : CONFIG.CULTURE_TYPES.SUGARCANE.ID,
            area: this.area,
            espacamento: this.espacamento,
            irrigacao: this.irrigacao
        };
        
        // adiciona campos específicos
        if (this.tipo === CONFIG.CULTURE_TYPES.SOY.NAME) {
            apiObject.variedade = this.variedade;
        } else if (this.tipo === CONFIG.CULTURE_TYPES.SUGARCANE.NAME) {
            apiObject.ciclo = this.ciclo;
        }
        
        return apiObject;
    }
    

    /**
     * Cria um modelo a partir de dados do formulário
     * @param {FormData|Object} formData - Dados do formulário
     * @returns {CultureModel} Nova instância de cultura
     **/
    static fromFormData(formData) {
        const data = {};
        
        // converte FormData em objeto, se necessário
        if (formData instanceof FormData) {
            for (const [key, value] of formData.entries()) {
                data[key] = value;
                // log para debug
                console.log(`FormData: ${key} = ${value}`);
            }
        } else {
            Object.assign(data, formData);
        }
        
        // determina tipo de cultura
        const cultureType = data.culture_type || data.tipo;
        data.tipo = cultureType === CONFIG.CULTURE_TYPES.SOY.ID || cultureType === CONFIG.CULTURE_TYPES.SOY.NAME 
            ? CONFIG.CULTURE_TYPES.SOY.NAME 
            : CONFIG.CULTURE_TYPES.SUGARCANE.NAME;
        
        // converte valores
        data.area = parseFloat(data.area) || 0;
        data.espacamento = parseFloat(data.espacamento) || 0;
        data.irrigacao = data.irrigacao === true || data.irrigacao === 'true' || data.irrigacao === 'on';
        
        // log para debug
        console.log("Dados convertidos:", data);
        
        return new CultureModel(data);
    }

    /**
     * Valida se os dados da cultura são válidos
     * @returns {Object} Objeto com o resultado da validação
     **/
    validate() {
        const errors = [];
        
        // valida área
        if (!this.area || this.area <= 0) {
            errors.push('A área deve ser maior que zero');
        }
        
        // valida espaçamento
        if (!this.espacamento || this.espacamento <= 0) {
            errors.push('O espaçamento deve ser maior que zero');
        }
        
        // valida tipo
        if (!this.tipo) {
            errors.push('O tipo de cultura é obrigatório');
        }
        
        // valida campos específicos
        if (this.tipo === CONFIG.CULTURE_TYPES.SUGARCANE.NAME) {
            if (!this.ciclo) {
                errors.push('O ciclo da cana-de-açúcar é obrigatório');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

