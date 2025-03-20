#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
import sys
import json
import logging
from controllers.menu_controller import MenuController
from controllers.culture_controller import CultureController
from utils.json_formatter import format_output

# Configuração de logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def parse_args():
    """Processa os argumentos de linha de comando"""
    parser = argparse.ArgumentParser(description='FarmTech Solutions - Sistema de Gerenciamento Agrícola')

    # Grupo de opções mutuamente exclusivas para formato de saída
    output_format = parser.add_mutually_exclusive_group()
    output_format.add_argument('--text', action='store_true', help='Saída em formato de texto')
    output_format.add_argument('--json', action='store_true', default=True, help='Saída em formato JSON (padrão)')

    return parser.parse_args()

def main():
    """Função principal da aplicação"""
    args = parse_args()
    output_format = 'text' if args.text else 'json'

    # Inicializa controladores
    culture_controller = CultureController()
    menu_controller = MenuController(culture_controller)

    try:
        # Inicia o menu interativo
        result = menu_controller.run()

        # Formata a saída de acordo com o formato especificado
        output = format_output(result, output_format)

        # Exibe o resultado
        print(output)

        return 0
    except KeyboardInterrupt:
        print("\nPrograma encerrado pelo usuário.")
        return 0
    except Exception as e:
        logger.error(f"Erro não tratado: {str(e)}")
        if output_format == 'json':
            print(json.dumps({"error": str(e)}))
        else:
            print(f"Erro: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())

