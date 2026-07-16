#pragma once
#include "memory.h"
#include "offsets.h"
#include <string>
#include <vector>
#include <cmath>

struct Vec3 {
    float x = 0, y = 0, z = 0;
    Vec3() = default;
    Vec3(float x, float y, float z) : x(x), y(y), z(z) {}
    Vec3 operator+(const Vec3& o) const { return {x+o.x, y+o.y, z+o.z}; }
    Vec3 operator-(const Vec3& o) const { return {x-o.x, y-o.y, z-o.z}; }
    Vec3 operator*(float s) const { return {x*s, y*s, z*s}; }
    float length() const { return sqrtf(x*x + y*y + z*z); }
    Vec3 normalized() const { float l = length(); return l > 0 ? *this * (1.0f/l) : Vec3(); }
};

struct Quat {
    float x = 0, y = 0, z = 0, w = 1;
};

#define MAX_PLAYERS 24
#define MAX_PLAYER_NAME 64

struct ModState {
    bool flyEnabled = false;
    float flySpeed = 1.0f;
    bool speedEnabled = false;
    float speedMultiplier = 2.0f;
    bool noclipEnabled = false;
    bool invisibleEnabled = false;
    bool longArmsEnabled = false;
    float armLength = 1.5f;
    bool teleportEnabled = false;
    bool grabAllEnabled = false;
    bool itemGunEnabled = false;
    int itemGunIndex = 0;
    bool tagGunEnabled = false;
    bool kickGunEnabled = false;
    bool instaKillGun = false;
    bool teleportGunEnabled = false;
    bool spazEnabled = false;
    bool freezeEnabled = false;
    bool freezeInMenu = false;
    int handFlyHand = 0;
    bool handFlyTrigger = true;
    bool handFlyGrip = false;
    bool handFlyPrimary = false;
    bool handFlySecondary = false;
    int velFlyHand = 0;
    bool velFlyTrigger = false;
    bool velFlyGrip = false;
    bool velFlyPrimary = false;
    bool velFlySecondary = false;
    bool triggerCloneSpawn = false;
    bool spawnClonesQueued = false;
    bool rigFollowEnabled = false;
    bool orbitClonesEnabled = false;
    bool cloneLineMode = false;
    bool clearClonesQueued = false;
    bool bringAllItemsQueued = false;
    bool deleteAllMobs = false;
    bool bringAllItems = false;
    bool goopSpamEnabled = false;
    float menuAlpha = 0.92f;
    bool showPlayerList = false;
    int selectedTab = 0;
    int selectedItem = 0;

    int numPlayers = 0;
    int selectedPlayer = 0;
    char playerNames[MAX_PLAYERS][MAX_PLAYER_NAME];

    bool godMode = false;
    bool invincible = false;
    bool infFarts = false;
    bool blueNameTags = false;
    bool fullbright = false;
    bool infAmmoAll = false;
    bool noRecoil = false;
    bool noWeaponCooldown = false;
    bool rocketFist = false;
    bool boomspearFist = false;
    bool eggFist = false;
    bool bombArrowFist = false;
    bool flareFist = false;
    bool robotDogFist = false;
    bool carFist = false;

    bool rainbowSelf = false;
    bool rainbowAll = false;
    bool spamRainbowAll = false;
    bool colorGun = false;
    bool bigHands = false;
    bool normalSize = false;
    bool playerESP = false;
    bool rgbMenu = false;

    bool superSmoothFly = false;
    bool handPlatforms = false;
    bool triggerFly = false;
    bool superJump = false;
    bool maxJumpHeight = false;
    bool resetJumpHeight = false;
    bool infSprint = false;
    bool jetpackInfFuel = false;
    bool infAmmoJetpack = false;
    bool infAmmoFlareGun = false;
    bool infAmmoRevolver = false;
    bool infAmmoShotgun = false;
    bool infAmmoRPG = false;
    bool infAmmoZipline = false;
    bool infAmmoArenaGun = false;

    bool autoKickAll = false;
    bool tpToLake = false;
    bool tpToMoon = false;
    bool tpToSewers = false;
    bool tpToSpawn = false;
    bool tpToWaterTower = false;
    bool tpToSkybox = false;
    bool tpToVoid = false;
    bool tpAllToMe = false;
    bool tpMeToRandom = false;

    bool orbitPlayers = false;
    bool pullAll = false;
    bool floatAll = false;
    bool gravityAll = false;
    bool dragAll = false;
    bool floatFreezeAll = false;
    bool tpAllToVoid = false;
    bool rainItems = false;
    bool launchAll = false;
    bool explodeAll = false;

    bool kickGun = false;
    bool pushGun = false;
    bool flingGun = false;
    bool tpAllGun = false;
    bool explosionGun = false;
    bool launchAllGun = false;
    bool orbitGun = false;
    bool ragdollAllGun = false;
    bool greenScreenGun = false;

