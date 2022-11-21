/**
 * @overview App configuration of <i>ccmjs</i>-based web component for Anomaly Trainer.
 * @author André Kless <andre.kless@web.de> 2022
 * @license The MIT License (MIT)
 */

/**
 * Used app configuration of <i>ccmjs</i>-based web component for Anomaly Trainer.
 * @module AppConfig
 */

/**
 * Configuration to show Lost Update phenomena.
 * @type {app_config}
 */
export const lost_update_gen = {
  "title": "",
  "task": "Beim \"Lost Update\"-Phänomen wird ein Wert, der von einer Transaktion geschrieben wurde von einer anderen Transaktion überschrieben.",
  "ops": {
    "read1": "read(A,a)",
    "add_x": "a = a + x",
    "write": "write(A,a)"
  },
  "topology": [
    [
      // Default Rules
      [ "T1,read1", "T1,add_x" ],
      [ "T1,add_x", "T1,write" ],
      [ "T2,read1", "T2,add_x" ],
      [ "T2,add_x", "T2,write" ],
      // Dirty Read Rules
      [ "T1,read1", "T2,write" ],
      [ "T2,write", "T1,write" ]
    ]
  ]
};

/**
 * Configuration to show Non-Repeatable Read phenomena.
 * @type {app_config}
 */
export const non_repeatable_read_gen = {
  "title": "",
  "task": "Beim \"Non-Repeatable Read\"-Phänomen kann eine Transaktion während ihrer Laufzeit von einem Attribut zu unterschiedlichen Zeitpunkten unterschiedliche Werte lesen, da das Attribut während der Transaktion von einer anderen Transaktion verändert wurde.",
  "ops": {
    "read1": "read(A,a)",
    "add_x": "a = a + x",
    "write": "write(A,a)",
    "read2": "read(A,a)"
  },
  "random": {},
  "topology": [
    [
      // Default Rules
      [ "T1,read1", "T1,add_x" ],
      [ "T1,read2", "T1,write" ],
      [ "T2,read1", "T2,add_x" ],
      [ "T2,add_x", "T2,write" ],
      [ "T1,read1", "T1,read2" ],
      // Non-Repeatable-Read Rules
      [ "T1,read1", "T2,write" ],
      [ "T2,write", "T1,read2" ]
    ]
  ]
};

/**
 * Configuration to show Dirty Read phenomena.
 * @type {app_config}
 */
export const dirty_read_gen = {
  "title": "",
  "task": "Beim \"Dirty Read\"-Phänomen verändert eine Transaktion einen Wert, welcher von einer anderen Transaktion gelesen wird. Die Transaktion, die das Attribut verändert hat, wird allerdings zurückgesetzt und die andere Transaktion, die den veränderten Wert des Attributs gelesen hat, arbeitet auf einen \"verschmutzten\" Wert.",
  "ops": {
    "read1": "read(A,a)",
    "add_x": "a = a + x",
    "write": "write(A,a)",
    "rollb": "rollback"
  },
  "random": {},
  "topology": [
    [
      // Default Rules
      [ "T1,read1", "T1,add_x" ],
      [ "T1,add_x", "T1,write" ],
      [ "T2,read1", "T2,add_x" ],
      [ "T2,add_x", "T2,write" ],
      [ "T1,read1", "T1,rollb" ],
      // Dirty Read Rules
      [ "T1,write", "T2,read1" ],
      [ "T2,read1", "T1,rollb" ]
    ]
  ]
};

/**
 * Configuration to train Lost Update phenomena.
 * @type {app_config}
 */
export const lost_update_trainer = {
  "title": "",
  "task": "Prüfen Sie, ob während der folgenden beiden Datenbank-Transaktionen ein \"Lost Update\" aufgetreten ist.",
  "ops": {
    "read1": "read(A,a)",
    "add_x": "a = a + x",
    "write": "write(A,a)"
  },
  "topology": [
    [
      // Default Rules
      [ "T1,read1", "T1,add_x" ],
      [ "T1,add_x", "T1,write" ],
      [ "T2,read1", "T2,add_x" ],
      [ "T2,add_x", "T2,write" ],
    ],
    {
      // 'Lost Update' Rules
      "label": "Lost Update",
      "rules": [
        [ "T1,read1", "T2,write" ],
        [ "T2,write", "T1,write" ]
      ]
    }
  ]
};

/**
 * Configuration to train Non-Repeatable-Read phenomena.
 * @type {app_config}
 */
export const non_repeatable_read_trainer = {
  "title": "",
  "task": "Prüfen Sie, ob während der folgenden beiden Datenbank-Transaktionen ein \"Non-Repeatable Read\" aufgetreten ist.",
  "ops": {
    "read1": "read(A,a)",
    "add_x": "a = a + x",
    "write": "write(A,a)",
    "read2": "read(A,a)"
  },
  "random": {},
  "topology": [
    [
      // Default Rules
      [ "T1,read1", "T1,add_x" ],
      [ "T1,add_x", "T1,write" ],
      [ "T2,read1", "T2,add_x" ],
      [ "T2,add_x", "T2,write" ],
      [ "T1,read1", "T1,read2" ]
    ],
    {
      // 'Non-Repeatable Read' Rules
      "label": "Non-Repeatable Read",
      "rules": [
        [ "T1,read1", "T2,write" ],
        [ "T2,write", "T1,read2" ]
      ]
    }
  ]
};

/**
 * Configuration to train Dirty Read phenomena.
 * @type {app_config}
 */
export const dirty_read_trainer = {
  "title": "",
  "task": "Prüfen Sie, ob während der folgenden beiden Datenbank-Transaktionen ein \"Dirty Read\" aufgetreten ist.",
  "ops": {
    "read1": "read(A,a)",
    "add_x": "a = a + x",
    "write": "write(A,a)",
    "rollb": "rollback"
  },
  "random": {},
  "topology": [
    [
      // Default Rules
      [ "T1,read1", "T1,add_x" ],
      [ "T1,add_x", "T1,write" ],
      [ "T2,read1", "T2,add_x" ],
      [ "T2,add_x", "T2,write" ],
      [ "T1,read1", "T1,rollb" ]
    ],
    {
      // 'Dirty Read' Rules
      "label": "Dirty Read",
      "rules": [
        [ "T1,write", "T2,read1" ],
        [ "T2,read1", "T1,rollb" ]
      ]
    }
  ]
};
