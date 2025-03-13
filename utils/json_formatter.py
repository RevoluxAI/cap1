#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
from typing import Dict, Any, List, Union

def format_output(data: Dict[str, Any], output_format: str = 'json') -> str:
    """
    Formata os dados de saída para texto ou JSON

    Args:
        data (Dict[str, Any]): Dados a serem formatados
        output_format (str, optional): Formato de saída ('json' ou 'text')

    Returns:
        str: Dados formatados como string
    """
    if output_format == 'json':
        return json.dumps(data, indent=2, ensure_ascii=False)
    else:
        return _format_as_text(data)

def _format_as_text(data: Dict[str, Any], indent: int = 0) -> str:
    """
    Formata um dicionário como texto estruturado

    Args:
        data (Dict[str, Any]): Dados a serem formatados
        indent (int, optional): Nível de indentação atual

    Returns:
        str: Dados formatados como texto estruturado
    """

    result = []
    indent_str = ' ' * indent

    # processa status e mensagem primeiro se existirem
    if 'status' in data:
        result.append(f"{indent_str}Status: {data['status']}")

    if 'message' in data:
        result.append(f"{indent_str}Mensagem: {data['message']}")

    # processa os dados propriamente ditos
    if 'data' in data and data['data'] is not None:
        result.append(f"{indent_str}Dados:")
        if isinstance(data['data'], list):
            for i, item in enumerate(data['data']):
                result.append(f"{indent_str}  Item #{i}:")
                if isinstance(item, dict):
                    for k, v in item.items():
                        if isinstance(v, dict):
                            result.append(f"{indent_str}    {k}:")
                            for sub_k, sub_v in v.items():
                                result.append(f"{indent_str}      {sub_k}: {sub_v}")
                        elif isinstance(v, list):
                            result.append(f"{indent_str}    {k}: {', '.join(map(str, v))}")
                        else:
                            result.append(f"{indent_str}    {k}: {v}")
                else:
                    result.append(f"{indent_str}    {item}")
        elif isinstance(data['data'], dict):
            for k, v in data['data'].items():
                if isinstance(v, dict):
                    result.append(f"{indent_str}  {k}:")
                    for sub_k, sub_v in v.items():
                        result.append(f"{indent_str}    {sub_k}: {sub_v}")
                elif isinstance(v, list):
                    result.append(f"{indent_str}  {k}: {', '.join(map(str, v))}")
                else:
                    result.append(f"{indent_str}  {k}: {v}")
        else:
            result.append(f"{indent_str}  {data['data']}")

    # processa outros campos que não são status, message ou data
    for k, v in data.items():
        if k not in ['status', 'message', 'data']:
            if isinstance(v, dict):
                result.append(f"{indent_str}{k}:")
                for sub_k, sub_v in v.items():
                    result.append(f"{indent_str}  {sub_k}: {sub_v}")
            elif isinstance(v, list):
                result.append(f"{indent_str}{k}: {', '.join(map(str, v))}")
            else:
                result.append(f"{indent_str}{k}: {v}")

    return '\n'.join(result)

