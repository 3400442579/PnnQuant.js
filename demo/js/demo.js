var cfg_edited = false;
var worker = (typeof Worker !== "undefined") ? new Worker("./js/worker.js") : null;
var pngOnly = location.search.toLowerCase().indexOf('png') > -1;

var dflt_opts = {
	colors: 256,
	dithering: true,
};

function baseName(src) {
	return src.split("/").pop().split(".");
}

function getOpts(id) {
	if (cfg_edited) {
		var opts = {};

		for (var i in dflt_opts) {
			var $el = document.querySelector("#" + i),
				typ = $el.getAttribute("type"),
				val = $el.value,
				num = parseFloat(val);

			opts[i] = typ == "checkbox" ? $el.getAttribute("checked") : isNaN(num) ? val : num;
		}

		Object.assign(opts, dflt_opts);
	}
	else
		var opts = dflt_opts;

	for (var i in dflt_opts) {
		var el = document.querySelector("#" + i);
		if(el) {
			el.value = opts[i];
			el.size = el.value.length;
		}
	}

	return opts;
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

function getPngUrl(ctx, can, pixel32s) {
	var imgd = ctx.createImageData(can.width, can.height);
	imgd.data.set(new Uint8Array(pixel32s.buffer));

	ctx.putImageData(imgd, 0, 0);
	return can.toDataURL();
}

function drawPalette(idxi32, width, maxWidth, maxHeight, cols) {
	if(!maxWidth)
		maxWidth = width;

	if(cols > idxi32.length)
		cols = idxi32.length;
	var rows = Math.floor(idxi32.length / cols);
	var ratioX = Math.floor(100.0 / cols);
	var ratioY = Math.floor(100.0 / rows);
	if((ratioY * maxHeight) > (ratioX * maxWidth))
		ratioY = ratioX * maxWidth / maxHeight;
	
	var divContent = "";
	for(var k = 0; k < idxi32.length; ++k) {
		var r = (idxi32[k] & 0xff),
			g = (idxi32[k] >>> 8) & 0xff,
			b = (idxi32[k] >>> 16) & 0xff,
			a = (idxi32[k] >>> 24) & 0xff;
		divContent += "<div style='background-color:rgba(" + r + ", " + g + ", " + b + ", " + a / 255.0 + "); float: left; ";
		divContent += "width: " + ratioX + "%; height: " + ratioY + "%;'></div>";		
	}
	return divContent;
}

function quantizeImage(gl, result, width) {				
	var $redu = document.querySelector("#redu");
	var img = $redu.querySelector("img");
	if(!img) {
		$redu.innerHTML = "<h4>Quantized</h4>";	
		
		var img = document.createElement("img");
		$redu.appendChild(img);
	}
	document.querySelectorAll("#orig, #redu").forEach(element => 
		element.style.background = result.transparent < 0 ? "none" : ""
	);
		
	document.querySelectorAll("#orig h4, #redu h4").forEach(element => 
		element.style.width = (width - 10) + "px"
	);
		
	var pal = new Uint32Array(result.pal8);
	var can = document.createElement("canvas"),
	ctx = can.getContext("2d");

	can.width = width;
	can.height = Math.ceil(result.img8.length / width);

	ctx.imageSmoothingQuality = "high";
	
	var $palt = document.querySelector("#palt");	
	var colorCells = drawPalette(pal, pal.length, $palt.offsetWidth, $palt.offsetHeight, 32);	
	$palt.innerHTML = colorCells;
		
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
				img.src = reader.result;
			};

			reader.readAsDataURL(new Blob([data], {type: result.type}));
			img.onerror = function () { 
				img.src = getPngUrl(ctx, can, result.img8);
			};
		}
		catch(err) {
			img.src = getPngUrl(ctx, can, result.img8);
			console.error(err);
		}
	}
	else
		img.src = getPngUrl(ctx, can, result.img8);
}

