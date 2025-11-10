/**
 * Wedding Backend – Google Apps Script
 * Sheets:
 *  - RSVPs (A:timestamp, B:name, C:attending, D:guests, E:email, F:message,
 *           G:c1name, H:c1age, I:c2name, J:c2age, K:c3name, L:c3age, M:c4name, N:c4age, O:ua)
 *  - Chat  (A:timestamp, B:name, C:message, D:ua)
 *  - Config (key, value) e.g. date, place, hero, hero_sub, ceremony, party, dress, transport, lodging, info_lead, gifts, children, hashtag
 * Drive:
 *  - create a folder and set its ID in Script Properties: GALLERY_FOLDER
 * Security:
 *  - Script Property TOKEN (admin). Default fallback set below.
 */

const FALLBACK_TOKEN = 'kim030520maria'; // <— requested default
const ALLOWED_ORIGINS = [/https:\/\/.*\.netlify\.app$/, /^http:\/\/localhost:\d+$/];

function _token() {
  return PropertiesService.getScriptProperties().getProperty('TOKEN') || FALLBACK_TOKEN;
}
function _galleryFolderId() {
  return PropertiesService.getScriptProperties().getProperty('GALLERY_FOLDER') || '';
}
function _allowOrigin_(e) {
  const origin = (e && e.parameter && e.parameter.origin) ? e.parameter.origin : '';
  return origin;
}
function _cors(resp) {
  return resp.setHeader('Access-Control-Allow-Origin', '*')
             .setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
             .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
function _json(obj) {
  return _cors(ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON));
}
function _authOK(e) {
  const t = ((e.parameter.token || '') + '').trim();
  return t && t === _token();
}

function doOptions(e) { return _json({ ok: true }); }

function doGet(e) {
  try {
    const type = (e.parameter.type || '').toLowerCase();
    if (type === 'ping') {
      return _json({ ok: _authOK(e) });
    }
    if (type === 'rsvp') {
      if (!_authOK(e) && !e.parameter.list) return _json({ ok:false, error:'unauthorized' });
      const rows = _readRSVPs();
      return _json({ ok:true, rows: rows });
    }
    if (type === 'chat') {
      if (!_authOK(e) && !e.parameter.list) return _json({ ok:false, error:'unauthorized' });
      const rows = _readChat();
      return _json({ ok:true, rows: rows });
    }
    if (type === 'gallery') {
      // public listing allowed when list=1
      if (!_authOK(e) && !e.parameter.list) return _json({ ok:false, error:'unauthorized' });
      const items = _listGallery();
      return _json({ ok:true, items: items });
    }
    if (type === 'config') {
      // public when public=1
      if (!_authOK(e) && !e.parameter.public) return _json({ ok:false, error:'unauthorized' });
      const cfg = _readConfig();
      return _json({ ok:true, config: cfg });
    }
    return _json({ ok:false, error:'unknown type' });
  } catch (err) {
    return _json({ ok:false, error: String(err) });
  }
}

function doPost(e) {
  try {
    var params = e.parameter || {};
    var type = (params.type || '').toLowerCase();

    if (type === 'rsvp') {
      const data = {
        name: params.name || '',
        attending: params.attending || '',
        guests: params.guests || '',
        email: params.email || '',
        message: params.message || '',
        c1name: params.c1name || '', c1age: params.c1age || '',
        c2name: params.c2name || '', c2age: params.c2age || '',
        c3name: params.c3name || '', c3age: params.c3age || '',
        c4name: params.c4name || '', c4age: params.c4age || '',
        ua: params.ua || ''
      };
      _appendRSVP(data);
      return _json({ ok:true });
    }

    if (type === 'chat') {
      const data = { name: params.name || '', message: params.message || '', ua: params.ua || '' };
      _appendChat(data);
      return _json({ ok:true });
    }

    if (type === 'upload') {
      if (!_authOK(e)) return _json({ ok:false, error:'unauthorized' });
      const fileName = params.filename || ('upload_' + Date.now() + '.jpg');
      const mime = params.mime || 'image/jpeg';
      const base64 = params.data || '';
      const caption = params.caption || '';
      const folderId = _galleryFolderId();
      if (!folderId) return _json({ ok:false, error:'no GALLERY_FOLDER set' });
      const bytes = Utilities.base64Decode(base64);
      const blob = Utilities.newBlob(bytes, mime, fileName);
      const folder = DriveApp.getFolderById(folderId);
      const file = folder.createFile(blob);
      try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (_) {}
      _appendGallery(file.getId(), file.getUrl(), caption);
      return _json({ ok:true, id: file.getId(), url: _filePublicUrl_(file) });
    }

    if (type === 'config') {
      if (!_authOK(e)) return _json({ ok:false, error:'unauthorized' });
      const keys = ['date','place','hero','hero_sub','ceremony','party','dress','transport','lodging','info_lead','gifts','children','hashtag'];
      const data = {};
      keys.forEach(function(k){ data[k] = params[k] || ''; });
      _writeConfig(data);
      return _json({ ok:true });
    }

    return _json({ ok:false, error:'unknown type' });
  } catch (err) {
    return _json({ ok:false, error: String(err) });
  }
}

