(function(){
'use strict';


/* pixel wordmark for the cover: hand-made glyphs so C never reads as O (v1.01c) */
(function logoDraw(){const cv=document.getElementById('logoCv');if(!cv)return;const G={"K": ["1...1", "1..1.", "1.1..", "11...", "1.1..", "1..1.", "1...1"], "C": [".1111", "1....", "1....", "1....", "1....", "1....", ".1111"], "A": [".111.", "1...1", "1...1", "11111", "1...1", "1...1", "1...1"], "L": ["1....", "1....", "1....", "1....", "1....", "1....", "11111"], "P": ["1111.", "1...1", "1...1", "1111.", "1....", "1....", "1...."], "E": ["11111", "1....", "1....", "1111.", "1....", "1....", "11111"], "T": ["11111", "..1..", "..1..", "..1..", "..1..", "..1..", "..1.."], "S": [".1111", "1....", "1....", ".111.", "....1", "....1", "1111."], "U": ["1...1", "1...1", "1...1", "1...1", "1...1", "1...1", ".111."], "O": [".111.", "1...1", "1...1", "1...1", "1...1", "1...1", ".111."], "N": ["1...1", "11..1", "11..1", "1.1.1", "1..11", "1..11", "1...1"], "I": ["111", ".1.", ".1.", ".1.", ".1.", ".1.", "111"]},txt='LUTONIA',U=6,cols=[];
  for(const ch of txt){if(ch===' '){cols.push(null,null,null);continue}const g=G[ch];for(let x=0;x<5;x++)cols.push(g.map(r=>r[x]==='1'));cols.push(null)}cols.pop();
  const W=cols.length+2,H=7+2+1.5;cv.width=W*U;cv.height=H*U;const c=cv.getContext('2d');const on=(x,y)=>x>=0&&x<cols.length&&y>=0&&y<7&&cols[x]&&cols[x][y];
  const fill=(dx,dy,col)=>{c.fillStyle=col;for(let x=0;x<cols.length;x++)for(let y=0;y<7;y++)if(on(x,y))c.fillRect((x+1+dx)*U,(y+1+dy)*U,U,U)};
  const out=(dy,col)=>{c.fillStyle=col;for(let x=-1;x<=cols.length;x++)for(let y=-1;y<=7;y++){if(on(x,y))continue;if(on(x-1,y)||on(x+1,y)||on(x,y-1)||on(x,y+1)||on(x-1,y-1)||on(x+1,y+1)||on(x-1,y+1)||on(x+1,y-1))c.fillRect((x+1)*U,(y+1+dy)*U,U,U)}};
  const o=U/3;fill(0,1.25,'#2a1608');[[-o,0],[o,0],[0,-o],[0,o],[-o,-o],[o,o],[-o,o],[o,-o]].forEach(([ax,ay])=>{c.save();c.translate(ax,ay+U*.9);fill(0,0,'#2a1608');c.restore()});fill(0,.9,'#8a4a14');[[-o,0],[o,0],[0,-o],[0,o],[-o,-o],[o,o],[-o,o],[o,-o]].forEach(([ax,ay])=>{c.save();c.translate(ax,ay);fill(0,0,'#2a1608');c.restore()});
  const R=['#fff1c2','#ffe08a','#ffd05a','#ffc23a','#f5ab2a','#e8962a','#d9821f'];for(let x=0;x<cols.length;x++)for(let y=0;y<7;y++)if(on(x,y)){c.fillStyle=R[y];c.fillRect((x+1)*U,(y+1)*U,U,U);if(!on(x,y-1)){c.fillStyle='rgba(255,255,255,.55)';c.fillRect((x+1)*U,(y+1)*U,U,U/3)}}})();

/* ---------- language (TH / EN) ---------- */
const LANG=(()=>{try{const v=localStorage.getItem('kpd_lang');if(v==='th'||v==='en')return v}catch(e){}return /^th/i.test(navigator.language||'')?'th':'en'})();