function allowChange($orig) {
	var btn_upd = document.querySelector("#btn_upd");
	btn_upd.removeAttribute("disabled");
	btn_upd.textContent = "Update";
	$orig.style.pointerEvents = "";
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

function dragLeave(ev) {
	if(ev)
		ev.target.style.border = "";
	else
		document.querySelector("#orig img").style.border = "";
}

function allowDrop(ev) {
	ev.stopPropagation();
	ev.preventDefault();
	
	ev.target.style.border = "4px dashed silver";
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

function createImage(id, imgUrl, ev) {
	var ti = new Timer();
	ti.start();	
	ti.mark("image loaded");
	var img = document.querySelector("#orig img");
	if(!img) {		
		var gl = webgl_detect();
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
		
		img = document.createElement("img");
		img.crossOrigin = '';	
		img.onload = function() {			
			var $orig = document.querySelector("#orig");
			if($orig.style.pointerEvents != "none") {
				var srcImg = this;
				var srcUrl = drawImageScaled(srcImg);
				if(srcUrl != null) {
					srcImg.style.display = "none";
					srcImg.src = srcUrl;
					return;
				}
				
				var id = srcImg.name;
				var opts = getOpts(id);				
				
				$orig.style.pointerEvents = "none";
				$orig.innerHTML = "<h4>Original</h4>";
				$orig.appendChild(srcImg);
				srcImg.style.display = "block";
				ti.start();				
				ti.mark("'" + id + "' -> DOM", function() {					
					opts.isHQ = document.querySelector("#radHQ").checked;
					opts.width = srcImg.naturalWidth | srcImg.width;
					opts.height = srcImg.naturalHeight | srcImg.height;
					$orig.querySelector("h4").style.width = (opts.width - 10) + "px";							
				});
				
				if(worker != null) {			
					worker.onmessage = function(e) {
						ti.mark("reduced -> DOM", function() {
							quantizeImage(gl, e.data, opts.width);
							allowChange($orig);
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
				
				dragLeave(ev);
			}
		};
		
		img.onerror = function () {
			var $orig = document.querySelector("#orig");
			allowChange($orig);
		};
	}
	
	img.name = id;
	img.src = imgUrl;	
}

function process(imgUrl) {		
	var btn_upd = document.querySelector("#btn_upd");
	btn_upd.setAttribute("disabled", "disabled");
	btn_upd.textContent = "Please wait...";
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
		imgUrl = srcSet != null ? srcSet.getAttribute("srcset").split(",").pop().trim().split(" ")[0] : imgSrc;
		process(imgUrl);
		dragLeave(ev);
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
				dragLeave(ev);
				if(document.querySelector("#wrapfabtest").offsetHeight <= 0)
					alert("AdBlock Detected");
			}					
		}				
	};
	xhr.open('GET', imgUrl);
	xhr.responseType = "arraybuffer";
	xhr.send();
}

function drop(ev) {
	if(document.querySelector("#btn_upd").disabled)
		return;
	
	ev.stopPropagation();
	ev.preventDefault();

	var dt = ev.dataTransfer;
	
	if(dt.files == null || dt.files.length <= 0) {
		var imgUrl = dt.getData("text");
		try {
			var dropContext = document.querySelector("div").appendChild(dt.getData("text/html"));
			var img = dropContext.querySelector("img");
			if(img instanceof HTMLImageElement)
				imgUrl = img.srcset ? img.srcset.split(",").pop().trim().split(" ")[0] : img.src;
		}
		catch(err) {
		}
		
		download(imgUrl, ev);
		return;
	}
	
	var file = dt.files[0];
	var imageType = /image.*/;

	if (file.type.match(imageType)) {
		var btn_upd = document.querySelector("#btn_upd");
		btn_upd.setAttribute("disabled", "disabled");
		btn_upd.textContent = "Please wait...";
		loadImage(file.name, file, ev);
	}
}

function pasteUrl(imgUrl) {
	if(/<.+>/g.exec(imgUrl)) {
		var domContext = document.createElement("div");
		domContext.innerHTML = imgUrl;
		var hyperlink = domContext.querySelector("img");
		if(hyperlink != null)
			imgUrl = hyperlink.getAttribute("srcset") ? hyperlink.getAttribute("srcset").split(",").pop().trim().split(" ")[0] : hyperlink.getAttribute("src");
		else {
			hyperlink = domContext.querySelector("a");
			if(hyperlink != null)
				imgUrl = hyperlink.getAttribute("href");
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

document.querySelectorAll("input, textarea, select").forEach(input => {
	input.onchange = function() {
		cfg_edited = true;
	};
});

document.addEventListener("DOMContentLoaded", function(){
	if(window.clipboardData)
		document.body.addEventListener("keyup", keyBoardListener);
	else
		document.body.onpaste = retrieveImageFromClipboardAsBase64;
	
	document.querySelector("#orig").nextSibling.onchange = function(ev) {
		var btn_upd = document.querySelector("#btn_upd");
		btn_upd.setAttribute("disabled", "disabled");
		btn_upd.textContent = "Please wait...";
		var id = baseName(this.files[0].name)[0];
		loadImage(id, this.files[0], ev);
	};
	document.querySelector("#orig").onclick = function() {
		this.nextSibling.click();
	};
	
	document.querySelector("img.th").style.zIndex = "2";
	
	document.querySelectorAll("img.th, #readme").forEach(element => {
		element.addEventListener("mouseover", function() {
			document.querySelector("#footer").style.zIndex = document.querySelector("#btn_upd").disabled ? "1" : "-1";
		}, {once : true});
		element.onmouseout = function() {
			document.querySelector("#footer").style.zIndex = "1";
		};
	});
	process("img/SE5x9.jpg");
});
