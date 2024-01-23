const fs = require('fs');
const path = require('path');

(async () => {
    const dirLO = "./easysearch/lei-ordinaria/data/backup-pages/";
    let partialLO = await fs.readdirSync(dirLO);
    let atos = [];
    await partialLO.forEach(async filename => {
        let file = require(path.resolve(`${dirLO}${filename}`));
        atos = atos.concat(file.atos);
    });
    let result = { data: atos }
    await fs.writeFileSync(`./easysearch/lei-ordinaria/data/mergedResults.json`, JSON.stringify(result, null, 4));
})();