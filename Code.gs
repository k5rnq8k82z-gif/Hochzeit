/* ===============================
   Hochzeit – Backend für index.html & admin.html
   Kompatibel mit:
   - index.html: type=rsvp (POST), type=chat (POST), type=chat&list=1 (GET)
   - admin.html: rsvp list, chat list+delete, gallery list/upload/delete, texts get/set
   Token (Admin): 030520
   =============================== */

const ADMIN_TOKEN = '030520';
const SHEET_RSVP = 'rsvp';
const SHEET_CHAT = 'chat';
const SHEET_TEXTS = 'texts';     // key-value
const GALLERY_FOLDER_ID = 'PASTE_YOUR_FOLDER_ID_HERE'; // <<<<<< ERSETZEN

/* ---------- CORS ---------- */
function _cors(e) {
  const h = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  return h;
}
function doOptions(e){ return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.TEXT).setHeaders(_cors(e)); }

/* ---------- Utilities ---------- */
function _json(obj, e) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(_cors(e));
}

function _ensureSheets_() {
  const ss = SpreadsheetApp.getActive();

  // RSVP
  let sh = ss.getSheetByName(SHEET_RSVP);
  if (!sh) sh = ss.insertSheet(SHEET_RSVP);
  const rsvpHeader = ['timestamp','name','attending','guests','email','message',
                      'c1name','c1age','c2name','c2age','c3name','c3age','c4name','c4age','ua'];
  if (sh.getLastRow() === 0) sh.getRange(1,1,1,rsvpHeader.length).setValues([rsvpHeader]);

  // CHAT
  let ch = ss.getSheetByName(SHEET_CHAT);
  if (!ch) ch = ss.insertSheet(SHEET_CHAT);
  const chatHeader = ['id','timestamp','name','message','ua'];
  if (ch.getLastRow() === 0) ch.getRange(1,1,1,chatHeader.length).setValues([chatHeader]);

  // TEXTS
  let tx = ss.getSheetByName(SHEET_TEXTS);
  if (!tx) tx = ss.insertSheet(SHEET_TEXTS);
  const textsHeader = ['key','value'];
  if (tx.getLastRow() === 0) tx.getRange(1,1,1,textsHeader.length).setValues([textsHeader]);
}

function _nowStr_(){
  const tz = Session.getScriptTimeZone() || 'Europe/Berlin';
  return Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd HH:mm:ss');
}

function _kvGet_(key){
  const tx = SpreadsheetApp.getActive().getSheetByName(SHEET_TEXTS);
  if(!tx) return '';
  const data = tx.getDataRange().getValues();
  const idx = data.findIndex(r => r[0] === key);
  return idx > 0 ? (data[idx][1] || '') : '';
}
function _kvSet_(key, value){
  const tx = SpreadsheetApp.getActive().getSheetByName(SHEET_TEXTS);
  const data = tx.getDataRange().getValues();
  const idx = data.findIndex(r => r[0] === key);
  if (idx > 0) {
    tx.getRange(idx+1, 2).setValue(value);
  } else {
    tx.appendRow([key, value]);
  }
}

/* ---------- ROUTER ---------- */
function doGet(e){
  try{
    _ensureSheets_();
    const type = (e.parameter.type || '').toLowerCase();

    if (type === 'rsvp' && e.parameter.list === '1') {
      return _json(listRSVP_(e), e);
    }

    if (type === 'chat' && e.parameter.list === '1') {
      return _json(listChat_(e), e);
    }

    if (type === 'gallery' && e.parameter.list === '1') {
      return _json(listGallery_(e), e);
    }

    if (type === 'texts' && e.parameter.list === '1') {
      return _json(getTexts_(e), e);
    }

    // Fallback: Info
    return _json({ ok:true, msg:'GET ok. Erwartete Parameter: type=(rsvp|chat|gallery|texts)&list=1' }, e);

  }catch(err){
    return _json({ ok:false, error:String(err) }, e);
  }
}

function doPost(e){
  try{
    _ensureSheets_();
    const ct = (e.postData && e.postData.type) || '';
    const type = (ct || (e.parameter.type || '')).toLowerCase();

    // RSVP (index.html)
    if (type === 'rsvp') {
      return _json(saveRSVP_(e), e);
    }

    // Chat (index.html)
    if (type === 'chat') {
      return _json(saveChat_(e), e);
    }

    // Admin: Chat löschen
    if (type === 'chat_delete') {
      _requireAdmin_(e);
      return _json(deleteChat_(e), e);
    }

    // Admin: Galerie Upload
    if (type === 'gallery_upload') {
      _requireAdmin_(e, true);
      return _json(uploadGallery_(e), e);
    }

    // Admin: Galerie löschen
    if (type === 'gallery_delete') {
      _requireAdmin_(e);
      return _json(deleteGallery_(e), e);
    }

    // Admin: Texte setzen
    if (type === 'texts_set') {
      _requireAdmin_(e);
      return _json(setTexts_(e), e);
    }

    return _json({ ok:false, error:'Unknown POST type' }, e);

  }catch(err){
    return _json({ ok:false, error:String(err) }, e);
  }
}

/* ---------- Admin Token ---------- */
function _requireAdmin_(e, isMultipart){
  const token = isMultipart
    ? (e.parameter.token || (e.postData && e.postData.length ? JSON.parse('{}') : '') ) // multipart: token kommt als feld, aber e.parameter deckt es ab
    : (e.parameter.token || (e.postData && e.postData.contents && e.postData.type==='application/x-www-form-urlencoded'
        ? e.parameter.token : ''));

  if (token !== ADMIN_TOKEN) {
    throw new Error('Unauthorized (invalid token).');
  }
}