/** Helpers: Sheets **/
function _sheetByName(name){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  return sh;
}
function _readRSVPs(){
  const sh = _sheetByName('RSVPs');
  const vals = sh.getDataRange().getValues();
  const out = [];
  for (var i=1;i<vals.length;i++){
    var r = vals[i];
    out.push({
      timestamp: r[0], name: r[1], attending: r[2], guests: r[3], email: r[4], message: r[5],
      c1name: r[6], c1age: r[7], c2name: r[8], c2age: r[9], c3name: r[10], c3age: r[11], c4name: r[12], c4age: r[13]
    });
  }
  return out;
}
function _appendRSVP(d){
  const sh = _sheetByName('RSVPs');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['timestamp','name','attending','guests','email','message','c1name','c1age','c2name','c2age','c3name','c3age','c4name','c4age','ua']);
  }
  sh.appendRow([new Date(), d.name, d.attending, d.guests, d.email, d.message, d.c1name, d.c1age, d.c2name, d.c2age, d.c3name, d.c3age, d.c4name, d.c4age, d.ua]);
}

function _readChat(){
  const sh = _sheetByName('Chat');
  const vals = sh.getDataRange().getValues();
  const out = [];
  for (var i=1;i<vals.length;i++){
    var r = vals[i];
    out.push({ timestamp: r[0], name: r[1], message: r[2] });
  }
  return out;
}
function _appendChat(d){
  const sh = _sheetByName('Chat');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['timestamp','name','message','ua']);
  }
  sh.appendRow([new Date(), d.name, d.message, d.ua]);
}

function _readConfig(){
  const sh = _sheetByName('Config');
  const vals = sh.getDataRange().getValues();
  const map = {};
  for (var i=1;i<vals.length;i++){ map[ (vals[i][0]||'').toString() ] = (vals[i][1]||'').toString(); }
  // defaults
  var out = {
    date: map.date || '20. Juni 2026',
    place: map.place || 'Koh Samui',
    hero: map.hero || 'Willkommen zu unserer Hochzeit in Thailand',
    hero_sub: map.hero_sub || 'Palmen, Sonne, Meer …',
    ceremony: map.ceremony || '14:00 Uhr, Strandzeremonie Koh Samui',
    party: map.party || 'ab 16:00 Uhr, Beach Resort',
    dress: map.dress || 'Festlich, sommerlich',
    dress_pill: (map.dress ? ('💌 Dresscode: ' + map.dress) : '💌 Dresscode: Festlich & sommerlich'),
    transport: map.transport || 'Shuttle vom Hotel • Taxis verfügbar',
    lodging: map.lodging || 'Resort-Kontingent (Stichwort „Hochzeit Kim“)',
    info_lead: map.info_lead || 'Thailand-Flair, Palmen & Sonnenuntergang – wir freuen uns auf einen unvergesslichen Tag mit euch! 🇹🇭🌅',
    gifts: map.gifts || 'Eure Anwesenheit ist unser Geschenk. Wer mag: Reisekasse 💞',
    children: map.children || 'Sehr gern! Kinderbetreuung am Strand.',
    hashtag: map.hashtag || 'Nach der Feier füllen wir die Galerie. Hashtag #KimUndPartnerInThailand'
  };
  return out;
}
function _writeConfig(data){
  const sh = _sheetByName('Config');
  if (sh.getLastRow() === 0) sh.appendRow(['key','value']);
  const existing = sh.getDataRange().getValues();
  const map = {}; for (var i=1;i<existing.length;i++){ map[(existing[i][0]||'').toString()] = i+1; }
  Object.keys(data).forEach(function(k){
    if (map[k]){
      sh.getRange(map[k], 2).setValue(data[k]);
    } else {
      sh.appendRow([k, data[k]]);
    }
  });
}

/** Gallery: store metadata in Sheet, files in Drive folder **/
function _appendGallery(id, url, caption){
  const sh = _sheetByName('Gallery');
  if (sh.getLastRow() === 0) sh.appendRow(['timestamp','fileId','url','caption']);
  sh.appendRow([new Date(), id, url, caption || '']);
}
function _listGallery(){
  const sh = _sheetByName('Gallery');
  const vals = sh.getDataRange().getValues();
  const out = [];
  for (var i=1;i<vals.length;i++){
    out.push({ timestamp: vals[i][0], id: vals[i][1], url: _makeViewUrl_(vals[i][1], vals[i][2]), caption: vals[i][3] });
  }
  return out;
}
function _makeViewUrl_(fileId, fallbackUrl){
  // Build a publicly viewable URL; if fallback exists use it.
  if (fallbackUrl && fallbackUrl.indexOf('http')===0) return fallbackUrl;
  return 'https://drive.google.com/uc?export=view&id=' + fileId;
}
function _filePublicUrl_(file){
  try { return 'https://drive.google.com/uc?export=view&id=' + file.getId(); } catch(_) { return file.getUrl(); }
}
