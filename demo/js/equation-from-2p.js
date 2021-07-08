	/**
	 * Number.isFinite
	 * Copyright (c) 2014 marlun78
	 * MIT License, https://gist.github.com/marlun78/bd0800cf5e8053ba9f83
	 * 
	 * Spec: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-number.isfinite
	 */
	if (typeof Number.isFinite !== 'function') {
		Number.isFinite = function isFinite(value) {
			// 1. If Type(number) is not Number, return false.
			if (typeof value !== 'number') {
				return false;
			}
			// 2. If number is NaN, +��, or ?��, return false.
			if (value !== value || value === Infinity || value === -Infinity) {
				return false;
			}
			// 3. Otherwise, return true.
			return true;
		};
	}
	
	if (typeof Math.log2 !== 'function') {
		Math.log2 = function log2(value) {
			return Math.log(value) * Math.LOG2E;
		};
	}
	
	Math.power = function power(a, b) {
		if(a >= 0)
			return Math.pow(a, b);
		var sign = (b % 2) == 0 ? 1 : -1;
		return sign * Math.pow(-a, b);
	};
	
	function getTerm(coefficient, variable) {
		if(coefficient == -1)
			return "-" + variable;
		if(coefficient == 0)
			return "";
		if(coefficient == 1)
			return variable;
		return coefficient + variable;
	}
	
	function twoPForm(x1, y1, x2, y2) {
		x1 -= 0, x2 -=0, y1 -=0, y2 -= 0;
		var result = "No solution.<br/>";
		rows = [];
		
		var c, m = (y2 - y1) / (x2 - x1);
		color = "rgb(72, " + Math.floor(Math.random() * 200) + ", 40)";
		if(Number.isFinite(m)) {			
			c = -m * x1 + y1;
			var sign = c < 0 ? " - " : " + ";
			var term = getTerm(m, "x");
			result = "y = " + term;
			if(term == "")
				sign = sign.replace('+', '').replace(/\s/g, '');
			result += sign + Math.abs(c);
			result += "<br/>x1 = " + x1 + ", y1 = " + (m * x1 + c) + "<br/>";
			result += "x2 = " + x2 + ", y2 = " + (m * x2 + c) + "<br/>";
			funGraph(ctx, axes, function(x) {
				return m * x + c;
			}, color, 1);
		}
		else {
			m = (x2 - x1) / (y2 - y1);
			if(Number.isFinite(m)) {
				c = -m * y1 + x1;
				var sign = c < 0 ? " - " : " + ";
				var term = getTerm(m, "y");
				result = "x = " + term;
				if(term == "")
					sign = sign.replace('+', '').replace(/\s/g, '');
				result += sign + Math.abs(c);
				result += "<br/>x1 = " + (m * y1 + c) + ", y1 = " + y1 + "<br/>";
				result += "x2 = " + (m * y2 + c) + ", y2 = " + y2 + "<br/>";
				invFunGraph(ctx, axes, function(x) {
					return c;
				}, color, 1);
			}
			else {
				result += "x1 = " + x1 + ", y1 = " + y1 + "<br/>";
				result += "x2 = " + x2 + ", y2 = " + y2 + "<br/>";
			}
		}
		rows.unshift({color: color, answer: result});	
		return [m, c];
	}

	function knForm(x1, y1, x2, y2) {
		x1 -= 0, x2 -=0, y1 -=0, y2 -= 0;
		var result = "No solution.<br/>";
		rows = [];
		
		var k, n = Math.log2(y2 / y1) / Math.log2(x2 / x1);
		color = "rgb(" + Math.floor(Math.random() * 200) + ", 38, 67)";
		if(Number.isFinite(n)) {
			k = y1 / Math.power(x1, n);
			var y1b = k * Math.power(x1, n);
			var y2b = k * Math.power(x2, n);
				
			var term = getTerm(k, "x<sup>");
			result = "y = " + term;
			if(term != "")
				result += n + "</sup><br/>";
			else
				result += k + "<br />";			
			result += "x1 = " + x1 + ", y1 = " + y1b + "<br/>";
			result += "x2 = " + x2 + ", y2 = " + y2b + "<br/>";
			
			funGraph(ctx, axes, function(x) {
				return k * Math.power(x, n);
			}, color, 1);
		}
		else {
			result += "x1 = " + x1 + ", y1 = " + y1 + "<br/>";
			result += "x2 = " + x2 + ", y2 = " + y2 + "<br/>";
		}
		rows.unshift({color: color, answer: result});
		return [k, n];
	}

	function kenForm(x1, y1, x2, y2) {
		x1 -= 0, x2 -=0, y1 -=0, y2 -= 0;
		var result = "No solution.<br/>";
		rows = [];
		
		var k, n = Math.log(y2 / y1) / (x2 - x1);
		color = "rgb(87, 33, " + Math.floor(Math.random() * 200) + ")";
		if(Number.isFinite(n)) {
			k = y1 / Math.exp(x1 * n);
			var y1b = k * Math.exp(n * x1);
			var y2b = k * Math.exp(n * x2);
				
			var term = getTerm(k, "e<sup>");
			result = "y = " + term;
			if(term != "")
				result += n + "x</sup><br/>";
			else
				result += k + "<br />";			
			result += "x1 = " + x1 + ", y1 = " + y1b + "<br/>";			
			result += "x2 = " + x2 + ", y2 = " + y2b + "<br/>";

			funGraph(ctx, axes, function(x) {
				return k * Math.exp(n * x);
			}, color, 1.1);
		}
		else {
			result += "x1 = " + x1 + ", y1 = " + y1 + "<br/>";
			result += "x2 = " + x2 + ", y2 = " + y2 + "<br/>";
		}
		rows.unshift({color: color, answer: result});
		return [k, n];
	}
	
	var ctx, color, axes, rows;	
		
