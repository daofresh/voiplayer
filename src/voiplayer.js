/**
 * Voi Player
 * http://github.com/daofresh/voiplayer
 * @author: daofresh
 * @date: 2016-01-27
 **/
'use strict';
(function(){
    var VoiPlayer = function(options){
        var _default_config = {
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
            volume: {
                type : 'vertical', // or horizontal
            }
        }
        var _options = {};
        var _e = document.createElement('audio');
        var _controls = [];
        var _playlist;

        function init(options){
            function mergeConfig(a, b){
                var c = b;
                for (var t in a){
                    if(c.hasOwnProperty(t)){
                        if(a[t] != null && a[t].constructor == Object && b[t].constructor == Object){
                            c[t] = mergeConfig(a[t], c[t]);
                        }
                    }
                    else c[t] = a[t];
                }
                return c;
            }
            function getElements(o){
                function getElement(i){
                    var t = i.split(' ');
                    t = t[t.length - 1];
                    if(t.indexOf('.') !== -1 || t.indexOf('#') !== -1){
                        var e = document.querySelectorAll(i);
                        if(e.length > 0) return $(e);
                    }
                }
                for(var k in o){
                    o[k] = getElement(o[k]);
                }
                return o;
            }
            _options = mergeConfig(_default_config, options);
            _controls = getElements(_options.maps);

            // Setup audio events
            _e.ondurationchange = ondurationchange;
            _e.ontimeupdate = ontimeupdate;
            _e.onplay = onplay;
            _e.onpause = onpause;
            _e.onended = onended;
            _e.onerror = onerror;

            _playlist = new PlayList();

            // Set debug variables
            if(_options.debug){
                window._e = _e;
                window._controls = _controls;
            }
        }

        function ondurationchange(){
            setValue(_controls.time_total, getTime(_e.duration));
        }

        function ontimeupdate(){
            setValue(_controls.time_current,
                getTime(_controls.time_current.reverse ? _e.duration - _e.currentTime : _e.currentTime
            ));
        }

        function onplay(){
            log('onplay');
        }

        function onpause(){
            log('onpause');
        }

        function onended(){
            log('onended');
            _playlist.next();
        }

        function onerror(e){
            log('onerror');
            switch (e.target.error.code) {
                case e.target.error.MEDIA_ERR_ABORTED:
                    log('You aborted the video playback.');
                break;
                case e.target.error.MEDIA_ERR_NETWORK:
                    log('A network error caused the audio download to fail.');
                break;
                case e.target.error.MEDIA_ERR_DECODE:
                    log('The audio playback was aborted due to a corruption problem or because the video used features your browser did not support.');
                break;
                case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    log('The video audio not be loaded, either because the server or network failed or because the format is not supported.');
                break;
                default:
                    log('An unknown error occurred.');
                break;
            }
        }

        function PlayList(){
            var index = -1;
            var songs = [];

            function isValidSong(s){
                if(typeof songs[index] !== 'undefined')
                {
                    if(typeof songs[index] === 'object' && songs[index].constructor.name === "Song")
                        return true;
                    else
                        songs.splice(index, 1);
                }
                return false;
            }

            function addSong(s){
                if(typeof s !== 'object' || typeof s.url !== 'string' || s.url.length == 0) {
                    log('Missing song url');
                    return;
                }
                for (var i = 0; i < songs.length; i++) {
                    if(s.url === songs[i]){
                        log('The song already exists in the list');
                        return;
                    }
                }
                songs.push(new Song(s));
                if(index == -1) index = 0;
            }

            function remove(i){
                log('remove song ' + i);
                if(typeof i !== 'number' || i < 0 || i >= songs.length) return;
                if(i == index){
                    songs[index].remove();
                }
                songs.splice(i, 1);

                // update index
                if(songs.length > 0){
                    if(index > songs.length - 1) index = 0;
                }
                else index = -1;
            }

            this.play = function(){
                if(isValidSong(songs[index]))
                    songs[index].play();
                else log('invalid song type');
            }

            this.pause = function(){
                if(isValidSong(songs[index]))
                    songs[index].pause();
                else log('invalid song type');
            }

            this.toggle = function(){
                if(isValidSong(songs[index]))
                    songs[index].toggle();
                else log('invalid song type');
            }

            this.stop = function(){
                if(isValidSong(songs[index]))
                    songs[index].stop();
                else log('invalid song type');
            }

            this.next = function(){
                if(songs.length <= 0) return;
                index = (index + 1) % songs.length;
                songs[index].play();
            }

            this.prev = function(){
                index = (songs.length + index - 1) % songs.length;
                songs[index].play();
            }

            this.addSong = function(s){
                if(Array.isArray(s)){
                    for (var i = 0; i < s.length; i++) {
                        addSong(s[i]);
                    }
                }
                else addSong(s);
                Invalidate();
            }

            this.getSongs = function(){
                if(_options.debug)
                    return songs;
                else
                    return jQuery.extend({}, songs);
            }

            this.getNextSong = function(){
                if(songs.length <= 0) return;
                var i = (index + 1) % songs.length;
                return songs[i];
            }

            this.getPrevSong = function() {
                if(songs.length <= 0) return;
                var i = (songs.length + index - 1) % songs.length;
                return songs[i];
            }

            this.getCurrentSong = function(){
                return _e.song;
            }

            this.remove = function(s){
                log('start remove song ' + s);
                if(typeof s === 'number'){
                    if(s < 0 || s >= songs.length)
                        return;
                } else if(typeof s === 'object'){
                    for (var i = 0; i < songs.length; i++) {
                        if(songs[i].url === s.url) {
                            s = i;
                            break;
                        }
                    }
                    if(typeof s !== 'number') return;
                }
                remove(s);
                Invalidate();
            }

            function Invalidate(){
                _controls.playlist.empty();
                for (var i = songs.length - 1; i >= 0; i--) {
                    _controls.playlist.prepend(songs[i]._el);
                };
            }
        }

        function Song(o){
            this.id = o.song_id;
            this.title = o.title || '';
            this.artist = o.artist || '';
            this.url = o.url;
            this.cover = o.cover;
            this.lyrics = new Lyrics(o.lyrics);
            this._el = document.createElement('li');
            this._el.innerHTML = '<span class="title">'+this.title+'</span> - <span class="artist">'+this.artist+'</span>';

            this.play = function(){
                if(_e.currentSrc != this.url)
                    _e.src = this.url;
                _e.play();

                setValue(_controls.title, this.title + ' - ' + this.artist);
            }

            this.pause = function(){
                if(!_e.paused) _e.pause();
            }

            this.toggle = function(){
                if(_e.paused)
                    this.play();
                else this.pause();
            }

            this.stop = function(){
                if(!_e.paused)
                {
                    _e.pause();
                    _e.currentTime = 0;
                }
            }

            this.remove = function(){
                if(_e.currentSrc == this.url)
                    _e.src = '';
                //$(_el).parents().remove(_el);
            }
        }

        function Lyrics(s){
            function init(s){

            }

            init(s);
        }

        // Interfaces
        this.play = function(){
            _playlist.play();
        }

        this.pause = function(){
            _playlist.pause();
        }

        this.toggle = function(){
            _playlist.toggle();
        }

        this.stop = function(){
            _playlist.stop();
        }

        this.volumeUp = function(t){
            t = (typeof t == 'number') ? t : 1;

        }

        this.volumeDown = function(t){
            t = (typeof t == 'number') ? t : 1;

        }

        this.setVolume = function(t) {
            t = (typeof t == 'number') ? t : 1;

        }

        this.getVolume = function(){

        }

        this.next = function(){
            _playlist.next();
        }

        this.prev = function(){
            _playlist.prev();
        }

        this.addSong = function(s){
            if(typeof s === 'object' || Array.isArray(s))
                _playlist.addSong(s);
            else log('invalid song type');
        }

        this.removeSong = function(s){
            _playlist.remove(s);
        }

        this.getSongs = function(){
            return _playlist.getSongs();
        }

        this.getCurrentSong = function(){
            return _playlist.getCurrentSong();
        }

        this.getPrevSong = function(){
            return _playlist.getPrevSong();
        }

        this.getNextSong = function(){
            return _playlist.getNextSong();
        }

        function log(s){
            if(_options.debug === true) console.log(s);
        }

        function getTime (t) {
            var m = ~~( t/60 ), s = ~~( t % 60 );
            return ( m < 10 ? "0" + m : m ) + ':' + ( s < 10 ? "0" + s : s );
        }

        function setEvent(_control, e, c){
            if(typeof _control == 'undefined') return;
            _control.on(e, c);
        }
        function setValue(_control, v){
            if(typeof _control == 'undefined') return;
            _control.html(v);
        }

        init(options);
        setEvent(_controls.playpause, 'click', _playlist.toggle);
        setEvent(_controls.next, 'click', _playlist.next);
        setEvent(_controls.prev, 'click', _playlist.prev);
        setEvent(_controls.stop, 'click', _playlist.stop);
        setEvent(_controls.time_current, 'click', function(){
            _controls.time_current.reverse = !_controls.time_current.reverse;
            ontimeupdate();
        });
    }
    window.VoiPlayer = VoiPlayer;
})();