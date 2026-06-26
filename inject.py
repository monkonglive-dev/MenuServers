import frida
import sys
import os
import json
import urllib.request
import time
import argparse
import tempfile
import shutil

GAME_NAME = "AnimalCompany.exe"
GAME_PATH = r"C:\Program Files (x86)\Steam\steamapps\common\Animal Company\AnimalCompany.exe"
BASE_URL = "https://raw.githubusercontent.com/monkonglive-dev/MenuServers/main"

SCRIPTS = {
    "bridge":  {"url": "/frida-il2cpp-bridge.js", "always": True},
    "symbols": {"url": "/symbols.ts",             "always": True},
    "menu":    {"url": "/MonksMenu.ts",           "modes": ["menu", "all"]},
    "eac":     {"url": "/eac.ts",                 "modes": ["eac", "all", "pcmode"]},
    "stuff":   {"url": "/stuff.js",               "modes": ["eac", "all", "pcmode"]},
    "pcmode":  {"url": "/pcmode.ts",              "modes": ["pcmode"]},
    "quest":   {"url": "/m4quest.ts",             "modes": ["quest", "all"]},
    "rpc":     {"url": "/discordrpc.ts",          "modes": ["all"]},
}


def fetch(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "MonksMenu/1.0"})
        return urllib.request.urlopen(req, timeout=15).read().decode("utf-8")
    except Exception as e:
        print(f"  [!] Failed: {e}")
        return None


def get_mode_scripts(mode):
    out = []
    for name, info in SCRIPTS.items():
        always = info.get("always", False)
        modes = info.get("modes", [])
        if always or mode in modes or mode == "all":
            out.append({"name": name, "url": f"{BASE_URL}{info['url']}"})
    return out


def inject(scripts, spawn=False):
    tmpdir = tempfile.mkdtemp(prefix="monkong_")
    print(f"\n[*] Temp folder: {tmpdir}")
    print(f"[*] Fetching {len(scripts)} script(s) from web...\n")

    loaded = []
    for s in scripts:
        print(f"  Reading web response: {s['name']}...")
        source = fetch(s["url"])
        if source:
            path = os.path.join(tmpdir, s["name"] + ".tmp")
            with open(path, "w", encoding="utf-8") as f:
                f.write(source)
            loaded.append((s["name"], path, source))
            print(f"  [+] Got {s['name']} ({len(source)} bytes)")
        else:
            print(f"  [!] Skipped {s['name']}")

    if not loaded:
        print("[!] No scripts fetched")
        shutil.rmtree(tmpdir, ignore_errors=True)
        return

    try:
        if spawn:
            print(f"\n[*] Spawning {GAME_NAME}...")
            pid = frida.spawn([GAME_PATH])
            session = frida.get_local_device().attach(pid)
            print(f"[*] Spawned PID {pid}")
            frida.resume(pid)
        else:
            print(f"\n[*] Attaching to {GAME_NAME}...")
            session = frida.attach(GAME_NAME)
            print("[*] Attached")

        for name, path, source in loaded:
            try:
                script = session.create_script(source, name=name)
                script.load()
                print(f"  [+] Injected {name}")
            except Exception as e:
                print(f"  [!] Failed {name}: {e}")

        print(f"\n[*] {len(loaded)} script(s) injected into memory")
        print("[*] Cleaning up temp files...")
        shutil.rmtree(tmpdir, ignore_errors=True)
        print("[*] Temp folder deleted - nothing on disk")
        print("[*] Press Ctrl+C to detach\n")

        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n[*] Detaching...")
            session.detach()
            print("[*] Done")

    except frida.ProcessNotFoundError:
        print(f"[!] {GAME_NAME} not found")
        shutil.rmtree(tmpdir, ignore_errors=True)
    except Exception as e:
        print(f"[!] Error: {e}")
        shutil.rmtree(tmpdir, ignore_errors=True)


def main():
    parser = argparse.ArgumentParser(description="MonksMenu Injector")
    parser.add_argument("mode", nargs="?", default="menu",
                        choices=["menu", "eac", "pcmode", "quest", "all"])
    parser.add_argument("--spawn", action="store_true")
    args = parser.parse_args()

    print("=" * 50)
    print("  MONKSMENU INJECTOR - Web Transmission Mode")
    print(f"  Mode: {args.mode.upper()}")
    print("  Scripts are fetched from web, injected,")
    print("  then deleted. Nothing saved locally.")
    print("=" * 50)

    scripts = get_mode_scripts(args.mode)
    inject(scripts, spawn=args.spawn)


if __name__ == "__main__":
    main()
