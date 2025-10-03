const http = require('http');
const fs = require('fs');

http.createServer(function (request, response) {
    if (request.url === '/jpg') {
        const fname = './4cats.jpg';
        
        fs.stat(fname, (err, stat) => { 
            if (err) {
                console.log('error:', err);
                response.writeHead(404);
                response.end('File not found');
            } else {
                const png = fs.readFileSync(fname);
                response.writeHead(200, {
                    'Content-Type': 'image/jpg',
                    'Content-Length': stat.size
                });
                response.end(png, 'binary');
            }
        });
    } else {
        response.writeHead(404);
        response.end('Not Found');
    }
}).listen(5000);

console.log('Сервер запущен на http://localhost:5000');
console.log('Перейдите по адресу http://localhost:5000/jpg для просмотра котиков');