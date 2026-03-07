// ═══════════════════════════════════════
// editor.js — 에디터 툴바, 서식, 복사/붙여넣기, 미디어, 이미지
// ═══════════════════════════════════════

// ═══ 툴바 ═══
function execCmd(cmd, val) {
  const target = activeTab === 'memo' ? document.getElementById('memo-body') : document.getElementById('edBody');
  target.focus();
  if (cmd === 'formatBlock' && val) document.execCommand(cmd, false, '<' + val + '>');
  else document.execCommand(cmd, false, val || null);
}

function insertChecklist() {
  const target = activeTab === 'memo' ? document.getElementById('memo-body') : document.getElementById('edBody');
  target.focus();
  document.execCommand('insertHTML', false, '<ul style="list-style:none;padding-left:0;"><li><input type="checkbox" style="margin-right:8px;transform:scale(1.2);"> </li></ul>');
}

function setupEnterKey() {
  document.querySelectorAll('.ed-title, .sf-input').forEach(input => {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const wrapper = e.target.closest('.editor-content-wrap');
        if (e.target.classList.contains('ed-title') || e.target.classList.contains('sf-input')) {
          const body = wrapper ? wrapper.querySelector('.ed-body') : null;
          if (body) body.focus();
        }
      }
    });
  });
}

// ═══ Aa 서식 메뉴 ═══
function toggleAaMenu(e) {
  e.stopPropagation();
  const edMenu = document.getElementById('editorDropdownMenu');
  const tabDD  = document.getElementById('edTabDropdown');
  const oldAa  = document.getElementById('aaDropdownMenu');
  if (edMenu)  edMenu.classList.remove('open');
  if (tabDD)   tabDD.classList.remove('open');
  if (oldAa)   oldAa.classList.remove('open');

  const overlay = document.getElementById('lpPopupOverlay');
  if (overlay && overlay.classList.contains('open')) { closeLpPopup(); return; }

  const menuEl = document.getElementById('lpPopupMenu');
  menuEl.innerHTML = `
    <div class="lp-popup-menu-item" onclick="aaPopupAction('h1')"><span>제목</span><div class="aa-h-icon">H<sub>1</sub></div></div>
    <div class="lp-popup-menu-item" onclick="aaPopupAction('h2')"><span>부제목</span><div class="aa-h-icon">H<sub>2</sub></div></div>
    <div class="lp-popup-menu-item" onclick="aaPopupAction('h3')"><span>소제목</span><div class="aa-h-icon">H<sub>3</sub></div></div>
    <div class="lp-popup-sep"></div>
    <div class="lp-popup-menu-item" onclick="aaPopupAction('ul')"><span>리스트</span><svg viewBox="0 0 24 24"><line x1="9" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="9" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg></div>
    <div class="lp-popup-menu-item" onclick="aaPopupAction('ol')"><span>번호</span><svg viewBox="0 0 24 24"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="2" y="9" font-size="8" font-family="sans-serif" stroke="none" fill="currentColor" font-weight="700">1.</text><text x="2" y="15" font-size="8" font-family="sans-serif" stroke="none" fill="currentColor" font-weight="700">2.</text><text x="2" y="21" font-size="8" font-family="sans-serif" stroke="none" fill="currentColor" font-weight="700">3.</text></svg></div>
    <div class="lp-popup-menu-item" onclick="aaPopupAction('check')"><span>체크박스</span><svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>
    <div class="lp-popup-sep"></div>
    <div class="lp-popup-menu-item" onclick="aaPopupAction('quote')"><span>인용</span><svg viewBox="0 0 24 24"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg></div>
    <div class="lp-popup-menu-item" onclick="aaPopupAction('hr')"><span>구분선</span><svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/></svg></div>`;

  const aaBtn = e.currentTarget || e.target.closest('.ed-aa-btn');
  const card  = document.getElementById('lpPopupCard');
  if (aaBtn && card) {
    const btnRect  = aaBtn.getBoundingClientRect();
    const isMobile = window.innerWidth <= 768;
    const cardW    = isMobile ? Math.min(260, window.innerWidth - 40) : Math.min(280, window.innerWidth - 32);
    let left = btnRect.right - cardW;
    if (left < 16) left = 16;
    if (left + cardW > window.innerWidth - 16) left = window.innerWidth - cardW - 16;
    let top = btnRect.bottom + 8;
    if (top + 200 > window.innerHeight - 16) top = btnRect.top - 200 - 8;
    if (top < 16) top = 16;
    card.style.left  = left + 'px';
    card.style.top   = top + 'px';
    card.style.width = cardW + 'px';
  }

  window._liftedOriginal = null;
  window._liftedClone    = null;
  contextItemId   = null;
  contextItemType = null;
  overlay.classList.add('open');
  requestAnimationFrame(() => { card.classList.add('open'); });
}

