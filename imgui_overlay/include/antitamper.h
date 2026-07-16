#pragma once

#include <windows.h>
#include <tlhelp32.h>
#include <atomic>
#include <cstdint>
#include <cstring>
#include <cstdio>
#include <cwctype>
#include <iterator>
#include <string>
#include <thread>

namespace AntiTamper {
inline std::atomic<bool> running{false};
inline std::atomic<bool> tampered{false};
inline std::thread monitor;
inline const std::uint8_t* textStart = nullptr;
inline std::size_t textSize = 0;
inline std::uint32_t textCrc = 0;

inline std::uint32_t Crc32(const void* data, std::size_t length) {
    const auto* bytes = static_cast<const std::uint8_t*>(data);
    std::uint32_t crc = 0xffffffffu;
    for (std::size_t i = 0; i < length; ++i) {
        crc ^= bytes[i];
        for (int bit = 0; bit < 8; ++bit)
            crc = (crc >> 1) ^ (0xedb88320u & (0u - (crc & 1u)));
    }
    return ~crc;
}

inline bool RecordTextSection() {
    const auto module = reinterpret_cast<const std::uint8_t*>(GetModuleHandleW(nullptr));
    if (!module) return false;
    const auto* dos = reinterpret_cast<const IMAGE_DOS_HEADER*>(module);
    if (dos->e_magic != IMAGE_DOS_SIGNATURE) return false;
    const auto* nt = reinterpret_cast<const IMAGE_NT_HEADERS*>(module + dos->e_lfanew);
    if (nt->Signature != IMAGE_NT_SIGNATURE) return false;
    const auto* section = IMAGE_FIRST_SECTION(nt);
    for (WORD i = 0; i < nt->FileHeader.NumberOfSections; ++i, ++section) {
        if (std::memcmp(section->Name, ".text", 5) == 0) {
            textStart = module + section->VirtualAddress;
            textSize = section->Misc.VirtualSize;
            textCrc = Crc32(textStart, textSize);
            return textSize != 0;
        }
    }
    return false;
}

inline bool DebuggerPresent() {
    if (IsDebuggerPresent()) return true;
    BOOL remote = FALSE;
    return CheckRemoteDebuggerPresent(GetCurrentProcess(), &remote) && remote;
}

inline bool SuspiciousProcessPresent() {
    static const wchar_t* blocked[] = {
        L"x64dbg.exe", L"x32dbg.exe", L"ollydbg.exe", L"windbg.exe",
        L"ida.exe", L"ida64.exe", L"idag.exe", L"idag64.exe",
        L"radare2.exe", L"gdb.exe", L"cheatengine.exe",
        L"cheatengine-x86_64.exe", L"cheatengine-i386.exe",
        L"processhacker.exe", L"processhacker64.exe",
        L"extremeinjector.exe", L"minjector.exe", L"dllinjector.exe",
        L"ghinject.exe", L"fiddler.exe", L"charles.exe",
        L"mitmproxy.exe", L"mitmweb.exe", L"mitmdump.exe",
        L"wireshark.exe", L"tshark.exe", L"burpsuite.exe",
        L"httpdebuggerpro.exe", L"scanmem.exe", L"gameconqueror.exe"
    };
    HANDLE snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (snapshot == INVALID_HANDLE_VALUE) return false;
    PROCESSENTRY32W entry{};
    entry.dwSize = sizeof(entry);
    bool found = false;
    if (Process32FirstW(snapshot, &entry)) {
        do {
            if (entry.th32ProcessID == GetCurrentProcessId()) continue;
            for (const auto* name : blocked) {
                if (_wcsicmp(entry.szExeFile, name) == 0) {
                    found = true;
                    break;
                }
            }
        } while (!found && Process32NextW(snapshot, &entry));
    }
    CloseHandle(snapshot);
    return found;
}

inline bool SuspiciousModulePresent() {
    static const wchar_t* blocked[] = {
        L"frida-agent.dll", L"frida-gadget.dll", L"frida.dll",
        L"sbiedll.dll", L"cmdvrt32.dll", L"cmdvrt64.dll", L"sxin.dll",
        L"cuckoomon.dll", L"pstorec.dll", L"vmcheck.dll", L"wpespy.dll"
    };
    HANDLE snapshot = CreateToolhelp32Snapshot(
        TH32CS_SNAPMODULE | TH32CS_SNAPMODULE32, GetCurrentProcessId());
    if (snapshot == INVALID_HANDLE_VALUE) return false;
    MODULEENTRY32W entry{};
    entry.dwSize = sizeof(entry);
    bool found = false;
    if (Module32FirstW(snapshot, &entry)) {
        do {
            for (const auto* name : blocked) {
                if (_wcsicmp(entry.szModule, name) == 0) {
                    found = true;
                    break;
                }
            }
        } while (!found && Module32NextW(snapshot, &entry));
    }
    CloseHandle(snapshot);
    return found;
}

inline bool SuspiciousThreadPresent() {
    using NtQueryInformationThreadFn =
        LONG (NTAPI*)(HANDLE, ULONG, PVOID, ULONG, PULONG);
    const auto query = reinterpret_cast<NtQueryInformationThreadFn>(
        GetProcAddress(GetModuleHandleW(L"ntdll.dll"), "NtQueryInformationThread"));
    if (!query) return false;
    HANDLE snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPTHREAD, 0);
    if (snapshot == INVALID_HANDLE_VALUE) return false;
    THREADENTRY32 entry{};
    entry.dwSize = sizeof(entry);
    bool found = false;
    if (Thread32First(snapshot, &entry)) {
        do {
            if (entry.th32OwnerProcessID != GetCurrentProcessId()) continue;
            HANDLE thread = OpenThread(THREAD_QUERY_INFORMATION, FALSE,
                entry.th32ThreadID);
            if (!thread) continue;
            void* start = nullptr;
            if (query(thread, 9, &start, sizeof(start), nullptr) == 0 && start) {
                MEMORY_BASIC_INFORMATION memory{};
                if (VirtualQuery(start, &memory, sizeof(memory))) {
                    const DWORD protection = memory.Protect & 0xffu;
                    const bool executable =
                        protection == PAGE_EXECUTE ||
                        protection == PAGE_EXECUTE_READ ||
                        protection == PAGE_EXECUTE_READWRITE ||
                        protection == PAGE_EXECUTE_WRITECOPY;
                    found = executable && memory.Type != MEM_IMAGE;
                }
            }
            CloseHandle(thread);
        } while (!found && Thread32Next(snapshot, &entry));
    }
    CloseHandle(snapshot);
    return found;
}

