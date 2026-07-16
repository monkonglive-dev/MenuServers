import tkinter as tk
from tkinter import messagebox
import subprocess, threading, os, sys, time, urllib.request, glob, random
from datetime import datetime

BASE_URL = "https://raw.githubusercontent.com/monkonglive-dev/MenuServers/main"
SCRIPT_DIR = os.path.join(os.environ.get("TEMP", os.path.expanduser("~")), "monkong_scripts")
TARGET_PROCESS = "animalcompany.exe"

EMOJIS = ["\U0001F525","\U0001F3AE","\U0001F3AF","\U0001F4A5","\U0001F480",
          "\U0001F3B2","\U0001F3C6","\U0001F5E1","\U0001F4E3","\U0001F4A3",
          "\U0001F680","\U0001F31F","\U0001F47E","\U0001F383","\U0001F984",
          "\U0001F6E1","\U0001F52B","\U0001F576","\U0001F4A0","\u2694"]

MODES = {
    "FULL MENU": {
        "desc": "Bypass and load all features",
        "files": [
            ("01_bridge.js", "frida-il2cpp-bridge.js"),
            ("02_symbols.js", "symbols.js"),
            ("03_eac.js", "Bypassed/eac.js"),
            ("04_stuff.js", "Bypassed/stuff.js"),
            ("05_menu.js", "MonksMenu.js"),
            ("06_quest.js", "m4quest.js"),
            ("07_rpc.js", "discordrpc.js"),
        ],
    },
    "QUEST + BYPASS": {
        "desc": "Run bypass with Quest-compatible matching",
        "files": [
            ("01_bridge.js", "frida-il2cpp-bridge.js"),
            ("02_symbols.js", "symbols.js"),
            ("03_eac.js", "Bypassed/eac.js"),
            ("04_stuff.js", "Bypassed/stuff.js"),
            ("05_quest.js", "m4quest.js"),
        ],
    },
    "EAC DEFUSER": {
        "desc": "Bypass anti-cheat only",
        "files": [
            ("01_bridge.js", "frida-il2cpp-bridge.js"),
            ("02_symbols.js", "symbols.js"),
            ("03_eac.js", "Bypassed/eac.js"),
            ("04_stuff.js", "Bypassed/stuff.js"),
        ],
    },
    "MENU ONLY": {
        "desc": "Menu with bridge and symbols",
        "files": [
            ("01_bridge.js", "frida-il2cpp-bridge.js"),
            ("02_symbols.js", "symbols.js"),
            ("03_menu.js", "MonksMenu.js"),
        ],
    },
}

BG      = "#1a0508"
PANEL   = "#2a0a0e"
PANEL2  = "#3a0f14"
BORDER  = "#5a1a20"
ACCENT  = "#ff4444"
RED     = "#ff6666"
GREEN   = "#ff4444"
YELLOW  = "#ff8800"
TXT     = "#ffcccc"
DIM     = "#aa5555"
BRIGHT  = "#ffffff"


