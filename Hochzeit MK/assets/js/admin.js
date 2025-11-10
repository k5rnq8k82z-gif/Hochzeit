(function(){
  'use strict';
  var CONFIG = (window.APP_CONFIG || {});
  var SHEET_ENDPOINT = CONFIG.SHEET_ENDPOINT || '';

  function qs(id){ return document.getElementById(id); }
  function token(){ return (qs('admToken').value || '').trim(); }
  function authParams(){ var t = token(); var p = new URLSearchParams(); p.set('token', t); return p; }
  function show(el, ok){ el.textContent = ok ? '✔️ OK' : '❌'; el.className = ok ? 'success' : 'error'; }

  // Token check
  qs('btnCheck').addEventListener('click', function(){
    var hint = qs('admCheck');
    hint.textContent = 'prüfe…'; hint.className = '';
    var url = new URL(SHEET_ENDPOINT); url.searchParams.set('type','ping'); url.searchParams.set('token', token());
    fetch(url.toString()).then(function(r){return r.json();}).then(function(j){ show(hint, j && j.ok === true); })
    .catch(function(){ show(hint, false); });
  });

  // RSVP
  qs('admLoad').addEventListener('click', function(){
    var hint = qs('admHint'); var tbody = document.querySelector('#admTable tbody');
    hint.textContent = 'Lade…'; tbody.innerHTML='';
    var url = new URL(SHEET_ENDPOINT); url.searchParams.set('type','rsvp'); url.searchParams.set('token', token());
    fetch(url.toString()).then(function(r){return r.json();}).then(function(j){
      if (!j || j.ok!==true) throw new Error();
      (j.rows||[]).forEach(function(r){
        var comps = [r.c1name,r.c1age,r.c2name,r.c2age,r.c3name,r.c3age,r.c4name,r.c4age].filter(Boolean).join(' • ');
        var tr = document.createElement('tr');
        [r.timestamp||'', r.name||'', r.attending||'', r.guests||'', comps, r.email||'', r.message||'']
          .forEach(function(val){ var td=document.createElement('td'); td.textContent=val; tr.appendChild(td); });
        tbody.appendChild(tr);
      });
      hint.textContent = 'Einträge: ' + (j.rows||[]).length;
    }).catch(function(){ hint.textContent = 'Fehler beim Laden (TOKEN korrekt?)'; });
  });

  qs('admCsv').addEventListener('click', function(){
    var rows = Array.from(document.querySelectorAll('#admTable tbody tr')).map(function(tr){
      return Array.from(tr.children).map(function(td){ return td.textContent; });
    });
    var header = ['timestamp','name','attending','guests','companions','email','message'];
    function esc(v){ v = String(v==null?'':v); return '"' + v.replace(/"/g,'""') + '"'; }
    var lines = [header.join(',')].concat(rows.map(function(r){ return r.map(esc).join(','); }));
    var blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob); var a=document.createElement('a'); a.href=url; a.download='rsvps.csv';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });

  // Chat load
  qs('admLoadChat').addEventListener('click', function(){
    var hint = qs('admChatHint'); var list = qs('admChatList'); hint.textContent='Lade…'; list.innerHTML='';
    var url = new URL(SHEET_ENDPOINT); url.searchParams.set('type','chat'); url.searchParams.set('token', token());
    fetch(url.toString()).then(function(r){return r.json();}).then(function(j){
      if (!j || j.ok!==true) throw new Error();
      (j.rows||[]).slice(-200).reverse().forEach(function(r){
        var card = document.createElement('div'); card.className='card';
        var title = document.createElement('strong'); title.textContent = r.name || 'Gast';
        var msg = document.createElement('div'); msg.className='hint'; msg.style.marginTop='4px'; msg.textContent = r.message || '';
        card.appendChild(title); card.appendChild(msg); list.appendChild(card);
      });
      hint.textContent = 'Chat-Nachrichten: ' + (j.rows||[]).length;
    }).catch(function(){ hint.textContent = 'Fehler beim Laden (TOKEN korrekt?)'; });
  });

  // Gallery upload & list
  qs('gUpload').addEventListener('click', function(){
    var file = qs('gFile').files[0]; var cap = (qs('gCaption').value||'').trim(); var hint = qs('gHint');
    if (!file){ hint.textContent='Bitte ein Bild wählen.'; hint.className='error'; return; }
    hint.textContent='lade hoch…'; hint.className='';
    var reader = new FileReader();
    reader.onload = function(){
      var base64 = reader.result.split(',')[1] || '';
      var payload = new URLSearchParams();
      payload.set('type', 'upload');
      payload.set('token', token());
      payload.set('filename', file.name);
      payload.set('caption', cap);
      payload.set('mime', file.type || 'image/jpeg');
      payload.set('data', base64);
      fetch(SHEET_ENDPOINT, {
        method:'POST',
        headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},
        body: payload.toString()
      }).then(function(r){return r.json();}).then(function(j){
        if (!j || j.ok!==true) throw new Error();
        hint.textContent='Hochgeladen ✔️'; hint.className='success';
        listGallery();
      }).catch(function(){ hint.textContent='Upload fehlgeschlagen'; hint.className='error'; });
    };
    reader.readAsDataURL(file);
  });

  function listGallery(){
    var list = qs('gList'); var hint = qs('gHint'); list.innerHTML='';
    var url = new URL(SHEET_ENDPOINT); url.searchParams.set('type','gallery'); url.searchParams.set('token', token());
    fetch(url.toString()).then(function(r){return r.json();}).then(function(j){
      if (!j || j.ok!==true) throw new Error();
      (j.items||[]).forEach(function(it){
        var img = document.createElement('img'); img.src = it.url; img.alt = it.caption || 'Foto';
        list.appendChild(img);
      });
      hint.textContent = 'Bilder: ' + (j.items||[]).length; hint.className='';
    }).catch(function(){ hint.textContent='Galerie laden fehlgeschlagen'; hint.className='error'; });
  }
  // auto-list on token check
  qs('btnCheck').addEventListener('click', function(){ setTimeout(listGallery, 400); });

  // Content load/save
  function setVal(id, v){ var el=qs(id); if (el) el.value = v||''; }
  function getVal(id){ var el=qs(id); return el ? (el.value||'') : ''; }

  qs('cLoad').addEventListener('click', function(){
    var hint = qs('cHint'); hint.textContent='Lade…';
    var url = new URL(SHEET_ENDPOINT); url.searchParams.set('type','config'); url.searchParams.set('token', token());
    fetch(url.toString()).then(function(r){return r.json();}).then(function(j){
      if (!j || j.ok!==true) throw new Error();
      var c = j.config || {};
      setVal('c_date', c.date); setVal('c_place', c.place);
      setVal('c_hero', c.hero); setVal('c_hero_sub', c.hero_sub);
      setVal('c_ceremony', c.ceremony); setVal('c_party', c.party);
      setVal('c_dress', c.dress); setVal('c_transport', c.transport);
      setVal('c_lodging', c.lodging); setVal('c_info_lead', c.info_lead);
      setVal('c_gifts', c.gifts); setVal('c_children', c.children); setVal('c_hashtag', c.hashtag);
      hint.textContent='Geladen ✔️'; hint.className='success';
    }).catch(function(){ hint.textContent='Fehler beim Laden (TOKEN korrekt?)'; hint.className='error'; });
  });

  qs('cSave').addEventListener('click', function(){
    var hint = qs('cHint'); hint.textContent='Speichere…'; hint.className='';
    var payload = new URLSearchParams(); payload.set('type','config'); payload.set('token', token());
    ['date','place','hero','hero_sub','ceremony','party','dress','transport','lodging','info_lead','gifts','children','hashtag'].forEach(function(k){
      payload.set(k, getVal('c_'+k));
    });
    fetch(SHEET_ENDPOINT, { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'}, body: payload.toString() })
     .then(function(r){return r.json();}).then(function(j){
      if (!j || j.ok!==true) throw new Error();
      hint.textContent='Gespeichert ✔️'; hint.className='success';
    }).catch(function(){ hint.textContent='Speichern fehlgeschlagen'; hint.className='error'; });
  });

})();