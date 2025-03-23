#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import logging
import re
from typing import Dict, Any, List, Optional, Union

logger = logging.getLogger(__name__)

class MenuController:
    """
    Controlador do menu para a aplicação.
    Implementa o padrão Mediator para coordenar interações entre componentes.
    Suporta tanto interface CLI quanto integração com formulários web.
    """

    def __init__(self, culture_controller):
        """Inicializa o controlador do menu"""
        self.culture_controller = culture_controller
        self.is_running = False
        self.data = []  # Vetor de dados para armazenamento

    def run(self, mode="cli") -> Dict[str, Any]:
        """
        Executa o menu interativo (modo CLI) ou retorna resultado (modo API)

        Args:
            mode (str): Modo de execução ('cli' ou 'api')

        Returns:
            Dict[str, Any]: Dados resultantes das operações
        """
        if mode == "cli":
            return self._run_cli_mode()
        else:
            # em modo API, apenas retorna o estado atual
            return {
                "status": "success",
                "data": self.data,
                "message": "Dados disponíveis para processamento"
            }

    def _run_cli_mode(self) -> Dict[str, Any]:
        """
        Executa o menu interativo no modo CLI

        Returns:
            Dict[str, Any]: Dados resultantes das operações
        """
        self.is_running = True
        result = {
            "status": "success",
            "data": None,
            "message": "Operação concluída com sucesso"
        }

        while self.is_running:
            self._display_menu()
            choice = input("Escolha uma opção: ")

            try:
                choice = int(choice)
                result = self._process_menu_choice(choice)

                # se o usuário escolheu sair, encerra o loop
                if choice == 5:
                    break

                # se a última operação foi bem sucedida e gerou dados, atualiza o resultado final
                if (
                    result.get("status") == "success" 
                    and result.get("data") is not None 
                ):
                    if isinstance(result["data"], list):
                        self.data = result["data"]

                # exibe o resultado da operação
                print("\nResultado da operação:")
                print(f"Status: {result['status']}")
                print(f"Mensagem: {result['message']}")
                if result.get("data") is not None:
                    print(f"Dados: {result['data']}")

                input("\nPressione Enter para continuar...")

            except ValueError:
                print("Opção inválida. Por favor, insira um número.")
                input("\nPressione Enter para continuar...")

            except Exception as e:
                logger.error(f"Erro ao processar opção do menu: {str(e)}")
                print(f"Erro ao processar opção: {str(e)}")
                input("\nPressione Enter para continuar...")

        # retorna os dados coletados durante a execução
        return {
            "status": "success",
            "data": self.data,
            "message": "Operação finalizada pelo usuário"
        }

    def _display_menu(self) -> None:
        """Exibe o menu principal (apenas para modo CLI)"""
        print("\n" + "="*50)
        print("  FARMTECH SOLUTIONS - SISTEMA DE GESTÃO AGRÍCOLA")
        print("="*50)
        print("1. Entrada de dados")
        print("2. Visualização de dados")
        print("3. Atualização de dados")
        print("4. Deleção de dados")
        print("5. Sair do programa")
        print("="*50)

    def _process_menu_choice(self, choice: int) -> Dict[str, Any]:
        """
        Processa a escolha do usuário no menu principal (CLI)

        Args:
            choice (int): Número da opção escolhida

        Returns:
            Dict[str, Any]: Resultado da operação
        """
        result = {
            "status": "error",
            "data": None,
            "message": "Opção não implementada"
        }

        if choice == 1:
            # entrada de dados
            result = self._handle_data_input()
        elif choice == 2:
            # visualização de dados
            result = self._handle_data_output()
        elif choice == 3:
            # atualização de dados
            result = self._handle_data_update()
        elif choice == 4:
            # deleção de dados
            result = self._handle_data_deletion()
        elif choice == 5:
            # sair do programa
            self.is_running = False
            result = {
                "status": "success",
                "data": self.data,
                "message": "Programa encerrado"
            }
        else:
            result["message"] = "Opção inválida. Por favor, escolha uma opção entre 1 e 5."

        return result

    # === API WEB ENDPOINTS ===
    def create_culture(self, form_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Endpoint de API para criar uma nova cultura

        Args:
            form_data (Dict[str, Any]): Dados do formulário web

        Returns:
            Dict[str, Any]: Resultado da operação
        """
        try:
            # extrai o tipo de cultura
            culture_type = int(form_data.get('culture_type', 0))
            if culture_type not in [1, 2]:
                return {
                    "status": "error", 
                    "data": None, 
                    "message": (
                        "Tipo de cultura inválido (deve ser 1 para ",
                        "Soja ou 2 para Cana-de-Açúcar)"
                    ),
                }

            # extrai outros parâmetros
            area = float(form_data.get('area', 0))
            espacamento = float(form_data.get('espacamento', 0))
            
            # parâmetros adicionais específicos para cada cultura
            additional_params = {}
            if culture_type == 1:  # Soja
                additional_params["variedade"] = form_data.get('variedade', 'convencional')
            elif culture_type == 2:  # Cana-de-Açúcar
                additional_params["ciclo"] = form_data.get('ciclo', 'médio')

            # verifica irrigação - suporta tanto booleano quanto string
            irrigacao_value = form_data.get('irrigacao', 'false')
            if isinstance(irrigacao_value, bool):
                with_irrigation = irrigacao_value
            else:
                with_irrigation = str(irrigacao_value).lower() in [
                    'true', 'sim', 's', 'yes', 'y', '1', 'on'
                ]

            # cria cultura usando o controlador
            culture_data = self.culture_controller.create_culture(
                culture_type=culture_type,
                area=area,
                espacamento=espacamento,
                with_irrigation=with_irrigation,
                **additional_params
            )

            # verifica se há um ID sugerido pelo frontend
            suggested_id = form_data.get('suggested_id')
            if suggested_id:
                # verifica se o id sugerido está no formato esperado
                id_pattern = r'^(soja|cana)_(\d+)$'
                if re.match(id_pattern, suggested_id):
                    # adiciona o ID sugerido aos dados da cultura
                    culture_data['id'] = suggested_id
            
            # adiciona ao vetor de dados
            # verifica se há uma posição previamente deletada que pode reutilizar
            reused_position = None
            
            # se existe um ID sugerido, tenta reutilizar a posição exata
            if suggested_id and len(self.data) > 0:
                # extrai o número do ID sugerido
                match = re.match(r'^(soja|cana)_(\d+)$', suggested_id)
                if match:
                    type_prefix, id_num = match.groups()
                    id_num = int(id_num)
                    
                    # procura uma posição disponível com esse ID
                    for i, item in enumerate(self.data):
                        if item.get('deleted', False) and (
                            (item.get('id') == suggested_id) or
                            (i == id_num and item.get('tipo') == type_prefix)
                        ):
                            reused_position = i
                            break
            
            # se não encontrou posição específica para 
            # reutilizar, procura qualquer posição
            if reused_position is None:
                for i, item in enumerate(self.data):
                    if item.get('deleted', False):
                        reused_position = i
                        break
            
            # se encontrou uma posição para reutilizar,
            # substitui a cultura deletada
            if reused_position is not None:
                self.data[reused_position] = culture_data
                position = reused_position
            else:
                # caso contrário, adiciona ao final do array
                self.data.append(culture_data)
                position = len(self.data) - 1
            
            # mensagem de sucesso
            message = f"Cultura adicionada com sucesso. ID: {position}"
            
            # verifica se existem recomendações específicas para exibir na resposta
            if culture_type == 2 and "recomendacoes" in culture_data:
                recomendacoes = culture_data["recomendacoes"]
                
                # adiciona alertas para parâmetros fora do recomendado
                alerts = []
                
                if recomendacoes["espacamento"]["status"] != "adequado":
                    alerts.append(recomendacoes["espacamento"]["mensagem"])
                
                if recomendacoes["area"]["status"] != "adequada":
                    alerts.append(recomendacoes["area"]["mensagem"])
                
                if not with_irrigation:
                    alerts.append(
                        "Irrigação é recomendada para cultivo de cana-de-açúcar."
                    )
                
                if alerts:
                    message += "\n\nRecomendações importantes:\n" + "\n".join(
                        f"- {alert}" for alert in alerts
                    )

            return {
                "status": "success", 
                "data": self.data, 
                "message": message,
                "recommendations": culture_data.get("recomendacoes")
            }

        except ValueError as e:
            return {
                "status": "error", 
                "data": None, 
                "message": f"Erro de formato: {str(e)}"
            }
        except Exception as e:
            logger.error(f"Erro ao processar dados de formulário: {str(e)}")
            return {
                "status": "error", 
                "data": None, 
                "message": f"Erro ao processar: {str(e)}"
            }


    def get_cultures(self) -> Dict[str, Any]:
        """
        Endpoint de API para obter todas as culturas

        Returns:
            Dict[str, Any]: Dados de todas as culturas
        """
        if not self.data:
            return {
                "status": "warning",
                "data": [],
                "message": "Nenhuma cultura cadastrada"
            }

        # filtrar culturas não deletadas
        active_cultures = [
            culture for culture in self.data if not culture.get(
                "deleted", False
            )
        ]
        
        if not active_cultures:
            return {
                "status": "warning",
                "data": [],
                "message": "Nenhuma cultura cadastrada"
            }

        return {
            "status": "success",
            "data": active_cultures,
            "message": f"{len(active_cultures)} culturas encontradas"
        }


    def get_culture(self, culture_id: int) -> Dict[str, Any]:
        """
        Endpoint de API para obter uma cultura específica

        Args:
            culture_id (int): ID da cultura

        Returns:
            Dict[str, Any]: Dados da cultura especificada
        """
        try:
            culture_id = int(culture_id)
            if not (0 <= culture_id < len(self.data)):
                return {
                    "status": "error",
                    "data": None,
                    "message": "Cultura não encontrada"
                }
            
            # verificar se a cultura não está deletada
            if self.data[culture_id].get("deleted", False):
                return {
                    "status": "error",
                    "data": None,
                    "message": "Cultura não encontrada"
                }
                
            return {
                "status": "success",
                "data": self.data[culture_id],
                "message": "Cultura encontrada"
            }
        except (ValueError, TypeError):
            return {
                "status": "error",
                "data": None,
                "message": "ID de cultura inválido"
            }


    def get_all_cultures(self) -> Dict[str, Any]:
        """
        Endpoint de API para obter todas as culturas, incluindo as marcadas como deletadas
        
        Returns:
            Dict[str, Any]: Dados de todas as culturas, incluindo as deletadas
        """
        if not self.data:
            return {
                "status": "warning",
                "data": [],
                "message": "Nenhuma cultura cadastrada"
            }
        
        # adiciona flag 'deleted' explicitamente para itens que não a possuem
        all_cultures = []
        for culture in self.data:
            culture_copy = culture.copy() if isinstance(culture, dict) else culture
            
            # garante que a propriedade 'deleted' esteja sempre presente
            if 'deleted' not in culture_copy:
                culture_copy['deleted'] = False
                
            all_cultures.append(culture_copy)
        
        return {
            "status": "success", 
            "data": all_cultures, 
            "message": (
                f"{len(all_cultures)} culturas encontradas ",
                "(incluindo deletadas)"
            ),
        }

    def update_culture(self, culture_id: int, form_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Endpoint de API para atualizar uma cultura existente

        Args:
            culture_id (int): ID da cultura a ser atualizada
            form_data (Dict[str, Any]): Dados do formulário web

        Returns:
            Dict[str, Any]: Resultado da operação
        """
        try:
            culture_id = int(culture_id)
            if not (0 <= culture_id < len(self.data)):
                return {
                    "status": "error",
                    "data": None,
                    "message": "Cultura não encontrada"
                }
                
            # verifica se a cultura não está deletada
            if self.data[culture_id].get("deleted", False):
                return {
                    "status": "error",
                    "data": None,
                    "message": "Cultura não encontrada ou foi excluída"
                }

            # campos que podem ser atualizados
            updateable_fields = ['area', 'espacamento']

            # atualiza os campos permitidos
            updated = False
            for field in updateable_fields:
                if field in form_data:
                    value = float(form_data[field])
                    if value <= 0:
                        return {
                            "status": "error",
                            "data": None,
                            "message": (
                                f"Valor para {field} deve ser maior que zero"
                            ),
                        }

                    self.data[culture_id][field] = value
                    updated = True

            # atualiza campos específicos por tipo de cultura
            culture_type = self.data[culture_id].get('tipo')
            if culture_type == 'Soja' and 'variedade' in form_data:
                self.data[culture_id]['variedade'] = form_data['variedade']
                updated = True
                
                # revalida parâmetros de soja após atualização
                if (
                    updated 
                    and (
                        'area' in form_data 
                        or 'espacamento' in form_data 
                        or 'variedade' in form_data
                    )
                ):
                    area = self.data[culture_id].get('area', 0)
                    espacamento = self.data[culture_id].get('espacamento', 0)
                    variedade = self.data[culture_id].get('variedade', 'convencional')
                    with_irrigation = self.data[culture_id].get('irrigacao', False)
                    
                    # obtém novas recomendações
                    recomendacoes = self.culture_controller.validate_soybean_parameters(
                        area, espacamento, variedade, with_irrigation
                    )
                    self.data[culture_id]['recomendacoes'] = recomendacoes
                    
            elif culture_type == 'Cana-de-Açúcar' and 'ciclo' in form_data:
                self.data[culture_id]['ciclo'] = form_data['ciclo']
                updated = True

                # revalida parâmetros de cana-de-açúcar após atualização
                if (
                    updated 
                    and (
                        'area' in form_data 
                        or 'espacamento' in form_data 
                        or 'ciclo' in form_data
                    )
                ):
                    area = self.data[culture_id].get('area', 0)
                    espacamento = self.data[culture_id].get('espacamento', 0)
                    ciclo = self.data[culture_id].get('ciclo', 'médio')
                    with_irrigation = self.data[culture_id].get('irrigacao', False)
                    
                    # obtém novas recomendações
                    recomendacoes = self.culture_controller.validate_sugarcane_parameters(
                        area, espacamento, ciclo, with_irrigation
                    )
                    self.data[culture_id]['recomendacoes'] = recomendacoes

            # atualiza status de irrigação se presente
            if 'irrigacao' in form_data:
                irrigacao = str(form_data.get('irrigacao', 'false')).lower() in [
                    'true', 'sim', 's', 'yes', 'y', '1', 'on'
                ]
                self.data[culture_id]['irrigacao'] = irrigacao
                updated = True
                
                # revalida parâmetros se irrigação foi alterada
                if culture_type == 'Soja':
                    area = self.data[culture_id].get('area', 0)
                    espacamento = self.data[culture_id].get('espacamento', 0)
                    variedade = self.data[culture_id].get('variedade', 'convencional')
                    
                    # obtém novas recomendações
                    recomendacoes = self.culture_controller.validate_soybean_parameters(
                        area, espacamento, variedade, irrigacao
                    )
                    self.data[culture_id]['recomendacoes'] = recomendacoes
                    
                elif culture_type == 'Cana-de-Açúcar':
                    area = self.data[culture_id].get('area', 0)
                    espacamento = self.data[culture_id].get('espacamento', 0)
                    ciclo = self.data[culture_id].get('ciclo', 'médio')
                    
                    # obtém novas recomendações
                    recomendacoes = self.culture_controller.validate_sugarcane_parameters(
                        area, espacamento, ciclo, irrigacao
                    )
                    self.data[culture_id]['recomendacoes'] = recomendacoes

            # recalcula valores necessários se houve atualização
            if updated and ('area' in form_data or 'espacamento' in form_data):
                if "linhas_calculadas" in self.data[culture_id]:
                    linhas = self.culture_controller.calculate_lines(culture_id, self.data[culture_id])
                    self.data[culture_id]["linhas_calculadas"] = linhas
                
                # recalcula insumos
                self.culture_controller._calculate_inputs(self.data[culture_id])

            # prepara mensagem com recomendações
            message = "Cultura atualizada com sucesso"
            if updated and 'recomendacoes' in self.data[culture_id]:
                recomendacoes = self.data[culture_id]['recomendacoes']
                
                # adiciona alertas para parâmetros fora do recomendado
                alerts = []
                
                if recomendacoes["espacamento"]["status"] != "adequado":
                    alerts.append(recomendacoes["espacamento"]["mensagem"])
                
                if recomendacoes["area"]["status"] != "adequada":
                    alerts.append(recomendacoes["area"]["mensagem"])
                
                if not self.data[culture_id].get('irrigacao', False):
                    if culture_type == 'Soja':
                        alerts.append("Irrigação é recomendada para maximizar a produtividade da soja.")
                    else:
                        alerts.append("Irrigação é recomendada para cultivo de cana-de-açúcar.")
                
                if alerts:
                    message += "\n\nRecomendações importantes:\n" + "\n".join(f"- {alert}" for alert in alerts)

            if updated:
                return {
                    "status": "success", 
                    "data": self.data[culture_id], 
                    "message": message,
                    "recommendations": self.data[culture_id].get("recomendacoes")
                }
            else:
                return {
                    "status": "warning",
                    "data": self.data[culture_id],
                    "message": "Nenhum campo foi atualizado"
                }

        except ValueError as e:
            return {
                "status": "error",
                "data": None,
                "message": f"Erro de formato: {str(e)}"
            }
        except Exception as e:
            logger.error(f"Erro ao atualizar cultura: {str(e)}")
            return {
                "status": "error",
                "data": None,
                "message": f"Erro ao atualizar: {str(e)}"
            }


    def delete_culture(self, culture_id: int) -> Dict[str, Any]:
        """
        Endpoint de API para deletar uma cultura

        Args:
            culture_id (int): ID da cultura a ser deletada

        Returns:
            Dict[str, Any]: Resultado da operação
        """
        try:
            culture_id = int(culture_id)
            if not (0 <= culture_id < len(self.data)):
                return {
                    "status": "error",
                    "data": None,
                    "message": "Cultura não encontrada"
                }

            # armazena o item a ser removido
            item = self.data[culture_id]
            removed_item = item.copy() if isinstance(item, dict) else item
            
            # marca a cultura como deletada (em vez de remover do array)
            # isso evita que os índices das outras culturas mudem
            self.data[culture_id] = {
                "deleted": True,
                "id": culture_id,
                "tipo": removed_item.get("tipo", "Desconhecida")
            }

            # remove do cache de análise, se existir
            # esta informação será incluída na resposta para o frontend
            removed_info = {
                "removed": removed_item, 
                "remaining": sum(
                    1 
                    for item in self.data 
                    if not item.get("deleted", False)
                ),
                "removed_id": culture_id,
            }

            return {
                "status": "success", 
                "data": removed_info, 
                "message": (
                    f"Cultura {removed_item.get('tipo', '#' + str(culture_id))}",
                    " removida com sucesso"
                ),
            }

        except (ValueError, TypeError):
            return {
                "status": "error",
                "data": None,
                "message": "ID de cultura inválido"
            }
        except Exception as e:
            logger.error(f"Erro ao deletar cultura: {str(e)}")
            return {
                "status": "error",
                "data": None,
                "message": f"Erro ao deletar: {str(e)}"
            }


    def calculate_culture_lines(self, culture_id: int) -> Dict[str, Any]:
        """
        Endpoint de API para calcular linhas de uma cultura

        Args:
            culture_id (int): ID da cultura

        Returns:
            Dict[str, Any]: Resultado do cálculo
        """
        try:
            culture_id = int(culture_id)
            if not (0 <= culture_id < len(self.data)):
                return {
                    "status": "error",
                    "data": None,
                    "message": "Cultura não encontrada"
                }

            # verifica se a cultura não está deletada
            if self.data[culture_id].get("deleted", False):
                return {
                    "status": "error",
                    "data": None,
                    "message": "Cultura não encontrada ou foi excluída"
                }

            # calcula linhas
            linhas = self.culture_controller.calculate_lines(culture_id, self.data[culture_id])
            self.data[culture_id]["linhas_calculadas"] = linhas

            return {
                "status": "success", 
                "data": {
                    "cultura_id": culture_id,
                    "tipo": self.data[culture_id].get("tipo", "Desconhecida"),
                    "area": self.data[culture_id].get("area", 0),
                    "espacamento": self.data[culture_id].get("espacamento", 0),
                    "linhas_calculadas": linhas
                }, 
                "message": f"Cálculo realizado com sucesso. {linhas} linhas de plantio."
            }

        except (ValueError, TypeError):
            return {"status": "error", "data": None, "message": "ID de cultura inválido"}
        except Exception as e:
            logger.error(f"Erro ao calcular linhas: {str(e)}")
            return {
                "status": "error",
                "data": None,
                "message": f"Erro ao calcular: {str(e)}"
            }


    def get_weather_analysis(self, culture_id: int) -> Dict[str, Any]:
        """
        Endpoint de API para obter análise meteorológica para uma cultura

        Args:
            culture_id (int): ID da cultura

        Returns:
            Dict[str, Any]: Resultado da análise meteorológica
        """
        try:
            culture_id = int(culture_id)
            if not (0 <= culture_id < len(self.data)):
                return {
                    "status": "error",
                    "data": None,
                    "message": "Cultura não encontrada"
                }

            # verifica se a cultura não está deletada
            if self.data[culture_id].get("deleted", False):
                return {
                    "status": "error",
                    "data": None,
                    "message": "Cultura não encontrada ou foi excluída"
                }

            # obtém análise meteorológica através do controlador de cultura
            weather_data = self.culture_controller.get_weather_data()
            if not weather_data:
                return {
                    "status": "error",
                    "data": None,
                    "message": "Não foi possível obter dados meteorológicos"
                }

            # obtém recomendações baseadas nos dados meteorológicos e da cultura
            recommendations = self.culture_controller.get_recommendations(
                self.data[culture_id], weather_data
            )

            # extrai dados meteorológicos atuais e análise
            current_weather = self._extract_current_weather(weather_data)
            weather_analysis = self._extract_weather_analysis(weather_data)
            
            # extrai dados específicos para soja se disponíveis
            soy_specific = self._extract_soy_specific_data(
                recommendations, self.data[culture_id]
            )

            # adiciona recomendações específicas para cana-de-açúcar
            sugarcane_recommendations = None
            if (
                self.data[culture_id].get("tipo") == "Cana-de-Açúcar" 
                and "recomendacoes" in self.data[culture_id]
            ):
                sugarcane_recommendations = self.data[culture_id]["recomendacoes"]

            # combina os dados para retorno
            result_data = {
                "cultura_id": culture_id,
                "cultura_info": {
                    "tipo": self.data[culture_id].get("tipo", "Desconhecida"),
                    "area": self.data[culture_id].get("area", 0),
                    "espacamento": self.data[culture_id].get("espacamento", 0),
                    "irrigacao": self.data[culture_id].get("irrigacao", False),
                    "linhas_calculadas": self.data[culture_id].get("linhas_calculadas", 0),
                    "variedade": self.data[culture_id].get("variedade", ""),
                    "ciclo": self.data[culture_id].get("ciclo", ""),
                    "quantidade_herbicida": self.data[culture_id].get("quantidade_herbicida", 0),
                    "quantidade_fertilizante": self.data[culture_id].get("quantidade_fertilizante", 0)
                },
                "weather_data": weather_data,
                "recommendations": recommendations,
                "current_weather": current_weather,
                "weather_analysis": weather_analysis,
                # recomendações específicas para cada tipo de cultura
                "sugarcane_recommendations": sugarcane_recommendations,
                "soy_specific": soy_specific,
                # adiciona dados de produtividade e recomendações extras para o frontend
                "productivity": {
                    "estimate": self._extract_productivity_estimate(
                        self.data[culture_id], recommendations
                    ),
                    "optimal_period": self._extract_optimal_period(
                        self.data[culture_id],
                        recommendations
                    )
                },
                "stats": self._extract_statistics(self.data[culture_id], recommendations)
            }

            return {
                "status": "success", 
                "data": result_data, 
                "message": "Análise meteorológica e recomendações obtidas com sucesso"
            }

        except (ValueError, TypeError):
            return {
                "status": "error",
                "data": None,
                "message": "ID de cultura inválido"
            }
        except Exception as e:
            logger.error(f"Erro ao obter análise meteorológica: {str(e)}")
            return {
                "status": "error",
                "data": None,
                "message": f"Erro na análise: {str(e)}"
            }


    def _extract_current_weather(self, weather_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Extrai os dados meteorológicos atuais da estrutura de dados.
        
        Args:
            weather_data (Dict[str, Any]): Dados meteorológicos completos
            
        Returns:
            Optional[Dict[str, Any]]: Dados meteorológicos atuais extraídos ou None
        """
        if not weather_data:
            return None
            
        # verifica a estrutura aninhada completa
        if weather_data.get("data") and weather_data["data"].get("weather"):
            weather_array = weather_data["data"]["weather"]
            if isinstance(weather_array, list) and len(weather_array) > 0:
                return weather_array[0]  # Retorna o primeiro item do array
            elif isinstance(weather_array, dict):
                return weather_array  # Retorna o dicionário diretamente
                
        # verifica estrutura alternativa (dados no nível principal)
        if weather_data.get("weather"):
            weather_array = weather_data["weather"]
            if isinstance(weather_array, list) and len(weather_array) > 0:
                return weather_array[0]
            elif isinstance(weather_array, dict):
                return weather_array
                
        # verifica se os próprios dados possuem as propriedades esperadas
        if any(key in weather_data for key in ["temperature", "humidity", "wind_speed"]):
            return weather_data
            
        return None

    def _extract_weather_analysis(self, weather_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Extrai os dados de análise meteorológica da estrutura de dados.
        
        Args:
            weather_data (Dict[str, Any]): Dados meteorológicos completos
            
        Returns:
            Optional[Dict[str, Any]]: Dados de análise meteorológica ou None
        """
        if not weather_data:
            return None
            
        # verifica na estrutura aninhada
        if weather_data.get("data") and weather_data["data"].get("analysis"):
            return weather_data["data"]["analysis"]
            
        # verifica no nível principal
        if weather_data.get("analysis"):
            return weather_data["analysis"]
            
        # verifica estrutura alternativa
        if weather_data.get("weather_analysis"):
            return weather_data["weather_analysis"]
            
        # tenta construir análise a partir de campos individuais
        analysis = {}
        
        # extrai análise de temperatura, se disponível
        temperature_analysis = None
        if weather_data.get("temperature_analysis"):
            temperature_analysis = weather_data["temperature_analysis"]
        elif weather_data.get("data") and weather_data["data"].get("temperature_analysis"):
            temperature_analysis = weather_data["data"]["temperature_analysis"]
            
        if temperature_analysis:
            analysis["temperature"] = temperature_analysis
            
        # extrai análise de umidade, se disponível
        humidity_analysis = None
        if weather_data.get("humidity_analysis"):
            humidity_analysis = weather_data["humidity_analysis"]
        elif weather_data.get("data") and weather_data["data"].get("humidity_analysis"):
            humidity_analysis = weather_data["data"]["humidity_analysis"]
            
        if humidity_analysis:
            analysis["humidity"] = humidity_analysis
            
        # extrai análise de vento, se disponível
        wind_analysis = None
        if weather_data.get("wind_analysis"):
            wind_analysis = weather_data["wind_analysis"]
        elif weather_data.get("data") and weather_data["data"].get("wind_analysis"):
            wind_analysis = weather_data["data"]["wind_analysis"]
            
        if wind_analysis:
            analysis["wind"] = wind_analysis
            
        # extrai impacto agrícola, se disponível
        agricultural_impact = None
        if weather_data.get("agricultural_impact"):
            agricultural_impact = weather_data["agricultural_impact"]
        elif weather_data.get("data") and weather_data["data"].get("agricultural_impact"):
            agricultural_impact = weather_data["data"]["agricultural_impact"]
            
        if agricultural_impact:
            analysis["agricultural_impact"] = agricultural_impact
            
        # retorna análise construída se tiver algum dado
        if analysis:
            return analysis
            
        return None

    def _extract_soy_specific_data(self, recommendations: Optional[Dict[str, Any]], 
                                  culture_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Extrai dados específicos para a cultura de soja.
        
        Args:
            recommendations (Optional[Dict[str, Any]]): Dados de recomendações
            culture_data (Dict[str, Any]): Dados da cultura
            
        Returns:
            Optional[Dict[str, Any]]: Dados específicos para soja ou None
        """
        # verifica se não é uma cultura de soja
        if culture_data.get("tipo") != "Soja":
            return None
        
        # verifica nas recomendações diretas
        if recommendations and recommendations.get("soy_specific"):
            return recommendations["soy_specific"]
            
        # verifica nas recomendações aninhadas
        if (
            recommendations and recommendations.get("data") 
            and recommendations["data"].get("soy_specific")
        ):
            return recommendations["data"]["soy_specific"]
            
        # verifica na análise estatística da cultura
        if (
            culture_data.get("analise_estatistica") 
            and culture_data["analise_estatistica"].get("soy_specific")
        ):
            return culture_data["analise_estatistica"]["soy_specific"]
            
        # tenta construir um objeto mínimo de dados específicos de soja com base em outras informações
        if culture_data.get("variedade"):
            # cria dados básicos com as informações disponíveis
            return {
                "productivity_estimate": {
                    "sacas_por_hectare": culture_data.get("produtividade_sacas", 0),
                    "total_sacas": culture_data.get("producao_total", 0)
                },
                # período padrão
                "optimal_planting_period": "Setembro a Novembro",
                "variety": culture_data.get("variedade", "")
            }
            
        return None


    def _extract_productivity_estimate(self, culture_data: Dict[str, Any], recommendations: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extrai dados de produtividade estimada das recomendações ou dados da cultura

        Args:
            culture_data (Dict[str, Any]): Dados da cultura
            recommendations (Dict[str, Any]): Dados de recomendações

        Returns:
            Dict[str, Any]: Dados formatados de produtividade
        """
        result = {
            "value": 0,
            "unit": "sacas/ha",
            "total": 0
        }

        # verifica se é cana-de-açúcar para ajustar unidade
        if culture_data.get("tipo") == "Cana-de-Açúcar":
            result["unit"] = "toneladas/ha"

        # verifica na estrutura de recomendações
        if recommendations and "data" in recommendations:
            rec_data = recommendations["data"]

            # verifica se tem dados de análise estatística (statistical_models)
            if (
                "statistical_models" in rec_data 
                and "productivity_forecast" in rec_data["statistical_models"]
            ):
                forecast = rec_data["statistical_models"]["productivity_forecast"]
                
                # regex para extrair valores da produtividade para soja ou cana
                if culture_data.get("tipo") == "Soja":
                    match = re.search(
                        r"Produtividade estimada: (\d+\.?\d*) sacas/ha",
                        forecast
                    )
                else:
                    match = re.search(
                        r"Produtividade estimada: (\d+\.?\d*) ton/ha",
                        forecast
                    )
                
                if match:
                    result["value"] = float(match.group(1))
                    result["total"] = result["value"] * culture_data.get("area", 0)

            # verifica na análise de dados
            if (
                "data_analysis" in rec_data 
                and "key_metrics" in rec_data["data_analysis"]
            ):
                metrics = rec_data["data_analysis"]["key_metrics"]
                if "potential_production" in metrics:
                    prod_text = metrics["potential_production"]
                    
                    # regex para extrair valores com base no tipo de cultura
                    if culture_data.get("tipo") == "Soja":
                        match = re.search(
                            r"(\d+) sacas totais estimadas",
                            prod_text
                        )
                    else:
                        match = re.search(
                            r"(\d+) toneladas totais estimadas",
                            prod_text
                        )
                    
                    if match:
                        result["total"] = int(match.group(1))
                        if culture_data.get("area", 0) > 0:
                            result["value"] = result["total"] / culture_data["area"]

        # fallback para valores específicos da cultura
        if culture_data.get("analise_estatistica"):
            # verifica tipo de cultura para extrair dados corretos
            if culture_data.get("tipo") == "Soja":
                soy_specific = culture_data["analise_estatistica"].get("soy_specific", {})
                if "productivity_estimate" in soy_specific:
                    prod_est = soy_specific["productivity_estimate"]
                    result["value"] = prod_est.get("sacas_por_hectare", 0)
                    result["total"] = prod_est.get("total_sacas", 0)
            elif culture_data.get("tipo") == "Cana-de-Açúcar":
                sugarcane_specific = culture_data["analise_estatistica"].get("sugarcane_specific", {})
                if "productivity_estimate" in sugarcane_specific:
                    prod_est = sugarcane_specific["productivity_estimate"]
                    result["value"] = prod_est.get("toneladas_por_hectare", 0)
                    result["total"] = prod_est.get("total_toneladas", 0)

        return result

    def _extract_optimal_period(self, culture_data: Dict[str, Any], recommendations: Dict[str, Any]) -> str:
        """
        Extrai período ótimo de plantio/colheita
        """
        # verifica em recomendações
        if recommendations and "data" in recommendations:
            rec_data = recommendations["data"]
            
            # dados específicos da cultura nas recomendações
            culture_type = culture_data.get("tipo")
            if culture_type == "Soja":
                if (
                    "soy_specific" in rec_data 
                    and "optimal_planting_period" in rec_data["soy_specific"]
                ):
                    return rec_data["soy_specific"]["optimal_planting_period"]
            elif culture_type == "Cana-de-Açúcar":
                if (
                    "sugarcane_specific" in rec_data 
                    and "optimal_planting_period" in rec_data["sugarcane_specific"]
                ):
                    return rec_data["sugarcane_specific"]["optimal_planting_period"]

        # verifica em dados da cultura
        if culture_data.get("analise_estatistica"):
            culture_type = culture_data.get("tipo")
            if culture_type == "Soja":
                soy_specific = culture_data["analise_estatistica"].get("soy_specific", {})
                if "optimal_planting_period" in soy_specific:
                    return soy_specific["optimal_planting_period"]
            elif culture_type == "Cana-de-Açúcar":
                sugarcane_specific = culture_data["analise_estatistica"].get("sugarcane_specific", {})
                if "optimal_planting_period" in sugarcane_specific:
                    return sugarcane_specific["optimal_planting_period"]
                
                # se for cana-de-açúcar, verificar nas recomendações específicas
                if "recomendacoes" in culture_data:
                    ciclo = culture_data.get("ciclo", "médio")
                    if ciclo == "curto":
                        return "Fevereiro a Abril"
                    elif ciclo == "médio":
                        return "Janeiro a Março"
                    elif ciclo == "longo":
                        return "Outubro a Dezembro"

        # valores padrão por cultura
        if culture_data.get("tipo") == "Soja":
            return "Setembro a Novembro"
        elif culture_data.get("tipo") == "Cana-de-Açúcar":
            ciclo = culture_data.get("ciclo", "médio")
            if ciclo == "curto":
                return "Fevereiro a Abril"
            elif ciclo == "médio":
                return "Janeiro a Março"
            elif ciclo == "longo":
                return "Outubro a Dezembro"
            return "Janeiro a Março (padrão)"
        
        return "Não disponível"

    def _extract_statistics(self, culture_data: Dict[str, Any], recommendations: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extrai estatísticas da cultura
        """
        stats = {
            "area": culture_data.get("area", 0),
            "espacamento": culture_data.get("espacamento", 0),
            "linhas_calculadas": culture_data.get("linhas_calculadas", 0),
            "comprimento_linha": round(culture_data.get("comprimento_linha", 0), 2),
            "metros_lineares_total": round(culture_data.get("metros_lineares_total", 0), 2),
            "efficiency_metrics": {}
        }

        # adiciona dados específicos para cana-de-açúcar
        if culture_data.get("tipo") == "Cana-de-Açúcar" and "recomendacoes" in culture_data:
            stats["sugarcane_specific"] = {
                "ciclo": culture_data.get("ciclo", "médio"),
                "duracao": culture_data["recomendacoes"]["ciclo_info"]["duracao"],
                "descricao": culture_data["recomendacoes"]["ciclo_info"]["descricao"],
                "espacamento_recomendado": culture_data["recomendacoes"]["espacamento"]["recomendado"],
                "area_recomendada": culture_data["recomendacoes"]["area"]["recomendado"],
                "irrigacao_info": culture_data["recomendacoes"]["irrigacao"]
            }

        # verifica nas recomendações
        if recommendations and "data" in recommendations:
            rec_data = recommendations["data"]

            # métricas de eficiência
            if "data_analysis" in rec_data and "efficiency_metrics" in rec_data["data_analysis"]:
                stats["efficiency_metrics"] = rec_data["data_analysis"]["efficiency_metrics"]

            # métricas-chave
            if "data_analysis" in rec_data and "key_metrics" in rec_data["data_analysis"]:
                key_metrics = rec_data["data_analysis"]["key_metrics"]
                stats["insumos_totais"] = key_metrics.get("insumos_totais", {
                    "herbicida": f"{culture_data.get('quantidade_herbicida', 0)} L",
                    "fertilizante": f"{culture_data.get('quantidade_fertilizante', 0)} kg"
                })
                stats["metros_lineares"] = key_metrics.get("metros_lineares", culture_data.get("metros_lineares_total", 0))

        return stats


    # === MÉTODOS CLI ===
    def _handle_data_input(self) -> Dict[str, Any]:
        """
        Processa a entrada de dados pelo usuário (modo CLI)

        Returns:
            Dict[str, Any]: Resultado da operação
        """
        print("\n----- ENTRADA DE DADOS -----")
        print("Escolha o tipo de cultura:")
        print("1. Soja")
        print("2. Cana-de-Açúcar")

        try:
            culture_type = int(input("Digite o número da cultura: "))
            if culture_type not in [1, 2]:
                return {
                    "status": "error",
                    "data": None,
                    "message": "Tipo de cultura inválido"
                }

            area = float(input("Área de plantio (hectares): "))
            espacamento = float(input("Espaçamento entre linhas (metros): "))

            # parâmetros adicionais específicos para cada cultura
            additional_params = {}
            if culture_type == 1:  # Soja
                additional_params["variedade"] = input("Variedade da soja (ex: convencional, transgênica): ")
            elif culture_type == 2:  # Cana-de-Açúcar
                ciclo_options = {"1": "curto", "2": "médio", "3": "longo"}
                print("\nEscolha o ciclo da cana:")
                print("1. Curto (8-10 meses)")
                print("2. Médio (12-14 meses)")
                print("3. Longo (16-18 meses)")
                ciclo_choice = input("Digite o número correspondente ao ciclo: ")
                additional_params["ciclo"] = ciclo_options.get(ciclo_choice, "médio")

            # pergunta sobre irrigação
            with_irrigation = input("Adicionar sistema de irrigação? (s/n): ").lower() == 's'

            # cria cultura usando o controlador
            culture_data = self.culture_controller.create_culture(
                culture_type=culture_type,
                area=area,
                espacamento=espacamento,
                with_irrigation=with_irrigation,
                **additional_params
            )

            # adiciona ao vetor de dados
            self.data.append(culture_data)

            # exibe recomendações para cana-de-açúcar
            if culture_type == 2 and "recomendacoes" in culture_data:
                print("\n----- RECOMENDAÇÕES PARA CANA-DE-AÇÚCAR -----")
                recomendacoes = culture_data["recomendacoes"]
                
                print(f"Ciclo: {culture_data['ciclo']} ({recomendacoes['ciclo_info']['duracao']})")
                print(f"Descrição: {recomendacoes['ciclo_info']['descricao']}")
                
                print(f"\nEspaçamento: {recomendacoes['espacamento']['mensagem']}")
                esp_rec = recomendacoes['espacamento']['recomendado']
                print(f"  Recomendado: {esp_rec['min']}-{esp_rec['max']} m (ideal: {esp_rec['ideal']} m)")
                
                print(f"\nÁrea: {recomendacoes['area']['mensagem']}")
                area_rec = recomendacoes['area']['recomendado']
                min_area = area_rec['min']
                max_area = area_rec['max'] if area_rec['max'] else "sem limite máximo"
                print(f"  Recomendado: {min_area}-{max_area} ha (ideal: {area_rec['ideal']} ha)")
                
                irrig = recomendacoes['irrigacao']
                print(f"\nIrrigação: {'Ativada' if irrig['ativa'] else 'Não ativada'}")
                print(f"  {irrig['mensagem']}")
                print(f"  Sistema: {irrig['sistema']}")
                print(f"  Frequência: {irrig['frequencia']}")
                print(f"  Volume: {irrig['volume']}")
                print(f"  Eficiência: {irrig['eficiencia']}")

            return {
                "status": "success", 
                "data": self.data, 
                "message": (
                    "Cultura adicionada com sucesso. ",
                    f"ID: {len(self.data) - 1}"
                ),
            }

        except ValueError as e:
            return {
                "status": "error",
                "data": None,
                "message": f"Erro de formato: {str(e)}"
            }
        except Exception as e:
            logger.error(f"Erro ao processar entrada de dados: {str(e)}")
            return {
                "status": "error",
                "data": None,
                "message": f"Erro ao processar entrada: {str(e)}"
            }

    def _handle_data_output(self) -> Dict[str, Any]:
        """
        Processa a visualização de dados (modo CLI)

        Returns:
            Dict[str, Any]: Resultado da operação
        """
        if not self.data:
            return {
                "status": "warning",
                "data": [],
                "message": "Nenhum dado disponível para visualização"
            }

        print("\n----- VISUALIZAÇÃO DE DADOS -----")
        for i, item in enumerate(self.data):
            print(f"\nCultura #{i}:")
            for key, value in item.items():
                # não exibe dados muito aninhados como recomendações
                if key == "recomendacoes":
                    print(f"  {key}: [Dados detalhados disponíveis]")
                    continue
                print(f"  {key}: {value}")

        # pergunta se usuário deseja realizar cálculos adicionais
        if input("\nDeseja calcular linhas de plantio? (s/n): ").lower() == 's':
            try:
                idx = int(input("Digite o número da cultura para cálculo: "))
                if 0 <= idx < len(self.data):
                    linhas = self.culture_controller.calculate_lines(idx, self.data[idx])
                    self.data[idx]["linhas_calculadas"] = linhas
                    return {
                        "status": "success", 
                        "data": self.data, 
                        "message": (
                            "Cálculo realizado. Cultura ",
                            f"#{idx} possui {linhas} linhas de plantio."
                        ),
                    }
                else:
                    return {
                        "status": "error",
                        "data": self.data,
                        "message": "Índice inválido"
                    }
            except ValueError:
                return {
                    "status": "error",
                    "data": self.data,
                    "message": "Formato inválido para índice"
                }
            except Exception as e:
                return {
                    "status": "error",
                    "data": self.data,
                    "message": f"Erro no cálculo: {str(e)}"
                }

        # retorna os dados atuais
        return {
            "status": "success",
            "data": self.data,
            "message": "Dados visualizados com sucesso"
        }

    def _handle_data_update(self) -> Dict[str, Any]:
        """
        Processa a atualização de dados (modo CLI)

        Returns:
            Dict[str, Any]: Resultado da operação
        """
        if not self.data:
            return {
                "status": "warning",
                "data": [],
                "message": "Nenhum dado disponível para atualização"
            }

        print("\n----- ATUALIZAÇÃO DE DADOS -----")
        for i, item in enumerate(self.data):
            cultura_tipo = item.get("tipo", "Desconhecida")
            area = item.get("area", "N/A")
            print(f"{i}. {cultura_tipo} - Área: {area} ha")

        try:
            idx = int(input("\nDigite o número da cultura para atualizar: "))
            if 0 <= idx < len(self.data):
                print("\nO que deseja atualizar?")
                print("1. Área de plantio")
                print("2. Espaçamento entre linhas")
                
                # opções adicionais específicas para cada cultura
                if self.data[idx].get("tipo") == "Cana-de-Açúcar":
                    print("3. Ciclo da cana-de-açúcar")
                    print("4. Sistema de irrigação")

                update_choice = int(input("Escolha uma opção: "))

                if update_choice == 1:
                    new_value = float(input("Nova área (hectares): "))
                    self.data[idx]["area"] = new_value
                    # recalcula valores necessários
                    if "linhas_calculadas" in self.data[idx]:
                        linhas = self.culture_controller.calculate_lines(idx, self.data[idx])
                        self.data[idx]["linhas_calculadas"] = linhas
                    
                    # recalcula recomendações para cana-de-açúcar
                    if self.data[idx].get("tipo") == "Cana-de-Açúcar":
                        recomendacoes = self.culture_controller.validate_sugarcane_parameters(
                            new_value, 
                            self.data[idx].get("espacamento", 0),
                            self.data[idx].get("ciclo", "médio"),
                            self.data[idx].get("irrigacao", False)
                        )
                        self.data[idx]["recomendacoes"] = recomendacoes
                        
                        # mostra novas recomendações
                        print("\n----- NOVAS RECOMENDAÇÕES -----")
                        print(f"Área: {recomendacoes['area']['mensagem']}")

                    return {
                        "status": "success", 
                        "data": self.data, 
                        "message": (
                            f"Área da cultura #{idx} atualizada ",
                            f"para {new_value} ha"
                        ),
                    }

                elif update_choice == 2:
                    new_value = float(input("Novo espaçamento (metros): "))
                    self.data[idx]["espacamento"] = new_value
                    # recalcula valores necessários
                    if "linhas_calculadas" in self.data[idx]:
                        linhas = self.culture_controller.calculate_lines(idx, self.data[idx])
                        self.data[idx]["linhas_calculadas"] = linhas
                        
                    # recalcula recomendações para cana-de-açúcar
                    if self.data[idx].get("tipo") == "Cana-de-Açúcar":
                        recomendacoes = self.culture_controller.validate_sugarcane_parameters(
                            self.data[idx].get("area", 0),
                            new_value,
                            self.data[idx].get("ciclo", "médio"),
                            self.data[idx].get("irrigacao", False)
                        )
                        self.data[idx]["recomendacoes"] = recomendacoes
                        
                        # mostra novas recomendações
                        print("\n----- NOVAS RECOMENDAÇÕES -----")
                        print(f"Espaçamento: {recomendacoes['espacamento']['mensagem']}")

                    return {
                        "status": "success", 
                        "data": self.data, 
                        "message": (
                            f"Espaçamento da cultura #{idx} ",
                            f"atualizado para {new_value} m"
                        ),
                    }
                
                # opções específicas para cana-de-açúcar
                elif update_choice == 3 and self.data[idx].get("tipo") == "Cana-de-Açúcar":
                    print("\nEscolha o novo ciclo da cana:")
                    print("1. Curto (8-10 meses)")
                    print("2. Médio (12-14 meses)")
                    print("3. Longo (16-18 meses)")
                    
                    ciclo_options = {"1": "curto", "2": "médio", "3": "longo"}
                    ciclo_choice = input("Digite o número correspondente ao ciclo: ")
                    new_ciclo = ciclo_options.get(ciclo_choice, "médio")
                    
                    self.data[idx]["ciclo"] = new_ciclo
                    
                    # recalcula recomendações
                    recomendacoes = self.culture_controller.validate_sugarcane_parameters(
                        self.data[idx].get("area", 0),
                        self.data[idx].get("espacamento", 0),
                        new_ciclo,
                        self.data[idx].get("irrigacao", False)
                    )
                    self.data[idx]["recomendacoes"] = recomendacoes
                    
                    # mostra novas recomendações
                    print("\n----- NOVAS RECOMENDAÇÕES -----")
                    print(f"Ciclo: {new_ciclo} ({recomendacoes['ciclo_info']['duracao']})")
                    print(f"Descrição: {recomendacoes['ciclo_info']['descricao']}")
                    
                    return {
                        "status": "success", 
                        "data": self.data, 
                        "message": (
                            f"Ciclo da cultura #{idx} ",
                            f"atualizado para {new_ciclo}"
                        ),
                    }
                
                elif update_choice == 4 and self.data[idx].get("tipo") == "Cana-de-Açúcar":
                    current_irrigation = self.data[idx].get("irrigacao", False)
                    new_irrigation = not current_irrigation
                    
                    self.data[idx]["irrigacao"] = new_irrigation
                    
                    # recalcula recomendações
                    recomendacoes = self.culture_controller.validate_sugarcane_parameters(
                        self.data[idx].get("area", 0),
                        self.data[idx].get("espacamento", 0),
                        self.data[idx].get("ciclo", "médio"),
                        new_irrigation
                    )
                    self.data[idx]["recomendacoes"] = recomendacoes
                    
                    # mostra novas recomendações
                    print("\n----- NOVAS RECOMENDAÇÕES -----")
                    irrig = recomendacoes['irrigacao']
                    print(f"Irrigação: {'Ativada' if irrig['ativa'] else 'Não ativada'}")
                    print(f"  {irrig['mensagem']}")
                    
                    return {
                        "status": "success", 
                        "data": self.data, 
                        "message": (
                            f"Sistema de irrigação da cultura #{idx} ",
                            f"{'ativado' if new_irrigation else 'desativado'}"
                        ),
                    }
                else:
                    return {
                        "status": "error",
                        "data": self.data,
                        "message": "Opção de atualização inválida"
                    }
            else:
                return {
                    "status": "error",
                    "data": self.data,
                    "message": "Índice inválido"
                }

        except ValueError:
            return {
                "status": "error",
                "data": self.data,
                "message": "Formato inválido para entrada"
            }
        except Exception as e:
            logger.error(f"Erro ao atualizar dados: {str(e)}")
            return {
                "status": "error",
                "data": self.data,
                "message": f"Erro ao atualizar: {str(e)}"
            }

    def _handle_data_deletion(self) -> Dict[str, Any]:
        """
        Processa a deleção de dados (modo CLI)

        Returns:
            Dict[str, Any]: Resultado da operação
        """
        if not self.data:
            return {
                "status": "warning",
                "data": [],
                "message": "Nenhum dado disponível para deleção"
            }

        print("\n----- DELEÇÃO DE DADOS -----")
        for i, item in enumerate(self.data):
            cultura_tipo = item.get("tipo", "Desconhecida")
            area = item.get("area", "N/A")
            print(f"{i}. {cultura_tipo} - Área: {area} ha")

        try:
            idx = int(input("\nDigite o número da cultura para deletar (ou -1 para cancelar): "))

            if idx == -1:
                return {
                    "status": "info",
                    "data": self.data,
                    "message": "Operação de deleção cancelada"
                }

            if 0 <= idx < len(self.data):
                removed_item = self.data.pop(idx)
                return {
                    "status": "success", 
                    "data": self.data, 
                    "message": (
                        f"Cultura {removed_item.get('tipo', '#' + str(idx))} ",
                        "removida com sucesso"
                    ),
                }
            else:
                return {
                    "status": "error",
                    "data": self.data,
                    "message": "Índice inválido"
                }

        except ValueError:
            return {
                "status": "error",
                "data": self.data,
                "message": "Formato inválido para índice"
            }
        except Exception as e:
            logger.error(f"Erro ao deletar dados: {str(e)}")
            return {
                "status": "error",
                "data": self.data,
                "message": f"Erro ao deletar: {str(e)}"
            }

