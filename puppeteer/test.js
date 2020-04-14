'use strict';
const puppeteer = require('puppeteer');

(async function main() {
    try {
        const browser = await puppeteer.launch();
        const [page] = await browser.pages();
        console.log('about to goto page')
        await page.goto('https://www.kyliecosmetics.com/products/kylie-skin-travel-bag', { waitUntil: 'networkidle2' });
        
        const dimensions = await page.evaluate(() => {
            return {
              width: document.documentElement.clientWidth,
              height: document.documentElement.clientHeight,
              deviceScaleFactor: window.devicePixelRatio
            };
          });

        console.log('got page')
        await page.setViewport({
            width: dimensions.width,
            height: dimensions.height
        })

        console.log('set view')
        await page.screenshot({ path: 'coles.png', fullPage: true });

        await browser.close();
    } catch (err) {
        console.error(err);
        await browser.close();
    }
})();