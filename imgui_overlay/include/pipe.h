#pragma once
#include <windows.h>
#include <sddl.h>
#include <tlhelp32.h>
#include <cstdint>
#include <cstdio>
#include <string>

static const char* PIPE_NAME = "\\\\.\\pipe\\syte_backend";
static const char* PIPE_RESPONSE_NAME = "\\\\.\\pipe\\syte_backend_response";
static const char* PIPE_BRIDGE_NAME = "\\\\.\\pipe\\syte_bridge";
static const char* PIPE_TOKEN_NAME = "\\\\.\\pipe\\syte_token";

static PSECURITY_DESCRIPTOR CreateSytePipeDescriptor(SECURITY_ATTRIBUTES& sa) {
    PSECURITY_DESCRIPTOR descriptor = nullptr;
    // Protected DACL: LocalSystem and the current object owner only.
    if (!ConvertStringSecurityDescriptorToSecurityDescriptorA(
        "D:P(A;;GA;;;SY)(A;;GA;;;OW)", SDDL_REVISION_1, &descriptor, nullptr)) {
        return nullptr;
    }
    sa = {};
    sa.nLength = sizeof(sa);
    sa.lpSecurityDescriptor = descriptor;
    sa.bInheritHandle = FALSE;
    return descriptor;
}

static bool IsAnimalCompanyPipeClient(HANDLE pipe) {
    ULONG clientPid = 0;
    if (!GetNamedPipeClientProcessId(pipe, &clientPid) || clientPid == 0) return false;
    HANDLE process = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, FALSE, clientPid);
    if (!process) return false;
    char path[MAX_PATH] = {};
    DWORD pathLen = MAX_PATH;
    const bool queried = QueryFullProcessImageNameA(process, 0, path, &pathLen) != FALSE;
    CloseHandle(process);
    if (!queried) return false;
    const char* file = strrchr(path, '\\');
    file = file ? file + 1 : path;
    return _stricmp(file, "AnimalCompany.exe") == 0;
}

#define MAX_PLAYERS 24
#define MAX_PLAYER_NAME 64

#pragma pack(push, 1)
struct PipePlayerData {
    uint32_t numPlayers;
    char playerNames[MAX_PLAYERS][MAX_PLAYER_NAME];
    int32_t blueprintStatus;
};
#pragma pack(pop)

