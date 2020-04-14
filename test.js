'use strict'
const fetchReviews = require('./scrape');
const exJs = require('exceljs');
const fs = require('fs').promises;
const regions = ['au', 'us', 'gb', 'ca', 'nz'];


(async () => {

    const urls = await fs.readFile('./inputs.txt', 'utf8');
    const inputs = urls.split('\n').map(u => {
        const splits = u.split('/');
        const id = splits[splits.length - 1].substring(2).replace(/\D/g, '');;
        const name = splits[splits.length - 2];
        return { name: name, id: id };
    });

    let reviews, rows, workbook = new exJs.Workbook();

    for (let input of inputs) {
        let worksheet = workbook.addWorksheet(input.name);
        worksheet.columns =
            [{ header: "rating", key: "rating", width: 10 },
            { header: "title", key: "title", width: 20 },
            { header: "review", key: "review", width: 50 },
            { header: "date", key: "date", width: 10 },
            { header: "region", key: "region", width: 10 }]
        worksheet.getColumn('review').alignment = { wrapText: true };
        worksheet.getColumn('title').alignment = { wrapText: true };

        for (let region of regions) {
            reviews = await fetchReviews(input.name, input.id, region);
            if (reviews && reviews[0] != undefined) {
                rows = await reviews.map(r => ({ rating: r.attributes.rating, title: r.attributes.title, review: r.attributes.review, date: r.attributes.date, region: region }));
                worksheet.addRows(rows);
            }
        }
    }
    await workbook.xlsx.writeFile('hiPagesReviewsAppStore.xlsx');

    console.log('done')

})();