import tkinter as tk
from tkinter import ttk, messagebox
import subprocess, threading, os, sys, time, json, urllib.request, glob, random
from datetime import datetime

BASE_URL = "https://raw.githubusercontent.com/monkonglive-dev/MenuServers/main"
SCRIPT_DIR = os.path.join(os.environ.get("TEMP", os.path.expanduser("~")), "monkong_scripts")
TARGET_PROCESS = "animalcompany.exe"

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
        "tag": "all",
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
        "tag": "quest",
    },
    "EAC DEFUSER": {
        "desc": "Bypass anti-cheat only",
        "files": [
            ("01_bridge.js", "frida-il2cpp-bridge.js"),
            ("02_symbols.js", "symbols.js"),
            ("03_eac.js", "Bypassed/eac.js"),
            ("04_stuff.js", "Bypassed/stuff.js"),
        ],
        "tag": "eac",
    },
    "MENU ONLY": {
        "desc": "Menu with bridge and symbols",
        "files": [
            ("01_bridge.js", "frida-il2cpp-bridge.js"),
            ("02_symbols.js", "symbols.js"),
            ("03_menu.js", "MonksMenu.js"),
        ],
        "tag": "menu",
    },
}


class LoaderApp:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Monkongs Loader v1.0.0")
        self.root.geometry("900x620")
        self.root.configure(bg="#0a0e1a")
        self.root.resizable(False, False)
        self.selected_mode = tk.StringVar(value="")
        self.running = False
        self.process_found = False
        self.build_ui()
        self.check_process()

    def build_ui(self):
        BG = "#0a0e1a"
        PANEL = "#0f1424"
        BORDER = "#1a2040"
        ACCENT = "#3b82f6"
        RED = "#ef4444"
        GREEN = "#22c55e"
        YELLOW = "#eab308"
        TXT = "#c8d0e0"
        DIM = "#556080"

        style = ttk.Style()
        style.theme_use("clam")
        style.configure("TRadiobutton", background=PANEL, foreground=TXT, font=("Consolas", 11), indicatorcolor=BORDER)
        style.map("TRadiobutton", indicatorcolor=[("active", ACCENT), ("selected", ACCENT)])
        style.configure("TButton", background=BORDER, foreground=TXT, font=("Consolas", 10, "bold"), padding=6)
        style.map("TButton", background=[("active", ACCENT)])

        title_bar = tk.Frame(self.root, bg="#060914", height=36)
        title_bar.pack(fill="x")
        title_bar.pack_propagate(False)
        tk.Label(title_bar, text="MONKONGS // LOADER v1.0.0", bg="#060914", fg="#7788aa",
                 font=("Consolas", 11, "bold"), anchor="w", padx=10).pack(side="left")
        self.status_label = tk.Label(title_bar, text="LOCAL RUNTIME", bg="#060914", fg=DIM,
                                     font=("Consolas", 9), anchor="e", padx=10)
        self.status_label.pack(side="right")

        header = tk.Frame(self.root, bg=PANEL, height=40)
        header.pack(fill="x", padx=6, pady=(6, 0))
        header.pack_propagate(False)
        self.ready_dot = tk.Label(header, text="\u25cf", bg=PANEL, fg=GREEN, font=("Consolas", 14))
        self.ready_dot.pack(side="left", padx=(8, 4))
        self.ready_text = tk.Label(header, text="READY", bg=PANEL, fg=GREEN, font=("Consolas", 11, "bold"))
        self.ready_text.pack(side="left")
        tk.Label(header, text=" All checks operational.", bg=PANEL, fg=DIM, font=("Consolas", 10)).pack(side="left")
        self.target_label = tk.Label(header, text="TARGET: ...", bg=PANEL, fg=DIM, font=("Consolas", 9), anchor="e")
        self.target_label.pack(side="right", padx=10)

        body = tk.Frame(self.root, bg=BG)
        body.pack(fill="both", expand=True, padx=6, pady=6)

        left = tk.Frame(body, bg=PANEL, width=220, highlightbackground=BORDER, highlightthickness=1)
        left.pack(side="left", fill="y", padx=(0, 6))
        left.pack_propagate(False)

        tk.Label(left, text="\u2605 CONTROLS", bg=PANEL, fg="#8899bb", font=("Consolas", 11, "bold"),
                 anchor="w", padx=10).pack(fill="x", pady=(10, 5))

        btn_frame = tk.Frame(left, bg=PANEL)
        btn_frame.pack(fill="x", padx=10)

        self.btn_repair = tk.Button(btn_frame, text="REPAIR INSTALLATION", bg="#1a2040", fg=TXT,
                                     font=("Consolas", 9, "bold"), relief="flat", bd=0, padx=8, pady=6,
                                     command=self.repair_install)
        self.btn_repair.pack(fill="x", pady=2)

        self.btn_check = tk.Button(btn_frame, text="RUN SYSTEM CHECK", bg="#1a2040", fg=TXT,
                                    font=("Consolas", 9, "bold"), relief="flat", bd=0, padx=8, pady=6,
                                    command=self.system_check)
        self.btn_check.pack(fill="x", pady=2)

        self.btn_stop = tk.Button(btn_frame, text="STOP ACTIVE", bg="#3b1010", fg=RED,
                                   font=("Consolas", 9, "bold"), relief="flat", bd=0, padx=8, pady=6,
                                   command=self.stop_injection)
        self.btn_stop.pack(fill="x", pady=2)

        tk.Label(left, text="\u2605 INFO", bg=PANEL, fg="#8899bb", font=("Consolas", 11, "bold"),
                 anchor="w", padx=10).pack(fill="x", pady=(16, 5))

        info_items = [
            ("VERSION", "v1.0.0"),
            ("PLATFORM", "PC / Steam"),
            ("ENGINE", "Unity IL2CPP"),
            ("BRIDGE", "Frida"),
        ]
        info_frame = tk.Frame(left, bg=PANEL)
        info_frame.pack(fill="x", padx=10)
        for k, v in info_items:
            row = tk.Frame(info_frame, bg=PANEL)
            row.pack(fill="x", pady=1)
            tk.Label(row, text=k, bg=PANEL, fg=DIM, font=("Consolas", 8), anchor="w", width=12).pack(side="left")
            tk.Label(row, text=v, bg=PANEL, fg=TXT, font=("Consolas", 8, "bold"), anchor="w").pack(side="left")

        tk.Label(left, text="\u2605 DEPENDENCIES", bg=PANEL, fg="#8899bb", font=("Consolas", 11, "bold"),
                 anchor="w", padx=10).pack(fill="x", pady=(16, 5))

        self.dep_frame = tk.Frame(left, bg=PANEL)
        self.dep_frame.pack(fill="x", padx=10)
        self.dep_labels = {}
        for dep in ["python", "frida", "frida-tools"]:
            row = tk.Frame(self.dep_frame, bg=PANEL)
            row.pack(fill="x", pady=1)
            dot = tk.Label(row, text="\u25cf", bg=PANEL, fg=GREEN, font=("Consolas", 8))
            dot.pack(side="left", padx=(0, 4))
            lbl = tk.Label(row, text=dep, bg=PANEL, fg=TXT, font=("Consolas", 8), anchor="w")
            lbl.pack(side="left")
            self.dep_labels[dep] = dot

        tk.Label(left, text="\u2605 INJECTION FILES", bg=PANEL, fg="#8899bb", font=("Consolas", 11, "bold"),
                 anchor="w", padx=10).pack(fill="x", pady=(16, 5))

        self.files_frame = tk.Frame(left, bg=PANEL)
        self.files_frame.pack(fill="x", padx=10, pady=(0, 10))

        right = tk.Frame(body, bg=PANEL, highlightbackground=BORDER, highlightthickness=1)
        right.pack(side="left", fill="both", expand=True)

        tk.Label(right, text="\u2605 INJECTION TARGET", bg=PANEL, fg="#8899bb", font=("Consolas", 11, "bold"),
                 anchor="w", padx=14).pack(fill="x", pady=(10, 2))
        self.target_name = tk.Label(right, text="ANIMAL COMPANY", bg=PANEL, fg=TXT, font=("Consolas", 12, "bold"),
                                     anchor="w", padx=14)
        self.target_name.pack(fill="x")

        tk.Label(right, text="SELECT LAUNCH MODE", bg=PANEL, fg="#8899bb", font=("Consolas", 11, "bold"),
                 anchor="w", padx=14).pack(fill="x", pady=(16, 6))

        self.mode_buttons = []
        for name, cfg in MODES.items():
            f = tk.Frame(right, bg="#111830", highlightbackground=BORDER, highlightthickness=1, cursor="hand2")
            f.pack(fill="x", padx=14, pady=3)
            rb = tk.Radiobutton(f, variable=self.selected_mode, value=name, bg="#111830", fg=TXT,
                                 activebackground="#111830", activeforeground="#ffffff",
                                 selectcolor=BORDER, font=("Consolas", 11, "bold"),
                                 indicatoron=False, padx=12, pady=8, anchor="w",
                                 command=self.on_mode_select)
            rb.pack(fill="x")
            sub = tk.Label(f, text=cfg["desc"], bg="#111830", fg=DIM, font=("Consolas", 9), anchor="w", padx=28)
            sub.pack(fill="x", pady=(0, 6))
            self.mode_buttons.append((f, rb, sub))

        self.launch_btn = tk.Button(right, text="SELECT A LAUNCH MODE", bg="#1a2040", fg=DIM,
                                     font=("Consolas", 12, "bold"), relief="flat", bd=0, pady=12,
                                     command=self.start_injection)
        self.launch_btn.pack(fill="x", padx=14, pady=(16, 8))

        self.status_bar = tk.Label(right, text="Status: ready", bg=PANEL, fg=GREEN, font=("Consolas", 10),
                                    anchor="w", padx=14)
        self.status_bar.pack(fill="x")

        tk.Label(right, text="\u2605 SYSTEM EVENTS", bg=PANEL, fg="#8899bb", font=("Consolas", 11, "bold"),
                 anchor="w", padx=14).pack(fill="x", pady=(10, 4))

        log_frame = tk.Frame(right, bg="#080c18", highlightbackground=BORDER, highlightthickness=1)
        log_frame.pack(fill="both", expand=True, padx=14, pady=(0, 10))

        self.log_text = tk.Text(log_frame, bg="#080c18", fg=GREEN, font=("Consolas", 9),
                                 insertbackground=GREEN, relief="flat", bd=0, wrap="word",
                                 state="disabled", highlightthickness=0)
        scrollbar = tk.Scrollbar(log_frame, command=self.log_text.yview, bg="#080c18",
                                  troughcolor="#080c18", highlightthickness=0)
        self.log_text.configure(yscrollcommand=scrollbar.set)
        scrollbar.pack(side="right", fill="y")
        self.log_text.pack(fill="both", expand=True)

        self.log(f"[{datetime.now().strftime('%H:%M:%S')}] Launcher initialized.")
        self.log("Waiting for user action...")

    def log(self, msg):
        def _append():
            self.log_text.configure(state="normal")
            self.log_text.insert("end", msg + "\n")
            self.log_text.see("end")
            self.log_text.configure(state="disabled")
        self.root.after(0, _append)

    def set_status(self, text, color="#22c55e"):
        def _set():
            self.status_bar.config(text=f"Status: {text}", fg=color)
        self.root.after(0, _set)

    def set_ready(self, ready=True, text=""):
        def _set():
            if ready:
                self.ready_dot.config(fg="#22c55e")
                self.ready_text.config(text="READY", fg="#22c55e")
            else:
                self.ready_dot.config(fg="#eab308")
                self.ready_text.config(text=text or "BUSY", fg="#eab308")
        self.root.after(0, _set)

    def on_mode_select(self):
        mode = self.selected_mode.get()
        if mode:
            self.launch_btn.config(text=f"START {mode}", bg="#1a4080", fg="#ffffff")
            self.log(f"[{datetime.now().strftime('%H:%M:%S')}] Mode selected: {mode}")

    def check_process(self):
        try:
            result = subprocess.run(
                ["powershell", "-Command",
                 f"if (Get-Process -Name '{TARGET_PROCESS.replace('.exe','')}' -ErrorAction SilentlyContinue) {{ Write-Output 'FOUND' }} else {{ Write-Output 'NOTFOUND' }}"],
                capture_output=True, text=True, timeout=5
            )
            if "FOUND" in result.stdout:
                self.process_found = True
                self.target_label.config(text=f"TARGET: ANIMAL COMPANY", fg="#22c55e")
            else:
                self.process_found = False
                self.target_label.config(text="TARGET: NOT DETECTED", fg="#ef4444")
        except Exception:
            self.process_found = False
            self.target_label.config(text="TARGET: UNKNOWN", fg="#eab308")
        self.root.after(3000, self.check_process)

    def check_deps(self):
        self.log(f"[{datetime.now().strftime('%H:%M:%S')}] Checking dependencies...")
        for dep in ["python", "frida", "frida-tools"]:
            try:
                result = subprocess.run([sys.executable, "-m", "pip", "show", dep.replace("-","_")],
                                        capture_output=True, text=True, timeout=10)
                if result.returncode == 0:
                    self.dep_labels[dep].config(fg="#22c55e")
                    self.log(f"  [+] {dep}: installed")
                else:
                    self.dep_labels[dep].config(fg="#eab308")
                    self.log(f"  [-] {dep}: missing")
            except Exception:
                self.dep_labels[dep].config(fg="#ef4444")
                self.log(f"  [!] {dep}: check failed")

    def repair_install(self):
        self.log(f"[{datetime.now().strftime('%H:%M:%S')}] Repairing installation...")
        self.set_ready(False, "REPAIRING")
        self.set_status("installing dependencies...", "#eab308")

        def _repair():
            for dep in ["frida", "frida-tools"]:
                try:
                    subprocess.run([sys.executable, "-m", "pip", "install", dep, "--upgrade"],
                                   capture_output=True, timeout=120)
                    self.log(f"  [+] {dep} updated")
                except Exception as e:
                    self.log(f"  [!] {dep} failed: {e}")
            self.root.after(0, lambda: self.check_deps())
            self.root.after(0, lambda: self.set_ready(True))
            self.root.after(0, lambda: self.set_status("repair complete", "#22c55e"))
            self.log(f"[{datetime.now().strftime('%H:%M:%S')}] Repair complete.")

        threading.Thread(target=_repair, daemon=True).start()

    def system_check(self):
        self.log(f"[{datetime.now().strftime('%H:%M:%S')}] Running system check...")
        self.check_deps()
        if self.process_found:
            self.log(f"  [+] {TARGET_PROCESS} detected")
        else:
            self.log(f"  [-] {TARGET_PROCESS} not found - launch the game first")
        self.set_status("system check complete", "#22c55e")

    def update_files_list(self, files):
        for w in self.files_frame.winfo_children():
            w.destroy()
        for local, remote in files:
            row = tk.Frame(self.files_frame, bg=PANEL)
            row.pack(fill="x", pady=1)
            tk.Label(row, text="\u2022", bg=PANEL, fg="#556080", font=("Consolas", 8)).pack(side="left", padx=(0, 4))
            tk.Label(row, text=local, bg=PANEL, fg=TXT, font=("Consolas", 8), anchor="w").pack(side="left")
            status = tk.Label(row, text="pending", bg=PANEL, fg="#556080", font=("Consolas", 8), anchor="e")
            status.pack(side="right")
            setattr(row, "_status_lbl", status)

    def start_injection(self):
        mode_name = self.selected_mode.get()
        if not mode_name:
            messagebox.showinfo("Monkongs", "Select a launch mode first.")
            return
        if self.running:
            messagebox.showinfo("Monkongs", "Injection already in progress.")
            return

        mode = MODES[mode_name]
        self.update_files_list(mode["files"])
        self.running = True
        self.set_ready(False, "INJECTING")
        self.set_status("downloading scripts...", "#eab308")

        def _run():
            try:
                self._do_download(mode)
                self.root.after(0, lambda: self.set_status("waiting for M key...", "#eab308"))
                self.log(f"[{datetime.now().strftime('%H:%M:%S')}] Load into the game, then press M to inject...")
                self._wait_for_m()
                self.root.after(0, lambda: self.set_status("injecting...", "#eab308"))
                self._do_inject(mode)
                self.root.after(0, lambda: self.set_status("injection complete", "#22c55e"))
                self.root.after(0, lambda: self.set_ready(True))
                self.log(f"[{datetime.now().strftime('%H:%M:%S')}] Successfully sideloaded {mode_name}!")
            except Exception as e:
                self.log(f"[{datetime.now().strftime('%H:%M:%S')}] ERROR: {e}")
                self.root.after(0, lambda: self.set_status("injection failed", "#ef4444"))
                self.root.after(0, lambda: self.set_ready(True))
            finally:
                self.running = False
                self._cleanup()

        threading.Thread(target=_run, daemon=True).start()

    def _do_download(self, mode):
        if os.path.exists(SCRIPT_DIR):
            import shutil
            shutil.rmtree(SCRIPT_DIR, ignore_errors=True)
        os.makedirs(SCRIPT_DIR, exist_ok=True)
        cache_bust = str(random.randint(10000, 99999))
        for local, remote in mode["files"]:
            url = f"{BASE_URL}/{remote}?v={cache_bust}"
            dest = os.path.join(SCRIPT_DIR, local)
            self.log(f"[{datetime.now().strftime('%H:%M:%S')}] Downloading {local}...")
            try:
                req = urllib.request.Request(url)
                req.add_header("Cache-Control", "no-cache")
                data = urllib.request.urlopen(req, timeout=15).read().decode("utf-8")
                with open(dest, "w", encoding="utf-8") as f:
                    f.write(data)
                self.log(f"  [+] Downloaded: {local}")
            except Exception as e:
                self.log(f"  [!] Failed: {local} - {e}")

    def _wait_for_m(self):
        import ctypes
        user32 = ctypes.windll.user32
        VK_M = 0x4D
        while True:
            if user32.GetAsyncKeyState(VK_M) & 0x8000:
                break
            time.sleep(0.05)

    def _do_inject(self, mode):
        js_files = sorted(glob.glob(os.path.join(SCRIPT_DIR, "*.js")))
        if not js_files:
            self.log("  [!] No JS files to inject!")
            return
        args = ["frida", "-n", TARGET_PROCESS, "--runtime=v8"]
        for f in js_files:
            args.extend(["-l", f])
        self.log(f"[{datetime.now().strftime('%H:%M:%S')}] Running frida with {len(js_files)} scripts...")
        result = subprocess.run(args, capture_output=True, text=True, timeout=60)
        if result.stdout:
            for line in result.stdout.strip().split("\n")[-5:]:
                self.log(f"  {line}")
        if result.returncode != 0 and result.stderr:
            for line in result.stderr.strip().split("\n")[-3:]:
                self.log(f"  [err] {line}")

    def _cleanup(self):
        try:
            import shutil
            if os.path.exists(SCRIPT_DIR):
                shutil.rmtree(SCRIPT_DIR, ignore_errors=True)
        except Exception:
            pass

    def stop_injection(self):
        if self.running:
            self.log(f"[{datetime.now().strftime('%H:%M:%S')}] Stopping injection...")
            self.running = False
            try:
                subprocess.run(["taskkill", "/IM", "frida.exe", "/F"], capture_output=True, timeout=5)
            except Exception:
                pass
            self.set_status("stopped", "#ef4444")
            self.set_ready(True)
        else:
            self.log("Nothing to stop.")

    def run(self):
        self.root.mainloop()


if __name__ == "__main__":
    app = LoaderApp()
    app.run()
