const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const { translateText } = require('./translate'); // Importar la función de traducción

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, 'public'))); // Servir archivos estáticos desde el directorio público

// API endpoint para obtener departamentos
app.get('/api/departamentos', async (req, res) => {
    try {
        const response = await axios.get('https://collectionapi.metmuseum.org/public/collection/v1/departments');
        res.json(response.data);
    } catch (error) {
        res.status(500).send("Error al recuperar departamentos");
    }
});

// API endpoint para buscar objetos de arte
app.get('/api/buscar', async (req, res) => {
    const { departamentoId, palabraClave, localidad } = req.query;

    // Construir la consulta de búsqueda para la API del Museo Metropolitano
    let query = `https://collectionapi.metmuseum.org/public/collection/v1/search?`;

    if (departamentoId) {
        query += `departmentId=${departamentoId}&`;
    }
    if (palabraClave) {
        query += `q=${encodeURIComponent(palabraClave)}&`; // Codificar la palabra clave
    }
    if (localidad) {
        query += `localization=${encodeURIComponent(localidad)}`; // Nombre del parámetro corregido
    }

    try {
        const response = await axios.get(query);
        const objectIds = response.data.objectIDs?.slice(0, 20) || []; // Limitar a 20 objetos
        res.json(objectIds);
    } catch (error) {
        res.status(500).send("Error al buscar objetos");
    }
});

// API endpoint para obtener detalles de un objeto específico
app.get('/api/objeto/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const response = await axios.get(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).send("Error al recuperar objeto");
    }
});

// API endpoint para traducir texto usando la función translateText
app.get('/api/translate', async (req, res) => {
    const { text } = req.query;
    
    if (!text) {
        return res.status(400).send("No se proporcionó texto para traducir.");
    }

    try {
        const translation = await translateText(text); // Llamar a la función de traducción
        res.json({ translation });
    } catch (error) {
        console.error("Error en la traducción:", error);
        res.status(500).send("Error en la traducción");
    }
});

// Servir el archivo index.html para la ruta raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});