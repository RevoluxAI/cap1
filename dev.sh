#!/usr/bin/env bash
#
# farmTech Solutions - Container Development Environment
# 
# este script facilita o trabalho com o ambiente de desenvolvimento 
# baseado em Docker/Podman para a aplicação FarmTech Solutions.
#

set -e              # encerra em caso de erro
set -o pipefail     # propaga erros em pipes

# constantes
readonly SCRIPT_NAME=$(basename "$0")
readonly IMAGE_NAME="farmtech-dev"
readonly CONTAINER_NAME="farmtech-dev-container"
readonly DEFAULT_PORT=5000
readonly DEFAULT_DOCKERFILE="dev.dockerfile"

# cores para output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# configurações padrão
PORT=$DEFAULT_PORT
MOUNT_LOCAL=false
CONTAINER_TOOL=""
USE_PODMAN=false
USE_ROOT=false
DOCKERFILE=$DEFAULT_DOCKERFILE

# função para exibir mensagens de erro e sair
error() {
    echo -e "${RED}ERRO: $1${NC}" >&2
    exit 1
}

# função para exibir mensagens de informação
info() {
    echo -e "${BLUE}INFO: $1${NC}"
}

# função para exibir mensagens de sucesso
success() {
    echo -e "${GREEN}SUCESSO: $1${NC}"
}

# função para exibir mensagens de aviso
warning() {
    echo -e "${YELLOW}AVISO: $1${NC}"
}

# função para determinar qual ferramenta de container usar (docker ou podman)
detect_container_tool() {
    info "Detectando ferramenta de containers disponível..."
    
    # verifica se o usuário especificou uma ferramenta
    if [ "$USE_PODMAN" = true ]; then
        if command -v podman &> /dev/null; then
            CONTAINER_TOOL="podman"
            success "Usando Podman conforme solicitado."
            return 0
        else
            error "Podman foi especificado mas não está instalado."
        fi
    fi
    
    # verifica Docker primeiro
    if command -v docker &> /dev/null; then
        # testa se o daemon do Docker está funcionando
        if docker info &> /dev/null; then
            CONTAINER_TOOL="docker"
            success "Docker detectado e será utilizado."
            return 0
        else
            warning "Docker está instalado mas o daemon não está acessível."
        fi
    fi
    
    # se Docker não estiver disponível ou não funcionando, tenta Podman
    if command -v podman &> /dev/null; then
        # testa se o Podman está funcionando
        if podman info &> /dev/null; then
            CONTAINER_TOOL="podman"
            success "Podman detectado e será utilizado."
            return 0
        else
            warning "Podman está instalado mas não está funcionando corretamente."
        fi
    fi
    
    # nenhuma ferramenta disponível
    error "Nem Docker nem Podman estão disponíveis ou funcionando. Por favor, instale e configure uma destas ferramentas."
}

# função para construir a imagem de desenvolvimento
build_image() {
    info "Construindo imagem de desenvolvimento '$IMAGE_NAME' usando arquivo '$DOCKERFILE'..."
    
    # verifica se o arquivo Dockerfile existe
    if [ ! -f "$DOCKERFILE" ]; then
        error "Arquivo Dockerfile '$DOCKERFILE' não encontrado."
    fi
    
    if ! $CONTAINER_TOOL build -t $IMAGE_NAME -f "$DOCKERFILE" .; then
        error "Falha ao construir a imagem de desenvolvimento."
    fi
    
    success "Imagem '$IMAGE_NAME' construída com sucesso!"
}

# função para verifica se a imagem existe
check_image() {
    if [[ "$($CONTAINER_TOOL images -q $IMAGE_NAME 2> /dev/null)" == "" ]]; then
        warning "Imagem '$IMAGE_NAME' não encontrada."
        build_image
    else
        info "Imagem '$IMAGE_NAME' encontrada."
    fi
}

# função para limpa recursos
cleanup() {
    info "Removendo recursos não utilizados..."
    
    # verifica se existe o container e remove se estiver parado
    if $CONTAINER_TOOL ps -a --format "{{.Names}}" 2>/dev/null | grep -q $CONTAINER_NAME; then
        if ! $CONTAINER_TOOL ps --format "{{.Names}}" 2>/dev/null | grep -q $CONTAINER_NAME; then
            if ! $CONTAINER_TOOL rm $CONTAINER_NAME &> /dev/null; then
                warning "Não foi possível remover o container '$CONTAINER_NAME'."
            else
                info "Container '$CONTAINER_NAME' removido."
            fi
        else
            warning "Container '$CONTAINER_NAME' está em execução. Execute '$CONTAINER_TOOL stop $CONTAINER_NAME' para parar."
        fi
    fi
    
    # pergunta antes de remover a imagem
    read -p "Remover a imagem '$IMAGE_NAME'? [s/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        if ! $CONTAINER_TOOL rmi $IMAGE_NAME &> /dev/null; then
            warning "Não foi possível remover a imagem '$IMAGE_NAME'."
        else
            success "Imagem '$IMAGE_NAME' removida com sucesso."
        fi
    fi
}

