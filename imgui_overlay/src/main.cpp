#include <windows.h>
#include <tlhelp32.h>
#include <winhttp.h>
#include <cstdint>
#include <cstdio>
#include <cmath>
#include <ctime>
#include <algorithm>
#include <cctype>
#include <cstring>
#include <filesystem>
#include <fstream>
#include <commdlg.h>
#include <string>
#include <vector>
#include <sstream>

#include "offsets.h"
#include "memory.h"
#include "game.h"
#include "pipe.h"
#include "resource.h"
#include "antitamper.h"

#include <openvr.h>

#include "imgui.h"
#include "imgui_impl_win32.h"
#include "imgui_impl_dx11.h"

#include <d3d11.h>
#include <mmsystem.h>

static vr::IVRSystem* g_vrSystem = nullptr;
static vr::IVROverlay* g_overlay = nullptr;
static vr::VROverlayHandle_t g_overlayHandle = 0;
static bool g_vrQuitRequested = false;
static bool g_vrMode = false;
static ID3D11Device* g_device = nullptr;
static ID3D11DeviceContext* g_context = nullptr;
static IDXGISwapChain* g_swapChain = nullptr;
static ID3D11Texture2D* g_overlayTexture = nullptr;
static ID3D11RenderTargetView* g_overlayRTV = nullptr;
static HWND g_mainWindow = nullptr;

// The OpenVR surface is larger than the menu so auxiliary controls can float
// outside the main panel without covering it.
static const float MENU_W = 790.0f;
static const float MENU_H = 650.0f;
static const float PANEL_X = 0.0f;
static const float PANEL_W = MENU_W;
static const float PANEL_H = MENU_H;
static int g_currentTab = 0;
static const char* g_tabs[] = { "Player", "Others", "Users", "Items", "Combat", "World", "OP V2", "Blueprints", "Settings", "Credits" };
static const int NUM_TABS = 10;

static float g_cursorX = MENU_W * 0.5f;
static float g_cursorY = MENU_H * 0.5f;
static float g_cursorDpiGain = 1.26f;
static bool g_cursorActive = false;
static float g_cursorLastHitTime = -10.0f;
static bool g_menuVisible = true;
static bool g_prevYBtn = false;
static bool g_cursorClick = false;
static bool g_prevCursorClick = false;
static float g_rightStickScroll = 0.0f;
static float g_scrollSpeed = 0.022f;
static float g_cursorSize = 0.98f;
static float g_uiRounding = 4.0f;
static int g_nodeCount = 15;
static bool g_showNodes = true;
static bool g_compactMode = false;
static float g_accentHue = 0.0f;
static float g_accentSaturation = 0.0f;
static float g_backgroundOpacity = 0.82f;
static float g_fontScale = 1.0f;
static float g_nodeSpeed = 1.0f;
static float g_spiralBrightness = 1.0f;
static bool g_showCursorBeam = true;
static bool g_justClicked = false;
static float PanelY() { return 0.0f; }
static vr::TrackedDevicePose_t g_renderPoses[vr::k_unMaxTrackedDeviceCount]{};
static bool g_renderPosesValid = false;
static float g_time = 0.0f;
static float g_dt = 0.016f;
static float g_lastTime = 0.0f;
static LARGE_INTEGER g_perfFreq;
static LARGE_INTEGER g_lastPerf;

struct Node { float x, y; float vx, vy; };
static Node g_nodes[15];
static bool g_nodesInit = false;

static vr::HmdMatrix34_t g_overlayOffset{};
static PipeServer g_pipe;
static BridgePipeReader g_bridge;
static TokenPipeReader g_tokenPipe;
static PROCESS_INFORMATION g_fridaPI = {};
static std::string g_fridaCmd;
static bool g_backendRunning = false;
static std::string g_tempBridgePath;
static std::string g_tempBackendPath;

static bool IsAnimalCompanyRunning() {
    HANDLE snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (snapshot == INVALID_HANDLE_VALUE) return false;
    PROCESSENTRY32W entry{};
    entry.dwSize = sizeof(entry);
    bool found = false;
    if (Process32FirstW(snapshot, &entry)) {
        do {
            if (_wcsicmp(entry.szExeFile, L"AnimalCompany.exe") == 0) {
                found = true;
                break;
            }
        } while (Process32NextW(snapshot, &entry));
    }
    CloseHandle(snapshot);
    return found;
}

static std::wstring GetAnimalCompanyDirectory() {
    HANDLE snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (snapshot == INVALID_HANDLE_VALUE) return L"";
    PROCESSENTRY32W entry{};
    entry.dwSize = sizeof(entry);
    std::wstring directory;
    if (Process32FirstW(snapshot, &entry)) {
        do {
            if (_wcsicmp(entry.szExeFile, L"AnimalCompany.exe") != 0) continue;
            HANDLE process = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, FALSE, entry.th32ProcessID);
            if (!process) break;
            wchar_t path[32768] = {};
            DWORD size = (DWORD)std::size(path);
            if (QueryFullProcessImageNameW(process, 0, path, &size)) {
                directory.assign(path, size);
                const size_t slash = directory.find_last_of(L"\\/");
                if (slash != std::wstring::npos) directory.resize(slash);
            }
            CloseHandle(process);
            break;
        } while (Process32NextW(snapshot, &entry));
    }
    CloseHandle(snapshot);
    return directory;
}

static std::wstring GetExecutableDirectory() {
    wchar_t path[32768] = {};
    const DWORD length = GetModuleFileNameW(nullptr, path, (DWORD)std::size(path));
    if (length == 0 || length >= std::size(path)) return L"";
    std::wstring directory(path, length);
    const size_t slash = directory.find_last_of(L"\\/");
    if (slash != std::wstring::npos) directory.resize(slash);
    return directory;
}

static bool CheckMenuStatus() {
    HINTERNET session = WinHttpOpen(L"syte.xyz-status/1.0", WINHTTP_ACCESS_TYPE_AUTOMATIC_PROXY,
        WINHTTP_NO_PROXY_NAME, WINHTTP_NO_PROXY_BYPASS, 0);
    if (!session) return false;
    WinHttpSetTimeouts(session, 4000, 4000, 4000, 4000);
    HINTERNET connection = WinHttpConnect(session, L"pastebin.com", INTERNET_DEFAULT_HTTPS_PORT, 0);
    HINTERNET request = connection ? WinHttpOpenRequest(connection, L"GET",
        L"/raw/xy9MYGQs", nullptr, WINHTTP_NO_REFERER, WINHTTP_DEFAULT_ACCEPT_TYPES,
        WINHTTP_FLAG_SECURE | WINHTTP_FLAG_REFRESH) : nullptr;
    std::string body;
    if (request && WinHttpSendRequest(request, WINHTTP_NO_ADDITIONAL_HEADERS, 0,
        WINHTTP_NO_REQUEST_DATA, 0, 0, 0) && WinHttpReceiveResponse(request, nullptr)) {
        DWORD status = 0, statusSize = sizeof(status);
        WinHttpQueryHeaders(request, WINHTTP_QUERY_STATUS_CODE | WINHTTP_QUERY_FLAG_NUMBER,
            WINHTTP_HEADER_NAME_BY_INDEX, &status, &statusSize, WINHTTP_NO_HEADER_INDEX);
        if (status == 200) {
            char buffer[128];
            DWORD read = 0;
            while (body.size() < 256 && WinHttpReadData(request, buffer, sizeof(buffer), &read) && read)
                body.append(buffer, read);
        }
    }
    if (request) WinHttpCloseHandle(request);
    if (connection) WinHttpCloseHandle(connection);
    WinHttpCloseHandle(session);
    body.erase(std::remove_if(body.begin(), body.end(),
        [](unsigned char c) { return std::isspace(c) != 0; }), body.end());
    std::transform(body.begin(), body.end(), body.begin(),
        [](unsigned char c) { return (char)std::tolower(c); });
    return body == "true";
}


static void EnsureConsole() {
    if (!GetConsoleWindow()) AllocConsole();
    FILE* stream = nullptr;
    freopen_s(&stream, "CONOUT$", "w", stdout);
    freopen_s(&stream, "CONOUT$", "w", stderr);
    SetConsoleTitleA("syte.xyz");
}

static void WaitForAnimalCompany() {
    if (IsAnimalCompanyRunning()) return;
    printf("[syte] Open Animal Company");
    fflush(stdout);
    int dots = 0;
    while (!IsAnimalCompanyRunning()) {
        printf(".");
        fflush(stdout);
        dots++;
        if (dots == 3) {
            printf("\r[syte] Open Animal Company   \r[syte] Open Animal Company");
            dots = 0;
        }
        Sleep(500);
    }
    printf("\n[syte] Animal Company detected. Loading overlay...\n");
}

static bool ExtractEmbeddedScript(int resourceId, const char* fileName, std::string& outputPath) {
    HRSRC resource = FindResourceA(nullptr, MAKEINTRESOURCEA(resourceId), RT_RCDATA);
    if (!resource) return false;
    HGLOBAL loaded = LoadResource(nullptr, resource);
    const void* data = loaded ? LockResource(loaded) : nullptr;
    const DWORD size = loaded ? SizeofResource(nullptr, resource) : 0;
    if (!data || size == 0) return false;

    char tempDir[MAX_PATH] = {};
    if (!GetTempPathA(MAX_PATH, tempDir)) return false;
    outputPath = std::string(tempDir) + "syte_" + std::to_string(GetCurrentProcessId()) + "_" + fileName;

    HANDLE file = CreateFileA(outputPath.c_str(), GENERIC_WRITE, 0, nullptr,
        CREATE_ALWAYS, FILE_ATTRIBUTE_HIDDEN | FILE_ATTRIBUTE_TEMPORARY, nullptr);
    if (file == INVALID_HANDLE_VALUE) return false;
    DWORD written = 0;
    const bool ok = WriteFile(file, data, size, &written, nullptr) && written == size;
    CloseHandle(file);
    if (!ok) {
        DeleteFileA(outputPath.c_str());
        outputPath.clear();
    }
    return ok;
}

extern IMGUI_IMPL_API LRESULT ImGui_ImplWin32_WndProcHandler(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam);

static LRESULT CALLBACK WndProc(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    if (msg == WM_CLOSE || msg == WM_DESTROY) return 0;
    if (ImGui_ImplWin32_WndProcHandler(hWnd, msg, wParam, lParam)) return 1;
    return DefWindowProcA(hWnd, msg, wParam, lParam);
}

bool InitD3D11(HWND hwnd) {
    D3D_FEATURE_LEVEL fl = D3D_FEATURE_LEVEL_11_0;
    HRESULT hr = D3D11CreateDevice(nullptr, D3D_DRIVER_TYPE_HARDWARE, nullptr, 0,
        &fl, 1, D3D11_SDK_VERSION, &g_device, nullptr, &g_context);
    if (FAILED(hr)) return false;

    DXGI_SWAP_CHAIN_DESC sd{};
    sd.BufferCount = 1;
    sd.BufferDesc.Width = (UINT)MENU_W; sd.BufferDesc.Height = (UINT)MENU_H;
    sd.BufferDesc.Format = DXGI_FORMAT_R8G8B8A8_UNORM;
    sd.BufferUsage = DXGI_USAGE_RENDER_TARGET_OUTPUT;
    sd.OutputWindow = hwnd; sd.SampleDesc.Count = 1;
    sd.Windowed = TRUE; sd.SwapEffect = DXGI_SWAP_EFFECT_DISCARD;
    if (FAILED(D3D11CreateDeviceAndSwapChain(nullptr, D3D_DRIVER_TYPE_HARDWARE, nullptr, 0,
        &fl, 1, D3D11_SDK_VERSION, &sd, &g_swapChain, nullptr, nullptr, nullptr)))
        return false;

    ID3D11Texture2D* backBuffer = nullptr;
    g_swapChain->GetBuffer(0, IID_PPV_ARGS(&backBuffer));
    if (backBuffer) {
        g_device->CreateRenderTargetView(backBuffer, nullptr, &g_overlayRTV);

        D3D11_TEXTURE2D_DESC desc{};
        backBuffer->GetDesc(&desc);
        desc.Usage = D3D11_USAGE_DEFAULT;
        desc.CPUAccessFlags = 0;
        desc.BindFlags = 0;
        g_device->CreateTexture2D(&desc, nullptr, &g_overlayTexture);

        backBuffer->Release();
    }
    return g_overlayRTV != nullptr;
}

bool InitOpenVR() {
    vr::EVRInitError err = vr::VRInitError_None;
    g_vrSystem = vr::VR_Init(&err, vr::VRApplication_Overlay);
    if (err != vr::VRInitError_None) return false;
    g_overlay = vr::VROverlay();
    return g_overlay != nullptr;
}

bool InitOverlay() {
    vr::EVROverlayError err = g_overlay->CreateOverlay("ac_syte_xyz", "syte.xyz", &g_overlayHandle);
    if (err != vr::VROverlayError_None) return false;
    g_overlay->SetOverlayWidthInMeters(g_overlayHandle, 0.42f);
    g_overlay->SetOverlayAlpha(g_overlayHandle, 0.92f);

    vr::HmdMatrix34_t offset{};
    // Rotate -60 degrees around X so overlay faces user when controller points forward
    // Then translate up and back from hand
    float angle = -60.0f * 3.14159f / 180.0f;
    float c = cosf(angle), s = sinf(angle);
    offset.m[0][0] = 1.0f; offset.m[0][1] = 0.0f; offset.m[0][2] = 0.0f; offset.m[0][3] = 0.0f;
    offset.m[1][0] = 0.0f; offset.m[1][1] = c;    offset.m[1][2] = -s;   offset.m[1][3] = 0.06f;
    offset.m[2][0] = 0.0f; offset.m[2][1] = s;    offset.m[2][2] = c;    offset.m[2][3] = -0.105f;
    g_overlayOffset = offset;
    vr::TrackedDeviceIndex_t leftHand =
        g_vrSystem->GetTrackedDeviceIndexForControllerRole(vr::TrackedControllerRole_LeftHand);
    if (leftHand == vr::k_unTrackedDeviceIndexInvalid) leftHand = 1;
    g_overlay->SetOverlayTransformTrackedDeviceRelative(g_overlayHandle, leftHand, &offset);

    vr::VROverlayIntersectionMaskPrimitive_t mask{};
    mask.m_nPrimitiveType = vr::OverlayIntersectionPrimitiveType_Rectangle;
    mask.m_Primitive.m_Rectangle.m_flTopLeftX = 0.0f;
    mask.m_Primitive.m_Rectangle.m_flTopLeftY = 0.0f;
    mask.m_Primitive.m_Rectangle.m_flWidth = 1.0f;
    mask.m_Primitive.m_Rectangle.m_flHeight = 1.0f;
    g_overlay->SetOverlayIntersectionMask(g_overlayHandle, &mask, 1);
    g_overlay->ShowOverlay(g_overlayHandle);
    return true;
}

void InitImGui(HWND hwnd) {
    ImGui::CreateContext();
    ImGuiIO& io = ImGui::GetIO();
    io.IniFilename = nullptr;
    io.DisplaySize = ImVec2(MENU_W, MENU_H);
    io.ConfigFlags |= ImGuiConfigFlags_NoMouseCursorChange;
    io.MouseDrawCursor = false;

    ImGui::StyleColorsDark();
    ImGuiStyle& s = ImGui::GetStyle();
    s.WindowRounding = 5.0f;
    s.FrameRounding = 4.0f;
    s.GrabRounding = 7.0f;
    s.TabRounding = 0.0f;
    s.PopupRounding = 5.0f;
    s.ScrollbarRounding = 4.0f;
    s.ChildRounding = 4.0f;
    s.WindowPadding = ImVec2(14, 10);
    s.FramePadding = ImVec2(10, 5);
    s.ItemSpacing = ImVec2(10, 6);
    s.ItemInnerSpacing = ImVec2(8, 3);
    s.ScrollbarSize = 10.0f;
    s.Alpha = 1.0f;
    s.WindowBorderSize = 0.0f;
    s.ChildBorderSize = 0.0f;

    ImVec4* c = s.Colors;
    c[ImGuiCol_WindowBg]         = ImVec4(0.032f, 0.032f, 0.036f, 0.94f);
    c[ImGuiCol_ChildBg]          = ImVec4(0.0f, 0.0f, 0.0f, 0.0f);
    c[ImGuiCol_PopupBg]          = ImVec4(0.055f, 0.055f, 0.062f, 0.98f);
    c[ImGuiCol_Border]           = ImVec4(0.25f, 0.25f, 0.28f, 0.80f);
    c[ImGuiCol_FrameBg]          = ImVec4(0.085f, 0.085f, 0.095f, 1.00f);
    c[ImGuiCol_FrameBgHovered]   = ImVec4(0.145f, 0.145f, 0.16f, 1.00f);
    c[ImGuiCol_FrameBgActive]    = ImVec4(0.20f, 0.20f, 0.22f, 1.00f);
    c[ImGuiCol_CheckMark]        = ImVec4(0.78f, 0.78f, 0.82f, 1.00f);
    c[ImGuiCol_SliderGrab]       = ImVec4(0.64f, 0.64f, 0.68f, 1.00f);
    c[ImGuiCol_SliderGrabActive] = ImVec4(0.84f, 0.84f, 0.88f, 1.00f);
    c[ImGuiCol_Button]           = ImVec4(0.075f, 0.075f, 0.082f, 1.00f);
    c[ImGuiCol_ButtonHovered]    = ImVec4(0.145f, 0.145f, 0.16f, 1.00f);
    c[ImGuiCol_ButtonActive]     = ImVec4(0.20f, 0.20f, 0.22f, 1.00f);
    c[ImGuiCol_Header]           = ImVec4(0.075f, 0.075f, 0.082f, 0.90f);
    c[ImGuiCol_HeaderHovered]    = ImVec4(0.135f, 0.135f, 0.15f, 0.98f);
    c[ImGuiCol_HeaderActive]     = ImVec4(0.20f, 0.20f, 0.22f, 1.00f);
    c[ImGuiCol_Separator]        = ImVec4(0.25f, 0.25f, 0.28f, 0.90f);
    c[ImGuiCol_Text]             = ImVec4(0.86f, 0.86f, 0.89f, 1.00f);
    c[ImGuiCol_TextDisabled]     = ImVec4(0.48f, 0.48f, 0.52f, 1.00f);
    c[ImGuiCol_Tab]              = ImVec4(0.0f, 0.0f, 0.0f, 0.0f);
    c[ImGuiCol_TabHovered]       = ImVec4(0.141f, 0.086f, 0.212f, 0.75f);
    c[ImGuiCol_TabActive]        = ImVec4(0.0f, 0.0f, 0.0f, 0.0f);
    c[ImGuiCol_ScrollbarBg]      = ImVec4(0, 0, 0, 0);
    c[ImGuiCol_ScrollbarGrab]    = ImVec4(0, 0, 0, 0);

    ImGui_ImplWin32_Init(hwnd);
    ImGui_ImplDX11_Init(g_device, g_context);
    SetWindowLongPtrA(hwnd, GWLP_WNDPROC, (LONG_PTR)WndProc);
}

