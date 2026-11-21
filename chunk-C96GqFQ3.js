import{a}from"./chunk-DEshJjQO.js";import{t}from"./chunk-COLcxiIx.js";import{D as l}from"./chunk-LiZy2ct7.js";import{l as ft}from"./chunk-CsntYIwW.js";import"./chunk-BHsVzbAz.js";import{F as el,G as ll,L as hl,O as al,Y as nl,Z as ol,d as Lr,et as sl,g as Ta,s as Ja}from"./chunk-BA-kikt5.js";import{t as N}from"./chunk-0Na8v4Sz.js";import{n as o}from"./chunk-DJiPQ8Tm.js";import{Hn as r}from"./main-A4YAQ23V.js";var j=Ta.packet;var M=class{constructor(){this.packet=[],this.setAccTitle=ol,this.getAccTitle=sl,this.setDiagramTitle=hl,this.getDiagramTitle=nl,this.getAccDescription=ll,this.setAccDescription=al}static{o(this,`PacketDB`)}getConfig(){let t=ft(r(r({},j),Lr().packet));return t.showBits&&(t.paddingY+=10),t}getPacket(){return this.packet}pushWord(t){t.length>0&&this.packet.push(t)}clear(){el(),this.packet=[]}};var G=1e4;var H=o((t$1,e)=>{t(t$1,e);let a=-1,o=[],s=1,{bitsPerRow:l}=e.getConfig();for(let{start:r,end:i,bits:d,label:h}of t$1.blocks){if(r!==void 0&&i!==void 0&&i<r)throw new Error(`Packet block ${r} - ${i} is invalid. End must be greater than start.`);if(r??=a+1,r!==a+1)throw new Error(`Packet block ${r} - ${i??r} is not contiguous. It should start from ${a+1}.`);if(d===0)throw new Error(`Packet block ${r} is invalid. Cannot have a zero bit field.`);for(i??=r+(d??1)-1,d??=i-r+1,a=i,N.debug(`Packet block ${r} - ${a} with label ${h}`);o.length<=l+1&&e.getPacket().length<G;){let[c,p]=K({start:r,end:i,bits:d,label:h},s,l);if(o.push(c),c.end+1===s*l&&(e.pushWord(o),o=[],s++),!p)break;({start:r,end:i,bits:d,label:h}=p)}}e.pushWord(o)},`populate`);var K=o((t,e,a)=>{if(t.start===void 0)throw new Error(`start should have been set during first phase`);if(t.end===void 0)throw new Error(`end should have been set during first phase`);if(t.start>t.end)throw new Error(`Block start ${t.start} is greater than block end ${t.end}.`);if(t.end+1<=e*a)return[t,void 0];let o=e*a-1,s=e*a;return[{start:t.start,end:o,label:t.label,bits:o-t.start},{start:s,end:t.end,label:t.label,bits:t.end-s}]},`getNextFittingBlock`);var Y={parser:{yy:void 0},parse:o(async t=>{let e=await l(`packet`,t),a=Y.parser?.yy;if(!(a instanceof M))throw new Error(`parser.parser?.yy was not a PacketDB. This is due to a bug within Mermaid, please report this issue at https://github.com/mermaid-js/mermaid/issues.`);N.debug(e),H(e,a)},`parse`)};var U=o((t,e,a$1,o)=>{let s=o.db,l=s.getConfig(),{rowHeight:r,paddingY:i,bitWidth:d,bitsPerRow:h}=l,c=s.getPacket(),p=s.getDiagramTitle(),u=r+i,n=u*(c.length+1)-(p?0:r),f=d*h+2,k=a(e);k.attr(`viewBox`,`0 0 ${f} ${n}`),Ja(k,n,f,l.useMaxWidth);for(let[B,m]of c.entries())X(k,m,B,l);k.append(`text`).text(p).attr(`x`,f/2).attr(`y`,n-u/2).attr(`dominant-baseline`,`middle`).attr(`text-anchor`,`middle`).attr(`class`,`packetTitle`)},`draw`);var X=o((t,e,a,{rowHeight:o,paddingX:s,paddingY:l,bitWidth:r,bitsPerRow:i,showBits:d,bitOrder:h})=>{let c=t.append(`g`),p=a*(o+l)+l,u=h===`descending`;for(let n of e){let f=n.end-n.start+1,k=n.start%i,m=(u?i-k-f:k)*r+1,b=f*r-s;if(c.append(`rect`).attr(`x`,m).attr(`y`,p).attr(`width`,b).attr(`height`,o).attr(`class`,`packetBlock`),c.append(`text`).attr(`x`,m+b/2).attr(`y`,p+o/2).attr(`class`,`packetLabel`).attr(`dominant-baseline`,`middle`).attr(`text-anchor`,`middle`).text(n.label),!d)continue;let[I,O]=u?[n.end,n.start]:[n.start,n.end],w=f===1,$=p-2;c.append(`text`).attr(`x`,m+(w?b/2:0)).attr(`y`,$).attr(`class`,`packetByte start`).attr(`dominant-baseline`,`auto`).attr(`text-anchor`,w?`middle`:`start`).text(I),w||c.append(`text`).attr(`x`,m+b).attr(`y`,$).attr(`class`,`packetByte end`).attr(`dominant-baseline`,`auto`).attr(`text-anchor`,`end`).text(O)}},`drawWord`);var q={draw:U};var J={byteFontSize:`10px`,startByteColor:`black`,endByteColor:`black`,labelColor:`black`,labelFontSize:`12px`,titleColor:`black`,titleFontSize:`14px`,blockStrokeColor:`black`,blockStrokeWidth:`1`,blockFillColor:`#efefef`};var ot={parser:Y,get db(){return new M},renderer:q,styles:o(({packet:t}={})=>{let e=ft(J,t);return`
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
	`},`styles`)};export{ot as diagram};
//# debugId=52d8f3dc-b5a8-5a33-8486-8fc32a5e5923
//# sourceMappingURL=chunk-C96GqFQ3.js.map