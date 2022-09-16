// Schedulemanager für die Anomalien, mit der Logik, um neue Transaktionsschritte hinzuzufügen
class AnomaliesScheduleManager extends ScheduleManager {
 
    constructor(ruleName) {
        super(ruleName);
    }

    addNewStep(task, transaction, dbObject, lastStep, value, value2) {
        let newTask;
        if (task === BOT) {
            transaction.started = true;
            return lastStep;
        } else if (task === READ) {
            newTask = new Task().read(dbObject);
            transaction.dbObjectsRead.push(dbObject);
            transaction.dbObjectValuesNotCalculated.push(dbObject);
            transaction.dbObjectsNotWrote.push(dbObject);
            if (dbObject.id === 'A') {
                transaction.localVariableA = dbObject.value;
            } else {
                transaction.localVariableB = dbObject.value;
            }
        } else if (task === WRITE) {
            newTask = new Task().write(dbObject);
            transaction.dbObjectsWrote.push(dbObject);
            if (lastStep !== undefined) {
                if (dbObject.id === 'A') {
                    lastStep.dbObjectStatus[0].value = transaction.localVariableA;
                    this.dbObjects[0].value = transaction.localVariableA;
                    transaction.localVariableA = undefined;
                } else {
                    lastStep.dbObjectStatus[1].value = transaction.localVariableB;
                    this.dbObjects[1].value = transaction.localVariableB;
                    transaction.localVariableB = undefined;
                }
            }
        } else if (task === ADD) {
            newTask = new Task().add(value, dbObject);
            if (dbObject.id === 'A') {
                transaction.localVariableA += value;
            } else {
                transaction.localVariableB += value;
            }
        } else if (task === ADDTONEWVALUE) {
            newTask = new Task().addToNewValue('c', value.toLowerCase(), value2.toLowerCase());
        } else if (task === SUB) {
            newTask = new Task().sub(value, dbObject);
            if (dbObject.id === 'A') {
                transaction.localVariableA -= value;
            } else {
                transaction.localVariableB -= value;
            }
        } else if (task === COMMIT) {
            transaction.finished = true;
            return lastStep;
        } else if (task === ROLLBACK) {
            newTask = new Task().rollback();
            transaction.finished = true;
            transaction.rollback = true;
        }
        let newStep;
        if (!lastStep) {
            newStep = new TransactionStep(transaction, newTask, this.dbObjects);
            newStep.transactionsStatus = JSON.parse(JSON.stringify(this.transactions));
        } else {
            newStep = lastStep;
            newStep.task = newTask;
            newStep.transaction = transaction;
            newStep.transactionsStatus = JSON.parse(JSON.stringify(this.transactions));
        }
        

        this.schedule.push(newStep);
        return newStep.createNextStep();
    }
}

let scheduleManager 
/*= new AnomaliesScheduleManager(RULENAME_LOSTUPDATE);
scheduleManager.addTransaction();
scheduleManager.addTransaction();

let a = scheduleManager.addDbObject();
a.value = 30;*/
//let b = scheduleManager.addDbObject();


//let nextStep = scheduleManager.addNewStep(BOT, scheduleManager.transactions[0]);
//nextStep = scheduleManager.addNewStep(READ, scheduleManager.transactions[0], a);
//nextStep = scheduleManager.addNewStep(BOT, scheduleManager.transactions[1], null, nextStep);
//nextStep = scheduleManager.addNewStep(ADD, scheduleManager.transactions[0], a, nextStep, 20);
//nextStep = scheduleManager.addNewStep(READ, scheduleManager.transactions[1], a, nextStep);
//nextStep = scheduleManager.addNewStep(ADD, scheduleManager.transactions[1], a, nextStep, 30);
//nextStep = scheduleManager.addNewStep(WRITE, scheduleManager.transactions[1], a, nextStep);
//nextStep = scheduleManager.addNewStep(WRITE, scheduleManager.transactions[0], a, nextStep);
//nextStep = scheduleManager.addNewStep(COMMIT, scheduleManager.transactions[0], null, nextStep);
//nextStep = scheduleManager.addNewStep(COMMIT, scheduleManager.transactions[1], null, nextStep);

