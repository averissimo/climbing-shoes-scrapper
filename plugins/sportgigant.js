
// library to parse the page's DOM (html)
const cheerio = require('cheerio');

const {PluginBare} = require('../plugin_bare')

class SportGigant extends PluginBare{
  //
  // Downloads individual pages for Bergfreunde

  get name() { return 'SportGigant'; }

  async get() {
    const base = 'https://sportgigant.at/2707-kletterschuhe/s-76/auf_lager-ja/schuhgrosse-415/schuhgrosse-41/schuhgrosse-405/schuhgrosse-40?order=product.price.asc&resultsPerPage=9999999'

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
    $('#products #js-product-list article').each((i , el) => {
      let model = $(el).find('.product-description .product-title a').text().trim();
      const categ = 'climbing shoe';
      let price = $(el).find('.product-description .product-price-and-shipping .product-price').prop('content');

      let extra = ""; //$(el).find('.uk-hidden-small p').text().trim();
      const uri = $(el).find('.product-description .product-brand a').prop('href');

      let price_down = 0;

      const regex = /(.*) Kletterschuhe? (.*)/;
      let brand = model.replace(regex, '$1');
      model = model.replace(regex, '$2');

      if (brand === undefined || brand.trim() === "") {
        brand = $(el).find('.product-description .product-brand a').text().trim();
      }

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
