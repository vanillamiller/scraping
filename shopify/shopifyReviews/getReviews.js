const fetch = require('node-fetch');
const $ = require('cheerio');

const getReviewPage = async (page, pid, shop) => {
    const reviewsRes = await fetch(`https://productreviews.shopifycdn.com/proxy/v4/reviews?page=${page}&product_id=${pid}&shop=${shop}`);
    const rawReviews = (await reviewsRes.json()).reviews;
    return processReviewPage(rawReviews);
}

const processReviewPage = (raw) => {
    return $('.spr-review', raw).toArray().map(r => ({
        id: r.attribs['id'].match(/([0-9]+)/)[0],
        user: $('.spr-review-header-byline', r).text().split(' on ')[0],
        rating: $('.spr-icon-star', r).length,
        body: $('.spr-review-content-body', r).text(),
        date: $('.spr-review-header-byline', r).text().split(' on ')[1],
    }))
}


(async () => {
    const res = await fetch('https://fitnessfreedomgear.com/products/the-classic-fitness-pack');
    const itemPage = await res.text();
    const numReviews = itemPage.match(/reviewCount.*?([0-9]+)/g)[0].match(/([0-9]+)/g)[0];
    const shop = itemPage.match(/productreviews.shopifycdn.com.*?"/g)[0].match(/shop=.*/g)[0].slice(5, -1);
    const pid = JSON.parse(itemPage.match(/var meta = \{.*\}/g)[0].match(/\{.*\}/g)[0]).product.id;
    const reviewsRes = await fetch(`https://productreviews.shopifycdn.com/proxy/v4/reviews?page=1&product_id=${pid}&shop=${shop}`);
    const reviewsHTML = (await reviewsRes.json()).reviews;
    const reviewsPerPage = $('.spr-review', reviewsHTML).length
    const numPages = Math.ceil(numReviews / reviewsPerPage);
    let pages = [];
    for (let i = 2; i <= numPages; i++) {
        pages.push(i);
    }
    const reviews = await Promise.all(pages.map(p => getReviewPage(p, pid, shop)))
    console.log(reviews)
})();