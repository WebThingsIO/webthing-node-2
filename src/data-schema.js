/**
 * Data Schema
 * 
 * Represents a DataSchema from the W3C WoT Thing Description 1.1 specification
 * https://www.w3.org/TR/wot-thing-description/#dataschema
 */
class DataSchema {
  /**
   * @type {string|undefined}
   */
  '@type';

  /**
   * @type {string|undefined}
   */
  title;

  /**
   * @type {Map<string, string>|undefined}
   */
  titles;

  /**
   * @type {string|undefined}
   */
  description;

  /**
   * @type {Map<string, string>|undefined}
   */
  descriptions;

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

  constructor() {
    // TODO: Populate defaults for readOnly and writeOnly
  }

}

export default DataSchema;