const fetch = require('node-fetch');
const fs = require('fs').promises;
const baseUrl = 'https://www.kyliecosmetics.com';
const genUrl = (ext) => `${baseUrl}${ext}`;
const genCollExt = (coll) => coll ? `/collections/${coll}` : '/collections';
// const genProdExt = (prod) => prod ? `/products/${prod}` : '/products';
const batchSize = 250;


const getItemJson = async ext => {
    const res = await fetch(baseUrl + ext + '.js');
    return JSON.parse(await res.text());
}

const batchGetItems = async itemLinks => {

    const mod = itemLinks.length % batchSize;
    console.log('mod', mod)
    const numBatches = mod > 0 ? Math.ceil(itemLinks.length / batchSize) : itemLinks.length / batchSize;
    console.log('num',numBatches)
    let items = [];
    const maxRetries = 5;
    let retries = 0;
    let first, last;
    let batch;

    for (let i = 1; i <= numBatches && retries <= maxRetries; i++) {
        first = (i - 1) * batchSize;
        console.log('batch', i);
        if (i < numBatches) {
            last = i * batchSize-1;
            batch = itemLinks.slice(first, last)
            console.log(batch)
            items.push(... await Promise.all(batch.map(l => getItemJson(l))));
        } else {
            if (mod > 0) {
                console.log("in final")
                last = first + mod -1;
                console.log('first', first);
                console.log('last', last);
                console.log('final links', itemLinks);
                batch = itemLinks.slice(first, last);
                items.push(... await Promise.all(batch.map(l => getItemJson(l))));
            } else {
                last = i * batchSize;
                batch = itemLinks.slice(first, last)
                items.push(... await Promise.all(batch.map(l => getItemJson(l))));
            }
        }
    }
    console.log('item length on exit', items.length)
    return items;
};

(async () => {
    const res = await fetch(genUrl(genCollExt('all')));
    const collPage = await res.text();
    const hasPages = collPage.match(/collections\/all\?page=/g) != null;
    console.log(hasPages);
    let jsons;
    if (hasPages) {
        let hasNextPage = true;
        let currPageNum = 1;
        let currPage = collPage;
        let items = [];
        while (hasNextPage) {
            console.log('page', currPageNum);
            let collLinks = [
                ...new Set(currPage.match(/href=".*?\/products.*?"/g)
                    .map(l => l.substring(6, l.length - 1).replace(' ', '').split('?')[0]))
            ];
            console.log('collLinks', collLinks.length);
            if (collLinks > batchSize) {
                items.push(... await batchGetItems(collLinks));
            } else {
                items.push(... await Promise.all(collLinks.map(l => getItemJson(l))));
            }
            hasNextPage = currPage.match(new RegExp(`collections/all\\?page=${currPageNum + 1}`, 'g')) != null;
            console.log(hasNextPage)
            if (hasNextPage)
                currPageNum++;
                currPage = await fetch(genUrl(genCollExt(`all?page=${currPageNum}`)));
                currPage = await currPage.text();
        }
        jsons = { items: items };
    } else {
        const collLinks = [
            ...new Set(collPage.match(/href=".*?\/products.*?"/g)
                .map(l => l.substring(6, l.length - 1).replace(' ', '').split('?')[0]))
        ];
        console.log('collLinks', collLinks);

        if (collLinks.length > batchSize) {
            jsons = { items: await batchGetItems(collLinks) }
        } else {
            jsons = { items: await Promise.all(collLinks.map(l => getItemJson(l))) };
        }
    }
    await fs.writeFile('./shopify/kjTestJson.json', JSON.stringify(jsons));
    console.log('num items scraped', jsons.items.length);

    
})();