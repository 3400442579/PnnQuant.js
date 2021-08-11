importScripts('hilbertCurve.min.js');
importScripts('blueNoise.min.js');
importScripts('pnnquant.min.js');
importScripts('pnnLABquant.min.js');

function quantizeImage(opts) {				
	var quant = opts.isHQ ? new PnnLABQuant(opts) : new PnnQuant(opts);	
	
	opts.ditherFn = quant.getDitherFn();
	opts.getColorIndex = quant.getColorIndex;
	
	if(opts.isHQ) {			
		if(opts.colors < 64) {
			if(opts.dithering)
				return quant.getResult();
			
			return quant.getResult().then(function(result) {
				opts.palette = new Uint32Array(result.pal8);
				opts.indexedPixels = result.indexedPixels;				
				return new BlueNoise(opts).getResult();
			});				
		}

		opts.paletteOnly = true;
		return quant.getResult().then(function(result) {
			opts.palette = result.pal8;
			opts.transparent = result.transparent;
			opts.type = result.type;
			
			if(opts.dithering)
				return new HilbertCurve(opts).getResult();
			
			return new HilbertCurve(opts).getResult().then(function(hc) {					
				opts.indexedPixels = hc.indexedPixels;
				return new BlueNoise(opts).getResult();
			});				
		});		
	}

	if(opts.dithering)
		return quant.getResult();
	
	return quant.getResult().then(function(result) {
		opts.palette = new Uint32Array(result.pal8);
		opts.indexedPixels = result.indexedPixels;
		opts.transparent = result.transparent;
		opts.type = result.type;		
		return new BlueNoise(opts).getResult();
	});
}

onmessage = function(e) {	
	quantizeImage(e.data).then(function(result) {
		postMessage(result);
	});	
}