// ═══════════════════════════════════════
// GAS (Google Apps Script) — 서버 동기화
// ═══════════════════════════════════════

// ═══ 사용자별 설정 ═══
var USER_CONFIG = {
  'leftjap@gmail.com': {
    rootFolder: '글방',
    routineSheetId: '1JlZRXskoMt1o9nFL3FRbJxfVacOKvjilXFVJutfUKjo',
    quoteSheetId: '1A_i-W25WZHk4Ek0PbcL1CJDeODNfLSaz4revU2DLRM8',
    cardSmsSheetId: '18j69eayfIu8Pu7vBCDyl7bPDj5eBJhuczi1vzZxySXk',
    cardNameMap: {
      '삼성1337': '삼성카드 & MILEAGE PLATINUM'
    },
    folderMap: {
      soyoun_navi: '오늘의 네비', flight_diary: '비행일기', soyoun_blog: '블로그',
      navi: '오늘의 네비', fiction: '500자 습작',
      blog: '블로그', book: '서재', memo: '메모'
    },
    routines: [
      { id: 'exercise', name: '운동', color: '#ef5350', bg: '#fbe9e7' },
      { id: 'vitamin', name: '비타민', color: '#ffa726', bg: '#fff3e0' },
      { id: 'english', name: '영어', color: '#66bb6a', bg: '#e8f5e9' },
      { id: 'japanese', name: '일본어', color: '#42a5f5', bg: '#e3f2fd' },
      { id: 'drawing', name: '그림', color: '#ab47bc', bg: '#f3e5f5' },
      { id: 'ukulele', name: '우쿨렐레', color: '#ec407a', bg: '#fce4ec' },
      { id: 'nodrink', name: '금주', color: '#78909c', bg: '#eceff1' }
    ],
    tabs: ['navi', 'fiction', 'blog', 'book', 'quote', 'memo', 'expense'],
    textTypes: ['navi', 'fiction', 'blog'],
    tabNames: { navi: '오늘의 네비', fiction: '습작', blog: '블로그', book: '서재', quote: '어구', memo: '메모', expense: '가계부' },
    expenseCategories: [
      { id: 'dining', name: '외식' },
      { id: 'delivery', name: '배달' },
      { id: 'online', name: '온라인쇼핑' },
      { id: 'conv', name: '편의점' },
      { id: 'cat', name: '고양이' },
      { id: 'health', name: '건강' },
      { id: 'culture', name: '문화' },
      { id: 'fashion', name: '패션' },
      { id: 'subscribe', name: '구독' },
      { id: 'transport', name: '교통' },
      { id: 'etc', name: '기타' }
    ]
  },
  'soyoun312@gmail.com': {
    rootFolder: '소연의 글방',
    routineSheetId: '1aISns2onggu0unrPbQu9fyE2VS04F9l1_FTXLEY1GkQ',
    quoteSheetId: null,
    cardSmsSheetId: '1wg7FW2tmHcJQKblOalPhNWV-Dl2febhcds-KnQ1tuNw',
    cardNameMap: {
      '삼성2737': '삼성카드 iD SIMPLE',
      '삼성': '삼성카드 iD SIMPLE',
      '신한8244': '신한카드 Air',
      '신한8579': 'K-패스 신한카드 체크',
      '신한8619': 'K-패스 신한카드 체크'
    },
    folderMap: {
      soyoun_navi: '오늘의 네비', flight_diary: '비행일기', soyoun_blog: '블로그',
      navi: '오늘의 네비', fiction: '비행일기',
      blog: '블로그', book: '서재', memo: '메모'
    },
    routines: [
      { id: 'exercise', name: '운동', color: '#ef5350', bg: '#fbe9e7' },
      { id: 'english', name: '영어', color: '#66bb6a', bg: '#e8f5e9' },
      { id: 'reading', name: '독서', color: '#42a5f5', bg: '#e3f2fd' },
      { id: 'writing', name: '글쓰기', color: '#ab47bc', bg: '#f3e5f5' }
    ],
    tabs: ['soyoun_navi', 'flight_diary', 'soyoun_blog', 'book', 'expense'],
    textTypes: ['soyoun_navi', 'flight_diary', 'soyoun_blog'],
    tabNames: { soyoun_navi: '오늘의 네비', flight_diary: '비행일기', soyoun_blog: '블로그', book: '서재', expense: '가계부' },
    expenseCategories: [
      { id: 'dining', name: '외식' },
      { id: 'food', name: '마트' },
      { id: 'convenience', name: '편의점' },
      { id: 'cafe', name: '카페' },
      { id: 'gift', name: '선물' },
      { id: 'cat', name: '고양이' },
      { id: 'health', name: '건강' },
      { id: 'culture', name: '문화' },
      { id: 'fashion', name: '패션' },
      { id: 'overseas', name: '해외체류' },
      { id: 'invest', name: '투자' },
      { id: 'etc', name: '기타' }
    ]
  }
};

// ═══ Google Custom Search API (매출처 로고 검색용) ═══
var GOOGLE_CSE_API_KEY = 'AIzaSyDPk7SnWPLx6bYQoYfBvRuoZbW54rfjNPw';
var GOOGLE_CSE_CX = '01294ec874f1c440a';

// ═══ Gemini API (매출처 자동 분류용) ═══
var GEMINI_API_KEY = 'AIzaSyDaA99kBr7jnUfXcX-a29-nb_b2bKz12YQ';

// ═══ 브랜드 → 카테고리 자동 매핑 (BRAND-MAPPING.md 기준) ═══
var BRAND_CATEGORY_MAP = {
  // 편의점
  'CU': 'convenience', 'GS25': 'convenience', '세븐일레븐': 'convenience',
  '이마트24': 'convenience', '미니스톱': 'convenience',
  // 카페
  '공차': 'cafe', '던킨도너츠': 'cafe', '뚜레쥬르': 'cafe',
  '매머드커피': 'cafe', '메가MGC커피': 'cafe', '모모스': 'cafe',
  '블루보틀': 'cafe', '아우어베이커리': 'cafe', '앤트러사이트': 'cafe',
  '엔제리너스': 'cafe', '이디야커피': 'cafe', '잠바주스': 'cafe',
  '카멜커피': 'cafe', '크렘드마롱': 'cafe', '팀홀튼': 'cafe',
  '파리크라상': 'cafe', '폴바셋': 'cafe', '할리스': 'cafe',
  'T카페나폴레옹': 'cafe', '논탄토': 'cafe', '고디바': 'cafe',
  // 외식
  '롯데리아': 'dining', 'KFC': 'dining', '도미노피자': 'dining',
  '버거킹': 'dining', '새마을식당': 'dining', '명동교자': 'dining',
  '봉피양': 'dining', '송계옥': 'dining', '신차이': 'dining',
  '등촌동샤브샤브': 'dining', '미분당': 'dining', '구스토타코': 'dining',
  '계륵장군': 'dining', '만석닭강정': 'dining', '또보겠지떡볶이': 'dining',
  '한솥도시락': 'dining', '진진': 'dining', '연타발': 'dining',
  '천하의 문타로': 'dining', '아오이토리': 'dining', '황생가': 'dining',
  '뱃고동': 'dining', '버거리': 'dining', '탐탐오향족발': 'dining',
  '육전국밥': 'dining', '인앤아웃': 'dining',
  '아워당N인더박스': 'dining', '아워홈': 'dining', '퀴즈노스': 'dining',
  '배달의민족': 'dining',
  // 마트/식료품
  '이마트': 'food', '컬리': 'food', '온브릭스': 'food',
  '하나로마트': 'food', '풀무원': 'food', 'CJ': 'food',
  '현대그린푸드': 'food', '사러가': 'food', '금옥당': 'food',
  '태극당': 'food', '파리바게뜨': 'food', '베즐리': 'food',
  '현대백화점 식품관': 'food', 'SSG.COM': 'food', '롯데온': 'food',
  // 쇼핑/온라인
  '쿠팡': 'shopping', '무신사': 'shopping',
  // 패션/뷰티
  '나이키': 'fashion', '유니클로': 'fashion', 'H&M': 'fashion',
  'COS': 'fashion', 'KITH': 'fashion', 'STUSSY': 'fashion',
  'SUPREME': 'fashion', '커스텀멜로우': 'fashion', '인스턴트펑크': 'fashion',
  '트라이본즈': 'fashion', '코오롱': 'fashion', '삼성물산': 'fashion',
  'LF': 'fashion', '비너스': 'fashion', '미니골드': 'fashion',
  '신세계인터내셔날': 'fashion', '이솝': 'fashion', '이니스프리': 'fashion',
  '아모레퍼시픽': 'fashion', '올리브영': 'fashion', '베네피트': 'fashion',
  '모닝글로리': 'fashion', '무인양품': 'fashion', '이케아': 'fashion',
  'HDC아이파크몰': 'fashion', '크린토피아': 'fashion',
  // 건강
  '가톨릭대학교서울성모병원': 'health', '신촌세브란스병원': 'health',
  '연세의료원': 'health', '헬스보이짐': 'health', 'YBM': 'health',
  '삼성화재': 'health',
  // 문화
  'CGV': 'culture', '메가박스': 'culture', '롯데시네마': 'culture',
  '교보문고': 'culture', '예스24': 'culture', '땡스북스': 'culture',
  '밀리의서재': 'culture', '디즈니플러스': 'culture', 'Apple': 'culture',
  '인터파크': 'culture', '화담숲': 'culture',
  // 교통
  'BART': 'transport', 'SK네트웍스': 'transport', '티머니': 'transport',
  '대한항공': 'transport', '한화커넥트': 'transport',
  // 통신/구독
  'SK텔레콤': 'subscribe', '네이버페이': 'subscribe',
  // 해외
  'AIRALO': 'overseas', 'KKday': 'overseas', '마이리얼트립': 'overseas',
  'DOUBLETREE': 'overseas', 'Dusit Thani': 'overseas',
  'Sokha Hotels': 'overseas', 'THE WESTIN': 'overseas',
  '인터컨티넨탈호텔': 'overseas', 'Pullman': 'overseas',
  'KIX DUTY FREE': 'overseas', 'LA RINASCENTE': 'overseas',
  'CUREFIP': 'cat',
  // 백화점/면세
  '롯데': 'shopping', '롯데백화점': 'shopping', '롯데면세점': 'shopping',
  '신세계': 'shopping', '신세계면세점': 'shopping', 'AK플라자': 'shopping',
  '더현대닷컴': 'shopping', '현대홈쇼핑': 'shopping', '호텔신라': 'shopping'
};

// ═══ 매출처명 정제 (data.js cleanMerchantName과 동일 로직) ═══
function cleanMerchantName(merchant) {
  if (!merchant) return merchant;
  var m = merchant;

  // 접두어 제거
  m = m.replace(/^신한온누리\s+/, '');
  m = m.replace(/^1차\s*민생회복\s+/, '');

  // 통화코드 접두어 제거 (해외 결제)
  m = m.replace(/^(달러|유로|엔화|위안|바트|동|링깃|루피|페소)\s+/i, '');
  m = m.replace(/^[A-Z]{3}(\s+[\d\s]+\s+)/, '');
  m = m.replace(/^KRW\s+[\d\s]+\s+/i, '');
  m = m.replace(/^\d+\s+/, '');

  // 변형 통합
  if (/^사러가/.test(m)) m = '사러가';
  if (/^또[보부]겠지/.test(m)) m = '또보겠지떡볶이';
  if (/^COS\b/.test(m)) m = 'COS';
  if (/^온브릭스/.test(m)) m = '온브릭스';
  if (/^씨유홍대3호/.test(m)) m = '씨유홍대3호점';

  return m.trim() || merchant;
}

function getCategoryByBrand(brand) {
  if (!brand) return null;
  return BRAND_CATEGORY_MAP[brand] || null;
}

