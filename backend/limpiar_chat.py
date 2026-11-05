# limpiar_chat.py
import os
import sqlite3

def vaciar_tabla_mensajes():
    # Buscar la ruta de la base de datos de forma segura
    rutas_posibles = [
        os.path.join('backend', 'pizarra.db'),
        'pizarra.db',
        os.path.join(os.path.dirname(__file__), 'backend', 'pizarra.db')
    ]
    
    ruta_encontrada = None
    for ruta in rutas_posibles:
        if os.path.exists(ruta):
            ruta_encontrada = ruta
            break

    if not ruta_encontrada:
        print("❌ No se encontró la base de datos 'pizarra.db' en ninguna ruta conocida.")
        return

    conexion = sqlite3.connect(ruta_encontrada)
    cursor = conexion.cursor()
    
    # Borrar únicamente los registros de la tabla mensajes
    cursor.execute('DELETE FROM mensajes')
    conexion.commit()
    conexion.close()
    
    print(f"🧹 ¡Listo! Todos los mensajes del chat han sido borrados desde: {ruta_encontrada}")

if __name__ == '__main__':
    vaciar_tabla_mensajes()