// erzeugt beim initialen Aufrufen die Inhalte für die einzelnen Registerkarten
if (document.getElementById("lostUpdateTable") !== undefined) {
    randomizeLostUpdate(2, 1, true);
    randomizeDirtyRead(2, 1, true);
    randomizeNonRepeatableRead(2, 2, true);
}

// Erzeugt eine Zufallskonstellation für die Anomalie Lost Update
function randomizeLostUpdate(numberofTransactions, numberOfDbObjects, withAnomaly) {
    let table = document.getElementById("lostUpdateTable");
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

    let orientationNumber = randomNumber(5, 50) * 10;

    scheduleManager = new AnomaliesScheduleManager(RULENAME_LOSTUPDATE);
    for (let i = 0; i < numberofTransactions; i++) {
        scheduleManager.addTransaction();
    }

    for (let i = 0; i < numberOfDbObjects; i++) {
        let newDbObject = scheduleManager.addDbObject();
        if (i % 4 === 0) {
            newDbObject.value = orientationNumber * 0.8;
        } else if (i % 4 === 1) {
            newDbObject.value = orientationNumber * 1.2;
        } else if (i % 4 === 2) {
            newDbObject.value = orientationNumber * 1.1;
        } else if (i % 4 === 3) {
            newDbObject.value = orientationNumber * 0.9;
        }
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
            nextStep = scheduleManager.addNewStep(BOT, chosenTransaction, null, nextStep);
        } else {
            if (chosenTransaction.dbObjectsRead.length === 0) {
                let dbObjectIndex = randomNumber(0, numberOfDbObjects - 1);
                let chosenDbObject = scheduleManager.dbObjects[dbObjectIndex];

                // wenn kein lost Update erzeugt werden soll, darf das Db-Objekt noch von keiner anderen Transaktion gelesen worden sein
                if (withAnomaly === false) {
                    // schreibe nur fest, wenn dieses datenbankobjekt bereits von einer anderen transaktion gelesen wurde
                    let dbObjectReadByAnotherTransaction = false;
                    for (let i = 0; i < scheduleManager.transactions.length; i++) {
                        if (scheduleManager.transactions[i].id !== chosenTransaction.id && scheduleManager.transactions[i].dbObjectsRead.indexOf(chosenDbObject) !== -1 && scheduleManager.transactions[i].finished === false) {
                            dbObjectReadByAnotherTransaction = true;
                        }
                    }
                    if (dbObjectReadByAnotherTransaction === true) {
                        continue;
                    }
                }

                nextStep = scheduleManager.addNewStep(READ, chosenTransaction, chosenDbObject, nextStep);
            } else {
                // wenn noch nicht alle möglichen dbObjekte gelesen wurden und der Zufall es so will, Lese ein datenbankobject 
                if (chosenTransaction.dbObjectsRead.length !== numberOfDbObjects && randomNumber(0, 1) === 0) {
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

                    // wenn kein lost Update erzeugt werden soll, darf das Db-Objekt noch von keiner anderen Transaktion gelesen worden sein
                    if (withAnomaly === false) {
                        // schreibe nur fest, wenn dieses datenbankobjekt bereits von einer anderen transaktion gelesen wurde
                        let dbObjectReadByAnotherTransaction = false;
                        for (let i = 0; i < scheduleManager.transactions.length; i++) {
                            if (scheduleManager.transactions[i].id !== chosenTransaction.id && scheduleManager.transactions[i].dbObjectsRead.indexOf(newDbObjectToRead) !== -1 && scheduleManager.transactions[i].finished === false) {
                                dbObjectReadByAnotherTransaction = true;
                            }
                        }
                        if (dbObjectReadByAnotherTransaction === true) {
                            continue;
                        }
                    }

                    nextStep = scheduleManager.addNewStep(READ, chosenTransaction, newDbObjectToRead, nextStep);

                // sonst rechne, schreibe oder beende
                } else {
                    if (chosenTransaction.dbObjectValuesNotCalculated.length > 0 || chosenTransaction.dbObjectsNotWrote.length > 0) {
                        let newDbObjectToWork;
                        let nextStepIsCalculation;

                        // ermittle so lange ein zufälliges datenbankobjekt, bis eins ausgewählt wurde, zu welchem entweder noch nicht addiert/subtrahiert oder geschrieben wurde
                        do {
                            let dbObjectIndex = randomNumber(0, numberOfDbObjects - 1);
                            newDbObjectToWork = scheduleManager.dbObjects[dbObjectIndex];

                            for (let i = 0; i < chosenTransaction.dbObjectsNotWrote.length; i++) {
                                if (chosenTransaction.dbObjectsNotWrote[i].id === newDbObjectToWork.id) {
                                    nextStepIsCalculation = false;
                                    break;
                                }
                            }

                            for (let i = 0; i < chosenTransaction.dbObjectValuesNotCalculated.length; i++) {
                                if (chosenTransaction.dbObjectValuesNotCalculated[i].id === newDbObjectToWork.id) {
                                    nextStepIsCalculation = true;
                                    break;
                                }
                            }
                        } while (nextStepIsCalculation === undefined)

                        if (nextStepIsCalculation) {
                            let addOrSubNumber;
                            if (randomNumber(0, 1) === 0) {
                                addOrSubNumber = orientationNumber * 0.1;
                            } else {
                                addOrSubNumber = orientationNumber * 0.05;
                            }

                            if (randomNumber(0, 1) === 0) {
                                nextStep = scheduleManager.addNewStep(ADD, chosenTransaction, newDbObjectToWork, nextStep, addOrSubNumber);
                            } else {
                                nextStep = scheduleManager.addNewStep(SUB, chosenTransaction, newDbObjectToWork, nextStep, addOrSubNumber);
                            }

                            for (let i = 0; i < chosenTransaction.dbObjectValuesNotCalculated.length; i++) {
                                if (chosenTransaction.dbObjectValuesNotCalculated[i].id === newDbObjectToWork.id) {
                                    chosenTransaction.dbObjectValuesNotCalculated.splice(i, 1);
                                    break;
                                }
                            }

                        } else {
                            if (withAnomaly === true) {
                                // schreibe nur fest, wenn dieses datenbankobjekt bereits von einer anderen transaktion gelesen wurde
                                let dbObjectReadByAnotherTransaction = false;
                                for (let i = 0; i < scheduleManager.transactions.length; i++) {
                                    if (scheduleManager.transactions[i].id !== chosenTransaction.id && scheduleManager.transactions[i].dbObjectsRead.indexOf(newDbObjectToWork) !== -1) {
                                        dbObjectReadByAnotherTransaction = true;
                                    }
                                }
                                if (dbObjectReadByAnotherTransaction === false) {
                                    continue;
                                }
                            }

                            nextStep = scheduleManager.addNewStep(WRITE, chosenTransaction, newDbObjectToWork, nextStep);
                            for (let i = 0; i < chosenTransaction.dbObjectsNotWrote.length; i++) {
                                if (chosenTransaction.dbObjectsNotWrote[i].id === newDbObjectToWork.id) {
                                    chosenTransaction.dbObjectsNotWrote.splice(i, 1);
                                    break;
                                }
                            }
                        }

                    } else {
                        nextStep = scheduleManager.addNewStep(COMMIT, chosenTransaction, null, nextStep);
                        activeTransactions.splice(transactionIndex, 1);
                    }
                }
            }
        }
    }

    fillTable(table, scheduleManager);
}

