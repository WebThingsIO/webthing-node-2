/**
 * Form
 * 
 * Represents a Form from the W3C WoT Thing Description 1.1 specification
 * https://www.w3.org/TR/wot-thing-description/#form
 */
class Form {
  /**
   * @type {string}
  */
  href = '';

  /**
   * @type {string|undefined}
   */
  contentType;

  /**
   * @type {string|undefined}
   */
  contentCoding;

  /**
   * @type {string|Array<string>|undefined}
   */
  security;

  /**
   * @type {string|Array<string>|undefined}
   */
  scopes;

  /**
   * @type {Object|undefined}
   * 
   * TODO: Re-consider type
   */
  response;

  /**
   * @type {Array<Object>|undefined}
   * 
   * TODO: Re-consider type
   */
  additionalResponses;

  /**
   * @type {string|undefined}
   */  
  subprotocol;

  /**
   * @type {string|Array<string>|undefined}
   */
  op;

  constructor() {
    // TODO: Populate defaults for contentType and op
  }

}

export default Form;