static void WaitForSteamVRFrame() {
    g_renderPosesValid = g_vrSystem != nullptr;
    // Raw current pose with a zero-second horizon. No prediction,
    // interpolation, averaging, or buffered cursor frames.
    constexpr float prediction = 0.0f;
    if (g_vrSystem) g_vrSystem->GetDeviceToAbsoluteTrackingPose(
        vr::TrackingUniverseSeated, prediction,
        g_renderPoses, vr::k_unMaxTrackedDeviceCount);
}

static void PollVRHand() {
    g_prevCursorClick = g_cursorClick;
    g_justClicked = false;
    g_rightStickScroll = 0.0f;

    if (!g_vrSystem) return;

    auto& mod = GetModState();

    vr::TrackedDevicePose_t rightPose{};
    // Drain overlay events, but do not use the queued MouseMove coordinates:
    // direct controller/overlay intersection below is newer and avoids a frame
    // of runtime event latency.
    if (g_overlay) {
        vr::VREvent_t event{};
        while (g_overlay->PollNextOverlayEvent(g_overlayHandle, &event, sizeof(event))) {
            if (event.eventType == vr::VREvent_Quit) {
                g_vrQuitRequested = true;
                if (g_vrSystem) g_vrSystem->AcknowledgeQuit_Exiting();
                break;
            }
        }
    }

    vr::TrackedDeviceIndex_t rightHand = g_vrSystem->GetTrackedDeviceIndexForControllerRole(vr::TrackedControllerRole_RightHand);
    if (rightHand != vr::k_unTrackedDeviceIndexInvalid) {
        vr::VRControllerState_t rcState2{};
        if (g_vrSystem->GetControllerState(rightHand, &rcState2, sizeof(rcState2))) {
            if (g_renderPosesValid) rightPose = g_renderPoses[rightHand];
            bool triggerPressed = rcState2.rAxis[1].x > 0.35f;
            bool gripButton = (rcState2.ulButtonPressed & (1ULL << 2)) != 0;
            bool gripAxis = rcState2.rAxis[2].x > 0.5f;
            bool gripPressed = gripButton || gripAxis;

            static int grabLog = 0;
            if ((rcState2.ulButtonPressed != 0 || rcState2.rAxis[2].x > 0.01f) && grabLog++ % 120 == 0) {
                printf("[syte] Ctrl: pressed=0x%llX axis2=%.2f grip=%d trig=%.2f\n",
                    rcState2.ulButtonPressed, rcState2.rAxis[2].x, gripPressed, rcState2.rAxis[1].x);
            }
            
            bool newClick = triggerPressed;
            g_justClicked = newClick && !g_cursorClick;
            g_cursorClick = newClick;
            // OpenVR maps the primary thumbstick to axis 0. Feed it straight
            // to ImGui each frame; a small deadzone prevents controller drift.
            const float stickY = rcState2.rAxis[0].y;
            if (fabsf(stickY) > 0.14f)
                g_rightStickScroll = stickY * fabsf(stickY) * g_scrollSpeed;
            
            mod.rightGrab = gripPressed;
            mod.rightTrigger = triggerPressed;
        }
    }

    if (rightHand != vr::k_unTrackedDeviceIndexInvalid && !rightPose.bPoseIsValid) {
        vr::TrackedDevicePose_t poses[vr::k_unMaxTrackedDeviceCount]{};
        g_vrSystem->GetDeviceToAbsoluteTrackingPose(
            vr::TrackingUniverseSeated, 0.0f, poses, vr::k_unMaxTrackedDeviceCount);
        rightPose = poses[rightHand];
    }

    vr::TrackedDeviceIndex_t leftHand = g_vrSystem->GetTrackedDeviceIndexForControllerRole(vr::TrackedControllerRole_LeftHand);
    if (leftHand != vr::k_unTrackedDeviceIndexInvalid) {
        static vr::TrackedDeviceIndex_t attachedHand = vr::k_unTrackedDeviceIndexInvalid;
        if (g_overlay && attachedHand != leftHand) {
            g_overlay->SetOverlayTransformTrackedDeviceRelative(
                g_overlayHandle, leftHand, &g_overlayOffset);
            attachedHand = leftHand;
        }
        vr::VRControllerState_t rcState1{};
        if (g_vrSystem->GetControllerState(leftHand, &rcState1, sizeof(rcState1))) {
            mod.leftGrab = (rcState1.ulButtonPressed & (1ULL << 2)) != 0 || rcState1.rAxis[2].x > 0.5f;
            mod.leftTrigger = rcState1.rAxis[1].x > 0.5f;
            bool yBtn = (rcState1.ulButtonPressed & (1ULL << 1)) != 0;
            if (yBtn && !g_prevYBtn) g_menuVisible = !g_menuVisible;
            g_prevYBtn = yBtn;
        }
    }

    g_cursorActive = false;

    if (g_overlay && rightPose.bPoseIsValid) {
        vr::HmdMatrix34_t& m = rightPose.mDeviceToAbsoluteTracking;
        vr::VROverlayIntersectionResults_t iResults{};
        vr::VROverlayIntersectionParams_t iParams{};
        iParams.eOrigin = vr::TrackingUniverseSeated;
        iParams.vSource = { m.m[0][3], m.m[1][3], m.m[2][3] };
        iParams.vDirection = { -m.m[0][2], -m.m[1][2], -m.m[2][2] };

        if (g_overlay->ComputeOverlayIntersection(g_overlayHandle, &iParams, &iResults)) {
            float nx = iResults.vUVs.v[0] * MENU_W;
            float ny = (1.0f - iResults.vUVs.v[1]) * MENU_H;
            nx = MENU_W * 0.5f + (nx - MENU_W * 0.5f) * g_cursorDpiGain;
            ny = MENU_H * 0.5f + (ny - MENU_H * 0.5f) * g_cursorDpiGain;
            if (nx >= 0 && nx <= MENU_W && ny >= 0 && ny <= MENU_H) {
                g_cursorX = nx;
                g_cursorY = ny;
                g_cursorActive = true;
                g_cursorLastHitTime = g_time;
            }
        }
    }
}

static void InitNodes() {
    if (g_nodesInit) return;
    g_nodesInit = true;
    for (int i = 0; i < 15; i++) {
        g_nodes[i].x = fmodf((float)(i * 137 + 53), MENU_W);
        g_nodes[i].y = fmodf((float)(i * 97 + 31), MENU_H);
        g_nodes[i].vx = (fmodf((float)(i * 73 + 19), 100.0f) - 50.0f) * 0.003f;
        g_nodes[i].vy = (fmodf((float)(i * 47 + 11), 100.0f) - 50.0f) * 0.003f;
    }
}

static void DrawNodes(ImDrawList* dl, float time, float dt) {
    InitNodes();
    const bool spiralTheme = g_accentSaturation < 0.02f;
    if (!g_showNodes || spiralTheme) return;
    const int nodeCount = std::clamp(g_nodeCount, 3, 15);
    float connectionDist = 200.0f;
    for (int i = 0; i < nodeCount; i++) {
        g_nodes[i].x += g_nodes[i].vx * dt * 60.0f * g_nodeSpeed;
        g_nodes[i].y += g_nodes[i].vy * dt * 60.0f * g_nodeSpeed;
        if (g_nodes[i].x < -20) g_nodes[i].x = MENU_W + 20;
        if (g_nodes[i].x > MENU_W + 20) g_nodes[i].x = -20;
        if (g_nodes[i].y < -20) g_nodes[i].y = MENU_H + 20;
        if (g_nodes[i].y > MENU_H + 20) g_nodes[i].y = -20;
    }
    for (int i = 0; i < nodeCount; i++) {
        for (int j = i + 1; j < nodeCount; j++) {
            float dx = g_nodes[i].x - g_nodes[j].x;
            float dy = g_nodes[i].y - g_nodes[j].y;
            float dist = sqrtf(dx * dx + dy * dy);
            if (dist < connectionDist) {
                float t = 1.0f - dist / connectionDist;
                float alpha = t * 120.0f;
                dl->AddLine(ImVec2(g_nodes[i].x, g_nodes[i].y),
                    ImVec2(g_nodes[j].x, g_nodes[j].y), IM_COL32(255, 255, 255, (int)alpha), 1.5f);
            }
        }
    }
    for (int i = 0; i < nodeCount; i++) {
        float pulse = 0.5f + 0.5f * sinf(time * 0.3f + i * 0.7f);
        int a = (int)(140.0f + pulse * 80.0f);
        float r = 4.0f + pulse * 1.5f;
        dl->AddCircleFilled(ImVec2(g_nodes[i].x, g_nodes[i].y), r + 3.0f, IM_COL32(160, 160, 160, (int)(a * 0.3f)));
        dl->AddCircleFilled(ImVec2(g_nodes[i].x, g_nodes[i].y), r, IM_COL32(220, 220, 220, a));
    }
}

static void DrawCursor(ImDrawList* dl, ImVec2 pos, bool pressed) {
    const float cs = std::clamp(g_cursorSize, 0.6f, 2.0f);
    ImU32 beamCol = IM_COL32(170, 170, 180, 22);
    ImVec2 beamOrigin = ImVec2(MENU_W * 0.5f, MENU_H + 20.0f);
    if (g_showCursorBeam) dl->AddLine(beamOrigin, pos, beamCol, 1.0f);

    ImU32 col = pressed ? IM_COL32(225, 225, 230, 240) : IM_COL32(195, 195, 202, 240);
    ImU32 glow = IM_COL32(180, 180, 190, 48);
    ImU32 shad = IM_COL32(0, 0, 0, 80);

    dl->AddCircleFilled(ImVec2(pos.x + 1, pos.y + 1), 7.5f * cs, shad);
    dl->AddCircleFilled(pos, 6.5f * cs, glow);
    dl->AddCircleFilled(pos, 3.8f * cs, col);

    ImU32 ringCol = pressed ? IM_COL32(230, 230, 235, 190) : IM_COL32(170, 170, 180, 130);
    dl->AddCircle(pos, 6.5f * cs, ringCol, 20, 1.0f * cs);

    if (pressed) {
        dl->AddCircle(pos, 9.0f * cs, IM_COL32(180, 180, 180, 25), 20, 1.0f);
    }
}

static bool Header(const char* label) {
    ImGui::PushStyleVar(ImGuiStyleVar_FramePadding, ImVec2(8, 5));
    ImGui::PushStyleVar(ImGuiStyleVar_ItemSpacing, ImVec2(10, 4));
    ImGui::PushStyleColor(ImGuiCol_Header, ImVec4(0.075f, 0.075f, 0.080f, 0.90f));
    ImGui::PushStyleColor(ImGuiCol_HeaderHovered, ImVec4(0.135f, 0.135f, 0.145f, 0.98f));
    bool open = ImGui::CollapsingHeader(label, ImGuiTreeNodeFlags_FramePadding);
    const ImVec2 lo = ImGui::GetItemRectMin();
    const ImVec2 hi = ImGui::GetItemRectMax();
    ImDrawList* dl = ImGui::GetWindowDrawList();
    dl->AddLine(ImVec2(lo.x + 10.0f, hi.y - 1.0f), ImVec2(hi.x - 10.0f, hi.y - 1.0f),
        IM_COL32(72, 72, 79, 180), 1.0f);
    if (open) {
        dl->AddLine(ImVec2(lo.x + 10.0f, hi.y - 1.0f), ImVec2(lo.x + 74.0f, hi.y - 1.0f),
            IM_COL32(180, 180, 190, 230), 2.0f);
    }
    ImGui::PopStyleColor(2);
    ImGui::PopStyleVar(2);
    if (open) ImGui::Dummy(ImVec2(0, 2));
    return open;
}

static bool CB(const char* label, bool& val, float x = 24.0f) {
    ImGui::PushID(label);
    ImGui::SetCursorPosX(x);
    ImVec2 pos = ImGui::GetCursorScreenPos();
    float h = 17.0f;
    float w = h;
    ImGui::InvisibleButton("##cb", ImVec2(w, h));
    bool changed = false;
    if (ImGui::IsItemClicked()) { val = !val; changed = true; }
    ImDrawList* dl = ImGui::GetWindowDrawList();
    ImVec4 colBg = val
        ? ImVec4(0.42f, 0.42f, 0.46f, 1.0f)
        : ImVec4(0.075f, 0.075f, 0.082f, 1.0f);
    ImU32 bgCol = ImGui::GetColorU32(colBg);
    ImU32 borderCol = ImGui::GetColorU32(val
        ? ImVec4(0.70f, 0.70f, 0.74f, 1.0f)
        : ImVec4(0.28f, 0.28f, 0.31f, 1.0f));
    float r = 3.0f;
    dl->AddRectFilled(pos, ImVec2(pos.x + w, pos.y + h), bgCol, r);
    dl->AddRect(pos, ImVec2(pos.x + w, pos.y + h), borderCol, r);
    if (val) {
        ImU32 checkCol = ImGui::GetColorU32(ImVec4(0.92f, 0.92f, 0.94f, 1.0f));
        float pad = 3.0f;
        dl->AddLine(ImVec2(pos.x + pad, pos.y + h * 0.5f),
            ImVec2(pos.x + w * 0.4f, pos.y + h - pad), checkCol, 2.0f);
        dl->AddLine(ImVec2(pos.x + w * 0.4f, pos.y + h - pad),
            ImVec2(pos.x + w - pad, pos.y + pad), checkCol, 2.0f);
    }
    const float textH = ImGui::GetTextLineHeight();
    ImGui::SetCursorScreenPos(ImVec2(pos.x + w + 8.0f,
        pos.y + std::max(0.0f, (h - textH) * 0.5f) - 0.1f));
    ImGui::Text("%s", label);
    ImGui::PopID();
    return changed;
}

static bool SL(const char* label, float* v, float mn, float mx, float x = 24.0f) {
    ImGui::PushID(label);
    float avail = ImGui::GetContentRegionAvail().x;
    float lw = ImGui::CalcTextSize(label).x + 6.0f;
    ImGui::SetCursorPosX(x);
    ImGui::PushItemWidth(avail - x - lw - 24.0f);
    ImGui::PushStyleVar(ImGuiStyleVar_FrameRounding, 8.0f);
    bool ch = ImGui::SliderFloat("##s", v, mn, mx, "%.2f");
    ImGui::PopStyleVar();
    ImGui::PopItemWidth();
    ImGui::SameLine(avail - lw);
    ImGui::TextColored(ImVec4(0.48f, 0.48f, 0.48f, 1.0f), "%s", label);
    ImGui::PopID();
    return ch;
}

static bool SLI(const char* label, int* v, int mn, int mx, float x = 24.0f) {
    ImGui::PushID(label);
    float avail = ImGui::GetContentRegionAvail().x;
    float lw = ImGui::CalcTextSize(label).x + 6.0f;
    ImGui::SetCursorPosX(x);
    ImGui::PushItemWidth(avail - x - lw - 24.0f);
    ImGui::PushStyleVar(ImGuiStyleVar_FrameRounding, 8.0f);
    bool ch = ImGui::SliderInt("##s", v, mn, mx, "%d");
    ImGui::PopStyleVar();
    ImGui::PopItemWidth();
    ImGui::SameLine(avail - lw);
    ImGui::TextColored(ImVec4(0.48f, 0.48f, 0.48f, 1.0f), "%s", label);
    ImGui::PopID();
    return ch;
}

