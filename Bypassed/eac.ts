declare const Il2Cpp: any;
declare const console: any;

Il2Cpp.perform(() => {

    let baseAddr: any = null;
    const moduleNames = ["GameAssembly.dll", "GameAssembly.dll"];
    for (const name of moduleNames) {
        const mod = Process.findModuleByName(name);
        if (mod) {
            baseAddr = mod.base;
            break;
        }
    }

    let eacManagerInstance: any = null;

    function forceValid() {
        if (eacManagerInstance && !eacManagerInstance.isNull()) {
            eacManagerInstance.add(0x20).writeU32(1); 
        }
    }

    try {
        const addr = baseAddr.add(0x69FA30);
        Interceptor.attach(addr, {
            onEnter: function(args: any[]) {
                eacManagerInstance = args[0];
                forceValid();
            }
        });
    } catch (e) {
    }
    try {
        const addr = baseAddr.add(0x6B0B10);
        Interceptor.attach(addr, {
            onEnter: function(args: any[]) {
                const d10Instance = args[0];
                const manager = d10Instance.add(0x20).readPointer();
                if (!manager.isNull()) {
                    eacManagerInstance = manager;
                }
            },
            onLeave: function(retval: any) {
                forceValid();
            }
        });
    } catch (e) {

    }

    try {
        const addr = baseAddr.add(0x69FAF0);
        Interceptor.replace(addr, new NativeCallback(function(self: any, data: any, methodInfo: any) {
        }, 'void', ['pointer', 'pointer', 'pointer']));
    } catch (e) {
    }

    try {
        const addr = baseAddr.add(0x699260);
        Interceptor.replace(addr, new NativeCallback(function(self: any, methodInfo: any) {
            forceValid();
        }, 'void', ['pointer', 'pointer']));
    } catch (e) {

    }
 

}, "main");