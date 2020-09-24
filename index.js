// library for simple date formatting
const moment = require('moment');
// library to write to google sheet
const GoogleSheetWrite = require('write2sheet');

const {Sportscheck} = require('./plugins/sportscheck')
const {Bergfreunde} = require('./plugins/bergfreunde')

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
// perform all operations
async function get_them() {
  // download page
  const sportscheck = await new Sportscheck().get();
  const bergfreunde = await new Bergfreunde().get();

  // write data to cell
  console.log('Writing to google sheets')
  await write2cell([...sportscheck, ...bergfreunde]);

  console.log('Finished!')
}

// perform operations
// get_them()
get_them()
