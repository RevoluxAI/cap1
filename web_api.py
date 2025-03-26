#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Servidor API para integração com frontend web.
Fornece endpoints RESTful para manipulação de culturas agrícolas.
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
CORS(app)  # Habilitar CORS para todas as rotas

# diretório para servir arquivos estáticos (frontend)
static_folder = os.path.join(os.path.dirname(__file__), 'static')
os.makedirs(static_folder, exist_ok=True)


# === ROTAS API ===
@app.route('/api/cultures', methods=['GET'])
def get_cultures():
    """Endpoint para listar todas as culturas"""
    return jsonify(menu_controller.get_cultures())


@app.route('/api/cultures/generate', methods=['POST'])
def generate_random_cultures():
    """Endpoint para gerar múltiplas culturas aleatórias para análise estatística"""
    try:
        # obtém dados do JSON
        if request.is_json:
            form_data = request.json
        else:
            form_data = request.form.to_dict()
        
        # extrai parâmetros obrigatórios e opcionais
        culture_type = int(form_data.get('culture_type', 0))
        if culture_type not in [1, 2]:
            return jsonify({
                "status": "error",
                "message": "Tipo de cultura inválido (deve ser 1 para Soja ou 2 para Cana-de-Açúcar)",
                "data": None
            }), 400
        
        # número de amostras a serem geradas (opcional, padrão: 10)
        num_samples = int(form_data.get('num_samples', 10))
        if num_samples <= 0 or num_samples > 100:  # Limitamos a 100 para evitar sobrecarga
            return jsonify({
                "status": "error",
                "message": "Número de amostras deve estar entre 1 e 100",
                "data": None
            }), 400
        
        # flag para incluir estatísticas na resposta (opcional, padrão: True)
        with_statistics = form_data.get('with_statistics', 'true').lower() in ['true', 't', '1', 'yes', 'y']
        
        # gera culturas aleatórias
        logger.info(f"Gerando {num_samples} amostras aleatórias de cultura tipo {culture_type}")
        result = culture_controller.generate_random_cultures(
            culture_type=culture_type,
            num_samples=num_samples,
            with_statistics=with_statistics
        )
        
        # adiciona as culturas geradas à lista de dados do menu_controller
        if result and "status" in result and result["status"] == "success" and "cultures" in result:
            for culture in result["cultures"]:
                # verifica se a cultura já existe na lista pelo ID
                existing_ids = [c.get("id") for c in menu_controller.data if isinstance(c, dict) and "id" in c]
                if culture.get("id") not in existing_ids:
                    menu_controller.data.append(culture)
            
            logger.info(f"Adicionadas {len(result['cultures'])} culturas ao menu_controller")
            
            # atualiza o resultado para indicar que os dados foram persistidos
            result["message"] = f"{len(result['cultures'])} culturas geradas e armazenadas com sucesso"
        
        return jsonify(result)
        
    except ValueError as e:
        logger.error(f"Erro de formato ao gerar culturas: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Erro de formato: {str(e)}",
            "data": None
        }), 400
    except Exception as e:
        logger.error(f"Erro ao gerar culturas aleatórias: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Erro interno: {str(e)}",
            "data": None
        }), 500


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

@app.route('/api/cultures/all', methods=['GET'])
def get_all_cultures():
    """Endpoint para listar todas as culturas, incluindo as deletadas"""
    return jsonify(menu_controller.get_all_cultures())

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

    # inicializa servidor
    app.run(host='0.0.0.0', port=port, debug=debug)

