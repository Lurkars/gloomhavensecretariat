import {t}from'./chunk-BkBdHtBr.js';import {w as ws,A as As,E as Es,v as vs,f as Os,q as qs,O as Ot,c as ct,y as ye$1,o as ft,a5 as a,a6 as lr,a7 as Oc,a8 as ze,b as bs,_ as _s,a9 as Ec,r as rs}from'./chunk-Cp3iZIbz.js';import {m}from'./chunk-CL3f10s4.js';import'./main-5TI2JYH6.js';var Y=rs.pie,D={sections:new Map,showData:false},u=D.sections,y=D.showData,fe=structuredClone(Y),he=Ot(()=>structuredClone(fe),"getConfig"),ue=Ot(()=>{u=new Map,y=D.showData,_s();},"clear"),me=Ot(({label:e,value:a})=>{if(a<0)throw new Error(`"${e}" has invalid value: ${a}. Negative values are not allowed in pie charts. All slice values must be >= 0.`);u.has(e)||(u.set(e,a),ct.debug(`added new section: ${e}, with value: ${a}`));},"addSection"),ve=Ot(()=>u,"getSections"),xe=Ot(e=>{y=e;},"setShowData"),Se=Ot(()=>y,"getShowData"),ee={getConfig:he,clear:ue,setDiagramTitle:qs,getDiagramTitle:Os,setAccTitle:vs,getAccTitle:Es,setAccDescription:As,getAccDescription:ws,addSection:me,getSections:ve,setShowData:xe,getShowData:Se},we=Ot((e,a)=>{t(e,a),a.setShowData(e.showData),e.sections.map(a.addSection);},"populateDb"),Ce={parse:Ot(async e=>{let a=await m("pie",e);ct.debug(a),we(a,ee);},"parse")},De=Ot(e=>`
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
`,"getStyles"),ye=De,$e=Ot(e=>{let a=[...e.values()].reduce((r,l)=>r+l,0),$=[...e.entries()].map(([r,l])=>({label:r,value:l})).filter(r=>r.value/a*100>=1);return Ec().value(r=>r.value).sort(null)($)},"createPieArcs"),Te=Ot((e,a$1,$,T)=>{ct.debug(`rendering pie chart
`+e);let r=T.db,l=ye$1(),A=ft(r.getConfig(),l.pie),b=40,n=18,p=4,s=450,d=s,m=a(a$1),c=m.append("g");c.attr("transform","translate("+d/2+","+s/2+")");let{themeVariables:i}=l,[E]=lr(i.pieOuterStrokeWidth);E??=2;let _=A.textPosition,g=Math.min(d,s)/2-b,te=Oc().innerRadius(0).outerRadius(g),ae=Oc().innerRadius(g*_).outerRadius(g*_);c.append("circle").attr("cx",0).attr("cy",0).attr("r",g+E/2).attr("class","pieOuterCircle");let f=r.getSections(),ie=$e(f),re=[i.pie1,i.pie2,i.pie3,i.pie4,i.pie5,i.pie6,i.pie7,i.pie8,i.pie9,i.pie10,i.pie11,i.pie12],v=0;f.forEach(t=>{v+=t;});let k=ie.filter(t=>(t.data.value/v*100).toFixed(0)!=="0"),x=ze(re).domain([...f.keys()]);c.selectAll("mySlices").data(k).enter().append("path").attr("d",te).attr("fill",t=>x(t.data.label)).attr("class","pieCircle"),c.selectAll("mySlices").data(k).enter().append("text").text(t=>(t.data.value/v*100).toFixed(0)+"%").attr("transform",t=>"translate("+ae.centroid(t)+")").style("text-anchor","middle").attr("class","slice");let oe=c.append("text").text(r.getDiagramTitle()).attr("x",0).attr("y",-400/2).attr("class","pieTitleText"),R=[...f.entries()].map(([t,w])=>({label:t,value:w})),S=c.selectAll(".legend").data(R).enter().append("g").attr("class","legend").attr("transform",(t,w)=>{let M=n+p,de=M*R.length/2,pe=12*n,ge=w*M-de;return "translate("+pe+","+ge+")"});S.append("rect").attr("width",n).attr("height",n).style("fill",t=>x(t.label)).style("stroke",t=>x(t.label)),S.append("text").attr("x",n+p).attr("y",n-p).text(t=>r.getShowData()?`${t.label} [${t.value}]`:t.label);let ne=Math.max(...S.selectAll("text").nodes().map(t=>t?.getBoundingClientRect().width??0)),le=d+b+n+p+ne,W=oe.node()?.getBoundingClientRect().width??0,se=d/2-W/2,ce=d/2+W/2,z=Math.min(0,se),F=Math.max(le,ce)-z;m.attr("viewBox",`${z} 0 ${F} ${s}`),bs(m,s,F,A.useMaxWidth);},"draw"),Ae={draw:Te},Me={parser:Ce,db:ee,renderer:Ae,styles:ye};export{Me as diagram};//# sourceMappingURL=chunk-DtRFmzv9.js.map
