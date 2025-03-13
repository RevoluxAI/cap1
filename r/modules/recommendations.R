#!/usr/bin/env Rscript

# Módulo de recomendações agrícolas baseadas em dados meteorológicos

# carrega pacotes necessários de forma segura
load_packages <- function() {
  # lista de pacotes requeridos
  packages <- c("jsonlite", "dplyr")
  
  # carrega cada pacote
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

# função para gerar recomendações com base nos dados de cultura e condições meteorológicas
generate_recommendations <- function(culture_data, weather_data) {
  # verifica se os dados necessários estão presentes
  if (is.null(culture_data)) {
    log_info("Dados de cultura ausentes")
    return(list(
      error = "Dados de cultura ausentes",
      status = "error"
    ))
  }
  
  # log de depuração para estrutura de dados
  log_info("Estrutura de dados de cultura:")
  for (name in names(culture_data)) {
    log_info(paste0("  ", name, ": ", ifelse(is.atomic(culture_data[[name]]), 
                                             as.character(culture_data[[name]]), 
                                             "objeto complexo")))
  }
  
  log_info("Estrutura de dados meteorológicos:")
  if (!is.null(weather_data)) {
    for (name in names(weather_data)) {
      log_info(paste0("  ", name, ": ", ifelse(is.atomic(weather_data[[name]]), 
                                               as.character(weather_data[[name]]), 
                                               "objeto complexo")))
    }
  } else {
    log_info("  Dados meteorológicos são NULL")
  }
  
  # extrai informações principais da cultura
  culture_type <- culture_data$tipo
  irrigation <- culture_data$irrigacao
  
  # se weather_data tem status de erro ou é NULL, cria recomendações baseadas apenas nos dados da cultura
  if (is.null(weather_data) || (!is.null(weather_data$status) && weather_data$status == "error")) {
    log_info("Dados de clima não disponíveis, gerando recomendações limitadas")
    
    # gera recomendações básicas sem dados de clima
    return(list(
      summary = list(
        message = "Recomendações limitadas devido à falta de dados meteorológicos",
        can_apply_chemicals = NA,
        needs_irrigation = irrigation,
        ideal_for_fieldwork = NA,
        overall_assessment = "Monitorar condições meteorológicas locais para decisões mais precisas."
      ),
      basic = list(
        irrigation = if(irrigation) {
          "Sistema de irrigação já implementado - monitorar necessidade hídrica da cultura."
        } else {
          "Considerar implementação de sistema de irrigação para melhorar produtividade."
        },
        chemicals_application = "Verificar previsão do tempo antes de aplicar defensivos.",
        fieldwork = "Planejar atividades de campo com base na previsão meteorológica local."
      ),
      specific = get_culture_specific_recommendations(culture_data)
    ))
  }
  
  # tente extrair valores meteorológicos diretamente
  # para compatibilidade com diferentes estruturas, tente diferentes caminhos
  temperature <- NULL
  humidity <- NULL
  wind_speed <- NULL
  main_condition <- NULL
  
  # verifica acesso direto
  if (!is.null(weather_data$temperature)) temperature <- weather_data$temperature
  if (!is.null(weather_data$humidity)) humidity <- weather_data$humidity
  if (!is.null(weather_data$wind_speed)) wind_speed <- weather_data$wind_speed
  if (!is.null(weather_data$main_condition)) main_condition <- weather_data$main_condition
  
  # se dados de clima estão completos
  if (!is.null(temperature) && !is.null(humidity) && !is.null(wind_speed) && !is.null(main_condition)) {
    log_info(paste("Dados meteorológicos extraídos com sucesso: temperatura =", temperature, 
                 "umidade =", humidity, "vento =", wind_speed, 
                 "condição =", main_condition))
    
    # verifica condições para aplicação de defensivos
    can_apply_chemicals <- wind_speed < 10 && !main_condition %in% c("Rain", "Thunderstorm")
    
    # verifica condições para irrigação
    needs_irrigation <- temperature > 25 && main_condition %in% c("Clear", "Clouds") && humidity < 60
    
    # recomendações básicas
    basic_recs <- get_basic_recommendations(temperature, humidity, wind_speed, main_condition)
    
    # recomendações específicas para a cultura
    specific_recs <- get_culture_specific_recommendations(culture_data)
    
    # recomendações de manejo de insumos
    input_recs <- get_input_management_recommendations(culture_data, 
                                                     temperature, 
                                                     humidity, 
                                                     wind_speed, 
                                                     main_condition)
    
    # resumo
    summary <- list(
      can_apply_chemicals = can_apply_chemicals,
      needs_irrigation = needs_irrigation,
      ideal_for_fieldwork = is_ideal_for_fieldwork(temperature, humidity, wind_speed, main_condition)
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
    
    # recomendações adicionais com base nos dados da cultura
    area <- culture_data$area
    tipo <- culture_data$tipo
    
    # calcula estimativas de produção
    production_estimate <- if (tipo == "Soja") {
      62.5 * area  # Estimativa de sacas para soja
    } else if (tipo == "Cana-de-Açúcar") {
      85 * area    # Estimativa em toneladas para cana
    } else {
      NULL
    }
    
    # unidade de medida baseada no tipo de cultura
    production_unit <- if (tipo == "Soja") "sacas" else if (tipo == "Cana-de-Açúcar") "toneladas" else "unidades"
    
    # calcula quantidade de herbicida e fertilizante
    quantidade_herbicida <- culture_data$quantidade_herbicida
    quantidade_fertilizante <- culture_data$quantidade_fertilizante
    
    # gera recomendações de monitoramento
    monitoring_optimization <- list(
      heat_stress = if (temperature > 28) {
        sprintf("ALERTA: Temperatura elevada (%.2f°C) pode causar estresse térmico na %s. Monitorar sinais de murcha e considerar irrigação adicional.", 
                temperature, tolower(tipo))
      } else {
        sprintf("Temperatura atual (%.2f°C) está dentro dos limites adequados para %s.", 
                temperature, tolower(tipo))
      },
      
      irrigation_advice = if (needs_irrigation) {
        "Condições atuais favoráveis para irrigação. Recomenda-se manter o cronograma regular."
      } else if (humidity > 70) {
        "Umidade elevada. Considerar redução na frequência de irrigação."
      } else {
        "Monitorar umidade do solo para ajustar cronograma de irrigação."
      },
      
      herbicide_advice = if (can_apply_chemicals && !is.null(quantidade_herbicida)) {
        sprintf("Condições favoráveis para aplicação dos %sL de herbicida. Aplicar preferencialmente no início da manhã ou final da tarde.", 
                quantidade_herbicida)
      } else if (!can_apply_chemicals) {
        "Evitar aplicação de herbicidas nas condições atuais."
      } else {
        "Verificar condições locais antes da aplicação de herbicidas."
      },
      
      field_operations = if (is_ideal_for_fieldwork(temperature, humidity, wind_speed, main_condition)) {
        "Condições favoráveis para operações de campo."
      } else {
        "Monitorar previsão do tempo para planejar operações de campo."
      }
    )
    
    # análise de impacto ambiental
    environmental_impact <- list(
      drift_risk = if (wind_speed < 5) {
        sprintf("Risco baixo de deriva de produtos químicos com vento atual de %.2f km/h.", wind_speed)
      } else if (wind_speed < 10) {
        sprintf("Risco moderado de deriva. Vento de %.2f km/h. Usar tecnologia anti-deriva.", wind_speed)
      } else {
        sprintf("Risco alto de deriva. Vento de %.2f km/h. Evitar aplicação de produtos químicos.", wind_speed)
      }
    )
    
    # análise de dados
    data_analysis <- list(
      key_metrics = list(
        area_hectares = area,
        potential_production = sprintf("%s %s totais estimadas", 
                                     production_estimate, 
                                     production_unit),
        insumos_totais = list(
          herbicida = sprintf("%.0f L", quantidade_herbicida),
          fertilizante = sprintf("%.0f kg", quantidade_fertilizante)
        ),
        linhas_plantio = culture_data$linhas_calculadas,
        metros_lineares = round(culture_data$metros_lineares_total / 100) / 100
      ),
      
      efficiency_metrics = list(
        water_use = sprintf("Uso de água: %.0f L/ha. Consumo dentro dos parâmetros eficientes.", 
                          culture_data$consumo_agua / area),
        herbicide_use = sprintf("Uso de herbicida: %.1f L/ha. Dosagem dentro dos parâmetros recomendados.", 
                              culture_data$dosagem_herbicida)
      ),
      
      monitoring_recommendation = sprintf(
        "Recomenda-se registrar diariamente: temperatura, precipitação, umidade do solo e desenvolvimento fenológico da cultura %s para comparação histórica e tomada de decisão futura.",
        tipo
      )
    )
    
    # modelos estatísticos
    statistical_models <- list(
      development = "Desenvolvimento dentro do esperado para as condições climáticas atuais.",
      productivity_forecast = sprintf(
        "Produtividade estimada: %.1f %s/ha. Acima do esperado para a região.",
        production_estimate / area * 0.9,  # ajuste conservador para previsão
        if (tipo == "Soja") "sacas" else if (tipo == "Cana-de-Açúcar") "toneladas" else "unidades"
      ),
      historical_comparison = sprintf(
        "Temperatura atual de %.2f °C está acima da média histórica para a região nesta época do ano.",
        temperature
      )
    )
    
    # resultado final
    return(list(
      summary = summary,
      basic = basic_recs,
      specific = specific_recs,
      inputs_management = input_recs,
      monitoring_optimization = monitoring_optimization,
      environmental_impact = environmental_impact,
      data_analysis = data_analysis,
      statistical_models = statistical_models
    ))
  } else {
    # dados meteorológicos incompletos - tenta extrair o máximo possível
    log_info("Dados meteorológicos incompletos, tentando extrair valores parciais")
    partial_data <- list()
    
    if (!is.null(temperature)) partial_data$temperature <- temperature
    if (!is.null(humidity)) partial_data$humidity <- humidity
    if (!is.null(wind_speed)) partial_data$wind_speed <- wind_speed
    if (!is.null(main_condition)) partial_data$main_condition <- main_condition
    
    # se obtém, pelo menos, algumas informações, tente gerar recomendações parciais
    if (length(partial_data) > 0) {
      log_info(paste("Dados parciais extraídos:", 
                    paste(names(partial_data), collapse=", ")))
      
      # recomendações básicas com dados parciais
      irrigation_rec <- if (!is.null(main_condition) && main_condition %in% c("Rain", "Thunderstorm")) {
        "Irrigação desnecessária devido à precipitação."
      } else if (!is.null(temperature) && temperature > 28) {
        "Considerar irrigação devido às altas temperaturas."
      } else {
        "Verificar umidade do solo para decisões de irrigação."
      }
      
      chemicals_rec <- if (!is.null(wind_speed) && wind_speed > 10) {
        "Evitar aplicação de defensivos devido a ventos fortes."
      } else if (!is.null(main_condition) && main_condition %in% c("Rain", "Thunderstorm")) {
        "Evitar aplicação de defensivos devido à precipitação."
      } else {
        "Verificar condições locais antes de aplicação de defensivos."
      }
      
      fieldwork_rec <- if (!is.null(main_condition) && main_condition %in% c("Rain", "Thunderstorm")) {
        "Limitar trabalho de campo devido à precipitação."
      } else {
        "Verificar condições locais para trabalho de campo."
      }
      
      # resumo baseado em dados parciais
      can_apply_chemicals <- !is.null(wind_speed) && wind_speed < 10 && 
                            (!is.null(main_condition) && !main_condition %in% c("Rain", "Thunderstorm"))
      
      needs_irrigation <- !is.null(temperature) && temperature > 25 && 
                         (!is.null(main_condition) && main_condition %in% c("Clear", "Clouds")) &&
                         (!is.null(humidity) && humidity < 60)
      
      return(list(
        summary = list(
          message = "Recomendações baseadas em dados meteorológicos parciais",
          can_apply_chemicals = can_apply_chemicals,
          needs_irrigation = needs_irrigation,
          overall_assessment = "Verificar dados meteorológicos completos para maior precisão."
        ),
        basic = list(
          irrigation = irrigation_rec,
          chemicals_application = chemicals_rec,
          fieldwork = fieldwork_rec
        ),
        specific = get_culture_specific_recommendations(culture_data)
      ))
    } else {
      # dados meteorológicos em formato desconhecido ou incompleto
      log_info("Formato de dados meteorológicos não reconhecido")
      log_info(paste("Tipo de dados:", class(weather_data)))
      
      if (is.list(weather_data)) {
        log_info(paste("Campos disponíveis:", paste(names(weather_data), collapse=", ")))
      }
      
      return(list(
        error = "Formato de dados meteorológicos não reconhecido",
        status = "error"
      ))
    }
  }
}

# função para verificar se é ideal para trabalho de campo
is_ideal_for_fieldwork <- function(temperature, humidity, wind_speed, main_condition) {
  # critérios para trabalho de campo ideal
  no_precipitation <- !main_condition %in% c("Rain", "Thunderstorm", "Snow", "Drizzle")
  moderate_temp <- temperature >= 15 && temperature <= 30
  moderate_humidity <- humidity >= 40 && humidity <= 80
  moderate_wind <- wind_speed < 15
  
  return(no_precipitation && moderate_temp && moderate_humidity && moderate_wind)
}

# função para obter recomendações básicas
get_basic_recommendations <- function(temperature, humidity, wind_speed, main_condition) {
  # recomendações para irrigação
  irrigation_rec <- if (main_condition %in% c("Clear", "Clouds") && temperature > 25 && humidity < 60) {
    "Considerar irrigação para evitar estresse hídrico."
  } else if (main_condition %in% c("Rain", "Thunderstorm", "Drizzle")) {
    "Irrigação desnecessária devido à precipitação recente."
  } else {
    "Monitorar umidade do solo para decisões de irrigação."
  }
  
  # recomendações para aplicação de defensivos
  chemicals_rec <- if (wind_speed > 10) {
    "Evitar aplicação de defensivos devido a ventos fortes (risco de deriva)."
  } else if (main_condition %in% c("Rain", "Thunderstorm")) {
    "Evitar aplicação de defensivos devido à precipitação (risco de lixiviação)."
  } else if (temperature > 30) {
    "Aplicar defensivos no início da manhã ou final da tarde devido às altas temperaturas."
  } else {
    "Condições aceitáveis para aplicação de defensivos."
  }
  
  # recomendações para trabalho de campo
  fieldwork_rec <- if (main_condition %in% c("Rain", "Thunderstorm", "Snow")) {
    "Limitar trabalho de campo devido às condições meteorológicas."
  } else if (temperature < 10 || temperature > 35) {
    "Considerar os impactos da temperatura extrema na produtividade dos trabalhadores."
  } else {
    "Condições adequadas para trabalho de campo."
  }
  
  return(list(
    irrigation = irrigation_rec,
    chemicals_application = chemicals_rec,
    fieldwork = fieldwork_rec
  ))
}

# função para obter recomendações específicas por cultura
get_culture_specific_recommendations <- function(culture_data) {
  # verifica tipo de cultura
  culture_type <- culture_data$tipo
  
  # recomendações específicas para soja
  if (culture_type == "Soja") {
    variety <- culture_data$variedade
    
    # manejo de pragas
    pest_management <- "Realizar monitoramento regular de pragas e doenças, especialmente ferrugem asiática."
    
    # recomendações para variedades específicas
    variety_specific <- if (variety == "transgênica") {
      "Variedade transgênica tem maior resistência a herbicidas específicos, mas mantenha monitoramento para resistência de pragas."
    } else {
      "Variedade convencional pode requerer manejo mais intensivo de pragas e ervas daninhas."
    }
    
    # recomendações para estágio de crescimento
    growth_stage_rec <- "Monitorar estágio fenológico da cultura para decisões de manejo específicas."
    
    return(list(
      pest_management = pest_management,
      variety_specific = variety_specific,
      growth_stage = growth_stage_rec
    ))
    
    # recomendações específicas para cana-de-açúcar
  } else if (culture_type == "Cana-de-Açúcar") {
    cycle <- culture_data$ciclo
    
    # manejo de pragas
    pest_management <- "Monitorar presença de broca da cana e cigarrinha, principais pragas da cultura."
    
    # recomendações específicas por ciclo
    cycle_specific <- if (cycle == "longo") {
      "Ciclo longo requer mais monitoramento de maturação para determinar momento ideal de colheita."
    } else if (cycle == "médio") {
      "Ciclo médio apresenta bom equilíbrio entre produtividade e manejo."
    } else {
      "Ciclo curto pode avançar rapidamente, monitorar estágios fenológicos com mais frequência."
    }
    
    # recomendações para colheita
    harvest_rec <- "Planejar colheita com base no monitoramento de maturação e condições meteorológicas."
    
    return(list(
      pest_management = pest_management,
      cycle_specific = cycle_specific,
      harvest = harvest_rec
    ))
    
  } else {
    # cultura não reconhecida
    return(list(
      warning = "Tipo de cultura não reconhecido para recomendações específicas"
    ))
  }
}

# função para obter recomendações de manejo de insumos
get_input_management_recommendations <- function(culture_data, temperature, humidity, wind_speed, main_condition) {
  # extração de dados básicos da cultura
  culture_type <- culture_data$tipo
  
  # verificar se existem dados de aplicação de insumos
  has_herbicide <- !is.null(culture_data$quantidade_herbicida) && culture_data$quantidade_herbicida > 0
  has_fertilizer <- !is.null(culture_data$quantidade_fertilizante) && culture_data$quantidade_fertilizante > 0
  
  # recomendações para herbicidas
  herbicide_rec <- if (has_herbicide) {
    if (wind_speed > 10) {
      "ALERTA: Não aplicar herbicida em condições de vento forte (>10 km/h) devido ao risco de deriva."
    } else if (main_condition %in% c("Rain", "Thunderstorm")) {
      "ALERTA: Adiar aplicação de herbicida devido à precipitação para evitar lixiviação."
    } else if (temperature > 30) {
      "Aplicar herbicida nas horas mais frescas do dia para evitar volatilização excessiva."
    } else {
      "Condições adequadas para aplicação de herbicida. Seguir dosagem recomendada."
    }
  } else {
    "Sem dados de aplicação de herbicida para recomendar."
  }
  
  # recomendações para fertilizantes
  fertilizer_rec <- if (has_fertilizer) {
    if (main_condition %in% c("Rain", "Thunderstorm")) {
      "Evitar aplicação de fertilizantes em solo saturado para reduzir lixiviação de nutrientes."
    } else if (main_condition %in% c("Clear") && humidity < 40) {
      "Considerar irrigação após aplicação de fertilizantes em condições secas."
    } else {
      "Condições médias para aplicação de fertilizantes. Seguir recomendações de dosagem."
    }
  } else {
    "Sem dados de aplicação de fertilizante para recomendar."
  }
  
  # recomendação de tecnologia de aplicação
  application_tech <- if (wind_speed < 5) {
    "Condições ideais para qualquer tecnologia de aplicação."
  } else if (wind_speed < 10) {
    "Usar bicos anti-deriva e gotas maiores para reduzir deriva."
  } else {
    "Considerar adiamento da aplicação ou usar tecnologia avançada anti-deriva."
  }
  
  return(list(
    herbicide = herbicide_rec,
    fertilizer = fertilizer_rec,
    application_technology = application_tech
  ))
}

# função principal para processar os dados de entrada JSON
process_recommendations <- function(input_json_file) {
  tryCatch({
    log_info("Iniciando processamento de recomendações...")
    log_info("Arquivo de entrada:", input_json_file)
    
    # verifica se o arquivo existe
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
    
    # verifica se temos os dados necessários
    if (is.null(input_data$culture)) {
      log_info("ERRO: Dados de cultura ausentes")
      return(list(
        status = "error",
        message = "Dados de cultura ausentes"
      ))
    }
    
    # extrai dados de cultura e clima
    culture_data <- input_data$culture
    weather_data <- input_data$weather
    
    log_info("Gerando recomendações com base nos dados meteorológicos e da cultura")
    # gera recomendações
    recommendations <- generate_recommendations(culture_data, weather_data)
    
    # retorna resultado
    result <- list(
      status = "success",
      data = recommendations
    )
    
    log_info("Recomendações geradas com sucesso")
    return(result)
    
  }, error = function(e) {
    log_info("ERRO:", e$message)
    return(list(
      status = "error",
      message = paste("Erro ao processar recomendações:", e$message)
    ))
  })
}

#=====================================================
# EXECUÇÃO PRINCIPAL
#=====================================================

# quando executado como script independente...
if (!interactive()) {
  # carrega pacotes necessários
  load_packages()
  
  # obtém argumentos de linha de comando
  args <- commandArgs(trailingOnly = TRUE)
  
  # verifica se possui o arquivo de entrada
  if (length(args) < 1) {
    log_info("ERRO: Nenhum arquivo de entrada especificado")
    cat(jsonlite::toJSON(list(
      status = "error",
      message = "Nenhum arquivo de entrada especificado"
    ), auto_unbox = TRUE, pretty = TRUE))
    quit(status = 1)
  }
  
  # processa recomendações
  result <- process_recommendations(args[1])
  
  # envia resultado como JSON para stdout
  cat(jsonlite::toJSON(result, auto_unbox = TRUE, pretty = TRUE))
}

