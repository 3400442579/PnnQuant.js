class Scene extends preact.Component {
	constructor(props) {
		super(props);
		this.state = { background: "none", boxWidth: 0, transparent: -1,
			display: "none", imgName: "", imgBase64: "", imgUrl: ""
		};
		this.orig = preact.createRef();
	}
	
	componentDidMount() {
		eventBus.on("scene", data => this.setState(data));
		eventBus.on("process", data => {
			var imgUrl = this.orig.current.src;
			process(imgUrl);
			origLoad(false, data);
		});
	}
	componentWillUnmount() {
		eventBus.remove("scene");
	}
  
	onChange = ev => {
	    eventBus.dispatch("app", {enabled: false});
		const imgPath = ev.target.files[0];
		var id = baseName(imgPath.name)[0];
		loadImage(id, imgPath, ev);
	}
	onClick = ev => {
	    ev.target.parentNode.nextSibling.click();
	}
	onDrop = ev => {
		ev.stopPropagation();
		ev.preventDefault();
		
		const enabled = this.props.isEnabled();
		if(!enabled)
			return;

		var dt = ev.dataTransfer;		
		if(dt.files == null || dt.files.length <= 0) {
			var imgUrl = dt.getData("text");
			if(imgUrl == ev.target.src) {
				ev.target.style.border = "";
				return;
			}
			
			const mineType = "text/html";
			try {
				var dropContext = new DOMParser().parseFromString(dt.getData(mineType), mineType);
				var img = dropContext.querySelector("img");
				if(img instanceof HTMLImageElement)
					imgUrl = img.srcset ? img.srcset.split(",").pop().trim().split(" ")[0] : img.src;
			}
			catch(err) {
				console.error(err);
			}
			
			download(imgUrl, ev);
			return;
		}
		
		var file = dt.files[0];
		var imageType = /image.*/;

		if (file.type.match(imageType)) {
			eventBus.dispatch("app", {enabled: false});
			loadImage(file.name, file, ev);
		}
	}
	onDragOver = ev => {
	    ev.stopPropagation();
		ev.preventDefault();
		
		ev.target.style.border = "4px dashed silver";
	}
	onDragLeave = ev => {
	    if(ev)
			ev.target.style.border = "";
		else
			this.orig.current.style.border = "";
	}
	onError = ev => {
	    var $orig = this.orig.current;
		allowChange($orig);
	}
	onLoad = ev => {
	    origLoad(true, null);
	}
	
	render() {
		const {background, boxWidth, display, imgName, imgUrl, imgBase64} = this.state;
		const reduDisplay = this.props.isEnabled() ? display : "none";
		return preact.createElement("div", {id: "scene", style: {overflow: "auto"}},
			[
				preact.createElement("div", {key: "box1", className: "box", style: {background: background, margin: "0 auto", maxWidth: "49%", maxHeight: "35%"}}, 
					[
						preact.createElement("div", {key: "orig", id: "orig", style: {display: display, overflow: "auto"},
							onClick: this.onClick, onDrop: this.onDrop, 
							onDragOver: this.onDragOver, onDragLeave: this.onDragLeave }, 							
							[
								preact.createElement("h4", {style: {width: boxWidth} }, "Original"),
								preact.createElement("img", {key: "origImg", crossOrigin: "", draggable: false, ref: this.orig, 
									name: imgName, src: imgUrl,
									onError: this.onError, onLoad: this.onLoad
								})
							]),
						preact.createElement("input", {key: "file", type: "file", style: {display: "none", width: 0},
							onChange: this.onChange
						})
					]
				),
				preact.createElement("div", {key: "box2",  className: "box", style: {background: background, margin: "0 auto", maxWidth: "49%", maxHeight: "35%"}}, 
					preact.createElement("div", {key: "redu", id: "redu", style: {display: reduDisplay, overflow: "auto"}},
						[
							preact.createElement("h4", {style: {width: boxWidth} }, "Quantized"),
							preact.createElement("img", {key: "reducedImg", src: imgBase64 })
						])
				)
			]
		);
	}
}

class Readme extends preact.Component {  
	constructor(props) {
		super(props);
		this.state = { cols: 32, dimensions: null, pal: []};
	}
	
	componentDidMount() {
		this.setState({
			dimensions: {
				width: this.container.offsetWidth,
				height: this.container.offsetHeight,
			},
		});
		eventBus.on("palt", data => this.setState(data));
	}
	componentWillUnmount() {
		eventBus.remove("palt");
	}
	
