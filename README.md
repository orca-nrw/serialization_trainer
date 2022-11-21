# Serialisierungstrainer

## Beschreibung
Mit dem Serialisierungstrainer kann das Wissen zur Mehrbenutzersynchronisation in der Datenbanksystemtechnik trainiert werden.
Zu den Themen Anomalien, Serialisierung, Zwei-Phasen-Sperrprotokoll, Optimistisches Verfahren und Zeitmarkenverfahren werden Kapitel angeboten, in denen die Themen mit einer kurzen Erklärung visualisiert werden.
Zur Kontrolle können zu jedem Thema Übungsaufgaben gelöst werden.
Die Aufgaben selber beinhalten immer dieselbe Frage, aber die gezeigten Transaktionen werden zufällig erzeugt und sind nicht fest im System hinterlegt.

## Systemanforderungen
Voraussetzung für die App ist ein gängiger Webbrowser (Firefox, Google Chrome, Microsoft Edge, Opera, Safari) mit aktiviertem JavaScript in einer aktuellen Version.

## Installation
Die Webanwendung kann über GitHub Pages in ihrer Basiskonfiguration ohne Installation über die folgende Web-URL direkt genutzt werden: https://eild-nrw.github.io/serialization_trainer/.
Über die Web-URL ist die Webanwendung immer auf dem neusten Stand und muss nicht von Hand aktualisiert werden.

Alternativ kann das Repository als ZIP-Datei heruntergeladen, auf einem beliebigen Webspace entpackt und durch den Aufruf der enthaltenen `index.html` gestartet werden.
Die ZIP-Variante hat den Vorteil einer von GitHub unabhängigen Version ohne externe Abhängigkeiten mit weitreichender individueller Anpassbarkeit.

Eine dritte Möglichkeit ist ein _Fork_ des Repository, der anschließend über GitHub Pages veröffentlicht wird.
Diese Variante hat den Vorteil, dass kein eigener Webspace benötigt wird und gleichzeitig auch die individuelle Anpassbarkeit gegeben ist.

In einer Lernplattform (z.B. ILIAS oder Moodle) kann die App entweder über die Web-URL, über das Hochladen der ZIP-Datei oder als SCORM-Modul integriert werden.

## Anpassbarkeit
Sie haben die Möglichkeit, die angezeigten Themen in den Drop-Downboxen zu modifzieren beziehungsweise ein- oder auszublenden.
Dazu öffnen Sie die Datei [navBarBuilder.js](/app/utils/navBarBuilder.js).
Dort finden sie im oberen Teil der Datei eine JSON Struktur, welche der Variable `navigationVisibilityConfig` zugeordnet wird.
In dieser können sie zu den einzelnen Themen das Attribut `visibility` auf `false` ändern.
Dadurch wird dieses Thema dann nicht mehr in der Auswahl angezeigt und ist für den Benutzer unsichtbar.

Für das Anomalie-Kapitel und die zugehörigen Übungen können in der [configs.js](/app/components/anomaly_trainer/configs.js)
weitere individuelle Anpassungen durch das Ändern der dort enthaltenden Konfigurationen vorgenommen werden.

## Datenverarbeitung
In der unveränderten Basiskonfiguration werden an keiner Stelle Benutzer-spezifische Daten verarbeitet.
Es handelt sich um reine Selbsttests mit direktem Feedback, was richtig/falsch beantwortet wurde.
Es existieren keine Abhängigkeiten zu externen Servern und es findet entsprechend kein Datenaustausch mit anderen Servern statt.

## Lizenzen
Dieses Repository enthält Software und Content.
Bei der Software handelt es sich um freie Software unter der [MIT-Lizenz](/LICENSE).
Beim Content handelt es sich um gemeinfreie Inhalte unter der [CC0-Lizenz](https://creativecommons.org/publicdomain/zero/1.0/deed.de).

## Hintergrundinformationen
Der Serialisierungstrainer wurde an der Hochschule Bonn-Rhein-Sieg im Rahmen des [EILD-Projekts](https://github.com/EILD-nrw) von Frederic Cieslik
in seiner Master-Abschlussarbeit auf Basis von HTML, CSS und JavaScript entwickelt und vom Projektmitarbeiter André Kless angepasst und hier veröffentlicht.

## Kontakt
Wir freuen uns über jedes Feedback und beantworten gern Ihre Fragen.
Hierfür können Sie sich jederzeit (auch nach dem Ende des EILD-Projekts) an den Entwickler André Kless wenden.

Email: andre.kless@h-brs.de | Web: https://www.h-brs.de/de/inf/andre-kless

![Logos von Projekt, Kooperationspartner und Förderer](/app/img/logos.jpg)
