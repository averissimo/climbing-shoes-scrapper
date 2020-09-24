// library to parse the page's DOM (html)
const cheerio = require('cheerio');

const {PluginBare} = require('../plugin_bare')

class Sportscheck extends PluginBare{
  //
  // process the html of a page
  async process(buffer) {

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
  // Downloads individual pages for Sportscheck
  async get() {
    console.log('Sportscheck')
    console.log('  Downloading page 1')
    let buffer = await this.download_js('https://www.sportscheck.com/kletterschuhe/', 'example-1.png');
    // process page
    const out = await this.process(buffer);
    console.log(`    page 1 with ${out.length} items`);

    console.log('  Downloading page 2')
    let buffer2 = await this.download_js('https://www.sportscheck.com/kletterschuhe/2/', 'example-1.png');
    const out2 = await this.process(buffer2);

    console.log(`    page 2 with ${out2.length} items`);
    console.log('- Sportscheck -----------------------')
    return [...out, ...out2];
}
}

module.exports = {
  Sportscheck
};
