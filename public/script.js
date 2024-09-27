let paginaActual = 1;
const itemsPorPagina = 20;
let totalObjetos = 0;


async function cargarDepartamentos() {
    try {
        const respuesta = await fetch('https://collectionapi.metmuseum.org/public/collection/v1/departments');
        if (!respuesta.ok) throw new Error('Error al cargar departamentos');
        const departamentos = await respuesta.json();
        const selectDepartamento = document.getElementById('department');
        departamentos.departments.forEach(departamento => {
            const opcion = document.createElement('option');
            opcion.value = departamento.departmentId;
            opcion.textContent = departamento.displayName;
            selectDepartamento.appendChild(opcion);
        });
    } catch (error) {
        console.error(error);
        alert('Error al cargar los departamentos. Por favor, intenta más tarde.');
    }
}

document.getElementById('searchBtn').addEventListener('click', () => {
    paginaActual = 1;
    buscarObjetosDeArte(paginaActual);
});

function validarEntrada(input) {
    const regex = /^[a-zA-Z0-9 *]*$/;
    return regex.test(input);
}

async function buscarObjetosDeArte(pagina = 1) {
    try {
        const palabraClave = document.getElementById('keyword').value.trim();
        const idDepartamento = document.getElementById('department').value;
        const localizacion = document.getElementById('location').value.trim();


        if (!palabraClave && !idDepartamento && !localizacion) {
            alert('Por favor, completa al menos uno de los campos: palabra clave, departamento o localización.');
            return;
        }


        if (palabraClave && !validarEntrada(palabraClave)) {
            alert('Por favor, ingresa solo letras y números en la palabra clave.');
            return;
        }

        let url = 'https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true';


        if (idDepartamento) {
            url += `&departmentId=${idDepartamento}`;
        }


        const palabraParaQ = palabraClave || 'art';
        url += `&q=${encodeURIComponent(palabraParaQ)}`;

        if (localizacion) {
            url += `&localization=${encodeURIComponent(localizacion)}`;
        }

        console.log("URL de búsqueda:", url);

        const respuesta = await fetch(url);
        if (!respuesta.ok) throw new Error('Error al buscar objetos de arte');

        const datos = await respuesta.json();

        if (datos.total === 0) {
            alert('No se encontraron objetos que coincidan con la búsqueda.');
            return;
        }

        totalObjetos = datos.total;
        const inicio = (pagina - 1) * itemsPorPagina;


        const objetosConImagenes = datos.objectIDs ? datos.objectIDs.filter(id => id !== null) : [];


        const objetos = objetosConImagenes.slice(inicio, inicio + itemsPorPagina);

        mostrarObjetosDeArte(objetos);
        actualizarPaginacion(pagina);
        mostrarPaginacionTotal(totalObjetos);
    } catch (error) {
        console.error(error);
        alert('Error al recuperar objetos de arte. Por favor, intenta más tarde.');
    }
}


async function mostrarObjetosDeArte(objetos) {
    const galeria = document.getElementById('gallery');
    galeria.innerHTML = '';

    for (let id of objetos) {
        try {
            const datosObjeto = await obtenerDatosObjeto(id);
            if (datosObjeto.primaryImage) {

                const tituloTraducido = await traducirTexto(datosObjeto.title || 'Sin título');
                const descripcionTraducida = await traducirTexto(datosObjeto.description || 'Sin descripción');
                const culturaTraducida = await traducirTexto(datosObjeto.culture || 'Sin cultura');
                const dinastiaTraducida = await traducirTexto(datosObjeto.dynasty || 'Sin dinastía');

                const tarjeta = crearTarjeta({
                    ...datosObjeto,
                    title: tituloTraducido,
                    description: descripcionTraducida,
                    culture: culturaTraducida,
                    dynasty: dinastiaTraducida
                });

                galeria.appendChild(tarjeta);
            }
        } catch (error) {
            console.error(`Error al obtener datos del objeto ${id}:`, error);

        }
    }
}