// ═══ 매출처명 → 브랜드 자동 매핑 (BRAND-MAPPING.md §1 기준, 227개 매출처) ═══
var MERCHANT_TO_BRAND = {
  'AIRALO': 'AIRALO',
  'AK': 'AK플라자',
  'Apple': 'Apple',
  'BART CLIPP': 'BART',
  'CGV 연남': 'CGV', 'CJCGV': 'CGV',
  '씨제이': 'CJ', '씨제이햇김치': 'CJ',
  'COS': 'COS',
  '1차 민생회복 씨유홍대3호': 'CU', 'CU 에이케이': 'CU', 'CU참전숲길점': 'CU',
  '씨유 인천공항T2교통센터': 'CU', '씨유 홍대서교점': 'CU',
  '씨유과천르센토데시앙점': 'CU', '씨유홍대3호': 'CU', '씨유홍대3호점': 'CU',
  'CUREFIP': 'CUREFIP',
  'DOUBLE TRE': 'DOUBLETREE',
  'PHP DUSIT THAN': 'Dusit Thani',
  '지에스25': 'GS25', '지에스25 S김포공항역': 'GS25', '지에스25 신촌세브란스점': 'GS25',
  '지에스25 인천공항 교통': 'GS25', '지에스25 창전태영': 'GS25', '지에스25 홍대공원점': 'GS25',
  '에이치엔엠헤': 'H&M',
  '에이치디씨아': 'HDC아이파크몰', '에이치디씨아이파크몰주식회': 'HDC아이파크몰',
  'KFC홍익대점': 'KFC',
  'KITH': 'KITH',
  'KIX DUTY FREE': 'KIX DUTY FREE',
  '케이케이데이': 'KKday',
  'LA RINASCENTE': 'LA RINASCENTE',
  '엘에프': 'LF',
  'PULLMAN BA': 'Pullman',
  'SK네트웍스': 'SK네트웍스', 'SK네트웍스(': 'SK네트웍스',
  '에스케이플래': 'SK텔레콤', '에스케이플래닛': 'SK텔레콤', '에스케이플레닛': 'SK텔레콤',
  'SSG.COM': 'SSG.COM',
  'STUSSY': 'STUSSY',
  'SUPREME': 'SUPREME',
  'SOKHA PP': 'Sokha Hotels',
  'THE WESTIN': 'THE WESTIN',
  'T카페나폴레옹': 'T카페나폴레옹',
  '와이비엠': 'YBM', '와이비엠넷': 'YBM',
  '가톨릭대학교서울성모': '가톨릭대학교서울성모병원',
  '계륵장군': '계륵장군',
  '고디바베이커리': '고디바',
  '공차 홍대창전점': '공차',
  'Point사용요청건 교보문고': '교보문고', '교보문고': '교보문고',
  '구스토타코': '구스토타코',
  '양갱상점 금옥당': '금옥당',
  '나이키의류': '나이키', '디큐브시티 나이키': '나이키',
  '네이버파이낸': '네이버페이', '네이버파이낸셜': '네이버페이', '네이버페이': '네이버페이',
  '커피논탄토 주식회사 샌드커': '논탄토',
  '대한항공OC빌딩점': '대한항공', '주)대한항공': '대한항공',
  '본사 더현대닷컴': '더현대닷컴',
  '던킨도너츠': '던킨도너츠', '비알코리아던킨도너츠': '던킨도너츠',
  '도미노피자': '도미노피자',
  '등촌동샤브샤': '등촌동샤브샤브',
  '디즈니플러스': '디즈니플러스',
  '땡스북스': '땡스북스',
  '또부겠지스마': '또보겠지떡볶이', '또부겠지스마일': '또보겠지떡볶이',
  '또보겠지': '또보겠지떡볶이', '또보겠지떡볶이': '또보겠지떡볶이',
  '뚜레쥬르': '뚜레쥬르', '뚜레쥬르 신촌로터리점': '뚜레쥬르',
  '띵굴': '띵굴',
  '호텔롯데': '롯데',
  '롯데리아 김포국제공항 국내': '롯데리아', '롯데리아 신김포공항': '롯데리아',
  '롯데리아 인천공항 T2 1층점': '롯데리아', '롯데리아 홍대점': '롯데리아',
  '롯데인천공항': '롯데면세점',
  '롯데쇼핑영프라자': '롯데백화점',
  '롯데시네마 홍대입구 (티켓': '롯데시네마',
  '롯데쇼핑': '롯데온',
  '마이리얼': '마이리얼트립',
  '만석닭강정': '만석닭강정',
  '매머드커피': '매머드커피',
  '메가엠지씨커피 홍대입구역점': '메가MGC커피',
  '메가박스중앙㈜홍대지점': '메가박스',
  '명동교자명동1호점': '명동교자',
  '모닝글': '모닝글로리', '모닝글로리 홍대점': '모닝글로리',
  '모모스': '모모스',
  '㈜무신사': '무신사',
  '무인양품': '무인양품', '무인양품 AK': '무인양품',
  '미니골드CA': '미니골드',
  '미니스톱 서교2점': '미니스톱',
  '미분당': '미분당',
  'kt밀리의서재': '밀리의서재',
  '우아한형제들': '배달의민족',
  '뱃고동': '뱃고동',
  '버거리': '버거리',
  '버거킹 인천공항T2교통센터점': '버거킹',
  '베네피트기타(메': '베네피트',
  '베즐리': '베즐리', '베즐리베이커리': '베즐리',
  '봉피양마포': '봉피양',
  '블루보틀커피': '블루보틀',
  '비너스여성의류': '비너스',
  '사러가연': '사러가수퍼마켓', '사러가연희수퍼마켓': '사러가수퍼마켓',
  '신한온누리 사러가': '사러가수퍼마켓', '사러가': '사러가수퍼마켓',
  '삼성물산': '삼성물산',
  '삼성화재해상': '삼성화재',
  '새마을식당': '새마을식당', '새마을식당 홍대서교점': '새마을식당',
  '주식회사 코리아세븐 홍대7번': '세븐일레븐', '코리아세': '세븐일레븐',
  '코리아세븐 김포공항국내': '세븐일레븐', '코리아세븐 동교다온점': '세븐일레븐',
  '코리아세븐 홍대 6번출': '세븐일레븐', '코리아세븐 홍대 6번출구': '세븐일레븐',
  '코리아세븐용강점': '세븐일레븐',
  '송계옥 홍대점': '송계옥',
  '신세계': '신세계',
  '신세계면': '신세계면세점',
  '신세계인터내셔날': '신세계인터내셔날',
  '신차이타임스퀘어점': '신차이',
  '연세대학교': '신촌세브란스병원',
  '아모레퍼': '아모레퍼시픽', '아모레퍼시픽': '아모레퍼시픽',
  '주식회사 라트라팡테': '아오이토리',
  '아우어베이커리 신촌숲길점': '아우어베이커리',
  '아워당N인더박스 인천공항T2점': '아워당N인더박스', '아워당N인더박스 인천공항T2': '아워당N인더박스',
  '아워홈푸디움인천공항제2': '아워홈',
  '앤트러사': '앤트러사이트', '앤트러사이트커피': '앤트러사이트',
  '엔제리너스 김포공항1층': '엔제리너스', '엔제리너스 인천공항 T2 B1': '엔제리너스',
  '연세의료원': '연세의료원',
  '연타발 여의': '연타발',
  '예스이십사': '예스24',
  '오아시스': '오아시스',
  '온브릭스': '온브릭스', '온브릭스 주식회사 농업회사': '온브릭스',
  'CJ올리브영': '올리브영', '씨제이올리브영김포공항': '올리브영',
  '씨제이올리브영동교동점': '올리브영', '씨제이올리브영신촌로터': '올리브영',
  '씨제이올리브영인천공항': '올리브영',
  '유니클로': '유니클로',
  '주식회사 육전국밥 홍대점': '육전국밥',
  '이니스프리': '이니스프리', '이니스프리 홍대3호점': '이니스프리',
  '이디야커피천호초교사거리점': '이디야커피',
  '이마트': '이마트', '이마트 신촌': '이마트',
  '이마트24': '이마트24', '이마트24 홍대서교점': '이마트24',
  '이솝화장품': '이솝',
  '이케아코리아': '이케아',
  '인스턴트펑크': '인스턴트펑크',
  '주식회사 인앤아웃': '인앤아웃',
  'INTERCONTI': '인터컨티넨탈호텔',
  '주식회사 인터파크트리플': '인터파크',
  '파리크라상 잠바주스 김포': '잠바주스',
  '여의도진진': '진진',
  '천하의 문타로': '천하의 문타로',
  '카멜커피 9호점': '카멜커피',
  '커스텀': '커스텀멜로우', '커스텀멜로우': '커스텀멜로우',
  '컬리': '컬리', '컬리_컬리페': '컬리', '컬리_컬리페이': '컬리',
  '컬리페이': '컬리', '컬리페이_컬': '컬리', '컬리페이_컬리': '컬리',
  '코오롱인더스': '코오롱',
  '쿠팡': '쿠팡',
  '퀴즈노스 김포공항점': '퀴즈노스',
  '크렘드마롱 인천공항T2점': '크렘드마롱',
  '크린토피아창': '크린토피아', '크린토피아창전태영점': '크린토피아',
  '탐탐오향족발': '탐탐오향족발',
  '태극당': '태극당',
  '투썸플레이스 세브란스병원점': '투썸플레이스',
  '트라이본즈': '트라이본즈',
  '티머니 개인택시': '티머니',
  '비케이알 팀홀튼 서여의': '팀홀튼',
  '파리바게뜨 서소문중앙점': '파리바게뜨', '파리바게뜨 인천공항플라워점': '파리바게뜨',
  '파리크라상 인천공항': '파리바게뜨',
  '파리크라': '파리크라상', '파리크라상 인천공항 교통센터': '파리크라상',
  '디큐브시티 폴바셋': '폴바셋',
  '풀무원 기타냉장': '풀무원',
  '농협하나로유통 하나로마트': '하나로마트',
  '한솥도시락 홍대서교점': '한솥도시락',
  '한화커넥트(': '한화커넥트',
  '할리스 미사효성해링턴점': '할리스',
  '헬스보이짐': '헬스보이짐',
  '현대그린푸드(공': '현대그린푸드',
  '현대홈쇼': '현대홈쇼핑',
  '호텔신라': '호텔신라',
  '화담숲': '화담숲',
  '황생가에프앤비 인천공항': '황생가', '황생가에프앤비 인천공': '황생가',
  // 현대백화점 식품관 매출처 (43개)
  '가메골손만두': '현대백화점 식품관', '갑각류': '현대백화점 식품관',
  '계란류': '현대백화점 식품관', '고향전주비빔밥': '현대백화점 식품관',
  '과채류': '현대백화점 식품관', '귤': '현대백화점 식품관',
  '금덕푸드 두레': '현대백화점 식품관', '금덕푸드 성진유': '현대백화점 식품관',
  '기타소': '현대백화점 식품관', '기타수입음료': '현대백화점 식품관',
  '남도분식': '현대백화점 식품관', '담초': '현대백화점 식품관',
  '돈육': '현대백화점 식품관', '두씨밀레': '현대백화점 식품관',
  '비누': '현대백화점 식품관', '서영이': '현대백화점 식품관',
  '서영이앤티': '현대백화점 식품관', '송': '현대백화점 식품관',
  '수박': '현대백화점 식품관', '수산물통병선물세': '현대백화점 식품관',
  '수입쥬스 넥타': '현대백화점 식품관', '연체류': '현대백화점 식품관',
  '에낭': '현대백화점 식품관', '오베베베이커리': '현대백화점 식품관',
  '유일닭강정': '현대백화점 식품관', '이온음료': '현대백화점 식품관',
  '일용잡화': '현대백화점 식품관', '정온루': '현대백화점 식품관',
  '조선미가': '현대백화점 식품관', '주식회사 가나유': '현대백화점 식품관',
  '주식회사 엔티': '현대백화점 식품관', '참외': '현대백화점 식품관',
  '청과': '현대백화점 식품관', '청과(?': '현대백화점 식품관',
  '청과SET': '현대백화점 식품관', '청우수산': '현대백화점 식품관',
  '포도': '현대백화점 식품관', '편장군 족발': '현대백화점 식품관',
  '햄': '현대백화점 식품관', '햇살드림 민푸드': '현대백화점 식품관',
  '화장지': '현대백화점 식품관'
};

// ═══ 인증 ═══
function getUserConfig(idToken, fallbackToken) {
  // 1. idToken이 있으면 먼저 시도
  if (idToken) {
    try {
      var parts = idToken.split('.');
      if (parts.length === 3) {
        var decoded = Utilities.base64DecodeWebSafe(parts[1]);
        var payload = JSON.parse(Utilities.newBlob(decoded).getDataAsString());
        var email = payload.email;
        if (email && USER_CONFIG[email]) {
          return USER_CONFIG[email];
        }
      }
    } catch (e) {
      console.warn("idToken 파싱 실패, fallback 시도:", e);
    }
  }

  // 2. idToken이 없거나 파싱 실패 시 레거시 토큰 폴백
  if (fallbackToken === 'nametag2026') {
    return USER_CONFIG['leftjap@gmail.com'] || null;
  }
  if (fallbackToken === 'nametag2026-soyoun') {
    return USER_CONFIG['soyoun312@gmail.com'] || null;
  }

  return null;
}

