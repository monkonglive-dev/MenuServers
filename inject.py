import frida
import sys
import os
import json
import urllib.request
import time
import argparse

SCRIPTS_JSON = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scripts.json")
GAME_NAME = "AnimalCompany.exe"
GAME_PATH = r"C:\Program Files (x86)\Steam\steamapps\common\Animal Company\AnimalCompany.exe"


def load_config():
    with open(SCRIPTS_JSON, "r") as f:
        return json.load(f)


def fetch_script(url):
    if not url:
        return None
    try:
        full_url = url if url.startswith("http") else url
        req = urllib.request.Request(full_url, headers={"User-Agent": "MonksMenu/1.0"})
        resp = urllib.request.urlopen(req, timeout=15)
        source = resp.read().decode("utf-8")
        return source
    except Exception as e:
        print(f"  [!] Failed to fetch {url}: {e}")
        return None


def get_scripts_for_mode(mode, config):
    base_url = config.get("base_url", "")
    scripts = []
    for name, info in config.get("scripts", {}).items():
        always = info.get("always", False)
        modes = info.get("modes", [])
        url = info.get("url", "")
        if not url:
            continue
        if always or mode in modes or mode == "all":
            full_url = url if url.startswith("http") else f"{base_url.rstrip('/')}{url}"
            scripts.append({"name": name, "url": full_url})
    return scripts


def inject(scripts, spawn=False):
    if not scripts:
        print("[!] No scripts to inject")
        return

    print(f"\n[*] Reading web stream... fetching {len(scripts)} script(s)")

    loaded_sources = []
    for s in scripts:
        print(f"  Reading web response: {s['name']}...")
        source = fetch_script(s["url"])
        if source:
            loaded_sources.append((s["name"], source))
            print(f"  [+] Got {s['name']} ({len(source)} bytes)")
        else:
            print(f"  [!] Skipped {s['name']}")

    if not loaded_sources:
        print("[!] No scripts fetched")
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

        for name, source in loaded_sources:
            try:
                script = session.create_script(source, name=name)
                script.load()
                print(f"  [+] Injected {name}")
            except Exception as e:
                print(f"  [!] Failed {name}: {e}")

        print(f"\n[*] {len(loaded_sources)} script(s) injected into memory")
        print("[*] No files saved locally - all transmitted")
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
    except Exception as e:
        print(f"[!] Error: {e}")


def main():
    parser = argparse.ArgumentParser(description="MonksMenu Injector")
    parser.add_argument("mode", nargs="?", default="menu",
                        choices=["menu", "eac", "pcmode", "quest", "all"])
    parser.add_argument("--spawn", action="store_true")
    args = parser.parse_args()

    print("=" * 45)
    print("  MONKSMENU INJECTOR")
    print(f"  Mode: {args.mode.upper()}")
    print("  Scripts are fetched from web, not saved locally")
    print("=" * 45)

    config = load_config()
    scripts = get_scripts_for_mode(args.mode, config)
    inject(scripts, spawn=args.spawn)


if __name__ == "__main__":
    main()
