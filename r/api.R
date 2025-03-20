#!/usr/bin/env Rscript

# script principal para integração com Python

# importar pacote jsonlite primeiro para garantir disponibilidade
if (!require("jsonlite", quietly = TRUE)) {
  install.packages("jsonlite", repos = "https://cran.rstudio.com/")
  library(jsonlite)
}

#=========================================================
# FUNÇÕES AUXILIARES
#=========================================================

# função para logs - envia para stderr
log_info <- function(...) {
  cat(..., file = stderr())
  cat("\n", file = stderr())
}

# obtém diretório do script
get_script_dir <- function() {
  args <- commandArgs(trailingOnly = FALSE)
  script_path <- args[grep("--file=", args)]
  if (length(script_path) == 0) {
    return(getwd())
  } else {
    script_path <- substring(script_path, 8)  # Remover "--file="
    return(dirname(script_path))
  }
}

# carrega pacotes necessários
load_packages <- function() {
  required_packages <- c("jsonlite", "dplyr", "httr")
  for (pkg in required_packages) {
    if (!requireNamespace(pkg, quietly = TRUE)) {
      log_info("Instalando pacote:", pkg)
      install.packages(pkg, repos = "https://cran.rstudio.com/", quiet = TRUE)
    }
    
    # carrega pacote de forma segura
    tryCatch({
      library(pkg, character.only = TRUE)
      log_info("Pacote carregado:", pkg)
    }, error = function(e) {
      log_info("Erro ao carregar pacote", pkg, ":", e$message)
    })
  }
}

# carrega módulos do sistema
load_modules <- function(script_dir) {
  modules <- c("statistical.R", "weather_analysis.R", "recommendations.R")
  
  for (module in modules) {
    module_path <- file.path(script_dir, "modules", module)
    tryCatch({
      source(module_path)
      log_info(paste("Módulo", module, "carregado com sucesso"))
    }, error = function(e) {
      log_info(paste("ERRO ao carregar módulo", module, ":", e$message))
      log_info(paste("Caminho:", module_path))
      # retorna erro em JSON no stdout e encerrar
      cat(jsonlite::toJSON(list(
        status = "error",
        message = paste("Erro ao carregar módulo", module, ":", e$message)
      ), auto_unbox = TRUE, pretty = TRUE))
      quit(status = 1)
    })
  }
}

# função para resumir os dados de entrada
summarize_input <- function(data) {
  if (is.null(data) || length(data) == 0) {
    return(NULL)
  }
  
  # extrai valores numéricos para análise estatística
  numeric_fields <- sapply(data, is.numeric)
  numeric_data <- data[numeric_fields]
  
  if (length(numeric_data) == 0) {
    return(list(message = "Nenhum dado numérico encontrado para análise"))
  }
  
  # calcula estatísticas básicas
  result <- list()
  
  for (field in names(numeric_data)) {
    value <- numeric_data[[field]]
    
    # ignora campos com valores NA
    if (!is.na(value)) {
      result[[field]] <- list(
        mean = value,  # Para um único valor, a média é o próprio valor
        std_dev = 0,   # Para um único valor, o desvio padrão é zero
        min = value,
        max = value
      )
    }
  }
  
  return(result)
}

# função para analisar dados específicos da soja
analyze_soy_data <- function(data) {
  # simulação de análise específica para soja
  return(list(
    productivity_estimate = calculate_soy_productivity(data$area, data$irrigacao),
    optimal_planting_period = get_optimal_planting_period("Soja", data$variedade)
  ))
}

# função para analisar dados específicos da cana-de-açúcar
analyze_sugarcane_data <- function(data) {
  # simulação de análise específica para cana
  return(list(
    productivity_estimate = calculate_sugarcane_productivity(data$area, data$irrigacao, data$ciclo),
    optimal_harvest_period = get_optimal_harvest_period("Cana-de-Açúcar", data$ciclo)
  ))
}

# função para estimar produtividade da soja
calculate_soy_productivity <- function(area, irrigation) {
  # produtividade base em sacas por hectare
  base_productivity <- 50
  
  # ajuste para irrigação
  if (irrigation) {
    base_productivity <- base_productivity * 1.25
  }
  
  # simula variação de produtividade por área
  area_factor <- 1.0
  if (area > 100) {
    area_factor <- 1.05  # economia de escala para áreas maiores
  } else if (area < 10) {
    area_factor <- 0.95  # menor eficiência para áreas muito pequenas
  }
  
  return(list(
    sacas_por_hectare = base_productivity * area_factor,
    total_sacas = base_productivity * area_factor * area
  ))
}

