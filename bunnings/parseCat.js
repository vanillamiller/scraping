const fs = require('fs').promises;


(async () => {
    const rawCat = await fs.readFile('./bunnings/cat.json', 'utf8')
    let json = JSON.parse(rawCat);
    json.Response = JSON.parse(json.Response);
    console.log(json.Response.match);
    
})()