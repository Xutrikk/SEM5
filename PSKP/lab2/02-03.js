const http = require('http');

http.createServer(function (request, response) {
    if (request.url === '/api/name') {
        response.writeHead(200, {
            'Content-Type': 'text/plain; charset=utf-8'
        });
        response.end('Хуторцов Кирилл Владимирович');
    } else {
        response.writeHead(404);
        response.end('Not Found');
    }
}).listen(5000);

console.log('Сервер запущен на http://localhost:5000');
console.log('Перейдите по адресу http://localhost:5000/api/name для получения ФИО');