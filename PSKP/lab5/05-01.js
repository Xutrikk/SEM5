const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const DB = require('./DB');

const db = new DB();
const statistics = {
    startTime: null,
    endTime: null,
    requestCount: 0,
    commitCount: 0,
    isActive: false
};

db.on('GET', (data) => {
    console.log('GET: Получены все данные', data);
    if (statistics.isActive) statistics.requestCount++;
});

db.on('POST', (data) => {
    console.log('POST: Добавлена новая запись', data);
    if (statistics.isActive) statistics.requestCount++;
});

db.on('PUT', (data) => {
    console.log('PUT: Обновлена запись', data);
    if (statistics.isActive) statistics.requestCount++;
});

db.on('DELETE', (data) => {
    console.log('DELETE: Удалена запись', data);
    if (statistics.isActive) statistics.requestCount++;
});

db.on('COMMIT', (data) => {
    console.log('COMMIT: Фиксация состояния БД', data);
    if (statistics.isActive) statistics.commitCount++;
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

let shutdownTimer = null;
let commitInterval = null;
let statsTimer = null;

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

function scheduleShutdown(seconds) {
    if (shutdownTimer) {
        clearTimeout(shutdownTimer);
        shutdownTimer = null;
        console.log('Предыдущая команда остановки отменена');
    }

    if (seconds !== null && seconds !== undefined) {
        shutdownTimer = setTimeout(() => {
            console.log(`Сервер остановлен по команде sd через ${seconds} секунд`);
            process.exit(0);
        }, seconds * 1000);
        
        shutdownTimer.unref(); 
        console.log(`Сервер будет остановлен через ${seconds} секунд`);
    } else {
        console.log('Остановка сервера отменена');
    }
}

function scheduleCommit(seconds) {
    if (commitInterval) {
        clearInterval(commitInterval);
        commitInterval = null;
        console.log('Периодическая фиксация БД остановлена');
    }

    if (seconds !== null && seconds !== undefined) {
        commitInterval = setInterval(() => {
            db.commit().then(result => {
                console.log(`Автоматическая фиксация БД выполнена: ${result.commitCount}`);
            }).catch(err => {
                console.error('Ошибка при автоматической фиксации:', err);
            });
        }, seconds * 1000);
        
        commitInterval.unref(); 
        console.log(`Периодическая фиксация БД запущена с интервалом ${seconds} секунд`);
    }
}

function scheduleStatistics(seconds) {
    if (statsTimer) {
        clearTimeout(statsTimer);
        statsTimer = null;
        statistics.isActive = false;
        statistics.endTime = new Date().toISOString();
        console.log('Сбор статистики остановлен');
    }

    if (seconds !== null && seconds !== undefined) {
        statistics.startTime = new Date().toISOString();
        statistics.endTime = null;
        statistics.requestCount = 0;
        statistics.commitCount = 0;
        statistics.isActive = true;

        statsTimer = setTimeout(() => {
            statistics.isActive = false;
            statistics.endTime = new Date().toISOString();
            statsTimer = null;
            console.log(`Сбор статистики завершен через ${seconds} секунд`);
            console.log('Результаты статистики:', JSON.stringify(statistics, null, 2));
        }, seconds * 1000);
        
        statsTimer.unref(); 
        console.log(`Сбор статистики запущен на ${seconds} секунд`);
    }
}

process.stdin.setEncoding('utf8');
process.stdin.on('data', (data) => {
    const input = data.toString().trim();
    const parts = input.split(' ');
    const command = parts[0];
    const parameter = parts[1] ? parseInt(parts[1]) : undefined;

    switch (command) {
        case 'sd':
            scheduleShutdown(parameter);
            break;
        case 'sc':
            scheduleCommit(parameter);
            break;
        case 'ss':
            scheduleStatistics(parameter);
            break;
        default:
            console.log('Неизвестная команда. Доступные команды: sd, sc, ss');
    }
});

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
    } else if (parsedUrl.pathname === '/api/ss' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(statistics));
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "Неверный путь запроса" }));
    }
});

const PORT = 5000;
server.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log('API доступно по адресу: http://localhost:5000/api/db');
    console.log('Статистика доступна по адресу: http://localhost:5000/api/ss');
    console.log('\nДоступные команды:');
    console.log('sd x  - остановить сервер через x секунд');
    console.log('sc x  - запустить периодическую фиксацию БД каждые x секунд');
    console.log('ss x  - запустить сбор статистики на x секунд');
    console.log('(ввод команды без параметра отменяет действие)');
});
process.on('SIGINT', () => {
    console.log('\nПолучен сигнал SIGINT. Остановка сервера...');
    server.close(() => {
        console.log('Сервер остановлен');
        process.exit(0);
    });
});