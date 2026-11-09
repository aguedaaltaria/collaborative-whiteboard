// frontend/js/galeria.js

const botonGuardarDiseno = document.getElementById('btnGuardarDiseno');
const botonToggleGaleria = document.getElementById('btnToggleGaleria');
const botonCerrarGaleria = document.getElementById('btnCerrarGaleria');
const panelGaleriaDesplegable = document.getElementById('panelGaleriaDesplegable');
const contenedorGridMiniaturas = document.getElementById('contenedorGridMiniaturas');

let listaDiseñosGuardados = JSON.parse(sessionStorage.getItem('pizarra_galeria_disenos')) || [];

// Abrir / Minimizar panel mediante el botón principal
botonToggleGaleria.addEventListener('click', () => {
    panelGaleriaDesplegable.classList.toggle('colapsado');
});

// Minimizar panel mediante la "X" interna
if (botonCerrarGaleria) {
    botonCerrarGaleria.addEventListener('click', () => {
        panelGaleriaDesplegable.classList.add('colapsado');
    });
}

function renderizarGaleria() {
    contenedorGridMiniaturas.innerHTML = '';
    
    if (listaDiseñosGuardados.length === 0) {
        contenedorGridMiniaturas.innerHTML = '<p class="texto-vacio">No hay diseños.</p>';
        return;
    }

    listaDiseñosGuardados.forEach((diseño, indice) => {
        const tarjetaMiniatura = document.createElement('div');
        tarjetaMiniatura.classList.add('tarjeta-miniatura');
        
        const imagenMini = document.createElement('img');
        imagenMini.src = diseño.imagenUrl;
        imagenMini.alt = `Diseño ${indice + 1}`;
        
        const grupoBotones = document.createElement('div');
        grupoBotones.classList.add('grupo-botones-tarjeta');

        // Botón Cargar
        const botonCargar = document.createElement('button');
        botonCargar.textContent = 'Cargar';
        botonCargar.classList.add('boton-primario', 'boton-cargar-mini');
        botonCargar.addEventListener('click', () => {
            if (typeof historialTrazos !== 'undefined' && typeof redibujarPizarraCompleta === 'function') {
                historialTrazos = [...diseño.trazos];
                
                if (diseño.fondoBase64 && typeof aplicarImagenFondo === 'function') {
                    aplicarImagenFondo(diseño.fondoBase64, false);
                } else if (typeof aplicarImagenFondo === 'function') {
                    aplicarImagenFondo(null, false);
                }
                
                redibujarPizarraCompleta();
                panelGaleriaDesplegable.classList.add('colapsado');
            }
        });

        // Botón Borrar individual
        const botonBorrar = document.createElement('button');
        botonBorrar.textContent = '✕';
        botonBorrar.title = 'Eliminar';
        botonBorrar.classList.add('boton-borrar-mini');
        botonBorrar.addEventListener('click', () => {
            listaDiseñosGuardados.splice(indice, 1);
            sessionStorage.setItem('pizarra_galeria_disenos', JSON.stringify(listaDiseñosGuardados));
            renderizarGaleria();
        });

        grupoBotones.appendChild(botonCargar);
        grupoBotones.appendChild(botonBorrar);

        tarjetaMiniatura.appendChild(imagenMini);
        tarjetaMiniatura.appendChild(grupoBotones);
        contenedorGridMiniaturas.appendChild(tarjetaMiniatura);
    });
}

// Guardar diseño actual con su fondo real (blanco o imagen)
botonGuardarDiseno.addEventListener('click', () => {
    const lienzoCanvas = document.getElementById('lienzoDibujo');
    if (!lienzoCanvas) return;

    // Creamos un canvas temporal en memoria para componer la imagen con su fondo real
    const canvasTemporal = document.createElement('canvas');
    canvasTemporal.width = lienzoCanvas.width;
    canvasTemporal.height = lienzoCanvas.height;
    const ctxTemp = canvasTemporal.getContext('2d');

    // 1. Pintar fondo blanco por defecto
    ctxTemp.fillStyle = '#ffffff';
    ctxTemp.fillRect(0, 0, canvasTemporal.width, canvasTemporal.height);

    // 2. Si hay una imagen de fondo activa, dibujarla encima del blanco
    const fondoActualBase64 = sessionStorage.getItem('pizarra_fondo_imagen') || null;
    
    if (fondoActualBase64) {
        const imgFondoTemp = new Image();
        imgFondoTemp.onload = function() {
            ctxTemp.drawImage(imgFondoTemp, 0, 0, canvasTemporal.width, canvasTemporal.height);
            
            // Dibujar los trazos vectoriales encima del fondo
            if (typeof historialTrazos !== 'undefined') {
                historialTrazos.forEach(trazo => {
                    ctxTemp.beginPath();
                    ctxTemp.moveTo(trazo.coordenadaXInicio, trazo.coordenadaYInicio);
                    ctxTemp.lineTo(trazo.coordenadaXFin, trazo.coordenadaYFin);
                    ctxTemp.strokeStyle = trazo.colorTrazo;
                    ctxTemp.lineWidth = trazo.grosorTrazo;
                    ctxTemp.lineCap = 'round';
                    ctxTemp.stroke();
                });
            }

            guardarYRenderizar(canvasTemporal.toDataURL('image/png'), fondoActualBase64);
        };
        imgFondoTemp.src = fondoActualBase64;
    } else {
        // Si no hay imagen de fondo, solo dibujamos los trazos sobre el fondo blanco
        if (typeof historialTrazos !== 'undefined') {
            historialTrazos.forEach(trazo => {
                ctxTemp.beginPath();
                ctxTemp.moveTo(trazo.coordenadaXInicio, trazo.coordenadaYInicio);
                ctxTemp.lineTo(trazo.coordenadaXFin, trazo.coordenadaYFin);
                ctxTemp.strokeStyle = trazo.colorTrazo;
                ctxTemp.lineWidth = trazo.grosorTrazo;
                ctxTemp.lineCap = 'round';
                ctxTemp.stroke();
            });
        }
        guardarYRenderizar(canvasTemporal.toDataURL('image/png'), null);
    }
});

function guardarYRenderizar(imagenUrlFinal, fondoBase64) {
    const nuevoDiseño = {
        imagenUrl: imagenUrlFinal,
        trazos: JSON.parse(JSON.stringify(historialTrazos)),
        fondoBase64: fondoBase64
    };

    listaDiseñosGuardados.push(nuevoDiseño);
    sessionStorage.setItem('pizarra_galeria_disenos', JSON.stringify(listaDiseñosGuardados));
    
    renderizarGaleria();
    panelGaleriaDesplegable.classList.remove('colapsado');
}

renderizarGaleria();