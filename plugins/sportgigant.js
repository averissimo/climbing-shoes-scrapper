
// library to parse the page's DOM (html)
const cheerio = require('cheerio');

const {PluginBare} = require('../plugin_bare')

class SportGigant extends PluginBare{
  //
  // Downloads individual pages for Bergfreunde

  get name() { return 'SportGigant'; }

  async get() {
    const base = 'https://sportgigant.at/2707-kletterschuhe'

    // Get number of pages in epictv
    const buffer = await this.download_html(base);

    // build array with links to all pages
    // (this will force initial page to be downloaded again)
    const sites = [base];

    return this.get_html(sites, buffer);
  }

  //
  // process the html of a page
  async process(buffer) {

    // load the code to cheerio library
    const $ = cheerio.load(buffer);

    const data = [];
    // extract data for each product and add it to data array
    $('#sg-product-list .product-list-item-content').each((i , el) => {
      let model = $(el).find('.product-list-item-details h3 a').text().trim();
      const categ = 'climbing shoe';
      let price = $(el).find('.price_box .price').text();
      let extra = $(el).find('.uk-hidden-small p').text().trim();
      const uri = $(el).find('.product-list-item-details h3 a').prop('href');

      let price_down = 0;

      const regex = /(.*) Kletterschuhe? (.*)/;
      const brand = model.replace(regex, '$1');
      model = model.replace(regex, '$2');

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
  SportGigant
};
