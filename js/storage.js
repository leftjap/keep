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
}

// ═══════════════════════════════════════
// 가계부 카테고리 상수
// ═══════════════════════════════════════
const EXPENSE_CATEGORIES = [
  { id: 'food',      name: '식비',       color: '#E55643', bg: '#E55643' },
  { id: 'dining',    name: '외식/카페',  color: '#E8845A', bg: '#E8845A' },
  { id: 'shopping',  name: '쇼핑/미용',  color: '#D4789A', bg: '#D4789A' },
  { id: 'transport', name: '교통',       color: '#5A8EC4', bg: '#5A8EC4' },
  { id: 'utility',   name: '주거/공과금', color: '#F0A848', bg: '#F0A848' },
  { id: 'medical',   name: '의료',       color: '#6AB0A0', bg: '#6AB0A0' },
  { id: 'culture',   name: '문화/여가',  color: '#9A6CB8', bg: '#9A6CB8' },
  { id: 'loan',      name: '대출/금융',  color: '#8B8B8B', bg: '#8B8B8B' },
  { id: 'pet',       name: '반려동물',   color: '#C4885A', bg: '#C4885A' },
  { id: 'gift',      name: '경조/선물',  color: '#E87461', bg: '#E87461' },
  { id: 'etc',       name: '기타',       color: '#B0B0B8', bg: '#B0B0B8' }
];

// ═══════════════════════════════════════
// 금액 포맷 유틸
// ═══════════════════════════════════════
function formatAmount(n) {
  if (n >= 10000) {
    const man = Math.round(n / 10000);
    return man + '만';
  }
  return n.toLocaleString();
}

function formatAmountShort(n) {
  return n.toLocaleString();
}