#pragma pack(push, 1)
struct PipeModState {
    uint8_t version = 1;
    // ALL bools first (matching JS reader order exactly)
    bool flyEnabled;
    bool speedEnabled;
    bool noclipEnabled;
    bool invisibleEnabled;
    bool longArmsEnabled;
    bool teleportEnabled;
    bool grabAllEnabled;
    bool itemGunEnabled;
    bool tagGunEnabled;
    bool kickGunEnabled;
    bool instaKillGun;
    bool teleportGunEnabled;
    bool spazEnabled;
    bool freezeEnabled;
    bool goopSpamEnabled;
    bool triggerCloneSpawn;
    bool rigFollowEnabled;
    bool orbitClonesEnabled;
    bool cloneLineMode;
    bool godMode;
    bool invincible;
    bool noclip;
    bool invisible;
    bool fullbright;
    bool rainbowSelf;
    bool rainbowAll;
    bool playerESP;
    bool rpcKillAll;
    bool rpcReviveAll;
    bool rpcTPAllToMe;
    bool rpcStunAll;
    bool rpcLaunchAll;
    bool instaKillAll;
    bool pissMod;
    bool coverAllGoopfish;
    bool orbitPlayers;
    bool pullAll;
    bool floatAll;
    bool gravityAll;
    bool tpAllToVoid;
    bool kickGun;
    bool pushGun;
    bool flingGun;
    bool colorGun;
    bool explosionGun;
    bool launchAllGun;
    bool orbitGun;
    bool ragdollAllGun;
    bool spawnGun;
    bool spawnMobGun;
    bool noGravityHeld;
    bool addGravityHeld;
    bool scaleHeldUp;
    bool scaleHeldDown;
    bool yeetGun;
    bool launcherGun;
    bool crateGun;
    bool stashDupe;
    bool backpackDupe;
    bool speedBuff;
    bool strengthBuff;
    bool stealthBuff;
    bool allBuffs;
    bool buffAllPlayers;
    bool jetpackInfFuel;
    bool infAmmoAll;
    bool superJump;
    bool maxJumpHeight;
    bool shopUnlock;
    bool unlockAll;
    bool openAllDoors;
    bool closeAllDoors;
    bool popAllBalloons;
    bool toggleBoomboxes;
    bool activateTeleporters;
    bool thunderStrike;
    bool arenaStartSpam;
    bool arenaNoDespawn;
    bool infiniteHoverpad;
    bool arenaItemBurst;
    bool giveLotsOfNuts;
    bool giveLotsOfCC;
    bool giveResearchPoints;
    bool unlockAllItems;
    bool sellingSpasm;
    bool flushAllToilets;
    bool toiletSpam;
    bool toiletPaperBurst;
    bool dupeMachineMax;
    bool rocketFist;
    bool boomspearFist;
    bool eggFist;
    bool bombArrowFist;
    bool flareFist;
    bool bigHands;
    bool normalSize;
    bool rgbMenu;
    bool handPlatforms;
    bool triggerFly;
    bool superSmoothFly;
    bool infSprint;
    bool noRecoil;
    bool noWeaponCooldown;
    bool infFarts;
    bool blueNameTags;
    bool userKick;
    bool userTP;
    bool userPull;
    bool teleportGun;
    bool autoKickAll;
    bool kickAllGrip;
    bool tpAllToMe;
    bool tpMeToRandom;
    bool spamBuffAll;
    bool buffSpam;
    bool deleteAllMobs;
    bool deleteAllItems;
    bool bringAllItems;
    bool deleteHeldItem;
    bool handDuper;
    bool killAllMobs;
    bool spawnAllWeapons;
    bool spawnItemAtHand;
    bool spawnMobAtHand;
    bool wlFly;
    bool wlRocket;
    bool wlFlare;
    bool wlCar;
    bool wlCrate;
    bool wlBomb;
    bool wlEgg;
    bool wlBalloon;
    bool selectedItemLauncher;
    bool timebombLauncher;
    bool pelicanCaseLauncher;
    bool rareCardLauncher;
    bool rocketLauncher;
    bool blueprintAbuse;
    bool nightAlarm;
    bool sellAllItems;
    bool spawnSellingMachine;
    bool spawnDupeMachine;
    bool customPrefabOrbit;
    bool christmasOrbit;
    bool sellingMachineOrbit;
    bool carOrbit;
    bool prefabGun;
    bool deleteAllPrefabs;
    // NEW: teleport location bools
    bool tpToLake;
    bool tpToMoon;
    bool tpToSewers;
    bool tpToSpawn;
    bool tpToWaterTower;
    bool tpToSkybox;
    bool tpToVoid;
    // NEW: other player mods
    bool dragAll;
    bool floatFreezeAll;
    bool rainItems;
    bool launchAll;
    bool explodeAll;
    bool tpAllGun;
    bool playerOrbitFast;
    // NEW: individual ammo mods
    bool infAmmoFlareGun;
    bool infAmmoRevolver;
    bool infAmmoShotgun;
    bool infAmmoRPG;
    bool infAmmoZipline;
    bool infAmmoArenaGun;
    // NEW: extended whitelist
    bool wlSuitcase;
    bool wlGiveaway;
    bool wlSpazRainbow;
    bool wlDisintegrate;
    bool wlSpeedBuff;
    bool wlTornado;
    bool wlBlackHole;
    bool wlFlash;
    bool wlTeleport;
    bool wlKick;
    bool wlFreeze;
    bool wlItemStorm;
    bool wlFireworkShow;
    bool wlCage;
    // NEW: fist mods
    bool robotDogFist;
    bool carFist;
    // NEW: hand prefabs
    bool christmasBoxHand;
    bool sellingMachineHand;
    bool carHand;
    // NEW: shop/world mods
    bool noSpend;
    bool ownAllCosmetics;
    bool vendingBypass;
    bool infiniteFart2;
    bool infiniteJetpack2;
    bool stashQolFix;
    bool spawnConfettiBurst;
    bool spawnClonesQueued;
    bool clearClonesQueued;
    bool greenScreenGun;
    bool blockRpcApplyBuff;
    bool blockRpcAddForce;
    bool blockRpcTeleport;
    bool blockRpcStinky;
    bool blockRpcStun;
    bool blockRpcSetColor;
    bool blockRpcKick;
    bool noRedWatch;
    bool noBackpackRemove;
    bool infiniteGunStats;
    bool infHealth;
    bool bagInfCapacity;
    bool quiverInfCapacity;
    bool noShotgunCooldown;
    bool infSellValue;
    bool spawnNetPlayerTrigger;
    bool joystickFly;
    bool arenaESP;
    bool rpgHandsAll;
    bool stealItemGun;
    bool randomHandDuper;
    bool bagBomb;
    bool cashQuiverHand;
    bool addToBag;
    bool itemLauncherAll;
    bool itemTornado;
    bool lagAllItems;
    bool customHueHeld;
    bool customSaturationHeld;
    bool customScaleHeld;
    bool rainbowHeldItem;
    bool rainbowAllItems;
    bool randomHeldItem;
    bool randomAllItems;
    bool multiShoot;
    bool rapidFire;
    bool grantAllStashSlots;
    bool noContainerRestrictions;
    bool cageAllPlayers;
    bool infDamage;
    bool voidGun;
    bool getPlayerInfoGun;
    bool deletePlayerGun;
    bool bringAllItemsGun;
    bool nutPickupGun;
    bool ammoPickupGun;
    bool launchMeUp;
    bool stunMeAction;
    bool killMeAction;
    bool reviveMeAction;
    bool tagStinkySelf;
    bool wantedSelf;
    bool colorRedSelf;
    bool resetColorSelf;
    bool reviveGun;
    bool stinkyGun;
    bool pissGun;
    bool vfxSpammerGun;
    bool prefabSpawnGun;
    bool deleteObjGun;
    bool forceGrabGun;
    bool oreSpawnGun;
    bool rigDuperGun;
    bool startArenaAction;
    bool endArenaAction;
    bool arenaSpammer;
    bool arenaTeam1;
    bool arenaTeam2;
    bool arenaEnterMap;
    bool arenaExitMap;
    bool arenaOreBurst;
    bool arenaGunsBurst;
    bool spawnBlackhole;
    bool spawnCoreTeleporter;
    bool spawnSpaceship;
    bool spawnNetworkLever;
    bool spawnClawMachine;
    bool spawnSellMachine;
    bool spawnMoneyGun;
    bool spawnScanner;
    bool spamThunder;
    bool flushToiletsAction;
    bool spamToilets;
    bool rigBurst5;
    bool spamRigs;
    bool rigSpasm;
    bool rigAtHand;
    bool rigRain;
    bool stinkyAll;
    bool shakeAll;
    bool growAll;
    bool smallAll;
    bool resetSizeAll;
    bool muteAll;
    bool loudAll;
    bool stunAll;
    bool rainbowItemLauncher;
    bool robotRocketLauncher;
    bool rocketSpearLauncher;
    bool rocketEggLauncher;
    bool flareLauncher;
    bool buggyLauncher;
    bool giveawayBagLauncher;
    bool oreLauncher;
    bool itemRainV2;
    bool voxelNuke;
    bool breakAllOres;
    bool clearAllOres;
    bool hellOreRing;
    bool elevatorSpam;
    bool machineToMe;
    bool sellButtonSpam;
    bool spamDupeJuice;
    bool spawnShadowBoss;
    bool shadowBossToMe;
    bool toggleAllBoomboxesV2;
    bool lockItemPosition;
    bool grabItemAnywhere;
    bool goopFishGun;
    bool blackholeGun;
    bool scannerGun;
    bool moneyRain;
    bool balloonRain;
    bool randomPrefabRain;
    bool reviveAllAction;
    bool wantedAll;
    bool redAll;
    bool resetColorAll;
    bool spawnJuiceMachine;
    bool sellExplode;
    bool sellRecover;
    bool itemMagnet;
    bool freezeAllItems;
    bool unfreezeAllItemsAction;
    bool explodeAllItemsAction;
    bool flareRain;
    bool rocketRain;
    bool confettiSpam;
    bool spinAll;
    bool bounceAll;
    bool healAllAction;
    bool reviveAllLoop;
    bool randomScaleAll;
    bool quickActionTrigger;
    bool resetJumpHeight;
    bool infAmmoJetpack;
    bool stashAllowMoves;
    bool spamRainbowAll;
    // ALL ints next
    int itemGunIndex;
    int mobIndex;
    int selectedPlayer;
    int launcherItemIndex;
    int prefabIndex;
    int spawnItemIndex;
    int quickActionIndex;
    // ALL floats next
    float flySpeed;
    float speedMultiplier;
    float armLength;
    float menuAlpha;
    float menuScale;
    // padding + controller state
    int32_t _pad;
    bool rightGrab;
    bool leftGrab;
    bool rightTrigger;
    bool leftTrigger;
    bool blueprintRefreshQueued;
};
#pragma pack(pop)