const useContext = context => context.Provider.value;

const AppContext = preact.createContext();
	
class EquationEditor extends preact.Component {	
	onB1Click = e => {
		const {state, setState} = useContext(AppContext);
	    twoPForm(state.x1, state.y1, state.x2, state.y2);
		setState({workouts: rows});
	}
	onB2Click = e => {
		const {state, setState} = useContext(AppContext);
	    knForm(state.x1, state.y1, state.x2, state.y2);
		setState({workouts: rows});
	}
	onB3Click = e => {
		const {state, setState} = useContext(AppContext);
	    kenForm(state.x1, state.y1, state.x2, state.y2);
		setState({workouts: rows});
	}
	onChange = e => {
		const {id, value} = e.currentTarget;
		const {setState} = useContext(AppContext);
		setState({[id]: value});
	}
	onClear = e => {
	    const {setState} = useContext(AppContext);
	    setState({workouts: []});
		draw();
	}
	
	render() {
		const {state} = useContext(AppContext);
		return preact.createElement("form", {key: "form", novalidate: ""},
		[
			preact.createElement("div", {style: {float: "left", width: "100%"} },
				Object.keys(state).filter(key => !Array.isArray(state[key])).map((key, index) => {
					if(index % 2 == 0)
						return preact.createElement("div", {style: {float: "left", paddingLeft: "1ex", width: "30%", minWidth: "35%"} }, 
							[
								preact.createElement("span", {}, `${key}: `),
								preact.createElement("input", {key: key, id: key, type: "number", value: state[key], onChange: this.onChange, style: {width: "11em", maxWidth: "45%"} })
							]
						)
						
					return preact.createElement("div", {style: {float: "left", paddingLeft: "2ex", width: "60%", minWidth: "35%"} }, 
						[
							preact.createElement("span", {}, `${key}: `),
							preact.createElement("input", {key: key, id: key, type: "number", value: state[key], onChange: this.onChange, style: {width: "11em", maxWidth: "45%"} })
						]
					)
				})
			),
			preact.createElement("div", {style: {clear: "both", paddingTop: "0.5em", paddingBottom: "0.5em"}},
				[
					preact.createElement("button", {key: "btn1", onClick: this.onB1Click, type: "button", style: {marginRight: "0.5em"}}, "y = mx + c"),
					preact.createElement("button", {key: "btn2", onClick: this.onB2Click, "data-superscript": "n", type: "button", style: {marginRight: "0.5em"}}, "y = kx"),
					preact.createElement("button", {key: "btn3", onClick: this.onB3Click, "data-superscript": "nx", type: "button", style: {marginRight: "0.5em"}}, "y = ke"),
					preact.createElement("button", {key: "btnClear", onClick: this.onClear, type: "button" }, "C")
				]
			)
		]);
	}
}

class GraphPaper extends preact.Component {
	componentDidMount() {
		draw();
	}
	render() {
		return preact.createElement("div", {style: {position: "absolute", top: "15vw", right: "65vw"}},
			preact.createElement("canvas", {key: "canvas", id: "canvas", width: 360, height: 360})
		);
	}
}

class Workbook extends preact.Component {	
	render() {
		const {state} = useContext(AppContext);
		return preact.createElement("table", {id: "tbl_showcase", key: "tbl_showcase"},
			preact.createElement("tbody", {key: "tb_showcase"},
				state.workouts.map((workout, index) => {
					return preact.createElement("tr", {key: `q_${index}`}, 
						preact.createElement("td", {key: `td_${index}`, style: {color: workout.color},  
							dangerouslySetInnerHTML: { __html:  workout.answer} })
					)
				})
			)
		);
	}
}
	
class Footer extends preact.Component {  
	render() {
		const childrenData = [
			{tag: "div", attrs: {id: "wrapfabtest"}, children: (preact.createElement("div", {key: "adBanner", className: "adBanner"}, "ImgV64 Copyright \u00a9 2016-2021"))}
		];

		return preact.createElement("div", {key: "footer"},
			childrenData.map((item, index) => {
				return preact.createElement(item["tag"], {key: `i${index}`, ...item["attrs"]}, item["children"])
			})
		);
	}
}
	
class App extends preact.Component {		
	constructor(props) {
		super(props);
		this.state = { x1: 1, y1: 2, x2: 3, y2: 8, workouts: []};
	}
	
	componentDidCatch(error, info) {
		console.error(`Error: ${error.message}`);
	}
	
	setData = data => {
		const row = Object.values(data)[0];
		if(Array.isArray(row) && row.length)
			this.setState(prevState => {
				return {
					...prevState,
					workouts : row.concat(prevState.workouts)
				}
			});
		else
			this.setState(data);
	};
	
	render() {
		AppContext.Provider.value = {state: this.state, setState: this.setData};
		return preact.createElement(AppContext.Provider, {}, [
			preact.createElement(EquationEditor, {key: "equationEditor"}),			
			preact.createElement(Workbook, {key: "workbook"}),
			preact.createElement(GraphPaper, {key: "graphPaper"}),
			preact.createElement(Footer, {key: "footer"})
		]);
	}
}

// render
preact.render(preact.createElement(App, {}), document.querySelector('#app'));