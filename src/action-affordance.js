import InteractionAffordance from './interaction-affordance.js';
import ValidationError from './validation-error.js';
import { randomUUID } from 'node:crypto';
import DataSchema from './data-schema.js';

/** @import {DataSchemaDescription, PartialActionDescription, ActionDescription, Form,
 *    ActionStatus} from "./types.js"
 */

/** @typedef {{status: ActionStatus, controller: AbortController}} ActionRequest */

/**
 * Action Affordance
 *
 * Represents an ActionAffordance from the W3C WoT Thing Description 1.1
 * specification https://www.w3.org/TR/wot-thing-description/#actionaffordance
 */
class ActionAffordance extends InteractionAffordance {
  /**
   * @type {DataSchemaDescription|undefined}
   */
  input;

  /**
   * @type {DataSchemaDescription|undefined}
   */
  output;

  /**
   * @type {boolean|undefined}
   */
  safe;

  /**
   * @type {boolean|undefined}
   */
  idempotent;

  /**
   * @type {boolean|undefined}
   */
  synchronous;

  /**
   * @type {((value: any, signal?: AbortSignal) => Promise<any>)|undefined}
   */
  invokeHandler;

  /**
   * @type {Map<string, ActionRequest>}
   */
  #actionRequests = new Map();

  /**
   * @type {DataSchema}
   */
  inputSchema;

  /**
   * @type {DataSchema}
   */
  outputSchema;

  /**
   * Create a new Action.
   *
   * @param {string} name The name of the ActionAffordance from its
   *   key in an actions Map.
   * @param {PartialActionDescription} metadata Metadata describing an
   *   ActionAffordance from a partial Thing Description.
   */
  constructor(name, metadata) {
    super(name, metadata);

    let validationError = new ValidationError([]);

    // Parse input member
    try {
      this.#parseInputMember(metadata.input);
    } catch (error) {
      validationError.merge(error);
    }

    // Parse output member
    try {
      this.#parseOutputMember(metadata.output);
    } catch (error) {
      validationError.merge(error);
    }

    // Parse safe member
    try {
      this.#parseSafeMember(metadata.safe);
    } catch (error) {
      validationError.merge(error);
    }

    // Parse idempotent member
    try {
      this.#parseIdempotentMember(metadata.idempotent);
    } catch (error) {
      validationError.merge(error);
    }

    // Parse synchonrous member
    try {
      this.#parseSynchronousMember(metadata.synchronous);
    } catch (error) {
      validationError.merge(error);
    }

    if (validationError.validationErrors.length > 0) {
      throw validationError;
    }

    this.inputSchema = new DataSchema(this.input, `actions.${this.name}.input`);
    this.outputSchema = new DataSchema(
      this.output,
      `actions.${this.name}.output`,
    );
  }

