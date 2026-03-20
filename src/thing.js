import ValidationError from './validation-error.js';

/**
 * Thing.
 *
 * Represents a W3C WoT Web Thing.
 */
class Thing {
  DEFAULT_CONTEXT = 'https://www.w3.org/2022/wot/td/v1.1';

  propertyReadHandlers = new Map();

  /**
   * Construct Thing from partial Thing Description.
   *
   * @param {import('./types.js').PartialTD} partialTD A partial Thing Description
   *   to which Forms will be added.
   */
  constructor(partialTD) {
    // Create an empty validation error to collect errors during parsing.
    let validationError = new ValidationError([]);

    // Parse @context member
    try {
      this.parseContextMember(partialTD['@context']);
    } catch (error) {
      if (error instanceof ValidationError) {
        validationError.validationErrors.push(...error.validationErrors);
      } else {
        throw error;
      }
    }

    // Parse title member
    try {
      this.parseTitleMember(partialTD.title);
    } catch (error) {
      if (error instanceof ValidationError) {
        validationError.validationErrors.push(...error.validationErrors);
      } else {
        throw error;
      }
    }

    // Hard code the nosec security scheme for now
    this.securityDefinitions = {
      nosec_sc: {
        scheme: 'nosec',
      },
    };
    this.security = 'nosec_sc';
  }

  /**
   * Parse the @context member of a Thing Description.
   *
   * @param {any} context The @context, if any, provided in the partialTD.
   * @throws {ValidationError} A validation error.
   */
  parseContextMember(context) {
    // If no @context provided then set it to the default
    if (context === undefined) {
      this.context = this.DEFAULT_CONTEXT;
      return;
    }

    // If @context is a string but not the default then turn it into an Array
    // and add the default as well
    if (typeof context === 'string') {
      if (context == this.DEFAULT_CONTEXT) {
        this.context = context;
        return;
      } else {
        this.context = new Array();
        this.context.push(context);
        this.context.push(this.DEFAULT_CONTEXT);
      }
      return;
    }

    // If @context is provided and it's an array but doesn't contain the default,
    // then add the default
    if (Array.isArray(context)) {
      // TODO: Check that members of the Array are valid
      this.context = context;
      if (!this.context.includes(this.DEFAULT_CONTEXT)) {
        this.context.push(this.DEFAULT_CONTEXT);
      }
      return;
    }

    // If @context is set but it's not a string or Array then it's invalid
    throw new ValidationError([
      {
        field: 'title',
        description: 'context member is set but is not a string or Array',
      },
    ]);
  }

  /**
   * Parse the title member of a Thing Description.
   *
   * @param {string} title The title provided in the partialTD.
   * @throws {ValidationError} A validation error.
   */
  parseTitleMember(title) {
    // Require the user to provide a title
    if (!title) {
      throw new ValidationError([
        {
          field: '(root)',
          description: 'Mandatory title member not provided',
        },
      ]);
    }

    if (typeof title !== 'string') {
      throw new ValidationError([
        {
          field: 'title',
          description: 'title member is not a string',
        },
      ]);
    }

    this.title = title;
  }

  /**
   * Get Thing Description.
   *
   * @returns {Object} A complete Thing Description for the Thing.
   * TODO: Change this return type to ThingDescription once it is valid.
   */
  getThingDescription() {
    const thingDescription = {
      '@context': this.context,
      title: this.title,
      securityDefinitions: this.securityDefinitions,
      security: this.security,
    };
    return thingDescription;
  }

  /**
   * Set Property Read Handler.
   *
   * @param {string} name The name of the property to handle.
   * @param {function} handler A function to handle property reads.
   */
  setPropertyReadHandler(name, handler) {
    this.propertyReadHandlers.set(name, handler);
  }

  /**
   * Read Property.
   *
   * @param {string} name The name of the property to read.
   * @returns {any} The current value of the property, with a format conforming
   *   to its data schema in the Thing Description.
   */
  readProperty(name) {
    if (!this.propertyReadHandlers.has(name)) {
      console.error('No property read handler for the property ' + name);
      throw new Error();
    } else {
      return this.propertyReadHandlers.get(name)();
    }
  }
}

export default Thing;
