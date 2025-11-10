// Frontend logic
(async function() {
  const EXEC_URL = window.EXEC_URL || "https://script.google.com/macros/s/AKfycbzFiGVXqdeDVQH7cENcb123mg4at0I9Xhjv-D599mkVkqUSMtSygDhgIUmP29PVS9CP/exec";

  const $ = (s) => document.querySelector(s);

  async function loadContent() {
    try {
      const res = await fetch(EXEC_URL + "?type=contentGet");
      const json = await res.json();
      if (!json.ok && !json.rows) return;
      const map = new Map((json.rows||[]).map(x => [x.key, x.value]));
      for (const key of ["heroTitle","heroSubtitle","welcomeText","dateText","locationText","dresscodeText"]) {
        const el = document.getElementById(key);
        if (el && map.has(key)) el.textContent = map.get(key);
      }
    } catch(e) { console.warn(e); }
  }

  async function loadGallery() {
    try {
      const res = await fetch(EXEC_URL + "?type=gallery&list=1");
      const json = await res.json();
      const grid = $("#galleryGrid");
      grid.innerHTML = "";
      (json.rows||[]).forEach(item => {
        const card = document.createElement("div");
        card.className = "gallery-item";
        const img = document.createElement("img");
        img.loading = "lazy";
        img.src = item.url;
        img.alt = item.name || "Foto";
        const meta = document.createElement("div");
        meta.className = "meta";
        const left = document.createElement("div");
        left.textContent = item.name || "Foto";
        const dl = document.createElement("a");
        dl.href = item.downloadUrl || item.url;
        dl.setAttribute("download", item.name || "foto.jpg");
        dl.textContent = "Download";
        meta.appendChild(left);
        meta.appendChild(dl);
        card.appendChild(img);
        card.appendChild(meta);
        grid.appendChild(card);
      });
    } catch(e) { console.warn(e); }
  }

  $("#rsvpForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    fd.append("type", "rsvp");
    fd.append("ua", navigator.userAgent);
    try {
      const res = await fetch(EXEC_URL, { method: "POST", body: fd });
      const json = await res.json();
      $("#rsvpStatus").textContent = json.ok ? "Danke! Wir haben eure Rückmeldung erhalten." : (json.error || "Fehler");
      if (json.ok) e.target.reset();
    } catch(err) {
      $("#rsvpStatus").textContent = "Fehler beim Senden.";
    }
  });

  $("#chatForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    fd.append("type", "chat");
    fd.append("ua", navigator.userAgent);
    try {
      const res = await fetch(EXEC_URL, { method: "POST", body: fd });
      const json = await res.json();
      $("#chatStatus").textContent = json.ok ? "Eintrag gespeichert." : (json.error || "Fehler");
      if (json.ok) { e.target.reset(); await refreshChat(); }
    } catch(err) {
      $("#chatStatus").textContent = "Fehler beim Senden.";
    }
  });

  async function refreshChat() {
    try {
      const res = await fetch(EXEC_URL + "?type=chat&list=1");
      const json = await res.json();
      const list = $("#chatList");
      list.innerHTML = "";
      (json.rows||[]).slice(-50).forEach(r => {
        const item = document.createElement("div");
        item.className = "chat-item";
        const name = document.createElement("div");
        name.className = "name";
        name.textContent = r.name || "Gast";
        const msg = document.createElement("div");
        msg.className = "msg";
        msg.textContent = r.message;
        item.appendChild(name);
        item.appendChild(msg);
        list.appendChild(item);
      });
    } catch(e) { console.warn(e); }
  }

  await loadContent();
  await loadGallery();
  await refreshChat();
})();