  /**
   * Parse input member.
   *
   * @param {DataSchemaDescription|undefined} input
   */
  #parseInputMember(input) {
    if (!(input === undefined || typeof input === 'object')) {
      throw new ValidationError([
        {
          field: `actions.${this.name}.input`,
          description: 'input member is not valid',
        },
      ]);
    }
    this.input = input;
  }

  /**
   * Parse output member.
   * @param {DataSchemaDescription|undefined} output
   */
  #parseOutputMember(output) {
    if (!(output === undefined || typeof output === 'object')) {
      throw new ValidationError([
        {
          field: `actions.${this.name}.output`,
          description: 'output member is not valid',
        },
      ]);
    }
    this.output = output;
  }

  /**
   * Parse safe member.
   *
   * @param {boolean|undefined} safe
   *
   * TODO: Consider omitting this member if not specified
   */
  #parseSafeMember(safe) {
    // Throw an error if not a boolean or undefined
    if (!(safe === undefined || typeof safe == 'boolean')) {
      throw new ValidationError([
        {
          field: `actions.${this.name}.safe`,
          description: 'safe member is not a boolean',
        },
      ]);
    }
    // If undefined then default to false
    if (safe === undefined) {
      this.safe = false;
      // Otherwise set the provided value
    } else {
      this.safe = safe;
    }
  }

  /**
   * Parse idempotent member.
   *
   * @param {boolean|undefined} idempotent
   *
   * TODO: Consider omitting this member if not specified
   */
  #parseIdempotentMember(idempotent) {
    // Throw an error if not a boolean or undefined
    if (!(idempotent === undefined || typeof idempotent == 'boolean')) {
      throw new ValidationError([
        {
          field: `actions.${this.name}.idempotent`,
          description: 'idempotent member is not a boolean',
        },
      ]);
    }
    // If undefined then default to false
    if (idempotent === undefined) {
      this.idempotent = false;
      // Otherwise set the provided value
    } else {
      this.idempotent = idempotent;
    }
  }

  /**
   * Parse synchronous member.
   *
   * @param {boolean|undefined} synchronous
   */
  #parseSynchronousMember(synchronous) {
    // Throw an error if not a boolean or undefined
    if (!(synchronous === undefined || typeof synchronous == 'boolean')) {
      throw new ValidationError([
        {
          field: `actions.${this.name}.synchronous`,
          description: 'synchronous member is not a boolean',
        },
      ]);
    }
    this.synchronous = synchronous;
  }

  /**
   * Set invoke handler function.
   *
   * @param {(input: any, signal?: AbortSignal) => Promise<any>} handler An asynchronous function to handle action invocations.
   */
  setInvokeHandler(handler) {
    this.invokeHandler = handler;
  }

  /**
   * Invoke a synchronous action.
   *
   * @param {any} input The input to the action, conforming to the input data
   *   schema.
   * @returns {Promise<any>} A Promise which resolves with the output of the
   *   action (if any), conforming to the output data schema.
   * @throws {Error} Throws InternalError if handler is missing.
   *
   */
  async invoke(input) {
    if (!this.invokeHandler) {
      console.error(`No invoke handler set for action ${this.name}`);
      throw new Error('InternalError');
    }
    this.#validateInput(input);
    const output = await this.invokeHandler(input);
    this.#validateOutput(output);
    return output;
  }

  /**
   * @param {any} input
   * @throws {Error} Throws BadRequest on invalid input.
   */
  #validateInput(input) {
    if (!this.inputSchema.validate(input)) {
      console.error(`Tried to invoke action ${this.name} with invalid input`);
      throw new Error('BadRequest');
    }
  }

  /**
   * @param {any} output
   * @throws {Error} Throws InternalError on invalid output.
   */
  #validateOutput(output) {
    if (!this.outputSchema.validate(output)) {
      console.error(`Action ${this.name} returned invalid output`);
      throw new Error('InternalError');
    }
  }

  /**
   * Invoke an asynchronous action.
   *
   * @param {any} input The action input.
   * @returns {ActionStatus & {href: string}} The initial status of the action request.
   * @throws {Error} Throws InternalError if handler is missing.
   */
  invokeAsync(input) {
    this.#validateInput(input);
    if (!this.invokeHandler) {
      console.error(`No invoke handler set for action ${this.name}`);
      throw new Error('InternalError');
    }

    const actionID = randomUUID();
    const status = /** @type {ActionStatus & {href: string}} */ ({
      status: 'pending',
      href: `/actions/${encodeURIComponent(this.name)}/${actionID}`,
      timeRequested: new Date().toISOString(),
    });
    const request = {
      status,
      controller: new AbortController(),
    };
    this.#actionRequests.set(actionID, request);

    void Promise.resolve().then(async () => {
      if (this.#actionRequests.get(actionID) !== request) {
        return;
      }
      request.status.status = 'running';
      try {
        const output = await this.invokeHandler?.(
          input,
          request.controller.signal,
        );
        this.#validateOutput(output);
        if (this.#actionRequests.get(actionID) !== request) {
          return;
        }
        request.status.status = 'completed';
        if (output !== undefined) {
          request.status.output = output;
        }
      } catch (error) {
        if (this.#actionRequests.get(actionID) !== request) {
          return;
        }
        request.status.status = 'failed';
        request.status.error = {
          title: 'Action failed',
          ...(error instanceof Error ? { detail: error.message } : {}),
        };
      }
      request.status.timeEnded = new Date().toISOString();
    });

    return { ...status };
  }

  /**
   * Get the current status of an action request.
   *
   * @param {string} actionID The ID of the action request.
   * @returns {ActionStatus|undefined} The status, if the request exists.
   */
  query(actionID) {
    const request = this.#actionRequests.get(actionID);
    return request ? { ...request.status } : undefined;
  }

  /**
   * Get the statuses of all action requests, most recent first.
   *
   * @returns {Array<ActionStatus>} The current statuses of the action requests.
   */
  queryAll() {
    return [...this.#actionRequests.values()]
      .reverse()
      .map(({ status }) => ({ ...status }))
      .sort(
        (a, b) =>
          Date.parse(b.timeRequested ?? '') - Date.parse(a.timeRequested ?? ''),
      );
  }

  /**
   * Cancel an ongoing action request.
   *
   * @param {string} actionID The ID of the action request.
   * @throws {Error} Throws NotFoundError if the request does not exist,
   *   or ConflictError if it has already completed or failed.
   */
  cancel(actionID) {
    const request = this.#actionRequests.get(actionID);
    if (!request) {
      throw new Error('NotFoundError');
    }
    if (
      request.status.status === 'completed' ||
      request.status.status === 'failed'
    ) {
      throw new Error('ConflictError');
    }
    request.controller.abort();
    this.#actionRequests.delete(actionID);
  }

  /**
   * @returns {ActionDescription}
   */
  getMetadata() {
    let metadata = /** @type {ActionDescription} */ (super.getMetadata());
    if (this.input != undefined) {
      metadata.input = this.input;
    }
    if (this.output != undefined) {
      metadata.output = this.output;
    }
    // Only set safe member if explicitly set to true because false is default
    if (this.safe === true) {
      metadata.safe = true;
    }
    // Only set idempotent member if explicitly set to true because false is default
    if (this.idempotent === true) {
      metadata.idempotent = true;
    }
    // Only set idempotent member if explicitly set to true or false
    if (this.synchronous === true || this.synchronous === false) {
      metadata.synchronous = this.synchronous;
    }
    /** @type {Array<Form>} */
    metadata.forms = [];
    const invokeActionForm = {
      href: `actions/${this.name}`,
      op: 'invokeaction',
    };
    metadata.forms.push(invokeActionForm);
    return metadata;
  }
}

export default ActionAffordance;
