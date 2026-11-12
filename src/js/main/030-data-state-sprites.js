
function setLang(v){try{localStorage.setItem('kpd_lang',v)}catch(e){}location.reload()}
function langCard(){return '<div class="card"><div class="row sp"><h3>ภาษา · Language</h3></div><div class="row"><button class="btn sm'+(LANG==='th'?' go':'')+'" data-lang="th" style="flex:1">ไทย</button><button class="btn sm'+(LANG==='en'?' go':'')+'" data-lang="en" style="flex:1">English</button></div></div>'}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-lang]');if(b&&b.dataset.lang!==LANG)setLang(b.dataset.lang)});
document.documentElement.lang=LANG;
(function(){if(LANG!=='en')return;const roots=[document.getElementById('app'),document.getElementById('cover')];
  for(const r of roots){if(!r)continue;const w=document.createTreeWalker(r,NodeFilter.SHOW_TEXT);const L2=[];while(w.nextNode())L2.push(w.currentNode);
    for(const n of L2){const t=n.nodeValue.trim();if(t&&EN[t])n.nodeValue=n.nodeValue.replace(t,EN[t])}
    r.querySelectorAll('[aria-label]').forEach(e=>{const t=e.getAttribute('aria-label');if(EN[t])e.setAttribute('aria-label',EN[t])})}})();
