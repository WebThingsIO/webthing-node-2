/**
 * TypeScript types for the W3C WoT Thing Description.
 *
 * @see https://www.w3.org/TR/wot-thing-description11/
 */

/**
 * A JSON-LD context entry, either a URI string or a context object mapping
 * prefixes to URIs.
 */
export type ContextEntry = string | Record<string, string>;

/**
 * A data schema used to describe the data format of properties, action
 * input/output, and event data.
 *
 * @see https://www.w3.org/TR/wot-thing-description11/#sec-data-schema-vocabulary-definition
 */
export interface DataSchema {
  type?:
    | 'boolean'
    | 'integer'
    | 'number'
    | 'string'
    | 'object'
    | 'array'
    | 'null';
  title?: string;
  description?: string;
  unit?: string;
  minimum?: number;
  maximum?: number;
  enum?: Array<string | number | boolean | null>;
  readOnly?: boolean;
  writeOnly?: boolean;
  const?: unknown;
  default?: unknown;
  /** Properties of an object-typed schema. */
  properties?: Record<string, DataSchema>;
  required?: string[];
  /** Schema for items of an array-typed schema. */
  items?: DataSchema;
  minItems?: number;
  maxItems?: number;
  oneOf?: DataSchema[];
  format?: string;
}

/**
 * A property affordance extending DataSchema with observable capability.
 *
 * @see https://www.w3.org/TR/wot-thing-description11/#propertyaffordance
 */
export interface PropertyAffordance extends DataSchema {
  observable?: boolean;
}

/**
 * An action affordance describing a function which can be invoked.
 *
 * @see https://www.w3.org/TR/wot-thing-description11/#actionaffordance
 */
export interface ActionAffordance {
  title?: string;
  description?: string;
  input?: DataSchema;
  output?: DataSchema;
  safe?: boolean;
  idempotent?: boolean;
  synchronous?: boolean;
}

/**
 * An event affordance describing an event source.
 *
 * @see https://www.w3.org/TR/wot-thing-description11/#eventaffordance
 */
export interface EventAffordance {
  title?: string;
  description?: string;
  data?: DataSchema;
  subscription?: DataSchema;
  cancellation?: DataSchema;
}

/**
 * A security scheme definition.
 *
 * @see https://www.w3.org/TR/wot-thing-description11/#sec-security-vocabulary-definition
 */
export interface SecurityScheme {
  scheme:
    | 'nosec'
    | 'basic'
    | 'digest'
    | 'bearer'
    | 'psk'
    | 'oauth2'
    | 'apikey'
    | 'auto';
  description?: string;
  proxy?: string;
  in?: 'header' | 'query' | 'body' | 'cookie' | 'uri' | 'auto';
  name?: string;
}

/**
 * A form hypermedia control describing how an operation can be performed.
 *
 * @see https://www.w3.org/TR/wot-thing-description11/#form
 */
export interface Form {
  href: string;
  contentType?: string;
  op?: string | string[];
  subprotocol?: string;
}

/**
 * A partial Thing Description provided by the user, to which Forms and
 * security metadata will be added by the server.
 *
 * @see https://www.w3.org/TR/wot-thing-description11/#thing
 */
export interface PartialTD {
  '@context'?: ContextEntry | ContextEntry[];
  title: string;
  titles?: Record<string, string>;
  description?: string;
  descriptions?: Record<string, string>;
  id?: string;
  properties?: Record<string, PropertyAffordance>;
  actions?: Record<string, ActionAffordance>;
  events?: Record<string, EventAffordance>;
}

/**
 * A complete, valid Thing Description with required security and context
 * fields populated by the server.
 *
 * @see https://www.w3.org/TR/wot-thing-description11/#thing
 */
export interface ThingDescription {
  '@context': ContextEntry | ContextEntry[];
  title: string;
  titles?: Record<string, string>;
  description?: string;
  descriptions?: Record<string, string>;
  id?: string;
  securityDefinitions: Record<string, SecurityScheme>;
  security: string | string[];
  properties?: Record<string, PropertyAffordance & { forms?: Form[] }>;
  actions?: Record<string, ActionAffordance & { forms?: Form[] }>;
  events?: Record<string, EventAffordance & { forms?: Form[] }>;
  forms?: Form[];
  links?: Array<{ href: string; rel?: string; type?: string }>;
}
