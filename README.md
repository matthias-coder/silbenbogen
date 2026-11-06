# Silbenbogen

Kleine Lese-App für Erstklässler: Wörter werden in Silben mit einem Bogen gelesen. Läuft als installierbare Web-App (PWA) und funktioniert offline.

## Entwickeln

```
npm install
npm run dev      # lokaler Entwicklungsserver
npm test         # Tests
npm run build    # Produktions-Build nach dist/
```

## Veröffentlichen

Push auf `main` startet GitHub Actions (Tests, Build) und veröffentlicht `dist/` über GitHub Pages.

## Auf dem Tablet installieren

Adresse der App in Chrome öffnen, dann Menü → „App installieren“ bzw. „Zum Startbildschirm hinzufügen“. Danach startet die App vom Startbildschirm und läuft auch ohne Internet. Updates werden beim nächsten Start mit Internet automatisch übernommen.

## Elternbereich

Das kleine Zahnrad oben links 3 Sekunden gedrückt halten.

## Ausblick

Geplant für eine spätere Ausbaustufe: Aufnahme von Kontroll-Audio.
