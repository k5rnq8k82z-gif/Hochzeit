(function(){
  'use strict';
  var CONFIG = (window.APP_CONFIG || {});
  var SHEET_ENDPOINT = CONFIG.SHEET_ENDPOINT || '';

  // Splash
  var splash = document.getElementById('splash');
  function hideSplash(){ if (splash) splash.classList.add('hide'); }
  window.addEventListener('load', function(){ setTimeout(hideSplash, 1100); });
  if (splash) splash.addEventListener('click', hideSplash);

  // Chips
  var chips = document.querySelectorAll('[data-chip]');
  for (var i=0;i<chips.length;i++){
    (function(label){
      var input = label.querySelector('input[type="radio"]');
      if (!input) return;
      input.addEventListener('change', function(){
        var parent = label.parentElement;
        if (!parent) return;
        var sibs = parent.querySelectorAll('[data-chip]');
        for (var j=0; j<sibs.length; j++){ sibs[j].dataset.checked = 'false'; }
        label.dataset.checked = 'true';
      });
    })(chips[i]);
  }

  // Lightbox
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lbImg');
  var gal = document.getElementById('gallery');
  if (gal && lb && lbImg){
    gal.addEventListener('click', function(e){
      var t = e.target;
      if (t && t.tagName === 'IMG'){ lbImg.src = t.src; lb.classList.add('show'); }
    });
    var lbClose = document.getElementById('lbClose');
    if (lbClose) lbClose.addEventListener('click', function(){ lb.classList.remove('show'); });
    lb.addEventListener('click', function(e){ if (e.target === lb) lb.classList.remove('show'); });
  }

  // Load Config
  function applyConfig(cfg){
    function set(id, key){ var el=document.getElementById(id); if (el && cfg[key]!=null) el.textContent = cfg[key]; }
    set('cfg-date', 'date');
    set('cfg-date-pill', 'date');
    set('cfg-date-info', 'date');
    set('cfg-hero', 'hero');
    set('cfg-hero-sub', 'hero_sub');
    set('cfg-place', 'place');
    set('cfg-dress', 'dress_pill');
    set('cfg-dress-info', 'dress');
    set('cfg-ceremony', 'ceremony');
    set('cfg-party', 'party');
    set('cfg-transport', 'transport');
    set('cfg-lodging', 'lodging');
    set('cfg-info-lead', 'info_lead');
    set('cfg-gifts', 'gifts');
    set('cfg-children', 'children');
    set('cfg-hashtag', 'hashtag');
  }
  (function loadConfig(){
    try{
      var url = new URL(SHEET_ENDPOINT);
      url.searchParams.set('type', 'config');
      url.searchParams.set('public', '1');
      fetch(url.toString()).then(function(r){return r.json();}).then(function(j){
        if (j && j.ok && j.config){ applyConfig(j.config); }
      }).catch(function(){});
    }catch(_){}
  })();

  // RSVP
  var form = document.getElementById('rsvpForm');
  var statusEl = document.getElementById('status');
  var submitBtn = document.getElementById('submitBtn');
  var resetBtn = document.getElementById('resetBtn');
  function val(id){ var el = document.getElementById(id); return el ? (el.value || '').trim() : ''; }

  if (form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      if (statusEl){ statusEl.textContent = ''; statusEl.className = ''; }

      var name = val('name');
      var email = val('email');
      var message = val('message');
      var guestsSel = document.getElementById('guests');
      var guests = guestsSel ? guestsSel.value : '0';
      var attending = '';
      var radios = form.querySelectorAll('input[name="attending"]');
      for (var i=0;i<radios.length;i++){ if (radios[i].checked){ attending = radios[i].value; break; } }
      var privacy = document.getElementById('privacy');
      var privacyOK = !!(privacy && privacy.checked);

      if (!name || !attending || !privacyOK){
        if (statusEl){ statusEl.textContent = 'Bitte fülle Name, Teilnahme & Datenschutz aus.'; statusEl.className = 'error'; }
        return;
      }

      var payload = new URLSearchParams();
      payload.set('type', 'rsvp');
      payload.set('name', name);
      payload.set('email', email);
      payload.set('message', message);
      payload.set('guests', guests);
      payload.set('attending', attending);
      payload.set('c1name', val('c1name')); payload.set('c1age', val('c1age'));
      payload.set('c2name', val('c2name')); payload.set('c2age', val('c2age'));
      payload.set('c3name', val('c3name')); payload.set('c3age', val('c3age'));
      payload.set('c4name', val('c4name')); payload.set('c4age', val('c4age'));
      payload.set('ua', navigator.userAgent);

      if (submitBtn) submitBtn.disabled = true;
      if (statusEl){ statusEl.textContent = 'Sende …'; statusEl.className = ''; }

      fetch(SHEET_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: payload.toString()
      })
      .then(function(res){ if (!res.ok) throw new Error('HTTP '+res.status); return res.json().catch(function(){ return {ok:true}; }); })
      .then(function(j){
        if (!j || j.ok !== true) throw new Error('Antwort nicht bestätigt');
        if (statusEl){
          statusEl.textContent = (attending === 'ja') ? 'Danke für deine Zusage! 🎉' : 'Schade, aber danke fürs Bescheid sagen!';
          statusEl.className = 'success';
        }
        form.reset();
        var chipLabels = form.querySelectorAll('[data-chip]');
        for (var k=0;k<chipLabels.length;k++){ chipLabels[k].dataset.checked = 'false'; }
      })
      .catch(function(err){
        if (statusEl){ statusEl.textContent = 'Speichern fehlgeschlagen – bitte später erneut probieren.'; statusEl.className = 'error'; }
        console.error(err);
      })
      .finally(function(){ if (submitBtn) submitBtn.disabled = false; });
    });
  }
  if (resetBtn){
    resetBtn.addEventListener('click', function(){
      if (form) form.reset();
      var chipLabels = document.querySelectorAll('[data-chip]');
      for (var k=0;k<chipLabels.length;k++){ chipLabels[k].dataset.checked = 'false'; }
      if (statusEl){ statusEl.textContent = ''; statusEl.className = ''; }
    });
  }

  // Chat (public)
  var chatName = document.getElementById('chatName');
  var chatText = document.getElementById('chatText');
  var chatSend = document.getElementById('chatSend');
  var chatList = document.getElementById('chatList');
  var chatStatus = document.getElementById('chatStatus');

  function renderMsg(name, msg){
    var div = document.createElement('div');
    div.className = 'bubble';
    var n = document.createElement('div'); n.className = 'name'; n.textContent = name || 'Gast';
    var m = document.createElement('div'); m.className = 'msg'; m.textContent = msg || '';
    div.appendChild(n); div.appendChild(m);
    return div;
  }

  function loadChat(){
    if (!chatList) return;
    chatList.innerHTML = '';
    var url = new URL(SHEET_ENDPOINT);
    url.searchParams.set('type', 'chat');
    url.searchParams.set('list', '1');
    fetch(url.toString(), { method: 'GET' })
      .then(function(res){ return res.json(); })
      .then(function(j){
        if (!j || j.ok !== true) throw new Error('Fehler');
        var rows = (j.rows || []).slice(-50);
        for (var i=0;i<rows.length;i++){
          var r = rows[i];
          chatList.appendChild(renderMsg(r.name || 'Gast', r.message || ''));
        }
      })
      .catch(function(){ if (chatStatus) chatStatus.textContent = 'Chat laden nicht möglich.'; });
  }

  if (chatSend){
    chatSend.addEventListener('click', function(){
      if (!chatName || !chatText) return;
      var n = (chatName.value || '').trim();
      var t = (chatText.value || '').trim();
      if (!n || !t){ if (chatStatus) chatStatus.textContent = 'Bitte Name und Nachricht eingeben.'; return; }
      var payload = new URLSearchParams();
      payload.set('type', 'chat');
      payload.set('name', n);
      payload.set('message', t);
      payload.set('ua', navigator.userAgent);
      fetch(SHEET_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: payload.toString()
      })
      .then(function(res){ if (!res.ok) throw new Error('HTTP '+res.status); return res.json().catch(function(){ return {ok:true}; }); })
      .then(function(j){
        chatText.value = '';
        if (chatStatus) chatStatus.textContent = 'Gesendet 💬';
        loadChat();
      })
      .catch(function(){ if (chatStatus) chatStatus.textContent = 'Chat speichern fehlgeschlagen.'; });
    });
    loadChat();
  }

  // Dynamic gallery (from backend)
  (function loadGallery(){
    try{
      var url = new URL(SHEET_ENDPOINT);
      url.searchParams.set('type', 'gallery');
      url.searchParams.set('list', '1');
      fetch(url.toString()).then(function(r){return r.json();}).then(function(j){
        if (!j || !j.ok || !j.items) return;
        var cont = document.getElementById('gallery'); if (!cont) return;
        // append after placeholders
        for (var i=0;i<j.items.length;i++){
          var it = j.items[i]; if (!it.url) continue;
          var img = document.createElement('img'); img.src = it.url; img.alt = (it.caption||'Foto');
          cont.appendChild(img);
        }
      }).catch(function(){});
    }catch(_){}
  })();
})();