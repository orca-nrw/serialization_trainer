let chartLabels = [];
let graphManager;
let myChart;

/*
    PsScheduleManager
    Beinhaltet die Logik für das Hinzufügen eines neuen Schrittes und um einen Schedule auf einen Deadlock zu prüfen
*/
class PsScheduleManager extends ScheduleManager {
 
    constructor(ruleName) {
        super(ruleName);
    }

    // fügt einen neuen Schritt hinzu
    addNewStep(task, transaction, dbObject, lastStep) {
        let newTask;
        if (task === BOT) {
            newTask = new Task().bot();
            transaction.started = true;
        } else if (task === COMMIT) {
            newTask = new Task().commit();
        } else if (task === ROLLBACK) {
            newTask = new Task().rollback();
        } else if (task === READ) {
            newTask = new Task().read(dbObject);
            transaction.dbObjectsRead.push(dbObject);
        } else if (task === WRITE) {
            newTask = new Task().write(dbObject);
            transaction.dbObjectsWrote.push(dbObject);
        } else if (task === LOCKR) {
            newTask = new Task().lockR(dbObject);

            if (dbObject.lockW) {
                let transactionWaiting = new TransactionWaiting(transaction, dbObject.lockW, dbObject);
                transactionWaiting.isReadLock = true;
                lastStep.transactionsWaiting.push(transactionWaiting);
                transaction.waiting = true;
            }

            dbObject.lockR.push(transaction);
            /*for (let i = 0; i < lastStep.dbObjectStatus; i++) {
                if (lastStep.dbObjectStatus.id === dbObject.id) {
                    lastStep.dbObjectStatus.lockR.push(transaction);
                    break;
                }
            }*/

        } else if (task === LOCKW) {
            newTask = new Task().lockW(dbObject);

            // wenn bereits eine Schreib-Sperre auf dem Datenbankobjekt existiert oder mindestens eine Lese-Sperre
            if (dbObject.lockW || dbObject.lockR.length !== 0) {
                if (dbObject.lockW) {
                    let transactionWaiting = new TransactionWaiting(transaction, dbObject.lockW, dbObject);
                    transactionWaiting.isReadLock = false;
                    lastStep.transactionsWaiting.push(transactionWaiting);
                    transaction.waiting = true;
                } else {
                    for (let i = 0; i < dbObject.lockR.length; i++) {
                        let transactionWaiting = new TransactionWaiting(transaction, dbObject.lockR[i], dbObject);
                        transactionWaiting.isReadLock = false;
                        lastStep.transactionsWaiting.push(transactionWaiting);
                        transaction.waiting = true;
                    }
                }
            } else {
                dbObject.lockW = transaction;
            }
        } else if (task === UNLOCKR) {
            newTask = new Task().unlockR(dbObject);
            transaction.lockingPhase = false;

            // Transaktionen die auf Freigabe der Sperre warten, dürfen erst sperren, wenn dies die letzte lese-sperre war
            if (dbObject.lockR.length === 1) {
                // wenn eine transaktion noch auf freigabe wartet, diese abhängigkeiten auflösen
                for (let i = 0; i < lastStep.transactionsWaiting.length; i++) {
                    if (transaction.id === lastStep.transactionsWaiting[i].transactionBlocking.id && dbObject.id === lastStep.transactionsWaiting[i].dbObject.id) {
                        // eine blockierte Transaktion kann nur eine Schreibsperre anfordern wollen, bei mehreren darf aber nur die erste sperren
                        if (!dbObject.lockW) {
                            dbObject.lockW = lastStep.transactionsWaiting[i].transactionWaiting;
                            // ich bin nicht mehr der verursacher der neuen sperrtransatktion
                            lastStep.transactionsWaiting[i].transactionWaiting.waiting = false;
                            lastStep.transactionsWaiting.splice(i, 1);
                            i--;
                        } else {
                            // der Rest bekommt einen neuen Verursacher für das Warten
                            lastStep.transactionsWaiting[i].transactionBlocking = dbObject.lockW;
                        }

                    }
                }
            } else {
                for (let i = 0; i < lastStep.transactionsWaiting.length; i++) {
                    if (transaction.id === lastStep.transactionsWaiting[i].transactionBlocking.id && dbObject.id === lastStep.transactionsWaiting[i].dbObject.id) {
                        lastStep.transactionsWaiting[i].transactionWaiting.waiting = false;
                        lastStep.transactionsWaiting.splice(i, 1);
                        i--;
                    }
                }
            }
            // aus dem lese-sperren entfernen
            for (let i = 0; i < dbObject.lockR.length; i++) {
                if (transaction.id === dbObject.lockR[i].id) {
                    dbObject.lockR.splice(i, 1);
                    i--;
                }
            }
        } else if (task == UNLOCKW) {
            newTask = new Task().unlockW(dbObject);
            transaction.lockingPhase = false;

            dbObject.lockW = undefined;

            let tmpCounter = 0;

            // wenn eine transaktion noch auf freigabe wartet, diese Abhängigkeiten auflösen
            for (let i = 0; i < lastStep.transactionsWaiting.length; i++) {

                tmpCounter++;
                if (tmpCounter > 200) {
                    break;
                }

                if (transaction.id === lastStep.transactionsWaiting[i].transactionBlocking.id && dbObject.id === lastStep.transactionsWaiting[i].dbObject.id) {
                    if (lastStep.transactionsWaiting[i].isReadLock) {
                        // die erste blockierte Sperre ist/war eine Lesesperre
                        if (!dbObject.lockW) {
                            // TODO: Ich muss prüfen, ob ich eine Schreibsperr-Anforderung blockiere, wenn die reihenfolge RWR ist

                            dbObject.lockR.push(lastStep.transactionsWaiting[i].transactionWaiting);
                            lastStep.transactionsWaiting[i].transactionWaiting.waiting = false
                            lastStep.transactionsWaiting.splice(i, 1);
                            i--;
                        } else {
                            // neuen Blockierer setzen
                            lastStep.transactionsWaiting[i].transactionBlocking = dbObject.lockW;
                        }
                    } else {
                        if (dbObject.lockR.length === 0) {
                            dbObject.lockW = lastStep.transactionsWaiting[i].transactionWaiting;
                            lastStep.transactionsWaiting[i].transactionWaiting.waiting = false;
                            lastStep.transactionsWaiting.splice(i, 1);
                            i--;
                        } else {
                            // Alle Lese-Sperren blockieren mich
                            for (let j = 0; j < dbObject.lockR.length; j++) {
                                let transactionWaiting = new TransactionWaiting(lastStep.transactionsWaiting[i].transactionWaiting, dbObject.lockR[j], dbObject);
                                transactionWaiting.isReadLock = false;
                                lastStep.transactionsWaiting[i].transactionWaiting.waiting = true;
                                lastStep.transactionsWaiting.push(transactionWaiting);
                            }
                            // die Ursprüngliche Blockierung entfernen, da ich nicht weiß, wie viele neue Lesesperren mich blockieren
                            dbObject.lockW = lastStep.transactionsWaiting[i].transactionWaiting;
                            lastStep.transactionsWaiting[i].transactionWaiting.waiting = false;
                            lastStep.transactionsWaiting.splice(i, 1);
                            i--;
                        }
                        
                    }
                }
            }

        }

        let newStep;
        // wenn dies der erste Schritt ist, der hinzugefügt wird
        if (!lastStep) {
            newStep = new TransactionStep(transaction, newTask);
        } else {
        // ansonsten müssen Informationen vom alten Schritt in den neuen übernomnmen werden
            newStep = lastStep;
            newStep.task = newTask;
            newStep.transaction = transaction;

            let transactionsWaitingCopy = [];
            for (let i = 0; i < this.transactions.length; i++) {
                let copy = new Transaction(this.transactions[i].id);
                copy.waiting = this.transactions[i].waiting;
                transactionsWaitingCopy.push(copy);
            }
            newStep.transactionsStatus = transactionsWaitingCopy;
        }

        // wenn kein DeadLock existiert, prüfe ob ein DeadLock entstanden ist. Speichere zudem einen Klon für jede Transaktion mit dem aktuellen Zustand ab
        if (newStep.deadLock === false) {
            this.checkDeadlockCycle(newStep);
            
            let transactionsWaitingCopy = [];
            for (let i = 0; i <  this.transactions.length; i++) {
                let copy = new Transaction(this.transactions[i].id);
                copy.waiting = this.transactions[i].waiting;
                transactionsWaitingCopy.push(copy);
            }
            newStep.transactionsStatus = transactionsWaitingCopy;
        }

        // Wenn es der erste Schritt in der Transaktionshistorie ist, hinterlege Klone der DbObjekte für den Schrittbezogenen Zustand der DAtenbankobjekte
        if (this.schedule.length === 0) {
            let dbObjects = [];
            for (let i = 0; i < this.dbObjects.length; i++) {
                dbObjects.push(JSON.parse(JSON.stringify(this.dbObjects[i])))
            }
            newStep.dbObjectStatus = dbObjects;
        }  

        this.schedule.push(newStep);
        chartLabels.push(this.schedule.length);

        // zähle Anzahl der Sperren pro Transaktion und hinterlege diese in einer Variablen
        for (let i = 0; i < this.transactions.length; i++) {
            let lockCounter = 0;
            for (let j = 0 ; j < this.dbObjects.length; j++) {
                if (this.dbObjects[j].lockW && this.dbObjects[j].lockW.id === this.transactions[i].id) {
                    lockCounter++;
                } else {
                    for (let k = 0; k < this.dbObjects[j].lockR.length; k++) {
                        if (this.dbObjects[j].lockR[k].id === this.transactions[i].id) {
                            lockCounter++;
                            break;
                        }
                    }
                }
            }
            this.transactions[i].numberOfLocksPerStep.push(lockCounter);
        }

        return newStep.createNextStep();
    }