const VER='1.36';
const CHANGES=[{v:'0.97',items:[TL('🏠 ห้องของน้องกดได้! แตะของในห้องเพื่อไปยังเมนูต่างๆ ประตู = ผจญภัย บาร์เบล = ออกกำลังกาย ชามอาหาร = ป้อนพลัง ฯลฯ ของที่เรืองแสงกดได้ · กดค้างดูชื่อ'),TL('☰ เมนูรวมปุ่มเดียว ปุ่มใหญ่ แบ่งเป็นหน้า · ห้องน้องกว้างขึ้น'),TL('🔁 โหมดฟาร์ม: ด่านที่ผ่านแล้วสุ่มแมพใหม่ทุกครั้ง เก็บเศษได้ไม่จำกัด'),TL('📅 เช็กอินรายวัน · 🏆 ความสำเร็จ 22 อย่าง · 🛍️ ร้านแลกเศษ (สกิน เอฟเฟกต์ ขนม ไข่) อยู่ที่บอร์ดบนผนัง'),TL('🔤 ปรับขนาดตัวอักษร 3 ระดับ และฟอนต์อ่านง่าย ในตั้งค่า · แถบด้านบนเหลือค่าเดียว "วันนี้ป้อนแล้ว"'),TL('🏰 เรียกใหม่: หอคอยราตรี · ชั้น · ผู้เฝ้าชั้น · ชั้น 9 ระเบียงดวงดาว'),TL('🌙 ธาตุธรรมดาสีแสงจันทร์ · วันแรกป๊อปอัปน้อยลง บทสอนเหลือ 3 หน้า'),TL('🌙 ปกเกมใหม่: กองทัพน้องๆ เผชิญหน้าฝูงมอนสเตอร์ หน้าหอคอยราตรี และเงาของบอสตัวสุดท้าย')]},{v:'0.96',items:[TL('🤗 ลูบน้องได้ไม่จำกัด แตะหัว ลูบท้อง ลากนิ้วลูบ หรือแตะรัวๆ น้องตอบสนองต่างกัน · นกกระพือปีก เต่าหดตัว'),TL('⚔️ ผู้เล่นใหม่เริ่มที่โหมดสั่งเอง พร้อมคำแนะนำวิธีสู้ · เป้าโจมตีมีลูกศรและวงแหวนชัดเจน โหมดออโต้ก็ตีตามเป้าที่เลือก'),TL('🥚 ไข่และดักแด้ไม่บอกตัวเลข Kcal แล้ว ดูจากหลอดและอาการของน้องแทน ลุ้นกว่าเดิม'),TL('👥 ช่องทีม 2 และ 3 ปลดล็อกด้วย Kcal ได้ (500 / 1,500) หรือชนะบอสเหมือนเดิม'),TL('🐾 แก้บั๊ก: น้องตอนต่อสู้และในดันเจี้ยนแสดงเป็นก้อนกลม ตอนนี้เห็นร่างและสีธาตุจริงแล้ว')]},{v:'0.95',items:[TL('🍎 แก้บั๊ก: น้องที่ขาดอีกไม่ถึง 50 Kcal ป้อนไม่ได้ ตอนนี้ซื้ออาหารราคาปกติได้ หลอดเต็มพอดี')]},{v:'0.94',items:[TL('✨ ระบบเติบโตใหม่: ไข่ → ภูตแสง → ดักแด้ Lv 6 → สายพันธุ์ · Lv 9 และ 12 โตเองอัตโนมัติ'),TL('🔥 ธาตุมาจากกิจกรรมที่ทำช่วงเป็นไข่ คิดเป็น % ตามนาที'),TL('⚔️ แต้มค่าพลังที่จัดกำหนดสาย นักล่า / ป้องกัน / พลังชีวิต / สัตว์เลี้ยง · ดาวการเลี้ยง + หัวใจ + โบนัสไข่ กำหนดระดับ'),TL('🎨 ทุกสายพันธุ์มีครบ 4 ธาตุ · 📖 สมุดสะสมใหม่ 4 สาย ดูวิธีเลี้ยงและแลกตัวที่ยังไม่มีได้'),TL('🥚 ไข่อยู่ในเครื่องฟักไข่ ไม่เดินในฟาร์มแล้ว · 🐛 ดักแด้ห้อยอยู่บนต้นไม้'),TL('👆 แท็บต่างๆ ใหญ่ขึ้น กดง่าย เห็นชัดว่าเลือกอันไหนอยู่')]},{v:'0.93',items:[TL('🦋 วิวัฒนาการผ่านดักแด้! น้องถึง Lv 6, 9 และ 12 จะเข้าดักแด้ เลี้ยงแบบไข่ แล้วกดออกเอง · ดาวการเลี้ยง 3 ดวง มีโอกาสไต่ระดับ 65% · ไม่มีลดระดับ'),TL('🧭 ช่วงดักแด้ทำกิจกรรมไหนนานสุด น้องจะเอียงไปทางธาตุนั้น (วิ่ง/เวท 🔥 · ว่ายน้ำ 💧 · ปั่น/อื่นๆ 🍃 · เดิน ⚪)'),TL('♥ หัวใจความผูกพัน: ออกกำลังกาย ป้อนอาหาร ลูบหัวทุกวัน หัวใจเต็ม 5 ดวง ได้ดาวการเลี้ยง +1'),TL('🐯🦅🦄 น้องใหม่ 3 ตัว: เสือพงไพร (Epic ใบไม้) · อินทรีเพลิง (Epic ไฟ) · เพกาซัสรุ่งอรุณ (Legendary ปกติ) · กิเลนมี 4 ขาแล้ว'),TL('⏱️ บันทึกเองใส่จำนวนนาทีได้ ใส่แค่นาทีหรือแค่ Kcal เกมคำนวณอีกช่องให้ตามกิจกรรมและน้ำหนัก')]},{v:'0.92',items:[TL('แตะปุ่มเร็วๆ 2 ครั้งแล้วหน้าจอไม่ซูมเข้าอีกแล้ว (ยังใช้สองนิ้วซูมได้ตามปกติ)')]},{v:'0.91',items:[TL('🎮 กดปุ่มลูกศร 1 ครั้ง = เดิน 1 ช่องเสมอ · กดค้างเกินครึ่งวินาทีถึงจะเดินต่อเนื่อง')]},{v:'0.90',items:[TL('🎮 ปุ่มลูกศรใหญ่ขึ้น · กดค้างแล้วลากนิ้วไปปุ่มอื่นเพื่อเปลี่ยนทางได้เลย ไม่ต้องยกนิ้ว · ปุ่มที่กดอยู่จะสว่าง · เดินชนกำแพงมีเสียงและสะดุดให้รู้')]},{v:'0.89',items:[TL('🎮 ปุ่มลูกศรเดินในดันเจี้ยน กดค้างเพื่อเดินต่อเนื่อง · เปิดหรือปิดได้ที่ปุ่ม 🎮 มุมบน'),TL('แตะเดินแล้วมีจุดบอกเส้นทาง · แตะในที่มืด น้องจะเดินไปจุดที่สว่างใกล้ที่สุดแทนการเดาทาง · เข้าดันเจี้ยนครั้งแรกมีวิธีเดินบอก'),TL('⚡ ลุยทั้งแมพด่วน: เฟสที่ชนะบอสแล้ว สู้มอนสเตอร์ทั้งแมพอัตโนมัติในครั้งเดียว ได้รางวัลเหมือนเดินเอง (ไม่รวมหีบ)'),TL('น้ำหนักและส่วนสูงใส่ทศนิยมได้ เช่น 76.5 กก. · 176.5 ซม.')]},{v:'0.88',items:[TL('💎 ปรับเศษดันเจี้ยน: มอนสเตอร์ 1 · จ่าฝูง 2 · ผู้พิทักษ์ 3 (เดือนละครั้งต่อด่าน) · หีบ 1 · หีบใหญ่ 2 · สู้ซ้ำไม่ได้เศษเพิ่ม')]},{v:'0.87',items:[TL('🐣 ผู้เล่นใหม่: ไข่ใบแรกฟักทันทีที่บันทึกการออกกำลังกายครั้งแรก ได้น้องและออกผจญภัยได้ตั้งแต่วันแรก'),TL('📜 ภารกิจลูบหัวน้องและลุยด่านแสดงความคืบหน้า เช่น 1 / 3'),TL('ชุดที่ได้จากอีเวนต์ตอนยังไม่มีน้องที่ฟักแล้ว จะเก็บเข้าตู้เสื้อผ้าไว้ก่อน')]},{v:'0.86',items:[TL('🥚 ตู้ฟักไข่! ไข่ปริศนาฟักเป็นใครขึ้นอยู่กับการออกกำลังกายระหว่างเลี้ยง · ยิ่งได้ดาวการเลี้ยงมาก ยิ่งมีโอกาสได้น้องหายาก · ช่วงเป็นไข่ป้อนได้ไม่จำกัดรายวัน · ฟักได้เมื่อไข่ถึง Lv 3'),TL('ร้านไข่ 200 Kcal · ตู้สุ่มไข่ 300 Kcal ลุ้นไข่เงิน (+1 ดาว) และไข่ทอง (+2 ดาว) · ผู้เล่นเดิมได้ไข่ฟรี 1 ใบ'),TL('✨ ส่งน้องกลับสู่ท้องฟ้า แลกเป็นจิตวิญญาณแห่งป่า · 💎 ดันเจี้ยนดรอปเศษตามเฟส เก็บไว้แลกสกินฟาร์มในอัปเดตหน้า')]},{v:'0.85',items:[TL('⚖️ เลือกได้ว่าจะจัดแต้มสเตตัสอัตโนมัติ หรือจัดแต้มด้วยตัวเอง (เพิ่ม HP · ATK · DEF · ฟื้นพลัง แล้วกดยืนยัน) · ถามครั้งแรกตอนเลเวลอัป')]},{v:'0.84',items:[TL('ตู้เสื้อผ้าใช้ร่วมกันทั้งฟาร์ม แต่ 1 ชิ้นใส่ได้ทีละตัว · ชิ้นที่น้องตัวอื่นใส่อยู่จะไม่อยู่ในตู้ ถอดออกก่อนถึงจะกลับเข้าตู้')]},{v:'0.82',items:[TL('👗 ตู้เสื้อผ้า 4 ช่อง: หัว · ใบหน้า · สกิน (เปลี่ยนสีทั้งตัว) · เอฟเฟกต์ (ค้างคาว ผีน้อยลอยรอบตัว) ใส่พร้อมกันได้ทุกช่อง'),TL('🎃 อีเวนต์ฮาโลวีนแจกเพิ่มเป็น 9 ชิ้น: หน้ากากผี ค้างคาวบินวน สกินฟักทอง ผีน้อยลอย สกินโครงกระดูก + ของเดิม · ใครเผาผลาญถึงแล้วได้ทันที')]},{v:'0.81',items:[TL('📖 เรื่องราว Kcal Pets: Endless Night! มีคัตซีนบทนำ และฉากจบเฟส 1 หลังชนะบอสครั้งแรก · ดูซ้ำได้ใน เมนู → สมุดเรื่องราว'),TL('หอคอยไม่รีเซ็ตแล้ว ผ่านแล้วผ่านเลย · ต้นเดือนรีเซ็ตแค่รางวัลประจำเดือน ด่านที่มี 🎁 รับ ⭐ ได้อีกครั้ง'),TL('⚡ ผ่านด่านด่วน: จ่าย Kcal เพื่อรับรางวัลประจำเดือนของด่านที่เคยผ่าน ไม่ต้องสู้ซ้ำ')]},{v:'0.80',items:[TL('💾 บันทึกไฟล์สำรอง และ 📂 เปิดไฟล์สำรอง ในหน้าตั้งค่า ส่งเก็บไว้ใน LINE Keep หรือ Google Drive ได้ · รหัสสำรองสั้นลงมาก (รหัสเก่ายังใช้ได้)'),TL('ถ้าเปิดเกมในแอป LINE จะมีคำแนะนำให้เปิดใน Safari/Chrome เพื่อไม่ให้เซฟหาย'),TL('เตือนตอนป้อนพลังน้องที่ยังไม่ได้อยู่ในทีม · มอนสเตอร์ขวางทางมีลุ้นขนม · เขาปีศาจเปลี่ยนเป็นสีม่วง')]},{v:'0.79',items:[TL('ดันเจี้ยน: ต้องกำจัดมอนสเตอร์ทุกตัวในแมพก่อน ผนึกของผู้พิทักษ์ด่านถึงจะหายไป · ดูจำนวนที่เหลือได้มุมบน'),TL('จ่าฝูงไม่ใช่ตัวเสริมแล้ว ปรับความแข็งให้พอดีกับด่าน')]},{v:'0.78',items:[TL('🔦 ผจญภัยแบบสำรวจ: ทุกด่านเป็นแมพมืดให้เดินสำรวจเอง แตะพื้นเพื่อเดิน แมพจะสว่างตามทางที่น้องเดินผ่าน'),TL('เจอมอนสเตอร์ขวางทาง จ่าฝูง (ไม่บังคับ) และผู้พิทักษ์ด่าน ชนะผู้พิทักษ์แล้วบันไดจะเปิดไปด่านถัดไป'),TL('หีบสมบัติ และทางลับที่ต้องใช้น้องธาตุน้ำ ไฟ หรือใบไม้ในทีม · ออกกำลังกายวันนี้ ตะเกียงจะสว่างขึ้น'),TL('ด่านที่ผ่านแล้วกด ⚔️ สู้ซ้ำทันที ได้เหมือนเดิม')]},{v:'0.77',items:[TL('🎃 อีเวนต์ฮาโลวีน (15 ต.ค. – 7 พ.ย.) เผาผลาญ Kcal จากการออกกำลังกาย ปลดล็อกชุดฟรี 4 ชิ้น: หมวกฟักทอง โบว์ค้างคาว หมวกแม่มด เขาปีศาจ'),TL('ตู้เสื้อผ้า: แตะน้องในฟาร์ม → แต่งตัว ชุดจะโชว์ทั้งในบ้าน ฟาร์ม การต่อสู้ และหน้าจับเวลา'),TL('ทุกคนได้แว่นเท่ฟรี 1 อัน ลองใส่ได้เลย')]},{v:'0.76',items:[TL('ปุ่มเมนู ☰ ย้ายมาแถบล่างข้างปุ่มผจญภัย กดง่ายด้วยนิ้วโป้ง · ป้ายเป้าหมายด้านบนกว้างเต็มจอ'),TL('ลู่วิ่ง: ความชันอยู่ซ้าย ความเร็วอยู่ขวา · เอาปุ่มความเร็วสำเร็จรูปออก ปรับด้วย − / + ได้เลย')]},{v:'0.75',items:[TL('จับเวลาแบบใหม่: เดิน/วิ่งเป็นแบบลู่วิ่ง ปรับความเร็วและความชันได้ (คิด Kcal ตามสูตร ACSM) มีปุ่มความเร็วสำเร็จรูปสำหรับเดินวิ่งข้างนอก'),TL('กิจกรรมอื่นเด้งถามความเหนื่อยทุก 10 นาที และตอนจบ ตอบง่ายด้วยการทดสอบการพูด'),TL('เมนูใหม่ ❤️ ข้อมูลสุขภาพ: ใส่น้ำหนักตัวเพื่อให้ Kcal แม่นขึ้น เก็บในเครื่องเท่านั้น · น้องออกกำลังกายเป็นอนิเมชันระหว่างจับเวลา')]},{v:'0.74',items:[TL('ปุ่มภารกิจย้ายมาอยู่มุมขวาล่างของจอ เหนือปุ่มผจญภัย กดง่ายด้วยนิ้วโป้ง · บอกความคืบหน้า เช่น 1/3 และเด้งเมื่อมีรางวัลรอรับ'),TL('ป้ายเป้าหมายแนะนำให้ป้อนพลังเฉพาะเมื่อมี Kcal พอซื้ออาหารอย่างน้อย 1 อย่าง (50 Kcal)')]},{v:'0.73',items:[TL('จับเวลาออกกำลังกายได้แล้ว! ไม่มีนาฬิกาก็บันทึกได้ เลือกกิจกรรม กด ⏱️ เริ่ม ออกกำลังเสร็จกดจบ เกมประมาณ Kcal ให้'),TL('เวลายังเดินต่อแม้ล็อกจอหรือปิดแอป · พักชั่วคราวได้ · ปรับความหนัก เบา/ปานกลาง/หนัก ได้'),TL('ปุ่มจบการจับเวลาเป็นแบบกดค้าง 3 วินาที กันเผลอแตะระหว่างออกกำลังกาย')]},{v:'0.72',items:[TL('ฟาร์มมีชีวิต! กด 🏡 ฟาร์มและทีม แล้วดูน้องๆ วิ่งเล่น ว่ายน้ำในบ่อ ปีนต้นไม้ และอาบแดดข้างกองไฟ ตามธาตุของตัวเอง'),TL('ฉากเปลี่ยนตามเวลาจริง กลางวัน เย็น และกลางคืน (หลัง 22:00 น้องเข้านอน) · ไข่ที่ยังไม่ฟักนอนรออยู่ในรัง'),TL('แตะน้องในฟาร์มเพื่อป้อนพลังหรือดูรายละเอียด · ปุ่ม 📋 ทีมและน้องทั้งหมด ใช้จัดทีมและขยายฟาร์ม')]},{v:'0.71',items:[TL('ฟอนต์ไทย: บ กว้างขึ้นและก้นแบน แยกจาก ข ได้ชัด (ข แคบกว่า ก้นมน)')]},{v:'0.70',items:[TL('ตั้งชื่อกิจกรรมเองได้เมื่อเลือก ✨ อื่นๆ เช่น โยคะ เต้น แบดมินตัน · ชื่อที่ใช้บ่อยกดเลือกซ้ำได้')]},{v:'0.69',items:[TL('เกมมี 2 ภาษาแล้ว: ไทย และ English เลือกได้ที่ ⚙️ ตั้งค่า (ครั้งแรกเลือกตามภาษาของเครื่อง)')]},{v:'0.68',items:[TL('ตัวหนังสือภาษาไทยทั้งเกมเป็นฟอนต์พิกเซลแล้ว (ตัวหนา อ่านง่าย) เข้าชุดกับตัวเลข ตัวอังกฤษ และไอคอน'),TL('อีโมจิทั้งหมดในเกมเป็นภาพพิกเซล')]},{v:'0.66',items:[TL('ไอคอนทั้งเกมเปลี่ยนเป็นภาพพิกเซล เข้าชุดกับน้องและดันเจี้ยน: เมนู ฟาร์ม อาหาร ภารกิจ ป้ายเป้าหมาย และหน้าวิธีเล่น'),TL('ตัวเลขใช้ฟอนต์พิกเซลชุดใหม่ที่วาดเองสำหรับเกมนี้ อ่านง่ายขึ้น เลข 5 กับ 8 ไม่สับสนอีก'),TL('ไอคอนออกกำลังกายเป็นบาร์เบล'),TL('อีโมจิที่เหลือทั้งเกมเปลี่ยนเป็นไอคอนพิกเซลทั้งหมด (ประเภทการออกกำลังกาย ธาตุ ปุ่มต่อสู้ รางวัล ข้อความ)')]},{v:'0.65',items:[TL('ป้อนพลังแบบใหม่: เลือกอาหารจากเมนูให้น้อง 8 อย่าง ตั้งแต่ 🍎 แอปเปิล 50 Kcal ถึง 🎂 เค้กฉลอง 2,000 Kcal'),TL('ใส่อาหารลงจานได้หลายอย่าง แตะในจานเพื่อเอาออก มีปุ่มจัดจานให้อัตโนมัติ')]},{v:'0.64',items:[TL('เมนูกระชับขึ้น: ป้อนพลัง น้อง กาชา และพักผ่อน ย้ายเข้าไปอยู่ใน 🏡 ฟาร์มและทีม'),TL('ในฟาร์ม แตะรูปน้องแล้วเลือก 🍖 ป้อนพลัง หรือ 📋 ดูรายละเอียด ได้เลย'),TL('ด้านบนของฟาร์มมีปุ่ม 🥚 กาชา และ 🌙 พักผ่อน')]},{v:'0.63',items:[TL('ย้ายเมนูไปไว้มุมขวาบนของจอ กดแล้วไอคอนฟังก์ชันเด้งออกมาให้เลือก'),TL('ด้านล่างเหลือปุ่มผจญภัยปุ่มเดียว ออกกำลังกายและป้อนพลังย้ายเข้าเมนู (ไอคอนที่ควรกดต่อจะมีกรอบส้ม)'),TL('จุดชมพูบนปุ่มเมนูบอกว่ามีรางวัลภารกิจรอรับ'),TL('พื้นที่ฉากน้องกว้างขึ้น เพราะเอาแถบเมนูด้านล่างออก')]},{v:'0.62',items:[TL('ทุกระบบรายวันรีเซ็ตพร้อมกันเวลา 00:00 ทั้งภารกิจ โควตาป้อนพลัง ลูบหัว EXP ชนะซ้ำ และ EXP พักผ่อน')]},{v:'0.61',items:[TL('ภารกิจรายวันรีเซ็ตตอนเที่ยงคืน (00:00)'),TL('หน้าภารกิจบอกเวลาที่เหลือก่อนรอบใหม่')]},{v:'0.6',items:[
 TL('มีเสียงแล้ว! เสียงประกอบ 8-bit ทุกจังหวะ ทั้งลูบหัว ป้อนพลัง เลเวลอัป ต่อสู้ และเปิดไข่'),
 TL('เพลงพื้นหลังหน้าแรกและฉากต่อสู้ (เริ่มแบบปิดไว้ เปิดได้ที่ตั้งค่า)'),
 TL('ตั้งค่าเสียง: เพิ่ม/ลดเสียงรวม เพลง และเสียงประกอบแยกกัน หรือกดปิดเสียงทั้งหมด')]},{v:'0.5',items:[
 TL('แถบเป้าหมายบนหน้าแรก บอกว่าตอนนี้ควรทำอะไรต่อ แตะแล้วไปหน้านั้นทันที'),
 TL('ภารกิจรายวัน 3 ข้อ รับขนมกับจิตวิญญาณแห่งป่า · สะสมตราประทับครบ 7 ดวงได้ไข่ฟรี'),
 TL('ขนมใช้ได้ในหน้าป้อนพลัง (+40 EXP ไม่นับรวมโควตารายวัน)'),
 TL('วิธีเล่นสำหรับมือใหม่ เปิดดูซ้ำได้จากเมนู ❓ วิธีเล่น')]},{v:'0.4',items:[
 TL('หอคอย 100 ด่าน 10 เฟส ชนะบอสแล้วเปิดเฟสถัดไป · ต้นเดือนรีเซ็ตด่าน รับรางวัลครั้งแรกใหม่ได้'),
 TL('แต่ละเฟสมีฉาก มอนสเตอร์ และธาตุของตัวเอง ธาตุที่ได้เปรียบตีแรงขึ้น 25%'),
 TL('Energy หลอด 100 ติดตัวน้องข้ามด่าน สกิลใช้ 20–100 · ฟื้นพลังในการต่อสู้เร็วขึ้นตามเลเวล'),
 TL('เปิดโหมดพักผ่อน 🌙 วางมือถือแล้วน้องในทีมฟื้น Energy นาทีละ 10 · นอกนั้นฟื้นเองชั่วโมงละ 10'),
 TL('ระบบดาว ★1–5 ใช้จิตวิญญาณแห่งป่าอัปขั้น เพิ่ม HP/ATK/DEF ขั้นละ 8%'),
 TL('ช่องทีมที่ 3 เปิดเมื่อชนะบอสเฟส 2')]},{v:'0.3',items:[
 TL('น้องครบ 30 สายพันธุ์ 4 ระดับ Basic · Rare · Epic · Legendary แต่ละตัวมี 5 ร่าง'),
 TL('เปิดกาชาตู้เดียว 200 Kcal/ใบ มีการันตี Epic ใน 10 ใบ และ Legendary ใน 40 ใบ'),
 TL('ได้ตัวซ้ำเปลี่ยนเป็นจิตวิญญาณแห่งป่า แลกน้องที่ยังไม่มีได้ · สมุดสะสม 30 ช่อง'),
 TL('ฟาร์มและทีม: ใส่น้องเข้าทีมตามช่องที่ปลดล็อก ตั้งตัวหลัก ขยายฟาร์ม'),
 TL('ทีมเดินเล่นด้วยกันบนหน้าแรก ลูบหัวได้ทุกตัว · ป้อนพลังเลือกตัวได้'),
 TL('ต่อสู้เป็นทีม น้องทุกตัวในทีมลงมือคนละครั้งต่อตา')]},{v:'0.2',items:[
 TL('เปิดโหมดผจญภัย เฟส 1 ถ้ำคริสตัล 10 ด่าน มีบอสด่านสุดท้าย'),
 TL('ระบบต่อสู้ผลัดกันตี ใช้สกิลตามเลเวลน้อง มีคริติคอล'),
 TL('สั่งเองได้ ให้น้องช่วยเลือกท่า หรือเปิดออโต้ เร่งความเร็ว ×2'),
 TL('ผ่านด่านครั้งแรกได้ EXP + จิตวิญญาณแห่งป่า · ชนะบอสได้ไข่ฟรี'),
 TL('ทุกด่านบอกเลเวลแนะนำ และบอกว่าต้องออกกำลังอีกเท่าไหร่')]},{v:'0.1',items:[
 TL('เริ่มเกมด้วยไข่ฟรี 1 ใบ สุ่มจากน้อง 4 ตัวเริ่มต้น'),
 TL('บันทึกการออกกำลังกาย ได้เหรียญตามเวลา'),
 TL('ป้อนพลังให้น้อง อัปเลเวล 1–12 เปลี่ยนร่าง 5 ร่าง'),
 TL('ค่าพลัง 4 สาย จัดแต้มอัตโนมัติหรือจัดเอง รีเซ็ตแต้มได้'),
 TL('ปริมาณที่น้องย่อยได้ต่อวัน ปรับเองทุกสัปดาห์ตามการออกกำลังจริง'),
 TL('ลูบหัวน้องได้ EXP · บันทึกอัตโนมัติ · รหัสสำรองข้อมูล')]}];
