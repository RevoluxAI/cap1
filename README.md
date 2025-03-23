# Informações do Grupo

|Nome Completo|RM|
|---|---|
|GABRIELA MAMEDE GAGLIARDI|RM563641|
|LEONARDO DE SENA|RM563351|
|MOISES DE LIMA CAVALCANTE|RM561909|
|RICARDO BORGES SOARES|RM561421|
|VIVIAN NASCIMENTO SILVA AMORIM|RM565078|

---

# Desenvolvimento de Aplicação para Agricultura Digital

O projeto consiste na criação de uma aplicação em Python para auxiliar no 
planejamento agrícola, considerando duas culturas distintas. A aplicação 
calcula a área de plantio de cada cultura com base em diferentes figuras 
geométricas, além de estimar o manejo de insumos, como a quantidade necessária 
de fertilizantes e defensivos agrícolas.


# Organização dos Dados

Os dados são organizados em vetores e manipulados por meio de um menu 
interativo, permitindo entrada, atualização, exclusão e exibição das 
informações. O código utiliza repetições e decisões para garantir a 
funcionalidade do sistema.

Não obstante, os dados gerados são utilizados num aplicativo complementar em R,
que calcula estatísticas básicas, com média e desvio padrão. O projeto também 
inclui a conexão com uma API meteorológica pública via R, permitindo a coleta e
exibição de informações climáticas no terminal.
Formatação de Entrega do Trabalho

O trabalho é versionado no GitHub e documentado com um resumo acadêmico sobre o
tema, formatado conforme as diretrizes especificadas. A entrega final inclui um
pacote ZIP contendo todos os arquivos do projeto, um resumo do artigo e um 
vídeo demonstrativo do funcionamento das aplicações em Python e R.

---

# Modo de Uso
Este projeto oferece duas maneira de instalações. A primeira requer um
conhecimento mais técnico e, portanto, apresenta uma complexidade maior e o
usuário precisará saber lidar com a instalação de dependências das bibliotecas
Python e R, usando ferramentas auxiliares como Python VENV com PIP e RENV, 
respectivamente.

A outra instalação utiliza o conceito de container para abstrair a complexidade
de instalação, a execução de todos os procedimentos subsequencialmente usados no
modo manual, mas executados automaticamente ao executar o arquivo
"dev.dockerfile" (Dockerfile) usando Podman ou Docker. Duas aplicações que 
implementam container no padrão OCI.

Recomendamos o optar pela "Instalação Automática" para usuários com intenção de
somente executar a aplicação. Contrapartida, se opta por modificar o software
arbitrariamente, recomendamos que realize a instalação manual para obter o
ambiente de desenvolvimento organizado e preparado em sua máquina (ambiente host).

## 1 - Instalação Manual

Requer a instalação do Python3, R e sistema operacional Linux.

Nota: se estiver usando MS Windows, use WSL2 e instale a distro Linux de sua
escolha.

1. Clone o repositório git -- o `depth=1` é usado para aquele que optar por
   obter somente o commit atual ao invés de todos os commits (histórico) do 
   repositório.

        $ git clone https://github.com/RevoluxAI/cap1 --depth=1

2. Para evitar instalar bibliotecas extras em sua máquina, use Python Virtual
   Environment (python3-venv):

        $ cd cap1
        $ python3 -m venv cap1-venv 
        $ . cap1-venv/bin/activate

**Nota:** se não tiver o módulo `venv`, instale usando a sua mirror; o nome
do pacote, provavelmente é: `python3-venv`.

use o "activate" consoante ao seu terminal em uso. Por exemplo:
se estiver usando Bash Shell, execute:

        $ . cap1-venv/bin/activate

para mais detalhes, consulte a documentação do python venv. :-)

Se a execução deu certo, o seu terminal ficará parecido com isto:

        (cap1-venv) $

Agora, basta atualizar o python3-pip e instalar as bibliotecas do Python3.
Use o `requirements.txt`:

        (cap1-venv) $ python3 -m pip install --upgrade pip
        (cap1-venv) $ python3 -m pip install -r requirements.txt

**Nota:** Caso não tenha o "PIP", instale. O pacote deve constar na mirror
com o nome: `python3-pip`

### 1.1. Execução

O projeto pode ser executado tanto por linha de comando ou usando o web server.
Usando o CLI:

    $ python3 main.py

Usando o web server

    $ python3 web_api.py

O script disponibiliza modo de desenvolvedor usando a variável de ambiente
`DEBUG=true` (padrão: `false`).

    $ DEBUG=true python3 web_api.py


