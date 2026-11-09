// frontend/js/fondo.js

let imagenFondoActual = null;

function obtenerImagenFondoActual() {
    return imagenFondoActual;
}

const botonCargarFondo = document.getElementById('btnCargarFondo');
const inputFondoLocal = document.getElementById('inputFondoLocal');

// Aplicar imagen de fondo y opcionalmente actualizar indicador visual
function aplicarImagenFondo(base64Data, actualizarServidor = false) {
    if (!base64Data) {
        imagenFondoActual = null;
        sessionStorage.removeItem('pizarra_fondo_imagen');
        inputFondoLocal.value = '';
        botonCargarFondo.style.backgroundColor = "";
        if (typeof redibujarPizarraCompleta === 'function') {
            redibujarPizarraCompleta();
        }
        if (actualizarServidor) {
            socket.emit('quitar_fondo_servidor');
        }
        return;
    }

    const imagen = new Image();
    imagen.onload = function() {
        imagenFondoActual = imagen;
        sessionStorage.setItem('pizarra_fondo_imagen', base64Data);
        botonCargarFondo.style.backgroundColor = "#facc15"; // Indicador visual activo
        if (typeof redibujarPizarraCompleta === 'function') {
            redibujarPizarraCompleta();
        }
        if (actualizarServidor) {
            socket.emit('cambiar_fondo_servidor', { imagenBase64: base64Data });
        }
    };
    imagen.src = base64Data;
}

// Evento del botón de fondo (Poner o Quitar)
botonCargarFondo.addEventListener('click', () => {
    if (imagenFondoActual !== null) {
        // Si ya hay fondo, al hacer clic de nuevo se quita globalmente
        aplicarImagenFondo(null, true);
        console.log("Imagen de fondo eliminada.");
    } else {
        // Si no hay fondo, abrimos el explorador de archivos local
        inputFondoLocal.click();
    }
});

// Al seleccionar el archivo de la computadora
inputFondoLocal.addEventListener('change', (evento) => {
    const archivo = evento.target.files[0];
    if (archivo) {
        const lector = new FileReader();
        lector.onload = function(e) {
            const resultadoBase64 = e.target.result;
            aplicarImagenFondo(resultadoBase64, true); // Aplicar y sincronizar con el servidor
        };
        lector.readAsDataURL(archivo);
    }
});

// Escuchar cuando otro usuario cambia el fondo
socket.on('cambiar_fondo_remoto', (base64Data) => {
    aplicarImagenFondo(base64Data, false);
});

// Escuchar cuando otro usuario quita el fondo
socket.on('quitar_fondo_remoto', () => {
    aplicarImagenFondo(null, false);
});