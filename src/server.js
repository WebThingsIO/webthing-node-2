import express from 'express';

/** @typedef {import('./thing.js').default} Thing */

class ThingServer {
  /**
   * Construct the Thing Server.
   *
   * @param {Thing} thing The Thing to serve.
   */
  constructor(thing) {
    this.thing = thing;
    this.app = express();
    this.server = null;

    this.app.get('/', (request, response) => {
      response.json(this.thing.getThingDescription());
    });

    this.app.get('/properties/:name', async (request, response) => {
      const name = request.params.name;
      const value = await this.thing.readProperty(name);
      response.status(200).json(value);
    });
  }

  /**
   * Start the Thing Server.
   *
   * @param {number} port The TCP port number to listen on.
   */
  start(port) {
    this.server = this.app.listen(port, () => {
      console.log(`Web Thing being served on port ${port}`);
    });
  }

  /**
   * Stop the Thing Server.
   */
  stop() {
    if (this.server) {
      this.server.close();
    }
  }
}

export default ThingServer;
