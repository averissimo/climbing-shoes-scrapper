// library to parse the page's DOM (html)
const cheerio = require('cheerio');

const {PluginBare} = require('../plugin_bare')

class Bergfreunde extends PluginBare{
  //
  // Downloads individual pages for Bergfreunde
  async get() {
    console.log('Bergfreunde')
    console.log('  Downloading page 1')
    const buffer1 = await this.download_html('https://www.bergfreunde.eu/climbing-shoes/?_artperpage=96');
    const out1 = await this.process(buffer1);
    console.log(`    page 1 with ${out1.length} items`);

    console.log('  Downloading page 2')
    const buffer2 = await this.download_html('https://www.bergfreunde.eu/climbing-shoes/2/?_artperpage=96');
    const out2 = await this.process(buffer2);
    console.log(`    page 2 with ${out2.length} items`);

    console.log('  Downloading page 3')
    const buffer3 = await this.download_html('https://www.bergfreunde.eu/climbing-shoes/3/?_artperpage=96');
    const out3 = await this.process(buffer3);
    console.log(`    page 3 with ${out3.length} items`);

    console.log('- Bergfreunde -----------------------')
    return [...out1, ...out2, ...out3];
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
      const model = $(el).find('.product-title').text().trim();
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
      data.push({brand, model, category: categ, price: parseFloat(price), extra, url: uri, source: 'bergfreunde'})
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