// ═══ GET 라우터 (매출처 로고 검색 프록시) ═══
function doGet(e) {
  try {
    var action = (e.parameter && e.parameter.action) ? e.parameter.action : '';

    if (action === 'searchMerchant') {
      var query = e.parameter.query || '';
      if (!query) {
        return _jsonResponse({ items: [], error: 'No query' });
      }

      // Google Custom Search — 이미지 검색으로 로고를 찾는다
      var apiUrl = 'https://www.googleapis.com/customsearch/v1'
        + '?key=' + GOOGLE_CSE_API_KEY
        + '&cx=' + GOOGLE_CSE_CX
        + '&q=' + encodeURIComponent(query + ' 로고')
        + '&searchType=image'
        + '&imgType=clipart'
        + '&num=3';

      var response = UrlFetchApp.fetch(apiUrl, {
        muteHttpExceptions: true
      });

      var result = JSON.parse(response.getContentText());

      if (result && result.items && result.items.length > 0) {
        // 첫 번째 이미지 URL을 반환
        var imageUrl = result.items[0].link || '';
        return _jsonResponse({ items: [{ imageUrl: imageUrl }] });
      }

      return _jsonResponse({ items: [] });
    }

    return _jsonResponse({ status: 'ok', message: 'GAS is running' });
  } catch (err) {
    console.error("doGet error:", err);
    return _jsonResponse({ items: [], error: String(err) });
  }
}

// ═══ 메인 라우터 ═══
function doPost(e) {
  var rawContents = e.postData.contents || '{}';
  console.log("doPost action: " + JSON.parse(rawContents).action);
  try {
    var data = JSON.parse(e.postData.contents || '{}');

    var config = getUserConfig(data.idToken, data.token);
    if (!config) {
      return _jsonResponse({ status: 'error', message: 'Unauthorized' });
    }

    var result;
    switch (data.action) {
      case 'save_db':
        result = saveDatabase(data.dbData, config);
        break;
      case 'load_db':
        result = loadDatabase(config);
        break;
      case 'load_all':
        // ── 최적화: Drive 읽기 최소화 ──
        // 1. 본인 DB 1회 읽기
        var myFile = getDatabaseFile(config);
        var myContent = myFile.getBlob().getDataAsString();
        var myDbData = JSON.parse(myContent || '{}');

        // 2. masterBrandIcons (CacheService 활용, 본인 DB 재사용)
        var myEmail = _getEmailFromConfig(config);
        var preloadedDbs = {};
        preloadedDbs[myEmail] = myDbData;
        var masterBI = _getMasterBrandIcons(preloadedDbs);

        // 3. shared_social.json 1회 읽기
        var socialData = loadSocialData();

        // 4. checkNotifications — socialData 재사용 + 상대방 DB 재사용
        // preloadedDbs에 상대방 DB가 있으면 senderDbCache로 전달
        var senderCache = {};
        var allConfigEmails = Object.keys(USER_CONFIG);
        for (var ae = 0; ae < allConfigEmails.length; ae++) {
          if (preloadedDbs[allConfigEmails[ae]]) {
            senderCache[allConfigEmails[ae]] = preloadedDbs[allConfigEmails[ae]];
          }
        }
        var notifResult = checkNotifications(config, socialData, senderCache);

        // 5. 댓글 필터 — socialData 재사용
        var comments = (socialData && socialData.comments) ? socialData.comments : [];
        var myComments = comments.filter(function(c) { return c.docOwner === myEmail; });

        result = {
          status: 'ok',
          db: myDbData,
          config: {
            tabs: config.tabs,
            textTypes: config.textTypes,
            tabNames: config.tabNames,
            routines: config.routines,
            expenseCategories: config.expenseCategories,
            folderMap: config.folderMap
          },
          masterBrandIcons: masterBI,
          notifications: notifResult.notifications || [],
          unreadCount: notifResult.unreadCount || 0,
          myComments: myComments
        };
        break;
      case 'save_doc':
        var folderName = config.folderMap[data.type] || data.type;
        result = saveDocument(data.id, data.driveId, folderName, data.title, data.content, config);
        break;
      case 'save_routine':
        result = saveRoutineToSheet(data.date, data.checks, config);
        break;
      case 'save_quote':
        if (!config.quoteSheetId) {
          result = { status: 'ok', message: 'Quote not enabled for this user' };
        } else {
          result = saveQuoteToSheet(data.text, data.by, config);
        }
        break;
      case 'upload_image':
        result = uploadImageToDrive(data.bytes, data.mimeType, data.filename, config);
        break;
      case 'check_notifications':
        result = checkNotifications(config);
        break;
      case 'load_partner_db':
        result = loadPartnerDb(config);
        break;
      case 'post_comment':
        result = postComment(data.docId, data.docOwner, data.text, config);
        break;
      case 'mark_read':
        result = markRead(data.notifIds || [], config);
        break;
      case 'delete_comment':
        result = deleteComment(data.commentId, config);
        break;
      case 'edit_comment':
        result = editComment(data.commentId, data.text, config);
        break;
      case 'load_my_comments':
        result = loadMyComments(config);
        break;
      case 'save_expense_sms':
        result = saveExpenseFromSMS(data.smsText, config);
        break;
      default:
        result = { status: 'error', message: 'Unknown action: ' + data.action };
    }
    return _jsonResponse(result);
  } catch (err) {
    console.error("doPost error:", err);
    return _jsonResponse({ status: 'error', message: String(err) });
  }
}

function _jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ═══ 폴더 유틸 ═══
function getOrCreateFolder(parentFolder, name) {
  var folders = parentFolder.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return parentFolder.createFolder(name);
}

function getSubFolder(name, config) {
  var root = getOrCreateFolder(DriveApp.getRootFolder(), config.rootFolder);
  return getOrCreateFolder(root, name);
}

// ═══ 문서 저장 ═══
function saveDocument(docId, driveId, folderName, title, content, config) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    var folder = getSubFolder(folderName, config);
    var fileName = String(title || '').trim() || '제목 없음';
    var targetFile = null;

    if (driveId) {
      try {
        var f = DriveApp.getFileById(driveId);
        if (!f.isTrashed()) {
          targetFile = f;
        }
      } catch (e) {
        console.warn("driveId 조회 실패:", driveId);
      }
    }

    if (!targetFile && docId) {
      try {
        var query = "description = '" + docId.replace(/'/g, "\\'") + "' and trashed = false";
        var files = folder.searchFiles(query);
        if (files.hasNext()) {
          targetFile = files.next();
          while (files.hasNext()) {
            var duplicate = files.next();
            console.warn("중복 파일 휴지통 이동:", duplicate.getName());
            duplicate.setTrashed(true);
          }
        }
      } catch (e) {
        console.warn("description 검색 실패:", e);
      }
    }

    if (targetFile) {
      targetFile.setName(fileName);
      var doc = DocumentApp.openById(targetFile.getId());
      var body = doc.getBody();
      body.clear();
      body.setText(content);
      doc.saveAndClose();
      // 네비 알림 훅
      _notifyNaviPost(docId, title, content, folderName, config);
      return { status: 'updated', driveId: targetFile.getId() };
    }

    var newDoc = DocumentApp.create(fileName);
    newDoc.getBody().setText(content);
    newDoc.saveAndClose();

    var newFile = DriveApp.getFileById(newDoc.getId());
    if (docId) {
      newFile.setDescription(docId);
    }
    newFile.moveTo(folder);

    // 네비 알림 훅
    _notifyNaviPost(docId, title, content, folderName, config);
    return { status: 'created', driveId: newFile.getId() };

  } catch (e) {
    console.error("saveDocument 에러:", e);
    throw new Error("파일 저장 중 에러: " + e.toString());
  } finally {
    lock.releaseLock();
  }
}

// ═══ 네비 글 저장 시 상대방에게 알림 ═══
function _notifyNaviPost(docId, title, content, folderName, config) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (e) {
    console.warn('_notifyNaviPost lock 획득 실패 (무시):', e);
    return;
  }

  try {
    if (folderName !== '오늘의 네비') return;
    if (!content || content.trim().length < 10) return;

    var myEmail = _getEmailFromConfig(config);
    var partnerEmail = _getPartnerEmail(myEmail);
    if (!partnerEmail) return;

    var social = loadSocialData();

    // 미리보기 텍스트 생성 (HTML 태그 제거, 50자)
    var preview = (content || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (preview.length > 50) preview = preview.substring(0, 50) + '...';

    // 같은 docId + 같은 from의 기존 new_post 알림 찾기 (날짜 무관)
    var existingIdx = -1;
    for (var i = 0; i < social.notifications.length; i++) {
      var n = social.notifications[i];
      if (n.type === 'new_post' && n.docId === docId && n.from === myEmail) {
        existingIdx = i;
        break;
      }
    }

    if (existingIdx !== -1) {
      // 기존 알림 업데이트 — 최신 내용으로 갱신, 미읽음 상태로 복원
      social.notifications[existingIdx].docTitle = title || '제목 없음';
      social.notifications[existingIdx].preview = preview;
      social.notifications[existingIdx].created = new Date().toISOString();
      social.notifications[existingIdx].read = false;
    } else {
      // 새 알림 생성
      var notif = {
        id: 'ntf_' + new Date().getTime(),
        type: 'new_post',
        from: myEmail,
        to: partnerEmail,
        docId: docId,
        docTitle: title || '제목 없음',
        preview: preview,
        created: new Date().toISOString(),
        read: false
      };
      social.notifications.push(notif);
    }

    saveSocialData(social);
  } catch (e) {
    console.warn('_notifyNaviPost 에러 (무시):', e);
  } finally {
    lock.releaseLock();
  }
}

