const results = require("./data/results.json");
const keywords = require("../../utils.js").keywords;
const fs = require('fs');

(async () => {
    let filtered = [];
    for(i = 0; i < results.data.length; i++) {
        let ato = results.data[i];
        
        if (keywords.some(keyword => ato.metadata.ementa.toLowerCase().includes(keyword.toLowerCase()))) {
            filtered.push(ato);
            continue;
        }

        if (keywords.some(keyword => ato.content.toLowerCase().includes(keyword.toLowerCase()))) {
            filtered.push(ato);
            continue
        }
    }

    console.log(filtered.length);
    await fs.writeFileSync("./easysearch/lei-complementar/data/filteredResults.json", JSON.stringify({ data: filtered }, null, 4));
})();