inline bool CriticalApiHooked() {
    struct Target { const wchar_t* module; const char* function; };
    static const Target targets[] = {
        {L"kernel32.dll", "VirtualAllocEx"},
        {L"kernel32.dll", "WriteProcessMemory"},
        {L"kernel32.dll", "CreateRemoteThread"},
        {L"kernel32.dll", "LoadLibraryW"},
        {L"kernel32.dll", "LoadLibraryA"}
    };
    for (const auto& target : targets) {
        const auto proc = reinterpret_cast<const std::uint8_t*>(
            GetProcAddress(GetModuleHandleW(target.module), target.function));
        if (!proc) continue;
        if (proc[0] == 0xe9 || proc[0] == 0xea || proc[0] == 0xc3 ||
            (proc[0] == 0x48 && proc[1] == 0xb8 && proc[10] == 0xff &&
             proc[11] == 0xe0))
            return true;
    }
    return false;
}

inline bool LocalProxyConfigured() {
    HKEY key = nullptr;
    if (RegOpenKeyExW(HKEY_CURRENT_USER,
        L"Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings",
        0, KEY_READ, &key) != ERROR_SUCCESS) return false;
    DWORD enabled = 0;
    DWORD enabledSize = sizeof(enabled);
    RegQueryValueExW(key, L"ProxyEnable", nullptr, nullptr,
        reinterpret_cast<BYTE*>(&enabled), &enabledSize);
    wchar_t server[2048] = {};
    DWORD serverSize = sizeof(server);
    const bool haveServer = enabled &&
        RegQueryValueExW(key, L"ProxyServer", nullptr, nullptr,
            reinterpret_cast<BYTE*>(server), &serverSize) == ERROR_SUCCESS;
    RegCloseKey(key);
    if (!haveServer) return false;
    std::wstring value(server);
    for (auto& c : value) c = static_cast<wchar_t>(towlower(c));
    return value.find(L"127.0.0.1") != std::wstring::npos ||
        value.find(L"localhost") != std::wstring::npos;
}

inline bool TextSectionChanged() {
    if (!textStart || !textSize) return true;
    MEMORY_BASIC_INFORMATION memory{};
    if (!VirtualQuery(textStart, &memory, sizeof(memory))) return true;
    const DWORD protection = memory.Protect & 0xffu;
    if (protection == PAGE_EXECUTE_READWRITE ||
        protection == PAGE_EXECUTE_WRITECOPY) return true;
    return Crc32(textStart, textSize) != textCrc;
}

inline bool FullIntegrityCheck() {
    const char* reason = nullptr;
    if (DebuggerPresent()) reason = "debugger";
    else if (SuspiciousProcessPresent()) reason = "analysis process";
    else if (SuspiciousModulePresent()) reason = "injected module";
    else if (SuspiciousThreadPresent()) reason = "non-image executable thread";
    else if (CriticalApiHooked()) reason = "critical API hook";
    else if (TextSectionChanged()) reason = "code section modification";
    else if (LocalProxyConfigured()) reason = "local interception proxy";
    if (!reason) return true;
    std::fprintf(stderr, "[antitamper] detected: %s\n", reason);
    tampered.store(true, std::memory_order_release);
    return false;
}

inline void Monitor() {
    while (running.load(std::memory_order_acquire)) {
        if (!FullIntegrityCheck()) {
            running.store(false, std::memory_order_release);
            return;
        }
        Sleep(1000);
    }
}

inline bool Initialize() {
    tampered.store(false, std::memory_order_release);
    if (!RecordTextSection() || !FullIntegrityCheck()) return false;
    running.store(true, std::memory_order_release);
    monitor = std::thread(Monitor);
    return true;
}

inline void Shutdown() {
    running.store(false, std::memory_order_release);
    if (monitor.joinable()) monitor.join();
}
}
