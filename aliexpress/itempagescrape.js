const https = require('follow-redirects').https;
const fs = require('fs');

const clean = (data) => {
    try {
        // remove the dangling comma and all redundant stuff after and return
        let cleaned = data.match(/data: \{.*\}/g)[0].replace(/[\n\r]/g, '');
        cleaned = cleaned.substring(6);
        return JSON.parse(cleaned);
    } catch (e) {
        // if Aliexpress schema changes will not crash but return JSON parsing error
        throw Error('AliExpress item redirected to login try again.');
    }
}

const options = {
  'method': 'GET',
  'hostname': 'www.aliexpress.com',
  'path': '/item/33062487437.html',
  'maxRedirects': 20
};

const req = https.request(options, (res) => {
  var chunks = [];

  res.on("data", (chunk) => {
    chunks.push(chunk);
  });

  res.on("end", (chunk) => {
    const body = Buffer.concat(chunks);
    const json = clean(body.toString());
    const skuJson = json.skuModule;
    const priceList = skuJson.skuPriceList;
    const activityPrices = priceList.map(e => e.skuVal.skuAmount);
    let amount = 0;
    priceList.forEach(element => {
        amount += element.skuVal.availQuantity;
    });
    console.log(activityPrices)
  });

  res.on("error", (error) => {
    console.error(error);
  });
});

req.end();