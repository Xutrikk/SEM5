#define _WINSOCK_DEPRECATED_NO_WARNINGS
#include <winsock2.h>
#include <ws2tcpip.h>
#pragma comment(lib, "ws2_32.lib")

#include <iostream>
#include <string>
#include <tchar.h>              
#include <time.h> 

using namespace std;

string GetErrorMsgText(int code) {
    string msgText;
    switch (code) {
    case WSAETIMEDOUT: msgText = "WSAETIMEDOUT - Таймаут истек"; break;
    default: msgText = "***ERROR*** - Неизвестная ошибка"; break;
    };
    return msgText;
}

string SetErrorMsgText(string msgText, int code) {
    return msgText + GetErrorMsgText(code);
}

bool GetRequestFromClient(
    SOCKET s,              // [in] сокет
    const char* name,            // [in] позывной сервера
    short port,            // [in] номер просушиваемого порта
    struct sockaddr* from, // [out] указатель на SOCKADDR_IN
    int* flen              // [out] указатель на размер from
) {
    try {
        int timeout = 5000;
        if (setsockopt(s, SOL_SOCKET, SO_RCVTIMEO, (char*)&timeout, sizeof(timeout)) == SOCKET_ERROR) {
            throw SetErrorMsgText("setsockopt:", WSAGetLastError());
        }

        std::cout << "Сервер ожидает позывной \"" << name << "\" на порту " << port << "..." << endl;

        while (true) {
            char ibuf[100];
            int libuf = recvfrom(s, ibuf, sizeof(ibuf) - 1, 0, from, flen);

            if (libuf == SOCKET_ERROR) {
                int errorCode = WSAGetLastError();
                if (errorCode == WSAETIMEDOUT) {
                    return false;
                }
                else {
                    throw SetErrorMsgText("recvfrom:", errorCode);
                }
            }

            ibuf[libuf] = '\0';

            if (strcmp(ibuf, name) == 0) {
                char clientIP[INET_ADDRSTRLEN];
                SOCKADDR_IN* clientAddr = (SOCKADDR_IN*)from;
                inet_ntop(AF_INET, &(clientAddr->sin_addr), clientIP, INET_ADDRSTRLEN);
                unsigned short clientPort = ntohs(clientAddr->sin_port);

                std::cout << "Получен правильный позывной от клиента!" << endl;
                std::cout << "IP-адрес клиента: " << clientIP << endl;
                std::cout << "Порт клиента: " << clientPort << endl;

                return true;
            }
            else {
                std::cout << "Получен неправильный позывной: \"" << ibuf << "\" - игнорируем..." << endl;
            }
        }
    }
    catch (string errorMsgText) {
        throw errorMsgText;
    }
}

bool PutAnswerToClient(
    SOCKET s,              // [in] сокет
    const char* name,            // [in] позывной сервера
    struct sockaddr* to,   // [in] указатель на SOCKADDR_IN
    int* lto               // [in] указатель на размер from
) {
    try {
        if (sendto(s, name, strlen(name) + 1, 0, to, *lto) == SOCKET_ERROR) {
            return false;
        }

        char clientIP[INET_ADDRSTRLEN];
        SOCKADDR_IN* clientAddr = (SOCKADDR_IN*)to;
        inet_ntop(AF_INET, &(clientAddr->sin_addr), clientIP, INET_ADDRSTRLEN);
        unsigned short clientPort = ntohs(clientAddr->sin_port);

        std::cout << "Отправлен ответ клиенту " << clientIP << ":" << clientPort << endl;

        return true;
    }
    catch (...) {
        return false;
    }
}

