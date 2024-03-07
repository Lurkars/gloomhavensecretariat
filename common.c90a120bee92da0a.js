"use strict";(self.webpackChunkgloomhavensecretariat=self.webpackChunkgloomhavensecretariat||[]).push([[312],{4656:(W,B,c)=>{c.d(B,{m:()=>A});var v=c(9488);function A(g,l){var S=g.append("foreignObject").attr("width","100000"),h=S.append("xhtml:div");h.attr("xmlns","http://www.w3.org/1999/xhtml");var L=l.label;switch(typeof L){case"function":h.insert(L);break;case"object":h.insert(function(){return L});break;default:h.html(L)}v.Ce(h,l.labelStyle),h.style("display","inline-block"),h.style("white-space","nowrap");var I=h.node().getBoundingClientRect();return S.attr("width",I.width).attr("height",I.height),S}},9488:(W,B,c)=>{c.d(B,{Ce:()=>L,S_:()=>I,cv:()=>g,q2:()=>$,q_:()=>l});var v=c(1972),A=c(5088);function g(n,e){return!!n.children(e).length}function l(n){return h(n.v)+":"+h(n.w)+":"+h(n.name)}var S=/:/g;function h(n){return n?String(n).replace(S,"\\:"):""}function L(n,e){e&&n.attr("style",e)}function I(n,e,o){e&&n.attr("class",e).attr("class",o+" "+n.attr("class"))}function $(n,e){var o=e.graph();if(v.c(o)){var p=o.transition;if(A.c(p))return p(n)}return n}},9740:(W,B,c)=>{c.d(B,{c:()=>l});var v=c(6032),A=c(6172);const l=(S,h)=>v.c.lang.round(A.c.parse(S)[h])},1515:(W,B,c)=>{c.d(B,{a:()=>H,f:()=>U});var v=c(1528),A=c(9944),g=c(8335),l=c(6734),S=c(7128),h=c(4656),L=c(9740),I=c(8728);const $={},e=function(){var r=(0,v.c)(function*(f,_,D,b,u,x){const k=b.select(`[id="${D}"]`),i=Object.keys(f);for(const y of i){const a=f[y];let M="default";a.classes.length>0&&(M=a.classes.join(" ")),M+=" flowchart-label";const E=(0,l.k)(a.styles);let d,t=void 0!==a.text?a.text:a.id;if(l.l.info("vertex",a,a.labelType),"markdown"===a.labelType)l.l.info("vertex",a,a.labelType);else if((0,l.m)((0,l.c)().flowchart.htmlLabels))d=(0,h.m)(k,{label:t}).node(),d.parentNode.removeChild(d);else{const P=u.createElementNS("http://www.w3.org/2000/svg","text");P.setAttribute("style",E.labelStyle.replace("color:","fill:"));const j=t.split(l.e.lineBreakRegex);for(const z of j){const N=u.createElementNS("http://www.w3.org/2000/svg","tspan");N.setAttributeNS("http://www.w3.org/XML/1998/namespace","xml:space","preserve"),N.setAttribute("dy","1em"),N.setAttribute("x","1"),N.textContent=z,P.appendChild(N)}d=P}let w=0,s="";switch(a.type){case"round":w=5,s="rect";break;case"square":case"group":default:s="rect";break;case"diamond":s="question";break;case"hexagon":s="hexagon";break;case"odd":case"odd_right":s="rect_left_inv_arrow";break;case"lean_right":s="lean_right";break;case"lean_left":s="lean_left";break;case"trapezoid":s="trapezoid";break;case"inv_trapezoid":s="inv_trapezoid";break;case"circle":s="circle";break;case"ellipse":s="ellipse";break;case"stadium":s="stadium";break;case"subroutine":s="subroutine";break;case"cylinder":s="cylinder";break;case"doublecircle":s="doublecircle"}const K=yield(0,l.r)(t,(0,l.c)());_.setNode(a.id,{labelStyle:E.labelStyle,shape:s,labelText:K,labelType:a.labelType,rx:w,ry:w,class:M,style:E.style,id:a.id,link:a.link,linkTarget:a.linkTarget,tooltip:x.db.getTooltip(a.id)||"",domId:x.db.lookUpDomId(a.id),haveCallback:a.haveCallback,width:"group"===a.type?500:void 0,dir:a.dir,type:a.type,props:a.props,padding:(0,l.c)().flowchart.padding}),l.l.info("setNode",{labelStyle:E.labelStyle,labelType:a.labelType,shape:s,labelText:K,rx:w,ry:w,class:M,style:E.style,id:a.id,domId:x.db.lookUpDomId(a.id),width:"group"===a.type?500:void 0,type:a.type,dir:a.dir,props:a.props,padding:(0,l.c)().flowchart.padding})}});return function(_,D,b,u,x,k){return r.apply(this,arguments)}}(),o=function(){var r=(0,v.c)(function*(f,_,D){l.l.info("abc78 edges = ",f);let x,k,b=0,u={};if(void 0!==f.defaultStyle){const i=(0,l.k)(f.defaultStyle);x=i.style,k=i.labelStyle}for(const i of f){b++;const y="L-"+i.start+"-"+i.end;void 0===u[y]?(u[y]=0,l.l.info("abc78 new entry",y,u[y])):(u[y]++,l.l.info("abc78 new entry",y,u[y]));let a=y+"-"+u[y];l.l.info("abc78 new link id to be used is",y,a,u[y]);const M="LS-"+i.start,E="LE-"+i.end,t={style:"",labelStyle:""};switch(t.minlen=i.length||1,t.arrowhead="arrow_open"===i.type?"none":"normal",t.arrowTypeStart="arrow_open",t.arrowTypeEnd="arrow_open",i.type){case"double_arrow_cross":t.arrowTypeStart="arrow_cross";case"arrow_cross":t.arrowTypeEnd="arrow_cross";break;case"double_arrow_point":t.arrowTypeStart="arrow_point";case"arrow_point":t.arrowTypeEnd="arrow_point";break;case"double_arrow_circle":t.arrowTypeStart="arrow_circle";case"arrow_circle":t.arrowTypeEnd="arrow_circle"}let d="",w="";switch(i.stroke){case"normal":d="fill:none;",void 0!==x&&(d=x),void 0!==k&&(w=k),t.thickness="normal",t.pattern="solid";break;case"dotted":t.thickness="normal",t.pattern="dotted",t.style="fill:none;stroke-width:2px;stroke-dasharray:3;";break;case"thick":t.thickness="thick",t.pattern="solid",t.style="stroke-width: 3.5px;fill:none;";break;case"invisible":t.thickness="invisible",t.pattern="solid",t.style="stroke-width: 0;fill:none;"}if(void 0!==i.style){const s=(0,l.k)(i.style);d=s.style,w=s.labelStyle}t.style=t.style+=d,t.labelStyle=t.labelStyle+=w,t.curve=(0,l.n)(void 0!==i.interpolate?i.interpolate:void 0!==f.defaultInterpolate?f.defaultInterpolate:$.curve,g.qGi),void 0===i.text?void 0!==i.style&&(t.arrowheadStyle="fill: #333"):(t.arrowheadStyle="fill: #333",t.labelpos="c"),t.labelType=i.labelType,t.label=yield(0,l.r)(i.text.replace(l.e.lineBreakRegex,"\n"),(0,l.c)()),void 0===i.style&&(t.style=t.style||"stroke: #333; stroke-width: 1.5px;fill:none;"),t.labelStyle=t.labelStyle.replace("color:","fill:"),t.id=a,t.classes="flowchart-link "+M+" "+E,_.setEdge(i.start,i.end,t,b)}});return function(_,D,b){return r.apply(this,arguments)}}(),U={setConf:function(r){const f=Object.keys(r);for(const _ of f)$[_]=r[_]},addVertices:e,addEdges:o,getClasses:function(r,f){return f.db.getClasses()},draw:function(){var r=(0,v.c)(function*(f,_,D,b){l.l.info("Drawing flowchart");let u=b.db.getDirection();void 0===u&&(u="TD");const{securityLevel:x,flowchart:k}=(0,l.c)(),i=k.nodeSpacing||50,y=k.rankSpacing||50;let a;"sandbox"===x&&(a=(0,g.MlD)("#i"+_));const M=(0,g.MlD)("sandbox"===x?a.nodes()[0].contentDocument.body:"body"),E="sandbox"===x?a.nodes()[0].contentDocument:document,t=new A.M({multigraph:!0,compound:!0}).setGraph({rankdir:u,nodesep:i,ranksep:y,marginx:0,marginy:0}).setDefaultEdgeLabel(function(){return{}});let d;const w=b.db.getSubGraphs();l.l.info("Subgraphs - ",w);for(let m=w.length-1;m>=0;m--)d=w[m],l.l.info("Subgraph - ",d),b.db.addVertex(d.id,{text:d.title,type:d.labelType},"group",void 0,d.classes,d.dir);const s=b.db.getVertices(),K=b.db.getEdges();l.l.info("Edges",K);let P=0;for(P=w.length-1;P>=0;P--){d=w[P],(0,g.COP)("cluster").append("text");for(let m=0;m<d.nodes.length;m++)l.l.info("Setting up subgraphs",d.nodes[m],d.id),t.setParent(d.nodes[m],d.id)}yield e(s,t,_,M,E,b),yield o(K,t);const j=M.select(`[id="${_}"]`),z=M.select("#"+_+" g");if(yield(0,S.r)(z,t,["point","circle","cross"],"flowchart",_),l.u.insertTitle(j,"flowchartTitleText",k.titleTopMargin,b.db.getDiagramTitle()),(0,l.o)(t,j,k.diagramPadding,k.useMaxWidth),b.db.indexNodes("subGraph"+P),!k.htmlLabels){const m=E.querySelectorAll('[id="'+_+'"] .edgeLabel .label');for(const O of m){const R=O.getBBox(),T=E.createElementNS("http://www.w3.org/2000/svg","rect");T.setAttribute("rx",0),T.setAttribute("ry",0),T.setAttribute("width",R.width),T.setAttribute("height",R.height),O.insertBefore(T,O.firstChild)}}Object.keys(s).forEach(function(m){const O=s[m];if(O.link){const R=(0,g.MlD)("#"+_+' [id="'+m+'"]');if(R){const T=E.createElementNS("http://www.w3.org/2000/svg","a");T.setAttributeNS("http://www.w3.org/2000/svg","class",O.classes.join(" ")),T.setAttributeNS("http://www.w3.org/2000/svg","href",O.link),T.setAttributeNS("http://www.w3.org/2000/svg","rel","noopener"),"sandbox"===x?T.setAttributeNS("http://www.w3.org/2000/svg","target","_top"):O.linkTarget&&T.setAttributeNS("http://www.w3.org/2000/svg","target",O.linkTarget);const G=R.insert(function(){return T},":first-child"),V=R.select(".label-container");V&&G.append(function(){return V.node()});const F=R.select(".label");F&&G.append(function(){return F.node()})}}})});return function(_,D,b,u){return r.apply(this,arguments)}}()},H=r=>`.label {\n    font-family: ${r.fontFamily};\n    color: ${r.nodeTextColor||r.textColor};\n  }\n  .cluster-label text {\n    fill: ${r.titleColor};\n  }\n  .cluster-label span,p {\n    color: ${r.titleColor};\n  }\n\n  .label text,span,p {\n    fill: ${r.nodeTextColor||r.textColor};\n    color: ${r.nodeTextColor||r.textColor};\n  }\n\n  .node rect,\n  .node circle,\n  .node ellipse,\n  .node polygon,\n  .node path {\n    fill: ${r.mainBkg};\n    stroke: ${r.nodeBorder};\n    stroke-width: 1px;\n  }\n  .flowchart-label text {\n    text-anchor: middle;\n  }\n  // .flowchart-label .text-outer-tspan {\n  //   text-anchor: middle;\n  // }\n  // .flowchart-label .text-inner-tspan {\n  //   text-anchor: start;\n  // }\n\n  .node .katex path {\n    fill: #000;\n    stroke: #000;\n    stroke-width: 1px;\n  }\n\n  .node .label {\n    text-align: center;\n  }\n  .node.clickable {\n    cursor: pointer;\n  }\n\n  .arrowheadPath {\n    fill: ${r.arrowheadColor};\n  }\n\n  .edgePath .path {\n    stroke: ${r.lineColor};\n    stroke-width: 2.0px;\n  }\n\n  .flowchart-link {\n    stroke: ${r.lineColor};\n    fill: none;\n  }\n\n  .edgeLabel {\n    background-color: ${r.edgeLabelBackground};\n    rect {\n      opacity: 0.5;\n      background-color: ${r.edgeLabelBackground};\n      fill: ${r.edgeLabelBackground};\n    }\n    text-align: center;\n  }\n\n  /* For html labels only */\n  .labelBkg {\n    background-color: ${((r,f)=>{const _=L.c,D=_(r,"r"),b=_(r,"g"),u=_(r,"b");return I.c(D,b,u,.5)})(r.edgeLabelBackground)};\n    // background-color: \n  }\n\n  .cluster rect {\n    fill: ${r.clusterBkg};\n    stroke: ${r.clusterBorder};\n    stroke-width: 1px;\n  }\n\n  .cluster text {\n    fill: ${r.titleColor};\n  }\n\n  .cluster span,p {\n    color: ${r.titleColor};\n  }\n  /* .cluster div {\n    color: ${r.titleColor};\n  } */\n\n  div.mermaidTooltip {\n    position: absolute;\n    text-align: center;\n    max-width: 200px;\n    padding: 2px;\n    font-family: ${r.fontFamily};\n    font-size: 12px;\n    background: ${r.tertiaryColor};\n    border: 1px solid ${r.border2};\n    border-radius: 2px;\n    pointer-events: none;\n    z-index: 100;\n  }\n\n  .flowchartTitleText {\n    text-anchor: middle;\n    font-size: 18px;\n    fill: ${r.textColor};\n  }\n`},4380:(W,B,c)=>{c.d(B,{a:()=>l,b:()=>L,c:()=>h,d:()=>g,e:()=>$,f:()=>S,g:()=>I});var v=c(8320),A=c(6734);const g=(n,e)=>{const o=n.append("rect");if(o.attr("x",e.x),o.attr("y",e.y),o.attr("fill",e.fill),o.attr("stroke",e.stroke),o.attr("width",e.width),o.attr("height",e.height),e.name&&o.attr("name",e.name),void 0!==e.rx&&o.attr("rx",e.rx),void 0!==e.ry&&o.attr("ry",e.ry),void 0!==e.attrs)for(const p in e.attrs)o.attr(p,e.attrs[p]);return void 0!==e.class&&o.attr("class",e.class),o},l=(n,e)=>{g(n,{x:e.startx,y:e.starty,width:e.stopx-e.startx,height:e.stopy-e.starty,fill:e.fill,stroke:e.stroke,class:"rect"}).lower()},S=(n,e)=>{const o=e.text.replace(A.J," "),p=n.append("text");p.attr("x",e.x),p.attr("y",e.y),p.attr("class","legend"),p.style("text-anchor",e.anchor),void 0!==e.class&&p.attr("class",e.class);const C=p.append("tspan");return C.attr("x",e.x+2*e.textMargin),C.text(o),p},h=(n,e,o,p)=>{const C=n.append("image");C.attr("x",e),C.attr("y",o);const U=(0,v.oR)(p);C.attr("xlink:href",U)},L=(n,e,o,p)=>{const C=n.append("use");C.attr("x",e),C.attr("y",o);const U=(0,v.oR)(p);C.attr("xlink:href",`#${U}`)},I=()=>({x:0,y:0,width:100,height:100,fill:"#EDF2AE",stroke:"#666",anchor:"start",rx:0,ry:0}),$=()=>({x:0,y:0,width:100,height:100,"text-anchor":"start",style:"#666",textMargin:0,rx:0,ry:0,tspan:!0})}}]);