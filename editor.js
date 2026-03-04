// ═══════════════════════════════════════
// editor.js — 에디터 툴바, 복사/붙여넣기, 미디어, 제스처 (v5)
// ═══════════════════════════════════════

// ═══ 툴바 ═══
function execCmd(cmd, val) {
  const target = activeTab==='memo' ? document.getElementById('memo-body') : document.getElementById('edBody');
  target.focus();
  if(cmd==='formatBlock' && val) document.execCommand(cmd, false, '<'+val+'>');
  else document.execCommand(cmd, false, val||null);
}

function insertChecklist() {
  const target = activeTab==='memo' ? document.getElementById('memo-body') : document.getElementById('edBody');
  target.focus();
  document.execCommand('insertHTML', false, '<ul style="list-style:none;padding-left:0;"><li><input type="checkbox" style="margin-right:8px;transform:scale(1.2);"> </li></ul>');
}

function setupEnterKey() {
  document.querySelectorAll('.ed-title, .sf-input').forEach(input => {
    input.addEventListener('keydown', e => {
      if(e.key==='Enter') {
        e.preventDefault();
        const wrapper = e.target.closest('.editor-content-wrap');
        if(e.target.classList.contains('ed-title') || e.target.classList.contains('sf-input')) {
          const body = wrapper.querySelector('.ed-body');
          if(body) body.focus();
        }
      }
    });
  });
}

function toggleHeadingMenu() { document.getElementById('headingDropdown').classList.toggle('open'); }
function applyHeading(tag)   { document.getElementById('headingDropdown').classList.remove('open'); execCmd('formatBlock', tag); }