// Erzeugt eine Zufallskonstellation für die Anomalie Dirty Read
function randomizeDirtyRead(numberofTransactions, numberOfDbObjects, withAnomaly) {
    let table = document.getElementById("dirtyReadTable");
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

    let orientationNumber = randomNumber(5, 50) * 10;

    scheduleManager = new AnomaliesScheduleManager(RULENAME_LOSTUPDATE);
    for (let i = 0; i < numberofTransactions; i++) {
        scheduleManager.addTransaction();
    }

    for (let i = 0; i < numberOfDbObjects; i++) {
        let newDbObject = scheduleManager.addDbObject();
        if (i % 4 === 0) {
            newDbObject.value = orientationNumber * 0.8;
        } else if (i % 4 === 1) {
            newDbObject.value = orientationNumber * 1.2;
        } else if (i % 4 === 2) {
            newDbObject.value = orientationNumber * 1.1;
        } else if (i % 4 === 3) {
            newDbObject.value = orientationNumber * 0.9;
        }
    }

    let activeTransactions = [];
    for (let i = 0; i < scheduleManager.transactions.length; i++) {
        activeTransactions.push(scheduleManager.transactions[i]);
    }

    let nextStep;
    let transactionWillBeRollbacked;

    while (activeTransactions.length > 0) {
        let transactionIndex = randomNumber(0, activeTransactions.length - 1);
        let chosenTransaction = activeTransactions[transactionIndex];
        if (!chosenTransaction.started) {
            nextStep = scheduleManager.addNewStep(BOT, chosenTransaction, null, nextStep);
        } else {
            if (chosenTransaction.dbObjectsRead.length === 0) {
                let dbObjectIndex = randomNumber(0, numberOfDbObjects - 1);
                let chosenDbObject = scheduleManager.dbObjects[dbObjectIndex];

                // wenn ein dirty read erzeugt werden soll, darf das Db-Objekt noch von keiner anderen Transaktion gelesen worden sein
                if (withAnomaly === true) {
                    let dbObjectReadByAnotherTransaction = false;
                    for (let i = 0; i < scheduleManager.transactions.length; i++) {
                        if (scheduleManager.transactions[i].id !== chosenTransaction.id && scheduleManager.transactions[i].dbObjectsRead.indexOf(chosenDbObject) !== -1 && scheduleManager.transactions[i].finished === false) {
                            dbObjectReadByAnotherTransaction = true;
                        }
                    }

                    if (dbObjectReadByAnotherTransaction === true) {
                        continue;
                    }
                }


                if (!transactionWillBeRollbacked) {
                    transactionWillBeRollbacked = chosenTransaction;
                }

                nextStep = scheduleManager.addNewStep(READ, chosenTransaction, chosenDbObject, nextStep);
            } else {
                // wenn noch nicht alle möglichen dbObjekte gelesen wurden und der Zufall es so will, Lese ein datenbankobject 
                if (chosenTransaction.dbObjectsRead.length !== numberOfDbObjects && randomNumber(0, 1) === 0) {
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

                    // wenn ein dirty read erzeugt werden soll, darf das Db-Objekt noch von keiner anderen Transaktion gelesen worden sein
                    if (withAnomaly === true) {
                        // schreibe nur fest, wenn dieses datenbankobjekt bereits von einer anderen transaktion gelesen wurde
                        let dbObjectReadByAnotherTransaction = false;
                        for (let i = 0; i < scheduleManager.transactions.length; i++) {
                            if (scheduleManager.transactions[i].id !== chosenTransaction.id && scheduleManager.transactions[i].dbObjectsRead.indexOf(newDbObjectToRead) !== -1 && scheduleManager.transactions[i].finished === false) {
                                dbObjectReadByAnotherTransaction = true;
                            }
                        }
                        if (dbObjectReadByAnotherTransaction === true) {
                            continue;
                        }
                    }

                    nextStep = scheduleManager.addNewStep(READ, chosenTransaction, newDbObjectToRead, nextStep);

                // sonst rechne, schreibe oder beende
                } else {
                    if (chosenTransaction.dbObjectValuesNotCalculated.length > 0 || chosenTransaction.dbObjectsNotWrote.length > 0) {
                        let newDbObjectToWork;
                        let nextStepIsCalculation;

                        // ermittle so lange ein zufälliges datenbankobjekt, bis eins ausgewählt wurde, zu welchem entweder noch nicht addiert/subtrahiert oder geschrieben wurde
                        do {
                            let dbObjectIndex = randomNumber(0, numberOfDbObjects - 1);
                            newDbObjectToWork = scheduleManager.dbObjects[dbObjectIndex];

                            for (let i = 0; i < chosenTransaction.dbObjectsNotWrote.length; i++) {
                                if (chosenTransaction.dbObjectsNotWrote[i].id === newDbObjectToWork.id) {
                                    nextStepIsCalculation = false;
                                    break;
                                }
                            }

                            for (let i = 0; i < chosenTransaction.dbObjectValuesNotCalculated.length; i++) {
                                if (chosenTransaction.dbObjectValuesNotCalculated[i].id === newDbObjectToWork.id) {
                                    nextStepIsCalculation = true;
                                    break;
                                }
                            }
                        } while (nextStepIsCalculation === undefined)

                        if (nextStepIsCalculation) {
                            let addOrSubNumber;
                            if (randomNumber(0, 1) === 0) {
                                addOrSubNumber = orientationNumber * 0.1;
                            } else {
                                addOrSubNumber = orientationNumber * 0.05;
                            }

                            // Zufallsauswahl der mathematischen Operation entfernt, da "invesrse" Operationen mit den selben Zahlen entstehen konnten, bei denen zufällig die Anomalie nicht auftritt
                            //if (randomNumber(0, 1) === 0) {
                                nextStep = scheduleManager.addNewStep(ADD, chosenTransaction, newDbObjectToWork, nextStep, addOrSubNumber);
                            //} else {
                            //    nextStep = scheduleManager.addNewStep(SUB, chosenTransaction, newDbObjectToWork, nextStep, addOrSubNumber);
                            //}

                            for (let i = 0; i < chosenTransaction.dbObjectValuesNotCalculated.length; i++) {
                                if (chosenTransaction.dbObjectValuesNotCalculated[i].id === newDbObjectToWork.id) {
                                    chosenTransaction.dbObjectValuesNotCalculated.splice(i, 1);
                                    break;
                                }
                            }

                            if (chosenTransaction.id === transactionWillBeRollbacked.id && randomNumber(0, 1) === 0 && withAnomaly === false) {
                                nextStep = scheduleManager.addNewStep(ROLLBACK, chosenTransaction, null, nextStep);
                                activeTransactions.splice(activeTransactions.indexOf(chosenTransaction), 1);
                            }

                        } else {
                            if (withAnomaly === false) {
                                // schreibe nur fest, wenn dieses datenbankobjekt bereits von einer anderen transaktion gelesen wurde
                                let dbObjectReadByAnotherTransaction = false;
                                for (let i = 0; i < scheduleManager.transactions.length; i++) {
                                    if (scheduleManager.transactions[i].id !== chosenTransaction.id && scheduleManager.transactions[i].dbObjectsRead.indexOf(newDbObjectToWork) !== -1) {
                                        dbObjectReadByAnotherTransaction = true;
                                    }
                                }
                                if (dbObjectReadByAnotherTransaction === false) {
                                    continue;
                                }
                            }

                            if (!(chosenTransaction.id === transactionWillBeRollbacked.id && withAnomaly === false)) {    
                                nextStep = scheduleManager.addNewStep(WRITE, chosenTransaction, newDbObjectToWork, nextStep);
                            }

                            for (let i = 0; i < chosenTransaction.dbObjectsNotWrote.length; i++) {
                                if (chosenTransaction.dbObjectsNotWrote[i].id === newDbObjectToWork.id) {
                                    chosenTransaction.dbObjectsNotWrote.splice(i, 1);
                                    break;
                                }
                            }

                            if (chosenTransaction.id !== transactionWillBeRollbacked.id && transactionWillBeRollbacked.rollback === false) {
                                nextStep = scheduleManager.addNewStep(ROLLBACK, transactionWillBeRollbacked, null, nextStep);
                                activeTransactions.splice(activeTransactions.indexOf(transactionWillBeRollbacked), 1);
                            }
                        }

                    } else {
                        nextStep = scheduleManager.addNewStep(COMMIT, chosenTransaction, null, nextStep);
                        activeTransactions.splice(transactionIndex, 1);
                    }
                }
            }
        }
    }

    fillTable(table, scheduleManager);
}