## 2 - Instalação Automática

Optando pela execução automática, não requer a leitura da seção anterior.
Requer a instalação do Docker ou Podman, apesar de funcionar bem no Windows,
recomendamos preparar no ambiente Linux -- se estiver usando MS Windows, use
o Linux sob WSL2.

Nota: recomendamos que utilize Podman porque simplifica a execução do container
no sistema usando grupos ao invés de inicializar um serviço (daemon) como ocorre
no Docker -- especialmente, se estiver usando ambiente virtualizado.

Após o sistema operacional Linux preparado, execute:

    $ bash dev.sh -f dev.dockerfile build

Caso a instalação seja sucedida, as últimas mensagens de saída será 
semanticamente esta:

    Successfully tagged localhost/farmtech-dev:latest
    13b6e9c7aa672853bf64a6b6ddd235d07e467b5849393aff238ac072d19a8d65                                                                                                                     
    SUCESSO: Imagem 'farmtech-dev' construída com sucesso!                                                                                                                               

Assim, a imagem do container OCI está pronto para execução.

### 2.1. Execução

Obtido a imagem do container OCI. Use a mesma tecnologia de containerização que
foi utilizada para montar a imagem do container. A ferramenta faz a
identificação automática do Docker ou Podman instalado e acessível no ambiente.

Execute a imagem para inicializar o container:

Podman

    $ podman run -it -p 5000:5000 --name techfarm  localhost/farmtech-dev:latest

Docker

    $ docker run -it -p 5000:5000 --name techfarm farmtech-dev:latest

Caso der certo, depará com o terminal semelhante a este:

    FarmTech Solutions - Ambiente de Desenvolvimento
    Comandos úteis:
      python web_api.py        # Iniciar aplicação  
      python -m pytest         # Executar testes  
      ipython                  # Shell Python interativo 
    root@26859254432b:/app#

Chegado até aqui, basta executar a aplicação:

WEB SERVER:

    $ python3 web_api.py

O script disponibiliza modo de desenvolvedor usando a variável de ambiente
`DEBUG=true` (padrão: `false`).

    $ DEBUG=true python3 web_api.py


CLI:

    $ python main.py

---

# Recomendações para Cultivo de Cana-de-Açúcar por Ciclo

Com base nas práticas agrícolas comuns para cana-de-açúcar no Brasil,
especialmente em São Paulo; segue as recomendações para cada ciclo:

## Ciclo Curto (Precoce)
- **Área recomendada:** 5-10 hectares (viável em menor escala devido ao retorno mais rápido)
- **Espaçamento:** 1,4 a 1,5 metros entre linhas
- **Características do ciclo:** Maturação em 8-10 meses, colheita mais rápida
- **Sistema de irrigação:** Gotejamento (mais eficiente para ciclos curtos)
  - Frequência: Alta (a cada 2-3 dias em períodos secos)
  - Volume: 4-5 mm/dia
  - Eficiência: 90-95% de aproveitamento da água

## Ciclo Médio
- **Área recomendada:** 10-20 hectares
- **Espaçamento:** 1,5 a 1,6 metros entre linhas
- **Características do ciclo:** Maturação em 12-14 meses, equilíbrio entre rendimento e tempo
- **Sistema de irrigação:** Aspersão convencional ou pivô central
  - Frequência: Moderada (a cada 5-7 dias em períodos secos)
  - Volume: 5-7 mm/dia
  - Eficiência: 75-85% de aproveitamento da água

## Ciclo Longo (Tardio)
- **Área recomendada:** 20+ hectares (maior escala para compensar o ciclo mais longo)
- **Espaçamento:** 1,6 a 1,8 metros entre linhas
- **Características do ciclo:** Maturação em 16-18 meses, maior produtividade total
- **Sistema de irrigação:** Aspersão de maior alcance
  - Frequência: Baixa (a cada 7-10 dias em períodos secos)
  - Volume: 8-10 mm/dia
  - Eficiência: 70-80% de aproveitamento da água

Estas recomendações devem ser ajustadas conforme análise de solo,condições 
climáticas específicas e objetivo do cultivo (açúcar, etanol ou forragem).


# Referências

1. [FIAP ON; Cap 1 - Play na sua carreira IA](https://on.fiap.com.br/mod/assign/view.php?id=450291&c=12305)
2. [Repositório Alice; Artigo Científico; Cap 8 - Uso de veículos aéreos não 
tripulados (VANT) em Agricultura de Precisão](https://www.alice.cnptia.embrapa.br/alice/bitstream/doc/1003485/1/CAP8.pdf)

