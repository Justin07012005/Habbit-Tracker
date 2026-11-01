"""Erzeugt die App-Icons (PNG) aus einer 16x16-Pixelgrafik, ohne externe Pakete."""
import struct, sys, zlib, os

ART = [
    "................",
    "................",
    "..KKKKKKKKKKKK..",
    "..KTTTTTTTCKCK..",
    "..KKKKKKKKKKKKS.",
    "..KCCCCCCCCCCKS.",
    "..KCCCCCCCGGCKS.",
    "..KCCCCCCGGKCKS.",
    "..KCCCCCGGKCCKS.",
    "..KCGGCGGKCCCKS.",
    "..KCCGGGKCCCCKS.",
    "..KCCCGKCCCCCKS.",
    "..KCCCCCCCCCCKS.",
    "..KKKKKKKKKKKKS.",
    "...SSSSSSSSSSSS.",
    "................",
]
COL = {
    ".": (220, 230, 251), "K": (59, 40, 38), "C": (253, 241, 220), "T": (102, 184, 173),
    "G": (108, 198, 107), "S": (59, 40, 38),
}
GRID = (243, 247, 255)

def render(size, scale):
    cell = int(size * scale) // 16
    off = (size - 16 * cell) // 2
    rows = []
    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            ax, ay = (x - off) // cell, (y - off) // cell
            ch = ART[ay][ax] if 0 <= ax < 16 and 0 <= ay < 16 and x >= off and y >= off else "."
            if ch == ".":
                g = max(2, cell // 6)
                c = GRID if (x - off) % (cell * 2) < g or (y - off) % (cell * 2) < g else COL["."]
            else:
                c = COL[ch]
            row += bytes(c) + b"\xff"
        rows.append(bytes(row))
    raw = zlib.compress(b"".join(rows), 9)
    chunk = lambda t, d: struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)) + chunk(b"IDAT", raw) + chunk(b"IEND", b"")

out = sys.argv[1]
for name, size, scale in [("icon-192.png", 192, 1), ("icon-512.png", 512, 1), ("apple-touch-icon.png", 180, 1), ("icon-maskable-512.png", 512, 0.72)]:
    open(os.path.join(out, name), "wb").write(render(size, scale))
print("ok")
