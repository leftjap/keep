// ═══ PROJECT: keep ═══

// ═══════════════════════════════════════
// app.js — 인증, 지도, init, showApp (앱 진입점)
// ═══════════════════════════════════════

// ═══ 인증 ═══
const GOOGLE_CLIENT_ID = '910366325974-3ollm3pose37r1fvv8ngnd0v09f2p57l.apps.googleusercontent.com';

function handleCredentialResponse(response) {
  try {
    const jwt = response.credential;
    localStorage.setItem(_LS_PREFIX + 'gb_auth',     '1');
    localStorage.setItem(_LS_PREFIX + 'gb_id_token', jwt);
    document.getElementById('lockScreen').classList.add('hidden');
    showApp();
  } catch (e) {
    document.getElementById('lockErr').textContent = '로그인 처리 중 오류가 발생했습니다.';
  }
}

window.onload = function() {
  const isLocal = location.hostname === '127.0.0.1' || location.hostname === 'localhost';
  if (isLocal || localStorage.getItem(_LS_PREFIX + 'gb_id_token')) {
    document.getElementById('lockScreen').classList.add('hidden');
    showApp();
  } else {
    document.getElementById('lockScreen').classList.remove('hidden');
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback:  handleCredentialResponse
    });
    google.accounts.id.renderButton(
      document.getElementById('googleSignInBtn'),
      { theme: 'outline', size: 'large', width: 280 }
    );
  }
};

async function showApp() {
  // iOS Safari 저장공간 보호 요청
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(function() {});
  }
  const loading = document.getElementById('loadingScreen');
  loading.classList.remove('hidden');
  SYNC.setSyncStatus('동기화 중', 'syncing');

  var serverConfig = null;
  var hasLocalData = !!(L(K.docs) && L(K.expenses));

  // 빈 LS 보호: 로컬 데이터가 없으면 서버 복원 완료까지 save 차단
  if (!hasLocalData) {
    SYNC.isDbLoaded = false;
  }

  if (hasLocalData) {
    // ── 로컬 캐시 있음: 서버 동기화 후 UI 표시 (최대 4초 대기) ──
    var _syncDone = false;

    // 타임아웃: 4초 안에 서버 응답 없으면 로컬 데이터로 표시
    var _syncTimeout = setTimeout(function() {
      if (!_syncDone) {
        _syncDone = true;
        console.warn('[showApp] 서버 동기화 타임아웃 — 로컬 데이터로 표시');
        // _dbLoading은 유지 — loadDatabase 응답이 도착하면 DB 적용 + _dbLoading 해제
        // isDbLoaded는 true로 설정하여 UI는 표시하되, saveDatabase는 _dbLoading 가드로 차단
        SYNC.isDbLoaded = true;
        SYNC.setSyncStatus('오프라인', 'error');
        _initAndShow(loading, serverConfig);
      }
    }, 4000);

    SYNC.loadDatabase().then(function(config) {
      if (_syncDone) {
        // 타임아웃 이후 뒤늦게 도착 — DB 데이터는 이미 loadDatabase 내부에서 로컬에 적용됨
        // (_dbLoading은 loadDatabase의 finally에서 false로 해제됨 → 대기 중이던 saveDatabase가 최신 로컬로 진행)
        if (config) {
          applyServerConfig(config);
          renderWritingGrid();
          if (activeTab === 'expense') {
            if (typeof renderExpenseCategoryGrid === 'function') renderExpenseCategoryGrid();
            if (typeof renderExpenseDashboard === 'function') {
              renderExpenseDashboard(window.innerWidth > 768 ? 'pc' : 'mobile');
            }
          }
        }
        // 뒤늦은 서버 데이터로 UI 갱신
        renderListPanel();
        var cl = currentLoadedDoc;
        if (cl && cl.type && cl.id) {
          if (textTypes.includes(cl.type)) loadDoc(cl.type, cl.id, true);
          else if (cl.type === 'book')  loadBook(cl.id, true);
          else if (cl.type === 'memo')  loadMemo(cl.id, true);
          else if (cl.type === 'quote') loadQuote(cl.id, true);
        }
        SYNC.setSyncStatus('완료됨', 'ok');
        return;
      }
      _syncDone = true;
      clearTimeout(_syncTimeout);
      SYNC.isDbLoaded = true;
      if (config) applyServerConfig(config);
      _initAndShow(loading, config);
      SYNC.setSyncStatus('완료됨', 'ok');
    }).catch(function(e) {
      if (_syncDone) return;
      _syncDone = true;
      clearTimeout(_syncTimeout);
      if (e && e.message === 'Unauthorized') {
        loading.classList.add('hidden');
        localStorage.removeItem(_LS_PREFIX + 'gb_auth');
        localStorage.removeItem(_LS_PREFIX + 'gb_id_token');
        document.getElementById('lockScreen').classList.remove('hidden');
        document.getElementById('lockErr').textContent = '접근 권한이 없는 계정입니다.';
        return;
      }
      console.warn('[showApp] loadDatabase 실패 — 로컬 데이터로 표시:', e);
      SYNC.isDbLoaded = true;
      SYNC.setSyncStatus('오프라인', 'error');
      _initAndShow(loading, serverConfig);
    });

  } else {
    // ── 첫 설치: 서버 대기 후 UI 표시 ──
    try {
      serverConfig = await SYNC.loadDatabase();
    } catch (e) {
      if (e && e.message === 'Unauthorized') {
        localStorage.removeItem(_LS_PREFIX + 'gb_auth');
        localStorage.removeItem(_LS_PREFIX + 'gb_id_token');
        loading.classList.add('hidden');
        document.getElementById('lockScreen').classList.remove('hidden');
        document.getElementById('lockErr').textContent = '접근 권한이 없는 계정입니다.';
        return;
      }
      console.warn('[showApp] loadDatabase 실패:', e);
    }
    _initAndShow(loading, serverConfig);
  }
}

