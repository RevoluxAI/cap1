#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
R Integration Service

Este módulo fornece uma interface para comunicação com scripts R,
permitindo análises estatísticas avançadas de dados agrícolas.
"""

import json
import logging
import subprocess
import os
import tempfile
import time
from typing import Dict, Any, Optional, List
from datetime import datetime
from pathlib import Path

# configuração de logging
logger = logging.getLogger(__name__)

# constantes
R_SCRIPTS_DIR = Path(os.path.dirname(os.path.dirname(__file__))) / "r"
API_SCRIPT = R_SCRIPTS_DIR / "api.R"
WEATHER_SCRIPT = R_SCRIPTS_DIR / "modules" / "weather_analysis.R"
RECOMMENDATIONS_SCRIPT = R_SCRIPTS_DIR / "modules" / "recommendations.R"


class RExecutionError(Exception):
    """Exceção para erros na execução de scripts R."""
    pass


def _validate_data(data: Dict[str, Any]) -> bool:
    """
    Valida os dados antes de enviar para o R.
    
    Args:
        data: Dicionário com os dados a serem validados
        
    Returns:
        bool: True se os dados são válidos, False caso contrário
    """
    if not isinstance(data, dict):
        logger.error("Dados inválidos: não é um dicionário")
        return False
        
    # validação específica para dados de cultura
    if "tipo" not in data:
        logger.warning("Dados sem tipo de cultura especificado")
        
    if "area" in data and not isinstance(data["area"], (int, float)):
        logger.error("Área inválida: deve ser um número")
        return False
    
    return True


def _create_temp_file(data: Dict[str, Any]) -> str:
    """
    Cria um arquivo temporário com os dados em formato JSON.
    
    Args:
        data: Dicionário a ser convertido para JSON
        
    Returns:
        str: Caminho do arquivo temporário criado
        
    Raises:
        ValueError: Se os dados não puderem ser serializados para JSON
    """
    try:
        with tempfile.NamedTemporaryFile(mode='w+', suffix='.json', delete=False) as tmp:
            json.dump(data, tmp, ensure_ascii=False)
            return tmp.name
    except Exception as e:
        logger.error(f"Erro ao criar arquivo temporário: {str(e)}")
        raise ValueError(f"Falha ao serializar dados: {str(e)}")


def _execute_r_script(script_path: Path, input_file: str, timeout: int = 60) -> Dict[str, Any]:
    """
    Executa um script R e retorna os resultados.
    
    Args:
        script_path: Caminho para o script R
        input_file: Caminho para o arquivo de entrada JSON
        timeout: Tempo máximo de execução em segundos
        
    Returns:
        Dict[str, Any]: Resultado da execução do script R
        
    Raises:
        RExecutionError: Se houver erro na execução do script R
        FileNotFoundError: Se o script não for encontrado
    """
    if not script_path.exists():
        raise FileNotFoundError(f"Script R não encontrado: {script_path}")
    
    logger.debug(f"Executando script R: {script_path} {input_file}")
    
    try:
        result = subprocess.run(
            ['Rscript', str(script_path), input_file],
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False
        )
        
        # limpa o arquivo temporário
        try:
            os.unlink(input_file)
        except Exception as e:
            logger.warning(f"Falha ao remover arquivo temporário {input_file}: {str(e)}")
        
        # analisa saída
        if result.returncode != 0:
            error_msg = f"Erro ao executar script R (código {result.returncode}): {result.stderr}"
            logger.error(error_msg)
            raise RExecutionError(error_msg)
        
        if not result.stdout:
            logger.warning("Script R não retornou dados")
            return {"status": "warning", "message": "Nenhum resultado obtido do R"}
        
        try:
            return json.loads(result.stdout)
        except json.JSONDecodeError as e:
            error_msg = f"Erro ao decodificar JSON da saída do R: {str(e)}"
            logger.error(f"{error_msg}\nSaída: {result.stdout[:200]}...")
            raise RExecutionError(error_msg)
            
    except subprocess.TimeoutExpired:
        # limpa o arquivo temporário em caso de timeout
        try:
            os.unlink(input_file)
        except Exception:
            pass
        
        error_msg = f"Timeout ao executar script R ({timeout}s)"
        logger.error(error_msg)
        raise RExecutionError(error_msg)
    
    except Exception as e:
        # limpa o arquivo temporário em caso de erro
        try:
            os.unlink(input_file)
        except Exception:
            pass
        
        logger.error(f"Erro inesperado ao executar script R: {str(e)}")
        raise RExecutionError(f"Erro inesperado: {str(e)}")


def analyze_multiple_cultures(cultures_data: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Envia múltiplas culturas para análise estatística avançada em R.

    Args:
        cultures_data: Lista de dicionários contendo dados de múltiplas culturas

    Returns:
        Optional[Dict[str, Any]]: Resultados da análise estatística ou None se falhar
    """
    try:
        # valida dados
        if not isinstance(cultures_data, list) or len(cultures_data) == 0:
            logger.error("Dados inválidos para análise estatística: lista vazia ou tipo inválido")
            return None
        
        # estrutura os dados para envio ao R
        data_package = {
            "cultures": cultures_data,
            "metadata": {
                "analysis_type": "statistical",
                "count": len(cultures_data),
                "timestamp": datetime.now().isoformat()
            }
        }
        
        # verifica homogeneidade (todas as culturas do mesmo tipo)
        culture_types = set(culture.get("tipo") for culture in cultures_data)
        if len(culture_types) == 1:
            data_package["metadata"]["culture_type"] = list(culture_types)[0]
        else:
            data_package["metadata"]["culture_type"] = "mixed"
            data_package["metadata"]["types"] = list(culture_types)
        
        # cria arquivo temporário
        tmp_filename = _create_temp_file(data_package)
        logger.debug(f"Arquivo temporário criado: {tmp_filename}")
        
        # encontra o script R correto para análise estatística
        script_path = Path(os.path.dirname(os.path.dirname(__file__))) / "r" / "modules" / "statistical.R"
        
        if not script_path.exists():
            # fallback para o script API principal
            script_path = API_SCRIPT
            logger.warning(f"Script estatístico específico não encontrado, usando API principal: {script_path}")
        
        # executa script R com timeout estendido para processamento de múltiplas culturas
        logger.info(f"Enviando {len(cultures_data)} culturas para análise estatística em R")
        result = _execute_r_script(script_path, tmp_filename, timeout=120)
        
        # verifica se o resultado inclui análises estatísticas
        if result and "status" in result and result["status"] == "success":
            logger.info("Análise estatística em R completada com sucesso")
            return result
        else:
            logger.warning("Resultado da análise estatística em R não contém dados esperados")
            return result  # retorna mesmo com warning para permitir depuração
            
    except ValueError as e:
        logger.error(f"Erro de formato nos dados para análise estatística: {str(e)}")
        return None
    except FileNotFoundError as e:
        logger.error(f"Script R não encontrado: {str(e)}")
        return None
    except RExecutionError as e:
        # erro já foi logado em _execute_r_script
        return None
    except Exception as e:
        logger.error(f"Erro inesperado na análise estatística: {str(e)}")
        return None