const KEY='kpd_save_v1';

/* ---------- data ---------- */
const SPECIES={
 shiba:{name:TL('หมาชิบะ'),el:'normal',c:{main:'#e3893b',belly:'#f7e6c4',acc:'#2c2230',acc2:'#d94a3a',gold:'#ffd34d',feet:'#f7e6c4'}},
 chick:{name:TL('ลูกไก่ถ่านไฟ'),el:'fire',c:{main:'#e8563b',belly:'#ffd166',acc:'#ff9a1f',acc2:'#ffe9a0',gold:'#ffd34d',feet:'#ff9a1f'}},
 bunny:{name:TL('กระต่ายใบไม้'),el:'leaf',c:{main:'#86c86f',belly:'#f4f0d6',acc:'#3e8f4c',acc2:'#ff9fb6',gold:'#ffd34d',feet:'#f4f0d6'}},
 penguin:{name:TL('เพนกวินคราม'),el:'water',c:{main:'#3e56b9',belly:'#f2f6ff',acc:'#ff9c3d',acc2:'#7fd8ff',gold:'#ffd34d',feet:'#ff9c3d'}},
 m_slime:{name:TL('วุ้นน้อย'),el:'normal',kind:'slime',c:{main:'#5fcf6a',belly:'#c8f5b0',acc:'#2f7d4a',acc2:'#e9ffd9',gold:'#ffd34d',feet:'#5fcf6a'}},
 m_slime2:{name:TL('วุ้นฟ้า'),el:'normal',kind:'slime',c:{main:'#5aa8f0',belly:'#c4e6ff',acc:'#2f5d9d',acc2:'#e6f6ff',gold:'#ffd34d',feet:'#5aa8f0'}},
 m_bat:{name:TL('ค้างคาวถ้ำ'),el:'normal',kind:'bat',c:{main:'#6b5aa6',belly:'#c9b8f0',acc:'#3f3270',acc2:'#ff6b8b',gold:'#ffd34d',feet:'#3f3270'}},
 m_bat2:{name:TL('ค้างคาวม่วง'),el:'normal',kind:'bat',c:{main:'#9a4fc4',belly:'#e3b8ff',acc:'#5b2a80',acc2:'#ffd34d',gold:'#ffd34d',feet:'#5b2a80'}},
 m_shroom:{name:TL('เห็ดพิษ'),el:'normal',kind:'shroom',c:{main:'#d9483b',belly:'#f2e6d0',acc:'#ffffff',acc2:'#ffe08a',gold:'#ffd34d',feet:'#f2e6d0'}},
 m_shroom2:{name:TL('เห็ดราชา'),el:'normal',kind:'shroom',crown:1,c:{main:'#8e44c9',belly:'#efe2cf',acc:'#ffe9a0',acc2:'#ffd34d',gold:'#ffd34d',feet:'#efe2cf'}},
 m_golem:{name:TL('โกเลมคริสตัล'),el:'normal',kind:'golem',c:{main:'#6f6aa0',belly:'#9893c4',acc:'#c99bff',acc2:'#8fd6ff',gold:'#ffd34d',feet:'#5a5588'}},
 mystery:{name:'???',el:'normal',c:{main:'#8b84b4',belly:'#dcd8f0',acc:'#5d5690',acc2:'#b9b2e0',gold:'#ffd34d',feet:'#dcd8f0'}},
 egg_s:{name:'???',el:'normal',c:{main:'#b8c4d8',belly:'#f4f8ff',acc:'#7a8aa8',acc2:'#ffffff',gold:'#ffffff',feet:'#f4f8ff'}},
 egg_g:{name:'???',el:'normal',c:{main:'#ffcf4a',belly:'#fff4c0',acc:'#d89a1a',acc2:'#fff8e0',gold:'#ffffff',feet:'#fff4c0'}}
};
const STARTERS=['shiba','chick','bunny','penguin'];
const ELEM={fire:{n:TL('ไฟ'),i:'🔥',g:'#ff8a3d'},ice:{n:TL('น้ำแข็ง'),i:'❄️',g:'#bfe8ff'},leaf:{n:TL('ใบไม้'),i:'🌿',g:'#8de07a'},earth:{n:TL('ดิน'),i:'🪨',g:'#c8a070'},thunder:{n:TL('สายฟ้า'),i:'⚡',g:'#ffe14a'},water:{n:TL('น้ำ'),i:'💧',g:'#6fd0ff'},normal:{n:TL('ปกติ'),i:'⚪',g:'#ffe6a6'}};
const FORMS=[{n:TL('ไข่'),from:0},{n:TL('วัยเด็ก'),from:1},{n:TL('วัยรุ่น'),from:6},{n:TL('ร่างสมบูรณ์'),from:11},{n:TL('ร่างสมบูรณ์'),from:99}];
const formIdx=lv=>lv>=11?3:lv>=6?2:1;

