/* * * *
 *
 * Classe base para componentes de visualização de cultura
 * Centraliza funcionalidades comuns a todos os tipos de cultura
 *
 * * * */
import { BaseComponent } from '../BaseComponent.js';
import { ProgressBarUtils } from '../../../../utils/progress-bar.utils.js';

export class CultureComponent extends BaseComponent {
    /**
     * Inicializa o componente de cultura
     * @param {string} containerId - ID do elemento que conterá o componente
     * @param {string} cultureType - Tipo de cultura (ex: 'Soja', 'Cana-de-Açúcar')
     **/
    constructor(containerId, cultureType) {
        super(containerId);
        this.cultureType = cultureType;
        this.sectionId = `${cultureType.toLowerCase().replace(/[^a-z0-9]/g, '-')}-recommendations-section`;
    }

    /**
     * Verifica se o container da seção já existe, e o cria se necessário
     * @param {string} parentContainerId - ID do container pai (tab)
     * @returns {HTMLElement} - Elemento da seção
     **/
    ensureSection(parentContainerId = 'tab-recommendations') {
        let sectionEl = document.getElementById(this.sectionId);
        
        if (!sectionEl) {
            // verifica se o container pai existe
            const parentContainer = document.getElementById(parentContainerId);
            if (!parentContainer) {
                console.error(`Container pai #${parentContainerId} não encontrado`);
                return null;
            }
            
            // cria seção para recomendações específicas da cultura
            sectionEl = document.createElement('div');
            sectionEl.id = this.sectionId;
            sectionEl.className = 'card mb-4';
            
            // adiciona após o resumo da análise ou no início do container
            const summaryEl = document.getElementById('recommendation-summary');
            if (summaryEl && summaryEl.parentElement && summaryEl.parentElement.parentElement) {
                const parentEl = summaryEl.parentElement.parentElement;
                parentEl.parentNode.insertBefore(sectionEl, parentEl.nextSibling);
            } else {
                // fallback se a estrutura esperada não for encontrada
                parentContainer.appendChild(sectionEl);
            }
        }
        
        return sectionEl;
    }

    /**
     * Obtém a classe CSS para o status baseado no valor
     * Delegando para a classe utilitária centralizada
     * @param {string} status - Status (ex: 'adequado', 'abaixo', 'acima')
     * @returns {string} - Classe CSS correspondente
     **/
    getStatusClass(status) {
        return ProgressBarUtils.getStatusClass(status);
    }

    /**
     * Calcula a largura percentual da barra de progresso
     * Delegando para a classe utilitária centralizada
     * @param {number} value - Valor atual
     * @param {Object} recommended - Objeto com min, max e ideal
     * @param {Object} options - Opções adicionais de configuração
     * @returns {number} - Percentual para largura da barra (0-100)
     **/
    getProgressWidth(value, recommended, options = {}) {
        // adiciona o tipo de cultura às opções
        const enrichedOptions = {
            ...options,
            cultureType: this.cultureType
        };
        return ProgressBarUtils.getProgressWidth(value, recommended, enrichedOptions);
    }

    /**
     * Calcula a largura percentual da barra de progresso para área
     * Delegando para a classe utilitária centralizada
     * @param {number} value - Valor atual
     * @param {Object} recommended - Objeto com min, max e ideal
     * @param {Object} options - Opções adicionais de configuração
     * @returns {number} - Percentual para largura da barra (0-100)
     **/
    getAreaProgressWidth(value, recommended, options = {}) {
        // adiciona o tipo de cultura às opções
        const enrichedOptions = {
            ...options,
            cultureType: this.cultureType
        };
        return ProgressBarUtils.getAreaProgressWidth(value, recommended, enrichedOptions);
    }

    /**
     * Valida se os dados de recomendações estão completos
     * @param {Object} recommendations - Dados de recomendações
     * @returns {boolean} - True se os dados estão completos
     **/
    validateRecommendations(recommendations) {
        // implementação a ser sobrescrita pelas subclasses
        return false;
    }

    /**
     * Renderiza o componente (deve ser implementado pelas subclasses)
     * @param {Object} recommendations - Recomendações específicas da cultura
     * @param {Object} culture - Dados da cultura
     * @returns {boolean} - True se a renderização foi bem sucedida
     **/
    render(recommendations, culture) {
        console.warn('Método render() deve ser implementado pela subclasse');
        return false;
    }
}

