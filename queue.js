const { compile } = require('./modules/compiler.js');
var compiler = require('./modules/compiler.js');
const fs = require('fs');

// create 'songs' and 'compiled' directories if they don't exist
if (!fs.existsSync('songs')){
    fs.mkdirSync('songs');
}
if (!fs.existsSync('compiled')){
    fs.mkdirSync('compiled');
}

// objects containg mp3 data to be compiled..
// qlist contains the queue of objects to be fetched
global.qlist = {};
// greenlist is the queue of objects that have been fetched and are valid
global.greenlist = {};
// clist is the queue of objects whose raw files have been downloaded and are currently compiling
global.clist = {};
// dlist is the queue of objects which are done compiling and are ready to be sent to the client
global.dlist = {};

// faillist is the queue of objects which have failed to compile
global.faillist = {};

async function add(id){
    // add an id to the queue
    // if the id is not already in the queue. add it
    if(id in qlist || id in greenlist || id in clist || id in dlist || id in faillist){
        console.log(id+' - id already in queue');
        return 1;
    }

    qlist[id] = id;
    console.log('Added to queue: ' + id);
    compiler.compile(id)
    return 1;

}



module.exports = {
    add : add
}