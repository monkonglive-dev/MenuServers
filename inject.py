import frida
import sys
import os
import json
import urllib.request
import time
import argparse

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BYPASSED_DIR = os.path.join(SCRIPT_DIR, "Bypassed")
SCRIPTS_JSON = os.path.join(SCRIPT_DIR, "scripts.json")
GAME_NAME = "AnimalCompany.exe"
GAME_PATH = r"C:\Program Files (x86)\Steam\steamapps\common\Animal Company\AnimalCompany.exe"


def load_scripts_config():
    if not os.path.exists(SCRIPTS_JSON):
        print(f"[!] scripts.json not found at {SCRIPTS_JSON}")
        return None
    with open(SCRIPTS_JSON, "r") as f:
        return json.load(f)


def download_script(url, dest):
    if not url:
        return False
    try:
        print(f"  Downloading {os.path.basename(dest)}...")
        urllib.request.urlretrieve(url, dest)
        return True
    except Exception as e:
        print(f"  Failed to download {os.path.basename(dest)}: {e}")
        return False


def resolve_scripts(mode, config):
    scripts = []
    cfg_scripts = config.get("scripts", {})
    base_url = config.get("base_url", "")

    subfolder_map = {"eac.ts": "Bypassed", "stuff.js": "Bypassed"}

    for name, info in cfg_scripts.items():
        always = info.get("always", False)
        modes = info.get("modes", [])
        url = info.get("url", "")
        local = info.get("local", "")

        if not local:
            continue

        subfolder = subfolder_map.get(local, "")
        if subfolder:
            local_path = os.path.join(SCRIPT_DIR, subfolder, local)
        else:
            local_path = os.path.join(SCRIPT_DIR, local)

        if always or mode in modes or mode == "all":
            if url and not os.path.exists(local_path):
                full_url = url if url.startswith("http") else f"{base_url.rstrip('/')}{url}"
                download_script(full_url, local_path)

            if os.path.exists(local_path):
                scripts.append(local_path)
            else:
                print(f"  [!] Script not found: {local}")

    return scripts


def inject_scripts(scripts, spawn=False):
    if not scripts:
        print("[!] No scripts to inject")
        return

    script_names = [os.path.basename(s) for s in scripts]
    print(f"\n[*] Injecting {len(scripts)} script(s): {', '.join(script_names)}")

    try:
        if spawn:
            print(f"[*] Spawning {GAME_NAME}...")
            pid = frida.spawn([GAME_PATH])
            device = frida.get_local_device()
            session = device.attach(pid)
            print(f"[*] Spawned with PID {pid}")
            frida.resume(pid)
        else:
            print(f"[*] Attaching to {GAME_NAME}...")
            session = frida.attach(GAME_NAME)
            print("[*] Attached")

        loaded = []
        for script_path in scripts:
            try:
                with open(script_path, "r", encoding="utf-8") as f:
                    source = f.read()
                name = os.path.basename(script_path)
                frida_script = session.create_script(source, name=name)
                frida_script.load()
                loaded.append(name)
                print(f"  [+] Loaded {name}")
            except Exception as e:
                print(f"  [!] Failed to load {os.path.basename(script_path)}: {e}")

        print(f"\n[*] {len(loaded)}/{len(scripts)} scripts loaded successfully")
        print("[*] Press Ctrl+C to detach\n")

        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n[*] Detaching...")
            session.detach()
            print("[*] Done")

    except frida.ProcessNotFoundError:
        print(f"[!] {GAME_NAME} not found. Is the game running?")
    except frida.ServerNotRunningError:
        print("[!] Frida server not running. Start frida-server first.")
    except Exception as e:
        print(f"[!] Injection error: {e}")


def main():
    parser = argparse.ArgumentParser(description="MonksMenu Frida Injector")
    parser.add_argument("mode", nargs="?", default="menu",
                        choices=["menu", "eac", "pcmode", "quest", "all"],
                        help="Injection mode (default: menu)")
    parser.add_argument("--spawn", action="store_true",
                        help="Spawn the game instead of attaching")
    parser.add_argument("--download-only", action="store_true",
                        help="Only download scripts, don't inject")
    parser.add_argument("--list", action="store_true",
                        help="List available scripts for current mode")

    args = parser.parse_args()

    print("=" * 45)
    print("  MONKSMENU INJECTOR")
    print(f"  Mode: {args.mode.upper()}")
    print("=" * 45)

    config = load_scripts_config()
    if not config:
        sys.exit(1)

    scripts = resolve_scripts(args.mode, config)

    if args.list:
        print(f"\nScripts for mode '{args.mode}':")
        for s in scripts:
            print(f"  - {os.path.basename(s)}")
        return

    if args.download_only:
        print("\nDownload complete.")
        return

    inject_scripts(scripts, spawn=args.spawn)


if __name__ == "__main__":
    main()
