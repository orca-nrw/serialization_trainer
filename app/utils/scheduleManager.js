const BOT = "BOT";
const COMMIT = "commit;";
const ROLLBACK = "rollback";
const LOCKR = "lockR";
const LOCKW = "lockW";
const READ = "read";
const WRITE = "write";
const UNLOCKR = "unlockR";
const UNLOCKW = "unlockW";
const ENDREADPHASE = "endReadPhase";
const ADD = "add";
const ADDTONEWVALUE = "addToNewValue";
const SUB = "sub";
const VALIDATEPHASE = "validatePhase";
const WRITEPHASE = "writePhase";

const RULENAME_2PS = "2ps";
const RULENAME_TIMESTAMP = "timestamp";
const RULENAME_OPTIMISTIC = "optimistic";
const RULENAME_LOSTUPDATE = "lost_update";
const RULENAME_SERIALIZABLE = "serializable";

// Transaktion
class Transaction {
    constructor(id) {
        // eindeutiger Bezeichner der Transaktion
        this.id = id;

        // wurde die Transaktion bereits gestartet
        this.started = false;

        // wurde die Transaktion bereits beendet
        this.finished = false;

        // Anzahl der Sperren pro Transaktionsschritt
        this.numberOfLocksPerStep = [];

        // gesetzte Schreibsperren auf Datenbankobjekte von dieser Transaktion
        this.lockedWDbObjects = [];

        // gesetzte Lesesperren auf Datenbankobjekte von dieser Transaktion
        this.lockedRDbObjects = [];

        // freigegebene Schreibsperren von dieser Transaktion
        this.unlockedWDbObjects = [];

        // freigegebene Lesesperren von dieser Transaktion
        this.unlockedRDbObjects = [];

        // muss diese Transkation gerade warten
        this.waiting = false;

        // befindet sich diese Transaktion in der Wachstumsphase (2ps)
        this.lockingPhase = true;

        // startzeitpunkt der Transaktion (bot = begin of transaction)
        this.botTime;

        // wurde diese Transaktion zurückgerollt
        this.rollback = false;

        // befindet sich diese Transaktion in der Lesephase
        this.readPhase = false;

        // welche Datenbankobjekte wurden von anderen Transaktionen geändert, währendn sich diese Transaktionin der Lesephase befan
        this.dbObjectsWroteOfOtherTransactions = [];

        // welche anderen Transaktion wurden beendet, während diese Transaktion noch in der Lesephase war
        this.otherTransactionsFinished = [];

        // welche Datenbankobjekte wurden geändert
        this.dbObjectsWrote = [];

        // welche Datenbankobjekte wurden gelesen
        this.dbObjectsRead = [];

        // ist die Validation gescheitert
        this.validationFailed = false;

        //lokal gespeicherte Variable aus dem ersten DAtenbankobjekt A
        this.localVariableA;

        //lokal gespeicherte Variable aus dem zweiten DAtenbankobjekt B
        this.localVariableB;

        // Gelesene Datenbankobjekte, mit deren gelesenen Werte noch keine Berechnung stattgefunden hat
        this.dbObjectValuesNotCalculated = [];

        // Datenbankobjkte, welche gelesen aber noch nicht gäendert wurden
        this.dbObjectsNotWrote = [];
    }

    // gibt den Namen der Transaktion so formatiert zurück, dass der Identifier tiefergestellt ist
    toString() {
        return "T<sub>" + this.id + "</sub>";
    }
}

// Transaktionsoperation
class Task {
    constructor() {
        // name der Transaktionsoeration
        this.task = "";

        // Datenbankobjekte, auf den die Operation angewendet wird (wird nicht bei allen Operationen befüllt)
        this.object;

        // Wert 1, der der Operation übergeben wird
        this.value;

        // Wert 2, der der Operation übergeben wird
        this.value2;
    }

    // Transaktion starten
    bot() {
        this.task = BOT;
        this.started = true;
        return this;
    }

    // Transaktion commiten
    commit() {
        this.task = COMMIT;
        this.finished = true;
        return this;
    }

    // Transaktion zurückrollen
    rollback() {
        this.task = ROLLBACK;
        return this;
    }

    // Lesesperre auf DAtenbankobjekt setzen
    lockR(object) {
        this.task = LOCKR;
        this.object = object;
        return this;
    }

    // Schreibsperre auf Datenbankobjekt setzen
    lockW(object) {
        this.task = LOCKW;
        this.object = object;
        return this;
    }

    // Wert aus Datenbankobjekt lesen
    read(object) {
        this.task = READ;
        this.object = object;
        return this;
    }

