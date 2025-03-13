#!/usr/bin/env Rscript

# script R mínimo sem dependências externas
# gera JSON simples sem usar pacotes externos

# logs vão para stderr
cat("Iniciando script mínimo...\n", file = stderr())

# verifica argumentos
args <- commandArgs(trailingOnly = TRUE)
cat("Argumentos:", paste(args, collapse = ", "), "\n", file = stderr())

# cria JSON manualmente (sem depender de jsonlite)
cat('{
  "status": "success",
  "data": {
    "message": "Este é um JSON mínimo gerado sem dependências",
    "timestamp": ', as.numeric(Sys.time()), ',
    "r_version": "', R.version$version.string, '"
  }
}')

# não retorna nada para que nada mais seja impresso no stdout
invisible(NULL)

