// ##################################################################################
// Konfiguration der Elemente, welche in den Navigationsleiste angezeigt werden sollen.
// Wenn der Wert bei visibility true ist, wird dieses Element in den DropDownMenüs der Kapitel und Übungen auf jeder Seite angezeigt.
// Wenn der Wert bei visibility false ist, wird dieses Element in keinem DropDownMenü mehr angezeigt. Das Element ist für den Benutzer unsichtbar. Es wirkt für den Benutzer, als
// ob es das Kapitel nicht gibt. Dies kann verwendet werden, um zum Beispiel Kapitel auszublenden, welche in der Vorlesungseinheit nicht behandelt werden.

let navigationVisibilityConfig = {
    "anomalies" : 
        { 
            "name" : "Anomalien", 
            "visibility" : true
        },
    "serializability" : 
        { 
            "name" : "Serialisierbarkeit", 
            "visibility" : true
        },
    "2ps" : 
        { 
            "name" : "Zwei-Phasen-Sperrprotokoll", 
            "visibility" : true
        },
    "timestamp" : 
        { 
            "name" : "Zeitmarkenverfahren", 
            "visibility" : true
        },
    "optimistic" : 
        { 
            "name" : "Optimistisches-Verfahren", 
            "visibility" : true
        }
};

// Konfiguration Ende
// ##################################################################################

// Pfad zum verlinkten Inhalt. Ist unterschiedlich von der Startseite aus und den anderen Kapiteln
let referencePath;
if (document.getElementById("startPage")) {
    referencePath = 'app/components';
} else {
    referencePath = '..';
}

// Aufbauen der DropDownMenüs in der Navigationsleiste
for (const key in navigationVisibilityConfig) {
    if (navigationVisibilityConfig[key]['visibility'] === true) {
        document.getElementById("kapitelDropdown").innerHTML += '<li><a class="dropdown-item" href="' + referencePath + '/' + key + '/' + key + '.html">' + navigationVisibilityConfig[key]["name"] + '</a></li>';

        // Ausnahme für die Übungen der Anomalien, da sich diese in drei Teile aufsplitten
        if (key === "anomalies"){
            document.getElementById("uebungenDropdown").innerHTML += '<li><a class="dropdown-item" href="' + referencePath + '/lostUpdateTask/lostUpdateTask.html">Lost Update</a></li>';
            document.getElementById("uebungenDropdown").innerHTML += '<li><a class="dropdown-item" href="' + referencePath + '/nonRepeatableReadTask/nonRepeatableReadTask.html">Non-Repeatable-Read</a></li>';
            document.getElementById("uebungenDropdown").innerHTML += '<li><a class="dropdown-item" href="' + referencePath + '/dirtyReadTask/dirtyReadTask.html">Dirty Read</a></li>';
        } else {
            document.getElementById("uebungenDropdown").innerHTML += '<li><a class="dropdown-item" href="' + referencePath + '/' + key + 'Task/' + key + 'Task.html">' + navigationVisibilityConfig[key]["name"] + '</a></li>';
        }
    }
}


