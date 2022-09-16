let correctAnswer;
let numberOfTransactions;
let transactionsAnswered = [];

window.onload = function() {
    generateTask();
    document.getElementById("resolveButton").disabled = true;
}

// erzegut  eine neue Aufgabenstellung
function generateTask() {
    if (randomNumber(0, 1) === 0) {
        correctAnswer = true;
    } else {
        correctAnswer = false;
    }

    document.getElementById("timestampPerStep").hidden = true;
    document.getElementById("transactionTimestamp").hidden = true;

    let scheduleManager = randomize(3, 2, true);
    numberOfTransactions = scheduleManager.transactions.length;
    
    let choiceTable = document.getElementById("choiceTable");

    if (choiceTable.getElementsByTagName("tbody").length !== 0) {
        choiceTable.removeChild(choiceTable.getElementsByTagName("tbody")[0]);
    }

    body = choiceTable.createTBody();
    for (let i = 0; i < scheduleManager.transactions.length; i++) {
        
        let row = body.insertRow();
        let cell = row.insertCell();
        cell.innerHTML = 'T' + scheduleManager.transactions[i].id;
    
        cell = row.insertCell();
        cell.id = scheduleManager.transactions[i].id + "CellYes";
        cell.innerHTML = '<div class="radio"><label><input type="radio" id="' + scheduleManager.transactions[i].id + 'yes" name="' + scheduleManager.transactions[i].id + '" onChange="activateButton(this)"></label></div>';

        cell = row.insertCell();
        cell.id = scheduleManager.transactions[i].id + "CellNo"
        cell.innerHTML = '<div class="radio"><label><input type="radio" id="' + scheduleManager.transactions[i].id + 'no" name="' + scheduleManager.transactions[i].id + '" onChange="activateButton(this)"></label></div>';
    }
}

// Funktion, welche prüft, ob die Antwort korrekt war und die Tabelel und Diagramme einblendet.
function resolve() {
    let correctAnswer = true;
    for (let i = 0; i < numberOfTransactions; i++) {
        if (document.getElementById(scheduleManager.transactions[i].id + "yes").checked === true && scheduleManager.transactions[i].rollback === false) {
            correctAnswer = false;
            document.getElementById(scheduleManager.transactions[i].id + "CellYes").style.backgroundColor = "#f8d7da";
        } else if (document.getElementById(scheduleManager.transactions[i].id + "no").checked === true && scheduleManager.transactions[i].rollback === true) {
            correctAnswer = false;
            document.getElementById(scheduleManager.transactions[i].id + "CellNo").style.backgroundColor = "#f8d7da";
        }
    }

    clearDiagramAndTable();
    fillDiagramAndTable(false);
    document.getElementById("timestampPerStep").hidden = false;
    document.getElementById("transactionTimestamp").hidden = false;

    document.getElementById("resolveButton").hidden = true;
    document.getElementById("question").hidden = true;
    document.getElementById("nextButton").hidden = false;

    if (correctAnswer === true) {
        document.getElementById("correctAnswer").hidden = false;
    } else {
        document.getElementById("wrongAnswer").hidden = false;
    }
}

// blendet die Tabelle und die Diagramme wieder aus und ruft die Funktion zur Erstellung einer neuen Frage auf
function nextQuestion() {
    document.getElementById("question").hidden = false;
    document.getElementById("nextButton").hidden = true;
    document.getElementById("correctAnswer").hidden = true;
    document.getElementById("wrongAnswer").hidden = true;

    document.getElementById("resolveButton").hidden = false;
    document.getElementById("resolveButton").disabled = true;
    transactionsAnswered = [];

    generateTask();
}

function activateButton(element) {
    if (transactionsAnswered.indexOf(element.name) === -1) {
        transactionsAnswered.push(element.name);

        if (transactionsAnswered.length === numberOfTransactions) {
            let button = document.getElementById("resolveButton")
            button.disabled = false;
        }
    }
}


