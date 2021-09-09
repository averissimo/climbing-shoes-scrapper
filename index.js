// library for simple date formatting
const moment = require('moment');
// library to write to google sheet
const GoogleSheetWrite = require('write2sheet');
const puppeteer = require('puppeteer');

const {PluginBare} = require('./plugin_bare')

const {Sportscheck} = require('./plugins/sportscheck');
const {Bergfreunde} = require('./plugins/bergfreunde');
const {EpicTv} = require('./plugins/epictv');
const {BananaFingers} = require('./plugins/banana_fingers');
const {SportGigant} = require('./plugins/sportgigant');
const {Trekkin} = require('./plugins/trekkin');

//
// write data to google sheet
async function write2cell(data) {
  // id of google sheet (this might require authorization and a credentials.json file in the same directory)
  const sheet = new GoogleSheetWrite('10pnZL95hek2zTPo8IPnPFlg-5nbpChH9VP3VZW4rP1U');
  const sheet2 = new GoogleSheetWrite('1WQkXtQO-m9E3gKpTNtsDX6Esdajhnekt0bh1GeN_eQ4');
  console.log('');
  console.log('Writing to google sheets...')
  console.log('');

  // Update date
  const mydate = moment().format('YYYY/MM/DD HH:mm:ss');
  sheet.write([[mydate]], 'gatos_preços!B4');
  sheet2.write([[mydate]], 'All!B4');

  //
  console.log(`Preparing to write ${data.length} rows`);

  // prepare data to write in sheet
  const data_sheet = data.sort((a, b) => a.price - b.price).map(el => [el.source, el.brand, el.model, el.category, el.price, el.extra, el.url]);

  console.log(`Writing ${data_sheet.length} rows...`);

  // write data to sheet
  //  adding 500 lines of empty lines (doing this in one go, instead of 2 writes as second write might not be permanent)
  sheet.write([...data_sheet, ...Array(500).fill(Array(7).fill(''))], 'gatos_preços!B7');
  sheet2.write([...data_sheet, ...Array(500).fill(Array(7).fill(''))], 'All!B7');

  return;
}

//
// perform all operations
async function get_them() {
  PluginBare.browser = await puppeteer.launch();
  // download page
  console.log('Downloading pages...');
  console.log('  this might take a while with data sources that need to run javascript');
  console.log('    (example: sportscheck)');
  console.log('');
  const results = await Promise.all([
    new Sportscheck().get(),
    new Bergfreunde().get(),
    new BananaFingers().get(),
    new SportGigant().get(),
    new Trekkin().get(),
    new EpicTv().get()
  ]);
  await PluginBare.browser.close();

  console.log("Writing to google docs", results.flat().length);
  // write data to cell
  await write2cell(results.flat());

  console.log('Finished!')
  return;
}

// new EpicTv().get()
// perform operations
// get_them()
get_them().then(console.log).catch(console.error);
