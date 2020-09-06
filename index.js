// library to parse the page's DOM (html)
const cheerio = require('cheerio');
// library to navigate to the page and render javascript
const puppeteer = require('puppeteer');
// library for simple date formatting
const moment = require('moment');
// library to write to google sheet
const GoogleSheetWrite = require('write2sheet');

// general options
opts = {
  price_top: 1000, // filter prices above this value
  timeout: 240000 // time out for puppeteer, might need to be 0 to disable
}

//
// Download page and render all javascript necessary
// this might run forever if timeout is 0
async function download_js() {
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
  await page.goto('https://www.sportscheck.com/kletterschuhe/', {timeout: opts.timeout, waitUntil: 'networkidle0'});

  // screenshot full page to make sure all is rendered (even the delayed scroll elements)
  await page.screenshot({path: 'example.png', fullPage: true});

  await page.waitForNavigation({
    waitUntil: 'networkidle0',
  });

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

  // remove existing data in table
  sheet.write(Array(200).fill(Array(6).fill('')), 'gatos_preços!B7');

  console.log(`Preparing to write ${data.length} rows`);

  // prepare data to write in sheet
  const data_sheet = data.map(el => [el.brand, el.model, el.category, el.price, el.extra, el.url]);

  // write data to sheet
  sheet.write(data_sheet, 'gatos_preços!B7');
}

//
// process the html of a page
async function process(buffer) {

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
    data.push({brand, model, category: categ, price: parseFloat(price), extra, url: uri})
  })

  // remove products that have a price above the one defined in options
  // sort from cheapear to most expensive
  return data.filter(el => el.price <= opts.price_top)
    .sort((a, b) => a.price - b.price)
}

//
// perform all operations
async function get_them() {
  // download page
  let buffer = await download_js();
  console.log('buffer', buffer)
  // process page
  const out = await process(buffer);
  console.log('out', out);
  // write data to cell
  await write2cell(out);
}

// perform operations
get_them()
