const puppeteer = require('puppeteer');
const cheerio = require('cheerio'); 
const ObjectsToCsv = require('objects-to-csv'); 

/*
Example data 
const data = {
    [
        title: "Luca",
        year: "2021", 
        imdbRating: "7.6",
        url: "https://www.imdb.com/title/tt12801262/?pf_rd_m=A2FGELUUNOQJNL&pf_rd_p=ea4e08e1-c8a3-47b5-ac3a-75026647c16e&pf_rd_r=8F1QF07K414MMD7XFN7K&pf_rd_s=center-1&pf_rd_t=15506&pf_rd_i=moviemeter&ref_=chtmvm_tt_1", 
        imgUrl: "https://www.imdb.com/title/tt12801262/mediaviewer/rm3522740225/?ref_=tt_ov_i", 
        plot: "On the Italian Riviera, an unlikely but strong friendship grows between a human being and a sea monster disguised as a human.",
        director: "Enrico Casarosa"
    ]
}
 */

const url = 'https://www.imdb.com/chart/moviemeter/?ref_=nv_mv_mpm'; 

let data = {};

async function imdbScraper (page) {
    await page.goto(url); 
    const html = await page.content();
    const $ = cheerio.load(html); 

    data = $('tr').map((index, element) => {
        // title
        const titleElement = $(element).find('.titleColumn > a');
        const title = $(titleElement).text(); 

        // year
        const yearElement = $(element).find('.titleColumn > span');
        const year = (yearElement).text().replace('(','').replace(')', '');  

        // imdbRating
        const ratingRating = $(element).find('.imdbRating > strong'); 
        const rating = (ratingRating).text(); 

        // url
        const urlElement = $(element).find('.titleColumn > a'); 
        const urlAttr = (urlElement).attr('href'); 
        const url = "http://imdb.com" + urlAttr;

        return { title, year, rating, url };

    }).get(); 
    return data; 
}

async function scrapeMovies(movies, page) {
    for (let i = 1; i < movies.length; i++) {
        await page.goto(movies[i].url);
        const html = await page.content(); 
        const $ = cheerio.load(html);

        const imgUrl = $('.Hero__MediaContentContainer__Video-kvkd64-2.kmTkgc > .Hero__MediaContainer__Video-kvkd64-3.FKYGY > div > .Media__PosterContainer-sc-1x98dcb-1.dGdktI > div > a').attr('href');
        const img = "http://imdb.com" + imgUrl;
        movies[i].img = img; 

        const plot = $('.ipc-overflowText.ipc-overflowText--pageSection.ipc-overflowText--height-long.ipc-overflowText--long.ipc-overflowText--base > .ipc-html-content.ipc-html-content--base > div').text();
        movies[i].plot = plot; 

        const director = $('section.ipc-page-section.ipc-page-section--base.StyledComponents__CastSection-y9ygcu-0.fswvJC.title-cast.title-cast--movie > ul > li:nth-child(1) > div > ul > li > a').text();
        movies[i].director = director; 
    }
    return data = movies; 
}

async function createCsv (data) {
    let csv = new ObjectsToCsv(data); 
    // saving 
    await csv.toDisk('./imdbScraper.csv'); 
}

async function mainScraper() {
    const browser = await puppeteer.launch({ headless: false }); 
    const page = await browser.newPage();
    const movies = await imdbScraper(page); 

    const movieListings = await scrapeMovies(movies, page); 
    console.log(movieListings)

    await createCsv(movieListings); 

    await browser.close(); 
}

mainScraper(); 