class PipeServer {
public:
    bool Init() {
        SECURITY_ATTRIBUTES sa{};
        PSECURITY_DESCRIPTOR descriptor = CreateSytePipeDescriptor(sa);
        m_pipe = CreateNamedPipeA(PIPE_NAME,
            PIPE_ACCESS_OUTBOUND | FILE_FLAG_WRITE_THROUGH | FILE_FLAG_OVERLAPPED | FILE_FLAG_FIRST_PIPE_INSTANCE,
            PIPE_TYPE_BYTE | PIPE_NOWAIT | PIPE_REJECT_REMOTE_CLIENTS,
            1, sizeof(PipeModState) * 2, 0, 0, descriptor ? &sa : nullptr);
        if (m_pipe == INVALID_HANDLE_VALUE) {
            printf("[syte] Pipe create failed: %lu\n", GetLastError());
            return false;
        }
        printf("[syte] Pipe created: %s (size=%zu)\n", PIPE_NAME, sizeof(PipeModState));
        
        // Create response pipe for reading player data
        m_responsePipe = CreateNamedPipeA(PIPE_RESPONSE_NAME,
            PIPE_ACCESS_INBOUND | FILE_FLAG_OVERLAPPED | FILE_FLAG_FIRST_PIPE_INSTANCE,
            PIPE_TYPE_BYTE | PIPE_NOWAIT | PIPE_REJECT_REMOTE_CLIENTS,
            1, 0, sizeof(PipePlayerData), 0, descriptor ? &sa : nullptr);
        if (descriptor) LocalFree(descriptor);
        if (m_responsePipe == INVALID_HANDLE_VALUE) {
            printf("[syte] Response pipe create failed: %lu\n", GetLastError());
        } else {
            printf("[syte] Response pipe created: %s\n", PIPE_RESPONSE_NAME);
        }
        
        m_overlapped = {};
        m_overlapped.hEvent = CreateEventA(nullptr, TRUE, FALSE, nullptr);
        m_responseOverlapped = {};
        m_responseOverlapped.hEvent = CreateEventA(nullptr, TRUE, FALSE, nullptr);
        m_writeOverlapped = {};
        m_writeOverlapped.hEvent = CreateEventA(nullptr, TRUE, FALSE, nullptr);
        StartConnect();
        StartResponseConnect();
        return true;
    }

