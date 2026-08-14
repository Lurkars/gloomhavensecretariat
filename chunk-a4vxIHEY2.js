import{n as o}from"./chunk-Cvof6wl4.js";import{R as ct,W as pf}from"./chunk-B3_ONX3Q.js";import{I as la,M as gh,N as ha,V as oa,X as sa,at as zt$1,k as ea,q as ra,x as aa,y as _e$1}from"./chunk-D3lOZ7O0.js";import{o as Pt,s as ai}from"./chunk-D3EKICjS.js";import{r as U$1}from"./chunk-BtTBocVe.js";import{n as R}from"./chunk-DpfjkfUZ.js";import{t as g}from"./chunk-DPlkaHzw.js";import{t as l}from"./chunk-BqRu2BAD.js";var Ct=(function(){var t=o(function(V,a,d,r){for(d=d||{},r=V.length;r--;d[V[r]]=a);return d},`o`),e=[1,2],l=[1,3],s=[1,4],c=[2,4],h=[1,9],p=[1,11],y=[1,16],o$1=[1,17],T=[1,18],m=[1,19],N=[1,33],x=[1,20],_=[1,21],u=[1,22],L=[1,23],I=[1,24],C=[1,26],F=[1,27],A=[1,28],P=[1,29],w=[1,30],H=[1,31],it=[1,32],rt=[1,35],at=[1,36],nt=[1,37],ot=[1,38],z=[1,34],S=[1,4,5,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],lt=[1,4,5,14,15,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,39,40,41,45,48,51,52,53,54,57],Lt=[4,5,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],Tt={trace:o(function(){},`trace`),yy:{},symbols_:{error:2,start:3,SPACE:4,NL:5,SD:6,document:7,line:8,statement:9,classDefStatement:10,styleStatement:11,cssClassStatement:12,idStatement:13,DESCR:14,"-->":15,HIDE_EMPTY:16,scale:17,WIDTH:18,COMPOSIT_STATE:19,STRUCT_START:20,STRUCT_STOP:21,STATE_DESCR:22,AS:23,ID:24,FORK:25,JOIN:26,CHOICE:27,CONCURRENT:28,note:29,notePosition:30,NOTE_TEXT:31,direction:32,acc_title:33,acc_title_value:34,acc_descr:35,acc_descr_value:36,acc_descr_multiline_value:37,CLICK:38,STRING:39,HREF:40,classDef:41,CLASSDEF_ID:42,CLASSDEF_STYLEOPTS:43,DEFAULT:44,style:45,STYLE_IDS:46,STYLEDEF_STYLEOPTS:47,class:48,CLASSENTITY_IDS:49,STYLECLASS:50,direction_tb:51,direction_bt:52,direction_rl:53,direction_lr:54,eol:55,";":56,EDGE_STATE:57,STYLE_SEPARATOR:58,left_of:59,right_of:60,$accept:0,$end:1},terminals_:{2:`error`,4:`SPACE`,5:`NL`,6:`SD`,14:`DESCR`,15:`-->`,16:`HIDE_EMPTY`,17:`scale`,18:`WIDTH`,19:`COMPOSIT_STATE`,20:`STRUCT_START`,21:`STRUCT_STOP`,22:`STATE_DESCR`,23:`AS`,24:`ID`,25:`FORK`,26:`JOIN`,27:`CHOICE`,28:`CONCURRENT`,29:`note`,31:`NOTE_TEXT`,33:`acc_title`,34:`acc_title_value`,35:`acc_descr`,36:`acc_descr_value`,37:`acc_descr_multiline_value`,38:`CLICK`,39:`STRING`,40:`HREF`,41:`classDef`,42:`CLASSDEF_ID`,43:`CLASSDEF_STYLEOPTS`,44:`DEFAULT`,45:`style`,46:`STYLE_IDS`,47:`STYLEDEF_STYLEOPTS`,48:`class`,49:`CLASSENTITY_IDS`,50:`STYLECLASS`,51:`direction_tb`,52:`direction_bt`,53:`direction_rl`,54:`direction_lr`,56:`;`,57:`EDGE_STATE`,58:`STYLE_SEPARATOR`,59:`left_of`,60:`right_of`},productions_:[0,[3,2],[3,2],[3,2],[7,0],[7,2],[8,2],[8,1],[8,1],[9,1],[9,1],[9,1],[9,1],[9,2],[9,3],[9,4],[9,1],[9,2],[9,1],[9,4],[9,3],[9,6],[9,1],[9,1],[9,1],[9,1],[9,4],[9,4],[9,1],[9,2],[9,2],[9,1],[9,5],[9,5],[10,3],[10,3],[11,3],[12,3],[32,1],[32,1],[32,1],[32,1],[55,1],[55,1],[13,1],[13,1],[13,3],[13,3],[30,1],[30,1]],performAction:o(function(a,d,r,g,b,i,K){var n=i.length-1;switch(b){case 3:return g.setRootDoc(i[n]),i[n];case 4:this.$=[];break;case 5:i[n]!=`nl`&&(i[n-1].push(i[n]),this.$=i[n-1]);break;case 6:case 7:this.$=i[n];break;case 8:this.$=`nl`;break;case 12:this.$=i[n];break;case 13:let ht=i[n-1];ht.description=g.trimColon(i[n]),this.$=ht;break;case 14:this.$={stmt:`relation`,state1:i[n-2],state2:i[n]};break;case 15:let ut=g.trimColon(i[n]);this.$={stmt:`relation`,state1:i[n-3],state2:i[n-1],description:ut};break;case 19:this.$={stmt:`state`,id:i[n-3],type:`default`,description:``,doc:i[n-1]};break;case 20:var B=i[n],Y=i[n-2].trim();if(i[n].match(`:`)){var Q=i[n].split(`:`);B=Q[0],Y=[Y,Q[1]]}this.$={stmt:`state`,id:B,type:`default`,description:Y};break;case 21:this.$={stmt:`state`,id:i[n-3],type:`default`,description:i[n-5],doc:i[n-1]};break;case 22:this.$={stmt:`state`,id:i[n],type:`fork`};break;case 23:this.$={stmt:`state`,id:i[n],type:`join`};break;case 24:this.$={stmt:`state`,id:i[n],type:`choice`};break;case 25:this.$={stmt:`state`,id:g.getDividerId(),type:`divider`};break;case 26:this.$={stmt:`state`,id:i[n-1].trim(),note:{position:i[n-2].trim(),text:i[n].trim()}};break;case 29:this.$=i[n].trim(),g.setAccTitle(this.$);break;case 30:case 31:this.$=i[n].trim(),g.setAccDescription(this.$);break;case 32:this.$={stmt:`click`,id:i[n-3],url:i[n-2],tooltip:i[n-1]};break;case 33:this.$={stmt:`click`,id:i[n-3],url:i[n-1],tooltip:``};break;case 34:case 35:this.$={stmt:`classDef`,id:i[n-1].trim(),classes:i[n].trim()};break;case 36:this.$={stmt:`style`,id:i[n-1].trim(),styleClass:i[n].trim()};break;case 37:this.$={stmt:`applyClass`,id:i[n-1].trim(),styleClass:i[n].trim()};break;case 38:g.setDirection(`TB`),this.$={stmt:`dir`,value:`TB`};break;case 39:g.setDirection(`BT`),this.$={stmt:`dir`,value:`BT`};break;case 40:g.setDirection(`RL`),this.$={stmt:`dir`,value:`RL`};break;case 41:g.setDirection(`LR`),this.$={stmt:`dir`,value:`LR`};break;case 44:case 45:this.$={stmt:`state`,id:i[n].trim(),type:`default`,description:``};break;case 46:this.$={stmt:`state`,id:i[n-2].trim(),classes:[i[n].trim()],type:`default`,description:``};break;case 47:this.$={stmt:`state`,id:i[n-2].trim(),classes:[i[n].trim()],type:`default`,description:``};break}},`anonymous`),table:[{3:1,4:e,5:l,6:s},{1:[3]},{3:5,4:e,5:l,6:s},{3:6,4:e,5:l,6:s},t([1,4,5,16,17,19,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],c,{7:7}),{1:[2,1]},{1:[2,2]},{1:[2,3],4:h,5:p,8:8,9:10,10:12,11:13,12:14,13:15,16:y,17:o$1,19:T,22:m,24:N,25:x,26:_,27:u,28:L,29:I,32:25,33:C,35:F,37:A,38:P,41:w,45:H,48:it,51:rt,52:at,53:nt,54:ot,57:z},t(S,[2,5]),{9:39,10:12,11:13,12:14,13:15,16:y,17:o$1,19:T,22:m,24:N,25:x,26:_,27:u,28:L,29:I,32:25,33:C,35:F,37:A,38:P,41:w,45:H,48:it,51:rt,52:at,53:nt,54:ot,57:z},t(S,[2,7]),t(S,[2,8]),t(S,[2,9]),t(S,[2,10]),t(S,[2,11]),t(S,[2,12],{14:[1,40],15:[1,41]}),t(S,[2,16]),{18:[1,42]},t(S,[2,18],{20:[1,43]}),{23:[1,44]},t(S,[2,22]),t(S,[2,23]),t(S,[2,24]),t(S,[2,25]),{30:45,31:[1,46],59:[1,47],60:[1,48]},t(S,[2,28]),{34:[1,49]},{36:[1,50]},t(S,[2,31]),{13:51,24:N,57:z},{42:[1,52],44:[1,53]},{46:[1,54]},{49:[1,55]},t(lt,[2,44],{58:[1,56]}),t(lt,[2,45],{58:[1,57]}),t(S,[2,38]),t(S,[2,39]),t(S,[2,40]),t(S,[2,41]),t(S,[2,6]),t(S,[2,13]),{13:58,24:N,57:z},t(S,[2,17]),t(Lt,c,{7:59}),{24:[1,60]},{24:[1,61]},{23:[1,62]},{24:[2,48]},{24:[2,49]},t(S,[2,29]),t(S,[2,30]),{39:[1,63],40:[1,64]},{43:[1,65]},{43:[1,66]},{47:[1,67]},{50:[1,68]},{24:[1,69]},{24:[1,70]},t(S,[2,14],{14:[1,71]}),{4:h,5:p,8:8,9:10,10:12,11:13,12:14,13:15,16:y,17:o$1,19:T,21:[1,72],22:m,24:N,25:x,26:_,27:u,28:L,29:I,32:25,33:C,35:F,37:A,38:P,41:w,45:H,48:it,51:rt,52:at,53:nt,54:ot,57:z},t(S,[2,20],{20:[1,73]}),{31:[1,74]},{24:[1,75]},{39:[1,76]},{39:[1,77]},t(S,[2,34]),t(S,[2,35]),t(S,[2,36]),t(S,[2,37]),t(lt,[2,46]),t(lt,[2,47]),t(S,[2,15]),t(S,[2,19]),t(Lt,c,{7:78}),t(S,[2,26]),t(S,[2,27]),{5:[1,79]},{5:[1,80]},{4:h,5:p,8:8,9:10,10:12,11:13,12:14,13:15,16:y,17:o$1,19:T,21:[1,81],22:m,24:N,25:x,26:_,27:u,28:L,29:I,32:25,33:C,35:F,37:A,38:P,41:w,45:H,48:it,51:rt,52:at,53:nt,54:ot,57:z},t(S,[2,32]),t(S,[2,33]),t(S,[2,21])],defaultActions:{5:[2,1],6:[2,2],47:[2,48],48:[2,49]},parseError:o(function(a,d){if(d.recoverable)this.trace(a);else{var r=new Error(a);throw r.hash=d,r}},`parseError`),parse:o(function(a){var d=this,r=[0],g=[],b=[null],i=[],K=this.table,n=``,B=0,Y=0,Q=0,ht=2,ut=1,fe=i.slice.call(arguments,1),k=Object.create(this.lexer),W={yy:{}};for(var bt in this.yy)Object.prototype.hasOwnProperty.call(this.yy,bt)&&(W.yy[bt]=this.yy[bt]);k.setInput(a,W.yy),W.yy.lexer=k,W.yy.parser=this,typeof k.yylloc>`u`&&(k.yylloc={});var Et=k.yylloc;i.push(Et);var pe=k.options&&k.options.ranges;typeof W.yy.parseError==`function`?this.parseError=W.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;function Se(O){r.length=r.length-2*O,b.length=b.length-O,i.length=i.length-O}o(Se,`popStack`);function It(){var O;return O=g.pop()||k.lex()||ut,typeof O!=`number`&&(O instanceof Array&&(g=O,O=g.pop()),O=d.symbols_[O]||O),O}o(It,`lex`);for(var D,mt,j,R,kt,X={},dt,G,wt,ft;;){if(j=r[r.length-1],this.defaultActions[j]?R=this.defaultActions[j]:((D===null||typeof D>`u`)&&(D=It()),R=K[j]&&K[j][D]),typeof R>`u`||!R.length||!R[0]){var _t=``;ft=[];for(dt in K[j])this.terminals_[dt]&&dt>ht&&ft.push(`'`+this.terminals_[dt]+`'`);k.showPosition?_t=`Parse error on line `+(B+1)+`:
`+k.showPosition()+`
Expecting `+ft.join(`, `)+`, got '`+(this.terminals_[D]||D)+`'`:_t=`Parse error on line `+(B+1)+`: Unexpected `+(D==ut?`end of input`:`'`+(this.terminals_[D]||D)+`'`),this.parseError(_t,{text:k.match,token:this.terminals_[D]||D,line:k.yylineno,loc:Et,expected:ft})}if(R[0]instanceof Array&&R.length>1)throw new Error(`Parse Error: multiple actions possible at state: `+j+`, token: `+D);switch(R[0]){case 1:r.push(D),b.push(k.yytext),i.push(k.yylloc),r.push(R[1]),D=null,mt?(D=mt,mt=null):(Y=k.yyleng,n=k.yytext,B=k.yylineno,Et=k.yylloc,Q>0&&Q--);break;case 2:if(G=this.productions_[R[1]][1],X.$=b[b.length-G],X._$={first_line:i[i.length-(G||1)].first_line,last_line:i[i.length-1].last_line,first_column:i[i.length-(G||1)].first_column,last_column:i[i.length-1].last_column},pe&&(X._$.range=[i[i.length-(G||1)].range[0],i[i.length-1].range[1]]),kt=this.performAction.apply(X,[n,Y,B,W.yy,R[1],b,i].concat(fe)),typeof kt<`u`)return kt;G&&(r=r.slice(0,-1*G*2),b=b.slice(0,-1*G),i=i.slice(0,-1*G)),r.push(this.productions_[R[1]][0]),b.push(X.$),i.push(X._$),wt=K[r[r.length-2]][r[r.length-1]],r.push(wt);break;case 3:return!0}}return!0},`parse`)};Tt.lexer=(function(){return{EOF:1,parseError:o(function(d,r){if(this.yy.parser)this.yy.parser.parseError(d,r);else throw new Error(d)},`parseError`),setInput:o(function(a,d){return this.yy=d||this.yy||{},this._input=a,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match=``,this.conditionStack=[`INITIAL`],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},`setInput`),input:o(function(){var a=this._input[0];this.yytext+=a,this.yyleng++,this.offset++,this.match+=a,this.matched+=a;return a.match(/(?:\r\n?|\n).*/g)?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),a},`input`),unput:o(function(a){var d=a.length,r=a.split(/(?:\r\n?|\n)/g);this._input=a+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-d),this.offset-=d;var g=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),r.length-1&&(this.yylineno-=r.length-1);var b=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:r?(r.length===g.length?this.yylloc.first_column:0)+g[g.length-r.length].length-r[0].length:this.yylloc.first_column-d},this.options.ranges&&(this.yylloc.range=[b[0],b[0]+this.yyleng-d]),this.yyleng=this.yytext.length,this},`unput`),more:o(function(){return this._more=!0,this},`more`),reject:o(function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError(`Lexical error on line `+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:``,token:null,line:this.yylineno});return this},`reject`),less:o(function(a){this.unput(this.match.slice(a))},`less`),pastInput:o(function(){var a=this.matched.substr(0,this.matched.length-this.match.length);return(a.length>20?`...`:``)+a.substr(-20).replace(/\n/g,``)},`pastInput`),upcomingInput:o(function(){var a=this.match;return a.length<20&&(a+=this._input.substr(0,20-a.length)),(a.substr(0,20)+(a.length>20?`...`:``)).replace(/\n/g,``)},`upcomingInput`),showPosition:o(function(){var a=this.pastInput(),d=new Array(a.length+1).join(`-`);return a+this.upcomingInput()+`
`+d+`^`},`showPosition`),test_match:o(function(a,d){var r,g,b;if(this.options.backtrack_lexer&&(b={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(b.yylloc.range=this.yylloc.range.slice(0))),g=a[0].match(/(?:\r\n?|\n).*/g),g&&(this.yylineno+=g.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:g?g[g.length-1].length-g[g.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+a[0].length},this.yytext+=a[0],this.match+=a[0],this.matches=a,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(a[0].length),this.matched+=a[0],r=this.performAction.call(this,this.yy,this,d,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),r)return r;if(this._backtrack){for(var i in b)this[i]=b[i];return!1}return!1},`test_match`),next:o(function(){if(this.done)return this.EOF;this._input||(this.done=!0);var a,d,r,g;this._more||(this.yytext=``,this.match=``);for(var b=this._currentRules(),i=0;i<b.length;i++)if(r=this._input.match(this.rules[b[i]]),r&&(!d||r[0].length>d[0].length)){if(d=r,g=i,this.options.backtrack_lexer){if(a=this.test_match(r,b[i]),a!==!1)return a;if(this._backtrack){d=!1;continue}else return!1}else if(!this.options.flex)break}return d?(a=this.test_match(d,b[g]),a!==!1?a:!1):this._input===``?this.EOF:this.parseError(`Lexical error on line `+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:``,token:null,line:this.yylineno})},`next`),lex:o(function(){return this.next()||this.lex()},`lex`),begin:o(function(d){this.conditionStack.push(d)},`begin`),popState:o(function(){return this.conditionStack.length-1>0?this.conditionStack.pop():this.conditionStack[0]},`popState`),_currentRules:o(function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},`_currentRules`),topState:o(function(d){return d=this.conditionStack.length-1-Math.abs(d||0),d>=0?this.conditionStack[d]:`INITIAL`},`topState`),pushState:o(function(d){this.begin(d)},`pushState`),stateStackSize:o(function(){return this.conditionStack.length},`stateStackSize`),options:{"case-insensitive":!0},performAction:o(function(d,r,g,b){function i(){let n=r.yytext.indexOf(`%%`);if(n===0)return!1;if(n>0){let B=r.yytext.slice(0,n),Y=r.yytext.slice(n);Y&&d.lexer.unput(Y),r.yytext=B}return!0}o(i,`processId`);switch(g){case 0:return 38;case 1:return 40;case 2:return 39;case 3:return 44;case 4:return 51;case 5:return 52;case 6:return 53;case 7:return 54;case 8:return 5;case 9:break;case 10:break;case 11:break;case 12:break;case 13:return this.pushState(`SCALE`),17;case 14:return 18;case 15:this.popState();break;case 16:return this.begin(`acc_title`),33;case 17:return this.popState(),`acc_title_value`;case 18:return this.begin(`acc_descr`),35;case 19:return this.popState(),`acc_descr_value`;case 20:this.begin(`acc_descr_multiline`);break;case 21:this.popState();break;case 22:return`acc_descr_multiline_value`;case 23:return this.pushState(`CLASSDEF`),41;case 24:return this.popState(),this.pushState(`CLASSDEFID`),`DEFAULT_CLASSDEF_ID`;case 25:return this.popState(),this.pushState(`CLASSDEFID`),42;case 26:return this.popState(),43;case 27:return this.pushState(`CLASS`),48;case 28:return this.popState(),this.pushState(`CLASS_STYLE`),49;case 29:return this.popState(),50;case 30:return this.pushState(`STYLE`),45;case 31:return this.popState(),this.pushState(`STYLEDEF_STYLES`),46;case 32:return this.popState(),47;case 33:return this.pushState(`SCALE`),17;case 34:return 18;case 35:this.popState();break;case 36:this.pushState(`STATE`);break;case 37:return this.popState(),r.yytext=r.yytext.slice(0,-8).trim(),25;case 38:return this.popState(),r.yytext=r.yytext.slice(0,-8).trim(),26;case 39:return this.popState(),r.yytext=r.yytext.slice(0,-10).trim(),27;case 40:return this.popState(),r.yytext=r.yytext.slice(0,-8).trim(),25;case 41:return this.popState(),r.yytext=r.yytext.slice(0,-8).trim(),26;case 42:return this.popState(),r.yytext=r.yytext.slice(0,-10).trim(),27;case 43:return 51;case 44:return 52;case 45:return 53;case 46:return 54;case 47:this.pushState(`STATE_STRING`);break;case 48:return this.pushState(`STATE_ID`),`AS`;case 49:if(!i())return;return this.popState(),`ID`;case 50:this.popState();break;case 51:return`STATE_DESCR`;case 52:throw new Error(`Error: State name must be a single word. Found: "`+r.yytext.trim()+`"`);case 53:return 19;case 54:this.popState();break;case 55:return this.popState(),this.pushState(`struct`),20;case 56:return this.popState(),21;case 57:break;case 58:return this.begin(`NOTE`),29;case 59:return this.popState(),this.pushState(`NOTE_ID`),59;case 60:return this.popState(),this.pushState(`NOTE_ID`),60;case 61:this.popState(),this.pushState(`FLOATING_NOTE`);break;case 62:return this.popState(),this.pushState(`FLOATING_NOTE_ID`),`AS`;case 63:break;case 64:return`NOTE_TEXT`;case 65:if(!i())return;return this.popState(),`ID`;case 66:if(!i())return;return this.popState(),this.pushState(`NOTE_TEXT`),24;case 67:return this.popState(),r.yytext=r.yytext.substr(2).trim(),31;case 68:return this.popState(),r.yytext=r.yytext.slice(0,-8).trim(),31;case 69:return 6;case 70:return 6;case 71:return 16;case 72:return 57;case 73:return i()?24:void 0;case 74:return r.yytext=r.yytext.trim(),14;case 75:return 15;case 76:return 28;case 77:return 58;case 78:return 5;case 79:return`INVALID`}},`anonymous`),rules:[/^(?:click\b)/i,/^(?:href\b)/i,/^(?:"[^"]*")/i,/^(?:default\b)/i,/^(?:.*direction\s+TB[^\n]*)/i,/^(?:.*direction\s+BT[^\n]*)/i,/^(?:.*direction\s+RL[^\n]*)/i,/^(?:.*direction\s+LR[^\n]*)/i,/^(?:[\n]+)/i,/^(?:[\s]+)/i,/^(?:((?!\n)\s)+)/i,/^(?:#[^\n]*)/i,/^(?:%%(?!\{)[^\n]*)/i,/^(?:scale\s+)/i,/^(?:\d+)/i,/^(?:\s+width\b)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:classDef\s+)/i,/^(?:DEFAULT\s+)/i,/^(?:\w+\s+)/i,/^(?:[^\n]*)/i,/^(?:class\s+)/i,/^(?:(\w+)+((,\s*\w+)*))/i,/^(?:[^\n]*)/i,/^(?:style\s+)/i,/^(?:[\w,]+\s+)/i,/^(?:[^\n]*)/i,/^(?:scale\s+)/i,/^(?:\d+)/i,/^(?:\s+width\b)/i,/^(?:state\s+)/i,/^(?:.*<<fork>>)/i,/^(?:.*<<join>>)/i,/^(?:.*<<choice>>)/i,/^(?:.*\[\[fork\]\])/i,/^(?:.*\[\[join\]\])/i,/^(?:.*\[\[choice\]\])/i,/^(?:.*direction\s+TB[^\n]*)/i,/^(?:.*direction\s+BT[^\n]*)/i,/^(?:.*direction\s+RL[^\n]*)/i,/^(?:.*direction\s+LR[^\n]*)/i,/^(?:["])/i,/^(?:\s*as\s+)/i,/^(?:[^\n\{]*)/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:\w+\s+\w+.*?\{)/i,/^(?:[^\n\s\{]+)/i,/^(?:\n)/i,/^(?:\{)/i,/^(?:\})/i,/^(?:[\n])/i,/^(?:note\s+)/i,/^(?:left of\b)/i,/^(?:right of\b)/i,/^(?:")/i,/^(?:\s*as\s*)/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:[^\n]*)/i,/^(?:\s*[^:\n\s\-]+)/i,/^(?:\s*:[^:\n;]+)/i,/^(?:[\s\S]*?\n\s*end note\b)/i,/^(?:stateDiagram\s+)/i,/^(?:stateDiagram-v2\s+)/i,/^(?:hide empty description\b)/i,/^(?:\[\*\])/i,/^(?:[^:\n\s\-\{]+)/i,/^(?:\s*:(?:[^:\n;]|:[^:\n;])+)/i,/^(?:-->)/i,/^(?:--)/i,/^(?::::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{LINE:{rules:[10,11,12],inclusive:!1},struct:{rules:[10,11,12,23,27,30,36,43,44,45,46,56,57,58,72,73,74,75,76,77],inclusive:!1},FLOATING_NOTE_ID:{rules:[65],inclusive:!1},FLOATING_NOTE:{rules:[62,63,64],inclusive:!1},NOTE_TEXT:{rules:[67,68],inclusive:!1},NOTE_ID:{rules:[66],inclusive:!1},NOTE:{rules:[59,60,61],inclusive:!1},STYLEDEF_STYLEOPTS:{rules:[],inclusive:!1},STYLEDEF_STYLES:{rules:[32],inclusive:!1},STYLE_IDS:{rules:[],inclusive:!1},STYLE:{rules:[31],inclusive:!1},CLASS_STYLE:{rules:[29],inclusive:!1},CLASS:{rules:[28],inclusive:!1},CLASSDEFID:{rules:[26],inclusive:!1},CLASSDEF:{rules:[24,25],inclusive:!1},acc_descr_multiline:{rules:[21,22],inclusive:!1},acc_descr:{rules:[19],inclusive:!1},acc_title:{rules:[17],inclusive:!1},SCALE:{rules:[14,15,34,35],inclusive:!1},ALIAS:{rules:[],inclusive:!1},STATE_ID:{rules:[49],inclusive:!1},STATE_STRING:{rules:[50,51],inclusive:!1},FORK_STATE:{rules:[],inclusive:!1},STATE:{rules:[10,11,12,37,38,39,40,41,42,47,48,52,53,54,55],inclusive:!1},ID:{rules:[10,11,12],inclusive:!1},INITIAL:{rules:[0,1,2,3,4,5,6,7,8,9,11,12,13,16,18,20,23,27,30,33,36,55,58,69,70,71,72,73,74,75,77,78,79],inclusive:!0}}}})();function ct(){this.yy={}}return o(ct,`Parser`),ct.prototype=Tt,Tt.Parser=ct,new ct})();Ct.parser=Ct;var Je=Ct;var ye=`TB`;var Zt=`TB`;var Ht=`dir`;var q=`state`;var J=`root`;var At=`relation`;var ge=`classDef`;var Te=`style`;var be=`applyClass`;var et=`default`;var te=`divider`;var ee=`fill:none`;var se=`fill: #333`;var ie=`c`;var re=`markdown`;var ae=`normal`;var Dt=`rect`;var vt=`rectWithTitle`;var Ee=`stateStart`;var me=`stateEnd`;var zt=`divider`;var Kt=`roundedWithTitle`;var ke=`note`;var _e=`noteGroup`;var st=`statediagram`;var ve=`${st}-state`;var ne=`transition`;var Ce=`note`;var xe=`${ne} note-edge`;var Le=`${st}-${Ce}`;var we=`${st}-cluster`;var Ne=`${st}-cluster-alt`;var oe=`parent`;var le=`note`;var Re=`state`;var xt=`----`;var $e=`${xt}${le}`;var Xt=`${xt}${oe}`;var ce=o((t,e=Zt)=>{if(!t.doc)return e;let l=e;for(let s of t.doc)s.stmt===`dir`&&(l=s.value);return l},`getDir`);var qe={getClasses:o(function(t,e){return e.db.getClasses()},`getClasses`),draw:o(async function(t,e,l$1,s){ct.info(`REF0:`),ct.info(`Drawing state diagram (v2)`,e);let{securityLevel:c,state:h,layout:p}=_e$1();s.db.extract(s.db.getRootDocV2());let y=s.db.getData(),o=g(e,c);y.type=s.type,y.layoutAlgorithm=p,y.nodeSpacing=h?.nodeSpacing||50,y.rankSpacing=h?.rankSpacing||50,_e$1().look===`neo`?y.markers=[`barbNeo`]:y.markers=[`barb`],y.diagramId=e,await U$1(y,o);let m=8;try{(typeof s.db.getLinks==`function`?s.db.getLinks():new Map).forEach((x,_)=>{let u=typeof _==`string`?_:typeof _?.id==`string`?_.id:``,L=y.nodes.find(w=>w.id===u);if(!u){ct.warn(`⚠️ Invalid or missing stateId from key:`,JSON.stringify(_));return}let I=o.node()?.querySelectorAll(`g.node, g.rough-node`),C;if(I?.forEach(w=>{let H=w.textContent?.trim();(w.id===L?.domId||H===u)&&(C=w)}),!C){ct.warn(`⚠️ Could not find node matching text:`,u);return}let F=C.parentNode;if(!F){ct.warn(`⚠️ Node has no parent, cannot wrap:`,u);return}let A=document.createElementNS(`http://www.w3.org/2000/svg`,`a`),P=x.url.replace(/^"+|"+$/g,``);if(A.setAttributeNS(`http://www.w3.org/1999/xlink`,`xlink:href`,P),A.setAttribute(`target`,`_blank`),x.tooltip){let w=x.tooltip.replace(/^"+|"+$/g,``);A.setAttribute(`title`,w),C.setAttribute(`title`,w)}F.replaceChild(A,C),A.appendChild(C),ct.info(`🔗 Wrapped node in <a> tag for:`,u,x.url)})}catch(N){ct.error(`❌ Error injecting clickable links:`,N)}ai.insertTitle(o,`statediagramTitleText`,h?.titleTopMargin??25,s.db.getDiagramTitle()),l(o,m,st,h?.useMaxWidth??!0)},`draw`),getDir:ce};var yt=new Map;var U=0;function gt(t=``,e=0,l=``,s=xt){return`${Re}-${t}${l!==null&&l.length>0?`${s}${l}`:``}-${e}`}o(gt,`stateDomId`);var Be=o((t,e,l,s,c,h,p,y)=>{ct.trace(`items`,e),e.forEach(o=>{switch(o.stmt){case q:tt(t,o,l,s,c,h,p,y);break;case et:tt(t,o,l,s,c,h,p,y);break;case At:{tt(t,o.state1,l,s,c,h,p,y),tt(t,o.state2,l,s,c,h,p,y);let T=p===`neo`,m={id:`edge`+U,start:o.state1.id,end:o.state2.id,arrowhead:`normal`,arrowTypeEnd:T?`arrow_barb_neo`:`arrow_barb`,style:ee,labelStyle:``,label:gh.sanitizeText(o.description??``,_e$1()),arrowheadStyle:se,labelpos:ie,labelType:re,thickness:ae,classes:ne,look:p};c.push(m),U++}break}})},`setupDoc`);var Jt=o((t,e=Zt)=>{let l=e;if(t.doc)for(let s of t.doc)s.stmt===`dir`&&(l=s.value);return l},`getDir`);function Z(t,e,l){if(!e.id||e.id===`</join></fork>`||e.id===`</choice>`)return;e.cssClasses&&(Array.isArray(e.cssCompiledStyles)||(e.cssCompiledStyles=[]),e.cssClasses.split(` `).forEach(c=>{let h=l.get(c);h&&(e.cssCompiledStyles=[...e.cssCompiledStyles??[],...h.styles])}));let s=t.find(c=>c.id===e.id);s?Object.assign(s,e):t.push(e)}o(Z,`insertOrUpdateNode`);function he(t){return t?.classes?.join(` `)??``}o(he,`getClassesFromDbInfo`);function ue(t){return t?.styles??[]}o(ue,`getStylesFromDbInfo`);var tt=o((t,e,l,s,c,h,p,y)=>{let o=e.id,T=l.get(o),m=he(T),N=ue(T),x=_e$1();if(ct.info(`dataFetcher parsedItem`,e,T,N),o!==`root`){let _=Dt;e.start===!0?_=Ee:e.start===!1&&(_=me),e.type!==et&&(_=e.type),yt.get(o)||yt.set(o,{id:o,shape:_,description:gh.sanitizeText(o,x),cssClasses:`${m} ${ve}`,cssStyles:N});let u=yt.get(o);e.description&&(Array.isArray(u.description)?(u.shape=vt,u.description.push(e.description)):u.description?.length&&u.description.length>0?(u.shape=vt,u.description===o?u.description=[e.description]:u.description=[u.description,e.description]):(u.shape=Dt,u.description=e.description),u.description=gh.sanitizeTextOrArray(u.description,x)),u.description?.length===1&&u.shape===vt&&(u.type===`group`?u.shape=Kt:u.shape=Dt),!u.type&&e.doc&&(ct.info(`Setting cluster for XCX`,o,Jt(e)),u.type=`group`,u.isGroup=!0,u.dir=Jt(e),u.explicitDir=e.doc.some(I=>I.stmt===`dir`),u.shape=e.type===te?zt:Kt,u.cssClasses=`${u.cssClasses} ${we} ${h?Ne:``}`);let L={labelStyle:``,shape:u.shape,label:u.description,cssClasses:u.cssClasses,cssCompiledStyles:[],cssStyles:u.cssStyles,id:o,dir:u.dir,domId:gt(o,U),type:u.type,isGroup:u.type===`group`,padding:8,rx:10,ry:10,look:p,labelType:`markdown`};if(L.shape===zt&&(L.label=``),t&&t.id!==`root`&&(ct.trace(`Setting node `,o,` to be child of its parent `,t.id),L.parentId=t.id),L.centerLabel=!0,e.note){let I={labelStyle:``,shape:ke,label:e.note.text,labelType:`markdown`,cssClasses:Le,cssStyles:[],cssCompiledStyles:[],id:o+$e+`-`+U,domId:gt(o,U,le),type:u.type,isGroup:u.type===`group`,padding:x.flowchart?.padding,look:p,position:e.note.position},C=o+Xt,F={labelStyle:``,shape:_e,label:e.note.text,cssClasses:u.cssClasses,cssStyles:[],id:o+Xt,domId:gt(o,U,oe),type:`group`,isGroup:!0,padding:16,look:p,position:e.note.position};U++,F.id=C,I.parentId=C,Z(s,F,y),Z(s,I,y),Z(s,L,y);let A=o,P=I.id;e.note.position===`left of`&&(A=I.id,P=o),c.push({id:A+`-`+P,start:A,end:P,arrowhead:`none`,arrowTypeEnd:``,style:ee,labelStyle:``,classes:xe,arrowheadStyle:se,labelpos:ie,labelType:re,thickness:ae,look:p})}else Z(s,L,y)}e.doc&&(ct.trace(`Adding nodes children `),Be(e,e.doc,l,s,c,!h,p,y))},`dataFetcher`);var Ye=o(()=>{yt.clear(),U=0},`reset`);var v={START_NODE:`[*]`,START_TYPE:`start`,END_NODE:`[*]`,END_TYPE:`end`,COLOR_KEYWORD:`color`,FILL_KEYWORD:`fill`,BG_FILL:`bgFill`,STYLECLASS_SEP:`,`};var qt=o(()=>new Map,`newClassesList`);var Qt=o(()=>({relations:[],states:new Map,documents:{}}),`newDoc`);var St=o(t=>JSON.parse(JSON.stringify(t)),`clone`);var ts=class{constructor(t){this.version=t,this.nodes=[],this.edges=[],this.rootDoc=[],this.classes=qt(),this.documents={root:Qt()},this.currentDocument=this.documents.root,this.startEndCount=0,this.dividerCnt=0,this.links=new Map,this.funs=[],this.getAccTitle=oa,this.setAccTitle=ea,this.getAccDescription=aa,this.setAccDescription=sa,this.setDiagramTitle=la,this.getDiagramTitle=ha,this.clear(),this.setRootDoc=this.setRootDoc.bind(this),this.getDividerId=this.getDividerId.bind(this),this.setDirection=this.setDirection.bind(this),this.trimColon=this.trimColon.bind(this),this.bindFunctions=this.bindFunctions.bind(this)}static{o(this,`StateDB`)}static{this.relationType={AGGREGATION:0,EXTENSION:1,COMPOSITION:2,DEPENDENCY:3}}extract(t){this.clear(!0);for(let s of Array.isArray(t)?t:t.doc)switch(s.stmt){case q:this.addState(s.id.trim(),s.type,s.doc,s.description,s.note);break;case At:this.addRelation(s.state1,s.state2,s.description);break;case ge:this.addStyleClass(s.id.trim(),s.classes);break;case Te:this.handleStyleDef(s);break;case be:this.setCssClass(s.id.trim(),s.styleClass);break;case`click`:this.addLink(s.id,s.url,s.tooltip);break}let e=this.getStates(),l=_e$1();Ye(),tt(void 0,this.getRootDocV2(),e,this.nodes,this.edges,!0,l.look,this.classes);for(let s of this.nodes)if(Array.isArray(s.label)){if(s.description=s.label.slice(1),s.isGroup&&s.description.length>0)throw new Error(`Group nodes can only have label. Remove the additional description for node [${s.id}]`);s.label=s.label[0]}}handleStyleDef(t){let e=t.id.trim().split(`,`),l=t.styleClass.split(`,`);for(let s of e){let c=this.getState(s);if(!c){let h=s.trim();this.addState(h),c=this.getState(h)}c&&(c.styles=l.map(h=>h.replace(/;/g,``)?.trim()))}}setRootDoc(t){ct.info(`Setting root doc`,t),this.rootDoc=t,this.version===1?this.extract(t):this.extract(this.getRootDocV2())}docTranslator(t,e,l){if(e.stmt===At){this.docTranslator(t,e.state1,!0),this.docTranslator(t,e.state2,!1);return}if(e.stmt===q&&(e.id===v.START_NODE?(e.id=t.id+(l?`_start`:`_end`),e.start=l):e.id=e.id.trim()),e.stmt!==J&&e.stmt!==q||!e.doc)return;let s=[],c=[];for(let h of e.doc)if(h.type===te){let p=St(h);p.doc=St(c),s.push(p),c=[]}else c.push(h);if(s.length>0&&c.length>0){let h={stmt:q,id:Pt(),type:`divider`,doc:St(c)};s.push(St(h)),e.doc=s}e.doc.forEach(h=>this.docTranslator(e,h,!0))}getRootDocV2(){return this.docTranslator({id:J,stmt:J},{id:J,stmt:J,doc:this.rootDoc},!0),{id:J,doc:this.rootDoc}}addState(t,e=et,l=void 0,s=void 0,c=void 0,h=void 0,p=void 0,y=void 0){let o=t?.trim();if(!this.currentDocument.states.has(o))ct.info(`Adding state `,o,s),this.currentDocument.states.set(o,{stmt:q,id:o,descriptions:[],type:e,doc:l,note:c,classes:[],styles:[],textStyles:[]});else{let T=this.currentDocument.states.get(o);if(!T)throw new Error(`State not found: ${o}`);T.doc||(T.doc=l),T.type||(T.type=e)}if(s&&(ct.info(`Setting state description`,o,s),(Array.isArray(s)?s:[s]).forEach(m=>this.addDescription(o,m.trim()))),c){let T=this.currentDocument.states.get(o);if(!T)throw new Error(`State not found: ${o}`);T.note=c,T.note.text=gh.sanitizeText(T.note.text,_e$1())}h&&(ct.info(`Setting state classes`,o,h),(Array.isArray(h)?h:[h]).forEach(m=>this.setCssClass(o,m.trim()))),p&&(ct.info(`Setting state styles`,o,p),(Array.isArray(p)?p:[p]).forEach(m=>this.setStyle(o,m.trim()))),y&&(ct.info(`Setting state styles`,o,p),(Array.isArray(y)?y:[y]).forEach(m=>this.setTextStyle(o,m.trim())))}clear(t){this.nodes=[],this.edges=[],this.funs=[this.setupToolTips.bind(this)],this.documents={root:Qt()},this.currentDocument=this.documents.root,this.startEndCount=0,this.classes=qt(),t||(this.links=new Map,ra())}getState(t){return this.currentDocument.states.get(t)}getStates(){return this.currentDocument.states}logDocuments(){ct.info(`Documents = `,this.documents)}getRelations(){return this.currentDocument.relations}addLink(t,e,l){this.links.set(t,{url:e,tooltip:l}),ct.warn(`Adding link`,t,e,l)}getLinks(){return this.links}startIdIfNeeded(t=``){return t===v.START_NODE?(this.startEndCount++,`${v.START_TYPE}${this.startEndCount}`):t}startTypeIfNeeded(t=``,e=et){return t===v.START_NODE?v.START_TYPE:e}endIdIfNeeded(t=``){return t===v.END_NODE?(this.startEndCount++,`${v.END_TYPE}${this.startEndCount}`):t}endTypeIfNeeded(t=``,e=et){return t===v.END_NODE?v.END_TYPE:e}addRelationObjs(t,e,l=``){let s=this.startIdIfNeeded(t.id.trim()),c=this.startTypeIfNeeded(t.id.trim(),t.type),h=this.startIdIfNeeded(e.id.trim()),p=this.startTypeIfNeeded(e.id.trim(),e.type);this.addState(s,c,t.doc,t.description,t.note,t.classes,t.styles,t.textStyles),this.addState(h,p,e.doc,e.description,e.note,e.classes,e.styles,e.textStyles),this.currentDocument.relations.push({id1:s,id2:h,relationTitle:gh.sanitizeText(l,_e$1())})}addRelation(t,e,l){if(typeof t==`object`&&typeof e==`object`)this.addRelationObjs(t,e,l);else if(typeof t==`string`&&typeof e==`string`){let s=this.startIdIfNeeded(t.trim()),c=this.startTypeIfNeeded(t),h=this.endIdIfNeeded(e.trim()),p=this.endTypeIfNeeded(e);this.addState(s,c),this.addState(h,p),this.currentDocument.relations.push({id1:s,id2:h,relationTitle:l?gh.sanitizeText(l,_e$1()):void 0})}}addDescription(t,e){let l=this.currentDocument.states.get(t),s=e.startsWith(`:`)?e.replace(`:`,``).trim():e;l?.descriptions?.push(gh.sanitizeText(s,_e$1()))}cleanupLabel(t){return t.startsWith(`:`)?t.slice(2).trim():t.trim()}getDividerId(){return this.dividerCnt++,`divider-id-${this.dividerCnt}`}addStyleClass(t,e=``){this.classes.has(t)||this.classes.set(t,{id:t,styles:[],textStyles:[]});let l=this.classes.get(t);e&&l&&e.split(v.STYLECLASS_SEP).forEach(s=>{let c=s.replace(/([^;]*);/,`$1`).trim();if(RegExp(v.COLOR_KEYWORD).exec(s)){let p=c.replace(v.FILL_KEYWORD,v.BG_FILL).replace(v.COLOR_KEYWORD,v.FILL_KEYWORD);l.textStyles.push(p)}l.styles.push(c)})}getClasses(){return this.classes}setupToolTips(t){let e=R();pf(t).select(`svg`).selectAll(`g.node, g.rough-node`).on(`mouseover`,c=>{let h=pf(c.currentTarget),p=h.attr(`title`);if(p===null)return;let y=c.currentTarget?.getBoundingClientRect();e.transition().duration(200).style(`opacity`,`.9`),e.style(`left`,window.scrollX+y.left+(y.right-y.left)/2+`px`).style(`top`,window.scrollY+y.bottom+`px`),e.html(zt$1.sanitize(p)),h.classed(`hover`,!0)}).on(`mouseout`,c=>{e.transition().duration(500).style(`opacity`,0),pf(c.currentTarget).classed(`hover`,!1)})}setCssClass(t,e){t.split(`,`).forEach(l=>{let s=this.getState(l);if(!s){let c=l.trim();this.addState(c),s=this.getState(c)}s?.classes?.push(e)})}setStyle(t,e){this.getState(t)?.styles?.push(e)}setTextStyle(t,e){this.getState(t)?.textStyles?.push(e)}bindFunctions(t){this.funs.forEach(e=>{e(t)})}getDirectionStatement(){return this.rootDoc.find(t=>t.stmt===Ht)}getDirection(){return this.getDirectionStatement()?.value??ye}setDirection(t){let e=this.getDirectionStatement();e?e.value=t:this.rootDoc.unshift({stmt:Ht,value:t})}trimColon(t){return t.startsWith(`:`)?t.slice(1).trim():t.trim()}getData(){let t=_e$1();return{nodes:this.nodes,edges:this.edges,other:{},config:t,direction:ce(this.getRootDocV2())}}getConfig(){return _e$1().state}};var es=o(t=>`
defs [id$="-barbEnd"] {
    fill: ${t.transitionColor};
    stroke: ${t.transitionColor};
  }
g.stateGroup text {
  fill: ${t.nodeBorder};
  stroke: none;
  font-size: 10px;
}
g.stateGroup text {
  fill: ${t.textColor};
  stroke: none;
  font-size: 10px;

}
g.stateGroup .state-title {
  font-weight: bolder;
  fill: ${t.stateLabelColor};
}

g.stateGroup rect {
  fill: ${t.mainBkg};
  stroke: ${t.nodeBorder};
}

g.stateGroup line {
  stroke: ${t.lineColor};
  stroke-width: ${t.strokeWidth||1};
}

.transition {
  stroke: ${t.transitionColor};
  stroke-width: ${t.strokeWidth||1};
  fill: none;
}

.stateGroup .composit {
  fill: ${t.background};
  border-bottom: 1px
}

.stateGroup .alt-composit {
  fill: #e0e0e0;
  border-bottom: 1px
}

.state-note {
  stroke: ${t.noteBorderColor};
  fill: ${t.noteBkgColor};

  text {
    fill: ${t.noteTextColor};
    stroke: none;
    font-size: 10px;
  }
}

.stateLabel .box {
  stroke: none;
  stroke-width: 0;
  fill: ${t.mainBkg};
  opacity: 0.5;
}

.edgeLabel .label rect {
  fill: ${t.labelBackgroundColor};
  opacity: 0.5;
}
.edgeLabel {
  background-color: ${t.edgeLabelBackground};
  p {
    background-color: ${t.edgeLabelBackground};
  }
  rect {
    opacity: 0.5;
    background-color: ${t.edgeLabelBackground};
    fill: ${t.edgeLabelBackground};
  }
  text-align: center;
}
.edgeLabel .label text {
  fill: ${t.transitionLabelColor||t.tertiaryTextColor};
}
.label div .edgeLabel {
  color: ${t.transitionLabelColor||t.tertiaryTextColor};
}

.stateLabel text {
  fill: ${t.stateLabelColor};
  font-size: 10px;
  font-weight: bold;
}

.node circle.state-start {
  fill: ${t.specialStateColor};
  stroke: ${t.specialStateColor};
}

.node .fork-join {
  fill: ${t.specialStateColor};
  stroke: ${t.specialStateColor};
}

.node circle.state-end {
  fill: ${t.innerEndBackground};
  stroke: ${t.background};
  stroke-width: 1.5
}
.end-state-inner {
  fill: ${t.compositeBackground||t.background};
  // stroke: ${t.background};
  stroke-width: 1.5
}

.node rect {
  fill: ${t.stateBkg||t.mainBkg};
  stroke: ${t.stateBorder||t.nodeBorder};
  stroke-width: ${t.strokeWidth||1}px;
}
.node polygon {
  fill: ${t.mainBkg};
  stroke: ${t.stateBorder||t.nodeBorder};;
  stroke-width: ${t.strokeWidth||1}px;
}
[id$="-barbEnd"] {
  fill: ${t.lineColor};
}

.statediagram-cluster rect {
  fill: ${t.compositeTitleBackground};
  stroke: ${t.stateBorder||t.nodeBorder};
  stroke-width: ${t.strokeWidth||1}px;
}

.cluster-label, .nodeLabel {
  color: ${t.stateLabelColor};
  // line-height: 1;
}

.statediagram-cluster rect.outer {
  rx: 5px;
  ry: 5px;
}
.statediagram-state .divider {
  stroke: ${t.stateBorder||t.nodeBorder};
}

.statediagram-state .title-state {
  rx: 5px;
  ry: 5px;
}
.statediagram-cluster.statediagram-cluster .inner {
  fill: ${t.compositeBackground||t.background};
}
.statediagram-cluster.statediagram-cluster-alt .inner {
  fill: ${t.altBackground?t.altBackground:`#efefef`};
}

.statediagram-cluster .inner {
  rx:0;
  ry:0;
}

.statediagram-state rect.basic {
  rx: 5px;
  ry: 5px;
}
.statediagram-state rect.divider {
  stroke-dasharray: 10,10;
  fill: ${t.altBackground?t.altBackground:`#efefef`};
}

.note-edge {
  stroke-dasharray: 5;
}

.statediagram-note rect {
  fill: ${t.noteBkgColor};
  stroke: ${t.noteBorderColor};
  stroke-width: 1px;
  rx: 0;
  ry: 0;
}
.statediagram-note rect {
  fill: ${t.noteBkgColor};
  stroke: ${t.noteBorderColor};
  stroke-width: 1px;
  rx: 0;
  ry: 0;
}

.statediagram-note text {
  fill: ${t.noteTextColor};
}

.statediagram-note .nodeLabel {
  color: ${t.noteTextColor};
}
.statediagram .edgeLabel {
  color: red; // ${t.noteTextColor};
}

[id$="-dependencyStart"], [id$="-dependencyEnd"] {
  fill: ${t.lineColor};
  stroke: ${t.lineColor};
  stroke-width: ${t.strokeWidth||1};
}

.statediagramTitleText {
  text-anchor: middle;
  font-size: 18px;
  fill: ${t.textColor};
}

[data-look="neo"].statediagram-cluster rect {
  fill: ${t.mainBkg};
  stroke: ${t.useGradient?`url(`+t.svgId+`-gradient)`:t.stateBorder||t.nodeBorder};
  stroke-width: ${t.strokeWidth??1};
}
[data-look="neo"].statediagram-cluster rect.outer {
  rx: ${t.radius}px;
  ry: ${t.radius}px;
  filter: ${t.dropShadow?t.dropShadow.replace(`url(#drop-shadow)`,`url(${t.svgId}-drop-shadow)`):`none`}
}
`,`getStyles`);export{ts as i,es as n,qe as r,Je as t};
//# debugId=18aa0da4-a76a-57a6-9673-3efbe6bd7928
//# sourceMappingURL=chunk-a4vxIHEY2.js.map