# função para estimar produtividade da cana
calculate_sugarcane_productivity <- function(area, irrigation, cycle) {
  # produtividade base em toneladas por hectare
  base_productivity <- 80
  
  # ajuste para irrigação
  if (irrigation) {
    base_productivity <- base_productivity * 1.3
  }
  
  # ajuste para o ciclo
  cycle_factor <- 1.0
  if (cycle == "longo") {
    cycle_factor <- 1.2
  } else if (cycle == "curto") {
    cycle_factor <- 0.9
  }
  
  return(list(
    toneladas_por_hectare = base_productivity * cycle_factor,
    total_toneladas = base_productivity * cycle_factor * area
  ))
}


#' Obtém o período ideal de plantio ou colheita para diferentes culturas
#'
#' @description
#' Esta função determina o período recomendado de plantio ou colheita com base no tipo de cultura
#' e suas características específicas (variedade ou ciclo).
#'
#' @param culture Character. Tipo de cultura (ex: "Soja", "Cana-de-Açúcar")
#' @param variety Character. Variedade específica ou ciclo da cultura
#'
#' @return Character. Período recomendado para plantio ou colheita
#'
#' @examples
#' get_optimal_planting_period("Soja", "convencional")  # Retorna "Setembro a Novembro"
#' get_optimal_planting_period("Cana-de-Açúcar", "médio")  # Retorna "Fevereiro a Abril"
get_optimal_planting_period <- function(culture, variety = NULL) {
  # normaliza os parâmetros para evitar problemas com maiúsculas/minúsculas
  culture <- tolower(culture)
  if (!is.null(variety)) variety <- tolower(variety)
  
  # definições para cada cultura
  culture_periods <- list(
    "soja" = list(
      period = "Setembro a Novembro",
      description = "Período ideal para plantio em São Paulo"
    ),
    "cana-de-açúcar" = list(
      "curto" = list(
        period = "Fevereiro a Abril",
        harvest_time = "10 meses após plantio"
      ),
      "médio" = list(
        period = "Janeiro a Março",
        harvest_time = "12 meses após plantio"
      ),
      "longo" = list(
        period = "Outubro a Dezembro",
        harvest_time = "18 meses após plantio"
      ),
      # valor padrão para casos não especificados
      "default" = list(
        period = "Janeiro a Março",
        harvest_time = "12 meses após plantio"
      )
    ),
    # valor padrão para culturas não reconhecidas
    "default" = "Período não definido"
  )
  
  # recupera dados da cultura solicitada
  culture_data <- culture_periods[[culture]] %||% culture_periods[["default"]]
  
  # para culturas como soja, retorna o período diretamente
  if (culture == "soja") {
    return(culture_data$period)
  }
  
  # para culturas como cana-de-açúcar, retorna com base na variedade/ciclo
  if (culture == "cana-de-açúcar") {
    # se não for especificada variedade, usa o valor padrão
    if (is.null(variety)) {
      return(culture_data[["default"]]$period)
    }
    
    # se a variedade for reconhecida, retorna o período específico
    if (variety %in% names(culture_data)) {
      return(culture_data[[variety]]$period)
    }
    
    # caso contrário, retorna o período padrão
    return(culture_data[["default"]]$period)
  }
  
  # para culturas não reconhecidas
  return(culture_data)
}

# definição do operador %||% caso não exista no escopo
`%||%` <- function(x, y) {
  if (is.null(x)) y else x
}

# função para obter período ideal de colheita
get_optimal_harvest_period <- function(culture, cycle) {
  if (culture == "Cana-de-Açúcar") {
    if (cycle == "longo") {
      return("18 meses após plantio")
    } else if (cycle == "médio") {
      return("12 meses após plantio")
    } else {
      return("10 meses após plantio")
    }
  }
  
  return("Período não definido")
}

