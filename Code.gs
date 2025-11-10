/* Code.gs – RSVP + Chat + Content + Galerie (Drive) */
const SHEET_RSVP = 'rsvp';
const SHEET_CHAT = 'chat';
const SHEET_CONTENT = 'content';
const GALLERY_FOLDER_NAME = 'wedding_gallery_public';
const ADMIN_TOKEN = '030520';

// ---------- Ensure helpers ----------
function ensureRsvpSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(SHEET_RSVP);
  if (!sh) sh = ss.insertSheet(SHEET_RSVP);
  const header = ['timestamp','name','attending','guests','email','message','c1name','c1age','c2name','c2age','c3name','c3age','c4name','c4age','ua'];
  const range = sh.getRange(1,1,1,header.length);
  const cur = range.getValues()[0];
  if (header.join('|') !== cur.join('|')) range.setValues([header]);
  return sh;
}
function ensureChatSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(SHEET_CHAT);
  if (!sh) sh = ss.insertSheet(SHEET_CHAT);
  const header = ['timestamp','name','message','ua'];
  const range = sh.getRange(1,1,1,header.length);
  const cur = range.getValues()[0];
  if (header.join('|') !== cur.join('|')) range.setValues([header]);
  return sh;
}
function ensureContentSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(SHEET_CONTENT);
  if (!sh) sh = ss.insertSheet(SHEET_CONTENT);
  const header = ['key','value'];
  const range = sh.getRange(1,1,1,header.length);
  const cur = range.getValues()[0];
  if (header.join('|') !== cur.join('|')) range.setValues([header]);
  return sh;
}
function ensureGalleryFolder_() {
  const folders = DriveApp.getFoldersByName(GALLERY_FOLDER_NAME);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(GALLERY_FOLDER_NAME);
}

// ---------- Web endpoints ----------
function doPost(e) {
  try {
    const params = e.parameter || {};
    const type = (params.type || '').toLowerCase();

    if (type === 'rsvp') {
      const sh = ensureRsvpSheet_();
      const row = [
        new Date(),
        params.name || '',
        params.attending || '',
        params.guests || '',
        params.email || '',
        params.message || '',
        params.c1name || '', params.c1age || '',
        params.c2name || '', params.c2age || '',
        params.c3name || '', params.c3age || '',
        params.c4name || '', params.c4age || '',
        params.ua || ''
      ];
      sh.appendRow(row);
      return json_({ ok:true });
    }

    if (type === 'chat') {
      const sh = ensureChatSheet_();
      const row = [ new Date(), params.name || 'Gast', params.message || '', params.ua || '' ];
      sh.appendRow(row);
      return json_({ ok:true });
    }

    if (type === 'contentset') {
      if ((params.admintoken || '') !== ADMIN_TOKEN) return json_({ ok:false, error:'unauthorized' }, 403);
      const sh = ensureContentSheet_();
      const keys = ['heroTitle','heroSubtitle','welcomeText','dateText','locationText','dresscodeText'];
      const last = Math.max(2, sh.getLastRow());
      if (last > 1) sh.getRange(2,1,last-1,2).clearContent();
      const rows = keys.filter(k => typeof params[k] !== 'undefined').map(k => [k, params[k]]);
      if (rows.length) sh.getRange(2,1,rows.length,2).setValues(rows);
      return json_({ ok:true, written: rows.length });
    }

    if (type === 'galleryupload') {
      if ((params.admintoken || '') !== ADMIN_TOKEN) return json_({ ok:false, error:'unauthorized' }, 403);
      const folder = ensureGalleryFolder_();
      if (!e.postData || !e.postData.type || !e.postData.contents) return json_({ ok:false, error:'no data' }, 400);
      const parts = Utilities.parseMultipart(e.postData.contents, e.postData.type);
      const filePart = parts.find(p => String(p.parameterName) === 'file');
      if (!filePart) return json_({ ok:false, error:'file missing' }, 400);
      const blob = Utilities.newBlob(filePart.data, filePart.contentType, filePart.fileName || 'upload.jpg');
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      const id = file.getId();
      const viewUrl = 'https://drive.google.com/uc?export=view&id=' + id;
      const dlUrl = 'https://drive.google.com/uc?export=download&id=' + id;
      return json_({ ok:true, id, url:viewUrl, downloadUrl: dlUrl });
    }

    return json_({ ok:false, error:'Unknown type' }, 400);
  } catch (err) {
    return json_({ ok:false, error:String(err) }, 500);
  }
}

function doGet(e) {
  try {
    const params = e.parameter || {};
    const type = (params.type || '').toLowerCase();

    if (type === 'chat' && params.list) {
      const sh = ensureChatSheet_();
      const last = Math.max(2, sh.getLastRow());
      const data = last>1 ? sh.getRange(2,1,last-1,4).getValues() : [];
      const rows = data.filter(r => r[1] || r[2]).map(r => ({ timestamp:r[0], name:r[1], message:r[2] }));
      return json_({ ok:true, rows });
    }

    if (type === 'contentget') {
      const sh = ensureContentSheet_();
      const last = Math.max(2, sh.getLastRow());
      const data = last>1 ? sh.getRange(2,1,last-1,2).getValues() : [];
      const rows = data.map(r => ({ key: r[0], value: r[1] }));
      return json_({ ok:true, rows });
    }

    if (type === 'gallery' && params.list) {
      const folder = ensureGalleryFolder_();
      const files = folder.getFiles();
      const rows = [];
      while (files.hasNext()) {
        const f = files.next();
        const id = f.getId();
        rows.push({
          id, name: f.getName(),
          url: 'https://drive.google.com/uc?export=view&id=' + id,
          downloadUrl: 'https://drive.google.com/uc?export=download&id=' + id
        });
      }
      return json_({ ok:true, rows });
    }

    if (type === 'galleryzip') {
      const folder = ensureGalleryFolder_();
      const files = folder.getFiles();
      const blobs = [];
      while (files.hasNext()) {
        const f = files.next();
        const blob = f.getBlob();
        blob.setName(f.getName());
        blobs.push(blob);
      }
      const zip = Utilities.zip(blobs, 'gallery.zip');
      return ContentService
        .createBinaryOutput()
        .setMimeType(ContentService.MimeType.ZIP)
        .setContent(zip.getBytes());
    }

    if (!type) return json_({ ok:true, info:'GAS up. Use POST type=rsvp/chat/contentSet/galleryUpload or GET type=contentGet | type=chat&list=1 | type=gallery&list=1 | type=galleryZip' });

    return json_({ ok:false, error:'Unsupported GET' }, 400);
  } catch (err) {
    return json_({ ok:false, error:String(err) }, 500);
  }
}

function json_(obj, code) {
  const out = ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  if (code) out.setResponseCode(code);
  return out;
}
