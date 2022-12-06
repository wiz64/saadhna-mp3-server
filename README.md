# saadhna-mp3-server
Live MP3 Metadata Compiler, Storage and Server

Compiles requested Tracks with Cover, Metadata and servers them on-the-fly.

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