# função para obter dados climáticos
get_current_weather <- function(city, country = NULL, api_key = "b3c61c120b5a0884d33a9b0fd9909756", 
                               api_url = "https://api.openweathermap.org/data/2.5", units = "metric") {
  # validação de entrada
  if (missing(city) || city == "") {
    log_info("City name is required.")
    return(NULL)
  }
  
  # cria string de localização
  location <- ifelse(is.null(country), city, paste0(city, ",", country))
  
  # concatena URL
  url <- paste0(api_url, "/weather")
  
  # parâmetros da requisição
  params <- list(
    q = location,
    appid = api_key,
    units = units
  )
  
  # realiza requisição à API
  response <- tryCatch({
    httr::GET(url, query = params)
  }, error = function(e) {
    log_info("Erro na requisição HTTP:", e$message)
    return(NULL)
  })
  
  if (is.null(response)) {
    return(NULL)
  }
  
  # verifica status
  status <- httr::status_code(response)
  if (status != 200) {
    log_info("Erro na API Weather:", status)
    return(NULL)
  }
  
  # analisa resposta
  content_text <- httr::content(response, "text", encoding = "UTF-8")
  data <- jsonlite::fromJSON(content_text)
  
  # extrai dados relevantes
  main_weather <- NA
  desc_weather <- NA
  
  if (!is.null(data$weather) && length(data$weather) > 0) {
    if (is.data.frame(data$weather)) {
      main_weather <- data$weather$main[1]
      desc_weather <- data$weather$description[1]
    } else if (is.list(data$weather)) {
      main_weather <- data$weather[[1]]$main
      desc_weather <- data$weather[[1]]$description
    }
  }
  
  # estrutura dados em um data frame
  result <- data.frame(
    city = city,
    country = ifelse(is.null(country), data$sys$country, country),
    query_time = format(Sys.time(), "%Y-%m-%d %H:%M:%S"),
    temperature = data$main$temp,
    feels_like = data$main$feels_like,
    temp_min = data$main$temp_min,
    temp_max = data$main$temp_max,
    pressure = data$main$pressure,
    humidity = data$main$humidity,
    visibility = data$visibility,
    wind_speed = data$wind$speed,
    wind_direction = data$wind$deg,
    cloudiness = data$clouds$all,
    main_condition = main_weather,
    description = desc_weather,
    sunrise = format(as.POSIXct(data$sys$sunrise, origin = "1970-01-01"), "%Y-%m-%d %H:%M:%S"),
    sunset = format(as.POSIXct(data$sys$sunset, origin = "1970-01-01"), "%Y-%m-%d %H:%M:%S"),
    stringsAsFactors = FALSE
  )
  
  return(result)
}

# analisa dados meteorológicos sem imprimir nada
analyze_weather <- function(weather_data) {
  # verificar se os dados são válidos
  if (is.null(weather_data) || nrow(weather_data) == 0) {
    return(list(error = "Dados meteorológicos inválidos ou vazios"))
  }
  
  # extrai dados principais
  temperature <- weather_data$temperature[1]
  humidity <- weather_data$humidity[1]
  wind_speed <- weather_data$wind_speed[1]
  main_condition <- weather_data$main_condition[1]
  description <- weather_data$description[1]
  
  # análise da temperatura
  temp_analysis <- analyze_temperature(temperature)
  
  # análise da umidade
  humidity_analysis <- analyze_humidity(humidity)
  
  # análise do vento
  wind_analysis <- analyze_wind(wind_speed)
  
  # analisa condição meteorológica para agricultura
  agro_impact <- assess_weather_impact(
    temperature, 
    humidity, 
    wind_speed, 
    main_condition
  )
  
  # retorna análise completa (sem imprimir)
  return(list(
    temperature = temp_analysis,
    humidity = humidity_analysis,
    wind = wind_analysis,
    condition = list(
      main = main_condition,
      description = description
    ),
    agricultural_impact = agro_impact
  ))
}

# função auxiliar para análise de temperatura
analyze_temperature <- function(temp) {
  if (is.na(temp)) {
    return(list(status = "unknown", impact = "indeterminado"))
  }
  
  status <- if (temp < 0) "extremely_cold"
    else if (temp < 12) "cold"
    else if (temp < 20) "mild"
    else if (temp < 28) "warm"
    else if (temp < 35) "hot"
    else "extremely_hot"
  
  impact <- if (temp < 0) "Alto risco de geada, dano severo às culturas"
    else if (temp < 12) "Crescimento lento para maioria das culturas tropicais"
    else if (temp < 20) "Condições adequadas para maioria das culturas"
    else if (temp < 28) "Condições ótimas para crescimento de culturas tropicais"
    else if (temp < 35) "Possível estresse térmico, aumento da necessidade de irrigação"
    else "Risco de dano às plantas por calor extremo, necessidade crítica de irrigação"
  
  return(list(
    value = temp,
    status = status,
    impact = impact
  ))
}

