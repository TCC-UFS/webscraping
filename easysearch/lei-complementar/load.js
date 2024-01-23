const atos = require('./data/finalResults.json').data;
const axios = require('axios');
const utils = require('../../utils.js');
const jwt = "";

const api = axios.create({
    baseURL: "https://tccapi.projetosufs.cloud/",
    headers: { 
        "Authorization": `Bearer ${jwt}`,
        "Content-Type": "application/json"
    }
})

/*  ----- CONTRACT -----
    {
        "numero": "string",
        "ementa": "string",
        "dataPublicacao": "2024-01-23T00:32:56.022Z",
        "dataAto": "2024-01-23T00:32:56.022Z",
        "caminhoArquivo": "string",
        "conteudo": "string",
        "html": "string",
        "disponivel": true,
        "tipoAtoId": 0,
        "jurisdicaoId": 0,
        "createdById": 0
    }
*/

(async () => {
    let apiResponse = [];
    let errored = [];
    for (var i = 0; i < atos.length; i++) {
        let metadata = atos[i].metadata;
        let content = atos[i].content;
        let fileUri = atos[i].fileUri;
        var addAto = {
            numero: metadata.nrAto,
            ementa: metadata.ementa,
            dataPublicacao: metadata.dtPubAto,
            dataAto: metadata.dtAto,
            caminhoArquivo: fileUri,
            conteudo: content,
            disponivel: true,
            tipoAtoId: 2, // Lei Complementar
            jurisdicaoId: 2, // Sergipe
            createdById: 1 // Sistema 
        }
        await api.post("/api/v1/atos", addAto)
        .then(response => {
            apiResponse.push({ ato: atos[i].metadata.nrAto, statusCode: response.status });
        })
        .catch(err => {
            apiResponse.push({ ato: atos[i].metadata.nrAto, statusCode: err.status, message: err.message })
            errored.push(atos[i]);
        })
        await utils.wait(0.25);
    }
})();