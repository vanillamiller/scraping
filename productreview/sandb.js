const fs = require('fs').promises;


(async () => {
    const something = await fs.readFile('./productreview/reviewspecificrating.json', 'utf8');
    const json = JSON.parse(something);
    console.log(json.collection[0].body);
})()