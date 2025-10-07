const http = require('http');
const url = require('url');
const path = require('path');
const StaticHandler = require('./m07-01');
const staticHandler = require('./m07-01')('/static');

http.createServer((request, response) => {
    const parsedUrl = url.parse(request.url, true);
    const resourcePath = parsedUrl.pathname;

    console.log(`Request: ${request.method} ${resourcePath}`);

    if (request.method !== 'GET') {
        response.writeHead(405, { 'Content-Type': 'text/plain' });
        response.end("405: Method Not Allowed");
        return;
    }

    if (resourcePath === '/') {

        staticHandler.serveFile(request, response, { 'Content-Type': 'text/html' }, '/index.html');
    } else {

        if (staticHandler.isStatic('html', resourcePath)) staticHandler.serveFile(request, response, { 'Content-Type': 'text/html' });
        else if (staticHandler.isStatic('css', resourcePath)) staticHandler.serveFile(request, response, { 'Content-Type': 'text/css' });
        else if (staticHandler.isStatic('js', resourcePath)) staticHandler.serveFile(request, response, { 'Content-Type': 'application/javascript' });
        else if (staticHandler.isStatic('png', resourcePath)) staticHandler.serveFile(request, response, { 'Content-Type': 'image/png' });
        else if (staticHandler.isStatic('docx', resourcePath)) staticHandler.serveFile(request, response, { 'Content-Type': 'application/msword' });
        else if (staticHandler.isStatic('json', resourcePath)) staticHandler.serveFile(request, response, { 'Content-Type': 'application/json' });
        else if (staticHandler.isStatic('xml', resourcePath)) staticHandler.serveFile(request, response, { 'Content-Type': 'application/xml' });
        else if (staticHandler.isStatic('mp4', resourcePath)) staticHandler.serveFile(request, response, { 'Content-Type': 'video/mp4' });
        else staticHandler.handle404(response);
    }
}).listen(5000, () => {
    console.log("Server is running on http://localhost:5000");
});