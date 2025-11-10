Hochzeitsseite – MODERN (robuste Galerie + Admin + Chat)
Endpoint: https://script.google.com/macros/s/AKfycbzFiGVXqdeDVQH7cENcb123mg4at0I9Xhjv-D599mkVkqUSMtSygDhgIUmP29PVS9CP/exec
Admin-Passwort (Frontend + Script Properties TOKEN): 030520

Wichtig – Galerie-URLs:
Dein Apps Script soll in 'Gallery' pro Bild mindestens EINES der Felder liefern:
- url (direkter Download/Öffnen)
- ODER webContentLink (von Drive)
- ODER id / fileId (wir bauen automatisch uc?export=download&id=...)

Optional: thumb / thumbnailLink für schnelle Vorschaubilder. Fehlt der Thumb, nutzen wir die Haupt-URL.

Sheets:
- RSVP(timestamp,name,attending,guests,email,message,c1name,c1age,c2name,c2age,c3name,c3age,c4name,c4age,ua)
- Chat(timestamp,name,message,ua)
- Gallery(timestamp,url,thumb,filename,width,height,uploader,webContentLink,thumbnailLink,id)
- Content(key,value)
