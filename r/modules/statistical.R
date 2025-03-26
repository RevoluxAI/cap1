# módulo de funções estatísticas
# versão aprimorada com funções estatísticas robustas

# controle de dependências
.require_package <- function(package_name) {
  if (!requireNamespace(package_name, quietly = TRUE)) {
    message(paste("Instalando pacote necessário:", package_name))
    install.packages(package_name, repos = "https://cran.rstudio.com/", quiet = TRUE)
  }
  library(package_name, character.only = TRUE)
}

# carrega pacotes necessários
tryCatch({
  .require_package("stats")
  .require_package("dplyr")
  # adiciona mais pacotes estatísticos conforme necessário
  # .require_package("forecast") # para séries temporais avançadas
}, error = function(e) {
  warning(paste("Não foi possível carregar todos os pacotes estatísticos:", e$message))
})

#' Calcula estatísticas básicas de um vetor numérico
#'
#' @param values Vetor numérico para análise
#' @param na.rm Lógico indicando se NAs devem ser removidos
#' @param conf.level Nível de confiança para intervalos
#' @return Lista com estatísticas calculadas
#' @export
calculate_basic_stats <- function(values, na.rm = TRUE, conf.level = 0.95) {
  # validação de entrada
  if (!is.numeric(values)) {
    warning("calculate_basic_stats: entrada não é um vetor numérico")
    values <- as.numeric(values)
  }
  
  # se vetor vazio ou todos NA, retornar resultado vazio
  if (length(values) == 0 || all(is.na(values))) {
    return(list(
      mean = NA_real_,
      median = NA_real_,
      std_dev = NA_real_,
      se = NA_real_,
      min = NA_real_,
      max = NA_real_,
      q1 = NA_real_,
      q3 = NA_real_,
      iqr = NA_real_,
      n = 0,
      n_missing = sum(is.na(values)),
      conf_low = NA_real_,
      conf_high = NA_real_
    ))
  }
  
  # remove valores NA se solicitado
  if (na.rm) {
    n_missing <- sum(is.na(values))
    values <- values[!is.na(values)]
  } else {
    n_missing <- 0
  }
  
  # número de observações
  n <- length(values)
  
  # calcula estatísticas básicas
  mean_val <- mean(values)
  std_dev <- sd(values)
  
  # erro padrão
  se <- std_dev / sqrt(n)
  
  # intervalo de confiança
  t_value <- qt(1 - (1 - conf.level)/2, df = n - 1)
  margin <- t_value * se
  conf_low <- mean_val - margin
  conf_high <- mean_val + margin
  
  # quartis e IQR
  if (n >= 4) {
    quantiles <- quantile(values, probs = c(0.25, 0.5, 0.75))
    q1 <- quantiles["25%"]
    median_val <- quantiles["50%"]
    q3 <- quantiles["75%"]
    iqr <- q3 - q1
  } else {
    median_val <- median(values)
    q1 <- NA_real_
    q3 <- NA_real_
    iqr <- NA_real_
  }
  
  # resultado completo
  result <- list(
    mean = mean_val,
    median = median_val,
    std_dev = std_dev,
    se = se,
    min = min(values),
    max = max(values),
    q1 = q1,
    q3 = q3,
    iqr = iqr,
    n = n,
    n_missing = n_missing,
    conf_low = conf_low,
    conf_high = conf_high,
    conf_level = conf.level
  )
  
  # adiciona análise de normalidade para amostras maiores
  if (n >= 20) {
    tryCatch({
      shapiro_test <- shapiro.test(values)
      result$normality <- list(
        test = "Shapiro-Wilk",
        statistic = shapiro_test$statistic,
        p_value = shapiro_test$p.value,
        is_normal = shapiro_test$p.value > 0.05
      )
    }, error = function(e) {
      result$normality <- list(
        test = "Shapiro-Wilk",
        error = e$message
      )
    })
  }
  
  return(result)
}

