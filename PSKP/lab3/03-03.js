const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

function factorial(n) {
    if (n < 0) {
        throw new Error("Факториал отрицательного числа не определен");
    }
    if (n === 0 || n === 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    
    if (parsedUrl.pathname === '/fact' && req.method === 'GET') {
        const k = parseInt(parsedUrl.query.k, 10);
        
        if (isNaN(k)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Параметр k должен быть целым числом" }));
            return;
        }
        
        if (k < 0) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Параметр k должен быть неотрицательным числом" }));
            return;
        }
        
        try {
            const factResult = factorial(k);
            res.writeHead(200, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*' 
            });
            res.end(JSON.stringify({ k: k, fact: factResult }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    } 

    else if (parsedUrl.pathname === '/' && req.method === 'GET') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Ошибка загрузки HTML-страницы');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(data);
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "Неверный путь запроса" }));
    }
});

const PORT = 5000;
server.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});