import tkinter as tk
import tkinter.font as tkfont
import math
import threading
import subprocess
import os
import sys
import colorsys


class MonksMenuLauncher:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("MonksMenu Launcher")
        self.root.configure(bg="#0a0a0a")
        self.root.resizable(False, False)
        self.root.overrideredirect(True)

        self.WIDTH = 700
        self.HEIGHT = 460
        screen_w = self.root.winfo_screenwidth()
        screen_h = self.root.winfo_screenheight()
        x = (screen_w - self.WIDTH) // 2
        y = (screen_h - self.HEIGHT) // 2
        self.root.geometry(f"{self.WIDTH}x{self.HEIGHT}+{x}+{y}")

        self.mouse_x = self.WIDTH // 2
        self.mouse_y = self.HEIGHT // 2
        self.dragging = False
        self.drag_x = 0
        self.drag_y = 0
        self.time = 0

        self.canvas = tk.Canvas(
            self.root, width=self.WIDTH, height=self.HEIGHT,
            bg="#0a0a0a", highlightthickness=0
        )
        self.canvas.pack(fill="both", expand=True)

        self.line_count = 20
        self.lines = []
        for i in range(self.line_count):
            angle = (i / self.line_count) * math.pi * 2
            self.lines.append({
                "angle": angle,
                "length": 15 + (i % 3) * 8,
                "speed": 0.4 + (i % 4) * 0.2,
                "offset": i * 0.7,
            })

        self.canvas.bind("<Motion>", self.on_mouse_move)
        self.canvas.bind("<B1-Motion>", self.on_drag)
        self.canvas.bind("<ButtonPress-1>", self.on_press)
        self.canvas.bind("<Enter>", self.on_enter)

        self.title_ids = []
        self.build_ui()
        self.animate()
        self.root.mainloop()

    def on_press(self, event):
        widget = self.canvas.find_closest(event.x, event.y)
        tags = self.canvas.gettags(widget[0]) if widget else ()
        if "close" in tags:
            self.root.destroy()
            return
        if "button" in tags or "button_text" in tags:
            return
        self.dragging = True
        self.drag_x = event.x_root - self.root.winfo_x()
        self.drag_y = event.y_root - self.root.winfo_y()

    def on_drag(self, event):
        if self.dragging:
            nx = event.x_root - self.drag_x
            ny = event.y_root - self.drag_y
            self.root.geometry(f"+{nx}+{ny}")

    def on_enter(self, event):
        self.mouse_x = event.x
        self.mouse_y = event.y

    def on_mouse_move(self, event):
        self.mouse_x = event.x
        self.mouse_y = event.y

    def build_ui(self):
        cx = self.WIDTH // 2

        self.canvas.create_text(
            self.WIDTH - 30, 20, text="X",
            font=("Consolas", 14, "bold"),
            fill="#e94560", anchor="center", tags="close"
        )

        self.build_title()

        self.canvas.create_text(
            cx, 200, text="L A U N C H E R",
            font=("Consolas", 14), fill="#555555", anchor="center"
        )

        bw, bh = 240, 52
        bx1 = cx - bw // 2
        by1 = 300
        bx2 = cx + bw // 2
        by2 = by1 + bh

        self.glow_rects = []
        for i in range(2):
            off = (i + 1) * 3
            self.glow_rects.append(self.canvas.create_rectangle(
                bx1 - off, by1 - off, bx2 + off, by2 + off,
                outline="#1a1a2e", width=1, fill=""
            ))

        self.button_rect = self.canvas.create_rectangle(
            bx1, by1, bx2, by2,
            fill="#16213e", outline="#0f3460", width=2, tags="button"
        )
        self.button_text = self.canvas.create_text(
            cx, by1 + bh // 2, text="SIDELOAD",
            font=("Consolas", 18, "bold"),
            fill="#e94560", anchor="center", tags="button_text"
        )

        for tag in ("button", "button_text"):
            self.canvas.tag_bind(tag, "<Button-1>", self.on_sideload)
            self.canvas.tag_bind(tag, "<Enter>", self.on_button_hover)
            self.canvas.tag_bind(tag, "<Leave>", self.on_button_leave)

        self.status_text = self.canvas.create_text(
            cx, by2 + 30, text="",
            font=("Consolas", 9), fill="#666666", anchor="center"
        )

        self.canvas.create_text(
            cx, 420, text="Made by Monkong",
            font=("Consolas", 10), fill="#333333", anchor="center"
        )

    def build_title(self):
        title = "MONKSMENU"
        cx = self.WIDTH // 2
        f = tkfont.Font(family="Consolas", size=44, weight="bold")

        widths = []
        total = 0
        for ch in title:
            w = f.measure(ch)
            widths.append(w)
            total += w

        x = cx - total // 2
        for i, ch in enumerate(title):
            tid = self.canvas.create_text(
                x + widths[i] // 2, 140,
                text=ch, font=f, fill="#ffffff", anchor="center"
            )
            self.title_ids.append(tid)
            x += widths[i]

    def on_button_hover(self, event):
        self.canvas.itemconfig(self.button_rect, fill="#1a1a4e", outline="#e94560")
        self.canvas.itemconfig(self.button_text, fill="#ff6b6b")

    def on_button_leave(self, event):
        self.canvas.itemconfig(self.button_rect, fill="#16213e", outline="#0f3460")
        self.canvas.itemconfig(self.button_text, fill="#e94560")

    def set_status(self, text):
        self.root.after(0, lambda: self.canvas.itemconfig(self.status_text, text=text))

    def on_sideload(self, event=None):
        self.canvas.itemconfig(self.button_text, text="LOADING...")
        self.canvas.itemconfig(self.button_rect, fill="#0f3460")
        self.root.update()

        bat_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "StartBoot.bat")

        if not os.path.exists(bat_path):
            self.set_status("StartBoot.bat not found")
            self.root.after(2000, lambda: self.canvas.itemconfig(self.button_text, text="SIDELOAD"))
            self.root.after(2000, lambda: self.canvas.itemconfig(self.button_rect, fill="#16213e", outline="#0f3460"))
            return

        threading.Thread(target=self._run_sideload, args=(bat_path,), daemon=True).start()

    def _run_sideload(self, bat_path):
        try:
            subprocess.Popen(
                ["cmd", "/k", bat_path],
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
            self.set_status("Sideload menu opened")
        except Exception as e:
            self.set_status(f"Error: {e}")
        self.root.after(1500, lambda: self.canvas.itemconfig(self.button_text, text="SIDELOAD"))
        self.root.after(1500, lambda: self.canvas.itemconfig(self.button_rect, fill="#16213e", outline="#0f3460"))

    def rainbow(self, offset=0):
        h = ((self.time * 0.008) + offset) % 1.0
        r, g, b = colorsys.hsv_to_rgb(h, 1.0, 1.0)
        return f"#{int(r*255):02x}{int(g*255):02x}{int(b*255):02x}"

    def draw_background_lines(self):
        self.canvas.delete("bglines")
        cx = self.WIDTH // 2
        cy = self.HEIGHT // 2

        dx = self.mouse_x - cx
        dy = self.mouse_y - cy
        mouse_dist = math.sqrt(dx * dx + dy * dy)
        influence = min(mouse_dist / 300.0, 1.0)
        mouse_angle = math.atan2(dy, dx)

        batch = []
        for i, line in enumerate(self.lines):
            t = self.time * line["speed"] + line["offset"]
            angle = line["angle"] + t * 0.2 + mouse_angle * influence * 0.3

            bx = cx + math.cos(angle) * (60 + influence * 20)
            by = cy + math.sin(angle) * (60 + influence * 20)

            segs = 2 + int(influence * 2)
            seg_len = line["length"] / max(segs, 1)

            for s in range(segs):
                sa = angle + math.sin(t + s) * 0.2
                x1 = bx + math.cos(sa) * s * seg_len
                y1 = by + math.sin(sa) * s * seg_len
                x2 = bx + math.cos(sa) * (s + 1) * seg_len
                y2 = by + math.sin(sa) * (s + 1) * seg_len

                fade = 1.0 - (s / max(segs, 1)) * 0.6
                h = ((self.time * 0.006) + i * 0.08 + s * 0.15) % 1.0
                r, g, b = colorsys.hsv_to_rgb(h, 0.9, 0.5 * fade)
                color = f"#{int(r*255):02x}{int(g*255):02x}{int(b*255):02x}"
                batch.append((x1, y1, x2, y2, color))

        for x1, y1, x2, y2, color in batch:
            self.canvas.create_line(x1, y1, x2, y2, fill=color, width=1, tags="bglines")

    def draw_title_rainbow(self):
        title = "MONKSMENU"
        for i, ch in enumerate(title):
            color = self.rainbow(i * 0.12)
            offset_y = math.sin(self.time * 0.05 + i * 0.6) * 4
            bbox = self.canvas.bbox(self.title_ids[i])
            if bbox:
                tx = (bbox[0] + bbox[2]) / 2
                self.canvas.coords(self.title_ids[i], tx, 140 + offset_y)
            self.canvas.itemconfig(self.title_ids[i], fill=color)

    def draw_glow(self):
        for i, rect_id in enumerate(self.glow_rects):
            pulse = (math.sin(self.time * 0.04 + i) + 1) / 2
            v = int(pulse * 30 + 10)
            self.canvas.itemconfig(rect_id, outline=f"#1a1a{v:02x}")

    def animate(self):
        self.time += 1
        self.draw_background_lines()
        self.draw_title_rainbow()
        self.draw_glow()
        self.canvas.tag_raise("close")
        self.canvas.tag_raise("button")
        self.canvas.tag_raise("button_text")
        self.canvas.tag_raise(self.status_text)
        self.root.after(50, self.animate)


if __name__ == "__main__":
    MonksMenuLauncher()
