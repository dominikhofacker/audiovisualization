/**
 * Buffer Loader.js
 *
 * A small abstraction around the HTML5 buffer loader interface
 * https://www.behance.net/dominikhofacker
 * Please consider supporting this project on behance:
 * https://www.behance.net/gallery/49260123/Web-Audio-Visualization
 *
 */
 var reader;

window.AudioContext = window.AudioContext || 
                      window.webkitAudioContext;

var BufferLoader = function(sources) {
    this.buffers = { };
    this.context = null;
    this.buffer = null;
    this.init();
};

BufferLoader.prototype.init = function() {
  try {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    this.context = new AudioContext();
  }
  catch(_) {
    alert('Web Audio API is not supported in this browser');
  }
};

BufferLoader.prototype.onBufferLoadError = function(_) {
    console.error('Error loading buffer');
};

BufferLoader.prototype.onBufferLoad = function(bufferName, srcBuffer, callback) {
    this.context.decodeAudioData(srcBuffer, function onSuccess(buffer) {
        this.buffers[bufferName] = buffer;
        if (typeof callback === 'function') {			
			callback(); // Aufruf der Wiedergabefunktion
        }
    }.bind(this), this.onBufferError);
};

BufferLoader.prototype.load = function(bufferName, file, callback) {	
	reader = new FileReader();
	reader.onload = function(data) {
        if(data.target && data.target.result) {
            this.onBufferLoad(bufferName, data.target.result, callback);
        }else{
            console.dir(data);
        }
	}.bind(this);
	reader.readAsArrayBuffer(file);
};

BufferLoader.prototype._playBuffer = function(name, gain, time) {
    var source = this.context.createBufferSource();
    source.buffer = this.buffer;
    
    var analyser = this.context.createAnalyser();
	
	
	
    source.connect(analyser);
    source.connect(this.context.destination);
    source.start(time);
};

BufferLoader.prototype.play = function (name, gain, time) {
    // Default values for time and gain
    gain = typeof gain !== 'undefined' ? gain : 1;
    time = typeof time !== 'undefined' ? time : 0;

    this.buffer = this.buffers[name];
    if (this.buffer) { this._playBuffer(name, time, gain); }
    else { throw new Error("Buffer does not exist"); }
};