async function obtenerDatosObjeto(idObjeto) {
    try {
        const respuesta = await fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${idObjeto}`);
        if (!respuesta.ok) throw new Error('Error al cargar datos del objeto');
        return await respuesta.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

function crearTarjeta(objeto) {
    const tarjeta = document.createElement('div');
    tarjeta.classList.add('card', 'border', 'rounded-lg', 'shadow-md', 'p-4', 'bg-white', 'm-3');

    const imagenSrc = objeto.primaryImage || 'placeholder-image.png';
    tarjeta.innerHTML = `
        <img src="${imagenSrc}" alt="${objeto.title}" title="Fecha de creación: ${objeto.objectDate || 'Desconocida'}" class="w-full h-48 object-cover rounded-t-lg">
        <h3 class="text-lg font-bold mt-2">${objeto.title}</h3>
        <h5class="text-sm">Cultura: ${objeto.culture || 'Sin cultura'}</h5>
        <h5 class="text-sm">Dinastía: ${objeto.dynasty || 'Sin dinastía'}</h3>
        
       <button onclick="mostrarMasImagenes(${objeto.objectID})" class="mt-2 text-blue-500 hover:underline">Ver más imágenes</button>
    `;

    return tarjeta;
}


function actualizarPaginacion(actual) {
    const paginacion = document.getElementById('pagination');
    paginacion.innerHTML = '';
    const totalPaginas = Math.ceil(totalObjetos / itemsPorPagina);
    const maxBotones = 5;
    const startPage = Math.max(1, actual - Math.floor(maxBotones / 2));
    const endPage = Math.min(totalPaginas, startPage + maxBotones - 1);

   
    if (actual > 1) { 
        const botonAnterior = document.createElement('button');
        botonAnterior.innerText = 'Ant'; 
        botonAnterior.addEventListener('click', () => {
            paginaActual = actual - 1; 
            buscarObjetosDeArte(paginaActual);
        });
        paginacion.appendChild(botonAnterior);
    }

    
    for (let i = startPage; i <= endPage; i++) {
        const botonPagina = document.createElement('button');
        botonPagina.innerText = i;
        botonPagina.disabled = (i === actual);
        botonPagina.addEventListener('click', () => {
            paginaActual = i;
            buscarObjetosDeArte(i);
        });
        paginacion.appendChild(botonPagina);
    }

   
    if (endPage < totalPaginas) {
        const botonSiguiente = document.createElement('button');
        botonSiguiente.innerText = 'Sig'; 
        
        botonSiguiente.addEventListener('click', () => {
            paginaActual = endPage + 1; 
            buscarObjetosDeArte(paginaActual);
        });
        paginacion.appendChild(botonSiguiente);
    }
}

function mostrarPaginacionTotal(total) {
    const paginacion = document.getElementById('pagination');
    const textoPaginacion = `Mostrando ${(itemsPorPagina * (paginaActual - 1) + 1)}-${Math.min(itemsPorPagina * paginaActual, total)} de ${total}`;
    paginacion.insertAdjacentHTML('afterbegin', `<p>${textoPaginacion}</p>`);
}

async function mostrarMasImagenes(idObjeto) {
    try {
        const datosObjeto = await obtenerDatosObjeto(idObjeto);
        const arrayImagenes = datosObjeto.additionalImages || [];
        const ventanaImagenes = window.open("", `Imágenes Adicionales - ID ${idObjeto}`, "width=800,height=600");

      
        ventanaImagenes.document.write(`
            <html>
                <head>
                    <link rel="stylesheet" type="text/css" href="styles.css"> 
                </head>
                <body class="popup-body">
        `);

        if (arrayImagenes.length > 0) {
            ventanaImagenes.document.write("<h1>Imágenes Adicionales</h1>");
            ventanaImagenes.document.write('<div class="image-container">'); 
            arrayImagenes.forEach(img => {
                ventanaImagenes.document.write(`<img src="${img}" class="popup-image">`);
            });
            ventanaImagenes.document.write('</div>'); 
        } else {
            const imagenPrincipal = datosObjeto.primaryImage || 'placeholder-image.png';
            ventanaImagenes.document.write("<h1>Imágenes Adicionales</h1>");
            ventanaImagenes.document.write(`<img src="${imagenPrincipal}" style="max-width:350px;">`);
        }

      
        ventanaImagenes.document.write(`
            <button class="close-button" onclick="window.close();">Cerrar</button>
        `);

       
        ventanaImagenes.document.write(`
                </body>
            </html>
        `);

        ventanaImagenes.document.close();
        
     } catch (error) {
         console.error('Error al mostrar imágenes adicionales:', error);
         alert('Error al cargar imágenes adicionales. Por favor, intenta más tarde.');
     }
}

async function traducirTexto(texto, sourceLang = 'en', targetLang = 'es') {
    try {
        const response = await fetch(`/api/translate?text=${encodeURIComponent(texto)}&source=${sourceLang}&target=${targetLang}`);
        if (!response.ok) throw new Error("Error al traducir el texto");
        const data = await response.json();
        return data.translation;
    } catch (error) {
        console.error("Error en la traducción:", error);
        return texto;
    }
}


cargarDepartamentos();