# função para exibir a ajuda
show_help() {
    cat << EOF
Uso: $SCRIPT_NAME [OPÇÃO] [COMANDO]

Gerencia o ambiente de desenvolvimento com Docker/Podman para FarmTech Solutions.

Comandos:
  build       Constrói a imagem de desenvolvimento
  run         Executa a aplicação web principal
  test        Executa os testes unitários
  shell       Inicia uma sessão shell interativa (padrão se nenhum comando for especificado)
  cleanup     Remove containers parados e pergunta se deseja remover a imagem

Opções:
  -p, --port PORT     Especifica a porta para mapear (padrão: 5000)
  -m, --mount         Monta diretório local no container para desenvolvimento
  -f, --file FILE     Especifica o arquivo Dockerfile a ser usado (padrão: dev.dockerfile)
  --podman            Força o uso do Podman em vez de Docker
  --root              Executa o container como root (útil para resolver problemas de permissão)
  -h, --help          Exibe esta ajuda e sai

Exemplos:
  $SCRIPT_NAME build                         # Constrói a imagem usando dev.dockerfile
  $SCRIPT_NAME -f Dockerfile.prod build      # Constrói a imagem usando Dockerfile.prod
  $SCRIPT_NAME                              # Inicia shell interativo
  $SCRIPT_NAME -p 8080 run                  # Executa a aplicação web na porta 8080
  $SCRIPT_NAME -m test                      # Executa os testes montando diretório local
  $SCRIPT_NAME --podman --root run          # Executa a aplicação usando Podman como root
  $SCRIPT_NAME cleanup                      # Limpa recursos do container

EOF
}

# função para executar comando no container
run_container() {
    local cmd=$1
    local port_mapping=""
    local volume_mapping=""
    local additional_opts=""
    local user_opt=""
    
    # configura mapeamento de porta se necessário
    if [[ "$cmd" == "run" || "$cmd" == "shell" ]]; then
        port_mapping="-p $PORT:5000"
    fi
    
    # configura volume se solicitado
    if [[ "$MOUNT_LOCAL" == true ]]; then
        # para Podman, adiciona opções de SELinux :Z
        if [[ "$CONTAINER_TOOL" == "podman" ]]; then
            volume_mapping="-v $(pwd):/app:Z"
        else
            volume_mapping="-v $(pwd):/app"
        fi
        info "Montando diretório atual no container."
    fi
    
    # opções específicas para Podman
    if [[ "$CONTAINER_TOOL" == "podman" ]]; then
        # adiciona opções específicas para Podman
        if [[ "$USE_ROOT" == true ]]; then
            # se --root foi especificado, executa como root
            user_opt="--user=0"
            info "Container será executado como root."
        else
            # em vez de --userns=keep-id, usa uma combinação que realmente funciona
            user_opt="--userns=keep-id"
            
            # verifica se estamos no SELinux
            if command -v getenforce &> /dev/null; then
                selinux_status=$(getenforce 2>/dev/null || echo "Disabled")
                if [[ "$selinux_status" != "Disabled" ]]; then
                    info "SELinux detectado. Ajustando mapeamento de volume."
                    # se o volume já tiver opção :Z, não adicione novamente
                    if [[ "$volume_mapping" != *":Z"* && "$MOUNT_LOCAL" == true ]]; then
                        volume_mapping="$volume_mapping:Z"
                    fi
                fi
            fi
        fi
    fi
    
    # constrói comando final para execução
    local run_cmd=""
    case "$cmd" in
        run)
            info "Iniciando aplicação na porta $PORT usando $CONTAINER_TOOL..."
            run_cmd="cd /app && python web_api.py"
            ;;
        test)
            info "Executando testes usando $CONTAINER_TOOL..."
            run_cmd="cd /app && python -m pytest"
            ;;
        shell|"")
            info "Iniciando shell interativo usando $CONTAINER_TOOL..."
            run_cmd="/bin/bash"
            ;;
        *)
            error "Comando desconhecido: $cmd"
            ;;
    esac
    
    # executa o container com todas as opções apropriadas
    if [[ "$cmd" == "shell" || "$cmd" == "" ]]; then
        # para shell interativo
        $CONTAINER_TOOL run -it --rm $port_mapping $volume_mapping $user_opt $additional_opts \
            --workdir /app \
            --name $CONTAINER_NAME $IMAGE_NAME $run_cmd
    else
        # para comandos não-interativos
        $CONTAINER_TOOL run --rm $port_mapping $volume_mapping $user_opt $additional_opts \
            --workdir /app \
            --name $CONTAINER_NAME $IMAGE_NAME /bin/bash -c "$run_cmd"
    fi
}

# processa argumentos
COMMAND=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        build|run|test|shell|cleanup)
            COMMAND="$1"
            shift
            ;;
        -p|--port)
            if [[ -z "$2" || ! "$2" =~ ^[0-9]+$ ]]; then
                error "Porta inválida. Deve ser um número."
            fi
            PORT="$2"
            shift 2
            ;;
        -f|--file)
            if [[ -z "$2" ]]; then
                error "Arquivo Dockerfile não especificado."
            fi
            DOCKERFILE="$2"
            shift 2
            ;;
        -m|--mount)
            MOUNT_LOCAL=true
            shift
            ;;
        --podman)
            USE_PODMAN=true
            shift
            ;;
        --root)
            USE_ROOT=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            error "Opção desconhecida: $1"
            ;;
    esac
done

# detecta e configura a ferramenta de container (Docker ou Podman)
detect_container_tool

# executa o comando principal
case "$COMMAND" in
    build)
        build_image
        ;;
    cleanup)
        cleanup
        ;;
    run|test|shell|"")
        check_image
        run_container "${COMMAND:-shell}"
        ;;
esac

exit 0

