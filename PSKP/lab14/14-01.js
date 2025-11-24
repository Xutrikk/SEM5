let http = require('http');
let { Service } = require('./service');
let service = new Service();
let { DB } = require('./database');
let database = new DB();

// Главное — сделай обработчик асинхронным!
http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parts = req.url.split('/').filter(Boolean); 
    const path = '/' + (parts.slice(0, 2).join('/') || ''); 
    const code = parts[2] ? decodeURIComponent(parts[2]) : null; 

    try {
        if (req.method === 'GET' && req.url === '/') {
            service.getFile(req, res);
            return;
        }

        if (req.method === 'GET') {
            if (path === '/api/faculties') service.getHandler(req, res, database.getFaculties);
            else if (path === '/api/pulpits') service.getHandler(req, res, database.getPulpits);
            else if (path === '/api/subjects') service.getHandler(req, res, database.getSubjects);
            else if (path === '/api/auditoriumstypes') service.getHandler(req, res, database.getAuditoriumstypes);
            else if (path === '/api/auditorims') service.getHandler(req, res, database.getAuditoriums);
            else throw { status: 404, message: 'Not found' };
            return;
        }

        if (req.method === 'POST') {
            if (path === '/api/faculties') service.facultyHandler(req, res, database.insertFaculty);
            else if (path === '/api/pulpits') service.pulpitHandler(req, res, database.insertPulpit);
            else if (path === '/api/subjects') service.subjectHandler(req, res, database.insertSubject);
            else if (path === '/api/auditoriumstypes') service.auditoriumtypeHandler(req, res, database.insertAuditoriumtype);
            else if (path === '/api/auditorims') service.auditoriumHandler(req, res, database.insertAuditorium);
            else throw { status: 404, message: 'Not found' };
            return;
        }

        if (req.method === 'PUT') {
            if (path === '/api/faculties') service.facultyHandler(req, res, database.updateFaculty);
            else if (path === '/api/pulpits') service.pulpitHandler(req, res, database.updatePulpit);
            else if (path === '/api/subjects') service.subjectHandler(req, res, database.updateSubject);
            else if (path === '/api/auditoriumstypes') service.auditoriumtypeHandler(req, res, database.updateAuditoriumtype);
            else if (path === '/api/auditorims') service.auditoriumHandler(req, res, database.updateAuditorium);
            else throw { status: 404, message: 'Not found' };
            return;
        }

        if (req.method === 'DELETE' && path.startsWith('/api/')) {
            if (!code) {
                service.errorHandler(res, 400, 'Код не указан в URL');
                return;
            }

            let result;
            if (path === '/api/faculties') result = await database.deleteFaculty(code);
            else if (path === '/api/pulpits') result = await database.deletePulpit(code);
            else if (path === '/api/subjects') result = await database.deleteSubject(code);
            else if (path === '/api/auditoriumstypes') result = await database.deleteAuditoriumtype(code);
            else if (path === '/api/auditorims') result = await database.deleteAuditorium(code);
            else {
                service.errorHandler(res, 404, 'Неизвестный путь');
                return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ deleted: code }));
            return;
        }

        service.errorHandler(res, 404, 'Not found');

    } catch (err) {
        const status = err.status || 500;
        const message = err.message || 'Internal Server Error';
        service.errorHandler(res, status, message);
    }
}).listen(3000, () => {
    console.log('Сервер запущен: http://localhost:3000');
});