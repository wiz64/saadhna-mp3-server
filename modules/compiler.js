// import axios, path, fs
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('./ffmpeg.js')
const he = require('he');
const telegram_mod = require('./telegram.js')
// song constructor

function Song(data) {
    // html special chars decode if name, album, artist, copyright contains '&'
        if(data.name.includes('&')){data.name = he.decode(data.name);}
        if(data.album.name.includes('&')){data.album.name = he.decode(data.album.name);}
        if(data.primaryArtists.includes('&')){data.primaryArtists = he.decode(data.primaryArtists);}
        if(data.copyright.includes('&')){data.copyright = he.decode(data.copyright);}

    this.id = data.id;
    this.title = data.name;
    this.artist = data.primaryArtists;
    this.album = data.album.name;
    this.duration = data.duration;
    this.url = data.url;
    this.copyright = data.copyright;
    this.publisher = "saavn-cli";
    this.comment = "Powered by Saavn-cli - "+data.url;
    this.cover = data.image[2].link;
    this.downloadUrl = data.downloadUrl[4].link;
    this.date = data.year;
    this.compile =  function() {
        if(this.id in dlist){
            console.log(this.id + ' - already compiled');
            return 1;
        }
        // compile song
        
        // download song and cover
        // download song
        var songPath = path.join(__dirname, '../songs', this.id + '.mp4');
        var songWriter = fs.createWriteStream(songPath);
        axios.get(this.downloadUrl, {responseType: 'stream'}).then(response => {
            response.data.pipe(songWriter);
            songWriter.on('finish', () => {
                songWriter.close();
                // download cover
                var coverPath = path.join(__dirname, '../songs', this.id + '.jpg');
                var coverWriter = fs.createWriteStream(coverPath);
                axios.get(this.cover, {responseType: 'stream'})
                // if error
                .catch(error => {
                    console.log("Cover download failed");
                        // download https://i.ibb.co/Kb7nMgQ/saavn-cli.jpg cover and pipe to coverWriter
                        axios.get('https://i.ibb.co/Kb7nMgQ/saavn-cli.jpg', {responseType: 'stream'}).then(response => {
                            response.data.pipe(coverWriter);
                })})
                .then(response => {
                    // if response is not 200
                    if((!response) || response.status != 200){
                        console.log("Cover download failed");
                        // download https://i.ibb.co/Kb7nMgQ/saavn-cli.jpg cover and pipe to coverWriter
                        axios.get('https://i.ibb.co/Kb7nMgQ/saavn-cli.jpg', {responseType: 'stream'}).then(response => {
                            response.data.pipe(coverWriter);
                    });}
                    else { response.data.pipe(coverWriter); }
                    coverWriter.on('finish', () => {
                        coverWriter.close();
                        // calculate total file size = song + cover
                        var songSize = fs.statSync(songPath).size;
                        var coverSize = fs.statSync(coverPath).size;
                        var totalSize = songSize + coverSize;
                        // convert to MB 2 decimal places
                        var totalSize = (totalSize / 1048576).toFixed(2);
                        console.log("Total Size: "+totalSize);
                        var fileDetails = {
                            size: totalSize,
                            fileName : this.title+" - "+this.artist+".mp3",
                        
                        };
                        if(global.clist[this.id]){
                        global.clist[this.id] = [this.id,fileDetails]
                          console.log(global.clist[this.id]);
                        }
                        // compile song
                        var compiledPath = path.join(__dirname, '../compiled', this.id + '.mp3');
                        //-map 0:0 -map 1:0 -c copy -id3v2_version 3 -codec:a libmp3lame -b:a {Bitrate}k -hide_banner -y
                        // argv for all outputOptions
                       
                        var argv = ['-map', '0:0', '-map', '1:0', '-c', 'copy', '-id3v2_version', '3', '-codec:a', 'libmp3lame', '-b:a', '320k', '-hide_banner', '-y'
                        , '-metadata', 'title='+this.title , '-metadata', 'artist='+this.artist , '-metadata', 'album='+this.album+" " , '-metadata', 'publisher='+this.publisher, '-metadata', 'comment='+this.comment, '-metadata', 'date='+this.date, '-metadata', 'copyright='+this.copyright];
                        
                        // for each elemtent in argv, if element contains exactly one space, then add another space to the end of the element
                        for (var i = 0; i < argv.length; i++) {
                            if (argv[i].split(" ").length == 2) {
                                argv[i] = argv[i] + " ";
                            }
                        }
                        // fluent-ffmpeg splits argv with only one space, so we need to add another space to the end of each element in argv

                        
                        
                        //console.log(arg2.join(' '));
                        console.log("Starting Compilation for "+this.id);
                        var song_id = this.id;
                        argv.join('')
                        
                        ffmpeg(songPath)
                        .input(coverPath)
                        .outputOptions(argv)
                        .on('error', function(err) {
                            console.log('An error occurred: ' + err.message);
                            // send to faillist and remove from clist
                            global.faillist[song_id] = song_id;
                            delete global.clist[song_id];
                            // delete song and cover
                            fs.unlinkSync(songPath);
                            fs.unlinkSync(coverPath);
                        })
                        .on('end', function() {
                            var id = song_id
                            console.log('Processing finished ! ', id);
                            
                            // save file
                            async function saveFile(compiledPath, id) {
                            var file_id = await telegram_mod.saveFile(compiledPath, id); 
                            fileDetails.file_id = file_id;
                            global.dlist[id] = [id,fileDetails];
                            delete global.clist[id];
                            fs.unlinkSync(songPath);
                            fs.unlinkSync(coverPath);
                            // save dlist to file dlist.json
                            fs.writeFileSync(path.join(__dirname, '../dlist.json'), JSON.stringify(global.dlist));
                            }
                            saveFile(compiledPath, id);
                            
                            
                        })
                        .save(compiledPath);
                    });
                });
                            
        
            return "hello"; });});
}}
var api_url = "https://jiosaavn-api-privatecvc2.vercel.app/songs";
async function compile(id) {
    // call api with id
    var url = api_url + "/?id=" + id;
    console.log(url);
    // call the api and console log the response code
    
    var response = await axios.get(url, {headers:{'Accept-Encoding': 'application/json'}});
    // set json encoding
    
    console.log(response.status);
    // if the response code is 200, then the api call was successful
    if (response.status == 200) {
        // get the data from the response
        var data = response.data.data[0];
        
        // create a new song object
        var song = new Song(data);
        console.log(song);
        // console.log( all list )
        //console.log(global.qlist, global.greenlist, global.clist, global.dlist, global.faillist);
        // send to greenlist and remove from qlist
        global.greenlist[id] = id;
        delete global.qlist[id];

        // send to clist and remove from greenlist
        global.clist[id] = id;
        delete global.greenlist[id];

        // compile song
        await song.compile();
        // send to dlist and remove from clist
        


    }

   

    // get mp3 data
    // compile mp3 data
    // save mp3 data
    return 0;
}
module.exports = {
    compile : compile
}
