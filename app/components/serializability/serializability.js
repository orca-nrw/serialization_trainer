// Klasse für Konfliktoperationen
class ConflictedTransactions {
    constructor() {
        this.transaction1;
        this.transaction2;
        this.tasks = []
    }
}

// Schedulemanager für die Serialisierung, mit der Logik, um Konfliktoperationen zu ermitteln und darauf basierend einen Zyklus zu ermitteln
class SerializableScheduleManager extends AnomaliesScheduleManager {
 
    constructor(ruleName) {
        super(ruleName);

        this.allConflictedTransactions = [];
    }

    // Prüfe ob der Schedule serialiserbar ist
    checkScheduleSerialized() {
        let allConflictedTransactions = [];
        let conflictedTransactionsStrings = [];
    
        for (let i = 0; i < this.schedule.length; i++) {
            if (this.schedule[i].task.task === READ || this.schedule[i].task.task === WRITE) {
                for (let j = 0; j < this.schedule.length; j++) {
                    // wenn der zu vergleichende Schritt eine andere Transaktion angehört mit einer Lese- oder Schreiboperation und mindestens einer der 
                    // vergleichenden Transaktionen eine Schreiboperation ausführt und beide auf dem selben Datenbankobjekt operieren, liegt ein Konflikt vor
                    if (this.schedule[j].transaction.id !== this.schedule[i].transaction.id && (this.schedule[j].task.task === READ || this.schedule[j].task.task === WRITE) 
                        && (this.schedule[i].task.task === WRITE || this.schedule[j].task.task === WRITE) && this.schedule[i].task.object.id === this.schedule[j].task.object.id) {
                        
                        let newConflictedTransaction = new ConflictedTransactions();
                        if (i < j) {
                            newConflictedTransaction.transaction1 = this.schedule[i].transaction;
                            newConflictedTransaction.transaction2 = this.schedule[j].transaction;
                            newConflictedTransaction.tasks.push(this.schedule[i].task);
                            newConflictedTransaction.tasks.push(this.schedule[j].task);
                        } else {
                            newConflictedTransaction.transaction1 = this.schedule[j].transaction;
                            newConflictedTransaction.transaction2 = this.schedule[i].transaction;
                            newConflictedTransaction.tasks.push(this.schedule[j].task);
                            newConflictedTransaction.tasks.push(this.schedule[i].task);
                        }
    
                        let newConflictTransactionString = '' + newConflictedTransaction.transaction1.id + newConflictedTransaction.transaction2.id + newConflictedTransaction.tasks[0].task + newConflictedTransaction.tasks[1].task;
                        if (!conflictedTransactionsStrings.includes(newConflictTransactionString)) {
                            conflictedTransactionsStrings.push(newConflictTransactionString);
                            allConflictedTransactions.push(newConflictedTransaction);
                        }
                    }
                }
            }
        }
    
        let isConflict = false;
        for (let i = 0; i < allConflictedTransactions.length; i++) {
            let visitedNodes = [];
            visitedNodes.push(allConflictedTransactions[i].transaction1)
            isConflict = this.visitTransactionNode(allConflictedTransactions, visitedNodes, allConflictedTransactions[i].transaction2);
            if (isConflict === true) {
                break;
            }
        }
    
        this.allConflictedTransactions = allConflictedTransactions;
        return isConflict;
    }
    
    // besucht alle folgenden Knoten und gibt true zurück, wenn ein Zyklus gefunden wurde
    visitTransactionNode(conflictedTransactions, visitedNodes, targetNode) {
        for (let i = 0; i < visitedNodes.length; i++) {
            if (visitedNodes[i].id === targetNode.id) {
                return true;
            }   
        }

        visitedNodes.push(targetNode);
        for (let i = 0; i < conflictedTransactions.length; i++) {
            if (conflictedTransactions[i].transaction1.id === targetNode.id) {
                return this.visitTransactionNode(conflictedTransactions, visitedNodes, conflictedTransactions[i].transaction2);
            }
        }
        return false;
    }

}

// Graphmanager, um den Graphen für die Serialisierung zu zeichnen
class SerializableGraphManager extends GraphManager {

    constructor() {
        super();
    }

