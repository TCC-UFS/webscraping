const URI = "https://www4.planalto.gov.br/legislacao/portal-legis/legislacao-1/leis-ordinarias";

const puppeteer = require('puppeteer');
const utils = require('../../utils');
const keywords = require('../../utils').keywords;
const fs = require('fs');

var errors = [];
var atos = [];
var currentI = 0;
var currentJ = 0;
var currentK = 1;
var lawCount = 0;
const startYearLine = 0;
const startInYear = 0;
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

    let yearLines = await page.$$("#parent-fieldname-text > p");
    console.time("Extracted all data");
    console.log("Starting Extraction.");
    for (var i = startYearLine; i < yearLines.length;  i++) {
        currentI = i;
        try {
            if (i != 0) {
                yearLines = await page.$$("#parent-fieldname-text > p");
            }

            let years = await yearLines[i].$$("a");

            console.time(`\nYear Line ${i} finished`);
            console.log(`\nStarting Year Line ${i}`);
            for (let j = startInYear; j < years.length; j++) {
                let navigationFowarded = false;
                currentJ = j;
                try {
                    if (j != 0) {
                        yearLines = await page.$$("#parent-fieldname-text > p");
                        years = await yearLines[i].$$("a");
                    }

                    let currentYear = await page.evaluate(el => el.textContent, years[j]);
                    
                    years[j].click();
                    navigationFowarded = true;
                    try {
                        await page.waitForNavigation({waitUntil: "domcontentloaded"});
                    }
                    catch(error) {console.log(error.message)}
                    let laws = await page.$$("tr");

                    while (laws.length === 0) {
                        await utils.wait(1);
                        laws = await page.$$("tr");
                    }

                    lawCount = lawCount + (laws.length-1);
                    console.log(laws.length-1);
                    console.time(`Year ${currentYear} finished`);
                    console.log(`\nStarting Year ${currentYear}. Count ${lawCount}`);
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
                            }

                            page.goBack();
                            lawFowarded = false;
                            try {
                                await page.waitForNavigation({waitUntil: "domcontentloaded"});
                            }
                            catch(error) {console.log(error.message)}
                        }
                        catch (err) {
                            errors.push(`Error in Law. i${currentI}, j${currentJ}, k${currentK}. ${err.message}`);
                            console.log(`Error in Law. i${currentI}, j${currentJ}, k${currentK}. Count ${lawCount}. ${err.message}`);
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
                    console.timeEnd(`Year ${currentYear} finished`);
                    await fs.writeFileSync(`./planalto/lei-ordinaria/data/extractResults-${currentYear.split(/\s+/).join("_")}.json`, JSON.stringify({ data: { atos, errors } }, null, 4));
                    atos = [];
                    errors = [];
                    page.goBack();
                    try {
                        await page.waitForNavigation({waitUntil: "domcontentloaded"});
                    }
                    catch(error) {console.log(error.message)}
                    navigationFowarded = false;
                }
                catch (err) {
                    errors.push(`Error in Year. i${currentI}, j${currentJ}, k${currentK}. ${err.message}`);
                    console.log(`Error in Year. i${currentI}, j${currentJ}, k${currentK}. Count ${lawCount}. ${err.message}`);
                    if (navigationFowarded) {
                        navigationFowarded = false;
                        page.goBack();
                        try {
                            await page.waitForNavigation({waitUntil: "domcontentloaded"});
                        }
                        catch(error) {console.log(error.message)}
                    }
                }
            }
            console.timeEnd(`\nYear Line ${i} finished`);
        }
        catch (err) {
            errors.push(`Error in YearLines. i${currentI}, j${currentJ}, k${currentK}. ${err.message}`);
            console.log(`Error in YearLines. i${currentI}, j${currentJ}, k${currentK}. Count ${lawCount}. ${err.message}`);
        }
    }

    console.timeEnd("Extracted all data");
    browser.close();
}

try {
    (async () => {
        await extract();
        console.log(`Count ${lawCount}`);
    })();
}
catch (err) {
    errors.push(`Error in Function. i${currentI}, j${currentJ}, k${currentK}. ${err.message}`);
    console.log(`Error in Function. i${currentI}, j${currentJ}, k${currentK}. Count ${lawCount}. ${err.message}`);
}