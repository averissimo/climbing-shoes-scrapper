// library to navigate to the page and render javascript
const puppeteer = require('puppeteer');

// library to download html (without processing js)
const bent = require('bent');

// general options
opts = {
  price_top: 1000, // filter prices above this value
  timeout: 240000 // time out for puppeteer, might need to be 0 to disable
}

class PluginBare {

  get name() { return 'This must be defined!!'; }

  async get() {
      throw new Error('Method must be implemented');
  }

  async process(buffer) {
      throw new Error('Method must be implemented');
  }

  // Worker method that is implemented for html pages
  // Should be called via _get_html or _get_js
  async _get(sites, buffer0, fun) {
    const self = this;
    const out = sites.map(async (el, ix) => {
      console.log(`[${self.name}] Downloading page ${ix + 1}`);
      const buffer1 = (ix === 0 && buffer0) ? buffer0 : await fun(el, ix);
      const out1 = await self.process(buffer1);
      console.log(`[${self.name}] page ${ix + 1} with ${out1.length} items`);
      return out1;
    })
    const result = await Promise.all(out);
    console.log(`[${this.name}] End -----------------------`);
    return result.flat();
  }

  // Worker method that is implemented for html pages
  async _get_html(sites, buffer0) {
    return this._get(sites, buffer0, this.download_html);
  }

  // Worker method that is implemented for html pages
  async _get_js(sites, buffer0) {
    return this._get(sites, buffer0, this.download_js);
  }

  async download_html(uri) {
    const getBuffer = bent('buffer');
    return getBuffer(uri);
  }

  //
  // Download page and render all javascript necessary
  // this might run forever if timeout is 0
  async download_js(uri, screenshotIx) {
    const screenshot = `example-${screenshotIx}.png`
    // launch chrome instance
    const browser = await puppeteer.launch();
    // start a new page (see puppetter documentation for more info)
    const page = await browser.newPage();
    // Extend the timeout
    page.setDefaultNavigationTimeout(opts.timeout)

    // This alongs with the screenshot makes sure the full page is properly rendered
    await page.setViewport({
      width: 1080,
      height: 10000,
      deviceScaleFactor: 1,
    });

    // navigate to the page
    await page.goto(uri, {timeout: opts.timeout, waitUntil: 'networkidle0'});

    // screenshot full page to make sure all is rendered (even the delayed scroll elements)
    await page.screenshot({path: screenshot, fullPage: true});

    // get html code (body tag)
    let buffer = await page.$eval('body', (element) => {
      return element.innerHTML
    })

    // close chrome instance
    await browser.close();

    // returns html code for body tag
    return buffer;
  }
}

module.exports = {
  PluginBare
};
