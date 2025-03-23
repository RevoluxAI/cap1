/**
 * Modelo de dados para culturas agrícolas
 * Implementa a lógica de negócio para manipulação de culturas
 */
import { CONFIG } from '../config.js';

export class CultureModel {
    /**
     * Cria um modelo de cultura com os dados fornecidos
     * @param {Object} data - Dados da cultura
     */
    constructor(data = {}) {
        // propriedades básicas
        this.id = data.id || null;
        this.tipo = data.tipo || '';
        this.area = this._parseNumber(data.area, 0);
        this.espacamento = this._parseNumber(data.espacamento, 0);
        this.irrigacao = this._parseBoolean(data.irrigacao);
        this.linhas_calculadas = this._parseNumber(data.linhas_calculadas, 0);
        this.metros_lineares_total = this._parseNumber(data.metros_lineares_total, 0);
        this.quantidade_herbicida = this._parseNumber(data.quantidade_herbicida, 0);
        this.quantidade_fertilizante = this._parseNumber(data.quantidade_fertilizante, 0);
        
        // armazena recomendações para qualquer tipo de cultura
        this.recomendacoes = data.recomendacoes || null;
        
        // campos específicos para cada tipo de cultura
        this._initializeTypeSpecificFields(data);
        
        // validação de tipo para garantir consistência
        this._validateAndCorrectType();
    }
    
    /**
     * Inicializa campos específicos com base no tipo de cultura
     * @param {Object} data - Dados da cultura
     * @private
     */
    _initializeTypeSpecificFields(data) {
        if (this.tipo === CONFIG.CULTURE_TYPES.SOY.NAME) {
            this.variedade = data.variedade || 'convencional';
        } else if (this.tipo === CONFIG.CULTURE_TYPES.SUGARCANE.NAME) {
            this.ciclo = data.ciclo || 'médio';
        }
    }
    
    /**
     * Valida e corrige o tipo de cultura se necessário
     * @private
     */
    _validateAndCorrectType() {
        // se o tipo não estiver definido, tenta inferir do ID
        if (!this.tipo && this.id) {
            const match = String(this.id).match(/^(soja|cana)_/);
            if (match) {
                const typePrefix = match[1];
                this.tipo = typePrefix === 'soja' ? 
                    CONFIG.CULTURE_TYPES.SOY.NAME : 
                    CONFIG.CULTURE_TYPES.SUGARCANE.NAME;
                console.log(`[DEBUG] Tipo inferido do ID: ${this.tipo}`);
            }
        }
        
        // verifica se o tipo está em um formato reconhecido
        const isValidType = this.tipo === CONFIG.CULTURE_TYPES.SOY.NAME || 
                           this.tipo === CONFIG.CULTURE_TYPES.SUGARCANE.NAME;
        
        if (!isValidType && this.variedade) {
            // se tem variedade mas não tipo, provavelmente é soja
            this.tipo = CONFIG.CULTURE_TYPES.SOY.NAME;
            console.log(`[DEBUG] Tipo definido como soja com base na variedade`);
        } else if (!isValidType && this.ciclo) {
            // se tem ciclo mas não tipo, provavelmente é cana-de-açúcar
            this.tipo = CONFIG.CULTURE_TYPES.SUGARCANE.NAME;
            console.log(`[DEBUG] Tipo definido como cana com base no ciclo`);
        }
    }
    
