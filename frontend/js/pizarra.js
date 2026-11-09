// frontend/js/pizarra.js

const socket = io();
let identificadorUsuarioActual = null;
let colorFijoChatUsuario = null;

socket.on('connect', () => {
    identificadorUsuarioActual = socket.id;
    console.log("Conectado. Mi identificador de usuario es:", identificadorUsuarioActual);
});

const lienzoDibujo = document.getElementById('lienzoDibujo');
const contextoDibujo = lienzoDibujo.getContext('2d');

let estaDibujando = false;
let coordenadaXAnterior = 0;
let coordenadaYAnterior = 0;
let historialTrazos = [];

const PALETA_COLORES_UNICOS = [
    '#10b981', '#059669', '#84cc16', '#facc15', '#d97706',
    '#f59e0b', '#ea580c', '#b91048', '#ef4444', '#991b1b',
    '#78350f', '#a16207', '#8b5cf6', '#6d28d9', '#ec4899',
    '#06b6d4', '#0284c7', '#1e40af', '#111827', '#ffffff'
];

let colorActualPincel = '#10b981'; // Color por defecto temporal hasta recibir el del servidor
let grosorActualPincel = 5;

contextoDibujo.lineWidth = grosorActualPincel;
contextoDibujo.lineCap = 'round';
contextoDibujo.strokeStyle = colorActualPincel;

const barraPaletaColores = document.getElementById('barraPaleta');
barraPaletaColores.innerHTML = '';

PALETA_COLORES_UNICOS.forEach(codigoColor => {
    const circuloColor = document.createElement('div');
    circuloColor.classList.add('circulo-color');
    circuloColor.style.backgroundColor = codigoColor;
    
    circuloColor.addEventListener('click', () => {
        colorActualPincel = codigoColor;
        contextoDibujo.strokeStyle = colorActualPincel;
        document.querySelectorAll('.circulo-color').forEach(c => c.classList.remove('seleccionado'));
        circuloColor.classList.add('seleccionado');
    });
    
    barraPaletaColores.appendChild(circuloColor);
});

const circulosGrosorPincel = document.querySelectorAll('.circulo-grosor');
circulosGrosorPincel.forEach(circuloGrosor => {
    circuloGrosor.addEventListener('click', () => {
        grosorActualPincel = parseInt(circuloGrosor.getAttribute('data-grosor'), 10);
        contextoDibujo.lineWidth = grosorActualPincel;
        circulosGrosorPincel.forEach(c => c.classList.remove('seleccionado'));
        circuloGrosor.classList.add('seleccionado');
    });
});

const botonAlternarPaleta = document.getElementById('btnTogglePaleta');
const contenedorPaletaDesplegable = document.getElementById('contenedorPaletaDesplegable');
botonAlternarPaleta.addEventListener('click', () => {
    contenedorPaletaDesplegable.classList.toggle('colapsado');
});

function redibujarPizarraCompleta() {
    contextoDibujo.clearRect(0, 0, lienzoDibujo.width, lienzoDibujo.height);
    historialTrazos.forEach(trazo => {
        dibujarLineaEnCanvas(
            trazo.coordenadaXInicio,
            trazo.coordenadaYInicio,
            trazo.coordenadaXFin,
            trazo.coordenadaYFin,
            trazo.colorTrazo,
            trazo.grosorTrazo
        );
    });
}

function dibujarLineaEnCanvas(coordenadaXInicio, coordenadaYInicio, coordenadaXFin, coordenadaYFin, colorTrazo, grosorTrazo) {
    contextoDibujo.beginPath();
    contextoDibujo.moveTo(coordenadaXInicio, coordenadaYInicio);
    contextoDibujo.lineTo(coordenadaXFin, coordenadaYFin);
    contextoDibujo.strokeStyle = colorTrazo;
    contextoDibujo.lineWidth = grosorTrazo;
    contextoDibujo.stroke();
}

function iniciarTrazo(evento) {
    estaDibujando = true;
    coordenadaXAnterior = evento.offsetX;
    coordenadaYAnterior = evento.offsetY;
}

function dibujarTrazo(evento) {
    if (!estaDibujando) return;
    const coordenadaXActual = evento.offsetX;
    const coordenadaYActual = evento.offsetY;

    dibujarLineaEnCanvas(coordenadaXAnterior, coordenadaYAnterior, coordenadaXActual, coordenadaYActual, colorActualPincel, grosorActualPincel);

    const datosTrazo = {
        idSocketUsuario: identificadorUsuarioActual,
        coordenadaXInicio: coordenadaXAnterior,
        coordenadaYInicio: coordenadaYAnterior,
        coordenadaXFin: coordenadaXActual,
        coordenadaYFin: coordenadaYActual,
        colorTrazo: colorActualPincel,
        grosorTrazo: grosorActualPincel
    };

    historialTrazos.push(datosTrazo);
    socket.emit('dibujar_trazo_servidor', datosTrazo);

    coordenadaXAnterior = coordenadaXActual;
    coordenadaYAnterior = coordenadaYActual;
}

