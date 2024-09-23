const translate = require('node-google-translate-skidz');

// Función para traducir texto
function translateText(texto, sourceLang = 'auto', targetLang = 'es') {
    return new Promise((resolve, reject) => {
        translate({
            text: texto,
            source: sourceLang,
            target: targetLang
        }, function(result) {
            if (result && result.translation) {
                resolve(result.translation);
            } else {
                reject('Error al traducir el texto');
            }
        });
    });
}

module.exports = { translateText };