"use strict";(self.webpackChunkgloomhavensecretariat=self.webpackChunkgloomhavensecretariat||[]).push([[469],{2280:(Ne,J,O)=>{O.d(J,{A:()=>te});var B=O(6854);const te=function ee(se){return(0,B.A)(se,4)}},6469:(Ne,J,O)=>{O.r(J),O.d(J,{diagram:()=>qe});var Le,Se,B=O(467),f=O(3585),ee=O(2280),te=O(2212),se=O(2837),W=O(4142),Te=O(8802),j=O(5414),ie=(O(7374),O(2571),O(627),function(){var e=function(w,o,s,i){for(s=s||{},i=w.length;i--;s[w[i]]=o);return s},l=[1,7],a=[1,13],c=[1,14],n=[1,15],g=[1,19],u=[1,16],p=[1,17],_=[1,18],x=[8,30],L=[8,21,28,29,30,31,32,40,44,47],E=[1,23],C=[1,24],k=[8,15,16,21,28,29,30,31,32,40,44,47],A=[8,15,16,21,27,28,29,30,31,32,40,44,47],y=[1,49],m={trace:function(){},yy:{},symbols_:{error:2,spaceLines:3,SPACELINE:4,NL:5,separator:6,SPACE:7,EOF:8,start:9,BLOCK_DIAGRAM_KEY:10,document:11,stop:12,statement:13,link:14,LINK:15,START_LINK:16,LINK_LABEL:17,STR:18,nodeStatement:19,columnsStatement:20,SPACE_BLOCK:21,blockStatement:22,classDefStatement:23,cssClassStatement:24,styleStatement:25,node:26,SIZE:27,COLUMNS:28,"id-block":29,end:30,block:31,NODE_ID:32,nodeShapeNLabel:33,dirList:34,DIR:35,NODE_DSTART:36,NODE_DEND:37,BLOCK_ARROW_START:38,BLOCK_ARROW_END:39,classDef:40,CLASSDEF_ID:41,CLASSDEF_STYLEOPTS:42,DEFAULT:43,class:44,CLASSENTITY_IDS:45,STYLECLASS:46,style:47,STYLE_ENTITY_IDS:48,STYLE_DEFINITION_DATA:49,$accept:0,$end:1},terminals_:{2:"error",4:"SPACELINE",5:"NL",7:"SPACE",8:"EOF",10:"BLOCK_DIAGRAM_KEY",15:"LINK",16:"START_LINK",17:"LINK_LABEL",18:"STR",21:"SPACE_BLOCK",27:"SIZE",28:"COLUMNS",29:"id-block",30:"end",31:"block",32:"NODE_ID",35:"DIR",36:"NODE_DSTART",37:"NODE_DEND",38:"BLOCK_ARROW_START",39:"BLOCK_ARROW_END",40:"classDef",41:"CLASSDEF_ID",42:"CLASSDEF_STYLEOPTS",43:"DEFAULT",44:"class",45:"CLASSENTITY_IDS",46:"STYLECLASS",47:"style",48:"STYLE_ENTITY_IDS",49:"STYLE_DEFINITION_DATA"},productions_:[0,[3,1],[3,2],[3,2],[6,1],[6,1],[6,1],[9,3],[12,1],[12,1],[12,2],[12,2],[11,1],[11,2],[14,1],[14,4],[13,1],[13,1],[13,1],[13,1],[13,1],[13,1],[13,1],[19,3],[19,2],[19,1],[20,1],[22,4],[22,3],[26,1],[26,2],[34,1],[34,2],[33,3],[33,4],[23,3],[23,3],[24,3],[25,3]],performAction:function(o,s,i,d,h,t,S){var r=t.length-1;switch(h){case 4:d.getLogger().debug("Rule: separator (NL) ");break;case 5:d.getLogger().debug("Rule: separator (Space) ");break;case 6:d.getLogger().debug("Rule: separator (EOF) ");break;case 7:d.getLogger().debug("Rule: hierarchy: ",t[r-1]),d.setHierarchy(t[r-1]);break;case 8:d.getLogger().debug("Stop NL ");break;case 9:d.getLogger().debug("Stop EOF ");break;case 10:d.getLogger().debug("Stop NL2 ");break;case 11:d.getLogger().debug("Stop EOF2 ");break;case 12:d.getLogger().debug("Rule: statement: ",t[r]),this.$="number"==typeof t[r].length?t[r]:[t[r]];break;case 13:d.getLogger().debug("Rule: statement #2: ",t[r-1]),this.$=[t[r-1]].concat(t[r]);break;case 14:d.getLogger().debug("Rule: link: ",t[r],o),this.$={edgeTypeStr:t[r],label:""};break;case 15:d.getLogger().debug("Rule: LABEL link: ",t[r-3],t[r-1],t[r]),this.$={edgeTypeStr:t[r],label:t[r-1]};break;case 18:const P=parseInt(t[r]),V=d.generateId();this.$={id:V,type:"space",label:"",width:P,children:[]};break;case 23:d.getLogger().debug("Rule: (nodeStatement link node) ",t[r-2],t[r-1],t[r]," typestr: ",t[r-1].edgeTypeStr);const K=d.edgeStrToEdgeData(t[r-1].edgeTypeStr);this.$=[{id:t[r-2].id,label:t[r-2].label,type:t[r-2].type,directions:t[r-2].directions},{id:t[r-2].id+"-"+t[r].id,start:t[r-2].id,end:t[r].id,label:t[r-1].label,type:"edge",directions:t[r].directions,arrowTypeEnd:K,arrowTypeStart:"arrow_open"},{id:t[r].id,label:t[r].label,type:d.typeStr2Type(t[r].typeStr),directions:t[r].directions}];break;case 24:d.getLogger().debug("Rule: nodeStatement (abc88 node size) ",t[r-1],t[r]),this.$={id:t[r-1].id,label:t[r-1].label,type:d.typeStr2Type(t[r-1].typeStr),directions:t[r-1].directions,widthInColumns:parseInt(t[r],10)};break;case 25:d.getLogger().debug("Rule: nodeStatement (node) ",t[r]),this.$={id:t[r].id,label:t[r].label,type:d.typeStr2Type(t[r].typeStr),directions:t[r].directions,widthInColumns:1};break;case 26:d.getLogger().debug("APA123",this?this:"na"),d.getLogger().debug("COLUMNS: ",t[r]),this.$={type:"column-setting",columns:"auto"===t[r]?-1:parseInt(t[r])};break;case 27:d.getLogger().debug("Rule: id-block statement : ",t[r-2],t[r-1]),d.generateId(),this.$={...t[r-2],type:"composite",children:t[r-1]};break;case 28:d.getLogger().debug("Rule: blockStatement : ",t[r-2],t[r-1],t[r]);const R=d.generateId();this.$={id:R,type:"composite",label:"",children:t[r-1]};break;case 29:d.getLogger().debug("Rule: node (NODE_ID separator): ",t[r]),this.$={id:t[r]};break;case 30:d.getLogger().debug("Rule: node (NODE_ID nodeShapeNLabel separator): ",t[r-1],t[r]),this.$={id:t[r-1],label:t[r].label,typeStr:t[r].typeStr,directions:t[r].directions};break;case 31:d.getLogger().debug("Rule: dirList: ",t[r]),this.$=[t[r]];break;case 32:d.getLogger().debug("Rule: dirList: ",t[r-1],t[r]),this.$=[t[r-1]].concat(t[r]);break;case 33:d.getLogger().debug("Rule: nodeShapeNLabel: ",t[r-2],t[r-1],t[r]),this.$={typeStr:t[r-2]+t[r],label:t[r-1]};break;case 34:d.getLogger().debug("Rule: BLOCK_ARROW nodeShapeNLabel: ",t[r-3],t[r-2]," #3:",t[r-1],t[r]),this.$={typeStr:t[r-3]+t[r],label:t[r-2],directions:t[r-1]};break;case 35:case 36:this.$={type:"classDef",id:t[r-1].trim(),css:t[r].trim()};break;case 37:this.$={type:"applyClass",id:t[r-1].trim(),styleClass:t[r].trim()};break;case 38:this.$={type:"applyStyles",id:t[r-1].trim(),stylesStr:t[r].trim()}}},table:[{9:1,10:[1,2]},{1:[3]},{11:3,13:4,19:5,20:6,21:l,22:8,23:9,24:10,25:11,26:12,28:a,29:c,31:n,32:g,40:u,44:p,47:_},{8:[1,20]},e(x,[2,12],{13:4,19:5,20:6,22:8,23:9,24:10,25:11,26:12,11:21,21:l,28:a,29:c,31:n,32:g,40:u,44:p,47:_}),e(L,[2,16],{14:22,15:E,16:C}),e(L,[2,17]),e(L,[2,18]),e(L,[2,19]),e(L,[2,20]),e(L,[2,21]),e(L,[2,22]),e(k,[2,25],{27:[1,25]}),e(L,[2,26]),{19:26,26:12,32:g},{11:27,13:4,19:5,20:6,21:l,22:8,23:9,24:10,25:11,26:12,28:a,29:c,31:n,32:g,40:u,44:p,47:_},{41:[1,28],43:[1,29]},{45:[1,30]},{48:[1,31]},e(A,[2,29],{33:32,36:[1,33],38:[1,34]}),{1:[2,7]},e(x,[2,13]),{26:35,32:g},{32:[2,14]},{17:[1,36]},e(k,[2,24]),{11:37,13:4,14:22,15:E,16:C,19:5,20:6,21:l,22:8,23:9,24:10,25:11,26:12,28:a,29:c,31:n,32:g,40:u,44:p,47:_},{30:[1,38]},{42:[1,39]},{42:[1,40]},{46:[1,41]},{49:[1,42]},e(A,[2,30]),{18:[1,43]},{18:[1,44]},e(k,[2,23]),{18:[1,45]},{30:[1,46]},e(L,[2,28]),e(L,[2,35]),e(L,[2,36]),e(L,[2,37]),e(L,[2,38]),{37:[1,47]},{34:48,35:y},{15:[1,50]},e(L,[2,27]),e(A,[2,33]),{39:[1,51]},{34:52,35:y,39:[2,31]},{32:[2,15]},e(A,[2,34]),{39:[2,32]}],defaultActions:{20:[2,7],23:[2,14],50:[2,15],52:[2,32]},parseError:function(o,s){if(!s.recoverable){var i=new Error(o);throw i.hash=s,i}this.trace(o)},parse:function(o){var i=[0],d=[],h=[null],t=[],S=this.table,r="",P=0,V=0,$e=t.slice.call(arguments,1),D=Object.create(this.lexer),U={yy:{}};for(var pe in this.yy)Object.prototype.hasOwnProperty.call(this.yy,pe)&&(U.yy[pe]=this.yy[pe]);D.setInput(o,U.yy),U.yy.lexer=D,U.yy.parser=this,typeof D.yylloc>"u"&&(D.yylloc={});var fe=D.yylloc;t.push(fe);var F,et=D.options&&D.options.ranges;this.parseError="function"==typeof U.yy.parseError?U.yy.parseError:Object.getPrototypeOf(this).parseError;for(var I,Y,z,xe,q,M,$,X={};;){if(this.defaultActions[Y=i[i.length-1]]?z=this.defaultActions[Y]:((null===I||typeof I>"u")&&(F=void 0,"number"!=typeof(F=d.pop()||D.lex()||1)&&(F instanceof Array&&(F=(d=F).pop()),F=this.symbols_[F]||F),I=F),z=S[Y]&&S[Y][I]),typeof z>"u"||!z.length||!z[0]){var _e;for(q in $=[],S[Y])this.terminals_[q]&&q>2&&$.push("'"+this.terminals_[q]+"'");_e=D.showPosition?"Parse error on line "+(P+1)+":\n"+D.showPosition()+"\nExpecting "+$.join(", ")+", got '"+(this.terminals_[I]||I)+"'":"Parse error on line "+(P+1)+": Unexpected "+(1==I?"end of input":"'"+(this.terminals_[I]||I)+"'"),this.parseError(_e,{text:D.match,token:this.terminals_[I]||I,line:D.yylineno,loc:fe,expected:$})}if(z[0]instanceof Array&&z.length>1)throw new Error("Parse Error: multiple actions possible at state: "+Y+", token: "+I);switch(z[0]){case 1:i.push(I),h.push(D.yytext),t.push(D.yylloc),i.push(z[1]),I=null,V=D.yyleng,r=D.yytext,P=D.yylineno,fe=D.yylloc;break;case 2:if(X.$=h[h.length-(M=this.productions_[z[1]][1])],X._$={first_line:t[t.length-(M||1)].first_line,last_line:t[t.length-1].last_line,first_column:t[t.length-(M||1)].first_column,last_column:t[t.length-1].last_column},et&&(X._$.range=[t[t.length-(M||1)].range[0],t[t.length-1].range[1]]),typeof(xe=this.performAction.apply(X,[r,V,P,U.yy,z[1],h,t].concat($e)))<"u")return xe;M&&(i=i.slice(0,-1*M*2),h=h.slice(0,-1*M),t=t.slice(0,-1*M)),i.push(this.productions_[z[1]][0]),h.push(X.$),t.push(X._$),i.push(S[i[i.length-2]][i[i.length-1]]);break;case 3:return!0}}return!0}};function N(){this.yy={}}return m.lexer=function(){return{EOF:1,parseError:function(s,i){if(!this.yy.parser)throw new Error(s);this.yy.parser.parseError(s,i)},setInput:function(o,s){return this.yy=s||this.yy||{},this._input=o,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},input:function(){var o=this._input[0];return this.yytext+=o,this.yyleng++,this.offset++,this.match+=o,this.matched+=o,o.match(/(?:\r\n?|\n).*/g)?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),o},unput:function(o){var s=o.length,i=o.split(/(?:\r\n?|\n)/g);this._input=o+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-s),this.offset-=s;var d=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),i.length-1&&(this.yylineno-=i.length-1);var h=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:i?(i.length===d.length?this.yylloc.first_column:0)+d[d.length-i.length].length-i[0].length:this.yylloc.first_column-s},this.options.ranges&&(this.yylloc.range=[h[0],h[0]+this.yyleng-s]),this.yyleng=this.yytext.length,this},more:function(){return this._more=!0,this},reject:function(){return this.options.backtrack_lexer?(this._backtrack=!0,this):this.parseError("Lexical error on line "+(this.yylineno+1)+". You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n"+this.showPosition(),{text:"",token:null,line:this.yylineno})},less:function(o){this.unput(this.match.slice(o))},pastInput:function(){var o=this.matched.substr(0,this.matched.length-this.match.length);return(o.length>20?"...":"")+o.substr(-20).replace(/\n/g,"")},upcomingInput:function(){var o=this.match;return o.length<20&&(o+=this._input.substr(0,20-o.length)),(o.substr(0,20)+(o.length>20?"...":"")).replace(/\n/g,"")},showPosition:function(){var o=this.pastInput(),s=new Array(o.length+1).join("-");return o+this.upcomingInput()+"\n"+s+"^"},test_match:function(o,s){var i,d,h;if(this.options.backtrack_lexer&&(h={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(h.yylloc.range=this.yylloc.range.slice(0))),(d=o[0].match(/(?:\r\n?|\n).*/g))&&(this.yylineno+=d.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:d?d[d.length-1].length-d[d.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+o[0].length},this.yytext+=o[0],this.match+=o[0],this.matches=o,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(o[0].length),this.matched+=o[0],i=this.performAction.call(this,this.yy,this,s,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),i)return i;if(this._backtrack){for(var t in h)this[t]=h[t];return!1}return!1},next:function(){if(this.done)return this.EOF;var o,s,i,d;this._input||(this.done=!0),this._more||(this.yytext="",this.match="");for(var h=this._currentRules(),t=0;t<h.length;t++)if((i=this._input.match(this.rules[h[t]]))&&(!s||i[0].length>s[0].length)){if(s=i,d=t,this.options.backtrack_lexer){if(!1!==(o=this.test_match(i,h[t])))return o;if(this._backtrack){s=!1;continue}return!1}if(!this.options.flex)break}return s?!1!==(o=this.test_match(s,h[d]))&&o:""===this._input?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+". Unrecognized text.\n"+this.showPosition(),{text:"",token:null,line:this.yylineno})},lex:function(){return this.next()||this.lex()},begin:function(s){this.conditionStack.push(s)},popState:function(){return this.conditionStack.length-1>0?this.conditionStack.pop():this.conditionStack[0]},_currentRules:function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},topState:function(s){return(s=this.conditionStack.length-1-Math.abs(s||0))>=0?this.conditionStack[s]:"INITIAL"},pushState:function(s){this.begin(s)},stateStackSize:function(){return this.conditionStack.length},options:{},performAction:function(s,i,d,h){switch(d){case 0:return 10;case 1:return s.getLogger().debug("Found space-block"),31;case 2:return s.getLogger().debug("Found nl-block"),31;case 3:return s.getLogger().debug("Found space-block"),29;case 4:s.getLogger().debug(".",i.yytext);break;case 5:s.getLogger().debug("_",i.yytext);break;case 6:return 5;case 7:return i.yytext=-1,28;case 8:return i.yytext=i.yytext.replace(/columns\s+/,""),s.getLogger().debug("COLUMNS (LEX)",i.yytext),28;case 9:case 77:case 78:case 100:this.pushState("md_string");break;case 10:return"MD_STR";case 11:case 35:case 80:this.popState();break;case 12:this.pushState("string");break;case 13:s.getLogger().debug("LEX: POPPING STR:",i.yytext),this.popState();break;case 14:return s.getLogger().debug("LEX: STR end:",i.yytext),"STR";case 15:return i.yytext=i.yytext.replace(/space\:/,""),s.getLogger().debug("SPACE NUM (LEX)",i.yytext),21;case 16:return i.yytext="1",s.getLogger().debug("COLUMNS (LEX)",i.yytext),21;case 17:return 43;case 18:return"LINKSTYLE";case 19:return"INTERPOLATE";case 20:return this.pushState("CLASSDEF"),40;case 21:return this.popState(),this.pushState("CLASSDEFID"),"DEFAULT_CLASSDEF_ID";case 22:return this.popState(),this.pushState("CLASSDEFID"),41;case 23:return this.popState(),42;case 24:return this.pushState("CLASS"),44;case 25:return this.popState(),this.pushState("CLASS_STYLE"),45;case 26:return this.popState(),46;case 27:return this.pushState("STYLE_STMNT"),47;case 28:return this.popState(),this.pushState("STYLE_DEFINITION"),48;case 29:return this.popState(),49;case 30:return this.pushState("acc_title"),"acc_title";case 31:return this.popState(),"acc_title_value";case 32:return this.pushState("acc_descr"),"acc_descr";case 33:return this.popState(),"acc_descr_value";case 34:this.pushState("acc_descr_multiline");break;case 36:return"acc_descr_multiline_value";case 37:return 30;case 38:case 39:case 41:case 42:case 45:return this.popState(),s.getLogger().debug("Lex: (("),"NODE_DEND";case 40:return this.popState(),s.getLogger().debug("Lex: ))"),"NODE_DEND";case 43:return this.popState(),s.getLogger().debug("Lex: (-"),"NODE_DEND";case 44:return this.popState(),s.getLogger().debug("Lex: -)"),"NODE_DEND";case 46:return this.popState(),s.getLogger().debug("Lex: ]]"),"NODE_DEND";case 47:return this.popState(),s.getLogger().debug("Lex: ("),"NODE_DEND";case 48:return this.popState(),s.getLogger().debug("Lex: ])"),"NODE_DEND";case 49:case 50:return this.popState(),s.getLogger().debug("Lex: /]"),"NODE_DEND";case 51:return this.popState(),s.getLogger().debug("Lex: )]"),"NODE_DEND";case 52:return this.popState(),s.getLogger().debug("Lex: )"),"NODE_DEND";case 53:return this.popState(),s.getLogger().debug("Lex: ]>"),"NODE_DEND";case 54:return this.popState(),s.getLogger().debug("Lex: ]"),"NODE_DEND";case 55:return s.getLogger().debug("Lexa: -)"),this.pushState("NODE"),36;case 56:return s.getLogger().debug("Lexa: (-"),this.pushState("NODE"),36;case 57:return s.getLogger().debug("Lexa: ))"),this.pushState("NODE"),36;case 58:case 60:case 61:case 62:case 65:return s.getLogger().debug("Lexa: )"),this.pushState("NODE"),36;case 59:return s.getLogger().debug("Lex: ((("),this.pushState("NODE"),36;case 63:return s.getLogger().debug("Lexc: >"),this.pushState("NODE"),36;case 64:return s.getLogger().debug("Lexa: (["),this.pushState("NODE"),36;case 66:case 67:case 68:case 69:case 70:case 71:case 72:return this.pushState("NODE"),36;case 73:return s.getLogger().debug("Lexa: ["),this.pushState("NODE"),36;case 74:return this.pushState("BLOCK_ARROW"),s.getLogger().debug("LEX ARR START"),38;case 75:return s.getLogger().debug("Lex: NODE_ID",i.yytext),32;case 76:return s.getLogger().debug("Lex: EOF",i.yytext),8;case 79:return"NODE_DESCR";case 81:s.getLogger().debug("Lex: Starting string"),this.pushState("string");break;case 82:s.getLogger().debug("LEX ARR: Starting string"),this.pushState("string");break;case 83:return s.getLogger().debug("LEX: NODE_DESCR:",i.yytext),"NODE_DESCR";case 84:s.getLogger().debug("LEX POPPING"),this.popState();break;case 85:s.getLogger().debug("Lex: =>BAE"),this.pushState("ARROW_DIR");break;case 86:return i.yytext=i.yytext.replace(/^,\s*/,""),s.getLogger().debug("Lex (right): dir:",i.yytext),"DIR";case 87:return i.yytext=i.yytext.replace(/^,\s*/,""),s.getLogger().debug("Lex (left):",i.yytext),"DIR";case 88:return i.yytext=i.yytext.replace(/^,\s*/,""),s.getLogger().debug("Lex (x):",i.yytext),"DIR";case 89:return i.yytext=i.yytext.replace(/^,\s*/,""),s.getLogger().debug("Lex (y):",i.yytext),"DIR";case 90:return i.yytext=i.yytext.replace(/^,\s*/,""),s.getLogger().debug("Lex (up):",i.yytext),"DIR";case 91:return i.yytext=i.yytext.replace(/^,\s*/,""),s.getLogger().debug("Lex (down):",i.yytext),"DIR";case 92:return i.yytext="]>",s.getLogger().debug("Lex (ARROW_DIR end):",i.yytext),this.popState(),this.popState(),"BLOCK_ARROW_END";case 93:return s.getLogger().debug("Lex: LINK","#"+i.yytext+"#"),15;case 94:case 95:case 96:return s.getLogger().debug("Lex: LINK",i.yytext),15;case 97:case 98:case 99:return s.getLogger().debug("Lex: START_LINK",i.yytext),this.pushState("LLABEL"),16;case 101:return s.getLogger().debug("Lex: Starting string"),this.pushState("string"),"LINK_LABEL";case 102:return this.popState(),s.getLogger().debug("Lex: LINK","#"+i.yytext+"#"),15;case 103:case 104:return this.popState(),s.getLogger().debug("Lex: LINK",i.yytext),15;case 105:return s.getLogger().debug("Lex: COLON",i.yytext),i.yytext=i.yytext.slice(1),27}},rules:[/^(?:block-beta\b)/,/^(?:block\s+)/,/^(?:block\n+)/,/^(?:block:)/,/^(?:[\s]+)/,/^(?:[\n]+)/,/^(?:((\u000D\u000A)|(\u000A)))/,/^(?:columns\s+auto\b)/,/^(?:columns\s+[\d]+)/,/^(?:["][`])/,/^(?:[^`"]+)/,/^(?:[`]["])/,/^(?:["])/,/^(?:["])/,/^(?:[^"]*)/,/^(?:space[:]\d+)/,/^(?:space\b)/,/^(?:default\b)/,/^(?:linkStyle\b)/,/^(?:interpolate\b)/,/^(?:classDef\s+)/,/^(?:DEFAULT\s+)/,/^(?:\w+\s+)/,/^(?:[^\n]*)/,/^(?:class\s+)/,/^(?:(\w+)+((,\s*\w+)*))/,/^(?:[^\n]*)/,/^(?:style\s+)/,/^(?:(\w+)+((,\s*\w+)*))/,/^(?:[^\n]*)/,/^(?:accTitle\s*:\s*)/,/^(?:(?!\n||)*[^\n]*)/,/^(?:accDescr\s*:\s*)/,/^(?:(?!\n||)*[^\n]*)/,/^(?:accDescr\s*\{\s*)/,/^(?:[\}])/,/^(?:[^\}]*)/,/^(?:end\b\s*)/,/^(?:\(\(\()/,/^(?:\)\)\))/,/^(?:[\)]\))/,/^(?:\}\})/,/^(?:\})/,/^(?:\(-)/,/^(?:-\))/,/^(?:\(\()/,/^(?:\]\])/,/^(?:\()/,/^(?:\]\))/,/^(?:\\\])/,/^(?:\/\])/,/^(?:\)\])/,/^(?:[\)])/,/^(?:\]>)/,/^(?:[\]])/,/^(?:-\))/,/^(?:\(-)/,/^(?:\)\))/,/^(?:\))/,/^(?:\(\(\()/,/^(?:\(\()/,/^(?:\{\{)/,/^(?:\{)/,/^(?:>)/,/^(?:\(\[)/,/^(?:\()/,/^(?:\[\[)/,/^(?:\[\|)/,/^(?:\[\()/,/^(?:\)\)\))/,/^(?:\[\\)/,/^(?:\[\/)/,/^(?:\[\\)/,/^(?:\[)/,/^(?:<\[)/,/^(?:[^\(\[\n\-\)\{\}\s\<\>:]+)/,/^(?:$)/,/^(?:["][`])/,/^(?:["][`])/,/^(?:[^`"]+)/,/^(?:[`]["])/,/^(?:["])/,/^(?:["])/,/^(?:[^"]+)/,/^(?:["])/,/^(?:\]>\s*\()/,/^(?:,?\s*right\s*)/,/^(?:,?\s*left\s*)/,/^(?:,?\s*x\s*)/,/^(?:,?\s*y\s*)/,/^(?:,?\s*up\s*)/,/^(?:,?\s*down\s*)/,/^(?:\)\s*)/,/^(?:\s*[xo<]?--+[-xo>]\s*)/,/^(?:\s*[xo<]?==+[=xo>]\s*)/,/^(?:\s*[xo<]?-?\.+-[xo>]?\s*)/,/^(?:\s*~~[\~]+\s*)/,/^(?:\s*[xo<]?--\s*)/,/^(?:\s*[xo<]?==\s*)/,/^(?:\s*[xo<]?-\.\s*)/,/^(?:["][`])/,/^(?:["])/,/^(?:\s*[xo<]?--+[-xo>]\s*)/,/^(?:\s*[xo<]?==+[=xo>]\s*)/,/^(?:\s*[xo<]?-?\.+-[xo>]?\s*)/,/^(?::\d+)/],conditions:{STYLE_DEFINITION:{rules:[29],inclusive:!1},STYLE_STMNT:{rules:[28],inclusive:!1},CLASSDEFID:{rules:[23],inclusive:!1},CLASSDEF:{rules:[21,22],inclusive:!1},CLASS_STYLE:{rules:[26],inclusive:!1},CLASS:{rules:[25],inclusive:!1},LLABEL:{rules:[100,101,102,103,104],inclusive:!1},ARROW_DIR:{rules:[86,87,88,89,90,91,92],inclusive:!1},BLOCK_ARROW:{rules:[77,82,85],inclusive:!1},NODE:{rules:[38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,78,81],inclusive:!1},md_string:{rules:[10,11,79,80],inclusive:!1},space:{rules:[],inclusive:!1},string:{rules:[13,14,83,84],inclusive:!1},acc_descr_multiline:{rules:[35,36],inclusive:!1},acc_descr:{rules:[33],inclusive:!1},acc_title:{rules:[31],inclusive:!1},INITIAL:{rules:[0,1,2,3,4,5,6,7,8,9,12,15,16,17,18,19,20,24,27,30,32,34,37,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,93,94,95,96,97,98,99,105],inclusive:!0}}}}(),N.prototype=m,m.Parser=N,new N}());ie.parser=ie;const Ie=ie;let T={},re=[],G={};const Ae=(0,f.c)();let H={};const ze=e=>f.e.sanitizeText(e,Ae),Re=function(e,l=""){void 0===H[e]&&(H[e]={id:e,styles:[],textStyles:[]});const a=H[e];l?.split(",").forEach(c=>{const n=c.replace(/([^;]*);/,"$1").trim();if(c.match("color")){const u=n.replace("fill","bgFill").replace("color","fill");a.textStyles.push(u)}a.styles.push(n)})},Be=function(e,l=""){null!=l&&(T[e].styles=l.split(","))},Pe=function(e,l){e.split(",").forEach(function(a){let c=T[a];if(void 0===c){const n=a.trim();T[n]={id:n,type:"na",children:[]},c=T[n]}c.classes||(c.classes=[]),c.classes.push(l)})},ye=(e,l)=>{const a=e.flat(),c=[];for(const n of a)if(n.label&&(n.label=ze(n.label)),"classDef"!==n.type)if("applyClass"!==n.type)if("applyStyles"!==n.type)if("column-setting"===n.type)l.columns=n.columns||-1;else if("edge"===n.type)G[n.id]?G[n.id]++:G[n.id]=1,n.id=G[n.id]+"-"+n.id,re.push(n);else{n.label||(n.label="composite"===n.type?"":n.id);const g=!T[n.id];if(g?T[n.id]=n:("na"!==n.type&&(T[n.id].type=n.type),n.label!==n.id&&(T[n.id].label=n.label)),n.children&&ye(n.children,n),"space"===n.type){const u=n.width||1;for(let p=0;p<u;p++){const _=(0,ee.A)(n);_.id=_.id+"-"+p,T[_.id]=_,c.push(_)}}else g&&c.push(n)}else n?.stylesStr&&Be(n.id,n?.stylesStr);else Pe(n.id,n?.styleClass||"");else Re(n.id,n.css);l.children=c};let ne=[],Z={id:"root",type:"composite",children:[],columns:-1},De=0;const Ue={getConfig:()=>(0,f.F)().block,typeStr2Type:function Fe(e){switch(f.l.debug("typeStr2Type",e),e){case"[]":return"square";case"()":return f.l.debug("we have a round"),"round";case"(())":return"circle";case">]":return"rect_left_inv_arrow";case"{}":return"diamond";case"{{}}":return"hexagon";case"([])":return"stadium";case"[[]]":return"subroutine";case"[()]":return"cylinder";case"((()))":return"doublecircle";case"[//]":return"lean_right";case"[\\\\]":return"lean_left";case"[/\\]":return"trapezoid";case"[\\/]":return"inv_trapezoid";case"<[]>":return"block_arrow";default:return"na"}},edgeTypeStr2Type:function Ke(e){return"=="===(f.l.debug("typeStr2Type",e),e)?"thick":"normal"},edgeStrToEdgeData:function We(e){switch(e.trim()){case"--x":return"arrow_cross";case"--o":return"arrow_circle";default:return"arrow_point"}},getLogger:()=>console,getBlocksFlat:()=>[...Object.values(T)],getBlocks:()=>ne||[],getEdges:()=>re,setHierarchy:e=>{Z.children=e,ye(e,Z),ne=Z.children},getBlock:e=>T[e],setBlock:e=>{T[e.id]=e},getColumns:e=>{const l=T[e];return l?l.columns?l.columns:l.children?l.children.length:-1:-1},getClasses:function(){return H},clear:()=>{f.l.debug("Clear called"),(0,f.v)(),Z={id:"root",type:"composite",children:[],columns:-1},T={root:Z},ne=[],H={},re=[],G={}},generateId:()=>(De++,"id-"+Math.random().toString(36).substr(2,12)+"-"+De)},Q=(e,l)=>{const a=te.A,c=a(e,"r"),n=a(e,"g"),g=a(e,"b");return se.A(c,n,g,l)};function ve(e,l,a=!1){var c,n,g;const u=e;let p="default";((null==(c=u?.classes)?void 0:c.length)||0)>0&&(p=(u?.classes||[]).join(" ")),p+=" flowchart-label";let L,_=0,x="";switch(u.type){case"round":_=5,x="rect";break;case"composite":_=0,x="composite",L=0;break;case"square":case"group":default:x="rect";break;case"diamond":x="question";break;case"hexagon":x="hexagon";break;case"block_arrow":x="block_arrow";break;case"odd":case"rect_left_inv_arrow":x="rect_left_inv_arrow";break;case"lean_right":x="lean_right";break;case"lean_left":x="lean_left";break;case"trapezoid":x="trapezoid";break;case"inv_trapezoid":x="inv_trapezoid";break;case"circle":x="circle";break;case"ellipse":x="ellipse";break;case"stadium":x="stadium";break;case"subroutine":x="subroutine";break;case"cylinder":x="cylinder";break;case"doublecircle":x="doublecircle"}const E=(0,f.k)(u?.styles||[]),k=u.size||{width:0,height:0,x:0,y:0};return{labelStyle:E.labelStyle,shape:x,labelText:u.label,rx:_,ry:_,class:p,style:E.style,id:u.id,directions:u.directions,width:k.width,height:k.height,x:k.x,y:k.y,positioned:a,intersect:void 0,type:u.type,padding:L??((null==(g=null==(n=(0,f.F)())?void 0:n.block)?void 0:g.padding)||0)}}function je(e,l,a){return le.apply(this,arguments)}function le(){return(le=(0,B.A)(function*(e,l,a){const c=ve(l,0,!1);if("group"===c.type)return;const n=yield(0,W.e)(e,c),g=n.node().getBBox(),u=a.getBlock(c.id);u.size={width:g.width,height:g.height,x:0,y:0,node:n},a.setBlock(u),n.remove()})).apply(this,arguments)}function Ve(e,l,a){return ae.apply(this,arguments)}function ae(){return(ae=(0,B.A)(function*(e,l,a){const c=ve(l,0,!0);"space"!==a.getBlock(c.id).type&&(yield(0,W.e)(e,c),l.intersect=c?.intersect,(0,W.p)(c))})).apply(this,arguments)}function oe(e,l,a,c){return ce.apply(this,arguments)}function ce(){return(ce=(0,B.A)(function*(e,l,a,c){for(const n of l)yield c(e,n,a),n.children&&(yield oe(e,n.children,a,c))})).apply(this,arguments)}function ue(){return(ue=(0,B.A)(function*(e,l,a){yield oe(e,l,a,je)})).apply(this,arguments)}function de(){return(de=(0,B.A)(function*(e,l,a){yield oe(e,l,a,Ve)})).apply(this,arguments)}function he(){return(he=(0,B.A)(function*(e,l,a,c,n){const g=new Te.T({multigraph:!0,compound:!0});g.setGraph({rankdir:"TB",nodesep:10,ranksep:10,marginx:8,marginy:8});for(const u of a)u.size&&g.setNode(u.id,{width:u.size.width,height:u.size.height,intersect:u.intersect});for(const u of l)if(u.start&&u.end){const p=c.getBlock(u.start),_=c.getBlock(u.end);if(p?.size&&_?.size){const x=p.size,L=_.size,E=[{x:x.x,y:x.y},{x:x.x+(L.x-x.x)/2,y:x.y+(L.y-x.y)/2},{x:L.x,y:L.y}];yield(0,W.h)(e,{v:u.start,w:u.end,name:u.id},{...u,arrowTypeEnd:u.arrowTypeEnd,arrowTypeStart:u.arrowTypeStart,points:E,classes:"edge-thickness-normal edge-pattern-solid flowchart-link LS-a1 LE-b1"},void 0,"block",g,n),u.label&&(yield(0,W.f)(e,{...u,label:u.label,labelStyle:"stroke: #333; stroke-width: 1.5px;fill:none;",arrowTypeEnd:u.arrowTypeEnd,arrowTypeStart:u.arrowTypeStart,points:E,classes:"edge-thickness-normal edge-pattern-solid flowchart-link LS-a1 LE-b1"}),yield(0,W.j)({...u,x:E[1].x,y:E[1].y},{originalPath:E}))}}})).apply(this,arguments)}const b=(null==(Se=null==(Le=(0,f.c)())?void 0:Le.block)?void 0:Se.padding)||8;function Ze(e,l){if(0===e||!Number.isInteger(e))throw new Error("Columns must be an integer !== 0.");if(l<0||!Number.isInteger(l))throw new Error("Position must be a non-negative integer."+l);return e<0?{px:l,py:0}:1===e?{px:0,py:l}:{px:l%e,py:Math.floor(l/e)}}const Je=e=>{let l=0,a=0;for(const c of e.children){const{width:n,height:g,x:u,y:p}=c.size||{width:0,height:0,x:0,y:0};f.l.debug("getMaxChildSize abc95 child:",c.id,"width:",n,"height:",g,"x:",u,"y:",p,c.type),"space"!==c.type&&(n>l&&(l=n/(e.widthInColumns||1)),g>a&&(a=g))}return{width:l,height:a}};function ge(e,l,a=0,c=0){var n,g,u,p,_,x,L,E,C,k,A;f.l.debug("setBlockSizes abc95 (start)",e.id,null==(n=e?.size)?void 0:n.x,"block width =",e?.size,"sieblingWidth",a),null!=(g=e?.size)&&g.width||(e.size={width:a,height:c,x:0,y:0});let y=0,m=0;if((null==(u=e.children)?void 0:u.length)>0){for(const h of e.children)ge(h,l);const v=Je(e);y=v.width,m=v.height,f.l.debug("setBlockSizes abc95 maxWidth of",e.id,":s children is ",y,m);for(const h of e.children)h.size&&(f.l.debug(`abc95 Setting size of children of ${e.id} id=${h.id} ${y} ${m} ${h.size}`),h.size.width=y*(h.widthInColumns||1)+b*((h.widthInColumns||1)-1),h.size.height=m,h.size.x=0,h.size.y=0,f.l.debug(`abc95 updating size of ${e.id} children child:${h.id} maxWidth:${y} maxHeight:${m}`));for(const h of e.children)ge(h,l,y,m);const N=e.columns||-1;let w=0;for(const h of e.children)w+=h.widthInColumns||1;let o=e.children.length;N>0&&N<w&&(o=N);const s=Math.ceil(w/o);let i=o*(y+b)+b,d=s*(m+b)+b;if(i<a){f.l.debug(`Detected to small siebling: abc95 ${e.id} sieblingWidth ${a} sieblingHeight ${c} width ${i}`),i=a,d=c;const h=(a-o*b-b)/o,t=(c-s*b-b)/s;f.l.debug("Size indata abc88",e.id,"childWidth",h,"maxWidth",y),f.l.debug("Size indata abc88",e.id,"childHeight",t,"maxHeight",m),f.l.debug("Size indata abc88 xSize",o,"padding",b);for(const S of e.children)S.size&&(S.size.width=h,S.size.height=t,S.size.x=0,S.size.y=0)}if(f.l.debug(`abc95 (finale calc) ${e.id} xSize ${o} ySize ${s} columns ${N}${e.children.length} width=${Math.max(i,(null==(p=e.size)?void 0:p.width)||0)}`),i<((null==(_=e?.size)?void 0:_.width)||0)){i=(null==(x=e?.size)?void 0:x.width)||0;const h=N>0?Math.min(e.children.length,N):e.children.length;if(h>0){const t=(i-h*b-b)/h;f.l.debug("abc95 (growing to fit) width",e.id,i,null==(L=e.size)?void 0:L.width,t);for(const S of e.children)S.size&&(S.size.width=t)}}e.size={width:i,height:d,x:0,y:0}}f.l.debug("setBlockSizes abc94 (done)",e.id,null==(E=e?.size)?void 0:E.x,null==(C=e?.size)?void 0:C.width,null==(k=e?.size)?void 0:k.y,null==(A=e?.size)?void 0:A.height)}function we(e,l){var a,c,n,g,u,p,_,x,L,E,C,k,A,y,m,v,N;f.l.debug(`abc85 layout blocks (=>layoutBlocks) ${e.id} x: ${null==(a=e?.size)?void 0:a.x} y: ${null==(c=e?.size)?void 0:c.y} width: ${null==(n=e?.size)?void 0:n.width}`);const w=e.columns||-1;if(f.l.debug("layoutBlocks columns abc95",e.id,"=>",w,e),e.children&&e.children.length>0){const o=(null==(u=null==(g=e?.children[0])?void 0:g.size)?void 0:u.width)||0;f.l.debug("widthOfChildren 88",e.children.length*o+(e.children.length-1)*b,"posX");let i=0;f.l.debug("abc91 block?.size?.x",e.id,null==(p=e?.size)?void 0:p.x);let d=null!=(_=e?.size)&&_.x?(null==(x=e?.size)?void 0:x.x)+(-(null==(L=e?.size)?void 0:L.width)/2||0):-b,h=0;for(const t of e.children){const S=e;if(!t.size)continue;const{width:r,height:P}=t.size,{px:V,py:K}=Ze(w,i);if(K!=h&&(h=K,d=null!=(E=e?.size)&&E.x?(null==(C=e?.size)?void 0:C.x)+(-(null==(k=e?.size)?void 0:k.width)/2||0):-b,f.l.debug("New row in layout for block",e.id," and child ",t.id,h)),f.l.debug(`abc89 layout blocks (child) id: ${t.id} Pos: ${i} (px, py) ${V},${K} (${null==(A=S?.size)?void 0:A.x},${null==(y=S?.size)?void 0:y.y}) parent: ${S.id} width: ${r}${b}`),S.size){const R=r/2;t.size.x=d+b+R,f.l.debug(`abc91 layout blocks (calc) px, pyid:${t.id} startingPos=X${d} new startingPosX${t.size.x} ${R} padding=${b} width=${r} halfWidth=${R} => x:${t.size.x} y:${t.size.y} ${t.widthInColumns} (width * (child?.w || 1)) / 2 ${r*(t?.widthInColumns||1)/2}`),d=t.size.x+R,t.size.y=S.size.y-S.size.height/2+K*(P+b)+P/2+b,f.l.debug(`abc88 layout blocks (calc) px, pyid:${t.id}startingPosX${d}${b}${R}=>x:${t.size.x}y:${t.size.y}${t.widthInColumns}(width * (child?.w || 1)) / 2${r*(t?.widthInColumns||1)/2}`)}t.children&&we(t),i+=t?.widthInColumns||1,f.l.debug("abc88 columnsPos",t,i)}}f.l.debug(`layout blocks (<==layoutBlocks) ${e.id} x: ${null==(m=e?.size)?void 0:m.x} y: ${null==(v=e?.size)?void 0:v.y} width: ${null==(N=e?.size)?void 0:N.width}`)}function Oe(e,{minX:l,minY:a,maxX:c,maxY:n}={minX:0,minY:0,maxX:0,maxY:0}){if(e.size&&"root"!==e.id){const{x:g,y:u,width:p,height:_}=e.size;g-p/2<l&&(l=g-p/2),u-_/2<a&&(a=u-_/2),g+p/2>c&&(c=g+p/2),u+_/2>n&&(n=u+_/2)}if(e.children)for(const g of e.children)({minX:l,minY:a,maxX:c,maxY:n}=Oe(g,{minX:l,minY:a,maxX:c,maxY:n}));return{minX:l,minY:a,maxX:c,maxY:n}}function Qe(e){const l=e.getBlock("root");if(!l)return;ge(l,e,0,0),we(l),f.l.debug("getBlocks",JSON.stringify(l,null,2));const{minX:a,minY:c,maxX:n,maxY:g}=Oe(l);return{x:a,y:c,width:n-a,height:g-c}}const qe={parser:Ie,db:Ue,renderer:{draw:function(){var e=(0,B.A)(function*(l,a,c,n){const{securityLevel:g,block:u}=(0,f.F)(),p=n.db;let _;"sandbox"===g&&(_=(0,j.Ltv)("#i"+a));const x=(0,j.Ltv)("sandbox"===g?_.nodes()[0].contentDocument.body:"body"),L="sandbox"===g?x.select(`[id="${a}"]`):(0,j.Ltv)(`[id="${a}"]`);(0,W.a)(L,["point","circle","cross"],n.type,a);const C=p.getBlocks(),k=p.getBlocksFlat(),A=p.getEdges(),y=L.insert("g").attr("class","block");yield function Xe(e,l,a){return ue.apply(this,arguments)}(y,C,p);const m=Qe(p);if(yield function Ge(e,l,a){return de.apply(this,arguments)}(y,C,p),yield function He(e,l,a,c,n){return he.apply(this,arguments)}(y,A,k,p,a),m){const v=m,N=Math.max(1,Math.round(v.width/v.height*.125)),w=v.height+N+10,o=v.width+10,{useMaxWidth:s}=u;(0,f.i)(L,w,o,!!s),f.l.debug("Here Bounds",m,v),L.attr("viewBox",`${v.x-5} ${v.y-5} ${v.width+10} ${v.height+10}`)}(0,j.UMr)(j.zt)});return function(a,c,n,g){return e.apply(this,arguments)}}(),getClasses:function(e,l){return l.db.getClasses()}},styles:e=>`.label {\n    font-family: ${e.fontFamily};\n    color: ${e.nodeTextColor||e.textColor};\n  }\n  .cluster-label text {\n    fill: ${e.titleColor};\n  }\n  .cluster-label span,p {\n    color: ${e.titleColor};\n  }\n\n\n\n  .label text,span,p {\n    fill: ${e.nodeTextColor||e.textColor};\n    color: ${e.nodeTextColor||e.textColor};\n  }\n\n  .node rect,\n  .node circle,\n  .node ellipse,\n  .node polygon,\n  .node path {\n    fill: ${e.mainBkg};\n    stroke: ${e.nodeBorder};\n    stroke-width: 1px;\n  }\n  .flowchart-label text {\n    text-anchor: middle;\n  }\n  // .flowchart-label .text-outer-tspan {\n  //   text-anchor: middle;\n  // }\n  // .flowchart-label .text-inner-tspan {\n  //   text-anchor: start;\n  // }\n\n  .node .label {\n    text-align: center;\n  }\n  .node.clickable {\n    cursor: pointer;\n  }\n\n  .arrowheadPath {\n    fill: ${e.arrowheadColor};\n  }\n\n  .edgePath .path {\n    stroke: ${e.lineColor};\n    stroke-width: 2.0px;\n  }\n\n  .flowchart-link {\n    stroke: ${e.lineColor};\n    fill: none;\n  }\n\n  .edgeLabel {\n    background-color: ${e.edgeLabelBackground};\n    rect {\n      opacity: 0.5;\n      background-color: ${e.edgeLabelBackground};\n      fill: ${e.edgeLabelBackground};\n    }\n    text-align: center;\n  }\n\n  /* For html labels only */\n  .labelBkg {\n    background-color: ${Q(e.edgeLabelBackground,.5)};\n    // background-color:\n  }\n\n  .node .cluster {\n    // fill: ${Q(e.mainBkg,.5)};\n    fill: ${Q(e.clusterBkg,.5)};\n    stroke: ${Q(e.clusterBorder,.2)};\n    box-shadow: rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px;\n    stroke-width: 1px;\n  }\n\n  .cluster text {\n    fill: ${e.titleColor};\n  }\n\n  .cluster span,p {\n    color: ${e.titleColor};\n  }\n  /* .cluster div {\n    color: ${e.titleColor};\n  } */\n\n  div.mermaidTooltip {\n    position: absolute;\n    text-align: center;\n    max-width: 200px;\n    padding: 2px;\n    font-family: ${e.fontFamily};\n    font-size: 12px;\n    background: ${e.tertiaryColor};\n    border: 1px solid ${e.border2};\n    border-radius: 2px;\n    pointer-events: none;\n    z-index: 100;\n  }\n\n  .flowchartTitleText {\n    text-anchor: middle;\n    font-size: 18px;\n    fill: ${e.textColor};\n  }\n`}}}]);