// Erzeugt eine Zufallskonstellation für die Anomalie Non Repeatable Read
function randomizeNonRepeatableRead(numberofTransactions, numberOfDbObjects, withAnomaly) {
    let table = document.getElementById("nonRepeatableReadTable");
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

    let orientationNumber = randomNumber(5, 50) * 10;

    scheduleManager = new AnomaliesScheduleManager(RULENAME_LOSTUPDATE);
    for (let i = 0; i < numberofTransactions; i++) {
        scheduleManager.addTransaction();
    }

    for (let i = 0; i < numberOfDbObjects; i++) {
        let newDbObject = scheduleManager.addDbObject();
        if (i % 4 === 0) {
            newDbObject.value = orientationNumber * 0.8;
        } else if (i % 4 === 1) {
            newDbObject.value = orientationNumber * 1.2;
        } else if (i % 4 === 2) {
            newDbObject.value = orientationNumber * 1.1;
        } else if (i % 4 === 3) {
            newDbObject.value = orientationNumber * 0.9;
        }
    }

    let activeTransactions = [];
    for (let i = 0; i < scheduleManager.transactions.length; i++) {
        activeTransactions.push(scheduleManager.transactions[i]);
    }

    let nextStep;
    let transactionOnlyRead;

    while (activeTransactions.length > 0) {
        let transactionIndex = randomNumber(0, activeTransactions.length - 1);
        let chosenTransaction = activeTransactions[transactionIndex];
        if (!chosenTransaction.started) {
            nextStep = scheduleManager.addNewStep(BOT, chosenTransaction, null, nextStep);
        } else {
            if (chosenTransaction.dbObjectsRead.length === 0) {
                let dbObjectIndex = randomNumber(0, numberOfDbObjects - 1);
                let chosenDbObject = scheduleManager.dbObjects[dbObjectIndex];

                if (!transactionOnlyRead && withAnomaly === true) {
                    transactionOnlyRead = chosenTransaction;
                    nextStep = scheduleManager.addNewStep(READ, chosenTransaction, chosenDbObject, nextStep);
                } else {
                    nextStep = scheduleManager.addNewStep(READ, chosenTransaction, chosenDbObject, nextStep);

                    let addOrSubNumber;
                    if (randomNumber(0, 1) === 0) {
                        addOrSubNumber = orientationNumber * 0.1;
                    } else {
                        addOrSubNumber = orientationNumber * 0.05;
                    }

                    let addOrSub = randomNumber(0, 1);
                    if (addOrSub === 0) {
                        nextStep = scheduleManager.addNewStep(ADD, chosenTransaction, chosenDbObject, nextStep, addOrSubNumber);
                    } else {
                        nextStep = scheduleManager.addNewStep(SUB, chosenTransaction, chosenDbObject, nextStep, addOrSubNumber);
                    }

                    let secondChosenDbObject;
                    if (dbObjectIndex === 0) {
                        secondChosenDbObject = scheduleManager.dbObjects[1];
                    } else {
                        secondChosenDbObject = scheduleManager.dbObjects[0];
                    }
                    nextStep = scheduleManager.addNewStep(READ, chosenTransaction, secondChosenDbObject, nextStep);

                    if (randomNumber(0, 1) === 0) {
                        addOrSubNumber = orientationNumber * 0.1;
                    } else {
                        addOrSubNumber = orientationNumber * 0.05;
                    }

                    if (addOrSub === 0) {
                        nextStep = scheduleManager.addNewStep(ADD, chosenTransaction, secondChosenDbObject, nextStep, addOrSubNumber);
                    } else {
                        nextStep = scheduleManager.addNewStep(SUB, chosenTransaction, secondChosenDbObject, nextStep, addOrSubNumber);
                    }

                    nextStep = scheduleManager.addNewStep(WRITE, chosenTransaction, chosenDbObject, nextStep, addOrSubNumber);
                    nextStep = scheduleManager.addNewStep(WRITE, chosenTransaction, secondChosenDbObject, nextStep, addOrSubNumber);
                    nextStep = scheduleManager.addNewStep(COMMIT, chosenTransaction, null, nextStep, addOrSubNumber);
                    activeTransactions.splice(transactionIndex, 1);

                    let newTransactionChosen
                    if (transactionIndex === 0) {
                        newTransactionChosen = scheduleManager.transactions[1];
                    } else {
                        newTransactionChosen = scheduleManager.transactions[0];
                    }

                    if (withAnomaly === false) {
                        for (let i = 0; i < scheduleManager.dbObjects.length; i++) {
                            nextStep = scheduleManager.addNewStep(READ, newTransactionChosen, scheduleManager.dbObjects[i], nextStep);
                        }
                        activeTransactions.splice(0, 1);
                    } else {
                        if (newTransactionChosen.dbObjectsRead[0].id === 'B') {
                            secondChosenDbObject = scheduleManager.dbObjects[0];
                        } else {
                            secondChosenDbObject = scheduleManager.dbObjects[1];
                        }
                        
                        nextStep = scheduleManager.addNewStep(READ, newTransactionChosen, secondChosenDbObject, nextStep);
                        nextStep = scheduleManager.addNewStep(ADDTONEWVALUE, newTransactionChosen, null, nextStep, scheduleManager.dbObjects[0].id, scheduleManager.dbObjects[1].id)
                        nextStep = scheduleManager.addNewStep(COMMIT, newTransactionChosen, null, nextStep, addOrSubNumber);
                        activeTransactions.splice(0, 1);
                    }
                }
                
            } 
        }
    }

    fillTable(table, scheduleManager);
}