// ═══ 플로팅 툴바 ═══
let selectionTimeout = null;
let savedSelection = null;

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
  const sel = window.getSelection(), ft = document.getElementById('floatingToolbar');
  if (!sel || sel.isCollapsed || sel.toString().trim() === '') { hideFloatingToolbar(); return; }

  // 선택이 에디터 내부인지 확인
  const range = sel.getRangeAt(0);
  const edBody = document.getElementById('edBody');
  const memoBody = document.getElementById('memo-body');
  const ancestor = range.commonAncestorContainer;
  if (!(edBody && edBody.contains(ancestor)) && !(memoBody && memoBody.contains(ancestor))) {
    hideFloatingToolbar(); return;
  }

  const rect = range.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) { hideFloatingToolbar(); return; }

  saveSelection();
  ft.classList.add('show'); ft.style.display = 'flex';

  const tbW = ft.offsetWidth || 220, tbH = ft.offsetHeight || 38, margin = 8;
  let left = rect.left + rect.width / 2 - tbW / 2;
  let top = rect.top - tbH - margin - 6;
  if (left < margin) left = margin;
  if (left + tbW > window.innerWidth - margin) left = window.innerWidth - tbW - margin;
  if (top < margin) top = rect.bottom + margin;
  ft.style.left = left + 'px'; ft.style.top = top + 'px';

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
            if (bg && bg !== 'transparent' && bg !== '' && bg !== 'rgba(0, 0, 0, 0)') {
              isActive = true;
              break;
            }
          }
          node = node.parentNode;
        }
      }
    } else {
      isActive = document.queryCommandState(cmd);
    }
    btn.style.background = isActive ? 'rgba(255,255,255,.2)' : '';
    btn.style.color = isActive ? '#fff' : '';
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
    // mousedown에서 preventDefault → 텍스트 선택 유지
    btn.addEventListener('mousedown', function(e) {
      e.preventDefault();
      e.stopPropagation();
    });

    // click에서 서식 적용
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();

      const cmd = this.getAttribute('data-cmd');
      const val = this.getAttribute('data-val') || null;
      if (!cmd) return;

      // 선택 영역 복원
      restoreSelection();

      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;

      // 선택된 텍스트 기억 (DOM 변경 후 재선택용)
      const selectedText = sel.toString();
      const range = sel.getRangeAt(0);
      const startContainer = range.startContainer;
      const edBody = activeTab === 'memo' ? document.getElementById('memo-body') : document.getElementById('edBody');

      if (cmd === 'hiliteColor') {
        // 형광펜 토글: 선택 영역 내 형광펜 적용 여부 직접 확인
        let hasHighlight = false;
        let node = sel.anchorNode;
        while (node && node !== edBody && node !== document.body) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const bg = node.style && node.style.backgroundColor;
            if (bg && bg !== 'transparent' && bg !== '' && bg !== 'rgba(0, 0, 0, 0)') {
              hasHighlight = true;
              break;
            }
          }
          node = node.parentNode;
        }
        if (hasHighlight) {
          document.execCommand('hiliteColor', false, 'transparent');
        } else {
          document.execCommand('hiliteColor', false, val || '#fde68a');
        }
      } else {
        document.execCommand(cmd, false, val);
      }

      // 서식 적용 후 선택 영역 복원
      requestAnimationFrame(() => {
        const newSel = window.getSelection();
        if (!newSel || newSel.isCollapsed) {
          // DOM 변경으로 선택이 풀린 경우: 텍스트로 재탐색
          if (selectedText && edBody) {
            const treeWalker = document.createTreeWalker(edBody, NodeFilter.SHOW_TEXT, null, false);
            let found = false;
            while (treeWalker.nextNode()) {
              const textNode = treeWalker.currentNode;
              const idx = textNode.textContent.indexOf(selectedText);
              if (idx !== -1) {
                const newRange = document.createRange();
                newRange.setStart(textNode, idx);
                newRange.setEnd(textNode, idx + selectedText.length);
                newSel.removeAllRanges();
                newSel.addRange(newRange);
                savedSelection = newRange.cloneRange();
                found = true;
                break;
              }
            }
            if (!found) {
              // 못 찾으면 툴바 숨김
              hideFloatingToolbar();
            }
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
  const hd=document.getElementById('headingDropdown'), hb=document.getElementById('headingBtn');
  if(hd&&hd.classList.contains('open')) { if(hb&&!hb.contains(e.target)&&!hd.contains(e.target)) hd.classList.remove('open'); }
  const ft=document.getElementById('floatingToolbar'), eb=document.getElementById('edBody'), mb=document.getElementById('memo-body');
  if(ft&&ft.classList.contains('show')) { if(!ft.contains(e.target)&&!(eb&&eb.contains(e.target))&&!(mb&&mb.contains(e.target))) hideFloatingToolbar(); }
});
document.addEventListener('keydown', e => { if(e.key==='Escape') hideFloatingToolbar(); });

// ═══ 복사 핸들러 ═══
function setupCopyHandler() {
  document.addEventListener('copy', function(e) {
    const activeEl = document.activeElement;
    if(activeEl && activeEl.isContentEditable) {
      const selection = window.getSelection();
      if(selection.rangeCount>0 && !selection.isCollapsed) {
        const range=selection.getRangeAt(0), tempDiv=document.createElement('div');
        tempDiv.appendChild(range.cloneContents());
        if(tempDiv.querySelector('img')) return;
        e.preventDefault();
        let text='';
        function traverse(el) {
          if(el.nodeType===Node.TEXT_NODE) { text+=el.nodeValue; }
          else if(el.nodeType===Node.ELEMENT_NODE) {
            const tag=el.tagName.toLowerCase();
            const isBlock=['div','p','h1','h2','h3','li','blockquote','ul','ol'].includes(tag);
            if(isBlock && text.length>0 && !text.endsWith('\n')) text+='\n';
            if(tag==='br') text+='\n';
            for(let child of el.childNodes) traverse(child);
            if(isBlock && text.length>0 && !text.endsWith('\n')) text+='\n';
          }
        }
        traverse(tempDiv);
        text = text.replace(/\n{3,}/g,'\n\n').trim();
        e.clipboardData.setData('text/plain', text);
        e.clipboardData.setData('text/html', text.replace(/\n/g,'<br>'));
      }
    }
  });
}

// ═══ 미디어 업로드 ═══
async function handleMediaUpload(e) {
  const file=e.target.files[0]; if(!file) return;
  const isImage = file.type.startsWith('image/');
  if(!isImage) {
    const attachHtml=`<div style="display:flex;align-items:center;gap:10px;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px 14px;margin:8px 0;font-size:14px;user-select:none;">📎 ${file.name}</div><br>`;
    execCmd('insertHTML', attachHtml); updateWC();
    if(textTypes.includes(activeTab)) saveCurDoc(activeTab); else saveMemo();
    e.target.value=''; return;
  }
  const tempBlobUrl=URL.createObjectURL(file), mimeType=file.type;
  const filename='img_'+Date.now()+(mimeType==='image/png'?'.png':'.jpg');
  const tempId='img_'+Date.now();
  const imgHtml=`<img src="${tempBlobUrl}" id="${tempId}" alt="첨부이미지" style="box-sizing:border-box;border:3px solid var(--ac-light);transition:border-color 0.3s;opacity:1;">`;
  execCmd('insertHTML', imgHtml+'<br>'); updateWC();
  if(textTypes.includes(activeTab)) saveCurDoc(activeTab); else saveMemo();
  const reader=new FileReader();
  reader.onload = async function(ev) {
    const base64Data=ev.target.result.split(',')[1];
    try {
      const res=await SYNC.uploadImage(base64Data, filename, mimeType);
      const directUrl=`https://drive.google.com/thumbnail?id=${res.id}&sz=w1000`;
      const editor=activeTab==='memo'?document.getElementById('memo-body'):document.getElementById('edBody');
      const imgEl=editor.querySelector(`#${tempId}`);
      if(imgEl){imgEl.src=directUrl;imgEl.style.border='1px solid var(--border-l)';imgEl.removeAttribute('id');}
      if(textTypes.includes(activeTab)) saveCurDoc(activeTab); else saveMemo();
    } catch(err) {
      const editor=activeTab==='memo'?document.getElementById('memo-body'):document.getElementById('edBody');
      const imgEl=editor.querySelector(`#${tempId}`);
      if(imgEl){imgEl.style.border='3px solid var(--red)';imgEl.title='업로드 실패';imgEl.removeAttribute('id');}
      if(textTypes.includes(activeTab)) saveCurDoc(activeTab); else saveMemo();
    }
  };
  reader.readAsDataURL(file); e.target.value='';
}

// ═══ 붙여넣기 ═══
async function handlePaste(e) {
  const items=(e.clipboardData||e.originalEvent.clipboardData).items;
  let hasImage=false;
  for(let item of items) {
    if(item.type.indexOf('image/')===0) {
      hasImage=true; e.preventDefault();
      const file=item.getAsFile(), tempBlobUrl=URL.createObjectURL(file), mimeType=file.type;
      const filename='img_'+Date.now()+(mimeType==='image/png'?'.png':'.jpg'), tempId='img_'+Date.now();
      const imgHtml=`<img src="${tempBlobUrl}" id="${tempId}" alt="첨부이미지" style="box-sizing:border-box;border:3px solid var(--ac-light);transition:border-color 0.3s;opacity:1;">`;
      document.execCommand('insertHTML', false, imgHtml+'<br>'); updateWC();
      if(textTypes.includes(activeTab)) saveCurDoc(activeTab); else saveMemo();
      const reader=new FileReader();
      reader.onload=async function(ev){
        const base64Data=ev.target.result.split(',')[1];
        try{
          const res=await SYNC.uploadImage(base64Data,filename,mimeType);
          const directUrl=`https://drive.google.com/thumbnail?id=${res.id}&sz=w1000`;
          const editor=activeTab==='memo'?document.getElementById('memo-body'):document.getElementById('edBody');
          const imgEl=editor.querySelector(`#${tempId}`);
          if(imgEl){imgEl.src=directUrl;imgEl.style.border='1px solid var(--border-l)';imgEl.removeAttribute('id');}
          if(textTypes.includes(activeTab))saveCurDoc(activeTab);else saveMemo();
        }catch(err){
          const editor=activeTab==='memo'?document.getElementById('memo-body'):document.getElementById('edBody');
          const imgEl=editor.querySelector(`#${tempId}`);
          if(imgEl){imgEl.style.border='3px solid var(--red)';imgEl.title='업로드 실패';imgEl.removeAttribute('id');}
          if(textTypes.includes(activeTab))saveCurDoc(activeTab);else saveMemo();
        }
      };
      reader.readAsDataURL(file); break;
    }
  }
 if(!hasImage) {
    e.preventDefault();
    const text=(e.clipboardData||e.originalEvent.clipboardData).getData('text/plain');
    if(text) {
      // URL이 이미지 확장자이거나 이미지 호스팅 URL이면 이미지로 삽입
      const trimmed=text.trim();
      if(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(trimmed) || /^https?:\/\/(images\.unsplash\.com|drive\.google\.com\/thumbnail)/i.test(trimmed)) {
        document.execCommand('insertHTML', false, '<img src="'+trimmed+'" alt="붙여넣기 이미지"><br>');
      } else {
        const escapedText=text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        document.execCommand('insertHTML', false, escapedText.replace(/\r\n/g,'<br>').replace(/\n/g,'<br>'));
      }
    }
    setTimeout(()=>{if(textTypes.includes(activeTab))saveCurDoc(activeTab);else saveMemo();updateWC();},100);
  }
}

// ═══ 이미지 클릭 선택 — v5: 파란 하이라이트 제거, 탭 고유색 테두리 ═══
function setupEditorImageSelection() {
  const onImageClick = function(e) {
    // 이전 선택 모두 해제
    document.querySelectorAll('.ed-body img.img-selected').forEach(img => img.classList.remove('img-selected'));

    if (e.target.tagName === 'IMG' && e.target.closest('.ed-body')) {
      e.target.classList.add('img-selected');
      // 파란 하이라이트 방지
      window.getSelection().removeAllRanges();
    }
  };
  document.getElementById('edBody').addEventListener('click', onImageClick);
  document.getElementById('memo-body').addEventListener('click', onImageClick);

  // 이미지 외 영역 클릭 시 선택 해제
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.ed-body') || (e.target.tagName !== 'IMG' && !e.target.closest('.img-actions') && !e.target.closest('#imgHoverBtn') && !e.target.closest('#imgDropdownMenu'))) {
      document.querySelectorAll('.ed-body img.img-selected').forEach(img => img.classList.remove('img-selected'));
    }
  });
}

