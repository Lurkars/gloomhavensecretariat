import {t}from'./chunk-BmivgTHg.js';import {O as Ot,p as ft,a5 as a,$ as $s,c as ct,J as Js,Q as Qs,r as ra,e as ea,i as ia,t as ta,k as Qi,q as Ls,Z as Zs}from'./chunk-C2Gg68i1.js';import {m}from'./chunk-B9EW4CkP.js';import {aF as r}from'./main-IAPRQ3PW.js';var L=Ls.packet,A=class{constructor(){this.packet=[],this.setAccTitle=Js,this.getAccTitle=Qs,this.setDiagramTitle=ra,this.getDiagramTitle=ea,this.getAccDescription=ia,this.setAccDescription=ta;}static{Ot(this,"PacketDB");}getConfig(){let t=ft(r(r({},L),Qi().packet));return t.showBits&&(t.paddingY+=10),t}getPacket(){return this.packet}pushWord(t){t.length>0&&this.packet.push(t);}clear(){Zs(),this.packet=[];}},M=1e4,Y=Ot((t$1,e)=>{t(t$1,e);let a=-1,o=[],n=1,{bitsPerRow:l}=e.getConfig();for(let{start:r,end:s,bits:d,label:c}of t$1.blocks){if(r!==void 0&&s!==void 0&&s<r)throw new Error(`Packet block ${r} - ${s} is invalid. End must be greater than start.`);if(r??=a+1,r!==a+1)throw new Error(`Packet block ${r} - ${s??r} is not contiguous. It should start from ${a+1}.`);if(d===0)throw new Error(`Packet block ${r} is invalid. Cannot have a zero bit field.`);for(s??=r+(d??1)-1,d??=s-r+1,a=s,ct.debug(`Packet block ${r} - ${a} with label ${c}`);o.length<=l+1&&e.getPacket().length<M;){let[p,i]=I({start:r,end:s,bits:d,label:c},n,l);if(o.push(p),p.end+1===n*l&&(e.pushWord(o),o=[],n++),!i)break;({start:r,end:s,bits:d,label:c}=i);}}e.pushWord(o);},"populate"),I=Ot((t,e,a)=>{if(t.start===void 0)throw new Error("start should have been set during first phase");if(t.end===void 0)throw new Error("end should have been set during first phase");if(t.start>t.end)throw new Error(`Block start ${t.start} is greater than block end ${t.end}.`);if(t.end+1<=e*a)return [t,void 0];let o=e*a-1,n=e*a;return [{start:t.start,end:o,label:t.label,bits:o-t.start},{start:n,end:t.end,label:t.label,bits:t.end-n}]},"getNextFittingBlock"),W={parser:{yy:void 0},parse:Ot(async t=>{let e=await m("packet",t),a=W.parser?.yy;if(!(a instanceof A))throw new Error("parser.parser?.yy was not a PacketDB. This is due to a bug within Mermaid, please report this issue at https://github.com/mermaid-js/mermaid/issues.");ct.debug(e),Y(e,a);},"parse")},O=Ot((t,e,a$1,o)=>{let n=o.db,l=n.getConfig(),{rowHeight:r,paddingY:s,bitWidth:d,bitsPerRow:c}=l,p=n.getPacket(),i=n.getDiagramTitle(),f=r+s,g=f*(p.length+1)-(i?0:r),k=d*c+2,b=a(e);b.attr("viewBox",`0 0 ${k} ${g}`),$s(b,g,k,l.useMaxWidth);for(let[_,N]of p.entries())j(b,N,_,l);b.append("text").text(i).attr("x",k/2).attr("y",g-f/2).attr("dominant-baseline","middle").attr("text-anchor","middle").attr("class","packetTitle");},"draw"),j=Ot((t,e,a,{rowHeight:o,paddingX:n,paddingY:l,bitWidth:r,bitsPerRow:s,showBits:d})=>{let c=t.append("g"),p=a*(o+l)+l;for(let i of e){let f=i.start%s*r+1,g=(i.end-i.start+1)*r-n;if(c.append("rect").attr("x",f).attr("y",p).attr("width",g).attr("height",o).attr("class","packetBlock"),c.append("text").attr("x",f+g/2).attr("y",p+o/2).attr("class","packetLabel").attr("dominant-baseline","middle").attr("text-anchor","middle").text(i.label),!d)continue;let k=i.end===i.start,b=p-2;c.append("text").attr("x",f+(k?g/2:0)).attr("y",b).attr("class","packetByte start").attr("dominant-baseline","auto").attr("text-anchor",k?"middle":"start").text(i.start),k||c.append("text").attr("x",f+g).attr("y",b).attr("class","packetByte end").attr("dominant-baseline","auto").attr("text-anchor","end").text(i.end);}},"drawWord"),G={draw:O},H={byteFontSize:"10px",startByteColor:"black",endByteColor:"black",labelColor:"black",labelFontSize:"12px",titleColor:"black",titleFontSize:"14px",blockStrokeColor:"black",blockStrokeWidth:"1",blockFillColor:"#efefef"},K=Ot(({packet:t}={})=>{let e=ft(H,t);return `
	.packetByte {
		font-size: ${e.byteFontSize};
	}
	.packetByte.start {
		fill: ${e.startByteColor};
	}
	.packetByte.end {
		fill: ${e.endByteColor};
	}
	.packetLabel {
		fill: ${e.labelColor};
		font-size: ${e.labelFontSize};
	}
	.packetTitle {
		fill: ${e.titleColor};
		font-size: ${e.titleFontSize};
	}
	.packetBlock {
		stroke: ${e.blockStrokeColor};
		stroke-width: ${e.blockStrokeWidth};
		fill: ${e.blockFillColor};
	}
	`},"styles"),V={parser:W,get db(){return new A},renderer:G,styles:K};export{V as diagram};//# sourceMappingURL=chunk-wgNqgaKv.js.map
