const puppeteer = require('puppeteer');
const utils = require('../../utils');
const fs = require('fs');
const retry = require('./retry.json');

(async () => {
    console.log("Starting Application...");
    const browser = await puppeteer.launch({
        headless: false,
        timeout: false,
        protocolTimeout: false,
        args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    
    await page.goto('http://acervo.se.gov.br/easysearch/');
    await page.setViewport({width: 910, height: 800});
    await page.exposeFunction("wait", utils.wait);
    await page.exposeFunction("log", console.log);
    await page.exposeFunction("time", console.time);
    await page.exposeFunction("timeEnd", console.timeEnd);
    await page.exposeFunction("writeFile", fs.writeFileSync);
    
    utils.wait(0.5);
    
    await page.evaluate(async (retry) => {
        var errors = []
        var pageResults = []
        
        try {
            const startPage = 1; // Default: 1
            const finishPage = 0; // Default: 0
            const firstPageRow = 0; // Default: 0

            log("Showing 'results per page' dropdown");
            await document.querySelectorAll("div.GPFMNGWNP")[4].children[17].children[0].click();
            log("Seting 100 results per page.");
            await document.querySelectorAll("div.GPFMNGWMFC")[0].children[5].children[0].click();
            log("Showing list from 'Secretaria de Estado de Governo'");
            await wait(0.8)
            await document.querySelectorAll("div.GPFMNGWBLB")[0].children[1].children[0].children[1].click();
            log("Selects 'Lei Ordinária' filter");
            await wait(0.8)
            await document.querySelectorAll("div.GPFMNGWBLB")[0].children[1].children[1].children[1].children[0].children[4].click();
            await wait(0.8)
            
            var pages = document.querySelectorAll("div.GPFMNGWNP")[4].children[7].textContent.split(' ')[1];
            const pressEnterEvent = new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, which: 13 });

            log("\n------------------------------\n      'Leis Ordinárias'      \n------------------------------");
            if (startPage !== 1) {
                document.querySelectorAll("div.GPFMNGWNP")[4].children[6].value = startPage;
                document.querySelectorAll("div.GPFMNGWNP")[4].children[6].dispatchEvent(pressEnterEvent)
                await wait(1);
            }

            time("\nExtraction Completed in");
            for (var i = startPage-1; i < parseInt(pages) && (finishPage === 0 || i < finishPage); i++) {
                try {
                    time(`Extraction from Page ${i+1} completed in`);
                    log(`\nStarting extraction from Page ${i+1}.`);
                    let results = await document.querySelectorAll("div.GPFMNGWLHC")[2].children[0].children[1].children[0].children[0].children[0].children[0].children;
                    wait(0.2);

                    let startRow = 0;
                    if (i === startPage-1) startRow = firstPageRow;

                    let atos = [];
                    for(var j = startRow; j < results.length; j++) {
                        try {
                            let res = results[j];
                            let data = res.children[0].children[1];
                            let size = data.children.length;

                            let metadata;
                            try {
                                metadata = {
                                    dtAto: data.children[size-6].children[1].textContent,
                                    dtPubAto: data.children[size-5].children[1].textContent,
                                    nrAto: data.children[size-3].children[1].textContent,
                                    ementa: data.children[size-2].children[1].textContent,
                                }
                            }
                            catch(err) {
                                throw new Error(`Error colecting metadata. ${err.message}`);
                            }

                            let fileUri;
                            try {
                                fileUri = data.children[2].children[0].children[0].href;
                            }
                            catch(err) {
                                throw new Error(`Error colecting fileUri. ${err.message}`);
                            }

                            try {
                                data.children[0].children[2].children[0].children[0].children[0].click();
                                await wait(0.25);
                            }
                            catch(err) {
                                throw new Error(`Error to show details. ${err.message}`);
                            }
                            
                            let okBtnIndex = 15;
                            if (!document.querySelector("pre")) {
                                okBtnIndex = 16;
                                try {
                                    await document.querySelectorAll("table.GPFMNGWDN")[13].children[0].children[0].children[0].children[0].click();
                                    await wait(0.25);
                                }
                                catch(err) {
                                    throw new Error(`Error to show Content <pre>. ${err.message}`);
                                }
                            }
                            
                            let content = await document.querySelector("pre").textContent;
                            await wait(0.25);

                            atos.push({
                                metadata,
                                fileUri,
                                content
                            })
                            try {
                                await document.querySelectorAll("table.GPFMNGWDN")[okBtnIndex].children[0].children[0].children[0].children[0].click();
                            }
                            catch(err) {
                                throw new Error(`Error to close Details. ${err.message}`);
                            }

                            // LOG ROWS
                            log({ row: j, ato: metadata.nrAto, content: content.length });
                        }
                        catch (err) {
                            let errMsg = `Error on page ${i+1}, row ${j}.\n${err.message}`;
                            errors.push(errMsg);
                            log(errMsg);
                        }
                    }

                    pageResults = pageResults.concat(atos);
                    timeEnd(`Extraction from Page ${i+1} completed in`);
                    await writeFile(`./easysearch/lei-ordinaria/data/backup-pages/p${i+1}.json`, JSON.stringify({ errors, atos }, null, 4));

                    if (i+1 !== parseInt(pages)) {
                        await document.querySelectorAll("div.GPFMNGWNP")[4].children[9].children[0].children[0].children[0].children[1].click()
                        await wait(1);
                    }
                }
                catch (err) {
                    let errMsg = `Error on page ${i+1}.\n${err.message}`;
                    errors.push(errMsg);
                    log(errMsg);
                }
            }
            timeEnd("\nExtraction Completed in");
            return { pageResults, errors }
        }
        catch (err) {
            log(`\nApplication Crashed!\n${err.message}`);
            await writeFile("./easysearch/lei-ordinaria/data/backup.json", JSON.stringify({ errors, pageResults }, null, 4));
            throw err;
        }
    }, (retry))
    .then(async response => {
        let results = { data: response.pageResults };
        let errors = { data: response.errors };

        let resultsJSON = JSON.stringify(results, null, 4);
        let errorsJSON = JSON.stringify(errors, null, 4);

        await fs.writeFileSync('./easysearch/lei-ordinaria/data/results.json', resultsJSON);
        await fs.writeFileSync('./easysearch/lei-ordinaria/data/errors.json', errorsJSON);
    })
    .catch(err => {
        throw err;
    });

    console.log('All results saved!');
    await browser.close();
})();