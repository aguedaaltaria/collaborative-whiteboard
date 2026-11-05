// frontend/js/main.js

const socket = io();

let identificadorUsuarioActual = null;

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

const coloresDisponiblesInicio = PALETA_COLORES_UNICOS.filter(color => color !== '#ffffff');
let colorActualPincel = coloresDisponiblesInicio[Math.floor(Math.random() * coloresDisponiblesInicio.length)];

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

    if (codigoColor === colorActualPincel) {
        circuloColor.classList.add('seleccionado');
    }

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
        contextoDibujo.beginPath();
        contextoDibujo.moveTo(trazo.coordenadaXInicio, trazo.coordenadaYInicio);
        contextoDibujo.lineTo(trazo.coordenadaXFin, trazo.coordenadaYFin);
        contextoDibujo.strokeStyle = trazo.colorTrazo;
        contextoDibujo.lineWidth = trazo.grosorTrazo;
        contextoDibujo.stroke();
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

// Botón: Limpiar solo lo mío (Sincronizado globalmente para que desaparezca en todas las pantallas)
const botonLimpiarMio = document.getElementById('btnLimpiarMio');
botonLimpiarMio.addEventListener('click', () => {
    historialTrazos = historialTrazos.filter(trazo => trazo.idSocketUsuario !== identificadorUsuarioActual);
    redibujarPizarraCompleta();
    socket.emit('limpiar_usuario_servidor', identificadorUsuarioActual);
});

// Escuchar cuando otro usuario decide limpiar sus trazos
socket.on('limpiar_usuario_remoto', (identificadorUsuarioRemoto) => {
    historialTrazos = historialTrazos.filter(trazo => trazo.idSocketUsuario !== identificadorUsuarioRemoto);
    redibujarPizarraCompleta();
});

// Botón: Limpiar todo (sincronizado globalmente)
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

// Escuchar el historial inicial enviado por SQLite al conectarse
socket.on('cargar_historial_inicial', (historialInicial) => {
    historialTrazos = historialInicial;
    redibujarPizarraCompleta();
    console.log("Historial de trazos cargado desde SQLite:", historialTrazos.length);
});

// Botón: Deshacer (Borra el último trazo propio)
const botonDeshacer = document.getElementById('btnDeshacer');
botonDeshacer.addEventListener('click', () => {
    // Buscar desde el final del historial el último trazo que pertenezca a nuestro usuario
    let indiceUltimoTrazoPropio = -1;
    for (let i = historialTrazos.length - 1; i >= 0; i--) {
        if (historialTrazos[i].idSocketUsuario === identificadorUsuarioActual) {
            indiceUltimoTrazoPropio = i;
            break;
        }
    }

    // Si encontramos un trazo propio, lo eliminamos del historial y actualizamos
    if (indiceUltimoTrazoPropio !== -1) {
        historialTrazos.splice(indiceUltimoTrazoPropio, 1);
        redibujarPizarraCompleta();
        socket.emit('deshacer_trazo_servidor', identificadorUsuarioActual);
    }
});

// Escuchar cuando otro usuario deshace su último trazo
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