    // prüfen den übergebenen Transaktionsschritt auf einen Deadlock. Dazu wird zu jeder blockierten Transaktion eine Tiefensuche durchgeführt, um einen Zyklus zu entdecken
    checkDeadlockCycle(step) {
        for (let i = 0; i < this.transactions.length; i++) {
            let id = this.transactions[i].id;

            for (let j = 0; j < step.transactionsWaiting.length; j++) {
                if (step.transactionsWaiting[j].transactionWaiting.id === id) {
                    let visitedNodes = [];
                    visitedNodes.push(this.transactions[i]);
                    this.visitTransactionNode(step, visitedNodes, step.transactionsWaiting[j].transactionBlocking)
                }
            }
        }
    }

    // besucht den nächsten Knoten(Transaktion) solange, bis es keine Knoten mehr gibt oder der Ausgangsknoten (sourceNode) erneut gefunden wird und damit ein zyklus vorliegt
    visitTransactionNode(step, visitedNodes, targetNode) {
        for (let i = 0; i < visitedNodes.length; i++) {
            if (visitedNodes[i].id === targetNode.id) {
                step.deadLock = true;
                return;
            }
        }

        visitedNodes.push(targetNode);
        for (let i = 0; i < step.transactionsWaiting.length; i++) {
            if (step.transactionsWaiting[i].transactionWaiting.id === targetNode.id) {
                this.visitTransactionNode(step, visitedNodes, step.transactionsWaiting[i].transactionBlocking)
            }
        }
    }
}