# função auxiliar para análise de umidade
analyze_humidity <- function(humidity) {
  if (is.na(humidity)) {
    return(list(status = "unknown", impact = "indeterminado"))
  }
  
  status <- if (humidity < 30) "very_dry"
    else if (humidity < 50) "dry"
    else if (humidity < 70) "comfortable"
    else if (humidity < 85) "humid"
    else "very_humid"
  
  impact <- if (humidity < 30) "Alta evapotranspiração, necessidade crítica de irrigação"
    else if (humidity < 50) "Aumento da necessidade de irrigação"
    else if (humidity < 70) "Condições adequadas para maioria das culturas"
    else if (humidity < 85) "Favorável para crescimento, mas com risco moderado de doenças fúngicas"
    else "Alto risco de desenvolvimento de doenças fúngicas e pragas"
  
  return(list(
    value = humidity,
    status = status,
    impact = impact
  ))
}

# função auxiliar para análise de vento
analyze_wind <- function(wind_speed) {
  if (is.na(wind_speed)) {
    return(list(status = "unknown", impact = "indeterminado"))
  }
  
  status <- if (wind_speed < 2) "calm"
    else if (wind_speed < 6) "light"
    else if (wind_speed < 12) "moderate"
    else if (wind_speed < 20) "strong"
    else "very_strong"
  
  impact <- if (wind_speed < 2) "Risco de acúmulo de umidade nas folhas, favorecendo doenças"
    else if (wind_speed < 6) "Condições adequadas para pulverização e polinização"
    else if (wind_speed < 12) "Cuidado com pulverizações, risco moderado de deriva"
    else if (wind_speed < 20) "Evitar pulverização, alto risco de deriva e danos mecânicos"
    else "Não pulverizar, risco extremo de deriva e danos físicos às plantas"
  
  return(list(
    value = wind_speed,
    status = status,
    impact = impact
  ))
}

# avalia impacto geral das condições meteorológicas
assess_weather_impact <- function(temperature, humidity, wind_speed, condition) {
  # pontuação para temperatura
  temp_score <- if (is.na(temperature)) 3
    else if (temperature < 0) 1
    else if (temperature < 12) 2
    else if (temperature < 20) 4
    else if (temperature < 28) 5
    else if (temperature < 35) 3
    else 1
  
  # pontuação para umidade
  humidity_score <- if (is.na(humidity)) 3
    else if (humidity < 30) 2
    else if (humidity < 50) 3
    else if (humidity < 70) 5
    else if (humidity < 85) 4
    else 2
  
  # pontuação para vento
  wind_score <- if (is.na(wind_speed)) 3
    else if (wind_speed < 2) 3
    else if (wind_speed < 6) 5
    else if (wind_speed < 12) 4
    else if (wind_speed < 20) 2
    else 1
  
  # pontuação para condição meteorológica
  condition_score <- if (is.na(condition)) 3
    else if (condition %in% c("Clear", "Clouds")) 5
    else if (condition %in% c("Mist", "Fog", "Haze")) 3
    else if (condition %in% c("Rain", "Drizzle")) 2
    else if (condition %in% c("Thunderstorm", "Snow", "Tornado")) 1
    else 3
  
  # pontuação geral (máximo 20 pontos)
  total_score <- temp_score + humidity_score + wind_score + condition_score
  
  # avaliação geral
  assessment <- if (total_score < 8) "desfavorável"
    else if (total_score < 12) "marginal"
    else if (total_score < 16) "aceitável"
    else if (total_score < 20) "favorável"
    else "ótimo"
  
  # recomendações gerais
  recommendations <- if (total_score < 8) "Evitar atividades de campo. Proteger culturas sensíveis."
    else if (total_score < 12) "Limitar atividades de campo às essenciais. Verificar proteção das culturas."
    else if (total_score < 16) "Condições moderadas para atividades de campo. Monitorar previsão do tempo."
    else if (total_score < 20) "Boas condições para maioria das atividades agrícolas."
    else "Condições ideais para todas as atividades agrícolas."
  
  return(list(
    score = total_score,
    max_score = 20,
    assessment = assessment,
    recommendations = recommendations
  ))
}