function aaPopupAction(type) {
  closeLpPopup();
  const target = activeTab === 'memo' ? document.getElementById('memo-body') : document.getElementById('edBody');
  target.focus();
  switch (type) {
    case 'h1':    document.execCommand('formatBlock', false, '<h1>'); break;
    case 'h2':    document.execCommand('formatBlock', false, '<h2>'); break;
    case 'h3':    document.execCommand('formatBlock', false, '<h3>'); break;
    case 'ul':    document.execCommand('insertUnorderedList'); break;
    case 'ol':    document.execCommand('insertOrderedList'); break;
    case 'check': insertChecklist(); break;
    case 'quote': document.execCommand('formatBlock', false, '<blockquote>'); break;
    case 'hr':    document.execCommand('insertHorizontalRule'); break;
  }
  updateWC();
  if (textTypes.includes(activeTab)) saveCurDoc(activeTab);
  else if (activeTab === 'memo') saveMemo();
}

function aaAction(type) {
  const menu   = document.getElementById('aaDropdownMenu');
  menu.classList.remove('open');
  const target = activeTab === 'memo' ? document.getElementById('memo-body') : document.getElementById('edBody');
  target.focus();
  switch (type) {
    case 'h1':    document.execCommand('formatBlock', false, '<h1>'); break;
    case 'h2':    document.execCommand('formatBlock', false, '<h2>'); break;
    case 'h3':    document.execCommand('formatBlock', false, '<h3>'); break;
    case 'ul':    document.execCommand('insertUnorderedList'); break;
    case 'ol':    document.execCommand('insertOrderedList'); break;
    case 'check': insertChecklist(); break;
    case 'quote': document.execCommand('formatBlock', false, '<blockquote>'); break;
    case 'hr':    document.execCommand('insertHorizontalRule'); break;
  }
  updateWC();
  if (textTypes.includes(activeTab)) saveCurDoc(activeTab);
  else if (activeTab === 'memo') saveMemo();
}

document.addEventListener('click', function(e) {
  const menu = document.getElementById('aaDropdownMenu');
  if (menu && menu.classList.contains('open')) {
    if (!e.target.closest('.ed-aa-btn') && !e.target.closest('.aa-menu')) {
      menu.classList.remove('open');
    }
  }
});

function toggleHeadingMenu() { document.getElementById('headingDropdown').classList.toggle('open'); }
function applyHeading(tag)   { document.getElementById('headingDropdown').classList.remove('open'); execCmd('formatBlock', tag); }

// ═══ 플로팅 툴바 ═══
let selectionTimeout = null;
let savedSelection   = null;

function saveSelection() {
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
    savedSelection = sel.getRangeAt(0).cloneRange();
  }
}

function restoreSelection() {
  if (!savedSelection) return;
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(savedSelection);
}