static bool CMP(const char* label, int* cur, const char* items, float x = 24.0f) {
    ImGui::PushID(label);
    float avail = ImGui::GetContentRegionAvail().x;
    float lw = ImGui::CalcTextSize(label).x + 6.0f;
    ImGui::SetCursorPosX(x);
    ImGui::PushItemWidth(avail - x - lw - 24.0f);
    ImGui::PushStyleVar(ImGuiStyleVar_FrameRounding, 8.0f);
    bool ch = ImGui::Combo("##c", cur, items);
    ImGui::PopStyleVar();
    ImGui::PopItemWidth();
    ImGui::SameLine(avail - lw);
    ImGui::TextColored(ImVec4(0.48f, 0.48f, 0.48f, 1.0f), "%s", label);
    ImGui::PopID();
    return ch;
}

static bool SearchableItemPicker(int* selected, const char* items) {
    static char search[48] = {};
    static bool keyboardOpen = false;
    static int backspaceHeld = 0;
    bool changed = false;

    int itemCount = 0;
    for (const char* p = items; *p; p += std::strlen(p) + 1) itemCount++;

    std::string needle(search);
    std::transform(needle.begin(), needle.end(), needle.begin(),
        [](unsigned char c) { return (char)std::tolower(c); });

    ImGui::PushStyleVar(ImGuiStyleVar_FrameRounding, 8.0f);
    ImGui::PushStyleVar(ImGuiStyleVar_FramePadding, ImVec2(10, 6));

    ImGui::SetCursorPosX(24);
    ImGui::PushItemWidth(ImGui::GetContentRegionAvail().x - 24);
    const char* preview = "Select an item...";
    if (*selected >= 0 && *selected < itemCount) {
        const char* q = items;
        for (int i = 0; i < *selected; i++) q += std::strlen(q) + 1;
        preview = q;
    }
    if (ImGui::BeginCombo("##itemPicker", preview)) {
        const char* q = items;
        for (int i = 0; i < itemCount; i++) {
            std::string candidate(q);
            std::transform(candidate.begin(), candidate.end(), candidate.begin(),
                [](unsigned char c) { return (char)std::tolower(c); });
            if (!needle.empty() && candidate.find(needle) == std::string::npos) {
                q += std::strlen(q) + 1;
                continue;
            }
            bool isSel = (*selected == i);
            if (ImGui::Selectable(q, isSel)) { *selected = i; changed = true; }
            if (isSel) ImGui::SetItemDefaultFocus();
            q += std::strlen(q) + 1;
        }
        ImGui::EndCombo();
    }
    ImGui::PopItemWidth();

    ImGui::SetCursorPosX(24);
    ImGui::PushItemWidth(ImGui::GetContentRegionAvail().x - 142);
    ImGui::PushStyleVar(ImGuiStyleVar_FrameRounding, 8.0f);
    ImGui::InputTextWithHint("##itemSearch", "Search items...", search, sizeof(search));
    bool searchClicked = ImGui::IsItemClicked();
    ImGui::PopStyleVar();
    ImGui::PopItemWidth();
    ImGui::SameLine(0, 6);
    if (ImGui::Button(keyboardOpen ? "Hide Keyboard" : "VR Keyboard", ImVec2(112, 0)))
        keyboardOpen = !keyboardOpen;

    if (searchClicked) keyboardOpen = true;
    if (!keyboardOpen) backspaceHeld = 0;

    ImGui::PopStyleVar(2);

    if (!needle.empty()) {
        int shown = 0;
        const char* q = items;
        ImGui::SetCursorPosX(24);
        ImGui::BeginGroup();
        for (int i = 0; i < itemCount && shown < 5; i++) {
            std::string candidate(q), lower(candidate);
            std::transform(lower.begin(), lower.end(), lower.begin(),
                [](unsigned char c) { return (char)std::tolower(c); });
            if (lower.find(needle) != std::string::npos) {
                ImGui::PushID(9000 + i);
                if (ImGui::Selectable(candidate.c_str(), *selected == i,
                    ImGuiSelectableFlags_None, ImVec2(ImGui::GetContentRegionAvail().x - 24, 23))) {
                    *selected = i;
                    changed = true;
                }
                ImGui::PopID();
                shown++;
            }
            q += std::strlen(q) + 1;
        }
        if (!shown) ImGui::TextDisabled("No matching items");
        ImGui::EndGroup();
    }

    if (keyboardOpen) {
        ImGui::Spacing();
        ImGui::SetCursorPosX(18);
        ImGui::PushStyleColor(ImGuiCol_ChildBg, ImVec4(0.075f, 0.075f, 0.09f, 0.96f));
        ImGui::PushStyleColor(ImGuiCol_Border, ImVec4(0.30f, 0.30f, 0.36f, 0.8f));
        ImGui::BeginChild("##vrItemKeyboard", ImVec2(ImGui::GetContentRegionAvail().x - 10, 205), true,
            ImGuiWindowFlags_NoScrollbar);
        ImGui::TextColored(ImVec4(0.78f, 0.78f, 0.84f, 1.0f), "ITEM SEARCH KEYBOARD");
        ImGui::SameLine();
        ImGui::TextDisabled("  %s", search[0] ? search : "type to filter");
        ImGui::Separator();
        ImGui::PushStyleVar(ImGuiStyleVar_FrameRounding, 5.0f);
        ImGui::PushStyleVar(ImGuiStyleVar_FramePadding, ImVec2(0, 4));
        ImGui::PushStyleVar(ImGuiStyleVar_ItemSpacing, ImVec2(3, 3));

        auto addKey = [&](const char* key, float w) {
            ImGui::PushID(key);
            ImGui::PushStyleColor(ImGuiCol_Button, ImVec4(0.14f, 0.14f, 0.17f, 0.9f));
            ImGui::PushStyleColor(ImGuiCol_ButtonHovered, ImVec4(0.20f, 0.20f, 0.24f, 1.0f));
            ImGui::PushStyleColor(ImGuiCol_ButtonActive, ImVec4(0.26f, 0.26f, 0.30f, 1.0f));
            if (ImGui::Button(key, ImVec2(w, 26))) {
                size_t len = std::strlen(search);
                if (len + 1 < sizeof(search)) { search[len] = key[0]; search[len + 1] = 0; }
            }
            ImGui::PopStyleColor(3);
            ImGui::PopID();
        };

        float avail = ImGui::GetContentRegionAvail().x - 8.0f;

        // Number row
        ImGui::SetCursorPosX(4);
        float nw = avail / 11.0f;
        for (int i = 0; i < 10; i++) {
            if (i) ImGui::SameLine(0, 3);
            char k[2] = { "1234567890"[i], 0 };
            addKey(k, nw);
        }
        ImGui::SameLine(0, 3);
        addKey("-", nw);

        // QWERTY
        ImGui::SetCursorPosX(4);
        float kw = avail / 10.0f;
        const char* r1 = "QWERTYUIOP";
        for (int i = 0; i < 10; i++) {
            if (i) ImGui::SameLine(0, 3);
            char k[2] = { r1[i], 0 };
            addKey(k, kw);
        }

        // ASDF
        ImGui::SetCursorPosX(4);
        float kw2 = avail / 9.0f;
        const char* r2 = "ASDFGHJKL";
        for (int i = 0; i < 9; i++) {
            if (i) ImGui::SameLine(0, 3);
            char k[2] = { r2[i], 0 };
            addKey(k, kw2);
        }

        // ZXCVBNM
        ImGui::SetCursorPosX(4);
        float kw3 = avail / 7.0f;
        const char* r3 = "ZXCVBNM";
        for (int i = 0; i < 7; i++) {
            if (i) ImGui::SameLine(0, 3);
            char k[2] = { r3[i], 0 };
            addKey(k, kw3);
        }

        // Space + Backspace + Close
        float gapTotal = 9.0f;
        float spaceW = (avail - gapTotal) * 0.40f;
        float actionW = (avail - gapTotal - spaceW) / 3.0f;
        ImGui::SetCursorPosX(4);
        ImGui::PushStyleColor(ImGuiCol_Button, ImVec4(0.14f, 0.14f, 0.17f, 0.9f));
        ImGui::PushStyleColor(ImGuiCol_ButtonHovered, ImVec4(0.20f, 0.20f, 0.24f, 1.0f));
        ImGui::PushStyleColor(ImGuiCol_ButtonActive, ImVec4(0.26f, 0.26f, 0.30f, 1.0f));
        ImGui::PushID("SP");
        if (ImGui::Button("SPACE", ImVec2(spaceW, 26)) && std::strlen(search) + 1 < sizeof(search))
            std::strcat(search, " ");
        ImGui::PopID();
        ImGui::SameLine(0, 3);

        ImGui::PushID("BS");
        bool bsClicked = ImGui::Button("BACK", ImVec2(actionW, 26));
        ImGui::PopID();
        ImGui::SameLine(0, 3);

        ImGui::PushStyleColor(ImGuiCol_Button, ImVec4(0.22f, 0.12f, 0.12f, 0.9f));
        ImGui::PushStyleColor(ImGuiCol_ButtonHovered, ImVec4(0.30f, 0.15f, 0.15f, 1.0f));
        ImGui::PushID("CL");
        if (ImGui::Button("CLEAR", ImVec2(actionW, 26))) search[0] = 0;
        ImGui::PopID();
        ImGui::PopStyleColor(2);
        ImGui::SameLine(0, 3);
        ImGui::PushStyleColor(ImGuiCol_Button, ImVec4(0.12f, 0.24f, 0.16f, 0.95f));
        ImGui::PushStyleColor(ImGuiCol_ButtonHovered, ImVec4(0.16f, 0.34f, 0.22f, 1.0f));
        if (ImGui::Button("DONE", ImVec2(actionW, 26))) keyboardOpen = false;
        ImGui::PopStyleColor(2);
        ImGui::PopStyleColor(3);

        if (bsClicked) {
            const size_t len = std::strlen(search);
            if (len) search[len - 1] = 0;
            backspaceHeld = 1;
        }
        if (ImGui::IsItemActive() && backspaceHeld > 0) {
            backspaceHeld++;
            if (backspaceHeld > 12 && backspaceHeld % 2 == 0) {
                const size_t len = std::strlen(search);
                if (len) search[len - 1] = 0;
            }
        } else { backspaceHeld = 0; }

        ImGui::PopStyleVar(3);
        ImGui::EndChild();
        ImGui::PopStyleColor(2);
    }
    return changed;
}

static bool BTN(const char* label, float x = 24.0f) {
    ImGui::SetCursorPosX(x);
    ImGui::PushStyleVar(ImGuiStyleVar_FrameRounding, 8.0f);
    bool ch = ImGui::Button(label, ImVec2(ImGui::GetContentRegionAvail().x - x, 32.0f));
    ImGui::PopStyleVar();
    return ch;
}

static bool TREE(const char* label) {
    ImGui::PushStyleVar(ImGuiStyleVar_FramePadding, ImVec2(2, 4));
    ImGui::PushStyleVar(ImGuiStyleVar_IndentSpacing, 18.0f);
    ImGui::SetCursorPosX(10);
    bool open = ImGui::TreeNodeEx(label, 0);
    ImGui::PopStyleVar(2);
    return open;
}

static std::vector<std::filesystem::path> g_blueprintFiles;
static std::string g_blueprintStatus = "Press Refresh to scan Documents\\bp.";
static char g_blueprintJwt[4096] = {};
static bool g_blueprintTokenManual = false;

static std::filesystem::path BlueprintDirectory() {
    wchar_t profile[32768] = {};
    const DWORD length = GetEnvironmentVariableW(L"USERPROFILE", profile, (DWORD)std::size(profile));
    std::filesystem::path dir = length ? std::filesystem::path(profile) : std::filesystem::current_path();
    dir /= L"Documents";
    dir /= L"bp";
    std::error_code ec;
    std::filesystem::create_directories(dir, ec);
    return dir;
}

static void RefreshBlueprintFiles() {
    g_blueprintFiles.clear();
    std::error_code ec;
    const auto dir = BlueprintDirectory();
    for (const auto& entry : std::filesystem::directory_iterator(dir, ec)) {
        if (!entry.is_regular_file()) continue;
        std::wstring ext = entry.path().extension().wstring();
        std::transform(ext.begin(), ext.end(), ext.begin(), towlower);
        if (ext == L".json") g_blueprintFiles.push_back(entry.path());
    }
    std::sort(g_blueprintFiles.begin(), g_blueprintFiles.end());
    g_blueprintStatus = "Found " + std::to_string(g_blueprintFiles.size()) + " blueprint JSON file(s).";
}

static int ClearBlueprintJSONFiles() {
    const std::filesystem::path root = std::filesystem::weakly_canonical(BlueprintDirectory());
    int removed = 0;
    std::error_code ec;
    for (const auto& entry : std::filesystem::directory_iterator(root, ec)) {
        if (ec) break;
        if (!entry.is_regular_file(ec) || entry.path().extension() != L".json") continue;
        const std::filesystem::path resolved = std::filesystem::weakly_canonical(entry.path(), ec);
        if (ec || resolved.parent_path() != root) continue;
        if (std::filesystem::remove(resolved, ec) && !ec) ++removed;
        ec.clear();
    }
    RefreshBlueprintFiles();
    return removed;
}

static bool InstallSyteBlueprintPreset() {
    HMODULE module = GetModuleHandleW(nullptr);
    HRSRC resource = FindResourceW(module, MAKEINTRESOURCEW(IDR_SYTE_BLUEPRINT), MAKEINTRESOURCEW(10));
    if (!resource) return false;
    HGLOBAL loaded = LoadResource(module, resource);
    const void* data = loaded ? LockResource(loaded) : nullptr;
    const DWORD size = resource ? SizeofResource(module, resource) : 0;
    if (!data || !size) return false;
    const auto target = BlueprintDirectory() / L"syte.json";
    std::ofstream output(target, std::ios::binary | std::ios::trunc);
    if (!output) return false;
    output.write((const char*)data, size);
    output.close();
    RefreshBlueprintFiles();
    return true;
}

static bool ImportBlueprintJSON(HWND owner) {
    wchar_t file[32768] = {};
    OPENFILENAMEW dialog{};
    dialog.lStructSize = sizeof(dialog);
    HWND dialogOwner = owner ? owner : g_mainWindow;
    dialog.hwndOwner = dialogOwner;
    dialog.lpstrFilter = L"Blueprint JSON (*.json)\0*.json\0All files\0*.*\0";
    dialog.lpstrFile = file;
    dialog.nMaxFile = (DWORD)std::size(file);
    dialog.Flags = OFN_FILEMUSTEXIST | OFN_PATHMUSTEXIST | OFN_NOCHANGEDIR |
        OFN_EXPLORER | OFN_DONTADDTORECENT;
    if (dialogOwner) {
        SetWindowPos(dialogOwner, HWND_TOPMOST, 0, 0, 0, 0,
            SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE);
        SetForegroundWindow(dialogOwner);
    }
    const bool picked = GetOpenFileNameW(&dialog) != FALSE;
    if (dialogOwner) {
        SetWindowPos(dialogOwner, HWND_NOTOPMOST, 0, 0, 0, 0,
            SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE);
    }
    if (!picked) return false;
    std::error_code ec;
    const std::filesystem::path source(file);
    std::filesystem::copy_file(source, BlueprintDirectory() / source.filename(),
        std::filesystem::copy_options::overwrite_existing, ec);
    RefreshBlueprintFiles();
    return !ec;
}

static std::string TrimText(std::string value) {
    while (!value.empty() && std::isspace((unsigned char)value.front())) value.erase(value.begin());
    while (!value.empty() && std::isspace((unsigned char)value.back())) value.pop_back();
    if (value.size() > 7 && _strnicmp(value.c_str(), "Bearer ", 7) == 0) value = TrimText(value.substr(7));
    if (value.size() >= 2 &&
        ((value.front() == '"' && value.back() == '"') ||
         (value.front() == '\'' && value.back() == '\''))) {
        value = TrimText(value.substr(1, value.size() - 2));
    }
    return value;
}

static bool LoadBlueprintTokenFile() {
    const auto path = std::filesystem::path(GetExecutableDirectory()) / L"token.txt";
    std::ifstream input(path, std::ios::binary);
    if (!input) return false;
    std::string token((std::istreambuf_iterator<char>(input)), std::istreambuf_iterator<char>());
    token = TrimText(token);
    if (token.empty() || token.size() >= sizeof(g_blueprintJwt)) return false;
    memcpy(g_blueprintJwt, token.c_str(), token.size() + 1);
    return true;
}

