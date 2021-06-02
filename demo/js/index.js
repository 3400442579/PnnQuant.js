class Scene extends React.Component {
	constructor(props) {
		super(props);
		this.state = { background: "none", boxWidth: 0, transparent: -1,
			display: "none", imgName: "", imgBase64: "", imgUrl: ""
		};
		this.orig = React.createRef();
	}
	
	componentDidMount() {
		eventBus.on("scene", (data) => this.setState(data));
		eventBus.on("process", (data) => {
			var imgUrl = this.orig.current.src;
			process(imgUrl);
			origLoad(false, data);
		});
	}
	componentWillUnmount() {
		eventBus.remove("scene");
	}
  
	onChange = (ev) => {
	    eventBus.dispatch("app", {enabled: false});
		const imgPath = ev.target.files[0];
		var id = baseName(imgPath.name)[0];
		loadImage(id, imgPath, ev);
	}
	onClick = (ev) => {
	    document.querySelector("#orig").nextSibling.click();
	}
	onDrop = (ev) => {
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
			eventBus.dispatch("app", {enabled: false});
			loadImage(file.name, file, ev);
		}
	}
	onDragOver = (ev) => {
	    ev.stopPropagation();
		ev.preventDefault();
		
		ev.target.style.border = "4px dashed silver";
	}
	onDragLeave = (ev) => {
	    if(ev)
			ev.target.style.border = "";
		else
			this.orig.current.style.border = "";
	}
	onError = (ev) => {
	    var $orig = this.orig.current;
		allowChange($orig);
	}
	onLoad = (ev) => {
	    origLoad(true, null);
	}
	
	render() {
		const {background, boxWidth, display, imgName, imgUrl, imgBase64} = this.state;
		const reduDisplay = this.props.isEnabled() ? display : "none";
		return React.createElement("div", {id: "scene", style: {overflow: "auto"}},
			[
				React.createElement("div", {key: "box1", className: "box", style: {background: background, margin: "0 auto", maxWidth: "49%", maxHeight: "35%"}}, 
					[
						React.createElement("div", {key: "orig", id: "orig", style: {display: display, overflow: "auto"},
							onClick: (e) => {this.onClick(e)}, onDrop: (e) => {this.onDrop(e)}, 
							onDragOver: (e) => {this.onDragOver(e)}, onDragLeave: (e) => {this.onDragLeave(e)} }, 							
							[
								React.createElement("h4", {style: {width: boxWidth} }, "Original"),
								React.createElement("img", {key: "origImg", crossOrigin: "", ref: this.orig, 
									name: imgName, src: imgUrl,
									onError: (e) => {this.onError(e)}, onLoad: (e) => {this.onLoad(e)}
								})
							]),
						React.createElement("input", {key: "file", type: "file", style: {display: "none", width: 0},
							onChange: (e) => {this.onChange(e)}
						})
					]
				),
				React.createElement("div", {key: "box2",  className: "box", style: {background: background, margin: "0 auto", maxWidth: "49%", maxHeight: "35%"}}, 
					React.createElement("div", {key: "redu", id: "redu", style: {display: reduDisplay, overflow: "auto"}},
						[
							React.createElement("h4", {style: {width: boxWidth} }, "Quantized"),
							React.createElement("img", {key: "reducedImg", src: imgBase64 })
						])
				)
			]
		);
	}
}