function checkSelection() {
  const sel = window.getSelection();
  const ft  = document.getElementById('floatingToolbar');
  if (!sel || sel.isCollapsed || sel.toString().trim() === '') { hideFloatingToolbar(); return; }
  const range   = sel.getRangeAt(0);
  const edBody  = document.getElementById('edBody');
  const memBody = document.getElementById('memo-body');
  const anc     = range.commonAncestorContainer;
  if (!(edBody && edBody.contains(anc)) && !(memBody && memBody.contains(anc))) { hideFloatingToolbar(); return; }
  const rect = range.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) { hideFloatingToolbar(); return; }

  saveSelection();
  ft.classList.add('show'); ft.style.display = 'flex';

  const tbW = ft.offsetWidth || 220, tbH = ft.offsetHeight || 38, margin = 8;
  let left = rect.left + rect.width / 2 - tbW / 2;
  let top  = rect.top - tbH - margin - 6;
  if (left < margin) left = margin;
  if (left + tbW > window.innerWidth - margin) left = window.innerWidth - tbW - margin;
  if (top < margin) top = rect.bottom + margin;
  ft.style.left = left + 'px';
  ft.style.top  = top + 'px';
  updateFtActiveStates();
}

function updateFtActiveStates() {
  const ft = document.getElementById('floatingToolbar');
  if (!ft) return;
  ft.querySelectorAll('.ft-btn').forEach(btn => {
    const cmd = btn.getAttribute('data-cmd');
    if (!cmd) return;
    let isActive = false;
    if (cmd === 'hiliteColor') {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        let node = sel.anchorNode;
        while (node && node !== document.body) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const bg = node.style && node.style.backgroundColor;
            if (bg && bg !== 'transparent' && bg !== '' && bg !== 'rgba(0, 0, 0, 0)') { isActive = true; break; }
          }
          node = node.parentNode;
        }
      }
    } else {
      isActive = document.queryCommandState(cmd);
    }
    btn.style.background = isActive ? 'rgba(255,255,255,.2)' : '';
    btn.style.color      = isActive ? '#fff' : '';
  });
}

function hideFloatingToolbar() {
  const ft = document.getElementById('floatingToolbar');
  if (ft) { ft.classList.remove('show'); ft.style.display = 'none'; }
}

function setupFloatingToolbar() {
  const ft = document.getElementById('floatingToolbar');
  if (!ft) return;
  ft.querySelectorAll('.ft-btn').forEach(btn => {
    btn.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); });
    btn.addEventListener('click', function(e) {
      e.preventDefault(); e.stopPropagation();
      const cmd = this.getAttribute('data-cmd');
      const val = this.getAttribute('data-val') || null;
      if (!cmd) return;
      restoreSelection();
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;
      const selectedText    = sel.toString();
      const edBody          = activeTab === 'memo' ? document.getElementById('memo-body') : document.getElementById('edBody');

      if (cmd === 'hiliteColor') {
        let hasHighlight = false;
        let node = sel.anchorNode;
        while (node && node !== edBody && node !== document.body) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const bg = node.style && node.style.backgroundColor;
            if (bg && bg !== 'transparent' && bg !== '' && bg !== 'rgba(0, 0, 0, 0)') { hasHighlight = true; break; }
          }
          node = node.parentNode;
        }
        document.execCommand('hiliteColor', false, hasHighlight ? 'transparent' : (val || '#fde68a'));
      } else {
        document.execCommand(cmd, false, val);
      }

      requestAnimationFrame(() => {
        const newSel = window.getSelection();
        if (!newSel || newSel.isCollapsed) {
          if (selectedText && edBody) {
            const tw = document.createTreeWalker(edBody, NodeFilter.SHOW_TEXT, null, false);
            let found = false;
            while (tw.nextNode()) {
              const tn  = tw.currentNode;
              const idx = tn.textContent.indexOf(selectedText);
              if (idx !== -1) {
                const nr = document.createRange();
                nr.setStart(tn, idx); nr.setEnd(tn, idx + selectedText.length);
                newSel.removeAllRanges(); newSel.addRange(nr);
                savedSelection = nr.cloneRange();
                found = true; break;
              }
            }
            if (!found) hideFloatingToolbar();
          }
        } else {
          savedSelection = newSel.getRangeAt(0).cloneRange();
        }
        updateFtActiveStates();
        updateWC();
        if (textTypes.includes(activeTab)) saveCurDoc(activeTab);
        else if (activeTab === 'memo') saveMemo();
      });
    });
  });
}

