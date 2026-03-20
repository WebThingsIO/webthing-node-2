/**
 * Thing.
 *
 * Represents a W3C WoT Web Thing.
 */
class Thing {
  propertyReadHandlers = new Map();

  /**
   *
   * @param {Object} partialTD A partial Thing Description two which Forms
   *   will be added.
   */
  constructor(partialTD) {
    // TODO: Parse and validate TD.
    this.partialTD = partialTD;
  }

  /**
   * Get Thing Description.
   *
   * @returns {Object} A complete Thing Description for the Thing.
   */
  getThingDescription() {
    // TODO: Add forms etc.
    return this.partialTD;
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
