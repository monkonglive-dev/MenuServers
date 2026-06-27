// @ts-nocheck
// ─── EARLY native OpenXR hooks (before Il2Cpp) ──────────────────
// These must run at script load time to fake VR before the game checks
(function earlyOpenXRHooks() {
    var openxrLoader = Process.findModuleByName("openxr_loader.dll")
        || Process.findModuleByName("XRLoader.dll")
        || Process.findModuleByName("UnityOpenXR.dll")
        || Process.findModuleByName("OculusXRPlugin.dll")
        || Process.findModuleByName("UnityXRPlugin.dll")
        || Process.findModuleByName("oculus.dll");
    if (!openxrLoader) {
        console.log("[PCMode] No XR native module found, trying GameAssembly hooks");
    } else {
        console.log("[PCMode] Found XR module: " + openxrLoader.name);
    }
    // Hook openxr_loader!xrCreateInstance → return XR_SUCCESS + fake instance
    if (openxrLoader) {
        var xrCreateInstance = openxrLoader.findExportByName("xrCreateInstance");
        if (xrCreateInstance) {
            Interceptor.attach(xrCreateInstance, {
                onEnter: function(args) {
                    console.log("[PCMode] Intercepted xrCreateInstance");
                },
                onLeave: function(retval) {
                    retval.replace(ptr(0)); // XR_SUCCESS
                    console.log("[PCMode] xrCreateInstance → XR_SUCCESS");
                }
            });
        }
        var xrGetSystemProperties = openxrLoader.findExportByName("xrGetSystemProperties");
        if (xrGetSystemProperties) {
            Interceptor.attach(xrGetSystemProperties, {
                onEnter: function(args) {
                    // args[1] = systemId, args[2] = XrSystemProperties output
                    if (!args[2].isNull()) {
                        // XrSystemProperties.type = XR_TYPE_SYSTEM_PROPERTIES (4)
                        args[2].writeU32(4);
                        // vendorId = 10711 (Valve)
                        args[2].add(4).writeU32(10711);
                        console.log("[PCMode] Faked XrSystemProperties");
                    }
                },
                onLeave: function(retval) {
                    retval.replace(ptr(0)); // XR_SUCCESS
                }
            });
        }
        var xrEnumerateInstanceExtensionProperties = openxrLoader.findExportByName("xrEnumerateInstanceExtensionProperties");
        if (xrEnumerateInstanceExtensionProperties) {
            Interceptor.attach(xrEnumerateInstanceExtensionProperties, {
                onLeave: function(retval) {
                    retval.replace(ptr(1)); // return count=1
                }
            });
        }
        var xrCreateSession = openxrLoader.findExportByName("xrCreateSession");
        if (xrCreateSession) {
            Interceptor.attach(xrCreateSession, {
                onLeave: function(retval) {
                    retval.replace(ptr(0)); // XR_SUCCESS
                }
            });
        }
        var xrLocateSpace = openxrLoader.findExportByName("xrLocateSpace");
        if (xrLocateSpace) {
            Interceptor.attach(xrLocateSpace, {
                onEnter: function(args) {
                    // args[3] = XrSpaceLocation output
                    if (!args[3].isNull()) {
                        // XrSpaceLocation.type = XR_TYPE_SPACE_LOCATION (3)
                        args[3].writeU32(3);
                        // XrSpaceLocation.flags = XR_SPACE_LOCATION_POSITION_VALID_BIT | ORIENTATION_VALID_BIT
                        args[3].add(4).writeU32(3);
                        // pose = identity (pos 0,0,0 / quat 0,0,0,1)
                        var pose = args[3].add(8);
                        pose.writeDouble(0); // x
                        pose.add(8).writeDouble(0); // y
                        pose.add(16).writeDouble(0); // z
                        pose.add(24).writeDouble(0); // qx
                        pose.add(32).writeDouble(0); // qy
                        pose.add(40).writeDouble(0); // qz
                        pose.add(48).writeDouble(1); // qw
                    }
                },
                onLeave: function(retval) {
                    retval.replace(ptr(0)); // XR_SUCCESS
                }
            });
        }
        var xrWaitFrame = openxrLoader.findExportByName("xrWaitFrame");
        if (xrWaitFrame) {
            Interceptor.attach(xrWaitFrame, {
                onLeave: function(retval) {
                    retval.replace(ptr(0)); // XR_SUCCESS
                }
            });
        }
        var xrBeginFrame = openxrLoader.findExportByName("xrBeginFrame");
        if (xrBeginFrame) {
            Interceptor.attach(xrBeginFrame, {
                onLeave: function(retval) {
                    retval.replace(ptr(0)); // XR_SUCCESS
                }
            });
        }
        var xrEndFrame = openxrLoader.findExportByName("xrEndFrame");
        if (xrEndFrame) {
            Interceptor.attach(xrEndFrame, {
                onLeave: function(retval) {
                    retval.replace(ptr(0)); // XR_SUCCESS
                }
            });
        }
        var xrGetActionStateBoolean = openxrLoader.findExportByName("xrGetActionStateBoolean");
        if (xrGetActionStateBoolean) {
            Interceptor.attach(xrGetActionStateBoolean, {
                onEnter: function(args) {
                    // args[3] = XrActionStateBoolean output
                    if (!args[3].isNull()) {
                        args[3].writeU32(1); // type = XR_TYPE_ACTION_STATE_BOOLEAN
                        args[3].add(4).writeU32(1); // isActive = true
                        args[3].add(8).writeU32(0); // currentState = false
                        args[3].add(12).writeU32(1); // changedSinceLastSync = true
                    }
                },
                onLeave: function(retval) {
                    retval.replace(ptr(0)); // XR_SUCCESS
                }
            });
        }
        var xrGetInstanceProcAddr = openxrLoader.findExportByName("xrGetInstanceProcAddr");
        if (xrGetInstanceProcAddr) {
            Interceptor.attach(xrGetInstanceProcAddr, {
                onEnter: function(args) {
                    console.log("[PCMode] xrGetInstanceProcAddr called for: " + args[1].readUtf16String());
                }
            });
        }
    }
    // Also hook into SteamVR runtime check
    var steamvr = Process.findModuleByName("openvr_api.dll");
    if (steamvr) {
        console.log("[PCMode] Found openvr_api.dll, hooking VR init");
        var VR_Init = steamvr.findExportByName("VR_InitInternal2");
        if (VR_Init) {
            Interceptor.attach(VR_Init, {
                onLeave: function(retval) {
                    retval.replace(ptr(1)); // fake IVRSystem pointer
                    console.log("[PCMode] VR_InitInternal2 → faked");
                }
            });
        }
        var VR_IsHmdPresent = steamvr.findExportByName("VR_IsHmdPresent");
        if (VR_IsHmdPresent) {
            Interceptor.replace(VR_IsHmdPresent, new NativeCallback(function() {
                return 1; // true
            }, 'int', []));
        }
        var VR_IsRuntimeInstalled = steamvr.findExportByName("VR_IsRuntimeInstalled");
        if (VR_IsRuntimeInstalled) {
            Interceptor.replace(VR_IsRuntimeInstalled, new NativeCallback(function() {
                return 1; // true
            }, 'int', []));
        }
    }
    // Hook into GameAssembly.dll directly to find and bypass the "no headset" check
    var gameAssembly = Process.findModuleByName("GameAssembly.dll");
    if (gameAssembly) {
        // Search for "vr headset" or "headset" strings and NOP the branch that shows them
        try {
            var ranges = gameAssembly.enumerateRanges("r--");
            for (var range of ranges) {
                try {
                    var matches = Memory.scanSync(range.base, range.size, "76 00 72 00 20 00 68 00 65 00 61 00 64 00 73 00 65 00 74"); // "vr headset" utf16
                    for (var match of matches) {
                        console.log("[PCMode] Found 'vr headset' string at: " + match.address);
                    }
                } catch(_) {}
            }
        } catch(_) {}
    }
    console.log("[PCMode] Early native XR hooks installed");
})();
Il2Cpp.perform(() => {
    // ─── Config ───────────────────────────────────────────────────
    var MOVE_SPEED   = 5.0;
    var LOOK_SPEED   = 0.003;
    var CAM_HEIGHT   = 1.7;
    var TRIGGER_KEY  = 0x10;   // Shift = trigger
    var GRIP_KEY     = 0x11;   // Ctrl  = grip
    var MENU_KEY     = 0x4D;   // M     = menu toggle
    // ─── WinAPI keyboard ──────────────────────────────────────────
    var user32  = Process.getModuleByName("user32.dll");
    var getKey  = new NativeFunction(
        user32.getExportByName("GetAsyncKeyState"), "int", ["int"]
    );
    function isKeyHeld(vk) {
        return (getKey(vk) & 0x8000) !== 0;
    }
    // ─── Assembly references ──────────────────────────────────────
    var assembly = Il2Cpp.domain.assembly("AnimalCompany").image;
    var unityCore = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image;
    var unityPhys = Il2Cpp.domain.assembly("UnityEngine.PhysicsModule").image;
    var Vector3Class  = unityCore.class("UnityEngine.Vector3");
    var QuaternionCls = unityCore.class("UnityEngine.Quaternion");
    var GameObjectCls = unityCore.class("UnityEngine.GameObject");
    var TransformCls  = unityCore.class("UnityEngine.Transform");
    var RigidbodyCls  = unityPhys.class("UnityEngine.Rigidbody");
    var TimeClass     = unityCore.class("UnityEngine.Time");
    var MathfClass    = unityCore.class("UnityEngine.Mathf");
    var NetPlayerCls  = assembly.class("AnimalCompany.NetPlayer");
    var PlayerCtrlCls = assembly.class("AnimalCompany.PlayerController");
    // ─── Cached refs ──────────────────────────────────────────────
    var lastFrameTime  = 0;
    var yaw            = 0;
    var pitch          = 0;
    var initialized    = false;
    var pcInstance     = null;
    var rbInstance     = null;
    // ─── Vector helpers (managed) ─────────────────────────────────
    function v3(x, y, z) {
        return Vector3Class.method("op_Addition", 2).invoke(
            Vector3Class.method("op_Multiply", 2).invoke(
                Vector3Class.field("rightVector").value, x
            ),
            Vector3Class.method("op_Addition", 2).invoke(
                Vector3Class.method("op_Multiply", 2).invoke(
                    Vector3Class.field("upVector").value, y
                ),
                Vector3Class.method("op_Multiply", 2).invoke(
                    Vector3Class.field("forwardVector").value, z
                )
            )
        );
    }
    function v3Make(x, y, z) {
        var v = Vector3Class.alloc();
        v.method(".ctor", 3).invoke(x, y, z);
        return v;
    }
    function quatEuler(x, y, z) {
        return QuaternionCls.method("Euler", 3).invoke(x, y, z);
    }
    // ─── Initialize on first valid frame ──────────────────────────
    function ensureInit() {
        if (initialized && pcInstance && !pcInstance.isNull()) return true;
        try {
            var inst = PlayerCtrlCls.method("get_instance").invoke();
            if (!inst || inst.isNull()) return false;
            pcInstance = inst;
            try {
                rbInstance = inst.method("GetComponent", 1).inflate(RigidbodyCls).invoke();
            } catch(_) {}
            initialized = true;
            console.log("[PCMode] PlayerController instance captured");
            return true;
        } catch(_) { return false; }
    }
    // ─── Mouse look (raw WinAPI) ──────────────────────────────────
    var GetCursorPos = new NativeFunction(
        user32.getExportByName("GetCursorPos"), "int", ["pointer"]
    );
    var SetCursorPos = new NativeFunction(
        user32.getExportByName("SetCursorPos"), "int", ["int", "int"]
    );
    var ShowCursor   = new NativeFunction(
        user32.getExportByName("ShowCursor"), "int", ["int"]
    );
    var ClipCursor   = new NativeFunction(
        user32.getExportByName("ClipCursor"), "int", ["pointer"]
    );
    var GetForegroundWindow = new NativeFunction(
        user32.getExportByName("GetForegroundWindow"), "pointer", []
    );
    var GetWindowThreadProcessId = new NativeFunction(
        user32.getExportByName("GetWindowThreadProcessId"), "int", ["pointer", "pointer"]
    );
    var mouseLocked = false;
    var lastMouseX  = -1;
    var lastMouseY  = -1;
    var screenCX    = 960;
    var screenCY    = 540;
    var lockBtnWasHeld = false;
    function updateMouseLook(dt) {
        var rightMouseDown = getKey(0x02) !== 0;
        if (rightMouseDown && !lockBtnWasHeld) {
            mouseLocked = !mouseLocked;
            if (mouseLocked) {
                screenCX = window.innerWidth  ? Math.floor(window.innerWidth  / 2) : 960;
                screenCY = window.innerHeight ? Math.floor(window.innerHeight / 2) : 540;
                ShowCursor(0);
                var buf = Memory.alloc(8);
                buf.writeU32(screenCX);
                buf.add(4).writeU32(screenCY);
                SetCursorPos(screenCX, screenCY);
            } else {
                ShowCursor(1);
            }
        }
        lockBtnWasHeld = rightMouseDown;
        if (!mouseLocked) { lastMouseX = -1; lastMouseY = -1; return; }
        var pt = Memory.alloc(8);
        if (!GetCursorPos(pt)) return;
        var mx = pt.readU32();
        var my = pt.add(4).readU32();
        if (lastMouseX < 0) { lastMouseX = mx; lastMouseY = my; return; }
        var dx = mx - lastMouseX;
        var dy = my - lastMouseY;
        yaw   += dx * LOOK_SPEED;
        pitch -= dy * LOOK_SPEED;
        pitch  = Math.max(-89, Math.min(89, pitch));
        SetCursorPos(screenCX, screenCY);
        lastMouseX = screenCX;
        lastMouseY = screenCY;
    }
    // ─── Main movement loop (hooked into LateUpdate) ──────────────
    try {
        var LateUpdate = NetPlayerCls.method("LateUpdate");
        var origLateUpdate = LateUpdate.implementation;
        LateUpdate.implementation = function() {
            try {
                var dt = TimeClass.method("get_deltaTime").invoke();
                if (!ensureInit()) return origLateUpdate.call(this);
                updateMouseLook(dt);
                // ── WASD movement ──
                var forwardKey = isKeyHeld(0x57); // W
                var backKey    = isKeyHeld(0x53); // S
                var leftKey    = isKeyHeld(0x41); // A
                var rightKey   = isKeyHeld(0x44); // D
                var upKey      = isKeyHeld(0x20); // Space
                var downKey    = isKeyHeld(0x10); // Shift (also trigger but acts  here)
                var moveX = 0, moveY = 0, moveZ = 0;
                if (forwardKey) moveZ += 1;
                if (backKey)    moveZ -= 1;
                if (leftKey)    moveX -= 1;
                if (rightKey)   moveX += 1;
                if (upKey)      moveY += 1;
                if (downKey)    moveY -= 1;
                var moveMag = Math.sqrt(moveX * moveX + moveY * moveY + moveZ * moveZ);
                if (moveMag > 0.01) {
                    var invMag = 1.0 / moveMag;
                    moveX *= invMag;
                    moveY *= invMag;
                    moveZ *= invMag;
                }
                if (moveMag > 0.01) {
                    var cosY = Math.cos(yaw);
                    var sinY = Math.sin(yaw);
                    var worldX = moveX * cosY + moveZ * sinY;
                    var worldZ = moveZ * cosY - moveX * sinY;
                    var moveVec = v3Make(worldX * MOVE_SPEED * dt, moveY * MOVE_SPEED * dt, worldZ * MOVE_SPEED * dt);
                    if (rbInstance && !rbInstance.isNull()) {
                        try {
                            rbInstance.method("set_useGravity").invoke(false);
                            var curVel = rbInstance.method("get_linearVelocity").invoke();
                            var flatMove = v3Make(worldX * MOVE_SPEED, moveY * MOVE_SPEED, worldZ * MOVE_SPEED);
                            rbInstance.method("set_linearVelocity").invoke(flatMove);
                        } catch(_) {
                            // fallback: direct transform move
                            try {
                                var tf = pcInstance.method("get_transform").invoke();
                                var pos = tf.method("get_position").invoke();
                                var newPos = Vector3Class.method("op_Addition", 2).invoke(pos, moveVec);
                                tf.method("set_position").invoke(newPos);
                            } catch(_) {}
                        }
                    } else {
                        try {
                            var tf = pcInstance.method("get_transform").invoke();
                            var pos = tf.method("get_position").invoke();
                            var newPos = Vector3Class.method("op_Addition", 2).invoke(pos, moveVec);
                            tf.method("set_position").invoke(newPos);
                        } catch(_) {}
                    }
                }
                // ── Apply yaw to player rotation ──
                try {
                    var tf = pcInstance.method("get_transform").invoke();
                    var rot = quatEuler(0, yaw * (180.0 / Math.PI), 0);
                    tf.method("set_rotation").invoke(rot);
                } catch(_) {}
                // ── Update fake HMD pose for XR tracking ──
                try {
                    var tf = pcInstance.method("get_transform").invoke();
                    var pos = tf.method("get_position").invoke();
                    hmdPos.x = pos.field("x").value;
                    hmdPos.y = pos.field("y").value + 0.2; // slightly above player origin
                    hmdPos.z = pos.field("z").value;
                    updateHmdPose();
                } catch(_) { try { updateHmdPose(); } catch(_) {} }
                // ── VR input simulation ──
                try {
                    var rightTrigger = isKeyHeld(0x45); // E = right trigger
                    var leftTrigger  = isKeyHeld(0x51); // Q = left trigger
                    var rightGrip    = isKeyHeld(TRIGGER_KEY); // Shift = right grip
                    var leftGrip     = isKeyHeld(GRIP_KEY);    // Ctrl  = left grip
                    var leftPrimary  = isKeyHeld(0x52); // R
                    var rightPrimary = isKeyHeld(0x46); // F
                    var leftSecondary  = isKeyHeld(0x54); // T
                    var rightSecondary = isKeyHeld(0x47); // G
                    // write to player controller fields if they exist
                    try { pcInstance.field("rightPrimary").value = rightPrimary; } catch(_) {}
                    try { pcInstance.field("leftPrimary").value = leftPrimary; } catch(_) {}
                    try { pcInstance.field("rightSecondary").value = rightSecondary; } catch(_) {}
                    try { pcInstance.field("leftSecondary").value = leftSecondary; } catch(_) {}
                    try { pcInstance.field("rightGrab").value = rightGrip; } catch(_) {}
                    try { pcInstance.field("leftGrab").value = leftGrip; } catch(_) {}
                    try { pcInstance.field("rightTrigger").value = rightTrigger; } catch(_) {}
                    try { pcInstance.field("leftTrigger").value = leftTrigger; } catch(_) {}
                } catch(_) {}
            } catch(e) {
                console.log("[PCMode] tick error: " + e);
            }
            return origLateUpdate.call(this);
        };
        console.log("[PCMode] LateUpdate hooked for movement + mouse look");
    } catch(e) {
        console.log("[PCMode] Failed to hook LateUpdate: " + e);
    }
    // ─── SteamVR / Unity XR emulation via Il2Cpp ────────────────
    // Hook Unity's XR subsystem at the managed level to fake tracking
    // This is far more reliable than hooking native OpenXR exports
    var hmdPos = { x: 0, y: 1.7, z: 0 };
    var hmdRot = { x: 0, y: 0, z: 0, w: 1 };
    var updateHmdPose = function() {
        try {
            var eulerQ = QuaternionCls.method("Euler", 3).invoke(
                pitch * (180.0 / Math.PI),
                yaw * (180.0 / Math.PI),
                0
            );
            hmdRot.x = eulerQ.field("x").value;
            hmdRot.y = eulerQ.field("y").value;
            hmdRot.z = eulerQ.field("z").value;
            hmdRot.w = eulerQ.field("w").value;
        } catch(_) {
            var halfYaw   = yaw * 0.5;
            var halfPitch = pitch * 0.5;
            hmdRot.x = Math.sin(-halfPitch) * Math.sin(halfYaw);
            hmdRot.y = Math.sin(halfPitch) * Math.cos(halfYaw);
            hmdRot.z = Math.cos(halfPitch) * Math.sin(halfYaw);
            hmdRot.w = Math.cos(halfPitch) * Math.cos(halfYaw);
        }
    };
    try {
        var xrGenImage = Il2Cpp.domain.assembly("UnityEngine.XRModule").image;
        // ── Fake XRSettings.enabled → true ──
        try {
            var XRSettingsCls = xrGenImage.class("UnityEngine.XR.XRSettings");
            var getEnabled = XRSettingsCls.method("get_enabled");
            getEnabled.implementation = function() {
                return true;
            };
            console.log("[PCMode] Hooked XRSettings.get_enabled → true");
        } catch(e) { console.log("[PCMode] XRSettings hook skip: " + e); }
        // ── Fake XRDevice.isPresent → true ──
        try {
            var XRDeviceCls = xrGenImage.class("UnityEngine.XR.XRDevice");
            var getPresent = XRDeviceCls.method("get_isPresent");
            getPresent.implementation = function() {
                return true;
            };
            console.log("[PCMode] Hooked XRDevice.get_isPresent → true");
        } catch(e) { console.log("[PCMode] XRDevice hook skip: " + e); }
        // ── Fake XRDevice userPresence → true ──
        try {
            var XRDeviceCls = xrGenImage.class("UnityEngine.XR.XRDevice");
            var getUserPresence = XRDeviceCls.method("get_userPresence");
            getUserPresence.implementation = function() {
                return 1; // UserPresenceState.Present
            };
        } catch(_) {}
        // ── Fake InputTracking.GetLocalPosition → our position ──
        try {
            var InputTrackingCls = xrGenImage.class("UnityEngine.XR.InputTracking");
            var getLocalPos = InputTrackingCls.method("GetLocalPosition", 1);
            getLocalPos.implementation = function(node) {
                // node 0 = Head
                var v = Vector3Class.alloc();
                v.method(".ctor", 3).invoke(hmdPos.x, hmdPos.y, hmdPos.z);
                return v;
            };
            console.log("[PCMode] Hooked InputTracking.GetLocalPosition");
        } catch(e) { console.log("[PCMode] InputTracking pos skip: " + e); }
        // ── Fake InputTracking.GetLocalRotation → our rotation ──
        try {
            var InputTrackingCls = xrGenImage.class("UnityEngine.XR.InputTracking");
            var getLocalRot = InputTrackingCls.method("GetLocalRotation", 1);
            getLocalRot.implementation = function(node) {
                var q = QuaternionCls.alloc();
                q.method(".ctor", 4).invoke(hmdRot.x, hmdRot.y, hmdRot.z, hmdRot.w);
                return q;
            };
            console.log("[PCMode] Hooked InputTracking.GetLocalRotation");
        } catch(e) { console.log("[PCMode] InputTracking rot skip: " + e); }
        // ── Hook InputTracking.Recenter to no-op (prevent resets) ──
        try {
            var InputTrackingCls = xrGenImage.class("UnityEngine.XR.InputTracking");
            var recenter = InputTrackingCls.method("Recenter");
            recenter.implementation = function() { /* do nothing */ };
        } catch(_) {}
        // ── Fake CommonUsages tracking state → full tracking ──
        // This ensures the game sees devices as "tracked"
        try {
            var InputDevicesCls = xrGenImage.class("UnityEngine.XR.InputDevices");
            var getDeviceAtNode = InputDevicesCls.method("GetDevicesAtXRNode", 1);
            // Build fake device list with our tracked device
            var deviceListCls = xrGenImage.class("System.Collections.Generic.List`1[UnityEngine.XR.InputDevice]");
            var listCtor = deviceListCls.method(".ctor");
            var addDevice = deviceListCls.method("Add");
            getDeviceAtNode.implementation = function(node) {
                var list = listCtor.invoke();
                // We still return the real list but the hooks above handle actual pose data
                return getDeviceAtNode.call(this, node);
            };
            console.log("[PCMode] Hooked InputDevices.GetDevicesAtXRNode");
        } catch(e) { console.log("[PCMode] InputDevices hook skip: " + e); }
        // ── Hook XRNodeTrackerState to report all nodes  ──
        try {
            var InputDevicesCls = xrGenImage.class("UnityEngine.XR.InputDevices");
            var isValidMethod = InputDevicesCls.method("IsValidDevice", 1);
            if (isValidMethod) {
                isValidMethod.implementation = function(device) {
                    return true;
                };
            }
        } catch(_) {}
        console.log("[PCMode] Unity XR hooks installed (tracking faked)");
    } catch(e) {
        console.log("[PCMode] XR hook setup failed: " + e);
    }
    // ─── Hook Unity's InputSystem for controller buttons ─────────
    try {
        var inputSysImage = Il2Cpp.domain.assembly("Unity.InputSystem").image;
        // Try to hook InputSystem.OnUpdate to inject our fake input state
        // This is game-specific; skip if class not found
        try {
            var InputActionCls = inputSysImage.class("UnityEngine.InputSystem.InputAction");
            console.log("[PCMode] Unity.InputSystem found - input action hooking available");
        } catch(_) {}
    } catch(_) {}
    // ─── Keyboard shortcut legend ─────────────────────────────────
    console.log("========================================");
    console.log("  PC MODE ACTIVE");
    console.log("  WASD = Move");
    console.log("  Space = Up, Shift = Down");
    console.log("  Right-click = Toggle mouse look");
    console.log("  E/Q = Right/Left Trigger");
    console.log("  Shift/Ctrl = Right/Left Grip");
    console.log("  R/F = Left/Right Primary");
    console.log("  T/G = Left/Right Secondary");
    console.log("  M = Toggle menu");
    console.log("=========================================");
}, "main");