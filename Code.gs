/**
 * 興嘉貓咪鍵盤大冒險 - Google Apps Script 後端
 * ------------------------------------------------
 * 使用方式：
 * 1. 在 Google 試算表開啟「擴充功能 → Apps Script」
 * 2. 貼上本檔內容
 * 3. 執行 setup()
 * 4. 專案設定 → 指令碼屬性：新增 ADMIN_PASSWORD
 * 5. 部署為 Web App
 */

const SHEET_NAME = 'Scores';
const HEADERS = [
  'recordId','timestamp','className','seatNo','name','mode','level',
  'score','wpm','accuracy','combo','duration','userAgent'
];

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);
    sh.setFrozenRows(1);
    sh.getRange(1,1,1,HEADERS.length).setFontWeight('bold').setBackground('#eaf2ff');
    sh.autoResizeColumns(1, HEADERS.length);
  }
  return '完成：Scores 工作表已建立。';
}

function doGet(e) {
  try {
    const p = e && e.parameter ? e.parameter : {};
    const action = p.action || 'leaderboard';

    if (action === 'leaderboard') {
      return json({ok:true,data:getLeaderboard_(p)});
    }

    if (action === 'scores') {
      assertAdmin_(p.password);
      return json({ok:true,data:getScores_(p)});
    }

    return json({ok:false,message:'Unknown action'});
  } catch (err) {
    return json({ok:false,message:String(err.message || err)});
  }
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = body.action || '';

    if (action === 'auth') {
      assertAdmin_(body.password);
      return json({ok:true});
    }

    if (action === 'add') {
      // 學生前台新增不需要管理密碼；若為教師補登也可共用。
      const row = normalize_(body);
      validateScore_(row);
      row.recordId = Utilities.getUuid();
      row.timestamp = new Date();
      append_(row);
      return json({ok:true,recordId:row.recordId});
    }

    if (action === 'update') {
      assertAdmin_(body.password);
      const row = normalize_(body);
      row.recordId = String(body.recordId || '');
      validateScore_(row);
      update_(row);
      return json({ok:true});
    }

    if (action === 'delete') {
      assertAdmin_(body.password);
      delete_(String(body.recordId || ''));
      return json({ok:true});
    }

    return json({ok:false,message:'Unknown action'});
  } catch (err) {
    return json({ok:false,message:String(err.message || err)});
  }
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) throw new Error('找不到 Scores 工作表，請先執行 setup()。');
  return sh;
}

function normalize_(o) {
  return {
    recordId: String(o.recordId || ''),
    timestamp: o.timestamp ? new Date(o.timestamp) : new Date(),
    className: clean_(o.className, 30),
    seatNo: clean_(o.seatNo, 10),
    name: clean_(o.name, 40),
    mode: ['bopomofo','english','boss'].includes(o.mode) ? o.mode : 'bopomofo',
    level: clean_(o.level, 100),
    score: num_(o.score,0,999999),
    wpm: num_(o.wpm,0,9999),
    accuracy: num_(o.accuracy,0,100),
    combo: num_(o.combo,0,99999),
    duration: num_(o.duration,0,999999),
    userAgent: clean_(o.userAgent || '', 300)
  };
}

function validateScore_(r) {
  if (!r.className) throw new Error('班級不可空白。');
  if (!r.name) throw new Error('姓名不可空白。');
  if (!r.level) throw new Error('關卡不可空白。');
}

function append_(r) {
  const sh = sheet_();
  sh.appendRow(HEADERS.map(h => r[h] !== undefined ? r[h] : ''));
}

function getObjects_() {
  const sh = sheet_();
  const values = sh.getDataRange().getValues();
  if (values.length <= 1) return [];
  const headers = values[0];
  return values.slice(1).map((row, idx) => {
    const o = {__row: idx + 2};
    headers.forEach((h,i)=>o[h]=serializeCell_(row[i]));
    return o;
  });
}

function getLeaderboard_(p) {
  let rows = getObjects_();
  const className = clean_(p.className || '', 30);
  const mode = clean_(p.mode || '', 20);

  if (className) rows = rows.filter(r => String(r.className) === className);
  if (mode) rows = rows.filter(r => String(r.mode) === mode);

  rows.sort((a,b) => Number(b.score||0)-Number(a.score||0) || Number(b.wpm||0)-Number(a.wpm||0));

  // 每位學生每一模式只留最佳一筆，避免洗榜。
  const seen = {};
  rows = rows.filter(r => {
    const key = [r.className,r.name,r.mode].join('|');
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });

  return rows.slice(0,100).map(publicRow_);
}

function getScores_(p) {
  let rows = getObjects_();
  const className = clean_(p.className || '', 30);
  const mode = clean_(p.mode || '', 20);
  const name = clean_(p.name || '', 40).toLowerCase();

  if (className) rows = rows.filter(r => String(r.className) === className);
  if (mode) rows = rows.filter(r => String(r.mode) === mode);
  if (name) rows = rows.filter(r => String(r.name).toLowerCase().includes(name));

  rows.sort((a,b)=>String(b.timestamp).localeCompare(String(a.timestamp)));
  return rows.slice(0,2000).map(publicRow_);
}

function publicRow_(r) {
  return {
    recordId:String(r.recordId||''),
    timestamp: formatDate_(r.timestamp),
    className:String(r.className||''),
    seatNo:String(r.seatNo||''),
    name:String(r.name||''),
    mode:String(r.mode||''),
    level:String(r.level||''),
    score:Number(r.score||0),
    wpm:Number(r.wpm||0),
    accuracy:Number(r.accuracy||0),
    combo:Number(r.combo||0),
    duration:Number(r.duration||0)
  };
}

function update_(r) {
  if (!r.recordId) throw new Error('缺少 recordId。');
  const sh = sheet_();
  const rows = getObjects_();
  const old = rows.find(x => String(x.recordId) === r.recordId);
  if (!old) throw new Error('找不到指定紀錄。');

  // 保留原建立時間
  const timestamp = old.timestamp ? new Date(old.timestamp) : new Date();
  const obj = Object.assign({}, r, {timestamp:timestamp});
  sh.getRange(old.__row,1,1,HEADERS.length).setValues([HEADERS.map(h => obj[h] !== undefined ? obj[h] : '')]);
}

function delete_(recordId) {
  if (!recordId) throw new Error('缺少 recordId。');
  const sh = sheet_();
  const row = getObjects_().find(x => String(x.recordId) === recordId);
  if (!row) throw new Error('找不到指定紀錄。');
  sh.deleteRow(row.__row);
}

function assertAdmin_(password) {
  const props = PropertiesService.getScriptProperties();
  const expected = props.getProperty('ADMIN_PASSWORD') || 'teacher888';
  if (!password || String(password) !== String(expected)) {
    throw new Error('管理者密碼錯誤。');
  }
}

function clean_(v, maxLen) {
  return String(v == null ? '' : v).replace(/[<>]/g,'').trim().slice(0,maxLen || 200);
}

function num_(v,min,max) {
  let n = Number(v);
  if (!isFinite(n)) n = min;
  return Math.min(max,Math.max(min,n));
}

function formatDate_(v) {
  const d = v instanceof Date ? v : new Date(v);
  if (isNaN(d.getTime())) return String(v || '');
  return Utilities.formatDate(d, Session.getScriptTimeZone() || 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ss');
}

function serializeCell_(v) {
  if (v instanceof Date) return v.toISOString();
  return v;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
