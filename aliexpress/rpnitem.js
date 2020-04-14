const rpn = require('request-promise-native');
const options = {
  'method': 'GET',
  'url': 'https://www.aliexpress.com/item/4000483807383.html',
};

const clean = (data) => {
    try {
        // remove the dangling comma and all redundant stuff after and return
        let cleaned = data.match(/data: \{.*\}/g)[0].replace(/[\n\r]/g, '');
        cleaned = cleaned.substring(6);
        return cleaned;
    } catch (e) {
        // if Aliexpress schema changes will not crash but return JSON parsing error
        throw Error('AliExpress item redirected to login try again.');
    }
};

(async () => {
    const response = await rpn(options);
    const json = JSON.parse(clean(response));
    console.log(json);
})();
