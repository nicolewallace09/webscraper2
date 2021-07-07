const puppeteer = require('puppeteer'); 
const cheerio = require('cheerio'); 
const ObjectsToCsv = require('objects-to-csv'); 

// GETTING INFORMATION WITHIN SELECTED URL/PAGES EXAMPLE

/* sample of object trying to obtain -- CRAIGSLIST EXAMPLE 
    const data = {
        [
            title: "Technical Autonomous Vehicle Trainer",
            jobDescription: "We're the driverless car company. We're building the world's best autonomous vehicles to safely connect people to the places, things, and experiences they care about.",
            datePosted: "2018-07-13",
            url: "https://sfbay.craigslist.org/sfc/sof/d/technical-autonomous-vehicle/6642626746.html",
            hood: "SOMA / south beach",
            compensation: "23/hr"
        ]
    }
*/

const url = 'https://sfbay.craigslist.org/d/software-qa-dba-etc/search/sof'; 

let data  = {}; 

// scraping information within main page 
async function webScraper (page) {
    await page.goto(url); 
    const html = await page.content();  
    const $ = cheerio.load(html); 

    // mapping through data - ON FRONT PAGE
    data = $('.result-info').map((index, element) => {
        // title 
        const titleElement = $(element).find('.result-title');
        const title = $(titleElement).text(); 
        const url = $(titleElement).attr('href'); 

        // date 
        const dateElement = $(element).find('.result-date'); 
        const datePosted = $(dateElement).attr("datetime"); 

        // hood 
        const hoodElement = $(element).find('.result-hood');
        const hood = $(hoodElement).text().trim().replace('(', '').replace(')', '');

        return { title, url, datePosted, hood };
    }).get();
    return data;  
}


// scraping information within pages - to get jobDescription 
async function scrapeJobs(listings, page) {
    for (let i = 0; i < listings.length; i++) {
        await page.goto(listings[i].url);
        const html = await page.content();
        const $ = cheerio.load(html); 
        
        // getting job description 
        const jobDescription = $('#postingbody').text();
        listings[i].jobDescription = jobDescription;

        // getting comp 
        const compensation = $('p.attrgroup > span:nth-child(1) > b').text();
        listings[i].compensation = compensation; 
    }
    return data = listings; 
}

// limit time of request 
// async function sleep(milliseconds) {
//     return new Promise(resolve => setTimeout(resolve, milliseconds)); 
// }

async function createCsv (data) {
    let csv = new ObjectsToCsv(data);
    // saving to file 
    await csv.toDisk("./webscraper.csv")
}; 

// main function 
async function mainScraper() {
    const browser = await puppeteer.launch({ headless: true }); 
    const page = await browser.newPage(); 
    const listings = await webScraper(page);

    // loop to go through urls 
    // passing through the initial listing arrays & page because we still need to navigate through the page
    const jobListings = await scrapeJobs(listings, page); 
    console.log(jobListings)

    // create csv file 
    await createCsv(jobListings); 

    await browser.close();
}

mainScraper(); 
