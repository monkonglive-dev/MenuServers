"""
Il2Cpp Runtime Dumper for Animal Company
Attaches to the game via Frida and dumps all class/field/method offsets.
No compilation needed - just run: py dumper.py

Requirements: pip install frida-tools frida
"""
import sys
import json
import os
from datetime import datetime

FRIDA_SCRIPT = """
'use strict';

const targetClasses = [
    { ns: 'AnimalCompany', name: 'GorillaLocomotion' },
    { ns: 'AnimalCompany', name: 'NetPlayer' },
    { ns: 'AnimalCompany', name: 'PlayerController' },
    { ns: 'AnimalCompany', name: 'PrefabGenerator' },
    { ns: 'AnimalCompany', name: 'NetworkManager' },
    { ns: 'AnimalCompany', name: 'SFXManager' },
    { ns: 'AnimalCompany', name: 'App' },
    { ns: 'AnimalCompany', name: 'ArenaGameManager' },
    { ns: 'AnimalCompany', name: 'ElevatorManager' },
    { ns: 'AnimalCompany', name: 'ComputerTerminalMediator' },
    { ns: 'AnimalCompany', name: 'MobSpawnValidator' },
    { ns: 'AnimalCompany', name: 'GrabbableObject' },
    { ns: 'AnimalCompany', name: 'GrabbableItem' },
    { ns: 'AnimalCompany', name: 'BackpackItem' },
    { ns: 'AnimalCompany', name: 'Quiver' },
    { ns: 'AnimalCompany', name: 'Crossbow' },
    { ns: 'AnimalCompany', name: 'HeartGun' },
    { ns: 'AnimalCompany', name: 'GrenadeLauncher' },
    { ns: 'AnimalCompany', name: 'SalmonCannon' },
    { ns: 'AnimalCompany', name: 'MobController' },
    { ns: 'AnimalCompany', name: 'PickupManager' },
    { ns: 'AnimalCompany', name: 'NetSessionRPCs' },
    { ns: 'AnimalCompany', name: 'NetSessionPrivateRoomManager' },
    { ns: 'AnimalCompany', name: 'NetworkSessionManager' },
    { ns: 'AnimalCompany', name: 'VFXManager' },
    { ns: 'AnimalCompany', name: 'ParticleManager' },
    { ns: 'AnimalCompany', name: 'UserCacheManager' },
    { ns: 'AnimalCompany', name: 'ModerationMenuMediator' },
    { ns: 'AnimalCompany', name: 'PlayerWatchDevMenuMediator' },
    { ns: 'Fusion', name: 'NetworkRunner' },
    { ns: 'Fusion', name: 'NetworkObject' },
    { ns: 'Fusion', name: 'NetworkTransform' },
    { ns: 'Photon.Voice.Unity', name: 'VoiceConnection' },
];

const targetFields = [
    'handRight', 'handLeft', 'head',
    'leftHandTransform', 'rightHandTransform',
    'headCollider', 'bodyCollider',
    '_playerRigidBody', 'leftHandFollower', 'rightHandFollower',
    '_playerId', '_displayName', '_userID',
    '_instance', '_config', 'PrefabTable', '_sources',
    'handRPos', 'handLPos', 'headPos',
    '<Instance>k__BackingField', '<playerScale>k__BackingField',
    'nuts', '_isDeveloper',
];

const results = {
    timestamp: new Date().toISOString(),
    il2cpp: { base: 0, exports: {} },
    classes: {},
    methods: {},
    fields: {},
};

// Get Il2Cpp exports using obfuscated name mapping
function getIl2CppExports() {
    let mod = Process.findModuleByName('GameAssembly.dll');
    if (!mod) mod = Process.findModuleByName('libil2cpp.so');
    if (!mod) {
        send('[dumper] ERROR: Could not find GameAssembly.dll or libil2cpp.so');
        return;
    }

    results.il2cpp.base = mod.base;
    send('[dumper] Module: ' + mod.name + ' at ' + mod.base);

    // Obfuscated export name mapping (PC build)
    const exportMap = {
        'il2cpp_class_from_name': 'HproVuNreMZ',
        'il2cpp_class_get_method_from_name': 'KDqEWzI_Ncr',
        'il2cpp_class_get_field_from_name': 'JuZhqTCbwaN',
        'il2cpp_class_get_methods': 'JzYTTuub_td',
        'il2cpp_class_get_fields': 'IqNbTfhCgfb',
        'il2cpp_class_get_name': 'KQWKgewSVtu',
        'il2cpp_class_get_namespace': 'KSo_OEFFent',
        'il2cpp_class_get_image': 'OHzvzUqyHVF',
        'il2cpp_class_get_parent': 'KT_sOCcDoKI',
        'il2cpp_method_get_name': 'aeBtWqOnmaR',
        'il2cpp_method_get_return_type': 'aIGbPTaiMUH',
        'il2cpp_method_get_param_count': 'cSoPQQHjkgq',
        'il2cpp_method_get_class': 'cgldvXYWsXQ',
        'il2cpp_method_get_flags': 'dwYNfDGtXgj',
        'il2cpp_field_get_name': 'ReadZStream',
        'il2cpp_field_get_offset': 'SMLtWlAfTKj',
        'il2cpp_field_get_type': 'SSWvhYxmbyC',
        'il2cpp_field_get_flags': 'RbezXbpmGhl',
        'il2cpp_type_get_name': 'pmcUFUmrBrx',
        'il2cpp_image_get_class_count': 'rvzJcuVvKBK',
        'il2cpp_image_get_class': 'syhCuXyJjvn',
        'il2cpp_assembly_get_image': 'FZdjZdDcViu',
        'il2cpp_domain_get': 'PjjEsAdcgAv',
        'il2cpp_domain_get_assemblies': 'PtIkrCNfgwy',
        'il2cpp_class_get_type': 'MSNHWyXTPjC',
        'il2cpp_class_instance_size': 'KtiKzLjelNO',
        'il2cpp_class_num_fields': 'KtsFmZNLMgp',
        'il2cpp_class_get_flags': 'LRDUsDwmECi',
        'il2cpp_runtime_invoke': 'ivGZXXwviiS',
        'il2cpp_string_new': 'juxaxbguEYP',
        'il2cpp_string_new_utf16': 'kHRP_zkUAyM',
        'il2cpp_gc_choose': 'TdyPYaugEie',
        'il2cpp_object_get_class': 'hNWtjCWl_uk',
        'il2cpp_class_is_valuetype': 'KvlRQblfdvO',
    };

    let foundCount = 0;
    const keys = Object.keys(exportMap);
    for (let k = 0; k < keys.length; k++) {
        const il2cppName = keys[k];
        const obfuscatedName = exportMap[il2cppName];
        try {
            const addr = Module.findExportByName(mod.name, obfuscatedName);
            if (addr && !addr.isNull()) {
                results.il2cpp.exports[il2cppName] = addr;
                foundCount++;
            }
        } catch(e) {}
    }

    send('[dumper] Found ' + foundCount + '/' + Object.keys(exportMap).length + ' Il2Cpp exports');
}

// Dump a single class
function dumpClass(ns, name) {
    const from_name = new NativeFunction(results.il2cpp.exports.il2cpp_class_from_name, 'pointer', ['pointer', 'pointer', 'pointer']);
    const get_name = new NativeFunction(results.il2cpp.exports.il2cpp_class_get_name, 'pointer', ['pointer']);
    const get_ns = new NativeFunction(results.il2cpp.exports.il2cpp_class_get_namespace, 'pointer', ['pointer']);

    const domain = new NativeFunction(results.il2cpp.exports.il2cpp_domain_get, 'pointer', [])();
    const assemblyCountBuf = Memory.alloc(4);
    const get_assemblies = new NativeFunction(results.il2cpp.exports.il2cpp_domain_get_assemblies, 'pointer', ['pointer', 'pointer']);
    const assembliesPtr = get_assemblies(domain, assemblyCountBuf);
    const assemblyCount = Memory.readU32(assemblyCountBuf);

    send('[dumper] Domain: ' + domain + ', assemblies: ' + assemblyCount);

    // Search all assemblies for the class
    let classPtr = ptr(0);
    for (let i = 0; i < assemblyCount; i++) {
        const assembly = Memory.readPointer(assembliesPtr.add(i * Process.pointerSize));
        const get_image = new NativeFunction(results.il2cpp.exports.il2cpp_assembly_get_image, 'pointer', ['pointer']);
        const image = get_image(assembly);

        if (image.isNull()) continue;

        classPtr = from_name(image, Memory.allocUtf8String(ns), Memory.allocUtf8String(name));
        if (!classPtr.isNull()) break;
    }

    if (classPtr.isNull()) return null;

    const classInfo = { namespace: ns, name: name, address: classPtr, fields: {}, methods: {} };

    // Get fields
    const get_fields = new NativeFunction(results.il2cpp.exports.il2cpp_class_get_fields, 'pointer', ['pointer', 'pointer']);
    const field_get_name = new NativeFunction(results.il2cpp.exports.il2cpp_field_get_name, 'pointer', ['pointer']);
    const field_get_offset = new NativeFunction(results.il2cpp.exports.il2cpp_field_get_offset, 'int', ['pointer']);

    let fieldIter = ptr(0);
    while (true) {
        const field = get_fields(classPtr, fieldIter);
        if (field.isNull()) break;
        fieldIter = field;

        const fname = Memory.readUtf8String(field_get_name(field));
        const foffset = field_get_offset(field);
        classInfo.fields[fname] = { offset: foffset };

        // Check if this is a target field
        if (targetFields.includes(fname)) {
            results.fields[ns + '.' + name + '.' + fname] = { offset: foffset, className: ns + '.' + name };
        }
    }

    // Get methods
    const get_methods = new NativeFunction(results.il2cpp.exports.il2cpp_class_get_methods, 'pointer', ['pointer', 'pointer']);
    const method_get_name = new NativeFunction(results.il2cpp.exports.il2cpp_method_get_name, 'pointer', ['pointer']);
    const method_get_param_count = new NativeFunction(results.il2cpp.exports.il2cpp_method_get_param_count, 'int', ['pointer']);

    let methodIter = ptr(0);
    while (true) {
        const method = get_methods(classPtr, methodIter);
        if (method.isNull()) break;
        methodIter = method;

        const mname = Memory.readUtf8String(method_get_name(method));
        const paramCount = method_get_param_count(method);
        // Method pointer is at offset 0x0 in MethodDefinition
        const methodPtr = Memory.readPointer(method.add(0x10));

        classInfo.methods[mname] = { address: methodPtr, paramCount: paramCount };

        if (!results.methods[ns + '.' + name]) results.methods[ns + '.' + name] = {};
        results.methods[ns + '.' + name][mname] = { address: '0x' + methodPtr.toString(16), paramCount: paramCount };
    }

    return classInfo;
}

// Main
rpc.exports.dump = function() {
    send('[dumper] Starting Il2Cpp dump...');

    getIl2CppExports();
    if (!results.il2cpp.exports.il2cpp_class_from_name) {
        send('[dumper] ERROR: Could not find il2cpp exports. Is the game loaded?');
        return JSON.stringify(results);
    }

    send('[dumper] Found Il2Cpp base: ' + results.il2cpp.base);

    for (const cls of targetClasses) {
        send('[dumper] Dumping ' + cls.ns + '.' + cls.name + '...');
        const info = dumpClass(cls.ns, cls.name);
        if (info) {
            results.classes[cls.ns + '.' + cls.name] = {
                address: info.address.toString(),
                fieldCount: Object.keys(info.fields).length,
                methodCount: Object.keys(info.methods).length,
            };
        } else {
            send('[dumper]   Class not found!');
        }
    }

    send('[dumper] Done. Dumped ' + Object.keys(results.classes).length + ' classes.');
    return JSON.stringify(results);
};
"""

