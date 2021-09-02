/* The Hilbert curve is a space filling curve that visits every point in a square grid with a size of any other power of 2.
Copyright (c) 2021 Miller Cy Chan
* It was first described by David Hilbert in 1892. Applications of the Hilbert curve are in image processing: especially image compression and dithering. */

(function(){
	function HilbertCurve(opts) {			
		this.opts = opts || {};
		this.qPixels = [];
	}
	
	if(!Math.clamp) {
		Math.clamp = function(a,b,c){
			return this.max(b, this.min(c, a));
		};
	}
	
	var LEFT = 4, RIGHT = 6, DOWN = 2, UP = 8;
		
	function ErrorBox(pixel) {
		var r = (pixel & 0xff),
			g = (pixel >>> 8) & 0xff,
			b = (pixel >>> 16) & 0xff,
			a = (pixel >>> 24) & 0xff;
		this.p = [r, g, b, a];
	}
	
	var x, y;
	var ditherFn, getColorIndex, width, height, pixels, palette, nMaxColors;
	
	var qPixels;
	var errorq = [];
	var weights = [];
	var lookup;
    
	var DITHER_MAX = 16;
	var BLOCK_SIZE = 256;	
	
	function ditherCurrentPixel()
	{
	    if(x >= 0 && y >= 0 && x < width && y < height) {
	    	var pixel = pixels[x + y * width];
	    	var error = new ErrorBox(pixel);	    	
	        for(var c = 0; c < DITHER_MAX; ++c) {
	        	var eb = errorq[c];
	        	for(var j = 0; j < eb.p.length; ++j)
	        		error.p[j] += eb.p[j] * weights[c];
	        }

	        var r_pix = Math.clamp(error.p[0], 0, 0xff);
	        var g_pix = Math.clamp(error.p[1], 0, 0xff);
	        var b_pix = Math.clamp(error.p[2], 0, 0xff);
	        var a_pix = Math.clamp(error.p[3], 0, 0xff);
	        
	        var c2 = (a_pix << 24) | (b_pix << 16) | (g_pix <<  8) | r_pix;			
			if(nMaxColors < 64) {
				var offset = getColorIndex(a_pix, r_pix, g_pix, b_pix);
				if (lookup[offset] == 0)
					lookup[offset] = ((pixel >>> 24) & 0xff == 0) ? 1 : ditherFn(palette, nMaxColors, c2) + 1;
				qPixels[x + y * width] = lookup[offset] - 1;
			}
			else
				qPixels[x + y * width] = ditherFn(palette, nMaxColors, c2);

	        errorq.shift();
	        c2 = palette[qPixels[x + y * width]];
			var r2 = (c2 & 0xff),
				g2 = (c2 >>> 8) & 0xff,
				b2 = (c2 >>> 16) & 0xff,
				a2 = (c2 >>> 24) & 0xff;
			
	        error.p[0] = r_pix - r2;
	        error.p[1] = g_pix - g2;
	        error.p[2] = b_pix - b2;
	        error.p[3] = a_pix - a2;
	        
	        for(var j = 0; j < error.p.length; ++j) {
	        	if(Math.abs(error.p[j]) < DITHER_MAX)
					continue;
				
				error.p[j] = 0;				
	        }
	        errorq.push(error);
	    }
	}
    
    function navTo(dir)
	{
    	ditherCurrentPixel();
		switch(dir)
        {
            case LEFT:
            	--x;
            	break;
            case RIGHT:
            	++x;
            	break;
            case UP:
            	--y;
            	break;
            case DOWN:
            	++y;
            	break;
        }
	}
	
    function curve(level, a, b, c, d, e, f, g)
    {
		iter(level-1, a);
		navTo(e);
		iter(level-1, b);
		navTo(f);
        iter(level-1, c);
        navTo(g);
        iter(level-1, d);
    }

    function iter(level, dir) {
    	if(level <= 0)
    		return;    	

        switch(dir)
        {
            case LEFT:
            	curve(level, UP,LEFT,LEFT,DOWN, RIGHT,DOWN,LEFT);
            	break;
            case RIGHT:
            	curve(level, DOWN,RIGHT,RIGHT,UP, LEFT,UP,RIGHT);
            	break;
            case UP:
            	curve(level, LEFT,UP,UP,RIGHT, DOWN,RIGHT,UP);
            	break;
            case DOWN:
            	curve(level, RIGHT,DOWN,DOWN,LEFT, UP,LEFT,DOWN);
            	break;
        }
    }
	
	function processImagePixels() {
		var qPixel32s = new Uint32Array(qPixels.length);
		for (var i = 0; i < qPixels.length; ++i)
			qPixel32s[i] = palette[qPixels[i]];		

		return qPixel32s;
	}
    
    HilbertCurve.prototype.dither = function()
    {    	
    	/* Dithers all pixels of the image in sequence using
         * the Hilbert path, and distributes the error in
         * a sequence of 16 pixels.
         */
        x = y = 0;
		errorq = [];
		weights = [];
		lookup = new Uint32Array(65536);
        var weightRatio = Math.pow(BLOCK_SIZE + 1,  1 / (DITHER_MAX - 1));
        var weight = 1, sumweight = 0;
        for(var c = 0; c < DITHER_MAX; ++c)
        {
            errorq.push(new ErrorBox(0));
            sumweight += (weights[DITHER_MAX - c - 1] = 1.0 / weight);
            weight *= weightRatio;
        }
        
        weight = 0; /* Normalize */
        for(var c = 0; c < DITHER_MAX; ++c)
            weight += (weights[c] /= sumweight);
        weights[0] += 1 - weight;
        /* Walk the path. */
        var i = Math.max(this.opts.width, this.opts.height), depth = 0;
        while(i > 0) {
        	++depth;
        	i >>= 1;
        }
		
		ditherFn = this.opts.ditherFn;
		getColorIndex = this.opts.getColorIndex;
		width = this.opts.width;
		height = this.opts.height;
		pixels = this.opts.pixels;
		palette = this.opts.palette;
		nMaxColors = this.opts.colors;
		qPixels = nMaxColors > 256 ? new Uint16Array(pixels.length) : new Uint8Array(pixels.length);	
        
        iter(depth, UP);
        ditherCurrentPixel();      
        this.qPixels = qPixels;

		if(!this.opts.dithering)
			return qPixels;
		
		return processImagePixels();
    }
	
	HilbertCurve.prototype.getIndexedPixels = function getIndexedPixels() {
		return this.qPixels;
	};
	
	HilbertCurve.prototype.getResult = function getResult() {
		var hc = this;
		return new Promise(function(resolve, reject) {
			if(hc.opts.dithering)
				resolve({ img8: hc.dither(), indexedPixels: hc.getIndexedPixels() });
			else
				resolve({ indexedPixels: hc.dither() });
		});
	};

	// expose
	this.HilbertCurve = HilbertCurve;

	// expose to commonJS
	if (typeof module !== 'undefined' && module.exports) {
		module.exports = HilbertCurve;
	}

}).call(this);