    // malt den Graphen basierend auf den Konfliktoperationen
    drawGraph(scheduleManager) {
        this.graphContext.clearRect(0, 0, this.graphCanvas.width, this.graphCanvas.height);

        let nodes = [];
        for (let i = 0; i < scheduleManager.transactions.length; i++) {
            let node = new GraphNode(this.graphContext, scheduleManager.transactions[i], i + 1);
            nodes.push(node);
        }

        for (let i = 0; i < nodes.length; i++) {
            nodes[i].drawNode();
        }

        for (let i = 0; i < scheduleManager.allConflictedTransactions.length; i++) {
            let sourceNode;
            let targetNode;

            for (let j = 0; j < scheduleManager.transactions.length; j++) {
                if (scheduleManager.transactions[j].id === scheduleManager.allConflictedTransactions[i].transaction1.id) {
                    sourceNode = nodes[j];
                }
                if (scheduleManager.transactions[j].id === scheduleManager.allConflictedTransactions[i].transaction2.id) {
                    targetNode = nodes[j];
                }
            }

            sourceNode.drawConnection(targetNode.x, targetNode.y);
        }
    }
}

/*scheduleManager = new SerializableScheduleManager(RULENAME_LOSTUPDATE);
let one = scheduleManager.addTransaction();
let two = scheduleManager.addTransaction();
let three = scheduleManager.addTransaction();

a = scheduleManager.addDbObject();
b = scheduleManager.addDbObject();
let c = scheduleManager.addDbObject();

let nextStep = scheduleManager.addNewStep(BOT, one);
nextStep = scheduleManager.addNewStep(BOT, two, null, nextStep);
nextStep = scheduleManager.addNewStep(BOT, three, null, nextStep);
nextStep = scheduleManager.addNewStep(WRITE, three, a, nextStep);
nextStep = scheduleManager.addNewStep(READ, three, b, nextStep);
nextStep = scheduleManager.addNewStep(WRITE, one, b, nextStep);
nextStep = scheduleManager.addNewStep(WRITE, two, c, nextStep);
nextStep = scheduleManager.addNewStep(READ, one, a, nextStep);
nextStep = scheduleManager.addNewStep(READ, two, b, nextStep);
nextStep = scheduleManager.addNewStep(READ, one, c, nextStep);
nextStep = scheduleManager.addNewStep(COMMIT, three, null, nextStep);
nextStep = scheduleManager.addNewStep(COMMIT, two, null, nextStep);
nextStep = scheduleManager.addNewStep(COMMIT, one, null, nextStep);

scheduleManager.checkScheduleSerialized();*/

let counter = 0;
randomize(3, 3, true);

