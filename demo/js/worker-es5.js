importScripts('gilbertCurve.min.js');
importScripts('blueNoise.min.js');
importScripts('pnnquant.min.js');
importScripts('pnnLABquant.min.js');

function quantizeImage(opts) {				
	var quant = opts.isHQ ? new PnnLABQuant(opts) : new PnnQuant(opts);	
	
	var pal8;
	opts.ditherFn = quant.getDitherFn();
	opts.getColorIndex = quant.getColorIndex;
	
	if(opts.colors < 64 && opts.colors > 32) {
		if(opts.dithering)
			return { img8: quant.quantizeImage(), pal8: quant.getPalette(), indexedPixels: quant.getIndexedPixels(), transparent: quant.getTransparentIndex(), type: quant.getImgType() };
		
		quant.quantizeImage();
		pal8 = quant.getPalette();
		opts.palette = new Uint32Array(pal8);
		opts.indexedPixels = quant.getIndexedPixels();
	}
	else {
		opts.paletteOnly = true;
		opts.palette = pal8 = quant.quantizeImage();
		var hc = new GilbertCurve(opts);
		if(opts.dithering)
			return { img8: hc.dither(), pal8: pal8, indexedPixels: hc.getIndexedPixels(), transparent: quant.getTransparentIndex(), type: quant.getImgType() };
		opts.indexedPixels = hc.dither();
	}
	
	var bn = new BlueNoise(opts);
	return { img8: bn.dither(), pal8: pal8, indexedPixels: bn.getIndexedPixels(), transparent: quant.getTransparentIndex(), type: quant.getImgType() };
}

onmessage = function(e) {	
	var result = quantizeImage(e.data);
	postMessage(result);
}