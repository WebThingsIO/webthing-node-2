import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import Thing from '../src/thing.js';

describe('Thing', () => {
  const partialTD = {
    title: 'Test Thing',
    description: 'A thing for testing',
    properties: {
      on: {
        type: 'boolean',
        title: 'On/Off',
      },
    },
    actions: {
      blink: {
        title: 'Blink',
        input: {
          type: 'object',
          properties: {
            count: { type: 'integer' },
          },
        },
      },
    },
  };

  describe('constructor', () => {
    it('should parse and populate mandatory members of the Thing', () => {
      const thing = new Thing(partialTD);
      assert.equal(thing.context, 'https://www.w3.org/2022/wot/td/v1.1');
      assert.equal(thing.title, partialTD.title);
      assert.deepEqual(thing.securityDefinitions, {
        nosec_sc: { scheme: 'nosec' },
      });
      assert.equal(thing.security, 'nosec_sc');
    });
  });

  describe('getThingDescription', () => {
    it('should return the Thing Description', () => {
      const thing = new Thing(partialTD);
      const td = thing.getThingDescription();
      assert.deepEqual(td, {
        '@context': 'https://www.w3.org/2022/wot/td/v1.1',
        title: 'Test Thing',
        securityDefinitions: { nosec_sc: { scheme: 'nosec' } },
        security: 'nosec_sc',
        properties: {
          on: {
            forms: [
              {
                href: 'properties/on',
                op: ['readproperty', 'writeproperty'],
              },
            ],
            title: 'On/Off',
            type: 'boolean',
          },
        },
        actions: {
          blink: {
            forms: [{ href: 'actions/blink', op: 'invokeaction' }],
            title: 'Blink',
            input: {
              type: 'object',
              properties: {
                count: { type: 'integer' },
              },
            },
          },
        },
        forms: [
          {
            href: 'properties',
            op: ['readallproperties', 'writemultipleproperties'],
          },
          { href: 'actions', op: 'queryallactions' },
        ],
      });
    });

    it('should omit the write operation when all properties are read-only', () => {
      const thing = new Thing({
        title: 'Read-only Thing',
        properties: { status: { type: 'string', readOnly: true } },
      });

      const td = thing.getThingDescription();
      assert.deepEqual(td.forms, [
        { href: 'properties', op: ['readallproperties'] },
      ]);
    });
  });

  describe('setPropertyReadHandler', () => {
    it('should throw when the property does not exist', () => {
      const thing = new Thing(partialTD);
      assert.throws(
        () => thing.setPropertyReadHandler('missing', async () => {}),
        /No property called missing could be found/,
      );
    });
  });

  describe('readProperty', () => {
    it('should return the value from the property read handler', async () => {
      const thing = new Thing(partialTD);
      thing.setPropertyReadHandler('on', async () => true);
      const value = await thing.readProperty('on');
      assert.strictEqual(value, true);
    });

    it('should reject when no handler is registered', async () => {
      const thing = new Thing(partialTD);
      await assert.rejects(() => thing.readProperty('on'), /InternalError/);
    });
  });

  describe('readAllProperties', () => {
    it('should return values for readable properties only', async () => {
      const thing = new Thing({
        title: 'Test Thing',
        properties: {
          on: { type: 'boolean' },
          secret: { type: 'string', writeOnly: true },
        },
      });
      thing.setPropertyReadHandler('on', async () => true);
      thing.setPropertyReadHandler('secret', async () => 'hidden');

      assert.deepEqual(await thing.readAllProperties(), { on: true });
    });

    it('should reject when a readable property cannot be read', async () => {
      const thing = new Thing(partialTD);

      await assert.rejects(() => thing.readAllProperties(), /InternalError/);
    });
  });

  describe('setPropertyWriteHandler', () => {
    it('should throw when the property does not exist', () => {
      const thing = new Thing(partialTD);
      assert.throws(
        () => thing.setPropertyWriteHandler('missing', async () => {}),
        /No property called missing could be found/,
      );
    });
  });

  describe('writeProperty', () => {
    it('should return the value from the property write handler', async () => {
      const thing = new Thing(partialTD);
      thing.setPropertyWriteHandler('on', async (value) => value);
      const value = await thing.writeProperty('on', true);
      assert.strictEqual(value, true);
    });

    it('should reject when no handler is registered', async () => {
      const thing = new Thing(partialTD);
      await assert.rejects(
        () => thing.writeProperty('on', true),
        /InternalError/,
      );
    });
  });

  describe('writeMultipleProperties', () => {
    it('should write all requested writable properties', async () => {
      const thing = new Thing({
        title: 'Writable Thing',
        properties: {
          on: { type: 'boolean' },
          level: { type: 'number' },
          locked: { type: 'boolean', readOnly: true },
        },
      });
      const writtenValues = {};
      thing.setPropertyWriteHandler('on', async (value) => {
        writtenValues.on = value;
      });
      thing.setPropertyWriteHandler('level', async (value) => {
        writtenValues.level = value;
      });

      await thing.writeMultipleProperties({ on: true, level: 50 });
      assert.deepEqual(writtenValues, { on: true, level: 50 });
    });

    it('should reject invalid input before writing any property', async () => {
      const thing = new Thing({
        title: 'Writable Thing',
        properties: {
          on: { type: 'boolean' },
          locked: { type: 'boolean', readOnly: true },
        },
      });
      let written = false;
      thing.setPropertyWriteHandler('on', async () => {
        written = true;
      });

      await assert.rejects(
        () => thing.writeMultipleProperties({ on: true, locked: true }),
        /BadRequest/,
      );
      await assert.rejects(
        () => thing.writeMultipleProperties({ on: true, missing: true }),
        /NotFoundError/,
      );
      await assert.rejects(
        () => thing.writeMultipleProperties(null),
        /BadRequest/,
      );
      assert.equal(written, false);
    });
  });

  describe('setActionInvokeHandler', () => {
    it('should throw when the action does not exist', () => {
      const thing = new Thing(partialTD);
      assert.throws(
        () => thing.setActionInvokeHandler('missing', async () => {}),
        /No action called missing could be found/,
      );
    });
  });

  describe('invokeAction', () => {
    it('should return the result from the action handler', async () => {
      const thing = new Thing(partialTD);
      thing.setActionInvokeHandler('blink', async (input) => input.count);

      const result = await thing.invokeAction('blink', { count: 3 });
      assert.equal(result, 3);
    });

    it('should reject when the action does not exist', async () => {
      const thing = new Thing(partialTD);

      await assert.rejects(
        () => thing.invokeAction('missing', {}),
        /NotFoundError/,
      );
    });
  });

  describe('invokeActionAsync', () => {
    it('should return the initial action status', () => {
      const thing = new Thing(partialTD);
      thing.setActionInvokeHandler('blink', async (input) => input.count);

      const input = { count: 3 };
      const status = thing.invokeActionAsync('blink', input);

      assert.equal(status.status, 'pending');
      assert.match(status.href, /^\/actions\/blink\/[0-9a-f-]+$/);
      assert.equal(typeof status.timeRequested, 'string');
    });

    it('should throw when the action does not exist', () => {
      const thing = new Thing(partialTD);

      assert.throws(
        () => thing.invokeActionAsync('missing', {}),
        /NotFoundError/,
      );
    });
  });

  describe('queryAction', () => {
    it('should throw when the action does not exist', () => {
      const thing = new Thing(partialTD);

      assert.throws(
        () => thing.queryAction('missing', 'request-id'),
        /NotFoundError/,
      );
    });

    it('should throw when the action request does not exist', () => {
      const thing = new Thing(partialTD);

      assert.throws(
        () => thing.queryAction('blink', 'missing-request'),
        /NotFoundError/,
      );
    });
  });

  describe('queryAllActions', () => {
    it('should return request statuses grouped by action, newest first', () => {
      const thing = new Thing({
        ...partialTD,
        actions: {
          ...partialTD.actions,
          fade: {},
          unused: {},
        },
      });
      thing.setActionInvokeHandler('blink', async (input) => input);
      thing.setActionInvokeHandler('fade', async (input) => input);

      const blinkStatus = thing.invokeActionAsync('blink', { count: 1 });
      const firstFadeStatus = thing.invokeActionAsync('fade', { count: 2 });
      const secondFadeStatus = thing.invokeActionAsync('fade', { count: 3 });

      const statuses = thing.queryAllActions();
      assert.deepEqual(
        statuses.blink.map(({ href }) => href),
        [blinkStatus.href],
      );
      assert.deepEqual(
        statuses.fade.map(({ href }) => href),
        [secondFadeStatus.href, firstFadeStatus.href],
      );
      assert.deepEqual(statuses.unused, []);
      assert.ok(
        Date.parse(statuses.fade[0].timeRequested) >=
          Date.parse(statuses.fade[1].timeRequested),
      );
    });
  });

  describe('cancelAction', () => {
    it('should abort and remove the action request', async () => {
      const thing = new Thing(partialTD);
      let actionSignal;
      let resolveStarted;
      const started = new Promise((resolve) => {
        resolveStarted = resolve;
      });
      thing.setActionInvokeHandler(
        'blink',
        async (_input, signal) =>
          new Promise((resolve) => {
            actionSignal = signal;
            resolveStarted();
            signal.addEventListener('abort', resolve, { once: true });
          }),
      );

      const status = thing.invokeActionAsync('blink', {});
      await started;
      thing.cancelAction('blink', status.href.split('/').at(-1));

      assert.equal(actionSignal.aborted, true);
      assert.throws(
        () => thing.queryAction('blink', status.href.split('/').at(-1)),
        /NotFoundError/,
      );
    });

    it('should throw when the action does not exist', () => {
      const thing = new Thing(partialTD);

      assert.throws(
        () => thing.cancelAction('missing', 'request-id'),
        /NotFoundError/,
      );
    });

    it('should throw when the action request does not exist', () => {
      const thing = new Thing(partialTD);

      assert.throws(
        () => thing.cancelAction('blink', 'missing-request'),
        /NotFoundError/,
      );
    });
  });
});