	drawPalette = () => {
		const { dimensions } = this.state;
		if(!dimensions)
            return null;

        let {cols, pal} = this.state;		
		const maxWidth = dimensions.width;
		const maxHeight = dimensions.height;
		if(!maxWidth || pal.length == 0)
			return null;		

		if(cols > pal.length)
			cols = pal.length;
		const rows = Math.floor(pal.length / cols);
		const ratioX = Math.floor(100.0 / cols);
		let ratioY = Math.floor(100.0 / rows);
		if((ratioY * maxHeight) > (ratioX * maxWidth))
			ratioY = ratioX * maxWidth / maxHeight;		
		
		let divContent = [];
		pal.map((pixel, k) => {
			const r = (pixel & 0xff),
				g = (pixel >>> 8) & 0xff,
				b = (pixel >>> 16) & 0xff,
				a = ((pixel >>> 24) & 0xff) / 255.0;
			const div = preact.createElement("div", {key: `pal${k}`, style: {backgroundColor: `rgba(${r}, ${g}, ${b}, ${a})`, float: "left", 
				width: `${ratioX}%`, height: `${ratioY}%`}, title: rgbToHex(r, g, b) });
			divContent.push(div);
		});
		return divContent;
	}

	render() {
		const childrenData = [
			"<b>Click an image to quantize it.</b>",
			"<b>Please input number of colors wanted.</b>",
			"<b>Config</b> values can be edited &amp; re-processed via <b>update</b>.",
			"If your browser can't load an image fully, just try again."
		];
		
		return preact.createElement("div", {key: "help", id: "help", className: "box", style: {paddingRight: "1em", maxWidth: "100vw"}},
			[
				preact.createElement("ul", {key: "readme", id: "readme"}, 
					childrenData.map((text, index) => {
						if(text.match(/^/))
							return preact.createElement("li", {key: `li_${index}`,  dangerouslySetInnerHTML: { __html:  text} })
						return preact.createElement("li", {key: `li_${index}`},  text)
					})
				),
				preact.createElement("div", {key: "palt", id: "palt", ref: el => (this.container = el)}, this.drawPalette())
			]
		);
	}
}

class Config extends preact.Component {
	constructor(props) {
		super(props);
		this.state = { colors: 256, dithering: true, isHQ: false};
	}
	
	componentDidMount() {
		eventBus.on("config", data => this.setState(data));
		eventBus.on("origLoad", data => data.callback(data.imgChanged, this.state));
	}
	componentWillUnmount() {
		eventBus.remove("config");
		eventBus.remove("origLoad");
	}
	
	colorsChange = e => {
		this.setState({colors: e.target.value});
	}
	ditheringChange = e => {
		this.setState({dithering: e.target.checked});
	}
	qualityChange = e => {
		this.setState({isHQ: e.target.value == "H"});
	}
	onClick = e => {
	    eventBus.dispatch("process", this.state);		
	}
	
	render() {
		const {colors, dithering, isHQ} = this.state;
		const enabled = this.props.isEnabled();
		return preact.createElement("div", {className: "box", style: {top: 0, zIndex: 999, minWidth: "100px"}},
			[
				preact.createElement("h5", {key: "h5_config"}, "Config"),
				preact.createElement("div", {key: "pre_config", id: "config", style: {paddingLeft: "1em", right: 0}}, 
					[
						preact.createElement("span", {}, 'var opts = {\n'),
						preact.createElement("div", {style: {paddingLeft: "4em"}}, 
							[
								preact.createElement("span", {}, 'colors: '),
								preact.createElement("input", {key: "colors", id: "colors", type: "number", min: 2, max: 65536, size: 6, className: "autosize",
								value: colors, onChange: this.colorsChange })								
							]
						),
						preact.createElement("div", {style: {paddingLeft: "4em"}}, 
							[								
								preact.createElement("input", {key: "dithering", id: "dithering", type: "checkbox",
									checked: dithering, onChange: this.ditheringChange }),
								preact.createElement("span", {}, 'dithering,')
							]
						),
						preact.createElement("span", {}, '};')
					]
				),
				preact.createElement("span", {key: "input_config", style: {paddingLeft: "1em", paddingBottom: "1em"}},
					[
						preact.createElement("span", {}, 'Quality: '),
						preact.createElement("input", {key: "radNQ", name: "quality", type: "radio", value: "N",
							checked: !isHQ, onChange: this.qualityChange }),
						preact.createElement("span", {}, 'Normal '),
						preact.createElement("input", {key: "radHQ", id: "radHQ", name: "quality", type: "radio", value: "H",
							checked: isHQ, onChange: this.qualityChange }),
						preact.createElement("span", {}, ' High')
					]
				),
				enabled ?
					preact.createElement("div", {key: "btn_config", style: {padding: "0.5em 1em 0.5em 11em"}}, 
						preact.createElement("button", {key: "btn_upd", id: "btn_upd", type: "button",
							onClick: this.onClick }, "Update")					
					) :
					preact.createElement("div", {key: "btn_config", style: {padding: "0.5em 1em 0.5em 11em"}}, 
						preact.createElement("button", {key: "btn_upd", id: "btn_upd", type: "button",
							disabled: "disabled" }, "Please wait...")
					)
			]
		);
	}
}

