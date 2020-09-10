// library to parse the page's DOM (html)
const cheerio = require('cheerio');
// library to navigate to the page and render javascript
const puppeteer = require('puppeteer');
// library for simple date formatting
const moment = require('moment');
// library to write to google sheet
const GoogleSheetWrite = require('write2sheet');
// library to download html (without processing js)
const bent = require('bent');

// general options
opts = {
  price_top: 1000, // filter prices above this value
  timeout: 240000 // time out for puppeteer, might need to be 0 to disable
}

async function download_html(uri) {
  const getBuffer = bent('buffer');
  return getBuffer(uri);
}

//
// Download page and render all javascript necessary
// this might run forever if timeout is 0
async function download_js(uri, screenshot) {
  // launch chrome instance
  const browser = await puppeteer.launch();
  // start a new page (see puppetter documentation for more info)
  const page = await browser.newPage();
  // Extend the timeout
  page.setDefaultNavigationTimeout(opts.timeout)

  // This alongs with the screenshot makes sure the full page is properly rendered
  await page.setViewport({
    width: 1080,
    height: 10000,
    deviceScaleFactor: 1,
  });

  // navigate to the page
  await page.goto(uri, {timeout: opts.timeout, waitUntil: 'networkidle0'});

  // screenshot full page to make sure all is rendered (even the delayed scroll elements)
  await page.screenshot({path: screenshot, fullPage: true});

  // get html code (body tag)
  let buffer = await page.$eval('body', (element) => {
    return element.innerHTML
  })

  // close chrome instance
  await browser.close();

  // returns html code for body tag
  return buffer;
}
//
// write data to google sheet
async function write2cell(data) {
  // id of google sheet (this might require authorization and a credentials.json file in the same directory)
  const sheet = new GoogleSheetWrite('10pnZL95hek2zTPo8IPnPFlg-5nbpChH9VP3VZW4rP1U');

  // Update date
  const mydate = moment().format('YYYY/MM/DD HH:mm:ss');
  const range = 'gatos_preços!B4';
  sheet.write([[mydate]], range);

  //
  console.log(`Preparing to write ${data.length} rows`);

  // prepare data to write in sheet
  const data_sheet = data.sort((a, b) => a.price - b.price).map(el => [el.source, el.brand, el.model, el.category, el.price, el.extra, el.url]);

  console.log(`Writing ${data_sheet.length} rows...`);

  // write data to sheet
  //  adding 500 lines of empty lines (doing this in one go, instead of 2 writes as second write might not be permanent)
  sheet.write([...data_sheet, ...Array(500).fill(Array(7).fill(''))], 'gatos_preços!B7');
}

//
// process the html of a page
async function process_bergfreunde(buffer) {

  // load the code to cheerio library
  const $ = cheerio.load(buffer);

  const data = [];
  // extract data for each product and add it to data array
  $('#product-list .product-item').each((i , el) => {
    const brand = $(el).find('.manufacturer-title').text().trim() ;
    const model = $(el).find('.product-title').text().trim();
    const categ = 'climbing shoe';
    let price = $(el).find('.product-price .price').not('.uvp').text();
    let extra = $(el).find('.js-special-discount-percent').text().trim();
    const uri = $(el).find('a.product-link').prop('href');

    let price_down = 0;

    try {
      price = parseFloat(price.replace('€ ','').replace('from ', '').replace(',','.'));
    } catch (error) {
      // do nothing
    }

    // add data to array
    data.push({brand, model, category: categ, price: parseFloat(price), extra, url: uri, source: 'bergfreunde'})
  })

  // remove products that have a price above the one defined in options
  // sort from cheapear to most expensive
  return data.filter(el => !(Number(el.price) === el.price) || el.price <= opts.price_top)
    .sort((a, b) => a.price - b.price)
}


//
// process the html of a page
async function process_sportscheck(buffer) {

  // load the code to cheerio library
  const $ = cheerio.load(buffer);

  const data = [];
  // extract data for each product and add it to data array
  $('.productlist-wrapper .productlist-item').each((i , el) => {
    const brand = $(el).find('.productlist-item-brand').text().trim() ;
    const model = $(el).find('.productlist-item-name').text().trim();
    const categ = $(el).find('.productlist-item-category').text().trim();
    let price = $(el).find('.price').not('.price--crossed').find('span').prop('content');
    let extra = $(el).find('.accentuation__container').text().trim();
    const uri = $(el).find('a').prop('href');

    let price_down = 0;

    try {
      price = parseFloat(price);
    } catch (error) {
      // do nothing
    }

    // add data to array
    data.push({brand, model, category: categ, price: parseFloat(price), extra, url: uri, source: 'sportscheck'})
  })

  // remove products that have a price above the one defined in options
  // sort from cheapear to most expensive
  return data.filter(el => el.price <= opts.price_top)
}

//
// perform all operations
async function get_them() {
  // download page
  const sportscheck = await get_sportscheck();
  const bergfreunde = await get_bergfreunde();

  // write data to cell
  console.log('Writing to google sheets')
  await write2cell([...sportscheck, ...bergfreunde]);

  console.log('Finished!')
}

//
// Downloads individual pages for Sportscheck
async function get_sportscheck() {
  console.log('Sportscheck')
  console.log('  Downloading page 1')
  let buffer = await download_js('https://www.sportscheck.com/kletterschuhe/', 'example-1.png');
  // process page
  const out = await process_sportscheck(buffer);
  console.log(`    page 1 with ${out.length} items`);

  console.log('  Downloading page 2')
  let buffer2 = await download_js('https://www.sportscheck.com/kletterschuhe/2/', 'example-1.png');
  const out2 = await process_sportscheck(buffer2);

  console.log(`    page 2 with ${out2.length} items`);
  console.log('- Sportscheck -----------------------')
  return [...out, ...out2];
}

//
// Downloads individual pages for Bergfreunde
async function get_bergfreunde() {
  console.log('Bergfreunde')
  console.log('  Downloading page 1')
  const buffer1 = await download_html('https://www.bergfreunde.eu/climbing-shoes/?_artperpage=96');
  const out1 = await process_bergfreunde(buffer1);
  console.log(`    page 1 with ${out1.length} items`);

  console.log('  Downloading page 2')
  const buffer2 = await download_html('https://www.bergfreunde.eu/climbing-shoes/2/?_artperpage=96');
  const out2 = await process_bergfreunde(buffer2);
  console.log(`    page 2 with ${out2.length} items`);

  console.log('  Downloading page 3')
  const buffer3 = await download_html('https://www.bergfreunde.eu/climbing-shoes/3/?_artperpage=96');
  const out3 = await process_bergfreunde(buffer3);
  console.log(`    page 3 with ${out3.length} items`);

  console.log('- Bergfreunde -----------------------')
  return [...out1, ...out2, ...out3];
}

// perform operations
// get_them()
get_them()
