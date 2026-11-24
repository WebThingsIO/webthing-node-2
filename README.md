# webthing-node-2

Node.js implementation of a [W3C WoT](https://www.w3.org/WoT/) Web Thing.

This is a work-in-progress pure Node.js replacement for the webthing-node library which will implement the [W3C WoT Thing Description](https://www.w3.org/TR/wot-thing-description/), [W3C WoT Discovery](https://www.w3.org/TR/wot-discovery/) and ([proposed](https://lists.w3.org/Archives/Public/public-web-thing-protocol/2026Mar/0001.html)) W3C WoT Thing Protocol specifications.

## Example Web Thing

To run an example web thing representing a lamp:

`$ npm run example`

## Create Your Own Web Thing

Import the webthing library:

```javascript
import { Thing, ThingServer } from 'webthing';
```

Create a partial Thing Description without Forms or security definitions:

```javascript
const partialTD = {
  title: 'My Lamp',
  description: 'A web connected lamp',
  properties: {
    on: {
      type: 'boolean',
      title: 'On/Off',
      description: 'Whether the lamp is turned on',
    },
    level: {
      type: 'integer',
      title: 'Brightness',
      description: 'The level of light from 0-100',
      unit: 'percent',
      minimum: 0,
      maximum: 100,
    },
  },
  actions: {
    fade: {
      title: 'Fade',
      description: 'Fade the lamp to a given level',
      synchronous: false,
      input: {
        type: 'object',
        properties: {
          level: {
            title: 'Brightness',
            type: 'integer',
            minimum: 0,
            maximum: 100,
            unit: 'percent',
          },
          duration: {
            title: 'Duration',
            type: 'integer',
            minimum: 0,
            unit: 'milliseconds',
          },
        },
      },
    },
  },
  events: {
    overheated: {
      title: 'Overheated',
      data: {
        type: 'number',
        unit: 'degree celsius',
      },
      description: 'The lamp has exceeded its safe operating temperature',
    },
  },
};
```

Instantiate a Web Thing from the partial Thing Description:

```javascript
const thing = new Thing(partialTD);
```

### Properties

Set property handlers:

```javascript
thing.setPropertyReadHandler('on', async function () {
  return true;
});

thing.setPropertyReadHandler('level', async function () {
  return 50;
});

thing.setPropertyWriteHandler('on', async function (value) {
  // Update the lamp state.
});
```

### Actions

Set action handlers:

```javascript
thing.setActionInvokeHandler('fade', async (input, signal) => {
  // Check signal.aborted or listen for its "abort" event during long-running work.
});
```

For synchronous actions set `synchronous` to `true` in the Thing Description. The invoke handler should accept the action input as an argument and return a promise which resolves with the action output.

For asynchronous actions set `synchronous` to `false` in the Thing Description. The invoke handler should accept the action input as its first argument, and an optional `AbortSignal` as a second argument so the action can be stopped if the request is cancelled.

### Thing Server

Expose to the Thing to the Web of Things by starting its web server, providing
a port number as an argument:

Create and start a Thing server using your Thing.

```javascript
const server = new ThingServer(thing);

server.start(8080);
```

## Development

### Type Checking

You can type check this library against JSDoc annotations with:

`$ npm run typecheck`

### Fixing Formatting

`$ npm run format` (to write the changes)

`$ npm run format:check` (just to run checks without writing)

### Lint

Run the linter with:

`$ npm run lint`

### Running Tests

You can run tests with:

`$ npm test`