#' Analisa tendência de crescimento ou declínio em uma série temporal
#'
#' @param values Vetor de valores numéricos
#' @param dates Vetor de datas correspondentes aos valores
#' @param method Método de análise de tendência ("linear", "mann_kendall", "seasonal")
#' @return Lista com resultados da análise de tendência
#' @export
analyze_trend <- function(values, dates = NULL, method = "linear") {
  # validação de entrada
  if (length(values) < 2 || all(is.na(values))) {
    return(list(
      trend = "indeterminado",
      slope = NA_real_,
      significance = NA_real_,
      method = method
    ))
  }
  
  # remove pares de NA
  if (!is.null(dates)) {
    valid_indices <- !is.na(values) & !is.na(dates)
    values <- values[valid_indices]
    dates <- dates[valid_indices]
    
    # verifica se ainda temos dados suficientes
    if (length(values) < 2) {
      return(list(
        trend = "indeterminado",
        slope = NA_real_,
        significance = NA_real_,
        method = method,
        error = "Dados insuficientes após remoção de NAs"
      ))
    }
    
    # converte datas para formato numérico
    if (is.character(dates)) {
      # tenta diferentes formatos de data
      tryCatch({
        dates <- as.numeric(as.POSIXct(dates))
      }, error = function(e) {
        tryCatch({
          dates <- as.numeric(as.Date(dates))
        }, error = function(e2) {
          dates <- seq_along(values)
        })
      })
    } else if (inherits(dates, "Date") || inherits(dates, "POSIXt")) {
      dates <- as.numeric(dates)
    } else if (!is.numeric(dates)) {
      dates <- seq_along(values)
    }
  } else {
    # se não foram fornecidas datas, usar sequência
    dates <- seq_along(values)
  }
  
  # diferentes métodos de análise de tendência
  if (method == "mann_kendall") {
    # teste de Mann-Kendall para tendência não paramétrica
    # requer o pacote 'Kendall'
    tryCatch({
      if (!requireNamespace("Kendall", quietly = TRUE)) {
        install.packages("Kendall", repos = "https://cran.rstudio.com/", quiet = TRUE)
      }
      mk_test <- Kendall::MannKendall(values)
      
      # interpret results
      p_value <- mk_test$sl[1]
      tau <- mk_test$tau
      
      # ajuste linear para estimar a inclinação
      model <- lm(values ~ dates)
      slope <- coef(model)[2]
      
      if (p_value <= 0.05) {
        if (tau > 0) {
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
        significance = p_value,
        method = "Mann-Kendall",
        tau = tau
      ))
      
    }, error = function(e) {
      # fallback para método linear se Mann-Kendall falhar
      method <- "linear"
    })
  }
  
  if (method == "seasonal") {
    # análise de tendência sazonal
    # requer o pacote 'forecast'
    tryCatch({
      if (!requireNamespace("forecast", quietly = TRUE)) {
        install.packages("forecast", repos = "https://cran.rstudio.com/", quiet = TRUE)
      }
      
      # determina frequência (depende dos dados)
      freq <- 12  # assume mensal como padrão
      
      # converte para série temporal
      ts_data <- ts(values, frequency = freq)
      
      # decomposição da série temporal
      decomp <- forecast::decompose(ts_data)
      
      # analisa a componente de tendência
      trend_component <- decomp$trend
      trend_component <- trend_component[!is.na(trend_component)]
      
      if (length(trend_component) >= 2) {
        # ajuste linear na componente de tendência
        trend_model <- lm(trend_component ~ seq_along(trend_component))
        slope <- coef(trend_model)[2]
        p_value <- summary(trend_model)$coefficients[2, 4]
        
        if (p_value <= 0.05) {
          if (slope > 0) {
            trend <- "crescimento significativo com sazonalidade"
          } else {
            trend <- "declínio significativo com sazonalidade"
          }
        } else {
          trend <- "estável com sazonalidade"
        }
        
        return(list(
          trend = trend,
          slope = slope,
          significance = p_value,
          method = "Análise sazonal",
          seasonal_strength = var(decomp$seasonal, na.rm = TRUE) / var(values - decomp$trend, na.rm = TRUE)
        ))
      } else {
        # fallback para método linear se não for possível realizar análise sazonal
        method <- "linear"
      }
    }, error = function(e) {
      # fallback para método linear se análise sazonal falhar
      method <- "linear"
    })
  }
  
  # método linear (default ou fallback)
  if (method == "linear") {
    # regressão linear simples
    model <- lm(values ~ dates)
    summary_model <- summary(model)
    
    slope <- coef(model)[2]
    p_value <- summary_model$coefficients[2, 4]
    r_squared <- summary_model$r.squared
    
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
      significance = p_value,
      method = "Regressão linear",
      r_squared = r_squared,
      intercept = coef(model)[1]
    ))
  }
  
  # se por algum motivo chegar aqui sem um método válido
  # faça análise simples das mudanças
  start_value <- values[1]
  end_value <- values[length(values)]
  diff_pct <- if (start_value != 0) (end_value - start_value) / abs(start_value) * 100 else NA_real_
  
  if (is.na(diff_pct) || abs(diff_pct) < 5) {
    trend <- "estável"
  } else if (diff_pct > 0) {
    trend <- "crescimento"
  } else {
    trend <- "declínio"
  }
  
  return(list(
    trend = trend,
    change_percent = diff_pct,
    absolute_change = end_value - start_value,
    method = "análise simples"
  ))
}

