# backend/app.py
import os
import sqlite3
from flask import Flask, send_from_directory
from flask_socketio import SocketIO, emit

ruta_actual = os.path.dirname(__file__)
directorio_frontend = os.path.abspath(os.path.join(ruta_actual, '..', 'frontend'))

app = Flask(__name__, static_folder=directorio_frontend)
socketio = SocketIO(app, cors_allowed_origins="*")

# Nombre de la base de datos SQLite para la pizarra
ruta_base_datos = os.path.join(ruta_actual, 'pizarra.db')

def inicializar_base_datos():
    conexion = sqlite3.connect(ruta_base_datos)
    cursor = conexion.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS trazos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_socket_usuario TEXT,
            coordenada_x_inicio REAL,
            coordenada_y_inicio REAL,
            coordenada_x_fin REAL,
            coordenada_y_fin REAL,
            color_trazo TEXT,
            grosor_trazo REAL
        )
    ''')
    conexion.commit()
    conexion.close()

# Inicializar la base de datos al arrancar el servidor
inicializar_base_datos()

@app.route('/')
def servir_inicio():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:ruta_archivo>')
def servir_archivos_estaticos(ruta_archivo):
    return send_from_directory(app.static_folder, ruta_archivo)

@socketio.on('connect')
def manejar_conexion():
    print("Un nuevo usuario se ha conectado al servidor WebSocket.")
    
    # Al conectar un usuario, consultamos todos los trazos guardados en SQLite
    conexion = sqlite3.connect(ruta_base_datos)
    cursor = conexion.cursor()
    cursor.execute('SELECT id_socket_usuario, coordenada_x_inicio, coordenada_y_inicio, coordenada_x_fin, coordenada_y_fin, color_trazo, grosor_trazo FROM trazos')
    filas = cursor.fetchall()
    conexion.close()

    # Formatear los trazos en una lista de diccionarios
    historial_guardado = []
    for fila in filas:
        historial_guardado.append({
            'idSocketUsuario': fila[0],
            'coordenadaXInicio': fila[1],
            'coordenadaYInicio': fila[2],
            'coordenadaXFin': fila[3],
            'coordenadaYFin': fila[4],
            'colorTrazo': fila[5],
            'grosorTrazo': fila[6]
        })

    # Enviar el historial completo únicamente al usuario que acaba de conectarse
    emit('cargar_historial_inicial', historial_guardado)

@socketio.on('dibujar_trazo_servidor')
def manejar_trazo_servidor(datos_trazo):
    # Guardar el nuevo trazo en la base de datos SQLite
    conexion = sqlite3.connect(ruta_base_datos)
    cursor = conexion.cursor()
    cursor.execute('''
        INSERT INTO trazos (id_socket_usuario, coordenada_x_inicio, coordenada_y_inicio, coordenada_x_fin, coordenada_y_fin, color_trazo, grosor_trazo)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        datos_trazo.get('idSocketUsuario'),
        datos_trazo.get('coordenadaXInicio'),
        datos_trazo.get('coordenadaYInicio'),
        datos_trazo.get('coordenadaXFin'),
        datos_trazo.get('coordenadaYFin'),
        datos_trazo.get('colorTrazo'),
        datos_trazo.get('grosorTrazo')
    ))
    conexion.commit()
    conexion.close()

    # Retransmitir el trazo a los demás usuarios
    emit('dibujar_trazo_remoto', datos_trazo, broadcast=True, include_self=False)

@socketio.on('limpiar_pizarra_servidor')
def manejar_limpiar_pizarra():
    # Borrar todos los trazos de SQLite cuando se limpia toda la pizarra
    conexion = sqlite3.connect(ruta_base_datos)
    cursor = conexion.cursor()
    cursor.execute('DELETE FROM trazos')
    conexion.commit()
    conexion.close()

    emit('limpiar_pizarra_remota', broadcast=True)

@socketio.on('limpiar_usuario_servidor')
def manejar_limpiar_usuario(identificador_usuario):
    # Borrar de SQLite únicamente los trazos que pertenecen a este usuario
    conexion = sqlite3.connect(ruta_base_datos)
    cursor = conexion.cursor()
    cursor.execute('DELETE FROM trazos WHERE id_socket_usuario = ?', (identificador_usuario,))
    conexion.commit()
    conexion.close()

    emit('limpiar_usuario_remoto', identificador_usuario, broadcast=True)

# Evento para eliminar el último trazo de un usuario específico en todos lados
@socketio.on('deshacer_trazo_servidor')
def manejar_deshacer_trazo(identificador_usuario):
    print(f"Deshaciendo el último trazo del usuario: {identificador_usuario}")
    emit('deshacer_trazo_remoto', identificador_usuario, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000)