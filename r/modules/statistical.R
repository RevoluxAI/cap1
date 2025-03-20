#!/usr/bin/env Rscript

# Módulo de funções estatísticas

# carrega pacotes necessários
if (!require("stats")) install.packages("stats")
if (!require("dplyr")) install.packages("dplyr")

# função para calcular estatísticas básicas de um vetor numérico
calculate_basic_stats <- function(values) {
  if (length(values) == 0 || all(is.na(values))) {
    return(list(
      mean = NA,
      median = NA,
      std_dev = NA,
      min = NA,
      max = NA,
      q1 = NA,
      q3 = NA,
      n = 0
    ))
  }
  
  # remove valores NA
  values <- values[!is.na(values)]
  
  result <- list(
    mean    = mean(values),
    median  = median(values),
    std_dev = sd(values),
    min     = min(values),
    max     = max(values),
    n       = length(values)
  )
  
  # adiciona quartis se houver pelo menos 4 valores
  if (length(values) >= 4) {
    quantiles <- quantile(values, probs = c(0.25, 0.75))
    result$q1 <- quantiles["25%"]
    result$q3 <- quantiles["75%"]
  } else {
    result$q1 <- NA
    result$q3 <- NA
  }
  
  return(result)
}

# função para analisar tendência de crescimento ou declínio
analyze_trend <- function(values, dates = NULL) {
  if (length(values) < 2 || all(is.na(values))) {
    return(list(
      trend = "indeterminado",
      slope = NA,
      significance = NA
    ))
  }
  
  # remove pares de NA
  if (!is.null(dates)) {
    valid_indices <- !is.na(values) & !is.na(dates)
    values <- values[valid_indices]
    dates <- dates[valid_indices]
    
    # se datas forem fornecidas, use-as para análise de tendência no tempo
    if (length(values) >= 2 && length(dates) >= 2) {
      # converter datas para formato numérico
      if (is.character(dates)) {
        dates <- as.numeric(as.POSIXct(dates))
      } else if (inherits(dates, "Date")) {
        dates <- as.numeric(dates)
      } else if (!is.numeric(dates)) {
        dates <- seq_along(values)
      }
      
      # regressão linear simples
      model <- lm(values ~ dates)
      slope <- coef(model)[2]
      p_value <- summary(model)$coefficients[2, 4]
      
      # determina tendência
      if (p_value <= 0.05) {
        if (slope > 0) {
          trend <- "crescimento significativo"
        } else {
          trend <- "declínio significativo"
        }
      } else {
        trend <- "estável (sem tendência significativa)"
      }
      
      return(list(
        trend = trend,
        slope = slope,
        significance = p_value
      ))
    }
  }
  
  # análise simples sem datas (apenas verifica diferença entre início e fim)
  start_value <- values[1]
  end_value   <- values[length(values)]
  diff_pct    <- (end_value - start_value) / start_value * 100
  
  if (abs(diff_pct) < 5) {
    trend <- "estável"
  } else if (diff_pct > 0) {
    trend <- "crescimento"
  } else {
    trend <- "declínio"
  }
  
  return(list(
    trend = trend,
    change_percent = diff_pct,
    absolute_change = end_value - start_value
  ))
}

# função para detectar outliers usando método do IQR
detect_outliers <- function(values, multiplier = 1.5) {
  if (length(values) < 4 || all(is.na(values))) {
    return(list(
      outliers = numeric(0),
      indices = integer(0)
    ))
  }
  
  # remove NA
  na_indices <- which(is.na(values))
  clean_values <- values[!is.na(values)]
  
  # calcula quartis
  q1 <- quantile(clean_values, 0.25)
  q3 <- quantile(clean_values, 0.75)
  iqr <- q3 - q1
  
  # defini limites
  lower_bound <- q1 - multiplier * iqr
  upper_bound <- q3 + multiplier * iqr
  
  # identifica outliers
  outlier_indices <- which(clean_values < lower_bound | clean_values > upper_bound)
  
  # ajusta índices se houver valores NA
  if (length(na_indices) > 0) {
    real_indices <- which(!is.na(values))
    outlier_indices <- real_indices[outlier_indices]
  }
  
  return(list(
    outliers = clean_values[outlier_indices],
    indices = outlier_indices,
    lower_bound = lower_bound,
    upper_bound = upper_bound
  ))
}

# função para calcular estatísticas de série temporal
analyze_time_series <- function(values, dates, frequency = NULL) {
  if (length(values) < 4 || length(dates) != length(values)) {
    return(list(
      error = "Dados insuficientes ou incompatíveis para análise de série temporal"
    ))
  }
  
  # verifica e converter dados para formato de série temporal
  ts_data <- tryCatch({
    if (is.null(frequency)) {
      # tenta detectar a frequência
      if (inherits(dates, "Date") || inherits(dates, "POSIXt")) {
        # verifica se os dados são diários
        date_diffs <- diff(as.numeric(dates))
        if (all(date_diffs >= 86400 - 100 & date_diffs <= 86400 + 100)) {
          frequency <- 365  # Dados diários
        } else if (all(date_diffs >= 604800 - 1000 & date_diffs <= 604800 + 1000)) {
          frequency <- 52   # Dados semanais
        } else if (all(date_diffs >= 2592000 - 10000 & date_diffs <= 2592000 + 10000)) {
          frequency <- 12   # Dados mensais
        } else {
          frequency <- 1    # Sem padrão claro
        }
      } else {
        frequency <- 1
      }
    }
    
    # cria objeto de série temporal
    ts(values, frequency = frequency)
  }, error = function(e) {
    return(NULL)
  })
  
  if (is.null(ts_data)) {
    return(list(
      error = "Não foi possível criar objeto de série temporal"
    ))
  }
  
  # calcula componentes de tendência e sazonalidade usando decomposição
  has_seasonal <- frequency > 1 && length(values) >= 2 * frequency
  
  if (has_seasonal) {
    decomposition <- tryCatch({
      decompose(ts_data)
    }, error = function(e) {
      return(NULL)
    })
    
    if (!is.null(decomposition)) {
      return(list(
        trend = as.numeric(decomposition$trend),
        seasonal = as.numeric(decomposition$seasonal),
        random = as.numeric(decomposition$random),
        frequency = frequency
      ))
    }
  }
  
  # se não for possível decompor, retorna análise básica
  return(list(
    basic_stats = calculate_basic_stats(values),
    trend_analysis = analyze_trend(values, dates),
    frequency = frequency
  ))
}

