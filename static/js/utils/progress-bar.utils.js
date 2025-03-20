/* * * *
 *
 * Classe utilitária para cálculos relacionados a barras de progresso
 * Centraliza toda a lógica de visualização de barras de progresso para culturas
 *
 * * * */
export class ProgressBarUtils {
    /**
     * Calcula a largura percentual da barra de progresso de forma intuitiva e uniforme
     * @param {number} value - Valor atual
     * @param {Object} recommended - Objeto com min, max e ideal
     * @param {Object} options - Opções adicionais de configuração
     * @returns {number} - Percentual para largura da barra (0-100)
     **/
    static getProgressWidth(value, recommended, options = {}) {
        // validação básica
        if (!recommended || typeof value !== 'number') {
            return 50; // Valor padrão para casos sem recomendação
        }
        
        const min = recommended.min;
        const max = recommended.max;
        const ideal = recommended.ideal || ((min + max) / 2);
        
        // opções de configuração com valores padrão
        const config = {
            // porcentagem mínima para valores abaixo do recomendado
            minPercentage: options.minPercentage || 5,
            // porcentagem máxima para valores acima do recomendado
            maxPercentage: options.maxPercentage || 100,
            // porcentagem para valores exatamente no ideal
            idealPercentage: options.idealPercentage || 100,
            // porcentagem para valores exatamente no mínimo recomendado
            minRecommendedPercentage: options.minRecommendedPercentage || 75,
            // porcentagem para valores exatamente no máximo recomendado
            maxRecommendedPercentage: options.maxRecommendedPercentage || 95,
            // tipo de cultura (pode afetar os cálculos específicos)
            cultureType: options.cultureType || 'generic'
        };
        
        // se o valor for exatamente igual ao ideal (com tolerância para números flutuantes)
        if (Math.abs(value - ideal) < 0.001) {
            return config.idealPercentage;
        }
        
        // se o valor estiver dentro do intervalo recomendado
        if (value >= min && value <= max) {
            // se estiver exatamente no valor mínimo
            if (Math.abs(value - min) < 0.001) {
                return config.minRecommendedPercentage;
            }
            
            // se estiver exatamente no valor máximo
            if (Math.abs(value - max) < 0.001) {
                return config.maxRecommendedPercentage;
            }
            
            // calcula a posição relativa entre o mínimo e o ideal, ou entre o ideal e o máximo
            if (value < ideal) {
                // entre mínimo e ideal
                const positionRatio = (value - min) / (ideal - min);
                return config.minRecommendedPercentage + 
                       positionRatio * (config.idealPercentage - config.minRecommendedPercentage);
            } else {
                // entre ideal e máximo
                const positionRatio = (value - ideal) / (max - ideal);
                return config.idealPercentage - 
                       positionRatio * (config.idealPercentage - config.maxRecommendedPercentage);
            }
        }
        
        // se o valor estiver abaixo do mínimo recomendado
        if (value < min) {
            // a porcentagem diminui à medida que o valor se distancia do mínimo
            // garante que não fique abaixo da porcentagem mínima
            const ratio = Math.max(0, value / min);
            return Math.max(config.minPercentage, ratio * config.minRecommendedPercentage);
        }
        
        // se o valor estiver acima do máximo recomendado
        // a porcentagem diminui à medida que o valor se distancia do máximo
        const excess = value - max;
        const range = max - min;
        const ratio = Math.min(1, excess / range);
        return Math.max(config.minRecommendedPercentage, 
                       config.maxRecommendedPercentage - (ratio * 30));
    }

    /**
     * Calcula a largura percentual da barra de progresso para área
     * Tratamento especial para casos sem máximo definido
     * @param {number} value - Valor atual da área
     * @param {Object} recommended - Objeto com min, max e ideal
     * @param {Object} options - Opções adicionais de configuração
     * @returns {number} - Percentual para largura da barra (0-100)
     **/
    static getAreaProgressWidth(value, recommended, options = {}) {
        if (!recommended || typeof value !== 'number') {
            return 50; // Valor padrão para casos sem recomendação
        }
        
        // para áreas, se não tiver máximo definido, usamos o próprio valor 
        // como referência ou um múltiplo do mínimo
        const min = recommended.min;
        const max = recommended.max || Math.max(value, min * 5);
        const ideal = recommended.ideal || ((min + max) / 2);
        
        // cria um objeto de recomendação adaptado e usar o método padrão
        const adaptedRecommendation = {
            min: min,
            max: max,
            ideal: ideal
        };
        
        return this.getProgressWidth(value, adaptedRecommendation, options);
    }

    /**
     * Obtém a classe CSS para o status da barra baseado no valor
     * @param {string} status - Status (ex: 'adequado', 'abaixo', 'acima')
     * @returns {string} - Classe CSS correspondente
     **/
    static getStatusClass(status) {
        switch(status) {
            case 'adequado':
            case 'adequada':
                return 'bg-success';
            case 'abaixo':
                return 'bg-warning';
            case 'acima':
                return 'bg-info';
            default:
                return 'bg-primary';
        }
    }
}