function detenerTrazo() {
    estaDibujando = false;
}

lienzoDibujo.addEventListener('mousedown', iniciarTrazo);
lienzoDibujo.addEventListener('mousemove', dibujarTrazo);
lienzoDibujo.addEventListener('mouseup', detenerTrazo);
lienzoDibujo.addEventListener('mouseout', detenerTrazo);

socket.on('dibujar_trazo_remoto', (datosTrazo) => {
    historialTrazos.push(datosTrazo);
    dibujarLineaEnCanvas(
        datosTrazo.coordenadaXInicio,
        datosTrazo.coordenadaYInicio,
        datosTrazo.coordenadaXFin,
        datosTrazo.coordenadaYFin,
        datosTrazo.colorTrazo,
        datosTrazo.grosorTrazo
    );
});

const botonLimpiarMio = document.getElementById('btnLimpiarMio');
botonLimpiarMio.addEventListener('click', () => {
    historialTrazos = historialTrazos.filter(trazo => trazo.idSocketUsuario !== identificadorUsuarioActual);
    redibujarPizarraCompleta();
    socket.emit('limpiar_usuario_servidor', identificadorUsuarioActual);
});

socket.on('limpiar_usuario_remoto', (identificadorUsuarioRemoto) => {
    historialTrazos = historialTrazos.filter(trazo => trazo.idSocketUsuario !== identificadorUsuarioRemoto);
    redibujarPizarraCompleta();
});

const botonLimpiarTodo = document.getElementById('btnLimpiarTodo');
botonLimpiarTodo.addEventListener('click', () => {
    historialTrazos = [];
    contextoDibujo.clearRect(0, 0, lienzoDibujo.width, lienzoDibujo.height);
    socket.emit('limpiar_pizarra_servidor');
});

socket.on('limpiar_pizarra_remota', () => {
    historialTrazos = [];
    contextoDibujo.clearRect(0, 0, lienzoDibujo.width, lienzoDibujo.height);
});

const botonDeshacer = document.getElementById('btnDeshacer');
botonDeshacer.addEventListener('click', () => {
    let indiceUltimoTrazoPropio = -1;
    for (let i = historialTrazos.length - 1; i >= 0; i--) {
        if (historialTrazos[i].idSocketUsuario === identificadorUsuarioActual) {
            indiceUltimoTrazoPropio = i;
            break;
        }
    }
    if (indiceUltimoTrazoPropio !== -1) {
        historialTrazos.splice(indiceUltimoTrazoPropio, 1);
        redibujarPizarraCompleta();
        socket.emit('deshacer_trazo_servidor', identificadorUsuarioActual);
    }
});

socket.on('deshacer_trazo_remoto', (identificadorUsuarioRemoto) => {
    let indiceUltimoTrazoRemoto = -1;
    for (let i = historialTrazos.length - 1; i >= 0; i--) {
        if (historialTrazos[i].idSocketUsuario === identificadorUsuarioRemoto) {
            indiceUltimoTrazoRemoto = i;
            break;
        }
    }
    if (indiceUltimoTrazoRemoto !== -1) {
        historialTrazos.splice(indiceUltimoTrazoRemoto, 1);
        redibujarPizarraCompleta();
    }
});

socket.on('cargar_historial_inicial', (historialInicial) => {
    historialTrazos = historialInicial.trazos;
    redibujarPizarraCompleta();

    colorFijoChatUsuario = historialInicial.colorAsignado;
    colorActualPincel = colorFijoChatUsuario;
    contextoDibujo.strokeStyle = colorActualPincel;

    if (historialInicial.nombreAsignado) {
        nombreUsuarioActual = historialInicial.nombreAsignado;
        sessionStorage.setItem('pizarra_nombre_usuario_sesion', nombreUsuarioActual);
        if (typeof actualizarInputNombre === 'function') {
            actualizarInputNombre(nombreUsuarioActual);
        }
    }

    document.querySelectorAll('.circulo-color').forEach(c => {
        if (c.style.backgroundColor === colorActualPincel || rgbAHex(c.style.backgroundColor) === colorActualPincel) {
            c.classList.add('seleccionado');
        } else {
            c.classList.remove('seleccionado');
        }
    });

    if (typeof cargarMensajesInicialesChat === 'function') {
        cargarMensajesInicialesChat(historialInicial.mensajes);
    }
});

function rgbAHex(rgb) {
    if (!rgb.startsWith('rgb')) return rgb;
    const [r, g, b] = rgb.match(/\d+/g).map(Number);
    return "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}