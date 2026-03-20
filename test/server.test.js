import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import Thing from '../src/thing.js';
import ThingServer from '../src/server.js';

describe('ThingServer', () => {
  const partialTD = {
    title: 'Test Lamp',
    description: 'A test lamp',
    properties: {
      on: {
        type: 'boolean',
        title: 'On/Off',
      },
    },
  };

  let server;
  let baseUrl;

  before(async () => {
    const thing = new Thing(partialTD);
    thing.setPropertyReadHandler('on', async () => true);
    server = new ThingServer(thing);
    await new Promise((resolve) => {
      server.server = server.app.listen(0, () => {
        const port = server.server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(() => {
    server.stop();
  });

  describe('GET /', () => {
    it('should return the Thing Description', async () => {
      const response = await fetch(baseUrl + '/');
      assert.strictEqual(response.status, 200);
      const td = await response.json();
      assert.strictEqual(td.title, 'Test Lamp');
      assert.strictEqual(td.description, 'A test lamp');
      assert.ok(td.properties);
    });
  });

  describe('GET /properties/:name', () => {
    it('should return the property value', async () => {
      const response = await fetch(baseUrl + '/properties/on');
      assert.strictEqual(response.status, 200);
      const value = await response.json();
      assert.strictEqual(value, true);
    });
  });
});