static std::string JsonEscape(const std::string& text) {
    std::string output;
    output.reserve(text.size() + text.size() / 8);
    for (unsigned char c : text) {
        switch (c) {
        case '\\': output += "\\\\"; break;
        case '"': output += "\\\""; break;
        case '\b': output += "\\b"; break;
        case '\f': output += "\\f"; break;
        case '\n': output += "\\n"; break;
        case '\r': output += "\\r"; break;
        case '\t': output += "\\t"; break;
        default:
            if (c < 0x20) {
                char escaped[7];
                snprintf(escaped, sizeof(escaped), "\\u%04x", c);
                output += escaped;
            } else output += (char)c;
        }
    }
    return output;
}

static std::string ExtractFirstBlueprintItem(const std::string& json) {
    const size_t itemsKey = json.find("\"items\"");
    if (itemsKey == std::string::npos) return {};
    const size_t arrayStart = json.find('[', itemsKey);
    if (arrayStart == std::string::npos) return {};
    const size_t objectStart = json.find('{', arrayStart);
    if (objectStart == std::string::npos) return {};
    int depth = 0;
    bool inString = false;
    bool escaped = false;
    for (size_t i = objectStart; i < json.size(); ++i) {
        const char c = json[i];
        if (inString) {
            if (escaped) escaped = false;
            else if (c == '\\') escaped = true;
            else if (c == '"') inString = false;
            continue;
        }
        if (c == '"') inString = true;
        else if (c == '{') ++depth;
        else if (c == '}' && --depth == 0) return json.substr(objectStart, i - objectStart + 1);
    }
    return {};
}

static std::string BlueprintStorageID(const std::filesystem::path& file) {
    std::string stem = file.stem().string();
    std::string clean;
    for (unsigned char c : stem) {
        if (std::isalnum(c) || c == '_') clean += (char)std::tolower(c);
    }
    if (clean.rfind("bp_", 0) != 0) clean = "bp_" + clean;
    if (clean == "bp_") clean = "bp_syte";
    if (clean.size() > 20) clean.resize(20);
    return clean;
}

static std::string NormalizeBlueprintForStorage(
    const std::string& source, const std::string& id, const std::string& displayName) {
    if (source.find("\"rootItem\"") != std::string::npos &&
        source.find("\"id\"") != std::string::npos) {
        return source;
    }
    const std::string rootItem = ExtractFirstBlueprintItem(source);
    if (rootItem.empty()) return {};
    return "{\"id\":\"" + JsonEscape(id) + "\",\"name\":\"" +
        JsonEscape(displayName.substr(0, 20)) +
        "\",\"version\":1,\"rootItem\":" + rootItem + "}";
}

static bool UploadBlueprintToAccount(const std::filesystem::path& file, std::string& message) {
    const std::string token = TrimText(g_blueprintJwt);
    if (token.empty()) { message = "Paste a JWT or place token.txt beside the EXE."; return false; }
    std::ifstream input(file, std::ios::binary);
    if (!input) { message = "Could not read selected JSON."; return false; }
    const std::string source((std::istreambuf_iterator<char>(input)), std::istreambuf_iterator<char>());
    if (source.empty()) { message = "Selected JSON is empty."; return false; }
    const std::string key = BlueprintStorageID(file);
    const std::string displayName = file.stem().string().empty() ? "Syte Blueprint" : file.stem().string();
    const std::string blueprint = NormalizeBlueprintForStorage(source, key, displayName);
    if (blueprint.empty()) {
        message = "Unsupported blueprint JSON: expected rootItem or a non-empty items array.";
        return false;
    }
    const std::string body =
        "{\"objects\":[{\"collection\":\"user_blueprints\",\"key\":\"" + JsonEscape(key) +
        "\",\"permission_read\":1,\"permission_write\":1,\"value\":\"" + JsonEscape(blueprint) + "\"}]}";

    HINTERNET session = WinHttpOpen(L"syte.xyz-blueprints/1.0", WINHTTP_ACCESS_TYPE_AUTOMATIC_PROXY,
        WINHTTP_NO_PROXY_NAME, WINHTTP_NO_PROXY_BYPASS, 0);
    if (!session) { message = "Could not open HTTP session."; return false; }
    WinHttpSetTimeouts(session, 5000, 5000, 10000, 10000);
    HINTERNET connection = WinHttpConnect(session,
        L"animalcompany.us-east1.nakamacloud.io", INTERNET_DEFAULT_HTTPS_PORT, 0);
    HINTERNET request = connection ? WinHttpOpenRequest(connection, L"PUT", L"/v2/storage",
        nullptr, WINHTTP_NO_REFERER, WINHTTP_DEFAULT_ACCEPT_TYPES, WINHTTP_FLAG_SECURE) : nullptr;
    bool ok = false;
    DWORD status = 0;
    if (request) {
        const std::wstring auth = L"Authorization: Bearer " + std::wstring(token.begin(), token.end());
        const wchar_t* requestHeaders =
            L"Content-Type: application/json\r\n"
            L"User-Agent: UnityPlayer/6000.3.12f1 (UnityWebRequest/1.0, libcurl/8.10.1-DEV)\r\n"
            L"X-Unity-Version: 6000.3.12f1\r\n";
        WinHttpAddRequestHeaders(request, auth.c_str(), (DWORD)-1, WINHTTP_ADDREQ_FLAG_ADD | WINHTTP_ADDREQ_FLAG_REPLACE);
        WinHttpAddRequestHeaders(request, requestHeaders, (DWORD)-1, WINHTTP_ADDREQ_FLAG_ADD | WINHTTP_ADDREQ_FLAG_REPLACE);
        if (WinHttpSendRequest(request, WINHTTP_NO_ADDITIONAL_HEADERS, 0,
            (LPVOID)body.data(), (DWORD)body.size(), (DWORD)body.size(), 0) &&
            WinHttpReceiveResponse(request, nullptr)) {
            DWORD size = sizeof(status);
            WinHttpQueryHeaders(request, WINHTTP_QUERY_STATUS_CODE | WINHTTP_QUERY_FLAG_NUMBER,
                WINHTTP_HEADER_NAME_BY_INDEX, &status, &size, WINHTTP_NO_HEADER_INDEX);
            ok = status >= 200 && status < 300;
        }
    }
    if (request) WinHttpCloseHandle(request);
    if (connection) WinHttpCloseHandle(connection);
    WinHttpCloseHandle(session);
    message = ok ? "Uploaded to in-game blueprint storage." :
        "Upload failed (HTTP " + std::to_string(status) + "). Check JWT validity.";
    return ok;
}

static bool QueueBlueprintForGame(const std::filesystem::path& file) {
    wchar_t tempDir[MAX_PATH] = {};
    if (!GetTempPathW(MAX_PATH, tempDir)) return false;
    std::ofstream output(std::filesystem::path(tempDir) / L"syte_blueprint_pick.txt",
        std::ios::binary | std::ios::trunc);
    if (!output) return false;
    output << file.string();
    return output.good();
}