/* 
Erweiterung des allgemeinen Graphmanagers. Bringt die Logik mit, um die blockierten und wartenenden Transaktionen
als Konten zu interpretieren und die Verbindugnen zwischen denen herzustellen.
*/
class PsGraphManager extends GraphManager {

    constructor() {
        super();
    }

    // zeichnet den gesamten Graphen
    drawGraph(scheduleManager ,stepIndex) {
        this.graphContext.clearRect(0, 0, this.graphCanvas.width, this.graphCanvas.height);
        let step = scheduleManager.schedule[stepIndex];

        let nodes = [];
        for (let i = 0; i < scheduleManager.transactions.length; i++) {
            let node = new GraphNode(this.graphContext, scheduleManager.transactions[i], i + 1);
            nodes.push(node);
        }

        for (let i = 0; i < nodes.length; i++) {
            nodes[i].drawNode();
        }

        for (let i = 0; i < step.transactionsWaiting.length; i++) {
            let sourceNode;
            let targetNode;

            for (let j = 0; j < scheduleManager.transactions.length; j++) {
                if (scheduleManager.transactions[j].id === step.transactionsWaiting[i].transactionWaiting.id) {
                    sourceNode = nodes[j];
                }
                if (scheduleManager.transactions[j].id === step.transactionsWaiting[i].transactionBlocking.id) {
                    targetNode = nodes[j];
                }
            }

            sourceNode.drawConnection(targetNode.x, targetNode.y);
        }
    }
}

