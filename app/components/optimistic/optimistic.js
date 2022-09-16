// Schedulemanager für das optimistische Verfahren, mit der Logik, um neue Transaktionsschritte hinzuzufügen
class OptimisticScheduleManager extends ScheduleManager {
 
    constructor(ruleName) {
        super(ruleName);
    }

    addNewStep(task, transaction, dbObject, lastStep) {
        let newTask;
        if (task === BOT) {
            newTask = new Task().bot();
            transaction.readPhase = true;
            transaction.started = true;
        } else if (task === ENDREADPHASE) {
            transaction.readPhase = false;
            return lastStep;
        } else if (task === READ) {
            newTask = new Task().read(dbObject);
            transaction.dbObjectsRead.push(dbObject);
        } else if (task === WRITE) {
            newTask = new Task().write(dbObject);
            transaction.dbObjectsWrote.push(dbObject);
        } else if (task === COMMIT) {
            newTask = new Task().commit();
            transaction.finished = true;

            // andere Transaktione, welche aktuell in der lesephase sind mitteilen, welche Objekte diese Transaktion beschrieben hat
            for (let i = 0; i < this.transactions.length; i++) {
                if (!this.transactions[i].finished) {
                    this.transactions[i].otherTransactionsFinished.push(transaction);
                    for (let j = 0; j < transaction.dbObjectsWrote.length; j++) {
                        this.transactions[i].dbObjectsWroteOfOtherTransactions.push(transaction.dbObjectsWrote[j]);
                    }
                }
            }

            // validieren
            for (let i = 0; i < transaction.dbObjectsWroteOfOtherTransactions.length; i++) {
                for (let j = 0; j < transaction.dbObjectsRead.length; j++) {
                    if (transaction.dbObjectsWroteOfOtherTransactions[i].id === transaction.dbObjectsRead[j].id) {
                        transaction.validationFailed = true;
                    }
                }
            }
        } else if (task === VALIDATEPHASE) {
            newTask = new Task().validatePhase();
        } else if (task === WRITEPHASE) {
            newTask = new Task().writePhase();
        }

        let newStep;
        if (!lastStep) {
            newStep = new TransactionStep(transaction, newTask);
        } else {
            newStep = lastStep;
            newStep.task = newTask;
            newStep.transaction = transaction;
        }

        this.schedule.push(newStep);
        return newStep.createNextStep();
    }
}

let scheduleManager;
//scheduleManager.addTransaction();
//scheduleManager.addTransaction();

//let a = scheduleManager.addDbObject();
//let b = scheduleManager.addDbObject();

/*let nextStep = scheduleManager.addNewStep(BOT, scheduleManager.transactions[0]);
nextStep = scheduleManager.addNewStep(READ, scheduleManager.transactions[0], a, nextStep);
nextStep = scheduleManager.addNewStep(BOT, scheduleManager.transactions[1], null, nextStep);
nextStep = scheduleManager.addNewStep(READ, scheduleManager.transactions[0], b, nextStep);
nextStep = scheduleManager.addNewStep(ENDREADPHASE, scheduleManager.transactions[0], null, nextStep);
nextStep = scheduleManager.addNewStep(WRITE, scheduleManager.transactions[0], b, nextStep);
nextStep = scheduleManager.addNewStep(COMMIT, scheduleManager.transactions[0], null, nextStep);
nextStep = scheduleManager.addNewStep(READ, scheduleManager.transactions[1], b, nextStep);
nextStep = scheduleManager.addNewStep(ENDREADPHASE, scheduleManager.transactions[1], null, nextStep);
nextStep = scheduleManager.addNewStep(WRITE, scheduleManager.transactions[1], a, nextStep);
nextStep = scheduleManager.addNewStep(COMMIT, scheduleManager.transactions[1], null, nextStep);*/

let canvas = document.getElementById('optimisticDiagram');
let ctx = canvas.getContext('2d');

// Distanz zwischen den einzlnen Schritten in der Skale
let lineMarkerDistance = 50;

// Höhe der querstriche auf der Skala
let lineMarkerheight = 10;

// Größe der Kreise
let arcRadius = 10;

// Höhe der Boxen unterhalb der 
let phaseBoxHeight = 30;

// Startabstand zur oberen Kante des Zeichenbereichs
let y = 70;

// Startabstand zur linken Kante des Zeichenbereichts
let startX = 30;

// keine ahnung, ist aber wichtig
let transactionIdWidth = 40;

randomize(3, 2);

