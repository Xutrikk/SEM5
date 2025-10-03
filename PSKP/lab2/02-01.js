const http = require('http');
const fs = require('fs');

http.createServer(function (request, response) {
    if (request.url === '/html') {
        fs.readFile('index.html', function(err, data) {
            response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
            response.end(data);
        });
    } else {
        response.writeHead(404, {'Content-Type': 'text/plain'});
        response.end('Not Found');
    }
}).listen(5000);

console.log('Сервер запущен на http://localhost:5000');
console.log('Перейдите по адресу http://localhost:5000/html для просмотра данных студента');