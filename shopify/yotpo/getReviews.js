const rp = require('request-promise-native');
const fetch = require('node-fetch');
const fs = require('fs').promises;

class Review {
    constructor(id, rating, user, body, date, upvotes, downvotes){  
        this.id = id, this.rating = rating, this.user = user, this.body = body,
        this.date = date, this.upvotes = upvotes, this.downvotes = downvotes;
    }
}

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
        const json = JSON.parse(res.slice(1,res.length-1));
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
        return JSON.parse(res.slice(1, res.length-1)).result
    },
    processReviews: async function(raw){
        
    }
});

(async () => {
    // const y = await Yotpo.initialize('https://www.kyliecosmetics.com/products/22-matte-liquid-lipstick');
    // const rev = await y.getReviews();
    // await fs.writeFile('./shopify/yotpo/allreview.html',rev)
    const reviewsHTML = JSON.parse(await fs.readFile('./shopify/yotpo/allreview.json','utf8')).result
    // console.log(reviewsHTML)
    const reviews = reviewsHTML.match(/<div class=\"yotpo-review [\s\S]*?yotpo-review /g);
    console.log(reviews.length)
    // const idmatches = reviewsHTML.match(/data-review-id="([0-9]+)/g);
    // const ids = idmatches.filter(i => i != null).map(i => i.match(/([0-9]+)/g)[0]);
    // console.log(ids.length)
    // let id, map = {};
    // for(let i in ids){
    //     id = ids[i]
    //     if(map[id]== undefined){
    //         map[id] = reviewsHTML.match(new RegExp(id+'[^>]+?>([^$]+?)<\/.*?>'));
    //         // map[id] = reviewsHTML.match(/([0-9]+)[^>]+?>([^$]+?)<\/.*?>/g);
    //     }else{
    //         map[id].push(ids[i])
    //     }
    // }
    // console.log(map)
})();