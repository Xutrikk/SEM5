#define _WINSOCK_DEPRECATED_NO_WARNINGS
#include <winsock2.h>
#include <ws2tcpip.h>
#pragma comment(lib, "ws2_32.lib")

#include <iostream>
#include <string>
#include <vector>
#include <map>
#include <tchar.h>    

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

struct ServerInfo {
    string ip;
    unsigned short port;

    bool operator<(const ServerInfo& other) const {
        if (ip == other.ip) return port < other.port;
        return ip < other.ip;
    }
};

bool GetServer(
    char* call,           // [in] позывной сервера
    short port,           // [in] номер порта сервера
    struct sockaddr* from, // [out] указатель на SOCKADDR_IN
    int* flen             // [out] указатель на размер from
) {
    SOCKET broadcastSocket = INVALID_SOCKET;

    try {
        if ((broadcastSocket = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP)) == INVALID_SOCKET) {
            throw SetErrorMsgText("socket:", WSAGetLastError());
        }

        int broadcastEnable = 1;
        if (setsockopt(broadcastSocket, SOL_SOCKET, SO_BROADCAST,
            (char*)&broadcastEnable, sizeof(broadcastEnable)) == SOCKET_ERROR) {
            throw SetErrorMsgText("setsockopt (BROADCAST):", WSAGetLastError());
        }

        int timeout = 3000;
        if (setsockopt(broadcastSocket, SOL_SOCKET, SO_RCVTIMEO,
            (char*)&timeout, sizeof(timeout)) == SOCKET_ERROR) {
            throw SetErrorMsgText("setsockopt (TIMEOUT):", WSAGetLastError());
        }

        SOCKADDR_IN clientAddr;
        clientAddr.sin_family = AF_INET;
        clientAddr.sin_port = htons(0);
        clientAddr.sin_addr.s_addr = INADDR_ANY;

        if (bind(broadcastSocket, (LPSOCKADDR)&clientAddr, sizeof(clientAddr)) == SOCKET_ERROR) {
            throw SetErrorMsgText("bind:", WSAGetLastError());
        }

        SOCKADDR_IN broadcastAddr;
        broadcastAddr.sin_family = AF_INET;
        broadcastAddr.sin_port = htons(port);
        broadcastAddr.sin_addr.s_addr = inet_addr("10.54.54.255");

        cout << "Отправка широковещательного запроса с позывным: " << call << endl;
        cout << "Порт сервера: " << port << endl;

        if (sendto(broadcastSocket, call, strlen(call) + 1, 0,
            (sockaddr*)&broadcastAddr, sizeof(broadcastAddr)) == SOCKET_ERROR) {
            throw SetErrorMsgText("sendto (broadcast):", WSAGetLastError());
        }

        cout << "Широковещательный запрос отправлен. Ожидание ответов..." << endl;

        map<ServerInfo, bool> servers;
        ServerInfo firstServer;
        bool firstServerFound = false;

        while (true) {
            char response[100];
            SOCKADDR_IN serverAddr;
            int serverAddrLen = sizeof(serverAddr);

            int responseLen = recvfrom(broadcastSocket, response, sizeof(response) - 1, 0,
                (sockaddr*)&serverAddr, &serverAddrLen);

            if (responseLen == SOCKET_ERROR) {
                int errorCode = WSAGetLastError();
                if (errorCode == WSAETIMEDOUT) {
                    break;
                }
                else {
                    throw SetErrorMsgText("recvfrom:", errorCode);
                }
            }

            response[responseLen] = '\0';

            if (strcmp(response, call) == 0) {
                char serverIP[INET_ADDRSTRLEN];
                inet_ntop(AF_INET, &(serverAddr.sin_addr), serverIP, INET_ADDRSTRLEN);
                unsigned short serverPort = ntohs(serverAddr.sin_port);

                ServerInfo server;
                server.ip = serverIP;
                server.port = serverPort;

                servers[server] = true;

                if (!firstServerFound) {
                    firstServer = server;
                    firstServerFound = true;


                    memcpy(from, &serverAddr, serverAddrLen);
                    *flen = serverAddrLen;
                }

                cout << "Обнаружен сервер: " << serverIP << ":" << serverPort << endl;
            }
            else {
                char serverIP[INET_ADDRSTRLEN];
                inet_ntop(AF_INET, &(serverAddr.sin_addr), serverIP, INET_ADDRSTRLEN);
                cout << "Получен неправильный ответ от " << serverIP << ": \"" << response << "\"" << endl;
            }
        }

        if (servers.empty()) {
            cout << "Серверы с позывным \"" << call << "\" не найдены в сети." << endl;
            closesocket(broadcastSocket);
            return false;
        }
        else {
            cout << "\n=== РЕЗУЛЬТАТЫ ПОИСКА СЕРВЕРОВ ===" << endl;
            cout << "Найдено серверов с позывным \"" << call << "\": " << servers.size() << endl;

            int count = 1;
            for (const auto& serverPair : servers) {
                const ServerInfo& server = serverPair.first;
                cout << count << ". " << server.ip << ":" << server.port << endl;
                count++;
            }

            if (servers.size() > 1) {
                cout << "\nВНИМАНИЕ: В сети обнаружено несколько серверов с одинаковым позывным!" << endl;
                cout << "Будет использован первый обнаруженный сервер: " << firstServer.ip << ":" << firstServer.port << endl;
            }
            else {
                cout << "\nОбнаружен один сервер. Установка соединения..." << endl;
            }

            closesocket(broadcastSocket);
            return true;
        }
    }
    catch (string errorMsgText) {
        if (broadcastSocket != INVALID_SOCKET) {
            closesocket(broadcastSocket);
        }
        throw errorMsgText;
    }
}

