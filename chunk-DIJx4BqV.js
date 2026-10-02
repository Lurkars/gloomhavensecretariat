import"./chunk-K_VmmcvY.js";import{n as o}from"./chunk-Cvof6wl4.js";import{t}from"./chunk-Bb2aY00R.js";import{$ as ze,R as ct,d as Ic,t as $c}from"./chunk-DJIDcOYr.js";import{C as Oa,I as Xs,K as qa,M as Ue,Q as wa,h as Ia,i as Da,it as za,v as La,y as Ma}from"./chunk-DWcRaI3j.js";import{j as l}from"./chunk-Dk7BjnyG.js";import"./chunk-u96V2zCG.js";import{b as yr,d as ft}from"./chunk-CIbqHFMn.js";import{a}from"./chunk-DD8I-1H2.js";var lt=Xs.pie;var L={sections:new Map,showData:!1,config:lt};var b=L.sections;var O=L.showData;var St=structuredClone(lt);var xt=o(()=>structuredClone(St),`getConfig`);var wt=o(()=>{b=new Map,O=L.showData,wa()},`clear`);var Ct=o(({label:t,value:a})=>{if(a<0)throw new Error(`"${t}" has invalid value: ${a}. Negative values are not allowed in pie charts. All slice values must be >= 0.`);b.has(t)||(b.set(t,a),ct.debug(`added new section: ${t}, with value: ${a}`))},`addSection`);var $t=o(()=>b,`getSections`);var Dt=o(t=>{O=t},`setShowData`);var yt=o(()=>O,`getShowData`);var st={getConfig:xt,clear:wt,setDiagramTitle:Da,getDiagramTitle:za,setAccTitle:Oa,getAccTitle:qa,setAccDescription:Ma,getAccDescription:Ia,addSection:Ct,getSections:$t,setShowData:Dt,getShowData:yt};var Tt=o((t$1,a)=>{t(t$1,a),a.setShowData(t$1.showData),t$1.sections.map(a.addSection)},`populateDb`);var bt={parse:o(async t=>{let a=await l(`pie`,t);ct.debug(a),Tt(a,st)},`parse`)};var kt=o(t=>`
  .pieCircle{
    stroke: ${t.pieStrokeColor};
    stroke-width : ${t.pieStrokeWidth};
    opacity : ${t.pieOpacity};
  }
  .pieCircle.highlighted{
    scale: 1.05;
    opacity: 1;
  }
  .pieCircle.highlightedOnHover:hover{
    transition-duration: 250ms;
    scale: 1.05;
    opacity: 1;
  }
  .pieOuterCircle{
    stroke: ${t.pieOuterStrokeColor};
    stroke-width: ${t.pieOuterStrokeWidth};
    fill: none;
  }
  .pieTitleText {
    text-anchor: middle;
    font-size: ${t.pieTitleTextSize};
    fill: ${t.pieTitleTextColor};
    font-family: ${t.fontFamily};
  }
  .slice {
    font-family: ${t.fontFamily};
    fill: ${t.pieSectionTextColor};
    font-size:${t.pieSectionTextSize};
    // fill: white;
  }
  .legend text {
    fill: ${t.pieLegendTextColor};
    font-family: ${t.fontFamily};
    font-size: ${t.pieLegendTextSize};
  }
`,`getStyles`);var _t=o(t=>{let a=[...t.values()].reduce((n,m)=>n+m,0),W=[...t.entries()].map(([n,m])=>({label:n,value:m})).filter(n=>n.value/a*100>=1);return Ic().value(n=>n.value).sort(null)(W)},`createPieArcs`);var Bt={parser:bt,db:st,renderer:{draw:o((t,a$1,W,F)=>{ct.debug(`rendering pie chart
`+t);let n=F.db,m=Ue(),h=ft(n.getConfig(),m.pie),H=40,i=18,c=4,S=450,x=S,A=a(a$1),$=A.append(`g`);$.attr(`transform`,`translate(225,225)`);let{themeVariables:o}=m,[M]=yr(o.pieOuterStrokeWidth);M??=2;let ct$1=h.legendPosition,P=h.textPosition,dt=h.donutHole>0&&h.donutHole<=.9?h.donutHole:0,f=Math.min(x,S)/2-H,gt=$c().innerRadius(dt*f).outerRadius(f),pt=$c().innerRadius(f*P).outerRadius(f*P),w=$.append(`g`);w.append(`circle`).attr(`cx`,0).attr(`cy`,0).attr(`r`,f+M/2).attr(`class`,`pieOuterCircle`);let D=n.getSections(),ht=_t(D),ft$1=[o.pie1,o.pie2,o.pie3,o.pie4,o.pie5,o.pie6,o.pie7,o.pie8,o.pie9,o.pie10,o.pie11,o.pie12],k=0;D.forEach(e=>{k+=e});let G=ht.filter(e=>(e.data.value/k*100).toFixed(0)!==`0`),_=ze(ft$1).domain([...D.keys()]);w.selectAll(`mySlices`).data(G).enter().append(`path`).attr(`d`,gt).attr(`fill`,e=>_(e.data.label)).attr(`class`,e=>{let r=`pieCircle`;return h.highlightSlice===`hover`?r+=` highlightedOnHover`:h.highlightSlice===e.data.label&&(r+=` highlighted`),r}),w.selectAll(`mySlices`).data(G).enter().append(`text`).text(e=>(e.data.value/k*100).toFixed(0)+`%`).attr(`transform`,e=>`translate(`+pt.centroid(e)+`)`).style(`text-anchor`,`middle`).attr(`class`,`slice`);let ut=$.append(`text`).text(n.getDiagramTitle()).attr(`x`,0).attr(`y`,-200).attr(`class`,`pieTitleText`),C=[...D.entries()].map(([e,r])=>({label:e,value:r})),u=$.selectAll(`.legend`).data(C).enter().append(`g`).attr(`class`,`legend`);u.append(`rect`).attr(`width`,i).attr(`height`,i).style(`fill`,e=>_(e.label)).style(`stroke`,e=>_(e.label)),u.append(`text`).attr(`x`,22).attr(`y`,14).text(e=>n.getShowData()?`${e.label} [${e.value}]`:e.label);let v=Math.max(...u.selectAll(`text`).nodes().map(e=>e?.getBoundingClientRect().width??0)),y=S,z=490,s=22,E=C.length*s;switch(ct$1){case`center`:u.attr(`transform`,(e,r)=>{let d=s*C.length/2,g=-v/2-22,p=r*s-d;return`translate(`+g+`,`+p+`)`});break;case`top`:y+=E,u.attr(`transform`,(e,r)=>{let d=f;return`translate(${-v/2-22}, ${r*s-d})`}),w.attr(`transform`,()=>`translate(0, ${E+s})`);break;case`bottom`:y+=E,u.attr(`transform`,(e,r)=>{let d=-207,g=-v/2-22,p=r*s-d;return`translate(`+g+`,`+p+`)`});break;case`left`:z+=22+v,u.attr(`transform`,(e,r)=>{let d=s*C.length/2;return`translate(-207,`+(r*s-d)+`)`}),w.attr(`transform`,()=>`translate(${v+i+c}, 0)`);break;default:z+=22+v,u.attr(`transform`,(e,r)=>{let d=s*C.length/2;return`translate(216,`+(r*s-d)+`)`})}let B=ut.node()?.getBoundingClientRect().width??0,mt=x/2-B/2,vt=x/2+B/2,N=Math.min(0,mt),I=Math.max(z,vt)-N;A.attr(`viewBox`,`${N} 0 ${I} ${y}`),La(A,y,I,h.useMaxWidth)},`draw`)},styles:kt};export{Bt as diagram};
//# debugId=619ad93a-6142-55be-9e2f-cbfa822c03a1
//# sourceMappingURL=chunk-DIJx4BqV.js.map