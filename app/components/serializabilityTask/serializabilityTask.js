let correctAnswer;

document.addEventListener('DOMContentLoaded', function(){
    generateTask();
});

// erzegut  eine neue Aufgabenstellung
function generateTask() {
    if (randomNumber(0, 1) === 0) {
        correctAnswer = true;
        randomize(3, 3, true);
    } else {
        correctAnswer = false;
        randomize(3, 3, false);
    }
}

// Funktion, welche prüft, ob die Antwort korrekt war und die Tabelel und Diagramme einblendet.
function resolve() {
    let answer;
    if (document.getElementById("yes").checked) {
        answer = true;
    } else {
        answer = false;
    }

    document.getElementById("resolveButton").hidden = true;
    document.getElementById("question").hidden = true;
    document.getElementById("nextButton").hidden = false;

    document.getElementById("directedGraphContainer").hidden = false;
    document.getElementById("conflictTable").hidden = false;

    if (answer === correctAnswer) {
        document.getElementById("correctAnswer").hidden = false;
    } else {
        document.getElementById("wrongAnswer").hidden = false;
    }
}

// blendet die Tabelle und die Diagramme wieder aus und ruft die Funktion zur Erstellung einer neuen Frage auf
function nextQuestion() {
    document.getElementById("resolveButton").hidden = false;
    document.getElementById("question").hidden = false;
    document.getElementById("nextButton").hidden = true;
    document.getElementById("correctAnswer").hidden = true;
    document.getElementById("wrongAnswer").hidden = true;

    document.getElementById("directedGraphContainer").hidden = true;
    document.getElementById("conflictTable").hidden = true;

    document.getElementById("yes").checked = false;
    document.getElementById("no").checked = false;
    document.getElementById("resolveButton").disabled = true;

    generateTask();
}

function activateButton() {
    let button = document.getElementById("resolveButton")
    button.disabled = false;
}


