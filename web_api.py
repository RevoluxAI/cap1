#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Servidor API para integração com frontend web.
Implementa endpoints RESTful para manipulação de culturas.
"""

import os
import json
import logging
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from controllers.culture_controller import CultureController
from controllers.menu_controller import MenuController

# configuração de logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# inicialização dos controladores
culture_controller = CultureController()
menu_controller = MenuController(culture_controller)

# inicialização do Flask
app = Flask(__name__)

# habilita CORS para todas as rotas
CORS(app) 

# diretório para servir arquivos estáticos (frontend)
static_folder = os.path.join(os.path.dirname(__file__), 'static')
os.makedirs(static_folder, exist_ok=True)


# === ROTAS API ===
@app.route('/api/cultures', methods=['GET'])
def get_cultures():
    """Endpoint para listar todas as culturas"""
    return jsonify(menu_controller.get_cultures())

@app.route('/api/cultures', methods=['POST'])
def create_culture():
    """Endpoint para criar uma nova cultura"""
    try:
        # obtém dados do formulário ou JSON
        if request.is_json:
            form_data = request.json
        else:
            form_data = request.form.to_dict()

        # processa criação da cultura
        result = menu_controller.create_culture(form_data)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Erro ao criar cultura: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Erro interno: {str(e)}",
            "data": None
        }), 500

@app.route('/api/cultures/<int:culture_id>', methods=['GET'])
def get_culture(culture_id):
    """Endpoint para obter uma cultura específica"""
    return jsonify(menu_controller.get_culture(culture_id))

@app.route('/api/cultures/<int:culture_id>', methods=['PUT', 'PATCH'])
def update_culture(culture_id):
    """Endpoint para atualizar uma cultura"""
    try:
        # obtém dados do formulário ou JSON
        if request.is_json:
            form_data = request.json
        else:
            form_data = request.form.to_dict()

        # processa atualização da cultura
        result = menu_controller.update_culture(culture_id, form_data)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Erro ao atualizar cultura: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Erro interno: {str(e)}",
            "data": None
        }), 500

@app.route('/api/cultures/<int:culture_id>', methods=['DELETE'])
def delete_culture(culture_id):
    """Endpoint para deletar uma cultura"""
    return jsonify(menu_controller.delete_culture(culture_id))

@app.route('/api/cultures/<int:culture_id>/lines', methods=['GET'])
def calculate_lines(culture_id):
    """Endpoint para calcular linhas de plantio de uma cultura"""
    return jsonify(menu_controller.calculate_culture_lines(culture_id))

@app.route('/api/cultures/<int:culture_id>/weather-analysis', methods=['GET'])
def get_weather_analysis(culture_id):
    """Endpoint para obter análise meteorológica e recomendações para uma cultura"""
    return jsonify(menu_controller.get_weather_analysis(culture_id))


# === ROTAS PARA FRONTEND ===
@app.route('/', methods=['GET'])
def index():
    """Rota para servir a página principal do frontend"""
    return send_from_directory(static_folder, 'index.html')

@app.route('/<path:path>', methods=['GET'])
def serve_static(path):
    """Rota para servir arquivos estáticos do frontend"""
    return send_from_directory(static_folder, path)


# === INICIALIZAÇÃO DO SERVIDOR ===
if __name__ == "__main__":
    # configurações para o servidor de desenvolvimento
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'

    print(f"Servidor iniciado em http://localhost:{port}")
    print("Endpoints disponíveis:")
    print("  GET    /api/cultures             - Listar todas as culturas")
    print("  POST   /api/cultures             - Criar nova cultura")
    print("  GET    /api/cultures/:id         - Obter cultura específica")
    print("  PUT    /api/cultures/:id         - Atualizar cultura")
    print("  DELETE /api/cultures/:id         - Deletar cultura")
    print("  GET    /api/cultures/:id/lines   - Calcular linhas de plantio")
    print("  GET    /api/cultures/:id/weather-analysis - Obter análise meteorológica")

    # iniciar servidor
    app.run(host='0.0.0.0', port=port, debug=debug)

