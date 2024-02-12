const URI = "https://www4.planalto.gov.br/legislacao/portal-legis/legislacao-1/leis-complementares-1/todas-as-leis-complementares-1";

const puppeteer = require('puppeteer');
const utils = require('../../utils');
const keywords = require('../../utils').keywords;
const fs = require('fs');

var errors = [];
var atos = [];
var currentK = 1;
var lawCount = 0;
var collected = 0;
const startInLaw = 1;

async function extract() {
    console.log("Starting Application...");
    const browser = await puppeteer.launch({
        headless: "new",
        timeout: false,
        protocolTimeout: false,
        args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    
    await page.goto(URI);
    await page.setViewport({width: 1080, height: 800});
    await page.waitForNavigation();
    
    utils.wait(0.5);

    console.time("Extracted all data");
    console.log("Starting Extraction.");
    try {
        let laws = await page.$$("tr");

        while (laws.length === 0) {
            await utils.wait(1);
            laws = await page.$$("tr");
        }

        lawCount = lawCount + (laws.length-1);
        console.log(`${laws.length-1} results on this page.`);
        var analyzed = 0;
        for (let k = startInLaw; k < laws.length; k++) {
            let lawFowarded = false;
            currentK = k;
            try {
                if (k != 1) {
                    laws = await page.$$("tr");
                }

                let law = await laws[k].$$("td");

                let title = await page.evaluate(el => el.textContent, law[0]);
                let ementa = await page.evaluate(el => el.textContent, law[1]);
                
                let link = await law[0].$("a");
                link.click();
                lawFowarded = true;
                try {
                    await page.waitForNavigation({waitUntil: "domcontentloaded"});
                }
                catch(error) {}

                let content = await page.$eval('body', el => el.textContent);
                let html = await page.$eval('body', el => el.innerHTML);

                analyzed++;
                if (keywords.some(keyword => content.toLowerCase().includes(keyword.toLowerCase()))) {
                    atos.push({
                        title,
                        ementa,
                        content,
                        html
                    });
                    collected++;
                }

                page.goBack();
                lawFowarded = false;
                try {
                    await page.waitForNavigation({waitUntil: "domcontentloaded"});
                }
                catch(error) {console.log(error.message)}
            }
            catch (err) {
                errors.push(`Error in Law. k${currentK}. ${err.message}`);
                console.log(`Error in Law. k${currentK}. Count ${lawCount}. ${err.message}`);
                if (lawFowarded) {
                    lawFowarded = false;
                    page.goBack();
                    try {
                        await page.waitForNavigation({waitUntil: "domcontentloaded"});
                    }
                    catch(error) {console.log(error.message)}
                }
            }
        }
        console.log(`${analyzed} laws analyzed`);
        await fs.writeFileSync(`./planalto/lei-complementar/data/extractResults.json`, JSON.stringify({ data: { atos, errors } }, null, 4));
    }
    catch (err) {
        errors.push(`Error initializing. k${currentK}. ${err.message}`);
        console.log(`Error initializing. k${currentK}. Count ${lawCount}. ${err.message}`);
    }

    console.timeEnd("Extracted all data");
}

try {
    (async () => {
        await extract();
        console.log(`Count ${lawCount}\nCollected: ${collected}`);
    })();
}
catch (err) {
    errors.push(`Error in Function. k${currentK}. ${err.message}`);
    console.log(`Error in Function. k${currentK}. Count ${lawCount}. ${err.message}`);
}