// ═══ 자동 저장 ═══
let _at = null;
function setupAutoSave() {
  const showSaving = () => { if(document.getElementById('edSaveStatus')) document.getElementById('edSaveStatus').textContent='저장 중...'; };
  const showSaved  = () => { if(document.getElementById('edSaveStatus')) document.getElementById('edSaveStatus').textContent='저장됨'; };
  const saveLocalOnly = () => {
    if(textTypes.includes(activeTab)){saveCurDoc(activeTab);showSaved();}
    else if(activeTab==='memo'){saveMemo();showSaved();}
    else if(activeTab==='book'){saveBook();showSaved();}
    else if(activeTab==='quote'){saveQuote();showSaved();}
  };
  const doSaveAndSync = () => {
    saveLocalOnly(); SYNC.scheduleDatabaseSave();
    if(textTypes.includes(activeTab)) SYNC.scheduleDocSave(activeTab);
    else if(activeTab==='memo') SYNC.scheduleDocSave('memo');
  };
  const onInput = () => { showSaving(); clearTimeout(_at); _at=setTimeout(doSaveAndSync,800); updateWC(); };
  const els=['edBody','edTitle','memo-body','memo-title','book-title','book-author','book-publisher','book-pages','book-body','quote-by','quote-body'];
  els.forEach(id => {
    const el=document.getElementById(id);
    if(el) {
      el.addEventListener('input', onInput);
      el.addEventListener('blur', () => { setTimeout(() => { saveLocalOnly(); }, 200); });
    }
  });
  document.addEventListener('visibilitychange', () => { if(document.visibilityState==='hidden'){clearTimeout(_at);saveLocalOnly();SYNC.syncAll();} });
}