const pstage=p=>!p||p.egg?0:p.sp&&p.sp.indexOf('wisp_')===0?1:p.lv>=11?3:2;
const capLv=p=>p&&p.sp&&p.sp.indexOf('wisp_')===0?6:99;
const pform=p=>!p||p.egg||p.coc?0:p.sp.indexOf('wisp_')===0?1:Math.max(1,formIdx(p.lv));
const pspr=p=>pkey(p);
const PRESETS={bal:{n:TL('สมดุล'),i:'⚖️',d:[1,2,1]},atk:{n:TL('สายบุก'),i:'⚔️',d:[1,3,0]},tank:{n:TL('สายถึก'),i:'🛡️',d:[1,0,3]},skill:{n:TL('สายพลังชีวิต'),i:'❤️',d:[3,1,0]}};
const SK=['hp','atk','df'], SKN={hp:'HP',atk:'ATK',df:'DEF',en:TL('ฟื้นพลัง')}, SKT={hp:TL('พลังชีวิต'),atk:TL('โจมตี'),df:TL('ป้องกัน'),en:TL('Energy ต่อตา')};
const SKILLS=[{lv:1,n:TL('จู่โจม'),e:20,d:TL('แรง ×1.4 เป้าเดียว')},{lv:4,n:TL('ท่าธาตุ'),e:40,d:TL('แรง ×1.9 ใช้ธาตุของน้อง')},{lv:8,n:TL('โล่พิทักษ์'),e:60,d:TL('ฟื้น HP 30% · ดาเมจที่รับลดลงครึ่งหนึ่ง 2 ตา')},{lv:11,n:TL('พายุ'),e:80,d:TL('แรง ×1.6 โดนศัตรูทุกตัว')},{lv:14,n:TL('ไม้ตาย'),e:100,d:TL('แรง ×3.5 เป้าเดียว')}];
const ACTS=[{k:'walk',n:TL('เดิน'),i:'🚶',e:150},{k:'run',n:TL('วิ่ง'),i:'👟',e:300},{k:'bike',n:TL('ปั่นจักรยาน'),i:'🚴',e:250},{k:'swim',n:TL('ว่ายน้ำ'),i:'🏊',e:250},{k:'gym',n:TL('เวท'),i:'🏋️',e:120},{k:'etc',n:TL('อื่นๆ'),i:'✨',e:100}];
const MAXLV=15, CAP_MIN=1000, CAP_MAX=2500, CAP_START=1500, PET_CD=120000, PET_MAX=10;
const need=lv=>lv<6?lv*200:lv*360;
const STAT_PRE_CAP=100;const stats=p=>{const n=p.lv-1,q0=p.pts||{},fb=p.fruit||{},sr=SPECIES[p.sp]&&SPECIES[p.sp].r,m=(1+(sr?RAR[sr].b:0))*(1+STAR_B*((p.star||1)-1)),g=k=>Math.min(STAT_PRE_CAP,5+n+(q0[k]||0)+(fb[k]||0))*m;return{hp:g('hp'),atk:g('atk'),df:g('df'),en:15+.5*n}};
const STAT_CAP={hp:999,atk:999,df:999};
const fmt=n=>Math.round(n).toLocaleString('en-US');
const fmt1=n=>(Math.round(n*10)/10).toString();

/* ---------- state ---------- */
let S=null;
function fresh0(){return{v:1,ver:VER,seenVer:VER,created:Date.now(),dayOffset:0,wallet:0,totalKcal:0,pets:[],main:null,
  log:{},entries:[],weekStart:null,cap:CAP_START,capHist:[],fed:{d:null,amt:0},petting:{d:null,n:0,last:0},stages:{},stars:0,eggs:0,replay:{d:null,n:0},bmode:'manual',statAsk:'auto',bspeed:1,slots:1,team:[],farmCap:10,pity:{e:0,l:0},book:{},season:null,seasonHist:[],enT:Date.now(),detox:null,restExp:{d:null,n:0},wardrobe:{shades:1},ev:null,story:{},eggsS:0,eggsG:0,cry:0,fridge:[],frLv:0,quest:null,stamps:0,snacks:0,tutSeen:0}}
function save(){if(!S)return;try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}

const RESET_H=0;/* every daily system rolls over at 00:00 local time (owner 3 Nov) */
const dayIdx=()=>{const d=Math.floor((Date.now()-new Date().getTimezoneOffset()*60000+((24-RESET_H)%24)*3600000)/86400000)+(S?S.dayOffset:0);if(S&&!S.dayOffset){if(S.dayMax&&d<S.dayMax)return S.dayMax;S.dayMax=d}return d};
function dayLabel(d){const t=new Date((d-(S?S.dayOffset:0))*86400000+new Date().getTimezoneOffset()*60000+43200000);return t.getDate()+'/'+(t.getMonth()+1)}
const mainPet=()=>S.pets.find(p=>p.id===S.main);

/* ---------- colour helpers ---------- */
function h2r(h){h=h.replace('#','');return[0,2,4].map(i=>parseInt(h.slice(i,i+2),16))}
function r2hsl(r,g,b){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h=0,s=0;const l=(mx+mn)/2;
  if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h*=60}return[h,s,l]}
function hsl2hex(h,s,l){h=((h%360)+360)%360;s=Math.max(0,Math.min(1,s));l=Math.max(0,Math.min(1,l));
  const f=n=>{const k=(n+h/30)%12,a=s*Math.min(l,1-l);const c=l-a*Math.max(-1,Math.min(k-3,9-k,1));return Math.round(c*255).toString(16).padStart(2,'0')};return'#'+f(0)+f(8)+f(4)}
function toward(h,t,amt){const d=((t-h+540)%360)-180;return h+Math.sign(d)*Math.min(Math.abs(d),amt)}
function shades(hex){let[h,s,l]=r2hsl(...h2r(hex));let hs=h,ss=s;if(s<.2||l>.88){hs=240;ss=.22;return{hi:'#ffffff',base:hex,sh:hsl2hex(hs,ss,l*.86),ln:hsl2hex(hs,ss+.05,l*.7),out:hsl2hex(255,.35,.16)}}
  return{hi:hsl2hex(toward(h,55,12),s*.95,Math.min(.97,l+.13)),base:hex,sh:hsl2hex(toward(hs,255,16),Math.min(1,ss*1.08),l*.74),
    ln:hsl2hex(toward(hs,260,20),Math.min(1,ss*1.1),l*.52),out:hsl2hex(toward(hs,265,24),Math.min(1,Math.max(ss,.3)),Math.max(.07,l*.25))}}

/* ---------- sprite engine (original procedural pixel art) ---------- */
const G=48, spriteCache={};
function inside(p,x,y){
  if(p.t==='e'){const dx=(x-p.x)/p.rx,dy=(y-p.y)/p.ry;return dx*dx+dy*dy<=1}
  if(p.t==='tri'){const[a,b,c]=p.p;const s=(q,r,t)=>(q[0]-t[0])*(r[1]-t[1])-(r[0]-t[0])*(q[1]-t[1]);const P=[x,y];
    const d1=s(P,a,b),d2=s(P,b,c),d3=s(P,c,a);return!((d1<0||d2<0||d3<0)&&(d1>0||d2>0||d3>0))}
  return false}
function tone(p,x,y){if(p.flat)return'base';let nx,ny;
  if(p.t==='e'){nx=(x-p.x)/p.rx;ny=(y-p.y)/p.ry}else{const c=p.p.reduce((a,q)=>[a[0]+q[0]/3,a[1]+q[1]/3],[0,0]);
    const sz=Math.max(2,Math.max(...p.p.map(q=>Math.hypot(q[0]-c[0],q[1]-c[1]))));nx=(x-c[0])/sz;ny=(y-c[1])/sz}
  const d=-(nx*.62+ny*.78),r2=nx*nx+ny*ny;
  if(d>.5&&r2>.18)return'hi';if(d<-.36&&r2>.2)return'sh';return'base'}