void RenderMenu() {
    auto& mod = GetModState();
    const float panelY = PanelY();
    ImGuiStyle& liveStyle = ImGui::GetStyle();
    liveStyle.Alpha = std::clamp(mod.menuAlpha, 0.3f, 1.0f);
    liveStyle.FrameRounding = g_uiRounding;
    liveStyle.GrabRounding = g_uiRounding;
    liveStyle.PopupRounding = g_uiRounding;
    liveStyle.ItemSpacing = g_compactMode ? ImVec2(6, 3) : ImVec2(8, 4);
    ImGui::GetIO().FontGlobalScale = std::clamp(g_fontScale, 0.8f, 1.35f);
    const ImVec4 accent = ImColor::HSV(g_accentHue, g_accentSaturation, 0.48f);
    liveStyle.Colors[ImGuiCol_CheckMark] = accent;
    liveStyle.Colors[ImGuiCol_SliderGrab] = accent;
    liveStyle.Colors[ImGuiCol_SliderGrabActive] = ImColor::HSV(g_accentHue, g_accentSaturation, 0.65f);
    liveStyle.Colors[ImGuiCol_HeaderActive] = ImVec4(accent.x, accent.y, accent.z, 0.75f);
    ImDrawList* bg = ImGui::GetBackgroundDrawList();
    
    // Draw nodes animation FIRST on background
    float dt = g_time - g_lastTime;
    if (dt > 0.1f) dt = 0.016f;
    DrawNodes(bg, g_time, dt);
    g_lastTime = g_time;
    
    // Then draw semi-transparent background on top - nodes will show through
    ImVec4 bgCol = ImVec4(0.032f, 0.032f, 0.036f, g_backgroundOpacity);
    ImU32 bgColU32 = ImGui::ColorConvertFloat4ToU32(bgCol);
    bg->AddRectFilled(ImVec2(PANEL_X, panelY), ImVec2(PANEL_X + PANEL_W, panelY + PANEL_H), bgColU32, 5.0f, ImDrawFlags_RoundCornersAll);
    bg->AddRect(ImVec2(PANEL_X + 0.5f, panelY + 0.5f), ImVec2(PANEL_X + PANEL_W - 0.5f, panelY + PANEL_H - 0.5f),
        IM_COL32(88, 88, 96, 235), 5.0f, ImDrawFlags_RoundCornersAll, 1.5f);
    bg->AddRect(ImVec2(PANEL_X + 2.5f, panelY + 2.5f), ImVec2(PANEL_X + PANEL_W - 2.5f, panelY + PANEL_H - 2.5f),
        IM_COL32(24, 24, 28, 210), 4.0f, ImDrawFlags_RoundCornersAll, 1.0f);
    // Spiral's faint, oversized logarithmic line motif.
    const float cursorPullX = g_cursorActive ? (g_cursorX - (PANEL_X + PANEL_W * 0.5f)) * 0.055f : 0.0f;
    const float cursorPullY = g_cursorActive ? (g_cursorY - (panelY + PANEL_H * 0.5f)) * 0.055f : 0.0f;
    ImVec2 spiralCenter(PANEL_X + PANEL_W * 0.50f + cursorPullX, panelY + PANEL_H * 0.52f + cursorPullY);
    constexpr int spiralPointCount = 112;
    ImVec2 spiralPoints[spiralPointCount];
    for (int i = 0; i < spiralPointCount; ++i) {
        const float a = i * 0.205f + g_time * 0.075f;
        const float r = 4.0f + i * 2.45f;
        spiralPoints[i] = ImVec2(spiralCenter.x + cosf(a) * r, spiralCenter.y + sinf(a) * r);
        if (g_cursorActive) {
            const float dx = spiralPoints[i].x - g_cursorX;
            const float dy = spiralPoints[i].y - g_cursorY;
            const float d2 = dx * dx + dy * dy;
            if (d2 < 14400.0f && d2 > 16.0f) {
                const float force = (14400.0f - d2) * 0.0008f;
                spiralPoints[i].x += dx * force * 0.025f;
                spiralPoints[i].y += dy * force * 0.025f;
            }
        }
    }
    bg->PushClipRect(ImVec2(PANEL_X + 3.0f, panelY + 3.0f),
        ImVec2(PANEL_X + PANEL_W - 3.0f, panelY + PANEL_H - 3.0f), true);
    bg->AddPolyline(spiralPoints, spiralPointCount,
        IM_COL32(142, 142, 154, (int)std::clamp(66.0f * g_spiralBrightness, 0.0f, 255.0f)), false, 1.8f);
    ImVec2 innerSpiral[spiralPointCount];
    for (int i = 0; i < spiralPointCount; ++i) {
        const float a = i * 0.205f - g_time * 0.045f + 3.14159f;
        const float r = 3.0f + i * 1.95f;
        innerSpiral[i] = ImVec2(spiralCenter.x + cosf(a) * r, spiralCenter.y + sinf(a) * r);
    }
    bg->AddPolyline(innerSpiral, spiralPointCount,
        IM_COL32(105, 105, 118, (int)std::clamp(43.0f * g_spiralBrightness, 0.0f, 255.0f)), false, 1.1f);
    bg->PopClipRect();
    if (g_cursorActive) {
        const float wave = fmodf(g_time * 54.0f, 46.0f);
        bg->AddCircle(ImVec2(g_cursorX, g_cursorY), 18.0f + wave,
            IM_COL32(160, 160, 170, (int)(34.0f * (1.0f - wave / 46.0f))), 28, 1.2f);
        bg->AddCircleFilled(ImVec2(g_cursorX, g_cursorY), 22.0f,
            IM_COL32(125, 125, 135, 8), 24);
    }

    ImGui::SetNextWindowPos(ImVec2(PANEL_X, panelY));
    ImGui::SetNextWindowSize(ImVec2(PANEL_W, PANEL_H));

    ImGuiWindowFlags wf = ImGuiWindowFlags_NoResize | ImGuiWindowFlags_NoMove |
        ImGuiWindowFlags_NoScrollbar | ImGuiWindowFlags_NoTitleBar |
        ImGuiWindowFlags_NoBringToFrontOnFocus | ImGuiWindowFlags_NoFocusOnAppearing |
        ImGuiWindowFlags_NoBackground;

    if (!ImGui::Begin("##M", nullptr, wf)) { ImGui::End(); return; }

    float pad = 16.0f;
    float contentW = PANEL_W - pad * 2.0f;

    ImGui::SetCursorPosY(8);
    ImGui::SetCursorPosX(pad);
    ImGui::TextColored(ImVec4(0.90f, 0.90f, 0.92f, 1.0f), "Menu name | CREDIT BYTE FOR THE IMGUI!!!");

    ImGui::SetCursorPosX(pad);
    ImGui::Separator();
    ImGui::SetCursorPosY(ImGui::GetCursorPosY() + 3);

    float tabGap = 3.0f;
    float tabW = (contentW - (NUM_TABS - 1) * tabGap) / (float)NUM_TABS;
    ImGui::SetCursorPosX(pad);
    static float tabIndicatorX = -1.0f;
    for (int i = 0; i < NUM_TABS; i++) {
        if (i > 0) ImGui::SameLine(0, tabGap);
        ImGui::PushID(500 + i);
        ImGui::PushStyleVar(ImGuiStyleVar_FrameRounding, 12.0f);
        ImGui::PushStyleVar(ImGuiStyleVar_FramePadding, ImVec2(6, 4));
        ImGui::PushStyleColor(ImGuiCol_Button, ImVec4(0.0f, 0.0f, 0.0f, 0.0f));
        ImGui::PushStyleColor(ImGuiCol_ButtonHovered, ImVec4(0.18f, 0.18f, 0.20f, 0.88f));
        if (ImGui::Button(g_tabs[i], ImVec2(tabW, 24))) g_currentTab = i;
        ImGui::PopStyleColor(2);
        ImGui::PopStyleVar(2);
        ImGui::PopID();
    }
    const float targetIndicatorX = ImGui::GetWindowPos().x + pad +
        g_currentTab * (tabW + tabGap);
    if (tabIndicatorX < 0.0f) tabIndicatorX = targetIndicatorX;
    const float animT = 1.0f - expf(-18.0f * std::max(g_dt, 0.001f));
    tabIndicatorX += (targetIndicatorX - tabIndicatorX) * animT;
    const float tabsBottom = ImGui::GetItemRectMax().y;
    ImGui::GetWindowDrawList()->AddRectFilled(
        ImVec2(tabIndicatorX + 8.0f, tabsBottom - 2.0f),
        ImVec2(tabIndicatorX + tabW - 8.0f, tabsBottom),
        IM_COL32(190, 190, 198, 255), 2.0f);

    ImGui::SetCursorPosY(ImGui::GetCursorPosY() + 3);
    float contentH = PANEL_H - ImGui::GetCursorPosY() - 4.0f;
    ImGui::PushStyleVar(ImGuiStyleVar_WindowPadding, ImVec2(8, 4));
    ImGui::BeginChild("##C", ImVec2(0, contentH), false, ImGuiWindowFlags_NoScrollbar);

    switch (g_currentTab) {
    case 0: // Player
        if (Header("  Movement")) {
            CB("Noclip", mod.noclipEnabled);
            CB("Super Smooth Fly", mod.superSmoothFly);
            CB("Hand Platforms", mod.handPlatforms);
            CB("Trigger Fly", mod.triggerFly);
            CB("Joystick Fly", mod.joystickFly);
            if (TREE("Hand Fly")) {
                CMP("Target hand", &mod.handFlyHand, "Both\0Left\0Right\0", 32.0f);
                CB("Trigger", mod.handFlyTrigger, 40.0f);
                CB("Grip", mod.handFlyGrip, 40.0f);
                CB("Primary", mod.handFlyPrimary, 40.0f);
                CB("Secondary", mod.handFlySecondary, 40.0f);
                SL("Fly Speed", &mod.flySpeed, 0.1f, 10.0f, 32.0f);
                ImGui::TreePop();
            }
            if (TREE("Velocity Fly")) {
                CMP("Target hand", &mod.velFlyHand, "Both\0Left\0Right\0", 32.0f);
                CB("Trigger", mod.velFlyTrigger, 40.0f);
                CB("Grip", mod.velFlyGrip, 40.0f);
                CB("Primary", mod.velFlyPrimary, 40.0f);
                CB("Secondary", mod.velFlySecondary, 40.0f);
                ImGui::TreePop();
            }
        }
        if (Header("  Player")) {
            CB("God Mode", mod.godMode);
            CB("Invincible", mod.invincible);
            CB("Inf Health", mod.infHealth);
            CB("Invisible", mod.invisibleEnabled);
            CB("Fullbright", mod.fullbright);
            CB("No Recoil", mod.noRecoil);
            CB("No Weapon Cooldown", mod.noWeaponCooldown);
            CB("Inf Farts", mod.infFarts);
            CB("Infinite Fart", mod.infiniteFart2);
            CB("Blue Name Tags", mod.blueNameTags);
            CB("No Red Watch", mod.noRedWatch);
        }
        if (Header("  Self RPC")) {
            if (BTN("Launch Me Up")) mod.launchMeUp = true;
            if (BTN("Stun Me")) mod.stunMeAction = true;
            if (BTN("Kill Me")) mod.killMeAction = true;
            if (BTN("Revive Me")) mod.reviveMeAction = true;
            if (BTN("Tag Me Stinky")) mod.tagStinkySelf = true;
            if (BTN("Set Wanted")) mod.wantedSelf = true;
            if (BTN("Color Me Red")) mod.colorRedSelf = true;
            if (BTN("Reset My Color")) mod.resetColorSelf = true;
        }
        if (Header("  Speed & Jump")) {
            CB("Speed Boost", mod.speedEnabled);
            if (mod.speedEnabled) SL("Speed Multiplier", &mod.speedMultiplier, 1.0f, 10.0f);
            CB("Super Jump", mod.superJump);
            CB("Max Jump Height", mod.maxJumpHeight);
            CB("Reset Jump Height", mod.resetJumpHeight);
            CB("Inf Sprint", mod.infSprint);
        }
        if (Header("  Arms")) {
            CB("Long Arms", mod.longArmsEnabled);
            if (mod.longArmsEnabled) SL("Arm Length", &mod.armLength, 1.0f, 5.0f);
            CB("Big Hands", mod.bigHands);
            CB("Normal Size", mod.normalSize);
        }
        if (Header("  Visual")) {
            CB("Rainbow Self", mod.rainbowSelf);
            CB("RGB Menu", mod.rgbMenu);
            CB("Player ESP", mod.playerESP);
            CB("Arena ESP", mod.arenaESP);
        }
        if (Header("  Teleport")) {
            CB("TP On Grip", mod.teleportEnabled);
            CB("TP to Lake", mod.tpToLake);
            CB("TP to Moon", mod.tpToMoon);
            CB("TP to Sewers", mod.tpToSewers);
            CB("TP to Spawn", mod.tpToSpawn);
            CB("TP to Water Tower", mod.tpToWaterTower);
            CB("TP to Skybox", mod.tpToSkybox);
            CB("TP to Void", mod.tpToVoid);
            CB("TP All to Me", mod.tpAllToMe);
            CB("TP Me to Random", mod.tpMeToRandom);
        }
        break;

    case 1: // Other Players
        if (Header("  Player Grief")) {
            CB("Orbit Players", mod.orbitPlayers);
            CB("Orbit Fast", mod.playerOrbitFast);
            CB("Pull All", mod.pullAll);
            CB("Float All", mod.floatAll);
            CB("Gravity All", mod.gravityAll);
            CB("Drag All", mod.dragAll);
            CB("Float & Freeze All", mod.floatFreezeAll);
            CB("TP All to Void", mod.tpAllToVoid);
            CB("Rain Items", mod.rainItems);
            CB("Launch All", mod.launchAll);
            CB("Explode All", mod.explodeAll);
            CB("Auto Kick All", mod.autoKickAll);
            CB("Kick All (Grip)", mod.kickAllGrip);
            CB("Spaz All", mod.spazEnabled);
            CB("Freeze All", mod.freezeEnabled);
            CB("Rainbow All", mod.rainbowAll);
            CB("Spam Rainbow All", mod.spamRainbowAll);
            CB("RPG Hands All", mod.rpgHandsAll);
            CB("Cage All Players", mod.cageAllPlayers);
            if (BTN("Stinky All")) mod.stinkyAll = true;
            CB("Shake Screen All", mod.shakeAll);
            if (BTN("Grow Everyone")) mod.growAll = true;
            if (BTN("Small Everyone")) mod.smallAll = true;
            if (BTN("Reset Everyone Size")) mod.resetSizeAll = true;
            if (BTN("Mute Everyone")) mod.muteAll = true;
            if (BTN("Loud Everyone")) mod.loudAll = true;
            if (BTN("Stun Everyone")) mod.stunAll = true;
            if (BTN("Revive Everyone")) mod.reviveAllAction = true;
            if (BTN("Set Everyone Wanted")) mod.wantedAll = true;
            if (BTN("Color Everyone Red")) mod.redAll = true;
            if (BTN("Reset Everyone Color")) mod.resetColorAll = true;
            CB("Spin Everyone", mod.spinAll);
            CB("Bounce Everyone", mod.bounceAll);
            if (BTN("Heal Everyone")) mod.healAllAction = true;
            CB("Auto Revive Everyone", mod.reviveAllLoop);
            CB("Random Scale Everyone", mod.randomScaleAll);
        }
        if (Header("  Guns")) {
            CB("Kick Gun", mod.kickGun);
            CB("Push Gun", mod.pushGun);
            CB("Fling Gun", mod.flingGun);
            CB("Color Gun", mod.colorGun);
            CB("TP All Gun", mod.tpAllGun);
            CB("Explosion Gun", mod.explosionGun);
            CB("Launch All Gun", mod.launchAllGun);
            CB("Orbit Gun", mod.orbitGun);
            CB("Ragdoll All Gun", mod.ragdollAllGun);
            CB("Green Screen Gun", mod.greenScreenGun);
            CB("Tag Gun", mod.tagGunEnabled);
            CB("TP Self Gun", mod.teleportGunEnabled);
            CB("Insta Kill Gun", mod.instaKillGun);
            CB("Spawn Gun", mod.spawnGun);
            CB("Yeet Gun", mod.yeetGun);
        }
        if (Header("  Whitelist")) {
            CB("WL Fly", mod.wlFly);
            CB("WL Rocket", mod.wlRocket);
            CB("WL Flare", mod.wlFlare);
            CB("WL Car", mod.wlCar);
            CB("WL Crate", mod.wlCrate);
            CB("WL Suitcase", mod.wlSuitcase);
            CB("WL Bomb", mod.wlBomb);
            CB("WL Egg", mod.wlEgg);
            CB("WL Balloon", mod.wlBalloon);
            CB("WL Giveaway", mod.wlGiveaway);
            CB("WL Spaz Rainbow", mod.wlSpazRainbow);
            CB("WL Disintegrate", mod.wlDisintegrate);
            CB("WL Speed Buff", mod.wlSpeedBuff);
            CB("WL Tornado", mod.wlTornado);
            CB("WL Black Hole", mod.wlBlackHole);
            CB("WL Flash", mod.wlFlash);
            CB("WL Teleport", mod.wlTeleport);
            CB("WL Kick", mod.wlKick);
            CB("WL Freeze", mod.wlFreeze);
            CB("WL Item Storm", mod.wlItemStorm);
            CB("WL Firework Show", mod.wlFireworkShow);
            CB("WL Cage", mod.wlCage);
        }
        break;

    case 2: // Users
        ImGui::SetCursorPosX(pad);
        ImGui::TextColored(ImVec4(0.6f, 0.6f, 0.6f, 1.0f), "Players: %d", mod.numPlayers);
        ImGui::Separator();
        
        if (mod.numPlayers > 0) {
            ImGui::SetCursorPosX(pad);
            if (ImGui::BeginChild("##UL", ImVec2(0, contentH - 40), false,
                ImGuiWindowFlags_NoScrollbar)) {
                for (int i = 0; i < mod.numPlayers; i++) {
                    ImGui::PushID(i);
                    
                    // Accordion-style button for each player
                    bool isExpanded = (mod.selectedPlayer == i);
                    
                    ImGui::SetCursorPosX(8);
                    ImGui::PushStyleVar(ImGuiStyleVar_FrameRounding, 8.0f);
                    ImGui::PushStyleVar(ImGuiStyleVar_FramePadding, ImVec2(12, 8));
                    ImGui::PushStyleColor(ImGuiCol_Button, isExpanded 
                        ? ImVec4(0.24f, 0.24f, 0.24f, 1.0f) 
                        : ImVec4(0.16f, 0.16f, 0.16f, 1.0f));
                    ImGui::PushStyleColor(ImGuiCol_ButtonHovered, ImVec4(0.28f, 0.28f, 0.28f, 1.0f));
                    ImGui::PushStyleColor(ImGuiCol_ButtonActive, ImVec4(0.32f, 0.32f, 0.32f, 1.0f));
                    
                    char btnLabel[128];
                    const char* arrow = isExpanded ? "v" : ">";
                    snprintf(btnLabel, sizeof(btnLabel), "%s  %s", arrow, mod.playerNames[i]);
                    
                    if (ImGui::Button(btnLabel, ImVec2(contentW - 16, 0))) {
                        mod.selectedPlayer = (mod.selectedPlayer == i) ? -1 : i;
                    }
                    
                    ImGui::PopStyleColor(3);
                    ImGui::PopStyleVar(2);
                    
                    // Show action buttons when expanded
                    if (isExpanded) {
                        ImGui::SetCursorPosX(24);
                        ImGui::Spacing();
                        
                        float btnWidth = (contentW - 56) / 3.0f;
                        ImGui::SetCursorPosX(24);
                        ImGui::PushStyleVar(ImGuiStyleVar_FrameRounding, 6.0f);
                        
                        if (ImGui::Button("Kick", ImVec2(btnWidth, 28))) {
                            mod.userKick = true;
                        }
                        ImGui::SameLine();
                        if (ImGui::Button("TP To", ImVec2(btnWidth, 28))) {
                            mod.userTP = true;
                        }
                        ImGui::SameLine();
                        if (ImGui::Button("Pull", ImVec2(btnWidth, 28))) {
                            mod.userPull = true;
                        }
                        
                        ImGui::PopStyleVar();
                        ImGui::Spacing();
                    }
                    
                    ImGui::PopID();
                }
            }
            ImGui::EndChild();
        } else {
            ImGui::SetCursorPosY(ImGui::GetCursorPosY() + 40);
            ImGui::SetCursorPosX(pad + 20);
            ImGui::TextColored(ImVec4(0.5f, 0.5f, 0.5f, 1.0f), "Waiting for players...");
        }
        break;

    case 3: // Items
        if (Header("  Spawn Items")) {
            // Comprehensive item dropdown - organized by category
            const char* itemNames = 
                // Weapons - Melee
                "Katana\0Axe\0Great Sword\0Baseball Bat\0Crowbar\0Hatchet\0"
                "Hammer\0Pickaxe\0Shovel\0Spear\0Lance\0Broom\0Drill\0"
                // Weapons - Ranged
                "Shotgun\0Revolver\0RPG\0Flaregun\0Crossbow\0Grenade Launcher\0"
                "Bubble Gun\0Heart Gun\0Money Gun\0Teleport Gun\0Mining Laser\0"
                // Projectiles
                "Goop\0Piss\0Rocket\0Bomb Arrow\0Flare\0Egg\0"
                "Grenade\0Dynamite\0Flashbang\0Landmine\0Cluster Grenade\0"
                // Movement
                "Jetpack\0Hoverpad\0Portable Teleporter\0Grappling Hook\0Hookshot\0"
                "Pogostick\0Trampoline\0Snowboard\0Ski Shoe\0"
                // Shields
                "Shield\0Shield Galaxy\0Shield Viking\0Shield Police\0Shield Bones\0"
                // Tools
                "Flashlight\0Boombox\0Calculator\0Scanner\0Remote Controller\0"
                "Prop Scanner\0Repair Wrench\0Zipline Gun\0"
                // Food
                "Banana\0Large Banana\0Apple\0Carrot\0Burrito\0Cola\0"
                "Beans\0Broccoli\0Coconut\0Orange\0Pineapple\0"
                // Fish
                "Fish Salmon\0Fish Carp\0Fish Anglerfish\0Fish Boot\0Fish Gold\0"
                "Fish Pufferfish\0Fish Shark\0Fish Tuna\0"
                // Fishing Rods
                "Basic Fishing Rod\0Bamboo Fishing Rod\0Glowing Fishing Rod\0"
                "Lava Fishing Rod\0Radioactive Fishing Rod\0Special Fishing Rod\0"
                // Containers
                "Backpack\0Crate\0Cardboard Box\0Metal Ball\0Metal Plate\0"
                "Pelican Case\0Suitcase\0"
                // Valuables
                "Gold Bar\0Gold Coin\0Ruby\0Rare Card\0Nut\0Four Leaf Clover\0"
                // Body Parts
                "Brain Chunk\0Heart Chunk\0"
                // Bombs/Explosives
                "Timebomb\0Sticky Dynamite\0Pumpkin Bomb\0Love Grenade\0"
                "Impulse Grenade\0Tele Grenade\0Broccoli Grenade\0"
                // Anomalies
                "Cuboid Anomaly\0Gyroid Anomaly\0Prismatic Anomaly\0"
                "Pyramidal Anomaly\0Stellate Anomaly\0"
                // Vehicles/Mounts
                "Saddle\0Snowboard Auto\0"
                // Ores/Resources
                "Copper Ore L\0Gold Ore L\0Silver Ore L\0Moonrock\0Uranium Chunk L\0"
                // Building Materials
                "Metal Rod\0Metal Triangle\0Plank\0Steel Beam\0Truss\0Wood Log\0"
                // Special Items
                "D20\0Disc\0Easter Egg\0Film Reel\0Floppy Disk\0"
                "Hard Drive\0Joystick\0Megaphone\0Trophy\0VHS Tape\0"
                // Gadgets
                "Bubble Staff\0Clapper\0Disposable Camera\0Drill Fists\0"
                "Finger Board\0Gameboy\0Glowstick\0Hawaiian Drum\0"
                "Hoverpad Galaxy\0Jetpack\0Lantern CNY\0Megaphone\0"
                "MIDI Pad\0Needle\0Plunger\0Ring Buoy\0Rubber Ducky\0"
                "Server Pad\0Stapler\0Stopwatch\0Tablet\0Tape Dispenser\0"
                "Theremin\0Toilet Paper\0Trampoline\0Ukulele\0Umbrella\0"
                "War Fan\0Whoopie\0Wireframe Cube\0Wireframe Gun\0Zipline Gun\0"
                "\0";
            
            SearchableItemPicker(&mod.spawnItemIndex, itemNames);
            ImGui::SetCursorPosX(24);
            ImGui::TextDisabled("This selected Item ID is shared by Spawn Gun and launchers.");
            if (BTN("Spawn Item at Hand")) mod.spawnItemAtHand = true;
            CB("Spawn Gun", mod.spawnGun);
            if (BTN("Bring All Items")) mod.bringAllItems = true;
            CB("Delete All Items", mod.deleteAllItems);
            CB("Delete Item Gun", mod.deleteItemGun);
            CB("Delete Held Item", mod.deleteHeldItem);
            CB("Inf Sell Value", mod.infSellValue);
        }
        if (Header("  Item Modifiers")) {
            CB("No Gravity Held", mod.noGravityHeld);
            CB("Add Gravity Held", mod.addGravityHeld);
            CB("Scale Held Up", mod.scaleHeldUp);
            CB("Scale Held Down", mod.scaleHeldDown);
            CB("Yeet Gun", mod.yeetGun);
            CB("Steal Item Gun", mod.stealItemGun);
            CB("Random Hand Duper", mod.randomHandDuper);
            CB("Bag Bomb", mod.bagBomb);
            CB("Cash Quiver Hand", mod.cashQuiverHand);
            CB("Add Held Item To Bag", mod.addToBag);
            CB("Custom Hue Held", mod.customHueHeld);
            CB("Custom Saturation Held", mod.customSaturationHeld);
            CB("Custom Scale Held", mod.customScaleHeld);
            CB("Rainbow Held Item", mod.rainbowHeldItem);
            CB("Random Held Item", mod.randomHeldItem);
            CB("Rainbow All Items", mod.rainbowAllItems);
            CB("Randomize All Items", mod.randomAllItems);
            CB("Item Tornado", mod.itemTornado);
            CB("Launch Items at Players", mod.itemLauncherAll);
            CB("Lock Held Item Position", mod.lockItemPosition);
            CB("Grab Item Anywhere", mod.grabItemAnywhere);
            CB("Item Magnet", mod.itemMagnet);
            CB("Freeze All Items", mod.freezeAllItems);
            if (BTN("Unfreeze All Items")) mod.unfreezeAllItemsAction = true;
        }
        if (Header("  Item Guns")) {
            CB("Multi Shoot", mod.multiShoot);
            CB("Rapid Fire", mod.rapidFire);
            CB("Launcher Gun", mod.launcherGun);
            CB("Crate Gun", mod.crateGun);
            CB("Hand Duper", mod.handDuper);
            CB("Stash Dupe", mod.stashDupe);
            CB("Backpack Dupe", mod.backpackDupe);
            CB("Nut Pickup Gun", mod.nutPickupGun);
            CB("Ammo Pickup Gun", mod.ammoPickupGun);
            CB("Revive Gun", mod.reviveGun);
            CB("Stinky Gun", mod.stinkyGun);
            CB("Piss Gun", mod.pissGun);
            CB("VFX Spammer Gun", mod.vfxSpammerGun);
            CB("Ore Spawn Gun", mod.oreSpawnGun);
            CB("Rig Duper Gun", mod.rigDuperGun);
            CB("Delete Object Gun", mod.deleteObjGun);
            CB("Force Grab Gun", mod.forceGrabGun);
            CB("Goop Fish Gun", mod.goopFishGun);
            CB("Blackhole Gun", mod.blackholeGun);
            CB("Scanner Gun", mod.scannerGun);
        }
        if (Header("  Mobs")) {
            SLI("Mob Index", &mod.mobIndex, 0, 20);
            CB("Spawn Mob Gun", mod.spawnMobGun);
            if (BTN("Spawn Mob at Hand")) mod.spawnMobAtHand = true;
            if (BTN("Kill All Mobs")) mod.killAllMobs = true;
        }
        if (Header("  Prefabs")) {
            SLI("Prefab Index", &mod.prefabIndex, 0, 10);
            CB("Prefab Gun", mod.prefabGun);
        }
        break;

    case 4: // Combat
        if (Header("  Weapons")) {
            CB("Infinite Gun Stats", mod.infiniteGunStats);
            CB("No Shotgun Cooldown", mod.noShotgunCooldown);
            CB("Rocket Fist", mod.rocketFist);
            CB("Boomspear Fist", mod.boomspearFist);
            CB("Egg Fist", mod.eggFist);
            CB("Bomb Arrow Fist", mod.bombArrowFist);
            CB("Flare Fist", mod.flareFist);
            CB("Robot Dog Fist", mod.robotDogFist);
            CB("Car Fist", mod.carFist);
            CB("Infinite Damage", mod.infDamage);
            CB("Void Gun", mod.voidGun);
            CB("Player Info Gun", mod.getPlayerInfoGun);
            CB("Delete Player Gun", mod.deletePlayerGun);
        }
        if (Header("  Ammo")) {
            CB("Inf Ammo Jetpack", mod.infAmmoJetpack);
            CB("Inf Ammo Flare Gun", mod.infAmmoFlareGun);
            CB("Inf Ammo Revolver", mod.infAmmoRevolver);
            CB("Inf Ammo Shotgun", mod.infAmmoShotgun);
            CB("Inf Ammo RPG", mod.infAmmoRPG);
            CB("Inf Ammo Zipline", mod.infAmmoZipline);
            CB("Inf Ammo Arena Gun", mod.infAmmoArenaGun);
            CB("Inf Ammo All", mod.infAmmoAll);
            CB("Jetpack Inf Fuel", mod.jetpackInfFuel);
            CB("Infinite Jetpack", mod.infiniteJetpack2);
        }
        if (Header("  Buffs")) {
            CB("Speed Buff", mod.speedBuff);
            CB("Strength Buff", mod.strengthBuff);
            CB("Stealth Buff", mod.stealthBuff);
            CB("All Buffs", mod.allBuffs);
            CB("Buff All Players", mod.buffAllPlayers);
            CB("Infinite Fart", mod.infFarts);
        }
        if (Header("  Arena")) {
            CB("Arena No Item Despawn", mod.arenaNoDespawn);
            CB("Infinite Hoverpad", mod.infiniteHoverpad);
            if (BTN("Kill All Mobs")) mod.killAllMobs = true;
            if (BTN("Start Arena")) mod.startArenaAction = true;
            if (BTN("End Arena")) mod.endArenaAction = true;
            if (BTN("Join Arena Team 1")) mod.arenaTeam1 = true;
            if (BTN("Join Arena Team 2")) mod.arenaTeam2 = true;
            if (BTN("Enter Arena Map")) mod.arenaEnterMap = true;
            if (BTN("Exit Arena Map")) mod.arenaExitMap = true;
        }
        if (Header("  Solar Unlocks")) {
            CB("Grant All Stash Slots", mod.grantAllStashSlots);
            CB("No Container Restrictions", mod.noContainerRestrictions);
        }
        break;

    case 5: // World
        if (Header("  Shop")) {
            CB("Shop Unlock", mod.shopUnlock);
            CB("Unlock All", mod.unlockAll);
            CB("No Spend", mod.noSpend);
            CB("Own All Cosmetics", mod.ownAllCosmetics);
            CB("Vending Bypass", mod.vendingBypass);
        }
        if (Header("  Doors & World")) {
            CB("Open All Doors", mod.openAllDoors);
            CB("Close All Doors", mod.closeAllDoors);
            CB("Pop All Balloons", mod.popAllBalloons);
            CB("Toggle Boomboxes", mod.toggleBoomboxes);
            CB("Activate Teleporters", mod.activateTeleporters);
            if (BTN("Toggle All Boomboxes V2")) mod.toggleAllBoomboxesV2 = true;
        }
        if (Header("  Machines")) {
            if (BTN("Spawn Selling Machine")) mod.spawnSellingMachine = true;
            if (BTN("Spawn Dupe Machine")) mod.spawnDupeMachine = true;
            if (BTN("Sell All Items")) mod.sellAllItems = true;
            CB("Selling Spasm", mod.sellingSpasm);
            CB("Flush All Toilets", mod.flushAllToilets);
            CB("Dupe Machine Max", mod.dupeMachineMax);
            if (BTN("Spawn Blackhole")) mod.spawnBlackhole = true;
            if (BTN("Spawn Core Teleporter")) mod.spawnCoreTeleporter = true;
            if (BTN("Spawn Spaceship Teleporter")) mod.spawnSpaceship = true;
            if (BTN("Spawn Network Lever")) mod.spawnNetworkLever = true;
            if (BTN("Spawn Claw Machine")) mod.spawnClawMachine = true;
            if (BTN("Spawn Sell Machine")) mod.spawnSellMachine = true;
            if (BTN("Spawn Money Gun")) mod.spawnMoneyGun = true;
            if (BTN("Spawn Scanner")) mod.spawnScanner = true;
            if (BTN("Flush Toilets Once")) mod.flushToiletsAction = true;
            if (BTN("Machine To Me")) mod.machineToMe = true;
            if (BTN("Spawn Juice Dupe Machine")) mod.spawnJuiceMachine = true;
            if (BTN("Sell Machine Explode")) mod.sellExplode = true;
            if (BTN("Sell Machine Recover")) mod.sellRecover = true;
        }
        if (Header("  Arena World")) {
            CB("Thunder Strike", mod.thunderStrike);
            CB("Spam Thunder", mod.spamThunder);
            CB("Night Alarm", mod.nightAlarm);
        }
        if (Header("  Ores & Voxels")) {
            if (BTN("Break All Ores")) mod.breakAllOres = true;
            if (BTN("Clear All Ores")) mod.clearAllOres = true;
        }
        if (Header("  Boss Tools")) {
            if (BTN("Spawn Shadow Boss")) mod.spawnShadowBoss = true;
            if (BTN("Shadow Boss To Me")) mod.shadowBossToMe = true;
        }
        if (Header("  Hand Prefabs")) {
            CB("Christmas Box Hand", mod.christmasBoxHand);
            CB("Selling Machine Hand", mod.sellingMachineHand);
            CB("Car Hand", mod.carHand);
        }
        if (Header("  Rig Tools")) {
            CB("Rig Spasm", mod.rigSpasm);
            CB("Rig At Hand", mod.rigAtHand);
            CB("Rig Rain", mod.rigRain);
        }
        if (Header("  Stash")) {
            CB("Stash Dupe", mod.stashDupe);
            CB("Backpack Dupe", mod.backpackDupe);
            CB("Stash Allow Moves", mod.stashAllowMoves);
            CB("Stash QOL Fix", mod.stashQolFix);
            CB("No Backpack Remove", mod.noBackpackRemove);
            CB("Bag Inf Capacity", mod.bagInfCapacity);
            CB("Quiver Inf Capacity", mod.quiverInfCapacity);
        }
        break;

    case 6: // OP V2
        if (Header("  RPC Mods")) {
            CB("RPC Kill All", mod.rpcKillAll);
            CB("RPC Revive All", mod.rpcReviveAll);
            CB("RPC TP All to Me", mod.rpcTPAllToMe);
            CB("RPC Stun All", mod.rpcStunAll);
            CB("RPC Launch All", mod.rpcLaunchAll);
            CB("Insta Kill All", mod.instaKillAll);
            CB("Block ApplyBuff", mod.blockRpcApplyBuff);
            CB("Block AddForce", mod.blockRpcAddForce);
            CB("Block Teleport", mod.blockRpcTeleport);
            CB("Block Stinky", mod.blockRpcStinky);
            CB("Block Stun", mod.blockRpcStun);
            CB("Block SetColor", mod.blockRpcSetColor);
            CB("Block KickPlayer", mod.blockRpcKick);
            if (BTN("Block ALL")) {
                mod.blockRpcApplyBuff = mod.blockRpcAddForce = mod.blockRpcTeleport = true;
                mod.blockRpcStinky = mod.blockRpcStun = mod.blockRpcSetColor = mod.blockRpcKick = true;
            }
            if (BTN("Allow ALL")) {
                mod.blockRpcApplyBuff = mod.blockRpcAddForce = mod.blockRpcTeleport = false;
                mod.blockRpcStinky = mod.blockRpcStun = mod.blockRpcSetColor = mod.blockRpcKick = false;
            }
        }
        if (Header("  Give")) {
            CB("Give Lots of Nuts", mod.giveLotsOfNuts);
            CB("Give Lots of CC", mod.giveLotsOfCC);
            CB("Give Research Points", mod.giveResearchPoints);
            CB("Unlock All Items", mod.unlockAllItems);
        }
        break;

    case 7: // Blueprints
        if (g_blueprintFiles.empty()) RefreshBlueprintFiles();
        if (Header("  Blueprint Library")) {
            ImGui::SetCursorPosX(24);
            ImGui::TextWrapped("Import JSON templates from Documents\\bp and upload them to your in-game blueprint stash.");
            if (BTN("Install Preset: Syte Text")) {
                g_blueprintStatus = InstallSyteBlueprintPreset()
                    ? "Installed syte.json preset." : "Could not install embedded preset.";
            }
            if (BTN("Import Blueprint JSON")) {
                g_blueprintStatus = ImportBlueprintJSON(nullptr)
                    ? "Imported blueprint JSON." : "Import cancelled or failed.";
            }
            if (BTN("Refresh Blueprint List")) RefreshBlueprintFiles();
            ImGui::SetCursorPosX(24);
            ImGui::TextDisabled("%s", g_blueprintStatus.c_str());
        }
        if (Header("  Loaded Blueprints")) {
            if (g_blueprintFiles.empty()) {
                ImGui::SetCursorPosX(24);
                ImGui::TextDisabled("No JSON files found.");
            } else {
                mod.blueprintIndex = std::clamp(mod.blueprintIndex, 0, (int)g_blueprintFiles.size() - 1);
                const std::string preview = g_blueprintFiles[mod.blueprintIndex].stem().string();
                ImGui::SetCursorPosX(24);
                ImGui::PushItemWidth(ImGui::GetContentRegionAvail().x - 24);
                if (ImGui::BeginCombo("##blueprintSelect", preview.c_str())) {
                    for (int i = 0; i < (int)g_blueprintFiles.size(); ++i) {
                        const std::string name = g_blueprintFiles[i].stem().string();
                        if (ImGui::Selectable(name.c_str(), mod.blueprintIndex == i))
                            mod.blueprintIndex = i;
                    }
                    ImGui::EndCombo();
                }
                ImGui::PopItemWidth();
                if (BTN("Add to Inventions")) {
                    if (QueueBlueprintForGame(g_blueprintFiles[mod.blueprintIndex])) {
                        mod.blueprintRefreshQueued = true;
                        g_blueprintStatus = "Adding to an empty invention slot...";
                    } else {
                        g_blueprintStatus = "Could not queue selected blueprint.";
                    }
                }
                CB("Bypass Blueprint Limits", mod.blueprintAbuse);
            }
            if (BTN("Clear All Blueprint JSONs")) {
                const int removed = ClearBlueprintJSONFiles();
                g_blueprintStatus = "Removed " + std::to_string(removed) + " blueprint JSON file(s).";
                mod.blueprintIndex = 0;
            }
        }
        break;

    case 8: // Settings
        if (Header("  Backend")) {
            ImGui::TextColored(ImVec4(0.4f, 0.9f, 0.4f, 1.0f), "Pipe: %s", PIPE_NAME);
            ImGui::Text("Backend: %s", g_pipe.IsConnected() ? "Connected" : "Waiting...");
        }
        if (Header("  Menu")) {
            SL("Menu Alpha", &mod.menuAlpha, 0.3f, 1.0f);
            SL("Menu Scale", &mod.menuScale, 0.5f, 1.5f);
            SL("Joystick Scroll Speed", &g_scrollSpeed, 0.006f, 0.055f);
            SL("Cursor Size", &g_cursorSize, 0.6f, 2.0f);
            SL("Cursor DPI", &g_cursorDpiGain, 0.80f, 1.60f);
            SL("UI Rounding", &g_uiRounding, 0.0f, 16.0f);
            SL("Accent Hue", &g_accentHue, 0.0f, 1.0f);
            SL("Accent Saturation", &g_accentSaturation, 0.0f, 1.0f);
            SL("Background Opacity", &g_backgroundOpacity, 0.20f, 0.90f);
            SL("Font Scale", &g_fontScale, 0.80f, 1.35f);
            SL("Node Speed", &g_nodeSpeed, 0.0f, 3.0f);
            SL("Spiral Brightness", &g_spiralBrightness, 0.25f, 2.25f);
            SLI("Background Nodes", &g_nodeCount, 3, 15);
            CB("Show Background Nodes", g_showNodes);
            CB("Compact Spacing", g_compactMode);
            CB("Show Cursor Beam", g_showCursorBeam);
            if (BTN("Theme: Spiral Dark")) { g_accentHue = 0.0f; g_accentSaturation = 0.0f; g_backgroundOpacity = 0.86f; }
            if (BTN("Theme: Plasma Purple")) { g_accentHue = 0.78f; g_accentSaturation = 0.62f; g_backgroundOpacity = 0.68f; }
            if (BTN("Theme: Toxic Green")) { g_accentHue = 0.34f; g_accentSaturation = 0.62f; g_backgroundOpacity = 0.60f; }
            if (BTN("Theme: Blood Red")) { g_accentHue = 0.00f; g_accentSaturation = 0.70f; g_backgroundOpacity = 0.72f; }
            if (BTN("Reset Menu Settings")) {
                mod.menuAlpha = 0.92f;
                mod.menuScale = 1.0f;
                g_scrollSpeed = 0.022f;
                g_cursorSize = 0.98f;
                g_cursorDpiGain = 1.26f;
                g_uiRounding = 4.0f;
                g_nodeCount = 15;
                g_showNodes = true;
                g_compactMode = false;
                g_accentHue = 0.0f;
                g_accentSaturation = 0.0f;
                g_backgroundOpacity = 0.82f;
                g_fontScale = 1.0f;
                g_nodeSpeed = 1.0f;
                g_spiralBrightness = 1.0f;
                g_showCursorBeam = true;
            }
        }
        break;
    case 9:
        ImGui::SetCursorPosY(220.0f);
        ImGui::SetWindowFontScale(2.25f);
        {
            const char* credit = "imgui made by byte";
            const float width = ImGui::CalcTextSize(credit).x;
            ImGui::SetCursorPosX(std::max(0.0f, (PANEL_W - width) * 0.5f));
            ImGui::TextUnformatted(credit);
        }
        ImGui::SetWindowFontScale(1.0f);
        break;
    }

    ImGui::EndChild();
    ImGui::PopStyleVar();

    // Spiral's click.ogg, embedded as PCM at its original 50% volume.
    if (g_justClicked && ImGui::IsAnyItemHovered()) {
        PlaySoundA(MAKEINTRESOURCEA(IDR_SPIRAL_CLICK), GetModuleHandleA(nullptr),
            SND_RESOURCE | SND_ASYNC | SND_NODEFAULT);
    }

    ImGui::End();
}