    bool stashDupe = false;
    bool backpackDupe = false;
    bool stashAllowMoves = false;
    bool arenaNoDespawn = false;

    int spawnItemIndex = 0;
    bool spawnGun = false;
    bool deleteAllItems = false;
    bool deleteItemGun = false;
    bool launcherGun = false;
    bool crateGun = false;
    bool handDuper = false;
    bool deleteHeldItem = false;
    bool noGravityHeld = false;
    bool addGravityHeld = false;
    bool scaleHeldUp = false;
    bool scaleHeldDown = false;
    bool yeetGun = false;
    bool spawnMobGun = false;
    int mobIndex = 0;
    bool killAllMobs = false;

    bool deleteAllPrefabs = false;
    bool prefabGun = false;
    int prefabIndex = 0;
    bool customPrefabOrbit = false;
    bool christmasOrbit = false;
    bool sellingMachineOrbit = false;
    bool carOrbit = false;
    bool christmasBoxHand = false;
    bool sellingMachineHand = false;
    bool carHand = false;
    bool playerOrbitFast = false;

    bool speedBuff = false;
    bool strengthBuff = false;
    bool stealthBuff = false;
    bool allBuffs = false;
    bool buffAllPlayers = false;
    bool buffSpam = false;
    bool spamBuffAll = false;

    bool arenaStartSpam = false;
    bool infiniteHoverpad = false;
    bool arenaItemBurst = false;
    bool spawnAllWeapons = false;
    bool spawnItemAtHand = false;
    bool spawnMobAtHand = false;
    bool spawnConfettiBurst = false;

    bool shopUnlock = false;
    bool blueprintAbuse = true;
    bool openAllDoors = false;
    bool closeAllDoors = false;
    bool popAllBalloons = false;
    bool toggleBoomboxes = false;
    bool dupeMachineMax = false;
    bool activateTeleporters = false;
    bool thunderStrike = false;

    bool spawnSellingMachine = false;
    bool spawnDupeMachine = false;
    bool sellAllItems = false;
    bool sellingSpasm = false;
    bool flushAllToilets = false;
    bool toiletSpam = false;
    bool toiletPaperBurst = false;

