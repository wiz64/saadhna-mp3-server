
var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');
var https = require('https');

var queue = require('../queue.js');
const app = require('../index.js');
const rateLimit = require('express-rate-limit');
var telegram_mod = require('../modules/telegram.js');

const limiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 15 minutes
	max: 30, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

// GET home page.
router.get('/', function(req, res, next) {
    // return helloworld
    res.send('Hello World');
});

router.get('/add', limiter, function(req, res, next) {
    // get id
    var id = req.query.id;
    if(!id){
        res.send('No id provided');
        return 0;
    }
    console.log('id: ' + id);
    // add id to queue
    if(queue.add(id)) {
        res.json({status: 'success'});
    }
});
router.get('/status', function(req, res, next) {
    // get id
    var id = req.query.id;
    if(!id){
        // send json message
        res.json({status: 'No id provided'});
        return 0;
    }
    console.log('status: ' + id);
    // find id in queue lists
    if(id in global.qlist){
        // send json message
        res.json({status: 'Queued'});
    }
    else if(id in global.greenlist){
        // send json message
        res.json({status: 'Fetched'});
    }
    else if(id in global.clist){
        // send json message
        if(global.clist[id][1].size) {
            res.json({status: 'Compiling', size: global.clist[id][1].size});
        } else {
        res.json({status: 'Compiling', size: "Null"});}
        
    }
    else if(id in global.dlist){
        // send json message
        if(global.dlist[id][1].size) {
            res.json({status: 'Done',url: '/download?id='+global.dlist[id][0], size: global.dlist[id][1].size});
        } else {
        res.json({status: 'Done', url: '/download?id='+global.dlist[id][0], size : "Null"});}
    }
    else if(id in global.faillist){
        // send json message
        res.json({status: 'Failed'});
    }
    else{
        // send json message
        res.json({status: 'Not in queue'});
    }

});
router.get('/download', limiter, function(req, res, next) {
    // get id
    var id = req.query.id;
    
    if(!id){
        // send json message
        res.json({status: 'No id provided'});
        return 0;
    }
    console.log("Download Request: \n ----- ",global.dlist[id], req.ip);
    // find id in queue lists
    if(id in global.dlist){
        // send file pipe
        if(fs.existsSync(global.compile_dir + id + ".mp3")){
            // get file from telegrama {
                var file = path.join(global.compile_dir + id + '.mp3');
                if(global.dlist[id][1].size) {
                var fileDetails = global.dlist[id][1];
                // download with fileName
                // convert " to '
                fileDetails.fileName = fileDetails.fileName.replace(/"/g, "'");
                res.download(file, fileDetails.fileName)
                } else {
                res.download(file);
                }
            } else {
                async function download() {
                    var file_link = await telegram_mod.getFile(global.dlist[id][1].file_id, id);
                    // download file_link from tg api
                    // get path of current directory
                    var file = fs.createWriteStream(global.compile_dir + id + '.mp3');
                    // import axios
                    if(!file_link) {
                        res.json({status: 'Failed',message: 'File link not found. sending for recompile..'});
                        // send for recompile
                        // delete from dlist
                        delete global.dlist[id];
                        // add to queue
                        queue.add(id);
                        return 0;
                    }
                    file_link = "https://api.telegram.org/file/bot" + process.env.TELEGRAM_TOKEN + "/" + file_link;
                    // download file and wait till finish
                    https.get(file_link, function(response) {
                        if(response.ok == 'false') {
                            console.log("Error: ", response);
                            res.json({status: 'Failed'});
                            return 0;
                        }
                        response.pipe(file);
                        // on pipe finish
                        file.on('finish', function() {

                            if(global.dlist[id][1].size) {
                            var fileDetails = global.dlist[id][1];
                            // download with fileName
                            // convert " to '
                            fileDetails.fileName = fileDetails.fileName.replace(/"/g, "'");
                            res.download(file, fileDetails.fileName)}
                        });
                    }
                    );
                    // send file
                    
                    }
            try { download(); } catch (error) { console.log(error); }
    
                
            }
                

    }
    else{
        // send json message
        res.json({status: 'Not ready'});
    }
});

module.exports = router;