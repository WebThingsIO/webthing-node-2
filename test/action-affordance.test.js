import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import ActionAffordance from '../src/action-affordance.js';
import DataSchema from '../src/data-schema.js';
import ValidationError from '../src/validation-error.js';

describe('ActionAffordance', () => {
  describe('constructor', () => {
    it('should parse valid action metadata', () => {
      const action = new ActionAffordance('toggle', {
        title: 'Toggle',
        description: 'Toggle the light',
        input: { type: 'boolean' },
        output: { type: 'boolean' },
        safe: true,
        idempotent: true,
        synchronous: false,
      });

      assert.equal(action.name, 'toggle');
      assert.equal(action.title, 'Toggle');
      assert.deepEqual(action.input, { type: 'boolean' });
      assert.deepEqual(action.output, { type: 'boolean' });
      assert.ok(action.inputSchema instanceof DataSchema);
      assert.ok(action.outputSchema instanceof DataSchema);
      assert.equal(action.inputSchema.validate(true), true);
      assert.equal(action.outputSchema.validate(false), true);
      assert.equal(action.safe, true);
      assert.equal(action.idempotent, true);
      assert.equal(action.synchronous, false);
    });

    it('should default safe and idempotent to false when omitted', () => {
      const action = new ActionAffordance('reboot', {});

      assert.equal(action.safe, false);
      assert.equal(action.idempotent, false);
      assert.equal(action.synchronous, undefined);
      assert.ok(action.inputSchema instanceof DataSchema);
      assert.ok(action.outputSchema instanceof DataSchema);
    });

    it('should reject invalid member types', () => {
      assert.throws(
        () => new ActionAffordance('badInput', { input: 'not-an-object' }),
        (error) => {
          assert.ok(error instanceof ValidationError);
          assert.equal(
            error.validationErrors[0].field,
            'actions.badInput.input',
          );
          assert.equal(
            error.validationErrors[0].description,
            'input member is not valid',
          );
          return true;
        },
      );

      assert.throws(
        () => new ActionAffordance('badSafe', { safe: 'yes' }),
        (error) => {
          assert.ok(error instanceof ValidationError);
          assert.equal(error.validationErrors[0].field, 'actions.badSafe.safe');
          assert.equal(
            error.validationErrors[0].description,
            'safe member is not a boolean',
          );
          return true;
        },
      );
    });
  });

  describe('getMetadata', () => {
    it('should return the action metadata with the generated invocation form', () => {
      const action = new ActionAffordance('blink', {
        title: 'Blink',
        output: { type: 'string' },
        safe: true,
        idempotent: true,
        synchronous: true,
      });

      assert.deepEqual(action.getMetadata(), {
        title: 'Blink',
        output: { type: 'string' },
        safe: true,
        idempotent: true,
        synchronous: true,
        forms: [{ href: 'actions/blink', op: 'invokeaction' }],
      });
    });
  });

  describe('invoke', () => {
    it('should call the registered invoke handler with the action input', async () => {
      const action = new ActionAffordance('setColor', {
        input: { type: 'string' },
      });
      action.setInvokeHandler(async (value) => ({ value }));

      const result = await action.invoke('red');
      assert.deepEqual(result, { value: 'red' });
    });

    it('should validate action input and output against their schemas', async () => {
      const action = new ActionAffordance('setLevel', {
        input: {
          type: 'object',
          properties: { level: { type: 'integer', minimum: 0 } },
          required: ['level'],
        },
        output: { type: 'string', enum: ['ok', 'failed'] },
      });
      let invoked = false;
      action.setInvokeHandler(async () => {
        invoked = true;
        return 'unexpected';
      });

      await assert.rejects(() => action.invoke({}), /BadRequest/);
      assert.equal(invoked, false);
      await assert.rejects(() => action.invoke({ level: 1 }), /InternalError/);
    });

    it('should fail asynchronous actions when their output violates the schema', async () => {
      const action = new ActionAffordance('getLevel', {
        output: { type: 'integer' },
      });
      action.setInvokeHandler(async () => 'not an integer');

      const { href } = action.invokeAsync(undefined);
      await new Promise((resolve) => setImmediate(resolve));

      assert.equal(action.query(href.split('/').at(-1)).status, 'failed');
      assert.equal(
        action.query(href.split('/').at(-1)).error.detail,
        'InternalError',
      );
    });

    it('should reject when no invoke handler has been registered', async () => {
      const action = new ActionAffordance('setColor', {
        input: { type: 'string' },
      });

      await assert.rejects(() => action.invoke('red'), /InternalError/);
    });
  });
});