/* ---------- RSVP ---------- */
function saveRSVP_(e){
  const p = e.parameter;
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_RSVP);
  sh.appendRow([
    _nowStr_(),
    p.name || '',
    p.attending || '',
    p.guests || '',
    p.email || '',
    p.message || '',
    p.c1name || '', p.c1age || '',
    p.c2name || '', p.c2age || '',
    p.c3name || '', p.c3age || '',
    p.c4name || '', p.c4age || '',
    p.ua || ''
  ]);
  return { ok:true };
}

function listRSVP_(e){
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_RSVP);
  const vals = sh.getDataRange().getValues();
  const head = vals.shift();
  const hi = {};
  head.forEach((h,i)=> hi[h]=i);
  const rows = vals.map(r => ({
    timestamp: r[hi['timestamp']] || '',
    name: r[hi['name']] || '',
    attending: r[hi['attending']] || '',
    guests: r[hi['guests']] || '',
    email: r[hi['email']] || '',
    message: r[hi['message']] || '',
    ua: r[hi['ua']] || ''
  }));
  return { ok:true, rows };
}

/* ---------- CHAT ---------- */
function saveChat_(e){
  const p = e.parameter;
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_CHAT);
  // einfache ID: Timestamp + zufällig
  const id = 'm' + new Date().getTime() + Math.floor(Math.random()*1000);
  sh.appendRow([ id, _nowStr_(), p.name || '', p.message || '', p.ua || '' ]);
  return { ok:true };
}

function listChat_(e){
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_CHAT);
  const vals = sh.getDataRange().getValues();
  const head = vals.shift();
  const hi = {};
  head.forEach((h,i)=> hi[h]=i);
  const rows = vals.map(r => ({
    id: r[hi['id']] || '',
    timestamp: r[hi['timestamp']] || '',
    name: r[hi['name']] || '',
    message: r[hi['message']] || ''
  }));
  return { ok:true, rows };
}

function deleteChat_(e){
  const id = e.parameter.id || '';
  if (!id) return { ok:false, error:'Missing id' };
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_CHAT);
  const vals = sh.getDataRange().getValues();
  const head = vals.shift();
  const hi = {}; head.forEach((h,i)=> hi[h]=i);
  for (let r=0; r<vals.length; r++){
    if (String(vals[r][hi['id']]) === id){
      sh.deleteRow(r+2);
      return { ok:true };
    }
  }
  return { ok:false, error:'Not found' };
}

/* ---------- GALLERY (Drive) ---------- */
function listGallery_(e){
  if (!GALLERY_FOLDER_ID) return { ok:false, error:'GALLERY_FOLDER_ID missing' };
  const folder = DriveApp.getFolderById(GALLERY_FOLDER_ID);
  const files = folder.getFiles();
  const items = [];
  while (files.hasNext()){
    const f = files.next();
    const url = _filePublicUrl_(f);
    items.push({
      id: f.getId(),
      url: url,
      name: f.getName(),
      width: null,
      height: null,
      ts: f.getDateCreated()
    });
  }
  // nach Erstellzeit sortieren
  items.sort((a,b)=> new Date(a.ts) - new Date(b.ts));
  return { ok:true, items };
}

function uploadGallery_(e){
  if (!GALLERY_FOLDER_ID) return { ok:false, error:'GALLERY_FOLDER_ID missing' };
  const folder = DriveApp.getFolderById(GALLERY_FOLDER_ID);

  // Multipart-Upload: e.parameter enthält keine Blobs, aber e.postData und die globalen parameter liefern die Blobs
  const blobs = e && e.postData && e.postData.length ? e.postData.contents : null; // nicht direkt nutzbar
  // Richtige Methode: über e.parameter und e.files
  const upfiles = e && e.files ? e.files : {};
  const names = Object.keys(upfiles);
  if (names.length === 0) return { ok:false, error:'No files[] provided' };

  const out = [];
  names.forEach(k=>{
    const blob = upfiles[k];
    const name = blob.getName() || ('upload_'+Utilities.getUuid());
    const file = folder.createFile(blob).setName(name);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    out.push({
      id: file.getId(),
      url: _filePublicUrl_(file),
      name: file.getName(),
      width: null, height: null,
      ts: file.getDateCreated()
    });
  });
  return { ok:true, items: out };
}

function deleteGallery_(e){
  const id = e.parameter.id || '';
  if (!id) return { ok:false, error:'Missing id' };
  try{
    const f = DriveApp.getFileById(id);
    f.setTrashed(true);
    return { ok:true };
  }catch(err){
    return { ok:false, error:String(err) };
  }
}

function _filePublicUrl_(file){
  // Für <img src>: entweder "WebContentLink" (Drive API v2) oder direkt uc?export=download
  // In Apps Script nativ:
  return 'https://drive.google.com/uc?export=view&id=' + encodeURIComponent(file.getId());
}

/* ---------- TEXTS (key-value) ---------- */
function getTexts_(e){
  return {
    ok:true,
    data:{
      hero_title: _kvGet_('hero_title'),
      hero_subtitle: _kvGet_('hero_subtitle'),
      infos_html: _kvGet_('infos_html')
    }
  };
}
function setTexts_(e){
  const p = e.parameter;
  _kvSet_('hero_title', p.hero_title || '');
  _kvSet_('hero_subtitle', p.hero_subtitle || '');
  _kvSet_('infos_html', p.infos_html || '');
  return { ok:true };
}