// ═══ 루틴 체크 시트 저장 ═══
function saveRoutineToSheet(dateStr, checks, config) {
  if (!config.routineSheetId) {
    return { status: 'ok', message: 'Routine sheet not configured' };
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var ss = SpreadsheetApp.openById(config.routineSheetId);
    var sheet = ss.getSheetByName('루틴 체크') || ss.getSheets()[0];
    var data = sheet.getDataRange().getValues();
    var rowIndex = -1;

    for (var i = 1; i < data.length; i++) {
      var cellValue = data[i][0];
      if (!cellValue) continue;

      var sheetDateStr = "";
      if (cellValue instanceof Date) {
        sheetDateStr = Utilities.formatDate(cellValue, "GMT+9", "yyyy-MM-dd");
      } else {
        sheetDateStr = String(cellValue).trim().substring(0, 10);
      }

      if (sheetDateStr === dateStr) {
        rowIndex = i + 1;
        break;
      }
    }

    // config.routines 순서대로 컬럼 생성
    var row = [dateStr];
    for (var r = 0; r < config.routines.length; r++) {
      var routineId = config.routines[r].id;
      row.push(checks[routineId] ? 'O' : '');
    }

    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }
    return { status: 'ok' };
  } catch (e) {
    console.error("saveRoutineToSheet 에러:", e);
    return { status: 'error', message: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// ═══ 어구록 시트 저장 ═══
function saveQuoteToSheet(text, by, config) {
  try {
    var ss = SpreadsheetApp.openById(config.quoteSheetId);
    var sheet = ss.getSheets()[0];
    sheet.appendRow([new Date(), text, by]);
    return { status: 'ok' };
  } catch (e) {
    console.error("saveQuoteToSheet 에러:", e);
    return { status: 'error', message: e.toString() };
  }
}

// ═══ 이미지 업로드 ═══
function uploadImageToDrive(bytes, mimeType, filename, config) {
  try {
    var folder = getSubFolder('첨부이미지', config);
    var blob = Utilities.newBlob(Utilities.base64Decode(bytes), mimeType, filename);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return { status: 'ok', id: file.getId() };
  } catch (e) {
    console.error("uploadImageToDrive 에러:", e);
    return { status: 'error', message: e.toString() };
  }
}

// ═══ DB 동기화 ═══
function getDatabaseFile(config) {
  var folder = getOrCreateFolder(DriveApp.getRootFolder(), config.rootFolder);
  var files = folder.getFilesByName('app_database.json');
  if (files.hasNext()) return files.next();
  return folder.createFile('app_database.json', '{}', MimeType.PLAIN_TEXT);
}

// ═══ 공유 소셜 파일 (알림 + 댓글) ═══
function getSharedSocialFile() {
  // 항상 leftjap의 '글방' 폴더에 저장 (양쪽 사용자 공유)
  var hostConfig = USER_CONFIG['leftjap@gmail.com'];
  var folder = getOrCreateFolder(DriveApp.getRootFolder(), hostConfig.rootFolder);
  var files = folder.getFilesByName('shared_social.json');
  if (files.hasNext()) return files.next();
  var initial = JSON.stringify({ notifications: [], comments: [] });
  return folder.createFile('shared_social.json', initial, MimeType.PLAIN_TEXT);
}

function loadSocialData() {
  var file = getSharedSocialFile();
  var content = file.getBlob().getDataAsString();
  return JSON.parse(content || '{"notifications":[],"comments":[]}');
}

function saveSocialData(data) {
  var file = getSharedSocialFile();
  file.setContent(JSON.stringify(data));
}

// ═══ 소셜: 알림 확인 ═══
function checkNotifications(config, _socialData, _senderDbCache) {
  try {
    var email = _getEmailFromConfig(config);
    var social = _socialData || loadSocialData();
    var myNotifs = [];
    var unreadCount = 0;

    // 발신자별 DB 캐시 — 같은 발신자의 DB를 여러 번 읽지 않기 위함
    var senderDbCache = _senderDbCache || {};

    for (var i = 0; i < social.notifications.length; i++) {
      var n = social.notifications[i];
      if (n.to !== email) continue;

      // new_post 알림: 발신자 DB에 해당 docId가 존재하는지 확인
      if (n.type === 'new_post' && n.docId && n.from) {
        var senderEmail = n.from;

        // 발신자 DB를 아직 로드하지 않았으면 한 번만 로드
        if (!senderDbCache.hasOwnProperty(senderEmail)) {
          var senderConfig = USER_CONFIG[senderEmail];
          if (senderConfig) {
            try {
              var senderFile = getDatabaseFile(senderConfig);
              var senderContent = senderFile.getBlob().getDataAsString();
              var senderDb = JSON.parse(senderContent || '{}');
              senderDbCache[senderEmail] = senderDb;
            } catch (e2) {
              console.warn('checkNotifications: 발신자 DB 로드 실패 (' + senderEmail + '):', e2);
              senderDbCache[senderEmail] = null;
            }
          } else {
            senderDbCache[senderEmail] = null;
          }
        }

        var db = senderDbCache[senderEmail];
        if (db) {
          // 문서 존재 여부 확인 (gb_docs 배열에서 docId 검색)
          var docs = db['gb_docs'] || [];
          var docExists = false;
          for (var j = 0; j < docs.length; j++) {
            if (docs[j].id === n.docId) {
              docExists = true;
              break;
            }
          }
          if (!docExists) {
            // 문서가 삭제됨 — 이 알림을 건너뜀
            continue;
          }
        }
        // db가 null이면 (발신자 DB 로드 실패) 안전하게 알림을 포함
      }

      myNotifs.push(n);
      if (!n.read || n.read === false || n.read === 'false' || n.read === '') {
        unreadCount++;
      }
    }

    // 최신순 정렬
    myNotifs.sort(function(a, b) {
      return new Date(b.created || 0) - new Date(a.created || 0);
    });

    // 최근 20개만 반환
    var notifications = myNotifs.slice(0, 20);

    return { status: 'ok', notifications: notifications, unreadCount: unreadCount };
  } catch (e) {
    return { status: 'error', message: e.message, notifications: [], unreadCount: 0 };
  }
}

// ═══ 소셜: 상대방 DB 로드 (읽기 전용) ═══
function loadPartnerDb(config) {
  try {
    var myEmail = _getEmailFromConfig(config);
    var partnerEmail = _getPartnerEmail(myEmail);
    if (!partnerEmail) {
      return { status: 'error', message: 'No partner found' };
    }
    var partnerConfig = USER_CONFIG[partnerEmail];
    if (!partnerConfig) {
      return { status: 'error', message: 'Partner config not found' };
    }

    var file = getDatabaseFile(partnerConfig);
    var content = file.getBlob().getDataAsString();
    var dbData = JSON.parse(content || '{}');

    // 상대방의 소셜 댓글도 함께 로드
    var social = loadSocialData();
    var comments = social.comments || [];

    return {
      status: 'ok',
      dbData: dbData,
      comments: comments,
      partnerEmail: partnerEmail,
      config: {
        tabs: partnerConfig.tabs,
        textTypes: partnerConfig.textTypes,
        tabNames: partnerConfig.tabNames,
        routines: partnerConfig.routines,
        expenseCategories: partnerConfig.expenseCategories,
        folderMap: partnerConfig.folderMap
      }
    };
  } catch (e) {
    console.error('loadPartnerDb 에러:', e);
    return { status: 'error', message: e.toString() };
  }
}

// ═══ 소셜: 댓글 작성 ═══
function postComment(docId, docOwner, text, config) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var social = loadSocialData();
    var myEmail = _getEmailFromConfig(config);
    var now = new Date().toISOString();

    // 댓글 추가
    var comment = {
      id: 'cmt_' + new Date().getTime(),
      docId: docId,
      docOwner: docOwner,
      author: myEmail,
      text: text,
      created: now
    };
    social.comments.push(comment);

    // 글 작성자에게 알림 (자기 글에 자기가 댓글 달면 알림 안 함)
    if (docOwner !== myEmail) {
      // 댓글 미리보기 (30자)
      var preview = text.length > 30 ? text.substring(0, 30) + '...' : text;
      var notif = {
        id: 'ntf_' + new Date().getTime(),
        type: 'comment',
        from: myEmail,
        to: docOwner,
        docId: docId,
        preview: preview,
        created: now,
        read: false
      };
      social.notifications.push(notif);
    }

    saveSocialData(social);

    // 소셜 캐시 무효화
    try {
      var cache = CacheService.getScriptCache();
      cache.remove('social_' + myEmail);
    } catch(e) {}

    return { status: 'ok', comment: comment };
  } catch (e) {
    console.error('postComment 에러:', e);
    return { status: 'error', message: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// ═══ 소셜: 알림 읽음 처리 ═══
function markRead(notifIds, config) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var social = loadSocialData();
    var idSet = {};
    for (var i = 0; i < notifIds.length; i++) {
      idSet[notifIds[i]] = true;
    }
    for (var j = 0; j < social.notifications.length; j++) {
      if (idSet[social.notifications[j].id]) {
        social.notifications[j].read = true;
      }
    }
    saveSocialData(social);
    return { status: 'ok' };
  } catch (e) {
    console.error('markRead 에러:', e);
    return { status: 'error', message: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// ═══ 소셜: 자기 글에 달린 댓글 조회 ═══
function loadMyComments(config) {
  try {
    var socialData = loadSocialData();
    var myEmail = _getEmailFromConfig(config);
    var comments = (socialData && socialData.comments) ? socialData.comments : [];
    var myComments = comments.filter(function(c) {
      return c.docOwner === myEmail;
    });
    return { status: 'ok', comments: myComments };
  } catch (e) {
    console.error('loadMyComments 에러:', e);
    return { status: 'error', comments: [], message: e.toString() };
  }
}

// ═══ 소셜: 댓글 삭제 ═══
function deleteComment(commentId, config) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var social = loadSocialData();
    var myEmail = _getEmailFromConfig(config);
    var found = false;
    var newComments = [];
    for (var i = 0; i < social.comments.length; i++) {
      var c = social.comments[i];
      if (c.id === commentId) {
        if (c.author !== myEmail) {
          lock.releaseLock();
          return { status: 'error', message: 'Not your comment' };
        }
        found = true;
        // 이 댓글을 건너뜀 (삭제)
      } else {
        newComments.push(c);
      }
    }
    if (!found) {
      lock.releaseLock();
      return { status: 'error', message: 'Comment not found' };
    }
    social.comments = newComments;
    saveSocialData(social);

    // 소셜 캐시 무효화
    try {
      var cache = CacheService.getScriptCache();
      cache.remove('social_' + myEmail);
    } catch(e) {}

    return { status: 'ok' };
  } catch (e) {
    console.error('deleteComment 에러:', e);
    return { status: 'error', message: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// ═══ 소셜: 댓글 수정 ═══
function editComment(commentId, text, config) {
  if (!text || !text.trim()) {
    return { status: 'error', message: 'Empty text' };
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var social = loadSocialData();
    var myEmail = _getEmailFromConfig(config);
    var found = false;
    for (var i = 0; i < social.comments.length; i++) {
      var c = social.comments[i];
      if (c.id === commentId) {
        if (c.author !== myEmail) {
          lock.releaseLock();
          return { status: 'error', message: 'Not your comment' };
        }
        c.text = text.trim();
        c.edited = new Date().toISOString();
        found = true;
        break;
      }
    }
    if (!found) {
      lock.releaseLock();
      return { status: 'error', message: 'Comment not found' };
    }
    saveSocialData(social);

    // 소셜 캐시 무효화
    try {
      var cache = CacheService.getScriptCache();
      cache.remove('social_' + myEmail);
    } catch(e) {}

    return { status: 'ok' };
  } catch (e) {
    console.error('editComment 에러:', e);
    return { status: 'error', message: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// ═══ 소셜 헬퍼: config에서 이메일 추출 ═══
function _getEmailFromConfig(config) {
  var emails = Object.keys(USER_CONFIG);
  for (var i = 0; i < emails.length; i++) {
    if (USER_CONFIG[emails[i]] === config) return emails[i];
  }
  return null;
}

// ═══ 소셜 헬퍼: 상대방 이메일 ═══
function _getPartnerEmail(myEmail) {
  var emails = Object.keys(USER_CONFIG);
  for (var i = 0; i < emails.length; i++) {
    if (emails[i] !== myEmail) return emails[i];
  }
  return null;
}

// ═══ DB 저장 전 자동 백업 (10분 쿨다운) ═══
function _backupDatabaseIfNeeded(config) {
  try {
    var props = PropertiesService.getScriptProperties();
    var email = _getEmailFromConfig(config);
    var cooldownKey = 'db_backup_ts_' + (email || 'default');
    var lastBackup = parseInt(props.getProperty(cooldownKey) || '0');
    var now = new Date().getTime();

    // 10분(600,000ms) 미경과 시 건너뜀
    if (now - lastBackup < 600000) return;

    var folder = getOrCreateFolder(DriveApp.getRootFolder(), config.rootFolder);
    var backupName = 'app_database_backup.json';

    // 현재 DB 파일 내용 읽기
    var dbFile = getDatabaseFile(config);
    var content = dbFile.getBlob().getDataAsString();

    // 빈 DB는 백업하지 않음
    if (!content || content === '{}') return;

    // 기존 백업 파일이 있으면 덮어쓰기, 없으면 새로 생성
    var backupFiles = folder.getFilesByName(backupName);
    if (backupFiles.hasNext()) {
      var backupFile = backupFiles.next();
      backupFile.setContent(content);
    } else {
      folder.createFile(backupName, content, MimeType.PLAIN_TEXT);
    }

    props.setProperty(cooldownKey, String(now));
  } catch (e) {
    // 백업 실패는 저장을 막지 않는다
    console.warn('_backupDatabaseIfNeeded 실패 (무시):', e);
  }
}

function saveDatabase(dbData, config) {
  try {
    _backupDatabaseIfNeeded(config);
    var file = getDatabaseFile(config);
    file.setContent(JSON.stringify(dbData));

    // 캐시 갱신
    try {
      var cache = CacheService.getScriptCache();
      var email = _getEmailFromConfig(config);
      cache.put('db_' + email, JSON.stringify(dbData), 21600);
      cache.remove('masterBrandIcons');
    } catch(e) {}

    return { status: 'ok' };
  } catch (e) {
    console.error("saveDatabase 에러:", e);
    return { status: 'error', message: e.toString() };
  }
}

// ═══ masterBrandIcons 캐싱 헬퍼 ═══
function _getMasterBrandIcons(preloadedDbs) {
  // 1. CacheService 체크
  try {
    var cache = CacheService.getScriptCache();
    var cached = cache.get('masterBrandIcons');
    if (cached) return JSON.parse(cached);
  } catch (e) {}

  // 2. 캐시 MISS → 직접 계산
  var masterBrandIcons = {};
  var allEmails = Object.keys(USER_CONFIG);
  for (var ei = 0; ei < allEmails.length; ei++) {
    var email = allEmails[ei];
    var userDb = null;

    // preloadedDbs에 이미 읽은 DB가 있으면 재사용
    if (preloadedDbs && preloadedDbs[email]) {
      userDb = preloadedDbs[email];
    } else {
      var userConfig = USER_CONFIG[email];
      if (userConfig) {
        try {
          var userFile = getDatabaseFile(userConfig);
          var userContent = userFile.getBlob().getDataAsString();
          userDb = JSON.parse(userContent || '{}');
        } catch (e2) {
          console.warn('brandIcons 로드 실패 (' + email + '):', e2);
        }
      }
    }

    if (userDb) {
      var userIcons = userDb['gb_brand_icons'] || {};
      var iconKeys = Object.keys(userIcons);
      for (var ik = 0; ik < iconKeys.length; ik++) {
        var brand = iconKeys[ik];
        if (!masterBrandIcons[brand]) {
          masterBrandIcons[brand] = userIcons[brand];
        }
      }
    }
  }

  // 3. 캐시 저장 (5분)
  try {
    var cache = CacheService.getScriptCache();
    cache.put('masterBrandIcons', JSON.stringify(masterBrandIcons), 300);
  } catch (e) {}

  return masterBrandIcons;
}

function loadDatabase(config) {
  try {
    var file = getDatabaseFile(config);
    var content = file.getBlob().getDataAsString();

    // 마스터 brandIcons 로드 (모든 사용자의 brandIcons 합집합)
    var masterBrandIcons = {};
    try {
      var allEmails = Object.keys(USER_CONFIG);
      for (var ei = 0; ei < allEmails.length; ei++) {
        var userConfig = USER_CONFIG[allEmails[ei]];
        try {
          var userFile = getDatabaseFile(userConfig);
          var userContent = userFile.getBlob().getDataAsString();
          var userDb = JSON.parse(userContent || '{}');
          var userIcons = userDb['gb_brand_icons'] || {};
          // 합집합: 나중에 읽는 사용자의 값이 덮어쓰지만,
          // 기존 값이 있으면 유지 (먼저 등록된 것 보존)
          // → Object.assign(masterBrandIcons, userIcons)는 나중 것이 덮어쓰므로
          // 반대로: 기존 master에 없는 키만 추가
          var iconKeys = Object.keys(userIcons);
          for (var ik = 0; ik < iconKeys.length; ik++) {
            var brand = iconKeys[ik];
            if (!masterBrandIcons[brand]) {
              masterBrandIcons[brand] = userIcons[brand];
            }
          }
        } catch (e3) {
          console.warn('brandIcons 로드 실패 (' + allEmails[ei] + '):', e3);
        }
      }
    } catch (e2) {
      console.warn('마스터 brandIcons 로드 실패:', e2);
    }

    return {
      status: 'ok',
      dbData: JSON.parse(content || '{}'),
      masterBrandIcons: masterBrandIcons,
      config: {
        tabs: config.tabs,
        textTypes: config.textTypes,
        tabNames: config.tabNames,
        routines: config.routines,
        expenseCategories: config.expenseCategories,
        folderMap: config.folderMap
      }
    };
  } catch (e) {
    console.error("loadDatabase 에러:", e);
    return { status: 'error', message: e.toString() };
  }
}

// ═══ SMS 가계부 자동 저장 ═══
function saveExpenseFromSMS(smsText, config) {
  console.log('=== saveExpenseFromSMS 호출 ===');
  console.log('smsText: ' + String(smsText));

  if (!smsText) {
    console.log('smsText 비어있음 — 종료');
    return { status: 'error', message: 'No SMS text' };
  }

  var parsed = parseSMSServer(smsText, config);

  // 매출처명 정제
  if (parsed && parsed.merchant) {
    parsed.merchant = cleanMerchantName(parsed.merchant);
  }

  // MERCHANT_TO_BRAND 자동 브랜드 부여
  var preBrand = null;
  if (parsed && parsed.merchant && MERCHANT_TO_BRAND[parsed.merchant]) {
    preBrand = MERCHANT_TO_BRAND[parsed.merchant];
  }

  console.log('parsed: ' + JSON.stringify(parsed));

  // ═══ 해외 결제: Gemini + Google Search로 실시간 환율 환산 ═══
  if (parsed && parsed.foreignAmount && parsed.currency) {
    var convertedAmount = _convertCurrencyWithGemini(parsed.foreignAmount, parsed.currency);
    if (convertedAmount > 0) {
      parsed.amount = convertedAmount;
      console.log('환율 환산 성공: ' + parsed.foreignAmount + ' ' + parsed.currency + ' → ' + convertedAmount + '원');
    } else {
      // Gemini 실패 — 고정 환율 폴백
      var FX_FALLBACK = {
        'USD': 1350, 'EUR': 1450, 'JPY': 9, 'GBP': 1700,
        'CNY': 190, 'THB': 40, 'VND': 0.055, 'PHP': 25,
        'HUF': 4, 'KHR': 0.33, 'SGD': 1000, 'KRW': 1
      };
      var fallbackRate = FX_FALLBACK[parsed.currency] || 1;
      parsed.amount = Math.round(parsed.foreignAmount * fallbackRate);
      console.log('환율 환산 폴백: ' + parsed.foreignAmount + ' ' + parsed.currency + ' → ' + parsed.amount + '원 (고정환율 ' + fallbackRate + ')');
    }
  }

  if (!parsed) {
    console.log('파싱 실패 — 종료');
    return { status: 'error', message: 'Parse failed' };
  }

  // Gemini로 카테고리 + 브랜드 분류 (사용자별 카테고리 기반)
  var geminiResult = classifyMerchantWithGemini(parsed.merchant, parsed.card, config);
  var category = geminiResult.category || parsed.category;
  var brand = geminiResult.brand || preBrand || null;

  // brandOverrides 체크 — Gemini/폴백 결과와 무관하게 최종 brand 결정
  var file = getDatabaseFile(config);
  var content = file.getBlob().getDataAsString();
  var db = JSON.parse(content || '{}');

  var overrides = db['gb_brand_overrides'] || {};
  if (overrides.hasOwnProperty(parsed.merchant)) {
    var overrideEntry = overrides[parsed.merchant];
    if (overrideEntry && overrideEntry.hasOwnProperty('brand')) {
      brand = overrideEntry.brand; // null도 유효 (명시적 비브랜드 지정)
      console.log('brandOverride 적용: ' + parsed.merchant + ' → ' + brand);
    }
  }

  // 현대백화점카드 결제이고 brand가 미설정이면 "현대백화점 식품관"으로 자동 설정
  if (!brand && parsed.card === '현대백화점카드') {
    brand = '현대백화점 식품관';
    console.log('현대백화점카드 자동 brand 적용: ' + parsed.merchant + ' → 현대백화점 식품관');
  }

  // brand→category 자동 부여 (BRAND_CATEGORY_MAP 기준)
  if (brand && BRAND_CATEGORY_MAP[brand]) {
    category = BRAND_CATEGORY_MAP[brand];
    console.log('brand→category 자동 부여: ' + brand + ' → ' + category);
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    // DB를 다시 읽지 않고 위에서 읽은 것을 사용 (lock 전이지만, expense 추가만 하므로 안전)
    if (!db['gb_expenses']) db['gb_expenses'] = [];

    var existing = db['gb_expenses'];
    for (var i = 0; i < existing.length; i++) {
      if (existing[i].date === parsed.date &&
          existing[i].amount === parsed.amount &&
          existing[i].merchant === parsed.merchant) {
        console.log('중복 SMS 감지 — 저장 건너뜀: ' + parsed.date + ' ' + parsed.amount + '원 ' + parsed.merchant);
        lock.releaseLock();
        return { status: 'duplicate', message: 'Already exists' };
      }
    }

    var expense = {
      id: String(new Date().getTime()),
      amount: parsed.amount,
      category: category,
      merchant: parsed.merchant,
      card: parsed.card,
      memo: '',
      date: parsed.date,
      time: parsed.time,
      created: new Date().toISOString(),
      source: 'sms',
      brand: brand
    };

    // 해외 결제: 외화 정보 저장
    if (parsed.foreignAmount && parsed.currency) {
      expense.foreignAmount = parsed.foreignAmount;
      expense.currency = parsed.currency;
    }

    db['gb_expenses'].unshift(expense);
    file.setContent(JSON.stringify(db));

    return { status: 'ok', expense: expense };
  } catch (e) {
    console.error('saveExpenseFromSMS error:', e);
    return { status: 'error', message: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

function parseSMSServer(text, config) {
  if (!text) return null;

  // 거절/취소 문자는 무시
  if (/거절|취소/.test(text)) return null;

  // 명세서/결제예정 안내 문자는 무시 (실제 결제가 아님)
  if (/명세서|결제금액.*기준/.test(text)) return null;

  var result = {
    amount: 0, merchant: '', card: '',
    date: '', time: '', category: 'etc'
  };

  // ═══ 해외 결제 감지 + 외화 금액 추출 ═══
  var isOverseas = /해외승인/.test(text);

  if (isOverseas) {
    var FX_RATES = {
      'USD': 1350, 'EUR': 1450, 'JPY': 9, 'GBP': 1700,
      'CNY': 190, 'THB': 40, 'VND': 0.055, 'PHP': 25,
      'HUF': 4, 'KHR': 0.33, 'SGD': 1000, 'KRW': 1
    };
    var CURRENCY_KR = {
      '달러': 'USD', '엔': 'JPY', '유로': 'EUR', '위안': 'CNY',
      '바트': 'THB', '동': 'VND', '링깃': 'MYR', '루피': 'INR', '페소': 'PHP'
    };

    var foreignAmount = 0;
    var currency = '';

    // 패턴1: "250.79 달러", "8,100 엔", "175.00 유로" (후치 한글 통화)
    var krMatch = text.match(/([\d,]+(?:\.\d+)?)\s*(달러|엔|유로|위안|바트|동|링깃|루피|페소)/);
    if (krMatch) {
      foreignAmount = parseFloat(krMatch[1].replace(/,/g, ''));
      currency = CURRENCY_KR[krMatch[2]] || 'USD';
    }

    // 패턴2: "HUF 124,000.00", "VND 13,386,659", "KRW 533,000" (전치 영문 통화코드)
    if (!foreignAmount) {
      var codeMatch = text.match(/([A-Z]{3})\s+([\d,]+(?:\.\d+)?)/);
      if (codeMatch && codeMatch[1] !== 'Web') {
        currency = codeMatch[1];
        foreignAmount = parseFloat(codeMatch[2].replace(/,/g, ''));
      }
    }

    if (foreignAmount > 0 && currency) {
      result.amount = 0; // saveExpenseFromSMS에서 Gemini 환산 후 채움
      result.foreignAmount = foreignAmount;
      result.currency = currency;
    } else {
      // 해외승인이지만 외화 파싱 실패 — 기존 원화 매칭 폴백
      var amountMatch = text.match(/([\d,]+)\s*원/);
      if (!amountMatch) return null;
      result.amount = parseInt(amountMatch[1].replace(/,/g, ''));
    }
  } else {
    // 국내 결제: 기존 로직
    var amountMatch = text.match(/([\d,]+)\s*원/);
    if (!amountMatch) return null;
    result.amount = parseInt(amountMatch[1].replace(/,/g, ''));
  }

  if (!isOverseas && result.amount <= 0) return null;

  // 카드사 + 번호: "삼성1337" (연속), "신한카드(8244)" 또는 "[신한체크승인] 김*연(8579)" (괄호)
  var cardNumMatch = text.match(/(삼성|신한|국민|현대|롯데|하나|우리|BC|NH|KB)(\d{4})/);
  if (!cardNumMatch) {
    var bracketMatch = text.match(/(삼성|신한|국민|현대|롯데|하나|우리|BC|NH|KB)[^(]{0,20}\((\d{4})\)/);
    if (bracketMatch) cardNumMatch = bracketMatch;
  }
  if (cardNumMatch) {
    var shortKey = cardNumMatch[1] + cardNumMatch[2];
    if (config.cardNameMap && config.cardNameMap[shortKey]) {
      result.card = config.cardNameMap[shortKey];
    } else if (config.cardNameMap && config.cardNameMap[cardNumMatch[1]]) {
      // 번호 매핑이 없으면 카드사명만으로 폴백
      result.card = config.cardNameMap[cardNumMatch[1]];
    } else {
      var defaultCardNames = {
        '삼성': '삼성카드', '신한': '신한카드', '국민': 'KB국민카드',
        '현대': '현대카드', '롯데': '롯데카드', '하나': '하나카드',
        '우리': '우리카드', 'BC': 'BC카드', 'NH': 'NH농협카드', 'KB': 'KB국민카드'
      };
      result.card = defaultCardNames[cardNumMatch[1]] || cardNumMatch[1] + '카드';
    }
  } else {
    var cardPatterns = [
      '현대백화점카드',
      '신한카드','삼성카드','국민카드','KB국민','KB카드',
      '현대카드','롯데카드','하나카드','NH카드','NH농협',
      '우리카드','BC카드','씨티카드','카카오페이','네이버페이',
      '토스페이','토스','카카오뱅크','케이뱅크'
    ];
    for (var i = 0; i < cardPatterns.length; i++) {
      if (text.indexOf(cardPatterns[i]) !== -1) {
        result.card = cardPatterns[i];
        break;
      }
    }
  }

  // 날짜 추출
  var dateMatch = text.match(/(\d{1,2})[\/\.\-](\d{1,2})/);
  if (dateMatch) {
    var m = ('0' + dateMatch[1]).slice(-2);
    var d = ('0' + dateMatch[2]).slice(-2);
    var now = new Date();
    var y = now.getFullYear();
    var todayStr = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd');
    while (y + '-' + m + '-' + d > todayStr && y > 2020) {
      y--;
    }
    result.date = y + '-' + m + '-' + d;
  } else {
    result.date = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');
  }

  // 시간 추출
  var timeMatch = text.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    result.time = ('0' + timeMatch[1]).slice(-2) + ':' + timeMatch[2];
  }

  // 가맹점 추출 (불필요한 정보 모두 제거)
  var mt = text;
  mt = mt.replace(/\[Web발신\]/g, '').replace(/\[웹발신\]/g, '');
  mt = mt.replace(/\[[^\]]+\]/g, '');
  mt = mt.replace(/신촌점|본점|무역점|판교점|목동점|천호점|중동점|킨텍스점|디큐브점|압구정본점/g, '');
  mt = mt.replace(/([\d,]+)\s*원/g, '');
  mt = mt.replace(/\(금액\)/g, '');
  mt = mt.replace(/누적[\d,]*원?/g, '');
  mt = mt.replace(/(삼성|신한|국민|현대|롯데|하나|우리|BC|NH|KB)\d{4}/g, '');
  mt = mt.replace(/\w*카드[^()\s]*/g, '');
  mt = mt.replace(/[가-힣]{1,3}\*[가-힣]{1,3}/g, '');
  mt = mt.replace(/\d{1,2}[\/\.\-]\d{1,2}/g, '');
  mt = mt.replace(/\d{1,2}:\d{2}(:\d{2})?/g, '');
  mt = mt.replace(/(승인|일시불|취소|해외|결제|체크|신용|할부|\d+회차|누적|잔액|거절)/gi, '');
  mt = mt.replace(/&[^)\s]*/g, '');
  mt = mt.replace(/(MILEAGE|PLATINUM|SKYPASS)/gi, '');
  mt = mt.replace(/\([^)]*\)/g, '');
  mt = mt.replace(/[|\-\/·,]/g, ' ').replace(/\s+/g, ' ').trim();

  var cardNames = ['신한','삼성','국민','현대','롯데','하나','우리','체크','신용','승인'];
  var tokens = mt.split(' ');
  // "주식회사" 뒤 1글자 토큰을 합쳐서 보존
  var merged = [];
  for (var j = 0; j < tokens.length; j++) {
    if (tokens[j] === '주식회사' && j + 1 < tokens.length && tokens[j + 1].length === 1) {
      merged.push('주식회사 ' + tokens[j + 1]);
      j++; // 다음 토큰 건너뛰기
    } else {
      merged.push(tokens[j]);
    }
  }
  var filtered = [];
  for (var k = 0; k < merged.length; k++) {
    if (merged[k].length >= 2 && cardNames.indexOf(merged[k]) === -1) filtered.push(merged[k]);
  }
  result.merchant = filtered.join(' ').substring(0, 30);

  // 해외 결제 매출처명 정제: 통화코드+금액 접두어 제거
  // 패턴1: "달러 SUPREME", "유로 LARINASCEN", "엔화 LAWSON" → 통화 한글명 제거
  result.merchant = result.merchant.replace(/^(달러|유로|엔화|위안|바트|동|링깃|루피|페소)\s+/i, '');
  // 패턴2: "HUF 124 COS HU0360", "VND 13 386 659 INTERCONTI" → 통화코드+숫자+공백 접두어 제거
  result.merchant = result.merchant.replace(/^[A-Z]{3}(\s+[\d\s]+\s+)/, '');
  // 패턴3: "KRW 912 500 CUREFIP.CO" → KRW+숫자 접두어 제거
  result.merchant = result.merchant.replace(/^KRW\s+[\d\s]+\s+/i, '');
  // 패턴4: "100 KIX DFS", "200 KIX DFS", "700 KIX TENANT" → 숫자만으로 시작하는 접두어 제거
  result.merchant = result.merchant.replace(/^\d+\s+/, '');
  // 정제 후 trim
  result.merchant = result.merchant.trim();
  // 정제 후 빈 문자열이면 원래 값 유지
  if (!result.merchant) result.merchant = filtered.join(' ').substring(0, 30);

  result.category = autoMatchCategoryServer(result.merchant, config);

  return result;
}

// ═══ Gemini + Google Search grounding 실시간 환율 환산 ═══
function _convertCurrencyWithGemini(foreignAmount, currency) {
  if (!GEMINI_API_KEY || !foreignAmount || !currency) return 0;

  try {
    var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_API_KEY;

    var prompt = '현재 환율 기준으로 ' + foreignAmount + ' ' + currency + '는 한국 원화(KRW)로 얼마인지 숫자만 답해. 소수점 이하 반올림한 정수만. 다른 말은 하지 마.';

    var payload = {
      contents: [{ parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 256,
        thinkingConfig: { thinkingBudget: 0 }
      }
    };

    var options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var res = UrlFetchApp.fetch(url, options);
    if (res.getResponseCode() !== 200) {
      console.warn('환율 환산 Gemini HTTP 에러: ' + res.getResponseCode());
      return 0;
    }

    var json = JSON.parse(res.getContentText());
    if (!json.candidates || !json.candidates[0] || !json.candidates[0].content
        || !json.candidates[0].content.parts || !json.candidates[0].content.parts[0]) {
      console.warn('환율 환산 Gemini 응답 구조 이상');
      return 0;
    }

    var text = json.candidates[0].content.parts[0].text.trim();
    // 숫자만 추출 (콤마, 공백 제거)
    var numStr = text.replace(/[^0-9.]/g, '');
    var result = Math.round(parseFloat(numStr));

    if (isNaN(result) || result <= 0) {
      console.warn('환율 환산 파싱 실패: "' + text + '"');
      return 0;
    }

    console.log('Gemini 환율 환산: ' + foreignAmount + ' ' + currency + ' → ' + result + '원 (원문: "' + text + '")');
    return result;

  } catch (e) {
    console.warn('환율 환산 에러: ' + e.toString());
    return 0;
  }
}

// ═══ Gemini API 매출처 자동 분류 + 브랜드 인식 ═══
function classifyMerchantWithGemini(merchant, card, config) {
  if (!merchant || !GEMINI_API_KEY) return { category: autoMatchCategoryServer(merchant, config), brand: null };

  try {
    var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_API_KEY;

    // 사용자별 카테고리로 프롬프트 동적 생성
    var categoryLines = '';
    var validIds = [];
    for (var i = 0; i < config.expenseCategories.length; i++) {
      var cat = config.expenseCategories[i];
      categoryLines += cat.id + ' = ' + cat.name + '\n';
      validIds.push(cat.id);
    }

    var prompt = '한국 카드결제 매출처명을 보고 카테고리와 브랜드를 판단해. 반드시 JSON만 답하고 다른 말은 하지 마.\n\n'
      + '매출처: ' + merchant + '\n'
      + (card ? '카드: ' + card + '\n' : '')
      + '\n카테고리 목록:\n' + categoryLines
      + '\n응답 형식 (JSON만, 다른 텍스트 없이):\n'
      + '{"category": "카테고리ID", "brand": "브랜드명 또는 null"}\n'
      + '\n## 브랜드 인식 기준\n'
      + '- 브랜드로 인식: 전국적 프랜차이즈(CU, 스타벅스, 올리브영), 널리 알려진 상표(나이키, 애플), 체인점(김밥천국, 이삭토스트), 배달앱(배달의민족, 쿠팡이츠, 요기요), 온라인 플랫폼(쿠팡, 네이버, 카카오)\n'
      + '- 브랜드가 아닌 것: 개인 상호(홍대약국, 마포원조최대포집), 지역명+업종명(강남미용실, 역삼세탁소)\n'
      + '- 판단이 어려우면 brand를 null로\n'
      + '\n## 브랜드명 정규화\n'
      + '- 같은 브랜드의 다른 표기는 가장 널리 알려진 공식 명칭 하나로 통일 (CU/씨유 → "CU", 스타벅스/STARBUCKS → "스타벅스", GS25/지에스25 → "GS25")\n'
      + '- 한국에서 더 널리 쓰이는 표기 우선. 영문 브랜드는 원어 표기 유지 (CU, GS25, ZARA)\n'
      + '\n## 법인명이 아닌 소비자 브랜드명을 반환\n'
      + '- 법인/사업자 등록명이 아닌, 소비자가 아는 브랜드명을 반환한다\n'
      + '- 예시: CJ올리브영/씨제이올리브영 → "올리브영", 코리아세븐 → "세븐일레븐", 우아한형제들/주식회사우아한형제 → "배달의민족", 비알코리아 → "던킨도너츠", 앤트러사이트커피 → "앤트러사이트", 베즐리베이커리 → "베즐리", 코오롱인더스트리/코오롱인더스 → "코오롱", 동원F&B/동원에프앤비 → "동원", 블루보틀커피 → "블루보틀", 에스케이텔레콤/SK텔레콤 → "SK텔레콤", 에스케이플래닛/SK플래닛 → "SK텔레콤", 에스케이네트웍스/SK네트웍스 → "SK네트웍스"\n'
      + '\n## 유사 서비스 통합\n'
      + '- 네이버파이낸셜, 네이버플러스 → "네이버페이"\n'
      + '- 티머니, 티머니개인택시, 티머니택시 → "티머니택시"\n'
      + '- 디즈니플러스/DisneyPlus → "디즈니플러스"\n'
      + '\n## brand를 null로 해야 하는 것\n'
      + '- PG사/결제대행: KCP, NHN KCP, 토스페이먼츠, 웰컴페이먼츠, 발트페이, 발트페이먼츠 → brand: null (카테고리만 분류)\n'
      + '- 공공기관: 교통안전공단, 우정사업본부, 법원행정처, 구청, 세무서 → brand: null\n'
      + '- 동네 약국: "○○약국" 패턴(광명약국, 대학약국, 올리브약국, 이지약국 등)은 프랜차이즈가 아니므로 → brand: null. 단 올리브영 등 알려진 체인은 브랜드로 인식\n'
      + '- 동네 병원/의원: "○○의원", "○○이비인후과" 등 개인 의원은 → brand: null. 단 대형 병원(세브란스, 서울성모병원, 삼성서울병원 등)은 브랜드로 인식\n'
      + '\n## 배달앱 규칙\n'
      + '- "배민1 홍대치킨", "쿠팡이츠 OO점" 등 배달앱 경유 결제 → 배달앱 자체를 브랜드로 ("배달의민족", "쿠팡이츠", "요기요")\n'
      + '\n## 백화점 규칙\n'
      + '- 매출처명에 백화점 키워드가 있고 식품 키워드(과일, 정육, 수산, 야채, 반찬, 베이커리, 돈육, 청과, 수박, 참외, 포도, 계란, 연체류, 갑각류 등)도 있으면 → 브랜드: "현대백화점 식품관" 등, 카테고리: 식비 계열\n'
      + '- 매출처명이 식품 품목명 자체(과일, 돈육, 청과 등)이고 카드가 백화점카드이면 → 백화점 식품관 브랜드로 분류\n'
      + '- 매출처명에서 입점 브랜드를 인식할 수 있으면 → 해당 브랜드로 분류\n'
      + '- 카드 정보는 참고용 힌트로만. "현대백화점카드 = 현대백화점에서 결제"라는 추론 금지\n'
      + '\n## 해외 매출처\n'
      + '- 통화 표시 무시하고 브랜드명 판단. 해외 프랜차이즈/드럭스토어/마트/백화점도 브랜드로 인식\n';

    var payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 1024,
        thinkingConfig: { thinkingBudget: 0 }
      }
    };

    var options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var res = UrlFetchApp.fetch(url, options);
    var resCode = res.getResponseCode();
    if (resCode !== 200) {
      console.warn('Gemini API error: HTTP ' + resCode);
      return { category: autoMatchCategoryServer(merchant, config), brand: null };
    }

    var json = JSON.parse(res.getContentText());
    if (!json.candidates || !json.candidates[0] || !json.candidates[0].content
        || !json.candidates[0].content.parts || !json.candidates[0].content.parts[0]) {
      return { category: autoMatchCategoryServer(merchant, config), brand: null };
    }

    var text = json.candidates[0].content.parts[0].text.trim();

    // JSON 파싱 시도
    try {
      // Gemini가 ```json ... ``` 블록으로 감쌀 수 있으므로 추출
      var jsonStr = text;
      var jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonBlockMatch) jsonStr = jsonBlockMatch[1].trim();

      var parsed = JSON.parse(jsonStr);
      var resultCategory = (parsed.category || '').toLowerCase();
      var resultBrand = parsed.brand || null;

      // category 유효성 검증
      if (validIds.indexOf(resultCategory) === -1) {
        resultCategory = autoMatchCategoryServer(merchant, config);
      }

      // brand가 빈 문자열이면 null로 정규화
      if (resultBrand === '' || resultBrand === 'null') resultBrand = null;

      return { category: resultCategory, brand: resultBrand };
    } catch (parseErr) {
      // JSON 파싱 실패 — 기존처럼 텍스트에서 카테고리 ID 문자열 매칭, brand는 null
      console.warn('Gemini JSON 파싱 실패, 텍스트 매칭 폴백: ' + text);
      var lowerText = text.toLowerCase();
      for (var j = 0; j < validIds.length; j++) {
        if (lowerText.indexOf(validIds[j]) !== -1) return { category: validIds[j], brand: null };
      }
      return { category: autoMatchCategoryServer(merchant, config), brand: null };
    }
  } catch (e) {
    console.warn('Gemini classify error: ' + e.toString());
    return { category: autoMatchCategoryServer(merchant, config), brand: null };
  }
}

function autoMatchCategoryServer(merchant, config) {
  if (!merchant) return 'etc';
  var m = merchant.toLowerCase();

  var rules = {
    delivery: ['쿠팡이츠','주식회사우아','우아한형제들','우아한형','배달의민족',
               '요기요'],
    subscribe: ['lg전자구독료','disneyplus','디즈니플러스','구글페이먼트',
                '쿠팡(와우멤','네이버플러스','주식회사티빙','에스케이텔레',
                'sk텔레콤','sk통신료','배민클럽','에스케이플래','넷플릭스',
                '멜론','스포티파이','애플뮤직','유튜브','구글플레이','통신'],
    online: ['쿠팡','네이버페이','네이버파이낸','롯데쇼핑','동원에프',
             '옥션','주식회사지마','주식회사무신','서울시네이버',
             '주식회사로우','11번가','위메프','이마트'],
    conv: ['코리아세븐','코리아세','cu','씨유','지에스25','지에스(gs)',
           'gs25','세븐일레븐','미니스톱','이마트24','타임스토어',
           '블루샥서','대현유통'],
    cat: ['포포즈반려동','동물병원','펫','사료','반려','애묘','고양이',
          '헬씨','curefi','curefip','키다리동물','슈르르'],
    health: ['세브란스','가톨릭대학교','연세봄이비인','프렌닥터',
             '코코이비인후','세란병원','신촌연세이비','이지약국',
             '광명약국','올리브약국','대학약국','명문약국','위드팜',
             '헬스보이짐','약국','병원','의원','치과','안과',
             '피부과','한의원','클리닉','정형외과','내과',
             '이비인후과','건강검진',
             '세솟는','아현종로약국','독일하트','박신혜유외과',
             '엘리트약국','홍익약국','새현대약국','비타민약국',
             '밸런스약국','태평양약국','신촌연세병원','서울안과',
             '삼성밝은안과','김안과','엘리트안과','유앤유외과',
             '마인드피부과','애플산부인과','연세의료원','파마트엘지약',
             '신촌온누리약','연세한우리약','참약국','차&박피부과',
             '새종로약국','왕솔약국','신보건약국'],
    culture: ['caromclub','옵티머스캐롬','우리당구장','뉴코인싱어노',
              '교보문고','당구','노래방','코인싱어','영풍','알라딘',
              '예스24','영화','cgv','메가박스','롯데시네마','공연',
              '전시','뮤지컬',
              '현대음률','땡스북스','밀리의서재','인터파크트리플',
              '화담숲','스토리엠','뮤비존','디즈니플러스','놀유니버스',
              '수상한사진관','배재학당','국가유산청','와이비엠'],
    fashion: ['젠트서울','gents','아디다스','코오롱인더스','크린토피아',
              '무인양품','현대백화','바버','헤어','미용실','네일',
              '올리브영','자라','유니클로','h&m','나이키','무신사',
              '커스텀멜로우','삼성물산','트라이본즈','인스턴트펑크',
              '코랄리헤어','코랄리','더현대닷컴','베네피트','이솝',
              '이니스프리','에이치엔엠','신세계인터내셔날','비너스',
              '이케아코리아','에이치디씨아','아이파크몰','라임타임',
              '에스씨케이','더하우스','디에스글로벌','엘에프',
              '미니골드','모닝글로리','다른코스메틱스','아모레퍼시픽',
              '참좋은박스'],
    transport: ['카카오t','티머니택시','티머니개인택','마포시엠주유',
                'sk네트웍스','발트페이','주식회사발트','발트페이먼츠',
                '㈜발트페이','주식회사카카','택시','주유','gs칼텍스',
                'sk에너지','s-oil','주차','고속도로','톨게이트',
                '코레일','ktx','srt','동막역','교통안전공단'],
    dining: ['철길왕갈비','화규','미로식당','양화정','월순철판동태','을밀대',
             '풍천장어','계고기집','마포집','팔계집','치맛살집','치쿠린',
             '깃뜰','덕수정','맛이차이나','만나식당','신화장','미분당',
             '부농도축장','하진정육','리틀방콕','어랑손만두국','홍대조폭떡볶',
             '제주정원','일심장어','푸줏간','스미비클럽','하스',
             '주식회사부자','주식회사육전','탐탐오향족발','연피랑',
             '호식이두마리','파파존스','와우끝집','커피랩','블루보틀',
             '투썸플레이스','파스쿠찌','커피상인','김진환베이커',
             '사러가연','호랑이','카로우셀','현대음률','천하의문타로',
             '스타벅스','할머니보쌈','부자되세','진미서산',
             '식당','고기','삼겹살','갈비','초밥','돈까스','냉면',
             '국수','치킨','피자','버거','맥도날드','버거킹','롯데리아',
             '스타벅스','이디야','커피','카페','빽다방','메가커피',
             '컴포즈','할리스','폴바셋','바나프레소','파리바게뜨',
             '뚜레쥬르','베이커리','도미노',
             '진진','여의도진진','마이도미','마이도미넌트',
             '고릴라','해별관','라로제','다북어국',
             '청기와식당','영동감자탕','마포소금구이',
             '주식회사경복','또부겠지','히노키공방',
             '춘천집닭갈비','명동왕돈까스','명동교자',
             '등촌동샤브샤','봉피양','연희녹두삼계탕',
             '한강껍데기','한솥도시락','온천충무김밥',
             '황생가에프앤비','황생가','구스토타코',
             '계륵장군','야끼니꾸소량','천하의 문타로',
             '더파이브올스','주식회사 김다희','주식회사 마마',
             '연타발','정각','미자카야','월화식당',
             '송계옥','산울림','주식회사 아소정',
             '고향전주비빔밥','간바레미나상','꼬꼬순이',
             '풍년식당','호반식당','장독대','동보성',
             '옹시미','가비애','남도분식','라면땡기는날',
             '에덴그리고','고구려','성산왕갈비','만석닭강정',
             '가메골손만두','주식회사 인앤아웃','피크니크',
             '오근내','아워홈','아워당','퀴즈노스',
             '스시상','또순이집','대청마루','이천휴게소',
             '주식회사 빅바이트','센트플로우','에낭',
             '야끼토리하루','하꼬','소굴','옹달샘',
             '주막','인앤아웃','대현유통치악',
             '고향집식당','리정원','오베베베이커리'],
    food: ['마트','이마트','홈플러스','롯데마트','식료품','농협하나로',
           '동원','cj','오뚜기','풀무원',
           '컬리','컬리페이','띵굴','오아시스','온브릭스','사러가',
           '죽해수산','ssg.com','태극당','금옥당','김진환베이커',
           '자연도소금빵','도원떡방','금옥호두','양갱상점','예당병과',
           '두씨밀레','현대그린푸드','피터팬식품','참살이유통',
           '서청대호농','무과수마트','한화커넥트','마플코퍼레이션'],
    cafe: ['스타벅스','투썸','이디야','커피','카페','빽다방','메가커피',
           '컴포즈','할리스','폴바셋','블루보틀','바나프레소',
           '커피랩','앤트러사이트','크렘드마롱','코테츠','논탄토',
           '카페나폴레옹','팀홀튼','매머드커피','카멜커피','모모스',
           '무슈부부','아우어베이커리','고디바','공차','엔제리너스',
           '잠바주스','파리크라상','테일러커피','라트라팡테',
           '메가엠지씨','던킨도너츠','비알코리아','뚜레쥬르'],
    convenience: ['편의점','gs25','cu','씨유','세븐일레븐','코리아세븐',
                  '미니스톱','이마트24','지에스25','지에스(gs)',
                  '신구멍가게','솔트24','주식회사기품'],
    shopping: ['쿠팡','네이버페이','네이버쇼핑','무신사','올리브영','다이소',
               '이케아','의류','신발','화장품','롯데쇼핑','옥션','11번가',
               '지마켓','위메프','아디다스','나이키','코오롱','무인양품',
               '타임스토어','현대백화','네이버파이낸','주식회사로우',
               '주식회사뤼이','주식회사지마'],
    medical: ['약국','병원','의원','치과','안과','피부과','한의원','클리닉',
              '건강검진','정형외과','내과','이비인후과','연세봄이비인',
              '이지약국','올리브약국','세브란스','가톨릭대학교','프렌닥터',
              '광명약국','세란병원','명문약국','대학약국','위드팜신촌',
              '코코이비인후'],
    leisure: ['당구','캐롬','caromclub','옵티머스캐롬','카로우셀',
              '우리당구','노래방','코인싱어','술집','바','호랑이',
              '데일리샷','섬(illusion','서점','교보문고','영풍',
              '알라딘','예스24'],
    beauty: ['젠트서울','gents','바버','헤어','미용실','네일','피부관리',
             '성형','뷰티'],
    pet: ['동물병원','펫','사료','반려','애견','애묘','동물의료',
          '펫샵','동물약국','포포즈반려동'],
    gift: ['선물','꽃','플라워','축하','기프트',
           '호텔신라','퐁포네뜨','이제이글로벌'],
    invest: ['키움','미래에셋','삼성증권','nh투자','한국투자','한국금융투자',
             '토스증권','카카오페이증권','업비트','빗썸','코인원',
             '증권','주식','투자','펀드'],
    utility: ['관리비','전기','가스','수도','인터넷','아파트',
              '수도요금','전기세','도시가스','마포구청','기술보증기금',
              '법원행정처','한국필립모리'],
    overseas: ['해외','usd','eur','jpy','gbp','foreign',
               '마이리얼','케이케이데이','kkday','airalo']
  };

  // 해당 사용자의 유효 카테고리 ID 목록
  var validIds = [];
  for (var v = 0; v < config.expenseCategories.length; v++) {
    validIds.push(config.expenseCategories[v].id);
  }

  // 좁은 범위 → 넓은 범위 순서로 검사
  var checkOrder = [
    'delivery', 'subscribe', 'cat', 'conv', 'health',
    'culture', 'fashion', 'transport', 'online', 'dining',
    'cafe', 'convenience', 'gift', 'overseas',
    'pet', 'beauty', 'medical',
    'leisure', 'invest', 'utility',
    'food', 'shopping', 'etc'
  ];

  for (var c = 0; c < checkOrder.length; c++) {
    var category = checkOrder[c];
    if (validIds.indexOf(category) === -1) continue;
    if (!rules[category]) continue;
    var keywords = rules[category];
    for (var i = 0; i < keywords.length; i++) {
      if (m.indexOf(keywords[i]) !== -1) return category;
    }
  }
  return 'etc';
}
// ═══ 수동 실행용 config 조회 헬퍼 ═══
function _getConfigForEmail(email) {
  return USER_CONFIG[email || 'leftjap@gmail.com'] || USER_CONFIG['leftjap@gmail.com'];
}

// ═══ card_sms 스프레드시트에서 가계부 일괄 가져오기 ═══
// 사용법: importCardSmsSheet('leftjap@gmail.com') 또는 importCardSmsSheet('soyoun312@gmail.com')
function importCardSmsSheet(email) {
  var config = _getConfigForEmail(email);

  if (!config.cardSmsSheetId) {
    console.log('cardSmsSheetId가 설정되지 않았습니다.');
    return;
  }

  var ss = SpreadsheetApp.openById(config.cardSmsSheetId);
  var sheet = ss.getSheets()[0];
  var data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    console.log('데이터가 없습니다');
    return;
  }

  var file = getDatabaseFile(config);
  var content = file.getBlob().getDataAsString();
  var db = JSON.parse(content || '{}');
  if (!db['gb_expenses']) db['gb_expenses'] = [];

  var existing = db['gb_expenses'];
  var added = 0;
  var skipped = 0;
  var failed = 0;

  // brandOverrides 로드 — saveExpenseFromSMS와 동일하게 brand 적용
  var overrides = db['gb_brand_overrides'] || {};

  for (var i = 1; i < data.length; i++) {
    var sentDate = data[i][0];
    var smsText = data[i][1];

    if (!smsText) { skipped++; continue; }

    var parsed = parseSMSServer(String(smsText), config);
    if (!parsed) { failed++; continue; }

    // 매출처명 정제
    if (parsed.merchant) {
      parsed.merchant = cleanMerchantName(parsed.merchant);
    }

    // sent_date에서 정확한 날짜/시간 추출 (문자 안에는 연도가 없으므로)
    if (sentDate instanceof Date) {
      var y = sentDate.getFullYear();
      var m = ('0' + (sentDate.getMonth() + 1)).slice(-2);
      var d = ('0' + sentDate.getDate()).slice(-2);
      parsed.date = y + '-' + m + '-' + d;
      var hh = ('0' + sentDate.getHours()).slice(-2);
      var mm = ('0' + sentDate.getMinutes()).slice(-2);
      parsed.time = hh + ':' + mm;
    } else if (sentDate) {
      var dateStr = String(sentDate).trim();
      var datePart = dateStr.substring(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        parsed.date = datePart;
      }
      var timePart = dateStr.substring(11, 16);
      if (/^\d{2}:\d{2}$/.test(timePart)) {
        parsed.time = timePart;
      }
    }

    // sentDate가 비어있어 파서의 기본 날짜(현재 연도)를 사용한 경우 경고
    if (!sentDate) {
      console.warn('행 ' + i + ': sent_date 비어있음 — 파서 기본 날짜 사용 (' + parsed.date + '). SMS: ' + String(smsText).substring(0, 50));
    }

    // 미래 날짜 안전장치: sent_date 파싱 실패 등으로 미래 날짜가 남아있으면 보정
    var importTodayStr = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');
    if (parsed.date > importTodayStr) {
      var oldDate = parsed.date;
      var pts = parsed.date.split('-');
      var fy = parseInt(pts[0]);
      var fm = pts[1];
      var fd = pts[2];
      while (fy + '-' + fm + '-' + fd > importTodayStr && fy > 2020) {
        fy--;
      }
      parsed.date = fy + '-' + fm + '-' + fd;
      console.warn('행 ' + i + ': 미래 날짜 보정 ' + oldDate + ' → ' + parsed.date + ' | ' + parsed.amount + '원 | ' + parsed.merchant);
    }

    // 중복 체크: 같은 날짜 + 같은 금액 + 같은 가맹점
    var isDuplicate = false;
    for (var j = 0; j < existing.length; j++) {
      if (existing[j].date === parsed.date &&
          existing[j].amount === parsed.amount &&
          existing[j].merchant === parsed.merchant) {
        isDuplicate = true;
        break;
      }
    }
    if (isDuplicate) { skipped++; continue; }

    // 해외 결제: 고정 환율로 환산 (import는 과거 데이터이므로 실시간 환율 불필요)
    var importForeignAmount = null;
    var importCurrency = null;
    if (parsed.foreignAmount && parsed.currency) {
      importForeignAmount = parsed.foreignAmount;
      importCurrency = parsed.currency;
      var FX_IMPORT = {
        'USD': 1350, 'EUR': 1450, 'JPY': 9, 'GBP': 1700,
        'CNY': 190, 'THB': 40, 'VND': 0.055, 'PHP': 25,
        'HUF': 4, 'KHR': 0.33, 'SGD': 1000, 'KRW': 1
      };
      var importRate = FX_IMPORT[parsed.currency] || 1;
      parsed.amount = Math.round(parsed.foreignAmount * importRate);
      console.log('import 해외 환산: ' + parsed.foreignAmount + ' ' + parsed.currency + ' → ' + parsed.amount + '원');
    }

    // brandOverrides 체크 — saveExpenseFromSMS와 동일 로직
    var importBrand = null;
    if (overrides.hasOwnProperty(parsed.merchant)) {
      var overrideEntry = overrides[parsed.merchant];
      if (overrideEntry && overrideEntry.hasOwnProperty('brand')) {
        importBrand = overrideEntry.brand;
      }
    }

    // 현대백화점카드 결제이고 brand가 미설정이면 "현대백화점 식품관"으로 자동 설정
    if (!importBrand && parsed.card === '현대백화점카드') {
      importBrand = '현대백화점 식품관';
    }

    // MERCHANT_TO_BRAND 자동 브랜드 부여
    if (!importBrand && parsed.merchant && MERCHANT_TO_BRAND[parsed.merchant]) {
      importBrand = MERCHANT_TO_BRAND[parsed.merchant];
    }

    // brand→category 자동 부여 (BRAND_CATEGORY_MAP 기준)
    if (importBrand && BRAND_CATEGORY_MAP[importBrand]) {
      parsed.category = BRAND_CATEGORY_MAP[importBrand];
    }

    var expense = {
      id: String(new Date().getTime()) + '_' + i,
      amount: parsed.amount,
      category: parsed.category,
      merchant: parsed.merchant,
      card: parsed.card,
      memo: '',
      date: parsed.date,
      time: parsed.time,
      created: new Date().toISOString(),
      source: 'import',
      brand: importBrand
    };

    // 해외 결제: 외화 정보 저장
    if (importForeignAmount && importCurrency) {
      expense.foreignAmount = importForeignAmount;
      expense.currency = importCurrency;
    }

    existing.push(expense);
    added++;
  }

  // 날짜순 정렬 (최신이 앞)
  existing.sort(function(a, b) {
    var da = (a.date || '') + (a.time || '');
    var db2 = (b.date || '') + (b.time || '');
    return db2 > da ? 1 : db2 < da ? -1 : 0;
  });

  existing.sort(function(a, b) {
    var da = (a.date || '') + (a.time || '');
    var db2 = (b.date || '') + (b.time || '');
    return db2 > da ? 1 : db2 < da ? -1 : 0;
  });

  db['gb_expenses'] = existing;
  file.setContent(JSON.stringify(db));

  console.log('=== 가져오기 완료 (' + config.rootFolder + ') ===');
  console.log('추가: ' + added + '건');
  console.log('건너뜀(중복/빈값): ' + skipped + '건');
  console.log('파싱 실패: ' + failed + '건');
  console.log('전체 가계부 항목: ' + existing.length + '건');
}

function removeFakeSms(email) {
  var config = _getConfigForEmail(email);
  var file = getDatabaseFile(config);
  var content = file.getBlob().getDataAsString();
  var db = JSON.parse(content || '{}');
  var expenses = db['gb_expenses'] || [];
  var before = expenses.length;

  var cleaned = [];
  for (var i = 0; i < expenses.length; i++) {
    if (expenses[i].source === 'import') cleaned.push(expenses[i]);
  }

  db['gb_expenses'] = cleaned;
  file.setContent(JSON.stringify(db));

  console.log('삭제 전: ' + before + '건');
  console.log('삭제 후: ' + cleaned.length + '건');
  console.log('제거: ' + (before - cleaned.length) + '건');
}

// ═══ 가계부 데이터 전체 삭제 ═══
function clearAllExpenses(email) {
  var config = _getConfigForEmail(email);
  var file = getDatabaseFile(config);
  var content = file.getBlob().getDataAsString();
  var db = JSON.parse(content || '{}');

  var before = (db['gb_expenses'] || []).length;
  db['gb_expenses'] = [];
  file.setContent(JSON.stringify(db));

  console.log('=== 가계부 초기화 완료 (' + config.rootFolder + ') ===');
  console.log('삭제된 항목: ' + before + '건');
  console.log('현재 항목: 0건');
}

// ═══ 기존 가계부 데이터 일괄 재분류 (GAS 편집기에서 수동 실행) ═══
function reclassifyAllExpenses(email) {
  var config = _getConfigForEmail(email);
  var file = getDatabaseFile(config);
  var content = file.getBlob().getDataAsString();
  var db = JSON.parse(content || '{}');
  var expenses = db['gb_expenses'] || [];

  if (expenses.length === 0) {
    console.log('가계부 데이터가 없습니다.');
    return;
  }

  // brandOverrides 로드 — 사용자가 수동 지정한 매출처는 건너뛴다
  var overrides = db['gb_brand_overrides'] || {};
  var overrideSkipped = 0;

  var props = PropertiesService.getScriptProperties();
  var cacheKey = 'reclassify_cache_' + (email || 'default');
  var indexKey = 'reclassify_index_' + (email || 'default');

  // 캐시 구조: { merchant: { category: '...', brand: '...' } }
  var cache = {};
  try {
    var cacheStr = props.getProperty(cacheKey);
    if (cacheStr) cache = JSON.parse(cacheStr);
  } catch (e) {
    cache = {};
  }

  var startIndex = parseInt(props.getProperty(indexKey) || '0');
  if (startIndex >= expenses.length) startIndex = 0;

  console.log('=== 재분류 시작 (' + config.rootFolder + ') ===');
  console.log('전체 항목: ' + expenses.length + '건, 시작 인덱스: ' + startIndex);
  console.log('캐시된 매출처: ' + Object.keys(cache).length + '개');
  console.log('brandOverrides: ' + Object.keys(overrides).length + '개');

  var geminiCalls = 0;
  var cacheHits = 0;
  var changed = 0;
  var startTime = new Date().getTime();
  var TIME_LIMIT = 5 * 60 * 1000;

  for (var i = startIndex; i < expenses.length; i++) {
    if (new Date().getTime() - startTime > TIME_LIMIT) {
      console.log('5분 경과 — 중간 저장. 다음 시작 인덱스: ' + i);
      props.setProperty(indexKey, String(i));
      props.setProperty(cacheKey, JSON.stringify(cache));
      db['gb_expenses'] = expenses;
      file.setContent(JSON.stringify(db));
      console.log('Gemini 호출: ' + geminiCalls + ', 캐시: ' + cacheHits + ', 변경: ' + changed + ', 오버라이드 건너뜀: ' + overrideSkipped);
      return;
    }

    var merchant = (expenses[i].merchant || '').trim();
    if (!merchant) continue;

    // brandOverrides에 있는 매출처명은 건너뛴다
    if (overrides.hasOwnProperty(merchant)) {
      overrideSkipped++;
      continue;
    }

    var result;
    if (cache.hasOwnProperty(merchant)) {
      result = cache[merchant];
      cacheHits++;
    } else {
      result = classifyMerchantWithGemini(merchant, '', config);
      cache[merchant] = result;
      geminiCalls++;
      Utilities.sleep(1500);
    }

    var catChanged = false;
    var brandChanged = false;

    if (result.category && result.category !== expenses[i].category) {
      expenses[i].category = result.category;
      catChanged = true;
    }

    // brand 필드 설정 (기존 데이터에 brand가 없으면 추가)
    var newBrand = result.brand || null;
    if (expenses[i].brand !== newBrand) {
      expenses[i].brand = newBrand;
      brandChanged = true;
    }

    if (catChanged || brandChanged) changed++;
  }

  db['gb_expenses'] = expenses;
  file.setContent(JSON.stringify(db));
  props.deleteProperty(indexKey);
  props.deleteProperty(cacheKey);

  console.log('=== 재분류 완료 (' + config.rootFolder + ') ===');
  console.log('전체: ' + expenses.length + ', Gemini: ' + geminiCalls + ', 캐시: ' + cacheHits + ', 변경: ' + changed + ', 오버라이드 건너뜀: ' + overrideSkipped);
}

// ═══ 미래 날짜 가계부 항목 보정 (GAS 편집기에서 수동 실행) ═══
function fixFutureExpenses(email) {
  var config = _getConfigForEmail(email);
  var file = getDatabaseFile(config);
  var content = file.getBlob().getDataAsString();
  var db = JSON.parse(content || '{}');
  var expenses = db['gb_expenses'] || [];

  var todayStr = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');
  var fixed = 0;
  var details = [];

  for (var i = 0; i < expenses.length; i++) {
    var exp = expenses[i];
    if (!exp.date || exp.date <= todayStr) continue;

    var oldDate = exp.date;
    var parts = exp.date.split('-');
    var y = parseInt(parts[0]);
    var m = parts[1];
    var d = parts[2];

    while (y + '-' + m + '-' + d > todayStr && y > 2020) {
      y--;
    }

    exp.date = y + '-' + m + '-' + d;
    fixed++;
    details.push('  ' + oldDate + ' → ' + exp.date + ' | ' + exp.amount + '원 | ' + exp.merchant);
  }

  if (fixed > 0) {
    db['gb_expenses'] = expenses;
    file.setContent(JSON.stringify(db));
  }

  console.log('=== 미래 날짜 보정 완료 (' + config.rootFolder + ') ===');
  console.log('보정된 항목: ' + fixed + '건');
  if (details.length > 0) {
    console.log('상세:');
    for (var j = 0; j < details.length; j++) {
      console.log(details[j]);
    }
  }
  console.log('앱에서 새로고침하면 반영됩니다.');
}

