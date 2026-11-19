import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import Thing from '../src/thing.js';
import ThingServer from '../src/thing-server.js';

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
    actions: {
      blink: {
        title: 'Blink',
        synchronous: true,
      },
      fade: {
        title: 'Fade',
        synchronous: false,
      },
      cancel: {
        title: 'Cancel',
        synchronous: false,
      },
      fail: {
        title: 'Fail',
        synchronous: false,
      },
    },
  };

  let server;
  let baseUrl;
  let currentValue = true;
  let actionSignal;

  before(async () => {
    const thing = new Thing(partialTD);
    thing.setPropertyReadHandler('on', async () => currentValue);
    thing.setPropertyWriteHandler('on', async (value) => {
      currentValue = value;
    });
    thing.setActionInvokeHandler('blink', async (input) => input);
    thing.setActionInvokeHandler('fade', async (input) => input);
    thing.setActionInvokeHandler('fail', async () => {
      throw new Error('Action failure');
    });
    thing.setActionInvokeHandler(
      'cancel',
      async (_input, signal) =>
        new Promise((resolve) => {
          actionSignal = signal;
          signal.addEventListener('abort', resolve, { once: true });
        }),
    );
    server = new ThingServer(thing);
    // Listen on a random available port to avoid port conflicts
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
      assert.equal(td['@context'], 'https://www.w3.org/2022/wot/td/v1.1');
      assert.deepEqual(td.securityDefinitions, {
        nosec_sc: { scheme: 'nosec' },
      });
      assert.equal(td.security, 'nosec_sc');
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

  describe('GET /properties/:invalidname', () => {
    it('should return 404 for an invalid property name', async () => {
      const response = await fetch(baseUrl + '/properties/foo');
      assert.strictEqual(response.status, 404);
    });
  });

  describe('PUT /properties/:name', () => {
    it('should update the property value when the property exists', async () => {
      const response = await fetch(baseUrl + '/properties/on', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(false),
      });

      assert.strictEqual(response.status, 204);
      assert.strictEqual(currentValue, false);
    });
  });

  describe('PUT /properties/:invalidname', () => {
    it('should return 404 when the property does not exist', async () => {
      const response = await fetch(baseUrl + '/properties/foo', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(true),
      });

      assert.strictEqual(response.status, 404);
    });
  });

  describe('POST /actions/:name', () => {
    it('should invoke the action and return its output', async () => {
      const input = { duration: 3 };
      const response = await fetch(baseUrl + '/actions/blink', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      assert.strictEqual(response.status, 200);
      assert.deepEqual(await response.json(), input);
    });
  });

  describe('POST /actions/:invalidname', () => {
    it('should return 404 when the action does not exist', async () => {
      const response = await fetch(baseUrl + '/actions/foo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      assert.strictEqual(response.status, 404);
    });
  });

  describe('Asynchronous actions', () => {
    it('should return an ActionStatus and allow querying its result', async () => {
      const input = { level: 50 };
      const response = await fetch(baseUrl + '/actions/fade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      assert.equal(response.status, 201);
      const status = await response.json();
      assert.equal(status.status, 'pending');
      assert.match(status.href, /^\/actions\/fade\/[0-9a-f-]+$/);
      assert.equal(response.headers.get('location'), status.href);
      assert.equal(typeof status.timeRequested, 'string');

      const queryResponse = await fetch(baseUrl + status.href);
      assert.equal(queryResponse.status, 200);
      const queriedStatus = await queryResponse.json();
      assert.equal(queriedStatus.status, 'completed');
      assert.deepEqual(queriedStatus.output, input);
      assert.equal(typeof queriedStatus.timeEnded, 'string');
    });

    it('should cancel an action and remove its status resource', async () => {
      const response = await fetch(baseUrl + '/actions/cancel', {
        method: 'POST',
      });
      assert.equal(response.status, 201);
      const status = await response.json();

      const cancelResponse = await fetch(baseUrl + status.href, {
        method: 'DELETE',
      });
      assert.equal(cancelResponse.status, 204);
      assert.equal(actionSignal.aborted, true);

      const queryResponse = await fetch(baseUrl + status.href);
      assert.equal(queryResponse.status, 404);
    });

    it('should return 404 for an unknown action status resource', async () => {
      const response = await fetch(
        baseUrl + '/actions/fade/00000000-0000-0000-0000-000000000000',
      );
      assert.equal(response.status, 404);
    });

    it('should return 404 when cancelling an unknown action request', async () => {
      const response = await fetch(
        baseUrl + '/actions/fade/00000000-0000-0000-0000-000000000000',
        { method: 'DELETE' },
      );
      assert.equal(response.status, 404);
    });

    it('should expose asynchronous handler failures in the status resource', async () => {
      const response = await fetch(baseUrl + '/actions/fail', {
        method: 'POST',
      });
      assert.equal(response.status, 201);
      const status = await response.json();

      const queryResponse = await fetch(baseUrl + status.href);
      assert.equal(queryResponse.status, 200);
      const failedStatus = await queryResponse.json();
      assert.equal(failedStatus.status, 'failed');
      assert.deepEqual(failedStatus.error, {
        title: 'Action failed',
        detail: 'Action failure',
      });
      assert.equal(typeof failedStatus.timeEnded, 'string');

      const cancelResponse = await fetch(baseUrl + status.href, {
        method: 'DELETE',
      });
      assert.equal(cancelResponse.status, 409);
    });
  });
});
