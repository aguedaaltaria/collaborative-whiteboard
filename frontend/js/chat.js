// frontend/js/chat.js

const entradaMensaje = document.getElementById('entradaMensaje');
const botonEnviar = document.getElementById('btnEnviar');
const contenedorMensajes = document.getElementById('contenedorMensajes');
const entradaNombreUsuario = document.getElementById('entradaNombreUsuario');
const botonGuardarNombre = document.getElementById('btnGuardarNombre');
const botonVaciarMiChat = document.getElementById('btnVaciarMiChat');

let nombreUsuarioActual = sessionStorage.getItem('pizarra_nombre_usuario_sesion') || 'Artista';
entradaNombreUsuario.value = nombreUsuarioActual;

// Función para actualizar el campo de texto del apodo cuando el servidor asigna uno nuevo
function actualizarInputNombre(nuevoNombre) {
    nombreUsuarioActual = nuevoNombre;
    entradaNombreUsuario.value = nombreUsuarioActual;
}

botonGuardarNombre.addEventListener('click', () => {
    const nuevoNombre = entradaNombreUsuario.value.trim();
    if (nuevoNombre !== '') {
        nombreUsuarioActual = nuevoNombre;
        sessionStorage.setItem('pizarra_nombre_usuario_sesion', nombreUsuarioActual);
        socket.emit('actualizar_nombre_servidor', nombreUsuarioActual);
        console.log("Nombre de usuario actualizado a:", nombreUsuarioActual);
    }
});

botonVaciarMiChat.addEventListener('click', () => {
    contenedorMensajes.innerHTML = '';
});

// Función explícita sin operadores terciarios para calcular el contraste del texto del autor
function calcularColorTextoSegunFondo(colorHexadecimal) {
    const limpiadorHex = colorHexadecimal.replace('#', '');
    const rojo = parseInt(limpiadorHex.substr(0, 2), 16);
    const verde = parseInt(limpiadorHex.substr(2, 2), 16);
    const azul = parseInt(limpiadorHex.substr(4, 2), 16);
    const luminosidad = (rojo * 0.299 + verde * 0.587 + azul * 0.114);
    
    if (luminosidad < 128) {
        return '#ffffff';
    } else {
        return '#111111';
    }
}

function renderizarMensajeEnChat(datosMensaje) {
    const elementoMensaje = document.createElement('div');
    elementoMensaje.classList.add('burbuja-mensaje');
    elementoMensaje.setAttribute('data-id-mensaje', datosMensaje.idMensaje);

    const colorTextoContrastado = calcularColorTextoSegunFondo(datosMensaje.colorUsuario);
    
    let contenidoHTML = `
        <span class="etiqueta-autor" style="background-color: ${datosMensaje.colorUsuario}; color: ${colorTextoContrastado};">
            ${datosMensaje.nombreUsuario}
        </span>
        <span class="texto-contenido">${datosMensaje.textoMensaje}</span>
    `;

    if (datosMensaje.idSocketUsuario === identificadorUsuarioActual) {
        contenidoHTML += `<button class="boton-borrar-mensaje" title="Borrar este mensaje">❌</button>`;
    }

    elementoMensaje.innerHTML = contenidoHTML;

    if (datosMensaje.idSocketUsuario === identificadorUsuarioActual) {
        const botonBorrar = elementoMensaje.querySelector('.boton-borrar-mensaje');
        botonBorrar.addEventListener('click', () => {
            socket.emit('borrar_mensaje_servidor', datosMensaje.idMensaje);
        });
    }

    contenedorMensajes.appendChild(elementoMensaje);
    contenedorMensajes.scrollTop = contenedorMensajes.scrollHeight;
}

function renderizarNotificacionSistema(textoNotificacion) {
    const elementoNotificacion = document.createElement('div');
    elementoNotificacion.classList.add('burbuja-sistema');
    elementoNotificacion.textContent = "🔔 " + textoNotificacion;
    
    contenedorMensajes.appendChild(elementoNotificacion);
    contenedorMensajes.scrollTop = contenedorMensajes.scrollHeight;
}

function cargarMensajesInicialesChat(mensajes) {
    contenedorMensajes.innerHTML = '';
    mensajes.forEach(mensaje => {
        renderizarMensajeEnChat(mensaje);
    });
}

function enviarMensajeChat() {
    const textoMensaje = entradaMensaje.value.trim();
    if (textoMensaje === '') {
        return;
    }

    const datosMensaje = {
        idSocketUsuario: identificadorUsuarioActual,
        nombreUsuario: nombreUsuarioActual,
        colorUsuario: colorFijoChatUsuario,
        textoMensaje: textoMensaje
    };

    socket.emit('enviar_mensaje_servidor', datosMensaje);
    entradaMensaje.value = '';
    entradaMensaje.focus();
}

botonEnviar.addEventListener('click', enviarMensajeChat);
entradaMensaje.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') {
        enviarMensajeChat();
    }
});

socket.on('nuevo_mensaje_remoto', (datosMensaje) => {
    renderizarMensajeEnChat(datosMensaje);
});

socket.on('borrar_mensaje_remoto', (idMensajeBorrar) => {
    const elementoAEliminar = contenedorMensajes.querySelector(`[data-id-mensaje="${idMensajeBorrar}"]`);
    if (elementoAEliminar) {
        elementoAEliminar.remove();
    }
});

socket.on('notificacion_sistema', (datosNotificacion) => {
    renderizarNotificacionSistema(datosNotificacion.texto);
});