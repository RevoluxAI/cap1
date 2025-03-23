/**
 * Serviço de API - Responsável por todas as comunicações com o backend
 */
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
        
        // contador de chamadas para depuração
        this._callCounter = 0;
    }

    /**
     * Verifica se há dados em cache para o endpoint
     * @param {string} endpoint - Endpoint da API
     * @param {Object} options - Opções da requisição
     * @returns {Object|null} Dados em cache ou null
     */
    getFromCache(endpoint, options) {
        // não use cache para métodos que modificam dados
        if (options.method && options.method !== 'GET') {
            return null;
        }
        
        const cacheKey = endpoint + (options.body ? JSON.stringify(options.body) : '');
        const cachedData = this.cache.get(cacheKey);
        
        if (cachedData && (Date.now() - cachedData.timestamp < this.cacheDuration)) {
            if (CONFIG.APP.DEBUG) {
                console.log(`[ApiService] Cache hit for: ${endpoint}`);
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
     */
    addToCache(endpoint, options, data) {
        // não guarda em cache métodos que modificam dados
        if (options.method && options.method !== 'GET') {
            return;
        }
        
        const cacheKey = endpoint + (options.body ? JSON.stringify(options.body) : '');
        this.cache.set(cacheKey, {
            data: data,
            timestamp: Date.now()
        });
        
        if (CONFIG.APP.DEBUG) {
            console.log(`[ApiService] Added to cache: ${endpoint}`);
        }
    }
    
    /**
     * Limpa o cache para o endpoint específico ou para todos os endpoints
     * @param {string|null} endpoint - Endpoint específico ou null para limpar todo o cache
     */
    clearCache(endpoint = null) {
        if (endpoint) {
            // remove apenas entradas que começam com o endpoint
            Array.from(this.cache.keys()).forEach(key => {
                if (key.startsWith(endpoint)) {
                    this.cache.delete(key);
                }
            });
            
            if (CONFIG.APP.DEBUG) {
                console.log(`[ApiService] Cache cleared for: ${endpoint}`);
            }
        } else {
            this.cache.clear();
            if (CONFIG.APP.DEBUG) {
                console.log('[ApiService] All cache cleared');
            }
        }
    }

    /**
     * Realiza uma chamada à API com possibilidade de retentativas
     * @param {string} endpoint - Endpoint da API
     * @param {Object} options - Opções para a requisição
     * @returns {Promise<Object>} Resposta da API
     */
    async fetch(endpoint, options = {}) {
        const callId = ++this._callCounter;
        
        console.log(`[ApiService:${callId}] Iniciando chamada para: ${endpoint}`);
        
        // verifica cache primeiro
        const cachedData = this.getFromCache(endpoint, options);
        if (cachedData) {
            console.log(`[ApiService:${callId}] Retornando dados do cache`);
            return cachedData;
        }
        
        let currentRetry = 0;
        
        while (currentRetry <= this.retryCount) {
            try {
                // constrói URL completa
                const url = `${this.baseUrl}${endpoint}`;
                
                // adiciona timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.timeout);
                
                // configura requisição
                const fetchOptions = {
                    ...options,
                    signal: controller.signal
                };
                
                // verifica JSON no body
                if (fetchOptions.body && 
                    !fetchOptions.headers?.['Content-Type']) {
                    
                    if (typeof fetchOptions.body === 'object' && 
                        !(fetchOptions.body instanceof FormData)) {
                        
                        // converte objeto para JSON
                        console.log(`[ApiService:${callId}] Convertendo body para JSON:`, 
                                  fetchOptions.body);
                        
                        fetchOptions.body = JSON.stringify(fetchOptions.body);
                        
                        if (!fetchOptions.headers) {
                            fetchOptions.headers = {};
                        }
                        fetchOptions.headers['Content-Type'] = 'application/json';
                    }
                }
                
                // log para debug
                console.log(`[ApiService:${callId}] Requisição (tentativa ${currentRetry + 1}/` +
                          `${this.retryCount + 1}):`, {
                    url,
                    method: fetchOptions.method || 'GET',
                    headers: fetchOptions.headers,
                    body: fetchOptions.body
                });
                
                // realiza requisição
                console.log(`[ApiService:${callId}] Enviando requisição...`);
                const response = await fetch(url, fetchOptions);
                clearTimeout(timeoutId);
                
                console.log(`[ApiService:${callId}] Status da resposta: ${response.status}`);
                
                // tenta extrair o corpo da resposta
                let data;
                const contentType = response.headers.get('content-type');
                
                if (contentType && contentType.includes('application/json')) {
                    // aguarda resposta JSON
                    data = await response.json();
                } else {
                    // tenta JSON, mas aceita texto em caso de falha
                    try {
                        data = await response.json();
                    } catch (e) {
                        console.log(`[ApiService:${callId}] Não é JSON, tratando como texto`);
                        const text = await response.text();
                        data = { data: text, message: text };
                    }
                }
                
                // log para debug
                console.log(`[ApiService:${callId}] Resposta completa:`, {
                    status: response.status,
                    data
                });
                
                // verifica se a resposta foi bem sucedida
                if (!response.ok) {
                    console.error(`[ApiService:${callId}] Erro HTTP:`, {
                        status: response.status,
                        data
                    });
                    
                    throw new Error(data.message || 
                                  `Erro HTTP ${response.status}: ${response.statusText}`);
                }
                
                // verifica se a resposta tem um status (API customizada)
                if (data && typeof data === 'object' && !data.status) {
                    console.log(`[ApiService:${callId}] Adicionando status success implícito`);
                    data.status = 'success';
                }
                
                // armazena em cache
                this.addToCache(endpoint, options, data);
                
                console.log(`[ApiService:${callId}] Requisição concluída com sucesso`);
                return data;
                
            } catch (error) {
                // trata erros de timeout
                if (error.name === 'AbortError') {
                    console.error(`[ApiService:${callId}] Timeout na requisição (tentativa ` + 
                                `${currentRetry + 1}/${this.retryCount + 1})`);
                    
                    // se for a última tentativa, relança o erro
                    if (currentRetry === this.retryCount) {
                        this.uiView.showAlert(
                            'Tempo limite excedido. Verifique sua conexão e tente novamente.', 
                            'danger'
                        );
                        throw new Error('Timeout na requisição à API');
                    }
                    
                    // aguarda antes de tentar novamente (backoff exponencial)
                    const backoffTime = 1000 * Math.pow(2, currentRetry);
                    console.log(`[ApiService:${callId}] Aguardando ${backoffTime}ms ` + 
                              `antes da próxima tentativa`);
                    
                    await new Promise(resolve => setTimeout(resolve, backoffTime));
                    currentRetry++;
                    continue;
                }
                
                // trata outros erros
                console.error(`[ApiService:${callId}] Erro na requisição:`, error);
                
                // verifica se é a última tentativa
                if (currentRetry === this.retryCount) {
                    // cria uma resposta de erro para manter consistência
                    const errorResponse = {
                        status: 'error',
                        message: error.message || 'Erro desconhecido na comunicação com o servidor',
                        data: null
                    };
                    
                    // na última tentativa, mostra alerta e retorna resposta de erro
                    this.uiView.showAlert(`Erro na API: ${errorResponse.message}`, 'danger');
                    
                    // retorna um objeto de erro estruturado em vez de lançar exceção
                    console.log(`[ApiService:${callId}] Retornando resposta de erro`);
                    return errorResponse;
                }
                
                // aguardar antes de tentar novamente (backoff exponencial)
                const backoffTime = 1000 * Math.pow(2, currentRetry);
                console.log(`[ApiService:${callId}] Aguardando ${backoffTime}ms ` + 
                          `antes da próxima tentativa`);
                
                await new Promise(resolve => setTimeout(resolve, backoffTime));
                currentRetry++;
                continue;
            }
        }
        
        // não deveria chegar aqui, mas por segurança retorna um erro
        return {
            status: 'error',
            message: 'Falha após todas as tentativas',
            data: null
        };
    }

    /**
     * Métodos de conveniência para os diferentes métodos HTTP
     */
    
    /**
     * Realiza uma requisição GET
     * @param {string} endpoint - Endpoint da API
     * @param {boolean} forceRefresh - Forçar atualização (ignorar cache)
     * @returns {Promise<Object>} Resposta da API
     */
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
     */
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
     */
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
     */
    async delete(endpoint) {
        // limpa cache relacionado ao endpoint após DELETE
        this.clearCache(endpoint.split('/')[1]);
        
        return this.fetch(endpoint, {
            method: 'DELETE'
        });
    }
}

