const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the public directory

// API endpoint to get departments
app.get('/api/departamentos', async (req, res) => {
    try {
        const response = await axios.get('https://collectionapi.metmuseum.org/public/collection/v1/departments');
        res.json(response.data);
    } catch (error) {
        res.status(500).send("Error al recuperar departamentos");
    }
});

// API endpoint to search for art objects
app.get('/api/buscar', async (req, res) => {
    const { departamentoId, palabraClave, localidad } = req.query;

    // Build the search query for the Metropolitan Museum API
    let query = `https://collectionapi.metmuseum.org/public/collection/v1/search?`;

    if (departamentoId) {
        query += `departmentId=${departamentoId}&`;
    }
    if (palabraClave) {
        query += `q=${encodeURIComponent(palabraClave)}&`; // Encode the keyword
    }
    if (localidad) {
        query += `localization=${encodeURIComponent(localidad)}`; // Corrected parameter name
    }

    try {
        const response = await axios.get(query);
        const objectIds = response.data.objectIDs?.slice(0, 20) || []; // Limit to 20 objects
        res.json(objectIds);
    } catch (error) {
        res.status(500).send("Error al buscar objetos");
    }
});

// API endpoint to get details of a specific object
app.get('/api/objeto/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const response = await axios.get(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).send("Error al recuperar objeto");
    }
});

// Serve the index.html file for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});