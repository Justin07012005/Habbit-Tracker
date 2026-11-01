"""Holt ausgewählte Icons aus pixelarticons (MIT) und schreibt js/icons-data.js.
Nur die path-d-Attribute werden übernommen und auf erlaubte Zeichen geprüft."""
import json, re, sys, urllib.request

VERSION = "1.8.1"
NAMES = """human-run human human-handsup zap sun moon bed drop coffee tea book-open edit notes chat users
heart device-phone wind music headphone home lightbulb briefcase coin gamepad trophy bullseye clock cake
mood-happy mood-neutral mood-sad checklist flag plus check close chevron-left chevron-right calendar chart-bar
sliders mail more-horizontal trash pause play download upload archive info-box reload hourglass trending-up
gift user arrow-left edit-box alert""".split()

SAFE = re.compile(r"^[MmHhVvZzLl0-9.\s,-]+$")
out = {}
for name in NAMES:
    url = f"https://cdn.jsdelivr.net/npm/pixelarticons@{VERSION}/svg/{name}.svg"
    svg = urllib.request.urlopen(url, timeout=20).read().decode()
    ds = re.findall(r'\sd="([^"]+)"', svg)
    if not ds or not all(SAFE.match(d) for d in ds):
        sys.exit(f"unerwarteter Inhalt in {name}")
    out[name] = " ".join(ds)

js = ("// Generiert von tools/fetch_icons.py – pixelarticons (MIT, Gerrit Halfmann)\n"
      "export const ICONS = " + json.dumps(out, indent=0) + ";\n")
open(sys.argv[1], "w").write(js)
print(len(out), "Icons")
