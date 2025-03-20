/* * * *
 *
 * Controlador para operações relacionadas a culturas
 *
 * * * */
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
     **/
    loadAnalyzedCultureIds() {
        try {
            const stored = localStorage.getItem('analyzedCultureIds');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error("Erro ao carregar culturas analisadas do localStorage:", error);
            return [];
        }
    }
    
    /**
     * Salva os IDs de culturas analisadas no localStorage
     **/
    saveAnalyzedCultureIds() {
        try {
            localStorage.setItem('analyzedCultureIds', JSON.stringify(this.analyzedCultureIds));
        } catch (error) {
            console.error("Erro ao salvar culturas analisadas no localStorage:", error);
        }
    }
    
    /**
     * Marca uma cultura como analisada e atualiza a interface
     * @param {Number} cultureId - ID da cultura analisada
     **/
    markCultureAsAnalyzed(cultureId) {
        if (!this.analyzedCultureIds.includes(cultureId)) {
            this.analyzedCultureIds.push(cultureId);
            this.saveAnalyzedCultureIds();
            console.log(`Cultura #${cultureId} marcada como analisada`);
            
            // atualizar a renderização da lista para refletir o novo estado
            this.cultureView.renderCulturesList(this.cultures, this.analyzedCultureIds);
        }
    }
    
    /**
     * Inicializa os eventos relacionados a culturas
     **/
    initEvents() {
        // botão Nova Cultura
        document.getElementById('btn-new-culture').addEventListener('click', () => {
            this.showCultureForm();
        });
        
        // botão Cancelar Formulário
        document.getElementById('btn-cancel-form').addEventListener('click', () => {
            this.hideCultureForm();
        });
        
        // alteração no tipo de cultura
        document.getElementById('culture-type').addEventListener('change', (e) => {
            this.cultureView.toggleCultureSpecificFields(e.target.value);
        });
        
        // submissão do formulário
        document.getElementById('culture-data-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCulture();
        });

        // evento de ação de cultura (editar, excluir, analisar, visualizar)
        document.addEventListener('culture:action', (e) => {
            const { action, cultureId } = e.detail;
            
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
            this.markCultureAsAnalyzed(cultureId);
        });
        
        // quando o usuário volta para a página de culturas, garantir lista atualizada
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
     **/

    async loadCultures(forceRefresh = true) {
        this.uiView.showLoading('cultures-list', 'Carregando culturas...');
        
        try {
            // usando forceRefresh = true para garantir dados atualizados após criação/alteração
            const result = await this.apiService.get('/cultures', forceRefresh);
            
            if (result.status === 'success') {
                this.cultures = result.data.map((data, index) => {
                    // cria o modelo com os dados existentes
                    const cultureModel = new CultureModel(data);
                    
                    // se a API não fornecer um ID, use-a uma combinação de índice e tipo para
                    // garante que culturas de tipos diferentes tenham IDs únicos
                    if (!data.id) {
                        // usar uma combinação do tipo e índice como ID para evitar conflitos
                        // soja terá IDs como "soja_0", "soja_1" e Cana como "cana_0", "cana_1"
                        const typePrefix = cultureModel.tipo === CONFIG.CULTURE_TYPES.SOY.NAME ? 
                            "soja" : "cana";
                        cultureModel.id = `${typePrefix}_${index}`;
                    } else {
                        cultureModel.id = data.id;
                    }
                    
                    return cultureModel;
                });
                
                // limpa cache de análise para culturas que não existem mais
                this._cleanupAnalysisCache();
                
                // passa os IDs de culturas analisadas para a view
                this.cultureView.renderCulturesList(this.cultures, this.analyzedCultureIds);
            } else {
                this.uiView.showEmpty(
                    'cultures-list', 
                    result.message || 'Nenhuma cultura encontrada',
                    'warning'
                );
            }
        } catch (error) {
            console.error("Erro ao carregar culturas:", error);
            this.uiView.showError(
                'cultures-list',
                `Erro ao carregar culturas: ${error.message}`
            );
        }
    }

    // novo método para limpar análises em cache de culturas que não existem mais
    _cleanupAnalysisCache() {
        // se não tem o analisador, não limpe o cache
        if (!window.app || !window.app.analysisController) return;
        
        const analysisController = window.app.analysisController;
        const analysisCache = analysisController.analysisCache;
        
        // obtenha os IDs atuais das culturas
        const currentIds = this.cultures.map(culture => culture.id);
        
        // para cada ID no cache de análise
        Object.keys(analysisCache).forEach(cachedId => {
            // se este ID não estiver na lista atual de culturas
            if (!currentIds.includes(cachedId)) {
                console.log(`Removendo análise em cache para cultura não existente: ${cachedId}`);
                delete analysisCache[cachedId];
            } else {
                // verifica se o tipo da cultura no cache corresponde ao tipo atual
                const cachedType = analysisCache[cachedId]?.cultura_info?.tipo;
                const actualCulture = this.cultures.find(c => c.id === cachedId);
                
                if (cachedType && actualCulture && cachedType !== actualCulture.tipo) {
                    console.log(`Removendo análise em cache com tipo incorreto para cultura ${cachedId}`);
                    delete analysisCache[cachedId];
                }
            }
        });
        
        // salva o cache atualizado
        analysisController.saveAnalysisCache();
    }

    /**
     * Salva uma cultura (nova ou atualização)
     **/
    async saveCulture() {
        // obtém dados do formulário
        const formData = new FormData(document.getElementById('culture-data-form'));
        const cultureModel = CultureModel.fromFormData(formData);
        
        // valida dados
        const validation = cultureModel.validate();
        if (!validation.isValid) {
            this.uiView.showAlert(validation.errors.join('<br>'), 'warning');
            return;
        }
        
        // determina se é uma criação ou atualização
        const cultureId = formData.get('culture-id');
        
        try {
            let result;
            
            if (cultureId !== "" && cultureId !== null) {
                // atualiza cultura existente
                console.log("Atualizando cultura existente ID:", cultureId);
                result = await this.apiService.put(
                    `/cultures/${cultureId}`, 
                    cultureModel.toApiObject()
                );
            } else {
                // cria nova cultura
                console.log("Criando nova cultura");
                result = await this.apiService.post(
                    '/cultures', 
                    cultureModel.toApiObject()
                );
            }

            if (result.status === 'success') {
                this.uiView.showAlert(result.message, 'success');
                this.hideCultureForm();
                
                // força atualização da lista com dados frescos após criação/edição
                await this.loadCultures(true);
                
                if (cultureModel.tipo === CONFIG.CULTURE_TYPES.SOY.NAME && result.recommendations) {
                    this.cultureView.showSoybeanRecommendations(result.recommendations, cultureModel);
                } else if (cultureModel.tipo === CONFIG.CULTURE_TYPES.SUGARCANE.NAME && result.recommendations) {
                    this.cultureView.showSugarcaneRecommendations(result.recommendations, cultureModel);
                }
            } else {
                this.uiView.showAlert(result.message, 'warning');
            }
        } catch (error) {
            console.error("Erro ao salvar cultura:", error);
            this.uiView.showAlert(`Erro ao salvar cultura: ${error.message}`, 'danger');
        }
    }
    
    /**
     * Exibe o formulário de cultura
     * @param {Number|null} cultureId - ID da cultura para edição (null para nova cultura)
     **/
    async showCultureForm(cultureId = null) {
        if (cultureId !== null) {
            // carrega dados da cultura para edição
            try {
                const result = await this.apiService.get(`/cultures/${cultureId}`);
                
                if (result.status === 'success') {
                    const culture = new CultureModel(result.data);
                    // importante: define o ID explicitamente para uso na edição
                    culture.id = cultureId;
                    this.cultureView.showCultureForm(culture);
                } else {
                    this.uiView.showAlert(result.message, 'warning');
                }
            } catch (error) {
                console.error("Erro ao carregar cultura para edição:", error);
                this.uiView.showAlert(`Erro ao carregar cultura: ${error.message}`, 'danger');
            }
        } else {
            // formulário para nova cultura
            this.cultureView.showCultureForm();
        }
    }
    
    /**
     * Oculta o formulário de cultura
     **/
    hideCultureForm() {
        this.cultureView.hideCultureForm();
    }
    
    /**
     * Exclui uma cultura
     * @param {Number} cultureId - ID da cultura a ser excluída
     **/
    async deleteCulture(cultureId) {
        // confirma exclusão
        const confirmed = await this.uiView.confirm(
            'Tem certeza que deseja excluir esta cultura?', 
            'Confirmar Exclusão'
        );
        
        if (!confirmed) return;
        
        try {
            const result = await this.apiService.delete(`/cultures/${cultureId}`);
            
            if (result.status === 'success') {
                this.uiView.showAlert(result.message, 'success');
                // força atualização após exclusão
                await this.loadCultures(true);
                
                // limpa o localStorage se a cultura excluída for a última analisada
                const lastCultureId = localStorage.getItem('lastAnalyzedCulture');
                if (lastCultureId === cultureId.toString()) {
                    localStorage.removeItem('lastAnalyzedCulture');
                }
            } else {
                this.uiView.showAlert(result.message, 'warning');
            }
        } catch (error) {
            console.error("Erro ao excluir cultura:", error);
            this.uiView.showAlert(`Erro ao excluir cultura: ${error.message}`, 'danger');
        }
    }
    
    /**
     * Obtém uma cultura pelo ID
     * @param {Number} cultureId - ID da cultura
     * @returns {CultureModel|null} Cultura encontrada ou null
     **/
    getCultureById(cultureId) {
        return this.cultures.find(culture => culture.id === cultureId) || null;
    }
}

