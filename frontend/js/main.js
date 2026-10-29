// frontend/js/main.js

const lienzo = document.getElementById('lienzoDibujo');
const contexto = lienzo.getContext('2d');

let estaDibujando = false;
let coordenadaXAnterior = 0;
let coordenadaYAnterior = 0;

// Paleta ampliada de 19 colores (incluyendo el blanco como borrador)
const PALETA_COLORES_UNICOS = [
    '#10b981', // 1. Verde esmeralda
    '#059669', // 2. Verde bosque
    '#84cc16', // 3. Verde lima intenso
    '#d97706', // 4. Amarillo dorado / Sol tostado
    '#f59e0b', // 5. Naranja cálido
    '#ea580c', // 6. Naranja tostado / Calabaza
    '#b91048', // 7. Magenta / Rosado fuerte
    '#ef4444', // 8. Rojo brillante
    '#991b1b', // 9. Rojo oscuro / Borgoña
    '#78350f', // 10. Marrón madera / Tronco de árbol
    '#a16207', // 11. Marrón claro / Ocre
    '#8b5cf6', // 12. Morado vivo
    '#6d28d9', // 13. Morado oscuro / Uva
    '#ec4899', // 14. Rosa chicle
    '#06b6d4', // 15. Cyan / Turquesa
    '#0284c7', // 16. Azul cielo intenso
    '#1e40af', // 17. Azul marino profundo
    '#111827', // 18. Negro carbón
    '#ffffff'  // 19. Blanco puro (¡Funciona como borrador!)
];

// Seleccionar un color aleatorio inicial EXCLUYENDO estrictamente el blanco (#ffffff)
const coloresDisponiblesInicio = PALETA_COLORES_UNICOS.filter(color => color !== '#ffffff');
let colorActual = coloresDisponiblesInicio[Math.floor(Math.random() * coloresDisponiblesInicio.length)];

// Configuración inicial del pincel
contexto.lineWidth = 4;
contexto.lineCap = 'round';
contexto.strokeStyle = colorActual;

// Construir la paleta visual de colores en el DOM
const barraPaleta = document.getElementById('barraPaleta');
barraPaleta.innerHTML = '';

PALETA_COLORES_UNICOS.forEach(codigoColor => {
    const circulo = document.createElement('div');
    circulo.classList.add('circulo-color');
    circulo.style.backgroundColor = codigoColor;

    if (codigoColor === colorActual) {
        circulo.classList.add('seleccionado');
    }

    circulo.addEventListener('click', () => {
        colorActual = codigoColor;
        contexto.strokeStyle = colorActual;

        document.querySelectorAll('.circulo-color').forEach(circuloExistente => {
            circuloExistente.classList.remove('seleccionado');
        });
        circulo.classList.add('seleccionado');
    });

    barraPaleta.appendChild(circulo);
});

// Lógica para minimizar/expandir la paleta de colores con el botón
const botonAlternarPaleta = document.getElementById('btnTogglePaleta');
const contenedorPaletaDesplegable = document.getElementById('contenedorPaletaDesplegable');

botonAlternarPaleta.addEventListener('click', () => {
    contenedorPaletaDesplegable.classList.toggle('colapsado');
});

// Lógica local de dibujo en el Canvas
function iniciarTrazo(evento) {
    estaDibujando = true;
    coordenadaXAnterior = evento.offsetX;
    coordenadaYAnterior = evento.offsetY;
}

function dibujar(evento) {
    if (!estaDibujando) return;

    const coordenadaXActual = evento.offsetX;
    const coordenadaYActual = evento.offsetY;

    contexto.beginPath();
    contexto.moveTo(coordenadaXAnterior, coordenadaYAnterior);
    contexto.lineTo(coordenadaXActual, coordenadaYActual);
    contexto.stroke();

    coordenadaXAnterior = coordenadaXActual;
    coordenadaYAnterior = coordenadaYActual;
}

function detenerTrazo() {
    estaDibujando = false;
}

lienzo.addEventListener('mousedown', iniciarTrazo);
lienzo.addEventListener('mousemove', dibujar);
lienzo.addEventListener('mouseup', detenerTrazo);
lienzo.addEventListener('mouseout', detenerTrazo);

// Botón de limpiar pizarra local
const botonLimpiarPizarra = document.getElementById('btnLimpiar');
botonLimpiarPizarra.addEventListener('click', () => {
    contexto.clearRect(0, 0, lienzo.width, lienzo.height);
});