#' Detecta outliers em um vetor numérico
#'
#' @param values Vetor numérico para análise
#' @param method Método para detecção de outliers ("iqr", "zscore", "tukey")
#' @param threshold Limiar para classificação como outlier (depende do método)
#' @return Lista com outliers detectados e métodos utilizados
#' @export
detect_outliers <- function(values, method = "iqr", threshold = 1.5) {
  # validação de entrada
  if (length(values) < 4 || all(is.na(values))) {
    return(list(
      outliers = numeric(0),
      indices = integer(0),
      method = method,
      n_outliers = 0
    ))
  }
  
  # remove NA
  na_indices <- which(is.na(values))
  clean_values <- values[!is.na(values)]
  n <- length(clean_values)
  
  if (n < 4) {
    return(list(
      outliers = numeric(0),
      indices = integer(0),
      method = method,
      n_outliers = 0,
      message = "Dados insuficientes para detectar outliers"
    ))
  }
  
  outlier_indices <- integer(0)
  outlier_values <- numeric(0)
  
  # escolhe método de detecção
  if (method == "zscore") {
    # método Z-Score
    z_scores <- scale(clean_values)
    outlier_indices <- which(abs(z_scores) > threshold)
    
    if (length(outlier_indices) > 0) {
      outlier_values <- clean_values[outlier_indices]
      method_details <- list(
        name = "Z-Score",
        threshold = threshold,
        z_scores = z_scores[outlier_indices]
      )
    }
    
  } else if (method == "tukey") {
    # método de Tukey (similar ao IQR, mas com detalhes adicionais)
    q1 <- quantile(clean_values, 0.25)
    q3 <- quantile(clean_values, 0.75)
    iqr <- q3 - q1
    
    lower_bound <- q1 - threshold * iqr
    upper_bound <- q3 + threshold * iqr
    
    outlier_indices <- which(clean_values < lower_bound | clean_values > upper_bound)
    
    if (length(outlier_indices) > 0) {
      outlier_values <- clean_values[outlier_indices]
      
      # classifica outliers
      extreme_low <- which(clean_values < (q1 - 3 * iqr))
      extreme_high <- which(clean_values > (q3 + 3 * iqr))
      
      method_details <- list(
        name = "Tukey's method",
        threshold = threshold,
        q1 = q1,
        q3 = q3,
        iqr = iqr,
        lower_bound = lower_bound,
        upper_bound = upper_bound,
        extreme_outliers = union(extreme_low, extreme_high)
      )
    }
    
  } else {
    # método IQR (padrão)
    q1 <- quantile(clean_values, 0.25)
    q3 <- quantile(clean_values, 0.75)
    iqr <- q3 - q1
    
    lower_bound <- q1 - threshold * iqr
    upper_bound <- q3 + threshold * iqr
    
    outlier_indices <- which(clean_values < lower_bound | clean_values > upper_bound)
    
    if (length(outlier_indices) > 0) {
      outlier_values <- clean_values[outlier_indices]
      method_details <- list(
        name = "IQR method",
        threshold = threshold,
        q1 = q1,
        q3 = q3,
        iqr = iqr,
        lower_bound = lower_bound,
        upper_bound = upper_bound
      )
    }
  }
  
  # ajusta índices se houver valores NA no vetor original
  if (length(na_indices) > 0 && length(outlier_indices) > 0) {
    real_indices <- which(!is.na(values))
    outlier_indices <- real_indices[outlier_indices]
  }
  
  # resultado
  result <- list(
    outliers = outlier_values,
    indices = outlier_indices,
    method = method,
    n_outliers = length(outlier_indices),
    percentage = (length(outlier_indices) / n) * 100
  )
  
  # adiciona detalhes do método se disponíveis
  if (exists("method_details")) {
    result$details <- method_details
  }
  
  return(result)
}

