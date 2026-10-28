# backend/app.py
import os
from flask import Flask, send_from_directory
from flask_socketio import SocketIO

# Obtener la ruta absoluta de la carpeta 'frontend' que está un nivel arriba del backend
ruta_actual = os.path.dirname(__file__)
directorio_frontend = os.path.abspath(os.path.join(ruta_actual, '..', 'frontend'))

# Inicializar la aplicación Flask indicando dónde están los archivos estáticos
app = Flask(__name__, static_folder=directorio_frontend)

# Inicializar SocketIO integrándolo con la aplicación Flask
socketio = SocketIO(app, cors_allowed_origins="*")

# Ruta principal que devuelve el archivo HTML base
@app.route('/')
def servir_inicio():
    # Aunque index.html aún no existe, dejamos la ruta preparada
    return send_from_directory(app.static_folder, 'index.html')

# Ruta dinámica para servir el CSS, el JS y otros recursos desde el frontend
@app.route('/<path:ruta_archivo>')
def servir_archivos_estaticos(ruta_archivo):
    return send_from_directory(app.static_folder, ruta_archivo)

# Escuchar el evento nativo 'connect' que se dispara cuando un cliente entra
@socketio.on('connect')
def manejar_conexion():
    print("Un nuevo usuario se ha conectado al servidor WebSocket.")

if __name__ == '__main__':
    # Usamos socketio.run() en lugar de app.run() para soportar WebSockets
    socketio.run(app, debug=True, port=5000)