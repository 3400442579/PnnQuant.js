class Scene extends React.Component {
	onDrop = (e) => {
	    drop(e);
	}
	onDragOver = (e) => {
	    allowDrop(e);
	}
	onDragLeave = (e) => {
	    dragLeave(e);
	}
	
	render() {
		return React.createElement("div", {id: "scene", style: {overflow: "auto"}},
			[
				React.createElement("div", {key: "box1", className: "box", style: {margin: "0 auto", maxWidth: "49%", maxHeight: "35%"}}, 
					[
						React.createElement("div", {key: "orig", id: "orig", style: {overflow: "auto"},
							onDrop: (e) => {this.onDrop(e)}, onDragOver: (e) => {this.onDragOver(e)}, onDragLeave: (e) => {this.onDragLeave(e)}}, null),
						React.createElement("input", {key: "file", type: "file", style: {display: "none", width: 0}})
					]
				),
				React.createElement("div", {key: "box2",  className: "box", style: {margin: "0 auto", maxWidth: "49%", maxHeight: "35%"}}, 
					React.createElement("div", {key: "redu", id: "redu", style: {overflow: "auto"}})
				)
			]
		);
	}
}

class Readme extends React.Component {  
	render() {
		const childrenData = [
			"Click an image to quantize it.",
			"<b>Please input number of colors wanted.</b>",
			"<b>Config</b> values can be edited &amp; re-processed via <b>update</b>.",
			"If your browser can't load an image fully, just try again."
		];
		
		return React.createElement("div", {className: "box", style: {paddingRight: "1em", maxWidth: "100vw"}},
			[
				React.createElement("ul", {key: "readme", id: "readme"}, 
					childrenData.map((text, index) => {
						return React.createElement("li", {key: `li_${index}`, dangerouslySetInnerHTML: { __html:  text}})
					})
				),
				React.createElement("div", {key: "palt", id: "palt"})
			]
		);
	}
}

class Button extends React.Component {
	onClick = (e) => {
	    var imgUrl = document.querySelector("#orig img").getAttribute("src");
		process(imgUrl);
	}
	
	render() {
		return React.createElement("button", {onClick: (e) => {this.onClick(e)}, ...this.props}, this.props.text);
	}
}

class Config extends React.Component {  
	render() {
		return React.createElement("div", {className: "box", style: {zIndex: 999}},
			[
				React.createElement("h5", {key: "h5_config"}, "Config"),
				React.createElement("div", {key: "pre_config", id: "config", style: {paddingLeft: "1em"}, 
					dangerouslySetInnerHTML: { __html: 'var opts = {<br />' +
					'<div style="padding-left: 4em">colors: <input id="colors" type="number" value="256" min="2" max="65536" size="6" class="autosize">,</div>' +
					'<div style="padding-left: 4em"><input id="dithering" type="checkbox" checked="checked"> <span>dithering</span>,</div>' +
					'};'}
				}),
				React.createElement("span", {key: "input_config", style: {paddingLeft: "1em", paddingBottom: "1em"}, 
					dangerouslySetInnerHTML: { __html: 'Quality: <input type="radio" name="quality" checked="checked" />' +
						'Normal <input type="radio" id="radHQ" name="quality" /> High'
					}
				}),
				React.createElement("div", {key: "btn_config", style: {padding: "0.5em 1em 0.5em 11em"}}, 
					React.createElement(Button, {key: "btn_upd", id: "btn_upd", type: "button", text: "Update"})
				)
			]
		);
	}
}

class Footer extends React.Component {  
	render() {
		return React.createElement("div", {id: "footer", style: {minWidth: "575px"}},		
			[
				React.createElement(Readme, {key: "readme"}),				
				React.createElement(Config, {key: "config"})
			]
		);
	}
}

class Image extends React.Component {  
	onClick = (e) => {
	    if(!document.querySelector("#btn_upd").disabled) {
			var id = this.props.imageName;
			var imgUrl = e.target.getAttribute("srcset").split(",").pop().trim().split(" ")[0];
			process(imgUrl);
		}
	}
	onDragStart = (e) => {
	    e.dataTransfer.dropEffect = "copy";
		const {imgName , imgType} = this.props;
		e.dataTransfer.setData("text", `img/${imgName}${imgType}`);
	}
	
	render() {
		const {imgName , imgType} = this.props;
		return React.createElement("img", {className: "th", draggable: true, onClick: (e) => {this.onClick(e)}, onDragStart: (e) => {this.onDragStart(e)}, 
			src: `img/${imgName}_th${imgType}`, srcSet: `img/${imgName}_th${imgType} 1x, img/${imgName}${imgType} 4x`});
	}
}

class ImageSet extends React.Component {  
	render() {		
		const imgType = this.props.pngOnly ? ".png" : ".jpg";
		return this.props.images.map((imgName) => {			
			return React.createElement(Image, {key: `img_${imgName}`, imgName: imgName, imgType: imgType})
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
  render() {
    return [
		React.createElement(Scene, {key: "scene"}),
		React.createElement(Footer, {key: "footer"}),
		React.createElement(Gallery, {key: "gallery"}),
		React.createElement(ForkMe, {key: "forkMe"})
	];
  }
}

// render
ReactDOM.render(React.createElement(App, {}), document.querySelector('#app'));
