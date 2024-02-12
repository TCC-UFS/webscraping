const atos = require('./data/extractResults.json').data.atos;
const fs = require('fs');

(async () => {
    let final = [];
    for (var i = 0; i < atos.length; i++) {
        try {
            let ato = atos[i];
            let title = ato.title
                            .replaceAll("\n", "")
                            .replaceAll("\t", "")
                            .replaceAll(/\s+/g, " ")
                            .trim();

            let ementa = ato.ementa
                            .replaceAll("\n", "")
                            .replaceAll("\t", "")
                            .replaceAll(/\s+/g, " ")
                            .replaceAll("Mensagem de veto", "")
                            .trim();

            let content = ato.content
                            .replaceAll("\n", "")
                            .replaceAll("\t", "")
                            .replaceAll(/\s+/g, " ")
                            .replaceAll(/\(function\(\)\{.+?\}\(\)\);/g, "")
                            .trim();

            let html = ato.html
                        .replaceAll("\n", "")
                        .replaceAll("\t", "")
                        .replaceAll(/\s+/g, " ")
                        .replaceAll(/<img src=".+?\.gif"/g, "<img src=\"https://www.planalto.gov.br/ccivil_03/LEIS/QUADRO/Brastra.gif\"")
                        .replaceAll(/<a href.+?>|<\/a>/g, "")
                        .replaceAll(/<script.+?(\/script>)/g, "")
                        .trim();

            let data = title.split("de");
            ato.nrAto = parseInt(data[0].replaceAll(/[^\d]/g, "")).toLocaleString("en-us").replace(",", ".");
            
            let dtAto = data[1].trim().split(/\s+/)[0].split(".");
            let dtDay = dtAto[0];
            let dtMonth = dtAto[1];
            let dtYear = dtAto[2];
            let dtFullYear = dtYear;
            if (dtYear.length == 2)
                dtFullYear = parseInt(dtYear) > 24 ? `19${dtYear}` : `20${dtYear}`;
            let date = `${dtFullYear}-${dtMonth}-${dtDay}`;
            ato.dtAto = new Date(date) || new Date("0001-01-01");

            if (data[2] !== undefined) {
                let pubDt = data[2].split(".");
                let pubDtDay = parseInt(pubDt[0]);
                let pubDtMonth = parseInt(pubDt[1]);
                let pubDtYear = parseInt(pubDt[2]);
                let pubDtFullYear = pubDtYear;
                if (pubDtYear.toString().length == 2)
                    pubDtFullYear = pubDtYear > 24 ? `19${pubDtYear}` : `20${pubDtYear}`;
                let pubDate = `${pubDtFullYear}-${pubDtMonth}-${pubDtDay}`;
                ato.dtPubAto = new Date(pubDate) || new Date("0001-01-01");
            }
            else {
                ato.dtPubAto = ato.dtAto;
            }
            
            final.push({
                metadata: {
                    nrAto: ato.nrAto,
                    dtAto: ato.dtAto,
                    dtPubAto: ato.dtPubAto,
                    ementa: ementa
                },
                content: content,
                html: html
            });
        }
        catch (err) {
            console.log(i);
            throw err;
        }
    }

    await fs.writeFileSync("./planalto/lei-complementar/data/finalResults.json", JSON.stringify({ data: final }, null, 4));
    await fs.writeFileSync("./planalto/lei-complementar/data/teste.html", final[15].html);
})();