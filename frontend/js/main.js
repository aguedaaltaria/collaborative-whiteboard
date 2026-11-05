// frontend/js/main.js

const lienzoDibujo = document.getElementById('lienzoDibujo');
const contextoDibujo = lienzoDibujo.getContext('2d');

let estaDibujando = false;
let coordenadaXAnterior = 0;
let coordenadaYAnterior = 0;

// Paleta optimizada de 20 colores
const PALETA_COLORES_UNICOS = [
    '#10b981', // 1. Verde esmeralda
    '#059669', // 2. Verde bosque
    '#84cc16', // 3. Verde lima intenso
    '#facc15', // 4. Amarillo sol puro
    '#d97706', // 5. Amarillo dorado / Sol tostado
    '#f59e0b', // 6. Naranja cálido
    '#ea580c', // 7. Naranja tostado / Calabaza
    '#b91048', // 8. Magenta / Rosado fuerte
    '#ef4444', // 9. Rojo brillante
    '#991b1b', // 10. Rojo oscuro / Borgoña
    '#78350f', // 11. Marrón madera / Tronco de árbol
    '#a16207', // 12. Marrón claro / Ocre
    '#8b5cf6', // 13. Morado vivo
    '#6d28d9', // 14. Morado oscuro / Uva
    '#ec4899', // 15. Rosa chicle
    '#06b6d4', // 16. Cyan / Turquesa
    '#0284c7', // 17. Azul cielo intenso
    '#1e40af', // 18. Azul marino profundo
    '#111827', // 19. Negro carbón
    '#ffffff'  // 20. Blanco puro (Borrador)
];

// Seleccionar un color aleatorio inicial excluyendo el blanco
const coloresDisponiblesInicio = PALETA_COLORES_UNICOS.filter(color => color !== '#ffffff');
let colorActualPincel = coloresDisponiblesInicio[Math.floor(Math.random() * coloresDisponiblesInicio.length)];

// Configuración inicial del pincel (Grosor medio por defecto: 5 píxeles)
let grosorActualPincel = 5;
contextoDibujo.lineWidth = grosorActualPincel;
contextoDibujo.lineCap = 'round';
contextoDibujo.strokeStyle = colorActualPincel;

// Construir la paleta visual de colores en el DOM
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

        document.querySelectorAll('.circulo-color').forEach(circuloExistente => {
            circuloExistente.classList.remove('seleccionado');
        });
        circuloColor.classList.add('seleccionado');
    });

    barraPaletaColores.appendChild(circuloColor);
});

// Lógica para cambiar el grosor del pincel mediante los círculos visuales
const circulosGrosorPincel = document.querySelectorAll('.circulo-grosor');

circulosGrosorPincel.forEach(circuloGrosor => {
    circuloGrosor.addEventListener('click', () => {
        grosorActualPincel = parseInt(circuloGrosor.getAttribute('data-grosor'), 10);
        contextoDibujo.lineWidth = grosorActualPincel;

        circulosGrosorPincel.forEach(circuloExistente => {
            circuloExistente.classList.remove('seleccionado');
        });
        circuloGrosor.classList.add('seleccionado');
    });
});

// Lógica para minimizar o expandir el panel desplegable unificado
const botonAlternarPaleta = document.getElementById('btnTogglePaleta');
const contenedorPaletaDesplegable = document.getElementById('contenedorPaletaDesplegable');

botonAlternarPaleta.addEventListener('click', () => {
    contenedorPaletaDesplegable.classList.toggle('colapsado');
});

// Lógica local de dibujo en el Canvas con el ratón
function iniciarTrazo(evento) {
    estaDibujando = true;
    coordenadaXAnterior = evento.offsetX;
    coordenadaYAnterior = evento.offsetY;
}

function dibujarTrazo(evento) {
    if (!estaDibujando) return;

    const coordenadaXActual = evento.offsetX;
    const coordenadaYActual = evento.offsetY;

    contextoDibujo.beginPath();
    contextoDibujo.moveTo(coordenadaXAnterior, coordenadaYAnterior);
    contextoDibujo.lineTo(coordenadaXActual, coordenadaYActual);
    contextoDibujo.stroke();

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

// Botón de limpieza local de la pizarra
const botonLimpiarPizarra = document.getElementById('btnLimpiar');
botonLimpiarPizarra.addEventListener('click', () => {
    contextoDibujo.clearRect(0, 0, lienzoDibujo.width, lienzoDibujo.height);
});