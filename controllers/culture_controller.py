#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import logging
import math
import json
import traceback
from typing import Dict, Any, List, Optional, Union
from services.r_integration import send_to_r_for_analysis

logger = logging.getLogger(__name__)



class CultureController:
    """
    Controlador para operações relacionadas a culturas agrícolas.
    Implementa o padrão Facade para simplificar o acesso às funcionalidades do sistema.
    """

    # parâmetros recomendados para cultivo de cana-de-açúcar por ciclo
    SUGARCANE_RECOMMENDATIONS = {
        "curto": {
            "espacamento": {
                "min": 1.4,
                "max": 1.5,
                "ideal": 1.45,
                "unit": "metros"
            },
            "area": {
                "min": 5,
                "max": 10,
                "ideal": 8,
                "unit": "hectares",
                "description": "Viável em menor escala devido ao retorno mais rápido"
            },
            "duracao": {
                "meses": "8-10",
                "description": "Maturação mais rápida, menor produtividade total"
            },
            "irrigacao": {
                "sistema": "Gotejamento",
                "frequencia": "Alta (a cada 2-3 dias em períodos secos)",
                "volume": "4-5 mm/dia",
                "eficiencia": "90-95% de aproveitamento da água",
                "description": "Mais eficiente para ciclos curtos"
            }
        },
        "médio": {
            "espacamento": {
                "min": 1.5,
                "max": 1.6,
                "ideal": 1.55,
                "unit": "metros"
            },
            "area": {
                "min": 10,
                "max": 20,
                "ideal": 15,
                "unit": "hectares",
                "description": "Equilíbrio entre rendimento e tempo"
            },
            "duracao": {
                "meses": "12-14",
                "description": "Equilíbrio entre tempo de cultivo e produtividade"
            },
            "irrigacao": {
                "sistema": "Aspersão convencional ou pivô central",
                "frequencia": "Moderada (a cada 5-7 dias em períodos secos)",
                "volume": "5-7 mm/dia",
                "eficiencia": "75-85% de aproveitamento da água",
                "description": "Balanceamento entre eficiência e cobertura"
            }
        },
        "longo": {
            "espacamento": {
                "min": 1.6,
                "max": 1.8,
                "ideal": 1.7,
                "unit": "metros"
            },
            "area": {
                "min": 20,
                "max": None,  # sem limite máximo definido
                "ideal": 30,
                "unit": "hectares",
                "description": "Maior escala para compensar o ciclo mais longo"
            },
            "duracao": {
                "meses": "16-18",
                "description": "Maior tempo de cultivo, maior produtividade total"
            },
            "irrigacao": {
                "sistema": "Aspersão de maior alcance",
                "frequencia": "Baixa (a cada 7-10 dias em períodos secos)",
                "volume": "8-10 mm/dia",
                "eficiencia": "70-80% de aproveitamento da água",
                "description": "Prioriza cobertura de grandes áreas"
            }
        }
    }


    # parâmetros recomendados para cultivo de soja por variedade
    SOYBEAN_RECOMMENDATIONS = {
        "convencional": {
            "espacamento": {
                "min": 0.4,
                "max": 0.5,
                "ideal": 0.45,
                "unit": "metros"
            },
            "area": {
                "min": 5,
                "max": 100,
                "ideal": 50,
                "unit": "hectares",
                "description": "Área recomendada para manejo eficiente"
            },
            "duracao": {
                "meses": "4-5",
                "description": "Ciclo usual para soja convencional"
            },
            "irrigacao": {
                "sistema": "Aspersão convencional",
                "frequencia": "Moderada (a cada 3-5 dias em períodos secos)",
                "volume": "5-6 mm/dia",
                "eficiencia": "80-85% de aproveitamento da água",
                "description": "Irrigação complementar para períodos críticos"
            }
        },
        "transgênica": {
            "espacamento": {
                "min": 0.4,
                "max": 0.6,
                "ideal": 0.45,
                "unit": "metros"
            },
            "area": {
                "min": 10,
                "max": 300,
                "ideal": 80,
                "unit": "hectares",
                "description": "Maior escala para maximizar o retorno da tecnologia"
            },
            "duracao": {
                "meses": "4-5",
                "description": "Ciclo similar à variedade convencional, com maior resistência"
            },
            "irrigacao": {
                "sistema": "Gotejamento ou aspersão",
                "frequencia": "Baixa a moderada (a cada 5-7 dias em períodos secos)",
                "volume": "4-5 mm/dia",
                "eficiencia": "85-90% de aproveitamento da água",
                "description": "Maior resistência ao déficit hídrico"
            }
        }
    }


    def __init__(self):
        """Inicializa o controlador de culturas"""
        # registro de estratégias de cálculo (Strategy Pattern)
        self.calculation_strategies = {
            "quadrado": self._calculate_square_strategy,
            "retangular": self._calculate_rectangular_strategy
        }

        # cache de dados meteorológicos (pode ser atualizado periodicamente)
        self.weather_data = None


    def create_culture(self, culture_type: int, area: float, espacamento: float, 
                      with_irrigation: bool = False, **kwargs) -> Dict[str, Any]:
        """
        Cria uma nova cultura com os parâmetros especificados

        Args:
            culture_type (int): Tipo de cultura (1=Soja, 2=Cana-de-Açúcar)
            area (float): Área de plantio em hectares
            espacamento (float): Espaçamento entre linhas em metros
            with_irrigation (bool, optional): Se deve incluir sistema de irrigação
            **kwargs: Parâmetros adicionais específicos para cada cultura

        Returns:
            Dict[str, Any]: Dados da cultura criada
        """
        # valida entrada
        if area <= 0:
            raise ValueError("A área de plantio deve ser maior que zero")

        if espacamento <= 0:
            raise ValueError("O espaçamento entre linhas deve ser maior que zero")

        # cria dados básicos da cultura
        culture_data = {
            "area": area,
            "espacamento": espacamento,
            "irrigacao": with_irrigation
        }

        # adiciona dados específicos por tipo de cultura
        if culture_type == 1:  # Soja
            strategy = "quadrado"
            variedade = kwargs.get("variedade", "convencional")
            culture_data.update({
                "tipo": "Soja",
                "variedade": variedade,
                "strategy": strategy
            })

            # valida e obtém recomendações para soja
            recommendations = self.validate_soybean_parameters(area, espacamento, variedade, with_irrigation)
            culture_data["recomendacoes"] = recommendations

            # parâmetros específicos para soja
            culture_data["dosagem_herbicida"] = 2.5     # L/ha para Glifosato
            culture_data["dosagem_fertilizante"] = 300  # kg/ha para NPK

        elif culture_type == 2:  # Cana-de-Açúcar
            strategy = "retangular"
            
            # obtém ciclo ou usar valor padrão
            ciclo = kwargs.get("ciclo", "médio")
            culture_data.update({
                "tipo": "Cana-de-Açúcar",
                "ciclo": ciclo,
                "strategy": strategy
            })

            # valida e obtém recomendações para cana-de-açúcar
            recommendations = self.validate_sugarcane_parameters(area, espacamento, ciclo, with_irrigation)
            culture_data["recomendacoes"] = recommendations

            # parâmetros específicos para cana
            culture_data["dosagem_herbicida"] = 3.0  # L/ha para herbicida de cana
            culture_data["dosagem_fertilizante"] = 400  # kg/ha para NPK+Micro

        else:
            raise ValueError(f"Tipo de cultura inválido: {culture_type}")

        # cálculo do número de linhas baseado na estratégia
        linhas = self.calculate_lines_by_strategy(strategy, area, espacamento)
        culture_data["linhas_calculadas"] = linhas

        # cálculo de insumos
        self._calculate_inputs(culture_data)

        # se tiver irrigação, calcule consumo de água
        if with_irrigation:
            irrigation_rate = 0.8  # Taxa de irrigação em L/m²
            culture_data["consumo_agua"] = area * 10000 * irrigation_rate  # em litros

        # envia dados para análise no R e processa os resultados estatísticos
        try:
            r_analysis = send_to_r_for_analysis(culture_data)
            if r_analysis:
                culture_data["analise_estatistica"] = r_analysis

                # extrai e formatar estatísticas para uso no frontend
                if "input_summary" in r_analysis:
                    summary = r_analysis["input_summary"]
                    # formata estatísticas para exibição
                    formatted_stats = {}
                    
                    for field, stats in summary.items():
                        if isinstance(stats, dict) and "mean" in stats and "std_dev" in stats:
                            # cria um dicionário com estatísticas mais detalhadas
                            formatted_stats[field] = {
                                "media": round(stats["mean"], 2) if not isinstance(stats["mean"], str) else stats["mean"],
                                "desvio_padrao": round(stats["std_dev"], 2) if not isinstance(stats["std_dev"], str) else stats["std_dev"],
                                "coeficiente_variacao": round((stats["std_dev"] / stats["mean"]) * 100, 2) if not isinstance(stats["std_dev"], str) and not isinstance(stats["mean"], str) and stats["mean"] != 0 else "N/A",
                                "erro_padrao": round(stats["std_dev"] / (stats["n"] ** 0.5), 2) if not isinstance(stats["std_dev"], str) and stats.get("n", 0) > 0 else "N/A",
                                "intervalo_confianca": [
                                    round(stats.get("conf_low", stats["mean"] - 1.96 * stats["std_dev"] / (stats["n"] ** 0.5)), 2),
                                    round(stats.get("conf_high", stats["mean"] + 1.96 * stats["std_dev"] / (stats["n"] ** 0.5)), 2)
                                ] if not isinstance(stats["mean"], str) and not isinstance(stats["std_dev"], str) and stats.get("n", 0) > 0 else ["N/A", "N/A"],
                                "minimo": stats.get("min", "N/A"),
                                "maximo": stats.get("max", "N/A"),
                                "amplitude": round(stats.get("max", 0) - stats.get("min", 0), 2) if "max" in stats and "min" in stats else "N/A",
                                "mediana": stats.get("median", "N/A"),
                                "q1": stats.get("q1", "N/A"),
                                "q3": stats.get("q3", "N/A"),
                                "iqr": stats.get("iqr", "N/A"),
                                "tamanho_amostra": stats.get("n", 0)
                            }
                    
                    if formatted_stats:
                        # adiciona explicações sobre as estatísticas
                        culture_data["estatisticas_formatadas"] = formatted_stats
                        culture_data["explicacoes_estatisticas"] = {
                            "media": "Média aritmética dos valores (soma dividida pelo número de observações)",
                            "desvio_padrao": "Medida de dispersão que indica quanto os valores estão espalhados em relação à média",
                            "coeficiente_variacao": "Desvio padrão relativo à média, expresso em porcentagem. Útil para comparar variabilidade entre diferentes conjuntos de dados",
                            "erro_padrao": "Estimativa da variabilidade da média amostral em relação à média populacional",
                            "intervalo_confianca": "Intervalo onde a média populacional tem 95% de probabilidade de estar contida",
                            "amplitude": "Diferença entre o valor máximo e mínimo",
                            "mediana": "Valor central que divide o conjunto de dados em duas partes iguais",
                            "q1": "Primeiro quartil - 25% dos valores estão abaixo deste ponto",
                            "q3": "Terceiro quartil - 75% dos valores estão abaixo deste ponto",
                            "iqr": "Intervalo interquartil - diferença entre Q3 e Q1, usado para identificar outliers"
                        }

                
                # processa análises estatísticas avançadas, se disponíveis
                if "statistical_analysis" in r_analysis:
                    stat_analysis = r_analysis["statistical_analysis"]
                    
                    # extrai informações sobre outliers se existirem
                    outliers_info = {}
                    for key, value in stat_analysis.items():
                        if key.endswith("_outliers") and "n_outliers" in value and value["n_outliers"] > 0:
                            field = key.replace("_outliers", "")
                            outliers_info[field] = {
                                "quantidade": value["n_outliers"],
                                "porcentagem": round(value.get("percentage", 0), 2),
                                "valores": value.get("outliers", []),
                                "metodo": value.get("method", "desconhecido")
                            }
                    
                    if outliers_info:
                        culture_data["outliers_detectados"] = outliers_info
                    
                    # extrai informações sobre tendências se existirem
                    trends_info = {}
                    for key, value in stat_analysis.items():
                        if key.endswith("_trend") and "trend" in value:
                            field = key.replace("_trend", "")
                            trends_info[field] = {
                                "tendencia": value["trend"],
                                "inclinacao": value.get("slope", "N/A"),
                                "significancia": value.get("significance", "N/A"),
                                "metodo": value.get("method", "análise simples")
                            }
                    
                    if trends_info:
                        culture_data["analise_tendencia"] = trends_info
        except Exception as e:
            logger.warning(f"Não foi possível obter análise R completa: {str(e)}")
            
        return culture_data


    def validate_sugarcane_parameters(self, area: float, espacamento: float, 
                                     ciclo: str, with_irrigation: bool) -> Dict[str, Any]:
        """
        Valida os parâmetros para cultivo de cana-de-açúcar e fornece recomendações

        Args:
            area (float): Área de plantio em hectares
            espacamento (float): Espaçamento entre linhas em metros
            ciclo (str): Ciclo de cultivo (curto, médio, longo)
            with_irrigation (bool): Se sistema de irrigação está ativado

        Returns:
            Dict[str, Any]: Recomendações e validações
        """
        # normaliza ciclo para garantir consistência
        ciclo = ciclo.lower() if ciclo else "médio"
        
        # se ciclo não está nas recomendações, usar "médio" como padrão
        if ciclo not in self.SUGARCANE_RECOMMENDATIONS:
            ciclo = "médio"
            
        # obtém recomendações para o ciclo selecionado
        ciclo_rec = self.SUGARCANE_RECOMMENDATIONS[ciclo]
        
        # valida espaçamento
        espacamento_status = "adequado"
        espacamento_msg = "O espaçamento está dentro do intervalo recomendado."
        
        if espacamento < ciclo_rec["espacamento"]["min"]:
            espacamento_status = "abaixo"
            espacamento_msg = (
                f"O espaçamento está abaixo do mínimo recomendado "
                f"({ciclo_rec['espacamento']['min']} m) para o ciclo {ciclo}. "
                f"Espaçamento muito pequeno pode dificultar a mecanização e reduzir a produtividade."
            )
        elif espacamento > ciclo_rec["espacamento"]["max"]:
            espacamento_status = "acima"
            espacamento_msg = (
                f"O espaçamento está acima do máximo recomendado "
                f"({ciclo_rec['espacamento']['max']} m) para o ciclo {ciclo}. "
                f"Espaçamento muito grande pode reduzir o aproveitamento da área."
            )
        
        # valida área
        area_status = "adequada"
        area_msg = "A área está dentro do intervalo recomendado."
        
        if area < ciclo_rec["area"]["min"]:
            area_status = "abaixo"
            area_msg = (
                f"A área está abaixo do mínimo recomendado "
                f"({ciclo_rec['area']['min']} ha) para o ciclo {ciclo}. "
                f"{ciclo_rec['area']['description']}"
            )
        elif ciclo_rec["area"]["max"] and area > ciclo_rec["area"]["max"]:
            area_status = "acima"
            area_msg = (
                f"A área está acima do máximo recomendado "
                f"({ciclo_rec['area']['max']} ha) para o ciclo {ciclo}. "
                f"Considere se tem recursos suficientes para manejo adequado."
            )
        
        # recomendações para irrigação
        irrigacao_rec = ciclo_rec["irrigacao"]
        irrigacao_msg = ""
        
        if with_irrigation:
            irrigacao_msg = (
                f"Sistema de irrigação recomendado: {irrigacao_rec['sistema']}. "
                f"Frequência: {irrigacao_rec['frequencia']}. "
                f"Volume: {irrigacao_rec['volume']}. "
                f"Eficiência: {irrigacao_rec['eficiencia']}."
            )
        else:
            irrigacao_msg = (
                f"A irrigação é altamente recomendada para o ciclo {ciclo}. "
                f"Sistema ideal: {irrigacao_rec['sistema']}. "
                f"Sem irrigação, a produtividade pode ser significativamente reduzida."
            )
        
        # juntar todas as recomendações
        return {
            "ciclo_info": {
                "duracao": ciclo_rec["duracao"]["meses"] + " meses",
                "descricao": ciclo_rec["duracao"]["description"]
            },
            "espacamento": {
                "status": espacamento_status,
                "mensagem": espacamento_msg,
                "recomendado": {
                    "min": ciclo_rec["espacamento"]["min"],
                    "max": ciclo_rec["espacamento"]["max"],
                    "ideal": ciclo_rec["espacamento"]["ideal"]
                }
            },
            "area": {
                "status": area_status,
                "mensagem": area_msg,
                "recomendado": {
                    "min": ciclo_rec["area"]["min"],
                    "max": ciclo_rec["area"]["max"],
                    "ideal": ciclo_rec["area"]["ideal"]
                }
            },
            "irrigacao": {
                "ativa": with_irrigation,
                "mensagem": irrigacao_msg,
                "sistema": irrigacao_rec["sistema"],
                "frequencia": irrigacao_rec["frequencia"],
                "volume": irrigacao_rec["volume"],
                "eficiencia": irrigacao_rec["eficiencia"]
            }
        }


    def validate_soybean_parameters(self, area: float, espacamento: float, 
                                  variedade: str, with_irrigation: bool) -> Dict[str, Any]:
        """
        Valida os parâmetros para cultivo de soja e fornece recomendações

        Args:
            area (float): Área de plantio em hectares
            espacamento (float): Espaçamento entre linhas em metros
            variedade (str): Variedade de soja (convencional ou transgênica)
            with_irrigation (bool): Se sistema de irrigação está ativado

        Returns:
            Dict[str, Any]: Recomendações e validações
        """
        # normaliza variedade para garantir consistência
        variedade = variedade.lower() if variedade else "convencional"
        
        # se variedade não está nas recomendações, usar "convencional" como padrão
        if variedade not in self.SOYBEAN_RECOMMENDATIONS:
            variedade = "convencional"
            
        # obtém recomendações para a variedade selecionada
        variedade_rec = self.SOYBEAN_RECOMMENDATIONS[variedade]
        
        # valida espaçamento
        espacamento_status = "adequado"
        espacamento_msg = "O espaçamento está dentro do intervalo recomendado."
        
        if espacamento < variedade_rec["espacamento"]["min"]:
            espacamento_status = "abaixo"
            espacamento_msg = (
                f"O espaçamento está abaixo do mínimo recomendado "
                f"({variedade_rec['espacamento']['min']} m) para soja {variedade}. "
                f"Espaçamento muito pequeno pode dificultar o desenvolvimento das plantas."
            )
        elif espacamento > variedade_rec["espacamento"]["max"]:
            espacamento_status = "acima"
            espacamento_msg = (
                f"O espaçamento está acima do máximo recomendado "
                f"({variedade_rec['espacamento']['max']} m) para soja {variedade}. "
                f"Espaçamento muito grande pode reduzir a produtividade."
            )
        
        # valida área
        area_status = "adequada"
        area_msg = "A área está dentro do intervalo recomendado."
        
        if area < variedade_rec["area"]["min"]:
            area_status = "abaixo"
            area_msg = (
                f"A área está abaixo do mínimo recomendado "
                f"({variedade_rec['area']['min']} ha) para soja {variedade}. "
                f"{variedade_rec['area']['description']}"
            )
        elif variedade_rec["area"]["max"] and area > variedade_rec["area"]["max"]:
            area_status = "acima"
            area_msg = (
                f"A área está acima do máximo recomendado "
                f"({variedade_rec['area']['max']} ha) para soja {variedade}. "
                f"Considere se tem recursos suficientes para manejo adequado."
            )
        
        # recomendações para irrigação
        irrigacao_rec = variedade_rec["irrigacao"]
        irrigacao_msg = ""
        
        if with_irrigation:
            irrigacao_msg = (
                f"Sistema de irrigação recomendado: {irrigacao_rec['sistema']}. "
                f"Frequência: {irrigacao_rec['frequencia']}. "
                f"Volume: {irrigacao_rec['volume']}. "
                f"Eficiência: {irrigacao_rec['eficiencia']}."
            )
        else:
            irrigacao_msg = (
                f"A irrigação é recomendada para maximizar a produtividade da soja {variedade}. "
                f"Sistema ideal: {irrigacao_rec['sistema']}. "
                f"Sem irrigação, a produtividade pode ser reduzida em períodos de estiagem."
            )
        
        # junta todas as recomendações
        return {
            "variedade_info": {
                "duracao": variedade_rec["duracao"]["meses"] + " meses",
                "descricao": variedade_rec["duracao"]["description"]
            },
            "espacamento": {
                "status": espacamento_status,
                "mensagem": espacamento_msg,
                "recomendado": {
                    "min": variedade_rec["espacamento"]["min"],
                    "max": variedade_rec["espacamento"]["max"],
                    "ideal": variedade_rec["espacamento"]["ideal"]
                }
            },
            "area": {
                "status": area_status,
                "mensagem": area_msg,
                "recomendado": {
                    "min": variedade_rec["area"]["min"],
                    "max": variedade_rec["area"]["max"],
                    "ideal": variedade_rec["area"]["ideal"]
                }
            },
            "irrigacao": {
                "ativa": with_irrigation,
                "mensagem": irrigacao_msg,
                "sistema": irrigacao_rec["sistema"],
                "frequencia": irrigacao_rec["frequencia"],
                "volume": irrigacao_rec["volume"],
                "eficiencia": irrigacao_rec["eficiencia"]
            }
        }


    def calculate_lines(self, culture_id: int, culture_data: Dict[str, Any]) -> int:
        """
        Calcula o número de linhas para uma cultura existente

        Args:
            culture_id (int): ID da cultura no vetor
            culture_data (Dict[str, Any]): Dados da cultura

        Returns:
            int: Número de linhas calculado
        """
        strategy = culture_data.get("strategy", "quadrado")
        area = culture_data.get("area", 0)
        espacamento = culture_data.get("espacamento", 0)

        if espacamento <= 0:
            raise ValueError("Espaçamento inválido. Deve ser maior que zero.")

        return self.calculate_lines_by_strategy(strategy, area, espacamento)

    def calculate_lines_by_strategy(self, strategy: str, area: float, espacamento: float) -> int:
        """
        Calcula o número de linhas usando a estratégia especificada

        Args:
            strategy (str): Nome da estratégia de cálculo
            area (float): Área em hectares
            espacamento (float): Espaçamento entre linhas em metros

        Returns:
            int: Número de linhas calculado
        """
        if strategy not in self.calculation_strategies:
            logger.warning(f"Estratégia '{strategy}' não encontrada. Usando estratégia padrão 'quadrado'.")
            strategy = "quadrado"

        if espacamento <= 0:
            logger.warning(f"Espaçamento inválido: {espacamento}. Usando valor padrão de 1.0")
            espacamento = 1.0

        return self.calculation_strategies[strategy](area, espacamento)

    def _calculate_square_strategy(self, area: float, espacamento: float) -> int:
        """
        Estratégia de cálculo para área quadrada

        Args:
            area (float): Área em hectares
            espacamento (float): Espaçamento entre linhas em metros

        Returns:
            int: Número de linhas calculado
        """
        # converte hectares para metros quadrados (1 ha = 10000 m²)
        area_m2 = area * 10000

        # calcula o lado do quadrado
        lado = math.sqrt(area_m2)

        # calcula o número de linhas
        return int(lado / espacamento)


    def generate_random_cultures(self, culture_type: int, num_samples: int = 10, 
                               with_statistics: bool = True) -> Dict[str, Any]:
        """
        Gera múltiplas culturas aleatórias para análise estatística

        Args:
            culture_type (int): Tipo de cultura (1=Soja, 2=Cana-de-Açúcar)
            num_samples (int): Número de amostras a serem geradas
            with_statistics (bool): Se deve calcular estatísticas sobre os dados gerados

        Returns:
            Dict[str, Any]: Dados gerados e estatísticas
        """
        import random
        import math
        import numpy as np
        from datetime import datetime, timedelta

        if num_samples <= 0:
            raise ValueError("Número de amostras deve ser maior que zero")

        # valida tipo de cultura
        if culture_type not in [1, 2]:
            raise ValueError(f"Tipo de cultura inválido: {culture_type}")

        # configura limites com base no tipo de cultura
        if culture_type == 1:  # Soja
            variedades = ["convencional", "transgênica"]
            area_min, area_max = 5, 100
            espacamento_min, espacamento_max = 0.4, 0.6
            params_name = "variedade"
        else:  # Cana-de-Açúcar
            ciclos = ["curto", "médio", "longo"]
            area_min, area_max = 5, 50
            espacamento_min, espacamento_max = 1.4, 1.8
            params_name = "ciclo"

        # gera culturas aleatórias
        cultures = []
        for i in range(num_samples):
            # gera área aleatória com distribuição log-normal (mais realista)
            area = round(random.lognormvariate(0, 0.5) * (area_max - area_min) / 3 + area_min, 2)
            
            # gera espaçamento aleatório
            espacamento = round(random.uniform(espacamento_min, espacamento_max), 2)
            
            # decide sobre irrigação (30% de chance)
            with_irrigation = random.random() < 0.3
            
            # parâmetros específicos por tipo
            if culture_type == 1:  # Soja
                specific_param = random.choice(variedades)
            else:  # Cana-de-Açúcar
                specific_param = random.choice(ciclos)
            
            # cria cultura
            kwargs = {params_name: specific_param}
            culture = self.create_culture(
                culture_type=culture_type,
                area=area,
                espacamento=espacamento,
                with_irrigation=with_irrigation,
                **kwargs
            )
            
            # adiciona ID para rastreabilidade
            culture['id'] = f"{culture['tipo'].lower()}_{i+1}"
            
            # adiciona data aleatória de plantio (nos últimos 6 meses)
            days_ago = random.randint(0, 180)
            culture['data_plantio'] = (datetime.now().replace(
                hour=0, minute=0, second=0, microsecond=0
            ) - timedelta(days=days_ago)).isoformat() 
 
            cultures.append(culture)

        # calcula estatísticas se solicitado
        statistics = None
        if with_statistics:
            statistics = self._calculate_statistics_for_cultures(cultures)
        
        # resultado
        result = {
            "status": "success",
            "count": len(cultures),
            "cultures": cultures,
            "culture_type": "Soja" if culture_type == 1 else "Cana-de-Açúcar"
        }
        
        if statistics:
            result["statistics"] = statistics
        
        return result


    def _calculate_statistics_for_cultures(self, cultures: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calcula estatísticas para um conjunto de culturas
        
        Args:
            cultures (List[Dict[str, Any]]): Lista de culturas para análise
                
        Returns:
            Dict[str, Any]: Estatísticas calculadas
        """
        import numpy as np
        from collections import Counter
        
        if not cultures or len(cultures) == 0:
            return {"error": "Nenhuma cultura disponível para análise"}
        
        # extrai campos numéricos para análise estatística
        numeric_fields = ["area", "espacamento"]
        
        # adiciona campos calculados se disponíveis
        for culture in cultures:
            if "linhas_calculadas" in culture:
                if "linhas_calculadas" not in numeric_fields:
                    numeric_fields.append("linhas_calculadas")
            if "quantidade_herbicida" in culture:
                if "quantidade_herbicida" not in numeric_fields:
                    numeric_fields.append("quantidade_herbicida")
            if "quantidade_fertilizante" in culture:
                if "quantidade_fertilizante" not in numeric_fields:
                    numeric_fields.append("quantidade_fertilizante")
            if "metros_lineares_total" in culture:
                if "metros_lineares_total" not in numeric_fields:
                    numeric_fields.append("metros_lineares_total")
        
        # estatísticas para campos numéricos
        numeric_stats = {}
        for field in numeric_fields:
            values = [culture.get(field, 0) for culture in cultures]
            if any(values):  # Se houver pelo menos um valor não-zero
                # calcula estatísticas detalhadas
                numeric_stats[field] = {
                    "mean": float(np.mean(values)),
                    "median": float(np.median(values)),
                    "std_dev": float(np.std(values)),
                    "variance": float(np.var(values)),  # Adicionando a variância
                    "std_error": float(np.std(values)/np.sqrt(len(values))),  # Adicionando erro padrão
                    "coefficient_of_variation": float(np.std(values)/np.mean(values)*100) if np.mean(values) != 0 else 0,  # Coeficiente de variação em %
                    "min": float(np.min(values)),
                    "max": float(np.max(values)),
                    "range": float(np.max(values) - np.min(values)),  # Adicionando range (amplitude)
                    "q1": float(np.percentile(values, 25)),
                    "q3": float(np.percentile(values, 75)),
                    "iqr": float(np.percentile(values, 75) - np.percentile(values, 25)),  # Adicionando intervalo interquartil
                    "count": len(values),
                    # adiciona descrições claras para cada estatística
                    "descriptions": {
                        "mean": "Média aritmética dos valores",
                        "median": "Valor central que divide a distribuição ao meio",
                        "std_dev": "Desvio padrão: medida de dispersão dos valores em relação à média",
                        "variance": "Variância: média dos quadrados dos desvios em relação à média",
                        "coefficient_of_variation": "Coeficiente de variação: desvio padrão relativo à média (%)",
                        "std_error": "Erro padrão: estimativa do desvio padrão da média amostral",
                        "min": "Valor mínimo encontrado",
                        "max": "Valor máximo encontrado",
                        "range": "Amplitude: diferença entre o maior e o menor valor",
                        "q1": "Primeiro quartil: 25% dos valores são menores que este",
                        "q3": "Terceiro quartil: 75% dos valores são menores que este",
                        "iqr": "Intervalo interquartil: diferença entre Q3 e Q1"
                    }
                }
        
        # estatísticas para campos categóricos
        categorical_stats = {}
        
        # verifica tipo de cultura para determinar campos categóricos
        culture_type = cultures[0].get("tipo")
        
        if culture_type == "Soja":
            variedades = [culture.get("variedade") for culture in cultures]
            categorical_stats["variedade"] = dict(Counter(variedades))
        elif culture_type == "Cana-de-Açúcar":
            ciclos = [culture.get("ciclo") for culture in cultures]
            categorical_stats["ciclo"] = dict(Counter(ciclos))
        
        # estatísticas para irrigação
        irrigation_count = sum(1 for culture in cultures if culture.get("irrigacao", False))
        categorical_stats["irrigacao"] = {
            "com_irrigacao": irrigation_count,
            "sem_irrigacao": len(cultures) - irrigation_count,
            "percentual_irrigacao": round(irrigation_count / len(cultures) * 100, 2)
        }
        
        # resultados
        return {
            "numeric": numeric_stats,
            "categorical": categorical_stats,
            "sample_size": len(cultures),
            "explanation": {
                "desvio_padrao": "O desvio padrão é uma medida estatística que indica quanto os valores da amostra variam em relação à média. "
                                "Um desvio padrão baixo indica que os valores tendem a estar próximos da média, enquanto um desvio padrão alto "
                                "indica que os valores estão espalhados por uma gama mais ampla. É calculado como a raiz quadrada da variância.",
                "variancia": "A variância mede a dispersão dos valores em relação à média, calculando a média dos quadrados dos desvios. "
                            "Quanto maior a variância, mais dispersos estão os valores em relação à média.",
                "erro_padrao": "O erro padrão é uma estimativa do desvio padrão da média amostral. Ele indica a precisão da estimativa da média "
                              "populacional baseada na amostra atual. Um erro padrão menor indica uma estimativa mais precisa da média."
            }
        }


    def _calculate_rectangular_strategy(self, area: float, espacamento: float, proporcao: float = 1.5) -> int:
        """
        Estratégia de cálculo para área retangular

        Args:
            area (float): Área em hectares
            espacamento (float): Espaçamento entre linhas em metros
            proporcao (float, optional): Proporção comprimento/largura do retângulo

        Returns:
            int: Número de linhas calculado
        """
        # converte hectares para metros quadrados
        area_m2 = area * 10000

        # calcula as dimensões do retângulo
        # para um retângulo de área A e proporção p entre comprimento e largura:
        # comprimento = sqrt(A * p)
        # largura = sqrt(A / p)
        comprimento = math.sqrt(area_m2 * proporcao)
        largura = math.sqrt(area_m2 / proporcao)

        # calcula o número de linhas ao longo da largura
        return int(largura / espacamento)

    def _calculate_inputs(self, culture_data: Dict[str, Any]) -> None:
        """
        Calcula a quantidade de insumos necessários para a cultura

        Args:
            culture_data (Dict[str, Any]): Dados da cultura a ser processada

        Returns:
            None: Os resultados são adicionados diretamente ao dicionário de dados
        """
        area = culture_data.get("area", 0)

        # calcula quantidade de herbicida
        dosagem_herbicida = culture_data.get("dosagem_herbicida", 0)
        culture_data["quantidade_herbicida"] = area * dosagem_herbicida

        # calcula quantidade de fertilizante
        dosagem_fertilizante = culture_data.get("dosagem_fertilizante", 0)
        culture_data["quantidade_fertilizante"] = area * dosagem_fertilizante

        # calcula quantidade total de produtos químicos
        linhas = culture_data.get("linhas_calculadas", 0)
        espacamento = culture_data.get("espacamento", 0)

        # estima o comprimento da linha com base na área e espaçamento
        if linhas > 0 and espacamento > 0:
            # para uma estimativa simples, assumimos que o comprimento é aproximadamente
            # a área dividida pelo número de linhas vezes o espaçamento
            comprimento_linha = (area * 10000) / (linhas * espacamento)
            culture_data["comprimento_linha"] = comprimento_linha

            # total de metros lineares de plantio
            culture_data["metros_lineares_total"] = linhas * comprimento_linha

    def get_weather_data(self, lat: float = -23.5505, lon: float = -46.6333) -> Optional[Dict[str, Any]]:
        """
        Obtém dados meteorológicos atuais

        Args:
            lat (float, optional): Latitude (padrão: São Paulo)
            lon (float, optional): Longitude (padrão: São Paulo)

        Returns:
            Optional[Dict[str, Any]]: Dados meteorológicos ou None se falhar
        """
        from services.r_integration import get_weather_data

        # se tiver os dados em cache e eles são recentes, retornar do cache
        if self.weather_data is not None:
            # TODO: Implementar verificação de idade do cache
            pass

        # obtém novos dados meteorológicos
        try:
            self.weather_data = get_weather_data(lat, lon)
            return self.weather_data
        except Exception as e:
            logger.error(f"Erro ao obter dados meteorológicos: {str(e)}")
            return None

    def get_recommendations(self, culture_data: Dict[str, Any], weather_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Obtém recomendações baseadas nos dados da cultura e meteorológicos

        Args:
            culture_data (Dict[str, Any]): Dados da cultura
            weather_data (Dict[str, Any]): Dados meteorológicos

        Returns:
            Optional[Dict[str, Any]]: Recomendações ou None se falhar
        """
        from services.r_integration import get_recommendations

        try:
            # extrai dados reais de meteorologia da estrutura aninhada
            actual_weather_data = None

            # verifica se têm dados meteorológicos com a estrutura esperada
            if weather_data and "data" in weather_data and "weather" in weather_data["data"]:
                if isinstance(weather_data["data"]["weather"], list) and len(weather_data["data"]["weather"]) > 0:
                    # obter o primeiro objeto de dados meteorológicos da lista
                    actual_weather_data = weather_data["data"]["weather"][0]

                    # adiciona as informações de análise aos dados meteorológicos
                    if "analysis" in weather_data["data"]:
                        # adiciona análises específicas sobre temperatura, umidade e vento
                        if "temperature" in weather_data["data"]["analysis"]:
                            actual_weather_data["temperature_analysis"] = weather_data["data"]["analysis"]["temperature"]
                        if "humidity" in weather_data["data"]["analysis"]:
                            actual_weather_data["humidity_analysis"] = weather_data["data"]["analysis"]["humidity"]
                        if "wind" in weather_data["data"]["analysis"]:
                            actual_weather_data["wind_analysis"] = weather_data["data"]["analysis"]["wind"]
                        # adiciona impacto agrícola se disponível
                        if "agricultural_impact" in weather_data["data"]["analysis"]:
                            actual_weather_data["agricultural_impact"] = weather_data["data"]["analysis"]["agricultural_impact"]
                elif isinstance(weather_data["data"]["weather"], dict):
                    # se for um dicionário único, usar diretamente
                    actual_weather_data = weather_data["data"]["weather"]

            # se não conseguir extrair os dados meteorológicos, retorna recomendações básicas
            if not actual_weather_data:
                logger.warning("Não foi possível extrair dados meteorológicos para recomendações")
                return {
                    "status": "warning",
                    "message": "Dados meteorológicos incompletos para recomendações detalhadas",
                    "data": {
                        "summary": {
                            "message": "Recomendações limitadas devido à falta de dados meteorológicos",
                            "can_apply_chemicals": None,
                            "needs_irrigation": culture_data.get("irrigacao", False),
                            "ideal_for_fieldwork": None
                        },
                        "basic": {
                            "irrigation": "Verificar condições locais antes de decidir sobre irrigação.",
                            "chemicals_application": "Verificar previsão do tempo antes de aplicar defensivos.",
                            "fieldwork": "Planejar atividades de campo com base na previsão meteorológica local."
                        }
                    }
                }

            # passa os dados meteorológicos extraídos para o serviço de recomendações
            logger.debug(f"Enviando dados meteorológicos para recomendações: {json.dumps(actual_weather_data, indent=2)}")
            return get_recommendations(culture_data, actual_weather_data)
        except Exception as e:
            logger.error(f"Erro ao obter recomendações: {str(e)}")
            logger.debug(f"Detalhes do erro: {traceback.format_exc()}")
            return None

