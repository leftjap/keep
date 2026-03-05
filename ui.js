// ═══════════════════════════════════════
// ui.js — UI 전환, 탭, 리스트 렌더링 (Day One 스타일 v5.2)
// ═══════════════════════════════════════

// ═══ 탭별 파스텔 색상 ═══
const TAB_COLORS = {
  navi:    '#7EB5F4',
  fiction: '#F4B77E',
  blog:    '#82C99A',
  book:    '#7E9CF4',
  quote:   '#C49ADE',
  memo:    '#B0B0B8'
};

function applyTabColor(tabId) {
  document.documentElement.style.setProperty('--tab-color', '#E55643');
}

// ═══ 레이아웃 전환 ═══
function switchListView(view) {
  currentListView = view;
  ['list','photo','calendar'].forEach(v => {
    document.getElementById('pane-'+v).style.display = 'none';
    document.getElementById('btn-'+v).classList.remove('on');
  });
  const target = document.getElementById('pane-'+view);
  target.style.display = (view==='list') ? 'flex' : 'block';
  document.getElementById('btn-'+view).classList.add('on');
  renderListPanel();
}

function toggleSidebar() {
  const app = document.getElementById('mainApp');
  const w = window.innerWidth;
  if(w >= 769 && w <= 1400) {
    // 태블릿: tablet-side-open 토글
    app.classList.toggle('tablet-side-open');
  } else if(w > 1400) {
    // PC: sidebar-closed 토글
    app.classList.toggle('sidebar-closed');
  } else {
    // 모바일: 오버레이 방식
    if(app.classList.contains('view-side')) {
      app.classList.remove('view-side');
    } else {
      app.classList.add('view-side');
    }
  }
}

function setMobileView(view) {
  const app = document.getElementById('mainApp');
  const w = window.innerWidth;

  // 태블릿 (769~1400) — CSS 미디어쿼리 범위와 일치
  if(w >= 769 && w <= 1400) {
    if(view==='list') {
      if(app.classList.contains('tablet-side-open')) {
        app.classList.remove('tablet-side-open');
      }
      if(app.classList.contains('tablet-list-closed')) {
        app.classList.remove('tablet-list-closed');
      }
      renderListPanel();
    }
    if(view==='side') toggleSidebar();
    if(view==='editor') {
    }
    return;
  }

  // PC (1401 이상)
  if(w > 1400) {
    if(view==='list') {
      // 사이드바가 닫혀있고 리스트도 닫혀있으면 리스트 열기
      if(app.classList.contains('list-closed')) {
        app.classList.remove('list-closed');
      }
      renderListPanel();
    }
    if(view==='side') toggleSidebar();
    return;
  }

  // 모바일 (768 이하)
  if(view==='side') {
    app.classList.add('view-side');
    return;
  }
  app.classList.remove('view-side','view-list','view-editor');
  app.classList.add('view-'+view);
  if(view==='list') renderListPanel();
}


function toggleSearch() {
  const bar=document.getElementById('searchBar'), input=document.getElementById('searchInput'), vs=document.getElementById('viewSwitcher');
  bar.classList.toggle('active');
  if(bar.classList.contains('active')) { vs.style.display='none'; input.focus(); }
  else { clearSearch(); }
}

function handleSearch(e) {
  currentSearchQuery = e.target.value.trim();
  document.getElementById('clearSearchBtn').style.display = currentSearchQuery ? 'flex' : 'none';
  renderListPanel();
}

function clearSearch() {
  const input = document.getElementById('searchInput');
  input.value = '';
  currentSearchQuery = '';
  document.getElementById('clearSearchBtn').style.display = 'none';
  document.getElementById('searchBar').classList.remove('active');
  document.getElementById('viewSwitcher').style.display = 'flex';
  renderListPanel();
}

function setTagSearch(tag) {
  const bar=document.getElementById('searchBar'), input=document.getElementById('searchInput'), vs=document.getElementById('viewSwitcher');
  bar.classList.add('active'); vs.style.display='none';
  input.value=tag; currentSearchQuery=tag;
  document.getElementById('clearSearchBtn').style.display='flex';
  if(window.innerWidth<=768) setMobileView('list');
  renderListPanel();
}

// ═══ 탭 전환 ═══
function renderWritingGrid() {
  const nav = document.getElementById('sideNav'); if(!nav) return;
  const tabs = [
    {id:'navi',   label:'오늘의 네비'},
    {id:'fiction', label:'단편 습작'},
    {id:'blog',   label:'블로그'},
    {id:'book',   label:'서재'},
    {id:'quote',  label:'어구'},
    {id:'memo',   label:'메모'}
  ];
  let html = '';
  tabs.forEach(t => {
    const isOn = activeTab===t.id;
    html += `<div class="side-menu ${isOn?'on':''}" data-tab="${t.id}" onclick="switchTab('${t.id}'); setMobileView('list');">
      <div class="side-menu-l">${t.label}</div>
      <div class="wi-arrow">›</div>
    </div>`;
  });
  nav.innerHTML = html;
}

window.addEventListener('resize', () => { renderWritingGrid(); renderChk(); updateBackBtnIcon(); });
function switchTab(t) {
  if(textTypes.includes(activeTab)) saveCurDoc(activeTab);
  activeTab = t;
  applyTabColor(t);
  document.getElementById('editorText').style.display  = textTypes.includes(t) ? 'flex':'none';
  document.getElementById('editorBook').style.display  = t==='book'  ? 'flex':'none';
  document.getElementById('editorQuote').style.display = t==='quote' ? 'flex':'none';
  document.getElementById('editorMemo').style.display  = t==='memo'  ? 'flex':'none';
  document.getElementById('edToolbar').style.display   = ['book','quote'].includes(t) ? 'none':'flex';
  clearSearch(); hideRoutineCard(); switchListView('list');
  // 태블릿: 사이드바 열려있으면 닫으면서 리스트로 전환
  const app = document.getElementById('mainApp');
  if(window.innerWidth >= 769 && window.innerWidth <= 1400 && app.classList.contains('tablet-side-open')) {
    app.classList.remove('tablet-side-open');
  }
  setMobileView('list'); updateBackBtnIcon(); if(textTypes.includes(t)) { const docs=getDocs(t);
 if(curIds[t])loadDoc(t,curIds[t],true); else if(docs.length)loadDoc(t,docs[0].id,true); else{const nd=newDoc(t);loadDoc(t,nd.id,true);} }
  if(t==='book')  { if(curBookId)loadBook(curBookId,true); else{const b=getBooks();if(b.length)loadBook(b[0].id,true);else newBook();} }
  if(t==='memo')  { if(curMemoId)loadMemo(curMemoId,true); else{const m=getMemos();if(m.length)loadMemo(m[0].id,true);else newMemoForm();} }
  if(t==='quote') { newQuoteForm(); }
  renderListPanel();
}

