const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const { translateText } = require('./translate'); 

const app = express();
const PORT = 3000;
app.set('view engine', 'pug'); 
app.set('views', path.join(__dirname, 'views'))


app.use(cors());
app.use(express.static(path.join(__dirname, 'public'))); 


app.get('/api/departamentos', async (req, res) => {
    try {
        const response = await axios.get('https://collectionapi.metmuseum.org/public/collection/v1/departments');
        res.json(response.data);
    } catch (error) {
        res.status(500).send("Error al recuperar departamentos");
    }
});

app.get('/api/buscar', async (req, res) => {
    const { departamentoId, palabraClave, localidad } = req.query;

    
    let query = `https://collectionapi.metmuseum.org/public/collection/v1/search?`;

    if (departamentoId) {
        query += `departmentId=${departamentoId}&`;
    }
    if (palabraClave) {
        query += `q=${encodeURIComponent(palabraClave)}&`; 
    }
    if (localidad) {
        query += `localization=${encodeURIComponent(localidad)}`; 
    }

    try {
        const response = await axios.get(query);
        const objectIds = response.data.objectIDs?.slice(0, 20) || []; 
        res.json(objectIds);
    } catch (error) {
        res.status(500).send("Error al buscar objetos");
    }
});


app.get('/api/objeto/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const response = await axios.get(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).send("Error al recuperar objeto");
    }
});


app.get('/api/translate', async (req, res) => {
    const { text } = req.query;
    
    if (!text) {
        return res.status(400).send("No se proporcionó texto para traducir.");
    }

    try {
        const translation = await translateText(text); 
        res.json({ translation });
    } catch (error) {
        console.error("Error en la traducción:", error);
        res.status(500).send("Error en la traducción");
    }
});

app.get('/', (req, res) => {
    res.render('index'); 
});


app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});