class Footer extends preact.Component {  
	render() {
		return preact.createElement("div", {key: "footer", id: "footer", style: {maxWidth: "70vw"}},		
			[
				preact.createElement(Readme, {key: "readme", ...this.props}),				
				preact.createElement(Config, {key: "config", ...this.props})
			]
		);
	}
}

class ImageSet extends preact.Component {
	onClick = e => {
	    if(!document.querySelector("#btn_upd").disabled) {
			var id = e.target.name;
			var imgUrl = e.target.srcset.split(",").pop().trim().split(" ")[0];
			process(imgUrl);
		}
	}
	onDragStart = e => {
		if(!document.querySelector("#btn_upd").disabled) {
			e.dataTransfer.dropEffect = "copy";
			e.dataTransfer.setData("text", e.target.src);
		}
	}
	
	render() {
		const imgType = this.props.pngOnly ? ".png" : ".jpg";
		return this.props.images.map(imgName => {			
			return preact.createElement("img", {key: `img_${imgName}`, className: "lazyload th", name: imgName, style: {zIndex : 2}, 
				"data-sizes": "auto", "data-src": `img/${imgName}_th${imgType}`, "data-srcset": `img/${imgName}_th${imgType} 1x, img/${imgName}${imgType} 4x`,
				draggable: true, onClick: this.onClick, onDragStart: this.onDragStart })
		})
	}
}

class Category extends preact.Component {
	render() {
		const key = this.props.images[0];
		const th = preact.createElement("th", {key: `th_${key}`}, this.props.text);
		const pngOnly = this.props.text.indexOf("Transparent") > -1;
		const imgSet = preact.createElement(ImageSet,  {key: `imgs_${key}`, images: this.props.images, pngOnly: pngOnly});	
		const td = preact.createElement("td", {key: `td_${key}`}, imgSet);		
		return preact.createElement("tr", {key: `tr_${key}`}, [th, td]);
	}
}

class Gallery extends preact.Component {  
	render() {
		const categories = [
			{images: ["baseball", "compcube", "island", "legend",  "museum",
				"old-HK", "scream", "venus"], text: "Art"}, 
			{images: ["airline", "araras", "bluff", "casa",  "climb",
				"constitucion-chile", "f16", "HKView", "lily-pond", "pool",
				"quantfrog", "sky_sea", "tree", "talia-ryder", "wooden"], text: "Photos"},
			{images: ["fish", "fruit-market", "g-fruit", "pills", "rainbow-illusions",
				"SE5x9", "wildflowers"], text: "Colorful"},
			{images: ["color-wheel", "cup", "rainbow-shadow"],
				text: "Partial Transparent"}
		];
		return preact.createElement("table", {id: "tbl_showcase", key: "tbl_showcase"},
			preact.createElement("tbody", {key: "tb_showcase"},
				categories.map(category => {
					return preact.createElement(Category, {key: `cat_${category["images"][0]}`, images: category["images"], text: category["text"]})
				})
			)
		);
	}
}

class ForkMe extends preact.Component {  
	render() {
		const childrenData = [
			{tag: "a", attrs: {href: "https://github.com/mcychan/PnnQuant.js"}},
			{tag: "img", attrs: {src: "img/forkme_right_red_aa0000.svg", style: {position: "absolute", top: 0, right: 0}, alt: "Fork me on GitHub"}},
			{tag: "div", attrs: {id: "wrapfabtest"}, children: (preact.createElement("div", {key: "adBanner", className: "adBanner"}, "ImgV64 Copyright \u00a9 2016-2021"))}
		];

		return preact.createElement("div", {key: "forkme"},
			childrenData.map((item, index) => {
				return preact.createElement(item["tag"], {key: `i${index}`, ...item["attrs"]}, item["children"])
			})
		);
	}
}

class App extends preact.Component {
	constructor(props) {
		super(props);
		this.state = { enabled: true};				
	}
	
	componentDidMount() {
		eventBus.on("app", data => this.setState(data));
	}
	componentWillUnmount() {
		eventBus.remove("app");
	}
	componentDidCatch(error, info) {
		console.error(`Error: ${error.message}`);
	}
	
	isEnabled = () => this.state.enabled;
	
	render() {
		return [
			preact.createElement(Scene, {key: "scene", isEnabled: this.isEnabled}),
			preact.createElement(Footer, {key: "footer", isEnabled: this.isEnabled}),
			preact.createElement(Gallery, {key: "gallery"}),
			preact.createElement(ForkMe, {key: "forkMe"})
		];
	}
}

// render
preact.render(preact.createElement(App, {}), document.querySelector('#app'));
