const URI = "https://rhnet.sead.am.gov.br/legislacao-estadual/?type=consulta&xsl_file=consulta_ato.xsl&xsl_base=13&proc_name=pkg_textual.ResultadoConsulta&ora_piBase=13&ora_piRegistrosPagina=25&ora_psQueryID=AABOeaAAIAABrPNAAA&ora_piPagina=4&ora_psSigla=LEI&ora_psNumero=&ora_psAno=&ora_psOrgao=&ora_psTexto=&action=send_for";

const puppeteer = require('puppeteer');
const utils = require('../../utils');
const fs = require('fs');

(async () => {
    console.log("Starting Application...");
    const browser = await puppeteer.launch({
        headless: false,
        timeout: false,
        protocolTimeout: false,
        args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    
    await page.goto(URI);
    await page.setViewport({width: 1080, height: 800});
    await page.exposeFunction("wait", utils.wait);
    await page.exposeFunction("log", console.log);
    await page.exposeFunction("time", console.time);
    await page.exposeFunction("timeEnd", console.timeEnd);
    await page.exposeFunction("writeFile", fs.writeFileSync);
    
    utils.wait(0.5);
    
    await page.evaluate(async () => {
        var errors = []
        var atos = [];

        try {
            log("Listing Types");
            await document.querySelector("div#advanced-search").children[2].children[1].children[0].click();
            await wait(0.1);
            
            log("Select 'Lei Ordinária'");
            await document.querySelector("div#accordion-2").children[0].children[4].children[0].click();

            log("Search");
            await document.querySelector("button.custon-button-29").click();
            await wait(2);
            
            var total = await document.querySelector("p.title-count-itens-found").textContent.split(' ')[2];
            log(`${total} results found.`);

            // Click on first result
            await document.querySelectorAll("a.p-item-link")[1].click();
            await wait(2);

            log("\n------------------------------\n      'Leis Ordinárias'      \n------------------------------");
            
            var count = 1;
            var law = "";
            time("\nExtraction Completed in");
            for(var i = 1; i < parseInt(total); i++) {
                try {
                    count = i;
                    while (Object.values(document.querySelector("div.overlay-30c45P34l4j46").classList).some(attr => attr === 'show'))
                         await wait(0.025);

                    law = await document.querySelector("h6.search-nav-bar-title").textContent;
                        
                    let html = await document.querySelector("exibedocumento").innerHTML;
                    let content = await document.querySelector("exibedocumento").textContent;
                    let ementa = await document.querySelector("p.ementaAto")?.textContent;
                    
                    atos.push({
                        header: law,
                        ementa,
                        html,
                        content
                    });
                    
                    if (i < parseInt(total)-1)
                        await document.querySelector("a.page-link.next-item").click();
                    
                    let current = i.toLocaleString("en-us", { minimumIntegerDigits: 4 }).split(',').join('');
                    log(`[${current}/${total}] - ${law}`);

                    await wait(0.2);
                }
                catch (err) {
                    let errMsg = `Error on row ${count}. '${law}'.\n${err.message}`;
                    errors.push(errMsg);
                    log(errMsg);
                    if (i < parseInt(total)-1)
                        await document.querySelector("a.page-link.next-item").click();
                }
            }
            timeEnd("\nExtraction Completed in");

            return { errors, atos }
        }
        catch (err) {
            log(`\nApplication Crashed!\n${err.message}`);
            if (atos.length > 1) {
                await writeFile("./rhnet/lei-ordinaria/data/backup.json", JSON.stringify({ errors, atos }, null, 4));
            }
            throw err;
        }
    })
    .then(async response => {
        let results = { data: response.atos };
        let errors = { data: response.errors };

        let resultsJSON = JSON.stringify(results, null, 4);
        let errorsJSON = JSON.stringify(errors, null, 4);

        await fs.writeFileSync('./rhnet/lei-ordinaria/data/results.json', resultsJSON);
        await fs.writeFileSync('./rhnet/lei-ordinaria/data/errors.json', errorsJSON);
    })
    .catch(err => {
        throw err;
    });

    console.log('All results saved!');
    await browser.close();
})();