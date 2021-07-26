importScripts('hilbertCurve.min.js');
importScripts('blueNoise.min.js');
importScripts('pnnquant.min.js');
importScripts('pnnLABquant.min.js');

function quantizeImage(opts) {				
	var quant = opts.isHQ ? new PnnLABQuant(opts) : new PnnQuant(opts);
	if(opts.isHQ) {
		opts.ditherFn = quant.getDitherFn();
		opts.getColorIndex = quant.getColorIndex;					
		if(opts.colors < 64) {
			opts.paletteOnly = false;
			quant.quantizeImage();			
			opts.palette = new Uint32Array(quant.getPalette());
			opts.indexedPixels = quant.getIndexedPixels();
		}
		else {
			opts.paletteOnly = true;
			opts.palette = quant.quantizeImage();	
			opts.indexedPixels = new HilbertCurve(opts).dither();
		}
		var bn = new BlueNoise(opts);
		return { img8: bn.dither(), pal8: opts.palette, indexedPixels: bn.getIndexedPixels(), transparent: quant.getTransparentIndex(), type: quant.getImgType() };
	}
	return { img8: quant.quantizeImage(), pal8: quant.getPalette(), indexedPixels: quant.getIndexedPixels(), transparent: quant.getTransparentIndex(), type: quant.getImgType() };
}

onmessage = function(e) {	
	var result = quantizeImage(e.data);
	postMessage(result);
}