# função principal - processa os dados
process_data <- function(input_data) {
  # extrair informações da cultura
  culture_type <- input_data$tipo
  area <- input_data$area
  irrigation <- input_data$irrigacao
  
  # processamento estatístico básico
  results <- list(
    input_summary = summarize_input(input_data),
    weather_analysis = NULL,
    recommendations = NULL
  )
  
  # tenta obter dados meteorológicos
  tryCatch({
    weather_data <- get_current_weather("São Paulo", "BR")
    if (!is.null(weather_data)) {
      # analisa dados meteorológicos
      results$weather_analysis <- analyze_weather(weather_data)
      
      # gera recomendações baseadas nos dados da cultura e clima
      log_info("Gerando recomendações com base nos dados meteorológicos e da cultura")
      rec_result <- generate_recommendations(input_data, weather_data)
      
      if (!is.null(rec_result)) {
        results$recommendations <- rec_result
        log_info("Recomendações geradas com sucesso")
      } else {
        results$recommendations <- list(
          status = "error", 
          error = "Falha ao gerar recomendações"
        )
        log_info("Falha ao gerar recomendações")
      }
    } else {
      results$error <- "Não foi possível obter dados meteorológicos"
      log_info("Não foi possível obter dados meteorológicos")
    }
  }, error = function(e) {
    results$error <- paste("Erro ao processar dados meteorológicos:", e$message)
    log_info("Erro ao processar dados meteorológicos:", e$message)
  })
  
  # calcula estatísticas adicionais para cada tipo de cultura
  if (!is.null(culture_type)) {
    if (culture_type == "Soja") {
      results$soy_specific <- analyze_soy_data(input_data)
    } else if (culture_type == "Cana-de-Açúcar") {
      results$sugarcane_specific <- analyze_sugarcane_data(input_data)
    }
  } else {
    # se não houver tipo de cultura definido, é provavelmente uma execução de teste
    results$test_message <- "Dados recebidos para teste, sem tipo de cultura específico"
  }
  
  # adiciona metadados
  results$metadata <- list(
    timestamp = as.numeric(Sys.time()),
    r_version = R.version$version.string,
    source = "FarmTech R Analysis API"
  )
  
  return(results)
}

# função principal
main <- function() {
  # verificar argumentos da linha de comando
  args <- commandArgs(trailingOnly = TRUE)
  
  if (length(args) < 1) {
    # retorna erro como JSON
    cat(jsonlite::toJSON(list(
      status = "error",
      message = "Nenhum arquivo de entrada fornecido"
    ), auto_unbox = TRUE, pretty = TRUE))
    return(invisible(1))
  }
  
  input_file <- args[1]
  
  # verifica se o arquivo existe
  if (!file.exists(input_file)) {
    # retorna erro como JSON
    cat(jsonlite::toJSON(list(
      status = "error",
      message = paste("Arquivo não encontrado:", input_file)
    ), auto_unbox = TRUE, pretty = TRUE))
    return(invisible(1))
  }
  
  # carrega dados JSON
  tryCatch({
    input_data <- jsonlite::fromJSON(input_file)
    log_info("Dados JSON carregados com sucesso")
    
    # processa dados
    results <- process_data(input_data)
    
    # retorna resultado como JSON no stdout (apenas JSON, nada mais)
    cat(jsonlite::toJSON(results, auto_unbox = TRUE, pretty = TRUE))
    return(invisible(0))
    
  }, error = function(e) {
    # retorna erro como JSON
    cat(jsonlite::toJSON(list(
      status = "error",
      message = paste("Erro ao processar dados:", e$message)
    ), auto_unbox = TRUE, pretty = TRUE))
    return(invisible(1))
  })
}

#=========================================================
# EXECUÇÃO PRINCIPAL
#=========================================================

