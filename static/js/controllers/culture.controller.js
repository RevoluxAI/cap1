/**
 * Controlador para operações relacionadas a culturas
 */
import { CONFIG } from '../config.js';
import { ApiService } from '../services/api.service.js';
import { CultureModel } from '../models/culture.model.js';
import { CultureView } from '../views/culture.view.js';
import { UIView } from '../views/ui.view.js';

export class CultureController {
    constructor() {
        this.apiService = new ApiService();
        this.cultureView = new CultureView();
        this.uiView = new UIView();
        this.cultures = [];
        
        // array para armazenar IDs de culturas já analisadas
        this.analyzedCultureIds = this.loadAnalyzedCultureIds();
        
        // inicializa eventos do controlador
        this.initEvents();
    }
    
    /**
     * Carrega os IDs de culturas analisadas do localStorage
     * @returns {Array} Array de IDs de culturas analisadas
     */
    loadAnalyzedCultureIds() {
        try {
            const stored = localStorage.getItem('analyzedCultureIds');
            const ids = stored ? JSON.parse(stored) : [];
            
            // validação crucial: garantir que é um array válido
            if (!Array.isArray(ids)) {
                console.error("[DEBUG] IDs de culturas analisadas inválidos, usando array vazio");
                return [];
            }
            
            // filtrar quaisquer valores inválidos
            return ids.filter(id => typeof id === 'number' && !isNaN(id));
        } catch (error) {
            console.error("Erro ao carregar culturas analisadas do localStorage:", error);
            return [];
        }
    }
    
    /**
     * Salva os IDs de culturas analisadas no localStorage
     */
    saveAnalyzedCultureIds() {
        try {
            // validação crucial: garantir que é um array válido antes de salvar
            if (!Array.isArray(this.analyzedCultureIds)) {
                console.error("[DEBUG] Tentativa de salvar IDs inválidos, corrigindo para array");
                this.analyzedCultureIds = [];
            }
            
            // filtra quaisquer valores inválidos
            const validIds = this.analyzedCultureIds.filter(id => 
                typeof id === 'number' && !isNaN(id));
                
            localStorage.setItem('analyzedCultureIds', JSON.stringify(validIds));
        } catch (error) {
            console.error("Erro ao salvar culturas analisadas no localStorage:", error);
        }
    }
    
    /**
     * Limpa todos os IDs de culturas analisadas
     * Útil para resetar o estado quando há problemas
     */
    clearAnalyzedCultureIds() {
        this.analyzedCultureIds = [];
        this.saveAnalyzedCultureIds();
        console.log("[DEBUG] IDs de culturas analisadas foram limpos");
    }
    
    /**
     * Redefine completamente os IDs de culturas analisadas
     * com base nas culturas disponíveis atualmente
     */
    resetAnalyzedCultureIds() {
        // verifica se têm culturas para validar
        if (!this.cultures || !Array.isArray(this.cultures) || this.cultures.length === 0) {
            this.clearAnalyzedCultureIds();
            return;
        }
        
        // obtém todos os índices de culturas atuais
        const validCultureIndices = this.cultures.map((_, index) => index);
        
        // redefine para estado vazio
        this.analyzedCultureIds = validCultureIndices;
        this.saveAnalyzedCultureIds();
        
        console.log(`[DEBUG] IDs de culturas analisadas redefinidos para: ` + 
                  `${validCultureIndices}`);
    }
    
    /**
     * Marca uma cultura como analisada e atualiza a interface
     * @param {Number} cultureId - ID da cultura analisada
     */
    markCultureAsAnalyzed(cultureId) {
        // valida o ID antes de adicionar
        if (typeof cultureId !== 'number' || isNaN(cultureId)) {
            console.error(`[DEBUG] ID de cultura inválido: ${cultureId}`);
            return;
        }
        
        // verifica se o ID está dentro do intervalo válido
        if (!this.cultures || cultureId < 0 || cultureId >= this.cultures.length) {
            console.error(`[DEBUG] ID de cultura fora do intervalo: ${cultureId}`);
            return;
        }
        
        // verifica se já está incluído
        if (!this.analyzedCultureIds.includes(cultureId)) {
            this.analyzedCultureIds.push(cultureId);
            this.saveAnalyzedCultureIds();
            console.log(`Cultura #${cultureId} marcada como analisada`);
        }
        
        // atualiza a renderização da lista para refletir o novo estado
        this.cultureView.renderCulturesList(this.cultures, this.analyzedCultureIds);
    }
    
