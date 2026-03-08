// ═══════════════════════════════════════
// storage.js — LocalStorage 기본, 날짜/유틸, 모의 데이터
// ═══════════════════════════════════════

// ═══ 앱 상수 ═══
const APP_TOKEN = 'nametag2026';
const K = {
  docs:      'gb_docs',
  checks:    'gb_chk',
  books:     'gb_books',
  quotes:    'gb_quotes',
  memos:     'gb_memos',
  expenses:  'gb_expenses'
};

// ═══ LocalStorage 읽기/쓰기 ═══
const L = k => {
  try { return JSON.parse(localStorage.getItem(k)) || null; }
  catch { return null; }
};

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
const getLocalYMD = d =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

const today = () => getLocalYMD(new Date());

const weekdays = ['일','월','화','수','목','금','토'];

const formatFullDate = iso => {
  if (!iso) return '';
  const d = new Date(iso);
  let h = d.getHours(), m = d.getMinutes(), ampm = h >= 12 ? '오후' : '오전';
  h = h % 12 || 12;
  return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 (${weekdays[d.getDay()]}) ${ampm} ${h}:${String(m).padStart(2,'0')}`;
};

const formatTimeOnly = iso => {
  if (!iso) return '';
  const d = new Date(iso);
  let h = d.getHours(), m = d.getMinutes(), ampm = h >= 12 ? '오후' : '오전';
  h = h % 12 || 12;
  return `${ampm} ${h}:${String(m).padStart(2,'0')}`;
};

const getMonthYearStr = iso => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth()+1}월`;
};

function getWeekDates() {
  const d = new Date(), day = d.getDay(), sun = new Date(d);
  sun.setDate(d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(sun);
    x.setDate(sun.getDate() + i);
    return getLocalYMD(x);
  });
}

const stripHtml = s => (s || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
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
  if (!html) return '';
  return html.replace(
    /https:\/\/drive\.google\.com\/uc\?export=view(&amp;|&)id=([a-zA-Z0-9_-]+)/g,
    'https://drive.google.com/thumbnail?id=$2&sz=w1000'
  );
}