def _execute_r_script(script_path: Path, input_file: str, timeout: int = 60) -> Dict[str, Any]:
    """
    Executa um script R e retorna os resultados.
    
    Args:
        script_path: Caminho para o script R
        input_file: Caminho para o arquivo de entrada JSON
        timeout: Tempo máximo de execução em segundos
        
    Returns:
        Dict[str, Any]: Resultado da execução do script R
        
    Raises:
        RExecutionError: Se houver erro na execução do script R
        FileNotFoundError: Se o script não for encontrado
    """
    if not script_path.exists():
        raise FileNotFoundError(f"Script R não encontrado: {script_path}")
    
    logger.debug(f"Executando script R: {script_path} {input_file}")
    
    try:
        # verifica tamanho do arquivo para log
        file_size = os.path.getsize(input_file) / 1024  # KB
        if file_size > 1024:
            logger.info(f"Arquivo de entrada grande: {file_size:.2f} KB, timeout ajustado para {timeout}s")
        
        result = subprocess.run(
            ['Rscript', str(script_path), input_file],
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False
        )
        
        # limpa o arquivo temporário
        try:
            os.unlink(input_file)
        except Exception as e:
            logger.warning(f"Falha ao remover arquivo temporário {input_file}: {str(e)}")
        
        # analisa saída
        if result.returncode != 0:
            error_msg = f"Erro ao executar script R (código {result.returncode}): {result.stderr}"
            logger.error(error_msg)
            
            # para fins de diagnóstico, captura parte da saída
            if result.stdout:
                stdout_sample = result.stdout[:500] + "..." if len(result.stdout) > 500 else result.stdout
                logger.debug(f"Amostra da saída do R: {stdout_sample}")
            
            raise RExecutionError(error_msg)
        
        if not result.stdout:
            logger.warning("Script R não retornou dados")
            return {"status": "warning", "message": "Nenhum resultado obtido do R"}
        
        try:
            # tenta decorar o JSON para depuração
            stdout_length = len(result.stdout)
            if stdout_length > 1024 * 1024:  # Mais de 1MB
                logger.info(f"Resposta grande do R: {stdout_length / (1024*1024):.2f} MB")
            
            return json.loads(result.stdout)
        except json.JSONDecodeError as e:
            error_msg = f"Erro ao decodificar JSON da saída do R: {str(e)}"
            logger.error(f"{error_msg}\nSaída: {result.stdout[:200]}...")
            
            # tenta salvar a saída para diagnóstico
            debug_file = None
            try:
                debug_file = f"r_output_debug_{int(time.time())}.txt"
                with open(debug_file, 'w') as f:
                    f.write(result.stdout)
                logger.info(f"Saída completa do R salva em {debug_file} para diagnóstico")
            except Exception as write_error:
                logger.warning(f"Não foi possível salvar arquivo de diagnóstico: {str(write_error)}")
            
            raise RExecutionError(error_msg)
            
    except subprocess.TimeoutExpired:
        # limpa o arquivo temporário em caso de timeout
        try:
            os.unlink(input_file)
        except Exception:
            pass
        
        error_msg = f"Timeout ao executar script R ({timeout}s)"
        logger.error(error_msg)
        raise RExecutionError(error_msg)
    
    except Exception as e:
        # limpa o arquivo temporário em caso de erro
        try:
            os.unlink(input_file)
        except Exception:
            pass
        
        logger.error(f"Erro inesperado ao executar script R: {str(e)}")
        raise RExecutionError(f"Erro inesperado: {str(e)}")

