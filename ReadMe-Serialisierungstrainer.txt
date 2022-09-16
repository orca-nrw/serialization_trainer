Informationen zum Serialisierungstrainer.

================================================================================
Releaseinformationen:
================================================================================
v1.0 (28.01.2022): Einreichung der Masterarbeit und damit Release der ersten Version
================================================================================

Willkommen zum Serialisierungstrainer. Mit diesem Programm haben Sie die Möglichkeit selbständig Ihr Wissen zur 
Mehrbenutzersynchronisation in der Datenbanksystemtechnik zu überprüfen. Dafür bietet der Serialisierungstrainer folgende Möglichkeiten.
Zu den Themen Anomalien, Serialisierung, Zwei-Phasen-Sperrprotokoll, Optimistisches Verfahren und Zeitmarkenverfahren werden Kapitel
angeboten, in denen die Themen mit einer kurzen Erklärung visualisiert werden. Diese können dazu genutzt werden, um das eigene Verständnis
zu bestätigen. Zur Kontrolle des eigenen Wissens können Sie zu jedem Thema Übungsaufgaben lösen. Die Aufgaben selber beinhalten immer dieselbe
Frage, aber die gezeigten Transaktionen werden zufällig erzeugt und sind nicht fest im System hinterlegt.


##################################################################################
Konfiguration:
Sie haben die Möglichkeit, die angezeigten Themen in den Drop-Downboxen zu modifzieren beziehungsweise ein- oder auszublenden. Dazu öffnen
sie die Datei app/utils/navBarBuilder.js. Dort finden sie im oberen Teil der Datei eine JSON Struktur, welche der Variable navigationVisibilityConfig
zugeordnet wird. In dieser können sie zu den einzelnen Themen das Attribut "visibility" auf false ändern. Dadurch wird dieses Thema dann nicht mehr in
der Auswahl angezeigt und ist für den Benutzer unsichtbar.