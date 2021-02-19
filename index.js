const WebSocket = require('ws');

const enabled = process.env.AMBEEANCE === 'ENABLED';
const host = process.env.AMBEEANCE_HOST || 'localhost';
const port = process.env.AMBEEANCE_PORT || 8335;

let client;
let clientPromise;
if (enabled) {
  const url = `ws://${host}:${port}`;
  client = new WebSocket(url);
  clientPromise = new Promise((resolve) => {
    client.once('open', () => resolve(client));
  });
}
const ambeeance = (config) => {
  const configProxy = config;
  if (enabled) {
    client.on('message', (msg) => {
      const configs = JSON.parse(msg);
      Object.keys(configProxy).forEach((key) => {
        if (typeof configs[key] !== 'undefined') {
          configProxy[key] = configs[key];
        }
      });
    });
    clientPromise.then((connectedClient) => {
      connectedClient.send(
        JSON.stringify({
          type: 'AUTOSPEC',
          args: Object.keys(configProxy)
            .map((key) => ({
              key,
              value: configProxy[key],
            }))
            .filter(
              (spec) =>
                ['string', 'boolean', 'number'].indexOf(
                  typeof spec.value,
                ) > -1,
            ),
        }),
      );
    });
  }
  return configProxy;
};

module.exports = {
  ambeeance,
};
