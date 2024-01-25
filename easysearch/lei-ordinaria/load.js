// const atos = require('./data/finalResults.json').data;
const atosIgnored = require('./data/ignored.json').ignored;
const axios = require('axios');
const utils = require('../../utils.js');
const FormData = require('form-data');
const fs = require('fs');

const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IntcImlkXCI6MSxcIm5vbWVcIjpcIlNpc3RlbWFcIixcImVtYWlsXCI6XCJzeXN0ZW1AcHJvamV0b3N1ZnMuY2xvdWRcIixcImdydXBvc1wiOlt7XCJpZFwiOjEsXCJub21lXCI6XCJBZG1pblwiLFwicGVybWlzc29lc1wiOlt7XCJpZFwiOjIsXCJyZWN1cnNvXCI6XCJhbGxcIixcInNjb3BlXCI6XCJBbGxcIn1dfV19IiwianRpIjoiYzE1YTFiM2ItY2ZjYi00YTEzLTlkY2YtNTMxZWIzYzEwOTQ1Iiwicm9sZSI6Ilt7XCJpZFwiOjEsXCJub21lXCI6XCJBZG1pblwiLFwicGVybWlzc29lc1wiOlt7XCJpZFwiOjIsXCJyZWN1cnNvXCI6XCJhbGxcIixcInNjb3BlXCI6XCJBbGxcIn1dfV0iLCJuYmYiOjE3MDYxMzM4MjcsImV4cCI6MTcwNjIyMDIyNywiaWF0IjoxNzA2MTMzODI3fQ.KLmDOu5ilY1C60Ce8zMhubRXQXfeD3FrpCjjM5xJbxc";

(async () => {
    atos = atosIgnored;
    const api = axios.create({
        baseURL: "https://tccapi.projetosufs.cloud",
        headers: { 
            "Authorization": `Bearer ${jwt}`,
        }
    });

    let apiResponse = [];
    let errored = [];
    for (var i = 0; i < atos.length; i++) {

        let fileUri = atos[i].fileUri;
        
        if (!fileUri) {
            continue;
        }
        let metadata = atos[i].metadata;

        console.log(`[${i+1}/${atos.length}] - ${metadata.nrAto}`);
        let content = atos[i].content;
        var dt = metadata.dtAto.toString().split("/").join("-");
        var fileName = btoa(metadata.nrAto + "_" + dt + "_" + i);
        var filePath = `./easysearch/lei-ordinaria/data/pdf/${fileName}.pdf`;
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
        form.append("tipoAtoId", '1');
        form.append("jurisdicaoId", '2');
        form.append("file", file);

        console.log('uploading...');
        await api.post("/api/v1/atos/files", form)
        .then(response => {
            apiResponse.push({ row: i, ato: atos[i].metadata.nrAto, statusCode: response.status });
            console.log(response.status);
        })
        .catch(err => {
            console.log(err.response?.status || err.message);
            apiResponse.push({ row: i, ato: atos[i].metadata.nrAto, statusCode: err.response?.status, message: err.message, details: err.response?.data.errors })
            errored.push(atos[i]);
        })
        console.log('uploaded!');
        await utils.wait(3);
    }
    
    await fs.writeFileSync("./easysearch/lei-ordinaria/data/loadResults.json", JSON.stringify({ response: apiResponse, errored }, null, 4));
})();