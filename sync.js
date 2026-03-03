// ═══════════════════════════════════════
// sync.js — GAS 동기화, 지도, 이미지 메뉴, init
// ═══════════════════════════════════════

// ═══ GAS Sync ═══
const GAS_URL = 'https://script.google.com/macros/s/AKfycbw3WUMJJyab2uZ33OtZVU1Rv4kvo47cqTaRecEZta4gAtaizN667CV4oZLS8q4nNUTY/exec';

const SYNC = {
  dbTimer: null,
  docTimers: {},       // 문서별 독립 타이머
  checksTimer: null,
  bookTimer: null,
  quoteTimer: null,
  isDbLoaded: false,
  savingDocs: {},
  dirtyDocs: {},
  quoteSyncHistory: {},
  _dbSaveQueued: false, // DB 저장 중복 방지 플래그

  setSyncStatus(text, type) {
    const el = document.getElementById('syncStatus');
    const dot = document.getElementById('syncDot');
    if (el) el.textContent = text;
    if (dot) {
      dot.style.background = type === 'error' ? 'var(--red)' : type === 'syncing' ? 'var(--yellow)' : '#7a9968';
      dot.style.animation = type === 'syncing' ? 'pulse 1s infinite' : 'none';
    }
    const cloudDot = document.getElementById('syncCloudDot');
    if (cloudDot) {
      cloudDot.style.background = type === 'error' ? 'var(--red)' : type === 'syncing' ? 'var(--yellow)' : '#7a9968';
    }
  },

  async _post(data) {
    data.token = APP_TOKEN;
    data.idToken = localStorage.getItem('gb_id_token');
    if (!data.idToken) throw new Error('LocalMode');
    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        throw new Error('HTTP ' + res.status);
      }
      const json = await res.json();
      if (json.status === 'error') {
        if (json.message === 'Unauthorized') throw new Error('Unauthorized');
        else throw new Error(json.message);
      }
      return json;
    } catch (e) {
      if (e.message !== 'Unauthorized' && e.message !== 'LocalMode') {
        console.warn('SYNC._post 실패:', e.message);
        this.setSyncStatus('통신 지연', 'error');
      }
      throw e;
    }
  },

  // ═══ DB 로드/저장 ═══
  async loadDatabase() {
    try {
      const res = await this._post({ action: 'load_db' });
      if (res && res.dbData && Object.keys(res.dbData).length > 0) {
        const db = res.dbData;
        if (db[K.docs] && db[K.docs].length >= 0) S(K.docs, db[K.docs]);
        if (db[K.books]) S(K.books, db[K.books]);
        if (db[K.quotes]) S(K.quotes, db[K.quotes]);
        if (db[K.memos]) S(K.memos, db[K.memos]);
        if (db[K.checks]) S(K.checks, db[K.checks]);
        this.isDbLoaded = true;
        this.setSyncStatus('동기화 완료', 'ok');
      } else {
        this.isDbLoaded = true;
        this.setSyncStatus('신규 상태', 'ok');
      }
    } catch (e) {
      this.isDbLoaded = true; // 로컬 모드로라도 작동하도록
      if (e.message === 'LocalMode') this.setSyncStatus('로컬 전용', 'error');
      else this.setSyncStatus('불러오기 실패', 'error');
      console.warn('loadDatabase 실패:', e.message);
    }
  },

  async saveDatabase() {
    if (!this.isDbLoaded) return;
    try {
      const dbData = {
        [K.docs]: L(K.docs) || [],
        [K.books]: L(K.books) || [],
        [K.memos]: L(K.memos) || [],
        [K.quotes]: L(K.quotes) || [],
        [K.checks]: L(K.checks) || {}
      };
      await this._post({ action: 'save_db', dbData });
    } catch (e) {
      console.warn('saveDatabase 실패:', e.message);
    }
  },

  scheduleDatabaseSave() {
    // 이미 예약된 DB 저장이 있으면 중복 예약하지 않음
    if (this._dbSaveQueued) return;
    this._dbSaveQueued = true;
    clearTimeout(this.dbTimer);
    this.dbTimer = setTimeout(async () => {
      try {
        await this.saveDatabase();
      } catch (e) {
        console.warn('scheduleDatabaseSave 실패:', e.message);
      } finally {
        this._dbSaveQueued = false;
      }
    }, 3000);
  },

  // ═══ 이미지 업로드 ═══
  async uploadImage(base64Data, filename, mimeType) {
    if (!GAS_URL) throw new Error('No GAS URL');
    this.setSyncStatus('업로드 중', 'syncing');
    try {
      const res = await this._post({
        action: 'upload_image',
        bytes: base64Data,
        filename,
        mimeType
      });
      this.setSyncStatus('저장 완료', 'ok');
      return res;
    } catch (e) {
      if (e.message === 'LocalMode') this.setSyncStatus('로컬 전용', 'error');
      else this.setSyncStatus('업로드 실패', 'error');
      throw e;
    }
  },

  // ═══ 문서 → 구글 드라이브 저장 (중복 방지 개선) ═══
  async saveDocToGDrive(id, type) {
    if (!GAS_URL || !this.isDbLoaded) return;

    // 이미 같은 문서를 저장 중이면 dirty 플래그만 세우고 리턴
    if (this.savingDocs[id]) {
      this.dirtyDocs[id] = type;
      return;
    }

    this.savingDocs[id] = true;
    const items = (type === 'memo') ? getMemos() : allDocs();
    const doc = items.find(d => d.id === id);

    if (!doc || !stripHtml(doc.content).trim()) {
      this.savingDocs[id] = false;
      return;
    }

    try {
      this.setSyncStatus('저장 중', 'syncing');
      const res = await this._post({
        action: 'save_doc',
        id: doc.id,
        driveId: doc.driveId || null,
        type,
        title: doc.title || today(),
        content: buildDocContent(doc)
      });

      // driveId 업데이트
      if (res && res.driveId) {
        const freshItems = (type === 'memo') ? getMemos() : allDocs();
        const freshDoc = freshItems.find(d => d.id === doc.id);
        if (freshDoc && freshDoc.driveId !== res.driveId) {
          freshDoc.driveId = res.driveId;
          if (type === 'memo') saveMemos(freshItems);
          else saveDocs(freshItems);
        }
      }
      this.setSyncStatus('완료됨', 'ok');
    } catch (e) {
      console.warn('saveDocToGDrive 실패:', id, e.message);
      this.setSyncStatus('저장 실패', 'error');
    } finally {
      this.savingDocs[id] = false;

      // 저장 중에 또 변경이 있었으면 한 번 더 저장
      if (this.dirtyDocs[id]) {
        const nextType = this.dirtyDocs[id];
        delete this.dirtyDocs[id];
        this.saveDocToGDrive(id, nextType).catch(() => {});
      }
    }
  },

  // ═══ 문서 저장 스케줄링 (문서별 독립 타이머) ═══
  scheduleDocSave(type) {
    const id = (type === 'memo') ? curMemoId : curIds[type];
    if (!id) return;

    // 문서별로 독립 타이머 사용 → 다른 문서 저장을 덮어쓰지 않음
    const timerKey = type + '_' + id;
    clearTimeout(this.docTimers[timerKey]);

    this.docTimers[timerKey] = setTimeout(async () => {
      try {
        await this.saveDocToGDrive(id, type);
      } catch (e) {
        console.warn('scheduleDocSave 실패:', e.message);
      }
      // 문서 저장 완료 후 DB 저장도 예약
      this.scheduleDatabaseSave();

      // 사용 끝난 타이머 키 정리
      delete this.docTimers[timerKey];
    }, 5000);
  },

  // ═══ 루틴 체크 저장 ═══
  scheduleChecksSave() {
    clearTimeout(this.checksTimer);
    this.checksTimer = setTimeout(async () => {
      try {
        await this.saveChecksToSheet();
      } catch (e) {
        console.warn('scheduleChecksSave 실패:', e.message);
      }
      this.scheduleDatabaseSave();
    }, 400);
  },

  async saveChecksToSheet(dateStr, checkData) {
    if (!GAS_URL || !this.isDbLoaded) return;
    const dStr = dateStr || today();
    const dData = checkData || getChk();
    const payload = { action: 'save_routine', date: dStr, checks: dData };
    const payloadKey = JSON.stringify(payload);

    // 동일한 내용이면 스킵
    if (payloadKey === this.lastChecksPayload) return;

    if (this.checksSaving) {
      this.checksPending = true;
      return;
    }

    this.checksSaving = true;
    try {
      await this._post(payload);
      this.lastChecksPayload = payloadKey;
    } catch (e) {
      console.warn('saveChecksToSheet 실패:', e.message);
    } finally {
      this.checksSaving = false;
      if (this.checksPending) {
        this.checksPending = false;
        try { await this.saveChecksToSheet(); } catch (e) {}
      }
    }
  },

  // ═══ 책 저장 ═══
  scheduleBookSave(book) {
    clearTimeout(this.bookTimer);
    this.bookTimer = setTimeout(async () => {
      try {
        await this.saveBooksToSheet(book);
      } catch (e) {
        console.warn('scheduleBookSave 실패:', e.message);
      }
      this.scheduleDatabaseSave();
    }, 5000);
  },

  async saveBooksToSheet(book) {
    if (!GAS_URL || !book || !this.isDbLoaded) return;
    try {
      const res = await this._post({
        action: 'save_doc',
        id: book.id,
        driveId: book.driveId,
        type: 'book',
        title: book.title,
        content: '저자: ' + (book.author || '') + '\n출판사: ' + (book.publisher || '') + '\n읽은 양: ' + (book.pages || 0) + 'p\n\n' + stripHtml(book.memo || '')
      });
      if (res && res.driveId) {
        const books = getBooks();
        const idx = books.findIndex(b => b.id === book.id);
        if (idx !== -1 && books[idx].driveId !== res.driveId) {
          books[idx].driveId = res.driveId;
          saveBooks(books);
        }
      }
    } catch (e) {
      console.warn('saveBooksToSheet 실패:', e.message);
    }
  },

  // ═══ 어구 저장 ═══
  scheduleQuoteSave(text, by, id) {
    clearTimeout(this.quoteTimer);
    this.quoteTimer = setTimeout(async () => {
      if (!this.quoteSyncHistory[id]) {
        try {
          await this.saveQuotesToSheet(text, by);
          this.quoteSyncHistory[id] = true;
        } catch (e) {
          console.warn('scheduleQuoteSave 실패:', e.message);
        }
      }
      this.scheduleDatabaseSave();
    }, 5000);
  },

  async saveQuotesToSheet(text, by) {
    if (!GAS_URL || !this.isDbLoaded) return;
    await this._post({ action: 'save_quote', text: text || '', by: by || '' });
  },

  // ═══ 전체 동기화 ═══
  async syncAll() {
    if (!this.isDbLoaded) return;

    // 진행 중인 모든 문서 타이머 취소
    Object.keys(this.docTimers).forEach(key => {
      clearTimeout(this.docTimers[key]);
      delete this.docTimers[key];
    });
    clearTimeout(this.dbTimer);
    this._dbSaveQueued = false;

    this.setSyncStatus('동기화 중', 'syncing');
    try {
      const promises = [];
      for (const type of textTypes) {
        if (curIds[type]) promises.push(this.saveDocToGDrive(curIds[type], type));
      }
      if (curMemoId) promises.push(this.saveDocToGDrive(curMemoId, 'memo'));
      promises.push(this.saveDatabase());
      await Promise.all(promises);
      this.setSyncStatus('완료됨', 'ok');
    } catch (e) {
      if (e.message === 'LocalMode') this.setSyncStatus('로컬 전용', 'error');
      else this.setSyncStatus('통신 지연', 'error');
      console.warn('syncAll 실패:', e.message);
    }
  }
};