    void StartConnect() {
        if (m_connected || m_connectPending) return;
        m_connectPending = ConnectNamedPipe(m_pipe, &m_overlapped);
        DWORD err = GetLastError();
        if (m_connectPending) {
            m_connectPending = true;
        } else if (err == ERROR_PIPE_CONNECTED) {
            m_connected = true;
            m_connectPending = false;
            printf("[syte] Pipe client connected\n");
        } else if (err == ERROR_IO_PENDING) {
            m_connectPending = true;
        } else {
            m_connectPending = false;
        }
    }
    
    void StartResponseConnect() {
        if (m_responseConnected || m_responseConnectPending) return;
        if (m_responsePipe == INVALID_HANDLE_VALUE) return;
        m_responseConnectPending = ConnectNamedPipe(m_responsePipe, &m_responseOverlapped);
        DWORD err = GetLastError();
        if (err == ERROR_PIPE_CONNECTED) {
            m_responseConnected = true;
            m_responseConnectPending = false;
            printf("[syte] Response pipe client connected\n");
        } else if (err == ERROR_IO_PENDING) {
            m_responseConnectPending = true;
        } else {
            m_responseConnectPending = false;
        }
    }

    void Poll() {
        if (!m_connected && m_connectPending) {
            DWORD bytes = 0;
            if (GetOverlappedResult(m_pipe, &m_overlapped, &bytes, FALSE)) {
                m_connected = true;
                m_connectPending = false;
                printf("[syte] Pipe client connected\n");
            } else if (GetLastError() != ERROR_IO_INCOMPLETE) {
                m_connectPending = false;
            }
        }
        if (!m_connected && !m_connectPending) {
            StartConnect();
        }
        
        // Poll response pipe
        if (!m_responseConnected && m_responseConnectPending) {
            DWORD bytes = 0;
            if (GetOverlappedResult(m_responsePipe, &m_responseOverlapped, &bytes, FALSE)) {
                m_responseConnected = true;
                m_responseConnectPending = false;
                printf("[syte] Response pipe client connected\n");
            } else if (GetLastError() != ERROR_IO_INCOMPLETE) {
                m_responseConnectPending = false;
            }
        }
        if (!m_responseConnected && !m_responseConnectPending) {
            StartResponseConnect();
        }
        if (m_connected && !m_clientValidated) {
            if (!IsAnimalCompanyPipeClient(m_pipe)) {
                printf("[syte] Rejected unauthorized pipe client\n");
                m_connected = false;
                DisconnectNamedPipe(m_pipe);
                StartConnect();
            } else {
                m_clientValidated = true;
            }
        }
        if (m_responseConnected && !m_responseClientValidated) {
            if (!IsAnimalCompanyPipeClient(m_responsePipe)) {
                printf("[syte] Rejected unauthorized response client\n");
                m_responseConnected = false;
                DisconnectNamedPipe(m_responsePipe);
                StartResponseConnect();
            } else {
                m_responseClientValidated = true;
            }
        }
    }
    