def send_to_r_for_analysis(data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Envia dados para análise estatística em R.

    Args:
        data: Dados da cultura a serem analisados

    Returns:
        Optional[Dict[str, Any]]: Resultados da análise R ou None se falhar
    """
    try:
        # valida dados
        if not _validate_data(data):
            logger.error("Validação de dados falhou")
            return None
        
        # cria arquivo temporário
        tmp_filename = _create_temp_file(data)
        logger.debug(f"Arquivo temporário criado: {tmp_filename}")
        
        # executa script R
        return _execute_r_script(API_SCRIPT, tmp_filename)
        
    except ValueError as e:
        logger.error(f"Dados inválidos: {str(e)}")
        return None
    except FileNotFoundError as e:
        logger.error(str(e))
        return None
    except RExecutionError:
        # erro já foi logado pela função _execute_r_script
        return None
    except Exception as e:
        logger.error(f"Erro inesperado: {str(e)}")
        return None


def get_weather_data(lat: float, lon: float) -> Optional[Dict[str, Any]]:
    """
    Obtém dados meteorológicos através do script R.

    Args:
        lat: Latitude
        lon: Longitude

    Returns:
        Optional[Dict[str, Any]]: Dados meteorológicos ou None se falhar
    """
    try:
        # valida coordenadas
        if not isinstance(lat, (int, float)) or not isinstance(lon, (int, float)):
            logger.error(f"Coordenadas inválidas: lat={lat}, lon={lon}")
            return None
        
        # prepara dados
        params = {"latitude": lat, "longitude": lon}
        
        # cria arquivo temporário
        tmp_filename = _create_temp_file(params)
        
        # executa script R
        return _execute_r_script(WEATHER_SCRIPT, tmp_filename)
        
    except ValueError as e:
        logger.error(f"Dados inválidos para análise meteorológica: {str(e)}")
        return None
    except FileNotFoundError as e:
        logger.error(str(e))
        return None
    except RExecutionError:
        # erro já foi logado pela função _execute_r_script
        return None
    except Exception as e:
        logger.error(f"Erro inesperado ao obter dados meteorológicos: {str(e)}")
        return None


def get_recommendations(culture_data: Dict[str, Any], weather_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Obtém recomendações baseadas nos dados da cultura e meteorológicos.

    Args:
        culture_data: Dados da cultura
        weather_data: Dados meteorológicos

    Returns:
        Optional[Dict[str, Any]]: Recomendações ou None se falhar
    """
    try:
        # valida dados
        if not _validate_data(culture_data) or not isinstance(weather_data, dict):
            logger.error("Validação de dados falhou para recomendações")
            return None
        
        # prepara dados combinados
        combined_data = {
            "culture": culture_data,
            "weather": weather_data
        }
        
        # cria arquivo temporário
        tmp_filename = _create_temp_file(combined_data)
        
        # executa script R
        return _execute_r_script(RECOMMENDATIONS_SCRIPT, tmp_filename)
        
    except ValueError as e:
        logger.error(f"Dados inválidos para recomendações: {str(e)}")
        return None
    except FileNotFoundError as e:
        logger.error(str(e))
        return None
    except RExecutionError:
        # erro já foi logado pela função _execute_r_script
        return None
    except Exception as e:
        logger.error(f"Erro inesperado ao obter recomendações: {str(e)}")
        return None

