/* * * *
 *
 * Utilitários para formatação e transformação de dados
 *
 * * * */
export class FormatUtils {
    /**
     * Formata um número com casas decimais
     * @param {number} value - Valor a ser formatado
     * @param {number} decimals - Número de casas decimais
     * @returns {string} Valor formatado
     **/
    static formatNumber(value, decimals = 2) {
        if (value === null || value === undefined) return '0';
        
        return Number(value).toFixed(decimals);
    }
    
    /**
     * Formata um número como valor monetário
     * @param {number} value - Valor a ser formatado
     * @param {string} currency - Símbolo da moeda (padrão: R$)
     * @returns {string} Valor monetário formatado
     **/
    static formatCurrency(value, currency = 'R$') {
        if (value === null || value === undefined) return `${currency} 0,00`;
        
        return `${currency} ${Number(value).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    }
    
    /**
     * Formata uma porcentagem
     * @param {number} value - Valor a ser formatado (ex: 0.75)
     * @param {number} decimals - Número de casas decimais
     * @returns {string} Valor formatado como porcentagem
     **/
    static formatPercent(value, decimals = 1) {
        if (value === null || value === undefined) return '0%';
        
        // Converter para porcentagem (ex: 0.75 -> 75%)
        return `${(value * 100).toFixed(decimals)}%`;
    }
    
    /**
     * Formata uma data
     * @param {string|Date} date - Data a ser formatada
     * @param {string} format - Formato de saída ('short', 'long', 'datetime')
     * @returns {string} Data formatada
     **/
    static formatDate(date, format = 'short') {
        if (!date) return '';
        
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        
        if (format === 'short') {
            return dateObj.toLocaleDateString('pt-BR');
        } else if (format === 'long') {
            return dateObj.toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } else if (format === 'datetime') {
            return dateObj.toLocaleString('pt-BR');
        }
        
        return dateObj.toLocaleDateString('pt-BR');
    }
    
    /**
     * Trunca um texto e adiciona reticências se necessário
     * @param {string} text - Texto a ser truncado
     * @param {number} maxLength - Comprimento máximo
     * @returns {string} Texto truncado
     **/
    static truncateText(text, maxLength = 100) {
        if (!text) return '';
        
        if (text.length <= maxLength) {
            return text;
        }
        
        return text.substring(0, maxLength) + '...';
    }
    
    /**
     * Converte o primeiro caractere de uma string para maiúsculo
     * @param {string} text - Texto a ser capitalizado
     * @returns {string} Texto capitalizado
     **/
    static capitalize(text) {
        if (!text) return '';
        
        return text.charAt(0).toUpperCase() + text.slice(1);
    }
    
    /**
     * Formata um valor em bytes para uma unidade legível (KB, MB, GB)
     * @param {number} bytes - Tamanho em bytes
     * @param {number} decimals - Número de casas decimais
     * @returns {string} Tamanho formatado
     **/
    static formatFileSize(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
    }
    
    /**
     * Formata uma duração em segundos para um formato legível
     * @param {number} seconds - Duração em segundos
     * @returns {string} Duração formatada
     **/
    static formatDuration(seconds) {
        if (seconds < 60) {
            return `${seconds} segundo${seconds !== 1 ? 's' : ''}`;
        }
        
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) {
            return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
        }
        
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        if (remainingMinutes === 0) {
            return `${hours} hora${hours !== 1 ? 's' : ''}`;
        }
        
        return `${hours} hora${hours !==.1 ? 's' : ''} e ${remainingMinutes} minuto${remainingMinutes !== 1 ? 's' : ''}`;
    }
    
    /**
     * Retorna a identificação do tipo de cultura em formato amigável
     * @param {string|number} typeId - ID do tipo de cultura
     * @returns {string} Nome do tipo de cultura
     **/
    static getCultureTypeName(typeId) {
        const types = {
            '1': 'Soja',
            '2': 'Cana-de-Açúcar'
        };
        
        return types[typeId] || 'Desconhecido';
    }
}