    bool ReadPlayerData(PipePlayerData& data) {
        if (!m_responseConnected || m_responsePipe == INVALID_HANDLE_VALUE) return false;
        DWORD avail = 0;
        if (!PeekNamedPipe(m_responsePipe, nullptr, 0, nullptr, &avail, nullptr)) {
            if (GetLastError() == ERROR_BROKEN_PIPE) {
                m_responseConnected = false;
                m_responseClientValidated = false;
                DisconnectNamedPipe(m_responsePipe);
                StartResponseConnect();
            }
            return false;
        }
        if (avail < sizeof(PipePlayerData)) return false;
        
        OVERLAPPED ov = {};
        ov.hEvent = CreateEventA(nullptr, TRUE, FALSE, nullptr);
        DWORD bytesRead = 0;
        BOOL ok = ReadFile(m_responsePipe, &data, sizeof(data), &bytesRead, &ov);
        if (!ok && GetLastError() == ERROR_IO_PENDING) {
            WaitForSingleObject(ov.hEvent, 16);
            ok = GetOverlappedResult(m_responsePipe, &ov, &bytesRead, FALSE);
        }
        CloseHandle(ov.hEvent);
        
        if (!ok && GetLastError() == ERROR_BROKEN_PIPE) {
            m_responseConnected = false;
            m_responseClientValidated = false;
            DisconnectNamedPipe(m_responsePipe);
            StartResponseConnect();
            return false;
        }
        
        if (!ok || bytesRead != sizeof(PipePlayerData) || data.numPlayers > MAX_PLAYERS)
            return false;
        for (uint32_t i = 0; i < data.numPlayers; ++i)
            data.playerNames[i][MAX_PLAYER_NAME - 1] = '\0';
        return true;
    }

