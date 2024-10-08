import { connect } from 'nats';
import fs from 'fs';
import JSONStream from 'JSONStream';

const SYMBOLS = ['AAPL', 'AMZN', 'GOOG', 'IBM', 'META', 'MSFT', 'NVDA'];
const filePaths = {};
SYMBOLS.forEach((sym) => {
  filePaths[sym] = `./data/${sym.toLowerCase()}.json`;
});



// object processing delay
const processWithDelay = (delay, callback) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      callback();
      resolve();
    }, delay);
  })
}

const runDataStream = async(symbol) => {  
  const readStream = fs.createReadStream(filePaths[symbol], { encoding: 'utf-8' });
  const parser = JSONStream.parse('Time Series (5min).*');
  const streamDelay = 1000;
  let queue = Promise.resolve();

  readStream.pipe(parser);

  let nc;
  try {
    nc = await connect({ servers: 'nats://localhost:4222' });
    console.log('Connected to NATS');
  } catch (error) {
    console.log('Could not connect to NATS:', error);
  }

  parser.on('data', (object) => {
    queue = queue.then(() => processWithDelay(streamDelay, () => {
      const data = {
        symbol: symbol,
        prices: {
          open: Number(object['1. open']),
          close: Number(object['4. close']),
        }
      }
      try {
        nc.publish(`stocks.${symbol}`, JSON.stringify(data));
      } catch (error) {
        console.log('Could not publish data:', error);
      }
    }))
  });

  parser.on('end', async() => {
    console.log('Finished reading and parsing the file.');
    queue.then(() => {
      try {
        nc.flush();
        nc.close();
      } catch (error) {
        console.log('Could not close NATS connection:', error);
      }
    })
    
  });
}

runDataStream('AAPL');
runDataStream('AMZN');
runDataStream('MSFT');
runDataStream('GOOG');

// const publishMessage = async() => {
//   try {
//     const nc = await connect({ servers: 'nats://localhost:4222' });

//     console.log('Connected to NATS');

//     // const latestPrice = await fetchStockData();
//     // console.log("Latest Price:", latestPrice);

//     // nc.publish(`stocks.${SYMBOL}`, JSON.stringify({ symbol: SYMBOL, price: latestPrice }));
//     nc.publish(`stocks.${SYMBOL}`, JSON.stringify(DUMMY));

//     // Close the connection when done
//     await nc.flush();
//     await nc.close();
//   } catch (error) {
//     console.error(error);
//   }
// }

// (async () => {
//   try {
//     const nc = await connect({ servers: 'nats://localhost:4222' });

//     console.log('Connected to NATS');

//     // const latestPrice = await fetchStockData();
//     // console.log("Latest Price:", latestPrice);

//     // nc.publish(`stocks.${SYMBOL}`, JSON.stringify({ symbol: SYMBOL, price: latestPrice }));
//     nc.publish(`stocks.${SYMBOL}`, JSON.stringify(DUMMY));

//     // Close the connection when done
//     await nc.flush();
//     await nc.close();
//   } catch (error) {
//     console.error(error);
//   }
// })();

// async function fetchStockData() {
//     const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${SYMBOL}&interval=1min&apikey=${API_KEY}`;
//     try {
//         const response = await fetch(url);
//         const data = await response.json();
//         const stockPrices = data["Time Series (1min)"];
//         console.log(data)
//         // const latestDataPointKey = Object.keys(stockPrices)[0];
//         // const latestPrice = stockPrices[latestDataPointKey]["4. close"];
//         // return latestPrice;
//         return 0
//     } catch (error) {
//         console.error('Error fetching stock data:', error);
//     }
// }

// fetchStockData();
// setInterval(fetchStockData, 15000); // Fetch every minute
// setInterval(publishMessage, 1000); // Fetch every 1s (which represents 1 min in real-time)