#' Analisa uma série temporal
#'
#' @param values Vetor de valores numéricos
#' @param dates Vetor de datas correspondentes 
#' @param frequency Frequência da série temporal (NULL para auto-detecção)
#' @return Lista com resultados da análise de série temporal
#' @export
analyze_time_series <- function(values, dates, frequency = NULL) {
  # validação de entrada
  if (length(values) < 4 || length(dates) != length(values)) {
    return(list(
      error = "Dados insuficientes ou incompatíveis para análise de série temporal",
      n_values = length(values),
      n_dates = length(dates)
    ))
  }
  
  # converte datas para formato adequado
  if (is.character(dates)) {
    tryCatch({
      dates <- as.Date(dates)
    }, error = function(e) {
      tryCatch({
        dates <- as.POSIXct(dates)
      }, error = function(e2) {
        return(list(
          error = "Não foi possível converter as datas para um formato válido",
          format_tried = c("as.Date", "as.POSIXct")
        ))
      })
    })
  }
  
  # verifica se as datas estão em ordem
  if (!all(diff(as.numeric(dates)) >= 0)) {
    warning("As datas não estão em ordem cronológica. Ordenando os dados.")
    ord <- order(dates)
    dates <- dates[ord]
    values <- values[ord]
  }
  
  # detecta a frequência, se não especificada
  if (is.null(frequency)) {
    # calcula diferenças de tempo
    date_diffs <- diff(as.numeric(dates))
    
    # remove outliers das diferenças para obter uma estimativa mais robusta
    outliers <- detect_outliers(date_diffs)
    if (outliers$n_outliers > 0) {
      clean_diffs <- date_diffs[-outliers$indices]
    } else {
      clean_diffs <- date_diffs
    }
    
    # calcula a diferença média
    mean_diff <- mean(clean_diffs)
    
    # detecta frequência com base na diferença média
    if (inherits(dates, "Date")) {
      # para datas, usar dias
      if (mean_diff >= 365 - 30 && mean_diff <= 365 + 30) {
        frequency <- 1  # anual
      } else if (mean_diff >= 90 - 15 && mean_diff <= 90 + 15) {
        frequency <- 4  # trimestral
      } else if (mean_diff >= 30 - 5 && mean_diff <= 30 + 5) {
        frequency <- 12  # mensal
      } else if (mean_diff >= 7 - 2 && mean_diff <= 7 + 2) {
        frequency <- 52  # semanal
      } else if (mean_diff >= 1 - 0.1 && mean_diff <= 1 + 0.1) {
        frequency <- 365  # diária
      } else {
        frequency <- 1  # padrão
      }
    } else {
      # para datetime, usar segundos
      seconds_per_day <- 86400
      if (mean_diff >= seconds_per_day * 365 - seconds_per_day * 30 && 
          mean_diff <= seconds_per_day * 365 + seconds_per_day * 30) {
        frequency <- 1  # anual
      } else if (mean_diff >= seconds_per_day * 90 - seconds_per_day * 15 && 
                 mean_diff <= seconds_per_day * 90 + seconds_per_day * 15) {
        frequency <- 4  # trimestral
      } else if (mean_diff >= seconds_per_day * 30 - seconds_per_day * 5 && 
                 mean_diff <= seconds_per_day * 30 + seconds_per_day * 5) {
        frequency <- 12  # mensal
      } else if (mean_diff >= seconds_per_day * 7 - seconds_per_day * 2 && 
                 mean_diff <= seconds_per_day * 7 + seconds_per_day * 2) {
        frequency <- 52  # semanal
      } else if (mean_diff >= seconds_per_day - 3600 && 
                 mean_diff <= seconds_per_day + 3600) {
        frequency <- 365  # diária
      } else if (mean_diff >= 3600 - 300 && mean_diff <= 3600 + 300) {
        frequency <- 24  # horária
      } else {
        frequency <- 1  # Padrão
      }
    }
  }
  
  # cria objeto de série temporal
  ts_data <- tryCatch({
    ts(values, frequency = frequency)
  }, error = function(e) {
    return(NULL)
  })
  
  if (is.null(ts_data)) {
    return(list(
      error = "Não foi possível criar objeto de série temporal",
      values = head(values, 5),
      frequency_attempted = frequency
    ))
  }
  
  # estatísticas básicas
  basic_stats <- calculate_basic_stats(values)
  
  # análise de tendência
  trend_analysis <- analyze_trend(values, dates)
  
  # tenta decomposição para séries mais longas com sazonalidade
  decomposition <- NULL
  has_seasonal <- frequency > 1 && length(values) >= 2 * frequency
  
  if (has_seasonal) {
    tryCatch({
      if (!requireNamespace("stats", quietly = TRUE)) {
        install.packages("stats", repos = "https://cran.rstudio.com/", quiet = TRUE)
      }
      decomposition <- stats::decompose(ts_data)
      
      # extrai componentes
      trend <- as.numeric(decomposition$trend)
      seasonal <- as.numeric(decomposition$seasonal)
      random <- as.numeric(decomposition$random)
      
      # análise mais avançada com forecast (se disponível)
      forecast_available <- FALSE
      forecast_model <- NULL
      
      tryCatch({
        if (!requireNamespace("forecast", quietly = TRUE)) {
          install.packages("forecast", repos = "https://cran.rstudio.com/", quiet = TRUE)
        }
        
        # ajusta modelo ARIMA automaticamente
        forecast_model <- forecast::auto.arima(ts_data)
        forecast_available <- TRUE
        
      }, error = function(e) {
        forecast_available <- FALSE
      })
      
      # resultado da decomposição
      decomposition_result <- list(
        trend = trend,
        seasonal = seasonal[!is.na(seasonal)],
        random = random,
        frequency = frequency,
        seasonal_strength = var(seasonal, na.rm = TRUE) / var(values - trend, na.rm = TRUE)
      )
      
      # adiciona resultados do forecast se disponível
      if (forecast_available) {
        decomposition_result$forecast <- list(
          model_type = forecast_model$method,
          aic = forecast_model$aic,
          coefficients = forecast_model$coef,
          order = c(forecast_model$arma[1], forecast_model$arma[2], forecast_model$arma[5])
        )
      }
      
      # retorno com decomposição
      return(list(
        basic_stats = basic_stats,
        trend_analysis = trend_analysis,
        frequency = frequency,
        decomposition = decomposition_result,
        n_observations = length(values),
        date_range = range(dates)
      ))
      
    }, error = function(e) {
      # se a decomposição falhar, continua com análise básica
      decomposition <- NULL
    })
  }
  
  # se a decomposição não foi possível ou não há sazonalidade, retorna análise básica
  if (is.null(decomposition)) {
    # verifica se pode tentar forecast sem decomposição
    forecast_result <- NULL
    
    tryCatch({
      if (!requireNamespace("forecast", quietly = TRUE)) {
        install.packages("forecast", repos = "https://cran.rstudio.com/", quiet = TRUE)
      }
      
      # verifica autocorrelação nos dados
      acf_result <- forecast::Acf(ts_data, plot = FALSE)
      pacf_result <- forecast::Pacf(ts_data, plot = FALSE)
      
      forecast_result <- list(
        acf = as.numeric(acf_result$acf),
        pacf = as.numeric(pacf_result$acf),
        has_autocorrelation = any(abs(acf_result$acf[-1]) > 0.2)
      )
      
    }, error = function(e) {
      # se forecast falhar, continua sem ele
    })
    
    # retorno com análise básica
    result <- list(
      basic_stats = basic_stats,
      trend_analysis = trend_analysis,
      frequency = frequency,
      n_observations = length(values),
      date_range = range(dates)
    )
    
    # adiciona resultados do forecast se disponível
    if (!is.null(forecast_result)) {
      result$autocorrelation <- forecast_result
    }
    
    return(result)
  }
}

