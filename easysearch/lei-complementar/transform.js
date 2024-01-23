const atos = require('./data/filteredResults.json').data;
const fs = require('fs');

(async () => {
    for (var i = 0; i < atos.length; i++) {
        let content = atos[i].content;
        content = content.split(/(\n+)/).join(" ").split(/\s+/).join(" ");
        atos[i].content = content;
    }
    
    await fs.writeFileSync("./easysearch/lei-complementar/data/finalResults.json", JSON.stringify({ data: atos }, null, 4));
})();