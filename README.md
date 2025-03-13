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

# Modo de Uso:

Requer a instalação do Python3, R e sistema operacional Linux.

1. Clone o repositóriogit

        $ git clone https://github.com/RevoluxAI/cap1 --depth=1

2. Para evitar instalar bibliotecas extras em sua máquina, use Python Virtual
   Environment (python3-venv):

        $ cd cap1
        $ python3 -m venv cap1-venv 
        $ . cap1-venv/bin/activate

**Nota:** se não tiver o módulo `venv`, instale usando a sua mirror; o nome
do pacote, provavelmente é: `python3-venv`.

use o "activate" consoante ao seu terminal em uso. Por exemplo:
se estiver usando Fish Shell, execute:

        $ . cap1-venv/bin/activate.fish

para mais detalhes, consulte a documentação do python venv. :-)

Se a execução deu certo, seu terminal ficará parecido com isto:

        (cap1-venv) $

Agora, basta atualizar o python3-pip e instalar as bibliotecas do Python3.
Use o `requirements.txt`:

        (cap1-venv) $ python3 -m pip install --upgrade pip
        (cap1-venv) $ python3 -m pip install -r requirements.txt

**Nota:** Caso não tenha o "PIP", instale. O pacote deve constar na mirror
com o nome: `python3-pip`

# Execução:

O projeto pode ser executado tanto por linha de comando ou usando o web server.
Usando o CLI:

    $ python3 main.py

Usando o web server

    $ python3 web_api.py

O script disponibiliza modo de desenvolvedor usando a variável de ambiente
`DEBUG=true` (padrão: `false`).

    $ DEBUG=true python3 web_api.py

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


### Referências:
1. [FIAP ON; Cap 1 - Play na sua carreira IA](https://on.fiap.com.br/mod/assign/view.php?id=450291&c=12305)
2. [Repositório Alice; Artigo Científico; Cap 8 - Uso de veículos aéreos não 
tripulados (VANT) em Agricultura de Precisão](https://www.alice.cnptia.embrapa.br/alice/bitstream/doc/1003485/1/CAP8.pdf)