document.addEventListener('mousedown', e => {
  const hd = document.getElementById('headingDropdown'), hb = document.getElementById('headingBtn');
  if (hd && hd.classList.contains('open') && hb && !hb.contains(e.target) && !hd.contains(e.target)) {
    hd.classList.remove('open');
  }
  const ft  = document.getElementById('floatingToolbar');
  const eb  = document.getElementById('edBody');
  const mb  = document.getElementById('memo-body');
  if (ft && ft.classList.contains('show')) {
    if (!ft.contains(e.target) && !(eb && eb.contains(e.target)) && !(mb && mb.contains(e.target))) {
      hideFloatingToolbar();
    }
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') hideFloatingToolbar(); });

// ═══ 복사 핸들러 ═══
function setupCopyHandler() {
  document.addEventListener('copy', function(e) {
    const activeEl = document.activeElement;
    if (activeEl && activeEl.isContentEditable) {
      const selection = window.getSelection();
      if (selection.rangeCount > 0 && !selection.isCollapsed) {
        const range   = selection.getRangeAt(0);
        const tempDiv = document.createElement('div');
        tempDiv.appendChild(range.cloneContents());
        if (tempDiv.querySelector('img')) return;
        e.preventDefault();
        let text = '';
        function traverse(el) {
          if (el.nodeType === Node.TEXT_NODE) { text += el.nodeValue; }
          else if (el.nodeType === Node.ELEMENT_NODE) {
            const tag     = el.tagName.toLowerCase();
            const isBlock = ['div','p','h1','h2','h3','li','blockquote','ul','ol'].includes(tag);
            if (isBlock && text.length > 0 && !text.endsWith('\n')) text += '\n';
            if (tag === 'br') text += '\n';
            for (const child of el.childNodes) traverse(child);
            if (isBlock && text.length > 0 && !text.endsWith('\n')) text += '\n';
          }
        }
        traverse(tempDiv);
        text = text.replace(/\n{3,}/g, '\n\n').trim();
        e.clipboardData.setData('text/plain', text);
        e.clipboardData.setData('text/html',  text.replace(/\n/g, '<br>'));
      }
    }
  });
}

// ═══ 미디어 업로드 ═══
async function handleMediaUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    const attachHtml = `<div style="display:flex;align-items:center;gap:10px;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px 14px;margin:8px 0;font-size:14px;user-select:none;">📎 ${file.name}</div><br>`;
    execCmd('insertHTML', attachHtml);
    updateWC();
    if (textTypes.includes(activeTab)) saveCurDoc(activeTab); else saveMemo();
    e.target.value = ''; return;
  }
  const tempBlobUrl = URL.createObjectURL(file), mimeType = file.type;
  const filename    = 'img_' + Date.now() + (mimeType === 'image/png' ? '.png' : '.jpg');
  const tempId      = 'img_' + Date.now();
  const imgHtml     = `<img src="${tempBlobUrl}" id="${tempId}" alt="첨부이미지" style="box-sizing:border-box;border:3px solid var(--ac-light);transition:border-color 0.3s;opacity:1;">`;
  execCmd('insertHTML', imgHtml + '<br>');
  updateWC();
  if (textTypes.includes(activeTab)) saveCurDoc(activeTab); else saveMemo();
  const reader = new FileReader();
  reader.onload = async function(ev) {
    const base64Data = ev.target.result.split(',')[1];
    try {
      const res       = await SYNC.uploadImage(base64Data, filename, mimeType);
      const directUrl = `https://drive.google.com/thumbnail?id=${res.id}&sz=w1000`;
      const editor    = activeTab === 'memo' ? document.getElementById('memo-body') : document.getElementById('edBody');
      const imgEl     = editor.querySelector(`#${tempId}`);
      if (imgEl) { imgEl.src = directUrl; imgEl.style.border = '1px solid var(--border-l)'; imgEl.removeAttribute('id'); }
      if (textTypes.includes(activeTab)) saveCurDoc(activeTab); else saveMemo();
    } catch (err) {
      const editor = activeTab === 'memo' ? document.getElementById('memo-body') : document.getElementById('edBody');
      const imgEl  = editor.querySelector(`#${tempId}`);
      if (imgEl) { imgEl.style.border = '3px solid var(--red)'; imgEl.title = '업로드 실패'; imgEl.removeAttribute('id'); }
      if (textTypes.includes(activeTab)) saveCurDoc(activeTab); else saveMemo();
    }
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

// ═══ 붙여넣기 ═══
async function handlePaste(e) {
  const items = (e.clipboardData || e.originalEvent.clipboardData).items;
  let hasImage = false;
  for (const item of items) {
    if (item.type.indexOf('image/') === 0) {
      hasImage = true; e.preventDefault();
      const file        = item.getAsFile();
      const tempBlobUrl = URL.createObjectURL(file), mimeType = file.type;
      const filename    = 'img_' + Date.now() + (mimeType === 'image/png' ? '.png' : '.jpg');
      const tempId      = 'img_' + Date.now();
      const imgHtml     = `<img src="${tempBlobUrl}" id="${tempId}" alt="첨부이미지" style="box-sizing:border-box;border:3px solid var(--ac-light);transition:border-color 0.3s;opacity:1;">`;
      document.execCommand('insertHTML', false, imgHtml + '<br>');
      updateWC();
      if (textTypes.includes(activeTab)) saveCurDoc(activeTab); else saveMemo();
      const reader = new FileReader();
      reader.onload = async function(ev) {
        const base64Data = ev.target.result.split(',')[1];
        try {
          const res       = await SYNC.uploadImage(base64Data, filename, mimeType);
          const directUrl = `https://drive.google.com/thumbnail?id=${res.id}&sz=w1000`;
          const editor    = activeTab === 'memo' ? document.getElementById('memo-body') : document.getElementById('edBody');
          const imgEl     = editor.querySelector(`#${tempId}`);
          if (imgEl) { imgEl.src = directUrl; imgEl.style.border = '1px solid var(--border-l)'; imgEl.removeAttribute('id'); }
          if (textTypes.includes(activeTab)) saveCurDoc(activeTab); else saveMemo();
        } catch (err) {
          const editor = activeTab === 'memo' ? document.getElementById('memo-body') : document.getElementById('edBody');
          const imgEl  = editor.querySelector(`#${tempId}`);
          if (imgEl) { imgEl.style.border = '3px solid var(--red)'; imgEl.title = '업로드 실패'; imgEl.removeAttribute('id'); }
          if (textTypes.includes(activeTab)) saveCurDoc(activeTab); else saveMemo();
        }
      };
      reader.readAsDataURL(file);
      break;
    }
  }
  if (!hasImage) {
    e.preventDefault();
    const text = (e.clipboardData || e.originalEvent.clipboardData).getData('text/plain');
    if (text) {
      const trimmed = text.trim();
      if (/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(trimmed) ||
          /^https?:\/\/(images\.unsplash\.com|drive\.google\.com\/thumbnail)/i.test(trimmed)) {
        document.execCommand('insertHTML', false, `<img src="${trimmed}" alt="붙여넣기 이미지"><br>`);
      } else {
        const escaped = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        document.execCommand('insertHTML', false, escaped.replace(/\r\n/g,'<br>').replace(/\n/g,'<br>'));
      }
    }
    setTimeout(() => { if (textTypes.includes(activeTab)) saveCurDoc(activeTab); else saveMemo(); updateWC(); }, 100);
  }
}

// ═══ 이미지 컨텍스트 메뉴 + 선택 ═══
let imgCtxTarget = null;
let imgLpTimer   = null;
let imgLpMoved   = false;
let imgResizeStartX = 0, imgResizeStartY = 0;

function setupEditorImageSelection() {
  const edBodies = [document.getElementById('edBody'), document.getElementById('memo-body')];
  edBodies.forEach(body => {
    if (!body) return;
    body.addEventListener('click', function(e) {
      if (e.target.tagName === 'IMG' && e.target.closest('.ed-body')) {
        document.querySelectorAll('.ed-body img.img-selected').forEach(img => img.classList.remove('img-selected'));
        e.target.classList.add('img-selected');
        window.getSelection().removeAllRanges();
      }
    });
    body.addEventListener('contextmenu', function(e) {
      if (e.target.tagName === 'IMG' && e.target.closest('.ed-body')) {
        e.preventDefault(); e.stopPropagation();
        imgCtxTarget = e.target;
        document.querySelectorAll('.ed-body img.img-selected').forEach(img => img.classList.remove('img-selected'));
        e.target.classList.add('img-selected');
        showImgContextMenu(e.clientX, e.clientY);
      }
    });
    body.addEventListener('touchstart', function(e) {
      if (e.target.tagName !== 'IMG' || !e.target.closest('.ed-body')) return;
      imgLpMoved = false;
      const tx = e.touches[0].clientX, ty = e.touches[0].clientY;
      imgResizeStartX = tx; imgResizeStartY = ty;
      clearTimeout(imgLpTimer);
      imgLpTimer = setTimeout(function() {
        if (!imgLpMoved) {
          e.preventDefault();
          imgCtxTarget = e.target;
          document.querySelectorAll('.ed-body img.img-selected').forEach(img => img.classList.remove('img-selected'));
          e.target.classList.add('img-selected');
          if (navigator.vibrate) navigator.vibrate(15);
          showImgContextMenu(tx, ty);
        }
      }, 500);
    }, { passive: false });
    body.addEventListener('touchmove', function(e) {
      if (imgLpTimer) {
        const t = e.touches[0];
        if (Math.abs(t.clientX - imgResizeStartX) > 8 || Math.abs(t.clientY - imgResizeStartY) > 8) {
          imgLpMoved = true; clearTimeout(imgLpTimer);
        }
      }
    }, { passive: true });
    body.addEventListener('touchend', function() { clearTimeout(imgLpTimer); }, { passive: true });
  });

  document.addEventListener('click', function(e) {
    if (e.target.closest('#imgContextMenu')) return;
    if (!e.target.closest('.ed-body') || e.target.tagName !== 'IMG') {
      document.querySelectorAll('.ed-body img.img-selected').forEach(img => img.classList.remove('img-selected'));
    }
    hideImgContextMenu();
  });
  document.querySelectorAll('.editor-scroll-area').forEach(area => {
    area.addEventListener('scroll', hideImgContextMenu);
  });
}

function showImgContextMenu(x, y) {
  const menu = document.getElementById('imgContextMenu');
  menu.style.left = Math.min(x, window.innerWidth  - 200) + 'px';
  menu.style.top  = Math.min(y, window.innerHeight - 160) + 'px';
  menu.classList.add('open');
}

function hideImgContextMenu() {
  const menu = document.getElementById('imgContextMenu');
  if (menu) menu.classList.remove('open');
}

async function imgCtxAction(action) {
  hideImgContextMenu();
  if (!imgCtxTarget) return;
  if (action === 'copy') {
    try {
      const src = imgCtxTarget.src;
      if (src.startsWith('data:')) {
        const res = await fetch(src); const blob = await res.blob();
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      } else {
        try {
          const res = await fetch(src); const blob = await res.blob();
          await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        } catch { await navigator.clipboard.writeText(src); }
      }
    } catch { try { await navigator.clipboard.writeText(imgCtxTarget.src); } catch {} }
    imgCtxTarget = null; return;
  }
  if (action === 'delete') {
    imgCtxTarget.remove();
    hideResizeHandle();
    updateWC();
    if (textTypes.includes(activeTab)) saveCurDoc(activeTab); else saveMemo();
    imgCtxTarget = null; return;
  }
}

// ═══ 자동 저장 ═══
let _at = null;
function setupAutoSave() {
  const showSaving  = () => { if (document.getElementById('edSaveStatus')) document.getElementById('edSaveStatus').textContent = '저장 중...'; };
  const showSaved   = () => { if (document.getElementById('edSaveStatus')) document.getElementById('edSaveStatus').textContent = '저장됨'; };
  const saveLocalOnly = () => {
    if (textTypes.includes(activeTab))  { saveCurDoc(activeTab); showSaved(); }
    else if (activeTab === 'memo')  { saveMemo();  showSaved(); }
    else if (activeTab === 'book')  { saveBook();  showSaved(); }
    else if (activeTab === 'quote') { saveQuote(); showSaved(); }
  };
  const doSaveAndSync = () => {
    saveLocalOnly();
    SYNC.scheduleDatabaseSave();
    if (textTypes.includes(activeTab)) SYNC.scheduleDocSave(activeTab);
    else if (activeTab === 'memo') SYNC.scheduleDocSave('memo');
  };
  const onInput = () => { showSaving(); clearTimeout(_at); _at = setTimeout(doSaveAndSync, 800); updateWC(); };
  const ids = ['edBody','edTitle','memo-body','memo-title','book-title','book-author','book-publisher','book-pages','book-body','quote-by','quote-body'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', onInput);
      el.addEventListener('blur', () => { setTimeout(() => { saveLocalOnly(); }, 200); });
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { clearTimeout(_at); saveLocalOnly(); SYNC.syncAll(); }
  });
}

// hideResizeHandle — 이미지 리사이즈 핸들이 없으면 빈 함수
function hideResizeHandle() {
  const h = document.getElementById('imgResizeHandle');
  if (h) h.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('floatingToolbar')) setupFloatingToolbar();
});

