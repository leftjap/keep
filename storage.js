// ═══════════════════════════════════════
// storage.js — 스토리지, 공통 유틸, 루틴 체크 (v5.2)
// ═══════════════════════════════════════

// ═══ Storage 기본 ═══
const APP_TOKEN = 'nametag2026';
const K = { docs:'gb_docs', checks:'gb_chk', books:'gb_books', quotes:'gb_quotes', memos:'gb_memos' };
const L = k => { try { return JSON.parse(localStorage.getItem(k)) || null } catch { return null } };

const S = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {
    console.error('localStorage 저장 실패:', k, e.message);
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      if (!window._storageWarningShown) {
        window._storageWarningShown = true;
        alert('저장 공간이 부족합니다. 오래된 기록을 정리하거나, 동기화 후 브라우저 캐시를 정리해주세요.');
      }
    }
  }
};

// ═══ 날짜/시간 유틸 ═══
const getLocalYMD = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const today = () => getLocalYMD(new Date());
const weekdays = ['일','월','화','수','목','금','토'];

const formatFullDate = iso => {
  if(!iso) return '';
  const d = new Date(iso);
  let h = d.getHours(), m = d.getMinutes(), ampm = h >= 12 ? '오후' : '오전';
  h = h % 12 || 12;
  return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 (${weekdays[d.getDay()]}) ${ampm} ${h}:${String(m).padStart(2,'0')}`;
};

const formatTimeOnly = iso => {
  if(!iso) return '';
  const d = new Date(iso);
  let h = d.getHours(), m = d.getMinutes(), ampm = h >= 12 ? '오후' : '오전';
  h = h % 12 || 12;
  return `${ampm} ${h}:${String(m).padStart(2,'0')}`;
};

const getMonthYearStr = iso => {
  if(!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth()+1}월`;
};

function getWeekDates() {
  const d = new Date(), day = d.getDay(), sun = new Date(d);
  sun.setDate(d.getDate() - day);
  return Array.from({length:7}, (_, i) => {
    const x = new Date(sun);
    x.setDate(sun.getDate() + i);
    return getLocalYMD(x);
  });
}

const stripHtml = s => (s||'').replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ');
const formatTopDate = iso => formatFullDate(iso);

function buildDocContent(doc) {
  const body = stripHtml(doc.content || '');
  const metaLines = ['---'];
  if (doc.location) metaLines.push('위치: ' + doc.location);
  if (doc.weather)  metaLines.push('날씨: ' + doc.weather);
  if (doc.tags)     metaLines.push('태그: ' + doc.tags);
  if (doc.lat && doc.lng) metaLines.push('좌표: ' + doc.lat + ', ' + doc.lng);
  metaLines.push('작성일: ' + (doc.created || ''));
  return body + '\n\n' + metaLines.join('\n');
}

function fixDriveImageUrls(html) {
  if(!html) return '';
  return html.replace(/https:\/\/drive\.google\.com\/uc\?export=view(&amp;|&)id=([a-zA-Z0-9_-]+)/g,
    'https://drive.google.com/thumbnail?id=$2&sz=w1000');
}

