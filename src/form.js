import ValidationError from './validation-error.js';

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

  /**
   * Construct a Form.
   *
   * @param {Record<string, any>|undefined} description
   */
  constructor(description) {
    if (!description || typeof description != 'object') {
      throw new ValidationError([
        {
          field: `(root)`,
          description:
            'Tried to instantiate an InteractionAffordance with an invalid name or description',
        },
      ]);
    }
    // TODO: Populate defaults for contentType and op
    // TODO: Properly instantiate form
    this.op = description.op;
    this.href = description.href;
  }

  /**
   * Get a description of the Form.
   *
   * @returns {Record<string, any>}
   */
  getDescription() {
    // TODO: Strip out default op values that aren't needed
    let description = {
      op: this.op,
      href: this.href,
    };
    return description;
  }
}

export default Form;
