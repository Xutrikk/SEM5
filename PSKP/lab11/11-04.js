let WebSocket = require('ws');

let wss = new WebSocket.Server({port: 4000, host: 'localhost'});

let messageCounter = 0;

wss.on('connection', ws => {
    ws.on('message', msg => {
        console.log(`message: ${msg.toString()}`);
        let params = JSON.parse(msg);

        const response = {
            server: ++messageCounter,  
            client: params.client,
            timestamp: params.timestamp  
        };

        ws.send(JSON.stringify(response, null, 2));
    });
});

wss.on('error', err => {
    console.log('error: ', err);
});