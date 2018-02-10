/*
 * Audiovisualization using the html canvas element.
 * ©2017, Dominik Hofacker
 * https://www.behance.net/dominikhofacker
 * Please consider supporting this project on behance:
 * https://www.behance.net/gallery/49260123/Web-Audio-Visualization
 */

var rafID = null;
var analyser = null;
var c = null;
var cDraw = null;
var ctx = null;
var microphone = null;
var ctxDraw = null;

var loader;
var filename;
var fileChosen = false;
var hasSetupUserMedia = false;

//handle different prefix of the audio context
var AudioContext = AudioContext || webkitAudioContext;
//create the context.
var context = new AudioContext();

//using requestAnimationFrame instead of timeout...
if (!window.requestAnimationFrame)
	window.requestAnimationFrame = window.webkitRequestAnimationFrame;

$(function () {
		"use strict";
	    loader = new BufferLoader();
	    initBinCanvas();	
});

function handleFiles(files) {
    if(files.length === 0){
        return;
    }
	fileChosen = true;
    setupAudioNodes();
	var fileReader  = new FileReader();
    fileReader.onload = function(){
         var arrayBuffer = this.result;
         console.log(arrayBuffer);
         console.log(arrayBuffer.byteLength);
		
		 filename = files[0].name.toString();
		filename = filename.slice(0, -4);
		console.log(filename);

		var url = files[0].urn || files[0].name;
		ID3.loadTags(url, function() {
			var tags = ID3.getAllTags(url);

//                    console.log(tags.title.toString().length);
//                    if (tags.title.length > 14) {
//                        var newTitle = tags.title.substring(0,14);
//                        newTitle += "...";
//                        $("#title").html(newTitle);
//                    }
//                    else {
//                        $("#title").html(tags.title);
//                    }
			if (tags.title.length > 14 && tags.title.length <= 17) {

				$("#title").css("font-size", "7.5vh");
				
			}
			if (tags.title.length > 17 && tags.title.length <= 20) {
				
				$("#title").css("font-size", "6.5vh");
			}
			
			if (tags.title.length > 20) {
				
				$("#title").css("font-size", "5vh");
				
			}
			
			$("#title").html(tags.title);
			
			onWindowResize();

			$("#title").css("visibility", "visible");

			$("#artist").html(tags.artist);
			$("#artist").css("visibility", "visible");
			$("#album").html(tags.album);
			$("#album").css("visibility", "visible");
		  }, {
			tags: ["title","artist","album","picture"],
			dataReader: ID3.FileAPIReader(files[0])
		  });
		
     };
     fileReader.readAsArrayBuffer(files[0]);
     var url = URL.createObjectURL(files[0]); 
	
	var request = new XMLHttpRequest();
	
	request.addEventListener("progress", updateProgress);
	request.addEventListener("load", transferComplete);
	request.addEventListener("error", transferFailed);
	request.addEventListener("abort", transferCanceled);
	
	request.open('GET', url, true);
	request.responseType = 'arraybuffer';

 	// When loaded decode the data
	request.onload = function() {
		// decode the data
		context.decodeAudioData(request.response, function(buffer) {
		// when the audio is decoded play the sound
		sourceNode.buffer = buffer;
		sourceNode.start(0);
		$("#freq, body").addClass("animateHue");
		//on error
		}, function(e) {
			console.log(e);
		});
	};
	request.send();
	
	$("button, input").prop("disabled",true);
}

function playSample() {
	
	fileChosen = true;
    setupAudioNodes();
	
	var request = new XMLHttpRequest();
	
	request.addEventListener("progress", updateProgress);
	request.addEventListener("load", transferComplete);
	request.addEventListener("error", transferFailed);
	request.addEventListener("abort", transferCanceled);
	
	request.open('GET', 'src/Infinite.mp3', true);
	request.responseType = 'arraybuffer';

 	// When loaded decode the data
	request.onload = function() {
		
		$("#title").html("Infinite");
		$("#album").html("Infinite");
		$("#artist").html("Valence");
		onWindowResize();
		$("#title, #artist, #album").css("visibility", "visible");
		
		// decode the data
		context.decodeAudioData(request.response, function(buffer) {
		// when the audio is decoded play the sound
		sourceNode.buffer = buffer;
		sourceNode.start(0);
		$("#freq, body").addClass("animateHue");
		//on error
		}, function(e) {
			console.log(e);
		});
	};
	request.send();
	
	$("button, input").prop("disabled",true);
}

