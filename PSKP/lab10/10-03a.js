const WebSocket = require('ws');

let param2 = process.argv[2];
let prfx = typeof param2 == 'undefined' ? 'A' : param2; // Исправлено: 'undefiend' → 'undefined'

console.log('client name = ', prfx);

const ws = new WebSocket('ws://localhost:4000/broadcast');

ws.onopen = () => { 
    console.log('Connected to WebSocket server');
    let k = 0;
    let sendingInterval = setInterval(() => {
        ws.send(`client: ${prfx}-${++k}`);
    }, 1000);

    setTimeout(() => {
        clearInterval(sendingInterval);
        ws.close();
        console.log('Client closed');
    }, 25000);
};

ws.onmessage = (message) => { 
    console.log(`${message.data}`);
};

ws.onclose = () => console.log('socket close');
ws.onerror = (e) => console.log('socket error', e);