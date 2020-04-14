const exJs = require('exceljs');

let workbook = new exJs.Workbook();
let worksheet = workbook.addWorksheet('sheetTest');
worksheet.columns =
    [{header:"rating",key:"id",width:10},
    {header:"title",key:"id",width:10},
    {header:"review",key:"id",width:10},
    {header:"date",key:"id",width:10},
    {header:"region",key:"id",width:10}]

module.exports = {
    appstore: worksheet}