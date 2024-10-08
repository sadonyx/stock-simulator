import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState('default');
  const [aapl, setAapl] = useState();
  const [msft, setMsft] = useState();
  const [goog, setGoog] = useState();
  const [amzn, setAmzn] = useState();

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:5001');

    // send subscription request
    ws.onopen = () => {
      console.log('WebSocket connection established.');
      setIsConnected(true); 
    }

    // handle incoming messages
    ws.onmessage = (event) => {
      
      try {
        const stockUpdate = JSON.parse(event.data);
        if (stockUpdate.symbol == 'AAPL') setAapl(stockUpdate.prices.open);
        if (stockUpdate.symbol == 'MSFT') setMsft(stockUpdate.prices.open);
        if (stockUpdate.symbol == 'GOOG') setGoog(stockUpdate.prices.open);
        if (stockUpdate.symbol == 'AMZN') setAmzn(stockUpdate.prices.open);
      } catch (error) {
        console.log(event.data);
      }
    };

    ws.onclose= () => {
      console.log('WebSocket connection closed.');
      setIsConnected(false); 
    }

    setSocket(ws);

    return () => {
      if (ws) ws.close();
    }
  }, [])

  const handleSubscription = (symbol, threshold) => {
    if (socket && isConnected) {
      const subscriptionMessage = JSON.stringify({
      user: user,
      symbol: symbol,
      threshold: threshold,
    });
    socket.send(subscriptionMessage);
    }
  }

  return (
    <div>
      <button onClick={() => handleSubscription('AAPL', 227)} disabled={!isConnected}>AAPL</button>
      <button onClick={() => handleSubscription('MSFT', 435)} disabled={!isConnected}>MSFT</button>
      <button onClick={() => handleSubscription('GOOG', 164)} disabled={!isConnected}>GOOG</button>
      <button onClick={() => handleSubscription('AMZN', 190)} disabled={!isConnected}>AMZN</button>
      <div>
        <p>AAPL: {aapl}</p>
        <p>MSFT: {msft}</p>
        <p>GOOG: {goog}</p>
        <p>AMZN: {amzn}</p>
      </div>
    </div>
  )
}

export default App
