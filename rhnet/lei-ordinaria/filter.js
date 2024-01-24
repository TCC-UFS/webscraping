const atos = require('./data/results.json').data;
const keywords = require('../../utils').keywords;
const fs = require('fs');

(async () => {
    let filtered = [];
    for (var i = 0; i < atos.length; i++) {
        let content = atos[i].content;

        if (keywords.some(keyword => content.toLowerCase().includes(keyword.toLowerCase()))) {
            filtered.push(atos[i]);
            continue
        }
    }

    console.log(filtered.length);
    await fs.writeFileSync("./rhnet/lei-ordinaria/data/filteredResults.json", JSON.stringify({ data: filtered }, null, 4));
})();