class LoaderApp:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Monkongs Loader v1.0.0")
        self.root.geometry("960x640")
        self.root.configure(bg=BG)
        self.root.resizable(False, False)
        self.selected_mode = tk.StringVar(value="")
        self.running = False
        self.process_found = False
        self.emoji_data = []
        self.build_ui()
        self.spawn_emojis()
        self.tick_emojis()
        self.check_process()

    def spawn_emojis(self):
        for _ in range(35):
            em = random.choice(EMOJIS)
            x = random.randint(20, 940)
            y = random.randint(20, 620)
            sz = random.randint(16, 32)
            gray = random.randint(30, 70)
            c = f"#{gray:02x}{gray//4:02x}{gray//3:02x}"
            item = self.canvas.create_text(x, y, text=em, font=("Segoe UI Emoji", sz), fill=c)
            dx = random.uniform(-0.4, 0.4)
            dy = random.uniform(-0.3, 0.3)
            self.emoji_data.append([item, dx, dy])

    def tick_emojis(self):
        for ed in self.emoji_data:
            item, dx, dy = ed
            self.canvas.move(item, dx, dy)
            pos = self.canvas.coords(item)
            if pos:
                x, y = pos[0], pos[1]
                if x < -20 or x > 980: ed[1] = -dx
                if y < -20 or y > 660: ed[2] = -dy
        self.root.after(60, self.tick_emojis)

    def build_ui(self):
        c = tk.Canvas(self.root, width=960, height=640, bg=BG, highlightthickness=0)
        c.place(x=0, y=0)
        self.canvas = c

        outer = tk.Frame(self.root, bg=BG)
        outer.place(x=0, y=0, relwidth=1, relheight=1)
        outer.lift()

        title = tk.Frame(outer, bg="#120204", height=38)
        title.pack(fill="x")
        title.pack_propagate(False)
        tk.Label(title, text="\u2605 MONKONGS // LOADER v1.0.0", bg="#120204", fg=ACCENT,
                 font=("Consolas", 12, "bold"), padx=12).pack(side="left")
        self.tgt_lbl = tk.Label(title, text="LOCAL RUNTIME", bg="#120204", fg=DIM,
                                 font=("Consolas", 9))
        self.tgt_lbl.pack(side="right", padx=12)

        hdr = tk.Frame(outer, bg=PANEL, height=40)
        hdr.pack(fill="x", padx=6, pady=(4, 2))
        hdr.pack_propagate(False)
        self.rdot = tk.Label(hdr, text="\u25cf", bg=PANEL, fg=ACCENT, font=("Consolas", 14))
        self.rdot.pack(side="left", padx=(8, 4))
        self.rtxt = tk.Label(hdr, text="READY", bg=PANEL, fg=ACCENT, font=("Consolas", 11, "bold"))
        self.rtxt.pack(side="left")
        tk.Label(hdr, text=" All checks operational.", bg=PANEL, fg=DIM,
                 font=("Consolas", 10)).pack(side="left")
        self.tgt2 = tk.Label(hdr, text="TARGET: ...", bg=PANEL, fg=DIM, font=("Consolas", 9))
        self.tgt2.pack(side="right", padx=10)

        body = tk.Frame(outer, bg=BG)
        body.pack(fill="both", expand=True, padx=6, pady=(2, 6))

        left = tk.Frame(body, bg=PANEL, width=230, highlightbackground=BORDER, highlightthickness=1)
        left.pack(side="left", fill="y", padx=(0, 6))
        left.pack_propagate(False)

        tk.Label(left, text="\u2605 CONTROLS", bg=PANEL, fg=ACCENT, font=("Consolas", 11, "bold"),
                 anchor="w", padx=10).pack(fill="x", pady=(10, 5))

        bf = tk.Frame(left, bg=PANEL)
        bf.pack(fill="x", padx=10)
        self.btn_repair = tk.Button(bf, text="REPAIR INSTALLATION", bg=PANEL2, fg=TXT,
                                     font=("Consolas", 9, "bold"), relief="flat", bd=0, padx=8, pady=6,
                                     activebackground=ACCENT, activeforeground=BRIGHT, cursor="hand2",
                                     command=self.repair_install)
        self.btn_repair.pack(fill="x", pady=2)
        self.btn_check = tk.Button(bf, text="RUN SYSTEM CHECK", bg=PANEL2, fg=TXT,
                                    font=("Consolas", 9, "bold"), relief="flat", bd=0, padx=8, pady=6,
                                    activebackground=ACCENT, activeforeground=BRIGHT, cursor="hand2",
                                    command=self.system_check)
        self.btn_check.pack(fill="x", pady=2)
        self.btn_stop = tk.Button(bf, text="STOP ACTIVE", bg="#3d1214", fg=RED,
                                   font=("Consolas", 9, "bold"), relief="flat", bd=0, padx=8, pady=6,
                                   activebackground=RED, activeforeground=BRIGHT, cursor="hand2",
                                   command=self.stop_injection)
        self.btn_stop.pack(fill="x", pady=2)

        tk.Label(left, text="\u2605 INFO", bg=PANEL, fg=ACCENT, font=("Consolas", 11, "bold"),
                 anchor="w", padx=10).pack(fill="x", pady=(14, 5))
        for k, v in [("VERSION","v1.0.0"),("PLATFORM","PC / Steam"),("ENGINE","Unity IL2CPP"),("BRIDGE","Frida")]:
            r = tk.Frame(left, bg=PANEL)
            r.pack(fill="x", padx=10)
            tk.Label(r, text=k, bg=PANEL, fg=DIM, font=("Consolas", 8), width=12, anchor="w").pack(side="left")
            tk.Label(r, text=v, bg=PANEL, fg=BRIGHT, font=("Consolas", 8, "bold"), anchor="w").pack(side="left")

        tk.Label(left, text="\u2605 DEPENDENCIES", bg=PANEL, fg=ACCENT, font=("Consolas", 11, "bold"),
                 anchor="w", padx=10).pack(fill="x", pady=(14, 5))
        df = tk.Frame(left, bg=PANEL)
        df.pack(fill="x", padx=10)
        self.dep_dots = {}
        for dep in ["python", "frida", "frida-tools"]:
            r = tk.Frame(df, bg=PANEL)
            r.pack(fill="x", pady=1)
            d = tk.Label(r, text="\u25cf", bg=PANEL, fg=ACCENT, font=("Consolas", 8))
            d.pack(side="left", padx=(0, 4))
            tk.Label(r, text=dep, bg=PANEL, fg=TXT, font=("Consolas", 8), anchor="w").pack(side="left")
            self.dep_dots[dep] = d

        tk.Label(left, text="\u2605 INJECTION FILES", bg=PANEL, fg=ACCENT, font=("Consolas", 11, "bold"),
                 anchor="w", padx=10).pack(fill="x", pady=(14, 5))
        self.files_frame = tk.Frame(left, bg=PANEL)
        self.files_frame.pack(fill="x", padx=10, pady=(0, 10))

        right = tk.Frame(body, bg=PANEL, highlightbackground=BORDER, highlightthickness=1)
        right.pack(side="left", fill="both", expand=True)

        tk.Label(right, text="\u2605 INJECTION TARGET", bg=PANEL, fg=ACCENT, font=("Consolas", 11, "bold"),
                 anchor="w", padx=14).pack(fill="x", pady=(10, 2))
        self.tgt_name = tk.Label(right, text="ANIMAL COMPANY", bg=PANEL, fg=BRIGHT,
                                  font=("Consolas", 13, "bold"), anchor="w", padx=14)
        self.tgt_name.pack(fill="x")

        tk.Label(right, text="SELECT LAUNCH MODE", bg=PANEL, fg=ACCENT, font=("Consolas", 11, "bold"),
                 anchor="w", padx=14).pack(fill="x", pady=(14, 6))

        for name, cfg in MODES.items():
            f = tk.Frame(right, bg=PANEL2, highlightbackground=BORDER, highlightthickness=1)
            f.pack(fill="x", padx=14, pady=3)
            tk.Radiobutton(f, variable=self.selected_mode, value=name, bg=PANEL2, fg=BRIGHT,
                            activebackground=PANEL2, activeforeground=ACCENT, selectcolor=BORDER,
                            font=("Consolas", 11, "bold"), indicatoron=False, padx=12, pady=6,
                            anchor="w", command=self.on_mode_select).pack(fill="x")
            tk.Label(f, text=cfg["desc"], bg=PANEL2, fg=DIM, font=("Consolas", 9), anchor="w",
                     padx=28).pack(fill="x", pady=(0, 5))

        self.launch_btn = tk.Button(right, text="SELECT A LAUNCH MODE", bg=PANEL2, fg=DIM,
                                     font=("Consolas", 13, "bold"), relief="flat", bd=0, pady=10,
                                     activebackground=ACCENT, activeforeground=BRIGHT, cursor="hand2",
                                     command=self.start_injection)
        self.launch_btn.pack(fill="x", padx=14, pady=(14, 6))

        self.status_bar = tk.Label(right, text="Status: ready", bg=PANEL, fg=ACCENT,
                                    font=("Consolas", 10), anchor="w", padx=14)
        self.status_bar.pack(fill="x")

        tk.Label(right, text="\u2605 SYSTEM EVENTS", bg=PANEL, fg=ACCENT, font=("Consolas", 11, "bold"),
                 anchor="w", padx=14).pack(fill="x", pady=(10, 4))

        lf = tk.Frame(right, bg="#1a0508", highlightbackground=BORDER, highlightthickness=1)
        lf.pack(fill="both", expand=True, padx=14, pady=(0, 10))
        self.log_text = tk.Text(lf, bg="#1a0508", fg=ACCENT, font=("Consolas", 9),
                                 insertbackground=ACCENT, relief="flat", bd=0, wrap="word",
                                 state="disabled", highlightthickness=0)
        sb = tk.Scrollbar(lf, command=self.log_text.yview, bg=BG, troughcolor=BG, highlightthickness=0)
        self.log_text.configure(yscrollcommand=sb.set)
        sb.pack(side="right", fill="y")
        self.log_text.pack(fill="both", expand=True)

        self.log(f"[{datetime.now().strftime('%H:%M:%S')}] Launcher initialized.")
        self.log("Waiting for user action...")

    def log(self, msg):
        def _a():
            self.log_text.configure(state="normal")
            self.log_text.insert("end", msg + "\n")
            self.log_text.see("end")
            self.log_text.configure(state="disabled")
        self.root.after(0, _a)

    def set_status(self, text, color=GREEN):
        self.root.after(0, lambda: self.status_bar.config(text=f"Status: {text}", fg=color))

    def set_ready(self, ready=True, text=""):
        def _s():
            self.rdot.config(fg=ACCENT if ready else YELLOW)
            self.rtxt.config(text="READY" if ready else (text or "BUSY"), fg=ACCENT if ready else YELLOW)
        self.root.after(0, _s)

    def on_mode_select(self):
        m = self.selected_mode.get()
        if m:
            self.launch_btn.config(text=f"START {m}", bg="#801010", fg=BRIGHT)
            self.log(f"[{datetime.now().strftime('%H:%M:%S')}] Mode selected: {m}")

    def check_process(self):
        try:
            r = subprocess.run(["powershell", "-Command",
                f"if(Get-Process -Name 'animalcompany' -EA 0){{'FOUND'}}else{{'NO'}}"],
                capture_output=True, text=True, timeout=5)
            if "FOUND" in r.stdout:
                self.process_found = True
                self.tgt2.config(text="TARGET: ANIMAL COMPANY", fg=GREEN)
            else:
                self.process_found = False
                self.tgt2.config(text="TARGET: NOT DETECTED", fg=RED)
        except:
            self.tgt2.config(text="TARGET: UNKNOWN", fg=YELLOW)
        self.root.after(3000, self.check_process)

    def check_deps(self):
        self.log(f"[{datetime.now().strftime('%H:%M:%S')}] Checking dependencies...")
        for dep in ["python", "frida", "frida-tools"]:
            try:
                r = subprocess.run([sys.executable, "-m", "pip", "show", dep.replace("-","_")],
                                    capture_output=True, text=True, timeout=10)
                ok = r.returncode == 0
                self.dep_dots[dep].config(fg=ACCENT if ok else YELLOW)
                self.log(f"  [{'+'if ok else '-'}] {dep}: {'installed' if ok else 'missing'}")
            except:
                self.dep_dots[dep].config(fg=RED)
                self.log(f"  [!] {dep}: check failed")

    def repair_install(self):
        self.log(f"[{datetime.now().strftime('%H:%M:%S')}] Repairing installation...")
        self.set_ready(False, "REPAIRING")
        self.set_status("installing dependencies...", YELLOW)
        def _r():
            for dep in ["frida", "frida-tools"]:
                try:
                    subprocess.run([sys.executable, "-m", "pip", "install", dep, "--upgrade"],
                                   capture_output=True, timeout=120)
                    self.log(f"  [+] {dep} updated")
                except Exception as e:
                    self.log(f"  [!] {dep} failed: {e}")
            self.root.after(0, lambda: self.check_deps())
            self.root.after(0, lambda: self.set_ready(True))
            self.root.after(0, lambda: self.set_status("repair complete", GREEN))
        threading.Thread(target=_r, daemon=True).start()

    def system_check(self):
        self.log(f"[{datetime.now().strftime('%H:%M:%S')}] Running system check...")
        self.check_deps()
        self.log(f"  [{'+'if self.process_found else '-'}] {TARGET_PROCESS} {'detected' if self.process_found else 'not found'}")
        self.set_status("system check complete", GREEN)

    def update_files_list(self, files):
        for w in self.files_frame.winfo_children():
            w.destroy()
        self.file_status = []
        for local, remote in files:
            r = tk.Frame(self.files_frame, bg=PANEL)
            r.pack(fill="x", pady=1)
            tk.Label(r, text="\u2022", bg=PANEL, fg=DIM, font=("Consolas", 8)).pack(side="left", padx=(0,4))
            tk.Label(r, text=local, bg=PANEL, fg=TXT, font=("Consolas", 8), anchor="w").pack(side="left")
            s = tk.Label(r, text="pending", bg=PANEL, fg=DIM, font=("Consolas", 8))
            s.pack(side="right")
            self.file_status.append(s)

    def start_injection(self):
        mode_name = self.selected_mode.get()
        if not mode_name:
            messagebox.showinfo("Monkongs", "Select a launch mode first.")
            return
        if self.running:
            messagebox.showinfo("Monkongs", "Already running.")
            return
        mode = MODES[mode_name]
        self.update_files_list(mode["files"])
        self.running = True
        self.set_ready(False, "INJECTING")
        self.set_status("downloading scripts...", YELLOW)
        def _run():
            try:
                self._download(mode)
                self.root.after(0, lambda: self.set_status("waiting for M key...", YELLOW))
                self.log(f"[{datetime.now().strftime('%H:%M:%S')}] Load into game, then press M to inject...")
                self._wait_m()
                self.root.after(0, lambda: self.set_status("injecting...", YELLOW))
                self._inject(mode)
                self.root.after(0, lambda: self.set_status("injection complete", GREEN))
                self.root.after(0, lambda: self.set_ready(True))
                self.log(f"[{datetime.now().strftime('%H:%M:%S')}] Successfully sideloaded {mode_name}!")
            except Exception as e:
                self.log(f"[{datetime.now().strftime('%H:%M:%S')}] ERROR: {e}")
                self.root.after(0, lambda: self.set_status("injection failed", RED))
                self.root.after(0, lambda: self.set_ready(True))
            finally:
                self.running = False
                self._cleanup()
        threading.Thread(target=_run, daemon=True).start()

    def _download(self, mode):
        if os.path.exists(SCRIPT_DIR):
            import shutil
            shutil.rmtree(SCRIPT_DIR, ignore_errors=True)
        os.makedirs(SCRIPT_DIR, exist_ok=True)
        cb = str(random.randint(10000, 99999))
        for i, (local, remote) in enumerate(mode["files"]):
            url = f"{BASE_URL}/{remote}?v={cb}"
            dest = os.path.join(SCRIPT_DIR, local)
            self.log(f"[{datetime.now().strftime('%H:%M:%S')}] Downloading {local}...")
            try:
                req = urllib.request.Request(url, headers={"Cache-Control": "no-cache"})
                data = urllib.request.urlopen(req, timeout=15).read().decode("utf-8")
                with open(dest, "w", encoding="utf-8") as f:
                    f.write(data)
                self.log(f"  [+] Downloaded: {local}")
                if i < len(self.file_status):
                    self.root.after(0, lambda idx=i: self.file_status[idx].config(text="ready", fg=ACCENT))
            except Exception as e:
                self.log(f"  [!] Failed: {local} - {e}")

    def _wait_m(self):
        import ctypes
        u = ctypes.windll.user32
        while True:
            if u.GetAsyncKeyState(0x4D) & 0x8000:
                break
            time.sleep(0.05)

    def _inject(self, mode):
        js = sorted(glob.glob(os.path.join(SCRIPT_DIR, "*.js")))
        if not js:
            self.log("  [!] No JS files!")
            return
        args = ["frida", "-n", TARGET_PROCESS, "--runtime=v8"]
        for f in js:
            args.extend(["-l", f])
        self.log(f"[{datetime.now().strftime('%H:%M:%S')}] Running frida with {len(js)} scripts...")
        r = subprocess.run(args, capture_output=True, text=True, timeout=60)
        if r.stdout:
            for line in r.stdout.strip().split("\n")[-5:]:
                self.log(f"  {line}")

    def _cleanup(self):
        try:
            import shutil
            if os.path.exists(SCRIPT_DIR):
                shutil.rmtree(SCRIPT_DIR, ignore_errors=True)
        except:
            pass

    def stop_injection(self):
        if self.running:
            self.log(f"[{datetime.now().strftime('%H:%M:%S')}] Stopping...")
            self.running = False
            try:
                subprocess.run(["taskkill", "/IM", "frida.exe", "/F"], capture_output=True, timeout=5)
            except:
                pass
            self.set_status("stopped", RED)
            self.set_ready(True)
        else:
            self.log("Nothing to stop.")

    def run(self):
        self.root.mainloop()


if __name__ == "__main__":
    LoaderApp().run()