function randomize(numberofTransactions, numberOfDbObjects, serializable) {
    counter++;
    let table = document.getElementById("transactionTable");
    if (!table) {
        return;
    }
    clearTable(table);

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

    scheduleManager = new SerializableScheduleManager(RULENAME_SERIALIZABLE);
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
    let transactionTasksAlreadyExecuted = [];

    while (activeTransactions.length > 0) {
        let transactionIndex = randomNumber(0, activeTransactions.length - 1);
        let chosenTransaction = activeTransactions[transactionIndex];
        if (!chosenTransaction.started) {
            nextStep = scheduleManager.addNewStep(BOT, chosenTransaction, null, nextStep);
        } else {
            if (chosenTransaction.dbObjectsRead.length === 0 && chosenTransaction.dbObjectsWrote.length === 0) {

                let dbObjectIndex = randomNumber(0, numberOfDbObjects - 1);
                let chosenDbObject = scheduleManager.dbObjects[dbObjectIndex];
                let chosenTask;
                
                if (randomNumber(0, 1) === 1) {
                    chosenTask = READ;
                } else {
                    chosenTask = WRITE;
                }

                transactionTasksAlreadyExecuted.push(chosenTransaction.id + chosenDbObject.id + chosenTask);
                nextStep = scheduleManager.addNewStep(chosenTask, chosenTransaction, chosenDbObject, nextStep);
            } else {
                let number = randomNumber(0, 100);

                // lese oder schreibe auf ein weiteres datenbankobjekt mit hoher wahrscheinlichkeit, wenn die selbe aktion nicht bereits ausgeführt wurde 
                if (number < 80) {
                    let dbObjectIndex = randomNumber(0, numberOfDbObjects - 1);
                    let chosenDbObject = scheduleManager.dbObjects[dbObjectIndex];
                    let chosenTask;
                
                    if (randomNumber(0, 1) === 1) {
                        chosenTask = READ;
                    } else {
                        chosenTask = WRITE;
                    }

                    if (!transactionTasksAlreadyExecuted.includes(chosenTransaction.id + chosenDbObject.id + chosenTask) 
                        && (chosenTask === READ && !transactionTasksAlreadyExecuted.includes(chosenTransaction.id + chosenDbObject.id + WRITE))) {

                        transactionTasksAlreadyExecuted.push(chosenTransaction.id + chosenDbObject.id + chosenTask);
                        nextStep = scheduleManager.addNewStep(chosenTask, chosenTransaction, chosenDbObject, nextStep);
                    }
                } else {
                    nextStep = scheduleManager.addNewStep(COMMIT, chosenTransaction, null, nextStep);
                    activeTransactions.splice(transactionIndex, 1);
                }
            }
        }
    }

    if (scheduleManager.checkScheduleSerialized() === serializable || scheduleManager.schedule.length <= 4) {
        randomize(numberofTransactions, numberOfDbObjects, serializable);
        return;
    }

    if (document.getElementById("isSerialisable") !== null) {
        if (serializable === true) {
            document.getElementById("isSerialisable").hidden = true;
        } else {
            document.getElementById("isSerialisable").hidden = false;
        }
    }

    fillTable(table, scheduleManager);
}

// befüllt die Tabelle mit Informationen aus dem Schedule
function fillTable(table, scheduleManager) {
    let graphManager = new SerializableGraphManager();
    graphManager.drawGraph(scheduleManager);

    let header = table.createTHead();
    let row = header.insertRow(0);
    let cell = document.createElement("th")
    row.appendChild(cell);
    for (let i = 0; i < scheduleManager.transactions.length; i++) {
        let cell = document.createElement("th");
        cell.innerHTML = "T" + scheduleManager.transactions[i].id + "";
        row.appendChild(cell);
    }

    let body = table.createTBody();
    for (let i = 0; i < scheduleManager.schedule.length; i++) {
        let row = body.insertRow();
        let cell = row.insertCell();
        cell.innerHTML = i + 1;

        for (let j = 0; j < scheduleManager.transactions.length; j++) {
            if (scheduleManager.schedule[i].transaction.id - 1 === j) {
                cell = row.insertCell();
                cell.innerHTML = scheduleManager.schedule[i].task.toString(RULENAME_SERIALIZABLE);
            } else  {
                cell = row.insertCell();
            }
        }
    }

    table = document.getElementById('conflictTable');
    body = table.createTBody();
    row = body.insertRow();

    cell = row.insertCell();
    let conflicts = '';
    for (let i = 0; i < scheduleManager.allConflictedTransactions.length; i++) {
        if (conflicts !== '') {
            conflicts = conflicts + ' <b>|</b> ';
        }

        conflicts = conflicts + scheduleManager.allConflictedTransactions[i].tasks[0].task + '<sub>T' + scheduleManager.allConflictedTransactions[i].transaction1.id  + '</sub>(' + scheduleManager.allConflictedTransactions[i].tasks[0].object.id + ') ' + 
            scheduleManager.allConflictedTransactions[i].tasks[1].task + '<sub>T' + scheduleManager.allConflictedTransactions[i].transaction2.id  + '</sub>(' + scheduleManager.allConflictedTransactions[i].tasks[1].object.id + ')';
    }

    cell.innerHTML = conflicts;
}

// leert die Tabelle
function clearTable(table) {
    if (table.getElementsByTagName("tbody").length !== 0) {
        table.removeChild(table.getElementsByTagName("tbody")[0]);
    }
    table.deleteTHead();

    table = document.getElementById('conflictTable');
    if (table.getElementsByTagName("tbody").length !== 0) {
        table.removeChild(table.getElementsByTagName("tbody")[0]);
    }
}