// ═══ 지도 ═══
const LOCATIONS = {
  gio: { addrMain: 'Mapo-gu, South Korea', addrSub: '와우산로37길' },
  soyeon: { addrMain: 'Shinjuku, Tokyo', addrSub: '新宿区, 東京都' }
};

function openLocationModal(key) {
  const loc = LOCATIONS[key];
  if (!loc) return;
  document.getElementById('addrMain').textContent = loc.addrMain;
  document.getElementById('addrSub').textContent = loc.addrSub;

  const mapContainer = document.querySelector('.modal-map');
  const searchQuery = encodeURIComponent(loc.addrSub + ' ' + loc.addrMain);
  mapContainer.innerHTML = `<iframe
    width="100%"
    height="100%"
    frameborder="0"
    style="border:0;"
    src="https://maps.google.com/maps?q=${searchQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed">
  </iframe>`;

  document.getElementById('modalOverlay').classList.add('open');
}

function closeLocationModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  setTimeout(() => {
    const mapContainer = document.querySelector('.modal-map');
    if (mapContainer) mapContainer.innerHTML = '';
  }, 250);
}

function onLocationOverlayClick(e) {
  if (e.target === document.getElementById('modalOverlay')) {
    closeLocationModal();
  }
}

// ═══ 이미지 호버 메뉴 ═══
let currentHoverImg = null;