    void Write(const PipeModState& state) {
        if (!m_connected) return;
        if (m_writePending) {
            DWORD completed = 0;
            if (!GetOverlappedResult(m_pipe, &m_writeOverlapped, &completed, FALSE)) {
                if (GetLastError() == ERROR_IO_INCOMPLETE) return;
                m_writePending = false;
                m_connected = false;
                DisconnectNamedPipe(m_pipe);
                StartConnect();
                return;
            }
            m_writePending = false;
        }
        // OVERLAPPED I/O may outlive this function. Never pass the caller's
        // stack-backed frame directly to WriteFile.
        m_writeBuffer = state;
        ResetEvent(m_writeOverlapped.hEvent);
        m_writeOverlapped.Offset = 0;
        m_writeOverlapped.OffsetHigh = 0;
        DWORD written = 0;
        BOOL ok = WriteFile(m_pipe, &m_writeBuffer, sizeof(m_writeBuffer), &written, &m_writeOverlapped);
        if (!ok && GetLastError() == ERROR_IO_PENDING) {
            m_writePending = true;
            return;
        }
        if (!ok && GetLastError() == ERROR_BROKEN_PIPE) {
            m_connected = false;
            m_clientValidated = false;
            DisconnectNamedPipe(m_pipe);
            StartConnect();
        }
    }

    bool IsConnected() const { return m_connected; }

    void Shutdown() {
        if (m_overlapped.hEvent) CloseHandle(m_overlapped.hEvent);
        if (m_responseOverlapped.hEvent) CloseHandle(m_responseOverlapped.hEvent);
        if (m_writeOverlapped.hEvent) CloseHandle(m_writeOverlapped.hEvent);
        if (m_pipe != INVALID_HANDLE_VALUE) {
            FlushFileBuffers(m_pipe);
            DisconnectNamedPipe(m_pipe);
            CloseHandle(m_pipe);
            m_pipe = INVALID_HANDLE_VALUE;
        }
        if (m_responsePipe != INVALID_HANDLE_VALUE) {
            DisconnectNamedPipe(m_responsePipe);
            CloseHandle(m_responsePipe);
            m_responsePipe = INVALID_HANDLE_VALUE;
        }
    }

private:
    HANDLE m_pipe = INVALID_HANDLE_VALUE;
    HANDLE m_responsePipe = INVALID_HANDLE_VALUE;
    bool m_connected = false;
    bool m_connectPending = false;
    bool m_responseConnected = false;
    bool m_clientValidated = false;
    bool m_responseClientValidated = false;
    bool m_responseConnectPending = false;
    OVERLAPPED m_overlapped = {};
    OVERLAPPED m_responseOverlapped = {};
    OVERLAPPED m_writeOverlapped = {};
    bool m_writePending = false;
    PipeModState m_writeBuffer{};
};

class BridgePipeReader {
public:
    bool Init() {
        SECURITY_ATTRIBUTES sa{};
        PSECURITY_DESCRIPTOR descriptor = CreateSytePipeDescriptor(sa);
        m_pipe = CreateNamedPipeA(PIPE_BRIDGE_NAME,
            PIPE_ACCESS_INBOUND | FILE_FLAG_OVERLAPPED | FILE_FLAG_FIRST_PIPE_INSTANCE,
            PIPE_TYPE_BYTE | PIPE_READMODE_BYTE | PIPE_REJECT_REMOTE_CLIENTS,
            1, sizeof(PipeModState) * 2, 0, 0, descriptor ? &sa : nullptr);
        if (descriptor) LocalFree(descriptor);
        if (m_pipe == INVALID_HANDLE_VALUE) {
            printf("[syte] Bridge pipe create failed: %lu\n", GetLastError());
            return false;
        }
        printf("[syte] Bridge pipe created: %s\n", PIPE_BRIDGE_NAME);
        m_overlapped = {};
        m_overlapped.hEvent = CreateEventA(nullptr, TRUE, FALSE, nullptr);
        StartConnect();
        return true;
    }

    void StartConnect() {
        if (m_connected || m_connectPending) return;
        m_connectPending = ConnectNamedPipe(m_pipe, &m_overlapped);
        DWORD err = GetLastError();
        if (err == ERROR_PIPE_CONNECTED) {
            m_connected = true;
            m_connectPending = false;
            printf("[syte] Bridge client connected\n");
        } else if (err == ERROR_IO_PENDING) {
            m_connectPending = true;
        } else {
            m_connectPending = false;
        }
    }