// ═══════════════════════════════════════
// 가계부 폼 로직
// ═══════════════════════════════════════

let curExpenseId = null;

function newExpenseForm() {
  curExpenseId = null;
  document.getElementById('expenseAmountInput').value = '';
  document.getElementById('expenseMerchantInput').value = '';
  document.getElementById('expenseCardInput').value = '';
  document.getElementById('expenseMemoInput').value = '';
  const now = new Date();
  document.getElementById('expenseDateValue').textContent = formatExpenseDate(now);
  clearCategorySelection();
  updateExpenseSaveBtn();
}

function loadExpense(id) {
  const e = getExpenses().find(x => x.id === id);
  if (!e) return;
  curExpenseId = id;
  document.getElementById('expenseAmountInput').value = e.amount.toLocaleString();
  document.getElementById('expenseMerchantInput').value = e.merchant;
  document.getElementById('expenseCardInput').value = e.card;
  document.getElementById('expenseMemoInput').value = e.memo;
  const d = new Date(e.date + 'T' + (e.time || '00:00'));
  document.getElementById('expenseDateValue').textContent = formatExpenseDate(d);
  selectCategory(e.category);
  updateExpenseSaveBtn();
}

function formatExpenseAmount(input) {
  let val = input.value.replace(/[^\d]/g, '');
  if (val) input.value = parseInt(val).toLocaleString();
  else input.value = '';
  updateExpenseSaveBtn();
}

