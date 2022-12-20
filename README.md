# saadhna-mp3-server
Live MP3 Metadata Compiler, Storage and Server

Compiles requested Tracks with Cover, Metadata and servers them on-the-fly.

edit `.env` file
```
TELEGRAM_TOKEN = 123456:your_telegram_token
```
then run on terminal
```
npm install
node index.js
```

### Endpoints
- #### Add
```
/add?id=[:track-id]
```
example - `/add?id=4ZJPDxcU`

- #### Check Status after adding
```
/status?id=[:track-id]
```
example - `/status?id=4ZJPDxcU`
