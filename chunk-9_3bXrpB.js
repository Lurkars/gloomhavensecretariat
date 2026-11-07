import{C as tn,E as yi$1,S as ta,T as xi$1,_ as lt,a as Oo,b as st,c as Rt,f as cn,g as ht$1,h as fu,i as Mi$1,l as Sn,o as Qo,p as ct$1,s as Rn,u as Vo,v as pi$1,y as sn}from"./chunk-9zHme7LL.js";import{c as co}from"./chunk-6EG6Yict.js";import{C as nn}from"./chunk-CjUKac6C.js";import{A as Za,E as Xa,M as an,O as Ya,S as Va,_ as Qa,a as Ha,it as so,s as Ja,u as Ka}from"./chunk-Dun_zXhy.js";import{i as st$1,r as le$1,t as N}from"./chunk-BuLNCUYz.js";import{n as o}from"./chunk-DJiPQ8Tm.js";import{a as v,o as w}from"./chunk-KKbbA1T3.js";var Ve=v((Rt,Nt)=>{"use strict";(function(t,e){typeof Rt==`object`&&typeof Nt<`u`?Nt.exports=e():typeof define==`function`&&define.amd?define(e):(t=typeof globalThis<`u`?globalThis:t||self).dayjs_plugin_isoWeek=e()})(Rt,(function(){"use strict";var t=`day`;return function(e,r,n){var s=function(D){return D.add(4-D.isoWeekday(),t)},d=r.prototype;d.isoWeekYear=function(){return s(this).year()},d.isoWeek=function(D){if(!this.$utils().u(D))return this.add(7*(D-this.isoWeek()),t);var w,V,I,R,S=s(this),C=(w=this.isoWeekYear(),V=this.$u,I=(V?n.utc:n)().year(w).startOf(`year`),R=4-I.isoWeekday(),I.isoWeekday()>4&&(R+=7),I.add(R,t));return S.diff(C,`week`)+1},d.isoWeekday=function(D){return this.$utils().u(D)?this.day()||7:this.day(this.day()%7?D:D-7)};var y=d.startOf;d.startOf=function(D,w){var V=this.$utils(),I=!!V.u(w)||w;return V.p(D)===`isoweek`?I?this.date(this.date()-(this.isoWeekday()-1)).startOf(`day`):this.date(this.date()-1-(this.isoWeekday()-1)+7).endOf(`day`):y.bind(this)(D,w)}}}))});var Pe=v((Ht,Bt)=>{"use strict";(function(t,e){typeof Ht==`object`&&typeof Bt<`u`?Bt.exports=e():typeof define==`function`&&define.amd?define(e):(t=typeof globalThis<`u`?globalThis:t||self).dayjs_plugin_customParseFormat=e()})(Ht,(function(){"use strict";var t={LTS:`h:mm:ss A`,LT:`h:mm A`,L:`MM/DD/YYYY`,LL:`MMMM D, YYYY`,LLL:`MMMM D, YYYY h:mm A`,LLLL:`dddd, MMMM D, YYYY h:mm A`},e=/(\[[^[]*\])|([-_:/.,()\s]+)|(A|a|Q|YYYY|YY?|ww?|MM?M?M?|Do|DD?|hh?|HH?|mm?|ss?|S{1,3}|z|ZZ?)/g,r=/\d/,n=/\d\d/,s=/\d\d?/,d=/\d*[^-_:/,()\s\d]+/,y={},D=function(b){return(b=+b)+(b>68?1900:2e3)},w=function(b){return function(_){this[b]=+_}},V=[/[+-]\d\d:?(\d\d)?|Z/,function(b){(this.zone||(this.zone={})).offset=(function(_){if(!_||_===`Z`)return 0;var x=_.match(/([+-]|\d\d)/g),O=60*x[1]+(+x[2]||0);return O===0?0:x[0]===`+`?-O:O})(b)}],I=function(b){var _=y[b];return _&&(_.indexOf?_:_.s.concat(_.f))},R=function(b,_){var x,O=y.meridiem;if(O){for(var B=1;B<=24;B+=1)if(b.indexOf(O(B,0,_))>-1){x=B>12;break}}else x=b===(_?`pm`:`PM`);return x},S={A:[d,function(b){this.afternoon=R(b,!1)}],a:[d,function(b){this.afternoon=R(b,!0)}],Q:[r,function(b){this.month=3*(b-1)+1}],S:[r,function(b){this.milliseconds=100*+b}],SS:[n,function(b){this.milliseconds=10*+b}],SSS:[/\d{3}/,function(b){this.milliseconds=+b}],s:[s,w(`seconds`)],ss:[s,w(`seconds`)],m:[s,w(`minutes`)],mm:[s,w(`minutes`)],H:[s,w(`hours`)],h:[s,w(`hours`)],HH:[s,w(`hours`)],hh:[s,w(`hours`)],D:[s,w(`day`)],DD:[n,w(`day`)],Do:[d,function(b){var _=y.ordinal,x=b.match(/\d+/);if(this.day=x[0],_)for(var O=1;O<=31;O+=1)_(O).replace(/\[|\]/g,``)===b&&(this.day=O)}],w:[s,w(`week`)],ww:[n,w(`week`)],M:[s,w(`month`)],MM:[n,w(`month`)],MMM:[d,function(b){var _=I(`months`),x=(I(`monthsShort`)||_.map((function(O){return O.slice(0,3)}))).indexOf(b)+1;if(x<1)throw new Error;this.month=x%12||x}],MMMM:[d,function(b){var _=I(`months`).indexOf(b)+1;if(_<1)throw new Error;this.month=_%12||_}],Y:[/[+-]?\d+/,w(`year`)],YY:[n,function(b){this.year=D(b)}],YYYY:[/\d{4}/,w(`year`)],Z:V,ZZ:V};function C(b){var _=b,x=y&&y.formats;for(var O=(b=_.replace(/(\[[^\]]+])|(LTS?|l{1,4}|L{1,4})/g,(function(W,F,m){var v=m&&m.toUpperCase();return F||x[m]||t[m]||x[v].replace(/(\[[^\]]+])|(MMMM|MM|DD|dddd)/g,(function(g,T,a){return T||a.slice(1)}))}))).match(e),B=O.length,j=0;j<B;j+=1){var L=O[j],p=S[L],f=p&&p[0],M=p&&p[1];O[j]=M?{regex:f,parser:M}:L.replace(/^\[|\]$/g,``)}return function(W){for(var F={},m=0,v=0;m<B;m+=1){var g=O[m];if(typeof g==`string`)v+=g.length;else{var T=g.regex,a=g.parser,k=W.slice(v),h=T.exec(k)[0];a.call(F,h),W=W.replace(h,``)}}return(function(u){var Y=u.afternoon;if(Y!==void 0){var i=u.hours;Y?i<12&&(u.hours+=12):i===12&&(u.hours=0),delete u.afternoon}})(F),F}}return function(b,_,x){x.p.customParseFormat=!0,b&&b.parseTwoDigitYear&&(D=b.parseTwoDigitYear);var O=_.prototype,B=O.parse;O.parse=function(j){var L=j.date,p=j.utc,f=j.args;this.$u=p;var M=f[1];if(typeof M==`string`){var W=f[2]===!0,F=f[3]===!0,m=W||F,v=f[2];F&&(v=f[2]),y=this.$locale(),!W&&v&&(y=x.Ls[v]),this.$d=(function(k,h,u,Y){try{if([`x`,`X`].indexOf(h)>-1)return/* @__PURE__ */ new Date((h===`X`?1e3:1)*k);var i=C(h)(k),$=i.year,c=i.month,G=i.day,o=i.hours,E=i.minutes,A=i.seconds,N=i.milliseconds,H=i.zone,P=i.week,z=/* @__PURE__ */ new Date,et=G||($||c?1:z.getDate()),it=$||z.getFullYear(),lt=0;$&&!c||(lt=c>0?c-1:z.getMonth());var ut,dt=o||0,X=E||0,st=A||0,K=N||0;return H?new Date(Date.UTC(it,lt,et,dt,X,st,K+60*H.offset*1e3)):u?new Date(Date.UTC(it,lt,et,dt,X,st,K)):(ut=new Date(it,lt,et,dt,X,st,K),P&&(ut=Y(ut).week(P).toDate()),ut)}catch{return/* @__PURE__ */ new Date(``)}})(L,M,p,x),this.init(),v&&v!==!0&&(this.$L=this.locale(v).$L),m&&L!=this.format(M)&&(this.$d=/* @__PURE__ */ new Date(``)),y={}}else if(M instanceof Array)for(var g=M.length,T=1;T<=g;T+=1){f[1]=M[T-1];var a=x.apply(this,f);if(a.isValid()){this.$d=a.$d,this.$L=a.$L,this.init();break}T===g&&(this.$d=/* @__PURE__ */ new Date(``))}else B.call(this,j)}}}))});var ze=v((jt,Gt)=>{"use strict";(function(t,e){typeof jt==`object`&&typeof Gt<`u`?Gt.exports=e():typeof define==`function`&&define.amd?define(e):(t=typeof globalThis<`u`?globalThis:t||self).dayjs_plugin_advancedFormat=e()})(jt,(function(){"use strict";return function(t,e){var r=e.prototype,n=r.format;r.format=function(s){var d=this,y=this.$locale();if(!this.isValid())return n.bind(this)(s);var D=this.$utils(),w=(s||`YYYY-MM-DDTHH:mm:ssZ`).replace(/\[([^\]]+)]|Q|wo|ww|w|WW|W|zzz|z|gggg|GGGG|Do|X|x|k{1,2}|S/g,(function(V){switch(V){case`Q`:return Math.ceil((d.$M+1)/3);case`Do`:return y.ordinal(d.$D);case`gggg`:return d.weekYear();case`GGGG`:return d.isoWeekYear();case`wo`:return y.ordinal(d.week(),`W`);case`w`:case`ww`:return D.s(d.week(),V===`w`?1:2,`0`);case`W`:case`WW`:return D.s(d.isoWeek(),V===`W`?1:2,`0`);case`k`:case`kk`:return D.s(String(d.$H===0?24:d.$H),V===`k`?1:2,`0`);case`X`:return Math.floor(d.$d.getTime()/1e3);case`x`:return d.$d.getTime();case`z`:return`[`+d.offsetName()+`]`;case`zzz`:return`[`+d.offsetName(`long`)+`]`;default:return V}}));return n.bind(this)(w)}}}))});var Re=v((Xt,Ut)=>{"use strict";(function(t,e){typeof Xt==`object`&&typeof Ut<`u`?Ut.exports=e():typeof define==`function`&&define.amd?define(e):(t=typeof globalThis<`u`?globalThis:t||self).dayjs_plugin_duration=e()})(Xt,(function(){"use strict";var t,e,r=1e3,n=6e4,s=36e5,d=864e5,y=31536e6,D=2628e6,w=/^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/,V=/\[([^\]]+)]|YYYY|YY|Y|M{1,2}|D{1,2}|H{1,2}|m{1,2}|s{1,2}|SSS/g,I={years:y,months:D,days:d,hours:s,minutes:n,seconds:r,milliseconds:1,weeks:6048e5},R=function(L){return L instanceof B},S=function(L,p,f){return new B(L,f,p.$l)},C=function(L){return e.p(L)+`s`},b=function(L){return L<0},_=function(L){return b(L)?Math.ceil(L):Math.floor(L)},x=function(L){return Math.abs(L)},O=function(L,p){return L?b(L)?{negative:!0,format:``+x(L)+p}:{negative:!1,format:``+L+p}:{negative:!1,format:``}},B=(function(){function L(f,M,W){var F=this;if(this.$d={},this.$l=W,f===void 0&&(this.$ms=0,this.parseFromMilliseconds()),M)return S(f*I[C(M)],this);if(typeof f==`number`)return this.$ms=f,this.parseFromMilliseconds(),this;if(typeof f==`object`)return Object.keys(f).forEach((function(g){F.$d[C(g)]=f[g]})),this.calMilliseconds(),this;if(typeof f==`string`){var m=f.match(w);if(m){var v=m.slice(2).map((function(g){return g!=null?Number(g):0}));return this.$d.years=v[0],this.$d.months=v[1],this.$d.weeks=v[2],this.$d.days=v[3],this.$d.hours=v[4],this.$d.minutes=v[5],this.$d.seconds=v[6],this.calMilliseconds(),this}}return this}var p=L.prototype;return p.calMilliseconds=function(){var f=this;this.$ms=Object.keys(this.$d).reduce((function(M,W){return M+(f.$d[W]||0)*I[W]}),0)},p.parseFromMilliseconds=function(){var f=this.$ms;this.$d.years=_(f/y),f%=y,this.$d.months=_(f/D),f%=D,this.$d.days=_(f/d),f%=d,this.$d.hours=_(f/s),f%=s,this.$d.minutes=_(f/n),f%=n,this.$d.seconds=_(f/r),f%=r,this.$d.milliseconds=f},p.toISOString=function(){var f=O(this.$d.years,`Y`),M=O(this.$d.months,`M`),W=+this.$d.days||0;this.$d.weeks&&(W+=7*this.$d.weeks);var F=O(W,`D`),m=O(this.$d.hours,`H`),v=O(this.$d.minutes,`M`),g=this.$d.seconds||0;this.$d.milliseconds&&(g+=this.$d.milliseconds/1e3,g=Math.round(1e3*g)/1e3);var T=O(g,`S`),a=f.negative||M.negative||F.negative||m.negative||v.negative||T.negative,k=m.format||v.format||T.format?`T`:``,h=(a?`-`:``)+`P`+f.format+M.format+F.format+k+m.format+v.format+T.format;return h===`P`||h===`-P`?`P0D`:h},p.toJSON=function(){return this.toISOString()},p.format=function(f){var M=f||`YYYY-MM-DDTHH:mm:ss`,W={Y:this.$d.years,YY:e.s(this.$d.years,2,`0`),YYYY:e.s(this.$d.years,4,`0`),M:this.$d.months,MM:e.s(this.$d.months,2,`0`),D:this.$d.days,DD:e.s(this.$d.days,2,`0`),H:this.$d.hours,HH:e.s(this.$d.hours,2,`0`),m:this.$d.minutes,mm:e.s(this.$d.minutes,2,`0`),s:this.$d.seconds,ss:e.s(this.$d.seconds,2,`0`),SSS:e.s(this.$d.milliseconds,3,`0`)};return M.replace(V,(function(F,m){return m||String(W[F])}))},p.as=function(f){return this.$ms/I[C(f)]},p.get=function(f){var M=this.$ms,W=C(f);return W===`milliseconds`?M%=1e3:M=W===`weeks`?_(M/I[W]):this.$d[W],M||0},p.add=function(f,M,W){var F=M?f*I[C(M)]:R(f)?f.$ms:S(f,this).$ms;return S(this.$ms+F*(W?-1:1),this)},p.subtract=function(f,M){return this.add(f,M,!0)},p.locale=function(f){var M=this.clone();return M.$l=f,M},p.clone=function(){return S(this.$ms,this)},p.humanize=function(f){return t().add(this.$ms,`ms`).locale(this.$l).fromNow(!f)},p.valueOf=function(){return this.asMilliseconds()},p.milliseconds=function(){return this.get(`milliseconds`)},p.asMilliseconds=function(){return this.as(`milliseconds`)},p.seconds=function(){return this.get(`seconds`)},p.asSeconds=function(){return this.as(`seconds`)},p.minutes=function(){return this.get(`minutes`)},p.asMinutes=function(){return this.as(`minutes`)},p.hours=function(){return this.get(`hours`)},p.asHours=function(){return this.as(`hours`)},p.days=function(){return this.get(`days`)},p.asDays=function(){return this.as(`days`)},p.weeks=function(){return this.get(`weeks`)},p.asWeeks=function(){return this.as(`weeks`)},p.months=function(){return this.get(`months`)},p.asMonths=function(){return this.as(`months`)},p.years=function(){return this.get(`years`)},p.asYears=function(){return this.as(`years`)},L})(),j=function(L,p,f){return L.add(p.years()*f,`y`).add(p.months()*f,`M`).add(p.days()*f,`d`).add(p.hours()*f,`h`).add(p.minutes()*f,`m`).add(p.seconds()*f,`s`).add(p.milliseconds()*f,`ms`)};return function(L,p,f){t=f,e=f().$utils(),f.duration=function(F,m){return S(F,{$l:f.locale()},m)},f.isDuration=R;var M=p.prototype.add,W=p.prototype.subtract;p.prototype.add=function(F,m){return R(F)?j(this,F,1):M.bind(this)(F,m)},p.prototype.subtract=function(F,m){return R(F)?j(this,F,-1):W.bind(this)(F,m)}}}))});function oi(t){return t}var Dt=1;var Pt=2;var zt=3;var _t=4;var Le=1e-6;function ci(t){return`translate(`+t+`,0)`}function li(t){return`translate(0,`+t+`)`}function ui(t){return e=>+t(e)}function di(t,e){return e=Math.max(0,t.bandwidth()-e*2)/2,t.round()&&(e=Math.round(e)),r=>+t(r)+e}function fi(){return!this.__axis}function Fe(t,e){var r=[],n=null,s=null,d=6,y=6,D=3,w=typeof window<`u`&&window.devicePixelRatio>1?0:.5,V=t===Dt||t===_t?-1:1,I=t===_t||t===Pt?`x`:`y`,R=t===Dt||t===zt?ci:li;function S(C){var b=n??(e.ticks?e.ticks.apply(e,r):e.domain()),_=s??(e.tickFormat?e.tickFormat.apply(e,r):oi),x=Math.max(d,0)+D,O=e.range(),B=+O[0]+w,j=+O[O.length-1]+w,L=(e.bandwidth?di:ui)(e.copy(),w),p=C.selection?C.selection():C,f=p.selectAll(`.domain`).data([null]),M=p.selectAll(`.tick`).data(b,e).order(),W=M.exit(),F=M.enter().append(`g`).attr(`class`,`tick`),m=M.select(`line`),v=M.select(`text`);f=f.merge(f.enter().insert(`path`,`.tick`).attr(`class`,`domain`).attr(`stroke`,`currentColor`)),M=M.merge(F),m=m.merge(F.append(`line`).attr(`stroke`,`currentColor`).attr(I+`2`,V*d)),v=v.merge(F.append(`text`).attr(`fill`,`currentColor`).attr(I,V*x).attr(`dy`,t===Dt?`0em`:t===zt?`0.71em`:`0.32em`)),C!==p&&(f=f.transition(C),M=M.transition(C),m=m.transition(C),v=v.transition(C),W=W.transition(C).attr(`opacity`,Le).attr(`transform`,function(g){return isFinite(g=L(g))?R(g+w):this.getAttribute(`transform`)}),F.attr(`opacity`,Le).attr(`transform`,function(g){var T=this.parentNode.__axis;return R((T&&isFinite(T=T(g))?T:L(g))+w)})),W.remove(),f.attr(`d`,t===_t||t===Pt?y?`M`+V*y+`,`+B+`H`+w+`V`+j+`H`+V*y:`M`+w+`,`+B+`V`+j:y?`M`+B+`,`+V*y+`V`+w+`H`+j+`V`+V*y:`M`+B+`,`+w+`H`+j),M.attr(`opacity`,1).attr(`transform`,function(g){return R(L(g)+w)}),m.attr(I+`2`,V*d),v.attr(I,V*x).text(_),p.filter(fi).attr(`fill`,`none`).attr(`font-size`,10).attr(`font-family`,`sans-serif`).attr(`text-anchor`,t===Pt?`start`:t===_t?`end`:`middle`),p.each(function(){this.__axis=L})}return S.scale=function(C){return arguments.length?(e=C,S):e},S.ticks=function(){return r=Array.from(arguments),S},S.tickArguments=function(C){return arguments.length?(r=C==null?[]:Array.from(C),S):r.slice()},S.tickValues=function(C){return arguments.length?(n=C==null?null:Array.from(C),S):n&&n.slice()},S.tickFormat=function(C){return arguments.length?(s=C,S):s},S.tickSize=function(C){return arguments.length?(d=y=+C,S):d},S.tickSizeInner=function(C){return arguments.length?(d=+C,S):d},S.tickSizeOuter=function(C){return arguments.length?(y=+C,S):y},S.tickPadding=function(C){return arguments.length?(D=+C,S):D},S.offset=function(C){return arguments.length?(w=+C,S):w},S}function Oe(t){return Fe(Dt,t)}function We(t){return Fe(zt,t)}var je=w(nn(),1);var Q=w(st$1(),1);var Ge=w(Ve(),1);var Xe=w(Pe(),1);var Ue=w(ze(),1);var mt=w(st$1(),1);var si=w(Re(),1);var Zt=(function(){var t=o(function(T,a,k,h){for(k=k||{},h=T.length;h--;k[T[h]]=a);return k},`o`),e=[6,8,10,12,13,14,15,16,17,18,20,21,22,23,24,25,26,27,28,29,30,31,33,35,36,38,40],r=[1,26],n=[1,27],s=[1,28],d=[1,29],y=[1,30],D=[1,31],w=[1,32],V=[1,33],I=[1,34],R=[1,9],S=[1,10],C=[1,11],b=[1,12],_=[1,13],x=[1,14],O=[1,15],B=[1,16],j=[1,19],L=[1,20],p=[1,21],f=[1,22],M=[1,23],W=[1,25],F=[1,35],m={trace:o(function(){},`trace`),yy:{},symbols_:{error:2,start:3,gantt:4,document:5,EOF:6,line:7,SPACE:8,statement:9,NL:10,weekday:11,weekday_monday:12,weekday_tuesday:13,weekday_wednesday:14,weekday_thursday:15,weekday_friday:16,weekday_saturday:17,weekday_sunday:18,weekend:19,weekend_friday:20,weekend_saturday:21,dateFormat:22,inclusiveEndDates:23,topAxis:24,axisFormat:25,tickInterval:26,excludes:27,includes:28,todayMarker:29,title:30,acc_title:31,acc_title_value:32,acc_descr:33,acc_descr_value:34,acc_descr_multiline_value:35,section:36,clickStatement:37,taskTxt:38,taskData:39,click:40,callbackname:41,callbackargs:42,href:43,clickStatementDebug:44,$accept:0,$end:1},terminals_:{2:`error`,4:`gantt`,6:`EOF`,8:`SPACE`,10:`NL`,12:`weekday_monday`,13:`weekday_tuesday`,14:`weekday_wednesday`,15:`weekday_thursday`,16:`weekday_friday`,17:`weekday_saturday`,18:`weekday_sunday`,20:`weekend_friday`,21:`weekend_saturday`,22:`dateFormat`,23:`inclusiveEndDates`,24:`topAxis`,25:`axisFormat`,26:`tickInterval`,27:`excludes`,28:`includes`,29:`todayMarker`,30:`title`,31:`acc_title`,32:`acc_title_value`,33:`acc_descr`,34:`acc_descr_value`,35:`acc_descr_multiline_value`,36:`section`,38:`taskTxt`,39:`taskData`,40:`click`,41:`callbackname`,42:`callbackargs`,43:`href`},productions_:[0,[3,3],[5,0],[5,2],[7,2],[7,1],[7,1],[7,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[19,1],[19,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,2],[9,2],[9,1],[9,1],[9,1],[9,2],[37,2],[37,3],[37,3],[37,4],[37,3],[37,4],[37,2],[44,2],[44,3],[44,3],[44,4],[44,3],[44,4],[44,2]],performAction:o(function(a,k,h,u,Y,i,$){var c=i.length-1;switch(Y){case 1:return i[c-1];case 2:this.$=[];break;case 3:i[c-1].push(i[c]),this.$=i[c-1];break;case 4:case 5:this.$=i[c];break;case 6:case 7:this.$=[];break;case 8:u.setWeekday(`monday`);break;case 9:u.setWeekday(`tuesday`);break;case 10:u.setWeekday(`wednesday`);break;case 11:u.setWeekday(`thursday`);break;case 12:u.setWeekday(`friday`);break;case 13:u.setWeekday(`saturday`);break;case 14:u.setWeekday(`sunday`);break;case 15:u.setWeekend(`friday`);break;case 16:u.setWeekend(`saturday`);break;case 17:u.setDateFormat(i[c].substr(11)),this.$=i[c].substr(11);break;case 18:u.enableInclusiveEndDates(),this.$=i[c].substr(18);break;case 19:u.TopAxis(),this.$=i[c].substr(8);break;case 20:u.setAxisFormat(i[c].substr(11)),this.$=i[c].substr(11);break;case 21:u.setTickInterval(i[c].substr(13)),this.$=i[c].substr(13);break;case 22:u.setExcludes(i[c].substr(9)),this.$=i[c].substr(9);break;case 23:u.setIncludes(i[c].substr(9)),this.$=i[c].substr(9);break;case 24:u.setTodayMarker(i[c].substr(12)),this.$=i[c].substr(12);break;case 27:u.setDiagramTitle(i[c].substr(6)),this.$=i[c].substr(6);break;case 28:this.$=i[c].trim(),u.setAccTitle(this.$);break;case 29:case 30:this.$=i[c].trim(),u.setAccDescription(this.$);break;case 31:u.addSection(i[c].substr(8)),this.$=i[c].substr(8);break;case 33:u.addTask(i[c-1],i[c]),this.$=`task`;break;case 34:this.$=i[c-1],u.setClickEvent(i[c-1],i[c],null);break;case 35:this.$=i[c-2],u.setClickEvent(i[c-2],i[c-1],i[c]);break;case 36:this.$=i[c-2],u.setClickEvent(i[c-2],i[c-1],null),u.setLink(i[c-2],i[c]);break;case 37:this.$=i[c-3],u.setClickEvent(i[c-3],i[c-2],i[c-1]),u.setLink(i[c-3],i[c]);break;case 38:this.$=i[c-2],u.setClickEvent(i[c-2],i[c],null),u.setLink(i[c-2],i[c-1]);break;case 39:this.$=i[c-3],u.setClickEvent(i[c-3],i[c-1],i[c]),u.setLink(i[c-3],i[c-2]);break;case 40:this.$=i[c-1],u.setLink(i[c-1],i[c]);break;case 41:case 47:this.$=i[c-1]+` `+i[c];break;case 42:case 43:case 45:this.$=i[c-2]+` `+i[c-1]+` `+i[c];break;case 44:case 46:this.$=i[c-3]+` `+i[c-2]+` `+i[c-1]+` `+i[c]}},`anonymous`),table:[{3:1,4:[1,2]},{1:[3]},t(e,[2,2],{5:3}),{6:[1,4],7:5,8:[1,6],9:7,10:[1,8],11:17,12:r,13:n,14:s,15:d,16:y,17:D,18:w,19:18,20:V,21:I,22:R,23:S,24:C,25:b,26:_,27:x,28:O,29:B,30:j,31:L,33:p,35:f,36:M,37:24,38:W,40:F},t(e,[2,7],{1:[2,1]}),t(e,[2,3]),{9:36,11:17,12:r,13:n,14:s,15:d,16:y,17:D,18:w,19:18,20:V,21:I,22:R,23:S,24:C,25:b,26:_,27:x,28:O,29:B,30:j,31:L,33:p,35:f,36:M,37:24,38:W,40:F},t(e,[2,5]),t(e,[2,6]),t(e,[2,17]),t(e,[2,18]),t(e,[2,19]),t(e,[2,20]),t(e,[2,21]),t(e,[2,22]),t(e,[2,23]),t(e,[2,24]),t(e,[2,25]),t(e,[2,26]),t(e,[2,27]),{32:[1,37]},{34:[1,38]},t(e,[2,30]),t(e,[2,31]),t(e,[2,32]),{39:[1,39]},t(e,[2,8]),t(e,[2,9]),t(e,[2,10]),t(e,[2,11]),t(e,[2,12]),t(e,[2,13]),t(e,[2,14]),t(e,[2,15]),t(e,[2,16]),{41:[1,40],43:[1,41]},t(e,[2,4]),t(e,[2,28]),t(e,[2,29]),t(e,[2,33]),t(e,[2,34],{42:[1,42],43:[1,43]}),t(e,[2,40],{41:[1,44]}),t(e,[2,35],{43:[1,45]}),t(e,[2,36]),t(e,[2,38],{42:[1,46]}),t(e,[2,37]),t(e,[2,39])],defaultActions:{},parseError:o(function(a,k){if(k.recoverable)this.trace(a);else{var h=new Error(a);throw h.hash=k,h}},`parseError`),parse:o(function(a){var k=this,h=[0],u=[],Y=[null],i=[],$=this.table,c=``,G=0,o$1=0,E=0,A=2,N=1,H=i.slice.call(arguments,1),P=Object.create(this.lexer),z={yy:{}};for(var et in this.yy)Object.prototype.hasOwnProperty.call(this.yy,et)&&(z.yy[et]=this.yy[et]);P.setInput(a,z.yy),z.yy.lexer=P,z.yy.parser=this,typeof P.yylloc>`u`&&(P.yylloc={});var it=P.yylloc;i.push(it);var lt=P.options&&P.options.ranges;typeof z.yy.parseError==`function`?this.parseError=z.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;function ut(Z){h.length=h.length-2*Z,Y.length=Y.length-Z,i.length=i.length-Z}o(ut,`popStack`);function dt(){var Z=u.pop()||P.lex()||N;return typeof Z!=`number`&&(Z instanceof Array&&(u=Z,Z=u.pop()),Z=k.symbols_[Z]||Z),Z}o(dt,`lex`);for(var X,st,K,q,It,ft={},bt,nt,ue,xt;;){if(K=h[h.length-1],this.defaultActions[K]?q=this.defaultActions[K]:((X===null||typeof X>`u`)&&(X=dt()),q=$[K]&&$[K][X]),typeof q>`u`||!q.length||!q[0]){var Yt=``;xt=[];for(bt in $[K])this.terminals_[bt]&&bt>A&&xt.push(`'`+this.terminals_[bt]+`'`);P.showPosition?Yt=`Parse error on line `+(G+1)+`:
`+P.showPosition()+`
Expecting `+xt.join(`, `)+`, got '`+(this.terminals_[X]||X)+`'`:Yt=`Parse error on line `+(G+1)+`: Unexpected `+(X==N?`end of input`:`'`+(this.terminals_[X]||X)+`'`),this.parseError(Yt,{text:P.match,token:this.terminals_[X]||X,line:P.yylineno,loc:it,expected:xt})}if(q[0]instanceof Array&&q.length>1)throw new Error(`Parse Error: multiple actions possible at state: `+K+`, token: `+X);switch(q[0]){case 1:h.push(X),Y.push(P.yytext),i.push(P.yylloc),h.push(q[1]),X=null,st?(X=st,st=null):(o$1=P.yyleng,c=P.yytext,G=P.yylineno,it=P.yylloc,E>0&&E--);break;case 2:if(nt=this.productions_[q[1]][1],ft.$=Y[Y.length-nt],ft._$={first_line:i[i.length-(nt||1)].first_line,last_line:i[i.length-1].last_line,first_column:i[i.length-(nt||1)].first_column,last_column:i[i.length-1].last_column},lt&&(ft._$.range=[i[i.length-(nt||1)].range[0],i[i.length-1].range[1]]),It=this.performAction.apply(ft,[c,o$1,G,z.yy,q[1],Y,i].concat(H)),typeof It<`u`)return It;nt&&(h=h.slice(0,-1*nt*2),Y=Y.slice(0,-1*nt),i=i.slice(0,-1*nt)),h.push(this.productions_[q[1]][0]),Y.push(ft.$),i.push(ft._$),ue=$[h[h.length-2]][h[h.length-1]],h.push(ue);break;case 3:return!0}}return!0},`parse`)};m.lexer=(function(){return{EOF:1,parseError:o(function(k,h){if(this.yy.parser)this.yy.parser.parseError(k,h);else throw new Error(k)},`parseError`),setInput:o(function(a,k){return this.yy=k||this.yy||{},this._input=a,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match=``,this.conditionStack=[`INITIAL`],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},`setInput`),input:o(function(){var a=this._input[0];this.yytext+=a,this.yyleng++,this.offset++,this.match+=a,this.matched+=a;return a.match(/(?:\r\n?|\n).*/g)?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),a},`input`),unput:o(function(a){var k=a.length,h=a.split(/(?:\r\n?|\n)/g);this._input=a+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-k),this.offset-=k;var u=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),h.length-1&&(this.yylineno-=h.length-1);var Y=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:h?(h.length===u.length?this.yylloc.first_column:0)+u[u.length-h.length].length-h[0].length:this.yylloc.first_column-k},this.options.ranges&&(this.yylloc.range=[Y[0],Y[0]+this.yyleng-k]),this.yyleng=this.yytext.length,this},`unput`),more:o(function(){return this._more=!0,this},`more`),reject:o(function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError(`Lexical error on line `+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:``,token:null,line:this.yylineno});return this},`reject`),less:o(function(a){this.unput(this.match.slice(a))},`less`),pastInput:o(function(){var a=this.matched.substr(0,this.matched.length-this.match.length);return(a.length>20?`...`:``)+a.substr(-20).replace(/\n/g,``)},`pastInput`),upcomingInput:o(function(){var a=this.match;return a.length<20&&(a+=this._input.substr(0,20-a.length)),(a.substr(0,20)+(a.length>20?`...`:``)).replace(/\n/g,``)},`upcomingInput`),showPosition:o(function(){var a=this.pastInput(),k=new Array(a.length+1).join(`-`);return a+this.upcomingInput()+`
`+k+`^`},`showPosition`),test_match:o(function(a,k){var h,u,Y;if(this.options.backtrack_lexer&&(Y={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(Y.yylloc.range=this.yylloc.range.slice(0))),u=a[0].match(/(?:\r\n?|\n).*/g),u&&(this.yylineno+=u.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:u?u[u.length-1].length-u[u.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+a[0].length},this.yytext+=a[0],this.match+=a[0],this.matches=a,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(a[0].length),this.matched+=a[0],h=this.performAction.call(this,this.yy,this,k,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),h)return h;if(this._backtrack){for(var i in Y)this[i]=Y[i];return!1}return!1},`test_match`),next:o(function(){if(this.done)return this.EOF;this._input||(this.done=!0);var a,k,h,u;this._more||(this.yytext=``,this.match=``);for(var Y=this._currentRules(),i=0;i<Y.length;i++)if(h=this._input.match(this.rules[Y[i]]),h&&(!k||h[0].length>k[0].length)){if(k=h,u=i,this.options.backtrack_lexer){if(a=this.test_match(h,Y[i]),a!==!1)return a;if(this._backtrack){k=!1;continue}else return!1}else if(!this.options.flex)break}return k?(a=this.test_match(k,Y[u]),a!==!1?a:!1):this._input===``?this.EOF:this.parseError(`Lexical error on line `+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:``,token:null,line:this.yylineno})},`next`),lex:o(function(){return this.next()||this.lex()},`lex`),begin:o(function(k){this.conditionStack.push(k)},`begin`),popState:o(function(){return this.conditionStack.length-1>0?this.conditionStack.pop():this.conditionStack[0]},`popState`),_currentRules:o(function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},`_currentRules`),topState:o(function(k){return k=this.conditionStack.length-1-Math.abs(k||0),k>=0?this.conditionStack[k]:`INITIAL`},`topState`),pushState:o(function(k){this.begin(k)},`pushState`),stateStackSize:o(function(){return this.conditionStack.length},`stateStackSize`),options:{"case-insensitive":!0},performAction:o(function(k,h,u,Y){switch(u){case 0:return this.begin(`open_directive`),`open_directive`;case 1:return this.begin(`acc_title`),31;case 2:return this.popState(),`acc_title_value`;case 3:return this.begin(`acc_descr`),33;case 4:return this.popState(),`acc_descr_value`;case 5:this.begin(`acc_descr_multiline`);break;case 6:this.popState();break;case 7:return`acc_descr_multiline_value`;case 8:break;case 9:break;case 10:break;case 11:return 10;case 12:break;case 13:break;case 14:this.begin(`href`);break;case 15:this.popState();break;case 16:return 43;case 17:this.begin(`callbackname`);break;case 18:this.popState();break;case 19:this.popState(),this.begin(`callbackargs`);break;case 20:return 41;case 21:this.popState();break;case 22:return 42;case 23:this.begin(`click`);break;case 24:this.popState();break;case 25:return 40;case 26:return 4;case 27:return 22;case 28:return 23;case 29:return 24;case 30:return 25;case 31:return 26;case 32:return 28;case 33:return 27;case 34:return 29;case 35:return 12;case 36:return 13;case 37:return 14;case 38:return 15;case 39:return 16;case 40:return 17;case 41:return 18;case 42:return 20;case 43:return 21;case 44:return`date`;case 45:return 30;case 46:return`accDescription`;case 47:return 36;case 48:return 38;case 49:return 39;case 50:return`:`;case 51:return 6;case 52:return`INVALID`}},`anonymous`),rules:[/^(?:%%\{)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:%%(?!\{)*[^\n]*)/i,/^(?:[^\}]%%*[^\n]*)/i,/^(?:%%*[^\n]*[\n]*)/i,/^(?:[\n]+)/i,/^(?:\s+)/i,/^(?:%[^\n]*)/i,/^(?:href[\s]+["])/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:call[\s]+)/i,/^(?:\([\s]*\))/i,/^(?:\()/i,/^(?:[^(]*)/i,/^(?:\))/i,/^(?:[^)]*)/i,/^(?:click[\s]+)/i,/^(?:[\s\n])/i,/^(?:[^\s\n]*)/i,/^(?:gantt\b)/i,/^(?:dateFormat\s[^#\n;]+)/i,/^(?:inclusiveEndDates\b)/i,/^(?:topAxis\b)/i,/^(?:axisFormat\s[^#\n;]+)/i,/^(?:tickInterval\s[^#\n;]+)/i,/^(?:includes\s[^#\n;]+)/i,/^(?:excludes\s[^#\n;]+)/i,/^(?:todayMarker\s[^\n;]+)/i,/^(?:weekday\s+monday\b)/i,/^(?:weekday\s+tuesday\b)/i,/^(?:weekday\s+wednesday\b)/i,/^(?:weekday\s+thursday\b)/i,/^(?:weekday\s+friday\b)/i,/^(?:weekday\s+saturday\b)/i,/^(?:weekday\s+sunday\b)/i,/^(?:weekend\s+friday\b)/i,/^(?:weekend\s+saturday\b)/i,/^(?:\d\d\d\d-\d\d-\d\d\b)/i,/^(?:title\s[^\n]+)/i,/^(?:accDescription\s[^#\n;]+)/i,/^(?:section\s[^\n]+)/i,/^(?:[^:\n]+)/i,/^(?::[^#\n;]+)/i,/^(?::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{acc_descr_multiline:{rules:[6,7],inclusive:!1},acc_descr:{rules:[4],inclusive:!1},acc_title:{rules:[2],inclusive:!1},callbackargs:{rules:[21,22],inclusive:!1},callbackname:{rules:[18,19,20],inclusive:!1},href:{rules:[15,16],inclusive:!1},click:{rules:[24,25],inclusive:!1},INITIAL:{rules:[0,1,3,5,8,9,10,11,12,13,14,17,23,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52],inclusive:!0}}}})();function g(){this.yy={}}return o(g,`Parser`),g.prototype=m,m.Parser=g,new g})();Zt.parser=Zt;var hi=Zt;Q.default.extend(Ge.default);Q.default.extend(Xe.default);Q.default.extend(Ue.default);var Ne={friday:5,saturday:6};var tt=``;var te=``;var ee=void 0;var ie=``;var yt=[];var gt=[];var ne=/* @__PURE__ */ new Map;var re=[];var Mt=[];var pt=``;var se=``;var qe=[`active`,`done`,`crit`,`milestone`,`vert`];var ae=[];var ht=``;var Tt=!1;var oe=!1;var ce=`sunday`;var Et=`saturday`;var Qt=0;var mi=o(function(){re=[],Mt=[],pt=``,ae=[],St=0,Jt=void 0,Ct=void 0,U=[],tt=``,te=``,se=``,ee=void 0,ie=``,yt=[],gt=[],Tt=!1,oe=!1,Qt=0,ne=/* @__PURE__ */ new Map,ht=``,Va(),ce=`sunday`,Et=`saturday`},`clear`);var ki=o(function(t){ht=t},`setDiagramId`);var yi=o(function(t){te=t},`setAxisFormat`);var gi=o(function(){return te},`getAxisFormat`);var pi=o(function(t){ee=t},`setTickInterval`);var vi=o(function(){return ee},`getTickInterval`);var Ti=o(function(t){ie=t},`setTodayMarker`);var bi=o(function(){return ie},`getTodayMarker`);var xi=o(function(t){tt=t},`setDateFormat`);var wi=o(function(){Tt=!0},`enableInclusiveEndDates`);var _i=o(function(){return Tt},`endDatesAreInclusive`);var Di=o(function(){oe=!0},`enableTopAxis`);var Si=o(function(){return oe},`topAxisEnabled`);var Ci=o(function(t){se=t},`setDisplayMode`);var Mi=o(function(){return se},`getDisplayMode`);var Ei=o(function(){return tt},`getDateFormat`);var Ze=o((t,e)=>{let r=e.toLowerCase().split(/[\s,]+/).filter(n=>n!==``);return[.../* @__PURE__ */ new Set([...t,...r])]},`mergeTokens`);var Ii=o(function(t){yt=Ze(yt,t)},`setIncludes`);var Yi=o(function(){return yt},`getIncludes`);var $i=o(function(t){gt=Ze(gt,t)},`setExcludes`);var Ai=o(function(){return gt},`getExcludes`);var Li=o(function(){return ne},`getLinks`);var Fi=o(function(t){pt=t,re.push(t)},`addSection`);var Oi=o(function(){return re},`getSections`);var Wi=o(function(){let t=He(),e=10,r=0;for(;!t&&r<e;)t=He(),r++;return Mt=U,Mt},`getTasks`);var Qe=o(function(t,e,r,n){let s=t.format(e.trim()),d=t.format(`YYYY-MM-DD`);return n.includes(s)||n.includes(d)?!1:r.includes(`weekends`)&&(t.isoWeekday()===Ne[Et]||t.isoWeekday()===Ne[Et]+1)||r.includes(t.format(`dddd`).toLowerCase())?!0:r.includes(s)||r.includes(d)},`isInvalidDate`);var Vi=o(function(t){ce=t},`setWeekday`);var Pi=o(function(){return ce},`getWeekday`);var zi=o(function(t){Et=t},`setWeekend`);var Ke=o(function(t,e,r,n){if(!r.length||t.manualEndTime)return;let s;t.startTime instanceof Date?s=(0,Q.default)(t.startTime):s=(0,Q.default)(t.startTime,e,!0),s=s.add(1,`d`);let d;t.endTime instanceof Date?d=(0,Q.default)(t.endTime):d=(0,Q.default)(t.endTime,e,!0);let[y,D]=Ri(s,d,e,r,n);t.endTime=y.toDate(),t.renderEndTime=D},`checkTaskDates`);var Ri=o(function(t,e,r,n,s){let d=!1,y=null,D=e.add(1e4,`d`);for(;t<=e;){if(d||(y=e.toDate()),d=Qe(t,r,n,s),d&&(e=e.add(1,`d`),e>D))throw new Error("Failed to find a valid date that was not excluded by `excludes` after 10,000 iterations.");t=t.add(1,`d`)}return[e,y]},`fixTaskDates`);var Je=o(function(t,e){N.warn(`Gantt: the "${t}" statement references unknown task id(s): ${e.join(`, `)}. Make sure the referenced tasks exist and declare an id. Milestones need both an id and a duration, e.g. "Milestone :milestone, m1, 2023-01-01, 0d".`)},`warnAboutUnknownTaskIds`);var Kt=o(function(t,e,r){if(r=r.trim(),o(D=>{let w=D.trim();return w===`x`||w===`X`},`isTimestampFormat`)(e)&&/^\d+$/.test(r))return new Date(Number(r));let d=/^after\s+(?<ids>[\d\w- ]+)/.exec(r);if(d!==null){let D=null,w=[],V=d.groups.ids.split(` `).filter(R=>R!==``);for(let R of V){let S=ct(R);if(S===void 0){w.push(R);continue}(!D||S.endTime>D.endTime)&&(D=S)}if(w.length>0&&Je(`after`,w),D)return D.endTime;let I=/* @__PURE__ */ new Date;return I.setHours(0,0,0,0),I}let y=(0,Q.default)(r,e.trim(),!0);if(y.isValid())return y.toDate();{N.debug(`Invalid date:`+r),N.debug(`With date format:`+e.trim());let D=new Date(r);if(D===void 0||isNaN(D.getTime())||D.getFullYear()<-1e4||D.getFullYear()>1e4)throw new Error(`Invalid date:`+r);return D}},`getStartDate`);var ti=o(function(t){let e=/^(\d+(?:\.\d+)?)([Mdhmswy]|ms)$/.exec(t.trim());return e!==null?[Number.parseFloat(e[1]),e[2]]:[NaN,`ms`]},`parseDuration`);var ei=o(function(t,e,r,n=!1){r=r.trim();let d=/^until\s+(?<ids>[\d\w- ]+)/.exec(r);if(d!==null){let I=null,R=[],S=d.groups.ids.split(` `).filter(b=>b!==``);for(let b of S){let _=ct(b);if(_===void 0){R.push(b);continue}(!I||_.startTime<I.startTime)&&(I=_)}if(R.length>0&&Je(`until`,R),I)return I.startTime;let C=/* @__PURE__ */ new Date;return C.setHours(0,0,0,0),C}let y=(0,Q.default)(r,e.trim(),!0);if(y.isValid())return n&&(y=y.add(1,`d`)),y.toDate();let D=(0,Q.default)(t),[w,V]=ti(r);if(Number.isNaN(w))N.warn(`Gantt: "${r}" is neither a valid date for the "${e.trim()}" date format nor a valid duration (e.g. "3d"), so it is ignored and the task gets a zero duration. Milestones need a duration too, e.g. "Milestone :milestone, m1, 2023-01-01, 0d".`);else{let I=D.add(w,V);I.isValid()&&(D=I)}return D.toDate()},`getEndDate`);var St=0;var kt=o(function(t){return t===void 0?(St=St+1,`task`+St):t},`parseId`);var Ni=o(function(t,e){let r;e.substr(0,1)===`:`?r=e.substr(1,e.length):r=e;let n=r.split(`,`),s={};le(n,s,qe);for(let y=0;y<n.length;y++)n[y]=n[y].trim();let d=``;switch(n.length){case 1:s.id=kt(),s.startTime=t.endTime,d=n[0];break;case 2:s.id=kt(),s.startTime=Kt(void 0,tt,n[0]),d=n[1];break;case 3:s.id=kt(n[0]),s.startTime=Kt(void 0,tt,n[1]),d=n[2]}return d&&(s.endTime=ei(s.startTime,tt,d,Tt),s.manualEndTime=(0,Q.default)(d,`YYYY-MM-DD`,!0).isValid(),Ke(s,tt,gt,yt)),s},`compileData`);var Hi=o(function(t,e){let r;e.substr(0,1)===`:`?r=e.substr(1,e.length):r=e;let n=r.split(`,`),s={};le(n,s,qe);for(let d=0;d<n.length;d++)n[d]=n[d].trim();switch(n.length){case 1:s.id=kt(),s.startTime={type:`prevTaskEnd`,id:t},s.endTime={data:n[0]};break;case 2:s.id=kt(),s.startTime={type:`getStartDate`,startData:n[0]},s.endTime={data:n[1]};break;case 3:s.id=kt(n[0]),s.startTime={type:`getStartDate`,startData:n[1]},s.endTime={data:n[2]}}return s},`parseData`);var Jt;var Ct;var U=[];var ii={};var Bi=o(function(t,e){let r={section:pt,type:pt,processed:!1,manualEndTime:!1,renderEndTime:null,raw:{data:e},task:t,classes:[]},n=Hi(Ct,e);r.raw.startTime=n.startTime,r.raw.endTime=n.endTime,r.id=n.id,r.prevTaskId=Ct,r.active=n.active,r.done=n.done,r.crit=n.crit,r.milestone=n.milestone,r.vert=n.vert,r.vert?r.order=-1:(r.order=Qt,Qt++);let s=U.push(r);Ct=r.id,ii[r.id]=s-1},`addTask`);var ct=o(function(t){let e=ii[t];return U[e]},`findTaskById`);var ji=o(function(t,e){let r={section:pt,type:pt,description:t,task:t,classes:[]},n=Ni(Jt,e);r.startTime=n.startTime,r.endTime=n.endTime,r.id=n.id,r.active=n.active,r.done=n.done,r.crit=n.crit,r.milestone=n.milestone,r.vert=n.vert,Jt=r,Mt.push(r)},`addTaskOrg`);var He=o(function(){let t=o(function(r){let n=U[r],s=``;switch(U[r].raw.startTime.type){case`prevTaskEnd`:n.startTime=ct(n.prevTaskId).endTime;break;case`getStartDate`:s=Kt(void 0,tt,U[r].raw.startTime.startData),s&&(U[r].startTime=s)}return U[r].startTime&&(U[r].endTime=ei(U[r].startTime,tt,U[r].raw.endTime.data,Tt),U[r].endTime&&(U[r].processed=!0,U[r].manualEndTime=(0,Q.default)(U[r].raw.endTime.data,`YYYY-MM-DD`,!0).isValid(),Ke(U[r],tt,gt,yt))),U[r].processed},`compileTask`),e=!0;for(let[r,n]of U.entries())t(r),e=e&&n.processed;return e},`compileTasks`);var Gi=o(function(t,e){let r=e;so().securityLevel!==`loose`&&(r=(0,je.sanitizeUrl)(e)),t.split(`,`).forEach(function(n){ct(n)!==void 0&&(ri(n,()=>{window.open(r,`_self`)}),ne.set(n,r))}),ni(t,`clickable`)},`setLink`);var ni=o(function(t,e){t.split(`,`).forEach(function(r){let n=ct(r);n!==void 0&&n.classes.push(e)})},`setClass`);var Xi=o(function(t,e,r){if(so().securityLevel!==`loose`||e===void 0)return;let n=[];if(typeof r==`string`){n=r.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);for(let d=0;d<n.length;d++){let y=n[d].trim();y.startsWith(`"`)&&y.endsWith(`"`)&&(y=y.substr(1,y.length-2)),n[d]=y}}n.length===0&&n.push(t),ct(t)!==void 0&&ri(t,()=>{co.runFunc(e,...n)})},`setClickFun`);var ri=o(function(t,e){ae.push(function(){let r=ht?`${ht}-${t}`:t,n=document.querySelector(`[id="${r}"]`);n!==null&&n.addEventListener(`click`,function(){e()})},function(){let r=ht?`${ht}-${t}`:t,n=document.querySelector(`[id="${r}-text"]`);n!==null&&n.addEventListener(`click`,function(){e()})})},`pushFun`);var Ui=o(function(t,e,r){t.split(`,`).forEach(function(n){Xi(n,e,r)}),ni(t,`clickable`)},`setClickEvent`);var qi=o(function(t){ae.forEach(function(e){e(t)})},`bindFunctions`);var Zi={getConfig:o(()=>so().gantt,`getConfig`),clear:mi,setDateFormat:xi,getDateFormat:Ei,enableInclusiveEndDates:wi,endDatesAreInclusive:_i,enableTopAxis:Di,topAxisEnabled:Si,setAxisFormat:yi,getAxisFormat:gi,setTickInterval:pi,getTickInterval:vi,setTodayMarker:Ti,getTodayMarker:bi,setAccTitle:Ya,getAccTitle:Xa,setDiagramTitle:Ja,getDiagramTitle:Qa,setDiagramId:ki,setDisplayMode:Ci,getDisplayMode:Mi,setAccDescription:Ka,getAccDescription:Za,addSection:Fi,getSections:Oi,getTasks:Wi,addTask:Bi,findTaskById:ct,addTaskOrg:ji,setIncludes:Ii,getIncludes:Yi,setExcludes:$i,getExcludes:Ai,setClickEvent:Ui,setLink:Gi,getLinks:Li,bindFunctions:qi,parseDuration:ti,isInvalidDate:Qe,setWeekday:Vi,getWeekday:Pi,setWeekend:zi};function le(t,e,r){let n=!0;for(;n;)n=!1,r.forEach(function(s){let d=`^\\s*`+s+`\\s*$`,y=new RegExp(d);t[0].match(y)&&(e[s]=!0,t.shift(1),n=!0)})}o(le,`getTaskTags`);mt.default.extend(si.default);var Qi=o(function(){N.debug(`Something is calling, setConf, remove the call`)},`setConf`);var Be={monday:Rn,tuesday:pi$1,wednesday:yi$1,thursday:sn,friday:Mi$1,saturday:xi$1,sunday:Sn};var Ki=o((t,e)=>{let r=[...t].map(()=>-1/0),n=[...t].sort((d,y)=>d.startTime-y.startTime||d.order-y.order),s=0;for(let d of n)for(let y=0;y<r.length;y++)if(d.startTime>=r[y]){r[y]=d.endTime,d.order=y+e,y>s&&(s=y);break}return s},`getMaxIntersections`);var rt;var qt=1e4;var dn={parser:hi,db:Zi,renderer:{setConf:Qi,draw:o(function(t,e,r,n){let s=so().gantt;n.db.setDiagramId(e);let d=so().securityLevel,y;d===`sandbox`&&(y=le$1(`#i`+e));let D=d===`sandbox`?le$1(y.nodes()[0].contentDocument.body):le$1(`body`),w=d===`sandbox`?y.nodes()[0].contentDocument:document,V=w.getElementById(e);rt=V.parentElement.offsetWidth,rt===void 0&&(rt=1200),s.useWidth!==void 0&&(rt=s.useWidth);let I=n.db.getTasks(),R=I.filter(m=>!m.vert),S=[];for(let m of R)S.push(m.type);S=F(S);let C={},b=2*s.topPadding;if(n.db.getDisplayMode()===`compact`||s.displayMode===`compact`){let m={};for(let g of R)m[g.section]===void 0?m[g.section]=[g]:m[g.section].push(g);let v=0;for(let g of Object.keys(m)){let T=Ki(m[g],v)+1;v+=T,b+=T*(s.barHeight+s.barGap),C[g]=T}}else{b+=R.length*(s.barHeight+s.barGap);for(let m of S)C[m]=R.filter(v=>v.type===m).length}V.setAttribute(`viewBox`,`0 0 `+rt+` `+b);let _=D.select(`[id="${e}"]`),x=ta().domain([Qo(I,function(m){return m.startTime}),Vo(I,function(m){return m.endTime})]).rangeRound([0,rt-s.leftPadding-s.rightPadding]);function O(m,v){let g=m.startTime,T=v.startTime,a=0;return g>T?a=1:g<T&&(a=-1),a}o(O,`taskCompare`),I.sort(O),B(I,rt,b),Ha(_,b,rt,s.useMaxWidth),_.append(`text`).text(n.db.getDiagramTitle()).attr(`x`,rt/2).attr(`y`,s.titleTopMargin).attr(`class`,`titleText`);function B(m,v,g){let T=s.barHeight,a=T+s.barGap,k=s.topPadding,h=s.leftPadding,u=Oo().domain([0,S.length]).range([`#00B9FA`,`#F95002`]).interpolate(fu);L(a,k,h,v,g,m,n.db.getExcludes(),n.db.getIncludes()),f(h,k,v,g),j(m,a,k,h,T,u,v,g),M(a,k,h,T,u),W(h,k,v,g)}o(B,`makeGantt`);function j(m,v,g,T,a,k,h){m.sort((o,E)=>o.vert===E.vert?0:o.vert?1:-1);let u=m.filter(o=>!o.vert),i=[...new Set(u.map(o=>o.order))].map(o=>u.find(E=>E.order===o));_.append(`g`).selectAll(`rect`).data(i).enter().append(`rect`).attr(`x`,0).attr(`y`,function(o,E){return E=o.order,E*v+g-2}).attr(`width`,function(){return h-s.rightPadding/2}).attr(`height`,v).attr(`class`,function(o){for(let[E,A]of S.entries())if(o.type===A)return`section section`+E%s.numberSectionStyles;return`section section0`}).enter();let $=_.append(`g`).selectAll(`rect`).data(m).enter(),c=n.db.getLinks();if($.append(`rect`).attr(`id`,function(o){return e+`-`+o.id}).attr(`rx`,3).attr(`ry`,3).attr(`x`,function(o){return o.milestone?x(o.startTime)+T+.5*(x(o.endTime)-x(o.startTime))-.5*a:x(o.startTime)+T}).attr(`y`,function(o,E){return E=o.order,o.vert?s.gridLineStartPadding:E*v+g}).attr(`width`,function(o){return o.milestone?a:o.vert?.08*a:x(o.renderEndTime||o.endTime)-x(o.startTime)}).attr(`height`,function(o){return o.vert?u.length*(s.barHeight+s.barGap)+s.barHeight*2:a}).attr(`transform-origin`,function(o,E){return E=o.order,(x(o.startTime)+T+.5*(x(o.endTime)-x(o.startTime))).toString()+`px `+(E*v+g+.5*a).toString()+`px`}).attr(`class`,function(o){let E=`task`,A=``;o.classes.length>0&&(A=o.classes.join(` `));let N=0;for(let[P,z]of S.entries())o.type===z&&(N=P%s.numberSectionStyles);let H=``;return o.active?o.crit?H+=` activeCrit`:H=` active`:o.done?o.crit?H=` doneCrit`:H=` done`:o.crit&&(H+=` crit`),H.length===0&&(H=` task`),o.milestone&&(H=` milestone `+H),o.vert&&(H=` vert `+H),H+=N,H+=` `+A,E+H}),$.append(`text`).attr(`id`,function(o){return e+`-`+o.id+`-text`}).text(function(o){return o.task}).attr(`font-size`,s.fontSize).attr(`x`,function(o){let E=x(o.startTime),A=x(o.renderEndTime||o.endTime);if(o.milestone&&(E+=.5*(x(o.endTime)-x(o.startTime))-.5*a,A=E+a),o.vert)return x(o.startTime)+T;let N=this.getBBox().width;return N>A-E?A+N+1.5*s.leftPadding>h?E+T-5:A+T+5:(A-E)/2+E+T}).attr(`y`,function(o,E){return o.vert?s.gridLineStartPadding+u.length*(s.barHeight+s.barGap)+60:(E=o.order,E*v+s.barHeight/2+(s.fontSize/2-2)+g)}).attr(`text-height`,a).attr(`class`,function(o){let E=x(o.startTime),A=x(o.endTime);o.milestone&&(A=E+a);let N=this.getBBox().width,H=``;o.classes.length>0&&(H=o.classes.join(` `));let P=0;for(let[et,it]of S.entries())o.type===it&&(P=et%s.numberSectionStyles);let z=``;return o.active&&(o.crit?z=`activeCritText`+P:z=`activeText`+P),o.done?o.crit?z=z+` doneCritText`+P:z=z+` doneText`+P:o.crit&&(z=z+` critText`+P),o.milestone&&(z+=` milestoneText`),o.vert&&(z+=` vertText`),N>A-E?A+N+1.5*s.leftPadding>h?H+` taskTextOutsideLeft taskTextOutside`+P+` `+z:H+` taskTextOutsideRight taskTextOutside`+P+` `+z+` width-`+N:H+` taskText taskText`+P+` `+z+` width-`+N}),so().securityLevel===`sandbox`){let o;o=le$1(`#i`+e);let E=o.nodes()[0].contentDocument;$.filter(function(A){return c.has(A.id)}).each(function(A){var N=E.querySelector(`#`+CSS.escape(e+`-`+A.id)),H=E.querySelector(`#`+CSS.escape(e+`-`+A.id+`-text`));let P=N.parentNode;var z=E.createElement(`a`);z.setAttribute(`xlink:href`,c.get(A.id)),z.setAttribute(`target`,`_top`),P.appendChild(z),z.appendChild(N),z.appendChild(H)})}}o(j,`drawRects`);function L(m,v,g,T,a,k,h,u){if(h.length===0&&u.length===0)return;let Y,i;for(let{startTime:A,endTime:N}of k)(Y===void 0||A<Y)&&(Y=A),(i===void 0||N>i)&&(i=N);if(!Y||!i)return;if((0,mt.default)(i).diff((0,mt.default)(Y),`year`)>5){N.warn(`The difference between the min and max time is more than 5 years. This will cause performance issues. Skipping drawing exclude days.`);return}let $=n.db.getDateFormat(),c=[],G=null,o=(0,mt.default)(Y);for(;o.valueOf()<=i;)n.db.isInvalidDate(o,$,h,u)?G?G.end=o:G={start:o,end:o}:G&&(c.push(G),G=null),o=o.add(1,`d`);_.append(`g`).selectAll(`rect`).data(c).enter().append(`rect`).attr(`id`,A=>e+`-exclude-`+A.start.format(`YYYY-MM-DD`)).attr(`x`,A=>x(A.start.startOf(`day`))+g).attr(`y`,s.gridLineStartPadding).attr(`width`,A=>x(A.end.endOf(`day`))-x(A.start.startOf(`day`))).attr(`height`,a-v-s.gridLineStartPadding).attr(`transform-origin`,function(A,N){return(x(A.start)+g+.5*(x(A.end)-x(A.start))).toString()+`px `+(N*m+.5*a).toString()+`px`}).attr(`class`,`exclude-range`)}o(L,`drawExcludeDays`);function p(m,v,g,T){if(g<=0||m>v)return 1/0;let a=v-m,k=mt.default.duration({[T??`day`]:g}).asMilliseconds();return k<=0?1/0:Math.ceil(a/k)}o(p,`getEstimatedTickCount`);function f(m,v,g,T){let a=n.db.getDateFormat(),k=n.db.getAxisFormat(),h;k?h=k:a===`D`?h=`%d`:h=s.axisFormat??`%Y-%m-%d`;let u=We(x).tickSize(-T+v+s.gridLineStartPadding).tickFormat(Rt(h)),i=/^([1-9]\d*)(millisecond|second|minute|hour|day|week|month)$/.exec(n.db.getTickInterval()||s.tickInterval);if(i!==null){let $=parseInt(i[1],10);if(isNaN($)||$<=0)N.warn(`Invalid tick interval value: "${i[1]}". Skipping custom tick interval.`);else{let c=i[2],G=n.db.getWeekday()||s.weekday,o=x.domain(),E=o[0],A=o[1],N$1=p(E,A,$,c);if(N$1>qt)N.warn(`The tick interval "${$}${c}" would generate ${N$1} ticks, which exceeds the maximum allowed (${qt}). This may indicate an invalid date or time range. Skipping custom tick interval.`);else switch(c){case`millisecond`:u.ticks(ct$1.every($));break;case`second`:u.ticks(tn.every($));break;case`minute`:u.ticks(lt.every($));break;case`hour`:u.ticks(st.every($));break;case`day`:u.ticks(cn.every($));break;case`week`:u.ticks(Be[G].every($));break;case`month`:u.ticks(ht$1.every($))}}}if(_.append(`g`).attr(`class`,`grid`).attr(`transform`,`translate(`+m+`, `+(T-50)+`)`).call(u).selectAll(`text`).style(`text-anchor`,`middle`).attr(`fill`,`#000`).attr(`stroke`,`none`).attr(`font-size`,10).attr(`dy`,`1em`),n.db.topAxisEnabled()||s.topAxis){let $=Oe(x).tickSize(-T+v+s.gridLineStartPadding).tickFormat(Rt(h));if(i!==null){let c=parseInt(i[1],10);if(isNaN(c)||c<=0)N.warn(`Invalid tick interval value: "${i[1]}". Skipping custom tick interval.`);else{let G=i[2],o=n.db.getWeekday()||s.weekday,E=x.domain(),A=E[0],N=E[1];if(p(A,N,c,G)<=qt)switch(G){case`millisecond`:$.ticks(ct$1.every(c));break;case`second`:$.ticks(tn.every(c));break;case`minute`:$.ticks(lt.every(c));break;case`hour`:$.ticks(st.every(c));break;case`day`:$.ticks(cn.every(c));break;case`week`:$.ticks(Be[o].every(c));break;case`month`:$.ticks(ht$1.every(c))}}}_.append(`g`).attr(`class`,`grid`).attr(`transform`,`translate(`+m+`, `+v+`)`).call($).selectAll(`text`).style(`text-anchor`,`middle`).attr(`fill`,`#000`).attr(`stroke`,`none`).attr(`font-size`,10)}}o(f,`makeGrid`);function M(m,v){let g=0,T=Object.keys(C).map(a=>[a,C[a]]);_.append(`g`).selectAll(`text`).data(T).enter().append(function(a){let k=a[0].split(an.lineBreakRegex),h=-(k.length-1)/2,u=w.createElementNS(`http://www.w3.org/2000/svg`,`text`);u.setAttribute(`dy`,h+`em`);for(let[Y,i]of k.entries()){let $=w.createElementNS(`http://www.w3.org/2000/svg`,`tspan`);$.setAttribute(`alignment-baseline`,`central`),$.setAttribute(`x`,`10`),Y>0&&$.setAttribute(`dy`,`1em`),$.textContent=i,u.appendChild($)}return u}).attr(`x`,10).attr(`y`,function(a,k){if(k>0)for(let h=0;h<k;h++)return g+=T[k-1][1],a[1]*m/2+g*m+v;else return a[1]*m/2+v}).attr(`font-size`,s.sectionFontSize).attr(`class`,function(a){for(let[k,h]of S.entries())if(a[0]===h)return`sectionTitle sectionTitle`+k%s.numberSectionStyles;return`sectionTitle`})}o(M,`vertLabels`);function W(m,v,g,T){let a=n.db.getTodayMarker();if(a===`off`)return;let k=_.append(`g`).attr(`class`,`today`),h=/* @__PURE__ */ new Date,u=k.append(`line`);u.attr(`x1`,x(h)+m).attr(`x2`,x(h)+m).attr(`y1`,s.titleTopMargin).attr(`y2`,T-s.titleTopMargin).attr(`class`,`today`),a!==``&&u.attr(`style`,a.replace(/,/g,`;`))}o(W,`drawToday`);function F(m){let v={},g=[];for(let T=0,a=m.length;T<a;++T)Object.prototype.hasOwnProperty.call(v,m[T])||(v[m[T]]=!0,g.push(m[T]));return g}o(F,`checkUnique`)},`draw`)},styles:o(t=>`
  .mermaid-main-font {
        font-family: ${t.fontFamily};
  }

  .exclude-range {
    fill: ${t.excludeBkgColor};
  }

  .section {
    stroke: none;
    opacity: 0.2;
  }

  .section0 {
    fill: ${t.sectionBkgColor};
  }

  .section2 {
    fill: ${t.sectionBkgColor2};
  }

  .section1,
  .section3 {
    fill: ${t.altSectionBkgColor};
    opacity: 0.2;
  }

  .sectionTitle0 {
    fill: ${t.titleColor};
  }

  .sectionTitle1 {
    fill: ${t.titleColor};
  }

  .sectionTitle2 {
    fill: ${t.titleColor};
  }

  .sectionTitle3 {
    fill: ${t.titleColor};
  }

  .sectionTitle {
    text-anchor: start;
    font-family: ${t.fontFamily};
  }


  /* Grid and axis */

  .grid .tick {
    stroke: ${t.gridColor};
    opacity: 0.8;
    shape-rendering: crispEdges;
  }

  .grid .tick text {
    font-family: ${t.fontFamily};
    fill: ${t.textColor};
  }

  .grid path {
    stroke-width: 0;
  }


  /* Today line */

  .today {
    fill: none;
    stroke: ${t.todayLineColor};
    stroke-width: 2px;
  }


  /* Task styling */

  /* Default task */

  .task {
    stroke-width: 2;
  }

  .taskText {
    text-anchor: middle;
    font-family: ${t.fontFamily};
  }

  .taskTextOutsideRight {
    fill: ${t.taskTextDarkColor};
    text-anchor: start;
    font-family: ${t.fontFamily};
  }

  .taskTextOutsideLeft {
    fill: ${t.taskTextDarkColor};
    text-anchor: end;
  }


  /* Special case clickable */

  .task.clickable {
    cursor: pointer;
  }

  .taskText.clickable {
    cursor: pointer;
    fill: ${t.taskTextClickableColor} !important;
    font-weight: bold;
  }

  .taskTextOutsideLeft.clickable {
    cursor: pointer;
    fill: ${t.taskTextClickableColor} !important;
    font-weight: bold;
  }

  .taskTextOutsideRight.clickable {
    cursor: pointer;
    fill: ${t.taskTextClickableColor} !important;
    font-weight: bold;
  }


  /* Specific task settings for the sections*/

  .taskText0,
  .taskText1,
  .taskText2,
  .taskText3 {
    fill: ${t.taskTextColor};
  }

  .task0,
  .task1,
  .task2,
  .task3 {
    fill: ${t.taskBkgColor};
    stroke: ${t.taskBorderColor};
  }

  .taskTextOutside0,
  .taskTextOutside2
  {
    fill: ${t.taskTextOutsideColor};
  }

  .taskTextOutside1,
  .taskTextOutside3 {
    fill: ${t.taskTextOutsideColor};
  }


  /* Active task */

  .active0,
  .active1,
  .active2,
  .active3 {
    fill: ${t.activeTaskBkgColor};
    stroke: ${t.activeTaskBorderColor};
  }

  .activeText0,
  .activeText1,
  .activeText2,
  .activeText3 {
    fill: ${t.taskTextDarkColor} !important;
  }


  /* Completed task */

  .done0,
  .done1,
  .done2,
  .done3 {
    stroke: ${t.doneTaskBorderColor};
    fill: ${t.doneTaskBkgColor};
    stroke-width: 2;
  }

  .doneText0,
  .doneText1,
  .doneText2,
  .doneText3 {
    fill: ${t.taskTextDarkColor} !important;
  }

  /* Done task text displayed outside the bar sits against the diagram background,
     not against the done-task bar, so it must use the outside/contrast color. */
  .doneText0.taskTextOutsideLeft,
  .doneText0.taskTextOutsideRight,
  .doneText1.taskTextOutsideLeft,
  .doneText1.taskTextOutsideRight,
  .doneText2.taskTextOutsideLeft,
  .doneText2.taskTextOutsideRight,
  .doneText3.taskTextOutsideLeft,
  .doneText3.taskTextOutsideRight {
    fill: ${t.taskTextOutsideColor} !important;
  }


  /* Tasks on the critical line */

  .crit0,
  .crit1,
  .crit2,
  .crit3 {
    stroke: ${t.critBorderColor};
    fill: ${t.critBkgColor};
    stroke-width: 2;
  }

  .activeCrit0,
  .activeCrit1,
  .activeCrit2,
  .activeCrit3 {
    stroke: ${t.critBorderColor};
    fill: ${t.activeTaskBkgColor};
    stroke-width: 2;
  }

  .doneCrit0,
  .doneCrit1,
  .doneCrit2,
  .doneCrit3 {
    stroke: ${t.critBorderColor};
    fill: ${t.doneTaskBkgColor};
    stroke-width: 2;
    cursor: pointer;
    shape-rendering: crispEdges;
  }

  .milestone {
    transform: rotate(45deg) scale(0.8,0.8);
  }

  .milestoneText {
    font-style: italic;
  }
  .doneCritText0,
  .doneCritText1,
  .doneCritText2,
  .doneCritText3 {
    fill: ${t.taskTextDarkColor} !important;
  }

  /* Done-crit task text outside the bar \u2014 same reasoning as doneText above. */
  .doneCritText0.taskTextOutsideLeft,
  .doneCritText0.taskTextOutsideRight,
  .doneCritText1.taskTextOutsideLeft,
  .doneCritText1.taskTextOutsideRight,
  .doneCritText2.taskTextOutsideLeft,
  .doneCritText2.taskTextOutsideRight,
  .doneCritText3.taskTextOutsideLeft,
  .doneCritText3.taskTextOutsideRight {
    fill: ${t.taskTextOutsideColor} !important;
  }

  .vert {
    stroke: ${t.vertLineColor};
  }

  .vertText {
    font-size: 15px;
    text-anchor: middle;
    fill: ${t.vertLineColor} !important;
  }

  .activeCritText0,
  .activeCritText1,
  .activeCritText2,
  .activeCritText3 {
    fill: ${t.taskTextDarkColor} !important;
  }

  .titleText {
    text-anchor: middle;
    font-size: 18px;
    fill: ${t.titleColor||t.textColor};
    font-family: ${t.fontFamily};
  }
`,`getStyles`)};export{dn as diagram};
//# debugId=534b4691-16ad-5916-9ae7-f40c818840cd
//# sourceMappingURL=chunk-9_3bXrpB.js.map