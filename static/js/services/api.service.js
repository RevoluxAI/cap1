/* * * *
 *
 * Serviço de API - Responsável por todas as comunicações com o backend
 *
 * * * */
import { CONFIG } from '../config.js';
import { UIView } from '../views/ui.view.js';

export class ApiService {
    constructor() {
        this.baseUrl = CONFIG.API.BASE_URL;
        this.timeout = CONFIG.API.TIMEOUT;
        this.retryCount = CONFIG.API.RETRY_COUNT;
        this.uiView = new UIView();
        
        // cache para requisições
        this.cache = new Map();
        this.cacheDuration = CONFIG.API.CACHE_DURATION;
    }

    /**
     * Verifica se há dados em cache para o endpoint
     * @param {string} endpoint - Endpoint da API
     * @param {Object} options - Opções da requisição
     * @returns {Object|null} Dados em cache ou null
     **/
    getFromCache(endpoint, options) {
        // não usa cache para métodos que modificam dados
        if (options.method && options.method !== 'GET') {
            return null;
        }
        
        const cacheKey = endpoint + (options.body ? JSON.stringify(options.body) : '');
        const cachedData = this.cache.get(cacheKey);
        
        if (cachedData && (Date.now() - cachedData.timestamp < this.cacheDuration)) {
            if (CONFIG.APP.DEBUG) {
                console.log(`Cache hit for: ${endpoint}`);
            }
            return cachedData.data;
        }
        
        return null;
    }
    
    /**
     * Adiciona dados ao cache
     * @param {string} endpoint - Endpoint da API
     * @param {Object} options - Opções da requisição
     * @param {Object} data - Dados a serem armazenados em cache
     **/
    addToCache(endpoint, options, data) {
        // não guarda em cache os métodos que modificam dados
        if (options.method && options.method !== 'GET') {
            return;
        }
        
        const cacheKey = endpoint + (options.body ? JSON.stringify(options.body) : '');
        this.cache.set(cacheKey, {
            data: data,
            timestamp: Date.now()
        });
        
        if (CONFIG.APP.DEBUG) {
            console.log(`Added to cache: ${endpoint}`);
        }
    }
    
    /**
     * Limpa o cache para o endpoint específico ou para todos os endpoints
     * @param {string|null} endpoint - Endpoint específico ou null para limpar todo o cache
     **/
    clearCache(endpoint = null) {
        if (endpoint) {
            // remove apenas entradas que começam com o endpoint
            Array.from(this.cache.keys()).forEach(key => {
                if (key.startsWith(endpoint)) {
                    this.cache.delete(key);
                }
            });
            
            if (CONFIG.APP.DEBUG) {
                console.log(`Cache cleared for: ${endpoint}`);
            }
        } else {
            this.cache.clear();
            if (CONFIG.APP.DEBUG) {
                console.log('All cache cleared');
            }
        }
    }

    /**
     * Realiza uma chamada à API com possibilidade de retentativas
     * @param {string} endpoint - Endpoint da API
     * @param {Object} options - Opções para a requisição
     * @returns {Promise<Object>} Resposta da API
     **/
    async fetch(endpoint, options = {}) {
        // verifica cache primeiro
        const cachedData = this.getFromCache(endpoint, options);
        if (cachedData) {
            return cachedData;
        }
        
        let currentRetry = 0;
        
        while (currentRetry <= this.retryCount) {
            try {
                const url = `${this.baseUrl}${endpoint}`;
                
                // adiciona timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.timeout);
                
                // configura requisição
                const fetchOptions = {
                    ...options,
                    signal: controller.signal
                };
                
                // log para debug
                if (CONFIG.APP.DEBUG) {
                    console.log(`API Request (attempt ${currentRetry + 1}/${this.retryCount + 1}): ${url}`, fetchOptions);
                }
                
                // realiza requisição
                const response = await fetch(url, fetchOptions);
                clearTimeout(timeoutId);
                
                // processa resposta
                const data = await response.json();
                
                // log para debug
                if (CONFIG.APP.DEBUG) {
                    console.log(`API Response: ${url}`, data);
                }
                
                // verifica se a resposta foi bem sucedida
                if (!response.ok) {
                    throw new Error(data.message || 'Erro na requisição');
                }
                
                // armazena em cache
                this.addToCache(endpoint, options, data);
                
                return data;
            } catch (error) {
                // trata erros de timeout
                if (error.name === 'AbortError') {
                    console.error(`Timeout na requisição à API (tentativa ${currentRetry + 1}/${this.retryCount + 1})`);
                    
                    // se for a última tentativa, relança o erro
                    if (currentRetry === this.retryCount) {
                        this.uiView.showAlert('Tempo limite excedido. Verifique sua conexão e tente novamente.', 'danger');
                        throw new Error('Timeout na requisição à API');
                    }
                    
                    // aguarda antes de tentar novamente (backoff exponencial)
                    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, currentRetry)));
                    currentRetry++;
                    continue;
                }
                
                // trata outros erros
                console.error('API Error:', error);
                this.uiView.showAlert(`Erro na API: ${error.message}`, 'danger');
                throw error;
            }
        }
    }

    /* * * *
     *
     * Métodos de conveniência para os diferentes métodos HTTP
     *
     * * * */
    
    /**
     * Realiza uma requisição GET
     * @param {string} endpoint - Endpoint da API
     * @param {boolean} forceRefresh - Forçar atualização (ignorar cache)
     * @returns {Promise<Object>} Resposta da API
     **/
    async get(endpoint, forceRefresh = false) {
        if (forceRefresh) {
            this.clearCache(endpoint);
        }
        return this.fetch(endpoint);
    }

    /**
     * Realiza uma requisição POST
     * @param {string} endpoint - Endpoint da API
     * @param {Object} data - Dados a serem enviados
     * @returns {Promise<Object>} Resposta da API
     **/
    async post(endpoint, data) {
        // limpa cache relacionado ao endpoint após POST
        this.clearCache(endpoint.split('/')[1]);
        
        return this.fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    }

    /**
     * Realiza uma requisição PUT
     * @param {string} endpoint - Endpoint da API
     * @param {Object} data - Dados a serem enviados
     * @returns {Promise<Object>} Resposta da API
     **/
    async put(endpoint, data) {
        // limpa cache relacionado ao endpoint após PUT
        this.clearCache(endpoint.split('/')[1]);
        
        return this.fetch(endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    }

    /**
     * Realiza uma requisição DELETE
     * @param {string} endpoint - Endpoint da API
     * @returns {Promise<Object>} Resposta da API
     **/
    async delete(endpoint) {
        // limpa cache relacionado ao endpoint após DELETE
        this.clearCache(endpoint.split('/')[1]);
        
        return this.fetch(endpoint, {
            method: 'DELETE'
        });
    }
}

