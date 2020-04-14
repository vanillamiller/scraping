const rp = require('request-promise-native');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const $ = require('cheerio');

const Yotpo = ({
    initialize: async function (url) {
        const req = await fetch(url);
        const page = await req.text();
        this.app_key = page.match(/staticw2.yotpo.com\/.*?\/widget.js/g)[0].split('/')[1];
        const yotpoWidget = page.match(/<div class="yotpo yotpo-main-widget[\s\S]+?<\/div>/g)[0];
        this.pid = yotpoWidget.match(/data-product-id="([0-9]+)/g)[0].match(/([0-9]+)/g)[0];
        console.log(`initialized for`, url)
        return this;
    },
    getNumReviews: async function () {
        const res = await rp.post(`https://w2.yotpo.com/batch/${this.app_key}`).form({
            app_key: this.app_key,
            methods: `[{ 
                "method": 
                    "rich_snippet", 
                "params": { 
                    "pid": ${this.pid}
                } 
            }]`
        });
        const json = JSON.parse(res.slice(1, res.length - 1));
        const numReviews = json.result.match(/reviewCount.*([0-9]+)/g)[0].match(/([0-9]+)/g)[0];
        return numReviews;
    },
    pid: null,
    app_key: null,
    getReviews: async function () {
        const numReviews = await this.getNumReviews();
        const res = await rp.post('https://staticw2.yotpo.com/batch').form(
            {
                methods: `[{"method":"reviews","params":{"pid":${this.pid},"order_metadata_fields":{},"page":1,"host-widget":"embedded","per_page":${numReviews},"is_mobile":false}}]`,
                app_key: this.app_key,
            }
        )
        return this.processReviews(JSON.parse(res.slice(1, res.length - 1)).result)
    },
    processReviews: async function (raw) {
        const reviewDivs = $('.yotpo-review', raw);
        return await Promise.all(reviewDivs.toArray().map(x => (this.transformReview(x))));
    },
    transformReview: async function (x) {
        return {
            id: x.attribs['data-review-id'],
            user: $('.yotpo-user-name', x).text(),
            rating: $('.yotpo-icon-star', x).length,
            body: $('.content-review', x).text(),
            date: $('.yotpo-review-date', x).toArray()[0].children[0].data,
            upvotes: $('.vote-sum', x).toArray().filter(a => a.attribs['data-type'] === 'up')[0].children[0].data,
            downvotes: $('.vote-sum', x).toArray().filter(a => a.attribs['data-type'] === 'down')[0].children[0].data,
        }
    }
});


(async () => {
    const y = await Yotpo.initialize('https://shop.bulletproof.com/collections/all/products/vanilla-shortbread-collagen-protein-bar-12-pack');
    const reviews = await y.getReviews();
    console.log(reviews)
})();