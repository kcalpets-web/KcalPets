const Q = await import('/home/user/KcalPets/newgame/src/quests.js'), D = await import('/home/user/KcalPets/newgame/src/data.js');
const KN = { sylvaren: ['🌿', 'ซิลวาเรน', 'ต้นไม้แม่'], navalee: ['🌊', 'นาวาลี', 'เทศกาลลอยโคมกับระฆัง'], asrah: ['🏜️', 'อัสราห์', 'ตลาดโคมไฟกับแผนที่นาฬิกาแดด'], frosthelm: ['❄️', 'ฟรอสต์เฮล์ม', 'ผนึกของราชินีกับเตาผิง'], valkara: ['🌋', 'วัลคารา', 'เตาหลอมใหญ่'], deadgar: ['💀', 'เดดการ์', 'ความจริงของเมฆทมิฬ'] };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const qd = id => { const q = Q.KQUEST[id]; let how = ''; if (q.t === 'steps') how = q.steps.map(P => ({ talk: '💬 คุย', shop: '🛒 ร้านเมืองท่า', at: '📍 ไปที่จุด', pick: '✨ เก็บของ (มีมอนสเตอร์เฝ้า)', escort: '🚶 พาเดินไป' })[P.do]).join(' → '); const r = q.reward || {}; return `<div class="q"><span class="k">${esc(q.kind2 || '')}</span><b>${esc(q.text)}</b>${how ? `<small>${how}</small>` : ''}<i>“${esc(q.ask || '')}”</i><em>รางวัล ❤️+1${r.coin ? ' · 🪙' + r.coin : ''}${r.gem ? ' · 💎' + r.gem : ''}</em></div>` };
let nav = '', body = '', total = 0;
for (const k of Object.keys(KN)) { const [ic, nm, th] = KN[k], L = Q.KQ[k].npcs.filter(n => n.story); total += L.length * 3; nav += `<a href="#${k}">${ic} ${nm}</a>`;
  body += `<section id="${k}"><h2>${ic} ${nm} <span>${L.length} คน · ${L.length * 3} เควส · ${th}</span></h2>${k === 'sylvaren' ? '<p class="done">✅ ขึ้นเว็บแล้ว (v5.19)</p>' : ''}<div class="grid">`;
  for (const n of L) { const S = n.story, to = S.ref && Q.KQ[k].npcs.find(x => x.id === S.ref.to);
    body += `<article><header><span class="av">${n.icon}</span><div><b>${esc(n.name)}</b><small>${esc(n.job)}${S.after ? ' · เริ่มหลังกู้อาณาจักร' : ''}</small></div></header><ol>
      <li><span class="h">🤍 0</span><p>“${esc(S.cold)}”</p></li><li><span class="h">❤️ 1</span>${qd(S.q[0])}</li><li><span class="h">❤️ 2</span><p class="clue">💡 ${esc(S.clue)}</p></li><li><span class="h">❤️ 3</span>${qd(S.q[1])}</li>
      <li><span class="h">❤️ 4</span><p class="ref">👉 แนะนำ <b>${to ? to.icon + ' ' + esc(to.name) : ''}</b> — “${esc(S.ref.say)}”</p></li><li><span class="h">❤️ 5</span>${qd(S.q[2])}</li></ol></article>` }
  body += `</div></section>` }
const fs = await import('fs'); const tpl = fs.readFileSync('' + new URL('story-quests-tpl.html', import.meta.url).pathname + '', 'utf8');
fs.writeFileSync('/tmp/story-quests.html', tpl.replace('%%NAV%%', nav).replace('%%BODY%%', body).replace(/%%TOTAL%%/g, total));
