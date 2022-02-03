// library to parse the page's DOM (html)
const cheerio = require('cheerio');

const {PluginBare} = require('../plugin_bare')

class BananaFingers extends PluginBare{
  //
  // Downloads individual pages

  get name() { return 'BananaFingers'; }

  //
  // Downloads individual pages for Sportscheck
  async get() {
    const base = 'https://www.bananafingers.co.uk/category/climbing-shoes?view=grid&f[0]=in_stock%3A1&currency=EUR&country=DE'

    // Get number of pages in epictv
    const buffer = await this.download_html(base);
    const $ = cheerio.load(buffer);
    const len = parseFloat($('.pager-item').last().text()) - 1;

    // build array with links to all pages
    // (this will force initial page to be downloaded again)
    const sites = [base, ...new Array(len).fill(1).map((el, ix) => `${base}&page=${ix + 2}`)]

    return this.get_html(sites, buffer);
  }

  //
  // process the html of a page
  async process(buffer) {

    // load the code to cheerio library
    const $ = cheerio.load(buffer);

    const data = [];
    // extract data for each product and add it to data array
    $('article.node-product-teaser').each((i , el) => {
      const brand = $(el).find('.node-product-teaser__brand').text().trim() ;
      const model = $(el).find('.node-product-teaser__name .product-title').text().trim();
      const categ = 'climbing shoe';
      let price = $(el).find('.node-product-teaser__price .value').text();
      let extra = $(el).find('.discount-percent-badge').text().trim();
      let oos = $(el).find('.node-product-teaser__oos .stock-status-value').text().trim();
      const uri = 'https://www.bananafingers.co.uk' + $(el).find('a').first().prop('href');

      if (oos && oos === 'currently out of stock') {
        return;
      }

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
  BananaFingers
};
