const rqn = require('request-promise-native');
const fs = require('fs').promises;
const url = 'https://www.productreview.com.au/listings/jacaranda-finance';

(async () => {
    const page = await rqn(url);
    let raw = page.match(/"flatReviewSpecificationsSchema\\":\{.*invisibleEntryItemViewSpecifications/g)[0];
    raw = '"' + raw.substring(34, raw.length-39) + '"' ;
    const json = JSON.parse(JSON.parse(raw));
    
    await fs.writeFile('./productreview/flatvaluesschema.json',json);
    console.log(json[0])
})()