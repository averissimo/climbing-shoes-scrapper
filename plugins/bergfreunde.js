// library to parse the page's DOM (html)
const cheerio = require('cheerio');

const {PluginBare} = require('../plugin_bare')

class Bergfreunde extends PluginBare{

  get name() { return 'Bergfreunde'; }

  async get() {
    const base = 'https://www.bergfreunde.eu/climbing-shoes'

    // Get number of pages in epictv
    const buffer = await this.download_html(base + '/?_artperpage=96');
    const $ = cheerio.load(buffer);
    const len = parseFloat($('.paging .locator-item').last().text());

    // build array with links to all pages
    // (this will force initial page to be downloaded again)
    const sites = [base, ...new Array(len - 1).fill(1).map((el, ix) => `${base}/${ix + 2}`)]
      .map(el => el + '/?_artperpage=96')

    return this.get_html(sites, buffer);
  }

  //
  // process the html of a page
  async process(buffer) {

    // load the code to cheerio library
    const $ = cheerio.load(buffer);

    const data = [];
    // extract data for each product and add it to data array
    $('#product-list .product-item').each((i , el) => {
      const brand = $(el).find('.manufacturer-title').text().trim() ;
      const model = $(el).find('.product-title').text().trim().replace("\n", " // ");
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
      data.push({brand, model, category: categ, price: parseFloat(price), extra, url: uri, source: this.name.toLowerCase()})
    })

    // remove products that have a price above the one defined in options
    // sort from cheapear to most expensive
    return data.filter(el => !(Number(el.price) === el.price) || el.price <= opts.price_top)
      .sort((a, b) => a.price - b.price)
  }
}

module.exports = {
  Bergfreunde
};
