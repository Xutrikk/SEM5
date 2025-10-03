    const sendMail = require('sendmail')(); 
    const nodemailer = require('nodemailer'); 

    const TO_EMAIL = 'khutartsou@yandex.ru'; 

    const transporter = nodemailer.createTransport({
        host: 'smtp.yandex.ru',
        port: 465, 
        secure: true, 
        auth: {
            user: 'khutartsou@yandex.ru', 
            pass: 'uludyejwjbkgklmm' 
        }
    });

    function send(message) {
        sendMail({
            from: 'khutartsou@yandex.ru',  
            to: TO_EMAIL,              
            subject: 'Сообщение из модуля m0603',
            text: message,              
        }, (err) => {
            if (err) {
                console.error('Ошибка отправки через sendmail:', err);

                const mailOptions = {
                    from: 'khutartsou@yandex.ru', 
                    to: TO_EMAIL,             
                    subject: 'Сообщение из модуля m0603',
                    text: message,             
                };

                transporter.sendMail(mailOptions, (smtpErr, info) => {
                    if (smtpErr) {
                        console.error('Ошибка отправки через nodemailer:', smtpErr);
                    } else {
                        console.log('Сообщение успешно отправлено через nodemailer:', info.response);
                    }
                });
            } else {
                console.log('Сообщение успешно отправлено через sendmail!');
            }
        });
    }

    module.exports = { send };
