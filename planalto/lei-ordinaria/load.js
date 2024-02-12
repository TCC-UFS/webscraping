const atos = require('./data/finalResults.json').data;
const axios = require('axios');
const utils = require('../../utils.js');
const fs = require('fs');
const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IntcImlkXCI6MSxcIm5vbWVcIjpcIlNpc3RlbWFcIixcImVtYWlsXCI6XCJzeXN0ZW1AcHJvamV0b3N1ZnMuY2xvdWRcIixcImdydXBvc1wiOlt7XCJpZFwiOjEsXCJub21lXCI6XCJBZG1pblwiLFwicGVybWlzc29lc1wiOlt7XCJpZFwiOjIsXCJyZWN1cnNvXCI6XCJhbGxcIixcInNjb3BlXCI6XCJBbGxcIn1dfV19IiwianRpIjoiMmJiOTg0MDgtYmRhMC00Y2I0LWJjODktNzE4MmE1Mjg4YmU5Iiwicm9sZSI6Ilt7XCJpZFwiOjEsXCJub21lXCI6XCJBZG1pblwiLFwicGVybWlzc29lc1wiOlt7XCJpZFwiOjIsXCJyZWN1cnNvXCI6XCJhbGxcIixcInNjb3BlXCI6XCJBbGxcIn1dfV0iLCJuYmYiOjE3MDc3NTQ0NzEsImV4cCI6MTcwNzg0MDg3MSwiaWF0IjoxNzA3NzU0NDcxfQ.rZQF3E1mJ3PxtkuR3A431ZrZeN9L_3PFuo9-UUxsAFA";

(async () => {
    const api = axios.create({
        baseURL: "https://tccapi.projetosufs.cloud",
        headers: { 
            "Authorization": `Bearer ${jwt}`,
            "Content-Type": "application/json"
        }
    })

    let apiResponse = [];
    let errored = [];

    for (var i = 0; i < atos.length; i++) {
        let metadata = atos[i].metadata;
        let content = atos[i].content;
        let html = atos[i].html;
        var addAto = {
            numero: metadata.nrAto,
            ementa: metadata.ementa,
            dataPublicacao: metadata.dtPubAto || metadata.dtAto,
            dataAto: metadata.dtAto,
            html: html,
            conteudo: content,
            disponivel: true,
            tipoAtoId: 1, // Lei Ordinária
            jurisdicaoId: 1, // Federal BR
        }
        console.log(`[${i+1}/${atos.length}] - ${metadata.nrAto}`);
        await api.post("/api/v1/atos", addAto)
        .then(response => {
            apiResponse.push({ ato: atos[i].metadata.nrAto, statusCode: response.status });
            console.log(response.status);
        })
        .catch(err => {
            console.log(err.response?.status + " - " + err.message);
            apiResponse.push({ ato: atos[i].metadata.nrAto, statusCode: err.status, message: err.message, details: err.response?.data.errors.join("\n") })
            errored.push(atos[i]);
        })
        await utils.wait(0.25);
    }

    await fs.writeFileSync("./planalto/lei-ordinaria/data/loadResults.json", JSON.stringify({ response: apiResponse, errored }, null, 4));
})();