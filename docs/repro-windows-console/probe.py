import ctypes, json

kernel32 = ctypes.windll.kernel32
user32 = ctypes.windll.user32
hwnd = kernel32.GetConsoleWindow()
visible = bool(hwnd) and bool(user32.IsWindowVisible(hwnd))
print(json.dumps({"console_hwnd": int(hwnd or 0), "console_visible": visible}))