void Shutdown() {
    AntiTamper::Shutdown();
    if (g_fridaPI.hProcess) {
        DWORD exitCode = 0;
        if (GetExitCodeProcess(g_fridaPI.hProcess, &exitCode) && exitCode == STILL_ACTIVE)
            TerminateProcess(g_fridaPI.hProcess, 0);
        CloseHandle(g_fridaPI.hProcess);
        g_fridaPI = {};
    }
    if (!g_tempBridgePath.empty()) DeleteFileA(g_tempBridgePath.c_str());
    if (!g_tempBackendPath.empty()) DeleteFileA(g_tempBackendPath.c_str());
    g_tokenPipe.Shutdown();
    ImGui_ImplDX11_Shutdown();
    ImGui_ImplWin32_Shutdown();
    ImGui::DestroyContext();
    if (g_overlayRTV) g_overlayRTV->Release();
    if (g_overlayTexture) g_overlayTexture->Release();
    if (g_swapChain) g_swapChain->Release();
    if (g_context) g_context->Release();
    if (g_device) g_device->Release();
    if (g_overlay && g_overlayHandle) g_overlay->DestroyOverlay(g_overlayHandle);
    if (g_vrSystem) vr::VR_Shutdown();
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE, LPSTR, int) {
    EnsureConsole();
    printf("[syte] Starting syte.xyz overlay...\n");

    if (!CheckMenuStatus()) {
        printf("[-] Menu is down\n");
        Sleep(5000);
        return 1;
    }
    printf("[+] Menu status: online\n");

    WaitForAnimalCompany();

    if (!AntiTamper::Initialize()) {
        printf("[-] Integrity initialization failed.\n");
        return 1;
    }

    g_vrMode = InitOpenVR();
    if (g_vrMode) g_vrMode = InitOverlay();
    if (!g_vrMode) {
        printf("[syte] SteamVR is required. Open SteamVR and run syte.xyz again.\n");
        if (g_vrSystem) {
            vr::VR_Shutdown();
            g_vrSystem = nullptr;
            g_overlay = nullptr;
        }
        AntiTamper::Shutdown();
        Sleep(3000);
        return 1;
    }
    printf("[syte] SteamVR connected. VR overlay mode.\n");

    WNDCLASSEXA wc = { sizeof(wc), CS_CLASSDC, DefWindowProcA, 0, 0, hInstance,
        nullptr, nullptr, nullptr, nullptr, "ACSyte", nullptr };
    RegisterClassExA(&wc);

    HWND hwnd = CreateWindowExA(0, "ACSyte", "syte.xyz",
        WS_OVERLAPPEDWINDOW, CW_USEDEFAULT, CW_USEDEFAULT,
        (int)MENU_W, (int)MENU_H,
        nullptr, nullptr, hInstance, nullptr);
    g_mainWindow = hwnd;

    if (!InitD3D11(hwnd)) { printf("[syte] D3D11 fail\n"); return 1; }
    InitImGui(hwnd);
    // Show the desktop mirror while using the same texture in SteamVR.
    ShowWindow(hwnd, SW_SHOWDEFAULT);
    UpdateWindow(hwnd);
    printf("[syte] Ready. %s mode.\n", g_vrMode ? "VR overlay" : "desktop preview");

    g_pipe.Init();
    g_bridge.Init();
    g_tokenPipe.Init();

    if (!ExtractEmbeddedScript(IDR_AC_BRIDGE, "runtime_a.tmp", g_tempBridgePath) ||
        !ExtractEmbeddedScript(IDR_BACKEND, "runtime_b.tmp", g_tempBackendPath)) {
        MessageBoxA(hwnd, "Could not unpack the embedded backend.", "syte.xyz", MB_ICONERROR);
        Shutdown();
        return 1;
    }

    char fridaPath[MAX_PATH] = {};
    const DWORD fridaLen = SearchPathA(nullptr, "frida.exe", nullptr, MAX_PATH, fridaPath, nullptr);
    const std::string fridaExe = (fridaLen > 0 && fridaLen < MAX_PATH) ? fridaPath : "frida.exe";
    g_fridaCmd = "\"" + fridaExe + "\" -l \"" + g_tempBridgePath +
        "\" -l \"" + g_tempBackendPath + "\" \"AnimalCompany.exe\"";

    auto launchBackend = [&]() {
        if (!IsAnimalCompanyRunning()) {
            g_backendRunning = false;
            return;
        }
        if (g_fridaPI.hProcess) {
            DWORD exitCode = 0;
            if (GetExitCodeProcess(g_fridaPI.hProcess, &exitCode) && exitCode == STILL_ACTIVE) return;
            CloseHandle(g_fridaPI.hProcess);
            g_fridaPI = {};
        }
        STARTUPINFOA si = { sizeof(si) };
        si.dwFlags = STARTF_USESHOWWINDOW;
        si.wShowWindow = SW_SHOW;
        char* cmdBuf = _strdup(g_fridaCmd.c_str());
        g_backendRunning = CreateProcessA(nullptr, cmdBuf, nullptr, nullptr, FALSE,
            CREATE_NEW_CONSOLE, nullptr, nullptr, &si, &g_fridaPI) != 0;
        free(cmdBuf);
        if (g_backendRunning) {
            CloseHandle(g_fridaPI.hThread);
            printf("[syte] Embedded backend attached to AnimalCompany.exe\n");
        } else {
            printf("[syte] Could not launch frida.exe (error %lu). Is Frida on PATH?\n", GetLastError());
        }
    };

    launchBackend();
    float retryTimer = 5.0f;

    MSG msg{};
    bool running = true;
    while (running) {
        if (AntiTamper::tampered.load(std::memory_order_acquire)) {
            printf("[-] Runtime integrity check failed. Closing.\n");
            running = false;
            break;
        }
        while (PeekMessageA(&msg, nullptr, 0, 0, PM_REMOVE)) {
            if (msg.message == WM_QUIT) { running = false; break; }
            TranslateMessage(&msg);
            DispatchMessageA(&msg);
        }
        if (!running) break;

        g_pipe.Poll();
        g_bridge.Poll();
        g_tokenPipe.Poll();

        // Auto-fill JWT from backend token extraction
        if (g_tokenPipe.HasToken() && !g_blueprintTokenManual) {
            std::string token = g_tokenPipe.GetToken();
            if (!token.empty() && token.size() < sizeof(g_blueprintJwt)) {
                memcpy(g_blueprintJwt, token.c_str(), token.size() + 1);
            }
        }

        // Keep both temporary scripts until shutdown. The bridge can connect
        // before Frida has opened the backend script passed by the second -l.
        
        // Read player data from backend
        PipePlayerData playerData;
        if (g_pipe.ReadPlayerData(playerData)) {
            auto& mod = GetModState();
            mod.numPlayers = playerData.numPlayers;
            for (int i = 0; i < MAX_PLAYERS; i++) {
                memcpy(mod.playerNames[i], playerData.playerNames[i], MAX_PLAYER_NAME);
            }
            if (playerData.blueprintStatus == 1)
                g_blueprintStatus = "Added to inventions successfully.";
            else if (playerData.blueprintStatus == -1)
                g_blueprintStatus = "Blueprint failed. Check the console for the exact stage.";
            else if (playerData.blueprintStatus == 2)
                g_blueprintStatus = "Adding blueprint to inventions...";
            static int logCount = 0;
            if (logCount++ % 120 == 0) {
                printf("[syte] Player data received: count=%d\n", mod.numPlayers);
            }
        }

        retryTimer -= 0.016f;
        if (retryTimer <= 0.0f) {
            retryTimer = 5.0f;
            if (!g_backendRunning || !g_pipe.IsConnected()) {
                launchBackend();
            }
        }

        if (!g_vrMode) {
            g_prevCursorClick = g_cursorClick;
            POINT mouse{};
            GetCursorPos(&mouse);
            ScreenToClient(hwnd, &mouse);
            RECT client{};
            GetClientRect(hwnd, &client);
            const float clientW = (float)std::max<LONG>(1, client.right - client.left);
            const float clientH = (float)std::max<LONG>(1, client.bottom - client.top);
            g_cursorX = std::clamp(mouse.x * MENU_W / clientW, 0.0f, MENU_W);
            g_cursorY = std::clamp(mouse.y * MENU_H / clientH, 0.0f, MENU_H);
            g_cursorClick = (GetAsyncKeyState(VK_LBUTTON) & 0x8000) != 0;
            g_cursorActive = true;
        }
        {
            LARGE_INTEGER now;
            QueryPerformanceCounter(&now);
            if (g_perfFreq.QuadPart == 0) {
                QueryPerformanceFrequency(&g_perfFreq);
                g_lastPerf = now;
                g_lastTime = 0.0f;
            }
            float dt = (float)(now.QuadPart - g_lastPerf.QuadPart) / (float)g_perfFreq.QuadPart;
            if (dt > 0.1f) dt = 0.016f;
            g_lastPerf = now;
            g_dt = dt;
            g_time += dt;
        }

        ImGui_ImplDX11_NewFrame();

        if (g_vrMode) {
            WaitForSteamVRFrame();
            PollVRHand();
            if (g_vrQuitRequested) {
                printf("[syte] SteamVR requested shutdown; closing overlay cleanly.\n");
                running = false;
                break;
            }
        }
        {
            ImGuiIO& io = ImGui::GetIO();
            io.DisplaySize = ImVec2(MENU_W, MENU_H);
            io.DeltaTime = g_dt > 0.0f ? g_dt : 1.0f / 60.0f;
            io.AddMousePosEvent(g_cursorX, g_cursorY);
            io.AddMouseButtonEvent(0, g_cursorClick);
            if (g_rightStickScroll != 0.0f)
                io.AddMouseWheelEvent(0.0f, g_rightStickScroll);
        }

        ImGui::NewFrame();

        if (g_menuVisible) {
            RenderMenu();
        }

        {
            auto& m = GetModState();
            
            PipeModState ps{};
            ps.flyEnabled = m.flyEnabled;
            ps.flySpeed = m.flySpeed;
            ps.speedEnabled = m.speedEnabled;
            ps.speedMultiplier = m.speedMultiplier;
            ps.noclipEnabled = m.noclipEnabled;
            ps.invisibleEnabled = m.invisibleEnabled;
            ps.longArmsEnabled = m.longArmsEnabled;
            ps.armLength = m.armLength;
            ps.teleportEnabled = m.teleportEnabled;
            ps.grabAllEnabled = m.grabAllEnabled;
            ps.itemGunEnabled = m.itemGunEnabled;
            ps.itemGunIndex = m.itemGunIndex;
            ps.tagGunEnabled = m.tagGunEnabled;
            ps.kickGunEnabled = m.kickGunEnabled;
            ps.instaKillGun = m.instaKillGun;
            ps.teleportGunEnabled = m.teleportGunEnabled;
            ps.spazEnabled = m.spazEnabled;
            ps.freezeEnabled = m.freezeEnabled;
            ps.goopSpamEnabled = m.goopSpamEnabled;
            ps.triggerCloneSpawn = m.triggerCloneSpawn;
            ps.rigFollowEnabled = m.rigFollowEnabled;
            ps.orbitClonesEnabled = m.orbitClonesEnabled;
            ps.cloneLineMode = m.cloneLineMode;
            ps.godMode = m.godMode;
            ps.invincible = m.invincible;
            ps.noclip = m.noclipEnabled;
            ps.invisible = m.invisibleEnabled;
            ps.fullbright = m.fullbright;
            ps.rainbowSelf = m.rainbowSelf;
            ps.rainbowAll = m.rainbowAll;
            ps.playerESP = m.playerESP;
            ps.rpcKillAll = m.rpcKillAll;
            ps.rpcReviveAll = m.rpcReviveAll;
            ps.rpcTPAllToMe = m.rpcTPAllToMe;
            ps.rpcStunAll = m.rpcStunAll;
            ps.rpcLaunchAll = m.rpcLaunchAll;
            ps.instaKillAll = m.instaKillAll;
            ps.pissMod = m.pissMod;
            ps.coverAllGoopfish = m.coverAllGoopfish;
            ps.orbitPlayers = m.orbitPlayers;
            ps.pullAll = m.pullAll;
            ps.floatAll = m.floatAll;
            ps.gravityAll = m.gravityAll;
            ps.tpAllToVoid = m.tpAllToVoid;
            ps.kickGun = m.kickGun;
            ps.pushGun = m.pushGun;
            ps.flingGun = m.flingGun;
            ps.colorGun = m.colorGun;
            ps.explosionGun = m.explosionGun;
            ps.launchAllGun = m.launchAllGun;
            ps.orbitGun = m.orbitGun;
            ps.ragdollAllGun = m.ragdollAllGun;
            ps.spawnGun = m.spawnGun;
            ps.spawnMobGun = m.spawnMobGun;
            ps.mobIndex = m.mobIndex;
            ps.noGravityHeld = m.noGravityHeld;
            ps.addGravityHeld = m.addGravityHeld;
            ps.scaleHeldUp = m.scaleHeldUp;
            ps.scaleHeldDown = m.scaleHeldDown;
            ps.yeetGun = m.yeetGun;
            ps.launcherGun = m.launcherGun;
            ps.crateGun = m.crateGun;
            ps.stashDupe = m.stashDupe;
            ps.backpackDupe = m.backpackDupe;
            ps.speedBuff = m.speedBuff;
            ps.strengthBuff = m.strengthBuff;
            ps.stealthBuff = m.stealthBuff;
            ps.allBuffs = m.allBuffs;
            ps.buffAllPlayers = m.buffAllPlayers;
            ps.jetpackInfFuel = m.jetpackInfFuel;
            ps.infAmmoAll = m.infAmmoAll;
            ps.superJump = m.superJump;
            ps.maxJumpHeight = m.maxJumpHeight;
            ps.shopUnlock = m.shopUnlock;
            ps.unlockAll = m.unlockAll;
            ps.openAllDoors = m.openAllDoors;
            ps.closeAllDoors = m.closeAllDoors;
            ps.popAllBalloons = m.popAllBalloons;
            ps.toggleBoomboxes = m.toggleBoomboxes;
            ps.activateTeleporters = m.activateTeleporters;
            ps.thunderStrike = m.thunderStrike;
            ps.arenaStartSpam = m.arenaStartSpam;
            ps.arenaNoDespawn = m.arenaNoDespawn;
            ps.infiniteHoverpad = m.infiniteHoverpad;
            ps.arenaItemBurst = m.arenaItemBurst;
            ps.giveLotsOfNuts = m.giveLotsOfNuts;
            ps.giveLotsOfCC = m.giveLotsOfCC;
            ps.giveResearchPoints = m.giveResearchPoints;
            ps.unlockAllItems = m.unlockAllItems;
            ps.sellingSpasm = m.sellingSpasm;
            ps.flushAllToilets = m.flushAllToilets;
            ps.toiletSpam = m.toiletSpam;
            ps.toiletPaperBurst = m.toiletPaperBurst;
            ps.dupeMachineMax = m.dupeMachineMax;
            ps.rocketFist = m.rocketFist;
            ps.boomspearFist = m.boomspearFist;
            ps.eggFist = m.eggFist;
            ps.bombArrowFist = m.bombArrowFist;
            ps.flareFist = m.flareFist;
            ps.bigHands = m.bigHands;
            ps.normalSize = m.normalSize;
            ps.rgbMenu = m.rgbMenu;
            ps.handPlatforms = m.handPlatforms;
            ps.triggerFly = m.triggerFly;
            ps.superSmoothFly = m.superSmoothFly;
            ps.infSprint = m.infSprint;
            ps.noRecoil = m.noRecoil;
            ps.noWeaponCooldown = m.noWeaponCooldown;
            ps.infFarts = m.infFarts;
            ps.blueNameTags = m.blueNameTags;
            ps.userKick = m.userKick;
            ps.userTP = m.userTP;
            ps.userPull = m.userPull;
            ps.selectedPlayer = m.selectedPlayer;
            ps.autoKickAll = m.autoKickAll;
            ps.kickAllGrip = m.kickAllGrip;
            ps.tpAllToMe = m.tpAllToMe;
            ps.tpMeToRandom = m.tpMeToRandom;
            ps.spamBuffAll = m.spamBuffAll;
            ps.buffSpam = m.buffSpam;
            ps.deleteAllMobs = m.deleteAllMobs;
            ps.deleteAllItems = m.deleteAllItems;
            ps.bringAllItems = m.bringAllItems;
            ps.deleteHeldItem = m.deleteHeldItem;
            ps.handDuper = m.handDuper;
            ps.killAllMobs = m.killAllMobs;
            ps.spawnAllWeapons = m.spawnAllWeapons;
            ps.spawnItemAtHand = m.spawnItemAtHand;
            ps.spawnMobAtHand = m.spawnMobAtHand;
            ps.spawnItemIndex = m.spawnItemIndex;
            ps.deleteAllItems = m.deleteAllItems;
            ps.wlFly = m.wlFly;
            ps.wlRocket = m.wlRocket;
            ps.wlFlare = m.wlFlare;
            ps.wlCar = m.wlCar;
            ps.wlCrate = m.wlCrate;
            ps.wlBomb = m.wlBomb;
            ps.wlEgg = m.wlEgg;
            ps.wlBalloon = m.wlBalloon;
            ps.wlSuitcase = m.wlSuitcase;
            ps.wlGiveaway = m.wlGiveaway;
            ps.wlSpazRainbow = m.wlSpazRainbow;
            ps.wlDisintegrate = m.wlDisintegrate;
            ps.wlSpeedBuff = m.wlSpeedBuff;
            ps.wlTornado = m.wlTornado;
            ps.wlBlackHole = m.wlBlackHole;
            ps.wlFlash = m.wlFlash;
            ps.wlTeleport = m.wlTeleport;
            ps.wlKick = m.wlKick;
            ps.wlFreeze = m.wlFreeze;
            ps.wlItemStorm = m.wlItemStorm;
            ps.wlFireworkShow = m.wlFireworkShow;
            ps.wlCage = m.wlCage;
            ps.tpToLake = m.tpToLake;
            ps.tpToMoon = m.tpToMoon;
            ps.tpToSewers = m.tpToSewers;
            ps.tpToSpawn = m.tpToSpawn;
            ps.tpToWaterTower = m.tpToWaterTower;
            ps.tpToSkybox = m.tpToSkybox;
            ps.tpToVoid = m.tpToVoid;
            ps.dragAll = m.dragAll;
            ps.floatFreezeAll = m.floatFreezeAll;
            ps.rainItems = m.rainItems;
            ps.launchAll = m.launchAll;
            ps.explodeAll = m.explodeAll;
            ps.tpAllGun = m.tpAllGun;
            ps.playerOrbitFast = m.playerOrbitFast;
            ps.prefabGun = m.prefabGun;
            ps.prefabIndex = m.prefabIndex;
            ps.deleteAllPrefabs = m.deleteAllPrefabs;
            ps.customPrefabOrbit = m.customPrefabOrbit;
            ps.christmasOrbit = m.christmasOrbit;
            ps.sellingMachineOrbit = m.sellingMachineOrbit;
            ps.carOrbit = m.carOrbit;
            ps.robotDogFist = m.robotDogFist;
            ps.carFist = m.carFist;
            ps.christmasBoxHand = m.christmasBoxHand;
            ps.sellingMachineHand = m.sellingMachineHand;
            ps.carHand = m.carHand;
            ps.blueprintAbuse = m.blueprintAbuse;
            ps.nightAlarm = m.nightAlarm;
            ps.sellAllItems = m.sellAllItems;
            ps.spawnSellingMachine = m.spawnSellingMachine;
            ps.spawnDupeMachine = m.spawnDupeMachine;
            ps.noSpend = m.noSpend;
            ps.ownAllCosmetics = m.ownAllCosmetics;
            ps.vendingBypass = m.vendingBypass;
            ps.infiniteFart2 = m.infiniteFart2;
            ps.infiniteJetpack2 = m.infiniteJetpack2;
            ps.stashQolFix = m.stashQolFix;
            ps.spawnConfettiBurst = m.spawnConfettiBurst;
            ps.spawnClonesQueued = m.spawnClonesQueued;
            ps.clearClonesQueued = m.clearClonesQueued;
            ps.greenScreenGun = m.greenScreenGun;
            ps.blockRpcApplyBuff = m.blockRpcApplyBuff;
            ps.blockRpcAddForce = m.blockRpcAddForce;
            ps.blockRpcTeleport = m.blockRpcTeleport;
            ps.blockRpcStinky = m.blockRpcStinky;
            ps.blockRpcStun = m.blockRpcStun;
            ps.blockRpcSetColor = m.blockRpcSetColor;
            ps.blockRpcKick = m.blockRpcKick;
            ps.noRedWatch = m.noRedWatch;
            ps.noBackpackRemove = m.noBackpackRemove;
            ps.infiniteGunStats = m.infiniteGunStats;
            ps.infHealth = m.infHealth;
            ps.bagInfCapacity = m.bagInfCapacity;
            ps.quiverInfCapacity = m.quiverInfCapacity;
            ps.noShotgunCooldown = m.noShotgunCooldown;
            ps.infSellValue = m.infSellValue;
            ps.spawnNetPlayerTrigger = m.spawnNetPlayerTrigger;
            ps.joystickFly = m.joystickFly;
            ps.arenaESP = m.arenaESP;
            ps.rpgHandsAll = m.rpgHandsAll;
            ps.stealItemGun = m.stealItemGun;
            ps.randomHandDuper = m.randomHandDuper;
            ps.bagBomb = m.bagBomb;
            ps.cashQuiverHand = m.cashQuiverHand;
            ps.addToBag = m.addToBag;
            ps.itemLauncherAll = m.itemLauncherAll;
            ps.itemTornado = m.itemTornado;
            ps.lagAllItems = m.lagAllItems;
            ps.customHueHeld = m.customHueHeld;
            ps.customSaturationHeld = m.customSaturationHeld;
            ps.customScaleHeld = m.customScaleHeld;
            ps.rainbowHeldItem = m.rainbowHeldItem;
            ps.rainbowAllItems = m.rainbowAllItems;
            ps.randomHeldItem = m.randomHeldItem;
            ps.randomAllItems = m.randomAllItems;
            ps.multiShoot = m.multiShoot;
            ps.rapidFire = m.rapidFire;
            ps.grantAllStashSlots = m.grantAllStashSlots;
            ps.noContainerRestrictions = m.noContainerRestrictions;
            ps.cageAllPlayers = m.cageAllPlayers;
            ps.infDamage = m.infDamage;
            ps.voidGun = m.voidGun;
            ps.getPlayerInfoGun = m.getPlayerInfoGun;
            ps.deletePlayerGun = m.deletePlayerGun;
            ps.bringAllItemsGun = m.bringAllItemsGun;
            ps.nutPickupGun = m.nutPickupGun;
            ps.ammoPickupGun = m.ammoPickupGun;
            ps.launchMeUp = m.launchMeUp;
            ps.stunMeAction = m.stunMeAction;
            ps.killMeAction = m.killMeAction;
            ps.reviveMeAction = m.reviveMeAction;
            ps.tagStinkySelf = m.tagStinkySelf;
            ps.wantedSelf = m.wantedSelf;
            ps.colorRedSelf = m.colorRedSelf;
            ps.resetColorSelf = m.resetColorSelf;
            ps.reviveGun = m.reviveGun;
            ps.stinkyGun = m.stinkyGun;
            ps.pissGun = m.pissGun;
            ps.vfxSpammerGun = m.vfxSpammerGun;
            ps.prefabSpawnGun = m.prefabSpawnGun;
            ps.deleteObjGun = m.deleteObjGun;
            ps.forceGrabGun = m.forceGrabGun;
            ps.oreSpawnGun = m.oreSpawnGun;
            ps.rigDuperGun = m.rigDuperGun;
            ps.startArenaAction = m.startArenaAction;
            ps.endArenaAction = m.endArenaAction;
            ps.arenaSpammer = m.arenaSpammer;
            ps.arenaTeam1 = m.arenaTeam1;
            ps.arenaTeam2 = m.arenaTeam2;
            ps.arenaEnterMap = m.arenaEnterMap;
            ps.arenaExitMap = m.arenaExitMap;
            ps.arenaOreBurst = m.arenaOreBurst;
            ps.arenaGunsBurst = m.arenaGunsBurst;
            ps.spawnBlackhole = m.spawnBlackhole;
            ps.spawnCoreTeleporter = m.spawnCoreTeleporter;
            ps.spawnSpaceship = m.spawnSpaceship;
            ps.spawnNetworkLever = m.spawnNetworkLever;
            ps.spawnClawMachine = m.spawnClawMachine;
            ps.spawnSellMachine = m.spawnSellMachine;
            ps.spawnMoneyGun = m.spawnMoneyGun;
            ps.spawnScanner = m.spawnScanner;
            ps.spamThunder = m.spamThunder;
            ps.flushToiletsAction = m.flushToiletsAction;
            ps.spamToilets = m.spamToilets;
            ps.rigBurst5 = m.rigBurst5;
            ps.spamRigs = m.spamRigs;
            ps.rigSpasm = m.rigSpasm;
            ps.rigAtHand = m.rigAtHand;
            ps.rigRain = m.rigRain;
            ps.stinkyAll = m.stinkyAll;
            ps.shakeAll = m.shakeAll;
            ps.growAll = m.growAll;
            ps.smallAll = m.smallAll;
            ps.resetSizeAll = m.resetSizeAll;
            ps.muteAll = m.muteAll;
            ps.loudAll = m.loudAll;
            ps.stunAll = m.stunAll;
            ps.rainbowItemLauncher = m.rainbowItemLauncher;
            ps.robotRocketLauncher = m.robotRocketLauncher;
            ps.rocketSpearLauncher = m.rocketSpearLauncher;
            ps.rocketEggLauncher = m.rocketEggLauncher;
            ps.flareLauncher = m.flareLauncher;
            ps.buggyLauncher = m.buggyLauncher;
            ps.giveawayBagLauncher = m.giveawayBagLauncher;
            ps.oreLauncher = m.oreLauncher;
            ps.itemRainV2 = m.itemRainV2;
            ps.voxelNuke = m.voxelNuke;
            ps.breakAllOres = m.breakAllOres;
            ps.clearAllOres = m.clearAllOres;
            ps.hellOreRing = m.hellOreRing;
            ps.elevatorSpam = m.elevatorSpam;
            ps.machineToMe = m.machineToMe;
            ps.sellButtonSpam = m.sellButtonSpam;
            ps.spamDupeJuice = m.spamDupeJuice;
            ps.spawnShadowBoss = m.spawnShadowBoss;
            ps.shadowBossToMe = m.shadowBossToMe;
            ps.toggleAllBoomboxesV2 = m.toggleAllBoomboxesV2;
            ps.lockItemPosition = m.lockItemPosition;
            ps.grabItemAnywhere = m.grabItemAnywhere;
            ps.goopFishGun = m.goopFishGun;
            ps.blackholeGun = m.blackholeGun;
            ps.scannerGun = m.scannerGun;
            ps.moneyRain = m.moneyRain;
            ps.balloonRain = m.balloonRain;
            ps.randomPrefabRain = m.randomPrefabRain;
            ps.reviveAllAction = m.reviveAllAction;
            ps.wantedAll = m.wantedAll;
            ps.redAll = m.redAll;
            ps.resetColorAll = m.resetColorAll;
            ps.spawnJuiceMachine = m.spawnJuiceMachine;
            ps.sellExplode = m.sellExplode;
            ps.sellRecover = m.sellRecover;
            ps.itemMagnet = m.itemMagnet;
            ps.freezeAllItems = m.freezeAllItems;
            ps.unfreezeAllItemsAction = m.unfreezeAllItemsAction;
            ps.explodeAllItemsAction = m.explodeAllItemsAction;
            ps.flareRain = m.flareRain;
            ps.rocketRain = m.rocketRain;
            ps.confettiSpam = m.confettiSpam;
            ps.spinAll = m.spinAll;
            ps.bounceAll = m.bounceAll;
            ps.healAllAction = m.healAllAction;
            ps.reviveAllLoop = m.reviveAllLoop;
            ps.randomScaleAll = m.randomScaleAll;
            ps.quickActionTrigger = m.quickActionTrigger;
            ps.blueprintRefreshQueued = m.blueprintRefreshQueued;
            ps.quickActionIndex = m.quickActionIndex;
            ps.resetJumpHeight = m.resetJumpHeight;
            ps.infAmmoJetpack = m.infAmmoJetpack;
            ps.stashAllowMoves = m.stashAllowMoves;
            ps.spamRainbowAll = m.spamRainbowAll;
            ps.selectedItemLauncher = m.selectedItemLauncher;
            ps.launcherItemIndex = m.spawnItemIndex;
            ps.timebombLauncher = m.timebombLauncher;
            ps.pelicanCaseLauncher = m.pelicanCaseLauncher;
            ps.rareCardLauncher = m.rareCardLauncher;
            ps.rocketLauncher = m.rocketLauncher;
            ps.menuAlpha = m.menuAlpha;
            ps.menuScale = m.menuScale;
            ps.rightGrab = m.rightGrab;
            ps.leftGrab = m.leftGrab;
            ps.rightTrigger = m.rightTrigger;
            ps.leftTrigger = m.leftTrigger;

            // Merge bridge state (web/phone control)
            if (g_bridge.HasData()) {
                PipeModState br = g_bridge.GetState();
                uint8_t* dst = (uint8_t*)&ps;
                const uint8_t* src = (uint8_t*)&br;
                for (size_t i = 1; i < sizeof(PipeModState) - 8; i++) dst[i] |= src[i];
                if (br.itemGunIndex) ps.itemGunIndex = br.itemGunIndex;
                if (br.mobIndex) ps.mobIndex = br.mobIndex;
                if (br.selectedPlayer >= 0) ps.selectedPlayer = br.selectedPlayer;
                if (br.launcherItemIndex) ps.launcherItemIndex = br.launcherItemIndex;
                if (br.prefabIndex) ps.prefabIndex = br.prefabIndex;
                if (br.spawnItemIndex) ps.spawnItemIndex = br.spawnItemIndex;
                if (br.quickActionIndex) ps.quickActionIndex = br.quickActionIndex;
                if (br.flySpeed > 0.01f) ps.flySpeed = br.flySpeed;
                if (br.speedMultiplier > 0.01f) ps.speedMultiplier = br.speedMultiplier;
                if (br.armLength > 0.01f) ps.armLength = br.armLength;
            }

            // The backend ticks at 60 Hz. Sending faster only floods the pipe,
            // wastes CPU and can discard one-shot actions while a write is pending.
            static float nextPipeWrite = 0.0f;
            static int pipeWriteCount = 0;
            if (g_time >= nextPipeWrite) {
                nextPipeWrite = g_time + (1.0f / 60.0f);
                g_pipe.Write(ps);

                // Keep one-shot actions alive across three backend samples.
                const bool resetButtons = (++pipeWriteCount % 3) == 0;
                if (resetButtons) {
                m.spawnItemAtHand = false;
                m.spawnMobAtHand = false;
                m.spawnConfettiBurst = false;
                m.bringAllItems = false;
                m.killAllMobs = false;
                m.userKick = false;
                m.userTP = false;
                m.userPull = false;
                m.deleteAllItems = false;
                m.deleteAllMobs = false;
                m.deleteAllPrefabs = false;
                m.spawnAllWeapons = false;
                m.sellAllItems = false;
                m.spawnSellingMachine = false;
                m.spawnDupeMachine = false;
                m.spawnClonesQueued = false;
                m.clearClonesQueued = false;
                m.launchMeUp = false;
                m.stunMeAction = false;
                m.killMeAction = false;
                m.reviveMeAction = false;
                m.tagStinkySelf = false;
                m.wantedSelf = false;
                m.colorRedSelf = false;
                m.resetColorSelf = false;
                m.startArenaAction = false;
                m.endArenaAction = false;
                m.arenaTeam1 = false;
                m.arenaTeam2 = false;
                m.arenaEnterMap = false;
                m.arenaExitMap = false;
                m.arenaOreBurst = false;
                m.arenaGunsBurst = false;
                m.spawnBlackhole = false;
                m.spawnCoreTeleporter = false;
                m.spawnSpaceship = false;
                m.spawnNetworkLever = false;
                m.spawnClawMachine = false;
                m.spawnSellMachine = false;
                m.spawnMoneyGun = false;
                m.spawnScanner = false;
                m.flushToiletsAction = false;
                m.rigBurst5 = false;
                m.stinkyAll = false;
                m.growAll = false;
                m.smallAll = false;
                m.resetSizeAll = false;
                m.muteAll = false;
                m.loudAll = false;
                m.stunAll = false;
                m.breakAllOres = false;
                m.clearAllOres = false;
                m.machineToMe = false;
                m.spawnShadowBoss = false;
                m.shadowBossToMe = false;
                m.toggleAllBoomboxesV2 = false;
                m.reviveAllAction = false;
                m.wantedAll = false;
                m.redAll = false;
                m.resetColorAll = false;
                m.spawnJuiceMachine = false;
                m.sellExplode = false;
                m.sellRecover = false;
                m.unfreezeAllItemsAction = false;
                m.explodeAllItemsAction = false;
                m.healAllAction = false;
                m.quickActionTrigger = false;
                m.blueprintRefreshQueued = false;
                }
            }
        }

        if (g_cursorActive) {
            DrawCursor(ImGui::GetForegroundDrawList(),
                ImVec2(g_cursorX, g_cursorY), g_cursorClick);
        }
        ImGui::Render();

        float clear[4] = {0, 0, 0, 0};
        g_context->OMSetRenderTargets(1, &g_overlayRTV, nullptr);
        g_context->ClearRenderTargetView(g_overlayRTV, clear);
        ImGui_ImplDX11_RenderDrawData(ImGui::GetDrawData());

        ID3D11Texture2D* backBuffer = nullptr;
        g_swapChain->GetBuffer(0, IID_PPV_ARGS(&backBuffer));
        if (backBuffer && g_overlayTexture) {
            g_context->CopyResource(g_overlayTexture, backBuffer);
            backBuffer->Release();
        }

        if (g_vrMode && g_overlay) {
            vr::Texture_t tex{};
            tex.eType = vr::TextureType_DirectX;
            tex.handle = g_overlayTexture;
            tex.eColorSpace = vr::ColorSpace_Auto;
            g_overlay->SetOverlayTexture(g_overlayHandle, &tex);
            auto& menuState = GetModState();
            g_overlay->SetOverlayAlpha(g_overlayHandle,
                g_menuVisible ? std::clamp(menuState.menuAlpha, 0.3f, 1.0f) : 0.0f);
            g_overlay->SetOverlayWidthInMeters(g_overlayHandle,
                0.42f * std::clamp(menuState.menuScale, 0.5f, 1.5f));
        }

        g_swapChain->Present(0, 0);
        Sleep(0);
    }

    Shutdown();
    return 0;
}