    // Wert in Datenbankobjekt schreiben
    write(object) {
        this.task = WRITE;
        this.object = object;
        return this;
    }

    // Lesesperre auf Datenbankobjekt freigeben
    unlockR(object) {
        this.task = UNLOCKR;
        this.object = object;
        return this;
    }

    // Schreibsperre auf Datenbankojekt  freigeben
    unlockW(object) {
        this.task = UNLOCKW;
        this.object = object;
        return this;
    }

    // Addierung auf gelesenen Wert von DAtenbankobjekt durchführen
    add(value, object) {
        this.task = ADD;
        this.object = object;
        this.value = value;
        return this;
    }

    // Subtraktion auf gelesenen Wert von DAtenbankobjekt durchführen
    sub(value, object) {
        this.task = SUB;
        this.object = object;
        this.value = value;
        return this;
    }

    // Zwei Werte miteinander addieren
    addToNewValue(object, value1, value2) {
        this.task = ADDTONEWVALUE;
        this.object = object;
        this.value = value1;
        this.value2 = value2;
        return this;
    }

    // Validierungsphase beginnen
    validatePhase() {
        this.task = VALIDATEPHASE;
        return this;
    }

    // Schreibphase beginnen
    writePhase() {
        this.task = WRITEPHASE;
        return this;
    }

    // Transaktionsoperation in lesbares Format übertragen für die Einträge in der Tabelle oder dem Diagramm
    toString(rulename) {
        if (this.task === LOCKR || this.task === LOCKW || this.task === UNLOCKR || this.task === UNLOCKW || this.task === READ || this.task === WRITE) {
            if (rulename === RULENAME_LOSTUPDATE) {
                return this.task + "(" + this.object.id + ", " + this.object.id.toLowerCase() + ")";
            } else {
                return this.task + "(" + this.object.id + ")";
            }
        } else if (this.task === SUB || this.task === ADD) {
            let symbol = "";
            if (this.task === SUB) {
                 symbol = "-";
            } else {
                symbol = "+";
            }
            return this.object.id.toLowerCase() + " = " + this.object.id.toLowerCase() + " " + symbol + " " + this.value;
        } else if (this.task === ADDTONEWVALUE) {
            return this.object + " = " + this.value + " + " + this.value2;
        } else {
            return this.task
        }
    }

}

// Blockierte Transaktion
class TransactionWaiting {
    constructor(transactionWaiting, transactionBlocking, dbObject) {
        // Blockierte Transaktion die warten muss
        this.transactionWaiting = transactionWaiting;

        // Blockierende Transaktion, die für die Blockierung zuständig ist
        this.transactionBlocking = transactionBlocking;

        // Datenbankobjekt, auf welches die blockierte Transaktion zugreifen möchte
        this.dbObject = dbObject;

        // handelt es sich bei der Ursache um eine Lesesperre, die angefordert wurde
        this.isReadLock = false;
    }
}

// Datenbankobjekt
class DbObject {
    constructor(id) {
        // Eindeutiger Bezeichner des Datenbankobjekte
        this.id = id;

        // Aktueller Wert im Datenbankobjekt
        this.value = 0;

        // Transaktionen, welche eine Lesesperre auf diesem Datenbankobjekt halten
        this.lockR = [];

        // Transaktion, welche eine Schreibsperre auf dem Datenbankobjekt hält
        this.lockW;

        // Zeitpunkt der Transaktion, welche als letztes erfolgreich auf dieses DAtenbankobjekt zugegriffen hat
        this.readTS;

        // Zeitpunkt der Transaktion, welche als letztes erfolgreich  dieses DAtenbankobjekt geändert hat
        this.writeTS;
    }
}


// Transaktionsschritt
class TransactionStep {
    constructor(transaction, task, dbObjectStatus, transactionsWaiting) {
        // Transaktion, welche diesen Schritt ausführt
        this.transaction = transaction;

        // Operation welche ausgeführt wird
        this.task = task;

        // Instanzen aller Datenbankobjekte mit dem Zustand der Datenbankobjekte in diese Schritt
        if (!dbObjectStatus) {
            this.dbObjectStatus = [];
        } else {
            this.dbObjectStatus = JSON.parse(JSON.stringify(dbObjectStatus));
        }

        // Liste aller blockierten Transaktionen während diesem Schrittes
        if (!transactionsWaiting) {
            this.transactionsWaiting = []
        } else {
            this.transactionsWaiting = [...transactionsWaiting];
        }

        // wird in diesem Schritt gegen die Zeitstempelregel verstoßen
        this.violateTimestampRule = false;

        // liegt in disem Schritt ein deadlock vor
        this.deadLock = false;

        // Eine Liste von Instanzen aller Transaktionen mit den Zuständen in diesem Schritt
        this.transactionsStatus = [];
    }

