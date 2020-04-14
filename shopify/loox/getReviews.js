const fetch = require('node-fetch');
const fs = require('fs').promises;
const $ = require('cheerio');

const getReviewPage = async (url) => {
    console.log('getting page')
    const res = await fetch(url);
    const html = await res.text();
    const reviews = $('.grid-item-wrap', html).toArray().map(x => ({
        id: x.children.filter(x => x.attribs['data-id'] != null)[0].attribs['data-id'],
        user: $('.title', x).text(),
        rating: $('.fa-star', x).length,
        body: $('.main-text', x).text(),
        variant: $('.value', $('.metadata', x)).text()
    }));
    return reviews;
};

(async () => {
    const res = await fetch('https://blendjet.com/products/blendjet-one');
    const html = await res.text()
    const reviewsUrl = html.match(/https:.*?widget\/.*?\//g)[0] + 'reviews/';
    const numReviews = html.match(/data-raters="([0-9]+)/g)[0].match(/([0-9]+)/g)[0];
    const pid = JSON.parse(html.match(/var meta = \{.*\}/g)[0].match(/\{.*\}/g)[0]).product.id;
    const numPages = Math.ceil(numReviews / 20)
    // const numPages = 250;
    let pages = [];
    for(let i = 1; i<=numPages; i++){
        pages.push(i);
    }
    const ress = await Promise.all(pages.map(p => getReviewPage(reviewsUrl + pid + '?page=' + p)));
    const reviews = ress.flat();
    console.log(reviews)
    // await fs.writeFile('shopify/loox/productPage.html', html)
})();