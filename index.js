// express hello world
var express = require('express');
var app = express();
const fs = require('fs');

global.app_config = {
    serverless : true
}
var PORT = 3000;
var api =  require('./api/routes.js');
// all cors
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    next();
});

app.get('/*',api);

app.listen(PORT, function () {
    console.log(` ---- MP3 IS SERVING MUSIC  ---- `);
    console.log(`  - ON PORT ${PORT}  `);
    // delete compiled and songs folder if exists
    if (fs.existsSync('./compiled')) {
        fs.rmSync('./compiled', { recursive: true });
    }
    if (fs.existsSync('./songs')) {
        fs.rmSync('./songs', { recursive: true });
    }
    // create compiled and songs folder
    fs.mkdirSync('./compiled');
    fs.mkdirSync('./songs');

});
    
module.exports = app;