function useMic() 	
{
	"use strict";
	if (!navigator.mediaDevices.getUserMedia) {
		alert("Your browser does not support microphone input!");
		console.log('Your browser does not support microphone input!');
		return;
 	}
	
	navigator.mediaDevices.getUserMedia({audio: true, video: false})
	.then(function(stream) {
		hasSetupUserMedia = true;
	  	//convert audio stream to mediaStreamSource (node)
		microphone = context.createMediaStreamSource(stream);
		//create analyser
		if (analyser === null) analyser = context.createAnalyser();
		//connect microphone to analyser
		microphone.connect(analyser);
		//start updating
		rafID = window.requestAnimationFrame( updateVisualization );
		
		$("#title").html("Mic");
		$("#album").html("Input");
		$("#artist").html("Using");
		onWindowResize();
		$("#title, #artist, #album").css("visibility", "visible");
		$("#freq, body").addClass("animateHue");
	})
	.catch(function(err) {
	  /* handle the error */
		alert("Capturing microphone data failed! (currently only supported in Chrome & Firefox)");
		console.log('capturing microphone data failed!');
		console.log(err);
	});
}

// progress on transfers from the server to the client (downloads)
function updateProgress (oEvent) {
  if (oEvent.lengthComputable) {
	$("button, input").prop("disabled",true);
    var percentComplete = oEvent.loaded / oEvent.total;
	console.log("Loading music file... " + Math.floor(percentComplete * 100) + "%");
	$("#loading").html("Loading... " + Math.floor(percentComplete * 100) + "%");
  } else {
    // Unable to compute progress information since the total size is unknown
	  console.log("Unable to compute progress info.");
  }
}

function transferComplete(evt) {
  	console.log("The transfer is complete.");
	$("#loading").html("");
	//$("button, input").prop("disabled",false);
}

function transferFailed(evt) {
  	console.log("An error occurred while transferring the file.");
	$("#loading").html("Loading failed.");
	$("button, input").prop("disabled", false);
}

function transferCanceled(evt) {
  	console.log("The transfer has been canceled by the user.");
	$("#loading").html("Loading canceled.");
}

function initBinCanvas () {

	//add new canvas
	"use strict";
	c = document.getElementById("freq");
	c.width = window.innerWidth;
        c.height = window.innerHeight;
	//get context from canvas for drawing
	ctx = c.getContext("2d");
	
	ctx.canvas.width  = window.innerWidth;
  	ctx.canvas.height = window.innerHeight;
	
	window.addEventListener( 'resize', onWindowResize, false );
	
	//create gradient for the bins
	var gradient = ctx.createLinearGradient(0, c.height - 300,0,window.innerHeight - 25);
	gradient.addColorStop(1,'#00f'); //black
	gradient.addColorStop(0.75,'#f00'); //red
	gradient.addColorStop(0.25,'#f00'); //yellow
	gradient.addColorStop(0,'#ffff00'); //white

	
	ctx.fillStyle = "#9c0001";
}

function onWindowResize()
{
	ctx.canvas.width  = window.innerWidth;
  	ctx.canvas.height = window.innerHeight;
	
	var containerHeight = $("#song_info_wrapper").height();
	var topVal = $(window).height() / 2 - containerHeight / 2; 
	$("#song_info_wrapper").css("top", topVal);
	console.log(topVal);
	
	if($(window).width() <= 500) {
		//TODO: not yet working
		$("#title").css("font-size", "40px");
	}
}

var audioBuffer;
var sourceNode;
function setupAudioNodes() {
	// setup a analyser
	analyser = context.createAnalyser();
	// create a buffer source node
	sourceNode = context.createBufferSource();	
	//connect source to analyser as link
	sourceNode.connect(analyser);
	// and connect source to destination
	sourceNode.connect(context.destination);
	//start updating
	rafID = window.requestAnimationFrame(updateVisualization);
}


function reset () {
	if (typeof sourceNode !== "undefined") {
		sourceNode.stop(0);		
	}
	if (typeof microphone !== "undefined") {
		microphone = null;
	}
}


