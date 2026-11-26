import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import DataSchema from '../src/data-schema.js';
import ValidationError from '../src/validation-error.js';

describe('DataSchema', () => {
  it('should validate values against the provided schema', () => {
    const schema = new DataSchema({ type: 'integer', minimum: 0 });

    assert.equal(schema.validate(1), true);
    assert.equal(schema.validate(-1), false);
    assert.equal(schema.validate('1'), false);
  });

  it('should accept values when no schema is provided', () => {
    const schema = new DataSchema(undefined);

    assert.equal(schema.validate({ any: 'value' }), true);
  });

  it('should report invalid schemas with their Thing Description field', () => {
    assert.throws(
      () => new DataSchema({ type: 'invalid' }, 'properties.level'),
      (error) => {
        assert.ok(error instanceof ValidationError);
        assert.equal(error.validationErrors[0].field, 'properties.level');
        return true;
      },
    );
  });

  it('should leave the validation error field undefined when omitted', () => {
    assert.throws(
      () => new DataSchema({ type: 'invalid' }),
      (error) => {
        assert.ok(error instanceof ValidationError);
        assert.equal(error.validationErrors[0].field, undefined);
        return true;
      },
    );
  });
});
