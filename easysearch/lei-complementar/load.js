const atos = require('./data/finalResults.json').data;
const axios = require('axios');
const utils = require('../../utils.js');
const FormData = require('form-data');
const fs = require('fs');

const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IntcImlkXCI6MSxcIm5vbWVcIjpcIlNpc3RlbWFcIixcImVtYWlsXCI6XCJzeXN0ZW1AcHJvamV0b3N1ZnMuY2xvdWRcIixcImdydXBvc1wiOlt7XCJpZFwiOjEsXCJub21lXCI6XCJBZG1pblwiLFwicGVybWlzc29lc1wiOlt7XCJpZFwiOjIsXCJyZWN1cnNvXCI6XCJhbGxcIixcInNjb3BlXCI6XCJBbGxcIn1dfV19IiwianRpIjoiYzE1YTFiM2ItY2ZjYi00YTEzLTlkY2YtNTMxZWIzYzEwOTQ1Iiwicm9sZSI6Ilt7XCJpZFwiOjEsXCJub21lXCI6XCJBZG1pblwiLFwicGVybWlzc29lc1wiOlt7XCJpZFwiOjIsXCJyZWN1cnNvXCI6XCJhbGxcIixcInNjb3BlXCI6XCJBbGxcIn1dfV0iLCJuYmYiOjE3MDYxMzM4MjcsImV4cCI6MTcwNjIyMDIyNywiaWF0IjoxNzA2MTMzODI3fQ.KLmDOu5ilY1C60Ce8zMhubRXQXfeD3FrpCjjM5xJbxc";

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
    const api = axios.create({
        baseURL: "https://tccapi.projetosufs.cloud",
        headers: { 
            "Authorization": `Bearer ${jwt}`,
        }
    });

    let apiResponse = [];
    let errored = [];
    let ignored = [];
    for (var i = 0; i < atos.length; i++) {
        if (i === 0 || i === 1)
            continue;
        let fileUri = atos[i].fileUri;
        
        if (!fileUri) {
            ignored.push(atos[i]);
            continue;
        }

        let metadata = atos[i].metadata;

        if (!["282"].includes(metadata.nrAto))
            continue;

        console.log(`[${i+1}/${atos.length}] - ${metadata.nrAto}`);
        let content = atos[i].content;
        var dt = metadata.dtAto.toString().split("/").join("-");
        var fileName = btoa(metadata.nrAto + "_" + dt + "_" + i);
        var filePath = `./easysearch/lei-complementar/data/pdf/${fileName}.pdf`;
        console.log("downloading...");
        await axios({
            method: 'get',
            url: fileUri,
            responseType: 'stream',
        }).then(response => {
            response.data.pipe(fs.createWriteStream(filePath));
        });
        console.log("file downloaded!");
        
        let dtAux = metadata.dtPubAto.split("/");
        metadata.dtPubAto = `${dtAux[2]}-${dtAux[1]}-${dtAux[0]}`;
        dtAux = metadata.dtAto.split("/");
        metadata.dtAto = `${dtAux[2]}-${dtAux[1]}-${dtAux[0]}`;

        var file = fs.createReadStream(filePath);
        const form = new FormData();
        form.append("numero", metadata.nrAto);
        form.append("ementa", metadata.ementa);
        form.append("dataPublicacao", metadata.dtPubAto);
        form.append("dataAto", metadata.dtAto);
        form.append("conteudo", content);
        form.append("disponivel", 'true');
        form.append("tipoAtoId", '2');
        form.append("jurisdicaoId", '2');
        form.append("file", file);

        console.log('uploading...');
        await api.post("/api/v1/atos/files", form)
        .then(response => {
            apiResponse.push({ row: i, ato: atos[i].metadata.nrAto, statusCode: response.status });
        })
        .catch(err => {
            apiResponse.push({ row: i, ato: atos[i].metadata.nrAto, statusCode: err.response?.status, message: err.message, details: err.response?.data.errors })
            errored.push(atos[i]);
        })
        console.log('uploaded!');
        await utils.wait(3);
    }
    
    await fs.writeFileSync("./easysearch/lei-complementar/data/loadResults.json", JSON.stringify({ response: apiResponse, ignored, errored }, null, 4));
})();