// erzeugt eine Zufallskonstellation für das optimistische Verfahren
// numberofTransactions: Anzahl der Transaktionen
// numberOfDbObjects: Anzahl der Datenbankobjekte
// isQuestion: Angabe, ob die Beispielkonstellation für eine Fragestellung erzeugt werden soll
function randomize(numberofTransactions, numberOfDbObjects, isQuestion) {
    clearDiagramAndTable();

    if (!numberofTransactions) {
        let min = 3;
        let max = 6;
        numberofTransactions = Math.floor(Math.random()*(max-min+1)+min);
    }
    if (!numberOfDbObjects) {
        let min = 3;
        let max = 4;
        numberOfDbObjects = Math.floor(Math.random()*(max-min+1)+min);
    }

    scheduleManager = new OptimisticScheduleManager(RULENAME_OPTIMISTIC);
    for (let i = 0; i < numberofTransactions; i++) {
        scheduleManager.addTransaction();
    }

    for (let i = 0; i < numberOfDbObjects; i++) {
        scheduleManager.addDbObject();
    }

    let activeTransactions = [];
    for (let i = 0; i < scheduleManager.transactions.length; i++) {
        activeTransactions.push(scheduleManager.transactions[i]);
    }

    let numberOfUnfinishedTransactions = numberofTransactions;
    let nextStep;
    while (activeTransactions.length > 0) {
        let transactionIndex = randomNumber(0, activeTransactions.length - 1);
        let chosenTransaction = activeTransactions[transactionIndex];
        if (!chosenTransaction.started) {
            nextStep = scheduleManager.addNewStep(BOT, chosenTransaction, null, nextStep);
        } else {
            if (chosenTransaction.dbObjectsRead.length === 0 && chosenTransaction.dbObjectsWrote.length === 0) {
                let dbObjectIndex = randomNumber(0, numberOfDbObjects - 1);
                let chosenDbObject = scheduleManager.dbObjects[dbObjectIndex];
                if (randomNumber(0, 100) < 70) {
                    nextStep = scheduleManager.addNewStep(READ, chosenTransaction, chosenDbObject, nextStep);
                } else {
                    nextStep = scheduleManager.addNewStep(WRITE, chosenTransaction, chosenDbObject, nextStep);
                }
                
            } else {
                // wenn noch nicht alle möglichen dbObjekte gelesen wurden und der Zufall es so will, Lese ein datenbankobject 
                if (chosenTransaction.dbObjectsRead.length !== numberOfDbObjects && chosenTransaction.dbObjectsWrote.length !== numberOfDbObjects && randomNumber(0, 100) < 70) {
                    
                    if (randomNumber(0, 1) === 0) {
                        let newDbObjectToRead;
                        let dbObjectAlreadyRead;
                        
                        do {
                            dbObjectAlreadyRead = false;
                            let dbObjectIndex = randomNumber(0, numberOfDbObjects - 1);
                            newDbObjectToRead = scheduleManager.dbObjects[dbObjectIndex];
                            for (let i = 0; i < chosenTransaction.dbObjectsRead.length; i++) {
                                if (chosenTransaction.dbObjectsRead[i].id === newDbObjectToRead.id) {
                                    dbObjectAlreadyRead = true;
                                    break;
                                }
                            }
                        } while (dbObjectAlreadyRead);
                        nextStep = scheduleManager.addNewStep(READ, chosenTransaction, newDbObjectToRead, nextStep);
                    } else {
                        let newDbObjectToWrite;
                        let dbObjectAlreadyWrote;
                        do {
                            dbObjectAlreadyWrote = false;
                            let dbObjectIndex = randomNumber(0, numberOfDbObjects - 1);
                            newDbObjectToWrite = scheduleManager.dbObjects[dbObjectIndex];
                            for (let i = 0; i < chosenTransaction.dbObjectsWrote.length; i++) {
                                if (chosenTransaction.dbObjectsWrote[i].id === newDbObjectToWrite.id) {
                                    dbObjectAlreadyWrote = true;
                                    break;
                                }
                            }
                        } while (dbObjectAlreadyWrote);
                        nextStep = scheduleManager.addNewStep(WRITE, chosenTransaction, newDbObjectToWrite, nextStep);
                    }

                // sonst beende die Lesephase
                } else {
                    // mit einer niedrigen wahrscheinlichkeit die transaktion beenden ohne auf ein dbobjekt zu schreiben
                    nextStep = scheduleManager.addNewStep(COMMIT, chosenTransaction, null, nextStep);
                    nextStep = scheduleManager.addNewStep(VALIDATEPHASE, chosenTransaction, null, nextStep);
                    nextStep = scheduleManager.addNewStep(WRITEPHASE, chosenTransaction, null, nextStep);
                    activeTransactions.splice(transactionIndex, 1);
                }
            }
        }
    }

    fillDiagramAndTable(isQuestion);
    return scheduleManager;
}

