# Hochzeit Website – Komplettpaket

**Features**  
- RSVP mit Begleitpersonen (Name + Alter)  
- Öffentlicher Chat / Gästebuch  
- Zwei Galerien: *Vor der Hochzeit* & *Nach der Hochzeit* (Admin-Upload, Löschen)  
- Admin-Seite zum **RSVP-Listen**, **Chat** lesen, **Galerie verwalten** und **Texte bearbeiten** (Settings)  
- Mobiles, modernes UI mit Hochzeit/Thailand-Flair

**Konfiguration**  
- Frontend ist bereits auf deinen Endpoint gesetzt:
  - `SHEET_ENDPOINT`: `https://script.google.com/macros/s/AKfycbzFiGVXqdeDVQH7cENcb123mg4at0I9Xhjv-D599mkVkqUSMtSygDhgIUmP29PVS9CP/exec`
  - Admin-Token-Vorwahl: `kim030520maria`

**Backend (Google Apps Script)**  
1. Leeres Apps-Script-Projekt öffnen → Datei `backend/Code.gs` einfügen.  
2. Unter *Project Settings → Script properties* anlegen:  
   - `TOKEN` = `kim030520maria`  
   - (optional) `GALLERY_FOLDER_ID` = *leerlassen*, Script erstellt automatisch einen Ordner „Hochzeit Galerie“.  
3. **Deploy → New deployment → Web app**:  
   - Execute as: *Me*  
   - Who has access: *Anyone*  
   - Deployment-URL = `EXEC_URL` (schon im Frontend eingetragen).  
4. Beim ersten Upload-Befehl legt das Script automatisch:
   - Sheets: `RSVP`, `Chat`, `Settings`, `GalleryPre`, `GalleryPost`  
   - Drive-Ordner „Hochzeit Galerie“ → Unterordner „Vor der Hochzeit“ / „Nach der Hochzeit“

**Deploy**  
- Diese Mappe als ZIP bei **Netlify Drop** hochladen.  
- Public: `index.html`  
- Admin: `admin.html` (Token ist vorausgefüllt, kann aber überschrieben werden).
