// Schedulemanager für das Zeitmarkenverfahren, mit der Logik, um einen neuen Transaktionsschritt hinzuzufügen
class TimestampScheduleManager extends ScheduleManager {
 
    constructor(ruleName) {
        super(ruleName);
    }

    addNewStep(task, transaction, dbObject, lastStep) {
        if (transaction.rollback) {
            return lastStep;
        }

        let newTask;
        if (task === BOT) {
            newTask = new Task().bot();
            transaction.botTime = this.schedule.length + 1;
            transaction.started = true;
        } else if (task === COMMIT) {
            newTask = new Task().commit();
        } else if (task === ROLLBACK) {
            newTask = new Task().rollback();
            transaction.rollback = true;
        } else if (task === READ) {
            newTask = new Task().read(dbObject);
            transaction.dbObjectsRead.push(dbObject);
            if (transaction.botTime < dbObject.writeTS) {
                //  neuen step mit rollback erzeugen
                let newStep = lastStep;
                newStep.task = newTask;
                newStep.violateTimestampRule = true;
                newStep.transaction = transaction;
                this.schedule.push(newStep);
                return this.addNewStep(ROLLBACK, transaction, dbObject, newStep.createNextStep());
            } else { 
                if (dbObject.readTS < transaction.botTime || dbObject.readTS === undefined) {
                    dbObject.readTS = transaction.botTime;
                }
                for (let i = 0; i < lastStep.dbObjectStatus.length; i++) {
                    if (dbObject.id === lastStep.dbObjectStatus[i].id) {
                        lastStep.dbObjectStatus[i].readTS = dbObject.readTS;
                    }
                }
            }
        } else if (task === WRITE) {
            newTask = new Task().write(dbObject);
            transaction.dbObjectsWrote.push(dbObject);
            //console.log(transaction.botTime + " - " + dbObject.readTS + " - " +  dbObject.writeTS)
            if (transaction.botTime < dbObject.readTS || transaction.botTime < dbObject.writeTS) {
                //  neuen step mit rollback
                let newStep = lastStep;
                newStep.task = newTask;
                newStep.violateTimestampRule = true;
                newStep.transaction = transaction;
                this.schedule.push(newStep);
                return this.addNewStep(ROLLBACK, transaction, dbObject, newStep.createNextStep());
            } else {
                if (dbObject.writeTS < transaction.botTime || dbObject.writeTS === undefined) {
                    dbObject.writeTS = transaction.botTime;
                }
                for (let i = 0; i < lastStep.dbObjectStatus.length; i++) {
                    if (dbObject.id === lastStep.dbObjectStatus[i].id) {
                        lastStep.dbObjectStatus[i].writeTS = dbObject.writeTS;
                    }
                }
            }
        }

        let newStep;
        if (!lastStep) {
            newStep = new TransactionStep(transaction, newTask);
        } else {
            newStep = lastStep;
            newStep.task = newTask;
            newStep.transaction = transaction;
        }

        // Wenn es der erste Schritt in der Transaktionshistorie ist
        if (this.schedule.length === 0) {
            let dbObjects = [];
            for (let i = 0; i < this.dbObjects.length; i++) {
                dbObjects.push(JSON.parse(JSON.stringify(this.dbObjects[i])))
            }
            newStep.dbObjectStatus = dbObjects;
        }

        this.schedule.push(newStep);
        return newStep.createNextStep();
    }
}

let scheduleManager = new TimestampScheduleManager(RULENAME_TIMESTAMP);
/*scheduleManager.addTransaction();
scheduleManager.addTransaction();

let a = scheduleManager.addDbObject();
let b = scheduleManager.addDbObject();


let nextStep = scheduleManager.addNewStep(BOT, scheduleManager.transactions[0]);
nextStep = scheduleManager.addNewStep(BOT, scheduleManager.transactions[1], null, nextStep);
nextStep = scheduleManager.addNewStep(READ, scheduleManager.transactions[1], a, nextStep);
nextStep = scheduleManager.addNewStep(WRITE, scheduleManager.transactions[0], a, nextStep);
nextStep = scheduleManager.addNewStep(WRITE, scheduleManager.transactions[1], a, nextStep);

nextStep = scheduleManager.addNewStep(READ, scheduleManager.transactions[0], a, nextStep);

nextStep = scheduleManager.addNewStep(COMMIT, scheduleManager.transactions[0], a, nextStep);
nextStep = scheduleManager.addNewStep(COMMIT, scheduleManager.transactions[1], a, nextStep);*/

let canvas = document.getElementById('timestampDiagram');
let ctx = canvas.getContext('2d');

// Distanz zwischen den einzlnen Schritten in der Skale
let lineMarkerDistance = 50;

// Höhe der querstriche auf der Skala
let lineMarkerheight = 10;

// Größe der Kreise
let arcRadius = 10;

// Startabstand zur oberen Kante des Zeichenbereichs
let y = 70;

// Startabstand zur linken Kante des Zeichenbereichts
let startX = 30;

// keine ahnung, ist aber wichtig
let transactionIdWidth = 40;

randomize(3, 2, false);