#' Calcula análise de correlação entre variáveis
#'
#' @param data Data frame contendo as variáveis para análise
#' @param method Método de correlação ("pearson", "spearman", "kendall")
#' @param adjust_p Método para ajuste de valor-p para múltiplos testes
#' @return Lista com matriz de correlação e significância
#' @export
analyze_correlation <- function(data, method = "pearson", adjust_p = "none") {
  # validação de entrada
  if (!is.data.frame(data)) {
    warning("analyze_correlation: entrada deve ser um data frame")
    return(NULL)
  }
  
  # extrai apenas colunas numéricas
  numeric_cols <- sapply(data, is.numeric)
  if (sum(numeric_cols) < 2) {
    return(list(
      error = "Dados insuficientes para análise de correlação",
      message = "São necessárias pelo menos 2 variáveis numéricas"
    ))
  }
  
  numeric_data <- data[, numeric_cols, drop = FALSE]
  col_names <- colnames(numeric_data)
  
  # matriz de correlação
  cor_matrix <- cor(numeric_data, method = method, use = "pairwise.complete.obs")
  
  # calcula valores p para cada correlação
  n <- nrow(numeric_data)
  p_matrix <- matrix(NA, nrow = ncol(numeric_data), ncol = ncol(numeric_data))
  
  for (i in 1:(ncol(numeric_data) - 1)) {
    for (j in (i + 1):ncol(numeric_data)) {
      # extrai os pares completos para cada combinação
      pair_data <- na.omit(numeric_data[, c(i, j)])
      
      if (nrow(pair_data) > 2) {
        if (method == "pearson") {
          test_result <- cor.test(pair_data[, 1], pair_data[, 2], method = method)
        } else {
          # para Spearman e Kendall, método alternativo
          test_result <- cor.test(pair_data[, 1], pair_data[, 2], method = method, exact = FALSE)
        }
        
        p_value <- test_result$p.value
        
        # preencher matriz simétrica
        p_matrix[i, j] <- p_value
        p_matrix[j, i] <- p_value
      }
    }
  }
  
  # ajusta valores p para múltiplos testes
  if (adjust_p != "none") {
    # extrai valores p únicos da metade superior da matriz
    p_values <- c()
    for (i in 1:(ncol(numeric_data) - 1)) {
      for (j in (i + 1):ncol(numeric_data)) {
        if (!is.na(p_matrix[i, j])) {
          p_values <- c(p_values, p_matrix[i, j])
        }
      }
    }
    
    # ajusta valores p
    adjusted_p <- p.adjust(p_values, method = adjust_p)
    
    # preenche matriz com valores ajustados
    idx <- 1
    for (i in 1:(ncol(numeric_data) - 1)) {
      for (j in (i + 1):ncol(numeric_data)) {
        if (!is.na(p_matrix[i, j])) {
          p_matrix[i, j] <- adjusted_p[idx]
          p_matrix[j, i] <- adjusted_p[idx]
          idx <- idx + 1
        }
      }
    }
  }
  
  # diagonais
  diag(cor_matrix) <- 1
  diag(p_matrix) <- 0
  
  # configura nomes nas matrizes
  rownames(cor_matrix) <- col_names
  colnames(cor_matrix) <- col_names
  rownames(p_matrix) <- col_names
  colnames(p_matrix) <- col_names
  
  # identifica correlações significativas
  significant <- p_matrix < 0.05 & !is.na(p_matrix)
  
  # prepara listas de pares correlacionados significativamente
  sig_pairs <- list()
  strong_pos_pairs <- list()
  strong_neg_pairs <- list()
  moderate_pairs <- list()
  
  # extrai pares significativos e classificá-los
  for (i in 1:(ncol(numeric_data) - 1)) {
    for (j in (i + 1):ncol(numeric_data)) {
      if (significant[i, j]) {
        pair_name <- paste(col_names[i], "e", col_names[j])
        cor_value <- cor_matrix[i, j]
        p_value <- p_matrix[i, j]
        
        # adiciona ao vetor de pares significativos
        sig_pairs[[length(sig_pairs) + 1]] <- list(
          variables = c(col_names[i], col_names[j]),
          correlation = cor_value,
          p_value = p_value
        )
        
        # classifica por intensidade
        if (abs(cor_value) >= 0.7) {
          if (cor_value > 0) {
            strong_pos_pairs[[length(strong_pos_pairs) + 1]] <- list(
              variables = c(col_names[i], col_names[j]),
              correlation = cor_value,
              p_value = p_value
            )
          } else {
            strong_neg_pairs[[length(strong_neg_pairs) + 1]] <- list(
              variables = c(col_names[i], col_names[j]),
              correlation = cor_value,
              p_value = p_value
            )
          }
        } else if (abs(cor_value) >= 0.3) {
          moderate_pairs[[length(moderate_pairs) + 1]] <- list(
            variables = c(col_names[i], col_names[j]),
            correlation = cor_value,
            p_value = p_value
          )
        }
      }
    }
  }
  
  # resultado
  result <- list(
    correlation = cor_matrix,
    p_values = p_matrix,
    method = method,
    adjust_p = adjust_p,
    n_variables = ncol(numeric_data),
    n_observations = n,
    significant_correlations = sig_pairs,
    strong_positive = strong_pos_pairs,
    strong_negative = strong_neg_pairs,
    moderate = moderate_pairs
  )
  
  return(result)
}

