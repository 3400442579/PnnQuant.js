!function(_,n){"object"==typeof exports&&"undefined"!=typeof module?n(exports,require("preact")):"function"==typeof define&&define.amd?define(["exports","preact"],n):n(_.preactHooks={},_.preact)}(this,function(_,o){var e,u,n,i=0,t=[],c=o.options.__b,r=o.options.__r,f=o.options.diffed,s=o.options.__c,a=o.options.unmount;function p(_,n){o.options.__h&&o.options.__h(u,_,i||n),i=0;n=u.__H||(u.__H={__:[],__h:[]});return _>=n.__.length&&n.__.push({}),n.__[_]}function h(_){return i=1,m(g,_)}function m(_,n,t){var o=p(e++,2);return o.t=_,o.__c||(o.__=[t?t(n):g(void 0,n),function(_){_=o.t(o.__[0],_);o.__[0]!==_&&(o.__=[_,o.__[1]],o.__c.setState({}))}],o.__c=u),o.__}function l(_,n){var t=p(e++,4);!o.options.__s&&b(t.__H,n)&&(t.__=_,t.__H=n,u.__h.push(t))}function H(_,n){var t=p(e++,7);return b(t.__H,n)&&(t.__=_(),t.__H=n,t.__h=_),t.__}function v(){t.forEach(function(n){if(n.__P)try{n.__H.__h.forEach(y),n.__H.__h.forEach(E),n.__H.__h=[]}catch(_){n.__H.__h=[],o.options.__e(_,n.__v)}}),t=[]}o.options.__b=function(_){u=null,c&&c(_)},o.options.__r=function(_){r&&r(_),e=0;_=(u=_.__c).__H;_&&(_.__h.forEach(y),_.__h.forEach(E),_.__h=[])},o.options.diffed=function(_){f&&f(_);_=_.__c;_&&_.__H&&_.__H.__h.length&&(1!==t.push(_)&&n===o.options.requestAnimationFrame||((n=o.options.requestAnimationFrame)||function(_){function n(){clearTimeout(o),d&&cancelAnimationFrame(t),setTimeout(_)}var t,o=setTimeout(n,100);d&&(t=requestAnimationFrame(n))})(v)),u=null},o.options.__c=function(_,t){t.some(function(n){try{n.__h.forEach(y),n.__h=n.__h.filter(function(_){return!_.__||E(_)})}catch(_){t.some(function(_){_.__h&&(_.__h=[])}),t=[],o.options.__e(_,n.__v)}}),s&&s(_,t)},o.options.unmount=function(_){a&&a(_);var n=_.__c;if(n&&n.__H)try{n.__H.__.forEach(y)}catch(_){o.options.__e(_,n.__v)}};var d="function"==typeof requestAnimationFrame;function y(_){var n=u;"function"==typeof _.__c&&_.__c(),u=n}function E(_){var n=u;_.__c=_.__(),u=n}function b(t,_){return!t||t.length!==_.length||_.some(function(_,n){return _!==t[n]})}function g(_,n){return"function"==typeof n?n(_):n}_.useState=h,_.useReducer=m,_.useEffect=function(_,n){var t=p(e++,3);!o.options.__s&&b(t.__H,n)&&(t.__=_,t.__H=n,u.__H.__h.push(t))},_.useLayoutEffect=l,_.useRef=function(_){return i=5,H(function(){return{current:_}},[])},_.useImperativeHandle=function(_,n,t){i=6,l(function(){"function"==typeof _?_(n()):_&&(_.current=n())},null==t?t:t.concat(_))},_.useMemo=H,_.useCallback=function(_,n){return i=8,H(function(){return _},n)},_.useContext=function(_){var n=u.context[_.__c],t=p(e++,9);return t.c=_,n?(null==t.__&&(t.__=!0,n.sub(u)),n.props.value):_.__},_.useDebugValue=function(_,n){o.options.useDebugValue&&o.options.useDebugValue(n?n(_):_)},_.useErrorBoundary=function(_){var n=p(e++,10),t=h();return n.__=_,u.componentDidCatch||(u.componentDidCatch=function(_){n.__&&n.__(_),t[1](_)}),[t[0],function(){t[1](void 0)}]}});