function setupImageHover() {
  const hoverBtn = document.getElementById('imgHoverBtn');
  const menu = document.getElementById('imgDropdownMenu');
  const scrollAreas = document.querySelectorAll('.editor-scroll-area');

  const hideAll = () => {
    if (!menu.classList.contains('open')) {
      hoverBtn.classList.remove('show');
      currentHoverImg = null;
    }
  };

  const checkImgHover = (e) => {
    if (e.target.tagName === 'IMG' && e.target.closest('.ed-body')) {
      currentHoverImg = e.target;
      const rect = currentHoverImg.getBoundingClientRect();
      hoverBtn.style.top = (rect.top + 10) + 'px';
      hoverBtn.style.left = (rect.right - 42) + 'px';
      hoverBtn.classList.add('show');
    } else if (e.target.closest('#imgHoverBtn') || e.target.closest('#imgDropdownMenu')) {
      // 메뉴 위에 있으면 유지
    } else {
      hideAll();
    }
  };

  document.addEventListener('mousemove', checkImgHover);

  scrollAreas.forEach(area => {
    area.addEventListener('scroll', () => {
      hoverBtn.classList.remove('show');
      menu.classList.remove('open');
      currentHoverImg = null;
    });
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('#imgDropdownMenu') && !e.target.closest('#imgHoverBtn')) {
      menu.classList.remove('open');
      hoverBtn.classList.remove('show');
    }
  });
}