    /**
     * Inicializa os eventos relacionados a culturas
     */
    initEvents() {
        // botão Nova Cultura
        const newCultureBtn = document.getElementById('btn-new-culture');
        if (newCultureBtn) {
            newCultureBtn.addEventListener('click', () => {
                this.showCultureForm();
            });
        }
        
        // botão Cancelar Formulário
        const cancelFormBtn = document.getElementById('btn-cancel-form');
        if (cancelFormBtn) {
            cancelFormBtn.addEventListener('click', () => {
                this.hideCultureForm();
            });
        }
        
        // alteração no tipo de cultura
        const cultureTypeSelect = document.getElementById('culture-type');
        if (cultureTypeSelect) {
            cultureTypeSelect.addEventListener('change', (e) => {
                this.cultureView.toggleCultureSpecificFields(e.target.value);
            });
        }
        
        // submissão do formulário
        const cultureForm = document.getElementById('culture-data-form');
        if (cultureForm) {
            cultureForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveCulture();
            });
        }

        // evento de ação de cultura (editar, excluir, analisar, visualizar)
        document.addEventListener('culture:action', (e) => {
            const { action, cultureId } = e.detail;
            
            if (!action || typeof cultureId !== 'number' || isNaN(cultureId)) {
                console.error("Dados de ação de cultura inválidos:", e.detail);
                return;
            }
            
            if (action === 'edit') {
                this.showCultureForm(cultureId);
            } else if (action === 'delete') {
                this.deleteCulture(cultureId);
            } else if (action === 'analyze') {
                // marca como analisada imediatamente
                this.markCultureAsAnalyzed(cultureId);
                
                // dispara evento para o AnalysisController
                document.dispatchEvent(new CustomEvent('culture:analyze', {
                    detail: { cultureId }
                }));
            } else if (action === 'view') {
                // dispara evento para visualizar análise já existente
                document.dispatchEvent(new CustomEvent('culture:view', {
                    detail: { cultureId }
                }));
            }
        });
            
        // ouve evento do controlador de análise quando uma cultura é analisada
        document.addEventListener('analysis:completed', (e) => {
            const { cultureId } = e.detail;
            
            if (typeof cultureId === 'number' && !isNaN(cultureId)) {
                this.markCultureAsAnalyzed(cultureId);
            }
        });
        
        // quando o usuário volta para a página de culturas
        document.addEventListener('view:changed', (e) => {
            if (e.detail.viewId === 'cultures-view') {
                // atualiza a renderização com as culturas analisadas
                this.cultureView.renderCulturesList(this.cultures, this.analyzedCultureIds);
            }
        });
    }
    
    /**
     * Carrega a lista de culturas da API
     * @param {boolean} forceRefresh - Se deve forçar o refresh dos dados
     */
    async loadCultures(forceRefresh = true) {
        // mostra o indicador de carregamento
        this.uiView.showLoading('cultures-list', 'Carregando culturas...');
        
        try {
            // obtém todos os dados da API, incluindo culturas marcadas como deletadas
            console.log("[DEBUG] Iniciando requisição para obter todas as culturas");
            const result = await this.apiService.get('/cultures/all', forceRefresh);
            console.log("[DEBUG] Resposta recebida:", result);
            
            if (result.status === 'success' && result.data && Array.isArray(result.data)) {
                // mapa para rastrear os próximos IDs disponíveis por tipo
                const nextIds = {
                    soja: 0,
                    cana: 0
                };
                
                // identifica os IDs em uso para cada tipo
                const usedIds = {
                    soja: new Set(),
                    cana: new Set()
                };
                
                // limpa os IDs de culturas analisadas se a lista estiver vazia
                if (result.data.length === 0 || 
                    result.data.filter(d => !d.deleted).length === 0) {
                    console.log("[DEBUG] Lista de culturas vazia, limpando IDs de culturas analisadas");
                    this.clearAnalyzedCultureIds();
                    
                    // renderiza mensagem de "nenhuma cultura"
                    this.cultures = [];
                    this.cultureView.renderCulturesList([], []);
                    return;
                }
                
                // primeiro passo: identifica os IDs já utilizados
                console.log("[DEBUG] Processando IDs existentes...");
                result.data.forEach(data => {
                    // verifica se o item tem um ID válido e não está marcado como deletado
                    if (data.id && !data.deleted) {
                        // extrai o tipo e o número do ID (ex: "soja_2" -> tipo="soja", num=2)
                        const match = String(data.id).match(/^(soja|cana)_(\d+)$/);
                        if (match) {
                            const [, type, numStr] = match;
                            const num = parseInt(numStr, 10);
                            
                            // adiciona ao conjunto de IDs usados
                            usedIds[type].add(num);
                            
                            // atualiza o próximo ID se necessário
                            nextIds[type] = Math.max(nextIds[type], num + 1);
                        }
                    }
                });
                
                // armazena as culturas ativas (não deletadas)
                const activeData = result.data.filter(d => !d.deleted);
                console.log("[DEBUG] Culturas ativas:", activeData.length);
                
                // se não há culturas ativas após a filtragem, mostrar mensagem apropriada
                if (activeData.length === 0) {
                    this.clearAnalyzedCultureIds();
                    this.cultures = [];
                    this.cultureView.renderCulturesList([], []);
                    return;
                }
                
                // segundo passo: cria modelos e atribui IDs
                this.cultures = activeData.map(data => {
                    try {
                        // cria o modelo com os dados existentes
                        const cultureModel = new CultureModel(data);
                        
                        // se a API não fornecer um ID, gera um novo
                        if (!data.id) {
                            const typePrefix = cultureModel.tipo === 
                                CONFIG.CULTURE_TYPES.SOY.NAME ? "soja" : "cana";
                            
                            // procura o primeiro ID não utilizado
                            let idNum = 0;
                            while (usedIds[typePrefix].has(idNum)) {
                                idNum++;
                            }
                            
                            // atribui o ID e marca como usado
                            cultureModel.id = `${typePrefix}_${idNum}`;
                            usedIds[typePrefix].add(idNum);
                            
                            // atualiza o próximo ID se necessário
                            nextIds[typePrefix] = Math.max(nextIds[typePrefix], idNum + 1);
                        } else {
                            cultureModel.id = data.id;
                        }
                        
                        return cultureModel;
                    } catch (err) {
                        console.error("[DEBUG] Erro ao criar modelo para cultura:", err, data);
                        return null;
                    }
                }).filter(model => model !== null); // Remove modelos inválidos
                
                // armazena os próximos IDs para uso futuro
                this.nextCultureIds = nextIds;
                console.log("[DEBUG] Próximos IDs disponíveis:", this.nextCultureIds);
                
                // valida os IDs analisados com base nas culturas atuais
                this._validateAnalyzedCultureIds();
                
                // limpa cache de análise para culturas que não existem mais
                this._cleanupAnalysisCache();
                
                // passa os IDs de culturas analisadas para a view
                console.log("[DEBUG] Renderizando lista de culturas...");
                console.log("[DEBUG] Total de culturas:", this.cultures.length);
                console.log("[DEBUG] IDs analisados válidos:", this.analyzedCultureIds);
                
                this.cultureView.renderCulturesList(this.cultures, this.analyzedCultureIds);
            } else {
                // limpa os IDs de culturas analisadas em caso de erro
                this.clearAnalyzedCultureIds();
                this.cultures = [];
                
                // exibe mensagem de aviso em vez de erro
                console.warn("[DEBUG] Resposta da API não foi sucesso:", result.message);
                
                // atualiza a View com array vazio (trigger para exibir "nenhuma cultura")
                this.cultureView.renderCulturesList([], []);
            }
        } catch (error) {
            // limpa os IDs de culturas analisadas em caso de erro crítico
            this.clearAnalyzedCultureIds();
            this.cultures = [];
            
            console.error("[DEBUG] Erro crítico ao carregar culturas:", error);
            this.uiView.showError(
                'cultures-list',
                `Erro ao carregar culturas: ${error.message}`
            );
        }
    }
    
    /**
     * Valida e ajusta os IDs de culturas analisadas
     * para garantir que são compatíveis com a lista atual de culturas
     * @private
     */
    _validateAnalyzedCultureIds() {
        // se não têm culturas, limpa os IDs analisados
        if (!this.cultures || this.cultures.length === 0) {
            console.log("[DEBUG] Sem culturas, limpando IDs analisados");
            this.clearAnalyzedCultureIds();
            return;
        }
        
        // verifica se analyzedCultureIds é um array válido
        if (!Array.isArray(this.analyzedCultureIds)) {
            console.error("[DEBUG] IDs de culturas analisadas não é um array, redefinindo");
            this.analyzedCultureIds = [];
            return;
        }
        
        // filtra IDs inválidos ou fora do intervalo
        const validIds = this.analyzedCultureIds.filter(id => 
            typeof id === 'number' && 
            !isNaN(id) && 
            id >= 0 && 
            id < this.cultures.length
        );
        
        // verifica se têm inconsistências
        if (validIds.length !== this.analyzedCultureIds.length) {
            console.warn(
                `[DEBUG] Removidos ${this.analyzedCultureIds.length - validIds.length} ` +
                `IDs de culturas analisadas inválidos`
            );
            this.analyzedCultureIds = validIds;
            this.saveAnalyzedCultureIds();
        }
        
        console.log(
            `[DEBUG] IDs de culturas analisadas validados: ` + 
            `${this.analyzedCultureIds.length} de ${this.cultures.length} culturas`
        );
    }

    /**
     * Limpa análises em cache de culturas que não existem mais
     * @private
     */
    _cleanupAnalysisCache() {
        // se não possui o analisador, não limpe o cache
        if (!window.app || !window.app.analysisController) return;
        
        const analysisController = window.app.analysisController;
        const analysisCache = analysisController.analysisCache;
        
        if (!analysisCache || typeof analysisCache !== 'object') {
            console.warn("Cache de análise não disponível ou inválido");
            return;
        }
        
        // obtém os IDs atuais das culturas
        const currentIds = this.cultures.map(culture => culture.id);
        
        // para cada ID no cache de análise
        Object.keys(analysisCache).forEach(cachedId => {
            // verifica se este ID não está na lista atual de culturas
            if (!currentIds.includes(cachedId)) {
                console.log(
                    `Removendo análise em cache para cultura não existente: ${cachedId}`
                );
                delete analysisCache[cachedId];
            } else {
                // verifica se o tipo da cultura no cache corresponde ao tipo atual
                const cachedType = analysisCache[cachedId]?.cultura_info?.tipo;
                const actualCulture = this.cultures.find(c => c.id === cachedId);
                
                if (cachedType && actualCulture && cachedType !== actualCulture.tipo) {
                    console.log(
                        `Removendo análise em cache com tipo incorreto para ${cachedId}`
                    );
                    delete analysisCache[cachedId];
                }
            }
        });
        
        // salva o cache atualizado
        if (typeof analysisController.saveAnalysisCache === 'function') {
            analysisController.saveAnalysisCache();
        }
    }


    /**
     * Salva uma cultura (nova ou atualização)
     */
    async saveCulture() {
        try {
            console.log("[DEBUG] Iniciando salvamento de cultura");
            
            // obtém dados do formulário
            const formElement = document.getElementById('culture-data-form');
            if (!formElement) {
                console.error("[DEBUG] Formulário não encontrado");
                this.uiView.showAlert("Erro: Formulário não encontrado", 'danger');
                return;
            }
            
            const formData = new FormData(formElement);
            
            // log de dados brutos do formulário para depuração
            console.log("[DEBUG] Dados do formulário:");
            for (const [key, value] of formData.entries()) {
                console.log(`- ${key}: ${value}`);
            }
            
            // cria modelo a partir dos dados do formulário
            console.log("[DEBUG] Criando modelo de cultura");
            const cultureModel = CultureModel.fromFormData(formData);
            console.log("[DEBUG] Modelo criado:", cultureModel);
            
            // valida dados
            const validation = cultureModel.validate();
            if (!validation.isValid) {
                console.warn("[DEBUG] Validação falhou:", validation.errors);
                this.uiView.showAlert(validation.errors.join('<br>'), 'warning');
                return;
            }
            
            // determina se é uma criação ou atualização
            const cultureId = formData.get('culture-id');
            
            let result;
            
            if (cultureId !== "" && cultureId !== null) {
                // atualiza cultura existente
                console.log("[DEBUG] Atualizando cultura existente ID:", cultureId);
                
                const apiData = cultureModel.toApiObject();
                console.log("[DEBUG] Dados enviados para API:", apiData);
                
                result = await this.apiService.put(
                    `/cultures/${cultureId}`, 
                    apiData
                );
            } else {
                // cria nova cultura
                console.log("[DEBUG] Criando nova cultura");
                
                // para novas culturas, envia o objeto base
                const apiData = cultureModel.toApiObject();
                
                // se tiver nextCultureIds, sugere o próximo ID
                if (this.nextCultureIds) {
                    // determina o prefixo com base no tipo
                    const typePrefix = cultureModel.tipo === 
                        CONFIG.CULTURE_TYPES.SOY.NAME ? "soja" : "cana";
                    
                    // sugere o ID, mas o backend não é obrigado a usá-lo
                    apiData.suggested_id = 
                        `${typePrefix}_${this.nextCultureIds[typePrefix]}`;
                    console.log("[DEBUG] ID sugerido:", apiData.suggested_id);
                }
                
                console.log("[DEBUG] Dados enviados para API:", apiData);
                result = await this.apiService.post('/cultures', apiData);
            }

            console.log("[DEBUG] Resposta da API:", result);
            
            if (result && result.status === 'success') {
                this.uiView.showAlert(result.message, 'success');
                this.hideCultureForm();
                
                // força atualização da lista com dados frescos após criação/edição
                await this.loadCultures(true);
                
                // mostra recomendações específicas para o tipo de cultura
                if (cultureModel.tipo === CONFIG.CULTURE_TYPES.SOY.NAME && 
                    result.recommendations) {
                    this.cultureView.showSoybeanRecommendations(
                        result.recommendations, 
                        cultureModel
                    );
                } else if (cultureModel.tipo === CONFIG.CULTURE_TYPES.SUGARCANE.NAME && 
                          result.recommendations) {
                    this.cultureView.showSugarcaneRecommendations(
                        result.recommendations, 
                        cultureModel
                    );
                }
            } else {
                console.warn("[DEBUG] API retornou erro:", 
                           result ? result.message : "Resposta inválida");
                this.uiView.showAlert(
                    result && result.message ? 
                        result.message : "Erro ao salvar a cultura", 
                    'warning'
                );
                
                // garante que a interface não fique presa em estado de carregamento
                this.cultureView.renderCulturesList(this.cultures, this.analyzedCultureIds);
            }
        } catch (error) {
            console.error("[DEBUG] Erro crítico ao salvar cultura:", error);
            this.uiView.showAlert(
                `Erro ao salvar cultura: ${error.message}`, 
                'danger'
            );
            
            // garante que a interface não fique presa em estado de carregamento
            this.cultureView.renderCulturesList(this.cultures, this.analyzedCultureIds);
        }
    }
    
    /**
     * Exibe o formulário de cultura
     * @param {Number|null} cultureId - ID da cultura para edição (null para nova cultura)
     */
    async showCultureForm(cultureId = null) {
        if (cultureId !== null) {
            // carrega dados da cultura para edição
            try {
                console.log("[DEBUG] Carregando cultura para edição, ID:", cultureId);
                const result = await this.apiService.get(`/cultures/${cultureId}`);
                console.log("[DEBUG] Dados recebidos:", result);
                
                if (result && result.status === 'success' && result.data) {
                    const culture = new CultureModel(result.data);
                    // define o ID explicitamente para uso na edição
                    culture.id = cultureId;
                    this.cultureView.showCultureForm(culture);
                } else {
                    console.warn("[DEBUG] Erro ao carregar cultura:", 
                               result ? result.message : "Resposta inválida");
                    this.uiView.showAlert(
                        result && result.message ? 
                            result.message : "Erro ao carregar dados da cultura", 
                        'warning'
                    );
                }
            } catch (error) {
                console.error("[DEBUG] Erro crítico ao carregar cultura:", error);
                this.uiView.showAlert(
                    `Erro ao carregar cultura: ${error.message}`, 
                    'danger'
                );
            }
        } else {
            // formulário para nova cultura
            console.log("[DEBUG] Exibindo formulário para nova cultura");
            this.cultureView.showCultureForm();
        }
    }
    
    /**
     * Oculta o formulário de cultura
     */
    hideCultureForm() {
        this.cultureView.hideCultureForm();
    }
    
   
    /**
     * Exclui uma cultura
     * @param {Number} cultureId - ID da cultura a ser excluída
     */
    async deleteCulture(cultureId) {
        try {
            console.log("[DEBUG] Iniciando exclusão de cultura, ID:", cultureId);
            
            // desabilita botões de exclusão para evitar múltiplos cliques
            this._disableDeleteButtons(cultureId);

            // confirma exclusão
            const confirmed = await this.uiView.confirm(
                'Tem certeza que deseja excluir esta cultura?', 
                'Confirmar Exclusão'
            );
            
            if (!confirmed) {
                // reativa botões se o usuário cancelar
                console.log("[DEBUG] Exclusão cancelada pelo usuário");
                this._enableDeleteButtons(cultureId);
                return;
            }
            
            console.log("[DEBUG] Enviando requisição de exclusão para a API");
            const result = await this.apiService.delete(`/cultures/${cultureId}`);
            console.log("[DEBUG] Resposta da API:", result);
            
            if (result && result.status === 'success') {
                this.uiView.showAlert(result.message, 'success');
                
                // limpa o cache de análise para a cultura excluída
                if (window.app && window.app.analysisController) {
                    const analysisController = window.app.analysisController;
                    
                    // obtém o ID da cultura excluída do resultado
                    const removedId = result.data?.removed_id;
                    
                    // remove do cache de análise
                    if (removedId !== undefined && analysisController.analysisCache) {
                        delete analysisController.analysisCache[removedId];
                        if (typeof analysisController.saveAnalysisCache === 'function') {
                            analysisController.saveAnalysisCache();
                        }
                        console.log(`Análise em cache removida para cultura #${removedId}`);
                    }
                    
                    // remove do array de culturas analisadas
                    if (this.analyzedCultureIds.includes(cultureId)) {
                        const index = this.analyzedCultureIds.indexOf(cultureId);
                        if (index > -1) {
                            this.analyzedCultureIds.splice(index, 1);
                            this.saveAnalyzedCultureIds();
                            console.log(`Cultura #${cultureId} removida da lista de analisadas`);
                        }
                    }
                }
                
                // força atualização após exclusão
                await this.loadCultures(true);
                
                // verifica se a cultura excluída é a que está sendo analisada
                if (window.app && 
                    window.app.currentView === 'analysis-view' && 
                    window.app.currentCultureId === cultureId) {
                    
                    // volta para a view de culturas
                    if (typeof window.app.showView === 'function') {
                        window.app.showView('cultures-view');
                    }
                    
                    // mostra mensagem informativa
                    this.uiView.showAlert(
                        'A cultura que estava sendo analisada foi excluída.', 
                        'info'
                    );
                }
            } else {
                // reativa botões em caso de erro
                console.warn("[DEBUG] Erro na exclusão:", 
                           result ? result.message : "Resposta inválida");
                this._enableDeleteButtons(cultureId);
                this.uiView.showAlert(
                    result && result.message ? 
                        result.message : "Erro ao excluir cultura", 
                    'warning'
                );
            }
        } catch (error) {
            // reativa botões em caso de erro
            console.error("[DEBUG] Erro crítico na exclusão:", error);
            this._enableDeleteButtons(cultureId);
            this.uiView.showAlert(
                `Erro ao excluir cultura: ${error.message}`, 
                'danger'
            );
        }
    }

    /**
     * Desabilita os botões de exclusão para evitar múltiplos cliques
     * @param {Number} cultureId - ID da cultura relacionada (opcional)
     * @private
     */
    _disableDeleteButtons(cultureId = null) {
        const selector = cultureId !== null 
            ? `[data-action="delete"][data-culture-id="${cultureId}"]`
            : '[data-action="delete"]';
        
        document.querySelectorAll(selector).forEach(btn => {
            const linkEl = btn.closest('a');
            if (linkEl) {
                linkEl.classList.add('processing');
                linkEl.style.pointerEvents = 'none';
                linkEl.dataset.originalText = linkEl.innerHTML;
                linkEl.innerHTML = 
                    '<i class="fas fa-spinner fa-spin me-1"></i>Excluindo...';
            }
        });
    }

    /**
     * Reativa os botões de exclusão após conclusão da operação
     * @param {Number} cultureId - ID da cultura relacionada (opcional)
     * @private
     */
    _enableDeleteButtons(cultureId = null) {
        const selector = cultureId !== null 
            ? `[data-action="delete"][data-culture-id="${cultureId}"]`
            : '[data-action="delete"]';
        
        document.querySelectorAll(selector).forEach(btn => {
            const linkEl = btn.closest('a');
            if (linkEl) {
                linkEl.classList.remove('processing');
                linkEl.style.pointerEvents = '';
                if (linkEl.dataset.originalText) {
                    linkEl.innerHTML = linkEl.dataset.originalText;
                }
            }
        });
    }

    /**
     * Obtém uma cultura pelo ID
     * @param {Number} cultureId - ID da cultura
     * @returns {CultureModel|null} Cultura encontrada ou null
     */
    getCultureById(cultureId) {
        if (!this.cultures || !Array.isArray(this.cultures)) {
            return null;
        }
        return this.cultures.find(culture => culture.id === cultureId) || null;
    }
}
