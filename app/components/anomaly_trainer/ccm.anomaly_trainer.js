'use strict';

/**
 * @overview <i>ccmjs</i>-based web component for Anomaly Trainer.
 * @author André Kless <andre.kless@web.de> 2022
 * @license The MIT License (MIT)
 * @version latest (1.0.0)
 */

( () => {

  /**
   * <i>ccmjs</i>-based web component for Anomaly Trainer.
   * @namespace WebComponent
   * @type {object}
   * @property {string} name - Unique identifier of the component.
   * @property {number[]} [version] - Version of the component according to Semantic Versioning 2.0 (default: latest version).
   * @property {string} ccm - URL of the (interchangeable) ccmjs version used at the time of publication.
   * @property {app_config} config - Default app configuration.
   * @property {Class} Instance - Class from which app instances are created.
   */
  const component = {
    name: 'anomaly_trainer',
    ccm: './../anomaly_trainer/libs/ccm/ccm.js',
    config: {

      // General Configurations and Dependencies
      "css": [ "ccm.load",
        [  // is loaded serially (not in parallel)
          "./../anomaly_trainer/libs/bootstrap-5/css/bootstrap.css",
          "./../anomaly_trainer/resources/styles.css",
        ],
        { "url": "./../anomaly_trainer/libs/bootstrap-5/css/bootstrap-fonts.css", "context": "head" }
      ],
      "helper": [ "ccm.load", { "url": "./../anomaly_trainer/libs/ccm/helper.js", "type": "module" } ],
      "html": [ "ccm.load", { "url": "./../anomaly_trainer/resources/templates.js", "type": "module" } ],
//    "logos": "./resources/img/logos/logos.jpg",
//    "onchange": event => console.log( event ),
      "onfinish": { "restart": true },
//    "onready": event => console.log( event ),
//    "onstart": event => console.log( event ),
      "toposort": [ "ccm.load", { "url": "./../anomaly_trainer/libs/toposort/toposort.js#toposort", "type": "module" } ],

      // Trainer-specific Configurations
      "title": "Anomalie-Trainer",
      "task": "Prüfen Sie, ob während der folgenden beiden Datenbank-Transaktionen eine Anomalie aufgetreten ist.",
      "cols": [ "", "T1", "T2", "A", "a1", "a2" ],
      "ops": {
        "read1": "read(A,a)",
        "add_x": "a = a + x",
        "write": "write(A,a)",
        "read2": "read(A,a)",
        "rollb": "rollback"
      },
      "value": { "min": 10, "max": 80 },
      "summand": { "min": 1, "max": 9 },
      "random": { "read2": 3, "rollb": 3 },
      "buttons": {
        "generate": "Neue Konstellation generieren",
        "yes": "Ja",
        "neither": "",
        "no": "Nein",
        "submit": "Abschicken"
      },
      "topology": [
        [
          [ "T1,read1", "T1,add_x" ],
          [ "T1,add_x", "T1,write" ],
          [ "T2,read1", "T2,add_x" ],
          [ "T2,add_x", "T2,write" ],
          [ "T1,read1", "T1,read2" ],
          [ "T1,read1", "T1,rollb" ]
        ],
        {
          "label": "Lost Update",
          "rules": [
            [ "T1,read1", "T2,write" ],
            [ "T2,write", "T1,write" ]
          ]
        },
        {
          "label": "Non-Repeatable Read",
          "rules": [
            [ "T1,read1", "T2,write" ],
            [ "T2,write", "T1,read2" ]
          ]
        },
        {
          "label": "Dirty Read",
          "rules": [
            [ "T1,write", "T2,read1" ],
            [ "T2,read1", "T1,rollb" ]
          ]
        }
      ]
    },
    /**
     * @class
     * @memberOf WebComponent
     */
    Instance: function () {

      /**
       * Shortcut to helper functions
       * @private
       * @type {Object.<string,function>}
       */
      let $;

      /**
       * Already generated unique constellations.
       * @private
       * @type {string[]}
       */
      const constellations = [];

      /**
       * Number of constellation generation attempts.
       * @private
       * @type {number}
       */
      let repeats = 0;

      /**
       * Current constellation of transaction steps.
       * @type {string[]}
       */
      let steps = [];

      /**
       * When the instance is created, when all dependencies have been resolved and before the dependent sub-instances are initialized and ready. Allows dynamic post-configuration of the instance.
       * @async
       * @readonly
       * @function
       */
      this.init = async () => {

        // Merge all helper functions and offer them via a single variable.
        $ = Object.assign( {}, this.ccm.helper, this.helper ); $.use( this.ccm );

      };

      /**
       * When the instance is created and after all dependent sub-instances are initialized and ready. Allows the first official actions of the instance that should only happen once.
       * @async
       * @readonly
       * @function
       */
      this.ready = async () => {

        // Trigger 'ready' event
        this.onready && await this.onready( { instance: this } );

      };

      /**
       * Starts the app. The current app state is visualized in the webpage area.
       * @async
       * @readonly
       * @function
       */
      this.start = async () => {

        /**
         * Generates a random number within a range.
         * @param {number} min - Minimum possible value
         * @param {number} max - Maximum possible value
         * @returns {number}
         */
        const random = ( min, max ) => Math.floor( Math.random() * ( max - min + 1 ) + min );

        /**
         * Summand of transaction T1 and T2.
         * @type {[number,number]}
         */
        const summand = [];

        // Calculation of the two different summands.
        do {
          summand[ 0 ] = random( this.summand.min, this.summand.max );
          summand[ 1 ] = random( this.summand.min, this.summand.max );
        } while ( summand[ 0 ] === summand[ 1 ] );

        // Reset current constellation of transaction steps.
        steps.length = 0;

        // Generate list of all transaction steps.
        for ( let i = 1; i <= 2; i++ )
          Object.keys( this.ops ).forEach( ( op, j ) => ( i < 2 || j < 3 ) && steps.push( 'T' + i + ',' + op ) );

        // Put the transaction steps in a valid order using topological sorting.
        steps = this.toposort( $.shuffleArray( steps ), this.topology[ 0 ] );

        // Generate a different constellation of valid transaction steps each time.
        if ( constellations.includes( steps.toString() ) ) {
          if ( ++repeats >= 100 ) { repeats = 0; constellations.length = 0; }
          return this.start();
        }
        constellations.push( steps.toString() );

        /**
         * Start value for the data attribute ('A') in the database [0] and in transaction T1:a1 [1] and T2:a2 [2].
         * @type {[number,number,number]}
         */
        const values = [ random( this.value.min, this.value.max ), 0, 0 ];

        /**
         * Indicates whether transaction T1 or T2 was rolled back.
         * @type {[boolean,boolean]}
         */
        const rollbacks = [ false, false ];

        // Removal of not needed transaction steps.
        steps = steps.filter( step => {

          let [ t, op ] = step.split( ',' );  // t = Transaction index ([0]: T1, [1]: T2)
          t = t[ 1 ] - 1;                     // op = Transaction operation index ('read1', 'add_x', 'write', 'read2' or 'rollb')
          const rollback = rollbacks[ t ];    // rollback = Transaction is rolled back.

          // There is only a certain probability of a second read operation.
          if ( op === 'read2' && this.random?.read2 && random( 0, this.random.read2 - 1 ) ) return false;

          // There is only a certain probability of a rollback operation.
          if ( op === 'rollb' ) {
            if ( this.random?.rollb && random( 0, this.random.rollb - 1 ) ) return false;

            // All transaction steps after a rollback are removed.
            rollbacks[ t ] = true;
          }
          return !rollback;
        } );

        /**
         * Transformation of the transaction steps into the required data structure for the table.
         * @type {[[number,string,string,number,number|string,number|string]]}
         */
        const table = steps.map( ( step, i ) => {

          let [ t, op ] = step.split( ',' );  // t = Transaction index ([0]: T1, [1]: T2)
          t = parseInt( t[ 1 ] );             // op = Transaction operation index ('read1', 'add_x', 'write', 'read2' or 'rollb')

          // Calculate the attribute values A, a1 and a2 for this transaction step.
          switch ( op ) {
            case 'read1':
            case 'read2': values[ t ] = values[ 0 ]; break;
            case 'add_x': values[ t ] += summand[ t - 1 ]; break;
            case 'write': values[ 0 ] = values[ t ]; values[ t ] = 0; break;
            case 'rollb': values[ t ] = 0; break;
          }
          op = this.ops[ op ].replace( 'x', summand[ t - 1 ] );
          return [ i + 1, t === 1 ? op : '', t === 2 ? op : '', ].concat( values.map( value => value || '-' ) );
        } );

        // Randomly swap the transaction steps of T1 and T2.
        random( 0, 1 ) && table.forEach( row => [ row[ 1 ], row[ 2 ], row[ 3 ], row[ 4 ], row[ 5 ] ] = [ row[ 2 ], row[ 1 ], row[ 3 ], row[ 5 ], row[ 4 ] ] );

        // Update main HTML template.
        this.html.render( this.html.main( this, steps, table ), this.element );

        // Trigger 'start' event.
        this.onstart && await this.onstart( { instance: this } );

      };

      /**
       * When the button to generate a new constellation of transaction steps is clicked.
       * @readonly
       * @function
       */
      this.onGenerate = this.start;

      /**
       * When an answer is clicked.
       * @readonly
       * @function
       */
      this.onAnswer = () => this.html.render( this.html.inputs( this, steps, Object.values( $.formData( this.element ) ) ), this.element.querySelector( '#inputs' ) );

      /**
       * When the button to submit a solution is clicked.
       * @readonly
       * @function
       */
      this.onSubmit = () => {
        const inputs = Object.values( $.formData( this.element ) );
        const solutions = this.topology.slice( 1 ).map( topology => {
          const order = topology.rules.map( rule => {
            rule = rule.map( op => steps.indexOf( op ) );
            return !rule.includes( -1 ) && rule[ 0 ] < rule[ 1 ];
          } );
          return !order.includes( false );
        } );
        this.html.render( this.html.inputs( this, steps, inputs, solutions ), this.element.querySelector( '#inputs' ) );
        console.log( 'submit!', steps, inputs, solutions );
      };

    }
  };
  let b="ccm."+component.name+(component.version?"-"+component.version.join("."):"")+".js";if(window.ccm&&null===window.ccm.files[b])return window.ccm.files[b]=component;(b=window.ccm&&window.ccm.components[component.name])&&b.ccm&&(component.ccm=b.ccm);"string"===typeof component.ccm&&(component.ccm={url:component.ccm});let c=(component.ccm.url.match(/(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)/)||[""])[0];if(window.ccm&&window.ccm[c])window.ccm[c].component(component);else{var a=document.createElement("script");document.head.appendChild(a);component.ccm.integrity&&a.setAttribute("integrity",component.ccm.integrity);component.ccm.crossorigin&&a.setAttribute("crossorigin",component.ccm.crossorigin);a.onload=function(){(c="latest"?window.ccm:window.ccm[c]).component(component);document.head.removeChild(a)};a.src=component.ccm.url}
} )();

/**
 * App configuration.
 * @typedef {object} app_config
 * @prop {array} css - CSS dependencies.
 * @prop {array} helper - Dependency on helper functions.
 * @prop {array} html - HTML template dependencies.
 * @prop {function} [onchange] - When something changes in the app (notation change, show legend, submit, correction, show solution, next phrase).
 * @prop {function|object} [onfinish] - When the finish button is clicked. Sets the finish actions.
 * @prop {function} [onready] - Is called once before the first start of the app.
 * @prop {function} [onstart] - When the app has finished starting.
 */