#' Resumo estatístico completo de um data frame
#'
#' @param data Data frame para análise
#' @param group_by Opcional: variável para agrupar os dados
#' @return Lista com resumo estatístico por variável
#' @export
summarize_data_frame <- function(data, group_by = NULL) {
  # validação de entrada
  if (!is.data.frame(data)) {
    warning("summarize_data_frame: entrada deve ser um data frame")
    return(NULL)
  }
  
  if (ncol(data) == 0 || nrow(data) == 0) {
    return(list(
      error = "Data frame vazio",
      n_rows = nrow(data),
      n_cols = ncol(data)
    ))
  }
  
  # resumo geral do data frame
  overview <- list(
    n_rows = nrow(data),
    n_cols = ncol(data),
    n_numeric = sum(sapply(data, is.numeric)),
    n_categorical = sum(sapply(data, function(x) is.factor(x) || is.character(x))),
    n_logical = sum(sapply(data, is.logical)),
    n_date = sum(sapply(data, function(x) inherits(x, "Date") || inherits(x, "POSIXt"))),
    n_missing_values = sum(is.na(data)),
    missing_rate = sum(is.na(data)) / (nrow(data) * ncol(data)) * 100
  )
  
  # se houver agrupamento
  if (!is.null(group_by) && group_by %in% names(data)) {
    # verificar se dplyr está disponível
    if (!requireNamespace("dplyr", quietly = TRUE)) {
      install.packages("dplyr", repos = "https://cran.rstudio.com/", quiet = TRUE)
      library(dplyr)
    }
    
    # agrupa dados
    grouped <- data %>%
      dplyr::group_by(!!!rlang::syms(group_by))
    
    # estatísticas por grupo para variáveis numéricas
    numeric_cols <- names(data)[sapply(data, is.numeric)]
    numeric_cols <- setdiff(numeric_cols, group_by)
    
    # processa cada coluna numérica
    numeric_summaries <- list()
    
    if (length(numeric_cols) > 0) {
      for (col in numeric_cols) {
        # estatísticas por grupo
        group_stats <- grouped %>%
          dplyr::summarize(
            n = dplyr::n(),
            mean = mean(!!rlang::sym(col), na.rm = TRUE),
            median = median(!!rlang::sym(col), na.rm = TRUE),
            std_dev = sd(!!rlang::sym(col), na.rm = TRUE),
            min = min(!!rlang::sym(col), na.rm = TRUE),
            max = max(!!rlang::sym(col), na.rm = TRUE),
            q1 = quantile(!!rlang::sym(col), 0.25, na.rm = TRUE),
            q3 = quantile(!!rlang::sym(col), 0.75, na.rm = TRUE),
            n_missing = sum(is.na(!!rlang::sym(col))),
            .groups = "drop"
          ) %>%
          as.data.frame()
        
        numeric_summaries[[col]] <- group_stats
      }
    }
    
    # estatísticas por grupo para variáveis categóricas
    categorical_cols <- names(data)[sapply(data, function(x) is.factor(x) || is.character(x))]
    categorical_cols <- setdiff(categorical_cols, group_by)
    
    categorical_summaries <- list()
    
    if (length(categorical_cols) > 0) {
      for (col in categorical_cols) {
        # frequências por grupo
        # nota: isto é mais complexo e pode se beneficiar de um pacote como janitor
        cat_summary <- grouped %>%
          dplyr::group_by(!!!rlang::syms(group_by), !!rlang::sym(col)) %>%
          dplyr::summarize(
            count = dplyr::n(),
            .groups = "drop"
          ) %>%
          dplyr::group_by(!!!rlang::syms(group_by)) %>%
          dplyr::mutate(
            percentage = count / sum(count) * 100
          ) %>%
          as.data.frame()
        
        categorical_summaries[[col]] <- cat_summary
      }
    }
    
    # resultado
    return(list(
      overview = overview,
      by_group = list(
        grouping_variable = group_by,
        numeric_variables = numeric_summaries,
        categorical_variables = categorical_summaries
      )
    ))
  } else {
    # análise sem agrupamento
    variable_summaries <- list()
    
    # processa cada variável
    for (col in names(data)) {
      if (is.numeric(data[[col]])) {
        # estatísticas para variáveis numéricas
        stats <- calculate_basic_stats(data[[col]])
        
        # adiciona detecção de outliers
        outliers <- detect_outliers(data[[col]])
        
        variable_summaries[[col]] <- list(
          type = "numeric",
          basic_stats = stats,
          outliers = outliers,
          missing_count = sum(is.na(data[[col]])),
          missing_percent = sum(is.na(data[[col]])) / nrow(data) * 100
        )
        
      } else if (is.factor(data[[col]]) || is.character(data[[col]])) {
        # estatísticas para variáveis categóricas
        table_result <- table(data[[col]], useNA = "ifany")
        prop_table <- prop.table(table_result) * 100
        
        variable_summaries[[col]] <- list(
          type = "categorical",
          levels = names(table_result),
          counts = as.numeric(table_result),
          percentages = as.numeric(prop_table),
          n_unique = length(unique(na.omit(data[[col]]))),
          missing_count = sum(is.na(data[[col]])),
          missing_percent = sum(is.na(data[[col]])) / nrow(data) * 100
        )
        
      } else if (inherits(data[[col]], "Date") || inherits(data[[col]], "POSIXt")) {
        # estatísticas para datas
        clean_dates <- na.omit(data[[col]])
        
        if (length(clean_dates) > 0) {
          min_date <- min(clean_dates)
          max_date <- max(clean_dates)
          range_days <- as.numeric(difftime(max_date, min_date, units = "days"))
          
          variable_summaries[[col]] <- list(
            type = "date",
            min_date = min_date,
            max_date = max_date,
            range_days = range_days,
            n_unique = length(unique(clean_dates)),
            missing_count = sum(is.na(data[[col]])),
            missing_percent = sum(is.na(data[[col]])) / nrow(data) * 100
          )
        } else {
          variable_summaries[[col]] <- list(
            type = "date",
            error = "Todos os valores são NA",
            missing_count = nrow(data),
            missing_percent = 100
          )
        }
        
      } else {
        # outros tipos
        variable_summaries[[col]] <- list(
          type = "other",
          class = class(data[[col]]),
          missing_count = sum(is.na(data[[col]])),
          missing_percent = sum(is.na(data[[col]])) / nrow(data) * 100
        )
      }
    }
    
    # análise de correlação para variáveis numéricas
    correlation_analysis <- NULL
    numeric_cols <- names(data)[sapply(data, is.numeric)]
    
    if (length(numeric_cols) >= 2) {
      correlation_analysis <- analyze_correlation(data[, numeric_cols, drop = FALSE])
    }
    
    # resultado
    return(list(
      overview = overview,
      variables = variable_summaries,
      correlation = correlation_analysis
    ))
  }
}

