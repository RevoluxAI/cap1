/* * * *
 * FarmTech Solutions
 * Arquivo de configuração e constantes globais
 * * * */

export const CONFIG = {
    // configuração da API
    API: {
        BASE_URL: 'http://localhost:5000/api',
        TIMEOUT: 30000,       // timeout em milissegundos (aumentado para 30 segundos)
        RETRY_COUNT: 2,       // número de tentativas em caso de falha
        CACHE_DURATION: 60000 // duração do cache em milissegundos (1 minuto)
    },
    
    // configurações da aplicação
    APP: {
        VERSION: '1.0.0',
        DEBUG: true
    },
    
    // tipos de cultura
    CULTURE_TYPES: {
        SOY: {
            ID: '1',
            NAME: 'Soja'
        },
        SUGARCANE: {
            ID: '2',
            NAME: 'Cana-de-Açúcar'
        }
    },
    
    // configurações de chart.js
    CHART: {
        COLORS: {
            TEMPERATURE: {
                BORDER: 'rgb(255, 99, 132)',
                BACKGROUND: 'rgba(255, 99, 132, 0.2)'
            },
            HUMIDITY: {
                BORDER: 'rgb(54, 162, 235)',
                BACKGROUND: 'rgba(54, 162, 235, 0.2)'
            },
            WIND: {
                BORDER: 'rgb(75, 192, 192)',
                BACKGROUND: 'rgba(75, 192, 192, 0.2)'
            },
            DEVELOPMENT: {
                BORDER: 'rgba(75, 192, 192, 1)',
                BACKGROUND: 'rgba(75, 192, 192, 0.2)'
            },
            RESOURCES: {
                BORDER: 'rgba(153, 102, 255, 1)',
                BACKGROUND: 'rgba(153, 102, 255, 0.2)'
            },
            PRODUCTIVITY: {
                BORDER: 'rgba(255, 159, 64, 1)',
                BACKGROUND: 'rgba(255, 159, 64, 0.2)'
            }
        }
    }
};