// ═══ 모의 데이터 주입 — v5.2: 같은 날짜 복수 항목 테스트 ═══
function injectMockData() {
  if(L(K.docs) && L(K.docs).length > 3) return;

  const sampleImg1 = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600';
  const sampleImg2 = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600';
  const sampleImg3 = 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600';
  const sampleImg4 = 'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?w=600';
  const sampleImg5 = 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600';

  const now = Date.now();
  const day = 86400000;
  const hr = 3600000;

  // 오늘 날짜에 3개, 어제 날짜에 2개, 3일 전 1개 — 같은 날짜 그룹핑 테스트
  const docs = [
    // ── 오늘 3개 (navi) ──
    { id:'n1', type:'navi', title:'감정은 날씨와 같다', tags:'#감정 #마음',
      content:'감정은 날씨와 같다. 맑은 날도 있고 흐린 날도 있다. 중요한 건 날씨를 바꾸려는 게 아니라, 우산을 챙기는 것이다.<br><br><img src="'+sampleImg1+'" alt="풍경">',
      created: new Date(now).toISOString(), updated: new Date(now).toISOString(), pinned: false,
      location:'와우산로37길 Mapo-gu', weather:'', lat:null, lng:null, driveId:null },
    { id:'n2', type:'navi', title:'점심 산책 기록', tags:'#산책 #일상',
      content:'점심 먹고 홍대 거리를 걸었다. 봄바람이 불어와서 기분이 좋았다. 카페에 들러 아메리카노 한 잔.',
      created: new Date(now - hr*2).toISOString(), updated: new Date(now - hr*2).toISOString(), pinned: false,
      location:'와우산로37길 Mapo-gu', weather:'', lat:null, lng:null, driveId:null },
    { id:'n3', type:'navi', title:'새벽 생각 정리', tags:'#새벽 #생각',
      content:'잠이 안 와서 이것저것 생각을 정리했다. 요즘 너무 많은 걸 한꺼번에 하려고 했던 것 같다.',
      created: new Date(now - hr*5).toISOString(), updated: new Date(now - hr*5).toISOString(), pinned: false,
      location:'와우산로37길 Mapo-gu', weather:'', lat:null, lng:null, driveId:null },

    // ── 어제 2개 (navi) ──
    { id:'n4', type:'navi', title:'비 오는 날의 카페', tags:'#비 #카페 #음악',
      content:'비가 내리는 오후, 창가 자리에 앉아 재즈를 들으며 글을 썼다.<br><br><img src="'+sampleImg4+'" alt="카페">',
      created: new Date(now - day).toISOString(), updated: new Date(now - day).toISOString(), pinned: false,
      location:'와우산로37길 Mapo-gu', weather:'', lat:null, lng:null, driveId:null },
    { id:'n5', type:'navi', title:'저녁 요리 도전', tags:'#요리 #일상',
      content:'오늘 저녁은 직접 파스타를 만들었다. 알리오 올리오인데 마늘을 너무 태워서 약간 쓴맛이 났다.',
      created: new Date(now - day - hr*3).toISOString(), updated: new Date(now - day - hr*3).toISOString(), pinned: false,
      location:'와우산로37길 Mapo-gu', weather:'', lat:null, lng:null, driveId:null },

    // ── 5일 전 1개 (navi) ──
    { id:'n6', type:'navi', title:'주말 한강 피크닉', tags:'#한강 #피크닉',
      content:'한강에서 피크닉. 돗자리 깔고 책 읽고 낮잠. 이런 게 행복이구나.<br><br><img src="'+sampleImg2+'" alt="한강">',
      created: new Date(now - day*5).toISOString(), updated: new Date(now - day*5).toISOString(), pinned: true,
      location:'와우산로37길 Mapo-gu', weather:'', lat:null, lng:null, driveId:null },

    // ── 단편 습작: 같은 날 2개 ──
    { id:'f1', type:'fiction', title:'유리병 편지', tags:'#단편 #바다',
      content:'<h2>1.</h2>해변에서 유리병을 주웠다. 안에는 누군가의 편지가 들어 있었다.<br><br><img src="'+sampleImg3+'" alt="바다">',
      created: new Date(now - day).toISOString(), updated: new Date(now - day).toISOString(), pinned: true,
      location:'Shinjuku, Tokyo', weather:'', lat:null, lng:null, driveId:null },
    { id:'f2', type:'fiction', title:'엘리베이터', tags:'#단편 #도시',
      content:'매일 같은 시간, 같은 엘리베이터. 그녀와 나는 30분 동안 갇혀 있었다.',
      created: new Date(now - day - hr*2).toISOString(), updated: new Date(now - day - hr*2).toISOString(), pinned: false,
      location:'Shinjuku, Tokyo', weather:'', lat:null, lng:null, driveId:null },

    // ── 블로그: 오늘 2개 ──
    { id:'b1', type:'blog', title:'바이브 코딩 체험기', tags:'#AI #개발 #에세이',
      content:'바이브 코딩은 처음 해보는데 그야말로 신세계다. 말로 이렇게 저렇게 구현됐으면 좋겠다고 하면 AI가 뚝딱 결과물을 내놓는다.<br><br><img src="'+sampleImg5+'" alt="코딩">',
      created: new Date(now - hr).toISOString(), updated: new Date(now).toISOString(), pinned: false,
      location:'와우산로37길 Mapo-gu', weather:'', lat:null, lng:null, driveId:null },
    { id:'b2', type:'blog', title:'미니멀리즘을 실천하며', tags:'#미니멀리즘 #정리',
      content:'작년부터 물건을 줄이기 시작했다. 옷장 정리를 하니 마음까지 가벼워졌다.',
      created: new Date(now - hr*4).toISOString(), updated: new Date(now - hr*4).toISOString(), pinned: false,
      location:'와우산로37길 Mapo-gu', weather:'', lat:null, lng:null, driveId:null }
  ];
  S(K.docs, docs);

  const books = [
    { id:'bk1', driveId:null, title:'나미야 잡화점의 기적', author:'히가시노 게이고', publisher:'현대문학', pages:120,
      memo:'시간을 초월한 편지라는 설정이 아름답다.', date: new Date(now).toISOString().slice(0,10), pinned: false },
    { id:'bk2', driveId:null, title:'아몬드', author:'손원평', publisher:'창비', pages:85,
      memo:'감정을 느끼지 못하는 소년의 이야기.', date: new Date(now).toISOString().slice(0,10), pinned: true },
    { id:'bk3', driveId:null, title:'원씽 (The ONE Thing)', author:'게리 켈러', publisher:'비즈니스북스', pages:60,
      memo:'핵심 메시지는 단순하다. 하나에 집중하라.', date: new Date(now - day*7).toISOString().slice(0,10), pinned: false }
  ];
  S(K.books, books);

  const memos = [
    { id:'mem1', driveId:null, title:'제천음악영화제 시청 기록', tags:'#영화 #장항준 #인사이트',
      content:'영화 &lt;왕의 남자&gt;가 흥행하면서 관련 콘텐츠가 많이 올라온다.<br><br><img src="'+sampleImg1+'" alt="영화제">',
      created: new Date(now).toISOString(), updated: new Date(now).toISOString(), pinned: true },
    { id:'mem2', driveId:null, title:'웹사이트 개선 아이디어', tags:'#개발 #아이디어',
      content:'1. 다크 모드 추가<br>2. 태그 자동완성 기능<br>3. 마크다운 미리보기<br>4. 모바일 제스처 개선',
      created: new Date(now - hr*3).toISOString(), updated: new Date(now - hr*3).toISOString(), pinned: false },
    { id:'mem3', driveId:null, title:'요리 레시피: 된장찌개', tags:'#요리 #레시피',
      content:'<h3>재료</h3>두부, 애호박, 양파, 대파<br><h3>만드는 법</h3>1. 멸치 육수를 낸다<br>2. 된장을 풀고 재료를 넣는다',
      created: new Date(now - day*5).toISOString(), updated: new Date(now - day*5).toISOString(), pinned: false }
  ];
  S(K.memos, memos);

  const quotes = [
    { id:'q1', text:'긴장하면 지고 설레면 이긴다.', by:'장항준', created: new Date(now).toISOString(), pinned: false },
    { id:'q2', text:'우리는 각자의 속도로 피어나는 꽃이다. 남의 봄과 비교하지 마라.', by:'나태주', created: new Date(now - day).toISOString(), pinned: true },
    { id:'q3', text:'글을 쓴다는 것은 자기 안의 어둠에 불을 켜는 일이다.', by:'은유 《글쓰기의 최전선》', created: new Date(now - day*3).toISOString(), pinned: false },
    { id:'q4', text:'完璧を目指すよりまず終わらせろ。', by:'마크 저커버그', created: new Date(now - day*5).toISOString(), pinned: false },
    { id:'q5', text:'매일 조금씩, 꾸준히. 그것이 가장 강력한 마법이다.', by:'무라카미 하루키', created: new Date(now - day*7).toISOString(), pinned: false }
  ];
  S(K.quotes, quotes);
}

