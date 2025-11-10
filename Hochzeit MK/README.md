
# Hochzeit Website – GitHub Pages

Diese Version ist für **GitHub Pages** vorbereitet.

## Deploy

1. Neues Repo anlegen (z. B. `hochzeit-site`).
2. Inhalte dieses Ordners ins Repo committen.
3. In GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**  
   - Branch: `main`  
   - Folder: `/root`
4. Nach wenigen Minuten ist die Seite live unter:  
   `https://<DEIN_USERNAME>.github.io/<DEIN_REPO>/`

## Hinweise
- `.nojekyll` ist enthalten, damit keine Jekyll-Verarbeitung stört.
- Alle Pfade sind **relativ**, sodass die Seite auch unter `/REPO` funktioniert.
- Das Backend nutzt **Google Apps Script** (HTTPS, CORS ok).  
  Trage ggf. deine **/exec**-URL in `index.html` und `admin.html` ein.

## Admin
- `admin.html` öffnen → Token setzen → Inhalte/Galerie/RSVP verwalten.
- Für Galerie-ZIP und Bild-Upload muss dein Apps Script die entsprechenden Routen unterstützen.
