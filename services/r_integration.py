#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import logging
import subprocess
import os
import tempfile
import traceback
import re
from typing import Dict, Any, Optional, List, Union

logger = logging.getLogger(__name__)

def send_to_r_for_analysis(data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Envia dados para análise estatística em R

    Args:
        data (Dict[str, Any]): Dados da cultura a serem analisados

    Returns:
        Optional[Dict[str, Any]]: Resultados da análise R ou None se falhar
    """
    try:
        # dump dos dados de entrada para depuração
        logger.debug(f"Dados enviados para análise R: {json.dumps(data, indent=2)}")

        # cria arquivo temporário para os dados JSON
        with tempfile.NamedTemporaryFile(mode='w+', suffix='.json', delete=False) as tmp:
            json.dump(data, tmp)
            tmp_filename = tmp.name

        logger.debug(f"Arquivo temporário criado: {tmp_filename}")

        # verifica conteúdo do arquivo temporário
        with open(tmp_filename, 'r') as f:
            logger.debug(f"Conteúdo do arquivo temporário: {f.read()}")

        # diretório para o script R (assumindo que está no diretório r/)
        r_script_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'r', 'api.R')

        # verifica se o script existe
        if not os.path.isfile(r_script_path):
            logger.error(f"Script R não encontrado em: {r_script_path}")
            return None

        logger.debug(f"Script R encontrado em: {r_script_path}")

        # verifica permissões do script
        r_script_perms = os.stat(r_script_path).st_mode
        logger.debug(f"Permissões do script R: {oct(r_script_perms)}")

        # executa o script R passando o arquivo JSON como argumento
        cmd = ['Rscript', r_script_path, tmp_filename]
        logger.info(f"Executando comando: {' '.join(cmd)}")

        # executa o processo R e obtém a saída (usando shell=False para segurança)
        result = subprocess.run(
            cmd, 
            capture_output=True, 
            text=True, 
            check=False  # não lança exceção para capturar stderr
        )

        # log da saída completa
        logger.debug(f"Código de saída do R: {result.returncode}")

        if result.stdout:
            logger.debug(f"STDOUT do R: {result.stdout}")

        if result.stderr:
            logger.error(f"STDERR do R: {result.stderr}")

        # remove arquivo temporário
        os.unlink(tmp_filename)

        # verifica se o processo R foi executado com sucesso
        if result.returncode != 0:
            logger.error(f"Script R retornou código de erro: {result.returncode}")

            # monta mensagem de erro detalhada
            error_details = f"Código de saída: {result.returncode}"
            if result.stderr:
                error_details += f"\nErro: {result.stderr}"

            logger.error(f"Detalhes do erro R: {error_details}")
            return None

        # verifica se o R retornou dados válidos
        if result.stdout:
            try:
                # tenta carregar a saída como JSON
                return json.loads(result.stdout)
            except json.JSONDecodeError as e:
                logger.error(f"Erro ao decodificar saída JSON do R: {str(e)}")
                logger.debug(f"Saída do R: {result.stdout}")
                return None
        else:
            logger.warning("R não retornou dados na saída padrão")
            return None

    except subprocess.CalledProcessError as e:
        logger.error(f"Erro ao executar script R: {str(e)}")
        logger.debug(f"Saída do R: {e.stdout}")
        logger.debug(f"Erro do R: {e.stderr}")
        return None

    except Exception as e:
        logger.error(f"Erro ao enviar dados para análise R: {str(e)}")
        logger.debug(f"Detalhes do erro: {traceback.format_exc()}")
        return None

def get_weather_data(lat: float, lon: float) -> Optional[Dict[str, Any]]:
    """
    Obtém dados meteorológicos da API através do script R

    Args:
        lat (float): Latitude
        lon (float): Longitude

    Returns:
        Optional[Dict[str, Any]]: Dados meteorológicos ou None se falhar
    """
    try:
        # cria arquivo temporário para os parâmetros
        with tempfile.NamedTemporaryFile(mode='w+', suffix='.json', delete=False) as tmp:
            params = {"latitude": lat, "longitude": lon}
            json.dump(params, tmp)
            tmp_filename = tmp.name

        # diretório para o script R de meteorologia
        r_script_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 
                                   'r', 'modules', 'weather_analysis.R')

        # verifica se o script existe
        if not os.path.isfile(r_script_path):
            logger.warning(f"Script R de meteorologia não encontrado em: {r_script_path}")
            return None

        # executa o script R
        cmd = ['Rscript', r_script_path, tmp_filename]
        result = subprocess.run(
            cmd, 
            capture_output=True, 
            text=True, 
            check=True
        )

        # remove arquivo temporário
        os.unlink(tmp_filename)

        # processa o resultado
        if result.stdout:
            try:
                return json.loads(result.stdout)
            except json.JSONDecodeError as e:
                logger.error(f"Erro ao decodificar saída JSON do R (weather): {str(e)}")
                return None
        else:
            logger.warning("Script R de meteorologia não retornou dados")
            return None

    except Exception as e:
        logger.error(f"Erro ao obter dados meteorológicos do R: {str(e)}")
        return None

def get_recommendations(culture_data: Dict[str, Any], weather_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Obtém recomendações baseadas nos dados da cultura e condições meteorológicas

    Args:
        culture_data (Dict[str, Any]): Dados da cultura
        weather_data (Dict[str, Any]): Dados meteorológicos

    Returns:
        Optional[Dict[str, Any]]: Recomendações ou None se falhar
    """
    try:
        # verifica se os dados meteorológicos estão no formato esperado pelo R
        # o script R espera um formato plano com propriedades como temperature, humidity, etc.
        logger.debug(f"Dados meteorológicos recebidos: {json.dumps(weather_data, indent=2)}")

        # garante que os dados meteorológicos estejam no formato correto
        processed_weather_data = weather_data

        # verifica se ainda é uma estrutura aninhada
        if isinstance(weather_data, dict) and "data" in weather_data and "weather" in weather_data["data"]:
            if isinstance(weather_data["data"]["weather"], list) and len(weather_data["data"]["weather"]) > 0:
                processed_weather_data = weather_data["data"]["weather"][0]
            elif isinstance(weather_data["data"]["weather"], dict):
                processed_weather_data = weather_data["data"]["weather"]

        # cria arquivo temporário para os dados combinados
        with tempfile.NamedTemporaryFile(mode='w+', suffix='.json', delete=False) as tmp:
            combined_data = {
                "culture": culture_data,
                "weather": processed_weather_data
            }
            json.dump(combined_data, tmp)
            tmp_filename = tmp.name

            # verifica conteúdo do arquivo temporário para depuração
            tmp.seek(0)
            logger.debug(f"Conteúdo do arquivo temporário para recomendações: {tmp.read()}")

        # diretório para o script R de recomendações
        r_script_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 
                                   'r', 'modules', 'recommendations.R')

        # verifica se o script existe
        if not os.path.isfile(r_script_path):
            logger.warning(f"Script R de recomendações não encontrado em: {r_script_path}")
            return None

        # executa o script R
        cmd = ['Rscript', r_script_path, tmp_filename]
        logger.info(f"Executando comando de recomendações: {' '.join(cmd)}")

        result = subprocess.run(
            cmd, 
            capture_output=True, 
            text=True, 
            check=False  # não lança exceção para capturar stderr
        )

        # log detalhado da saída do R
        logger.debug(f"Código de saída do R (recomendações): {result.returncode}")

        if result.stderr:
            logger.debug(f"STDERR do R (recomendações): {result.stderr}")

        if result.stdout:
            logger.debug(f"STDOUT do R (recomendações): {result.stdout}")

        # remove arquivo temporário
        os.unlink(tmp_filename)

        # verifica se o processo R foi executado com sucesso
        if result.returncode != 0:
            logger.error(f"Script R de recomendações retornou código de erro: {result.returncode}")
            return {
                "status": "error",
                "message": f"Erro ao processar recomendações (código {result.returncode})"
            }

        # processa o resultado
        if result.stdout:
            try:
                return json.loads(result.stdout)
            except json.JSONDecodeError as e:
                logger.error(f"Erro ao decodificar saída JSON do R (recommendations): {str(e)}")
                logger.debug(f"Saída do R: {result.stdout}")
                return {
                    "status": "error",
                    "message": "Erro ao processar dados de recomendações"
                }
        else:
            logger.warning("Script R de recomendações não retornou dados")
            return {
                "status": "error",
                "message": "Nenhum dado de recomendação retornado"
            }

    except Exception as e:
        logger.error(f"Erro ao obter recomendações do R: {str(e)}")
        logger.debug(f"Detalhes do erro: {traceback.format_exc()}")
        return {
            "status": "error",
            "message": f"Erro ao processar recomendações: {str(e)}"
        }