// ═══ 모바일 제스처 ═══
function setupTabletGestures() {
  // 빈 함수 — 실제 등록은 showApp에서 인라인으로 수행
}

function setupGesturesAndUI() {
  var app=document.getElementById('mainApp');
  var editorEl=document.querySelector('.editor');
  var listEl=document.querySelector('.list-panel');
  var sideEl=document.querySelector('.side');
  var allEls=[editorEl,listEl,sideEl];
  window._itemSwiping=false;

  var startX=0,startY=0,swiping=false,swipeDir=null,decided=false,startState=null;

  function getState(){
    if(app.classList.contains('view-side')) return 'side';
    if(app.classList.contains('view-editor')) return 'editor';
    return 'list';
  }
  function cleanStyles(){
    allEls.forEach(function(el){if(el){el.style.transition='';el.style.transform='';el.style.opacity='';}});
  }
  function animateBack(){
    allEls.forEach(function(el){if(el){el.style.transition='transform .25s ease, opacity .25s';el.style.transform='';el.style.opacity='';}});
    setTimeout(cleanStyles,280);
  }

  document.addEventListener('touchstart',function(e){
    if(window.innerWidth>768) return;
    if(e.touches.length!==1) return;
    if(window._itemSwiping) return;
    var t=e.target;
    if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='SELECT')) return;
    startX=e.touches[0].clientX;
    startY=e.touches[0].clientY;
    swiping=false;swipeDir=null;decided=false;
    startState=getState();
  },{capture:true,passive:true});

  document.addEventListener('touchmove',function(e){
    if(window.innerWidth>768) return;
    if(startState===null) return;
    if(window._itemSwiping){startState=null;return;}
    if(e.touches.length!==1) return;
    var cx=e.touches[0].clientX,cy=e.touches[0].clientY;
    var dx=cx-startX,dy=cy-startY;

    if(!decided){
      if(Math.abs(dx)<8&&Math.abs(dy)<8) return;
      decided=true;
      if(Math.abs(dy)>Math.abs(dx)){startState=null;return;}
      swipeDir=dx>0?'right':'left';
      // 유효 방향만
      if(startState==='list'&&swipeDir==='left'){startState=null;return;}
      if(startState==='side'&&swipeDir==='right'){startState=null;return;}
      if(startState==='editor'&&swipeDir==='left'){startState=null;return;}
      swiping=true;
      if(e.cancelable) e.preventDefault();
      allEls.forEach(function(el){if(el){el.style.transition='none';}});
    }
    if(!swiping) return;
    if(e.cancelable) e.preventDefault();

    var vw=window.innerWidth;
    var sideW=sideEl?Math.min(sideEl.offsetWidth,vw*0.82):(vw*0.75);

    if(startState==='side'&&swipeDir==='left'){
      var move=Math.max(-sideW,Math.min(0,dx));
      if(sideEl) sideEl.style.transform='translate3d('+move+'px,0,0)';
      if(listEl){listEl.style.transform='translate3d('+Math.max(0,sideW+dx)+'px,0,0)';listEl.style.opacity=String(Math.min(1,0.5+Math.abs(dx)/sideW*0.5));}
    } else if(startState==='list'&&swipeDir==='right'){
      var move2=Math.max(0,Math.min(dx,sideW));
      if(sideEl) sideEl.style.transform='translate3d('+(-sideW+move2)+'px,0,0)';
      if(listEl){listEl.style.transform='translate3d('+move2+'px,0,0)';listEl.style.opacity=String(Math.max(0.5,1-move2/vw*0.5));}
    } else if(startState==='editor'&&swipeDir==='right'){
      var move3=Math.max(0,Math.min(dx,vw));
      if(editorEl) editorEl.style.transform='translate3d('+move3+'px,0,0)';
      if(listEl){listEl.style.transform='translate3d('+(-vw*0.3+move3*0.3)+'px,0,0)';listEl.style.opacity=String(Math.min(1,0.6+move3/vw*0.4));}
    }
  },{capture:true,passive:false});

  document.addEventListener('touchend',function(e){
    if(window.innerWidth>768) return;
    if(!swiping||startState===null){startState=null;decided=false;return;}
    var dx=e.changedTouches[0].clientX-startX;
    var savedState=startState;
    swiping=false;swipeDir=null;decided=false;startState=null;

    var vw=window.innerWidth;
    var minSwipe=Math.max(80,vw*0.25);
    var didSwipe=false;

    if(savedState==='side'&&dx<-minSwipe) didSwipe=true;
    else if(savedState==='list'&&dx>minSwipe) didSwipe=true;
    else if(savedState==='editor'&&dx>minSwipe) didSwipe=true;

    if(didSwipe){
      if(savedState==='list') app.classList.add('view-side');
      else if(savedState==='side') app.classList.remove('view-side');
      cleanStyles();
      if(savedState==='editor') handleDone();
    } else {
      animateBack();
    }
  },{capture:true,passive:true});

  document.addEventListener('touchcancel',function(){
    if(swiping) animateBack();
    startState=null;decided=false;swiping=false;
  },{capture:true,passive:true});
}