// erzeugt einen zufälligen Schedule
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

    scheduleManager = new TimestampScheduleManager(RULENAME_TIMESTAMP);
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

    let nextStep;
    while (activeTransactions.length > 0) {
        let transactionIndex = randomNumber(0, activeTransactions.length - 1);
        let chosenTransaction = activeTransactions[transactionIndex];
        if (!chosenTransaction.started) {
            //console.log(chosenTransaction.started + " - " + chosenTransaction.id)
            nextStep = scheduleManager.addNewStep(BOT, chosenTransaction, null, nextStep);
        } else {
            if (chosenTransaction.dbObjectsRead.length === 0 && chosenTransaction.dbObjectsWrote.length === 0) {
                let chosenDbObject = getDbObjectNotActiveWrote(numberOfDbObjects, scheduleManager.dbObjects);
                // wenn alle DbObjekte blockiert sind
                if (!chosenDbObject) {
                    continue;
                }

                if (randomNumber(0, 1) === 0) {
                    nextStep = scheduleManager.addNewStep(READ, chosenTransaction, chosenDbObject, nextStep);
                } else {
                    nextStep = scheduleManager.addNewStep(WRITE, chosenTransaction, chosenDbObject, nextStep);
                    chosenDbObject.lockW = chosenTransaction;
                }
            } else {
                let random = randomNumber(1, 100);
                if (random < 21) { // commit
                    nextStep = scheduleManager.addNewStep(COMMIT, chosenTransaction, null, nextStep);
                    activeTransactions.splice(transactionIndex, 1);
                    for (let i = 0; i < scheduleManager.dbObjects.length; i++) {
                        if (scheduleManager.dbObjects[i].lockW && scheduleManager.dbObjects[i].lockW.id === chosenTransaction.id) {
                            scheduleManager.dbObjects[i].lockW = undefined;
                        }
                    }
                } else {
                    let chosenDbObject = getDbObjectNotActiveWrote(numberOfDbObjects, scheduleManager.dbObjects);
                    // wenn alle DbObjekte blockiert sind
                    if (!chosenDbObject) {
                        continue;
                    }

                    if (random > 20 && random < 61) { // write 
                        nextStep = scheduleManager.addNewStep(WRITE, chosenTransaction, chosenDbObject, nextStep);
                        chosenDbObject.lockW = chosenTransaction;
                    } else if (random > 60) { // read
                        nextStep = scheduleManager.addNewStep(READ, chosenTransaction, chosenDbObject, nextStep);
                    }
                }
            }
        }   

    }
    fillDiagramAndTable(isQuestion);
    return scheduleManager;
}

// ermittelt ein Datenbankobjekte, welches nicht durch eine andere Transaktion blockiert ist, weil es dieses
// verändert hat und seine Transaktion noch nicht beendet hat
function getDbObjectNotActiveWrote(numberOfDbObjects, dbObjects) {
    // check not all dbObjects are blocked
    let numberOfDbObjectsBlocked = 0;
    for (let i = 0; i < dbObjects.length; i++) {
        if (dbObjects[i].lockW) {
            numberOfDbObjectsBlocked += 1;
        }
    }

    if (numberOfDbObjectsBlocked === numberOfDbObjects) {
        return false;
    }

    let chosenDbObject;
    do {
        let dbObjectIndex = randomNumber(0, numberOfDbObjects - 1);
        chosenDbObject = dbObjects[dbObjectIndex];
    } while(chosenDbObject.lockW);
    return chosenDbObject;
}