    void Poll() {
        if (!m_connected && m_connectPending) {
            DWORD bytes = 0;
            if (GetOverlappedResult(m_pipe, &m_overlapped, &bytes, FALSE)) {
                m_connected = true;
                m_connectPending = false;
                printf("[syte] Bridge client connected\n");
            } else if (GetLastError() != ERROR_IO_INCOMPLETE) {
                m_connectPending = false;
            }
        }
        if (!m_connected && !m_connectPending) StartConnect();

        if (m_connected && !m_clientValidated) {
            if (!IsAnimalCompanyPipeClient(m_pipe)) {
                printf("[syte] Rejected unauthorized bridge client\n");
                m_connected = false;
                m_hasData = false;
                DisconnectNamedPipe(m_pipe);
                StartConnect();
            } else {
                m_clientValidated = true;
            }
        }

        if (m_connected) {
            DWORD avail = 0;
            if (PeekNamedPipe(m_pipe, nullptr, 0, nullptr, &avail, nullptr)) {
                while (avail >= sizeof(PipeModState)) {
                    PipeModState frame{};
                    DWORD bytesRead = 0;
                    OVERLAPPED ov = {};
                    ov.hEvent = CreateEventA(nullptr, TRUE, FALSE, nullptr);
                    BOOL ok = ReadFile(m_pipe, &frame, sizeof(frame), &bytesRead, &ov);
                    if (!ok && GetLastError() == ERROR_IO_PENDING) {
                        WaitForSingleObject(ov.hEvent, 16);
                        ok = GetOverlappedResult(m_pipe, &ov, &bytesRead, FALSE);
                    }
                    CloseHandle(ov.hEvent);
                    if (ok && bytesRead == sizeof(PipeModState) && frame.version == 1) {
                        m_lastState = frame;
                        m_hasData = true;
                    }
                    avail = 0;
                    PeekNamedPipe(m_pipe, nullptr, 0, nullptr, &avail, nullptr);
                }
            } else if (GetLastError() == ERROR_BROKEN_PIPE) {
                m_connected = false;
                m_clientValidated = false;
                DisconnectNamedPipe(m_pipe);
                StartConnect();
                m_hasData = false;
            }
        }
    }

    bool HasData() const { return m_hasData; }
    PipeModState GetState() const { return m_lastState; }

    void Shutdown() {
        if (m_overlapped.hEvent) CloseHandle(m_overlapped.hEvent);
        if (m_pipe != INVALID_HANDLE_VALUE) {
            DisconnectNamedPipe(m_pipe);
            CloseHandle(m_pipe);
            m_pipe = INVALID_HANDLE_VALUE;
        }
    }

private:
    HANDLE m_pipe = INVALID_HANDLE_VALUE;
    bool m_connected = false;
    bool m_connectPending = false;
    bool m_hasData = false;
    bool m_clientValidated = false;
    PipeModState m_lastState{};
    OVERLAPPED m_overlapped = {};
};

class TokenPipeReader {
public:
    bool Init() {
        SECURITY_ATTRIBUTES sa{};
        PSECURITY_DESCRIPTOR descriptor = CreateSytePipeDescriptor(sa);
        m_pipe = CreateNamedPipeA(PIPE_TOKEN_NAME,
            PIPE_ACCESS_INBOUND | FILE_FLAG_OVERLAPPED | FILE_FLAG_FIRST_PIPE_INSTANCE,
            PIPE_TYPE_BYTE | PIPE_READMODE_BYTE | PIPE_REJECT_REMOTE_CLIENTS,
            1, 0, 8192, 0, descriptor ? &sa : nullptr);
        if (descriptor) LocalFree(descriptor);
        if (m_pipe == INVALID_HANDLE_VALUE) {
            printf("[syte] Token pipe create failed: %lu\n", GetLastError());
            return false;
        }
        printf("[syte] Token pipe created: %s\n", PIPE_TOKEN_NAME);
        m_overlapped = {};
        m_overlapped.hEvent = CreateEventA(nullptr, TRUE, FALSE, nullptr);
        StartConnect();
        return true;
    }

