const { Telegraf } = require('telegraf')
const fs = require('fs');
// dotenv
require('dotenv').config();
const bot = new Telegraf(process.env.TELEGRAM_TOKEN)
bot.start((ctx) => ctx.reply('Welcome'))
bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.on('sticker', (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))
// bot will send all files inside modules folder to the group chat with id -835379521
bot.launch()
async function saveFile(file_path) {
    // send file to group chat and return the file id
    var file_id = await bot.telegram.sendDocument('-876367042', { source: file_path}).then((result) => {
        return result.document.file_id;
    });
    return file_id;
}
async function getFile(file_id, song_id) {
    // get file by file_id, if file_id is not found, return 0
    try
    {return await bot.telegram.getFile(file_id).then((result) => {
        return result.file_path
    });} catch (error) {
        console.log("Error: ", error);
        return 0;
    }
}
module.exports = {
    saveFile: saveFile,
    getFile: getFile
}
