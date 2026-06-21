import {g}from'./chunk-sVrJNNi_.js';import {g as g$1}from'./chunk-B6npJ0XF.js';import {O as Ot,c as ct,S as Se$1,C,s as si,Q as Qs,J as Js,i as ia,t as ta,r as ra,e as ea,am as Pt,l as lh,Z as Zs}from'./chunk-C2Gg68i1.js';var vt=(function(){var t=Ot(function(Y,o,c,a){for(c=c||{},a=Y.length;a--;c[Y[a]]=o);return c},"o"),e=[1,2],s=[1,3],n=[1,4],i=[2,4],d=[1,9],f=[1,11],S=[1,16],p=[1,17],T=[1,18],E=[1,19],_=[1,33],x=[1,20],D=[1,21],h=[1,22],L=[1,23],v=[1,24],$=[1,26],I=[1,27],P=[1,28],O=[1,29],J=[1,30],st=[1,31],rt=[1,32],it=[1,35],at=[1,36],nt=[1,37],ot=[1,38],j=[1,34],y=[1,4,5,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],lt=[1,4,5,14,15,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,39,40,41,45,48,51,52,53,54,57],xt=[4,5,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],gt={trace:Ot(function(){},"trace"),yy:{},symbols_:{error:2,start:3,SPACE:4,NL:5,SD:6,document:7,line:8,statement:9,classDefStatement:10,styleStatement:11,cssClassStatement:12,idStatement:13,DESCR:14,"-->":15,HIDE_EMPTY:16,scale:17,WIDTH:18,COMPOSIT_STATE:19,STRUCT_START:20,STRUCT_STOP:21,STATE_DESCR:22,AS:23,ID:24,FORK:25,JOIN:26,CHOICE:27,CONCURRENT:28,note:29,notePosition:30,NOTE_TEXT:31,direction:32,acc_title:33,acc_title_value:34,acc_descr:35,acc_descr_value:36,acc_descr_multiline_value:37,CLICK:38,STRING:39,HREF:40,classDef:41,CLASSDEF_ID:42,CLASSDEF_STYLEOPTS:43,DEFAULT:44,style:45,STYLE_IDS:46,STYLEDEF_STYLEOPTS:47,class:48,CLASSENTITY_IDS:49,STYLECLASS:50,direction_tb:51,direction_bt:52,direction_rl:53,direction_lr:54,eol:55,";":56,EDGE_STATE:57,STYLE_SEPARATOR:58,left_of:59,right_of:60,$accept:0,$end:1},terminals_:{2:"error",4:"SPACE",5:"NL",6:"SD",14:"DESCR",15:"-->",16:"HIDE_EMPTY",17:"scale",18:"WIDTH",19:"COMPOSIT_STATE",20:"STRUCT_START",21:"STRUCT_STOP",22:"STATE_DESCR",23:"AS",24:"ID",25:"FORK",26:"JOIN",27:"CHOICE",28:"CONCURRENT",29:"note",31:"NOTE_TEXT",33:"acc_title",34:"acc_title_value",35:"acc_descr",36:"acc_descr_value",37:"acc_descr_multiline_value",38:"CLICK",39:"STRING",40:"HREF",41:"classDef",42:"CLASSDEF_ID",43:"CLASSDEF_STYLEOPTS",44:"DEFAULT",45:"style",46:"STYLE_IDS",47:"STYLEDEF_STYLEOPTS",48:"class",49:"CLASSENTITY_IDS",50:"STYLECLASS",51:"direction_tb",52:"direction_bt",53:"direction_rl",54:"direction_lr",56:";",57:"EDGE_STATE",58:"STYLE_SEPARATOR",59:"left_of",60:"right_of"},productions_:[0,[3,2],[3,2],[3,2],[7,0],[7,2],[8,2],[8,1],[8,1],[9,1],[9,1],[9,1],[9,1],[9,2],[9,3],[9,4],[9,1],[9,2],[9,1],[9,4],[9,3],[9,6],[9,1],[9,1],[9,1],[9,1],[9,4],[9,4],[9,1],[9,2],[9,2],[9,1],[9,5],[9,5],[10,3],[10,3],[11,3],[12,3],[32,1],[32,1],[32,1],[32,1],[55,1],[55,1],[13,1],[13,1],[13,3],[13,3],[30,1],[30,1]],performAction:Ot(function(o,c,a,g,b,r,H){var l=r.length-1;switch(b){case 3:return g.setRootDoc(r[l]),r[l];case 4:this.$=[];break;case 5:r[l]!="nl"&&(r[l-1].push(r[l]),this.$=r[l-1]);break;case 6:case 7:this.$=r[l];break;case 8:this.$="nl";break;case 12:this.$=r[l];break;case 13:let ht=r[l-1];ht.description=g.trimColon(r[l]),this.$=ht;break;case 14:this.$={stmt:"relation",state1:r[l-2],state2:r[l]};break;case 15:let ut=g.trimColon(r[l]);this.$={stmt:"relation",state1:r[l-3],state2:r[l-1],description:ut};break;case 19:this.$={stmt:"state",id:r[l-3],type:"default",description:"",doc:r[l-1]};break;case 20:var B=r[l],F=r[l-2].trim();if(r[l].match(":")){var q=r[l].split(":");B=q[0],F=[F,q[1]];}this.$={stmt:"state",id:B,type:"default",description:F};break;case 21:this.$={stmt:"state",id:r[l-3],type:"default",description:r[l-5],doc:r[l-1]};break;case 22:this.$={stmt:"state",id:r[l],type:"fork"};break;case 23:this.$={stmt:"state",id:r[l],type:"join"};break;case 24:this.$={stmt:"state",id:r[l],type:"choice"};break;case 25:this.$={stmt:"state",id:g.getDividerId(),type:"divider"};break;case 26:this.$={stmt:"state",id:r[l-1].trim(),note:{position:r[l-2].trim(),text:r[l].trim()}};break;case 29:this.$=r[l].trim(),g.setAccTitle(this.$);break;case 30:case 31:this.$=r[l].trim(),g.setAccDescription(this.$);break;case 32:this.$={stmt:"click",id:r[l-3],url:r[l-2],tooltip:r[l-1]};break;case 33:this.$={stmt:"click",id:r[l-3],url:r[l-1],tooltip:""};break;case 34:case 35:this.$={stmt:"classDef",id:r[l-1].trim(),classes:r[l].trim()};break;case 36:this.$={stmt:"style",id:r[l-1].trim(),styleClass:r[l].trim()};break;case 37:this.$={stmt:"applyClass",id:r[l-1].trim(),styleClass:r[l].trim()};break;case 38:g.setDirection("TB"),this.$={stmt:"dir",value:"TB"};break;case 39:g.setDirection("BT"),this.$={stmt:"dir",value:"BT"};break;case 40:g.setDirection("RL"),this.$={stmt:"dir",value:"RL"};break;case 41:g.setDirection("LR"),this.$={stmt:"dir",value:"LR"};break;case 44:case 45:this.$={stmt:"state",id:r[l].trim(),type:"default",description:""};break;case 46:this.$={stmt:"state",id:r[l-2].trim(),classes:[r[l].trim()],type:"default",description:""};break;case 47:this.$={stmt:"state",id:r[l-2].trim(),classes:[r[l].trim()],type:"default",description:""};break}},"anonymous"),table:[{3:1,4:e,5:s,6:n},{1:[3]},{3:5,4:e,5:s,6:n},{3:6,4:e,5:s,6:n},t([1,4,5,16,17,19,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],i,{7:7}),{1:[2,1]},{1:[2,2]},{1:[2,3],4:d,5:f,8:8,9:10,10:12,11:13,12:14,13:15,16:S,17:p,19:T,22:E,24:_,25:x,26:D,27:h,28:L,29:v,32:25,33:$,35:I,37:P,38:O,41:J,45:st,48:rt,51:it,52:at,53:nt,54:ot,57:j},t(y,[2,5]),{9:39,10:12,11:13,12:14,13:15,16:S,17:p,19:T,22:E,24:_,25:x,26:D,27:h,28:L,29:v,32:25,33:$,35:I,37:P,38:O,41:J,45:st,48:rt,51:it,52:at,53:nt,54:ot,57:j},t(y,[2,7]),t(y,[2,8]),t(y,[2,9]),t(y,[2,10]),t(y,[2,11]),t(y,[2,12],{14:[1,40],15:[1,41]}),t(y,[2,16]),{18:[1,42]},t(y,[2,18],{20:[1,43]}),{23:[1,44]},t(y,[2,22]),t(y,[2,23]),t(y,[2,24]),t(y,[2,25]),{30:45,31:[1,46],59:[1,47],60:[1,48]},t(y,[2,28]),{34:[1,49]},{36:[1,50]},t(y,[2,31]),{13:51,24:_,57:j},{42:[1,52],44:[1,53]},{46:[1,54]},{49:[1,55]},t(lt,[2,44],{58:[1,56]}),t(lt,[2,45],{58:[1,57]}),t(y,[2,38]),t(y,[2,39]),t(y,[2,40]),t(y,[2,41]),t(y,[2,6]),t(y,[2,13]),{13:58,24:_,57:j},t(y,[2,17]),t(xt,i,{7:59}),{24:[1,60]},{24:[1,61]},{23:[1,62]},{24:[2,48]},{24:[2,49]},t(y,[2,29]),t(y,[2,30]),{39:[1,63],40:[1,64]},{43:[1,65]},{43:[1,66]},{47:[1,67]},{50:[1,68]},{24:[1,69]},{24:[1,70]},t(y,[2,14],{14:[1,71]}),{4:d,5:f,8:8,9:10,10:12,11:13,12:14,13:15,16:S,17:p,19:T,21:[1,72],22:E,24:_,25:x,26:D,27:h,28:L,29:v,32:25,33:$,35:I,37:P,38:O,41:J,45:st,48:rt,51:it,52:at,53:nt,54:ot,57:j},t(y,[2,20],{20:[1,73]}),{31:[1,74]},{24:[1,75]},{39:[1,76]},{39:[1,77]},t(y,[2,34]),t(y,[2,35]),t(y,[2,36]),t(y,[2,37]),t(lt,[2,46]),t(lt,[2,47]),t(y,[2,15]),t(y,[2,19]),t(xt,i,{7:78}),t(y,[2,26]),t(y,[2,27]),{5:[1,79]},{5:[1,80]},{4:d,5:f,8:8,9:10,10:12,11:13,12:14,13:15,16:S,17:p,19:T,21:[1,81],22:E,24:_,25:x,26:D,27:h,28:L,29:v,32:25,33:$,35:I,37:P,38:O,41:J,45:st,48:rt,51:it,52:at,53:nt,54:ot,57:j},t(y,[2,32]),t(y,[2,33]),t(y,[2,21])],defaultActions:{5:[2,1],6:[2,2],47:[2,48],48:[2,49]},parseError:Ot(function(o,c){if(c.recoverable)this.trace(o);else {var a=new Error(o);throw a.hash=c,a}},"parseError"),parse:Ot(function(o){var c=this,a=[0],g=[],b=[null],r=[],H=this.table,l="",B=0,F=0,q=0,ht=2,ut=1,he=r.slice.call(arguments,1),m=Object.create(this.lexer),U={yy:{}};for(var Tt in this.yy)Object.prototype.hasOwnProperty.call(this.yy,Tt)&&(U.yy[Tt]=this.yy[Tt]);m.setInput(o,U.yy),U.yy.lexer=m,U.yy.parser=this,typeof m.yylloc>"u"&&(m.yylloc={});var bt=m.yylloc;r.push(bt);var ue=m.options&&m.options.ranges;typeof U.yy.parseError=="function"?this.parseError=U.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;function de(N){a.length=a.length-2*N,b.length=b.length-N,r.length=r.length-N;}Ot(de,"popStack");function Lt(){var N;return N=g.pop()||m.lex()||ut,typeof N!="number"&&(N instanceof Array&&(g=N,N=g.pop()),N=c.symbols_[N]||N),N}Ot(Lt,"lex");for(var C,Et,W,R,Fe,kt,z={},dt,G,It,ft;;){if(W=a[a.length-1],this.defaultActions[W]?R=this.defaultActions[W]:((C===null||typeof C>"u")&&(C=Lt()),R=H[W]&&H[W][C]),typeof R>"u"||!R.length||!R[0]){var _t="";ft=[];for(dt in H[W])this.terminals_[dt]&&dt>ht&&ft.push("'"+this.terminals_[dt]+"'");m.showPosition?_t="Parse error on line "+(B+1)+`:
`+m.showPosition()+`
Expecting `+ft.join(", ")+", got '"+(this.terminals_[C]||C)+"'":_t="Parse error on line "+(B+1)+": Unexpected "+(C==ut?"end of input":"'"+(this.terminals_[C]||C)+"'"),this.parseError(_t,{text:m.match,token:this.terminals_[C]||C,line:m.yylineno,loc:bt,expected:ft});}if(R[0]instanceof Array&&R.length>1)throw new Error("Parse Error: multiple actions possible at state: "+W+", token: "+C);switch(R[0]){case 1:a.push(C),b.push(m.yytext),r.push(m.yylloc),a.push(R[1]),C=null,Et?(C=Et,Et=null):(F=m.yyleng,l=m.yytext,B=m.yylineno,bt=m.yylloc,q>0);break;case 2:if(G=this.productions_[R[1]][1],z.$=b[b.length-G],z._$={first_line:r[r.length-(G||1)].first_line,last_line:r[r.length-1].last_line,first_column:r[r.length-(G||1)].first_column,last_column:r[r.length-1].last_column},ue&&(z._$.range=[r[r.length-(G||1)].range[0],r[r.length-1].range[1]]),kt=this.performAction.apply(z,[l,F,B,U.yy,R[1],b,r].concat(he)),typeof kt<"u")return kt;G&&(a=a.slice(0,-1*G*2),b=b.slice(0,-1*G),r=r.slice(0,-1*G)),a.push(this.productions_[R[1]][0]),b.push(z.$),r.push(z._$),It=H[a[a.length-2]][a[a.length-1]],a.push(It);break;case 3:return  true}}return  true},"parse")},ce=(function(){var Y={EOF:1,parseError:Ot(function(c,a){if(this.yy.parser)this.yy.parser.parseError(c,a);else throw new Error(c)},"parseError"),setInput:Ot(function(o,c){return this.yy=c||this.yy||{},this._input=o,this._more=this._backtrack=this.done=false,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},"setInput"),input:Ot(function(){var o=this._input[0];this.yytext+=o,this.yyleng++,this.offset++,this.match+=o,this.matched+=o;var c=o.match(/(?:\r\n?|\n).*/g);return c?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),o},"input"),unput:Ot(function(o){var c=o.length,a=o.split(/(?:\r\n?|\n)/g);this._input=o+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-c),this.offset-=c;var g=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),a.length-1&&(this.yylineno-=a.length-1);var b=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:a?(a.length===g.length?this.yylloc.first_column:0)+g[g.length-a.length].length-a[0].length:this.yylloc.first_column-c},this.options.ranges&&(this.yylloc.range=[b[0],b[0]+this.yyleng-c]),this.yyleng=this.yytext.length,this},"unput"),more:Ot(function(){return this._more=true,this},"more"),reject:Ot(function(){if(this.options.backtrack_lexer)this._backtrack=true;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},"reject"),less:Ot(function(o){this.unput(this.match.slice(o));},"less"),pastInput:Ot(function(){var o=this.matched.substr(0,this.matched.length-this.match.length);return (o.length>20?"...":"")+o.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:Ot(function(){var o=this.match;return o.length<20&&(o+=this._input.substr(0,20-o.length)),(o.substr(0,20)+(o.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:Ot(function(){var o=this.pastInput(),c=new Array(o.length+1).join("-");return o+this.upcomingInput()+`
`+c+"^"},"showPosition"),test_match:Ot(function(o,c){var a,g,b;if(this.options.backtrack_lexer&&(b={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(b.yylloc.range=this.yylloc.range.slice(0))),g=o[0].match(/(?:\r\n?|\n).*/g),g&&(this.yylineno+=g.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:g?g[g.length-1].length-g[g.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+o[0].length},this.yytext+=o[0],this.match+=o[0],this.matches=o,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=false,this._backtrack=false,this._input=this._input.slice(o[0].length),this.matched+=o[0],a=this.performAction.call(this,this.yy,this,c,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=false),a)return a;if(this._backtrack){for(var r in b)this[r]=b[r];return  false}return  false},"test_match"),next:Ot(function(){if(this.done)return this.EOF;this._input||(this.done=true);var o,c,a,g;this._more||(this.yytext="",this.match="");for(var b=this._currentRules(),r=0;r<b.length;r++)if(a=this._input.match(this.rules[b[r]]),a&&(!c||a[0].length>c[0].length)){if(c=a,g=r,this.options.backtrack_lexer){if(o=this.test_match(a,b[r]),o!==false)return o;if(this._backtrack){c=false;continue}else return  false}else if(!this.options.flex)break}return c?(o=this.test_match(c,b[g]),o!==false?o:false):this._input===""?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:Ot(function(){var c=this.next();return c||this.lex()},"lex"),begin:Ot(function(c){this.conditionStack.push(c);},"begin"),popState:Ot(function(){var c=this.conditionStack.length-1;return c>0?this.conditionStack.pop():this.conditionStack[0]},"popState"),_currentRules:Ot(function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},"_currentRules"),topState:Ot(function(c){return c=this.conditionStack.length-1-Math.abs(c||0),c>=0?this.conditionStack[c]:"INITIAL"},"topState"),pushState:Ot(function(c){this.begin(c);},"pushState"),stateStackSize:Ot(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":true},performAction:Ot(function(c,a,g,b){function r(){let l=a.yytext.indexOf("%%");if(l===0)return  false;if(l>0){let B=a.yytext.slice(0,l),F=a.yytext.slice(l);F&&c.lexer.unput(F),a.yytext=B;}return  true}Ot(r,"processId");switch(g){case 0:return 38;case 1:return 40;case 2:return 39;case 3:return 44;case 4:return 51;case 5:return 52;case 6:return 53;case 7:return 54;case 8:return 5;case 9:break;case 10:break;case 11:break;case 12:break;case 13:return this.pushState("SCALE"),17;case 14:return 18;case 15:this.popState();break;case 16:return this.begin("acc_title"),33;case 17:return this.popState(),"acc_title_value";case 18:return this.begin("acc_descr"),35;case 19:return this.popState(),"acc_descr_value";case 20:this.begin("acc_descr_multiline");break;case 21:this.popState();break;case 22:return "acc_descr_multiline_value";case 23:return this.pushState("CLASSDEF"),41;case 24:return this.popState(),this.pushState("CLASSDEFID"),"DEFAULT_CLASSDEF_ID";case 25:return this.popState(),this.pushState("CLASSDEFID"),42;case 26:return this.popState(),43;case 27:return this.pushState("CLASS"),48;case 28:return this.popState(),this.pushState("CLASS_STYLE"),49;case 29:return this.popState(),50;case 30:return this.pushState("STYLE"),45;case 31:return this.popState(),this.pushState("STYLEDEF_STYLES"),46;case 32:return this.popState(),47;case 33:return this.pushState("SCALE"),17;case 34:return 18;case 35:this.popState();break;case 36:this.pushState("STATE");break;case 37:return this.popState(),a.yytext=a.yytext.slice(0,-8).trim(),25;case 38:return this.popState(),a.yytext=a.yytext.slice(0,-8).trim(),26;case 39:return this.popState(),a.yytext=a.yytext.slice(0,-10).trim(),27;case 40:return this.popState(),a.yytext=a.yytext.slice(0,-8).trim(),25;case 41:return this.popState(),a.yytext=a.yytext.slice(0,-8).trim(),26;case 42:return this.popState(),a.yytext=a.yytext.slice(0,-10).trim(),27;case 43:return 51;case 44:return 52;case 45:return 53;case 46:return 54;case 47:this.pushState("STATE_STRING");break;case 48:return this.pushState("STATE_ID"),"AS";case 49:if(!r())return;return this.popState(),"ID";case 50:this.popState();break;case 51:return "STATE_DESCR";case 52:return 19;case 53:this.popState();break;case 54:return this.popState(),this.pushState("struct"),20;case 55:return this.popState(),21;case 56:break;case 57:return this.begin("NOTE"),29;case 58:return this.popState(),this.pushState("NOTE_ID"),59;case 59:return this.popState(),this.pushState("NOTE_ID"),60;case 60:this.popState(),this.pushState("FLOATING_NOTE");break;case 61:return this.popState(),this.pushState("FLOATING_NOTE_ID"),"AS";case 62:break;case 63:return "NOTE_TEXT";case 64:if(!r())return;return this.popState(),"ID";case 65:if(!r())return;return this.popState(),this.pushState("NOTE_TEXT"),24;case 66:return this.popState(),a.yytext=a.yytext.substr(2).trim(),31;case 67:return this.popState(),a.yytext=a.yytext.slice(0,-8).trim(),31;case 68:return 6;case 69:return 6;case 70:return 16;case 71:return 57;case 72:return r()?24:void 0;case 73:return a.yytext=a.yytext.trim(),14;case 74:return 15;case 75:return 28;case 76:return 58;case 77:return 5;case 78:return "INVALID"}},"anonymous"),rules:[/^(?:click\b)/i,/^(?:href\b)/i,/^(?:"[^"]*")/i,/^(?:default\b)/i,/^(?:.*direction\s+TB[^\n]*)/i,/^(?:.*direction\s+BT[^\n]*)/i,/^(?:.*direction\s+RL[^\n]*)/i,/^(?:.*direction\s+LR[^\n]*)/i,/^(?:[\n]+)/i,/^(?:[\s]+)/i,/^(?:((?!\n)\s)+)/i,/^(?:#[^\n]*)/i,/^(?:%%(?!\{)[^\n]*)/i,/^(?:scale\s+)/i,/^(?:\d+)/i,/^(?:\s+width\b)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:classDef\s+)/i,/^(?:DEFAULT\s+)/i,/^(?:\w+\s+)/i,/^(?:[^\n]*)/i,/^(?:class\s+)/i,/^(?:(\w+)+((,\s*\w+)*))/i,/^(?:[^\n]*)/i,/^(?:style\s+)/i,/^(?:[\w,]+\s+)/i,/^(?:[^\n]*)/i,/^(?:scale\s+)/i,/^(?:\d+)/i,/^(?:\s+width\b)/i,/^(?:state\s+)/i,/^(?:.*<<fork>>)/i,/^(?:.*<<join>>)/i,/^(?:.*<<choice>>)/i,/^(?:.*\[\[fork\]\])/i,/^(?:.*\[\[join\]\])/i,/^(?:.*\[\[choice\]\])/i,/^(?:.*direction\s+TB[^\n]*)/i,/^(?:.*direction\s+BT[^\n]*)/i,/^(?:.*direction\s+RL[^\n]*)/i,/^(?:.*direction\s+LR[^\n]*)/i,/^(?:["])/i,/^(?:\s*as\s+)/i,/^(?:[^\n\{]*)/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:[^\n\s\{]+)/i,/^(?:\n)/i,/^(?:\{)/i,/^(?:\})/i,/^(?:[\n])/i,/^(?:note\s+)/i,/^(?:left of\b)/i,/^(?:right of\b)/i,/^(?:")/i,/^(?:\s*as\s*)/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:[^\n]*)/i,/^(?:\s*[^:\n\s\-]+)/i,/^(?:\s*:[^:\n;]+)/i,/^(?:[\s\S]*?\n\s*end note\b)/i,/^(?:stateDiagram\s+)/i,/^(?:stateDiagram-v2\s+)/i,/^(?:hide empty description\b)/i,/^(?:\[\*\])/i,/^(?:[^:\n\s\-\{]+)/i,/^(?:\s*:(?:[^:\n;]|:[^:\n;])+)/i,/^(?:-->)/i,/^(?:--)/i,/^(?::::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{LINE:{rules:[10,11,12],inclusive:false},struct:{rules:[10,11,12,23,27,30,36,43,44,45,46,55,56,57,71,72,73,74,75,76],inclusive:false},FLOATING_NOTE_ID:{rules:[64],inclusive:false},FLOATING_NOTE:{rules:[61,62,63],inclusive:false},NOTE_TEXT:{rules:[66,67],inclusive:false},NOTE_ID:{rules:[65],inclusive:false},NOTE:{rules:[58,59,60],inclusive:false},STYLEDEF_STYLEOPTS:{rules:[],inclusive:false},STYLEDEF_STYLES:{rules:[32],inclusive:false},STYLE_IDS:{rules:[],inclusive:false},STYLE:{rules:[31],inclusive:false},CLASS_STYLE:{rules:[29],inclusive:false},CLASS:{rules:[28],inclusive:false},CLASSDEFID:{rules:[26],inclusive:false},CLASSDEF:{rules:[24,25],inclusive:false},acc_descr_multiline:{rules:[21,22],inclusive:false},acc_descr:{rules:[19],inclusive:false},acc_title:{rules:[17],inclusive:false},SCALE:{rules:[14,15,34,35],inclusive:false},ALIAS:{rules:[],inclusive:false},STATE_ID:{rules:[49],inclusive:false},STATE_STRING:{rules:[50,51],inclusive:false},FORK_STATE:{rules:[],inclusive:false},STATE:{rules:[10,11,12,37,38,39,40,41,42,47,48,52,53,54],inclusive:false},ID:{rules:[10,11,12],inclusive:false},INITIAL:{rules:[0,1,2,3,4,5,6,7,8,9,11,12,13,16,18,20,23,27,30,33,36,54,57,68,69,70,71,72,73,74,76,77,78],inclusive:true}}};return Y})();gt.lexer=ce;function ct(){this.yy={};}return Ot(ct,"Parser"),ct.prototype=gt,gt.Parser=ct,new ct})();vt.parser=vt;var je=vt,fe="TB",Jt="TB",Ut="dir",X="state",K="root",Ct="relation",pe="classDef",Se="style",ye="applyClass",tt="default",qt="divider",Qt="fill:none",Zt="fill: #333",te="c",ee="markdown",se="normal",mt="rect",Dt="rectWithTitle",ge="stateStart",Te="stateEnd",Wt="divider",jt="roundedWithTitle",be="note",Ee="noteGroup",et="statediagram",ke="state",_e=`${et}-${ke}`,re="transition",me="note",De="note-edge",ve=`${re} ${De}`,Ce=`${et}-${me}`,Ae="cluster",xe=`${et}-${Ae}`,Le="cluster-alt",Ie=`${et}-${Le}`,ie="parent",ae="note",Oe="state",At="----",Ne=`${At}${ae}`,Ht=`${At}${ie}`,ne=Ot((t,e=Jt)=>{if(!t.doc)return e;let s=e;for(let n of t.doc)n.stmt==="dir"&&(s=n.value);return s},"getDir"),Re=Ot(function(t,e){return e.db.getClasses()},"getClasses"),we=Ot(async function(t,e,s,n){ct.info("REF0:"),ct.info("Drawing state diagram (v2)",e);let{securityLevel:i,state:d,layout:f}=Se$1();n.db.extract(n.db.getRootDocV2());let S=n.db.getData(),p=g(e,i);S.type=n.type,S.layoutAlgorithm=f,S.nodeSpacing=d?.nodeSpacing||50,S.rankSpacing=d?.rankSpacing||50,Se$1().look==="neo"?S.markers=["barbNeo"]:S.markers=["barb"],S.diagramId=e,await C(S,p);let E=8;try{(typeof n.db.getLinks=="function"?n.db.getLinks():new Map).forEach((x,D)=>{let h=typeof D=="string"?D:typeof D?.id=="string"?D.id:"";if(!h){ct.warn("\u26A0\uFE0F Invalid or missing stateId from key:",JSON.stringify(D));return}let L=p.node()?.querySelectorAll("g"),v;if(L?.forEach(O=>{O.textContent?.trim()===h&&(v=O);}),!v){ct.warn("\u26A0\uFE0F Could not find node matching text:",h);return}let $=v.parentNode;if(!$){ct.warn("\u26A0\uFE0F Node has no parent, cannot wrap:",h);return}let I=document.createElementNS("http://www.w3.org/2000/svg","a"),P=x.url.replace(/^"+|"+$/g,"");if(I.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",P),I.setAttribute("target","_blank"),x.tooltip){let O=x.tooltip.replace(/^"+|"+$/g,"");I.setAttribute("title",O);}$.replaceChild(I,v),I.appendChild(v),ct.info("\u{1F517} Wrapped node in <a> tag for:",h,x.url);});}catch(_){ct.error("\u274C Error injecting clickable links:",_);}si.insertTitle(p,"statediagramTitleText",d?.titleTopMargin??25,n.db.getDiagramTitle()),g$1(p,E,et,d?.useMaxWidth??true);},"draw"),He={getClasses:Re,draw:we,getDir:ne},St=new Map,M=0;function yt(t="",e=0,s="",n=At){let i=s!==null&&s.length>0?`${n}${s}`:"";return `${Oe}-${t}${i}-${e}`}Ot(yt,"stateDomId");var $e=Ot((t,e,s,n,i,d,f,S)=>{ct.trace("items",e),e.forEach(p=>{switch(p.stmt){case X:Z(t,p,s,n,i,d,f,S);break;case tt:Z(t,p,s,n,i,d,f,S);break;case Ct:{Z(t,p.state1,s,n,i,d,f,S),Z(t,p.state2,s,n,i,d,f,S);let T=f==="neo",E={id:"edge"+M,start:p.state1.id,end:p.state2.id,arrowhead:"normal",arrowTypeEnd:T?"arrow_barb_neo":"arrow_barb",style:Qt,labelStyle:"",label:lh.sanitizeText(p.description??"",Se$1()),arrowheadStyle:Zt,labelpos:te,labelType:ee,thickness:se,classes:re,look:f};i.push(E),M++;}break}});},"setupDoc"),zt=Ot((t,e=Jt)=>{let s=e;if(t.doc)for(let n of t.doc)n.stmt==="dir"&&(s=n.value);return s},"getDir");function Q(t,e,s){if(!e.id||e.id==="</join></fork>"||e.id==="</choice>")return;e.cssClasses&&(Array.isArray(e.cssCompiledStyles)||(e.cssCompiledStyles=[]),e.cssClasses.split(" ").forEach(i=>{let d=s.get(i);d&&(e.cssCompiledStyles=[...e.cssCompiledStyles??[],...d.styles]);}));let n=t.find(i=>i.id===e.id);n?Object.assign(n,e):t.push(e);}Ot(Q,"insertOrUpdateNode");function oe(t){return t?.classes?.join(" ")??""}Ot(oe,"getClassesFromDbInfo");function le(t){return t?.styles??[]}Ot(le,"getStylesFromDbInfo");var Z=Ot((t,e,s,n,i,d,f,S)=>{let p=e.id,T=s.get(p),E=oe(T),_=le(T),x=Se$1();if(ct.info("dataFetcher parsedItem",e,T,_),p!=="root"){let D=mt;e.start===true?D=ge:e.start===false&&(D=Te),e.type!==tt&&(D=e.type),St.get(p)||St.set(p,{id:p,shape:D,description:lh.sanitizeText(p,x),cssClasses:`${E} ${_e}`,cssStyles:_});let h=St.get(p);e.description&&(Array.isArray(h.description)?(h.shape=Dt,h.description.push(e.description)):h.description?.length&&h.description.length>0?(h.shape=Dt,h.description===p?h.description=[e.description]:h.description=[h.description,e.description]):(h.shape=mt,h.description=e.description),h.description=lh.sanitizeTextOrArray(h.description,x)),h.description?.length===1&&h.shape===Dt&&(h.type==="group"?h.shape=jt:h.shape=mt),!h.type&&e.doc&&(ct.info("Setting cluster for XCX",p,zt(e)),h.type="group",h.isGroup=true,h.dir=zt(e),h.shape=e.type===qt?Wt:jt,h.cssClasses=`${h.cssClasses} ${xe} ${d?Ie:""}`);let L={labelStyle:"",shape:h.shape,label:h.description,cssClasses:h.cssClasses,cssCompiledStyles:[],cssStyles:h.cssStyles,id:p,dir:h.dir,domId:yt(p,M),type:h.type,isGroup:h.type==="group",padding:8,rx:10,ry:10,look:f,labelType:"markdown"};if(L.shape===Wt&&(L.label=""),t&&t.id!=="root"&&(ct.trace("Setting node ",p," to be child of its parent ",t.id),L.parentId=t.id),L.centerLabel=true,e.note){let v={labelStyle:"",shape:be,label:e.note.text,labelType:"markdown",cssClasses:Ce,cssStyles:[],cssCompiledStyles:[],id:p+Ne+"-"+M,domId:yt(p,M,ae),type:h.type,isGroup:h.type==="group",padding:x.flowchart?.padding,look:f,position:e.note.position},$=p+Ht,I={labelStyle:"",shape:Ee,label:e.note.text,cssClasses:h.cssClasses,cssStyles:[],id:p+Ht,domId:yt(p,M,ie),type:"group",isGroup:true,padding:16,look:f,position:e.note.position};M++,I.id=$,v.parentId=$,Q(n,I,S),Q(n,v,S),Q(n,L,S);let P=p,O=v.id;e.note.position==="left of"&&(P=v.id,O=p),i.push({id:P+"-"+O,start:P,end:O,arrowhead:"none",arrowTypeEnd:"",style:Qt,labelStyle:"",classes:ve,arrowheadStyle:Zt,labelpos:te,labelType:ee,thickness:se,look:f});}else Q(n,L,S);}e.doc&&(ct.trace("Adding nodes children "),$e(e,e.doc,s,n,i,!d,f,S));},"dataFetcher"),Pe=Ot(()=>{St.clear(),M=0;},"reset"),A={START_NODE:"[*]",START_TYPE:"start",END_NODE:"[*]",END_TYPE:"end",COLOR_KEYWORD:"color",FILL_KEYWORD:"fill",BG_FILL:"bgFill",STYLECLASS_SEP:","},Kt=Ot(()=>new Map,"newClassesList"),Xt=Ot(()=>({relations:[],states:new Map,documents:{}}),"newDoc"),pt=Ot(t=>JSON.parse(JSON.stringify(t)),"clone"),ze=class{constructor(e){this.version=e,this.nodes=[],this.edges=[],this.rootDoc=[],this.classes=Kt(),this.documents={root:Xt()},this.currentDocument=this.documents.root,this.startEndCount=0,this.dividerCnt=0,this.links=new Map,this.getAccTitle=Qs,this.setAccTitle=Js,this.getAccDescription=ia,this.setAccDescription=ta,this.setDiagramTitle=ra,this.getDiagramTitle=ea,this.clear(),this.setRootDoc=this.setRootDoc.bind(this),this.getDividerId=this.getDividerId.bind(this),this.setDirection=this.setDirection.bind(this),this.trimColon=this.trimColon.bind(this);}static{Ot(this,"StateDB");}static{this.relationType={AGGREGATION:0,EXTENSION:1,COMPOSITION:2,DEPENDENCY:3};}extract(e){this.clear(true);for(let i of Array.isArray(e)?e:e.doc)switch(i.stmt){case X:this.addState(i.id.trim(),i.type,i.doc,i.description,i.note);break;case Ct:this.addRelation(i.state1,i.state2,i.description);break;case pe:this.addStyleClass(i.id.trim(),i.classes);break;case Se:this.handleStyleDef(i);break;case ye:this.setCssClass(i.id.trim(),i.styleClass);break;case "click":this.addLink(i.id,i.url,i.tooltip);break}let s=this.getStates(),n=Se$1();Pe(),Z(void 0,this.getRootDocV2(),s,this.nodes,this.edges,true,n.look,this.classes);for(let i of this.nodes)if(Array.isArray(i.label)){if(i.description=i.label.slice(1),i.isGroup&&i.description.length>0)throw new Error(`Group nodes can only have label. Remove the additional description for node [${i.id}]`);i.label=i.label[0];}}handleStyleDef(e){let s=e.id.trim().split(","),n=e.styleClass.split(",");for(let i of s){let d=this.getState(i);if(!d){let f=i.trim();this.addState(f),d=this.getState(f);}d&&(d.styles=n.map(f=>f.replace(/;/g,"")?.trim()));}}setRootDoc(e){ct.info("Setting root doc",e),this.rootDoc=e,this.version===1?this.extract(e):this.extract(this.getRootDocV2());}docTranslator(e,s,n){if(s.stmt===Ct){this.docTranslator(e,s.state1,true),this.docTranslator(e,s.state2,false);return}if(s.stmt===X&&(s.id===A.START_NODE?(s.id=e.id+(n?"_start":"_end"),s.start=n):s.id=s.id.trim()),s.stmt!==K&&s.stmt!==X||!s.doc)return;let i=[],d=[];for(let f of s.doc)if(f.type===qt){let S=pt(f);S.doc=pt(d),i.push(S),d=[];}else d.push(f);if(i.length>0&&d.length>0){let f={stmt:X,id:Pt(),type:"divider",doc:pt(d)};i.push(pt(f)),s.doc=i;}s.doc.forEach(f=>this.docTranslator(s,f,true));}getRootDocV2(){return this.docTranslator({id:K,stmt:K},{id:K,stmt:K,doc:this.rootDoc},true),{id:K,doc:this.rootDoc}}addState(e,s=tt,n=void 0,i=void 0,d=void 0,f=void 0,S=void 0,p=void 0){let T=e?.trim();if(!this.currentDocument.states.has(T))ct.info("Adding state ",T,i),this.currentDocument.states.set(T,{stmt:X,id:T,descriptions:[],type:s,doc:n,note:d,classes:[],styles:[],textStyles:[]});else {let E=this.currentDocument.states.get(T);if(!E)throw new Error(`State not found: ${T}`);E.doc||(E.doc=n),E.type||(E.type=s);}if(i&&(ct.info("Setting state description",T,i),(Array.isArray(i)?i:[i]).forEach(_=>this.addDescription(T,_.trim()))),d){let E=this.currentDocument.states.get(T);if(!E)throw new Error(`State not found: ${T}`);E.note=d,E.note.text=lh.sanitizeText(E.note.text,Se$1());}f&&(ct.info("Setting state classes",T,f),(Array.isArray(f)?f:[f]).forEach(_=>this.setCssClass(T,_.trim()))),S&&(ct.info("Setting state styles",T,S),(Array.isArray(S)?S:[S]).forEach(_=>this.setStyle(T,_.trim()))),p&&(ct.info("Setting state styles",T,S),(Array.isArray(p)?p:[p]).forEach(_=>this.setTextStyle(T,_.trim())));}clear(e){this.nodes=[],this.edges=[],this.documents={root:Xt()},this.currentDocument=this.documents.root,this.startEndCount=0,this.classes=Kt(),e||(this.links=new Map,Zs());}getState(e){return this.currentDocument.states.get(e)}getStates(){return this.currentDocument.states}logDocuments(){ct.info("Documents = ",this.documents);}getRelations(){return this.currentDocument.relations}addLink(e,s,n){this.links.set(e,{url:s,tooltip:n}),ct.warn("Adding link",e,s,n);}getLinks(){return this.links}startIdIfNeeded(e=""){return e===A.START_NODE?(this.startEndCount++,`${A.START_TYPE}${this.startEndCount}`):e}startTypeIfNeeded(e="",s=tt){return e===A.START_NODE?A.START_TYPE:s}endIdIfNeeded(e=""){return e===A.END_NODE?(this.startEndCount++,`${A.END_TYPE}${this.startEndCount}`):e}endTypeIfNeeded(e="",s=tt){return e===A.END_NODE?A.END_TYPE:s}addRelationObjs(e,s,n=""){let i=this.startIdIfNeeded(e.id.trim()),d=this.startTypeIfNeeded(e.id.trim(),e.type),f=this.startIdIfNeeded(s.id.trim()),S=this.startTypeIfNeeded(s.id.trim(),s.type);this.addState(i,d,e.doc,e.description,e.note,e.classes,e.styles,e.textStyles),this.addState(f,S,s.doc,s.description,s.note,s.classes,s.styles,s.textStyles),this.currentDocument.relations.push({id1:i,id2:f,relationTitle:lh.sanitizeText(n,Se$1())});}addRelation(e,s,n){if(typeof e=="object"&&typeof s=="object")this.addRelationObjs(e,s,n);else if(typeof e=="string"&&typeof s=="string"){let i=this.startIdIfNeeded(e.trim()),d=this.startTypeIfNeeded(e),f=this.endIdIfNeeded(s.trim()),S=this.endTypeIfNeeded(s);this.addState(i,d),this.addState(f,S),this.currentDocument.relations.push({id1:i,id2:f,relationTitle:n?lh.sanitizeText(n,Se$1()):void 0});}}addDescription(e,s){let n=this.currentDocument.states.get(e),i=s.startsWith(":")?s.replace(":","").trim():s;n?.descriptions?.push(lh.sanitizeText(i,Se$1()));}cleanupLabel(e){return e.startsWith(":")?e.slice(2).trim():e.trim()}getDividerId(){return this.dividerCnt++,`divider-id-${this.dividerCnt}`}addStyleClass(e,s=""){this.classes.has(e)||this.classes.set(e,{id:e,styles:[],textStyles:[]});let n=this.classes.get(e);s&&n&&s.split(A.STYLECLASS_SEP).forEach(i=>{let d=i.replace(/([^;]*);/,"$1").trim();if(RegExp(A.COLOR_KEYWORD).exec(i)){let S=d.replace(A.FILL_KEYWORD,A.BG_FILL).replace(A.COLOR_KEYWORD,A.FILL_KEYWORD);n.textStyles.push(S);}n.styles.push(d);});}getClasses(){return this.classes}setCssClass(e,s){e.split(",").forEach(n=>{let i=this.getState(n);if(!i){let d=n.trim();this.addState(d),i=this.getState(d);}i?.classes?.push(s);});}setStyle(e,s){this.getState(e)?.styles?.push(s);}setTextStyle(e,s){this.getState(e)?.textStyles?.push(s);}getDirectionStatement(){return this.rootDoc.find(e=>e.stmt===Ut)}getDirection(){return this.getDirectionStatement()?.value??fe}setDirection(e){let s=this.getDirectionStatement();s?s.value=e:this.rootDoc.unshift({stmt:Ut,value:e});}trimColon(e){return e.startsWith(":")?e.slice(1).trim():e.trim()}getData(){let e=Se$1();return {nodes:this.nodes,edges:this.edges,other:{},config:e,direction:ne(this.getRootDocV2())}}getConfig(){return Se$1().state}},Be=Ot(t=>`
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
  fill: ${t.altBackground?t.altBackground:"#efefef"};
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
  fill: ${t.altBackground?t.altBackground:"#efefef"};
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
  stroke: ${t.useGradient?"url("+t.svgId+"-gradient)":t.stateBorder||t.nodeBorder};
  stroke-width: ${t.strokeWidth??1};
}
[data-look="neo"].statediagram-cluster rect.outer {
  rx: ${t.radius}px;
  ry: ${t.radius}px;
  filter: ${t.dropShadow?t.dropShadow.replace("url(#drop-shadow)",`url(${t.svgId}-drop-shadow)`):"none"}
}
`,"getStyles"),Ke=Be;export{He as H,Ke as K,je as j,ze as z};//# sourceMappingURL=chunk-OLnBumsI.js.map
