# backend/app.py
import os
import random
import sqlite3
from flask import Flask, send_from_directory, request
from flask_socketio import SocketIO, emit

ruta_actual = os.path.dirname(__file__)
directorio_frontend = os.path.abspath(os.path.join(ruta_actual, '..', 'frontend'))

app = Flask(__name__, static_folder=directorio_frontend)
socketio = SocketIO(app, cors_allowed_origins="*")

ruta_base_datos = os.path.join(ruta_actual, 'pizarra.db')

PALETA_COLORES_SERVIDOR = [
    '#10b981', '#059669', '#84cc16', '#facc15', '#d97706',
    '#f59e0b', '#ea580c', '#b91048', '#ef4444', '#991b1b',
    '#78350f', '#a16207', '#8b5cf6', '#6d28d9', '#ec4899',
    '#06b6d4', '#0284c7', '#1e40af', '#111827'
]

ANIMALES_NOMBRES = ['Panda', 'Zorro', 'Águila', 'Tiburón', 'Lobo', 'Trébol', 'Gato', 'Fénix', 'Cóndor', 'Tigre', 'León', 'Halcón']

colores_activos_usuarios = {}
nombres_activos_usuarios = {}

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
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS mensajes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_socket_usuario TEXT,
            nombre_usuario TEXT,
            color_usuario TEXT,
            texto_mensaje TEXT
        )
    ''')
    conexion.commit()
    conexion.close()

inicializar_base_datos()

@app.route('/')
def servir_inicio():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:ruta_archivo>')
def servir_archivos_estaticos(ruta_archivo):
    return send_from_directory(app.static_folder, ruta_archivo)

@socketio.on('connect')
def manejar_conexion(auth=None):
    id_socket = request.sid

    # Asignar color único exclusivo
    colores_en_uso = list(colores_activos_usuarios.values())
    colores_disponibles = [c for c in PALETA_COLORES_SERVIDOR if c not in colores_en_uso]
    color_asignado = random.choice(PALETA_COLORES_SERVIDOR) if not colores_disponibles else random.choice(colores_disponibles)
    colores_activos_usuarios[id_socket] = color_asignado

    # Asignar nombre aleatorio inicial en Python
    animal = random.choice(ANIMALES_NOMBRES)
    numero = random.randint(1000, 9999)
    nombre_asignado = f"{animal}{numero}"
    nombres_activos_usuarios[id_socket] = nombre_asignado

    # Imprimir con claridad en la terminal de Alacritty
    print(f"🟢 Nuevo usuario conectado: {nombre_asignado} (ID: {id_socket})")

    conexion = sqlite3.connect(ruta_base_datos)
    cursor = conexion.cursor()
    
    cursor.execute('SELECT id_socket_usuario, coordenada_x_inicio, coordenada_y_inicio, coordenada_x_fin, coordenada_y_fin, color_trazo, grosor_trazo FROM trazos')
    filas_trazos = cursor.fetchall()
    historial_trazos = [{
        'idSocketUsuario': f[0], 'coordenadaXInicio': f[1], 'coordenadaYInicio': f[2],
        'coordenadaXFin': f[3], 'coordenadaYFin': f[4], 'colorTrazo': f[5], 'grosorTrazo': f[6]
    } for f in filas_trazos]

    cursor.execute('SELECT id, id_socket_usuario, nombre_usuario, color_usuario, texto_mensaje FROM mensajes')
    filas_mensajes = cursor.fetchall()
    historial_mensajes = [{
        'idMensaje': f[0], 'idSocketUsuario': f[1], 'nombreUsuario': f[2],
        'colorUsuario': f[3], 'textoMensaje': f[4]
    } for f in filas_mensajes]

    conexion.close()

    emit('cargar_historial_inicial', {
        'trazos': historial_trazos,
        'mensajes': historial_mensajes,
        'colorAsignado': color_asignado,
        'nombreAsignado': nombre_asignado
    })

    # Notificar a todos los clientes en el chat
    socketio.emit('notificacion_sistema', {
        'texto': f'{nombre_asignado} se ha conectado.'
    })

@socketio.on('actualizar_nombre_servidor')
def manejar_actualizar_nombre(nuevo_nombre):
    id_socket = request.sid
    if nuevo_nombre:
        nombre_antiguo = nombres_activos_usuarios.get(id_socket, "Anónimo")
        nombres_activos_usuarios[id_socket] = nuevo_nombre
        print(f"✏️ Usuario {nombre_antiguo} cambió su apodo a: {nuevo_nombre}")

@socketio.on('disconnect')
def manejar_desconexion():
    id_socket = request.sid
    nombre_usuario = nombres_activos_usuarios.get(id_socket, f"Usuario ({id_socket[:4]})")
    
    if id_socket in colores_activos_usuarios:
        del colores_activos_usuarios[id_socket]
    if id_socket in nombres_activos_usuarios:
        del nombres_activos_usuarios[id_socket]
        
    # Imprimir la desconexión con el apodo en la terminal
    print(f"🔴 Usuario desconectado: {nombre_usuario} (ID: {id_socket})")

    socketio.emit('notificacion_sistema', {
        'texto': f'{nombre_usuario} se ha desconectado.'
    })

@socketio.on('actualizar_nombre_servidor')
def manejar_actualizar_nombre(nuevo_nombre):
    id_socket = request.sid
    if nuevo_nombre:
        nombres_activos_usuarios[id_socket] = nuevo_nombre

@socketio.on('disconnect')
def manejar_desconexion():
    id_socket = request.sid
    # Recuperar el último nombre registrado en Python para este usuario
    nombre_usuario = nombres_activos_usuarios.get(id_socket, f"Usuario ({id_socket[:4]})")
    
    if id_socket in colores_activos_usuarios:
        del colores_activos_usuarios[id_socket]
    if id_socket in nombres_activos_usuarios:
        del nombres_activos_usuarios[id_socket]
        
    print(f"Usuario desconectado: {id_socket} ({nombre_usuario})")

    # Notificar globalmente usando su último nombre registrado
    socketio.emit('notificacion_sistema', {
        'texto': f'{nombre_usuario} se ha desconectado.'
    })

@socketio.on('dibujar_trazo_servidor')
def manejar_trazo_servidor(datos_trazo):
    conexion = sqlite3.connect(ruta_base_datos)
    cursor = conexion.cursor()
    cursor.execute('''
        INSERT INTO trazos (id_socket_usuario, coordenada_x_inicio, coordenada_y_inicio, coordenada_x_fin, coordenada_y_fin, color_trazo, grosor_trazo)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        datos_trazo.get('idSocketUsuario'), datos_trazo.get('coordenadaXInicio'),
        datos_trazo.get('coordenadaYInicio'), datos_trazo.get('coordenadaXFin'),
        datos_trazo.get('coordenadaYFin'), datos_trazo.get('colorTrazo'), datos_trazo.get('grosorTrazo')
    ))
    conexion.commit()
    conexion.close()
    emit('dibujar_trazo_remoto', datos_trazo, to=None, include_self=False)