let scheduleManager = new PsScheduleManager(RULENAME_2PS);
/*scheduleManager.addTransaction();
scheduleManager.addTransaction();

let a = scheduleManager.addDbObject();
let b = scheduleManager.addDbObject();


let nextStep = scheduleManager.addNewStep(BOT, scheduleManager.transactions[0]);
nextStep = scheduleManager.addNewStep(BOT, scheduleManager.transactions[1], null, nextStep);
nextStep = scheduleManager.addNewStep(LOCKR, scheduleManager.transactions[1], a, nextStep);
nextStep = scheduleManager.addNewStep(LOCKR, scheduleManager.transactions[0], b, nextStep);
nextStep = scheduleManager.addNewStep(LOCKW, scheduleManager.transactions[0], a, nextStep);
nextStep = scheduleManager.addNewStep(READ, scheduleManager.transactions[1], a, nextStep);

nextStep = scheduleManager.addNewStep(LOCKW, scheduleManager.transactions[1], b, nextStep);

nextStep = scheduleManager.addNewStep(UNLOCKR, scheduleManager.transactions[1], a, nextStep);
nextStep = scheduleManager.addNewStep(WRITE, scheduleManager.transactions[0], a, nextStep);
nextStep = scheduleManager.addNewStep(UNLOCKW, scheduleManager.transactions[0], a, nextStep);
nextStep = scheduleManager.addNewStep(COMMIT, scheduleManager.transactions[0], a, nextStep);
nextStep = scheduleManager.addNewStep(COMMIT, scheduleManager.transactions[1], a, nextStep);

fillDiagramAndTable();*/

/*scheduleManager.addTransaction();
scheduleManager.addTransaction();

let a = scheduleManager.addDbObject();
let b = scheduleManager.addDbObject();


let nextStep = scheduleManager.addNewStep(BOT, scheduleManager.transactions[1]);
nextStep = scheduleManager.addNewStep(LOCKR, scheduleManager.transactions[1], a, nextStep);
nextStep = scheduleManager.addNewStep(BOT, scheduleManager.transactions[0], null, nextStep);
nextStep = scheduleManager.addNewStep(READ, scheduleManager.transactions[1], a, nextStep);
nextStep = scheduleManager.addNewStep(LOCKW, scheduleManager.transactions[0], b, nextStep);

nextStep = scheduleManager.addNewStep(LOCKR, scheduleManager.transactions[0], a, nextStep);
nextStep = scheduleManager.addNewStep(UNLOCKR, scheduleManager.transactions[1], a, nextStep);
nextStep = scheduleManager.addNewStep(READ, scheduleManager.transactions[0], b, nextStep);

nextStep = scheduleManager.addNewStep(WRITE, scheduleManager.transactions[0], b, nextStep);
nextStep = scheduleManager.addNewStep(COMMIT, scheduleManager.transactions[1], null, nextStep);
nextStep = scheduleManager.addNewStep(UNLOCKW, scheduleManager.transactions[0], b, nextStep);
nextStep = scheduleManager.addNewStep(READ, scheduleManager.transactions[0], a, nextStep);
nextStep = scheduleManager.addNewStep(UNLOCKR, scheduleManager.transactions[0], a, nextStep);
nextStep = scheduleManager.addNewStep(COMMIT, scheduleManager.transactions[0], null, nextStep);

fillDiagramAndTable();*/

