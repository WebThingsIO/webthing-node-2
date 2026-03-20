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
  };

  describe('constructor', () => {
    it('should store the partial Thing Description', () => {
      const thing = new Thing(partialTD);
      assert.deepStrictEqual(thing.partialTD, partialTD);
    });
  });

  describe('getThingDescription', () => {
    it('should return the Thing Description', () => {
      const thing = new Thing(partialTD);
      const td = thing.getThingDescription();
      assert.deepStrictEqual(td, partialTD);
    });
  });

  describe('setPropertyReadHandler', () => {
    it('should register a property read handler', () => {
      const thing = new Thing(partialTD);
      const handler = () => true;
      thing.setPropertyReadHandler('on', handler);
      assert.strictEqual(thing.propertyReadHandlers.has('on'), true);
    });
  });

  describe('readProperty', () => {
    it('should return the value from the property read handler', () => {
      const thing = new Thing(partialTD);
      thing.setPropertyReadHandler('on', () => true);
      const value = thing.readProperty('on');
      assert.strictEqual(value, true);
    });

    it('should support async property read handlers', async () => {
      const thing = new Thing(partialTD);
      thing.setPropertyReadHandler('on', async () => false);
      const value = await thing.readProperty('on');
      assert.strictEqual(value, false);
    });

    it('should throw when no handler is registered', () => {
      const thing = new Thing(partialTD);
      assert.throws(() => thing.readProperty('on'));
    });
  });
});