function E(x,y,rx,ry,c,o){return Object.assign({t:'e',x,y,rx,ry,c},o||{})}
function T(p,c,o){return Object.assign({t:'tri',p,c},o||{})}
const mir=(pts,cx)=>pts.map(q=>[2*cx-q[0],q[1]]);
function geo(f){
  if(f===1)return{h:[24,25,9.6],b:[24,35.6,7.6,6.6],f:[[19.6,41.8,3,2],[28.4,41.8,3,2]]};
  if(f===2)return{h:[24,19.8,8.6],b:[24,32,9.6,8.6],f:[[18,41.2,3.6,2.6],[30,41.2,3.6,2.6]]};
  if(f===3)return{h:[24,17.4,8.9],b:[24,30.6,11,9.6],f:[[16.6,41,4,3],[31.4,41,4,3]]};
  return{h:[24,16.6,9.3],b:[24,30.2,11.8,10.2],f:[[16,41,4.3,3.1],[32,41,4.3,3.1]]};
}
function buildMon(k,crown){const P=[],D=[];
  if(k==='slime'){P.push(E(24,35,14,9.5,'main'),E(24,28,9,7.5,'main'),E(18,39,3,1.6,'belly',{noLine:1}),E(30,30,1.6,1.2,'acc2',{noLine:1}));return{P,D,mon:1,g:{h:[24,32,9]}}}
  if(k==='bat'){P.push(T([[20,26],[3,17],[9,36]],'acc'),T([[28,26],[45,17],[39,36]],'acc'),T([[9,24],[4,30],[12,33]],'main',{noLine:1}),T([[39,24],[44,30],[36,33]],'main',{noLine:1}),
    T([[17,22],[18,11],[23,19]],'main'),T([[31,22],[30,11],[25,19]],'main'),E(24,28,10,9,'main'),E(24,32,5.5,4.5,'belly'),E(21,38.5,1.6,1.6,'feet',{ft:1}),E(27,38.5,1.6,1.6,'feet',{ft:1}));
    D.push({x:22,y:31,w:1,h:2,c:'#ffffff'},{x:25,y:31,w:1,h:2,c:'#ffffff'});return{P,D,mon:1,g:{h:[24,27,8]}}}
  if(k==='shroom'){P.push(E(24,37,7.5,6.5,'belly'),E(19.5,43,2.6,1.6,'feet',{ft:1}),E(28.5,43,2.6,1.6,'feet',{ft:1}),E(24,25,15,9.5,'main'),
    E(17,22,2.4,1.9,'acc',{noLine:1}),E(27,19.5,2.8,2.1,'acc',{noLine:1}),E(32.5,25,2,1.6,'acc',{noLine:1}),E(22,28,1.7,1.3,'acc',{noLine:1}));
    if(crown)P.push(T([[17,17],[19,10],[21,16]],'gold'),T([[22,15.5],[24,8],[26,15.5]],'gold'),T([[27,16],[29,10],[31,17]],'gold'));
    return{P,D,mon:1,g:{h:[24,36.5,7]}}}
  if(k==='golem'){P.push(E(16,42,5,3.4,'feet',{ft:1}),E(32,42,5,3.4,'feet',{ft:1}),E(24,30,14,11,'main'),E(7.5,30,4.6,8,'belly'),E(40.5,30,4.6,8,'belly'),E(7.5,38,4,3,'main'),E(40.5,38,4,3,'main'),
    T([[20,34],[24,24],[28,34]],'acc'),T([[22,35],[24,29],[26,35]],'acc2',{noLine:1}),E(24,15,9,7.5,'main'),T([[17,10],[19,2],[22,9]],'acc2'),T([[22,8],[25,0],[28,8]],'acc'),T([[27,9],[30,3],[32,11]],'acc2'));
    return{P,D,mon:1,g:{h:[24,15.5,8.5]}}}
}
function build(sp,f){if(SPECIES[sp].base&&SPECIES[sp].base!==sp)sp=SPECIES[sp].base;
  if(SPECIES[sp].coc){const P=[E(24,30,9,13.2,'main'),E(24,32.5,5.4,9,'belly',{noLine:1}),E(24,23.5,8.6,1.1,'acc',{noLine:1}),E(24,30.8,9,1.1,'acc',{noLine:1}),E(24,38,7.8,1.1,'acc',{noLine:1}),E(24,15.6,1.3,3.2,'acc2'),T([[24.5,17.5],[31,12.5],[28,19.5]],'acc2'),E(19.5,34,1.6,1.6,'gold',{noLine:1}),E(29,26,1.2,1.2,'gold',{noLine:1})];return{P,D:[],egg:1,g:geo(1)}}
  if(SPECIES[sp].kind)return buildMon(SPECIES[sp].kind,SPECIES[sp].crown);
  if(SPECIES[sp].f&&f>0)return buildGen(sp,f);
  const P=[],D=[];const g=geo(Math.max(1,f));const[hx,hy,hr]=g.h,[bx,by,brx,bry]=g.b;
  if(f===0){ // egg
    P.push(E(24,31.5,9.6,11.6,'belly'));
    P.push(E(19.5,27,2.4,2,'main',{noLine:1}),E(28.6,33.5,2.8,2.2,'main',{noLine:1}),E(22.5,39,2.2,1.6,'main',{noLine:1}),E(29,25,1.6,1.4,'main',{noLine:1}));
    return{P,D,egg:1,g};
  }
  const back=[],front=[],head=[],top=[];
  const feet=g.f.map(q=>E(q[0],q[1],q[2],q[3],'feet',{ft:1}));
  const body=E(bx,by,brx,bry,'main'), bel=E(bx,by+bry*.16,brx*.6,bry*.7,'belly');
  const hd=E(hx,hy,hr,hr*.94,'main');
  if(sp==='shiba'){
    back.push(E(bx+brx*.9,by-bry*.35,3.4+f*.3,3.4+f*.3,'main'),E(bx+brx*.9+1,by-bry*.35-1,1.8,1.8,'belly'));
    const L=[[hx-hr*.98,hy-hr*.12],[hx-hr*.62,hy-hr*1.36],[hx-hr*.06,hy-hr*.74]];
    const Li=[[hx-hr*.8,hy-hr*.32],[hx-hr*.6,hy-hr*1.08],[hx-hr*.3,hy-hr*.7]];
    head.push(T(L,'main'),T(mir(L,hx),'main'),T(Li,'belly',{noLine:1}),T(mir(Li,hx),'belly',{noLine:1}));
    top.push(E(hx,hy+hr*.4,hr*.56,hr*.38,'belly'));
    D.push({k:'nose',x:Math.round(hx)-1,y:Math.round(hy+hr*.22),w:2,h:1,c:'#2a1b17'});
    D.push({x:Math.round(hx-hr*.42),y:Math.round(hy-hr*.42),w:2,h:1,c:'belly'},{x:Math.round(hx+hr*.42)-1,y:Math.round(hy-hr*.42),w:2,h:1,c:'belly'});
    if(f>=3){front.push(E(hx,hy+hr*.98,hr*.92,2.3,'acc2'));front.push(T([[hx+2,hy+hr*1.05],[hx+7,hy+hr*1.05+5],[hx+3,hy+hr*1.05+6]],'acc2'));
      D.push({k:'star',x:Math.round(bx)-2,y:Math.round(by-1),c:'gold'})}
    if(f>=4){top.push(T([[hx-5,hy-hr*.82],[hx-3.5,hy-hr*1.35],[hx-2,hy-hr*.82]],'gold'),T([[hx-1.6,hy-hr*.9],[hx,hy-hr*1.55],[hx+1.6,hy-hr*.9]],'gold'),T([[hx+2,hy-hr*.82],[hx+3.5,hy-hr*1.35],[hx+5,hy-hr*.82]],'gold'))}
  }
  if(sp==='chick'){
    back.push(T([[bx+brx*.6,by-1],[bx+brx*1.55,by-bry*.95],[bx+brx*.95,by+bry*.45]],'acc'),T([[bx+brx*.75,by],[bx+brx*1.3,by-bry*.6],[bx+brx*.95,by+bry*.25]],'acc2',{noLine:1}));
    front.push(E(bx-brx*.92,by-.5,2.6+f*.3,4+f*.4,'main'),E(bx+brx*.92,by-.5,2.6+f*.3,4+f*.4,'main'));
    const ch=f>=2?1.25:1;
    top.push(E(hx-2.8,hy-hr*1.0,1.8*ch,3*ch,'acc'),E(hx+2.8,hy-hr*1.0,1.8*ch,3*ch,'acc'),E(hx,hy-hr*1.12,2.3*ch,4*ch,'acc2'));
    top.push(T([[hx-2.3,hy+hr*.24],[hx+2.3,hy+hr*.24],[hx,hy+hr*.62]],'acc'));
    if(f>=3){front.push(E(bx-brx*.78,by-bry*.62,3.6,2.8,'gold'),E(bx+brx*.78,by-bry*.62,3.6,2.8,'gold'));
      front.push(T([[bx-brx*.95,by-bry*.8],[bx-brx*.8,by-bry*1.45],[bx-brx*.55,by-bry*.8]],'acc'),T([[bx+brx*.55,by-bry*.8],[bx+brx*.8,by-bry*1.45],[bx+brx*.95,by-bry*.8]],'acc'))}
    if(f>=4){top.push(E(hx-5,hy-hr*.95,1.6,3.2,'acc'),E(hx+5,hy-hr*.95,1.6,3.2,'acc'),E(hx,hy-hr*1.3,2.6,5,'gold'))}
  }
  if(sp==='bunny'){
    if(f>=3)back.push(T([[bx-2,by-bry*.6],[bx-brx*1.6,by-bry*1.4],[bx-brx*1.1,by+bry*.4]],'acc'),T([[bx+2,by-bry*.6],[bx+brx*1.6,by-bry*1.4],[bx+brx*1.1,by+bry*.4]],'acc'));
    back.push(E(bx+brx*.9,by+bry*.25,3,3,'belly'));
    const er=hr*(f>=2?.92:.82);
    head.push(E(hx-hr*.45,hy-hr*.62-er*.55,hr*.3,er,'acc'),E(hx+hr*.45,hy-hr*.62-er*.55,hr*.3,er,'acc'));
    head.push(E(hx-hr*.45,hy-hr*.62-er*.5,hr*.13,er*.66,'acc2',{noLine:1}),E(hx+hr*.45,hy-hr*.62-er*.5,hr*.13,er*.66,'acc2',{noLine:1}));
    top.push(E(hx,hy+hr*.42,hr*.42,hr*.28,'belly'));
    D.push({k:'nose',x:Math.round(hx)-1,y:Math.round(hy+hr*.26),w:2,h:1,c:'acc2'});
    if(f>=3)D.push({k:'flower',x:Math.round(bx),y:Math.round(by-bry*.25)});
    if(f>=4){top.push(E(hx-4,hy-hr*.82,1.8,1.8,'acc2'),E(hx,hy-hr*.98,2,2,'gold'),E(hx+4,hy-hr*.82,1.8,1.8,'acc2'))}
  }
  if(sp==='penguin'){
    front.push(E(bx-brx*.97,by-.5,2.4+f*.3,bry*.62,'main'),E(bx+brx*.97,by-.5,2.4+f*.3,bry*.62,'main'));
    top.push(E(hx,hy+hr*.28,hr*.72,hr*.58,'belly'));
    top.push(T([[hx-2,hy+hr*.32],[hx+2,hy+hr*.32],[hx,hy+hr*.66]],'acc'));
    top.push(E(hx,hy-hr*1.0,2.2,2.2,'acc2'),T([[hx-1.6,hy-hr*1.08],[hx,hy-hr*1.42],[hx+1.6,hy-hr*1.08]],'acc2'));
    if(f>=3){front.push(E(bx,by-bry*.12,brx*.42,bry*.4,'acc2'));D.push({k:'ring',x:Math.round(bx),y:Math.round(by-bry*.12)})}
    if(f>=4){top.push(T([[hx-6,hy-hr*.7],[hx-4,hy-hr*1.4],[hx-2.5,hy-hr*.75]],'acc2'),T([[hx+2.5,hy-hr*.75],[hx+4,hy-hr*1.4],[hx+6,hy-hr*.7]],'acc2'))}
  }
  P.push(...back,body,bel,...feet,...head,hd,...top,...front);
  return{P,D,g};
}
/* ---------- roster (30 pets) ---------- */
const RAR={B:{n:'Basic',c:'#c9c2e8',b:0,dupe:2,cost:0,p:55},R:{n:'Rare',c:'#7fd8ff',b:.03,dupe:5,cost:40,p:30},E:{n:'Epic',c:'#d9a3ff',b:.09,dupe:15,cost:120,p:12},L:{n:'Legendary',c:'#ffd34d',b:.15,/* owner 3 Nov: R +3% · E +9% · L +15% */dupe:40,cost:300,p:3}};
const GEM={fire:'#ffb347',ice:'#d8f2ff',leaf:'#8de07a',earth:'#d0a06a',thunder:'#fff06a',water:'#7fd8ff',normal:'#ffe08a'};
const PL=(main,belly,acc,acc2,feet,x)=>Object.assign({main,belly,acc,acc2,gold:'#ffd34d',feet:feet||main},x||{});
Object.assign(SPECIES,{
 mouse:{name:TL('หนูพริก'),el:'fire',r:'B',c:PL('#e2533f','#ffe2c4','#3f8a3a','#ff9fb0','#ffe2c4'),f:{ears:'round',inner:'acc2',face:'pink',tail:'thin',crest:'leaf',whisk:1}},
 gecko:{name:TL('จิ้งจกเทียน'),el:'fire',r:'B',c:PL('#f08a3c','#ffe6a8','#ffd34d','#fff4d6'),f:{face:'smile',tail:'lizard',crest:'candle',eSp:.5}},
 turtle:{name:TL('เต่าตะไคร่'),el:'leaf',r:'B',c:PL('#9ccf6e','#f0e6b8','#5c8a3c','#d8f0a0'),f:{body:'turtle',face:'smile',crest:'sprout'}},
 worm:{name:TL('หนอนใบเตย'),el:'leaf',r:'B',c:PL('#6fcf5a','#e8f7c0','#2f8f4a','#ffd34d','#2f8f4a'),f:{body:'worm',face:'smile',crest:'antenna'}},
 puffer:{name:TL('ปลาปักเป้าฟองสบู่'),el:'water',r:'B',c:PL('#7fc8f0','#eaf8ff','#3a7fc0','#ffffff'),f:{body:'blob',spikes:1,fins:1,tail:'fin',bubbles:1}},
 frog:{name:TL('กบหยดน้ำ'),el:'water',r:'B',c:PL('#4fb8d8','#e0f6ff','#2a6f9a','#ff9fb6'),f:{ears:'bumps',face:'wide',crest:'drop',eDy:-.52,eSp:.5}},
 cat:{name:TL('แมวส้ม'),el:'normal',r:'B',c:PL('#f0a050','#fff1dc','#c56a2a','#ff9fb6','#fff1dc'),f:{ears:'tri',earS:.9,inner:'belly',face:'pink',tail:'thin',stripes:1,whisk:1}},
 pig:{name:TL('หมูน้อย'),el:'normal',r:'B',c:PL('#ffb3c4','#ffe3ea','#e8899f','#ff8aa6','#e8899f'),f:{ears:'flop',earC:'acc',face:'snout',tail:'curl'}},
 fox:{name:TL('จิ้งจอกถ่านแดง'),el:'fire',r:'R',c:PL('#e0602e','#fff0dc','#3a2430','#ffb347','#3a2430'),f:{ears:'tri',earS:1.25,inner:'belly',face:'muzzle',tail:'fluffy',tailTip:'acc2',crest:'ember'}},
 goat:{name:TL('แพะเขาไฟ'),el:'fire',r:'R',c:PL('#e6d8c0','#fff6e6','#c0392b','#ffb347','#8a6a50'),f:{ears:'flop',face:'muzzle',crest:'curlhorn',beard:1,tail:'curl'}},
 panda:{name:TL('แพนด้าไผ่'),el:'leaf',r:'R',c:PL('#f4f4f0','#ffffff','#2a2a35','#7cc46a','#2a2a35'),f:{ears:'round',earC:'acc',inner:'acc',face:'muzzle',patches:1,arms:1,crest:'bamboo'}},
 deer:{name:TL('กวางดอกไม้'),el:'leaf',r:'R',c:PL('#c98a5a','#fff0dc','#8a5a3a','#ff9fb6','#8a5a3a'),f:{ears:'side',face:'muzzle',crest:'antler',antFl:1,spots:1,tail:'curl'}},
 otter:{name:TL('นากสายน้ำ'),el:'water',r:'R',c:PL('#9a6a4a','#f2dcc0','#5a3a2a','#7fd8ff','#5a3a2a'),f:{ears:'round',small:1,inner:'acc',face:'muzzle',whisk:1,tail:'flat',crest:'drop'}},
 seal:{name:TL('แมวน้ำหิมะ'),el:'water',r:'R',c:PL('#e4ecf8','#ffffff','#9fb4d0','#7fd8ff','#c8d4e8'),f:{face:'muzzle',whisk:1,flippers:1,crest:'snow'}},
 corgi:{name:TL('คอร์กี้'),el:'normal',r:'R',c:PL('#e8a050','#fff4e2','#3a2a22','#ff9fb6','#fff4e2'),f:{ears:'tri',earS:1.35,inner:'belly',face:'muzzle',tail:'fluffy'}},
 owl:{name:TL('นกฮูกพระจันทร์'),el:'normal',r:'R',c:PL('#8a7ac8','#e8e0ff','#ffd34d','#5a4a9a','#ffd34d'),f:{ears:'tuft',earC:'acc2',face:'mask',beak:1,wings:'small',crest:'moon',noCheek:1}},
 elephant:{name:TL('ช้างน้อย'),el:'normal',r:'R',c:PL('#a8b4d0','#d8e0f0','#7a86a8','#ff9fb6','#d8e0f0'),f:{ears:'big',face:'trunk'}},
 dragon:{name:TL('มังกรเพลิง'),el:'fire',r:'E',c:PL('#e04a3a','#ffd88a','#8a1f2a','#ffb347'),f:{face:'muzzle',crest:'horns',wings:'big',tail:'spade'}},
 tree:{name:TL('ต้นไม้เดินได้'),el:'leaf',r:'E',c:PL('#8a6a44','#c8a878','#4a9a4a','#ff9fb6','#6a4a2a'),f:{body:'tree',face:'smile'}},
 whale:{name:TL('วาฬลอยฟ้า'),el:'water',r:'E',c:PL('#5a7ad8','#e8f0ff','#3a52a8','#ffffff'),f:{body:'blob',fins:1,tail:'fin',cloud:1,spout:1}},
 seahorse:{name:TL('ม้าน้ำคริสตัล'),el:'water',r:'E',c:PL('#7fd8e8','#e8fbff','#c99bff','#ffffff'),f:{body:'float',face:'snoutR',tail:'curlbig',crest:'fins',noCheek:1}},
 griffin:{name:TL('กริฟฟินน้อย'),el:'normal',r:'E',c:PL('#e8c070','#fff4dc','#f6f2ea','#ffb347','#e8c070',{wing:'#a87a4a'}),f:{headC:'acc',ears:'tuft',earC:'acc',beak:1,beakC:'acc2',wings:'big',tail:'thin',noCheek:1}},
 wolf:{name:TL('หมาป่าเงาจันทร์'),el:'normal',r:'E',c:PL('#5a5a8a','#d0d0f0','#2a2a4a','#ffe08a'),f:{mane:1,ears:'tri',earS:1.3,inner:'belly',face:'muzzle',tail:'fluffy',crest:'moon'}},
 phoenix:{name:TL('ฟีนิกซ์สุริยา'),el:'fire',r:'L',c:PL('#ff7a2a','#ffe08a','#ffd34d','#ff3a4a','#ffb347'),f:{beak:1,wings:'big',crest:'flame',crestBig:1,tail:'plume',noCheek:1}},
 qilin:{name:TL('กิเลนพฤกษา'),el:'leaf',r:'L',c:PL('#4fae6a','#f0f6d0','#ffd34d','#ff9fb6','#2f7a4a'),f:{mane:1,maneC:'belly',ears:'side',face:'muzzle',crest:'antler',antFl:1,tail:'fluffy',tailTip:'acc2',quad:1}},
 seadragon:{name:TL('มังกรมหาสมุทร'),el:'water',r:'L',c:PL('#2f6fd0','#bfe8ff','#7fd8ff','#ffffff'),f:{face:'muzzle',crest:'horns',hornC:'belly',whisk:2,tail:'fin',fins:1}},
 tiger:{name:TL('เสือพงไพร'),el:'leaf',r:'E',c:PL('#f0a040','#fff4e0','#2f6a2a','#8de07a','#fff4e0'),f:{ears:'round',inner:'belly',face:'muzzle',whisk:1,stripes:1,tail:'thin',crest:'leaf'}},
 eagle:{name:TL('อินทรีเพลิง'),el:'fire',r:'E',c:PL('#8a4a2a','#ffe0b0','#ff7a2a','#ffd34d','#ffd34d',{wing:'#c0582a'}),f:{beak:1,beakC:'acc2',wings:'big',tail:'plume',crest:'flame',noCheek:1}},
 pegasus:{name:TL('เพกาซัสรุ่งอรุณ'),el:'normal',r:'L',c:PL('#f6f4ff','#ffffff','#ffd34d','#9fd8ff','#e0dcf0',{wing:'#e8f0ff'}),f:{ears:'tri',earS:1.15,inner:'acc2',face:'muzzle',wings:'big',tail:'fluffy',tailTip:'acc',crest:'star',quad:1}},
 coc_fire:{name:'',el:'fire',coc:1,c:PL('#e2633f','#ffd8a8','#a8382a','#ffb347')},
 coc_leaf:{name:'',el:'leaf',coc:1,c:PL('#7cc46a','#e8f7c0','#3f8a3a','#c8f0a0')},
 coc_water:{name:'',el:'water',coc:1,c:PL('#5aa8e0','#e0f6ff','#2a6f9a','#bfe8ff')},
 coc_normal:{name:'',el:'normal',coc:1,c:PL('#d8d0f0','#fff8ff','#9a8ac8','#ffe6a6')},
 wisp_fire:{name:'',el:'fire',c:PL('#ff8a4a','#fff0d0','#ff5a2a','#ffd34d','#ffb070'),f:{body:'blob',crest:'flame',noCheek:0}},
 wisp_leaf:{name:'',el:'leaf',c:PL('#7cd06a','#f0ffd8','#3f9a4a','#c8f0a0','#a0e090'),f:{body:'blob',crest:'sprout'}},
 wisp_water:{name:'',el:'water',c:PL('#6fc0f0','#e8f8ff','#2a7fc0','#bfe8ff','#a0d8ff'),f:{body:'blob',crest:'drop'}},
 wisp_normal:{name:'',el:'normal',c:PL('#f0e8ff','#ffffff','#b8a8e8','#ffe6a6','#e0d8f8'),f:{body:'blob',crest:'star'}}
});
['shiba','chick','bunny','penguin'].forEach(k=>SPECIES[k].r='B');
for(const k in SPECIES)SPECIES[k].c.gem=SPECIES[k].c.gem||GEM[SPECIES[k].el];
const POOL=Object.keys(SPECIES).filter(k=>SPECIES[k].r);
const POOL_ORDER=['B','R','E','L'].flatMap(r=>POOL.filter(k=>SPECIES[k].r===r));
/* ---------- 4 elements per species (v0.94) ---------- */
const ELS=['fire','ice','leaf','earth','thunder','water'];
const EL_SUF={fire:'เพลิง',ice:'หิมะ',leaf:'พงไพร',earth:'ศิลา',thunder:'อัสนี',water:'ธารา',normal:''},EL_PRE={fire:'Fire',ice:'Ice',leaf:'Leaf',earth:'Earth',thunder:'Thunder',water:'Water',normal:''};
const BASEN={shiba:'หมาชิบะ',chick:'ลูกไก่',bunny:'กระต่าย',penguin:'เพนกวิน',mouse:'หนู',gecko:'จิ้งจก',turtle:'เต่า',worm:'หนอน',puffer:'ปลาปักเป้า',frog:'กบ',cat:'แมว',pig:'หมูน้อย',fox:'จิ้งจอก',goat:'แพะเขา',panda:'แพนด้า',deer:'กวาง',otter:'นาก',seal:'แมวน้ำ',corgi:'คอร์กี้',owl:'นกฮูก',elephant:'ช้างน้อย',dragon:'มังกร',tree:'ต้นไม้เดินได้',whale:'วาฬลอยฟ้า',seahorse:'ม้าน้ำ',griffin:'กริฟฟิน',wolf:'หมาป่า',phoenix:'ฟีนิกซ์',qilin:'กิเลน',seadragon:'มังกรราชัน',tiger:'เสือ',eagle:'อินทรี',pegasus:'เพกาซัส'};
const ARCH={atk:{B:['gecko','mouse'],R:['fox','owl'],E:['wolf','eagle','tiger','dragon'],L:['seadragon']},
  def:{B:['turtle','puffer'],R:['goat','seal'],E:['seahorse'],L:['qilin']},
  hp:{B:['worm','frog'],R:['panda','deer','elephant'],E:['tree','whale'],L:['phoenix']},
  bal:{B:['shiba','cat','pig','bunny','chick','penguin'],R:['corgi','otter'],E:['griffin'],L:['pegasus']}};
