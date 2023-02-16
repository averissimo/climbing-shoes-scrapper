// library to parse the page's DOM (html)
const cheerio = require('cheerio');

const {PluginBare} = require('../plugin_bare')

class BananaFingers extends PluginBare{
  //
  // Downloads individual pages

  get name() { return 'BananaFingers'; }

  // https://bananafingers.com/footwear/climbing-shoes?view=grid&f[0]=in_stock%3A1&currency=EUR&country=DE
  // Downloads individual pages for Sportscheck
  async get() {
    const base = 'https://bananafingers.com/footwear/climbing-shoes?product_list_limit=36&stock=1&view=grid'

    // Get number of pages in epictv
    const buffer = await this.download_html(base);
    const $ = cheerio.load(buffer);

    // const len = parseFloat($('.pages-items .item .page span:not(.pages-item-next)').last().text()) - 1;
    const len = Math.ceil(parseFloat($(".toolbar .toolbar-amount .toolbar-number").last().text()) / 36) - 1;

    // build array with links to all pages
    // (this will force initial page to be downloaded again)
    const sites = [base, ...new Array(len).fill(1).map((el, ix) => `${base}&p=${ix + 2}`)]

    return this.get_html(sites, buffer);
  }

  //
  // process the html of a page
  async process(buffer) {

    // load the code to cheerio library
    const $ = cheerio.load(buffer);

    const data = [];
    // extract data for each product and add it to data array
    $('.products.list.items.product-items .item.product.product-item .product-item-info').each((i , el) => {
      let brand = $(el).find('.product-item-name').text().trim() ;
      const model = $(el).find('.product-item-name').text().trim();
      const categ = 'climbing shoe';
      let price = $(el).find('.price-wrapper').prop("data-price-amount");
      let extra = ""

      const uri = $(el).find('a.product-item-link').first().prop('href');

      const brands = [
        'EB', 'Black Diamond', 'Butora', 'Red Chilly', 'Unparallel', 'La Sportiva', 'Scarpa', 'Ocun', 'Tenaya', 'Five[- ]?Ten',
        'Boreal', 'Evolv', 'Andrea Boldrini'
      ].join("|");

      brand = brand.replace(new RegExp(`(${brands}).*`, 'i'), '$1');

      let price_down = 0;

      try {
        price = parseFloat(price.replace('€ ','').replace('from ', '').replace(',','.')) * 1.13; // Conversion from pounds to euro
      } catch (error) {
        // do nothing
      }
      
      const roundAccurately = (number, decimalPlaces) => Number(Math.round(number + "e" + decimalPlaces) + "e-" + decimalPlaces)

      // add data to array
      data.push({brand, model, category: categ, price: roundAccurately(parseFloat(price), 2), extra, url: uri, source: this.name.toLowerCase()})
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
