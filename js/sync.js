// ═══ PROJECT: keep ═══

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
  _dbRetryTimer:  null,
  _dbRetryCount:  0,
  _dbLoading:     false,

  setSyncStatus(text, type) {
    const el  = document.getElementById('syncStatus');
    const dot = document.getElementById('syncDot');
    if (el)  el.textContent = text;
    if (dot) {
      dot.style.background = type === 'error' ? 'var(--red)' : type === 'syncing' ? 'var(--yellow)' : '#7a9968';
      dot.style.animation  = type === 'syncing' ? 'pulse 1s infinite' : 'none';
    }
    const label = document.getElementById('syncCloudLabel');
    if (label) {
      clearTimeout(this._labelTimer);
      label.classList.remove('error', 'syncing');
      if (type === 'syncing') {
        label.innerHTML = '동기화 진행 중<span class="sync-dots"><span>.</span><span>.</span><span>.</span></span>';
        label.classList.add('syncing');
      } else if (type === 'error') {
        label.textContent = text || '오류';
        label.classList.add('error');
      } else {
        label.textContent = '완료됨';
      }
    }
  },

  async _post(data) {
    data.token   = APP_TOKEN;
    data.idToken = localStorage.getItem(_LS_PREFIX + 'gb_id_token');
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
  async loadAll() {
    try {
      var res = await this._post({ action: 'load_all' });
      return res || {};
    } catch(e) {
      console.error('[SYNC] loadAll 실패:', e.message);
      throw e;
    }
  },

  async loadDatabase() {
    this._dbLoading = true;
    try {
      const res = await this._post({ action: 'load_db' });
      if (res && res.dbData && Object.keys(res.dbData).length > 0) {
        const db = res.dbData;
        if (db[K.docs]   && db[K.docs].length >= 0) S(K.docs,   db[K.docs]);
        if (db[K.books])   S(K.books,   db[K.books]);
        if (db[K.quotes])  S(K.quotes,  db[K.quotes]);
        if (db[K.memos])   S(K.memos,   db[K.memos]);
        if (db[K.checks])  S(K.checks,  db[K.checks]);
        if (db[K.expenses]) {
          S(K.expenses, db[K.expenses]);
        }
        if (db[K.merchantIcons]) S(K.merchantIcons, db[K.merchantIcons]);
        if (db[K.merchantAliases]) S(K.merchantAliases, db[K.merchantAliases]);
        if (db[K.brandIcons]) S(K.brandIcons, db[K.brandIcons]);
        if (db[K.brandOverrides]) S(K.brandOverrides, db[K.brandOverrides]);

        this.isDbLoaded = true;
        this.setSyncStatus('동기화 완료', 'ok');
        return res.config || null;
      } else {
        this.isDbLoaded = true;
        this.setSyncStatus('신규 상태', 'ok');
        return null;
      }
    } catch (e) {
      if (e.message === 'Unauthorized') {
        throw e;
      }
      this.isDbLoaded = true;
      if (e.message === 'LocalMode') this.setSyncStatus('로컬 전용', 'error');
      else this.setSyncStatus('불러오기 실패', 'error');
      console.warn('loadDatabase 실패:', e.message);
      return null;
    } finally {
      this._dbLoading = false;
    }
  },

  async saveDatabase() {
    if (!this.isDbLoaded) return;
    // loadDatabase 진행 중이면 완료까지 대기 (최대 10초)
    if (this._dbLoading) {
      console.log('saveDatabase: loadDatabase 진행 중 — 완료 대기');
      var self = this;
      var waited = 0;
      while (self._dbLoading && waited < 10000) {
        await new Promise(function(r) { setTimeout(r, 200); });
        waited += 200;
      }
      if (self._dbLoading) {
        console.warn('saveDatabase: loadDatabase 대기 타임아웃 (10초) — 저장 건너뜀');
        return;
      }
      console.log('saveDatabase: loadDatabase 완료 — 저장 진행');
    }
    // 병합 진행 중이면 3초 후 재시도
    if (this._merging) {
      console.log('saveDatabase: 병합 중이므로 3초 후 재시도');
      var self = this;
      clearTimeout(this._mergeSaveTimer);
      this._mergeSaveTimer = setTimeout(function() { self.saveDatabase(); }, 3000);
      return;
    }
    clearTimeout(this._dbRetryTimer);
    this._dbRetryCount = 0;
    try {
      var dbData = {
        [K.docs]:            L(K.docs)            || [],
        [K.books]:           L(K.books)           || [],
        [K.memos]:           L(K.memos)           || [],
        [K.quotes]:          L(K.quotes)          || [],
        [K.checks]:          L(K.checks)          || {},
        [K.expenses]:        L(K.expenses)        || [],
        [K.merchantIcons]:   L(K.merchantIcons)   || [],
        [K.merchantAliases]: L(K.merchantAliases) || [],
        [K.brandIcons]:      L(K.brandIcons)      || {},
        [K.brandOverrides]:  L(K.brandOverrides)  || {},
        _deletedIds: {
          docs:     _getDeletedIds(L(K.docs)     || []),
          books:    _getDeletedIds(L(K.books)    || []),
          memos:    _getDeletedIds(L(K.memos)    || []),
          quotes:   _getDeletedIds(L(K.quotes)   || []),
          expenses: _getDeletedIds(L(K.expenses) || [])
        }
      };
      await this._post({ action: 'save_db', dbData: dbData });
      this.setSyncStatus('완료됨', 'ok');
    } catch (e) {
      if (e.message === 'Unauthorized' || e.message === 'LocalMode') {
        console.warn('saveDatabase 실패 (재시도 불가):', e.message);
        return;
      }
      console.warn('saveDatabase 실패, 재시도 예약:', e.message);
      this._scheduleDbRetry();
    }
  },

  _scheduleDbRetry() {
    var delays = [5000, 15000, 45000];
    if (this._dbRetryCount >= delays.length) {
      console.warn('saveDatabase 재시도 한도 초과 (' + delays.length + '회)');
      this.setSyncStatus('저장 실패', 'error');
      return;
    }
    var delay = delays[this._dbRetryCount];
    this._dbRetryCount++;
    var self = this;
    console.log('saveDatabase 재시도 ' + self._dbRetryCount + '/' + delays.length + ' (' + (delay / 1000) + '초 후)');
    this.setSyncStatus('재시도 대기', 'error');
    this._dbRetryTimer = setTimeout(function() {
      var dbData = {
        [K.docs]:            L(K.docs)            || [],
        [K.books]:           L(K.books)           || [],
        [K.memos]:           L(K.memos)           || [],
        [K.quotes]:          L(K.quotes)          || [],
        [K.checks]:          L(K.checks)          || {},
        [K.expenses]:        L(K.expenses)        || [],
        [K.merchantIcons]:   L(K.merchantIcons)   || [],
        [K.merchantAliases]: L(K.merchantAliases) || [],
        [K.brandIcons]:      L(K.brandIcons)      || {},
        [K.brandOverrides]:  L(K.brandOverrides)  || {},
        _deletedIds: {
          docs:     _getDeletedIds(L(K.docs)     || []),
          books:    _getDeletedIds(L(K.books)    || []),
          memos:    _getDeletedIds(L(K.memos)    || []),
          quotes:   _getDeletedIds(L(K.quotes)   || []),
          expenses: _getDeletedIds(L(K.expenses) || [])
        }
      };
      self._post({ action: 'save_db', dbData: dbData }).then(function() {
        self._dbRetryCount = 0;
        console.log('saveDatabase 재시도 성공');
        self.setSyncStatus('완료됨', 'ok');
      }).catch(function(e2) {
        if (e2.message === 'Unauthorized' || e2.message === 'LocalMode') {
          console.warn('saveDatabase 재시도 중단 (재시도 불가):', e2.message);
          return;
        }
        console.warn('saveDatabase 재시도 실패 (' + self._dbRetryCount + '/' + delays.length + '):', e2.message);
        self._scheduleDbRetry();
      });
    }, delay);
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

  // ═══ 서버 문서 병합 (멀티 디바이스 동기화) ═══
  async mergeServerDocs(dbData) {
    if (!this.isDbLoaded) return;
    // dbData가 없으면 직접 로드 (단독 호출 대비)
    if (!dbData) {
      try {
        var res = await this._post({ action: 'load_db' });
        if (!res || !res.dbData) return;
        dbData = res.dbData;
      } catch (e) {
        console.warn('mergeServerDocs 실패:', e.message);
        return;
      }
    }

    // _unsyncedLocal이 true면 로컬에 미저장 변경이 있으므로 서버 덮어쓰기 안 함
    if (window._unsyncedLocal) {
      console.log('mergeServerDocs: 미동기화 로컬 변경이 있어 서버 병합 건너뜀');
      return;
    }

    var changed = false;

    // docs 병합
    var serverDocs = dbData[K.docs];
    if (serverDocs && Array.isArray(serverDocs)) {
      var localDocs = allDocs();
      var localMap = {};
      for (var i = 0; i < localDocs.length; i++) localMap[localDocs[i].id] = localDocs[i];
      var docsChanged = false;
      for (var j = 0; j < serverDocs.length; j++) {
        var sd = serverDocs[j];
        var ld = localMap[sd.id];
        if (ld) {
          if (sd.updated && ld.updated && sd.updated > ld.updated) {
            Object.assign(ld, sd);
            docsChanged = true;
          }
        } else {
          localDocs.unshift(sd);
          docsChanged = true;
        }
      }
      if (docsChanged) { saveDocs(localDocs); changed = true; }
    }

    // books 병합
    var serverBooks = dbData[K.books];
    if (serverBooks && Array.isArray(serverBooks)) {
      var localBooks = getBooks();
      var bookMap = {};
      for (var i = 0; i < localBooks.length; i++) bookMap[localBooks[i].id] = localBooks[i];
      var booksChanged = false;
      for (var j = 0; j < serverBooks.length; j++) {
        var sb = serverBooks[j];
        var lb = bookMap[sb.id];
        if (lb) {
          var sbTime = sb.updated || sb.date || '';
          var lbTime = lb.updated || lb.date || '';
          if (sbTime && lbTime && sbTime > lbTime) {
            Object.assign(lb, sb);
            booksChanged = true;
          }
        } else {
          localBooks.unshift(sb);
          booksChanged = true;
        }
      }
      if (booksChanged) { saveBooks(localBooks); changed = true; }
    }

    // memos 병합
    var serverMemos = dbData[K.memos];
    if (serverMemos && Array.isArray(serverMemos)) {
      var localMemos = getMemos();
      var memoMap = {};
      for (var i = 0; i < localMemos.length; i++) memoMap[localMemos[i].id] = localMemos[i];
      var memosChanged = false;
      for (var j = 0; j < serverMemos.length; j++) {
        var sm = serverMemos[j];
        var lm = memoMap[sm.id];
        if (lm) {
          if (sm.updated && lm.updated && sm.updated > lm.updated) {
            Object.assign(lm, sm);
            memosChanged = true;
          }
        } else {
          localMemos.unshift(sm);
          memosChanged = true;
        }
      }
      if (memosChanged) { saveMemos(localMemos); changed = true; }
    }

    // quotes 병합
    var serverQuotes = dbData[K.quotes];
    if (serverQuotes && Array.isArray(serverQuotes)) {
      var localQuotes = getQuotes();
      var quoteMap = {};
      for (var i = 0; i < localQuotes.length; i++) quoteMap[localQuotes[i].id] = localQuotes[i];
      var quotesChanged = false;
      for (var j = 0; j < serverQuotes.length; j++) {
        var sq = serverQuotes[j];
        var lq = quoteMap[sq.id];
        if (lq) {
          var sqTime = sq.updated || sq.created || '';
          var lqTime = lq.updated || lq.created || '';
          if (sqTime && lqTime && sqTime > lqTime) {
            Object.assign(lq, sq);
            quotesChanged = true;
          }
        } else {
          localQuotes.unshift(sq);
          quotesChanged = true;
        }
      }
      if (quotesChanged) { saveQuotes(localQuotes); changed = true; }
    }

    // 변경이 있으면 현재 열린 문서 리프레시
    if (changed) {
      renderListPanel();
      var cl = currentLoadedDoc;
      if (cl && cl.type && cl.id) {
        if (textTypes.includes(cl.type)) loadDoc(cl.type, cl.id, true);
        else if (cl.type === 'book')  loadBook(cl.id, true);
        else if (cl.type === 'memo')  loadMemo(cl.id, true);
        else if (cl.type === 'quote') loadQuote(cl.id, true);
      }
    }
  },

  // ═══ 서버 expenses 병합 (SMS 자동 반영) ═══
  async mergeServerExpenses(dbData) {
    if (!this.isDbLoaded) return;
    // 미동기화 로컬 변경이 있으면 서버로 덮어쓰지 않음
    if (window._unsyncedLocal) {
      console.log('mergeServerExpenses: 미동기화 로컬 변경이 있어 서버 병합 건너뜀');
      return;
    }
    // dbData가 없으면 직접 로드 (단독 호출 대비)
    if (!dbData) {
      try {
        var res = await this._post({ action: 'load_db' });
        if (!res || !res.dbData) return;
        dbData = res.dbData;
      } catch (e) {
        console.warn('mergeServerExpenses 실패:', e.message);
        return;
      }
    }
    var serverExpenses = dbData[K.expenses];
    if (!serverExpenses || !Array.isArray(serverExpenses)) return;

    // LWW: 서버 데이터로 교체
    var localExpenses = getExpenses();
    var localStr = JSON.stringify(localExpenses.map(function(e) { return e.id; }).sort());
    var serverStr = JSON.stringify(serverExpenses.map(function(e) { return e.id; }).sort());
    if (localStr === serverStr) return; // 동일하면 리렌더 불필요

    saveExpenses(serverExpenses);
    updateExpenseCompact();
    if (activeTab === 'expense') {
      var platform = window.innerWidth > 768 ? 'pc' : 'mobile';
      renderExpenseDashboard(platform);
    }
  },

  // ═══ 서버 전체 병합 (load_db 1회로 expenses + docs 병합) ═══
  async mergeServerAll() {
    if (!this.isDbLoaded) return;
    if (this._merging) return;
    if (this._dbLoading) {
      console.log('mergeServerAll: loadDatabase 진행 중 — 건너뜀');
      return;
    }
    this._merging = true;
    try {
      var res = await this._post({ action: 'load_db' });
      if (!res || !res.dbData) return;

      await this.mergeServerExpenses(res.dbData);
      await this.mergeServerDocs(res.dbData);
    } catch (e) {
      console.warn('mergeServerAll 실패:', e.message);
    } finally {
      this._merging = false;
    }
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
  },

  // ═══ 안전한 동기화 (서버가 더 최신이면 푸시 건너뜀) ═══
  async syncAllSafe() {
    if (!this.isDbLoaded) return;
    try {
      var res = await this._post({ action: 'load_db' });
      if (res && res.dbData) {
        var dominated = false;
        // 현재 열린 문서의 서버 updated가 로컬보다 최신인지 확인
        var cl = currentLoadedDoc;
        if (cl && cl.type && cl.id) {
          var serverItems = null;
          var localItem = null;
          if (textTypes.includes(cl.type)) {
            serverItems = res.dbData[K.docs];
            localItem = allDocs().find(function(d) { return d.id === cl.id; });
          } else if (cl.type === 'book') {
            serverItems = res.dbData[K.books];
            localItem = getBooks().find(function(b) { return b.id === cl.id; });
          } else if (cl.type === 'memo') {
            serverItems = res.dbData[K.memos];
            localItem = getMemos().find(function(m) { return m.id === cl.id; });
          }
          if (serverItems && Array.isArray(serverItems) && localItem) {
            var serverItem = null;
            for (var i = 0; i < serverItems.length; i++) {
              if (serverItems[i].id === cl.id) { serverItem = serverItems[i]; break; }
            }
            if (serverItem) {
              var serverTime = serverItem.updated || serverItem.date || serverItem.created || '';
              var localTime = localItem.updated || localItem.date || localItem.created || '';
              if (serverTime > localTime) {
                dominated = true;
              }
            }
          }
        }
        if (dominated) {
          console.log('syncAllSafe: 서버가 더 최신이므로 푸시 건너뜀');
          window._unsyncedLocal = false;
          return;
        }
      }
    } catch (e) {
      // 서버 확인 실패 → 로컬에 미동기화 변경이 있을 수 있음을 표시
      console.warn('syncAllSafe: 서버 확인 실패, 푸시 건너뜀', e.message);
      window._unsyncedLocal = true;
      return;
    }
    // 서버가 같거나 오래됨 → 기존대로 동기화
    await this.syncAll();
    window._unsyncedLocal = false;
  },

  // ═══ 소셜: 알림 확인 ═══
  async checkNotifications() {
    try {
      var res = await this._post({ action: 'check_notifications' });
      return res || { notifications: [], unreadCount: 0 };
    } catch (e) {
      console.warn('checkNotifications 실패:', e.message);
      return { notifications: [], unreadCount: 0 };
    }
  },

  // ═══ 소셜: 상대방 DB 로드 ═══
  async loadPartnerDb() {
    try {
      var res = await this._post({ action: 'load_partner_db' });
      if (res && res.status === 'ok') return res;
      return null;
    } catch (e) {
      console.warn('loadPartnerDb 실패:', e.message);
      return null;
    }
  },

  // ═══ 소셜: 댓글 작성 ═══
  async postComment(docId, docOwner, text) {
    try {
      var res = await this._post({ action: 'post_comment', docId: docId, docOwner: docOwner, text: text });
      return res;
    } catch (e) {
      console.warn('postComment 실패:', e.message);
      return null;
    }
  },

  // ═══ 소셜: 알림 읽음 처리 ═══
  async markRead(notifIds) {
    try {
      await this._post({ action: 'mark_read', notifIds: notifIds });
    } catch (e) {
      console.warn('markRead 실패:', e.message);
    }
  },

  // ═══ 소셜: 자기 글에 달린 댓글 로드 ═══
  async loadMyComments() {
    try {
      var res = await this._post({ action: 'load_my_comments' });
      return res || { comments: [] };
    } catch (e) {
      console.warn('loadMyComments 실패:', e.message);
      return { comments: [] };
    }
  },

  // ═══ 소셜: 댓글 삭제 ═══
  async deleteComment(commentId) {
    try {
      var res = await this._post({ action: 'delete_comment', commentId: commentId });
      return res || { status: 'error' };
    } catch (e) {
      console.warn('deleteComment 실패:', e.message);
      return { status: 'error', message: e.message };
    }
  },

  // ═══ 소셜: 댓글 수정 ═══
  async editComment(commentId, text) {
    try {
      var res = await this._post({ action: 'edit_comment', commentId: commentId, text: text });
      return res || { status: 'error' };
    } catch (e) {
      console.warn('editComment 실패:', e.message);
      return { status: 'error', message: e.message };
    }
  }
};