function toggleImgMenu(e) {
  e.stopPropagation();
  const menu = document.getElementById('imgDropdownMenu');
  const hoverBtn = document.getElementById('imgHoverBtn');

  if (menu.classList.contains('open')) {
    menu.classList.remove('open');
  } else {
    const btnRect = hoverBtn.getBoundingClientRect();
    menu.style.top = (btnRect.bottom + 6) + 'px';
    let left = btnRect.right - 210;
    if (left < 10) left = 10;
    menu.style.left = left + 'px';
    const now = new Date();
    document.getElementById('imgMenuDate').textContent = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;
    menu.classList.add('open');
  }
}

async function execImgAction(action) {
  const menu = document.getElementById('imgDropdownMenu');
  const hoverBtn = document.getElementById('imgHoverBtn');
  menu.classList.remove('open');
  hoverBtn.classList.remove('show');
  if (!currentHoverImg) return;

  if (action === 'delete' || action === 'cut') {
    currentHoverImg.remove();
    updateWC();
    if (textTypes.includes(activeTab)) saveCurDoc(activeTab);
    else saveMemo();
  }

  if (action === 'copy' || action === 'cut') {
    try {
      const src = currentHoverImg.src;
      if (src.startsWith('data:')) {
        const res = await fetch(src);
        const blob = await res.blob();
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      } else {
        // 외부 URL 이미지: fetch → blob으로 변환 후 복사
        try {
          const res = await fetch(src);
          const blob = await res.blob();
          await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        } catch {
          // CORS 차단 시 HTML로 폴백
          await navigator.clipboard.writeText(src);
          console.log('이미지 URL이 클립보드에 복사됨 (CORS 제한)');
        }
      }
    } catch (err) {
      // 최종 폴백: 이미지 URL을 텍스트로 복사
      try {
        await navigator.clipboard.writeText(currentHoverImg.src);
      } catch (e2) {
        console.warn('Clipboard write failed:', e2);
      }
    }
  }
  currentHoverImg = null;
}

