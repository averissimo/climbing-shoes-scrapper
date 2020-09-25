// library to parse the page's DOM (html)
const cheerio = require('cheerio');

const {PluginBare} = require('../plugin_bare')

class EpicTv extends PluginBare{
  //
  // Downloads individual pages for Bergfreunde

  get name() { return 'EpicTv'; }

  async get() {
    const base = 'https://shop.epictv.com/en/category/climbing-shoes?sort_by=field_product_commerce_price_amount_decimal_asc_1&view_mode=grid'

    // Get number of pages in epictv
    const buffer = await this.download_html(base);
    const $ = cheerio.load(buffer);
    const len = parseFloat($('.pager-item').not('.last').last().text());

    // build array with links to all pages
    // (this will force initial page to be downloaded again)
    const sites = [base, ...new Array(len).fill(1).map((el, ix) => `${base}&page=${ix + 1}`)]

    return this._get_html(sites, buffer);
  }

  //
  // process the html of a page
  async process(buffer) {

    // load the code to cheerio library
    const $ = cheerio.load(buffer);

    const data = [];
    // extract data for each product and add it to data array
    $('article').each((i , el) => {
      const brand = $(el).find('.field-name-field-brand .field-item').text().trim() ;
      const model = $(el).find('.field-name-title-field').text().trim();
      const categ = 'climbing shoe';
      let price = $(el).find('.field-type-commerce-price .field-items .price-value').text();
      let extra = $(el).find('.discount-percent-badge').text().trim();
      const uri = 'https://shop.epictv.com/' + $(el).find('.field-type-image .field-item a').prop('href');

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
  EpicTv
};