# SEMPRE use tryCatch para capturar erros
tryCatch({
  # inicia log no stderr
  log_info("Iniciando API FarmTech...")
  
  # obtém diretório do script
  script_dir <- get_script_dir()
  log_info("Diretório do script:", script_dir)
  log_info("Diretório de trabalho atual:", getwd())
  
  # carrega pacotes e módulos
  load_packages()
  
  # gera recomendações baseadas nos dados da cultura e clima
generate_recommendations <- function(culture_data, weather_data) {
  # verifica dados de entrada
  if (is.null(culture_data) || is.null(weather_data)) {
    return(list(
      status = "error",
      error = "Dados de cultura ou clima ausentes"
    ))
  }
  
  # extrai dados meteorológicos
  temperature <- weather_data$temperature[1]
  humidity <- weather_data$humidity[1]
  wind_speed <- weather_data$wind_speed[1]
  main_condition <- weather_data$main_condition[1]
  
  # extrai dados da cultura
  culture_type <- culture_data$tipo
  area <- culture_data$area
  irrigation <- culture_data$irrigacao
  
  # verifica tipo de cultura
  if (is.null(culture_type)) {
    return(list(
      status = "error",
      error = "Tipo de cultura não informado"
    ))
  }
  
  #-----------------------------------------------------------------------
  # 1. Monitoramento e otimização agrícola
  #-----------------------------------------------------------------------
  monitoring_optimization <- list()
  
  # condições para aplicação de defensivos
  can_apply_chemicals <- wind_speed < 10 && 
                        !main_condition %in% c("Rain", "Thunderstorm") &&
                        temperature < 32
  
  # verifica condições para irrigação
  needs_irrigation <- temperature > 25 && 
                     (main_condition %in% c("Clear", "Clouds")) && 
                     humidity < 60
  
  # condições ideais para trabalho de campo
  ideal_fieldwork <- temperature >= 15 && temperature <= 30 &&
                    humidity >= 40 && humidity <= 80 &&
                    wind_speed < 15 &&
                    !main_condition %in% c("Rain", "Thunderstorm", "Snow")
  
  # recomendações específicas para cada tipo de cultura
  if (culture_type == "Soja") {
    # recomendações para soja
    if (temperature > 30) {
      monitoring_optimization$heat_stress <- paste(
        "ALERTA: Temperatura elevada (", temperature, "°C) pode causar estresse térmico na soja. ",
        "Monitorar sinais de murcha e considerar irrigação adicional.", 
        sep=""
      )
    }
    
    if (irrigation) {
      if (needs_irrigation) {
        monitoring_optimization$irrigation_advice <- "Condições atuais favoráveis para irrigação. Recomenda-se manter o cronograma regular."
      } else if (main_condition %in% c("Rain", "Drizzle", "Thunderstorm")) {
        monitoring_optimization$irrigation_advice <- "Precipitação detectada. Suspenda a irrigação para evitar excesso hídrico."
      }
    } else if (needs_irrigation) {
      monitoring_optimization$irrigation_advice <- "Cultura sem sistema de irrigação. Sob as condições atuais, pode haver déficit hídrico."
    }
    
    if (culture_data$variedade == "transgênica") {
      if (culture_data$dosagem_herbicida > 0) {
        if (can_apply_chemicals) {
          monitoring_optimization$herbicide_advice <- paste(
            "Condições favoráveis para aplicação dos ", culture_data$quantidade_herbicida, 
            "L de herbicida. Aplicar preferencialmente no início da manhã ou final da tarde.",
            sep=""
          )
        } else {
          monitoring_optimization$herbicide_advice <- "Condições desfavoráveis para aplicação de herbicida. Considere adiar a aplicação."
        }
      }
    }
    
  } else if (culture_type == "Cana-de-Açúcar") {
    # recomendações para cana-de-açúcar
    if (temperature > 32) {
      monitoring_optimization$heat_stress <- paste(
        "ALERTA: Temperatura elevada (", temperature, "°C) pode reduzir a taxa fotossintética da cana. ",
        "A irrigação é recomendada para reduzir o estresse térmico.", 
        sep=""
      )
    }
    
    if (main_condition %in% c("Clear") && temperature > 27 && humidity < 50) {
      monitoring_optimization$fire_risk <- "ALERTA: Condições de alto risco de incêndio. Verificar aceiros e manter brigada em alerta."
    }
    
    if (irrigation) {
      if (needs_irrigation) {
        monitoring_optimization$irrigation_advice <- paste(
          "Irrigação recomendada. Ideal ", 
          ifelse(temperature > 30, "no período noturno", "no início da manhã"),
          " para maior eficiência.",
          sep=""
        )
      }
    }
  }
  
  # recomendação geral de plantio/colheita
  optimal_time <- if (main_condition %in% c("Rain", "Thunderstorm")) {
    "Condições climáticas desfavoráveis para operações de campo hoje."
  } else if (ideal_fieldwork) {
    "Condições climáticas favoráveis para operações de campo."
  } else {
    "Monitorar previsão do tempo para planejar operações de campo."
  }
  
  monitoring_optimization$field_operations <- optimal_time
  
  #-----------------------------------------------------------------------
  # 2. Avaliação de impacto ambiental
  #-----------------------------------------------------------------------
  environmental_impact <- list()
  
  # risco de deriva de defensivos
  if (culture_data$quantidade_herbicida > 0 || culture_data$quantidade_fertilizante > 0) {
    drift_risk <- if (wind_speed < 3)      "baixo"
                 else if (wind_speed < 8)  "moderado"
                 else if (wind_speed < 15) "alto"
                 else "extremo"
    
    environmental_impact$drift_risk <- paste(
      "Risco ", drift_risk, " de deriva de produtos químicos com vento atual de ", 
      wind_speed, " km/h.", 
      sep=""
    )
    
    if (drift_risk %in% c("alto", "extremo")) {
      environmental_impact$drift_recommendation <- "Recomenda-se adiar aplicações de defensivos ou utilizar tecnologia anti-deriva."
    } else if (drift_risk == "moderado") {
      environmental_impact$drift_recommendation <- "Utilize bicos adequados para reduzir deriva e aplique preferencialmente nas horas mais calmas do dia."
    }
  }
  
  # risco de contaminação de recursos hídricos
  if (main_condition %in% c("Rain", "Thunderstorm") && 
     (culture_data$quantidade_herbicida > 0 || culture_data$quantidade_fertilizante > 0)) {
    environmental_impact$water_contamination <- "ALERTA: Precipitação aumenta risco de lixiviação de produtos químicos para cursos d'água."
    environmental_impact$water_recommendation <- "Evite aplicação de defensivos ou fertilizantes nas próximas 24-48 horas."
  }
  
  # impacto no solo
  if (irrigation && main_condition %in% c("Rain", "Thunderstorm")) {
    environmental_impact$soil_impact <- "ALERTA: Irrigação combinada com precipitação natural pode causar saturação do solo e erosão."
    environmental_impact$soil_recommendation <- "Suspenda irrigação durante evento de chuva para evitar danos ao solo."
  }
  
  #-----------------------------------------------------------------------
  # 3. Registro e análise para tomada de decisão
  #-----------------------------------------------------------------------
  data_analysis <- list()
  
  # métricas importantes para registro
  data_analysis$key_metrics <- list(
    area_hectares = area,
    potential_production = if (culture_type == "Soja") {
      paste(round(area * 50 * (if (irrigation) 1.25 else 1), 1), " sacas totais estimadas")
    } else if (culture_type == "Cana-de-Açúcar") {
      paste(round(area * 80 * (if (irrigation) 1.3 else 1), 1), " toneladas totais estimadas")
    } else {
      "Não calculado"
    },
    insumos_totais = list(
      herbicida = paste(culture_data$quantidade_herbicida, "L"),
      fertilizante = paste(culture_data$quantidade_fertilizante, "kg")
    ),
    linhas_plantio = culture_data$linhas_calculadas,
    metros_lineares = round(culture_data$metros_lineares_total, 2)
  )
  
  # eficiência estimada dos recursos
  efficiency <- list()
  
  if (irrigation) {
    water_efficiency <- culture_data$consumo_agua / area
    efficiency$water_use <- paste(
      "Uso de água: ", round(water_efficiency, 2), " L/ha. ",
      if (water_efficiency > 10000) "Considere otimizar sistema de irrigação para reduzir consumo." 
      else "Consumo dentro dos parâmetros eficientes.",
      sep=""
    )
  }
  
  if (culture_data$quantidade_herbicida > 0) {
    herbicide_efficiency <- culture_data$quantidade_herbicida / area
    efficiency$herbicide_use <- paste(
      "Uso de herbicida: ", round(herbicide_efficiency, 2), " L/ha. ",
      if (herbicide_efficiency > 3) "Dosagem acima do recomendado, verifique a calibração."
      else "Dosagem dentro dos parâmetros recomendados.",
      sep=""
    )
  }
  
  data_analysis$efficiency_metrics <- efficiency
  
  # recomendações para registro contínuo
  data_analysis$monitoring_recommendation <- paste(
    "Recomenda-se registrar diariamente: temperatura, precipitação, umidade do solo e desenvolvimento fenológico da cultura ",
    culture_type, " para comparação histórica e tomada de decisão futura.",
    sep=""
  )
  
  #-----------------------------------------------------------------------
  # 4. Conexão com modelos estatísticos
  #-----------------------------------------------------------------------
  statistical_models <- list()
  
  # previsão simplificada baseada em condições atuais
  if (culture_type == "Soja") {
    development_prediction <- if (temperature > 28 && humidity > 60) {
      "Alta probabilidade de desenvolvimento acelerado, com risco aumentado de doenças fúngicas."
    } else if (temperature > 25) {
      "Desenvolvimento dentro do esperado para as condições climáticas atuais."
    } else {
      "Possível desenvolvimento mais lento devido às temperaturas abaixo do ideal."
    }
    
    statistical_models$development <- development_prediction
    
    # previsão de produtividade baseada em condições atuais
    productivity_factor <- 1.0
    if (irrigation) productivity_factor <- productivity_factor * 1.25
    if (temperature > 30) productivity_factor <- productivity_factor * 0.95
    if (humidity < 40) productivity_factor <- productivity_factor * 0.90
    if (main_condition %in% c("Rain", "Thunderstorm")) productivity_factor <- productivity_factor * 1.05
    
    expected_productivity <- 50 * productivity_factor # sacas/ha base
    
    statistical_models$productivity_forecast <- paste(
      "Produtividade estimada: ", round(expected_productivity, 1), " sacas/ha. ",
      if (productivity_factor < 0.9) "Abaixo do esperado para a região."
      else if (productivity_factor > 1.1) "Acima do esperado para a região."
      else "Dentro da média esperada para a região.",
      sep=""
    )
    
  } else if (culture_type == "Cana-de-Açúcar") {
    development_prediction <- if (temperature > 30 && humidity > 40) {
      "Condições favoráveis ao desenvolvimento vegetativo da cana."
    } else if (temperature < 20) {
      "Temperatura abaixo do ideal pode retardar o desenvolvimento da cultura."
    } else {
      "Desenvolvimento dentro do esperado para as condições atuais."
    }
    
    statistical_models$development <- development_prediction
    
    # previsão de produtividade baseada em condições atuais
    productivity_factor <- 1.0
    if (irrigation) productivity_factor <- productivity_factor * 1.3
    if (temperature > 32) productivity_factor <- productivity_factor * 0.90
    if (humidity < 40) productivity_factor <- productivity_factor * 0.85
    
    expected_productivity <- 80 * productivity_factor # ton/ha base
    
    statistical_models$productivity_forecast <- paste(
      "Produtividade estimada: ", round(expected_productivity, 1), " ton/ha. ",
      if (productivity_factor < 0.9) "Abaixo do esperado para a região."
      else if (productivity_factor > 1.1) "Acima do esperado para a região."
      else "Dentro da média esperada para a região.",
      sep=""
    )
  }
  
  # dados climáticos históricos (simulados)
  historical_comparison <- paste(
    "Temperatura atual de ", temperature, "°C ",
    if (temperature > 28) "está acima" else "está dentro",
    " da média histórica para a região nesta época do ano."
  )
  
  statistical_models$historical_comparison <- historical_comparison
  
  #-----------------------------------------------------------------------
  # Resumo das recomendações
  #-----------------------------------------------------------------------
  summary <- list(
    can_apply_chemicals = can_apply_chemicals,
    needs_irrigation = needs_irrigation,
    ideal_for_fieldwork = ideal_fieldwork
  )
  
  # avaliação geral
  if (can_apply_chemicals && !needs_irrigation) {
    summary$overall_assessment <- "Condições favoráveis para aplicação de defensivos."
  } else if (!can_apply_chemicals && needs_irrigation) {
    summary$overall_assessment <- "Evitar aplicação de defensivos. Considerar irrigação."
  } else if (can_apply_chemicals && needs_irrigation) {
    summary$overall_assessment <- "Condições adequadas para aplicação, mas considere irrigar após."
  } else {
    summary$overall_assessment <- "Monitore as condições para decisões de manejo."
  }
  
  # retorna todas as recomendações estruturadas
  return(list(
    summary = summary,
    monitoring_optimization = monitoring_optimization,
    environmental_impact = environmental_impact,
    data_analysis = data_analysis,
    statistical_models = statistical_models
  ))
}
  
  # executa função principal
  invisible(main())
  
}, error = function(e) {
  # garante que jsonlite esteja disponível para gerar JSON
  json_available <- requireNamespace("jsonlite", quietly = TRUE)
  
  # mensagem de erro para log
  err_msg <- paste("Erro fatal:", e$message)
  log_info(err_msg)
  
  # se jsonlite estiver disponível, usar toJSON
  if (json_available) {
    # garante que mesmo com erros fatais, retorne um JSON válido para stdout
    cat(jsonlite::toJSON(list(
      status = "error",
      message = err_msg,
      traceback = paste(capture.output(traceback()), collapse = "\n")
    ), auto_unbox = TRUE, pretty = TRUE))
  } else {
    # fallback para caso jsonlite não esteja disponível
    cat('{"status":"error","message":"', 
        gsub('"', '\\"', err_msg), 
        '","error":"jsonlite não disponível"}', 
        sep = "")
  }
  
  quit(status = 1)
})

