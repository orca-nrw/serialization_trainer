# Serialisierungstrainer

## Beschreibung
Mit dem Serialisierungstrainer kann das Wissen zur Mehrbenutzersynchronisation in der Datenbanksystemtechnik trainiert werden.
Zu den Themen Anomalien, Serialisierung, Zwei-Phasen-Sperrprotokoll, Optimistisches Verfahren und Zeitmarkenverfahren werden Kapitel angeboten, in denen die Themen mit einer kurzen Erklärung visualisiert werden.
Zur Kontrolle können zu jedem Thema Übungsaufgaben gelöst werden.
Die Aufgaben selber beinhalten immer dieselbe Frage, aber die gezeigten Transaktionen werden zufällig erzeugt und sind nicht fest im System hinterlegt.

## Systemanforderungen
Voraussetzung für die App ist ein gängiger Webbrowser (z.B. Firefox, Google Chrome, Microsoft Edge oder Safari) mit aktiviertem JavaScript in einer aktuellen Version.

## Installation
Die Webanwendung kann über GitHub Pages in ihrer Basiskonfiguration ohne Installation über die folgende Web-URL direkt genutzt werden: https://orca-nrw.github.io/serialization_trainer/.
Über die Web-URL ist die Webanwendung immer auf dem neusten Stand und muss nicht von Hand aktualisiert werden.

Alternativ kann das Repository als ZIP-Datei heruntergeladen, auf einem beliebigen Webspace entpackt und durch den Aufruf der enthaltenen `index.html` gestartet werden.
Die ZIP-Variante hat den Vorteil einer von GitHub unabhängigen Version ohne externe Abhängigkeiten mit individueller Anpassbarkeit.

Eine dritte Möglichkeit ist ein _Fork_ des Repository, der anschließend über GitHub Pages veröffentlicht wird.
Diese Variante hat den Vorteil, dass kein eigener Webspace benötigt wird und gleichzeitig auch die individuelle Anpassbarkeit gegeben ist.

In einer Lernplattform (z.B. ILIAS oder Moodle) kann die App entweder über die Web-URL oder über das Hochladen der ZIP-Datei integriert werden.

## Anpassbarkeit
Sie haben die Möglichkeit, die angezeigten Themen in den Drop-Downboxen zu modifzieren beziehungsweise ein- oder auszublenden.
Dazu öffnen Sie die Datei [navBarBuilder.js](/app/utils/navBarBuilder.js).
Dort finden sie im oberen Teil der Datei eine JSON Struktur, welche der Variable `navigationVisibilityConfig` zugeordnet wird.
In dieser können sie zu den einzelnen Themen das Attribut `visibility` auf `false` ändern.
Dadurch wird dieses Thema dann nicht mehr in der Auswahl angezeigt und ist für den Benutzer unsichtbar.

Für das Anomalie-Kapitel und die zugehörigen Übungen können in der [configs.js](/app/components/anomaly_trainer/configs.js)
weitreichende individuelle Anpassungen durch das Ändern der dort enthaltenden Konfigurationen vorgenommen werden.

## Datenverarbeitung
In der unveränderten Basiskonfiguration werden an keiner Stelle Benutzer-spezifische Daten verarbeitet.
Es handelt sich um reine Selbsttests mit direktem Feedback, was richtig/falsch beantwortet wurde.
Es existieren keine Abhängigkeiten zu externen Servern und es findet entsprechend kein Datenaustausch mit anderen Servern statt.

## Lizenzen
Der [Serialisierungstrainer](https://github.com/orca-nrw/serialization_trainer) wurde
von Frederic Cieslik im Rahmen
des [EILD-Projekts](https://eild.nrw) an
der [Hochschule Bonn-Rhein-Sieg](https://h-brs.de) entwickelt und
von [André Kless](https://h-brs.de/de/inf/andre-kless) angepasst und hier veröffentlicht.
Dieses Repository enthält Software unter [MIT-Lizenz](/LICENSE) und Content
unter [CC0-Lizenz](https://creativecommons.org/publicdomain/zero/1.0/deed.de),
die verwendeten Logos sind davon ausgenommen.

## Kontakt
Wir freuen uns über jedes Feedback und beantworten gern Ihre Fragen.
Hierfür können Sie sich jederzeit (auch nach dem Ende des EILD-Projekts) an André Kless wenden.

Email: andre.kless@h-brs.de | Web: https://www.h-brs.de/de/inf/andre-kless

![Logos von Projekt, Kooperationspartner und Förderer](/app/img/logos.jpg)
