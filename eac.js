// EAC Validation Bypass — frida-il2cpp-bridge
//
// Forces EasyAntiCheat validation to always return 'Valid'
// and neutralizes integrity violation callbacks and background checks.
//
// Usage (PC):
//   frida-compile eac-bypass.ts -o eac-bypass.js
//   frida -n "GameName.exe" -l eac-bypass.js --runtime=v8
//   frida -f "GameName.exe" -l eac-bypass.js --runtime=v8 --no-pause
//
// Requirements:
//   npm i -D frida-il2cpp-bridge




// ─── Utilities ─────────────────────────────────────────────────────────────────

function log(msg) {
    console.log("[EAC] " + msg);
}

// ─── Entry point ───────────────────────────────────────────────────────────────

Il2Cpp.perform(() => {
    log("Domain ready — initializing EAC bypass…");

    let baseAddr = null;
    const moduleNames = ["GameAssembly.dll", "GameAssembly.so", "GameAssembly.dylib"];
    for (const name of moduleNames) {
        const mod = Process.findModuleByName(name);
        if (mod) {
            baseAddr = mod.base;
            log("Found GameAssembly at: " + baseAddr);
            break;
        }
    }

    if (!baseAddr) {
        log("Could not find GameAssembly module!");
        return;
    }

    // Global variable to hold our EACClientManager instance pointer
    let eacManagerInstance = null;

    // Helper to force _validationFinished (offset 0x3C) to true (1)
    function forceFinished() {
        if (eacManagerInstance && !eacManagerInstance.isNull()) {
            try {
                eacManagerInstance.add(0x3C).writeU8(1); 
            } catch (_) {}
        }
    }

    // 1. get_HasFinished -> RVA: 0x69FE70
    try {
        const addr = baseAddr.add(0x69FE70);
        Interceptor.attach(addr, {
            onLeave: function(retval) {
                if (retval.toInt32() !== 1) {
                    retval.replace(ptr(1)); // true
                }
            }
        });
        log("Hooked get_HasFinished -> Always returns true");
    } catch (e) {
        log("Failed to hook get_HasFinished: " + e);
    }

    // 2. IsClientValidated -> RVA: 0x69FCF0
    try {
        const addr = baseAddr.add(0x69FCF0);
        Interceptor.attach(addr, {
            onLeave: function(retval) {
                if (retval.toInt32() !== 1) {
                    retval.replace(ptr(1)); // true
                }
            }
        });
        log("Hooked IsClientValidated -> Always returns true");
    } catch (e) {
        log("Failed to hook IsClientValidated: " + e);
    }

    // 3. DidFailUnprotected -> RVA: 0x69FB60
    try {
        const addr = baseAddr.add(0x69FB60);
        Interceptor.attach(addr, {
            onLeave: function(retval) {
                if (retval.toInt32() !== 0) {
                    retval.replace(ptr(0)); // false
                }
            }
        });
        log("Hooked DidFailUnprotected -> Always returns false");
    } catch (e) {
        log("Failed to hook DidFailUnprotected: " + e);
    }

    // 4. EACClientManager.Awake -> RVA: 0x69FA30
    try {
        const addr = baseAddr.add(0x69FA30);
        Interceptor.attach(addr, {
            onEnter: function(args[]) {
                eacManagerInstance = args[0];
                log("Captured EACClientManager instance: " + eacManagerInstance);
            },
            onLeave: function() {
                forceFinished();
            }
        });
        log("Hooked EACClientManager.Awake -> Capturing instance");
    } catch (e) {
        log("Failed to hook EACClientManager.Awake: " + e);
    }

    // 5. <ValidateCoroutine>d__13.MoveNext -> RVA: 0x6B0640
    try {
        const addr = baseAddr.add(0x6B0640);
        Interceptor.attach(addr, {
            onEnter: function(args[]) {
                const d13Instance = args[0];
                // <>4__this (EACClientManager) is at offset 0x20 inside d__13
                const manager = d13Instance.add(0x20).readPointer();
                if (!manager.isNull()) {
                    eacManagerInstance = manager;
                }
            },
            onLeave: function(retval) {
                forceFinished();
            }
        });
        log("Hooked ValidateCoroutine.MoveNext -> Forcing finished");
    } catch (e) {
        log("Failed to hook ValidateCoroutine.MoveNext: " + e);
    }

    // 6. HandleClientIntegrityViolated -> RVA: 0x69FB70
    try {
        const addr = baseAddr.add(0x69FB70);
        Interceptor.replace(addr, new NativeCallback(function(self, data, methodInfo) {
            // Swallow the callback entirely - do nothing
        }, 'void', ['pointer', 'pointer', 'pointer']));
        log("Hooked HandleClientIntegrityViolated -> Swallowed");
    } catch (e) {
        log("Failed to hook HandleClientIntegrityViolated: " + e);
    }

    // 7. AntiCheatSystem.OnUpdate -> RVA: 0x699260
    try {
        const addr = baseAddr.add(0x699260);
        Interceptor.replace(addr, new NativeCallback(function(self, methodInfo) {
            // Run every frame to guarantee the field stays true, and swallow VPN checks
            forceFinished();
        }, 'void', ['pointer', 'pointer']));
        log("Hooked AntiCheatSystem.OnUpdate -> Forcing finished & Swallowed");
    } catch (e) {
        log("Failed to hook AntiCheatSystem.OnUpdate: " + e);
    }

    log("──────────────────────────────────────");
    log("EAC Bypass successfully installed!");
    log("──────────────────────────────────────");

}, "main");