Hochzeitsseite – Drop-fertiger Ordner (Stand: 2025-11-10T12:10:18.745717Z)

1) Öffne 'index.html' und trage unten im <script>-Block ein:
   const SHEET_ENDPOINT = "DEINE_GOOGLE_WEBAPP_URL";   // endet auf /exec
   const SHEET_TOKEN    = "DEIN_ADMIN_TOKEN";          // optional – für Admin-Ansicht

2) Lade den gesamten Ordner bei https://app.netlify.com/drop hoch.
   - Das Formular ist für Netlify Forms registriert (Fallback).
   - Mit aktivem JavaScript speichert es zuerst in Google Sheets, sonst Netlify Forms.

3) Admin-Ansicht:
   https://DEINE-NETLIFY-URL/?admin=1&token=DEIN_ADMIN_TOKEN

4) Bilder austauschen in /img/ (hero.jpg, pic1.jpg ...).
