const rpn = require('request-promise-native');

const fetchReview = async (page) => {
    const res = await rpn(`http://m.aliexpress.com/api/products/33062487437/feedbacks?page=${page}&filter=all`);
    const json = JSON.parse(res);

    return json.data.evaViewList;
}

(async () => {

    const pages = [];
    const res = await rpn('http://m.aliexpress.com/api/products/33062487437/feedbacks?page=1&filter=all',
        {
            headers: {
                "Connection": "close"
            }
        });

    const json = JSON.parse(res);
    const numPages = json.data.totalPage;

    for (let x = 1; x <= numPages; x++) {
        pages.push(x);
    }
    console.log(pages.length)
    const startTime = Date.now();
    const reviews = await Promise.all(pages.map(p => fetchReview(p)));
    const time = Date.now() - startTime;
    console.log(reviews.flat())
    console.log(Math.floor(time/1000));
})();
