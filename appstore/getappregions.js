'use strict'
const fetch = require('node-fetch');

(async () => {
    const res = await fetch('https://www.apple.com/choose-country-region/');
    const applereg = await res.text();
    const regions = applereg.match(/schema:url.*?\>/g).map(r => r.split('/')[1]);
    console.log(regions);
})();