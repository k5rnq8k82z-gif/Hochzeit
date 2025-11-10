/**
 * Hochzeits-Backend – Google Apps Script
 * Sheets: RSVP, Chat, Settings, GalleryPre, GalleryPost
 * Script Properties:
 *  - TOKEN = 'kim030520maria'
 *  - (optional) GALLERY_FOLDER_ID => Drive-Ordner für Bilder (wird sonst automatisch erzeugt)
 */

const CORS = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'};

function _json(o, code) {
  const out = ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
  const resp = out;
  if (code) {
    // Apps Script doesn't directly set status code in ContentService; ignore 'code'
  }
  for (var k in CORS) out.setHeader(k, CORS[k]);
  return out;
}

function doOptions() { return _json({ok:true}); }

function doGet(e) {
  try {
    const p = e.parameter || {};
    const type = (p.type || '').trim();
    if (type === 'image') return handleGetImage_(p);  // public image stream
    if (type === 'settings') return handleGetSettings_(p); // public
    if (type === 'gallery') return handleGetGallery_(p);   // public list OR admin list
    if (type === 'rsvp') return handleListRSVP_(p);        // admin (requires token)
    if (type === 'chat') return handleListChat_(p);        // admin (requires token) OR public with list=1
    return _json({ok:false, error:'unknown_get'});
  } catch (err) {
    return _json({ok:false, error:String(err)});
  }
}

function doPost(e) {
  try {
    const ct = (e.postData && e.postData.type) ? e.postData.type : '';
    const data = e.postData && e.postData.contents ? e.postData.contents : '';
    const params = e.parameter || {};
    const type = (params.type || '').trim();

    if (type === 'rsvp') return handleRSVP_(params);
    if (type === 'chat') return handleChat_(params);
    if (type === 'uploadImage') return handleUploadImage_(params, data);
    if (type === 'deleteImage') return handleDeleteImage_(params);
    if (type === 'saveSettings') return handleSaveSettings_(params);

    return _json({ok:false, error:'unknown_post'});
  } catch (err) {
    return _json({ok:false, error:String(err)});
  }
}

// ---------- Auth ----------
function _expectedToken() {
  return PropertiesService.getScriptProperties().getProperty('TOKEN') || '';
}
function _checkAuth(p) {
  var t = (p.token || '').trim();
  var exp = _expectedToken();
  return !!exp && t && t === exp;
}

// ---------- Sheets ----------
function _ss() {
  var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss;
}
function _getOrCreateSheet(name, header) {
  var ss = _ss();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    if (header && header.length) sh.getRange(1,1,1,header.length).setValues([header]);
  } else {
    var hasHeader = sh.getLastRow() >= 1 && sh.getLastColumn() >= (header?header.length:1);
    if (header && header.length && !hasHeader) sh.getRange(1,1,1,header.length).setValues([header]);
  }
  return sh;
}

// ---------- RSVP ----------
function handleRSVP_(p) {
  var sh = _getOrCreateSheet('RSVP', ['timestamp','name','attending','guests','c1name','c1age','c2name','c2age','c3name','c3age','c4name','c4age','email','message','ua']);
  var row = [
    new Date(),
    (p.name||''),(p.attending||''),(p.guests||''),
    (p.c1name||''),(p.c1age||''),(p.c2name||''),(p.c2age||''),(p.c3name||''),(p.c3age||''),(p.c4name||''),(p.c4age||''),
    (p.email||''),(p.message||''),(p.ua||'')
  ];
  sh.appendRow(row);
  return _json({ok:true});
}
function handleListRSVP_(p) {
  if (!_checkAuth(p)) return _json({ok:false, error:'unauthorized'});
  var sh = _getOrCreateSheet('RSVP', ['timestamp','name','attending','guests','c1name','c1age','c2name','c2age','c3name','c3age','c4name','c4age','email','message','ua']);
  var rng = sh.getDataRange().getValues();
  var head = rng.shift() || [];
  var rows = rng.map(function(r){
    return {
      timestamp: r[0],
      name: r[1], attending: r[2], guests: r[3],
      c1name:r[4], c1age:r[5], c2name:r[6], c2age:r[7], c3name:r[8], c3age:r[9], c4name:r[10], c4age:r[11],
      email:r[12], message:r[13]
    };
  });
  return _json({ok:true, rows:rows});
}

// ---------- Chat ----------
function handleChat_(p) {
  var sh = _getOrCreateSheet('Chat', ['timestamp','name','message','ua']);
  var name = (p.name||'').toString().trim();
  var message = (p.message||'').toString().trim();
  if (!name || !message) return _json({ok:false, error:'invalid'});
  sh.appendRow([new Date(), name, message, (p.ua||'')]);
  return _json({ok:true});
}
function handleListChat_(p) {
  var listPublic = String(p.list||'') === '1';
  if (!listPublic && !_checkAuth(p)) return _json({ok:false, error:'unauthorized'});
  var sh = _getOrCreateSheet('Chat', ['timestamp','name','message','ua']);
  var rng = sh.getDataRange().getValues();
  var head = rng.shift() || [];
  var rows = rng.map(function(r){ return { timestamp:r[0], name:r[1], message:r[2] }; });
  if (listPublic) rows = rows.slice(-50);
  return _json({ok:true, rows:rows});
}

