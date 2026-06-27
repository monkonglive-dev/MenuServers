function normalizePlayerToken(value) {
    try {
        if (value == null) return "";
        if (typeof value === "string") return value.trim();
        if (typeof value === "number" || typeof value === "boolean") return String(value).trim();
        if (value.content != null) return String(value.content).trim();
        return String(value).trim();
    } catch(_) {
        return "";
    }
}
function normalizeWhitelistToken(value) {
    return normalizePlayerToken(value).toLowerCase();
}
function getPlayerIdentityInfo(p): { key, label, aliases[] } {
    var aliases[] = [];
    var pushAlias = (value) => {
        var token = normalizePlayerToken(value);
        if (!token || token === "?" || aliases.includes(token)) return;
        aliases.push(token);
    };
    try { pushAlias(p.method("get_playerId").invoke()); } catch(_) {}
    try { pushAlias(p.field("_playerId").value); } catch(_) {}
    try { pushAlias(p.method("get_displayName").invoke()); } catch(_) {}
    try { pushAlias(p.field("_displayName").value); } catch(_) {}
    try { pushAlias(p.method("get_name").invoke()); } catch(_) {}
    try { pushAlias(p.method("ToString").invoke()); } catch(_) {}
    try {
        if (aliases.length === 0) {
            var fallbackName = p.method("get_gameObject").invoke()?.method("get_name").invoke();
            pushAlias(fallbackName);
        }
    } catch(_) {}
    var key = aliases[0] ?? "?";
    var label = aliases.length > 1 ? aliases[1] : key;
    return { key, label, aliases: aliases.length > 0 ? aliases : ["?"] };
}
function getPlayerName(p) {
    return getPlayerIdentityInfo(p).label;
}
function whitelistHasPlayer(p) {
    try {
        var info = getPlayerIdentityInfo(p);
        return info.aliases.some(alias => whitelist.includes(normalizeWhitelistToken(alias)));
    } catch(_) {
        return false;
    }
}
function normalizeSceneObjectHandle(obj) {
    try {
        if (!obj || obj.isNull?.()) return "";
        var handle = obj.handle;
        if (!handle) return "";
        return handle.toString();
    } catch(_) {
        return "";
    }
}
function whitelistAddPlayer(p) {
    var info = getPlayerIdentityInfo(p);
    for (var alias of info.aliases) {
        var token = normalizeWhitelistToken(alias);
        if (token && !whitelist.includes(token)) whitelist.push(token);
    }
    return info.label;
}
function whitelistRemovePlayer(p) {
    var info = getPlayerIdentityInfo(p);
    var removeSet = info.aliases.map(alias => normalizeWhitelistToken(alias));
    whitelist = whitelist.filter(entry => !removeSet.includes(normalizeWhitelistToken(entry)));
    return info.label;
}
var uxSelectedObject = null;   
var uxSelectedName = "none";
var freecamActive = false;
var freecamObj = null;         
var freecamPos = null;         
function uxGetTransform(go) {
    try { return go.method("get_transform").invoke(); } catch(_) { return null; }
}
function uxVec3Str(v) {
    try {
        var x = (v.field("x").value ).toFixed(3);
        var y = (v.field("y").value ).toFixed(3);
        var z = (v.field("z").value ).toFixed(3);
        return `(${x}, ${y}, ${z})`;
    } catch(_) { return "(?,?,?)"; }
}
function uxGetComponentNames(go)[] {
    var names[] = [];
    try {
        var comps = go.method("GetComponentsInChildren", 1)
            .inflate(Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.Component"))
            .invoke(false);
        if (!comps || comps.isNull()) return names;
        var len = comps.length;
        for (var i = 0; i < Math.min(len, 64); i++) {
            try {
                var c = comps.method("get_Item").invoke(i);
                var typeName = c.method("GetType").invoke().method("get_Name").invoke()?.content ?? "?";
                names.push(typeName);
            } catch(_) {}
        }
    } catch(_) {}
    return names;
}
var itemIDs = [
    "item_ac_cola",
	"item_pelican_case",
    "item_rpg",
    "item_alphablade",
    "item_anti_gravity_grenade",
    "item_arena_pistol",
    "item_arena_shotgun",
    "item_arrow",
    "item_arrow_bomb",
    "item_arrow_heart",
    "item_arrow_lightbulb",
    "item_arrow_teleport",
    "item_axe",
    "item_backpack",
    "item_backpack_black",
    "item_backpack_green",
    "item_backpack_large_base",
    "item_backpack_large_basketball",
    "item_backpack_large_clover",
    "item_backpack_pink",
    "item_backpack_realistic",
    "item_backpack_small_base",
    "item_backpack_white",
    "item_backpack_with_flashlight",
    "item_bait_beetle",
    "item_bait_fly",
    "item_bait_glowworm",
    "item_bait_magmar_ball",
    "item_bait_mouse_trap",
    "item_bait_sardine",
    "item_bait_shell",
    "item_bait_starfish",
    "item_bait_wallet",
    "item_balloon",
    "item_balloon_heart",
    "item_bamboo_fishing_rod",
    "item_banana",
    "item_banana_chips",
    "item_baseball_bat",
    "item_basic_fishing_rod",
    "item_beans",
    "item_big_cup",
    "item_bighead_larva",
    "item_bloodlust_vial",
    "item_boombox",
    "item_boombox_fishing",
    "item_boombox_neon",
    "item_boomerang",
    "item_box_fan",
    "item_brain_chunk",
    "item_broccoli_grenade",
    "item_broccoli_shrink_grenade",
    "item_broom",
    "item_broom_halloween",
    "item_bubble_gun",
    "item_burrito",
    "item_butcherpipe",
    "item_butcherspear",
    "item_butchersword",
    "item_calculator",
    "item_cardboard_box",
    "item_cardboard_dragon_body",
    "item_cardboard_dragon_head",
    "item_ceo_plaque",
    "item_chakra",
    "item_clapper",
    "item_cluster_grenade",
    "item_coconut_shell",
    "item_cola",
    "item_cola_large",
    "item_company_ration",
    "item_company_ration_heal",
    "item_cracker",
    "item_crate",
    "item_crossbow",
    "item_crossbow_heart",
    "item_crowbar",
    "item_cubetrident",
    "item_cutie_dead",
    "item_d20",
    "item_demon_sword",
    "item_disc",
    "item_disposable_camera",
    "item_dragons_claw",
    "item_drill",
    "item_drill_neon",
    "item_dynamite",
    "item_dynamite_cube",
    "item_egg",
    "item_electrical_tape",
    "item_eraser",
    "item_film_reel",
    "item_finger_board",
    "item_fish_boomfish",
    "item_fish_boot",
    "item_fish_bottled_message",
    "item_fish_carp",
    "item_fish_chewna",
    "item_fish_clam_hookshot",
    "item_fish_crappie",
    "item_fish_crispie",
    "item_fish_diamond_jade_koi",
    "item_fish_dollar_bill",
    "item_fish_dragonfish",
    "item_fish_fishsword",
    "item_fish_gold_fish",
    "item_fish_hydracarp",
    "item_fish_kissy",
    "item_fish_license_plate",
    "item_fish_magma_carp",
    "item_fish_nebula_fish",
    "item_fish_nutfish",
    "item_fish_rainbow_trout",
    "item_fish_rotten_fish",
    "item_fish_salmon",
    "item_fish_salmonster",
    "item_fish_scaldfish",
    "item_fish_seamine",
    "item_fish_shellfish_shield",
    "item_fish_spicy_salmon",
    "item_fish_tuna",
    "item_fish_yellowcake",
    "item_fishing_terminal_bait_button",
    "item_flamethrower",
    "item_flamethrower_skull",
    "item_flamethrower_skull_ruby",
    "item_flaregun",
    "item_flashbang",
    "item_flashlight",
    "item_flashlight_mega",
    "item_flashlight_red",
    "item_flipflop_realistic",
    "item_floppy3",
    "item_floppy5",
    "item_football",
    "item_friend_launcher",
    "item_frying_pan",
    "item_gameboy",
    "item_glowstick",
    "item_goldbar",
    "item_goldcoin",
    "item_goop",
    "item_goopfish",
    "item_great_sword",
    "item_grenade",
    "item_grenade_gold",
    "item_grenade_launcher",
    "item_guided_boomerang",
    "item_hammer_candy_cane",
    "item_harddrive",
    "item_hatchet",
    "item_hawaiian_drum",
    "item_heart_chunk",
    "item_heart_gun",
    "item_heartchocolatebox",
    "item_hh_key",
    "item_hookshot",
    "item_hookshot_sword",
    "item_hot_cocoa",
    "item_hoverpad",
    "item_impulse_grenade",
    "item_jetpack",
    "item_joystick",
    "item_joystick_inv_y",
    "item_keycard",
    "item_lance",
    "item_landmine",
    "item_landmine_bee",
    "item_lantern_cny",
    "item_large_banana",
    "item_lava_fishing_rod",
    "item_love_grenade",
    "item_megaphone",
    "item_metal_ball",
    "item_metal_ball_xmas",
    "item_metal_plate",
    "item_metal_plate_xmas",
    "item_metal_rod",
    "item_metal_rod_xmas",
    "item_metal_triangle",
    "item_momboss_box",
    "item_moneygun",
    "item_mountain_key",
    "item_mug",
    "item_needle",
    "item_nut",
    "item_nut_drop",
    "item_ogre_hands",
    "item_ore_copper_l",
    "item_ore_copper_m",
    "item_ore_copper_s",
    "item_ore_gold_l",
    "item_ore_gold_m",
    "item_ore_gold_s",
    "item_ore_hell",
    "item_ore_silver_l",
    "item_ore_silver_m",
    "item_ore_silver_s",
    "item_painting_canvas",
    "item_paperpack",
    "item_pickaxe",
    "item_pickaxe_cny",
    "item_pickaxe_cube",
    "item_pickaxe_realistic",
    "item_pinata_bat",
    "item_pineapple",
    "item_pipe",
    "item_pistol_dragon",
    "item_plank",
    "item_plunger",
    "item_pogostick",
    "item_police_baton",
    "item_popcorn",
    "item_portable_teleporter",
    "item_prop_scanner",
    "item_pumpkin_bomb",
    "item_pumpkin_pie",
    "item_pumpkinjack",
    "item_pumpkinjack_small",
    "item_quest_gy_skull",
    "item_quest_gy_skull_special",
    "item_quest_hlal_brain",
    "item_quest_hlal_eyeball",
    "item_quest_hlal_flesh",
    "item_quest_hlal_heart",
    "item_quest_key_graveyard",
    "item_quiver",
    "item_quiver_heart",
    "item_radiation_gun",
    "item_radioactive_broccoli",
    "item_radioactive_fishing_rod",
    "item_randombox_mobloot_big",
    "item_randombox_mobloot_medium",
    "item_randombox_mobloot_small",
    "item_randombox_mobloot_weapons",
    "item_randombox_mobloot_zombie",
    "item_rare_card",
    "item_remote_controller",
    "item_revolver",
    "item_revolver_ammo",
    "item_revolver_gold",
    "item_ring_buoy",
    "item_robo_monke",
    "item_robot_arm_left",
    "item_robot_arm_right",
    "item_robot_head",
    "item_rope",
    "item_rpg_ammo",
    "item_rpg_ammo_egg",
    "item_rpg_ammo_spear",
    "item_rpg_cny",
    "item_rpg_easter",
    "item_rpg_smshr",
    "item_rpg_spear",
    "item_rubberducky",
    "item_ruby",
    "item_saddle",
    "item_salmoncannon",
    "item_sawblade",
    "item_sawblade_launcher",
    "item_scanner",
    "item_scissors",
    "item_server_pad",
    "item_shield",
    "item_shield_bones",
    "item_shield_candy_cane",
    "item_shield_police",
    "item_shield_viking_1",
    "item_shield_viking_2",
    "item_shield_viking_3",
    "item_shield_viking_4",
    "item_shotgun",
    "item_shotgun_ammo",
    "item_shotgun_viper",
    "item_shovel",
    "item_shredder",
    "item_shrinking_broccoli",
    "item_skipole",
    "item_skishoe",
    "item_skishoe_2",
    "item_skishoe_3",
    "item_skishoe_4",
    "item_snail_friend",
    "item_snowball",
    "item_snowboard",
    "item_snowboard_2",
    "item_snowboard_3",
    "item_snowboard_4",
    "item_snowboard_auto",
    "item_spear_candy_cane",
    "item_special_fishing_rod",
    "item_special_fishing_rod_radar_part",
    "item_special_fishing_rod_with_radar",
    "item_stapler",
    "item_stash_grenade",
    "item_steel_beam",
    "item_steel_beam_xmas",
    "item_stellarsword_blue",
    "item_stellarsword_gold",
    "item_stick_armbones",
    "item_stick_bone",
    "item_sticker_dispenser",
    "item_sticky_dynamite",
    "item_stinky_cheese",
    "item_tablet",
    "item_tapedispenser",
    "item_tele_grenade",
    "item_tele_pearl",
    "item_teleport_gun",
    "item_theremin",
    "item_timebomb",
    "item_toilet_paper",
    "item_toilet_paper_mega",
    "item_toilet_paper_roll_empty",
    "item_token_circus",
    "item_trampoline",
    "item_treestick",
    "item_tripwire_explosive",
    "item_trophy",
    "item_truss",
    "item_truss_xmas",
    "item_turkey_leg",
    "item_turkey_whole",
    "item_ukulele",
    "item_ukulele_gold",
    "item_umbrella",
    "item_umbrella_clover",
    "item_umbrella_squirrel",
    "item_unidentified",
    "item_upsidedown_loot",
    "item_uranium_chunk_l",
    "item_uranium_chunk_m",
    "item_uranium_chunk_s",
    "item_viking_hammer",
    "item_viking_hammer_twilight",
    "item_war_fan",
    "item_wheelhandle",
    "item_wheelhandle_big",
    "item_whoopie",
    "item_wood_log",
    "item_wood_pallet",
    "item_wyrmpiercer",
    "item_zipline_gun",
    "item_zombie_meat"
];
var mobIDs: { name; id }[] = [
    { name: "Angler",              id: 1  },
    { name: "AnglerMad",           id: 2  },
    { name: "Armstrong",           id: 3  },
    { name: "ArmstrongMad",        id: 4  },
    { name: "Banshee",             id: 5  },
    { name: "Bomb",                id: 6  },
    { name: "Bomber",              id: 7  },
    { name: "BomberFlashbang",     id: 8  },
    { name: "BomberMad",           id: 9  },
    { name: "Chicken",             id: 10 },
    { name: "Cyst",                id: 11 },
    { name: "FakeGorilla",         id: 12 },
    { name: "BigHead",             id: 13 },
    { name: "RedGreen",            id: 14 },
    { name: "Phantom",             id: 15 },
    { name: "EvilEye",             id: 16 },
    { name: "GiantThrower",        id: 17 },
    { name: "RedGreenMad",         id: 18 },
    { name: "Spider",              id: 19 },
    { name: "FlyingSwarm",         id: 20 },
    { name: "NextBot",             id: 21 },
    { name: "Segway",              id: 22 },
    { name: "NextBotStatic",       id: 23 },
    { name: "EvilEyePinata",       id: 24 },
    { name: "EvilEyePinataLarge",  id: 25 },
    { name: "Lanky",               id: 26 },
    { name: "Blob",                id: 27 },
    { name: "Cutie",               id: 28 },
    { name: "SpiderCave",          id: 29 },
    { name: "ForestMob",           id: 30 },
    { name: "Mimic",               id: 31 },
    { name: "GraveyardBoss",       id: 32 },
    { name: "Ringmaster",          id: 33 },
    { name: "Puppet",              id: 34 },
    { name: "PolypMass",           id: 35 },
    { name: "RobotDog",            id: 36 },
    { name: "Shadow",              id: 37 },
    { name: "Heart",               id: 38 },
    { name: "Slimey",              id: 39 },
    { name: "ShadowBoss",          id: 40 },
    { name: "BigShark",            id: 41 },
    { name: "EdenZombie",          id: 42 },
    { name: "Skinwalker",          id: 43 },
    { name: "YinWorm",             id: 44 },
    { name: "YangWorm",            id: 45 },
    { name: "ArmstrongSpace",      id: 46 },
    { name: "Smiley",              id: 47 },
];
var VFXTypes = {
    None: 255,
    MuzzleFlash_Shotgun: 0,
    MuzzleFlash_FlareGun: 1,
    CrateBreak: 2,
    MuzzleFlash_SmallGun: 3,
    MuzzleFlash_GoldRevolver: 4,
    MuzzleFlash_DragonPistol: 5,
    MuzzleFlash_ViperShotgun: 6,
    Explosion_FlareGun: 32,
    Explosion_Coins: 33,
    Explosion_Nuts: 34,
    Explosion_Keys: 35,
    Explosion_Balloon: 36,
    Explosion_TeleGrenadeSrc: 37,
    Player_Touch_Lava: 38,
    Portal_Teleport: 39,
    Explosion_Coins_Vertical: 40,
    Autumn_Leaves_Burst: 41,
    Explosion_Feathers: 42,
    Explosion_Popcorn: 43,
    Electricity_Small: 44,
    Impact_Flaregun: 64,
    Impact_Snowball: 65,
    Impact_GoldRevolver: 66,
    Impact_MeleeHit: 67,
    Impact_BigGroundHit: 68,
    Impact_MeleeHit_CriticalSmall: 69,
    Impact_MeleeHit_CriticalLarge: 70,
    Impact_MeleeHit_AoE: 71,
    Research_ZiplineAttachDetach: 96,
    Research_Purchase1RP: 97,
    Research_Purchase5RP: 98,
    Research_Purchase10RP: 99,
    Research_PurchaseRPBundle: 100,
    Rope_ZiplineAttachDetach: 110,
    MeatExplosion_1: 128,
    MeatExplosion_2: 129,
    MeatExplosion_Headshot: 130,
    ServerRoomSplash_Small: 160,
    ServerRoomSplash_Big: 161,
    RAMActivationSparks: 162,
    GreenBlink: 170,
    ConfettiBurst: 174,
    Ethereal_Void: 180,
    MomBoss_NailBreak: 181,
    MidAirJump_Fart: 182,
    FuelExplosion: 183
};
var version = "1.25.6";
var menuName = "Monkongs Private";
var menu = null;
var reference = null;
var referenceCollider = null;
var buttonClickDelay = 0.0;
var LerpMenu = true;
var menuscale = 0.85;
var righthand = false;
var deltaTime = 0.0;
var time = 0.0;
var stashDupeEnabled = false;
var stashDupe = false;
var itemIndex = 0;
var itemGunDelay = 0;
var mobIndex = 0;
var mobGunDelay2 = 0;
var mobSpawnButtonLatched = false;
var mobSpawnGunTriggerLatched = false;
var flySpeed = 20;
var bgColor: [number, number, number, number]            = [0.325, 0.067, 0.784, 0.92];
var textColor: [number, number, number, number]          = [0.98, 0.92, 1.0, 1.0];
var buttonColor: [number, number, number, number]        = [0.541, 0.282, 1, 0.96];
var buttonPressedColor: [number, number, number, number] = [0.78, 0.34, 1.0, 1.0];
var menuAnimTime = 0;
var themeMode = 9; 
var rainbowStep = 0; 
var rainbowPresets: [number,number,number][] = [
    [1.0, 0.0, 0.0], 
    [1.0, 0.5, 0.0], 
    [1.0, 1.0, 0.0], 
    [0.0, 1.0, 0.0], 
    [0.0, 1.0, 1.0], 
    [0.0, 0.0, 1.0], 
    [0.5, 0.0, 1.0], 
    [1.0, 0.0, 1.0], 
];
var currentNotification = "";
var notifactionResetTime = 0;
var currentCategory = 0;
var currentPage = 0;
var hueVal = 0;
var satVal = 0;
var tagGunDelay = 0;
var frameCount = 0; 
var menuFontWarned = false;
var leftPrimary = false;
var leftSecondary = false;
var rightPrimary = false;
var rightSecondary = false;
var leftGrab = false;
var rightGrab = false;
var leftTrigger = false;
var rightTrigger = false;
var leftStick = false;
var rightStick = false;
var leftStickX = 0.0;
var leftStickY = 0.0;
var rightStickX = 0.0;
var rightStickY = 0.0;
var prevLeftGrab = false;
var prevRightGrab = false;
var joystickFlyVelocity: [number, number, number] = [0, 0, 0];
var fistFlyVelocity: [number, number, number] = [0, 0, 0];
var InfAmmo = false;
var noRecoil = false;
var noShotgunCooldown = false;
var rapidFireEnabled = false;
var rapidFirePulseDelay = 0;
var infDamage = false;
var launchAxisCache = new Map();
var ejectDupeAmount = 2;
var ejectDupeIndex = 0;
var ejectDupeValues = [1, 2, 5, 10, 20, 30, 50, 100];
var scaleVal = 0;
var cachedItems = null;
var backpackDupe = false;
var lagGunDelay = 0;
var mobGunDelay = 0;
var idGunDelay = 0;
var rpgHandsDelay = 0;
var rpcMoneyAllLoopDelay = 0;
var giveFlyAllDelay = 0;
var menuStructurePatched = false;
var dualRevolverPunchDelay = 0;
var netPlayerSpawnDelay = 0;
var deleteAllLobbyItemsDelay = 0;
var itemRainDelay = 0;
var bringAllItemsGunDelay = 0;
var bringAllItemsCursor = 0;
var goopSpamDelay = 0;
var itemLauncherSelfDelay = 0;
var heldItemDuplicateDelay = 0;
var kickGunDelay = 0;
var deletePlayerGunDelay = 0;
var randomAllItemsDelay = 0;
var allPlayerGunBuffsDelay = 0;
var lagAllItemsDelay = 0;
var textSpawnDelay = 0;
var testMoneySpawnDelay = 0;
var researchOreSpawnDelay = 0;
var researchOreFailNotifyDelay = 0;
var handStealDelay = 0;
var textSpawnedObjects[] = [];
var textBlueprintCache[] | null = null;
var randomAllItemsCursor = 0;
var wlTargetActionDelay = 0;
var whitelist[] = [];
var netplrs[] = [];
var whitelistDisintegrateDelays = {};
var whitelistGunRe = false;
var sellingmachineSpawns[] = [];
var presentSpawns[] = [];
var spawnedNetworkPrefabs[] = [];
var spawnedPersistentMobs[] = [];
var movementPlatformLeft = null;
var movementPlatformRight = null;
var platformSpawnDelay = 0;
var menuSnapNextFrame = false;
var orbiters[] = [];
var orbitprefabs[] = [];
var buggyOrbiters[] = [];
var buggyOrbitPrefabs[] = [];
var sharkOrbiters[] = [];
var sharkOrbitPrefabs[] = [];
var sellingTowerOrbiters[] = [];
var sellingTowerOrbitPrefabs[] = [];
var itemTornadoEntries[] = [];
var spazMachineEntries[] = [];
var transformForwardAxisCache = new Map();
var persistentMobEntries[] = [];
var wlSellingOrbitEntries[] = [];
var wlSellingOrbitPrefabs[] = [];
var wlOrbitAllTarget = null;
var wlOrbitAllPhase = 0;
var wlPissTarget = null;
var wlGunBuffTarget = null;
var wlRightHandDuperTarget = null;
var wlItemDuperHandTarget = null;
var wlStashEjectDuperTarget = null;
var wlItemDuperHandDelay = 0;
var mobOrbitEntries[] = [];
var prefabOrbitEntries[] = [];
var heldSellingMachine = null;
var forceDevModeEnabled = false;
var mobForceStayEnabled = false;
var mobSpawnAsyncBroken = false;
var forceAllStashSlotsEnabled = false;
var containerFreedomAuraEnabled = false;
var containerFreedomSweepDelay = 0;
var playerCagePrefabs[] = [];
var playerCageEntries[] = [];
var spawnedGoopObjects[] = [];
var roundCornersEnabled = false;
var menuOutlineEnabled = false;
var GunPointer = null;
var GunLine = null;
var vfxTypeEntries = Object.entries(VFXTypes).filter(([_, value]) => typeof value === "number") as [string, number][];
var selectedVfxIndex = Math.max(0, vfxTypeEntries.findIndex(([name]) => name === "ConfettiBurst"));
var vfxDispatchUnavailableUntil = 0;
var vfxNoRunnerLogTime = 0;
var vfxMethodNamesCache[] | null = null;
var nameTagsEnabled = false;
var arenaEspEnabled = false;
var adminLeaderboardEspEnabled = true;
var adminLeaderboardSelectedPlayer = null;
var adminLeaderboardSelectedName = "";
var adminLeaderboardOrbitEnabled = false;
var adminLeaderboardOrbitTarget = null;
var adminLeaderboardOrbitPhase = 0;
var adminLeaderboardMultiOrbitEnabled = false;
var adminLeaderboardMultiOrbitList[] = [];
var adminLeaderboardMultiOrbitPhase = 0;
var adminLeaderboardOrbitGunDelay = 0;
var arenaAimbotEnabled = false;
var imguiEnabled = false;
var imguiObj = null;
var imguiRefObj = null;
var imguiRefCollider = null;
var imguiMode = 0;
var modSearchQuery = "";
var multiBuyEnabled = false;
var multiBuyAmount = 5;
var multiBuyHookGuard = false;
var playerNameTagEntries = new Map();
var playerEspEntries = new Map();
var prefabIndex = 0;
var adminSpawnerMobPrefabs[] = [];
var prefabIDs[] = [
    "Shipwheel",
    "TeleportMachine",
    "FourLeafQuest_FourLeafSpawner",
    "EasterEgg_QuestSpawner",
    "RadarPartSpawner",
    "SimpleKeypadDoor",
    "GiantController_GraveyardBoss_backup",
    "MetaCameraControls",
    "GrenadeProjectile",
    "LaserMirror",
    "TeleportMachine",
    "mom_pillow",
    "RiggedPlank",
    "SharkScareTriggerObject",
    "Uvula",
    "BaitShopButton_Spawner",
    "NetworkedLever_SecretLeft",
    "CoreTeleporter",
    "LaserSource",
    "LaserSink",
    "grababble_fish_paper_message",
    "AutoDestroyItem_OilSplatter",
    "AutoDestroyItem_Splash0",
    "AutoDestroyItem_Splash1",
    "AutoDestroyItem_Splash2",
    "AutoDestroyItem_Splash3",
    "AutoDestroyItem_Splash4",
    "AutoDestroyItem_Splash5",
    "BarrelBeansDynamic",
    "BarrelBeansStatic",
    "BarrelExplodingDynamic",
    "BarrelExplodingStatic",
    "BarrelOilDynamic",
    "BarrelOilStatic",
    "Basketball",
    "BigBanana",
    "BigHatchdoorNetObject",
    "BigWheelhandleSpawner",
    "BonfireController",
    "BrainPowerPlug",
    "ChoppableTreeManager",
    "ChristmasBox",
    "ChristmasBoxManager",
    "ClawMachineNetObject",
    "DiggableGrave",
    "DummyPlayerTarget",
    "DummyTarget",
    "Duplicator",
    "EscherToyBlockObject",
    "ExplosiveEgg",
    "ExplosiveEggClustered",
    "FlareGunProjectile",
    "FortuneTellerNet",
    "FuelCanisterNetObject",
    "FuelCanisterSpawner",
    "GenericWorldItemSpawner",
    "GiantRockObject",
    "GiantRockObject_Fire",
    "GreenscreenNET",
    "HatchdoorGrabHandle",
    "HatchdoorNetObject",
    "HellAltar",
    "HH_LockedDoor",
    "HingedDoorNetworked",
    "HordeMobController",
    "HordeMobLobbyHandler",
    "InflatedBalloon",
    "InflatedHeartBalloon",
    "ItemSellingMachineController",
    "KeypadDoorNetObject",
    "LakePineapple_Spawner",
    "Landmine",
    "LeaderBoardMonsterKill",
    "LockedDoor_KeySpawner",
    "LockedShippingContainer_Quest",
    "LogQuestItemSpawner",
    "LootLantern",
    "Mausoleum_01",
    "MazeManager",
    "MimicSpawner_CemeteryTile1",
    "MimicSpawner_CemeteryTile3",
    "MomBoss",
    "MomBossController",
    "MomToyBlockObject",
    "MomToyBlockObject_DisappearOnDrop",
    "MountainKey_Spawner",
    "MovieTheater",
    "Net",
    "NetGameTimeManager",
    "NetLootSpawnGroup",
    "NetMobSpawnGroup",
    "NetPlayer",
    "NetSpectator",
    "Pillar_Arched_Broken_01",
    "RamEventNet",
    "remote_controller_receiver",
    "RobotDogRPG",
    "RPGRocket",
    "RPGRocketEgg",
    "RPGRocketSpear",
    "RuinTower_FloatingPlatform",
    "RuinTower_FloatingSmall",
    "ScaffoldTrap",
    "SkiRaceController",
    "Snail_Spawner",
    "SpaceshipTeleporter",
    "SpawnableZipline",
    "Spawner_Key",
    "StickyAnchor",
    "TeleportationManager",
    "ThunderController",
    "TubeMonster",
    "Vehicle_Buggy",
    "VHSQuests_VHSSpawner",
    "WinterFilm_ReelSpawner",
    "SpiderController",
];
var whitelistEnabled = true;
var soundFileIndex = 0;
var previousSoundKey = false;
var loadedBundles = {};
var loadedObjects = {};
Il2Cpp.perform(() => {
    // Wait until IL2CPP domain is ready
    var domainReady = false;
    while (!domainReady) {
        new Promise(r => setTimeout(r, 3000));
        try {
            var test = Il2Cpp.domain.assembly("AnimalCompany").image;
            if (test && !test.isNull()) domainReady = true;
        } catch(_) {}
    }
    var images = {
        "AnimalCompany".domain.assembly("AnimalCompany").image,
        "UnityEngine.CoreModule".domain.assembly("UnityEngine.CoreModule").image,
        "UnityEngine.PhysicsModule".domain.assembly("UnityEngine.PhysicsModule").image,
        "UnityEngine.UIModule".domain.assembly("UnityEngine.UIModule").image,
        "UnityEngine.UI".domain.assembly("UnityEngine.UI").image,
        "UnityEngine.TextRenderingModule".domain.assembly("UnityEngine.TextRenderingModule").image,
        "PhotonFusionNetworking".domain.assembly("Fusion.Runtime").image,
        "PhotonFusionNetworkingRealtime".domain.assembly("Fusion.Realtime").image,
        "Unity.TextMeshPro".domain.assembly("Unity.TextMeshPro").image,
        "UnityEngine.XRModule".domain.assembly("UnityEngine.XRModule").image,
        "UnityEngine.AudioModule".domain.assembly("UnityEngine.AudioModule").image,
        "Oculus.Platform".domain.assembly("Oculus.Platform").image,
    };
    var AssemblyCSharp           = images["AnimalCompany"];
    var UnityEngineCore          = images["UnityEngine.CoreModule"];
    var UnityEnginePhysics       = images["UnityEngine.PhysicsModule"];
    var UnityEngineUI            = images["UnityEngine.UI"];
    var UnityEngineUIModule      = images["UnityEngine.UIModule"];
    var UnityEngineTextRendering = images["UnityEngine.TextRenderingModule"];
    var PhotonFusionNetworking   = images["PhotonFusionNetworking"];
    var UnityTextMeshPro         = images["Unity.TextMeshPro"];
    var UnityEngineXR            = images["UnityEngine.XRModule"];
    var UnityEngineAudio         = images["UnityEngine.AudioModule"];
    var OculusPlatformSettings   = images["Oculus.Platform"].class("Oculus.Platform.PlatformSettings");
    var GTPlayerClass     = AssemblyCSharp.class("AnimalCompany.GorillaLocomotion");
    var NetPlayer         = AssemblyCSharp.class("AnimalCompany.NetPlayer");
    var ElevatorManager         = AssemblyCSharp.class("AnimalCompany.ElevatorManager");
    var ArenaGameManager = AssemblyCSharp.class("AnimalCompany.ArenaGameManager")
    var GrabbableObject = AssemblyCSharp.class("AnimalCompany.GrabbableObject");
    var PickupManager     = AssemblyCSharp.class("AnimalCompany.PickupManager");
    var ItemSellingMachineController = AssemblyCSharp.class("AnimalCompany.ItemSellingMachineController");
    var PrefabGen         = AssemblyCSharp.class("AnimalCompany.PrefabGenerator");
    var GBIClass          = AssemblyCSharp.class("AnimalCompany.GrabbableItem");
    var BackpackItemClass  = AssemblyCSharp.class("AnimalCompany.BackpackItem");
    var QuiverClass        = AssemblyCSharp.class("AnimalCompany.Quiver");
    var CrossbowClass = null;
    try { CrossbowClass = AssemblyCSharp.class("AnimalCompany.Crossbow"); } catch(_) {}
    var HeartGunClass = null;
    try { HeartGunClass = AssemblyCSharp.class("AnimalCompany.HeartGun"); } catch(_) {}
    var GrenadeLauncherClass = null;
    try { GrenadeLauncherClass = AssemblyCSharp.class("AnimalCompany.GrenadeLauncher"); } catch(_) {}
    var SalmonCannonClass = null;
    try { SalmonCannonClass = AssemblyCSharp.class("AnimalCompany.SalmonCannon"); } catch(_) {}
    var MobControllerBase = null;
    try { MobControllerBase = AssemblyCSharp.class("AnimalCompany.MobController"); } catch(_) {}
    var NetSessionPrivateRoomManagerClass = null;
    try { NetSessionPrivateRoomManagerClass = AssemblyCSharp.class("AnimalCompany.NetSessionPrivateRoomManager"); } catch(_) {}
    var PlayerWatchDevMenuMediatorClass = null;
    try { PlayerWatchDevMenuMediatorClass = AssemblyCSharp.class("AnimalCompany.PlayerWatchDevMenuMediator"); } catch(_) {}
    var ModerationMenuMediatorClass = null;
    try { ModerationMenuMediatorClass = AssemblyCSharp.class("AnimalCompany.ModerationMenuMediator"); } catch(_) {}
    var PrivateRoomStateClass = null;
    try { PrivateRoomStateClass = AssemblyCSharp.class("AnimalCompany.PrivateRoomState"); } catch(_) {}
    var UserCacheManagerClass = null;
    try { UserCacheManagerClass = AssemblyCSharp.class("AnimalCompany.UserCacheManager"); } catch(_) {}
    var AnimalCompanyApiClass = null;
    try { AnimalCompanyApiClass = AssemblyCSharp.class("AnimalCompany.API.AnimalCompanyAPI"); } catch(_) {}
    var ItemSellingMachineButtonViewClass = null;
    try { ItemSellingMachineButtonViewClass = AssemblyCSharp.class("AnimalCompany.ItemSellingMachineButtonView"); } catch(_) {}
    var GrabbablePurchaseClass = null;
    try { GrabbablePurchaseClass = AssemblyCSharp.class("AnimalCompany.GrabbablePurchase"); } catch(_) {}
    var ArenaGrabbablePurchaseClass = null;
    try { ArenaGrabbablePurchaseClass = AssemblyCSharp.class("AnimalCompany.ArenaGrabablePurchase"); } catch(_) {}
    var AudioClipClass     = UnityEngineAudio.class("UnityEngine.AudioClip");
    var PhotonVoiceImage   = Il2Cpp.domain.assembly("PhotonVoice").image;
    var VoiceConnectionClass  = PhotonVoiceImage.class("Photon.Voice.Unity.VoiceConnection");
    var NetworkSessionManagerClass = AssemblyCSharp.class("AnimalCompany.NetworkSessionManager");
    var DamageSourceInfoClass = AssemblyCSharp.class("AnimalCompany.DamageSourceInfo");
    var GameplayItemStateClass = AssemblyCSharp.class("AnimalCompany.GameplayItemState");
    var RigidbodyClass     = UnityEnginePhysics.class("UnityEngine.Rigidbody");
    var PCClass           = AssemblyCSharp.class("AnimalCompany.PlayerController");
    var GBOClass          = AssemblyCSharp.class("AnimalCompany.GrabbableObject");
    var SFXManager        = AssemblyCSharp.class("AnimalCompany.SFXManager");
    var NManager          = AssemblyCSharp.class("AnimalCompany.NetworkManager");
    var GorillaReportButton = AssemblyCSharp.class("AnimalCompany.ComputerTerminalKey");
    var InputDevices      = UnityEngineXR.class("UnityEngine.XR.InputDevices");
    var CommonUsages      = UnityEngineXR.class("UnityEngine.XR.CommonUsages");
    var GameObject        = UnityEngineCore.class("UnityEngine.GameObject");
    var Object            = UnityEngineCore.class("UnityEngine.Object");
    var Vector3           = UnityEngineCore.class("UnityEngine.Vector3");
    var Quaternion        = UnityEngineCore.class("UnityEngine.Quaternion");
    var Time              = UnityEngineCore.class("UnityEngine.Time");
    var Resources         = UnityEngineCore.class("UnityEngine.Resources");
    var Material          = UnityEngineCore.class("UnityEngine.Material");
    var Renderer          = UnityEngineCore.class("UnityEngine.Renderer");
    var Color             = UnityEngineCore.class("UnityEngine.Color");
    var Shader            = UnityEngineCore.class("UnityEngine.Shader");
    var Camera            = UnityEngineCore.class("UnityEngine.Camera");
    var RectTransform     = UnityEngineCore.class("UnityEngine.RectTransform");
    var LineRenderer      = UnityEngineCore.class("UnityEngine.LineRenderer");
    var BoxCollider       = UnityEnginePhysics.class("UnityEngine.BoxCollider");
    var Collider          = UnityEnginePhysics.class("UnityEngine.Collider");
    var Rigidbody         = UnityEnginePhysics.class("UnityEngine.Rigidbody");
    var Physics           = UnityEnginePhysics.class("UnityEngine.Physics");
    var Component         = UnityEngineCore.class("UnityEngine.Component");
    var ParticleManager      = AssemblyCSharp.class("AnimalCompany.ParticleManager");
    var ParticleManagerClass = ParticleManager;
    var VFXManagerClass = null;
    try { VFXManagerClass = AssemblyCSharp.class("AnimalCompany.VFXManager"); } catch(_) {}
    var MobDataUtilityClass = null;
    try { MobDataUtilityClass = AssemblyCSharp.class("AnimalCompany.MobDataUtility"); } catch(_) {}
    var Font              = UnityEngineTextRendering.class("UnityEngine.Font");
    var TextMesh = null;
    var TextMeshPro3D = null;
    var TMPSettingsClass = null;
    var tmpDefaultFontAsset = null;
    try { TextMesh = UnityEngineTextRendering.class("UnityEngine.TextMesh"); } catch(_) {}
    if (!TextMesh) {
        try { TextMesh = UnityEngineCore.class("UnityEngine.TextMesh"); } catch(_) {}
    }
    try { TextMeshPro3D = UnityTextMeshPro.class("TMPro.TextMeshPro"); } catch(_) {}
    try { TMPSettingsClass = UnityTextMeshPro.class("TMPro.TMP_Settings"); } catch(_) {}
    var GTPlayer = null;
    var UberShader        = Shader.method("Find").invoke(Il2Cpp.string("Universal Render Pipeline/Unlit"));
    var TextShader        = Shader.method("Find").invoke(Il2Cpp.string("UI/Default"));
    var zeroVector        = Vector3.field("zeroVector").value;
    var oneVector         = Vector3.field("oneVector").value;
    var identityQuaternion = Quaternion.field("identityQuaternion").value;
    var leftHandTransform = null;
    var rightHandTransform = null;
    var headCollider = null;
    var bodyCollider = null;
    var arial = null;
    var arialRetryAfter = 0;
    function getarialnocrash2() {
        if (arial && !arial.isNull()) return arial;
        var nowMs = Date.now();
        if (nowMs < arialRetryAfter) return null;
        try {
            arial = Resources.method("GetBuiltinResource", 1).inflate(Font).invoke(Il2Cpp.string("Arial.ttf"));
        } catch (e) {
            arial = null;
            arialRetryAfter = nowMs + 2000;
            if (!menuFontWarned) {
                menuFontWarned = true;
                console.error("[menu] Arial.ttf builtin font load failed during startup/runtime; text will retry later");
            }
        }
        return arial;
    }
    function gettmpfontnocrash() {
        if (tmpDefaultFontAsset && !tmpDefaultFontAsset.isNull()) return tmpDefaultFontAsset;
        if (!TMPSettingsClass) return null;
        try { tmpDefaultFontAsset = TMPSettingsClass.method("get_defaultFontAsset").invoke(); } catch(_) {}
        if (!tmpDefaultFontAsset || tmpDefaultFontAsset.isNull()) {
            try {
                var settingsInstance = TMPSettingsClass.method("get_instance").invoke();
                if (settingsInstance && !settingsInstance.isNull()) {
                    try { tmpDefaultFontAsset = settingsInstance.method("get_defaultFontAsset").invoke(); } catch(_) {}
                    if (!tmpDefaultFontAsset || tmpDefaultFontAsset.isNull()) {
                        try { tmpDefaultFontAsset = settingsInstance.field("m_defaultFontAsset").value; } catch(_) {}
                    }
                }
            } catch(_) {}
        }
        return tmpDefaultFontAsset && !tmpDefaultFontAsset.isNull() ? tmpDefaultFontAsset ;
    }
    var NullMethod = {
        invoke: () => NullObject,
        inflate: () => NullMethod,
        overload: () => NullMethod
    };
    var NullObject = {
        handle: { isNull: () => true },
        isNull: () => true,
        method: () => NullMethod,
        field: () => ({ value }),
        tryField: () => null,
        tryMethod: () => null,
        class: { type: { name: "NullObject" } }
    };
    function isLiveObject(obj) {
        try {
            return !!obj && !(obj.isNull?.() ?? true);
        } catch(_) {
            return false;
        }
    }
    function refreshRuntimeRefs() {
        try {
            var player = GTPlayerClass.field("k__BackingField").value;
            if (isLiveObject(player)) GTPlayer = player;
        } catch(_) {}
        try {
            if (isLiveObject(GTPlayer)) {
                try {
                    var nextLeftHandTransform = GTPlayer.field("leftHandTransform").value;
                    if (isLiveObject(nextLeftHandTransform)) leftHandTransform = nextLeftHandTransform;
                } catch(_) {}
                try {
                    var nextRightHandTransform = GTPlayer.field("rightHandTransform").value;
                    if (isLiveObject(nextRightHandTransform)) rightHandTransform = nextRightHandTransform;
                } catch(_) {}
                try {
                    var nextHeadCollider = GTPlayer.field("headCollider").value;
                    if (isLiveObject(nextHeadCollider)) headCollider = nextHeadCollider;
                } catch(_) {}
                try {
                    var nextBodyCollider = GTPlayer.field("bodyCollider").value;
                    if (isLiveObject(nextBodyCollider)) bodyCollider = nextBodyCollider;
                } catch(_) {}
            }
        } catch(_) {
        }
        return isLiveObject(GTPlayer) && isLiveObject(leftHandTransform) && isLiveObject(rightHandTransform) && isLiveObject(bodyCollider);
    }
    var runtimeRefMissCount = 0;
    function logButtonRuntimeError(button, error) {
        var now = time ?? 0;
        var nextLogTime = (button ).__nextErrorLogTime ?? 0;
        var failCount = (((button ).__failCount ?? 0) + 1);
        (button ).__failCount = failCount;
        if (failCount === 1 || now >= nextLogTime) {
            console.error(`[LateUpdate] Error in '${button.buttonText}':`, error);
            (button ).__nextErrorLogTime = now + 1.5;
        }
    }
    function Destroy(object) {
        try {
            if (!object || object === NullObject) return;
            if (object.isNull?.()) return;
            Object.method("Destroy", 1).invoke(object);
        } catch(_) {}
    }
    function getComponent(obj, type) {
        try {
            if (!obj || obj.isNull?.()) return null;
            return obj.method("GetComponent", 1).inflate(type).invoke();
        } catch(_) { return null; }
    }
    function getComponentInParent(obj, type) {
        try {
            if (!obj || obj.isNull?.()) return null;
            return obj.method("GetComponentInParent", 0).inflate(type).invoke();
        } catch(_) { return null; }
    }
    function addComponent(obj, type) { return obj.method("AddComponent", 1).inflate(type).invoke(); }
    function getTransform(obj) { return obj.method("get_transform").invoke(); }
    function playerIsLocal(player) { return player.method("get_IsMine").invoke(); }
    function setMenuTextScale(textTransform, scaleObject, baseScale) {
        try {
            var menuScale = getTransform(scaleObject).method("get_localScale").invoke();
            var sx = Math.abs(menuScale.field("x").value) || 1.0;
            var sy = Math.abs(menuScale.field("y").value) || 1.0;
            var sz = Math.abs(menuScale.field("z").value) || 1.0;
            var xScale = (baseScale * 0.42) / sx;
            textTransform.method("set_localScale").invoke([-xScale, baseScale / sy, baseScale / sz]);
        } catch(_) {
            try { textTransform.method("set_localScale").invoke([-(baseScale * 0.42), baseScale, baseScale]); } catch(_) {}
        }
    }
    function createEmptyObject(name = "", parent = null) {
        var obj = null;
        try {
            obj = GameObject.alloc();
            try { obj.method(".ctor", 1).invoke(Il2Cpp.string(name)); }
            catch(_) {
                obj.method(".ctor", 0).invoke();
                try { obj.method("set_name").invoke(Il2Cpp.string(name)); } catch(_) {}
            }
        } catch(_) {
            obj = createObject(zeroVector, identityQuaternion, oneVector, 3, [0, 0, 0, 0], parent);
            try {
                var col = getComponent(obj, Collider);
                if (col && !col.isNull()) col.method("set_enabled").invoke(false);
            } catch(_) {}
            return obj;
        }
        var transform = getTransform(obj);
        if (parent != null) transform.method("SetParent", 2).invoke(parent, false);
        return obj;
    }
    function invokeInstance(method, instance, ...args[]) { return method.invokeRaw(instance, ...args); }
    function tryMethodName(klass, names[], parameterCount = -1) {
        for (var name of names) {
            try { return parameterCount >= 0 ? klass.method(name, parameterCount) : klass.method(name); }
            catch(_) {}
        }
        return null;
    }
    function isClassNamed(obj, className) {
        try { return obj && !obj.isNull() && obj.class.type.name === className; } catch(_) { return false; }
    }
    var NetworkRunner = Il2Cpp.domain.assembly("Fusion.Runtime").image.class("Fusion.NetworkRunner");
    var NULL = Il2Cpp.reference(Il2Cpp.domain.assembly("mscorlib").image.class("System.Object").alloc());
    function spawnItemAtPos(bareID, pos, rot) {
        try {
            var prefab = PrefabGen.method("GetItemPrefab", 1).invoke(Il2Cpp.string(bareID));
            if (prefab && !prefab.isNull()) {
                var result = PrefabGen.method("SpawnItem", 4).invoke(prefab, pos, rot, NULL);
                if (result && !result.isNull()) return result;
            }
            var result2 = PrefabGen.method("SpawnItem", 4).invoke(Il2Cpp.string(bareID), pos, rot, NULL);
            if (result2 && !result2.isNull()) return result2;
            return PrefabGen.method("SpawnItem", 4).invoke(Il2Cpp.string("item_prefab/" + bareID), pos, rot, NULL);
        } catch(e) {
            console.error("[spawnItemAtPos] " + bareID + ": " + e);
            return null;
        }
    }
    var fallbackTextBlueprintPieces[] = [
        { pos: [-4.592, 7.076, -1.16] },
        { pos: [-4.061, 7.081, -1.159] },
        { pos: [-4.207, 7.176, -1.167] },
        { pos: [-4.212, 7.705, -1.21] },
        { pos: [-4.119, 8.235, -1.253] },
        { pos: [-4.124, 8.765, -1.297] },
        { pos: [-4.178, 9.294, -1.34] },
        { pos: [-4.235, 10.351, -1.427] },
        { pos: [-4.239, 10.881, -1.471] },
        { pos: [-4.533, 11.311, -1.507] },
        { pos: [-4.77, 10.828, -1.468] },
        { pos: [-4.717, 10.299, -1.424] },
        { pos: [-4.664, 9.77, -1.381] },
        { pos: [-4.708, 9.241, -1.338] },
        { pos: [-4.703, 8.712, -1.295] },
        { pos: [-4.699, 8.182, -1.251] },
        { pos: [-4.742, 7.653, -1.209] },
        { pos: [-4.243, 11.314, -1.505] },
        { pos: [-3.712, 11.319, -1.504] },
        { pos: [-3.181, 11.324, -1.502] },
        { pos: [-2.744, 11.039, -1.477] },
        { pos: [-3.225, 10.794, -1.459] },
        { pos: [-3.756, 10.837, -1.465] },
        { pos: [-2.892, 11.375, -1.505] },
        { pos: [-2.36, 11.331, -1.499] },
        { pos: [-2.695, 10.894, -1.465] },
        { pos: [-2.405, 10.945, -1.468] },
        { pos: [-3.939, 9.681, -1.37] },
        { pos: [-3.408, 9.637, -1.365] },
        { pos: [-3.742, 9.249, -1.335] },
        { pos: [2.562, 10.682, -1.448] },
        { pos: [3.043, 10.831, -1.458] },
        { pos: [1.02, 11.218, -1.475] },
        { pos: [2.802, 10.925, -1.466] },
        { pos: [1.02, 11.17, -1.471] },
        { pos: [0.775, 11.648, -1.512] },
        { pos: [0.244, 11.692, -1.518] },
        { pos: [-0.287, 11.59, -1.511] },
        { pos: [-0.768, 11.441, -1.501] },
        { pos: [-1.249, 11.197, -1.483] },
        { pos: [-1.534, 10.761, -1.449] },
        { pos: [-1.675, 10.279, -1.41] },
        { pos: [-1.719, 9.749, -1.367] },
        { pos: [-1.715, 9.219, -1.323] },
        { pos: [-1.661, 8.691, -1.28] },
        { pos: [-1.464, 8.212, -1.24] },
        { pos: [-1.17, 7.781, -1.203] },
        { pos: [-0.734, 7.496, -1.178] },
        { pos: [-0.249, 7.357, -1.165] },
        { pos: [0.282, 7.313, -1.159] },
        { pos: [0.813, 7.317, -1.157] },
        { pos: [1.343, 7.419, -1.163] },
        { pos: [1.775, 7.713, -1.185] },
        { pos: [1.243, 7.755, -1.191] },
        { pos: [0.763, 7.559, -1.177] },
        { pos: [0.232, 7.505, -1.175] },
        { pos: [-0.252, 7.645, -1.188] },
        { pos: [-0.737, 7.882, -1.21] },
        { pos: [-1.031, 8.311, -1.246] },
        { pos: [-1.179, 8.84, -1.29] },
        { pos: [-1.281, 9.368, -1.334] },
        { pos: [-1.286, 9.897, -1.377] },
        { pos: [-1.049, 10.381, -1.416] },
        { pos: [-0.763, 10.816, -1.45] },
        { pos: [-0.38, 11.157, -1.477] },
        { pos: [0.151, 11.209, -1.479] },
        { pos: [0.54, 10.877, -1.449] },
        { pos: [4.542, 11.106, -1.451] },
        { pos: [4.01, 11.197, -1.46] },
        { pos: [3.479, 11.143, -1.458] },
        { pos: [3.106, 10.081, -1.373] },
        { pos: [3.447, 9.7, -1.34] },
        { pos: [3.933, 9.415, -1.314] },
        { pos: [4.418, 9.18, -1.293] },
        { pos: [4.855, 8.846, -1.264] },
        { pos: [5.244, 8.513, -1.235] },
        { pos: [5.442, 8.034, -1.195] },
        { pos: [5.447, 7.505, -1.152] },
        { pos: [5.16, 7.069, -1.118] },
        { pos: [4.679, 6.872, -1.103] },
        { pos: [4.149, 6.818, -1.101] },
        { pos: [3.617, 6.863, -1.107] },
        { pos: [3.133, 7.001, -1.12] },
        { pos: [2.792, 7.384, -1.153] },
        { pos: [3.322, 7.437, -1.155] },
        { pos: [3.806, 7.297, -1.142] },
        { pos: [4.288, 7.445, -1.152] },
        { pos: [4.525, 7.93, -1.19] },
        { pos: [4.232, 8.359, -1.228] },
        { pos: [3.794, 8.692, -1.257] },
        { pos: [3.405, 9.026, -1.285] },
        { pos: [3.064, 9.408, -1.318] },
        { pos: [2.722, 9.79, -1.351] },
        { pos: [2.525, 10.268, -1.39] },
        { pos: [2.417, 11.182, -1.466] },
        { pos: [2.751, 11.57, -1.496] },
        { pos: [3.282, 11.671, -1.503] },
        { pos: [3.813, 11.675, -1.5] },
        { pos: [4.344, 11.633, -1.494] },
        { pos: [4.876, 11.492, -1.481] },
        { pos: [-4.628, 10.301, -1.425] },
    ];
    var TEXT_SPAWN_BLUEPRINT_PATH = "C:\\Users\\Dawid Jurek\\Downloads\\blueprint.json";
    var TEXT_SPAWN_SCALE = 0.16;
    function readTextBlueprintPieces()[] {
        if (textBlueprintCache && textBlueprintCache.length > 0) return textBlueprintCache;
        var parsedPieces[] = [];
        try {
            var content = "";
            var file = new File(TEXT_SPAWN_BLUEPRINT_PATH, "r");
            try {
                content = file.readText(1024 * 1024);
            } catch(_) {
                try {
                    var line = null;
                    while ((line = file.readLine()) !== null) content += String(line) + "\n";
                } catch(_) {}
            }
            try { file.close(); } catch(_) {}
            if (content && content.length > 0) {
                var data = JSON.parse(content);
                var items = data?.items ?? [];
                for (var item of items) {
                    var children = item?.stuckChildren ?? [];
                    for (var child of children) {
                        var pos = child?.pos ?? null;
                        if (!pos || pos.length < 3) continue;
                        var childItem = child?.item ?? {};
                        parsedPieces.push({
                            itemID: "item_ore_hell",
                            pos: [Number(pos[0]) || 0, Number(pos[1]) || 0, Number(pos[2]) || 0],
                            scaleModifier(childItem?.scaleModifier ?? 0) || 0,
                            colorHue(childItem?.colorHue ?? 0) || 0,
                            colorSaturation(childItem?.colorSaturation ?? 0) || 0
                        });
                    }
                }
            }
        } catch(e) {
            console.error("[TextSpawn] blueprint read failed, using embedded copy:", e);
        }
        if (parsedPieces.length === 0) parsedPieces = fallbackTextBlueprintPieces;
        textBlueprintCache = parsedPieces;
        return parsedPieces;
    }
    function applyTextPieceConfig(spawned, piece) {
        try {
            var gbo = spawned.method("GetComponent", 1).inflate(GBOClass).invoke();
            if (!gbo || gbo.isNull?.()) return;
            try { gbo.method("set_scaleModifier").invoke(Number(piece?.scaleModifier ?? 0) || 0); } catch(_) {}
            try { gbo.method("set_colorHue").invoke(Number(piece?.colorHue ?? 0) || 0); } catch(_) {}
            try { gbo.method("set_colorSaturation").invoke(Number(piece?.colorSaturation ?? 0) || 0); } catch(_) {}
        } catch(_) {}
    }
    function freezeSpawnedObjectInPlace(spawned) {
        try {
            if (!spawned || spawned.isNull?.()) return;
            trySetObjectVelocity(spawned, [0, 0, 0]);
            var target = spawned;
            try {
                var go = spawned.method("get_gameObject").invoke();
                if (go && !go.isNull?.()) target = go;
            } catch(_) {}
            var rb = null;
            try { rb = getComponent(target, Rigidbody); } catch(_) {}
            if (!rb || rb.isNull?.()) {
                try { rb = target.method("GetComponentInChildren", 0).inflate(Rigidbody).invoke(); } catch(_) {}
            }
            if (rb && !rb.isNull?.()) {
                try { rb.method("set_velocity").invoke([0, 0, 0]); } catch(_) {}
                try { rb.method("set_angularVelocity").invoke([0, 0, 0]); } catch(_) {}
                try { rb.method("set_useGravity").invoke(false); } catch(_) {}
                try { rb.method("set_isKinematic").invoke(true); } catch(_) {}
                try { rb.method("Sleep").invoke(); } catch(_) {}
            }
            try {
                var cols = target.method("GetComponentsInChildren", 1).inflate(Collider).invoke(false);
                if (cols && !cols.isNull?.()) {
                    for (var i = 0; i < Math.min(cols.length, 64); i++) {
                        try { cols.method("get_Item").invoke(i).method("set_isTrigger").invoke(true); } catch(_) {}
                    }
                }
            } catch(_) {}
        } catch(_) {}
    }
    function giveMoneyAllTest() {
        try {
            var count = 0;
            for (var p of getAllNetPlayersList(false)) {
                try { p.method("RPC_AddPlayerMoney").invoke(10000000); count++; } catch(_) {}
            }
            sendNotification("Test: gave 10M to " + count + " players", false, 4);
        } catch(e) { sendNotification("Test money all: " + e, false); }
    }
    function removeMoneyAllTest() {
        try {
            var count = 0;
            for (var p of getAllNetPlayersList(false)) {
                try { p.method("RPC_AddPlayerMoney").invoke(-9999999); count++; } catch(_) {}
            }
            sendNotification("Test: gave -10M to " + count + " players", false, 4);
        } catch(e) { sendNotification("Test money all: " + e, false); }
    }
    var mineableResearchOrePrefabNames[] = [
        "R_CoreVein",
        "R_CoreVein_1",
        "Core Ore",
        "Ore Vein",
        "Ore Vein_1",
        "Ore Vein_2",
        "Ore Vein_3",
        "HealthOre",
        "LootOre",
        "B_CoreVein",
        "B_CoreVein_1"
    ];
    function findLoadedMineableOreTemplate() {
        try {
            var allGOs = Object.method("FindObjectsByType", 1).inflate(GameObject).invoke(0);
            var len = allGOs ? allGOs.length : 0;
            for (var i = 0; i < len; i++) {
                try {
                    var go = allGOs.method("get_Item").invoke(i);
                    if (!go || go.isNull?.()) continue;
                    var rawName = go.method("get_name").invoke()?.content ?? "";
                    var cleanName = String(rawName).replace(/\(Clone\)/g, "").trim().toLowerCase();
                    if (!cleanName) continue;
                    if (mineableResearchOrePrefabNames.some(name => cleanName.includes(name.toLowerCase()))) return go;
                    if ((cleanName.includes("ore") || cleanName.includes("vein")) && cleanName.includes("core")) return go;
                } catch(_) {}
            }
        } catch(e) { console.error("[ResearchOreSpawner find template]", e); }
        return null;
    }
    function cloneLoadedMineableOreAt(pos, rot) {
        try {
            var template = findLoadedMineableOreTemplate();
            if (!template || template.isNull?.()) return null;
            var clone = Object.method("Instantiate", 3).invoke(template, pos, rot);
            if (!clone || clone.isNull?.()) return null;
            try { clone.method("SetActive").invoke(true); } catch(_) {}
            try { clone.method("set_name").invoke(Il2Cpp.string("Spawned_Research_Ore_Vein")); } catch(_) {}
            return clone;
        } catch(e) { console.error("[ResearchOreSpawner clone]", e); }
        return null;
    }
    function spawnMineableResearchOreAt(pos, rot) {
        for (var prefabName of mineableResearchOrePrefabNames) {
            try {
                var spawned = spawnNetworkPrefab(prefabName, pos, rot);
                if (spawned && !spawned.isNull?.()) return spawned;
            } catch(_) {}
        }
        return cloneLoadedMineableOreAt(pos, rot);
    }
    function spawnResearchOreLoop() {
        if (time < researchOreSpawnDelay) return;
        researchOreSpawnDelay = time + 0.65;
        try {
            var handTransform = rightHandTransform;
            if (!handTransform || handTransform.isNull?.()) return;
            var forward = getLaunchForward(handTransform);
            var up = getLaunchUp(handTransform, forward);
            var spawnPos = Vector3.method("op_Addition").invoke(
                handTransform.method("get_position").invoke(),
                Vector3.method("op_Addition").invoke(
                    Vector3.method("op_Multiply", 2).invoke(forward, 0.85),
                    Vector3.method("op_Multiply", 2).invoke(up, -0.18)
                )
            );
            var rot = getLaunchRotation(handTransform, forward, up);
            var ore = spawnMineableResearchOreAt(spawnPos, rot);
            if (!ore || ore.isNull?.()) {
                if (time >= researchOreFailNotifyDelay) {
                    researchOreFailNotifyDelay = time + 3.0;
                    sendNotification("Mineable research ore not found in loaded prefabs", false, 3);
                }
                return;
            }
            try { console.log("[ResearchOreSpawner] spawned mineable ore vein"); } catch(_) {}
        } catch(e) { console.error("[ResearchOreSpawner]", e); }
    }
    function spawnMoneyBills500() {
        if (time < testMoneySpawnDelay) return;
        testMoneySpawnDelay = time + 1.2;
        try {
            var handTransform = rightHandTransform;
            if (!handTransform || handTransform.isNull?.()) { sendNotification("No right hand transform", false); return; }
            var forward = getLaunchForward(handTransform);
            var up = getLaunchUp(handTransform, forward);
            var rightVec = null;
            try { rightVec = handTransform.method("get_right").invoke(); } catch(_) { rightVec = [1, 0, 0]; }
            var handPos = handTransform.method("get_position").invoke();
            var basePos = Vector3.method("op_Addition").invoke(handPos, Vector3.method("op_Multiply", 2).invoke(forward, 1.1));
            var rot = getLaunchRotation(handTransform, forward, up);
            var spawned = 0;
            for (var i = 0; i < 500; i++) {
                try {
                    var col = i % 25;
                    var row = Math.floor(i / 25) % 10;
                    var layer = Math.floor(i / 250);
                    var offset = Vector3.method("op_Addition").invoke(
                        Vector3.method("op_Addition").invoke(
                            Vector3.method("op_Multiply", 2).invoke(rightVec, (col - 12) * 0.055),
                            Vector3.method("op_Multiply", 2).invoke(up, 0.02 + (layer * 0.07))
                        ),
                        Vector3.method("op_Multiply", 2).invoke(forward, (row - 4.5) * 0.055)
                    );
                    var pos = Vector3.method("op_Addition").invoke(basePos, offset);
                    var bill = spawnItemAtPos("item_fish_dollar_bill", pos, rot);
                    if (!bill || bill.isNull?.()) continue;
                    freezeSpawnedObjectInPlace(bill);
                    spawned++;
                } catch(_) {}
            }
            sendNotification("Spawned money bills: " + spawned, false, 5);
        } catch(e) { sendNotification("Money bill spawn failed: " + e, false); }
    }
    function stealNearestHeldItemToRightHand() {
        if (!rightGrab) return;
        if (time < handStealDelay) return;
        handStealDelay = time + 0.18;
        try {
            var handPos = rightHandTransform.method("get_position").invoke();
            var closest = null;
            var closestPlayer = null;
            var closestDist = 4.5;
            for (var p of getAllNetPlayersList(false)) {
                try {
                    for (var handIndex of [0, 1]) {
                        var held = getPlayerHeldGrabbable(p, handIndex);
                        if (!held || held.isNull?.()) continue;
                        var heldGo = (() => {
                            try { return held.method("get_gameObject").invoke(); } catch(_) { return held; }
                        })();
                        var heldTf = getTransform(heldGo && !heldGo.isNull?.() ? heldGo : held);
                        if (!heldTf || heldTf.isNull?.()) continue;
                        var dist = Vector3.method("Distance").invoke(handPos, heldTf.method("get_position").invoke()) ;
                        if (dist < closestDist) {
                            closest = heldGo && !heldGo.isNull?.() ? heldGo : held;
                            closestPlayer = p;
                            closestDist = dist;
                        }
                    }
                } catch(_) {}
            }
            if (!closest || closest.isNull?.()) return;
            var pullPos = Vector3.method("op_Addition").invoke(
                handPos,
                Vector3.method("op_Multiply", 2).invoke(getLaunchForward(rightHandTransform), 0.08)
            );
            if (forceMoveLobbyItem(closest, pullPos)) {
                var name = (() => {
                    try { return getPlayerName(closestPlayer); } catch(_) { return "player"; }
                })();
                sendNotification("Pulled held item from " + name, false, 2);
            }
        } catch(e) { console.error("[HandSteal]", e); }
    }
    function spawnTextBlueprintAsHellOre() {
        if (time < textSpawnDelay) return;
        textSpawnDelay = time + 0.8;
        try {
            var pieces = readTextBlueprintPieces();
            if (!pieces || pieces.length === 0) { sendNotification("Text blueprint is empty", false); return; }
            var handTransform = rightHandTransform;
            if (!handTransform || handTransform.isNull?.()) { sendNotification("No right hand transform", false); return; }
            var cx = 0, cy = 0, cz = 0;
            for (var piece of pieces) {
                var p = piece.pos;
                cx += p[0]; cy += p[1]; cz += p[2];
            }
            cx /= pieces.length; cy /= pieces.length; cz /= pieces.length;
            var forward = getLaunchForward(handTransform);
            var up = getLaunchUp(handTransform, forward);
            var rightVec = null;
            try { rightVec = handTransform.method("get_right").invoke(); } catch(_) { rightVec = [1, 0, 0]; }
            var handPos = handTransform.method("get_position").invoke();
            var basePos = Vector3.method("op_Addition").invoke(
                handPos,
                Vector3.method("op_Multiply", 2).invoke(forward, 0.62)
            );
            var rot = getLaunchRotation(handTransform, forward, up);
            var spawnedCount = 0;
            for (var piece of pieces) {
                try {
                    var p = piece.pos;
                    var dx = (Number(p[0]) - cx) * TEXT_SPAWN_SCALE;
                    var dy = (Number(p[1]) - cy) * TEXT_SPAWN_SCALE;
                    var dz = (Number(p[2]) - cz) * TEXT_SPAWN_SCALE;
                    var offset = Vector3.method("op_Addition").invoke(
                        Vector3.method("op_Addition").invoke(
                            Vector3.method("op_Multiply", 2).invoke(rightVec, dx),
                            Vector3.method("op_Multiply", 2).invoke(up, dy)
                        ),
                        Vector3.method("op_Multiply", 2).invoke(forward, dz)
                    );
                    var spawnPos = Vector3.method("op_Addition").invoke(basePos, offset);
                    var spawned = spawnItemAtPos("item_ore_hell", spawnPos, rot);
                    if (!spawned || spawned.isNull?.()) continue;
                    applyTextPieceConfig(spawned, piece);
                    freezeSpawnedObjectInPlace(spawned);
                    textSpawnedObjects.push(spawned);
                    spawnedCount++;
                } catch(_) {}
            }
            sendNotification("Spawned Hell Ore text: " + spawnedCount, false, 4);
        } catch(e) {
            console.error("[TextSpawn]", e);
            sendNotification("Text spawn failed: " + e, false);
        }
    }
    function clearSpawnedTextHellOre() {
        var cleared = 0;
        var remaining[] = [];
        for (var obj of textSpawnedObjects) {
            try {
                if (!obj || obj.isNull?.()) continue;
                var destroyObj = obj;
                try {
                    var go = obj.method("get_gameObject").invoke();
                    if (go && !go.isNull?.()) destroyObj = go;
                } catch(_) {}
                Object.method("Destroy", 1).invoke(destroyObj);
                cleared++;
            } catch(_) {
                remaining.push(obj);
            }
        }
        textSpawnedObjects = remaining;
        sendNotification("Cleared Hell Ore text: " + cleared, false);
    }
    function trackPersistentMob(mobEntry: { name; id }, pos, rot, spawned) {
        try {
            persistentMobEntries.push({
                mobEntry,
                pos,
                rot,
                object: spawned ?? null,
                lastRespawnTime: time
            });
        } catch(_) {}
    }
    function stabilizeMobInstance(mob, fallbackPos = null) {
        try {
            if (!mob || mob.isNull?.()) return;
            var go = mob;
            try {
                var maybeGo = mob.method("get_gameObject").invoke();
                if (maybeGo && !maybeGo.isNull?.()) go = maybeGo;
            } catch(_) {}
            try { go.method("SetActive").invoke(true); } catch(_) {}
            try { mob.method("set_enabled").invoke(true); } catch(_) {}
            try {
                var killer = go.method("GetComponentInChildren", 0).inflate(AssemblyCSharp.class("AnimalCompany.ArenaItemKiller")).invoke();
                if (killer && !killer.isNull?.()) {
                    try { killer.method("set_enabled").invoke(false); } catch(_) {}
                    try { killer.field("_isEnabled").value = false; } catch(_) {}
                }
            } catch(_) {}
            if (fallbackPos) {
                try {
                    var tf = getTransform(go);
                    var cur = tf.method("get_position").invoke();
                    if ((cur.field("y").value ) < -5000) tf.method("set_position").invoke(fallbackPos);
                } catch(_) {}
            }
        } catch(_) {}
    }
var acMobIdByName = {
    Unidentified: 0, Angler: 1, AnglerController: 1, AnglerMad: 2, AnglerMadController: 2, Armstrong: 3, ArmstrongController: 3, ArmstrongMad: 4, ArmstrongMadController: 4,
    Banshee: 5, BansheeController: 5, Bomb: 6, BombController: 6, Bomber: 7, BomberController: 7, BomberFlashbang: 8, BomberFlashbangController: 8, BomberMad: 9, BomberMadController: 9,
    Chicken: 10, ChickenController: 10, Cyst: 11, CystController: 11, FakeGorilla: 12, FakeGorillaController: 12, BigHead: 13, BigHeadController: 13, RedGreen: 14, RedGreenController: 14,
    Phantom: 15, PhantomController: 15, EvilEye: 16, EvilEyeController: 16, GiantThrower: 17, GiantThrowerController: 17, RedGreenMad: 18, RedGreenMadController: 18,
    Spider: 19, SpiderController: 19, FlyingSwarm: 20, FlyingSwarmController: 20, NextBot: 21, NextBotController: 21, Segway: 22, SegwayController: 22,
    NextBotStatic: 23, NextBotStaticController: 23, EvilEyePinata: 24, EvilEyePinataController: 24, EvilEyePinataLarge: 25, EvilEyePinataLargeController: 25,
    Lanky: 26, LankyController: 26, Blob: 27, BlobController: 27, Cutie: 28, CutieController: 28, SpiderCave: 29, SpiderCaveController: 29, ForestMob: 30, ForestMobController: 30,
    Mimic: 31, MimicController: 31, GraveyardBoss: 32, GraveyardBossController: 32, GiantController_GraveyardBoss: 32, Ringmaster: 33, RingmasterController: 33,
    Puppet: 34, PuppetController: 34, PolypMass: 35, PolypMassController: 35, RobotDog: 36, RobotDogController: 36, Shadow: 37, ShadowController: 37,
    Heart: 38, HeartController: 38, HeartMobController: 38, Slimey: 39, SlimeyController: 39, ShadowBoss: 40, ShadowBossController: 40, BigShark: 41, BigSharkController: 41,
    EdenZombie: 42, EdenZombieController: 42, Skinwalker: 43, SkinwalkerController: 43, YinWorm: 44, YinWormController: 44, YangWorm: 45, YangWormController: 45,
    ArmstrongSpace: 46, Smiley: 47
};
var acMobNameById = { 0: "Unidentified", 1: "Angler", 2: "AnglerMad", 3: "Armstrong", 4: "ArmstrongMad", 5: "Banshee", 6: "Bomb", 7: "Bomber", 8: "BomberFlashbang", 9: "BomberMad", 10: "Chicken", 11: "Cyst", 12: "FakeGorilla", 13: "BigHead", 14: "RedGreen", 15: "Phantom", 16: "EvilEye", 17: "GiantThrower", 18: "RedGreenMad", 19: "Spider", 20: "FlyingSwarm", 21: "NextBot", 22: "Segway", 23: "NextBotStatic", 24: "EvilEyePinata", 25: "EvilEyePinataLarge", 26: "Lanky", 27: "Blob", 28: "Cutie", 29: "SpiderCave", 30: "ForestMob", 31: "Mimic", 32: "GraveyardBoss", 33: "Ringmaster", 34: "Puppet", 35: "PolypMass", 36: "RobotDog", 37: "Shadow", 38: "Heart", 39: "Slimey", 40: "ShadowBoss", 41: "BigShark", 42: "EdenZombie", 43: "Skinwalker", 44: "YinWorm", 45: "YangWorm", 46: "ArmstrongSpace", 47: "Smiley" };
var acMobAliases = { GiantController: "GiantThrower", GiantGreenController: "GiantThrower", Giant_GreenController: "GiantThrower", GreenGiantController: "GiantThrower", Green_GiantController: "GiantThrower", YanWormController: "YangWorm", YingWormController: "YinWorm", YinYanWormController: "YinWorm", YingYangWormController: "YinWorm", PrototypeSlenderController: "Shadow" };
var acMobValidatorBypassEnabled = false;
var acBeforeMobSpawnDelegate = null;
var acBeforeMobSpawnDelegateClass = null;
var acNetworkObjectSpawnDelegateRef = null;
function acAnimalCompanyImage() {
    return Il2Cpp.domain.assembly("AnimalCompany").image;
}
function acGetMobEnumField(name) {
    try { return acAnimalCompanyImage().class("AnimalCompany.MobID").field(name).value; } catch(_) {}
    return null;
}
function acResolveMobID(mobId) {
    if (typeof mobId === "number") {
        var enumName = acMobNameById[mobId | 0];
        return enumName ? acGetMobEnumField(enumName) ;
    }
    var rawName = String(mobId || "").replace(/^mob_prefab\//, "");
    var trimmed = rawName.replace(/Controller$/, "").replace(/_?Controller$/, "");
    var candidates = [rawName, acMobAliases[rawName], trimmed, acMobAliases[trimmed]].filter(Boolean) [];
    for (var candidate of candidates) {
        var enumVal = acGetMobEnumField(candidate);
        if (enumVal !== null) return enumVal;
        if (Object.prototype.hasOwnProperty.call(acMobIdByName, candidate)) {
            var enumName = acMobNameById[acMobIdByName[candidate] | 0];
            var mapped = enumName ? acGetMobEnumField(enumName) ;
            if (mapped !== null) return mapped;
        }
    }
    return null;
}
function acEnableMobValidatorBypass() {
    if (acMobValidatorBypassEnabled) return;
    try {
        acAnimalCompanyImage().class("AnimalCompany.MobSpawnValidator").method("IsMobAllowed", 1).implementation = () => true;
        acMobValidatorBypassEnabled = true;
    } catch(e) { console.error("[MobValidatorBypass]", e); }
}
function acGetBeforeMobSpawnDelegate() {
    if (acBeforeMobSpawnDelegate) return acBeforeMobSpawnDelegate;
    try {
        acBeforeMobSpawnDelegateClass = Il2Cpp.domain.assembly("Fusion.Runtime").image.class("Fusion.NetworkRunner").tryNested("OnBeforeSpawned");
        var validator = acAnimalCompanyImage().class("AnimalCompany.MobSpawnValidator");
        acBeforeMobSpawnDelegate = Il2Cpp.delegate(acBeforeMobSpawnDelegateClass, (_runner, networkObject) => {
            try {
                if (!networkObject || (networkObject.handle && networkObject.handle.isNull())) return;
                var networkId = networkObject.method("get_Id").invoke();
                validator.method("AddAllowMob", 1).invoke(networkId);
            } catch(e) { console.error("[BeforeMobSpawn]", e); }
        });
    } catch(e) {
        console.error("[BeforeMobSpawn delegate]", e);
        acBeforeMobSpawnDelegate = null;
    }
    return acBeforeMobSpawnDelegate;
}
function acGetNetworkObjectSpawnDelegateRef() {
    if (acNetworkObjectSpawnDelegateRef) return acNetworkObjectSpawnDelegateRef;
    try {
        var spawnDelegateClass = Il2Cpp.domain.assembly("Fusion.Runtime").image.class("Fusion.NetworkObjectSpawnDelegate");
        acNetworkObjectSpawnDelegateRef = Il2Cpp.reference(spawnDelegateClass.alloc());
    } catch(e) {
        console.error("[NetworkObjectSpawnDelegate]", e);
        acNetworkObjectSpawnDelegateRef = NULL;
    }
    return acNetworkObjectSpawnDelegateRef;
}
function spawnMobAtPos(mobEntry: { name; id }, pos, rot) {
    var trackSpawnedMob = (spawned) => {
        try {
            if (spawned && !spawned.isNull?.()) {
                stabilizeMobInstance(spawned, pos);
                spawnedPersistentMobs.push(spawned);
                trackPersistentMob(mobEntry, pos, rot, spawned);
            }
        } catch(_) {}
        return spawned;
    };
    var getMobPrefabName = () | null => {
        try {
            if (MobDataUtilityClass) {
                try {
                    var nameObj = MobDataUtilityClass.method("GetMobPrefabName").invoke(mobEntry.id);
                    var text = nameObj?.content ?? String(nameObj ?? "");
                    if (text && text !== "null" && text !== "?") return text;
                } catch(_) {}
                try {
                    var nameObj = MobDataUtilityClass.method("GetMobPrefabName", 1).invoke(mobEntry.id);
                    var text = nameObj?.content ?? String(nameObj ?? "");
                    if (text && text !== "null" && text !== "?") return text;
                } catch(_) {}
            }
        } catch(_) {}
        return null;
    };
    var tryPrefabFallback = () => {
        try {
            var exactPrefab = getMobPrefabName();
            var cleanName = mobEntry.name.replace(/^mob_prefab\//, "");
            var fallbackNames = [
                exactPrefab,
                cleanName,
                "mob_prefab/" + cleanName,
                "mob_" + cleanName,
                cleanName.replace(/\s+/g, ""),
                cleanName.replace(/\s+/g, "_"),
                "Mob" + cleanName,
                cleanName + "Mob",
                cleanName + "Controller"
            ];
            for (var prefabName of fallbackNames) {
                if (!prefabName) continue;
                var spawned = spawnNetworkPrefab(prefabName, pos, rot);
                if (spawned && !spawned.isNull?.()) return trackSpawnedMob(spawned);
            }
        } catch(_) {}
        return null;
    };
    try {
        acEnableMobValidatorBypass();
        var spawnDelegate = acGetNetworkObjectSpawnDelegateRef();
        var resolved = acResolveMobID(mobEntry.id) ?? acResolveMobID(mobEntry.name);
        if (resolved !== null) {
            try {
                var result = PrefabGen.method("SpawnMob", 5).invoke(resolved, pos, rot || identityQuaternion, spawnDelegate, Il2Cpp.string("mod"));
                if (result && !result.isNull?.()) return trackSpawnedMob(result);
                return null;
            } catch(_) {}
            try {
                var result = PrefabGen.method("SpawnMob", 4).invoke(resolved, pos, rot || identityQuaternion, spawnDelegate);
                if (result && !result.isNull?.()) return trackSpawnedMob(result);
                return null;
            } catch(_) {}
        }
    } catch(e) {
        if (String(e).toLowerCase().indexOf("access violation") >= 0) mobSpawnAsyncBroken = true;
        console.error("[spawnMobAtPos] enum path " + mobEntry.name + " id=" + mobEntry.id + ": " + e);
    }
    var fallback = tryPrefabFallback();
    if (fallback && !fallback.isNull?.()) return fallback;
    return null;
}
    function spawnNetworkPrefab(prefabName, pos, rot) {
        try {
            var runner = PrefabGen.field("_instance").value.method("get_runner").invoke();
            if (!runner || runner.isNull()) return null;
            var sources = runner.field("_config").value.field("PrefabTable").value.field("_sources").value;
            var count = sources.method("get_Count").invoke();
            for (var i = 0; i < count; i++) {
                try {
                    var source = sources.method("get_Item").invoke(i);
                    var desc = source.method("get_Description").invoke().toString();
                    if (desc.toLowerCase().includes(String(prefabName).toLowerCase())) {
                        var no = source.method("WaitForResult").invoke();
                        if (!no || no.isNull()) return null;
                        var makeZeroForType = (type) => {
                            if (type.class.isEnum || type.isPrimitive) return 0;
                            if (!type.class.isValueType) return NULL;
                            var fields = type.class.fields.filter(f => !f.isStatic);
                            if (fields.length === 0) return 0;
                            return fields.map(f => makeZeroForType(f.type));
                        };
                        var buildNullableArg = (nullableType, hasValue, value) => {
                            var fields = nullableType.class.fields.filter(f => !f.isStatic);
                            return fields.map(f => {
                                var lname = f.name.toLowerCase();
                                if (lname.includes("hasvalue")) return hasValue ? 1 : 0;
                                if (lname === "value") return hasValue ? value : makeZeroForType(f.type);
                                return makeZeroForType(f.type);
                            });
                        };
                        var normalizeValue = (type, value) => {
                            if (typeof value === "boolean") return value ? 1 : 0;
                            if (value instanceof Il2Cpp.ValueType) {
                                var fields = type.class.fields.filter(f => !f.isStatic);
                                if (fields.length === 0) return 0;
                                return fields.map(f => normalizeValue(f.type, f.bind(value).value));
                            }
                            if (Array.isArray(value)) return value.map(v => normalizeValue(type, v));
                            return value;
                        };
                        var buildNullableFromValueType = (nullableType, valueType) => {
                            return buildNullableArg(nullableType, true, normalizeValue(valueType.type, valueType));
                        };
                        var spawnMethod = null;
                        for (var m of runner.method("Spawn").overloads()) {
                            if (m.parameterCount !== 6 || m.isGeneric) continue;
                            var p = m.parameters;
                            if (p[0].type.name.includes("Fusion.NetworkObject") &&
                                p[1].type.name.startsWith("System.Nullable") && p[1].type.name.includes("Vector3") &&
                                p[2].type.name.startsWith("System.Nullable") && p[2].type.name.includes("Quaternion") &&
                                p[3].type.name.startsWith("System.Nullable") && p[3].type.name.includes("PlayerRef") &&
                                p[4].type.name.includes("OnBeforeSpawned") &&
                                p[5].type.name.includes("NetworkSpawnFlags")) {
                                spawnMethod = m; break;
                            }
                        }
                        if (!spawnMethod) return null;
                        var posArg = buildNullableFromValueType(spawnMethod.parameters[1].type, pos);
                        var rotArg = buildNullableFromValueType(spawnMethod.parameters[2].type, rot);
                        var authArg = buildNullableArg(spawnMethod.parameters[3].type, false, makeZeroForType(spawnMethod.parameters[3].type));
                        var onBeforeArg = spawnMethod.parameters[4].type.class.isValueType ? makeZeroForType(spawnMethod.parameters[4].type) ;
                        var spawned = spawnMethod.bind(runner).invoke(no, posArg, rotArg, authArg, onBeforeArg, 0);
                        if (spawned && !spawned.isNull()) spawnedNetworkPrefabs.push(spawned);
                        return spawned;
                    }
                } catch(_) {}
            }
        } catch(e) { console.error("spawnNetworkPrefab error: " + e); }
        return null;
    }
    function getNetworkPrefabDescriptions()[] {
        var names[] = [];
        try {
            var runner = PrefabGen.field("_instance").value.method("get_runner").invoke();
            if (!runner || runner.isNull()) return names;
            var sources = runner.field("_config").value.field("PrefabTable").value.field("_sources").value;
            var count = sources.method("get_Count").invoke();
            for (var i = 0; i < count; i++) {
                try {
                    var source = sources.method("get_Item").invoke(i);
                    var desc = source.method("get_Description").invoke().toString();
                    if (desc) names.push(String(desc));
                } catch(_) {}
            }
        } catch(e) { console.error("getNetworkPrefabDescriptions error: " + e); }
        return names;
    }
    function cleanPrefabDescription(desc) {
        try {
            var parts = String(desc).split(/[\/\\]/g);
            var name = parts[parts.length - 1] || String(desc);
            name = name.replace(/\(.*?\)/g, "");
            name = name.replace(/\s+/g, "");
            name = name.replace(/^.*:/, "");
            return name.trim();
        } catch(_) {
            return String(desc);
        }
    }
    function scanExistingMobPrefabs()[] {
        var found[] = [];
        var seen = new Set();
        var knownMobNames = new Set();
        for (var mob of mobIDs) {
            knownMobNames.add(mob.name.toLowerCase());
            knownMobNames.add((mob.name + "Controller").toLowerCase());
        }
        var mobWords = [
            "mob", "boss", "angler", "armstrong", "banshee", "bomber", "chicken", "cyst",
            "gorilla", "bighead", "phantom", "evileye", "spider", "lanky", "blob", "cutie", "mimic",
            "ringmaster", "puppet", "robotdog", "shadow", "slimey", "shark", "zombie", "skinwalker",
            "yinworm", "yangworm", "smiley", "momboss"
        ];
        for (var desc of getNetworkPrefabDescriptions()) {
            var name = cleanPrefabDescription(desc);
            var lower = name.toLowerCase();
            var looksLikeMob = knownMobNames.has(lower)
                || mobWords.some(word => lower.includes(word))
                || lower.startsWith("mob_prefab");
            if (!looksLikeMob) continue;
            if (lower.includes("spawner") || lower.includes("spawntrigger") || lower.includes("spawngroup") || lower.includes("lobbyhandler")) continue;
            if (seen.has(lower)) continue;
            seen.add(lower);
            found.push(name);
        }
        found.sort((a, b) => a.localeCompare(b));
        adminSpawnerMobPrefabs = found;
        return found;
    }
    function cleanupDeadTrackedObjects(list[]) {
        for (var i = list.length - 1; i >= 0; i--) {
            var obj = list[i];
            if (!obj || obj.isNull?.()) list.splice(i, 1);
        }
    }
    function trySetObjectVelocity(obj, velocity) {
        try {
            if (!obj || obj.isNull?.()) return false;
            var rb = null;
            try { rb = getComponent(obj, Rigidbody); } catch(_) {}
            if ((!rb || rb.isNull?.()) && obj.method) {
                try {
                    var go = obj.method("get_gameObject").invoke();
                    if (go && !go.isNull()) rb = getComponent(go, Rigidbody);
                } catch(_) {}
            }
            if ((!rb || rb.isNull?.()) && obj.method) {
                try {
                    var tf = getTransform(obj);
                    if (tf && !tf.isNull()) rb = getComponentInParent(tf.method("get_gameObject").invoke(), Rigidbody);
                } catch(_) {}
            }
            if ((!rb || rb.isNull?.()) && obj.method) {
                try {
                    var go = obj.method("get_gameObject").invoke();
                    if (go && !go.isNull()) {
                        rb = go.method("GetComponentInChildren", 0).inflate(Rigidbody).invoke();
                    }
                } catch(_) {}
            }
            if (rb && !rb.isNull()) {
                try { rb.method("set_isKinematic").invoke(false); } catch(_) {}
                try { rb.method("set_useGravity").invoke(true); } catch(_) {}
                try { rb.method("set_velocity").invoke(velocity); return true; } catch(_) {}
                try { rb.method("AddForce").invoke(velocity, 2); return true; } catch(_) {}
                try { rb.method("AddForce").invoke(velocity); return true; } catch(_) {}
                try { rb.field("_velocity").value = velocity; return true; } catch(_) {}
            }
        } catch(_) {}
        return false;
    }
    function getLaunchForward(sourceTransform, referenceTransform = null) {
        try {
            var refTf = (referenceTransform && !referenceTransform.isNull?.())
                ? referenceTransform
                : (headCollider && !headCollider.isNull?.() ? getTransform(headCollider) );
            var referenceForward = refTf && !refTf.isNull?.()
                ? readVec3Components(refTf.method("get_forward").invoke())
                : [0, 0, 1];
            var cacheKey = normalizeSceneObjectHandle(sourceTransform) || String(sourceTransform);
            var cachedAxis = launchAxisCache.get(cacheKey);
            var readAxis = (axisName) => {
                switch (axisName) {
                    case "forward": return sourceTransform.method("get_forward").invoke();
                    case "-forward": return Vector3.method("op_Multiply", 2).invoke(sourceTransform.method("get_forward").invoke(), -1);
                    case "up": return sourceTransform.method("get_up").invoke();
                    case "-up": return Vector3.method("op_Multiply", 2).invoke(sourceTransform.method("get_up").invoke(), -1);
                    case "right": return sourceTransform.method("get_right").invoke();
                    case "-right": return Vector3.method("op_Multiply", 2).invoke(sourceTransform.method("get_right").invoke(), -1);
                    default: return sourceTransform.method("get_forward").invoke();
                }
            };
            if (cachedAxis) {
                return Vector3.method("Normalize").invoke(readAxis(cachedAxis));
            }
            var candidates = ["forward", "-forward"];
            var bestAxis = "forward";
            var bestScore = -999999;
            for (var axisName of candidates) {
                try {
                    var vec = readAxis(axisName);
                    var v = readVec3Components(vec);
                    var score = (v[0] * referenceForward[0]) + (v[1] * referenceForward[1]) + (v[2] * referenceForward[2]);
                    if (score > bestScore) {
                        bestScore = score;
                        bestAxis = axisName;
                    }
                } catch(_) {}
            }
            launchAxisCache.set(cacheKey, bestAxis);
            return Vector3.method("Normalize").invoke(readAxis(bestAxis));
        } catch(_) {
            try { return sourceTransform.method("get_forward").invoke(); } catch(_) { return [0, 0, 1]; }
        }
    }
    function getLaunchUp(sourceTransform, forward) {
        try {
            var worldUp = [0, 1, 0];
            var dot = Vector3.method("Dot").invoke(worldUp, forward) ;
            var projected = Vector3.method("op_Subtraction", 2).invoke(
                worldUp,
                Vector3.method("op_Multiply", 2).invoke(forward, dot)
            );
            var mag = Vector3.method("Magnitude").invoke(projected) ;
            if (mag < 0.05) {
                projected = sourceTransform.method("get_up").invoke();
            }
            return Vector3.method("Normalize").invoke(projected);
        } catch(_) {
            try { return sourceTransform.method("get_up").invoke(); } catch(_) { return [0, 1, 0]; }
        }
    }
    function getLaunchRotation(sourceTransform, forward, up) {
        try { return Quaternion.method("LookRotation", 2).invoke(forward, up); } catch(_) {}
        try { return Quaternion.method("LookRotation", 1).invoke(forward); } catch(_) {}
        try { return sourceTransform.method("get_rotation").invoke(); } catch(_) { return identityQuaternion; }
    }
    function spawnForwardLaunchedNetworkPrefab(prefabName, sourceTransform, speed = 30.0, forwardOffset = 1.0) {
        try {
            var forward = getLaunchForward(sourceTransform);
            var up = getLaunchUp(sourceTransform, forward);
            var spawnPos = Vector3.method("op_Addition").invoke(
                sourceTransform.method("get_position").invoke(),
                Vector3.method("op_Addition").invoke(
                    Vector3.method("op_Multiply", 2).invoke(forward, forwardOffset),
                    Vector3.method("op_Multiply", 2).invoke(up, -0.06)
                )
            );
            var rot = getLaunchRotation(sourceTransform, forward, up);
            var spawned = spawnNetworkPrefab(prefabName, spawnPos, rot);
            if (spawned && !spawned.isNull()) {
                var vel = Vector3.method("op_Addition").invoke(
                    Vector3.method("op_Multiply", 2).invoke(forward, speed),
                    Vector3.method("op_Multiply", 2).invoke(up, 3.0)
                );
                if (!trySetObjectVelocity(spawned, vel)) {
                    try {
                        var tf = getTransform(spawned);
                        tf.method("set_position").invoke(
                            Vector3.method("op_Addition").invoke(
                                spawnPos,
                                Vector3.method("op_Multiply", 2).invoke(forward, 2.2)
                            )
                        );
                    } catch(_) {}
                }
            }
            return spawned;
        } catch(_) {
            return null;
        }
    }
    function spawnForwardLaunchedItem(bareID, sourceTransform, speed = 24.0, forwardOffset = 0.82) {
        try {
            var forward = getLaunchForward(sourceTransform);
            var up = getLaunchUp(sourceTransform, forward);
            var spawnPos = Vector3.method("op_Addition").invoke(
                sourceTransform.method("get_position").invoke(),
                Vector3.method("op_Addition").invoke(
                    Vector3.method("op_Multiply", 2).invoke(forward, forwardOffset),
                    Vector3.method("op_Multiply", 2).invoke(up, -0.05)
                )
            );
            var rot = getLaunchRotation(sourceTransform, forward, up);
            var spawned = spawnItemAtPos(bareID, spawnPos, rot);
            if (spawned && !spawned.isNull()) {
                var velocity = Vector3.method("op_Addition").invoke(
                    Vector3.method("op_Multiply", 2).invoke(forward, speed),
                    Vector3.method("op_Multiply", 2).invoke(up, 1.2)
                );
                trySetObjectVelocity(spawned, velocity);
            }
            return spawned;
        } catch(_) {
            return null;
        }
    }
    function getGunAimDirection() {
        try {
            var referenceTf = headCollider && !headCollider.isNull?.() ? getTransform(headCollider) ;
            return getLaunchForward(rightHandTransform, referenceTf);
        } catch(_) {
            return rightHandTransform.method("get_forward").invoke();
        }
    }
    function setUniformLocalScale(targetObj, parentObj, worldScale) {
        try {
            var parentScale = getTransform(parentObj).method("get_localScale").invoke();
            var sx = Math.abs(parentScale.field("x").value) || 1.0;
            var sy = Math.abs(parentScale.field("y").value) || 1.0;
            var sz = Math.abs(parentScale.field("z").value) || 1.0;
            getTransform(targetObj).method("set_localScale").invoke([worldScale / sx, worldScale / sy, worldScale / sz]);
        } catch(_) {
            try { getTransform(targetObj).method("set_localScale").invoke([worldScale, worldScale, worldScale]); } catch(_) {}
        }
    }
    function addSurfaceOutline(surfaceObject, color: [number, number, number, number], thickness = 0.045) {
        if (!menuOutlineEnabled) return;
        return;
        var parent = getTransform(surfaceObject);
        var segments = [
            { pos: [0.505, 0.0, 0.5], scale: [0.04, 1.02, thickness] },
            { pos: [0.505, 0.0, -0.5], scale: [0.04, 1.02, thickness] },
            { pos: [0.505, 0.5, 0.0], scale: [0.04, thickness, 1.02] },
            { pos: [0.505, -0.5, 0.0], scale: [0.04, thickness, 1.02] }
        ];
        for (var seg of segments) {
            try {
                var edge = createObject(seg.pos, identityQuaternion, seg.scale , 3, color, parent);
                var col = getComponent(edge, Collider);
                if (col && !col.isNull()) col.method("set_enabled").invoke(false);
            } catch(_) {}
        }
    }
    function addRoundedCorners(surfaceObject, color: [number, number, number, number], radius = 0.022) {
        if (!roundCornersEnabled) return;
        return;
        var parent = getTransform(surfaceObject);
        var corners = [
            [0.508, 0.47, 0.47],
            [0.508, 0.47, -0.47],
            [0.508, -0.47, 0.47],
            [0.508, -0.47, -0.47]
        ];
        for (var corner of corners) {
            try {
                var sphere = createObject(corner , identityQuaternion, oneVector, 0, color, parent);
                var col = getComponent(sphere, Collider);
                if (col && !col.isNull()) col.method("set_enabled").invoke(false);
                setUniformLocalScale(sphere, surfaceObject, radius);
            } catch(_) {}
        }
    }
    var cachedSpawnPrefab = null;
    var cachedSpawnPrefabName = "";
    var prefabTestIndex = 0;
    var lockedItems[] = [];
    var lastSpawnSearchTime = 0;
    function world2Player(position) {
        position = Vector3.method("op_Subtraction", 2).invoke(position, getTransform(bodyCollider).method("get_position").invoke());
        position = Vector3.method("op_Addition", 2).invoke(position, getTransform(GTPlayer).method("get_position").invoke());
        return position;
    }
    function teleportPlayer(position) {
        var player = NetPlayer.method("get_localPlayer").invoke();
        if (!player) return;
        player.method("RPC_Teleport").invoke(world2Player(position));
    }
    function sendNotification(text = "", requiresReload = true, clearTime = 5) {
        var isOld = (currentNotification == text);
        notifactionResetTime = time + clearTime;
        currentNotification = text;
        if (requiresReload && !isOld) reloadMenu();
    }
function createObject(pos = zeroVector, rot = identityQuaternion, scale = oneVector, primitiveType = 3, colorArr: [number, number, number, number] = [1, 1, 1, 1], parent = null, enableCollider = false) {
    var obj = GameObject.method("CreatePrimitive").invoke(primitiveType);
    var renderer = getComponent(obj, Renderer);
    if (colorArr[3] == 0) {
        renderer.method("set_enabled").invoke(false);
    } else {
        var material = renderer.method("get_material").invoke();
        material.method("set_shader").invoke(UberShader);
        material.method("set_color").invoke(colorArr);
    }
    var col = getComponent(obj, Collider);
    if (col && !col.isNull()) {
        if (enableCollider) {
            col.method("set_enabled").invoke(true);
            col.method("set_isTrigger").invoke(true);
        } else {
            col.method("set_isTrigger").invoke(true);
        }
    }
    var transform = getTransform(obj);
    if (parent != null) transform.method("SetParent", 2).invoke(parent, false);
    transform.method("set_position").invoke(pos);
    transform.method("set_rotation").invoke(rot);
    transform.method("set_localScale").invoke(scale);
    return obj;
}
    function setRendererColorSafe(obj, color: [number, number, number, number]) {
        try {
            if (!obj || obj.isNull?.()) return;
            var renderer = getComponent(obj, Renderer);
            if (!renderer || renderer.isNull?.()) return;
            var material = renderer.method("get_material").invoke();
            if (material && !material.isNull?.()) material.method("set_color").invoke(color);
        } catch(_) {}
    }
    function setTextColorSafe(obj, color: [number, number, number, number]) {
        try {
            if (!obj || obj.isNull?.()) return;
            try {
                var tmp = getComponent(obj, TextMeshPro3D);
                if (tmp && !tmp.isNull?.()) {
                    try { tmp.method("set_color").invoke(color); } catch(_) {}
                    return;
                }
            } catch(_) {}
            try {
                var tm = getComponent(obj, TextMesh);
                if (tm && !tm.isNull?.()) {
                    try { tm.method("set_color").invoke(color); } catch(_) {}
                }
            } catch(_) {}
        } catch(_) {}
    }
    function updateLiveMenuThemeVisuals() {
        try {
            if (!menu || menu.isNull?.()) return;
            var gos = menu.method("GetComponentsInChildren", 0).inflate(GameObject).invoke(true);
            if (!gos || gos.isNull?.()) return;
            for (var i = 0; i < gos.length; i++) {
                try {
                    var go = gos.get(i);
                    if (!go || go.isNull?.()) continue;
                    var name = (go.method("get_name").invoke()?.content ?? "").toString();
                    if (name === "MenuBackground") {
                        setRendererColorSafe(go, bgColor);
                    } else if (name.startsWith("@")) {
                        var buttonData = getIndex(name.slice(1));
                        if (themeMode === 10) {
                            var isSideButton = name === "@Disconnect" || name === "@GlobalReturn" || name === "@PreviousPage" || name === "@NextPage";
                            var sideColor: [number, number, number, number] = buttonData?.enabled
                                ? [0.22, 0.22, 0.22, 1.0]
                                : [0.01, 0.01, 0.01, 0.96];
                            var pageColor: [number, number, number, number] = buttonData?.enabled
                                ? buttonPressedColor
                                : buttonColor;
                            setRendererColorSafe(go, isSideButton ? sideColor : pageColor);
                        } else if (buttonData) {
                            setRendererColorSafe(go, buttonData.enabled ? buttonPressedColor : buttonColor);
                        }
                    } else if (name === "MenuText") {
                        setTextColorSafe(go, textColor);
                    }
                } catch(_) {}
            }
        } catch(_) {}
    }
    function axisDeadzone(value, deadzone = 0.16) {
        return Math.abs(value) < deadzone ? 0 : value;
    }
    function smoothNumber(current, target, amount = 0.18) {
        return current + ((target - current) * amount);
    }
    function smoothVec3(state: [number, number, number], target: [number, number, number], amount = 0.18) {
        state[0] = smoothNumber(state[0], target[0], amount);
        state[1] = smoothNumber(state[1], target[1], amount);
        state[2] = smoothNumber(state[2], target[2], amount);
        return state;
    }
    function readVec3Components(vec): [number, number, number] {
        return [
            (vec.field("x").value ) || 0,
            (vec.field("y").value ) || 0,
            (vec.field("z").value ) || 0
        ];
    }
    function normalizeXZ(x, z): [number, number] {
        var mag = Math.sqrt((x * x) + (z * z));
        if (mag < 0.0001) return [0, 1];
        return [x / mag, z / mag];
    }
    function getPlayerLaunchTransform(player, handIndex = 1, heldGrabbable = null) {
        try {
            var handAnchor = getPlayerHandAnchorTransform(player, handIndex);
            if (handAnchor && !handAnchor.isNull?.()) return handAnchor;
        } catch(_) {}
        try {
            if (heldGrabbable && !heldGrabbable.isNull?.()) {
                try {
                    var heldTf = getTransform(heldGrabbable);
                    if (heldTf && !heldTf.isNull?.()) return heldTf;
                } catch(_) {}
                try {
                    var heldGo = heldGrabbable.method("get_gameObject").invoke();
                    if (heldGo && !heldGo.isNull?.()) {
                        var heldTf = getTransform(heldGo);
                        if (heldTf && !heldTf.isNull?.()) return heldTf;
                    }
                } catch(_) {}
            }
        } catch(_) {}
        return getPlayerProjectileOriginTransform(player);
    }
    function getPlayerHeadTransform(player) {
        try {
            var head = player.field("headCollider").value;
            if (head && !head.isNull?.()) return getTransform(head);
        } catch(_) {}
        try {
            var playerView = player.method("get_playerView").invoke();
            if (playerView && !playerView.isNull?.()) {
                try {
                    var cameraTransform = playerView.field("_cameraTransform").value;
                    if (cameraTransform && !cameraTransform.isNull?.()) return cameraTransform;
                } catch(_) {}
            }
        } catch(_) {}
        try { return getTransform(player); } catch(_) { return null; }
    }
    function collectAllLobbyItemsWithHeld()[] {
        var results = getAllLobbyItemGameObjects();
        var seen = new Set();
        var finalItems[] = [];
        for (var item of results) {
            try {
                var key = normalizeSceneObjectHandle(item) || String(item);
                if (!seen.has(key)) {
                    seen.add(key);
                    finalItems.push(item);
                }
            } catch(_) {}
        }
        for (var player of getAllNetPlayersList(true)) {
            for (var handIndex of [0, 1]) {
                try {
                    var held = getPlayerHeldGrabbable(player, handIndex);
                    if (!held || held.isNull?.()) continue;
                    var key = normalizeSceneObjectHandle(held) || String(held);
                    if (!seen.has(key)) {
                        seen.add(key);
                        finalItems.push(held);
                    }
                } catch(_) {}
            }
            try {
                var playerView = player.method("get_playerView").invoke();
                if (playerView && !playerView.isNull?.()) {
                    var pvGo = playerView.method("get_gameObject").invoke();
                    if (pvGo && !pvGo.isNull?.()) {
                        try {
                            var gbis = pvGo.method("GetComponentsInChildren", 0).inflate(GBIClass).invoke(true);
                            if (gbis && !gbis.isNull?.()) {
                                for (var i = 0; i < gbis.length; i++) {
                                    try {
                                        var item = gbis.get(i);
                                        if (!item || item.isNull?.()) continue;
                                        var key = normalizeSceneObjectHandle(item) || String(item);
                                        if (!seen.has(key)) {
                                            seen.add(key);
                                            finalItems.push(item);
                                        }
                                    } catch(_) {}
                                }
                            }
                        } catch(_) {}
                        try {
                            var gbos = pvGo.method("GetComponentsInChildren", 0).inflate(GBOClass).invoke(true);
                            if (gbos && !gbos.isNull?.()) {
                                for (var i = 0; i < gbos.length; i++) {
                                    try {
                                        var item = gbos.get(i);
                                        if (!item || item.isNull?.()) continue;
                                        var key = normalizeSceneObjectHandle(item) || String(item);
                                        if (!seen.has(key)) {
                                            seen.add(key);
                                            finalItems.push(item);
                                        }
                                    } catch(_) {}
                                }
                            }
                        } catch(_) {}
                    }
                }
            } catch(_) {}
        }
        return finalItems;
    }
    function getRootLikeObject(obj) {
        try {
            if (!obj || obj.isNull?.()) return null;
            var go = obj;
            try {
                var maybeGo = obj.method("get_gameObject").invoke();
                if (maybeGo && !maybeGo.isNull?.()) go = maybeGo;
            } catch(_) {}
            try {
                var rootTf = getTransform(go).method("get_root").invoke();
                if (rootTf && !rootTf.isNull?.()) {
                    var rootGo = rootTf.method("get_gameObject").invoke();
                    if (rootGo && !rootGo.isNull?.()) return rootGo;
                }
            } catch(_) {}
            return go;
        } catch(_) {
            return obj;
        }
    }
    function isItemOccupiedByPlayer(item) {
        try {
            if (!item || item.isNull?.()) return false;
            var rootKey = normalizeSceneObjectHandle(getRootLikeObject(item)) || normalizeSceneObjectHandle(item);
            for (var player of getAllNetPlayersList(true)) {
                try {
                    for (var handIndex of [0, 1]) {
                        var held = getPlayerHeldGrabbable(player, handIndex);
                        if (!held || held.isNull?.()) continue;
                        var heldKey = normalizeSceneObjectHandle(getRootLikeObject(held)) || normalizeSceneObjectHandle(held);
                        if (rootKey && heldKey && rootKey === heldKey) return true;
                    }
                } catch(_) {}
            }
            try {
                var rootGo = getRootLikeObject(item);
                var inPlayer = rootGo.method("GetComponentInParent", 0).inflate(NetPlayer).invoke();
                if (inPlayer && !inPlayer.isNull?.()) return true;
            } catch(_) {}
        } catch(_) {}
        return false;
    }
    function tryForceDeveloperMode() {
        try {
            var AppClass = AssemblyCSharp.class("AnimalCompany.App");
            var appState = AppClass.method("get_state").invoke();
            if (!appState || appState.isNull?.()) return;
            try {
                var userState = appState.method("get_user").invoke();
                if (userState && !userState.isNull?.()) {
                    try { userState.field("_isDeveloper").value = true; } catch(_) {}
                    try { userState.field("isDeveloper").value = true; } catch(_) {}
                    tryCallNames(userState, ["set_isDeveloper"], 1, true);
                }
            } catch(_) {}
            try {
                var mapMachine = appState.method("get_mapMachine").invoke();
                if (mapMachine && !mapMachine.isNull?.()) {
                    try {
                        var useDevMode = mapMachine.method("get_useDevMode").invoke();
                        if (useDevMode && !useDevMode.isNull?.()) {
                            try { useDevMode.method("set_value").invoke(true); } catch(_) {}
                            try { useDevMode.field("_value").value = true; } catch(_) {}
                            try { useDevMode.field("value").value = true; } catch(_) {}
                        }
                    } catch(_) {}
                    try { mapMachine.field("_useDevMode").value = true; } catch(_) {}
                    tryCallNames(mapMachine, ["set_useDevMode"], 1, true);
                    tryCallNames(mapMachine, ["RefreshDevMode", "Reload", "RefreshButtons", "UpdateButtons", "OpenDevMenu", "OpenDevPanel"], 0);
                }
            } catch(_) {}
        } catch(_) {}
    }
    function spawnHeldItemDuplicateForPlayer(player, forwardSpeed = 14.0) {
        try {
            if (!player || player.isNull?.()) return false;
            var held = getPlayerHeldGrabbable(player, 1) ?? getPlayerHeldGrabbable(player, 0);
            if (!held || held.isNull?.()) return false;
            var itemId = getGrabbableItemId(held);
            if (!itemId) return false;
            var handTf = getPlayerLaunchTransform(player, getPlayerHeldGrabbable(player, 1) === held ? 1 : 0, held);
            if (!handTf || handTf.isNull?.()) return false;
            var forward = getLaunchForward(handTf, getTransform(player));
            var up = getLaunchUp(handTf, forward);
            var rot = getLaunchRotation(handTf, forward, up);
            var pos = handTf.method("get_position").invoke();
            var spawnPos = Vector3.method("op_Addition").invoke(
                pos,
                Vector3.method("op_Addition").invoke(
                    Vector3.method("op_Multiply", 2).invoke(forward, 0.42),
                    Vector3.method("op_Multiply", 2).invoke(up, -0.02)
                )
            );
            var spawned = spawnItemAtPos(itemId, spawnPos, rot);
            if (!spawned || spawned.isNull?.()) return false;
            try {
                var srcGbo = held.method("GetComponent", 1).inflate(GBOClass).invoke();
                var dstGbo = spawned.method("GetComponent", 1).inflate(GBOClass).invoke();
                if (srcGbo && !srcGbo.isNull?.() && dstGbo && !dstGbo.isNull?.()) {
                    try { dstGbo.method("set_scaleModifier").invoke(srcGbo.method("get_scaleModifier").invoke()); } catch(_) {}
                    try { dstGbo.method("set_colorHue").invoke(srcGbo.method("get_colorHue").invoke()); } catch(_) {}
                    try { dstGbo.method("set_colorSaturation").invoke(srcGbo.method("get_colorSaturation").invoke()); } catch(_) {}
                    try { dstGbo.field("_scaleModifier").value = srcGbo.field("_scaleModifier").value; } catch(_) {}
                    try { dstGbo.field("_colorHue").value = srcGbo.field("_colorHue").value; } catch(_) {}
                    try { dstGbo.field("_colorSaturation").value = srcGbo.field("_colorSaturation").value; } catch(_) {}
                }
            } catch(_) {}
            trySetObjectVelocity(spawned, Vector3.method("op_Addition").invoke(
                Vector3.method("op_Multiply", 2).invoke(forward, forwardSpeed),
                Vector3.method("op_Multiply", 2).invoke(up, 0.7)
            ));
            return true;
        } catch(_) {
            return false;
        }
    }
    function spawnHeldItemEjectBurstForPlayer(player, burstCount = 3) {
        try {
            if (!player || player.isNull?.()) return false;
            var held = getPlayerHeldGrabbable(player, 1) ?? getPlayerHeldGrabbable(player, 0);
            if (!held || held.isNull?.()) return false;
            var itemId = getGrabbableItemId(held);
            if (!itemId) return false;
            var handIndex = getPlayerHeldGrabbable(player, 1) === held ? 1 : 0;
            var handTf = getPlayerLaunchTransform(player, handIndex, held);
            if (!handTf || handTf.isNull?.()) return false;
            var straightForward = getPlayerStraightForward(player);
            var up: [number, number, number] = [0, 1, 0];
            var basePos = handTf.method("get_position").invoke();
            var rot = getLookRotationFromForward(straightForward);
            var spawnedAny = false;
            for (var i = 0; i < burstCount; i++) {
                try {
                    var side = ((i % 2 === 0) ? -1 : 1) * (0.03 + (i * 0.015));
                    var spawnPos = [
                        (basePos.field("x").value ) + (straightForward[0] * 0.24),
                        (basePos.field("y").value ) - 0.02 + (i * 0.01),
                        (basePos.field("z").value ) + (straightForward[2] * 0.24) + side
                    ];
                    var spawned = spawnItemAtPos(itemId, spawnPos, rot);
                    if (!spawned || spawned.isNull?.()) continue;
                    spawnedAny = true;
                    try {
                        var srcGbo = held.method("GetComponent", 1).inflate(GBOClass).invoke();
                        var dstGbo = spawned.method("GetComponent", 1).inflate(GBOClass).invoke();
                        if (srcGbo && !srcGbo.isNull?.() && dstGbo && !dstGbo.isNull?.()) {
                            try { dstGbo.method("set_scaleModifier").invoke(srcGbo.method("get_scaleModifier").invoke()); } catch(_) {}
                            try { dstGbo.method("set_colorHue").invoke(srcGbo.method("get_colorHue").invoke()); } catch(_) {}
                            try { dstGbo.method("set_colorSaturation").invoke(srcGbo.method("get_colorSaturation").invoke()); } catch(_) {}
                        }
                    } catch(_) {}
                    trySetObjectVelocity(spawned, [
                        straightForward[0] * (7.0 + (i * 0.45)),
                        0.6 + (i * 0.08),
                        straightForward[2] * (7.0 + (i * 0.45))
                    ]);
                } catch(_) {}
            }
            return spawnedAny;
        } catch(_) {
            return false;
        }
    }
    function pulseWeaponSecondary(grabbable) {
        for (var i = 0; i < 6; i++) {
            tryCallNames(grabbable, ["HandleSecondaryUse", "HandleGripUse", "CockHammer", "PullBackHammer", "HandleSecondaryPress", "PressBButton"], 0);
            tryCallNames(grabbable, ["HandleSecondaryButton", "HandleSecondaryUse", "HandleGripUse", "CockHammer", "PullBackHammer", "HandleSecondaryPress", "PressBButton"], 1, true);
            tryCallNames(grabbable, ["OnSecondaryButtonDown", "OnSecondaryUseDown", "OnBButtonDown", "HandleBButtonDown"], 0);
            tryCallNames(grabbable, ["HandleSecondaryButton", "HandleSecondaryUse", "HandleGripUse", "HandleSecondaryPress", "HandleBButton"], 1, false);
            tryCallNames(grabbable, ["OnSecondaryButtonUp", "OnSecondaryUseUp", "OnBButtonUp", "HandleBButtonUp"], 0);
        }
    }
    function applyGunBuffsToGrabbable(grabbable, pulseFire = false) {
        try {
            if (!grabbable || grabbable.isNull?.()) return false;
            if (!grabbableLooksLikeGun(grabbable)) return false;
            var heldClassName = String(grabbable.class?.type?.name ?? "").toLowerCase();
            var isRevolverLike = heldClassName.indexOf("revolver") >= 0;
            var isRpgLike = heldClassName.indexOf("rpg") >= 0 || heldClassName.indexOf("rocket") >= 0 || heldClassName.indexOf("flare") >= 0 || heldClassName.indexOf("zipline") >= 0;
            try { grabbable.field("_ammoLoaded").value = 255; } catch(_) {}
            try { grabbable.field("ammoLoaded").value = 255; } catch(_) {}
            try { grabbable.field("_ammo").value = 255; } catch(_) {}
            try { grabbable.field("ammo").value = 255; } catch(_) {}
            try { grabbable.field("_isHammerCocked").value = true; } catch(_) {}
            try { grabbable.field("_isCocked").value = true; } catch(_) {}
            try { grabbable.field("isHammerCocked").value = true; } catch(_) {}
            try { grabbable.field("_hasAmmo").value = true; } catch(_) {}
            try { grabbable.field("hasAmmo").value = true; } catch(_) {}
            try { grabbable.field("_isLoaded").value = true; } catch(_) {}
            try { grabbable.field("isLoaded").value = true; } catch(_) {}
            try { grabbable.field("_nextUseTime").value = 0.0; } catch(_) {}
            try { grabbable.field("_reloadTimer").value = 0.0; } catch(_) {}
            try { grabbable.field("_reloadCooldown").value = 0.0; } catch(_) {}
            try { grabbable.field("_shotCooldown").value = 0.0; } catch(_) {}
            try { grabbable.field("_timeBetweenShots").value = 0.0; } catch(_) {}
            try { grabbable.field("_useCooldown").value = 0.0; } catch(_) {}
            try { grabbable.field("_secondaryUseCooldown").value = 0.0; } catch(_) {}
            try { grabbable.field("_triggerUseCooldown").value = 0.0; } catch(_) {}
            try { grabbable.field("_hammerPullbackAmount").value = 1.0; } catch(_) {}
            try { grabbable.field("_recoilCooldown").value = 0.0; } catch(_) {}
            try { grabbable.field("recoilForceMag").value = 0.0; } catch(_) {}
            try { grabbable.field("_recoilForceMag").value = 0.0; } catch(_) {}
            try { grabbable.method("set_isHammerCocked").invoke(true); } catch(_) {}
            try { grabbable.method("set_ammoLoaded").invoke(255); } catch(_) {}
            try { grabbable.method("set_hasAmmo").invoke(true); } catch(_) {}
            try { grabbable.method("set_isLoaded").invoke(true); } catch(_) {}
            if (isRpgLike) {
                try {
                    var loadedState = grabbable.method("get_loadedState").invoke();
                    if (loadedState && !loadedState.isNull?.()) {
                        try { loadedState.field("isLoaded").value = true; } catch(_) {}
                        try { loadedState.field("_isLoaded").value = true; } catch(_) {}
                        try { grabbable.method("set_loadedState").invoke(loadedState); } catch(_) {}
                    }
                } catch(_) {}
            }
            pulseWeaponSecondary(grabbable);
            if (pulseFire) {
                for (var i = 0; i < (isRevolverLike ? 3 : 2); i++) {
                    try { grabbable.method("HandleTriggerUse").invoke(); } catch(_) {}
                }
                tryCallNames(grabbable, ["HandlePrimaryUse", "HandlePrimaryButton", "OnPrimaryButtonDown"], 0);
                tryCallNames(grabbable, ["HandlePrimaryButton"], 1, true);
                tryCallNames(grabbable, ["HandlePrimaryButton"], 1, false);
                pulseWeaponSecondary(grabbable);
            }
            try {
                var cfg = grabbable.method("get_config").invoke();
                if (cfg && !cfg.isNull?.()) {
                    try { cfg.field("recoilForceMag").value = 0.0; } catch(_) {}
                    try { cfg.field("handRecoilForceMag").value = 0.0; } catch(_) {}
                    try { cfg.field("shotSpread").value = 0.0; } catch(_) {}
                    try { cfg.field("shotSpreadMin").value = 0.0; } catch(_) {}
                    try { cfg.field("shotSpreadMax").value = 0.0; } catch(_) {}
                    try { cfg.field("ammoLoaded").value = 255; } catch(_) {}
                    try { cfg.field("ammo").value = 255; } catch(_) {}
                    try { cfg.field("hasAmmo").value = true; } catch(_) {}
                    try { cfg.field("isLoaded").value = true; } catch(_) {}
                    try { cfg.field("reloadTime").value = 0.0; } catch(_) {}
                    try { cfg.field("timeBetweenShots").value = 0.0; } catch(_) {}
                    try { cfg.field("useCooldown").value = 0.0; } catch(_) {}
                    try { cfg.field("secondaryUseCooldown").value = 0.0; } catch(_) {}
                }
            } catch(_) {}
            return true;
        } catch(_) {
            return false;
        }
    }
    function spawnGoopBurstAtTransform(sourceTransform, hue = 18, saturation = 96, count = 2, expireAfter = 2.2, velocityScale = 8.8) {
        try {
            if (!sourceTransform || sourceTransform.isNull?.()) return;
            var pos = sourceTransform.method("get_position").invoke();
            var forwardVec = readVec3Components(sourceTransform.method("get_forward").invoke());
            var [fx, fz] = normalizeXZ(forwardVec[0], forwardVec[2]);
            for (var i = 0; i < count; i++) {
                var spawnPos = [
                    (pos.field("x").value ) + (fx * 0.14) + ((Math.random() * 0.05) - 0.025),
                    (pos.field("y").value ) - 0.28 + ((Math.random() * 0.02) - 0.01),
                    (pos.field("z").value ) + (fz * 0.14) + ((Math.random() * 0.05) - 0.025)
                ];
                var goop = spawnItemAtPos("item_goop", spawnPos, identityQuaternion);
                if (!goop || goop.isNull?.()) continue;
                spawnedGoopObjects.push({ object: goop, expireAt: time + expireAfter });
                try { goop.method("set_colorHue").invoke(hue); } catch(_) {}
                try { goop.method("set_colorSaturation").invoke(saturation); } catch(_) {}
                try {
                    var goopGo = goop.method("get_gameObject").invoke();
                    if (goopGo && !goopGo.isNull?.()) {
                        try {
                            var gbo = goopGo.method("GetComponent", 1).inflate(GBOClass).invoke();
                            if (gbo && !gbo.isNull?.()) {
                                try { gbo.method("set_colorHue").invoke(hue); } catch(_) {}
                                try { gbo.method("set_colorSaturation").invoke(saturation); } catch(_) {}
                            }
                        } catch(_) {}
                        try {
                            var renderer = getComponent(goopGo, Renderer);
                            if (renderer && !renderer.isNull?.()) {
                                var material = renderer.method("get_material").invoke();
                                if (material && !material.isNull?.()) {
                                    material.method("set_color").invoke([1.0, 0.95, 0.12, 1.0]);
                                }
                            }
                        } catch(_) {}
                    }
                } catch(_) {}
                trySetObjectVelocity(goop, [
                    (fx * velocityScale) + ((Math.random() * 0.95) - 0.475),
                    -1.0 + (Math.random() * 0.35),
                    (fz * velocityScale) + ((Math.random() * 0.95) - 0.475)
                ]);
            }
        } catch(_) {}
    }
    function createSolidPlatform(pos, scale: [number, number, number] = [0.35, 0.03, 0.35], color: [number, number, number, number] = [1.0, 0.55, 0.08, 0.9]) {
        var obj = createObject(pos, identityQuaternion, scale, 3, color, null, true);
        try {
            var col = getComponent(obj, Collider);
            if (col && !col.isNull()) {
                col.method("set_enabled").invoke(true);
                col.method("set_isTrigger").invoke(false);
            }
        } catch(_) {}
        return obj;
    }
    function renderMenuText(textRootObject, surfaceObject, text = "", color: [number, number, number, number] = [1, 1, 1, 1], pos = zeroVector, size = oneVector) {
        if (!TextMesh && !TextMeshPro3D) {
            if (!menuFontWarned) {
                menuFontWarned = true;
                console.error("[menu] No TextMesh/TextMeshPro class on this build; skipping menu text");
            }
            return;
        }
        var textObj = createEmptyObject("MenuText", getTransform(textRootObject));
        var widthFactor = Math.max(size?.[0] ?? 1.0, 0.2);
        var heightFactor = Math.max((size?.[1] ?? 0.1) / 0.1, 0.6);
        var textLen = Math.max((text ?? "").trim().length, 1);
        var isButtonLabel = widthFactor <= 0.9;
        var lengthFactor = isButtonLabel
            ? Math.max(0.55, Math.min(1.0, 10.5 / textLen))
            .max(0.55, Math.min(1.0, 20.0 / textLen));
        var finalScale = (isButtonLabel ? 0.034 : 0.022) * heightFactor * lengthFactor;
        if (TextMeshPro3D) {
            var title = addComponent(textObj, TextMeshPro3D);
            var tmpFont = gettmpfontnocrash();
            if (tmpFont && !tmpFont.isNull()) {
                try { title.method("set_font").invoke(tmpFont); } catch(_) {}
                try {
                    var textRenderer = getComponent(textObj, Renderer);
                    if (textRenderer && !textRenderer.isNull()) {
                        textRenderer.method("set_enabled").invoke(true);
                        try { textRenderer.method("set_sharedMaterial").invoke(tmpFont.method("get_material").invoke()); }
                        catch(_) { try { textRenderer.method("set_material").invoke(tmpFont.method("get_material").invoke()); } catch(_) {} }
                    }
                } catch(_) {}
            }
            try { title.method("SetText", 1).invoke(Il2Cpp.string(text)); }
            catch(_) { try { title.method("set_text").invoke(Il2Cpp.string(text)); } catch(_) {} }
            try { title.method("set_fontSize").invoke((isButtonLabel ? 6.4 : 4.35) * heightFactor); } catch(_) {}
            try { title.method("set_color").invoke(color); } catch(_) {}
            try { title.method("set_alignment").invoke(514); } catch(_) {}
            try { title.method("set_enableWordWrapping").invoke(false); } catch(_) {}
            try { title.method("ForceMeshUpdate", 0).invoke(); } catch(_) {}
        } else {
            var font = getarialnocrash2();
            if (!font || font.isNull()) {
                if (!menuFontWarned) {
                    menuFontWarned = true;
                    console.error("[menu] Builtin font load failed; skipping menu text to avoid freeze");
                }
                return;
            }
            var title = addComponent(textObj, TextMesh);
            title.method("set_font").invoke(font);
            title.method("set_text").invoke(Il2Cpp.string(text));
            try { title.method("set_fontSize").invoke(isButtonLabel ? 150 : 128); } catch(_) {}
            try { title.method("set_characterSize").invoke((isButtonLabel ? 0.041 : 0.031) * heightFactor); } catch(_) {}
            try { title.method("set_anchor").invoke(4); } catch(_) {}
            try { title.method("set_alignment").invoke(1); } catch(_) {}
            try { title.method("set_color").invoke(color); } catch(_) {}
            try {
                var textRenderer = getComponent(textObj, Renderer);
                if (textRenderer && !textRenderer.isNull()) {
                    textRenderer.method("set_enabled").invoke(true);
                    try { textRenderer.method("set_sharedMaterial").invoke(font.method("get_material").invoke()); }
                    catch(_) { try { textRenderer.method("set_material").invoke(font.method("get_material").invoke()); } catch(_) {} }
                }
            } catch(_) {}
        }
        var textTransform = getTransform(textObj);
        try {
            var anchorPos = [(pos?.[0] ?? 0) + 0.0125, pos?.[1] ?? 0, pos?.[2] ?? 0];
            var worldAnchor = getTransform(surfaceObject).method("TransformPoint", 1).invoke(anchorPos);
            textTransform.method("set_position").invoke(worldAnchor);
        } catch(_) {
            textTransform.method("set_localPosition").invoke(pos);
        }
        try {
            var surfaceRotation = getTransform(surfaceObject).method("get_rotation").invoke();
            var faceRotation = Quaternion.method("op_Multiply").invoke(
                surfaceRotation,
                Quaternion.method("Euler").invoke(0.0, 90.0, 90.0)
            );
            textTransform.method("set_rotation").invoke(faceRotation);
        } catch(_) {
            textTransform.method("set_localRotation").invoke(Quaternion.method("Euler").invoke(0.0, 90.0, 90.0));
        }
        setMenuTextScale(textTransform, menu, finalScale);
    }
    function updateButtonColor(button, buttonData) {
        var RendererClass = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.Renderer");
        var renderer = getComponent(button, RendererClass);
        if (!renderer) return;
        var material = renderer.method("get_material").invoke();
        material.method("set_color").invoke(buttonData.enabled ? buttonPressedColor : buttonColor);
    }
    function reloadMenu() {
        try {
            if (menu != null && !menu.isNull?.()) {
                Object.method("Destroy", 1).invoke(menu);
                menu = null;
            }
        } catch(_) {}
        menuSnapNextFrame = true;
        try {
            if ((righthand && rightSecondary) || (!righthand && leftSecondary)) {
                renderMenu();
            }
        } catch(_) {}
    }
    var gunLocked = false;
    var lockTarget = null;
    var GunPointer = null;
    var GunLine = null;
    function renderMenu() {
        applyMenuStructurePatches();
        menuSnapNextFrame = true;
        menu = createObject(zeroVector, identityQuaternion, [0.1, 0.275, 0.36], 3, [0, 0, 0, 0]);
        try { menu.method("set_name").invoke(Il2Cpp.string("MenuRoot")); } catch(_) {}
        Destroy(getComponent(menu, BoxCollider));
        var menuBackground = createObject([0.1, 0, 0], identityQuaternion, [0.1, 1, 1], 3, bgColor, getTransform(menu));
        try { menuBackground.method("set_name").invoke(Il2Cpp.string("MenuBackground")); } catch(_) {}
        Destroy(getComponent(menuBackground, BoxCollider));
        addSurfaceOutline(menuBackground, textColor, 0.035);
        addRoundedCorners(menuBackground, buttonColor, 0.075);
        var textRootObject = createEmptyObject("MenuTextRoot", getTransform(menu));
        renderMenuText(textRootObject, menuBackground, menuName, textColor, [0.501, 0, 0.435], [1.0, 0.12]);
        var disconnectButton = createObject([0.1, 0.0, 0.225], identityQuaternion, [0.09, 0.9, 0.08], 3, buttonColor, getTransform(menu), true);
        disconnectButton.method("set_name").invoke(Il2Cpp.string("@Disconnect"));
        addComponent(disconnectButton, GorillaReportButton);
        getComponent(disconnectButton, BoxCollider).method("set_isTrigger").invoke(true);
        addSurfaceOutline(disconnectButton, textColor, 0.07);
        addRoundedCorners(disconnectButton, buttonPressedColor, 0.04);
        renderMenuText(textRootObject, disconnectButton, "Disconnect", textColor, [0.501, 0, 0], [0.82, 0.095]);
        if (time > notifactionResetTime) currentNotification = "";
        renderMenuText(textRootObject, disconnectButton, currentNotification, textColor, [0.501, 0, 0.88], [0.74, 0.13]);
        var returnButton = createObject([0.1, -0.175, -0.225], identityQuaternion, [0.09, 0.09, 0.09], 3, buttonColor, getTransform(menu));
        returnButton.method("set_name").invoke(Il2Cpp.string("@GlobalReturn"));
        addComponent(returnButton, GorillaReportButton);
        getComponent(returnButton, BoxCollider).method("set_isTrigger").invoke(true);
        addSurfaceOutline(returnButton, textColor, 0.11);
        addRoundedCorners(returnButton, buttonPressedColor, 0.035);
        renderMenuText(textRootObject, returnButton, "<", textColor, [0.501, 0, 0], [0.35, 0.11]);
        {
            var pageButton = createObject([0.1, 0.2, 0], identityQuaternion, [0.09, 0.2, 0.9], 3, buttonColor, getTransform(menu));
            pageButton.method("set_name").invoke(Il2Cpp.string("@PreviousPage"));
            addComponent(pageButton, GorillaReportButton);
            getComponent(pageButton, BoxCollider).method("set_isTrigger").invoke(true);
            addSurfaceOutline(pageButton, textColor, 0.04);
            addRoundedCorners(pageButton, buttonPressedColor, 0.04);
            renderMenuText(textRootObject, pageButton, "<", textColor, [0.501, 0, 0], [0.35, 0.11]);
        }
        {
            var pageButton = createObject([0.1, -0.2, 0], identityQuaternion, [0.09, 0.2, 0.9], 3, buttonColor, getTransform(menu));
            pageButton.method("set_name").invoke(Il2Cpp.string("@NextPage"));
            addComponent(pageButton, GorillaReportButton);
            getComponent(pageButton, BoxCollider).method("set_isTrigger").invoke(true);
            addSurfaceOutline(pageButton, textColor, 0.04);
            addRoundedCorners(pageButton, buttonPressedColor, 0.04);
            renderMenuText(textRootObject, pageButton, ">", textColor, [0.501, 0, 0], [0.35, 0.11]);
        }
        var i = 0;
        var targetMods = buttons[currentCategory].slice(currentPage * 8).slice(0, 8);
        targetMods.forEach((buttonData) => {
            var button = createObject([0.105, 0, 0.13 - (i * 0.039)], identityQuaternion, [0.09, 0.9, 0.076], 3, buttonColor, getTransform(menu));
            button.method("set_name").invoke(Il2Cpp.string("@" + buttonData.buttonText));
            addComponent(button, GorillaReportButton);
            getComponent(button, BoxCollider).method("set_isTrigger").invoke(true);
            addSurfaceOutline(button, textColor, 0.07);
            addRoundedCorners(button, buttonPressedColor, 0.04);
            renderMenuText(textRootObject, button, buttonData.buttonText, textColor, [0.501, 0, 0], [0.82, 0.095]);
            updateButtonColor(button, buttonData);
            i++;
        });
        getTransform(menu).method("set_localScale").invoke(
            Vector3.method("op_Multiply").invoke(
                Vector3.method("op_Multiply").invoke(getTransform(menu).method("get_localScale").invoke(), GTPlayer.field("k__BackingField").value),
                menuscale
            )
        );
        recenterMenu();
    }
    function renderReference() {
        if (righthand) {
            reference = createObject(zeroVector, identityQuaternion, [0.01, 0.01, 0.01], 0, bgColor, leftHandTransform);
        } else {
            reference = createObject(zeroVector, identityQuaternion, [0.01, 0.01, 0.01], 0, bgColor, rightHandTransform);
        }
        referenceCollider = getComponent(reference, Collider);
        getTransform(reference).method("set_localPosition").invoke([0.01, -0.117, 0.05]);
        reference.method("set_layer").invoke(2);
        addComponent(reference, Rigidbody).method("set_isKinematic").invoke(true);
    }
    var physicsRaycastAllVec4 = null;
    var physicsRaycastOutVec4 = null;
    var physicsRaycastOutVec5 = null;
    function renderGun(overrideLayerMask = null) {
        var StartPosition = rightHandTransform.method("get_position").invoke();
        var Direction = getGunAimDirection();
        var rayStartPosition = Vector3.method("op_Addition").invoke(
            StartPosition,
            Vector3.method("op_Multiply").invoke(Direction, 0.08)
        );
        var layerMask = overrideLayerMask ?? -1;
        var finalRay = null;
        try {
            if (!physicsRaycastAllVec4) {
                physicsRaycastAllVec4 = Physics.method("RaycastAll").overload(
                    "UnityEngine.Vector3",
                    "UnityEngine.Vector3",
                    "System.Single",
                    "System.Int32"
                );
            }
            var hits = physicsRaycastAllVec4.invoke(rayStartPosition, Direction, 512.0, layerMask);
            if (hits && !hits.isNull() && hits.length > 0) {
                var bestDistance = Number.POSITIVE_INFINITY;
                for (var i = 0; i < hits.length; i++) {
                    try {
                        var hit = hits.get(i);
                        if (!hit || hit.isNull?.()) continue;
                        var hitCollider = hit.method("get_collider").invoke();
                        if (!hitCollider || hitCollider.isNull()) continue;
                        var hitPoint = hit.method("get_point").invoke();
                        var distance = Vector3.method("Distance").invoke(hitPoint, StartPosition) ;
                        if (distance < 0.08 || distance >= bestDistance) continue;
                        bestDistance = distance;
                        finalRay = hit;
                    } catch(_) {}
                }
            }
        } catch(_) {}
        if (!finalRay) {
            try {
                var hitBuf = Il2Cpp.alloc(128);
                if (!physicsRaycastOutVec4) {
                    physicsRaycastOutVec4 = Physics.method("Raycast").overload(
                        "UnityEngine.Vector3",
                        "UnityEngine.Vector3",
                        "UnityEngine.RaycastHit&",
                        "System.Single"
                    );
                }
                if (!physicsRaycastOutVec5) {
                    physicsRaycastOutVec5 = Physics.method("Raycast").overload(
                        "UnityEngine.Vector3",
                        "UnityEngine.Vector3",
                        "UnityEngine.RaycastHit&",
                        "System.Single",
                        "System.Int32"
                    );
                }
                var didHit = overrideLayerMask == null
                    ? physicsRaycastOutVec4.invoke(rayStartPosition, Direction, hitBuf, 512.0)
                    : physicsRaycastOutVec5.invoke(rayStartPosition, Direction, hitBuf, 512.0, layerMask);
                if (didHit) {
                    var hitRef = Il2Cpp.reference(hitBuf);
                    var hitPoint = hitRef.method("get_point").invoke();
                    var distance = Vector3.method("Distance").invoke(hitPoint, StartPosition) ;
                    if (distance >= 0.08) finalRay = hitRef;
                }
            } catch(_) {}
        }
        if (finalRay) {
            try {
                finalRay.method("get_point").invoke();
            } catch(_) {}
        }
        var EndPosition;
        if (gunLocked) {
            EndPosition = getTransform(lockTarget).method("get_position").invoke();
        } else {
            if (finalRay && !(finalRay.isNull?.() ?? false)) {
                EndPosition = finalRay.method("get_point").invoke();
            } else {
                var farDirection = Vector3.method("op_Multiply").invoke(Direction, 512);
                EndPosition = Vector3.method("op_Addition").invoke(StartPosition, farDirection);
            }
        }
        if (Vector3.method("op_Equality").invoke(EndPosition, zeroVector)) {
            var farDirection = Vector3.method("op_Multiply").invoke(Direction, 512);
            EndPosition = Vector3.method("op_Addition").invoke(StartPosition, farDirection);
        }
        if (GunPointer == null || GunPointer.isNull?.()) {
            GunPointer = createObject(EndPosition, identityQuaternion, [0.1, 0.1, 0.1], 0, [1, 1, 1, 1]);
        }
        GunPointer.method("SetActive").invoke(true);
        var pointerTransform = getTransform(GunPointer);
        pointerTransform.method("set_position").invoke(EndPosition);
        var PointerRenderer = getComponent(GunPointer, Renderer);
        var material = PointerRenderer.method("get_material").invoke();
        material.method("set_shader").invoke(TextShader);
        var pointerColor = (gunLocked || rightTrigger) ? buttonPressedColor : buttonColor;
        material.method("set_color").invoke(pointerColor);
        var collider = getComponent(GunPointer, Collider);
        if (collider != null) {
            Destroy(collider);
        }
        if (GunLine == null || GunLine.isNull?.()) {
            var lineObj = createObject(zeroVector, identityQuaternion, oneVector, 0, [0, 0, 0, 0]);
            GunLine = addComponent(lineObj, LineRenderer);
        } else {
            GunLine.method("get_gameObject").invoke().method("SetActive").invoke(true);
        }
        var lineMaterial = GunLine.method("get_material").invoke();
        lineMaterial.method("set_shader").invoke(TextShader);
        GunLine.method("set_startColor").invoke(bgColor);
        GunLine.method("set_endColor").invoke(bgColor);
        var lineWidth = 0.032;
        GunLine.method("set_startWidth").invoke(lineWidth);
        GunLine.method("set_endWidth").invoke(lineWidth);
        GunLine.method("set_positionCount").invoke(2);
        GunLine.method("set_useWorldSpace").invoke(true);
        GunLine.method("SetPosition").invoke(0, StartPosition);
        GunLine.method("SetPosition").invoke(1, EndPosition);
        if (rightTrigger || gunLocked) {
            var Step = 34;
            GunLine.method("set_positionCount").invoke(Step);
            GunLine.method("SetPosition").invoke(0, StartPosition);
            var dirVec = readVec3Components(Direction);
            var dirMag = Math.sqrt((dirVec[0] * dirVec[0]) + (dirVec[1] * dirVec[1]) + (dirVec[2] * dirVec[2])) || 1;
            var dirNorm: [number, number, number] = [dirVec[0] / dirMag, dirVec[1] / dirMag, dirVec[2] / dirMag];
            var upBasis: [number, number, number] = [0, 1, 0];
            if (Math.abs(dirNorm[1]) > 0.92) upBasis = [1, 0, 0];
            var side: [number, number, number] = [
                (upBasis[1] * dirNorm[2]) - (upBasis[2] * dirNorm[1]),
                (upBasis[2] * dirNorm[0]) - (upBasis[0] * dirNorm[2]),
                (upBasis[0] * dirNorm[1]) - (upBasis[1] * dirNorm[0])
            ];
            var sideMag = Math.sqrt((side[0] * side[0]) + (side[1] * side[1]) + (side[2] * side[2])) || 1;
            side = [side[0] / sideMag, side[1] / sideMag, side[2] / sideMag];
            var swirlUp: [number, number, number] = [
                (dirNorm[1] * side[2]) - (dirNorm[2] * side[1]),
                (dirNorm[2] * side[0]) - (dirNorm[0] * side[2]),
                (dirNorm[0] * side[1]) - (dirNorm[1] * side[0])
            ];
            var swirlUpMag = Math.sqrt((swirlUp[0] * swirlUp[0]) + (swirlUp[1] * swirlUp[1]) + (swirlUp[2] * swirlUp[2])) || 1;
            swirlUp = [swirlUp[0] / swirlUpMag, swirlUp[1] / swirlUpMag, swirlUp[2] / swirlUpMag];
            for (var i = 1; i < (Step - 1); i++) {
                var t = i / (Step - 1);
                var Position = Vector3.method("Lerp").invoke(StartPosition, EndPosition, t);
                var swirlAngle = (time * 9.0) + (t * Math.PI * 10.0);
                var swirlFade = Math.sin(t * Math.PI);
                var swirlRadius = (0.031 + (Math.sin((t * Math.PI * 2.0) + (time * 2.4)) * 0.007)) * swirlFade;
                var offset = [
                    (side[0] * Math.cos(swirlAngle) + swirlUp[0] * Math.sin(swirlAngle)) * swirlRadius,
                    (side[1] * Math.cos(swirlAngle) + swirlUp[1] * Math.sin(swirlAngle)) * swirlRadius,
                    (side[2] * Math.cos(swirlAngle) + swirlUp[2] * Math.sin(swirlAngle)) * swirlRadius
                ];
                var finalPosition = Vector3.method("op_Addition").invoke(Position, offset);
                GunLine.method("SetPosition").invoke(i, finalPosition);
            }
            GunLine.method("SetPosition").invoke(Step - 1, EndPosition);
        }
        return { ray: finalRay ?? NullObject, gunPointer, endPosition };
    }
    function getAllNetPlayersList(includeLocal = true)[] {
        var players[] = [];
        try {
            var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
            if (!playerDict || playerDict.isNull()) return players;
            var vals = playerDict.method("get_Values").invoke();
            var en = vals.method("GetEnumerator").invoke();
            while (en.method("MoveNext").invoke()) {
                var p = en.method("get_Current").invoke();
                if (!p || p.isNull?.()) continue;
                if (!includeLocal && playerIsLocal(p)) continue;
                players.push(p);
            }
        } catch(_) {}
        return players;
    }
    function resolveGunTargetPlayer(gunData, maxDistance = 8.0) {
        if (!gunData) return null;
        try {
            var ray = gunData.ray;
            if (ray && !(ray.handle?.isNull?.() ?? true)) {
                try {
                    var hitCollider = ray.method("get_collider").invoke();
                    if (hitCollider && !hitCollider.isNull()) {
                        try {
                            var directPlayer = hitCollider.method("GetComponentInParent", 0).inflate(NetPlayer).invoke();
                            if (directPlayer && !directPlayer.isNull()) return directPlayer;
                        } catch(_) {}
                        try {
                            var hitGO = hitCollider.method("get_gameObject").invoke();
                            if (hitGO && !hitGO.isNull()) {
                                var hitPlayer = hitGO.method("GetComponentInParent", 0).inflate(NetPlayer).invoke();
                                if (hitPlayer && !hitPlayer.isNull()) return hitPlayer;
                            }
                        } catch(_) {}
                    }
                } catch(_) {}
            }
        } catch(_) {}
        try {
            var pointerPos = getTransform(gunData.gunPointer).method("get_position").invoke();
            var nearest = null;
            var nearestDist = maxDistance;
            for (var p of getAllNetPlayersList(false)) {
                try {
                    var pPos = getTransform(p).method("get_position").invoke();
                    var dist = Vector3.method("Distance").invoke(pointerPos, pPos) ;
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearest = p;
                    }
                } catch(_) {}
            }
            return nearest;
        } catch(_) {
            return null;
        }
    }
    function getWhitelistGunTarget(gunData, requireWhitelisted = true, maxDistance = 8.0) {
        var hitPlayer = resolveGunTargetPlayer(gunData, maxDistance);
        if (!hitPlayer || hitPlayer.isNull?.() || playerIsLocal(hitPlayer)) return null;
        var id = getPlayerName(hitPlayer);
        return { player: hitPlayer, id, blocked: false };
    }
    function isUsefulPlayerLabel(value) {
        var token = normalizePlayerToken(value);
        if (!token) return false;
        var lower = token.toLowerCase();
        if (token === "?" || token === "???" || lower === "null" || lower === "undefined") return false;
        if (lower.indexOf("animalcompany.netplayer") >= 0) return false;
        if (lower.indexOf("system.") >= 0) return false;
        return true;
    }
    function getAdminLeaderboardPlayerLabel(player, fallbackIndex = 0) {
        var candidates[] = [];
        var push = (value) => {
            var token = normalizePlayerToken(value);
            if (isUsefulPlayerLabel(token) && !candidates.includes(token)) candidates.push(token);
        };
        try { push(player.method("get_displayName").invoke()); } catch(_) {}
        try { push(player.field("_displayName").value); } catch(_) {}
        try { push(player.method("get_name").invoke()); } catch(_) {}
        try {
            var go = player.method("get_gameObject").invoke();
            if (go && !go.isNull?.()) push(go.method("get_name").invoke());
        } catch(_) {}
        try { push(player.method("get_playerId").invoke()); } catch(_) {}
        try { push(player.field("_playerId").value); } catch(_) {}
        try {
            var info = getPlayerIdentityInfo(player);
            for (var alias of info.aliases) push(alias);
        } catch(_) {}
        return candidates.length > 0 ? String(candidates[0]) : ("Player " + (fallbackIndex + 1));
    }
    function clearAdminLeaderboardSelection(clearOrbit = true) {
        adminLeaderboardSelectedPlayer = null;
        adminLeaderboardSelectedName = "";
        if (clearOrbit) {
            adminLeaderboardOrbitEnabled = false;
            adminLeaderboardOrbitTarget = null;
        }
        if (!arenaEspEnabled) destroyOverlayEntries(playerEspEntries);
    }
    function readPlayerTeamToken(player) {
        var pushCandidates[] = [];
        var push = (value) => {
            var token = normalizePlayerToken(value);
            if (token && token !== "?" && token !== "???") pushCandidates.push(token.toLowerCase());
        };
        for (var name of ["get_team", "get_Team", "get_playerTeam", "get_PlayerTeam", "get_teamId", "get_TeamId"]) {
            try { push(player.method(name).invoke()); } catch(_) {}
        }
        for (var name of ["team", "_team", "Team", "_Team", "playerTeam", "_playerTeam", "teamId", "_teamId"]) {
            try { push(player.field(name).value); } catch(_) {}
        }
        for (var token of pushCandidates) {
            if (token.includes("blue")) return "blue";
            if (token.includes("red")) return "red";
            if (token === "1") return "blue";
            if (token === "2") return "red";
            if (token === "0") return "none";
        }
        return "";
    }
    function playersAreSameArenaTeam(a, b) {
        try {
            var ta = readPlayerTeamToken(a);
            var tb = readPlayerTeamToken(b);
            return !!ta && !!tb && ta !== "none" && tb !== "none" && ta === tb;
        } catch(_) {
            return false;
        }
    }
    function findArenaAimbotTarget() {
        try {
            var me = NetPlayer.method("get_localPlayer").invoke();
            if (!me || me.isNull?.()) return null;
            var viewTf = getTransform(headCollider);
            var origin = viewTf.method("get_position").invoke();
            var forward = readVec3Components(viewTf.method("get_forward").invoke());
            var best = null;
            var bestScore = -999999;
            for (var p of getAllNetPlayersList(false)) {
                try {
                    if (!p || p.isNull?.() || playerIsLocal(p)) continue;
                    if (playersAreSameArenaTeam(me, p)) continue;
                    var headTf = getPlayerHeadTransform(p) ?? getTransform(p);
                    if (!headTf || headTf.isNull?.()) continue;
                    var pos = headTf.method("get_position").invoke();
                    var dx = (pos.field("x").value ) - (origin.field("x").value );
                    var dy = (pos.field("y").value ) - (origin.field("y").value );
                    var dz = (pos.field("z").value ) - (origin.field("z").value );
                    var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    if (dist < 0.1 || dist > 80.0) continue;
                    var dot = ((dx / dist) * forward[0]) + ((dy / dist) * forward[1]) + ((dz / dist) * forward[2]);
                    var score = (dot * 4.0) - (dist * 0.015);
                    if (score > bestScore) {
                        bestScore = score;
                        best = p;
                    }
                } catch(_) {}
            }
            return best;
        } catch(_) {
            return null;
        }
    }
    function runAdminLeaderboardOrbit() {
        if (!adminLeaderboardOrbitEnabled) return;
        var target = adminLeaderboardOrbitTarget;
        if (!target || target.isNull?.()) {
            adminLeaderboardOrbitEnabled = false;
            adminLeaderboardOrbitTarget = null;
            return;
        }
        try {
            var me = NetPlayer.method("get_localPlayer").invoke();
            if (!me || me.isNull?.()) return;
            var center = getTransform(me).method("get_position").invoke();
            adminLeaderboardOrbitPhase += deltaTime * 2.2;
            var radius = 3.0;
            var orbitPos = [
                (center.field("x").value ) + Math.cos(adminLeaderboardOrbitPhase) * radius,
                (center.field("y").value ) + 1.0 + Math.sin(adminLeaderboardOrbitPhase * 1.7) * 0.35,
                (center.field("z").value ) + Math.sin(adminLeaderboardOrbitPhase) * radius
            ];
            target.method("RPC_Teleport").invoke(orbitPos);
        } catch(e) { console.error("Admin LeaderBoard Orbit:", e); }
    }
    function runAdminLeaderboardMultiOrbit() {
        if (!adminLeaderboardMultiOrbitEnabled) return;
        // Filter out any dead/null handles
        adminLeaderboardMultiOrbitList = adminLeaderboardMultiOrbitList.filter(p => {
            try { return p && !p.isNull?.() && !playerIsLocal(p); } catch(_) { return false; }
        });
        if (adminLeaderboardMultiOrbitList.length === 0) return;
        try {
            var me = NetPlayer.method("get_localPlayer").invoke();
            if (!me || me.isNull?.()) return;
            var center = getTransform(me).method("get_position").invoke();
            var cx = center.field("x").value ;
            var cy = center.field("y").value ;
            var cz = center.field("z").value ;
            adminLeaderboardMultiOrbitPhase += deltaTime * 2.0;
            var count = adminLeaderboardMultiOrbitList.length;
            var radius = 2.8 + count * 0.15; // grows slightly with more players
            for (var i = 0; i < count; i++) {
                try {
                    var angle = adminLeaderboardMultiOrbitPhase + ((Math.PI * 2 * i) / count);
                    adminLeaderboardMultiOrbitList[i].method("RPC_Teleport").invoke([
                        cx + Math.cos(angle) * radius,
                        cy + 1.1 + Math.sin((time * 1.8) + i) * 0.3,
                        cz + Math.sin(angle) * radius
                    ]);
                } catch(_) {}
            }
        } catch(e) { console.error("Admin LeaderBoard Multi Orbit:", e); }
    }
    function spawnRpgProjectile(spawnPos, spawnRot, forward, projectileSpeed = 30.0) {
        try {
            var spawnResult = PrefabGen.method("SpawnItem", 4).invoke(
                Il2Cpp.string("RpgProjectile"),
                spawnPos,
                spawnRot,
                NULL
            );
            if (spawnResult && !spawnResult.isNull()) {
                try {
                    var rb = spawnResult.method("GetComponent", 1).inflate(Rigidbody).invoke();
                    if (rb && !rb.isNull()) {
                        var vel = Vector3.method("op_Multiply", 2).invoke(forward, projectileSpeed);
                        rb.method("set_velocity").invoke(vel);
                    }
                } catch(_) {}
            }
            return spawnResult;
        } catch(_) {
            return null;
        }
    }
    function spawnRpgProjectileAt(sourceTransform, projectileSpeed = 30.0, referenceTransform = null) {
        try {
            var forward = getLaunchForward(sourceTransform, referenceTransform);
            var up = getLaunchUp(sourceTransform, forward);
            var spawnPos = Vector3.method("op_Addition").invoke(
                sourceTransform.method("get_position").invoke(),
                Vector3.method("op_Addition").invoke(
                    Vector3.method("op_Multiply", 2).invoke(forward, 0.62),
                    Vector3.method("op_Multiply", 2).invoke(up, -0.03)
                )
            );
            return spawnRpgProjectile(
                spawnPos,
                getLaunchRotation(sourceTransform, forward, up),
                forward,
                projectileSpeed
            );
        } catch(_) {
            return null;
        }
    }
    function getPlayerProjectileOriginTransform(player) {
        try {
            var rightHandAnchor = getPlayerHandAnchorTransform(player, 1);
            if (rightHandAnchor && !rightHandAnchor.isNull?.()) return rightHandAnchor;
        } catch(_) {}
        try {
            var rightHand = player.field("rightHandTransform").value;
            if (isLiveObject(rightHand)) return rightHand;
        } catch(_) {}
        try {
            var playerView = player.method("get_playerView").invoke();
            if (isLiveObject(playerView)) {
                try {
                    var rightHand = playerView.field("_rightHandTransform").value;
                    if (isLiveObject(rightHand)) return rightHand;
                } catch(_) {}
            }
        } catch(_) {}
        try {
            var playerView = player.method("get_playerView").invoke();
            if (isLiveObject(playerView)) {
                try {
                    var cameraTransform = playerView.field("_cameraTransform").value;
                    if (isLiveObject(cameraTransform)) return cameraTransform;
                } catch(_) {}
            }
        } catch(_) {}
        try {
            var head = player.field("headCollider").value;
            if (isLiveObject(head)) return getTransform(head);
        } catch(_) {}
        try {
            return getTransform(player);
        } catch(_) {
            return null;
        }
    }
    function getPlayerStraightForward(player): [number, number, number] {
        try {
            var tf = getPlayerHeadTransform(player) ?? getTransform(player);
            var raw = readVec3Components(tf.method("get_forward").invoke());
            var x = raw[0];
            var z = raw[2];
            var mag = Math.sqrt((x * x) + (z * z));
            if (mag > 0.0001) return [x / mag, 0, z / mag];
        } catch(_) {}
        return [0, 0, 1];
    }
    function getLookRotationFromForward(forward: [number, number, number]) {
        try { return Quaternion.method("LookRotation", 2).invoke(forward, [0, 1, 0]); } catch(_) {}
        try { return Quaternion.method("LookRotation", 1).invoke(forward); } catch(_) {}
        return identityQuaternion;
    }
    function recenterMenu() {
        var menuTransform = getTransform(menu);
        var targetPos, targetRot;
        if (righthand) {
            targetPos = rightHandTransform.method("get_position").invoke();
            targetRot = rightHandTransform.method("get_rotation").invoke();
            targetRot = Quaternion.method("op_Multiply").invoke(targetRot, Quaternion.method("Euler").invoke(0, 0, 180));
        } else {
            targetPos = leftHandTransform.method("get_position").invoke();
            targetRot = leftHandTransform.method("get_rotation").invoke();
        }
        if (menuSnapNextFrame) {
            menuTransform.method("set_position").invoke(targetPos);
            menuTransform.method("set_rotation").invoke(targetRot);
            menuSnapNextFrame = false;
        } else if (LerpMenu || true) {
            var menuPos = menuTransform.method("get_position").invoke();
            menuTransform.method("set_position").invoke(Vector3.method("Lerp").invoke(menuPos, targetPos, Math.min(1.0, deltaTime * 22)));
            menuTransform.method("set_rotation").invoke(Quaternion.method("Slerp").invoke(menuTransform.method("get_rotation").invoke(), targetRot, Math.min(1.0, deltaTime * 20)));
        } else {
            menuTransform.method("set_position").invoke(targetPos);
            menuTransform.method("set_rotation").invoke(targetRot);
        }
    }
    var imguiModeNames = ["Menu", "GUI"];
    var imguiModeTips = ["Switches to the Menu mode.", "Switches to the GUI mode."];
    function destroyImGui() {
        try { if (imguiObj != null) { Destroy(imguiObj); imguiObj = null; } } catch(_) {}
        try { if (imguiRefObj != null) { Destroy(imguiRefObj); imguiRefObj = null; } } catch(_) {}
    }
    function renderImGui() {
        destroyImGui();
        var handTf = righthand ? leftHandTransform : rightHandTransform;
        imguiObj = createObject(zeroVector, identityQuaternion, [0.1, 0.18, 0.22], 3, [0, 0, 0, 0]);
        try { imguiObj.method("set_name").invoke(Il2Cpp.string("ImGuiRoot")); } catch(_) {}
        Destroy(getComponent(imguiObj, BoxCollider));
        getTransform(imguiObj).method("SetParent", 2).invoke(handTf, false);
        getTransform(imguiObj).method("set_localPosition").invoke([0.0, 0.12, 0.0]);
        getTransform(imguiObj).method("set_localRotation").invoke(identityQuaternion);
        var bg = createObject([0.1, 0, 0], identityQuaternion, [0.1, 1, 1], 3, [0.12, 0.12, 0.12, 0.92], getTransform(imguiObj));
        try { bg.method("set_name").invoke(Il2Cpp.string("ImGuiBG")); } catch(_) {}
        Destroy(getComponent(bg, BoxCollider));
        addSurfaceOutline(bg, [0.5, 0.5, 0.5, 1.0], 0.03);
        addRoundedCorners(bg, [0.2, 0.2, 0.2, 1.0], 0.06);
        var textRoot = createEmptyObject("ImGuiTextRoot", getTransform(imguiObj));
        renderMenuText(textRoot, bg, "ImGui", [0.8, 0.8, 0.8, 1.0], [0.501, 0, 0.88], [1.0, 0.1]);
        renderMenuText(textRoot, bg, "Mode: " + imguiModeNames[imguiMode], [0.6, 0.85, 0.6, 1.0], [0.501, 0, 0.78], [0.8, 0.08]);
        for (var m = 0; m < imguiModeNames.length; m++) {
            var btn = createObject([0.1, 0, 0.6 - (m * 0.22)], identityQuaternion, [0.09, 0.85, 0.18], 3, imguiMode === m ? [0.25, 0.5, 0.25, 1.0] : [0.18, 0.18, 0.18, 1.0], getTransform(imguiObj));
            btn.method("set_name").invoke(Il2Cpp.string("@ImGuiMode_" + m));
            addComponent(btn, GorillaReportButton);
            getComponent(btn, BoxCollider).method("set_isTrigger").invoke(true);
            addSurfaceOutline(btn, [0.5, 0.8, 0.5, 1.0], 0.06);
            renderMenuText(textRoot, btn, imguiModeNames[m], [0.9, 0.9, 0.9, 1.0], [0.501, 0, 0], [0.7, 0.1]);
        }
        var closeBtn = createObject([0.1, 0, 0.82], identityQuaternion, [0.09, 0.85, 0.12], 3, [0.5, 0.15, 0.15, 1.0], getTransform(imguiObj));
        closeBtn.method("set_name").invoke(Il2Cpp.string("@ImGuiClose"));
        addComponent(closeBtn, GorillaReportButton);
        getComponent(closeBtn, BoxCollider).method("set_isTrigger").invoke(true);
        addSurfaceOutline(closeBtn, [0.8, 0.3, 0.3, 1.0], 0.06);
        renderMenuText(textRoot, closeBtn, "X", [1.0, 0.4, 0.4, 1.0], [0.501, 0, 0], [0.5, 0.1]);
        getTransform(imguiObj).method("set_localScale").invoke(
            Vector3.method("op_Multiply").invoke(
                Vector3.method("op_Multiply").invoke(getTransform(imguiObj).method("get_localScale").invoke(), GTPlayer.field("k__BackingField").value),
                menuscale
            )
        );
        var refHand = righthand ? rightHandTransform : leftHandTransform;
        imguiRefObj = createObject(zeroVector, identityQuaternion, [0.01, 0.01, 0.01], 0, bgColor, refHand);
        imguiRefCollider = getComponent(imguiRefObj, Collider);
        getTransform(imguiRefObj).method("set_localPosition").invoke([0.01, -0.117, 0.05]);
        imguiRefObj.method("set_layer").invoke(2);
        addComponent(imguiRefObj, Rigidbody).method("set_isKinematic").invoke(true);
    }
    function recenterImGui() {
        if (!imguiObj || imguiObj.isNull?.()) return;
        var handTf = righthand ? leftHandTransform : rightHandTransform;
        var tf = getTransform(imguiObj);
        var targetPos = handTf.method("get_position").invoke();
        var targetRot = handTf.method("get_rotation").invoke();
        tf.method("set_position").invoke(Vector3.method("Lerp").invoke(tf.method("get_position").invoke(), targetPos, Math.min(1.0, deltaTime * 22)));
        tf.method("set_rotation").invoke(Quaternion.method("Slerp").invoke(tf.method("get_rotation").invoke(), targetRot, Math.min(1.0, deltaTime * 20)));
    }
    function getAllLobbyItemGameObjects()[] {
        var results[] = [];
        var seen = new Set();
        var pushItem = (obj) => {
            try {
                if (!obj || obj.isNull?.()) return;
                var key = normalizeSceneObjectHandle(getRootLikeObject(obj)) || normalizeSceneObjectHandle(obj);
                if (!key) {
                    try {
                        var go = obj.method("get_gameObject").invoke();
                        key = normalizeSceneObjectHandle(go);
                    } catch(_) {}
                }
                if (!key || seen.has(key)) return;
                seen.add(key);
                results.push(obj);
            } catch(_) {}
        };
        try {
            var items = Object.method("FindObjectsByType", 1).inflate(GBOClass).invoke(0);
            if (items && !items.isNull()) {
                for (var i = 0; i < items.length; i++) {
                    try {
                        var item = items.get(i).cast(GBOClass);
                        if (!item || item.isNull?.()) continue;
                        pushItem(item);
                    } catch(_) {}
                }
            }
        } catch(_) {}
        try {
            var items = Object.method("FindObjectsByType", 1).inflate(GBIClass).invoke(0);
            if (items && !items.isNull()) {
                for (var i = 0; i < items.length; i++) {
                    try {
                        var item = items.get(i).cast(GBIClass);
                        if (!item || item.isNull?.()) continue;
                        pushItem(item);
                    } catch(_) {}
                }
            }
        } catch(_) {}
        try {
            var allItems = GBIClass.method("get_allLootItems").invoke();
            if (allItems && !allItems.isNull()) {
                var en = allItems.method("GetEnumerator").invoke();
                while (en.method("MoveNext").invoke()) {
                    try {
                        var item = en.method("get_Current").invoke();
                        if (!item || item.isNull?.()) continue;
                        pushItem(item);
                    } catch(_) {}
                }
            }
        } catch(_) {}
        try {
            for (var player of getAllNetPlayersList(true)) {
                try {
                    for (var handIndex of [0, 1]) {
                        var held = getPlayerHeldGrabbable(player, handIndex);
                        if (held && !held.isNull?.()) pushItem(held);
                    }
                } catch(_) {}
            }
        } catch(_) {}
        return results;
    }
    function getPlayerHeldGrabbable(player, handIndex) {
        try {
            var interactor = player.method("GetHandInteractor", 1).invoke(handIndex);
            if (!interactor || interactor.isNull?.()) return null;
            var itemAnchor = interactor.field("_itemAnchor").value;
            if (!itemAnchor || itemAnchor.isNull?.()) return null;
            var grabbable = itemAnchor.method("get_grabbableObject").invoke();
            if (!grabbable || grabbable.isNull?.()) return null;
            return grabbable;
        } catch(_) {
            return null;
        }
    }
    function getLocalHeldGrabbable(preferRight = true) {
        try {
            var player = NetPlayer.method("get_localPlayer").invoke();
            if (!player || player.isNull?.()) return null;
            var first = preferRight ? 1 : 0;
            var second = preferRight ? 0 : 1;
            return getPlayerHeldGrabbable(player, first) ?? getPlayerHeldGrabbable(player, second);
        } catch(_) {
            return null;
        }
    }
    function getPlayerOverlayKey(player) {
        try { return normalizeSceneObjectHandle(player) || getPlayerName(player) || String(player); } catch(_) { return String(player); }
    }
    function configureOverlayMaterial(material, color: [number, number, number, number]) {
        try {
            if (!material || material.isNull?.()) return;
            try { material.method("set_shader").invoke(TextShader); } catch(_) { try { material.method("set_shader").invoke(UberShader); } catch(_) {} }
            try { material.method("set_color").invoke(color); } catch(_) {}
            try { material.method("SetInt").invoke(Il2Cpp.string("_ZTest"), 8); } catch(_) {}
            try { material.method("SetInt").invoke(Il2Cpp.string("_ZWrite"), 0); } catch(_) {}
            try { material.method("SetInt").invoke(Il2Cpp.string("_Cull"), 0); } catch(_) {}
            try { material.method("set_renderQueue").invoke(5000); } catch(_) {}
        } catch(_) {}
    }
    function configureOverlayRenderer(renderer, color: [number, number, number, number]) {
        try {
            if (!renderer || renderer.isNull?.()) return;
            try { renderer.method("set_sortingOrder").invoke(32767); } catch(_) {}
            try { renderer.method("set_allowOcclusionWhenDynamic").invoke(false); } catch(_) {}
            var material = renderer.method("get_material").invoke();
            configureOverlayMaterial(material, color);
        } catch(_) {}
    }
    function destroyOverlayEntries(map) {
        try {
            for (var [, entry] of map.entries()) {
                try {
                    if (entry?.root && !entry.root.isNull?.()) Destroy(entry.root);
                    if (entry?.boxRoot && !entry.boxRoot.isNull?.()) Destroy(entry.boxRoot);
                    if (entry?.rayRoot && !entry.rayRoot.isNull?.()) Destroy(entry.rayRoot);
                } catch(_) {}
            }
            map.clear();
        } catch(_) {}
    }
    function getOverlayViewPosition() {
        try { return getTransform(headCollider).method("get_position").invoke(); } catch(_) { return [0, 0, 0]; }
    }
    function updatePlayerNameTags() {
        if (!nameTagsEnabled) {
            destroyOverlayEntries(playerNameTagEntries);
            return;
        }
        var alive = new Set();
        var viewerPos = getOverlayViewPosition();
        for (var player of getAllNetPlayersList(true)) {
            try {
                if (!player || player.isNull?.()) continue;
                var key = getPlayerOverlayKey(player);
                alive.add(key);
                var entry = playerNameTagEntries.get(key);
                if (!entry) {
                    var root = createEmptyObject("PlayerNameTag", null);
                    var textObj = createEmptyObject("PlayerNameTagText", getTransform(root));
                    var comp = null;
                    if (TextMesh) {
                        comp = addComponent(textObj, TextMesh);
                        try {
                            var font = getarialnocrash2();
                            if (font && !font.isNull?.()) comp.method("set_font").invoke(font);
                        } catch(_) {}
                    } else if (TextMeshPro3D) {
                        comp = addComponent(textObj, TextMeshPro3D);
                        try {
                            var tmpFont = gettmpfontnocrash();
                            if (tmpFont && !tmpFont.isNull?.()) comp.method("set_font").invoke(tmpFont);
                        } catch(_) {}
                    }
                    entry = { root, textObj, comp };
                    playerNameTagEntries.set(key, entry);
                }
                var headTf = getPlayerHeadTransform(player);
                if (!headTf || headTf.isNull?.()) continue;
                var headPos = headTf.method("get_position").invoke();
                var tagPos = [
                    (headPos.field("x").value ),
                    (headPos.field("y").value ) + 0.34,
                    (headPos.field("z").value )
                ];
                var rootTf = getTransform(entry.root);
                rootTf.method("set_position").invoke(tagPos);
                var lookDir = Vector3.method("op_Subtraction", 2).invoke(viewerPos, tagPos);
                try {
                    var rot = Quaternion.method("LookRotation", 1).invoke(lookDir);
                    rootTf.method("set_rotation").invoke(rot);
                } catch(_) {}
                try { rootTf.method("Rotate").invoke(0.0, 180.0, 0.0); } catch(_) {}
                if (TextMeshPro3D && entry.comp && !TextMesh) {
    try {
        entry.comp.method("SetText", 1).invoke(
            Il2Cpp.string(getPlayerName(player))
        );
    } catch(_) {
        try {
            entry.comp.method("set_text").invoke(
                Il2Cpp.string(getPlayerName(player))
            );
        } catch(_) {}
    }
    try { entry.comp.method("set_fontSize").invoke(2.8); } catch(_) {}
    try { entry.comp.method("set_color").invoke([0.24, 0.66, 1.0, 1.0]); } catch(_) {}
    try { entry.comp.method("set_alignment").invoke(514); } catch(_) {}
    try { entry.comp.method("set_enableWordWrapping").invoke(false); } catch(_) {}
    // FORCE RENDERER ENABLED
    try {
        var renderer = entry.textObj
            .method("GetComponent")
            .inflate(Renderer)
            .invoke();
        if (renderer && !renderer.isNull?.()) {
            renderer.method("set_enabled").invoke(true);
            var mat = renderer.method("get_material").invoke();
            if (mat && !mat.isNull?.()) {
                try {
                    mat.method("set_renderQueue").invoke(5000);
                } catch(_) {}
            }
        }
    } catch(e) {
        console.error("NameTag Renderer:", e);
    }
    // FIX MICROSCOPIC SCALE
    try {
        getTransform(entry.textObj)
            .method("set_localScale")
            .invoke([0.02, 0.02, 0.02]);
    } catch(_) {}
} else if (entry.comp) {
    try {
        entry.comp.method("set_text").invoke(
            Il2Cpp.string(getPlayerName(player))
        );
    } catch(_) {}
    try { entry.comp.method("set_fontSize").invoke(44); } catch(_) {}
    try { entry.comp.method("set_characterSize").invoke(0.032); } catch(_) {}
    // FIX SCALE FOR NORMAL TEXTMESH
    try {
        getTransform(entry.textObj)
            .method("set_localScale")
            .invoke([0.02, 0.02, 0.02]);
    } catch(_) {}
    try { entry.comp.method("set_anchor").invoke(4); } catch(_) {}
    try { entry.comp.method("set_alignment").invoke(1); } catch(_) {}
    try { entry.comp.method("set_color").invoke([0.24, 0.66, 1.0, 1.0]); } catch(_) {}
    // FORCE NORMAL TEXTMESH RENDERER
    try {
        var renderer = entry.textObj
            .method("GetComponent")
            .inflate(Renderer)
            .invoke();
        if (renderer && !renderer.isNull?.()) {
            renderer.method("set_enabled").invoke(true);
            var mat = renderer.method("get_material").invoke();
            if (mat && !mat.isNull?.()) {
                try {
                    mat.method("set_renderQueue").invoke(5000);
                } catch(_) {}
            }
        }
    } catch(e) {
        console.error("NameTag Renderer:", e);
    }
                } else if (entry.comp) {
                    try { entry.comp.method("set_text").invoke(Il2Cpp.string(getPlayerName(player))); } catch(_) {}
                    try { entry.comp.method("set_fontSize").invoke(44); } catch(_) {}
                    try { entry.comp.method("set_characterSize").invoke(0.032); } catch(_) {}
                    try { entry.comp.method("set_anchor").invoke(4); } catch(_) {}
                    try { entry.comp.method("set_alignment").invoke(1); } catch(_) {}
                    try { entry.comp.method("set_color").invoke([0.24, 0.66, 1.0, 1.0]); } catch(_) {}
                }
                try {
                    var rend = getComponent(entry.textObj ?? entry.root, Renderer);
                    if (rend && !rend.isNull?.()) {
                        try { rend.method("set_enabled").invoke(true); } catch(_) {}
                        try {
                            if (TextMesh && entry.comp) {
                                var font = getarialnocrash2();
                                if (font && !font.isNull?.()) {
                                    try { rend.method("set_sharedMaterial").invoke(font.method("get_material").invoke()); } catch(_) {
                                        try { rend.method("set_material").invoke(font.method("get_material").invoke()); } catch(_) {}
                                    }
                                }
                            }
                        } catch(_) {}
                        configureOverlayRenderer(rend, [0.24, 0.66, 1.0, 1.0]);
                    }
                } catch(_) {}
                try { getTransform(entry.textObj ?? entry.root).method("set_localScale").invoke([0.055, 0.055, 0.055]); } catch(_) {}
            } catch(_) {}
        }
        for (var [key, entry] of Array.from(playerNameTagEntries.entries())) {
            if (alive.has(key)) continue;
            try { if (entry?.textObj && !entry.textObj.isNull?.()) Destroy(entry.textObj); } catch(_) {}
            try { if (entry?.root && !entry.root.isNull?.()) Destroy(entry.root); } catch(_) {}
            playerNameTagEntries.delete(key);
        }
    }
    function ensureEspEntry(player) {
        var key = getPlayerOverlayKey(player);
        var entry = playerEspEntries.get(key);
        if (entry) return entry;
        var rayRoot = createEmptyObject("PlayerEspRay", null);
        var boxRoot = createEmptyObject("PlayerEspBox", null);
        var ray = addComponent(rayRoot, LineRenderer);
        var box = addComponent(boxRoot, LineRenderer);
        entry = { rayRoot, boxRoot, ray, box };
        playerEspEntries.set(key, entry);
        return entry;
    }
    function updatePlayerEspOverlays() {
        var selectedPlayerEsp = adminLeaderboardEspEnabled && adminLeaderboardSelectedPlayer && !adminLeaderboardSelectedPlayer.isNull?.();
        if (!arenaEspEnabled && !selectedPlayerEsp) {
            destroyOverlayEntries(playerEspEntries);
            return;
        }
        var alive = new Set();
        var viewerTf = getTransform(headCollider);
        var viewerPos = viewerTf.method("get_position").invoke();
        var camRight = readVec3Components(viewerTf.method("get_right").invoke());
        var camUp = readVec3Components(viewerTf.method("get_up").invoke());
        var handPos = rightHandTransform.method("get_position").invoke();
        var playersToDraw = arenaEspEnabled ? getAllNetPlayersList(false) : [adminLeaderboardSelectedPlayer];
        for (var player of playersToDraw) {
            try {
                if (!player || player.isNull?.()) continue;
                var key = getPlayerOverlayKey(player);
                alive.add(key);
                var entry = ensureEspEntry(player);
                var headTf = getPlayerHeadTransform(player);
                var bodyTf = getTransform(player);
                if (!headTf || headTf.isNull?.() || !bodyTf || bodyTf.isNull?.()) continue;
                var headPos = headTf.method("get_position").invoke();
                var bodyPos = bodyTf.method("get_position").invoke();
                var center = [
                    (bodyPos.field("x").value ),
                    ((bodyPos.field("y").value ) + (headPos.field("y").value )) * 0.5,
                    (bodyPos.field("z").value )
                ];
                var height = Math.max(0.9, ((headPos.field("y").value ) - (bodyPos.field("y").value )) + 0.55);
                var width = Math.max(0.24, height * 0.32);
                var rightVec: [number, number, number] = [camRight[0] * width, camRight[1] * width, camRight[2] * width];
                var upVec: [number, number, number] = [camUp[0] * height * 0.5, camUp[1] * height * 0.5, camUp[2] * height * 0.5];
                var p0 = [center[0] - rightVec[0] - upVec[0], center[1] - rightVec[1] - upVec[1], center[2] - rightVec[2] - upVec[2]];
                var p1 = [center[0] + rightVec[0] - upVec[0], center[1] + rightVec[1] - upVec[1], center[2] + rightVec[2] - upVec[2]];
                var p2 = [center[0] + rightVec[0] + upVec[0], center[1] + rightVec[1] + upVec[1], center[2] + rightVec[2] + upVec[2]];
                var p3 = [center[0] - rightVec[0] + upVec[0], center[1] - rightVec[1] + upVec[1], center[2] - rightVec[2] + upVec[2]];
                var box = entry.box;
                var ray = entry.ray;
                var espColor: [number, number, number, number] = [0.18, 0.62, 1.0, 0.95];
                var rayColor: [number, number, number, number] = [1.0, 0.58, 0.1, 0.92];
                try {
                    box.method("set_useWorldSpace").invoke(true);
                    box.method("set_positionCount").invoke(5);
                    box.method("set_startWidth").invoke(0.01);
                    box.method("set_endWidth").invoke(0.01);
                    box.method("set_startColor").invoke(espColor);
                    box.method("set_endColor").invoke(espColor);
                    try { box.method("set_numCornerVertices").invoke(8); } catch(_) {}
                    try { box.method("set_numCapVertices").invoke(8); } catch(_) {}
                    box.method("SetPosition").invoke(0, p0);
                    box.method("SetPosition").invoke(1, p1);
                    box.method("SetPosition").invoke(2, p2);
                    box.method("SetPosition").invoke(3, p3);
                    box.method("SetPosition").invoke(4, p0);
                    configureOverlayMaterial(box.method("get_material").invoke(), espColor);
                } catch(_) {}
                try {
                    ray.method("set_useWorldSpace").invoke(true);
                    ray.method("set_positionCount").invoke(2);
                    ray.method("set_startWidth").invoke(0.006);
                    ray.method("set_endWidth").invoke(0.006);
                    ray.method("set_startColor").invoke(rayColor);
                    ray.method("set_endColor").invoke(rayColor);
                    try { ray.method("set_numCornerVertices").invoke(8); } catch(_) {}
                    try { ray.method("set_numCapVertices").invoke(8); } catch(_) {}
                    ray.method("SetPosition").invoke(0, handPos);
                    ray.method("SetPosition").invoke(1, headPos);
                    configureOverlayMaterial(ray.method("get_material").invoke(), rayColor);
                } catch(_) {}
            } catch(_) {}
        }
        for (var [key, entry] of Array.from(playerEspEntries.entries())) {
            if (alive.has(key)) continue;
            try { if (entry?.rayRoot && !entry.rayRoot.isNull?.()) Destroy(entry.rayRoot); } catch(_) {}
            try { if (entry?.boxRoot && !entry.boxRoot.isNull?.()) Destroy(entry.boxRoot); } catch(_) {}
            playerEspEntries.delete(key);
        }
    }
    function getPlayerHandAnchorTransform(player, handIndex = 1) {
        try {
            var interactor = player.method("GetHandInteractor", 1).invoke(handIndex);
            if (interactor && !interactor.isNull?.()) {
                try {
                    var itemAnchor = interactor.field("_itemAnchor").value;
                    if (itemAnchor && !itemAnchor.isNull?.()) {
                        try {
                            var anchorTf = itemAnchor.method("get_transform").invoke();
                            if (anchorTf && !anchorTf.isNull?.()) return anchorTf;
                        } catch(_) {}
                    }
                } catch(_) {}
                try {
                    var handTf = interactor.field("_handTransform").value;
                    if (handTf && !handTf.isNull?.()) return handTf;
                } catch(_) {}
            }
        } catch(_) {}
        try {
            var fieldName = handIndex === 1 ? "rightHandTransform" : "leftHandTransform";
            var handTf = player.field(fieldName).value;
            if (handTf && !handTf.isNull?.()) return handTf;
        } catch(_) {}
        return null;
    }
    function grabbableLooksLikeRevolver(grabbable) {
        try {
            if (!grabbable || grabbable.isNull?.()) return false;
            var className = (grabbable.class?.type?.name ?? "").toLowerCase();
            if (className.indexOf("revolver") >= 0) return true;
            try {
                var go = grabbable.method("get_gameObject").invoke();
                var goName = (go?.method("get_name").invoke()?.content ?? "").toLowerCase();
                if (goName.indexOf("revolver") >= 0) return true;
            } catch(_) {}
        } catch(_) {}
        return false;
    }
    function grabbableLooksLikeGun(grabbable) {
        try {
            if (!grabbable || grabbable.isNull?.()) return false;
            var checks[] = [];
            try { checks.push((grabbable.class?.type?.name ?? "").toLowerCase()); } catch(_) {}
            try {
                var go = grabbable.method("get_gameObject").invoke();
                checks.push((go?.method("get_name").invoke()?.content ?? "").toLowerCase());
            } catch(_) {}
            var needles = ["gun", "revolver", "shotgun", "pistol", "rpg", "rocket", "flare", "crossbow", "launcher", "cannon", "bow"];
            return checks.some(v => needles.some(n => v.indexOf(n) >= 0));
        } catch(_) {
            return false;
        }
    }
    function getSelectedItemNeedles(bareID)[] {
        var values = new Set();
        var add = (v) => {
            var t = (v ?? "").toLowerCase().trim();
            if (t) values.add(t);
        };
        add(bareID);
        if ((bareID ?? "").toLowerCase().startsWith("item_")) add((bareID ?? "").slice(5));
        return Array.from(values);
    }
    function grabbableMatchesSelectedItem(grabbable, bareID) {
        for (var needle of getSelectedItemNeedles(bareID)) {
            if (grabbableMatchesItemId(grabbable, needle)) return true;
        }
        return false;
    }
    function getGrabbableItemId(grabbable) {
        try {
            if (!grabbable || grabbable.isNull?.()) return "";
            try {
                var gbi = grabbable.method("GetComponent", 1).inflate(GBIClass).invoke();
                if (gbi && !gbi.isNull()) {
                    var idObj = gbi.method("get_itemID").invoke();
                    var idStr = (idObj?.content ?? "").trim();
                    if (idStr) return idStr;
                }
            } catch(_) {}
            try {
                var go = grabbable.method("get_gameObject").invoke();
                var goName = (go?.method("get_name").invoke()?.content ?? "").trim();
                if (goName) return goName;
            } catch(_) {}
            return (grabbable.class?.type?.name ?? "").trim();
        } catch(_) {
            return "";
        }
    }
    function grabbableMatchesItemId(grabbable, bareID) {
        try {
            if (!grabbable || grabbable.isNull?.()) return false;
            var needle = (bareID ?? "").toLowerCase();
            var className = (grabbable.class?.type?.name ?? "").toLowerCase();
            if (className.indexOf(needle) >= 0) return true;
            try {
                var go = grabbable.method("get_gameObject").invoke();
                var goName = (go?.method("get_name").invoke()?.content ?? "").toLowerCase();
                if (goName.indexOf(needle) >= 0) return true;
            } catch(_) {}
            try {
                var gbi = grabbable.method("GetComponent", 1).inflate(GBIClass).invoke();
                if (gbi && !gbi.isNull()) {
                    var idObj = gbi.method("get_itemID").invoke();
                    var idStr = (idObj?.content ?? "").toLowerCase();
                    if (idStr === needle || idStr.endsWith(needle)) return true;
                }
            } catch(_) {}
        } catch(_) {}
        return false;
    }
    function getPlayerKickTokens(player)[] {
        var tokens[] = [];
        var pushToken = (value) => {
            var token = normalizePlayerToken(value);
            if (!token || token === "?" || tokens.includes(token)) return;
            tokens.push(token);
        };
        try {
            var info = getPlayerIdentityInfo(player);
            for (var alias of info.aliases) pushToken(alias);
        } catch(_) {}
        try { pushToken(player.method("GetUserIDAndRegister").invoke()); } catch(_) {}
        try { pushToken(player.method("get_userId").invoke()); } catch(_) {}
        try { pushToken(player.method("get_userID").invoke()); } catch(_) {}
        try { pushToken(player.method("get_accountId").invoke()); } catch(_) {}
        try { pushToken(player.method("get_accountID").invoke()); } catch(_) {}
        try { pushToken(player.field("_userId").value); } catch(_) {}
        try { pushToken(player.field("_userID").value); } catch(_) {}
        try { pushToken(player.field("_accountId").value); } catch(_) {}
        try { pushToken(player.field("_accountID").value); } catch(_) {}
        try {
            var playerView = player.method("get_playerView").invoke();
            if (playerView && !playerView.isNull?.()) {
                try { pushToken(playerView.field("_userId").value); } catch(_) {}
                try { pushToken(playerView.field("_accountId").value); } catch(_) {}
                try { pushToken(playerView.method("get_userId").invoke()); } catch(_) {}
            }
        } catch(_) {}
        return tokens;
    }
    function dumpPlayerInfoToTerminal(player) {
        try {
            if (!player || player.isNull?.()) return;
            var lines[] = [];
            var info = getPlayerIdentityInfo(player);
            lines.push("========================================");
            lines.push("[PlayerInfo] " + info.label);
            lines.push("aliases: " + info.aliases.join(" | "));
            lines.push("kickTokens: " + getPlayerKickTokens(player).join(" | "));
            try { lines.push("playerRef: " + normalizePlayerToken(player.method("get_PlayerRef").invoke())); } catch(_) {}
            var dumpCandidate = (owner, prefix) => {
                try {
                    if (!owner || owner.isNull?.()) return;
                    var needles = ["name", "display", "playerid", "userid", "account", "auth", "token", "nonce", "session", "photon"];
                    for (var field of (owner.class?.fields ?? [])) {
                        try {
                            var fieldName = String(field.name ?? "");
                            if (!needles.some(n => fieldName.toLowerCase().indexOf(n) >= 0)) continue;
                            lines.push(prefix + "field " + fieldName + " = " + normalizePlayerToken(owner.field(fieldName).value));
                        } catch(_) {}
                    }
                    for (var methodName of ["get_displayName", "get_name", "get_playerId", "get_userId", "get_userID", "get_accountId", "get_accountID", "get_authToken", "get_token", "get_nonce"]) {
                        try {
                            lines.push(prefix + methodName + " = " + normalizePlayerToken(owner.method(methodName).invoke()));
                        } catch(_) {}
                    }
                } catch(_) {}
            };
            dumpCandidate(player, "player.");
            try {
                var playerView = player.method("get_playerView").invoke();
                if (playerView && !playerView.isNull?.()) dumpCandidate(playerView, "view.");
            } catch(_) {}
            console.log(lines.join("\n"));
        } catch(e) {
            console.error("[PlayerInfo]", e);
        }
    }
    function rankKickToken(token) {
        if (!token) return -9999;
        var score = 0;
        if (token.indexOf(" ") < 0) score += 3;
        if (token.length >= 10) score += 3;
        if (/^[a-z0-9_\-:.]+$/i.test(token)) score += 2;
        if (/[0-9]/.test(token)) score += 1;
        if (token.toLowerCase().indexOf("player") >= 0) score -= 2;
        return score;
    }
    function getSingletonInstanceCandidates(klass)[] {
        var results[] = [];
        var seen = new Set();
        var pushObj = (obj) => {
            try {
                if (!obj || obj.isNull?.()) return;
                var key = normalizeSceneObjectHandle(obj) || String(obj);
                if (seen.has(key)) return;
                seen.add(key);
                results.push(obj);
            } catch(_) {}
        };
        if (!klass) return results;
        for (var fieldName of ["k__BackingField", "_instance", "Instance", "instance", "s_instance", "m_instance"]) {
            try { pushObj(klass.field(fieldName).value); } catch(_) {}
        }
        for (var getterName of ["get_Instance", "get_instance"]) {
            try { pushObj(klass.method(getterName).invoke()); } catch(_) {}
        }
        return results;
    }
    function buildModerationArg(type, token, player) {
        try {
            var typeName = String(type?.name ?? "");
            if (typeName.indexOf("System.String") >= 0) return Il2Cpp.string(token);
            if (typeName.indexOf("AnimalCompany.NetPlayer") >= 0) return player;
            if (typeName.indexOf("Fusion.PlayerRef") >= 0) {
                try { return player.method("get_PlayerRef").invoke(); } catch(_) {}
                try { return player.field("_playerRef").value; } catch(_) {}
                return 0;
            }
            if (typeName.indexOf("Boolean") >= 0) return 0;
            if (/(Byte|SByte|Int16|UInt16|Int32|UInt32|Int64|UInt64|Single|Double)/.test(typeName)) return 0;
            try { if (type?.class?.isEnum) return 0; } catch(_) {}
            try { if (type?.class?.isValueType) return 0; } catch(_) {}
        } catch(_) {}
        return NULL;
    }
    function tryInvokeModerationMethod(receiver, isStaticReceiver, methodName, token, player) {
        try {
            var methodGroup = receiver.method(methodName);
            var overloads = methodGroup.overloads ? methodGroup.overloads() : [methodGroup];
            for (var overload of overloads) {
                try {
                    if (overload.parameters.length < 1 || overload.parameters.length > 4) continue;
                    var hasSupportedArg = overload.parameters.some((p) => {
                        var typeName = String(p.type?.name ?? "");
                        return typeName.indexOf("System.String") >= 0 ||
                            typeName.indexOf("AnimalCompany.NetPlayer") >= 0 ||
                            typeName.indexOf("Fusion.PlayerRef") >= 0;
                    });
                    if (!hasSupportedArg) continue;
                    var args = [];
                    var hasBoolean = false;
                    for (var param of overload.parameters) {
                        try {
                            if (String(param.type?.name ?? "").indexOf("Boolean") >= 0) hasBoolean = true;
                        } catch(_) {}
                        args.push(buildModerationArg(param.type, token, player));
                    }
                    var argVariants = [args];
                    if (hasBoolean) {
                        var toggled = args.slice();
                        for (var i = 0; i < overload.parameters.length; i++) {
                            try {
                                if (String(overload.parameters[i].type?.name ?? "").indexOf("Boolean") >= 0) toggled[i] = true;
                            } catch(_) {}
                        }
                        argVariants.push(toggled);
                    }
                    for (var argSet of argVariants) {
                        if (isStaticReceiver) {
                            overload.invoke(...argSet);
                        } else {
                            overload.bind(receiver).invoke(...argSet);
                        }
                        return true;
                    }
                } catch(_) {}
            }
        } catch(_) {}
        return false;
    }
    function tryKickPlayer(player) {
        if (!player || player.isNull?.() || playerIsLocal(player)) return false;
        try {
            var playerRef = (() => {
                try { return player.method("get_PlayerRef").invoke(); } catch(_) {}
                try { return player.field("_playerRef").value; } catch(_) {}
                return null;
            })();
            for (var runner of getRunnerCandidates()) {
                try {
                    if (!runner || runner.isNull?.()) continue;
                    if (playerRef != null) {
                        if (tryCallNames(runner, ["Disconnect", "DisconnectPlayer", "RemovePlayer", "KickPlayer", "CloseConnection", "KickPeer"], 1, playerRef)) return true;
                        if (tryCallNames(runner, ["Disconnect", "DisconnectPlayer", "RemovePlayer", "KickPlayer", "CloseConnection", "KickPeer"], 2, playerRef, true)) return true;
                    }
                    if (tryCallNames(runner, ["Disconnect", "DisconnectPlayer", "RemovePlayer", "KickPlayer", "CloseConnection", "KickPeer"], 1, player)) return true;
                    if (tryCallNames(runner, ["Disconnect", "DisconnectPlayer", "RemovePlayer", "KickPlayer", "CloseConnection", "KickPeer"], 2, player, true)) return true;
                } catch(_) {}
            }
        } catch(_) {}
        var tokens = getPlayerKickTokens(player).sort((a, b) => rankKickToken(b) - rankKickToken(a));
        var methodNames = [
            "KickPlayer",
            "RPC_KickPlayer",
            "KickPlayerByUserId",
            "KickPlayerByAccountId",
            "DisconnectPlayer",
            "DisconnectUser",
            "KickUserFromPrivateRoom",
            "RemovePrivateRoomMember",
            "KickUser",
            "BanUserFromPrivateRoom",
            "RoomBanUserAsync",
            "KickSelectedPlayer",
            "ModerateKickUser",
            "OnKickUserPressed"
        ];
        var candidateClasses = [
            NetSessionPrivateRoomManagerClass,
            PlayerWatchDevMenuMediatorClass,
            ModerationMenuMediatorClass,
            NetworkSessionManagerClass,
            NManager,
            PrivateRoomStateClass,
            UserCacheManagerClass,
            AnimalCompanyApiClass
        ];
        for (var token of tokens) {
            for (var klass of candidateClasses) {
                if (!klass) continue;
                for (var methodName of methodNames) {
                    for (var instance of getSingletonInstanceCandidates(klass)) {
                        if (tryInvokeModerationMethod(instance, false, methodName, token, player)) return true;
                    }
                    if (tryInvokeModerationMethod(klass, true, methodName, token, player)) return true;
                }
            }
        }
        return false;
    }
    function isPlayerNearMe(player, maxDistance = 10.0) {
        try {
            var myPos = getTransform(headCollider).method("get_position").invoke();
            var playerPos = getTransform(player).method("get_position").invoke();
            return (Vector3.method("Distance").invoke(myPos, playerPos) ) <= maxDistance;
        } catch(_) {
            return false;
        }
    }
    function tryCallNames(obj, names[], parameterCount = -1, ...args[]) {
        try {
            if (!obj || obj.isNull?.()) return false;
            for (var name of names) {
                try {
                    var method = parameterCount >= 0 ? obj.class.method(name, parameterCount) : obj.class.method(name);
                    if (method) {
                        invokeInstance(method, obj, ...args);
                        return true;
                    }
                } catch(_) {}
                try {
                    var method = parameterCount >= 0 ? obj.method(name, parameterCount) : obj.method(name);
                    if (method) {
                        method.invoke(...args);
                        return true;
                    }
                } catch(_) {}
            }
        } catch(_) {}
        return false;
    }
    function tryReleaseHeldItem(obj) {
        try {
            if (!obj || obj.isNull?.()) return;
            var names = ["ForceDrop", "Drop", "Release", "ReleaseGrabHandle", "ReleaseGrabHandles", "ReleaseHeldObject", "DropHeldObject", "DropItem", "Detach", "DetachFromPlayer", "RPC_Drop", "TryDrop", "TryRelease", "ForceRelease", "Unequip", "UngrabAllHandles", "BreakGrabWithDistance"];
            tryCallNames(obj, names, -1);
            tryCallNames(obj, names, 0);
            try {
                var go = obj.method("get_gameObject").invoke();
                if (go && !go.isNull?.()) {
                    tryCallNames(go, names, -1);
                    tryCallNames(go, names, 0);
                }
            } catch(_) {}
        } catch(_) {}
    }
    function requestAuthorityDeep(obj) {
        try {
            if (!obj || obj.isNull?.()) return;
            tryCallNames(obj, ["RequestStateAuthority", "RequestInputAuthority", "TakeOwnership", "ClaimOwnership"], 0);
            try {
                var networkObj = tryMethodName(obj.class, ["get_Object", "get_NetworkObject"], 0);
                if (networkObj) {
                    var no = invokeInstance(networkObj, obj);
                    if (no && !no.isNull?.()) tryCallNames(no, ["RequestStateAuthority", "RequestInputAuthority", "TakeOwnership", "ClaimOwnership"], 0);
                }
            } catch(_) {}
            try {
                var runner = obj.method?.("get_Runner")?.invoke?.();
                if (runner && !runner.isNull?.()) {
                    tryCallNames(runner, ["RequestStateAuthority", "RequestInputAuthority"], 1, obj);
                }
            } catch(_) {}
        } catch(_) {}
    }
    function forceReleaseItemFromAllPlayers(obj) {
        try {
            var targetKey = normalizeSceneObjectHandle(obj);
            for (var player of getAllNetPlayersList(true)) {
                try { tryReleaseHeldItem(player); } catch(_) {}
                tryCallNames(player, ["ReleaseHeldObject", "DropHeldObject", "DropItem", "DetachFromBack", "SetAttachedToBack", "SetAttachedToHip"], 0);
                tryCallNames(player, ["SetAttachedToBack", "SetAttachedToHip"], 1, false);
                for (var handIndex of [0, 1]) {
                    try {
                        var interactor = player.method("GetHandInteractor", 1).invoke(handIndex);
                        if (interactor && !interactor.isNull?.()) {
                            tryReleaseHeldItem(interactor);
                            tryCallNames(interactor, ["ReleaseHeldObject", "DropHeldObject", "DropItem", "ForceDrop"], 0);
                        }
                        var held = getPlayerHeldGrabbable(player, handIndex);
                        if (!held || held.isNull?.()) continue;
                        var heldKey = normalizeSceneObjectHandle(held);
                        if (targetKey && heldKey && targetKey !== heldKey) continue;
                        tryReleaseHeldItem(held);
                        tryReleaseHeldItem(player);
                        tryCallNames(held, ["DetachFromBack", "DetachFromHip", "SetAttachedToBack", "SetAttachedToHip"], 0);
                        tryCallNames(held, ["SetAttachedToBack", "SetAttachedToHip"], 1, false);
                    } catch(_) {}
                }
            }
        } catch(_) {}
    }
    function forceMoveLobbyItem(go, worldPos) {
        try {
            if (!go || go.isNull?.()) return false;
            var target = go;
            var targetGo = go;
            try {
                var maybeGo = go.method("get_gameObject").invoke();
                if (maybeGo && !maybeGo.isNull?.()) targetGo = maybeGo;
            } catch(_) {}
            var rootGo = targetGo;
            try {
                var rootTf = getTransform(targetGo).method("get_root").invoke();
                if (rootTf && !rootTf.isNull?.()) {
                    var rootCandidate = rootTf.method("get_gameObject").invoke();
                    if (rootCandidate && !rootCandidate.isNull?.()) rootGo = rootCandidate;
                }
            } catch(_) {}
            forceReleaseItemFromAllPlayers(target);
            forceReleaseItemFromAllPlayers(targetGo);
            forceReleaseItemFromAllPlayers(rootGo);
            tryReleaseHeldItem(target);
            tryReleaseHeldItem(targetGo);
            tryReleaseHeldItem(rootGo);
            requestAuthorityDeep(target);
            requestAuthorityDeep(targetGo);
            requestAuthorityDeep(rootGo);
            try {
                var gbo = null;
                try { gbo = go.cast?.(GBOClass); } catch(_) {}
                if (!gbo || gbo.isNull?.()) {
                    try { gbo = targetGo.method("GetComponent", 1).inflate(GBOClass).invoke(); } catch(_) {}
                }
                if (gbo && !gbo.isNull()) {
                    requestAuthorityDeep(gbo);
                    try {
                        var networkObj = gbo.method("get_Object").invoke();
                        if (networkObj && !networkObj.isNull?.()) {
                            try { networkObj.method("RequestStateAuthority").invoke(); } catch(_) {}
                            requestAuthorityDeep(networkObj);
                        }
                    } catch(_) {}
                    tryCallNames(gbo, ["SetIsHidden"], 1, false);
                }
            } catch(_) {}
            tryCallNames(target, ["Grab", "Release"], 2, NULL, false);
            tryCallNames(target, ["RPC_Teleport", "TeleportTo"], 1, worldPos);
            tryCallNames(targetGo, ["RPC_Teleport", "TeleportTo"], 1, worldPos);
            tryCallNames(rootGo, ["RPC_Teleport", "TeleportTo"], 1, worldPos);
            try {
                var rb = rootGo.method("GetComponentInChildren", 0).inflate(Rigidbody).invoke();
                if (rb && !rb.isNull()) {
                    try { rb.method("set_isKinematic").invoke(true); } catch(_) {}
                    try { rb.method("set_detectCollisions").invoke(false); } catch(_) {}
                    try { rb.method("set_velocity").invoke(zeroVector); } catch(_) {}
                    try { rb.method("set_angularVelocity").invoke(zeroVector); } catch(_) {}
                }
            } catch(_) {}
            try {
                getTransform(target).method("set_position").invoke(worldPos);
            } catch(_) {
                getTransform(targetGo).method("set_position").invoke(worldPos);
            }
            try { getTransform(targetGo).method("set_position").invoke(worldPos); } catch(_) {}
            try { getTransform(rootGo).method("set_position").invoke(worldPos); } catch(_) {}
            tryCallNames(target, ["SetWorldPosition", "SetPosition"], 1, worldPos);
            tryCallNames(targetGo, ["SetWorldPosition", "SetPosition"], 1, worldPos);
            tryCallNames(rootGo, ["SetWorldPosition", "SetPosition"], 1, worldPos);
            tryCallNames(target, ["RPC_SetPosition", "RPC_SetWorldPosition"], 1, worldPos);
            tryCallNames(targetGo, ["RPC_SetPosition", "RPC_SetWorldPosition"], 1, worldPos);
            tryCallNames(rootGo, ["RPC_SetPosition", "RPC_SetWorldPosition"], 1, worldPos);
            try {
                var rb = rootGo.method("GetComponentInChildren", 0).inflate(Rigidbody).invoke();
                if (rb && !rb.isNull()) {
                    try { rb.method("set_velocity").invoke(zeroVector); } catch(_) {}
                    try { rb.method("set_angularVelocity").invoke(zeroVector); } catch(_) {}
                }
            } catch(_) {}
            return true;
        } catch(_) {
            return false;
        }
    }
    function destroyNetworkedObjectDeep(obj) {
        try {
            if (!obj || obj.isNull?.()) return false;
            var rootGo = getRootLikeObject(obj);
            var candidates = [obj, rootGo];
            for (var candidate of candidates) {
                try { requestAuthorityDeep(candidate); } catch(_) {}
                try { tryReleaseHeldItem(candidate); } catch(_) {}
                try {
                    var gbo = null;
                    try { gbo = candidate.cast?.(GBOClass); } catch(_) {}
                    if (!gbo || gbo.isNull?.()) {
                        try { gbo = candidate.method("GetComponent", 1).inflate(GBOClass).invoke(); } catch(_) {}
                    }
                    if (gbo && !gbo.isNull?.()) {
                        try { gbo.method("set_isHidden").invoke(false); } catch(_) {}
                        try { gbo.method("Despawn").invoke(); return true; } catch(_) {}
                        try { gbo.method("RPC_Destroy").invoke(); return true; } catch(_) {}
                    }
                } catch(_) {}
                try {
                    var networkObj = tryMethodName(candidate.class, ["get_Object", "get_NetworkObject"], 0);
                    if (networkObj) {
                        var no = invokeInstance(networkObj, candidate);
                        if (no && !no.isNull?.()) {
                            for (var runner of getRunnerCandidates()) {
                                try { runner.method("Despawn").invoke(no); return true; } catch(_) {}
                            }
                            try { no.method("Despawn").invoke(); return true; } catch(_) {}
                        }
                    }
                } catch(_) {}
                try { if (candidate.method) { candidate.method("Despawn").invoke(); return true; } } catch(_) {}
                try { if (candidate.method) { candidate.method("RPC_Destroy").invoke(); return true; } } catch(_) {}
                try { if (candidate.method) { candidate.method("DestroySelf").invoke(); return true; } } catch(_) {}
            }
            try { Destroy(rootGo); } catch(_) {}
            try { Destroy(obj); } catch(_) {}
            return true;
        } catch(_) {
            return false;
        }
    }
    function getSelectedVfxEntry(): [string, number] {
        if (selectedVfxIndex < 0 || selectedVfxIndex >= vfxTypeEntries.length) selectedVfxIndex = 0;
        return vfxTypeEntries[selectedVfxIndex];
    }
    function getRunnerCandidates()[] {
        var results[] = [];
        var seen = new Set();
        var pushRunner = (runner) => {
            try {
                if (!runner || runner.isNull?.()) return;
                var key = normalizeSceneObjectHandle(runner) || String(runner);
                if (seen.has(key)) return;
                seen.add(key);
                results.push(runner);
            } catch(_) {}
        };
        try {
            var sfx = SFXManager.field("_instance").value;
            if (sfx && !sfx.isNull?.()) {
                try { pushRunner(sfx.method("get__currentRunner").invoke()); } catch(_) {}
                try { pushRunner(sfx.field("_currentRunner").value); } catch(_) {}
            }
        } catch(_) {}
        try {
            var pgInst = PrefabGen.field("_instance").value;
            if (pgInst && !pgInst.isNull?.()) {
                try { pushRunner(pgInst.method("get_runner").invoke()); } catch(_) {}
            }
        } catch(_) {}
        try {
            var nm = NManager.field("k__BackingField").value;
            if (nm && !nm.isNull?.()) {
                try { pushRunner(nm.method("get_runner").invoke()); } catch(_) {}
            }
        } catch(_) {}
        return results;
    }
    function getPrimaryVfxRunner() {
        try {
            var sfx = SFXManager.field("_instance").value;
            if (sfx && !sfx.isNull?.()) {
                try {
                    var runner = sfx.method("get__currentRunner").invoke();
                    if (runner && !runner.isNull?.()) return runner;
                } catch(_) {}
                try {
                    var runner = sfx.field("_currentRunner").value;
                    if (runner && !runner.isNull?.()) return runner;
                } catch(_) {}
            }
        } catch(_) {}
        try {
            var pgInst = PrefabGen.field("_instance").value;
            if (pgInst && !pgInst.isNull?.()) {
                var runner = pgInst.method("get_runner").invoke();
                if (runner && !runner.isNull?.()) return runner;
            }
        } catch(_) {}
        try {
            var nm = NManager.field("k__BackingField").value;
            if (nm && !nm.isNull?.()) {
                var runner = nm.method("get_runner").invoke();
                if (runner && !runner.isNull?.()) return runner;
            }
        } catch(_) {}
        return null;
    }
    function tryInvokeVfxMethod(methodName, runner, vfxValue, pos) {
        var variants[] = [
            [vfxValue, pos, identityQuaternion],
            [pos, vfxValue, identityQuaternion],
            [runner, vfxValue, pos, identityQuaternion],
            [runner, pos, vfxValue, identityQuaternion],
            [vfxValue, pos],
            [pos, vfxValue],
            [vfxValue],
            [pos]
        ];
        try {
            for (var klass of [ParticleManagerClass, VFXManagerClass]) {
                if (!klass) continue;
                for (var argSet of variants) {
                    try {
                        var method = tryMethodName(klass, [methodName], argSet.length);
                        if (!method) continue;
                        method.invoke(...argSet);
                        return true;
                    } catch(_) {}
                }
            }
        } catch(_) {}
        try {
            var managers = [SFXManager, ParticleManagerClass, VFXManagerClass];
            for (var managerClass of managers) {
                if (!managerClass) continue;
                for (var instance of getSingletonInstanceCandidates(managerClass)) {
                    for (var argSet of variants) {
                        try {
                            if (tryCallNames(instance, [methodName], argSet.length, ...argSet)) return true;
                        } catch(_) {}
                    }
                }
            }
        } catch(_) {}
        return false;
    }
    function tryDirectPlayVfx(runner, vfxValue, pos) {
        try {
            if (ParticleManagerClass) {
                try { ParticleManagerClass.method("RPC_PlayVFX", 4).invoke(runner, vfxValue, pos, identityQuaternion); return true; } catch(_) {}
                try { ParticleManagerClass.method("RPC_PlayVFXRemoteOnly", 4).invoke(runner, vfxValue, pos, identityQuaternion); return true; } catch(_) {}
                try { ParticleManagerClass.method("RPC_VFX", 4).invoke(runner, vfxValue, pos, identityQuaternion); return true; } catch(_) {}
            }
        } catch(_) {}
        try {
            if (VFXManagerClass) {
                try { VFXManagerClass.method("RPC_PlayVFX", 4).invoke(runner, vfxValue, pos, identityQuaternion); return true; } catch(_) {}
                try { VFXManagerClass.method("RPC_VFX", 4).invoke(runner, vfxValue, pos, identityQuaternion); return true; } catch(_) {}
            }
        } catch(_) {}
        return false;
    }
    function getDynamicVfxMethodNames()[] {
        if (vfxMethodNamesCache) return vfxMethodNamesCache;
        var names = new Set([
            "RPC_PlayVFX", "PlayVFX", "SpawnVFX", "TriggerVFX", "PlayEffect", "SpawnEffect",
            "RPC_PlayVfx", "PlayVfx", "SpawnVfx", "TriggerVfx", "PlayParticle", "SpawnParticle",
            "RPC_VFX", "RPC_PlayVFXRemoteOnly", "ExecuteNetworkVFX", "NetworkVFXInternal",
            "RPC_NetworkVFX0", "RPC_NetworkVFX1", "RPC_NetworkVFX2", "RPC_NetworkVFX3", "RPC_NetworkVFX4",
            "PlayEffects", "DoEffects"
        ]);
        try {
            for (var klass of [ParticleManagerClass, SFXManager, VFXManagerClass]) {
                if (!klass) continue;
                for (var method of klass.methods) {
                    try {
                        var name = String(method.name ?? "");
                        if (/vfx|effect|particle/i.test(name)) names.add(name);
                    } catch(_) {}
                }
            }
        } catch(_) {}
        vfxMethodNamesCache = Array.from(names);
        return vfxMethodNamesCache;
    }
    function playSelectedVfxAt(pos) {
        try {
            if (time < vfxDispatchUnavailableUntil) return false;
            var [selectedName, selectedValue] = getSelectedVfxEntry();
            var vfxValues = [
                selectedValue === VFXTypes.None ? VFXTypes.ConfettiBurst : selectedValue,
                VFXTypes.ConfettiBurst,
                VFXTypes.GreenBlink,
                VFXTypes.FuelExplosion
            ].filter((value, index, arr) => arr.indexOf(value) === index);
            var success = false;
            var primaryRunner = getPrimaryVfxRunner();
            var methodNames = getDynamicVfxMethodNames();
            if (primaryRunner && !primaryRunner.isNull?.()) {
                for (var vfxValue of vfxValues) {
                    if (tryDirectPlayVfx(primaryRunner, vfxValue, pos)) {
                        success = true;
                        if (vfxValue === vfxValues[0]) return true;
                    }
                    for (var methodName of methodNames) {
                        if (tryInvokeVfxMethod(methodName, primaryRunner, vfxValue, pos)) {
                            success = true;
                            if (vfxValue === vfxValues[0]) return true;
                            break;
                        }
                    }
                }
            }
            for (var runner of getRunnerCandidates()) {
                for (var vfxValue of vfxValues) {
                    if (tryDirectPlayVfx(runner, vfxValue, pos)) {
                        success = true;
                        if (vfxValue === vfxValues[0]) return true;
                    }
                    for (var methodName of methodNames) {
                        if (tryInvokeVfxMethod(methodName, runner, vfxValue, pos)) {
                            success = true;
                            if (vfxValue === vfxValues[0]) return true;
                            break;
                        }
                    }
                }
            }
            if (!success) {
                vfxDispatchUnavailableUntil = time + 4.0;
                if (time >= vfxNoRunnerLogTime) {
                    vfxNoRunnerLogTime = time + 15.0;
                    console.error("[VFX] no runner accepted VFX", selectedName);
                }
            }
            return success;
        } catch(e) {
            console.error("[VFX] playSelectedVfxAt failed:", e);
            return false;
        }
    }
    function spawnLocalVfxFallback(pos) {
        try {
            var base = readVec3Components(pos);
            var colors: [number, number, number, number][] = [
                [1.0, 0.55, 0.08, 0.92],
                [1.0, 0.82, 0.18, 0.92],
                [0.96, 0.96, 0.96, 0.88]
            ];
            for (var i = 0; i < 4; i++) {
                var fx = createObject([
                    base[0] + ((Math.random() * 0.35) - 0.175),
                    base[1] + ((Math.random() * 0.35) - 0.05),
                    base[2] + ((Math.random() * 0.35) - 0.175)
                ], identityQuaternion, [
                    0.09 + (Math.random() * 0.08),
                    0.09 + (Math.random() * 0.08),
                    0.09 + (Math.random() * 0.08)
                ], 1, colors[i % colors.length], null, false);
                try { Object.method("Destroy", 2).invoke(fx, 0.45); } catch(_) {}
            }
        } catch(_) {}
    }
    class ButtonInfo {
        buttonText;
        method: () => void;
        enableMethod: () => void;
        disableMethod: () => void;
        isTogglable;
        toolTip?;
        enabled;
        constructor(config) {
            this.buttonText   = config.buttonText;
            this.method       = config.method;
            this.enableMethod = config.enableMethod;
            this.disableMethod = config.disableMethod;
            this.isTogglable  = config.isTogglable ?? true;
            this.toolTip      = config.toolTip ?? null;
            this.enabled      = config.enabled ?? false;
        }
    }
    function applyMenuStructurePatches() {
        if (menuStructurePatched) return;
        try {
            var renameButton = (list, from, to, tip | null = null) => {
                for (var btn of list) {
                    if (btn.buttonText === from) {
                        btn.buttonText = to;
                        if (tip != null) btn.toolTip = tip;
                        return;
                    }
                }
            };
            var removeButton = (list, text) => {
                var idx = list.findIndex(btn => btn.buttonText === text);
                if (idx >= 0) list.splice(idx, 1);
            };
            var makeCategoryButton = (text, category, tip) => new ButtonInfo({
                buttonText: text,
                method: () => { currentCategory = category; currentPage = 0; },
                isTogglable: false,
                toolTip: tip
            });
            var insertButtonAfter = (list, button, afterText | null = null) => {
                if (list.some(btn => btn.buttonText === button.buttonText)) return;
                var idx = afterText ? list.findIndex(btn => btn.buttonText === afterText) : -1;
                list.splice(idx >= 0 ? idx + 1 : list.length, 0, button);
            };
            var refreshSearchMenu = () => {
                buttons[29] = makeSearchButtons();
                buttons[30] = makeSearchKeyboardButtons("ABCDEFGHIJKLM", 29);
                buttons[31] = makeSearchKeyboardButtons("NOPQRSTUVWXYZ", 29);
                buttons[32] = makeSearchKeyboardButtons("1234567890", 29);
                try { rebuildButtonMap(); } catch(_) {}
            };
            var appendSearchKey = (key) => {
                if (modSearchQuery.length >= 18) return;
                modSearchQuery += key;
                refreshSearchMenu();
                currentCategory = 29;
                currentPage = 0;
            };
            var getSearchMatches = () => {
                var query = modSearchQuery.trim().toLowerCase();
                var matches: { text, category, page }[] = [];
                if (query.length === 0) return matches;
                for (var category = 0; category < buttons.length; category++) {
                    if (category === 29 || category === 30 || category === 31 || category === 32) continue;
                    var list = buttons[category] ?? [];
                    for (var idx = 0; idx < list.length; idx++) {
                        var btn = list[idx];
                        if (!btn?.buttonText) continue;
                        var text = btn.buttonText;
                        var lower = text.toLowerCase();
                        if (!lower.includes(query)) continue;
                        if (text.startsWith("Exit ") || text.startsWith("Back ") || text === "PreviousPage" || text === "NextPage" || text === "GlobalReturn" || text === "Disconnect") continue;
                        matches.push({ text, category, page.floor(idx / 8) });
                        if (matches.length >= 28) return matches;
                    }
                }
                return matches;
            };
            var makeSearchKeyboardButtons = (letters, returnCategory) => [
                new ButtonInfo({
                    buttonText: "Back Search",
                    method: () => { refreshSearchMenu(); currentCategory = returnCategory; currentPage = 0; },
                    isTogglable: false,
                    toolTip: "Returns to the search page."
                }),
                ...letters.split("").map(letter => new ButtonInfo({
                    buttonText: "Key " + letter,
                    method: () => { appendSearchKey(letter); },
                    isTogglable: false,
                    toolTip: "Adds " + letter + " to the search."
                }))
            ];
            var makeSearchButtons = () => {
                var matches = getSearchMatches();
                var displayQuery = modSearchQuery.length > 0 ? modSearchQuery : "EMPTY";
                return [
                    new ButtonInfo({
                        buttonText: "Exit Search",
                        method: () => { currentCategory = 0; currentPage = 0; },
                        isTogglable: false,
                        toolTip: "Returns to the main category."
                    }),
                    new ButtonInfo({
                        buttonText: "Search: " + displayQuery,
                        method: () => { sendNotification("Search query: " + displayQuery, false); },
                        isTogglable: false,
                        toolTip: "Shows the current mod search."
                    }),
                    new ButtonInfo({
                        buttonText: "Keys A-M",
                        method: () => { currentCategory = 30; currentPage = 0; },
                        isTogglable: false,
                        toolTip: "Opens search keys A through M."
                    }),
                    new ButtonInfo({
                        buttonText: "Keys N-Z",
                        method: () => { currentCategory = 31; currentPage = 0; },
                        isTogglable: false,
                        toolTip: "Opens search keys N through Z."
                    }),
                    new ButtonInfo({
                        buttonText: "Keys 0-9",
                        method: () => { currentCategory = 32; currentPage = 0; },
                        isTogglable: false,
                        toolTip: "Opens search keys 0 through 9."
                    }),
                    new ButtonInfo({
                        buttonText: "Space",
                        method: () => {
                            if (modSearchQuery.length >= 18) return;
                            modSearchQuery += " ";
                            refreshSearchMenu();
                            currentCategory = 29;
                            currentPage = 0;
                        },
                        isTogglable: false,
                        toolTip: "Adds a space to the search."
                    }),
                    new ButtonInfo({
                        buttonText: "Backspace",
                        method: () => {
                            modSearchQuery = modSearchQuery.slice(0, Math.max(0, modSearchQuery.length - 1));
                            refreshSearchMenu();
                            currentCategory = 29;
                            currentPage = 0;
                        },
                        isTogglable: false,
                        toolTip: "Deletes the last search key."
                    }),
                    new ButtonInfo({
                        buttonText: "Clear Search",
                        method: () => {
                            modSearchQuery = "";
                            refreshSearchMenu();
                            currentCategory = 29;
                            currentPage = 0;
                        },
                        isTogglable: false,
                        toolTip: "Clears the mod search."
                    }),
                    ...matches.map(match => new ButtonInfo({
                        buttonText: "Go: " + match.text,
                        method: () => {
                            currentCategory = match.category;
                            currentPage = match.page;
                            sendNotification("Opened " + match.text, false);
                        },
                        isTogglable: false,
                        toolTip: "Opens " + match.text + " in its original category."
                    }))
                ];
            };
            var mainButtons = buttons[0] ?? [];
            var modsSettingsButton = mainButtons.find(btn => btn.buttonText === "Mods Settings" || btn.buttonText === "Settings");
            if (modsSettingsButton) {
                modsSettingsButton.buttonText = "Settings";
                modsSettingsButton.method = () => { currentCategory = 21; currentPage = 0; };
                modsSettingsButton.isTogglable = false;
                modsSettingsButton.toolTip = "Opens settings.";
            }
            removeButton(mainButtons, "Menu Settings");
            renameButton(mainButtons, "Other player mods", "Whitelist mods", "Opens the whitelist player mods page.");
            renameButton(mainButtons, "Misc", "Over Powered", "Opens the over powered category.");
            removeButton(mainButtons, "Unity Explorer");
            removeButton(mainButtons, "Extra WL");
            var moonyButton = mainButtons.find(btn => btn.buttonText === "Moony2HP");
            if (moonyButton) {
                moonyButton.method = () => {
                    var netplayer = NetPlayer.method("get_localPlayer").invoke();
                    netplayer.method("set_displayName").invoke(Il2Cpp.string("Moony2HP"));
                };
                moonyButton.toolTip = "Sets your display name to Moony2HP.";
            }
            var movedNameButtons = [];
            var nameButtonTexts = ["Monkongs Menu", "Monkong", "Moony2HP", "Onimai"];
            for (var nameText of nameButtonTexts) {
                var idx = mainButtons.findIndex(btn => btn.buttonText === nameText);
                if (idx >= 0) movedNameButtons.push(mainButtons.splice(idx, 1)[0]);
            }
            buttons[18] = [
                new ButtonInfo({
                    buttonText: "Exit Name",
                    method: () => { currentCategory = 0; currentPage = 0; },
                    isTogglable: false,
                    toolTip: "Returns to the main category."
                }),
                ...movedNameButtons
            ];
            buttons[19] = [
                new ButtonInfo({
                    buttonText: "Exit Text Spawn",
                    method: () => { currentCategory = 0; currentPage = 0; },
                    isTogglable: false,
                    toolTip: "Returns to the main category."
                }),
                new ButtonInfo({
                    buttonText: "Spawn Hell Ore Text",
                    method: () => { spawnTextBlueprintAsHellOre(); },
                    isTogglable: false,
                    toolTip: "Spawns the blueprint text  ore at your right hand spawn point."
                }),
                new ButtonInfo({
                    buttonText: "Clear Hell Ore Text",
                    method: () => { clearSpawnedTextHellOre(); },
                    isTogglable: false,
                    toolTip: "Clears hell ore text pieces spawned by Text Spawn."
                })
            ];
            var addMainCategoryButton = (text, category, tip, afterText) => {
                if (mainButtons.some(btn => btn.buttonText === text)) return;
                var btn = new ButtonInfo({
                    buttonText: text,
                    method: () => { currentCategory = category; currentPage = 0; },
                    isTogglable: false,
                    toolTip: tip
                });
                var idx = mainButtons.findIndex(existing => existing.buttonText === afterText);
                mainButtons.splice(idx >= 0 ? idx + 1 : mainButtons.length, 0, btn);
            };
            addMainCategoryButton("Name", 18, "Opens the display name category.", "Stuff");
            addMainCategoryButton("Text Spawn", 19, "Opens the hell ore text spawn category.", "Name");
            addMainCategoryButton("Test", 20, "Opens experimental test actions.", "RPC Stuff");
            buttons[20] = [
                new ButtonInfo({
                    buttonText: "Exit Test",
                    method: () => { currentCategory = 0; currentPage = 0; },
                    isTogglable: false,
                    toolTip: "Returns to the main category."
                }),
                new ButtonInfo({
                    buttonText: "Give Money All",
                    method: () => { giveMoneyAllTest(); },
                    isTogglable: false,
                    toolTip: "Gives 10,000,000 money to all other players using the existing RPC money path."
                }),
                new ButtonInfo({
                    buttonText: "Drain Money All",
                    method: () => { removeMoneyAllTest(); },
                    isTogglable: false,
                    toolTip: "Gives -10,000,000 money to all other players using the existing RPC money path."
                }),
                new ButtonInfo({
                    buttonText: "Research Ore Spawner",
                    enableMethod: () => { researchOreSpawnDelay = 0; sendNotification("Research Ore Spawner ON", false); },
                    disableMethod: () => { sendNotification("Research Ore Spawner OFF", false); },
                    method: () => { spawnResearchOreLoop(); },
                    isTogglable: true,
                    toolTip: "Continuously spawns the mineable purple/research ore vein from your right hand."
                }),
                new ButtonInfo({
                    buttonText: "Spawn 500 Money",
                    method: () => { spawnMoneyBills500(); },
                    isTogglable: false,
                    toolTip: "Spawns 500 dollar-bill items in a frozen grid at your right-hand spawn point."
                }),
                new ButtonInfo({
                    buttonText: "Hand Item Steal",
                    enableMethod: () => { handStealDelay = 0; sendNotification("Hand Item Steal ON", false); },
                    disableMethod: () => { sendNotification("Hand Item Steal OFF", false); },
                    method: () => { stealNearestHeldItemToRightHand(); },
                    isTogglable: true,
                    toolTip: "Hold right grip near another player's held item to pull it to your right hand."
                }),
                new ButtonInfo({
                    buttonText: "Spawn Hell Ore Text",
                    method: () => { spawnTextBlueprintAsHellOre(); },
                    isTogglable: false,
                    toolTip: "Spawns the blueprint text  hell ore from your right hand."
                })
            ];
            buttons[21] = [
                new ButtonInfo({
                    buttonText: "Exit Settings",
                    method: () => { currentCategory = 0; currentPage = 0; },
                    isTogglable: false,
                    toolTip: "Returns to the main category."
                }),
                new ButtonInfo({
                    buttonText: "Mods Settings",
                    method: () => { currentCategory = 2; currentPage = 0; },
                    isTogglable: false,
                    toolTip: "Opens mod settings."
                }),
                new ButtonInfo({
                    buttonText: "Menu Settings",
                    method: () => { currentCategory = 12; currentPage = 0; },
                    isTogglable: false,
                    toolTip: "Opens menu settings."
                }),
                new ButtonInfo({
                    buttonText: "Admin LB ESP",
                    enableMethod: () => { adminLeaderboardEspEnabled = true; sendNotification("Admin LeaderBoard ESP ON", false); },
                    disableMethod: () => {
                        adminLeaderboardEspEnabled = false;
                        if (!arenaEspEnabled) destroyOverlayEntries(playerEspEntries);
                        sendNotification("Admin LeaderBoard ESP OFF", false);
                    },
                    isTogglable: true,
                    enabled: true,
                    method: () => { updatePlayerEspOverlays(); },
                    toolTip: "Shows ESP on the player selected from Admin LeaderBoard."
                }),
                makeCategoryButton("ID Settings", 22, "Opens direct item, mob, and VFX ID pickers."),
                new ButtonInfo({
                    buttonText: "ImGui Panel",
                    enableMethod: () => { imguiEnabled = true; sendNotification("ImGui Panel ON", false); },
                    disableMethod: () => { imguiEnabled = false; destroyImGui(); sendNotification("ImGui Panel OFF", false); },
                    isTogglable: true,
                    enabled: false,
                    method: () => {},
                    toolTip: "Toggles the ImGui panel above your hand."
                })
            ];
            buttons[22] = [
                new ButtonInfo({
                    buttonText: "Exit ID Settings",
                    method: () => { currentCategory = 21; currentPage = 0; },
                    isTogglable: false,
                    toolTip: "Returns to the Settings tab."
                }),
                makeCategoryButton("Item IDs", 23, "Shows every item ID  buttons."),
                makeCategoryButton("Mob IDs", 24, "Shows every mob ID  buttons."),
                makeCategoryButton("VFX IDs", 25, "Shows every VFX ID  buttons.")
            ];
            buttons[23] = [
                new ButtonInfo({
                    buttonText: "Exit Item IDs",
                    method: () => { currentCategory = 22; currentPage = 0; },
                    isTogglable: false,
                    toolTip: "Returns to ID Settings."
                }),
                ...itemIDs.map((id, idx) => new ButtonInfo({
                    buttonText(id),
                    method: () => {
                        itemIndex = idx;
                        sendNotification("Item ID: " + itemIDs[itemIndex], false);
                    },
                    isTogglable: false,
                    toolTip: "Selects item ID: " + id
                }))
            ];
            buttons[24] = [
                new ButtonInfo({
                    buttonText: "Exit Mob IDs",
                    method: () => { currentCategory = 22; currentPage = 0; },
                    isTogglable: false,
                    toolTip: "Returns to ID Settings."
                }),
                ...mobIDs.map((mob, idx) => new ButtonInfo({
                    buttonText: mob.name,
                    method: () => {
                        mobIndex = idx;
                        sendNotification("Mob ID: " + mobIDs[mobIndex].name + " (" + mobIDs[mobIndex].id + ")", false);
                    },
                    isTogglable: false,
                    toolTip: "Selects mob ID " + mob.id + "."
                }))
            ];
            buttons[25] = [
                new ButtonInfo({
                    buttonText: "Exit VFX IDs",
                    method: () => { currentCategory = 22; currentPage = 0; },
                    isTogglable: false,
                    toolTip: "Returns to ID Settings."
                }),
                ...vfxTypeEntries.map(([name, value], idx) => new ButtonInfo({
                    buttonText: name + " (" + value + ")",
                    method: () => {
                        selectedVfxIndex = idx;
                        var [vfxName, vfxId] = getSelectedVfxEntry();
                        sendNotification("VFX ID: " + vfxName + " (" + vfxId + ")", false);
                    },
                    isTogglable: false,
                    toolTip: "Selects VFX ID " + value + "."
                }))
            ];
            var makePrefabGunButton = (buttonText, prefabName, delay = 0.25) => new ButtonInfo({
                buttonText,
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = null;
                    try { gunData = renderGun(); } catch(_) { return; }
                    if (!gunData) return;
                    var ray = gunData.ray;
                    if (!ray || ray.handle.isNull()) return;
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + delay;
                        try {
                            var hitPoint = ray.method("get_point").invoke();
                            var spawned = spawnNetworkPrefab(prefabName, hitPoint, identityQuaternion);
                            if (!spawned || spawned.isNull?.()) {
                                sendNotification(buttonText + " spawn failed", false);
                            } else {
                                sendNotification("Spawned: " + prefabName, false);
                            }
                        } catch(e) {
                            console.error(buttonText + ":", e);
                            sendNotification(buttonText + ": " + e, false);
                        }
                    }
                },
                toolTip: "Spawns " + prefabName + " where you aim."
            });
            var makeAdminSpawnerButtons = () => {
                var discoveredButtons = adminSpawnerMobPrefabs.map(name => makePrefabGunButton(name + " Gun", name, 0.25));
                return [
                    new ButtonInfo({
                        buttonText: "Exit Admin Spawner",
                        method: () => { currentCategory = 0; currentPage = 0; },
                        isTogglable: false,
                        toolTip: "Returns to the main category."
                    }),
                    new ButtonInfo({
                        buttonText: "Find All Mob Guns",
                        method: () => {
                            var found = scanExistingMobPrefabs();
                            buttons[26] = makeAdminSpawnerButtons();
                            currentCategory = 26;
                            currentPage = 0;
                            try { rebuildButtonMap(); } catch(_) {}
                            sendNotification("Found " + found.length + " mob prefabs", false, 5);
                            console.log("[Admin Spawner] Mob prefab scan found " + found.length + " entries:\n" + found.join("\n"));
                        },
                        isTogglable: false,
                        toolTip: "Scans the loaded prefab table and adds every mob-looking prefab  gun."
                    }),
                    makePrefabGunButton("Moon Buggy Gun", "Vehicle_Buggy", 0.25),
                    new ButtonInfo({
                        buttonText: "Shadow Boss Gun",
                        isTogglable: true,
                        method: () => {
                            if (!rightGrab) {
                                mobSpawnGunTriggerLatched = false;
                                return;
                            }
                            var gunData = null;
                            try { gunData = renderGun(); } catch(_) { return; }
                            if (!gunData) return;
                            if (!rightTrigger) {
                                mobSpawnGunTriggerLatched = false;
                                return;
                            }
                            var ray = gunData.ray;
                            if (!ray || ray.handle.isNull()) return;
                            if (!mobSpawnGunTriggerLatched && time > mobGunDelay2) {
                                mobSpawnGunTriggerLatched = true;
                                mobGunDelay2 = time + 0.25;
                                try {
                                    var hitPoint = ray.method("get_point").invoke();
                                    var shadowBoss = mobIDs.find(mob => mob.name === "ShadowBoss") ?? { name: "ShadowBoss", id: 40 };
                                    spawnMobAtPos(shadowBoss, hitPoint, identityQuaternion);
                                    sendNotification("Spawning", false);
                                } catch(e) {
                                    console.error("Shadow Boss Gun:", e);
                                    sendNotification("Shadow Boss Gun: " + e, false);
                                }
                            }
                        },
                        toolTip: "Spawns the ShadowBoss mob where you aim."
                    }),
                    new ButtonInfo({
                        buttonText: "MomBoss Gun",
                        isTogglable: true,
                        method: () => {
                            if (!rightGrab) return;
                            var gunData = null;
                            try { gunData = renderGun(); } catch(_) { return; }
                            if (!gunData) return;
                            var ray = gunData.ray;
                            if (!ray || ray.handle.isNull()) return;
                            if (rightTrigger && time > lagGunDelay) {
                                lagGunDelay = time + 0.35;
                                try {
                                    var hitPoint = ray.method("get_point").invoke();
                                    var controller = spawnNetworkPrefab("MomBossController", hitPoint, identityQuaternion);
                                    var boss = spawnNetworkPrefab("MomBoss", hitPoint, identityQuaternion);
                                    if ((!controller || controller.isNull?.()) && (!boss || boss.isNull?.())) {
                                        sendNotification("MomBoss spawn failed", false);
                                    } else {
                                        sendNotification("Spawned MomBoss", false);
                                    }
                                } catch(e) {
                                    console.error("MomBoss Gun:", e);
                                    sendNotification("MomBoss Gun: " + e, false);
                                }
                            }
                        },
                        toolTip: "Spawns MomBossController and MomBoss where you aim."
                    }),
                    ...discoveredButtons
                ];
            };
            addMainCategoryButton("Admin Spawner", 26, "Opens admin prefab and boss spawn guns.", "Gun mods");
            buttons[26] = makeAdminSpawnerButtons();
            var getSelectedAdminLeaderboardPlayer = () => {
                if (adminLeaderboardSelectedPlayer && !adminLeaderboardSelectedPlayer.isNull?.()) return adminLeaderboardSelectedPlayer;
                return null;
            };
            var makeAdminLeaderboardActionButtons = () => [
                new ButtonInfo({
                    buttonText: "Back LeaderBoard",
                    method: () => {
                        clearAdminLeaderboardSelection(false);
                        buttons[27] = makeAdminLeaderboardButtons();
                        currentCategory = 27;
                        currentPage = 0;
                        try { rebuildButtonMap(); } catch(_) {}
                    },
                    isTogglable: false,
                    toolTip: "Returns to the Admin LeaderBoard player list."
                }),
                new ButtonInfo({
                    buttonText: "Fling Player",
                    method: () => {
                        var p = getSelectedAdminLeaderboardPlayer();
                        if (!p) { sendNotification("No selected player", false); return; }
                        try {
                            var rX = (Math.random() - 0.5) * 2200;
                            var rZ = (Math.random() - 0.5) * 2200;
                            p.method("RPC_AddForce").invoke([rX, 1600, rZ]);
                            sendNotification("Flung " + getAdminLeaderboardPlayerLabel(p), false);
                        } catch(e) { sendNotification("Fling: " + e, false); }
                    },
                    isTogglable: false,
                    toolTip: "Flings the selected player upward."
                }),
                new ButtonInfo({
                    buttonText: "Orbit Player",
                    enableMethod: () => {
                        var p = getSelectedAdminLeaderboardPlayer();
                        if (!p) { adminLeaderboardOrbitEnabled = false; sendNotification("No selected player", false); return; }
                        adminLeaderboardOrbitTarget = p;
                        adminLeaderboardOrbitEnabled = true;
                        adminLeaderboardOrbitPhase = 0;
                        sendNotification("Orbiting " + getAdminLeaderboardPlayerLabel(p), false);
                    },
                    disableMethod: () => {
                        adminLeaderboardOrbitEnabled = false;
                        adminLeaderboardOrbitTarget = null;
                        sendNotification("Orbit stopped", false);
                    },
                    isTogglable: true,
                    enabled: adminLeaderboardOrbitEnabled && adminLeaderboardOrbitTarget === getSelectedAdminLeaderboardPlayer(),
                    method: () => {},
                    toolTip: "Makes the selected player orbit around you."
                }),
                new ButtonInfo({
                    buttonText: "Teleport To Me",
                    method: () => {
                        var p = getSelectedAdminLeaderboardPlayer();
                        if (!p) { sendNotification("No selected player", false); return; }
                        try {
                            var me = NetPlayer.method("get_localPlayer").invoke();
                            if (!me || me.isNull?.()) return;
                            var myPos = getTransform(me).method("get_position").invoke();
                            p.method("RPC_Teleport").invoke(myPos);
                            sendNotification("TP'd " + getAdminLeaderboardPlayerLabel(p) + " to you", false);
                        } catch(e) { sendNotification("Teleport: " + e, false); }
                    },
                    isTogglable: false,
                    toolTip: "Teleports the selected player to your position."
                }),
                new ButtonInfo({
                    buttonText: "Kick Player",
                    method: () => {
                        var p = getSelectedAdminLeaderboardPlayer();
                        if (!p) { sendNotification("No selected player", false); return; }
                        try {
                            var label = getAdminLeaderboardPlayerLabel(p);
                            if (tryKickPlayer(p)) {
                                sendNotification("Kick sent to " + label, false);
                            } else {
                                // Force-hide fallback — same  Gun
                                try { p.method("RPC_DoPlayerDie").invoke(true); } catch(_) {}
                                try { p.method("RPC_Teleport").invoke([-9999999999, -9999999999, -9999999999]); } catch(_) {}
                                try {
                                    var go = p.method("get_gameObject").invoke();
                                    if (go && !go.isNull?.()) {
                                        try {
                                            var renderers = go.method("GetComponentsInChildren", 1).inflate(Renderer).invoke(true);
                                            if (renderers && !renderers.isNull?.()) {
                                                for (var i = 0; i < renderers.length; i++) {
                                                    try { renderers.get(i).method("set_enabled").invoke(false); } catch(_) {}
                                                }
                                            }
                                        } catch(_) {}
                                        try {
                                            var colliders = go.method("GetComponentsInChildren", 1).inflate(Collider).invoke(true);
                                            if (colliders && !colliders.isNull?.()) {
                                                for (var i = 0; i < colliders.length; i++) {
                                                    try { colliders.get(i).method("set_enabled").invoke(false); } catch(_) {}
                                                }
                                            }
                                        } catch(_) {}
                                        try { go.method("SetActive").invoke(false); } catch(_) {}
                                    }
                                } catch(_) {}
                                sendNotification("Kick+Hide: " + label, false);
                            }
                        } catch(e) { sendNotification("Kick: " + e, false); }
                    },
                    isTogglable: false,
                    toolTip: "Kicks the selected player; falls back to force-hiding them if kick fails."
                }),
                new ButtonInfo({
                    buttonText: "Add to Orbit Gun",
                    enableMethod: () => {
                        adminLeaderboardMultiOrbitEnabled = true;
                        adminLeaderboardMultiOrbitPhase = 0;
                        sendNotification("Orbit Gun ON — aim at players and pull trigger to add them", false);
                    },
                    disableMethod: () => {
                        adminLeaderboardMultiOrbitEnabled = false;
                        sendNotification("Orbit Gun OFF — players released", false);
                    },
                    isTogglable: true,
                    method: () => {
                        if (!rightGrab) return;
                        var gunData = renderGun();
                        if (!rightTrigger || time <= adminLeaderboardOrbitGunDelay) return;
                        adminLeaderboardOrbitGunDelay = time + 0.35;
                        try {
                            var target = resolveGunTargetPlayer(gunData, 12.0);
                            if (!target || target.isNull?.()) { sendNotification("No player there", false); return; }
                            if (playerIsLocal(target)) return;
                            var handle = normalizeSceneObjectHandle(target);
                            var alreadyIn = adminLeaderboardMultiOrbitList.some(p => normalizeSceneObjectHandle(p) === handle);
                            if (alreadyIn) {
                                adminLeaderboardMultiOrbitList = adminLeaderboardMultiOrbitList.filter(p => normalizeSceneObjectHandle(p) !== handle);
                                sendNotification("Removed " + getPlayerName(target) + " from orbit (" + adminLeaderboardMultiOrbitList.length + " total)", false);
                            } else {
                                adminLeaderboardMultiOrbitList.push(target);
                                sendNotification("Added " + getPlayerName(target) + " to orbit (" + adminLeaderboardMultiOrbitList.length + " total)", false);
                            }
                        } catch(e) { console.error("Orbit Gun:", e); }
                    },
                    toolTip: "Aim at any player and pull trigger to add/remove them from the orbit ring. Unlimited players."
                }),
                new ButtonInfo({
                    buttonText: "Add Selected Orbit",
                    method: () => {
                        var p = getSelectedAdminLeaderboardPlayer();
                        if (!p) { sendNotification("No selected player", false); return; }
                        var handle = normalizeSceneObjectHandle(p);
                        var alreadyIn = adminLeaderboardMultiOrbitList.some(q => normalizeSceneObjectHandle(q) === handle);
                        if (alreadyIn) {
                            adminLeaderboardMultiOrbitList = adminLeaderboardMultiOrbitList.filter(q => normalizeSceneObjectHandle(q) !== handle);
                            sendNotification("Removed " + getAdminLeaderboardPlayerLabel(p) + " from orbit (" + adminLeaderboardMultiOrbitList.length + " total)", false);
                        } else {
                            adminLeaderboardMultiOrbitList.push(p);
                            if (!adminLeaderboardMultiOrbitEnabled) adminLeaderboardMultiOrbitEnabled = true;
                            sendNotification("Added " + getAdminLeaderboardPlayerLabel(p) + " to orbit (" + adminLeaderboardMultiOrbitList.length + " total)", false);
                        }
                    },
                    isTogglable: false,
                    toolTip: "Adds or removes the currently selected player from the multi-orbit ring."
                }),
                new ButtonInfo({
                    buttonText: "Clear Orbit List",
                    method: () => {
                        var count = adminLeaderboardMultiOrbitList.length;
                        adminLeaderboardMultiOrbitList = [];
                        adminLeaderboardMultiOrbitEnabled = false;
                        sendNotification("Cleared " + count + " players from orbit", false);
                    },
                    isTogglable: false,
                    toolTip: "Removes all players from the orbit list and stops the orbit."
                }),
                new ButtonInfo({
                    buttonText: "Add Whitelist",
                    method: () => {
                        var p = getSelectedAdminLeaderboardPlayer();
                        if (!p) { sendNotification("No selected player", false); return; }
                        try {
                            whitelistAddPlayer(p);
                            var label = getAdminLeaderboardPlayerLabel(p);
                            sendNotification("Whitelisted " + label, false);
                        } catch(e) { sendNotification("Whitelist: " + e, false); }
                    },
                    isTogglable: false,
                    toolTip: "Adds the selected player to the whitelist."
                }),
                new ButtonInfo({
                    buttonText: "Arena Aimbot",
                    enableMethod: () => { arenaAimbotEnabled = true; sendNotification("Arena Aimbot ON", false); },
                    disableMethod: () => { arenaAimbotEnabled = false; sendNotification("Arena Aimbot OFF", false); },
                    isTogglable: true,
                    enabled: arenaAimbotEnabled,
                    toolTip: "When you shoot in arena, targets an enemy player and skips your own team."
                })
            ];
            var makeAdminLeaderboardButtons = () => {
                var players = getAllNetPlayersList(false);
                return [
                    new ButtonInfo({
                        buttonText: "Exit LeaderBoard",
                        method: () => {
                            clearAdminLeaderboardSelection(true);
                            currentCategory = 0;
                            currentPage = 0;
                        },
                        isTogglable: false,
                        toolTip: "Returns to the main category."
                    }),
                    new ButtonInfo({
                        buttonText: "Refresh LeaderBoard",
                        method: () => {
                            buttons[27] = makeAdminLeaderboardButtons();
                            currentCategory = 27;
                            currentPage = 0;
                            try { rebuildButtonMap(); } catch(_) {}
                            sendNotification("Admin LeaderBoard refreshed", false);
                        },
                        isTogglable: false,
                        toolTip: "Refreshes the current server player list."
                    }),
                    ...players.map((p, idx) => {
                        var label = getAdminLeaderboardPlayerLabel(p, idx);
                        return new ButtonInfo({
                            buttonText: label + " [" + (idx + 1) + "]",
                            method: () => {
                                adminLeaderboardSelectedPlayer = p;
                                adminLeaderboardSelectedName = label;
                                buttons[28] = makeAdminLeaderboardActionButtons();
                                currentCategory = 28;
                                currentPage = 0;
                                try { rebuildButtonMap(); } catch(_) {}
                                if (adminLeaderboardEspEnabled) updatePlayerEspOverlays();
                                else if (!arenaEspEnabled) destroyOverlayEntries(playerEspEntries);
                                sendNotification("Selected " + label, false);
                            },
                            isTogglable: false,
                            toolTip: "Opens actions for " + label + "."
                        });
                    })
                ];
            };
            buttons[27] = makeAdminLeaderboardButtons();
            buttons[28] = makeAdminLeaderboardActionButtons();
            refreshSearchMenu();
            insertButtonAfter(mainButtons, new ButtonInfo({
                buttonText: "Search Mods",
                method: () => {
                    refreshSearchMenu();
                    currentCategory = 29;
                    currentPage = 0;
                },
                isTogglable: false,
                toolTip: "Searches every mod button by name."
            }), "Settings");
            insertButtonAfter(mainButtons, new ButtonInfo({
                buttonText: "Admin LeaderBoard",
                method: () => {
                    buttons[27] = makeAdminLeaderboardButtons();
                    currentCategory = 27;
                    currentPage = 0;
                    try { rebuildButtonMap(); } catch(_) {}
                },
                isTogglable: false,
                toolTip: "Opens the current server player list."
            }), "Admin Spawner");
            insertButtonAfter(buttons[2] ?? [], makeCategoryButton("ID Settings", 22, "Opens direct item, mob, and VFX ID pickers."), "Exit Mods Settings");
            var mainOrder = [
                "Settings", "Search Mods", "Name",
                "Movement mods", "Player mods", "Item mods",
                "Spawning", "Text Spawn", "Gun mods", "Admin Spawner", "Admin LeaderBoard",
                "Stuff", "RPC Stuff", "Test",
                "Whitelist mods", "Monster RPCs", "Credits", "Over Powered"
            ];
            mainButtons.sort((a, b) => {
                var ai = mainOrder.indexOf(a.buttonText);
                var bi = mainOrder.indexOf(b.buttonText);
                return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
            });
            var miscButtons = buttons[9] ?? [];
            renameButton(miscButtons, "Exit Misc", "Exit Over Powered");
            var themeButtons = buttons[12] ?? [];
            removeButton(themeButtons, "Prefab Orbit -> Misc");
            var wlButtons = buttons[5] ?? [];
            var extraWlButtons = buttons[16] ?? [];
            if (wlButtons.length > 0 && extraWlButtons.length > 1 && !wlButtons.some(btn => btn.buttonText === "WL All Speed Loop")) {
                wlButtons.push(...extraWlButtons.slice(1));
            }
            if (extraWlButtons.length > 0) {
                extraWlButtons.splice(0, extraWlButtons.length, new ButtonInfo({
                    buttonText: "Exit WL",
                    method: () => { currentCategory = 5; currentPage = 0; },
                    isTogglable: false,
                    toolTip: "Returns to the main whitelist page."
                }));
            }
        } catch(_) {}
        menuStructurePatched = true;
        try { rebuildButtonMap(); } catch(_) {}
    }
    function dumpMenuToTextFile() | null {
        var dumpPath = "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Animal Company\\DabeansSkiddedMenuDump.txt";
        try {
            applyMenuStructurePatches();
            var lines[] = [];
            lines.push("Monkongs Cool Menu Dumps");
            lines.push("version=" + version);
            lines.push("themeMode=" + themeMode);
            lines.push("time=" + time);
            lines.push("");
            lines.push("Categories:");
            for (var i = 0; i < buttons.length; i++) {
                var page = buttons[i] ?? [];
                lines.push("[" + i + "] count=" + page.length);
                for (var j = 0; j < page.length; j++) {
                    var btn = page[j];
                    lines.push("  (" + j + ") " + btn.buttonText + " | togglable=" + (!!btn.isTogglable) + " | enabled=" + (!!btn.enabled));
                }
            }
            lines.push("");
            lines.push("Item IDs (" + itemIDs.length + "):");
            for (var id of itemIDs) lines.push("  " + id);
            lines.push("");
            lines.push("Prefab IDs (" + prefabIDs.length + "):");
            for (var id of prefabIDs) lines.push("  " + id);
            lines.push("");
            lines.push("Mob IDs (" + mobIDs.length + "):");
            for (var mob of mobIDs) lines.push("  " + mob.name + " | id=" + mob.id);
            lines.push("");
            lines.push("VFX IDs (" + vfxTypeEntries.length + "):");
            for (var [name, value] of vfxTypeEntries) lines.push("  " + name + " = " + value);
            lines.push("");
            lines.push("Assemblies / Classes / Methods:");
            try {
                var assemblies = (Il2Cpp.domain.assemblies ?? []) [];
                for (var asm of assemblies) {
                    try {
                        var img = asm.image;
                        var imgName = String(img?.name ?? asm?.name ?? "?");
                        lines.push("[Assembly] " + imgName);
                        for (var klass of ((img?.classes ?? []) [])) {
                            try {
                                var className = String(klass?.type?.name ?? klass?.name ?? "?");
                                lines.push("  [Class] " + className);
                                for (var method of ((klass?.methods ?? []) [])) {
                                    try {
                                        var paramCount = Number(method?.parameterCount ?? method?.parameters?.length ?? 0);
                                        lines.push("    - " + String(method?.name ?? "?") + "(" + paramCount + ")");
                                    } catch(_) {}
                                }
                            } catch(_) {}
                        }
                    } catch(_) {}
                }
            } catch(_) {}
            var file = new File(dumpPath, "w");
            for (var line of lines) file.write(line + "\n");
            file.flush();
            file.close();
            console.log("[DumpMenuTXT] wrote", dumpPath);
            return dumpPath;
        } catch(e) {
            console.error("[DumpMenuTXT]", e);
            return null;
        }
    }
    function forceGrantAllStashSlots() {
        var tryPatchObject = (obj) => {
            try {
                if (!obj || obj.isNull?.()) return;
                for (var fieldName of ["_unlockedStashSlots", "unlockedStashSlots", "_stashSlots", "stashSlots", "_maxStashSlots", "maxStashSlots", "_stashSlotCount", "stashSlotCount", "_stashRowsUnlocked", "stashRowsUnlocked", "_stashColsUnlocked", "stashColsUnlocked"]) {
                    try { obj.field(fieldName).value = 999; } catch(_) {}
                }
                tryCallNames(obj, ["UnlockAllStashSlots", "GrantAllStashSlots", "RefreshStashSlots", "SetUnlockedStashSlots", "SetStashSlots"], 0);
                tryCallNames(obj, ["SetUnlockedStashSlots", "SetStashSlots", "GrantStashSlots"], 1, 999);
                tryCallNames(obj, ["set_stashRowsUnlocked", "set_stashColsUnlocked"], 1, 99);
            } catch(_) {}
        };
        try {
            var AppClass = AssemblyCSharp.class("AnimalCompany.App");
            var appState = AppClass.method("get_state").invoke();
            if (appState && !appState.isNull?.()) {
                tryPatchObject(appState);
                try { tryPatchObject(appState.method("get_user").invoke()); } catch(_) {}
                try { tryPatchObject(appState.method("get_mapMachine").invoke()); } catch(_) {}
                try { tryPatchObject(appState.method("get_stash").invoke()); } catch(_) {}
            }
        } catch(_) {}
        try {
            var UserStashStateClass = AssemblyCSharp.class("AnimalCompany.UserStashState");
            var stashObjects = Object.method("FindObjectsByType", 1).inflate(UserStashStateClass).invoke(0);
            if (stashObjects && !stashObjects.isNull?.()) {
                for (var i = 0; i < stashObjects.length; i++) {
                    try { tryPatchObject(stashObjects.get(i)); } catch(_) {}
                }
            }
        } catch(_) {}
        try {
            var StashViewClass = AssemblyCSharp.class("AnimalCompany.StashMachine.StashMachineStashTabUIView");
            var stashViews = Object.method("FindObjectsByType", 1).inflate(StashViewClass).invoke(0);
            if (stashViews && !stashViews.isNull?.()) {
                for (var i = 0; i < stashViews.length; i++) {
                    try {
                        var view = stashViews.get(i);
                        tryPatchObject(view);
                        tryCallNames(view, ["InitializeCommand", "Refresh", "RefreshSlots", "UpdateSlots", "Reload"], 0);
                    } catch(_) {}
                }
            }
        } catch(_) {}
        try { tryPatchObject(NetPlayer.method("get_localPlayer").invoke()); } catch(_) {}
    }
    function applyContainerFreedomSweep() {
        if (time <= containerFreedomSweepDelay) return;
        containerFreedomSweepDelay = time + 0.45;
        try {
            for (var item of getAllLobbyItemGameObjects()) {
                try {
                    var gbi = item.method("GetComponent", 1).inflate(GBIClass).invoke();
                    if (!gbi || gbi.isNull?.()) continue;
                    try { gbi.method("set_allowAddToBag").invoke(true); } catch(_) {}
                    try { gbi.field("_allowAddToBag").value = true; } catch(_) {}
                    try {
                        var itemData = gbi.method("get_itemData").invoke();
                        if (itemData && !itemData.isNull?.()) {
                            var flagsSP = itemData.method("get_flags").invoke();
                            if (flagsSP && !flagsSP.isNull?.()) {
                                try { flagsSP.method("set_value").invoke(8190); } catch(_) {}
                                try { flagsSP.field("_value").value = 8190; } catch(_) {}
                            }
                        }
                    } catch(_) {}
                } catch(_) {}
            }
        } catch(_) {}
    }
    var _selfRPCBypass = false;
    function selfRPC(fn) {
        _selfRPCBypass = true;
        try { fn(); } finally { _selfRPCBypass = false; }
    }
    var buttons[] = [
        [ 
            new ButtonInfo({
                buttonText: "Settings",
                method: () => { currentCategory = 21; currentPage = 0; },
                isTogglable: false,
                toolTip: "Opens settings."
            }),
            new ButtonInfo({
                buttonText: "Movement mods",
                method: () => { currentCategory = 3; currentPage = 0; },
                isTogglable: false,
                toolTip: "Opens the player mods category."
            }),
            new ButtonInfo({
                buttonText: "Player mods",
                method: () => { currentCategory = 4; currentPage = 0; },
                isTogglable: false,
                toolTip: "Opens the movement mods category."
            }),
            new ButtonInfo({
                buttonText: "Whitelist mods",
                method: () => { currentCategory = 10; currentPage = 0; },
                isTogglable: false,
                toolTip: "Opens the whitelist player mods category."
            }),
            new ButtonInfo({
                buttonText: "Item mods",
                method: () => { currentCategory = 6; currentPage = 0; },
                isTogglable: false,
                toolTip: "Opens the item mods category."
            }),
            new ButtonInfo({
                buttonText: "Spawning",
                method: () => { currentCategory = 7; currentPage = 0; },
                isTogglable: false,
                toolTip: "Opens the Spawning category."
            }),
            new ButtonInfo({
                buttonText: "Gun mods",
                method: () => { currentCategory = 8; currentPage = 0; },
                isTogglable: false,
                toolTip: "Opens the gun mods category."
            }),
            new ButtonInfo({
                buttonText: "Over Powered",
                method: () => { currentCategory = 9; currentPage = 0; },
                isTogglable: false,
                toolTip: "Opens the over powered category."
            }),
            new ButtonInfo({
                buttonText: "Stuff",
                method: () => { currentCategory = 11; currentPage = 0; },
                isTogglable: false,
                toolTip: "Opens the Stuff category."
            }),
            new ButtonInfo({
                buttonText: "Unity Explorer",
                method: () => { currentCategory = 17; currentPage = 0; },
                isTogglable: false,
                toolTip: "Open Unity Explorer â€“ select objects and inspect/modify their properties."
            }),
            new ButtonInfo({
                buttonText: "RPC Stuff",
                method: () => { currentCategory = 13; currentPage = 0; },
                isTogglable: false,
                toolTip: "Opens the RPC Stuff category."
            }),
            new ButtonInfo({
                buttonText: "Credits",
                method: () => { currentCategory = 14; currentPage = 0; },
                isTogglable: false,
                toolTip: "Opens the Credits category."
            }),
            new ButtonInfo({
                buttonText: "Monster RPCs",
                method: () => { currentCategory = 15; currentPage = 0; },
                isTogglable: false,
                toolTip: "Opens the Monster RPCs category."
            }),
            new ButtonInfo({
                buttonText: "Extra WL",
                method: () => { currentCategory = 16; currentPage = 0; },
                isTogglable: false,
                toolTip: "Opens extra whitelist features."
            }),
            new ButtonInfo({
                buttonText: "GabeMaster",
                method: () => {
                    var netplayer = NetPlayer.method("get_localPlayer").invoke();
                    netplayer.method("set_displayName").invoke(Il2Cpp.string("GabeMaster"));
                },
                isTogglable: true,
                toolTip: "Monkongs Menu"
            }),
            new ButtonInfo({
                buttonText: "Monkong ",
                method: () => {
                    var netplayer = NetPlayer.method("get_localPlayer").invoke();
                    netplayer.method("set_displayName").invoke(Il2Cpp.string("Monkong"));
                },
                isTogglable: true,
                toolTip: "Made By MonkongFrFr"
            }),
            new ButtonInfo({
                buttonText: "Unknown",
                method: () => {
                    var netplayer = NetPlayer.method("get_localPlayer").invoke();
                    netplayer.method("set_displayName").invoke(Il2Cpp.string("Unknown"));
                },
                isTogglable: true,
                toolTip: "Moony2HP"
            }),
            new ButtonInfo({
                buttonText: "Onimai",
                method: () => {
                    var netplayer = NetPlayer.method("get_localPlayer").invoke();
                    netplayer.method("set_displayName").invoke(Il2Cpp.string("ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. ONIMAI IS PEAK. "));
                },
                isTogglable: true,
                toolTip: "Monkongs Menu"
            }),
        ],
        [ 
            new ButtonInfo({
                buttonText: "Disconnect",
                method: () => {
                    try {
                        var NManagerInst = NManager.method("get_instance").invoke();
                        if (!NManagerInst || NManagerInst.isNull()) return;
                        NManagerInst.method("TryShutdownAndCancelConnecting").invoke();
                    } catch(e) { console.error("[Disconnect]", e); }
                },
                isTogglable: false,
                toolTip: "Disconnects you from the room cleanly."
            }),
            new ButtonInfo({
                buttonText: "PreviousPage",
                method: () => {
                    var lastPage = Math.ceil(buttons[currentCategory].length / 8) - 1;
                    currentPage--;
                    if (currentPage < 0) currentPage = lastPage;
                },
                isTogglable: false
            }),
            new ButtonInfo({
                buttonText: "NextPage",
                method: () => {
                    var lastPage = Math.ceil(buttons[currentCategory].length / 8) - 1;
                    currentPage++;
                    currentPage %= lastPage + 1;
                },
                isTogglable: false
            }),
            new ButtonInfo({
                buttonText: "GlobalReturn",
                method: () => { currentCategory = 0; currentPage = 0; },
                isTogglable: false,
                toolTip: "Returns you back to the main category."
            }),
        ],
        [ 
            new ButtonInfo({
                buttonText: "Exit Mods Settings",
                method: () => { currentCategory = 21; currentPage = 0; },
                isTogglable: false,
                toolTip: "Returns to the Settings tab."
            }),
            new ButtonInfo({
                buttonText: "Change Item ID",
                method: () => {
                    if(rightGrab){
                       itemIndex--;
                    }
                    else{
                        itemIndex++;
                    }
                    itemIndex = ((itemIndex % itemIDs.length) + itemIDs.length) % itemIDs.length;
                    console.log(itemIDs[itemIndex]);
                    sendNotification("<color=grey>[</color><color=#8000ff>MENU</color><color=grey>]</color> " + "New item index: " + itemIDs[itemIndex], false);
                },
                isTogglable: false,
                toolTip: "Changes the item ID. Hold right grip to go down"
            }),
            new ButtonInfo({
                buttonText: "Change VFX ID",
                method: () => {
                    if (rightGrab) selectedVfxIndex--;
                    else selectedVfxIndex++;
                    selectedVfxIndex = ((selectedVfxIndex % vfxTypeEntries.length) + vfxTypeEntries.length) % vfxTypeEntries.length;
                    var [vfxName, vfxId] = getSelectedVfxEntry();
                    sendNotification("<color=grey>[</color><color=#8000ff>MENU</color><color=grey>]</color> VFX: " + vfxName + " (" + vfxId + ")", false);
                },
                isTogglable: false,
                toolTip: "Changes the selected VFX. Hold right grip to go down."
            }),
            new ButtonInfo({
                buttonText: "Log VFX IDs",
                method: () => {
                    try {
                        console.log("[VFX] Available VFX IDs:");
                        for (var [name, value] of vfxTypeEntries) {
                            console.log("[VFX] " + name + " = " + value);
                        }
                        sendNotification("Logged " + vfxTypeEntries.length + " VFX IDs to console", false, 6);
                    } catch(e) { console.error("[VFX] Log failed:", e); }
                },
                isTogglable: false,
                toolTip: "Logs the full list of selectable VFX names and ids to the console."
            }),
            new ButtonInfo({
                buttonText: "Change Mob ID",
                method: () => {
                    if (rightGrab) {
                        mobIndex--;
                    } else {
                        mobIndex++;
                    }
                    mobIndex = ((mobIndex % mobIDs.length) + mobIDs.length) % mobIDs.length;
                    sendNotification("<color=grey>[</color><color=#8000ff>MENU</color><color=grey>]</color> Mob: " + mobIDs[mobIndex].name + " (id=" + mobIDs[mobIndex].id + ")", false);
                },
                isTogglable: false,
                toolTip: "Changes the mob to spawn. Hold right grip to go back."
            }),
            new ButtonInfo({
                buttonText: "Change Prefab ID",
                method: () => {
                    if (rightGrab) {
                        prefabIndex--;
                    } else {
                        prefabIndex++;
                    }
                    prefabIndex = ((prefabIndex % prefabIDs.length) + prefabIDs.length) % prefabIDs.length;
                    sendNotification("<color=grey>[</color><color=#8000ff>MENU</color><color=grey>]</color> Prefab: " + prefabIDs[prefabIndex], false);
                },
                isTogglable: false,
                toolTip: "Changes the prefab to spawn. Hold right grip to go back."
            }),
            new ButtonInfo({
                buttonText: "Log App ID",
                method: () => {
                    try {
                        var mobileAppID = OculusPlatformSettings.method("get_MobileAppID").invoke();
                        console.log("[AppID] Mobile App ID: " + mobileAppID);
                        sendNotification("<color=grey>[</color><color=#8000ff>MENU</color><color=grey>]</color> App ID: " + mobileAppID, false, 10);
                    } catch (e) {
                        console.error("[AppID] Failed to get App ID: " + e);
                    }
                },
                isTogglable: false,
                toolTip: "Logs the Meta/Oculus App ID to the console."
            }),
            new ButtonInfo({
                buttonText: "Round Bounds",
                enableMethod: () => { roundCornersEnabled = true; sendNotification("Round Bounds: disabled on this build", false); reloadMenu(); },
                disableMethod: () => { roundCornersEnabled = false; sendNotification("Round Bounds", false); reloadMenu(); },
                isTogglable: true,
                toolTip: "Reserved setting. Disabled so it does not break the menu look."
            }),
            new ButtonInfo({
                buttonText: "Outline Toggle",
                enableMethod: () => { menuOutlineEnabled = true; sendNotification("Outline: disabled on this build", false); reloadMenu(); },
                disableMethod: () => { menuOutlineEnabled = false; sendNotification("Outline", false); reloadMenu(); },
                isTogglable: true,
                toolTip: "Reserved setting. Disabled so it does not break the menu look."
            }),
        ],
        [
            new ButtonInfo({
                buttonText: "Exit Movement mods",
                method: () => { currentCategory = 0; currentPage = 0; },
                isTogglable: false,
                toolTip: "Returns you back to the main category."
            }),
            new ButtonInfo({
        buttonText: "Fly",
        method: () => {
            var rightFist = rightGrab && rightTrigger;
            var leftFist  = leftGrab  && leftTrigger;
            if (!rightFist && !leftFist) {
                smoothVec3(fistFlyVelocity, [0, 0, 0], 0.2);
                return;
            }
            try {
                var player = NetPlayer.method("get_localPlayer").invoke();
                if (!player || player.handle.isNull()) return;
                var desired: [number, number, number] = [0, 0, 0];
                if (rightFist) {
                    var rightForward = readVec3Components(rightHandTransform.method("get_forward").invoke());
                    desired[0] += rightForward[0];
                    desired[1] += rightForward[1];
                    desired[2] += rightForward[2];
                }
                if (leftFist) {
                    var leftForward = readVec3Components(leftHandTransform.method("get_forward").invoke());
                    desired[0] += leftForward[0];
                    desired[1] += leftForward[1];
                    desired[2] += leftForward[2];
                }
                var desiredMag = Math.sqrt((desired[0] * desired[0]) + (desired[1] * desired[1]) + (desired[2] * desired[2]));
                if (desiredMag < 0.01) return;
                var speed = 0.32;
                desired = [
                    (desired[0] / desiredMag) * speed,
                    (desired[1] / desiredMag) * speed,
                    (desired[2] / desiredMag) * speed
                ];
                var smoothed = smoothVec3(fistFlyVelocity, desired, 0.16);
                selfRPC(() => player.method("RPC_AddForce").invoke(smoothed));
            } catch(e) { console.error("Fly:", e); }
        },
        isTogglable: true,
        toolTip: "Make a fist to fly where you point with slower smoother force."
      }),
      new ButtonInfo({
        buttonText: "Fast Fly",
        method: () => {
            var rightFist = rightGrab && rightTrigger;
            var leftFist  = leftGrab  && leftTrigger;
            if (!rightFist && !leftFist) {
                smoothVec3(fistFlyVelocity, [0, 0, 0], 4);
                return;
            }
            try {
                var player = NetPlayer.method("get_localPlayer").invoke();
                if (!player || player.handle.isNull()) return;
                var desired: [number, number, number] = [0, 0, 0];
                if (rightFist) {
                    var rightForward = readVec3Components(rightHandTransform.method("get_forward").invoke());
                    desired[0] += rightForward[0];
                    desired[1] += rightForward[1];
                    desired[2] += rightForward[2];
                }
                if (leftFist) {
                    var leftForward = readVec3Components(leftHandTransform.method("get_forward").invoke());
                    desired[0] += leftForward[0];
                    desired[1] += leftForward[1];
                    desired[2] += leftForward[2];
                }
                var desiredMag = Math.sqrt((desired[0] * desired[0]) + (desired[1] * desired[1]) + (desired[2] * desired[2]));
                if (desiredMag < 0.01) return;
                var speed = 0.32;
                desired = [
                    (desired[0] / desiredMag) * speed,
                    (desired[1] / desiredMag) * speed,
                    (desired[2] / desiredMag) * speed
                ];
                var smoothed = smoothVec3(fistFlyVelocity, desired, 0.16);
                selfRPC(() => player.method("RPC_AddForce").invoke(smoothed));
            } catch(e) { console.error("Fly:", e); }
        },
        isTogglable: true,
        toolTip: "Make a fist to fly where you point with slower smoother force."
      }),
      new ButtonInfo({
        buttonText: "Super Fast Fly",
        method: () => {
            var rightFist = rightGrab && rightTrigger;
            var leftFist  = leftGrab  && leftTrigger;
            if (!rightFist && !leftFist) {
                smoothVec3(fistFlyVelocity, [0, 0, 0], 20);
                return;
            }
            try {
                var player = NetPlayer.method("get_localPlayer").invoke();
                if (!player || player.handle.isNull()) return;
                var desired: [number, number, number] = [0, 0, 0];
                if (rightFist) {
                    var rightForward = readVec3Components(rightHandTransform.method("get_forward").invoke());
                    desired[0] += rightForward[0];
                    desired[1] += rightForward[1];
                    desired[2] += rightForward[2];
                }
                if (leftFist) {
                    var leftForward = readVec3Components(leftHandTransform.method("get_forward").invoke());
                    desired[0] += leftForward[0];
                    desired[1] += leftForward[1];
                    desired[2] += leftForward[2];
                }
                var desiredMag = Math.sqrt((desired[0] * desired[0]) + (desired[1] * desired[1]) + (desired[2] * desired[2]));
                if (desiredMag < 0.01) return;
                var speed = 0.32;
                desired = [
                    (desired[0] / desiredMag) * speed,
                    (desired[1] / desiredMag) * speed,
                    (desired[2] / desiredMag) * speed
                ];
                var smoothed = smoothVec3(fistFlyVelocity, desired, 0.16);
                selfRPC(() => player.method("RPC_AddForce").invoke(smoothed));
            } catch(e) { console.error("Fly:", e); }
        },
        isTogglable: true,
        toolTip: "Make a fist to fly where you point with slower smoother force."
      }),
            new ButtonInfo({
                buttonText: "Joystick Fly",
                method: () => {
                    var rb = GTPlayer.method("GetComponent", 1).inflate(Rigidbody).invoke();
                    if (!rb) return;
                    rb.method("set_useGravity").invoke(false);
                    try { rb.method("set_linearVelocity").invoke(zeroVector); } catch (_) { }
                    try { rb.method("set_angularVelocity").invoke(zeroVector); } catch (_) { }
                    var desiredVelocity = Vector3.method("get_zero").invoke();
                    if (rightTrigger) {
                        var handForward = rightHandTransform.method("get_forward").invoke();
                        var vel = Vector3.method("op_Multiply", 2).invoke(handForward, flySpeed * 0.75);
                        desiredVelocity = Vector3.method("op_Addition", 2).invoke(desiredVelocity, vel);
                    }
                    if (leftTrigger) {
                        var handForward = leftHandTransform.method("get_forward").invoke();
                        var vel = Vector3.method("op_Multiply", 2).invoke(handForward, flySpeed * 0.75);
                        desiredVelocity = Vector3.method("op_Addition", 2).invoke(desiredVelocity, vel);
                    }
                    var currentVel = rb.method("get_linearVelocity").invoke();
                    var newVel = Vector3.method("Lerp", 3).invoke(currentVel, desiredVelocity, 0.2);
                    try { 
                        rb.method("set_linearVelocity").invoke(newVel); 
                    } catch (_) { 
                        rb.method("set_velocity").invoke(newVel); 
                    }
                },
                isTogglable: true,
                toolTip: "Hold either trigger to fly forward where your hand points (no grav so ye)"
            }),
            new ButtonInfo({
                buttonText: "Platforms",
                enableMethod: () => {
                    Destroy(movementPlatformLeft);
                    Destroy(movementPlatformRight);
                    movementPlatformLeft = null;
                    movementPlatformRight = null;
                    sendNotification("Platforms ON", false);
                },
                disableMethod: () => {
                    Destroy(movementPlatformLeft);
                    Destroy(movementPlatformRight);
                    movementPlatformLeft = null;
                    movementPlatformRight = null;
                    sendNotification("Platforms OFF", false);
                },
                isTogglable: true,
                method: () => {
                    try {
                        var updateHandPlatform = (handTransform, isHeld, wasHeld, side: "left" | "right") => {
                            var current = side === "left" ? movementPlatformLeft : movementPlatformRight;
                            if (!isHeld) {
                                Destroy(current);
                                if (side === "left") movementPlatformLeft = null;
                                else movementPlatformRight = null;
                                return;
                            }
                            if (!wasHeld) {
                                var handPos = handTransform.method("get_position").invoke();
                                var downPos = [
                                    (handPos.field("x").value ),
                                    (handPos.field("y").value ) - 0.18,
                                    (handPos.field("z").value )
                                ];
                                var created = createSolidPlatform(downPos, [0.24, 0.025, 0.24], [0.95, 0.40, 0.03, 0.92]);
                                if (side === "left") movementPlatformLeft = created;
                                else movementPlatformRight = created;
                            }
                        };
                        updateHandPlatform(leftHandTransform, leftGrab, prevLeftGrab, "left");
                        updateHandPlatform(rightHandTransform, rightGrab, prevRightGrab, "right");
                    } catch(e) { console.error("Platforms:", e); }
                },
                toolTip: "Hold either grip to keep a solid platform directly under that hand."
            }),
            new ButtonInfo({
        buttonText: "Long Arms",
        method: () => {
          getTransform(GTPlayer).method("set_localScale").invoke([1.25, 1.25, 1.25]);
        },
        disableMethod: () => {
          getTransform(GTPlayer).method("set_localScale").invoke(oneVector);
        },
        toolTip: "Gives you longer arms."
      }),
            new ButtonInfo({
        buttonText: "Longer Arms",
        method: () => {
          getTransform(GTPlayer).method("set_localScale").invoke([1.75, 1.75, 1.75]);
        },
        disableMethod: () => {
          getTransform(GTPlayer).method("set_localScale").invoke(oneVector);
        },
        toolTip: "Gives you longer arms."
      }),
                  new ButtonInfo({
        buttonText: "Longerer Arms",
        method: () => {
          getTransform(GTPlayer).method("set_localScale").invoke([2, 2, 2]);
        },
        disableMethod: () => {
          getTransform(GTPlayer).method("set_localScale").invoke(oneVector);
        },
        toolTip: "Gives you longer arms."
      }),
                  new ButtonInfo({
        buttonText: "Longererer Arms",
        method: () => {
          getTransform(GTPlayer).method("set_localScale").invoke([3, 3, 3]);
        },
        disableMethod: () => {
          getTransform(GTPlayer).method("set_localScale").invoke(oneVector);
        },
        toolTip: "Gives you longer arms."
      }),
        ],
        [
            new ButtonInfo({
                buttonText: "Exit Player mods",
                method: () => { currentCategory = 0; currentPage = 0; },
                isTogglable: false,
                toolTip: "Returns you back to the main category."
            }),
      new ButtonInfo({
        buttonText: "Invisible Toggleable",
        enableMethod: () => {
          var player = PCClass.method("get_instance").invoke();
          var RIGTESTBETA = player.method("get_playerView").invoke();
          if (!RIGTESTBETA) return null;
          var bodyRootTF = RIGTESTBETA.field("_cameraTransform").value;
          if (!bodyRootTF) return null;
          bodyRootTF.method("set_position").invoke([0, -99999, 0]);
        },
        disableMethod: () => {
          var player = PCClass.method("get_instance").invoke();
          var RIGTESTBETA = player.method("get_playerView").invoke();
          if (!RIGTESTBETA) return null;
          var bodyRootTF = RIGTESTBETA.field("_cameraTransform").value;
          if (!bodyRootTF) return null;
          bodyRootTF.method("set_position").invoke(getTransform(headCollider).method("get_position").invoke());
        },
        isTogglable: true,
        toolTip: "Turns you invisible."
      }),
                  new ButtonInfo({
    buttonText: "Invincible",
    enableMethod: () => {
        var localPlayer = NetPlayer.method("get_localPlayer").invoke();
        localPlayer.method("set_isInvincible").invoke(true);
    },
    disableMethod: () => {
        var localPlayer = NetPlayer.method("get_localPlayer").invoke();
        localPlayer.method("set_isInvincible").invoke(false);
    },
    isTogglable: true,
    toolTip: "Makes you invincible"
}),
new ButtonInfo({
    buttonText: "Inf Health",
    enableMethod: () => { infHealthEnabled = true; sendNotification("Inf Health ON", false); },
    disableMethod: () => { infHealthEnabled = false; sendNotification("Inf Health OFF", false); },
    isTogglable: true,
    toolTip: "Hooks get_maxHealth to return 999999 for you only."
}),
new ButtonInfo({
    buttonText: "Blue Name Tags",
    enableMethod: () => { nameTagsEnabled = true; sendNotification("Blue Name Tags ON", false); },
    disableMethod: () => { nameTagsEnabled = false; destroyOverlayEntries(playerNameTagEntries); sendNotification("Blue Name Tags OFF", false); },
    isTogglable: true,
    method: () => { updatePlayerNameTags(); },
    toolTip: "Shows blue usernames above every player's head and keeps them facing you."
}),
new ButtonInfo({
    buttonText: "Arena ESP",
    enableMethod: () => { arenaEspEnabled = true; sendNotification("Arena ESP ON", false); },
    disableMethod: () => { arenaEspEnabled = false; destroyOverlayEntries(playerEspEntries); sendNotification("Arena ESP OFF", false); },
    isTogglable: true,
    method: () => { updatePlayerEspOverlays(); },
    toolTip: "Client-side through-wall player rays and 2D style boxes using always-on-top arena-style overlay materials."
}),
new ButtonInfo({
    buttonText: "Dual Revolver Punch Launch",
    isTogglable: true,
    method: () => {
        if (time <= dualRevolverPunchDelay) return;
        try {
            var me = NetPlayer.method("get_localPlayer").invoke();
            if (!me || me.isNull?.()) return;
            var myHead = getTransform(headCollider).method("get_position").invoke();
            var myBody = getTransform(bodyCollider).method("get_position").invoke();
            for (var p of getAllNetPlayersList(false)) {
                try {
                    var leftHeld = getPlayerHeldGrabbable(p, 0);
                    var rightHeld = getPlayerHeldGrabbable(p, 1);
                    if (!grabbableLooksLikeRevolver(leftHeld) || !grabbableLooksLikeRevolver(rightHeld)) continue;
                    var leftTf = getPlayerHandAnchorTransform(p, 0);
                    var rightTf = getPlayerHandAnchorTransform(p, 1);
                    var hitTf = null;
                    try {
                        if (leftTf && !leftTf.isNull?.()) {
                            var leftPos = leftTf.method("get_position").invoke();
                            if ((Vector3.method("Distance").invoke(myHead, leftPos) ) <= 0.52 || (Vector3.method("Distance").invoke(myBody, leftPos) ) <= 0.7) hitTf = leftTf;
                        }
                    } catch(_) {}
                    try {
                        if (!hitTf && rightTf && !rightTf.isNull?.()) {
                            var rightPos = rightTf.method("get_position").invoke();
                            if ((Vector3.method("Distance").invoke(myHead, rightPos) ) <= 0.52 || (Vector3.method("Distance").invoke(myBody, rightPos) ) <= 0.7) hitTf = rightTf;
                        }
                    } catch(_) {}
                    if (!hitTf) continue;
                    dualRevolverPunchDelay = time + 0.12;
                    var launchDir = getLaunchForward(hitTf, getTransform(headCollider));
                    var launchForce = Vector3.method("op_Addition").invoke(
                        Vector3.method("op_Multiply", 2).invoke(launchDir, 3.4),
                        [0, 1.05, 0]
                    );
                    selfRPC(() => me.method("RPC_AddForce").invoke(launchForce));
                    break;
                } catch(_) {}
            }
        } catch(e) { console.error("Dual Revolver Punch Launch:", e); }
    },
    toolTip: "Anyone holding revolvers in both hands can punch-launch you when they get close."
}),
new ButtonInfo({
    buttonText: "Jelly Self",
    enableMethod: () => { sendNotification("Jelly Self ON", false); },
    disableMethod: () => { sendNotification("Jelly Self OFF", false); },
    isTogglable: true,
    method: () => {
        try {
            var player = NetPlayer.method("get_localPlayer").invoke();
            if (!player || player.handle.isNull()) return;
            var go = player.method("get_gameObject").invoke();
            if (!go || go.isNull()) return;
            var renderers = go.method("GetComponentsInChildren", 1).inflate(Renderer).invoke(true);
            if (!renderers || renderers.isNull()) return;
            for (var i = 0; i < renderers.length; i++) {
                try {
                    var r = renderers.get(i);
                    if (!r || r.isNull()) continue;
                    var mats = r.method("get_materials").invoke();
                    if (!mats || mats.isNull()) continue;
                    for (var j = 0; j < mats.length; j++) {
                        try { mats.get(j).method("SetFloat").invoke(Il2Cpp.string("_JellyStrength"), 127.0); } catch(_) {}
                    }
                } catch(_) {}
            }
        } catch(e) { console.error("Jelly Self:", e); }
    },
    toolTip: "Applies jelly strength to your own body."
}),
        ],
        [
            new ButtonInfo({
                buttonText: "Exit Other Players",
                method: () => { currentCategory = 0; currentPage = 0; },
                isTogglable: false,
                toolTip: "Returns you back to the main category."
            }),
            new ButtonInfo({
                buttonText: "Whitelist mods",
                method: () => { currentCategory = 10; currentPage = 0; },
                isTogglable: false,
                toolTip: "Opens the test category."
            }),
        ],
        [
            new ButtonInfo({
                buttonText: "Exit Item mods",
                method: () => { currentCategory = 0; currentPage = 0; },
                isTogglable: false,
                toolTip: "Returns you back to the main category."
            }),
            new ButtonInfo({
                buttonText: "Add to Bag",
                method: () => {
                    try {
                        function randAB(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
                        function stuffContainer(container, count) {
                            var added = 0;
                            var spawnPos = container.method("get_transform").invoke().method("get_position").invoke();
                            for (var i = 0; i < count; i++) {
                                try {
                                    var itemID = itemIDs[randAB(0, itemIDs.length - 1)];
                                    var netObj = PrefabGen.method("SpawnItem", 4).invoke(
                                        Il2Cpp.string("item_prefab/" + itemID),
                                        spawnPos, identityQuaternion,
                                        NULL
                                    );
                                    if (!netObj || netObj.isNull()) continue;
                                    var netGO = netObj.method("get_gameObject").invoke();
                                    try {
                                        var gbo = netGO.method("GetComponent", 1).inflate(GBOClass).invoke();
                                        if (gbo && !gbo.isNull()) {
                                            gbo.method("set_scaleModifier").invoke(randAB(-128, 127));
                                            gbo.method("set_colorHue").invoke(randAB(-127, 127));
                                            gbo.method("set_colorSaturation").invoke(randAB(-20, 127));
                                        }
                                    } catch(_) {}
                                    var success = false;
                                    try {
                                        var gbi = netGO.method("GetComponent", 1).inflate(GBIClass).invoke();
                                        if (gbi && !gbi.isNull()) {
                                            gbi.method("AddToBag").invoke(container);
                                            success = true;
                                        }
                                    } catch(_) {}
                                    if (!success) {
                                        try {
                                            var gbi2 = netGO.method("GetComponent", 1).inflate(GBIClass).invoke();
                                            if (gbi2 && !gbi2.isNull()) {
                                                gbi2.method("AddToBagInternal").invoke(container);
                                            }
                                        } catch(_) {}
                                    }
                                    added++;
                                } catch(_) {}
                            }
                            return added;
                        }
                        var totalAdded = 0;
                        try {
                            var allBags = Object.method("FindObjectsByType", 1).inflate(BackpackItemClass).invoke(0);
                            if (allBags && !allBags.isNull()) {
                                for (var bi = 0; bi < allBags.length; bi++) {
                                    try {
                                        var bag = allBags.get(bi);
                                        if (!bag || bag.isNull()) continue;
                                        totalAdded += stuffContainer(bag, 23);
                                    } catch(_) {}
                                }
                            }
                        } catch(_) {}
                        try {
                            var allQuivers = Object.method("FindObjectsByType", 1).inflate(QuiverClass).invoke(0);
                            if (allQuivers && !allQuivers.isNull()) {
                                for (var qi = 0; qi < allQuivers.length; qi++) {
                                    try {
                                        var quiver = allQuivers.get(qi);
                                        if (!quiver || quiver.isNull()) continue;
                                        totalAdded += stuffContainer(quiver, 23);
                                    } catch(_) {}
                                }
                            }
                        } catch(_) {}
                        if (CrossbowClass) {
                            try {
                                var allCrossbows = Object.method("FindObjectsByType", 1).inflate(CrossbowClass).invoke(0);
                                if (allCrossbows && !allCrossbows.isNull()) {
                                    for (var ci = 0; ci < allCrossbows.length; ci++) {
                                        try {
                                            var cb = allCrossbows.get(ci);
                                            if (!cb || cb.isNull()) continue;
                                            totalAdded += stuffContainer(cb, 5);
                                        } catch(_) {}
                                    }
                                }
                            } catch(_) {}
                        }
                        try {
                            var allGBO = Object.method("FindObjectsByType", 1).inflate(GBOClass).invoke(0);
                            if (allGBO && !allGBO.isNull()) {
                                for (var gi = 0; gi < allGBO.length; gi++) {
                                    try {
                                        var obj = allGBO.get(gi);
                                        if (!obj || obj.isNull()) continue;
                                        var hasMethod = false;
                                        try { obj.method("AddToBagAck"); hasMethod = true; } catch(_) {}
                                        if (!hasMethod) continue;
                                        var isKnown = false;
                                        try { obj.method("GetComponent", 1).inflate(BackpackItemClass).invoke(); isKnown = true; } catch(_) {}
                                        try { obj.method("GetComponent", 1).inflate(QuiverClass).invoke(); isKnown = true; } catch(_) {}
                                        if (!isKnown) totalAdded += stuffContainer(obj, 5);
                                    } catch(_) {}
                                }
                            }
                        } catch(_) {}
                        sendNotification("Stuffed " + totalAdded + " items into all bags, quivers & containers!", false);
                    } catch(e) { sendNotification("Add to Bag: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Fills ALL bags and quivers in scene with random items (random color + size)."
            }),
    new ButtonInfo({
        buttonText: "Custom hue Held Item",
        method: () => {
          try {
            var grabbable = getLocalHeldGrabbable(true);
            if (!grabbable || grabbable.isNull?.()) return;
            if (rightGrab) {
              hueVal++;
              if (hueVal > 127) hueVal = -127;
            }
            if (leftGrab) {
              hueVal--;
              if (hueVal < -127) hueVal = 127;
            }
            grabbable.method("set_colorHue").invoke(hueVal);
          } catch (e) {
            console.error(e);
          }
        },
        isTogglable: true,
        toolTip: "Hold A to increase, grip to decrease scale of held item."
      }),
    new ButtonInfo({
        buttonText: "Custom saturation Held Item",
        method: () => {
          try {
            var grabbable = getLocalHeldGrabbable(true);
            if (!grabbable || grabbable.isNull?.()) return;
            if (rightGrab) {
              satVal++;
              if (satVal > 127) satVal = -127;
            }
            if (leftGrab) {
              satVal--;
              if (satVal < -127) satVal = 127;
            }
            grabbable.method("set_colorSaturation").invoke(satVal);
          } catch (e) {
            console.error(e);
          }
        },
        isTogglable: true,
        toolTip: "Hold A to increase, grip to decrease scale of held item."
      }),
                  new ButtonInfo({
        buttonText: "Custom Scale Held Item",
        method: () => {
          try {
            var grabbable = getLocalHeldGrabbable(true);
            if (!grabbable || grabbable.isNull?.()) return;
            if (rightGrab) {
              scaleVal++;
              if (scaleVal > 127) scaleVal = -127;
            }
            if (leftGrab) {
              scaleVal--;
              if (scaleVal < -127) scaleVal = 127;
            }
            grabbable.method("set_scaleModifier").invoke(scaleVal);
          } catch (e) {
            console.error(e);
          }
        },
        isTogglable: true,
        toolTip: "Hold A to increase, grip to decrease scale of held item."
      }),
            new ButtonInfo({
    buttonText: "Rainbow Held Item",
    method: () => {
        try {
            var player = NetPlayer.method("get_localPlayer").invoke();
            if (!player) return;
            var grabbable = getLocalHeldGrabbable(true);
            if (!grabbable || grabbable.isNull?.()) return;
            if (rightGrab) {
                hueVal++;
                satVal++;
                if (hueVal > 127) hueVal = -127;
                if (satVal > 127) satVal = -127;
            }
            if (leftGrab) {
                hueVal--;
                satVal--;
                if (hueVal < -127) hueVal = 127;
                if (satVal > 127) satVal = -127;
            }
            grabbable.method("set_colorHue").invoke(hueVal);
            grabbable.method("set_colorSaturation").invoke(satVal);
        } catch (e) {
            console.error(e);
        }
    },
    isTogglable: true,
    toolTip: "Hold A to increase, grip to decrease hue of held item."
}),
new ButtonInfo({
    buttonText: "Rainbow All Items",
    method: () => {
      try {
        if (rightGrab && time > tagGunDelay) {
          tagGunDelay = time + 0.1;
          hueVal += 5;
          satVal += 5;
          if (hueVal > 127) hueVal = -127;
          if (satVal > 127) satVal = -127;
        }
        if (leftGrab && time > tagGunDelay) {
          tagGunDelay = time + 0.1;
          hueVal -= 5;
          satVal -= 5;
          if (hueVal > 127) hueVal = -127;
          if (satVal > 127) satVal = -127;
        }
        if (frameCount % 60 == 0 || !cachedItems) {
          cachedItems = Object.method("FindObjectsByType", 1).inflate(GBOClass).invoke(0);
        }
        if (frameCount % 5 != 0) return;
        if (cachedItems) {
          for (var i = 0; i < cachedItems.length; i++) {
            var item = cachedItems.get(i);
            if (!item || item.handle.isNull()) continue;
            item.method("set_colorHue").invoke(hueVal);
            item.method("set_colorSaturation").invoke(satVal);
          }
        }
      } catch (e) {
        console.error(e);
      }
    },
    isTogglable: true,
    toolTip: "Hold grip to cycle rainbow on all items."
}),
new ButtonInfo({
    buttonText: "random Held Item",
    method: () => {
        try {
            var grabbable = getLocalHeldGrabbable(true);
            if (!grabbable || grabbable.isNull?.()) return;
            if (rightGrab) {
                hueVal++;
                satVal++;
                scaleVal++;
                if (hueVal > 127) hueVal = -127;
                if (satVal > 127) satVal = -127;
                if (scaleVal > 127) scaleVal = -127;
            }
            if (leftGrab) {
                hueVal--;
                satVal--;
                scaleVal--;
                if (hueVal > 127) hueVal = -127;
                if (hueVal > 127) hueVal = -127;
                if (satVal > 127) satVal = -127;
            }
            grabbable.method("set_colorHue").invoke(hueVal);
            grabbable.method("set_colorSaturation").invoke(satVal);
            grabbable.method("set_scaleModifier").invoke(scaleVal)
        } catch (e) {
            console.error(e);
        }
    },
    isTogglable: true,
    toolTip: "Hold A to increase, grip to decrease hue of held item."
}),
new ButtonInfo({
    buttonText: "random All Items",
    method: () => {
      try {
        if (time <= randomAllItemsDelay) return;
        randomAllItemsDelay = time + 0.12;
        var items = getAllLobbyItemGameObjects();
        if (!items || items.length === 0) return;
        var processed = 0;
        var maxPerTick = Math.min(12, items.length);
        for (var scan = 0; scan < items.length && processed < maxPerTick; scan++) {
          var idx = (randomAllItemsCursor + scan) % items.length;
          var item = items[idx];
          if (!item || item.isNull?.()) continue;
          if (isItemOccupiedByPlayer(item)) continue;
          var hue = Math.floor(Math.sin((time * 1.3) + (idx * 0.31)) * 127);
          var sat = Math.floor(55 + (Math.sin((time * 0.9) + (idx * 0.27)) * 55));
          var scl = Math.floor(Math.sin((time * 0.8) + (idx * 0.23)) * 42);
          try {
            var target = item;
            try {
              var gbo = item.method("GetComponent", 1).inflate(GBOClass).invoke();
              if (gbo && !gbo.isNull?.()) target = gbo;
            } catch(_) {}
            target.method("set_colorHue").invoke(hue);
            target.method("set_colorSaturation").invoke(sat);
            target.method("set_scaleModifier").invoke(Math.max(-18, Math.min(62, scl)));
          } catch(_) {}
          processed++;
        }
        randomAllItemsCursor = (randomAllItemsCursor + maxPerTick) % Math.max(items.length, 1);
      } catch (e) {
        console.error(e);
      }
    },
    isTogglable: true,
    toolTip: "Smoothly randomizes free lobby items in batches so it actually works without lagging the lobby."
}),
new ButtonInfo({
    buttonText: "Jelly All Items",
    method: () => {
      try {
        if (frameCount % 60 == 0 || !cachedItems) {
          cachedItems = Object.method("FindObjectsByType", 1).inflate(GBOClass).invoke(0);
        }
        if (frameCount % 5 != 0) return;
        if (cachedItems) {
          for (var i = 0; i < cachedItems.length; i++) {
            var item = cachedItems.get(i);
            if (!item || item.handle.isNull()) continue;
            item.method("set_jellyStrength").invoke(127);
          }
        }
      } catch (e) {
        console.error(e);
      }
    },
    disableMethod: () => {
      try {
        if (cachedItems) {
          for (var i = 0; i < cachedItems.length; i++) {
            var item = cachedItems.get(i);
            if (!item || item.handle.isNull()) continue;
            item.method("set_jellyStrength").invoke(0);
          }
        }
      } catch (e) {}
    },
    isTogglable: true,
    toolTip: "it just jelly all items"
}),
        ],
        [
            new ButtonInfo({
                buttonText: "Exit Spawning mods",
                method: () => { currentCategory = 0; currentPage = 0; },
                isTogglable: false,
                toolTip: "Returns you back to the main category."
            }),
            new ButtonInfo({
                buttonText: "Spawn crate",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        var pos = getTransform(player).method("get_position").invoke();
                        PrefabGen.method("GeneratePrefab").invoke(0, pos, identityQuaternion, false);
                    } catch(e) { console.error("Spawn poop error:", e); }
                },
                isTogglable: true,
                toolTip: "Spawns a item_crate prefab at your position."
            }),
            new ButtonInfo({
                buttonText: "Spawn Splashes",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        var pos = getTransform(player).method("get_position").invoke();
                        PrefabGen.method("GeneratePrefab").invoke(1, pos, identityQuaternion, false);
                    } catch(e) { console.error("Spawn splashes error:", e); }
                },
                isTogglable: false,
                toolTip: "Spawns a Splashes prefab at your position."
            }),
            new ButtonInfo({
                buttonText: "Bag Bomb",
                method: () => {
                    if (!rightSecondary) return;
                    function randBB(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
                    try {
                        var spawnPos = leftHandTransform.method("get_position").invoke();
                        var bagIDs = ["item_backpack_large_clover","item_backpack_large_basketball","item_backpack_large_base"];
                        var bagResult = PrefabGen.method("SpawnItem", 4).invoke(
                            Il2Cpp.string("item_prefab/" + bagIDs[randBB(0, bagIDs.length - 1)]),
                            spawnPos, identityQuaternion,
                            NULL
                        );
                        if (!bagResult || bagResult.isNull()) return;
                        var bagGBO = bagResult.method("GetComponent", 1).inflate(GBOClass).invoke();
                        if (bagGBO && !bagGBO.isNull()) {
                            bagGBO.method("set_scaleModifier").invoke(randBB(-128, 127));
                            bagGBO.method("set_colorHue").invoke(randBB(-127, 127));
                            bagGBO.method("set_colorSaturation").invoke(randBB(-20, 127));
                        }
                        var bagBackpack = bagResult.method("GetComponent", 1).inflate(BackpackItemClass).invoke();
                        var spawned = 0, attempts = 0;
                        while (spawned < 23 && attempts < 60) {
                            attempts++;
                            try {
                                var childID = itemIDs[randBB(0, itemIDs.length - 1)];
                                var child = PrefabGen.method("SpawnItem", 4).invoke(
                                    Il2Cpp.string("item_prefab/" + childID),
                                    spawnPos, identityQuaternion,
                                    NULL
                                );
                                if (!child || child.isNull()) continue;
                                var childGBO = child.method("GetComponent", 1).inflate(GBOClass).invoke();
                                if (childGBO && !childGBO.isNull()) {
                                    childGBO.method("set_scaleModifier").invoke(randBB(-128, 127));
                                    childGBO.method("set_colorHue").invoke(randBB(-127, 127));
                                    childGBO.method("set_colorSaturation").invoke(randBB(-20, 127));
                                }
                                if (bagBackpack && !bagBackpack.isNull()) {
                                    var added = false;
                                    try {
                                        var childGBI = child.method("GetComponent", 1).inflate(GBIClass).invoke();
                                        if (childGBI && !childGBI.isNull()) {
                                            childGBI.method("AddToBag").invoke(bagBackpack);
                                            added = true;
                                        }
                                    } catch(_) {}
                                    if (!added) {
                                        try {
                                            var childGBI2 = child.method("GetComponent", 1).inflate(GBIClass).invoke();
                                            if (childGBI2 && !childGBI2.isNull()) {
                                                childGBI2.method("AddToBagInternal").invoke(bagBackpack);
                                            }
                                        } catch(_) {}
                                    }
                                }
                                spawned++;
                            } catch(_) {}
                        }
                        sendNotification("Spawned bag with " + spawned + " items!", false);
                    } catch(e) { console.error("Bag Bomb error:", e); }
                },
                isTogglable: true,
                toolTip: "Spawns a random colored bag with 23 items (hold B)."
            }),
            new ButtonInfo({
                buttonText: "Cash Quiver Hand",
                method: () => {
                    try {
                        var spawnPos = rightHandTransform.method("get_position").invoke();
                        var rot = rightHandTransform.method("get_rotation").invoke();
                        var quiverObj = spawnItemAtPos("item_quiver", spawnPos, rot);
                        if (!quiverObj || quiverObj.isNull?.()) { sendNotification("Quiver spawn failed", false); return; }
                        var moneyObj = spawnItemAtPos("item_fish_dollar_bill", spawnPos, rot);
                        if (moneyObj && !moneyObj.isNull?.()) {
                            try {
                                var quiver = quiverObj.method("GetComponent", 1).inflate(QuiverClass).invoke();
                                var moneyGBI = moneyObj.method("GetComponent", 1).inflate(GBIClass).invoke();
                                if (quiver && !quiver.isNull?.() && moneyGBI && !moneyGBI.isNull?.()) {
                                    try { moneyGBI.method("AddToBag").invoke(quiver); } catch(_) {
                                        try { moneyGBI.method("AddToBagInternal").invoke(quiver); } catch(_) {}
                                    }
                                }
                            } catch(_) {}
                        }
                        sendNotification("Spawned cash quiver", false);
                    } catch(e) { console.error("Cash Quiver Hand:", e); }
                },
                isTogglable: false,
                toolTip: "Spawns a quiver in your hand position with a cash pile style item inside it."
            }),
            new ButtonInfo({
                buttonText: "Teleport All Prefabs",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        var pos = getTransform(player).method("get_position").invoke();
                        var count = 0;
                        try {
                            var allItems = GBIClass.method("get_allLootItems").invoke();
                            if (allItems && !allItems.isNull()) {
                                var enumerator = allItems.method("GetEnumerator").invoke();
                                while (enumerator.method("MoveNext").invoke()) {
                                    try {
                                        var item = enumerator.method("get_Current").invoke();
                                        if (!item || item.isNull()) continue;
                                        getTransform(item).method("set_position").invoke(pos);
                                        count++;
                                    } catch(_) {}
                                }
                            }
                        } catch(e) { console.error("[TeleportAll] " + e); }
                        try {
                            var machine = Object.method("FindObjectOfType", 0).inflate(ItemSellingMachineController).invoke();
                            if (machine && !machine.isNull()) getTransform(machine).method("set_position").invoke(pos);
                        } catch(_) {}
                        sendNotification("Teleported " + count + " items to you!", false);
                    } catch(e) { sendNotification("Teleport all failed: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Teleports all loot items to your position."
            }),
            new ButtonInfo({
        buttonText: "Spawn Items",
        method: () => {
          var handTransform = rightHandTransform;
          if (rightSecondary && rightGrab) {
            try {
              var forward = getLaunchForward(handTransform);
              var up = getLaunchUp(handTransform, forward);
              var spawnPos = Vector3.method("op_Addition").invoke(
                handTransform.method("get_position").invoke(),
                Vector3.method("op_Addition").invoke(
                  Vector3.method("op_Multiply", 2).invoke(forward, 0.38),
                  Vector3.method("op_Multiply", 2).invoke(up, -0.03)
                )
              );
              var result = spawnItemAtPos(itemIDs[itemIndex], spawnPos, getLaunchRotation(handTransform, forward, up));
              if (!result || result.handle.isNull()) {
                sendNotification("Spawn returned null: " + itemIDs[itemIndex], false);
              } else {
                sendNotification("Spawned: " + itemIDs[itemIndex], false);
              }
            } catch (e) {
              console.error("Hand spawn error:", e);
              sendNotification("Spawn failed: " + e, false);
            }
          }
        },
        isTogglable: true,
        toolTip: "Spawns items in your right hand (hold grip + B)."
      }),
        new ButtonInfo({
        buttonText: "Random Hand Duper",
        method: () => {
            if (!rightSecondary) return;
            function rand(min, max) {
                return Math.floor(Math.random() * (max - min + 1)) + min;
            }
            try {
                var player = NetPlayer.method("get_localPlayer").invoke();
                if (!player) return;
                var interactor = player.method("GetHandInteractor", 1).invoke(0);
                if (!interactor) return;
                var itemAnchor = interactor.field("_itemAnchor").value;
                if (!itemAnchor) return;
                var grabbable = itemAnchor.method("get_grabbableObject").invoke();
                if (!grabbable || grabbable.isNull()) return;
                var itemIDStr = "item_treestick";
                var grabbableGO = grabbable.method("get_gameObject").invoke();
                var grabbableItem = grabbableGO.method("GetComponent", 1).inflate(GBIClass).invoke();
                if (grabbableItem && !grabbableItem.isNull()) {
                    var idObj = grabbableItem.method("get_itemID").invoke();
                    if (idObj && !idObj.isNull()) itemIDStr = idObj.content;
                }
                var spawnPos = leftHandTransform.method("get_position").invoke();
                var result = PrefabGen.method("SpawnItem", 4).invoke(
                    Il2Cpp.string("item_prefab/" + itemIDStr),
                    spawnPos,
                    identityQuaternion,
                    NULL
                );
                if (!result || result.isNull()) return;
                var srcGBO = grabbable.method("GetComponent", 1).inflate(GBOClass).invoke();
                var srcScale = rand(-128, 127), srcHue = rand(-127, 127), srcSat = rand(-20, 127);
                if (srcGBO && !srcGBO.isNull()) {
                    srcScale = srcGBO.method("get_scaleModifier").invoke();
                    srcHue   = srcGBO.method("get_colorHue").invoke();
                    srcSat   = srcGBO.method("get_colorSaturation").invoke();
                }
                var spawnedGrabbable = result.method("GetComponent", 1).inflate(GBOClass).invoke();
                if (spawnedGrabbable && !spawnedGrabbable.isNull()) {
                    spawnedGrabbable.method("set_scaleModifier").invoke(srcScale);
                    spawnedGrabbable.method("set_colorHue").invoke(srcHue);
                    spawnedGrabbable.method("set_colorSaturation").invoke(srcSat);
                    var forward = getLaunchForward(leftHandTransform);
                    var velocity = Vector3.method("op_Multiply", 2).invoke(forward, 10);
                    spawnedGrabbable.method("AddExternalForceVelocity", 1).invoke(velocity);
                }
                try {
                    var srcBackpack = grabbable.method("GetComponent", 1).inflate(BackpackItemClass).invoke();
                    if (srcBackpack && !srcBackpack.isNull()) {
                        var dstBackpack = result.method("GetComponent", 1).inflate(BackpackItemClass).invoke();
                        var containedList = srcBackpack.method("GetContainedItems").invoke();
                        if (containedList && !containedList.isNull() && dstBackpack && !dstBackpack.isNull()) {
                            var count = containedList.method("get_Count").invoke();
                            var childSpawnPos = leftHandTransform.method("get_position").invoke();
                            for (var c = 0; c < count; c++) {
                                try {
                                    var item = containedList.method("get_Item").invoke(c);
                                    if (!item || item.isNull()) continue;
                                    var idObj = item.method("get_itemID").invoke();
                                    if (!idObj || idObj.isNull()) continue;
                                    var cScale = 0, cHue = 0, cSat = 0;
                                    try {
                                        var srcChildGBO = item.method("GetComponent", 1).inflate(GBOClass).invoke();
                                        if (srcChildGBO && !srcChildGBO.isNull()) {
                                            cScale = srcChildGBO.method("get_scaleModifier").invoke();
                                            cHue   = srcChildGBO.method("get_colorHue").invoke();
                                            cSat   = srcChildGBO.method("get_colorSaturation").invoke();
                                        }
                                    } catch(_) {}
                                    var spawnedChild = PrefabGen.method("SpawnItem", 4).invoke(
                                        Il2Cpp.string("item_prefab/" + idObj.content), childSpawnPos, identityQuaternion,
                                        NULL
                                    );
                                    if (!spawnedChild || spawnedChild.isNull()) continue;
                                    var dstChildGBO = spawnedChild.method("GetComponent", 1).inflate(GBOClass).invoke();
                                    if (dstChildGBO && !dstChildGBO.isNull()) {
                                        dstChildGBO.method("set_scaleModifier").invoke(cScale);
                                        dstChildGBO.method("set_colorHue").invoke(cHue);
                                        dstChildGBO.method("set_colorSaturation").invoke(cSat);
                                    }
                                    var childGBI = spawnedChild.method("GetComponent", 1).inflate(GBIClass).invoke();
                                    if (childGBI && !childGBI.isNull()) childGBI.method("AddToBag").invoke(dstBackpack);
                                } catch(_) {}
                            }
                            sendNotification("Duped bag + " + count + " items (colors saved)", false);
                        }
                    }
                } catch(e) { console.error("Bag children copy error:", e); }
            } catch (e) {
                console.error("Random Hand Duper error:", e);
            }
        },
        isTogglable: true,
        toolTip: "Dupe item held in left hand with random config (Hold B)."
      }),
        new ButtonInfo({
        buttonText: "Spawn Items Gun",
        isTogglable: true,
        method: () => {
          if (!rightGrab) return;
          var gunData = null;
          try { gunData = renderGun(); } catch(_) { return; }
          if (!gunData) return;
          var ray = gunData.ray;
          if (!ray || ray.handle.isNull()) return;
          if (rightTrigger && time > itemGunDelay) {
            itemGunDelay = time + 0.1;
            try {
              var hitPoint = ray.method("get_point").invoke();
              var result = spawnItemAtPos(itemIDs[itemIndex], hitPoint, identityQuaternion);
              if (!result || result.handle.isNull()) {
                sendNotification("Spawn returned null: " + itemIDs[itemIndex], false);
              } else {
                console.log("\u2713 Spawned item:", itemIDs[itemIndex]);
                sendNotification("Spawned: " + itemIDs[itemIndex], false);
              }
            } catch (e) {
              console.error("Item spawn error:", e);
              sendNotification("Spawn failed: " + e, false);
            }
          }
        },
        toolTip: "Spawns items where you aim (hold grip, pull trigger)."
      }),
        new ButtonInfo({
            buttonText: "Spawn Mob",
            method: () => {
                var handTransform = rightHandTransform;
                var spawnPressed = rightSecondary && rightGrab;
                if (!spawnPressed) {
                    mobSpawnButtonLatched = false;
                    return;
                }
                if (!mobSpawnButtonLatched) {
                    mobSpawnButtonLatched = true;
                    var mob = mobIDs[mobIndex];
                    var forward = getLaunchForward(handTransform);
                    var up = getLaunchUp(handTransform, forward);
                    var pos = Vector3.method("op_Addition").invoke(
                        handTransform.method("get_position").invoke(),
                        Vector3.method("op_Addition").invoke(
                            Vector3.method("op_Multiply", 2).invoke(forward, 0.55),
                            Vector3.method("op_Multiply", 2).invoke(up, -0.03)
                        )
                    );
                    var rot = getLaunchRotation(handTransform, forward, up);
                    spawnMobAtPos(mob, pos, rot);
                    sendNotification("Spawning mob: " + mob.name + " (id=" + mob.id + ")", false);
                }
            },
            isTogglable: true,
            toolTip: "Spawns one mob at your right hand per grip + B press."
        }),
        new ButtonInfo({
            buttonText: "Spawn Mob Gun",
            isTogglable: true,
            method: () => {
                if (!rightGrab) {
                    mobSpawnGunTriggerLatched = false;
                    return;
                }
                var gunData = renderGun();
                if (!rightTrigger) {
                    mobSpawnGunTriggerLatched = false;
                    return;
                }
                var ray = gunData.ray;
                if (!ray || ray.handle.isNull()) return;
                if (!mobSpawnGunTriggerLatched && time > mobGunDelay2) {
                    mobSpawnGunTriggerLatched = true;
                    mobGunDelay2 = time + 0.15;
                    var hitPoint = ray.method("get_point").invoke();
                    var mob = mobIDs[mobIndex];
                    spawnMobAtPos(mob, hitPoint, identityQuaternion);
                    sendNotification("Spawning: " + mob.name + " (id=" + mob.id + ")", false);
                }
            },
            toolTip: "Spawns one mob where you aim per trigger pull."
        }),
        new ButtonInfo({
            buttonText: "Force Spawned Mobs Stay",
            enableMethod: () => { mobForceStayEnabled = true; sendNotification("Force Spawned Mobs Stay ON", false); },
            disableMethod: () => { mobForceStayEnabled = false; sendNotification("Force Spawned Mobs Stay OFF", false); },
            isTogglable: true,
            toolTip: "Keeps tracked spawned mobs active and respawns them if they drop out."
        }),
        ],
        [
            new ButtonInfo({
                buttonText: "Exit Gun mods",
                method: () => { currentCategory = 0; currentPage = 0; },
                isTogglable: false,
                toolTip: "Returns you back to the main category."
            }),
            new ButtonInfo({
        buttonText: "Disintegrate Gun",
        method: () => {
          if (rightGrab) {
            var gunData = renderGun();
            var gunPointer = gunData.gunPointer;
            if (rightTrigger && time > lagGunDelay) {
              lagGunDelay = time + 0.5;
              try {
                var pointerPos = getTransform(gunPointer).method("get_position").invoke();
                var lowestDistance = Number.MAX_SAFE_INTEGER;
                var nearestPlayer = null;
                var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                var playerValues = playerDict.method("get_Values").invoke();
                var enumerator = playerValues.method("GetEnumerator").invoke();
                while (enumerator.method("MoveNext").invoke()) {
                  var player = enumerator.method("get_Current").invoke();
                  if (!player || player.handle.isNull()) continue;
                  if (playerIsLocal(player)) continue;
                  var playerPos = getTransform(player).method("get_position").invoke();
                  var dist = Vector3.method("Distance").invoke(pointerPos, playerPos);
                  if (dist < lowestDistance) {
                    lowestDistance = dist;
                    nearestPlayer = player;
                  }
                }
                if (nearestPlayer && !nearestPlayer.handle.isNull()) {
                  var targetPos = getTransform(nearestPlayer).method("get_position").invoke();
                  var allVFX = [
                    VFXTypes.MuzzleFlash_Shotgun,
                    VFXTypes.MuzzleFlash_FlareGun,
                    VFXTypes.CrateBreak,
                    VFXTypes.MuzzleFlash_SmallGun,
                    VFXTypes.MuzzleFlash_GoldRevolver,
                    VFXTypes.MuzzleFlash_DragonPistol,
                    VFXTypes.MuzzleFlash_ViperShotgun,
                    VFXTypes.Explosion_FlareGun,
                    VFXTypes.Explosion_Coins,
                    VFXTypes.Explosion_Nuts,
                    VFXTypes.Explosion_Keys,
                    VFXTypes.Explosion_Balloon,
                    VFXTypes.Explosion_TeleGrenadeSrc,
                    VFXTypes.Player_Touch_Lava,
                    VFXTypes.Portal_Teleport,
                    VFXTypes.Explosion_Coins_Vertical,
                    VFXTypes.Autumn_Leaves_Burst,
                    VFXTypes.Explosion_Feathers,
                    VFXTypes.Explosion_Popcorn,
                    VFXTypes.Electricity_Small,
                    VFXTypes.Impact_Flaregun,
                    VFXTypes.Impact_Snowball,
                    VFXTypes.Impact_GoldRevolver,
                    VFXTypes.Impact_MeleeHit,
                    VFXTypes.Impact_BigGroundHit,
                    VFXTypes.Impact_MeleeHit_CriticalSmall,
                    VFXTypes.Impact_MeleeHit_CriticalLarge,
                    VFXTypes.Impact_MeleeHit_AoE,
                    VFXTypes.Research_ZiplineAttachDetach,
                    VFXTypes.Research_Purchase1RP,
                    VFXTypes.Research_Purchase5RP,
                    VFXTypes.Research_Purchase10RP,
                    VFXTypes.Research_PurchaseRPBundle,
                    VFXTypes.Rope_ZiplineAttachDetach,
                    VFXTypes.MeatExplosion_1,
                    VFXTypes.MeatExplosion_2,
                    VFXTypes.MeatExplosion_Headshot,
                    VFXTypes.ServerRoomSplash_Small,
                    VFXTypes.ServerRoomSplash_Big,
                    VFXTypes.RAMActivationSparks,
                    VFXTypes.GreenBlink,
                    VFXTypes.ConfettiBurst,
                    VFXTypes.Ethereal_Void,
                    VFXTypes.MomBoss_NailBreak,
                    VFXTypes.MidAirJump_Fart,
                    VFXTypes.FuelExplosion
                  ];
                  var NetworkRunner = SFXManager.field("_instance").value.method("get__currentRunner").invoke();
                  for (var vfxType of allVFX) {
                    ParticleManagerClass.method("RPC_PlayVFX", 4).invoke(
                      NetworkRunner,
                      vfxType,
                      targetPos,
                      identityQuaternion
                    );
                  }
                  var transform = nearestPlayer.method("get_transform").invoke();
                  var forward = transform.method("get_forward").invoke();
                  var forceVec = Vector3.method("op_Multiply", 2).invoke(forward, 1500 * deltaTime);
                  nearestPlayer.method("RPC_Teleport").invoke([0, -9999999, 0]);
                  nearestPlayer.method("RPC_AddForce").invoke(forceVec);
                  nearestPlayer.method("RPC_SetColorHSV").invoke(NaN, NaN, NaN, NaN);
                  sendNotification("Disintegrated nearest player to pointer", false);
                  console.log("âś“ Disintegrated nearest player to gun pointer with all VFX");
                }
              } catch (e) {
                console.error("Disintegrate gun error:", e);
              }
            }
          }
        },
        isTogglable: true,
        toolTip: "Disintegrates player nearest to gun pointer with ALL VFX (hold grip, pull trigger)"
      }),
            new ButtonInfo({
              buttonText: "TP ALL Gun",
              method: () => {
                if (!rightGrab) return;
                var gunData = renderGun();
                var ray = gunData.ray;
                if (!rightTrigger) return;
                if (!ray || ray.isNull()) return;
                try {
                    var hitPoint = ray.method("get_point").invoke();
                    var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                    var playerValues = playerDict.method("get_Values").invoke();
                    var enumerator = playerValues.method("GetEnumerator").invoke();
                    while (enumerator.method("MoveNext").invoke()) {
                        var netPlayer = enumerator.method("get_Current").invoke();
                        if (!netPlayer || netPlayer.handle.isNull()) continue;
                        if (netPlayer.method("get_IsMine").invoke()) continue;
                        netPlayer.method("RPC_Teleport").invoke(hitPoint);
                    }
                } catch (e) {
                    console.error("TP ALL Gun error:", e);
                }
              },
              isTogglable: true,
              toolTip: "Teleports all players to your gun pointer."
            }),
            new ButtonInfo({
              buttonText: "Orbit Players",
              method: () => {
                try {
                    var targets = getAllNetPlayersList(false);
                    if (targets.length === 0) return;
                    var centerPos = getTransform(headCollider).method("get_position").invoke();
                    var cx = centerPos.field("x").value ;
                    var cy = centerPos.field("y").value ;
                    var cz = centerPos.field("z").value ;
                    var radius = 3.5;
                    var spin = time * 1.85;
                    for (var i = 0; i < targets.length; i++) {
                        var p = targets[i];
                        if (!p || p.handle.isNull()) continue;
                        var angle = spin + ((i / Math.max(targets.length, 1)) * Math.PI * 2);
                        var orbitPos = [
                            cx + Math.cos(angle) * radius,
                            cy + 0.15 + Math.sin((angle * 2.0) + (time * 0.4)) * 0.25,
                            cz + Math.sin(angle) * radius
                        ];
                        try { p.method("RPC_Teleport").invoke(orbitPos); } catch(_) {}
                    }
                } catch(e) {
                    console.error("Orbit Players error:", e);
                }
              },
              isTogglable: true,
              toolTip: "Continuously teleports all other players into an orbit around you."
            }),
            new ButtonInfo({
              buttonText: "Orbit Players Fast",
              method: () => {
                try {
                    var targets = getAllNetPlayersList(false);
                    if (targets.length === 0) return;
                    var centerPos = getTransform(headCollider).method("get_position").invoke();
                    var cx = centerPos.field("x").value ;
                    var cy = centerPos.field("y").value ;
                    var cz = centerPos.field("z").value ;
                    var radius = 3.5;
                    var spin = time * (1.85 * 3.0);
                    for (var i = 0; i < targets.length; i++) {
                        var p = targets[i];
                        if (!p || p.handle.isNull()) continue;
                        var angle = spin + ((i / Math.max(targets.length, 1)) * Math.PI * 2);
                        var orbitPos = [
                            cx + Math.cos(angle) * radius,
                            cy + 0.15 + Math.sin((angle * 2.0) + (time * 1.2)) * 0.25,
                            cz + Math.sin(angle) * radius
                        ];
                        try { p.method("RPC_Teleport").invoke(orbitPos); } catch(_) {}
                    }
                } catch(e) {
                    console.error("Orbit Players Fast error:", e);
                }
              },
              isTogglable: true,
              toolTip: "Continuously teleports all other players into a much faster orbit around you."
            }),
            new ButtonInfo({
              buttonText: "Give Fly Gun",
              enableMethod: () => { sendNotification("Give Fly Gun ON", false); },
              disableMethod: () => { sendNotification("Give Fly Gun OFF", false); },
              method: () => {
                if (!rightGrab) return;
                var gunData = renderGun();
                if (rightTrigger && time > lagGunDelay) {
                    lagGunDelay = time + 0.03;
                    try {
                        var target = resolveGunTargetPlayer(gunData, 10.0);
                        if (!target || target.isNull?.()) { sendNotification("No player there", false); return; }
                        if (playerIsLocal(target)) return;
                        var originTf = getPlayerHandAnchorTransform(target, 1) ?? getPlayerProjectileOriginTransform(target);
                        var forward = originTf && !originTf.isNull?.()
                            ? getLaunchForward(originTf, getTransform(target))
                            : getLaunchForward(getTransform(target), getTransform(headCollider));
                        var smoothFly = Vector3.method("op_Addition").invoke(
                            Vector3.method("op_Multiply", 2).invoke(forward, 0.34),
                            [0, 0.03, 0]
                        );
                        target.method("RPC_AddForce").invoke(smoothFly);
                        sendNotification("Gave fly boost to " + getPlayerName(target), false);
                    } catch(e) { console.error("Give Fly Gun:", e); }
                }
              },
              isTogglable: true,
              toolTip: "Point at any player and give them a smooth forward fly force (hold grip + trigger)."
            }),
            new ButtonInfo({
              buttonText: "Kick Gun",
              method: () => {
                if (!rightGrab) return;
                var gunData = renderGun();
                if (!rightTrigger || time <= kickGunDelay) return;
                kickGunDelay = time + 0.45;
                try {
                    var target = resolveGunTargetPlayer(gunData, 10.0);
                    if (!target || target.isNull?.()) { sendNotification("No player there", false); return; }
                    if (playerIsLocal(target)) return;
                    var targetName = getPlayerName(target);
                    if (tryKickPlayer(target)) {
                        sendNotification("Kick sent to " + targetName, false);
                    } else {
                        try { target.method("RPC_DoPlayerDie").invoke(true); } catch(_) {}
                        try { target.method("RPC_Teleport").invoke([-9999999999, -9999999999, -9999999999]); } catch(_) {}
                        try {
                            var go = target.method("get_gameObject").invoke();
                            if (go && !go.isNull?.()) {
                                try {
                                    var renderers = go.method("GetComponentsInChildren", 1).inflate(Renderer).invoke(true);
                                    if (renderers && !renderers.isNull?.()) {
                                        for (var i = 0; i < renderers.length; i++) {
                                            try { renderers.get(i).method("set_enabled").invoke(false); } catch(_) {}
                                        }
                                    }
                                } catch(_) {}
                                try {
                                    var colliders = go.method("GetComponentsInChildren", 1).inflate(Collider).invoke(true);
                                    if (colliders && !colliders.isNull?.()) {
                                        for (var i = 0; i < colliders.length; i++) {
                                            try { colliders.get(i).method("set_enabled").invoke(false); } catch(_) {}
                                        }
                                    }
                                } catch(_) {}
                                try { go.method("SetActive").invoke(false); } catch(_) {}
                            }
                        } catch(_) {}
                        console.error("[Kick Gun] moderation failed, hid target instead", targetName, getPlayerKickTokens(target));
                        sendNotification("Kick hide on " + targetName, false);
                    }
                } catch(e) {
                    console.error("Kick Gun:", e);
                }
              },
              isTogglable: true,
              toolTip: "Best-effort private-room kick gun using the game's moderation methods (hold grip + trigger)."
            }),
            new ButtonInfo({
              buttonText: "Get Player Info Gun",
              method: () => {
                if (!rightGrab) return;
                var gunData = renderGun();
                if (!rightTrigger || time <= idGunDelay) return;
                idGunDelay = time + 0.25;
                try {
                    var target = resolveGunTargetPlayer(gunData, 10.0);
                    if (!target || target.isNull?.()) { sendNotification("No player there", false); return; }
                    dumpPlayerInfoToTerminal(target);
                    sendNotification("Dumped info for " + getPlayerName(target), false);
                } catch(e) { console.error("Get Player Info Gun:", e); }
              },
              isTogglable: true,
              toolTip: "Aim at a player and dump their names, IDs, tokens, and related info into the terminal."
            }),
            new ButtonInfo({
              buttonText: "Delete Player Gun",
              method: () => {
                if (!rightGrab) return;
                var gunData = renderGun();
                if (!rightTrigger || time <= deletePlayerGunDelay) return;
                deletePlayerGunDelay = time + 0.3;
                try {
                    var target = resolveGunTargetPlayer(gunData, 10.0);
                    if (!target || target.isNull?.()) { sendNotification("No player there", false); return; }
                    if (playerIsLocal(target)) return;
                    var targetName = getPlayerName(target);
                    try { target.method("RPC_DoPlayerDie").invoke(true); } catch(_) {}
                    try { target.method("RPC_Teleport").invoke([-9999999999, -9999999999, -9999999999]); } catch(_) {}
                    try { getTransform(target).method("set_position").invoke([-9999999999, -9999999999, -9999999999]); } catch(_) {}
                    try {
                        var go = target.method("get_gameObject").invoke();
                        if (go && !go.isNull?.()) {
                            try { go.method("SetActive").invoke(false); } catch(_) {}
                            try { Destroy(go); } catch(_) {}
                        }
                    } catch(_) {}
                    sendNotification("Deleted " + targetName, false);
                } catch(e) { console.error("Delete Player Gun:", e); }
              },
              isTogglable: true,
              toolTip: "Aims at a player and voids/deletes them hard (hold grip + trigger)."
            }),
            new ButtonInfo({
                buttonText: "Bring All Items Gun",
                method: () => {
                    if (!rightGrab) return;
                var gunData = renderGun();
                var ray = gunData.ray;
                if (!rightTrigger) return;
                if (time <= bringAllItemsGunDelay) return;
                bringAllItemsGunDelay = time + 0.05;
                try {
                    var hitPoint = (ray && !ray.isNull?.())
                        ? ray.method("get_point").invoke()
                        : getTransform(gunData.gunPointer).method("get_position").invoke();
                    var count = 0;
                    var seen = new Set();
                    var items = collectAllLobbyItemsWithHeld();
                    var maxPerTick = Math.min(24, items.length);
                    for (var scan = 0; scan < items.length && count < maxPerTick; scan++) {
                        var go = items[(bringAllItemsCursor + scan) % items.length];
                        try {
                            var rootGo = getRootLikeObject(go);
                            var rootKey = normalizeSceneObjectHandle(rootGo) || normalizeSceneObjectHandle(go);
                            if (rootKey && seen.has(rootKey)) continue;
                            if (rootKey) seen.add(rootKey);
                            requestAuthorityDeep(go);
                            requestAuthorityDeep(rootGo);
                            forceReleaseItemFromAllPlayers(go);
                            forceReleaseItemFromAllPlayers(rootGo);
                            tryReleaseHeldItem(go);
                            tryReleaseHeldItem(rootGo);
                            if (forceMoveLobbyItem(rootGo, hitPoint)) {
                                try { forceMoveLobbyItem(rootGo, hitPoint); } catch(_) {}
                                try { forceMoveLobbyItem(rootGo, hitPoint); } catch(_) {}
                                try { forceMoveLobbyItem(rootGo, hitPoint); } catch(_) {}
                                count++;
                            }
                        } catch(_) {}
                    }
                    bringAllItemsCursor = (bringAllItemsCursor + maxPerTick) % Math.max(items.length, 1);
                    sendNotification("Brought " + count + " items to pointer!", false);
                } catch(e) { console.error("Bring All Items Gun:", e); }
              },
              isTogglable: true,
              toolTip: "Teleports all lobby items to your gun pointer (hold grip + trigger)."
            }),
            new ButtonInfo({
              buttonText: "VFX Spammer Gun",
              method: () => {
                if (!rightGrab) return;
                var gunData = renderGun();
                var ray = gunData.ray;
                if (!rightTrigger) return;
                if (time <= lagGunDelay) return;
                lagGunDelay = time + 0.08;
                try {
                    var hitPoint = (ray && !ray.isNull?.())
                        ? ray.method("get_point").invoke()
                        : getTransform(gunData.gunPointer).method("get_position").invoke();
                    try { playSelectedVfxAt(hitPoint); } catch(_) {}
                } catch(e) { console.error("VFX Spammer Gun:", e); }
              },
              isTogglable: true,
              toolTip: "Spams the selected VFX at your gun pointer."
            }),
      new ButtonInfo({
        buttonText: "Stinky Gun",
        method: () => {
          if (rightGrab) {
            var gunData = null;
            try { gunData = renderGun(); } catch(_) { return; }
            if (!gunData) return;
            if (rightTrigger) {
              try {
              if (time > tagGunDelay) {
                tagGunDelay = time + 0.35;
                var gunTarget = resolveGunTargetPlayer(gunData, 10.0);
                if (gunTarget && !gunTarget.handle.isNull() && !playerIsLocal(gunTarget)) {
                  gunTarget.method("RPC_TagAsStinky").invoke();
                }
              }
              } catch(_) {}
            }
          }
        },
        isTogglable: true,
        toolTip: "Stinkies whoever your hand desires."
      }),
      new ButtonInfo({
        buttonText: "Jelly Gun",
        method: () => {
            if (!rightGrab) return;
            var gunData = renderGun();
            if (!rightTrigger || time <= tagGunDelay) return;
            tagGunDelay = time + 0.08;
            try {
                var target = resolveGunTargetPlayer(gunData, 10.0);
                if (!target || target.isNull?.()) { sendNotification("No player there", false); return; }
                if (playerIsLocal(target)) return;
                var targetTf = getTransform(target);
                if (!targetTf || targetTf.isNull?.()) return;
                spawnGoopBurstAtTransform(targetTf, 18, 96, 3, 2.5, 7.0);
                sendNotification("Jellied " + getPlayerName(target), false);
            } catch(e) { console.error("Jelly Gun:", e); }
        },
        isTogglable: true,
        toolTip: "Shoots jelly/goop at the player you're aiming at (hold grip + trigger)."
      }),
      new ButtonInfo({
        buttonText: "Freeze Gun",
        method: () => {
            if (!rightGrab) return;
            var gunData = renderGun();
            if (!rightTrigger || time <= lagGunDelay) return;
            lagGunDelay = time + 0.5;
            try {
                var target = resolveGunTargetPlayer(gunData, 10.0);
                if (!target || target.isNull?.()) { sendNotification("No player there", false); return; }
                if (playerIsLocal(target)) return;
                var pos = getTransform(target).method("get_position").invoke();
                target.method("RPC_PlayerStun").invoke(pos, 999.0, 9999.0, 0);
                sendNotification("Froze " + getPlayerName(target), false);
            } catch(e) { console.error("Freeze Gun:", e); }
        },
        isTogglable: true,
        toolTip: "Freezes the player you're aiming at indefinitely (hold grip + trigger)."
      }),
      new ButtonInfo({
        buttonText: "Jelly Player Gun",
        method: () => {
            if (!rightGrab) return;
            var gunData = renderGun();
            if (!rightTrigger || time <= lagGunDelay) return;
            lagGunDelay = time + 0.5;
            try {
                var target = resolveGunTargetPlayer(gunData, 10.0);
                if (!target || target.isNull?.()) { sendNotification("No player there", false); return; }
                if (playerIsLocal(target)) return;
                var go = target.method("get_gameObject").invoke();
                if (!go || go.isNull()) return;
                var renderers = go.method("GetComponentsInChildren", 1).inflate(Renderer).invoke(true);
                if (!renderers || renderers.isNull()) return;
                for (var i = 0; i < renderers.length; i++) {
                    try {
                        var r = renderers.get(i);
                        if (!r || r.isNull()) continue;
                        var mats = r.method("get_materials").invoke();
                        if (!mats || mats.isNull()) continue;
                        for (var j = 0; j < mats.length; j++) {
                            try { mats.get(j).method("SetFloat").invoke(Il2Cpp.string("_JellyStrength"), 127.0); } catch(_) {}
                        }
                    } catch(_) {}
                }
                sendNotification("Jellied " + getPlayerName(target), false);
            } catch(e) { console.error("Jelly Player Gun:", e); }
        },
        isTogglable: true,
        toolTip: "Applies jelly strength to the player you're aiming at (hold grip + trigger)."
      }),
        ],
        [
            new ButtonInfo({
                buttonText: "Exit Over Powered",
                method: () => { currentCategory = 0; currentPage = 0; },
                isTogglable: false,
                toolTip: "Returns you back to the main category."
            }),
            new ButtonInfo({
                buttonText: "Sell All Items",
                method: () => {
                    try {
                        var sold = 0;
                        var machines = Object.method("FindObjectsByType", 1).inflate(ItemSellingMachineController).invoke(0);
                        if (!machines || machines.isNull()) { sendNotification("No selling machines found!", false); return; }
                        for (var mi = 0; mi < machines.length; mi++) {
                            try {
                                var machine = machines.get(mi);
                                if (!machine || machine.isNull()) continue;
                                var sellMethods = ["SellAll", "SellAllItems", "Sell", "TrySellAll", "DoSell"];
                                for (var m of sellMethods) {
                                    try { machine.method(m).invoke(); sold++; break; } catch(_) {}
                                }
                            } catch(_) {}
                        }
                        sendNotification("Sold items from " + sold + " machine(s)!", false);
                    } catch(e) { sendNotification("Sell All: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sells all items in every selling machine in the scene."
            }),
            new ButtonInfo({
                buttonText: "Multi Buy",
                enableMethod: () => { multiBuyEnabled = true; sendNotification("Multi Buy ON x" + multiBuyAmount, false); },
                disableMethod: () => { multiBuyEnabled = false; sendNotification("Multi Buy OFF", false); },
                isTogglable: true,
                toolTip: "Repeats purchase-machine buys using the current multiplier."
            }),
            new ButtonInfo({
                buttonText: "Change Multi Buy",
                method: () => {
                    multiBuyAmount += 5;
                    if (multiBuyAmount > 50) multiBuyAmount = 5;
                    sendNotification("Multi Buy x" + multiBuyAmount, false);
                },
                isTogglable: false,
                toolTip: "Cycles the multi buy amount in steps of 5 up to 50, then resets."
            }),
            new ButtonInfo({
                buttonText: "Grant All Stash Slots",
                enableMethod: () => { forceAllStashSlotsEnabled = true; sendNotification("Grant All Stash Slots ON", false); },
                disableMethod: () => { forceAllStashSlotsEnabled = false; sendNotification("Grant All Stash Slots OFF", false); },
                isTogglable: true,
                toolTip: "Best-effort force unlocks every stash slot it can find on this build."
            }),
            new ButtonInfo({
                buttonText: "No Container Restrictions",
                enableMethod: () => { containerFreedomAuraEnabled = true; sendNotification("No Container Restrictions ON", false); },
                disableMethod: () => { containerFreedomAuraEnabled = false; sendNotification("No Container Restrictions OFF", false); },
                isTogglable: true,
                toolTip: "Force-applies bag/quiver/back/hip/container flags so items can go anywhere."
            }),
            new ButtonInfo({
                buttonText: "RPG Hands All",
                enableMethod: () => { rpgHandsDelay = 0; sendNotification("RPG Hands All ON", false); },
                disableMethod: () => { sendNotification("RPG Hands All OFF", false); },
                isTogglable: true,
                method: () => {
                    if (time <= rpgHandsDelay) return;
                    rpgHandsDelay = time + 0.035;
                    try {
                        for (var p of getAllNetPlayersList(false)) {
                            try {
                                var rightHeld = getPlayerHeldGrabbable(p, 1);
                                if (!grabbableLooksLikeRevolver(rightHeld)) continue;
                                var tf = getPlayerHandAnchorTransform(p, 1) ?? getPlayerProjectileOriginTransform(p);
                                if (!tf || tf.isNull?.()) continue;
                                var pos = tf.method("get_position").invoke();
                                var forward = getPlayerStraightForward(p);
                                var up = [0, 1, 0];
                                var rot = getLookRotationFromForward(forward);
                                var spawnPos = Vector3.method("op_Addition").invoke(
                                    pos,
                                    Vector3.method("op_Addition").invoke(
                                        Vector3.method("op_Multiply", 2).invoke(forward, 0.72),
                                        [0, -0.025, 0]
                                    )
                                );
                                var rocket = spawnNetworkPrefab("RPGRocket", spawnPos, rot);
                                if (rocket && !rocket.isNull()) {
                                    var vel = Vector3.method("op_Addition").invoke(
                                        Vector3.method("op_Multiply", 2).invoke(forward, 96.0),
                                        Vector3.method("op_Multiply", 2).invoke(up, 1.0)
                                    );
                                    trySetObjectVelocity(rocket, vel);
                                }
                            } catch(_) {}
                        }
                    } catch(e) { console.error("RPG Hands All:", e); }
                },
                toolTip: "Anyone holding a revolver in their right hand gets fast RPG hands from that right-hand anchor."
            }),
            new ButtonInfo({
                buttonText: "Buggy Hands",
                isTogglable: true,
                method: () => {
                    try {
                        var useRight = rightGrab && rightTrigger;
                        var useLeft  = leftGrab  && leftTrigger;
                        if (!useRight && !useLeft) return;
                        if (time <= lagGunDelay) return;
                        lagGunDelay = time + 0.05;
                        var handTransform = useRight ? rightHandTransform : leftHandTransform;
                        var spawned = spawnForwardLaunchedNetworkPrefab("Vehicle_Buggy", handTransform, 155.0, 1.95);
                        if (!spawned || spawned.isNull?.()) {
                            sendNotification("Buggy spawn failed", false);
                        }
                    } catch(e) { console.error("Buggy Hands:", e); }
                },
                toolTip: "Hold grip + trigger to keep launching buggies forward from your hand."
            }),
            new ButtonInfo({
                buttonText: "Item Launcher",
                isTogglable: true,
                method: () => {
                    try {
                        var useRight = rightGrab && rightTrigger;
                        var useLeft = leftGrab && leftTrigger;
                        if (!useRight && !useLeft) return;
                        if (time <= itemLauncherSelfDelay) return;
                        itemLauncherSelfDelay = time + 0.055;
                        var currentItemId = itemIDs[itemIndex];
                        var handTransform = useRight ? rightHandTransform : leftHandTransform;
                        var spawned = spawnForwardLaunchedItem(currentItemId, handTransform, 28.0, 0.92);
                        if (!spawned || spawned.isNull?.()) {
                            sendNotification("Item launch failed", false);
                        }
                    } catch(e) { console.error("Item Launcher:", e); }
                },
                toolTip: "Hold grip + trigger to keep launching the currently selected Item ID from your hand."
            }),
            new ButtonInfo({
                buttonText: "Right Hand Duper",
                enableMethod: () => { heldItemDuplicateDelay = 0; sendNotification("Right Hand Duper ON", false); },
                disableMethod: () => { sendNotification("Right Hand Duper OFF", false); },
                isTogglable: true,
                method: () => {
                    if (time <= heldItemDuplicateDelay) return;
                    heldItemDuplicateDelay = time + 0.075;
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.isNull?.()) return;
                        spawnHeldItemDuplicateForPlayer(player, 14.0);
                    } catch(e) { console.error("Right Hand Duper:", e); }
                },
                toolTip: "Rapidly duplicates the item in your right hand and throws the copies forward."
            }),
            new ButtonInfo({
                buttonText: "Give Fly All",
                enableMethod: () => { giveFlyAllDelay = 0; sendNotification("Give Fly All ON", false); },
                disableMethod: () => { sendNotification("Give Fly All OFF", false); },
                isTogglable: true,
                method: () => {
                    if (time <= giveFlyAllDelay) return;
                    giveFlyAllDelay = time + 0.03;
                    try {
                        for (var p of getAllNetPlayersList(false)) {
                            try {
                                var rightHeld = getPlayerHeldGrabbable(p, 1);
                                if (!grabbableLooksLikeRevolver(rightHeld)) continue;
                                var forward = getPlayerStraightForward(p);
                                var smoothFly = Vector3.method("op_Addition").invoke(
                                    Vector3.method("op_Multiply", 2).invoke(forward, 0.54),
                                    [0, 0.06, 0]
                                );
                                p.method("RPC_AddForce").invoke(smoothFly);
                            } catch(_) {}
                        }
                    } catch(e) { console.error("Give Fly All:", e); }
                },
                toolTip: "Anyone holding a revolver in their right hand gets smooth forward fly like the local movement fly."
            }),
            new ButtonInfo({
                buttonText: "Item Launcher All",
                enableMethod: () => { itemRainDelay = 0; sendNotification("Item Launcher All ON", false); },
                disableMethod: () => { sendNotification("Item Launcher All OFF", false); },
                isTogglable: true,
                method: () => {
                    if (time <= itemRainDelay) return;
                    itemRainDelay = time + 0.06;
                    try {
                        for (var p of getAllNetPlayersList(false)) {
                            try {
                                for (var handIndex of [0, 1]) {
                                    var held = getPlayerHeldGrabbable(p, handIndex);
                                    if (!held || held.isNull?.()) continue;
                                    var heldItemId = getGrabbableItemId(held);
                                    if (!heldItemId) continue;
                                    var tf = getPlayerLaunchTransform(p, handIndex, held);
                                    if (!tf || tf.isNull?.()) continue;
                                    var pos = tf.method("get_position").invoke();
                                    var forward = getPlayerStraightForward(p);
                                    var up = [0, 1, 0];
                                    var rot = getLookRotationFromForward(forward);
                                    for (var i = 0; i < 3; i++) {
                                        var spawnPos = Vector3.method("op_Addition").invoke(
                                            pos,
                                            Vector3.method("op_Addition").invoke(
                                                Vector3.method("op_Multiply", 2).invoke(forward, 0.55 + (i * 0.08)),
                                                [0, -0.04, 0]
                                            )
                                        );
                                        var item = spawnItemAtPos(heldItemId, spawnPos, rot);
                                        if (item && !item.isNull()) {
                                            var vel = Vector3.method("op_Addition").invoke(
                                                Vector3.method("op_Multiply", 2).invoke(forward, 22.0 + (i * 3.0)),
                                                Vector3.method("op_Multiply", 2).invoke(up, 1.0)
                                            );
                                            trySetObjectVelocity(item, vel);
                                        }
                                    }
                                }
                            } catch(_) {}
                        }
                    } catch(e) { console.error("Item Launcher All:", e); }
                },
                toolTip: "Any player holding any item in either hand launches copies of that same held item from that hand."
            }),
            new ButtonInfo({
                buttonText: "All Player Gun Buffs",
                enableMethod: () => { InfAmmo = true; noRecoil = true; rapidFireEnabled = true; },
                isTogglable: true,
                method: () => {
                    if (time <= allPlayerGunBuffsDelay) return;
                    allPlayerGunBuffsDelay = time + 0.12;
                    try {
                        for (var p of getAllNetPlayersList(true)) {
                            for (var handIndex of [0, 1]) {
                                try {
                                    var grabbable = getPlayerHeldGrabbable(p, handIndex);
                                    applyGunBuffsToGrabbable(grabbable, false);
                                } catch(_) {}
                            }
                        }
                    } catch(e) { console.error("All Player Gun Buffs:", e); }
                },
                toolTip: "Best-effort local patch that keeps other players' held guns rapid-fire, high-ammo, and no-recoil."
            }),
            new ButtonInfo({
                buttonText: "Item Rain",
                enableMethod: () => { itemRainDelay = 0; sendNotification("Item Rain ON", false); },
                disableMethod: () => { sendNotification("Item Rain OFF", false); },
                isTogglable: true,
                method: () => {
                    if (time <= itemRainDelay) return;
                    itemRainDelay = time + 0.08;
                    try {
                        var headPos = getTransform(headCollider).method("get_position").invoke();
                        var spawnPos = [
                            (headPos.field("x").value ) + ((Math.random() * 8.0) - 4.0),
                            (headPos.field("y").value ) + 9.0 + (Math.random() * 4.0),
                            (headPos.field("z").value ) + ((Math.random() * 8.0) - 4.0)
                        ];
                        spawnItemAtPos(itemIDs[itemIndex], spawnPos, identityQuaternion);
                    } catch(e) { console.error("Item Rain:", e); }
                },
                toolTip: "Rains the currently selected Item ID above your head while enabled."
            }),
            new ButtonInfo({
                buttonText: "Goop Spammer",
                enableMethod: () => { goopSpamDelay = 0; sendNotification("Goop Spammer ON", false); },
                disableMethod: () => { sendNotification("Goop Spammer OFF", false); },
                isTogglable: true,
                method: () => {
                    if (time <= goopSpamDelay) return;
                    goopSpamDelay = time + 0.032;
                    try {
                        var bodyTf = getTransform(bodyCollider);
                        var bodyPos = bodyTf.method("get_position").invoke();
                        var bodyForward = readVec3Components(bodyTf.method("get_forward").invoke());
                        var [fx, fz] = normalizeXZ(bodyForward[0], bodyForward[2]);
                        var spawnPos = [
                            (bodyPos.field("x").value ) + (fx * 0.16) + ((Math.random() * 0.03) - 0.015),
                            (bodyPos.field("y").value ) - 0.32,
                            (bodyPos.field("z").value ) + (fz * 0.16) + ((Math.random() * 0.03) - 0.015)
                        ];
                        var goop = spawnItemAtPos("item_goop", spawnPos, identityQuaternion);
                        if (goop && !goop.isNull()) {
                            spawnedGoopObjects.push({ object: goop, expireAt: time + 2.2 });
                            var vel = [
                                (fx * 8.0) + ((Math.random() * 0.9) - 0.45),
                                -1.0 + (Math.random() * 0.35),
                                (fz * 8.0) + ((Math.random() * 0.9) - 0.45)
                            ];
                            trySetObjectVelocity(goop, vel);
                        }
                    } catch(e) { console.error("Goop Spammer:", e); }
                },
                toolTip: "Shoots a temporary stream of goop forward/down from your lower body."
            }),
            new ButtonInfo({
                buttonText: "Piss Mod",
                enableMethod: () => { goopSpamDelay = 0; sendNotification("Piss Mod ON", false); },
                disableMethod: () => { sendNotification("Piss Mod OFF", false); },
                isTogglable: true,
                method: () => {
                    if (time <= goopSpamDelay) return;
                    goopSpamDelay = time + 0.055;
                    try {
                        var bodyTf = getTransform(bodyCollider);
                        spawnGoopBurstAtTransform(bodyTf, 56, 100, 1, 2.2, 5.2);
                    } catch(e) { console.error("Piss Mod:", e); }
                },
                toolTip: "Shoots a yellow temporary piss stream from your lower body."
            }),
            new ButtonInfo({
                buttonText: "Grab Selling Machine",
                enableMethod: () => { heldSellingMachine = null; },
                disableMethod: () => {
                    try {
                        if (heldSellingMachine && !heldSellingMachine.isNull?.()) {
                            try {
                                var runner = heldSellingMachine.method("get_Runner").invoke();
                                if (runner && !runner.isNull?.()) runner.method("Despawn").invoke(heldSellingMachine);
                            } catch(_) {}
                            try { Destroy(heldSellingMachine.method("get_gameObject").invoke()); } catch(_) {}
                        }
                    } catch(_) {}
                    heldSellingMachine = null;
                },
                isTogglable: true,
                method: () => {
                    try {
                        if (!rightGrab) {
                            if (heldSellingMachine && !heldSellingMachine.isNull?.()) {
                                try { heldSellingMachine.method("get_gameObject").invoke().method("SetActive").invoke(false); } catch(_) {}
                            }
                            return;
                        }
                        if (!heldSellingMachine || heldSellingMachine.isNull?.()) {
                            heldSellingMachine = spawnNetworkPrefab("ItemSellingMachineController", zeroVector, identityQuaternion);
                            if (!heldSellingMachine || heldSellingMachine.isNull?.()) return;
                        }
                        var go = heldSellingMachine.method("get_gameObject").invoke();
                        if (go && !go.isNull?.()) go.method("SetActive").invoke(true);
                        var handPos = rightHandTransform.method("get_position").invoke();
                        var forward = getLaunchForward(rightHandTransform, headCollider ? getTransform(headCollider) );
                        var up = getLaunchUp(rightHandTransform, forward);
                        var targetPos = Vector3.method("op_Addition").invoke(
                            handPos,
                            Vector3.method("op_Addition").invoke(
                                Vector3.method("op_Multiply", 2).invoke(forward, 0.9),
                                Vector3.method("op_Multiply", 2).invoke(up, -0.08)
                            )
                        );
                        var tf = getTransform(heldSellingMachine);
                        tf.method("set_position").invoke(targetPos);
                        tf.method("set_rotation").invoke(getLaunchRotation(rightHandTransform, forward, up));
                    } catch(e) { console.error("Grab Selling Machine:", e); }
                },
                toolTip: "While right grip is held, a selling machine stays pushed out in front of your hand."
            }),
            new ButtonInfo({
                buttonText: "Mob Orbit",
                enableMethod: () => { mobOrbitEntries = []; },
                disableMethod: () => { mobOrbitEntries = []; },
                isTogglable: true,
                method: () => {
                    try {
                        var center = getTransform(headCollider).method("get_position").invoke();
                        var mob = mobIDs[mobIndex];
                        while (mobOrbitEntries.length < 6) {
                            var angle = (Math.PI * 2 * mobOrbitEntries.length) / 6;
                            var pos = [
                                (center.field("x").value ) + Math.cos(angle) * 3.0,
                                (center.field("y").value ) + 0.6,
                                (center.field("z").value ) + Math.sin(angle) * 3.0
                            ];
                            var spawned = spawnMobAtPos(mob, pos, identityQuaternion) ;
                            mobOrbitEntries.push({ mobEntry: mob, object: spawned ?? null, angle });
                        }
                        for (var orb of mobOrbitEntries) {
                            try {
                                if (!orb.object || orb.object.isNull?.()) continue;
                                orb.angle += deltaTime * 1.8;
                                var pos = [
                                    (center.field("x").value ) + Math.cos(orb.angle) * 3.2,
                                    (center.field("y").value ) + 0.7 + Math.sin((orb.angle * 2.0) + time) * 0.35,
                                    (center.field("z").value ) + Math.sin(orb.angle) * 3.2
                                ];
                                stabilizeMobInstance(orb.object, pos);
                                getTransform(orb.object).method("set_position").invoke(pos);
                            } catch(_) {}
                        }
                    } catch(e) { console.error("Mob Orbit:", e); }
                },
                toolTip: "Spawns the current mob selection into an orbit around you and keeps them active."
            }),
            new ButtonInfo({
                buttonText: "Prefab Orbit",
                enableMethod: () => { prefabOrbitEntries = []; },
                disableMethod: () => {
                    for (var orb of prefabOrbitEntries) {
                        try {
                            var obj = orb?.object;
                            if (!obj || obj.isNull?.()) continue;
                            var go = obj;
                            try {
                                var maybeGo = obj.method("get_gameObject").invoke();
                                if (maybeGo && !maybeGo.isNull?.()) go = maybeGo;
                            } catch(_) {}
                            Destroy(go);
                        } catch(_) {}
                    }
                    prefabOrbitEntries = [];
                },
                isTogglable: true,
                method: () => {
                    try {
                        var center = getTransform(headCollider).method("get_position").invoke();
                        var prefabName = prefabIDs[prefabIndex];
                        while (prefabOrbitEntries.length < 6) {
                            var angle = (Math.PI * 2 * prefabOrbitEntries.length) / 6;
                            var spawnPos = [
                                (center.field("x").value ) + Math.cos(angle) * 3.1,
                                (center.field("y").value ) + 0.8,
                                (center.field("z").value ) + Math.sin(angle) * 3.1
                            ];
                            var spawned = spawnNetworkPrefab(prefabName, spawnPos, identityQuaternion);
                            if (!spawned || spawned.isNull?.()) break;
                            prefabOrbitEntries.push({ object: spawned, angle });
                        }
                        for (var orb of prefabOrbitEntries) {
                            try {
                                if (!orb.object || orb.object.isNull?.()) continue;
                                orb.angle += deltaTime * 1.6;
                                var pos = [
                                    (center.field("x").value ) + Math.cos(orb.angle) * 3.3,
                                    (center.field("y").value ) + 0.8 + Math.sin((orb.angle * 2.0) + time) * 0.25,
                                    (center.field("z").value ) + Math.sin(orb.angle) * 3.3
                                ];
                                getTransform(orb.object).method("set_position").invoke(pos);
                            } catch(_) {}
                        }
                    } catch(e) { console.error("Prefab Orbit:", e); }
                },
                toolTip: "Orbits the currently selected Prefab ID around you and deletes them when turned off."
            }),
            new ButtonInfo({
                buttonText: "Spaz Explode Machine",
                enableMethod: () => { spazMachineEntries = []; sendNotification("Spaz Explode Machine ON", false); },
                disableMethod: () => {
                    spazMachineEntries = [];
                    sendNotification("Spaz Explode Machine OFF", false);
                },
                isTogglable: true,
                method: () => {
                    try {
                        if (time <= lagGunDelay) return;
                        lagGunDelay = time + 0.09;
                        var machines = Object.method("FindObjectsByType", 1).inflate(ItemSellingMachineController).invoke(0);
                        if (!machines || machines.isNull?.() || machines.length === 0) return;
                        for (var i = 0; i < machines.length; i++) {
                            try {
                                var machine = machines.get(i);
                                if (!machine || machine.isNull?.()) continue;
                                var pos = getTransform(machine).method("get_position").invoke();
                                var exploded = false;
                                for (var methodName of ["RPC_Explode", "Explode", "RPC_Detonate", "Detonate", "RPC_BlowUp", "BlowUp", "RPC_TriggerExplosion", "TriggerExplosion", "RPC_StartExplosion", "StartExplosion", "RPC_ExplodeMachine", "ExplodeMachine", "RPC_BreakMachine", "BreakMachine", "RPC_DestroyMachine", "DestroyMachine"]) {
                                    try {
                                        if (tryCallNames(machine, [methodName], 0)) { exploded = true; break; }
                                    } catch(_) {}
                                    try {
                                        if (tryCallNames(machine, [methodName], 1, true)) { exploded = true; break; }
                                    } catch(_) {}
                                }
                                if (!exploded) {
                                    try { playSelectedVfxAt(pos); } catch(_) {}
                                }
                            } catch(_) {}
                        }
                    } catch(e) { console.error("Spaz Explode Machine:", e); }
                },
                toolTip: "Rapidly spams the selling machine explosion path on existing machines instead of spawning new ones."
            }),
            new ButtonInfo({
                buttonText: "Item Tornado",
                enableMethod: () => { itemTornadoEntries = []; sendNotification("Item Tornado ON", false); },
                disableMethod: () => {
                    for (var entry of itemTornadoEntries) {
                        try {
                            var obj = entry?.object;
                            if (!obj || obj.isNull?.()) continue;
                            var go = obj;
                            try {
                                var maybeGo = obj.method("get_gameObject").invoke();
                                if (maybeGo && !maybeGo.isNull?.()) go = maybeGo;
                            } catch(_) {}
                            Destroy(go);
                        } catch(_) {}
                    }
                    itemTornadoEntries = [];
                    sendNotification("Item Tornado OFF", false);
                },
                isTogglable: true,
                method: () => {
                    try {
                        var center = getTransform(bodyCollider).method("get_position").invoke();
                        while (itemTornadoEntries.length < 34) {
                            var itemId = itemIDs[Math.floor(Math.random() * itemIDs.length)];
                            var spawned = spawnItemAtPos(itemId, [
                                (center.field("x").value ) + ((Math.random() * 3.2) - 1.6),
                                (center.field("y").value ) + 0.6 + (Math.random() * 6.5),
                                (center.field("z").value ) + ((Math.random() * 3.2) - 1.6)
                            ], identityQuaternion);
                            if (!spawned || spawned.isNull?.()) break;
                            itemTornadoEntries.push({
                                object: spawned,
                                angle.random() * Math.PI * 2,
                                radius: 2.2 + (Math.random() * 3.8),
                                height: 0.2 + (Math.random() * 9.6),
                                spin: 1.6 + (Math.random() * 2.6)
                            });
                        }
                        for (var i = itemTornadoEntries.length - 1; i >= 0; i--) {
                            var entry = itemTornadoEntries[i];
                            if (!entry || !entry.object || entry.object.isNull?.()) {
                                itemTornadoEntries.splice(i, 1);
                                continue;
                            }
                            entry.angle += deltaTime * entry.spin * 4.2;
                            var baseY = (center.field("y").value );
                            var heightPhase = entry.height + (time * (1.05 + (entry.spin * 0.18))) + (i * 0.38);
                            var ty = baseY + 0.4 + (heightPhase % 10.6);
                            var normalizedHeight = Math.max(0, ty - baseY);
                            var radius = (1.0 + (normalizedHeight * 0.44)) + (Math.sin((time * 2.9) + i) * 0.22);
                            var tx = (center.field("x").value ) + Math.cos(entry.angle) * radius;
                            var tz = (center.field("z").value ) + Math.sin(entry.angle) * radius;
                            try { getTransform(entry.object).method("set_position").invoke([tx, ty, tz]); } catch(_) {}
                            trySetObjectVelocity(entry.object, [
                                Math.cos(entry.angle + 0.3) * (4.8 + (radius * 0.7)),
                                0.55 + (Math.sin((time * 1.7) + i) * 0.3),
                                Math.sin(entry.angle + 0.3) * (4.8 + (radius * 0.7))
                            ]);
                            try { entry.object.method("set_colorHue").invoke(Math.floor((Math.sin(time + i) * 110))); } catch(_) {}
                            try { entry.object.method("set_colorSaturation").invoke(Math.floor((Math.cos((time * 1.2) + i) * 90))); } catch(_) {}
                            try { entry.object.method("set_scaleModifier").invoke(Math.floor((Math.sin((time * 0.9) + i) * 45))); } catch(_) {}
                        }
                    } catch(e) { console.error("Item Tornado:", e); }
                },
                toolTip: "Spawns a much larger spinning tornado of colorful items around you."
            }),
            new ButtonInfo({
                buttonText: "Lag All Items",
                enableMethod: () => { lagAllItemsDelay = 0; sendNotification("Lag All Items ON", false); },
                disableMethod: () => { sendNotification("Lag All Items OFF", false); },
                isTogglable: true,
                method: () => {
                    if (time <= lagAllItemsDelay) return;
                    lagAllItemsDelay = time + 0.06;
                    try {
                        var idx = 0;
                        for (var item of collectAllLobbyItemsWithHeld()) {
                            if (!item || item.isNull?.()) continue;
                            var hue = Math.floor(Math.sin((time * 1.8) + (idx * 0.73)) * 127);
                            var sat = Math.floor(45 + (Math.sin((time * 1.3) + (idx * 0.51)) * 82));
                            var scl = Math.floor(Math.sin((time * 1.1) + (idx * 0.67)) * 70);
                            try {
                                var target = item;
                                try {
                                    var gbo = item.method("GetComponent", 1).inflate(GBOClass).invoke();
                                    if (gbo && !gbo.isNull?.()) target = gbo;
                                } catch(_) {}
                                target.method("set_colorHue").invoke(hue);
                                target.method("set_colorSaturation").invoke(sat);
                                target.method("set_scaleModifier").invoke(Math.max(-35, Math.min(95, scl)));
                            } catch(_) {}
                            idx++;
                        }
                    } catch(e) { console.error("Lag All Items:", e); }
                },
                toolTip: "The old heavy random-all behavior that lags the lobby on purpose."
            }),
            new ButtonInfo({
                buttonText: "Cage All Players",
                enableMethod: () => {
                    playerCagePrefabs = [];
                    playerCageEntries = [];
                    sendNotification("Cage All Players ON", false);
                },
                disableMethod: () => {
                    for (var prefab of playerCagePrefabs) {
                        if (!prefab || prefab.isNull?.()) continue;
                        try {
                            var runner = prefab.method("get_Runner").invoke();
                            if (runner && !runner.isNull()) {
                                runner.method("Despawn").invoke(prefab);
                                continue;
                            }
                        } catch(_) {}
                        try {
                            var go = prefab.method("get_gameObject").invoke();
                            if (go && !go.isNull()) Destroy(go);
                        } catch(_) {}
                    }
                    playerCagePrefabs = [];
                    playerCageEntries = [];
                    sendNotification("Cage All Players OFF", false);
                },
                isTogglable: true,
                method: () => {
                    try {
                        var targets = getAllNetPlayersList(false);
                        if (targets.length === 0) return;
                        if (playerCageEntries.length === 0) {
                            var cageLayout = [
                                [-1.8, -0.45, -1.8], [0.0, -0.45, -1.8], [1.8, -0.45, -1.8],
                                [-1.8, -0.45,  1.8], [0.0, -0.45,  1.8], [1.8, -0.45,  1.8],
                                [-1.8,  0.95, -1.8], [0.0,  0.95, -1.8], [1.8,  0.95, -1.8],
                                [-1.8,  0.95,  1.8], [0.0,  0.95,  1.8], [1.8,  0.95,  1.8],
                                [-1.8,  0.25,  0.0], [1.8, 0.25, 0.0], [0.0, 0.25, -1.8], [0.0, 0.25, 1.8]
                            ];
                            for (var p of targets) {
                                if (!p || p.isNull?.()) continue;
                                for (var offset of cageLayout) {
                                    var spawned = spawnNetworkPrefab("ItemSellingMachineController", zeroVector, identityQuaternion);
                                    if (!spawned || spawned.isNull?.()) continue;
                                    playerCagePrefabs.push(spawned);
                                    var go = spawned.method("get_gameObject").invoke();
                                    if (!go || go.isNull()) continue;
                                    var tf = go.method("get_transform").invoke();
                                    playerCageEntries.push({ player: p, transform: tf, offset });
                                }
                            }
                        }
                        for (var cage of playerCageEntries) {
                            try {
                                var p = cage.player;
                                if (!p || p.isNull?.()) continue;
                                var pPos = getTransform(p).method("get_position").invoke();
                                var x = (pPos.field("x").value ) + cage.offset[0];
                                var y = (pPos.field("y").value ) + cage.offset[1];
                                var z = (pPos.field("z").value ) + cage.offset[2];
                                cage.transform.method("set_position").invoke([x, y, z]);
                            } catch(_) {}
                        }
                    } catch(e) { console.error("Cage All Players:", e); }
                },
                toolTip: "Cages every other player with selling machines and despawns them when disabled."
            }),
            new ButtonInfo({
                buttonText: "Delete All Lobby Items",
                method: () => {
                    if (time <= deleteAllLobbyItemsDelay) return;
                    deleteAllLobbyItemsDelay = time + 0.35;
                    try {
                        var count = 0;
                        var localPos = getTransform(bodyCollider).method("get_position").invoke();
                        var seen = new Set();
                        for (var go of collectAllLobbyItemsWithHeld()) {
                            try {
                                if (!go || go.isNull?.()) continue;
                                var rootGo = getRootLikeObject(go);
                                var rootKey = normalizeSceneObjectHandle(rootGo) || normalizeSceneObjectHandle(go);
                                if (rootKey && seen.has(rootKey)) continue;
                                if (rootKey) seen.add(rootKey);
                                requestAuthorityDeep(go);
                                requestAuthorityDeep(rootGo);
                                forceReleaseItemFromAllPlayers(go);
                                forceReleaseItemFromAllPlayers(rootGo);
                                tryReleaseHeldItem(go);
                                tryReleaseHeldItem(rootGo);
                                try { forceMoveLobbyItem(rootGo, localPos); } catch(_) {}
                                try { forceMoveLobbyItem(rootGo, localPos); } catch(_) {}
                                if (destroyNetworkedObjectDeep(rootGo) || destroyNetworkedObjectDeep(go)) count++;
                            } catch(_) {}
                        }
                        sendNotification("Deleted " + count + " lobby items!", false);
                    } catch(e) { sendNotification("Delete All Lobby Items: " + e, false); }
                },
                isTogglable: false,
                toolTip: "One-click deletes or despawns all lobby items after trying to take authority."
            }),
            new ButtonInfo({
                buttonText: "Spawn NetPlayer Trigger",
                enableMethod: () => { netPlayerSpawnDelay = 0; sendNotification("Spawn NetPlayer Trigger ON", false); },
                disableMethod: () => { sendNotification("Spawn NetPlayer Trigger OFF", false); },
                isTogglable: true,
                method: () => {
                    if (!rightTrigger || time <= netPlayerSpawnDelay) return;
                    netPlayerSpawnDelay = time + 0.12;
                    try {
                        spawnForwardLaunchedNetworkPrefab("NetPlayer", rightHandTransform, 18.0, 1.0);
                    } catch(e) { console.error("Spawn NetPlayer Trigger:", e); }
                },
                toolTip: "While enabled, pressing right trigger spawns a NetPlayer prefab forward from your hand."
            }),
            new ButtonInfo({
                buttonText: "Give Masterclient",
                isTogglable: false,
                method: () => {
                    try {
                        var runner = null;
                        try {
                            var pgInst = PrefabGen.field("_instance").value;
                            if (pgInst && !pgInst.isNull()) runner = pgInst.method("get_runner").invoke();
                        } catch(_) {}
                        if (!runner || runner.isNull?.()) {
                            try {
                                var sfx = SFXManager.field("_instance").value;
                                if (sfx && !sfx.isNull()) runner = sfx.method("get__currentRunner").invoke();
                            } catch(_) {}
                        }
                        if (!runner || runner.isNull?.()) { sendNotification("Runner is null", false); return; }
                        var localRef = runner.method("get_LocalPlayer").invoke();
                        if (!localRef) { sendNotification("LocalPlayer ref null", false); return; }
                        runner.method("SetMasterClient").invoke(localRef);
                        sendNotification("You are now the master client!", false);
                    } catch(e) { sendNotification("Masterclient: " + e, false); console.error("[Masterclient]:", e); }
                },
                toolTip: "Promotes you to master client / host using NetworkRunner.SetMasterClient."
            }),
                  new ButtonInfo({
        buttonText: "Stash Dupe",
        method: () => stashDupeEnabled = true,
        disableMethod: () => stashDupeEnabled = false,
        toolTip: "Lets you eject more times using your stash."
      }),
      new ButtonInfo({
        buttonText: "Change Eject Dupe Amount",
        method: () => {
          ejectDupeIndex++;
          ejectDupeIndex %= ejectDupeValues.length;
          ejectDupeAmount = ejectDupeValues[ejectDupeIndex];
          sendNotification(
            "[MENU] New eject dupe amount: " + ejectDupeAmount,
            false
          );
        },
        isTogglable: false,
        toolTip: "Cycles through preset dupe amounts."
      }),
     new ButtonInfo({
buttonText: "Rocket Launcher",
    method: () => {
        if (!rightGrab) return;
        if (!rightTrigger) return;
        try {
            var forward = getLaunchForward(rightHandTransform);
            var up = getLaunchUp(rightHandTransform, forward);
            var position = Vector3.method("op_Addition").invoke(
                rightHandTransform.method("get_position").invoke(),
                Vector3.method("op_Addition").invoke(
                    Vector3.method("op_Multiply", 2).invoke(forward, 0.85),
                    Vector3.method("op_Multiply", 2).invoke(up, -0.04)
                )
            );
            var rotation = getLaunchRotation(rightHandTransform, forward, up);
            spawnNetworkPrefab("RPGRocket", position, rotation);
        } catch(e) {
            console.error("RocketLauncher error: " + e);
        }
    },
    isTogglable: true,
    toolTip: "hi"
}),
new ButtonInfo({
    buttonText: "flaregun",
    method: () => {
        if (!rightGrab) return;
        if (!rightTrigger) return;
        try {
            var forward = getLaunchForward(rightHandTransform);
            var up = getLaunchUp(rightHandTransform, forward);
            var position = Vector3.method("op_Addition").invoke(
                rightHandTransform.method("get_position").invoke(),
                Vector3.method("op_Addition").invoke(
                    Vector3.method("op_Multiply", 2).invoke(forward, 0.85),
                    Vector3.method("op_Multiply", 2).invoke(up, -0.04)
                )
            );
            var rotation = getLaunchRotation(rightHandTransform, forward, up);
            spawnNetworkPrefab("FlareGunProjectile", position, rotation);
        } catch(e) {
            console.error("boomspear error: " + e);
        }
    },
    isTogglable: true,
    toolTip: "tuff"
}),
new ButtonInfo({
    buttonText: "boomspear",
    method: () => {
        if (!rightGrab) return;
        if (!rightTrigger) return;
        try {
            var forward = getLaunchForward(rightHandTransform);
            var up = getLaunchUp(rightHandTransform, forward);
            var position = Vector3.method("op_Addition").invoke(
                rightHandTransform.method("get_position").invoke(),
                Vector3.method("op_Addition").invoke(
                    Vector3.method("op_Multiply", 2).invoke(forward, 0.85),
                    Vector3.method("op_Multiply", 2).invoke(up, -0.04)
                )
            );
            var rotation = getLaunchRotation(rightHandTransform, forward, up);
            spawnNetworkPrefab("RPGRocketSpear", position, rotation);
        } catch(e) {
            console.error("boomspear error: " + e);
        }
    },
    isTogglable: true,
    toolTip: "tuff"
}),
new ButtonInfo({
    buttonText: "Robot Dog RPG",
    method: () => {
        if (!rightGrab) return;
        if (!rightTrigger) return;
        try {
            var forward = getLaunchForward(rightHandTransform);
            var up = getLaunchUp(rightHandTransform, forward);
            var position = Vector3.method("op_Addition").invoke(
                rightHandTransform.method("get_position").invoke(),
                Vector3.method("op_Addition").invoke(
                    Vector3.method("op_Multiply", 2).invoke(forward, 0.85),
                    Vector3.method("op_Multiply", 2).invoke(up, -0.04)
                )
            );
            var rotation = getLaunchRotation(rightHandTransform, forward, up);
            spawnNetworkPrefab("RobotDogRPG", position, rotation);
        } catch(e) {
            console.error("RobotDogRPG error: " + e);
        }
    },
    isTogglable: true,
    toolTip: "tuff"
}),
      new ButtonInfo({
        buttonText: "ChristmasBox Orbit self",
        method: () => {
          var center = AssemblyCSharp.class("AnimalCompany.PlayerController").method("get_instance").invoke().method("get_head").invoke();
          function spawnorbitobject() {
            orbiters = [];
            for (var i = 0; i < 8; i++) {
              var angle = Math.PI * 2 / 8 * i;
              var offset = Vector3.alloc();
              offset.method(".ctor").overload("System.Single", "System.Single", "System.Single").invoke(Math.cos(angle) * 6.5, 0, Math.sin(angle) * 6.5);
              var centerPos2 = center.method("get_position").invoke();
              var spawnPos = Vector3.method("op_Addition").invoke(centerPos2, [offset.field("x").value, offset.field("y").value, offset.field("z").value]);
              var no = spawnNetworkPrefab("ChristmasBox", spawnPos, Quaternion.method("get_identity").invoke());
              if (!no) continue;
              orbitprefabs.push(no);
              var go = no.method("get_gameObject").invoke();
              if (!go) continue;
              var tf = go.method("get_transform").invoke();
              orbiters.push({ transform: tf, angle });
            }
          }
          if (orbitprefabs.length < 4) spawnorbitobject();
          var delta = Time.method("get_deltaTime").invoke();
          var centerPos = center.method("get_position").invoke();
          for (var orb of orbiters) {
            orb.angle += 1.5 * delta;
            var offset = Vector3.alloc();
            offset.method(".ctor").overload("System.Single", "System.Single", "System.Single").invoke(Math.cos(orb.angle) * 6.5, 0, Math.sin(orb.angle) * 6.5);
            var newPos = Vector3.method("op_Addition").invoke(centerPos, [offset.field("x").value, offset.field("y").value, offset.field("z").value]);
            orb.transform.method("set_position").invoke(newPos);
          }
        },
        disableMethod: () => {
          for (var i = 0; i < orbitprefabs.length; i++) {
            var prefab = orbitprefabs[i];
            if (!prefab || prefab.isNull?.()) continue;
            try {
              var runner = prefab.method("get_Runner").invoke();
              if (runner && !runner.isNull()) {
                runner.method("Despawn").invoke(prefab);
              }
            } catch(_) {}
          }
          orbitprefabs = [];
          orbiters = [];
        },
        isTogglable: true,
        toolTip: "Creates 8 selling machines that orbit you."
      }),
new ButtonInfo({
    buttonText: "egg",
    method: () => {
        if (!rightGrab) return;
        if (!rightTrigger) return;
        try {
            var forward = getLaunchForward(rightHandTransform);
            var up = getLaunchUp(rightHandTransform, forward);
            var position = Vector3.method("op_Addition").invoke(
                rightHandTransform.method("get_position").invoke(),
                Vector3.method("op_Addition").invoke(
                    Vector3.method("op_Multiply", 2).invoke(forward, 0.85),
                    Vector3.method("op_Multiply", 2).invoke(up, -0.04)
                )
            );
            var rotation = getLaunchRotation(rightHandTransform, forward, up);
            spawnNetworkPrefab("RPGRocketEgg", position, rotation);
        } catch(e) {
            console.error("boomspear error: " + e);
        }
    },
    isTogglable: true,
    toolTip: "tuff"
}),
      new ButtonInfo({
        buttonText: "Christmas Present Tower",
        method: () => {
          var center = AssemblyCSharp.class("AnimalCompany.PlayerController").method("get_instance").invoke().method("get_head").invoke();
          function spawnChristmasTower() {
            orbiters = [];
            var heights = [-6.0, -4.0, -2.0, 0.0, 2.0, 4.0, 6.0];
            for (var h = 0; h < heights.length; h++) {
              for (var i = 0; i < 12; i++) {
                var angle = (Math.PI * 2 / 12) * i;
                var offset = Vector3.alloc();
                offset.method(".ctor").overload("System.Single", "System.Single", "System.Single").invoke(Math.cos(angle) * 4.8, heights[h], Math.sin(angle) * 4.8);
                var centerPos2 = center.method("get_position").invoke();
                var spawnPos = Vector3.method("op_Addition").invoke(centerPos2, [offset.field("x").value, offset.field("y").value, offset.field("z").value]);
                var no = spawnNetworkPrefab("ChristmasBox", spawnPos, Quaternion.method("get_identity").invoke());
                if (!no) continue;
                orbitprefabs.push(no);
                var go = no.method("get_gameObject").invoke();
                if (!go) continue;
                var tf = go.method("get_transform").invoke();
                orbiters.push({ transform: tf, angle, height: heights[h] });
              }
            }
          }
          if (orbitprefabs.length < 10) spawnChristmasTower();
          var delta = Time.method("get_deltaTime").invoke();
          var centerPos = center.method("get_position").invoke();
          for (var orb of orbiters) {
            orb.angle += 0.85 * delta;
            var offset = Vector3.alloc();
            offset.method(".ctor").overload("System.Single", "System.Single", "System.Single").invoke(Math.cos(orb.angle) * 4.8, orb.height, Math.sin(orb.angle) * 4.8);
            var newPos = Vector3.method("op_Addition").invoke(centerPos, [offset.field("x").value, offset.field("y").value, offset.field("z").value]);
            orb.transform.method("set_position").invoke(newPos);
          }
        },
        disableMethod: () => {
          for (var i = 0; i < orbitprefabs.length; i++) {
            var prefab = orbitprefabs[i];
            if (!prefab || prefab.isNull?.()) continue;
            try {
              var runner = prefab.method("get_Runner").invoke();
              if (runner && !runner.isNull()) runner.method("Despawn").invoke(prefab);
            } catch(_) {}
          }
          orbitprefabs = [];
          orbiters = [];
        },
        isTogglable: true,
        toolTip: "Creates a 7-story tower of Christmas presents around you."
      }),
      new ButtonInfo({
        buttonText: "Sellingmachine Orbit self",
        method: () => {
          var center = AssemblyCSharp.class("AnimalCompany.PlayerController").method("get_instance").invoke().method("get_head").invoke();
          function spawnorbitobject() {
            orbiters = [];
            for (var i = 0; i < 8; i++) {
              var angle = Math.PI * 2 / 8 * i;
              var offset = Vector3.alloc();
              offset.method(".ctor").overload("System.Single", "System.Single", "System.Single").invoke(Math.cos(angle) * 6.5, 0, Math.sin(angle) * 6.5);
              var centerPos2 = center.method("get_position").invoke();
              var spawnPos = Vector3.method("op_Addition").invoke(centerPos2, [offset.field("x").value, offset.field("y").value, offset.field("z").value]);
              var no = spawnNetworkPrefab("ItemSellingMachineController", spawnPos, Quaternion.method("get_identity").invoke());
              if (!no) continue;
              orbitprefabs.push(no);
              var go = no.method("get_gameObject").invoke();
              if (!go) continue;
              var tf = go.method("get_transform").invoke();
              orbiters.push({ transform: tf, angle });
            }
          }
          if (orbitprefabs.length < 4) spawnorbitobject();
          var delta = Time.method("get_deltaTime").invoke();
          var centerPos = center.method("get_position").invoke();
          for (var orb of orbiters) {
            orb.angle += 1.5 * delta;
            var offset = Vector3.alloc();
            offset.method(".ctor").overload("System.Single", "System.Single", "System.Single").invoke(Math.cos(orb.angle) * 6.5, 0, Math.sin(orb.angle) * 6.5);
            var newPos = Vector3.method("op_Addition").invoke(centerPos, [offset.field("x").value, offset.field("y").value, offset.field("z").value]);
            orb.transform.method("set_position").invoke(newPos);
          }
        },
        disableMethod: () => {
          for (var i = 0; i < orbitprefabs.length; i++) {
            var prefab = orbitprefabs[i];
            if (!prefab) return;
            var runner = prefab.method("get_Runner").invoke();
            if (runner && !runner.isNull()) {
              runner.method("Despawn").invoke(prefab);
            }
          }
          orbitprefabs = [];
          orbiters = [];
        },
        isTogglable: true,
        toolTip: "Creates 8 selling machines that orbit you."
      }),
      new ButtonInfo({
        buttonText: "Sellingmachine Tower Orbit",
        method: () => {
          var center = AssemblyCSharp.class("AnimalCompany.PlayerController").method("get_instance").invoke().method("get_head").invoke();
          function spawnSellingTowerOrbit() {
            sellingTowerOrbiters = [];
            var heights = [-3.3, 0.0, 3.3];
            for (var h = 0; h < heights.length; h++) {
              for (var i = 0; i < 24; i++) {
                var angle = (Math.PI * 2 / 24) * i;
                var offset = Vector3.alloc();
                offset.method(".ctor").overload("System.Single", "System.Single", "System.Single").invoke(Math.cos(angle) * 5.6, heights[h], Math.sin(angle) * 5.6);
                var centerPos2 = center.method("get_position").invoke();
                var spawnPos = Vector3.method("op_Addition").invoke(centerPos2, [offset.field("x").value, offset.field("y").value, offset.field("z").value]);
                var no = spawnNetworkPrefab("ItemSellingMachineController", spawnPos, Quaternion.method("get_identity").invoke());
                if (!no) continue;
                sellingTowerOrbitPrefabs.push(no);
                var go = no.method("get_gameObject").invoke();
                if (!go) continue;
                var tf = go.method("get_transform").invoke();
                sellingTowerOrbiters.push({ transform: tf, angle, height: heights[h] });
              }
            }
          }
          if (sellingTowerOrbitPrefabs.length < 10) spawnSellingTowerOrbit();
          var delta = Time.method("get_deltaTime").invoke();
          var centerPos = center.method("get_position").invoke();
          for (var orb of sellingTowerOrbiters) {
            orb.angle += 0.95 * delta;
            var offset = Vector3.alloc();
            offset.method(".ctor").overload("System.Single", "System.Single", "System.Single").invoke(Math.cos(orb.angle) * 5.6, orb.height, Math.sin(orb.angle) * 5.6);
            var newPos = Vector3.method("op_Addition").invoke(centerPos, [offset.field("x").value, offset.field("y").value, offset.field("z").value]);
            orb.transform.method("set_position").invoke(newPos);
          }
        },
        disableMethod: () => {
          sellingTowerOrbiters = [];
          sellingTowerOrbitPrefabs = [];
          sendNotification("Selling machine tower frozen in place", false);
        },
        isTogglable: true,
        toolTip: "Creates a dense 3-story selling machine orbit and leaves it in place when disabled."
      }),
      new ButtonInfo({
        buttonText: "Moon Buggy Orbit self",
        method: () => {
          var center = AssemblyCSharp.class("AnimalCompany.PlayerController").method("get_instance").invoke().method("get_head").invoke();
          function spawnBuggyOrbitObject() {
            buggyOrbiters = [];
            for (var i = 0; i < 8; i++) {
              var angle = Math.PI * 2 / 8 * i;
              var offset = Vector3.alloc();
              offset.method(".ctor").overload("System.Single", "System.Single", "System.Single").invoke(Math.cos(angle) * 7.0, 0.4, Math.sin(angle) * 7.0);
              var centerPos2 = center.method("get_position").invoke();
              var spawnPos = Vector3.method("op_Addition").invoke(centerPos2, [offset.field("x").value, offset.field("y").value, offset.field("z").value]);
              var no = spawnNetworkPrefab("Vehicle_Buggy", spawnPos, Quaternion.method("get_identity").invoke());
              if (!no) continue;
              buggyOrbitPrefabs.push(no);
              var go = no.method("get_gameObject").invoke();
              if (!go) continue;
              var tf = go.method("get_transform").invoke();
              buggyOrbiters.push({ transform: tf, angle });
            }
          }
          if (buggyOrbitPrefabs.length < 4) spawnBuggyOrbitObject();
          var delta = Time.method("get_deltaTime").invoke();
          var centerPos = center.method("get_position").invoke();
          for (var orb of buggyOrbiters) {
            orb.angle += 1.15 * delta;
            var offset = Vector3.alloc();
            offset.method(".ctor").overload("System.Single", "System.Single", "System.Single").invoke(Math.cos(orb.angle) * 7.0, 0.4, Math.sin(orb.angle) * 7.0);
            var newPos = Vector3.method("op_Addition").invoke(centerPos, [offset.field("x").value, offset.field("y").value, offset.field("z").value]);
            orb.transform.method("set_position").invoke(newPos);
          }
        },
        disableMethod: () => {
          for (var i = 0; i < buggyOrbitPrefabs.length; i++) {
            var prefab = buggyOrbitPrefabs[i];
            if (!prefab || prefab.isNull?.()) continue;
            try {
              var runner = prefab.method("get_Runner").invoke();
              if (runner && !runner.isNull()) {
                runner.method("Despawn").invoke(prefab);
              }
            } catch(_) {}
          }
          buggyOrbitPrefabs = [];
          buggyOrbiters = [];
        },
        isTogglable: true,
        toolTip: "Creates 8 buggies that orbit around you."
      }),
      new ButtonInfo({
        buttonText: "Tree Forest Orbit",
        method: () => {
          var center = AssemblyCSharp.class("AnimalCompany.PlayerController").method("get_instance").invoke().method("get_head").invoke();
          function spawnSharkOrbitObject() {
            sharkOrbiters = [];
            for (var i = 0; i < 10; i++) {
              var angle = Math.PI * 2 / 10 * i;
              var offset = Vector3.alloc();
              offset.method(".ctor").overload("System.Single", "System.Single", "System.Single").invoke(Math.cos(angle) * 6.0, 0.0, Math.sin(angle) * 6.0);
              var centerPos2 = center.method("get_position").invoke();
              var spawnPos = Vector3.method("op_Addition").invoke(centerPos2, [offset.field("x").value, offset.field("y").value, offset.field("z").value]);
              var no = spawnNetworkPrefab("ChoppableTreeManager", spawnPos, Quaternion.method("get_identity").invoke());
              if (!no) continue;
              sharkOrbitPrefabs.push(no);
              var go = no.method("get_gameObject").invoke();
              if (!go) continue;
              var tf = go.method("get_transform").invoke();
              sharkOrbiters.push({ transform: tf, angle });
            }
          }
          if (sharkOrbitPrefabs.length < 4) spawnSharkOrbitObject();
          var delta = Time.method("get_deltaTime").invoke();
          var centerPos = center.method("get_position").invoke();
          for (var orb of sharkOrbiters) {
            orb.angle += 1.2 * delta;
            var offset = Vector3.alloc();
            offset.method(".ctor").overload("System.Single", "System.Single", "System.Single").invoke(Math.cos(orb.angle) * 6.0, 0.0, Math.sin(orb.angle) * 6.0);
            var newPos = Vector3.method("op_Addition").invoke(centerPos, [offset.field("x").value, offset.field("y").value, offset.field("z").value]);
            orb.transform.method("set_position").invoke(newPos);
          }
        },
        disableMethod: () => {
          for (var prefab of sharkOrbitPrefabs) {
            if (!prefab || prefab.isNull?.()) continue;
            try {
              var runner = prefab.method("get_Runner").invoke();
              if (runner && !runner.isNull()) runner.method("Despawn").invoke(prefab);
            } catch(_) {}
            try { destroyNetworkedObjectDeep(prefab); } catch(_) {}
            try {
              var go = prefab.method("get_gameObject").invoke();
              if (go && !go.isNull?.()) Destroy(go);
            } catch(_) {}
          }
          sharkOrbitPrefabs = [];
          sharkOrbiters = [];
        },
        isTogglable: true,
        toolTip: "Creates a normal orbit of forest trees around you."
      }),
new ButtonInfo({
    buttonText: "Infinite Ammo",
    enableMethod: () => { InfAmmo = true; },
    disableMethod: () => { InfAmmo = false; },
    isTogglable: true,
    toolTip: "Infinite ammo"
}),
new ButtonInfo({
    buttonText: "No Recoil",
    enableMethod: () => { noRecoil = true; },
    disableMethod: () => { noRecoil = false; },
    isTogglable: true,
    toolTip: "Removes recoil force and spread on all guns (Revolver, Shotgun, Arena guns)."
}),
new ButtonInfo({
    buttonText: "No Shotgun Cooldown",
    enableMethod: () => { noShotgunCooldown = true; },
    disableMethod: () => { noShotgunCooldown = false; },
    isTogglable: true,
    toolTip: "Removes the reload/cooldown delay between shotgun shots."
}),
new ButtonInfo({
        buttonText: "Rapid Fire",
        enableMethod: () => { rapidFireEnabled = true; },
        disableMethod: () => { rapidFireEnabled = false; },
        method: () => {
          try {
            var pulseMethod = (held, names[], parameterCount, ...args[]) => {
              for (var name of names) {
                try {
                  var method = tryMethodName(held.class, [name], parameterCount);
                  if (method) invokeInstance(method, held, ...args);
                } catch(_) {}
              }
            };
            var pulseRevolverSecondary = (held) => {
              try {
                pulseMethod(held, ["HandleSecondaryUse", "HandleGripUse", "CockHammer", "PullBackHammer"], 0);
                pulseMethod(held, ["HandleSecondaryButton", "HandleSecondaryUse", "HandleGripUse", "CockHammer", "PullBackHammer"], 1, true);
                pulseMethod(held, ["HandleSecondaryButton", "HandleSecondaryUse", "HandleGripUse"], 1, false);
                pulseMethod(held, ["OnSecondaryButtonDown", "OnSecondaryUseDown"], 0);
                pulseMethod(held, ["OnSecondaryButtonUp", "OnSecondaryUseUp"], 0);
              } catch(_) {}
            };
            var fireHeldRapid = (held, pressed) => {
              if (!held || !pressed) return;
              if (time <= rapidFirePulseDelay) return;
              rapidFirePulseDelay = time + 0.018;
              try {
                var heldClassName = String(held.class?.type?.name ?? "").toLowerCase();
                try { applyGunBuffsToGrabbable(held, false); } catch(_) {}
                if (heldClassName.indexOf("revolver") >= 0) {
                  try { held.field("_isHammerCocked").value = true; } catch(_) {}
                  try { held.field("isHammerCocked").value = true; } catch(_) {}
                  try { held.field("_ammoLoaded").value = 255; } catch(_) {}
                  try { held.field("ammoLoaded").value = 255; } catch(_) {}
                  try { held.field("_reloadTimer").value = 0.0; } catch(_) {}
                  try { held.field("_triggerUseCooldown").value = 0.0; } catch(_) {}
                  try { held.field("_secondaryUseCooldown").value = 0.0; } catch(_) {}
                  try { held.field("_hammerPullbackAmount").value = 1.0; } catch(_) {}
                  try { held.method("set_isHammerCocked").invoke(true); } catch(_) {}
                  pulseRevolverSecondary(held);
                }
                try { held.method("HandleTriggerUse").invoke(); } catch(_) {}
                if (heldClassName.indexOf("revolver") >= 0) {
                  try { held.field("_triggerUseCooldown").value = 0.0; } catch(_) {}
                  try { held.field("_secondaryUseCooldown").value = 0.0; } catch(_) {}
                  try { held.method("set_isHammerCocked").invoke(true); } catch(_) {}
                  for (var i = 0; i < 3; i++) {
                    tryCallNames(held, ["OnBButtonDown", "HandleBButtonDown", "PressBButton"], 0);
                    tryCallNames(held, ["HandleBButton", "HandleSecondaryButton", "HandleSecondaryUse"], 1, true);
                    tryCallNames(held, ["HandleBButton", "HandleSecondaryButton", "HandleSecondaryUse"], 1, false);
                  }
                  pulseRevolverSecondary(held);
                }
              } catch(_) {}
            };
            var player = NetPlayer.method("get_localPlayer").invoke();
            if (!player) return;
            var interactor = player.method("GetHandInteractor", 1).invoke(1);
            var grabbable = null;
            if (interactor) {
              try {
                var itemAnchor = interactor.field("_itemAnchor").value;
                if (itemAnchor) grabbable = itemAnchor.method("get_grabbableObject").invoke();
              } catch(_) {}
            }
            var interactor2 = player.method("GetHandInteractor", 1).invoke(0);
            var grabbable2 = null;
            if (interactor2) {
              try {
                var itemAnchor2 = interactor2.field("_itemAnchor").value;
                if (itemAnchor2) grabbable2 = itemAnchor2.method("get_grabbableObject").invoke();
              } catch(_) {}
            }
            fireHeldRapid(grabbable, rightTrigger);
            fireHeldRapid(grabbable2, leftTrigger);
          } catch (e) {
            console.error(e);
          }
        },
        isTogglable: true,
        toolTip: "Rapid fires trigger items and also force-cocks revolvers when possible."
      }),
            new ButtonInfo({
                buttonText: "Nut Pickup Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    var ray = gunData.ray;
                    if (!ray || ray.handle.isNull()) return;
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.15;
                        try {
                            var hitPoint = ray.method("get_point").invoke();
                            PickupManager.method("SpawnPickup", 4).invoke(2, hitPoint, 5, true);
                        } catch(e) { sendNotification("Nut Pickup Gun: " + e, false); }
                    }
                },
                toolTip: "Spawns nut pickups where you aim (hold grip + trigger)."
            }),
            new ButtonInfo({
                buttonText: "Ammo Pickup Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    var ray = gunData.ray;
                    if (!ray || ray.handle.isNull()) return;
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.15;
                        try {
                            var hitPoint = ray.method("get_point").invoke();
                            PickupManager.method("SpawnPickup", 4).invoke(1, hitPoint, 5, true);
                        } catch(e) { sendNotification("Ammo Pickup Gun: " + e, false); }
                    }
                },
                toolTip: "Spawns ammo pickups where you aim (hold grip + trigger)."
            }),
            new ButtonInfo({
                buttonText: "Dump Net Objects",
                method: () => {
                    try {
                        var runner = PrefabGen.field("_instance").value.method("get_runner").invoke();
                        if (!runner || runner.isNull()) {
                            sendNotification("No runner â€” join a room first", false, 4);
                            return;
                        }
                        var sources = runner.field("_config").value
                            .field("PrefabTable").value
                            .field("_sources").value;
                        var count = sources.method("get_Count").invoke() ;
                        console.log("[DumpNetObj] â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");
                        console.log("[DumpNetObj] NetworkObject prefab table â€” " + count + " entries:");
                        var names[] = [];
                        for (var i = 0; i < count; i++) {
                            try {
                                var source = sources.method("get_Item").invoke(i);
                                var desc = source.method("get_Description").invoke().toString();
                                console.log("[DumpNetObj]  [" + i + "] " + desc);
                                names.push(desc);
                            } catch(_) {
                                console.log("[DumpNetObj]  [" + i + "] <error reading entry>");
                            }
                        }
                        console.log("[DumpNetObj] â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");
                        sendNotification("Dumped " + count + " net prefabs â€” see Frida log", false, 5);
                    } catch(e) {
                        sendNotification("Dump Net Objects: " + e, false, 5);
                        console.error("[DumpNetObj] Error:", e);
                    }
                },
                isTogglable: false,
                toolTip: "Logs every spawnable NetworkObject prefab name from the Fusion PrefabTable to the Frida console."
            }),
                new ButtonInfo({
                buttonText: "Unlock All",
                isTogglable: false,
                method: () => {
                    try {
                        var AppClass = AssemblyCSharp.class("AnimalCompany.App");
                        var appState = AppClass.method("get_state").invoke();
                        if (!appState || appState.isNull()) { sendNotification("No app state", false); return; }
                        try {
                            var GISCls = AssemblyCSharp.class("AnimalCompany.GameplayItemState");
                            GISCls.method("get_isHidden").implementation = function() { return false; };
                        } catch(_) {}
                        var unlockedSet = null;
                        try {
                            var userState = appState.method("get_user").invoke();
                            if (userState && !userState.isNull()) {
                                var inv = userState.method("get_inventory").invoke();
                                if (inv && !inv.isNull()) {
                                    unlockedSet = inv.method("get_unlockedGameplayItems").invoke();
                                    try {
                                        var devOverride = inv.method("get_devOwnAllAvatarItemsOverride").invoke();
                                        if (devOverride && !devOverride.isNull()) devOverride.method("set_value").invoke(true);
                                    } catch(_) {}
                                }
                            }
                        } catch(e) { console.error("[UnlockAll] inventory:", e); }
                        var unlockedItems = 0;
                        try {
                            var gameplayItems = appState.method("get_gameplayItems").invoke();
                            if (gameplayItems && !gameplayItems.isNull()) {
                                var allDict = gameplayItems.method("get_all").invoke();
                                if (allDict && !allDict.isNull()) {
                                    var values = allDict.method("get_Values").invoke();
                                    if (values && !values.isNull()) {
                                        var enumerator = values.method("GetEnumerator").invoke();
                                        while (enumerator.method("MoveNext").invoke()) {
                                            try {
                                                var item = enumerator.method("get_Current").invoke();
                                                if (!item || item.isNull()) continue;
                                                try {
                                                    var isUnlocked = item.method("get_isUnlocked").invoke();
                                                    if (isUnlocked && !isUnlocked.isNull()) isUnlocked.method("set_value").invoke(true);
                                                } catch(_) {}
                                                try {
                                                    var depsSatisfied = item.method("get_unlockDependenciesSatisfied").invoke();
                                                    if (depsSatisfied && !depsSatisfied.isNull()) depsSatisfied.method("set_value").invoke(true);
                                                } catch(_) {}
                                                try {
                                                    var unlockable = item.method("get_unlockable").invoke();
                                                    if (unlockable && !unlockable.isNull()) unlockable.method("set_value").invoke(true);
                                                } catch(_) {}
                                                try {
                                                    var itemID = item.method("get_id").invoke();
                                                    if (itemID && unlockedSet && !unlockedSet.isNull()) {
                                                        unlockedSet.method("Add").invoke(itemID);
                                                    }
                                                } catch(_) {}
                                                unlockedItems++;
                                            } catch(_) {}
                                        }
                                    }
                                }
                            }
                        } catch(e) { console.error("[UnlockAll] gameplayItems:", e); }
                        var unlockedAvatarItems = 0;
                        try {
                            var avatarItems = appState.method("get_avatarItems").invoke();
                            if (avatarItems && !avatarItems.isNull()) {
                                var allDict = avatarItems.method("get_all").invoke();
                                if (allDict && !allDict.isNull()) {
                                    var values = allDict.method("get_Values").invoke();
                                    if (values && !values.isNull()) {
                                        var enumerator = values.method("GetEnumerator").invoke();
                                        while (enumerator.method("MoveNext").invoke()) {
                                            try {
                                                var item = enumerator.method("get_Current").invoke();
                                                if (!item || item.isNull()) continue;
                                                try {
                                                    var isOwned = item.method("get_isOwned").invoke();
                                                    if (isOwned && !isOwned.isNull()) isOwned.method("set_value").invoke(true);
                                                } catch(_) {}
                                                try {
                                                    var canPurchase = item.method("get_canPurchaseDirectly").invoke();
                                                    if (canPurchase && !canPurchase.isNull()) canPurchase.method("set_value").invoke(true);
                                                } catch(_) {}
                                                try {
                                                    var isDevItem = item.method("get_isDevItem")?.invoke();
                                                    if (isDevItem && !isDevItem.isNull()) isDevItem.method("set_value").invoke(true);
                                                } catch(_) {}
                                                unlockedAvatarItems++;
                                            } catch(_) {}
                                        }
                                    }
                                }
                            }
                        } catch(e) { console.error("[UnlockAll] avatarItems:", e); }
                        sendNotification("Unlocked " + unlockedItems + " items + " + unlockedAvatarItems + " cosmetics (dev included)!", false);
                    } catch(e) { sendNotification("Unlock All: " + e, false); console.error("[UnlockAll]", e); }
                },
                toolTip: "Unlocks all gameplay + cosmetic items including hidden/dev items. Hooks get_isHidden=false so dev items show in UI."
            }),
            new ButtonInfo({
                buttonText: "Dev Mode",
                isTogglable: false,
                method: () => {
                    try {
                        var AppClass = AssemblyCSharp.class("AnimalCompany.App");
                        var appState = AppClass.method("get_state").invoke();
                        if (!appState || appState.isNull()) { sendNotification("No app state", false); return; }
                        try {
                            var userState = appState.method("get_user").invoke();
                            if (userState && !userState.isNull()) {
                                var isDev = userState.method("get_isDeveloper").invoke();
                                if (isDev && !isDev.isNull()) {
                                    isDev.method("set_value").invoke(true);
                                }
                            }
                        } catch(e) { console.error("[GiveDev] isDeveloper:", e); }
                        try {
                            var mapMachine = appState.method("get_mapMachine").invoke();
                            if (mapMachine && !mapMachine.isNull()) {
                                var useDevMode = mapMachine.method("get_useDevMode").invoke();
                                if (useDevMode && !useDevMode.isNull()) {
                                    useDevMode.method("set_value").invoke(true);
                                }
                            }
                        } catch(e) { console.error("[GiveDev] useDevMode:", e); }
                        sendNotification("Dev mode enabled!", false);
                    } catch(e) { sendNotification("Give Dev: " + e, false); console.error("[GiveDev]", e); }
                },
                toolTip: "One-shot developer mode enable using the old app-state write path."
            }),
            new ButtonInfo({
                buttonText: "Force Dev Mode",
                enableMethod: () => {
                    forceDevModeEnabled = true;
                    tryForceDeveloperMode();
                    sendNotification("Force Dev Mode ON", false);
                },
                disableMethod: () => {
                    forceDevModeEnabled = false;
                    sendNotification("Force Dev Mode OFF", false);
                },
                isTogglable: true,
                toolTip: "Continuously forces developer mode and dev menu state every frame."
            }),
            new ButtonInfo({
                buttonText: "Dump Menu TXT",
                method: () => {
                    var path = dumpMenuToTextFile();
                    if (path) sendNotification("Dumped menu to monkongs_menu_dump.txt", false);
                    else sendNotification("Dump menu failed", false);
                },
                isTogglable: false,
                toolTip: "Dumps the full runtime menu/button/id layout to a txt file beside this script."
            }),
            new ButtonInfo({
                buttonText: "Inf Damage",
                enableMethod: () => { infDamage = true; },
                disableMethod: () => { infDamage = false; },
                isTogglable: true,
                toolTip: "Makes all weapons deal 999999 damage per shot/hit."
            }),
        ],
        [ 
            new ButtonInfo({
                buttonText: "Exit Whitelist mods",
                method: () => { currentCategory = 5; currentPage = 0; },
                isTogglable: false,
                toolTip: "Returns to Other Players."
            }),
            new ButtonInfo({
                buttonText: "Toggle Whitelist",
                method: () => {
                    whitelistEnabled = !whitelistEnabled;
                    sendNotification("Whitelist: " + (whitelistEnabled ? "ON" : "OFF"), false);
                    reloadMenu();
                },
                isTogglable: false,
                toolTip: "Enables or disables the whitelist system."
            }),
            new ButtonInfo({
                buttonText: "WL Gun Add",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.5;
                        try {
                            var target = getWhitelistGunTarget(gunData, false, 10.0);
                            if (!target || !target.player) { sendNotification("No player there", false); return; }
                            var id = getPlayerName(target.player);
                            if (!whitelistHasPlayer(target.player)) {
                                whitelistAddPlayer(target.player);
                                sendNotification("Added to whitelist: " + id, false);
                            } else {
                                sendNotification("Already whitelisted: " + id, false);
                            }
                        } catch(e) { console.error("WL Gun Add:", e); }
                    }
                },
                toolTip: "Point at a player and pull trigger to add to whitelist (hold grip)."
            }),
            new ButtonInfo({
                buttonText: "WL Gun Remove",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.5;
                        try {
                            var target = getWhitelistGunTarget(gunData, false, 10.0);
                            if (!target || !target.player) { sendNotification("No player there", false); return; }
                            var id = getPlayerName(target.player);
                            if (whitelistHasPlayer(target.player)) {
                                whitelistRemovePlayer(target.player);
                                sendNotification("Removed from whitelist: " + id, false);
                            } else {
                                sendNotification("Not in whitelist: " + id, false);
                            }
                        } catch(e) { console.error("WL Gun Remove:", e); }
                    }
                },
                toolTip: "Point at a player and pull trigger to remove from whitelist (hold grip)."
            }),
            new ButtonInfo({
                buttonText: "Clear Whitelist",
                method: () => {
                    whitelist = [];
                    sendNotification("Whitelist cleared!", false);
                },
                isTogglable: false,
                toolTip: "Removes all players from the whitelist."
            }),
            new ButtonInfo({
                buttonText: "List Whitelist",
                method: () => {
                    if (whitelist.length === 0) { sendNotification("Whitelist is empty", false, 4); return; }
                    sendNotification("WL: " + whitelist.join(", "), false, 8);
                },
                isTogglable: false,
                toolTip: "Shows all whitelisted players."
            }),
            new ButtonInfo({
                buttonText: "WL Give Fly Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.03;
                        try {
                            var target = getWhitelistGunTarget(gunData, true, 10.0);
                            if (!target || !target.player) { sendNotification("No player there", false); return; }
                            var originTf = getPlayerHandAnchorTransform(target.player, 1) ?? getPlayerProjectileOriginTransform(target.player);
                            var forward = originTf && !originTf.isNull?.()
                                ? getLaunchForward(originTf, getTransform(target.player))
                                : getLaunchForward(getTransform(target.player), getTransform(headCollider));
                            target.player.method("RPC_AddForce").invoke(
                                Vector3.method("op_Addition").invoke(
                                    Vector3.method("op_Multiply", 2).invoke(forward, 0.34),
                                    [0, 0.03, 0]
                                )
                            );
                            sendNotification("Gave fly boost to " + target.id, false);
                        } catch(e) { console.error("Give Fly Gun:", e); }
                    }
                },
                toolTip: "Point at a player and give them a smooth forward fly force (hold grip)."
            }),
            new ButtonInfo({
                buttonText: "Give Bag Bomb Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 1.0;
                        try {
                            var target = getWhitelistGunTarget(gunData, true, 10.0);
                            if (!target || !target.player) { sendNotification("No player there", false); return; }
                            function randBW(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
                            var targetPos = getTransform(target.player).method("get_position").invoke();
                            var bagIDs = ["item_backpack_large_clover","item_backpack_large_basketball","item_backpack_large_base"];
                            var bagResult = PrefabGen.method("SpawnItem", 4).invoke(
                                Il2Cpp.string("item_prefab/" + bagIDs[randBW(0, bagIDs.length - 1)]),
                                targetPos, identityQuaternion,
                                NULL
                            );
                            if (!bagResult || bagResult.isNull()) return;
                            var bagBackpack = bagResult.method("GetComponent", 1).inflate(BackpackItemClass).invoke();
                            for (var i = 0; i < 10; i++) {
                                try {
                                    var child = PrefabGen.method("SpawnItem", 4).invoke(
                                        Il2Cpp.string("item_prefab/" + itemIDs[randBW(0, itemIDs.length - 1)]),
                                        targetPos, identityQuaternion,
                                        NULL
                                    );
                                    if (!child || child.isNull()) continue;
                                    if (bagBackpack && !bagBackpack.isNull()) {
                                        var childGBI = child.method("GetComponent", 1).inflate(GBIClass).invoke();
                                        if (childGBI && !childGBI.isNull()) {
                                            try { childGBI.method("AddToBag").invoke(bagBackpack); } catch(_) {
                                                try { childGBI.method("AddToBagInternal").invoke(bagBackpack); } catch(_) {}
                                            }
                                        }
                                    }
                                } catch(_) {}
                            }
                            try { if (bagBackpack && !bagBackpack.isNull()) bagBackpack.method("Explode").invoke(); } catch(_) {}
                            sendNotification("Gave bag bomb to " + target.id + "!", false);
                        } catch(e) { console.error("Give Bag Bomb Gun:", e); }
                    }
                },
                toolTip: "Point at a player to spawn a bag bomb near them (hold grip)."
            }),
            new ButtonInfo({
                buttonText: "Give Items Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.5;
                        try {
                            var target = getWhitelistGunTarget(gunData, true, 10.0);
                            if (!target || !target.player) { sendNotification("No player there", false); return; }
                            var targetPos = getTransform(target.player).method("get_position").invoke();
                            PrefabGen.method("SpawnItem", 4).invoke(
                                Il2Cpp.string("item_prefab/" + itemIDs[itemIndex]),
                                targetPos, identityQuaternion,
                                NULL
                            );
                            sendNotification("Gave " + itemIDs[itemIndex] + " to " + target.id, false);
                        } catch(e) { console.error("Give Items Gun:", e); }
                    }
                },
                toolTip: "Point at a player to spawn the selected item near them."
            }),
            new ButtonInfo({
                buttonText: "Revive WL Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.5;
                        try {
                            var pointerPos = getTransform(gunData.gunPointer).method("get_position").invoke();
                            var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                            var vals = playerDict.method("get_Values").invoke();
                            var en = vals.method("GetEnumerator").invoke();
                            var nearest = null, nearestDist = 10.0;
                            while (en.method("MoveNext").invoke()) {
                                var p = en.method("get_Current").invoke();
                                if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                                if (whitelistEnabled && !whitelistHasPlayer(p)) continue;
                                try { if (!p.method("get_isDie").invoke()) continue; } catch(_) { continue; }
                                var dist = Vector3.method("Distance").invoke(getTransform(p).method("get_position").invoke(), pointerPos);
                                if (dist < nearestDist) { nearestDist = dist; nearest = p; }
                            }
                            if (nearest) {
                                nearest.method("RPC_DoPlayerDie").invoke(false);
                                sendNotification("Revived whitelisted player!", false);
                            } else {
                                sendNotification("No dead WL player near pointer", false);
                            }
                        } catch(e) { console.error("Revive WL Gun:", e); }
                    }
                },
                toolTip: "Point at dead whitelisted player to revive them (hold grip)."
            }),
            new ButtonInfo({
                buttonText: "WL TP To Me Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.5;
                        try {
                            var target = getWhitelistGunTarget(gunData, true, 10.0);
                            if (!target || !target.player) { sendNotification("No player there", false); return; }
                            if (target.blocked) { sendNotification("Not whitelisted: " + target.id, false); return; }
                            var me = NetPlayer.method("get_localPlayer").invoke();
                            if (!me || me.handle.isNull()) return;
                            var myPos = getTransform(me).method("get_position").invoke();
                            target.player.method("RPC_Teleport").invoke(myPos);
                            sendNotification("TP'd " + target.id + " to you!", false);
                        } catch(e) { console.error("WL TP To Me:", e); }
                    }
                },
                toolTip: "Teleports a whitelisted player to your position (hold grip + trigger)."
            }),
            new ButtonInfo({
                buttonText: "WL Launch Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.5;
                        try {
                            var target = getWhitelistGunTarget(gunData, true, 10.0);
                            if (!target || !target.player) { sendNotification("No player there", false); return; }
                            if (target.blocked) { sendNotification("Not whitelisted: " + target.id, false); return; }
                            target.player.method("RPC_AddForce").invoke([0, 1500, 0]);
                            sendNotification("Launched " + target.id + "!", false);
                        } catch(e) { console.error("WL Launch:", e); }
                    }
                },
                toolTip: "Launches a whitelisted player upward (hold grip + trigger)."
            }),
            new ButtonInfo({
                buttonText: "WL Selling Orbit Gun",
                disableMethod: () => {
                    for (var prefab of wlSellingOrbitPrefabs) {
                        if (!prefab || prefab.isNull?.()) continue;
                        try {
                            var runner = prefab.method("get_Runner").invoke();
                            if (runner && !runner.isNull()) {
                                runner.method("Despawn").invoke(prefab);
                                continue;
                            }
                        } catch(_) {}
                        try {
                            var go = prefab.method("get_gameObject").invoke();
                            if (go && !go.isNull()) Destroy(go);
                        } catch(_) {}
                    }
                    wlSellingOrbitPrefabs = [];
                    wlSellingOrbitEntries = [];
                },
                isTogglable: true,
                method: () => {
                    try {
                        if (rightGrab) {
                            var gunData = renderGun();
                            if (rightTrigger && time > lagGunDelay) {
                                lagGunDelay = time + 0.18;
                                var target = getWhitelistGunTarget(gunData, true, 10.0);
                                if (target && target.player) {
                                    var already = wlSellingOrbitEntries.some(e => e.player && !e.player.isNull?.() && e.player.handle.equals(target.player.handle));
                                    if (!already) {
                                        for (var i = 0; i < 8; i++) {
                                            var spawned = spawnNetworkPrefab("ItemSellingMachineController", zeroVector, identityQuaternion);
                                            if (!spawned || spawned.isNull?.()) continue;
                                            wlSellingOrbitPrefabs.push(spawned);
                                            var go = spawned.method("get_gameObject").invoke();
                                            if (!go || go.isNull()) continue;
                                            var tf = go.method("get_transform").invoke();
                                            wlSellingOrbitEntries.push({
                                                player: target.player,
                                                transform: tf,
                                                angle: (Math.PI * 2 / 8) * i
                                            });
                                        }
                                        sendNotification("Selling orbit added to " + target.id, false);
                                    }
                                }
                            }
                        }
                        for (var orb of wlSellingOrbitEntries) {
                            try {
                                var p = orb.player;
                                if (!p || p.isNull?.()) continue;
                                var pos = getTransform(p).method("get_position").invoke();
                                orb.angle += deltaTime * 1.8;
                                var x = (pos.field("x").value ) + Math.cos(orb.angle) * 2.6;
                                var y = (pos.field("y").value ) + 0.35 + Math.sin((orb.angle * 2.0) + time) * 0.18;
                                var z = (pos.field("z").value ) + Math.sin(orb.angle) * 2.6;
                                orb.transform.method("set_position").invoke([x, y, z]);
                            } catch(_) {}
                        }
                    } catch(e) { console.error("WL Selling Orbit Gun:", e); }
                },
                toolTip: "Touches a WL player with the gun and makes selling machines orbit them."
            }),
            new ButtonInfo({
                buttonText: "WL Orbit All Target Gun",
                enableMethod: () => { wlOrbitAllTarget = null; wlOrbitAllPhase = 0; },
                disableMethod: () => { wlOrbitAllTarget = null; },
                isTogglable: true,
                method: () => {
                    try {
                        if (rightGrab) {
                            var gunData = renderGun();
                            if (rightTrigger && time > wlTargetActionDelay) {
                                wlTargetActionDelay = time + 0.25;
                                var target = getWhitelistGunTarget(gunData, true, 10.0);
                                if (target?.player) {
                                    wlOrbitAllTarget = target.player;
                                    sendNotification("Orbit target: " + target.id, false);
                                }
                            }
                        }
                        if (!wlOrbitAllTarget || wlOrbitAllTarget.isNull?.()) return;
                        var center = getTransform(wlOrbitAllTarget).method("get_position").invoke();
                        var others = getAllNetPlayersList(false);
                        wlOrbitAllPhase += deltaTime * 3.5;
                        var idx = 0;
                        for (var p of others) {
                            try {
                                if (!p || p.isNull?.()) continue;
                                if (normalizeSceneObjectHandle(p) === normalizeSceneObjectHandle(wlOrbitAllTarget)) continue;
                                var angle = wlOrbitAllPhase + ((Math.PI * 2 * idx) / Math.max(1, others.length));
                                p.method("RPC_Teleport").invoke([
                                    (center.field("x").value ) + (Math.cos(angle) * 2.9),
                                    (center.field("y").value ) + 1.15 + (Math.sin((time * 2.0) + idx) * 0.45),
                                    (center.field("z").value ) + (Math.sin(angle) * 2.9)
                                ]);
                                idx++;
                            } catch(_) {}
                        }
                    } catch(e) { console.error("WL Orbit All Target Gun:", e); }
                },
                toolTip: "Aim a WL player once, then all players orbit them until toggled off."
            }),
            new ButtonInfo({
                buttonText: "WL Piss Gun",
                enableMethod: () => { wlPissTarget = null; },
                disableMethod: () => { wlPissTarget = null; },
                isTogglable: true,
                method: () => {
                    try {
                        if (rightGrab) {
                            var gunData = renderGun();
                            if (rightTrigger && time > wlTargetActionDelay) {
                                wlTargetActionDelay = time + 0.25;
                                var target = getWhitelistGunTarget(gunData, true, 10.0);
                                if (target?.player) {
                                    wlPissTarget = target.player;
                                    sendNotification("Piss target: " + target.id, false);
                                }
                            }
                        }
                        if (!wlPissTarget || wlPissTarget.isNull?.() || time <= goopSpamDelay) return;
                        goopSpamDelay = time + 0.055;
                        spawnGoopBurstAtTransform(getTransform(wlPissTarget), 56, 100, 1, 2.2, 5.2);
                    } catch(e) { console.error("WL Piss Gun:", e); }
                },
                toolTip: "Aim a WL player once and continuously gives them the piss stream."
            }),
            new ButtonInfo({
                buttonText: "WL Gun Buff Target Gun",
                enableMethod: () => { wlGunBuffTarget = null; },
                disableMethod: () => { wlGunBuffTarget = null; },
                isTogglable: true,
                method: () => {
                    try {
                        if (rightGrab) {
                            var gunData = renderGun();
                            if (rightTrigger && time > wlTargetActionDelay) {
                                wlTargetActionDelay = time + 0.25;
                                var target = getWhitelistGunTarget(gunData, true, 10.0);
                                if (target?.player) {
                                    wlGunBuffTarget = target.player;
                                    sendNotification("Gun buff target: " + target.id, false);
                                }
                            }
                        }
                        if (!wlGunBuffTarget || wlGunBuffTarget.isNull?.()) return;
                        for (var handIndex of [0, 1]) {
                            try { applyGunBuffsToGrabbable(getPlayerHeldGrabbable(wlGunBuffTarget, handIndex), true); } catch(_) {}
                        }
                    } catch(e) { console.error("WL Gun Buff Target Gun:", e); }
                },
                toolTip: "Aim a WL player once and keeps any guns they hold buffed."
            }),
            new ButtonInfo({
                buttonText: "WL Right Hand Duper Gun",
                enableMethod: () => { wlRightHandDuperTarget = null; },
                disableMethod: () => { wlRightHandDuperTarget = null; },
                isTogglable: true,
                method: () => {
                    try {
                        if (rightGrab) {
                            var gunData = renderGun();
                            if (rightTrigger && time > wlTargetActionDelay) {
                                wlTargetActionDelay = time + 0.25;
                                var target = getWhitelistGunTarget(gunData, true, 10.0);
                                if (target?.player) {
                                    wlRightHandDuperTarget = target.player;
                                    sendNotification("Right-hand duper: " + target.id, false);
                                }
                            }
                        }
                        if (!wlRightHandDuperTarget || wlRightHandDuperTarget.isNull?.() || time <= heldItemDuplicateDelay) return;
                        heldItemDuplicateDelay = time + 0.08;
                        spawnHeldItemDuplicateForPlayer(wlRightHandDuperTarget, 12.5);
                    } catch(e) { console.error("WL Right Hand Duper Gun:", e); }
                },
                toolTip: "Aim a WL player once and makes them spam-dupe whatever is in their right hand."
            }),
            new ButtonInfo({
                buttonText: "WL Item Duper Hand Gun",
                enableMethod: () => { wlItemDuperHandTarget = null; wlItemDuperHandDelay = 0; },
                disableMethod: () => { wlItemDuperHandTarget = null; wlItemDuperHandDelay = 0; },
                isTogglable: true,
                method: () => {
                    try {
                        if (rightGrab) {
                            var gunData = renderGun();
                            if (rightTrigger && time > wlTargetActionDelay) {
                                wlTargetActionDelay = time + 0.25;
                                var target = getWhitelistGunTarget(gunData, true, 10.0);
                                if (target?.player) {
                                    wlItemDuperHandTarget = target.player;
                                    wlItemDuperHandDelay = 0;
                                    sendNotification("Item duper hand: " + target.id, false);
                                }
                            }
                        }
                        if (!wlItemDuperHandTarget || wlItemDuperHandTarget.isNull?.() || time <= wlItemDuperHandDelay) return;
                        wlItemDuperHandDelay = time + 0.075;
                        spawnHeldItemDuplicateForPlayer(wlItemDuperHandTarget, 12.5);
                    } catch(e) { console.error("WL Item Duper Hand Gun:", e); }
                },
                toolTip: "Aim a WL player once and gives them the right-hand item duper hand effect."
            }),
            new ButtonInfo({
                buttonText: "WL Stash Eject Duper Gun",
                enableMethod: () => { wlStashEjectDuperTarget = null; },
                disableMethod: () => { wlStashEjectDuperTarget = null; },
                isTogglable: true,
                method: () => {
                    try {
                        if (rightGrab) {
                            var gunData = renderGun();
                            if (rightTrigger && time > wlTargetActionDelay) {
                                wlTargetActionDelay = time + 0.25;
                                var target = getWhitelistGunTarget(gunData, true, 10.0);
                                if (target?.player) {
                                    wlStashEjectDuperTarget = target.player;
                                    sendNotification("Stash eject duper: " + target.id, false);
                                }
                            }
                        }
                        if (!wlStashEjectDuperTarget || wlStashEjectDuperTarget.isNull?.() || time <= heldItemDuplicateDelay) return;
                        heldItemDuplicateDelay = time + 0.16;
                        try { spawnHeldItemEjectBurstForPlayer(wlStashEjectDuperTarget, Math.max(2, ejectDupeAmount)); } catch(_) {}
                    } catch(e) { console.error("WL Stash Eject Duper Gun:", e); }
                },
                toolTip: "Aim a WL player once and gives them a stash-style eject dupe burst from their right hand."
            }),
            new ButtonInfo({
                buttonText: "WL Kill Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.5;
                        try {
                            var target = getWhitelistGunTarget(gunData, true, 10.0);
                            if (!target || !target.player) { sendNotification("No player there", false); return; }
                            if (target.blocked) { sendNotification("Not whitelisted: " + target.id, false); return; }
                            target.player.method("RPC_DoPlayerDie").invoke(true);
                            sendNotification("Killed " + target.id + "!", false);
                        } catch(e) { console.error("WL Kill:", e); }
                    }
                },
                toolTip: "Kills a whitelisted player (hold grip + trigger). Must be in whitelist."
            }),
            new ButtonInfo({
                buttonText: "WL Stinky Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.5;
                        try {
                            var target = getWhitelistGunTarget(gunData, true, 10.0);
                            if (!target || !target.player) { sendNotification("No player there", false); return; }
                            if (target.blocked) { sendNotification("Not whitelisted: " + target.id, false); return; }
                            target.player.method("RPC_TagAsStinky").invoke();
                            sendNotification("Stinkied " + target.id + "!", false);
                        } catch(e) { console.error("WL Stinky:", e); }
                    }
                },
                toolTip: "Tags a whitelisted player  (hold grip + trigger)."
            }),
            new ButtonInfo({
                buttonText: "WL Color Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.5;
                        try {
                            var target = getWhitelistGunTarget(gunData, true, 10.0);
                            if (!target || !target.player) { sendNotification("No player there", false); return; }
                            if (target.blocked) { sendNotification("Not whitelisted: " + target.id, false); return; }
                            var h = (time * 0.5) % 1.0;
                            target.player.method("RPC_SetColorHSV").invoke(99999.0, h, 1.0, 1.0);
                            sendNotification("Rainbow'd " + target.id + "!", false);
                        } catch(e) { console.error("WL Color:", e); }
                    }
                },
                toolTip: "Sets a whitelisted player to a rainbow color (hold grip + trigger)."
            }),
            new ButtonInfo({
                buttonText: "WL Speed Buff Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.5;
                        try {
                            var target = getWhitelistGunTarget(gunData, true, 10.0);
                            if (!target || !target.player) { sendNotification("No player there", false); return; }
                            if (target.blocked) { sendNotification("Not whitelisted: " + target.id, false); return; }
                            target.player.method("RPC_ApplyBuff").invoke(1);
                            sendNotification("Speed buff -> " + target.id + "!", false);
                        } catch(e) { console.error("WL Speed Buff:", e); }
                    }
                },
                toolTip: "Gives speed buff to a whitelisted player (hold grip + trigger)."
            }),
            new ButtonInfo({
                buttonText: "WL AntiGrav Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.5;
                        try {
                            var target = getWhitelistGunTarget(gunData, true, 10.0);
                            if (!target || !target.player) { sendNotification("No player there", false); return; }
                            if (target.blocked) { sendNotification("Not whitelisted: " + target.id, false); return; }
                            target.player.method("RPC_ApplyBuff").invoke(7);
                            sendNotification("AntiGrav buff -> " + target.id + "!", false);
                        } catch(e) { console.error("WL AntiGrav:", e); }
                    }
                },
                toolTip: "Gives anti-gravity buff to a whitelisted player (hold grip + trigger)."
            }),
            new ButtonInfo({
                buttonText: "WL Scale Big Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.5;
                        try {
                            var target = getWhitelistGunTarget(gunData, true, 10.0);
                            if (!target || !target.player) { sendNotification("No player there", false); return; }
                            if (target.blocked) { sendNotification("Not whitelisted: " + target.id, false); return; }
                            try { target.player.method("set_playerScale").invoke(5.0); } catch(_) {}
                            try { target.player.field("_playerScale").value = 5.0; } catch(_) {}
                            sendNotification("Scaled up " + target.id + "!", false);
                        } catch(e) { console.error("WL Scale Big:", e); }
                    }
                },
                toolTip: "Sets a whitelisted player to big scale (hold grip + trigger)."
            }),
            new ButtonInfo({
                buttonText: "WL Scale Tiny Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.5;
                        try {
                            var target = getWhitelistGunTarget(gunData, true, 10.0);
                            if (!target || !target.player) { sendNotification("No player there", false); return; }
                            if (target.blocked) { sendNotification("Not whitelisted: " + target.id, false); return; }
                            try { target.player.method("set_playerScale").invoke(0.1); } catch(_) {}
                            try { target.player.field("_playerScale").value = 0.1; } catch(_) {}
                            sendNotification("Shrunk " + target.id + "!", false);
                        } catch(e) { console.error("WL Scale Tiny:", e); }
                    }
                },
                toolTip: "Sets a whitelisted player to tiny scale (hold grip + trigger)."
            }),
            new ButtonInfo({
                buttonText: "WL Stun Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.5;
                        try {
                            var target = getWhitelistGunTarget(gunData, true, 10.0);
                            if (!target || !target.player) { sendNotification("No player there", false); return; }
                            if (target.blocked) { sendNotification("Not whitelisted: " + target.id, false); return; }
                            var pos = getTransform(target.player).method("get_position").invoke();
                            target.player.method("RPC_PlayerStun").invoke(pos, 5.0, 5.0, 1);
                            sendNotification("Stunned " + target.id + "!", false);
                        } catch(e) { console.error("WL Stun:", e); }
                    }
                },
                toolTip: "Stuns a whitelisted player for 5s (hold grip + trigger)."
            }),
            new ButtonInfo({
                buttonText: "WL Invisible Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.5;
                        try {
                            var target = getWhitelistGunTarget(gunData, true, 10.0);
                            if (!target || !target.player) { sendNotification("No player there", false); return; }
                            if (target.blocked) { sendNotification("Not whitelisted: " + target.id, false); return; }
                            var cur = target.player.method("get_isHide").invoke();
                            target.player.method("set_isHide").invoke(!cur);
                            sendNotification((cur ? "Showed " : "Hid ") + target.id + "!", false);
                        } catch(e) { console.error("WL Invisible:", e); }
                    }
                },
                toolTip: "Toggles visibility of a whitelisted player (hold grip + trigger)."
            }),
            new ButtonInfo({
                buttonText: "WL Disintegrate Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.5;
                        try {
                            var target = getWhitelistGunTarget(gunData, true, 10.0);
                            if (!target || !target.player) { sendNotification("No player there", false); return; }
                            if (target.blocked) { sendNotification("Not whitelisted: " + target.id, false); return; }
                            var targetPos = getTransform(target.player).method("get_position").invoke();
                            var NetworkRunner2 = SFXManager.field("_instance").value.method("get__currentRunner").invoke();
                            var allVFX = [
                                VFXTypes.MeatExplosion_1, VFXTypes.MeatExplosion_2, VFXTypes.MeatExplosion_Headshot,
                                VFXTypes.Explosion_Coins, VFXTypes.Explosion_Feathers, VFXTypes.ConfettiBurst,
                                VFXTypes.Ethereal_Void, VFXTypes.Electricity_Small, VFXTypes.FuelExplosion
                            ];
                            for (var vfxType of allVFX) {
                                try { ParticleManagerClass.method("RPC_PlayVFX", 4).invoke(NetworkRunner2, vfxType, targetPos, identityQuaternion); } catch(_) {}
                            }
                            target.player.method("RPC_Teleport").invoke([0, -9999999, 0]);
                            target.player.method("RPC_AddForce").invoke([0, 2000, 0]);
                            sendNotification("Disintegrated WL player: " + target.id, false);
                        } catch(e) { console.error("WL Disintegrate Gun:", e); }
                    }
                },
                toolTip: "Disintegrates a whitelisted player with VFX (hold grip + trigger)."
            }),
            new ButtonInfo({
                buttonText: "WL Freeze Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.5;
                        try {
                            var target = getWhitelistGunTarget(gunData, true, 10.0);
                            if (!target || !target.player) { sendNotification("No player there", false); return; }
                            if (target.blocked) { sendNotification("Not whitelisted: " + target.id, false); return; }
                            var pos = getTransform(target.player).method("get_position").invoke();
                            target.player.method("RPC_PlayerStun").invoke(pos, 999.0, 9999.0, 0);
                            sendNotification("Froze WL player: " + target.id, false);
                        } catch(e) { console.error("WL Freeze Gun:", e); }
                    }
                },
                toolTip: "Freezes a whitelisted player indefinitely (hold grip + trigger)."
            }),
            new ButtonInfo({
                buttonText: "WL Hit 50 Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.4;
                        try {
                            var target = getWhitelistGunTarget(gunData, true, 10.0);
                            if (!target || !target.player) { sendNotification("No player there", false); return; }
                            if (target.blocked) { sendNotification("Not whitelisted: " + target.id, false); return; }
                            var pos = getTransform(target.player).method("get_position").invoke();
                            var dmgNull = DamageSourceInfoClass.method("get_Null").invoke();
                            target.player.method("RPC_PlayerHit", 3).invoke(50, pos, dmgNull);
                            sendNotification("Hit WL player 50dmg: " + target.id, false);
                        } catch(e) { console.error("WL Hit 50:", e); }
                    }
                },
                toolTip: "Deals 50 damage to a whitelisted player (hold grip + trigger)."
            }),
            new ButtonInfo({
                buttonText: "WL Void Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.5;
                        try {
                            var target = getWhitelistGunTarget(gunData, true, 10.0);
                            if (!target || !target.player) { sendNotification("No player there", false); return; }
                            if (target.blocked) { sendNotification("Not whitelisted: " + target.id, false); return; }
                            target.player.method("RPC_Teleport").invoke([0, -99999, 0]);
                            sendNotification("Voided WL player: " + target.id, false);
                        } catch(e) { console.error("WL Void Gun:", e); }
                    }
                },
                toolTip: "Teleports a whitelisted player to the void (hold grip + trigger)."
            }),
            new ButtonInfo({
                buttonText: "WL Revive All WL",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                            while (en.method("MoveNext").invoke()) {
                                var p = en.method("get_Current").invoke();
                                if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                                if (whitelistEnabled && !whitelistHasPlayer(p)) continue;
                                try { p.method("RPC_DoPlayerDie").invoke(false); count++; } catch(_) {}
                            }
                        sendNotification("Revived " + count + " WL players!", false);
                    } catch(e) { sendNotification("WL Revive All: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Revives all whitelisted players."
            }),
            new ButtonInfo({
                buttonText: "WL TP All WL 2 Me",
                method: () => {
                    try {
                        var me = NetPlayer.method("get_localPlayer").invoke();
                        if (!me || me.handle.isNull()) return;
                        var myPos = getTransform(me).method("get_position").invoke();
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                            while (en.method("MoveNext").invoke()) {
                                var p = en.method("get_Current").invoke();
                                if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                                if (whitelistEnabled && !whitelistHasPlayer(p)) continue;
                                try { p.method("RPC_Teleport").invoke(myPos); count++; } catch(_) {}
                            }
                        sendNotification("TP'd " + count + " WL players to you!", false);
                    } catch(e) { sendNotification("WL TP All 2 Me: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Teleports all whitelisted players to your position."
            }),
        ],
        [ 
            new ButtonInfo({
                buttonText: "Exit Stuff",
                method: () => { currentCategory = 0; currentPage = 0; },
                isTogglable: false,
                toolTip: "Returns to main menu."
            }),
            new ButtonInfo({
    buttonText: "Elevator Spam",
    isTogglable: true,
    method: () => {
        if (time > itemGunDelay) {
            itemGunDelay = time + 0.15;
            try {
                var elevators = Object.method("FindObjectsByType", 1).inflate(ElevatorManager).invoke(0);
                if (!elevators || elevators.isNull()) return;
                var count = elevators.length;
                if (count === 0) { sendNotification("No elevators found", false); return; }
                if (typeof (globalThis )._elevFloor !== "number") (globalThis )._elevFloor = 0;
                (globalThis )._elevFloor = ((globalThis )._elevFloor + 1) % 3;
                for (var ei = 0; ei < count; ei++) {
                    try {
                        var elev = elevators.get(ei);
                        if (!elev || elev.isNull()) continue;
                        elev.method("RPC_RequestElevator").invoke((globalThis )._elevFloor, false);
                    } catch(_) {}
                }
            } catch(_) {}
        }
    },
    toolTip: "Spams ALL elevators between floors every 0.15s (no gun needed, just toggle on)."
}),
            new ButtonInfo({
                buttonText: "Machine to Me",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        var pos = getTransform(player).method("get_position").invoke();
                        var machine = Object.method("FindObjectOfType", 0).inflate(ItemSellingMachineController).invoke();
                        if (!machine || machine.isNull()) { sendNotification("No selling machine in scene", false); return; }
                        getTransform(machine).method("set_position").invoke(pos);
                        sendNotification("Selling machine moved to you!", false);
                    } catch(e) { sendNotification("Machine to me failed: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Moves the existing selling machine to your position."
            }),
            new ButtonInfo({
                buttonText: "Revive Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    if (rightTrigger && time > itemGunDelay) {
                        itemGunDelay = time + 0.5;
                        try {
                            var pointerPos = getTransform(gunData.gunPointer).method("get_position").invoke();
                            var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                            var playerValues = playerDict.method("get_Values").invoke();
                            var enumerator = playerValues.method("GetEnumerator").invoke();
                            var nearestPlayer = null;
                            var nearestDist = Number.MAX_SAFE_INTEGER;
                            while (enumerator.method("MoveNext").invoke()) {
                                var p = enumerator.method("get_Current").invoke();
                                if (!p || p.handle.isNull()) continue;
                                if (playerIsLocal(p)) continue;
                                try {
                                    var isDead = p.method("get_isDie").invoke();
                                    if (!isDead) continue;
                                } catch(_) { continue; }
                                var dist = Vector3.method("Distance").invoke(
                                    getTransform(p).method("get_position").invoke(), pointerPos
                                );
                                if (dist < nearestDist) { nearestDist = dist; nearestPlayer = p; }
                            }
                            if (nearestPlayer && nearestDist < 10.0) {
                                nearestPlayer.method("set_isDie").invoke(false);
                                nearestPlayer.method("set_healthLost").invoke(0);
                                sendNotification("Revived nearest dead player!", false);
                            } else {
                                sendNotification("No dead player within 10u of pointer", false);
                            }
                        } catch(e) { console.error("Revive Gun:", e); }
                    }
                },
                toolTip: "Point gun at dead player and pull trigger to revive (hold grip)."
            }),
            new ButtonInfo({
                buttonText: "Prefab Spawn Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    var ray = gunData.ray;
                    if (!ray || ray.handle.isNull()) return;
                    if (rightTrigger && time > itemGunDelay) {
                        itemGunDelay = time + 0.3;
                        try {
                            var hitPoint = ray.method("get_point").invoke();
                            var name = prefabIDs[prefabIndex];
                            var result = spawnNetworkPrefab(name, hitPoint, identityQuaternion);
                            if (result && !result.isNull()) {
                                sendNotification("Spawned: " + name, false);
                            } else {
                                sendNotification("Not found in PrefabTable: " + name, false);
                            }
                        } catch(e) { sendNotification("Prefab spawn failed: " + e, false); }
                    }
                },
                toolTip: "Spawns selected prefab where you aim via NetworkRunner (hold grip + trigger)."
            }),
            new ButtonInfo({
                buttonText: "Delete Obj Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    var ray = gunData.ray;
                    if (!ray || ray.handle.isNull()) return;
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.3;
                        try {
                            var hitCollider = ray.method("get_collider").invoke();
                            if (!hitCollider || hitCollider.isNull()) return;
                            var hitGO = hitCollider.method("get_gameObject").invoke();
                            if (!hitGO || hitGO.isNull()) return;
                            var runner = null;
            try { runner = SFXManager.field("_instance").value.method("get__currentRunner").invoke(); } catch(_) {}
            try { if (!runner || runner.isNull()) runner = Il2Cpp.domain.assembly("Fusion.Runtime").image.class("Fusion.NetworkRunner").method("get_Instance").invoke(); } catch(_) {}
            if (!runner || runner.isNull()) { sendNotification("No runner found", false); return; }
                            var despawned = false;
                            try {
                                var gbo = hitGO.method("GetComponentInParent", 0).inflate(GBOClass).invoke();
                                if (gbo && !gbo.isNull()) {
                                    var netObj = gbo.method("get_Object").invoke();
                                    if (netObj && !netObj.isNull()) {
                                        runner.method("Despawn").invoke(netObj);
                                        sendNotification("Deleted (synced)!", false);
                                        despawned = true;
                                    }
                                }
                            } catch(_) {}
                            if (!despawned) {
                                try {
                                    var NetworkObjectClass = Il2Cpp.domain.assembly("Fusion.Runtime").image.class("Fusion.NetworkObject");
                                    var netObj2 = hitGO.method("GetComponentInParent", 0).inflate(NetworkObjectClass).invoke();
                                    if (netObj2 && !netObj2.isNull()) {
                                        runner.method("Despawn").invoke(netObj2);
                                        sendNotification("Deleted (synced)!", false);
                                        despawned = true;
                                    }
                                } catch(_) {}
                            }
                            if (!despawned) {
                                Destroy(hitGO);
                                sendNotification("Destroyed (local only)", false);
                            }
                        } catch(e) { sendNotification("Delete failed: " + e, false); }
                    }
                },
                toolTip: "Point at any object and pull trigger to delete it synced for all players (hold grip)."
            }),
            new ButtonInfo({
                buttonText: "Force Grab",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        var handPos = rightHandTransform.method("get_position").invoke();
                        var allItems = GBIClass.method("get_allLootItems").invoke();
                        if (!allItems || allItems.isNull()) return;
                        var closest = null, closestDist = 8.0;
                        var enumerator = allItems.method("GetEnumerator").invoke();
                        while (enumerator.method("MoveNext").invoke()) {
                            try {
                                var item = enumerator.method("get_Current").invoke();
                                if (!item || item.isNull()) continue;
                                var itemPos = getTransform(item).method("get_position").invoke();
                                var dist = Vector3.method("Distance").invoke(handPos, itemPos);
                                if (dist < closestDist) { closest = item; closestDist = dist; }
                            } catch(_) {}
                        }
                        if (closest) {
                            getTransform(closest).method("set_position").invoke(handPos);
                            sendNotification("Force grabbed nearest item!", false);
                        } else {
                            sendNotification("No items within 8m", false);
                        }
                    } catch(e) { sendNotification("Force Grab: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Teleports the nearest item to your right hand."
            }),
            new ButtonInfo({
                buttonText: "Force Grab Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    var ray = gunData.ray;
                    if (!ray || ray.handle.isNull()) return;
                    if (rightTrigger && time > itemGunDelay) {
                        itemGunDelay = time + 0.3;
                        try {
                            var hitCollider = ray.method("get_collider").invoke();
                            if (!hitCollider || hitCollider.isNull()) return;
                            var hitGO = hitCollider.method("get_gameObject").invoke();
                            if (!hitGO || hitGO.isNull()) return;
                            var hitGBI = hitGO.method("GetComponentInParent", 0).inflate(GBIClass).invoke();
                            if (!hitGBI || hitGBI.isNull()) { sendNotification("No grabbable item there", false); return; }
                            var handPos = rightHandTransform.method("get_position").invoke();
                            getTransform(hitGBI).method("set_position").invoke(handPos);
                            sendNotification("Grabbed: " + hitGBI.method("get_itemID").invoke()?.content, false);
                        } catch(e) { console.error("Force Grab Gun:", e); }
                    }
                },
                toolTip: "Pull trigger while holding grip to teleport aimed item to hand."
            }),
            new ButtonInfo({
                buttonText: "Delete Held Item",
                method: () => {
                    try {
                        var grabbable = getLocalHeldGrabbable(true);
                        if (!grabbable || grabbable.isNull?.()) { sendNotification("Not holding anything", false); return; }
                        tryReleaseHeldItem(grabbable);
                        requestAuthorityDeep(grabbable);
                        forceReleaseItemFromAllPlayers(grabbable);
                        var handled = false;
                        try { grabbable.method("Despawn").invoke(); handled = true; } catch(_) {}
                        if (!handled) try { grabbable.method("RPC_Destroy").invoke(); handled = true; } catch(_) {}
                        if (!handled) try {
                            var go = grabbable.method("get_gameObject").invoke();
                            if (go && !go.isNull?.()) Destroy(go);
                            handled = true;
                        } catch(_) {}
                        sendNotification("Item deleted!", false);
                    } catch(e) { sendNotification("Delete item: " + e, false); console.error("Delete item:", e); }
                },
                isTogglable: false,
                toolTip: "Despawns whatever you're holding in your right hand."
            }),
            new ButtonInfo({
                buttonText: "Lock Item Position",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        var interactor = player.method("GetHandInteractor", 1).invoke(1);
                        if (!interactor) return;
                        var itemAnchor = interactor.field("_itemAnchor").value;
                        if (!itemAnchor) return;
                        var grabbable = itemAnchor.method("get_grabbableObject").invoke();
                        if (!grabbable || grabbable.isNull()) { sendNotification("Not holding anything", false); return; }
                        var pos = getTransform(grabbable).method("get_position").invoke();
                        try {
                            var rb = getComponent(grabbable.method("get_gameObject").invoke(), RigidbodyClass);
                            if (rb && !rb.isNull()) rb.method("set_isKinematic").invoke(true);
                        } catch(_) {}
                        var entry = grabbable;
                        (entry )._lockedPos = pos;
                        lockedItems.push(entry);
                        sendNotification("Item locked in place!", false);
                    } catch(e) { sendNotification("Lock item: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Freezes your held item in place."
            }),
            new ButtonInfo({
                buttonText: "Rocket Fists",
                isTogglable: true,
                method: () => {
                    try {
                        var rightFist = rightGrab && !rightTrigger;
                        var leftFist  = leftGrab  && !leftTrigger;
                        if (!rightFist && !leftFist) return;
                        if (time <= lagGunDelay) return;
                        lagGunDelay = time + 0.35;
                        var handTransform = rightFist ? rightHandTransform : leftHandTransform;
                        spawnRpgProjectileAt(handTransform, 30.0);
                    } catch(e) { console.error("Rocket Fists:", e); }
                },
                toolTip: "Make a fist (hold grip, no trigger) to fire an RPG projectile from your hand."
            }),
            new ButtonInfo({
                buttonText: "Log My Position",
                method: () => {
                    try {
                        var pos = getTransform(GTPlayer).method("get_position").invoke();
                        var x = pos.field("x").value.toFixed(3);
                        var y = pos.field("y").value.toFixed(3);
                        var z = pos.field("z").value.toFixed(3);
                        console.log("[Position] X=" + x + " Y=" + y + " Z=" + z);
                        sendNotification("Pos: (" + x + ", " + y + ", " + z + ")", false, 8);
                    } catch(e) { console.error("[Position]:", e); }
                },
                isTogglable: false,
                toolTip: "Logs your XYZ to Frida console."
            }),
            new ButtonInfo({
                buttonText: "Start Arena",
                method: () => {
                    try { ArenaGameManager.method("StartGame").invoke(); sendNotification("Arena started!", false); }
                    catch(e) { sendNotification("Start Arena: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Starts the arena game."
            }),
            new ButtonInfo({
                buttonText: "End Arena",
                method: () => {
                    try { ArenaGameManager.method("EndGame").invoke(); sendNotification("Arena ended!", false); }
                    catch(e) { sendNotification("End Arena: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Ends the arena game."
            }),
            new ButtonInfo({
                buttonText: "Arena Spammer",
                method: () => {
                    if (time > lagGunDelay) {
                        lagGunDelay = time + 1.5;
                        try { ArenaGameManager.method("StartGame").invoke(); } catch(_) {}
                        try { ArenaGameManager.method("EndGame").invoke(); } catch(_) {}
                        sendNotification("Arena spam tick!", false);
                    }
                },
                isTogglable: true,
                toolTip: "Rapidly starts and ends the arena every 1.5 s while toggled."
            }),
            new ButtonInfo({
                buttonText: "Kill Me",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        selfRPC(() => player.method("RPC_DoPlayerDie").invoke(true));
                        sendNotification("Killed!", false);
                    } catch(e) { sendNotification("Kill Me: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Kills yourself via set_isDie + set_healthLost."
            }),
            new ButtonInfo({
                buttonText: "Revive Me",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        selfRPC(() => player.method("RPC_DoPlayerDie").invoke(false));
                        sendNotification("Revived!", false);
                    } catch(e) { sendNotification("Revive Me: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Revives yourself via set_isDie + set_healthLost(0)."
            }),
        ],
        [ 
            new ButtonInfo({
                buttonText: "Exit Menu Settings",
                method: () => { currentCategory = 0; currentPage = 0; },
                isTogglable: false,
                toolTip: "Returns to main menu."
            }),
            new ButtonInfo({
                buttonText: "Theme Red",
                method: () => { themeMode = 11; sendNotification("Theme Red", false); reloadMenu(); },
                isTogglable: false,
                toolTip: "Full red background, dark red buttons, and dark text."
            }),
            new ButtonInfo({
                buttonText: "Theme Blue",
                method: () => { themeMode = 0; sendNotification("Theme Blue", false); },
                isTogglable: false,
                toolTip: "Animated royal blue pulse theme."
            }),
            new ButtonInfo({
                buttonText: "Theme",
                method: () => { themeMode = 1; sendNotification("Theme Rainbow", false); reloadMenu(); },
                isTogglable: false,
                toolTip: "Animated full HSV rainbow cycle - colors change continuously."
            }),
            new ButtonInfo({
                buttonText: "Theme Green",
                method: () => { themeMode = 2; sendNotification("Theme Green", false); },
                isTogglable: false,
                toolTip: "Animated neon green theme."
            }),
            new ButtonInfo({
                buttonText: "Theme Red",
                method: () => { themeMode = 3; sendNotification("Theme Red", false); },
                isTogglable: false,
                toolTip: "Animated blood red theme."
            }),
            new ButtonInfo({
                buttonText: "Theme Orange",
                method: () => { themeMode = 4; sendNotification("Theme Orange", false); },
                isTogglable: false,
                toolTip: "Animated bright orange menu theme."
            }),
            new ButtonInfo({
                buttonText: "Theme Lime",
                method: () => { themeMode = 5; sendNotification("Theme Lime", false); },
                isTogglable: false,
                toolTip: "Animated toxic lime arcade theme."
            }),
            new ButtonInfo({
                buttonText: "Theme Pink",
                method: () => { themeMode = 6; sendNotification("Theme Pink", false); },
                isTogglable: false,
                toolTip: "Animated hot pink and orange sunset theme."
            }),
            new ButtonInfo({
                buttonText: "Theme Cyan",
                method: () => { themeMode = 7; sendNotification("Theme Cyan", false); },
                isTogglable: false,
                toolTip: "Animated frosty cyan theme."
            }),
            new ButtonInfo({
                buttonText: "Theme Black",
                method: () => { themeMode = 8; sendNotification("Theme Black", false); },
                isTogglable: false,
                toolTip: "Animated black and gold prestige theme."
            }),
            new ButtonInfo({
                buttonText: "Theme Purple",
                method: () => { themeMode = 9; sendNotification("Theme Purple", false); },
                isTogglable: false,
                toolTip: "Animated neon plasma purple theme."
            }),
            new ButtonInfo({
                buttonText: "Theme Orange",
                method: () => { themeMode = 10; sendNotification("Theme Orange", false); },
                isTogglable: false,
                toolTip: "Pitch black background, gray page buttons, and orange text."
            }),
        ],
        [ 
            new ButtonInfo({
                buttonText: "Exit RPC Stuff",
                method: () => { currentCategory = 0; currentPage = 0; },
                isTogglable: false,
                toolTip: "Returns to main menu."
            }),
            new ButtonInfo({
                buttonText: "Launch Me Up",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        selfRPC(() => player.method("RPC_AddForce").invoke([0, 1500, 0]));
                        sendNotification("Launch!", false);
                    } catch(e) { sendNotification("Launch: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Launches yourself upward via RPC_AddForce."
            }),
            new ButtonInfo({
                buttonText: "RPC Stun Me",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        var pos = getTransform(player).method("get_position").invoke();
                        selfRPC(() => player.method("RPC_PlayerStun").invoke(pos, 5.0, 3.0, 1));
                        sendNotification("Stunned for 3s!", false);
                    } catch(e) { sendNotification("Stun: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Stuns yourself for 3 seconds."
            }),
            new ButtonInfo({
                buttonText: "RPC Award Kill",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        selfRPC(() => player.method("RPC_AwardKill").invoke());
                        sendNotification("Kill awarded!", false);
                    } catch(e) { sendNotification("Award Kill: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Awards a kill to yourself."
            }),
            new ButtonInfo({
                buttonText: "RPC Set Red Team",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        selfRPC(() => player.method("RPC_SetTeam").invoke(1));
                        sendNotification("Red team!", false);
                    } catch(e) { sendNotification("Set Team: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets your team to Red."
            }),
            new ButtonInfo({
                buttonText: "RPC Set Blue Team",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        selfRPC(() => player.method("RPC_SetTeam").invoke(2));
                        sendNotification("Blue team!", false);
                    } catch(e) { sendNotification("Set Team: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets your team to Blue."
            }),
            new ButtonInfo({
                buttonText: "RPC Player Hit 50",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        var pos = getTransform(player).method("get_position").invoke();
                        var dmgNull = DamageSourceInfoClass.method("get_Null").invoke();
                        selfRPC(() => player.method("RPC_PlayerHit", 3).invoke(50, pos, dmgNull));
                        sendNotification("Hit for 50dmg!", false);
                    } catch(e) { sendNotification("Player Hit: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Deals 50 damage to yourself."
            }),
            new ButtonInfo({
                buttonText: "RPC Player Hit 1",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        var pos = getTransform(player).method("get_position").invoke();
                        var dmgNull = DamageSourceInfoClass.method("get_Null").invoke();
                        selfRPC(() => player.method("RPC_PlayerHit", 3).invoke(1, pos, dmgNull));
                        sendNotification("Hit for 1dmg!", false);
                    } catch(e) { sendNotification("Player Hit: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Deals 1 damage to yourself."
            }),
            new ButtonInfo({
                buttonText: "RPC Tag Stinky",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        selfRPC(() => player.method("RPC_TagAsStinky").invoke());
                        sendNotification("Tagged !", false);
                    } catch(e) { sendNotification("Tag Stinky: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Tags yourself ."
            }),
            new ButtonInfo({
                buttonText: "RPC Teleport Up",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        var pos = getTransform(player).method("get_position").invoke();
                        var upPos = [pos.field("x").value, pos.field("y").value + 20, pos.field("z").value];
                        selfRPC(() => player.method("RPC_Teleport").invoke(upPos));
                        sendNotification("Teleported up!", false);
                    } catch(e) { sendNotification("TP Up: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Teleports you 20 units upward."
            }),
            new ButtonInfo({
                buttonText: "RPC Color Red",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        selfRPC(() => player.method("RPC_SetColorHSV").invoke(99999.0, 0.0, 1.0, 1.0));
                        sendNotification("Color!", false);
                    } catch(e) { sendNotification("Color: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets your color to red permanently."
            }),
            new ButtonInfo({
                buttonText: "RPC Color Reset",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        selfRPC(() => player.method("RPC_SetColorHSV").invoke(0.0, 0.0, 0.0, 0.0));
                        sendNotification("Color reset!", false);
                    } catch(e) { sendNotification("Color reset: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Resets your color."
            }),
            new ButtonInfo({
                buttonText: "RPC End Arena",
                method: () => {
                    try {
                        var arena = ArenaGameManager.field("_instance").value;
                        if (!arena || arena.isNull()) { sendNotification("Not in arena", false); return; }
                        arena.method("RPC_EndEarly").invoke();
                        sendNotification("Arena ended!", false);
                    } catch(e) { sendNotification("End Arena: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Ends the arena early via RPC."
            }),
            new ButtonInfo({
                buttonText: "RPC Force Ragdoll",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        var pos = getTransform(player).method("get_position").invoke();
                        selfRPC(() => player.method("RPC_PlayerStun").invoke(pos, 999.0, 99.0, 0));
                        sendNotification("Force ragdolled!", false);
                    } catch(e) { sendNotification("Ragdoll: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Stuns with huge range/duration to force ragdoll."
            }),
            new ButtonInfo({
                buttonText: "RPC Buff SpeedBoost",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        var buffSheet = AssemblyCSharp.class("AnimalCompany.PlayerBuffSheet").method("get_instance").invoke();
                        if (!buffSheet || buffSheet.isNull()) { sendNotification("No buff sheet found", false); return; }
                        var allBuffs = buffSheet.method("GetAll").invoke();
                        if (!allBuffs || allBuffs.isNull()) { player.method("RPC_ApplyBuff").invoke(1); sendNotification("Speed buff sent (raw ID 1)!", false); return; }
                        var found = false;
                        var en = allBuffs.method("GetEnumerator").invoke();
                        while (en.method("MoveNext").invoke()) {
                            try {
                                var bd = en.method("get_Current").invoke();
                                if (!bd || bd.isNull()) continue;
                                var buffType = bd.field("buff").value;
                                if (buffType === 1) { 
                                    player.method("ApplyBuff").invoke(bd);
                                    found = true;
                                    break;
                                }
                            } catch(_) {}
                        }
                        if (!found) { player.method("RPC_ApplyBuff").invoke(1); }
                        sendNotification("Speed buff applied!", false);
                    } catch(e) {
                        try { NetPlayer.method("get_localPlayer").invoke().method("RPC_ApplyBuff").invoke(1); } catch(_) {}
                        sendNotification("Speed buff sent!", false);
                    }
                },
                isTogglable: false,
                toolTip: "Applies SpeedBoost buff to yourself."
            }),
            new ButtonInfo({
                buttonText: "RPC Buff JumpBoost",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        var buffSheet = AssemblyCSharp.class("AnimalCompany.PlayerBuffSheet").method("get_instance").invoke();
                        if (!buffSheet || buffSheet.isNull()) { player.method("RPC_ApplyBuff").invoke(7); sendNotification("AntiGrav buff sent!", false); return; }
                        var allBuffs = buffSheet.method("GetAll").invoke();
                        var found = false;
                        if (allBuffs && !allBuffs.isNull()) {
                            var en = allBuffs.method("GetEnumerator").invoke();
                            while (en.method("MoveNext").invoke()) {
                                try {
                                    var bd = en.method("get_Current").invoke();
                                    if (!bd || bd.isNull()) continue;
                                    var buffType = bd.field("buff").value;
                                    if (buffType === 7) { 
                                        player.method("ApplyBuff").invoke(bd);
                                        found = true;
                                        break;
                                    }
                                } catch(_) {}
                            }
                        }
                        if (!found) { player.method("RPC_ApplyBuff").invoke(7); }
                        sendNotification("AntiGravity buff applied!", false);
                    } catch(e) {
                        try { NetPlayer.method("get_localPlayer").invoke().method("RPC_ApplyBuff").invoke(7); } catch(_) {}
                        sendNotification("AntiGrav buff sent!", false);
                    }
                },
                isTogglable: false,
                toolTip: "Applies AntiGravity buff to yourself."
            }),
            new ButtonInfo({
                buttonText: "RPC No Team",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        selfRPC(() => player.method("RPC_SetTeam").invoke(0));
                        sendNotification("No team set!", false);
                    } catch(e) { sendNotification("Set Team: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Removes you from any team (team 0)."
            }),
            new ButtonInfo({
                buttonText: "RPC Kill All",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try { p.method("RPC_DoPlayerDie").invoke(true); count++; } catch(_) {}
                        }
                        sendNotification("Killed " + count + " players!", false);
                    } catch(e) { sendNotification("Kill All: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Kills all players via RPC_DoPlayerDie."
            }),
            new ButtonInfo({
                buttonText: "RPC Revive All",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try { p.method("RPC_DoPlayerDie").invoke(false); count++; } catch(_) {}
                        }
                        sendNotification("Revived " + count + " players!", false);
                    } catch(e) { sendNotification("Revive All: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Revives all players via RPC_DoPlayerDie."
            }),
            new ButtonInfo({
                buttonText: "RPC Stun All",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try {
                                var pos = getTransform(p).method("get_position").invoke();
                                p.method("RPC_PlayerStun").invoke(pos, 5.0, 5.0, 1);
                                count++;
                            } catch(_) {}
                        }
                        sendNotification("Stunned " + count + " players!", false);
                    } catch(e) { sendNotification("Stun All: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Stuns all other players for 5 seconds."
            }),
            new ButtonInfo({
                buttonText: "RPC Launch All",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try { p.method("RPC_AddForce").invoke([0, 1500, 0]); count++; } catch(_) {}
                        }
                        sendNotification("Launched " + count + " players!", false);
                    } catch(e) { sendNotification("Launch All: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Launches all other players upward."
            }),
            new ButtonInfo({
                buttonText: "RPC TP All 2 Me",
                method: () => {
                    try {
                        var me = NetPlayer.method("get_localPlayer").invoke();
                        if (!me || me.handle.isNull()) return;
                        var myPos = getTransform(me).method("get_position").invoke();
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try { p.method("RPC_Teleport").invoke(myPos); count++; } catch(_) {}
                        }
                        sendNotification("TP'd " + count + " players to you!", false);
                    } catch(e) { sendNotification("TP All: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Teleports all players to your position."
            }),
            new ButtonInfo({
                buttonText: "RPC Stinky All",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try { p.method("RPC_TagAsStinky").invoke(); count++; } catch(_) {}
                        }
                        sendNotification("Stinkied " + count + " players!", false);
                    } catch(e) { sendNotification("Stinky All: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Tags all other players ."
            }),
            new ButtonInfo({
                buttonText: "Set Wanted",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        var cur = player.method("get_isWanted").invoke();
                        player.method("set_isWanted").invoke(!cur);
                        sendNotification("isWanted: " + !cur, false);
                    } catch(e) { sendNotification("Set Wanted: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Toggles your wanted status."
            }),
            new ButtonInfo({
                buttonText: "Set Scale Big",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        try { player.method("set_playerScale").invoke(5.0); } catch(_) {}
                        try { player.field("_playerScale").value = 5.0; } catch(_) {}
                        try { player.method("SetNormalizedScaleModifier").invoke(5.0); } catch(_) {}
                        sendNotification("Scale set to big!", false);
                    } catch(e) { sendNotification("Set Scale: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets your player scale to big."
            }),
            new ButtonInfo({
                buttonText: "Set Scale Normal",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        try { player.method("set_playerScale").invoke(1.0); } catch(_) {}
                        try { player.field("_playerScale").value = 1.0; } catch(_) {}
                        try { player.method("SetNormalizedScaleModifier").invoke(1.0); } catch(_) {}
                        sendNotification("Scale reset to normal!", false);
                    } catch(e) { sendNotification("Set Scale: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Resets your player scale to normal."
            }),
            new ButtonInfo({
                buttonText: "Set Scale Tiny",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        try { player.method("set_playerScale").invoke(0.1); } catch(_) {}
                        try { player.field("_playerScale").value = 0.1; } catch(_) {}
                        try { player.method("SetNormalizedScaleModifier").invoke(0.1); } catch(_) {}
                        sendNotification("Scale set to tiny!", false);
                    } catch(e) { sendNotification("Set Scale: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets your player scale to tiny."
            }),
            new ButtonInfo({
                buttonText: "Set Kills +10",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        var kills = player.method("get_kills").invoke();
                        player.method("set_kills").invoke(kills + 10);
                        sendNotification("Kills: " + (kills + 10), false);
                    } catch(e) { sendNotification("Set Kills: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Adds 10 kills to your score."
            }),
            new ButtonInfo({
                buttonText: "Set Deaths 0",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        player.method("set_deaths").invoke(0);
                        sendNotification("Deaths reset to 0!", false);
                    } catch(e) { sendNotification("Set Deaths: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Resets your death count to 0."
            }),
            new ButtonInfo({
                buttonText: "Go Invisible",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        player.method("set_isHide").invoke(true);
                        sendNotification("Hidden from others!", false);
                    } catch(e) { sendNotification("Invisible: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Hides you from other players via set_isHide."
            }),
            new ButtonInfo({
                buttonText: "Go Visible",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        player.method("set_isHide").invoke(false);
                        sendNotification("Visible again!", false);
                    } catch(e) { sendNotification("Visible: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Makes you visible again via set_isHide(false)."
            }),
            new ButtonInfo({
                buttonText: "Color Yellow",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        player.method("RPC_SetColorHSV").invoke(99999.0, 0.17, 1.0, 1.0);
                        sendNotification("Color!", false);
                    } catch(e) { sendNotification("Color: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets your color to yellow via RPC_SetColorHSV."
            }),
            new ButtonInfo({
                buttonText: "Color Green",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        player.method("RPC_SetColorHSV").invoke(99999.0, 0.33, 1.0, 1.0);
                        sendNotification("Color!", false);
                    } catch(e) { sendNotification("Color: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets your color to green via RPC_SetColorHSV."
            }),
            new ButtonInfo({
                buttonText: "Color Blue",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        player.method("RPC_SetColorHSV").invoke(99999.0, 0.67, 1.0, 1.0);
                        sendNotification("Color!", false);
                    } catch(e) { sendNotification("Color: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets your color to blue via RPC_SetColorHSV."
            }),
            new ButtonInfo({
                buttonText: "Color Purple",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        player.method("RPC_SetColorHSV").invoke(99999.0, 0.78, 1.0, 1.0);
                        sendNotification("Color!", false);
                    } catch(e) { sendNotification("Color: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets your color to purple via RPC_SetColorHSV."
            }),
            new ButtonInfo({
                buttonText: "Color Pink",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        player.method("RPC_SetColorHSV").invoke(99999.0, 0.92, 1.0, 1.0);
                        sendNotification("Color!", false);
                    } catch(e) { sendNotification("Color: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets your color to pink via RPC_SetColorHSV."
            }),
            new ButtonInfo({
                buttonText: "Color All Red",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try { p.method("RPC_SetColorHSV").invoke(99999.0, 0.0, 1.0, 1.0); count++; } catch(_) {}
                        }
                        sendNotification("Colored " + count + " players red!", false);
                    } catch(e) { sendNotification("Color All: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets all other players' color to red."
            }),
            new ButtonInfo({
                buttonText: "Scale All Tiny",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try { p.method("set_playerScale").invoke(0.1); try { p.field("_playerScale").value = 0.1; } catch(_) {} count++; } catch(_) {}
                        }
                        sendNotification("Scaled " + count + " players tiny!", false);
                    } catch(e) { sendNotification("Scale All: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets all other players to tiny scale."
            }),
            new ButtonInfo({
                buttonText: "Scale All Big",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try { p.method("set_playerScale").invoke(5.0); try { p.field("_playerScale").value = 5.0; } catch(_) {} count++; } catch(_) {}
                        }
                        sendNotification("Scaled " + count + " players big!", false);
                    } catch(e) { sendNotification("Scale All: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets all other players to big scale."
            }),
            new ButtonInfo({
                buttonText: "Scale All Normal",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try { p.method("set_playerScale").invoke(1.0); try { p.field("_playerScale").value = 1.0; } catch(_) {} count++; } catch(_) {}
                        }
                        sendNotification("Reset " + count + " players to normal scale!", false);
                    } catch(e) { sendNotification("Scale All: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Resets all other players to normal scale."
            }),
            new ButtonInfo({
                buttonText: "Hide All Players",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try { p.method("set_isHide").invoke(true); count++; } catch(_) {}
                        }
                        sendNotification("Hid " + count + " players!", false);
                    } catch(e) { sendNotification("Hide All: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Hides all other players from the game."
            }),
            new ButtonInfo({
                buttonText: "Show All Players",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try { p.method("set_isHide").invoke(false); count++; } catch(_) {}
                        }
                        sendNotification("Showed " + count + " players!", false);
                    } catch(e) { sendNotification("Show All: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Makes all hidden players visible again."
            }),
            new ButtonInfo({
                buttonText: "Award Kill All",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try { p.method("RPC_AwardKill").invoke(); count++; } catch(_) {}
                        }
                        sendNotification("Awarded kill to " + count + " players!", false);
                    } catch(e) { sendNotification("Award Kill All: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Awards a kill to all other players."
            }),
            new ButtonInfo({
                buttonText: "Freeze All",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try {
                                var pos = getTransform(p).method("get_position").invoke();
                                p.method("RPC_PlayerStun").invoke(pos, 999.0, 9999.0, 0);
                                count++;
                            } catch(_) {}
                        }
                        sendNotification("Froze " + count + " players!", false);
                    } catch(e) { sendNotification("Freeze All: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Stuns all other players with max duration (freeze effect)."
            }),
            new ButtonInfo({
                buttonText: "RPC Buff Scale Big",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        try { player.method("RPC_ApplyBuff").invoke(5); } catch(_) {}
                        try { player.method("set_playerScale").invoke(5.0); } catch(_) {}
                        try { player.field("_playerScale").value = 5.0; } catch(_) {}
                        sendNotification("Scale buff applied!", false);
                    } catch(e) { sendNotification("Scale Buff: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Applies Scale buff (big) to yourself."
            }),
            new ButtonInfo({
                buttonText: "RPC Buff Stinky",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        try { player.method("RPC_ApplyBuff").invoke(6); } catch(_) {}
                        player.method("RPC_TagAsStinky").invoke();
                        sendNotification("Stinky buff applied!", false);
                    } catch(e) { sendNotification("Stinky Buff: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Tags yourself  + applies buff."
            }),
            new ButtonInfo({
                buttonText: "RPC Buff Damage",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        player.method("RPC_ApplyBuff").invoke(3);
                        sendNotification("Damage buff applied!", false);
                    } catch(e) { sendNotification("Damage Buff: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Applies Damage buff to yourself."
            }),
            new ButtonInfo({
                buttonText: "RPC Buff Pink",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        player.method("RPC_ApplyBuff").invoke(2);
                        sendNotification("Pink buff applied!", false);
                    } catch(e) { sendNotification("Pink Buff: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Applies PinkEffect buff to yourself."
            }),
            new ButtonInfo({
                buttonText: "RPC Buff All Speed",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try { p.method("RPC_ApplyBuff").invoke(1); count++; } catch(_) {}
                        }
                        sendNotification("Speed buff sent to " + count + " players!", false);
                    } catch(e) { sendNotification("Buff All: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sends SpeedBoost buff to all players."
            }),
            new ButtonInfo({
                buttonText: "RPC Buff All AntiGrav",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try { p.method("RPC_ApplyBuff").invoke(7); count++; } catch(_) {}
                        }
                        sendNotification("AntiGrav buff sent to " + count + " players!", false);
                    } catch(e) { sendNotification("Buff All AntiGrav: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sends AntiGravity buff to all players."
            }),
            new ButtonInfo({
                buttonText: "RPC Force All Invisible",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try { p.method("set_isHide").invoke(true); count++; } catch(_) {}
                        }
                        sendNotification("Hid " + count + " players!", false);
                    } catch(e) { sendNotification("Hide All: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Hides all other players."
            }),
            new ButtonInfo({
                buttonText: "RPC Force All Visible",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try { p.method("set_isHide").invoke(false); count++; } catch(_) {}
                        }
                        sendNotification("Unhid " + count + " players!", false);
                    } catch(e) { sendNotification("Unhide All: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Unhides all other players."
            }),
            new ButtonInfo({
                buttonText: "RPC Rainbow All",
                isTogglable: true,
                method: () => {
                    try {
                        if (frameCount % 10 !== 0) return;
                        var h = (time * 0.5) % 1.0;
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try { p.method("RPC_SetColorHSV").invoke(99999.0, h, 1.0, 1.0); } catch(_) {}
                        }
                    } catch(e) {}
                },
                toolTip: "Cycles all players through rainbow colors."
            }),
            new ButtonInfo({
                buttonText: "RPC Explode All Items",
                method: () => {
                    try {
                        var count = 0;
                        var explodableClasses = [
                            "AnimalCompany.Bomb", "AnimalCompany.TimeBomb",
                            "AnimalCompany.PumpkinBomb", "AnimalCompany.StashGrenade",
                            "AnimalCompany.BroccoliGrenade", "AnimalCompany.TeleGrenade"
                        ];
                        for (var cls of explodableClasses) {
                            try {
                                var klass = AssemblyCSharp.class(cls);
                                var objs = Object.method("FindObjectsByType", 1).inflate(klass).invoke(0);
                                if (!objs || objs.isNull()) continue;
                                for (var i = 0; i < objs.length; i++) {
                                    try {
                                        var obj = objs.get(i);
                                        if (!obj || obj.isNull()) continue;
                                        obj.method("RPC_Explode").invoke();
                                        count++;
                                    } catch(_) {}
                                }
                            } catch(_) {}
                        }
                        sendNotification("Exploded " + count + " items!", false);
                    } catch(e) { sendNotification("Explode All: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Explodes all explosives in the scene."
            }),
            new ButtonInfo({
                buttonText: "Launch All Down",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try { p.method("RPC_AddForce").invoke([0, -1500, 0]); count++; } catch(_) {}
                        }
                        sendNotification("Slammed " + count + " players down!", false);
                    } catch(e) { sendNotification("Launch Down: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Slams all other players downward."
            }),
            new ButtonInfo({
                buttonText: "RPC Buff All Pink",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try { p.method("RPC_ApplyBuff").invoke(2); count++; } catch(_) {}
                        }
                        sendNotification("Pink buff -> " + count + " players!", false);
                    } catch(e) { sendNotification("Buff All Pink: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Applies PinkEffect buff to all players."
            }),
            new ButtonInfo({
                buttonText: "RPC Buff All Damage",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try { p.method("RPC_ApplyBuff").invoke(3); count++; } catch(_) {}
                        }
                        sendNotification("Damage buff -> " + count + " players!", false);
                    } catch(e) { sendNotification("Buff All Damage: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Applies Damage buff to all players."
            }),
            new ButtonInfo({
                buttonText: "RPC Buff All Scale",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try { p.method("RPC_ApplyBuff").invoke(5); count++; } catch(_) {}
                        }
                        sendNotification("Scale buff -> " + count + " players!", false);
                    } catch(e) { sendNotification("Buff All Scale: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Applies Scale buff to all players."
            }),
            new ButtonInfo({
                buttonText: "RPC Buff All Stinky",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try { p.method("RPC_ApplyBuff").invoke(6); p.method("RPC_TagAsStinky").invoke(); count++; } catch(_) {}
                        }
                        sendNotification("Stinky buff -> " + count + " players!", false);
                    } catch(e) { sendNotification("Buff All Stinky: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Tags all players  + stinky buff."
            }),
            new ButtonInfo({
                buttonText: "RPC TP All 2 Void",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try { p.method("RPC_Teleport").invoke([0, -99999, 0]); count++; } catch(_) {}
                        }
                        sendNotification("Voided " + count + " players!", false);
                    } catch(e) { sendNotification("TP Void: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Teleports all other players to the void."
            }),
            new ButtonInfo({
                buttonText: "RPC Kill Me Loop",
                isTogglable: true,
                method: () => {
                    if (time > lagGunDelay) {
                        lagGunDelay = time + 0.5;
                        try {
                            var player = NetPlayer.method("get_localPlayer").invoke();
                            if (!player || player.handle.isNull()) return;
                            player.method("RPC_DoPlayerDie").invoke(true);
                        } catch(_) {}
                    }
                },
                toolTip: "Repeatedly kills yourself every 0.5s (toggle)."
            }),
            new ButtonInfo({
                buttonText: "RPC Force All Red Team",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try { p.method("RPC_SetTeam").invoke(1); count++; } catch(_) {}
                        }
                        sendNotification("Set " + count + " players to red team!", false);
                    } catch(e) { sendNotification("Force Team: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets all other players to red team."
            }),
            new ButtonInfo({
                buttonText: "RPC Force All Blue Team",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try { p.method("RPC_SetTeam").invoke(2); count++; } catch(_) {}
                        }
                        sendNotification("Set " + count + " players to blue team!", false);
                    } catch(e) { sendNotification("Force Team: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets all other players to blue team."
            }),
            new ButtonInfo({
                buttonText: "RPC Color All Rainbow",
                isTogglable: true,
                method: () => {
                    if (frameCount % 8 !== 0) return;
                    try {
                        var h = (time * 0.4) % 1.0;
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull()) continue;
                            try { p.method("RPC_SetColorHSV").invoke(99999.0, h, 1.0, 1.0); } catch(_) {}
                        }
                    } catch(_) {}
                },
                toolTip: "Cycles all players (incl. you) through rainbow colors continuously."
            }),
            new ButtonInfo({
                buttonText: "RPC Explode All Bags",
                method: () => {
                    try {
                        var count = 0;
                        var allBags = Object.method("FindObjectsByType", 1).inflate(BackpackItemClass).invoke(0);
                        if (allBags && !allBags.isNull()) {
                            for (var bi = 0; bi < allBags.length; bi++) {
                                try {
                                    var bag = allBags.get(bi);
                                    if (!bag || bag.isNull()) continue;
                                    try { bag.method("Explode").invoke(); count++; } catch(_) {}
                                } catch(_) {}
                            }
                        }
                        sendNotification("Exploded " + count + " bags!", false);
                    } catch(e) { sendNotification("Explode Bags: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Explodes all backpacks in the scene."
            }),
            new ButtonInfo({
                buttonText: "RPC Hit All 50",
                method: () => {
                    try {
                        var dmgNull = DamageSourceInfoClass.method("get_Null").invoke();
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try {
                                var pos = getTransform(p).method("get_position").invoke();
                                p.method("RPC_PlayerHit", 3).invoke(50, pos, dmgNull);
                                count++;
                            } catch(_) {}
                        }
                        sendNotification("Hit " + count + " players for 50dmg!", false);
                    } catch(e) { sendNotification("Hit All: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Deals 50 damage to all other players."
            }),
            new ButtonInfo({
                buttonText: "RPC Bounce All",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            var rX = (Math.random() - 0.5) * 2000;
                            var rZ = (Math.random() - 0.5) * 2000;
                            try { p.method("RPC_AddForce").invoke([rX, 1200, rZ]); count++; } catch(_) {}
                        }
                        sendNotification("Bounced " + count + " players!", false);
                    } catch(e) { sendNotification("Bounce All: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Launches all other players in random directions."
            }),
            new ButtonInfo({
                buttonText: "RPC All Wanted",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try { p.method("set_isWanted").invoke(true); count++; } catch(_) {}
                        }
                        sendNotification("Marked " + count + " players wanted!", false);
                    } catch(e) { sendNotification("All Wanted: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Marks all other players ."
            }),
            new ButtonInfo({
                buttonText: "RPC Clear Wanted All",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try { p.method("set_isWanted").invoke(false); count++; } catch(_) {}
                        }
                        sendNotification("Cleared wanted on " + count + " players!", false);
                    } catch(e) { sendNotification("Clear Wanted: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Clears wanted status from all players."
            }),
            new ButtonInfo({
                buttonText: "RPC Add Kills All",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try {
                                var kills = p.method("get_kills").invoke();
                                p.method("set_kills").invoke(kills + 10);
                                count++;
                            } catch(_) {}
                        }
                        sendNotification("+10 kills to " + count + " players!", false);
                    } catch(e) { sendNotification("Add Kills: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Adds 10 kills to all players."
            }),
            new ButtonInfo({
                buttonText: "RPC VFX Spam",
                isTogglable: true,
                method: () => {
                    if (time > lagGunDelay) {
                        lagGunDelay = time + 0.2;
                        try {
                            var runner = SFXManager.field("_instance").value.method("get__currentRunner").invoke();
                            var me = NetPlayer.method("get_localPlayer").invoke();
                            var pos = getTransform(me).method("get_position").invoke();
                            var vfxList = [
                                VFXTypes.ConfettiBurst, VFXTypes.GreenBlink, VFXTypes.Ethereal_Void,
                                VFXTypes.Explosion_Coins, VFXTypes.Explosion_Feathers, VFXTypes.Explosion_Popcorn,
                                VFXTypes.MeatExplosion_1, VFXTypes.MeatExplosion_2, VFXTypes.MidAirJump_Fart,
                                VFXTypes.FuelExplosion, VFXTypes.Electricity_Small
                            ];
                            var vfx = vfxList[Math.floor(Math.random() * vfxList.length)];
                            ParticleManagerClass.method("RPC_PlayVFX", 4).invoke(runner, vfx, pos, identityQuaternion);
                        } catch(_) {}
                    }
                },
                toolTip: "Spams random VFX effects at your position every 0.2s (toggle)."
            }),
            new ButtonInfo({
                buttonText: "RPC Kill All Loop",
                isTogglable: true,
                method: () => {
                    if (time > lagGunDelay) {
                        lagGunDelay = time + 0.8;
                        try {
                            var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                            var vals = playerDict.method("get_Values").invoke();
                            var en = vals.method("GetEnumerator").invoke();
                            while (en.method("MoveNext").invoke()) {
                                var p = en.method("get_Current").invoke();
                                if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                                try { p.method("RPC_DoPlayerDie").invoke(true); } catch(_) {}
                            }
                        } catch(_) {}
                    }
                },
                toolTip: "Repeatedly kills all other players every 0.8s (toggle)."
            }),
            new ButtonInfo({
                buttonText: "RPC VFX All Spam",
                isTogglable: true,
                method: () => {
                    if (time > lagGunDelay) {
                        lagGunDelay = time + 0.15;
                        try {
                            var runner = SFXManager.field("_instance").value.method("get__currentRunner").invoke();
                            var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                            var vals = playerDict.method("get_Values").invoke();
                            var en = vals.method("GetEnumerator").invoke();
                            while (en.method("MoveNext").invoke()) {
                                var p = en.method("get_Current").invoke();
                                if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                                var pos = getTransform(p).method("get_position").invoke();
                                var vfxList = [
                                    VFXTypes.ConfettiBurst, VFXTypes.GreenBlink, VFXTypes.Ethereal_Void,
                                    VFXTypes.MeatExplosion_1, VFXTypes.MidAirJump_Fart, VFXTypes.FuelExplosion
                                ];
                                var vfx = vfxList[Math.floor(Math.random() * vfxList.length)];
                                try { ParticleManagerClass.method("RPC_PlayVFX", 4).invoke(runner, vfx, pos, identityQuaternion); } catch(_) {}
                            }
                        } catch(_) {}
                    }
                },
                toolTip: "Spams random VFX on all other players every 0.15s (toggle)."
            }),
            new ButtonInfo({
                buttonText: "RPC Bounce All Loop",
                isTogglable: true,
                method: () => {
                    if (time > lagGunDelay) {
                        lagGunDelay = time + 0.5;
                        try {
                            var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                            var vals = playerDict.method("get_Values").invoke();
                            var en = vals.method("GetEnumerator").invoke();
                            while (en.method("MoveNext").invoke()) {
                                var p = en.method("get_Current").invoke();
                                if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                                var rX = (Math.random() - 0.5) * 3000;
                                var rZ = (Math.random() - 0.5) * 3000;
                                try { p.method("RPC_AddForce").invoke([rX, 1500, rZ]); } catch(_) {}
                            }
                        } catch(_) {}
                    }
                },
                toolTip: "Continuously bounces all other players in random directions (toggle)."
            }),
            new ButtonInfo({
                buttonText: "RPC Hit All Loop",
                isTogglable: true,
                method: () => {
                    if (time > lagGunDelay) {
                        lagGunDelay = time + 0.3;
                        try {
                            var dmgNull = DamageSourceInfoClass.method("get_Null").invoke();
                            var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                            var vals = playerDict.method("get_Values").invoke();
                            var en = vals.method("GetEnumerator").invoke();
                            while (en.method("MoveNext").invoke()) {
                                var p = en.method("get_Current").invoke();
                                if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                                try {
                                    var pos = getTransform(p).method("get_position").invoke();
                                    p.method("RPC_PlayerHit", 3).invoke(10, pos, dmgNull);
                                } catch(_) {}
                            }
                        } catch(_) {}
                    }
                },
                toolTip: "Continuously deals 10 damage to all other players every 0.3s (toggle)."
            }),
            new ButtonInfo({
                buttonText: "RPC Stun All Loop",
                isTogglable: true,
                method: () => {
                    if (time > lagGunDelay) {
                        lagGunDelay = time + 1.0;
                        try {
                            var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                            var vals = playerDict.method("get_Values").invoke();
                            var en = vals.method("GetEnumerator").invoke();
                            while (en.method("MoveNext").invoke()) {
                                var p = en.method("get_Current").invoke();
                                if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                                try {
                                    var pos = getTransform(p).method("get_position").invoke();
                                    p.method("RPC_PlayerStun").invoke(pos, 5.0, 5.0, 1);
                                } catch(_) {}
                            }
                        } catch(_) {}
                    }
                },
                toolTip: "Continuously stuns all other players every 1s (toggle)."
            }),
            new ButtonInfo({
                buttonText: "RPC All Ragdoll Loop",
                isTogglable: true,
                method: () => {
                    if (time > lagGunDelay) {
                        lagGunDelay = time + 1.5;
                        try {
                            var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                            var vals = playerDict.method("get_Values").invoke();
                            var en = vals.method("GetEnumerator").invoke();
                            while (en.method("MoveNext").invoke()) {
                                var p = en.method("get_Current").invoke();
                                if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                                try {
                                    var pos = getTransform(p).method("get_position").invoke();
                                    p.method("RPC_PlayerStun").invoke(pos, 999.0, 9999.0, 0);
                                } catch(_) {}
                            }
                        } catch(_) {}
                    }
                },
                toolTip: "Continuously ragdolls all other players (toggle)."
            }),
            new ButtonInfo({
                buttonText: "RPC Money All +10M",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try { p.method("RPC_AddPlayerMoney").invoke(10000000); count++; } catch(_) {}
                        }
                        sendNotification("Gave 10M money to " + count + " players!", false);
                    } catch(e) { sendNotification("Money All: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Gives 10,000,000 money to all other players."
            }),
            new ButtonInfo({
                buttonText: "RPC Inf Money All +10M",
                enableMethod: () => { rpcMoneyAllLoopDelay = 0; sendNotification("RPC Inf Money All ON", false); },
                disableMethod: () => { sendNotification("RPC Inf Money All OFF", false); },
                isTogglable: true,
                method: () => {
                    if (time <= rpcMoneyAllLoopDelay) return;
                    rpcMoneyAllLoopDelay = time + 0.9;
                    try {
                        for (var p of getAllNetPlayersList(false)) {
                            try { p.method("RPC_AddPlayerMoney").invoke(10000000); } catch(_) {}
                        }
                    } catch(e) { console.error("RPC Inf Money All:", e); }
                },
                toolTip: "Continuously gives 10,000,000 money to all other players with a low-frequency loop."
            }),
            new ButtonInfo({
                buttonText: "RPC Money Drain All",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try { p.method("RPC_AddPlayerMoney").invoke(-99999); count++; } catch(_) {}
                        }
                        sendNotification("Drained money from " + count + " players!", false);
                    } catch(e) { sendNotification("Money Drain: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Removes 99999 money from all other players."
            }),
            new ButtonInfo({
                buttonText: "RPC Chaos All Loop",
                isTogglable: true,
                method: () => {
                    if (time > lagGunDelay) {
                        lagGunDelay = time + 0.6;
                        try {
                            var dmgNull = DamageSourceInfoClass.method("get_Null").invoke();
                            var runner = SFXManager.field("_instance").value.method("get__currentRunner").invoke();
                            var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                            var vals = playerDict.method("get_Values").invoke();
                            var en = vals.method("GetEnumerator").invoke();
                            var actions = ["force", "stun", "hit", "vfx", "color", "tp"];
                            var vfxList = [
                                VFXTypes.ConfettiBurst, VFXTypes.Ethereal_Void, VFXTypes.MeatExplosion_1,
                                VFXTypes.FuelExplosion, VFXTypes.Electricity_Small, VFXTypes.MidAirJump_Fart
                            ];
                            while (en.method("MoveNext").invoke()) {
                                var p = en.method("get_Current").invoke();
                                if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                                var action = actions[Math.floor(Math.random() * actions.length)];
                                try {
                                    var pos = getTransform(p).method("get_position").invoke();
                                    if (action === "force") {
                                        var rX = (Math.random() - 0.5) * 2000;
                                        var rZ = (Math.random() - 0.5) * 2000;
                                        p.method("RPC_AddForce").invoke([rX, 1000 + Math.random() * 500, rZ]);
                                    } else if (action === "stun") {
                                        p.method("RPC_PlayerStun").invoke(pos, 5.0, 3.0, 1);
                                    } else if (action === "hit") {
                                        p.method("RPC_PlayerHit", 3).invoke(10, pos, dmgNull);
                                    } else if (action === "vfx") {
                                        var vfx = vfxList[Math.floor(Math.random() * vfxList.length)];
                                        ParticleManagerClass.method("RPC_PlayVFX", 4).invoke(runner, vfx, pos, identityQuaternion);
                                    } else if (action === "color") {
                                        var h = Math.random();
                                        p.method("RPC_SetColorHSV").invoke(99999.0, h, 1.0, 1.0);
                                    } else if (action === "tp") {
                                        var rTpX = pos.field("x").value + (Math.random() - 0.5) * 20;
                                        var rTpZ = pos.field("z").value + (Math.random() - 0.5) * 20;
                                        p.method("RPC_Teleport").invoke([rTpX, pos.field("y").value + 5, rTpZ]);
                                    }
                                } catch(_) {}
                            }
                        } catch(_) {}
                    }
                },
                toolTip: "Randomly applies force/stun/hit/VFX/color/TP to all players every 0.6s (toggle)."
            }),
            new ButtonInfo({
                buttonText: "RPC Give Me Invincible",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        player.method("set_isInvincible").invoke(true);
                        sendNotification("Invincible ON!", false);
                    } catch(e) { sendNotification("Invincible: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets yourself to invincible via networked field."
            }),
            new ButtonInfo({
                buttonText: "RPC Remove Invincible",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        player.method("set_isInvincible").invoke(false);
                        sendNotification("Invincible OFF!", false);
                    } catch(e) { sendNotification("Invincible: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Removes your invincibility."
            }),
            new ButtonInfo({
                buttonText: "RPC Give Me Money",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        player.method("RPC_AddPlayerMoney").invoke(9999);
                        sendNotification("Added 9999 money!", false);
                    } catch(e) { sendNotification("Give Money: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Gives yourself 9999 money."
            }),
            new ButtonInfo({
                buttonText: "RPC TP Me To Sky",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        var pos = getTransform(player).method("get_position").invoke();
                        selfRPC(() => player.method("RPC_Teleport").invoke([pos.field("x").value, pos.field("y").value + 200, pos.field("z").value]));
                        sendNotification("Teleported to sky!", false);
                    } catch(e) { sendNotification("TP Sky: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Teleports you 200 units straight up."
            }),
            new ButtonInfo({
                buttonText: "RPC Explosive Launch Me",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        var rX = (Math.random() - 0.5) * 3000;
                        var rZ = (Math.random() - 0.5) * 3000;
                        selfRPC(() => player.method("RPC_AddForce").invoke([rX, 2500, rZ]));
                        sendNotification("Explosive launch!", false);
                    } catch(e) { sendNotification("Explosive Launch: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Launches yourself in a random explosive direction."
            }),
            new ButtonInfo({
                buttonText: "RPC All Kill Revive Loop",
                isTogglable: true,
                method: () => {
                    if (time > lagGunDelay) {
                        lagGunDelay = time + 0.4;
                        try {
                            var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                            var vals = playerDict.method("get_Values").invoke();
                            var en = vals.method("GetEnumerator").invoke();
                            while (en.method("MoveNext").invoke()) {
                                var p = en.method("get_Current").invoke();
                                if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                                try {
                                    var isDead = p.method("get_isDie").invoke();
                                    p.method("RPC_DoPlayerDie").invoke(!isDead);
                                } catch(_) {}
                            }
                        } catch(_) {}
                    }
                },
                toolTip: "Rapidly toggles all players between alive and dead (toggle)."
            }),
            new ButtonInfo({
                buttonText: "RPC Force Wanted All Loop",
                isTogglable: true,
                method: () => {
                    if (time > lagGunDelay) {
                        lagGunDelay = time + 0.5;
                        try {
                            var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                            var vals = playerDict.method("get_Values").invoke();
                            var en = vals.method("GetEnumerator").invoke();
                            while (en.method("MoveNext").invoke()) {
                                var p = en.method("get_Current").invoke();
                                if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                                try { p.method("set_isWanted").invoke(true); } catch(_) {}
                            }
                        } catch(_) {}
                    }
                },
                toolTip: "Continuously keeps all players wanted (toggle)."
            }),
            new ButtonInfo({
                buttonText: "RPC Gun Kill",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    var ray = gunData.ray;
                    if (!ray || ray.handle.isNull()) return;
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.4;
                        try {
                            var hitCollider = ray.method("get_collider").invoke();
                            if (!hitCollider || hitCollider.isNull()) return;
                            var hitGO = hitCollider.method("get_gameObject").invoke();
                            var hitPlayer = hitGO.method("GetComponentInParent", 0).inflate(NetPlayer).invoke();
                            if (!hitPlayer || hitPlayer.isNull()) { sendNotification("No player there", false); return; }
                            if (playerIsLocal(hitPlayer)) return;
                            hitPlayer.method("RPC_DoPlayerDie").invoke(true);
                            sendNotification("Killed: " + getPlayerName(hitPlayer), false);
                        } catch(e) { console.error("RPC Gun Kill:", e); }
                    }
                },
                toolTip: "Point at any player, pull trigger to kill them (hold grip)."
            }),
            new ButtonInfo({
                buttonText: "RPC Gun Revive",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    var ray = gunData.ray;
                    if (!ray || ray.handle.isNull()) return;
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.4;
                        try {
                            var hitCollider = ray.method("get_collider").invoke();
                            if (!hitCollider || hitCollider.isNull()) return;
                            var hitGO = hitCollider.method("get_gameObject").invoke();
                            var hitPlayer = hitGO.method("GetComponentInParent", 0).inflate(NetPlayer).invoke();
                            if (!hitPlayer || hitPlayer.isNull()) { sendNotification("No player there", false); return; }
                            hitPlayer.method("RPC_DoPlayerDie").invoke(false);
                            sendNotification("Revived: " + getPlayerName(hitPlayer), false);
                        } catch(e) { console.error("RPC Gun Revive:", e); }
                    }
                },
                toolTip: "Point at any player, pull trigger to revive them (hold grip)."
            }),
            new ButtonInfo({
                buttonText: "RPC Gun Launch",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    var ray = gunData.ray;
                    if (!ray || ray.handle.isNull()) return;
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.4;
                        try {
                            var hitCollider = ray.method("get_collider").invoke();
                            if (!hitCollider || hitCollider.isNull()) return;
                            var hitGO = hitCollider.method("get_gameObject").invoke();
                            var hitPlayer = hitGO.method("GetComponentInParent", 0).inflate(NetPlayer).invoke();
                            if (!hitPlayer || hitPlayer.isNull()) { sendNotification("No player there", false); return; }
                            if (playerIsLocal(hitPlayer)) return;
                            hitPlayer.method("RPC_AddForce").invoke([0, 1500, 0]);
                            sendNotification("Launched: " + getPlayerName(hitPlayer), false);
                        } catch(e) { console.error("RPC Gun Launch:", e); }
                    }
                },
                toolTip: "Point at any player, pull trigger to launch them (hold grip)."
            }),
            new ButtonInfo({
                buttonText: "RPC Gun Stun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    var ray = gunData.ray;
                    if (!ray || ray.handle.isNull()) return;
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.5;
                        try {
                            var hitCollider = ray.method("get_collider").invoke();
                            if (!hitCollider || hitCollider.isNull()) return;
                            var hitGO = hitCollider.method("get_gameObject").invoke();
                            var hitPlayer = hitGO.method("GetComponentInParent", 0).inflate(NetPlayer).invoke();
                            if (!hitPlayer || hitPlayer.isNull()) { sendNotification("No player there", false); return; }
                            if (playerIsLocal(hitPlayer)) return;
                            var pos = getTransform(hitPlayer).method("get_position").invoke();
                            hitPlayer.method("RPC_PlayerStun").invoke(pos, 5.0, 5.0, 1);
                            sendNotification("Stunned: " + getPlayerName(hitPlayer), false);
                        } catch(e) { console.error("RPC Gun Stun:", e); }
                    }
                },
                toolTip: "Point at any player, pull trigger to stun them (hold grip)."
            }),
            new ButtonInfo({
                buttonText: "RPC Gun Freeze",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    var ray = gunData.ray;
                    if (!ray || ray.handle.isNull()) return;
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.5;
                        try {
                            var hitCollider = ray.method("get_collider").invoke();
                            if (!hitCollider || hitCollider.isNull()) return;
                            var hitGO = hitCollider.method("get_gameObject").invoke();
                            var hitPlayer = hitGO.method("GetComponentInParent", 0).inflate(NetPlayer).invoke();
                            if (!hitPlayer || hitPlayer.isNull()) { sendNotification("No player there", false); return; }
                            if (playerIsLocal(hitPlayer)) return;
                            var pos = getTransform(hitPlayer).method("get_position").invoke();
                            hitPlayer.method("RPC_PlayerStun").invoke(pos, 999.0, 9999.0, 0);
                            sendNotification("Froze: " + getPlayerName(hitPlayer), false);
                        } catch(e) { console.error("RPC Gun Freeze:", e); }
                    }
                },
                toolTip: "Point at any player, pull trigger to freeze them indefinitely (hold grip)."
            }),
            new ButtonInfo({
                buttonText: "RPC Gun Color",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    var ray = gunData.ray;
                    if (!ray || ray.handle.isNull()) return;
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.3;
                        try {
                            var hitCollider = ray.method("get_collider").invoke();
                            if (!hitCollider || hitCollider.isNull()) return;
                            var hitGO = hitCollider.method("get_gameObject").invoke();
                            var hitPlayer = hitGO.method("GetComponentInParent", 0).inflate(NetPlayer).invoke();
                            if (!hitPlayer || hitPlayer.isNull()) { sendNotification("No player there", false); return; }
                            var h = (time * 0.5) % 1.0;
                            hitPlayer.method("RPC_SetColorHSV").invoke(99999.0, h, 1.0, 1.0);
                            sendNotification("Rainbow'd: " + getPlayerName(hitPlayer), false);
                        } catch(e) { console.error("RPC Gun Color:", e); }
                    }
                },
                toolTip: "Point at any player, pull trigger to rainbow them (hold grip)."
            }),
            new ButtonInfo({
                buttonText: "RPC Gun Scale Big",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    var ray = gunData.ray;
                    if (!ray || ray.handle.isNull()) return;
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.4;
                        try {
                            var hitCollider = ray.method("get_collider").invoke();
                            if (!hitCollider || hitCollider.isNull()) return;
                            var hitGO = hitCollider.method("get_gameObject").invoke();
                            var hitPlayer = hitGO.method("GetComponentInParent", 0).inflate(NetPlayer).invoke();
                            if (!hitPlayer || hitPlayer.isNull()) { sendNotification("No player there", false); return; }
                            try { hitPlayer.method("set_playerScale").invoke(5.0); } catch(_) {}
                            try { hitPlayer.field("_playerScale").value = 5.0; } catch(_) {}
                            sendNotification("Scaled big: " + getPlayerName(hitPlayer), false);
                        } catch(e) { console.error("RPC Gun Scale:", e); }
                    }
                },
                toolTip: "Point at any player, pull trigger to make them big (hold grip)."
            }),
            new ButtonInfo({
                buttonText: "RPC Gun Scale Tiny",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    var ray = gunData.ray;
                    if (!ray || ray.handle.isNull()) return;
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.4;
                        try {
                            var hitCollider = ray.method("get_collider").invoke();
                            if (!hitCollider || hitCollider.isNull()) return;
                            var hitGO = hitCollider.method("get_gameObject").invoke();
                            var hitPlayer = hitGO.method("GetComponentInParent", 0).inflate(NetPlayer).invoke();
                            if (!hitPlayer || hitPlayer.isNull()) { sendNotification("No player there", false); return; }
                            try { hitPlayer.method("set_playerScale").invoke(0.1); } catch(_) {}
                            try { hitPlayer.field("_playerScale").value = 0.1; } catch(_) {}
                            sendNotification("Shrunk: " + getPlayerName(hitPlayer), false);
                        } catch(e) { console.error("RPC Gun Scale Tiny:", e); }
                    }
                },
                toolTip: "Point at any player, pull trigger to shrink them (hold grip)."
            }),
            new ButtonInfo({
                buttonText: "RPC Gun Buff Speed",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    var ray = gunData.ray;
                    if (!ray || ray.handle.isNull()) return;
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.4;
                        try {
                            var hitCollider = ray.method("get_collider").invoke();
                            if (!hitCollider || hitCollider.isNull()) return;
                            var hitGO = hitCollider.method("get_gameObject").invoke();
                            var hitPlayer = hitGO.method("GetComponentInParent", 0).inflate(NetPlayer).invoke();
                            if (!hitPlayer || hitPlayer.isNull()) { sendNotification("No player there", false); return; }
                            hitPlayer.method("RPC_ApplyBuff").invoke(1);
                            sendNotification("Speed buff -> " + getPlayerName(hitPlayer), false);
                        } catch(e) { console.error("RPC Gun Buff Speed:", e); }
                    }
                },
                toolTip: "Point at any player, pull trigger to give them SpeedBoost (hold grip)."
            }),
            new ButtonInfo({
                buttonText: "RPC Gun AntiGrav",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    var ray = gunData.ray;
                    if (!ray || ray.handle.isNull()) return;
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.4;
                        try {
                            var hitCollider = ray.method("get_collider").invoke();
                            if (!hitCollider || hitCollider.isNull()) return;
                            var hitGO = hitCollider.method("get_gameObject").invoke();
                            var hitPlayer = hitGO.method("GetComponentInParent", 0).inflate(NetPlayer).invoke();
                            if (!hitPlayer || hitPlayer.isNull()) { sendNotification("No player there", false); return; }
                            hitPlayer.method("RPC_ApplyBuff").invoke(7);
                            sendNotification("AntiGrav -> " + getPlayerName(hitPlayer), false);
                        } catch(e) { console.error("RPC Gun AntiGrav:", e); }
                    }
                },
                toolTip: "Point at any player, pull trigger to give them AntiGravity (hold grip)."
            }),
            new ButtonInfo({
                buttonText: "RPC Gun Void",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    var ray = gunData.ray;
                    if (!ray || ray.handle.isNull()) return;
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.4;
                        try {
                            var hitCollider = ray.method("get_collider").invoke();
                            if (!hitCollider || hitCollider.isNull()) return;
                            var hitGO = hitCollider.method("get_gameObject").invoke();
                            var hitPlayer = hitGO.method("GetComponentInParent", 0).inflate(NetPlayer).invoke();
                            if (!hitPlayer || hitPlayer.isNull()) { sendNotification("No player there", false); return; }
                            if (playerIsLocal(hitPlayer)) return;
                            hitPlayer.method("RPC_Teleport").invoke([0, -99999, 0]);
                            sendNotification("Voided: " + getPlayerName(hitPlayer), false);
                        } catch(e) { console.error("RPC Gun Void:", e); }
                    }
                },
                toolTip: "Point at any player, pull trigger to void them (hold grip)."
            }),
            new ButtonInfo({
                buttonText: "RPC Gun Hit 50",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    var ray = gunData.ray;
                    if (!ray || ray.handle.isNull()) return;
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.3;
                        try {
                            var hitCollider = ray.method("get_collider").invoke();
                            if (!hitCollider || hitCollider.isNull()) return;
                            var hitGO = hitCollider.method("get_gameObject").invoke();
                            var hitPlayer = hitGO.method("GetComponentInParent", 0).inflate(NetPlayer).invoke();
                            if (!hitPlayer || hitPlayer.isNull()) { sendNotification("No player there", false); return; }
                            if (playerIsLocal(hitPlayer)) return;
                            var pos = getTransform(hitPlayer).method("get_position").invoke();
                            var dmgNull = DamageSourceInfoClass.method("get_Null").invoke();
                            hitPlayer.method("RPC_PlayerHit", 3).invoke(50, pos, dmgNull);
                            sendNotification("Hit 50dmg: " + getPlayerName(hitPlayer), false);
                        } catch(e) { console.error("RPC Gun Hit 50:", e); }
                    }
                },
                toolTip: "Point at any player, pull trigger to deal 50 damage (hold grip)."
            }),
            new ButtonInfo({
                buttonText: "RPC Fake Death Me Loop",
                isTogglable: true,
                method: () => {
                    if (time > lagGunDelay) {
                        lagGunDelay = time + 0.3;
                        try {
                            var player = NetPlayer.method("get_localPlayer").invoke();
                            if (!player || player.handle.isNull()) return;
                            var cur = player.method("get_isDie").invoke();
                            player.method("set_isDie").invoke(!cur);
                        } catch(_) {}
                    }
                },
                toolTip: "Rapidly toggles your own death state (ghost effect, toggle)."
            }),
            new ButtonInfo({
                buttonText: "RPC Self Buff All",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        var buffIDs = [1, 2, 3, 5, 7]; 
                        for (var bid of buffIDs) {
                            try { player.method("RPC_ApplyBuff").invoke(bid); } catch(_) {}
                        }
                        sendNotification("All buffs applied to self!", false);
                    } catch(e) { sendNotification("Self Buff All: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Applies all known buffs to yourself at once."
            }),
            new ButtonInfo({
                buttonText: "RPC Heal Me",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        try { player.method("set_healthLost").invoke(0); } catch(_) {}
                        try { player.method("set_isDie").invoke(false); } catch(_) {}
                        sendNotification("Healed to full!", false);
                    } catch(e) { sendNotification("Heal Me: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Resets your health (healthLost = 0) and revives if dead."
            }),
            new ButtonInfo({
                buttonText: "RPC Heal Me Loop",
                isTogglable: true,
                method: () => {
                    if (time > lagGunDelay) {
                        lagGunDelay = time + 0.5;
                        try {
                            var player = NetPlayer.method("get_localPlayer").invoke();
                            if (!player || player.handle.isNull()) return;
                            try { player.method("set_healthLost").invoke(0); } catch(_) {}
                            try { player.method("set_isDie").invoke(false); } catch(_) {}
                        } catch(_) {}
                    }
                },
                toolTip: "Continuously heals yourself every 0.5s (toggle)."
            }),
            new ButtonInfo({
                buttonText: "RPC All Color Rainbow Loop",
                isTogglable: true,
                method: () => {
                    if (frameCount % 6 !== 0) return;
                    try {
                        var h = (time * 0.6) % 1.0;
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull()) continue;
                            try { p.method("RPC_SetColorHSV").invoke(99999.0, h, 1.0, 1.0); } catch(_) {}
                        }
                    } catch(_) {}
                },
                toolTip: "Cycles ALL players (incl. you) through faster rainbow (toggle)."
            }),
            new ButtonInfo({
                buttonText: "RPC All Invincible",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try { p.method("set_isInvincible").invoke(true); count++; } catch(_) {}
                        }
                        sendNotification("Invincible -> " + count + " players!", false);
                    } catch(e) { sendNotification("All Invincible: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Makes all other players invincible."
            }),
            new ButtonInfo({
                buttonText: "RPC All Remove Invincible",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            try { p.method("set_isInvincible").invoke(false); count++; } catch(_) {}
                        }
                        sendNotification("Removed invincible from " + count + " players!", false);
                    } catch(e) { sendNotification("Remove Invincible: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Removes invincibility from all other players."
            }),
        ],
        [ 
            new ButtonInfo({
                buttonText: "Exit Credits",
                method: () => { currentCategory = 0; currentPage = 0; },
                isTogglable: false,
                toolTip: "Returns to main menu."
            }),
            new ButtonInfo({
                buttonText: "Credits to Monkong",
                method: () => { sendNotification("Credits to monkong for menu!", false, 6); },
                isTogglable: false,
                toolTip: "Credits to monkong for menu."
            }),
            new ButtonInfo({
                buttonText: "Credits to idk",
                method: () => { sendNotification("Credits to idk", false, 6); },
                isTogglable: false,
                toolTip: "Credits to idk."
            }),
            new ButtonInfo({
                buttonText: "Credits to Monkongs Menu",
                method: () => { sendNotification("Credits to Monkongs Menu", false, 6); },
                isTogglable: false,
                toolTip: "Credits to Monkongs Menu."
            }),
            new ButtonInfo({
                buttonText: "Credits to Skidding",
                method: () => { sendNotification("Credits to Skidding", false, 6); },
                isTogglable: false,
                toolTip: "Credits to Codex for skidding for me."
            }),
        ],
        [ 
            new ButtonInfo({
                buttonText: "Exit Monster RPCs",
                method: () => { currentCategory = 0; currentPage = 0; },
                isTogglable: false,
                toolTip: "Returns to main menu."
            }),
            new ButtonInfo({
                buttonText: "Kill All Mobs",
                method: () => {
                    try {
                        var count = 0;
                        for (var mobID of mobIDs) {
                            try {
                                var klass = AssemblyCSharp.class("AnimalCompany." + mobID.name + "Controller");
                                var objs = Object.method("FindObjectsByType", 1).inflate(klass).invoke(0);
                                if (!objs || objs.isNull()) continue;
                                for (var i = 0; i < objs.length; i++) {
                                    try {
                                        var mob = objs.get(i);
                                        if (!mob || mob.isNull()) continue;
                                        try { mob.method("RPC_KillMob").invoke(); count++; } catch(_) {
                                            try { mob.method("KillMob").invoke(); count++; } catch(_) {
                                                try { mob.method("Die").invoke(); count++; } catch(_) {}
                                            }
                                        }
                                    } catch(_) {}
                                }
                            } catch(_) {}
                        }
                        sendNotification("Killed " + count + " mobs!", false);
                    } catch(e) { sendNotification("Kill Mobs: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Kills all mobs in the scene."
            }),
            new ButtonInfo({
                buttonText: "Explode All Mobs",
                method: () => {
                    try {
                        var count = 0;
                        var runner = SFXManager.field("_instance").value.method("get__currentRunner").invoke();
                        for (var mobID of mobIDs) {
                            try {
                                var klass = AssemblyCSharp.class("AnimalCompany." + mobID.name + "Controller");
                                var objs = Object.method("FindObjectsByType", 1).inflate(klass).invoke(0);
                                if (!objs || objs.isNull()) continue;
                                for (var i = 0; i < objs.length; i++) {
                                    try {
                                        var mob = objs.get(i);
                                        if (!mob || mob.isNull()) continue;
                                        var pos = getTransform(mob).method("get_position").invoke();
                                        var allVFX = [
                                            VFXTypes.MeatExplosion_1, VFXTypes.MeatExplosion_2, VFXTypes.MeatExplosion_Headshot,
                                            VFXTypes.Explosion_Coins, VFXTypes.FuelExplosion, VFXTypes.Electricity_Small
                                        ];
                                        for (var vfx of allVFX) {
                                            try { ParticleManagerClass.method("RPC_PlayVFX", 4).invoke(runner, vfx, pos, identityQuaternion); } catch(_) {}
                                        }
                                        try { mob.method("RPC_KillMob").invoke(); } catch(_) {
                                            try { mob.method("KillMob").invoke(); } catch(_) {}
                                        }
                                        count++;
                                    } catch(_) {}
                                }
                            } catch(_) {}
                        }
                        sendNotification("Exploded " + count + " mobs!", false);
                    } catch(e) { sendNotification("Explode Mobs: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Kills all mobs with explosion VFX."
            }),
            new ButtonInfo({
                buttonText: "Mob VFX Spam",
                isTogglable: true,
                method: () => {
                    if (time > mobGunDelay) {
                        mobGunDelay = time + 0.3;
                        try {
                            var runner = SFXManager.field("_instance").value.method("get__currentRunner").invoke();
                            for (var mobID of mobIDs) {
                                try {
                                    var klass = AssemblyCSharp.class("AnimalCompany." + mobID.name + "Controller");
                                    var objs = Object.method("FindObjectsByType", 1).inflate(klass).invoke(0);
                                    if (!objs || objs.isNull()) continue;
                                    for (var i = 0; i < objs.length; i++) {
                                        try {
                                            var mob = objs.get(i);
                                            if (!mob || mob.isNull()) continue;
                                            var pos = getTransform(mob).method("get_position").invoke();
                                            var vfxList = [
                                                VFXTypes.ConfettiBurst, VFXTypes.Ethereal_Void,
                                                VFXTypes.MeatExplosion_1, VFXTypes.Electricity_Small, VFXTypes.FuelExplosion
                                            ];
                                            var vfx = vfxList[Math.floor(Math.random() * vfxList.length)];
                                            try { ParticleManagerClass.method("RPC_PlayVFX", 4).invoke(runner, vfx, pos, identityQuaternion); } catch(_) {}
                                        } catch(_) {}
                                    }
                                } catch(_) {}
                            }
                        } catch(_) {}
                    }
                },
                toolTip: "Spams random VFX on all mobs every 0.3s (toggle)."
            }),
            new ButtonInfo({
                buttonText: "Mob Kill Loop",
                isTogglable: true,
                method: () => {
                    if (time > mobGunDelay2) {
                        mobGunDelay2 = time + 1.5;
                        try {
                            for (var mobID of mobIDs) {
                                try {
                                    var klass = AssemblyCSharp.class("AnimalCompany." + mobID.name + "Controller");
                                    var objs = Object.method("FindObjectsByType", 1).inflate(klass).invoke(0);
                                    if (!objs || objs.isNull()) continue;
                                    for (var i = 0; i < objs.length; i++) {
                                        try {
                                            var mob = objs.get(i);
                                            if (!mob || mob.isNull()) continue;
                                            try { mob.method("RPC_KillMob").invoke(); } catch(_) {
                                                try { mob.method("KillMob").invoke(); } catch(_) {}
                                            }
                                        } catch(_) {}
                                    }
                                } catch(_) {}
                            }
                        } catch(_) {}
                    }
                },
                toolTip: "Continuously kills all mobs every 1.5s (toggle)."
            }),
            new ButtonInfo({
                buttonText: "Mob TP To Me",
                method: () => {
                    try {
                        var me = NetPlayer.method("get_localPlayer").invoke();
                        if (!me || me.handle.isNull()) return;
                        var pos = getTransform(me).method("get_position").invoke();
                        var count = 0;
                        for (var mobID of mobIDs) {
                            try {
                                var klass = AssemblyCSharp.class("AnimalCompany." + mobID.name + "Controller");
                                var objs = Object.method("FindObjectsByType", 1).inflate(klass).invoke(0);
                                if (!objs || objs.isNull()) continue;
                                for (var i = 0; i < objs.length; i++) {
                                    try {
                                        var mob = objs.get(i);
                                        if (!mob || mob.isNull()) continue;
                                        getTransform(mob).method("set_position").invoke(pos);
                                        count++;
                                    } catch(_) {}
                                }
                            } catch(_) {}
                        }
                        sendNotification("Teleported " + count + " mobs to you!", false);
                    } catch(e) { sendNotification("Mob TP: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Teleports all mobs to your position."
            }),
            new ButtonInfo({
                buttonText: "Mob Scale Big",
                method: () => {
                    try {
                        var count = 0;
                        for (var mobID of mobIDs) {
                            try {
                                var klass = AssemblyCSharp.class("AnimalCompany." + mobID.name + "Controller");
                                var objs = Object.method("FindObjectsByType", 1).inflate(klass).invoke(0);
                                if (!objs || objs.isNull()) continue;
                                for (var i = 0; i < objs.length; i++) {
                                    try {
                                        var mob = objs.get(i);
                                        if (!mob || mob.isNull()) continue;
                                        getTransform(mob).method("set_localScale").invoke([5, 5, 5]);
                                        count++;
                                    } catch(_) {}
                                }
                            } catch(_) {}
                        }
                        sendNotification("Scaled " + count + " mobs big!", false);
                    } catch(e) { sendNotification("Mob Scale: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Makes all mobs giant."
            }),
            new ButtonInfo({
                buttonText: "Mob Scale Tiny",
                method: () => {
                    try {
                        var count = 0;
                        for (var mobID of mobIDs) {
                            try {
                                var klass = AssemblyCSharp.class("AnimalCompany." + mobID.name + "Controller");
                                var objs = Object.method("FindObjectsByType", 1).inflate(klass).invoke(0);
                                if (!objs || objs.isNull()) continue;
                                for (var i = 0; i < objs.length; i++) {
                                    try {
                                        var mob = objs.get(i);
                                        if (!mob || mob.isNull()) continue;
                                        getTransform(mob).method("set_localScale").invoke([0.1, 0.1, 0.1]);
                                        count++;
                                    } catch(_) {}
                                }
                            } catch(_) {}
                        }
                        sendNotification("Shrunk " + count + " mobs!", false);
                    } catch(e) { sendNotification("Mob Scale: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Makes all mobs tiny."
            }),
            new ButtonInfo({
                buttonText: "Mob Freeze",
                isTogglable: true,
                method: () => {
                    if (time > mobGunDelay) {
                        mobGunDelay = time + 0.5;
                        try {
                            for (var mobID of mobIDs) {
                                try {
                                    var klass = AssemblyCSharp.class("AnimalCompany." + mobID.name + "Controller");
                                    var objs = Object.method("FindObjectsByType", 1).inflate(klass).invoke(0);
                                    if (!objs || objs.isNull()) continue;
                                    for (var i = 0; i < objs.length; i++) {
                                        try {
                                            var mob = objs.get(i);
                                            if (!mob || mob.isNull()) continue;
                                            try { mob.method("RPC_Stun").invoke(999.0); } catch(_) {}
                                            try { mob.method("Stun").invoke(999.0); } catch(_) {}
                                            try { mob.method("set_isStunned").invoke(true); } catch(_) {}
                                            try {
                                                var rb = getComponent(mob.method("get_gameObject").invoke(), Rigidbody);
                                                if (rb && !rb.isNull()) {
                                                    rb.method("set_isKinematic").invoke(true);
                                                }
                                            } catch(_) {}
                                        } catch(_) {}
                                    }
                                } catch(_) {}
                            }
                        } catch(_) {}
                    }
                },
                toolTip: "Continuously freezes all mobs (toggle)."
            }),
            new ButtonInfo({
                buttonText: "Mob Gun Kill",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    var ray = gunData.ray;
                    if (!ray || ray.handle.isNull()) return;
                    if (rightTrigger && time > mobGunDelay2) {
                        mobGunDelay2 = time + 0.4;
                        try {
                            var hitCollider = ray.method("get_collider").invoke();
                            if (!hitCollider || hitCollider.isNull()) return;
                            var hitGO = hitCollider.method("get_gameObject").invoke();
                            for (var mobID of mobIDs) {
                                try {
                                    var klass = AssemblyCSharp.class("AnimalCompany." + mobID.name + "Controller");
                                    var mob = hitGO.method("GetComponentInParent", 0).inflate(klass).invoke();
                                    if (!mob || mob.isNull()) continue;
                                    try { mob.method("RPC_KillMob").invoke(); } catch(_) {
                                        try { mob.method("KillMob").invoke(); } catch(_) {}
                                    }
                                    sendNotification("Killed " + mobID + "!", false);
                                    return;
                                } catch(_) {}
                            }
                            sendNotification("No mob there", false);
                        } catch(e) { console.error("Mob Gun Kill:", e); }
                    }
                },
                toolTip: "Point at a mob and pull trigger to kill it (hold grip)."
            }),
            new ButtonInfo({
                buttonText: "Mob Gun TP To Me",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    var ray = gunData.ray;
                    if (!ray || ray.handle.isNull()) return;
                    if (rightTrigger && time > mobGunDelay2) {
                        mobGunDelay2 = time + 0.4;
                        try {
                            var hitCollider = ray.method("get_collider").invoke();
                            if (!hitCollider || hitCollider.isNull()) return;
                            var hitGO = hitCollider.method("get_gameObject").invoke();
                            var me = NetPlayer.method("get_localPlayer").invoke();
                            if (!me) return;
                            var pos = getTransform(me).method("get_position").invoke();
                            for (var mobID of mobIDs) {
                                try {
                                    var klass = AssemblyCSharp.class("AnimalCompany." + mobID.name + "Controller");
                                    var mob = hitGO.method("GetComponentInParent", 0).inflate(klass).invoke();
                                    if (!mob || mob.isNull()) continue;
                                    getTransform(mob).method("set_position").invoke(pos);
                                    sendNotification("Teleported " + mobID + " to you!", false);
                                    return;
                                } catch(_) {}
                            }
                        } catch(e) { console.error("Mob Gun TP:", e); }
                    }
                },
                toolTip: "Point at a mob and pull trigger to teleport it to you (hold grip)."
            }),
            new ButtonInfo({
                buttonText: "Mob Gun Scale Big",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    var ray = gunData.ray;
                    if (!ray || ray.handle.isNull()) return;
                    if (rightTrigger && time > mobGunDelay2) {
                        mobGunDelay2 = time + 0.4;
                        try {
                            var hitCollider = ray.method("get_collider").invoke();
                            if (!hitCollider || hitCollider.isNull()) return;
                            var hitGO = hitCollider.method("get_gameObject").invoke();
                            for (var mobID of mobIDs) {
                                try {
                                    var klass = AssemblyCSharp.class("AnimalCompany." + mobID.name + "Controller");
                                    var mob = hitGO.method("GetComponentInParent", 0).inflate(klass).invoke();
                                    if (!mob || mob.isNull()) continue;
                                    getTransform(mob).method("set_localScale").invoke([5, 5, 5]);
                                    sendNotification("Scaled " + mobID + " big!", false);
                                    return;
                                } catch(_) {}
                            }
                        } catch(e) { console.error("Mob Scale Gun:", e); }
                    }
                },
                toolTip: "Point at a mob and pull trigger to make it giant (hold grip)."
            }),
            new ButtonInfo({
                buttonText: "Mob Gun VFX Explode",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    var ray = gunData.ray;
                    if (!ray || ray.handle.isNull()) return;
                    if (rightTrigger && time > mobGunDelay2) {
                        mobGunDelay2 = time + 0.5;
                        try {
                            var hitCollider = ray.method("get_collider").invoke();
                            if (!hitCollider || hitCollider.isNull()) return;
                            var hitGO = hitCollider.method("get_gameObject").invoke();
                            var runner = SFXManager.field("_instance").value.method("get__currentRunner").invoke();
                            for (var mobID of mobIDs) {
                                try {
                                    var klass = AssemblyCSharp.class("AnimalCompany." + mobID.name + "Controller");
                                    var mob = hitGO.method("GetComponentInParent", 0).inflate(klass).invoke();
                                    if (!mob || mob.isNull()) continue;
                                    var pos = getTransform(mob).method("get_position").invoke();
                                    var vfxs = [
                                        VFXTypes.MeatExplosion_1, VFXTypes.MeatExplosion_2, VFXTypes.MeatExplosion_Headshot,
                                        VFXTypes.FuelExplosion, VFXTypes.ConfettiBurst, VFXTypes.Ethereal_Void
                                    ];
                                    for (var vfx of vfxs) {
                                        try { ParticleManagerClass.method("RPC_PlayVFX", 4).invoke(runner, vfx, pos, identityQuaternion); } catch(_) {}
                                    }
                                    try { mob.method("RPC_KillMob").invoke(); } catch(_) {
                                        try { mob.method("KillMob").invoke(); } catch(_) {}
                                    }
                                    sendNotification("VFX Exploded " + mobID + "!", false);
                                    return;
                                } catch(_) {}
                            }
                        } catch(e) { console.error("Mob VFX Explode:", e); }
                    }
                },
                toolTip: "Point at a mob, trigger to explode it with VFX and kill it (hold grip)."
            }),
            new ButtonInfo({
                buttonText: "Mob Bounce All",
                method: () => {
                    try {
                        var count = 0;
                        for (var mobID of mobIDs) {
                            try {
                                var klass = AssemblyCSharp.class("AnimalCompany." + mobID.name + "Controller");
                                var objs = Object.method("FindObjectsByType", 1).inflate(klass).invoke(0);
                                if (!objs || objs.isNull()) continue;
                                for (var i = 0; i < objs.length; i++) {
                                    try {
                                        var mob = objs.get(i);
                                        if (!mob || mob.isNull()) continue;
                                        try {
                                            var rb = getComponent(mob.method("get_gameObject").invoke(), Rigidbody);
                                            if (rb && !rb.isNull()) {
                                                var rX = (Math.random() - 0.5) * 1500;
                                                var rZ = (Math.random() - 0.5) * 1500;
                                                rb.method("AddForce", 3).invoke([rX, 1200, rZ], 1);
                                                count++;
                                            }
                                        } catch(_) {}
                                    } catch(_) {}
                                }
                            } catch(_) {}
                        }
                        sendNotification("Bounced " + count + " mobs!", false);
                    } catch(e) { sendNotification("Mob Bounce: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Launches all mobs in random directions."
            }),
            new ButtonInfo({
                buttonText: "Mob Bounce Loop",
                isTogglable: true,
                method: () => {
                    if (time > mobGunDelay) {
                        mobGunDelay = time + 0.8;
                        try {
                            for (var mobID of mobIDs) {
                                try {
                                    var klass = AssemblyCSharp.class("AnimalCompany." + mobID.name + "Controller");
                                    var objs = Object.method("FindObjectsByType", 1).inflate(klass).invoke(0);
                                    if (!objs || objs.isNull()) continue;
                                    for (var i = 0; i < objs.length; i++) {
                                        try {
                                            var mob = objs.get(i);
                                            if (!mob || mob.isNull()) continue;
                                            var rb = getComponent(mob.method("get_gameObject").invoke(), Rigidbody);
                                            if (rb && !rb.isNull()) {
                                                var rX = (Math.random() - 0.5) * 2000;
                                                var rZ = (Math.random() - 0.5) * 2000;
                                                rb.method("AddForce", 3).invoke([rX, 1500, rZ], 1);
                                            }
                                        } catch(_) {}
                                    }
                                } catch(_) {}
                            }
                        } catch(_) {}
                    }
                },
                toolTip: "Continuously bounces all mobs every 0.8s (toggle)."
            }),
            new ButtonInfo({
                buttonText: "Mob TP Loop",
                isTogglable: true,
                method: () => {
                    if (time > mobGunDelay) {
                        mobGunDelay = time + 2.0;
                        try {
                            var me = NetPlayer.method("get_localPlayer").invoke();
                            if (!me || me.handle.isNull()) return;
                            var pos = getTransform(me).method("get_position").invoke();
                            for (var mobID of mobIDs) {
                                try {
                                    var klass = AssemblyCSharp.class("AnimalCompany." + mobID.name + "Controller");
                                    var objs = Object.method("FindObjectsByType", 1).inflate(klass).invoke(0);
                                    if (!objs || objs.isNull()) continue;
                                    for (var i = 0; i < objs.length; i++) {
                                        try {
                                            var mob = objs.get(i);
                                            if (!mob || mob.isNull()) continue;
                                            getTransform(mob).method("set_position").invoke(pos);
                                        } catch(_) {}
                                    }
                                } catch(_) {}
                            }
                        } catch(_) {}
                    }
                },
                toolTip: "Continuously teleports all mobs to you every 2s (toggle)."
            }),
            new ButtonInfo({
                buttonText: "Mob Mass Scale Loop",
                isTogglable: true,
                method: () => {
                    if (time > mobGunDelay) {
                        mobGunDelay = time + 0.3;
                        try {
                            var scl = Math.abs(Math.sin(time)) * 8 + 0.5;
                            for (var mobID of mobIDs) {
                                try {
                                    var klass = AssemblyCSharp.class("AnimalCompany." + mobID.name + "Controller");
                                    var objs = Object.method("FindObjectsByType", 1).inflate(klass).invoke(0);
                                    if (!objs || objs.isNull()) continue;
                                    for (var i = 0; i < objs.length; i++) {
                                        try {
                                            var mob = objs.get(i);
                                            if (!mob || mob.isNull()) continue;
                                            getTransform(mob).method("set_localScale").invoke([scl, scl, scl]);
                                        } catch(_) {}
                                    }
                                } catch(_) {}
                            }
                        } catch(_) {}
                    }
                },
                toolTip: "Continuously pulses mob scales (toggle)."
            }),
        ],
        [ 
            new ButtonInfo({
                buttonText: "Exit Extra WL",
                method: () => { currentCategory = 0; currentPage = 0; },
                isTogglable: false,
                toolTip: "Returns to main menu."
            }),
            new ButtonInfo({
                buttonText: "WL All Speed Loop",
                isTogglable: true,
                method: () => {
                    if (time > lagGunDelay) {
                        lagGunDelay = time + 3.0;
                        try {
                            var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                            var vals = playerDict.method("get_Values").invoke();
                            var en = vals.method("GetEnumerator").invoke();
                            while (en.method("MoveNext").invoke()) {
                                var p = en.method("get_Current").invoke();
                                if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                                if (whitelistEnabled && !whitelistHasPlayer(p)) continue;
                                try { p.method("RPC_ApplyBuff").invoke(1); } catch(_) {}
                            }
                        } catch(_) {}
                    }
                },
                toolTip: "Continuously re-applies SpeedBoost to all WL players every 3s (toggle)."
            }),
            new ButtonInfo({
                buttonText: "WL All AntiGrav Loop",
                isTogglable: true,
                method: () => {
                    if (time > lagGunDelay) {
                        lagGunDelay = time + 3.0;
                        try {
                            var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                            var vals = playerDict.method("get_Values").invoke();
                            var en = vals.method("GetEnumerator").invoke();
                            while (en.method("MoveNext").invoke()) {
                                var p = en.method("get_Current").invoke();
                                if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                                if (whitelistEnabled && !whitelistHasPlayer(p)) continue;
                                try { p.method("RPC_ApplyBuff").invoke(7); } catch(_) {}
                            }
                        } catch(_) {}
                    }
                },
                toolTip: "Continuously re-applies AntiGravity to all WL players every 3s (toggle)."
            }),
            new ButtonInfo({
                buttonText: "WL Invincible Loop",
                isTogglable: true,
                method: () => {
                    if (time > lagGunDelay) {
                        lagGunDelay = time + 0.5;
                        try {
                            var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                            var vals = playerDict.method("get_Values").invoke();
                            var en = vals.method("GetEnumerator").invoke();
                            while (en.method("MoveNext").invoke()) {
                                var p = en.method("get_Current").invoke();
                                if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                                if (whitelistEnabled && !whitelistHasPlayer(p)) continue;
                                try { p.method("set_isInvincible").invoke(true); } catch(_) {}
                            }
                        } catch(_) {}
                    }
                },
                toolTip: "Keeps all WL players invincible (toggle)."
            }),
            new ButtonInfo({
                buttonText: "WL Revive Loop",
                isTogglable: true,
                method: () => {
                    if (time > lagGunDelay) {
                        lagGunDelay = time + 1.0;
                        try {
                            var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                            var vals = playerDict.method("get_Values").invoke();
                            var en = vals.method("GetEnumerator").invoke();
                            while (en.method("MoveNext").invoke()) {
                                var p = en.method("get_Current").invoke();
                                if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                                if (whitelistEnabled && !whitelistHasPlayer(p)) continue;
                                try {
                                    var isDead = p.method("get_isDie").invoke();
                                    if (isDead) p.method("RPC_DoPlayerDie").invoke(false);
                                } catch(_) {}
                            }
                        } catch(_) {}
                    }
                },
                toolTip: "Auto-revives WL players when they die (toggle)."
            }),
            new ButtonInfo({
                buttonText: "WL Rainbow Loop",
                isTogglable: true,
                method: () => {
                    if (frameCount % 10 !== 0) return;
                    try {
                        var h = (time * 0.5) % 1.0;
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            if (whitelistEnabled && !whitelistHasPlayer(p)) continue;
                            try { p.method("RPC_SetColorHSV").invoke(99999.0, h, 1.0, 1.0); } catch(_) {}
                        }
                    } catch(_) {}
                },
                toolTip: "Continuously rainbow-cycles WL players (toggle)."
            }),
            new ButtonInfo({
                buttonText: "WL Bounce Gun Loop",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    if (time > lagGunDelay) {
                        lagGunDelay = time + 0.5;
                        try {
                            var target = getWhitelistGunTarget(gunData, true, 10.0);
                            if (!target || !target.player || target.blocked) return;
                            var rX = (Math.random() - 0.5) * 2000;
                            var rZ = (Math.random() - 0.5) * 2000;
                            target.player.method("RPC_AddForce").invoke([rX, 1300, rZ]);
                            sendNotification("Bounced " + target.id + "!", false);
                        } catch(e) { console.error("WL Bounce Gun:", e); }
                    }
                },
                toolTip: "Continuously bounces aimed WL player (hold grip)."
            }),
            new ButtonInfo({
                buttonText: "WL Kill Loop Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    if (time > lagGunDelay) {
                        lagGunDelay = time + 0.8;
                        try {
                            var target = getWhitelistGunTarget(gunData, true, 10.0);
                            if (!target || !target.player || target.blocked) return;
                            target.player.method("RPC_DoPlayerDie").invoke(true);
                        } catch(e) { console.error("WL Kill Loop:", e); }
                    }
                },
                toolTip: "Continuously kills aimed WL player (hold grip). Toggle on to keep killing."
            }),
            new ButtonInfo({
                buttonText: "WL VFX Spam Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    if (time > lagGunDelay) {
                        lagGunDelay = time + 0.2;
                        try {
                            var target = getWhitelistGunTarget(gunData, true, 10.0);
                            if (!target || !target.player || target.blocked) return;
                            var pos = getTransform(target.player).method("get_position").invoke();
                            var runner = SFXManager.field("_instance").value.method("get__currentRunner").invoke();
                            var vfxList = [
                                VFXTypes.ConfettiBurst, VFXTypes.GreenBlink, VFXTypes.Ethereal_Void,
                                VFXTypes.Explosion_Coins, VFXTypes.MeatExplosion_1, VFXTypes.MidAirJump_Fart
                            ];
                            var vfx = vfxList[Math.floor(Math.random() * vfxList.length)];
                            try { ParticleManagerClass.method("RPC_PlayVFX", 4).invoke(runner, vfx, pos, identityQuaternion); } catch(_) {}
                        } catch(e) { console.error("WL VFX Gun:", e); }
                    }
                },
                toolTip: "Spams random VFX on aimed WL player every 0.2s (hold grip)."
            }),
            new ButtonInfo({
                buttonText: "WL Invincible Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.5;
                        try {
                            var target = getWhitelistGunTarget(gunData, true, 10.0);
                            if (!target || !target.player) { sendNotification("No player there", false); return; }
                            if (target.blocked) { sendNotification("Not whitelisted: " + target.id, false); return; }
                            var cur = target.player.method("get_isInvincible").invoke();
                            target.player.method("set_isInvincible").invoke(!cur);
                            sendNotification((cur ? "Removed invincible from " : "Gave invincible to ") + target.id + "!", false);
                        } catch(e) { console.error("WL Invincible Gun:", e); }
                    }
                },
                toolTip: "Toggles invincibility on aimed WL player (hold grip + trigger)."
            }),
            new ButtonInfo({
                buttonText: "WL Money Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.5;
                        try {
                            var target = getWhitelistGunTarget(gunData, true, 10.0);
                            if (!target || !target.player) { sendNotification("No player there", false); return; }
                            if (target.blocked) { sendNotification("Not whitelisted: " + target.id, false); return; }
                            target.player.method("RPC_AddPlayerMoney").invoke(9999);
                            sendNotification("Gave money to " + target.id + "!", false);
                        } catch(e) { console.error("WL Money Gun:", e); }
                    }
                },
                toolTip: "Gives 9999 money to aimed WL player (hold grip + trigger)."
            }),
            new ButtonInfo({
                buttonText: "WL Heal Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.5;
                        try {
                            var target = getWhitelistGunTarget(gunData, true, 10.0);
                            if (!target || !target.player) { sendNotification("No player there", false); return; }
                            if (target.blocked) { sendNotification("Not whitelisted: " + target.id, false); return; }
                            try { target.player.method("set_healthLost").invoke(0); } catch(_) {}
                            try { target.player.method("set_isDie").invoke(false); } catch(_) {}
                            sendNotification("Healed " + target.id + "!", false);
                        } catch(e) { console.error("WL Heal Gun:", e); }
                    }
                },
                toolTip: "Fully heals aimed WL player (hold grip + trigger)."
            }),
            new ButtonInfo({
                buttonText: "WL Wanted Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.5;
                        try {
                            var target = getWhitelistGunTarget(gunData, true, 10.0);
                            if (!target || !target.player) { sendNotification("No player there", false); return; }
                            if (target.blocked) { sendNotification("Not whitelisted: " + target.id, false); return; }
                            var cur = target.player.method("get_isWanted").invoke();
                            target.player.method("set_isWanted").invoke(!cur);
                            sendNotification((cur ? "Cleared wanted " : "Set wanted ") + target.id + "!", false);
                        } catch(e) { console.error("WL Wanted Gun:", e); }
                    }
                },
                toolTip: "Toggles wanted status on aimed WL player (hold grip + trigger)."
            }),
            new ButtonInfo({
                buttonText: "WL Give All Buff",
                method: () => {
                    try {
                        var buffIDs = [1, 2, 3, 5, 7]; 
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            if (whitelistEnabled && !whitelistHasPlayer(p)) continue;
                            for (var buffID of buffIDs) {
                                try { p.method("RPC_ApplyBuff").invoke(buffID); } catch(_) {}
                            }
                            count++;
                        }
                        sendNotification("Gave all buffs to " + count + " WL players!", false);
                    } catch(e) { sendNotification("WL Give All Buff: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Gives all buffs (Speed, Pink, Damage, Scale, AntiGrav) to all WL players."
            }),
            new ButtonInfo({
                buttonText: "WL Add Money All",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            if (whitelistEnabled && !whitelistHasPlayer(p)) continue;
                            try { p.method("RPC_AddPlayerMoney").invoke(9999); count++; } catch(_) {}
                        }
                        sendNotification("Gave money to " + count + " WL players!", false);
                    } catch(e) { sendNotification("WL Money All: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Gives 9999 money to all WL players."
            }),
            new ButtonInfo({
                buttonText: "WL Set All Teams",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        var teamToggle = 1;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            if (whitelistEnabled && !whitelistHasPlayer(p)) continue;
                            try { p.method("RPC_SetTeam").invoke(teamToggle); count++; } catch(_) {}
                        }
                        sendNotification("Set team for " + count + " WL players!", false);
                    } catch(e) { sendNotification("WL Set Teams: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets all WL players to red team."
            }),
            new ButtonInfo({
                buttonText: "WL Clear Invincible",
                method: () => {
                    try {
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            if (whitelistEnabled && !whitelistHasPlayer(p)) continue;
                            try { p.method("set_isInvincible").invoke(false); count++; } catch(_) {}
                        }
                        sendNotification("Removed invincible from " + count + " WL players!", false);
                    } catch(e) { sendNotification("WL Clear Invincible: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Removes invincibility from all WL players."
            }),
            new ButtonInfo({
                buttonText: "WL Spawn Bag Bomb All",
                method: () => {
                    try {
                        function randSBA(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
                        var bagIDs = ["item_backpack_large_clover","item_backpack_large_basketball","item_backpack_large_base"];
                        var playerDict = NetPlayer.field("playerIDToNetPlayer").value;
                        var vals = playerDict.method("get_Values").invoke();
                        var en = vals.method("GetEnumerator").invoke();
                        var count = 0;
                        while (en.method("MoveNext").invoke()) {
                            var p = en.method("get_Current").invoke();
                            if (!p || p.handle.isNull() || playerIsLocal(p)) continue;
                            if (whitelistEnabled && !whitelistHasPlayer(p)) continue;
                            var pos = getTransform(p).method("get_position").invoke();
                            try {
                                var bagResult = PrefabGen.method("SpawnItem", 4).invoke(
                                    Il2Cpp.string("item_prefab/" + bagIDs[randSBA(0, bagIDs.length - 1)]),
                                    pos, identityQuaternion, NULL
                                );
                                if (bagResult && !bagResult.isNull()) {
                                    var bagBackpack = bagResult.method("GetComponent", 1).inflate(BackpackItemClass).invoke();
                                    for (var i = 0; i < 10; i++) {
                                        try {
                                            var child = PrefabGen.method("SpawnItem", 4).invoke(
                                                Il2Cpp.string("item_prefab/" + itemIDs[randSBA(0, itemIDs.length - 1)]),
                                                pos, identityQuaternion, NULL
                                            );
                                            if (!child || child.isNull()) continue;
                                            if (bagBackpack && !bagBackpack.isNull()) {
                                                var childGBI = child.method("GetComponent", 1).inflate(GBIClass).invoke();
                                                if (childGBI && !childGBI.isNull()) {
                                                    try { childGBI.method("AddToBag").invoke(bagBackpack); } catch(_) {}
                                                }
                                            }
                                        } catch(_) {}
                                    }
                                    try { if (bagBackpack && !bagBackpack.isNull()) bagBackpack.method("Explode").invoke(); } catch(_) {}
                                }
                                count++;
                            } catch(_) {}
                        }
                        sendNotification("Bag bombed " + count + " WL players!", false);
                    } catch(e) { sendNotification("WL Bag Bomb All: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Spawns an exploding bag near each WL player."
            }),
        ],
        [ 
            new ButtonInfo({
                buttonText: "Exit UX",
                method: () => { currentCategory = 0; currentPage = 0; },
                isTogglable: false,
                toolTip: "Returns to main menu."
            }),
            new ButtonInfo({
                buttonText: "UX: â–ş Page 1",
                method: () => { currentCategory = 17; currentPage = 0; reloadMenu(); sendNotification("UX Page 1", false, 2); },
                isTogglable: false,
                toolTip: "Jump to Unity Explorer page 1 (Selection, Transform basics)."
            }),
            new ButtonInfo({
                buttonText: "UX: â–ş Page 2",
                method: () => { currentCategory = 17; currentPage = 1; reloadMenu(); sendNotification("UX Page 2", false, 2); },
                isTogglable: false,
                toolTip: "Jump to Unity Explorer page 2 (Info & Logging)."
            }),
            new ButtonInfo({
                buttonText: "UX: â–ş Page 3",
                method: () => { currentCategory = 17; currentPage = 2; reloadMenu(); sendNotification("UX Page 3", false, 2); },
                isTogglable: false,
                toolTip: "Jump to Unity Explorer page 3 (Mass & Physics)."
            }),
            new ButtonInfo({
                buttonText: "UX: â–ş Page 4",
                method: () => { currentCategory = 17; currentPage = 3; reloadMenu(); sendNotification("UX Page 4", false, 2); },
                isTogglable: false,
                toolTip: "Jump to Unity Explorer page 4 (Rendering & Color)."
            }),
            new ButtonInfo({
                buttonText: "UX: â–ş Page 5",
                method: () => { currentCategory = 17; currentPage = 4; reloadMenu(); sendNotification("UX Page 5", false, 2); },
                isTogglable: false,
                toolTip: "Jump to Unity Explorer page 5 (Parenting & Colliders)."
            }),
            new ButtonInfo({
                buttonText: "UX: â–ş Page 6",
                method: () => { currentCategory = 17; currentPage = 5; reloadMenu(); sendNotification("UX Page 6", false, 2); },
                isTogglable: false,
                toolTip: "Jump to Unity Explorer page 6 (Grabbable / Interaction)."
            }),
            new ButtonInfo({
                buttonText: "UX: â–ş Page 7",
                method: () => { currentCategory = 17; currentPage = 6; reloadMenu(); sendNotification("UX Page 7", false, 2); },
                isTogglable: false,
                toolTip: "Jump to Unity Explorer page 7 (Item Flags & Data)."
            }),
            new ButtonInfo({
                buttonText: "UX: â–ş Page 8",
                method: () => { currentCategory = 17; currentPage = 7; reloadMenu(); sendNotification("UX Page 8", false, 2); },
                isTogglable: false,
                toolTip: "Jump to Unity Explorer page 8 (Edible / Spawn / Scale)."
            }),
            new ButtonInfo({
                buttonText: "UX: â–ş Page 9",
                method: () => { currentCategory = 17; currentPage = 8; reloadMenu(); sendNotification("UX Page 9", false, 2); },
                isTogglable: false,
                toolTip: "Jump to Unity Explorer page 9 (Player Effects Gun)."
            }),
            new ButtonInfo({
                buttonText: "UX: â–ş Page 10",
                method: () => { currentCategory = 17; currentPage = 9; reloadMenu(); sendNotification("UX Page 10", false, 2); },
                isTogglable: false,
                toolTip: "Jump to Unity Explorer page 10 (Instantiate & Mob Spawn)."
            }),
            new ButtonInfo({
                buttonText: "UX: â–ş Last Page",
                method: () => {
                    var lastPage = Math.ceil(buttons[17].length / 8) - 1;
                    currentCategory = 17; currentPage = lastPage; reloadMenu();
                    sendNotification("UX Last Page (" + (lastPage + 1) + ")", false, 2);
                },
                isTogglable: false,
                toolTip: "Jump directly to the last page of the Unity Explorer."
            }),
            new ButtonInfo({
                buttonText: "Select Obj Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    var ray = gunData.ray;
                    if (!ray || ray.handle.isNull()) return;
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.4;
                        try {
                            var hitCol = ray.method("get_collider").invoke();
                            if (!hitCol || hitCol.isNull()) { sendNotification("Nothing hit", false); return; }
                            var go = hitCol.method("get_gameObject").invoke();
                            if (!go || go.isNull()) return;
                            uxSelectedObject = go;
                            uxSelectedName = go.method("get_name").invoke()?.content ?? "unnamed";
                            sendNotification("UX Selected: " + uxSelectedName, false, 4);
                        } catch(e) { console.error("[UX] Select:", e); }
                    }
                },
                toolTip: "Hold grip + pull trigger to select any object. Selected object is used by all other UX tools."
            }),
            new ButtonInfo({
                buttonText: "Inspect Object",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var tf = uxGetTransform(uxSelectedObject);
                        var pos  = tf ? uxVec3Str(tf.method("get_position").invoke()) : "?";
                        var rot  = tf ? uxVec3Str(tf.method("get_eulerAngles").invoke()) : "?";
                        var scl  = tf ? uxVec3Str(tf.method("get_localScale").invoke()) : "?";
                        var active = uxSelectedObject.method("get_activeSelf").invoke();
                        var layer  = uxSelectedObject.method("get_layer").invoke();
                        var tag    = uxSelectedObject.method("get_tag").invoke()?.content ?? "?";
                        var comps  = uxGetComponentNames(uxSelectedObject);
                        console.log("[UX] â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");
                        console.log("[UX] Name   : " + uxSelectedName);
                        console.log("[UX] Active : " + active);
                        console.log("[UX] Layer  : " + layer + "  Tag: " + tag);
                        console.log("[UX] Pos    : " + pos);
                        console.log("[UX] Rot    : " + rot);
                        console.log("[UX] Scale  : " + scl);
                        console.log("[UX] Components (" + comps.length + "): " + comps.join(", "));
                        console.log("[UX] â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");
                        sendNotification(uxSelectedName + " | " + pos + " | " + comps.length + " comps â€” see log", false, 6);
                    } catch(e) { sendNotification("Inspect: " + e, false); console.error("[UX] Inspect:", e); }
                },
                isTogglable: false,
                toolTip: "Logs full info (position, rotation, scale, components) of selected object to Frida console."
            }),
            new ButtonInfo({
                buttonText: "Teleport to Obj",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        var tf = uxGetTransform(uxSelectedObject);
                        if (!tf) return;
                        var pos = tf.method("get_position").invoke();
                        player.method("RPC_Teleport").invoke(pos);
                        sendNotification("Teleported to " + uxSelectedName, false);
                    } catch(e) { sendNotification("TP to obj: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Teleports you to the selected object's position."
            }),
            new ButtonInfo({
                buttonText: "Obj to Me",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        var myPos = getTransform(player).method("get_position").invoke();
                        uxGetTransform(uxSelectedObject).method("set_position").invoke(myPos);
                        sendNotification("Moved " + uxSelectedName + " to you", false);
                    } catch(e) { sendNotification("Obj to me: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Moves the selected object to your position."
            }),
            new ButtonInfo({
                buttonText: "Freeze Obj",
                isTogglable: true,
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var UnityEngine = Il2Cpp.domain.assembly("UnityEngine.PhysicsModule").image;
                        var RBClass = UnityEngine.class("UnityEngine.Rigidbody");
                        var rb = uxSelectedObject.method("GetComponent", 1).inflate(RBClass).invoke();
                        if (!rb || rb.isNull()) { sendNotification("No Rigidbody on " + uxSelectedName, false); return; }
                        var cur = rb.method("get_isKinematic").invoke();
                        rb.method("set_isKinematic").invoke(!cur);
                        sendNotification("Freeze " + uxSelectedName + ": " + !cur, false);
                    } catch(e) { sendNotification("Freeze: " + e, false); }
                },
                toolTip: "Toggles isKinematic on the selected object's Rigidbody (freezes/unfreezes physics)."
            }),
            new ButtonInfo({
                buttonText: "Toggle Active",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var cur = uxSelectedObject.method("get_activeSelf").invoke();
                        uxSelectedObject.method("SetActive").invoke(!cur);
                        sendNotification(uxSelectedName + " active: " + !cur, false);
                    } catch(e) { sendNotification("Toggle Active: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Toggles SetActive on the selected object (hides/shows it)."
            }),
            new ButtonInfo({
                buttonText: "Despawn Obj",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var despawned = false;
                        try {
                            var gbo = uxSelectedObject.method("GetComponentInParent", 0).inflate(GBOClass).invoke();
                            if (gbo && !gbo.isNull()) {
                                var netObj = gbo.method("get_Object").invoke();
                                if (netObj && !netObj.isNull()) {
                                    var runner = null;
                                    try { runner = SFXManager.field("_instance").value.method("get__currentRunner").invoke(); } catch(_) {}
                                    if (runner && !runner.isNull()) { runner.method("Despawn").invoke(netObj); despawned = true; }
                                }
                            }
                        } catch(_) {}
                        if (!despawned) {
                            try {
                                var NOClass = Il2Cpp.domain.assembly("Fusion.Runtime").image.class("Fusion.NetworkObject");
                                var no = uxSelectedObject.method("GetComponentInParent", 0).inflate(NOClass).invoke();
                                if (no && !no.isNull()) {
                                    var runner = null;
                                    try { runner = SFXManager.field("_instance").value.method("get__currentRunner").invoke(); } catch(_) {}
                                    if (runner && !runner.isNull()) { runner.method("Despawn").invoke(no); despawned = true; }
                                }
                            } catch(_) {}
                        }
                        if (despawned) {
                            sendNotification("Despawned " + uxSelectedName, false);
                            uxSelectedObject = null; uxSelectedName = "none";
                        } else {
                            Destroy(uxSelectedObject);
                            sendNotification("Destroyed (local) " + uxSelectedName, false);
                            uxSelectedObject = null; uxSelectedName = "none";
                        }
                    } catch(e) { sendNotification("Despawn: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Despawns (network removes) the selected object, or destroys it locally if no network object."
            }),
            new ButtonInfo({
                buttonText: "Scale Obj +25%",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var tf = uxGetTransform(uxSelectedObject);
                        var s = tf.method("get_localScale").invoke();
                        var nx = (s.field("x").value ) * 1.25;
                        var ny = (s.field("y").value ) * 1.25;
                        var nz = (s.field("z").value ) * 1.25;
                        var newScale = Vector3.method("op_Multiply").invoke(s, 1.25);
                        tf.method("set_localScale").invoke(newScale);
                        sendNotification(uxSelectedName + " scaled up", false);
                    } catch(e) { sendNotification("Scale+: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Scales the selected object up by 25%."
            }),
            new ButtonInfo({
                buttonText: "Scale Obj -25%",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var tf = uxGetTransform(uxSelectedObject);
                        var s = tf.method("get_localScale").invoke();
                        var newScale = Vector3.method("op_Multiply").invoke(s, 0.75);
                        tf.method("set_localScale").invoke(newScale);
                        sendNotification(uxSelectedName + " scaled down", false);
                    } catch(e) { sendNotification("Scale-: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Scales the selected object down by 25%."
            }),
            new ButtonInfo({
                buttonText: "Reset Obj Scale",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var tf = uxGetTransform(uxSelectedObject);
                        var one = Vector3.method("get_one").invoke();
                        tf.method("set_localScale").invoke(one);
                        sendNotification(uxSelectedName + " scale reset", false);
                    } catch(e) { sendNotification("Scale reset: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Resets selected object scale to (1,1,1)."
            }),
            new ButtonInfo({
                buttonText: "Rotate Obj 90Y",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var tf = uxGetTransform(uxSelectedObject);
                        var cur = tf.method("get_eulerAngles").invoke();
                        var newY = ((cur.field("y").value ) + 90) % 360;
                        var curX = cur.field("x").value ;
                        var curZ = cur.field("z").value ;
                        tf.method("set_eulerAngles").invoke([curX, newY, curZ]);
                        sendNotification(uxSelectedName + " rotated 90Â° Y", false);
                    } catch(e) { sendNotification("Rotate: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Rotates selected object 90 degrees on Y axis."
            }),
            new ButtonInfo({
                buttonText: "Lock Obj Pos",
                isTogglable: true,
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var UnityEngine = Il2Cpp.domain.assembly("UnityEngine.PhysicsModule").image;
                        var RBClass = UnityEngine.class("UnityEngine.Rigidbody");
                        var rb = uxSelectedObject.method("GetComponent", 1).inflate(RBClass).invoke();
                        if (rb && !rb.isNull()) {
                            rb.method("set_isKinematic").invoke(true);
                            rb.method("set_useGravity").invoke(false);
                        }
                        var tf = uxGetTransform(uxSelectedObject);
                        tf.method("SetParent", 2).invoke(NULL, true);
                        sendNotification(uxSelectedName + " position locked", false);
                    } catch(e) { sendNotification("Lock pos: " + e, false); }
                },
                toolTip: "Locks selected object's position (kinematic, no gravity, detaches from parent)."
            }),
            new ButtonInfo({
                buttonText: "Print Fields",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var CompClass = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.Component");
                        var comps = uxSelectedObject.method("GetComponentsInChildren", 1).inflate(CompClass).invoke(false);
                        var len = comps ? comps.length : 0;
                        console.log("[UX-Fields] Object: " + uxSelectedName + " â”€â”€ " + len + " components");
                        for (var i = 0; i < Math.min(len, 20); i++) {
                            try {
                                var c = comps.method("get_Item").invoke(i);
                                var typeName = c.method("GetType").invoke().method("get_Name").invoke()?.content ?? "?";
                                console.log("[UX-Fields]  â”Ś " + typeName);
                                try {
                                    var il2Type = c.class;
                                    if (il2Type) {
                                        for (var field of il2Type.fields) {
                                            try {
                                                var val = field.withHolder(c).value;
                                                console.log("[UX-Fields]  â”‚  " + field.name + " = " + val);
                                            } catch(_) {
                                                console.log("[UX-Fields]  â”‚  " + field.name + " = ");
                                            }
                                        }
                                    }
                                } catch(_) {}
                                console.log("[UX-Fields]  â””â”€â”€â”€â”€â”€");
                            } catch(_) {}
                        }
                        sendNotification("Fields dumped to log (" + Math.min(len, 20) + " comps)", false, 4);
                    } catch(e) { sendNotification("Print Fields: " + e, false); console.error("[UX] Fields:", e); }
                },
                isTogglable: false,
                toolTip: "Dumps all Il2Cpp fields of every component on selected object to Frida log."
            }),
            new ButtonInfo({
                buttonText: "Print Methods",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var CompClass = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.Component");
                        var comps = uxSelectedObject.method("GetComponentsInChildren", 1).inflate(CompClass).invoke(false);
                        var len = comps ? comps.length : 0;
                        console.log("[UX-Methods] Object: " + uxSelectedName);
                        for (var i = 0; i < Math.min(len, 10); i++) {
                            try {
                                var c = comps.method("get_Item").invoke(i);
                                var typeName = c.method("GetType").invoke().method("get_Name").invoke()?.content ?? "?";
                                console.log("[UX-Methods]  â”Ś " + typeName);
                                try {
                                    var il2Type = c.class;
                                    if (il2Type) {
                                        for (var method of il2Type.methods) {
                                            console.log("[UX-Methods]  â”‚  " + method.name);
                                        }
                                    }
                                } catch(_) {}
                                console.log("[UX-Methods]  â””â”€â”€â”€â”€â”€");
                            } catch(_) {}
                        }
                        sendNotification("Methods dumped to log", false, 4);
                    } catch(e) { sendNotification("Print Methods: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Dumps all method names on every component to Frida log."
            }),
            new ButtonInfo({
                buttonText: "Print Children",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var tf = uxGetTransform(uxSelectedObject);
                        if (!tf) return;
                        function printChildren(t, depth) {
                            var count = t.method("get_childCount").invoke() ;
                            for (var i = 0; i < Math.min(count, 64); i++) {
                                try {
                                    var child = t.method("GetChild").invoke(i);
                                    var name = child.method("get_gameObject").invoke().method("get_name").invoke()?.content ?? "?";
                                    console.log("[UX-Children]" + "  ".repeat(depth) + "â”ś " + name);
                                    if (depth < 4) printChildren(child, depth + 1);
                                } catch(_) {}
                            }
                        }
                        console.log("[UX-Children] Root: " + uxSelectedName);
                        printChildren(tf, 1);
                        sendNotification("Children dumped to log", false, 4);
                    } catch(e) { sendNotification("Print Children: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Dumps the full child hierarchy of the selected object to Frida log (4 levels deep)."
            }),
            new ButtonInfo({
                buttonText: "UX Parent",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var tf = uxGetTransform(uxSelectedObject);
                        if (!tf) return;
                        var parentTF = tf.method("get_parent").invoke();
                        if (!parentTF || parentTF.isNull()) { sendNotification("No parent", false); return; }
                        uxSelectedObject = parentTF.method("get_gameObject").invoke();
                        uxSelectedName = uxSelectedObject.method("get_name").invoke()?.content ?? "parent";
                        sendNotification("UX â†’ Parent: " + uxSelectedName, false, 3);
                    } catch(e) { sendNotification("Select Parent: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Re-selects the parent GameObject of the current selection."
            }),
            new ButtonInfo({
                buttonText: "UX Child[0]",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var tf = uxGetTransform(uxSelectedObject);
                        if (!tf) return;
                        var count = tf.method("get_childCount").invoke() ;
                        if (count === 0) { sendNotification("No children", false); return; }
                        var child = tf.method("GetChild").invoke(0);
                        uxSelectedObject = child.method("get_gameObject").invoke();
                        uxSelectedName = uxSelectedObject.method("get_name").invoke()?.content ?? "child";
                        sendNotification("UX â†’ Child[0]: " + uxSelectedName, false, 3);
                    } catch(e) { sendNotification("Select Child: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Navigates into the first child of the current selection."
            }),
            new ButtonInfo({
                buttonText: "UX Selected",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("UX: nothing selected", false, 4); return; }
                    try {
                        var tf = uxGetTransform(uxSelectedObject);
                        var pos = tf ? uxVec3Str(tf.method("get_position").invoke()) : "?";
                        var comps = uxGetComponentNames(uxSelectedObject);
                        sendNotification("SEL: " + uxSelectedName + "\n" + pos + "\n" + comps.slice(0,4).join(", "), false, 6);
                    } catch(e) { sendNotification("Show: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Re-displays the current selection name and position  notification."
            }),
            new ButtonInfo({
                buttonText: "UX Full Path",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var segments[] = [];
                        var tf = uxGetTransform(uxSelectedObject);
                        var guard = 0;
                        while (tf && !tf.isNull() && guard < 64) {
                            guard++;
                            try {
                                var go = tf.method("get_gameObject").invoke();
                                var n = (go && !go.isNull()) ? (go.method("get_name").invoke()?.content ?? "?") : "?";
                                segments.unshift(n);
                            } catch(_) { segments.unshift("?"); }
                            try {
                                var p = tf.method("get_parent").invoke();
                                tf = (p && !p.isNull()) ? p ;
                            } catch(_) { tf = null; }
                        }
                        var path = "/" + segments.join("/");
                        console.log("[UX] Full path (" + segments.length + " levels): " + path);
                        sendNotification(path, false, 9);
                    } catch(e) { sendNotification("Path: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Walks the full transform hierarchy to root and displays the complete scene path."
            }),
            new ButtonInfo({
                buttonText: "UX +X (1m)",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var tf = uxGetTransform(uxSelectedObject);
                        var p = tf.method("get_position").invoke();
                        p.field("x").value = (p.field("x").value ) + 1.0;
                        tf.method("set_position").invoke(p);
                        sendNotification(uxSelectedName + " +X", false, 2);
                    } catch(e) { sendNotification("Move +X: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Nudges selected object +1 unit on the X axis."
            }),
            new ButtonInfo({
                buttonText: "UX -X (1m)",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var tf = uxGetTransform(uxSelectedObject);
                        var p = tf.method("get_position").invoke();
                        p.field("x").value = (p.field("x").value ) - 1.0;
                        tf.method("set_position").invoke(p);
                        sendNotification(uxSelectedName + " -X", false, 2);
                    } catch(e) { sendNotification("Move -X: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Nudges selected object -1 unit on the X axis."
            }),
            new ButtonInfo({
                buttonText: "UX +Y (1m)",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var tf = uxGetTransform(uxSelectedObject);
                        var p = tf.method("get_position").invoke();
                        p.field("y").value = (p.field("y").value ) + 1.0;
                        tf.method("set_position").invoke(p);
                        sendNotification(uxSelectedName + " +Y", false, 2);
                    } catch(e) { sendNotification("Move +Y: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Nudges selected object +1 unit up (Y axis)."
            }),
            new ButtonInfo({
                buttonText: "UX -Y (1m)",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var tf = uxGetTransform(uxSelectedObject);
                        var p = tf.method("get_position").invoke();
                        p.field("y").value = (p.field("y").value ) - 1.0;
                        tf.method("set_position").invoke(p);
                        sendNotification(uxSelectedName + " -Y", false, 2);
                    } catch(e) { sendNotification("Move -Y: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Nudges selected object -1 unit down (Y axis)."
            }),
            new ButtonInfo({
                buttonText: "UX +Z (1m)",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var tf = uxGetTransform(uxSelectedObject);
                        var p = tf.method("get_position").invoke();
                        p.field("z").value = (p.field("z").value ) + 1.0;
                        tf.method("set_position").invoke(p);
                        sendNotification(uxSelectedName + " +Z", false, 2);
                    } catch(e) { sendNotification("Move +Z: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Nudges selected object +1 unit on the Z axis."
            }),
            new ButtonInfo({
                buttonText: "UX -Z (1m)",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var tf = uxGetTransform(uxSelectedObject);
                        var p = tf.method("get_position").invoke();
                        p.field("z").value = (p.field("z").value ) - 1.0;
                        tf.method("set_position").invoke(p);
                        sendNotification(uxSelectedName + " -Z", false, 2);
                    } catch(e) { sendNotification("Move -Z: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Nudges selected object -1 unit on the Z axis."
            }),
            new ButtonInfo({
                buttonText: "UX to Ground",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var tf = uxGetTransform(uxSelectedObject);
                        var pos = tf.method("get_position").invoke();
                        var downDir = Vector3.method("get_down").invoke();
                        var hits = Physics.method("RaycastAll", 3).invoke(pos, downDir, 100.0);
                        if (!hits || hits.isNull()) { sendNotification("No ground found", false); return; }
                        var len = hits.length;
                        var bestY = pos.field("y").value ;
                        var found = false;
                        for (var i = 0; i < len; i++) {
                            try {
                                var hit = hits.method("get_Item").invoke(i);
                                var hitGO = hit.field("collider").value.method("get_gameObject").invoke();
                                if (hitGO.method("GetInstanceID").invoke() === uxSelectedObject.method("GetInstanceID").invoke()) continue;
                                var hitY = hit.field("point").value.field("y").value ;
                                if (!found || hitY > bestY) { bestY = hitY; found = true; }
                            } catch(_) {}
                        }
                        if (found) {
                            pos.field("y").value = bestY;
                            tf.method("set_position").invoke(pos);
                            sendNotification(uxSelectedName + " snapped to ground", false);
                        } else {
                            sendNotification("No ground below", false);
                        }
                    } catch(e) { sendNotification("Snap: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Raycasts downward and places selected object on the nearest surface below it."
            }),
            new ButtonInfo({
                buttonText: "UX Pos",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var tf = uxGetTransform(uxSelectedObject);
                        (globalThis )._uxSavedPos = tf.method("get_position").invoke();
                        (globalThis )._uxSavedRot = tf.method("get_rotation").invoke();
                        var pos = uxVec3Str((globalThis )._uxSavedPos);
                        console.log("[UX] Saved pos: " + pos + " for " + uxSelectedName);
                        sendNotification("Pos saved: " + pos, false, 4);
                    } catch(e) { sendNotification("Save Pos: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Saves the selected object's current position and rotation into a slot."
            }),
            new ButtonInfo({
                buttonText: "UX Pos",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    if (!(globalThis )._uxSavedPos) { sendNotification("No pos saved", false); return; }
                    try {
                        var tf = uxGetTransform(uxSelectedObject);
                        tf.method("set_position").invoke((globalThis )._uxSavedPos);
                        tf.method("set_rotation").invoke((globalThis )._uxSavedRot);
                        sendNotification("Pos restored on " + uxSelectedName, false);
                    } catch(e) { sendNotification("Restore Pos: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Moves the selected object back to the last saved position/rotation."
            }),
            new ButtonInfo({
                buttonText: "UX to Player",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        var myPos = getTransform(player).method("get_position").invoke();
                        var tf = uxGetTransform(uxSelectedObject);
                        var myFwd = getTransform(player).method("get_forward").invoke();
                        var nx = (myPos.field("x").value ) + (myFwd.field("x").value ) * 2.0;
                        var ny = myPos.field("y").value;
                        var nz = (myPos.field("z").value ) + (myFwd.field("z").value ) * 2.0;
                        myPos.field("x").value = nx;
                        myPos.field("y").value = ny;
                        myPos.field("z").value = nz;
                        tf.method("set_position").invoke(myPos);
                        sendNotification(uxSelectedName + " aligned to player", false);
                    } catch(e) { sendNotification("Align: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Moves selected object 2m in front of you at your height."
            }),
            new ButtonInfo({
                buttonText: "UX X",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var tf = uxGetTransform(uxSelectedObject);
                        var p = tf.method("get_position").invoke();
                        p.field("x").value = -(p.field("x").value );
                        tf.method("set_position").invoke(p);
                        sendNotification(uxSelectedName + " mirrored X", false);
                    } catch(e) { sendNotification("Mirror X: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Mirrors the selected object's X position across X=0."
            }),
            new ButtonInfo({
                buttonText: "UX Z",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var tf = uxGetTransform(uxSelectedObject);
                        var p = tf.method("get_position").invoke();
                        p.field("z").value = -(p.field("z").value );
                        tf.method("set_position").invoke(p);
                        sendNotification(uxSelectedName + " mirrored Z", false);
                    } catch(e) { sendNotification("Mirror Z: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Mirrors the selected object's Z position across Z=0."
            }),
            new ButtonInfo({
                buttonText: "UX +X 90",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var tf = uxGetTransform(uxSelectedObject);
                        var e = tf.method("get_eulerAngles").invoke();
                        e.field("x").value = ((e.field("x").value ) + 90) % 360;
                        tf.method("set_eulerAngles").invoke(e);
                        sendNotification(uxSelectedName + " +X 90Â°", false, 2);
                    } catch(e2) { sendNotification("Rot +X: " + e2, false); }
                },
                isTogglable: false,
                toolTip: "Rotates selected object 90Â° on X axis."
            }),
            new ButtonInfo({
                buttonText: "UX +Z 90",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var tf = uxGetTransform(uxSelectedObject);
                        var e = tf.method("get_eulerAngles").invoke();
                        e.field("z").value = ((e.field("z").value ) + 90) % 360;
                        tf.method("set_eulerAngles").invoke(e);
                        sendNotification(uxSelectedName + " +Z 90Â°", false, 2);
                    } catch(e2) { sendNotification("Rot +Z: " + e2, false); }
                },
                isTogglable: false,
                toolTip: "Rotates selected object 90Â° on Z axis."
            }),
            new ButtonInfo({
                buttonText: "UX Rotation",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var tf = uxGetTransform(uxSelectedObject);
                        var identity = Quaternion.method("get_identity").invoke();
                        tf.method("set_rotation").invoke(identity);
                        sendNotification(uxSelectedName + " rotation reset", false);
                    } catch(e) { sendNotification("Reset Rot: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Resets selected object rotation to identity (0,0,0)."
            }),
            new ButtonInfo({
                buttonText: "UX Player",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        var tf = uxGetTransform(uxSelectedObject);
                        var objPos = tf.method("get_position").invoke();
                        var playerPos = getTransform(player).method("get_position").invoke();
                        tf.method("LookAt", 1).invoke(playerPos);
                        sendNotification(uxSelectedName + " now faces you", false);
                    } catch(e) { sendNotification("Face Player: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Rotates selected object to face your position."
            }),
            new ButtonInfo({
                buttonText: "UX Up",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var UnityEngine = Il2Cpp.domain.assembly("UnityEngine.PhysicsModule").image;
                        var RBClass = UnityEngine.class("UnityEngine.Rigidbody");
                        var rb = uxSelectedObject.method("GetComponent", 1).inflate(RBClass).invoke();
                        if (!rb || rb.isNull()) { sendNotification("No Rigidbody on " + uxSelectedName, false); return; }
                        rb.method("set_isKinematic").invoke(false);
                        rb.method("set_useGravity").invoke(true);
                        var upForce = Vector3.method("op_Multiply").invoke(Vector3.method("get_up").invoke(), 1200.0);
                        rb.method("AddForce", 1).invoke(upForce);
                        sendNotification(uxSelectedName + " launched!", false);
                    } catch(e) { sendNotification("Launch: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Adds a large upward force to the selected object's Rigidbody."
            }),
            new ButtonInfo({
                buttonText: "UX Velocity",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var UnityEngine = Il2Cpp.domain.assembly("UnityEngine.PhysicsModule").image;
                        var RBClass = UnityEngine.class("UnityEngine.Rigidbody");
                        var rb = uxSelectedObject.method("GetComponent", 1).inflate(RBClass).invoke();
                        if (!rb || rb.isNull()) { sendNotification("No Rigidbody", false); return; }
                        var zero = Vector3.method("get_zero").invoke();
                        rb.method("set_velocity").invoke(zero);
                        rb.method("set_angularVelocity").invoke(zero);
                        sendNotification(uxSelectedName + " velocity zeroed", false);
                    } catch(e) { sendNotification("Zero Vel: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets velocity and angularVelocity to zero on the selected object's Rigidbody."
            }),
            new ButtonInfo({
                buttonText: "UX Gravity",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var UnityEngine = Il2Cpp.domain.assembly("UnityEngine.PhysicsModule").image;
                        var RBClass = UnityEngine.class("UnityEngine.Rigidbody");
                        var rb = uxSelectedObject.method("GetComponent", 1).inflate(RBClass).invoke();
                        if (!rb || rb.isNull()) { sendNotification("No Rigidbody", false); return; }
                        rb.method("set_useGravity").invoke(true);
                        rb.method("set_isKinematic").invoke(false);
                        sendNotification(uxSelectedName + " gravity ON", false);
                    } catch(e) { sendNotification("Gravity ON: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Enables gravity and disables kinematic on selected object."
            }),
            new ButtonInfo({
                buttonText: "UX Gravity",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var UnityEngine = Il2Cpp.domain.assembly("UnityEngine.PhysicsModule").image;
                        var RBClass = UnityEngine.class("UnityEngine.Rigidbody");
                        var rb = uxSelectedObject.method("GetComponent", 1).inflate(RBClass).invoke();
                        if (!rb || rb.isNull()) { sendNotification("No Rigidbody", false); return; }
                        rb.method("set_useGravity").invoke(false);
                        sendNotification(uxSelectedName + " gravity OFF", false);
                    } catch(e) { sendNotification("Gravity OFF: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Disables gravity on selected object's Rigidbody."
            }),
            new ButtonInfo({
                buttonText: "UX Renderer",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var RendClass = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.Renderer");
                        var rends = uxSelectedObject.method("GetComponentsInChildren", 1).inflate(RendClass).invoke(false);
                        if (!rends || rends.isNull()) { sendNotification("No renderers", false); return; }
                        var len = rends.length;
                        var anyEnabled = false;
                        for (var i = 0; i < len; i++) {
                            try { if (rends.method("get_Item").invoke(i).method("get_enabled").invoke()) { anyEnabled = true; break; } } catch(_) {}
                        }
                        for (var i = 0; i < len; i++) {
                            try { rends.method("get_Item").invoke(i).method("set_enabled").invoke(!anyEnabled); } catch(_) {}
                        }
                        sendNotification(uxSelectedName + " renderers: " + !anyEnabled, false);
                    } catch(e) { sendNotification("Toggle Renderer: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Toggles all Renderer components on the selected object and its children."
            }),
            new ButtonInfo({
                buttonText: "UX Red",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var RendClass = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.Renderer");
                        var rends = uxSelectedObject.method("GetComponentsInChildren", 1).inflate(RendClass).invoke(false);
                        var len = rends ? rends.length : 0;
                        var red = [1,0,0,1];
                        for (var i = 0; i < len; i++) {
                            try { rends.method("get_Item").invoke(i).method("get_material").invoke().method("set_color").invoke(red); } catch(_) {}
                        }
                        sendNotification(uxSelectedName + " â†’ red", false);
                    } catch(e) { sendNotification("Color Red: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets all materials on the selected object to red."
            }),
            new ButtonInfo({
                buttonText: "UX Blue",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var RendClass = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.Renderer");
                        var rends = uxSelectedObject.method("GetComponentsInChildren", 1).inflate(RendClass).invoke(false);
                        var len = rends ? rends.length : 0;
                        var blue = [0,0,1,1];
                        for (var i = 0; i < len; i++) {
                            try { rends.method("get_Item").invoke(i).method("get_material").invoke().method("set_color").invoke(blue); } catch(_) {}
                        }
                        sendNotification(uxSelectedName + " â†’ blue", false);
                    } catch(e) { sendNotification("Color Blue: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets all materials on the selected object to blue."
            }),
            new ButtonInfo({
                buttonText: "UX Green",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var RendClass = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.Renderer");
                        var rends = uxSelectedObject.method("GetComponentsInChildren", 1).inflate(RendClass).invoke(false);
                        var len = rends ? rends.length : 0;
                        var green = [0,1,0,1];
                        for (var i = 0; i < len; i++) {
                            try { rends.method("get_Item").invoke(i).method("get_material").invoke().method("set_color").invoke(green); } catch(_) {}
                        }
                        sendNotification(uxSelectedName + " â†’ green", false);
                    } catch(e) { sendNotification("Color Green: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets all materials on the selected object to green."
            }),
            new ButtonInfo({
                buttonText: "UX White",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var RendClass = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.Renderer");
                        var rends = uxSelectedObject.method("GetComponentsInChildren", 1).inflate(RendClass).invoke(false);
                        var len = rends ? rends.length : 0;
                        var white = [1,1,1,1];
                        for (var i = 0; i < len; i++) {
                            try { rends.method("get_Item").invoke(i).method("get_material").invoke().method("set_color").invoke(white); } catch(_) {}
                        }
                        sendNotification(uxSelectedName + " â†’ white", false);
                    } catch(e) { sendNotification("Color White: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Resets all material colors on the selected object to white."
            }),
            new ButtonInfo({
                buttonText: "UX to Hand",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        var handTF = player.field("handRight").value;
                        if (!handTF || handTF.isNull()) { sendNotification("No right hand transform", false); return; }
                        var tf = uxGetTransform(uxSelectedObject);
                        tf.method("SetParent", 2).invoke(handTF, true);
                        try {
                            var UnityEngine = Il2Cpp.domain.assembly("UnityEngine.PhysicsModule").image;
                            var RBClass = UnityEngine.class("UnityEngine.Rigidbody");
                            var rb = uxSelectedObject.method("GetComponent", 1).inflate(RBClass).invoke();
                            if (rb && !rb.isNull()) rb.method("set_isKinematic").invoke(true);
                        } catch(_) {}
                        sendNotification(uxSelectedName + " attached to hand", false);
                    } catch(e) { sendNotification("Attach: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Parents selected object to your right hand transform."
            }),
            new ButtonInfo({
                buttonText: "UX Parent",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var tf = uxGetTransform(uxSelectedObject);
                        tf.method("SetParent", 2).invoke(NULL, true);
                        sendNotification(uxSelectedName + " detached", false);
                    } catch(e) { sendNotification("Detach: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Detaches selected object from its parent (SetParent null), keeping world position."
            }),
            new ButtonInfo({
                buttonText: "UX to Obj Gun",
                isTogglable: true,
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("Select an object first", false); return; }
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    var ray = gunData.ray;
                    if (!ray || ray.handle.isNull()) return;
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.5;
                        try {
                            var hitCol = ray.method("get_collider").invoke();
                            if (!hitCol || hitCol.isNull()) return;
                            var targetGO = hitCol.method("get_gameObject").invoke();
                            var targetTF = uxGetTransform(targetGO);
                            var tf = uxGetTransform(uxSelectedObject);
                            tf.method("SetParent", 2).invoke(targetTF, true);
                            var targetName = targetGO.method("get_name").invoke()?.content ?? "?";
                            sendNotification(uxSelectedName + " parented to " + targetName, false);
                        } catch(e) { sendNotification("Parent to: " + e, false); }
                    }
                },
                toolTip: "Hold grip + aim at an object + trigger to parent the selected object to it."
            }),
            new ButtonInfo({
                buttonText: "UX Colliders",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var ColClass = Il2Cpp.domain.assembly("UnityEngine.PhysicsModule").image.class("UnityEngine.Collider");
                        var cols = uxSelectedObject.method("GetComponentsInChildren", 1).inflate(ColClass).invoke(false);
                        var len = cols ? cols.length : 0;
                        if (len === 0) { sendNotification("No colliders", false); return; }
                        var anyEnabled = false;
                        for (var i = 0; i < len; i++) {
                            try { if (cols.method("get_Item").invoke(i).method("get_enabled").invoke()) { anyEnabled = true; break; } } catch(_) {}
                        }
                        for (var i = 0; i < len; i++) {
                            try { cols.method("get_Item").invoke(i).method("set_enabled").invoke(!anyEnabled); } catch(_) {}
                        }
                        sendNotification(uxSelectedName + " colliders: " + !anyEnabled, false);
                    } catch(e) { sendNotification("Toggle Colliders: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Toggles all Collider components on the selected object and its children."
            }),
            new ButtonInfo({
                buttonText: "UX Trigger",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var ColClass = Il2Cpp.domain.assembly("UnityEngine.PhysicsModule").image.class("UnityEngine.Collider");
                        var cols = uxSelectedObject.method("GetComponentsInChildren", 1).inflate(ColClass).invoke(false);
                        var len = cols ? cols.length : 0;
                        for (var i = 0; i < len; i++) {
                            try { cols.method("get_Item").invoke(i).method("set_isTrigger").invoke(true); } catch(_) {}
                        }
                        sendNotification(uxSelectedName + " â†’ trigger", false);
                    } catch(e) { sendNotification("Make Trigger: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets isTrigger=true on all colliders (walk through the object)."
            }),
            new ButtonInfo({
                buttonText: "UX Solid",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var ColClass = Il2Cpp.domain.assembly("UnityEngine.PhysicsModule").image.class("UnityEngine.Collider");
                        var cols = uxSelectedObject.method("GetComponentsInChildren", 1).inflate(ColClass).invoke(false);
                        var len = cols ? cols.length : 0;
                        for (var i = 0; i < len; i++) {
                            try { cols.method("get_Item").invoke(i).method("set_isTrigger").invoke(false); } catch(_) {}
                        }
                        sendNotification(uxSelectedName + " â†’ solid", false);
                    } catch(e) { sendNotification("Make Solid: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets isTrigger=false on all colliders (restores collision)."
            }),
            new ButtonInfo({
                buttonText: "UX Layer+Tag",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var layer = uxSelectedObject.method("get_layer").invoke() ;
                        var tag   = uxSelectedObject.method("get_tag").invoke()?.content ?? "?";
                        var id    = uxSelectedObject.method("GetInstanceID").invoke();
                        console.log("[UX] " + uxSelectedName + " | layer=" + layer + " tag=" + tag + " instanceID=" + id);
                        sendNotification("Layer=" + layer + "  Tag=" + tag + "  ID=" + id, false, 6);
                    } catch(e) { sendNotification("Layer+Tag: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Logs the layer number, tag, and instanceID of the selected object."
            }),
            new ButtonInfo({
                buttonText: "UX All Objects",
                method: () => {
                    try {
                        var GOClass = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.GameObject");
                        var allGOs = Object.method("FindObjectsByType", 1).inflate(GOClass).invoke(0);
                        var len = allGOs ? allGOs.length : 0;
                        console.log("[UX] Total GameObjects in scene: " + len);
                        sendNotification("GameObjects in scene: " + len, false, 5);
                    } catch(e) { sendNotification("Count: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Counts and logs all active GameObjects currently in the scene."
            }),
            new ButtonInfo({
                buttonText: "UX All Near",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        var myPos = getTransform(player).method("get_position").invoke();
                        var GOClass = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.GameObject");
                        var allGOs = Object.method("FindObjectsByType", 1).inflate(GOClass).invoke(0);
                        var len = allGOs ? allGOs.length : 0;
                        var count = 0;
                        console.log("[UX] Objects within 10m:");
                        for (var i = 0; i < len; i++) {
                            try {
                                var go = allGOs.method("get_Item").invoke(i);
                                var tf = uxGetTransform(go);
                                if (!tf) continue;
                                var pos = tf.method("get_position").invoke();
                                var dist = Vector3.method("Distance").invoke(myPos, pos) ;
                                if (dist <= 10.0) {
                                    var name = go.method("get_name").invoke()?.content ?? "?";
                                    console.log("[UX]   [" + dist.toFixed(1) + "m] " + name);
                                    count++;
                                }
                            } catch(_) {}
                        }
                        sendNotification(count + " objects within 10m â€” see log", false, 4);
                    } catch(e) { sendNotification("Dump Near: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Logs the name and distance of every GameObject within 10m of you to the Frida console."
            }),
            new ButtonInfo({
                buttonText: "UX Deep Dump",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        console.log("[UX-DeepDump] â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");
                        console.log("[UX-DeepDump] Object: " + uxSelectedName);
                        var tf = uxGetTransform(uxSelectedObject);
                        if (tf) {
                            console.log("[UX-DeepDump] Pos   : " + uxVec3Str(tf.method("get_position").invoke()));
                            console.log("[UX-DeepDump] Rot   : " + uxVec3Str(tf.method("get_eulerAngles").invoke()));
                            console.log("[UX-DeepDump] Scale : " + uxVec3Str(tf.method("get_localScale").invoke()));
                        }
                        console.log("[UX-DeepDump] Layer : " + uxSelectedObject.method("get_layer").invoke());
                        console.log("[UX-DeepDump] Tag   : " + (uxSelectedObject.method("get_tag").invoke()?.content ?? "?"));
                        console.log("[UX-DeepDump] Active: " + uxSelectedObject.method("get_activeSelf").invoke());
                        var CompClass = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.Component");
                        var comps = uxSelectedObject.method("GetComponentsInChildren", 1).inflate(CompClass).invoke(false);
                        var cLen = comps ? comps.length : 0;
                        for (var i = 0; i < Math.min(cLen, 30); i++) {
                            try {
                                var c = comps.method("get_Item").invoke(i);
                                var typeName = c.method("GetType").invoke().method("get_Name").invoke()?.content ?? "?";
                                console.log("[UX-DeepDump]  â”Śâ”€ " + typeName);
                                try {
                                    for (var field of c.class.fields) {
                                        try { console.log("[UX-DeepDump]  â”‚  ." + field.name + " = " + field.withHolder(c).value); }
                                        catch(_) { console.log("[UX-DeepDump]  â”‚  ." + field.name + " = "); }
                                    }
                                } catch(_) {}
                                console.log("[UX-DeepDump]  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€");
                            } catch(_) {}
                        }
                        console.log("[UX-DeepDump] â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");
                        sendNotification("Full dump written to log", false, 4);
                    } catch(e) { sendNotification("DeepDump: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Full deep dump: position, rotation, scale, all component fields to Frida log."
            }),
            new ButtonInfo({
                buttonText: "UX Mass",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var RBClass = Il2Cpp.domain.assembly("UnityEngine.PhysicsModule").image.class("UnityEngine.Rigidbody");
                        var rb = uxSelectedObject.method("GetComponentInChildren", 1).inflate(RBClass).invoke(true);
                        if (!rb || rb.isNull()) { sendNotification("No Rigidbody on " + uxSelectedName, false); return; }
                        var mass = rb.method("get_mass").invoke() ;
                        var drag = rb.method("get_linearDamping").invoke() ;
                        var angDrag = rb.method("get_angularDamping").invoke() ;
                        var kinematic = rb.method("get_isKinematic").invoke();
                        var gravity = rb.method("get_useGravity").invoke();
                        console.log("[UX] " + uxSelectedName + " | mass=" + mass.toFixed(3) + " drag=" + drag.toFixed(3) + " angDrag=" + angDrag.toFixed(3) + " kinematic=" + kinematic + " gravity=" + gravity);
                        sendNotification("mass=" + mass.toFixed(2) + " drag=" + drag.toFixed(2) + " kin=" + kinematic, false, 6);
                    } catch(e) { sendNotification("Get Mass: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Reads and displays mass, drag, angularDrag, kinematic and gravity of the selected object."
            }),
            new ButtonInfo({
                buttonText: "UX = 0.1",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var RBClass = Il2Cpp.domain.assembly("UnityEngine.PhysicsModule").image.class("UnityEngine.Rigidbody");
                        var rb = uxSelectedObject.method("GetComponentInChildren", 1).inflate(RBClass).invoke(true);
                        if (!rb || rb.isNull()) { sendNotification("No Rigidbody", false); return; }
                        rb.method("set_mass").invoke(0.1);
                        sendNotification(uxSelectedName + " mass = 0.1 (feather)", false);
                    } catch(e) { sendNotification("Set Mass: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets Rigidbody mass to 0.1 (feather-light, flies on any force)."
            }),
            new ButtonInfo({
                buttonText: "UX = 1",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var RBClass = Il2Cpp.domain.assembly("UnityEngine.PhysicsModule").image.class("UnityEngine.Rigidbody");
                        var rb = uxSelectedObject.method("GetComponentInChildren", 1).inflate(RBClass).invoke(true);
                        if (!rb || rb.isNull()) { sendNotification("No Rigidbody", false); return; }
                        rb.method("set_mass").invoke(1.0);
                        sendNotification(uxSelectedName + " mass = 1 (default)", false);
                    } catch(e) { sendNotification("Set Mass: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Resets Rigidbody mass to 1 (Unity default)."
            }),
            new ButtonInfo({
                buttonText: "UX = 100",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var RBClass = Il2Cpp.domain.assembly("UnityEngine.PhysicsModule").image.class("UnityEngine.Rigidbody");
                        var rb = uxSelectedObject.method("GetComponentInChildren", 1).inflate(RBClass).invoke(true);
                        if (!rb || rb.isNull()) { sendNotification("No Rigidbody", false); return; }
                        rb.method("set_mass").invoke(100.0);
                        sendNotification(uxSelectedName + " mass = 100 (boulder)", false);
                    } catch(e) { sendNotification("Set Mass: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets Rigidbody mass to 100 (extremely heavy)."
            }),
            new ButtonInfo({
                buttonText: "UX = 0",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var RBClass = Il2Cpp.domain.assembly("UnityEngine.PhysicsModule").image.class("UnityEngine.Rigidbody");
                        var rb = uxSelectedObject.method("GetComponentInChildren", 1).inflate(RBClass).invoke(true);
                        if (!rb || rb.isNull()) { sendNotification("No Rigidbody", false); return; }
                        rb.method("set_linearDamping").invoke(0.0);
                        rb.method("set_angularDamping").invoke(0.0);
                        sendNotification(uxSelectedName + " drag = 0 (no air resistance)", false);
                    } catch(e) { sendNotification("Drag=0: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets linear and angular drag to 0 (object glides forever)."
            }),
            new ButtonInfo({
                buttonText: "UX = 10",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var RBClass = Il2Cpp.domain.assembly("UnityEngine.PhysicsModule").image.class("UnityEngine.Rigidbody");
                        var rb = uxSelectedObject.method("GetComponentInChildren", 1).inflate(RBClass).invoke(true);
                        if (!rb || rb.isNull()) { sendNotification("No Rigidbody", false); return; }
                        rb.method("set_linearDamping").invoke(10.0);
                        rb.method("set_angularDamping").invoke(10.0);
                        sendNotification(uxSelectedName + " drag = 10 (floaty)", false);
                    } catch(e) { sendNotification("Drag=10: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets drag to 10 â€” object floats and slows rapidly."
            }),
            new ButtonInfo({
                buttonText: "UX Position",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var RBClass = Il2Cpp.domain.assembly("UnityEngine.PhysicsModule").image.class("UnityEngine.Rigidbody");
                        var rb = uxSelectedObject.method("GetComponentInChildren", 1).inflate(RBClass).invoke(true);
                        if (!rb || rb.isNull()) { sendNotification("No Rigidbody", false); return; }
                        rb.method("set_constraints").invoke(14);
                        sendNotification(uxSelectedName + " position frozen", false);
                    } catch(e) { sendNotification("Freeze Pos: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets RigidbodyConstraints.FreezePosition (object stays put but can still rotate)."
            }),
            new ButtonInfo({
                buttonText: "UX Rotation",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var RBClass = Il2Cpp.domain.assembly("UnityEngine.PhysicsModule").image.class("UnityEngine.Rigidbody");
                        var rb = uxSelectedObject.method("GetComponentInChildren", 1).inflate(RBClass).invoke(true);
                        if (!rb || rb.isNull()) { sendNotification("No Rigidbody", false); return; }
                        rb.method("set_constraints").invoke(112);
                        sendNotification(uxSelectedName + " rotation frozen", false);
                    } catch(e) { sendNotification("Freeze Rot: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets RigidbodyConstraints.FreezeRotation (stops spinning)."
            }),
            new ButtonInfo({
                buttonText: "UX All",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var RBClass = Il2Cpp.domain.assembly("UnityEngine.PhysicsModule").image.class("UnityEngine.Rigidbody");
                        var rb = uxSelectedObject.method("GetComponentInChildren", 1).inflate(RBClass).invoke(true);
                        if (!rb || rb.isNull()) { sendNotification("No Rigidbody", false); return; }
                        rb.method("set_constraints").invoke(126);
                        sendNotification(uxSelectedName + " ALL physics frozen", false);
                    } catch(e) { sendNotification("Freeze All: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets RigidbodyConstraints.FreezeAll â€” completely locks the object in place."
            }),
            new ButtonInfo({
                buttonText: "UX All",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var RBClass = Il2Cpp.domain.assembly("UnityEngine.PhysicsModule").image.class("UnityEngine.Rigidbody");
                        var rb = uxSelectedObject.method("GetComponentInChildren", 1).inflate(RBClass).invoke(true);
                        if (!rb || rb.isNull()) { sendNotification("No Rigidbody", false); return; }
                        rb.method("set_constraints").invoke(0);
                        rb.method("set_isKinematic").invoke(false);
                        sendNotification(uxSelectedName + " fully unfrozen", false);
                    } catch(e) { sendNotification("Unfreeze: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Clears all RigidbodyConstraints and disables kinematic."
            }),
            new ButtonInfo({
                buttonText: "UX Torque",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var RBClass = Il2Cpp.domain.assembly("UnityEngine.PhysicsModule").image.class("UnityEngine.Rigidbody");
                        var rb = uxSelectedObject.method("GetComponentInChildren", 1).inflate(RBClass).invoke(true);
                        if (!rb || rb.isNull()) { sendNotification("No Rigidbody", false); return; }
                        rb.method("set_isKinematic").invoke(false);
                        var torque = Vector3.method("op_Multiply").invoke(Vector3.method("get_up").invoke(), 500.0);
                        rb.method("AddTorque", 2).invoke(torque, 0);
                        sendNotification(uxSelectedName + " spinning!", false);
                    } catch(e) { sendNotification("Torque: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Adds a large upward torque to spin the selected object."
            }),
            new ButtonInfo({
                buttonText: "UX Here",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var RBClass = Il2Cpp.domain.assembly("UnityEngine.PhysicsModule").image.class("UnityEngine.Rigidbody");
                        var rb = uxSelectedObject.method("GetComponentInChildren", 1).inflate(RBClass).invoke(true);
                        if (!rb || rb.isNull()) { sendNotification("No Rigidbody", false); return; }
                        rb.method("set_isKinematic").invoke(false);
                        var pos = uxGetTransform(uxSelectedObject).method("get_position").invoke();
                        rb.method("AddExplosionForce", 3).invoke(2000.0, pos, 8.0);
                        sendNotification(uxSelectedName + " exploded!", false);
                    } catch(e) { sendNotification("Explosion: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Calls AddExplosionForce at the object's own position â€” launches it."
            }),
            new ButtonInfo({
                buttonText: "UX Velocity",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var RBClass = Il2Cpp.domain.assembly("UnityEngine.PhysicsModule").image.class("UnityEngine.Rigidbody");
                        var rb = uxSelectedObject.method("GetComponentInChildren", 1).inflate(RBClass).invoke(true);
                        if (!rb || rb.isNull()) { sendNotification("No Rigidbody", false); return; }
                        var vel = rb.method("get_linearVelocity").invoke();
                        var angVel = rb.method("get_angularVelocity").invoke();
                        var speed = Math.sqrt(
                            Math.pow(vel.field("x").value , 2) +
                            Math.pow(vel.field("y").value , 2) +
                            Math.pow(vel.field("z").value , 2)
                        );
                        console.log("[UX] " + uxSelectedName + " vel=" + uxVec3Str(vel) + " angVel=" + uxVec3Str(angVel));
                        sendNotification("speed=" + speed.toFixed(2) + " m/s | " + uxVec3Str(vel), false, 5);
                    } catch(e) { sendNotification("Log Vel: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Logs and displays the current linear and angular velocity of the selected object."
            }),
            new ButtonInfo({
                buttonText: "UX Grabbable",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var gbo = uxSelectedObject.method("GetComponentInChildren", 1).inflate(GBOClass).invoke(true);
                        if (!gbo || gbo.isNull()) { sendNotification("No GrabbableObject on " + uxSelectedName, false); return; }
                        gbo.method("set_forceDisableGrab").invoke(false);
                        try { gbo.field("_allowGrabAnywhere").value = true; } catch(_) {}
                        sendNotification(uxSelectedName + " is now grabbable", false);
                    } catch(e) { sendNotification("Make Grabbable: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Clears forceDisableGrab and enables grab-anywhere on the selected object."
            }),
            new ButtonInfo({
                buttonText: "UX Ungrabable",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var gbo = uxSelectedObject.method("GetComponentInChildren", 1).inflate(GBOClass).invoke(true);
                        if (!gbo || gbo.isNull()) { sendNotification("No GrabbableObject", false); return; }
                        gbo.method("set_forceDisableGrab").invoke(true);
                        sendNotification(uxSelectedName + " is now ungrabable", false);
                    } catch(e) { sendNotification("Make Ungrabable: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets forceDisableGrab=true so no one can pick up the selected object."
            }),
            new ButtonInfo({
                buttonText: "UX Anywhere",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var gbo = uxSelectedObject.method("GetComponentInChildren", 1).inflate(GBOClass).invoke(true);
                        if (!gbo || gbo.isNull()) { sendNotification("No GrabbableObject", false); return; }
                        gbo.field("_allowGrabAnywhere").value = true;
                        gbo.field("_useDefaultHandGrabOffsets").value = false;
                        sendNotification(uxSelectedName + " can be grabbed anywhere", false);
                    } catch(e) { sendNotification("Grab Anywhere: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets _allowGrabAnywhere=true so the object can be grabbed at any point."
            }),
            new ButtonInfo({
                buttonText: "UX Grab to Me",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        var gbo = uxSelectedObject.method("GetComponentInChildren", 1).inflate(GBOClass).invoke(true);
                        if (!gbo || gbo.isNull()) {
                            var handPos = rightHandTransform.method("get_position").invoke();
                            uxGetTransform(uxSelectedObject).method("set_position").invoke(handPos);
                            sendNotification(uxSelectedName + " moved to hand (no GBO)", false);
                            return;
                        }
                        var backAnchor = player.method("get_backItemAttachAnchor").invoke();
                        if (backAnchor && !backAnchor.isNull()) {
                            gbo.method("Grab").invoke(backAnchor, true);
                            sendNotification(uxSelectedName + " grabbed to back anchor", false);
                        } else {
                            var handPos = rightHandTransform.method("get_position").invoke();
                            uxGetTransform(uxSelectedObject).method("set_position").invoke(handPos);
                            sendNotification(uxSelectedName + " moved to hand", false);
                        }
                    } catch(e) { sendNotification("Force Grab: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Force-grabs the selected object to your back anchor, or teleports it to your hand ."
            }),
            new ButtonInfo({
                buttonText: "UX Release",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var gbo = uxSelectedObject.method("GetComponentInChildren", 1).inflate(GBOClass).invoke(true);
                        if (!gbo || gbo.isNull()) { sendNotification("No GrabbableObject", false); return; }
                        var pos = uxGetTransform(uxSelectedObject).method("get_position").invoke();
                        var rot = uxGetTransform(uxSelectedObject).method("get_rotation").invoke();
                        var zero = Vector3.method("get_zero").invoke();
                        gbo.method("Release").invoke(pos, rot, zero, zero, false, false);
                        sendNotification(uxSelectedName + " released", false);
                    } catch(e) { sendNotification("Force Release: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Force-releases the selected GrabbableObject with zero velocity."
            }),
            new ButtonInfo({
                buttonText: "UX Mod +",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var gbo = uxSelectedObject.method("GetComponentInChildren", 1).inflate(GBOClass).invoke(true);
                        if (!gbo || gbo.isNull()) { sendNotification("No GrabbableObject", false); return; }
                        var cur = gbo.method("get_scaleModifier").invoke() ;
                        var next = Math.min(cur + 20, 127);
                        gbo.method("set_scaleModifier").invoke(next);
                        gbo.method("HandleScaleChanged").invoke();
                        sendNotification(uxSelectedName + " scaleModifier â†’ " + next, false);
                    } catch(e) { sendNotification("Scale Mod+: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Increases the networked scaleModifier on GrabbableObject by 20 steps."
            }),
            new ButtonInfo({
                buttonText: "UX Mod -",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var gbo = uxSelectedObject.method("GetComponentInChildren", 1).inflate(GBOClass).invoke(true);
                        if (!gbo || gbo.isNull()) { sendNotification("No GrabbableObject", false); return; }
                        var cur = gbo.method("get_scaleModifier").invoke() ;
                        var next = Math.max(cur - 20, -128);
                        gbo.method("set_scaleModifier").invoke(next);
                        gbo.method("HandleScaleChanged").invoke();
                        sendNotification(uxSelectedName + " scaleModifier â†’ " + next, false);
                    } catch(e) { sendNotification("Scale Mod-: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Decreases the networked scaleModifier on GrabbableObject by 20 steps."
            }),
            new ButtonInfo({
                buttonText: "UX Hue Random",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var gbo = uxSelectedObject.method("GetComponentInChildren", 1).inflate(GBOClass).invoke(true);
                        if (!gbo || gbo.isNull()) { sendNotification("No GrabbableObject", false); return; }
                        var hue = Math.random();
                        gbo.method("SetColorHue").invoke(hue);
                        gbo.method("HandleColorHueChanged").invoke();
                        sendNotification(uxSelectedName + " hue â†’ " + (hue * 360).toFixed(0) + "Â°", false);
                    } catch(e) { sendNotification("Set Hue: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets a random color hue on the GrabbableObject's networked color."
            }),
            new ButtonInfo({
                buttonText: "UX Obj (GBO)",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var gbo = uxSelectedObject.method("GetComponentInChildren", 1).inflate(GBOClass).invoke(true);
                        if (!gbo || gbo.isNull()) { sendNotification("No GrabbableObject", false); return; }
                        gbo.method("SetIsHidden").invoke(true);
                        sendNotification(uxSelectedName + " hidden (networked)", false);
                    } catch(e) { sendNotification("Hide GBO: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Calls SetIsHidden(true) on the GrabbableObject â€” hidden for all players."
            }),
            new ButtonInfo({
                buttonText: "UX Obj (GBO)",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var gbo = uxSelectedObject.method("GetComponentInChildren", 1).inflate(GBOClass).invoke(true);
                        if (!gbo || gbo.isNull()) { sendNotification("No GrabbableObject", false); return; }
                        gbo.method("SetIsHidden").invoke(false);
                        sendNotification(uxSelectedName + " unhidden (networked)", false);
                    } catch(e) { sendNotification("Unhide GBO: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Calls SetIsHidden(false) on the GrabbableObject â€” visible for all players."
            }),
            new ButtonInfo({
                buttonText: "UX All Hidden",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var activatedGOs = 0;
                        var enabledRenderers = 0;
                        var enabledColliders = 0;
                        var gboUnhidden = 0;
                        var tf = uxGetTransform(uxSelectedObject);
                        if (!tf) { sendNotification("No transform on " + uxSelectedName, false); return; }
                        var stack[] = [tf];
                        while (stack.length > 0) {
                            var cur = stack.pop();
                            try {
                                var go = cur.method("get_gameObject").invoke();
                                if (go && !go.isNull()) {
                                    try {
                                        if (!go.method("get_activeSelf").invoke()) {
                                            go.method("SetActive").invoke(true);
                                            activatedGOs++;
                                        }
                                    } catch(_) {}
                                }
                                var childCount = cur.method("get_childCount").invoke() ;
                                for (var i = 0; i < childCount; i++) {
                                    try { stack.push(cur.method("GetChild").invoke(i)); } catch(_) {}
                                }
                            } catch(_) {}
                        }
                        try {
                            var RendClass = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.Renderer");
                            var rends = uxSelectedObject.method("GetComponentsInChildren", 1).inflate(RendClass).invoke(true);
                            var rLen = rends ? rends.length : 0;
                            for (var i = 0; i < rLen; i++) {
                                try {
                                    var r = rends.method("get_Item").invoke(i);
                                    if (!r.method("get_enabled").invoke()) {
                                        r.method("set_enabled").invoke(true);
                                        enabledRenderers++;
                                    }
                                } catch(_) {}
                            }
                        } catch(_) {}
                        try {
                            var ColClass = Il2Cpp.domain.assembly("UnityEngine.PhysicsModule").image.class("UnityEngine.Collider");
                            var cols = uxSelectedObject.method("GetComponentsInChildren", 1).inflate(ColClass).invoke(true);
                            var cLen = cols ? cols.length : 0;
                            for (var i = 0; i < cLen; i++) {
                                try {
                                    var c = cols.method("get_Item").invoke(i);
                                    if (!c.method("get_enabled").invoke()) {
                                        c.method("set_enabled").invoke(true);
                                        enabledColliders++;
                                    }
                                } catch(_) {}
                            }
                        } catch(_) {}
                        try {
                            var gbo = uxSelectedObject.method("GetComponentInChildren", 1).inflate(GBOClass).invoke(true);
                            if (gbo && !gbo.isNull()) {
                                gbo.method("SetIsHidden").invoke(false);
                                gboUnhidden = 1;
                            }
                        } catch(_) {}
                        var msg = "Revealed on " + uxSelectedName + ":\n"
                            + activatedGOs + " inactive GOs, "
                            + enabledRenderers + " renderers, "
                            + enabledColliders + " colliders"
                            + (gboUnhidden ? ", GBO unhidden" : "");
                        console.log("[UX] " + msg);
                        sendNotification(msg, false, 7);
                    } catch(e) { sendNotification("Reveal Hidden: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Makes EVERYTHING on the selected object visible: activates all inactive children, re-enables all disabled Renderers and Colliders, and clears the GBO hidden flag."
            }),
            new ButtonInfo({
                buttonText: "UX Value +500",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var gbi = uxSelectedObject.method("GetComponentInChildren", 1).inflate(GBIClass).invoke(true);
                        if (!gbi || gbi.isNull()) { sendNotification("No GrabbableItem", false); return; }
                        var cur = gbi.method("get_additionalSellValue").invoke() ;
                        gbi.method("SetAdditionalSellValue").invoke(cur + 500);
                        var newVal = gbi.method("get_sellValue").invoke() ;
                        sendNotification(uxSelectedName + " sell value â†’ " + newVal, false);
                    } catch(e) { sendNotification("Sell Value: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Increases additionalSellValue by 500 (synced via RPC)."
            }),
            new ButtonInfo({
                buttonText: "UX Value MAX",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var gbi = uxSelectedObject.method("GetComponentInChildren", 1).inflate(GBIClass).invoke(true);
                        if (!gbi || gbi.isNull()) { sendNotification("No GrabbableItem", false); return; }
                        gbi.method("SetAdditionalSellValue").invoke(999999);
                        sendNotification(uxSelectedName + " sell value = MAX (999999)", false);
                    } catch(e) { sendNotification("Sell Max: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets additionalSellValue to 999999 â€” sells for a fortune."
            }),
            new ButtonInfo({
                buttonText: "UX Value Reset",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var gbi = uxSelectedObject.method("GetComponentInChildren", 1).inflate(GBIClass).invoke(true);
                        if (!gbi || gbi.isNull()) { sendNotification("No GrabbableItem", false); return; }
                        gbi.method("SetAdditionalSellValue").invoke(0);
                        sendNotification(uxSelectedName + " sell value reset", false);
                    } catch(e) { sendNotification("Sell Reset: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Resets additionalSellValue to 0."
            }),
            new ButtonInfo({
                buttonText: "UX Purchased",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var gbi = uxSelectedObject.method("GetComponentInChildren", 1).inflate(GBIClass).invoke(true);
                        if (!gbi || gbi.isNull()) { sendNotification("No GrabbableItem", false); return; }
                        gbi.method("set_wasPurchased").invoke(true);
                        sendNotification(uxSelectedName + " marked ", false);
                    } catch(e) { sendNotification("Purchased: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets wasPurchased=true on the GrabbableItem."
            }),
            new ButtonInfo({
                buttonText: "UX Eat Now",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var EdibleClass = AssemblyCSharp.class("AnimalCompany.EdibleItem");
                        var edible = uxSelectedObject.method("GetComponentInChildren", 1).inflate(EdibleClass).invoke(true);
                        if (!edible || edible.isNull()) { sendNotification("Not edible: " + uxSelectedName, false); return; }
                        edible.method("TestOnEaten").invoke();
                        sendNotification(uxSelectedName + " eaten! Nom nom.", false);
                    } catch(e) { sendNotification("Eat: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Calls TestOnEaten() on the EdibleItem component â€” triggers all buff/eat effects."
            }),
            new ButtonInfo({
                buttonText: "UX Edible",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var EdibleClass = AssemblyCSharp.class("AnimalCompany.EdibleItem");
                        var edible = uxSelectedObject.method("GetComponentInChildren", 1).inflate(EdibleClass).invoke(true);
                        if (!edible || edible.isNull()) {
                            sendNotification(uxSelectedName + " is NOT edible", false, 4);
                            console.log("[UX] " + uxSelectedName + " has no EdibleItem component");
                        } else {
                            var wasEaten = edible.field("_wasEaten").value;
                            sendNotification(uxSelectedName + " IS edible! wasEaten=" + wasEaten, false, 4);
                            console.log("[UX] " + uxSelectedName + " EdibleItem found, wasEaten=" + wasEaten);
                        }
                    } catch(e) { sendNotification("Check Edible: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Checks if the selected object has an EdibleItem component and logs its state."
            }),
            new ButtonInfo({
                buttonText: "UX Item Data",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var gbi = uxSelectedObject.method("GetComponentInChildren", 1).inflate(GBIClass).invoke(true);
                        if (!gbi || gbi.isNull()) { sendNotification("No GrabbableItem on " + uxSelectedName, false); return; }
                        var itemID    = gbi.method("get_itemID").invoke()?.content ?? "?";
                        var sellVal   = gbi.method("get_sellValue").invoke() ;
                        var addSell   = gbi.method("get_additionalSellValue").invoke() ;
                        var canBag    = gbi.method("get_canAddToBag").invoke();
                        var allowBag  = gbi.method("get_allowAddToBag").invoke();
                        var allowItem = gbi.method("get_allowAttachToItem").invoke();
                        var inBP      = gbi.field("_allowAddToBag").value;
                        console.log("[UX-ItemData] â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");
                        console.log("[UX-ItemData] itemID         : " + itemID);
                        console.log("[UX-ItemData] sellValue      : " + sellVal + " (+" + addSell + " bonus)");
                        console.log("[UX-ItemData] canAddToBag    : " + canBag);
                        console.log("[UX-ItemData] allowAddToBag  : " + allowBag);
                        console.log("[UX-ItemData] allowAttachItem: " + allowItem);
                        console.log("[UX-ItemData] _allowAddToBag : " + inBP);
                        try {
                            var itemData = gbi.method("get_itemData").invoke();
                            if (itemData && !itemData.isNull()) {
                                var flags = itemData.method("get_flags").invoke();
                                var flagVal = flags ? flags.method("get_value").invoke() : "?";
                                console.log("[UX-ItemData] flags          : " + flagVal);
                                console.log("[UX-ItemData] isLoot         : " + itemData.method("get_isLoot").invoke());
                                console.log("[UX-ItemData] isPurchasable  : " + itemData.method("get_isPurchasable").invoke());
                                console.log("[UX-ItemData] isBag          : " + itemData.method("get_isBag").invoke());
                                console.log("[UX-ItemData] isQuiver       : " + itemData.method("get_isQuiver").invoke());
                                console.log("[UX-ItemData] isWeapon       : " + itemData.method("get_isWeapon").invoke());
                            }
                        } catch(_) {}
                        console.log("[UX-ItemData] â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");
                        sendNotification(itemID + " | sell=" + sellVal + " | see log", false, 5);
                    } catch(e) { sendNotification("Item Data: " + e, false); console.error("[UX] ItemData:", e); }
                },
                isTogglable: false,
                toolTip: "Logs full itemID, sell value, and all GameplayItemFlags to Frida console."
            }),
            new ButtonInfo({
                buttonText: "UX in Bag",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var gbi = uxSelectedObject.method("GetComponentInChildren", 1).inflate(GBIClass).invoke(true);
                        if (!gbi || gbi.isNull()) { sendNotification("No GrabbableItem", false); return; }
                        gbi.method("set_allowAddToBag").invoke(true);
                        try { gbi.field("_allowAddToBag").value = true; } catch(_) {}
                        sendNotification(uxSelectedName + " can now go in bags", false);
                    } catch(e) { sendNotification("Allow in Bag: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets allowAddToBag=true so the item can be put into backpacks."
            }),
            new ButtonInfo({
                buttonText: "UX in Bag",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var gbi = uxSelectedObject.method("GetComponentInChildren", 1).inflate(GBIClass).invoke(true);
                        if (!gbi || gbi.isNull()) { sendNotification("No GrabbableItem", false); return; }
                        gbi.method("set_allowAddToBag").invoke(false);
                        try { gbi.field("_allowAddToBag").value = false; } catch(_) {}
                        sendNotification(uxSelectedName + " blocked from bags", false);
                    } catch(e) { sendNotification("Deny in Bag: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets allowAddToBag=false so the item cannot be bagged."
            }),
            new ButtonInfo({
                buttonText: "UX Loot Flag",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var gbi = uxSelectedObject.method("GetComponentInChildren", 1).inflate(GBIClass).invoke(true);
                        if (!gbi || gbi.isNull()) { sendNotification("No GrabbableItem", false); return; }
                        var itemData = gbi.method("get_itemData").invoke();
                        if (!itemData || itemData.isNull()) { sendNotification("No itemData", false); return; }
                        var flagsSP = itemData.method("get_flags").invoke();
                        var cur = flagsSP.method("get_value").invoke() ;
                        flagsSP.method("set_value").invoke(cur | 2); 
                        sendNotification(uxSelectedName + " flagged ", false);
                    } catch(e) { sendNotification("Loot Flag: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Adds the Loot flag (0x2) to the item's GameplayItemFlags."
            }),
            new ButtonInfo({
                buttonText: "UX Bag Flag",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var gbi = uxSelectedObject.method("GetComponentInChildren", 1).inflate(GBIClass).invoke(true);
                        if (!gbi || gbi.isNull()) { sendNotification("No GrabbableItem", false); return; }
                        var itemData = gbi.method("get_itemData").invoke();
                        if (!itemData || itemData.isNull()) return;
                        var flagsSP = itemData.method("get_flags").invoke();
                        var cur = flagsSP.method("get_value").invoke() ;
                        flagsSP.method("set_value").invoke(cur | 32 | 128);
                        sendNotification(uxSelectedName + " flagged ", false);
                    } catch(e) { sendNotification("Bag Flag: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Adds IsBag(0x20) + AllowAddToBag(0x80) flags to the item."
            }),
            new ButtonInfo({
                buttonText: "UX Quiver Flag",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var gbi = uxSelectedObject.method("GetComponentInChildren", 1).inflate(GBIClass).invoke(true);
                        if (!gbi || gbi.isNull()) { sendNotification("No GrabbableItem", false); return; }
                        var itemData = gbi.method("get_itemData").invoke();
                        if (!itemData || itemData.isNull()) return;
                        var flagsSP = itemData.method("get_flags").invoke();
                        var cur = flagsSP.method("get_value").invoke() ;
                        flagsSP.method("set_value").invoke(cur | 64 | 256);
                        sendNotification(uxSelectedName + " flagged ", false);
                    } catch(e) { sendNotification("Quiver Flag: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Adds IsQuiver(0x40) + AllowAddToQuiver(0x100) flags to the item."
            }),
            new ButtonInfo({
                buttonText: "UX Back+Hip",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var gbi = uxSelectedObject.method("GetComponentInChildren", 1).inflate(GBIClass).invoke(true);
                        if (!gbi || gbi.isNull()) { sendNotification("No GrabbableItem", false); return; }
                        var itemData = gbi.method("get_itemData").invoke();
                        if (!itemData || itemData.isNull()) return;
                        var flagsSP = itemData.method("get_flags").invoke();
                        var cur = flagsSP.method("get_value").invoke() ;
                        flagsSP.method("set_value").invoke(cur | 1024 | 2048);
                        sendNotification(uxSelectedName + " can attach to back/hip", false);
                    } catch(e) { sendNotification("Back+Hip Flag: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Adds AllowAttachToBack(0x400) + AllowAttachToHip(0x800) flags."
            }),
            new ButtonInfo({
                buttonText: "UX = ALL",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var gbi = uxSelectedObject.method("GetComponentInChildren", 1).inflate(GBIClass).invoke(true);
                        if (!gbi || gbi.isNull()) { sendNotification("No GrabbableItem", false); return; }
                        var itemData = gbi.method("get_itemData").invoke();
                        if (!itemData || itemData.isNull()) return;
                        var flagsSP = itemData.method("get_flags").invoke();
                        flagsSP.method("set_value").invoke(8190);
                        gbi.method("set_allowAddToBag").invoke(true);
                        sendNotification(uxSelectedName + " ALL flags enabled", false);
                    } catch(e) { sendNotification("Flags ALL: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets ALL GameplayItemFlags at once â€” item becomes loot, bag, quiver, attachable everywhere."
            }),
            new ButtonInfo({
                buttonText: "UX = CLEAR",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var gbi = uxSelectedObject.method("GetComponentInChildren", 1).inflate(GBIClass).invoke(true);
                        if (!gbi || gbi.isNull()) { sendNotification("No GrabbableItem", false); return; }
                        var itemData = gbi.method("get_itemData").invoke();
                        if (!itemData || itemData.isNull()) return;
                        var flagsSP = itemData.method("get_flags").invoke();
                        flagsSP.method("set_value").invoke(0);
                        sendNotification(uxSelectedName + " flags cleared", false);
                    } catch(e) { sendNotification("Flags Clear: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Clears all GameplayItemFlags to 0 (None)."
            }),
            new ButtonInfo({
                buttonText: "UX Player Hit",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    var ray = gunData.ray;
                    if (!ray || ray.handle.isNull()) return;
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.8;
                        try {
                            var hitCol = ray.method("get_collider").invoke();
                            if (!hitCol || hitCol.isNull()) return;
                            var hitGO = hitCol.method("get_gameObject").invoke();
                            var hitPlayer = hitGO.method("GetComponentInParent", 0).inflate(NetPlayer).invoke();
                            if (!hitPlayer || hitPlayer.isNull()) { sendNotification("No player hit", false); return; }
                            var name = getPlayerName(hitPlayer);
                            if (!(globalThis )._uxBuffIdx) (globalThis )._uxBuffIdx = 1;
                            var buffID = (globalThis )._uxBuffIdx;
                            (globalThis )._uxBuffIdx = (buffID % 7) + 1;
                            hitPlayer.method("RPC_ApplyBuff").invoke(buffID);
                            var buffNames = ["?","Speed","Pink","Damage","Stun","Scale","Stinky","AntiGrav"];
                            sendNotification("Buffed " + name + " â†’ " + (buffNames[buffID] ?? buffID), false);
                        } catch(e) { sendNotification("Buff Gun: " + e, false); }
                    }
                },
                toolTip: "Aim at a player and pull trigger to cycle through all 7 buffs (Speed/Pink/Damage/Stun/Scale/Stinky/AntiGrav)."
            }),
            new ButtonInfo({
                buttonText: "UX Stinky Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    var ray = gunData.ray;
                    if (!ray || ray.handle.isNull()) return;
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.5;
                        try {
                            var hitCol = ray.method("get_collider").invoke();
                            if (!hitCol || hitCol.isNull()) return;
                            var hitGO = hitCol.method("get_gameObject").invoke();
                            var hitPlayer = hitGO.method("GetComponentInParent", 0).inflate(NetPlayer).invoke();
                            if (!hitPlayer || hitPlayer.isNull()) { sendNotification("No player", false); return; }
                            hitPlayer.method("RPC_TagAsStinky").invoke();
                            sendNotification(getPlayerName(hitPlayer) + " tagged stinky!", false);
                        } catch(e) { sendNotification("Stinky Gun: " + e, false); }
                    }
                },
                toolTip: "Aim at a player and pull trigger to tag them ."
            }),
            new ButtonInfo({
                buttonText: "UX HSV Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    var ray = gunData.ray;
                    if (!ray || ray.handle.isNull()) return;
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.5;
                        try {
                            var hitCol = ray.method("get_collider").invoke();
                            if (!hitCol || hitCol.isNull()) return;
                            var hitGO = hitCol.method("get_gameObject").invoke();
                            var hitPlayer = hitGO.method("GetComponentInParent", 0).inflate(NetPlayer).invoke();
                            if (!hitPlayer || hitPlayer.isNull()) { sendNotification("No player", false); return; }
                            var hue = Math.random();
                            hitPlayer.method("RPC_SetColorHSV").invoke(30.0, hue, 1.0, 1.0);
                            sendNotification(getPlayerName(hitPlayer) + " â†’ HSV hue " + (hue*360).toFixed(0) + "Â°", false);
                        } catch(e) { sendNotification("HSV Gun: " + e, false); }
                    }
                },
                toolTip: "Aim at a player and pull trigger to set a random HSV color effect on them for 30 seconds."
            }),
            new ButtonInfo({
                buttonText: "UX Prefab",
                method: () => {
                    try {
                        var name = prefabIDs[prefabIndex];
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        var spawnPos = (player && !player.handle.isNull())
                            ? getTransform(player).method("get_position").invoke()
                            .method("get_zero").invoke();
                        var result = spawnNetworkPrefab(name, spawnPos, identityQuaternion);
                        if (result && !result.isNull()) {
                            sendNotification("Spawned (net): " + name, false, 5);
                        } else {
                            sendNotification("Not found in PrefabTable: " + name, false);
                        }
                    } catch(e) { sendNotification("Instantiate: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Spawns the selected prefab at your position via NetworkRunner PrefabTable."
            }),
            new ButtonInfo({
                buttonText: "UX At Aim",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    var ray = gunData.ray;
                    if (!ray || ray.handle.isNull()) return;
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.4;
                        try {
                            var hitPoint = ray.method("get_point").invoke();
                            var name = prefabIDs[prefabIndex];
                            var result = spawnNetworkPrefab(name, hitPoint, identityQuaternion);
                            if (result && !result.isNull()) {
                                sendNotification("Spawned: " + name, false);
                            } else {
                                sendNotification("Not found in PrefabTable: " + name, false);
                            }
                        } catch(e) { sendNotification("Spawn Aim: " + e, false); }
                    }
                },
                toolTip: "Hold grip + aim + trigger to spawn the selected prefab exactly where you aim (via NetworkRunner)."
            }),
            new ButtonInfo({
                buttonText: "UX Copy Here",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        var spawnPos = (player && !player.handle.isNull())
                            ? getTransform(player).method("get_position").invoke()
                            : uxGetTransform(uxSelectedObject).method("get_position").invoke();
                        var rot = uxGetTransform(uxSelectedObject).method("get_rotation").invoke();
                        try {
                            var gbi = uxSelectedObject.method("GetComponentInChildren", 1).inflate(GBIClass).invoke(true);
                            if (gbi && !gbi.isNull()) {
                                var itemID = gbi.method("get_itemID").invoke()?.content ?? "";
                                if (itemID) {
                                    PrefabGen.method("SpawnItem", 4).invoke(Il2Cpp.string(itemID), spawnPos, rot, NULL);
                                    sendNotification("Copied: " + itemID, false, 5);
                                    return;
                                }
                            }
                        } catch(_) {}
                        Object.method("Instantiate", 3).invoke(uxSelectedObject, spawnPos, rot);
                        sendNotification("Cloned: " + uxSelectedName, false, 5);
                    } catch(e) { sendNotification("Spawn Copy: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Spawns a copy of the selected object at your position. Uses itemID for networked spawn, falls back to Instantiate."
            }),
            new ButtonInfo({
                buttonText: "UX Selected",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var NOClass = Il2Cpp.domain.assembly("Fusion.Runtime").image.class("Fusion.NetworkObject");
                        var no = uxSelectedObject.method("GetComponentInParent", 0).inflate(NOClass).invoke();
                        if (no && !no.isNull()) {
                            var runner = PrefabGen.method("get_runner").invoke();
                            if (runner && !runner.isNull()) {
                                runner.method("Despawn", 1).invoke(no);
                                sendNotification("Despawned: " + uxSelectedName, false);
                                uxSelectedObject = null; uxSelectedName = "none";
                                return;
                            }
                        }
                        Object.method("Destroy", 1).invoke(uxSelectedObject);
                        sendNotification("Destroyed: " + uxSelectedName, false);
                        uxSelectedObject = null; uxSelectedName = "none";
                    } catch(e) { sendNotification("Despawn: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Despawns the selected object via NetworkRunner, or falls back to Object.Destroy."
            }),
            new ButtonInfo({
                buttonText: "UX to Prefab List",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var added = "";
                        try {
                            var gbi = uxSelectedObject.method("GetComponentInChildren", 1).inflate(GBIClass).invoke(true);
                            if (gbi && !gbi.isNull()) {
                                var itemID = gbi.method("get_itemID").invoke()?.content ?? "";
                                if (itemID && !(prefabIDs ).includes(itemID)) {
                                    (prefabIDs ).push(itemID);
                                    added = itemID;
                                } else if (itemID) {
                                    sendNotification("Already in list: " + itemID, false); return;
                                }
                            }
                        } catch(_) {}
                        if (!added) {
                            var n = uxSelectedName;
                            if (!(prefabIDs ).includes(n)) { (prefabIDs ).push(n); added = n; }
                            else { sendNotification("Already in list: " + n, false); return; }
                        }
                        prefabIndex = (prefabIDs ).length - 1;
                        sendNotification("Added + selected: " + added, false, 5);
                    } catch(e) { sendNotification("Copy Prefab: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Adds the selected object's itemID (or name) to your prefab spawn list and selects it."
            }),
            new ButtonInfo({
                buttonText: "UX Edible",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var EdibleClass = AssemblyCSharp.class("AnimalCompany.EdibleItem");
                        var existing = uxSelectedObject.method("GetComponentInChildren", 1).inflate(EdibleClass).invoke(true);
                        if (existing && !existing.isNull()) {
                            sendNotification(uxSelectedName + " already has EdibleItem!", false, 4);
                            return;
                        }
                        var newEdible = uxSelectedObject.method("AddComponent", 1).inflate(EdibleClass).invoke();
                        if (newEdible && !newEdible.isNull()) {
                            sendNotification(uxSelectedName + " â†’ EdibleItem added!", false, 5);
                        } else {
                            sendNotification("AddComponent returned null", false);
                        }
                    } catch(e) { sendNotification("Make Edible: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Adds an EdibleItem component to the selected object so it can be eaten."
            }),
            new ButtonInfo({
                buttonText: "UX Eat",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var EdibleClass = AssemblyCSharp.class("AnimalCompany.EdibleItem");
                        var edible = uxSelectedObject.method("GetComponentInChildren", 1).inflate(EdibleClass).invoke(true);
                        if (!edible || edible.isNull()) { sendNotification("No EdibleItem â€” use Make Edible first", false); return; }
                        edible.field("_wasEaten").value = true;
                        var ate = false;
                        try {
                            var gbi = uxSelectedObject.method("GetComponentInChildren", 1).inflate(GBIClass).invoke(true);
                            if (gbi && !gbi.isNull()) {
                                gbi.method("DespawnItem").invoke();
                                ate = true;
                            }
                        } catch(_) {}
                        if (!ate) {
                            try { Object.method("Destroy", 1).invoke(uxSelectedObject); ate = true; } catch(_) {}
                        }
                        sendNotification(uxSelectedName + " â†’ eaten and despawned!", false, 4);
                        uxSelectedObject = null; uxSelectedName = "none";
                    } catch(e) { sendNotification("Trigger Eat: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Triggers the eat sequence: sets _wasEaten=true then despawns the item via DespawnItem or Object.Destroy."
            }),
            new ButtonInfo({
                buttonText: "UX Edible",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var EdibleClass = AssemblyCSharp.class("AnimalCompany.EdibleItem");
                        var edible = uxSelectedObject.method("GetComponentInChildren", 1).inflate(EdibleClass).invoke(true);
                        if (!edible || edible.isNull()) {
                            sendNotification(uxSelectedName + " is NOT edible", false, 4);
                            console.log("[UX] " + uxSelectedName + " â€” no EdibleItem component");
                        } else {
                            var wasEaten = edible.field("_wasEaten").value;
                            var isClose  = edible.field("_isCloseToMouth").value;
                            sendNotification(uxSelectedName + " IS edible | wasEaten=" + wasEaten + " nearMouth=" + isClose, false, 5);
                            console.log("[UX] EdibleItem found on " + uxSelectedName + " | wasEaten=" + wasEaten + " isCloseToMouth=" + isClose);
                        }
                    } catch(e) { sendNotification("Check Edible: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Checks if the selected object has an EdibleItem and logs wasEaten + isCloseToMouth."
            }),
            new ButtonInfo({
                buttonText: "UX Eaten",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var EdibleClass = AssemblyCSharp.class("AnimalCompany.EdibleItem");
                        var edible = uxSelectedObject.method("GetComponentInChildren", 1).inflate(EdibleClass).invoke(true);
                        if (!edible || edible.isNull()) { sendNotification("No EdibleItem on " + uxSelectedName, false); return; }
                        edible.field("_wasEaten").value = false;
                        edible.field("_timerEating").value = 0.0;
                        sendNotification(uxSelectedName + " â†’ eat state reset (can be eaten again)", false, 4);
                    } catch(e) { sendNotification("Reset Eaten: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Resets _wasEaten=false and _timerEating=0 so the item can be eaten again."
            }),
            new ButtonInfo({
                buttonText: "UX x2",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var tf = uxGetTransform(uxSelectedObject);
                        var cur = tf.method("get_localScale").invoke();
                        var x = cur.field("x").value ;
                        var y = cur.field("y").value ;
                        var z = cur.field("z").value ;
                        var newScale = [x*2, y*2, z*2];
                        tf.method("set_localScale").invoke(newScale);
                        sendNotification(uxSelectedName + " scale x2 â†’ (" + (x*2).toFixed(2) + ")", false);
                    } catch(e) { sendNotification("Scale x2: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Doubles the localScale of the selected object."
            }),
            new ButtonInfo({
                buttonText: "UX x0.5",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var tf = uxGetTransform(uxSelectedObject);
                        var cur = tf.method("get_localScale").invoke();
                        var x = cur.field("x").value ;
                        var y = cur.field("y").value ;
                        var z = cur.field("z").value ;
                        var newScale = [x*0.5, y*0.5, z*0.5];
                        tf.method("set_localScale").invoke(newScale);
                        sendNotification(uxSelectedName + " scale x0.5 â†’ (" + (x*0.5).toFixed(2) + ")", false);
                    } catch(e) { sendNotification("Scale x0.5: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Halves the localScale of the selected object."
            }),
            new ButtonInfo({
                buttonText: "UX Reset",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var tf = uxGetTransform(uxSelectedObject);
                        var one = Vector3.method("get_one").invoke();
                        tf.method("set_localScale").invoke(one);
                        sendNotification(uxSelectedName + " scale â†’ (1,1,1)", false);
                    } catch(e) { sendNotification("Scale Reset: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Resets localScale of the selected object to (1,1,1)."
            }),
            new ButtonInfo({
                buttonText: "UX x10",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var tf = uxGetTransform(uxSelectedObject);
                        var cur = tf.method("get_localScale").invoke();
                        var x = cur.field("x").value ;
                        var y = cur.field("y").value ;
                        var z = cur.field("z").value ;
                        var newScale = [x*10, y*10, z*10];
                        tf.method("set_localScale").invoke(newScale);
                        sendNotification(uxSelectedName + " scale x10 â†’ (" + (x*10).toFixed(2) + ")", false);
                    } catch(e) { sendNotification("Scale x10: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Scales the selected object up by 10x."
            }),
            new ButtonInfo({
                buttonText: "UX Up 1m",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var tf = uxGetTransform(uxSelectedObject);
                        var pos = tf.method("get_position").invoke();
                        var newPos = [pos.field("x").value , (pos.field("y").value ) + 1.0, pos.field("z").value ];
                        tf.method("set_position").invoke(newPos);
                        sendNotification(uxSelectedName + " moved up 1m", false);
                    } catch(e) { sendNotification("Move Up: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Moves the selected object up by 1 metre in world space."
            }),
            new ButtonInfo({
                buttonText: "UX Down 1m",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var tf = uxGetTransform(uxSelectedObject);
                        var pos = tf.method("get_position").invoke();
                        var newPos = [pos.field("x").value , (pos.field("y").value ) - 1.0, pos.field("z").value ];
                        tf.method("set_position").invoke(newPos);
                        sendNotification(uxSelectedName + " moved down 1m", false);
                    } catch(e) { sendNotification("Move Down: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Moves the selected object down by 1 metre in world space."
            }),
            new ButtonInfo({
                buttonText: "UX Y 90Â°",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var tf = uxGetTransform(uxSelectedObject);
                        var euler = tf.method("get_eulerAngles").invoke();
                        var ex = euler.field("x").value ;
                        var ey = ((euler.field("y").value ) + 90) % 360;
                        var ez = euler.field("z").value ;
                        var V3Class = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.Vector3");
                        var newEuler = V3Class.method(".ctor", 3).invoke(ex, ey, ez);
                        tf.method("set_eulerAngles").invoke(newEuler);
                        sendNotification(uxSelectedName + " rotated Y +90Â°", false);
                    } catch(e) {
                        try {
                            var tf2 = uxGetTransform(uxSelectedObject);
                            var euler2 = tf2.method("get_eulerAngles").invoke();
                            euler2.field("y").value = ((euler2.field("y").value ) + 90) % 360;
                            tf2.method("set_eulerAngles").invoke(euler2);
                            sendNotification(uxSelectedName + " rotated Y +90Â°", false);
                        } catch(e2) { sendNotification("Rotate Y: " + e2, false); }
                    }
                },
                isTogglable: false,
                toolTip: "Rotates the selected object 90Â° around the Y axis."
            }),
            new ButtonInfo({
                buttonText: "UX to Ground",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var tf = uxGetTransform(uxSelectedObject);
                        var pos = tf.method("get_position").invoke();
                        var px = pos.field("x").value ;
                        var py = pos.field("y").value ;
                        var pz = pos.field("z").value ;
                        var originUp = Vector3.method("op_Addition").invoke(pos,
                            Vector3.method("op_Multiply").invoke(Vector3.method("get_up").invoke(), 2.0));
                        var downDir  = Vector3.method("op_Multiply").invoke(Vector3.method("get_up").invoke(), -1.0);
                        var PhysicsClass = Il2Cpp.domain.assembly("UnityEngine.PhysicsModule").image.class("UnityEngine.Physics");
                        var RHClass = Il2Cpp.domain.assembly("UnityEngine.PhysicsModule").image.class("UnityEngine.RaycastHit");
                        var hitBuf = Il2Cpp.alloc(128); 
                        var didHit = PhysicsClass.method("Raycast", 4).invoke(originUp, downDir, hitBuf, 200.0);
                        if (didHit) {
                            var hitPoint = Il2Cpp.reference(hitBuf).method("get_point").invoke();
                            var hitY = hitPoint.field("y").value ;
                            var newPos = Vector3.method("op_Addition").invoke(
                                Vector3.method("get_zero").invoke(),
                                Vector3.method("op_Addition").invoke(
                                    Vector3.method("op_Multiply", 2).invoke(Vector3.method("get_right").invoke(), px),
                                    Vector3.method("op_Addition").invoke(
                                        Vector3.method("op_Multiply", 2).invoke(Vector3.method("get_up").invoke(), hitY),
                                        Vector3.method("op_Multiply", 2).invoke(Vector3.method("get_forward").invoke(), pz)
                                    )
                                )
                            );
                            tf.method("set_position").invoke(newPos);
                            sendNotification(uxSelectedName + " snapped to y=" + hitY.toFixed(2), false, 4);
                        } else {
                            var groundPos = Vector3.method("op_Addition").invoke(
                                Vector3.method("get_zero").invoke(),
                                Vector3.method("op_Addition").invoke(
                                    Vector3.method("op_Multiply", 2).invoke(Vector3.method("get_right").invoke(), px),
                                    Vector3.method("op_Multiply", 2).invoke(Vector3.method("get_forward").invoke(), pz)
                                )
                            );
                            tf.method("set_position").invoke(groundPos);
                            sendNotification(uxSelectedName + " snapped to y=0 (no raycast hit)", false, 4);
                        }
                    } catch(e) { sendNotification("Snap Ground: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Raycasts down from the selected object and snaps it to the ground surface."
            }),
            new ButtonInfo({
                buttonText: "UX Item ID",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var gbi = uxSelectedObject.method("GetComponentInChildren", 1).inflate(GBIClass).invoke(true);
                        if (!gbi || gbi.isNull()) { sendNotification("No GrabbableItem on " + uxSelectedName, false); return; }
                        var itemID  = gbi.method("get_itemID").invoke()?.content ?? "?";
                        var sellVal = gbi.method("get_sellValue").invoke() ;
                        console.log("[UX] ItemID: " + itemID + " | sellValue: " + sellVal);
                        sendNotification("ItemID: " + itemID + " | sell=" + sellVal, false, 7);
                    } catch(e) { sendNotification("Get ItemID: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Reads and displays the itemID and sell value from the selected GrabbableItem."
            }),
            new ButtonInfo({
                buttonText: "UX All Components",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var names = uxGetComponentNames(uxSelectedObject);
                        console.log("[UX] Components on " + uxSelectedName + " (" + names.length + "):");
                        names.forEach((n, i) => console.log("[UX]   [" + i + "] " + n));
                        sendNotification(uxSelectedName + ": " + names.length + " comps â€” see log", false, 5);
                    } catch(e) { sendNotification("Log Comps: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Logs every component type name on the selected object to the Frida console."
            }),
            new ButtonInfo({
                buttonText: "UX Full Hierarchy",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        function logChildren(go, depth) {
                            var name = go.method("get_name").invoke()?.content ?? "?";
                            var prefix = "  ".repeat(depth) + (depth === 0 ? "ROOT: " : "â””â”€ ");
                            console.log("[UX-Hier] " + prefix + name);
                            var tf = uxGetTransform(go);
                            if (!tf) return;
                            var childCount = tf.method("get_childCount").invoke() ;
                            for (var i = 0; i < Math.min(childCount, 20); i++) {
                                try {
                                    var childTF = tf.method("GetChild").invoke(i);
                                    var childGO = childTF.method("get_gameObject").invoke();
                                    logChildren(childGO, depth + 1);
                                } catch(_) {}
                            }
                        }
                        logChildren(uxSelectedObject, 0);
                        sendNotification("Hierarchy logged â€” check Frida console", false, 4);
                    } catch(e) { sendNotification("Hierarchy: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Recursively logs the full child hierarchy of the selected GameObject (max 20 per level)."
            }),
            new ButtonInfo({
                buttonText: "UX Parent",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var tf = uxGetTransform(uxSelectedObject);
                        var parentTF = tf.method("get_parent").invoke();
                        if (!parentTF || parentTF.isNull()) { sendNotification(uxSelectedName + " has no parent", false); return; }
                        var parentGO = parentTF.method("get_gameObject").invoke();
                        uxSelectedObject = parentGO;
                        uxSelectedName = parentGO.method("get_name").invoke()?.content ?? "unnamed";
                        sendNotification("Now selected: " + uxSelectedName, false, 4);
                    } catch(e) { sendNotification("Select Parent: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Navigates up to the parent GameObject and selects it  new UX target."
            }),
            new ButtonInfo({
                buttonText: "UX Child[0]",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var tf = uxGetTransform(uxSelectedObject);
                        var childCount = tf.method("get_childCount").invoke() ;
                        if (childCount === 0) { sendNotification(uxSelectedName + " has no children", false); return; }
                        var childTF = tf.method("GetChild").invoke(0);
                        var childGO = childTF.method("get_gameObject").invoke();
                        uxSelectedObject = childGO;
                        uxSelectedName = childGO.method("get_name").invoke()?.content ?? "child";
                        sendNotification("Now selected: " + uxSelectedName + " (child 0 of " + childCount + ")", false, 4);
                    } catch(e) { sendNotification("Select Child: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Selects the first child of the currently selected GameObject."
            }),
            new ButtonInfo({
                buttonText: "UX by Gun",
                isTogglable: true,
                method: () => {
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    var ray = gunData.ray;
                    if (!ray || ray.handle.isNull()) return;
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.5;
                        try {
                            var hitCol = ray.method("get_collider").invoke();
                            if (!hitCol || hitCol.isNull()) return;
                            var go = hitCol.method("get_gameObject").invoke();
                            uxSelectedObject = go;
                            uxSelectedName = go.method("get_name").invoke()?.content ?? "unnamed";
                            sendNotification("UX Selected: " + uxSelectedName, false, 4);
                        } catch(e) { sendNotification("Select Gun: " + e, false); }
                    }
                },
                toolTip: "Hold grip + aim + trigger to point-select any object in the world  UX target."
            }),
            new ButtonInfo({
                buttonText: "UX Mob Here",
                method: () => {
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        var spawnPos = (player && !player.handle.isNull())
                            ? getTransform(player).method("get_position").invoke()
                            .method("get_zero").invoke();
                        var mobList = [10, 1, 5, 6, 19, 15, 3, 22]; 
                        var mobNames = ["Chicken","Angler","Banshee","Bomb","Spider","Phantom","Armstrong","Segway"];
                        if (!(globalThis )._uxMobIdx) (globalThis )._uxMobIdx = 0;
                        if (rightGrab) {
                            (globalThis )._uxMobIdx = ((globalThis )._uxMobIdx + 1) % mobList.length;
                            sendNotification("Mob: " + mobNames[(globalThis )._uxMobIdx], false, 3);
                            return;
                        }
                        var mobID = mobList[(globalThis )._uxMobIdx];
                        var mobName = mobNames[(globalThis )._uxMobIdx];
                        spawnMobAtPos({ name: mobName, id: mobID }, spawnPos, identityQuaternion);
                        sendNotification("Spawned " + mobName + " at your position!", false, 4);
                    } catch(e) { sendNotification("Spawn Mob: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Spawns a mob at your position. Hold RIGHT GRIP to cycle mob type (Chicken/Angler/Banshee/Bomb/Spider/Phantom/Armstrong/Segway), then press without grip to spawn."
            }),
            new ButtonInfo({
                buttonText: "UX ON",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var RBClass = Il2Cpp.domain.assembly("UnityEngine.PhysicsModule").image.class("UnityEngine.Rigidbody");
                        var rb = uxSelectedObject.method("GetComponentInChildren", 1).inflate(RBClass).invoke(true);
                        if (!rb || rb.isNull()) { sendNotification("No Rigidbody", false); return; }
                        rb.method("set_isKinematic").invoke(true);
                        sendNotification(uxSelectedName + " â†’ kinematic ON (no physics)", false);
                    } catch(e) { sendNotification("Kinematic ON: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Enables isKinematic on the selected object's Rigidbody (physics won't move it)."
            }),
            new ButtonInfo({
                buttonText: "UX OFF",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var RBClass = Il2Cpp.domain.assembly("UnityEngine.PhysicsModule").image.class("UnityEngine.Rigidbody");
                        var rb = uxSelectedObject.method("GetComponentInChildren", 1).inflate(RBClass).invoke(true);
                        if (!rb || rb.isNull()) { sendNotification("No Rigidbody", false); return; }
                        rb.method("set_isKinematic").invoke(false);
                        sendNotification(uxSelectedName + " â†’ kinematic OFF (physics active)", false);
                    } catch(e) { sendNotification("Kinematic OFF: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Disables isKinematic â€” object is now fully simulated by physics."
            }),
            new ButtonInfo({
                buttonText: "UX Velocity",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var RBClass = Il2Cpp.domain.assembly("UnityEngine.PhysicsModule").image.class("UnityEngine.Rigidbody");
                        var rb = uxSelectedObject.method("GetComponentInChildren", 1).inflate(RBClass).invoke(true);
                        if (!rb || rb.isNull()) { sendNotification("No Rigidbody", false); return; }
                        var zero = Vector3.method("get_zero").invoke();
                        rb.method("set_linearVelocity").invoke(zero);
                        rb.method("set_angularVelocity").invoke(zero);
                        sendNotification(uxSelectedName + " velocity zeroed", false);
                    } catch(e) { sendNotification("Zero Vel: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets both linear and angular velocity to zero on the selected Rigidbody."
            }),
            new ButtonInfo({
                buttonText: "UX Up",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    try {
                        var RBClass = Il2Cpp.domain.assembly("UnityEngine.PhysicsModule").image.class("UnityEngine.Rigidbody");
                        var rb = uxSelectedObject.method("GetComponentInChildren", 1).inflate(RBClass).invoke(true);
                        if (!rb || rb.isNull()) { sendNotification("No Rigidbody", false); return; }
                        rb.method("set_isKinematic").invoke(false);
                        rb.method("set_useGravity").invoke(true);
                        var upForce = [0, 1200, 0];
                        rb.method("AddForce", 2).invoke(upForce, 1); 
                        sendNotification(uxSelectedName + " launched up!", false);
                    } catch(e) { sendNotification("Launch Up: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Applies a large upward impulse force to the selected object's Rigidbody."
            }),
            new ButtonInfo({
                buttonText: "UX Scenes",
                method: () => {
                    try {
                        var SceneMgr = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.SceneManagement.SceneManager");
                        var sceneCount = SceneMgr.method("get_sceneCountInBuildSettings").invoke() ;
                        var loadedCount = SceneMgr.method("get_sceneCount").invoke() ;
                        console.log("[UX-Scene] Build settings: " + sceneCount + " scenes, currently loaded: " + loadedCount);
                        for (var i = 0; i < loadedCount; i++) {
                            try {
                                var scene = SceneMgr.method("GetSceneAt").invoke(i);
                                var name = scene.method("get_name").invoke()?.content ?? "?";
                                var path = scene.method("get_path").invoke()?.content ?? "?";
                                var idx  = scene.method("get_buildIndex").invoke();
                                console.log("[UX-Scene]   [" + i + "] name=" + name + " buildIndex=" + idx + " path=" + path);
                            } catch(_) {}
                        }
                        sendNotification("Scenes: " + sceneCount + " in build, " + loadedCount + " loaded â€” see log", false, 5);
                    } catch(e) { sendNotification("List Scenes: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Logs all loaded scenes and build-settings scene count to Frida console."
            }),
            new ButtonInfo({
                buttonText: "UX Scene 0",
                method: () => {
                    try {
                        var SceneMgr = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.SceneManagement.SceneManager");
                        SceneMgr.method("LoadScene", 1).invoke(0); 
                        sendNotification("Loading scene index 0...", false);
                    } catch(e) { sendNotification("Load Scene 0: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Loads build-index scene 0 (usually the main menu/lobby)."
            }),
            new ButtonInfo({
                buttonText: "UX Scene 1",
                method: () => {
                    try {
                        var SceneMgr = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.SceneManagement.SceneManager");
                        SceneMgr.method("LoadScene", 1).invoke(1);
                        sendNotification("Loading scene index 1...", false);
                    } catch(e) { sendNotification("Load Scene 1: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Loads build-index scene 1."
            }),
            new ButtonInfo({
                buttonText: "UX Scene 2",
                method: () => {
                    try {
                        var SceneMgr = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.SceneManagement.SceneManager");
                        SceneMgr.method("LoadScene", 1).invoke(2);
                        sendNotification("Loading scene index 2...", false);
                    } catch(e) { sendNotification("Load Scene 2: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Loads build-index scene 2."
            }),
            new ButtonInfo({
                buttonText: "UX Scene 3",
                method: () => {
                    try {
                        var SceneMgr = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.SceneManagement.SceneManager");
                        SceneMgr.method("LoadScene", 1).invoke(3);
                        sendNotification("Loading scene index 3...", false);
                    } catch(e) { sendNotification("Load Scene 3: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Loads build-index scene 3."
            }),
            new ButtonInfo({
                buttonText: "UX Scene 4",
                method: () => {
                    try {
                        var SceneMgr = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.SceneManagement.SceneManager");
                        SceneMgr.method("LoadScene", 1).invoke(4);
                        sendNotification("Loading scene index 4...", false);
                    } catch(e) { sendNotification("Load Scene 4: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Loads build-index scene 4."
            }),
            new ButtonInfo({
                buttonText: "UX Scene 5",
                method: () => {
                    try {
                        var SceneMgr = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.SceneManagement.SceneManager");
                        SceneMgr.method("LoadScene", 1).invoke(5);
                        sendNotification("Loading scene index 5...", false);
                    } catch(e) { sendNotification("Load Scene 5: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Loads build-index scene 5."
            }),
            new ButtonInfo({
                buttonText: "UX Current",
                method: () => {
                    try {
                        var SceneMgr = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.SceneManagement.SceneManager");
                        var scene = SceneMgr.method("GetActiveScene").invoke();
                        var idx = scene.method("get_buildIndex").invoke() ;
                        var name = scene.method("get_name").invoke()?.content ?? "?";
                        SceneMgr.method("LoadScene", 1).invoke(idx);
                        sendNotification("Reloading: " + name + " [" + idx + "]", false);
                    } catch(e) { sendNotification("Reload: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Reloads the currently active scene."
            }),
            new ButtonInfo({
                buttonText: "UX Scene +1",
                method: () => {
                    try {
                        var SceneMgr = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.SceneManagement.SceneManager");
                        var scene = SceneMgr.method("GetActiveScene").invoke();
                        var cur = scene.method("get_buildIndex").invoke() ;
                        var total = SceneMgr.method("get_sceneCountInBuildSettings").invoke() ;
                        var next = (cur + 1) % Math.max(total, 1);
                        SceneMgr.method("LoadScene", 1).invoke(next);
                        sendNotification("Loading scene " + next + " of " + total, false);
                    } catch(e) { sendNotification("Load +1: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Loads the next scene in build order (wraps around)."
            }),
            new ButtonInfo({
                buttonText: "UX Scene -1",
                method: () => {
                    try {
                        var SceneMgr = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.SceneManagement.SceneManager");
                        var scene = SceneMgr.method("GetActiveScene").invoke();
                        var cur = scene.method("get_buildIndex").invoke() ;
                        var total = SceneMgr.method("get_sceneCountInBuildSettings").invoke() ;
                        var prev = ((cur - 1) + Math.max(total, 1)) % Math.max(total, 1);
                        SceneMgr.method("LoadScene", 1).invoke(prev);
                        sendNotification("Loading scene " + prev + " of " + total, false);
                    } catch(e) { sendNotification("Load -1: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Loads the previous scene in build order (wraps around)."
            }),
            new ButtonInfo({
                buttonText: "UX Active Scene",
                method: () => {
                    try {
                        var SceneMgr = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.SceneManagement.SceneManager");
                        var scene = SceneMgr.method("GetActiveScene").invoke();
                        var name = scene.method("get_name").invoke()?.content ?? "?";
                        var path = scene.method("get_path").invoke()?.content ?? "?";
                        var idx  = scene.method("get_buildIndex").invoke() ;
                        var goCount = scene.method("get_rootCount").invoke() ;
                        console.log("[UX-Scene] Active: name=" + name + " index=" + idx + " rootObjects=" + goCount);
                        console.log("[UX-Scene] Path: " + path);
                        sendNotification("Scene: " + name + " [" + idx + "] roots=" + goCount, false, 6);
                    } catch(e) { sendNotification("Log Scene: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Logs the active scene name, build index, and root object count."
            }),
            new ButtonInfo({
                buttonText: "UX Obj",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        var spawnPos = player && !player.handle.isNull()
                            ? getTransform(player).method("get_position").invoke()
                            : identityQuaternion;
                        var clone = Object.method("Instantiate", 3).invoke(uxSelectedObject, spawnPos, identityQuaternion);
                        if (!clone || clone.isNull()) { sendNotification("Instantiate returned null", false); return; }
                        var cloneName = clone.method("get_name").invoke()?.content ?? "clone";
                        sendNotification("Instantiated: " + cloneName, false);
                        console.log("[UX] Instantiated: " + cloneName);
                    } catch(e) { sendNotification("Instantiate: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Instantiates a local clone of the selected object at your position."
            }),
            new ButtonInfo({
                buttonText: "UX Gun",
                isTogglable: true,
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    if (!rightGrab) return;
                    var gunData = renderGun();
                    var ray = gunData.ray;
                    if (!ray || ray.handle.isNull()) return;
                    if (rightTrigger && time > lagGunDelay) {
                        lagGunDelay = time + 0.4;
                        try {
                            var hitPoint = ray.method("get_point").invoke();
                            var clone = Object.method("Instantiate", 3).invoke(uxSelectedObject, hitPoint, identityQuaternion);
                            if (!clone || clone.isNull()) { sendNotification("Instantiate returned null", false); return; }
                            sendNotification("Spawned clone at aim point", false);
                        } catch(e) { sendNotification("Instantiate Gun: " + e, false); }
                    }
                },
                toolTip: "Hold grip + pull trigger to instantiate the selected object wherever you aim."
            }),
            new ButtonInfo({
                buttonText: "UX x5",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        var base = player && !player.handle.isNull()
                            ? getTransform(player).method("get_position").invoke()
                            : zeroVector;
                        var count = 0;
                        for (var i = 0; i < 5; i++) {
                            try {
                                var offset = [
                                    (base.field("x").value ) + (Math.random() - 0.5) * 4,
                                    (base.field("y").value ),
                                    (base.field("z").value ) + (Math.random() - 0.5) * 4,
                                ];
                                var clone = Object.method("Instantiate", 3).invoke(uxSelectedObject, offset, identityQuaternion);
                                if (clone && !clone.isNull()) count++;
                            } catch(_) {}
                        }
                        sendNotification("Cloned x" + count + " around you", false);
                    } catch(e) { sendNotification("Clone x5: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Instantiates 5 copies of the selected object scattered around you."
            }),
            new ButtonInfo({
                buttonText: "UX Obj",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var name = uxSelectedName;
                        var despawned = false;
                        try {
                            var gbo = uxSelectedObject.method("GetComponent", 1).inflate(GBOClass).invoke();
                            if (gbo && !gbo.isNull()) {
                                var netObj = gbo.method("get_Object").invoke();
                                if (netObj && !netObj.isNull()) {
                                    var runner = SFXManager.field("_instance").value.method("get__currentRunner").invoke();
                                    runner.method("Despawn").invoke(netObj);
                                    despawned = true;
                                }
                            }
                        } catch(_) {}
                        if (!despawned) { Object.method("Destroy", 1).invoke(uxSelectedObject); }
                        uxSelectedObject = null;
                        uxSelectedName = "none";
                        sendNotification("Destroyed: " + name, false);
                    } catch(e) { sendNotification("Destroy: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Destroys the selected object (networked despawn if possible, else local Destroy)."
            }),
            new ButtonInfo({
                buttonText: "UX AudioSources",
                method: () => {
                    try {
                        var AuSrc = Il2Cpp.domain.assembly("UnityEngine.AudioModule").image.class("UnityEngine.AudioSource");
                        var sources = Object.method("FindObjectsByType", 1).inflate(AuSrc).invoke(0);
                        console.log("[UX-SFX] AudioSources in scene: " + sources.length);
                        for (var i = 0; i < Math.min(sources.length, 30); i++) {
                            try {
                                var src = sources.get(i);
                                if (!src || src.isNull()) continue;
                                var goName = src.method("get_gameObject").invoke().method("get_name").invoke()?.content ?? "?";
                                var clipName = "none";
                                try {
                                    var clip = src.method("get_clip").invoke();
                                    if (clip && !clip.isNull()) clipName = clip.method("get_name").invoke()?.content ?? "?";
                                } catch(_) {}
                                var playing = src.method("get_isPlaying").invoke();
                                var vol = (src.method("get_volume").invoke() ).toFixed(2);
                                console.log("[UX-SFX]  [" + i + "] GO=" + goName + " clip=" + clipName + " playing=" + playing + " vol=" + vol);
                            } catch(_) {}
                        }
                        sendNotification("AudioSources: " + sources.length + " â€” see log", false, 5);
                    } catch(e) { sendNotification("List Audio: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Logs all AudioSource components in the scene to Frida console."
            }),
            new ButtonInfo({
                buttonText: "UX All SFX",
                isTogglable: true,
                enableMethod: () => {
                    try {
                        var AudioListener = Il2Cpp.domain.assembly("UnityEngine.AudioModule").image.class("UnityEngine.AudioListener");
                        try { AudioListener.method("set_volume").invoke(0.0); } catch(_) {}
                        var AuSrc = Il2Cpp.domain.assembly("UnityEngine.AudioModule").image.class("UnityEngine.AudioSource");
                        var sources = Object.method("FindObjectsByType", 1).inflate(AuSrc).invoke(0);
                        for (var i = 0; i < sources.length; i++) {
                            try { sources.get(i).method("set_volume").invoke(0.0); } catch(_) {}
                        }
                        sendNotification("All SFX muted", false);
                    } catch(e) { sendNotification("Mute SFX: " + e, false); }
                },
                disableMethod: () => {
                    try {
                        var AudioListener = Il2Cpp.domain.assembly("UnityEngine.AudioModule").image.class("UnityEngine.AudioListener");
                        try { AudioListener.method("set_volume").invoke(1.0); } catch(_) {}
                        var AuSrc = Il2Cpp.domain.assembly("UnityEngine.AudioModule").image.class("UnityEngine.AudioSource");
                        var sources = Object.method("FindObjectsByType", 1).inflate(AuSrc).invoke(0);
                        for (var i = 0; i < sources.length; i++) {
                            try { sources.get(i).method("set_volume").invoke(1.0); } catch(_) {}
                        }
                        sendNotification("All SFX unmuted", false);
                    } catch(e) { sendNotification("Unmute SFX: " + e, false); }
                },
                toolTip: "Mutes / unmutes all AudioSources in the scene."
            }),
            new ButtonInfo({
                buttonText: "UX All SFX",
                method: () => {
                    try {
                        var AuSrc = Il2Cpp.domain.assembly("UnityEngine.AudioModule").image.class("UnityEngine.AudioSource");
                        var sources = Object.method("FindObjectsByType", 1).inflate(AuSrc).invoke(0);
                        var count = 0;
                        for (var i = 0; i < sources.length; i++) {
                            try { sources.get(i).method("Stop").invoke(); count++; } catch(_) {}
                        }
                        sendNotification("Stopped " + count + " AudioSources", false);
                    } catch(e) { sendNotification("Stop SFX: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Calls Stop() on every AudioSource in the scene."
            }),
            new ButtonInfo({
                buttonText: "UX All SFX",
                method: () => {
                    try {
                        var AuSrc = Il2Cpp.domain.assembly("UnityEngine.AudioModule").image.class("UnityEngine.AudioSource");
                        var sources = Object.method("FindObjectsByType", 1).inflate(AuSrc).invoke(0);
                        var count = 0;
                        for (var i = 0; i < sources.length; i++) {
                            try { sources.get(i).method("Play").invoke(); count++; } catch(_) {}
                        }
                        sendNotification("Playing " + count + " AudioSources", false);
                    } catch(e) { sendNotification("Play SFX: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Calls Play() on every AudioSource in the scene."
            }),
            new ButtonInfo({
                buttonText: "UX Pitch 0.5x",
                method: () => {
                    try {
                        var AuSrc = Il2Cpp.domain.assembly("UnityEngine.AudioModule").image.class("UnityEngine.AudioSource");
                        var sources = Object.method("FindObjectsByType", 1).inflate(AuSrc).invoke(0);
                        var count = 0;
                        for (var i = 0; i < sources.length; i++) {
                            try { sources.get(i).method("set_pitch").invoke(0.5); count++; } catch(_) {}
                        }
                        sendNotification("Pitch â†’ 0.5x on " + count + " sources (slow-mo SFX)", false);
                    } catch(e) { sendNotification("Pitch 0.5x: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets all AudioSource pitches to 0.5 (slow-motion sound effect)."
            }),
            new ButtonInfo({
                buttonText: "UX Pitch 2x",
                method: () => {
                    try {
                        var AuSrc = Il2Cpp.domain.assembly("UnityEngine.AudioModule").image.class("UnityEngine.AudioSource");
                        var sources = Object.method("FindObjectsByType", 1).inflate(AuSrc).invoke(0);
                        var count = 0;
                        for (var i = 0; i < sources.length; i++) {
                            try { sources.get(i).method("set_pitch").invoke(2.0); count++; } catch(_) {}
                        }
                        sendNotification("Pitch â†’ 2x on " + count + " sources (chipmunk SFX)", false);
                    } catch(e) { sendNotification("Pitch 2x: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets all AudioSource pitches to 2.0 (chipmunk/fast sound)."
            }),
            new ButtonInfo({
                buttonText: "UX Pitch Reset",
                method: () => {
                    try {
                        var AuSrc = Il2Cpp.domain.assembly("UnityEngine.AudioModule").image.class("UnityEngine.AudioSource");
                        var sources = Object.method("FindObjectsByType", 1).inflate(AuSrc).invoke(0);
                        var count = 0;
                        for (var i = 0; i < sources.length; i++) {
                            try { sources.get(i).method("set_pitch").invoke(1.0); count++; } catch(_) {}
                        }
                        sendNotification("Pitch reset on " + count + " sources", false);
                    } catch(e) { sendNotification("Pitch Reset: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Resets all AudioSource pitches to 1.0 (normal)."
            }),
            new ButtonInfo({
                buttonText: "UX All 0.1",
                method: () => {
                    try {
                        var AuSrc = Il2Cpp.domain.assembly("UnityEngine.AudioModule").image.class("UnityEngine.AudioSource");
                        var sources = Object.method("FindObjectsByType", 1).inflate(AuSrc).invoke(0);
                        for (var i = 0; i < sources.length; i++) {
                            try { sources.get(i).method("set_volume").invoke(0.1); } catch(_) {}
                        }
                        sendNotification("Volume â†’ 0.1 on all sources (whisper)", false);
                    } catch(e) { sendNotification("Vol 0.1: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets all AudioSource volumes to 0.1 (nearly silent)."
            }),
            new ButtonInfo({
                buttonText: "UX All Max",
                method: () => {
                    try {
                        var AuSrc = Il2Cpp.domain.assembly("UnityEngine.AudioModule").image.class("UnityEngine.AudioSource");
                        var sources = Object.method("FindObjectsByType", 1).inflate(AuSrc).invoke(0);
                        for (var i = 0; i < sources.length; i++) {
                            try { sources.get(i).method("set_volume").invoke(1.0); } catch(_) {}
                        }
                        sendNotification("Volume â†’ 1.0 on all sources", false);
                    } catch(e) { sendNotification("Vol Max: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets all AudioSource volumes to 1.0 (maximum)."
            }),
            new ButtonInfo({
                buttonText: "UX Clip Random",
                method: () => {
                    try {
                        var AuSrc = Il2Cpp.domain.assembly("UnityEngine.AudioModule").image.class("UnityEngine.AudioSource");
                        var sources = Object.method("FindObjectsByType", 1).inflate(AuSrc).invoke(0);
                        if (!sources || sources.length === 0) { sendNotification("No AudioSources found", false); return; }
                        var donorClip = null;
                        var donorName = "?";
                        for (var i = 0; i < sources.length; i++) {
                            try {
                                var s = sources.get(i);
                                if (!s || s.isNull()) continue;
                                var clip = s.method("get_clip").invoke();
                                if (clip && !clip.isNull()) {
                                    donorClip = clip;
                                    donorName = clip.method("get_name").invoke()?.content ?? "?";
                                    break;
                                }
                            } catch(_) {}
                        }
                        if (!donorClip) { sendNotification("No AudioClip found to copy", false); return; }
                        var swapped = 0;
                        for (var i = 0; i < sources.length; i++) {
                            try {
                                var s = sources.get(i);
                                if (!s || s.isNull()) continue;
                                s.method("set_clip").invoke(donorClip);
                                s.method("Play").invoke();
                                swapped++;
                            } catch(_) {}
                        }
                        sendNotification("Swapped all to clip: " + donorName + " (" + swapped + " sources)", false);
                    } catch(e) { sendNotification("Swap Clip: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Copies the first found AudioClip onto all AudioSources and plays them."
            }),
            new ButtonInfo({
                buttonText: "UX Obj Clips",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var AuSrc = Il2Cpp.domain.assembly("UnityEngine.AudioModule").image.class("UnityEngine.AudioSource");
                        var sources = uxSelectedObject.method("GetComponentsInChildren", 0).inflate(AuSrc).invoke();
                        if (!sources || sources.isNull() || sources.length === 0) { sendNotification("No AudioSources on " + uxSelectedName, false); return; }
                        console.log("[UX-SFX] AudioSources on " + uxSelectedName + " (" + sources.length + "):");
                        for (var i = 0; i < sources.length; i++) {
                            try {
                                var s = sources.get(i);
                                if (!s || s.isNull()) continue;
                                var clipName = "none";
                                try { var c = s.method("get_clip").invoke(); if (c && !c.isNull()) clipName = c.method("get_name").invoke()?.content ?? "?"; } catch(_) {}
                                var vol = (s.method("get_volume").invoke() ).toFixed(2);
                                var pitch = (s.method("get_pitch").invoke() ).toFixed(2);
                                var loop = s.method("get_loop").invoke();
                                console.log("[UX-SFX]   [" + i + "] clip=" + clipName + " vol=" + vol + " pitch=" + pitch + " loop=" + loop);
                            } catch(_) {}
                        }
                        sendNotification(sources.length + " AudioSources logged â€” see Frida log", false, 4);
                    } catch(e) { sendNotification("Log Clips: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Logs all AudioSource clips/volume/pitch on the selected object to Frida console."
            }),
            new ButtonInfo({
                buttonText: "UX Obj SFX",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var AuSrc = Il2Cpp.domain.assembly("UnityEngine.AudioModule").image.class("UnityEngine.AudioSource");
                        var sources = uxSelectedObject.method("GetComponentsInChildren", 0).inflate(AuSrc).invoke();
                        var count = 0;
                        if (sources && !sources.isNull()) {
                            for (var i = 0; i < sources.length; i++) {
                                try { sources.get(i).method("Play").invoke(); count++; } catch(_) {}
                            }
                        }
                        sendNotification("Played " + count + " AudioSources on " + uxSelectedName, false);
                    } catch(e) { sendNotification("Play Obj SFX: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Plays all AudioSources on the selected object."
            }),
            new ButtonInfo({
                buttonText: "UX Obj SFX",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var AuSrc = Il2Cpp.domain.assembly("UnityEngine.AudioModule").image.class("UnityEngine.AudioSource");
                        var sources = uxSelectedObject.method("GetComponentsInChildren", 0).inflate(AuSrc).invoke();
                        var count = 0;
                        if (sources && !sources.isNull()) {
                            for (var i = 0; i < sources.length; i++) {
                                try {
                                    var s = sources.get(i);
                                    s.method("Stop").invoke();
                                    s.method("set_volume").invoke(0.0);
                                    count++;
                                } catch(_) {}
                            }
                        }
                        sendNotification("Muted " + count + " AudioSources on " + uxSelectedName, false);
                    } catch(e) { sendNotification("Mute Obj SFX: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Stops and mutes all AudioSources on the selected object."
            }),
            new ButtonInfo({
                buttonText: "UX Textures",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var RendClass = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.Renderer");
                        var rends = uxSelectedObject.method("GetComponentsInChildren", 0).inflate(RendClass).invoke();
                        if (!rends || rends.isNull() || rends.length === 0) { sendNotification("No renderers on " + uxSelectedName, false); return; }
                        console.log("[UX-Tex] Renderers on " + uxSelectedName + " (" + rends.length + "):");
                        for (var i = 0; i < rends.length; i++) {
                            try {
                                var r = rends.get(i);
                                if (!r || r.isNull()) continue;
                                var mat = r.method("get_material").invoke();
                                if (!mat || mat.isNull()) continue;
                                var matName = mat.method("get_name").invoke()?.content ?? "?";
                                var texName = "none";
                                try {
                                    var tex = mat.method("get_mainTexture").invoke();
                                    if (tex && !tex.isNull()) texName = tex.method("get_name").invoke()?.content ?? "?";
                                } catch(_) {}
                                var shader = mat.method("get_shader").invoke();
                                var shaderName = shader ? shader.method("get_name").invoke()?.content ?? "?" : "?";
                                console.log("[UX-Tex]   [" + i + "] mat=" + matName + " tex=" + texName + " shader=" + shaderName);
                            } catch(_) {}
                        }
                        sendNotification(rends.length + " renderers logged â€” see Frida log", false, 4);
                    } catch(e) { sendNotification("Log Textures: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Logs all renderer materials, textures, and shaders on the selected object."
            }),
            new ButtonInfo({
                buttonText: "UX Invisible",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var RendClass = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.Renderer");
                        var rends = uxSelectedObject.method("GetComponentsInChildren", 0).inflate(RendClass).invoke();
                        if (!rends || rends.isNull()) { sendNotification("No renderers", false); return; }
                        for (var i = 0; i < rends.length; i++) {
                            try { rends.get(i).method("set_enabled").invoke(false); } catch(_) {}
                        }
                        sendNotification(uxSelectedName + " â†’ invisible (renderers off)", false);
                    } catch(e) { sendNotification("Tex Invisible: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Disables all renderers on the selected object â€” makes it invisible."
            }),
            new ButtonInfo({
                buttonText: "UX Visible",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var RendClass = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.Renderer");
                        var rends = uxSelectedObject.method("GetComponentsInChildren", 0).inflate(RendClass).invoke();
                        if (!rends || rends.isNull()) { sendNotification("No renderers", false); return; }
                        for (var i = 0; i < rends.length; i++) {
                            try { rends.get(i).method("set_enabled").invoke(true); } catch(_) {}
                        }
                        sendNotification(uxSelectedName + " â†’ visible (renderers on)", false);
                    } catch(e) { sendNotification("Tex Visible: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Enables all renderers on the selected object."
            }),
            new ButtonInfo({
                buttonText: "UX Set Unlit",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var unlitShader = Shader.method("Find").invoke(Il2Cpp.string("Universal Render Pipeline/Unlit"));
                        var RendClass = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.Renderer");
                        var rends = uxSelectedObject.method("GetComponentsInChildren", 0).inflate(RendClass).invoke();
                        var count = 0;
                        if (rends && !rends.isNull()) {
                            for (var i = 0; i < rends.length; i++) {
                                try {
                                    var mat = rends.get(i).method("get_material").invoke();
                                    if (mat && !mat.isNull()) { mat.method("set_shader").invoke(unlitShader); count++; }
                                } catch(_) {}
                            }
                        }
                        sendNotification(uxSelectedName + " â†’ Unlit shader (" + count + " mats)", false);
                    } catch(e) { sendNotification("Set Unlit: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Switches all materials on the selected object to the URP Unlit shader."
            }),
            new ButtonInfo({
                buttonText: "UX Swap Black",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var RendClass = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.Renderer");
                        var rends = uxSelectedObject.method("GetComponentsInChildren", 0).inflate(RendClass).invoke();
                        var count = 0;
                        if (rends && !rends.isNull()) {
                            for (var i = 0; i < rends.length; i++) {
                                try {
                                    var mat = rends.get(i).method("get_material").invoke();
                                    if (mat && !mat.isNull()) { mat.method("set_color").invoke([0,0,0,1]); count++; }
                                } catch(_) {}
                            }
                        }
                        sendNotification(uxSelectedName + " â†’ black (" + count + " mats)", false);
                    } catch(e) { sendNotification("Tex Swap Black: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets all material colors to black on the selected object."
            }),
            new ButtonInfo({
                buttonText: "UX Swap White",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var RendClass = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.Renderer");
                        var rends = uxSelectedObject.method("GetComponentsInChildren", 0).inflate(RendClass).invoke();
                        var count = 0;
                        if (rends && !rends.isNull()) {
                            for (var i = 0; i < rends.length; i++) {
                                try {
                                    var mat = rends.get(i).method("get_material").invoke();
                                    if (mat && !mat.isNull()) { mat.method("set_color").invoke([1,1,1,1]); count++; }
                                } catch(_) {}
                            }
                        }
                        sendNotification(uxSelectedName + " â†’ white (" + count + " mats)", false);
                    } catch(e) { sendNotification("Tex Swap White: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets all material colors to white on the selected object."
            }),
            new ButtonInfo({
                buttonText: "UX Swap Yellow",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var RendClass = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.Renderer");
                        var rends = uxSelectedObject.method("GetComponentsInChildren", 0).inflate(RendClass).invoke();
                        var count = 0;
                        if (rends && !rends.isNull()) {
                            for (var i = 0; i < rends.length; i++) {
                                try {
                                    var mat = rends.get(i).method("get_material").invoke();
                                    if (mat && !mat.isNull()) { mat.method("set_color").invoke([1,0.92,0.016,1]); count++; }
                                } catch(_) {}
                            }
                        }
                        sendNotification(uxSelectedName + " â†’ yellow (" + count + " mats)", false);
                    } catch(e) { sendNotification("Tex Swap Yellow: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Sets all material colors to yellow on the selected object."
            }),
            new ButtonInfo({
                buttonText: "UX Rainbow Loop",
                isTogglable: true,
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) return;
                    if (frameCount % 8 !== 0) return;
                    try {
                        var h = (time * 0.5) % 1.0;
                        var i2 = Math.floor(h * 6);
                        var f = h * 6 - i2;
                        var q = 1 - f;
                        var r = 1, g = 1, b = 1;
                        switch (i2 % 6) {
                            case 0: r=1; g=f; b=0; break;
                            case 1: r=q; g=1; b=0; break;
                            case 2: r=0; g=1; b=f; break;
                            case 3: r=0; g=q; b=1; break;
                            case 4: r=f; g=0; b=1; break;
                            case 5: r=1; g=0; b=q; break;
                        }
                        var RendClass = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.Renderer");
                        var rends = uxSelectedObject.method("GetComponentsInChildren", 0).inflate(RendClass).invoke();
                        if (rends && !rends.isNull()) {
                            for (var i = 0; i < rends.length; i++) {
                                try {
                                    var mat = rends.get(i).method("get_material").invoke();
                                    if (mat && !mat.isNull()) mat.method("set_color").invoke([r,g,b,1]);
                                } catch(_) {}
                            }
                        }
                    } catch(_) {}
                },
                toolTip: "Continuously cycles the selected object's material color through the rainbow (toggle)."
            }),
            new ButtonInfo({
                buttonText: "UX Set Emissive",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var RendClass = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.Renderer");
                        var rends = uxSelectedObject.method("GetComponentsInChildren", 0).inflate(RendClass).invoke();
                        var count = 0;
                        if (rends && !rends.isNull()) {
                            for (var i = 0; i < rends.length; i++) {
                                try {
                                    var mat = rends.get(i).method("get_material").invoke();
                                    if (!mat || mat.isNull()) continue;
                                    try { mat.method("EnableKeyword").invoke(Il2Cpp.string("_EMISSION")); } catch(_) {}
                                    try { mat.method("SetColor").invoke(Il2Cpp.string("_EmissionColor"), [2,2,2,1]); } catch(_) {}
                                    count++;
                                } catch(_) {}
                            }
                        }
                        sendNotification(uxSelectedName + " â†’ emissive white (" + count + " mats)", false);
                    } catch(e) { sendNotification("Set Emissive: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Enables emission on all materials of the selected object (glowing white)."
            }),
            new ButtonInfo({
                buttonText: "UX Clear Tex",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var RendClass = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.Renderer");
                        var rends = uxSelectedObject.method("GetComponentsInChildren", 0).inflate(RendClass).invoke();
                        var count = 0;
                        if (rends && !rends.isNull()) {
                            for (var i = 0; i < rends.length; i++) {
                                try {
                                    var mat = rends.get(i).method("get_material").invoke();
                                    if (!mat || mat.isNull()) continue;
                                    var nullRef = Il2Cpp.reference(Il2Cpp.domain.assembly("mscorlib").image.class("System.Object").alloc());
                                    try { mat.method("set_mainTexture").invoke(nullRef); } catch(_) {}
                                    count++;
                                } catch(_) {}
                            }
                        }
                        sendNotification(uxSelectedName + " textures cleared (" + count + " mats)", false);
                    } catch(e) { sendNotification("Clear Tex: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Clears the mainTexture on all materials â€” shows flat color only."
            }),
            new ButtonInfo({
                buttonText: "UX From Near",
                method: () => {
                    if (!uxSelectedObject || uxSelectedObject.isNull()) { sendNotification("No object selected", false); return; }
                    try {
                        var player = NetPlayer.method("get_localPlayer").invoke();
                        if (!player || player.handle.isNull()) return;
                        var myPos = getTransform(player).method("get_position").invoke();
                        var RendClass = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.Renderer");
                        var allRends = Object.method("FindObjectsByType", 1).inflate(RendClass).invoke(0);
                        var donorTex = null;
                        var donorTexName = "?";
                        for (var i = 0; i < allRends.length; i++) {
                            try {
                                var r = allRends.get(i);
                                if (!r || r.isNull()) continue;
                                var go = r.method("get_gameObject").invoke();
                                if (go && !go.isNull() && go.handle.equals(uxSelectedObject.handle)) continue;
                                var dist = Vector3.method("Distance").invoke(myPos, uxGetTransform(go).method("get_position").invoke()) ;
                                if (dist > 8.0) continue;
                                var mat = r.method("get_material").invoke();
                                if (!mat || mat.isNull()) continue;
                                var tex = mat.method("get_mainTexture").invoke();
                                if (tex && !tex.isNull()) {
                                    donorTex = tex;
                                    donorTexName = tex.method("get_name").invoke()?.content ?? "?";
                                    break;
                                }
                            } catch(_) {}
                        }
                        if (!donorTex) { sendNotification("No texture found within 8m", false); return; }
                        var rends = uxSelectedObject.method("GetComponentsInChildren", 0).inflate(RendClass).invoke();
                        var count = 0;
                        if (rends && !rends.isNull()) {
                            for (var i = 0; i < rends.length; i++) {
                                try {
                                    var mat = rends.get(i).method("get_material").invoke();
                                    if (mat && !mat.isNull()) { mat.method("set_mainTexture").invoke(donorTex); count++; }
                                } catch(_) {}
                            }
                        }
                        sendNotification("Applied tex '" + donorTexName + "' to " + count + " mats on " + uxSelectedName, false);
                    } catch(e) { sendNotification("Tex From Near: " + e, false); }
                },
                isTogglable: false,
                toolTip: "Steals the texture from the nearest object within 8m and applies it to the selected object."
            }),
        ],
    ];
    var buttonMap = new Map();
    function rebuildButtonMap() {
        buttonMap = new Map();
        buttons.flat().forEach(button => { buttonMap.set(button.buttonText, button); });
    }
    rebuildButtonMap();
    function getIndex(buttonText) {
        var button = buttonMap.get(buttonText);
        if (!button) {
            rebuildButtonMap();
            button = buttonMap.get(buttonText);
        }
        return button;
    }
    var ButtonActivation = GorillaReportButton.method("OnTriggerEnter");
    ButtonActivation.implementation = function (collider) {
        var rawName = this.method("get_name").invoke().toString();
        if (rawName.length > 1 && rawName[1] == "@") {
            var matchesRef = (referenceCollider && !referenceCollider.isNull?.() && collider.handle.equals(referenceCollider.handle));
            var matchesImGui = (imguiEnabled && imguiRefCollider && !imguiRefCollider.isNull?.() && collider.handle.equals(imguiRefCollider.handle));
            if (matchesRef || matchesImGui) {
                var goName = rawName.substring(2, rawName.length - 1);
                var _time = Time.method("get_time").invoke();
                if (_time > buttonClickDelay) {
                    buttonClickDelay = _time + 0.2;
                    if (goName.indexOf("ImGuiMode_") === 0) {
                        var modeIdx = parseInt(goName.substring("ImGuiMode_".length));
                        if (!isNaN(modeIdx) && modeIdx >= 0 && modeIdx < imguiModeNames.length) {
                            imguiMode = modeIdx;
                            sendNotification("ImGui Mode: " + imguiModeNames[imguiMode], false);
                            if (imguiMode === 0) {
                                currentCategory = 0;
                                currentPage = 0;
                                if ((righthand && rightSecondary) || (!righthand && leftSecondary)) {
                                    if (menu == null) renderMenu();
                                }
                            }
                            renderImGui();
                        }
                        return;
                    }
                    if (goName === "ImGuiClose") {
                        imguiEnabled = false;
                        var imguiBtn = buttons[21]?.find((b) => b.buttonText === "ImGui Panel");
                        if (imguiBtn) imguiBtn.enabled = false;
                        destroyImGui();
                        sendNotification("ImGui Panel OFF", false);
                        reloadMenu();
                        return;
                    }
                    var button = getIndex(goName);
                    if (button) {
                        if (button.isTogglable) {
                            button.enabled = !button.enabled;
                            reloadMenu();
                            if (button.enabled) {
                                if (button.toolTip) sendNotification("[ENABLE] " + button.toolTip, false);
                                try { button.enableMethod?.(); } catch(e) { button.enabled = false; console.error(`[Toggle Enable] ${button.buttonText}:`, e); }
                            } else {
                                if (button.toolTip) sendNotification("[DISABLE] " + button.toolTip, false);
                                try { button.disableMethod?.(); } catch(e) { console.error(`[Toggle Disable] ${button.buttonText}:`, e); }
                            }
                        } else {
                            try { button.method?.(); } catch(e) { console.error(`[Button] ${button.buttonText}:`, e); }
                            reloadMenu();
                            if (button.toolTip) sendNotification(button.toolTip, false);
                        }
                    }
                }
            }
            return;
        }
        return this.method("OnTriggerEnter").invoke(collider);
    };
    function updateInput() {
        var leftDevice  = InputDevices.method("GetDeviceAtXRNode", 1).invoke(4);
        var rightDevice = InputDevices.method("GetDeviceAtXRNode", 1).invoke(5);
        var outBool = Il2Cpp.alloc(1);
        var outVec2 = Il2Cpp.alloc(8);
        function readAxis2D(device): [number, number] {
            try {
                var readUsage = (usage): [number, number] => {
                    try {
                        outVec2.writeFloat(0);
                        outVec2.add(4).writeFloat(0);
                        var ok = device.method("TryGetFeatureValue", 2).invoke(usage, outVec2);
                        if (ok) {
                            return [
                                axisDeadzone(outVec2.readFloat()),
                                axisDeadzone(outVec2.add(4).readFloat())
                            ];
                        }
                    } catch(_) {}
                    return [0, 0];
                };
                var candidates: [number, number][] = [];
                try { candidates.push(readUsage(CommonUsages.field("primary2DAxis").value)); } catch(_) {}
                try { candidates.push(readUsage(CommonUsages.field("secondary2DAxis").value)); } catch(_) {}
                try { candidates.push(readUsage(CommonUsages.field("thumbstick").value)); } catch(_) {}
                var best: [number, number] = [0, 0];
                var bestMag = 0;
                for (var candidate of candidates) {
                    var mag = Math.abs(candidate[0]) + Math.abs(candidate[1]);
                    if (mag > bestMag) {
                        best = candidate;
                        bestMag = mag;
                    }
                }
                return best;
            } catch(_) {}
            return [0, 0];
        }
        leftDevice.method("TryGetFeatureValue", 2).invoke(CommonUsages.field("primaryButton").value,    outBool); leftPrimary   = outBool.readU8() !== 0;
        leftDevice.method("TryGetFeatureValue", 2).invoke(CommonUsages.field("secondaryButton").value,  outBool); leftSecondary = outBool.readU8() !== 0;
        leftDevice.method("TryGetFeatureValue", 2).invoke(CommonUsages.field("gripButton").value,       outBool); leftGrab      = outBool.readU8() !== 0;
        leftDevice.method("TryGetFeatureValue", 2).invoke(CommonUsages.field("triggerButton").value,    outBool); leftTrigger   = outBool.readU8() !== 0;
        leftDevice.method("TryGetFeatureValue", 2).invoke(CommonUsages.field("primary2DAxisClick").value, outBool); leftStick   = outBool.readU8() !== 0;
        rightDevice.method("TryGetFeatureValue", 2).invoke(CommonUsages.field("primaryButton").value,   outBool); rightPrimary  = outBool.readU8() !== 0;
        rightDevice.method("TryGetFeatureValue", 2).invoke(CommonUsages.field("secondaryButton").value, outBool); rightSecondary = outBool.readU8() !== 0;
        rightDevice.method("TryGetFeatureValue", 2).invoke(CommonUsages.field("triggerButton").value,   outBool); rightTrigger  = outBool.readU8() !== 0;
        rightDevice.method("TryGetFeatureValue", 2).invoke(CommonUsages.field("gripButton").value,      outBool); rightGrab     = outBool.readU8() !== 0;
        rightDevice.method("TryGetFeatureValue", 2).invoke(CommonUsages.field("primary2DAxisClick").value, outBool); rightStick = outBool.readU8() !== 0;
        [leftStickX, leftStickY] = readAxis2D(leftDevice);
        [rightStickX, rightStickY] = readAxis2D(rightDevice);
    }
    var LateUpdate = null;
    var updateHookCandidates = [
        { klass, label: "PlayerController", names: ["LateUpdate", "Update"] },
        { klass, label: "GorillaLocomotion", names: ["LateUpdate", "Update"] },
        { klass, label: "NetPlayer", names: ["LateUpdate", "Update"] },
        { klass, label: "PlayerController", names: ["FixedUpdate", "OnUpdate", "Tick", "PlayerUpdate", "LocomotionUpdate"] },
        { klass, label: "GorillaLocomotion", names: ["FixedUpdate", "OnUpdate", "Tick", "PlayerUpdate", "LocomotionUpdate"] },
        { klass, label: "NetPlayer", names: ["FixedUpdate", "OnUpdate", "Tick", "PlayerUpdate", "LocomotionUpdate"] }
    ];
    for (var candidate of updateHookCandidates) {
        for (var name of candidate.names) {
            try {
                LateUpdate = candidate.klass.method(name);
                console.log("[hook] Found update method: " + candidate.label + "." + name);
                break;
            } catch(_) {}
        }
        if (LateUpdate) break;
    }
    if (!LateUpdate) {
        console.error("[hook] No update method found anywhere, menu will not tick");
    }
    if (LateUpdate) LateUpdate.implementation = function () {
        try {
        if (!refreshRuntimeRefs()) {
            runtimeRefMissCount++;
            if (runtimeRefMissCount === 1 || runtimeRefMissCount % 120 === 0) {
                console.warn("[LateUpdate] Runtime refs unavailable; keeping cached state and skipping this frame");
            }
            return LateUpdate.invoke();
        }
        runtimeRefMissCount = 0;
        deltaTime = Time.method("get_deltaTime").invoke();
        time      = Time.method("get_time").invoke();
        menuAnimTime += deltaTime;
        if (themeMode === 0) {
            var pulse = (Math.sin(menuAnimTime * 2.5) * 0.5 + 0.5) * 0.12;
            bgColor     = [0.02, 0.05 + pulse * 0.3, 0.25 + pulse, 0.85];
            buttonColor = [0.10 + pulse * 0.4, 0.18 + pulse * 0.6, 0.55 + pulse, 0.85];
            textColor   = [0.80, 0.88 + pulse * 0.4, 1.0, 1.0];
        } else if (themeMode === 1) {
            var h = (menuAnimTime * 0.25) % 1.0;
            var rr = Math.abs(Math.sin(h * Math.PI * 2)) ;
            var rg = Math.abs(Math.sin((h + 0.333) * Math.PI * 2));
            var rb2 = Math.abs(Math.sin((h + 0.666) * Math.PI * 2));
            var pulse = (Math.sin(menuAnimTime * 3.0) * 0.5 + 0.5) * 0.06;
            bgColor            = [rr * 0.18 + pulse * 0.03, rg * 0.18 + pulse * 0.03, rb2 * 0.18 + pulse * 0.03, 0.92];
            buttonColor        = [rr * 0.55 + pulse, rg * 0.55 + pulse, rb2 * 0.55 + pulse, 0.88];
            buttonPressedColor = [rr, rg, rb2, 1.0];
            textColor          = [0.95, 0.95, 0.95, 1.0];
        } else if (themeMode === 2) {
            var pulse2 = (Math.sin(menuAnimTime * 3.0) * 0.5 + 0.5) * 0.2;
            bgColor     = [0.0, 0.05 + pulse2 * 0.2, 0.0, 0.85];
            buttonColor = [0.0, 0.25 + pulse2, 0.0, 0.85];
            textColor   = [0.2, 1.0, 0.2, 1.0];
        } else if (themeMode === 3) {
            var pulse3 = (Math.sin(menuAnimTime * 2.0) * 0.5 + 0.5) * 0.15;
            bgColor     = [0.15 + pulse3, 0.0, 0.0, 0.85];
            buttonColor = [0.4 + pulse3, 0.0, 0.0, 0.85];
            textColor   = [1.0, 0.3, 0.3, 1.0];
        } else if (themeMode === 4) {
            var pulse4 = (Math.sin(menuAnimTime * 2.0) * 0.5 + 0.5) * 0.1;
            bgColor            = [0.22 + pulse4 * 0.35, 0.08 + pulse4 * 0.18, 0.0, 0.9];
            buttonColor        = [0.90 + pulse4 * 0.5, 0.35 + pulse4 * 0.35, 0.0, 0.92];
            buttonPressedColor = [1.0, 0.60 + pulse4 * 0.25, 0.08, 1.0];
            textColor          = [1.0, 0.90, 0.72, 1.0];
        } else if (themeMode === 5) {
            var pulse5 = (Math.sin(menuAnimTime * 3.4) * 0.5 + 0.5) * 0.18;
            bgColor            = [0.02, 0.12 + pulse5 * 0.18, 0.0, 0.9];
            buttonColor        = [0.28 + pulse5 * 0.35, 0.92, 0.02 + pulse5 * 0.14, 0.94];
            buttonPressedColor = [0.74, 1.0, 0.18, 1.0];
            textColor          = [0.95, 1.0, 0.78, 1.0];
        } else if (themeMode === 6) {
            var pulse6 = (Math.sin(menuAnimTime * 2.8) * 0.5 + 0.5) * 0.18;
            bgColor            = [0.24 + pulse6 * 0.16, 0.04, 0.12 + pulse6 * 0.08, 0.9];
            buttonColor        = [1.0, 0.28 + pulse6 * 0.18, 0.52 + pulse6 * 0.18, 0.92];
            buttonPressedColor = [1.0, 0.62, 0.26, 1.0];
            textColor          = [1.0, 0.92, 0.86, 1.0];
        } else if (themeMode === 7) {
            var pulse7 = (Math.sin(menuAnimTime * 3.1) * 0.5 + 0.5) * 0.16;
            bgColor            = [0.0, 0.10 + pulse7 * 0.08, 0.16 + pulse7 * 0.18, 0.9];
            buttonColor        = [0.12 + pulse7 * 0.12, 0.74 + pulse7 * 0.2, 1.0, 0.92];
            buttonPressedColor = [0.72, 0.94, 1.0, 1.0];
            textColor          = [0.90, 0.99, 1.0, 1.0];
        } else if (themeMode === 8) {
            var pulse8 = (Math.sin(menuAnimTime * 2.1) * 0.5 + 0.5) * 0.12;
            bgColor            = [0.02 + pulse8 * 0.04, 0.02 + pulse8 * 0.04, 0.02 + pulse8 * 0.02, 0.95];
            buttonColor        = [0.66 + pulse8 * 0.28, 0.48 + pulse8 * 0.22, 0.12, 0.94];
            buttonPressedColor = [1.0, 0.86, 0.28, 1.0];
            textColor          = [1.0, 0.94, 0.74, 1.0];
        } else if (themeMode === 9) {
            var pulse9 = (Math.sin(menuAnimTime * 3.6) * 0.5 + 0.5) * 0.18;
            bgColor            = [0.10 + pulse9 * 0.08, 0.0, 0.16 + pulse9 * 0.1, 0.9];
            buttonColor        = [0.74 + pulse9 * 0.18, 0.22 + pulse9 * 0.12, 1.0, 0.94];
            buttonPressedColor = [0.94, 0.56, 1.0, 1.0];
            textColor          = [0.98, 0.92, 1.0, 1.0];
        } else if (themeMode === 10) {
            bgColor            = [0.01, 0.01, 0.01, 0.96];
            buttonColor        = [0.32, 0.32, 0.32, 0.96];
            buttonPressedColor = [0.56, 0.56, 0.56, 1.0];
            textColor          = [1.0, 0.52, 0.06, 1.0];
        } else if (themeMode === 11) {
            bgColor            = [0.055, 0.0, 0.006, 0.98];
            buttonColor        = [0.115, 0.01, 0.012, 0.98];
            buttonPressedColor = [0.36, 0.025, 0.035, 1.0];
            textColor          = [1.0, 0.82, 0.72, 1.0];
        }
        updateLiveMenuThemeVisuals();
        runAdminLeaderboardOrbit();
        runAdminLeaderboardMultiOrbit();
        for (var i = lockedItems.length - 1; i >= 0; i--) {
            try {
                var li = lockedItems[i];
                if (!li || li.isNull()) { lockedItems.splice(i, 1); continue; }
                getTransform(li).method("set_position").invoke(li._lockedPos);
            } catch(_) { lockedItems.splice(i, 1); }
        }
        for (var i = spawnedGoopObjects.length - 1; i >= 0; i--) {
            try {
                var entry = spawnedGoopObjects[i];
                if (!entry || !entry.object || entry.object.isNull?.() || time >= entry.expireAt) {
                    try {
                        if (entry?.object && !entry.object.isNull?.()) {
                            var go = entry.object;
                            try {
                                var maybeGo = entry.object.method("get_gameObject").invoke();
                                if (maybeGo && !maybeGo.isNull?.()) go = maybeGo;
                            } catch(_) {}
                            Destroy(go);
                        }
                    } catch(_) {}
                    spawnedGoopObjects.splice(i, 1);
                }
            } catch(_) {
                spawnedGoopObjects.splice(i, 1);
            }
        }
        for (var i = spazMachineEntries.length - 1; i >= 0; i--) {
            try {
                var entry = spazMachineEntries[i];
                if (!entry || !entry.object || entry.object.isNull?.()) {
                    spazMachineEntries.splice(i, 1);
                    continue;
                }
                if (time >= entry.expireAt) {
                    try {
                        var pos = getTransform(entry.object).method("get_position").invoke();
                        playSelectedVfxAt(pos);
                    } catch(_) {}
                    try {
                        var runner = entry.object.method("get_Runner").invoke();
                        if (runner && !runner.isNull?.()) runner.method("Despawn").invoke(entry.object);
                    } catch(_) {}
                    try {
                        var go = entry.object;
                        try {
                            var maybeGo = entry.object.method("get_gameObject").invoke();
                            if (maybeGo && !maybeGo.isNull?.()) go = maybeGo;
                        } catch(_) {}
                        Destroy(go);
                    } catch(_) {}
                    spazMachineEntries.splice(i, 1);
                }
            } catch(_) {
                spazMachineEntries.splice(i, 1);
            }
        }
        for (var i = itemTornadoEntries.length - 1; i >= 0; i--) {
            try {
                var entry = itemTornadoEntries[i];
                if (!entry || !entry.object || entry.object.isNull?.()) itemTornadoEntries.splice(i, 1);
            } catch(_) {
                itemTornadoEntries.splice(i, 1);
            }
        }
        cleanupDeadTrackedObjects(spawnedNetworkPrefabs);
        cleanupDeadTrackedObjects(spawnedPersistentMobs);
        if (mobForceStayEnabled) {
            for (var mob of spawnedPersistentMobs) {
                try {
                    stabilizeMobInstance(mob);
                } catch(_) {}
            }
            for (var entry of persistentMobEntries) {
                try {
                    if (!entry) continue;
                    var obj = entry.object;
                    var alive = false;
                    try {
                        if (obj && !obj.isNull?.()) {
                            var go = obj.method("get_gameObject").invoke();
                            alive = !!go && !go.isNull?.();
                            if (alive) {
                                try { go.method("SetActive").invoke(true); } catch(_) {}
                                continue;
                            }
                        }
                    } catch(_) {}
                    if (!alive && time > ((entry.lastRespawnTime ?? 0) + 1.0)) {
                        entry.lastRespawnTime = time;
                        var respawned = null;
                        try {
                            if (!mobSpawnAsyncBroken) {
                                respawned = PrefabGen.method("SpawnMobAsyncInternal", 6).invoke(
                                    entry.mobEntry.id, entry.pos, entry.rot, NULL, NULL, Il2Cpp.string("menu")
                                );
                            }
                        } catch(_) {
                            mobSpawnAsyncBroken = true;
                        }
                        if ((!respawned || respawned.isNull?.()) && entry.mobEntry?.name) {
                            try {
                                var fallbackNames = [
                                    entry.mobEntry.name,
                                    "Mob" + entry.mobEntry.name,
                                    entry.mobEntry.name + "Mob",
                                    entry.mobEntry.name + "Controller"
                                ];
                                for (var prefabName of fallbackNames) {
                                    respawned = spawnNetworkPrefab(prefabName, entry.pos, entry.rot);
                                    if (respawned && !respawned.isNull?.()) break;
                                }
                            } catch(_) {}
                        }
                        if (respawned && !respawned.isNull?.()) {
                            stabilizeMobInstance(respawned, entry.pos);
                            entry.object = respawned;
                            spawnedPersistentMobs.push(respawned);
                        }
                    }
                } catch(_) {}
            }
        }
        updateInput();
        frameCount++;
        if (forceDevModeEnabled) tryForceDeveloperMode();
        if (forceAllStashSlotsEnabled) forceGrantAllStashSlots();
        if (containerFreedomAuraEnabled) applyContainerFreedomSweep();
        if ((righthand && rightSecondary) || (!righthand && leftSecondary)) {
            if (currentNotification != "" && time > notifactionResetTime) reloadMenu();
            if (menu == null) renderMenu();
            else recenterMenu();
        } else {
            if (menu != null) { Destroy(menu); menu = null; }
        }
        if (menu == null) {
            if (reference != null) { Destroy(reference); reference = null; }
        } else {
            if (reference == null) renderReference();
        }
        if (imguiEnabled) {
            if (imguiObj == null || imguiObj.isNull?.()) renderImGui();
            else recenterImGui();
        } else {
            if (imguiObj != null) destroyImGui();
        }
        try {
            if (GunPointer != null) {
                if (!GunPointer.method("get_activeSelf").invoke()) { Destroy(GunPointer); GunPointer = null; }
                else GunPointer.method("SetActive").invoke(false);
            }
            var lineObj = GunLine.method("get_gameObject").invoke();
            if (lineObj != null) {
                if (!lineObj.method("get_activeSelf").invoke()) { Destroy(lineObj); GunLine = null; }
                else lineObj.method("SetActive").invoke(false);
            }
        } catch { }
        buttons.flat().filter(b => b.enabled).forEach(b => {
            if (b.method) {
                try {
                    b.method();
                    (b ).__failCount = 0;
                    (b ).__nextErrorLogTime = 0;
                }
                catch (e) {
                    logButtonRuntimeError(b, e);
                }
            }
        });
        prevLeftGrab = leftGrab;
        prevRightGrab = rightGrab;
        return LateUpdate.invoke();
        } catch(e) {
            try { return LateUpdate.invoke(); } catch(_) {}
        }
    };
    function installLogcat() {
        try {
            var PCClass2 = AssemblyCSharp.class("AnimalCompany.PlayerController");
            var playerDieMethod = PCClass2.method("PlayerDie");
            playerDieMethod.implementation = function(killSound, hitName, fromKillTrigger) {
                try { console.log("[LOGCAT] PlayerDie hitName=" + (hitName?.content ?? "?")); } catch(_) {}
                return invokeInstance(playerDieMethod, this, killSound, hitName, fromKillTrigger);
            };
        } catch(e) { console.error("[LOGCAT] PlayerDie:", e); }
        console.log("[LOGCAT] installed");
    }
    installLogcat();
    function quiverHook() {
        var _inAddToBagAck = false;
        try { GBIClass.method("get_canAddToBag").implementation          = function() { return true; }; } catch(e) {}
        try { GBIClass.method("get_allowAddToBag").implementation        = function() { return true; }; } catch(e) {}
        try { GBIClass.method("get_allowAttachToItem").implementation    = function() { return true; }; } catch(e) {}
        try { GBIClass.method("get_allowAddToQuiver").implementation     = function() { return true; }; } catch(e) {}
        try { GBIClass.method("CanBeAddedToContainer").implementation    = function(_) { return true; }; } catch(_) {}
        try { GBIClass.method("get_isContainable").implementation        = function() { return true; }; } catch(_) {}
        try { GBIClass.method("get_canBePickedUp").implementation        = function() { return true; }; } catch(_) {}
        try {
            var GISClass = AssemblyCSharp.class("AnimalCompany.GameplayItemState");
            function _isBagLike(self) {
                try {
                    var idObj = self.method("get_id").invoke();
                    if (!idObj || idObj.isNull()) return false;
                    var id = idObj.content ?? "";
                    return (
                        id.indexOf("stash")            !== -1 ||
                        id.indexOf("quiver")           !== -1 ||
                        id.indexOf("crossbow")         !== -1 ||
                        id.indexOf("heart_gun")        !== -1 ||
                        id.indexOf("grenade_launcher") !== -1 ||
                        id.indexOf("salmoncannon")     !== -1 ||
                        id.indexOf("salmon_cannon")    !== -1
                    );
                } catch(_) { return false; }
            }
            try {
                var _isBagOrig = GISClass.method("get_isBag");
                GISClass.method("get_isBag").implementation = function() {
                    if (_isBagLike(this)) return true;
                    return invokeInstance(_isBagOrig, this);
                };
            } catch(_) {}
            try {
                var _baseCapOrig = GISClass.method("get_baseCapacity");
                GISClass.method("get_baseCapacity").implementation = function() {
                    if (_isBagLike(this)) {
                        try {
                            var sp = invokeInstance(_baseCapOrig, this);
                            if (sp && !sp.isNull()) {
                                try { sp.field("_value").value = 9999; } catch(_) {}
                                try { sp.field("value").value  = 9999; } catch(_) {}
                            }
                            return sp;
                        } catch(_) {}
                    }
                    return invokeInstance(_baseCapOrig, this);
                };
            } catch(_) {}
            try {
                var _totCapOrig = GISClass.method("get_totalCurrCapacity");
                GISClass.method("get_totalCurrCapacity").implementation = function() {
                    if (_isBagLike(this)) return 9999;
                    return invokeInstance(_totCapOrig, this);
                };
            } catch(_) {}
            try { GISClass.method("get_allowAddToQuiver").implementation  = function() { return true; }; } catch(_) {}
            try { GISClass.method("get_allowAddToBag").implementation     = function() { return true; }; } catch(_) {}
            try { GISClass.method("get_allowAttachToItem").implementation = function() { return true; }; } catch(_) {}
            try { GISClass.method("get_allowAttachToBack").implementation = function() { return true; }; } catch(_) {}
            try { GISClass.method("get_allowAttachToHip").implementation  = function() { return true; }; } catch(_) {}
            try { GISClass.method("get_isBackpack").implementation        = function() { return true; }; } catch(_) {}
            try { GISClass.method("get_containerCapacity").implementation    = function() { return 9999; }; } catch(_) {}
            try { GISClass.method("get_maxContainerCapacity").implementation = function() { return 9999; }; } catch(_) {}
        } catch(_) {}
        try { BackpackItemClass.method("CheckToAddItem").implementation = function(_) { return true; }; } catch(e) { console.error("[quiverHook] BackpackItem.CheckToAddItem:", e); }
        try { BackpackItemClass.method("get_capacity").implementation      = function() { return 9999; }; } catch(e) {}
        try { BackpackItemClass.method("set_capacity").implementation      = function(_v) {};        } catch(e) {}
        try { BackpackItemClass.method("get_isFull").implementation        = function() { return false; }; } catch(e) {}
        try { BackpackItemClass.method("get_baseCapacity").implementation  = function() { return 9999; }; } catch(_) {}
        try {
            var backpackHandleAddItemTrigger = tryMethodName(BackpackItemClass, ["HandleAddItemTrigger"]);
            if (backpackHandleAddItemTrigger) backpackHandleAddItemTrigger.implementation = function(collider) {
                try { this.method("set_isOpen").invoke(true); } catch(_) {}
                return invokeInstance(backpackHandleAddItemTrigger, this, collider);
            };
        } catch(_) {}
        try {
            var backpackCheckToEmptyItem = tryMethodName(BackpackItemClass, ["CheckToEmptyItem"]);
            if (backpackCheckToEmptyItem) backpackCheckToEmptyItem.implementation = function() {
                return invokeInstance(backpackCheckToEmptyItem, this);
            };
        } catch(_) {}
        try {
            var backpackAddToBagAck = tryMethodName(BackpackItemClass, ["AddToBagAck"]);
            if (backpackAddToBagAck) backpackAddToBagAck.implementation = function(obj) {
                if (_inAddToBagAck) return true;
                _inAddToBagAck = true;
                try {
                    try { this.field("_capacity").value = 9999; } catch(_) {}
                    try { this.field("capacity").value  = 9999; } catch(_) {}
                    try { this.method("set_capacity").invoke(255); } catch(_) {}
                    try { this.method("set_isOpen").invoke(true); } catch(_) {}
                    return invokeInstance(backpackAddToBagAck, this, obj);
                } catch(_) { return true; } finally { _inAddToBagAck = false; }
            };
        } catch(_) {}
        try {
            QuiverClass.method("CheckToAddItem").implementation = function(item) {
                try {
                    var asQuiver = item.method("GetComponent", 1).inflate(QuiverClass).invoke();
                    if (asQuiver && !asQuiver.isNull()) return false;
                } catch(_) {}
                return true;
            };
        } catch(e) { console.error("[quiverHook] Quiver.CheckToAddItem:", e); }
        try { QuiverClass.method("CanAddItem").implementation     = function(item) {
            try {
                var asQuiver = item.method("GetComponent", 1).inflate(QuiverClass).invoke();
                if (asQuiver && !asQuiver.isNull()) return false;
            } catch(_) {}
            return true;
        }; } catch(_) {}
        try { QuiverClass.method("get_capacity").implementation            = function() { return 9999; }; } catch(e) {}
        try { QuiverClass.method("get_isFull").implementation              = function() { return false; }; } catch(_) {}
        try { QuiverClass.method("get_baseCapacity").implementation        = function() { return 9999; }; } catch(_) {}
        try {
            var quiverAddToBagAck = tryMethodName(QuiverClass, ["AddToBagAck"]);
            if (quiverAddToBagAck) quiverAddToBagAck.implementation = function(obj) {
                if (_inAddToBagAck) return true;
                _inAddToBagAck = true;
                try {
                    try { this.field("_capacity").value = 9999; } catch(_) {}
                    try { this.field("capacity").value  = 9999; } catch(_) {}
                    try { this.method("set_capacity").invoke(255); } catch(_) {}
                    return invokeInstance(quiverAddToBagAck, this, obj);
                } catch(_) { return true; } finally { _inAddToBagAck = false; }
            };
        } catch(_) {}
        try { QuiverClass.method("HandleTryToDrop").implementation = function(_) { return true; }; } catch(e) { console.error("[quiverHook] Quiver.HandleTryToDrop:", e); }
        if (CrossbowClass) {
            try { CrossbowClass.method("CheckToAddItem").implementation = function(_) { return true; }; } catch(_) {}
            try { CrossbowClass.method("CanAddItem").implementation     = function(_) { return true; }; } catch(_) {}
            try { CrossbowClass.method("get_allowAddToBag").implementation = function() { return true; }; } catch(_) {}
            try { CrossbowClass.method("get_allowAddToQuiver").implementation = function() { return true; }; } catch(_) {}
            try { CrossbowClass.method("get_allowAttachToItem").implementation = function() { return true; }; } catch(_) {}
            try { CrossbowClass.method("get_allowAttachToBack").implementation = function() { return true; }; } catch(_) {}
            try { CrossbowClass.method("get_allowAttachToHip").implementation = function() { return true; }; } catch(_) {}
            try { CrossbowClass.method("get_isBackpack").implementation = function() { return true; }; } catch(_) {}
            try { CrossbowClass.method("get_capacity").implementation      = function() { return 9999; }; } catch(_) {}
            try { CrossbowClass.method("get_baseCapacity").implementation  = function() { return 9999; }; } catch(_) {}
            try { CrossbowClass.method("get_isFull").implementation        = function() { return false; }; } catch(_) {}
            try {
                var crossbowAddToBagAck = tryMethodName(CrossbowClass, ["AddToBagAck"]);
                if (crossbowAddToBagAck) crossbowAddToBagAck.implementation = function(obj) {
                    if (_inAddToBagAck) return true;
                    _inAddToBagAck = true;
                    try {
                        try { this.field("_capacity").value = 9999; } catch(_) {}
                        try { this.method("set_capacity").invoke(255); } catch(_) {}
                        return invokeInstance(crossbowAddToBagAck, this, obj);
                    } catch(_) { return true; } finally { _inAddToBagAck = false; }
                };
            } catch(_) {}
        }
        if (HeartGunClass) {
            try { HeartGunClass.method("CheckToAddItem").implementation = function(_) { return true; }; } catch(_) {}
            try { HeartGunClass.method("CanAddItem").implementation     = function(_) { return true; }; } catch(_) {}
            try { HeartGunClass.method("get_capacity").implementation      = function() { return 9999; }; } catch(_) {}
            try { HeartGunClass.method("get_baseCapacity").implementation  = function() { return 9999; }; } catch(_) {}
            try { HeartGunClass.method("get_isFull").implementation        = function() { return false; }; } catch(_) {}
            try { HeartGunClass.method("get_isBackpack").implementation    = function() { return true; }; } catch(_) {}
            try {
                var heartGunAddToBagAck = tryMethodName(HeartGunClass, ["AddToBagAck"]);
                if (heartGunAddToBagAck) heartGunAddToBagAck.implementation = function(obj) {
                    if (_inAddToBagAck) return true;
                    _inAddToBagAck = true;
                    try {
                        try { this.field("_capacity").value = 9999; } catch(_) {}
                        try { this.method("set_capacity").invoke(255); } catch(_) {}
                        return invokeInstance(heartGunAddToBagAck, this, obj);
                    } catch(_) { return true; } finally { _inAddToBagAck = false; }
                };
            } catch(_) {}
        }
        if (GrenadeLauncherClass) {
            try { GrenadeLauncherClass.method("CheckToAddItem").implementation = function(_) { return true; }; } catch(_) {}
            try { GrenadeLauncherClass.method("get_capacity").implementation      = function() { return 9999; }; } catch(_) {}
            try { GrenadeLauncherClass.method("set_capacity").implementation      = function(_v) {}; } catch(_) {}
            try { GrenadeLauncherClass.method("get_cappedCapacity").implementation = function() { return 9999; }; } catch(_) {}
        }
        console.log("[quiverHook] v5 â€” bags openable, grenade/salmon , no quiver-in-quiver");
    }
    quiverHook();
   function ArenaItemKilla() {
   var MyHook = AssemblyCSharp.class("AnimalCompany.ArenaItemKiller").method("DespawnIfNecessary");
   MyHook.implementation = function () { return; };
}
var infflareammo = AssemblyCSharp.class("AnimalCompany.FlareGun").method("get_hasAmmo");
infflareammo.implementation = function () {
    if (InfAmmo || rapidFireEnabled) return true;
    return invokeInstance(infflareammo, this);
};
var infrevolverammo = AssemblyCSharp.class("AnimalCompany.Revolver").method("get_ammoLoaded");
infrevolverammo.implementation = function () {
    if (InfAmmo || rapidFireEnabled) return 255;
    return invokeInstance(infrevolverammo, this);
};
var infrevolverammo2 = AssemblyCSharp.class("AnimalCompany.Revolver").method("get_isHammerCocked");
infrevolverammo2.implementation = function () {
    if (InfAmmo || rapidFireEnabled) return true;
    return invokeInstance(infrevolverammo2, this);
};
var ziplineinfammo = AssemblyCSharp.class("AnimalCompany.ZiplineGun").method("get_isLoaded");
ziplineinfammo.implementation = function () {
    if (InfAmmo || rapidFireEnabled) return true;
    return invokeInstance(ziplineinfammo, this);
};
var shotguninfammo = AssemblyCSharp.class("AnimalCompany.Shotgun").method("get__ammoLeft");
shotguninfammo.implementation = function () {
    if (InfAmmo || rapidFireEnabled) return 255;
    return invokeInstance(shotguninfammo, this);
};
var rpginfammo = AssemblyCSharp.class("AnimalCompany.RPG").method("get_loadedState");
rpginfammo.implementation = function () {
    var state = invokeInstance(rpginfammo, this);
    if (InfAmmo || rapidFireEnabled) {
        state.field("isLoaded").value = true;
        try { this.method("set_loadedState").invoke(state); } catch(_) {}
    }
    return state;
};
var arenagunsinfammo = AssemblyCSharp.class("AnimalCompany.AutoReloadGun").method("get__ammoLeft");
arenagunsinfammo.implementation = function () {
    if (InfAmmo || rapidFireEnabled) return 255;
    return invokeInstance(arenagunsinfammo, this);
};
    var InfJetpack = AssemblyCSharp.class("AnimalCompany.JetpackHandy").method("RPC_UseJetpack");
    InfJetpack.implementation = function() {
      if (InfAmmo) {
        invokeInstance(InfJetpack, this);
        this.field("_isUsed").value = false;
      } else {
        return invokeInstance(InfJetpack, this);
      }
    };
var EjectItem = AssemblyCSharp.class("AnimalCompany.StashMachine.StashMachineTrashChuteView").method("EjectItem");
EjectItem.implementation = function(item) {
    if (stashDupeEnabled) {
        for (var i = 0; i < ejectDupeAmount; i++) {
            invokeInstance(EjectItem, this, item);
        }
    } else {
        return invokeInstance(EjectItem, this, item);
    }
};
try {
    var GunClass = AssemblyCSharp.class("AnimalCompany.Gun");
    var gunShootHook = GunClass.method("Shoot");
    gunShootHook.implementation = function() {
        if (noRecoil || infDamage) {
            try {
                var cfg = this.method("get_config").invoke();
                if (cfg && !cfg.isNull()) {
                    var origRecoil     = cfg.field("recoilForceMag").value ;
                    var origHandRecoil = cfg.field("handRecoilForceMag").value ;
                    var origSpread     = cfg.field("shotSpread").value ;
                    var origDmg | null = null;
                    if (noRecoil) {
                        cfg.field("recoilForceMag").value     = 0.0;
                        cfg.field("handRecoilForceMag").value = 0.0;
                        cfg.field("shotSpread").value         = 0.0;
                    }
                    if (infDamage) {
                        try { origDmg = cfg.field("damage").value ; cfg.field("damage").value = 99.0; } catch(_) {}
                        try { cfg.field("bulletDamage").value = 2147483648.0; } catch(_) {}
                        try { cfg.field("damagePerBullet").value = 2147483648.0; } catch(_) {}
                        try { cfg.field("hitDamage").value = 2147483648.0; } catch(_) {}
                    }
                    var result = invokeInstance(gunShootHook, this);
                    if (noRecoil) {
                        cfg.field("recoilForceMag").value     = origRecoil;
                        cfg.field("handRecoilForceMag").value = origHandRecoil;
                        cfg.field("shotSpread").value         = origSpread;
                    }
                    if (infDamage) {
                        try { if (origDmg !== null) cfg.field("damage").value = origDmg; } catch(_) {}
                        try { cfg.field("bulletDamage").value = 1.0; } catch(_) {}
                        try { cfg.field("damagePerBullet").value = 1.0; } catch(_) {}
                        try { cfg.field("hitDamage").value = 1.0; } catch(_) {}
                    }
                    if (arenaAimbotEnabled) {
                        try {
                            var target = findArenaAimbotTarget();
                            if (target && !target.isNull?.()) {
                                var hitPos = getTransform(target).method("get_position").invoke();
                                var dmgNull = DamageSourceInfoClass.method("get_Null").invoke();
                                target.method("RPC_PlayerHit", 3).invoke(infDamage ? 999999 : 50, hitPos, dmgNull);
                            }
                        } catch(e) { console.error("[Arena Aimbot]", e); }
                    }
                    return result;
                }
            } catch(_) {}
        }
        if (arenaAimbotEnabled) {
            try {
                var result = invokeInstance(gunShootHook, this);
                var target = findArenaAimbotTarget();
                if (target && !target.isNull?.()) {
                    var hitPos = getTransform(target).method("get_position").invoke();
                    var dmgNull = DamageSourceInfoClass.method("get_Null").invoke();
                    target.method("RPC_PlayerHit", 3).invoke(50, hitPos, dmgNull);
                }
                return result;
            } catch(e) { console.error("[Arena Aimbot]", e); }
        }
        return invokeInstance(gunShootHook, this);
    };
} catch(e) { console.error("[Gun.Shoot hook failed]:", e); }
try {
    var gbiHandleHit = GBIClass.method("HandleHit");
    gbiHandleHit.implementation = function(other, velocity) {
        if (infDamage) {
            try {
                var origDmg = this.field("_hitDamage").value ;
                this.field("_hitDamage").value = 999999.0;
                var result = invokeInstance(gbiHandleHit, this, other, velocity);
                this.field("_hitDamage").value = origDmg;
                return result;
            } catch(_) {}
        }
        return invokeInstance(gbiHandleHit, this, other, velocity);
    };
} catch(_) {} 
try {
    var UserStateClass = AssemblyCSharp.class("AnimalCompany.UserState");
    var userStateGetIsDeveloper = UserStateClass.method("get_isDeveloper");
    userStateGetIsDeveloper.implementation = function() {
        if (!isClassNamed(this, "UserState")) {
            try { return invokeInstance(userStateGetIsDeveloper, this); } catch(_) { return false; }
        }
        var sp = invokeInstance(userStateGetIsDeveloper, this);
        try { if (sp && !sp.isNull()) sp.method("set_value").invoke(true); } catch(_) {}
        try { if (sp && !sp.isNull()) sp.field("_value").value = true; } catch(_) {}
        try { if (sp && !sp.isNull()) sp.field("value").value  = true; } catch(_) {}
        return sp;
    };
    console.log("[DevHook] UserState.get_isDeveloper hooked â€” always returns true");
} catch(e) { console.error("[DevHook] UserState.get_isDeveloper hook failed:", e); }
try {
    var GISClass2 = AssemblyCSharp.class("AnimalCompany.GameplayItemState");
    try {
        GISClass2.method("get_allowBlueprintSaving").implementation = function() { return true; };
    } catch(_) {}
    try {
        GISClass2.method("get_maxInBlueprint").implementation = function() { return 9999; };
    } catch(_) {}
    try {
        GISClass2.method("get_isPurchasable").implementation = function() { return true; };
    } catch(_) {}
    try {
        GISClass2.method("get_isResearchable").implementation = function() { return true; };
    } catch(_) {}
    try {
        GISClass2.method("get_canBeSavedToLoadoutTemplate").implementation = function() { return true; };
    } catch(_) {}
    console.log("[Blueprint] GameplayItemState hooks installed â€” all items blueprintable");
} catch(e) { console.error("[Blueprint] hook failed:", e); }
try {
    var ShotgunClass = AssemblyCSharp.class("AnimalCompany.Shotgun");
    var shotgunUpdateReload = tryMethodName(ShotgunClass, ["UpdateReload", "ReloadUpdate"]);
    if (shotgunUpdateReload) shotgunUpdateReload.implementation = function() {
        if (noShotgunCooldown) {
            try { this.field("_reloadTimer").value = 0.0; } catch(_) {}
        }
        return invokeInstance(shotgunUpdateReload, this);
    };
} catch(_) {}
try {
    var ShotgunClass2 = AssemblyCSharp.class("AnimalCompany.Shotgun");
    var shotgunHandleUse = ShotgunClass2.method("HandleUse");
    shotgunHandleUse.implementation = function() {
        if (noShotgunCooldown) {
            try { this.field("_reloadTimer").value = 0.0; } catch(_) {}
        }
        return invokeInstance(shotgunHandleUse, this);
    };
} catch(e) { console.error("[NoShotgunCooldown] Shotgun.HandleUse hook failed:", e); }
function installMultiBuyHookOnClass(klass, methodNames[]) {
    if (!klass) return;
    var spawnExtraPurchaseCopiesFromResult = (result, loops) => {
        try {
            if (!result || result.isNull?.() || loops <= 1) return;
            var rootGo = getRootLikeObject(result);
            if (!rootGo || rootGo.isNull?.()) return;
            var itemId = getGrabbableItemId(result) || getGrabbableItemId(rootGo);
            if (!itemId) return;
            var basePos = getTransform(rootGo).method("get_position").invoke();
            var baseRot = getTransform(rootGo).method("get_rotation").invoke();
            for (var i = 1; i < loops; i++) {
                try {
                    var extraPos = [
                        (basePos.field("x").value ) + ((i % 3) * 0.14),
                        (basePos.field("y").value ) + 0.04 + (i * 0.01),
                        (basePos.field("z").value ) + (Math.floor(i / 3) * 0.14)
                    ];
                    var extra = spawnItemAtPos(itemId, extraPos, baseRot);
                    if (!extra || extra.isNull?.()) continue;
                    trySetObjectVelocity(extra, [0, 0.2 + (i * 0.03), 0]);
                } catch(_) {}
            }
        } catch(_) {}
    };
    for (var methodName of methodNames) {
        try {
            var method = tryMethodName(klass, [methodName]);
            if (!method) continue;
            method.implementation = function(...args[]) {
                if (!multiBuyEnabled || multiBuyAmount <= 1 || multiBuyHookGuard) {
                    return invokeInstance(method, this, ...args);
                }
                multiBuyHookGuard = true;
                var result = null;
                try {
                    try { this.field("_lastBuyCheck").value = 0.0; } catch(_) {}
                    try { this.field("_switchToBuyViewDelay").value = 0.0; } catch(_) {}
                    try { this.field("_hasReachedPurchaseThreshold").value = false; } catch(_) {}
                    try { this.field("_isPurchaseLimited").value = false; } catch(_) {}
                    try { this.field("_useCooldownPurchase").value = false; } catch(_) {}
                    var loops = Math.max(1, Math.min(50, multiBuyAmount));
                    for (var i = 0; i < loops; i++) {
                        try { result = invokeInstance(method, this, ...args); } catch(_) {}
                        try { this.field("_lastBuyCheck").value = 0.0; } catch(_) {}
                        try { this.field("_switchToBuyViewDelay").value = 0.0; } catch(_) {}
                        try { this.field("_hasReachedPurchaseThreshold").value = false; } catch(_) {}
                        try { this.field("_isPurchaseLimited").value = false; } catch(_) {}
                        tryCallNames(this, ["TryPurchase", "TriggerPurchase", "HandlePurchase", "HandleBuyGameplayItem", "HandleBuyGameplayItemToBackpack"], 0);
                        tryCallNames(this, ["TryToBuy", "TryToBuyToBackpack"], 0);
                    }
                    try { spawnExtraPurchaseCopiesFromResult(result, loops); } catch(_) {}
                } finally {
                    multiBuyHookGuard = false;
                }
                return result;
            };
            console.log("[MultiBuy] hooked " + klass.type.name + "." + methodName);
        } catch(_) {}
    }
}
try {
    installMultiBuyHookOnClass(ItemSellingMachineButtonViewClass, [
        "HandlePurchaseButtonActivated", "TryToBuy", "TryToBuyToBackpack", "TryPurchase", "TriggerPurchase", "PurchaseCallback"
    ]);
    installMultiBuyHookOnClass(ItemSellingMachineController, [
        "HandlePurchaseRequested", "HandleBuyGameplayItem", "HandleBuyGameplayItemToBackpack", "HandlePurchase", "TryPurchase", "TryToBuy", "PurchaseCallback"
    ]);
    installMultiBuyHookOnClass(GrabbablePurchaseClass, ["HandlePurchase", "TryToBuy", "TryPurchase", "PurchaseCallback"]);
    installMultiBuyHookOnClass(ArenaGrabbablePurchaseClass, ["HandlePurchase", "TryToBuy", "TryPurchase", "TestBuy", "PurchaseCallback"]);
} catch(e) { console.error("[MultiBuy] hook setup failed:", e); }
function blockrpc() {
    function isMine(self) {
        try { return self.method("get_IsMine").invoke(); } catch(_) { return false; }
    }
    function shouldBlock(self) {
        return isMine(self) && !_selfRPCBypass;
    }
    var NetPlayerCls = AssemblyCSharp.class("AnimalCompany.NetPlayer");
    // Capture ALL original method references before any hook is installed.
    // Calling this.method("...").invoke() inside a replaced implementation can
    // return undefined because the bridge's method-lookup sees the already-replaced
    // slot, causing "cannot read property 'call' of undefined" at ac_bridge:2916.
    // Using invokeInstance(origMethod, this, ...) bypasses that entirely.
    var _orig_AddForce = null;
    var _orig_Teleport = null;
    var _orig_PlayerStun = null;
    var _orig_PlayerHit3 = null;
    var _orig_PlayerHit5 = null;
    var _orig_DoPlayerDie = null;
    var _orig_TagAsStinky = null;
    var _orig_SetColorHSV = null;
    var _orig_ApplyBuff = null;
    var _orig_SetTeam = null;
    var _orig_SetHide = null;
    var _orig_AddPlayerMoney = null;
    var _orig_AttachToGiantHand = null;
    var _orig_AwardKill = null;
    try { _orig_AddForce          = NetPlayerCls.method("RPC_AddForce"); }          catch(_) {}
    try { _orig_Teleport          = NetPlayerCls.method("RPC_Teleport"); }          catch(_) {}
    try { _orig_PlayerStun        = NetPlayerCls.method("RPC_PlayerStun"); }        catch(_) {}
    try { _orig_PlayerHit3        = NetPlayerCls.method("RPC_PlayerHit", 3); }      catch(_) {}
    try { _orig_PlayerHit5        = NetPlayerCls.method("RPC_PlayerHit", 5); }      catch(_) {}
    try { _orig_DoPlayerDie       = NetPlayerCls.method("RPC_DoPlayerDie"); }       catch(_) {}
    try { _orig_TagAsStinky       = NetPlayerCls.method("RPC_TagAsStinky"); }       catch(_) {}
    try { _orig_SetColorHSV       = NetPlayerCls.method("RPC_SetColorHSV"); }       catch(_) {}
    try { _orig_ApplyBuff         = NetPlayerCls.method("RPC_ApplyBuff"); }         catch(_) {}
    try { _orig_SetTeam           = NetPlayerCls.method("RPC_SetTeam"); }           catch(_) {}
    try { _orig_SetHide           = NetPlayerCls.method("RPC_SetHide"); }           catch(_) {}
    try { _orig_AddPlayerMoney    = NetPlayerCls.method("RPC_AddPlayerMoney"); }    catch(_) {}
    try { _orig_AttachToGiantHand = NetPlayerCls.method("RPC_AttachToGiantHand"); } catch(_) {}
    try { _orig_AwardKill         = NetPlayerCls.method("RPC_AwardKill"); }         catch(_) {}
    try {
        if (_orig_AddForce) _orig_AddForce.implementation = function(force) {
            if (shouldBlock(this)) return;
            return invokeInstance(_orig_AddForce, this, force);
        };
    } catch(e) { console.error("[blockrpc] RPC_AddForce:", e); }
    try {
        if (_orig_Teleport) _orig_Teleport.implementation = function(position) {
            if (shouldBlock(this)) return;
            try {
                if (this.method("get_IsMine").invoke()) {
                    var x = position.field("x").value.toFixed(2);
                    var y = position.field("y").value.toFixed(2);
                    var z = position.field("z").value.toFixed(2);
                    console.log("[LOGCAT] Teleport (" + x + "," + y + "," + z + ")");
                }
            } catch(_) {}
            return invokeInstance(_orig_Teleport, this, position);
        };
    } catch(e) { console.error("[blockrpc] RPC_Teleport:", e); }
    try {
        if (_orig_PlayerStun) _orig_PlayerStun.implementation = function(position, stunRange, duration, attenType) {
            if (shouldBlock(this)) return;
            return invokeInstance(_orig_PlayerStun, this, position, stunRange, duration, attenType);
        };
    } catch(e) { console.error("[blockrpc] RPC_PlayerStun:", e); }
    try {
        if (_orig_PlayerHit3) _orig_PlayerHit3.implementation = function(damage, position, dmgInfo) {
            if (shouldBlock(this)) return;
            return invokeInstance(_orig_PlayerHit3, this, damage, position, dmgInfo);
        };
    } catch(e) { console.error("[blockrpc] RPC_PlayerHit(3):", e); }
    try {
        if (_orig_PlayerHit5) _orig_PlayerHit5.implementation = function(damage, position, force, dmgInfo, isDeathHit) {
            if (shouldBlock(this)) return;
            return invokeInstance(_orig_PlayerHit5, this, damage, position, force, dmgInfo, isDeathHit);
        };
    } catch(e) { console.error("[blockrpc] RPC_PlayerHit(5):", e); }
    try {
        if (_orig_DoPlayerDie) _orig_DoPlayerDie.implementation = function(isDead) {
            if (shouldBlock(this)) return;
            return invokeInstance(_orig_DoPlayerDie, this, isDead);
        };
    } catch(e) { console.error("[blockrpc] RPC_DoPlayerDie:", e); }
    try {
        if (_orig_TagAsStinky) _orig_TagAsStinky.implementation = function() {
            if (shouldBlock(this)) return;
            return invokeInstance(_orig_TagAsStinky, this);
        };
    } catch(e) { console.error("[blockrpc] RPC_TagAsStinky:", e); }
    try {
        if (_orig_SetColorHSV) _orig_SetColorHSV.implementation = function(duration, hue, saturation, brightness) {
            if (shouldBlock(this)) return;
            return invokeInstance(_orig_SetColorHSV, this, duration, hue, saturation, brightness);
        };
    } catch(e) { console.error("[blockrpc] RPC_SetColorHSV:", e); }
    try {
        if (_orig_ApplyBuff) _orig_ApplyBuff.implementation = function(buffID) {
            if (shouldBlock(this)) return;
            return invokeInstance(_orig_ApplyBuff, this, buffID);
        };
    } catch(e) { console.error("[blockrpc] RPC_ApplyBuff:", e); }
    try {
        if (_orig_SetTeam) _orig_SetTeam.implementation = function(team) {
            if (shouldBlock(this)) return;
            return invokeInstance(_orig_SetTeam, this, team);
        };
    } catch(e) { console.error("[blockrpc] RPC_SetTeam:", e); }
    try {
        if (_orig_SetHide) _orig_SetHide.implementation = function(hide) {
            if (shouldBlock(this)) return;
            return invokeInstance(_orig_SetHide, this, hide);
        };
    } catch(e) { console.error("[blockrpc] RPC_SetHide:", e); }
    try {
        if (_orig_AddPlayerMoney) _orig_AddPlayerMoney.implementation = function(amount) {
            if (shouldBlock(this)) return;
            return invokeInstance(_orig_AddPlayerMoney, this, amount);
        };
    } catch(e) { console.error("[blockrpc] RPC_AddPlayerMoney:", e); }
    try {
        if (_orig_AttachToGiantHand) _orig_AttachToGiantHand.implementation = function(attach, giant, moveImmediate, offset) {
            if (shouldBlock(this)) return;
            return invokeInstance(_orig_AttachToGiantHand, this, attach, giant, moveImmediate, offset);
        };
    } catch(e) { console.error("[blockrpc] RPC_AttachToGiantHand:", e); }
    try {
        if (_orig_AwardKill) _orig_AwardKill.implementation = function() {
            if (shouldBlock(this)) return;
            return invokeInstance(_orig_AwardKill, this);
        };
    } catch(e) { console.error("[blockrpc] RPC_AwardKill:", e); }
    console.log("[blockrpc] installed - blocking all 14 hostile RPCs on self, self-RPCs allowed via bypass");
}
 ArenaItemKilla();
 blockrpc();
var infHealthEnabled = false;
var infHealthHook = NetPlayer.method("get_maxHealth");
infHealthHook.implementation = function() {
    if (infHealthEnabled && this.method("get_IsMine").invoke()) return 999999;
    return this.method("get_maxHealth").invoke();
};
var MiningLaserClass = AssemblyCSharp.class("AnimalCompany.MiningLaser");
try {
    var miningLaserFuel = tryMethodName(MiningLaserClass, ["get__fuel", "get_fuel"]);
    if (miningLaserFuel) miningLaserFuel.implementation = function() {
        try { this.field("_maxDistance").value = 9999.0; } catch(_) {}
        return this.field("_maxFuel").value;
    };
} catch(_) {}
try {
    var miningLaserOverheat = tryMethodName(MiningLaserClass, ["get__didOverheat", "get_didOverheat"]);
    if (miningLaserOverheat) miningLaserOverheat.implementation = function() {
        return false;
    };
} catch(_) {}
try {
    var miningLaserFuelConsumption = tryMethodName(MiningLaserClass, ["ProcessFuelConsumption"]);
    if (miningLaserFuelConsumption) miningLaserFuelConsumption.implementation = function() {
    };
} catch(_) {}
try {
        var AntiCheatClass = AssemblyCSharp.class("AnimalCompany.AntiCheatSystem");
        var antiCheatTick = tryMethodName(AntiCheatClass, ["Update", "LateUpdate", "FixedUpdate"]);
        if (antiCheatTick) antiCheatTick.implementation = function() {
        };
        console.log("[VPN] AntiCheatSystem.Update hooked â€” VPN detection disabled");
    } catch(e) { console.error("[VPN] AntiCheatSystem.Update hook failed:", e); }
    try {
        var AppStateClass = AssemblyCSharp.class("AnimalCompany.AppState");
        var appStateGetIsVPNActive = AppStateClass.method("get_isVPNActive");
        appStateGetIsVPNActive.implementation = function() {
            if (!isClassNamed(this, "AppState")) {
                try { return invokeInstance(appStateGetIsVPNActive, this); } catch(_) { return false; }
            }
            var sp = invokeInstance(appStateGetIsVPNActive, this);
            if (sp && !sp.isNull()) {
                try { sp.method("set_value").invoke(false); } catch(_) {}
                try { sp.field("_value").value = false; } catch(_) {}
                try { sp.field("value").value  = false; } catch(_) {}
            }
            return sp;
        };
        console.log("[VPN] AppState.get_isVPNActive hooked â€” always returns false");
    } catch(e) { console.error("[VPN] AppState.get_isVPNActive hook failed:", e); }
    try {
        var GameplayFishConfigClass = Il2Cpp.domain.assembly("AnimalCompany").image
            .class("AnimalCompany.Fishing.GameplayFishConfig");
        try {
            GameplayFishConfigClass.method("GetRandomFishSize").implementation = function() {
                return 127; 
            };
        } catch(e) { console.error("[Fishing/Rare] GetRandomFishSize:", e); }
        try {
            GameplayFishConfigClass.method("GetPriceByScaleModifier").implementation = function(basePrice, scaleModifier) {
                return this.method("GetPriceByScaleModifier").invoke(basePrice, 127);
            };
        } catch(e) { console.error("[Fishing/Rare] GetPriceByScaleModifier:", e); }
        console.log("[Fishing/Rare] GameplayFishConfig hooks installed â€” max size always");
    } catch(e) { console.error("[Fishing/Rare] GameplayFishConfig hook failed:", e); }
    try {
        var FishingBobberViewClass = Il2Cpp.domain.assembly("AnimalCompany").image
            .class("AnimalCompany.Fishing.FishingBobberView");
        FishingBobberViewClass.method("RPC_GrantClaimItem").implementation = function(receivingPlayer, itemID, scaleModifier) {
            return this.method("RPC_GrantClaimItem").invoke(receivingPlayer, itemID, 127);
        };
        console.log("[Fishing/Rare] RPC_GrantClaimItem hooked â€” always spawns max-size fish");
    } catch(e) { console.error("[Fishing/Rare] RPC_GrantClaimItem hook failed:", e); }
    console.log([
        "===============================================================",
"███████████████████████████████████████████████████████████████████████████████████████████████████████████",
"MONKONGS MENU SUPA COOL",
"███████████████████████████████████████████████████████████████████████████████████████████████████████████",
        " ",
        "   ---- MONKONGS MENU ----",
        "   -Credits to Monkong",
        `   version: ${version}`,
        "==============================================================="
    ].join("\n"));
});