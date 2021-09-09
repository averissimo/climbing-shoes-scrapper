// library to parse the page's DOM (html)
const cheerio = require('cheerio');

const {PluginBare} = require('../plugin_bare')

class Trekkin extends PluginBare{

  get name() { return 'Trekkin'; }

  //
  // Downloads individual pages for Sportscheck
  async get() {
    const results = await this.get_js(['https://www.trekkinn.com/outdoor-wandern/damenschuhe-kletterschuhe/14278/s']);
    return results;
  }

  //
  // process the html of a page
  async process(buffer) {
    // load the code to cheerio library
    const $ = cheerio.load(buffer);

    const data = [];
    // extract data for each product and add it to data array
    $('.productos .singleBoxMarcaCarrusel').each((i , el) => {
      const brand = $(el).find('.BoxImage a').last().prop('data-ta-product-brand');
      const model = $(el).find('.BoxImage a').last().prop('data-ta-product-name');
      const categ = 'climbing shoe';
      let price = $(el).find('.BoxPriceValor').text();
      let extra = '';
      const uri = 'https://www.trekkinn.com' + $(el).find('a').last().prop('href');

      let price_down = 0;

      try {
        price = parseFloat(price);
      } catch (error) {
        // do nothing
      }

      // add data to array
      data.push({brand, model, category: categ, price: parseFloat(price), extra, url: encodeURI(uri), source: this.name.toLowerCase()})
    })

    // remove products that have a price above the one defined in options
    // sort from cheapear to most expensive
    return data.filter(el => el.price <= opts.price_top)
  }
}

module.exports = {
  Trekkin
};