// befüllt die Tabelle und das Diagramm
function fillDiagramAndTable(isQuestion) {
    ctx.font = "10pt Arial";
    for (let i = 0; i < scheduleManager.transactions.length; i++) {
        let originalStartX = startX;
        ctx.fillText("T" + scheduleManager.transactions[i].id, startX - ctx.measureText("T" + scheduleManager.transactions[i].id, startX).width / 2, y);
        startX = startX + transactionIdWidth;
        for (let j = 0; j < scheduleManager.schedule.length; j++) {
            let lastXPosition = startX + arcRadius;
            if (scheduleManager.schedule[j].transaction.id === scheduleManager.transactions[i].id) {
                if (scheduleManager.schedule[j].task.task === BOT) {
                    ctx.beginPath();
                    ctx.arc(startX + j * lineMarkerDistance, y, arcRadius, 0, 2 * Math.PI);
                    ctx.stroke();
                    ctx.fillText(BOT, startX + j * lineMarkerDistance - ctx.measureText(BOT).width / 2, y - lineMarkerheight - 15);
                } else {
                    ctx.lineTo(startX + j * lineMarkerDistance, y);
                    ctx.lineTo(startX + j * lineMarkerDistance, y - lineMarkerheight);
                    ctx.lineTo(startX + j * lineMarkerDistance, y + lineMarkerheight);
                    ctx.lineTo(startX + j * lineMarkerDistance, y);
                    ctx.stroke();

                    if (scheduleManager.schedule[j].violateTimestampRule && isQuestion === false) {
                        ctx.save();
                        ctx.beginPath();
                        ctx.strokeStyle = "red";
                        ctx.lineTo(startX + j * lineMarkerDistance - lineMarkerheight, y - lineMarkerheight);
                        ctx.lineTo(startX + j * lineMarkerDistance + lineMarkerheight, y + lineMarkerheight);
                        ctx.moveTo(startX + j * lineMarkerDistance - lineMarkerheight, y + lineMarkerheight);
                        ctx.lineTo(startX + j * lineMarkerDistance + lineMarkerheight, y - lineMarkerheight);
                        ctx.moveTo(startX + j * lineMarkerDistance, y);
                        ctx.stroke();
                        ctx.closePath();
                        ctx.restore();
                        //ctx.strokeStyle = "black";
                    }
                    if (scheduleManager.schedule[j].task.task === COMMIT || scheduleManager.schedule[j].task.task === ROLLBACK && isQuestion === true) {
                        ctx.beginPath();
                        ctx.arc(startX + j * lineMarkerDistance, y, arcRadius, 0, 2 * Math.PI);
                        ctx.fill();
                        ctx.fillText("EOT", startX + j * lineMarkerDistance - ctx.measureText("EOT").width / 2, y - lineMarkerheight - 15);
                    } else {
                        ctx.fillText(scheduleManager.schedule[j].task.toString(), startX + j * lineMarkerDistance - ctx.measureText(scheduleManager.schedule[j].task.toString()).width / 2, y - lineMarkerheight - 15);
                    }

                }
            }
        }

        y = y + 70;
        startX = originalStartX;
    }

    ctx.beginPath();
    ctx.moveTo(startX - 15 + transactionIdWidth, y);
    ctx.lineTo(startX + transactionIdWidth, y);
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

    let table = document.getElementById("transactionTimestamp");

    let body = table.createTBody();
    for (let i = 0; i < scheduleManager.transactions.length; i++) {
        let row = body.insertRow();
        let cell = row.insertCell();
        cell.innerHTML = "T" + scheduleManager.transactions[i].id;

        let cell1 = row.insertCell();
        cell1.innerHTML = scheduleManager.transactions[i].botTime;
    }

    table = document.getElementById("timestampPerStep");
    let header = table.createTHead();
    let row = header.insertRow(0);
    let cell = document.createElement("th")
    cell.innerHTML = "Schritt";
    row.appendChild(cell);
    for (let i = 0; i < scheduleManager.dbObjects.length; i++) {
        let cell = document.createElement("th");
        cell.innerHTML = "RTS(" + scheduleManager.dbObjects[i].id + ")";
        row.appendChild(cell);

        cell = document.createElement("th");
        cell.innerHTML = "WTS(" + scheduleManager.dbObjects[i].id + ")";
        row.appendChild(cell);
    }

    body = table.createTBody();
    for (let i = 0; i < scheduleManager.schedule.length; i++) {
        if (scheduleManager.schedule[i].task.task !== BOT && scheduleManager.schedule[i].task.task !== COMMIT && scheduleManager.schedule[i].task.task !== ROLLBACK) {
            let row = body.insertRow();
            let cell = row.insertCell();
            cell.innerHTML = i + 1;

            for (let j = 0; j < scheduleManager.schedule[i].dbObjectStatus.length; j++) {
                cell = row.insertCell();
                if (scheduleManager.schedule[i].task.task === READ 
                    && scheduleManager.schedule[i].task.object.id === scheduleManager.schedule[i].dbObjectStatus[j].id 
                    && scheduleManager.schedule[i].violateTimestampRule) {

                    cell.innerHTML = "<p style='color:red;'>X</p>"
                } else if (!scheduleManager.schedule[i].dbObjectStatus[j].readTS) {
                    cell.innerHTML = "-";
                } else {
                    cell.innerHTML = scheduleManager.schedule[i].dbObjectStatus[j].readTS;
                }

                cell = row.insertCell();
                if (scheduleManager.schedule[i].task.task === WRITE 
                    && scheduleManager.schedule[i].task.object.id === scheduleManager.schedule[i].dbObjectStatus[j].id 
                    && scheduleManager.schedule[i].violateTimestampRule) {

                    cell.innerHTML = "<p style='color:red;'>X</p>"
                } else if (!scheduleManager.schedule[i].dbObjectStatus[j].writeTS) {
                    cell.innerHTML = "-";
                } else {
                    cell.innerHTML = scheduleManager.schedule[i].dbObjectStatus[j].writeTS;
                }
            }
        }
    }
}

// leert die Tabelle und das Diagramm
function clearDiagramAndTable() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    y = 70;
    startX = 30;
    let table = document.getElementById("transactionTimestamp");
    if (table.getElementsByTagName("tbody").length !== 0) {
        table.removeChild(table.getElementsByTagName("tbody")[0]);
    }

    table = document.getElementById("timestampPerStep");
    table.deleteTHead();
    if (table.getElementsByTagName("tbody").length !== 0) {
        table.removeChild(table.getElementsByTagName("tbody")[0]);
    }
}

// erzeugt eine pseudozufällige Zahl
function randomNumber(min, max) {
    return Math.floor(Math.random()*(max-min+1)+min);
}