def main():
    print("=" * 50)
    print("  Animal Company Il2Cpp Offset Dumper")
    print("=" * 50)
    print()

    try:
        import frida
    except ImportError:
        print("[!] frida not installed. Installing...")
        os.system("pip install frida frida-tools")
        import frida

    print("[*] Looking for game device...")
    print("    Make sure the game is running!")
    print()

    # Try USB device (Quest) first, then local
    device = None
    is_quest = False
    print("[*] Trying to connect to Quest via USB...")
    try:
        device = frida.get_usb_device(timeout=5)
        print(f"[+] Connected to Quest: {device.name}")
        is_quest = True
    except Exception:
        print("[-] Quest not found via USB, using local device")
        try:
            device = frida.get_local_device()
            print(f"[+] Using local PC device")
        except Exception as e:
            print(f"[-] No device found: {e}")
            return

    # Find game process
    target_pid = None
    if device:
        game_keywords = ['animalcompany', 'animal_company', 'com.animal', 'com.gorilla', 'animalcompany.exe']
        try:
            processes = device.enumerate_processes()
            print(f"[*] Scanning {len(processes)} processes...")
            for proc in processes:
                name_lower = proc.name.lower()
                if any(kw in name_lower for kw in game_keywords):
                    target_pid = proc.pid
                    print(f"[+] Found game process: {proc.name} (PID {proc.pid})")
                    break

            if not target_pid:
                print("[-] Game process not found automatically.")
                if is_quest:
                    print("    Start Animal Company on Quest, then run again.")
                    return
                # On PC, list matching processes and pick the best one
                print("    Available processes:")
                candidates = []
                for proc in processes:
                    n = proc.name.lower()
                    if any(kw in n for kw in ['animal', 'unity', 'il2cpp', 'gameassembly']):
                        candidates.append(proc)
                        print(f"      {proc.pid}  {proc.name}")
                if len(candidates) == 1:
                    target_pid = candidates[0].pid
                    print(f"[+] Auto-selected: {candidates[0].name} (PID {candidates[0].pid})")
                elif len(candidates) > 1:
                    print(f"    Multiple candidates. Using first: {candidates[0].name} (PID {candidates[0].pid})")
                    target_pid = candidates[0].pid
                else:
                    print("    No matching processes found. Is the game running?")
                    return
        except Exception as e:
            print(f"[-] Could not enumerate processes: {e}")
            return

    session = device.attach(target_pid)
    print(f"[+] Attached to PID {target_pid}")

    print("[*] Attached to game process")
    print("[*] Injecting dumper script...")

    script = session.create_script(FRIDA_SCRIPT)
    script.on('message', lambda msg, data: print(f"  [frida] {msg.get('payload', msg)}") if msg['type'] == 'send' else None)
    script.load()

    # Call the dump function
    print("[*] Running dump (this may take a few seconds)...")
    result = script.exports_sync.dump()

    # Parse and save
    data = json.loads(result)

    # Generate C++ header
    header_path = os.path.join(os.path.dirname(__file__), "..", "include", "offsets_generated.h")
    os.makedirs(os.path.dirname(header_path), exist_ok=True)

    with open(header_path, "w") as f:
        f.write("#pragma once\n")
        f.write("// AUTO-GENERATED by dumper.py - Do not edit\n")
        f.write(f"// Generated: {data['timestamp']}\n")
        f.write("#include <cstdint>\n\n")
        f.write("namespace offsets {\n\n")

        # Field offsets
        f.write("    // === Field Offsets (from Il2Cpp runtime) ===\n")
        f.write("    // These are the actual runtime offsets, not static analysis\n")
        f.write("    // Usage: read<T>(classInstance + offsets::ClassName::FieldName)\n\n")

        # Group by class
        class_fields = {}
        for key, info in data.get('fields', {}).items():
            cls = info['className']
            if cls not in class_fields:
                class_fields[cls] = {}
            field_name = key.split('.')[-1]
            class_fields[cls][field_name] = info['offset']

        for cls_name, fields in sorted(class_fields.items()):
            ns_parts = cls_name.split('.')
            namespace = '_'.join(ns_parts)
            f.write(f"    namespace {namespace} {{\n")
            f.write(f"        // {cls_name}\n")
            for field_name, offset in sorted(fields.items()):
                f.write(f"        constexpr uint32_t {field_name} = 0x{offset:X};\n")
            f.write(f"    }}\n\n")

        # Method info
        f.write("    // === Method Addresses ===\n")
        f.write("    // Runtime method pointers - use these to call/hook methods\n\n")
        for cls_name, methods in sorted(data.get('methods', {}).items()):
            ns_parts = cls_name.split('.')
            namespace = '_'.join(ns_parts)
            f.write(f"    namespace {namespace} {{\n")
            for method_name, minfo in sorted(methods.items()):
                f.write(f"        constexpr uint64_t {method_name} = {minfo['address']};  // params: {minfo['paramCount']}\n")
            f.write(f"    }}\n\n")

        f.write("}  // namespace offsets\n")

    print(f"\n[+] Generated: {header_path}")

    # Save full JSON dump
    json_path = os.path.join(os.path.dirname(__file__), "dump.json")
    with open(json_path, "w") as f:
        json.dump(data, f, indent=2, default=str)
    print(f"[+] Full dump saved: {json_path}")

    # Print summary
    print(f"\n{'=' * 50}")
    print(f"  Dump Summary")
    print(f"{'=' * 50}")
    print(f"  Il2Cpp Base: {data['il2cpp']['base']}")
    print(f"  Classes Found: {len(data.get('classes', {}))}")
    print(f"  Fields Found: {len(data.get('fields', {}))}")
    print(f"  Methods Found: {sum(len(m) for m in data.get('methods', {}).values())}")

    print(f"\n  Next steps:")
    print(f"  1. Open include/offsets_generated.h")
    print(f"  2. Copy the offsets into include/offsets.h")
    print(f"  3. Build the overlay: setup.bat")

    session.detach()


if __name__ == "__main__":
    main()
