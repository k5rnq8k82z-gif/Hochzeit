/* Code.gs – RSVP + Chat kompatibel zu deinem Frontend */

const SHEET_RSVP = 'rsvp';
const SHEET_CHAT = 'chat';

// Sorgt dafür, dass die Header exakt so vorliegen (und erstellt das Sheet bei Bedarf)
function ensureRsvpSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(SHEET_RSVP);
  if (!sh) sh = ss.insertSheet(SHEET_RSVP);
  const header = ['timestamp','name','attending','guests','email','message',
                  'c1name','c1age','c2name','c2age','c3name','c3age','c4name','c4age','ua'];
  const range = sh.getRange(1,1,1,header.length);
  const current = range.getValues()[0];
  // wenn abweichend, Header setzen
  if (header.join('|') !== current.join('|')) {
    range.setValues([header]);
  }
  return sh;
}
function ensureChatSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(SHEET_CHAT);
  if (!sh) sh = ss.insertSheet(SHEET_CHAT);
  const header = ['timestamp','name','message','ua'];
  const range = sh.getRange(1,1,1,header.length);
  const current = range.getValues()[0];
  if (header.join('|') !== current.join('|')) {
    range.setValues([header]);
  }
  return sh;
}

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
      const data = sh.getRange(2,1,last-1,4).getValues(); // timestamp, name, message, ua
      const rows = data
        .filter(r => r[1] || r[2])
        .map(r => ({ timestamp: r[0], name: r[1], message: r[2] }));
      return json_({ ok:true, rows });
    }

    return json_({ ok:false, error:'Unsupported GET' }, 400);
  } catch (err) {
    return json_({ ok:false, error:String(err) }, 500);
  }
}

function json_(obj, code) {
  const out = ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  if (code) { out.setResponseCode(code); }
  return out;
}
