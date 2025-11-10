Hochzeitsseite – Pro (Thailand Flair) – mit Admin, Galerie-Lightbox & Gästebuch

Backend: Google Apps Script (Web-App). In index/admin ist dein Endpoint bereits gesetzt:
https://script.google.com/macros/s/AKfycbxb4kqalumOxwfAQkbOIyI3yUjFNaRo-LJsNOyx6UCHGw2WQ12-rh9sjBgocuDIBbwf/exec

RSVP sendet: name, attending, guests, email, message, c1..c4 (name + age), ua.

Admin & Chat benötigen Apps-Script-Erweiterung:
- Öffne admin.html (unten im Codeblock) -> kopiere in dein Apps Script
- Script Property setzen: TOKEN = dein geheimer Token (für Admin-GET)
- Bereitstellen -> Als Web-App (Ich selbst, Jeder mit dem Link)
- Admin: /admin.html öffnen, Token eingeben, Laden
- Chat: öffentlich lesbar via GET ?type=chat&list=1 (optional absichern)

Deploy: Gesamten Ordner oder ZIP bei https://app.netlify.com/drop hochladen.
