// ═══ PROJECT: keep ═══

// ═══════════════════════════════════════
// storage.js — LocalStorage 기본, 날짜/유틸, 모의 데이터
// ═══════════════════════════════════════

// ═══ 앱 상수 ═══
const APP_TOKEN = '';
const K = {
  docs:               'gb_docs',
  checks:             'gb_chk',
  books:              'gb_books',
  quotes:             'gb_quotes',
  memos:              'gb_memos',
  expenses:           'gb_expenses',
  merchantIcons:      'gb_merchant_icons',
  merchantAliases:    'gb_merchant_aliases',
  brandIcons:         'gb_brand_icons',
  brandOverrides:     'gb_brand_overrides',
  merchantCategories: 'gb_merchant_categories'
};

// ═══ LocalStorage 키 접두사 (멀티유저 격리) ═══
const _LS_PREFIX = (window.APP_USER === 'soyoun312') ? 'sy_' : '';

// ═══ LocalStorage 읽기/쓰기 ═══
const L = k => {
  try { return JSON.parse(localStorage.getItem(_LS_PREFIX + k)) || null; }
  catch { return null; }
};

const S = (k, v) => {
  try {
    localStorage.setItem(_LS_PREFIX + k, JSON.stringify(v));
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