function updateVisualization () {
        
	// get the average, bincount is fftsize / 2
	if (fileChosen || hasSetupUserMedia) {
		var array = new Uint8Array(analyser.frequencyBinCount);
		analyser.getByteFrequencyData(array);

		drawBars(array);
	}
       // setTextAnimation(array);
    

	rafID = window.requestAnimationFrame(updateVisualization);
}

function drawBars (array) {

	//just show bins with a value over the treshold
	var threshold = 0;
	// clear the current state
	ctx.clearRect(0, 0, c.width, c.height);
	//the max count of bins for the visualization
	var maxBinCount = array.length;
	//space between bins
	var space = 3;
        
	ctx.save();


	ctx.globalCompositeOperation='source-over';

	//console.log(maxBinCount); //--> 1024
	ctx.scale(0.5, 0.5);
	ctx.translate(window.innerWidth, window.innerHeight);
	ctx.fillStyle = "#fff";

	var bass = Math.floor(array[1]); //1Hz Frequenz 
	var radius = 0.45 * $(window).width() <= 450 ? -(bass * 0.25 + 0.45 * $(window).width()) : -(bass * 0.25 + 450);

	var bar_length_factor = 1;
	if ($(window).width() >= 785) {
		bar_length_factor = 1.0;
	}
	else if ($(window).width() < 785) {
		bar_length_factor = 1.5;
	}
	else if ($(window).width() < 500) {
		bar_length_factor = 20.0;
	}
	console.log($(window).width());
	//go over each bin
	for ( var i = 0; i < maxBinCount; i++ ){
		
		var value = array[i];
		if (value >= threshold) {			
			//draw bin
			//ctx.fillRect(0 + i * space, c.height - value, 2 , c.height);
                        //ctx.fillRect(i * space, c.height, 2, -value);
                        ctx.fillRect(0, radius, $(window).width() <= 450 ? 2 : 3, -value / bar_length_factor);
                        ctx.rotate((180 / 128) * Math.PI/180);   
		}
	}  
        
	for ( var i = 0; i < maxBinCount; i++ ){

		var value = array[i];
		if (value >= threshold) {				

			//draw bin
			//ctx.fillRect(0 + i * space, c.height - value, 2 , c.height);
						//ctx.fillRect(i * space, c.height, 2, -value);
						ctx.rotate(-(180 / 128) * Math.PI/180);
						ctx.fillRect(0, radius, $(window).width() <= 450 ? 2 : 3, -value / bar_length_factor);
		}
	} 
        
	for ( var i = 0; i < maxBinCount; i++ ){

		var value = array[i];
		if (value >= threshold) {				

			//draw bin
			//ctx.fillRect(0 + i * space, c.height - value, 2 , c.height);
						//ctx.fillRect(i * space, c.height, 2, -value);
						ctx.rotate((180 / 128) * Math.PI/180);
						ctx.fillRect(0, radius, $(window).width() <= 450 ? 2 : 3, -value / bar_length_factor);
		}
	} 
    
	ctx.restore();
}

//function setTextAnimation(array)
//{
//    var bass = Math.floor(array[1]); //4Hz Frequenz 
//    
//    
//    var fontSize = bass * 0.25 + 50;
//    
//    ctx.save();
//    ctx.globalCompositeOperation='destination-over';
//    ctx.fillStyle = "#fff";
//    ctx.filter = "blur(16px)";
//    
//    var neueFontsize = 70;
//    if (fontSize > neueFontsize) {
//        neueFontsize = fontSize;
//    }
//    
//    //ctx.font = neueFontsize.toString() + "px Arial";
//    if (navigator.userAgent.indexOf("Chrome/53.0.2764.0") > -1) { //besserer Look in Chrome Canary
//        console.log("Chrome Canary User Agent detected");
//        ctx.font="normal normal 300 350px Roboto";
//        if (filename !== undefined) {
//            ctx.fillText(filename, 0, c.height - 200);
//        }
//    }
//    ctx.filter = "blur(0px)";
//    //ctx.font="normal normal 100 " + neueFontsize.toString() + "px Roboto";
//    ctx.font="normal normal 100 70px Roboto";
//    if (filename !== undefined) {
//        ctx.fillText(filename, window.innerWidth / 2 - 125, c.height / 2);
//    }
//    ctx.restore();
//}