int main(int argc, _TCHAR* argv[]) {
    setlocale(LC_ALL, "Russian");
    SOCKET cC;
    WSADATA wsaData;

    try {
        int n;
        cout << "Введите количество сообщений для отправки: ";
        cin >> n;
        cin.ignore();

        if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
            throw SetErrorMsgText("WSAStartup:", WSAGetLastError());
        }

        SOCKADDR_IN serv;
        int servLen = sizeof(serv);
        char server_call[] = "Hello";

        cout << "Поиск серверов в локальной сети..." << endl;

        if (!GetServer(server_call, 2000, (sockaddr*)&serv, &servLen)) {
            cout << "Сервер не найден. Завершение работы." << endl;
            WSACleanup();
            cout << "Нажмите Enter для выхода...";
            cin.get();
            return 0;
        }

        char serverIP[INET_ADDRSTRLEN];
        inet_ntop(AF_INET, &(serv.sin_addr), serverIP, INET_ADDRSTRLEN);
        unsigned short serverPort = ntohs(serv.sin_port);
        cout << "\nУстановка соединения с сервером: " << serverIP << ":" << serverPort << endl;

        if ((cC = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP)) == INVALID_SOCKET)
            throw SetErrorMsgText("socket:", WSAGetLastError());

        cout << "UDP клиент готов к отправке данных!" << endl;

        if (sendto(cC, (char*)&n, sizeof(n), 0, (sockaddr*)&serv, sizeof(serv)) == SOCKET_ERROR)
            throw SetErrorMsgText("sendto (n):", WSAGetLastError());

        for (int i = 1; i <= n; i++) {
            char message[100];
            sprintf_s(message, "Сообщение %d от клиента", i);
            if (sendto(cC, message, strlen(message) + 1, 0, (sockaddr*)&serv, sizeof(serv)) == SOCKET_ERROR)
                throw SetErrorMsgText("sendto:", WSAGetLastError());
            cout << "Отправлено сообщение " << i << endl;
        }

        struct timeval tv;
        tv.tv_sec = 10;
        tv.tv_usec = 0;
        setsockopt(cC, SOL_SOCKET, SO_RCVTIMEO, (char*)&tv, sizeof(tv));


        for (int i = 1; i <= n; i++) {
            char response[100];
            int currentServLen = sizeof(serv);
            int bytesReceived = recvfrom(cC, response, sizeof(response) - 1, 0,
                (sockaddr*)&serv, &currentServLen);
            if (bytesReceived == SOCKET_ERROR) {
                if (WSAGetLastError() == WSAETIMEDOUT) {
                    cout << "Таймаут при приеме ответа " << i << endl;
                    break;
                }
                throw SetErrorMsgText("recvfrom:", WSAGetLastError());
            }
            response[bytesReceived] = '\0';
            cout << "Получен ответ от сервера: " << response << endl;
        }

        closesocket(cC);
        WSACleanup();
        cout << "Клиент завершил работу." << endl;
    }
    catch (string errorMsgText) {
        cout << endl << "Ошибка: " << errorMsgText << endl;
        if (cC != INVALID_SOCKET) closesocket(cC);
        WSACleanup();
    }

    cout << "Нажмите Enter для выхода...";
    cin.get();
    return 0;
}