// ---------- Settings ----------
function _defaultSettings_(){
  return {
    brandNames: 'Kim & Partner',
    splashTitle: 'Kim & Partner • 20. Juni 2026 • Thailand 🇹🇭',
    heroHeadline: 'Willkommen zu unserer Hochzeit in Thailand',
    heroIntro: 'Palmen, Sonne, Meer – und ihr mittendrin. Hier könnt ihr eure Zusage geben, alle Infos finden, Bilder anschauen und liebe Grüße im Gästebuch hinterlassen.',
    heroLocation: '📍 Koh Samui',
    heroDress: '💌 Dresscode: Festlich & sommerlich',
    heroDate: '🗓️ 20. Juni 2026',
    infoDate: '20. Juni 2026',
    infoCeremony: '14:00 Uhr, Strandzeremonie Koh Samui',
    infoParty: 'ab 16:00 Uhr, Beach Resort',
    infoDress: 'Festlich, sommerlich',
    infoArrival: 'Shuttle vom Hotel • Taxis verfügbar',
    infoHotel: 'Resort-Kontingent (Stichwort „Hochzeit Kim“)',
    infoText: 'Thailand-Flair, Palmen & Sonnenuntergang – wir freuen uns auf einen unvergesslichen Tag mit euch! 🇹🇭🌅',
    infoGifts: 'Eure Anwesenheit ist unser Geschenk. Wer mag: Reisekasse 💞',
    infoKids: 'Sehr gern! Kinderbetreuung am Strand.',
    infoPhotos: 'Nach der Feier füllen wir die Galerie. Hashtag #KimUndPartnerInThailand'
  };
}
function handleGetSettings_(p) {
  var sh = _getOrCreateSheet('Settings', ['key','value']);
  var obj = _defaultSettings_();
  var rng = sh.getDataRange().getValues();
  rng.shift(); // header
  rng.forEach(function(r){ if (r[0]) obj[String(r[0])] = r[1]; });
  return _json({ok:true, settings: obj});
}
function handleSaveSettings_(p) {
  if (!_checkAuth(p)) return _json({ok:false, error:'unauthorized'});
  var jsonStr = (p.json||'').trim();
  if (!jsonStr) return _json({ok:false, error:'no_json'});
  var obj = JSON.parse(jsonStr);
  var sh = _getOrCreateSheet('Settings', ['key','value']);
  // Clear & rewrite
  sh.clear();
  sh.getRange(1,1,1,2).setValues([['key','value']]);
  var rows = [];
  Object.keys(obj).forEach(function(k){ rows.push([k, String(obj[k]||'')]); });
  if (rows.length) sh.getRange(2,1,rows.length,2).setValues(rows);
  return _json({ok:true});
}

// ---------- Gallery ----------
function _getGalleryFolder_(which) {
  var rootId = PropertiesService.getScriptProperties().getProperty('GALLERY_FOLDER_ID');
  var root;
  if (rootId) {
    try{ root = DriveApp.getFolderById(rootId); } catch(e){ root = null; }
  }
  if (!root) {
    root = DriveApp.createFolder('Hochzeit Galerie');
    PropertiesService.getScriptProperties().setProperty('GALLERY_FOLDER_ID', root.getId());
  }
  var name = which === 'post' ? 'Nach der Hochzeit' : 'Vor der Hochzeit';
  var folders = root.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return root.createFolder(name);
}
function _getGallerySheet_(which) {
  return _getOrCreateSheet(which === 'post' ? 'GalleryPost' : 'GalleryPre', ['id','name','timestamp']);
}
function handleUploadImage_(p, raw) {
  if (!_checkAuth(p)) return _json({ok:false, error:'unauthorized'});
  var which = (p.which||'pre') === 'post' ? 'post' : 'pre';
  var dataURL = p.dataURL || ''; // form-urlencoded carries it in parameter
  if (!dataURL) return _json({ok:false, error:'no_data'});
  var match = dataURL.match(/^data:(image\\/\\w+);base64,(.+)$/);
  if (!match) return _json({ok:false, error:'bad_dataurl'});
  var mime = match[1];
  var b64 = match[2];
  var blob = Utilities.newBlob(Utilities.base64Decode(b64), mime, (p.name||'image.jpg'));
  var folder = _getGalleryFolder_(which);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var sh = _getGallerySheet_(which);
  sh.appendRow([file.getId(), file.getName(), new Date()]);
  return _json({ok:true, id:file.getId()});
}
function handleDeleteImage_(p) {
  if (!_checkAuth(p)) return _json({ok:false, error:'unauthorized'});
  var which = (p.which||'pre') === 'post' ? 'post' : 'pre';
  var id = (p.id||'').trim();
  if (!id) return _json({ok:false, error:'no_id'});
  try{
    DriveApp.getFileById(id).setTrashed(true);
  } catch(e){ /* ignore */ }
  var sh = _getGallerySheet_(which);
  var rng = sh.getDataRange().getValues();
  for (var i=1;i<rng.length;i++){
    if (String(rng[i][0]) === id){ sh.deleteRow(i+1); break; }
  }
  return _json({ok:true});
}
function handleGetGallery_(p) {
  var which = (p.which||'pre') === 'post' ? 'post' : 'pre';
  var sh = _getGallerySheet_(which);
  var rng = sh.getDataRange().getValues();
  rng.shift();
  var exec = ScriptApp.getService().getUrl();
  var items = rng.map(function(r){
    var id = r[0], name = r[1];
    var url = exec + '?type=image&id=' + encodeURIComponent(id);
    return { id:id, name:name, url:url, thumb:url };
  });
  return _json({ok:true, items:items});
}
function handleGetImage_(p) {
  var id = (p.id||'').trim();
  if (!id) return _json({ok:false, error:'no_id'});
  try{
    var file = DriveApp.getFileById(id);
    var blob = file.getBlob();
    var out = ContentService.createBinaryOutput().setBytes(blob.getBytes());
    out.setMimeType(blob.getContentType());
    for (var k in CORS) out.setHeader(k, CORS[k]);
    out.setHeader('Cache-Control','public, max-age=86400');
    return out;
  } catch(e){
    return _json({ok:false, error:'not_found'});
  }
}