@socketio.on('enviar_mensaje_servidor')
def manejar_mensaje_servidor(datos_mensaje):
    conexion = sqlite3.connect(ruta_base_datos)
    cursor = conexion.cursor()
    cursor.execute('''
        INSERT INTO mensajes (id_socket_usuario, nombre_usuario, color_usuario, texto_mensaje)
        VALUES (?, ?, ?, ?)
    ''', (
        datos_mensaje.get('idSocketUsuario'),
        datos_mensaje.get('nombreUsuario'),
        datos_mensaje.get('colorUsuario'),
        datos_mensaje.get('textoMensaje')
    ))
    id_generado = cursor.lastrowid
    conexion.commit()
    conexion.close()

    datos_mensaje['idMensaje'] = id_generado
    emit('nuevo_mensaje_remoto', datos_mensaje, to=None)

@socketio.on('borrar_mensaje_servidor')
def manejar_borrar_mensaje(id_mensaje):
    conexion = sqlite3.connect(ruta_base_datos)
    cursor = conexion.cursor()
    cursor.execute('DELETE FROM mensajes WHERE id = ?', (id_mensaje,))
    conexion.commit()
    conexion.close()
    emit('borrar_mensaje_remoto', id_mensaje, to=None)

@socketio.on('limpiar_pizarra_servidor')
def manejar_limpiar_pizarra():
    conexion = sqlite3.connect(ruta_base_datos)
    cursor = conexion.cursor()
    cursor.execute('DELETE FROM trazos')
    conexion.commit()
    conexion.close()
    emit('limpiar_pizarra_remota', to=None)

@socketio.on('limpiar_usuario_servidor')
def manejar_limpiar_usuario(identificador_usuario):
    conexion = sqlite3.connect(ruta_base_datos)
    cursor = conexion.cursor()
    cursor.execute('DELETE FROM trazos WHERE id_socket_usuario = ?', (identificador_usuario,))
    conexion.commit()
    conexion.close()
    emit('limpiar_usuario_remoto', identificador_usuario, to=None)

@socketio.on('deshacer_trazo_servidor')
def manejar_deshacer_trazo(identificador_usuario):
    emit('deshacer_trazo_remoto', identificador_usuario, to=None)

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000)