int main(int argc, _TCHAR* argv[]) {
    srand(time(NULL));
    setlocale(LC_ALL, "Russian");
    SOCKET sS;
    WSADATA wsaData;

    try {
        if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
            throw SetErrorMsgText("WSAStartup:", WSAGetLastError());
        }

        if ((sS = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP)) == INVALID_SOCKET) {
            throw SetErrorMsgText("socket:", WSAGetLastError());
        }

        SOCKADDR_IN serv;
        serv.sin_family = AF_INET;
        serv.sin_port = htons(2000);
        serv.sin_addr.s_addr = INADDR_ANY;

        if (bind(sS, (LPSOCKADDR)&serv, sizeof(serv)) == SOCKET_ERROR)
            throw SetErrorMsgText("bind:", WSAGetLastError());

        std::cout << "UDP сервер запущен и ожидает подключений на порту 2000..." << endl;


        while (true) {
            SOCKADDR_IN clnt;
            int clntLen = sizeof(clnt);

            std::cout << "\n=== Ожидание нового клиента ===" << endl;

            if (GetRequestFromClient(sS, "Hello", 2000, (sockaddr*)&clnt, &clntLen)) {
                if (PutAnswerToClient(sS, "Hello", (sockaddr*)&clnt, &clntLen)) {
                    std::cout << "Успешное подключение с клиентом установлено!" << endl;

                    int totalBytes = 0;
                    int messageCount = 0;

                    int n;
                    int bytesReceived = recvfrom(sS, (char*)&n, sizeof(n), 0,
                        (sockaddr*)&clnt, &clntLen);
                    if (bytesReceived == SOCKET_ERROR)
                        throw SetErrorMsgText("recvfrom (n):", WSAGetLastError());

                    std::cout << "Ожидается " << n << " сообщений от клиента" << endl;

                    for (int i = 1; i <= n; i++) {
                        char ibuf[100];
                        int libuf = recvfrom(sS, ibuf, sizeof(ibuf) - 1, 0,
                            (sockaddr*)&clnt, &clntLen);
                        if (libuf == SOCKET_ERROR)
                            throw SetErrorMsgText("recvfrom:", WSAGetLastError());

                        ibuf[libuf] = '\0';

                        if (rand() % 100 < 40) {
                            std::cout << "Сообщение " << i << " потеряно (имитация)" << endl;
                            continue;
                        }

                        totalBytes += libuf;
                        messageCount++;

                        std::cout << "Получено сообщение " << i << ": " << ibuf << endl;
                        std::cout << "Размер сообщения: " << libuf << " байт" << endl;

                        Sleep(2000);

                        char obuf[100];
                        sprintf_s(obuf, "Сервер принял сообщение %d (%d байт)", i, libuf);

                        if (sendto(sS, obuf, strlen(obuf) + 1, 0,
                            (sockaddr*)&clnt, sizeof(clnt)) == SOCKET_ERROR)
                            throw SetErrorMsgText("sendto:", WSAGetLastError());

                        std::cout << "Отправлено подтверждение клиенту" << endl;
                        std::cout << "----------------------------------------" << endl;
                    }

                    std::cout << "========================================" << endl;
                    std::cout << "ОБРАБОТКА ЗАВЕРШЕНА ДЛЯ КЛИЕНТА" << endl;
                    std::cout << "Всего получено сообщений: " << messageCount << endl;
                    std::cout << "Всего получено байт: " << totalBytes << endl;
                    std::cout << "Средний размер сообщения: " << (messageCount > 0 ? totalBytes / messageCount : 0) << " байт" << endl;
                }
                else {
                    std::cout << "Ошибка при отправке ответа клиенту" << endl;
                }
            }
            else {
                std::cout << "Таймаут ожидания запроса от клиента" << endl;
            }
        }
        closesocket(sS);
        WSACleanup();
        std::cout << "Сервер завершил работу." << endl;
    }
    catch (string errorMsgText) {
        std::cout << endl << "Ошибка: " << errorMsgText << endl;
        if (sS != INVALID_SOCKET) closesocket(sS);
        WSACleanup();
    }

    std::cout << "Нажмите Enter для выхода...";
    cin.get();
    return 0;
}