    void StartConnect() {
        if (m_connected || m_connectPending) return;
        m_connectPending = ConnectNamedPipe(m_pipe, &m_overlapped);
        DWORD err = GetLastError();
        if (err == ERROR_PIPE_CONNECTED) {
            m_connected = true;
            m_connectPending = false;
            printf("[syte] Token pipe client connected\n");
        } else if (err == ERROR_IO_PENDING) {
            m_connectPending = true;
        } else {
            m_connectPending = false;
        }
    }

    void Poll() {
        if (!m_connected && m_connectPending) {
            DWORD bytes = 0;
            if (GetOverlappedResult(m_pipe, &m_overlapped, &bytes, FALSE)) {
                m_connected = true;
                m_connectPending = false;
                printf("[syte] Token pipe client connected\n");
            } else if (GetLastError() != ERROR_IO_INCOMPLETE) {
                m_connectPending = false;
            }
        }
        if (!m_connected && !m_connectPending) StartConnect();

        if (m_connected && !m_clientValidated) {
            if (!IsAnimalCompanyPipeClient(m_pipe)) {
                printf("[syte] Rejected unauthorized token client\n");
                m_connected = false;
                m_hasToken = false;
                m_token.clear();
                DisconnectNamedPipe(m_pipe);
                StartConnect();
            } else {
                m_clientValidated = true;
            }
        }

        if (m_connected) {
            DWORD avail = 0;
            if (PeekNamedPipe(m_pipe, nullptr, 0, nullptr, &avail, nullptr)) {
                while (avail >= 4) {
                    DWORD bytesRead = 0;
                    OVERLAPPED ov = {};
                    ov.hEvent = CreateEventA(nullptr, TRUE, FALSE, nullptr);
                    DWORD tokenLen = 0;
                    BOOL ok = ReadFile(m_pipe, &tokenLen, 4, &bytesRead, &ov);
                    if (!ok && GetLastError() == ERROR_IO_PENDING) {
                        WaitForSingleObject(ov.hEvent, 16);
                        ok = GetOverlappedResult(m_pipe, &ov, &bytesRead, FALSE);
                    }
                    CloseHandle(ov.hEvent);
                    if (!ok || bytesRead != 4 || tokenLen == 0 || tokenLen > 8000) break;
                    char tokenBuf[8192] = {};
                    DWORD read2 = 0;
                    OVERLAPPED ov2 = {};
                    ov2.hEvent = CreateEventA(nullptr, TRUE, FALSE, nullptr);
                    ok = ReadFile(m_pipe, tokenBuf, tokenLen, &read2, &ov2);
                    if (!ok && GetLastError() == ERROR_IO_PENDING) {
                        WaitForSingleObject(ov2.hEvent, 16);
                        ok = GetOverlappedResult(m_pipe, &ov2, &read2, FALSE);
                    }
                    CloseHandle(ov2.hEvent);
                    if (ok && read2 == tokenLen) {
                        tokenBuf[read2] = '\0';
                        m_token = std::string(tokenBuf, read2);
                        m_hasToken = true;
                        printf("[syte] Auto-extracted JWT token (%lu chars)\n", tokenLen);
                    }
                    avail = 0;
                    PeekNamedPipe(m_pipe, nullptr, 0, nullptr, &avail, nullptr);
                }
            } else if (GetLastError() == ERROR_BROKEN_PIPE) {
                m_connected = false;
                m_clientValidated = false;
                DisconnectNamedPipe(m_pipe);
                StartConnect();
                m_hasToken = false;
            }
        }
    }

    bool HasToken() const { return m_hasToken; }
    std::string GetToken() const { return m_token; }

    void Shutdown() {
        if (m_overlapped.hEvent) CloseHandle(m_overlapped.hEvent);
        if (m_pipe != INVALID_HANDLE_VALUE) {
            DisconnectNamedPipe(m_pipe);
            CloseHandle(m_pipe);
            m_pipe = INVALID_HANDLE_VALUE;
        }
    }

private:
    HANDLE m_pipe = INVALID_HANDLE_VALUE;
    bool m_connected = false;
    bool m_connectPending = false;
    bool m_hasToken = false;
    bool m_clientValidated = false;
    std::string m_token;
    OVERLAPPED m_overlapped = {};
};