// ═══ 모의 데이터 주입 ═══
function injectMockData() {
  // 루틴 체크 데이터는 항상 보충 (전월 데이터가 없으면 추가)
  var _existingChk = L(K.checks) || {};
  var _now3 = new Date();
  var _prevM = new Date(_now3.getFullYear(), _now3.getMonth() - 1, 1);
  var _prevYMKey = _prevM.getFullYear() + '-' + String(_prevM.getMonth() + 1).padStart(2, '0') + '-15';
  if (!_existingChk[_prevYMKey]) {
    var _rids = ['exercise','vitamin','english','japanese','drawing','ukulele','nodrink'];
    var _prevDays = new Date(_prevM.getFullYear(), _prevM.getMonth() + 1, 0).getDate();
    for (var _i = 1; _i <= _prevDays; _i++) {
      var _key = _prevM.getFullYear() + '-' + String(_prevM.getMonth() + 1).padStart(2, '0') + '-' + String(_i).padStart(2, '0');
      if (!_existingChk[_key]) _existingChk[_key] = {};
      _rids.forEach(function(rid) { if (Math.random() < 0.45) _existingChk[_key][rid] = true; });
    }
    S(K.checks, _existingChk);
  }

  if (L(K.docs) && L(K.docs).length > 3) return;

  const sampleImg1 = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600';
  const sampleImg2 = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600';
  const sampleImg3 = 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600';
  const sampleImg4 = 'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?w=600';
  const sampleImg5 = 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600';

  const now = Date.now();
  const day = 86400000;
  const hr  = 3600000;

  const docs = [
    { id:'n1', type:'navi', title:'감정은 날씨와 같다', tags:'#감정 #마음',
      content:'감정은 날씨와 같다. 맑은 날도 있고 흐린 날도 있다.<br><br><img src="'+sampleImg1+'" alt="풍경">',
      created: new Date(now).toISOString(), updated: new Date(now).toISOString(), pinned: false,
      location:'와우산로37길 Mapo-gu', weather:'', lat:null, lng:null, driveId:null },
    { id:'n2', type:'navi', title:'점심 산책 기록', tags:'#산책 #일상',
      content:'점심 먹고 홍대 거리를 걸었다.',
      created: new Date(now - hr*2).toISOString(), updated: new Date(now - hr*2).toISOString(), pinned: false,
      location:'와우산로37길 Mapo-gu', weather:'', lat:null, lng:null, driveId:null },
    { id:'n3', type:'navi', title:'새벽 생각 정리', tags:'#새벽 #생각',
      content:'잠이 안 와서 이것저것 생각을 정리했다.',
      created: new Date(now - hr*5).toISOString(), updated: new Date(now - hr*5).toISOString(), pinned: false,
      location:'와우산로37길 Mapo-gu', weather:'', lat:null, lng:null, driveId:null },
    { id:'n4', type:'navi', title:'비 오는 날의 카페', tags:'#비 #카페 #음악',
      content:'비가 내리는 오후, 창가 자리에 앉아 재즈를 들으며 글을 썼다.<br><br><img src="'+sampleImg4+'" alt="카페">',
      created: new Date(now - day).toISOString(), updated: new Date(now - day).toISOString(), pinned: false,
      location:'와우산로37길 Mapo-gu', weather:'', lat:null, lng:null, driveId:null },
    { id:'n5', type:'navi', title:'저녁 요리 도전', tags:'#요리 #일상',
      content:'오늘 저녁은 직접 파스타를 만들었다.',
      created: new Date(now - day - hr*3).toISOString(), updated: new Date(now - day - hr*3).toISOString(), pinned: false,
      location:'와우산로37길 Mapo-gu', weather:'', lat:null, lng:null, driveId:null },
    { id:'n6', type:'navi', title:'주말 한강 피크닉', tags:'#한강 #피크닉',
      content:'한강에서 피크닉.<br><br><img src="'+sampleImg2+'" alt="한강">',
      created: new Date(now - day*5).toISOString(), updated: new Date(now - day*5).toISOString(), pinned: true,
      location:'와우산로37길 Mapo-gu', weather:'', lat:null, lng:null, driveId:null },
    { id:'f1', type:'fiction', title:'유리병 편지', tags:'#단편 #바다',
      content:'<h2>1.</h2>해변에서 유리병을 주웠다.<br><br><img src="'+sampleImg3+'" alt="바다">',
      created: new Date(now - day).toISOString(), updated: new Date(now - day).toISOString(), pinned: true,
      location:'Shinjuku, Tokyo', weather:'', lat:null, lng:null, driveId:null },
    { id:'f2', type:'fiction', title:'엘리베이터', tags:'#단편 #도시',
      content:'매일 같은 시간, 같은 엘리베이터.',
      created: new Date(now - day - hr*2).toISOString(), updated: new Date(now - day - hr*2).toISOString(), pinned: false,
      location:'Shinjuku, Tokyo', weather:'', lat:null, lng:null, driveId:null },
    { id:'b1', type:'blog', title:'바이브 코딩 체험기', tags:'#AI #개발 #에세이',
      content:'바이브 코딩은 처음 해보는데 그야말로 신세계다.<br><br><img src="'+sampleImg5+'" alt="코딩">',
      created: new Date(now - hr).toISOString(), updated: new Date(now).toISOString(), pinned: false,
      location:'와우산로37길 Mapo-gu', weather:'', lat:null, lng:null, driveId:null },
    { id:'b2', type:'blog', title:'미니멀리즘을 실천하며', tags:'#미니멀리즘 #정리',
      content:'작년부터 물건을 줄이기 시작했다.',
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

  // 루틴 체크 더미 데이터 (이번달 + 전월)
  var chkData = L(K.checks) || {};
  var _now2 = new Date();
  var _routineIds = ['exercise','vitamin','english','japanese','drawing','ukulele','nodrink'];

  // 전월 데이터 생성
  var _prevMonth = new Date(_now2.getFullYear(), _now2.getMonth() - 1, 1);
  var _prevDim = new Date(_prevMonth.getFullYear(), _prevMonth.getMonth() + 1, 0).getDate();
  for (var _pd = 1; _pd <= _prevDim; _pd++) {
    var _pk = _prevMonth.getFullYear() + '-' + String(_prevMonth.getMonth() + 1).padStart(2, '0') + '-' + String(_pd).padStart(2, '0');
    if (!chkData[_pk]) chkData[_pk] = {};
    _routineIds.forEach(function(rid) {
      if (Math.random() < 0.45) chkData[_pk][rid] = true;
    });
  }

  // 이번달 과거 날짜 데이터 생성
  var _thisYM2 = _now2.getFullYear() + '-' + String(_now2.getMonth() + 1).padStart(2, '0');
  for (var _td = 1; _td < _now2.getDate(); _td++) {
    var _tk = _thisYM2 + '-' + String(_td).padStart(2, '0');
    if (!chkData[_tk]) chkData[_tk] = {};
    _routineIds.forEach(function(rid) {
      if (Math.random() < 0.55) chkData[_tk][rid] = true;
    });
  }

  S(K.checks, chkData);
}

