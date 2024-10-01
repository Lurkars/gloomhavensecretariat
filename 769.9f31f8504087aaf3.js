"use strict";(self.webpackChunkgloomhavensecretariat=self.webpackChunkgloomhavensecretariat||[]).push([[769],{3769:(Zt,at,j)=>{j.r(at),j.d(at,{diagram:()=>Qt});var M=j(3585),B=j(5414);function ct(t,i){let n;if(void 0===i)for(const l of t)null!=l&&(n>l||void 0===n&&l>=l)&&(n=l);else{let l=-1;for(let a of t)null!=(a=i(a,++l,t))&&(n>a||void 0===n&&a>=a)&&(n=a)}return n}function xt(t){return t.target.depth}function ut(t,i){return t.sourceLinks.length?t.depth:i-1}function q(t,i){let n=0;if(void 0===i)for(let l of t)(l=+l)&&(n+=l);else{let l=-1;for(let a of t)(a=+i(a,++l,t))&&(n+=a)}return n}function ht(t,i){let n;if(void 0===i)for(const l of t)null!=l&&(n<l||void 0===n&&l>=l)&&(n=l);else{let l=-1;for(let a of t)null!=(a=i(a,++l,t))&&(n<a||void 0===n&&a>=a)&&(n=a)}return n}function X(t){return function(){return t}}function ft(t,i){return K(t.source,i.source)||t.index-i.index}function yt(t,i){return K(t.target,i.target)||t.index-i.index}function K(t,i){return t.y0-i.y0}function tt(t){return t.value}function wt(t){return t.index}function Lt(t){return t.nodes}function St(t){return t.links}function dt(t,i){const n=t.get(i);if(!n)throw new Error("missing: "+i);return n}function gt({nodes:t}){for(const i of t){let n=i.y0,l=n;for(const a of i.sourceLinks)a.y0=n+a.width/2,n+=a.width;for(const a of i.targetLinks)a.y1=l+a.width/2,l+=a.width}}var et=Math.PI,nt=2*et,D=1e-6,At=nt-D;function it(){this._x0=this._y0=this._x1=this._y1=null,this._=""}function pt(){return new it}it.prototype=pt.prototype={constructor:it,moveTo:function(t,i){this._+="M"+(this._x0=this._x1=+t)+","+(this._y0=this._y1=+i)},closePath:function(){null!==this._x1&&(this._x1=this._x0,this._y1=this._y0,this._+="Z")},lineTo:function(t,i){this._+="L"+(this._x1=+t)+","+(this._y1=+i)},quadraticCurveTo:function(t,i,n,l){this._+="Q"+ +t+","+ +i+","+(this._x1=+n)+","+(this._y1=+l)},bezierCurveTo:function(t,i,n,l,a,m){this._+="C"+ +t+","+ +i+","+ +n+","+ +l+","+(this._x1=+a)+","+(this._y1=+m)},arcTo:function(t,i,n,l,a){var m=this._x1,y=this._y1,p=(n=+n)-(t=+t),s=(l=+l)-(i=+i),o=m-t,u=y-i,k=o*o+u*u;if((a=+a)<0)throw new Error("negative radius: "+a);if(null===this._x1)this._+="M"+(this._x1=t)+","+(this._y1=i);else if(k>D)if(Math.abs(u*p-s*o)>D&&a){var b=n-m,d=l-y,_=p*p+s*s,E=b*b+d*d,S=Math.sqrt(_),A=Math.sqrt(k),C=a*Math.tan((et-Math.acos((_+k-E)/(2*S*A)))/2),O=C/A,R=C/S;Math.abs(O-1)>D&&(this._+="L"+(t+O*o)+","+(i+O*u)),this._+="A"+a+","+a+",0,0,"+ +(u*b>o*d)+","+(this._x1=t+R*p)+","+(this._y1=i+R*s)}else this._+="L"+(this._x1=t)+","+(this._y1=i)},arc:function(t,i,n,l,a,m){t=+t,i=+i,m=!!m;var y=(n=+n)*Math.cos(l),p=n*Math.sin(l),s=t+y,o=i+p,u=1^m,k=m?l-a:a-l;if(n<0)throw new Error("negative radius: "+n);null===this._x1?this._+="M"+s+","+o:(Math.abs(this._x1-s)>D||Math.abs(this._y1-o)>D)&&(this._+="L"+s+","+o),n&&(k<0&&(k=k%nt+nt),k>At?this._+="A"+n+","+n+",0,1,"+u+","+(t-y)+","+(i-p)+"A"+n+","+n+",0,1,"+u+","+(this._x1=s)+","+(this._y1=o):k>D&&(this._+="A"+n+","+n+",0,"+ +(k>=et)+","+u+","+(this._x1=t+n*Math.cos(a))+","+(this._y1=i+n*Math.sin(a))))},rect:function(t,i,n,l){this._+="M"+(this._x0=this._x1=+t)+","+(this._y0=this._y1=+i)+"h"+ +n+"v"+ +l+"h"+-n+"Z"},toString:function(){return this._}};const Tt=pt;var Mt=Array.prototype.slice;function mt(t){return function(){return t}}function Nt(t){return t[0]}function Ct(t){return t[1]}function Pt(t){return t.source}function It(t){return t.target}function Ot(t,i,n,l,a){t.moveTo(i,n),t.bezierCurveTo(i=(i+l)/2,n,i,a,l,a)}function Dt(t){return[t.source.x1,t.y0]}function Rt(t){return[t.target.x0,t.y1]}function Ut(){return function jt(){return function st(t){var i=Pt,n=It,l=Nt,a=Ct,m=null;function y(){var p,s=Mt.call(arguments),o=i.apply(this,s),u=n.apply(this,s);if(m||(m=p=Tt()),t(m,+l.apply(this,(s[0]=o,s)),+a.apply(this,s),+l.apply(this,(s[0]=u,s)),+a.apply(this,s)),p)return m=null,p+""||null}return y.source=function(p){return arguments.length?(i=p,y):i},y.target=function(p){return arguments.length?(n=p,y):n},y.x=function(p){return arguments.length?(l="function"==typeof p?p:mt(+p),y):l},y.y=function(p){return arguments.length?(a="function"==typeof p?p:mt(+p),y):a},y.context=function(p){return arguments.length?(m=p??null,y):m},y}(Ot)}().source(Dt).target(Rt)}j(7374),j(2571),j(627);var rt=function(){var t=function(p,s,o,u){for(o=o||{},u=p.length;u--;o[p[u]]=s);return o},i=[1,9],n=[1,10],l=[1,5,10,12],a={trace:function(){},yy:{},symbols_:{error:2,start:3,SANKEY:4,NEWLINE:5,csv:6,opt_eof:7,record:8,csv_tail:9,EOF:10,"field[source]":11,COMMA:12,"field[target]":13,"field[value]":14,field:15,escaped:16,non_escaped:17,DQUOTE:18,ESCAPED_TEXT:19,NON_ESCAPED_TEXT:20,$accept:0,$end:1},terminals_:{2:"error",4:"SANKEY",5:"NEWLINE",10:"EOF",11:"field[source]",12:"COMMA",13:"field[target]",14:"field[value]",18:"DQUOTE",19:"ESCAPED_TEXT",20:"NON_ESCAPED_TEXT"},productions_:[0,[3,4],[6,2],[9,2],[9,0],[7,1],[7,0],[8,5],[15,1],[15,1],[16,3],[17,1]],performAction:function(s,o,u,k,b,d,_){var E=d.length-1;switch(b){case 7:const S=k.findOrCreateNode(d[E-4].trim().replaceAll('""','"')),A=k.findOrCreateNode(d[E-2].trim().replaceAll('""','"')),C=parseFloat(d[E].trim());k.addLink(S,A,C);break;case 8:case 9:case 11:this.$=d[E];break;case 10:this.$=d[E-1]}},table:[{3:1,4:[1,2]},{1:[3]},{5:[1,3]},{6:4,8:5,15:6,16:7,17:8,18:i,20:n},{1:[2,6],7:11,10:[1,12]},t(n,[2,4],{9:13,5:[1,14]}),{12:[1,15]},t(l,[2,8]),t(l,[2,9]),{19:[1,16]},t(l,[2,11]),{1:[2,1]},{1:[2,5]},t(n,[2,2]),{6:17,8:5,15:6,16:7,17:8,18:i,20:n},{15:18,16:7,17:8,18:i,20:n},{18:[1,19]},t(n,[2,3]),{12:[1,20]},t(l,[2,10]),{15:21,16:7,17:8,18:i,20:n},t([1,5,10],[2,7])],defaultActions:{11:[2,1],12:[2,5]},parseError:function(s,o){if(!o.recoverable){var u=new Error(s);throw u.hash=o,u}this.trace(s)},parse:function(s){var u=[0],k=[],b=[null],d=[],_=this.table,E="",S=0,A=0,R=d.slice.call(arguments,1),L=Object.create(this.lexer),N={yy:{}};for(var $ in this.yy)Object.prototype.hasOwnProperty.call(this.yy,$)&&(N.yy[$]=this.yy[$]);L.setInput(s,N.yy),N.yy.lexer=L,N.yy.parser=this,typeof L.yylloc>"u"&&(L.yylloc={});var P=L.yylloc;d.push(P);var v,I=L.options&&L.options.ranges;this.parseError="function"==typeof N.yy.parseError?N.yy.parseError:Object.getPrototypeOf(this).parseError;for(var w,z,T,W,f,c,r,e={};;){if(this.defaultActions[z=u[u.length-1]]?T=this.defaultActions[z]:((null===w||typeof w>"u")&&(v=void 0,"number"!=typeof(v=k.pop()||L.lex()||1)&&(v instanceof Array&&(v=(k=v).pop()),v=this.symbols_[v]||v),w=v),T=_[z]&&_[z][w]),typeof T>"u"||!T.length||!T[0]){var x;for(f in r=[],_[z])this.terminals_[f]&&f>2&&r.push("'"+this.terminals_[f]+"'");x=L.showPosition?"Parse error on line "+(S+1)+":\n"+L.showPosition()+"\nExpecting "+r.join(", ")+", got '"+(this.terminals_[w]||w)+"'":"Parse error on line "+(S+1)+": Unexpected "+(1==w?"end of input":"'"+(this.terminals_[w]||w)+"'"),this.parseError(x,{text:L.match,token:this.terminals_[w]||w,line:L.yylineno,loc:P,expected:r})}if(T[0]instanceof Array&&T.length>1)throw new Error("Parse Error: multiple actions possible at state: "+z+", token: "+w);switch(T[0]){case 1:u.push(w),b.push(L.yytext),d.push(L.yylloc),u.push(T[1]),w=null,A=L.yyleng,E=L.yytext,S=L.yylineno,P=L.yylloc;break;case 2:if(e.$=b[b.length-(c=this.productions_[T[1]][1])],e._$={first_line:d[d.length-(c||1)].first_line,last_line:d[d.length-1].last_line,first_column:d[d.length-(c||1)].first_column,last_column:d[d.length-1].last_column},I&&(e._$.range=[d[d.length-(c||1)].range[0],d[d.length-1].range[1]]),typeof(W=this.performAction.apply(e,[E,A,S,N.yy,T[1],b,d].concat(R)))<"u")return W;c&&(u=u.slice(0,-1*c*2),b=b.slice(0,-1*c),d=d.slice(0,-1*c)),u.push(this.productions_[T[1]][0]),b.push(e.$),d.push(e._$),u.push(_[u[u.length-2]][u[u.length-1]]);break;case 3:return!0}}return!0}};function y(){this.yy={}}return a.lexer=function(){return{EOF:1,parseError:function(o,u){if(!this.yy.parser)throw new Error(o);this.yy.parser.parseError(o,u)},setInput:function(s,o){return this.yy=o||this.yy||{},this._input=s,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},input:function(){var s=this._input[0];return this.yytext+=s,this.yyleng++,this.offset++,this.match+=s,this.matched+=s,s.match(/(?:\r\n?|\n).*/g)?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),s},unput:function(s){var o=s.length,u=s.split(/(?:\r\n?|\n)/g);this._input=s+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-o),this.offset-=o;var k=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),u.length-1&&(this.yylineno-=u.length-1);var b=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:u?(u.length===k.length?this.yylloc.first_column:0)+k[k.length-u.length].length-u[0].length:this.yylloc.first_column-o},this.options.ranges&&(this.yylloc.range=[b[0],b[0]+this.yyleng-o]),this.yyleng=this.yytext.length,this},more:function(){return this._more=!0,this},reject:function(){return this.options.backtrack_lexer?(this._backtrack=!0,this):this.parseError("Lexical error on line "+(this.yylineno+1)+". You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n"+this.showPosition(),{text:"",token:null,line:this.yylineno})},less:function(s){this.unput(this.match.slice(s))},pastInput:function(){var s=this.matched.substr(0,this.matched.length-this.match.length);return(s.length>20?"...":"")+s.substr(-20).replace(/\n/g,"")},upcomingInput:function(){var s=this.match;return s.length<20&&(s+=this._input.substr(0,20-s.length)),(s.substr(0,20)+(s.length>20?"...":"")).replace(/\n/g,"")},showPosition:function(){var s=this.pastInput(),o=new Array(s.length+1).join("-");return s+this.upcomingInput()+"\n"+o+"^"},test_match:function(s,o){var u,k,b;if(this.options.backtrack_lexer&&(b={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(b.yylloc.range=this.yylloc.range.slice(0))),(k=s[0].match(/(?:\r\n?|\n).*/g))&&(this.yylineno+=k.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:k?k[k.length-1].length-k[k.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+s[0].length},this.yytext+=s[0],this.match+=s[0],this.matches=s,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(s[0].length),this.matched+=s[0],u=this.performAction.call(this,this.yy,this,o,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),u)return u;if(this._backtrack){for(var d in b)this[d]=b[d];return!1}return!1},next:function(){if(this.done)return this.EOF;var s,o,u,k;this._input||(this.done=!0),this._more||(this.yytext="",this.match="");for(var b=this._currentRules(),d=0;d<b.length;d++)if((u=this._input.match(this.rules[b[d]]))&&(!o||u[0].length>o[0].length)){if(o=u,k=d,this.options.backtrack_lexer){if(!1!==(s=this.test_match(u,b[d])))return s;if(this._backtrack){o=!1;continue}return!1}if(!this.options.flex)break}return o?!1!==(s=this.test_match(o,b[k]))&&s:""===this._input?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+". Unrecognized text.\n"+this.showPosition(),{text:"",token:null,line:this.yylineno})},lex:function(){return this.next()||this.lex()},begin:function(o){this.conditionStack.push(o)},popState:function(){return this.conditionStack.length-1>0?this.conditionStack.pop():this.conditionStack[0]},_currentRules:function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},topState:function(o){return(o=this.conditionStack.length-1-Math.abs(o||0))>=0?this.conditionStack[o]:"INITIAL"},pushState:function(o){this.begin(o)},stateStackSize:function(){return this.conditionStack.length},options:{"case-insensitive":!0},performAction:function(o,u,k,b){switch(k){case 0:return this.pushState("csv"),4;case 1:return 10;case 2:return 5;case 3:return 12;case 4:return this.pushState("escaped_text"),18;case 5:return 20;case 6:return this.popState("escaped_text"),18;case 7:return 19}},rules:[/^(?:sankey-beta\b)/i,/^(?:$)/i,/^(?:((\u000D\u000A)|(\u000A)))/i,/^(?:(\u002C))/i,/^(?:(\u0022))/i,/^(?:([\u0020-\u0021\u0023-\u002B\u002D-\u007E])*)/i,/^(?:(\u0022)(?!(\u0022)))/i,/^(?:(([\u0020-\u0021\u0023-\u002B\u002D-\u007E])|(\u002C)|(\u000D)|(\u000A)|(\u0022)(\u0022))*)/i],conditions:{csv:{rules:[1,2,3,4,5,6,7],inclusive:!1},escaped_text:{rules:[6,7],inclusive:!1},INITIAL:{rules:[0,1,2,3,4,5,6,7],inclusive:!0}}}}(),y.prototype=a,a.Parser=y,new y}();rt.parser=rt;const Q=rt;let Z=[],J=[],V={};class Vt{constructor(i,n,l=0){this.source=i,this.target=n,this.value=l}}class Ft{constructor(i){this.ID=i}}const Gt={nodesMap:V,getConfig:()=>(0,M.c)().sankey,getNodes:()=>J,getLinks:()=>Z,getGraph:()=>({nodes:J.map(t=>({id:t.ID})),links:Z.map(t=>({source:t.source.ID,target:t.target.ID,value:t.value}))}),addLink:(t,i,n)=>{Z.push(new Vt(t,i,n))},findOrCreateNode:t=>(t=M.e.sanitizeText(t,(0,M.c)()),V[t]||(V[t]=new Ft(t),J.push(V[t])),V[t]),getAccTitle:M.g,setAccTitle:M.s,getAccDescription:M.a,setAccDescription:M.b,getDiagramTitle:M.t,setDiagramTitle:M.q,clear:()=>{Z=[],J=[],V={},(0,M.v)()}};let kt=(()=>{let t=class lt{static next(n){return new lt(n+ ++lt.count)}constructor(n){this.id=n,this.href=`#${n}`}toString(){return"url("+this.href+")"}};return t.count=0,t})();const Yt={left:function _t(t){return t.depth},right:function vt(t,i){return i-1-t.height},center:function bt(t){return t.targetLinks.length?t.depth:t.sourceLinks.length?ct(t.sourceLinks,xt)-1:0},justify:ut},Ht={draw:function(t,i,n,l){const{securityLevel:a,sankey:m}=(0,M.c)(),y=M.K.sankey;let p;"sandbox"===a&&(p=(0,B.Ltv)("#i"+i));const s=(0,B.Ltv)("sandbox"===a?p.nodes()[0].contentDocument.body:"body"),o="sandbox"===a?s.select(`[id="${i}"]`):(0,B.Ltv)(`[id="${i}"]`),u=m?.width??y.width,k=m?.height??y.width,b=m?.useMaxWidth??y.useMaxWidth,d=m?.nodeAlignment??y.nodeAlignment,_=m?.prefix??y.prefix,E=m?.suffix??y.suffix,S=m?.showValues??y.showValues,A=l.db.getGraph(),C=Yt[d];(function Et(){let y,o,u,t=0,i=0,n=1,l=1,a=24,m=8,p=wt,s=ut,k=Lt,b=St,d=6;function _(){const e={nodes:k.apply(null,arguments),links:b.apply(null,arguments)};return function E({nodes:e,links:f}){for(const[h,r]of e.entries())r.index=h,r.sourceLinks=[],r.targetLinks=[];const c=new Map(e.map((h,r)=>[p(h,r,e),h]));for(const[h,r]of f.entries()){r.index=h;let{source:x,target:v}=r;"object"!=typeof x&&(x=r.source=dt(c,x)),"object"!=typeof v&&(v=r.target=dt(c,v)),x.sourceLinks.push(r),v.targetLinks.push(r)}if(null!=u)for(const{sourceLinks:h,targetLinks:r}of e)h.sort(u),r.sort(u)}(e),function S({nodes:e}){for(const f of e)f.value=void 0===f.fixedValue?Math.max(q(f.sourceLinks,tt),q(f.targetLinks,tt)):f.fixedValue}(e),function A({nodes:e}){const f=e.length;let c=new Set(e),h=new Set,r=0;for(;c.size;){for(const x of c){x.depth=r;for(const{target:v}of x.sourceLinks)h.add(v)}if(++r>f)throw new Error("circular link");c=h,h=new Set}}(e),function C({nodes:e}){const f=e.length;let c=new Set(e),h=new Set,r=0;for(;c.size;){for(const x of c){x.height=r;for(const{source:v}of x.targetLinks)h.add(v)}if(++r>f)throw new Error("circular link");c=h,h=new Set}}(e),function L(e){const f=function O({nodes:e}){const f=ht(e,r=>r.depth)+1,c=(n-t-a)/(f-1),h=new Array(f);for(const r of e){const x=Math.max(0,Math.min(f-1,Math.floor(s.call(null,r,f))));r.layer=x,r.x0=t+x*c,r.x1=r.x0+a,h[x]?h[x].push(r):h[x]=[r]}if(o)for(const r of h)r.sort(o);return h}(e);y=Math.min(m,(l-i)/(ht(f,c=>c.length)-1)),function R(e){const f=ct(e,c=>(l-i-(c.length-1)*y)/q(c,tt));for(const c of e){let h=i;for(const r of c){r.y0=h,r.y1=h+r.value*f,h=r.y1+y;for(const x of r.sourceLinks)x.width=x.value*f}h=(l-h+y)/(c.length+1);for(let r=0;r<c.length;++r){const x=c[r];x.y0+=h*(r+1),x.y1+=h*(r+1)}z(c)}}(f);for(let c=0;c<d;++c){const h=Math.pow(.99,c),r=Math.max(1-h,(c+1)/d);$(f,h,r),N(f,h,r)}}(e),gt(e),e}function N(e,f,c){for(let h=1,r=e.length;h<r;++h){const x=e[h];for(const v of x){let F=0,U=0;for(const{source:Y,value:ot}of v.targetLinks){let H=ot*(v.layer-Y.layer);F+=T(Y,v)*H,U+=H}if(!(U>0))continue;let G=(F/U-v.y0)*f;v.y0+=G,v.y1+=G,w(v)}void 0===o&&x.sort(K),P(x,c)}}function $(e,f,c){for(let r=e.length-2;r>=0;--r){const x=e[r];for(const v of x){let F=0,U=0;for(const{target:Y,value:ot}of v.sourceLinks){let H=ot*(Y.layer-v.layer);F+=W(v,Y)*H,U+=H}if(!(U>0))continue;let G=(F/U-v.y0)*f;v.y0+=G,v.y1+=G,w(v)}void 0===o&&x.sort(K),P(x,c)}}function P(e,f){const c=e.length>>1,h=e[c];g(e,h.y0-y,c-1,f),I(e,h.y1+y,c+1,f),g(e,l,e.length-1,f),I(e,i,0,f)}function I(e,f,c,h){for(;c<e.length;++c){const r=e[c],x=(f-r.y0)*h;x>1e-6&&(r.y0+=x,r.y1+=x),f=r.y1+y}}function g(e,f,c,h){for(;c>=0;--c){const r=e[c],x=(r.y1-f)*h;x>1e-6&&(r.y0-=x,r.y1-=x),f=r.y0-y}}function w({sourceLinks:e,targetLinks:f}){if(void 0===u){for(const{source:{sourceLinks:c}}of f)c.sort(yt);for(const{target:{targetLinks:c}}of e)c.sort(ft)}}function z(e){if(void 0===u)for(const{sourceLinks:f,targetLinks:c}of e)f.sort(yt),c.sort(ft)}function T(e,f){let c=e.y0-(e.sourceLinks.length-1)*y/2;for(const{target:h,width:r}of e.sourceLinks){if(h===f)break;c+=r+y}for(const{source:h,width:r}of f.targetLinks){if(h===e)break;c-=r}return c}function W(e,f){let c=f.y0-(f.targetLinks.length-1)*y/2;for(const{source:h,width:r}of f.targetLinks){if(h===e)break;c+=r+y}for(const{target:h,width:r}of e.sourceLinks){if(h===f)break;c-=r}return c}return _.update=function(e){return gt(e),e},_.nodeId=function(e){return arguments.length?(p="function"==typeof e?e:X(e),_):p},_.nodeAlign=function(e){return arguments.length?(s="function"==typeof e?e:X(e),_):s},_.nodeSort=function(e){return arguments.length?(o=e,_):o},_.nodeWidth=function(e){return arguments.length?(a=+e,_):a},_.nodePadding=function(e){return arguments.length?(m=y=+e,_):m},_.nodes=function(e){return arguments.length?(k="function"==typeof e?e:X(e),_):k},_.links=function(e){return arguments.length?(b="function"==typeof e?e:X(e),_):b},_.linkSort=function(e){return arguments.length?(u=e,_):u},_.size=function(e){return arguments.length?(t=i=0,n=+e[0],l=+e[1],_):[n-t,l-i]},_.extent=function(e){return arguments.length?(t=+e[0][0],n=+e[1][0],i=+e[0][1],l=+e[1][1],_):[[t,i],[n,l]]},_.iterations=function(e){return arguments.length?(d=+e,_):d},_})().nodeId(g=>g.id).nodeWidth(10).nodePadding(10+(S?15:0)).nodeAlign(C).extent([[0,0],[u,k]])(A);const L=(0,B.UMr)(B.zt);o.append("g").attr("class","nodes").selectAll(".node").data(A.nodes).join("g").attr("class","node").attr("id",g=>(g.uid=kt.next("node-")).id).attr("transform",function(g){return"translate("+g.x0+","+g.y0+")"}).attr("x",g=>g.x0).attr("y",g=>g.y0).append("rect").attr("height",g=>g.y1-g.y0).attr("width",g=>g.x1-g.x0).attr("fill",g=>L(g.id)),o.append("g").attr("class","node-labels").attr("font-family","sans-serif").attr("font-size",14).selectAll("text").data(A.nodes).join("text").attr("x",g=>g.x0<u/2?g.x1+6:g.x0-6).attr("y",g=>(g.y1+g.y0)/2).attr("dy",(S?"0":"0.35")+"em").attr("text-anchor",g=>g.x0<u/2?"start":"end").text(({id:g,value:w})=>S?`${g}\n${_}${Math.round(100*w)/100}${E}`:g);const $=o.append("g").attr("class","links").attr("fill","none").attr("stroke-opacity",.5).selectAll(".link").data(A.links).join("g").attr("class","link").style("mix-blend-mode","multiply"),P=m?.linkColor||"gradient";if("gradient"===P){const g=$.append("linearGradient").attr("id",w=>(w.uid=kt.next("linearGradient-")).id).attr("gradientUnits","userSpaceOnUse").attr("x1",w=>w.source.x1).attr("x2",w=>w.target.x0);g.append("stop").attr("offset","0%").attr("stop-color",w=>L(w.source.id)),g.append("stop").attr("offset","100%").attr("stop-color",w=>L(w.target.id))}let I;switch(P){case"gradient":I=g=>g.uid;break;case"source":I=g=>L(g.source.id);break;case"target":I=g=>L(g.target.id);break;default:I=P}$.append("path").attr("d",Ut()).attr("stroke",I).attr("stroke-width",g=>Math.max(1,g.width)),(0,M.o)(void 0,o,0,b)}},Kt=Q.parse.bind(Q);Q.parse=t=>Kt((t=>t.replaceAll(/^[^\S\n\r]+|[^\S\n\r]+$/g,"").replaceAll(/([\n\r])+/g,"\n").trim())(t));const Qt={parser:Q,db:Gt,renderer:Ht}}}]);