// initialisiert eine schedule Variable mit und erzeugt initial einen zufälligen Schedule. 
let tm = randomize(2, 2, false);

// erzeugt eine zufällige Beispielkonstellation
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

    scheduleManager = new PsScheduleManager(RULENAME_2PS);
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

    let tmpCounter = 0;

    while (activeTransactions.length > 0) {
        let transactionIndex = randomNumber(0, activeTransactions.length - 1);
        let chosenTransaction = activeTransactions[transactionIndex];

        if (chosenTransaction.waiting === true && scheduleManager.schedule[scheduleManager.schedule.length - 1].deadLock === false) {
            tmpCounter++;

            if (tmpCounter > 200) {
                console.log('tmpCounter: ' + tmpCounter)
                break;
            }

            continue;
        }

        tmpCounter = 0;

        if (!chosenTransaction.started) {
            nextStep = scheduleManager.addNewStep(BOT, chosenTransaction, null, nextStep);
        } else {
            if (chosenTransaction.lockedWDbObjects.length + chosenTransaction.lockedRDbObjects.length === 0) {
                let dbObjectIndex = randomNumber(0, numberOfDbObjects - 1);
                let chosenDbObject = scheduleManager.dbObjects[dbObjectIndex];
                let nextTask = randomizeLockROrLockW();
                nextStep = scheduleManager.addNewStep(nextTask, chosenTransaction, chosenDbObject, nextStep);
                if (nextTask === LOCKR) {
                    chosenTransaction.lockedRDbObjects.push(chosenDbObject);
                } else {
                    chosenTransaction.lockedWDbObjects.push(chosenDbObject);
                }
            } else {
                let randomNum = randomNumber(0, 100);
                if (randomNum <= 25) {
                    // lesen oder schreiben, wenn ich irgendwas gesperrt habe
                    if (randomNumber(0, 1) === 0) {
                        if (chosenTransaction.lockedWDbObjects.length > 0) {
                            for (let i = 0; i < chosenTransaction.lockedWDbObjects.length; i++) {
                                if (chosenTransaction.dbObjectsWrote.indexOf(chosenTransaction.lockedWDbObjects[i]) === -1) {
                                    nextStep = scheduleManager.addNewStep(READ, chosenTransaction, chosenTransaction.lockedWDbObjects[i], nextStep);
                                    //chosenTransaction.dbObjectsRead.push(chosenTransaction.lockedWDbObjects[i]);
                                    nextStep = scheduleManager.addNewStep(WRITE, chosenTransaction, chosenTransaction.lockedWDbObjects[i], nextStep);
                                    //chosenTransaction.dbObjectsWrote.push(chosenTransaction.lockedWDbObjects[i]);
                                }
                            }
                        }
                    } else {
                        if (chosenTransaction.lockedRDbObjects.length > 0) {
                            for (let i = 0; i < chosenTransaction.lockedRDbObjects.length; i++) {
                                if (chosenTransaction.dbObjectsRead.indexOf(chosenTransaction.lockedRDbObjects[i]) === -1) {
                                    nextStep = scheduleManager.addNewStep(READ, chosenTransaction, chosenTransaction.lockedRDbObjects[i], nextStep);
                                    //chosenTransaction.dbObjectsRead.push(chosenTransaction.lockedRDbObjects[i]);
                                }
                            }
                        }
                    }
                } else if (randomNum > 25 && randomNum <= 50) {

                    if (chosenTransaction.lockedWDbObjects.length + chosenTransaction.lockedRDbObjects.length < numberOfDbObjects && chosenTransaction.lockingPhase === true) {
                        let chosenDbObject;
                        do {
                            let dbObjectIndex = randomNumber(0, numberOfDbObjects - 1);
                            let possibleChosenDbObject = scheduleManager.dbObjects[dbObjectIndex];
                            if (chosenTransaction.lockedWDbObjects.indexOf(possibleChosenDbObject) === -1 && chosenTransaction.lockedRDbObjects.indexOf(possibleChosenDbObject) === -1) {
                                chosenDbObject = possibleChosenDbObject;
                            }
                        } while (!chosenDbObject)
                        
                        if (randomNumber(0, 1) === 0) {
                            nextStep = scheduleManager.addNewStep(LOCKW, chosenTransaction, chosenDbObject, nextStep);
                            chosenTransaction.lockedWDbObjects.push(chosenDbObject);
                        } else {
                            nextStep = scheduleManager.addNewStep(LOCKR, chosenTransaction, chosenDbObject, nextStep);
                            chosenTransaction.lockedRDbObjects.push(chosenDbObject);
                        }
                    }
                } else if (randomNum > 50 && randomNum <= 75) {
                    if (chosenTransaction.unlockedWDbObjects.length + chosenTransaction.unlockedRDbObjects.length < chosenTransaction.dbObjectsRead.length) {
                        let chosenDbObject;
                        do {
                            let dbObjectIndex = randomNumber(0, numberOfDbObjects - 1);
                            let possibleChosenDbObject = scheduleManager.dbObjects[dbObjectIndex];
                            if (chosenTransaction.unlockedWDbObjects.indexOf(possibleChosenDbObject) === -1 && chosenTransaction.unlockedRDbObjects.indexOf(possibleChosenDbObject) === -1  
                                && chosenTransaction.dbObjectsRead.indexOf(possibleChosenDbObject) !== -1) {

                                chosenDbObject = possibleChosenDbObject;
                            }
                        } while (!chosenDbObject)

                        if (chosenTransaction.lockedRDbObjects.indexOf(chosenDbObject) === -1) {
                            nextStep = scheduleManager.addNewStep(UNLOCKW, chosenTransaction, chosenDbObject, nextStep);
                            chosenTransaction.unlockedWDbObjects.push(chosenDbObject);
                        } else {
                            nextStep = scheduleManager.addNewStep(UNLOCKR, chosenTransaction, chosenDbObject, nextStep);
                            chosenTransaction.unlockedRDbObjects.push(chosenDbObject);
                        }
                    }
                } else if (randomNum > 75) {
                    if (chosenTransaction.lockedRDbObjects.length === chosenTransaction.unlockedRDbObjects.length && chosenTransaction.lockedWDbObjects.length === chosenTransaction.unlockedWDbObjects.length) {
                        nextStep = scheduleManager.addNewStep(COMMIT, chosenTransaction, null, nextStep);
                        activeTransactions.splice(transactionIndex, 1);
                    }
                }
            }
        }
    }

    fillDiagramAndTable(isQuestion);
    return scheduleManager;
}

