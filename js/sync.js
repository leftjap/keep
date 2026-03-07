// ═══════════════════════════════════════
// sync.js — GAS 동기화 (구글 드라이브/스프레드시트)
// ═══════════════════════════════════════

const GAS_URL = 'https://script.google.com/macros/s/AKfycbw3WUMJJyab2uZ33OtZVU1Rv4kvo47cqTaRecEZta4gAtaizN667CV4oZLS8q4nNUTY/exec';

const SYNC = {
  dbTimer:        null,
  docTimers:      {},
  checksTimer:    null,
  bookTimer:      null,
  quoteTimer:     null,
  isDbLoaded:     false,
  savingDocs:     {},
  dirtyDocs:      {},
  quoteSyncHistory: {},
  _dbSaveQueued:  false,

  setSyncStatus(text, type) {
    const el  = document.getElementById('syncStatus');
    const dot = document.getElementById('syncDot');
    if (el)  el.textContent = text;
    if (dot) {
      dot.style.background = type === 'error' ? 'var(--red)' : type === 'syncing' ? 'var(--yellow)' : '#7a9968';
      dot.style.animation  = type === 'syncing' ? 'pulse 1s infinite' : 'none';
    }
  },

  async _post(data) {
    data.token   = APP_TOKEN;
    data.idToken = localStorage.getItem('gb_id_token');
    if (!data.idToken) throw new Error('LocalMode');
    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
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
        if (db[K.docs]   && db[K.docs].length >= 0) S(K.docs,   db[K.docs]);
        if (db[K.books])   S(K.books,   db[K.books]);
        if (db[K.quotes])  S(K.quotes,  db[K.quotes]);
        if (db[K.memos])   S(K.memos,   db[K.memos]);
        if (db[K.checks])  S(K.checks,  db[K.checks]);
        if (db[K.expenses]) S(K.expenses, db[K.expenses]);
        this.isDbLoaded = true;
        this.setSyncStatus('동기화 완료', 'ok');
      } else {
        this.isDbLoaded = true;
        this.setSyncStatus('신규 상태', 'ok');
      }
    } catch (e) {
      this.isDbLoaded = true;
      if (e.message === 'LocalMode') this.setSyncStatus('로컬 전용', 'error');
      else this.setSyncStatus('불러오기 실패', 'error');
      console.warn('loadDatabase 실패:', e.message);
    }
  },

  async saveDatabase() {
    if (!this.isDbLoaded) return;
    try {
      const dbData = {
        [K.docs]:      L(K.docs)      || [],
        [K.books]:     L(K.books)     || [],
        [K.memos]:     L(K.memos)     || [],
        [K.quotes]:    L(K.quotes)    || [],
        [K.checks]:    L(K.checks)    || {},
        [K.expenses]:  L(K.expenses)  || []
      };
      await this._post({ action: 'save_db', dbData });
    } catch (e) {
      console.warn('saveDatabase 실패:', e.message);
    }
  },

  scheduleDatabaseSave() {
    if (this._dbSaveQueued) return;
    this._dbSaveQueued = true;
    clearTimeout(this.dbTimer);
    this.dbTimer = setTimeout(async () => {
      try { await this.saveDatabase(); }
      catch (e) { console.warn('scheduleDatabaseSave 실패:', e.message); }
      finally   { this._dbSaveQueued = false; }
    }, 3000);
  },

  // ═══ 이미지 업로드 ═══
  async uploadImage(base64Data, filename, mimeType) {
    if (!GAS_URL) throw new Error('No GAS URL');
    this.setSyncStatus('업로드 중', 'syncing');
    try {
      const res = await this._post({ action: 'upload_image', bytes: base64Data, filename, mimeType });
      this.setSyncStatus('저장 완료', 'ok');
      return res;
    } catch (e) {
      if (e.message === 'LocalMode') this.setSyncStatus('로컬 전용', 'error');
      else this.setSyncStatus('업로드 실패', 'error');
      throw e;
    }
  },

  // ═══ 문서 → 구글 드라이브 저장 ═══
  async saveDocToGDrive(id, type) {
    if (!GAS_URL || !this.isDbLoaded) return;
    if (this.savingDocs[id]) { this.dirtyDocs[id] = type; return; }
    this.savingDocs[id] = true;
    const items = (type === 'memo') ? getMemos() : allDocs();
    const doc   = items.find(d => d.id === id);
    if (!doc || !stripHtml(doc.content).trim()) { this.savingDocs[id] = false; return; }
    try {
      this.setSyncStatus('저장 중', 'syncing');
      const res = await this._post({
        action: 'save_doc', id: doc.id, driveId: doc.driveId || null,
        type, title: doc.title || today(), content: buildDocContent(doc)
      });
      if (res && res.driveId) {
        const freshItems = (type === 'memo') ? getMemos() : allDocs();
        const freshDoc   = freshItems.find(d => d.id === doc.id);
        if (freshDoc && freshDoc.driveId !== res.driveId) {
          freshDoc.driveId = res.driveId;
          if (type === 'memo') saveMemos(freshItems); else saveDocs(freshItems);
        }
      }
      this.setSyncStatus('완료됨', 'ok');
    } catch (e) {
      console.warn('saveDocToGDrive 실패:', id, e.message);
      this.setSyncStatus('저장 실패', 'error');
    } finally {
      this.savingDocs[id] = false;
      if (this.dirtyDocs[id]) {
        const nextType = this.dirtyDocs[id];
        delete this.dirtyDocs[id];
        this.saveDocToGDrive(id, nextType).catch(() => {});
      }
    }
  },

  scheduleDocSave(type) {
    const id = (type === 'memo') ? curMemoId : curIds[type];
    if (!id) return;
    const timerKey = type + '_' + id;
    clearTimeout(this.docTimers[timerKey]);
    this.docTimers[timerKey] = setTimeout(async () => {
      try { await this.saveDocToGDrive(id, type); }
      catch (e) { console.warn('scheduleDocSave 실패:', e.message); }
      this.scheduleDatabaseSave();
      delete this.docTimers[timerKey];
    }, 5000);
  },

  // ═══ 루틴 체크 저장 ═══
  async saveChecksToSheet(dateStr, checkData) {
    if (!GAS_URL || !this.isDbLoaded) return;
    const dStr    = dateStr || today();
    const dData   = checkData || getChk();
    const payload = { action: 'save_routine', date: dStr, checks: dData };
    const payloadKey = JSON.stringify(payload);
    if (payloadKey === this.lastChecksPayload) return;
    if (this.checksSaving) { this.checksPending = true; return; }
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
        try { await this.saveChecksToSheet(); } catch {}
      }
    }
  },

  // ═══ 책 저장 ═══
  scheduleBookSave(book) {
    clearTimeout(this.bookTimer);
    this.bookTimer = setTimeout(async () => {
      try { await this.saveBooksToSheet(book); }
      catch (e) { console.warn('scheduleBookSave 실패:', e.message); }
      this.scheduleDatabaseSave();
    }, 5000);
  },

  async saveBooksToSheet(book) {
    if (!GAS_URL || !book || !this.isDbLoaded) return;
    try {
      const res = await this._post({
        action: 'save_doc', id: book.id, driveId: book.driveId, type: 'book',
        title: book.title,
        content: '저자: ' + (book.author||'') + '\n출판사: ' + (book.publisher||'') + '\n읽은 양: ' + (book.pages||0) + 'p\n\n' + stripHtml(book.memo||'')
      });
      if (res && res.driveId) {
        const books = getBooks();
        const idx   = books.findIndex(b => b.id === book.id);
        if (idx !== -1 && books[idx].driveId !== res.driveId) { books[idx].driveId = res.driveId; saveBooks(books); }
      }
    } catch (e) { console.warn('saveBooksToSheet 실패:', e.message); }
  },

  // ═══ 어구 저장 ═══
  scheduleQuoteSave(text, by, id) {
    clearTimeout(this.quoteTimer);
    this.quoteTimer = setTimeout(async () => {
      if (!this.quoteSyncHistory[id]) {
        try { await this.saveQuotesToSheet(text, by); this.quoteSyncHistory[id] = true; }
        catch (e) { console.warn('scheduleQuoteSave 실패:', e.message); }
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
    Object.keys(this.docTimers).forEach(key => { clearTimeout(this.docTimers[key]); delete this.docTimers[key]; });
    clearTimeout(this.dbTimer);
    this._dbSaveQueued = false;
    this.setSyncStatus('동기화 중', 'syncing');
    try {
      const promises = [];
      for (const type of textTypes) { if (curIds[type]) promises.push(this.saveDocToGDrive(curIds[type], type)); }
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
