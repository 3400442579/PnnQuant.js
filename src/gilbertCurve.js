/* Generalized Hilbert ("gilbert") space-filling curve for rectangular domains of arbitrary (non-power of two) sizes.
Copyright (c) 2021 Miller Cy Chan
* A general rectangle with a known orientation is split into three regions ("up", "right", "down"), for which the function calls itself recursively, until a trivial path can be produced. */

(function(){
	function GilbertCurve(opts) {			
		this.opts = opts || {};
		this.qPixels = [];
	}
	
	if(!Math.clamp) {
		Math.clamp = function(a,b,c){
			return this.max(b, this.min(c, a));
		};
	}
	
	function sign(x) {
    	if(x < 0)
    		return -1;
    	return (x > 0) ? 1 : 0;
    }
		
	function ErrorBox(pixel) {
		var r = (pixel & 0xff),
			g = (pixel >>> 8) & 0xff,
			b = (pixel >>> 16) & 0xff,
			a = (pixel >>> 24) & 0xff;
		this.p = [r, g, b, a];
	}
	
	var ditherFn, getColorIndex, width, height, pixels, palette, nMaxColors;
	
	var qPixels;
	var errorq = [];
	var weights = [];
	var lookup;
    
	var DITHER_MAX = 9;
	var BLOCK_SIZE = 8;	
	
	function ditherPixel(x, y)
	{
	    var bidx = x + y * width;
		var pixel = pixels[bidx];
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
			qPixels[bidx] = lookup[offset] - 1;
		}
		else
			qPixels[bidx] = ditherFn(palette, nMaxColors, c2);

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
			
			error.p[j] /= 3;				
		}
		errorq.push(error);
	}
    
    function generate2d(x, y, ax, ay, bx, by) {    	
    	var w = Math.abs(ax + ay);
    	var h = Math.abs(bx + by);
    	var dax = sign(ax);
    	var day = sign(ay);
    	var dbx = sign(bx);
    	var dby = sign(by);

    	if (h == 1) {
    		for (var i = 0; i < w; ++i){
    			ditherPixel(x, y);
    			x += dax;
    			y += day;
    		}
    		return;
    	}

    	if (w == 1) {
    		for (var i = 0; i < h; ++i){
    			ditherPixel(x, y);
    			x += dbx;
    			y += dby;
    		}
    		return;
    	}

    	var ax2 = (ax / 2) | 0;
    	var ay2 = (ay / 2) | 0;
    	var bx2 = (bx / 2) | 0;
    	var by2 = (by / 2) | 0;

    	var w2 = Math.abs(ax2 + ay2);
    	var h2 = Math.abs(bx2 + by2);

    	if (2 * w > 3 * h) {
    		if ((w2 % 2) != 0 && w > 2) {
    			ax2 += dax;
    			ay2 += day;
    		}    		
    		generate2d(x, y, ax2, ay2, bx, by);
    		generate2d(x + ax2, y + ay2, ax - ax2, ay - ay2, bx, by);
    		return;
    	}
    	
		if ((h2 % 2) != 0 && h > 2) {
			bx2 += dbx;
			by2 += dby;
		}
		
		generate2d(x, y, bx2, by2, ax2, ay2);
		generate2d(x + bx2, y + by2, ax, ay, bx - bx2, by - by2);
		generate2d(x + (ax - dax) + (bx2 - dbx), y + (ay - day) + (by2 - dby), -bx2, -by2, -(ax - ax2), -(ay - ay2));    		
    }
	
	function processImagePixels() {
		var qPixel32s = new Uint32Array(qPixels.length);
		for (var i = 0; i < qPixels.length; ++i)
			qPixel32s[i] = palette[qPixels[i]];		

		return qPixel32s;
	}
    
    GilbertCurve.prototype.dither = function()
    {    	
    	/* Dithers all pixels of the image in sequence using
         * the Gilbert path, and distributes the error in
         * a sequence of 9 pixels.
         */
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
		
		ditherFn = this.opts.ditherFn;
		getColorIndex = this.opts.getColorIndex;
		width = this.opts.width;
		height = this.opts.height;
		pixels = this.opts.pixels;
		palette = this.opts.palette;
		nMaxColors = this.opts.colors;
		qPixels = nMaxColors > 256 ? new Uint16Array(pixels.length) : new Uint8Array(pixels.length);	
        
        if (width >= height)
    		generate2d(0, 0, width, 0, 0, height);
    	else
    		generate2d(0, 0, 0, height, width, 0);
		
        this.qPixels = qPixels;

		if(!this.opts.dithering)
			return qPixels;
		
		return processImagePixels();
    }
	
	GilbertCurve.prototype.getIndexedPixels = function getIndexedPixels() {
		return this.qPixels;
	};
	
	GilbertCurve.prototype.getResult = function getResult() {
		var hc = this;
		return new Promise(function(resolve, reject) {
			if(hc.opts.dithering)
				resolve({ img8: hc.dither(), indexedPixels: hc.getIndexedPixels() });
			else
				resolve({ indexedPixels: hc.dither() });
		});
	};

	// expose
	this.GilbertCurve = GilbertCurve;

	// expose to commonJS
	if (typeof module !== 'undefined' && module.exports) {
		module.exports = GilbertCurve;
	}

}).call(this);