class Readme extends React.Component {  
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
		eventBus.on("palt", (data) => this.setState(data));
	}
	componentWillUnmount() {
		eventBus.remove("palt");
	}
	
	drawPalette = () => {
		const { dimensions } = this.state;
		if(!dimensions)
            return null;

        var {cols, pal} = this.state;		
		const maxWidth = dimensions.width;
		const maxHeight = dimensions.height;
		if(!maxWidth || pal.length == 0)
			return null;		

		if(cols > pal.length)
			cols = pal.length;
		var rows = Math.floor(pal.length / cols);
		var ratioX = Math.floor(100.0 / cols);
		var ratioY = Math.floor(100.0 / rows);
		if((ratioY * maxHeight) > (ratioX * maxWidth))
			ratioY = ratioX * maxWidth / maxHeight;		
		
		var divContent = [];
		pal.map((pixel, k) => {
			var r = (pixel & 0xff),
				g = (pixel >>> 8) & 0xff,
				b = (pixel >>> 16) & 0xff,
				a = ((pixel >>> 24) & 0xff) / 255.0;
			const div = React.createElement("div", {key: `pal${k}`, style: {backgroundColor: `rgba(${r}, ${g}, ${b}, ${a})`, float: "left", 
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
		
		return React.createElement("div", {key: "help", className: "box", style: {paddingRight: "1em", maxWidth: "100vw"}},
			[
				React.createElement("ul", {key: "readme", id: "readme"}, 
					childrenData.map((text, index) => {
						if(text.match(/^/))
							return React.createElement("li", {key: `li_${index}`,  dangerouslySetInnerHTML: { __html:  text} })
						return React.createElement("li", {key: `li_${index}`},  text)
					})
				),
				React.createElement("div", {key: "palt", id: "palt", ref: el => (this.container = el)}, this.drawPalette())
			]
		);
	}
}

class Config extends React.Component {
	constructor(props) {
		super(props);
		this.state = { colors: 256, dithering: true, isHQ: false};
	}
	
	componentDidMount() {
		eventBus.on("config", (data) => this.setState(data));
		eventBus.on("origLoad", (data) => data.callback(data.imgChanged, this.state));
	}
	componentWillUnmount() {
		eventBus.remove("config");
		eventBus.remove("origLoad");
	}
	
	colorsChange = (e) => {
		this.setState({colors: e.target.value});
	}
	ditheringChange = (e) => {
		this.setState({dithering: e.target.checked});
	}
	qualityChange = (e) => {
		this.setState({isHQ: e.target.value == "H"});
	}
	onClick = (e) => {
	    eventBus.dispatch("process", this.state);		
	}
	
	render() {
		const {colors, dithering, isHQ} = this.state;
		const enabled = this.props.isEnabled();
		return React.createElement("div", {className: "box", style: {top: 0, zIndex: 999, minWidth: "100px"}},
			[
				React.createElement("h5", {key: "h5_config"}, "Config"),
				React.createElement("div", {key: "pre_config", id: "config", style: {paddingLeft: "1em", right: 0}}, 
					[
						React.createElement("span", {}, 'var opts = {\n'),
						React.createElement("div", {style: {paddingLeft: "4em"}}, 
							[
								React.createElement("span", {}, 'colors: '),
								React.createElement("input", {key: "colors", id: "colors", type: "number", min: 2, max: 65536, size: 6, className: "autosize",
								value: colors, onChange: (e) => {this.colorsChange(e)} })								
							]
						),
						React.createElement("div", {style: {paddingLeft: "4em"}}, 
							[								
								React.createElement("input", {key: "dithering", id: "dithering", type: "checkbox",
									checked: dithering, onChange: (e) => {this.ditheringChange(e)} }),
								React.createElement("span", {}, 'dithering,')
							]
						),
						React.createElement("span", {}, '};')
					]
				),
				React.createElement("span", {key: "input_config", style: {paddingLeft: "1em", paddingBottom: "1em"}},
					[
						React.createElement("span", {}, 'Quality: '),
						React.createElement("input", {key: "radNQ", name: "quality", type: "radio", value: "N",
							checked: !isHQ, onChange: (e) => {this.qualityChange(e)} }),
						React.createElement("span", {}, 'Normal '),
						React.createElement("input", {key: "radHQ", id: "radHQ", name: "quality", type: "radio", value: "H",
							checked: isHQ, onChange: (e) => {this.qualityChange(e)} }),
						React.createElement("span", {}, ' High')
					]
				),
				enabled ?
					React.createElement("div", {key: "btn_config", style: {padding: "0.5em 1em 0.5em 11em"}}, 
						React.createElement("button", {key: "btn_upd", id: "btn_upd", type: "button",
							onClick: (e) => {this.onClick(e)} }, "Update")					
					) :
					React.createElement("div", {key: "btn_config", style: {padding: "0.5em 1em 0.5em 11em"}}, 
						React.createElement("button", {key: "btn_upd", id: "btn_upd", type: "button",
							disabled: "disabled" }, "Please wait...")
					)
			]
		);
	}
}

class Footer extends React.Component {  
	render() {
		return React.createElement("div", {key: "footer", id: "footer", style: {maxWidth: "70vw"}},		
			[
				React.createElement(Readme, {key: "readme", ...this.props}),				
				React.createElement(Config, {key: "config", ...this.props})
			]
		);
	}
}

class ImageSet extends React.Component {
	onClick = (e) => {
	    if(!document.querySelector("#btn_upd").disabled) {
			var id = e.target.name;
			var imgUrl = e.target.srcset.split(",").pop().trim().split(" ")[0];
			process(imgUrl);
		}
	}
	onDragStart = (e) => {
	    e.dataTransfer.dropEffect = "copy";
		e.dataTransfer.setData("text", e.target.src);
	}
	
	render() {
		const imgType = this.props.pngOnly ? ".png" : ".jpg";
		return this.props.images.map((imgName) => {			
			return React.createElement("img", {key: `img_${imgName}`, className: "th", name: imgName, style: {zIndex : 2}, 
				src: `img/${imgName}_th${imgType}`, srcSet: `img/${imgName}_th${imgType} 1x, img/${imgName}${imgType} 4x`,
				draggable: true, onClick: (e) => {this.onClick(e)}, onDragStart: (e) => {this.onDragStart(e)} })
		})
	}
}

class Category extends React.Component {
	render() {
		const key = this.props.images[0];
		const th = React.createElement("th", {key: `th_${key}`}, this.props.text);
		const pngOnly = this.props.text.indexOf("Transparent") > -1;
		const imgSet = React.createElement(ImageSet,  {key: `imgs_${key}`, images: this.props.images, pngOnly: pngOnly});	
		const td = React.createElement("td", {key: `td_${key}`}, imgSet);		
		return React.createElement("tr", {key: `tr_${key}`}, [th, td]);
	}
}

class Gallery extends React.Component {  
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
		return React.createElement("table", {id: "tbl_showcase", key: "tbl_showcase"},
			React.createElement("tbody", {key: "tb_showcase"},
				categories.map((category) => {
					return React.createElement(Category, {key: `cat_${category["images"][0]}`, images: category["images"], text: category["text"]})
				})
			)
		);
	}
}

class ForkMe extends React.Component {  
	render() {
		const childrenData = [
			{tag: "a", attrs: {href: "https://github.com/mcychan/PnnQuant.js"}},
			{tag: "img", attrs: {src: "img/forkme_right_red_aa0000.svg", style: {position: "absolute", top: 0, right: 0}, alt: "Fork me on GitHub"}},
			{tag: "div", attrs: {id: "wrapfabtest"}, children: (React.createElement("div", {key: "adBanner", className: "adBanner"}, "ImgV64 Copyright \u00a9 2016-2021"))}
		];

		return React.createElement("div", {key: "forkme"},
			childrenData.map((item, index) => {
				return React.createElement(item["tag"], {key: `i${index}`, ...item["attrs"]}, item["children"])
			})
		);
	}
}

class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = { enabled: true};				
	}
	
	componentDidMount() {
		eventBus.on("app", (data) => this.setState(data));
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
			React.createElement(Scene, {key: "scene", isEnabled: this.isEnabled}),
			React.createElement(Footer, {key: "footer", isEnabled: this.isEnabled}),
			React.createElement(Gallery, {key: "gallery"}),
			React.createElement(ForkMe, {key: "forkMe"})
		];
	}
}

// render
ReactDOM.render(React.createElement(App, {}), document.querySelector('#app'));
