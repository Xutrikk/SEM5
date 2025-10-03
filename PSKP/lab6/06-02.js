const http = require('http');
const fs = require('fs');
const url = require('url');
const { parse } = require('querystring');
const sendmail = require('sendmail');
const nodemailer = require('nodemailer');

const emailConfig = {
    host: 'smtp.yandex.ru',
    port: 465,
    secure: true,
    auth: {
        user: 'khutartsou@yandex.ru',
        pass: 'uludyejwjbkgklmm'
    }
};

const sendmailTransport = sendmail(emailConfig);
const transporter = nodemailer.createTransport(emailConfig);

http.createServer((req, resp) => {
    const pathname = url.parse(req.url).pathname;
    resp.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });

    if (pathname === '/' && req.method === 'GET') {
        fs.readFile('./06-02.html', (err, data) => {
            if (err) {
                console.error('Ошибка загрузки формы:', err);
                resp.end('<h1>Ошибка загрузки формы</h1>');
            } else {
                resp.end(data);
            }
        });
    } else if (pathname === '/' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => body += chunk.toString());
        req.on('end', () => {
            const { from, to, message } = parse(body);

            console.log('Received body:', body);

            if (!from || !to || !message) {
                resp.end('<h1>Ошибка: Все поля должны быть заполнены!</h1>');
                return;
            }

            const mailOptions = {
                from: 'khutartsou@yandex.ru',
                to,
                subject: `Тестовое сообщение от ${new Date().toLocaleDateString()}`,
                text: message,
                contentType: 'text/plain; charset=utf-8',
                'mime-version': '1.0',
                date: new Date().toUTCString()
            };

            sendmailTransport(mailOptions, (err, reply) => {
                if (err) {
                    console.error('Ошибка отправки через sendmail:', err.message);
                    transporter.sendMail(mailOptions, (smtpErr, info) => {
                        if (smtpErr) {
                            console.error('Ошибка отправки через nodemailer:', smtpErr.message);
                            resp.end(`<h1>Ошибка отправки: ${smtpErr.message}</h1>`);
                        } else {
                            console.log('Сообщение успешно отправлено через nodemailer:', info.response);
                            resp.end('<h1>Сообщение успешно отправлено!</h1>');
                        }
                    });
                } else {
                    console.log('Сообщение успешно отправлено через sendmail:', reply);
                    resp.end('<h1>Сообщение успешно отправлено!</h1>');
                }
            });
        });
    } else {
        resp.end('<h1>Not supported</h1>');
    }
}).listen(3000, () => console.log('Server running at http://localhost:3000/'));