// ═══ 리스트 패널 렌더링 ═══
function getThumb(content) {
  if(!content) return '';
  const m = content.match(/<img[^>]+src=["'](data:image[^"']+|https?:[^"']+)["'][^>]*>/i);
  return m ? m[1] : '';
}

function getThumbs(content, max) {
  if(!content) return [];
  const regex = /<img[^>]+src=["'](data:image[^"']+|https?:[^"']+)["'][^>]*>/gi;
  const results = [];
  let m;
  while((m = regex.exec(content)) !== null && results.length < (max||2)) {
    results.push(m[1]);
  }
  return results;
}

function getRelativeTime(dateStr) {
  if(!dateStr) return '';
  const now = new Date(), d = new Date(dateStr);
  const diff = Math.floor((now - d) / 1000);
  if(diff < 60) return '방금 전';
  if(diff < 3600) return Math.floor(diff/60) + '분 전';
  if(diff < 86400) return Math.floor(diff/3600) + '시간 전';
  if(diff < 604800) return Math.floor(diff/86400) + '일 전';
  const y = d.getFullYear(), m = d.getMonth()+1, day = d.getDate();
  const nowY = now.getFullYear();
  if(y === nowY) return m + '월 ' + day + '일';
  return y + '년 ' + m + '월 ' + day + '일';
}

const escapeHtml = (str) => {  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
};

const hl = (txt) => {
  if (!txt) return '';
  const safe = escapeHtml(txt);
  if (!currentSearchQuery) return safe;
  const safeQuery = escapeHtml(currentSearchQuery).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return safe.replace(new RegExp(`(${safeQuery})`,'gi'),'<mark class="highlight">$1</mark>');
};

const getPreviewText = (htmlContent) => {
  let raw = stripHtml(htmlContent||'').replace(/https?:\/\/[^\s]+/g,'').replace(/\s+/g,' ').trim();
  raw = raw.slice(0,60);  if(!currentSearchQuery) return raw.slice(0,80);
  const idx = raw.toLowerCase().indexOf(currentSearchQuery.toLowerCase());
  if(idx!==-1) { const start=Math.max(0,idx-30), end=Math.min(raw.length,idx+currentSearchQuery.length+30); return (start>0?'...':'')+raw.substring(start,end)+(end<raw.length?'...':''); }
  return raw.slice(0,80);
};

// ═══ 아이템 HTML 생성 — v5.2: same-date 클래스 + no-date 클래스 ═══
function generateItemHtml(item, t, showDate) {
  if(showDate === undefined) showDate = true;
  const dt=new Date(item.created||item.date||Date.now()), day=dt.getDate(), dow=weekdays[dt.getDay()], time=formatTimeOnly(item.created||item.date);
  const relTime = getRelativeTime(item.created||item.date);
  const swipePin = fn => `<div class="swipe-action pin-action" onclick="event.stopPropagation();${fn}"><span><svg viewBox="0 0 24 24"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.68V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.68a2 2 0 0 1-1.11 1.87l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>고정</span></div>`;
  const swipeDel = fn => `<div class="swipe-action del-action" onclick="event.stopPropagation();${fn}"><span><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>삭제</span></div>`;

  // v5.2: 날짜 표시 여부에 따라 클래스 분기
  const dateBlock = showDate
    ? `<div class="lp-date-wrap"><div class="lp-dow">${dow}</div><div class="lp-day">${day}</div></div>`
    : `<div class="lp-date-wrap no-date"><div class="lp-dow">&nbsp;</div><div class="lp-day">&nbsp;</div></div>`;

  // v5.2: 같은 날짜 후속 항목에 same-date 클래스 추가
  const sameDateClass = showDate ? '' : ' same-date';

  let isCur=false, clickFn='';

  if(textTypes.includes(t)) {
    isCur=curIds[t]===item.id; clickFn=`loadDoc('${t}','${item.id}'); setMobileView('editor');`;
    const rawPreview=getPreviewText(item.content), preview=hl(rawPreview);
    const thumbs=getThumbs(item.content, 5);
    const thumbsHtml=thumbs.length?`<div class="lp-thumbs">${thumbs.map(src=>`<img src="${src}" alt="">`).join('')}</div>`:'';
    const tagHtml=item.tags?`<div class="lp-item-tags">${hl(item.tags)}</div>`:'';
    return `<div class="lp-item${sameDateClass} ${isCur?'on':''}" onclick="${clickFn}"><div class="lp-item-title">${hl(item.title||'제목 없음')}</div>${tagHtml}${preview?`<div class="lp-item-preview">${preview}</div>`:''}${thumbsHtml}<div class="lp-item-meta">${item.pinned?'<svg style="width:12px;height:12px;vertical-align:-1px;margin-right:2px;" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.68V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.68a2 2 0 0 1-1.11 1.87l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>  ':''}${relTime}</div><div class="swipe-actions">${swipePin(`togglePin('${t}','${item.id}',event)`)}${swipeDel(`delDoc('${t}','${item.id}',event)`)}</div></div>`;
  } else if(t==='book') {
    isCur=curBookId===item.id; clickFn=`loadBook('${item.id}'); setMobileView('editor');`;
    const authorPub=[item.author,item.publisher].filter(Boolean).join(' · ');
    return `<div class="lp-item${sameDateClass} ${isCur?'on':''}" onclick="${clickFn}"><div class="lp-item-title">${hl(item.title)}</div><div class="lp-item-preview">${hl(authorPub)}</div><div class="lp-item-meta">${item.pinned?'<svg style="width:12px;height:12px;vertical-align:-1px;margin-right:2px;" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.68V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.68a2 2 0 0 1-1.11 1.87l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>  ':''}${relTime}</div><div class="swipe-actions">${swipePin(`togglePin('${t}','${item.id}',event)`)}${swipeDel(`delBook('${item.id}',event)`)}</div></div>`;
  } else if(t==='quote') {
    isCur=curQuoteId===item.id; clickFn=`loadQuote('${item.id}'); setMobileView('editor');`;
    return `<div class="lp-item${sameDateClass} ${isCur?'on':''}" onclick="${clickFn}"><div class="quote-txt">${hl(item.text)}</div><div class="lp-item-meta" style="margin-top:4px;">${item.pinned?'<svg style="width:12px;height:12px;vertical-align:-1px;margin-right:2px;" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.68V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.68a2 2 0 0 1-1.11 1.87l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>  ':''}${item.by?hl(item.by)+' · ':''}${relTime}</div><div class="swipe-actions">${swipePin(`togglePin('${t}','${item.id}',event)`)}${swipeDel(`delQuote('${item.id}',event)`)}</div></div>`;
  } else if(t==='memo') {
    isCur=curMemoId===item.id; clickFn=`loadMemo('${item.id}'); setMobileView('editor');`;
    const rawPreview=getPreviewText(item.content), preview=hl(rawPreview);
    const thumbs=getThumbs(item.content, 5);
    const thumbsHtml=thumbs.length?`<div class="lp-thumbs">${thumbs.map(src=>`<img src="${src}" alt="">`).join('')}</div>`:'';
    const tagHtml=item.tags?`<div class="lp-item-tags">${hl(item.tags)}</div>`:'';
    return `<div class="lp-item${sameDateClass} ${isCur?'on':''}" onclick="${clickFn}"><div class="lp-item-title">${hl(item.title||'제목 없음')}</div>${tagHtml}${preview?`<div class="lp-item-preview">${preview}</div>`:''}${thumbsHtml}<div class="lp-item-meta">${item.pinned?'<svg style="width:12px;height:12px;vertical-align:-1px;margin-right:2px;" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.68V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.68a2 2 0 0 1-1.11 1.87l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>  ':''}${relTime}</div><div class="swipe-actions">${swipePin(`togglePin('${t}','${item.id}',event)`)}${swipeDel(`delMemo('${item.id}',event)`)}</div></div>`;
  }
  return '';
}

// ═══ 사진 뷰 ═══
let selectedPhotoId = null;
function renderPhotoView(items, t) {
  const grid = document.getElementById('photoGrid');
  const photoItems = items.filter(item => {
    let thumb=''; if(textTypes.includes(t)||t==='memo') thumb=getThumb(item.content); return !!thumb;
  });
  if(!photoItems.length) { grid.innerHTML='<div style="padding:40px 20px;text-align:center;color:var(--tx-hint);grid-column:1/-1;font-size:13px;">사진이 포함된 기록이 없습니다</div>'; return; }
  let html='';
  photoItems.forEach(item => {
    const thumb=getThumb(item.content), dt=new Date(item.created||item.date||Date.now());
    const day=String(dt.getDate()).padStart(2,'0');
    const ym=`${dt.getFullYear()}년 ${dt.getMonth()+1}월`;
    const isSolo=photoItems.length===1, isSelected=selectedPhotoId===item.id;
    let clickFn=`loadDoc('${t}','${item.id}'); setMobileView('editor');`;
    if(t==='memo') clickFn=`loadMemo('${item.id}'); setMobileView('editor');`;
    html+=`<div class="photo-cell${isSolo?' solo':''}${isSelected?' selected':''}" onclick="selectPhoto('${item.id}', event); ${clickFn}">
      <div class="photo-cell-bg" style="background-image:url('${thumb}');"></div>
      <div class="photo-date-block">
        <span class="photo-day-num">${day}</span>
        <span class="photo-ym">${ym}</span>
      </div>
    </div>`;
  });
  grid.innerHTML = html;
}

function selectPhoto(id, e) {
  e.stopPropagation();
  selectedPhotoId = (selectedPhotoId===id) ? null : id;
  document.querySelectorAll('.photo-cell').forEach(el => el.classList.remove('selected'));
  if(selectedPhotoId) {
    document.querySelectorAll('.photo-cell').forEach(el => {
      if(el.getAttribute('onclick')&&el.getAttribute('onclick').includes(`'${selectedPhotoId}'`)) el.classList.add('selected');
    });
  }
}

// ═══ 캘린더 뷰 ═══
function renderCalendarView(items, t) {
  const calWrap=document.getElementById('calWrap');
  const todayD=new Date();
  const todayY=todayD.getFullYear(), todayM=todayD.getMonth()+1, todayDay=todayD.getDate();

  let minDate=new Date(todayY, todayM-1, 1);
  const futureEnd=new Date(todayY, todayM+1, 0);
  let maxDate=futureEnd;

  const entriesMap={}, photoDays={}, itemMap={};
  items.forEach(item=>{
    const dt=new Date(item.created||item.date||Date.now());
    if(dt<minDate) minDate=new Date(dt.getFullYear(), dt.getMonth(), 1);
    const y=dt.getFullYear(),m=dt.getMonth()+1,d=dt.getDate();
    const key=`${y}-${m}`,pKey=`${y}-${m}-${d}`;
    if(!entriesMap[key])entriesMap[key]=new Set();
    entriesMap[key].add(d);
    if(!itemMap[pKey])itemMap[pKey]=[];
    itemMap[pKey].push(item.id);
    let thumb=''; if(textTypes.includes(t)||t==='memo')thumb=getThumb(item.content);
    if(thumb&&!photoDays[pKey])photoDays[pKey]=thumb;
  });

  let startY=minDate.getFullYear(), startM=minDate.getMonth()+1;
  let endY=maxDate.getFullYear(), endM=maxDate.getMonth()+1;

  const months=[]; let cy=startY,cm=startM;
  while(cy<endY||(cy===endY&&cm<=endM)){
    months.push({y:cy,m:cm,label:`${cy}년 ${cm}월`});
    cm++; if(cm>12){cm=1;cy++;}
  }

  let html='';
  months.forEach((mo,mi)=>{
    const first=new Date(mo.y,mo.m-1,1).getDay(), days=new Date(mo.y,mo.m,0).getDate();
    const key=`${mo.y}-${mo.m}`, entries=entriesMap[key]?Array.from(entriesMap[key]):[];
    let cells='';
    for(let i=0;i<first;i++) cells+=`<div class="cal-day empty"></div>`;
    for(let d=1;d<=days;d++){
      const has=entries.includes(d);
      const isToday=(mo.y===todayY && mo.m===todayM && d===todayDay);
      const pk=`${mo.y}-${mo.m}-${d}`, thumb=photoDays[pk];
      let cls='cal-day'; if(has)cls+=' has-entry'; if(isToday)cls+=' today';
      let inner='', numHtml=d;
      if(thumb){cls+=' has-photo';inner=`<div class="cal-photo-bg" style="background-image:url('${thumb}');"></div>`;numHtml=`<span class="cal-day-num">${d}</span>`;}
      let clickFn='';
      if(has&&itemMap[pk]&&itemMap[pk].length>0){
        if(itemMap[pk].length===1){
          const docId=itemMap[pk][0];
          let loadCall=`loadDoc('${t}','${docId}')`;
          if(t==='book')loadCall=`loadBook('${docId}')`;
          else if(t==='quote')loadCall=`loadQuote('${docId}')`;
          else if(t==='memo')loadCall=`loadMemo('${docId}')`;
          clickFn=`onclick="selectCalDay(this); ${loadCall}; setMobileView('editor');"`;
        } else {
          clickFn=`onclick="selectCalDay(this); showDayList('${pk}','${t}'); setMobileView('editor');"`;
        }
      }
      cells+=`<div class="${cls}" ${clickFn}>${inner}${numHtml}</div>`;
    }
    const monthId = `cal-month-${mo.y}-${mo.m}`;
    html+=`${mi>0?'<div class="cal-separator"></div>':''}
      <div class="cal-month-title" id="${monthId}">${mo.label}</div>
      <div class="cal-grid">${cells}</div>`;
  });
  calWrap.innerHTML=html;

  requestAnimationFrame(()=>{
    const currentEl = document.getElementById(`cal-month-${todayY}-${todayM}`);
    if(currentEl) {
      const pane = document.getElementById('pane-calendar');
      if(pane) {
        currentEl.scrollIntoView({block:'start'});
        pane.scrollTop = Math.max(0, pane.scrollTop - 40);
      }
    }
  });
}

function selectCalDay(element) {
  document.querySelectorAll('.cal-day').forEach(el=>el.classList.remove('selected'));
  if(element) element.classList.add('selected');
}

function showDayList(dateKey, type) {
  // dateKey = "2026-3-5" 형식
  const parts=dateKey.split('-');
  const y=parseInt(parts[0]), m=parseInt(parts[1]), d=parseInt(parts[2]);
  const dt=new Date(y, m-1, d);
  const dayLabel=`${y}년 ${m}월 ${d}일 (${weekdays[dt.getDay()]})`;

  // 해당 날짜 항목 수집
  let items=[];
  if(textTypes.includes(type)) items=getDocs(type);
  else if(type==='book') items=getBooks();
  else if(type==='quote') items=getQuotes();
  else if(type==='memo') items=getMemos();

  const dateItems=items.filter(item=>{
    const itemDt=new Date(item.created||item.date||0);
    return itemDt.getFullYear()===y && (itemDt.getMonth()+1)===m && itemDt.getDate()===d;
  }).sort((a,b)=>new Date(b.created||b.date||0)-new Date(a.created||a.date||0));

  if(dateItems.length===0) return;
  if(dateItems.length===1){
    hideDayList();
    if(textTypes.includes(type)) loadDoc(type, dateItems[0].id);
    else if(type==='book') loadBook(dateItems[0].id);
    else if(type==='quote') loadQuote(dateItems[0].id);
    else if(type==='memo') loadMemo(dateItems[0].id);
    return;
  }

  // 에디터 패널들 숨기고 리스트 패널 표시
  document.getElementById('editorText').style.display='none';
  document.getElementById('editorBook').style.display='none';
  document.getElementById('editorQuote').style.display='none';
  document.getElementById('editorMemo').style.display='none';
  document.getElementById('edToolbar').style.display='none';
  const dayListPanel=document.getElementById('editorDayList');
  dayListPanel.style.display='flex';

  // 날짜 표시
  document.getElementById('edDate').textContent=dayLabel;

  // 카드 HTML 생성
  let html=`<div class="day-list-header">${m}월 ${d}일</div>`;
  html+=`<div class="day-list-sub">${dateItems.length}개의 기록</div>`;
  html+=`<div class="day-list-items">`;

  dateItems.forEach(item=>{
    const time=formatTimeOnly(item.created||item.date);
    let title='', preview='', thumbs=[];
    let clickFn='';

    if(textTypes.includes(type)){
      title=item.title||'제목 없음';
      preview=stripHtml(item.content||'').replace(/\s+/g,' ').trim().slice(0,120);
      thumbs=getThumbs(item.content, 3);
      clickFn=`hideDayList(); loadDoc('${type}','${item.id}'); setMobileView('editor');`;
    } else if(type==='book'){
      title=item.title||'제목 없음';
      preview=[item.author, item.publisher].filter(Boolean).join(' · ');
      clickFn=`hideDayList(); loadBook('${item.id}'); setMobileView('editor');`;
    } else if(type==='quote'){
      title=item.text ? (item.text.length>50 ? item.text.slice(0,50)+'…' : item.text) : '';
      preview=item.by||'';
      clickFn=`hideDayList(); loadQuote('${item.id}'); setMobileView('editor');`;
    } else if(type==='memo'){
      title=item.title||'제목 없음';
      preview=stripHtml(item.content||'').replace(/\s+/g,' ').trim().slice(0,120);
      thumbs=getThumbs(item.content, 3);
      clickFn=`hideDayList(); loadMemo('${item.id}'); setMobileView('editor');`;
    }

    const safeTitle=escapeHtml(title);
    const safePreview=escapeHtml(preview);

    html+=`<div class="day-list-card" onclick="${clickFn}">`;

    // 썸네일이 1개면 큰 이미지로 왼쪽에
    if(thumbs.length===1){
      html+=`<img class="day-list-card-thumb" src="${thumbs[0]}" alt="">`;
    }

    html+=`<div class="day-list-card-body">`;
    html+=`<div class="day-list-card-title">${safeTitle}</div>`;
    if(safePreview) html+=`<div class="day-list-card-preview">${safePreview}</div>`;

    // 썸네일이 2개 이상이면 본문 아래 작은 이미지 나열
    if(thumbs.length>=2){
      html+=`<div class="day-list-card-thumbs">`;
      thumbs.forEach(src=>{ html+=`<img src="${src}" alt="">`; });
      html+=`</div>`;
    }

    html+=`<div class="day-list-card-meta">${time}</div>`;
    html+=`</div></div>`;
  });

  html+=`</div>`;
  document.getElementById('dayListWrap').innerHTML=html;
}

function hideDayList(){
  const dayListPanel=document.getElementById('editorDayList');
  if(dayListPanel) dayListPanel.style.display='none';
  // 현재 탭에 맞는 에디터 패널 복원
  document.getElementById('editorText').style.display=textTypes.includes(activeTab)?'flex':'none';
  document.getElementById('editorBook').style.display=activeTab==='book'?'flex':'none';
  document.getElementById('editorQuote').style.display=activeTab==='quote'?'flex':'none';
  document.getElementById('editorMemo').style.display=activeTab==='memo'?'flex':'none';
  document.getElementById('edToolbar').style.display=['book','quote'].includes(activeTab)?'none':'flex';
}

// ═══ 리스트 패널 메인 렌더링 ═══
function renderListPanel() {
  renderWritingGrid();
  const t=activeTab, el=document.getElementById('pane-list');
  const emptyState='<div style="text-align:center;padding:80px 20px;color:var(--tx-hint);font-size:15px">기록이 없습니다</div>';
  let items=[];
  let isRoutineMode = document.getElementById('pane-routine') && document.getElementById('pane-routine').style.display !== 'none';
  if(isRoutineMode){
    const td=today();
    const allItems=[];
    allDocs().forEach(d=>{const dt=(d.created||d.updated||'').slice(0,10);if(dt===td)allItems.push({...d,_type:d.type});});
    getBooks().forEach(b=>{const dt=(b.date||b.created||'').slice(0,10);if(dt===td)allItems.push({...b,_type:'book'});});
    getQuotes().forEach(q=>{const dt=(q.created||'').slice(0,10);if(dt===td)allItems.push({...q,_type:'quote'});});
    getMemos().forEach(m=>{const dt=(m.created||m.updated||'').slice(0,10);if(dt===td)allItems.push({...m,_type:'memo'});});
    allItems.sort((a,b)=>new Date(b.created||b.date||0)-new Date(a.created||a.date||0));
    items=allItems;
  }
  else if(textTypes.includes(t))items=getDocs(t);
  else if(t==='book')items=getBooks();
  else if(t==='quote')items=getQuotes();
  else if(t==='memo')items=getMemos();

  if(currentSearchQuery){
    const q=currentSearchQuery.toLowerCase();
    items=items.filter(it=>{
      const title=(it.title||'').toLowerCase(),content=(stripHtml(it.content||'')).toLowerCase();
      const tags=(it.tags||'').toLowerCase(),text=(it.text||'').toLowerCase();
      const by=(it.by||'').toLowerCase(),author=(it.author||'').toLowerCase();
      const dt=new Date(it.created||it.date||Date.now()),dStr=getLocalYMD(dt);
      return title.includes(q)||content.includes(q)||tags.includes(q)||text.includes(q)||by.includes(q)||author.includes(q)||dStr.includes(q);
    });
  }

  if(currentListView==='photo'){renderPhotoView(items,t);}
  if(currentListView==='calendar'){renderCalendarView(items,t);}
  if(!items.length){
    if(isRoutineMode){el.innerHTML='';return;}
    el.innerHTML=emptyState;return;
  }
  const pinnedItems=items.filter(i=>i.pinned), unpinnedItems=items.filter(i=>!i.pinned);
  const sortFn=(a,b)=>new Date(b.created||b.date||0)-new Date(a.created||a.date||0);
  pinnedItems.sort(sortFn); unpinnedItems.sort(sortFn);

  let html='';

  if(pinnedItems.length>0){
    let pinLastDate='';
    pinnedItems.forEach(item=>{
      const dt=new Date(item.created||item.date||Date.now());
      const dateKey=getLocalYMD(dt);
      const showDate=(dateKey!==pinLastDate);
      pinLastDate=dateKey;
      const itemType=item._type||t;
      html+=generateItemHtml(item,itemType,showDate).replace('class="lp-item','class="lp-item pinned-item');
    });
  }

  let currentMonthStr='', lastDateStr='';
  unpinnedItems.forEach(item=>{
    const dt=new Date(item.created||item.date||Date.now());
    const mStr=getMonthYearStr(dt.toISOString());
    if(mStr!==currentMonthStr){
      currentMonthStr=mStr;
      lastDateStr='';
    }
    const dateKey=getLocalYMD(dt);
    const showDate=(dateKey!==lastDateStr);
    lastDateStr=dateKey;
    const itemType=item._type||t;
    html+=generateItemHtml(item,itemType,showDate);
  });

  el.innerHTML=html;
}

// ═══ 에디터 더보기 메뉴 ═══
function toggleEditorMenu(e) {
  e.stopPropagation();

  // 이미 팝업이 열려 있으면 닫기
  const overlay = document.getElementById('lpPopupOverlay');
  if(overlay && overlay.classList.contains('open')) {
    closeLpPopup();
    return;
  }

  // 현재 편집 중인 문서 ID/타입 파악
  let id = null, type = activeTab;
  if(textTypes.includes(activeTab)) id = curIds[activeTab];
  else if(activeTab === 'book') id = curBookId;
  else if(activeTab === 'quote') id = curQuoteId;
  else if(activeTab === 'memo') id = curMemoId;
  if(!id) return;

  // 항목 데이터 가져오기
  let itemData = null;
  if(textTypes.includes(type)) itemData = allDocs().find(d => d.id === id);
  else if(type === 'book') itemData = getBooks().find(d => d.id === id);
  else if(type === 'quote') itemData = getQuotes().find(d => d.id === id);
  else if(type === 'memo') itemData = getMemos().find(d => d.id === id);
  if(!itemData) return;

  // contextItem 세팅 (lpPopupAction에서 사용)
  contextItemId = id;
  contextItemType = type;

  // 통계 계산
  const rawText = (type === 'quote') ? (itemData.text||'') : stripHtml(itemData.content || itemData.memo || '');
  const words = rawText.split(/\s+/).filter(w=>w).length;
  const chars = rawText.replace(/\s/g,'').length;
  const pages = (chars / 200).toFixed(1);
  const isPinned = !!itemData.pinned;

  // 메뉴 HTML 구성
  const menuEl = document.getElementById('lpPopupMenu');
  let menuHtml = '';
  menuHtml += '<div class="lp-popup-menu-item" style="cursor:default;" onclick="event.stopPropagation()">';
  menuHtml += '<span>단어수</span><span class="popup-menu-val">' + words.toLocaleString() + '단어</span></div>';
  menuHtml += '<div class="lp-popup-menu-item" style="cursor:default;" onclick="event.stopPropagation()">';
  menuHtml += '<span>원고지</span><span class="popup-menu-val">' + pages + '매</span></div>';
  menuHtml += '<div class="lp-popup-sep"></div>';
  menuHtml += '<div class="lp-popup-menu-item" onclick="lpPopupAction(\'pin\')">';
  menuHtml += '<span>' + (isPinned ? '고정 해제' : '고정') + '</span>';
  menuHtml += '<svg viewBox="0 0 24 24"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.68V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.68a2 2 0 0 1-1.11 1.87l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg></div>';
  menuHtml += '<div class="lp-popup-menu-item" onclick="lpPopupAction(\'copymd\')">';
  menuHtml += '<span>본문 복사</span>';
  menuHtml += '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></div>';
  menuHtml += '<div class="lp-popup-sep"></div>';
  menuHtml += '<div class="lp-popup-menu-item danger" onclick="lpPopupAction(\'delete\')">';
  menuHtml += '<span>삭제</span>';
  menuHtml += '<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></div>';
  menuEl.innerHTML = menuHtml;

  // 더보기 버튼 위치 기준으로 팝업 카드 배치
  const moreBtn = document.querySelector('.ed-more-btn');
  const card = document.getElementById('lpPopupCard');
  if(moreBtn && card) {
    const btnRect = moreBtn.getBoundingClientRect();
    const isMobile = window.innerWidth <= 768;
    const cardW = isMobile ? Math.min(260, window.innerWidth - 40) : Math.min(280, window.innerWidth - 32);
    let left = btnRect.right - cardW;
    if(left < 16) left = 16;
    if(left + cardW > window.innerWidth - 16) left = window.innerWidth - cardW - 16;
    let top = btnRect.bottom + 8;
    const estimatedH = 260;
    if(top + estimatedH > window.innerHeight - 16) top = btnRect.top - estimatedH - 8;
    if(top < 16) top = 16;
    card.style.left = left + 'px';
    card.style.top = top + 'px';
    card.style.width = cardW + 'px';
  }

  // lifted 클론 없이 오버레이+카드만 표시
  window._liftedOriginal = null;
  window._liftedClone = null;
  overlay.classList.add('open');
  requestAnimationFrame(function() { card.classList.add('open'); });
}

function editorMenuAction(action) {
  const menu = document.getElementById('editorDropdownMenu');
  menu.classList.remove('open');

  if(action==='wordcount') return;

  if(action==='pin') {
    let id=null, type=activeTab;
    if(textTypes.includes(activeTab)) id=curIds[activeTab];
    else if(activeTab==='book') id=curBookId;
    else if(activeTab==='quote') id=curQuoteId;
    else if(activeTab==='memo') id=curMemoId;
    if(id) {
      const fakeEvent = {stopPropagation:()=>{}};
      togglePin(type, id, fakeEvent);
    }
    return;
  }

  if(action==='copymd') {
    const target = activeTab==='memo' ? document.getElementById('memo-body') : document.getElementById('edBody');
    if(!target) return;
    let md = '';
    function traverse(el) {
      if(el.nodeType===Node.TEXT_NODE) { md+=el.nodeValue; return; }
      if(el.nodeType!==Node.ELEMENT_NODE) return;
      const tag=el.tagName.toLowerCase();
      if(tag==='br') { md+='\n'; return; }
      if(tag==='h1') md+='\n# ';
      if(tag==='h2') md+='\n## ';
      if(tag==='h3') md+='\n### ';
      if(tag==='blockquote') md+='\n> ';
      if(tag==='li') md+='\n- ';
      if(tag==='hr') { md+='\n---\n'; return; }
      if(tag==='img') { return; }
      for(let child of el.childNodes) traverse(child);
      if(['div','p','h1','h2','h3','blockquote','li'].includes(tag)) md+='\n';
    }
    traverse(target);
    md = md.replace(/\n{3,}/g,'\n\n').trim();
    navigator.clipboard.writeText(md).then(()=>{
      const status = document.getElementById('edSaveStatus');
      if(status) { status.style.display='inline'; status.textContent='복사됨'; setTimeout(()=>{status.style.display='none';},1500); }
    }).catch(()=>{});
    return;
  }

 

  if(action==='delete') {
    const fakeEvent = {stopPropagation:()=>{}};
    if(textTypes.includes(activeTab) && curIds[activeTab]) {
      delDoc(activeTab, curIds[activeTab], fakeEvent);
    } else if(activeTab==='book' && curBookId) {
      delBook(curBookId, fakeEvent);
    } else if(activeTab==='quote' && curQuoteId) {
      delQuote(curQuoteId, fakeEvent);
    } else if(activeTab==='memo' && curMemoId) {
      delMemo(curMemoId, fakeEvent);
    }
    return;
  }
}

document.addEventListener('click', e => {
  const menu = document.getElementById('editorDropdownMenu');
  if(menu && menu.classList.contains('open')) {
    menu.classList.remove('open');
  }
});

// ═══ 간단 액션 ═══
function handleNew() {
  const t=activeTab;
  if(textTypes.includes(t)){const nd=newDoc(t);loadDoc(t,nd.id,true);}
  else if(t==='book')  newBook();
  else if(t==='quote') newQuoteForm();
  else if(t==='memo')  newMemoForm();
  renderListPanel(); setMobileView('editor');
}

function handleBackBtn() {
  const w = window.innerWidth;
  if(w >= 769 && w <= 1400) {
    const app = document.getElementById('mainApp');
    if(app.classList.contains('tablet-side-open')) {
      // 1+2+3단 모두 펼침 → 에디터 전체화면으로
      app.classList.remove('tablet-side-open');
      app.classList.add('tablet-list-closed');
    } else if(app.classList.contains('tablet-list-closed')) {
      // 에디터 전체화면 → 1+2+3단 모두 펼침
      app.classList.remove('tablet-list-closed');
      app.classList.add('tablet-side-open');
    } else {
      // 리스트+에디터 (기본) → 에디터 전체화면으로
      app.classList.add('tablet-list-closed');
    }
    updateBackBtnIcon();
  } else {
    setMobileView('list');
  }
}

function handleDone() {
  if(document.activeElement) document.activeElement.blur();
  setMobileView('list');
  const vs = document.getElementById('viewSwitcher');
  if(vs && document.getElementById('pane-routine').style.display === 'none') vs.style.display = 'flex';
}

function toggleTabletList() {
  const app = document.getElementById('mainApp');
  app.classList.toggle('tablet-list-closed');
  updateBackBtnIcon();
}

function updateBackBtnIcon() {
  const app = document.getElementById('mainApp');
  const btn = document.querySelector('.editor .mobile-back-btn');
  if(!btn) return;
  const w = window.innerWidth;
  if(w >= 769 && w <= 1400) {
    if(app.classList.contains('tablet-list-closed')) {
      // 에디터 전체화면 → < 방향 (누르면 사이드바까지 펼침)
      btn.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>';
    } else {
      // 사이드바 펼침 또는 리스트+에디터 → > 방향 (누르면 에디터 전체화면)
      btn.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>';
    }
  } else {
    btn.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>';
  }
}

// ═══ 리스트 우클릭 컨텍스트 메뉴 ═══
let contextItemId = null;
let contextItemType = null;

function showContextMenuAt(item, x, y, fromTouch) {

  const onclick = item.getAttribute('onclick') || '';
  const t = activeTab;

  contextItemId = null;
  contextItemType = null;

  if (textTypes.includes(t)) {
    const m = onclick.match(/loadDoc\('([^']+)','([^']+)'\)/);
    if (m) { contextItemType = m[1]; contextItemId = m[2]; }
  } else if (t === 'book') {
    const m = onclick.match(/loadBook\('([^']+)'\)/);
    if (m) { contextItemType = 'book'; contextItemId = m[1]; }
  } else if (t === 'quote') {
    const m = onclick.match(/loadQuote\('([^']+)'\)/);
    if (m) { contextItemType = 'quote'; contextItemId = m[1]; }
  } else if (t === 'memo') {
    const m = onclick.match(/loadMemo\('([^']+)'\)/);
    if (m) { contextItemType = 'memo'; contextItemId = m[1]; }
  }

  if (!contextItemId) return;

  // 항목 데이터 가져오기
  let itemData = null;
  if (textTypes.includes(contextItemType)) {
    itemData = allDocs().find(d => d.id === contextItemId);
  } else if (contextItemType === 'book') {
    itemData = getBooks().find(d => d.id === contextItemId);
  } else if (contextItemType === 'quote') {
    itemData = getQuotes().find(d => d.id === contextItemId);
  } else if (contextItemType === 'memo') {
    itemData = getMemos().find(d => d.id === contextItemId);
  }

  if (!itemData) return;

  const itemRect = item.getBoundingClientRect();
  const showClone = !!fromTouch;

  if (showClone) {
    // 터치 꾹누르기: Bear/Day One 스타일 lift
    var clone = item.cloneNode(true);
    window._liftedOriginal = item;
    clone.className = item.className.replace(/\bswiped\b/g,'').replace(/\bon\b/g,'');
    clone.classList.remove('swiped','on');
    clone.classList.add('lp-lifted');
    clone.style.left = itemRect.left + 'px';
    clone.style.top = itemRect.top + 'px';
    clone.style.width = itemRect.width + 'px';
    clone.style.height = itemRect.height + 'px';
    clone.style.margin = '0';
    clone.style.background = '#ffffff';
    clone.style.boxSizing = 'border-box';
    clone.style.transformOrigin = 'center center';
    clone.onclick = null;
    var sa = clone.querySelector('.swipe-actions');
    if (sa) sa.remove();
    document.body.appendChild(clone);
    window._liftedClone = clone;
    window._liftedOrigRect = { left: itemRect.left, width: itemRect.width };
    var liftPad = 12;
    var liftedLeft = itemRect.left + liftPad;
    var liftedWidth = itemRect.width - (liftPad * 2);
    item.style.transition = 'opacity .15s ease .05s';
    item.style.opacity = '0.3';
    requestAnimationFrame(function() {
      clone.style.left = liftedLeft + 'px';
      clone.style.width = liftedWidth + 'px';
      clone.classList.add('lp-lifted-up');
    });
  } else {
    // 우클릭/비터치: 클론 없음
    window._liftedOriginal = null;
    window._liftedClone = null;
  }


  const overlay = document.getElementById('lpPopupOverlay');
  const card = document.getElementById('lpPopupCard');
  const menuEl = document.getElementById('lpPopupMenu');

  // 통계 계산
  const rawText = (contextItemType === 'quote') ? (itemData.text||'') : stripHtml(itemData.content || itemData.memo || '');
  const words = rawText.split(/\s+/).filter(w=>w).length;
  const chars = rawText.replace(/\s/g,'').length;
  const pages = (chars / 200).toFixed(1);
  const isPinned = !!itemData.pinned;

  // 메뉴 구성
  let menuHtml = '';
  menuHtml += `<div class="lp-popup-menu-item" style="cursor:default;" onclick="event.stopPropagation()">
    <span>단어수</span><span class="popup-menu-val">${words.toLocaleString()}단어</span>
  </div>`;
  menuHtml += `<div class="lp-popup-menu-item" style="cursor:default;" onclick="event.stopPropagation()">
    <span>원고지</span><span class="popup-menu-val">${pages}매</span>
  </div>`;
  menuHtml += `<div class="lp-popup-sep"></div>`;
  menuHtml += `<div class="lp-popup-menu-item" onclick="lpPopupAction('pin')">
    <span>${isPinned ? '고정 해제' : '고정'}</span>
    <svg viewBox="0 0 24 24"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.68V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.68a2 2 0 0 1-1.11 1.87l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>
  </div>`;
  menuHtml += `<div class="lp-popup-menu-item" onclick="lpPopupAction('copymd')">
    <span>본문 복사</span>
    <svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
  </div>`;
  menuHtml += `<div class="lp-popup-sep"></div>`;
  menuHtml += `<div class="lp-popup-menu-item danger" onclick="lpPopupAction('delete')">
    <span>삭제</span>
    <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
  </div>`;
  menuEl.innerHTML = menuHtml;

  const estimatedMenuH = 220;

  if (showClone) {
    // 터치 꾹누르기: 항목 아래에 배치
    const cardW = itemRect.width - 48;
    let left = itemRect.left + 24;
    if (left < 16) left = 16;
    if (left + cardW > window.innerWidth - 16) left = window.innerWidth - cardW - 16;
    let top = itemRect.bottom + 6;
    if (top + estimatedMenuH > window.innerHeight - 16) {
      top = itemRect.top - estimatedMenuH - 6;
      if (top < 16) top = 16;
    }
    card.style.left = left + 'px';
    card.style.top = top + 'px';
    card.style.width = cardW + 'px';
  } else {
    // 우클릭/비터치: 좌표 기준 배치
    const cardW = 260;
    let left = x;
    if (left + cardW > window.innerWidth - 16) left = window.innerWidth - cardW - 16;
    if (left < 16) left = 16;
    let top = y;
    if (top + estimatedMenuH > window.innerHeight - 16) top = y - estimatedMenuH;
    if (top < 16) top = 16;
    card.style.left = left + 'px';
    card.style.top = top + 'px';
    card.style.width = cardW + 'px';
  }

  // 표시
  if (!showClone) {
    overlay.style.background = 'transparent';
    overlay.style.backdropFilter = 'none';
    overlay.style.webkitBackdropFilter = 'none';
    overlay.classList.add('open');
    requestAnimationFrame(() => { card.classList.add('open'); });
  } else {
    overlay.style.background = '';
    overlay.style.backdropFilter = '';
    overlay.style.webkitBackdropFilter = '';
    setTimeout(() => {
      overlay.classList.add('open');
    }, 120);
    setTimeout(() => {
      card.classList.add('open');
    }, 220);
  }
}

function closeLpPopup() {
  const overlay = document.getElementById('lpPopupOverlay');
  const card = document.getElementById('lpPopupCard');
  if (card) card.classList.remove('open');
  var clone = window._liftedClone;
  var original = window._liftedOriginal;
  window._liftedClone = null;
  window._liftedOriginal = null;
  if (clone) {
    var origRect = window._liftedOrigRect;
    window._liftedOrigRect = null;
    clone.classList.remove('lp-lifted-up');
    clone.style.transition = 'transform .25s cubic-bezier(.25,.1,.25,1), box-shadow .2s ease, border-radius .25s ease, left .25s cubic-bezier(.25,.1,.25,1), width .25s cubic-bezier(.25,.1,.25,1), opacity .18s ease .12s';
    clone.style.transform = 'scale(1)';
    clone.style.boxShadow = 'none';
    clone.style.opacity = '0';
    if (origRect) {
      clone.style.left = origRect.left + 'px';
      clone.style.width = origRect.width + 'px';
    }
    if (original && original.parentNode) {
      setTimeout(function() {
        if (original.parentNode) {
          original.style.transition = 'opacity .2s ease';
          original.style.opacity = '1';
        }
      }, 80);
    }
    setTimeout(function() {
      if (overlay) overlay.classList.remove('open');
    }, 100);
    setTimeout(function() {
      if (clone.parentNode) clone.remove();
      if (original && original.parentNode) {
        original.style.transition = '';
        original.style.opacity = '';
      }
    }, 320);
  } else {
    if (overlay) overlay.classList.remove('open');
    if (original && original.parentNode) {
      original.style.transition = '';
      original.style.opacity = '';
    }
  }
  contextItemId = null;
  contextItemType = null;
}

function lpPopupAction(action) {
  if (!contextItemId || !contextItemType) { closeLpPopup(); return; }
  const id = contextItemId, type = contextItemType;

  if (action === 'pin') {
    closeLpPopup();
    const fakeEvent = { stopPropagation: () => {} };
    togglePin(type, id, fakeEvent);
  } else if (action === 'copymd') {
    // 항목 데이터에서 직접 본문 복사
    let itemData = null;
    if (textTypes.includes(type)) itemData = allDocs().find(d => d.id === id);
    else if (type === 'book') itemData = getBooks().find(d => d.id === id);
    else if (type === 'quote') itemData = getQuotes().find(d => d.id === id);
    else if (type === 'memo') itemData = getMemos().find(d => d.id === id);

    let md = '';
    if (itemData) {
      if (type === 'quote') {
        md = (itemData.text || '') + (itemData.by ? '\n— ' + itemData.by : '');
      } else if (type === 'book') {
        md = (itemData.title || '') + '\n' + [itemData.author, itemData.publisher].filter(Boolean).join(' · ') + '\n\n' + stripHtml(itemData.memo || '');
      } else {
        md = stripHtml(itemData.content || '').trim();
      }
    }
    navigator.clipboard.writeText(md.trim()).catch(() => {});
    closeLpPopup();
  } else if (action === 'delete') {
    closeLpPopup();
    const fakeEvent = { stopPropagation: () => {} };
    if (textTypes.includes(type)) delDoc(type, id, fakeEvent);
    else if (type === 'book') delBook(id, fakeEvent);
    else if (type === 'quote') delQuote(id, fakeEvent);
    else if (type === 'memo') delMemo(id, fakeEvent);
  } else {
    closeLpPopup();
  }
}

var _lpTimer = null;
var _lpItem = null;
var _lpMoved = false;

function cancelLongPress() {
  _lpMoved = true;
  clearTimeout(_lpTimer);
  _lpItem = null;
}

function setupListContextMenu() {
  const listEl = document.getElementById('pane-list');
  if (!listEl) return;

  var lpX = 0;
  var lpY = 0;

  // PC: 우클릭
  listEl.addEventListener('contextmenu', function(e) {
    const item = e.target.closest('.lp-item');
    if (!item) return;
    e.preventDefault();
    showContextMenuAt(item, e.clientX, e.clientY);
  });

  // 모바일: 꾹 누르기
  listEl.addEventListener('touchstart', function(e) {
    const item = e.target.closest('.lp-item');
    if (!item) return;
    _lpItem = item;
    _lpMoved = false;
    lpX = e.touches[0].clientX;
    lpY = e.touches[0].clientY;
    clearTimeout(_lpTimer);
    _lpTimer = setTimeout(function() {
      if (!_lpMoved && _lpItem && !window._gestureActive) {
        window._itemSwiping = true;
        if (navigator.vibrate) navigator.vibrate(20);
        showContextMenuAt(_lpItem, lpX, lpY, true);
        _lpItem = null;
        setTimeout(function(){ window._itemSwiping = false; }, 100);
      } else {
        _lpItem = null;
      }
    }, 600);
  }, { passive: true });

  listEl.addEventListener('touchmove', function(e) {
    if (!_lpItem) return;
    var dx = Math.abs(e.touches[0].clientX - lpX);
    var dy = Math.abs(e.touches[0].clientY - lpY);
    if (dx > 20 || dy > 20) {
      cancelLongPress();
    }
  }, { passive: true });

  listEl.addEventListener('touchend', function() {
    clearTimeout(_lpTimer);
    _lpItem = null;
  }, { passive: true });

  listEl.addEventListener('touchcancel', function() {
    cancelLongPress();
  }, { passive: true });
}