function renderExpenseCategoryGrid() {
  const grid = document.getElementById('expenseCategoryGrid');
  grid.innerHTML = EXPENSE_CATEGORIES.map(c =>
    `<button class="expense-cat-btn" data-cat="${c.id}" onclick="selectCategory('${c.id}')">
      <span class="expense-cat-name">${c.name}</span>
    </button>`
  ).join('');
}

function selectCategory(catId) {
  document.querySelectorAll('.expense-cat-btn').forEach(btn => {
    const isSelected = btn.getAttribute('data-cat') === catId;
    btn.classList.toggle('selected', isSelected);
    if (isSelected) {
      const cat = EXPENSE_CATEGORIES.find(c => c.id === catId);
      if (cat) btn.style.borderColor = cat.color;
    } else {
      btn.style.borderColor = '';
    }
  });
}

function getSelectedCategory() {
  const sel = document.querySelector('.expense-cat-btn.selected');
  return sel ? sel.getAttribute('data-cat') : 'etc';
}

function clearCategorySelection() {
  document.querySelectorAll('.expense-cat-btn').forEach(btn => {
    btn.classList.remove('selected');
    btn.style.borderColor = '';
  });
}

function formatExpenseDate(d) {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${m}월 ${day}일 ${h}:${min}`;
}

function parseExpenseDateText(text) {
  const match = text.match(/(\d+)월\s*(\d+)일\s*(\d+):(\d+)/);
  if (!match) return { date: today(), time: '' };
  const y = new Date().getFullYear();
  const m = match[1].padStart(2, '0');
  const d = match[2].padStart(2, '0');
  return { date: `${y}-${m}-${d}`, time: `${match[3].padStart(2, '0')}:${match[4]}` };
}

function updateExpenseSaveBtn() {
  const val = document.getElementById('expenseAmountInput').value.replace(/,/g, '');
  const btn = document.getElementById('expenseSaveBtn');
  if (btn) {
    const hasAmount = parseInt(val) > 0;
    btn.disabled = !hasAmount;
    btn.style.opacity = hasAmount ? '1' : '0.4';
  }
}

function setExpenseType(type) {
  document.querySelectorAll('.expense-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-type') === type);
  });
}

function openExpenseDatePicker() {
  // TODO: 날짜 선택 모달 (현재는 간단히 일반 input date 사용 가능)
  alert('날짜 선택 기능은 추후 구현됩니다.');
}

async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    if (!text || !text.trim()) {
      alert('클립보드가 비어있습니다.');
      return;
    }
    const parsed = parseSMS(text);
    if (!parsed) {
      alert('카드 문자 형식을 인식할 수 없습니다.\n직접 입력해주세요.');
      return;
    }
    document.getElementById('expenseAmountInput').value = parsed.amount.toLocaleString();
    document.getElementById('expenseMerchantInput').value = parsed.merchant;
    document.getElementById('expenseCardInput').value = parsed.card;
    if (parsed.date) {
      const d = new Date(parsed.date + 'T' + (parsed.time || '00:00'));
      document.getElementById('expenseDateValue').textContent = formatExpenseDate(d);
    }
    selectCategory(parsed.category);
    updateExpenseSaveBtn();
    document.getElementById('expenseAmountInput').focus();
  } catch (err) {
    alert('클립보드를 읽을 수 없습니다.\n브라우저 설정에서 권한을 허용해주세요.');
  }
}

function saveExpenseForm() {
  const amountStr = document.getElementById('expenseAmountInput').value.replace(/,/g, '');
  const amount = parseInt(amountStr);
  if (!amount || amount <= 0) return;

  const merchant = document.getElementById('expenseMerchantInput').value.trim();
  const card = document.getElementById('expenseCardInput').value.trim();
  const memo = document.getElementById('expenseMemoInput').value.trim();
  const category = getSelectedCategory();
  const dateText = document.getElementById('expenseDateValue').textContent;
  const { date, time } = parseExpenseDateText(dateText);

  if (curExpenseId) {
    updateExpense(curExpenseId, { amount, category, merchant, card, memo, date, time });
  } else {
    newExpense({ amount, category, merchant, card, memo, date, time, source: 'manual' });
  }

  renderExpenseDashboard();
  updateExpenseCompact();
  SYNC.scheduleDatabaseSave();

  if (window.innerWidth <= 768) {
    setMobileView('list');
  } else {
    newExpenseForm();
  }
}