    bool giveLotsOfNuts = false;
    bool giveLotsOfCC = false;
    bool giveResearchPoints = false;
    bool unlockAllItems = false;
    bool rpcKillAll = false;
    bool rpcReviveAll = false;
    bool rpcTPAllToMe = false;
    bool rpcStunAll = false;
    bool rpcLaunchAll = false;
    bool instaKillAll = false;
    bool blockRpcApplyBuff = false;
    bool blockRpcAddForce = false;
    bool blockRpcTeleport = false;
    bool blockRpcStinky = false;
    bool blockRpcStun = false;
    bool blockRpcSetColor = false;
    bool blockRpcKick = false;
    bool noRedWatch = false;
    bool noBackpackRemove = false;
    bool infiniteGunStats = false;
    bool infHealth = false;
    bool bagInfCapacity = false;
    bool quiverInfCapacity = false;
    bool noShotgunCooldown = false;
    bool infSellValue = false;
    bool spawnNetPlayerTrigger = false;
    bool joystickFly = false;
    bool arenaESP = false;
    bool rpgHandsAll = false;
    bool stealItemGun = false;
    bool randomHandDuper = false;
    bool bagBomb = false;
    bool cashQuiverHand = false;
    bool addToBag = false;
    bool itemLauncherAll = false;
    bool itemTornado = false;
    bool lagAllItems = false;
    bool customHueHeld = false;
    bool customSaturationHeld = false;
    bool customScaleHeld = false;
    bool rainbowHeldItem = false;
    bool rainbowAllItems = false;
    bool randomHeldItem = false;
    bool randomAllItems = false;
    bool multiShoot = false;
    bool rapidFire = false;
    bool grantAllStashSlots = false;
    bool noContainerRestrictions = false;
    bool cageAllPlayers = false;
    bool infDamage = false;
    bool voidGun = false;
    bool getPlayerInfoGun = false;
    bool deletePlayerGun = false;
    bool bringAllItemsGun = false;
    bool nutPickupGun = false;
    bool ammoPickupGun = false;
    bool launchMeUp = false;
    bool stunMeAction = false;
    bool killMeAction = false;
    bool reviveMeAction = false;
    bool tagStinkySelf = false;
    bool wantedSelf = false;
    bool colorRedSelf = false;
    bool resetColorSelf = false;
    bool reviveGun = false;
    bool stinkyGun = false;
    bool pissGun = false;
    bool vfxSpammerGun = false;
    bool prefabSpawnGun = false;
    bool deleteObjGun = false;
    bool forceGrabGun = false;
    bool oreSpawnGun = false;
    bool rigDuperGun = false;
    bool startArenaAction = false;
    bool endArenaAction = false;
    bool arenaSpammer = false;
    bool arenaTeam1 = false;
    bool arenaTeam2 = false;
    bool arenaEnterMap = false;
    bool arenaExitMap = false;
    bool arenaOreBurst = false;
    bool arenaGunsBurst = false;
    bool spawnBlackhole = false;
    bool spawnCoreTeleporter = false;
    bool spawnSpaceship = false;
    bool spawnNetworkLever = false;
    bool spawnClawMachine = false;
    bool spawnSellMachine = false;
    bool spawnMoneyGun = false;
    bool spawnScanner = false;
    bool spamThunder = false;
    bool flushToiletsAction = false;
    bool spamToilets = false;
    bool rigBurst5 = false;
    bool spamRigs = false;
    bool rigSpasm = false;
    bool rigAtHand = false;
    bool rigRain = false;
    bool stinkyAll = false;
    bool shakeAll = false;
    bool growAll = false;
    bool smallAll = false;
    bool resetSizeAll = false;
    bool muteAll = false;
    bool loudAll = false;
    bool stunAll = false;
    bool rainbowItemLauncher = false;
    bool robotRocketLauncher = false;
    bool rocketSpearLauncher = false;
    bool rocketEggLauncher = false;
    bool flareLauncher = false;
    bool buggyLauncher = false;
    bool giveawayBagLauncher = false;
    bool oreLauncher = false;
    bool itemRainV2 = false;
    bool voxelNuke = false;
    bool breakAllOres = false;
    bool clearAllOres = false;
    bool hellOreRing = false;
    bool elevatorSpam = false;
    bool machineToMe = false;
    bool sellButtonSpam = false;
    bool spamDupeJuice = false;
    bool spawnShadowBoss = false;
    bool shadowBossToMe = false;
    bool toggleAllBoomboxesV2 = false;
    bool lockItemPosition = false;
    bool grabItemAnywhere = false;
    bool goopFishGun = false;
    bool blackholeGun = false;
    bool scannerGun = false;
    bool moneyRain = false;
    bool balloonRain = false;
    bool randomPrefabRain = false;
    bool reviveAllAction = false;
    bool wantedAll = false;
    bool redAll = false;
    bool resetColorAll = false;
    bool spawnJuiceMachine = false;
    bool sellExplode = false;
    bool sellRecover = false;
    bool itemMagnet = false;
    bool freezeAllItems = false;
    bool unfreezeAllItemsAction = false;
    bool explodeAllItemsAction = false;
    bool flareRain = false;
    bool rocketRain = false;
    bool confettiSpam = false;
    bool spinAll = false;
    bool bounceAll = false;
    bool healAllAction = false;
    bool reviveAllLoop = false;
    bool randomScaleAll = false;
    bool quickActionTrigger = false;
    bool blueprintRefreshQueued = false;
    int quickActionIndex = 0;
    int blueprintIndex = 0;
    bool coverAllGoopfish = false;
    bool pissMod = false;
    bool nightAlarm = false;
    bool unlockAll = false;

    bool kickAllGrip = false;

    bool wlFly = false;
    bool wlRocket = false;
    bool wlFlare = false;
    bool wlCar = false;
    bool wlCrate = false;
    bool wlSuitcase = false;
    bool wlBomb = false;
    bool wlEgg = false;
    bool wlBalloon = false;
    bool wlGiveaway = false;
    bool wlSpazRainbow = false;
    bool wlDisintegrate = false;
    bool wlSpeedBuff = false;
    bool wlTornado = false;
    bool wlBlackHole = false;
    bool wlFlash = false;
    bool wlTeleport = false;
    bool wlKick = false;
    bool wlFreeze = false;
    bool wlItemStorm = false;
    bool wlFireworkShow = false;
    bool wlCage = false;

    bool noSpend = false;
    bool ownAllCosmetics = false;
    bool vendingBypass = false;
    bool infiniteFart2 = false;
    bool infiniteJetpack2 = false;
    bool stashQolFix = false;

    int selectedLauncherItem = 0;
    bool selectedItemLauncher = false;
    bool timebombLauncher = false;
    bool pelicanCaseLauncher = false;
    bool rareCardLauncher = false;
    bool rocketLauncher = false;

    bool userKick = false;
    bool userTP = false;
    bool userPull = false;
    bool showSelectedUser = false;

    float menuScale = 0.92f;
    int themeMode = 0;
    bool rightGrab = false;
    bool leftGrab = false;
    bool rightTrigger = false;
    bool leftTrigger = false;
};

inline ModState& GetModState() {
    static ModState state;
    return state;
}