// erzeugt so lange einen zufälligen Schedule, bis ein DeadLock entsteht
function randomizeWithDeadLock(numberofTransactions, numberOfDbObjects, isQuestion) {
    let deadLock;
    do {
        let tm = randomize(numberofTransactions, numberOfDbObjects, isQuestion);
        deadLock = tm.schedule[tm.schedule.length -1].deadLock;
    } while(deadLock === false)
}

// gibt zu einer 50/50 Wahrscheinlichkeit LOCKR oder LOCKW zurück
function randomizeLockROrLockW() {
    if (randomNumber(0, 1) === 0) {
        return LOCKR;
    } else {
        return LOCKW;
    }
}

// befüllt das Liniendiagramm, den Graphen und die Tabelle mit den Daten aus dem Schedule der lokalen Variable scheduleManager
function fillDiagramAndTable(isQuestion) {
    graphManager = new PsGraphManager();
    graphManager.drawGraph(scheduleManager, 0);

    let chartData = {
        labels: chartLabels,
        datasets: []
      };
    
    colors = ['rgb(255, 0, 0)', 'rgb(0, 0, 0)', 'rgb(0, 255, 0)', 'rgb(0, 0, 255)'];
    
    // ermittle, wann der erste Deadlock aufgetreten ist
    let deadLockStep = 0;
    for (let i = 0; i < scheduleManager.schedule.length; i++) {
        if (scheduleManager.schedule[i].deadLock === true && isQuestion === false) {
            deadLockStep = i + 1; 
            break;
        } else {
            deadLockStep = scheduleManager.schedule.length;
        }
    }

    for (let i = 0; i < scheduleManager.transactions.length; i++) {
        let dataSet = {};
        dataSet.label = "Anzahl Sperren T" + scheduleManager.transactions[i].id;
        dataSet.backgroundColor = colors[i];
        dataSet.borderColor = colors[i];
        if (isQuestion === false) {
            scheduleManager.transactions[i].numberOfLocksPerStep.pop();
            scheduleManager.transactions[i].numberOfLocksPerStep.unshift(0);
        }
        dataSet.data = scheduleManager.transactions[i].numberOfLocksPerStep.slice(0, deadLockStep);
        chartData.datasets.push(dataSet);
    }
    chartData.labels = [];

    for (let i = 0; i < chartData.datasets[0].data.length; i++) {
        if (deadLockStep > 0 && i < deadLockStep) {
            chartData.labels.push(i + 1);
        } else {
            chartData.labels.push(i + 1);
        }
    }
    
    let config = {
        type: 'line',
        data: chartData,
        options: {}
    };
    
    if (myChart) {
        myChart.clear();
        myChart.destroy();
    }

    myChart = new Chart(document.getElementById('locksChart').getContext("2d"), config);


    let table = document.getElementById("transactionTable");
    let header = table.createTHead();
    let row = header.insertRow(0);
    let cell = document.createElement("th")
    row.appendChild(cell);
    for (let i = 0; i < scheduleManager.transactions.length; i++) {
        let cell = document.createElement("th")
        cell.innerHTML = scheduleManager.transactions[i].toString();
        row.appendChild(cell);
    }

    let body = table.createTBody();
    for (let i = 0; i < scheduleManager.schedule.length; i++) {
        let row = header.insertRow();
        let cell = row.insertCell();
        cell.innerHTML = i + 1;

        for (let j = 0; j < scheduleManager.transactions.length; j++) {
            if (scheduleManager.schedule[i].transaction.id - 1 === j) {
                let cell = row.insertCell();
                cell.innerHTML = scheduleManager.schedule[i].task.toString();
            } else  {
                if (scheduleManager.schedule[i].transactionsStatus[j].waiting === true) {
                    let cell = row.insertCell();
                    cell.innerHTML = "wait"
                } else {
                    let cell = row.insertCell();
                }
            }
        }

        // deadlock
        if (scheduleManager.schedule[i].deadLock === true && isQuestion === false) {
            let row = header.insertRow();
            let cell = row.insertCell();
            cell.innerHTML = i + 2;
            for (let j = 0; j < scheduleManager.transactions.length; j++) {
                let cell = row.insertCell();
                cell.innerHTML = "DeadLock";
            }
            break;
        }

    }

    let selectBox = document.getElementById("selectGraphStep");
    selectBox.options.length = 0;
    let newOption = new Option("Transaktionsschritt auswählen:", 0);
    selectBox.add(newOption,undefined);
    for (let i = 0; i < scheduleManager.schedule.length; i++) {
        if (scheduleManager.schedule[i].deadLock === false) {
            let newOption = new Option(i + 1, i + 1);
            selectBox.add(newOption,undefined);
        } else {
            // wenn der nächste Schritt den beginn des Deadlocks darstellt, nehme diesen Schritt noch mit auf in die Auswahl, da es ein LOCK Schritt ist, der den Deadlock auslöst
            let newOption = new Option(i + 1, i + 1);
            selectBox.add(newOption,undefined);
            break;
        }
    }
}

// leert die Tabelle
function clearDiagramAndTable() {
    let table = document.getElementById("transactionTable");
    table.deleteTHead();
    if (table.getElementsByTagName("tbody").length !== 0) {
        table.removeChild(table.getElementsByTagName("tbody")[0]);
    }
}

// baut den Graphen zu dem ausgewählten Transaktionsschritt auf
function selectGraphStepChange() {
    let selectBox = document.getElementById("selectGraphStep");
    graphManager.drawGraph(scheduleManager, selectBox.value - 1);
}

// erzeugt eine pseudozufällige Zahl
function randomNumber(min, max) {
    return Math.floor(Math.random()*(max-min+1)+min);
}