function setupSwipeActions() {
  const listEl=document.getElementById('pane-list'); if(!listEl)return;
  let startX=0,startY=0,currentItem=null,swiping=false,dx=0;
  const THRESHOLD=60;

  // body에 고정 오버레이 생성
  let overlay=document.getElementById('swipeOverlay');
  if(!overlay){
    overlay=document.createElement('div');
    overlay.id='swipeOverlay';
    overlay.style.cssText='position:fixed;display:none;flex-direction:row;z-index:9999;pointer-events:auto;';
    document.body.appendChild(overlay);
  }

  function showOverlay(item){
    const actions=item.querySelector('.swipe-actions');
    if(!actions)return;
    const rect=item.getBoundingClientRect();
    const listPanel=item.closest('.list-panel');
    const listRect=listPanel?listPanel.getBoundingClientRect():{right:window.innerWidth};
    // innerHTML 대신 직접 생성하여 onclick 확실히 복사
    overlay.innerHTML='';
    const origBtns=actions.querySelectorAll('.swipe-action');
    origBtns.forEach(btn=>{
      const clone=btn.cloneNode(true);
      const handler=btn.getAttribute('onclick');
      if(handler){
        clone.setAttribute('onclick',handler);
        clone.addEventListener('click',function(e){e.stopPropagation();});
      }
      overlay.appendChild(clone);
    });
    overlay.style.display='flex';
    overlay.style.top=rect.top+'px';
    overlay.style.height=Math.max(rect.height,50)+'px';
    overlay.style.right=(window.innerWidth-listRect.right)+'px';
    overlay.style.width='160px';
    overlay.style.flexDirection='row';
  }

  function hideOverlay(){
    overlay.style.display='none';
    overlay.innerHTML='';
  }

  // 터치+포인터 모두 지원 (태블릿 키보드+트랙패드 대응)
  listEl.addEventListener('touchstart',e=>{
    const item=e.target.closest('.lp-item'); if(!item)return;
    if(currentItem&&currentItem!==item){currentItem.style.transform='';currentItem.classList.remove('swiped');hideOverlay();}
    currentItem=item; startX=e.touches[0].clientX; startY=e.touches[0].clientY; swiping=false; dx=0; item.style.transition='none';
  },{passive:true});

  listEl.addEventListener('touchmove',e=>{
    if(!currentItem)return;
    const mx=e.touches[0].clientX-startX, my=e.touches[0].clientY-startY;
    if(!swiping&&Math.abs(mx)>Math.abs(my)&&Math.abs(mx)>10){swiping=true;window._itemSwiping=true;}
    if(!swiping)return; e.preventDefault();
    dx=Math.min(0,mx); if(currentItem.classList.contains('swiped')) dx=Math.min(0,mx-160);
    currentItem.style.transform=`translateX(${dx}px)`;
    if(dx<-20) showOverlay(currentItem);
  },{passive:false});

  listEl.addEventListener('touchend',e=>{
    if(!currentItem||!swiping)return;
    currentItem.style.transition='transform .25s ease';
    if(dx<-THRESHOLD){currentItem.style.transform='translateX(-160px)';currentItem.classList.add('swiped');showOverlay(currentItem);}
    else{currentItem.style.transform='';currentItem.classList.remove('swiped');hideOverlay();}
    swiping=false;window._itemSwiping=false;
  },{passive:true});

  document.addEventListener('touchstart',e=>{
    if(currentItem&&!e.target.closest('.lp-item')&&!e.target.closest('#swipeOverlay')){
      currentItem.style.transition='transform .25s ease'; currentItem.style.transform=''; currentItem.classList.remove('swiped'); hideOverlay(); currentItem=null;
    }
  },{passive:true});
}
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('floatingToolbar')) {
    setupFloatingToolbar();
  }
});