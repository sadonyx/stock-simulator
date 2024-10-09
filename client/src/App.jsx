import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState('default');
  const [aapl, setAapl] = useState({active: false, price: 0});
  const [msft, setMsft] = useState({active: false, price: 0});
  const [goog, setGoog] = useState({active: false, price: 0});
  const [amzn, setAmzn] = useState({active: false, price: 0});
  const [thresholds, setThresholds] = useState({'AAPL': 227, 'MSFT': 435, 'GOOG': 164, 'AMZN': 190});
  const [notification, setNotification] = useState({show: false, message: ''});

  useEffect(() => {
    const host = '146.190.150.209';
    const ws = new WebSocket(`ws://${host}:5001`);

    // send subscription request
    ws.onopen = () => {
      console.log('WebSocket connection established.');
      setIsConnected(true); 
    }

    // handle incoming messages
    ws.onmessage = (event) => {
      
      try {
        const stockUpdate = JSON.parse(event.data);
        if (stockUpdate.symbol == 'AAPL') setAapl((prevState) => ({...prevState, price: stockUpdate.prices.open}));
        if (stockUpdate.symbol == 'MSFT') setMsft((prevState) => ({...prevState, price: stockUpdate.prices.open}));
        if (stockUpdate.symbol == 'GOOG') setGoog((prevState) => ({...prevState, price: stockUpdate.prices.open}));
        if (stockUpdate.symbol == 'AMZN') setAmzn((prevState) => ({...prevState, price: stockUpdate.prices.open}));
      } catch (error) {
        setNotification({show: true, message: event.data})
        console.log(error);
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
    if (symbol == 'AAPL') setAapl((prevState) => ({...prevState, active: true}));
    if (symbol == 'MSFT') setMsft((prevState) => ({...prevState, active: true}));
    if (symbol == 'GOOG') setGoog((prevState) => ({...prevState, active: true}));
    if (symbol == 'AMZN') setAmzn((prevState) => ({...prevState, active: true}));
    socket.send(subscriptionMessage);
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleThresholdChange(e);
    }
  }

  const handleThresholdChange = (e) => {
    const stockName = e.currentTarget.previousElementSibling.name;
    const value = Number(e.currentTarget.previousElementSibling.value);
    const subCopy = structuredClone(thresholds);
    subCopy[stockName] = value;
    setThresholds(subCopy);
  }

  return (
    <div>
      { notification.show &&
        <span className='notification'>
          {notification.message}
        </span>
      }
      <div className='sub-container'>
        <span>
          <button className='sub-button' onClick={() => handleSubscription('AAPL', thresholds.AAPL)} disabled={!isConnected}>AAPL</button>
          <input className='thresh-input' name='AAPL' defaultValue={thresholds.AAPL} onKeyDown={handleKeyDown}></input>
          <button name='AAPL' onClick={handleThresholdChange}>Update</button>
        </span>
        <span>
          <button className='sub-button' onClick={() => handleSubscription('MSFT', thresholds.MSFT)} disabled={!isConnected}>MSFT</button>
          <input className='thresh-input' name='MSFT' defaultValue={thresholds.MSFT} onKeyDown={handleKeyDown}></input>
          <button name='MSFT' onClick={handleThresholdChange}>Update</button>
        </span>
        <span>
          <button className='sub-button' onClick={() => handleSubscription('GOOG', thresholds.GOOG)} disabled={!isConnected}>GOOG</button>
          <input className='thresh-input' name='GOOG' defaultValue={thresholds.GOOG} onKeyDown={handleKeyDown}></input>
          <button name='GOOG' onClick={handleThresholdChange}>Update</button>
        </span>
        <span>
          <button className='sub-button'onClick={() => handleSubscription('AMZN', thresholds.AMZN)} disabled={!isConnected}>AMZN</button>
          <input className='thresh-input' name='AMZN' defaultValue={thresholds.AMZN} onKeyDown={handleKeyDown}></input>
          <button name='AMZN' onClick={handleThresholdChange}>Update</button>
        </span>
      </div>
      <div>
        <p>AAPL: {aapl.price}</p>
        <p>MSFT: {msft.price}</p>
        <p>GOOG: {goog.price}</p>
        <p>AMZN: {amzn.price}</p>
      </div>
    </div>
  )
}

export default App