Object.assign(SPECIES,{
 parrot:{name:TL('นกแก้วใบไม้'),el:'leaf',r:'B',c:PL('#3fbf5a','#ffe08a','#e8433b','#2a7fd0','#ffb347',{wing:'#e8433b'}),f:{beak:1,beakC:'acc2',wings:'small',tail:'plume',crest:'leaf',noCheek:1}},
 pigeon:{name:TL('นกพิราบ'),el:'normal',r:'B',c:PL('#9aa4b8','#e6e8f0','#5fb89a','#c6a0d8','#e88a8a',{wing:'#7a8498'}),f:{beak:1,wings:'small',tail:'plume',noCheek:1}},
 swan:{name:TL('หงส์ขาว'),el:'normal',r:'R',c:PL('#f6f6fb','#ffffff','#ff9c3d','#ffd34d','#ff9c3d',{wing:'#e4e9f6'}),f:{beak:1,beakC:'acc',wings:'big',tail:'fluffy',noCheek:1}}});
BASEN.parrot='นกแก้ว';BASEN.pigeon='นกพิราบ';BASEN.swan='หงส์';Object.assign(EN,{'นกแก้ว':'Parrot','หงส์':'Swan'});/* v1.36: names were missing in English */
const ARCH_N={atk:{i:'⚔️',n:'นักล่า',st:'ATK'},def:{i:'🛡️',n:'ป้องกัน',st:'DEF'},hp:{i:'❤️',n:'พลังชีวิต',st:'HP'},bal:{i:'⚖️',n:'สัตว์เลี้ยง',st:'EN'}};

