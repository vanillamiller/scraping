const t = '<link rel="next" href="/collections/all?page=2">';
const currPageNum = 1;
console.log(t.match(new RegExp('/collections/all\\?page='+(currPageNum+1), 'g')))