// befüllt das Diagramm und die Tabelle. Wenn es sich hier um eine Frage in einer Aufgabenstellung handelt, werden die fehlgeschlagenen Validierungen
// nicht als solche angezeigt (würde es dem Benutzer zu einfach machen)
function fillDiagramAndTable(isQuestion) {
    ctx.font = "10pt Arial";
    for (let i = 0; i < scheduleManager.transactions.length; i++) {
        ctx.fillStyle = 'black';
        let startReadPhaseX = 0;
        let endReadPhaseX = 0;
        let transactionEndX = 0

        let originalStartX = startX;
        ctx.fillText("T" + scheduleManager.transactions[i].id, startX - ctx.measureText("T" + scheduleManager.transactions[i].id, startX).width / 2, y);
        startX = startX + transactionIdWidth;

        for (let j = 0; j < scheduleManager.schedule.length; j++) {
            if (scheduleManager.schedule[j].transaction.id === scheduleManager.transactions[i].id) {
                if (scheduleManager.schedule[j].task.task === BOT) {
                    ctx.beginPath();
                    ctx.arc(startX + j * lineMarkerDistance, y, arcRadius, 0, 2 * Math.PI);
                    ctx.stroke();
                    ctx.fillText(BOT, startX + j * lineMarkerDistance - ctx.measureText(BOT).width / 2, y - lineMarkerheight - 15);
                    startReadPhaseX = startX + j * lineMarkerDistance;
                } else {
                    ctx.lineTo(startX + j * lineMarkerDistance, y);
                    ctx.lineTo(startX + j * lineMarkerDistance, y - lineMarkerheight);
                    ctx.lineTo(startX + j * lineMarkerDistance, y + lineMarkerheight);
                    ctx.lineTo(startX + j * lineMarkerDistance, y);
                    ctx.stroke();
                    if (scheduleManager.schedule[j].task.task === COMMIT && endReadPhaseX === 0) {
                        endReadPhaseX = startX + j * lineMarkerDistance;
                    }
                }

                if (scheduleManager.schedule[j].task.task === COMMIT) {
                    ctx.beginPath();
                    //ctx.arc(startX + j * lineMarkerDistance, y, arcRadius, 0, 2 * Math.PI);
                    //ctx.fill();
                    //ctx.fillText("EOT", startX + j * lineMarkerDistance - ctx.measureText("EOT").width / 2, y - lineMarkerheight - 15);
                    transactionEndX = startX + j * lineMarkerDistance;
                } else if (scheduleManager.schedule[j].task.task !== VALIDATEPHASE && scheduleManager.schedule[j].task.task !== WRITEPHASE) {
                    ctx.fillText(scheduleManager.schedule[j].task.toString(), startX + j * lineMarkerDistance - ctx.measureText(scheduleManager.schedule[j].task.toString()).width / 2, y - lineMarkerheight - 15);
                }

                if (scheduleManager.schedule[j].task.task === WRITEPHASE) { 
                    transactionEndX = startX + j * lineMarkerDistance;
                }
            }
        }

        ctx.beginPath();
        ctx.moveTo(startReadPhaseX, y);
        ctx.lineTo(startReadPhaseX, y + phaseBoxHeight);
        ctx.lineTo(endReadPhaseX, y + phaseBoxHeight);
        ctx.lineTo(endReadPhaseX, y);
        ctx.fillStyle = 'rgb(220, 220, 220)';
        ctx.lineTo(startReadPhaseX, y);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = 'white';
        ctx.arc(startReadPhaseX, y, arcRadius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'black';
        ctx.fillText('R', startReadPhaseX + (endReadPhaseX - startReadPhaseX) / 2 - ctx.measureText('R').width / 2, y + phaseBoxHeight / 2 + 5);

        ctx.beginPath();
        ctx.fillStyle = 'lightblue';
        ctx.moveTo(endReadPhaseX, y);
        ctx.lineTo(endReadPhaseX, y + phaseBoxHeight);
        ctx.lineTo(endReadPhaseX + lineMarkerDistance, y + phaseBoxHeight);
        ctx.lineTo(endReadPhaseX + lineMarkerDistance, y);
        ctx.lineTo(endReadPhaseX, y);
        ctx.fill();

        ctx.fillStyle = 'black';
        ctx.fillText('V', endReadPhaseX + lineMarkerDistance / 2 - ctx.measureText('V').width / 2, y + phaseBoxHeight / 2 + 5);

        if (!scheduleManager.transactions[i].validationFailed || isQuestion === true) {
            ctx.beginPath();
            ctx.fillStyle = 'lightyellow';
            ctx.moveTo(endReadPhaseX + lineMarkerDistance, y);
            ctx.lineTo(endReadPhaseX + lineMarkerDistance, y + phaseBoxHeight);
            ctx.lineTo(transactionEndX, y + phaseBoxHeight);
            ctx.lineTo(transactionEndX, y);
            ctx.lineTo(endReadPhaseX + lineMarkerDistance, y);
            ctx.fill();
            ctx.fillStyle = 'black';
            ctx.fillText('S', endReadPhaseX + lineMarkerDistance / 2 * 3 - ctx.measureText('S').width / 2, y + phaseBoxHeight / 2 + 5);

            ctx.beginPath();
            ctx.arc(transactionEndX, y, arcRadius, 0, 2 * Math.PI);
            ctx.fillText("EOT", transactionEndX - ctx.measureText("EOT").width / 2, y - lineMarkerheight - 15);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.fillStyle = 'lightsalmon';
            ctx.moveTo(endReadPhaseX + lineMarkerDistance, y);
            ctx.lineTo(endReadPhaseX + lineMarkerDistance, y + phaseBoxHeight);
            ctx.lineTo(transactionEndX, y + phaseBoxHeight);
            ctx.lineTo(transactionEndX, y);
            ctx.lineTo(endReadPhaseX + lineMarkerDistance, y);
            ctx.fill();

            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(transactionEndX, y, arcRadius, 0, 2 * Math.PI);
            ctx.fillText("EOT", transactionEndX - ctx.measureText("EOT").width / 2, y - lineMarkerheight - 15);
            ctx.fill();
            ctx.fillText('RB', endReadPhaseX + lineMarkerDistance * 2 - ctx.measureText('ROLLBACK').width / 2, y + phaseBoxHeight / 2 + 5);
        }

        startX = originalStartX;
        y = y + 100;
    }

    ctx.beginPath();
    ctx.moveTo(startX  + transactionIdWidth + transactionIdWidth - 15, y);
    ctx.lineTo(startX  + transactionIdWidth, y);
    ctx.stroke();
    for (let i = 0; i < scheduleManager.schedule.length; i++) {
        ctx.lineTo(startX + transactionIdWidth + lineMarkerDistance * i, y - lineMarkerheight);
        ctx.lineTo(startX + transactionIdWidth + lineMarkerDistance * i, y + lineMarkerheight);
        ctx.moveTo(startX + transactionIdWidth + lineMarkerDistance * i, y);
        ctx.lineTo(startX + transactionIdWidth + lineMarkerDistance * i + lineMarkerDistance, y);
        ctx.stroke();
        ctx.fillStyle = "black";
        ctx.fillText(i + 1, startX + transactionIdWidth + lineMarkerDistance * i - ctx.measureText(i + 1).width / 2, y + lineMarkerheight + 15);
    }
    ctx.beginPath();
    ctx.lineTo(startX + transactionIdWidth + lineMarkerDistance * scheduleManager.schedule.length, y - 7);
    ctx.lineTo(startX + transactionIdWidth + lineMarkerDistance * scheduleManager.schedule.length + 15, y);
    ctx.lineTo(startX + transactionIdWidth + lineMarkerDistance * scheduleManager.schedule.length, y + 7);
    ctx.lineTo(startX + transactionIdWidth + lineMarkerDistance * scheduleManager.schedule.length, y);
    ctx.closePath();
    ctx.fill();

    let table = document.getElementById("optimisticTable");
    let body = table.createTBody();
    for (let i = 0; i < scheduleManager.transactions.length; i++) {
        let row = body.insertRow();
        let cell = row.insertCell();
        cell.innerHTML = "T" + scheduleManager.transactions[i].id;

        cell = row.insertCell();
        for (let j = 0; j < scheduleManager.transactions[i].dbObjectsRead.length; j++) {
            cell.innerHTML = cell.innerHTML + scheduleManager.transactions[i].dbObjectsRead[j].id + ', ';
        }
        cell.innerHTML = cell.innerHTML.slice(0, -2);
        cell = row.insertCell();
        for (let j = 0; j < scheduleManager.transactions[i].otherTransactionsFinished.length; j++) {
            cell.innerHTML = cell.innerHTML + scheduleManager.transactions[i].otherTransactionsFinished[j].id + ', ';
        }
        cell.innerHTML = cell.innerHTML.slice(0, -2);
        cell = row.insertCell();
        for (let j = 0; j < scheduleManager.transactions[i].dbObjectsWroteOfOtherTransactions.length; j++) {
            cell.innerHTML = cell.innerHTML + scheduleManager.transactions[i].dbObjectsWroteOfOtherTransactions[j].id + ', ';
        }
        cell.innerHTML = cell.innerHTML.slice(0, -2);
    }
}

// leert die Tabelle und das Diagramm
function clearDiagramAndTable() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    y = 70;
    startX = 30;
    let table = document.getElementById("optimisticTable");
    if (table.getElementsByTagName("tbody").length !== 0) {
        table.removeChild(table.getElementsByTagName("tbody")[0]);
    }
}

// erzeugt eine pseudozufällige Zahl
function randomNumber(min, max) {
    return Math.floor(Math.random()*(max-min+1)+min);
}