const OLDN={};for(const k in BASEN)OLDN[k]=SPECIES[k].name;
const spDisp=(k,el)=>{const b=TL(BASEN[k]||'');return LANG==='en'?(EL_PRE[el]?EL_PRE[el]+' ':'')+b:b+EL_SUF[el]};
(function(){const hx=h=>{h=h.replace('#','');return[0,2,4].map(i=>parseInt(h.substr(i,2),16)/255)};
  const toH=([r,g,b])=>{const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h=0,s=0,l=(mx+mn)/2;if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h/=6}return[h*360,s,l]};
  const toR=([h,s,l])=>{h/=360;const f=(p,q,t)=>{if(t<0)t+=1;if(t>1)t-=1;return t<1/6?p+(q-p)*6*t:t<.5?q:t<2/3?p+(q-p)*(2/3-t)*6:p};if(!s)return[l,l,l];const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;return[f(p,q,h+1/3),f(p,q,h),f(p,q,h-1/3)]};
  const hex=c=>'#'+c.map(v=>Math.round(Math.max(0,Math.min(1,v))*255).toString(16).padStart(2,'0')).join('');
  const T={fire:[14,.78],ice:[198,.5],leaf:[105,.55],earth:[30,.45],thunder:[50,.85],water:[205,.62],normal:[262,.32]};
  {const HOME={shiba:'fire',chick:'fire',gecko:'fire',fox:'fire',eagle:'fire',phoenix:'fire',penguin:'ice',goat:'ice',seal:'ice',swan:'ice',owl:'ice',wolf:'ice',bunny:'leaf',parrot:'leaf',worm:'leaf',panda:'leaf',deer:'leaf',tree:'leaf',qilin:'leaf',pig:'earth',mouse:'earth',turtle:'earth',elephant:'earth',corgi:'earth',tiger:'earth',pigeon:'thunder',cat:'thunder',griffin:'thunder',pegasus:'thunder',dragon:'thunder',puffer:'water',frog:'water',otter:'water',whale:'water',seahorse:'water',seadragon:'water'};for(const k in HOME)if(SPECIES[k])SPECIES[k].el=HOME[k];if(SPECIES.wolf)SPECIES.wolf.r='L';if(SPECIES.tiger)SPECIES.tiger.r='L'}
  const shift=(c,el,k)=>{if(typeof c!=='string'||c[0]!=='#')return c;const[h,s,l]=toH(hx(c));const[th,ts]=T[el];if(k==='belly'||(k==='feet'&&l>.8))return hex(toR([th,Math.min(s,.35),Math.max(l,.86)]));if(k==='gold')return c;return hex(toR([th,Math.max(.25,(s+ts)/2),l]))};
  for(const k in BASEN){const sp=SPECIES[k];if(!sp)continue;sp.base=k;sp.name=spDisp(k,sp.el);
    ELS.forEach(el=>{if(el===sp.el)return;const c={};for(const q in sp.c)c[q]=shift(sp.c[q],el,q);c.gem=GEM[el];SPECIES[k+'@'+el]=Object.assign({},sp,{c,el,base:k,name:spDisp(k,el)})})}
  ELS.forEach(el=>{const cc=SPECIES['coc_'+el];if(cc&&!cc.name)cc.name=TL('ดักแด้');if(SPECIES['wisp_'+el])SPECIES['wisp_'+el].name=LANG==='en'?(EL_PRE[el]?EL_PRE[el]+' ':'')+'Wisp':'ภูตแสง'+EL_SUF[el]})})();
const pel=p=>p.el||(SPECIES[p.sp]?SPECIES[p.sp].el:'normal');
const isWisp=p=>!!(p&&p.sp&&p.sp.indexOf('wisp_')===0);
const pkey=p=>{if(!p)return'mystery';if(p.egg)return p.sp;if(p.coc)return'coc_'+pel(p);if(isWisp(p))return'wisp_'+pel(p);const sp=SPECIES[p.sp];return!sp||pel(p)===sp.el?p.sp:p.sp+'@'+pel(p)};
const pS=p=>SPECIES[pkey(p)]||SPECIES[p.sp];
const catKey=p=>p.sp+'@'+pel(p);

