// ═══════════════════════════════════════
// app.js — 인증, 지도, init, showApp (앱 진입점)
// ═══════════════════════════════════════

// ═══ 인증 ═══
const GOOGLE_CLIENT_ID = '910366325974-3ollm3pose37r1fvv8ngnd0v09f2p57l.apps.googleusercontent.com';

function handleCredentialResponse(response) {
  try {
    const jwt = response.credential;
    localStorage.setItem('gb_auth',     '1');
    localStorage.setItem('gb_id_token', jwt);
    document.getElementById('lockScreen').classList.add('hidden');
    showApp();
  } catch (e) {
    document.getElementById('lockErr').textContent = '로그인 처리 중 오류가 발생했습니다.';
  }
}

window.onload = function() {
  const isLocal = location.hostname === '127.0.0.1' || location.hostname === 'localhost';
  if (isLocal || localStorage.getItem('gb_id_token')) {
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
  const loading = document.getElementById('loadingScreen');
  loading.classList.remove('hidden');
  SYNC.setSyncStatus('동기화 중', 'syncing');

  var serverConfig = null;
  try {
    serverConfig = await SYNC.loadDatabase();
  } catch (e) {
    if (e && e.message === 'Unauthorized') {
      // 인증 실패: 로컬 토큰 삭제 후 로그인 화면으로
      localStorage.removeItem('gb_auth');
      localStorage.removeItem('gb_id_token');
      loading.classList.add('hidden');
      document.getElementById('lockScreen').classList.remove('hidden');
      document.getElementById('lockErr').textContent = '접근 권한이 없는 계정입니다.';
      return;
    }
  }

  // 서버 config 적용 (사용자별 탭/루틴/카테고리)
  if (serverConfig) {
    applyServerConfig(serverConfig);
  }

  injectMockData();
  injectExpenseMockData();
  // 태블릿뷰: ed-topbar-right를 body로 이동하여 스와이프 영향 차단
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
    // 태블릿+PC 제스처는 앱이 표시된 후에 초기화
    setupTabletPCGestures();

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

    // 초기 문서 로드 (동적 첫 번째 텍스트 탭)
    var initialTab = textTypes[0] || 'navi';
    var initialDocs = getDocs(initialTab);
    if (initialDocs.length) loadDoc(initialTab, initialDocs[0].id, true);
    else { var nd = newDoc(initialTab); loadDoc(initialTab, nd.id, true); }

    updateEdTabLabel();

    if (GAS_URL) SYNC.setSyncStatus('완료됨', 'ok');
    else         SYNC.setSyncStatus('로컬 전용', 'error');

    switchListView('list');
  } catch (e) {
    console.error('init error:', e);
    alert('초기화 오류: ' + e.message);
  }
}
