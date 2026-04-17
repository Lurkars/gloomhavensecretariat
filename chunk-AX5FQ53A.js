import{a as K}from"./chunk-4ECH7BDT.js";import{a as Q}from"./chunk-UOZDHVTF.js";import{a as q}from"./chunk-X3HKXJ5T.js";import"./chunk-U5YNTIBG.js";import"./chunk-E3MW4ZS5.js";import"./chunk-WGQIS2GU.js";import"./chunk-XPOLWZ2L.js";import"./chunk-FPCU2XC3.js";import"./chunk-STUBMBQW.js";import"./chunk-ICELCOMI.js";import"./chunk-LSFRTEQV.js";import{B as H,C as J}from"./chunk-AUDRRJ56.js";import"./chunk-D4B4ZRQX.js";import{N as L,R as O,S as B,T as P,U as I,V as N,W as U,X as V,Y as X,r as G}from"./chunk-ORA2FAQF.js";import{H as C,K as j,b as o,d as h,o as Z}from"./chunk-OY37CIRE.js";import"./chunk-5QXQDGL2.js";import"./chunk-P42XP72C.js";import"./chunk-2WMPOZY3.js";import"./chunk-NLZZ4QX6.js";import"./chunk-2W7K7RE3.js";import"./chunk-G4U3VSE2.js";var Y=G.pie,D={sections:new Map,showData:!1,config:Y},u=D.sections,y=D.showData,fe=structuredClone(Y),he=o(()=>structuredClone(fe),"getConfig"),ue=o(()=>{u=new Map,y=D.showData,O()},"clear"),me=o(({label:e,value:a})=>{if(a<0)throw new Error(`"${e}" has invalid value: ${a}. Negative values are not allowed in pie charts. All slice values must be >= 0.`);u.has(e)||(u.set(e,a),h.debug(`added new section: ${e}, with value: ${a}`))},"addSection"),ve=o(()=>u,"getSections"),xe=o(e=>{y=e},"setShowData"),Se=o(()=>y,"getShowData"),ee={getConfig:he,clear:ue,setDiagramTitle:U,getDiagramTitle:V,setAccTitle:B,getAccTitle:P,setAccDescription:I,getAccDescription:N,addSection:me,getSections:ve,setShowData:xe,getShowData:Se},we=o((e,a)=>{K(e,a),a.setShowData(e.showData),e.sections.map(a.addSection)},"populateDb"),Ce={parse:o(async e=>{let a=await Q("pie",e);h.debug(a),we(a,ee)},"parse")},De=o(e=>`
  .pieCircle{
    stroke: ${e.pieStrokeColor};
    stroke-width : ${e.pieStrokeWidth};
    opacity : ${e.pieOpacity};
  }
  .pieOuterCircle{
    stroke: ${e.pieOuterStrokeColor};
    stroke-width: ${e.pieOuterStrokeWidth};
    fill: none;
  }
  .pieTitleText {
    text-anchor: middle;
    font-size: ${e.pieTitleTextSize};
    fill: ${e.pieTitleTextColor};
    font-family: ${e.fontFamily};
  }
  .slice {
    font-family: ${e.fontFamily};
    fill: ${e.pieSectionTextColor};
    font-size:${e.pieSectionTextSize};
    // fill: white;
  }
  .legend text {
    fill: ${e.pieLegendTextColor};
    font-family: ${e.fontFamily};
    font-size: ${e.pieLegendTextSize};
  }
`,"getStyles"),ye=De,$e=o(e=>{let a=[...e.values()].reduce((r,l)=>r+l,0),$=[...e.entries()].map(([r,l])=>({label:r,value:l})).filter(r=>r.value/a*100>=1);return j().value(r=>r.value).sort(null)($)},"createPieArcs"),Te=o((e,a,$,T)=>{h.debug(`rendering pie chart
`+e);let r=T.db,l=X(),A=J(r.getConfig(),l.pie),b=40,n=18,p=4,s=450,d=s,m=q(a),c=m.append("g");c.attr("transform","translate("+d/2+","+s/2+")");let{themeVariables:i}=l,[E]=H(i.pieOuterStrokeWidth);E??=2;let _=A.textPosition,g=Math.min(d,s)/2-b,te=C().innerRadius(0).outerRadius(g),ae=C().innerRadius(g*_).outerRadius(g*_);c.append("circle").attr("cx",0).attr("cy",0).attr("r",g+E/2).attr("class","pieOuterCircle");let f=r.getSections(),ie=$e(f),re=[i.pie1,i.pie2,i.pie3,i.pie4,i.pie5,i.pie6,i.pie7,i.pie8,i.pie9,i.pie10,i.pie11,i.pie12],v=0;f.forEach(t=>{v+=t});let k=ie.filter(t=>(t.data.value/v*100).toFixed(0)!=="0"),x=Z(re).domain([...f.keys()]);c.selectAll("mySlices").data(k).enter().append("path").attr("d",te).attr("fill",t=>x(t.data.label)).attr("class","pieCircle"),c.selectAll("mySlices").data(k).enter().append("text").text(t=>(t.data.value/v*100).toFixed(0)+"%").attr("transform",t=>"translate("+ae.centroid(t)+")").style("text-anchor","middle").attr("class","slice");let oe=c.append("text").text(r.getDiagramTitle()).attr("x",0).attr("y",-(s-50)/2).attr("class","pieTitleText"),R=[...f.entries()].map(([t,w])=>({label:t,value:w})),S=c.selectAll(".legend").data(R).enter().append("g").attr("class","legend").attr("transform",(t,w)=>{let M=n+p,de=M*R.length/2,pe=12*n,ge=w*M-de;return"translate("+pe+","+ge+")"});S.append("rect").attr("width",n).attr("height",n).style("fill",t=>x(t.label)).style("stroke",t=>x(t.label)),S.append("text").attr("x",n+p).attr("y",n-p).text(t=>r.getShowData()?`${t.label} [${t.value}]`:t.label);let ne=Math.max(...S.selectAll("text").nodes().map(t=>t?.getBoundingClientRect().width??0)),le=d+b+n+p+ne,W=oe.node()?.getBoundingClientRect().width??0,se=d/2-W/2,ce=d/2+W/2,z=Math.min(0,se),F=Math.max(le,ce)-z;m.attr("viewBox",`${z} 0 ${F} ${s}`),L(m,s,F,A.useMaxWidth)},"draw"),Ae={draw:Te},Me={parser:Ce,db:ee,renderer:Ae,styles:ye};export{Me as diagram};
//# sourceMappingURL=chunk-AX5FQ53A.js.map