function _initAndShow(loading, serverConfig) {
  // 서버 config 적용
  if (serverConfig) {
    applyServerConfig(serverConfig);
  }

  injectMockData();
  injectExpenseMockData();

  // 태블릿뷰: ed-topbar-right를 body로 이동
  if (window.innerWidth >= 769 && window.innerWidth <= 1400) {
    const topbarRight = document.querySelector('.editor .ed-topbar-right');
    if (topbarRight && topbarRight.parentElement !== document.body) {
      topbarRight.classList.add('topbar-fixed');
      document.body.appendChild(topbarRight);
    }
  }

  init();
  loading.style.opacity = '0';
  setTimeout(() => {
    loading.classList.add('hidden');
    loading.style.opacity = '';
    document.getElementById('mainApp').style.display = 'flex';
    if (window.innerWidth <= 768) {
      setMobileView('side');
    } else {
      const app = document.getElementById('mainApp');
      app.classList.remove('view-side','view-list','view-editor');
      if (window.innerWidth >= 769 && window.innerWidth <= 1400) {
        app.classList.remove('tablet-list-closed');
        app.classList.add('tablet-side-open');
      }
      renderListPanel();
    }
    setupTabletPCGestures();

    // ── 백그라운드: 알림 로드 ──
    setTimeout(function() {
      checkAndUpdateNotifBadge().catch(function(e) {
        console.warn('[showApp] 백그라운드 알림 로드 실패:', e);
      });
    }, 1000);

    // visibilitychange에서 알림 체크
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'visible') {
        checkAndUpdateNotifBadge();
        SYNC.mergeServerAll();
      }
    });

    // ── 페이지 이탈 시 긴급 저장 ──
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'hidden') {
        SYNC._flushBeforeUnload();
      }
    });
    window.addEventListener('pagehide', function() {
      SYNC._flushBeforeUnload();
    });

    // 리사이즈 시 topbar-fixed 토글
    window.addEventListener('resize', function() {
      const tr = document.querySelector('.ed-topbar-right');
      if (!tr) return;
      const w = window.innerWidth;
      if (w >= 769 && w <= 1400) {
        if (!tr.classList.contains('topbar-fixed')) {
          tr.classList.add('topbar-fixed');
          document.body.appendChild(tr);
        }
      } else {
        if (tr.classList.contains('topbar-fixed')) {
          tr.classList.remove('topbar-fixed');
          const topbar = document.querySelector('.col-header.ed-topbar');
          if (topbar && !topbar.querySelector('.ed-topbar-right')) topbar.appendChild(tr);
        }
      }
    });
  }, 400);
}

