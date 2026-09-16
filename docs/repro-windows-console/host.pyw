"""GUI 宿主复现:pythonw.exe 是 GUI 子系统进程,自身没有控制台。

它是 launchWindowsJob 里 Electron 那一侧(GUI,无控制台)的最小替身:

    宿主(GUI,无控制台) --spawn--> 子进程(控制台子系统程序)

子进程 probe.py 自报「自己有没有一个可见的控制台窗口」。
用 pythonw.exe host.pyw 运行,结果写到同目录 result.txt。
"""
import json
import pathlib
import subprocess
import sys

HERE = pathlib.Path(__file__).parent
PROBE = HERE / "probe.py"
LOG = HERE / "result.txt"
CREATE_NO_WINDOW = 0x08000000  # 隐藏控制台那一族进程创建标志里的一支(windowsHide 用的也是这一族)

rows = [f"host: {pathlib.Path(sys.executable).name} (GUI subsystem, no console)"]

cases = [
    ("spawn WITHOUT hide  (== launchWindowsJob before the patch)", 0),
    ("spawn WITH    hide  (== launchWindowsJob after  the patch)", CREATE_NO_WINDOW),
]
for label, flags in cases:
    proc = subprocess.run(
        [sys.executable.replace("pythonw.exe", "python.exe"), str(PROBE)],
        capture_output=True, text=True, creationflags=flags,
    )
    rows.append(f"{label}\n    -> {proc.stdout.strip() or proc.stderr.strip()}")

LOG.write_text("\n".join(rows) + "\n", encoding="utf-8")
print("\n".join(rows))
