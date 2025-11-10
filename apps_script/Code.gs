/** Wedding Backend – OOTB
 * Sheets:
 *  - RSVPs (timestamp, name, attending, guests, email, message, c1name, c1age, c2name, c2age, c3name, c3age, c4name, c4age, ua)
 *  - Chat  (timestamp, name, message, ua)
 *  - Config (key, value)
 * Drive:
 *  - Script Property GALLERY_FOLDER = Drive-Ordner-ID
 * Security:
 *  - Script Property TOKEN (optional). Fallback below.
 */
const FALLBACK_TOKEN = 'kim030520maria';
function _token(){ return PropertiesService.getScriptProperties().getProperty('TOKEN') || FALLBACK_TOKEN; }
function _galleryFolderId(){ return PropertiesService.getScriptProperties().getProperty('GALLERY_FOLDER') || ''; }
function _json(obj){ return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function _authOK(e){ const t = ((e.parameter.token || '') + '').trim(); return t && t === _token(); }
function doOptions(e){ return _json({ ok:true }); }
function doGet(e){ try{ const type=(e.parameter.type||'').toLowerCase();
  if (type==='ping') return _json({ok:_authOK(e)});
  if (type==='rsvp'){ if (!_authOK(e) && !e.parameter.list) return _json({ok:false,error:'unauthorized'}); return _json({ok:true, rows:_readRSVPs()}); }
  if (type==='chat'){ if (!_authOK(e) && !e.parameter.list) return _json({ok:false,error:'unauthorized'}); return _json({ok:true, rows:_readChat()}); }
  if (type==='gallery'){ if (!_authOK(e) && !e.parameter.list) return _json({ok:false,error:'unauthorized'}); return _json({ok:true, items:_listGallery()}); }
  if (type==='config'){ if (!_authOK(e) && !e.parameter.public) return _json({ok:false,error:'unauthorized'}); return _json({ok:true, config:_readConfig()}); }
  return _json({ok:false,error:'unknown type'});
}catch(err){ return _json({ok:false,error:String(err)}); } }
function doPost(e){ try{ var p=e.parameter||{}; var type=(p.type||'').toLowerCase();
  if (type==='rsvp'){ _appendRSVP({name:p.name||'',attending:p.attending||'',guests:p.guests||'',email:p.email||'',message:p.message||'',c1name:p.c1name||'',c1age:p.c1age||'',c2name:p.c2name||'',c2age:p.c2age||'',c3name:p.c3name||'',c3age:p.c3age||'',c4name:p.c4name||'',c4age:p.c4age||'',ua:p.ua||''}); return _json({ok:true}); }
  if (type==='chat'){ _appendChat({name:p.name||'',message:p.message||'',ua:p.ua||''}); return _json({ok:true}); }
  if (type==='upload'){ if (!_authOK(e)) return _json({ok:false,error:'unauthorized'});
    const folderId=_galleryFolderId(); if (!folderId) return _json({ok:false,error:'no GALLERY_FOLDER set'});
    const bytes=Utilities.base64Decode(p.data||''); const blob=Utilities.newBlob(bytes, p.mime||'image/jpeg', p.filename||('upload_'+Date.now()+'.jpg'));
    const folder=DriveApp.getFolderById(folderId); const file=folder.createFile(blob);
    try{ file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); }catch(_){
    }
    _appendGallery(file.getId(), file.getUrl(), p.caption||''); return _json({ok:true, id:file.getId(), url:'https://drive.google.com/uc?export=view&id='+file.getId()});
  }
  if (type==='config'){ if (!_authOK(e)) return _json({ok:false,error:'unauthorized'});
    const keys=['date','place','hero','hero_sub','ceremony','party','dress','transport','lodging','info_lead','gifts','children','hashtag']; const data={};
    keys.forEach(function(k){ data[k]=p[k]||''; }); _writeConfig(data); return _json({ok:true});
  }
  return _json({ok:false,error:'unknown type'});
}catch(err){ return _json({ok:false,error:String(err)}); } }
function _sheet(name){ const ss=SpreadsheetApp.getActiveSpreadsheet(); var sh=ss.getSheetByName(name); if(!sh) sh=ss.insertSheet(name); return sh; }
function _readRSVPs(){ const sh=_sheet('RSVPs'); const v=sh.getDataRange().getValues(); const out=[]; for(var i=1;i<v.length;i++){ var r=v[i]; out.push({timestamp:r[0],name:r[1],attending:r[2],guests:r[3],email:r[4],message:r[5],c1name:r[6],c1age:r[7],c2name:r[8],c2age:r[9],c3name:r[10],c3age:r[11],c4name:r[12],c4age:r[13]}); } return out; }
function _appendRSVP(d){ const sh=_sheet('RSVPs'); if (sh.getLastRow()===0) sh.appendRow(['timestamp','name','attending','guests','email','message','c1name','c1age','c2name','c2age','c3name','c3age','c4name','c4age','ua']); sh.appendRow([new Date(), d.name,d.attending,d.guests,d.email,d.message,d.c1name,d.c1age,d.c2name,d.c2age,d.c3name,d.c3age,d.c4name,d.c4age,d.ua]); }
function _readChat(){ const sh=_sheet('Chat'); const v=sh.getDataRange().getValues(); const out=[]; for(var i=1;i<v.length;i++){ var r=v[i]; out.push({timestamp:r[0],name:r[1],message:r[2]}); } return out; }
function _appendChat(d){ const sh=_sheet('Chat'); if (sh.getLastRow()===0) sh.appendRow(['timestamp','name','message','ua']); sh.appendRow([new Date(), d.name, d.message, d.ua]); }
function _readConfig(){ const sh=_sheet('Config'); const v=sh.getDataRange().getValues(); const m={}; for(var i=1;i<v.length;i++){ m[(v[i][0]||'').toString()]=(v[i][1]||'').toString(); }
  return { date:m.date||'20. Juni 2026', place:m.place||'Koh Samui', hero:m.hero||'Willkommen zu unserer Hochzeit in Thailand', hero_sub:m.hero_sub||'Palmen, Sonne, Meer …', ceremony:m.ceremony||'14:00 Uhr, Strandzeremonie Koh Samui', party:m.party||'ab 16:00 Uhr, Beach Resort', dress:m.dress||'Festlich, sommerlich', dress_pill:(m.dress?('💌 Dresscode: '+m.dress):'💌 Dresscode: Festlich & sommerlich'), transport:m.transport||'Shuttle vom Hotel • Taxis verfügbar', lodging:m.lodging||'Resort-Kontingent (Stichwort „Hochzeit Kim“)', info_lead:m.info_lead||'Thailand-Flair, Palmen & Sonnenuntergang – wir freuen uns auf einen unvergesslichen Tag mit euch! 🇹🇭🌅', gifts:m.gifts||'Eure Anwesenheit ist unser Geschenk. Wer mag: Reisekasse 💞', children:m.children||'Sehr gern! Kinderbetreuung am Strand.', hashtag:m.hashtag||'Nach der Feier füllen wir die Galerie. Hashtag #KimUndPartnerInThailand' }; }
function _writeConfig(d){ const sh=_sheet('Config'); if (sh.getLastRow()===0) sh.appendRow(['key','value']); const v=sh.getDataRange().getValues(); const map={}; for(var i=1;i<v.length;i++){ map[(v[i][0]||'').toString()] = i+1; } Object.keys(d).forEach(function(k){ if(map[k]){ sh.getRange(map[k],2).setValue(d[k]); } else { sh.appendRow([k,d[k]]); } }); }
function _appendGallery(id,url,caption){ const sh=_sheet('Gallery'); if (sh.getLastRow()===0) sh.appendRow(['timestamp','fileId','url','caption']); sh.appendRow([new Date(), id, url, caption||'' ]); }
function _listGallery(){ const sh=_sheet('Gallery'); const v=sh.getDataRange().getValues(); const out=[]; for(var i=1;i<v.length;i++){ out.push({ timestamp:v[i][0], id:v[i][1], url:'https://drive.google.com/uc?export=view&id='+v[i][1], caption:v[i][3] }); } return out; }
