#include <iostream>
#include <string>
#include <winsock2.h>
#pragma comment(lib, "WS2_32.lib")

using namespace std;

// ===== ������� ��������� ������ =====
string GetErrorMsgText(int code)
{
    switch (code)
    {
    case WSAEINTR: return "WSAEINTR: Interrupted function call";
    case WSAEACCES: return "WSAEACCES: Permission denied";
    case WSAEFAULT: return "WSAEFAULT: Bad address";
    case WSAEINVAL: return "WSAEINVAL: Invalid argument";
    case WSAEMFILE: return "WSAEMFILE: Too many open files";
    case WSAEWOULDBLOCK: return "WSAEWOULDBLOCK: Resource temporarily unavailable";
    case WSAEINPROGRESS: return "WSAEINPROGRESS: Operation now in progress";
    case WSAENOTSOCK: return "WSAENOTSOCK: Socket operation on non-socket";
    case WSAEADDRINUSE: return "WSAEADDRINUSE: Address already in use";
    case WSAEADDRNOTAVAIL: return "WSAEADDRNOTAVAIL: Cannot assign requested address";
    case WSASYSCALLFAILURE: return "WSASYSCALLFAILURE: System call failure";
    default: return "Unknown error";
    }
}

string SetErrorMsgText(string msgText, int code)
{
    return msgText + GetErrorMsgText(code);
}

// ===== �������� ��������� =====
int main()
{
    WSADATA wsaData;
    SOCKET sS = INVALID_SOCKET; // ��������� �����
    SOCKET cS = INVALID_SOCKET; // ����� �������

    try
    {
        // 1. ������������� Winsock
        if (WSAStartup(MAKEWORD(2, 0), &wsaData) != 0)
            throw SetErrorMsgText("WSAStartup: ", WSAGetLastError());

        // 2. �������� ���������� ������ (TCP)
        if ((sS = socket(AF_INET, SOCK_STREAM, 0)) == INVALID_SOCKET)
            throw SetErrorMsgText("socket: ", WSAGetLastError());

        // 3. ��������� ���������� ������ (���� 2000)
        SOCKADDR_IN serv;
        serv.sin_family = AF_INET;
        serv.sin_port = htons(2000);          // ����
        serv.sin_addr.s_addr = INADDR_ANY;    // ����� ��������� �����

        if (bind(sS, (LPSOCKADDR)&serv, sizeof(serv)) == SOCKET_ERROR)
            throw SetErrorMsgText("bind: ", WSAGetLastError());

        // 4. ������� � ����� ��������
        if (listen(sS, SOMAXCONN) == SOCKET_ERROR)
            throw SetErrorMsgText("listen: ", WSAGetLastError());

        cout << "Server is running on port 2000. Waiting for connection..." << endl;

        // 5. �������� �������
        SOCKADDR_IN client;       // ��������� ��� ���������� �������
        int clientSize = sizeof(client);

        if ((cS = accept(sS, (sockaddr*)&client, &clientSize)) == INVALID_SOCKET)
            throw SetErrorMsgText("accept: ", WSAGetLastError());

        cout << "Client connected!" << endl;

        // 6. �������� �������
        if (closesocket(cS) == SOCKET_ERROR)
            throw SetErrorMsgText("closesocket(cS): ", WSAGetLastError());
        if (closesocket(sS) == SOCKET_ERROR)
            throw SetErrorMsgText("closesocket(sS): ", WSAGetLastError());

        // 7. ���������� ������ Winsock
        if (WSACleanup() == SOCKET_ERROR)
            throw SetErrorMsgText("WSACleanup: ", WSAGetLastError());
    }
    catch (string errorMsgText)
    {
        cerr << endl << errorMsgText << endl;
    }

    return 0;
}
