const rqn = require('request-promise-native');
const fs = require('fs').promises;
const listing = 'jacaranda-finance'
const listingUrl = `https://www.productreview.com.au/listings/${listing}`;
const api = (page) => `https://api.productreview.com.au/api/au/listings/${listing}/reviews?sort=firstPublishedAt&order=DESC&page=${page}`;

const specs = async () => {
    const page = await rqn(listingUrl);
    let raw = page.match(/"flatReviewSpecificationsSchema\\":\{.*invisibleEntryItemViewSpecifications/g)[0];
    raw = '"' + raw.substring(34, raw.length - 39) + '"';
    const schema = JSON.parse(JSON.parse(raw));
    // console.log(schema)
    let list = {};
    for (let key in schema) {
        list[key] = schema[key].title;
        if (schema[key].enum && schema[key].enumNames) {
            let i;
            for (i in schema[key].enum) {
                list[schema[key].enum[i]] = schema[key].enumNames[i];
            }
        }
    }
    return list;
}



(async () => {
    const [firstpageRaw, specsMap] = await Promise.all([rqn(api(1)), specs()]);
    console.log(specsMap)
    const decodeSpecs = (encodedSpecs, debug) => {
        let list = {};
        let key;

        for (key in encodedSpecs) {
            if (debug != null) {
                console.log(key);
                console.log("value", encodedSpecs[key]);

            }
            if (encodedSpecs[key]!=null) {
                if (encodedSpecs[key].countsMap) {
                    // console.log(key)
                    encodedSpecs[key].countsMap = decodeSpecs(encodedSpecs[key].countsMap);
                }
                if (encodedSpecs[key].counts) {
                    // console.log(key)
                    encodedSpecs[key].counts = encodedSpecs[key].counts.map(c => {
                        let obj = {}
                        obj[specsMap[c.key]] = c.count;
                        // console.log("object",obj)
                        return obj;
                    });
                }
            }
            list[specsMap[key] ? specsMap[key] : key] = encodedSpecs[key];
        }
        if (debug != null) { console.log('++++++++++++++++++++++++++++++++++++'); }
        return list;

    }
    const firstpage = JSON.parse(firstpageRaw);

    const fpReviews = firstpage.collection;
    const specsInfo = decodeSpecs(firstpage.filterAggregations);
    // console.log(specsInfo);

    const numPages = firstpage.paging.totalPageCount;
    const pages = [];
    for (let i = 2; i <= numPages; i++) { pages.push(i); }

    const response = await Promise.all(pages.map(p => rqn(api(p))));

    const otherReviews = response.map(r => JSON.parse(r).collection).flat()
        .map(r => {
            if (r.specificationValues) {
                r.specificationValues = decodeSpecs(r.specificationValues, true);
            }
            return r;
        });

    const reviews = fpReviews.concat(otherReviews);
    const json = {
        reviews: reviews,
        aggregate: specsInfo
    };
    console.log(json)
    await fs.writeFile(`./productreview/reviews-${listing}.json`, JSON.stringify(json));
    console.log('done')

})()