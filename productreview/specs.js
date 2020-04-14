const fs = require('fs').promises;

(async () => {
    const schema = JSON.parse(await fs.readFile('./productreview/flatvaluesschema.json', 'utf8'));
    console.log(schema)
    const s = () => {
        let list = {};
        for(let key in schema){
            list[key] = schema[key].title;
        }
        return list;
    }
    // const specsMap = schema.map
    // const reviews = JSON.parse(await fs.readFile('./productreview/reviews-jacaranda.json', 'utf8')).reviews;
    // const specs = reviews.filter(r => r.specificationValues != undefined).map(r => r.specificationValues);
    // let title, titleenc, list;
    // const translated = specs.map(s => {
    //     list={};
    //     for(let key in s){
    //         if(s.hasOwnProperty(key)){
    //             list[key] = schema[key].title; 
    //         }
    //     }
    // })
    console.log(s());
})()    