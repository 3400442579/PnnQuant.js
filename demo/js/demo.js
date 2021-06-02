var worker = (typeof Worker !== "undefined") ? new Worker("./js/worker.js") : null;
var gl = webgl_detect();
var pngOnly = location.search.toLowerCase().indexOf('png') > -1;

const eventBus = {
	on(event, callback) {
		document.addEventListener(event, (e) => callback(e.detail));
	},
	dispatch(event, data) {
		document.dispatchEvent(new CustomEvent(event, { detail: data }));
	},
	remove(event, callback) {
		document.removeEventListener(event, callback);
	},
};

function baseName(src) {
	return src.split("/").pop().split(".");
}

if(!Uint8Array.prototype.slice){
	Uint8Array.prototype.slice = function(){
		return new Uint8Array(this).subarray(this.arguments);
	}
};

function toRGBPalette(palette) {
	var rgbPalette = [];
	for(var k=0; k < palette.length; ++k) {
		var r = (palette[k] & 0xff),
			g = (palette[k] >>> 8) & 0xff,
			b = (palette[k] >>> 16) & 0xff;
		rgbPalette.push(r << 16 | g << 8 | b);
	}
	return rgbPalette;
}

function componentToHex(c) {
	var hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
	return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function getPngUrl(ctx, can, pixel32s) {
	var imgd = ctx.createImageData(can.width, can.height);
	imgd.data.set(new Uint8Array(pixel32s.buffer));

	ctx.putImageData(imgd, 0, 0);
	return can.toDataURL();
}

function quantizeImage(gl, result, width) {		
	var pal = new Uint32Array(result.pal8);
	var can = document.createElement("canvas"),
	ctx = can.getContext("2d");

	can.width = width;
	can.height = Math.ceil(result.img8.length / width);

	ctx.imageSmoothingQuality = "high";
	
	eventBus.dispatch("scene", {boxWidth: (width - 10) + "px", background: result.transparent < 0 ? "none" : ""});
	eventBus.dispatch("palt", {pal: pal});
		
	if("image/gif" == result.type && !pngOnly) {
		try {
			var buf = new Uint8Array(width * can.height * 1.1 + 1000);
			var gf = new GifWriter(buf, width, can.height);
			var opts = {palette: toRGBPalette(pal)};
			if(result.transparent > -1)
				opts.transparent = result.transparent;
			gf.addFrame(0, 0, width, can.height, result.indexedPixels, opts);
			var data = buf.slice(0, gf.end());
			var reader = new FileReader();
			reader.onloadend = function() {					
				eventBus.dispatch("scene", {imgBase64: reader.result});
			};

			reader.readAsDataURL(new Blob([data], {type: result.type}));
			document.querySelector("#redu img").onerror = function () { 
				eventBus.dispatch("scene", {imgBase64: getPngUrl(ctx, can, result.img8)});
			};
		}
		catch(err) {
			eventBus.dispatch("scene", {imgBase64: getPngUrl(ctx, can, result.img8)});
			console.error(err);
		}
	}
	else
		eventBus.dispatch("scene", {imgBase64: getPngUrl(ctx, can, result.img8)});
}

function allowChange($orig) {
	eventBus.dispatch("app", {enabled: true});
	$orig.style.pointerEvents = "";
	document.querySelector("#palt").style.opacity = 1;
}

function doProcess(gl, ti, opts) {	
	if(worker != null)			
		worker.postMessage(opts);
	else {
		setTimeout(function(){
			ti.mark("reduced -> DOM", function() {
				var quant = opts.isHQ ? new PnnLABQuant(opts) : new PnnQuant(opts);
				quantizeImage(gl, { img8: quant.quantizeImage(), pal8: quant.getPalette(), indexedPixels: quant.getIndexedPixels(),
					transparent: quant.getTransparentIndex(), type: quant.getImgType() }, opts.width);
				
				allowChange(document.querySelector("#orig"));		
			});
		}, 0);
	}
}

function webgl_detect() {
    var canvas = document.createElement("canvas");
	if(canvas && canvas.getContext) {
        return canvas.getContext('webgl2') || canvas.getContext('webgl') ||
			canvas.getContext('webkit-3d') ||
			canvas.getContext('experimenal-webgl') ||
			canvas.getContext('moz-3d');
    }

    // WebGL not supported
    return false;
}

function readImageData(img, gl, opts) {
	var can = document.createElement("canvas");
	can.width = opts.width;
	can.height = opts.height;
	if(can.width == 0 || can.height == 0)
		return false;
	
	var ctx = can.getContext('2d');	
	
	try {
		if (gl) {			
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);			
			var pixels = new Uint8Array(can.width * can.height * 4);
			gl.readPixels(0, 0, can.width, can.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
			opts.pixels = new Uint32Array(pixels.buffer);
		}
		else {
			ctx.drawImage(img, 0, 0);
			var imgd = ctx.getImageData(0,0, can.width, can.height);
			ctx.setTransform(1, 0, 0, 1, 0.49, 0.49); // offset 0.49 pixel to handle sub pixeling
			opts.pixels = new Uint32Array(imgd.data.buffer);
		}
		return true;
	} catch(err) {
		alert(err);
		throw err;
	}
	return false;	
}

function drawImageScaled(img){
	if(!isExternal(img.src))
		return null;
	
	var maxWidth = 640, maxHeight = 512;
	var width = img.naturalWidth | img.width;
	var height = img.naturalHeight | img.height;
	if(width <= maxWidth && height <= maxHeight)
		return null;
	
	var can = document.createElement("canvas");	
	var ctx = can.getContext('2d');
	var ratio  = Math.min(maxWidth / width, maxHeight / height);
	can.width = width * ratio;
	can.height = height * ratio;
	ctx.drawImage(img, 0, 0, width, height,
        0, 0, can.width, can.height);
    return can.toDataURL();
}

function origLoad(imgChanged, opts) {
	var ti = new Timer();
	ti.start();
	if(imgChanged)			
		ti.mark("image loaded");
	
	var $orig = document.querySelector("#orig");	
	if($orig.style.pointerEvents != "none") {
		eventBus.dispatch("app", {enabled: false});
		document.querySelector("#palt").style.opacity = 0;
		
		var srcImg = $orig.querySelector("img");
		var srcUrl = drawImageScaled(srcImg);
		if(srcUrl != null) {
			eventBus.dispatch("scene", {display: "none", imgUrl: srcUrl});
			return;
		}
		
		if(opts == null) {
			eventBus.dispatch("origLoad", {callback: origLoad, imgChanged: false});
			return;
		}		
		
		srcImg.style.border = "";
		$orig.style.pointerEvents = "none";
		var id = srcImg.name;		
		ti.mark("'" + id + "' -> DOM", function() {					
			opts.width = srcImg.naturalWidth | srcImg.width;
			opts.height = srcImg.naturalHeight | srcImg.height;
			eventBus.dispatch("scene", {boxWidth: (opts.width - 10) + "px", display: "block"});							
		});
		
		if(worker != null) {			
			worker.onmessage = function(e) {
				ti.mark("reduced -> DOM", function() {
					quantizeImage(gl, e.data, opts.width);
					allowChange(document.querySelector("#orig"));
				});
			}
		}

		if(readImageData(srcImg, gl, opts))					
			doProcess(gl, ti, opts);
		else {
			ti.mark("invalid image", function() {				
				allowChange($orig);
			});
		}
	}
}

function createImage(id, imgUrl, ev) {		
	eventBus.dispatch("scene", {imgName: id, imgUrl: imgUrl});	
}

function process(imgUrl) {	
	eventBus.dispatch("app", {enabled: false});
	var id = baseName(imgUrl)[0];
	createImage(id, imgUrl, null);
}

function loadImage(id, blob, ev) {	
	var reader = new FileReader();
	reader.onloadend = function() {					
		createImage(id, reader.result, ev);
	};

	reader.readAsDataURL(blob);
}

function isExternal(url) {
    var match = url.match(/^([^:\/?#]+:)?(?:\/\/([^\/?#]*))?([^?#]+)?(\?[^#]*)?(#.*)?/);
    if (typeof match[1] === "string" && match[1].length > 0 && match[1].toLowerCase() !== location.protocol)
		return true;
    if (typeof match[2] === "string" && match[2].length > 0 && match[2].replace(new RegExp(":("+{"http:":80,"https:":443}[location.protocol]+")?$"), "") !== location.host)
		return true;
    return false;
}

function download(imgUrl, ev) {
	if(!isExternal(imgUrl)) {
		var rootUrl = location.href.substr(0, location.href.lastIndexOf("/") + 1);
		var imgSrc = imgUrl.replace(rootUrl, "");
		var srcSet = document.querySelector("img[srcset][src$='" + imgSrc + "']");
		imgUrl = srcSet != null ? srcSet.srcset.split(",").pop().trim().split(" ")[0] : imgSrc;
		process(imgUrl);
		document.querySelector("#orig img").style.border = "";
		return;
	}

	imgUrl = imgUrl.replace("http:", location.protocol);
	
	var svgTag = "<svg ";
	var svgIndex = imgUrl.indexOf(svgTag);
	if(svgIndex > -1) {
		var svg = imgUrl.substring(svgIndex).split("\"").join("'");
		if(svg.indexOf(" xmlns=") < 0)
			svg = svg.replace(svgTag, svgTag + "xmlns='http://www.w3.org/2000/svg' ");
		imgUrl = "data:image/svg+xml;utf8," + svg;
	}	
	if(imgUrl.indexOf("data:") == 0) {
		createImage(new Date().getTime(), imgUrl, ev);
		return;
	}
	
	var id = baseName(imgUrl)[0];

	var xhr = new XMLHttpRequest();	
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if(xhr.status == 200)
				loadImage(id, new Blob([xhr.response]), ev);					
			else {
				document.querySelector("#orig img").style.border = "";
				if(document.querySelector("#wrapfabtest").offsetHeight <= 0)
					alert("AdBlock Detected");
			}					
		}				
	};
	xhr.open('GET', imgUrl);
	xhr.responseType = "arraybuffer";
	xhr.send();
}

function pasteUrl(imgUrl) {
	if(/<.+>/g.exec(imgUrl)) {
		var domContext = document.createElement("div");
		domContext.innerHTML = imgUrl;
		var hyperlink = domContext.querySelector("img");
		if(hyperlink != null)
			imgUrl = hyperlink.srcset ? hyperlink.srcset.split(",").pop().trim().split(" ")[0] : hyperlink.src;
		else {
			hyperlink = domContext.querySelector("a");
			if(hyperlink != null)
				imgUrl = hyperlink.href;
		}
	}
	
	if(imgUrl.trim() != "")
		download(imgUrl, null);				
}

/**
 * This handler retrieves the images from the clipboard as a base64 string
 * 
 * @param pasteEvent 
 */
function retrieveImageFromClipboardAsBase64(pasteEvent){
	var clipboardData = pasteEvent.clipboardData || pasteEvent.originalEvent.clipboardData;
	if(!clipboardData || document.querySelector("#btn_upd").disabled)
		return;
	
    var items = clipboardData.items;
    if(items == undefined)
		return;

    for (var i = 0; i < items.length; ++i) {
        // Skip content if not image
        if (items[i].type.indexOf("image") == -1)
			continue;
        // Retrieve image on clipboard as blob
        var blob = items[i].getAsFile();

        loadImage(new Date().getTime(), blob, null);
		return;
    }
	
	for (var i = 0; i < items.length; ++i) {
        // Skip content if not image
        if (items[i].kind != "string")
			continue;

        items[i].getAsString(pasteUrl);
    }
}

function keyBoardListener(evt) {
    if (evt.ctrlKey) {
		switch(evt.keyCode) {
            case 86: // v
                handlePaste();
                break;
        }
    }
}

function handlePaste(){
	if(document.querySelector("#btn_upd").disabled)
		return;

	var items = window.clipboardData.files;
	if (!items.length) {
		var imgUrl = window.clipboardData.getData('Text');
		pasteUrl(imgUrl);
		return;
	}
	
    for (var i = 0; i < items.length; ++i) {
        // Skip content if not image
        if (items[i].type.indexOf("image") == -1)
			continue;
		// Retrieve image on clipboard as blob
        var blob = items[i].getAsFile();
		
        loadImage(new Date().getTime(), blob, null);
		return;
    }	
}

document.addEventListener("DOMContentLoaded", function(){	
	if (gl) {
		gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);			
		
		// Make a framebuffer
		var fb = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
		
		var tex = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, tex);
		// Attach the texture to the framebuffer
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
	}
		
	if(window.clipboardData)
		document.body.addEventListener("keyup", keyBoardListener);
	else
		document.body.onpaste = retrieveImageFromClipboardAsBase64;	
	
	document.querySelectorAll("img.th, #readme").forEach(element => {
		element.onmouseenter = function() {
			const disabled = document.querySelector("#btn_upd").disabled;
			document.querySelector("#footer").style.zIndex = disabled ? "1" : "-1";
		};
		element.onmouseleave = function() {
			document.querySelector("#footer").style.zIndex = "1";
		};
	});
	
	process("img/SE5x9.jpg");
});
