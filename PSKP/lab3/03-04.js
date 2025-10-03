const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

function asyncFactorial(n, callback) {
    if (n < 0) {
        process.nextTick(() => callback(new Error("Факториал отрицательного числа не определен")));
        return;
    }
    
    if (n === 0 || n === 1) {
        process.nextTick(() => callback(null, 1));
        return;
    }
    
    const calculate = (i, result, callback) => {
        if (i > n) {
            process.nextTick(() => callback(null, result));
            return;
        }
        
        process.nextTick(() => {
            calculate(i + 1, result * i, callback);
        });
    };
    
    calculate(1, 1, callback);
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
        
        asyncFactorial(k, (error, factResult) => {
            if (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            } else {
                res.writeHead(200, { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(JSON.stringify({ k: k, fact: factResult }));
            }
        });
    } 

    else if (parsedUrl.pathname === '/' && req.method === 'GET') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Ошибка загрузки страницы');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
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