    /**
     * Converte o modelo para um objeto adequado para envio à API
     * @returns {Object} Objeto para API
     */
    toApiObject() {
        try {
            const typeId = this._getCultureTypeId();
            console.log(`[DEBUG] toApiObject: tipo=${this.tipo}, typeId=${typeId}`);
            
            const apiObject = {
                culture_type: typeId,
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
            
            console.log(`[DEBUG] Objeto API completo:`, apiObject);
            return apiObject;
        } catch (e) {
            console.error(`[DEBUG] Erro em toApiObject:`, e);
            // retorna um objeto mínimo válido
            return {
                culture_type: '1', // Padrão para soja
                area: this.area || 0,
                espacamento: this.espacamento || 0,
                irrigacao: false
            };
        }
    }
    
    /**
     * Obtém o ID numérico do tipo de cultura para a API
     * @returns {string} ID do tipo de cultura
     * @private
     */
    _getCultureTypeId() {
        // verifica se o tipo é uma das constantes conhecidas
        if (this.tipo === CONFIG.CULTURE_TYPES.SOY.NAME) {
            return CONFIG.CULTURE_TYPES.SOY.ID;
        } 
        if (this.tipo === CONFIG.CULTURE_TYPES.SUGARCANE.NAME) {
            return CONFIG.CULTURE_TYPES.SUGARCANE.ID;
        }
        
        // se o tipo não for reconhecido, tenta extrair do ID
        if (this.id) {
            const match = String(this.id).match(/^(soja|cana)_/);
            if (match) {
                return match[1] === 'soja' ? 
                    CONFIG.CULTURE_TYPES.SOY.ID : 
                    CONFIG.CULTURE_TYPES.SUGARCANE.ID;
            }
        }
        
        // fallback para soja como padrão
        console.warn(`[DEBUG] Tipo não reconhecido: "${this.tipo}", usando soja como padrão`);
        return CONFIG.CULTURE_TYPES.SOY.ID;
    }
    
    /**
     * Extrai o ID numérico do ID completo da cultura
     * @returns {number|null} Número do ID ou null se não for possível extrair
     */
    getIdNumber() {
        if (!this.id) return null;
        
        const match = String(this.id).match(/^(soja|cana)_(\d+)$/);
        if (match) {
            return parseInt(match[2], 10);
        }
        
        return null;
    }
    
    /**
     * Obtém o prefixo do tipo de cultura para o ID
     * @returns {string} Prefixo do tipo de cultura ("soja" ou "cana")
     */
    getTypePrefix() {
        return this.tipo === CONFIG.CULTURE_TYPES.SOY.NAME ? "soja" : "cana";
    }

    /**
     * Cria um modelo a partir de dados do formulário
     * @param {FormData|Object} formData - Dados do formulário
     * @returns {CultureModel} Nova instância de cultura
     */
    static fromFormData(formData) {
        const data = {};
        
        try {
            // converte FormData em objeto, se necessário
            if (formData instanceof FormData) {
                console.log("[DEBUG] Processando FormData");
                for (const [key, value] of formData.entries()) {
                    data[key] = value;
                    console.log(`[DEBUG] FormData: ${key} = ${value}`);
                }
            } else {
                console.log("[DEBUG] Processando objeto direto");
                Object.assign(data, formData);
            }
            
            // determina tipo de cultura
            const cultureType = data.culture_type || data.tipo;
            console.log(`[DEBUG] Tipo de cultura bruto: ${cultureType}`);
            
            // verifica se cultureType é um dos valores válidos conhecidos
            let tipoNormalizado;
            
            if (cultureType === CONFIG.CULTURE_TYPES.SOY.ID || 
                cultureType === CONFIG.CULTURE_TYPES.SOY.NAME ||
                String(cultureType).toLowerCase() === 'soja' ||
                String(cultureType).toLowerCase() === '1') {
                
                tipoNormalizado = CONFIG.CULTURE_TYPES.SOY.NAME;
            } else if (
                cultureType === CONFIG.CULTURE_TYPES.SUGARCANE.ID || 
                cultureType === CONFIG.CULTURE_TYPES.SUGARCANE.NAME ||
                String(cultureType).toLowerCase() === 'cana-de-açúcar' ||
                String(cultureType).toLowerCase() === 'cana' ||
                String(cultureType).toLowerCase() === '2') {
                
                tipoNormalizado = CONFIG.CULTURE_TYPES.SUGARCANE.NAME;
            } else {
                // fallback para soja se o tipo não for reconhecido
                console.warn(`[DEBUG] Tipo não reconhecido: "${cultureType}", ` + 
                           `usando ${CONFIG.CULTURE_TYPES.SOY.NAME} como padrão`);
                tipoNormalizado = CONFIG.CULTURE_TYPES.SOY.NAME;
            }
            
            data.tipo = tipoNormalizado;
            console.log(`[DEBUG] Tipo normalizado: ${data.tipo}`);
            
            // converte valores para os tipos corretos
            data.area = this._parseNumber(data.area, 0);
            data.espacamento = this._parseNumber(data.espacamento, 0);
            data.irrigacao = this._parseBoolean(data.irrigacao);
            
            // log para debug
            console.log("[DEBUG] Dados convertidos:", data);
            
            return new CultureModel(data);
        } catch (e) {
            console.error("[DEBUG] Erro ao processar dados do formulário:", e);
            
            // tenta criar um modelo mínimo válido em caso de erro
            return new CultureModel({
                tipo: CONFIG.CULTURE_TYPES.SOY.NAME,
                area: 0,
                espacamento: 0,
                irrigacao: false
            });
        }
    }
    
    /**
     * Converte um valor para número de forma segura
     * @param {any} value - Valor a ser convertido
     * @param {number} defaultValue - Valor padrão se a conversão falhar
     * @returns {number} Valor convertido
     * @private
     */
    static _parseNumber(value, defaultValue = 0) {
        if (value === null || value === undefined || value === '') {
            return defaultValue;
        }
        
        const parsed = parseFloat(value);
        return isNaN(parsed) ? defaultValue : parsed;
    }
    
    /**
     * Converte um valor para número de forma segura (método de instância)
     * @param {any} value - Valor a ser convertido
     * @param {number} defaultValue - Valor padrão se a conversão falhar
     * @returns {number} Valor convertido
     * @private
     */
    _parseNumber(value, defaultValue = 0) {
        return CultureModel._parseNumber(value, defaultValue);
    }
    
    /**
     * Converte um valor para booleano de forma consistente
     * @param {any} value - Valor a ser convertido
     * @returns {boolean} Valor convertido para booleano
     * @private
     */
    static _parseBoolean(value) {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
            const normalized = value.toLowerCase().trim();
            return normalized === 'true' || 
                  normalized === 'on' || 
                  normalized === '1' ||
                  normalized === 'sim' ||
                  normalized === 's' ||
                  normalized === 'yes' ||
                  normalized === 'y';
        }
        return !!value;
    }
    
    /**
     * Converte um valor para booleano de forma consistente (método de instância)
     * @param {any} value - Valor a ser convertido
     * @returns {boolean} Valor convertido para booleano
     * @private
     */
    _parseBoolean(value) {
        return CultureModel._parseBoolean(value);
    }

    /**
     * Valida se os dados da cultura são válidos
     * @returns {Object} Objeto com o resultado da validação
     */
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
            } else if (!['curto', 'médio', 'longo'].includes(this.ciclo)) {
                errors.push('O ciclo deve ser curto, médio ou longo');
            }
        } else if (this.tipo === CONFIG.CULTURE_TYPES.SOY.NAME) {
            if (!this.variedade) {
                errors.push('A variedade da soja é obrigatória');
            } else if (!['convencional', 'transgênica'].includes(this.variedade)) {
                errors.push('A variedade deve ser convencional ou transgênica');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

