const atos = require('./data/filteredResults.json').data;
const fs = require('fs');

(async () => {
    let months = { 
        "janeiro": "01",
        "fevereiro": "02",
        "março": "03",
        "marco": "03",
        "abril": "04",
        "maio": "05",
        "junho": "06",
        "julho": "07",
        "agosto": "08",
        "setembro": "09",
        "outubro": "10",
        "novembro": "11",
        "dezembro": "12"
    }
    let final = [];
    for (var i = 0; i < atos.length; i++) {
        let ato = atos[i];
        let header = atos[i].header.split(/\s+/);

        let content = ato.content
            .split("/\n+/").join(" ")
            .split(/\s+/).join(" ");

        ato.nrAto = header[2].replace(',', '');
        let dtDay = header[4];
        let dtMonth = header[6].toLowerCase();
        let dtYear = header[8];
        let date = `${dtYear}-${months[dtMonth]}-${dtDay}`;
        ato.dtAto = new Date(date) || new Date("0001-01-01");
        ato.dtPubAto = ato.dtAto;

        final.push({
            metadata: {
                nrAto: ato.nrAto,
                dtAto: ato.dtAto,
                dtPubAto: ato.dtPubAto,
                ementa: ato.ementa
            },
            html: ato.html,
            content: content
        });
    }

    await fs.writeFileSync("./rhnet/lei-ordinaria/data/finalResults.json", JSON.stringify({ data: final }, null, 4));
})();