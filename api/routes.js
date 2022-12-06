
var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');

var queue = require('../queue.js');
const app = require('../index.js');
const rateLimit = require('express-rate-limit');


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
        if(global.clist[id][1]) {
            res.json({status: 'Compiling', size: global.clist[id][1]});
        } else {
        res.json({status: 'Compiling'});}
        
    }
    else if(id in global.dlist){
        // send json message
        if(global.dlist[id].size) {
            res.json({status: 'Done', size: global.dlist[id][1]});
        } else {
        res.json({status: 'Done', url: '/download?id='+id});}
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
    console.log('download: ' + id);
    // find id in queue lists
    if(id in global.dlist){
        // send file pipe
        var file = path.join(__dirname, '../compiled/' + id + '.mp3');
        res.download(file);
    }
    else{
        // send json message
        res.json({status: 'Not ready'});
    }
});

module.exports = router;