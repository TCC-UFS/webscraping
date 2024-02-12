const fs = require('fs');
const path = require('path');

(async () => {
    const dirLO = "./planalto/lei-ordinaria/data/all/";
    let partialLO = await fs.readdirSync(dirLO);
    let atos = [];
    let errors = [];
    await partialLO.forEach(async filename => {
        let file = require(path.resolve(`${dirLO}${filename}`));
        atos = atos.concat(file.data.atos);
        errors = errors.concat(file.data.errors);
    });
    let result = { data: { atos, errors } }
    console.log(atos.length);
    await fs.writeFileSync(`./planalto/lei-ordinaria/data/mergedResults.json`, JSON.stringify(result, null, 4));
})();