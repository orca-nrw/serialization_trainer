# Serialisierungstrainer

## Beschreibung
Mit dem Serialisierungstrainer kann das Wissen zur Mehrbenutzersynchronisation in der Datenbanksystemtechnik trainiert werden. Zu den Themen Anomalien, Serialisierung, Zwei-Phasen-Sperrprotokoll, Optimistisches Verfahren und Zeitmarkenverfahren werden Kapitel angeboten, in denen die Themen mit einer kurzen Erklärung visualisiert werden. Zur Kontrolle können zu jedem Thema Übungsaufgaben gelöst werden. Die Aufgaben selber beinhalten immer dieselbe Frage, aber die gezeigten Transaktionen werden zufällig erzeugt und sind nicht fest im System hinterlegt.

## Systemanforderungen
Voraussetzung für die App ist ein gängiger Webbrowser (Firefox, Google Chrome, Microsoft Edge, Opera, Safari) mit aktiviertem JavaScript in einer aktuellen Version.

## Installation
Die Webanwendung kann über GitHub Pages in ihrer Basiskonfiguration ohne Installation über die folgende Web-URL direkt genutzt werden: https://eild-nrw.github.io/serialization_trainer/.
Über die Web-URL ist die Webanwendung immer auf dem neusten Stand und muss nicht von Hand aktualisiert werden.

Alternativ kann das Repository als ZIP-Datei heruntergeladen, auf einem beliebigen Webspace entpackt und durch den Aufruf der enthaltenen `index.html` gestartet werden.
Die ZIP-Variante hat den Vorteil einer von GitHub unabhängigen Version ohne externe Abhängigkeiten.

In einer Lernplattform (z.B. ILIAS oder Moodle) kann die App entweder über die Web-URL, über das Hochladen der ZIP-Datei oder via SCORM integriert werden.

## Anpassbarkeit
Sie haben die Möglichkeit, die angezeigten Themen in den Drop-Downboxen zu modifzieren beziehungsweise ein- oder auszublenden. Dazu öffnen
sie die Datei app/utils/navBarBuilder.js. Dort finden sie im oberen Teil der Datei eine JSON Struktur, welche der Variable navigationVisibilityConfig
zugeordnet wird. In dieser können sie zu den einzelnen Themen das Attribut "visibility" auf false ändern. Dadurch wird dieses Thema dann nicht mehr in
der Auswahl angezeigt und ist für den Benutzer unsichtbar.

## Datenverarbeitung
Es werden an keiner Stelle Benutzer-spezifische Daten verarbeitet. Es handelt sich um reine Selbsttests mit direktem Feedback, was richtig/falsch beantwortet wurde. Es existieren keine Abhängigkeiten zu externen Servern und es findet entsprechend kein Datenaustausch mit anderen Servern statt.

## Hintergrundinformationen
Der Serialisierungstrainer wurde an der Hochschule Bonn-Rhein-Sieg im Rahmen des EILD-Projekts von Frederic Cieslik in seiner Master-Abschlussarbeit auf Basis von HTML, CSS und JavaScript entwickelt und vom Projektmitarbeiter André Kless hier veröffentlicht.

## Kontakt
Wir freuen uns über jedes Feedback und beantworten gern Ihre Fragen. Hierfür können Sie sich jederzeit an André Kless wenden.

Email: andre.kless@h-brs.de | Web: https://www.h-brs.de/de/inf/andre-kless
