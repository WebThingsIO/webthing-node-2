import { Ajv } from 'ajv';
import ValidationError from './validation-error.js';

/**
 * Data Schema
 *
 * Represents a DataSchema from the WoT Thing Description 1.1 specification.
 * https://www.w3.org/TR/wot-thing-description/#dataschema
 */
class DataSchema {
  /**
   * @type {import('ajv').ValidateFunction|undefined}
   */
  #validator;

  /**
   * @param {object|undefined} schema A raw data schema from a
   *   Thing Description.
   * @param {string|undefined} [field] The Thing Description field the schema
   *  came from, following the dot-separated format from validationErrors in WoT Discovery.
   */
  constructor(schema, field = undefined) {
    if (schema === undefined) {
      return;
    }

    try {
      const ajv = new Ajv({ allErrors: true, strict: false });
      this.#validator = ajv.compile(schema);
    } catch (error) {
      throw new ValidationError([
        {
          field,
          description: `Invalid data schema${error instanceof Error ? `: ${error.message}` : ''}`,
        },
      ]);
    }
  }

  /**
   * Check whether a value conforms to this data schema.
   *
   * @param {any} value
   * @returns {boolean}
   */
  validate(value) {
    return this.#validator ? this.#validator(value) : true;
  }
}

export default DataSchema;