// ═══ 루틴 체크 데이터 ═══
const ROUTINE_META = [
  { id:'exercise', name:'운동',   color:'#e87461', bg:'#fdf1ef' },
  { id:'vitamin',  name:'영양제', color:'#f0a848', bg:'#fef6eb' },
  { id:'english',  name:'영어',   color:'#5a8ec4', bg:'#eff3f9' },
  { id:'japanese', name:'일본어', color:'#7cb87c', bg:'#f2f8f2' },
  { id:'drawing',  name:'드로잉', color:'#9a6cb8', bg:'#f5f0f8' },
  { id:'ukulele',  name:'우쿨렐레', color:'#d4789a', bg:'#fbf1f5' },
  { id:'nodrink',  name:'금주',   color:'#6ab0a0', bg:'#f0f7f5' }
];

function getChk()    { return (L(K.checks)||{})[today()]||{}; }
function saveChk(id,v) { const d=L(K.checks)||{}; if(!d[today()])d[today()]={};d[today()][id]=v; S(K.checks,d); }
function getAllChk() { return L(K.checks)||{}; }

function renderChk() {
  const chk=getChk(), all=getAllChk(), week=getWeekDates(), td=today();
  const container=document.getElementById('chkTable');
  const mob = window.innerWidth <= 768;
  const W = mob ? Math.max(200, window.innerWidth - 68) : 240;
  const H = mob ? 48 : 52;

  function circleRectArea(cx, cy, r) {
    const steps=200, dy=H/steps; let area=0;
    for(let i=0; i<steps; i++) {
      const y=(i+0.5)*dy, d2=r*r-(y-cy)*(y-cy);
      if(d2<=0) continue;
      const hw=Math.sqrt(d2), x0=Math.max(0,cx-hw), x1=Math.min(W,cx+hw);
      if(x1>x0) area+=(x1-x0)*dy;
    }
    return area;
  }
  function findRadius(cx, cy, targetArea) {
    let lo=0, hi=W*3;
    for(let i=0; i<60; i++) { const mid=(lo+hi)/2; if(circleRectArea(cx,cy,mid)<targetArea) lo=mid; else hi=mid; }
    return (lo+hi)/2;
  }
  const CENTER_MAP = {1:{cx:-15,cy:-8},2:{cx:0,cy:H},3:{cx:0,cy:H/2},4:{cx:W*0.15,cy:0},5:{cx:-10,cy:0},6:{cx:0,cy:H*0.3}};

  let h = '';
  const dayN = ['일','월','화','수','목','금','토'];
  h += '<div class="chk-week-hdr"><div class="chk-week-hdr-spacer"></div><div class="day-labels">'
    + dayN.map(d => '<span class="day-lbl">'+d+'</span>').join('')
    + '</div></div>';

  ROUTINE_META.forEach(r => {
    const weekDone = week.map(dt => all[dt] && all[dt][r.id] ? 1 : 0);
    const doneCount = weekDone.filter(d => d).length;
    const pct = Math.round((doneCount/7)*100);
    const target = (doneCount===1) ? (1.7/7)*W*H : (doneCount/7)*W*H;
    let blobHtml = '';
    if(doneCount===7) {
      blobHtml = '<div class="chk-blob" style="background:'+r.color+';width:9999px;height:9999px;left:-4999px;top:'+(H/2-4999)+'px;"></div>';
    } else if(doneCount>0) {
      const {cx,cy} = CENTER_MAP[doneCount];
      const rr = findRadius(cx,cy,target);
      blobHtml = '<div class="chk-blob" style="background:'+r.color+';width:'+(rr*2)+'px;height:'+(rr*2)+'px;left:'+(cx-rr)+'px;top:'+(cy-rr)+'px;"></div>';
    }
    const dotHtml = weekDone.map((done,i) => {
      const dt=week[i], isTd=dt===td;
      return '<div class="chk-dot '+(done?'done':'')+' '+(isTd?'today':'')+'" onclick="event.stopPropagation();toggleDay(\''+r.id+'\',\''+dt+'\')"></div>';
    }).join('');
    h += '<div class="chk-row" onclick="toggleChk(\''+r.id+'\')">'+blobHtml
      +(doneCount>0?'<span class="chk-pct">'+pct+'%</span>':'')
      +'<div class="chk-left"><span class="chk-lb">'+r.name+'</span></div>'
      +'<div class="chk-dots">'+dotHtml+'</div>'
      +'</div>';
  });
  container.innerHTML = h;
}

