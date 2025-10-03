const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const DB = require('./DB');

const db = new DB();

db.on('GET', (data) => {
    console.log('GET: Получены все данные', data);
});

db.on('POST', (data) => {
    console.log('POST: Добавлена новая запись', data);
});

db.on('PUT', (data) => {
    console.log('PUT: Обновлена запись', data);
});

db.on('DELETE', (data) => {
    console.log('DELETE: Удалена запись', data);
});

db.on('POST_ERROR', (error) => {
    console.log('POST_ERROR:', error);
});

db.on('PUT_ERROR', (error) => {
    console.log('PUT_ERROR:', error);
});

db.on('DELETE_ERROR', (error) => {
    console.log('DELETE_ERROR:', error);
});

function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (error) {
                reject(error);
            }
        });
        req.on('error', reject);
    });
}

function serveStaticFile(res, filePath, contentType) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Ошибка загрузки файла');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    if (parsedUrl.pathname === '/' && req.method === 'GET') {
        serveStaticFile(res, path.join(__dirname, 'index.html'), 'text/html');
        return;
    }
    
    if (parsedUrl.pathname === '/api/db') {
        try {
            switch (req.method) {
                case 'GET':
                    const allData = await db.select();
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(allData));
                    break;
                    
                case 'POST':
                    const newRow = await parseBody(req);
                    const insertedRow = await db.insert(newRow);
                    res.writeHead(201, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(insertedRow));
                    break;
                    
                case 'PUT':
                    const updatedData = await parseBody(req);
                    const updatedRow = await db.update(updatedData);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(updatedRow));
                    break;
                    
                case 'DELETE':
                    const id = parseInt(parsedUrl.query.id, 10);
                    if (isNaN(id)) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: "Необходимо указать числовой id" }));
                        return;
                    }
                    const deletedRow = await db.delete(id);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(deletedRow));
                    break;
                    
                default:
                    res.writeHead(405, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: "Метод не поддерживается" }));
            }
        } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "Неверный путь запроса" }));
    }
});

const PORT = 5000;
server.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log('API доступно по адресу: http://localhost:5000/api/db');
});