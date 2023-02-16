// library to parse the page's DOM (html)
const cheerio = require('cheerio');

const {PluginBare} = require('../plugin_bare')

class Bergzeit extends PluginBare{
  //
  // Downloads individual pages for Bergfreunde

  get name() { return 'Bergzeit'; }

  //
  // Downloads individual pages for Sportscheck
  async get() {
    const url = "https://www.bergzeit.at/outlet/schuhe/kletterschuhe/?filter.article_size=34.5&filter.article_size=35&filter.article_size=35.5&filter.article_size=36&filter.article_size=36.5&filter.article_size=39&filter.article_size=39.5&filter.article_size=40&filter.article_size=40.5&filter.article_size=41&filter.article_size=41.5&filter.article_size=42&filter.article_size=42.5&sortBy=price"
    return this.get_js([url + '&pgNr=1'])
  }

  //
  // process the html of a page
  async process(buffer) {

    // load the code to cheerio library
    const $ = cheerio.load(buffer);

    const data = [];
    // extract data for each product and add it to data array
    $('.products-list .products-list__element').each((i , el) => {
      const brand = $(el).find('.product-box-content__brand').text().trim() ;
      const model = $(el).find('.product-box-content__name').text().trim();
      const categ = $(el).find('.productlist-item-category').text().trim();
      let price = $(el).find('.product-box-content__price').text().trim();
      let extra = "";
      const uri = "https://www.bergzeit.at/" + $(el).find('a.product-box.products-list__product-box').prop('href');

      let price_down = 0;

      try {
        price = parseFloat(price);
      } catch (error) {
        // do nothing
      }

      // add data to array
      data.push({brand, model, category: categ, price: parseFloat(price), extra, url: uri, source: this.name.toLowerCase()})
    })

    // remove products that have a price above the one defined in options
    // sort from cheapear to most expensive
    return data.filter(el => el.price <= opts.price_top)
  }
}

module.exports = {
  Bergzeit
};