function renderRoutineRing() {
  const canvas = document.getElementById('routineRing');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const chk = getChk();
  let done = 0;
  ROUTINE_META.forEach(r => { if (chk[r.id]) done++; });
  const total = ROUTINE_META.length;
  const pct = total > 0 ? done / total : 0;

  const size = 44;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
  ctx.scale(dpr, dpr);

  const cx = size / 2, cy = size / 2, radius = 17, lineW = 3.5;
  const startAngle = -Math.PI / 2;

  ctx.clearRect(0, 0, size, size);

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,.1)';
  ctx.lineWidth = lineW;
  ctx.stroke();

  if (pct > 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, startAngle + Math.PI * 2 * pct);
    ctx.strokeStyle = '#7EB5F4';
    ctx.lineWidth = lineW;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.font = '600 13px Pretendard, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(done + '/' + total, cx, cy);

  const sub = document.getElementById('routineCompactSub');
  if (sub) sub.textContent = done + '/' + total + ' 완료';
}

function openRoutineDetail() {
  setMobileView('list');
}

let _chkT = null;function toggleChk(id) { toggleDay(id, today()); renderRoutineRing(); }
function toggleDay(id, dateStr) {
  const d = L(K.checks)||{};
  if(!d[dateStr]) d[dateStr]={};
  d[dateStr][id] = !d[dateStr][id];
  S(K.checks, d);
  renderChk();
  renderRoutineRing();
  clearTimeout(_chkT);
  _chkT = setTimeout(() => { SYNC.saveChecksToSheet(dateStr, d[dateStr]); SYNC.scheduleDatabaseSave(); }, 1200);
}