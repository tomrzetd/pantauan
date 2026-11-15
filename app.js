/* PANTAUAN — front-end only. No Buleud Teu scan logic or license secrets. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  // Storage can be unavailable in embedded previews, private browsing or lockdown browsers.
  const safeStorage={
    getItem(key){try{return window.localStorage.getItem(key);}catch(_){return null;}},
    setItem(key,val){try{window.localStorage.setItem(key,val);}catch(_){}},
    removeItem(key){try{window.localStorage.removeItem(key);}catch(_){}}
  };
  const number = new Intl.NumberFormat('id-ID');
  const percent = (a,b) => b>0 ? Math.min(100,Math.round(a/b*1000)/10) : 0;
  const formatPct = x => `${number.format(x)}%`;
  const demoSchool = 'SMP Contoh (Simulasi)';
  const D = {
    active:false,server:safeStorage.getItem('pantauan-server')||'',key:'',data:null,busy:false,
    filters:{period:'ALL',grade:'ALL',room:'ALL'}, tick:null, roster:null, rosterBusy:false
  };
  function synthetic() {
    const groups = [
      ['ASAS','IPA','7',[['7A',30,26],['7B',30,22],['7C',30,27]]],
      ['ASAS','MATEMATIKA','7',[['7A',30,24],['7B',30,19],['7C',30,21]]],
      ['ASAS','BAHASA INDONESIA','7',[['7A',30,30],['7B',30,28],['7C',30,29]]],
      ['ASAS','BAHASA INGGRIS','7',[['7A',30,13],['7B',30,12],['7C',30,18]]],
      ['ASAS','IPS','7',[['7A',30,20],['7B',30,25],['7C',30,22]]],
      ['ASAS','PAI','8',[['8A',32,29],['8B',32,30],['8C',32,27]]],
      ['ASAS','INFORMATIKA','8',[['8A',32,27],['8B',32,29],['8C',32,30]]],
      ['ASAS','PPKN','8',[['8A',32,12],['8B',32,15],['8C',32,13]]]
    ];
    return {ok:true,school:{name:demoSchool,year:'2026/2027'},generatedAt:new Date().toISOString(),
      checks:{historicalDuplicates:0,unmatchedRows:0},
      exams:groups.map((x,i)=>({id:`DEMO-${i}`,period:x[0],subject:x[1],name:x[0],grade:x[2],teacher:'Guru Contoh',status:'Aktif',rooms:x[3].map((r,j)=>({room:r[0],expected:r[1],received:r[2],average:Math.round((68+i*2+j*3)%96)})),expected:x[3].reduce((a,r)=>a+r[1],0),received:x[3].reduce((a,r)=>a+r[2],0),average:Math.round(68+i*2),missingConfiguration:false}))};
  }
  const prefersReduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function toast(message){
    const box=$('toast');if(!box)return;
    box.textContent=message;box.classList.add('show');clearTimeout(toast.timer);
    toast.timer=setTimeout(()=>box.classList.remove('show'),4300);
  }
  function animateMetric(id, value, fmt){
    const node=$(id);if(!node)return;
    const prior=Number(node.dataset.number);
    node.dataset.number=String(value);
    if(prefersReduced()||!Number.isFinite(prior)||Math.abs(prior-value)<0.01){node.textContent=fmt(value);return;}
    const start=performance.now(), length=620, from=prior;
    const idNow=String(value);node.dataset.currentTarget=idNow;
    function frame(time){
      if(node.dataset.currentTarget!==idNow)return;
      const t=Math.min(1,(time-start)/length), eased=1-Math.pow(1-t,3);
      node.textContent=fmt(from+(value-from)*eased);
      if(t<1)requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  function showDialog(open=true) {
    $('settingsDialog').classList.toggle('hidden',!open);
    $('serverInput').value=D.server;
    if(open) $('keyInput').focus();
    $('connectionError').textContent='';
  }
  function status(label,kind) {
    const el=$('connectionStatus'); el.className='live-pill '+kind;
    el.replaceChildren();const dot=document.createElement('span');dot.className='pulse-dot';el.append(dot,document.createTextNode(label));
  }
  function safeInt(n){return Math.max(0,Number(n)||0);}
  function selectedItems() {
    if(!D.data) return [];
    return (D.data.exams||[]).filter(e=>
      (D.filters.period==='ALL'||e.period===D.filters.period) &&
      (D.filters.grade==='ALL'||String(e.grade)===D.filters.grade)
    ).map(e=>{
      const rooms=(e.rooms||[]).filter(r=>D.filters.room==='ALL'||r.room===D.filters.room);
      return {...e,rooms,expected:rooms.reduce((a,r)=>a+safeInt(r.expected),0),
        received:rooms.reduce((a,r)=>a+safeInt(r.received),0),
        average:rooms.reduce((a,r)=>a+(Number(r.average)||0)*safeInt(r.received),0)/
          (rooms.reduce((a,r)=>a+safeInt(r.received),0)||1)};
    }).filter(e=>D.filters.room==='ALL'||e.rooms.length>0);
  }
  function selectOptions(el,options,label,previous) {
    el.replaceChildren();const create=(v,t)=>{const opt=document.createElement('option');opt.value=v;opt.textContent=t;el.append(opt);};
    create('ALL',label);
    options.forEach(value=>create(String(value),String(value)));
    el.value=options.some(v=>String(v)===previous)?previous:'ALL';
    return el.value;
  }
  function repopulateFilters() {
    const exams=(D.data?.exams)||[];
    D.filters.period=selectOptions($('periodFilter'),[...new Set(exams.map(e=>e.period))].sort(),'Semua asesmen',D.filters.period);
    const byPeriod=exams.filter(e=>D.filters.period==='ALL'||e.period===D.filters.period);
    D.filters.grade=selectOptions($('gradeFilter'),[...new Set(byPeriod.map(e=>String(e.grade)).filter(Boolean))].sort((a,b)=>Number(a)-Number(b)),'Semua tingkat',D.filters.grade);
    const byGrade=byPeriod.filter(e=>D.filters.grade==='ALL'||String(e.grade)===D.filters.grade);
    D.filters.room=selectOptions($('roomFilter'),[...new Set(byGrade.flatMap(e=>(e.rooms||[]).map(r=>r.room)))].sort((a,b)=>a.localeCompare(b,'id',{numeric:true})),'Semua rombel',D.filters.room);
  }
  function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e;}
  function barRow(name,a,b){
    const ratio=percent(a,b);
    const line=el('div','bar-line');
    const title=el('div','bar-title',name);title.title=name;
    const track=el('div','bar-track');const fill=el('div','bar-fill'+(ratio<40?' low':ratio<70?' mid':''));fill.style.width=ratio+'%';track.append(fill);
    line.append(title,track,el('div','bar-value',formatPct(ratio)));
    return line;
  }
  function summarize(items) {
    return {expected:items.reduce((a,e)=>a+safeInt(e.expected),0),received:items.reduce((a,e)=>a+safeInt(e.received),0)};
  }
  function render(){
    if(!D.data) return;
    repopulateFilters();
    const items=selectedItems(),{expected,received}=summarize(items),pending=Math.max(0,expected-received),p=percent(received,expected);
    animateMetric('metricProgress',p,x=>formatPct(Math.round(x*10)/10));
    animateMetric('metricReceived',received,x=>number.format(Math.round(x)));
    animateMetric('metricPending',pending,x=>number.format(Math.round(x)));
    animateMetric('metricExams',items.length,x=>number.format(Math.round(x)));
    $('metricMapel').textContent=`${new Set(items.map(e=>e.subject)).size} mata pelajaran`;
    $('metricProgressNote').textContent=`${number.format(received)} dari ${number.format(expected)} target`;
    $('donut').style.setProperty('--pct',`${p}%`);$('donutValue').textContent=formatPct(p);
    $('donut').setAttribute('aria-label',`Progres ${p} persen; ${received} diterima dari ${expected} target`);
    $('legendReceived').textContent=number.format(received);$('legendPending').textContent=number.format(pending);
    $('schoolNameShort').textContent=D.data.school?.name||'Dashboard Sekolah';
    $('schoolSubtitle').textContent=`${D.data.school?.name||'Sekolah'} • Tahun Pelajaran ${D.data.school?.year||'—'}`;
    const time=D.data.generatedAt?new Date(D.data.generatedAt):null;
    $('updatedAt').textContent=time&&!isNaN(time)?`Sinkron terakhir ${time.toLocaleString('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',second:'2-digit'})}`:'Belum diperbarui';
    $('demoBanner').style.display=D.active?'none':'';
    const bySubject={};items.forEach(e=>{
      const a=bySubject[e.subject]||(bySubject[e.subject]={subject:e.subject,received:0,expected:0,weightedAverage:0});a.expected+=safeInt(e.expected);a.received+=safeInt(e.received);a.weightedAverage+=safeInt(e.received)*(Number(e.average)||0);
    });
    const subjects=Object.values(bySubject).sort((a,b)=>b.expected-a.expected||a.subject.localeCompare(b.subject));
    const barTarget=$('subjectBars');barTarget.replaceChildren();
    if(!subjects.length)barTarget.append(el('div','empty','Belum ada ujian untuk filter ini.'));else subjects.forEach(s=>{const line=barRow(s.subject,s.received,s.expected);line.title=`Rerata nilai ${s.received?Math.round(s.weightedAverage/s.received*100)/100:'—'} • ${s.received}/${s.expected} hasil masuk`;barTarget.append(line);});
    const byRoom={};items.forEach(e=>(e.rooms||[]).forEach(r=>{
      const a=byRoom[r.room]||(byRoom[r.room]={room:r.room,expected:0,received:0});a.expected+=safeInt(r.expected);a.received+=safeInt(r.received);
    }));
    const roomTarget=$('roomBars');roomTarget.replaceChildren();
    const rooms=Object.values(byRoom).sort((a,b)=>a.room.localeCompare(b.room,'id',{numeric:true}));
    if(!rooms.length)roomTarget.append(el('div','empty','Tidak ada rombel untuk filter ini.'));
    rooms.forEach(r=>{
      const box=el('div','room-card'),head=el('div','room-name-row');head.append(el('span','room-name',r.room),el('span','room-pct',formatPct(percent(r.received,r.expected))));
      const track=el('div','mini-track');const fill=el('span');fill.style.width=percent(r.received,r.expected)+'%';track.append(fill);
      const foot=el('div','room-foot');foot.append(el('span','',`${r.received} diterima`),el('span','',`${r.expected} target`));
      box.append(head,track,foot);roomTarget.append(box);
    });
    const insights=$('insights');insights.replaceChildren();const list=el('div','insight-list');
    const noResult=items.filter(e=>e.received===0);
    const lag=items.filter(e=>e.expected>0 && percent(e.received,e.expected)<50 && e.received>0);
    const noTarget=items.filter(e=>e.expected===0);
    const makeInsight=(ico,title,body,green=false)=>{
      const card=el('div','insight'+(green?' green':'')),ic=el('div','insight-icon',ico),wrap=el('div');wrap.append(el('strong','',title),el('p','',body));card.append(ic,wrap);list.append(card);
    };
    if(noResult.length)makeInsight('◷',`${noResult.length} ujian belum menerima hasil`,'Periksa apakah guru sudah selesai memindai dan sinkronisasi perangkat berjalan.');
    if(lag.length)makeInsight('!',`${lag.length} ujian di bawah 50%`,'Prioritaskan koordinasi dengan guru mapel dan rombel yang masih tertinggal.');
    if(noTarget.length)makeInsight('⚑',`${noTarget.length} ujian tanpa peserta terdaftar`,'Periksa Tingkat Pendidikan dan Nama Rombel pada tab Ujian dan Siswa.');
    if(!list.children.length)makeInsight('✓','Semua ujian sudah memiliki progres','Tidak ada ujian 0% atau kekurangan konfigurasi pada filter ini.',true);
    if((D.data.checks?.unmatchedRows||0)>0)makeInsight('i','Ada hasil yang belum cocok dengan master siswa',`${D.data.checks.unmatchedRows} baris hasil tidak dihitung. Cocokkan identitas atau rombel pada database.`);
    insights.append(list);
    renderTable(items);
    renderHeatmap(items);
    refreshRosterOptions();
  }

  function renderHeatmap(items){
    const host=$('heatmapContent');if(!host)return;
    host.replaceChildren();
    const subjects=[...new Set(items.map(e=>e.subject))].sort();
    const rooms=[...new Set(items.flatMap(e=>(e.rooms||[]).map(r=>r.room)))].sort((a,b)=>a.localeCompare(b,'id',{numeric:true}));
    if(!rooms.length||!subjects.length){host.append(el('div','empty','Belum ada ujian untuk heatmap.'));return;}
    const tab=el('table','heatmap-table'),thead=el('thead'),thr=el('tr');
    thr.append(el('th','', 'ROMBEL'));subjects.forEach(sub=>thr.append(el('th','',sub)));thead.append(thr);tab.append(thead);
    const tbody=el('tbody');
    rooms.forEach(room=>{
      const tr=el('tr');tr.append(el('th','heatmap-room',room));
      subjects.forEach(sub=>{
        const exams=items.filter(e=>e.subject===sub), r=exams.map(e=>(e.rooms||[]).find(x=>x.room===room)).filter(Boolean);
        const cell=el('td');if(!r.length){cell.append(el('span','heat-none','—'));tr.append(cell);return;}
        const exp=r.reduce((n,x)=>n+safeInt(x.expected),0),rec=r.reduce((n,x)=>n+safeInt(x.received),0),pct=percent(rec,exp);
        const btn=el('button','heat-cell '+(pct>=95?'green':pct>=70?'teal':pct>=40?'amber':'red'),formatPct(pct));
        btn.type='button';btn.title=`${room} • ${sub}: ${rec}/${exp} tersimpan`;btn.setAttribute('aria-label',btn.title);
        btn.addEventListener('click',()=>{
          const grade=String(room).match(/^(1[0-2]|[1-9])/);
          D.filters.grade=grade?grade[1]:'ALL';D.filters.room=room;render();
          $('mapel').scrollIntoView({behavior:prefersReduced()?'auto':'smooth',block:'start'});
        });cell.append(btn);tr.append(cell);
      });tbody.append(tr);
    });tab.append(tbody);host.append(tab);
  }
  function setSelect(id,vals,label,old){
    const e=$(id);e.replaceChildren();e.append(new Option(label,''));
    vals.forEach(v=>e.append(new Option(String(v),String(v))));
    e.value=vals.some(v=>String(v)===old)?old:'';return e.value;
  }
  function refreshRosterOptions(){
    const all=D.data?.exams||[];
    const periods=[...new Set(all.map(e=>e.period).filter(Boolean))].sort();
    const p=setSelect('rosterPeriod',periods,'Pilih asesmen',$('rosterPeriod').value);
    const byP=all.filter(e=>!p||e.period===p);
    const grades=[...new Set(byP.map(e=>String(e.grade)).filter(Boolean))].sort((a,b)=>Number(a)-Number(b));
    const g=setSelect('rosterGrade',grades,'Pilih tingkat',$('rosterGrade').value);
    const rooms=[...new Set(byP.filter(e=>!g||String(e.grade)===g).flatMap(e=>e.rooms.map(r=>r.room)))].sort((a,b)=>a.localeCompare(b,'id',{numeric:true}));
    setSelect('rosterRoom',rooms,'Pilih rombel',$('rosterRoom').value);
  }
  function clearRoster(message){
    D.roster=null;
    $('rosterHead').replaceChildren();$('rosterBody').replaceChildren();
    const tr=el('tr'),td=el('td','empty','Belum ada rekap yang dibuka.');tr.append(td);$('rosterBody').append(tr);
    $('rosterCount').textContent='—';$('searchStudent').value='';$('searchStudent').disabled=true;
    $('exportRoster').disabled=true;
    if(message)$('rosterHint').textContent=message;
  }
  function demoRoster(period,grade,room){
    const exams=(D.data?.exams||[]).filter(e=>e.period===period&&String(e.grade)===grade&&e.rooms.some(r=>r.room===room));
    const columns=exams.map(e=>({id:e.id,label:e.subject,subject:e.subject}));
    const students=Array.from({length:30},(_,idx)=>{
      const marks={}, vals=[];
      columns.forEach((col,j)=>{
        const seed=(idx*17+j*29+11)%100;
        const v=seed<14?null:Math.min(100,56+(idx*9+j*13)%45);
        marks[col.id]=v;if(v!==null)vals.push(v);
      });
      const sum=vals.length?vals.reduce((a,b)=>a+b,0):null;
      return {name:`SISWA DEMO ${String(idx+1).padStart(2,'0')}`,number:`DM-${String(idx+1).padStart(3,'0')}`,
        room,marks,total:columns.length,received:vals.length,complete:!!columns.length&&vals.length===columns.length,
        sum,average:vals.length?Math.round(sum/vals.length*100)/100:null,rank:null};
    });
    const done=students.filter(s=>s.complete).sort((a,b)=>b.sum-a.sum);
    done.forEach((s,i)=>s.rank=i&&done[i-1].sum===s.sum?done[i-1].rank:i+1);
    return {ok:true,period,grade,room,columns,students};
  }
  async function loadRoster(silent=false){
    const period=$('rosterPeriod').value,grade=$('rosterGrade').value,room=$('rosterRoom').value;
    if(!period||!grade||!room){if(!silent)toast('Pilih asesmen, tingkat, dan rombel dulu, Mod.');return;}
    if(D.rosterBusy||document.hidden)return;
    D.rosterBusy=true;$('loadRoster').disabled=true;
    $('rosterHint').textContent=D.active?'Membaca data sekolah melalui akses panitia…':'Membuat rekap simulasi…';
    try{
      let result;
      if(!D.active){result=demoRoster(period,grade,room);}
      else{
        if(!D.key)throw new Error('Silakan login ulang dengan kode akses panitia');
        const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),20000);
        try{
          const res=await fetch(D.server,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
            body:JSON.stringify({action:'roster',key:D.key,period,grade,room}),cache:'no-store',redirect:'follow',signal:ctrl.signal});
          if(!res.ok)throw new Error(`HTTP ${res.status}`);
          result=await res.json();
        }finally{clearTimeout(timer);}
        if(!result.ok)throw new Error(result.error||'Tidak bisa memuat rekap siswa');
      }
      if(!Array.isArray(result.students)||!Array.isArray(result.columns)||result.room!==room)
        throw new Error('Respons rekap dari server tidak dikenali');
      D.roster=result;$('searchStudent').disabled=false;$('exportRoster').disabled=false;
      $('rosterHint').textContent=`${D.active?'DATA SEKOLAH • KHUSUS PANITIA':'SIMULASI • BUKAN NILAI SISWA'} · ${period} / tingkat ${grade} / rombel ${room}. Nilai kosong = belum tersimpan.`;
      renderRoster();
      if(!silent)toast(`${result.students.length} peserta rombel ${room} berhasil ditampilkan.`);
    }catch(err){D.roster=null;$('searchStudent').disabled=true;$('exportRoster').disabled=true;
      $('rosterHint').textContent=`Rekap tidak tersedia: ${err.message}`;
      $('rosterHead').replaceChildren();$('rosterBody').replaceChildren(el('tr'));
      $('rosterBody').firstChild.append(el('td','empty','Periksa koneksi dan hak akses panitia.'));
    }finally{D.rosterBusy=false;$('loadRoster').disabled=false;}
  }
  function renderRoster(){
    const r=D.roster;if(!r)return;
    const thead=$('rosterHead'),body=$('rosterBody');thead.replaceChildren();body.replaceChildren();
    const tr=el('tr');['No.','Nomor peserta','Nama siswa',...r.columns.map(c=>c.label),'Jumlah','Rata-rata','Rank kelas','Status'].forEach(t=>tr.append(el('th','',t)));
    thead.append(tr);
    const query=$('searchStudent').value.toUpperCase().trim();
    const students=r.students.filter(s=>!query||`${s.name} ${s.number}`.toUpperCase().includes(query));
    students.forEach((s,i)=>{
      const row=el('tr');row.append(el('td','',String(i+1)),el('td','number-cell',s.number||'—'),el('td','student-name',s.name));
      r.columns.forEach(c=>{
        const v=s.marks?.[c.id];const td=el('td','score-cell'+(v===null||v===undefined?' score-missing':v<75?' score-low':' score-ok'),v===null||v===undefined?'—':number.format(v));
        td.title=v===null||v===undefined?'Belum masuk':'Nilai sudah tersimpan';row.append(td);
      });
      row.append(el('td','',s.sum===null?'—':number.format(s.sum)),el('td','',s.average===null?'—':number.format(s.average)));
      row.append(el('td','rank-cell',s.rank===null?'—':String(s.rank)));
      const status=el('td');status.append(el('span','roster-status '+(s.complete?'done':'pending'),s.complete?'Lengkap':`${s.received}/${s.total} mapel`));row.append(status);
      body.append(row);
    });
    if(!students.length){const row=el('tr'),td=el('td','empty','Siswa tidak ditemukan.');td.colSpan=r.columns.length+7;row.append(td);body.append(row);}
    $('rosterCount').textContent=`${students.length} / ${r.students.length} siswa • ${r.columns.length} ujian`;
  }
  function exportRosterCsv(){
    if(!D.roster)return;
    const r=D.roster,header=['No.','Nomor peserta','Nama siswa',...r.columns.map(c=>c.label),'Jumlah','Rata-rata','Rank kelas','Status'];
    const rows=r.students.map((s,i)=>[i+1,s.number,s.name,...r.columns.map(c=>s.marks[c.id]??''),s.sum??'',s.average??'',s.rank??'',s.complete?'Lengkap':'Belum lengkap']);
    const csv=v=>{let t=String(v??'');if(/^[=+\-@\t\r]/.test(t))t="'"+t;return '"'+t.replaceAll('"','""')+'"';};
    const blob=new Blob(['\ufeff',[header,...rows].map(row=>row.map(csv).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;
    a.download=`rekap-nilai-${D.active?'internal':'DEMO'}-${r.period}-${r.room}.csv`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
    toast('CSV rekap berhasil dibuat. Simpan file di lokasi internal sekolah.');
  }

  function renderTable(items){
    const search=$('searchExam').value.trim().toUpperCase();const target=$('examTable');target.replaceChildren();
    const rows=items.filter(e=>!search||[e.subject,e.teacher,e.grade,e.name].some(v=>String(v||'').toUpperCase().includes(search)))
      .sort((a,b)=>percent(a.received,a.expected)-percent(b.received,b.expected) || a.subject.localeCompare(b.subject));
    rows.forEach(e=>{
      const p=percent(e.received,e.expected),row=document.createElement('tr');
      const subject=el('td','',e.subject),desc=el('small','',`${e.name} • ${e.teacher||'Guru'}`);subject.append(desc);
      row.append(subject,el('td','',e.grade||'—'),el('td','',number.format(e.expected)),el('td','',number.format(e.received)));
      const progress=el('td'),wrap=el('div','table-progress'),track=el('div','table-track'),fill=el('span');fill.style.width=p+'%';track.append(fill);wrap.append(track,el('span','',formatPct(p)));progress.append(wrap);row.append(progress,el('td','',e.received?number.format(Math.round((Number(e.average)||0)*100)/100):'—'));
      const statusCell=el('td'),status=el('span','status '+(e.expected===0||p===0?'zero':p===100?'done':p<50?'low':'mid'),e.expected===0?'Cek rombel':p===100?'Tuntas':p===0?'Belum scan':'Berjalan');statusCell.append(status);row.append(statusCell);target.append(row);
    });
    if(!rows.length){const tr=document.createElement('tr'),td=el('td','empty','Tidak ada data ujian yang cocok.');td.colSpan=7;tr.append(td);target.append(tr);}
    $('tableCount').textContent=`Menampilkan ${rows.length} dari ${items.length} ujian • ${D.active?'Data server sekolah':'DATA SIMULASI'}`;
  }
  function csvExport(){
    const records=selectedItems();const safeCsv=x=>{
      let v=String(x==null?'':x);if(/^[=+\-@\t\r]/.test(v))v="'"+v;
      return '"'+v.replaceAll('"','""')+'"';
    };
    const head=['Jenis asesmen','Ujian','Mapel','Tingkat','Guru','Target peserta','Hasil diterima','Belum masuk','Persen masuk'];
    const rows=[head,...records.map(e=>[e.period,e.name,e.subject,e.grade,e.teacher,e.expected,e.received,Math.max(0,e.expected-e.received),percent(e.received,e.expected)])];
    const text='\ufeff'+rows.map(row=>row.map(safeCsv).join(';')).join('\r\n');
    const url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download=`pantauan-${D.active?'sekolah':'SIMULASI'}-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function getSummary(){
    if(!D.active||!D.server||!D.key||D.busy||document.hidden)return;
    D.busy=true;$('refreshBtn').disabled=true;
    try {
      const ctrl=new AbortController();const timeout=setTimeout(()=>ctrl.abort(),20000);
      let resp;
      try {resp=await fetch(D.server,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'summary',key:D.key}),cache:'no-store',redirect:'follow',signal:ctrl.signal});}finally{clearTimeout(timeout);}
      if(!resp.ok)throw new Error(`Server membalas HTTP ${resp.status}`);
      const data=await resp.json();
      if(!data.ok){if(/kode akses/i.test(data.error||'')){D.key='';D.roster=null;showDialog();}throw new Error(data.error||'Server menolak permintaan');}
      if(!Array.isArray(data.exams))throw new Error('Format data dashboard tidak dikenali');
      const wasLive=D.data?.version&&D.active;
      const oldTotal=wasLive?(D.data.exams||[]).reduce((sum,e)=>sum+safeInt(e.received),0):null;
      const newTotal=(data.exams||[]).reduce((sum,e)=>sum+safeInt(e.received),0);
      D.data=data;status('Tersinkron','');render();$('connectionError').textContent='';
      if(oldTotal!==null&&newTotal>oldTotal)toast(`↗ ${number.format(newTotal-oldTotal)} hasil LJK baru tersinkron.`);
      if(D.roster&&!D.rosterBusy&&$('rosterRoom').value===D.roster.room)
        void loadRoster(true);
      return true;
    }catch(error){status('Koneksi terganggu','error');const msg=error?.name==='AbortError'?'Server terlalu lama merespons':error?.message||'Jaringan gagal';
      $('updatedAt').textContent='Gagal memperbarui: '+msg;
      $('connectionError').textContent=msg+' — periksa URL, akses Web App, izin, dan kode panitia.';
      return false;
    }finally{D.busy=false;$('refreshBtn').disabled=false;}
  }
  async function connect(ev){
    ev.preventDefault();const url=$('serverInput').value.trim(),key=$('keyInput').value;
    if(!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)){$('connectionError').textContent='Gunakan URL Web App dari Apps Script Dashboard, bukan URL editor.';return;}
    if(key.length<32){$('connectionError').textContent='Kode admin terlalu pendek. Gunakan kode yang dibuat generator operator.';return;}
    D.server=url;D.key=key;D.active=true;clearRoster('Pilih kembali rombel untuk membuka nilai sekolah.');
    $('connectionError').textContent='Menghubungkan…';
    const ok=await getSummary();
    if(ok){safeStorage.setItem('pantauan-server',url);$('keyInput').value='';showDialog(false);}
  }
  function setDemo(){D.active=false;D.key='';D.roster=null;D.data=synthetic();
    $('rosterHead').replaceChildren();$('rosterBody').replaceChildren();$('rosterHint').textContent='SIMULASI • Pilih asesmen dan rombel untuk melihat contoh siswa fiktif.';
    $('searchStudent').value='';$('searchStudent').disabled=true;$('exportRoster').disabled=true;
    status('Mode demo','demo');D.filters={period:'ALL',grade:'ALL',room:'ALL'};render();showDialog(false);
  }
  function init(){
    $('openSettings').addEventListener('click',()=>showDialog());$('demoConnect').addEventListener('click',()=>showDialog());
    $('closeSettings').addEventListener('click',()=>showDialog(false));$('previewDemo').addEventListener('click',setDemo);
    $('disconnectBtn').addEventListener('click',()=>{safeStorage.removeItem('pantauan-server');D.server='';setDemo();});
    $('connectionForm').addEventListener('submit',connect);
    $('refreshBtn').addEventListener('click',()=>D.active?getSummary():render());
    $('exportCsv').addEventListener('click',csvExport);
    $('periodFilter').addEventListener('change',e=>{D.filters.period=e.target.value;D.filters.grade='ALL';D.filters.room='ALL';render();});
    $('gradeFilter').addEventListener('change',e=>{D.filters.grade=e.target.value;D.filters.room='ALL';render();});
    $('roomFilter').addEventListener('change',e=>{D.filters.room=e.target.value;render();});
    $('searchExam').addEventListener('input',()=>renderTable(selectedItems()));
    $('rosterPeriod').addEventListener('change',()=>{clearRoster('Filter berubah, tekan Tampilkan rekap untuk membaca data baru.'); $('rosterGrade').value=''; $('rosterRoom').value='';refreshRosterOptions(); });
    $('rosterGrade').addEventListener('change',()=>{clearRoster('Filter berubah, tekan Tampilkan rekap untuk membaca data baru.'); $('rosterRoom').value='';refreshRosterOptions(); });
    $('rosterRoom').addEventListener('change',()=>clearRoster('Rombel berubah, tekan Tampilkan rekap untuk membaca data baru.'));
    $('loadRoster').addEventListener('click',()=>loadRoster());
    $('searchStudent').addEventListener('input',renderRoster);
    $('exportRoster').addEventListener('click',exportRosterCsv);
    const toggleTheme=()=>{const isDark=document.body.dataset.theme==='dark';document.body.dataset.theme=isDark?'light':'dark';
      safeStorage.setItem('ra-theme',document.body.dataset.theme);
      $('themeToggle').textContent=isDark?'☾':'☀';$('themeToggle').setAttribute('aria-label',isDark?'Aktifkan tema gelap':'Aktifkan tema terang');};
    document.body.dataset.theme=safeStorage.getItem('ra-theme')==='dark'?'dark':'light';
    $('themeToggle').textContent=document.body.dataset.theme==='dark'?'☀':'☾';
    $('themeToggle').addEventListener('click',toggleTheme);
    $('ifpToggle').addEventListener('click',()=>{
      document.body.classList.toggle('ifp-mode');
      toast(document.body.classList.contains('ifp-mode')?'Mode presentasi aktif: angka & grafik diperbesar.':'Mode presentasi nonaktif.');
    });
    if(matchMedia('(pointer:fine)').matches&&!prefersReduced()){
      document.addEventListener('pointermove',ev=>{
        const aura=$('cursorAura');aura.style.transform=`translate3d(${ev.clientX-75}px,${ev.clientY-75}px,0)`;
        aura.style.opacity='1';
      },{passive:true});
    }
    window.addEventListener('keydown',e=>{if(e.key==='Escape')showDialog(false);});
    D.data=synthetic();status('Mode demo','demo');render();
    if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
    D.tick=setInterval(()=>{if(D.active)void getSummary();},25000);
  }
  // Keep renderer pure enough to unit-test without exposing any student record.
  if(typeof module==='object' && typeof module.exports==='object')module.exports={percent,selectedItems,synthetic};
  if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded',init);
})();
