#!/usr/bin/env Rscript

# Módulo de análise meteorológica - versão corrigida

# carrega pacotes necessários de forma segura
load_packages <- function() {
  # lista de pacotes requeridos
  packages <- c("jsonlite", "dplyr", "httr")
  
  # carregar cada pacote
  for (pkg in packages) {
    if (!requireNamespace(pkg, quietly = TRUE)) {
      cat("Instalando ", pkg, "\n", file = stderr())
      install.packages(pkg, repos = "https://cran.rstudio.com/", quiet = TRUE)
    }
    library(pkg, character.only = TRUE)
  }
}

# função para logs - envia para stderr
log_info <- function(...) {
  cat(..., file = stderr())
  cat("\n", file = stderr())
}

# função para obter clima atual
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
    log_info("Fazendo requisição à API Weather para", location)
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
  # verifica se os dados são válidos
  if (is.null(weather_data) || (is.data.frame(weather_data) && nrow(weather_data) == 0)) {
    return(list(error = "Dados meteorológicos inválidos ou vazios"))
  }
  
  # extrai dados principais
  if (is.data.frame(weather_data)) {
    temperature <- weather_data$temperature[1]
    humidity <- weather_data$humidity[1]
    wind_speed <- weather_data$wind_speed[1]
    main_condition <- weather_data$main_condition[1]
    description <- weather_data$description[1]
  } else {
    log_info("Formato de dados meteorológicos não reconhecido")
    return(list(error = "Formato de dados meteorológicos não reconhecido"))
  }
  
  # análise da temperatura
  temp_analysis <- analyze_temperature(temperature)
  
  # análise da umidade
  humidity_analysis <- analyze_humidity(humidity)
  
  # análise do vento
  wind_analysis <- analyze_wind(wind_speed)
  
  # analisar condição meteorológica para agricultura
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

# analisa impacto da temperatura
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

# analisa impacto da umidade
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

# analisa impacto do vento
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

# função principal para processamento de dados meteorológicos
process_weather_data <- function(input_json_file) {
  tryCatch({
    log_info("Processando dados meteorológicos...")
    log_info("Arquivo de entrada:", input_json_file)
    
    # verificar se o arquivo existe
    if (!file.exists(input_json_file)) {
      log_info("ERRO: Arquivo não encontrado:", input_json_file)
      return(list(
        status = "error",
        message = paste("Arquivo não encontrado:", input_json_file)
      ))
    }
    
    # carrega dados JSON
    input_data <- jsonlite::fromJSON(input_json_file)
    log_info("Dados JSON carregados com sucesso")
    
    # determina modo de obtenção dos dados meteorológicos
    if (!is.null(input_data$latitude) && !is.null(input_data$longitude)) {
      log_info("Usando coordenadas para obter dados meteorológicos")
      
      # implementa chamada à API com coordenadas
      # temporariamente usamos São Paulo como fallback
      log_info("NOTA: Consultando para São Paulo como fallback (implementação futura para coordenadas)")
      weather_data <- get_current_weather("São Paulo", "BR")
      
      if (!is.null(weather_data)) {
        analysis <- analyze_weather(weather_data)
        
        result <- list(
          status = "success",
          data = list(
            weather = weather_data,
            analysis = analysis
          )
        )
      } else {
        result <- list(
          status = "error",
          message = "Não foi possível obter dados meteorológicos"
        )
      }
      
    } else if (!is.null(input_data$city)) {
      log_info("Usando cidade para obter dados meteorológicos:", input_data$city)
      
      # se cidade for fornecida, use-a para obter dados meteorológicos
      city <- input_data$city
      country <- input_data$country
      
      weather_data <- get_current_weather(city, country)
      
      if (!is.null(weather_data)) {
        analysis <- analyze_weather(weather_data)
        
        result <- list(
          status = "success",
          data   = list(
            weather  = weather_data,
            analysis = analysis
          )
        )
      } else {
        result <- list(
          status  = "error",
          message = paste("Erro ao obter dados meteorológicos para", city)
        )
      }
      
    } else {
      log_info("Nenhuma localização fornecida, usando São Paulo como padrão")
      
      # se nem coordenadas nem cidade forem fornecidas, usa São Paulo como padrão
      weather_data <- get_current_weather("São Paulo", "BR")
      
      if (!is.null(weather_data)) {
        analysis <- analyze_weather(weather_data)
        
        result <- list(
          status = "success",
          data = list(
            weather = weather_data,
            analysis = analysis,
            note = "Usando São Paulo como localização padrão"
          )
        )
      } else {
        result <- list(
          status = "error",
          message = "Erro ao obter dados meteorológicos para São Paulo"
        )
      }
    }
    
    return(result)

  }, error = function(e) {
    log_info("ERRO:", e$message)
    return(list(
      status = "error",
      message = paste("Erro ao processar dados meteorológicos:", e$message)
    ))
  })
}

#=====================================================
# EXECUÇÃO PRINCIPAL
#=====================================================

# quando executado como script independente
if (!interactive()) {
  # carrega pacotes necessários
  load_packages()
  
  # obtém argumentos de linha de comando
  args <- commandArgs(trailingOnly = TRUE)
  
  # verifica se temos arquivo de entrada
  if (length(args) < 1) {
    log_info("ERRO: Nenhum arquivo de entrada especificado")
    cat(jsonlite::toJSON(list(
      status = "error",
      message = "Nenhum arquivo de entrada especificado"
    ), auto_unbox = TRUE, pretty = TRUE))
    quit(status = 1)
  }
  
  # processa dados meteorológicos
  result <- process_weather_data(args[1])
  
  # envia resultado como JSON para stdout
  cat(jsonlite::toJSON(result, auto_unbox = TRUE, pretty = TRUE))
}