// ═══════════════════════════════════════
// 가계부 모의 데이터 주입
// ═══════════════════════════════════════
function injectExpenseMockData() {
  var existing = L(K.expenses);
  if (existing && existing.length > 5) return;

  const sampleExpenses = [];
  const _now = new Date();

  // 고정 지출 템플릿 (월별)
  const fixedExpenses = [
    { name: '아파트 관리비',      category: 'utility',  amount: 117000, card: 'KB국민계좌', day: 3 },
    { name: 'SK 통신비',          category: 'utility',  amount: 65000,  card: '신한카드',   day: 15 },
    { name: '서울가스',            category: 'utility',  amount: 42000,  card: '삼성카드',   day: 20 },
    { name: '신한은행 대출이자',   category: 'loan',     amount: 156000, card: 'KB국민계좌', day: 10 },
    { name: '삼성화재 보험료',     category: 'loan',     amount: 98000,  card: '신한카드',   day: 25 },
    { name: 'Netflix 구독료',     category: 'culture',  amount: 17900,  card: '삼성카드',   day: 1 }
  ];

  // 변동 지출 가맹점 템플릿
  const merchantTemplates = {
    'food': [
      { names: ['이마트','홈플러스','GS25','CU','세븐일레븐','미니스톱'], weight: 12, minA: 5000, maxA: 80000 },
      { names: ['파리바게뜨','뚜레쥬르'], weight: 5, minA: 3000, maxA: 12000 }
    ],
    'dining': [
      { names: ['스타벅스','투썸플레이스','이디야','컴포즈'], weight: 15, minA: 4000, maxA: 7000 },
      { names: ['김밥천국','김치찌개집','고기마을','한금네'], weight: 8, minA: 8000, maxA: 18000 },
      { names: ['롯데리아','맥도날드','버거킹'], weight: 6, minA: 12000, maxA: 25000 },
      { names: ['요기요','배달의민족','쿠팡이츠'], weight: 7, minA: 15000, maxA: 40000 }
    ],
    'shopping': [
      { names: ['쿠팡','네이버쇼핑','무신사'], weight: 3, minA: 30000, maxA: 200000 },
      { names: ['올리브영','다이소'], weight: 4, minA: 10000, maxA: 50000 },
      { names: ['자라','유니클로'], weight: 2, minA: 30000, maxA: 150000 }
    ],
    'transport': [
      { names: ['카카오T','타다','우버'], weight: 8, minA: 5000, maxA: 25000 },
      { names: ['GS칼텍스','SK에너지','S-OIL'], weight: 2, minA: 50000, maxA: 80000 },
      { names: ['코레일','KTX승차권'], weight: 1, minA: 20000, maxA: 80000 }
    ],
    'medical': [
      { names: ['서울의료센터','365의원','약국'], weight: 2, minA: 15000, maxA: 200000 }
    ],
    'pet': [
      { names: ['반려동물병원','펫샵'], weight: 1, minA: 20000, maxA: 150000 }
    ],
    'culture': [
      { names: ['CGV','메가박스'], weight: 2, minA: 15000, maxA: 30000 },
      { names: ['교보문고','영풍문고','알라딘'], weight: 2, minA: 10000, maxA: 40000 }
    ],
    'gift': [
      { names: ['축의금','부의금','선물'], weight: 1, minA: 50000, maxA: 200000 }
    ],
    'etc': [
      { names: ['기타가맹점','기타상점'], weight: 3, minA: 5000, maxA: 30000 }
    ]
  };

  let idCounter = 1;

  // 6개월 데이터 생성 (현재로부터 5개월 전부터)
  for (let m = 5; m >= 0; m--) {
    const monthDate = new Date(_now);
    monthDate.setMonth(monthDate.getMonth() - m);
    const YY = monthDate.getFullYear();
    const MM = String(monthDate.getMonth() + 1).padStart(2, '0');
    const daysInMonth = new Date(YY, monthDate.getMonth() + 1, 0).getDate();

    // 고정 지출 추가
    fixedExpenses.forEach(fx => {
      if (fx.day <= daysInMonth) {
        const dateStr = `${YY}-${MM}-${String(fx.day).padStart(2, '0')}`;
        sampleExpenses.push({
          id: 'ex_' + (idCounter++),
          amount: fx.amount,
          category: fx.category,
          merchant: fx.name,
          card: fx.card,
          memo: '',
          date: dateStr,
          time: fx.day === 3 ? '02:00' : '10:00',
          created: new Date(dateStr + 'T10:00:00').toISOString(),
          source: 'sms'
        });
      }
    });

    // 변동 지출 추가
    for (let d = 1; d <= daysInMonth; d++) {
      // 10% 확률로 지출 없는 날
      if (Math.random() < 0.1) continue;

      const dateStr = `${YY}-${MM}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(YY, monthDate.getMonth(), d).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // 하루에 1~3개 지출
      const txCount = Math.random() < 0.3 ? 2 : (Math.random() < 0.2 ? 3 : 1);
      for (let t = 0; t < txCount; t++) {
        // 카테고리 선택 (가중치)
        const weights = {
          'dining': 35, 'food': 15, 'shopping': 12, 'transport': 15,
          'medical': 3, 'pet': 2, 'culture': 8, 'gift': 2, 'etc': 8
        };
        let rand = Math.random() * 100;
        let category = 'dining';
        for (const cat in weights) {
          rand -= weights[cat];
          if (rand <= 0) { category = cat; break; }
        }

        // 가맹점 선택
        const templates = merchantTemplates[category] || merchantTemplates['etc'];
        let tmpl = templates[0];
        let wrand = Math.random() * templates.reduce((s, t) => s + t.weight, 0);
        for (let i = 0; i < templates.length; i++) {
          wrand -= templates[i].weight;
          if (wrand <= 0) { tmpl = templates[i]; break; }
        }

        const merchant = tmpl.names[Math.floor(Math.random() * tmpl.names.length)];
        let amount = Math.round((Math.random() * (tmpl.maxA - tmpl.minA) + tmpl.minA) / 100) * 100;

        // 주말 20% 증가
        if (isWeekend && Math.random() < 0.5) amount = Math.round(amount * 1.2 / 100) * 100;

        const hour = String(6 + Math.floor(Math.random() * 16)).padStart(2, '0');
        const minute = String(Math.floor(Math.random() * 60)).padStart(2, '0');

        sampleExpenses.push({
          id: 'ex_' + (idCounter++),
          amount: amount,
          category: category,
          merchant: merchant,
          card: Math.random() < 0.7 ? '삼성카드' : (Math.random() < 0.5 ? '신한카드' : 'KB국민카드'),
          memo: '',
          date: dateStr,
          time: `${hour}:${minute}`,
          created: new Date(dateStr + `T${hour}:${minute}:00`).toISOString(),
          source: 'sms'
        });
      }
    }
  }

  // ── 카테고리 아이콘 확인용 고정 더미 (오늘 날짜) ──
  var _todayStr = getLocalYMD(new Date());
  var _iconTestData = [
    { id: 'ex_test_food',      amount: 45000,  category: 'food',      merchant: '이마트 마포점',     card: '삼성카드',   time: '10:00' },
    { id: 'ex_test_dining',    amount: 8500,   category: 'dining',    merchant: '스타벅스 홍대점',   card: '신한카드',   time: '11:30' },
    { id: 'ex_test_shopping',  amount: 67000,  category: 'shopping',  merchant: '올리브영 연남점',   card: '삼성카드',   time: '13:00' },
    { id: 'ex_test_transport', amount: 12400,  category: 'transport', merchant: '카카오T',           card: 'KB국민카드', time: '09:15' },
    { id: 'ex_test_utility',   amount: 117000, category: 'utility',   merchant: '아파트 관리비',     card: 'KB국민계좌', time: '02:00' },
    { id: 'ex_test_medical',   amount: 35000,  category: 'medical',   merchant: '365의원',           card: '신한카드',   time: '15:00' },
    { id: 'ex_test_culture',   amount: 15000,  category: 'culture',   merchant: 'CGV 홍대',          card: '삼성카드',   time: '19:00' },
    { id: 'ex_test_loan',      amount: 156000, category: 'loan',      merchant: '신한은행 대출이자', card: 'KB국민계좌', time: '10:00' },
    { id: 'ex_test_pet',       amount: 85000,  category: 'pet',       merchant: '반려동물병원',       card: '신한카드',   time: '14:00' },
    { id: 'ex_test_gift',      amount: 100000, category: 'gift',      merchant: '축의금',             card: '현금',       time: '12:00' },
    { id: 'ex_test_etc',       amount: 23000,  category: 'etc',       merchant: '기타상점',           card: '삼성카드',   time: '16:30' }
  ];
  _iconTestData.forEach(function(d) {
    sampleExpenses.push({
      id: d.id,
      amount: d.amount,
      category: d.category,
      merchant: d.merchant,
      card: d.card,
      memo: '',
      date: _todayStr,
      time: d.time,
      created: new Date(_todayStr + 'T' + d.time + ':00').toISOString(),
      source: 'manual'
    });
  });

  S(K.expenses, sampleExpenses);
}