    // erzeugt von den Datenbankobjekten einen Klon
    cloneDbObjectStatus() {
        let cloneDbObjectStatus = [];
        for (let i = 0; i < this.dbObjectStatus.length; i++) {
            cloneDbObjectStatus.push(JSON.parse(JSON.stringify(this.dbObjectStatus[i])));
        }
        return cloneDbObjectStatus;
    }

    // Erzeugt einen neuen Schritt basierend auf diesen Schritt
    createNextStep() {
        let nextStep = new TransactionStep(this.transaction, undefined, undefined, this.transactionsWaiting);
        nextStep.dbObjectStatus = this.cloneDbObjectStatus();
        nextStep.deadLock = this.deadLock;
        return nextStep;
    }
}

// Dieses Objekt vereint alle Informationen zu und um einen Schedule herum
class ScheduleManager {
    constructor(ruleName) {
        // Alle Transaktionen, welche in diesem schedule existieern
        this.transactions = [];

        // Alle DAtenbankobjekte, welche in diesem Schedule existieren
        this.dbObjects = [];

        // Der Schedule, besthend aus allen Transaktionsschritten
        this.schedule = [];

        // Regelwerk, welches dem Schedule zugrunde liegt (wie z.B. 2ps für das Zwei-Phasen-Sperrprotokoll)
        this.ruleName = ruleName;
    }

    // Fügt eine neue Transaktion zu diesem Schedule hinzu
    addTransaction() {
        let newTransactionNumber = this.transactions.length + 1;
        let newTransaction = new Transaction(newTransactionNumber);
        this.transactions.push(newTransaction);
        return newTransaction;
    }

    // Fügt ein neues Datenbankobjekt zu diesem Schedule hinzu
    addDbObject() {
        let newDbObjectLetter = String.fromCharCode(65 + this.dbObjects.length);
        let newDbObject = new DbObject(newDbObjectLetter);
        this.dbObjects.push(newDbObject);
        return newDbObject;
    }
}

// Graphknoten, welcher für die gerichteten Knoten verwendet wurd (ACHTUNG: Aktuell werden nur maximal 3 Knoten unterstützt!)
class GraphNode {
    constructor(ctx, transaction, numberOfNode) {
        // Kontext, auf den der Knoten gezeichnert werden soll
        this.ctx = ctx;

        // Tranasktion, welcher diesem Knoten zugeordnet ist
        this.transaction = transaction;
        // Um welchen Knoten es sich hier handetl (wichtig für die Positionierung)
        this.numberOfNode = numberOfNode;
        this.x = 50 - ((numberOfNode % 2) - 1) * 150;
        if (numberOfNode < 3) {
            this.y = 40;
        } else {
            this.y = 105;
        }
        
    }

    // malt der Knoten mit Beschriftung im Kreis
    drawNode() {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, 20, 0, 2 * Math.PI);
        this.ctx.fillStyle = "white";
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.fillStyle = "black";
        this.ctx.font = "10pt Arial"
        this.ctx.fillText("T" + this.transaction.id, this.x - this.ctx.measureText("T" + this.transaction.id).width / 2, this.y + 5);
    }

    // Malt die Verbindung von einem Knoten zu einem anderen. Die übergebenen Koordinaten stellen die Mittelpunkte der zu verbindenen Knoten dar
    drawConnection(targetX, targetY) {
        let arrowSize = 100;
        let dx = this.x - targetX;
        let dy = this.y - targetY;
        let length = Math.sqrt(dx * dx + dy * dy) - 20;


        this.ctx.save();
        this.ctx.translate(targetX, targetY);
        this.ctx.rotate(Math.atan2(dy, dx));
        this.ctx.beginPath();
        this.ctx.moveTo(20, 0);
        this.ctx.lineTo(length, 0);
        this.ctx.stroke();

        this.ctx.moveTo(20, 0);
        this.ctx.lineTo(30, -5);
        this.ctx.lineTo(30, 5)
        this.ctx.lineTo(20, 0)
        //this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();
    }
}

// Graphmanager, der für das Zeichnen zuständig ist
class GraphManager {
    constructor() {
        this.graphCanvas = document.getElementById('directedGraph');
        this.graphContext = this.graphCanvas.getContext('2d');
    }

    drawGraph() {}
}