// befüllt die Tabelle mit Informationen basierend auf dem Schedule
function fillTable(table, scheduleManager) {
    let header = table.createTHead();
    let row = header.insertRow(0);
    let cell = document.createElement("th")
    row.appendChild(cell);
    for (let i = 0; i < scheduleManager.transactions.length; i++) {
        let cell = document.createElement("th");
        cell.innerHTML = "T" + scheduleManager.transactions[i].id + "";
        row.appendChild(cell);
    }
    for (let i = 0; i < scheduleManager.dbObjects.length; i++) {
        let cell = document.createElement("th");
        cell.innerHTML = "" + scheduleManager.dbObjects[i].id + "";
        row.appendChild(cell);
    }
    
    for (let i = 0; i < scheduleManager.transactions.length; i++) {
        for (let j = 0; j < scheduleManager.dbObjects.length; j++) {
            let cell = document.createElement("th");
            cell.innerHTML = scheduleManager.dbObjects[j].id.toLowerCase() + "<sub>"+ scheduleManager.transactions[i].id + "</sub>";
            row.appendChild(cell);
        }
    }

    let body = table.createTBody();
    for (let i = 0; i < scheduleManager.schedule.length; i++) {
        let row = body.insertRow();
        let cell = row.insertCell();
        cell.innerHTML = i + 1;

        for (let j = 0; j < scheduleManager.transactions.length; j++) {
            if (scheduleManager.schedule[i].transaction.id - 1 === j) {
                cell = row.insertCell();
                cell.innerHTML = scheduleManager.schedule[i].task.toString(RULENAME_LOSTUPDATE);
            } else  {
                cell = row.insertCell();
            }
        }

        for (let j = 0; j < scheduleManager.dbObjects.length; j++) {
            cell = row.insertCell();
            cell.innerHTML = scheduleManager.schedule[i].dbObjectStatus[j].value;
        }

        for (let j = 0; j < scheduleManager.transactions.length; j++) {
            for (let k = 0; k < scheduleManager.dbObjects.length; k++) {
                cell = row.insertCell();
                if (k === 0) {
                    if (scheduleManager.schedule[i].transactionsStatus[j].localVariableA) {
                        cell.innerHTML = scheduleManager.schedule[i].transactionsStatus[j].localVariableA;
                    } else {
                        cell.innerHTML = "-";
                    }
                    
                } else if (k === 1) {
                    if (scheduleManager.schedule[i].transactionsStatus[j].localVariableB) {
                        cell.innerHTML = scheduleManager.schedule[i].transactionsStatus[j].localVariableB;
                    } else {
                        cell.innerHTML = "-";
                    }
                }
            }
        }
    }
}


// leer die Tabelle
function clearTable(table) {
    if (table.getElementsByTagName("tbody").length !== 0) {
        table.removeChild(table.getElementsByTagName("tbody")[0]);
    }
    table.deleteTHead();
}

// erzeugt eine pseudezufällige Zahl
function randomNumber(min, max) {
    return Math.floor(Math.random()*(max-min+1)+min);
}