# Hochzeitssite – Komplettpaket (Dark Mode, Galerie, RSVP, Chat)

**Admin-Passwort:** `030520`  
**GAS Web App URL (/exec):** `https://script.google.com/macros/s/AKfycbzFiGVXqdeDVQH7cENcb123mg4at0I9Xhjv-D599mkVkqUSMtSygDhgIUmP29PVS9CP/exec`

## Dateien
- `index.html` – Öffentliche Seite (Infos, RSVP, Galerie, Gästebuch)
- `admin.html` – Versteckter Adminbereich (Texte bearbeiten, Bilder hochladen)
- `styles.css` – Modernes Dark-Theme
- `app.js` – Frontend-Logik (Fetch zur GAS-URL, Rendering)
- `Code.gs` – Google Apps Script (Backend: RSVP, Chat, Content, Gallery inkl. ZIP)
- `README.md` – Diese Anleitung

## Einrichtung
1. Öffne ein Google Sheet (leer reicht) und klicke **Erweiterungen → Apps Script**.
2. Lege dort das **Skript `Code.gs`** an und füge den Inhalt aus `Code.gs` ein.
3. **Deployment:** `Bereitstellen → Neue Bereitstellung → Typ Web-App`  
   - Beschreibung beliebig
   - **Ausführen als:** Du selbst
   - **Wer hat Zugriff:** „Jeder mit dem Link“ (oder „Jeder“)
4. Kopiere die resultierende **/exec-URL** und stelle sicher, dass sie in `index.html` / `admin.html` / `app.js` als `EXEC_URL` gesetzt ist (in diesem Paket ist bereits diese URL eingetragen):  
   `https://script.google.com/macros/s/AKfycbzFiGVXqdeDVQH7cENcb123mg4at0I9Xhjv-D599mkVkqUSMtSygDhgIUmP29PVS9CP/exec`
5. Öffne `index.html` in einem lokalen Webserver (z. B. VS Code „Live Server“), nicht als `file://`, um Browser-Sicherheitsbeschränkungen zu vermeiden.

## Nutzung
- **Texte bearbeiten:** `admin.html` öffnen → Passwort `030520` → Felder speichern.
- **Bilder hochladen:** In `admin.html` unter „Galerie“ Bilder wählen und hochladen.  
  Bilder werden in Drive im Ordner **wedding_gallery_public** gespeichert und öffentlich lesbar.
- **Galerie anzeigen:** `index.html` lädt Bilder automatisch. Einzeldownloads pro Bild und **„Alles herunterladen“** als ZIP: `https://script.google.com/macros/s/AKfycbzFiGVXqdeDVQH7cENcb123mg4at0I9Xhjv-D599mkVkqUSMtSygDhgIUmP29PVS9CP/exec?type=galleryZip`.

## Hinweise & Sicherheit
- Das Admin-Passwort ist **clientseitig**. Für echte Sicherheit solltest du später auf echte Auth setzen (z. B. GAS Session + Email-Whitelist).
- Bilder werden öffentlich abrufbar; lade nur Inhalte hoch, die öffentlich sein dürfen.
