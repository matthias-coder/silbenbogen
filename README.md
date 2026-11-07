# Silbenbogen

Kleine Lese-App für Erstklässler: Wörter werden in Silben mit einem Bogen gelesen. Läuft als installierbare Web-App (PWA) und funktioniert offline.

## App öffnen

**https://matthias-coder.github.io/silbenbogen/**

Oder mit dem Tablet scannen:

<a href="https://matthias-coder.github.io/silbenbogen/"><img src="assets/qr-silbenbogen.png" alt="QR-Code zur Silbenbogen-App" width="240"></a>

## Entwickeln

```
npm install
npm run dev      # lokaler Entwicklungsserver
npm test         # Tests
npm run build    # Produktions-Build nach dist/
```

## Veröffentlichen

Push auf `main` startet GitHub Actions (Tests, Build) und veröffentlicht `dist/` über GitHub Pages. GitHub Pages muss einmalig auf die Quelle „GitHub Actions“ gestellt werden (Repository Settings → Pages → Build and deployment → Source).

## Auf dem Tablet installieren

Adresse der App in Chrome öffnen (Link oder QR-Code oben), dann Menü → „App installieren“ bzw. „Zum Startbildschirm hinzufügen“. Danach startet die App vom Startbildschirm und läuft auch ohne Internet. Updates werden beim nächsten Start mit Internet automatisch übernommen.

## Bedienung

Die App startet im Auswahlmenü mit allen sechs Stufen und „Alles gemischt“. Beim Lesen zieht das Kind die Silbenbögen, der Erwachsene tippt danach „Gut gelesen“ oder „Nochmal“ (höchstens drei Versuche, im dritten wird daraus „Überspringen“). Schwierige Wörter kommen danach öfter dran, sichere seltener. Wörter, die dreimal beim ersten Versuch gut gelesen wurden, landen im Sammelalbum („Meine Wörter“).

## Elternbereich

Das kleine Zahnrad oben links 3 Sekunden gedrückt halten. Dort stellt man die bekannten Buchstaben und den Namen des Kindes ein und kann den Fortschritt zurücksetzen.

## Ausblick

Geplant für eine spätere Ausbaustufe: Aufnahme von Kontroll-Audio.
