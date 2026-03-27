import InteractionAffordance from './interaction-affordance.js';
import DataSchema from './data-schema.js';

/**
 * Property Affordance
 * 
 * Represents a PropertyAffordance from the W3C WoT Thing Description 1.1
 * specification https://www.w3.org/TR/wot-thing-description/#propertyaffordance 
 */
class PropertyAffordance extends InteractionAffordance {

  // *** DataSchema ***/
  // TODO: Consider making this a mixin
  /**
   * @type {any}
   */
  const;

  /**
   * @type {any}
   */
  default;

  /**
   * @type {string|undefined}
   */
  unit;

  /**
   * @type{Array<DataSchema>|undefined}
   */
  oneOf;

  /**
   * @type {Array<any>|undefined}
   */
  enum;

  /**
   * @type {boolean|undefined}
   */
  readOnly;

  /**
   * @type {boolean|undefined}
   */
  writeOnly;

  /**
   * @type {string|undefined}
   */
  format;

  /**
   * @type {('object'|'array'|'string'|'number'|'integer'|'boolean'|'null')|undefined}
   */
  type;

  // *** End of DataSchema ***

  /**
   * @type {boolean|undefined}
   */
  observeable;

  /**
   * Create a new Property.
   * 
   * @param {string} propertyName The name of the PropertyAffordance from its 
   *   key in a properties Map.
   * @param {Record<string, any>} propertyDescription PropertyAffordance 
   *   description from a Thing Description.
   */
  constructor(propertyName, propertyDescription) {
    super(propertyName, propertyDescription);
    // TODO: Check type or throw ValidationError
    // TODO: Populate defaults
    // TODO: Populate values from propertyDescription
  }

  /**
   * @returns {Record<string, any>}
   */
  getDescription() {
    let propertyDescription = {};
    propertyDescription.title = this.title;
    // TODO: Generate fill property description
    return propertyDescription;
  }

}

export default PropertyAffordance;