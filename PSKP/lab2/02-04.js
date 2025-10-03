const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((request, response) => {
    if (request.url === '/xmlhttprequest') {
        const filePath = path.join(__dirname, 'xmlhttprequest.html');
        
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                response.writeHead(500, {'Content-Type': 'text/plain'});
                response.end('Ошибка загрузки страницы');
                console.error('Ошибка чтения файла:', err);
            } else {
                response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
                response.end(data);
            }
        });
    } 

    else if (request.url === '/api/name') {
        response.writeHead(200, {
            'Content-Type': 'text/plain; charset=utf-8',
            'Access-Control-Allow-Origin': '*' 
        });
        response.end('Хуторцов Кирилл Владимирович'); 
    } 
    else {
        response.writeHead(404, {'Content-Type': 'text/plain'});
        response.end('Страница не найдена');
    }
});

server.listen(5000, () => {
    console.log('Сервер запущен на http://localhost:5000');
    console.log('Перейдите по адресу http://localhost:5000/xmlhttprequest для тестирования XMLHttpRequest');
    console.log('API доступно по адресу http://localhost:5000/api/name');
});