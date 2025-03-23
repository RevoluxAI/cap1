# imagem base leve com Python para produção
FROM python:3.9-slim

# define workspace
WORKDIR /app

# instala os pacotes necessários (auxiliares e o R)
RUN apt update && apt install -y --no-install-recommends \
    make gcc build-essential libcurl4-openssl-dev libssl-dev \
    r-base-dev r-base \
    libxml2-dev \
    libfontconfig1-dev \
    libharfbuzz-dev \
    libfribidi-dev \
    libfreetype6-dev \
    libpng-dev \
    libtiff5-dev \
    libjpeg-dev \
    libcairo2-dev


# instala dependências do python
COPY requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# copia arquivos da aplicação
COPY controllers/ ./controllers/
COPY services/ ./services/
COPY utils/ ./utils/
COPY static/ ./static/
COPY web_api.py .
COPY main.py .

# copia diretórios R
COPY r/ ./r/

# instala as bibliotecas R
# define repositórios recomendados para CRAN e Bioconductor
RUN R -e "options(repos = c(CRAN='https://cloud.r-project.org/', Bioc='https://bioconductor.org/packages/3.17/bioc/'))"
RUN R -e "install.packages(c('jsonlite', 'dplyr', 'httr', 'pillar', 'tibble', 'tidyselect', 'vctrs', 'openssl'), repos='https://cran.rstudio.com/')"

# restaura pacotes via renv antes de qualquer instalação manual
RUN cd /app/r && \
    Rscript -e "if (!requireNamespace('renv', quietly=TRUE)) install.packages('renv');" && \
    Rscript -e "renv::restore(confirm = FALSE)"

# configura variáveis de ambiente para desenvolvimento
ENV PORT=5000
ENV DEBUG=True
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONNUNBUFFERED=1

EXPOSE 5000

# mensagem de ajuda ao entrar no container
RUN echo 'echo "FarmTech Solutions - Ambiente de Desenvolvimento"' >> /root/.bashrc
RUN echo 'echo "Comandos úteis:"' >> /root/.bashrc
RUN echo 'echo "  python web_api.py        # Iniciar aplicação"' >> /root/.bashrc
RUN echo 'echo "  python -m pytest         # Executar testes"' >> /root/.bashrc
RUN echo 'echo "  ipython                  # Shell Python interativo"' >> /root/.bashrc

# comando padrão para iniciar bash interativo
CMD ["/bin/bash"]

