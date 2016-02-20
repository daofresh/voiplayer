# VoiPlayer.js

VoiPlayer is a simple javascript library to help you create an audio player for your website.

You can use any HTML element as a part of the player.


Basic setup:
- With default configs:
``` javascript
var _voiplayer = new VoiPlayer({});
```
- With custom configs:
``` javascript
var _voiplayer = new VoiPlayer({
    debug: false,
    maps: {
      playpause: '#playpause',
      stop: '#stop',
      next: '#next',
      prev: '#prev',
      process: '#process',
      volume: '#volume',
      time_total: '#time-total',
      time_current: '#time-current',
      playlist: '#playlist',
      title: '#title',
      artist: '#artist',
      lyrics: '#lyrics',
      cover: '#cover',
    },
    process: {
      color: 'rgba(255,255,255,.8)'
    }
    lyrics : {
      color : '#4F00FF',
      kara : false,
      type : 1
    }
});
```
## Interfaces:

* _voiplayer.play(); // play current song
* _voiplayer.pause(); // pause current song
* _voiplayer.toggle(); // toggle play/pause
* _voiplayer.stop(); // stop current song
* _voiplayer.volumeUp(); // increase volume up by 1 unit
* _voiplayer.volumeDown(); // decrease volume down by 1 unit
* _voiplayer.setVolume(t); // set volume (0 <= t <= 100)
* _voiplayer.getVolume(); // get current volume
* _voiplayer.next(); // play next song
* _voiplayer.prev(); // play previous song
* _voiplayer.addSong(s); // add songs to list
* _voiplayer.removeSong(); // remove songs from list.
* _voiplayer.getCurrentSong(); // return current song
* _voiplayer.getPrevSong(); // return previous song
* _voiplayer.getNextSong(); // return next song
