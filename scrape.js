'use strict'
const fetch = require('node-fetch');


const findLastPage = async (amount, authHeader, appId, region) => {

    let offsets = [];
    for (let x = 0; x < amount + 10; x += 10) { offsets.push(x); }
    if (offsets.length == 1) { return offsets; }

    // console.log(offsets);
    let first = 0;
    let last = offsets.length - 1;

    let response;

    while (first <= last) {

        let mid = Math.floor((first + last) / 2);
        let currOffset = offsets[mid]
        // console.log("curr", currOffset);
        // console.log("first", first);
        // console.log("last", last);
        response = await isLastPage(currOffset, authHeader, appId, region);
        // console.log("response", response)
        if (response == 0) {
            return offsets.slice(0, offsets.indexOf(currOffset) + 1);
        } else if (response < 0) {
            last = mid - 1;
        } else {
            first = mid + 1;
        }
    }

    return [];
};

const isLastPage = async (offset, authHeader, appId, region) => {
    const domain = "https://amp-api.apps.apple.com";
    const qString = "&platform=web"
    const extension = `/v1/catalog/${region}/apps/${appId}/reviews?l=en-AU&offset=${offset}`;
    const headers = {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Authorization": authHeader,
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "close",
    };
    const response = await fetch(`${domain}${extension}${qString}`, { headers: headers });
    if (response.ok) {
        const json = await response.json();
        // console.log(json);
        return json.next == undefined ? 0 : 1;
    } else {
        return -1;
    }
}

const fetchReviewPage = async (offset, authHeader, appId, region) => {
    const domain = "https://amp-api.apps.apple.com";
    const qString = "&platform=web"
    const extension = `/v1/catalog/${region}/apps/${appId}/reviews?l=en-AU&offset=${offset}`;
    const headers = {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Authorization": authHeader,
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "close",
    };
    const response = await fetch(`${domain}${extension}${qString}`, { headers: headers });
    const json = await response.json();
    return json.data;
};

const fetchReviews = async (appName, appId, region) => {

    const response = await fetch(`https://apps.apple.com/${region}/app/${appName}/id${appId}`);
    const exists = response.ok;

    if (exists) {
        const webpage = await response.text();

        const tokenRegex = /token%22%3A%22.*?%/g;
        const schemaRegex = /schema:software-application.*\{.*\}/g;

        const schema = JSON.parse(webpage.match(schemaRegex)[0].match(/\{.*\}/g)[0]);
        console.log(region);
        console.log(schema);
        const numReviews = schema.aggregateRating ? schema.aggregateRating.reviewCount : 0;

        let token = webpage.match(tokenRegex)[0];
        token = token.substring(14, token.length - 1);
        const authHeader = `Bearer ${token}`;

        const offsets = await findLastPage(numReviews, authHeader, appId, region);

        const batchSize = 250;
        const modulus = offsets.length % batchSize;
        const batches = modulus > 0 ? Math.floor(offsets.length / batchSize) + 1 : Math.floor(offsets.length / batchSize);
        let batchedOffsets = [];
        let reviews = [];
        let reviewResponse;
        let retries = 0;

        for (let x = 0; x <= batches && retries < 5; x++) {
            if (x < batches) {
                batchedOffsets = offsets.slice(x * batchSize, (x + 1) * batchSize);
                // console.log(batchedOffsets);
                try {
                    reviewResponse = await Promise.all(batchedOffsets.map(offset => fetchReviewPage(offset, authHeader, appId, region)));
                    reviews.push(...reviewResponse);
                } catch (e) {
                    x--;
                    retries++;
                    console.log(e.message);
                    console.log(reviews);
                    console.log(`retrying, this is the ${retries} time`)
                }

            } else if (x == batches && modulus > 0) {
                batchedOffsets = offsets.slice(x * batchSize, x * batchSize + modulus);
                // console.log(batchedOffsets);
                try {
                    reviewResponse = await Promise.all(batchedOffsets.map(offset => fetchReviewPage(offset, authHeader, appId, region)));
                    reviews.push(...reviewResponse);
                } catch (e) {
                    x--;
                    retries++;
                    console.log(e.message);
                    console.log(`retrying, this is the ${retries} time`)
                }
            }
        }
        return reviews.flat();
    } else {
        return false;
    }
};

module.exports = fetchReviews;

