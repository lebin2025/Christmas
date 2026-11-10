"""
Derive a real alpha channel for the four white-background music-box plates.

This is NOT image generation: no pixel is recoloured, cropped, resized or
synthesised. The visitor's original RGB product shots stay exactly as they
are; only the white studio backdrop is marked transparent.

Two passes, both based on d = 255 - min(R,G,B) (distance from white):

1. A soft luminance ramp, alpha = clamp((d - 22) / 20). Walnut (~d 180),
   champagne gold (~d 100) and ivory (~d 40) stay opaque.
2. A flood fill seeded from the four image borders removes every near-white
   region *connected to the outside* — the checkerboard backdrop, the pale
   tabletop reflection under the box, the grey halo. Highlights enclosed
   inside the object (a white tutu, a gold glint) are not connected, so they
   survive with their original colour.

Unlike a multiply blend this preserves the original colours and materials.

Run:  python scripts/derive_musicbox_alpha.py
"""
from collections import deque
from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public/assets/christmas/musicbox/source"
OUT = ROOT / "public/assets/christmas/musicbox"

# Both surviving plates are dark walnut/gold on a pale tabletop, so an
# aggressive threshold is safe: their subjects are far darker than the pale
# backdrop, and the flood fill removes everything connected to the outside.
# (The ballerina and winding-key cut-outs were removed — the open photograph
# already carries its own interior, so they are no longer derived here.)
PLATES = [
    ("Antique Christmas Music Box (Closed).png", "closed.webp", 72),
    ("Antique Christmas Music Box Lid.png", "lid.webp", 72),
]

LUT = [max(0, min(255, round((v - 22) * 255 / 20))) for v in range(256)]


def connected_background(distance: bytes, w: int, h: int, candidate: int) -> bytearray:
    """Mark near-white pixels reachable from the image border (value 2)."""
    state = bytearray(1 if v < candidate else 0 for v in distance)
    queue = deque()

    def seed(x: int, y: int) -> None:
        i = y * w + x
        if state[i] == 1:
            state[i] = 2
            queue.append((x, y))

    for x in range(w):
        seed(x, 0)
        seed(x, h - 1)
    for y in range(h):
        seed(0, y)
        seed(w - 1, y)

    while queue:
        x, y = queue.popleft()
        row = y * w
        if x > 0 and state[row + x - 1] == 1:
            state[row + x - 1] = 2
            queue.append((x - 1, y))
        if x + 1 < w and state[row + x + 1] == 1:
            state[row + x + 1] = 2
            queue.append((x + 1, y))
        if y > 0 and state[row - w + x] == 1:
            state[row - w + x] = 2
            queue.append((x, y - 1))
        if y + 1 < h and state[row + w + x] == 1:
            state[row + w + x] = 2
            queue.append((x, y + 1))
    return state


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for original, target, candidate in PLATES:
        image = Image.open(SRC / original).convert("RGB")
        w, h = image.size
        r, g, b = image.split()
        darkest = ImageChops.darker(ImageChops.darker(r, g), b)
        distance = ImageChops.invert(darkest).tobytes()
        base = bytearray(LUT[v] for v in distance)
        outside = connected_background(distance, w, h, candidate)
        for i, kind in enumerate(outside):
            if kind == 2:
                base[i] = 0
        alpha = Image.frombytes("L", (w, h), bytes(base))
        rgba = Image.merge("RGBA", (r, g, b, alpha))
        rgba.save(OUT / target, "WEBP", quality=92, method=6)
        hist = alpha.histogram()
        total = w * h
        print(
            f"{target:16s} {rgba.size} {rgba.mode}  "
            f"transparent={sum(hist[:40]) / total:.1%}  "
            f"opaque={sum(hist[200:]) / total:.1%}  "
            f"{(OUT / target).stat().st_size / 1024:.0f} KB"
        )


if __name__ == "__main__":
    main()