// ═══ 지도 모달 ═══
const LOCATIONS = {
  gio:    { addrMain: 'Mapo-gu, South Korea',  addrSub: '와우산로37길'    },
  soyeon: { addrMain: 'Shinjuku, Tokyo',        addrSub: '新宿区, 東京都' }
};

function openLocationModal(key) {
  const loc = LOCATIONS[key];
  if (!loc) return;
  document.getElementById('addrMain').textContent = loc.addrMain;
  document.getElementById('addrSub').textContent  = loc.addrSub;
  const mapContainer  = document.querySelector('.modal-map');
  const searchQuery   = encodeURIComponent(loc.addrSub + ' ' + loc.addrMain);
  mapContainer.innerHTML = `<iframe width="100%" height="100%" frameborder="0" style="border:0;"
    src="https://maps.google.com/maps?q=${searchQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed"></iframe>`;
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
  if (e.target === document.getElementById('modalOverlay')) closeLocationModal();
}

// ═══ 레거시 호환 (사용 안 함) ═══
function setupImageHover() {}
function setupTabletGestures() {}

// ═══ 앱 초기화 ═══
function init() {
  try {
    applyTabColor(activeTab);
    renderChk();
    renderRoutineRing();
    updateBookStats();
    updateWritingStats();
    showRandomQuote();
    updateExpenseCompact();
    setupAutoSave();
    setupEnterKey();
    setupSwipeActions();
    setupCopyHandler();
    setupImageHover();

    document.getElementById('edBody').addEventListener('paste',     handlePaste);
    document.getElementById('memo-body').addEventListener('paste',  handlePaste);

    // 플로팅 선택 툴바
    const checkSelWrapper = () => { clearTimeout(selectionTimeout); selectionTimeout = setTimeout(checkSelection, 50); };
    document.addEventListener('selectionchange', checkSelWrapper);
    document.getElementById('edBody').addEventListener('mouseup',   checkSelWrapper);
    document.getElementById('edBody').addEventListener('keyup',     e => { if (e.shiftKey) checkSelWrapper(); });
    document.getElementById('memo-body').addEventListener('mouseup', checkSelWrapper);
    document.getElementById('memo-body').addEventListener('keyup',  e => { if (e.shiftKey) checkSelWrapper(); });

    setupFloatingToolbar();
    setupEditorImageSelection();
    setupGesturesAndUI();       // 모바일 제스처
    setupListContextMenu();
    setupExpenseContextMenu();

    // 저장된 상태 복원
    _restoreCurIds();
    _restoreActiveTab();
    var restoredBookId = L('gb_curBookId');
    if (restoredBookId) curBookId = restoredBookId;
    var restoredMemoId = L('gb_curMemoId');
    if (restoredMemoId) curMemoId = restoredMemoId;

    // 초기 문서 로드 (저장된 탭 + 문서 우선, 없으면 첫 번째)
    var initialTab = activeTab && textTypes.includes(activeTab) ? activeTab : (textTypes[0] || 'navi');
    if (initialTab !== activeTab) activeTab = initialTab;
    var initialDocs = getDocs(initialTab);
    var savedId = curIds[initialTab];
    if (savedId && initialDocs.find(function(d) { return d.id === savedId; })) {
      loadDoc(initialTab, savedId, true);
    } else if (initialDocs.length) {
      loadDoc(initialTab, initialDocs[0].id, true);
    } else if (SYNC._dbLoading) {
      // loadDatabase 진행 중 — 빈 문서 생성하지 않고 에디터를 비워둔다
      // loadDatabase 완료 후 showApp의 뒤늦은 도착 핸들러에서 renderListPanel + loadDoc이 호출됨
      console.log('init: loadDatabase 진행 중이므로 빈 문서 생성 보류');
      document.getElementById('edTitle').value = '';
      document.getElementById('edBody').innerHTML = '';
    } else {
      var nd = newDoc(initialTab);
      loadDoc(initialTab, nd.id, true);
    }

    updateEdTabLabel();

    if (GAS_URL) SYNC.setSyncStatus('완료됨', 'ok');
    else         SYNC.setSyncStatus('로컬 전용', 'error');

    switchListView('list');
  } catch (e) {
    console.error('init error:', e);
    alert('초기화 오류: ' + e.message);
  }
}
