/**
 * @overview HTML templates of <i>ccmjs</i>-based web component for Anomaly Trainer.
 * @author André Kless <andre.kless@web.de> 2022
 */

import { html, render } from './../libs/lit/lit.js';
export { render };

/**
 * HTML templates of <i>ccmjs</i>-based web component for Anomaly Trainer.
 * @module HTMLTemplates
 */

/**
 * Returns the main HTML template.
 * @function
 * @param {object} app - App instance
 * @param {string[]} steps - Transaction steps
 * @param {[[number,string,string,number,number|string,number|string]]} table - Table values
 * @returns {TemplateResult}
 */
export function main( app, steps, table ) {
  return html`
    <header>
      <h1 ?data-hidden=${ !app.title }>${ app.title }</h1>
      <p class="lead" ?data-hidden=${ !app.task }>${ app.task }</p>
    </header>
    <main>
      <table class="table table-striped table-hover">
        <thead>
          <tr>
            ${ app.cols.map( col => html`<th scope="col">${ col }</th>` ) }
          </tr>
        </thead>
        <tbody class="table-group-divider">
          ${ table.map( row => html`
            <tr>
              ${ row.map( ( cell, i ) => i ? html`<td>${ cell }</td>` : html`<th scope="row">${ cell }</th>` ) }
            </tr>
          ` ) }
        </tbody>
      </table>
      <div id="inputs">
        ${ inputs( app, steps ) }
      </div>
    </main>
    <!-- Logos -->
    ${ app.logos ? html`
      <aside class="mt-5 text-center">
        <hr>
        <img src="${ app.logos }">
      </aside>
    ` : '' }
  `;
}

/**
 * Returns the HTML template for inputs and submit button.
 * @function
 * @param {object} app - App instance
 * @param {string[]} steps - Transaction steps
 * @param {(boolean|string)[]} [inputs] - Input field values
 * @param {boolean[]} [solutions] - Solutions
 * @returns {TemplateResult}
 */
export function inputs( app, steps, inputs, solutions ) {
  return html`
    <div class="d-flex flex-wrap" ?data-hidden=${ app.topology.length === 1 }>
      ${ app.topology.slice( 1 ).map( ( topology, i ) => html`
        <div class="me-5 mb-3">
          <div class="label">${ topology.label }</div>
          <div class="d-flex align-items-center">
            <div class="btn-group btn-group-sm" role="group">
              <input type="radio" class="btn-check" name="answer-${ i }" value="true" id="yes-${ i }" autocomplete="off" ?checked=${ inputs && inputs[ i ] === true } @change=${ app.onAnswer }>
              <label class="btn btn-outline-success" for="yes-${ i }">${ app.buttons.yes }</label>
              <input type="radio" class="btn-check middle" name="answer-${ i }" value="" id="neither-${ i }" autocomplete="off" ?checked=${ !inputs || typeof inputs[ i ] !== 'boolean' } @change=${ app.onAnswer }>
              <label class="btn btn-outline-secondary" for="neither-${ i }">${ app.buttons.neither }</label>
              <input type="radio" class="btn-check" name="answer-${ i }" value="false" id="no-${ i }" autocomplete="off" ?checked=${ inputs && inputs[ i ] === false } @change=${ app.onAnswer }>
              <label class="btn btn-outline-danger" for="no-${ i }">${ app.buttons.no }</label>
            </div>
            <div class="ms-2" ?data-invisible=${ !solutions }>
              ${ solutions && inputs[ i ] === solutions[ i ] ? html`
                <svg xmlns="http://www.w3.org/2000/svg" height="24" fill="currentColor" class="bi bi-check-lg text-success" viewBox="0 0 16 16">
                  <path d="M13.485 1.431a1.473 1.473 0 0 1 2.104 2.062l-7.84 9.801a1.473 1.473 0 0 1-2.12.04L.431 8.138a1.473 1.473 0 0 1 2.084-2.083l4.111 4.112 6.82-8.69a.486.486 0 0 1 .04-.045z"/>
                </svg>
              ` : html`
                <svg xmlns="http://www.w3.org/2000/svg" height="24" fill="currentColor" class="bi bi-x-lg text-danger" viewBox="0 0 16 16">
                  <path d="M1.293 1.293a1 1 0 0 1 1.414 0L8 6.586l5.293-5.293a1 1 0 1 1 1.414 1.414L9.414 8l5.293 5.293a1 1 0 0 1-1.414 1.414L8 9.414l-5.293 5.293a1 1 0 0 1-1.414-1.414L6.586 8 1.293 2.707a1 1 0 0 1 0-1.414z"/>
                </svg>
              ` }
            </div>
          </div>
        </div>
      ` ) }
    </div>
    <button type="button" id="submit" class="btn btn-primary" ?disabled=${ !inputs || inputs.includes( '' ) } ?data-hidden=${ app.topology.length === 1 || solutions } @click=${ app.onSubmit } }>${ app.buttons.submit }</button>
    <button type="button" class="btn btn-primary" ?data-hidden=${ app.topology.length > 1 && !solutions } @click=${ app.onGenerate }>${ app.buttons.generate }</button>
  `;
}