function buildGen(sp,f){if(SPECIES[sp].base&&SPECIES[sp].base!==sp)sp=SPECIES[sp].base;const o=SPECIES[sp].f,D=[],g=geo(f);let[hx,hy,hr]=g.h,[bx,by,brx,bry]=g.b;
  const back=[],head=[],top=[],front=[];
  let feet=g.f.map(q=>E(q[0],q[1],q[2],q[3],'feet',{ft:1}));
  let body=E(bx,by,brx,bry,'main'),bel=E(bx,by+bry*.16,brx*.6,bry*.7,'belly'),hd=E(hx,hy,hr,hr*.94,o.headC||'main');
  const mt=(pts,c,opt,arr)=>{arr.push(T(pts,c,opt),T(mir(pts,24),c,opt))};
  const me=(x,y,rx,ry,c,opt,arr)=>{arr.push(E(x,y,rx,ry,c,opt),E(48-x,y,rx,ry,c,opt))};
  if(o.body==='blob'){const r=[0,9.5,11,12.5,13.5][f];feet=[];hd=null;bx=24;by=30;brx=r;bry=r*.86;body=E(bx,by,brx,bry,'main');bel=E(bx,by+bry*.42,brx*.62,bry*.4,'belly');hx=24;hy=27.5;hr=r*.82}
  if(o.body==='float'){feet=[];body=E(bx,by,brx*.78,bry,'main');bel=E(bx,by+bry*.16,brx*.45,bry*.7,'belly')}
  if(o.body==='worm'){body=E(bx,by,brx*.7,bry*.85,'main');back.push(E(bx-brx*.85,by+bry*.25,brx*.45,bry*.55,'main'),E(bx+brx*.85,by+bry*.25,brx*.45,bry*.55,'main'));bel=E(bx,by+bry*.2,brx*.4,bry*.55,'belly');
    feet=[-.95,-.35,.35,.95].map(t=>E(bx+brx*t,by+bry*.92,1.6,1.4,'feet',{ft:1}))}
  if(o.body==='turtle'){back.push(E(bx,by-bry*.05,brx*1.32,bry*1.08,'acc'));D.push({x:Math.round(bx-brx*1.15),y:Math.round(by-bry*.3),w:2,h:2,c:'acc2'},{x:Math.round(bx+brx*1.05),y:Math.round(by-bry*.5),w:2,h:2,c:'acc2'},{x:Math.round(bx+brx*.95),y:Math.round(by+bry*.2),w:2,h:1,c:'acc2'})}
  if(o.body==='tree'){body=E(bx,by,brx*.68,bry,'main');bel=E(bx,by+bry*.2,brx*.32,bry*.58,'belly');hd=E(hx,hy-1,hr*1.22,hr*1.02,'acc');
    me(hx-hr*.95,hy-hr*.55,hr*.55,hr*.5,'acc',null,back);back.push(E(hx,hy-hr*1.05,hr*.62,hr*.5,'acc'));
    me(bx-brx*.75,by-bry*.35,brx*.38,1.8,'main',null,front);
    [[-.6,-.6],[.5,-.75],[.8,.1],[-.85,.15],[0,-1.15]].forEach(([a,b])=>D.push({x:Math.round(hx+hr*a),y:Math.round(hy+hr*b),w:2,h:2,c:'acc2'}))}
  if(o.mane)head.push(E(hx,hy+hr*.08,hr*1.2,hr*1.1,o.maneC||'acc'));
  if(o.quad&&feet.length===2){const fy=g.f[0][1],fw=g.f[0][2]*.85,fh=g.f[0][3]*.95;back.push(E(24-fw*1.0,fy+.2,fw*.72,fh*1.15,'acc'),E(24+fw*1.0,fy+.2,fw*.72,fh*1.15,'acc'))}
  const ec=o.earC||'main';
  if(o.ears==='tri'){const s=o.earS||1;mt([[hx-hr*.98,hy-hr*.12],[hx-hr*.66,hy-hr*(.95+.41*s)],[hx-hr*.08,hy-hr*.74]],ec,null,head);if(o.inner)mt([[hx-hr*.8,hy-hr*.32],[hx-hr*.64,hy-hr*(.85+.27*s)],[hx-hr*.32,hy-hr*.7]],o.inner,{noLine:1},head)}
  if(o.ears==='round'){const r=hr*(o.small?.26:.34);me(hx-hr*.7,hy-hr*.72,r,r,ec,null,head);if(o.inner)me(hx-hr*.7,hy-hr*.72,r*.5,r*.5,o.inner,{noLine:1},head)}
  if(o.ears==='flop')me(hx-hr*.86,hy-hr*.32,hr*.3,hr*.46,ec,null,top);
  if(o.ears==='big'){me(hx-hr*1.05,hy+hr*.05,hr*.62,hr*.8,'main',null,head);me(hx-hr*1.05,hy+hr*.1,hr*.36,hr*.52,'acc2',{noLine:1},head)}
  if(o.ears==='tuft')mt([[hx-hr*.92,hy-hr*.38],[hx-hr*.84,hy-hr*1.3],[hx-hr*.38,hy-hr*.8]],ec,null,head);
  if(o.ears==='bumps')me(hx-hr*.52,hy-hr*.62,hr*.38,hr*.36,'main',null,head);
  if(o.ears==='side')mt([[hx-hr*.7,hy-hr*.42],[hx-hr*1.45,hy-hr*.72],[hx-hr*.9,hy-hr*.12]],'main',null,head);
  const nose=(c)=>D.push({x:Math.round(hx)-1,y:Math.round(hy+hr*.25),w:2,h:1,c});
  if(o.face==='muzzle'){top.push(E(hx,hy+hr*.42,hr*.55,hr*.36,'belly'));nose('#2a1b17')}
  if(o.face==='pink')nose('#ff7f9f');
  if(o.face==='smile')D.push({k:'smile',x:Math.round(hx),y:Math.round(hy+hr*.36)});
  if(o.face==='wide')D.push({x:Math.round(hx-hr*.45),y:Math.round(hy+hr*.38),w:Math.round(hr*.9),h:1,c:'#1d1430'});
  if(o.face==='snout'){top.push(E(hx,hy+hr*.42,hr*.36,hr*.26,'acc2'));D.push({x:Math.round(hx)-2,y:Math.round(hy+hr*.4),w:1,h:1,c:'#7a2a40'},{x:Math.round(hx)+1,y:Math.round(hy+hr*.4),w:1,h:1,c:'#7a2a40'})}
  if(o.face==='trunk')top.push(E(hx,hy+hr*.62,hr*.22,hr*.58,'main'),E(hx,hy+hr*1.12,hr*.26,hr*.14,'acc2',{noLine:1}));
  if(o.face==='mask')top.push(E(hx,hy+hr*.1,hr*.8,hr*.62,'belly'));
  if(o.face==='snoutR')top.push(T([[hx+hr*.1,hy+hr*.15],[hx+hr*1.25,hy+hr*.5],[hx+hr*.15,hy+hr*.66]],'main'));
  if(o.beak)top.push(T([[hx-2.2,hy+hr*.22],[hx+2.2,hy+hr*.22],[hx,hy+hr*.64]],o.beakC||'acc'));
  if(o.patches)me(hx-hr*.42,hy-hr*.02,hr*.27,hr*.32,'acc',{noLine:1},top);
  if(o.beard)top.push(T([[hx-1.6,hy+hr*.72],[hx+1.6,hy+hr*.72],[hx,hy+hr*1.18]],'belly'));
  if(o.whisk){const w=o.whisk===2?5:3,c=o.whisk===2?'acc':'#5a4650';[.32,.48].forEach(t=>{D.push({x:Math.round(hx-hr*.95)-w+2,y:Math.round(hy+hr*t),w,h:1,c},{x:Math.round(hx+hr*.95)-1,y:Math.round(hy+hr*t),w,h:1,c})})}
  if(o.stripes){[-2,0,2].forEach(dx=>D.push({x:Math.round(hx)+dx,y:Math.round(hy-hr*.82),w:1,h:2,c:'acc'}));[[-.82,-.2],[-.86,.15],[.72,-.2],[.76,.15]].forEach(([a,b])=>D.push({x:Math.round(bx+brx*a),y:Math.round(by+bry*b),w:2,h:1,c:'acc'}))}
  if(o.spots)[[-.55,-.35],[.5,-.5],[.62,.15],[-.6,.2]].forEach(([a,b])=>D.push({x:Math.round(bx+brx*a),y:Math.round(by+bry*b),w:1,h:1,c:'#fff8ec'}));
  const t=o.tail;
  if(t==='curl')back.push(E(bx+brx*.9,by-bry*.35,3+f*.3,3+f*.3,'main'),E(bx+brx*.9+1,by-bry*.35-1,1.6,1.6,'belly'));
  if(t==='fluffy')back.push(E(bx+brx*1.0,by-bry*.25,brx*.42,bry*.78,'main'),E(bx+brx*1.12,by-bry*.85,brx*.26,bry*.3,o.tailTip||'belly'));
  if(t==='thin')back.push(E(bx+brx*.88,by+bry*.32,1.7,1.7,'main'),E(bx+brx*1.16,by-bry*.02,1.6,1.7,'main'),E(bx+brx*1.3,by-bry*.42,1.6,1.9,'main'));
  if(t==='lizard')back.push(T([[bx+brx*.5,by+bry*.3],[bx+brx*1.75,by-bry*.25],[bx+brx*.7,by+bry*.75]],'main'));
  if(t==='flat')back.push(E(bx+brx*.95,by+bry*.5,brx*.48,2.4,'acc'));
  if(t==='fin')back.push(T([[bx+brx*.75,by],[bx+brx*1.55,by-bry*.8],[bx+brx*1.3,by+bry*.1]],'acc'),T([[bx+brx*.75,by+1],[bx+brx*1.55,by+bry*.85],[bx+brx*1.3,by]],'acc'));
  if(t==='spade')back.push(T([[bx+brx*.6,by+bry*.2],[bx+brx*1.4,by-bry*.5],[bx+brx*.8,by+bry*.5]],'main'),T([[bx+brx*1.2,by-bry*.38],[bx+brx*1.68,by-bry*.95],[bx+brx*1.55,by-bry*.22]],'acc'));
  if(t==='plume')back.push(T([[bx+brx*.4,by+bry*.2],[bx+brx*1.7,by-bry*.9],[bx+brx*.9,by+bry*.5]],'acc2'),T([[bx+brx*.4,by+bry*.4],[bx+brx*1.8,by+bry*.1],[bx+brx*.8,by+bry*.8]],'acc'),T([[bx-brx*.4,by+bry*.2],[bx-brx*1.7,by-bry*.9],[bx-brx*.9,by+bry*.5]],'acc2'));
  if(t==='curlbig')back.push(E(bx+brx*.55,by+bry*.95,4,4,'main'),E(bx+brx*.55,by+bry*.95,1.8,1.8,'belly',{noLine:1}));
  if(o.wings==='small')front.push(E(bx-brx*.92,by-.5,2.6+f*.3,4+f*.4,'main'),E(bx+brx*.92,by-.5,2.6+f*.3,4+f*.4,'main'));
  if(o.wings==='big'){const s=.75+f*.13,wc=SPECIES[sp].c.wing?'wing':'acc';mt([[bx-brx*.2,by-bry*.5],[bx-brx*(1+.55*s),by-bry*(1.05+.45*s)],[bx-brx*(.9+.35*s),by+bry*.35]],wc,null,back)}
  if(o.flippers||o.arms)me(bx-brx*.95,by-.5,2.4+f*.3,bry*.58,o.arms?'acc':'main',null,front);
  if(o.fins)me(bx-brx*.98,by+bry*.15,2.2+f*.2,3.4+f*.3,'acc',null,front);
  if(o.spikes)for(let a=0;a<8;a++){const an=a/8*Math.PI*2-Math.PI/2,cx=bx+Math.cos(an)*brx,cy=by+Math.sin(an)*bry,nx=Math.cos(an),ny=Math.sin(an),px_=-ny,py_=nx;
    back.push(T([[cx+px_*2,cy+py_*2],[cx+nx*4,cy+ny*4],[cx-px_*2,cy-py_*2]],'acc'))}
  if(o.bubbles)D.push({k:'bub',x:bx+brx+1,y:Math.round(by-bry*.9)},{k:'bub',x:bx-brx-4,y:Math.round(by-bry*.3)});
  if(o.cloud)D.push({k:'cloud',x:Math.round(bx-brx*.9),y:Math.round(by+bry*.88)},{k:'cloud',x:Math.round(bx+brx*.4),y:Math.round(by+bry*.95)});
  if(o.spout)top.push(E(hx,hy-hr*1.08,1.3,2.6,'belly'),E(hx-2.4,hy-hr*1.32,1.2,1.2,'belly'),E(hx+2.4,hy-hr*1.32,1.2,1.2,'belly'));
  const cr=o.crest,tall=['horns','curlhorn','antler','flame','candle','antenna','fins'].includes(cr);
  if(cr==='leaf')top.push(T([[hx-.5,hy-hr*.82],[hx-4,hy-hr*1.45],[hx+.5,hy-hr*1.2]],'acc'),T([[hx+.5,hy-hr*.82],[hx+3.5,hy-hr*1.32],[hx-.3,hy-hr*1.1]],'acc'));
  if(cr==='sprout')top.push(T([[hx-.5,hy-hr*.84],[hx-3,hy-hr*1.3],[hx+.5,hy-hr*1.12]],'acc2'),T([[hx+.5,hy-hr*.84],[hx+3,hy-hr*1.22],[hx-.3,hy-hr*1.05]],'acc2'));
  if(cr==='bamboo')top.push(T([[hx+hr*.25,hy-hr*.8],[hx+hr*.95,hy-hr*1.3],[hx+hr*.55,hy-hr*.72]],'acc2'),T([[hx+hr*.4,hy-hr*.86],[hx+hr*.15,hy-hr*1.5],[hx+hr*.68,hy-hr*.98]],'acc2'));
  if(cr==='drop')top.push(E(hx,hy-hr*1.0,2.2,2.2,'acc2'),T([[hx-1.6,hy-hr*1.08],[hx,hy-hr*1.42],[hx+1.6,hy-hr*1.08]],'acc2'));
  if(cr==='horns')mt([[hx-hr*.5,hy-hr*.72],[hx-hr*.74,hy-hr*(1.4+f*.04)],[hx-hr*.22,hy-hr*.86]],f>=4?'gold':(o.hornC||'acc'),null,head);
  if(cr==='curlhorn'){me(hx-hr*.8,hy-hr*.62,hr*.34,hr*.42,f>=4?'gold':'acc',null,head);me(hx-hr*.98,hy-hr*.32,hr*.2,hr*.24,f>=4?'gold':'acc',null,top)}
  if(cr==='antler'){const ac=f>=4?'gold':'acc';mt([[hx-hr*.4,hy-hr*.75],[hx-hr*.95,hy-hr*1.7],[hx-hr*.25,hy-hr*.9]],ac,null,head);mt([[hx-hr*.68,hy-hr*1.2],[hx-hr*1.35,hy-hr*1.42],[hx-hr*.75,hy-hr*1.02]],ac,null,head);if(o.antFl)me(hx-hr*.95,hy-hr*1.66,1.7,1.7,'acc2',null,top)}
  if(cr==='candle')top.push(E(hx,hy-hr*1.0,1.8,2.8,'acc2'),E(hx,hy-hr*1.46,1.5,2.4,'acc'));
  if(cr==='antenna'){me(hx-3,hy-hr*1.15,.7,2.6,'acc',null,head);me(hx-3.6,hy-hr*1.48,1.5,1.5,'acc2',null,top)}
  if(cr==='ember')top.push(E(hx,hy-hr*1.0,1.6,2.6,'acc2'));
  if(cr==='flame'){const k=o.crestBig?1.35:1;top.push(E(hx-2.8*k,hy-hr*1.0,1.8*k,3*k,'acc'),E(hx+2.8*k,hy-hr*1.0,1.8*k,3*k,'acc'),E(hx,hy-hr*1.12,2.3*k,4*k,'acc2'))}
  if(cr==='moon')D.push({k:'moon',x:Math.round(hx),y:Math.round(hy-hr*.66)});
  if(cr==='star')D.push({k:'star',x:Math.round(hx)-1,y:Math.round(hy-hr*.95)});
  if(cr==='snow')D.push({k:'snow',x:Math.round(hx),y:Math.round(hy-hr*.7)});
  if(cr==='fins')top.push(T([[hx-1,hy-hr*.8],[hx+hr*.2,hy-hr*1.6],[hx+hr*.7,hy-hr*.75]],'acc'),T([[hx-hr*.6,hy-hr*.7],[hx-hr*.5,hy-hr*1.3],[hx,hy-hr*.85]],'acc'));
  if(f>=3)front.push(E(bx,by+(o.body==='blob'?bry*.1:-bry*.12),brx*(o.body==='blob'?.22:.28),bry*(o.body==='blob'?.2:.25),'gem'));
  if(f>=4&&!tall){const cy=o.body==='blob'?by-bry*.88:hy-hr*.84;top.push(T([[hx-5,cy],[hx-3.5,cy-4.5],[hx-2,cy]],'gold'),T([[hx-1.6,cy-.6],[hx,cy-6],[hx+1.6,cy-.6]],'gold'),T([[hx+2,cy],[hx+3.5,cy-4.5],[hx+5,cy]],'gold'))}
  return{P:[...back,body,bel,...feet,...head,hd,...top,...front].filter(Boolean),D,g:{h:[hx,hy,hr]},eDy:o.eDy,eSp:o.eSp,noCheek:o.noCheek}}
