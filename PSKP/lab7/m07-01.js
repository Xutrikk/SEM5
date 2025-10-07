const fs = require('fs');
const path = require('path');

function StaticHandler(staticRoot = '/static') {
    const staticDirectory = staticRoot;

    const resolveFilePath = (urlPath) => path.join(__dirname, staticDirectory, urlPath);

    const handle404 = (response) => {
        response.writeHead(404, { 'Content-Type': 'text/plain' });
        response.end("404: File Not Found");
    };

    const isStatic = (extension, urlPath) => {
        const fileTypeRegex = new RegExp(`^/.*\\.${extension}$`);
        return fileTypeRegex.test(urlPath);
    };

    const serveFile = (request, response, headers, overridePath = null) => {
        const filePath = resolveFilePath(overridePath ||request.url);

        fs.readFile(filePath, (error, data) => {
            if (error) {
                console.error("File error:", error);
                handle404(response);
            } else {
                response.writeHead(200, headers);
                response.end(data);
            }
        });
    };
    
    return {
        handle404,
        isStatic,
        serveFile
    };
}

module.exports = (staticRoot) => StaticHandler(staticRoot);