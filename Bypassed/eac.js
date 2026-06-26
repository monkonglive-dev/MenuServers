


Il2Cpp.perform(() => {

    var baseAddr = null;
    var moduleNames = ["GameAssembly.dll", "GameAssembly.dll"];
    for (var name of moduleNames) {
        var mod = Process.findModuleByName(name);
        if (mod) {
            baseAddr = mod.base;
            break;
        }
    }

    var eacManagerInstance = null;

    function forceValid() {
        if (eacManagerInstance && !eacManagerInstance.isNull()) {
            eacManagerInstance.add(0x20).writeU32(1); 
        }
    }

    try {
        var addr = baseAddr.add(0x69FA30);
        Interceptor.attach(addr, {
            onEnter: function(args[]) {
                eacManagerInstance = args[0];
                forceValid();
            }
        });
    } catch (e) {
    }
    try {
        var addr = baseAddr.add(0x6B0B10);
        Interceptor.attach(addr, {
            onEnter: function(args[]) {
                var d10Instance = args[0];
                var manager = d10Instance.add(0x20).readPointer();
                if (!manager.isNull()) {
                    eacManagerInstance = manager;
                }
            },
            onLeave: function(retval) {
                forceValid();
            }
        });
    } catch (e) {

    }

    try {
        var addr = baseAddr.add(0x69FAF0);
        Interceptor.replace(addr, new NativeCallback(function(self, data, methodInfo) {
        }, 'void', ['pointer', 'pointer', 'pointer']));
    } catch (e) {
    }

    try {
        var addr = baseAddr.add(0x699260);
        Interceptor.replace(addr, new NativeCallback(function(self, methodInfo) {
            forceValid();
        }, 'void', ['pointer', 'pointer']));
    } catch (e) {

    }
 

}, "main");