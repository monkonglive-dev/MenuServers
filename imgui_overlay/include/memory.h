#pragma once
#include <windows.h>
#include <cstdint>
#include <string>
#include <vector>
#include <tlhelp32.h>

class Memory {
public:
    Memory() : process_(nullptr), pid_(0) {}
    ~Memory() { Close(); }

    bool Attach(const char* processName) {
        HANDLE snap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
        if (snap == INVALID_HANDLE_VALUE) return false;

        PROCESSENTRY32 pe{};
        pe.dwSize = sizeof(pe);
        if (Process32First(snap, &pe)) {
            do {
                if (_stricmp(pe.szExeFile, processName) == 0) {
                    pid_ = pe.th32ProcessID;
                    process_ = OpenProcess(PROCESS_VM_READ | PROCESS_VM_WRITE | PROCESS_VM_OPERATION, FALSE, pid_);
                    CloseHandle(snap);
                    return process_ != nullptr;
                }
            } while (Process32Next(snap, &pe));
        }
        CloseHandle(snap);
        return false;
    }

    bool Attach(DWORD pid) {
        pid_ = pid;
        process_ = OpenProcess(PROCESS_VM_READ | PROCESS_VM_WRITE | PROCESS_VM_OPERATION, FALSE, pid);
        return process_ != nullptr;
    }

    void Close() {
        if (process_) { CloseHandle(process_); process_ = nullptr; }
    }

    bool IsAttached() const { return process_ != nullptr; }
    DWORD GetPID() const { return pid_; }

    template<typename T>
    T Read(uint64_t address) const {
        T value{};
        ReadProcessMemory(process_, (LPCVOID)address, &value, sizeof(T), nullptr);
        return value;
    }

    bool Write(uint64_t address, const void* data, size_t size) {
        SIZE_T written = 0;
        return WriteProcessMemory(process_, (LPVOID)address, data, size, &written) && written == size;
    }

    std::string ReadString(uint64_t address, size_t maxLen = 256) const {
        std::string result(maxLen, '\0');
        SIZE_T bytesRead = 0;
        ReadProcessMemory(process_, (LPCVOID)address, result.data(), maxLen, &bytesRead);
        result.resize(strnlen(result.data(), bytesRead));
        return result;
    }

    uint64_t ReadPointer(uint64_t address) const {
        return Read<uint64_t>(address);
    }

    uint32_t ReadU32(uint64_t address) const {
        return Read<uint32_t>(address);
    }

    float ReadFloat(uint64_t address) const {
        return Read<float>(address);
    }

    bool ReadBool(uint64_t address) const {
        return Read<uint8_t>(address) != 0;
    }

    // Get module base address
    uint64_t GetModuleBase(const char* moduleName) const {
        HANDLE snap = CreateToolhelp32Snapshot(TH32CS_SNAPMODULE | TH32CS_SNAPMODULE32, pid_);
        if (snap == INVALID_HANDLE_VALUE) return 0;

        MODULEENTRY32 me{};
        me.dwSize = sizeof(me);
        if (Module32First(snap, &me)) {
            do {
                if (_stricmp(me.szModule, moduleName) == 0) {
                    CloseHandle(snap);
                    return (uint64_t)me.modBaseAddr;
                }
            } while (Module32Next(snap, &me));
        }
        CloseHandle(snap);
        return 0;
    }

    // Pattern scan in module
    uint64_t PatternScan(uint64_t start, size_t size, const char* pattern) const {
        std::vector<uint8_t> moduleData(size);
        SIZE_T bytesRead = 0;
        if (!ReadProcessMemory(process_, (LPCVOID)start, moduleData.data(), size, &bytesRead))
            return 0;

        std::vector<int> patternBytes;
        std::vector<bool> mask;
        for (const char* p = pattern; *p; ) {
            if (*p == ' ') { p++; continue; }
            if (*p == '?') { patternBytes.push_back(0); mask.push_back(false); p += 2; continue; }
            char hex[3] = { p[0], p[1], 0 };
            patternBytes.push_back((uint8_t)strtol(hex, nullptr, 16));
            mask.push_back(true);
            p += 2;
        }

        for (size_t i = 0; i < size - patternBytes.size(); i++) {
            bool found = true;
            for (size_t j = 0; j < patternBytes.size(); j++) {
                if (mask[j] && moduleData[i + j] != patternBytes[j]) {
                    found = false;
                    break;
                }
            }
            if (found) return start + i;
        }
        return 0;
    }

private:
    HANDLE process_;
    DWORD pid_;
};

// Singleton
inline Memory& mem() {
    static Memory instance;
    return instance;
}
