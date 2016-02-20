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
            },
            lyrics : {
                color : '#4F00FF',
                kara : false,
                type : 1
            }
        }
        var _options = {};
        var _e = document.createElement('audio');
        var _controls = [];
        var _playlist;

        // Timers
        var _timer_lyrics;

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

            // Validate options
            if(["vertical", "horizontal"].indexOf(_options.volume.type) == -1)
                 _options.volume.type = "vertical";

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
            if(typeof _controls.time_current !== 'undefined'){
                setValue(_controls.time_current,
                    getTime(_controls.time_current.reverse ? _e.duration - _e.currentTime : _e.currentTime
                ));
            }
            _playlist.updateLyrics();
            updateProcess(_e.currentTime * 1000 / _e.duration);
        }

        function onplay(){
            log('onplay');
            if(typeof _controls.playpause !== 'undefined')
                _controls.playpause.addClass('playing');
            if(_options.lyrics.kara)
                _timer_lyrics = setInterval(_playlist.updateOverlay, 100);
        }

        function onpause(){
            log('onpause');
            if(typeof _controls.playpause !== 'undefined')
                _controls.playpause.removeClass('playing');
            clearInterval(_timer_lyrics);
            _timer_lyrics = undefined;
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
                    else // remove song if it not valid
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
                    if(s.url === songs[i].url){
                        log('The song already exists in the list');
                        return;
                    }
                }
                songs.push(new Song(s));
                if(index == -1) index = 0;
            }

            function remove(i){
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

            this.playSong = function(s){
                if(typeof s === 'object' && s.constructor.name === "Song"){
                    for (var i = 0; i < songs.length; i++) {
                        if(songs[i] == s){
                            index = i;
                            songs[index].play();
                        }
                    }
                } else log('invalid song type: ' + typeof s);
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
                if(songs.length <= 0) return;
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
                if(songs.length == 0) return;
                var i = (index + 1) % songs.length;
                return songs[i];
            }

            this.getPrevSong = function() {
                if(songs.length == 0) return;
                var i = (songs.length + index - 1) % songs.length;
                return songs[i];
            }

            this.getCurrentSong = function(){
                if(songs.length == 0 || index < 0 || index > songs.length - 1) return;
                return songs[index];
            }

            this.updateLyrics = function(){
                if(songs.length == 0 || index < 0 || index > songs.length - 1) return;
                songs[index].lyrics.update();
            }

            this.updateOverlay = function(){
                if(songs.length == 0 || index < 0 || index > songs.length - 1 || !_options.lyrics.kara) return;
                songs[index].lyrics.updateOverlay();
            }

            this.setProcess = function(t){
                if(isValidSong(songs[index]))
                    songs[index].setProcess(t);
                else log('invalid song type');
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
                if(typeof _controls.playlist === 'undefined') return;
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
            this._el.song = this;
            this._el.innerHTML = '<span class="title">'+this.title+'</span> - <span class="artist"> '+this.artist+'</span><span class="del">Del</span>';
            this._el.addEventListener('click', function(e){
                e.stopPropagation();
                if(e.target.tagName.toLowerCase() === 'span')
                {
                    if((e.target.classList && e.target.classList.contains('del'))
                        || new RegExp('(^| )' + 'del' + '( |$)', 'gi').test(e.target.className)){
                        _playlist.remove(this.song);
                        return;
                    }
                }
                _playlist.playSong(this.song);
            });

            this.play = function(){
                if(_e.currentSrc != this.url)
                    _e.src = this.url;
                _e.play();

                setValue(_controls.title, this.title);
                setValue(_controls.artist, this.artist);

                this.lyrics.load();
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

            this.setProcess = function(t){
                if(t < 0 || t > 1000 || _e.ended || isNaN(_e.duration)) return false;
                _e.currentTime = _e.duration / 1000 * t;
                if(_e.paused) play()
            }

            this.remove = function(){
                if(_e.currentSrc == this.url){
                    onpause();
                    _e.src = '';
                    setValue(_controls.title, '');
                    setValue(_controls.artist, '');
                }
            }
        }

        function Lyrics(s){
            var url, data = [], isloading = false, current, next, index;
            if(s[0] == '[')
                data = getLyricsData(s);
            else url = s;

            this.load = function(){
                if(data.length > 0 || isloading || url.length == 0) return;
                isloading = true;
                $.get(url, function(r) {
                    data = getLyricsData(r);
                });
            }

            this.update = function(){
                if(data.length == 0) {
                    setValue(_controls.lyrics, '');
                    return;
                }
                var currentTime = _e.currentTime;
                var text = data[0][1];
                var i = 0;
                for (i = 0; i < data.length; i++) {
                    if(data[i][0] < currentTime)
                        text = data[i][1];
                    else break;
                }
                if(current != text){
                    current = text;
                    if(i < data.length - 1)
                        next = data[i][1];
                    if(current.length !== 0 && current != '\r')
                    {
                        showCurrent(current)
                        index = i;
                    }
                    else
                        showCurrent(next);
                }
            }

            this.updateOverlay = function(){
                if(index == undefined || _controls.lyrics.overlay == undefined || index <= 0) return;
                var w = (_e.currentTime - data[index - 1][0]) / (data[index][0] - data[index - 1][0]) * 100;
                if(w > 100) w = 0;
                _controls.lyrics.overlay.width( w + '%');
            }

            function showCurrent(s){
                if(typeof _controls.lyrics === 'undefined') return;
                setValue(_controls.lyrics.panel, s)
                if(_options.lyrics.kara){
                    setValue(_controls.lyrics.overlay, s);
                    _controls.lyrics.overlay.width('0%');
                    if(typeof _controls.lyrics !== 'undefined')
                        _controls.lyrics.panel.append(_controls.lyrics.overlay);
                }

                setValue(_controls.lyrics, _controls.lyrics.panel);
            }

            function getLyricsData (text) {
                log('get lyrics data...');
                var lines = text.split('\n'),
                //this regex mathes the time [00.12.78]
                pattern = /\[\d{2}:\d{2}.\d{2}\]/g,
                result = [];
                //exclude the description parts or empty parts of the lyric
                while (!pattern.test(lines[0])) {
                    lines = lines.slice(1);
                };
                //remove the last empty item
                lines[lines.length - 1].length === 0 && lines.pop();
                //display all content on the page
                lines.forEach(function(v, i, a) {
                    var time = v.match(pattern),
                    value = v.replace(pattern, '');
                    if(time){
                        time.forEach(function(v1, i1, a1) {
                            //convert the [min:sec] to secs format then store into result
                            var t = v1.slice(1, - 1).split(':');
                            result.push([parseInt(t[0], 10) * 60 + parseFloat(t[1]), value]);
                        });
                    }
                });
                //sort the result by time
                result.sort(function(a, b) {
                    return a[0] - b[0];
                });
                isloading = false;
                return result;
            }
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
            this.setVolume(Math.round(_e.volume *100)+ t);
        }

        this.volumeDown = function(t){
            t = (typeof t == 'number') ? t : 1;
            this.setVolume(Math.round(_e.volume*100) - t);
        }

        var setVolume = this.setVolume = function(t) {
            log('setVolume: ' + t);
            if(t<0 || t > 100) return;
            _e.volume = parseFloat(Math.round(t)/100).toFixed(2);
        }

        this.getVolume = function(){
            return Math.round(_e.volume*100);
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
            if(_options.debug === true && typeof console === 'object' && typeof console.log === "function")
                console.log(s);
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
            return _control.html(v);
        }
        function setProcessStyle(_control){
            if(typeof _control == 'undefined') return;
            _control.slider({
                animate: 500,
                max : 1000,
                range: "min",
                slide : function(e, t) {
                    if(isNaN(_e.duration)) {
                        e.preventDefault();
                        return;
                    }
                    _playlist.setProcess(t.value);
                }
            });
            _control.css({
                position: 'relative',
                border: '1px solid #E4E0E0',
                height: '20px',
                'box-sizing': 'border-box'
            });
            _control.find('.ui-slider-range').css({
                height: '18px',
                'background-color': '#9E9E9E'
            });
        }
        function updateProcess(t){
            if(typeof jQuery.fn.slider === 'function')
                _controls.process.slider('value', t);
        }
        function setVolumeStyle(_control){
            if(typeof _control == 'undefined') return;
            _control.slider({
                orientation: _options.volume.type,
                animate: 500,
                range: "min",
                min: 0,
                max: 100,
                slide : function(e, t) {
                    setVolume(t.value);
                }
            });
            _control.css({
                'position':'relative',
                height: '100px',
                width: '20px',
                border: '1px solid #E4E0E0'
            });
            _control.find('.ui-slider-range-min').css({
                'position':'absolute',
                'width':'100%',
                'bottom' : 0,
                'background-color':'#9E9E9E'
            });
        }
        function setLyricsstyle(_control){
            if(typeof _control == 'undefined') return;
            _control.panel = $('<p class="lyric-panel" style="position: relative; display: inline-block; white-space: nowrap"></p>');
            _control.overlay = $('<span class="overlay" style="color: '+_options.lyrics.color+'; position: absolute; left: 0; top: 0; width: 60%; overflow: hidden"></span>');
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
        setProcessStyle(_controls.process);
        setVolumeStyle(_controls.volume);
        setLyricsstyle(_controls.lyrics);
    }
    window.VoiPlayer = VoiPlayer;
})();