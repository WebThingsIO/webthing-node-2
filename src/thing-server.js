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
    // TODO: Set base member of Thing to the server's host
    this.app = express();
    this.server = null;

    this.app.get('/', (request, response) => {
      response.json(this.thing.getThingDescription());
    });

    this.app.get('/properties/:name', async (request, response) => {
      const name = request.params.name;
      let value;
      try {
        value = await this.thing.readProperty(name);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'InternalError';
        switch (errorMessage) {
          case 'NotFoundError':
            response.status(404).send();
            break;
          case 'InternalError':
            response.status(500).send();
            break;
          default:
            response.status(500).send();
        }
        return;
      }
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
