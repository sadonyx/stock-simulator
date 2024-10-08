import express from 'express';
import { connect, StringCodec } from 'nats';
import { WebSocketServer } from 'ws';

const PORT = 5001;
const app = express();
app.use(express.json());

const nc = await connect({ servers: 'nats://localhost:4222' });
let subscriptions = {}; // storage for user subscriptions

// set up websocket server
const wss = new WebSocketServer ({ port: PORT });

// websocket client storage to manage multiple connections
const wsClients = [];

// Add websocket connection handler
wss.on('connection', (ws) => {
  console.log('New WebSocket client connected!');
  wsClients.push(ws);

  ws.on('message', (message) => {
    const parsedMessage = JSON.parse(message);
    const {symbol, threshold, user } = parsedMessage;

    // add user subscription
    if (!subscriptions[symbol]) subscriptions[symbol] = [];
    subscriptions[symbol].push({user, threshold, ws});

    ws.send(`Subscribed to ${symbol} stock updates with threshold ${threshold}`);
  })
});

// handle websocket disconnect
wss.on('close', () => {
  wsClients = wsClients.filter(client => client !== ws);
  console.log('WebSocket client disconnected.');
});

// initialize NATS connection and subscriptions
(async () => {
    try {
        // connect to NATS server
        const nc = await connect({ servers: 'nats://localhost:4222' });
        console.log('Connected to NATS');

        // message decoding
        const sc = StringCodec();

        // subscribe to stock price updates
        const subscription = nc.subscribe('stocks.*');
        console.log('Subscribed to stock price updates from NATS');

        // handle incoming stock price messages
        for await (const msg of subscription) {
            const stockData = JSON.parse(sc.decode(msg.data));
            const symbol = stockData.symbol;
            const prices = stockData.prices;
            console.log(`Received stock update for ${symbol}: ${prices.open}`);

            // send stock update to websocket clients
            wsClients.forEach(ws => {
                ws.send(JSON.stringify({ symbol, prices }));
            });

            // check price threshold for subscribed topic
            if (subscriptions[symbol]) {
                subscriptions[symbol].forEach(sub => {
                    if (prices.open >= sub.threshold) {
                        sub.ws.send(`Alert! ${symbol} reached ${prices.open}`);
                        console.log(`Notified ${sub.user}: ${symbol} reached ${prices.open}`);
                    }
                });
            }
        }
    } catch (err) {
        console.error('Error connecting to NATS or handling subscriptions:', err);
    }
})();

// Route to add subscription
// app.post('/subscribe', (req, res) => {
//     const { user, symbol, threshold } = req.body;
//     if (!subscriptions[symbol]) subscriptions[symbol] = [];
//     subscriptions[symbol].push({ user, threshold });
//     res.send(`Subscribed ${user} to ${symbol} alerts.`);
// });