// ═══ 인증 ═══
const GOOGLE_CLIENT_ID = '910366325974-3ollm3pose37r1fvv8ngnd0v09f2p57l.apps.googleusercontent.com';
const ALLOWED_EMAIL = 'leftjap@gmail.com';

function handleCredentialResponse(response) {
  try {
    const jwt = response.credential;
    const payload = JSON.parse(atob(jwt.split('.')[1]));
    if (payload.email === ALLOWED_EMAIL) {
      localStorage.setItem('gb_auth', '1');
      localStorage.setItem('gb_id_token', jwt);
      document.getElementById('lockScreen').classList.add('hidden');
      showApp();
    } else {
      document.getElementById('lockErr').textContent = '접근 권한이 없는 계정입니다.';
    }
  } catch (e) {
    document.getElementById('lockErr').textContent = '로그인 처리 중 오류가 발생했습니다.';
  }
}

window.onload = function () {
  const isLocal = location.hostname === '127.0.0.1' || location.hostname === 'localhost';
  if (isLocal || localStorage.getItem('gb_id_token')) {
    document.getElementById('lockScreen').classList.add('hidden');
    showApp();
  } else {
    document.getElementById('lockScreen').classList.remove('hidden');
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse
    });
    google.accounts.id.renderButton(
      document.getElementById('googleSignInBtn'),
      { theme: 'outline', size: 'large', width: 280 }
    );
  }
};

async function showApp() {
  const loading = document.getElementById('loadingScreen');
  loading.classList.remove('hidden');
  SYNC.setSyncStatus('동기화 중', 'syncing');
  await SYNC.loadDatabase();
  injectMockData();
  init();
  loading.style.opacity = '0';
  setTimeout(() => {
    loading.classList.add('hidden');
    loading.style.opacity = '';
    document.getElementById('mainApp').style.display = 'flex';
    if(window.innerWidth <= 768) {
      setMobileView('list');
    } else {
      renderListPanel();
    }
  }, 400);
}

// ═══ Init ═══
function init() {
  try {
    // 사이드바는 오버레이 방식으로 통합됨

    applyTabColor('navi');
    renderChk();
    renderRoutineRing();
    updateBookStats();
    updateWritingStats();
    showRandomQuote();
    setupAutoSave();
    setupEnterKey();
    setupSwipeActions();
    setupCopyHandler();
    setupImageHover();

    document.getElementById('edBody').addEventListener('paste', handlePaste);
    document.getElementById('memo-body').addEventListener('paste', handlePaste);

        const checkSelWrapper = () => {
      clearTimeout(selectionTimeout);
      selectionTimeout = setTimeout(checkSelection, 50);
    };
    document.addEventListener('selectionchange', checkSelWrapper);
    document.getElementById('edBody').addEventListener('mouseup', checkSelWrapper);
    document.getElementById('edBody').addEventListener('keyup', e => { if (e.shiftKey) checkSelWrapper(); });
    document.getElementById('memo-body').addEventListener('mouseup', checkSelWrapper);
    document.getElementById('memo-body').addEventListener('keyup', e => { if (e.shiftKey) checkSelWrapper(); });

    setupFloatingToolbar();
    setupEditorImageSelection();
    setupGesturesAndUI();
    setupListContextMenu();
    const naviDocs = getDocs('navi');
    if (naviDocs.length) loadDoc('navi', naviDocs[0].id, true);
    else { const nd = newDoc('navi'); loadDoc('navi', nd.id, true); }

    if (GAS_URL) SYNC.setSyncStatus('완료됨', 'ok');
    else SYNC.setSyncStatus('로컬 전용', 'error');

    switchListView('list');
  } catch (e) {
    console.error('init error:', e);
    alert('초기화 오류: ' + e.message);
  }
}