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
    const regex = /^[a-zA-Z0-9 ]*$/; 
    return regex.test(input);
}

async function buscarObjetosDeArte(pagina = 1) {
    try {
        const palabraClave = document.getElementById('keyword').value.trim(); 
        const idDepartamento = document.getElementById('department').value;
        const localizacion = document.getElementById('location').value;

        if (palabraClave && !validarEntrada(palabraClave)) {
            alert('Por favor, ingresa solo caracteres alfanuméricos en la palabra clave.');
            return;
        }

        let url = 'https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true';

        if (idDepartamento) {
            url += `&departmentId=${idDepartamento}`;
        }
        if (palabraClave) {
            url += `&q=${encodeURIComponent(palabraClave)}`;
        }
        if (localizacion) {
            url += `&localization=${encodeURIComponent(localizacion)}`;
        }

        const respuesta = await fetch(url);
        if (!respuesta.ok) throw new Error('Error al buscar objetos de arte');

        const datos = await respuesta.json();
        totalObjetos = datos.total; 
        const inicio = (pagina - 1) * itemsPorPagina;

        // Filtrar solo los IDs que tienen imágenes
        const objetosConImagenes = datos.objectIDs.filter(id => id !== null); // Asegurarse de que no haya IDs nulos

        // Limitar a 20 objetos
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
            if (datosObjeto.primaryImage) { // Solo mostrar si hay imagen
                const tarjeta = crearTarjeta(datosObjeto);
                galeria.appendChild(tarjeta);
            }
        } catch (error) {
            console.error(`Error al obtener datos del objeto ${id}:`, error);
            //alert(`Error al cargar la información del objeto con ID ${id}.`);
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
    const titulo = objeto.title || 'Sin título';
    const cultura = objeto.culture || 'Sin cultura';
    const dinastía = objeto.dynasty || 'Sin dinastía';
    tarjeta.innerHTML = `
        <img src="${imagenSrc}" alt="${titulo}" title="Fecha de creación: ${objeto.objectDate || 'Desconocida'}" class="w-full h-48 object-cover rounded-t-lg">
        <h3 class="text-lg font-bold mt-2">${titulo}</h3>
        <p class="text-sm">Cultura: ${cultura}</p>
        <p class="text-sm">Dinastía: ${dinastía}</p>
        <button onclick="mostrarMasImagenes(${objeto.objectID})" class="mt-2 text-blue-500 hover:underline">Ver más imágenes</button>
    `;
    return tarjeta;
}

function actualizarPaginacion(actual) {
    const paginacion = document.getElementById('pagination');
    paginacion.innerHTML = '';
    const totalPaginas = Math.ceil(totalObjetos / itemsPorPagina);
    const maxBotones = 10; 
    const startPage = Math.max(1, actual - Math.floor(maxBotones / 2));
    const endPage = Math.min(totalPaginas, startPage + maxBotones - 1);

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
        botonSiguiente.innerText = 'Siguiente';
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

        // Verificar si hay imágenes adicionales
        if (arrayImagenes.length > 0) {
            ventanaImagenes.document.write("<h1>Imágenes Adicionales</h1>");
            arrayImagenes.forEach(img => {
                ventanaImagenes.document.write(`<img src="${img}" style="width:200px; height:auto; margin:10px;">`);
            });
        } else {
            // Mostrar la imagen principal si no hay imágenes adicionales
            const imagenPrincipal = datosObjeto.primaryImage || 'placeholder-image.png'; // Usar un placeholder si no hay imagen principal
            ventanaImagenes.document.write("<h1>Imagen Principal</h1>");
            ventanaImagenes.document.write(`<img src="${imagenPrincipal}" style="width:400px; height:auto; margin:10px;">`);
        }
    } catch (error) {
        console.error('Error al mostrar imágenes adicionales:', error);
        alert('Error al cargar imágenes adicionales. Por favor, intenta más tarde.');
    }
}

// Cargar departamentos al iniciar
cargarDepartamentos();
